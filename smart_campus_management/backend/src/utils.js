const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { query } = require("./db");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function otp6() {
  return String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function jwtConfig() {
  return {
    secret: process.env.JWT_SECRET || "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET",
    issuer: process.env.JWT_ISSUER || "smart_campus",
    audience: process.env.JWT_AUDIENCE || "smart_campus_frontend",
    ttlSeconds: Number(process.env.JWT_TTL_SECONDS || 60 * 60 * 24),
  };
}

function createJwt(payload) {
  const cfg = jwtConfig();
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      ...payload,
      iss: cfg.issuer,
      aud: cfg.audience,
      iat: now,
      exp: now + cfg.ttlSeconds,
    },
    cfg.secret,
    { algorithm: "HS256" }
  );
}

function verifyJwt(token) {
  const cfg = jwtConfig();
  return jwt.verify(token, cfg.secret, {
    algorithms: ["HS256"],
    issuer: cfg.issuer,
    audience: cfg.audience,
  });
}

function getBearerToken(req) {
  const auth = req.headers.authorization || "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return null;
}

function toDmy(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function toDmyHm(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  const pad = (n) => String(n).padStart(2, "0");
  return `${toDmy(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseDmyToDate(dmy) {
  const m = String(dmy || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(dmy);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function publicBaseUrl(req) {
  return process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
}

async function requireAuth(req, res, next, roles) {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const payload = verifyJwt(token);
    const role = String(payload.role || "").toUpperCase();
    if (roles && !roles.includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const uid = Number(payload.id || 0);
    if (!uid) return res.status(401).json({ message: "Unauthorized" });

    const rows = await query("SELECT id, role, is_active FROM users WHERE id = ?", [uid]);
    if (!rows.length || !rows[0].is_active) {
      return res.status(403).json({ message: "Account disabled" });
    }

    req.auth = { uid, role };
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function requireAdmin(req, res, next) {
  return requireAuth(req, res, next, ["ADMIN"]);
}

async function requireFaculty(req, res, next) {
  return requireAuth(req, res, next, ["FACULTY", "ADMIN"]);
}

async function ensureProfile(uid) {
  const rows = await query("SELECT * FROM user_profiles WHERE user_id = ?", [uid]);
  if (rows.length) return rows[0];
  await query("INSERT INTO user_profiles (user_id) VALUES (?)", [uid]);
  const created = await query("SELECT * FROM user_profiles WHERE user_id = ?", [uid]);
  return created[0] || {};
}

async function requireStudent(req, res, next) {
  return requireAuth(req, res, async () => {
    const profile = await ensureProfile(req.auth.uid);
    const userRows = await query("SELECT full_name, email FROM users WHERE id = ?", [req.auth.uid]);
    const user = userRows[0] || {};
    req.studentProfileResponse = {
      ok: true,
      profile: {
        name: user.full_name || "",
        email: user.email || "",
        regNo: profile.reg_no || "",
        dob: profile.dob || "",
        program: profile.program || "",
        department: profile.department || "",
        semester: profile.semester || "",
        year: profile.year_of_study || "",
        mobile: profile.mobile || "",
        cgpa: profile.cgpa ? Number(profile.cgpa) : 0,
        backlogs: profile.arrears ? Number(profile.arrears) : 0,
        attendance: profile.attendance_pct ? Number(profile.attendance_pct) : 0,
        noDueClear: Boolean(profile.fee_clear),
        resumeUrl: profile.resume_url || "",
        resumeName: profile.resume_name || "",
        resumeMime: profile.resume_mime || "",
      },
    };
    return next();
  }, ["STUDENT", "ADMIN"]);
}

module.exports = {
  normalizeEmail,
  otp6,
  sha256,
  jwtConfig,
  createJwt,
  verifyJwt,
  getBearerToken,
  toDmy,
  toDmyHm,
  parseDmyToDate,
  publicBaseUrl,
  requireAdmin,
  requireStudent,
  requireFaculty,
};
