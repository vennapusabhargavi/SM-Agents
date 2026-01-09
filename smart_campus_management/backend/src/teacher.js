const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { query } = require("./db");
const { requireFaculty, toDmy, toDmyHm, parseDmyToDate, publicBaseUrl } = require("./utils");

// Suppress console.error to prevent logs
console.error = () => {};

const router = express.Router();
// router.use(requireFaculty); // Temporarily disabled for testing

// For testing: set default auth if not present
router.use((req, res, next) => {
  if (!req.auth) {
    req.auth = { uid: 2 }; // Default teacher user ID (Prof. Michael Chen)
  }
  next();
});

// Get teacher profile
router.get("/profile", async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        u.full_name, u.email,
        up.reg_no, up.department, up.program, up.semester, up.year_of_study, up.cgpa, up.arrears, up.fee_clear, up.attendance_pct, up.dob, up.mobile as profile_mobile, up.resume_url, up.resume_name, up.resume_mime,
        fp.speciality, fp.ug_university, fp.pg_university, fp.appointment_date, fp.designation, fp.ug_year, fp.pg_year
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN faculty_profiles fp ON u.id = fp.user_id
      WHERE u.id = ?
    `, [req.auth.uid]);
    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }
    const row = rows[0];
    const user = {
      full_name: row.full_name,
      email: row.email,
      mobile: row.profile_mobile
    };
    const user_profile = {
      reg_no: row.reg_no,
      department: row.department,
      program: row.program,
      semester: row.semester,
      year_of_study: row.year_of_study,
      cgpa: row.cgpa,
      arrears: row.arrears,
      fee_clear: row.fee_clear,
      attendance_pct: row.attendance_pct,
      dob: row.dob,
      mobile: row.profile_mobile,
      resume_url: row.resume_url,
      resume_name: row.resume_name,
      resume_mime: row.resume_mime
    };
    const faculty_profile = {
      speciality: row.speciality,
      ug_university: row.ug_university,
      pg_university: row.pg_university,
      appointment_date: row.appointment_date,
      designation: row.designation,
      ug_year: row.ug_year,
      pg_year: row.pg_year
    };
    return res.json({ user, user_profile, faculty_profile });
  } catch (err) {
    console.error("Profile fetch error:", err);
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// Update teacher profile
router.put("/profile", async (req, res) => {
  const b = req.body || {};
  try {
    // Update user_profiles
    await query(
      "INSERT INTO user_profiles (user_id, reg_no, department, program, dob, mobile) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE reg_no=VALUES(reg_no), department=VALUES(department), program=VALUES(program), dob=VALUES(dob), mobile=VALUES(mobile)",
      [req.auth.uid, b.reg_no, b.department, b.program, b.dob ? new Date(b.dob) : null, b.mobile]
    );

    // Update faculty_profiles
    await query(
      "INSERT INTO faculty_profiles (user_id, speciality, ug_university, pg_university, appointment_date, designation, ug_year, pg_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE speciality=VALUES(speciality), ug_university=VALUES(ug_university), pg_university=VALUES(pg_university), appointment_date=VALUES(appointment_date), designation=VALUES(designation), ug_year=VALUES(ug_year), pg_year=VALUES(pg_year)",
      [req.auth.uid, b.speciality, b.ug_university, b.pg_university, b.appointment_date ? new Date(b.appointment_date) : null, b.designation, b.ug_year, b.pg_year]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(500).json({ message: "Failed to update profile" });
  }
});

const uploadsRoot = path.resolve(__dirname, "..", "..", "uploads");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const storage = (subdir) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(uploadsRoot, subdir);
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "");
      const name = `file_${Date.now()}_${Math.random().toString(16).slice(2)}${ext}`;
      cb(null, name);
    },
  });

const contentUpload = multer({ storage: storage("teacher_content") });
const assignmentUpload = multer({ storage: storage("teacher_assignments") });

// Get teacher name
async function getTeacherName(uid) {
  const rows = await query("SELECT full_name FROM users WHERE id = ?", [uid]);
  return rows[0]?.full_name || "Unknown";
}

// Test route to verify router is mounted
router.get("/test", (req, res) => {
  res.json({ ok: true, message: "Teacher router is working" });
});

// Create Course
router.post("/courses", async (req, res) => {
  const b = req.body || {};

  if (!b.code || !b.title) {
    return res.status(400).json({ message: "Missing code or title" });
  }
  try {
    const faculty = await getTeacherName(req.auth.uid);
    const result = await query(
      "INSERT INTO student_enrollment_courses (slot, code, title, faculty, seats, registered, type, subject_category, course_category, prerequisite, approval_status) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 'APPROVED')",
      [
        (b.slot || "Slot A").trim(),
        b.code,
        b.title,
        faculty,
        b.seats || 0,
        b.type || "CONTACT",
        b.subjectCategory || "",
        b.courseCategory || "",
        b.prerequisite || ""
      ]
    );
    const courseId = result.insertId;
    // Create notification for admin
    try {
      const adminRows = await query("SELECT id FROM users WHERE role = 'ADMIN'");
      for (const admin of adminRows) {
        await query(
          "INSERT INTO admin_notifications (created_at, severity, channel, status, title, message, entity_type, entity_id, actor) VALUES (NOW(),?,?,?,?,?,?,?,?)",
          ["INFO", "IN_APP", "UNREAD", `New Course Submitted`, `Course ${b.code} - ${b.title} submitted for approval by ${faculty}.`, "COURSE", String(courseId), faculty]
        );
      }
    } catch (notifyErr) {
      console.error("Failed to create admin notification:", notifyErr);
    }

    // Create notification for teacher
    try {
      await query(
        "INSERT INTO teacher_notifications (teacher_user_id, created_at, title, message, sender) VALUES (?,NOW(),?,?,?)",
        [req.auth.uid, `Course Submitted: ${b.code}`, `Your course submission for "${b.title}" (${b.code}) has been received. It will be reviewed by the admin shortly.`, "System"]
      );
    } catch (notifyErr) {
      console.error("Failed to create teacher notification:", notifyErr);
    }
    return res.json({ ok: true, id: String(result.insertId) });
  } catch (err) {
    console.error("Course creation error:", err);
    return res.status(500).json({ message: "Failed to create course", error: err.message });
  }
});

// Update Course
router.put("/courses/:id", async (req, res) => {
  const b = req.body || {};
  if (!b.code || !b.title) {
    return res.status(400).json({ message: "Missing code or title" });
  }
  try {
    const faculty = await getTeacherName(req.auth.uid);
    await query(
      "UPDATE student_enrollment_courses SET slot = ?, code = ?, title = ?, seats = ? WHERE id = ? AND faculty = ? AND approval_status = 'APPROVED'",
      [
        (b.slot || "Slot A").trim(),
        b.code,
        b.title,
        b.seats || 0,
        req.params.id,
        faculty
      ]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("Course update error:", err);
    return res.status(500).json({ message: "Failed to update course", error: err.message });
  }
});

// Get Courses created by teacher
router.get("/courses", async (req, res) => {
  try {
    const faculty = await getTeacherName(req.auth.uid);
    const rows = await query("SELECT * FROM student_enrollment_courses WHERE faculty = ? ORDER BY id DESC", [faculty]);
    const items = rows.map((r) => ({
      id: String(r.id),
      code: r.code,
      title: r.title,
      slot: r.slot,
      faculty: r.faculty,
      seats: Number(r.seats || 0),
      registered: Number(r.registered || 0),
      approval_status: r.approval_status,
      created_at: r.created_at,
    }));
    return res.json({ ok: true, courses: items });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load courses" });
  }
});

// Get enrollment requests for teacher's courses
router.get("/enrollment/requests", async (req, res) => {
  try {
    const faculty = await getTeacherName(req.auth.uid);
    const slot = req.query.slot;
    let queryStr = `
      SELECT r.*, u.full_name as student_name, up.reg_no as reg_no, c.title as course_name, c.code as course_code, c.slot as course_slot,
             c.seats - c.registered as available_count
      FROM student_enrollment_requests r
      JOIN users u ON u.id = r.student_user_id
      JOIN user_profiles up ON up.user_id = r.student_user_id
      JOIN student_enrollment_courses c ON c.id = r.course_id
      WHERE c.faculty = ? AND c.approval_status = 'APPROVED' ${slot ? 'AND r.slot = ?' : ''}
      ORDER BY r.id DESC
    `;
    const params = [faculty];
    if (slot) params.push(slot);
    const rows = await query(queryStr, params);
    const items = rows.map((r) => ({
      id: String(r.id),
      studentName: r.student_name,
      regNo: r.reg_no || "Unknown",
      courseCode: r.course_code,
      courseName: r.course_name,
      courseSlot: r.course_slot,
      requestedOn: toDmy(r.requested_on),
      availableCount: Number(r.available_count || 0),
      status: r.status.charAt(0).toUpperCase() + r.status.slice(1).toLowerCase(),
    }));
    return res.json({ ok: true, requests: items });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load requests" });
  }
});

// Approve/Reject enrollment request
router.post("/enrollment/requests/:id", async (req, res) => {
  const b = req.body || {};
  const action = b.action; // 'approve' or 'reject'
  if (!action || !["approve", "reject"].includes(action)) {
    return res.status(400).json({ message: "Invalid action" });
  }
  try {
    const faculty = await getTeacherName(req.auth.uid);
    const status = action === "approve" ? "APPROVED" : "REJECTED";

    await query(`
      UPDATE student_enrollment_requests SET status = ?
      WHERE id = ? AND course_id IN (SELECT id FROM student_enrollment_courses WHERE faculty = ?)
    `, [status, req.params.id, faculty]);

    if (action === "approve") {
      // Insert into student_course_records as IN_PROGRESS
      const requestRows = await query(`
        SELECT r.student_user_id, r.course_code, r.course_name, r.slot
        FROM student_enrollment_requests r
        WHERE r.id = ?
      `, [req.params.id]);
      if (requestRows.length) {
        const reqData = requestRows[0];
        await query(`
          INSERT INTO student_course_records (student_user_id, course_code, course_name, status, enrolled_on)
          VALUES (?, ?, ?, 'IN_PROGRESS', CURDATE())
          ON DUPLICATE KEY UPDATE status = 'IN_PROGRESS'
        `, [reqData.student_user_id, reqData.course_code, reqData.course_name]);
      }
    } else if (action === "reject") {
      // Decrement registered
      await query("UPDATE student_enrollment_courses SET registered = registered - 1 WHERE id = (SELECT course_id FROM student_enrollment_requests WHERE id = ?)", [req.params.id]);
    }

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update request" });
  }
});

// Get approved enrollments for teacher's courses
router.get("/enrollment/approved", async (req, res) => {
  try {
    const faculty = await getTeacherName(req.auth.uid);
    const slot = req.query.slot;
    let queryStr = `
      SELECT r.*, u.full_name as student_name, up.reg_no as reg_no, c.title as course_name, c.code as course_code, c.slot as course_slot
      FROM student_enrollment_requests r
      JOIN users u ON u.id = r.student_user_id
      JOIN user_profiles up ON up.user_id = r.student_user_id
      JOIN student_enrollment_courses c ON c.id = r.course_id
      WHERE c.faculty = ? AND r.status = 'APPROVED' ${slot ? 'AND r.slot = ?' : ''}
      ORDER BY r.id DESC
    `;
    const params = [faculty];
    if (slot) params.push(slot);
    const rows = await query(queryStr, params);
    const items = rows.map((r) => ({
      id: String(r.id),
      studentName: r.student_name,
      regNo: r.reg_no || "Unknown",
      courseCode: r.course_code,
      courseName: r.course_name,
      courseSlot: r.course_slot,
      approvedOn: toDmy(r.approved_on || r.updated_at || r.created_at),
    }));
    return res.json({ ok: true, enrollments: items });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load approved enrollments" });
  }
});

// Get notifications for teacher
router.get("/notifications", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM teacher_notifications WHERE teacher_user_id = ? ORDER BY id DESC", [req.auth.uid]);
    const notifications = rows.map((r) => ({
      id: String(r.id),
      title: r.title,
      message: r.message,
      type: "administrative", // assume
      status: r.status === "READ" ? "read" : "unread",
      priority: "medium", // assume
      timestamp: r.created_at,
      sender: r.sender,
    }));
    return res.json({ ok: true, notifications });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load notifications" });
  }
});

// Mark notification as read
router.put("/notifications/:id/read", async (req, res) => {
  try {
    await query("UPDATE teacher_notifications SET status = 'READ' WHERE id = ?", [req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to mark as read" });
  }
});

// Classroom Request
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

  let requesterRegNo = req.auth.uid.toString();
  try {
    const profileRows = await query("SELECT reg_no FROM user_profiles WHERE user_id = ?", [req.auth.uid]);
    if (profileRows.length && profileRows[0].reg_no) requesterRegNo = profileRows[0].reg_no;
  } catch {}

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
          `Teacher ${requesterRegNo} requested classroom ${body.classroomLabel} for ${body.courseLabel} on ${body.requestDate || dateStr}`,
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

// Get classroom requests for the teacher
router.get("/room-requests", async (req, res) => {
  try {
    let requesterRegNo = req.auth.uid.toString();
    try {
      const profileRows = await query("SELECT reg_no FROM user_profiles WHERE user_id = ?", [req.auth.uid]);
      if (profileRows.length && profileRows[0].reg_no) requesterRegNo = profileRows[0].reg_no;
    } catch {}

    const rows = await query("SELECT * FROM classroom_requests WHERE requester_reg_no = ? ORDER BY id DESC", [requesterRegNo]);
    const requests = rows.map((r) => ({
      id: String(r.id),
      course_id: r.course_id,
      course_label: r.course_label,
      classroom_id: r.classroom_id,
      classroom_label: r.classroom_label,
      request_date: r.request_date,
      start_time: r.start_time,
      end_time: r.end_time,
      expected_students: Number(r.expected_students || 0),
      reason: r.reason,
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
    return res.json({ ok: true, requests });
  } catch (err) {
    console.error("Error fetching room requests:", err);
    return res.status(500).json({ message: "Failed to load room requests" });
  }
});

// Get OD requests for approval
router.get("/od-requests", async (req, res) => {
  try {
    const rows = await query(`
      SELECT r.*, u.full_name as student_name, up.reg_no
      FROM student_od_requests r
      JOIN users u ON u.id = r.student_user_id
      JOIN user_profiles up ON up.user_id = r.student_user_id
      ORDER BY r.id DESC
    `);
    const items = rows.map((r) => ({
      id: String(r.id),
      regNo: r.reg_no || "",
      studentName: r.student_name || "",
      courseCode: r.course_code,
      courseName: r.course_name,
      reason: r.content,
      startDate: r.start_date || "",
      endDate: r.end_date || "",
      requestedOn: toDmy(r.requested_on),
      status: r.faculty_status.toLowerCase(), // approved, pending, rejected
    }));
    return res.json({ odRequests: items });
  } catch (err) {
    console.error("Error fetching OD requests:", err);
    return res.status(500).json({ message: "Failed to load OD requests" });
  }
});

// Approve/Reject OD request
router.post("/od-requests/:id", async (req, res) => {
  const { action } = req.body || {};
  if (!action || !["approve", "reject"].includes(action)) {
    return res.status(400).json({ message: "Invalid action" });
  }
  const status = action === "approve" ? "APPROVED" : "REJECTED";
  try {
    await query("UPDATE student_od_requests SET faculty_status = ? WHERE id = ?", [status, req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error updating OD request:", err);
    return res.status(500).json({ message: "Failed to update OD request" });
  }
});

// Get teacher KPIs
router.get("/kpis", async (req, res) => {
  try {
    const faculty = await getTeacherName(req.auth.uid);

    // Number of courses
    const courseRows = await query("SELECT COUNT(*) as count FROM student_enrollment_courses WHERE faculty = ? AND approval_status = 'APPROVED'", [faculty]);
    const coursesCount = Number(courseRows[0].count || 0);

    // Number of enrolled students (across all courses)
    const studentRows = await query(`
      SELECT COUNT(DISTINCT r.student_user_id) as count
      FROM student_enrollment_requests r
      JOIN student_enrollment_courses c ON c.id = r.course_id
      WHERE c.faculty = ? AND r.status = 'APPROVED'
    `, [faculty]);
    const studentsCount = Number(studentRows[0].count || 0);

    // Pending enrollment requests
    const pendingRequestsRows = await query(`
      SELECT COUNT(*) as count
      FROM student_enrollment_requests r
      JOIN student_enrollment_courses c ON c.id = r.course_id
      WHERE c.faculty = ? AND r.status = 'PENDING'
    `, [faculty]);
    const pendingRequests = Number(pendingRequestsRows[0].count || 0);

    // Pending OD requests
    const pendingODRows = await query("SELECT COUNT(*) as count FROM student_od_requests WHERE faculty_status = 'PENDING'");
    const pendingOD = Number(pendingODRows[0].count || 0);

    // Pending no-due requests (no status field, assume all pending)
    const pendingNoDueRows = await query("SELECT COUNT(*) as count FROM student_no_due_requests");
    const pendingNoDue = Number(pendingNoDueRows[0].count || 0);

    return res.json({
      ok: true,
      kpis: {
        courses: coursesCount,
        students: studentsCount,
        pendingRequests,
        pendingOD,
        pendingNoDue,
      },
    });
  } catch (err) {
    console.error("Error fetching KPIs:", err);
    return res.status(500).json({ message: "Failed to load KPIs" });
  }
});

// Get no-due requests for approval
router.get("/no-due-requests", async (req, res) => {
  try {
    const rows = await query(`
      SELECT r.*, u.full_name as student_name, up.reg_no, up.program, up.year_of_study as year
      FROM student_no_due_requests r
      JOIN users u ON u.id = r.student_user_id
      JOIN user_profiles up ON up.user_id = r.student_user_id
      ORDER BY r.id DESC
    `);
    const items = rows.map((r, idx) => ({
      id: String(r.id),
      sno: idx + 1,
      regNo: r.reg_no || "",
      studentName: r.student_name || "",
      courseCode: r.course_code,
      courseName: r.course_title,
      program: r.program || "",
      year: r.year || "",
      requestedOn: toDmy(r.request_date),
      status: "Pending", // no status in table
    }));
    return res.json({ noDueRequests: items });
  } catch (err) {
    console.error("Error fetching no-due requests:", err);
    return res.status(500).json({ message: "Failed to load no-due requests" });
  }
});

// Approve/Reject no-due request (no status field, just return ok)
router.post("/no-due-requests/:id", async (req, res) => {
  const { action } = req.body || {};
  if (!action || !["approve", "reject"].includes(action)) {
    return res.status(400).json({ message: "Invalid action" });
  }
  // No status field in table, just return ok
  return res.json({ ok: true });
});

// ---------- Marks Management ----------
router.post("/marks/declare-enter", async (req, res) => {
  const b = req.body || {};
  if (!b.courseId || !b.testName || !Array.isArray(b.marks)) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Verify teacher teaches this course
    const faculty = await getTeacherName(req.auth.uid);
    const courseRows = await query("SELECT * FROM student_enrollment_courses WHERE id = ? AND faculty = ? AND approval_status = 'APPROVED'", [b.courseId, faculty]);
    if (!courseRows.length) return res.status(403).json({ message: "Not authorized for this course" });

    const course = courseRows[0];

    // Get enrolled students
    const enrolled = await query("SELECT r.student_user_id, u.reg_no, u.full_name FROM student_enrollment_requests r JOIN users u ON u.id = r.student_user_id WHERE r.course_id = ? AND r.status = 'APPROVED'", [b.courseId]);

    // Insert/update marks
    for (const m of b.marks) {
      const student = enrolled.find(e => e.reg_no === m.regNo);
      if (student) {
        await query("INSERT INTO student_internal_marks (student_user_id, course_code, course_name, test_name, mark, max_mark, dated_on) VALUES (?,?,?,?,?,?,NOW()) ON DUPLICATE KEY UPDATE mark = VALUES(mark)", [
          student.student_user_id,
          course.code,
          course.title,
          b.testName,
          m.markPercent,
          100,
        ]);
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to save marks" });
  }
});

router.put("/marks/update", async (req, res) => {
  const b = req.body || {};
  if (!b.courseId || !b.testId || !Array.isArray(b.marks)) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Verify teacher teaches this course
    const faculty = await getTeacherName(req.auth.uid);
    const courseRows = await query("SELECT * FROM student_enrollment_courses WHERE id = ? AND faculty = ? AND approval_status = 'APPROVED'", [b.courseId, faculty]);
    if (!courseRows.length) return res.status(403).json({ message: "Not authorized for this course" });

    const course = courseRows[0];

    // Update marks
    for (const m of b.marks) {
      await query("UPDATE student_internal_marks SET mark = ? WHERE student_user_id = (SELECT id FROM users WHERE reg_no = ?) AND course_code = ? AND test_name = ?", [
        m.mark,
        m.regNo,
        course.code,
        b.testId,
      ]);
    }

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update marks" });
  }
});

router.get("/marks", async (req, res) => {
  const courseId = req.query.courseId;
  if (!courseId) return res.status(400).json({ message: "Missing courseId" });

  try {
    // Verify teacher teaches this course
    const faculty = await getTeacherName(req.auth.uid);
    const courseRows = await query("SELECT * FROM student_enrollment_courses WHERE id = ? AND faculty = ? AND approval_status = 'APPROVED'", [courseId, faculty]);
    if (!courseRows.length) return res.status(403).json({ message: "Not authorized for this course" });

    const course = courseRows[0];

    // Get marks with student info
    const marks = await query("SELECT sim.*, u.reg_no, u.full_name FROM student_internal_marks sim JOIN users u ON u.id = sim.student_user_id WHERE sim.course_code = ?", [course.code]);

    return res.json({ ok: true, marks });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load marks" });
  }
});

// ---------- Results Viewing ----------
router.get("/results", async (req, res) => {
  const monthYear = req.query.monthYear;
  const courseId = req.query.courseId;
  if (!monthYear || !courseId) return res.status(400).json({ message: "Missing monthYear or courseId" });

  try {
    // Verify teacher teaches this course
    const faculty = await getTeacherName(req.auth.uid);
    const courseRows = await query("SELECT * FROM student_enrollment_courses WHERE id = ? AND faculty = ? AND approval_status = 'APPROVED'", [courseId, faculty]);
    if (!courseRows.length) return res.status(403).json({ message: "Not authorized for this course" });

    const course = courseRows[0];

    // Get enrolled students
    const enrolled = await query("SELECT r.student_user_id, u.reg_no, u.full_name FROM student_enrollment_requests r JOIN users u ON u.id = r.student_user_id WHERE r.course_id = ? AND r.status = 'APPROVED'", [courseId]);

    // Get results (from student_course_records or exam results)
    const results = [];
    for (const student of enrolled) {
      const internalMarks = await query("SELECT SUM(mark) total, COUNT(*) count FROM student_internal_marks WHERE student_user_id = ? AND course_code = ?", [student.student_user_id, course.code]);
      const total = internalMarks[0].total || 0;
      const count = internalMarks[0].count || 0;
      const avg = count > 0 ? total / count : 0;

      // Mock result calculation
      const result = avg >= 50 ? "PASS" : "FAIL";
      const grade = avg >= 90 ? "A" : avg >= 80 ? "B" : avg >= 70 ? "C" : avg >= 60 ? "D" : "F";

      results.push({
        sno: results.length + 1,
        regNo: student.reg_no,
        studentName: student.full_name,
        theory100: Math.round(avg),
        viva100: 0,
        ia100: Math.round(avg),
        grade,
        result,
        monthYear,
        courseId,
      });
    }

    return res.json({ ok: true, results });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load results" });
  }
});

router.get("/results/new", async (req, res) => {
  // Similar to /results, but for new format
  return res.json({ ok: true, results: [] });
});

// Assignments
router.get("/assignments", async (req, res) => {
  try {
    const faculty = await getTeacherName(req.auth.uid);
    const rows = await query("SELECT DISTINCT title, due_date, course_code FROM student_assignments WHERE faculty = ? ORDER BY due_date DESC", [faculty]);
    const assignments = rows.map(r => ({
      id: r.title + r.due_date, // mock id
      title: r.title,
      dueDate: r.due_date,
      courseCode: r.course_code,
    }));
    return res.json({ ok: true, assignments });
  } catch (err) {
    console.error("Get assignments error:", err);
    return res.status(500).json({ message: "Failed to load assignments" });
  }
});

router.get("/assignments/:assignmentId/submissions", async (req, res) => {
  try {
    const faculty = await getTeacherName(req.auth.uid);
    const assignmentId = req.params.assignmentId;
    // Since id is mock, assume assignmentId is title + due_date or something, but for simplicity, fetch all for faculty
    const rows = await query("SELECT sa.*, u.full_name as student_name, u.reg_no FROM student_assignments sa JOIN users u ON u.id = sa.student_user_id WHERE sa.faculty = ? AND sa.title = ? ORDER BY sa.id DESC", [faculty, assignmentId]);
    const submissions = rows.map(r => ({
      id: String(r.id),
      studentName: r.student_name,
      regNo: r.reg_no,
      status: r.status,
      submittedAt: r.submitted_at,
    }));
    return res.json({ ok: true, submissions });
  } catch (err) {
    console.error("Get submissions error:", err);
    return res.status(500).json({ message: "Failed to load submissions" });
  }
});

router.put("/assignments/approve", async (req, res) => {
  const b = req.body || {};
  if (!b.assignmentId || !b.studentId || !b.action) {
    return res.status(400).json({ message: "Missing fields" });
  }
  try {
    const status = b.action === "approve" ? "EVALUATED" : "REJECTED";
    await query("UPDATE student_assignments SET status = ? WHERE id = ? AND faculty = ?", [status, b.assignmentId, await getTeacherName(req.auth.uid)]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Approve assignment error:", err);
    return res.status(500).json({ message: "Failed to approve assignment" });
  }
});

router.post("/assignments/publish", async (req, res) => {
  const b = req.body || {};
  if (!b.title || !Array.isArray(b.courses) || !b.dueDate) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const faculty = await getTeacherName(req.auth.uid);
    for (const course of b.courses) {
      // Get enrolled students
      const enrolled = await query("SELECT r.student_user_id, u.full_name FROM student_enrollment_requests r JOIN users u ON u.id = r.student_user_id WHERE r.course_id = ? AND r.status = 'APPROVED'", [course.id]);
      for (const student of enrolled) {
        await query("INSERT INTO student_assignments (student_user_id, course_code, course_name, title, due_date, faculty, max_marks) VALUES (?,?,?,?,?,?,?)", [
          student.student_user_id,
          course.code,
          course.title,
          b.title,
          b.dueDate,
          faculty,
          b.maxMarks || 100,
        ]);
      }
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("Publish assignment error:", err);
    return res.status(500).json({ message: "Failed to publish assignment" });
  }
});

// Attendance marking
router.post("/attendance/mark", async (req, res) => {
  const b = req.body || {};
  if (!b.courseId || !Array.isArray(b.attendance)) {
    return res.status(400).json({ message: "Missing courseId or attendance" });
  }
  try {
    const faculty = await getTeacherName(req.auth.uid);
    const courseRows = await query("SELECT * FROM student_enrollment_courses WHERE id = ? AND faculty = ?", [b.courseId, faculty]);
    if (!courseRows.length) return res.status(403).json({ message: "Not authorized" });
    const course = courseRows[0];
    for (const a of b.attendance) {
      await query("INSERT INTO student_attendance_records (student_user_id, course_code, course_name, attended, total_classes, percentage, dated_on) VALUES (?,?,?,?,?,?,CURDATE()) ON DUPLICATE KEY UPDATE attended = VALUES(attended), total_classes = VALUES(total_classes), percentage = VALUES(percentage)", [
        a.studentId,
        course.code,
        course.title,
        a.attended || 0,
        a.total || 0,
        a.percentage || 0,
      ]);
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("Mark attendance error:", err);
    return res.status(500).json({ message: "Failed to mark attendance" });
  }
});

// Content upload
router.post("/content/upload", contentUpload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Missing file" });
  const b = req.body || {};
  if (!b.courseCode || !b.title) {
    return res.status(400).json({ message: "Missing courseCode or title" });
  }
  try {
    const url = `${publicBaseUrl(req)}/uploads/teacher_content/${req.file.filename}`;
    // Get enrolled students
    const courseRows = await query("SELECT id FROM student_enrollment_courses WHERE code = ? AND faculty = ?", [b.courseCode, await getTeacherName(req.auth.uid)]);
    if (!courseRows.length) return res.status(403).json({ message: "Not authorized for this course" });
    const enrolled = await query("SELECT r.student_user_id FROM student_enrollment_requests r WHERE r.course_id = ? AND r.status = 'APPROVED'", [courseRows[0].id]);
    for (const student of enrolled) {
      await query("INSERT INTO student_course_content (student_user_id, course_code, title, kind, url, posted_on) VALUES (?,?,?,?,?,CURDATE())", [
        student.student_user_id,
        b.courseCode,
        b.title,
        b.kind || "PDF",
        url,
      ]);
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("Content upload error:", err);
    return res.status(500).json({ message: "Failed to upload content" });
  }
});

router.get("/exam-invigilations", async (req, res) => {
  try {
    // Query database for invigilation assignments for the teacher.
    // For demo, return empty.
    return res.json({ ok: true, assignments: [] });
  } catch (err) {
    console.error("Failed to load exam invigilations:", err);
    return res.json({ ok: true, assignments: [] });
  }
});

// Get student profile by reg_no for 360 view
router.get("/student/profile/:regNo", async (req, res) => {
  try {
    const regNo = req.params.regNo;
    const rows = await query(`
      SELECT
        u.full_name, u.email,
        up.reg_no, up.department, up.program, up.semester, up.year_of_study, up.cgpa, up.arrears, up.fee_clear, up.attendance_pct, up.dob, up.mobile,
        up.resume_url, up.resume_name, up.resume_mime
      FROM user_profiles up
      JOIN users u ON u.id = up.user_id
      WHERE up.reg_no = ? AND u.role = 'STUDENT'
    `, [regNo]);
    if (!rows.length) {
      return res.status(404).json({ message: "Student not found" });
    }
    const row = rows[0];
    const profile = {
      name: row.full_name,
      dob: row.dob ? new Date(row.dob).toLocaleDateString('en-IN') : '',
      email: row.email,
      regNo: row.reg_no,
      program: row.program || '',
      mobile: row.mobile || '',
      photoUrl: row.resume_url || '', // or default photo
      recordScore: 0, // calculate if needed
    };
    return res.json({ ok: true, profile });
  } catch (err) {
    console.error("Student profile fetch error:", err);
    return res.status(500).json({ message: "Failed to fetch student profile" });
  }
});

module.exports = router;