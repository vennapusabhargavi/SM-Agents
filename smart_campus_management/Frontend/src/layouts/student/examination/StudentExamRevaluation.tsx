import React, { useMemo, useState, useEffect } from "react";
import { SearchIcon, ChevronUpIcon, ChevronDownIcon } from "lucide-react";

type RevalStatus = "Initiated" | "Pending" | "Approved" | "Rejected";

type RevalRow = {
  id: string;
  courseCode: string;
  courseName: string;
  grade: string;
  marks: number;
  status: RevalStatus;
  requestedOn: string; // dd/mm/yyyy
};


const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost/smart_campus_api";
const STUDENT_API = `${API_BASE}/api/student`;

type SortKey = keyof Pick<
  RevalRow,
  "courseCode" | "courseName" | "grade" | "marks" | "status" | "requestedOn"
>;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function toISOFromDMY(dmy: string): string {
  const m = dmy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

function StatusPill({ value }: { value: RevalStatus }) {
  const cls =
    value === "Approved"
      ? "bg-emerald-600 text-white"
      : value === "Pending"
      ? "bg-amber-500 text-white"
      : value === "Rejected"
      ? "bg-rose-600 text-white"
      : "bg-slate-600 text-white";

  return (
    <span className={cn("inline-flex rounded-sm px-2.5 py-1 text-[12px] font-semibold", cls)}>
      {value}
    </span>
  );
}

function SortIcon({
  k,
  sortKey,
  sortDir,
}: {
  k: SortKey;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
}) {
  if (sortKey !== k) return <ChevronUpIcon size={14} className="opacity-30" />;
  return sortDir === "asc" ? (
    <ChevronUpIcon size={14} className="opacity-80" />
  ) : (
    <ChevronDownIcon size={14} className="opacity-80" />
  );
}

function Th({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <th
      onClick={onClick}
      className={cn(
        "px-4 py-3 text-left text-[13px] font-semibold",
        "text-slate-700 dark:text-slate-200",
        "border-b border-slate-200 dark:border-slate-800",
        "bg-white dark:bg-slate-900",
        onClick && "cursor-pointer select-none"
      )}
    >
      <span className="inline-flex items-center gap-1">{children}</span>
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn("px-4 py-3 text-[13px] text-slate-700 dark:text-slate-200", className)}>
      {children}
    </td>
  );
}

export function StudentExamRevaluation() {
  // Keep empty to match screenshot
  const [rows, setRows] = useState<RevalRow[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    fetch(`${STUDENT_API}/exams/revaluation`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.rows) setRows(json.rows as RevalRow[]);
      })
      .catch(() => {});
  }, []);

  // controls
  const [pageSize, setPageSize] = useState<number>(10);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [sortKey, setSortKey] = useState<SortKey>("courseCode");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [
        r.courseCode,
        r.courseName,
        r.grade,
        String(r.marks),
        r.status,
        r.requestedOn,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const va = a[sortKey] as any;
      const vb = b[sortKey] as any;

      if (sortKey === "marks") return Number(va) - Number(vb);
      if (sortKey === "requestedOn") {
        const da = toISOFromDMY(String(va)) || "";
        const db = toISOFromDMY(String(vb)) || "";
        if (da === db) return 0;
        return da < db ? -1 : 1;
      }

      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      if (sa === sb) return 0;
      return sa < sb ? -1 : 1;
    });
    return sortDir === "asc" ? arr : arr.reverse();
  }, [filtered, sortKey, sortDir]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safePage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  // Demo action: create a row so you can see “Action” column work
  async function demoCreateRequest() {
    try {
      const token = localStorage.getItem("authToken");
      const headers = token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" };
      const res = await fetch(`${STUDENT_API}/exams/revaluation`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          courseCode: "ECA0521",
          courseName: "Engineering Electromagnetics for Industrial Applications",
          grade: "C",
          marks: 54,
        }),
      });
      if (!res.ok) throw new Error("Failed");

      const list = await fetch(`${STUDENT_API}/exams/revaluation`, { headers });
      if (list.ok) {
        const json = await list.json();
        if (json?.rows) setRows(json.rows as RevalRow[]);
      }
    } catch {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const yyyy = String(today.getFullYear());
      const requestedOn = `${dd}/${mm}/${yyyy}`;

      setRows((prev) => [
        ...prev,
        {
          id: `rv-${Date.now()}`,
          courseCode: "ECA0521",
          courseName: "Engineering Electromagnetics for Industrial Applications",
          grade: "C",
          marks: 54,
          status: "Initiated",
          requestedOn,
        },
      ]);
    }
  }

  return (
    <div className="w-full p-4 md:p-6">
      {/* Title */}
      <div className="mb-5">
        <div className="text-[30px] font-light text-slate-700 dark:text-slate-100">
          Revaluation Request
        </div>
      </div>

      {/* Controls (kept subtle, like big systems) */}
      <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className={cn(
              "rounded-lg border border-slate-200 dark:border-slate-800",
              "bg-white dark:bg-slate-900",
              "px-2 py-1.5 text-[13px]"
            )}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span className="text-[13px] text-slate-700 dark:text-slate-200">records</span>


        </div>

        <div className="flex items-center gap-2 justify-start sm:justify-end">
          <span className="text-[13px] text-slate-700 dark:text-slate-200">Search:</span>
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "w-[220px] rounded-lg border border-slate-200 dark:border-slate-800",
                "bg-white dark:bg-slate-900",
                "pl-9 pr-3 py-2 text-[13px]",
                "focus:outline-none focus:ring-2 focus:ring-slate-400/30 dark:focus:ring-slate-500/30"
              )}
              placeholder=""
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500">
              <SearchIcon size={16} />
            </span>
          </div>
        </div>
      </div>

      {/* Table surface */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full border-collapse">
            <thead>
              <tr className="bg-white dark:bg-slate-900">
                <Th onClick={() => toggleSort("courseCode")}>
                  Course Code <SortIcon k="courseCode" sortKey={sortKey} sortDir={sortDir} />
                </Th>
                <Th onClick={() => toggleSort("courseName")}>
                  Course Name <SortIcon k="courseName" sortKey={sortKey} sortDir={sortDir} />
                </Th>
                <Th onClick={() => toggleSort("grade")}>
                  Grade <SortIcon k="grade" sortKey={sortKey} sortDir={sortDir} />
                </Th>
                <Th onClick={() => toggleSort("marks")}>
                  Marks <SortIcon k="marks" sortKey={sortKey} sortDir={sortDir} />
                </Th>
                <Th onClick={() => toggleSort("status")}>
                  Status <SortIcon k="status" sortKey={sortKey} sortDir={sortDir} />
                </Th>
                <Th onClick={() => toggleSort("requestedOn")}>
                  Requested On <SortIcon k="requestedOn" sortKey={sortKey} sortDir={sortDir} />
                </Th>
                <Th>Action</Th>
              </tr>
            </thead>

            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-[13px] text-slate-600 dark:text-slate-300"
                  >
                    No data available in table
                  </td>
                </tr>
              ) : (
                paged.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-slate-200/70 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <Td>{r.courseCode}</Td>
                    <Td className="max-w-[520px]">{r.courseName}</Td>
                    <Td>{r.grade}</Td>
                    <Td>{r.marks}</Td>
                    <Td>
                      <StatusPill value={r.status} />
                    </Td>
                    <Td>{r.requestedOn}</Td>
                    <Td>
                      <button
                        type="button"
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-[13px] font-semibold",
                          "bg-teal-600 text-white hover:bg-teal-700 transition",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                        disabled={r.status !== "Initiated"}
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem("authToken");
                            const headers = token
                              ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
                              : { "Content-Type": "application/json" };
                            const res = await fetch(`${STUDENT_API}/exams/revaluation/${r.id}`, {
                              method: "PUT",
                              headers,
                              body: JSON.stringify({ status: "PENDING" }),
                            });
                            if (!res.ok) throw new Error("Failed");
                          } catch {
                            // fall back to local update
                          }
                          setRows((prev) =>
                            prev.map((x) =>
                              x.id === r.id ? { ...x, status: "Pending" } : x
                            )
                          );
                        }}
                      >
                        Initiate
                      </button>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-slate-200 dark:border-slate-800">
          <div className="text-[12px] text-slate-600 dark:text-slate-300">
            Showing{" "}
            <span className="font-semibold">
              {total === 0 ? 0 : (safePage - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold">{Math.min(safePage * pageSize, total)}</span>{" "}
            of <span className="font-semibold">{total}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={safePage === 1}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[13px] ring-1",
                "bg-white dark:bg-slate-900",
                "ring-slate-200 dark:ring-slate-800",
                "disabled:opacity-50"
              )}
            >
              First
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[13px] ring-1",
                "bg-white dark:bg-slate-900",
                "ring-slate-200 dark:ring-slate-800",
                "disabled:opacity-50"
              )}
            >
              Prev
            </button>

            <div className="text-[13px] text-slate-700 dark:text-slate-200">
              Page <span className="font-semibold">{safePage}</span> /{" "}
              <span className="font-semibold">{totalPages}</span>
            </div>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[13px] ring-1",
                "bg-white dark:bg-slate-900",
                "ring-slate-200 dark:ring-slate-800",
                "disabled:opacity-50"
              )}
            >
              Next
            </button>
            <button
              type="button"
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[13px] ring-1",
                "bg-white dark:bg-slate-900",
                "ring-slate-200 dark:ring-slate-800",
                "disabled:opacity-50"
              )}
            >
              Last
            </button>
          </div>
        </div>
      </div>

      {/* Bottom note like screenshot */}
      <div className="mt-10 text-center text-[12px] text-rose-500">
        All initiated revaluation send for principal approval.
      </div>
    </div>
  );
}
