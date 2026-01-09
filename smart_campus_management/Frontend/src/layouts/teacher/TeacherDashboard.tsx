// src/layouts/teacher/TeacherDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000";
const TEACHER_API = `${API_BASE}/api/teacher`;
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Maximize2Icon,
  Minimize2Icon,
  DownloadIcon,
  CheckCircle2Icon,
  Clock3Icon,
  XCircleIcon,
} from "lucide-react";

// -------------------- helpers --------------------
const pad2 = (n: number) => String(n).padStart(2, "0");
const fmtDDMMYYYY = (d: Date) =>
  `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;

const monthText = (d: Date) =>
  d.toLocaleString(undefined, { month: "long", year: "numeric" });

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const addMonths = (d: Date, delta: number) =>
  new Date(d.getFullYear(), d.getMonth() + delta, 1);

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

type PanelKey = "holiday" | "notifications" | "courseApproval";

// -------------------- Premium Panel (with maximize) --------------------
function Panel({
  title,
  tone,
  children,
  maximized,
  onToggleMaximize,
  rightSlot,
}: {
  title: string;
  tone: "indigo" | "red";
  children: React.ReactNode;
  maximized?: boolean;
  onToggleMaximize?: () => void;
  rightSlot?: React.ReactNode;
}) {
  const header =
    tone === "indigo"
      ? "bg-slate-800"
      : "bg-slate-700";

  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col min-h-0">
      {/* header */}
      <div className={`${header} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-2.5 w-2.5 rounded-full bg-white/90" />
          <div className="text-white font-semibold text-sm tracking-wide uppercase truncate">
            {title}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {rightSlot}
          <button
            type="button"
            onClick={onToggleMaximize}
            className="h-8 w-8 grid place-items-center rounded-full border border-white/30 text-white hover:bg-white/10 active:scale-95 transition"
            aria-label={maximized ? "Minimize" : "Maximize"}
            title={maximized ? "Minimize" : "Maximize"}
          >
            {maximized ? <Minimize2Icon size={16} /> : <Maximize2Icon size={16} />}
          </button>
        </div>
      </div>

      {/* body */}
      <div className="p-4 flex-1 min-h-0">{children}</div>
    </div>
  );
}

// -------------------- Calendar --------------------
function HolidayCalendar({
  cursor,
  setCursor,
  selected,
  setSelected,
}: {
  cursor: Date;
  setCursor: React.Dispatch<React.SetStateAction<Date>>;
  selected: Date;
  setSelected: React.Dispatch<React.SetStateAction<Date>>;
}) {
  const today = useMemo(() => new Date(), []);
  const mStart = startOfMonth(cursor);
  const mEnd = endOfMonth(cursor);
  const leadBlanks = mStart.getDay(); // Sun=0
  const daysInMonth = mEnd.getDate();

  const cells: Array<{ kind: "blank" } | { kind: "day"; date: Date }> = [];
  for (let i = 0; i < leadBlanks; i++) cells.push({ kind: "blank" });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      kind: "day",
      date: new Date(cursor.getFullYear(), cursor.getMonth(), d),
    });
  }
  while (cells.length < 42) cells.push({ kind: "blank" });

  const onPrev = () => setCursor((d) => addMonths(d, -1));
  const onNext = () => setCursor((d) => addMonths(d, 1));
  const onToday = () => {
    const now = new Date();
    setCursor(now);
    setSelected(now);
  };

  return (
    <div className="flex flex-col h-full min-h-[430px]">
      {/* top controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <button
              type="button"
              onClick={onPrev}
              className="h-9 w-9 grid place-items-center hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              aria-label="Previous month"
              title="Previous"
            >
              <ChevronLeftIcon size={16} />
            </button>
            <button
              type="button"
              onClick={onNext}
              className="h-9 w-9 grid place-items-center hover:bg-slate-50 dark:hover:bg-slate-800 border-l border-slate-200 dark:border-slate-800 transition"
              aria-label="Next month"
              title="Next"
            >
              <ChevronRightIcon size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={onToday}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
          >
            Today
          </button>
        </div>

        <div className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-50">
          {fmtDDMMYYYY(selected)}
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {monthText(cursor)}
          </div>
          <span className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 shadow-sm">
            Month
          </span>
        </div>
      </div>

      <div className="sm:hidden mt-2 text-sm text-slate-500 dark:text-slate-400">
        {monthText(cursor)}
      </div>

      <div className="mt-3 flex-1 min-h-0 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 grid-rows-6 h-full">
          {cells.map((c, idx) => {
            if (c.kind === "blank") {
              return (
                <div
                  key={idx}
                  className="border-b border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                />
              );
            }

            const d = c.date;
            const isToday = sameDay(d, today);
            const isSel = sameDay(d, selected);

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelected(d)}
                className={[
                  "border-b border-r border-slate-200 dark:border-slate-800",
                  "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition",
                  "px-2 pt-2 text-left relative",
                  isToday ? "bg-amber-50 dark:bg-amber-500/10" : "",
                  // ✅ selection ring changed to premium blue/indigo
                  isSel ? "ring-2 ring-sky-500 ring-inset" : "",
                ].join(" ")}
                aria-label={`Select ${fmtDDMMYYYY(d)}`}
              >
                <div className="text-xs font-medium text-slate-900 dark:text-slate-50">
                  {d.getDate()}
                </div>

                {/* demo “events” dot */}
                {/* ✅ dot changed from green to blue */}

              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// -------------------- Notifications --------------------
type Notice = {
  id: string;
  by: string;
  dateLabel: string;
  body: string;
  hasDownload?: boolean;
};

function NotificationItem({ n }: { n: Notice }) {
  return (
    <div className="flex gap-3 py-4 border-b border-slate-200/70 dark:border-slate-800/70">
      <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0 grid place-items-center shadow-sm">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          {n.by.slice(0, 1).toUpperCase()}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-sky-700 dark:text-sky-400">
          {n.by}{" "}
          <span className="text-slate-500 dark:text-slate-400 font-normal">on</span>{" "}
          {n.dateLabel}
        </div>

        <div className="mt-1.5 text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
          {n.body}
        </div>

        {n.hasDownload && (
          <div className="mt-3">
            {/* ✅ button changed from emerald to indigo */}
            <button
              type="button"
              className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.99] transition shadow-sm"
            >
              <DownloadIcon size={14} />
              Download
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------- Course Approval --------------------
type CourseApprovalItemT = {
  id: string;
  regNo: string;
  name: string;
  dateLabel: string;
  courseCode: string;
  courseName: string;
  status: "Approved" | "Pending" | "Rejected";
};

function StatusPill({ status }: { status: CourseApprovalItemT["status"] }) {
  const cfg =
    status === "Approved"
      ? {
          // ✅ changed from emerald to indigo
          cls: "bg-indigo-600 text-white",
          Icon: CheckCircle2Icon,
        }
      : status === "Pending"
      ? {
          cls: "bg-amber-500 text-white",
          Icon: Clock3Icon,
        }
      : {
          cls: "bg-rose-600 text-white",
          Icon: XCircleIcon,
        };

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-xl shadow-sm",
        cfg.cls,
      ].join(" ")}
    >
      <cfg.Icon size={13} />
      {status}
    </span>
  );
}

function CourseApprovalItem({ row }: { row: CourseApprovalItemT }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900/60 shadow-sm p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            RegNo. & Name:{" "}
            <span className="text-sky-700 dark:text-sky-400">
              {row.regNo} - {row.name}
            </span>{" "}
            <span className="text-slate-500 dark:text-slate-400 font-normal">
              on {row.dateLabel}
            </span>
          </div>

          <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            {row.courseCode} — {row.courseName}
          </div>
        </div>

        <StatusPill status={row.status} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => navigate('/teacher/course/view')}
          className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          View
        </button>
        <button
          type="button"
          onClick={() => navigate('/teacher/course/approve')}
          className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition"
        >
          Take Action
        </button>
      </div>
    </div>
  );
}

// -------------------- MAIN DASHBOARD --------------------
type KPIT = {
  courses: number;
  students: number;
  pendingRequests: number;
  pendingOD: number;
  pendingNoDue: number;
};

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [maxPanel, setMaxPanel] = useState<PanelKey | null>(null);
  const [kpis, setKpis] = useState<KPIT | null>({
    courses: 5,
    students: 120,
    pendingRequests: 10,
    pendingOD: 3,
    pendingNoDue: 2,
  });

  const toggleMax = (k: PanelKey) => {
    setMaxPanel((prev) => (prev === k ? null : k));
  };

  // ESC closes maximize
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMaxPanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // calendar state lifted (keeps state across maximize)
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [selected, setSelected] = useState<Date>(() => new Date());

  const notices: Notice[] = [
    {
      id: "t1",
      by: "Principal",
      dateLabel: "26/12/2025",
      body:
        "Exam schedule updated. Please ensure student communication is completed before 6 PM today.",
      hasDownload: true,
    },
    {
      id: "t2",
      by: "COE Office",
      dateLabel: "22/12/2025",
      body:
        "Internal marks submission window closes tomorrow. Verify the course mapping before submission.",
    },
    {
      id: "t3",
      by: "Academic Office",
      dateLabel: "19/12/2025",
      body:
        "New course enrollment requests are available for review under Course Approval.",
    },
  ];

  const [approvals, setApprovals] = useState<CourseApprovalItemT[]>([]);

  // Load dummy data from localStorage
  useEffect(() => {
    const storedApprovals = localStorage.getItem('teacher_approvals');
    if (storedApprovals) {
      setApprovals(JSON.parse(storedApprovals));
    } else {
      const defaultApprovals: CourseApprovalItemT[] = [
        {
          id: "1",
          regNo: "19221314",
          name: "Alice Johnson",
          dateLabel: "01/01/2026",
          courseCode: "CS101",
          courseName: "Introduction to Computer Science",
          status: "Pending",
        },
        {
          id: "2",
          regNo: "19221315",
          name: "Bob Smith",
          dateLabel: "02/01/2026",
          courseCode: "CS102",
          courseName: "Data Structures",
          status: "Approved",
        },
        {
          id: "3",
          regNo: "19231316",
          name: "Charlie Brown",
          dateLabel: "03/01/2026",
          courseCode: "CS103",
          courseName: "Algorithms",
          status: "Rejected",
        },
      ];
      setApprovals(defaultApprovals);
      localStorage.setItem('teacher_approvals', JSON.stringify(defaultApprovals));
    }
  }, []);

  // Persist approvals changes
  useEffect(() => {
    localStorage.setItem('teacher_approvals', JSON.stringify(approvals));
  }, [approvals]);

  React.useEffect(() => {
    const fetchApprovals = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`${TEACHER_API}/enrollment/requests`, { headers });
        if (res.ok) {
          const data = await res.json();
          const mapped: CourseApprovalItemT[] = (data.requests || []).map((r: any) => ({
            id: String(r.id),
            regNo: r.regNo || r.reg_no,
            name: r.studentName || r.student_name,
            dateLabel: new Date(r.requestedOn || r.requested_on).toLocaleDateString(),
            courseCode: r.courseCode || r.course_code,
            courseName: r.courseName || r.course_name,
            status: (r.status === "APPROVED" ? "Approved" : r.status === "REJECTED" ? "Rejected" : "Pending") as "Approved" | "Pending" | "Rejected",
          }));
          setApprovals(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch approvals", err);
      }
    };
    fetchApprovals();
  }, []);

  React.useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`${TEACHER_API}/kpis`, { headers });
        if (res.ok) {
          const data = await res.json();
          setKpis(data.kpis);
        }
      } catch (err) {
        console.error("Failed to load KPIs", err);
      }
    };
    fetchKPIs();
  }, []);

  // lock background scroll when maximized
  useEffect(() => {
    if (!maxPanel) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [maxPanel]);

  const holidayContent = (
    <HolidayCalendar
      cursor={cursor}
      setCursor={setCursor}
      selected={selected}
      setSelected={setSelected}
    />
  );

  const notificationContent = (
    <div className="h-full overflow-y-auto scrollbar-hide pr-2">
      {notices.map((n) => (
        <NotificationItem key={n.id} n={n} />
      ))}
    </div>
  );

  const courseApprovalContent = (
    <div className="h-full overflow-y-auto scrollbar-hide pr-2 space-y-3">
      {approvals.map((a) => (
        <CourseApprovalItem key={a.id} row={a} />
      ))}
      {approvals.length === 0 && (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
              No Course Approval Requests
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Requests will appear here when students submit enrollments.
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderOverlay = () => {
    if (!maxPanel) return null;

    const cfg =
      maxPanel === "holiday"
        ? { title: "HOLIDAY & EVENTS", tone: "indigo" as const, body: holidayContent }
        : maxPanel === "notifications"
        ? { title: "NOTIFICATION", tone: "red" as const, body: notificationContent }
        : { title: "COURSE APPROVAL", tone: "indigo" as const, body: courseApprovalContent };

    return (
      <div className="fixed inset-0 z-[80]">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          onClick={() => setMaxPanel(null)}
          aria-hidden="true"
        />
        <div className="absolute inset-3 sm:inset-6 lg:inset-10">
          <div className="h-full w-full animate-[fadeIn_140ms_ease-out]">
            <Panel
              title={cfg.title}
              tone={cfg.tone}
              maximized
              onToggleMaximize={() => setMaxPanel(null)}
            >
              <div className="h-full min-h-0">{cfg.body}</div>
            </Panel>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full relative">
      {/* KPIs */}
      {kpis && (
        <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{kpis.courses}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">Courses</div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">{kpis.students}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">Students</div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{kpis.pendingRequests}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">Pending Requests</div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{kpis.pendingOD}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">OD Requests</div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{kpis.pendingNoDue}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">No Due Requests</div>
          </div>
        </div>
      )}

      {/* main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 xl:min-h-[720px] xl:h-[calc(100vh-160px)]">
        {/* LEFT */}
        <div className="xl:col-span-8 flex flex-col gap-4 min-h-0">
          {/* Holiday */}
          <div className="min-h-[540px] xl:flex-1 xl:min-h-0">
            <Panel
              title="HOLIDAY & EVENTS"
              tone="indigo"
              maximized={maxPanel === "holiday"}
              onToggleMaximize={() => toggleMax("holiday")}
            >
              {holidayContent}
            </Panel>
          </div>

          {/* Course Approval */}
          <div className="h-[300px] xl:h-[320px] min-h-0">
            <Panel
              title="COURSE APPROVAL"
              tone="indigo"
              maximized={maxPanel === "courseApproval"}
              onToggleMaximize={() => toggleMax("courseApproval")}
              rightSlot={
                <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-1 rounded-xl border border-white/30 text-white/95">
                  Requests: {approvals.length}
                </span>
              }
            >
              <div className="h-full min-h-0">{courseApprovalContent}</div>
            </Panel>
          </div>
        </div>

        {/* RIGHT */}
        <div className="xl:col-span-4 min-h-[540px] xl:min-h-0 flex flex-col">
          <Panel
            title="NOTIFICATION"
            tone="red"
            maximized={maxPanel === "notifications"}
            onToggleMaximize={() => toggleMax("notifications")}
          >
            <div className="h-[540px] xl:h-full min-h-0">{notificationContent}</div>
          </Panel>
        </div>
      </div>

      {renderOverlay()}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
