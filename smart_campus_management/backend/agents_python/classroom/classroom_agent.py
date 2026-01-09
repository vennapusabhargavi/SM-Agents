# agents/classroom/classroom_agent.py
# Python refactor of agents/classroom/classroom.agent.js (behavior preserved)
#
# Assumes you have equivalents of:
#   config.db.get_pool()         -> returns a MySQL connection pool
#   core.utils.overlaps()        -> time overlap check
#   core.utils.safe_json_parse() -> JSON safe parse
#   core.notifier.notify_user(), core.notifier.notify_admins()
#   core.ai.ai_json(), core.ai.ai_text()
#
# IMPORTANT: Your original JS uses named SQL params like :id (mysql2 style).
# This file keeps the SAME SQL and implements a small adapter to run them
# on Python MySQL drivers that use %s placeholders.

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

from config.db import get_pool  # your pool getter (match your project)
from core.utils import overlaps, safe_json_parse
from core.notifier import notify_user, notify_admins
from core.ai import ai_json, ai_text


# -----------------------------
# Scoring: lower is better
# -----------------------------
def room_score(room: Dict[str, Any], req: Dict[str, Any]) -> int:
    waste = max(0, int(room.get("capacity") or 0) - int(req.get("strength") or 0))
    building_penalty = 50 if req.get("preferred_building") and room.get("building") != req.get("preferred_building") else 0
    return waste + building_penalty


# -----------------------------
# SQL named-params adapter (:id -> %s)
# -----------------------------
_named_param_re = re.compile(r":([A-Za-z_][A-Za-z0-9_]*)")

def _compile_named_sql(sql: str, params: Dict[str, Any]) -> Tuple[str, List[Any]]:
    """
    Convert:
      SELECT ... WHERE id=:id AND x=:x
    into:
      SELECT ... WHERE id=%s AND x=%s
    and return ordered args [params["id"], params["x"]]
    """
    keys: List[str] = _named_param_re.findall(sql)
    compiled = _named_param_re.sub("%s", sql)
    args = [params.get(k) for k in keys]
    return compiled, args


def _fetchone(pool, sql: str, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    q, args = _compile_named_sql(sql, params)
    conn = pool.get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(q, args)
        row = cur.fetchone()
        cur.close()
        return row
    finally:
        conn.close()


def _fetchall(pool, sql: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
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


def _execute(pool, sql: str, params: Dict[str, Any]) -> int:
    """
    Executes and returns lastrowid if available, else 0.
    """
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
# Helpers
# -----------------------------
async def get_request(pool, request_id: int) -> Optional[Dict[str, Any]]:
    return _fetchone(pool, "SELECT * FROM room_requests WHERE id=:id", {"id": int(request_id)})


async def get_room(pool, room_id: int) -> Optional[Dict[str, Any]]:
    return _fetchone(
        pool,
        "SELECT * FROM classrooms WHERE id=:id AND is_active=1",
        {"id": int(room_id)},
    )


def equipment_satisfies(room_equipment_json: Any, required_equipment_json: Any) -> bool:
    required = safe_json_parse(required_equipment_json, None)
    if not required or not isinstance(required, dict):
        return True

    have = safe_json_parse(room_equipment_json, {}) or {}
    for k in required.keys():
        if required.get(k) is True and have.get(k) is not True:
            return False
    return True


async def faculty_has_clash(pool, faculty_user_id: int, req_row: Dict[str, Any]) -> bool:
    rows = _fetchall(
        pool,
        """
        SELECT id FROM timetable_events
         WHERE owner_type='FACULTY'
           AND owner_user_id=:uid
           AND event_date=:d
           AND event_type IN ('CLASS','EXAM','PLACEMENT')
           AND (
              (start_time < :et AND end_time > :st)
           )
         LIMIT 1
        """,
        {
            "uid": int(faculty_user_id),
            "d": req_row["request_date"],
            "st": req_row["start_time"],
            "et": req_row["end_time"],
        },
    )
    return len(rows) > 0


async def find_best_room_for_request(req_row: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    pool = get_pool()

    rooms = _fetchall(
        pool,
        """
        SELECT * FROM classrooms
         WHERE is_active=1 AND status='OK' AND capacity >= :strength
        """,
        {"strength": int(req_row.get("strength") or 0)},
    )

    allocs = _fetchall(
        pool,
        """
        SELECT ra.*, c.building, c.room_number, c.capacity, c.equipment_json
          FROM room_allocations ra
          JOIN classrooms c ON c.id=ra.classroom_id
         WHERE ra.alloc_date=:d AND ra.status='ACTIVE'
        """,
        {"d": req_row["request_date"]},
    )

    available: List[Dict[str, Any]] = []
    for room in rooms:
        if not equipment_satisfies(room.get("equipment_json"), req_row.get("required_equipment_json")):
            continue

        # time clash for the SAME room
        clash = False
        for a in allocs:
            if int(a["classroom_id"]) != int(room["id"]):
                continue
            if overlaps(req_row["start_time"], req_row["end_time"], a["start_time"], a["end_time"]):
                clash = True
                break

        if not clash:
            available.append(room)

    if not available:
        return None

    available.sort(key=lambda r: room_score(r, req_row))
    return available[0]


def _to_minutes(hms: str) -> int:
    parts = str(hms).strip().split(":")
    if len(parts) < 2:
        return 0
    h = int(parts[0] or 0)
    m = int(parts[1] or 0)
    return h * 60 + m


def _fmt_hms(total_minutes: int) -> str:
    hh = total_minutes // 60
    mm = total_minutes % 60
    return f"{hh:02d}:{mm:02d}:00"


async def build_time_suggestions(req_row: Dict[str, Any], limit: int = 3) -> List[Dict[str, Any]]:
    pool = get_pool()

    rooms = _fetchall(
        pool,
        """
        SELECT * FROM classrooms
         WHERE is_active=1 AND status='OK' AND capacity >= :strength
        """,
        {"strength": int(req_row.get("strength") or 0)},
    )

    allocs = _fetchall(
        pool,
        """
        SELECT ra.*, c.equipment_json
          FROM room_allocations ra
          JOIN classrooms c ON c.id=ra.classroom_id
         WHERE ra.alloc_date=:d AND ra.status='ACTIVE'
        """,
        {"d": req_row["request_date"]},
    )

    dur = _to_minutes(req_row["end_time"]) - _to_minutes(req_row["start_time"])
    if dur <= 0:
        dur = 60  # preserve "best-effort" behavior if input is odd

    suggestions: List[Dict[str, Any]] = []
    start_hour = 8
    end_hour = 18

    for hh in range(start_hour, end_hour + 1):
        st = f"{hh:02d}:00:00"
        end_mins = hh * 60 + dur
        if end_mins > end_hour * 60 + 59:
            continue

        et = _fmt_hms(end_mins)

        for room in rooms:
            if not equipment_satisfies(room.get("equipment_json"), req_row.get("required_equipment_json")):
                continue

            clash = False
            for a in allocs:
                if int(a["classroom_id"]) != int(room["id"]):
                    continue
                if overlaps(st, et, a["start_time"], a["end_time"]):
                    clash = True
                    break

            if not clash:
                suggestions.append(
                    {
                        "classroom_id": int(room["id"]),
                        "building": room.get("building"),
                        "room_number": room.get("room_number"),
                        "start_time": st,
                        "end_time": et,
                        "notes": (
                            "Different building available"
                            if req_row.get("preferred_building") and room.get("building") != req_row.get("preferred_building")
                            else "Available slot"
                        ),
                    }
                )
                if len(suggestions) >= limit:
                    return suggestions

    return suggestions


async def ai_conflict_advisor(req_row: Dict[str, Any], base_suggestions: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    instructions = (
        "You are a university room allocation operations advisor. "
        "Given a room request that cannot be allocated, propose practical next actions. "
        "Return STRICT JSON only with keys: conflict_summary (string), admin_next_steps (array of strings), improved_suggestions (array). "
        "improved_suggestions items: {start_time,end_time,preferred_building,notes}. Keep short and realistic."
    )

    payload = {
        "request": {
            "request_type": req_row.get("request_type"),
            "title": req_row.get("title"),
            "request_date": req_row.get("request_date"),
            "start_time": req_row.get("start_time"),
            "end_time": req_row.get("end_time"),
            "strength": req_row.get("strength"),
            "preferred_building": req_row.get("preferred_building") or None,
            "required_equipment": safe_json_parse(req_row.get("required_equipment_json"), None),
        },
        "base_suggestions_from_system": base_suggestions or [],
    }

    result = await ai_json(instructions=instructions, input=json.dumps(payload, indent=2), max_output_tokens=450)
    if not isinstance(result, dict):
        return None

    conflict_summary = str(result.get("conflict_summary") or "")[:240]
    admin_next_steps = result.get("admin_next_steps")
    improved_suggestions = result.get("improved_suggestions")

    return {
        "conflict_summary": conflict_summary,
        "admin_next_steps": (
            [str(x) for x in admin_next_steps[:6]] if isinstance(admin_next_steps, list) else []
        ),
        "improved_suggestions": (
            improved_suggestions[:6] if isinstance(improved_suggestions, list) else []
        ),
    }


async def upsert_timetable_for_request(pool, req_row: Dict[str, Any], chosen_room: Optional[Dict[str, Any]], event_type: str):
    # Preserved behavior from JS (including ON DUPLICATE KEY UPDATE usage)
    d = req_row["request_date"]
    st = req_row["start_time"]
    et = req_row["end_time"]

    if req_row.get("request_type") == "CLASS":
        _execute(
            pool,
            """
            INSERT INTO timetable_events
              (owner_type, owner_user_id, event_type, title, event_date, start_time, end_time, classroom_id, metadata_json)
            VALUES
              ('FACULTY', :uid, 'CLASS', :title, :d, :st, :et, :cid, :meta)
            ON DUPLICATE KEY UPDATE
              title=VALUES(title),
              start_time=VALUES(start_time),
              end_time=VALUES(end_time),
              classroom_id=VALUES(classroom_id),
              metadata_json=VALUES(metadata_json)
            """,
            {
                "uid": int(req_row["requester_user_id"]),
                "title": req_row["title"],
                "d": d,
                "st": st,
                "et": et,
                "cid": int(chosen_room["id"]) if chosen_room else None,
                "meta": json.dumps({"request_id": int(req_row["id"])}),
            },
        )
        # Student timetables intentionally not populated (same as JS comments)


async def clear_open_conflicts(pool, request_id: int):
    _execute(
        pool,
        "DELETE FROM allocation_conflicts WHERE request_id=:rid AND resolved_at IS NULL",
        {"rid": int(request_id)},
    )


# -----------------------------
# Main: allocate_request
# -----------------------------
async def allocate_request(request_id: int, actor_user_id: Optional[int] = None, override_room_id: Optional[int] = None) -> Dict[str, Any]:
    pool = get_pool()

    req_row = await get_request(pool, request_id)
    if not req_row:
        return {"ok": False, "error": "Request not found"}

    if req_row.get("status") == "CANCELLED":
        return {"ok": True, "skipped": True, "reason": "cancelled"}

    if req_row.get("status") == "ALLOCATED" and not override_room_id:
        return {"ok": True, "skipped": True, "reason": "already_allocated"}

    # Prevent timetable clash for faculty on CLASS requests (document requirement)
    if req_row.get("request_type") == "CLASS":
        clash = await faculty_has_clash(pool, int(req_row["requester_user_id"]), req_row)
        if clash and not override_room_id:
            await clear_open_conflicts(pool, request_id)

            merged_suggestions = {
                "base": await build_time_suggestions(req_row, 3),
                "ai": None,
            }

            _execute(
                pool,
                """
                INSERT INTO allocation_conflicts (request_id, conflict_reason, suggestions_json)
                VALUES (:rid, :reason, :sug)
                """,
                {
                    "rid": int(request_id),
                    "reason": "Faculty timetable clash for requested time",
                    "sug": json.dumps(merged_suggestions),
                },
            )

            await notify_user(
                int(req_row["requester_user_id"]),
                "Room Allocation Conflict",
                f"You already have a timetable entry at {req_row['request_date']} {req_row['start_time']}-{req_row['end_time']}. Please pick another slot.",
                priority="HIGH",
                related_type="room_request",
                related_id=int(request_id),
            )

            await notify_admins(
                "Room Allocation Conflict",
                f"Request #{request_id} blocked due to faculty timetable clash: {req_row['title']}",
                priority="HIGH",
                related_type="room_request",
                related_id=int(request_id),
            )

            return {"ok": False, "conflict": True, "reason": "FACULTY_CLASH", "suggestions": merged_suggestions}

    chosen_room = await get_room(pool, int(override_room_id)) if override_room_id else await find_best_room_for_request(req_row)

    # No room available => conflict flow
    if not chosen_room:
        await clear_open_conflicts(pool, request_id)

        base_suggestions = await build_time_suggestions(req_row, 3)
        ai_advice = await ai_conflict_advisor(req_row, base_suggestions)

        merged_suggestions = {"base": base_suggestions or [], "ai": ai_advice or None}

        _execute(
            pool,
            """
            INSERT INTO allocation_conflicts (request_id, conflict_reason, suggestions_json)
            VALUES (:rid, :reason, :sug)
            """,
            {
                "rid": int(request_id),
                "reason": "No available room for requested time/constraints",
                "sug": json.dumps(merged_suggestions),
            },
        )

        decision_reason = (
            f"Awaiting admin action: {ai_advice['conflict_summary']}"
            if ai_advice and ai_advice.get("conflict_summary")
            else "Awaiting admin action: no room available"
        )

        _execute(
            pool,
            """
            UPDATE room_requests
               SET status='PENDING', decision_reason=:reason
             WHERE id=:id
            """,
            {"id": int(request_id), "reason": decision_reason[:255]},
        )

        await notify_user(
            int(req_row["requester_user_id"]),
            "Room Allocation Conflict",
            f"No room available for {req_row['title']} on {req_row['request_date']} {req_row['start_time']}-{req_row['end_time']}. Suggestions stored.",
            priority="HIGH",
            related_type="room_request",
            related_id=int(request_id),
        )

        if ai_advice and ai_advice.get("admin_next_steps"):
            admin_msg = (
                f"Conflict for request #{request_id}: {req_row['title']}. Next steps: "
                + " | ".join(ai_advice["admin_next_steps"])
            )
        else:
            admin_msg = f"Conflict for request #{request_id}: {req_row['title']}. No room available; suggestions stored."

        await notify_admins(
            "Room Allocation Conflict",
            admin_msg,
            priority="HIGH",
            related_type="room_request",
            related_id=int(request_id),
        )

        return {"ok": False, "conflict": True, "suggestions": merged_suggestions}

    # Allocate
    allocated_by = "MANUAL" if override_room_id else "AGENT"

    old = _fetchall(
        pool,
        "SELECT * FROM room_allocations WHERE request_id=:rid AND status='ACTIVE'",
        {"rid": int(request_id)},
    )

    if old:
        _execute(pool, "UPDATE room_allocations SET status='REPLACED' WHERE id=:id", {"id": int(old[0]["id"])})
        _execute(
            pool,
            """
            INSERT INTO allocation_history (allocation_id, action, actor_user_id, notes)
            VALUES (:aid,'REASSIGNED',:actor,:notes)
            """,
            {
                "aid": int(old[0]["id"]),
                "actor": int(actor_user_id) if actor_user_id is not None else None,
                "notes": "Reassigned to new room",
            },
        )

    alloc_id = _execute(
        pool,
        """
        INSERT INTO room_allocations
          (request_id, classroom_id, alloc_date, start_time, end_time, allocated_by)
        VALUES
          (:rid, :cid, :d, :st, :et, :by)
        """,
        {
            "rid": int(request_id),
            "cid": int(chosen_room["id"]),
            "d": req_row["request_date"],
            "st": req_row["start_time"],
            "et": req_row["end_time"],
            "by": allocated_by,
        },
    )

    _execute(
        pool,
        """
        INSERT INTO allocation_history (allocation_id, action, actor_user_id, notes)
        VALUES (:aid,'CREATED',:actor,:notes)
        """,
        {
            "aid": int(alloc_id),
            "actor": int(actor_user_id) if actor_user_id is not None else None,
            "notes": "Manual override allocation" if override_room_id else "Auto allocation by agent",
        },
    )

    # Optional AI decision explanation (only when AI is enabled)
    decision_reason = "Allocated by Admin override" if override_room_id else "Allocated by Classroom Agent"

    if not override_room_id:
        txt = await ai_text(
            instructions="Write a short operational explanation (<= 160 chars) for why the chosen room is suitable based on capacity/building/equipment. No emojis.",
            input=json.dumps(
                {
                    "request": {
                        "title": req_row.get("title"),
                        "strength": req_row.get("strength"),
                        "preferred_building": req_row.get("preferred_building") or None,
                        "required_equipment": safe_json_parse(req_row.get("required_equipment_json"), None),
                    },
                    "chosen_room": {
                        "building": chosen_room.get("building"),
                        "room_number": chosen_room.get("room_number"),
                        "capacity": chosen_room.get("capacity"),
                        "equipment": safe_json_parse(chosen_room.get("equipment_json"), None),
                    },
                },
                indent=2,
            ),
            max_output_tokens=120,
        )
        if txt:
            decision_reason = str(txt)[:255]

    _execute(
        pool,
        "UPDATE room_requests SET status='ALLOCATED', decision_reason=:reason WHERE id=:id",
        {"id": int(request_id), "reason": decision_reason},
    )

    # Timetable updates (document requirement)
    await upsert_timetable_for_request(
        pool,
        {**req_row, "id": int(request_id)},
        chosen_room,
        event_type=req_row.get("request_type"),
    )

    # Notify requester
    await notify_user(
        int(req_row["requester_user_id"]),
        "Room Allocated",
        f"{req_row['title']}: {chosen_room['building']} {chosen_room['room_number']} on {req_row['request_date']} {req_row['start_time']}-{req_row['end_time']}",
        related_type="room_request",
        related_id=int(request_id),
    )

    return {"ok": True, "allocation_id": int(alloc_id), "classroom_id": int(chosen_room["id"])}


__all__ = ["allocate_request"]
