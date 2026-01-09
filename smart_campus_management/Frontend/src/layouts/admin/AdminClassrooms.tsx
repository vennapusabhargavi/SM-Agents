import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "../../components/Toast";
import {
  PlusIcon,
  SearchIcon,
  Building2Icon,
  DoorOpenIcon,
  UsersIcon,
  Edit3Icon,
  Trash2Icon,
  XIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  FilterIcon,
  RefreshCwIcon,
  SparklesIcon,
  ClockIcon,
  SendIcon,
  InfoIcon,
} from "lucide-react";

type RoomType = "LECTURE" | "LAB" | "SEMINAR" | "AUDITORIUM";
type RoomStatus = "ACTIVE" | "MAINTENANCE" | "INACTIVE";

type Classroom = {
  id: string;
  code: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  type: RoomType;
  status: RoomStatus;
  hasProjector: boolean;
  hasAC: boolean;
  notes?: string;
  updatedAt: string; // ISO
};

type RequesterType = "FACULTY" | "EXAM" | "PLACEMENT" | "ADMIN" | "SYSTEM";
type RoomRequestStatus = "PENDING" | "ALLOCATED" | "REJECTED" | "CANCELLED" | "FAILED";

type RoomRequest = {
  id: string;
  requesterType: RequesterType;
  requesterId?: string | null;

  purpose: string;
  startAt: string; // ISO
  endAt: string; // ISO

  capacityRequired: number;
  roomType: RoomType | "ANY";
  needsProjector: boolean;
  needsAC: boolean;
  preferredBuilding?: string;

  status: RoomRequestStatus;

  // Allocation outputs (agent writes these)
  allocationId?: string | null;
  classroomId?: string | null;

  // Agent intelligence outputs
  decisionReason?: string; // "why" chosen / why failed
  conflictId?: string | null; // links to conflict details

  createdAt?: string;
  updatedAt?: string;
};

type AllocationStatus = "ACTIVE" | "REPLACED" | "CANCELLED";
type AllocationBy = "AGENT" | "MANUAL";

type RoomAllocation = {
  id: string;
  requestId: string;
  classroomId: string;
  startAt: string;
  endAt: string;
  allocatedBy: AllocationBy;
  status: AllocationStatus;
  createdAt: string;
  replacedAt?: string | null;
};

type AllocationHistoryAction = "CREATED" | "CANCELLED" | "REASSIGNED" | "OVERRIDDEN";
type AllocationHistory = {
  id: string;
  allocationId: string;
  action: AllocationHistoryAction;
  actor: "AGENT" | "ADMIN_UI";
  notes: string;
  at: string;
};

type AllocationConflict = {
  id: string;
  requestId: string;
  conflictReason: string;
  suggestionsJson: any; // { base: [...], ai: {...} }
  detectedAt: string;
  resolvedAt?: string | null;
  resolutionNotes?: string | null;
};

type AgentRunSummary = {
  id: string;
  agent_name: "CLASSROOM_ALLOCATION_AGENT";
  started_at: string;
  finished_at: string;
  status: "DONE" | "FAILED";
  summary_json: any;
  error_text?: string | null;
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const LS_ROOMS = "sc_admin_classrooms_rooms_v2";
const LS_REQUESTS = "sc_admin_classrooms_requests_v2";
const LS_ALLOCATIONS = "sc_admin_classrooms_allocations_v2";
const LS_HISTORY = "sc_admin_classrooms_allocation_history_v2";
const LS_CONFLICTS = "sc_admin_classrooms_conflicts_v2";
const LS_AGENT_RUNS = "sc_admin_classrooms_agent_runs_v2";
const LS_AGENT_LAST_RUN = "sc_admin_classrooms_agent_last_run_v2";

function isoNow() {
  return new Date().toISOString();
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function safeParse<T>(s: string | null, fallback: T): T {
  try {
    if (!s) return fallback;
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

function fmtDt(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function toIsoLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function fromLocalInputToIso(v: string) {
  const d = new Date(v);
  return d.toISOString();
}

function overlaps(aStartIso: string, aEndIso: string, bStartIso: string, bEndIso: string) {
  const aS = new Date(aStartIso).getTime();
  const aE = new Date(aEndIso).getTime();
  const bS = new Date(bStartIso).getTime();
  const bE = new Date(bEndIso).getTime();
  return aS < bE && aE > bS;
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizeBuilding(b?: string) {
  return String(b ?? "").trim().toLowerCase();
}

/** ----------- Premium UI Bits ----------- */
function Panel({
  title,
  tone = "indigo",
  icon,
  right,
  children,
}: {
  title: string;
  tone?: "teal" | "indigo" | "rose";
  icon?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const header =
    tone === "teal"
      ? "bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600"
      : tone === "indigo"
      ? "bg-gradient-to-r from-indigo-700 via-indigo-600 to-sky-600"
      : "bg-gradient-to-r from-rose-600 via-red-500 to-orange-500";

  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col min-h-0">
      <div className={cn(header, "px-4 py-3 flex items-center justify-between")}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-2.5 w-2.5 rounded-full bg-white/90" />
          {icon}
          <div className="text-white font-semibold text-sm tracking-wide uppercase truncate">
            {title}
          </div>
        </div>
        <div className="flex items-center gap-2">{right}</div>
      </div>
      <div className="p-4 flex-1 min-h-0">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  icon,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition ring-1",
        "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
        "dark:bg-slate-950 dark:text-slate-200 dark:ring-slate-800 dark:hover:bg-slate-900",
        active && "ring-2 ring-teal-400/70 dark:ring-teal-300/60"
      )}
    >
      {icon}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{children}</div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-xl px-3 text-sm",
        "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
        "ring-1 ring-slate-200 dark:ring-slate-800",
        "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 dark:focus:ring-indigo-300/60",
        "transition",
        props.className
      )}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-[88px] w-full rounded-xl px-3 py-2 text-sm resize-none",
        "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
        "ring-1 ring-slate-200 dark:ring-slate-800",
        "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 dark:focus:ring-indigo-300/60",
        "transition",
        props.className
      )}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-10 w-full rounded-xl px-3 text-sm",
        "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
        "ring-1 ring-slate-200 dark:ring-slate-800",
        "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 dark:focus:ring-indigo-300/60",
        "transition",
        props.className
      )}
    />
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "w-full rounded-xl border px-3 py-2 text-sm transition text-left",
        "border-slate-200 bg-white hover:bg-slate-50 text-slate-800",
        "dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-100"
      )}
    >
      <span className="inline-flex items-center justify-between w-full">
        <span>{label}</span>
        <span
          className={cn(
            "h-5 w-9 rounded-full border transition relative",
            checked
              ? "bg-indigo-600 border-indigo-600"
              : "bg-slate-200 border-slate-300 dark:bg-slate-800 dark:border-slate-700"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white transition",
              checked ? "left-[18px]" : "left-0.5"
            )}
          />
        </span>
      </span>
    </button>
  );
}

function PrimaryBtn({
  children,
  onClick,
  disabled,
  leftIcon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition active:scale-[0.99]",
        "bg-teal-600 text-white hover:bg-teal-700",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {leftIcon}
      {children}
    </button>
  );
}

function GhostBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition",
        "border border-slate-200 bg-white hover:bg-slate-50 text-slate-800",
        "dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-100",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

function Modal({
  open,
  title,
  subtitle,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute inset-3 sm:inset-6 grid place-items-center">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-base font-semibold text-slate-900 dark:text-slate-50 truncate">
                {title}
              </div>
              {subtitle && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 grid place-items-center hover:bg-slate-50 dark:hover:bg-slate-900 transition"
              aria-label="Close"
            >
              <XIcon size={16} />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** ----------- LOCAL “Agentic” Decision Engine ----------- */
function isRoomEligible(room: Classroom, req: RoomRequest) {
  if (room.status !== "ACTIVE") return { ok: false, why: "Room is not ACTIVE" };
  if (room.capacity < req.capacityRequired) return { ok: false, why: "Insufficient capacity" };
  if (req.roomType !== "ANY" && room.type !== req.roomType) return { ok: false, why: "Room type mismatch" };
  if (req.needsProjector && !room.hasProjector) return { ok: false, why: "Projector required" };
  if (req.needsAC && !room.hasAC) return { ok: false, why: "AC required" };
  return { ok: true, why: "Eligible" };
}

function computeRoomScore(room: Classroom, req: RoomRequest) {
  // Higher is better.
  // “ML-like”: score is a weighted sum of preference alignment + efficiency.
  const prefBuilding = normalizeBuilding(req.preferredBuilding);
  const roomBuilding = normalizeBuilding(room.building);

  const buildingBonus = prefBuilding && roomBuilding === prefBuilding ? 30 : prefBuilding ? -6 : 0;

  // Efficiency: prefer tighter fit (lower wasted seats)
  const waste = Math.max(0, room.capacity - req.capacityRequired); // 0.. big
  const efficiency = 25 - clampInt(Math.floor(waste / 10), 0, 25); // tighter => higher

  // Comfort extras (soft preferences)
  const comfort = (req.needsAC ? 6 : room.hasAC ? 2 : 0) + (req.needsProjector ? 6 : room.hasProjector ? 2 : 0);

  // Floor preference heuristic (lower floors slightly better for crowd flow)
  const floor = 6 - clampInt(room.floor, 0, 6);

  return buildingBonus + efficiency + comfort + floor;
}

function generateConflictSuggestions(req: RoomRequest, rooms: Classroom[], allocations: RoomAllocation[]) {
  // “Agentic” suggestions: alternative times + buildings + split suggestion.
  const base: any[] = [];

  // Alt time windows: +1h, +2h same duration
  const a = new Date(req.startAt).getTime();
  const b = new Date(req.endAt).getTime();
  const dur = b - a;

  for (const hrs of [1, 2, 3]) {
    const ns = new Date(a + hrs * 60 * 60 * 1000).toISOString();
    const ne = new Date(a + hrs * 60 * 60 * 1000 + dur).toISOString();
    base.push({
      type: "TIME_SHIFT",
      label: `Try +${hrs} hour(s)`,
      startAt: ns,
      endAt: ne,
      reason: "No suitable room at requested slot.",
    });
  }

  // Suggest buildings with most eligible rooms (ignoring time conflicts)
  const eligibleByBuilding: Record<string, number> = {};
  for (const r of rooms) {
    const el = isRoomEligible(r, req);
    if (!el.ok) continue;
    eligibleByBuilding[r.building] = (eligibleByBuilding[r.building] || 0) + 1;
  }
  const topBuildings = Object.entries(eligibleByBuilding)
    .sort((x, y) => y[1] - x[1])
    .slice(0, 3)
    .map(([b]) => b);

  for (const bld of topBuildings) {
    base.push({
      type: "ALT_BUILDING",
      label: `Try building "${bld}"`,
      preferredBuilding: bld,
      reason: "More eligible rooms exist in that building.",
    });
  }

  if (req.capacityRequired >= 200) {
    base.push({
      type: "SPLIT",
      label: "Split into multiple rooms",
      suggestion: "Create 2–3 requests with smaller strengths (e.g., 80–120 each).",
      reason: "Single-room capacity constraint likely causes failure.",
    });
  }

  // Simulated “AI” reasoning block (no backend, but premium helpful)
  const ai = {
    conflict_summary: `Allocation failed because no ACTIVE room matched capacity/equipment/type AND was free at the requested time.`,
    recommended_actions: [
      "Adjust time window by 1–2 hours (most successful)",
      "Relax equipment requirement if possible",
      "Try another building with more eligible rooms",
      "Split large class into multiple rooms if capacity is the blocker",
    ],
    confidence: 0.78,
  };

  // Add “what caused it” signals:
  const signals = {
    demand_capacity: req.capacityRequired,
    demand_type: req.roomType,
    demand_projector: req.needsProjector,
    demand_ac: req.needsAC,
    preferred_building: req.preferredBuilding || null,
    active_rooms: rooms.filter((r) => r.status === "ACTIVE").length,
    total_rooms: rooms.length,
    existing_allocations_in_window: allocations.filter((al) =>
      overlaps(al.startAt, al.endAt, req.startAt, req.endAt)
    ).length,
  };

  return { base, ai: { ...ai, signals } };
}

function computeFailureReason(req: RoomRequest, rooms: Classroom[], allocations: RoomAllocation[]) {
  const activeRooms = rooms.filter((r) => r.status === "ACTIVE");
  if (activeRooms.length === 0) return "No ACTIVE rooms available in the system.";

  // Count blockers among ACTIVE rooms (even before time conflicts)
  let capBlock = 0, typeBlock = 0, projBlock = 0, acBlock = 0, okBase = 0;
  for (const r of activeRooms) {
    if (r.capacity < req.capacityRequired) capBlock++;
    if (req.roomType !== "ANY" && r.type !== req.roomType) typeBlock++;
    if (req.needsProjector && !r.hasProjector) projBlock++;
    if (req.needsAC && !r.hasAC) acBlock++;
    if (isRoomEligible(r, req).ok) okBase++;
  }

  if (okBase === 0) {
    // The “best reason” among blockers:
    const pairs = [
      ["Capacity too high for available rooms", capBlock],
      ["Room type constraint too strict", typeBlock],
      ["Projector requirement blocks most rooms", projBlock],
      ["AC requirement blocks most rooms", acBlock],
    ] as const;
    pairs.sort((a, b) => b[1] - a[1]);
    return `${pairs[0][0]}. (ACTIVE rooms analyzed: ${activeRooms.length})`;
  }

  // If base eligibility exists, then it’s likely a time conflict
  const freeEligible = activeRooms.filter((r) => {
    if (!isRoomEligible(r, req).ok) return false;
    const conflicts = allocations.some(
      (al) => al.status === "ACTIVE" && al.classroomId === r.id && overlaps(al.startAt, al.endAt, req.startAt, req.endAt)
    );
    return !conflicts;
  });

  if (freeEligible.length === 0) {
    return "All eligible rooms are occupied during the requested time window (time conflict).";
  }

  return "Allocation failed due to combined constraints (time + preferences).";
}

/** Allocate best room (returns chosen room or null + reason) */
function pickBestRoom(req: RoomRequest, rooms: Classroom[], allocations: RoomAllocation[]) {
  const candidates: Array<{ room: Classroom; score: number; explain: string }> = [];

  for (const r of rooms) {
    const elig = isRoomEligible(r, req);
    if (!elig.ok) continue;

    // time conflict check (ACTIVE allocations)
    const conflict = allocations.some(
      (al) =>
        al.status === "ACTIVE" &&
        al.classroomId === r.id &&
        overlaps(al.startAt, al.endAt, req.startAt, req.endAt)
    );
    if (conflict) continue;

    const score = computeRoomScore(r, req);

    const explain = [
      `score=${score}`,
      req.preferredBuilding ? (normalizeBuilding(r.building) === normalizeBuilding(req.preferredBuilding) ? "preferred_building✔" : "preferred_building✘") : "no_building_pref",
      `waste=${Math.max(0, r.capacity - req.capacityRequired)}`,
      `floor=${r.floor}`,
      r.hasProjector ? "proj✔" : "proj✘",
      r.hasAC ? "ac✔" : "ac✘",
    ].join(" | ");

    candidates.push({ room: r, score, explain });
  }

  candidates.sort((a, b) => b.score - a.score);

  if (!candidates.length) {
    return { room: null as any, reason: computeFailureReason(req, rooms, allocations), debug: [] as any[] };
  }

  const top = candidates[0];
  return {
    room: top.room,
    reason: `Allocated to best-fit room based on weighted score. (${top.explain})`,
    debug: candidates.slice(0, 5).map((c) => ({ id: c.room.id, code: c.room.code, building: c.room.building, score: c.score, explain: c.explain })),
  };
}

export const AdminClassrooms: React.FC = () => {
  const { showToast } = useToast();

  /** ----------- Seed Data (kept) ----------- */
  const seedRooms: Classroom[] = useMemo(
    () => [
      {
        id: "room_1",
        code: "A-101",
        name: "Smart Classroom 101",
        building: "A",
        floor: 1,
        capacity: 60,
        type: "LECTURE",
        status: "ACTIVE",
        hasProjector: true,
        hasAC: true,
        notes: "Near seminar hall",
        updatedAt: isoNow(),
      },
      {
        id: "room_2",
        code: "A-201",
        name: "Lecture 201",
        building: "A",
        floor: 2,
        capacity: 80,
        type: "LECTURE",
        status: "ACTIVE",
        hasProjector: true,
        hasAC: false,
        notes: "",
        updatedAt: isoNow(),
      },
      {
        id: "room_3",
        code: "B-LAB-3",
        name: "Programming Lab 3",
        building: "B",
        floor: 2,
        capacity: 40,
        type: "LAB",
        status: "ACTIVE",
        hasProjector: false,
        hasAC: true,
        notes: "",
        updatedAt: isoNow(),
      },
      {
        id: "room_4",
        code: "B-103",
        name: "Lecture 103",
        building: "B",
        floor: 1,
        capacity: 55,
        type: "LECTURE",
        status: "ACTIVE",
        hasProjector: true,
        hasAC: true,
        notes: "Preferred for mid-size classes",
        updatedAt: isoNow(),
      },
      {
        id: "room_5",
        code: "AUD-1",
        name: "Auditorium 1",
        building: "ADMIN",
        floor: 0,
        capacity: 450,
        type: "AUDITORIUM",
        status: "MAINTENANCE",
        hasProjector: true,
        hasAC: true,
        notes: "Sound system upgrade in progress",
        updatedAt: isoNow(),
      },
    ],
    []
  );

  const seedRequests: RoomRequest[] = useMemo(() => {
    const start = new Date(Date.now() + 1000 * 60 * 60 * 24);
    start.setHours(10, 0, 0, 0);
    const end = new Date(start.getTime() + 1000 * 60 * 60);

    return [
      {
        id: "rr_1",
        requesterType: "EXAM",
        requesterId: null,
        purpose: "End Semester Exam – CSE301",
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        capacityRequired: 55,
        roomType: "LECTURE",
        needsProjector: false,
        needsAC: true,
        preferredBuilding: "A",
        status: "PENDING",
        allocationId: null,
        classroomId: null,
        decisionReason: "",
        conflictId: null,
        createdAt: isoNow(),
        updatedAt: isoNow(),
      },
    ];
  }, []);

  /** ----------- State (LocalStorage only) ----------- */
  const [tab, setTab] = useState<"ROOMS" | "REQUESTS">("ROOMS");

  const [rooms, setRooms] = useState<Classroom[]>(() => {
    const stored = safeParse<Classroom[]>(localStorage.getItem(LS_ROOMS), []);
    return stored.length ? stored : seedRooms;
  });

  const [requests, setRequests] = useState<RoomRequest[]>(() => {
    const stored = safeParse<RoomRequest[]>(localStorage.getItem(LS_REQUESTS), []);
    return stored.length ? stored : seedRequests;
  });

  const [allocations, setAllocations] = useState<RoomAllocation[]>(() =>
    safeParse<RoomAllocation[]>(localStorage.getItem(LS_ALLOCATIONS), [])
  );

  const [history, setHistory] = useState<AllocationHistory[]>(() =>
    safeParse<AllocationHistory[]>(localStorage.getItem(LS_HISTORY), [])
  );

  const [conflicts, setConflicts] = useState<AllocationConflict[]>(() =>
    safeParse<AllocationConflict[]>(localStorage.getItem(LS_CONFLICTS), [])
  );

  const [agentRuns, setAgentRuns] = useState<AgentRunSummary[]>(() =>
    safeParse<AgentRunSummary[]>(localStorage.getItem(LS_AGENT_RUNS), [])
  );

  const [agentLastRun, setAgentLastRun] = useState<string>(() => localStorage.getItem(LS_AGENT_LAST_RUN) || "");

  useEffect(() => localStorage.setItem(LS_ROOMS, JSON.stringify(rooms)), [rooms]);
  useEffect(() => localStorage.setItem(LS_REQUESTS, JSON.stringify(requests)), [requests]);
  useEffect(() => localStorage.setItem(LS_ALLOCATIONS, JSON.stringify(allocations)), [allocations]);
  useEffect(() => localStorage.setItem(LS_HISTORY, JSON.stringify(history)), [history]);
  useEffect(() => localStorage.setItem(LS_CONFLICTS, JSON.stringify(conflicts)), [conflicts]);
  useEffect(() => localStorage.setItem(LS_AGENT_RUNS, JSON.stringify(agentRuns)), [agentRuns]);
  useEffect(() => localStorage.setItem(LS_AGENT_LAST_RUN, agentLastRun), [agentLastRun]);

  /** ----------- “Refresh” locally (re-read storage) ----------- */
  const localRefresh = () => {
    setRooms(safeParse<Classroom[]>(localStorage.getItem(LS_ROOMS), seedRooms));
    setRequests(safeParse<RoomRequest[]>(localStorage.getItem(LS_REQUESTS), seedRequests));
    setAllocations(safeParse<RoomAllocation[]>(localStorage.getItem(LS_ALLOCATIONS), []));
    setHistory(safeParse<AllocationHistory[]>(localStorage.getItem(LS_HISTORY), []));
    setConflicts(safeParse<AllocationConflict[]>(localStorage.getItem(LS_CONFLICTS), []));
    setAgentRuns(safeParse<AgentRunSummary[]>(localStorage.getItem(LS_AGENT_RUNS), []));
    setAgentLastRun(localStorage.getItem(LS_AGENT_LAST_RUN) || "");
    showToast("success", "Refreshed", "Reloaded data.");
  };

  /** ----------- Agent ----------- */
  const runAllocationAgent = (onlyPending = true) => {
    const started = isoNow();

    try {
      const target = onlyPending ? requests.filter((r) => r.status === "PENDING") : [...requests];
      const sorted = target.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

      let allocatedCount = 0;
      let failedCount = 0;
      let touched = 0;

      const nextRequests = [...requests];
      let nextAllocations = [...allocations];
      let nextHistory = [...history];
      let nextConflicts = [...conflicts];

      for (const req of sorted) {
        const idx = nextRequests.findIndex((x) => x.id === req.id);
        if (idx < 0) continue;

        // Skip already final statuses if onlyPending
        if (onlyPending && nextRequests[idx].status !== "PENDING") continue;

        touched++;

        // If request already allocated and we rerun agent: do nothing (agent is conservative)
        if (nextRequests[idx].status === "ALLOCATED") continue;
        if (nextRequests[idx].status === "CANCELLED" || nextRequests[idx].status === "REJECTED") continue;

        const pick = pickBestRoom(nextRequests[idx], rooms, nextAllocations);

        if (!pick.room) {
          // Failed: write conflict + reasoning
          const conflictId = uid("conf");
          const suggestions = generateConflictSuggestions(nextRequests[idx], rooms, nextAllocations);
          const conflict: AllocationConflict = {
            id: conflictId,
            requestId: nextRequests[idx].id,
            conflictReason: pick.reason,
            suggestionsJson: suggestions,
            detectedAt: isoNow(),
            resolvedAt: null,
            resolutionNotes: null,
          };
          nextConflicts = [conflict, ...nextConflicts];

          nextRequests[idx] = {
            ...nextRequests[idx],
            status: "FAILED",
            allocationId: null,
            classroomId: null,
            decisionReason: pick.reason,
            conflictId,
            updatedAt: isoNow(),
          };

          failedCount++;
          continue;
        }

        // Success: create allocation
        const allocId = uid("alloc");
        const allocation: RoomAllocation = {
          id: allocId,
          requestId: nextRequests[idx].id,
          classroomId: pick.room.id,
          startAt: nextRequests[idx].startAt,
          endAt: nextRequests[idx].endAt,
          allocatedBy: "AGENT",
          status: "ACTIVE",
          createdAt: isoNow(),
          replacedAt: null,
        };
        nextAllocations = [allocation, ...nextAllocations];

        const h: AllocationHistory = {
          id: uid("hist"),
          allocationId: allocId,
          action: "CREATED",
          actor: "AGENT",
          notes: pick.reason,
          at: isoNow(),
        };
        nextHistory = [h, ...nextHistory];

        // Mark request allocated
        nextRequests[idx] = {
          ...nextRequests[idx],
          status: "ALLOCATED",
          allocationId: allocId,
          classroomId: pick.room.id,
          decisionReason: pick.reason,
          conflictId: null,
          updatedAt: isoNow(),
        };

        allocatedCount++;
      }

      const finished = isoNow();

      const run: AgentRunSummary = {
        id: uid("run"),
        agent_name: "CLASSROOM_ALLOCATION_AGENT",
        started_at: started,
        finished_at: finished,
        status: "DONE",
        summary_json: {
          onlyPending,
          touched,
          allocatedCount,
          failedCount,
          time_ms: Math.max(0, new Date(finished).getTime() - new Date(started).getTime()),
        },
        error_text: null,
      };

      setAllocations(nextAllocations);
      setHistory(nextHistory);
      setConflicts(nextConflicts);
      setRequests(nextRequests);
      setAgentRuns([run, ...agentRuns]);
      setAgentLastRun(finished);

      showToast(
        "success",
        "Agent Run Completed",
        `Allocated: ${allocatedCount} • Failed: ${failedCount} • Processed: ${touched}`
      );
    } catch (e: any) {
      const finished = isoNow();
      const run: AgentRunSummary = {
        id: uid("run"),
        agent_name: "CLASSROOM_ALLOCATION_AGENT",
        started_at: started,
        finished_at: finished,
        status: "FAILED",
        summary_json: { onlyPending: true },
        error_text: String(e),
      };
      setAgentRuns([run, ...agentRuns]);
      setAgentLastRun(finished);
      showToast("error", "Agent Failed", String(e));
    }
  };

  /** Manual override: force allocation (and reassignment if already allocated) */
  const overrideAllocation = (reqId: string, classroomId: string) => {
    const reqIdx = requests.findIndex((r) => r.id === reqId);
    const room = rooms.find((r) => r.id === classroomId);

    if (reqIdx < 0) {
      showToast("error", "Override Failed", "Request not found.");
      return;
    }
    if (!room) {
      showToast("error", "Override Failed", "Classroom not found.");
      return;
    }

    const req = requests[reqIdx];

    // Replace existing active allocation for this request (if any)
    let nextAllocations = [...allocations];
    let nextHistory = [...history];

    const activeForReq = nextAllocations.find(
      (a) => a.requestId === req.id && a.status === "ACTIVE"
    );

    if (activeForReq) {
      nextAllocations = nextAllocations.map((a) =>
        a.id === activeForReq.id ? { ...a, status: "REPLACED", replacedAt: isoNow() } : a
      );
      nextHistory = [
        {
          id: uid("hist"),
          allocationId: activeForReq.id,
          action: "REASSIGNED",
          actor: "ADMIN_UI",
          notes: `Reassigned by admin to room=${room.code} (${room.building})`,
          at: isoNow(),
        },
        ...nextHistory,
      ];
    }

    // Create new forced allocation even if conflicts exist (admin override)
    const allocId = uid("alloc");
    const forced: RoomAllocation = {
      id: allocId,
      requestId: req.id,
      classroomId: room.id,
      startAt: req.startAt,
      endAt: req.endAt,
      allocatedBy: "MANUAL",
      status: "ACTIVE",
      createdAt: isoNow(),
      replacedAt: null,
    };
    nextAllocations = [forced, ...nextAllocations];

    // Conflict warning note (if this creates overlap with OTHER requests)
    const overlapsOther = nextAllocations.some(
      (a) =>
        a.id !== forced.id &&
        a.status === "ACTIVE" &&
        a.classroomId === forced.classroomId &&
        overlaps(a.startAt, a.endAt, forced.startAt, forced.endAt)
    );

    const note = overlapsOther
      ? `Override forced. WARNING: Time conflict exists for room ${room.code} in this window.`
      : `Override forced successfully to room ${room.code} (${room.building}).`;

    nextHistory = [
      {
        id: uid("hist"),
        allocationId: allocId,
        action: "OVERRIDDEN",
        actor: "ADMIN_UI",
        notes: note,
        at: isoNow(),
      },
      ...nextHistory,
    ];

    const nextRequests = [...requests];
    nextRequests[reqIdx] = {
      ...req,
      status: "ALLOCATED",
      allocationId: allocId,
      classroomId: room.id,
      decisionReason: note,
      conflictId: null,
      updatedAt: isoNow(),
    };

    setAllocations(nextAllocations);
    setHistory(nextHistory);
    setRequests(nextRequests);

    showToast("success", "Override Applied", note);
  };

  /** ----------- Filters (Rooms) ----------- */
  const [q, setQ] = useState("");
  const [building, setBuilding] = useState<string>("ALL");
  const [type, setType] = useState<RoomType | "ALL">("ALL");
  const [status, setStatus] = useState<RoomStatus | "ALL">("ALL");
  const [minCap, setMinCap] = useState<number | "">("");
  const [maxCap, setMaxCap] = useState<number | "">("");

  const buildings = useMemo(() => {
    const set = new Set<string>();
    rooms.forEach((r) => set.add(r.building));
    return ["ALL", ...Array.from(set).sort()];
  }, [rooms]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rooms.filter((r) => {
      if (building !== "ALL" && r.building !== building) return false;
      if (type !== "ALL" && r.type !== type) return false;
      if (status !== "ALL" && r.status !== status) return false;
      if (minCap !== "" && r.capacity < minCap) return false;
      if (maxCap !== "" && r.capacity > maxCap) return false;

      if (!s) return true;
      return (
        r.code.toLowerCase().includes(s) ||
        r.name.toLowerCase().includes(s) ||
        r.building.toLowerCase().includes(s) ||
        String(r.floor).includes(s) ||
        String(r.capacity).includes(s) ||
        r.type.toLowerCase().includes(s) ||
        r.status.toLowerCase().includes(s)
      );
    });
  }, [rooms, q, building, type, status, minCap, maxCap]);

  /** ----------- Filters (Requests) ----------- */
  const [rq, setRq] = useState("");
  const [rStatus, setRStatus] = useState<RoomRequestStatus | "ALL">("ALL");
  const [rSource, setRSource] = useState<RequesterType | "ALL">("ALL");

  const filteredRequests = useMemo(() => {
    const s = rq.trim().toLowerCase();
    return requests.filter((x) => {
      if (rStatus !== "ALL" && x.status !== rStatus) return false;
      if (rSource !== "ALL" && x.requesterType !== rSource) return false;
      if (!s) return true;
      return (
        x.id.toLowerCase().includes(s) ||
        x.purpose.toLowerCase().includes(s) ||
        x.requesterType.toLowerCase().includes(s) ||
        (x.preferredBuilding || "").toLowerCase().includes(s) ||
        String(x.capacityRequired).includes(s) ||
        String(x.roomType).toLowerCase().includes(s) ||
        String(x.decisionReason || "").toLowerCase().includes(s)
      );
    });
  }, [requests, rq, rStatus, rSource]);

  /** ----------- Modals (Rooms) ----------- */
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const emptyForm: Omit<Classroom, "id" | "updatedAt"> = {
    code: "",
    name: "",
    building: "A",
    floor: 0,
    capacity: 60,
    type: "LECTURE",
    status: "ACTIVE",
    hasProjector: true,
    hasAC: true,
    notes: "",
  };
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (r: Classroom) => {
    setEditId(r.id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, updatedAt, ...rest } = r;
    setForm(rest);
    setFormOpen(true);
  };

  const closeForm = () => setFormOpen(false);

  const validate = () => {
    if (!form.code.trim()) return "Room Code is required.";
    if (!form.name.trim()) return "Room Name is required.";
    if (!form.building.trim()) return "Building is required.";
    if (!Number.isFinite(form.floor)) return "Floor must be a number.";
    if (!Number.isFinite(form.capacity) || form.capacity <= 0) return "Capacity must be > 0.";
    return null;
  };

  const save = () => {
    const err = validate();
    if (err) {
      showToast("error", "Validation Error", err);
      return;
    }

    if (editId) {
      setRooms((prev) =>
        prev.map((x) => (x.id === editId ? { ...x, ...form, updatedAt: isoNow() } : x))
      );
      showToast("success", "Updated", `Updated ${form.code} (${form.name})`);
      setFormOpen(false);
      return;
    }

    const next: Classroom = { id: uid("room"), ...form, updatedAt: isoNow() };
    setRooms((prev) => [next, ...prev]);
    showToast("success", "Added", `Added ${form.code} (${form.name})`);
    setFormOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteId) return;

    // Safety: if this room has ACTIVE allocations, prevent delete (production behavior)
    const hasActiveAlloc = allocations.some((a) => a.status === "ACTIVE" && a.classroomId === deleteId);
    if (hasActiveAlloc) {
      showToast("error", "Cannot Delete", "This room has active allocations. Reassign/cancel first.");
      return;
    }

    setRooms((prev) => prev.filter((x) => x.id !== deleteId));
    setDeleteId(null);
    showToast("success", "Deleted", "Room deleted.");
  };

  /** ----------- Room Request Create ----------- */
  const [reqOpen, setReqOpen] = useState(false);

  const emptyReq: Omit<RoomRequest, "id" | "status" | "allocationId" | "classroomId"> = {
    requesterType: "FACULTY",
    requesterId: "",
    purpose: "",
    startAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
    endAt: new Date(Date.now() + 1000 * 60 * 120).toISOString(),
    capacityRequired: 60,
    roomType: "LECTURE",
    needsProjector: false,
    needsAC: true,
    preferredBuilding: "",
    decisionReason: "",
    conflictId: null,
    createdAt: isoNow(),
    updatedAt: isoNow(),
  };
  const [reqForm, setReqForm] = useState(emptyReq);

  const validateReq = () => {
    if (!reqForm.purpose.trim()) return "Purpose is required.";
    if (!reqForm.startAt || !reqForm.endAt) return "Start/End time required.";
    const a = new Date(reqForm.startAt).getTime();
    const b = new Date(reqForm.endAt).getTime();
    if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return "End time must be after Start time.";
    if (!Number.isFinite(reqForm.capacityRequired) || reqForm.capacityRequired <= 0) return "Capacity must be > 0.";
    if (reqForm.requesterType === "FACULTY" && !String(reqForm.requesterId || "").trim())
      return "Faculty requesterId is required.";
    return null;
  };

  const createRequest = () => {
    const err = validateReq();
    if (err) {
      showToast("error", "Validation Error", err);
      return;
    }

    const next: RoomRequest = {
      id: uid("rr"),
      ...reqForm,
      requesterId: reqForm.requesterId || null,
      preferredBuilding: reqForm.preferredBuilding || "",
      status: "PENDING",
      allocationId: null,
      classroomId: null,
      decisionReason: "",
      conflictId: null,
      createdAt: isoNow(),
      updatedAt: isoNow(),
    };

    setRequests((prev) => [next, ...prev]);
    showToast("success", "Request Created", "Room request created. Run the Agent to allocate.");
    setReqOpen(false);
    setReqForm(emptyReq);
    setTab("REQUESTS");
  };

  /** ----------- Request Details Modal (reasons + suggestions) ----------- */
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const selectedRequest = useMemo(() => requests.find((r) => r.id === detailsId) || null, [requests, detailsId]);

  const selectedConflict = useMemo(() => {
    if (!selectedRequest?.conflictId) return null;
    return conflicts.find((c) => c.id === selectedRequest.conflictId) || null;
  }, [conflicts, selectedRequest]);

  const selectedAllocation = useMemo(() => {
    if (!selectedRequest?.allocationId) return null;
    return allocations.find((a) => a.id === selectedRequest.allocationId) || null;
  }, [allocations, selectedRequest]);

  const selectedRoom = useMemo(() => {
    const roomId = selectedRequest?.classroomId || selectedAllocation?.classroomId;
    if (!roomId) return null;
    return rooms.find((r) => r.id === roomId) || null;
  }, [rooms, selectedRequest, selectedAllocation]);

  /** ----------- Stats ----------- */
  const stats = useMemo(() => {
    const total = rooms.length;
    const active = rooms.filter((r) => r.status === "ACTIVE").length;
    const maintenance = rooms.filter((r) => r.status === "MAINTENANCE").length;
    const capacity = rooms.reduce((a, r) => a + r.capacity, 0);

    const pendingReq = requests.filter((x) => x.status === "PENDING").length;
    const allocatedReq = requests.filter((x) => x.status === "ALLOCATED").length;
    const failedReq = requests.filter((x) => x.status === "FAILED").length;

    return { total, active, maintenance, capacity, pendingReq, allocatedReq, failedReq };
  }, [rooms, requests]);

  /** ----------- Manual Override Picker ----------- */
  const [overrideReqId, setOverrideReqId] = useState("");
  const [overrideRoomId, setOverrideRoomId] = useState("");

  const allocRoomLabel = (id?: string | null) => {
    if (!id) return "—";
    const r = rooms.find((x) => x.id === id);
    return r ? `${r.code} (${r.building})` : id;
  };

  return (
    <div className="w-full space-y-4">
      {/* Title */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[28px] font-light text-slate-900 dark:text-slate-50 leading-none">
            Classrooms
          </div>

        </div>

        <div className="flex items-center gap-2">
          <GhostBtn onClick={localRefresh}>
            <RefreshCwIcon size={16} />
            Refresh
          </GhostBtn>

          {tab === "ROOMS" ? (
            <PrimaryBtn onClick={openAdd} leftIcon={<PlusIcon size={16} />}>
              Add Classroom
            </PrimaryBtn>
          ) : (
            <PrimaryBtn onClick={() => setReqOpen(true)} leftIcon={<PlusIcon size={16} />}>
              Create Room Request
            </PrimaryBtn>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <Chip active={tab === "ROOMS"} onClick={() => setTab("ROOMS")} icon={<Building2Icon size={16} />}>
          Rooms
        </Chip>
        <Chip active={tab === "REQUESTS"} onClick={() => setTab("REQUESTS")} icon={<DoorOpenIcon size={16} />}>
          Room Requests
        </Chip>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 shadow-sm p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Total Rooms</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
            {stats.total}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 shadow-sm p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Active</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
            {stats.active}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 shadow-sm p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Maintenance</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
            {stats.maintenance}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 shadow-sm p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Total Capacity</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
            {stats.capacity}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 shadow-sm p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Pending</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
            {stats.pendingReq}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 shadow-sm p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Allocated</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
            {stats.allocatedReq}
          </div>
        </div>

        {/* Agent card */}
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500 dark:text-slate-400">Classroom Agent</div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200">
              <SparklesIcon size={14} className="text-indigo-500 dark:text-indigo-300" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
            Last run:{" "}
            <span className="tabular-nums">{agentLastRun ? fmtDt(agentLastRun) : "—"}</span>
          </div>

          <button
            type="button"
            onClick={() => runAllocationAgent(true)}
            className="mt-3 w-full h-9 rounded-xl text-sm font-semibold transition bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Run now
          </button>
        </div>
      </div>

      {tab === "ROOMS" ? (
        <Panel
          title="CLASSROOM DIRECTORY"
          tone="indigo"
          icon={<Building2Icon size={16} className="text-white/95" />}
          right={
            <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-1 rounded-xl border border-white/30 text-white/95">
              Showing: {filtered.length}
            </span>
          }
        >
          <div className="space-y-3">
            {/* Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
              <div className="lg:col-span-4">
                <FieldLabel>Search</FieldLabel>
                <div className="relative mt-1">
                  <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search code, name, building, capacity…"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <FieldLabel>Building</FieldLabel>
                <div className="mt-1">
                  <Select value={building} onChange={(e) => setBuilding(e.target.value)}>
                    {buildings.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="lg:col-span-2">
                <FieldLabel>Type</FieldLabel>
                <div className="mt-1">
                  <Select value={type} onChange={(e) => setType(e.target.value as any)}>
                    <option value="ALL">ALL</option>
                    <option value="LECTURE">LECTURE</option>
                    <option value="LAB">LAB</option>
                    <option value="SEMINAR">SEMINAR</option>
                    <option value="AUDITORIUM">AUDITORIUM</option>
                  </Select>
                </div>
              </div>

              <div className="lg:col-span-2">
                <FieldLabel>Status</FieldLabel>
                <div className="mt-1">
                  <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                    <option value="ALL">ALL</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </Select>
                </div>
              </div>

              <div className="lg:col-span-1">
                <FieldLabel>Min Cap</FieldLabel>
                <div className="mt-1">
                  <Input
                    inputMode="numeric"
                    value={minCap}
                    onChange={(e) => setMinCap(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="lg:col-span-1">
                <FieldLabel>Max Cap</FieldLabel>
                <div className="mt-1">
                  <Input
                    inputMode="numeric"
                    value={maxCap}
                    onChange={(e) => setMaxCap(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="999"
                  />
                </div>
              </div>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap items-center gap-2">
              <Chip
                active={status === "ACTIVE"}
                onClick={() => setStatus(status === "ACTIVE" ? "ALL" : "ACTIVE")}
                icon={<CheckCircle2Icon size={16} />}
              >
                Active
              </Chip>
              <Chip
                active={status === "MAINTENANCE"}
                onClick={() => setStatus(status === "MAINTENANCE" ? "ALL" : "MAINTENANCE")}
                icon={<AlertTriangleIcon size={16} />}
              >
                Maintenance
              </Chip>
              <Chip
                active={type === "LAB"}
                onClick={() => setType(type === "LAB" ? "ALL" : "LAB")}
                icon={<DoorOpenIcon size={16} />}
              >
                Labs
              </Chip>
              <Chip
                active={type === "LECTURE"}
                onClick={() => setType(type === "LECTURE" ? "ALL" : "LECTURE")}
                icon={<UsersIcon size={16} />}
              >
                Lecture
              </Chip>
              <div className="ml-auto hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <FilterIcon size={14} />
                Filters apply instantly
              </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-[1100px] w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                      {["Code","Room Name","Building","Floor","Type","Capacity","Status","Amenities","Updated","Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                          No classrooms found for the current filters.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((r, idx) => (
                        <tr
                          key={r.id}
                          className={cn(
                            idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/20",
                            "border-b border-slate-200/70 dark:border-slate-800/70",
                            "hover:bg-indigo-50/60 dark:hover:bg-indigo-950/25 transition"
                          )}
                        >
                          <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-50">
                            {r.code}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100">
                            {r.name}
                            {r.notes?.trim() ? (
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[360px]">
                                {r.notes}
                              </div>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100">{r.building}</td>
                          <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100 tabular-nums">{r.floor}</td>
                          <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100">{r.type}</td>
                          <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100 tabular-nums">{r.capacity}</td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-1 rounded-xl text-[11px] font-semibold border",
                                r.status === "ACTIVE"
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/35 dark:text-indigo-200 dark:border-indigo-900/40"
                                  : r.status === "MAINTENANCE"
                                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/35 dark:text-amber-200 dark:border-amber-900/40"
                                  : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-200 dark:border-slate-800"
                              )}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                            <span className="inline-flex items-center gap-2">
                              <span className={cn("text-xs", r.hasProjector ? "text-indigo-700 dark:text-indigo-300" : "text-slate-500 dark:text-slate-400")}>
                                Projector
                              </span>
                              <span className="text-slate-300 dark:text-slate-700">•</span>
                              <span className={cn("text-xs", r.hasAC ? "text-indigo-700 dark:text-indigo-300" : "text-slate-500 dark:text-slate-400")}>
                                AC
                              </span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                            {fmtDt(r.updatedAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openEdit(r)}
                                className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 grid place-items-center transition"
                                aria-label="Edit"
                                title="Edit"
                              >
                                <Edit3Icon size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteId(r.id)}
                                className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white hover:bg-rose-50 dark:bg-slate-950 dark:hover:bg-rose-950/30 grid place-items-center transition"
                                aria-label="Delete"
                                title="Delete"
                              >
                                <Trash2Icon size={16} className="text-rose-600 dark:text-rose-300" />
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
        </Panel>
      ) : (
        <Panel
          title="ROOM REQUESTS"
          tone="teal"
          icon={<DoorOpenIcon size={16} className="text-white/95" />}
          right={
            <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-1 rounded-xl border border-white/30 text-white/95">
              Showing: {filteredRequests.length}
            </span>
          }
        >
          <div className="space-y-3">
            {/* Request filters */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
              <div className="lg:col-span-5">
                <FieldLabel>Search</FieldLabel>
                <div className="relative mt-1">
                  <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={rq}
                    onChange={(e) => setRq(e.target.value)}
                    placeholder="Search purpose, type, building, capacity, reason…"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="lg:col-span-3">
                <FieldLabel>Status</FieldLabel>
                <div className="mt-1">
                  <Select value={rStatus} onChange={(e) => setRStatus(e.target.value as any)}>
                    <option value="ALL">ALL</option>
                    <option value="PENDING">PENDING</option>
                    <option value="ALLOCATED">ALLOCATED</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="FAILED">FAILED</option>
                  </Select>
                </div>
              </div>

              <div className="lg:col-span-2">
                <FieldLabel>Requester</FieldLabel>
                <div className="mt-1">
                  <Select value={rSource} onChange={(e) => setRSource(e.target.value as any)}>
                    <option value="ALL">ALL</option>
                    <option value="FACULTY">FACULTY</option>
                    <option value="EXAM">EXAM</option>
                    <option value="PLACEMENT">PLACEMENT</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SYSTEM">SYSTEM</option>
                  </Select>
                </div>
              </div>

              <div className="lg:col-span-2 flex gap-2">
                <GhostBtn onClick={() => runAllocationAgent(true)}>
                  <SparklesIcon size={16} />
                  Run Agent
                </GhostBtn>
                <GhostBtn onClick={localRefresh}>
                  <RefreshCwIcon size={16} />
                  Refresh
                </GhostBtn>
              </div>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap items-center gap-2">
              <Chip
                active={rStatus === "PENDING"}
                onClick={() => setRStatus(rStatus === "PENDING" ? "ALL" : "PENDING")}
                icon={<AlertTriangleIcon size={16} />}
              >
                Pending
              </Chip>
              <Chip
                active={rStatus === "ALLOCATED"}
                onClick={() => setRStatus(rStatus === "ALLOCATED" ? "ALL" : "ALLOCATED")}
                icon={<CheckCircle2Icon size={16} />}
              >
                Allocated
              </Chip>
              <Chip
                active={rStatus === "FAILED"}
                onClick={() => setRStatus(rStatus === "FAILED" ? "ALL" : "FAILED")}
                icon={<XIcon size={16} />}
              >
                Failed
              </Chip>
              <Chip
                active={rSource === "EXAM"}
                onClick={() => setRSource(rSource === "EXAM" ? "ALL" : "EXAM")}
                icon={<ClockIcon size={16} />}
              >
                Exam
              </Chip>
              <Chip
                active={rSource === "PLACEMENT"}
                onClick={() => setRSource(rSource === "PLACEMENT" ? "ALL" : "PLACEMENT")}
                icon={<SendIcon size={16} />}
              >
                Placement
              </Chip>
            </div>

            {/* Manual override strip */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/25 p-3">
              <div className="flex flex-col md:flex-row md:items-end gap-3">
                <div className="flex-1">
                  <FieldLabel>Override Request</FieldLabel>
                  <Select value={overrideReqId} onChange={(e) => setOverrideReqId(e.target.value)}>
                    <option value="">Select request_id…</option>
                    {requests.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.id} • {r.purpose.slice(0, 40)} • {r.status}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex-1">
                  <FieldLabel>Force Classroom</FieldLabel>
                  <Select value={overrideRoomId} onChange={(e) => setOverrideRoomId(e.target.value)}>
                    <option value="">Select classroom_id…</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.code} • {r.building} • {r.status} • cap {r.capacity}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex gap-2">
                  <PrimaryBtn
                    leftIcon={<SparklesIcon size={16} />}
                    onClick={() => {
                      if (!overrideReqId || !overrideRoomId) {
                        showToast("error", "Override", "Pick request and classroom first.");
                        return;
                      }
                      overrideAllocation(overrideReqId, overrideRoomId);
                    }}
                  >
                    Override
                  </PrimaryBtn>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300">
                Override forces allocation (reassignment supported). This is the “Admin manual override” feature.
              </div>
            </div>

            {/* Requests table */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-[1300px] w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                      {["Request","Requester","When","Needs","Capacity","Status","Allocation","Reason","Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                          No room requests found for the current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((x, idx) => (
                        <tr
                          key={x.id}
                          className={cn(
                            idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/20",
                            "border-b border-slate-200/70 dark:border-slate-800/70",
                            "hover:bg-teal-50/60 dark:hover:bg-teal-950/25 transition"
                          )}
                        >
                          <td className="px-4 py-3">
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                              {x.purpose}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                              #{x.id}
                              {x.preferredBuilding ? ` • Pref: ${x.preferredBuilding}` : ""}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100">
                            <div className="font-semibold">{x.requesterType}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {x.requesterId ? `ID: ${x.requesterId}` : "—"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-200 tabular-nums">
                            <div className="inline-flex items-center gap-2">
                              <ClockIcon size={14} className="text-slate-400" />
                              <span>
                                {fmtDt(x.startAt)} → {fmtDt(x.endAt)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-200">
                            <span className="inline-flex items-center gap-2">
                              <span
                                className={cn(
                                  "px-2 py-1 rounded-xl border text-[11px] font-semibold",
                                  x.roomType === "ANY"
                                    ? "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-200 dark:border-slate-800"
                                    : "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/30 dark:text-teal-200 dark:border-teal-900/40"
                                )}
                              >
                                {x.roomType}
                              </span>
                              <span className="text-slate-300 dark:text-slate-700">•</span>
                              <span className={cn(x.needsProjector ? "text-teal-700 dark:text-teal-300" : "text-slate-500 dark:text-slate-400")}>
                                Projector
                              </span>
                              <span className="text-slate-300 dark:text-slate-700">•</span>
                              <span className={cn(x.needsAC ? "text-teal-700 dark:text-teal-300" : "text-slate-500 dark:text-slate-400")}>
                                AC
                              </span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100 tabular-nums">
                            {x.capacityRequired}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-1 rounded-xl text-[11px] font-semibold border",
                                x.status === "ALLOCATED"
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/35 dark:text-indigo-200 dark:border-indigo-900/40"
                                  : x.status === "PENDING"
                                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/35 dark:text-amber-200 dark:border-amber-900/40"
                                  : x.status === "FAILED"
                                  ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/35 dark:text-rose-200 dark:border-rose-900/40"
                                  : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-200 dark:border-slate-800"
                              )}
                            >
                              {x.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                            {x.status === "ALLOCATED" ? (
                              <div>
                                <div>Room: {allocRoomLabel(x.classroomId)}</div>
                                <div className="text-slate-500 dark:text-slate-400">Alloc: {x.allocationId ?? "—"}</div>
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-200">
                            {x.decisionReason?.trim() ? (
                              <span className="line-clamp-2 max-w-[420px]">{x.decisionReason}</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setDetailsId(x.id)}
                                className="h-9 px-3 rounded-xl text-sm font-semibold transition border inline-flex items-center gap-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-100"
                                title="View agent reasoning + suggestions"
                              >
                                <InfoIcon size={16} />
                                Details
                              </button>

                              <button
                                type="button"
                                onClick={() => runAllocationAgent(true)}
                                className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 grid place-items-center transition"
                                title="Run agent"
                              >
                                <RefreshCwIcon size={16} />
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

            <div className="text-xs text-slate-500 dark:text-slate-400">
              Agent writes: status + allocation_id + classroom_id + decisionReason. Failures generate conflict suggestions.
            </div>
          </div>
        </Panel>
      )}

      {/* Add/Edit Room Modal */}
      <Modal open={formOpen} title={editId ? "Edit Classroom" : "Add Classroom"} onClose={closeForm}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Room Code</FieldLabel>
            <div className="mt-1">
              <Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="A-101" />
            </div>
          </div>

          <div>
            <FieldLabel>Room Name</FieldLabel>
            <div className="mt-1">
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Smart Classroom 101" />
            </div>
          </div>

          <div>
            <FieldLabel>Building</FieldLabel>
            <div className="mt-1">
              <Input value={form.building} onChange={(e) => setForm((p) => ({ ...p, building: e.target.value }))} placeholder="A" />
            </div>
          </div>

          <div>
            <FieldLabel>Floor</FieldLabel>
            <div className="mt-1">
              <Input inputMode="numeric" value={form.floor} onChange={(e) => setForm((p) => ({ ...p, floor: Number(e.target.value) }))} placeholder="0" />
            </div>
          </div>

          <div>
            <FieldLabel>Capacity</FieldLabel>
            <div className="mt-1">
              <Input inputMode="numeric" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: Number(e.target.value) }))} placeholder="60" />
            </div>
          </div>

          <div>
            <FieldLabel>Type</FieldLabel>
            <div className="mt-1">
              <Select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as RoomType }))}>
                <option value="LECTURE">LECTURE</option>
                <option value="LAB">LAB</option>
                <option value="SEMINAR">SEMINAR</option>
                <option value="AUDITORIUM">AUDITORIUM</option>
              </Select>
            </div>
          </div>

          <div>
            <FieldLabel>Status</FieldLabel>
            <div className="mt-1">
              <Select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as RoomStatus }))}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="INACTIVE">INACTIVE</option>
              </Select>
            </div>
          </div>

          <div>
            <FieldLabel>Notes (optional)</FieldLabel>
            <div className="mt-1">
              <Input value={form.notes ?? ""} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Any helpful notes" />
            </div>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Toggle checked={form.hasProjector} onChange={(v) => setForm((p) => ({ ...p, hasProjector: v }))} label="Projector available" />
            <Toggle checked={form.hasAC} onChange={(v) => setForm((p) => ({ ...p, hasAC: v }))} label="AC available" />
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
            <GhostBtn onClick={closeForm}>
              <XIcon size={16} />
              Cancel
            </GhostBtn>
            <PrimaryBtn onClick={save} leftIcon={<CheckCircle2Icon size={16} />}>
              Save
            </PrimaryBtn>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteId} title="Delete Classroom" onClose={() => setDeleteId(null)}>
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/25 p-4">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Confirm delete?</div>
            <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Delete is blocked if the room has an ACTIVE allocation.
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <GhostBtn onClick={() => setDeleteId(null)}>
              <XIcon size={16} />
              Cancel
            </GhostBtn>
            <button
              type="button"
              onClick={confirmDelete}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition active:scale-[0.99] bg-rose-600 text-white hover:bg-rose-700"
            >
              <Trash2Icon size={16} />
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Room Request */}
      <Modal
        open={reqOpen}
        title="Create Room Request"
        subtitle="Creates a PENDING request. Run the Classroom Agent to allocate."
        onClose={() => setReqOpen(false)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Requester Type</FieldLabel>
            <div className="mt-1">
              <Select
                value={reqForm.requesterType}
                onChange={(e) => setReqForm((p) => ({ ...p, requesterType: e.target.value as RequesterType }))}
              >
                <option value="FACULTY">FACULTY</option>
                <option value="EXAM">EXAM</option>
                <option value="PLACEMENT">PLACEMENT</option>
                <option value="ADMIN">ADMIN</option>
                <option value="SYSTEM">SYSTEM</option>
              </Select>
            </div>
          </div>

          <div>
            <FieldLabel>Requester ID (Faculty/User)</FieldLabel>
            <div className="mt-1">
              <Input
                value={String(reqForm.requesterId || "")}
                onChange={(e) => setReqForm((p) => ({ ...p, requesterId: e.target.value }))}
                placeholder="e.g., faculty_user_id"
                disabled={reqForm.requesterType !== "FACULTY"}
              />
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Required only for FACULTY requests.
            </div>
          </div>

          <div className="md:col-span-2">
            <FieldLabel>Purpose</FieldLabel>
            <div className="mt-1">
              <TextArea value={reqForm.purpose} onChange={(e) => setReqForm((p) => ({ ...p, purpose: e.target.value }))} placeholder="Seminar / Class / Exam / Placement test …" />
            </div>
          </div>

          <div>
            <FieldLabel>Start</FieldLabel>
            <div className="mt-1">
              <Input
                type="datetime-local"
                value={toIsoLocalInput(reqForm.startAt)}
                onChange={(e) => setReqForm((p) => ({ ...p, startAt: fromLocalInputToIso(e.target.value) }))}
              />
            </div>
          </div>

          <div>
            <FieldLabel>End</FieldLabel>
            <div className="mt-1">
              <Input
                type="datetime-local"
                value={toIsoLocalInput(reqForm.endAt)}
                onChange={(e) => setReqForm((p) => ({ ...p, endAt: fromLocalInputToIso(e.target.value) }))}
              />
            </div>
          </div>

          <div>
            <FieldLabel>Capacity Required</FieldLabel>
            <div className="mt-1">
              <Input
                inputMode="numeric"
                value={reqForm.capacityRequired}
                onChange={(e) => setReqForm((p) => ({ ...p, capacityRequired: Number(e.target.value) }))}
                placeholder="60"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Room Type</FieldLabel>
            <div className="mt-1">
              <Select value={reqForm.roomType} onChange={(e) => setReqForm((p) => ({ ...p, roomType: e.target.value as any }))}>
                <option value="ANY">ANY</option>
                <option value="LECTURE">LECTURE</option>
                <option value="LAB">LAB</option>
                <option value="SEMINAR">SEMINAR</option>
                <option value="AUDITORIUM">AUDITORIUM</option>
              </Select>
            </div>
          </div>

          <div>
            <FieldLabel>Preferred Building (optional)</FieldLabel>
            <div className="mt-1">
              <Input value={reqForm.preferredBuilding || ""} onChange={(e) => setReqForm((p) => ({ ...p, preferredBuilding: e.target.value }))} placeholder="A or B" />
            </div>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Toggle checked={reqForm.needsProjector} onChange={(v) => setReqForm((p) => ({ ...p, needsProjector: v }))} label="Needs Projector" />
            <Toggle checked={reqForm.needsAC} onChange={(v) => setReqForm((p) => ({ ...p, needsAC: v }))} label="Needs AC" />
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
            <GhostBtn onClick={() => setReqOpen(false)}>
              <XIcon size={16} />
              Cancel
            </GhostBtn>
            <PrimaryBtn onClick={createRequest} leftIcon={<CheckCircle2Icon size={16} />}>
              Create Request
            </PrimaryBtn>
          </div>
        </div>
      </Modal>

      {/* Request Details Modal */}
      <Modal
        open={!!detailsId}
        title="Request Details"
        subtitle="Agent reasoning + allocation details + suggestions (if failed)"
        onClose={() => setDetailsId(null)}
      >
        {!selectedRequest ? (
          <div className="text-sm text-slate-600 dark:text-slate-300">Request not found.</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/25 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {selectedRequest.purpose}
                  </div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                    {fmtDt(selectedRequest.startAt)} → {fmtDt(selectedRequest.endAt)} • cap {selectedRequest.capacityRequired} • {selectedRequest.roomType}
                  </div>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-1 rounded-xl text-[11px] font-semibold border",
                    selectedRequest.status === "ALLOCATED"
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/35 dark:text-indigo-200 dark:border-indigo-900/40"
                      : selectedRequest.status === "PENDING"
                      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/35 dark:text-amber-200 dark:border-amber-900/40"
                      : selectedRequest.status === "FAILED"
                      ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/35 dark:text-rose-200 dark:border-rose-900/40"
                      : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-200 dark:border-slate-800"
                  )}
                >
                  {selectedRequest.status}
                </span>
              </div>
            </div>

            {/* Allocation */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Allocation
              </div>
              <div className="mt-2 text-sm text-slate-800 dark:text-slate-100">
                {selectedRequest.status === "ALLOCATED" ? (
                  <div className="space-y-1">
                    <div>
                      <span className="font-semibold">Room:</span>{" "}
                      {selectedRoom ? `${selectedRoom.code} • ${selectedRoom.building} • cap ${selectedRoom.capacity}` : (selectedRequest.classroomId || "—")}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      allocation_id: {selectedRequest.allocationId || "—"}
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 dark:text-slate-400">Not allocated.</div>
                )}
              </div>
            </div>

            {/* Reason */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Agent Reasoning
              </div>
              <div className="mt-2 text-sm text-slate-800 dark:text-slate-100">
                {selectedRequest.decisionReason?.trim() ? selectedRequest.decisionReason : "—"}
              </div>
            </div>

            {/* Suggestions */}
            {selectedRequest.status === "FAILED" && selectedConflict ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Suggestions
                </div>
                <div className="mt-2 text-sm text-slate-800 dark:text-slate-100">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Conflict: {selectedConflict.conflictReason}
                  </div>

                  <div className="mt-3 space-y-2">
                    {(selectedConflict.suggestionsJson?.base || []).slice(0, 6).map((s: any, i: number) => (
                      <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/25 p-3">
                        <div className="text-sm font-semibold">{s.label || s.type}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          {s.reason || ""}
                        </div>
                        {s.startAt && s.endAt ? (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
                            {fmtDt(s.startAt)} → {fmtDt(s.endAt)}
                          </div>
                        ) : null}
                        {s.preferredBuilding ? (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            preferredBuilding: {s.preferredBuilding}
                          </div>
                        ) : null}
                        {s.suggestion ? (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {s.suggestion}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  {selectedConflict.suggestionsJson?.ai ? (
                    <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3">
                      <div className="text-sm font-semibold inline-flex items-center gap-2">
                        <SparklesIcon size={16} className="text-indigo-600 dark:text-indigo-300" />
                        AI-style Insight
                      </div>
                      <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        {selectedConflict.suggestionsJson.ai.conflict_summary}
                      </div>
                      <ul className="mt-2 text-xs text-slate-700 dark:text-slate-200 list-disc pl-5 space-y-1">
                        {(selectedConflict.suggestionsJson.ai.recommended_actions || []).slice(0, 5).map((x: string, i: number) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2">
              <GhostBtn onClick={() => setDetailsId(null)}>
                <XIcon size={16} />
                Close
              </GhostBtn>
              <PrimaryBtn
                leftIcon={<RefreshCwIcon size={16} />}
                onClick={() => runAllocationAgent(true)}
              >
                Run Agent
              </PrimaryBtn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminClassrooms;
