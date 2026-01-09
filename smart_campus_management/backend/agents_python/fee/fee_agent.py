# agents/fee/fee_agent.py


from __future__ import annotations

import json
import os
import re
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from config.db import get_pool
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
# helpers
# --------------------------------------
def compute_status(pending: float, due_date_str: str) -> str:
    today = date.today()
    due = datetime.fromisoformat(f"{due_date_str}T00:00:00").date()
    if pending <= 0:
        return "CLEAR"
    if today > due:
        return "OVERDUE"
    return "PENDING"


async def ai_student_reminder(*, status: str, pending: float, due_date: str, diff_days: int) -> Optional[str]:
    prompt = (
        f"Write a short polite message (<180 chars) reminding student about fee {status.lower()}.\n"
        f"Mention ₹{pending:.2f} and "
        f"{'that it is overdue' if status == 'OVERDUE' else f'due on {due_date}'}. No emojis."
    )
    try:
        return await ai_text(instructions=prompt, input="", max_output_tokens=100)
    except Exception:
        return None


async def ai_admin_summary(stats: Dict[str, Any]) -> Optional[str]:
    prompt = (
        "You are finance admin. Summarize daily fee status: "
        f"{json.dumps(stats)}.\n"
        "Limit 400 chars. Include totals, overdue, failed payments, and key alerts."
    )
    try:
        return await ai_text(instructions=prompt, input="", max_output_tokens=200)
    except Exception:
        return None


# --------------------------------------
# main routine
# --------------------------------------
async def recalc_fee_accounts() -> Dict[str, Any]:
    pool = get_pool()
    reminder_days = int(os.getenv("FEE_REMINDER_DAYS", "7"))
    fine_rate = float(os.getenv("FEE_FINE_RATE", "50"))  # per day after due

    students = _fetchall(
        pool,
        """
        SELECT s.user_id, s.program, s.year_of_study, s.current_semester
          FROM students s
          JOIN users u ON u.id=s.user_id
         WHERE u.is_active=1
        """,
    )

    stats: Dict[str, Any] = {
        "processed": 0,
        "clear": 0,
        "pending": 0,
        "overdue": 0,
        "failed_payments": 0,
        "mismatches": 0,
        "new_issues": 0,
        "new_receipts": 0,
    }

    for s in students:
        sid = int(s["user_id"])

        # ---------- totals ----------
        total_row = _fetchone(
            pool,
            """
            SELECT SUM(amount) AS total FROM fee_structures
             WHERE program=:p AND year_of_study=:y AND semester=:sem AND is_active=1
            """,
            {"p": s["program"], "y": int(s["year_of_study"]), "sem": int(s["current_semester"])},
        )
        total = float(total_row["total"] or 0.0) if total_row else 0.0

        paid_row = _fetchone(
            pool,
            """
            SELECT SUM(amount) AS paid FROM payments
             WHERE student_user_id=:sid AND status='SUCCESS'
            """,
            {"sid": sid},
        )
        paid = float(paid_row["paid"] or 0.0) if paid_row else 0.0

        pending_amt = max(0.0, total - paid)

        # ---------- existing record ----------
        existing = _fetchall(
            pool,
            """
            SELECT * FROM student_fee_accounts
             WHERE student_user_id=:sid AND program=:p AND year_of_study=:y AND semester=:sem
            """,
            {"sid": sid, "p": s["program"], "y": int(s["year_of_study"]), "sem": int(s["current_semester"])},
        )

        fine = 0.0
        if not existing:
            due_date = (date.today() + timedelta(days=30)).isoformat()
        else:
            # mysql connector returns date/datetime; normalize to YYYY-MM-DD like JS
            raw_due = existing[0].get("due_date")
            if isinstance(raw_due, (datetime, date)):
                due_date = raw_due.date().isoformat() if isinstance(raw_due, datetime) else raw_due.isoformat()
            else:
                due_date = str(raw_due)[:10]
            fine = float(existing[0].get("fine_amount") or 0.0)

        # ---------- compute status + fines ----------
        status = compute_status(pending_amt, due_date)

        if status == "OVERDUE":
            due_dt = datetime.fromisoformat(f"{due_date}T00:00:00")
            days_late = max(1, int((datetime.now() - due_dt).total_seconds() // (60 * 60 * 24)))
            fine = float(days_late) * float(fine_rate)

        # ---------- upsert student_fee_accounts ----------
        _execute(
            pool,
            """
            INSERT INTO student_fee_accounts
              (student_user_id, program, year_of_study, semester,
               total_amount, paid_amount, pending_amount, fine_amount, due_date, status)
            VALUES (:sid,:p,:y,:sem,:t,:paid,:pend,:fine,:due,:st)
            ON DUPLICATE KEY UPDATE
              total_amount=VALUES(total_amount),
              paid_amount=VALUES(paid_amount),
              pending_amount=VALUES(pending_amount),
              fine_amount=VALUES(fine_amount),
              due_date=VALUES(due_date),
              status=VALUES(status)
            """,
            {
                "sid": sid,
                "p": s["program"],
                "y": int(s["year_of_study"]),
                "sem": int(s["current_semester"]),
                "t": total,
                "paid": paid,
                "pend": pending_amt,
                "fine": fine,
                "due": due_date,
                "st": status,
            },
        )

        stats["processed"] += 1
        if status == "CLEAR":
            stats["clear"] += 1
        elif status == "PENDING":
            stats["pending"] += 1
        elif status == "OVERDUE":
            stats["overdue"] += 1

        # ---------- reminders ----------
        today = datetime.now()
        due = datetime.fromisoformat(f"{due_date}T00:00:00")
        diff_days = int((due - today).total_seconds() // (60 * 60 * 24))
        # JS used Math.ceil((due - today)/day) where due at midnight; to preserve:
        # compute ceil using integer trick
        diff_days = int((due - today + timedelta(days=1) - timedelta(microseconds=1)).total_seconds() // (60 * 60 * 24))

        if status == "OVERDUE" or (status == "PENDING" and diff_days <= reminder_days):
            msg = await ai_student_reminder(status=status, pending=pending_amt, due_date=due_date, diff_days=diff_days)
            if not msg:
                msg = (
                    f"Your fee is overdue. Pending ₹{pending_amt:.2f}. Please pay now."
                    if status == "OVERDUE"
                    else f"Fee due in {diff_days} day(s). Pending ₹{pending_amt:.2f}."
                )

            await notify_user(
                sid,
                "Fee Overdue" if status == "OVERDUE" else "Fee Due Reminder",
                msg,
                priority="HIGH" if status == "OVERDUE" else "NORMAL",
                related_type="fee_account",
                related_id=sid,
            )

    # ---------- detect failed / mismatched payments ----------
    failed = _fetchall(pool, "SELECT * FROM payments WHERE status='FAILED'")
    for f in failed:
        chk = _fetchall(
            pool,
            "SELECT id FROM payment_issues WHERE payment_id=:pid AND issue_type='FAILED'",
            {"pid": int(f["id"])},
        )
        if not chk:
            _execute(
                pool,
                """
                INSERT INTO payment_issues (payment_id, issue_type, details)
                VALUES (:pid,'FAILED','Gateway failure or rejection')
                """,
                {"pid": int(f["id"])},
            )

            amt = float(f.get("amount") or 0.0)
            await notify_user(
                int(f["student_user_id"]),
                "Payment Failed",
                f"Your payment ₹{amt:.2f} ({f.get('method')}) failed. Issue created for review.",
                priority="HIGH",
                related_type="payment",
                related_id=int(f["id"]),
            )
            stats["new_issues"] += 1

    mismatch_rows = _fetchall(
        pool,
        """
        SELECT p.id,p.student_user_id,p.amount,IFNULL(SUM(pi.amount),0) AS sum_items
          FROM payments p
          LEFT JOIN payment_items pi ON p.id=pi.payment_id
         WHERE p.status='SUCCESS'
         GROUP BY p.id
        HAVING ABS(p.amount - sum_items) > 0.01
        """,
    )
    for m in mismatch_rows:
        chk = _fetchall(
            pool,
            "SELECT id FROM payment_issues WHERE payment_id=:pid AND issue_type='MISMATCH'",
            {"pid": int(m["id"])},
        )
        if not chk:
            _execute(
                pool,
                """
                INSERT INTO payment_issues (payment_id, issue_type, details)
                VALUES (:pid,'MISMATCH','Payment item total mismatch')
                """,
                {"pid": int(m["id"])},
            )

            amt = float(m.get("amount") or 0.0)
            await notify_user(
                int(m["student_user_id"]),
                "Payment Verification Pending",
                f"Discrepancy in payment ₹{amt:.2f} detected. Finance team reviewing.",
                related_type="payment",
                related_id=int(m["id"]),
            )
            stats["new_issues"] += 1

    stats["failed_payments"] = len(failed)
    stats["mismatches"] = len(mismatch_rows)

    # ---------- receipts for successful payments ----------
    unreceipted = _fetchall(
        pool,
        """
        SELECT p.id,p.student_user_id,p.amount,p.method,p.paid_at
          FROM payments p
          LEFT JOIN receipts r ON r.payment_id=p.id
         WHERE p.status='SUCCESS' AND r.id IS NULL
        """,
    )
    for p in unreceipted:
        # JS: `RCPT-${p.id}-${Date.now().toString().slice(-6)}`
        ms = int(datetime.now().timestamp() * 1000)
        receipt_no = f"RCPT-{int(p['id'])}-{str(ms)[-6:]}"

        # JS used JSON_OBJECT(...) in SQL. Keep compatible by sending JSON string into receipt_data_json.
        receipt_data = json.dumps(
            {"amount": float(p.get("amount") or 0.0), "method": p.get("method"), "paid_at": p.get("paid_at")}
        )

        _execute(
            pool,
            """
            INSERT INTO receipts (payment_id, receipt_no, receipt_data_json)
            VALUES (:pid,:rno,:data)
            """,
            {"pid": int(p["id"]), "rno": receipt_no, "data": receipt_data},
        )

        amt = float(p.get("amount") or 0.0)
        await notify_user(
            int(p["student_user_id"]),
            "Payment Receipt Ready",
            f"Receipt {receipt_no} generated for ₹{amt:.2f}.",
            related_type="receipt",
            related_id=int(p["id"]),
        )
        stats["new_receipts"] += 1

    # ---------- admin summary ----------
    summary = await ai_admin_summary(stats)
    if not summary:
        summary = (
            f"Finance summary: {stats['processed']} students, {stats['overdue']} overdue, "
            f"{stats['pending']} pending, {stats['clear']} clear. "
            f"{stats['failed_payments']} failed payments, {stats['mismatches']} mismatches, "
            f"{stats['new_issues']} new issues."
        )

    await notify_admins(
        "Finance Daily Summary",
        summary,
        priority="HIGH" if int(stats.get("overdue") or 0) > 0 else "NORMAL",
        related_type="finance_summary",
        related_id=0,
    )

    return stats


__all__ = ["recalc_fee_accounts"]
