// src/layouts/teacher/OdApproval.tsx
import React, { useMemo, useState, useEffect } from "react";
import {
  CheckCircle2Icon,
  XCircleIcon,
  Clock3Icon,
  SearchIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
} from "lucide-react";

type TabKey = "pending" | "approved" | "rejected";

type OdRow = {
  id: string;
  regNo: string;
  studentName: string;
  courseCode: string;
  courseName: string;
  startDate: string; // dd/mm/yyyy
  endDate: string; // dd/mm/yyyy
  requestedOn: string; // dd/mm/yyyy
  status: TabKey;
};

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function PageTitle({ title }: { title: string }) {
  return (
    <div className="mb-2">
      <div className="text-[32px] font-light text-slate-700 dark:text-slate-100 leading-none">
        {title}
      </div>
    </div>
  );
}

function SegTab({
  active,
  label,
  onClick,
  icon,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-xl transition",
        "text-[13px] font-semibold",
        active
          ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-800"
          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-900/50"
      )}
    >
      <span className={cn("opacity-90", active && "text-teal-700 dark:text-teal-300")}>
        {icon}
      </span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-[12px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        "px-4 py-3 text-[13px] text-slate-700 dark:text-slate-200 border-b border-slate-200/80 dark:border-slate-800 align-top",
        className
      )}
    >
      {children}
    </td>
  );
}

function Chip({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "warn" | "success" | "danger";
  children: React.ReactNode;
}) {
  const map = {
    neutral:
      "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-900/60 dark:text-slate-200 dark:ring-slate-800",
    warn:
      "bg-amber-100 text-amber-900 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900/40",
    success:
      "bg-emerald-100 text-emerald-900 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-900/40",
    danger:
      "bg-rose-100 text-rose-900 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-200 dark:ring-rose-900/40",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1",
        map[tone]
      )}
    >
      {children}
    </span>
  );
}

function ApproveButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={!!disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 h-8 px-3 rounded-lg",
        "bg-sky-500 hover:bg-sky-600 active:bg-sky-700",
        "text-white text-[12px] font-semibold",
        "shadow-sm transition",
        "disabled:opacity-60 disabled:cursor-not-allowed"
      )}
      title="Approve"
    >
      <CheckIcon size={14} />
      Approve
    </button>
  );
}

function GhostButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl",
        "text-[13px] font-semibold",
        "border border-slate-200 dark:border-slate-800",
        "bg-white dark:bg-slate-900",
        "text-slate-800 dark:text-slate-100",
        "hover:bg-slate-50 dark:hover:bg-slate-800/60",
        "shadow-sm transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40"
      )}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  tone = "teal",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "teal" | "rose";
}) {
  const cls =
    tone === "teal"
      ? "bg-teal-600 hover:bg-teal-700 active:bg-teal-800 focus-visible:ring-teal-400/50"
      : "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-rose-400/50";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!!disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl",
        "text-[13px] font-semibold text-white",
        cls,
        "shadow-sm hover:shadow-md transition",
        "focus:outline-none focus-visible:ring-2",
        "disabled:opacity-60 disabled:cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

function Toast({
  kind,
  msg,
  onClose,
}: {
  kind: "success" | "error";
  msg: string;
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-3 text-sm flex items-center gap-2",
        kind === "success"
          ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-300"
          : "border-rose-600/30 bg-rose-600/10 text-rose-700 dark:text-rose-300"
      )}
    >
      {kind === "success" ? <CheckCircle2Icon size={18} /> : <XCircleIcon size={18} />}
      <div className="flex-1">{msg}</div>
      <button
        type="button"
        onClick={onClose}
        className="h-8 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 transition text-xs font-semibold"
      >
        Close
      </button>
    </div>
  );
}

function fmtShowing(page: number, pageSize: number, total: number) {
  if (total === 0) return `Showing 0 to 0 of 0 entries`;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  return `Showing ${start} to ${end} of ${total} entries`;
}

function Pager({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  const pages = useMemo(() => {
    const out: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  }, [page, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
      <button
        type="button"
        onClick={() => onPage(Math.max(1, page - 1))}
        className="h-9 w-10 grid place-items-center hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-60"
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeftIcon size={16} />
      </button>

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPage(p)}
          className={cn(
            "h-9 w-10 grid place-items-center text-sm transition border-l border-slate-200 dark:border-slate-800",
            p === page
              ? "bg-slate-100 dark:bg-slate-800 font-semibold"
              : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
          )}
          aria-current={p === page ? "page" : undefined}
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPage(Math.min(totalPages, page + 1))}
        className="h-9 w-10 grid place-items-center hover:bg-slate-50 dark:hover:bg-slate-800 transition border-l border-slate-200 dark:border-slate-800 disabled:opacity-60"
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <ChevronRightIcon size={16} />
      </button>
    </div>
  );
}

export default function OdApproval() {
  const [rows, setRows] = useState<OdRow[]>([]);

  useEffect(() => {
    const fetchODRequests = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch("/api/teacher/od-requests", { headers });
        if (res.ok) {
          const data = await res.json();
          setRows(data.odRequests || []);
        }
      } catch (err) {
        console.error("Failed to fetch OD requests", err);
      }
    };
    fetchODRequests();
  }, []);

  const [tab, setTab] = useState<TabKey>("pending");
  const [q, setQ] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ kind: "success" | "error"; msg: string } | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter((r) => r.status === tab)
      .filter((r) => {
        if (!needle) return true;
        const hay =
          `${r.regNo} ${r.studentName} ${r.courseCode} ${r.courseName} ${r.startDate} ${r.endDate} ${r.requestedOn}`.toLowerCase();
        return hay.includes(needle);
      });
  }, [rows, tab, q]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageSafe = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageSafe, pageSize]);

  const onTab = (t: TabKey) => {
    setTab(t);
    setPage(1);
    setToast(null);
  };

  const approve = async (id: string) => {
    try {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`/api/teacher/od-requests/${id}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) {
        const updatedRows = rows.map((r) => (r.id === id ? { ...r, status: "approved" as TabKey } : r));
        setRows(updatedRows);
        // Update approved OD data for integration with attendance marking
        const approvedODs = updatedRows.filter((r) => r.status === "approved");
        localStorage.setItem("approvedODs", JSON.stringify(approvedODs));
        setToast({ kind: "success", msg: "OD approved successfully." });
      } else {
        setToast({ kind: "error", msg: "Failed to approve OD." });
      }
    } catch (err) {
      console.error("Failed to approve OD", err);
      setToast({ kind: "error", msg: "Failed to approve OD." });
    }
  };

  const reject = async (id: string) => {
    try {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`/api/teacher/od-requests/${id}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "reject" }),
      });
      if (res.ok) {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)));
        setToast({ kind: "success", msg: "OD rejected." });
      } else {
        setToast({ kind: "error", msg: "Failed to reject OD." });
      }
    } catch (err) {
      console.error("Failed to reject OD", err);
      setToast({ kind: "error", msg: "Failed to reject OD." });
    }
  };

  const tabMeta = useMemo(() => {
    const cPending = rows.filter((r) => r.status === "pending").length;
    const cApproved = rows.filter((r) => r.status === "approved").length;
    const cRejected = rows.filter((r) => r.status === "rejected").length;
    return { cPending, cApproved, cRejected };
  }, [rows]);

  return (
    <div className="w-full p-4 md:p-6 space-y-4">
      <PageTitle title="OD Approval" />

      {/* tabs row (no card background) */}
      <div className="flex flex-wrap gap-2 items-center">
        <SegTab
          active={tab === "pending"}
          label={`Pending`}
          icon={<Clock3Icon size={16} />}
          onClick={() => onTab("pending")}
        />
        <SegTab
          active={tab === "approved"}
          label={`Approved`}
          icon={<CheckCircle2Icon size={16} />}
          onClick={() => onTab("approved")}
        />
        <SegTab
          active={tab === "rejected"}
          label={`Rejected`}
          icon={<XCircleIcon size={16} />}
          onClick={() => onTab("rejected")}
        />

        <div className="ml-auto hidden sm:flex items-center gap-2">
          <Chip tone="warn">{tabMeta.cPending} pending</Chip>
          <Chip tone="success">{tabMeta.cApproved} approved</Chip>
          <Chip tone="danger">{tabMeta.cRejected} rejected</Chip>
        </div>
      </div>

      {/* sub heading like screenshot */}
      <div className="text-[13px] text-slate-700 dark:text-slate-200">
        <span className="font-semibold">
          {tab === "pending"
            ? "Pending OD Approval"
            : tab === "approved"
            ? "Approved OD"
            : "Rejected OD"}
        </span>{" "}
        <span className="text-slate-500 dark:text-slate-400">
          for {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </span>
      </div>

      {/* controls row: page size + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className={cn(
                "h-10 rounded-xl px-3 pr-9 text-[13px]",
                "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100",
                "border border-slate-300/80 dark:border-slate-700",
                "shadow-inner",
                "focus:outline-none focus:ring-2 focus:ring-slate-400/30 dark:focus:ring-slate-500/30",
                "transition"
              )}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <ChevronDownIcon
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
          <div className="text-[13px] text-slate-700 dark:text-slate-200">records</div>
        </div>

        <div className="sm:ml-auto flex items-center gap-2">
          <div className="text-[13px] text-slate-700 dark:text-slate-200">Search:</div>
          <div className="relative w-full sm:w-[260px]">
            <SearchIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder=""
              className={cn(
                "w-full h-10 rounded-xl pl-9 pr-3 text-[13px]",
                "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100",
                "border border-slate-300/80 dark:border-slate-700",
                "shadow-inner",
                "focus:outline-none focus:ring-2 focus:ring-slate-400/30 dark:focus:ring-slate-500/30",
                "transition"
              )}
            />
          </div>
        </div>
      </div>

      {/* table */}
      <TableShell>
        <table className="min-w-[1180px] w-full border-collapse">
          <thead>
            <tr>
              <Th>RegNo.</Th>
              <Th>Student Name</Th>
              <Th>Course Code</Th>
              <Th>Course Name</Th>
              <Th>Start date</Th>
              <Th>End date</Th>
              <Th>Requested On</Th>
              <Th>{tab === "pending" ? "Approve" : "Status"}</Th>
            </tr>
          </thead>

          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <Td colSpan={8 as any} className="py-10 text-center text-slate-500 dark:text-slate-400">
                  No data available in table
                </Td>
              </tr>
            ) : (
              pageRows.map((r, idx) => (
                <tr
                  key={r.id}
                  className={cn(
                    idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/60 dark:bg-slate-900/60",
                    "hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
                  )}
                >
                  <Td className="tabular-nums">{r.regNo}</Td>
                  <Td className="font-semibold text-slate-900 dark:text-white">{r.studentName}</Td>
                  <Td className="font-semibold text-slate-900 dark:text-white">{r.courseCode}</Td>
                  <Td>{r.courseName}</Td>
                  <Td className="tabular-nums">{r.startDate}</Td>
                  <Td className="tabular-nums">{r.endDate}</Td>
                  <Td className="tabular-nums">{r.requestedOn}</Td>
                  <Td>
                    {tab === "pending" ? (
                      <div className="flex items-center gap-2">
                        <ApproveButton onClick={() => approve(r.id)} />
                        <PrimaryButton tone="rose" onClick={() => reject(r.id)}>
                          Reject
                        </PrimaryButton>
                      </div>
                    ) : r.status === "approved" ? (
                      <Chip tone="success">Approved</Chip>
                    ) : (
                      <Chip tone="danger">Rejected</Chip>
                    )}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableShell>

      {/* footer: showing + pager */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="text-[13px] text-slate-700 dark:text-slate-200">
          {fmtShowing(pageSafe, pageSize, total)}
        </div>

        <div className="sm:ml-auto">
          <Pager page={pageSafe} totalPages={totalPages} onPage={setPage} />
        </div>
      </div>

      {toast && (
        <div className="pt-2">
          <Toast kind={toast.kind} msg={toast.msg} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
}
