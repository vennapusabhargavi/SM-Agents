// src/layouts/student/examination/StudentExamNoDue.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock3,
  ChevronRight,
  Download,
  Info,
  AlertTriangle,
} from "lucide-react";

type StepStatus = "APPROVED" | "REJECTED" | "PENDING";

type NoDueStep = {
  label: string;
  status: StepStatus;
};

type NoDueRequest = {
  id: string;
  courseCode: string;
  courseTitle: string;
  studentName: string;
  requestDate: string; // dd/MM/yyyy
  steps: NoDueStep[];
};

type FeeStatus = "CLEAR" | "DUE" | "HOLD";


const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost/smart_campus_api";
const STUDENT_API = `${API_BASE}/api/student`;

type FeeSummary = {
  dueAmount: number; // INR
  feeStatus: FeeStatus;
  lastPaymentDate?: string; // dd/MM/yyyy
  lastPaymentAmount?: number; // INR
  pendingIssues: Array<{ id: string; title: string; status: "OPEN" | "IN_REVIEW" | "RESOLVED" }>;
  blockedReason?: string;
};

type ExamEligibility = {
  attendancePct: number; // 0-100
  minAttendancePct: number;
  feeStatus: FeeStatus;
  noDueOk: boolean;
  eligible: boolean;
  reasons: string[];
  computedAt: string; // dd/MM/yyyy HH:mm
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function ddmmyyyy(d = new Date()) {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
function ddmmyyyy_hhmm(d = new Date()) {
  return `${ddmmyyyy(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function inr(n: number) {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);
  } catch {
    return `₹${Math.round(n)}`;
  }
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "APPROVED") return <CheckCircle2 className="h-9 w-9 text-teal-600" />;
  if (status === "REJECTED") return <XCircle className="h-9 w-9 text-rose-600" />;
  return <Clock3 className="h-9 w-9 text-amber-600" />;
}

function StepChip({ status }: { status: StepStatus }) {
  const cls =
    status === "APPROVED"
      ? "bg-teal-600 text-white"
      : status === "REJECTED"
      ? "bg-rose-600 text-white"
      : "bg-amber-600 text-white";

  const text =
    status === "APPROVED" ? "Approved" : status === "REJECTED" ? "Rejected" : "Pending";

  return (
    <span className={cn("inline-flex rounded-full px-2 py-[2px] text-[11px] font-semibold", cls)}>
      {text}
    </span>
  );
}

function AgentBadge({ label, at }: { label: string; at: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 px-3 py-1.5">
      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">• {at}</span>
    </div>
  );
}

function StatusPill({ kind }: { kind: "OK" | "BLOCKED" | "WARN" }) {
  const cls =
    kind === "OK"
      ? "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-200"
      : kind === "WARN"
      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
      : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200";

  return (
    <span className={cn("text-xs px-2 py-1 rounded-lg border font-semibold", cls)}>
      {kind === "OK" ? "Eligible" : kind === "WARN" ? "Review" : "Blocked"}
    </span>
  );
}

function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center h-9 px-3 rounded-xl text-sm font-semibold
                 border border-slate-200 bg-white text-slate-800 hover:bg-slate-50
                 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition"
    >
      {label}
    </a>
  );
}

function PrimaryBtn(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 h-9 px-3 rounded-xl text-sm font-semibold",
        "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.99] transition shadow-sm",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        props.className
      )}
    />
  );
}

function RequestRow({ req }: { req: NoDueRequest }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* Left course card */}
        <div
          className={cn(
            "lg:w-[320px] w-full",
            "bg-slate-600 text-white",
            "p-4",
            "border-b lg:border-b-0 lg:border-r border-white/15"
          )}
        >
          <div className="text-[12px] font-semibold opacity-95 leading-snug">
            {req.courseCode}
            <span className="font-medium opacity-90">{"  "}</span>
            {req.courseTitle}
          </div>

          <div className="mt-10 flex items-end justify-between">
            <div className="text-[13px] font-semibold">{req.studentName}</div>
            <div className="text-[13px] font-semibold tabular-nums">{req.requestDate}</div>
          </div>
        </div>

        {/* Right tracker (NO OVERLAP: horizontal scroll on small screens) */}
        <div className="flex-1 p-4 lg:p-5">
          <div className="overflow-x-auto">
            <div className="min-w-[720px] flex items-start gap-4">
              {req.steps.map((s, idx) => (
                <div key={s.label} className="flex items-start">
                  <div className="flex flex-col items-center w-[120px]">
                    <StepIcon status={s.status} />
                    <div className="mt-1 text-[12px] font-semibold text-slate-700 dark:text-slate-200 text-center">
                      {s.label}
                    </div>
                    <div className="mt-1">
                      <StepChip status={s.status} />
                    </div>
                  </div>

                  {idx !== req.steps.length - 1 && (
                    <div className="mt-2 px-1 flex items-center">
                      <ChevronRight className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                      <ChevronRight className="-ml-3 h-6 w-6 text-slate-300 dark:text-slate-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Tip: Scroll horizontally if steps don’t fit on small screens.
          </div>
        </div>
      </div>
    </div>
  );
}

function openHallTicketPrintWindow(args: {
  studentName: string;
  regNo: string;
  department: string;
  semester: string;
  examTitle: string;
  eligibility: ExamEligibility;
}) {
  const w = window.open("", "_blank", "noopener,noreferrer,width=980,height=720");
  if (!w) return false;

  const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Hall Ticket</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; padding: 24px; color: #0f172a; }
    .card { border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; margin-top: 14px; }
    .row { display: flex; gap: 16px; flex-wrap: wrap; }
    .k { color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
    .v { font-size: 14px; font-weight: 650; margin-top: 4px; }
    .title { font-size: 18px; font-weight: 800; }
    .sub { color: #334155; margin-top: 4px; }
    .badge { display: inline-block; border: 1px solid #c7d2fe; background: #eef2ff; color: #3730a3; padding: 4px 10px; border-radius: 999px; font-weight: 700; font-size: 12px; }
    .small { color: #64748b; font-size: 12px; }
    .hr { height: 1px; background: #e2e8f0; margin: 14px 0; }
    @media print { .no-print { display:none; } body { padding: 0; } .card{ border:none; } }
  </style>
</head>
<body>
  <div class="row" style="justify-content:space-between; align-items:flex-start;">
    <div>
      <div class="title">Smart Campus • Hall Ticket</div>
      <div class="sub">${args.examTitle}</div>
      <div class="small">Generated on ${new Date().toLocaleString()}</div>
    </div>
    <div class="badge">ELIGIBLE</div>
  </div>

  <div class="card">
    <div class="row">
      <div style="min-width:240px;">
        <div class="k">Student Name</div>
        <div class="v">${args.studentName}</div>
      </div>
      <div style="min-width:200px;">
        <div class="k">Register No</div>
        <div class="v">${args.regNo}</div>
      </div>
      <div style="min-width:240px;">
        <div class="k">Department</div>
        <div class="v">${args.department}</div>
      </div>
      <div style="min-width:180px;">
        <div class="k">Semester</div>
        <div class="v">${args.semester}</div>
      </div>
    </div>

    <div class="hr"></div>

    <div class="row">
      <div style="min-width:240px;">
        <div class="k">Attendance</div>
        <div class="v">${args.eligibility.attendancePct}% (min ${args.eligibility.minAttendancePct}%)</div>
      </div>
      <div style="min-width:240px;">
        <div class="k">Fee Status</div>
        <div class="v">${args.eligibility.feeStatus}</div>
      </div>
      <div style="min-width:240px;">
        <div class="k">No Due</div>
        <div class="v">${args.eligibility.noDueOk ? "OK" : "NOT CLEARED"}</div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="k">Instructions</div>
    <div class="v" style="font-weight:600;">
      Carry your ID card. Report 30 minutes before the exam. Follow invigilator instructions.
    </div>
  </div>

  <div class="no-print" style="margin-top:14px;">
    <button onclick="window.print()" style="height:40px;padding:0 14px;border-radius:12px;border:1px solid #e2e8f0;background:#0f172a;color:white;font-weight:700;cursor:pointer;">
      Print / Save as PDF
    </button>
    <span class="small" style="margin-left:10px;">If print dialog doesn't open, enable popups.</span>
  </div>
</body>
</html>
  `;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  return true;
}

export function StudentExamNoDue() {
  const studentName = localStorage.getItem("studentName") || "Ashwin";
  const studentRegNo = localStorage.getItem("studentRegNo") || "192213001";
  const studentDept = localStorage.getItem("studentDept") || "CSE";
  const studentSem = localStorage.getItem("studentSem") || "V";

  // ---- NO DUE tracker data (demo) ----
  const demoNoDue: NoDueRequest[] = useMemo(
    () => [
      {
        id: "nd-1",
        courseCode: "ENGSW17401",
        courseTitle: "Human Computer Interaction for engineers",
        studentName,
        requestDate: "24/12/2025",
        steps: [
          { label: "Faculty", status: "REJECTED" },
          { label: "IT", status: "APPROVED" },
          { label: "Ast Dean of Research", status: "APPROVED" },
          { label: "Accounts", status: "APPROVED" },
          { label: "Ast Dean of Student", status: "APPROVED" },
        ],
      },
    ],
    [studentName]
  );
  const demoFee: FeeSummary = useMemo(
    () => ({
      dueAmount: 1250,
      feeStatus: "DUE",
      lastPaymentDate: "10/12/2025",
      lastPaymentAmount: 25000,
      pendingIssues: [{ id: "pi-101", title: "Payment mismatch: UPI ref not mapped", status: "OPEN" }],
      blockedReason: "Fee status is DUE / HOLD. Hall ticket is blocked until dues are cleared or issue is resolved.",
    }),
    []
  );

  const demoEligibility: ExamEligibility = useMemo(() => {
    const attendancePct = Number(localStorage.getItem("attendancePct") || "72"); // demo default
    const minAttendancePct = 75;
    const demoNoDueOk = demoNoDue.every((req) => req.steps.every((s) => s.status === "APPROVED"));

    const reasons: string[] = [];
    if (Number.isFinite(attendancePct) && attendancePct < minAttendancePct) {
      reasons.push(`Attendance ${attendancePct}% < ${minAttendancePct}%`);
    }
    if (demoFee.feeStatus !== "CLEAR") {
      reasons.push(`Fee status is ${demoFee.feeStatus}${demoFee.dueAmount > 0 ? ` (${inr(demoFee.dueAmount)} due)` : ""}`);
    }
    if (!demoNoDueOk) {
      reasons.push("No Due not cleared (one or more approvals pending/rejected)");
    }

    return {
      attendancePct: Number.isFinite(attendancePct) ? attendancePct : 0,
      minAttendancePct,
      feeStatus: demoFee.feeStatus,
      noDueOk: demoNoDueOk,
      eligible: reasons.length === 0,
      reasons,
      computedAt: ddmmyyyy_hhmm(),
    };
  }, [demoFee.feeStatus, demoFee.dueAmount, demoNoDue]);

  const [data, setData] = useState<NoDueRequest[]>(demoNoDue);
  const [fee, setFee] = useState<FeeSummary>(demoFee);
  const [eligibility, setEligibility] = useState<ExamEligibility>(demoEligibility);

  const noDueOk = useMemo(() => {
    return data.every((req) => req.steps.every((s) => s.status === "APPROVED"));
  }, [data]);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`${STUDENT_API}/exams/no-due`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.items) setData(json.items as NoDueRequest[]);
      })
      .catch(() => {});

    fetch(`${STUDENT_API}/exams/eligibility`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.eligibility) setEligibility(json.eligibility as ExamEligibility);
      })
      .catch(() => {});

    Promise.all([
      fetch(`${STUDENT_API}/fees/dues`, { headers }).then((r) => (r.ok ? r.json() : null)),
      fetch(`${STUDENT_API}/fees/payments`, { headers }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([duesRes, payRes]) => {
        const dues = (duesRes?.dues || []) as Array<{ amount: number; status: string; dueDate?: string }>;
        const payments = (payRes?.payments || []) as Array<{ amount: number; datedOn: string }>;
        const dueAmount = dues.reduce((sum, d) => sum + (d.status !== "Paid" ? Number(d.amount || 0) : 0), 0);
        const feeStatus = dueAmount > 0 ? "DUE" : "CLEAR";
        const lastPayment = payments[0];
        setFee({
          dueAmount,
          feeStatus: feeStatus as FeeStatus,
          lastPaymentDate: lastPayment?.datedOn || undefined,
          lastPaymentAmount: lastPayment?.amount || undefined,
          pendingIssues: [],
          blockedReason:
            feeStatus === "CLEAR"
              ? undefined
              : "Fee status is DUE / HOLD. Hall ticket is blocked until dues are cleared.",
        });
      })
      .catch(() => {});
  }, []);

  // ---- Fee agent summary (demo) ----
  // ---- Exam agent eligibility (demo) ----}

  const [showWhyBlocked, setShowWhyBlocked] = useState(false);
  const [popupBlockedHint, setPopupBlockedHint] = useState(false);

  const tryDownloadHallTicket = () => {
    setPopupBlockedHint(false);
    if (!eligibility.eligible) return;

    const ok = openHallTicketPrintWindow({
      studentName,
      regNo: studentRegNo,
      department: studentDept,
      semester: studentSem,
      examTitle: "End Semester Examination • Dec 2025",
      eligibility,
    });

    if (!ok) setPopupBlockedHint(true);
  };

  const whatNext = useMemo(() => {
    const actions: Array<{ label: string; href: string }> = [];

    if (eligibility.attendancePct < eligibility.minAttendancePct) {
      actions.push({ label: "View Attendance Report", href: "/student/attendance/report" });
      actions.push({ label: "Request OD", href: "/student/attendance/request-od" });
    }
    if (fee.feeStatus !== "CLEAR") {
      actions.push({ label: "Pay Fees / Financial Record", href: "/student/financial-record" });
      actions.push({ label: "Raise Payment Issue", href: "/student/raise-infra-issue" });
    }
    if (!noDueOk) {
      actions.push({ label: "Track No Due Steps", href: "#no-due-tracker" });
    }

    if (actions.length === 0) actions.push({ label: "Open Examination Home", href: "/student/examination" });

    const seen = new Set<string>();
    return actions.filter((a) => (seen.has(a.label) ? false : (seen.add(a.label), true)));
  }, [eligibility.attendancePct, eligibility.minAttendancePct, fee.feeStatus, noDueOk]);

  const eligibilityPill: "OK" | "BLOCKED" | "WARN" =
    eligibility.eligible ? "OK" : eligibility.reasons.length ? "BLOCKED" : "WARN";

  return (
    <div className="w-full p-4 md:p-6">
      <div className="mb-4">
        <div className="text-[28px] font-light text-slate-700 dark:text-slate-100 leading-none">
          Hall Ticket & No Due
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Eligibility card */}
        <div className="xl:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="p-4 md:p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  Hall Ticket Eligibility
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Deterministic checks + transparent reasons.
                </div>
              </div>

              {/* no overlap: allow wrap */}
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill kind={eligibilityPill} />
                <AgentBadge label="Eligibility computed by Exam Agent" at={eligibility.computedAt} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-3">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Attendance
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                  {eligibility.attendancePct}%{" "}
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    (min {eligibility.minAttendancePct}%)
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-3">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Fee Status
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                  {eligibility.feeStatus}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-3">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  No Due
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                  {eligibility.noDueOk ? "Cleared" : "Not cleared"}
                </div>
              </div>
            </div>

            {!eligibility.eligible && (
              <div className="mt-4 rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-rose-700 dark:text-rose-200 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-rose-800 dark:text-rose-100">
                      Hall ticket is blocked
                    </div>
                    <ul className="mt-2 space-y-1 text-sm text-rose-800/90 dark:text-rose-100/90">
                      {eligibility.reasons.map((r) => (
                        <li key={r} className="flex items-start gap-2">
                          <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-rose-600 flex-shrink-0" />
                          <span className="min-w-0">{r}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={() => setShowWhyBlocked((v) => !v)}
                      className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-200 hover:underline"
                    >
                      <Info className="h-4 w-4" />
                      View eligibility rules
                    </button>

                    {showWhyBlocked && (
                      <div className="mt-3 rounded-xl border border-rose-200/70 dark:border-rose-500/20 bg-white/70 dark:bg-slate-900/40 p-3 text-xs text-slate-700 dark:text-slate-200">
                        Hall ticket download is enabled only when:
                        <span className="font-semibold"> Attendance ≥ {eligibility.minAttendancePct}%</span>,{" "}
                        <span className="font-semibold">Fee = CLEAR</span>, and{" "}
                        <span className="font-semibold">No Due = Cleared</span>.
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {whatNext.map((a) => (
                        <ActionLink key={a.label} href={a.href} label={a.label} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <PrimaryBtn type="button" onClick={tryDownloadHallTicket} disabled={!eligibility.eligible}>
                <Download className="h-4 w-4" />
                Download / Print Hall Ticket
              </PrimaryBtn>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                Tip: Allow popups for the print window. Use the latest browser.
              </div>
            </div>

            {popupBlockedHint && (
              <div className="mt-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-100">
                Popup blocked by your browser. Please enable popups and try again.
              </div>
            )}
          </div>
        </div>

        {/* Fee agent summary */}
        <div className="xl:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="p-4 md:p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  No Due & Fee Summary
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Finance snapshot used by eligibility checks.
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <AgentBadge label="Summary generated by Fee & Finance Agent" at={ddmmyyyy_hhmm()} />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-3">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Fee Status
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                  {fee.feeStatus}{" "}
                  {fee.dueAmount > 0 && (
                    <span className="text-sm font-semibold text-rose-600 dark:text-rose-300">
                      • {inr(fee.dueAmount)} due
                    </span>
                  )}
                </div>
                {fee.lastPaymentDate && (
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Last payment:{" "}
                    <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                      {fee.lastPaymentDate}
                    </span>
                    {typeof fee.lastPaymentAmount === "number" ? (
                      <>
                        {" "}
                        •{" "}
                        <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                          {inr(fee.lastPaymentAmount)}
                        </span>
                      </>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-3">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Pending Issues
                </div>
                {fee.pendingIssues.length === 0 ? (
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    None
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    {fee.pendingIssues.slice(0, 3).map((it) => (
                      <div
                        key={it.id}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-2"
                      >
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          {it.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Status:{" "}
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {it.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {fee.blockedReason && fee.feeStatus !== "CLEAR" && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3">
                  <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    Why blocked?
                  </div>
                  <div className="mt-1 text-xs text-amber-900/90 dark:text-amber-100/90">
                    {fee.blockedReason}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <ActionLink href="/student/financial-record" label="Open Financial Record" />
                <ActionLink href="/student/raise-infra-issue" label="Raise Issue" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NO DUE tracker list */}
      <div id="no-due-tracker" className="mt-5 space-y-4">
        <div className="text-sm font-semibold text-slate-900 dark:text-white">
          No Due Request Tracker
        </div>
        {data.map((req) => (
          <RequestRow key={req.id} req={req} />
        ))}
      </div>
    </div>
  );
}

export default StudentExamNoDue;
