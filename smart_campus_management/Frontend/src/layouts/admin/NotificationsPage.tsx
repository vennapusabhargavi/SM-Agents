// src/layouts/admin/notifications/AdminNotificationsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  BellIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  InfoIcon,
  SearchIcon,
  DownloadIcon,
  Trash2Icon,
  XIcon,
  EyeIcon,
  ArchiveIcon,
} from "lucide-react";

type NotifSeverity = "INFO" | "SUCCESS" | "WARNING" | "DANGER";
type NotifChannel = "IN_APP" | "EMAIL" | "SMS" | "WHATSAPP";
type NotifStatus = "UNREAD" | "READ" | "ARCHIVED";

type AdminNotification = {
  id: string;
  createdAt: string; // ISO
  severity: NotifSeverity;
  channel: NotifChannel;
  status: NotifStatus;
  title: string;
  message: string;
  entityType?: string; // e.g., FEE, EXAM, CLASSROOM, PLACEMENT
  entityId?: string; // id/reference
  actor?: string; // system/user
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost/smart_campus_api";
const ADMIN_API = `${API_BASE}/api/admin`;

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("authToken");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${ADMIN_API}${path}`, {
    ...init,
    headers: { ...getAuthHeaders(), ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || res.statusText);
  }
  return (await res.json()) as T;
}




function fmtDt(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}



// CSV export
function downloadCsv(filename: string, rows: Array<Record<string, any>>) {
  const headers = Object.keys(rows[0] ?? {});
  const escape = (v: any) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const csv =
    [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Premium bits
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
      ? "bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600"
      : tone === "indigo"
      ? "bg-gradient-to-r from-indigo-700 via-indigo-600 to-sky-600"
      : "bg-gradient-to-r from-rose-600 via-red-500 to-orange-500";

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div className={cn(header, "px-4 py-3 flex items-center justify-between")}>
        <div className="flex items-center gap-2">
          {icon}
          <div className="text-white font-medium text-sm">
            {title}
          </div>
        </div>
        <div className="flex items-center gap-2">{right}</div>
      </div>
      <div className="p-4">{children}</div>
    </div>
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

function GhostBtn({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition",
        "border border-slate-200 bg-white hover:bg-slate-50 text-slate-800",
        "dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-100"
      )}
    >
      {children}
    </button>
  );
}

function PrimaryBtn({
  onClick,
  disabled,
  children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition active:scale-[0.99]",
        "bg-slate-900 text-white hover:bg-slate-800",
        "dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200",
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
        <div className="w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden">
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

function SeverityPill({ s }: { s: NotifSeverity }) {
  const base = "inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-semibold border";
  const cls =
    s === "SUCCESS"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/35 dark:text-emerald-200 dark:border-emerald-900/40"
      : s === "WARNING"
      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/35 dark:text-amber-200 dark:border-amber-900/40"
      : s === "DANGER"
      ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/35 dark:text-rose-200 dark:border-rose-900/40"
      : "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/35 dark:text-sky-200 dark:border-sky-900/40";
  return <span className={cn(base, cls)}>{s}</span>;
}

function StatusPill({ s }: { s: NotifStatus }) {
  const base = "inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-semibold border";
  const cls =
    s === "UNREAD"
      ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/35 dark:text-indigo-200 dark:border-indigo-900/40"
      : s === "READ"
      ? "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-200 dark:border-slate-800"
      : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/35 dark:text-emerald-200 dark:border-emerald-900/40";
  return <span className={cn(base, cls)}>{s}</span>;
}

function severityIcon(sev: NotifSeverity) {
  const cls = "text-slate-700 dark:text-slate-100";
  if (sev === "SUCCESS") return <CheckCircle2Icon size={16} className={cls} />;
  if (sev === "WARNING") return <AlertTriangleIcon size={16} className={cls} />;
  if (sev === "DANGER") return <AlertTriangleIcon size={16} className={cn(cls, "text-rose-600 dark:text-rose-300")} />;
  return <InfoIcon size={16} className={cls} />;
}

export const AdminNotificationsPage: React.FC = () => {

  const [items, setItems] = useState<AdminNotification[]>([]);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const data = await apiJson<{ ok: boolean; notifications: AdminNotification[] }>("/notifications");
        if (live) setItems(data.notifications || []);
      } catch {
        // ignore fetch errors; UI will show empty
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const [q, setQ] = useState("");

  const [detail, setDetail] = useState<AdminNotification | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const base = q.trim().toLowerCase();

  const filtered = useMemo(() => {
    return items
      .filter((n) => {
        if (!base) return true;
        return (
          n.title.toLowerCase().includes(base) ||
          n.message.toLowerCase().includes(base) ||
          (n.entityType ?? "").toLowerCase().includes(base) ||
          (n.entityId ?? "").toLowerCase().includes(base) ||
          (n.actor ?? "").toLowerCase().includes(base)
        );
      })
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [items, base]);

  const counts = useMemo(() => {
    const unread = items.filter((i) => i.status === "UNREAD").length;
    const read = items.filter((i) => i.status === "READ").length;
    const archived = items.filter((i) => i.status === "ARCHIVED").length;
    return { unread, read, archived, total: items.length };
  }, [items]);

  const markAllRead = async () => {
    try {
      await apiJson("/notifications/mark-all-read", { method: "POST" });
      setItems((prev) => prev.map((n) => (n.status === "UNREAD" ? { ...n, status: "READ" } : n)));
    } catch {
      // ignore
    }
  };

  const clearAll = async () => {
    try {
      await apiJson("/notifications/clear", { method: "POST" });
      setItems([]);
      setConfirmClear(false);
    } catch {
      // ignore
    }
  };

  const action = async (id: string, op: "READ" | "UNREAD" | "ARCHIVE" | "DELETE") => {
    try {
      if (op === "DELETE") {
        await apiJson(`/notifications/${encodeURIComponent(id)}`, { method: "DELETE" });
        setItems((prev) => prev.filter((n) => n.id !== id));
        return;
      }
      const nextStatus = op === "ARCHIVE" ? "ARCHIVED" : op;
      await apiJson(`/notifications/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus }),
      });
      setItems((prev) =>
        prev.map((n) => {
          if (n.id !== id) return n;
          return { ...n, status: nextStatus as NotifStatus };
        })
      );
    } catch {
      // ignore
    }
  };

  const exportCurrent = () => {
    downloadCsv(
      "admin_notifications.csv",
      filtered.map((n) => ({
        created_at: n.createdAt,
        severity: n.severity,
        channel: n.channel,
        status: n.status,
        title: n.title,
        message: n.message,
        entity_type: n.entityType ?? "",
        entity_id: n.entityId ?? "",
        actor: n.actor ?? "",
      }))
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* Title */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[28px] font-light text-slate-900 dark:text-slate-50 leading-none">
            Notifications
          </div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Admin inbox for system + agent alerts.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostBtn onClick={exportCurrent}>
            <DownloadIcon size={16} />
            Export CSV
          </GhostBtn>
          <PrimaryBtn onClick={markAllRead} disabled={counts.unread === 0}>
            <CheckCircle2Icon size={16} />
            Mark all read
          </PrimaryBtn>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: counts.total, tone: "bg-slate-900 text-white dark:bg-white dark:text-slate-900" },
          { label: "Unread", value: counts.unread, tone: "bg-indigo-600 text-white" },
          { label: "Read", value: counts.read, tone: "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100" },
          { label: "Archived", value: counts.archived, tone: "bg-emerald-600 text-white" },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400">{c.label}</div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-2xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
                {c.value}
              </div>
              <span className={cn("px-3 py-1 rounded-xl text-xs font-semibold", c.tone)}>{c.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Panel
        title="ADMIN INBOX"
        tone="indigo"
        icon={<BellIcon size={16} className="text-white/95" />}
        right={
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[11px] font-semibold px-2 py-1 rounded-xl border border-white/30 text-white/95">
              Rows: {filtered.length}
            </span>
            <GhostBtn onClick={() => setConfirmClear(true)}>
              <Trash2Icon size={14} />
              Clear all
            </GhostBtn>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="relative">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, message, entity, actor…" className="pl-9" />
          </div>

          {/* List */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[1200px] w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                    {["When", "Status", "Title", "Entity", "Actor", "Actions"].map((h) => (
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
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                        No notifications found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((n, idx) => (
                      <tr
                        key={n.id}
                        className={cn(
                          idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/20",
                          "border-b border-slate-200/70 dark:border-slate-800/70",
                          n.status === "UNREAD" && "ring-1 ring-inset ring-indigo-200/70 dark:ring-indigo-900/40"
                        )}
                      >
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                          {fmtDt(n.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill s={n.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{n.title}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-1">
                            {n.message}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                          {(n.entityType ?? "—") + (n.entityId ? ` • ${n.entityId}` : "")}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{n.actor ?? "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setDetail(n)}
                              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 grid place-items-center transition"
                              aria-label="View"
                              title="View"
                            >
                              <EyeIcon size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => action(n.id, "DELETE")}
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

      {/* Detail */}
      <Modal
        open={!!detail}
        title={detail?.title ?? "Notification"}
        subtitle={detail ? `Created: ${fmtDt(detail.createdAt)} • ${detail.channel}` : undefined}
        onClose={() => setDetail(null)}
      >
        {detail && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/25 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityPill s={detail.severity} />
                <StatusPill s={detail.status} />
                <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-semibold border bg-white border-slate-200 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200">
                  {detail.channel}
                </span>
                {detail.entityType && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-semibold border bg-white border-slate-200 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200">
                    {detail.entityType}
                    {detail.entityId ? ` • ${detail.entityId}` : ""}
                  </span>
                )}
                {detail.actor && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-semibold border bg-white border-slate-200 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200">
                    Actor: {detail.actor}
                  </span>
                )}
              </div>

              <div className="mt-3 text-sm text-slate-900 dark:text-slate-50 whitespace-pre-wrap">
                {detail.message}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {detail.status !== "READ" && (
                <GhostBtn
                  onClick={() => {
                    action(detail.id, "READ");
                    setDetail((d) => (d ? { ...d, status: "READ" } : d));
                  }}
                >
                  <CheckCircle2Icon size={16} />
                  Mark read
                </GhostBtn>
              )}

              {detail.status !== "ARCHIVED" && (
                <GhostBtn
                  onClick={() => {
                    action(detail.id, "ARCHIVE");
                    setDetail((d) => (d ? { ...d, status: "ARCHIVED" } : d));
                  }}
                >
                  <ArchiveIcon size={16} />
                  Archive
                </GhostBtn>
              )}

              <button
                type="button"
                onClick={() => {
                  action(detail.id, "DELETE");
                  setDetail(null);
                }}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition bg-rose-600 text-white hover:bg-rose-700"
              >
                <Trash2Icon size={16} />
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Clear all confirm */}
      <Modal
        open={confirmClear}
        title="Clear all notifications?"
        subtitle="This removes all admin notifications from the database."
        onClose={() => setConfirmClear(false)}
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/25 p-4">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Are you sure?
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <GhostBtn onClick={() => setConfirmClear(false)}>
              <XIcon size={16} />
              Cancel
            </GhostBtn>
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition bg-rose-600 text-white hover:bg-rose-700"
            >
              <Trash2Icon size={16} />
              Clear all
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminNotificationsPage;
