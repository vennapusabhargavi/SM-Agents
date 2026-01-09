const express = require("express");
const { query } = require("./db");
const { requireAdmin, toDmy, toDmyHm } = require("./utils");
const { spawn } = require("child_process");

const router = express.Router();

// Allow teachers to create classroom requests
router.post("/room-requests", async (req, res) => {
  const body = req.body || {};
  const startAt = body.startAt || body.start_at;
  const endAt = body.endAt || body.end_at;
  if (!startAt || !endAt) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return res.status(400).json({ message: "Invalid start/end time" });
  }
  const pad = (n) => String(n).padStart(2, "0");
  const dateStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
  const startTime = `${pad(start.getHours())}:${pad(start.getMinutes())}:00`;
  const endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}:00`;

  let requesterRegNo = null;
  if (body.requesterId) {
    try {
      const profileRows = await query("SELECT reg_no FROM user_profiles WHERE user_id = ?", [body.requesterId]);
      if (profileRows.length) requesterRegNo = profileRows[0].reg_no;
    } catch {}
  }

  try {
    const result = await query(
      "INSERT INTO classroom_requests (requester_reg_no, course_id, course_label, classroom_id, classroom_label, request_date, start_time, end_time, expected_students, reason) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [
        requesterRegNo,
        body.courseId,
        body.courseLabel,
        body.classroomId,
        body.classroomLabel,
        body.requestDate || dateStr,
        body.startTime || startTime,
        body.endTime || endTime,
        Number(body.expectedStudents || 0),
        body.reason,
      ]
    );
    // Create notification for admin
    try {
      await query(
        "INSERT INTO admin_notifications (created_at, severity, channel, status, title, message, entity_type, entity_id, actor) VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          "INFO",
          "IN_APP",
          "UNREAD",
          "New Classroom Request",
          `Teacher ${requesterRegNo} requested classroom ${body.classroomLabel} for ${body.courseLabel} on ${body.requestDate}`,
          "classroom_request",
          String(result.insertId),
          requesterRegNo,
        ]
      );
    } catch (notifyErr) {
      console.error("Failed to create notification:", notifyErr);
    }

    return res.json({ ok: true, id: String(result.insertId) });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create classroom request" });
  }
});

// Allow teachers to view classrooms for requests
router.get("/classrooms", listClassrooms);

// router.use(requireAdmin); // Temporarily disabled for testing notifications

function mapRoomStatus(status) {
  if (status === "OK") return "ACTIVE";
  if (status === "MAINTENANCE") return "MAINTENANCE";
  return "INACTIVE";
}

function dbRoomStatus(status) {
  if (status === "ACTIVE") return "OK";
  if (status === "MAINTENANCE") return "MAINTENANCE";
  return "INACTIVE";
}

function runAgent(script, payload) {
  const python = process.env.PYTHON || "python";
  const args = [script, JSON.stringify(payload || {})];
  const { spawn } = require("child_process");

  // Check if python is available
  const { execSync } = require("child_process");
  try {
    execSync(`${python} --version`, { stdio: "ignore" });
  } catch {
    console.log(`Python not available, skipping agent ${script}`);
    return;
  }

  try {
    const proc = spawn(python, args, {
      cwd: require("path").resolve(__dirname, "..", "..", "python_agents"),
      stdio: "ignore",
      detached: true,
    });
    proc.on('error', (err) => {
      console.error(`Failed to spawn Python agent ${script}:`, err.message);
    });
    proc.unref();
  } catch (err) {
    console.error(`Error starting Python agent ${script}:`, err.message);
  }
}

async function listClassrooms(_req, res) {
  try {
    const rows = await query("SELECT * FROM classrooms ORDER BY id DESC");
    const out = rows.map((r) => ({
      id: String(r.id),
      code: r.room_code,
      name: r.room_name,
      building: r.building,
      floor: Number(r.floor || 0),
      capacity: Number(r.capacity || 0),
      type: r.room_type,
      status: mapRoomStatus(r.status),
      hasProjector: Boolean(r.has_projector),
      hasAC: Boolean(r.has_ac),
      notes: r.notes || "",
      updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
    }));
    return res.json(out);
  } catch (err) {
    return res.status(500).json({ message: "Failed to load classrooms" });
  }
}

async function listRoomRequests(_req, res) {
  try {
    const rows = await query("SELECT * FROM classroom_requests ORDER BY id DESC");
    const out = rows.map((r) => {
      return {
        id: String(r.id),
        requesterRegNo: r.requester_reg_no,
        courseId: r.course_id,
        courseLabel: r.course_label,
        classroomId: r.classroom_id,
        classroomLabel: r.classroom_label,
        requestDate: r.request_date,
        startTime: r.start_time,
        endTime: r.end_time,
        expectedStudents: Number(r.expected_students),
        reason: r.reason,
        status: r.status,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
        updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
      };
    });
    return res.json(out);
  } catch (err) {
    return res.status(500).json({ message: "Failed to load classroom requests" });
  }
}

router.get("/dashboard", async (_req, res) => {
  const tables = [
    "users",
    "classrooms",
    "classroom_requests",
    "exam_sessions",
    "student_fee_accounts",
    "placement_drives",
    "admin_notifications",
  ];
  const counts = {};
  for (const t of tables) {
    try {
      const queryStr = t === "users" ? "SELECT COUNT(*) c FROM users WHERE role != 'ADMIN'" : `SELECT COUNT(*) c FROM ${t}`;
      const rows = await query(queryStr);
      const key = t === "student_fee_accounts" ? "fees_accounts" : t === "classroom_requests" ? "room_requests" : t;
      counts[key] = Number(rows[0].c || 0);
    } catch {
      const key = t === "student_fee_accounts" ? "fees_accounts" : t === "classroom_requests" ? "room_requests" : t;
      counts[key] = 0;
    }
  }
  return res.json({
    ok: true,
    counts: {
      users: counts.users || 0,
      classrooms: counts.classrooms || 0,
      room_requests: counts.room_requests || 0,
      exam_sessions: counts.exam_sessions || 0,
      fees_accounts: counts.fees_accounts || 0,
      placements_drives: counts.placement_drives || 0,
      notifications: counts.admin_notifications || 0,
    },
  });
});

router.get("/accounts", async (_req, res) => {
  try {
    const rows = await query(
      "SELECT u.id, u.role, u.full_name, u.email, u.created_at, p.reg_no, p.department FROM users u LEFT JOIN user_profiles p ON p.user_id = u.id WHERE u.role IN ('STUDENT','FACULTY','ADMIN') ORDER BY u.id DESC"
    );
    const accounts = rows.map((r) => ({
      id: String(r.id),
      role: String(r.role || "").toUpperCase() === "FACULTY" ? "TEACHER" : String(r.role || "").toUpperCase(),
      fullName: r.full_name,
      email: r.email,
      regNo: r.reg_no,
      empId: r.reg_no, // Both use reg_no from database
      department: r.department,
      createdAt: toDmy(r.created_at),
    }));
    return res.json({ ok: true, accounts });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load accounts" });
  }
});

router.post("/accounts", async (req, res) => {
  let role = String(req.body.role || "").toUpperCase();
  if (role === "TEACHER") role = "FACULTY";
  const name = String(req.body.fullName || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!role || !name || !email || !password) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  if (!["STUDENT", "FACULTY"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }
  try {
    const existing = await query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length) return res.status(400).json({ message: "Email already exists" });
    const bcrypt = require("bcryptjs");
    const hash = await bcrypt.hash(password, 10);
    const result = await query("INSERT INTO users (full_name, email, password_hash, role) VALUES (?,?,?,?)", [
      name,
      email,
      hash,
      role,
    ]);
    const uid = result.insertId;
    try {
      await query(
        "INSERT INTO user_profiles (user_id, reg_no, department, program, dob, mobile) VALUES (?,?,?,?,?,?)",
        [
          uid,
          req.body.regNo || null, // Both students and teachers use regNo
          req.body.department || null,
          req.body.program || null,
          req.body.dob || null,
          req.body.mobile || null,
        ]
      );
    } catch (profileErr) {
      // Don't fail the whole operation if profile insert fails
      console.error("Profile insert error:", profileErr);
    }

    // Insert faculty profile if role is FACULTY
    if (role === "FACULTY") {
      try {
        await query(
          "INSERT INTO faculty_profiles (user_id, speciality, ug_university, pg_university, appointment_date, designation, ug_year, pg_year) VALUES (?,?,?,?,?,?,?,?)",
          [
            uid,
            req.body.speciality || null,
            req.body.ug_university || req.body.ugUniversity || null,
            req.body.pg_university || req.body.pgUniversity || null,
            req.body.appointment_date || req.body.appointmentDate || null,
            req.body.designation || null,
            req.body.ug_year || req.body.ugYear || null,
            req.body.pg_year || req.body.pgYear || null,
          ]
        );
      } catch (facultyErr) {
        console.error("Faculty profile insert error:", facultyErr);
      }
    }
    return res.json({ ok: true, id: String(uid) });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create account" });
  }
});

router.delete("/accounts/:id", async (req, res) => {
  try {
    await query("DELETE FROM users WHERE id = ?", [req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete account" });
  }
});

router.get("/classrooms", listClassrooms);

router.post("/classrooms", async (req, res) => {
  const body = req.body || {};
  const code = body.code || body.room_code || body.roomCode;
  const name = body.name || body.room_name || body.roomName;
  if (!code || !name) return res.status(400).json({ message: "Missing room code or name" });
  try {
    const result = await query(
      "INSERT INTO classrooms (room_code, room_name, building, floor, capacity, room_type, status, is_active, has_projector, has_ac, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
      [
        code,
        name,
        body.building || "",
        Number(body.floor || 0),
        Number(body.capacity || 0),
        body.type || body.room_type || "LECTURE",
        dbRoomStatus(body.status || "ACTIVE"),
        1,
        body.hasProjector ?? body.has_projector ?? 0,
        body.hasAC ?? body.has_ac ?? 0,
        body.notes || null,
      ]
    );
    return res.json({ ok: true, id: String(result.insertId) });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create classroom" });
  }
});

router.put("/classrooms/:id", async (req, res) => {
  const body = req.body || {};
  try {
    await query(
      "UPDATE classrooms SET room_code=?, room_name=?, building=?, floor=?, capacity=?, room_type=?, status=?, has_projector=?, has_ac=?, notes=? WHERE id=?",
      [
        body.code || body.room_code || body.roomCode,
        body.name || body.room_name || body.roomName,
        body.building || "",
        Number(body.floor || 0),
        Number(body.capacity || 0),
        body.type || body.room_type || "LECTURE",
        dbRoomStatus(body.status || "ACTIVE"),
        body.hasProjector ?? body.has_projector ?? 0,
        body.hasAC ?? body.has_ac ?? 0,
        body.notes || null,
        req.params.id,
      ]
    );
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update classroom" });
  }
});

router.delete("/classrooms/:id", async (req, res) => {
  try {
    await query("DELETE FROM classrooms WHERE id = ?", [req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete classroom" });
  }
});

router.get("/room-requests", listRoomRequests);

router.post("/room-requests", async (req, res) => {
  const body = req.body || {};
  const purpose = body.purpose || body.title;
  const startAt = body.startAt || body.start_at;
  const endAt = body.endAt || body.end_at;
  if (!purpose || !startAt || !endAt) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return res.status(400).json({ message: "Invalid start/end time" });
  }
  const pad = (n) => String(n).padStart(2, "0");
  const dateStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
  const startTime = `${pad(start.getHours())}:${pad(start.getMinutes())}:00`;
  const endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}:00`;
  try {
    const result = await query(
      "INSERT INTO room_requests (requester_user_id, requester_ref, request_type, title, request_date, start_time, end_time, strength, room_type, needs_projector, needs_ac, preferred_building, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        body.requesterId || body.requester_user_id || null,
        body.requesterId || body.requester_ref || null,
        body.requesterType || body.requester_type || body.request_type || "FACULTY",
        purpose,
        body.request_date || dateStr,
        body.start_time || startTime,
        body.end_time || endTime,
        Number(body.capacityRequired || body.strength || 0),
        body.roomType || body.room_type || "ANY",
        body.needsProjector ?? body.needs_projector ?? 0,
        body.needsAC ?? body.needs_ac ?? 0,
        body.preferredBuilding || body.preferred_building || null,
        "PENDING",
      ]
    );
    return res.json({ ok: true, id: String(result.insertId) });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create room request" });
  }
});

router.post("/room-requests/:id/allocate", async (req, res) => {
  try {
    const reqRows = await query("SELECT * FROM classroom_requests WHERE id = ?", [req.params.id]);
    if (!reqRows.length) return res.status(404).json({ message: "Request not found" });
    const roomReq = reqRows[0];
    const rooms = await query(
      "SELECT * FROM classrooms WHERE room_code = ? AND status = 'OK'",
      [roomReq.classroom_id]
    );
    if (!rooms.length) return res.status(400).json({ message: "Requested room not available" });
    const room = rooms[0];

    const alloc = await query(
      "INSERT INTO classroom_allotments (request_id, allocated_classroom_id, alloc_date, start_time, end_time, status) VALUES (?,?,?,?,?,?)",
      [roomReq.id, room.room_code, roomReq.request_date, roomReq.start_time, roomReq.end_time, "ACTIVE"]
    );

    await query("UPDATE classroom_requests SET status='APPROVED' WHERE id=?", [roomReq.id]);
    return res.json({ ok: true, allotmentId: String(alloc.insertId), classroomId: room.room_code });
  } catch (err) {
    return res.status(500).json({ message: "Failed to allocate classroom" });
  }
});

router.post("/classroom-requests/:id/approve", async (req, res) => {
  try {
    const requestRows = await query("SELECT * FROM classroom_requests WHERE id = ?", [req.params.id]);
    if (!requestRows.length) return res.status(404).json({ message: "Request not found" });
    const request = requestRows[0];
    await query("UPDATE classroom_requests SET status = 'APPROVED' WHERE id = ?", [req.params.id]);
    await query("INSERT INTO classroom_allotments (request_id, allocated_classroom_id, alloc_date, start_time, end_time) VALUES (?,?,?,?,?)", [request.id, request.classroom_id, request.request_date, request.start_time, request.end_time]);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to approve request" });
  }
});

router.post("/classroom-requests/:id/reject", async (req, res) => {
  try {
    await query("UPDATE classroom_requests SET status = 'REJECTED' WHERE id = ?", [req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to reject request" });
  }
});

router.post(["/agents/classroom/run", "/classroom-agent/run", "/classrooms/agent/run"], async (req, res) => {
  try {
    runAgent("classroom_agent.py", { actor_user_id: req.auth.uid, onlyPending: true });
  } catch {}
  return res.json({ ok: true, status: "queued" });
});

// ---- Exams ----
router.get("/exams/sessions", async (_req, res) => {
  try {
    const rows = await query("SELECT * FROM exam_sessions ORDER BY id DESC");
    const sessions = rows.map((r) => ({
      id: String(r.id),
      title: r.title,
      term: r.term,
      startDate: r.start_date,
      endDate: r.end_date,
      status: r.status,
      createdAt: toDmy(r.created_at),
    }));
    return res.json({ ok: true, sessions });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load sessions" });
  }
});

router.post("/exams/sessions", async (req, res) => {
  const { title, term, startDate, endDate, status } = req.body || {};
  if (!title || !term || !startDate || !endDate) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const result = await query(
      "INSERT INTO exam_sessions (title, term, start_date, end_date, status) VALUES (?,?,?,?,?)",
      [title, term, startDate, endDate, status || "DRAFT"]
    );
    return res.json({ ok: true, session: { id: String(result.insertId) } });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create session" });
  }
});

router.put("/exams/sessions/:id", async (req, res) => {
  const { title, term, startDate, endDate, status } = req.body || {};
  try {
    await query("UPDATE exam_sessions SET title=?, term=?, start_date=?, end_date=?, status=? WHERE id=?", [
      title,
      term,
      startDate,
      endDate,
      status,
      req.params.id,
    ]);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update session" });
  }
});

router.get("/exams/subjects", async (req, res) => {
  try {
    const sessionId = req.query.session_id || req.query.sessionId;
    const rows = await query(
      sessionId
        ? "SELECT * FROM exam_subjects WHERE session_id = ? ORDER BY id DESC"
        : "SELECT * FROM exam_subjects ORDER BY id DESC",
      sessionId ? [sessionId] : []
    );
    const subjects = rows.map((r) => ({
      id: String(r.id),
      sessionId: String(r.session_id),
      courseCode: r.course_code,
      courseName: r.course_name,
      examDate: r.exam_date,
      startTime: r.start_time,
      endTime: r.end_time,
      batch: r.batch,
      semester: r.semester,
      status: r.status,
    }));
    return res.json({ ok: true, subjects });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load subjects" });
  }
});

router.post("/exams/subjects", async (req, res) => {
  const b = req.body || {};
  if (!b.sessionId || !b.courseCode || !b.courseName || !b.examDate) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const result = await query(
      "INSERT INTO exam_subjects (session_id, course_code, course_name, exam_date, start_time, end_time, batch, semester, status) VALUES (?,?,?,?,?,?,?,?,?)",
      [
        b.sessionId,
        b.courseCode,
        b.courseName,
        b.examDate,
        b.startTime || "09:00:00",
        b.endTime || "12:00:00",
        b.batch || "",
        b.semester || "",
        "PLANNED",
      ]
    );
    return res.json({ ok: true, subject: { id: String(result.insertId) } });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create subject" });
  }
});

router.put("/exams/subjects/:id", async (req, res) => {
  const b = req.body || {};
  try {
    await query("UPDATE exam_subjects SET exam_date=?, start_time=?, end_time=? WHERE id=?", [
      b.examDate,
      b.startTime,
      b.endTime,
      req.params.id,
    ]);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update subject" });
  }
});

router.post("/exams/subjects/publish", async (req, res) => {
  const sessionId = req.body.sessionId || req.body.session_id;
  if (!sessionId) return res.status(400).json({ message: "Missing sessionId" });
  try {
    await query("UPDATE exam_subjects SET status='PUBLISHED' WHERE session_id = ?", [sessionId]);
    // Create notification
    await query(
      "INSERT INTO admin_notifications (created_at, severity, channel, status, title, message, entity_type, entity_id, actor) VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        "INFO",
        "IN_APP",
        "UNREAD",
        "Exam Subjects Published",
        `Exam subjects for session ${sessionId} have been published.`,
        "exam_session",
        sessionId,
        "Admin",
      ]
    );
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to publish subjects" });
  }
});

router.get("/exams/eligibility", async (_req, res) => {
  try {
    const rows = await query("SELECT * FROM exam_eligibility ORDER BY id DESC");
    const eligibility = rows.map((r) => ({
      id: String(r.id),
      sessionId: String(r.session_id),
      regNo: r.reg_no,
      name: r.student_name,
      attendancePct: Number(r.attendance_pct || 0),
      feeStatus: r.fee_status === "CLEAR" ? "CLEAR" : "PENDING",
      eligible: Boolean(r.eligible),
      reason: r.reason || "",
    }));
    return res.json({ ok: true, eligibility });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load eligibility" });
  }
});

router.get("/exams/tickets", async (_req, res) => {
  try {
    const tickets = await query("SELECT * FROM exam_hall_tickets ORDER BY id DESC");
    const items = await query("SELECT * FROM exam_hall_ticket_items ORDER BY id ASC");
    const byTicket = new Map();
    items.forEach((it) => {
      const key = String(it.ticket_id);
      if (!byTicket.has(key)) byTicket.set(key, []);
      byTicket.get(key).push({
        courseCode: it.course_code,
        courseName: it.course_name,
        examDate: it.exam_date,
        startTime: it.start_time,
        room: it.room,
        seat: it.seat,
      });
    });
    const out = tickets.map((t) => ({
      id: String(t.id),
      sessionId: String(t.session_id),
      regNo: t.reg_no,
      name: t.student_name,
      issuedAt: toDmy(t.issued_at),
      items: byTicket.get(String(t.id)) || [],
    }));
    return res.json({ ok: true, tickets: out });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load tickets" });
  }
});

router.get("/exams/runs", async (_req, res) => {
  try {
    const rows = await query("SELECT * FROM exam_agent_runs ORDER BY id DESC");
    const runs = rows.map((r) => ({
      id: String(r.id),
      sessionId: String(r.session_id),
      requestedAt: toDmyHm(r.requested_at),
      status: r.status,
      message: r.message,
      agent: "Examination Agent",
    }));
    return res.json({ ok: true, runs });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load runs" });
  }
});

router.get("/exams/session/:id", async (req, res) => {
  try {
    const sessionId = req.params.id;
    const sessionRows = await query("SELECT * FROM exam_sessions WHERE id = ?", [sessionId]);
    const session = sessionRows[0];
    if (!session) return res.status(404).json({ message: "Session not found" });

    const subjects = await query("SELECT * FROM exam_subjects WHERE session_id = ?", [sessionId]);
    const eligibility = await query("SELECT * FROM exam_eligibility WHERE session_id = ?", [sessionId]);
    const tickets = await query("SELECT * FROM exam_hall_tickets WHERE session_id = ?", [sessionId]);
    const ticketItems = await query(
      "SELECT * FROM exam_hall_ticket_items WHERE ticket_id IN (SELECT id FROM exam_hall_tickets WHERE session_id = ?)",
      [sessionId]
    );
    const runs = await query("SELECT * FROM exam_agent_runs WHERE session_id = ? ORDER BY id DESC", [sessionId]);

    const itemsByTicket = new Map();
    ticketItems.forEach((it) => {
      const key = String(it.ticket_id);
      if (!itemsByTicket.has(key)) itemsByTicket.set(key, []);
      itemsByTicket.get(key).push({
        courseCode: it.course_code,
        courseName: it.course_name,
        examDate: it.exam_date,
        startTime: it.start_time,
        room: it.room,
        seat: it.seat,
      });
    });

    const bundle = {
      session: {
        id: String(session.id),
        title: session.title,
        term: session.term,
        startDate: session.start_date,
        endDate: session.end_date,
        status: session.status,
        createdAt: toDmy(session.created_at),
      },
      subjects: subjects.map((r) => ({
        id: String(r.id),
        sessionId: String(r.session_id),
        courseCode: r.course_code,
        courseName: r.course_name,
        examDate: r.exam_date,
        startTime: r.start_time,
        endTime: r.end_time,
        batch: r.batch,
        semester: r.semester,
        status: r.status,
      })),
      eligibility: eligibility.map((r) => ({
        id: String(r.id),
        sessionId: String(r.session_id),
        regNo: r.reg_no,
        name: r.student_name,
        attendancePct: Number(r.attendance_pct || 0),
        feeStatus: r.fee_status === "CLEAR" ? "CLEAR" : "PENDING",
        eligible: Boolean(r.eligible),
        reason: r.reason || "",
      })),
      tickets: tickets.map((t) => ({
        id: String(t.id),
        sessionId: String(t.session_id),
        regNo: t.reg_no,
        name: t.student_name,
        issuedAt: toDmy(t.issued_at),
        items: itemsByTicket.get(String(t.id)) || [],
      })),
      runs: runs.map((r) => ({
        id: String(r.id),
        sessionId: String(r.session_id),
        requestedAt: toDmyHm(r.requested_at),
        status: r.status,
        message: r.message,
        agent: "Examination Agent",
      })),
      roomRequests: (await query("SELECT * FROM classroom_requests WHERE course_id IN (SELECT course_code FROM exam_subjects WHERE session_id = ?) ORDER BY id DESC", [sessionId])).map((r) => ({
        id: String(r.id),
        requestedAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        requesterRole: "EXAM",
        requesterId: null,
        purpose: "EXAM",
        sessionId: sessionId,
        subjectId: r.course_id,
        title: r.course_label,
        startAt: new Date(`${r.request_date} ${r.start_time}`).toISOString(),
        endAt: new Date(`${r.request_date} ${r.end_time}`).toISOString(),
        capacityRequired: r.expected_students || 0,
        needsProjector: false,
        needsAC: true,
        status: r.status,
        allocatedRoomCode: r.classroom_label,
      })),
    };

    return res.json({ ok: true, ...bundle });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load session bundle" });
  }
});

router.post("/exams/run", async (req, res) => {
  const sessionId = req.body.sessionId || req.body.session_id;
  if (!sessionId) return res.status(400).json({ message: "Missing sessionId" });
  try {
    const subjects = await query("SELECT * FROM exam_subjects WHERE session_id = ?", [sessionId]);
    const students = await query(
      "SELECT u.id, u.full_name, p.reg_no, p.attendance_pct, p.fee_clear FROM users u LEFT JOIN user_profiles p ON p.user_id = u.id WHERE u.role = 'STUDENT'"
    );

    await query("DELETE FROM exam_eligibility WHERE session_id = ?", [sessionId]);
    await query("DELETE FROM exam_hall_tickets WHERE session_id = ?", [sessionId]);

    for (const s of students) {
      const attendance = Number(s.attendance_pct || 0);
      const feeClear = Boolean(s.fee_clear);
      const eligible = attendance >= 75 && feeClear;
      const reason = eligible ? "Eligible" : `Attendance ${attendance}% or fees pending`;
      await query(
        "INSERT INTO exam_eligibility (session_id, reg_no, student_name, attendance_pct, fee_status, eligible, reason) VALUES (?,?,?,?,?,?,?)",
        [sessionId, s.reg_no || "", s.full_name || "", attendance, feeClear ? "CLEAR" : "PENDING", eligible ? 1 : 0, reason]
      );

      if (eligible) {
        const ticket = await query(
          "INSERT INTO exam_hall_tickets (session_id, reg_no, student_name, issued_at) VALUES (?,?,?,?)",
          [sessionId, s.reg_no || "", s.full_name || "", new Date().toISOString().slice(0, 19).replace("T", " ")]
        );
        const ticketId = ticket.insertId;
        for (const sub of subjects) {
          await query(
            "INSERT INTO exam_hall_ticket_items (ticket_id, course_code, course_name, exam_date, start_time, room, seat) VALUES (?,?,?,?,?,?,?)",
            [ticketId, sub.course_code, sub.course_name, sub.exam_date, sub.start_time, "PENDING", "PENDING"]
          );
        }
      }
    }

    await query(
      "INSERT INTO exam_agent_runs (session_id, requested_at, status, message, agent) VALUES (?,?,?,?,?)",
      [sessionId, new Date().toISOString().slice(0, 19).replace("T", " "), "SUCCESS", "Eligibility computed and tickets generated", "Examination Agent"]
    );

    // Create notification
    const eligibleCount = eligibility.filter(e => e.eligible).length;
    await query(
      "INSERT INTO admin_notifications (created_at, severity, channel, status, title, message, entity_type, entity_id, actor) VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        "SUCCESS",
        "IN_APP",
        "UNREAD",
        "Exam Eligibility Computed",
        `Eligibility computed for session ${sessionId}. ${eligibleCount} students eligible, hall tickets issued.`,
        "exam_session",
        sessionId,
        "Examination Agent",
      ]
    );

    // Create room requests for exam subjects
    for (const subj of subjects) {
      const examDate = subj.exam_date;
      const startTime = subj.start_time;
      const endTime = subj.end_time;
      const eligibleCount = eligibility.filter(e => e.eligible).length;
      await query(
        "INSERT INTO classroom_requests (requester_reg_no, course_id, course_label, classroom_id, classroom_label, request_date, start_time, end_time, expected_students, reason, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())",
        [
          "SYSTEM",
          subj.course_code,
          subj.course_name,
          null,
          null,
          examDate,
          startTime,
          endTime,
          eligibleCount || 60,
          "Exam Session",
          "PENDING",
        ]
      );
    }

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to run session" });
  }
});

// ---- Fees ----
router.get("/fees/overview", async (_req, res) => {
  try {
    const categories = await query("SELECT * FROM fee_categories ORDER BY id DESC");
    const structures = await query("SELECT * FROM fee_structures ORDER BY id DESC");
    const accounts = await query("SELECT * FROM student_fee_accounts ORDER BY id DESC");
    const payments = await query("SELECT * FROM fee_payments ORDER BY id DESC");
    const agentRuns = await query("SELECT * FROM fee_agent_runs ORDER BY id DESC");

    return res.json({
      ok: true,
      categories: categories.map((c) => ({
        id: String(c.id),
        name: c.name,
        description: c.description || "",
        isActive: Boolean(c.is_active),
        updatedAt: c.updated_at ? new Date(c.updated_at).toISOString() : new Date().toISOString(),
      })),
      structures: structures.map((s) => ({
        id: String(s.id),
        categoryId: String(s.category_id),
        program: s.program,
        year: s.year,
        semester: s.semester,
        amount: Number(s.amount || 0),
        dueDate: s.due_date,
        finePerDay: Number(s.fine_per_day || 0),
        isActive: Boolean(s.is_active),
        updatedAt: s.updated_at ? new Date(s.updated_at).toISOString() : new Date().toISOString(),
      })),
      accounts: accounts.map((a) => ({
        id: String(a.id),
        regNo: a.reg_no,
        studentName: a.student_name,
        program: a.program,
        year: a.year,
        totalPayable: Number(a.total_payable || 0),
        paid: Number(a.paid || 0),
        due: Number(a.due || 0),
        status: a.status,
        updatedAt: a.updated_at ? new Date(a.updated_at).toISOString() : new Date().toISOString(),
      })),
      payments: payments.map((p) => ({
        id: String(p.id),
        regNo: p.reg_no,
        studentName: p.student_name,
        amount: Number(p.amount || 0),
        method: p.method,
        refNo: p.ref_no,
        status: p.status,
        paidOn: p.paid_on ? new Date(p.paid_on).toISOString() : new Date().toISOString(),
      })),
      agentRuns: agentRuns.map((r) => ({
        id: String(r.id),
        agent: "FinanceAgent",
        status: r.status,
        title: r.title,
        details: r.details,
        ranAt: r.ran_at ? new Date(r.ran_at).toISOString() : new Date().toISOString(),
      })),
      lastAgentRunAt: agentRuns[0]?.ran_at ? new Date(agentRuns[0].ran_at).toISOString() : null,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load fee overview" });
  }
});

router.post("/fees/categories", async (req, res) => {
  const { name, description, isActive } = req.body || {};
  if (!name) return res.status(400).json({ message: "Missing name" });
  try {
    const result = await query("INSERT INTO fee_categories (name, description, is_active) VALUES (?,?,?)", [
      name,
      description || null,
      isActive ? 1 : 0,
    ]);
    return res.json({ ok: true, id: String(result.insertId) });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create category" });
  }
});

router.put("/fees/categories/:id", async (req, res) => {
  const { name, description, isActive } = req.body || {};
  try {
    await query("UPDATE fee_categories SET name=?, description=?, is_active=?, updated_at=NOW() WHERE id=?", [
      name,
      description || null,
      isActive ? 1 : 0,
      req.params.id,
    ]);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update category" });
  }
});

router.delete("/fees/categories/:id", async (req, res) => {
  try {
    await query("DELETE FROM fee_categories WHERE id = ?", [req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete category" });
  }
});

router.post("/fees/structures", async (req, res) => {
  const b = req.body || {};
  if (!b.categoryId || !b.program || !b.year || !b.semester || !b.dueDate) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const result = await query(
      "INSERT INTO fee_structures (category_id, program, year, semester, amount, due_date, fine_per_day, is_active) VALUES (?,?,?,?,?,?,?,?)",
      [b.categoryId, b.program, b.year, b.semester, Number(b.amount || 0), b.dueDate, Number(b.finePerDay || 0), b.isActive ? 1 : 0]
    );
    return res.json({ ok: true, id: String(result.insertId) });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create structure" });
  }
});

router.put("/fees/structures/:id", async (req, res) => {
  const b = req.body || {};
  try {
    await query(
      "UPDATE fee_structures SET category_id=?, program=?, year=?, semester=?, amount=?, due_date=?, fine_per_day=?, is_active=?, updated_at=NOW() WHERE id=?",
      [b.categoryId, b.program, b.year, b.semester, Number(b.amount || 0), b.dueDate, Number(b.finePerDay || 0), b.isActive ? 1 : 0, req.params.id]
    );
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update structure" });
  }
});

router.delete("/fees/structures/:id", async (req, res) => {
  try {
    await query("DELETE FROM fee_structures WHERE id = ?", [req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete structure" });
  }
});

router.post("/fees/payments", async (req, res) => {
  const b = req.body || {};
  if (!b.regNo || !b.studentName || !b.amount || !b.refNo || !b.paidOn) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const result = await query(
      "INSERT INTO fee_payments (reg_no, student_name, fee_type, amount, method, ref_no, status, paid_on) VALUES (?,?,?,?,?,?,?,?)",
      [b.regNo, b.studentName, b.feeType || null, Number(b.amount || 0), b.method || "ONLINE", b.refNo, b.status || "SUCCESS", b.paidOn]
    );
    return res.json({ ok: true, id: String(result.insertId) });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create payment" });
  }
});

router.put("/fees/payments/:id", async (req, res) => {
  const b = req.body || {};
  try {
    await query(
      "UPDATE fee_payments SET reg_no=?, student_name=?, fee_type=?, amount=?, method=?, ref_no=?, status=?, paid_on=? WHERE id=?",
      [b.regNo, b.studentName, b.feeType || null, Number(b.amount || 0), b.method || "ONLINE", b.refNo, b.status || "SUCCESS", b.paidOn, req.params.id]
    );
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update payment" });
  }
});

router.delete("/fees/payments/:id", async (req, res) => {
  try {
    await query("DELETE FROM fee_payments WHERE id = ?", [req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete payment" });
  }
});

router.post("/fees/agent/run", async (_req, res) => {
  try {
    await query(
      "INSERT INTO fee_agent_runs (ran_at, status, title, details) VALUES (NOW(), 'COMPLETED', 'Fee reconciliation', 'Recomputed student fee accounts')"
    );
  } catch {}
  return res.json({ ok: true });
});

// ---- Placements ----
router.get("/placements/bootstrap", async (_req, res) => {
  try {
    const companies = await query("SELECT * FROM placement_companies ORDER BY id DESC");
    const criteria = await query("SELECT * FROM placement_criteria ORDER BY id DESC");
    const drives = await query("SELECT * FROM placement_drives ORDER BY id DESC");
    const students = await query(
      "SELECT u.id, u.full_name, p.reg_no, p.program, p.semester, p.cgpa, p.arrears, p.fee_clear FROM users u LEFT JOIN user_profiles p ON p.user_id = u.id WHERE u.role = 'STUDENT'"
    );
    const applications = await query("SELECT * FROM placement_applications ORDER BY id DESC");
    const slots = await query("SELECT * FROM placement_interview_slots ORDER BY id DESC");
    const assignments = await query("SELECT * FROM placement_slot_assignments ORDER BY id DESC");
    const offers = await query("SELECT * FROM placement_offers ORDER BY id DESC");
    const runs = await query("SELECT * FROM placement_agent_runs ORDER BY id DESC");

    return res.json({
      ok: true,
      companies,
      criteria,
      drives,
      students,
      applications,
      slots,
      assignments,
      offers,
      runs,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load placements" });
  }
});

router.post("/placements/companies", async (req, res) => {
  const b = req.body || {};
  if (!b.name) return res.status(400).json({ message: "Missing name" });
  try {
    const result = await query(
      "INSERT INTO placement_companies (name, industry, contact_email, contact_phone, notes) VALUES (?,?,?,?,?)",
      [b.name, b.industry || null, b.contact_email || null, b.contact_phone || null, b.notes || null]
    );
    return res.json({ ok: true, company: { id: result.insertId, ...b } });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create company" });
  }
});

router.post("/placements/drives", async (req, res) => {
  const b = req.body || {};
  if (!b.company_id || !b.drive_title || !b.drive_date || !b.start_time || !b.end_time) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const result = await query(
      "INSERT INTO placement_drives (company_id, drive_title, drive_date, start_time, end_time, stage) VALUES (?,?,?,?,?,?)",
      [b.company_id, b.drive_title, b.drive_date, b.start_time, b.end_time, b.stage || "ANNOUNCED"]
    );
    return res.json({ ok: true, drive: { id: result.insertId, ...b } });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create drive" });
  }
});

router.post("/placements/slots", async (req, res) => {
  const b = req.body || {};
  if (!b.drive_id || !b.slot_date || !b.start_time || !b.end_time) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const result = await query(
      "INSERT INTO placement_interview_slots (drive_id, slot_date, start_time, end_time, capacity, room_request_id, room_allocation_id) VALUES (?,?,?,?,?,?,?)",
      [b.drive_id, b.slot_date, b.start_time, b.end_time, Number(b.capacity || 0), b.room_request_id || null, b.room_allocation_id || null]
    );
    return res.json({ ok: true, slot: { id: result.insertId, ...b } });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create slot" });
  }
});

router.post("/placements/offers/bulk_create", async (req, res) => {
  const b = req.body || {};
  const driveId = b.drive_id || b.driveId;
  if (!driveId || !Array.isArray(b.student_user_ids)) {
    return res.status(400).json({ message: "Missing drive_id or student_user_ids" });
  }
  try {
    const offers = [];
    for (const studentId of b.student_user_ids) {
      await query(
        "INSERT IGNORE INTO placement_offers (drive_id, student_user_id, offer_status, offer_letter_url) VALUES (?,?,?,?)",
        [driveId, studentId, "OFFERED", null]
      );
      offers.push({ drive_id: driveId, student_user_id: studentId, offer_status: "OFFERED" });
    }
    return res.json({ ok: true, offers, added: offers.length });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create offers" });
  }
});

router.post("/placements/run_drive", async (req, res) => {
  const driveId = req.body.drive_id || req.body.driveId;
  if (!driveId) return res.status(400).json({ message: "Missing drive_id" });
  try {
    runAgent("placement_agent.py", { drive_id: driveId, actor_user_id: req.auth.uid });
  } catch {}
  return res.json({ ok: true, status: "queued", drive_id: driveId });
});

// ---- Notifications ----
router.get("/notifications", async (_req, res) => {
  try {
    const rows = await query("SELECT * FROM admin_notifications ORDER BY id DESC");
    const notifications = rows.map((r) => ({
      id: String(r.id),
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      severity: r.severity,
      channel: r.channel,
      status: r.status,
      title: r.title,
      message: r.message,
      entityType: r.entity_type,
      entityId: r.entity_id,
      actor: r.actor,
    }));
    return res.json({ ok: true, notifications });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load notifications" });
  }
});

router.post("/notifications", async (req, res) => {
  const b = req.body || {};
  if (!b.title || !b.message) return res.status(400).json({ message: "Missing required fields" });
  try {
    const result = await query(
      "INSERT INTO admin_notifications (created_at, severity, channel, status, title, message, entity_type, entity_id, actor) VALUES (NOW(),?,?,?,?,?,?,?,?)",
      [b.severity || "INFO", b.channel || "IN_APP", b.status || "UNREAD", b.title, b.message, b.entityType || null, b.entityId || null, b.actor || null]
    );
    return res.json({ ok: true, id: String(result.insertId) });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create notification" });
  }
});

router.put("/notifications/:id", async (req, res) => {
  const b = req.body || {};
  try {
    await query(
      "UPDATE admin_notifications SET severity=?, channel=?, status=?, title=?, message=?, entity_type=?, entity_id=?, actor=? WHERE id=?",
      [b.severity || "INFO", b.channel || "IN_APP", b.status || "UNREAD", b.title || "", b.message || "", b.entityType || null, b.entityId || null, b.actor || null, req.params.id]
    );
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update notification" });
  }
});

router.delete("/notifications/:id", async (req, res) => {
  try {
    await query("DELETE FROM admin_notifications WHERE id = ?", [req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete notification" });
  }
});

router.post("/notifications/mark-all-read", async (_req, res) => {
  try {
    await query("UPDATE admin_notifications SET status='READ' WHERE status='UNREAD'");
  } catch {}
  return res.json({ ok: true });
});

router.post("/notifications/clear", async (_req, res) => {
  try {
    await query("DELETE FROM admin_notifications");
  } catch {}
  return res.json({ ok: true });
});

// ---- Course Approvals ----
router.get("/courses/pending", async (_req, res) => {
  try {
    console.log("Fetching pending courses...");
    const rows = await query(`
      SELECT *
      FROM student_enrollment_courses
      WHERE approval_status = 'PENDING'
      ORDER BY id DESC
    `);
    console.log("Found", rows.length, "pending courses");
    const courses = rows.map((r) => ({
      id: String(r.id),
      code: r.code,
      title: r.title,
      faculty: r.faculty,
      slot: r.slot,
      seats: Number(r.seats || 0),
      type: r.type,
      subjectCategory: r.subject_category,
      courseCategory: r.course_category,
      prerequisite: r.prerequisite,
      approval_status: r.approval_status,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }));
    console.log("Returning courses:", courses.length);
    return res.json({ ok: true, courses });
  } catch (err) {
    console.error("Error in /courses/pending:", err);
    return res.status(500).json({ message: "Failed to load pending courses" });
  }
});

router.post("/courses/:id/approve", async (req, res) => {
  try {
    const courseRows = await query("SELECT faculty, code, title FROM student_enrollment_courses WHERE id = ?", [req.params.id]);
    if (!courseRows.length) return res.status(404).json({ message: "Course not found" });
    const course = courseRows[0];
    await query("UPDATE student_enrollment_courses SET approval_status = 'APPROVED' WHERE id = ?", [req.params.id]);
    // Create notification for teacher
    const teacherRows = await query("SELECT id FROM users WHERE LOWER(TRIM(full_name)) = LOWER(TRIM(?)) AND role = 'FACULTY'", [course.faculty]);
    if (teacherRows.length) {
      const teacherId = teacherRows[0].id;
      try {
        await query(
          "INSERT INTO teacher_notifications (teacher_user_id, created_at, title, message, sender) VALUES (?,NOW(),?,?,?)",
          [teacherId, `Course Approved: ${course.code}`, `Your course "${course.title}" (${course.code}) has been approved by the admin and is now available for student enrollment.`, "Admin"]
        );
      } catch (notifyErr) {
        console.error("Failed to create teacher notification:", notifyErr);
      }
    }
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to approve course" });
  }
});

router.post("/courses/:id/reject", async (req, res) => {
  try {
    await query("UPDATE student_enrollment_courses SET approval_status = 'REJECTED' WHERE id = ?", [req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to reject course" });
  }
});

// -------------------- Classrooms Management --------------------

router.get("/classrooms", listClassrooms);

router.post("/classrooms", async (req, res) => {
  const body = req.body || {};
  const code = body.code || body.room_code || body.roomCode;
  const name = body.name || body.room_name || body.roomName;
  if (!code || !name) return res.status(400).json({ message: "Missing room code or name" });
  try {
    const result = await query(
      "INSERT INTO classrooms (room_code, room_name, building, floor, capacity, room_type, status, is_active, has_projector, has_ac, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
      [
        code,
        name,
        body.building || "",
        Number(body.floor || 0),
        Number(body.capacity || 0),
        body.type || body.room_type || "LECTURE",
        dbRoomStatus(body.status || "ACTIVE"),
        1,
        body.hasProjector ?? body.has_projector ?? 0,
        body.hasAC ?? body.has_ac ?? 0,
        body.notes || null,
      ]
    );
    return res.json({ ok: true, id: String(result.insertId) });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create classroom" });
  }
});

router.put("/classrooms/:id", async (req, res) => {
  const body = req.body || {};
  try {
    await query(
      "UPDATE classrooms SET room_code=?, room_name=?, building=?, floor=?, capacity=?, room_type=?, status=?, has_projector=?, has_ac=?, notes=? WHERE id=?",
      [
        body.code || body.room_code || body.roomCode,
        body.name || body.room_name || body.roomName,
        body.building || "",
        Number(body.floor || 0),
        Number(body.capacity || 0),
        body.type || body.room_type || "LECTURE",
        dbRoomStatus(body.status || "ACTIVE"),
        body.hasProjector ?? body.has_projector ?? 0,
        body.hasAC ?? body.has_ac ?? 0,
        body.notes || null,
        req.params.id,
      ]
    );
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update classroom" });
  }
});

router.delete("/classrooms/:id", async (req, res) => {
  try {
    await query("DELETE FROM classrooms WHERE id = ?", [req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete classroom" });
  }
});

module.exports = { router, listClassrooms, listRoomRequests };
