import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDaysIcon,
  SearchIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "lucide-react";

type Status = "Approved" | "Pending" | "Rejected";

type CourseOption = {
  id: string;
  code: string;
  name: string;
};

type ODRow = {
  id: string;
  sno: number;
  courseCode: string;
  courseName: string;
  startDate: string; // dd/mm/yyyy
  endDate: string;   // dd/mm/yyyy
  facultyApproved: Status;
  principalApproved: Status;
  requestedOn: string; // dd/mm/yyyy
};

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost/smart_campus_api";
const STUDENT_API = `${API_BASE}/api/student`;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function StatusPill({ value }: { value: Status }) {
  const cls =
    value === "Approved"
      ? "bg-teal-600 text-white"
      : value === "Pending"
      ? "bg-amber-500 text-white"
      : "bg-rose-600 text-white";
  return (
    <span className={cn("inline-flex rounded-sm px-2.5 py-1 text-[12px] font-semibold", cls)}>
      {value}
    </span>
  );
}

function toISOFromDMY(dmy: string): string {
  // dd/mm/yyyy -> yyyy-mm-dd (best-effort)
  const m = dmy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

function toDMYFromISO(iso: string): string {
  // yyyy-mm-dd -> dd/mm/yyyy
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  const [, yyyy, mm, dd] = m;
  return `${dd}/${mm}/${yyyy}`;
}

type SortKey = keyof Pick<
  ODRow,
  "sno" | "courseCode" | "courseName" | "startDate" | "endDate" | "facultyApproved" | "principalApproved" | "requestedOn"
>;

export function StudentAttendanceRequestOD() {
  // Dummy course dropdown options from seed
  const demoCourses: CourseOption[] = useMemo(
    () => [
      { id: "c1", code: "CS101", name: "Introduction to Computer Science" },
      { id: "c2", code: "CS102", name: "Data Structures" },
      { id: "c3", code: "CS103", name: "Algorithms" },
      { id: "c4", code: "CS104", name: "Database Systems" },
    ],
    []
  );

  const [courses, setCourses] = useState<CourseOption[]>(demoCourses);
  // Dummy table rows
  const [rows, setRows] = useState<ODRow[]>([]);

  // Form state
  const [startISO, setStartISO] = useState("");
  const [endISO, setEndISO] = useState("");
  const [courseId, setCourseId] = useState<string>("");
  const [content, setContent] = useState<string>("");

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === courseId),
    [courses, courseId]
  );

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "warn"; msg: string } | null>(null);

  function showToast(t: { type: "ok" | "warn"; msg: string }) {
    setToast(t);
    window.setTimeout(() => setToast(null), 2200);
  }

  async function loadRows() {
    const token = localStorage.getItem("authToken");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(`${STUDENT_API}/attendance/od-requests`, { headers });
      if (!res.ok) return;
      const json = await res.json();
      if (json?.rows) setRows(json.rows as ODRow[]);
    } catch {
      // ignore
    }
  }

  async function sendForApproval() {
    const startDMY = toDMYFromISO(startISO);
    const endDMY = toDMYFromISO(endISO);

    if (!startISO || !endISO) return showToast({ type: "warn", msg: "Please select Start Date and End Date." });
    if (endISO < startISO) return showToast({ type: "warn", msg: "End Date cannot be before Start Date." });
    if (!selectedCourse) return showToast({ type: "warn", msg: "Please select Course Code & Name." });
    if (!content.trim()) return showToast({ type: "warn", msg: "Please enter content/reason." });

    setSubmitting(true);
    // Simulate sending
    setTimeout(() => {
      const newRow: ODRow = {
        id: `r${Date.now()}`,
        sno: rows.length + 1,
        courseCode: selectedCourse.code,
        courseName: selectedCourse.name,
        startDate: startDMY,
        endDate: endDMY,
        facultyApproved: "Pending",
        principalApproved: "Pending",
        requestedOn: new Date().toLocaleDateString('en-GB'),
      };
      const updatedRows = [...rows, newRow];
      setRows(updatedRows);
      localStorage.setItem('student_od_requests', JSON.stringify(updatedRows));
      setStartISO("");
      setEndISO("");
      setCourseId("");
      setContent("");
      showToast({ type: "ok", msg: "OD request sent for approval." });
      setSubmitting(false);
    }, 1000);
  }

  useEffect(() => {
    const storedRows = localStorage.getItem('student_od_requests');
    if (storedRows) {
      setRows(JSON.parse(storedRows));
    } else {
      const defaultRows: ODRow[] = [
        {
          id: "r1",
          sno: 1,
          courseCode: "CS101",
          courseName: "Introduction to Computer Science",
          startDate: "12/01/2026",
          endDate: "12/01/2026",
          facultyApproved: "Approved",
          principalApproved: "Pending",
          requestedOn: "11/01/2026",
        },
        {
          id: "r2",
          sno: 2,
          courseCode: "CS102",
          courseName: "Data Structures",
          startDate: "13/01/2026",
          endDate: "13/01/2026",
          facultyApproved: "Pending",
          principalApproved: "Pending",
          requestedOn: "12/01/2026",
        },
      ];
      setRows(defaultRows);
      localStorage.setItem('student_od_requests', JSON.stringify(defaultRows));
    }
  }, []);

  // Table controls
  const [pageSize, setPageSize] = useState<number>(10);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [sortKey, setSortKey] = useState<SortKey>("sno");
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
    return rows.filter((r) => {
      const blob = [
        r.courseCode,
        r.courseName,
        r.startDate,
        r.endDate,
        r.facultyApproved,
        r.principalApproved,
        r.requestedOn,
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [rows, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const va = a[sortKey] as any;
      const vb = b[sortKey] as any;

      // date columns sort by ISO if possible
      const dateKeys: SortKey[] = ["startDate", "endDate", "requestedOn"];
      if (dateKeys.includes(sortKey)) {
        const da = toISOFromDMY(String(va)) || "";
        const db = toISOFromDMY(String(vb)) || "";
        if (da === db) return 0;
        return da < db ? -1 : 1;
      }

      if (typeof va === "number" && typeof vb === "number") return va - vb;
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

  // keep page valid when filters change
  React.useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronUpIcon size={14} className="opacity-30" />;
    return sortDir === "asc" ? (
      <ChevronUpIcon size={14} className="opacity-80" />
    ) : (
      <ChevronDownIcon size={14} className="opacity-80" />
    );
  }

  return (
    <div className="w-full p-4 md:p-6">
      {/* Title */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="text-[28px] leading-none font-light text-slate-700 dark:text-slate-100">
          Request OD
        </div>

        {toast && (
          <div
            className={cn(
              "rounded-xl px-3 py-2 text-[13px] font-medium ring-1",
              toast.type === "ok"
                ? "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-900/40"
                : "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/20 dark:text-amber-200 dark:ring-amber-900/40"
            )}
          >
            {toast.msg}
          </div>
        )}
      </div>

      {/* Form surface (like big apps) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 md:p-6">
        <div className="grid lg:grid-cols-[220px_1fr] gap-4 max-w-[980px] mx-auto">
          {/* Start Date */}
          <div className="text-[13px] font-medium text-rose-500 lg:text-right lg:pt-2.5">
            Start Date:
          </div>
          <div className="relative">
            <input
              type="date"
              value={startISO}
              onChange={(e) => setStartISO(e.target.value)}
              className={cn(
                "w-full rounded-xl border border-slate-300/90 dark:border-slate-700",
                "bg-slate-50 dark:bg-slate-950",
                "px-3 py-2.5 pr-11 text-[13px]",
                "text-slate-900 dark:text-slate-100",
                "shadow-inner",
                "focus:outline-none focus:ring-2 focus:ring-slate-400/30 dark:focus:ring-slate-500/30"
              )}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
              <CalendarDaysIcon size={18} />
            </span>
          </div>

          {/* End Date */}
          <div className="text-[13px] font-medium text-rose-500 lg:text-right lg:pt-2.5">
            End Date:
          </div>
          <div className="relative">
            <input
              type="date"
              value={endISO}
              onChange={(e) => setEndISO(e.target.value)}
              className={cn(
                "w-full rounded-xl border border-slate-300/90 dark:border-slate-700",
                "bg-slate-50 dark:bg-slate-950",
                "px-3 py-2.5 pr-11 text-[13px]",
                "text-slate-900 dark:text-slate-100",
                "shadow-inner",
                "focus:outline-none focus:ring-2 focus:ring-slate-400/30 dark:focus:ring-slate-500/30"
              )}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
              <CalendarDaysIcon size={18} />
            </span>
          </div>

          {/* Course */}
          <div className="text-[13px] font-medium text-rose-500 lg:text-right lg:pt-2.5">
            Course Code &amp; Name:
          </div>
          <div>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className={cn(
                "w-full rounded-xl border border-slate-300/90 dark:border-slate-700",
                "bg-white dark:bg-slate-950",
                "px-3 py-2.5 text-[13px]",
                "text-slate-900 dark:text-slate-100",
                "shadow-inner",
                "focus:outline-none focus:ring-2 focus:ring-slate-400/30 dark:focus:ring-slate-500/30"
              )}
            >
              <option value="">--Select--</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Content label */}
          <div className="text-[13px] font-medium text-rose-500 lg:text-right lg:pt-2.5">
            Content
          </div>

          {/* Editor */}
          <div>
            <div className="rounded-2xl border border-slate-300/70 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-950">
              {/* Faux toolbar (looks like screenshot, but kept lightweight) */}
              <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-slate-200/70 dark:bg-slate-900 border-b border-slate-300/60 dark:border-slate-800">
                <ToolbarButton label="B" />
                <ToolbarButton label="I" />
                <ToolbarButton label="U" />
                <span className="mx-1 h-5 w-px bg-slate-300/80 dark:bg-slate-700" />
                <ToolbarButton label="•" />
                <ToolbarButton label="1." />
                <span className="mx-1 h-5 w-px bg-slate-300/80 dark:bg-slate-700" />
                <ToolbarSelect label="Styles" />
                <ToolbarSelect label="Format" />
                <ToolbarButton label="?" />
                <div className="ml-auto">
                  <span className="text-[12px] text-slate-600 dark:text-slate-300">
                    Source
                  </span>
                </div>
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={cn(
                  "w-full min-h-[220px] p-3 text-[13px]",
                  "bg-white dark:bg-slate-950",
                  "text-slate-900 dark:text-slate-100",
                  "focus:outline-none"
                )}
                placeholder="Enter OD reason/details…"
              />
            </div>

            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={sendForApproval}
                disabled={submitting}
                className={cn(
                  "inline-flex items-center justify-center",
                  "rounded-xl px-5 py-2.5",
                  "text-[13px] font-semibold text-white",
                  "bg-teal-600 hover:bg-teal-700",
                  "shadow-sm hover:shadow-md transition",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50",
                  "disabled:opacity-60 disabled:cursor-not-allowed"
                )}
              >
                {submitting ? "Sending..." : "Send for Approval"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table controls */}
      <div className="mt-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
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

        <div className="flex items-center gap-2 justify-start lg:justify-end">
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

      {/* Table */}
      <div className="mt-3 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70">
                <Th onClick={() => toggleSort("sno")}>
                  SNo. <SortIcon k="sno" sortKey={sortKey} sortDir={sortDir} />
                </Th>
                <Th onClick={() => toggleSort("courseCode")}>
                  Course Code{" "}
                  <SortIcon k="courseCode" sortKey={sortKey} sortDir={sortDir} />
                </Th>
                <Th onClick={() => toggleSort("courseName")}>
                  Course Name{" "}
                  <SortIcon k="courseName" sortKey={sortKey} sortDir={sortDir} />
                </Th>
                <Th onClick={() => toggleSort("startDate")}>
                  Start date{" "}
                  <SortIcon k="startDate" sortKey={sortKey} sortDir={sortDir} />
                </Th>
                <Th onClick={() => toggleSort("endDate")}>
                  End date{" "}
                  <SortIcon k="endDate" sortKey={sortKey} sortDir={sortDir} />
                </Th>
                <Th onClick={() => toggleSort("facultyApproved")}>
                  Faculty Approved{" "}
                  <SortIcon k="facultyApproved" sortKey={sortKey} sortDir={sortDir} />
                </Th>
                <Th onClick={() => toggleSort("principalApproved")}>
                  Principal Approved{" "}
                  <SortIcon k="principalApproved" sortKey={sortKey} sortDir={sortDir} />
                </Th>
                <Th onClick={() => toggleSort("requestedOn")}>
                  Requested On{" "}
                  <SortIcon k="requestedOn" sortKey={sortKey} sortDir={sortDir} />
                </Th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[13px] text-slate-500">
                    No requests found.
                  </td>
                </tr>
              ) : (
                paged.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-slate-200/70 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <Td>{r.sno}</Td>
                    <Td>{r.courseCode}</Td>
                    <Td className="max-w-[420px]">{r.courseName}</Td>
                    <Td>{r.startDate}</Td>
                    <Td>{r.endDate}</Td>
                    <Td>
                      <StatusPill value={r.facultyApproved} />
                    </Td>
                    <Td>
                      <StatusPill value={r.principalApproved} />
                    </Td>
                    <Td>{r.requestedOn}</Td>
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
            <span className="font-semibold">
              {Math.min(safePage * pageSize, total)}
            </span>{" "}
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
    </div>
  );

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  }
}

/* ------- small UI helpers (kept local) ------- */

function ToolbarButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className={cn(
        "h-7 min-w-[28px] px-2",
        "rounded-md border border-slate-300/80 dark:border-slate-700",
        "bg-white/80 dark:bg-slate-950",
        "text-[12px] font-semibold text-slate-700 dark:text-slate-200",
        "hover:bg-white dark:hover:bg-slate-900 transition"
      )}
      onClick={() => {}}
    >
      {label}
    </button>
  );
}

function ToolbarSelect({ label }: { label: string }) {
  return (
    <button
      type="button"
      className={cn(
        "h-7 px-2.5",
        "rounded-md border border-slate-300/80 dark:border-slate-700",
        "bg-white/80 dark:bg-slate-950",
        "text-[12px] font-medium text-slate-700 dark:text-slate-200",
        "hover:bg-white dark:hover:bg-slate-900 transition"
      )}
      onClick={() => {}}
    >
      {label}
    </button>
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
        "px-3 py-2.5 text-left text-[13px] font-semibold",
        "text-slate-700 dark:text-slate-200",
        "border-b border-slate-200 dark:border-slate-800",
        onClick && "cursor-pointer select-none"
      )}
    >
      <span className="inline-flex items-center gap-1">{children}</span>
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn("px-3 py-3 text-[13px] text-slate-700 dark:text-slate-200", className)}>
      {children}
    </td>
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
