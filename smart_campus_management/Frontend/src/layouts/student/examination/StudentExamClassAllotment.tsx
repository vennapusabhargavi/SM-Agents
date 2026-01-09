import React, { useEffect, useMemo, useState } from "react";
import { StudentPageShell } from "../StudentPageShell";
import {
  CalendarDaysIcon,
  SearchIcon,
  DownloadIcon,
  MapPinIcon,
  BadgeCheckIcon,
  AlertTriangleIcon,
  BriefcaseIcon,
  BookOpenIcon,
} from "lucide-react";

type AllocationKind = "EXAM" | "PLACEMENT" | "THEORY";
type AllotmentStatus = "ALLOCATED" | "PENDING" | "NOT_ELIGIBLE";

type ClassroomAllocationItem = {
  id: string;
  kind: AllocationKind;

  date: string; // yyyy-mm-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm

  roomCode: string; // e.g., B-201
  building?: string;
  seatNo?: string;
  tokenNo?: number;
  venueNote?: string;

  status: AllotmentStatus;
  statusReason?: string;

  allocatedBy?: string;
  allocatedAt?: string;

  // Exam-only
  session?: string; // FN/AN
  subjectCode?: string;
  subjectName?: string;
  hallTicketNo?: string;

  // Placement-only
  companyName?: string;
  driveTitle?: string;
  roundName?: string;

  // Theory class-only
  courseCode?: string;
  courseName?: string;
  facultyName?: string;
};

function clsx(...p: Array<string | false | null | undefined>) {
  return p.filter(Boolean).join(" ");
}

function downloadJson(filename: string, data: any) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function isPast(dateYmd: string) {
  const d = new Date(dateYmd + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return d.getTime() < today;
}

async function fetchClassroomAllocationsFromApi(): Promise<ClassroomAllocationItem[] | null> {
  try {
    const API_BASE =
      (import.meta as any)?.env?.VITE_API_BASE_URL ||
      (window as any).__API_BASE_URL__ ||
      "http://localhost/smart_campus_api";

    const token =
      localStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("auth_token") ||
      localStorage.getItem("access_token") ||
      "";

    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    // Preferred unified endpoint
    const preferred = [
      `${API_BASE}/api/student/classroom-allocations`,
      `${API_BASE}/api/student/classroom-allocation`,
      `${API_BASE}/student/classroom-allocations`,
    ];

    for (const url of preferred) {
      const res = await fetch(url, { headers });
      if (!res.ok) continue;
      const json = await res.json();
      if (!json || json.ok !== true || !Array.isArray(json.items)) continue;
      return json.items as ClassroomAllocationItem[];
    }

    // Legacy exam-only endpoint fallback (maps to unified shape)
    const legacyExam = [
      `${API_BASE}/api/student/exams/class-allotment`,
      `${API_BASE}/student/exams/class-allotment`,
    ];

    for (const url of legacyExam) {
      const res = await fetch(url, { headers });
      if (!res.ok) continue;

      const json = await res.json();
      if (!json || json.ok !== true || !Array.isArray(json.items)) continue;

      const mapped: ClassroomAllocationItem[] = (json.items as any[]).map((x, idx) => ({
        id: x.id ?? `legacy_exam_${idx}`,
        kind: "EXAM",
        date: x.examDate ?? "",
        startTime: x.startTime ?? "",
        endTime: x.endTime ?? "",
        roomCode: x.roomCode ?? "—",
        building: x.building,
        seatNo: x.seatNo,
        tokenNo: x.tokenNo,
        venueNote: x.venueNote,
        status: x.status ?? "PENDING",
        statusReason: x.statusReason,
        allocatedBy: x.allocatedBy ?? "Classroom Allocation Agent",
        allocatedAt: x.allocatedAt ?? "—",
        session: x.session,
        subjectCode: x.subjectCode,
        subjectName: x.subjectName,
        hallTicketNo: x.hallTicketNo,
      }));

      return mapped;
    }

    return null;
  } catch {
    return null;
  }
}



type ViewTab = "upcoming" | "past" | "all";
type KindTab = "ALL" | "EXAM" | "PLACEMENT" | "THEORY";

const PANEL = "rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden";
const HEADER = "px-4 py-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between";
const BODY = "p-4";

function Chip({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "info" | "success" | "warn" | "danger";
  children: React.ReactNode;
}) {
  const map = {
    neutral:
      "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-900/60 dark:text-slate-200 dark:ring-slate-800",
    info:
      "bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-900/40",
    success:
      "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/35 dark:text-emerald-200 dark:ring-emerald-900/40",
    warn:
      "bg-amber-50 text-amber-800 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900/40",
    danger:
      "bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-950/35 dark:text-rose-200 dark:ring-rose-900/40",
  } as const;

  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1", map[tone])}>
      {children}
    </span>
  );
}

function StatusPill({ status }: { status: AllotmentStatus }) {
  if (status === "ALLOCATED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/35 dark:text-emerald-200 dark:ring-emerald-900/40">
        <BadgeCheckIcon className="h-3.5 w-3.5" />
        ALLOCATED
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-amber-50 text-amber-800 ring-1 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900/40">
        <AlertTriangleIcon className="h-3.5 w-3.5" />
        PENDING
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-rose-50 text-rose-700 ring-1 ring-rose-100 dark:bg-rose-950/35 dark:text-rose-200 dark:ring-rose-900/40">
      <AlertTriangleIcon className="h-3.5 w-3.5" />
      NOT ELIGIBLE
    </span>
  );
}

function SegButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium transition rounded-lg border",
        active
          ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-50 dark:text-slate-900 dark:border-slate-50"
          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"
      )}
    >
      {icon}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

export function StudentExamClassAllotment() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ClassroomAllocationItem[]>([]);
  const [viewTab, setViewTab] = useState<ViewTab>("upcoming");
  const [kindTab, setKindTab] = useState<KindTab>("ALL");
  const [q, setQ] = useState("");

  useEffect(() => {
    const storedAllocations = localStorage.getItem('student_classroom_allocations');
    if (storedAllocations) {
      setItems(JSON.parse(storedAllocations));
    } else {
      const dummyItems: ClassroomAllocationItem[] = [
        // Exam allocations
        {
          id: "exam1",
          kind: "EXAM",
          date: "2026-01-15",
          startTime: "09:00",
          endTime: "12:00",
          roomCode: "B-201",
          building: "Block B",
          seatNo: "A15",
          tokenNo: 45,
          venueNote: "Bring hall ticket",
          status: "ALLOCATED",
          allocatedBy: "Classroom Allocation Agent",
          allocatedAt: "2026-01-10",
          session: "FN",
          subjectCode: "CS101",
          subjectName: "Introduction to Computer Science",
          hallTicketNo: "HT123456",
        },
        {
          id: "exam2",
          kind: "EXAM",
          date: "2026-01-16",
          startTime: "14:00",
          endTime: "17:00",
          roomCode: "C-105",
          building: "Block C",
          seatNo: "B20",
          tokenNo: 67,
          status: "PENDING",
          allocatedBy: "Classroom Allocation Agent",
          session: "AN",
          subjectCode: "CS102",
          subjectName: "Data Structures",
        },
        // Placement allocations
        {
          id: "placement1",
          kind: "PLACEMENT",
          date: "2026-01-20",
          startTime: "10:00",
          endTime: "13:00",
          roomCode: "A-101",
          building: "Block A",
          seatNo: "C10",
          tokenNo: 23,
          status: "ALLOCATED",
          allocatedBy: "Placement Office",
          allocatedAt: "2026-01-12",
          companyName: "Tech Corp",
          driveTitle: "Software Engineer Hiring",
          roundName: "Technical Round",
        },
        {
          id: "placement2",
          kind: "PLACEMENT",
          date: "2026-01-25",
          startTime: "15:00",
          endTime: "18:00",
          roomCode: "D-202",
          building: "Block D",
          seatNo: "D5",
          status: "NOT_ELIGIBLE",
          statusReason: "Not registered for placement",
          companyName: "Data Solutions Inc",
          driveTitle: "Data Analyst Position",
          roundName: "Aptitude Test",
        },
        // Theory class allocations
        {
          id: "theory1",
          kind: "THEORY",
          date: "2026-01-18",
          startTime: "08:00",
          endTime: "09:00",
          roomCode: "E-301",
          building: "Block E",
          seatNo: "F12",
          tokenNo: 89,
          status: "ALLOCATED",
          allocatedBy: "Academic Office",
          allocatedAt: "2026-01-08",
          courseCode: "CS103",
          courseName: "Algorithms",
          facultyName: "Dr. John Smith",
        },
        {
          id: "theory2",
          kind: "THEORY",
          date: "2026-01-19",
          startTime: "11:00",
          endTime: "12:00",
          roomCode: "F-105",
          building: "Block F",
          seatNo: "G8",
          status: "PENDING",
          courseCode: "CS104",
          courseName: "Database Systems",
          facultyName: "Prof. Jane Doe",
        },
      ];
      setItems(dummyItems);
      localStorage.setItem('student_classroom_allocations', JSON.stringify(dummyItems));
    }
    setLoading(false);
  }, []);

  const baseFiltered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    let base = items.slice();
    if (viewTab === "upcoming") base = base.filter((x) => !isPast(x.date));
    if (viewTab === "past") base = base.filter((x) => isPast(x.date));

    if (kindTab === "EXAM") base = base.filter((x) => x.kind === "EXAM");
    if (kindTab === "PLACEMENT") base = base.filter((x) => x.kind === "PLACEMENT");
    if (kindTab === "THEORY") base = base.filter((x) => x.kind === "THEORY");

    const sort = (a: ClassroomAllocationItem, b: ClassroomAllocationItem) =>
      a.date.localeCompare(b.date) || (a.startTime || "").localeCompare(b.startTime || "");

    if (!needle) return base.sort(sort);

    return base
      .filter((x) => {
        const txt = [
          x.kind,
          x.date,
          x.startTime,
          x.endTime,
          x.roomCode,
          x.building ?? "",
          x.seatNo ?? "",
          x.status,
          x.statusReason ?? "",
          x.subjectCode ?? "",
          x.subjectName ?? "",
          x.hallTicketNo ?? "",
          x.companyName ?? "",
          x.driveTitle ?? "",
          x.roundName ?? "",
          x.courseCode ?? "",
          x.courseName ?? "",
          x.facultyName ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return txt.includes(needle);
      })
      .sort(sort);
  }, [items, q, viewTab, kindTab]);

  const examRows = useMemo(
    () => baseFiltered.filter((x) => x.kind === "EXAM"),
    [baseFiltered]
  );
  const placementRows = useMemo(
    () => baseFiltered.filter((x) => x.kind === "PLACEMENT"),
    [baseFiltered]
  );
  const theoryRows = useMemo(
    () => baseFiltered.filter((x) => x.kind === "THEORY"),
    [baseFiltered]
  );

  const kpis = useMemo(() => {
    const total = items.length;
    const allocated = items.filter((x) => x.status === "ALLOCATED").length;
    const pending = items.filter((x) => x.status === "PENDING").length;
    const notEligible = items.filter((x) => x.status === "NOT_ELIGIBLE").length;
    const exams = items.filter((x) => x.kind === "EXAM").length;
    const placements = items.filter((x) => x.kind === "PLACEMENT").length;
    const theory = items.filter((x) => x.kind === "THEORY").length;
    return { total, allocated, pending, notEligible, exams, placements, theory };
  }, [items]);

  const TableShell = ({ children }: { children: React.ReactNode }) => (
    <div className="overflow-x-auto border border-slate-300 rounded-lg dark:border-slate-600">
      <div className="min-w-[1100px]">{children}</div>
    </div>
  );

  const SectionHeader = ({
    title,
    sub,
    right,
  }: {
    title: string;
    sub?: string;
    right?: React.ReactNode;
  }) => (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
      <div>
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{title}</div>
        {sub ? <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub}</div> : null}
      </div>
      {right}
    </div>
  );

  return (
    <StudentPageShell
      title="Classroom Allocation"
      subtitle="Exam seats, placement rooms, and theory class allocations appear here once assigned by the Classroom Allocation Agent."
      crumbs={[
        { label: "Student", to: "/student/home" },
        { label: "Classroom Allocation" },
      ]}
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-7 gap-3">
        {[
          { label: "Total", value: kpis.total },
          { label: "Allocated", value: kpis.allocated },
          { label: "Pending", value: kpis.pending },
          { label: "Not Eligible", value: kpis.notEligible },
          { label: "Exams", value: kpis.exams },
          { label: "Placements", value: kpis.placements },
          { label: "Theory", value: kpis.theory },
        ].map((c) => (
          <div key={c.label} className="rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{c.label}</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className={clsx("mt-4", PANEL)}>
        <div className={HEADER}>
          <div className="text-slate-900 dark:text-slate-100 text-[13px] font-semibold tracking-wide uppercase">Allocation Viewer</div>
          <div className="text-slate-600 dark:text-slate-400 text-xs font-semibold">
            {loading ? "Loading…" : `${baseFiltered.length} result(s)`}
          </div>
        </div>

        <div className={BODY}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <SegButton active={kindTab === "ALL"} icon={<CalendarDaysIcon size={16} />} label="All" onClick={() => setKindTab("ALL")} />
              <SegButton active={kindTab === "EXAM"} icon={<BookOpenIcon size={16} />} label="Exams" onClick={() => setKindTab("EXAM")} />
              <SegButton active={kindTab === "PLACEMENT"} icon={<BriefcaseIcon size={16} />} label="Placements" onClick={() => setKindTab("PLACEMENT")} />
              <SegButton active={kindTab === "THEORY"} icon={<BookOpenIcon size={16} />} label="Theory" onClick={() => setKindTab("THEORY")} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1">
                {(["upcoming", "past", "all"] as ViewTab[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setViewTab(k)}
                    className={clsx(
                      "px-3 py-1 text-sm font-medium border rounded",
                      viewTab === k
                        ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-50 dark:text-slate-900 dark:border-slate-50"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"
                    )}
                  >
                    {k === "upcoming" ? "Upcoming" : k === "past" ? "Past" : "All"}
                  </button>
                ))}
              </div>

              <div className="relative w-full lg:w-[360px]">
                <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search subject / company / course / room…"
                  className="w-full h-10 rounded-lg pl-9 pr-3 text-sm border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 dark:focus:ring-slate-400"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  downloadJson(`classroom_allocation_${Date.now()}.json`, baseFiltered);
                }}
                className="h-10 px-4 rounded-lg text-sm font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700 inline-flex items-center gap-2"
              >
                <DownloadIcon className="h-4 w-4" />
                Download
              </button>

              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setViewTab("upcoming");
                  setKindTab("ALL");
                }}
                className="h-10 px-4 rounded-lg text-sm font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"
              >
                Reset
              </button>
            </div>
          </div>

          {loading ? (
            <div className="mt-4 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800 bg-slate-50 dark:bg-slate-900/25 p-6 text-center">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Loading…</div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Fetching allocations.
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {/* Exams section (when ALL or EXAM) */}
              {(kindTab === "ALL" || kindTab === "EXAM") && (
                <div className={PANEL}>
                  <div className={HEADER}>
                    <div className="text-slate-900 dark:text-slate-100 text-[13px] font-semibold tracking-wide uppercase">Exam Allocations</div>
                    <div className="text-slate-600 dark:text-slate-400 text-xs font-semibold">{examRows.length} record(s)</div>
                  </div>
                  <div className={BODY}>
                    <SectionHeader
                      title="Exam seat & room"
                      sub="Shows subject + session + hall ticket + seat allocation."
                      right={
                        <div className="flex flex-wrap gap-2">
                          <Chip tone="info">Total: {examRows.length}</Chip>
                          <Chip tone="success">Allocated: {examRows.filter((x) => x.status === "ALLOCATED").length}</Chip>
                          <Chip tone="warn">Pending: {examRows.filter((x) => x.status === "PENDING").length}</Chip>
                        </div>
                      }
                    />

                    <div className="mt-3">
                      <TableShell>
                        <table className="w-full text-sm">
                          <thead className="bg-slate-100 dark:bg-slate-800">
                            <tr className="border-b border-slate-300 dark:border-slate-600">
                              {["Date / Session", "Subject", "Time", "Room / Seat", "Hall Ticket", "Status"].map((h) => (
                                <th
                                  key={h}
                                  className="px-4 py-2 text-left text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {examRows.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                  No exam allocations found.
                                </td>
                              </tr>
                            ) : (
                              examRows.map((x, idx) => (
                                <tr
                                  key={x.id}
                                  className={clsx(
                                    "border-b border-slate-200/70 dark:border-slate-800/70 transition",
                                    idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/20",
                                    "hover:bg-indigo-50/60 dark:hover:bg-indigo-950/25"
                                  )}
                                >
                                  <td className="px-4 py-3">
                                    <div className="font-semibold text-slate-900 dark:text-white tabular-nums">{x.date}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{x.session ?? "—"}</div>
                                  </td>

                                  <td className="px-4 py-3">
                                    <div className="font-semibold text-slate-900 dark:text-white">
                                      {(x.subjectCode ?? "—") + (x.subjectName ? ` • ${x.subjectName}` : "")}
                                    </div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                      Allocated by {x.allocatedBy ?? "—"} {x.allocatedAt ? `• ${x.allocatedAt}` : ""}
                                    </div>
                                  </td>

                                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">
                                    {x.startTime}–{x.endTime}
                                  </td>

                                  <td className="px-4 py-3">
                                    <div className="font-semibold text-slate-900 dark:text-white inline-flex items-center gap-2">
                                      <MapPinIcon className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                                      {x.roomCode}
                                      {x.building ? (
                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">• {x.building}</span>
                                      ) : null}
                                    </div>
                                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                                      Seat: <span className="font-semibold tabular-nums">{x.seatNo ?? "—"}</span>
                                      {typeof x.tokenNo === "number" ? (
                                        <span className="ml-2">
                                          Token: <span className="font-semibold tabular-nums">{x.tokenNo}</span>
                                        </span>
                                      ) : null}
                                    </div>
                                    {x.venueNote ? (
                                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{x.venueNote}</div>
                                    ) : null}
                                  </td>

                                  <td className="px-4 py-3">
                                    <div className="font-semibold tabular-nums text-slate-900 dark:text-white">{x.hallTicketNo ?? "—"}</div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Download via portal if enabled</div>
                                  </td>

                                  <td className="px-4 py-3">
                                    <StatusPill status={x.status} />
                                    {x.statusReason ? (
                                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{x.statusReason}</div>
                                    ) : null}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </TableShell>
                    </div>
                  </div>
                </div>
              )}

              {/* Placements section (when ALL or PLACEMENT) */}
              {(kindTab === "ALL" || kindTab === "PLACEMENT") && (
                <div className={PANEL}>
                  <div className={HEADER}>
                    <div className="text-slate-900 dark:text-slate-100 text-[13px] font-semibold tracking-wide uppercase">Placement Allocations</div>
                    <div className="text-slate-600 dark:text-slate-400 text-xs font-semibold">{placementRows.length} record(s)</div>
                  </div>
                  <div className={BODY}>
                    <SectionHeader
                      title="Placement rooms"
                      sub="Shows company + drive + round + room allocation."
                      right={
                        <div className="flex flex-wrap gap-2">
                          <Chip tone="info">Total: {placementRows.length}</Chip>
                          <Chip tone="success">
                            Allocated: {placementRows.filter((x) => x.status === "ALLOCATED").length}
                          </Chip>
                          <Chip tone="warn">Pending: {placementRows.filter((x) => x.status === "PENDING").length}</Chip>
                        </div>
                      }
                    />

                    <div className="mt-3">
                      <TableShell>
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 dark:bg-slate-900/40">
                            <tr className="border-b border-slate-200 dark:border-slate-800">
                              {["Date", "Company / Drive", "Round", "Time", "Room / Seat", "Status"].map((h) => (
                                <th
                                  key={h}
                                  className="px-4 py-3 text-left text-[12px] font-semibold text-slate-600 dark:text-slate-300"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {placementRows.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                  No placement allocations found.
                                </td>
                              </tr>
                            ) : (
                              placementRows.map((x, idx) => (
                                <tr
                                  key={x.id}
                                  className={clsx(
                                    "border-b border-slate-200/70 dark:border-slate-800/70 transition",
                                    idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/20",
                                    "hover:bg-indigo-50/60 dark:hover:bg-indigo-950/25"
                                  )}
                                >
                                  <td className="px-4 py-3">
                                    <div className="font-semibold text-slate-900 dark:text-white tabular-nums">{x.date}</div>
                                  </td>

                                  <td className="px-4 py-3">
                                    <div className="font-semibold text-slate-900 dark:text-white inline-flex items-center gap-2">
                                      <BriefcaseIcon className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                                      {x.companyName ?? "—"}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{x.driveTitle ?? "—"}</div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                      Allocated by {x.allocatedBy ?? "—"} {x.allocatedAt ? `• ${x.allocatedAt}` : ""}
                                    </div>
                                  </td>

                                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                                    <div className="font-semibold">{x.roundName ?? "—"}</div>
                                  </td>

                                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">
                                    {x.startTime}–{x.endTime}
                                  </td>

                                  <td className="px-4 py-3">
                                    <div className="font-semibold text-slate-900 dark:text-white inline-flex items-center gap-2">
                                      <MapPinIcon className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                                      {x.roomCode}
                                      {x.building ? (
                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">• {x.building}</span>
                                      ) : null}
                                    </div>
                                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                                      Seat: <span className="font-semibold tabular-nums">{x.seatNo ?? "—"}</span>
                                      {typeof x.tokenNo === "number" ? (
                                        <span className="ml-2">
                                          Token: <span className="font-semibold tabular-nums">{x.tokenNo}</span>
                                        </span>
                                      ) : null}
                                    </div>
                                    {x.venueNote ? (
                                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{x.venueNote}</div>
                                    ) : null}
                                  </td>

                                  <td className="px-4 py-3">
                                    <StatusPill status={x.status} />
                                    {x.statusReason ? (
                                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{x.statusReason}</div>
                                    ) : null}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </TableShell>
                    </div>
                  </div>
                </div>
              )}

              {/* Theory section (when ALL or THEORY) */}
              {(kindTab === "ALL" || kindTab === "THEORY") && (
                <div className={PANEL}>
                  <div className={HEADER}>
                    <div className="text-slate-900 dark:text-slate-100 text-[13px] font-semibold tracking-wide uppercase">Theory Class Allocations</div>
                    <div className="text-slate-600 dark:text-slate-400 text-xs font-semibold">{theoryRows.length} record(s)</div>
                  </div>
                  <div className={BODY}>
                    <SectionHeader
                      title="Theory class rooms"
                      sub="Shows course + faculty + room + seat allocation."
                      right={
                        <div className="flex flex-wrap gap-2">
                          <Chip tone="info">Total: {theoryRows.length}</Chip>
                          <Chip tone="success">Allocated: {theoryRows.filter((x) => x.status === "ALLOCATED").length}</Chip>
                          <Chip tone="warn">Pending: {theoryRows.filter((x) => x.status === "PENDING").length}</Chip>
                        </div>
                      }
                    />

                    <div className="mt-3">
                      <TableShell>
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 dark:bg-slate-900/40">
                            <tr className="border-b border-slate-200 dark:border-slate-800">
                              {["Date", "Course / Faculty", "Time", "Room / Seat", "Status"].map((h) => (
                                <th
                                  key={h}
                                  className="px-4 py-3 text-left text-[12px] font-semibold text-slate-600 dark:text-slate-300"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {theoryRows.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                  No theory class allocations found.
                                </td>
                              </tr>
                            ) : (
                              theoryRows.map((x, idx) => (
                                <tr
                                  key={x.id}
                                  className={clsx(
                                    "border-b border-slate-200/70 dark:border-slate-800/70 transition",
                                    idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/20",
                                    "hover:bg-indigo-50/60 dark:hover:bg-indigo-950/25"
                                  )}
                                >
                                  <td className="px-4 py-3">
                                    <div className="font-semibold text-slate-900 dark:text-white tabular-nums">{x.date}</div>
                                  </td>

                                  <td className="px-4 py-3">
                                    <div className="font-semibold text-slate-900 dark:text-white inline-flex items-center gap-2">
                                      <BookOpenIcon className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                                      {(x.courseCode ?? "—") + (x.courseName ? ` • ${x.courseName}` : "")}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{x.facultyName ?? "—"}</div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                      Allocated by {x.allocatedBy ?? "—"} {x.allocatedAt ? `• ${x.allocatedAt}` : ""}
                                    </div>
                                  </td>

                                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">
                                    {x.startTime}–{x.endTime}
                                  </td>

                                  <td className="px-4 py-3">
                                    <div className="font-semibold text-slate-900 dark:text-white inline-flex items-center gap-2">
                                      <MapPinIcon className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                                      {x.roomCode}
                                      {x.building ? (
                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">• {x.building}</span>
                                      ) : null}
                                    </div>
                                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                                      Seat: <span className="font-semibold tabular-nums">{x.seatNo ?? "—"}</span>
                                      {typeof x.tokenNo === "number" ? (
                                        <span className="ml-2">
                                          Token: <span className="font-semibold tabular-nums">{x.tokenNo}</span>
                                        </span>
                                      ) : null}
                                    </div>
                                    {x.venueNote ? (
                                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{x.venueNote}</div>
                                    ) : null}
                                  </td>

                                  <td className="px-4 py-3">
                                    <StatusPill status={x.status} />
                                    {x.statusReason ? (
                                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{x.statusReason}</div>
                                    ) : null}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </TableShell>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>


    </StudentPageShell>
  );
}

export default StudentExamClassAllotment;
