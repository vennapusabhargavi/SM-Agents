const path = require("path");
const express = require("express");
const cors = require("cors");
const { requireAdmin, requireStudent } = require("./utils");
const { router: authRouter, verifyToken } = require("./auth");
const { router: adminRouter, listClassrooms, listRoomRequests } = require("./admin");
const studentRouter = require("./student");
const teacherRouter = require("./teacher");
const agentsRouter = require("./agents");
const settingsRouter = require("./settings");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const app = express();

const origin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', verifyToken);

const rootDir = path.resolve(__dirname, "..", "..");
app.use("/uploads", express.static(path.join(rootDir, "uploads")));

app.get("/api", (_req, res) => {
  res.json({ ok: true, service: "smart_campus_api", ts: new Date().toISOString() });
});
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "smart_campus_api", ts: new Date().toISOString() });
});


app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/student", studentRouter);
app.use("/api/teacher", teacherRouter);
app.use("/api/agents", agentsRouter);
app.use("/api/settings", settingsRouter);

// Compatibility endpoints used by frontend fallbacks.
app.get("/api/profile/me", requireStudent, (req, res) => {
  res.json(req.studentProfileResponse);
});
app.get("/api/classrooms", requireAdmin, listClassrooms);
app.get("/api/room-requests", requireAdmin, listRoomRequests);

// Placements shortcuts used by student UI
app.get("/api/placements/drives", requireStudent, (req, res) => {
  req.url = "/placements/drives";
  studentRouter(req, res, () => {});
});
app.get("/api/placements/my-applications", requireStudent, (req, res) => {
  req.url = "/placements/applications";
  studentRouter(req, res, () => {});
});
app.post("/api/placements/agent/run", requireStudent, (req, res) => {
  req.url = "/placements/agent/run";
  studentRouter(req, res, () => {});
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.path });
});

const port = Number(process.env.PORT || 5000);
const server = app.listen(port, () => {
  console.log(`Smart Campus API listening on http://localhost:${port}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${port} is busy, trying port ${port + 1}`);
    server.listen(port + 1, () => {
      console.log(`Smart Campus API listening on http://localhost:${port + 1}`);
    });
  } else {
    console.error('Server error:', err);
  }
});
