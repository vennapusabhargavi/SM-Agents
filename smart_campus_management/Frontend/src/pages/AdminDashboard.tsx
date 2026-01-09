// src/layouts/admin/AdminDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuth } from "../components/ProtectedRoute";
import {
  BellIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  ExpandIcon,
  Minimize2Icon,
  RefreshCwIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  UsersIcon,
  Building2Icon,
  WalletIcon,
  GraduationCapIcon,
} from "lucide-react";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

// ---------- Premium Panel (matches your TeacherDashboard style) ----------
function useBodyScrollLock(lock: boolean) {
  useEffect(() => {
    if (!lock) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lock]);
}

function Panel({
  title,
  subtitle,
  tone = "indigo",
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  tone?: "indigo" | "teal" | "rose";
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [max, setMax] = useState(false);
  useBodyScrollLock(max);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMax(false);
    };
    if (max) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [max]);

  const hdr =
    tone === "teal"
      ? "bg-gray-800 text-white"
      : tone === "rose"
      ? "bg-gray-800 text-white"
      : "bg-gray-800 text-white";

  const card =
    "rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden flex flex-col min-h-0";

  const body = (
    <div className={cn(card, max && "h-[calc(100vh-3rem)]")}>
      <div className={cn(hdr, "px-4 py-3 flex items-start justify-between gap-3")}>
        <div className="min-w-0">
          <div className="text-white font-semibold text-sm tracking-wide uppercase truncate">
            {title}
          </div>
          {subtitle && <div className="text-white/80 text-xs mt-0.5 truncate">{subtitle}</div>}
        </div>

        <div className="flex items-center gap-2">
          {right}
          <button
            type="button"
            onClick={() => setMax((v) => !v)}
            className="h-9 w-9 rounded-xl border border-white/25 text-white/95 hover:bg-white/10 grid place-items-center transition"
            aria-label={max ? "Minimize panel" : "Maximize panel"}
            title={max ? "Minimize" : "Maximize"}
          >
            {max ? <Minimize2Icon size={16} /> : <ExpandIcon size={16} />}
          </button>
        </div>
      </div>

      <div className="p-4 flex-1 min-h-0">{children}</div>
    </div>
  );

  if (!max) return body;

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px] p-3 sm:p-6">
      <div className="h-full w-full">{body}</div>
    </div>
  );
}

// ---------- KPI cards ----------
function KpiCard({
  label,
  value,
  hint,
  icon,
  tone = "indigo",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
  tone?: "indigo" | "teal" | "rose" | "slate";
}) {
  const ring =
    tone === "teal"
      ? "ring-teal-200/70 dark:ring-teal-900/40"
      : tone === "rose"
      ? "ring-rose-200/70 dark:ring-rose-900/40"
      : tone === "slate"
      ? "ring-slate-200/70 dark:ring-slate-800/70"
      : "ring-indigo-200/70 dark:ring-indigo-900/40";

  const badge =
    tone === "teal"
      ? "bg-teal-600 text-white"
      : tone === "rose"
      ? "bg-rose-600 text-white"
      : tone === "slate"
      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
      : "bg-indigo-600 text-white";

  return (
    <div
      className={cn(
        "rounded-2xl bg-white/95 dark:bg-slate-950/70 backdrop-blur border border-slate-200/80 dark:border-slate-800/80 shadow-lg shadow-slate-200/20 dark:shadow-slate-900/30",
        "p-5 ring-1",
        ring
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</div>
          <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
            {value}
          </div>
          {hint && <div className="mt-1 text-sm text-slate-700 dark:text-slate-400">{hint}</div>}
        </div>
        <div className={cn("h-12 w-12 rounded-2xl grid place-items-center shadow-sm", badge)}>{icon}</div>
      </div>
    </div>
  );
}

// ---------- Calendar (simple month grid) ----------
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function monthLabel(d: Date) {
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}
function toYmd(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type Holiday = { date: string; name: string; type: "Holiday" | "Event" | "Reminder" };

function HolidayCalendar({
  items,
}: {
  items: Holiday[];
}) {
  const today = new Date();
  const [cursor, setCursor] = useState<Date>(() => startOfMonth(new Date()));
  const first = startOfMonth(cursor);
  const last = endOfMonth(cursor);

  // Make 6 rows grid (like classic calendar)
  const startIdx = (first.getDay() + 6) % 7; // Monday=0
  const daysInMonth = last.getDate();
  const totalCells = 42;

  const map = useMemo(() => {
    const m = new Map<string, Holiday[]>();
    for (const h of items) {
      const arr = m.get(h.date) ?? [];
      arr.push(h);
      m.set(h.date, arr);
    }
    return m;
  }, [items]);

  const cells: Array<{ date: Date; inMonth: boolean }> = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startIdx + 1;
    const d = new Date(first.getFullYear(), first.getMonth(), dayNum);
    const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
    cells.push({ date: d, inMonth });
  }

  const dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarDaysIcon size={16} />
          {monthLabel(cursor)}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCursor(addMonths(cursor, -1))}
            className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 grid place-items-center transition"
            aria-label="Previous month"
          >
            <ChevronLeftIcon size={16} />
          </button>
          <button
            type="button"
            onClick={() => setCursor(startOfMonth(new Date()))}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition text-xs font-semibold"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setCursor(addMonths(cursor, +1))}
            className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 grid place-items-center transition"
            aria-label="Next month"
          >
            <ChevronRightIcon size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dow.map((d) => (
          <div key={d} className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1">
            {d}
          </div>
        ))}
        {cells.map(({ date, inMonth }, idx) => {
          const ymd = toYmd(date);
          const hits = map.get(ymd) ?? [];
          const isToday = sameDay(date, today);
          return (
            <div
              key={`${ymd}-${idx}`}
              className={cn(
                "rounded-xl border p-3 min-h-[80px] transition shadow-sm",
                inMonth
                  ? "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-slate-200/10 dark:shadow-slate-900/20"
                  : "border-slate-100 dark:border-slate-900 bg-slate-50/60 dark:bg-slate-900/20 opacity-70",
                isToday && "ring-2 ring-teal-400/60 dark:ring-teal-300/60"
              )}
            >
              <div className="flex items-center justify-between">
                <div className={cn("text-[11px] font-semibold", inMonth ? "text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400")}>
                  {date.getDate()}
                </div>
                {hits.length > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-950/35 dark:text-indigo-200 dark:border-indigo-900/40">
                    {hits.length}
                  </span>
                )}
              </div>

              <div className="mt-1 space-y-1">
                {hits.slice(0, 2).map((h, i) => (
                  <div
                    key={i}
                    className={cn(
                      "text-[10px] px-2 py-1 rounded-lg border truncate",
                      h.type === "Holiday"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/35 dark:text-emerald-200 dark:border-emerald-900/40"
                        : h.type === "Event"
                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/35 dark:text-amber-200 dark:border-amber-900/40"
                        : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-200 dark:border-slate-800"
                    )}
                    title={h.name}
                  >
                    {h.name}
                  </div>
                ))}
                {hits.length > 2 && (
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 px-1">
                    +{hits.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/25 p-4">
        <div className="text-xs text-slate-600 dark:text-slate-300">
          Tip: Use this for academic events, exam windows, fee due reminders, placement drives.
        </div>
      </div>
    </div>
  );
}

// ---------- Notifications list (admin) ----------
type AdminNotif = {
  id: string;
  when: string;
  title: string;
  desc: string;
  severity: "INFO" | "SUCCESS" | "WARNING" | "DANGER";
};

function NotifDot({ s }: { s: AdminNotif["severity"] }) {
  const cls =
    s === "SUCCESS"
      ? "bg-emerald-500"
      : s === "WARNING"
      ? "bg-amber-500"
      : s === "DANGER"
      ? "bg-rose-500"
      : "bg-sky-500";
  return <span className={cn("h-2.5 w-2.5 rounded-full", cls)} />;
}

function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- Main Admin Dashboard ----------
export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<any>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [notifs, setNotifs] = useState<AdminNotif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      // Fetch KPIs
      const kpisRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost/smart_campus_api"}/api/admin/dashboard`, { headers });
      if (!kpisRes.ok) {
        if (kpisRes.status === 401) throw new Error("Session expired. Please log in again.");
        throw new Error("Failed to load KPIs");
      }
      const kpisData = await kpisRes.json();
      const counts = kpisData.counts || {};

      const kpisMapped = {
        totalUsers: counts.users || 0,
        activeStudents: 0, // Not directly available, can be calculated or added to API
        activeFaculty: 0, // Same
        rooms: counts.classrooms || 0,
        pendingRoomReq: counts.room_requests || 0,
        pendingExamSessions: counts.exam_sessions || 0,
        feeDueCount: counts.fees_accounts || 0, // Assuming this maps to fee accounts
        paymentIssues: 0, // Not available, can be added
        notificationsUnread: counts.admin_notifications || 0,
      };

      // Fetch Notifications
      const notifsRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost/smart_campus_api"}/api/admin/notifications`, { headers });
      if (!notifsRes.ok) {
        if (notifsRes.status === 401) throw new Error("Session expired. Please log in again.");
        throw new Error("Failed to load notifications");
      }
      const notifsData = await notifsRes.json();
      const notifsMapped: AdminNotif[] = (notifsData.notifications || []).map((n: any) => ({
        id: n.id,
        when: n.created_at, // API returns created_at as ISO string
        title: n.title,
        desc: n.message,
        severity: n.severity,
      }));

      setKpis(kpisMapped);
      setHolidays([]); // Production: No dummy holidays, can be populated from events table if added
      setNotifs(notifsMapped);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const exportNotifs = () => {
    const text = notifs
      .map((n) => `${n.when} [${n.severity}] ${n.title} — ${n.desc}`)
      .join("\n");
    downloadTextFile("admin_dashboard_notifications.txt", text);
  };

  const refreshDashboard = () => {
    fetchDashboardData();
  };

  if (error) {
    const isSessionExpired = error.includes("Session expired");
    return (
      <div className="w-full space-y-4">
        <div className="text-center p-8">
          <div className="text-lg font-semibold text-red-600 dark:text-red-400">
            Error loading dashboard
          </div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {error}
          </div>
          <div className="mt-4 flex gap-2 justify-center">
            {!isSessionExpired && (
              <button
                onClick={fetchDashboardData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Retry
              </button>
            )}
            {isSessionExpired && (
              <button
                onClick={() => {
                  clearAuth();
                  navigate("/login");
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Log In Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading || !kpis) {
    return (
      <div className="w-full space-y-4">
        <div className="text-center p-8">
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Loading Dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <div className="text-[28px] font-light text-slate-900 dark:text-slate-50 leading-none">
            Admin Dashboard
          </div>
          <div className="mt-1 text-base text-slate-600 dark:text-slate-300">
            Campus-wide snapshot for users, classrooms, exams, fees, placements and alerts.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={refreshDashboard}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-100"
          >
            <RefreshCwIcon size={16} />
            Refresh
          </button>

          <button
            type="button"
            onClick={exportNotifs}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
          >
            <DownloadIcon size={16} />
            Download Report
          </button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard
          label="Total Users"
          value={kpis.totalUsers}
          hint="Students + Faculty"
          icon={<UsersIcon size={18} />}
          tone="slate"
        />
        <KpiCard
          label="Active Students"
          value={kpis.activeStudents}
          hint="Currently enrolled"
          icon={<GraduationCapIcon size={18} />}
          tone="indigo"
        />
        <KpiCard
          label="Active Faculty"
          value={kpis.activeFaculty}
          hint="Teaching staff"
          icon={<ShieldCheckIcon size={18} />}
          tone="teal"
        />
        <KpiCard
          label="Classrooms"
          value={kpis.rooms}
          hint="Available rooms in DB"
          icon={<Building2Icon size={18} />}
          tone="indigo"
        />
      </div>

      {/* Operations Queue and Admin Notifications side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel
          title="Operations Queue"
          subtitle="Quick admin actions"
          tone="indigo"
          right={
            <span className="text-[11px] font-semibold px-2 py-1 rounded-xl border border-white/30 text-white/95">
              Live Data
            </span>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              title: "Pending Room Requests",
              value: kpis.pendingRoomReq,
              icon: <Building2Icon size={16} />,
              hint: "Classroom allocation queue",
              path: "/admin/classrooms",
            },
            {
              title: "Pending Exam Sessions",
              value: kpis.pendingExamSessions,
              icon: <CalendarDaysIcon size={16} />,
              hint: "Sessions awaiting scheduling",
              path: "/admin/exams",
            },
            {
              title: "Fee Accounts",
              value: kpis.feeDueCount,
              icon: <WalletIcon size={16} />,
              hint: "Student fee accounts",
              path: "/admin/fees",
            },
            {
              title: "Placement Drives",
              value: kpis.placementDrives || 0,
              icon: <UsersIcon size={16} />,
              hint: "Active placement drives",
              path: "/admin/placements",
            },
          ].map((x) => (
            <div
              key={x.title}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-lg shadow-slate-200/20 dark:shadow-slate-900/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {x.title}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {x.hint}
                  </div>
                </div>
                <div className="h-9 w-9 rounded-2xl bg-teal-600 text-white grid place-items-center shadow-sm">
                  {x.icon}
                </div>
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div className="text-3xl font-semibold tabular-nums text-slate-900 dark:text-white">
                  {x.value}
                </div>
                <button
                  type="button"
                  onClick={() => navigate(x.path)}
                  className="h-9 px-3 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-100 transition"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Admin Notifications */}
        <Panel
          title="Admin Notifications"
          subtitle="System + agents + operations"
          tone="rose"
          right={
            <span className="text-[11px] font-semibold px-2 py-1 rounded-xl border border-white/30 text-white/95">
              Unread: {kpis.notificationsUnread}
            </span>
          }
        >
          <div className="space-y-3">
            {notifs.map((n) => (
              <div
                key={n.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-lg shadow-slate-200/20 dark:shadow-slate-900/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <NotifDot s={n.severity} />
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {n.title}
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      {n.desc}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                      {n.when}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setNotifs((prev) => prev.filter((x) => x.id !== n.id))}
                    className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 grid place-items-center transition"
                    aria-label="Dismiss"
                    title="Dismiss"
                  >
                    <BellIcon size={16} />
                  </button>
                </div>
              </div>
            ))}

            {notifs.length === 0 && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/25 p-8 text-center">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  All caught up
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  No new notifications.
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={exportNotifs}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                <DownloadIcon size={16} />
                Download
              </button>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default AdminDashboard;
