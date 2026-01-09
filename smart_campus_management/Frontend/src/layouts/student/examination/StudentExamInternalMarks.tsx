import React, { useEffect, useMemo, useState } from "react";
import { ChevronUp, ChevronDown, Printer, ArrowUpDown } from "lucide-react";

type MarkRow = {
  id: string;
  sno: number;
  courseCode: string;
  courseName: string;
  testName: string;
  mark: number;
  maxMark: number;
  datedOn: string; // dd/MM/yyyy
};

type SortKey =
  | "sno"
  | "courseCode"
  | "courseName"
  | "testName"
  | "mark"
  | "maxMark"
  | "datedOn";

type SortDir = "asc" | "desc";


const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost/smart_campus_api";
const STUDENT_API = `${API_BASE}/api/student`;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden",
        "border border-slate-200 dark:border-slate-800",
        "bg-white dark:bg-slate-900",
        "shadow-sm"
      )}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function Th({
  children,
  onClick,
  active,
  dir,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  dir?: SortDir;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "text-left text-[12.5px] font-semibold",
        "text-slate-700 dark:text-slate-200",
        "bg-white dark:bg-slate-900",
        "border-b border-slate-200 dark:border-slate-800",
        "px-3 py-2.5",
        "whitespace-nowrap",
        "sticky top-0 z-10",
        className
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1.5",
          onClick && "hover:text-slate-900 dark:hover:text-white transition",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 rounded"
        )}
        disabled={!onClick}
      >
        {children}
        {onClick ? (
          active ? (
            dir === "asc" ? (
              <ChevronUp className="h-4 w-4 opacity-80" />
            ) : (
              <ChevronDown className="h-4 w-4 opacity-80" />
            )
          ) : (
            <ArrowUpDown className="h-4 w-4 opacity-35" />
          )
        ) : null}
      </button>
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td
      className={cn(
        "text-[13px]",
        "text-slate-700 dark:text-slate-200",
        "border-b border-slate-200/80 dark:border-slate-800",
        "px-3 py-3",
        className
      )}
    >
      {children}
    </td>
  );
}

function printMarkRow(row: MarkRow) {
  // End-to-end: opens a print window (popup) and prints.
  const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Internal Marks - ${row.courseCode}</title>
  <style>
    body{font-family: Arial, sans-serif; padding:24px; color:#0f172a;}
    .card{border:1px solid #e2e8f0; border-radius:12px; padding:16px;}
    .title{font-size:18px; font-weight:700; margin:0 0 10px;}
    .row{display:flex; gap:16px; margin:6px 0;}
    .k{width:140px; color:#475569; font-size:12px;}
    .v{flex:1; font-weight:600; font-size:13px;}
    .muted{color:#64748b; font-size:12px; margin-top:10px;}
  </style>
</head>
<body>
  <div class="card">
    <div class="title">Internal Marks (IA)</div>
    <div class="row"><div class="k">Course Code</div><div class="v">${row.courseCode}</div></div>
    <div class="row"><div class="k">Course Name</div><div class="v">${row.courseName}</div></div>
    <div class="row"><div class="k">Test Name</div><div class="v">${row.testName}</div></div>
    <div class="row"><div class="k">Mark</div><div class="v">${row.mark} / ${row.maxMark}</div></div>
    <div class="row"><div class="k">Dated On</div><div class="v">${row.datedOn}</div></div>
    <div class="muted">If the print window doesn’t open, enable pop-ups in your browser.</div>
  </div>
  <script>
    window.onload = () => { window.print(); setTimeout(() => window.close(), 300); };
  </script>
</body>
</html>
  `.trim();

  const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=650");
  if (!w) {
    alert("Popup blocked. Please enable pop-ups to print marks.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

export function StudentExamInternalMarks() {
  // ✅ Screenshot shows empty table. Keep empty by default (still fully working).
  // If you want demo rows, fill this array.
  const demoRows: MarkRow[] = useMemo(() => {
    return [];
    // Example:
    // return [
    //   {
    //     id: "m1",
    //     sno: 1,
    //     courseCode: "CSE1001",
    //     courseName: "Programming Fundamentals",
    //     testName: "IA-1",
    //     mark: 18,
    //     maxMark: 25,
    //     datedOn: "20/12/2025",
    //   },
    // ];
  }, []);

  const [rows, setRows] = useState<MarkRow[]>(demoRows);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${STUDENT_API}/exams/internal-marks`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.rows) setRows(json.rows as MarkRow[]);
      })
      .catch(() => {});
  }, []);

  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [sortKey, setSortKey] = useState<SortKey>("sno");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => {
    const copy = [...rows];
    const dir = sortDir === "asc" ? 1 : -1;
    copy.sort((a, b) => {
      const va = a[sortKey] as any;
      const vb = b[sortKey] as any;

      // numbers
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;

      // dates (dd/MM/yyyy) simple compare using yyyyMMdd
      if (sortKey === "datedOn") {
        const toKey = (s: string) => {
          const [dd, mm, yyyy] = s.split("/");
          return `${yyyy}${mm}${dd}`;
        };
        return toKey(va).localeCompare(toKey(vb)) * dir;
      }

      // strings
      return String(va).localeCompare(String(vb), undefined, { sensitivity: "base" }) * dir;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const startIdx = (safePage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const pageRows = sorted.slice(startIdx, endIdx);

  const showingText =
    total === 0
      ? "Showing 0 to 0 of 0 entries"
      : `Showing ${startIdx + 1} to ${endIdx} of ${total} entries`;

  function toggleSort(nextKey: SortKey) {
    setPage(1);
    setSortKey((prev) => {
      if (prev === nextKey) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir("asc");
      return nextKey;
    });
  }

  return (
    <div className="w-full p-4 md:p-6">
      {/* Title like screenshot */}
      <div className="mb-4">
        <div className="text-[28px] font-light text-slate-700 dark:text-slate-100 leading-none">
          Internal Marks (IA)
        </div>
      </div>

      <TableShell>
        <table className="min-w-[1100px] w-full border-collapse">
          <thead>
            <tr>
              <Th
                className="w-[80px]"
                onClick={() => toggleSort("sno")}
                active={sortKey === "sno"}
                dir={sortDir}
              >
                S No.
              </Th>
              <Th
                className="w-[160px]"
                onClick={() => toggleSort("courseCode")}
                active={sortKey === "courseCode"}
                dir={sortDir}
              >
                Course Code
              </Th>
              <Th
                onClick={() => toggleSort("courseName")}
                active={sortKey === "courseName"}
                dir={sortDir}
              >
                Course Name
              </Th>
              <Th
                className="w-[240px]"
                onClick={() => toggleSort("testName")}
                active={sortKey === "testName"}
                dir={sortDir}
              >
                Test Name
              </Th>
              <Th
                className="w-[160px]"
                onClick={() => toggleSort("mark")}
                active={sortKey === "mark"}
                dir={sortDir}
              >
                Mark
              </Th>
              <Th
                className="w-[160px]"
                onClick={() => toggleSort("maxMark")}
                active={sortKey === "maxMark"}
                dir={sortDir}
              >
                Max Mark
              </Th>
              <Th
                className="w-[160px]"
                onClick={() => toggleSort("datedOn")}
                active={sortKey === "datedOn"}
                dir={sortDir}
              >
                Dated On
              </Th>
              <Th className="w-[160px] text-center">Print Marks</Th>
            </tr>
          </thead>

          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <Td colSpan={8 as any} className="text-center py-10 text-slate-600 dark:text-slate-300">
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
                  <Td className="tabular-nums">{r.sno}</Td>
                  <Td className="font-semibold text-slate-900 dark:text-white">{r.courseCode}</Td>
                  <Td>{r.courseName}</Td>
                  <Td>{r.testName}</Td>
                  <Td className="tabular-nums">{r.mark}</Td>
                  <Td className="tabular-nums">{r.maxMark}</Td>
                  <Td className="tabular-nums">{r.datedOn}</Td>
                  <Td className="text-center">
                    <button
                      type="button"
                      onClick={() => printMarkRow(r)}
                      className={cn(
                        "inline-flex items-center justify-center gap-2",
                        "rounded-xl px-3 py-2",
                        "text-[12px] font-semibold",
                        "bg-slate-900 text-white hover:bg-slate-800",
                        "dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100",
                        "shadow-sm transition",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40"
                      )}
                    >
                      <Printer className="h-4 w-4" />
                      Print
                    </button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableShell>

      {/* Footer controls (keep it simple like screenshot) */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-[13px] text-slate-700 dark:text-slate-200">{showingText}</div>

        <div className="flex items-center gap-3">
          <div className="text-[12px] text-slate-600 dark:text-slate-300">Rows:</div>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className={cn(
              "rounded-xl border border-slate-300/80 dark:border-slate-700",
              "bg-white dark:bg-slate-950",
              "px-2.5 py-2 text-[12px]",
              "text-slate-900 dark:text-slate-100",
              "focus:outline-none focus:ring-2 focus:ring-slate-400/40"
            )}
          >
            {[5, 10, 25, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className={cn(
                "rounded-xl px-3 py-2 text-[12px] font-semibold",
                "border border-slate-200 dark:border-slate-800",
                "bg-white dark:bg-slate-900",
                "hover:bg-slate-50 dark:hover:bg-slate-800/60 transition",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Prev
            </button>
            <div className="text-[12px] text-slate-700 dark:text-slate-200 tabular-nums">
              {safePage} / {totalPages}
            </div>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className={cn(
                "rounded-xl px-3 py-2 text-[12px] font-semibold",
                "border border-slate-200 dark:border-slate-800",
                "bg-white dark:bg-slate-900",
                "hover:bg-slate-50 dark:hover:bg-slate-800/60 transition",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
