// src/layouts/student/attendance/StudentAttendanceReport.tsx
import React, { useEffect, useMemo, useState } from "react";
import { EyeIcon, XIcon } from "lucide-react";

type Row = {
  sno: number;
  courseCode: string;
  courseName: string;
  classAttended: number;
  attendedHours: number;
  totalClass: number;
  totalHours: number;
};

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost/smart_campus_api";
const STUDENT_API = `${API_BASE}/api/student`;

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function pct(row: Row) {
  if (!row.totalHours) return 0;
  return Math.round((row.attendedHours / row.totalHours) * 100);
}

function Pill({ value }: { value: number }) {
  const isLow = value < 75;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[62px]",
        "px-2.5 py-1 rounded-full text-[11px] font-bold ring-1 shadow-sm",
        isLow
          ? "bg-rose-100 text-rose-800 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-200 dark:ring-rose-900/40"
          : "bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-900/40"
      )}
    >
      {value} %
    </span>
  );
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "sticky top-0 z-[1]",
        "bg-slate-50 dark:bg-slate-800",
        "text-[12px] font-semibold text-slate-700 dark:text-slate-200",
        "px-4 py-3 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap",
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
        "px-4 py-3 text-[13px] text-slate-700 dark:text-slate-200",
        "border-b border-slate-200/80 dark:border-slate-800",
        className
      )}
    >
      {children}
    </td>
  );
}

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <div
        className="absolute inset-0 bg-black/35"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-0 p-4 md:p-6 flex items-center justify-center">
        <div className="w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
            <div className="text-[14px] font-semibold text-slate-900 dark:text-white">
              {title}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40"
              aria-label="Close"
            >
              <XIcon size={18} />
            </button>
          </div>

          <div className="p-4 md:p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

const dummyRows: Row[] = [
  { sno: 1, courseCode: "CS101", courseName: "Introduction to Computer Science", classAttended: 8, attendedHours: 16, totalClass: 10, totalHours: 20 },
  { sno: 2, courseCode: "CS102", courseName: "Data Structures", classAttended: 7, attendedHours: 14, totalClass: 10, totalHours: 20 },
  { sno: 3, courseCode: "CS103", courseName: "Algorithms", classAttended: 9, attendedHours: 18, totalClass: 10, totalHours: 20 },
];

export function StudentAttendanceReport() {
  const [rows, setRows] = useState<Row[]>(() => {
    const stored = localStorage.getItem("studentAttendanceReport");
    return stored ? JSON.parse(stored) : dummyRows;
  });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Row | null>(null);

  // Commented to show dummy data
  // useEffect(() => {
  //   const token = localStorage.getItem("authToken");
  //   const headers: Record<string, string> = {};
  //   if (token) headers.Authorization = `Bearer ${token}`;
  //   fetch(`${STUDENT_API}/attendance/report`, { headers })
  //     .then((r) => (r.ok ? r.json() : null))
  //     .then((json) => {
  //       if (json?.rows) setRows(json.rows as Row[]);
  //     })
  //     .catch(() => {});
  // }, []);

  useEffect(() => {
    localStorage.setItem("studentAttendanceReport", JSON.stringify(rows));
  }, [rows]);

  const openDetails = (r: Row) => {
    setActive(r);
    setOpen(true);
  };

  const totalEntries = rows.length;
  const showingText =
    totalEntries === 0
      ? "Showing 0 to 0 of 0 entries"
      : `Showing 1 to ${totalEntries} of ${totalEntries} entries`;

  return (
    <div className="w-full p-4 md:p-6 space-y-4">
      {/* Title (our style) */}
      <div>
        <div className="text-[28px] font-light text-slate-700 dark:text-slate-100 leading-none">
          Attendance Report
        </div>
        <div className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
          Course-wise attendance summary
        </div>
      </div>

      {/* Table */}
      <TableShell>
        <table className="min-w-[980px] w-full border-collapse">
          <thead>
            <tr>
              <Th className="w-[70px]">S No.</Th>
              <Th className="w-[140px]">Course Code</Th>
              <Th className="min-w-[280px]">Course Name</Th>
              <Th className="w-[150px]">Class Attended</Th>
              <Th className="w-[150px]">Attended Hours</Th>
              <Th className="w-[120px]">Total Class</Th>
              <Th className="w-[120px]">Total Hours</Th>
              <Th className="w-[90px]">%</Th>
              <Th className="w-[120px] text-center">View</Th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, idx) => {
              const p = pct(r);
              return (
                <tr
                  key={r.sno}
                  className={cn(
                    idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/60 dark:bg-slate-900/60",
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
                    <Pill value={p} />
                  </Td>
                  <Td className="text-center">
                    <button
                      type="button"
                      onClick={() => openDetails(r)}
                      className={cn(
                        "inline-flex items-center justify-center gap-2",
                        "rounded-full px-3 py-1.5",
                        "text-[12px] font-semibold text-white",
                        "bg-teal-600 hover:bg-teal-700",
                        "shadow-sm transition",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50"
                      )}
                    >
                      <EyeIcon size={14} />
                      Details
                    </button>
                  </Td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <Td className="py-10 text-center text-slate-500" colSpan={9}>
                  No attendance records found.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </TableShell>

      {/* Footer text */}
      <div className="text-[13px] text-slate-600 dark:text-slate-300">{showingText}</div>

      {/* Details modal */}
      <Modal open={open} title="Attendance Details" onClose={() => setOpen(false)}>
        {active && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
              <div className="text-[13px] font-semibold text-slate-900 dark:text-white">
                {active.courseCode} — {active.courseName}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Summary for your course attendance.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400">Class Attended</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {active.classAttended} / {active.totalClass}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400">Hours Attended</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {active.attendedHours} / {active.totalHours}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:col-span-2">
                <div className="text-xs text-slate-500 dark:text-slate-400">Attendance %</div>

                <div className="mt-2 flex items-center gap-3">
                  <Pill value={pct(active)} />
                  <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={cn(
                        "h-full",
                        pct(active) < 75 ? "bg-rose-500" : "bg-emerald-500"
                      )}
                      style={{ width: `${Math.min(100, pct(active))}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 w-14 text-right tabular-nums">
                    {pct(active)}%
                  </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Note: Keep attendance above 75% to remain eligible (policy may vary by department).
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={cn(
                  "h-10 px-4 rounded-xl",
                  "border border-slate-200 dark:border-slate-800",
                  "bg-white dark:bg-slate-900",
                  "hover:bg-slate-50 dark:hover:bg-slate-800/60",
                  "transition text-[13px] font-semibold",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40"
                )}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default StudentAttendanceReport;
