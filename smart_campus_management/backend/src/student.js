const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { query } = require("./db");
const { requireStudent, toDmy, toDmyHm, parseDmyToDate, publicBaseUrl } = require("./utils");

const router = express.Router();

router.get("/enrollment/courses", async (req, res) => {
  try {
    const slot = req.query.slot;
    console.log('TEST: Enrollment courses request - slot:', JSON.stringify(slot));

    let queryStr = "SELECT * FROM student_enrollment_courses WHERE approval_status = 'APPROVED'";
    let params = [];

    if (slot && slot.trim()) {
      queryStr += " AND slot = ?";
      params.push(slot.trim());
    }

    queryStr += " ORDER BY id DESC";

    const rows = await query(queryStr, params);

    const items = rows.map((r) => ({
      id: String(r.id),
      code: r.code,
      title: r.title,
      faculty: r.faculty,
      seats: Number(r.seats || 0),
      registered: Number(r.registered || 0),
      availableSeats: Number(r.seats || 0) - Number(r.registered || 0),
      slot: r.slot,
    }));

    return res.json({ ok: true, courses: items });
  } catch (err) {
    console.error('TEST: Error in enrollment courses:', err);
    return res.status(500).json({ message: "Failed to load enrollment courses" });
  }
});

router.get("/enrollment/slots", async (req, res) => {
  try {
    const rows = await query("SELECT DISTINCT slot FROM student_enrollment_courses WHERE approval_status = 'APPROVED' ORDER BY slot");
    const slots = rows.map(r => r.slot);
    return res.json({ ok: true, slots });
  } catch (err) {
    console.error('TEST: Error in enrollment slots:', err);
    return res.status(500).json({ message: "Failed to load enrollment slots" });
  }
});

// For testing: set default auth if not present
router.use((req, res, next) => {
  if (!req.auth) {
    req.auth = { uid: 3 }; // Default student user ID (Alex Rodriguez)
  }
  next();
});

router.use(requireStudent);

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

const resumeUpload = multer({ storage: storage("student_resumes") });
const infraUpload = multer({ storage: storage("student_infra") });
const offersUpload = multer({ storage: storage("student_offers") });

router.get("/profile", async (req, res) => {
  return res.json({ profile: req.studentProfileResponse });
});

router.put("/profile", async (req, res) => {
  const b = req.body || {};
  try {
    if (b.name) {
      await query("UPDATE users SET full_name = ? WHERE id = ?", [b.name, req.auth.uid]);
    }
    await query(
      "UPDATE user_profiles SET reg_no=?, dob=?, program=?, department=?, semester=?, year_of_study=?, mobile=?, cgpa=?, arrears=?, attendance_pct=?, fee_clear=? WHERE user_id = ?",
      [
        b.regNo || null,
        b.dob || null,
        b.program || null,
        b.department || null,
        b.semester || null,
        b.year || null,
        b.mobile || null,
        b.cgpa || 0,
        b.backlogs || 0,
        b.attendance || 0,
        b.noDueClear ? 1 : 0,
        req.auth.uid,
      ]
    );
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update profile" });
  }
});

router.get("/profile/records", async (req, res) => {
  const status = String(req.query.status || "").toLowerCase();
  const deleted = status === "deleted" ? 1 : 0;
  try {
    const rows = await query(
      "SELECT * FROM student_records WHERE student_user_id = ? AND deleted = ? ORDER BY id DESC",
      [req.auth.uid, deleted]
    );
    const records = rows.map((r) => ({
      id: String(r.id),
      type: r.record_type,
      details: r.details,
      datedOn: toDmy(r.dated_on),
      fileName: r.file_name,
      fileMime: r.file_mime,
      fileDataUrl: r.file_data_url,
      deleted: Boolean(r.deleted),
      deletedAt: r.deleted_at ? toDmy(r.deleted_at) : undefined,
    }));
    return res.json({ ok: true, records });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load records" });
  }
});

router.post("/profile/records", async (req, res) => {
  const b = req.body || {};
  if (!b.type || !b.details || !b.datedOn) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const dated = parseDmyToDate(b.datedOn) || b.datedOn;
    const result = await query(
      "INSERT INTO student_records (student_user_id, record_type, details, dated_on, file_name, file_mime, file_data_url) VALUES (?,?,?,?,?,?,?)",
      [req.auth.uid, b.type, b.details, dated, b.fileName || null, b.fileMime || null, b.fileDataUrl || null]
    );
    return res.json({ ok: true, id: String(result.insertId) });
  } catch (err) {
    return res.status(500).json({ message: "Failed to add record" });
  }
});

router.delete("/profile/records/:id", async (req, res) => {
  try {
    await query("UPDATE student_records SET deleted=1, deleted_at=CURDATE() WHERE id=? AND student_user_id=?", [
      req.params.id,
      req.auth.uid,
    ]);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete record" });
  }
});

router.get("/profile/resume", async (req, res) => {
  try {
    const rows = await query("SELECT resume_url, resume_name, resume_mime FROM user_profiles WHERE user_id = ?", [
      req.auth.uid,
    ]);
    const row = rows[0] || {};
    return res.json({
      ok: true,
      resume_url: row.resume_url || "",
      resume_name: row.resume_name || "",
      resume_mime: row.resume_mime || "",
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load resume" });
  }
});

router.post("/profile/resume", resumeUpload.single("resume"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Missing resume file" });
  try {
    const url = `${publicBaseUrl(req)}/uploads/student_resumes/${req.file.filename}`;
    await query("UPDATE user_profiles SET resume_url=?, resume_name=?, resume_mime=? WHERE user_id=?", [
      url,
      req.file.originalname || req.file.filename,
      req.file.mimetype || "",
      req.auth.uid,
    ]);
    return res.json({ ok: true, resume_url: url });
  } catch (err) {
    return res.status(500).json({ message: "Failed to save resume" });
  }
});

router.delete("/profile/resume", async (req, res) => {
  try {
    await query("UPDATE user_profiles SET resume_url=NULL, resume_name=NULL, resume_mime=NULL WHERE user_id=?", [
      req.auth.uid,
    ]);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to remove resume" });
  }
});

router.get("/summary", async (req, res) => {
  try {
    const profileRows = await query("SELECT attendance_pct, fee_clear FROM user_profiles WHERE user_id = ?", [
      req.auth.uid,
    ]);
    const profile = profileRows[0] || {};
    const marks = await query(
      "SELECT mark, max_mark FROM student_internal_marks WHERE student_user_id = ?",
      [req.auth.uid]
    );
    let avgPct = 0;
    if (marks.length) {
      const total = marks.reduce((sum, m) => sum + Number(m.mark || 0), 0);
      const max = marks.reduce((sum, m) => sum + Number(m.max_mark || 0), 0);
      avgPct = max > 0 ? Math.round((total / max) * 100) : 0;
    }
    const offers = await query(
      "SELECT status FROM student_offers WHERE student_user_id = ? ORDER BY id DESC LIMIT 1",
      [req.auth.uid]
    );
    return res.json({
      ok: true,
      summary: {
        attendancePct: Number(profile.attendance_pct || 0),
        internalMarksPct: avgPct,
        noDueClear: Boolean(profile.fee_clear),
        offerStatus: offers[0]?.status || "NONE",
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load summary" });
  }
});

router.get("/notifications", async (req, res) => {
  try {
    const rows = await query(
      "SELECT * FROM student_notifications WHERE student_user_id = ? ORDER BY id DESC",
      [req.auth.uid]
    );
    const items = rows.map((r) => ({
      id: String(r.id),
      by: r.sender || "Admin",
      dateLabel: toDmy(r.created_at),
      body: r.message,
      hasDownload: Boolean(r.has_download),
      downloadUrl: r.download_url || null,
    }));
    return res.json({ ok: true, items });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load notifications" });
  }
});

router.get("/attendance/report", async (req, res) => {
  try {
    const rows = await query(
      "SELECT * FROM student_attendance_records WHERE student_user_id = ? ORDER BY dated_on DESC",
      [req.auth.uid]
    );
    const out = rows.map((r) => ({
      id: String(r.id),
      courseCode: r.course_code,
      courseName: r.course_name,
      totalClasses: Number(r.total_classes || 0),
      attended: Number(r.attended || 0),
      percentage: Number(r.percentage || 0),
      datedOn: toDmy(r.dated_on),
    }));
    return res.json({ ok: true, rows: out });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load attendance report" });
  }
});

router.get("/attendance/od-requests", async (req, res) => {
  try {
    const rows = await query(
      "SELECT * FROM student_od_requests WHERE student_user_id = ? ORDER BY id DESC",
      [req.auth.uid]
    );
    const out = rows.map((r) => ({
      id: String(r.id),
      courseCode: r.course_code,
      courseName: r.course_name,
      requestedOn: toDmy(r.requested_on),
      reason: r.content,
      status: r.faculty_status.toLowerCase(), // approved, pending, rejected
    }));
    return res.json({ ok: true, rows: out });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load OD requests" });
  }
});

router.post("/attendance/od-requests", async (req, res) => {
  const b = req.body || {};
  if (!b.courseCode || !b.courseName || !b.reason || !b.startDate || !b.endDate) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    await query(
      "INSERT INTO student_od_requests (student_user_id, course_code, course_name, start_date, end_date, requested_on, content) VALUES (?,?,?,?,?,CURDATE(),?)",
      [req.auth.uid, b.courseCode, b.courseName, b.startDate, b.endDate, b.reason]
    );
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to submit OD request" });
  }
});



router.get("/assignments", async (req, res) => {
  try {
    const rows = await query(
      "SELECT * FROM student_assignments WHERE student_user_id = ? ORDER BY id DESC",
      [req.auth.uid]
    );
    const out = rows.map((r) => ({
      id: String(r.id),
      courseCode: r.course_code,
      courseName: r.course_name,
      title: r.title,
      dueDate: r.due_date,
      status: r.status,
    }));
    return res.json({ ok: true, assignments: out });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load assignments" });
  }
});

router.get("/assignments/content", async (req, res) => {
  try {
    const rows = await query(
      "SELECT * FROM student_course_content WHERE student_user_id = ? ORDER BY id DESC",
      [req.auth.uid]
    );
    const out = rows.map((r) => ({
      id: String(r.id),
      courseCode: r.course_code,
      courseName: r.course_name,
      title: r.title,
      contentType: r.content_type,
      url: r.url,
      uploadedAt: toDmy(r.uploaded_at),
    }));
    return res.json({ ok: true, content: out });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load content" });
  }
});

router.get("/assignments/exams", async (req, res) => {
  try {
    const rows = await query(
      "SELECT * FROM student_exam_schedule WHERE student_user_id = ? ORDER BY exam_date ASC",
      [req.auth.uid]
    );
    const out = rows.map((r) => ({
      id: String(r.id),
      courseCode: r.course_code,
      courseName: r.course_name,
      examDate: r.exam_date,
      startTime: r.start_time,
      endTime: r.end_time,
      room: r.room || "TBA",
    }));
    return res.json({ ok: true, exams: out });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load exams" });
  }
});



router.get("/enrollment/decisions", async (req, res) => {
  try {
    const rows = await query(`
      SELECT r.slot, r.course_id, r.status
      FROM student_enrollment_requests r
      WHERE r.student_user_id = ?
      ORDER BY r.id DESC
    `, [req.auth.uid]);

    // Group decisions by slot and course, keeping the latest status per course
    const decisionsBySlot = {};
    rows.forEach((r) => {
      const slot = r.slot;
      const courseId = String(r.course_id);
      if (!decisionsBySlot[slot]) {
        decisionsBySlot[slot] = {};
      }
      if (!(courseId in decisionsBySlot[slot])) {
        // Only set if not already set (since ordered by DESC, first one is latest)
        decisionsBySlot[slot][courseId] = r.status;
      }
    });

    return res.json({ ok: true, decisions: decisionsBySlot });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load decisions" });
  }
});

router.post("/enrollment/requests", async (req, res) => {
  const b = req.body || {};
  if (!b.slot || !b.courseId) {
    return res.status(400).json({ message: "Missing slot or courseId" });
  }
  try {
    // Check if already requested for this slot
    const existing = await query("SELECT id FROM student_enrollment_requests WHERE student_user_id = ? AND slot = ? AND status IN ('PENDING', 'APPROVED')", [req.auth.uid, b.slot]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "You already have a pending or approved enrollment request for this slot." });
    }
    // Check if seats available before incrementing
    const courseRows = await query("SELECT seats, registered FROM student_enrollment_courses WHERE id = ?", [b.courseId]);
    if (!courseRows.length) {
      return res.status(404).json({ message: "Course not found" });
    }
    const course = courseRows[0];
    if (course.registered >= course.seats) {
      return res.status(400).json({ message: "No seats available" });
    }
    // Increment registered
    await query("UPDATE student_enrollment_courses SET registered = registered + 1 WHERE id = ?", [b.courseId]);
    // Insert request
    const course2 = courseRows[0]; // already have
    await query(
      "INSERT INTO student_enrollment_requests (student_user_id, slot, course_id, course_code, course_name, status, requested_on) VALUES (?,?,?,?,?,?,CURDATE())",
      [req.auth.uid, b.slot, b.courseId, course2.code || "", course2.title || "", "PENDING"]
    );
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to submit enrollment request" });
  }
});

router.get("/disciplinary", async (req, res) => {
  try {
    const rows = await query(
      "SELECT * FROM student_disciplinary_cases WHERE student_user_id = ? ORDER BY id DESC",
      [req.auth.uid]
    );
    const out = rows.map((r) => ({
      id: String(r.id),
      title: r.title,
      severity: r.severity,
      status: r.status,
      reportedOn: toDmy(r.reported_on),
    }));
    return res.json({ ok: true, rows: out });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load disciplinary records" });
  }
});

router.get("/fees", async (req, res) => {
  try {
    // Load dues
    const duesRows = await query(
      "SELECT * FROM student_fee_dues WHERE student_user_id = ? ORDER BY due_date DESC",
      [req.auth.uid]
    );
    const dues = duesRows.map((r) => ({
      id: String(r.id),
      feeType: r.fee_type,
      amount: Number(r.amount || 0),
      dueDate: toDmy(r.due_date),
      status: r.status === "PAID" ? "Paid" : r.status === "OVERDUE" ? "Overdue" : "Pending",
    }));

    // Load payments
    const profileRows = await query("SELECT reg_no FROM user_profiles WHERE user_id = ?", [req.auth.uid]);
    const regNo = profileRows[0]?.reg_no;
    let payments = [];
    if (regNo) {
      const paymentRows = await query("SELECT * FROM fee_payments WHERE reg_no = ? ORDER BY paid_on DESC", [regNo]);
      payments = paymentRows.map((r) => ({
        id: String(r.id),
        feeType: r.fee_type || "GENERAL",
        amount: Number(r.amount || 0),
        mode: r.method === "ONLINE" ? "Online" : r.method === "CASH" ? "Cash" : r.method === "BANK" ? "Bank" : r.method,
        reference: r.ref_no || "",
        datedOn: `${toDmy(r.paid_on)} ${new Date(r.paid_on).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
      }));
    }

    return res.json({ dues, payments });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load financial record" });
  }
});

router.get("/fees/dues", async (req, res) => {
  try {
    const rows = await query(
      "SELECT * FROM student_fee_dues WHERE student_user_id = ? ORDER BY due_date DESC",
      [req.auth.uid]
    );
    const out = rows.map((r) => ({
      id: String(r.id),
      feeType: r.fee_type,
      amount: Number(r.amount || 0),
      dueDate: r.due_date,
      status: r.status === "PAID" ? "Paid" : r.status === "OVERDUE" ? "Overdue" : "Pending",
    }));
    return res.json({ ok: true, dues: out });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load fee dues" });
  }
});

router.get("/fees/payments", async (req, res) => {
  try {
    const profileRows = await query("SELECT reg_no FROM user_profiles WHERE user_id = ?", [req.auth.uid]);
    const regNo = profileRows[0]?.reg_no;
    if (!regNo) return res.json({ ok: true, payments: [] });
    const rows = await query("SELECT * FROM fee_payments WHERE reg_no = ? ORDER BY paid_on DESC", [regNo]);
    const out = rows.map((r) => ({
      id: String(r.id),
      amount: Number(r.amount || 0),
      method: r.method,
      status: r.status,
      datedOn: toDmy(r.paid_on),
      refNo: r.ref_no,
      feeType: r.fee_type || null,
    }));
    return res.json({ ok: true, payments: out });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load payments" });
  }
});

router.get("/infra-issues", async (req, res) => {
  try {
    const rows = await query(
      "SELECT * FROM student_infra_issues WHERE student_user_id = ? ORDER BY id DESC",
      [req.auth.uid]
    );
    const out = rows.map((r) => ({
      id: String(r.id),
      content: r.content,
      location: r.location,
      status: r.status,
      createdAt: toDmy(r.created_at),
      fileUrl: r.file_url || "",
      fileName: r.file_name || "",
      fileType: r.file_type || "",
    }));
    return res.json({ ok: true, issues: out });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load issues" });
  }
});

router.post("/infra-issues", infraUpload.single("file"), async (req, res) => {
  const b = req.body || {};
  if (!b.content || !b.location) {
    return res.status(400).json({ message: "Missing content or location" });
  }
  try {
    let fileUrl = null;
    let fileName = null;
    let fileType = null;
    if (req.file) {
      fileUrl = `${publicBaseUrl(req)}/uploads/student_infra/${req.file.filename}`;
      fileName = req.file.originalname || req.file.filename;
      fileType = req.file.mimetype || "";
    }
    await query(
      "INSERT INTO student_infra_issues (student_user_id, content, location, file_name, file_url, file_type, created_at, status) VALUES (?,?,?,?,?,?,NOW(),?)",
      [req.auth.uid, b.content, b.location, fileName, fileUrl, fileType, "SUBMITTED"]
    );
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to submit issue" });
  }
});

router.get("/offers", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM student_offers WHERE student_user_id = ? ORDER BY id DESC", [
      req.auth.uid,
    ]);
    const out = rows.map((r) => ({
      id: String(r.id),
      company: r.company_name,
      salary: Number(r.salary || 0),
      offerDate: r.offer_date,
      status: r.status,
      fileUrl: r.file_url || "",
      fileName: r.file_name || "",
    }));
    return res.json({ ok: true, offers: out });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load offers" });
  }
});

router.post("/offers", offersUpload.single("file"), async (req, res) => {
  const b = req.body || {};
  if (!b.company || !b.salary || !b.offerDate) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    let fileUrl = null;
    let fileName = null;
    if (req.file) {
      fileUrl = `${publicBaseUrl(req)}/uploads/student_offers/${req.file.filename}`;
      fileName = req.file.originalname || req.file.filename;
    }
    const result = await query(
      "INSERT INTO student_offers (student_user_id, company_name, salary, offer_date, file_name, file_url, status, created_at) VALUES (?,?,?,?,?,?,?,NOW())",
      [req.auth.uid, b.company, Number(b.salary || 0), b.offerDate, fileName, fileUrl, "SUBMITTED"]
    );
    return res.json({ ok: true, id: String(result.insertId) });
  } catch (err) {
    return res.status(500).json({ message: "Failed to save offer" });
  }
});

router.delete("/offers/:id", async (req, res) => {
  try {
    await query("DELETE FROM student_offers WHERE id = ? AND student_user_id = ?", [req.params.id, req.auth.uid]);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete offer" });
  }
});

router.get("/courses/status", async (req, res) => {
  try {
    const inProgressRecords = await query(
      "SELECT * FROM student_course_records WHERE student_user_id = ? AND status = 'IN_PROGRESS' ORDER BY id DESC",
      [req.auth.uid]
    );

    // Also fetch approved enrollments
    const approvedEnrollments = await query(`
      SELECT r.id, r.course_code, r.course_name, r.requested_on AS enroll_on
      FROM student_enrollment_requests r
      WHERE r.student_user_id = ? AND r.status = 'APPROVED'
      ORDER BY r.id DESC
    `, [req.auth.uid]);

    const inProgress = [
      ...inProgressRecords.map(r => ({
        courseCode: r.course_code,
        courseName: r.course_name,
        status: r.status,
        enrollOn: toDmy(r.enrolled_on || r.created_at),
        type: "in_progress"
      })),
      ...approvedEnrollments.map(r => ({
        courseCode: r.course_code,
        courseName: r.course_name,
        status: "Approved",
        enrollOn: toDmy(r.enroll_on),
        type: "approved"
      }))
    ];

    const completed = await query(
      "SELECT * FROM student_course_records WHERE student_user_id = ? AND status = 'COMPLETED' ORDER BY id DESC",
      [req.auth.uid]
    );

    const grad = await query(
      "SELECT * FROM student_graduation_status WHERE student_user_id = ? ORDER BY id DESC LIMIT 1",
      [req.auth.uid]
    );
    const graduation = grad[0]
      ? {
          programElective: { completed: Number(grad[0].program_elective_completed || 0), total: Number(grad[0].program_elective_total || 0) },
          programCore: { completed: Number(grad[0].program_core_completed || 0), total: Number(grad[0].program_core_total || 0) },
          universityCore: { completed: Number(grad[0].university_core_completed || 0), total: Number(grad[0].university_core_total || 0) },
          universityElective: { completed: Number(grad[0].university_elective_completed || 0), total: Number(grad[0].university_elective_total || 0) },
        }
      : {
          programElective: { completed: 0, total: 0 },
          programCore: { completed: 0, total: 0 },
          universityCore: { completed: 0, total: 0 },
          universityElective: { completed: 0, total: 0 },
        };
    return res.json({ ok: true, inProgress, completed, graduation });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load course status" });
  }
});

router.get("/feedback/courses", async (req, res) => {
  try {
    const inProgress = await query(
      "SELECT * FROM student_course_records WHERE student_user_id = ? AND status = 'IN_PROGRESS' ORDER BY id DESC",
      [req.auth.uid]
    );
    const completed = await query(
      "SELECT * FROM student_course_records WHERE student_user_id = ? AND status = 'COMPLETED' ORDER BY id DESC",
      [req.auth.uid]
    );
    return res.json({ ok: true, inProgress, completed });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load feedback courses" });
  }
});

router.post("/feedback", async (req, res) => {
  const b = req.body || {};
  if (!b.courseCode || !Number.isFinite(Number(b.rating))) {
    return res.status(400).json({ message: "Missing courseCode or rating" });
  }
  try {
    await query(
      "INSERT INTO student_course_feedback (student_user_id, course_code, course_name, rating, comment, submitted_at) VALUES (?,?,?,?,?,NOW())",
      [req.auth.uid, b.courseCode, b.courseName || "", Number(b.rating || 0), b.comment || null]
    );
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to submit feedback" });
  }
});

router.get("/exams/no-due", async (req, res) => {
  try {
    const rows = await query(
      "SELECT * FROM student_no_due_requests WHERE student_user_id = ? ORDER BY id DESC",
      [req.auth.uid]
    );
    const items = rows.map((r) => ({
      id: String(r.id),
      courseCode: r.course_code,
      courseTitle: r.course_title,
      studentName: "",
      requestDate: toDmy(r.request_date),
      steps: JSON.parse(r.steps_json || "[]"),
    }));
    return res.json({ ok: true, items });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load no due requests" });
  }
});

router.get("/exams/eligibility", async (req, res) => {
  try {
    const profileRows = await query(
      "SELECT attendance_pct, fee_clear FROM user_profiles WHERE user_id = ?",
      [req.auth.uid]
    );
    const profile = profileRows[0] || {};
    const attendancePct = Number(profile.attendance_pct || 0);
    const minAttendancePct = 75;
    const feeStatus = profile.fee_clear ? "CLEAR" : "DUE";
    const noDueOk = profile.fee_clear ? true : false;
    const reasons = [];
    if (attendancePct < minAttendancePct) reasons.push(`Attendance ${attendancePct}% < ${minAttendancePct}%`);
    if (!profile.fee_clear) reasons.push("Fee status is DUE / HOLD");
    return res.json({
      ok: true,
      eligibility: {
        attendancePct,
        minAttendancePct,
        feeStatus,
        noDueOk,
        eligible: reasons.length === 0,
        reasons,
        computedAt: toDmyHm(new Date().toISOString()),
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to compute eligibility" });
  }
});

router.get("/exams/internal-marks", async (req, res) => {
  try {
    const rows = await query(
      "SELECT * FROM student_internal_marks WHERE student_user_id = ? ORDER BY dated_on DESC",
      [req.auth.uid]
    );
    const out = rows.map((r) => ({
      id: String(r.id),
      courseCode: r.course_code,
      courseName: r.course_name,
      testName: r.test_name,
      mark: Number(r.mark || 0),
      maxMark: Number(r.max_mark || 0),
      datedOn: toDmy(r.dated_on),
    }));
    return res.json({ ok: true, rows: out });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load internal marks" });
  }
});

router.get("/exams/revaluation", async (req, res) => {
  try {
    const rows = await query(
      "SELECT * FROM student_revaluation_requests WHERE student_user_id = ? ORDER BY id DESC",
      [req.auth.uid]
    );
    const out = rows.map((r) => ({
      id: String(r.id),
      courseCode: r.course_code,
      courseName: r.course_name,
      grade: r.grade,
      marks: Number(r.marks || 0),
      status: r.status,
      requestedOn: toDmy(r.requested_on),
    }));
    return res.json({ ok: true, rows: out });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load revaluation requests" });
  }
});

router.post("/exams/revaluation", async (req, res) => {
  const b = req.body || {};
  if (!b.courseCode || !b.courseName || !b.grade) {
    return res.status(400).json({ message: "Missing course details" });
  }
  try {
    const result = await query(
      "INSERT INTO student_revaluation_requests (student_user_id, course_code, course_name, grade, marks, status, requested_on) VALUES (?,?,?,?,?,?,CURDATE())",
      [req.auth.uid, b.courseCode, b.courseName, b.grade, Number(b.marks || 0), "INITIATED"]
    );
    return res.json({ ok: true, id: String(result.insertId) });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create request" });
  }
});

router.put("/exams/revaluation/:id", async (req, res) => {
  const b = req.body || {};
  try {
    await query("UPDATE student_revaluation_requests SET status = ? WHERE id = ? AND student_user_id = ?", [
      b.status || "PENDING",
      req.params.id,
      req.auth.uid,
    ]);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update request" });
  }
});

router.get("/classroom-allocations", async (_req, res) => {
  try {
    // For exams: from exam_hall_tickets and exam_hall_ticket_items
    const examRows = await query(`
      SELECT ehti.*, eht.ticket_no, eht.session_id, es.title as session_title, exs.course_code, exs.course_name, es.start_date, es.end_date, exs.exam_date, exs.start_time, exs.end_time, exs.batch, c.room_code, c.building
      FROM exam_hall_ticket_items ehti
      JOIN exam_hall_tickets eht ON eht.id = ehti.ticket_id
      JOIN exam_subjects exs ON exs.id = ehti.exam_subject_id
      LEFT JOIN exam_sessions es ON es.id = exs.session_id
      LEFT JOIN classrooms c ON c.id = ehti.classroom_id
      WHERE eht.reg_no = (SELECT reg_no FROM user_profiles WHERE user_id = ?)
      ORDER BY exs.exam_date DESC
    `, [req.auth.uid]);

    const examItems = examRows.map((r, idx) => ({
      id: `exam_${r.id}_${idx}`,
      kind: "EXAM",
      date: r.exam_date || r.start_date,
      startTime: r.start_time,
      endTime: r.end_time,
      roomCode: r.room_code || "TBA",
      building: r.building,
      seatNo: r.seat_no,
      hallTicketNo: r.ticket_no,
      subjectCode: r.course_code,
      subjectName: r.course_name,
      session: r.batch, // assuming batch is session
      status: "ALLOCATED",
      allocatedBy: "Exam Allocation Agent",
      allocatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    }));

    // For placements: from interview_slots and interview_slot_assignments
    const placementRows = await query(`
      SELECT isa.*, iss.slot_date, iss.start_time, iss.end_time, pd.drive_title, pc.name as company_name, c.room_code, c.building
      FROM interview_slot_assignments isa
      JOIN interview_slots iss ON iss.id = isa.slot_id
      JOIN placement_drives pd ON pd.id = iss.drive_id
      JOIN placement_companies pc ON pc.id = pd.company_id
      LEFT JOIN classrooms c ON c.id = iss.room_allocation_id
      WHERE isa.student_user_id = ?
      ORDER BY iss.slot_date DESC
    `, [req.auth.uid]);

    const placementItems = placementRows.map((r, idx) => ({
      id: `pl_${r.id}_${idx}`,
      kind: "PLACEMENT",
      date: r.slot_date,
      startTime: r.start_time,
      endTime: r.end_time,
      roomCode: r.room_code || "TBA",
      building: r.building,
      seatNo: `Seat ${r.id}`, // mock
      companyName: r.company_name,
      driveTitle: r.drive_title,
      roundName: "Interview",
      status: r.status === "COMPLETED" ? "ALLOCATED" : "PENDING",
      allocatedBy: "Placement Allocation Agent",
      allocatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    }));

    // For theory: from timetable_events
    const theoryRows = await query(`
      SELECT te.*, c.room_code, c.building
      FROM timetable_events te
      LEFT JOIN classrooms c ON c.id = te.classroom_id
      WHERE te.owner_user_id = ? AND te.event_type = 'CLASS'
      ORDER BY te.event_date DESC
    `, [req.auth.uid]);

    const theoryItems = theoryRows.map((r, idx) => ({
      id: `theory_${r.id}_${idx}`,
      kind: "THEORY",
      date: r.event_date,
      startTime: r.start_time,
      endTime: r.end_time,
      roomCode: r.room_code || "TBA",
      building: r.building,
      seatNo: `Seat ${idx + 1}`, // mock
      courseCode: r.title.split(' ')[0], // mock
      courseName: r.title,
      facultyName: "Unknown", // no faculty in table
      status: "ALLOCATED",
      allocatedBy: "Timetable Agent",
      allocatedAt: r.created_at,
    }));

    const items = [...examItems, ...placementItems, ...theoryItems];
    return res.json({ ok: true, items });
  } catch (err) {
    console.error("Failed to load allocations:", err);
    return res.json({ ok: true, items: [] });
  }
});

router.get("/exams/class-allotment", async (req, res) => {
  try {
    const rows = await query(
      "SELECT * FROM exam_hall_tickets WHERE reg_no IN (SELECT reg_no FROM user_profiles WHERE user_id = ?) ORDER BY id DESC",
      [req.auth.uid]
    );
    if (!rows.length) return res.json({ ok: true, items: [] });
    const ticketIds = rows.map((r) => r.id);
    const items = await query(
      `SELECT * FROM exam_hall_ticket_items WHERE ticket_id IN (${ticketIds.map(() => "?").join(",")})`,
      ticketIds
    );
    const out = items.map((r) => ({
      id: String(r.id),
      courseCode: r.course_code,
      courseName: r.course_name,
      examDate: r.exam_date,
      startTime: r.start_time,
      room: r.room,
      seat: r.seat,
    }));
    return res.json({ ok: true, items: out });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load exam allocations" });
  }
});

router.get("/placements/drives", async (req, res) => {
  try {
    const drives = await query(
      "SELECT d.*, c.name AS company_name FROM placement_drives d JOIN placement_companies c ON c.id = d.company_id ORDER BY d.drive_date DESC"
    );
    return res.json({ ok: true, drives });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load drives" });
  }
});

router.get("/placements/applications", async (req, res) => {
  try {
    const apps = await query(
      "SELECT * FROM placement_applications WHERE student_user_id = ? ORDER BY id DESC",
      [req.auth.uid]
    );
    return res.json({ ok: true, applications: apps });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load applications" });
  }
});

router.post("/placements/agent/run", async (req, res) => {
  try {
    await query(
      "INSERT INTO placement_agent_runs (drive_id, agent_name, started_at, finished_at, status, summary_json, error_text) VALUES (?,?,?,?,?,?,?)",
      [req.body.drive_id || 0, "PlacementAgent", new Date().toISOString().slice(0, 19).replace("T", " "), null, "DONE", null, null]
    );
  } catch {}
  return res.json({ ok: true });
});

module.exports = router;
