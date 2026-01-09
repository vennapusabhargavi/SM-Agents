                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                function emailOtpTemplate(name, otp, minutes, title) {
  const safeName = (name || "there").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeOtp = String(otp || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeTitle = (title || "Verification code").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeMins = Math.max(1, Number(minutes || 10));
  const year = new Date().getFullYear();

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${safeTitle} - SmartCampus</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fb;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#3b82f6;color:#fff;padding:16px 20px;border-radius:14px 14px 0 0;">
      <div style="font-weight:700;font-size:18px;">SmartCampus</div>
      <div style="font-size:13px;opacity:0.9;">${safeTitle}</div>
    </div>
    <div style="background:#ffffff;padding:22px;border-radius:0 0 14px 14px;border:1px solid #e2e8f0;border-top:0;">
      <div style="font-size:16px;font-weight:700;margin-bottom:8px;">Hi ${safeName},</div>
      <div style="font-size:14px;color:#334155;margin-bottom:16px;">Use the one-time code below to continue. This code expires in ${safeMins} minutes.</div>
      <div style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:12px;padding:16px;text-align:center;">
        <div style="font-family:monospace;font-size:32px;font-weight:800;letter-spacing:6px;color:#0f172a;">${safeOtp}</div>
        <div style="font-size:12px;color:#64748b;margin-top:6px;">Expires in ${safeMins} minutes</div>
      </div>
      <div style="font-size:12px;color:#64748b;margin-top:18px;">If you did not request this code, you can ignore this email.</div>
      <div style="font-size:11px;color:#94a3b8;margin-top:12px;">? ${year} SmartCampus</div>
    </div>
  </div>
</body>
</html>`;
}

module.exports = { emailOtpTemplate };
