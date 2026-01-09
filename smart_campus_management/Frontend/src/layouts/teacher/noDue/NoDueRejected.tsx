// src/layouts/teacher/nodue/NoDueRejected.tsx
import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2Icon, XCircleIcon, SearchIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

type TabKey = "Approved" | "Rejected";

type Row = {
  id: string;
  sno: number;
  regNo: string;
  studentName: string;
  courseCode: string;
  courseName: string;
  program: string;
  year: string;
  requestedOn: string; // DD/MM/YYYY
  status: TabKey;
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "px-3 py-3 text-left text-[12px] font-semibold",
        "text-slate-700 dark:text-slate-200",
        "bg-slate-50/95 dark:bg-slate-900/40",
        "border-b border-slate-200 dark:border-slate-800",
        "sticky top-0 z-10",
        className
      )}
    >
      {children}
    </th>
  );
}

function Td({ children, className = "", colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        "px-3 py-3 text-[13px] text-slate-800 dark:text-slate-100",
        "border-b border-slate-200/70 dark:border-slate-800/70",
        className
      )}
    >
      {children}
    </td>
  );
}

function ChipTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ring-1 transition",
        active
          ? "bg-white text-slate-900 ring-slate-300 shadow-sm dark:bg-slate-950 dark:text-white dark:ring-slate-700"
          : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-200 dark:ring-slate-800 dark:hover:bg-slate-900"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function StatusPill({ value }: { value: TabKey }) {
  const cls =
    value === "Approved"
      ? "bg-teal-500 text-white"
      : "bg-rose-500 text-white";

  return (
    <span className={cn("inline-flex items-center px-3 py-1 rounded text-xs font-semibold", cls)}>
      {value}
    </span>
  );
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return { total, slice: items.slice(start, end), start, end: Math.min(end, total) };
}

function matches(r: Row, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return (
    String(r.sno).includes(s) ||
    r.regNo.toLowerCase().includes(s) ||
    r.studentName.toLowerCase().includes(s) ||
    r.courseCode.toLowerCase().includes(s) ||
    r.courseName.toLowerCase().includes(s) ||
    r.program.toLowerCase().includes(s) ||
    r.year.toLowerCase().includes(s) ||
    r.requestedOn.toLowerCase().includes(s) ||
    r.status.toLowerCase().includes(s)
  );
}

export default function NoDueRejected() {
  // demo rows (wire to API later)
  const seed: Row[] = useMemo(
    () => [
      {
        id: "n1",
        sno: 1,
        regNo: "192325021",
        studentName: "PINAPALA CHOLA LAKSHMI NARASIMHA",
        courseCode: "CSA6416",
        courseName: "Google Cloud Certification for Devops",
        program: "ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING",
        year: "New Admission",
        requestedOn: "27/01/2025",
        status: "Approved",
      },
      {
        id: "n2",
        sno: 2,
        regNo: "192372052",
        studentName: "AJAY KUMAR J",
        courseCode: "CSA6416",
        courseName: "Google Cloud Certification for Devops",
        program: "COMPUTER SCIENCE AND ENGINEERING (ARTIFICIAL INTELLIGENCE)",
        year: "New Admission",
        requestedOn: "11/01/2025",
        status: "Approved",
      },
      {
        id: "n3",
        sno: 3,
        regNo: "192371234",
        studentName: "SAMPLE REJECTED STUDENT",
        courseCode: "CSA6416",
        courseName: "Google Cloud Certification for Devops",
        program: "INFORMATION TECHNOLOGY",
        year: "New Admission",
        requestedOn: "13/02/2025",
        status: "Rejected",
      },
    ],
    []
  );

  const [rows] = useState<Row[]>(seed);

  const [tab, setTab] = useState<TabKey>("Approved");
  const [q, setQ] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  // reset page when filters change
  useEffect(() => setPage(1), [tab, q, pageSize]);

  const filtered = useMemo(() => {
    return rows.filter((r) => r.status === tab).filter((r) => matches(r, q));
  }, [rows, tab, q]);

  const { total, slice, start, end } = useMemo(
    () => paginate(filtered, page, pageSize),
    [filtered, page, pageSize]
  );

  const showingText =
    total === 0
      ? "Showing 0 to 0 of 0 entries"
      : `Showing ${start + 1} to ${end} of ${total} entries`;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="w-full p-4 md:p-6 space-y-4">
      {/* Title */}
      <div className="text-[28px] font-light text-slate-700 dark:text-slate-100 leading-none">
        No Due Approval / Rejected List
      </div>

      {/* Tabs (Approved / Rejected) */}
      <div className="flex items-center gap-3">
        <ChipTab
          active={tab === "Approved"}
          icon={<CheckCircle2Icon size={16} className="text-slate-700 dark:text-slate-200" />}
          label="Approved"
          onClick={() => setTab("Approved")}
        />
        <ChipTab
          active={tab === "Rejected"}
          icon={<XCircleIcon size={16} className="text-slate-700 dark:text-slate-200" />}
          label="Rejected"
          onClick={() => setTab("Rejected")}
        />
      </div>

      {/* Subheading row like screenshot */}
      <div className="text-sm text-slate-800 dark:text-slate-200">
        <span className="font-semibold">{tab}</span>{" "}
        <span className="text-slate-500 dark:text-slate-400">No Due {tab}</span>
      </div>

      {/* Records + Search row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className={cn(
              "h-10 rounded-xl px-3 text-sm",
              "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
              "ring-1 ring-slate-200 dark:ring-slate-800",
              "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 dark:focus:ring-indigo-300/60"
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
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className={cn(
                "h-10 w-[240px] rounded-xl pl-9 pr-3 text-sm",
                "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
                "ring-1 ring-slate-200 dark:ring-slate-800",
                "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 dark:focus:ring-indigo-300/60"
              )}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-[0_12px_40px_-26px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1250px] w-full">
            <thead>
              <tr>
                <Th className="w-[70px]">SNo.</Th>
                <Th className="w-[140px]">RegNo.</Th>
                <Th className="min-w-[240px]">Student Name</Th>
                <Th className="w-[140px]">Course Code</Th>
                <Th className="min-w-[260px]">Course Name</Th>
                <Th className="min-w-[320px]">Program</Th>
                <Th className="w-[140px]">Year</Th>
                <Th className="w-[190px]">Student Requested On</Th>
                <Th className="w-[130px]">Status</Th>
              </tr>
            </thead>

            <tbody>
              {slice.length === 0 ? (
                <tr>
                  <Td colSpan={9} className="py-10 text-center text-slate-500 dark:text-slate-400">
                    No data available in table
                  </Td>
                </tr>
              ) : (
                slice.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={cn(
                      idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/20",
                      "hover:bg-slate-50 dark:hover:bg-slate-900/40 transition"
                    )}
                  >
                    <Td className="tabular-nums">{r.sno}</Td>
                    <Td className="tabular-nums">{r.regNo}</Td>
                    <Td>{r.studentName}</Td>
                    <Td className="font-medium">{r.courseCode}</Td>
                    <Td>{r.courseName}</Td>
                    <Td>{r.program}</Td>
                    <Td>{r.year}</Td>
                    <Td className="tabular-nums">{r.requestedOn}</Td>
                    <Td>
                      <StatusPill value={r.status} />
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer + Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-slate-600 dark:text-slate-300">{showingText}</div>

        <div className="flex items-center gap-1 justify-end">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={cn(
              "h-9 w-10 rounded-xl ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-950",
              "grid place-items-center hover:bg-slate-50 dark:hover:bg-slate-900 transition",
              !canPrev && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Previous"
          >
            <ChevronLeftIcon size={16} />
          </button>

          <div className="hidden sm:flex items-center gap-1">
            <span className="text-sm text-slate-600 dark:text-slate-300 px-2">
              {page} / {totalPages}
            </span>
          </div>

          <button
            type="button"
            disabled={!canNext}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={cn(
              "h-9 w-10 rounded-xl ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-950",
              "grid place-items-center hover:bg-slate-50 dark:hover:bg-slate-900 transition",
              !canNext && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Next"
          >
            <ChevronRightIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
