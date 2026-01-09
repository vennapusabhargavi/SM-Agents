// src/layouts/faculty/NoDueApproval.tsx
import React, { useMemo, useState, useEffect } from "react";
import {
  ChevronDownIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";

type NoDueRow = {
  id: string;
  sno: number;
  regNo: string;
  studentName: string;
  courseCode: string;
  courseName: string;
  program: string;
  year: string;
  requestedOn: string; // dd/mm/yyyy
  status: "Pending" | "Approved" | "Rejected";
};

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function PageTitle({ title }: { title: string }) {
  return (
    <div className="mb-3">
      <div className="text-[32px] font-light text-slate-700 dark:text-slate-100 leading-none">
        {title}
      </div>
    </div>
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
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-4 py-3 text-[13px] text-slate-700 dark:text-slate-200 border-b border-slate-200/80 dark:border-slate-800 align-top",
        className
      )}
    >
      {children}
    </td>
  );
}

function GhostButton({
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
      disabled={!!disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 h-9 px-3 rounded-lg",
        "text-[12px] font-semibold",
        "border border-slate-200 dark:border-slate-800",
        "bg-white dark:bg-slate-900",
        "text-slate-800 dark:text-slate-100",
        "hover:bg-slate-50 dark:hover:bg-slate-800/60",
        "shadow-sm transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  onClick,
  tone = "sky",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: "sky" | "rose";
  disabled?: boolean;
}) {
  const cls =
    tone === "sky"
      ? "bg-sky-600 hover:bg-sky-700 active:bg-sky-800 focus-visible:ring-sky-400/50"
      : "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-rose-400/50";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!!disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 h-9 px-3 rounded-lg",
        "text-[12px] font-semibold text-white",
        cls,
        "shadow-sm hover:shadow-md transition",
        "focus:outline-none focus-visible:ring-2",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

function fmtShowing(total: number) {
  return total === 0 ? "Showing 0 to 0 of 0 entries" : `Showing 1 to ${total} of ${total} entries`;
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

      <div className="h-9 w-10 grid place-items-center border-l border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 font-semibold text-sm">
        {page}
      </div>

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

export default function NoDueApproval() {
  const [rows, setRows] = useState<NoDueRow[]>([
    {
      id: "1",
      sno: 1,
      regNo: "19221314",
      studentName: "Alice Johnson",
      courseCode: "CS101",
      courseName: "Introduction to Computer Science",
      program: "B.Tech CSE",
      year: "1st Year",
      requestedOn: "01/01/2026",
      status: "Pending",
    },
    {
      id: "2",
      sno: 2,
      regNo: "19221315",
      studentName: "Bob Smith",
      courseCode: "CS102",
      courseName: "Data Structures",
      program: "B.Tech CSE",
      year: "2nd Year",
      requestedOn: "02/01/2026",
      status: "Approved",
    },
    {
      id: "3",
      sno: 3,
      regNo: "19231316",
      studentName: "Charlie Brown",
      courseCode: "CS103",
      courseName: "Algorithms",
      program: "B.Tech CSE",
      year: "3rd Year",
      requestedOn: "03/01/2026",
      status: "Rejected",
    },
  ]);

  useEffect(() => {
    const fetchNoDueRequests = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch("/api/teacher/no-due-requests", { headers });
        if (res.ok) {
          const data = await res.json();
          setRows(data.noDueRequests || []);
        }
      } catch (err) {
        console.error("Failed to fetch no-due requests", err);
      }
    };
    fetchNoDueRequests();
  }, []);

  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => {
      const hay = `${r.regNo} ${r.studentName} ${r.courseCode} ${r.courseName} ${r.program} ${r.year} ${r.requestedOn}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, search]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageSafe = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageSafe, pageSize]);

  const approve = async (r: NoDueRow) => {
    try {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`/api/teacher/no-due-requests/${r.id}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) {
        setRows((prev) => prev.map((row) => (row.id === r.id ? { ...row, status: "Approved" } : row)));
      } else {
        alert("Failed to approve.");
      }
    } catch (err) {
      console.error("Failed to approve", err);
      alert("Failed to approve.");
    }
  };

  const reject = async (r: NoDueRow) => {
    try {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`/api/teacher/no-due-requests/${r.id}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "reject" }),
      });
      if (res.ok) {
        setRows((prev) => prev.map((row) => (row.id === r.id ? { ...row, status: "Rejected" } : row)));
      } else {
        alert("Failed to reject.");
      }
    } catch (err) {
      console.error("Failed to reject", err);
      alert("Failed to reject.");
    }
  };

  const view = (r: NoDueRow) => alert(`View request ${r.regNo} • ${r.courseCode} (wire to API).`);

  return (
    <div className="w-full p-4 md:p-6 space-y-4">
      <PageTitle title="No Due Approval" />

      {/* top controls: records + search (no card) */}
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
                "h-10 rounded-md px-3 pr-9 text-[13px]",
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
          <div className="relative w-full sm:w-[240px]">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={cn(
                "w-full h-10 rounded-md pl-9 pr-3 text-[13px]",
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
              <Th>SNo.</Th>
              <Th>RegNo.</Th>
              <Th>Student Name</Th>
              <Th>Course Code</Th>
              <Th>Course Name</Th>
              <Th>Program</Th>
              <Th>Year</Th>
              <Th>Requested On</Th>
              <Th>Action</Th>
            </tr>
          </thead>

          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <Td colSpan={9 as any} className="py-10 text-center text-slate-500 dark:text-slate-400">
                  No data available in table
                </Td>
              </tr>
            ) : (
              pageRows.map((r, idx) => (
                <tr
                  key={`${r.regNo}-${r.courseCode}-${r.sno}`}
                  className={cn(
                    idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/60 dark:bg-slate-900/60",
                    "hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
                  )}
                >
                  <Td className="tabular-nums">{r.sno}</Td>
                  <Td className="font-semibold text-slate-900 dark:text-white">{r.regNo}</Td>
                  <Td>{r.studentName}</Td>
                  <Td className="font-semibold">{r.courseCode}</Td>
                  <Td>{r.courseName}</Td>
                  <Td>{r.program}</Td>
                  <Td>{r.year}</Td>
                  <Td className="tabular-nums">{r.requestedOn}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <GhostButton onClick={() => view(r)}>View</GhostButton>
                      <PrimaryButton onClick={() => approve(r)} disabled={r.status !== "Pending"}>
                        <CheckIcon size={14} />
                        Approve
                      </PrimaryButton>
                      <PrimaryButton onClick={() => reject(r)} tone="rose" disabled={r.status !== "Pending"}>
                        <XIcon size={14} />
                        Reject
                      </PrimaryButton>
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableShell>

      {/* footer */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="text-[13px] text-slate-700 dark:text-slate-200">
          {fmtShowing(Math.min(total, pageSize))}
        </div>
        <div className="sm:ml-auto">
          <Pager page={pageSafe} totalPages={totalPages} onPage={setPage} />
        </div>
      </div>
    </div>
  );
}
