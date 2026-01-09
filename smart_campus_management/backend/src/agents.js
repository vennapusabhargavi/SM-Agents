const express = require("express");
const { spawn } = require("child_process");
const { query } = require("./db");

const router = express.Router();

async function runClassroomAgent(payload) {
  try {
    const { actor_user_id, onlyPending = true } = payload || {};

    // Get pending classroom requests
    const requests = await query(
      "SELECT * FROM classroom_requests WHERE status = 'PENDING' ORDER BY created_at ASC"
    );

    if (requests.length === 0) {
      return { status: "completed", message: "No pending requests to process" };
    }

    let approved = 0;
    let rejected = 0;

    for (const req of requests) {
      // Simple demo logic: randomly approve/reject
      const shouldApprove = Math.random() > 0.3; // 70% approval rate

      const newStatus = shouldApprove ? 'APPROVED' : 'REJECTED';
      const decisionReason = shouldApprove
        ? 'Auto-approved by Classroom Agent'
        : 'Auto-rejected by Classroom Agent - room unavailable';

      await query(
        "UPDATE classroom_requests SET status = ?, decision_reason = ?, updated_at = NOW() WHERE id = ?",
        [newStatus, decisionReason, req.id]
      );

      if (shouldApprove) {
        approved++;
        // Create allotment if approved
        try {
          await query(
            "INSERT INTO classroom_allotments (request_id, allocated_classroom_id, alloc_date, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?)",
            [req.id, req.classroom_id, req.request_date, req.start_time, req.end_time, 'ACTIVE']
          );
        } catch (e) {
          // Ignore if allotment creation fails
        }
      } else {
        rejected++;
      }
    }

    return {
      status: "completed",
      message: `Processed ${requests.length} requests: ${approved} approved, ${rejected} rejected`
    };
  } catch (error) {
    console.error("Classroom agent error:", error);
    return { status: "failed", message: error.message };
  }
}

function runAgent(script, payload) {
  // For demo purposes, handle all agents in Node.js to avoid Python dependencies
  if (script === "classroom_agent.py") {
    setTimeout(() => {
      runClassroomAgent(payload);
    }, 1000); // Simulate async processing
    return;
  }

  // For other agents, simulate for demo purposes
  console.log(`Simulating ${script} execution with payload:`, payload);
  // Simulate completion after delay
  setTimeout(() => {
    console.log(`${script} simulation completed`);
  }, 2000);
}

router.post("/classroom/request", (req, res) => {
  runAgent("classroom_agent.py", req.body || {});
  return res.json({ status: "queued" });
});

router.post("/classroom/override", (req, res) => {
  runAgent("classroom_agent.py", req.body || {});
  return res.json({ status: "queued" });
});

router.post("/exam/run_session", (req, res) => {
  runAgent("exam_agent.py", req.body || {});
  return res.json({ status: "queued" });
});

router.post("/fee/run", (req, res) => {
  runAgent("fee_agent.py", req.body || {});
  return res.json({ status: "queued" });
});

router.post("/placement/run_drive", (req, res) => {
  runAgent("placement_agent.py", req.body || {});
  return res.json({ status: "queued" });
});

module.exports = router;
