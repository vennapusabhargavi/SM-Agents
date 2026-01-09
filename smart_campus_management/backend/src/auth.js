const express = require("express");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { query } = require("./db");
const {
  normalizeEmail,
  otp6,
  sha256,
  createJwt,
  verifyJwt,
  jwtConfig,
} = require("./utils");
const { emailOtpTemplate } = require("./emailTemplates");

async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return next(); // no token, continue without auth
  }
  try {
    const decoded = verifyJwt(token);
    const userRows = await query('SELECT id, full_name, email, role, admin_scope FROM users WHERE id = ?', [decoded.id]);
    if (userRows.length) {
      req.auth = {
        uid: userRows[0].id,
        role: userRows[0].role,
        adminScope: userRows[0].admin_scope,
        name: userRows[0].full_name,
        email: userRows[0].email,
      };
    }
  } catch (err) {
    // invalid token, ignore
  }
  next();
};

const router = express.Router();

let transporter = null;
function getTransporter() {
  if (process.env.SMTP_ENABLED === "false") return null;
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USERNAME;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "tls").toLowerCase() === "ssl",
    auth: { user, pass },
  });
  return transporter;
}

async function sendEmail(toEmail, toName, subject, htmlBody) {
  const mailer = getTransporter();
  if (!mailer) {
    console.log(`[mail] SMTP disabled or not configured. OTP for ${toEmail}:`);
    return true;
  }
  const fromEmail = process.env.MAIL_FROM_EMAIL || "smartcampus@example.com";
  const fromName = process.env.MAIL_FROM_NAME || "SmartCampus";
  await mailer.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to: `${toName || toEmail} <${toEmail}>`,
    subject,
    html: htmlBody,
  });
  return true;
}

async function ensureAuthTables() {
  await query(`CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('STUDENT','FACULTY','ADMIN') NOT NULL,
    admin_scope ENUM('GENERAL','EXAM','FINANCE','PLACEMENT') NULL DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_role (role)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await query(`CREATE TABLE IF NOT EXISTS email_otps (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    email VARCHAR(190) NOT NULL UNIQUE,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    last_sent_at DATETIME NOT NULL,
    send_count INT NOT NULL DEFAULT 1,
    verified_at DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await query(`CREATE TABLE IF NOT EXISTS password_reset_otps (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    email VARCHAR(190) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_at DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_pr_email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await query(`CREATE TABLE IF NOT EXISTS auth_tokens (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    revoked TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_auth_tokens_user (user_id),
    CONSTRAINT fk_auth_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

router.post("/register", async (req, res) => {
  await ensureAuthTables();
  const name = String(req.body.fullName || "").trim();
  const email = normalizeEmail(req.body.email || "");
  const password = req.body.password || "";
  const roleInput = req.body.role || req.body.userType || "";
  const role = String(roleInput || "").toUpperCase();

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  if (![
    "ADMIN",
    "FACULTY",
    "STUDENT",
  ].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    const existing = await query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const verified = await query(
      "SELECT verified_at FROM email_otps WHERE email = ? AND verified_at IS NOT NULL",
      [email]
    );
    if (!verified.length) {
      return res.status(400).json({ message: "Email not verified. Please verify your email first." });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      "INSERT INTO users (full_name, email, password_hash, role) VALUES (?,?,?,?)",
      [name, email, hash, role]
    );

    const uid = result.insertId;
    const token = createJwt({ id: uid, role });
    const cfg = jwtConfig();
    const expires = new Date(Date.now() + cfg.ttlSeconds * 1000);
    await query("INSERT INTO auth_tokens (user_id, token_hash, expires_at) VALUES (?,?,?)", [
      uid,
      sha256(token),
      expires.toISOString().slice(0, 19).replace("T", " "),
    ]);

    return res.json({ uid, token, role, name });
  } catch (err) {
    console.error("Register error", err);
    return res.status(500).json({ message: "Internal error" });
  }
});

router.post("/login", async (req, res) => {
  const registerNumber = String(req.body.registerNumber || "").toUpperCase().trim();
  const password = req.body.password || "";

  if (!registerNumber || !password) {
    return res.status(400).json({ message: "Missing registerNumber or password" });
  }

  try {
    let user;
    if (registerNumber.includes('@')) {
      // Treat as email
      const email = normalizeEmail(registerNumber);
      const rows = await query("SELECT id, full_name, password_hash, role, is_active FROM users WHERE email = ?", [email]);
      user = rows[0];
    } else {
      // Look in user_profiles by reg_no (used for all roles)
      const profileRows = await query("SELECT user_id FROM user_profiles WHERE reg_no = ?", [registerNumber]);
      if (profileRows.length) {
        const uid = profileRows[0].user_id;
        const rows = await query("SELECT id, full_name, password_hash, role, is_active FROM users WHERE id = ?", [uid]);
        user = rows[0];
      }
    }

    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (!user.is_active) return res.status(403).json({ message: "Account disabled" });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const storedRole = String(user.role || "").toUpperCase();

    const uid = user.id;
    const token = createJwt({ id: uid, role: storedRole });
    const cfg = jwtConfig();
    const expires = new Date(Date.now() + cfg.ttlSeconds * 1000);

    await query("INSERT INTO auth_tokens (user_id, token_hash, expires_at) VALUES (?,?,?)", [
      uid,
      sha256(token),
      expires.toISOString().slice(0, 19).replace("T", " "),
    ]);
    await query("UPDATE users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?", [uid]);

    // Get registerNumber from profile or input
    let actualRegisterNumber = registerNumber;
    if (!registerNumber.includes('@')) {
      const profile = await query("SELECT reg_no FROM user_profiles WHERE user_id = ?", [uid]);
      if (profile.length) {
        actualRegisterNumber = profile[0].reg_no || registerNumber;
      }
    }

    return res.json({ userId: uid, token, role: storedRole, userName: user.full_name, registerNumber: actualRegisterNumber });
  } catch (err) {
    console.error("Login error", err);
    return res.status(500).json({ message: "Internal error" });
  }
});

router.post("/email-otp/request", async (req, res) => {
  await ensureAuthTables();
  const email = normalizeEmail(req.body.email || "");
  if (!email) return res.status(400).json({ message: "Missing email" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Invalid email address" });
  }

  try {
    const rows = await query("SELECT id, last_sent_at FROM email_otps WHERE email = ?", [email]);
    const row = rows[0];
    if (row && row.last_sent_at) {
      const last = new Date(row.last_sent_at).getTime();
      const now = Date.now();
      if (now - last < 30000) {
        const wait = Math.ceil((30000 - (now - last)) / 1000);
        return res.status(429).json({ message: `Please wait ${wait} seconds before requesting another code` });
      }
    }

    const otp = otp6();
    const otpHash = sha256(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const nowStr = new Date().toISOString().slice(0, 19).replace("T", " ");

    if (row) {
      await query(
        "UPDATE email_otps SET otp_hash=?, expires_at=?, last_sent_at=?, send_count=send_count+1, verified_at=NULL WHERE email=?",
        [otpHash, expiresAt.toISOString().slice(0, 19).replace("T", " "), nowStr, email]
      );
    } else {
      await query(
        "INSERT INTO email_otps (email, otp_hash, expires_at, last_sent_at) VALUES (?,?,?,?)",
        [email, otpHash, expiresAt.toISOString().slice(0, 19).replace("T", " "), nowStr]
      );
    }

    const html = emailOtpTemplate(email, otp, 10, "Your verification code");
    await sendEmail(email, email, "Your verification code", html);

    return res.json({ message: "Verification code sent to your email" });
  } catch (err) {
    console.error("Email OTP request error", err);
    return res.status(500).json({ message: "Internal error" });
  }
});

router.post("/email-otp/verify", async (req, res) => {
  await ensureAuthTables();
  const email = normalizeEmail(req.body.email || "");
  const otp = String(req.body.otp || "").trim();
  if (!email || !otp) return res.status(400).json({ valid: false, message: "Missing email or otp" });

  try {
    const rows = await query("SELECT id, otp_hash, expires_at, verified_at FROM email_otps WHERE email = ?", [email]);
    const row = rows[0];
    if (!row) return res.status(400).json({ valid: false, message: "No code found for this email" });
    if (row.verified_at) return res.json({ valid: true, message: "Email already verified" });
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ valid: false, message: "Code expired" });
    }
    if (sha256(otp) !== row.otp_hash) {
      return res.status(400).json({ valid: false, message: "Invalid code" });
    }

    const nowStr = new Date().toISOString().slice(0, 19).replace("T", " ");
    await query("UPDATE email_otps SET verified_at = ? WHERE id = ?", [nowStr, row.id]);

    return res.json({ valid: true, message: "Email verified" });
  } catch (err) {
    console.error("Email OTP verify error", err);
    return res.status(500).json({ valid: false, message: "Internal error" });
  }
});

router.post("/forgot-password", async (req, res) => {
  await ensureAuthTables();
  const email = normalizeEmail(req.body.email || "");
  if (!email) return res.status(400).json({ message: "Missing email" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Invalid email address" });
  }

  try {
    const userRows = await query("SELECT id, full_name FROM users WHERE email = ?", [email]);
    const user = userRows[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = otp6();
    const otpHash = sha256(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await query("INSERT INTO password_reset_otps (email, otp_hash, expires_at) VALUES (?,?,?)", [
      email,
      otpHash,
      expiresAt.toISOString().slice(0, 19).replace("T", " "),
    ]);

    const html = emailOtpTemplate(user.full_name || email, otp, 10, "Reset your password");
    await sendEmail(email, user.full_name || email, "Password reset code", html);

    return res.json({ message: "Password reset code sent to your email" });
  } catch (err) {
    console.error("Forgot password error", err);
    return res.status(500).json({ message: "Internal error" });
  }
});

router.post("/verify-otp", async (req, res) => {
  await ensureAuthTables();
  const email = normalizeEmail(req.body.email || "");
  const otp = String(req.body.otp || "").trim();
  if (!email || !otp) return res.status(400).json({ message: "Missing email or otp" });

  try {
    const rows = await query(
      "SELECT id, otp_hash, expires_at, verified_at FROM password_reset_otps WHERE email = ? ORDER BY id DESC LIMIT 1",
      [email]
    );
    const row = rows[0];
    if (!row) return res.status(400).json({ message: "No reset code found" });
    if (row.verified_at) return res.status(400).json({ message: "Code already used" });
    if (new Date(row.expires_at).getTime() < Date.now()) return res.status(400).json({ message: "Code expired" });
    if (sha256(otp) !== row.otp_hash) return res.status(400).json({ message: "Invalid code" });

    const nowStr = new Date().toISOString().slice(0, 19).replace("T", " ");
    await query("UPDATE password_reset_otps SET verified_at = ? WHERE id = ?", [nowStr, row.id]);

    return res.json({ message: "OTP verified" });
  } catch (err) {
    console.error("Verify reset OTP error", err);
    return res.status(500).json({ message: "Internal error" });
  }
});

router.post("/reset-password", async (req, res) => {
  await ensureAuthTables();
  const email = normalizeEmail(req.body.email || "");
  const newPassword = req.body.newPassword || "";
  if (!email || !newPassword) return res.status(400).json({ message: "Missing email or newPassword" });
  if (newPassword.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

  try {
    const rows = await query(
      "SELECT verified_at FROM password_reset_otps WHERE email = ? ORDER BY id DESC LIMIT 1",
      [email]
    );
    const row = rows[0];
    if (!row || !row.verified_at) {
      return res.status(400).json({ message: "You must verify the reset code first" });
    }

    const userRows = await query("SELECT id FROM users WHERE email = ?", [email]);
    const user = userRows[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    const hash = await bcrypt.hash(newPassword, 10);
    await query("UPDATE users SET password_hash = ? WHERE email = ?", [hash, email]);

    return res.json({ message: "Password updated" });
  } catch (err) {
    console.error("Reset password error", err);
    return res.status(500).json({ message: "Internal error" });
  }
});

router.post("/support/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const html = `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Subject:</strong> ${subject}</p><p><strong>Message:</strong> ${message}</p>`;
    await sendEmail("support@example.com", "Support", `Support Contact: ${subject}`, html);
    return res.json({ message: "Message sent successfully" });
  } catch (err) {
    console.error("Support contact error", err);
    return res.status(500).json({ message: "Failed to send message" });
  }
});

module.exports = { router, verifyToken };
