# agents/exam/exam_agent.py

from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, List, Optional, Tuple

from config.db import get_pool
from core.event_bus import publish_event
from core.utils import overlaps
from core.notifier import notify_user, notify_admins
from core.ai import ai_text

MIN_ATTENDANCE = float(os.getenv("MIN_ATTENDANCE_PERCENT", "75"))


# -----------------------------
# SQL named-params adapter (:id -> %s)
# -----------------------------
_named_param_re = re.compile(r":([A-Za-z_][A-Za-z0-9_]*)")

def _compile_named_sql(sql: str, params: Dict[str, Any]) -> Tuple[str, List[Any]]:
    keys = _named_param_re.findall(sql)
    compiled = _named_param_re.sub("%s", sql)
    args = [params.get(k) for k in keys]
    return compiled, args

def _fetchall(pool, sql: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    params = params or {}
    q, args = _compile_named_sql(sql, params)
    conn = pool.get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(q, args)
        rows = cur.fetchall() or []
        cur.close()
        return rows
    finally:
        conn.close()

def _fetchone(pool, sql: str, params: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    rows = _fetchall(pool, sql, params)
    return rows[0] if rows else None

def _execute(pool, sql: str, params: Optional[Dict[str, Any]] = None) -> int:
    params = params or {}
    q, args = _compile_named_sql(sql, params)
    conn = pool.get_connection()
    try:
        cur = conn.cursor()
        cur.execute(q, args)
        last_id = int(getattr(cur, "lastrowid", 0) or 0)
        conn.commit()
        cur.close()
        return last_id
    finally:
        conn.close()


# -----------------------------
# Utilities (preserve JS behavior)
# -----------------------------
def safe_parse_json(v: Any, fallback: Any):
    try:
        if v is None:
            return fallback
        if isinstance(v, (dict, list)):
            return v
        return json.loads(v)
    except Exception:
        return fallback


async def ai_conflict_advisor(conflicts: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    instructions = (
        "You are an exam scheduler. Give compact fix suggestions for clashes. "
        "Return JSON with keys: actions[] where each action is {type, exam_subject_id, suggestion}."
    )
    input_text = json.dumps({"conflicts": conflicts}, indent=2)
    txt = await ai_text(instructions=instructions, input=input_text, max_output_tokens=300)
    try:
        return json.loads(txt) if txt else None
    except Exception:
        return None


# -----------------------------
# Core functions
# -----------------------------
async def compute_eligibility(exam_session_id: int) -> Dict[str, Any]:
    pool = get_pool()

    session = _fetchone(pool, "SELECT * FROM exam_sessions WHERE id=:id", {"id": int(exam_session_id)})
    if not session:
        return {"ok": False, "error": "Exam session not found"}

    students = _fetchall(
        pool,
        """
        SELECT u.id AS sid
          FROM users u
          JOIN students s ON s.user_id=u.id
         WHERE u.role='STUDENT' AND u.is_active=1
        """
    )

    eligible_count = 0

    for st in students:
        sid = int(st["sid"])

        enroll = _fetchall(
            pool,
            """
            SELECT ce.course_id
              FROM course_enrollments ce
             WHERE ce.student_user_id=:sid AND ce.term_year=:y AND ce.term_name=:n
            """,
            {"sid": sid, "y": session["term_year"], "n": session["term_name"]},
        )

        is_eligible = 1
        reasons: List[Dict[str, Any]] = []

        for e in enroll:
            att = _fetchall(
                pool,
                """
                SELECT attendance_percent FROM attendance_records
                 WHERE student_user_id=:sid AND course_id=:cid AND term_year=:y AND term_name=:n
                """,
                {"sid": sid, "cid": int(e["course_id"]), "y": session["term_year"], "n": session["term_name"]},
            )

            pct = float(att[0]["attendance_percent"]) if att else 0.0
            if pct < MIN_ATTENDANCE:
                is_eligible = 0
                reasons.append(
                    {"course_id": int(e["course_id"]), "reason": "LOW_ATTENDANCE", "attendance_percent": pct}
                )

        # Fee check (latest account if present)
        fee_acc = _fetchall(
            pool,
            """
            SELECT status FROM student_fee_accounts
             WHERE student_user_id=:sid
             ORDER BY updated_at DESC
             LIMIT 1
            """,
            {"sid": sid},
        )
        if fee_acc and fee_acc[0].get("status") != "CLEAR":
            is_eligible = 0
            reasons.append({"reason": "FEE_NOT_CLEARED"})

        _execute(
            pool,
            """
            INSERT INTO exam_eligibility (exam_session_id, student_user_id, is_eligible, reasons_json)
            VALUES (:sess, :uid, :elig, :r)
            ON DUPLICATE KEY UPDATE
              is_eligible=VALUES(is_eligible),
              reasons_json=VALUES(reasons_json),
              computed_at=NOW()
            """,
            {
                "sess": int(exam_session_id),
                "uid": sid,
                "elig": int(is_eligible),
                "r": json.dumps(reasons),
            },
        )

        if is_eligible:
            eligible_count += 1

    await notify_admins(
        "Exam Eligibility Computed",
        f"Eligibility computed for session #{exam_session_id}. Eligible students: {eligible_count}.",
        priority="NORMAL",
        related_type="exam_session",
        related_id=int(exam_session_id),
    )

    return {"ok": True, "eligible_students": eligible_count, "min_attendance": MIN_ATTENDANCE}


async def schedule_exams_no_clash(exam_session_id: int) -> Dict[str, Any]:
    pool = get_pool()

    session = _fetchone(pool, "SELECT * FROM exam_sessions WHERE id=:id", {"id": int(exam_session_id)})
    if not session:
        return {"ok": False, "error": "Exam session not found"}

    subjects = _fetchall(
        pool,
        """
        SELECT es.id AS exam_subject_id, es.course_id, c.program, c.semester, c.course_name
          FROM exam_subjects es
          JOIN courses c ON c.id=es.course_id
         WHERE es.exam_session_id=:sid
        """,
        {"sid": int(exam_session_id)},
    )

    # Build slots (2 slots/day) exactly like JS (09-12, 13:30-16:30)
    # JS uses Date(session.start_date) and Date(session.end_date) and iterates inclusive.
    # In DB this is YYYY-MM-DD; easiest: use Python date parsing.
    from datetime import datetime, timedelta

    start = datetime.fromisoformat(str(session["start_date"]))
    end = datetime.fromisoformat(str(session["end_date"]))

    slots: List[Dict[str, str]] = []
    d = start
    while d.date() <= end.date():
        yyyy = d.date().isoformat()
        slots.append({"date": yyyy, "st": "09:00:00", "et": "12:00:00"})
        slots.append({"date": yyyy, "st": "13:30:00", "et": "16:30:00"})
        d = d + timedelta(days=1)

    # Course -> enrolled students set (for this term)
    enroll_rows = _fetchall(
        pool,
        """
        SELECT ce.course_id, ce.student_user_id
          FROM course_enrollments ce
         WHERE ce.term_year=:y AND ce.term_name=:n
        """,
        {"y": session["term_year"], "n": session["term_name"]},
    )

    course_to_students: Dict[int, set] = {}
    for r in enroll_rows:
        cid = int(r["course_id"])
        if cid not in course_to_students:
            course_to_students[cid] = set()
        course_to_students[cid].add(int(r["student_user_id"]))

    # Slot occupancy: slotKey -> Set(studentIds)
    slot_students: Dict[str, set] = {}

    placed: List[Dict[str, Any]] = []
    conflicts: List[Dict[str, Any]] = []

    # Place "harder" subjects first (more students enrolled)
    subjects_sorted = sorted(
        list(subjects),
        key=lambda s: -(len(course_to_students.get(int(s["course_id"]), set()))),
    )

    for subj in subjects_sorted:
        enrolled = course_to_students.get(int(subj["course_id"]), set())
        placed_one = False

        for sl in slots:
            slot_key = f"{sl['date']}|{sl['st']}|{sl['et']}"
            already = slot_students.get(slot_key, set())

            # Clash if ANY enrolled student already has an exam in this slot
            has_clash = any((sid in already) for sid in enrolled)
            if has_clash:
                continue

            new_set = set(already)
            for sid in enrolled:
                new_set.add(sid)
            slot_students[slot_key] = new_set

            # Write schedule
            _execute(
                pool,
                """
                UPDATE exam_subjects
                   SET exam_date=:d, start_time=:st, end_time=:et, status='SCHEDULED'
                 WHERE id=:id
                """,
                {
                    "d": sl["date"],
                    "st": sl["st"],
                    "et": sl["et"],
                    "id": int(subj["exam_subject_id"]),
                },
            )

            placed.append(
                {
                    "exam_subject_id": int(subj["exam_subject_id"]),
                    "course_id": int(subj["course_id"]),
                    "course_name": subj.get("course_name"),
                    "date": sl["date"],
                    "st": sl["st"],
                    "et": sl["et"],
                }
            )

            placed_one = True
            break

        if not placed_one:
            conflicts.append(
                {
                    "exam_subject_id": int(subj["exam_subject_id"]),
                    "course_id": int(subj["course_id"]),
                    "program": subj.get("program"),
                    "semester": subj.get("semester"),
                    "reason": "NO_SLOT_AVAILABLE",
                }
            )

    if conflicts:
        advice = await ai_conflict_advisor(conflicts)

        await notify_admins(
            "Exam Scheduling Conflicts",
            f"Scheduling conflicts detected for session #{exam_session_id}. Count={len(conflicts)}.",
            priority="HIGH",
            related_type="exam_session",
            related_id=int(exam_session_id),
        )

        if advice:
            await notify_admins(
                "Exam Conflict Suggestions (AI)",
                json.dumps(advice)[:1800],
                priority="NORMAL",
                related_type="exam_session",
                related_id=int(exam_session_id),
            )

    return {"ok": True, "placed": len(placed), "conflicts": len(conflicts)}


async def allocate_exam_halls_via_classroom_agent(exam_session_id: int) -> Dict[str, Any]:
    pool = get_pool()

    subjects = _fetchall(
        pool,
        """
        SELECT es.id AS exam_subject_id, es.course_id, es.exam_date, es.start_time, es.end_time, c.course_name
          FROM exam_subjects es
          JOIN courses c ON c.id=es.course_id
         WHERE es.exam_session_id=:sid
           AND es.status IN ('SCHEDULED','RESCHEDULED')
           AND es.exam_date IS NOT NULL
        """,
        {"sid": int(exam_session_id)},
    )

    created = 0

    for s in subjects:
        title = f"Exam: {s.get('course_name')}"

        # Strength = number of enrolled students (simple estimate)
        cnt_rows = _fetchall(
            pool,
            """
            SELECT COUNT(*) AS cnt
              FROM course_enrollments ce
              JOIN exam_sessions ex ON ex.id=:sess
             WHERE ce.course_id=:cid AND ce.term_year=ex.term_year AND ce.term_name=ex.term_name
            """,
            {"sess": int(exam_session_id), "cid": int(s["course_id"])},
        )
        strength = int(cnt_rows[0]["cnt"]) if cnt_rows else 0

        rr_id = _execute(
            pool,
            """
            INSERT INTO room_requests
              (requester_user_id, request_type, title, request_date, start_time, end_time, strength, required_equipment_json, preferred_building, status)
            VALUES
              (:uid, 'EXAM', :t, :d, :st, :et, :strength, :eq, NULL, 'PENDING')
            """,
            {
                "uid": 1,  # system/admin placeholder (same as JS)
                "t": title,
                "d": s["exam_date"],
                "st": s["start_time"],
                "et": s["end_time"],
                "strength": strength,
                "eq": json.dumps({}),
            },
        )

        _execute(
            pool,
            """
            INSERT INTO exam_subject_rooms (exam_subject_id, room_request_id, room_allocation_id)
            VALUES (:esid, :rrid, NULL)
            ON DUPLICATE KEY UPDATE
              room_request_id=VALUES(room_request_id),
              room_allocation_id=NULL,
              updated_at=NOW()
            """,
            {"esid": int(s["exam_subject_id"]), "rrid": int(rr_id)},
        )

        # IMPORTANT: include exam_subject_id so worker can set room_allocation_id
        await publish_event(
            "CLASSROOM.ALLOCATE",
            {
                "request_id": int(rr_id),
                "exam_subject_id": int(s["exam_subject_id"]),
                "exam_session_id": int(exam_session_id),
            },
        )

        created += 1

    await notify_admins(
        "Exam Hall Allocation Queued",
        f"Queued {created} room requests for exam halls for session #{exam_session_id}.",
        priority="NORMAL",
        related_type="exam_session",
        related_id=int(exam_session_id),
    )

    return {"ok": True, "room_requests_created": created}


async def generate_hall_tickets(exam_session_id: int) -> Dict[str, Any]:
    pool = get_pool()

    session = _fetchone(pool, "SELECT * FROM exam_sessions WHERE id=:id", {"id": int(exam_session_id)})
    if not session:
        return {"ok": False, "error": "Exam session not found"}

    elig = _fetchall(
        pool,
        """
        SELECT student_user_id
          FROM exam_eligibility
         WHERE exam_session_id=:sid AND is_eligible=1
        """,
        {"sid": int(exam_session_id)},
    )

    subjects = _fetchall(
        pool,
        """
        SELECT
          es.id AS exam_subject_id,
          es.exam_date, es.start_time, es.end_time,
          ra.classroom_id
        FROM exam_subjects es
        LEFT JOIN exam_subject_rooms r ON r.exam_subject_id=es.id
        LEFT JOIN room_allocations ra ON ra.id=r.room_allocation_id AND ra.status='ACTIVE'
        WHERE es.exam_session_id=:sid
          AND es.status IN ('SCHEDULED','RESCHEDULED')
          AND es.exam_date IS NOT NULL
        ORDER BY es.exam_date, es.start_time, es.id
        """,
        {"sid": int(exam_session_id)},
    )

    tickets = 0

    for row in elig:
        student_id = int(row["student_user_id"])

        ticket_no = f"HT-{session['term_year']}-{session['term_name']}-{student_id}-{exam_session_id}"
        qr_payload = json.dumps({"ticket_no": ticket_no, "student_id": student_id, "exam_session_id": int(exam_session_id)})

        _execute(
            pool,
            """
            INSERT INTO hall_tickets (exam_session_id, student_user_id, ticket_no, qr_payload, status)
            VALUES (:sid, :uid, :tn, :qr, 'ACTIVE')
            ON DUPLICATE KEY UPDATE
              qr_payload=VALUES(qr_payload),
              status='UPDATED',
              issued_at=NOW()
            """,
            {"sid": int(exam_session_id), "uid": student_id, "tn": ticket_no, "qr": qr_payload},
        )

        t_row = _fetchone(
            pool,
            "SELECT id FROM hall_tickets WHERE exam_session_id=:sid AND student_user_id=:uid",
            {"sid": int(exam_session_id), "uid": student_id},
        )
        hall_ticket_id = int(t_row["id"])

        _execute(pool, "DELETE FROM hall_ticket_items WHERE hall_ticket_id=:id", {"id": hall_ticket_id})

        for i, sub in enumerate(subjects):
            seat_no = f"S-{i + 1}"
            _execute(
                pool,
                """
                INSERT INTO hall_ticket_items
                  (hall_ticket_id, exam_subject_id, exam_date, start_time, end_time, classroom_id, seat_no)
                VALUES (:ht, :sub, :d, :st, :et, :cid, :seat)
                """,
                {
                    "ht": hall_ticket_id,
                    "sub": int(sub["exam_subject_id"]),
                    "d": sub["exam_date"],
                    "st": sub["start_time"],
                    "et": sub["end_time"],
                    "cid": int(sub["classroom_id"]) if sub.get("classroom_id") is not None else None,
                    "seat": seat_no,
                },
            )

        msg = await ai_text(
            instructions="Write a short campus notice (<= 220 chars) that hall ticket is generated/updated and student should check exam dates/time/room. No emojis.",
            input=json.dumps({"term_name": session["term_name"], "term_year": session["term_year"], "ticket_no": ticket_no}),
            max_output_tokens=140,
        )

        await notify_user(
            student_id,
            "Hall Ticket Generated/Updated",
            msg or f"Your hall ticket is updated for {session['term_name']} {session['term_year']}. Please check dates/time/room.",
            priority="NORMAL",
            related_type="hall_ticket",
            related_id=hall_ticket_id,
        )

        tickets += 1

    await notify_admins(
        "Hall Tickets Generated",
        f"Hall tickets updated for session #{exam_session_id}. Tickets: {tickets}.",
        priority="NORMAL",
        related_type="exam_session",
        related_id=int(exam_session_id),
    )

    return {"ok": True, "tickets": tickets, "subjects": len(subjects)}


async def run_exam_session(exam_session_id: int) -> Dict[str, Any]:
    e1 = await compute_eligibility(exam_session_id)
    e2 = await schedule_exams_no_clash(exam_session_id)
    e3 = await allocate_exam_halls_via_classroom_agent(exam_session_id)

    # Create tickets now (rooms may be NULL until classroom allocations complete)
    e4 = await generate_hall_tickets(exam_session_id)

    return {"ok": True, "eligibility": e1, "schedule": e2, "hall_requests": e3, "hall_tickets": e4}


__all__ = [
    "run_exam_session",
    "generate_hall_tickets",
    "compute_eligibility",
    "schedule_exams_no_clash",
    "allocate_exam_halls_via_classroom_agent",
]
