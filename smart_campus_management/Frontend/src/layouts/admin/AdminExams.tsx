// src/layouts/admin/AdminExams.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";

type SessionStatus = "DRAFT" | "SCHEDULED" | "RUNNING" | "COMPLETED";

type ExamSession = {
  id: string;
  title: string;
  term: string;
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
  status: SessionStatus;
  createdAt: string; // dd/mm/yyyy
};

type ExamSubject = {
  id: string;
  sessionId: string;
  courseCode: string;
  courseName: string;
  examDate: string; // yyyy-mm-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  batch: string;
  semester: string;
  status: "PLANNED" | "PUBLISHED";
};

type EligibilityRow = {
  id: string;
  sessionId: string;
  regNo: string;
  name: string;
  attendancePct: number;
  feeStatus: "CLEAR" | "PENDING";
  eligible: boolean;
  reason: string;
  confidencePct: number;
  riskBand: "LOW" | "MEDIUM" | "HIGH";
};

type HallTicketItem = {
  courseCode: string;
  courseName: string;
  examDate: string;
  startTime: string;
  room: string; // PENDING until allocation
  seat: string; // PENDING until allocation
};

type HallTicket = {
  id: string;
  sessionId: string;
  regNo: string;
  name: string;
  issuedAt: string; // dd/mm/yyyy
  items: HallTicketItem[];
};

type AgentRun = {
  id: string;
  sessionId: string;
  requestedAt: string; // dd/mm/yyyy HH:mm
  status: "SUCCESS" | "FAILED";
  message: string;
  meta?: {
    scheduledSubjects: number;
    totalSubjects: number;
    eligibleCount: number;
    ineligibleCount: number;
    ticketsIssued: number;
    roomRequestsCreated: number;
    conflicts?: Array<{
      subjectId: string;
      courseCode: string;
      issue: string;
      suggestions: Array<{ examDate: string; startTime: string; endTime: string }>;
    }>;
  };
};

type RoomRequest = {
  id: string;
  requestedAt: string; // ISO
  requesterRole: "ADMIN" | "FACULTY" | "SYSTEM";
  requesterId?: string;
  purpose: "EXAM" | "PLACEMENT" | "CLASS" | "SEMINAR" | "EVENT";
  sessionId?: string;
  subjectId?: string;
  title: string;
  startAt: string; // ISO
  endAt: string; // ISO
  capacityRequired: number;
  needsProjector: boolean;
  needsAC: boolean;
  status: "PENDING" | "NEW" | "ALLOCATED" | "FAILED" | "CANCELLED";
  allocatedRoomCode?: string;
  allocatedSeatPlan?: "AUTO" | "MANUAL";
};

type TabKey = "sessions" | "subjects" | "eligibility" | "tickets" | "runs";

// -------------------- small utils --------------------
function cx(...p: Array<string | false | null | undefined>) {
  return p.filter(Boolean).join(" ");
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
function uid(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
function downloadJson(filename: string, data: any) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
function inRange(date: string, start: string, end: string) {
  const d = new Date(date).getTime();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return d >= s && d <= e;
}
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
function minutesFromHHMM(hhmm: string) {
  const [hh, mm] = hhmm.split(":").map((x) => Number(x || 0));
  return (hh || 0) * 60 + (mm || 0);
}
function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  const as = minutesFromHHMM(aStart);
  const ae = minutesFromHHMM(aEnd);
  const bs = minutesFromHHMM(bStart);
  const be = minutesFromHHMM(bEnd);
  return Math.max(as, bs) < Math.min(ae, be);
}
function toISOFromDateTime(dateYYYYMMDD: string, timeHHMM: string) {
  const [y, m, d] = dateYYYYMMDD.split("-").map(Number);
  const [hh, mm] = timeHHMM.split(":").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  return dt.toISOString();
}
function truncate(s: string, n: number) {
  const t = s || "";
  return t.length <= n ? t : t.slice(0, n - 1) + "…";
}
function uniqBy<T>(arr: T[], keyFn: (x: T) => string) {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of arr) {
    const k = keyFn(it);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

// -------------------- UI atoms (MUST be outside component to avoid focus loss) --------------------
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{children}</div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={cx(
      "h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900",
      "px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm",
      "focus:outline-none focus:ring-2 focus:ring-indigo-500/25",
      props.className
    )}
  />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select
    {...props}
    className={cx(
      "h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900",
      "px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm",
      "focus:outline-none focus:ring-2 focus:ring-indigo-500/25",
      props.className
    )}
  />
);

const PrimaryBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
  <button
    {...props}
    className={cx(
      "h-10 px-4 rounded-xl text-sm font-semibold bg-indigo-600 text-white",
      "hover:bg-indigo-700 active:scale-[0.99] transition shadow-sm",
      "disabled:opacity-60 disabled:cursor-not-allowed",
      props.className
    )}
  />
);

const GhostBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
  <button
    {...props}
    className={cx(
      "h-10 px-4 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
      "dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
      "active:scale-[0.99] transition shadow-sm",
      "disabled:opacity-60 disabled:cursor-not-allowed",
      props.className
    )}
  />
);

const Modal: React.FC<{
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}> = ({ open, title, children, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute inset-3 sm:inset-6 grid place-items-center">
        <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="text-base font-semibold text-slate-900 dark:text-slate-50 truncate">{title}</div>
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 grid place-items-center hover:bg-slate-50 dark:hover:bg-slate-900 transition"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>
  );
};

// -------------------- eligibility rules --------------------
type StudentProfile = {
  regNo: string;
  name: string;
  attendancePct: number;
  feeStatus: "CLEAR" | "PENDING";
  cgpa: number;
  arrears: number;
  disciplinary: boolean;
};

function seededRand(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function buildStudentsForSession(sessionId: string): StudentProfile[] {
  const seed = Array.from(sessionId).reduce((a, c) => a + c.charCodeAt(0), 0) + 1337;
  const rnd = seededRand(seed);
  const first = ["Arjun", "Priya", "Rahul", "Anjali", "Vikram", "Sneha", "Karthik", "Meera", "Naveen", "Divya", "Sanjay", "Asha"];
  const last = ["Sharma", "Singh", "Kumar", "Gupta", "Patel", "Reddy", "Nair", "Joshi", "Iyer", "Menon", "Choudhary", "Bose"];

  const n = 12 + Math.floor(rnd() * 10); // 12-21
  const out: StudentProfile[] = [];
  for (let i = 0; i < n; i++) {
    const fn = first[Math.floor(rnd() * first.length)];
    const ln = last[Math.floor(rnd() * last.length)];
    const attendancePct = Math.round(55 + rnd() * 45); // 55-100
    const feeStatus: "CLEAR" | "PENDING" = rnd() < 0.8 ? "CLEAR" : "PENDING";
    const cgpa = Math.round((5.9 + rnd() * 4.0) * 10) / 10;
    const arrears = Math.floor(rnd() * 3);
    const disciplinary = rnd() < 0.10;
    const regNo = String(192211650 + i + Math.floor(rnd() * 8));
    out.push({ regNo, name: `${fn} ${ln}`, attendancePct, feeStatus, cgpa, arrears, disciplinary });
  }
  return uniqBy(out, (s) => s.regNo);
}

function computeEligibility(st: StudentProfile) {
  const eligible =
    st.attendancePct >= 75 &&
    st.feeStatus === "CLEAR" &&
    st.cgpa >= 6.5 &&
    st.arrears <= 1 &&
    !st.disciplinary;

  const confidencePct = eligible ? 100 : 0;
  const riskBand: "LOW" | "MEDIUM" | "HIGH" = eligible ? "LOW" : "HIGH";
  const reason = eligible ? "Eligible" : "Not eligible";

  return { eligible, confidencePct, riskBand, reason };
}

// -------------------- scheduling --------------------
type Slot = { examDate: string; startTime: string; endTime: string };
function enumerateDates(startYYYYMMDD: string, endYYYYMMDD: string): string[] {
  const out: string[] = [];
  const s = new Date(startYYYYMMDD + "T00:00:00");
  const e = new Date(endYYYYMMDD + "T00:00:00");
  for (let d = new Date(s); d.getTime() <= e.getTime(); d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear();
    const m = pad2(d.getMonth() + 1);
    const da = pad2(d.getDate());
    out.push(`${y}-${m}-${da}`);
  }
  return out;
}
function defaultSlotsForDate(examDate: string): Slot[] {
  return [
    { examDate, startTime: "09:30", endTime: "12:30" },
    { examDate, startTime: "13:30", endTime: "16:30" },
  ];
}
function groupKeyForSubject(s: ExamSubject) {
  return `${(s.batch || "").trim().toUpperCase()}::${(s.semester || "").trim().toUpperCase()}`;
}
function subjectHasValidSlot(s: ExamSubject) {
  return !!(s.examDate && s.startTime && s.endTime && minutesFromHHMM(s.endTime) > minutesFromHHMM(s.startTime));
}
function makeSlotKey(sessionId: string, groupKey: string, slot: Slot) {
  return `${sessionId}::${groupKey}::${slot.examDate}::${slot.startTime}-${slot.endTime}`;
}

function scheduleSubjectsClashFree(args: {
  session: ExamSession;
  subjects: ExamSubject[];
}): {
  updatedSubjects: ExamSubject[];
  conflicts: Array<{
    subjectId: string;
    courseCode: string;
    issue: string;
    suggestions: Slot[];
  }>;
  scheduledCount: number;
} {
  const { session, subjects } = args;
  const updated = subjects.map((x) => ({ ...x }));
  const conflicts: Array<{ subjectId: string; courseCode: string; issue: string; suggestions: Slot[] }> = [];

  const dates = enumerateDates(session.startDate, session.endDate);
  const slotPool: Slot[] = dates.flatMap((d) => defaultSlotsForDate(d));
  const reserved = new Set<string>();

  // reserve existing published slots if not duplicated
  for (const s of updated) {
    if (s.sessionId !== session.id) continue;
    if (s.status !== "PUBLISHED") continue;
    if (!subjectHasValidSlot(s)) continue;
    if (!inRange(s.examDate, session.startDate, session.endDate)) continue;

    const gk = groupKeyForSubject(s);
    const key = makeSlotKey(session.id, gk, { examDate: s.examDate, startTime: s.startTime, endTime: s.endTime });
    if (reserved.has(key)) {
      conflicts.push({
        subjectId: s.id,
        courseCode: s.courseCode,
        issue: `Clash detected for ${gk} at ${s.examDate} ${s.startTime}-${s.endTime}`,
        suggestions: slotPool.slice(0, 6),
      });
    } else {
      reserved.add(key);
    }
  }

  // schedule missing/invalid/clashing ones
  for (const s of updated) {
    if (s.sessionId !== session.id) continue;
    if (s.status !== "PUBLISHED") continue;

    const gk = groupKeyForSubject(s);

    const alreadyValid =
      subjectHasValidSlot(s) &&
      inRange(s.examDate, session.startDate, session.endDate) &&
      !reserved.has(makeSlotKey(session.id, gk, { examDate: s.examDate, startTime: s.startTime, endTime: s.endTime }));

    if (alreadyValid) {
      reserved.add(makeSlotKey(session.id, gk, { examDate: s.examDate, startTime: s.startTime, endTime: s.endTime }));
      continue;
    }

    const suggestions: Slot[] = [];
    let chosen: Slot | null = null;

    for (const slot of slotPool) {
      const key = makeSlotKey(session.id, gk, slot);
      if (reserved.has(key)) {
        suggestions.push(slot);
        continue;
      }

      const sameGroupSameDay = updated.filter(
        (x) =>
          x.sessionId === session.id &&
          x.status === "PUBLISHED" &&
          groupKeyForSubject(x) === gk &&
          x.examDate === slot.examDate &&
          subjectHasValidSlot(x)
      );

      const hasOverlap = sameGroupSameDay.some((x) => overlaps(x.startTime, x.endTime, slot.startTime, slot.endTime));
      if (hasOverlap) {
        suggestions.push(slot);
        continue;
      }

      chosen = slot;
      break;
    }

    if (!chosen) {
      conflicts.push({
        subjectId: s.id,
        courseCode: s.courseCode,
        issue: `No slot available for ${gk} within ${session.startDate} → ${session.endDate}`,
        suggestions: suggestions.slice(0, 8),
      });
      continue;
    }

    s.examDate = chosen.examDate;
    s.startTime = chosen.startTime;
    s.endTime = chosen.endTime;
    reserved.add(makeSlotKey(session.id, gk, chosen));
  }

  const scheduledCount = updated.filter(
    (x) => x.sessionId === session.id && x.status === "PUBLISHED" && subjectHasValidSlot(x)
  ).length;

  return { updatedSubjects: updated, conflicts, scheduledCount };
}

// -------------------- allocation simulator --------------------
const ROOM_CODES = ["A-101", "A-102", "A-201", "B-103", "B-202", "C-105", "C-206", "D-110", "D-210"];
function pickRoomFor(i: number) {
  return ROOM_CODES[i % ROOM_CODES.length];
}
function makeSeat(regNo: string, idx: number) {
  const n = Number(regNo.slice(-2)) || 0;
  const seatNo = (n + idx * 7) % 60;
  return `S-${pad2(seatNo === 0 ? 1 : seatNo)}`;
}

// -------------------- main --------------------
const AdminExams: React.FC = () => {
  const [tab, setTab] = useState<TabKey>("sessions");
  const [q, setQ] = useState("");

  const [toast, setToast] = useState<string | null>(null);
  const toastMsg = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 2200);
  };

  // Start clean (no persistence)
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [subjects, setSubjects] = useState<ExamSubject[]>([]);
  const [eligibility, setEligibility] = useState<EligibilityRow[]>([]);
  const [tickets, setTickets] = useState<HallTicket[]>([]);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [roomRequests, setRoomRequests] = useState<RoomRequest[]>([]);

  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  // refs for stable, latest snapshots (used by delayed allocation)
  const roomRequestsRef = useRef<RoomRequest[]>(roomRequests);
  const ticketsRef = useRef<HallTicket[]>(tickets);
  const subjectsRef = useRef<ExamSubject[]>(subjects);
  useEffect(() => void (roomRequestsRef.current = roomRequests), [roomRequests]);
  useEffect(() => void (ticketsRef.current = tickets), [tickets]);
  useEffect(() => void (subjectsRef.current = subjects), [subjects]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId]
  );

  // keep selection sane
  useEffect(() => {
    if (sessions.length === 0) {
      setSelectedSessionId("");
      return;
    }
    if (selectedSessionId && sessions.some((s) => s.id === selectedSessionId)) return;
    setSelectedSessionId(sessions[0].id);
  }, [sessions, selectedSessionId]);

  const sessionSubjects = useMemo(
    () => subjects.filter((s) => s.sessionId === selectedSessionId),
    [subjects, selectedSessionId]
  );
  const sessionEligibility = useMemo(
    () => eligibility.filter((e) => e.sessionId === selectedSessionId),
    [eligibility, selectedSessionId]
  );
  const sessionTickets = useMemo(
    () => tickets.filter((t) => t.sessionId === selectedSessionId),
    [tickets, selectedSessionId]
  );
  const sessionRuns = useMemo(
    () => runs.filter((r) => r.sessionId === selectedSessionId),
    [runs, selectedSessionId]
  );
  const lastRun = useMemo(() => sessionRuns[0] ?? null, [sessionRuns]);

  // KPIs
  const kpis = useMemo(() => {
    const totalSessions = sessions.length;
    const planned = subjects.filter((s) => s.status === "PLANNED").length;
    const published = subjects.filter((s) => s.status === "PUBLISHED").length;
    const elig = activeSession ? sessionEligibility.filter((e) => e.eligible).length : 0;
    const issued = activeSession ? sessionTickets.length : 0;
    const pendingRequests = roomRequests.filter(
      (r) => r.sessionId === selectedSessionId && (r.status === "PENDING" || r.status === "NEW")
    ).length;
    const allocated = roomRequests.filter(
      (r) => r.sessionId === selectedSessionId && r.status === "ALLOCATED"
    ).length;
    return { totalSessions, planned, published, elig, issued, pendingRequests, allocated };
  }, [sessions.length, subjects, activeSession, sessionEligibility, sessionTickets, roomRequests, selectedSessionId]);

  // Filters
  const sessionFiltered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return sessions;
    return sessions.filter((x) =>
      `${x.title} ${x.term} ${x.status} ${x.startDate} ${x.endDate}`.toLowerCase().includes(s)
    );
  }, [q, sessions]);

  const subjectFiltered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return sessionSubjects;
    return sessionSubjects.filter((x) =>
      `${x.courseCode} ${x.courseName} ${x.examDate} ${x.batch} ${x.semester}`.toLowerCase().includes(s)
    );
  }, [q, sessionSubjects]);

  const eligibilityFiltered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return sessionEligibility;
    return sessionEligibility.filter((x) =>
      `${x.regNo} ${x.name} ${x.feeStatus} ${x.attendancePct} ${x.reason}`.toLowerCase().includes(s)
    );
  }, [q, sessionEligibility]);

  const ticketFiltered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return sessionTickets;
    return sessionTickets.filter((x) => `${x.regNo} ${x.name}`.toLowerCase().includes(s));
  }, [q, sessionTickets]);

  // Tab buttons
  const TabBtn: React.FC<{ k: TabKey; children: React.ReactNode }> = ({ k, children }) => (
    <button
      type="button"
      onClick={() => setTab(k)}
      className={cx(
        "h-10 px-4 text-sm font-semibold transition",
        tab === k
          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
          : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
      )}
    >
      {children}
    </button>
  );

  const StatusPill: React.FC<{ status: SessionStatus }> = ({ status }) => {
    const cls =
      status === "DRAFT"
        ? "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        : status === "SCHEDULED"
        ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
        : status === "RUNNING"
        ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
        : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200";
    return <span className={cx("text-xs px-2 py-1 rounded-lg border font-semibold", cls)}>{status}</span>;
  };

  // Create session
  const [newTitle, setNewTitle] = useState("");
  const [newTerm, setNewTerm] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  const addSession = () => {
    const title = newTitle.trim();
    if (!title) return toastMsg("Enter session title.");
    if (!newStart || !newEnd) return toastMsg("Select start/end date.");
    if (new Date(newEnd).getTime() < new Date(newStart).getTime()) return toastMsg("End date must be after start date.");

    const session: ExamSession = {
      id: uid("sess"),
      title,
      term: newTerm.trim() || "",
      startDate: newStart,
      endDate: newEnd,
      status: "DRAFT",
      createdAt: ddmmyyyy(),
    };

    setSessions((prev) => [session, ...prev]);
    setSelectedSessionId(session.id);
    setTab("subjects");
    setNewTitle("");
    toastMsg("Session created.");
  };

  // Add subject
  const [subCode, setSubCode] = useState("");
  const [subName, setSubName] = useState("");
  const [subDate, setSubDate] = useState("");
  const [subStart, setSubStart] = useState("09:30");
  const [subEnd, setSubEnd] = useState("12:30");
  const [subBatch, setSubBatch] = useState("");
  const [subSem, setSubSem] = useState("");

  const addSubject = () => {
    if (!activeSession) return toastMsg("Create/select a session first.");
    if (!subCode.trim() || !subName.trim()) return toastMsg("Enter course code & name.");
    if (!subDate) return toastMsg("Select exam date.");
    if (!inRange(subDate, activeSession.startDate, activeSession.endDate))
      return toastMsg("Exam date must be within session start/end.");
    if (minutesFromHHMM(subEnd) <= minutesFromHHMM(subStart)) return toastMsg("End time must be after start time.");

    const subj: ExamSubject = {
      id: uid("sub"),
      sessionId: activeSession.id,
      courseCode: subCode.trim().toUpperCase(),
      courseName: subName.trim(),
      examDate: subDate,
      startTime: subStart,
      endTime: subEnd,
      batch: subBatch.trim() || "",
      semester: subSem.trim() || "",
      status: "PUBLISHED",
    };

    setSubjects((prev) => [subj, ...prev]);
    setSubCode("");
    setSubName("");
    toastMsg("Subject added.");
  };

  const publishAll = () => {
    if (!activeSession) return toastMsg("Select a session.");
    setSubjects((prev) =>
      prev.map((s) => (s.sessionId === activeSession.id ? { ...s, status: "PUBLISHED" } : s))
    );
    toastMsg("Subjects published.");
  };

  // Edit subject slot (postpone)
  const [editOpen, setEditOpen] = useState(false);
  const [editSubjectId, setEditSubjectId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  const openEdit = (s: ExamSubject) => {
    setEditSubjectId(s.id);
    setEditDate(s.examDate);
    setEditStart(s.startTime);
    setEditEnd(s.endTime);
    setEditOpen(true);
  };

  const saveEdit = () => {
    if (!activeSession || !editSubjectId) return setEditOpen(false);
    if (!editDate || !editStart || !editEnd) return toastMsg("Enter date & time.");
    if (!inRange(editDate, activeSession.startDate, activeSession.endDate))
      return toastMsg("Exam date must be within session start/end.");
    if (minutesFromHHMM(editEnd) <= minutesFromHHMM(editStart)) return toastMsg("End time must be after start time.");

    const subj = subjectsRef.current.find((x) => x.id === editSubjectId);
    if (!subj) return setEditOpen(false);

    setSubjects((prev) =>
      prev.map((x) =>
        x.id === editSubjectId
          ? { ...x, examDate: editDate, startTime: editStart, endTime: editEnd, status: "PUBLISHED" }
          : x
      )
    );

    // update hall tickets (date/time) + reset room/seat
    setTickets((prev) =>
      prev.map((t) => {
        if (t.sessionId !== activeSession.id) return t;
        return {
          ...t,
          items: t.items.map((it) =>
            it.courseCode === subj.courseCode
              ? { ...it, examDate: editDate, startTime: editStart, room: "PENDING", seat: "PENDING" }
              : it
          ),
        };
      })
    );

    // update room requests tied to subject
    setRoomRequests((prev) =>
      prev.map((r) =>
        r.subjectId === editSubjectId
          ? {
              ...r,
              startAt: toISOFromDateTime(editDate, editStart),
              endAt: toISOFromDateTime(editDate, editEnd),
              status: "PENDING",
              allocatedRoomCode: undefined,
            }
          : r
      )
    );

    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? { ...s, status: "SCHEDULED" } : s))
    );

    setEditOpen(false);
    setEditSubjectId(null);
    toastMsg("Exam slot updated.");
  };

  // Ticket selection
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  useEffect(() => {
    if (!sessionTickets.length) {
      setSelectedTicketId(null);
      return;
    }
    if (selectedTicketId && sessionTickets.some((t) => t.id === selectedTicketId)) return;
    setSelectedTicketId(sessionTickets[0].id);
  }, [sessionTickets, selectedTicketId]);

  const selectedTicket = useMemo(() => {
    if (!selectedTicketId) return sessionTickets[0] ?? null;
    return sessionTickets.find((t) => t.id === selectedTicketId) ?? sessionTickets[0] ?? null;
  }, [sessionTickets, selectedTicketId]);

  // Run workflow
  const [running, setRunning] = useState(false);
  const allocationTimerRef = useRef<number | null>(null);

  const clearPendingAllocationTimer = () => {
    if (allocationTimerRef.current) {
      window.clearTimeout(allocationTimerRef.current);
      allocationTimerRef.current = null;
    }
  };

  const simulateAllocation = (sessionId: string) => {
    clearPendingAllocationTimer();

    allocationTimerRef.current = window.setTimeout(() => {
      const currentRR = roomRequestsRef.current;

      // allocate rooms for pending/new
      const nextRR = currentRR.map((r, idx) => {
        if (r.sessionId !== sessionId) return r;
        if (r.status !== "PENDING" && r.status !== "NEW") return r;
        const fail = idx % 13 === 9;
        if (fail) return { ...r, status: "FAILED", allocatedRoomCode: undefined, allocatedSeatPlan: undefined };
        return { ...r, status: "ALLOCATED", allocatedRoomCode: pickRoomFor(idx), allocatedSeatPlan: "AUTO" };
      });

      // commit RR
      setRoomRequests(nextRR);

      // apply to tickets
      const allocatedOnly = nextRR.filter((r) => r.sessionId === sessionId && r.status === "ALLOCATED" && r.allocatedRoomCode);
      const bySubject = new Map<string, RoomRequest>();
      for (const rr of allocatedOnly) {
        if (!rr.subjectId) continue;
        if (!bySubject.has(rr.subjectId)) bySubject.set(rr.subjectId, rr);
      }

      setTickets((prev) =>
        prev.map((t) => {
          if (t.sessionId !== sessionId) return t;
          // build subjectId lookup by courseCode+datetime using current subjects
          const sList = subjectsRef.current.filter((s) => s.sessionId === sessionId);
          const courseToSubject = new Map<string, string>();
          for (const s of sList) {
            courseToSubject.set(`${s.courseCode}::${s.examDate}::${s.startTime}`, s.id);
          }

          const nextItems = t.items.map((it, i) => {
            if (it.room !== "PENDING" && it.seat !== "PENDING") return it;

            const subjectId = courseToSubject.get(`${it.courseCode}::${it.examDate}::${it.startTime}`);
            if (!subjectId) return it;

            const rr = bySubject.get(subjectId);
            if (!rr?.allocatedRoomCode) return it;

            return { ...it, room: rr.allocatedRoomCode, seat: makeSeat(t.regNo, i) };
          });

          return { ...t, items: nextItems };
        })
      );

      toastMsg("Room allocation completed.");
    }, 1200);
  };

  useEffect(() => {
    return () => clearPendingAllocationTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSession = async () => {
    if (!activeSession) return toastMsg("Select a session.");
    const published = sessionSubjects.filter((s) => s.status === "PUBLISHED");
    if (published.length === 0) return toastMsg("Add & publish subjects before running.");

    setRunning(true);
    setSessions((prev) => prev.map((s) => (s.id === activeSession.id ? { ...s, status: "RUNNING" } : s)));

    try {
      // 1) clash-free schedule
      const sched = scheduleSubjectsClashFree({ session: activeSession, subjects: subjectsRef.current });
      setSubjects(sched.updatedSubjects);

      const scheduledSubjects = sched.updatedSubjects.filter(
        (s) => s.sessionId === activeSession.id && s.status === "PUBLISHED" && subjectHasValidSlot(s)
      );

      // 2) eligibility
      const students = buildStudentsForSession(activeSession.id);
      const newEligibility: EligibilityRow[] = students.map((st) => {
        const r = computeEligibility(st);
        return {
          id: uid("elig"),
          sessionId: activeSession.id,
          regNo: st.regNo,
          name: st.name,
          attendancePct: st.attendancePct,
          feeStatus: st.feeStatus,
          eligible: r.eligible,
          reason: r.reason,
          confidencePct: r.confidencePct,
          riskBand: r.riskBand,
        };
      });

      const eligibleRows = newEligibility.filter((e) => e.eligible);
      const ineligibleRows = newEligibility.filter((e) => !e.eligible);

      // 3) hall tickets for eligible
      const newTickets: HallTicket[] = eligibleRows.map((e) => ({
        id: uid("ticket"),
        sessionId: activeSession.id,
        regNo: e.regNo,
        name: e.name,
        issuedAt: ddmmyyyy(),
        items: scheduledSubjects.map((s) => ({
          courseCode: s.courseCode,
          courseName: s.courseName,
          examDate: s.examDate,
          startTime: s.startTime,
          room: "PENDING",
          seat: "PENDING",
        })),
      }));

      // 4) room requests per subject
      const capBase = Math.max(30, Math.min(140, Math.ceil(eligibleRows.length * 0.9)));
      const newRoomRequests: RoomRequest[] = scheduledSubjects.map((s, idx) => ({
        id: uid("room"),
        requestedAt: new Date().toISOString(),
        requesterRole: "SYSTEM",
        requesterId: "exam",
        purpose: "EXAM",
        sessionId: activeSession.id,
        subjectId: s.id,
        title: `${s.courseCode} - ${s.courseName}`,
        startAt: toISOFromDateTime(s.examDate, s.startTime),
        endAt: toISOFromDateTime(s.examDate, s.endTime),
        capacityRequired: capBase + (idx % 3) * 10,
        needsProjector: false,
        needsAC: true,
        status: "PENDING",
      }));

      // Replace computed outputs only for this session
      setEligibility((prev) => [...newEligibility, ...prev.filter((x) => x.sessionId !== activeSession.id)]);
      setTickets((prev) => [...newTickets, ...prev.filter((x) => x.sessionId !== activeSession.id)]);
      setRoomRequests((prev) => [...newRoomRequests, ...prev.filter((x) => x.sessionId !== activeSession.id)]);

      // 5) run log
      const totalPublished = published.length;
      const runOk = sched.conflicts.length === 0 && scheduledSubjects.length === totalPublished;

      const message = runOk
        ? `Schedule committed. Eligibility computed for ${students.length}. Hall tickets issued for ${eligibleRows.length}. Room requests created for ${scheduledSubjects.length}.`
        : `Partial commit (${scheduledSubjects.length}/${totalPublished}). Conflicts require attention. Eligibility and tickets generated for scheduled subjects.`;

      const newRun: AgentRun = {
        id: uid("run"),
        sessionId: activeSession.id,
        requestedAt: ddmmyyyy_hhmm(),
        status: runOk ? "SUCCESS" : "FAILED",
        message,
        meta: {
          scheduledSubjects: scheduledSubjects.length,
          totalSubjects: totalPublished,
          eligibleCount: eligibleRows.length,
          ineligibleCount: ineligibleRows.length,
          ticketsIssued: newTickets.length,
          roomRequestsCreated: newRoomRequests.length,
          conflicts: sched.conflicts.length
            ? sched.conflicts.map((c) => ({
                subjectId: c.subjectId,
                courseCode: c.courseCode,
                issue: c.issue,
                suggestions: c.suggestions,
              }))
            : undefined,
        },
      };

      setRuns((prev) => [newRun, ...prev.filter((r) => r.sessionId !== activeSession.id)]);

      // 6) session status
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id ? { ...s, status: runOk ? "COMPLETED" : "SCHEDULED" } : s
        )
      );

      // 7) allocate
      simulateAllocation(activeSession.id);

      toastMsg(runOk ? "Run completed." : "Run completed with conflicts.");
      setTab("runs");
    } finally {
      setRunning(false);
    }
  };

  // destructive
  const deleteSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((x) => x.id !== sessionId));
    setSubjects((prev) => prev.filter((x) => x.sessionId !== sessionId));
    setEligibility((prev) => prev.filter((x) => x.sessionId !== sessionId));
    setTickets((prev) => prev.filter((x) => x.sessionId !== sessionId));
    setRuns((prev) => prev.filter((x) => x.sessionId !== sessionId));
    setRoomRequests((prev) => prev.filter((x) => x.sessionId !== sessionId));
    toastMsg("Session deleted.");
  };

  // -------------------- render --------------------
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Examinations</h1>
          {lastRun && (
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Last run:{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{lastRun.requestedAt}</span> •{" "}
              <span
                className={cx(
                  "font-semibold",
                  lastRun.status === "SUCCESS"
                    ? "text-indigo-700 dark:text-indigo-200"
                    : "text-amber-800 dark:text-amber-200"
                )}
              >
                {lastRun.status}
              </span>{" "}
              • <span className="text-slate-600 dark:text-slate-300">{truncate(lastRun.message, 120)}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="min-w-[260px]"
            disabled={sessions.length === 0}
          >
            {sessions.length === 0 ? (
              <option value="">No sessions</option>
            ) : (
              sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))
            )}
          </Select>

          <PrimaryBtn type="button" onClick={runSession} disabled={!activeSession || running}>
            {running ? "Running..." : "Run"}
          </PrimaryBtn>

          <GhostBtn
            type="button"
            onClick={() =>
              downloadJson(`exams_export_${Date.now()}.json`, {
                sessions,
                subjects,
                eligibility,
                tickets,
                runs,
                roomRequests,
              })
            }
          >
            Export
          </GhostBtn>
        </div>
      </div>

      {/* KPI */}
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-7 gap-3">
        {[
          { label: "Sessions", value: kpis.totalSessions },
          { label: "Planned Subjects", value: kpis.planned },
          { label: "Published Subjects", value: kpis.published },
          { label: "Eligible", value: kpis.elig },
          { label: "Hall Tickets", value: kpis.issued },
          { label: "Room Req (Pending)", value: kpis.pendingRequests },
          { label: "Allocated Rooms", value: kpis.allocated },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] p-4"
          >
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{c.label}</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Main Panel */}
      <div className="mt-4 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] overflow-hidden">
        {/* Tabs */}
        <div className="px-4 sm:px-6 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <TabBtn k="sessions">Sessions</TabBtn>
            <TabBtn k="subjects">Subjects</TabBtn>
            <TabBtn k="eligibility">Eligibility</TabBtn>
            <TabBtn k="tickets">Hall Tickets</TabBtn>
            <TabBtn k="runs">Runs</TabBtn>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm text-slate-600 dark:text-slate-300">Search:</div>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Type to filter..."
              className="w-full sm:w-[320px]"
            />
          </div>
        </div>

        <div className="px-4 sm:px-6 py-5">
          {/* SESSIONS */}
          {tab === "sessions" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              <div className="xl:col-span-5">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Create Session</div>

                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-2">
                      <Label>Title</Label>
                      <Input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g., Nov/Dec 2025 – End Semester"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-2">
                      <Label>Term</Label>
                      <Input
                        value={newTerm}
                        onChange={(e) => setNewTerm(e.target.value)}
                        placeholder="e.g., AY 2025–26 • Odd Sem"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Start date</div>
                        <Input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">End date</div>
                        <Input type="date" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <PrimaryBtn type="button" onClick={addSession}>
                        Create
                      </PrimaryBtn>
                      <GhostBtn
                        type="button"
                        onClick={() => {
                          setNewTitle("");
                          setNewTerm("");
                          setNewStart("");
                          setNewEnd("");
                          toastMsg("Cleared.");
                        }}
                      >
                        Clear
                      </GhostBtn>
                    </div>
                  </div>
                </div>
              </div>

              <div className="xl:col-span-7">
                <div className="overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/40">
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[260px]">
                          Session
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[180px]">
                          Term
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[170px]">
                          Dates
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[160px]">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionFiltered.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center">
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">No sessions</div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Create a session to begin.</div>
                          </td>
                        </tr>
                      ) : (
                        sessionFiltered.map((s) => (
                          <tr
                            key={s.id}
                            className={cx(
                              "border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition",
                              s.id === selectedSessionId && "bg-indigo-50/40 dark:bg-indigo-500/10"
                            )}
                          >
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-900 dark:text-white">{s.title}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">Created: {s.createdAt}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{s.term}</td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">
                              {s.startDate} → {s.endDate}
                            </td>
                            <td className="px-4 py-3">
                              <StatusPill status={s.status} />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedSessionId(s.id)}
                                  className="h-8 px-3 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50
                                             dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
                                >
                                  Select
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteSession(s.id)}
                                  className="h-8 px-3 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50
                                             dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {activeSession && (
                  <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Active session:{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{activeSession.title}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUBJECTS */}
          {tab === "subjects" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              <div className="xl:col-span-5">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Add Subject</div>

                  {!activeSession ? (
                    <div className="mt-3 text-sm text-slate-700 dark:text-slate-200">Create/select a session first.</div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <Label>Course code</Label>
                          <Input
                            value={subCode}
                            onChange={(e) => setSubCode(e.target.value)}
                            placeholder="e.g., CSA1524"
                          />
                        </div>
                        <div>
                          <Label>Exam date</Label>
                          <Input type="date" value={subDate} onChange={(e) => setSubDate(e.target.value)} />
                        </div>
                      </div>

                      <div>
                        <Label>Course name</Label>
                        <Input
                          value={subName}
                          onChange={(e) => setSubName(e.target.value)}
                          placeholder="Enter course title"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <Label>Start time</Label>
                          <Input type="time" value={subStart} onChange={(e) => setSubStart(e.target.value)} />
                        </div>
                        <div>
                          <Label>End time</Label>
                          <Input type="time" value={subEnd} onChange={(e) => setSubEnd(e.target.value)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <Label>Batch</Label>
                          <Input value={subBatch} onChange={(e) => setSubBatch(e.target.value)} placeholder="e.g., CSE A" />
                        </div>
                        <div>
                          <Label>Semester</Label>
                          <Input value={subSem} onChange={(e) => setSubSem(e.target.value)} placeholder="e.g., Sem 5" />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <PrimaryBtn type="button" onClick={addSubject}>
                          Add
                        </PrimaryBtn>
                        <GhostBtn type="button" onClick={publishAll}>
                          Publish All
                        </GhostBtn>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="xl:col-span-7">
                <div className="overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/40">
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[160px]">Course</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[260px]">Title</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[170px]">Slot</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[160px]">Batch / Sem</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[180px]">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjectFiltered.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center">
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">No subjects</div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Add subjects to proceed.</div>
                          </td>
                        </tr>
                      ) : (
                        subjectFiltered.map((s) => (
                          <tr key={s.id} className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition">
                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{s.courseCode}</td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{s.courseName}</td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">
                              {s.examDate} • {s.startTime}–{s.endTime}
                            </td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{s.batch} • {s.semester}</td>
                            <td className="px-4 py-3">
                              <span
                                className={cx(
                                  "text-xs px-2 py-1 rounded-lg border font-semibold",
                                  s.status === "PUBLISHED"
                                    ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
                                    : "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                )}
                              >
                                {s.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEdit(s)}
                                  className="h-8 px-3 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50
                                           dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSubjects((prev) => prev.filter((x) => x.id !== s.id));
                                    setRoomRequests((prev) => prev.filter((r) => r.subjectId !== s.id));
                                    toastMsg("Subject deleted.");
                                  }}
                                  className="h-8 px-3 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50
                                           dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ELIGIBILITY */}
          {tab === "eligibility" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Eligibility</div>
                  <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Eligibility determined by simple rules: attendance &gt;=75%, fee clear, CGPA &gt;=6.5, arrears &lt;=1, no disciplinary.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <GhostBtn type="button" onClick={() => downloadJson(`eligibility_${Date.now()}.json`, sessionEligibility)}>
                    Download
                  </GhostBtn>
                </div>
              </div>

              <div className="mt-4 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/40">
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">Reg No</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[220px]">Student</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[160px]">Attendance %</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">Fee</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">Eligible</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">Confidence</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">Risk</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[520px]">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eligibilityFiltered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center">
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">No eligibility data</div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Run to generate eligibility.</div>
                        </td>
                      </tr>
                    ) : (
                      eligibilityFiltered.map((e) => (
                        <tr key={e.id} className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition">
                          <td className="px-4 py-3 text-slate-900 dark:text-white tabular-nums font-semibold">{e.regNo}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{e.name}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">{e.attendancePct}</td>
                          <td className="px-4 py-3">
                            <span
                              className={cx(
                                "text-xs px-2 py-1 rounded-lg border font-semibold",
                                e.feeStatus === "CLEAR"
                                  ? "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                  : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                              )}
                            >
                              {e.feeStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cx(
                                "text-xs px-2 py-1 rounded-lg border font-semibold",
                                e.eligible
                                  ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
                                  : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                              )}
                            >
                              {e.eligible ? "Yes" : "No"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">{e.confidencePct.toFixed(1)}%</td>
                          <td className="px-4 py-3">
                            <span
                              className={cx(
                                "text-xs px-2 py-1 rounded-lg border font-semibold",
                                e.riskBand === "LOW"
                                  ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
                                  : e.riskBand === "MEDIUM"
                                  ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                                  : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                              )}
                            >
                              {e.riskBand}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{e.reason}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TICKETS */}
          {tab === "tickets" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Hall Tickets</div>
                  <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Rooms and seats populate after allocation.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <GhostBtn type="button" onClick={() => downloadJson(`hall_tickets_${Date.now()}.json`, sessionTickets)}>
                    Download
                  </GhostBtn>
                  {activeSession ? (
                    <GhostBtn type="button" onClick={() => simulateAllocation(activeSession.id)}>
                      Allocate Now
                    </GhostBtn>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-5">
                  <div className="overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-900/40">
                        <tr className="border-b border-slate-200 dark:border-slate-800">
                          <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">Reg No</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[220px]">Student</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[120px]">Issued</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ticketFiltered.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-4 py-10 text-center">
                              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">No hall tickets</div>
                              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Run to generate.</div>
                            </td>
                          </tr>
                        ) : (
                          ticketFiltered.map((t) => (
                            <tr
                              key={t.id}
                              onClick={() => setSelectedTicketId(t.id)}
                              className={cx(
                                "border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition cursor-pointer",
                                t.id === selectedTicketId && "bg-indigo-50/40 dark:bg-indigo-500/10"
                              )}
                            >
                              <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white tabular-nums">{t.regNo}</td>
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{t.name}</td>
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">{t.issuedAt}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="lg:col-span-7">
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-sm">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Preview</div>

                    {!selectedTicket ? (
                      <div className="mt-4 text-sm text-slate-700 dark:text-slate-200">No ticket available.</div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">Hall Ticket</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {activeSession?.title ?? "Session"} • Issued: {selectedTicket.issuedAt}
                          </div>
                        </div>

                        <div className="p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">Registration No</div>
                              <div className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">{selectedTicket.regNo}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">Student</div>
                              <div className="text-sm font-semibold text-slate-900 dark:text-white">{selectedTicket.name}</div>
                            </div>
                          </div>

                          <div className="mt-4 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
                            <table className="w-full text-sm">
                              <thead className="bg-slate-50 dark:bg-slate-900/40">
                                <tr className="border-b border-slate-200 dark:border-slate-800">
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 min-w-[120px]">Course</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 min-w-[220px]">Title</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 min-w-[160px]">Date/Time</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 min-w-[120px]">Room</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 min-w-[120px]">Seat</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedTicket.items.map((it, i) => (
                                  <tr key={`${it.courseCode}_${i}`} className="border-b border-slate-200/70 dark:border-slate-800/70">
                                    <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white">{it.courseCode}</td>
                                    <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{it.courseName}</td>
                                    <td className="px-3 py-2 text-slate-700 dark:text-slate-200 tabular-nums">
                                      {it.examDate} • {it.startTime}
                                    </td>
                                    <td className="px-3 py-2 text-slate-700 dark:text-slate-200 tabular-nums">{it.room}</td>
                                    <td className="px-3 py-2 text-slate-700 dark:text-slate-200 tabular-nums">{it.seat}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <PrimaryBtn type="button" onClick={() => downloadJson(`hall_ticket_${selectedTicket.regNo}_${Date.now()}.json`, selectedTicket)}>
                              Download Ticket
                            </PrimaryBtn>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RUNS */}
          {tab === "runs" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Runs</div>
                  <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Execution log with conflict suggestions and metrics.</div>
                </div>

                <div className="flex items-center gap-2">
                  <GhostBtn type="button" onClick={() => downloadJson(`exam_runs_${Date.now()}.json`, sessionRuns)}>
                    Download
                  </GhostBtn>
                  {activeSession ? (
                    <GhostBtn type="button" onClick={() => simulateAllocation(activeSession.id)}>
                      Allocate Now
                    </GhostBtn>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/40">
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[200px]">Time</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[520px]">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionRuns.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-10 text-center">
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">No runs</div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Run to generate outputs.</div>
                        </td>
                      </tr>
                    ) : (
                      sessionRuns.map((r) => (
                        <tr key={r.id} className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition align-top">
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">{r.requestedAt}</td>
                          <td className="px-4 py-3">
                            <span
                              className={cx(
                                "text-xs px-2 py-1 rounded-lg border font-semibold",
                                r.status === "SUCCESS"
                                  ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
                                  : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                              )}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                            <div className="whitespace-pre-wrap">{r.message}</div>

                            {r.meta?.conflicts?.length ? (
                              <div className="mt-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 p-3">
                                <div className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                                  Conflict suggestions
                                </div>
                                <div className="mt-2 space-y-2">
                                  {r.meta.conflicts.slice(0, 5).map((c) => (
                                    <div key={c.subjectId} className="text-xs text-amber-900 dark:text-amber-100">
                                      <div className="font-semibold">
                                        {c.courseCode}: {c.issue}
                                      </div>
                                      {c.suggestions?.length ? (
                                        <div className="mt-1">
                                          Suggested slots:{" "}
                                          {c.suggestions
                                            .slice(0, 3)
                                            .map((s) => `${s.examDate} ${s.startTime}-${s.endTime}`)
                                            .join(" • ")}
                                        </div>
                                      ) : null}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            {r.meta ? (
                              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                Metrics: scheduled {r.meta.scheduledSubjects}/{r.meta.totalSubjects} • eligible{" "}
                                {r.meta.eligibleCount} • ineligible {r.meta.ineligibleCount} • tickets{" "}
                                {r.meta.ticketsIssued} • room requests {r.meta.roomRequestsCreated}
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Room Requests</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Shows pending vs allocated exam halls.</div>
                  </div>
                  <div className="flex gap-2">
                    <GhostBtn
                      type="button"
                      onClick={() =>
                        downloadJson(
                          `room_requests_${selectedSessionId || "all"}_${Date.now()}.json`,
                          selectedSessionId ? roomRequests.filter((r) => r.sessionId === selectedSessionId) : roomRequests
                        )
                      }
                    >
                      Download
                    </GhostBtn>
                  </div>
                </div>

                <div className="mt-3 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/40">
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[260px]">Title</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[220px]">Start</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[120px]">Capacity</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[120px]">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">Room</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedSessionId ? roomRequests.filter((r) => r.sessionId === selectedSessionId) : roomRequests).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-600 dark:text-slate-300">
                            No room requests.
                          </td>
                        </tr>
                      ) : (
                        (selectedSessionId ? roomRequests.filter((r) => r.sessionId === selectedSessionId) : roomRequests)
                          .slice(0, 24)
                          .map((r) => (
                            <tr key={r.id} className="border-b border-slate-200/70 dark:border-slate-800/70">
                              <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{r.title}</td>
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">
                                {new Date(r.startAt).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">{r.capacityRequired}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={cx(
                                    "text-xs px-2 py-1 rounded-lg border font-semibold",
                                    r.status === "ALLOCATED"
                                      ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
                                      : r.status === "FAILED"
                                      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                                      : "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                  )}
                                >
                                  {r.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">
                                {r.allocatedRoomCode || "PENDING"}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal open={editOpen} title="Edit Exam Slot" onClose={() => setEditOpen(false)}>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <Label>Date</Label>
              <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
            </div>
            <div>
              <Label>Start</Label>
              <Input type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
            </div>
            <div>
              <Label>End</Label>
              <Input type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <GhostBtn type="button" onClick={() => setEditOpen(false)}>
              Cancel
            </GhostBtn>
            <PrimaryBtn type="button" onClick={saveEdit}>
              Save
            </PrimaryBtn>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[90]">
          <div className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm shadow-lg">{toast}</div>
        </div>
      )}
    </div>
  );
};

export { AdminExams };
