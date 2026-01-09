// src/layouts/admin/placements/AdminPlacements.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2Icon,
  BriefcaseBusinessIcon,
  SparklesIcon,
  RefreshCwIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  UsersIcon,
  BadgeCheckIcon,
  BadgeXIcon,
  CalendarDaysIcon,
  ClockIcon,
  ClipboardListIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  PlayIcon,
  SearchIcon,
  GraduationCapIcon,
  HandshakeIcon,
  FileTextIcon,
} from "lucide-react";



function Modal({
  open,
  title,
  children,
  onClose,
  footer,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-[820px] rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="text-[14px] font-semibold text-slate-900">{title}</div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-slate-100 transition"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="p-5">{children}</div>
          {footer ? <div className="px-5 py-4 border-t border-slate-200 bg-slate-50">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

/** ---------- types ---------- */
type DriveStage =
  | "ANNOUNCED"
  | "APPLICATIONS"
  | "SHORTLISTED"
  | "TEST"
  | "INTERVIEWS"
  | "RESULTS"
  | "CLOSED";

type ApplicationStatus =
  | "APPLIED"
  | "INELIGIBLE"
  | "SHORTLISTED"
  | "REJECTED"
  | "TESTED"
  | "INTERVIEWED"
  | "SELECTED"
  | "JOINED";

type OfferStatus = "OFFERED" | "ACCEPTED" | "DECLINED" | "JOINED";

type Company = {
  id: number;
  name: string;
  industry?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  notes?: string | null;
};

type Criteria = {
  company_id: number;
  min_cgpa: number;
  max_arrears: number;
  require_fee_clearance: boolean;
  allowed_programs_json?: string | any; // stringified JSON array or array
  allowed_semesters_json?: string | any; // stringified JSON array or array
};

type Drive = {
  id: number;
  company_id: number;
  drive_title: string;
  drive_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  stage: DriveStage;
  location?: string | null;
  instructions?: string | null;
  job_roles?: string | null;
  salary_range?: string | null;
};

type Student = {
  id: number;
  full_name: string;
  reg_no: string;
  program: string;
  semester: number;
  cgpa: number;
  arrears: number;
  fee_clear: boolean;
};

type DriveApplication = {
  drive_id: number;
  student_user_id: number;
  status: ApplicationStatus;
  score?: number; // 0..100
  reason?: string;
  updated_at?: string; // ISO
  _student?: Student;
};

type InterviewSlot = {
  id: number;
  drive_id: number;
  slot_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  capacity: number;
  room_request_id?: number | null; // kept for compatibility (unused locally)
  room_allocation_id?: number | null; // kept for compatibility (unused locally)
};

type SlotAssignment = {
  slot_id: number;
  student_user_id: number;
  status: "ASSIGNED" | "COMPLETED" | "NO_SHOW" | "RESCHEDULED";
  _student?: Student;
};

type Offer = {
  drive_id: number;
  student_user_id: number;
  offer_status: OfferStatus;
  offer_letter_url?: string | null;
  _student?: Student;
};

type AgentRunSummary = {
  agent_name: string;
  started_at: string;
  finished_at: string | null;
  status: "RUNNING" | "DONE" | "FAILED";
  summary_json?: any;
  error_text?: string | null;
};

/** ---------- local store ---------- */
const STORE_KEY = "sc.placements.local.v3";
type StoreState = {
  version: 3;
  savedAt: string;
  companies: Company[];
  criteria: Criteria[];
  drives: Drive[];
  students: Student[];
  applications: DriveApplication[];
  slots: InterviewSlot[];
  assignments: SlotAssignment[];
  offers: Offer[];
  runsMap: Record<number, AgentRunSummary[]>;
  selectedDriveId: number | null;
  agentConfig: {
    slotMinutes: number;
    slotCapacity: number;
    shortlistMode: "TOP_PERCENT" | "SCORE_THRESHOLD";
    topPercent: number; // 10..90
    scoreThreshold: number; // 0..100
  };
};

function safeJsonParse<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function saveStore(next: StoreState) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("sc:placements:updated", { detail: { savedAt: next.savedAt } }));
  } catch {
    // ignore (quota / private mode)
  }
}

function readStore(): StoreState | null {
  const st = safeJsonParse<StoreState>(localStorage.getItem(STORE_KEY));
  if (!st || st.version !== 3) return null;
  return st;
}

/** ---------- utilities ---------- */
function localYYYYMMDD(d: Date = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function fmtDate(ymd?: string | null) {
  if (!ymd) return "—";
  try {
    const [y, m, d] = ymd.split("-").map((x) => parseInt(x, 10));
    const dt = new Date(y, (m || 1) - 1, d || 1);
    return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return ymd;
  }
}
function fmtTime(t?: string | null) {
  if (!t) return "—";
  const parts = t.split(":");
  return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : t;
}
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
function toMin(hhmmss: string) {
  const [hh, mm] = hhmmss.split(":").map((x) => parseInt(x, 10));
  return (hh || 0) * 60 + (mm || 0);
}
function fromMin(min: number) {
  const hh = String(Math.floor(min / 60)).padStart(2, "0");
  const mm = String(min % 60).padStart(2, "0");
  return `${hh}:${mm}:00`;
}
function asArrayMaybe(v: any): any[] {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    const p = safeJsonParse<any>(v);
    if (Array.isArray(p)) return p;
  }
  return [];
}
function hash01(seed: string) {
  // stable deterministic hash -> [0..1]
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}
function nextId(items: { id: number }[]) {
  return Math.max(0, ...items.map((x) => x.id)) + 1;
}

/** ---------- seeded data ---------- */
function seedState(): StoreState {
  const companies: Company[] = [
    {
      id: 1,
      name: "TechCorp",
      industry: "Technology",
      contact_email: "hr@techcorp.com",
      contact_phone: "1234567890",
      notes: "SDE / QA / Analyst hiring.",
    },
    {
      id: 2,
      name: "FinEdge",
      industry: "FinTech",
      contact_email: "talent@finedge.com",
      contact_phone: "5550001122",
      notes: "Backend + Data roles.",
    },
  ];

  const criteria: Criteria[] = [
    {
      company_id: 1,
      min_cgpa: 7.0,
      max_arrears: 2,
      require_fee_clearance: true,
      allowed_programs_json: JSON.stringify(["B.Tech CSE", "B.Tech IT"]),
      allowed_semesters_json: JSON.stringify([6, 7, 8]),
    },
    {
      company_id: 2,
      min_cgpa: 7.5,
      max_arrears: 1,
      require_fee_clearance: true,
      allowed_programs_json: JSON.stringify(["B.Tech CSE", "MBA"]),
      allowed_semesters_json: JSON.stringify([6, 7, 8, 3, 4]),
    },
  ];

  const drives: Drive[] = [
    {
      id: 1,
      company_id: 1,
      drive_title: "TechCorp Campus Drive",
      drive_date: localYYYYMMDD(),
      start_time: "10:00:00",
      end_time: "16:00:00",
      stage: "ANNOUNCED",
      location: "Main Block",
      job_roles: "SDE Intern, QA, Analyst",
      salary_range: "6–10 LPA",
      instructions: "Bring resume + ID card. Be on time.",
    },
    {
      id: 2,
      company_id: 2,
      drive_title: "FinEdge Hiring Sprint",
      drive_date: localYYYYMMDD(),
      start_time: "11:00:00",
      end_time: "15:00:00",
      stage: "ANNOUNCED",
      location: "Placement Cell",
      job_roles: "Backend, Data",
      salary_range: "8–12 LPA",
      instructions: "Laptop required for test round.",
    },
  ];

  const students: Student[] = [
    { id: 32, full_name: "Arun Kumar", reg_no: "192211661", program: "B.Tech CSE", semester: 6, cgpa: 8.5, arrears: 0, fee_clear: true },
    { id: 33, full_name: "Divya Sri", reg_no: "192211662", program: "B.Tech IT", semester: 6, cgpa: 7.2, arrears: 1, fee_clear: true },
    { id: 34, full_name: "Karthik V", reg_no: "192211663", program: "B.Tech ECE", semester: 6, cgpa: 7.9, arrears: 0, fee_clear: true },
    { id: 35, full_name: "Meera S", reg_no: "192211664", program: "B.Tech CSE", semester: 7, cgpa: 6.9, arrears: 0, fee_clear: true },
    { id: 36, full_name: "Naveen R", reg_no: "192211665", program: "B.Tech CSE", semester: 6, cgpa: 8.1, arrears: 3, fee_clear: true },
    { id: 37, full_name: "Pavithra G", reg_no: "192211666", program: "MBA", semester: 3, cgpa: 8.0, arrears: 0, fee_clear: false },
    { id: 38, full_name: "Sanjay M", reg_no: "192211667", program: "B.Tech IT", semester: 8, cgpa: 9.0, arrears: 0, fee_clear: true },
    { id: 39, full_name: "Yamini P", reg_no: "192211668", program: "B.Tech CSE", semester: 6, cgpa: 7.6, arrears: 1, fee_clear: true },
  ];

  return {
    version: 3,
    savedAt: new Date().toISOString(),
    companies,
    criteria,
    drives,
    students,
    applications: [],
    slots: [],
    assignments: [],
    offers: [],
    runsMap: {},
    selectedDriveId: drives[0]?.id ?? null,
    agentConfig: {
      slotMinutes: 30,
      slotCapacity: 2,
      shortlistMode: "TOP_PERCENT",
      topPercent: 45,
      scoreThreshold: 68,
    },
  };
}

/** ---------- UI helpers ---------- */
function Pill({ tone, children }: { tone: "slate" | "indigo" | "emerald" | "rose" | "amber"; children: React.ReactNode }) {
  const cls =
    tone === "emerald"
      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
      : tone === "rose"
      ? "bg-rose-50 border-rose-200 text-rose-800"
      : tone === "amber"
      ? "bg-amber-50 border-amber-200 text-amber-800"
      : tone === "indigo"
      ? "bg-indigo-50 border-indigo-200 text-indigo-800"
      : "bg-slate-50 border-slate-200 text-slate-700";
  return <span className={`px-2 py-1 rounded-lg text-xs border ${cls}`}>{children}</span>;
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone: "slate" | "indigo" | "emerald" | "rose" | "amber";
}) {
  const bg =
    tone === "emerald"
      ? "bg-emerald-50"
      : tone === "rose"
      ? "bg-rose-50"
      : tone === "amber"
      ? "bg-amber-50"
      : tone === "indigo"
      ? "bg-indigo-50"
      : "bg-slate-50";
  const border =
    tone === "emerald"
      ? "border-emerald-200"
      : tone === "rose"
      ? "border-rose-200"
      : tone === "amber"
      ? "border-amber-200"
      : tone === "indigo"
      ? "border-indigo-200"
      : "border-slate-200";

  return (
    <div className={`rounded-2xl border ${border} ${bg} p-4`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <div className="text-xs text-slate-600">{label}</div>
          <div className="text-lg font-semibold text-slate-900 leading-tight">{value}</div>
        </div>
      </div>
    </div>
  );
}

/** ---------- Agent scoring (rule gates + ML-like ranking) ---------- */
function scoreStudent(s: Student, crit: Criteria | null) {
  // Hard gates: these always INELIGIBLE if violated
  if (crit?.require_fee_clearance && !s.fee_clear) {
    return {
      score: 0,
      hardFail: true,
      reason: "Hard gate: fee clearance required and fee status is NOT CLEAR.",
      gates: ["fee_clearance"],
    };
  }
  if (typeof crit?.max_arrears === "number" && s.arrears > crit.max_arrears) {
    return {
      score: 0,
      hardFail: true,
      reason: `Hard gate: arrears ${s.arrears} exceeds allowed max ${crit.max_arrears}.`,
      gates: ["arrears"],
    };
  }

  const allowedPrograms = crit ? asArrayMaybe(crit.allowed_programs_json) : [];
  const allowedSem = crit ? asArrayMaybe(crit.allowed_semesters_json) : [];

  const programFit = allowedPrograms.length ? (allowedPrograms.includes(s.program) ? 1 : 0.72) : 1;
  const semFit = allowedSem.length ? (allowedSem.includes(s.semester) ? 1 : 0.82) : 1;

  const cgpaNorm = clamp((s.cgpa - 5.0) / 5.0, 0, 1); // 5..10 -> 0..1
  const arrearsNorm = clamp(1 - s.arrears / 6, 0, 1);
  const feeNorm = s.fee_clear ? 1 : 0; // not hard gate unless require_fee_clearance

  // weights (stable)
  const wCgpa = 0.58;
  const wArrears = 0.22;
  const wFee = 0.20;

  let base = 100 * (wCgpa * cgpaNorm + wArrears * arrearsNorm + wFee * feeNorm);
  base *= programFit * semFit;

  // deterministic micro-jitter for tie breaks
  const jitter = (hash01(`${s.id}:${s.reg_no}:${s.program}`) - 0.5) * 2.4; // [-2.4..+2.4]
  const score = clamp(base + jitter, 0, 100);

  // “agentic” explanation: concise but meaningful
  const signals: string[] = [];
  if (crit) {
    signals.push(`Policy: arrears≤${crit.max_arrears}, fee ${crit.require_fee_clearance ? "must be CLEAR" : "not mandatory"}`);
    signals.push(`Target CGPA≥${crit.min_cgpa.toFixed(1)}`);
  }
  signals.push(`Academics: CGPA ${s.cgpa.toFixed(2)} → strength ${(cgpaNorm * 100).toFixed(0)}%`);
  signals.push(`Consistency: arrears ${s.arrears} → ${(arrearsNorm * 100).toFixed(0)}%`);
  if (allowedPrograms.length) signals.push(`Program fit: ${allowedPrograms.includes(s.program) ? "match" : "partial"}`);
  if (allowedSem.length) signals.push(`Semester fit: ${allowedSem.includes(s.semester) ? "match" : "partial"}`);

  // note: below-min CGPA is not hard fail, it reduces ranking
  if (crit && s.cgpa < crit.min_cgpa) signals.push("Below target CGPA: deprioritized unless capacity allows.");

  return {
    score,
    hardFail: false,
    reason: `Model score ${Math.round(score)}/100. ${signals.join(" · ")}`,
    gates: [] as string[],
  };
}

/** ---------- Local agent pipeline (end-to-end) ---------- */
function computeShortlist(
  students: Student[],
  crit: Criteria,
  cfg: StoreState["agentConfig"],
  driveId: number
): { byStudentId: Map<number, { status: ApplicationStatus; score: number; reason: string }>; shortlistCount: number; ineligibleCount: number } {
  const scored = students.map((s) => {
    const r = scoreStudent(s, crit);
    return { student: s, ...r };
  });

  // hard fails always ineligible
  const hardFailIds = new Set(scored.filter((x) => x.hardFail).map((x) => x.student.id));

  // candidates for shortlist ranking (not hard fail)
  const candidates = scored
    .filter((x) => !x.hardFail)
    .map((x) => ({
      id: x.student.id,
      score: x.score,
      reason: x.reason,
      cgpa: x.student.cgpa,
    }))
    .sort((a, b) => (b.score !== a.score ? b.score - a.score : b.cgpa - a.cgpa));

  let shortlistSet = new Set<number>();

  if (cfg.shortlistMode === "SCORE_THRESHOLD") {
    const thr = clamp(cfg.scoreThreshold, 0, 100);
    shortlistSet = new Set(candidates.filter((c) => c.score >= thr).map((c) => c.id));
  } else {
    const pct = clamp(cfg.topPercent, 10, 90);
    const k = Math.max(1, Math.round((pct / 100) * candidates.length));
    shortlistSet = new Set(candidates.slice(0, k).map((c) => c.id));
  }

  // Always ensure anyone who meets CGPA target gets a boost (if not hard-fail)
  // This is "agentic policy" not random: keeps outcomes sensible.
  const minCgpa = crit.min_cgpa ?? 0;
  for (const c of candidates) {
    if (c.cgpa >= minCgpa && !hardFailIds.has(c.id)) {
      // keep shortlist if close to cutoff
      if (cfg.shortlistMode === "TOP_PERCENT") {
        // if just outside cutoff but score is close, include.
        // (deterministic: include if within 2 points of last shortlisted score)
        const list = candidates;
        const pct = clamp(cfg.topPercent, 10, 90);
        const k = Math.max(1, Math.round((pct / 100) * list.length));
        const last = list[Math.min(k - 1, list.length - 1)];
        if (last && c.score >= last.score - 2.0) shortlistSet.add(c.id);
      }
    }
  }

  const byStudentId = new Map<number, { status: ApplicationStatus; score: number; reason: string }>();

  // Build reasons with rank context (looks “smart” and consistent)
  const rankIndex = new Map<number, number>();
  candidates.forEach((c, i) => rankIndex.set(c.id, i + 1));

  for (const x of scored) {
    const sid = x.student.id;

    if (x.hardFail) {
      byStudentId.set(sid, {
        status: "INELIGIBLE",
        score: 0,
        reason: x.reason,
      });
      continue;
    }

    const score = x.score;
    const rank = rankIndex.get(sid) ?? 9999;

    if (shortlistSet.has(sid)) {
      byStudentId.set(sid, {
        status: "SHORTLISTED",
        score,
        reason: `Shortlisted (rank #${rank} of ${candidates.length}). ${x.reason}`,
      });
    } else {
      byStudentId.set(sid, {
        status: "INELIGIBLE",
        score,
        reason: `Not shortlisted (rank #${rank} of ${candidates.length}). ${x.reason}`,
      });
    }
  }

  const shortlistCount = Array.from(byStudentId.values()).filter((v) => v.status === "SHORTLISTED").length;
  const ineligibleCount = Array.from(byStudentId.values()).filter((v) => v.status === "INELIGIBLE").length;
  return { byStudentId, shortlistCount, ineligibleCount };
}

function buildSlotsForDrive(
  drive: Drive,
  existingSlots: InterviewSlot[],
  cfg: StoreState["agentConfig"]
): InterviewSlot[] {
  const has = existingSlots.some((s) => s.drive_id === drive.id);
  if (has) return existingSlots;

  const slotMins = clamp(cfg.slotMinutes, 10, 120);
  const cap = Math.max(1, Math.floor(cfg.slotCapacity || 2));
  const start = toMin(drive.start_time);
  const end = toMin(drive.end_time);

  const result: InterviewSlot[] = [];
  let cursor = start;
  while (cursor + slotMins <= end) {
    result.push({
      id: -1, // fill later
      drive_id: drive.id,
      slot_date: drive.drive_date,
      start_time: fromMin(cursor),
      end_time: fromMin(cursor + slotMins),
      capacity: cap,
      room_request_id: null,
      room_allocation_id: null,
    });
    cursor += slotMins;
    if (result.length > 200) break; // safety
  }

  const baseId = Math.max(0, ...existingSlots.map((s) => s.id)) + 1;
  return [
    ...result.map((s, idx) => ({ ...s, id: baseId + idx })),
    ...existingSlots,
  ];
}

function autoAssignShortlisted(
  driveId: number,
  apps: DriveApplication[],
  slots: InterviewSlot[],
  existingAssignments: SlotAssignment[]
): { assignments: SlotAssignment[]; added: number } {
  const driveSlots = slots.filter((s) => s.drive_id === driveId).slice().sort((a, b) => (a.start_time > b.start_time ? 1 : -1));
  const shortlistedIds = apps.filter((a) => a.drive_id === driveId && a.status === "SHORTLISTED").map((a) => a.student_user_id);

  if (!driveSlots.length || !shortlistedIds.length) return { assignments: existingAssignments, added: 0 };

  const capLeft = new Map<number, number>(driveSlots.map((s) => [s.id, s.capacity]));
  const existing = new Set(existingAssignments.map((a) => `${a.slot_id}:${a.student_user_id}`));

  const toAdd: SlotAssignment[] = [];

  for (const sid of shortlistedIds) {
    let placed = false;
    for (const slot of driveSlots) {
      const left = capLeft.get(slot.id) ?? 0;
      if (left <= 0) continue;
      if (existing.has(`${slot.id}:${sid}`)) continue;

      toAdd.push({ slot_id: slot.id, student_user_id: sid, status: "ASSIGNED" });
      capLeft.set(slot.id, left - 1);
      placed = true;
      break;
    }
    if (!placed) break;
  }

  if (!toAdd.length) return { assignments: existingAssignments, added: 0 };
  return { assignments: [...toAdd, ...existingAssignments], added: toAdd.length };
}

/** ---------- main component ---------- */
export const AdminPlacements: React.FC = () => {
  const [tab, setTab] = useState<"companies" | "drives" | "applications" | "slots" | "offers" | "runs">("companies");

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const toastTimer = useRef<number | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [drives, setDrives] = useState<Drive[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [applications, setApplications] = useState<DriveApplication[]>([]);
  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  const [assignments, setAssignments] = useState<SlotAssignment[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [runsMap, setRunsMap] = useState<Record<number, AgentRunSummary[]>>({});

  const [selectedDriveId, setSelectedDriveId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const [agentRunning, setAgentRunning] = useState(false);
  const [agentConfig, setAgentConfig] = useState<StoreState["agentConfig"]>({
    slotMinutes: 30,
    slotCapacity: 2,
    shortlistMode: "TOP_PERCENT",
    topPercent: 45,
    scoreThreshold: 68,
  });

  /** Modals */
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [addDriveOpen, setAddDriveOpen] = useState(false);
  const [editCriteriaOpen, setEditCriteriaOpen] = useState(false);
  const [agentSettingsOpen, setAgentSettingsOpen] = useState(false);

  const [newCompany, setNewCompany] = useState({
    name: "",
    industry: "",
    contact_email: "",
    contact_phone: "",
    notes: "",
  });

  const [newDrive, setNewDrive] = useState({
    company_id: "",
    drive_title: "",
    drive_date: localYYYYMMDD(),
    start_time: "10:00",
    end_time: "16:00",
    location: "",
    instructions: "",
    job_roles: "",
    salary_range: "",
  });

  const [criteriaDraft, setCriteriaDraft] = useState({
    min_cgpa: "7.0",
    max_arrears: "2",
    require_fee_clearance: true,
    allowed_programs: "B.Tech CSE, B.Tech IT",
    allowed_semesters: "6, 7, 8",
  });

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2500);
  };

  const persistRef = useRef(false);

  const persist = (patch?: Partial<StoreState>) => {
    const next: StoreState = {
      version: 3,
      savedAt: new Date().toISOString(),
      companies,
      criteria,
      drives,
      students,
      applications,
      slots,
      assignments,
      offers,
      runsMap,
      selectedDriveId,
      agentConfig,
      ...(patch || {}),
    };
    saveStore(next);
  };

  /** boot */
  useEffect(() => {
    const cached = readStore();
    if (cached) {
      setCompanies(cached.companies || []);
      setCriteria(cached.criteria || []);
      setDrives(cached.drives || []);
      setStudents(cached.students || []);
      setApplications(cached.applications || []);
      setSlots(cached.slots || []);
      setAssignments(cached.assignments || []);
      setOffers(cached.offers || []);
      setRunsMap(cached.runsMap || {});
      setSelectedDriveId(cached.selectedDriveId ?? (cached.drives?.[0]?.id ?? null));
      setAgentConfig(cached.agentConfig || seedState().agentConfig);
      setLoading(false);
      persistRef.current = true;
      showToast("ok", "Loaded placements workspace");
      return;
    }

    const seeded = seedState();
    setCompanies(seeded.companies);
    setCriteria(seeded.criteria);
    setDrives(seeded.drives);
    setStudents(seeded.students);
    setApplications(seeded.applications);
    setSlots(seeded.slots);
    setAssignments(seeded.assignments);
    setOffers(seeded.offers);
    setRunsMap(seeded.runsMap);
    setSelectedDriveId(seeded.selectedDriveId);
    setAgentConfig(seeded.agentConfig);
    setLoading(false);
    saveStore(seeded);
    persistRef.current = true;
    showToast("ok", "Loaded dataset");
  }, []);

  /** persist on changes */
  useEffect(() => {
    if (!persistRef.current || loading) return;
    persist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies, criteria, drives, students, applications, slots, assignments, offers, runsMap, selectedDriveId, agentConfig, loading]);

  /** derived maps */
  const companyById = useMemo(() => {
    const m = new Map<number, Company>();
    companies.forEach((c) => m.set(c.id, c));
    return m;
  }, [companies]);

  const studentById = useMemo(() => {
    const m = new Map<number, Student>();
    students.forEach((s) => m.set(s.id, s));
    return m;
  }, [students]);

  const driveById = useMemo(() => {
    const m = new Map<number, Drive>();
    drives.forEach((d) => m.set(d.id, d));
    return m;
  }, [drives]);

  const currentDrive = useMemo(() => (selectedDriveId ? driveById.get(selectedDriveId) || null : null), [selectedDriveId, driveById]);
  const currentCompany = useMemo(() => (currentDrive ? companyById.get(currentDrive.company_id) || null : null), [currentDrive, companyById]);
  const currentCriteria = useMemo(() => {
    if (!currentDrive) return null;
    return criteria.find((c) => c.company_id === currentDrive.company_id) || null;
  }, [currentDrive, criteria]);

  const driveRuns = useMemo(() => (selectedDriveId ? runsMap[selectedDriveId] || [] : []), [runsMap, selectedDriveId]);

  const joinedApplications = useMemo(() => applications.map((a) => ({ ...a, _student: studentById.get(a.student_user_id) })), [applications, studentById]);

  const driveApplications = useMemo(() => {
    const list = joinedApplications.filter((a) => a.drive_id === selectedDriveId);
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((a) => {
      const st = a._student;
      return (
        String(a.student_user_id).includes(q) ||
        (st?.full_name || "").toLowerCase().includes(q) ||
        (st?.reg_no || "").toLowerCase().includes(q) ||
        (st?.program || "").toLowerCase().includes(q)
      );
    });
  }, [joinedApplications, selectedDriveId, search]);

  const driveSlots = useMemo(() => slots.filter((s) => s.drive_id === selectedDriveId), [slots, selectedDriveId]);

  const driveAssignments = useMemo(() => {
    const slotIds = new Set(driveSlots.map((s) => s.id));
    return assignments
      .filter((a) => slotIds.has(a.slot_id))
      .map((a) => ({ ...a, _student: studentById.get(a.student_user_id) }));
  }, [assignments, driveSlots, studentById]);

  const driveOffers = useMemo(() => {
    const list = offers.filter((o) => o.drive_id === selectedDriveId);
    return list.map((o) => ({ ...o, _student: studentById.get(o.student_user_id) }));
  }, [offers, selectedDriveId, studentById]);

  const kpis = useMemo(() => {
    const total = driveApplications.length;
    const shortlisted = driveApplications.filter((a) => a.status === "SHORTLISTED").length;
    const ineligible = driveApplications.filter((a) => a.status === "INELIGIBLE").length;
    const selected = driveApplications.filter((a) => a.status === "SELECTED").length;
    const assigned = driveAssignments.filter((a) => a.status === "ASSIGNED").length;
    const offersMade = driveOffers.length;
    return { total, shortlisted, ineligible, selected, assigned, offersMade };
  }, [driveApplications, driveAssignments, driveOffers]);

  /** ---------- actions ---------- */
  const resetWorkspace = () => {
    const seeded = seedState();
    setCompanies(seeded.companies);
    setCriteria(seeded.criteria);
    setDrives(seeded.drives);
    setStudents(seeded.students);
    setApplications(seeded.applications);
    setSlots(seeded.slots);
    setAssignments(seeded.assignments);
    setOffers(seeded.offers);
    setRunsMap(seeded.runsMap);
    setSelectedDriveId(seeded.selectedDriveId);
    setAgentConfig(seeded.agentConfig);
    saveStore(seeded);
    showToast("ok", "Reset to dataset");
    setTab("companies");
  };

  const openAddCompany = () => {
    setNewCompany({ name: "", industry: "", contact_email: "", contact_phone: "", notes: "" });
    setAddCompanyOpen(true);
  };

  const createCompany = () => {
    const name = newCompany.name.trim();
    if (!name) return showToast("err", "Company name is required");

    const id = nextId(companies);
    const c: Company = {
      id,
      name,
      industry: newCompany.industry.trim() || null,
      contact_email: newCompany.contact_email.trim() || null,
      contact_phone: newCompany.contact_phone.trim() || null,
      notes: newCompany.notes.trim() || null,
    };
    setCompanies((p) => [c, ...p]);

    // ensure default criteria exists
    const exists = criteria.some((x) => x.company_id === id);
    if (!exists) {
      const cr: Criteria = {
        company_id: id,
        min_cgpa: 7.0,
        max_arrears: 2,
        require_fee_clearance: true,
        allowed_programs_json: JSON.stringify([]),
        allowed_semesters_json: JSON.stringify([]),
      };
      setCriteria((p) => [cr, ...p]);
    }

    setAddCompanyOpen(false);
    showToast("ok", "Company created");
    setTab("companies");
  };

  const openAddDrive = () => {
    const fallbackCompanyId = String(currentCompany?.id || companies[0]?.id || "");
    setNewDrive({
      company_id: fallbackCompanyId,
      drive_title: currentCompany ? `${currentCompany.name} Campus Drive` : "Campus Drive",
      drive_date: localYYYYMMDD(),
      start_time: "10:00",
      end_time: "16:00",
      location: "",
      instructions: "",
      job_roles: "",
      salary_range: "",
    });
    setAddDriveOpen(true);
  };

  const createDrive = () => {
    const companyId = Number(newDrive.company_id);
    if (!companyId || !companies.some((c) => c.id === companyId)) return showToast("err", "Select a valid company");
    const title = newDrive.drive_title.trim();
    if (!title) return showToast("err", "Drive title is required");

    const id = nextId(drives);
    const d: Drive = {
      id,
      company_id: companyId,
      drive_title: title,
      drive_date: newDrive.drive_date.trim() || localYYYYMMDD(),
      start_time: `${(newDrive.start_time.trim() || "10:00").slice(0, 5)}:00`,
      end_time: `${(newDrive.end_time.trim() || "16:00").slice(0, 5)}:00`,
      stage: "ANNOUNCED",
      location: newDrive.location.trim() || null,
      instructions: newDrive.instructions.trim() || null,
      job_roles: newDrive.job_roles.trim() || null,
      salary_range: newDrive.salary_range.trim() || null,
    };

    setDrives((p) => [d, ...p]);

    // ensure criteria exists for the company
    const exists = criteria.some((c) => c.company_id === companyId);
    if (!exists) {
      const cr: Criteria = {
        company_id: companyId,
        min_cgpa: 7.0,
        max_arrears: 2,
        require_fee_clearance: true,
        allowed_programs_json: JSON.stringify([]),
        allowed_semesters_json: JSON.stringify([]),
      };
      setCriteria((p) => [cr, ...p]);
    }

    setSelectedDriveId(d.id);
    setAddDriveOpen(false);
    showToast("ok", "Drive created");
    setTab("drives");
  };

  const openEditCriteria = () => {
    if (!currentCriteria) return showToast("err", "No criteria for this company");
    setCriteriaDraft({
      min_cgpa: String(currentCriteria.min_cgpa ?? 7.0),
      max_arrears: String(currentCriteria.max_arrears ?? 2),
      require_fee_clearance: !!currentCriteria.require_fee_clearance,
      allowed_programs: asArrayMaybe(currentCriteria.allowed_programs_json).join(", "),
      allowed_semesters: asArrayMaybe(currentCriteria.allowed_semesters_json).join(", "),
    });
    setEditCriteriaOpen(true);
  };

  const saveCriteria = () => {
    if (!currentDrive || !currentCriteria) return;

    const min = Number(criteriaDraft.min_cgpa);
    const maxA = Number(criteriaDraft.max_arrears);
    if (!Number.isFinite(min) || min <= 0) return showToast("err", "Min CGPA must be a number");
    if (!Number.isFinite(maxA) || maxA < 0) return showToast("err", "Max arrears must be a number");

    const programs = criteriaDraft.allowed_programs
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const semesters = criteriaDraft.allowed_semesters
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n));

    const next: Criteria = {
      ...currentCriteria,
      min_cgpa: min,
      max_arrears: maxA,
      require_fee_clearance: !!criteriaDraft.require_fee_clearance,
      allowed_programs_json: JSON.stringify(programs),
      allowed_semesters_json: JSON.stringify(semesters),
    };

    setCriteria((prev) => prev.map((c) => (c.company_id === next.company_id ? next : c)));
    setEditCriteriaOpen(false);
    showToast("ok", "Criteria saved");
  };

  const setDriveStage = (driveId: number, stage: DriveStage) => {
    setDrives((prev) => prev.map((d) => (d.id === driveId ? { ...d, stage } : d)));
    showToast("ok", `Drive stage set to ${stage}`);
  };

  const updateApplicationStatus = (driveId: number, studentId: number, status: ApplicationStatus) => {
    setApplications((prev) => {
      const key = `${driveId}:${studentId}`;
      const map = new Map<string, DriveApplication>();
      prev.forEach((a) => map.set(`${a.drive_id}:${a.student_user_id}`, a));

      const cur = map.get(key) || { drive_id: driveId, student_user_id: studentId, status: "APPLIED" as ApplicationStatus };
      map.set(key, { ...cur, status, updated_at: new Date().toISOString() });
      return Array.from(map.values());
    });
  };

  const toggleStudentFee = (studentId: number) => {
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, fee_clear: !s.fee_clear } : s)));
  };

  const runAgent = async () => {
    if (!selectedDriveId || !currentDrive) return showToast("err", "Select a drive first");
    if (!currentCriteria) return showToast("err", "No criteria set for this company");
    if (agentRunning) return showToast("err", "Agent is already running");

    setAgentRunning(true);

    const startedAt = new Date().toISOString();
    const runningRun: AgentRunSummary = {
      agent_name: "Placement Agent",
      started_at: startedAt,
      finished_at: null,
      status: "RUNNING",
      summary_json: { phase: "starting" },
    };
    setRunsMap((p) => ({ ...p, [selectedDriveId]: [runningRun, ...(p[selectedDriveId] || [])] }));

    // small UI delay so user sees "agentic" phases (still instant, production-safe)
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    try {
      showToast("ok", "Agent started — scoring, shortlisting, scheduling, assigning…");

      // Phase A: ensure applications exist for all students
      setDriveStage(currentDrive.id, "APPLICATIONS");

      const nowIso = new Date().toISOString();
      const existing = new Set(applications.filter((a) => a.drive_id === selectedDriveId).map((a) => a.student_user_id));
      const newApplied: DriveApplication[] = students
        .filter((s) => !existing.has(s.id))
        .map((s) => ({
          drive_id: selectedDriveId,
          student_user_id: s.id,
          status: "APPLIED",
          score: undefined,
          reason: "Auto-applied by agent to ensure a complete evaluation set.",
          updated_at: nowIso,
        }));

      let mergedApps: DriveApplication[] = [...applications, ...newApplied];

      // Phase B: shortlist decision (rule gates + ML-like ranking)
      await sleep(120);
      setDriveStage(currentDrive.id, "SHORTLISTED");

      const { byStudentId, shortlistCount, ineligibleCount } = computeShortlist(students, currentCriteria, agentConfig, selectedDriveId);

      // Don’t overwrite final human decisions
      const finalStatuses = new Set<ApplicationStatus>(["REJECTED", "SELECTED", "JOINED"]);

      mergedApps = (() => {
        const map = new Map<string, DriveApplication>();
        mergedApps.forEach((a) => map.set(`${a.drive_id}:${a.student_user_id}`, a));

        for (const s of students) {
          const key = `${selectedDriveId}:${s.id}`;
          const prev = map.get(key) || { drive_id: selectedDriveId, student_user_id: s.id, status: "APPLIED" as ApplicationStatus };
          const decision = byStudentId.get(s.id);

          // keep manual/final status unchanged, but still attach score+reason as explanation
          if (finalStatuses.has(prev.status)) {
            map.set(key, {
              ...prev,
              score: decision ? decision.score : prev.score,
              reason: decision ? decision.reason : prev.reason,
              updated_at: new Date().toISOString(),
            });
            continue;
          }

          if (decision) {
            map.set(key, {
              ...prev,
              status: decision.status,
              score: decision.score,
              reason: decision.reason,
              updated_at: new Date().toISOString(),
            });
          }
        }

        return Array.from(map.values());
      })();

      // Phase C: create interview slots if not present
      await sleep(120);
      setDriveStage(currentDrive.id, "INTERVIEWS");
      const nextSlots = buildSlotsForDrive(currentDrive, slots, agentConfig);
      setSlots(nextSlots);

      // Phase D: auto-assign shortlisted into slots
      await sleep(120);
      const { assignments: nextAssignments, added } = autoAssignShortlisted(
        selectedDriveId,
        mergedApps,
        nextSlots,
        assignments
      );

      // Apply state updates atomically-ish (React batches)
      setApplications(mergedApps);
      setAssignments(nextAssignments);

      // Phase E: finalize run summary
      const shortlisted = mergedApps.filter((a) => a.drive_id === selectedDriveId && a.status === "SHORTLISTED").length;
      const applied = mergedApps.filter((a) => a.drive_id === selectedDriveId).length;
      const driveSlotsNow = nextSlots.filter((s) => s.drive_id === selectedDriveId).length;
      const assigned = nextAssignments.filter((a) => {
        const slot = nextSlots.find((s) => s.id === a.slot_id);
        return slot?.drive_id === selectedDriveId && a.status === "ASSIGNED";
      }).length;

      const explanation = {
        decision_logic: {
          gates: {
            fee_clearance: currentCriteria.require_fee_clearance,
            max_arrears: currentCriteria.max_arrears,
          },
          ranking: {
            mode: agentConfig.shortlistMode,
            topPercent: agentConfig.topPercent,
            scoreThreshold: agentConfig.scoreThreshold,
            tieBreak: "deterministic micro-jitter (stable)",
          },
          notes: [
            "Hard gates never shortlist (fee clearance required, arrears exceed max).",
            "Non-hard-fail candidates are ranked with an academic score (CGPA-weighted) + consistency signal.",
            "Manual/final statuses (REJECTED/SELECTED/JOINED) are respected and not overwritten by the agent.",
          ],
        },
        outcomes: {
          applied,
          shortlisted,
          ineligible: ineligibleCount,
          slotsCreated: driveSlotsNow,
          assignmentsAdded: added,
          assignedTotal: assigned,
        },
        next_actions: [
          "If you want offers: set status to SELECTED for chosen students, then click 'Create Offers'.",
          "If shortlist looks strict/lenient: tune Agent Settings (top % / score threshold).",
          "If a student becomes fee clear later: toggle Fee CLEAR and run agent again (status updates automatically unless manually finalized).",
        ],
      };

      const finishedAt = new Date().toISOString();
      setRunsMap((p) => {
        const prev = p[selectedDriveId] || [];
        // replace first RUNNING run started_at==startedAt
        const next = prev.map((r) =>
          r.started_at === startedAt
            ? { ...r, status: "DONE", finished_at: finishedAt, summary_json: explanation }
            : r
        );
        return { ...p, [selectedDriveId]: next };
      });

      showToast("ok", "Agent completed: shortlist + slots + assignments updated");
      setTab("applications");
    } catch (e: any) {
      const finishedAt = new Date().toISOString();
      setRunsMap((p) => {
        const prev = p[selectedDriveId] || [];
        const next = prev.map((r) =>
          r.started_at === startedAt
            ? { ...r, status: "FAILED", finished_at: finishedAt, error_text: String(e?.message || e) }
            : r
        );
        return { ...p, [selectedDriveId]: next };
      });
      showToast("err", `Agent failed: ${String(e?.message || e)}`);
    } finally {
      setAgentRunning(false);
    }
  };

  const createOffersForSelected = () => {
    if (!selectedDriveId) return showToast("err", "Select a drive first");
    const selectedIds = applications
      .filter((a) => a.drive_id === selectedDriveId && a.status === "SELECTED")
      .map((a) => a.student_user_id);

    if (!selectedIds.length) return showToast("err", "No SELECTED applications");

    const existing = new Set(offers.filter((o) => o.drive_id === selectedDriveId).map((o) => o.student_user_id));
    const toAdd: Offer[] = selectedIds
      .filter((id) => !existing.has(id))
      .map((id) => ({
        drive_id: selectedDriveId,
        student_user_id: id,
        offer_status: "OFFERED",
        offer_letter_url: null,
      }));

    if (!toAdd.length) return showToast("ok", "Offers already exist");

    setOffers((p) => [...toAdd, ...p]);
    showToast("ok", `Offers created: ${toAdd.length}`);
    setTab("offers");
  };

  const autoCreateOneSlot = () => {
    if (!selectedDriveId || !currentDrive) return showToast("err", "Select a drive first");
    const id = nextId(slots);
    const s: InterviewSlot = {
      id,
      drive_id: selectedDriveId,
      slot_date: currentDrive.drive_date,
      start_time: currentDrive.start_time,
      end_time: currentDrive.end_time,
      capacity: Math.max(1, agentConfig.slotCapacity),
      room_request_id: null,
      room_allocation_id: null,
    };
    setSlots((p) => [s, ...p]);
    showToast("ok", "1 slot created (manual)");
    setTab("slots");
  };

  const autoAssign = () => {
    if (!selectedDriveId) return showToast("err", "Select a drive first");
    const { assignments: next, added } = autoAssignShortlisted(selectedDriveId, applications, slots, assignments);
    setAssignments(next);
    showToast("ok", added ? `Assigned ${added} students` : "Nothing to assign");
    setTab("slots");
  };

  /** ---------- UI ---------- */
  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
          <div className="text-slate-700 font-semibold">Loading Placements Admin…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="min-w-[260px]">
              <div className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                <BriefcaseBusinessIcon className="w-5 h-5" />
                Placements Admin
              </div>

            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setAgentSettingsOpen(true)}
                className="px-3 py-2 rounded-xl bg-slate-100 text-slate-800 text-sm hover:bg-slate-200 border border-slate-200 flex items-center gap-2"
              >
                <SlidersHorizontalIcon className="w-4 h-4" />
                Agent Settings
              </button>

              <button
                onClick={openAddCompany}
                className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800 flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Company
              </button>

              <button
                onClick={openAddDrive}
                className="px-3 py-2 rounded-xl bg-white text-slate-800 text-sm hover:bg-slate-50 border border-slate-200 flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Drive
              </button>

              <button
                onClick={runAgent}
                className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm hover:bg-indigo-500 flex items-center gap-2 disabled:opacity-60"
                disabled={!selectedDriveId || agentRunning}
              >
                {agentRunning ? <RefreshCwIcon className="w-4 h-4 animate-spin" /> : <PlayIcon className="w-4 h-4" />}
                {agentRunning ? "Agent Running…" : "Run Agent"}
              </button>

              <button
                onClick={resetWorkspace}
                className="px-3 py-2 rounded-xl bg-rose-50 text-rose-800 text-sm hover:bg-rose-100 border border-rose-200"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Drive picker */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="text-sm text-slate-600">Drive:</label>
            <select
              value={selectedDriveId ?? ""}
              onChange={(e) => setSelectedDriveId(e.target.value ? Number(e.target.value) : null)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
            >
              {drives.map((d) => (
                <option key={d.id} value={d.id}>
                  #{d.id} · {companyById.get(d.company_id)?.name || `Company#${d.company_id}`} · {d.drive_title} · {fmtDate(d.drive_date)} · {d.stage}
                </option>
              ))}
            </select>

            <div className="flex-1 min-w-[240px]" />

            <div className="relative min-w-[320px]">
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search applications (name / reg / program)…"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
              />
            </div>
          </div>

          {/* Criteria + drive bar */}
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-slate-500">Company</div>
                <Pill tone="slate">
                  <Building2Icon className="w-3 h-3 inline -mt-[2px] mr-1" />
                  {currentCompany?.industry || "—"}
                </Pill>
              </div>
              <div className="text-sm font-semibold text-slate-900 mt-1">{currentCompany?.name || "—"}</div>
              <div className="text-xs text-slate-600 mt-2">
                {currentCompany?.contact_email || "—"}
                {currentCompany?.contact_phone ? ` · ${currentCompany.contact_phone}` : ""}
              </div>
              <div className="text-xs text-slate-500 mt-2 line-clamp-2">{currentCompany?.notes || ""}</div>
            </div>

            <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-slate-500">Drive</div>
                <Pill tone="indigo">
                  <CalendarDaysIcon className="w-3 h-3 inline -mt-[2px] mr-1" />
                  {fmtDate(currentDrive?.drive_date)}
                </Pill>
              </div>
              <div className="text-sm font-semibold text-slate-900 mt-1">{currentDrive?.drive_title || "—"}</div>
              <div className="text-xs text-slate-600 mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <ClockIcon className="w-3.5 h-3.5" />
                  {fmtTime(currentDrive?.start_time)}–{fmtTime(currentDrive?.end_time)}
                </span>
                <span className="text-slate-400">·</span>
                <span>{currentDrive?.location || "—"}</span>
              </div>
              <div className="text-xs text-slate-500 mt-2 line-clamp-2">{currentDrive?.instructions || ""}</div>

              <div className="mt-3 flex items-center gap-2">
                <label className="text-xs text-slate-600">Stage:</label>
                <select
                  value={currentDrive?.stage || "ANNOUNCED"}
                  onChange={(e) => currentDrive && setDriveStage(currentDrive.id, e.target.value as DriveStage)}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs"
                >
                  {["ANNOUNCED", "APPLICATIONS", "SHORTLISTED", "TEST", "INTERVIEWS", "RESULTS", "CLOSED"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-slate-500">Criteria</div>
                <button
                  onClick={openEditCriteria}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs hover:bg-slate-50"
                >
                  Edit
                </button>
              </div>

              <div className="text-sm font-semibold text-slate-900 mt-1">
                Min CGPA: {currentCriteria?.min_cgpa ?? "—"} · Max arrears: {currentCriteria?.max_arrears ?? "—"}
              </div>
              <div className="text-xs text-slate-600 mt-2">
                Fee clearance: {currentCriteria?.require_fee_clearance ? "Required" : "Not required"}
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Programs: {asArrayMaybe(currentCriteria?.allowed_programs_json).length ? asArrayMaybe(currentCriteria?.allowed_programs_json).join(", ") : "All"}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Semesters: {asArrayMaybe(currentCriteria?.allowed_semesters_json).length ? asArrayMaybe(currentCriteria?.allowed_semesters_json).join(", ") : "All"}
              </div>
            </div>
          </div>

          {/* KPI cards */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <StatCard
              tone="slate"
              icon={<UsersIcon className="w-5 h-5 text-slate-700" />}
              label="Applications"
              value={kpis.total}
            />
            <StatCard
              tone="emerald"
              icon={<BadgeCheckIcon className="w-5 h-5 text-emerald-700" />}
              label="Shortlisted"
              value={kpis.shortlisted}
            />
            <StatCard
              tone="rose"
              icon={<BadgeXIcon className="w-5 h-5 text-rose-700" />}
              label="Ineligible"
              value={kpis.ineligible}
            />
            <StatCard
              tone="indigo"
              icon={<GraduationCapIcon className="w-5 h-5 text-indigo-700" />}
              label="Selected"
              value={kpis.selected}
            />
            <StatCard
              tone="amber"
              icon={<HandshakeIcon className="w-5 h-5 text-amber-700" />}
              label="Assigned"
              value={kpis.assigned}
            />
            <StatCard
              tone="slate"
              icon={<FileTextIcon className="w-5 h-5 text-slate-700" />}
              label="Offers"
              value={kpis.offersMade}
            />
          </div>

          {/* Tabs */}
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              ["companies", "Companies"],
              ["drives", "Drives"],
              ["applications", "Applications"],
              ["slots", "Interview Slots"],
              ["offers", "Offers"],
              ["runs", "Agent Runs"],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k as any)}
                className={`px-3 py-2 rounded-xl text-sm border ${
                  tab === k
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick actions bar */}
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center gap-2 justify-between">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-indigo-600" />
            Agent updates statuses based on criteria + ranking; reasons are stored per student.
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={createOffersForSelected}
              className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm hover:bg-indigo-500"
              disabled={!selectedDriveId}
            >
              Create Offers for SELECTED
            </button>
            <button
              onClick={autoCreateOneSlot}
              className="px-3 py-2 rounded-xl bg-white text-slate-800 text-sm hover:bg-slate-50 border border-slate-200"
              disabled={!selectedDriveId}
            >
              + 1 Slot (Manual)
            </button>
            <button
              onClick={autoAssign}
              className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm hover:bg-emerald-500"
              disabled={!selectedDriveId}
            >
              Auto-Assign Shortlisted
            </button>
          </div>
        </div>
      </div>

      {/* Companies */}
      {tab === "companies" && (
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 font-semibold text-slate-900">Companies</div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Industry</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{c.id}</td>
                    <td className="px-4 py-3 text-slate-700">{c.name}</td>
                    <td className="px-4 py-3 text-slate-700">{c.industry || "—"}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {(c.contact_email || "—") + (c.contact_phone ? ` · ${c.contact_phone}` : "")}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.notes || "—"}</td>
                  </tr>
                ))}
                {!companies.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                      No companies.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drives */}
      {tab === "drives" && (
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 font-semibold text-slate-900">Placement Drives</div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Company</th>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Stage</th>
                </tr>
              </thead>
              <tbody>
                {drives.map((d) => (
                  <tr key={d.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{d.id}</td>
                    <td className="px-4 py-3 text-slate-700">{companyById.get(d.company_id)?.name || `Company#${d.company_id}`}</td>
                    <td className="px-4 py-3 text-slate-700">{d.drive_title}</td>
                    <td className="px-4 py-3 text-slate-700">{fmtDate(d.drive_date)}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {fmtTime(d.start_time)}–{fmtTime(d.end_time)}
                    </td>
                    <td className="px-4 py-3">
                      <Pill tone="slate">{d.stage}</Pill>
                    </td>
                  </tr>
                ))}
                {!drives.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                      No drives.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Applications */}
      {tab === "applications" && (
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="font-semibold text-slate-900">Applications</div>
            <div className="flex gap-2">
              <button
                onClick={runAgent}
                className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm hover:bg-indigo-500 flex items-center gap-2 disabled:opacity-60"
                disabled={!selectedDriveId || agentRunning}
              >
                <SparklesIcon className="w-4 h-4" />
                Process Applications
              </button>
              <button
                onClick={createOffersForSelected}
                className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800"
                disabled={!selectedDriveId}
              >
                Create Offers
              </button>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Reg No</th>
                  <th className="px-4 py-3 text-left">Program</th>
                  <th className="px-4 py-3 text-left">CGPA</th>
                  <th className="px-4 py-3 text-left">Arrears</th>
                  <th className="px-4 py-3 text-left">Fee</th>
                  <th className="px-4 py-3 text-left">Score</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                </tr>
              </thead>
              <tbody>
                {driveApplications.map((a) => {
                  const st = a._student;
                  const statusTone =
                    a.status === "SHORTLISTED"
                      ? "emerald"
                      : a.status === "INELIGIBLE"
                      ? "rose"
                      : a.status === "SELECTED"
                      ? "indigo"
                      : a.status === "REJECTED"
                      ? "rose"
                      : "slate";

                  return (
                    <tr key={`${a.drive_id}-${a.student_user_id}`} className="border-t border-slate-100 align-top">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{st?.full_name || a.student_user_id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{st?.reg_no || "—"}</td>
                      <td className="px-4 py-3 text-slate-700">{st?.program || "—"}</td>
                      <td className="px-4 py-3 text-slate-700">{st?.cgpa?.toFixed?.(2) ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-700">{st?.arrears ?? "—"}</td>
                      <td className="px-4 py-3">
                        {st ? (
                          <button
                            onClick={() => toggleStudentFee(st.id)}
                            className={`px-2 py-1 rounded-lg text-xs border ${
                              st.fee_clear ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
                            }`}
                            title="Toggle fee clearance"
                          >
                            {st.fee_clear ? "CLEAR" : "NOT CLEAR"}
                          </button>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{typeof a.score === "number" ? Math.round(a.score) : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Pill tone={statusTone as any}>{a.status}</Pill>
                          <select
                            value={a.status}
                            onChange={(e) => updateApplicationStatus(a.drive_id, a.student_user_id, e.target.value as ApplicationStatus)}
                            className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs"
                            title="Manual override (agent will not overwrite REJECTED/SELECTED/JOINED)"
                          >
                            {[
                              "APPLIED",
                              "INELIGIBLE",
                              "SHORTLISTED",
                              "REJECTED",
                              "TESTED",
                              "INTERVIEWED",
                              "SELECTED",
                              "JOINED",
                            ].map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="max-w-[520px] whitespace-normal">
                          {a.reason || <span className="text-slate-400">Run agent to generate reasoning.</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!driveApplications.length && (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-slate-500">
                      No applications for this drive. Click “Run Agent” to auto-apply students and evaluate them.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-600 flex items-center gap-2">
            <AlertTriangleIcon className="w-4 h-4 text-amber-600" />
            Manual overrides are respected: REJECTED / SELECTED / JOINED won’t be auto-changed by the agent.
          </div>
        </div>
      )}

      {/* Slots */}
      {tab === "slots" && (
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="font-semibold text-slate-900">Interview Slots</div>
            <div className="flex gap-2">
              <button
                onClick={() => setAgentSettingsOpen(true)}
                className="px-3 py-2 rounded-xl bg-white text-slate-800 text-sm hover:bg-slate-50 border border-slate-200"
              >
                Slot Settings
              </button>
              <button
                onClick={autoCreateOneSlot}
                className="px-3 py-2 rounded-xl bg-slate-100 text-slate-800 text-sm hover:bg-slate-200 border border-slate-200"
                disabled={!selectedDriveId}
              >
                + Slot
              </button>
              <button
                onClick={autoAssign}
                className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm hover:bg-emerald-500"
                disabled={!selectedDriveId}
              >
                Auto-Assign Shortlisted
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-5">
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-900 text-sm">
                Slots ({driveSlots.length})
              </div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white text-slate-600">
                    <tr className="border-b border-slate-100">
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Time</th>
                      <th className="px-4 py-3 text-left">Capacity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {driveSlots.map((s) => (
                      <tr key={s.id} className="border-b border-slate-100">
                        <td className="px-4 py-3 text-slate-700">{fmtDate(s.slot_date)}</td>
                        <td className="px-4 py-3 text-slate-700">
                          #{s.id} · {fmtTime(s.start_time)}–{fmtTime(s.end_time)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{s.capacity}</td>
                      </tr>
                    ))}
                    {!driveSlots.length && (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                          No slots. Run agent to auto-create a full schedule window.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-900 text-sm">
                Assignments ({driveAssignments.length})
              </div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white text-slate-600">
                    <tr className="border-b border-slate-100">
                      <th className="px-4 py-3 text-left">Slot</th>
                      <th className="px-4 py-3 text-left">Student</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {driveAssignments.map((a) => {
                      const slot = driveSlots.find((s) => s.id === a.slot_id);
                      return (
                        <tr key={`${a.slot_id}-${a.student_user_id}`} className="border-b border-slate-100">
                          <td className="px-4 py-3 text-slate-700">
                            #{a.slot_id} · {fmtTime(slot?.start_time || "")}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900">{a._student?.full_name || a.student_user_id}</td>
                          <td className="px-4 py-3 text-slate-700">{a.status}</td>
                        </tr>
                      );
                    })}
                    {!driveAssignments.length && (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                          No assignments yet. Run agent or click Auto-Assign.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Offers */}
      {tab === "offers" && (
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-2">
            <div className="font-semibold text-slate-900">Offers</div>
            <button
              onClick={createOffersForSelected}
              className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm hover:bg-indigo-500"
              disabled={!selectedDriveId}
            >
              Create Offers for SELECTED
            </button>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Reg No</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Offer Letter</th>
                </tr>
              </thead>
              <tbody>
                {driveOffers.map((o) => (
                  <tr key={`${o.drive_id}-${o.student_user_id}`} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{o._student?.full_name || o.student_user_id}</td>
                    <td className="px-4 py-3 text-slate-700">{o._student?.reg_no || "—"}</td>
                    <td className="px-4 py-3">
                      <Pill tone="indigo">{o.offer_status}</Pill>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{o.offer_letter_url ? "Open" : "—"}</td>
                  </tr>
                ))}
                {!driveOffers.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                      No offers yet. Mark applications as SELECTED and click “Create Offers”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Runs */}
      {tab === "runs" && (
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 font-semibold text-slate-900">Agent Runs</div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left">Agent</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Started</th>
                  <th className="px-4 py-3 text-left">Finished</th>
                  <th className="px-4 py-3 text-left">Summary</th>
                </tr>
              </thead>
              <tbody>
                {driveRuns.map((r, idx) => (
                  <tr key={`${r.started_at}-${idx}`} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-3 font-medium text-slate-900">{r.agent_name}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {r.status === "DONE" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <CheckCircle2Icon className="w-4 h-4" /> DONE
                        </span>
                      ) : r.status === "FAILED" ? (
                        <span className="inline-flex items-center gap-1 text-rose-700">
                          <AlertTriangleIcon className="w-4 h-4" /> FAILED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          <RefreshCwIcon className="w-4 h-4 animate-spin" /> RUNNING
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{new Date(r.started_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-700">{r.finished_at ? new Date(r.finished_at).toLocaleString() : "—"}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {r.error_text ? (
                        <span className="text-rose-700">{r.error_text}</span>
                      ) : (
                        <pre className="text-xs text-slate-600 whitespace-pre-wrap break-words bg-slate-50 border border-slate-200 rounded-xl p-3">
                          {JSON.stringify(r.summary_json || {}, null, 2)}
                        </pre>
                      )}
                    </td>
                  </tr>
                ))}
                {!driveRuns.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                      No agent runs recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-2xl shadow-lg border text-sm ${
            toast.type === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Add Company */}
      <Modal
        open={addCompanyOpen}
        title="Add Company"
        onClose={() => setAddCompanyOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm hover:bg-slate-50" onClick={() => setAddCompanyOpen(false)}>
              Cancel
            </button>
            <button className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800" onClick={createCompany}>
              Create Company
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <div className="text-xs text-slate-600 mb-1">Name</div>
            <input
              value={newCompany.name}
              onChange={(e) => setNewCompany((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
              placeholder="Company name"
            />
          </label>
          <label className="block">
            <div className="text-xs text-slate-600 mb-1">Industry</div>
            <input
              value={newCompany.industry}
              onChange={(e) => setNewCompany((p) => ({ ...p, industry: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
              placeholder="e.g., Technology"
            />
          </label>
          <label className="block">
            <div className="text-xs text-slate-600 mb-1">Contact email</div>
            <input
              value={newCompany.contact_email}
              onChange={(e) => setNewCompany((p) => ({ ...p, contact_email: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
              placeholder="hr@company.com"
            />
          </label>
          <label className="block">
            <div className="text-xs text-slate-600 mb-1">Contact phone</div>
            <input
              value={newCompany.contact_phone}
              onChange={(e) => setNewCompany((p) => ({ ...p, contact_phone: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
              placeholder="phone"
            />
          </label>
          <label className="block md:col-span-2">
            <div className="text-xs text-slate-600 mb-1">Notes</div>
            <textarea
              value={newCompany.notes}
              onChange={(e) => setNewCompany((p) => ({ ...p, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm resize-none"
              placeholder="optional notes"
            />
          </label>
        </div>
      </Modal>

      {/* Add Drive */}
      <Modal
        open={addDriveOpen}
        title="Add Drive"
        onClose={() => setAddDriveOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm hover:bg-slate-50" onClick={() => setAddDriveOpen(false)}>
              Cancel
            </button>
            <button className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800" onClick={createDrive}>
              Create Drive
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block md:col-span-2">
            <div className="text-xs text-slate-600 mb-1">Company</div>
            <select
              value={newDrive.company_id}
              onChange={(e) => setNewDrive((p) => ({ ...p, company_id: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
            >
              <option value="">Select…</option>
              {companies.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  #{c.id} · {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block md:col-span-2">
            <div className="text-xs text-slate-600 mb-1">Drive title</div>
            <input
              value={newDrive.drive_title}
              onChange={(e) => setNewDrive((p) => ({ ...p, drive_title: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
              placeholder="Drive title"
            />
          </label>

          <label className="block">
            <div className="text-xs text-slate-600 mb-1">Drive date</div>
            <input
              type="date"
              value={newDrive.drive_date}
              onChange={(e) => setNewDrive((p) => ({ ...p, drive_date: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
            />
          </label>

          <label className="block">
            <div className="text-xs text-slate-600 mb-1">Time</div>
            <div className="flex gap-2">
              <input
                type="time"
                value={newDrive.start_time}
                onChange={(e) => setNewDrive((p) => ({ ...p, start_time: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
              />
              <input
                type="time"
                value={newDrive.end_time}
                onChange={(e) => setNewDrive((p) => ({ ...p, end_time: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
              />
            </div>
          </label>

          <label className="block md:col-span-2">
            <div className="text-xs text-slate-600 mb-1">Location</div>
            <input
              value={newDrive.location}
              onChange={(e) => setNewDrive((p) => ({ ...p, location: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
              placeholder="e.g., Main Block"
            />
          </label>

          <label className="block md:col-span-2">
            <div className="text-xs text-slate-600 mb-1">Job roles</div>
            <input
              value={newDrive.job_roles}
              onChange={(e) => setNewDrive((p) => ({ ...p, job_roles: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
              placeholder="e.g., SDE, QA, Analyst"
            />
          </label>

          <label className="block">
            <div className="text-xs text-slate-600 mb-1">Salary range</div>
            <input
              value={newDrive.salary_range}
              onChange={(e) => setNewDrive((p) => ({ ...p, salary_range: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
              placeholder="e.g., 8–12 LPA"
            />
          </label>

          <label className="block md:col-span-2">
            <div className="text-xs text-slate-600 mb-1">Instructions</div>
            <textarea
              value={newDrive.instructions}
              onChange={(e) => setNewDrive((p) => ({ ...p, instructions: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm resize-none"
              placeholder="optional"
            />
          </label>
        </div>
      </Modal>

      {/* Edit Criteria */}
      <Modal
        open={editCriteriaOpen}
        title="Edit Criteria"
        onClose={() => setEditCriteriaOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm hover:bg-slate-50" onClick={() => setEditCriteriaOpen(false)}>
              Cancel
            </button>
            <button className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800" onClick={saveCriteria}>
              Save
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <div className="text-xs text-slate-600 mb-1">Min CGPA</div>
            <input
              value={criteriaDraft.min_cgpa}
              onChange={(e) => setCriteriaDraft((p) => ({ ...p, min_cgpa: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
              placeholder="e.g., 7.0"
            />
          </label>
          <label className="block">
            <div className="text-xs text-slate-600 mb-1">Max arrears</div>
            <input
              value={criteriaDraft.max_arrears}
              onChange={(e) => setCriteriaDraft((p) => ({ ...p, max_arrears: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
              placeholder="e.g., 2"
            />
          </label>

          <label className="block md:col-span-2">
            <div className="text-xs text-slate-600 mb-1">Require fee clearance</div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={criteriaDraft.require_fee_clearance}
                onChange={(e) => setCriteriaDraft((p) => ({ ...p, require_fee_clearance: e.target.checked }))}
              />
              <span className="text-sm text-slate-700">Fee must be CLEAR to be eligible</span>
            </div>
          </label>

          <label className="block md:col-span-2">
            <div className="text-xs text-slate-600 mb-1">Allowed programs (comma-separated)</div>
            <input
              value={criteriaDraft.allowed_programs}
              onChange={(e) => setCriteriaDraft((p) => ({ ...p, allowed_programs: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
              placeholder="B.Tech CSE, B.Tech IT"
            />
          </label>

          <label className="block md:col-span-2">
            <div className="text-xs text-slate-600 mb-1">Allowed semesters (comma-separated)</div>
            <input
              value={criteriaDraft.allowed_semesters}
              onChange={(e) => setCriteriaDraft((p) => ({ ...p, allowed_semesters: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
              placeholder="6, 7, 8"
            />
          </label>

          <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
            <div className="font-semibold text-slate-900 mb-1">How the agent uses this</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fee clearance + max arrears are hard gates (instant INELIGIBLE if violated).</li>
              <li>CGPA target influences ranking (not a hard fail by default).</li>
              <li>Programs/Semesters influence fit (match vs partial), impacting scores deterministically.</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* Agent Settings */}
      <Modal
        open={agentSettingsOpen}
        title="Agent Settings"
        onClose={() => setAgentSettingsOpen(false)}
        footer={
          <div className="flex justify-between gap-2">
            <div className="text-xs text-slate-600 flex items-center gap-2">
              <ClipboardListIcon className="w-4 h-4" />
              Saved automatically.
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm hover:bg-slate-50" onClick={() => setAgentSettingsOpen(false)}>
                Close
              </button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="text-sm font-semibold text-slate-900">Shortlisting</div>
            <div className="text-xs text-slate-600 mt-1">Controls how many students become SHORTLISTED.</div>

            <div className="mt-3">
              <div className="text-xs text-slate-600 mb-1">Mode</div>
              <select
                value={agentConfig.shortlistMode}
                onChange={(e) => setAgentConfig((p) => ({ ...p, shortlistMode: e.target.value as any }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
              >
                <option value="TOP_PERCENT">Top % (rank-based)</option>
                <option value="SCORE_THRESHOLD">Score threshold</option>
              </select>
            </div>

            {agentConfig.shortlistMode === "TOP_PERCENT" ? (
              <div className="mt-3">
                <div className="text-xs text-slate-600 mb-1">Top %</div>
                <input
                  type="number"
                  value={agentConfig.topPercent}
                  onChange={(e) => setAgentConfig((p) => ({ ...p, topPercent: clamp(Number(e.target.value || 0), 10, 90) }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                  min={10}
                  max={90}
                />
                <div className="text-xs text-slate-500 mt-1">Recommended: 35–55</div>
              </div>
            ) : (
              <div className="mt-3">
                <div className="text-xs text-slate-600 mb-1">Score threshold</div>
                <input
                  type="number"
                  value={agentConfig.scoreThreshold}
                  onChange={(e) => setAgentConfig((p) => ({ ...p, scoreThreshold: clamp(Number(e.target.value || 0), 0, 100) }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                  min={0}
                  max={100}
                />
                <div className="text-xs text-slate-500 mt-1">Recommended: 65–75</div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="text-sm font-semibold text-slate-900">Interview Slots</div>
            <div className="text-xs text-slate-600 mt-1">Controls slot generation + assignment capacity.</div>

            <div className="mt-3">
              <div className="text-xs text-slate-600 mb-1">Slot length (minutes)</div>
              <input
                type="number"
                value={agentConfig.slotMinutes}
                onChange={(e) => setAgentConfig((p) => ({ ...p, slotMinutes: clamp(Number(e.target.value || 30), 10, 120) }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                min={10}
                max={120}
              />
            </div>

            <div className="mt-3">
              <div className="text-xs text-slate-600 mb-1">Capacity per slot</div>
              <input
                type="number"
                value={agentConfig.slotCapacity}
                onChange={(e) => setAgentConfig((p) => ({ ...p, slotCapacity: Math.max(1, Math.floor(Number(e.target.value || 2))) }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                min={1}
                max={10}
              />
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
              <div className="font-semibold text-slate-900 mb-1">What happens when you run the agent</div>
              <ul className="list-disc pl-5 space-y-1">
                <li>Creates missing applications for all students (APPLIED).</li>
                <li>Scores + shortlists deterministically (same input → same output).</li>
                <li>Auto-creates slot schedule inside drive window if no slots exist.</li>
                <li>Packs shortlisted students into slots (ASSIGNED) respecting capacity.</li>
              </ul>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
