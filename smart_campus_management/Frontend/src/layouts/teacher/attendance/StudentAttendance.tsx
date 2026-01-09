// src/layouts/faculty/StudentAttendance.tsx
import React, { useMemo, useState } from "react";
import {
  CalendarDaysIcon,
  SearchIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
} from "lucide-react";

type AttendanceRow = {
  sno: number;
  courseCode: string;
  courseName: string;
  classAttended: number;
  attendedHours: number;
  totalClass: number;
  totalHours: number;
  percent: number; // 0..100
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
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg",
        "text-[12px] font-semibold",
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
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg",
        "text-[13px] font-semibold text-white",
        "bg-teal-600 hover:bg-teal-700 active:bg-teal-800",
        "shadow-sm hover:shadow-md transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50"
      )}
    >
      {children}
    </button>
  );
}

function PercentPill({ percent }: { percent: number }) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[52px] h-7 px-2 rounded-md",
        "text-[12px] font-bold text-white",
        p >= 75 ? "bg-sky-600" : "bg-rose-600"
      )}
      title={`${p}%`}
    >
      {p} %
    </span>
  );
}

function fmtShowing(total: number) {
  if (total === 0) return `Showing 0 to 0 of 0 entries`;
  return `Showing 1 to ${total} of ${total} entries`;
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

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute inset-3 sm:inset-6 grid place-items-center">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-base font-semibold text-slate-900 dark:text-slate-50 truncate">{title}</div>
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
          <div className="p-5 max-h-96 overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function StudentAttendance() {
  const [students, setStudents] = useState<{ regNo: string; name: string }[]>([
    { regNo: "19221314", name: "Alice Johnson" },
    { regNo: "19221315", name: "Bob Smith" },
    { regNo: "19231316", name: "Charlie Brown" },
    { regNo: "19221317", name: "Diana Prince" },
    { regNo: "19231318", name: "Eve Wilson" },
  ]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Commented to show dummy students
  // React.useEffect(() => {
  //   const fetchStudents = async () => {
  //     try {
  //       const token = localStorage.getItem("authToken");
  //       const headers: Record<string, string> = {};
  //       if (token) headers.Authorization = `Bearer ${token}`;
  //       const res = await fetch("/api/teacher/enrollment/approved", { headers });
  //       if (res.ok) {
  //         const data = await res.json();
  //         const unique = new Set((data.enrollments || []).map((e: any) => JSON.stringify({ regNo: e.regNo || e.reg_no, name: e.studentName || e.student_name })));
  //         const uniqueStudents = Array.from(unique).map((s) => JSON.parse(s as string));
  //         setStudents(uniqueStudents);
  //       }
  //     } catch (err) {
  //       console.error("Failed to fetch students", err);
  //     } finally {
  //       setLoadingStudents(false);
  //     }
  //   };
  //   fetchStudents();
  // }, []);

  React.useEffect(() => {
    if (students.length > 0 && !regNo) {
      setRegNo(students[0]?.regNo || "");
    }
  }, [students]);

  const [regNo, setRegNo] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`; // input[type=date]
  });

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const rawRows = useMemo(() => {
    if (!regNo) return [];

    // Different attendance data for each student
    const attendanceData: Record<string, AttendanceRow[]> = {
      "19221314": [ // Alice Johnson
        { sno: 1, courseCode: "CS101", courseName: "Introduction to Computer Science", classAttended: 8, attendedHours: 16, totalClass: 10, totalHours: 20, percent: 80 },
        { sno: 2, courseCode: "CS102", courseName: "Data Structures", classAttended: 7, attendedHours: 14, totalClass: 10, totalHours: 20, percent: 70 },
        { sno: 3, courseCode: "CS103", courseName: "Algorithms", classAttended: 9, attendedHours: 18, totalClass: 10, totalHours: 20, percent: 90 },
      ],
      "19221315": [ // Bob Smith
        { sno: 1, courseCode: "CS101", courseName: "Introduction to Computer Science", classAttended: 8, attendedHours: 16, totalClass: 10, totalHours: 20, percent: 80 },
        { sno: 2, courseCode: "CS102", courseName: "Data Structures", classAttended: 8, attendedHours: 16, totalClass: 10, totalHours: 20, percent: 80 },
        { sno: 3, courseCode: "CS103", courseName: "Algorithms", classAttended: 9, attendedHours: 18, totalClass: 10, totalHours: 20, percent: 90 },
      ],
      "19231316": [ // Charlie Brown
        { sno: 1, courseCode: "CS101", courseName: "Introduction to Computer Science", classAttended: 9, attendedHours: 18, totalClass: 10, totalHours: 20, percent: 90 },
        { sno: 2, courseCode: "CS102", courseName: "Data Structures", classAttended: 9, attendedHours: 18, totalClass: 10, totalHours: 20, percent: 90 },
        { sno: 3, courseCode: "CS103", courseName: "Algorithms", classAttended: 10, attendedHours: 20, totalClass: 10, totalHours: 20, percent: 100 },
      ],
      "19221317": [ // Diana Prince
        { sno: 1, courseCode: "CS101", courseName: "Introduction to Computer Science", classAttended: 7, attendedHours: 14, totalClass: 10, totalHours: 20, percent: 70 },
        { sno: 2, courseCode: "CS102", courseName: "Data Structures", classAttended: 8, attendedHours: 16, totalClass: 10, totalHours: 20, percent: 80 },
        { sno: 3, courseCode: "CS103", courseName: "Algorithms", classAttended: 8, attendedHours: 16, totalClass: 10, totalHours: 20, percent: 80 },
      ],
      "19231318": [ // Eve Wilson
        { sno: 1, courseCode: "CS101", courseName: "Introduction to Computer Science", classAttended: 9, attendedHours: 18, totalClass: 10, totalHours: 20, percent: 90 },
        { sno: 2, courseCode: "CS102", courseName: "Data Structures", classAttended: 9, attendedHours: 18, totalClass: 10, totalHours: 20, percent: 90 },
        { sno: 3, courseCode: "CS103", courseName: "Algorithms", classAttended: 9, attendedHours: 18, totalClass: 10, totalHours: 20, percent: 90 },
      ],
    };

    return attendanceData[regNo] || [];
  }, [regNo]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return rawRows;
    return rawRows.filter((r) => {
      const hay = `${r.courseCode} ${r.courseName}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [rawRows, search]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageSafe = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageSafe, pageSize]);

  const [detailModal, setDetailModal] = useState<{ open: boolean; row: AttendanceRow | null }>({ open: false, row: null });

  const onView = () => {
    // ✅ wire to backend later
    setPage(1);
  };

  const openDetails = (row: AttendanceRow) => {
    setDetailModal({ open: true, row });
  };

  const closeDetails = () => {
    setDetailModal({ open: false, row: null });
  };

  return (
    <div className="w-full p-4 md:p-6 space-y-4">
      <PageTitle title="Student Attendance" />

      {/* top filter row (no card background) */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Select Student */}
        <div className="flex items-center gap-3">
          <div className="text-[13px] text-slate-700 dark:text-slate-200">
            Select Student
          </div>

          <div className="relative w-[260px] max-w-full">
            <select
              value={regNo}
              onChange={(e) => {
                setRegNo(e.target.value);
                setPage(1);
              }}
              className={cn(
                "w-full h-10 rounded-md px-3 pr-10 text-[13px]",
                "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100",
                "border border-slate-300/80 dark:border-slate-700",
                "shadow-inner",
                "focus:outline-none focus:ring-2 focus:ring-slate-400/30 dark:focus:ring-slate-500/30",
                "transition"
              )}
            >
              {students.map((s) => (
                <option key={s.regNo} value={s.regNo}>
                  {s.regNo}
                </option>
              ))}
            </select>
            <ChevronDownIcon
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Select Date */}
        <div className="flex items-center gap-3 lg:ml-6">
          <div className="text-[13px] text-slate-700 dark:text-slate-200">
            Select Date
          </div>

          <div className="relative w-[360px] max-w-full">
            <CalendarDaysIcon
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={cn(
                "w-full h-10 rounded-md px-3 pr-10 text-[13px]",
                "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100",
                "border border-slate-300/80 dark:border-slate-700",
                "shadow-inner",
                "focus:outline-none focus:ring-2 focus:ring-slate-400/30 dark:focus:ring-slate-500/30",
                "transition"
              )}
            />
          </div>

          <PrimaryButton onClick={onView}>View</PrimaryButton>
        </div>
      </div>

      {/* controls row: records + search */}
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
          <div className="text-[13px] text-slate-700 dark:text-slate-200">
            records
          </div>
        </div>

        <div className="sm:ml-auto flex items-center gap-2">
          <div className="text-[13px] text-slate-700 dark:text-slate-200">
            Search:
          </div>
          <div className="relative w-full sm:w-[240px]">
            <SearchIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
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
        <table className="min-w-[1120px] w-full border-collapse">
          <thead>
            <tr>
              <Th>S No.</Th>
              <Th>Course Code</Th>
              <Th>Course Name</Th>
              <Th>Class Attended</Th>
              <Th>Attended Hours</Th>
              <Th>Total Class</Th>
              <Th>Total Hours</Th>
              <Th>%</Th>
              <Th>View</Th>
            </tr>
          </thead>

          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="py-10 text-center text-slate-500 dark:text-slate-400"
                >
                  No data available in table
                </td>
              </tr>
            ) : (
              pageRows.map((r, idx) => (
                <tr
                  key={`${r.courseCode}-${r.sno}`}
                  className={cn(
                    idx % 2 === 0
                      ? "bg-white dark:bg-slate-900"
                      : "bg-slate-50/60 dark:bg-slate-900/60",
                    "hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
                  )}
                >
                  <Td className="tabular-nums">{r.sno}</Td>
                  <Td className="font-semibold text-slate-900 dark:text-white">
                    {r.courseCode}
                  </Td>
                  <Td>{r.courseName}</Td>
                  <Td className="tabular-nums">{r.classAttended}</Td>
                  <Td className="tabular-nums">{r.attendedHours}</Td>
                  <Td className="tabular-nums">{r.totalClass}</Td>
                  <Td className="tabular-nums">{r.totalHours}</Td>
                  <Td>
                    <PercentPill percent={r.percent} />
                  </Td>
                  <Td>
                    <GhostButton onClick={() => openDetails(r)}>
                      Details
                    </GhostButton>
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

      <Modal
        open={detailModal.open}
        title={`Attendance Details - ${detailModal.row?.courseCode}`}
        onClose={closeDetails}
      >
        {detailModal.row && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/25 p-4">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {detailModal.row.courseName}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Course Code: {detailModal.row.courseCode}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Classes Attended</div>
                <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1 tabular-nums">
                  {detailModal.row.classAttended} / {detailModal.row.totalClass}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Attendance Hours</div>
                <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1 tabular-nums">
                  {detailModal.row.attendedHours} / {detailModal.row.totalHours}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Overall Percentage</div>
              <div className="text-3xl font-bold mt-1 tabular-nums" style={{ color: detailModal.row.percent >= 75 ? '#0891b2' : '#dc2626' }}>
                {detailModal.row.percent}%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Status: {detailModal.row.percent >= 75 ? 'Good Standing' : 'Low Attendance'}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
