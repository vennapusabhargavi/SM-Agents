// src/layouts/student/infra/MyIssue.tsx
import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2Icon, Clock3Icon, SearchIcon } from "lucide-react";

type TabKey = "Inprogress" | "Closed";

type IssueRow = {
  id: string;
  issueNo: string;
  title: string;
  category: "Electrical" | "Network" | "Classroom" | "Hostel" | "Other";
  location: string;
  raisedOn: string; // DD/MM/YYYY
  status: TabKey;
  assignee?: string;
  lastUpdatedOn?: string; // DD/MM/YYYY
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function matches(row: IssueRow, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return (
    row.issueNo.toLowerCase().includes(s) ||
    row.title.toLowerCase().includes(s) ||
    row.category.toLowerCase().includes(s) ||
    row.location.toLowerCase().includes(s) ||
    row.raisedOn.toLowerCase().includes(s) ||
    (row.assignee || "").toLowerCase().includes(s)
  );
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return { total, slice: items.slice(start, end), start, end: Math.min(end, total) };
}

// ---------- simple “arms-like” tab chip ----------
function TabChip({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition ring-1",
        "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
        "dark:bg-slate-950 dark:text-slate-200 dark:ring-slate-800 dark:hover:bg-slate-900",
        active && "ring-2 ring-blue-400/70 dark:ring-blue-300/60"
      )}
    >
      <span className={cn("opacity-90", active && "opacity-100")}>{icon}</span>
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-[0_12px_40px_-26px_rgba(0,0,0,0.35)] overflow-hidden">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-[12px] font-semibold text-slate-600 dark:text-slate-300",
        "bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800",
        "sticky top-0 z-10",
        className
      )}
    >
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
        "px-4 py-3 text-sm text-slate-800 dark:text-slate-100 border-b border-slate-200/70 dark:border-slate-800/70",
        className
      )}
    >
      {children}
    </td>
  );
}

function StatusBadge({ status }: { status: TabKey }) {
  // Professional: no loud icons — clean pill.
  const cls =
    status === "Inprogress"
      ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200 ring-amber-200 dark:ring-amber-500/20"
      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200 ring-emerald-200 dark:ring-emerald-500/20";
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-semibold ring-1", cls)}>
      {status === "Inprogress" ? "Inprogress" : "Closed"}
    </span>
  );
}

export default function MyIssue() {
  // demo seed (wire to API later)
  const seed: IssueRow[] = useMemo(
    () => [
      {
        id: "i1",
        issueNo: "ISS-10231",
        title: "Projector not working in Seminar Hall",
        category: "Classroom",
        location: "Block A • Seminar Hall 2",
        raisedOn: "14/12/2025",
        status: "Inprogress",
        assignee: "Infra Team",
        lastUpdatedOn: "15/12/2025",
      },
      {
        id: "i2",
        issueNo: "ISS-10219",
        title: "Wi-Fi intermittent in Library",
        category: "Network",
        location: "Central Library • 2nd Floor",
        raisedOn: "05/12/2025",
        status: "Inprogress",
        assignee: "Network Team",
        lastUpdatedOn: "08/12/2025",
      },
      {
        id: "i3",
        issueNo: "ISS-10177",
        title: "Tube light replaced",
        category: "Electrical",
        location: "Hostel • Room 312",
        raisedOn: "21/11/2025",
        status: "Closed",
        assignee: "Maintenance",
        lastUpdatedOn: "22/11/2025",
      },
    ],
    []
  );

  const [rows] = useState<IssueRow[]>(seed);
  const [tab, setTab] = useState<TabKey>("Inprogress");

  const [q, setQ] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return rows.filter((r) => r.status === tab).filter((r) => matches(r, q));
  }, [rows, tab, q]);

  const { total, slice, start, end } = useMemo(
    () => paginate(filtered, page, pageSize),
    [filtered, page, pageSize]
  );

  useEffect(() => {
    setPage(1);
  }, [tab, q, pageSize]);

  const showingText =
    total === 0 ? "Showing 0 to 0 of 0 entries" : `Showing ${start + 1} to ${end} of ${total} entries`;

  return (
    <div className="w-full p-4 md:p-6 space-y-4">
      {/* Title */}
      <div className="text-[28px] font-light text-slate-700 dark:text-slate-100 leading-none">
        View Issue
      </div>

      {/* Tabs (like screenshot) */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <TabChip
            active={tab === "Inprogress"}
            onClick={() => setTab("Inprogress")}
            icon={<Clock3Icon size={16} />}
          >
            Inprogress
          </TabChip>
          <TabChip
            active={tab === "Closed"}
            onClick={() => setTab("Closed")}
            icon={<CheckCircle2Icon size={16} />}
          >
            Closed
          </TabChip>
        </div>
      </div>

      {/* subtitle line from screenshot */}
      <div className="text-sm text-slate-700 dark:text-slate-200">
        UnAssigned,Assigned and Completed Issues
      </div>

      {/* Filter row (records + search) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className={cn(
              "h-10 rounded-xl px-3 text-sm",
              "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
              "ring-1 ring-slate-200 dark:ring-slate-800",
              "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 dark:focus:ring-indigo-300/60",
              "transition"
            )}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <div className="text-sm text-slate-600 dark:text-slate-300">records</div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <div className="text-sm text-slate-600 dark:text-slate-300">Search:</div>
          <div className="relative">
            <SearchIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder=""
              className={cn(
                "h-10 w-[220px] rounded-xl pl-9 pr-3 text-sm",
                "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
                "ring-1 ring-slate-200 dark:ring-slate-800",
                "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 dark:focus:ring-indigo-300/60",
                "transition"
              )}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <TableShell>
        <table className="min-w-[1100px] w-full">
          <thead>
            <tr>
              <Th className="w-[140px]">Issue No.</Th>
              <Th className="min-w-[320px]">Title</Th>
              <Th className="w-[170px]">Category</Th>
              <Th className="min-w-[260px]">Location</Th>
              <Th className="w-[160px]">Raised On</Th>
              <Th className="w-[220px]">Assignee</Th>
              <Th className="w-[160px]">Last Updated</Th>
              <Th className="w-[120px]">Status</Th>
            </tr>
          </thead>

          <tbody>
            {slice.length === 0 ? (
              <tr>
                <Td className="py-10 text-center text-slate-500 dark:text-slate-400" colSpan={8}>
                  No data available in table
                </Td>
              </tr>
            ) : (
              slice.map((r, idx) => (
                <tr
                  key={r.id}
                  className={cn(
                    idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/20"
                  )}
                >
                  <Td className="font-semibold tabular-nums">{r.issueNo}</Td>
                  <Td className="min-w-0">
                    <div className="font-medium text-slate-900 dark:text-slate-50">{r.title}</div>
                  </Td>
                  <Td>{r.category}</Td>
                  <Td>{r.location}</Td>
                  <Td className="tabular-nums">{r.raisedOn}</Td>
                  <Td>{r.assignee || "-"}</Td>
                  <Td className="tabular-nums">{r.lastUpdatedOn || "-"}</Td>
                  <Td>
                    <StatusBadge status={r.status} />
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableShell>

      {/* Footer text like datatable */}
      <div className="text-sm text-slate-600 dark:text-slate-300">{showingText}</div>
    </div>
  );
}
