# agents/placement/placement_agent.py


from __future__ import annotations

import json
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from config.db import get_pool
from core.event_bus import publish_event
from core.notifier import notify_user, notify_admins
from core.ai import ai_text


# --------------------------------------
# SQL named-params adapter (:id -> %s)
# --------------------------------------
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


# --------------------------------------
# Helpers
# --------------------------------------
def safe_parse_json(v: Any, fallback: Any = None):
    try:
        if v is None:
            return fallback
        if isinstance(v, str):
            return json.loads(v)
        if isinstance(v, (dict, list)):
            return v
        return fallback
    except Exception:
        return fallback


async def ai_ineligible_feedback(*, reasons: List[str], company_name: str) -> Optional[str]:
    instructions = (
        "Write a short, supportive placement feedback message for a student (<= 200 chars). "
        "Explain they are currently ineligible and give 1-2 actionable steps. No emojis."
    )
    input_text = json.dumps({"company": company_name, "reasons": reasons}, indent=2)
    return await ai_text(instructions=instructions, input=input_text, max_output_tokens=140)


async def ai_drive_admin_summary(summary: Dict[str, Any]) -> Optional[str]:
    instructions = (
        "You are a placement operations manager. Write a concise admin summary (<= 350 chars) and 3 next steps. No emojis."
    )
    input_text = json.dumps(summary, indent=2)
    return await ai_text(instructions=instructions, input=input_text, max_output_tokens=220)


def build_ineligible_reasons(
    *,
    cgpa: Any,
    arrears: Any,
    fee_clear: bool,
    criteria: Dict[str, Any],
    program_ok: bool,
    sem_ok: bool,
) -> List[str]:
    reasons: List[str] = []
    if not program_ok:
        reasons.append("PROGRAM_NOT_ALLOWED")
    if not sem_ok:
        reasons.append("SEMESTER_NOT_ALLOWED")
    if float(cgpa or 0) < float(criteria.get("min_cgpa", 0) or 0):
        reasons.append("CGPA_BELOW_MIN")
    if int(arrears or 0) > int(criteria.get("max_arrears", 999) or 999):
        reasons.append("ARREARS_EXCEED_LIMIT")
    if int(criteria.get("require_fee_clearance", 0) or 0) == 1 and not fee_clear:
        reasons.append("FEE_NOT_CLEARED")
    return reasons


# --------------------------------------
# Interview slot + room_request orchestration
# --------------------------------------
def _to_min(t: str) -> int:
    # expects "HH:MM:SS" or "HH:MM"
    parts = str(t).split(":")
    h = int(parts[0] or 0)
    m = int(parts[1] or 0) if len(parts) > 1 else 0
    return h * 60 + m

def _from_min(mins: int) -> str:
    h = mins // 60
    m = mins % 60
    return f"{h:02d}:{m:02d}:00"


async def ensure_interview_slots_and_room_requests(
    pool,
    *,
    drive: Dict[str, Any],
    requester_user_id: int,
) -> List[Dict[str, Any]]:
    existing_slots = _fetchall(
        pool,
        "SELECT * FROM interview_slots WHERE drive_id=:did ORDER BY slot_date, start_time",
        {"did": int(drive["id"])},
    )
    if existing_slots:
        return existing_slots

    stage_allows = drive.get("stage") in ("ANNOUNCED", "APPLICATIONS", "SHORTLISTED", "INTERVIEWS")
    if not stage_allows:
        return []

    start = str(drive["start_time"])  # "HH:MM:SS"
    end = str(drive["end_time"])

    s_min = _to_min(start)
    e_min = _to_min(end)

    SLOT = 60
    for cur in range(s_min, e_min, SLOT):
        if cur + SLOT > e_min:
            break

        st = _from_min(cur)
        et = _from_min(cur + SLOT)

        slot_id = _execute(
            pool,
            """
            INSERT INTO interview_slots (drive_id, slot_date, start_time, end_time, capacity)
            VALUES (:did, :d, :st, :et, 20)
            """,
            {"did": int(drive["id"]), "d": drive["drive_date"], "st": st, "et": et},
        )

        req_id = _execute(
            pool,
            """
            INSERT INTO room_requests
              (requester_user_id, request_type, title, request_date, start_time, end_time, strength, status)
            VALUES
              (:uid,'INTERVIEW', :t, :d, :st, :et, :strength, 'PENDING')
            """,
            {
                "uid": int(requester_user_id or 1),
                "t": f"Interview Slot: {drive.get('company_name')} - {drive.get('drive_title')}",
                "d": drive["drive_date"],
                "st": st,
                "et": et,
                "strength": 20,
            },
        )

        _execute(
            pool,
            "UPDATE interview_slots SET room_request_id=:rr WHERE id=:sid",
            {"rr": int(req_id), "sid": int(slot_id)},
        )

        await publish_event(
            "CLASSROOM.ALLOCATE",
            {"request_id": int(req_id), "interview_slot_id": int(slot_id)},
        )

    return _fetchall(
        pool,
        "SELECT * FROM interview_slots WHERE drive_id=:did ORDER BY slot_date, start_time",
        {"did": int(drive["id"])},
    )


async def assign_students_to_slots(
    pool,
    *,
    drive_id: int,
    drive: Dict[str, Any],
    shortlisted_student_ids: List[int],
) -> Dict[str, Any]:
    if not shortlisted_student_ids:
        return {"assigned": 0, "skipped_existing": 0, "no_slots": False}

    slots = _fetchall(
        pool,
        "SELECT * FROM interview_slots WHERE drive_id=:did ORDER BY slot_date, start_time",
        {"did": int(drive_id)},
    )
    if not slots:
        return {"assigned": 0, "skipped_existing": 0, "no_slots": True}

    fills = _fetchall(
        pool,
        """
        SELECT slot_id, COUNT(*) AS cnt
          FROM interview_slot_assignments
         WHERE slot_id IN (SELECT id FROM interview_slots WHERE drive_id=:did)
         GROUP BY slot_id
        """,
        {"did": int(drive_id)},
    )
    fill_map: Dict[int, int] = {int(r["slot_id"]): int(r["cnt"]) for r in fills}

    slot_idx = 0
    assigned = 0
    skipped_existing = 0

    for sid in shortlisted_student_ids:
        already = _fetchall(
            pool,
            """
            SELECT a.id
              FROM interview_slot_assignments a
              JOIN interview_slots s ON s.id=a.slot_id
             WHERE s.drive_id=:did AND a.student_user_id=:sid
             LIMIT 1
            """,
            {"did": int(drive_id), "sid": int(sid)},
        )
        if already:
            skipped_existing += 1
            continue

        placed = False
        for _ in range(len(slots)):
            slot = slots[slot_idx]
            used = int(fill_map.get(int(slot["id"]), 0))
            cap = int(slot.get("capacity") or 0)

            slot_idx = (slot_idx + 1) % len(slots)

            if cap > 0 and used < cap:
                _execute(
                    pool,
                    """
                    INSERT INTO interview_slot_assignments (slot_id, student_user_id, status)
                    VALUES (:slot, :sid, 'ASSIGNED')
                    """,
                    {"slot": int(slot["id"]), "sid": int(sid)},
                )

                fill_map[int(slot["id"])] = used + 1
                assigned += 1
                placed = True

                room_text = (
                    "Room allocated. Check timetable."
                    if slot.get("room_allocation_id")
                    else "Room will be updated shortly."
                )

                await notify_user(
                    int(sid),
                    "Interview Slot Assigned",
                    f"{drive.get('company_name')} interview slot on {slot['slot_date']} "
                    f"{slot['start_time']}-{slot['end_time']}. {room_text}",
                    priority="NORMAL",
                    related_type="drive",
                    related_id=int(drive_id),
                )
                break

        if not placed:
            await notify_user(
                int(sid),
                "Interview Scheduling Pending",
                f"{drive.get('company_name')}: You are shortlisted, but interview slots are full. "
                "Admin will reschedule/add slots.",
                priority="HIGH",
                related_type="drive",
                related_id=int(drive_id),
            )

    return {"assigned": assigned, "skipped_existing": skipped_existing, "no_slots": False}


# --------------------------------------
# Main entry
# --------------------------------------
async def run_drive(drive_id: int, actor_user_id: int = 1) -> Dict[str, Any]:
    pool = get_pool()

    dr = _fetchall(
        pool,
        """
        SELECT d.*, c.name AS company_name
          FROM placement_drives d
          JOIN companies c ON c.id=d.company_id
         WHERE d.id=:id
        """,
        {"id": int(drive_id)},
    )
    if not dr:
        return {"ok": False, "error": "Drive not found"}
    drive = dr[0]

    criteria_rows = _fetchall(
        pool,
        "SELECT * FROM company_criteria WHERE company_id=:cid",
        {"cid": int(drive["company_id"])},
    )
    criteria = criteria_rows[0] if criteria_rows else {"min_cgpa": 0, "max_arrears": 999, "require_fee_clearance": 1}

    allowed_programs = safe_parse_json(criteria.get("allowed_programs_json"), None)
    allowed_semesters = safe_parse_json(criteria.get("allowed_semesters_json"), None)

    apps = _fetchall(
        pool,
        """
        SELECT da.id, da.student_user_id AS sid, s.cgpa, s.arrears_count, s.program, s.current_semester, s.year_of_study
          FROM drive_applications da
          JOIN students s ON s.user_id=da.student_user_id
         WHERE da.drive_id=:did AND da.status='APPLIED'
        """,
        {"did": int(drive_id)},
    )

    shortlisted = 0
    ineligible = 0
    shortlisted_ids: List[int] = []

    for a in apps:
        program_ok = (not isinstance(allowed_programs, list) or not allowed_programs) or (a["program"] in allowed_programs)
        sem_ok = (not isinstance(allowed_semesters, list) or not allowed_semesters) or (a["current_semester"] in allowed_semesters)

        # Fee clearance check
        fee_ok = True
        if int(criteria.get("require_fee_clearance", 0) or 0) == 1:
            fa = _fetchall(
                pool,
                """
                SELECT status FROM student_fee_accounts
                 WHERE student_user_id=:sid AND program=:p AND year_of_study=:y AND semester=:sem
                """,
                {
                    "sid": int(a["sid"]),
                    "p": a["program"],
                    "y": int(a["year_of_study"]),
                    "sem": int(a["current_semester"]),
                },
            )
            fee_ok = bool(fa) and fa[0].get("status") == "CLEAR"

        reasons = build_ineligible_reasons(
            cgpa=a.get("cgpa"),
            arrears=a.get("arrears_count"),
            fee_clear=fee_ok,
            criteria=criteria,
            program_ok=bool(program_ok),
            sem_ok=bool(sem_ok),
        )

        if reasons:
            _execute(pool, "UPDATE drive_applications SET status='INELIGIBLE' WHERE id=:id", {"id": int(a["id"])})
            ineligible += 1

            feedback = await ai_ineligible_feedback(reasons=reasons, company_name=str(drive.get("company_name")))
            await notify_user(
                int(a["sid"]),
                "Placement Application Update",
                feedback
                or f"You are currently ineligible for {drive.get('company_name')}. "
                   "Improve eligibility (fees/CGPA/arrears) and apply to suitable drives.",
                priority="NORMAL",
                related_type="drive",
                related_id=int(drive_id),
            )
            continue

        _execute(pool, "UPDATE drive_applications SET status='SHORTLISTED' WHERE id=:id", {"id": int(a["id"])})
        shortlisted += 1
        shortlisted_ids.append(int(a["sid"]))

        await notify_user(
            int(a["sid"]),
            "Placement Shortlisted",
            f"You are shortlisted for {drive.get('company_name')} - {drive.get('drive_title')}. "
            "Interview slot scheduling will follow.",
            priority="NORMAL",
            related_type="drive",
            related_id=int(drive_id),
        )

    # Stage advance
    if shortlisted > 0 and drive.get("stage") in ("ANNOUNCED", "APPLICATIONS"):
        _execute(pool, "UPDATE placement_drives SET stage='SHORTLISTED' WHERE id=:id", {"id": int(drive_id)})
        drive["stage"] = "SHORTLISTED"

    # Ensure slots + queue classroom allocations
    slots = await ensure_interview_slots_and_room_requests(
        pool,
        drive=drive,
        requester_user_id=int(actor_user_id or 1),
    )

    # Assign shortlisted students to slots (idempotent)
    assign_res = await assign_students_to_slots(
        pool,
        drive_id=int(drive_id),
        drive=drive,
        shortlisted_student_ids=shortlisted_ids,
    )

    # If slots exist and assignments are happening, stage becomes INTERVIEWS
    if slots and drive.get("stage") == "SHORTLISTED":
        _execute(pool, "UPDATE placement_drives SET stage='INTERVIEWS' WHERE id=:id", {"id": int(drive_id)})
        drive["stage"] = "INTERVIEWS"

    summary_obj = {
        "drive_id": int(drive_id),
        "company": drive.get("company_name"),
        "title": drive.get("drive_title"),
        "stage": drive.get("stage"),
        "total_processed_applied": len(apps),
        "shortlisted": shortlisted,
        "ineligible": ineligible,
        "interview_slots_total": len(slots),
        "assigned_to_slots": int(assign_res.get("assigned", 0)),
        "skipped_already_assigned": int(assign_res.get("skipped_existing", 0)),
    }

    admin_summary = await ai_drive_admin_summary(summary_obj)

    await notify_admins(
        "Placement Drive Run Complete",
        admin_summary
        or f"Drive #{drive_id} processed. Processed(applied): {len(apps)}, Shortlisted: {shortlisted}, "
           f"Ineligible: {ineligible}, Slots: {len(slots)}, Assigned: {assign_res.get('assigned', 0)}.",
        priority="NORMAL",
        related_type="drive",
        related_id=int(drive_id),
    )

    return {"ok": True, **summary_obj}


__all__ = ["run_drive"]
