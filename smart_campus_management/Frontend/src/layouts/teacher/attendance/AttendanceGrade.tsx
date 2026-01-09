// src/layouts/teacher/AttendanceGrade.tsx
import React, { useMemo, useState } from "react";
import { ChevronDownIcon, CheckCircle2Icon, XCircleIcon } from "lucide-react";

type Course = { id: string; code: string; name: string };
type StudentRow = {
  sno: number;
  regNo: string;
  studentName: string;
  grade: "" | "A" | "B" | "C" | "D" | "E" | "U";
};

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function PageTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="text-[32px] font-light text-slate-700 dark:text-slate-100 leading-none">
        {title}
      </div>
      {subtitle ? (
        <div className="mt-2 text-[13px] text-slate-500 dark:text-slate-400">
          {subtitle}
        </div>
      ) : null}
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

function PrimaryButton({
  children,
  onClick,
  disabled,
  tone = "teal",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "teal" | "amber";
}) {
  const cls =
    tone === "teal"
      ? "bg-teal-600 hover:bg-teal-700 active:bg-teal-800 focus-visible:ring-teal-400/50"
      : "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 focus-visible:ring-amber-400/50";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!!disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl",
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
        "inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl",
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

function Toast({
  kind,
  title,
  onClose,
}: {
  kind: "success" | "error";
  title: string;
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
      {kind === "success" ? (
        <CheckCircle2Icon size={18} />
      ) : (
        <XCircleIcon size={18} />
      )}
      <div className="flex-1">{title}</div>
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

export default function AttendanceGrade() {
  // demo courses
  const courses: Course[] = useMemo(
    () => [
      { id: "c1", code: "MMA1254", name: "Mentor Mentee Meeting" },
      { id: "c2", code: "ECA03", name: "Signals and Systems" },
      { id: "c3", code: "ECA15", name: "Transmission Lines And Waveguides" },
    ],
    []
  );

  // demo “students per course”
  const studentsByCourse: Record<string, StudentRow[]> = useMemo(
    () => ({
      c1: [],
      c2: [
        { sno: 1, regNo: "192211856", studentName: "KARMURI SRI RAMCHARAN REDDY", grade: "" },
        { sno: 2, regNo: "192124073", studentName: "PASALA THRIBHUVAN REDDY", grade: "B" },
        { sno: 3, regNo: "192213301", studentName: "KAPPALA ABHISHEK DASS", grade: "A" },
      ],
      c3: [
        { sno: 1, regNo: "192300111", studentName: "STUDENT NAME 1", grade: "" },
        { sno: 2, regNo: "192300112", studentName: "STUDENT NAME 2", grade: "" },
      ],
    }),
    []
  );

  const [courseId, setCourseId] = useState<string>(courses[0]?.id ?? "");
  const [rows, setRows] = useState<StudentRow[]>(() => studentsByCourse[courses[0]?.id ?? "c1"] ?? []);
  const [toast, setToast] = useState<{ kind: "success" | "error"; msg: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // keep rows in sync when course changes
  React.useEffect(() => {
    setRows(studentsByCourse[courseId] ? [...studentsByCourse[courseId]] : []);
  }, [courseId, studentsByCourse]);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === courseId),
    [courses, courseId]
  );

  const hasAnyRows = rows.length > 0;

  const setGrade = (idx: number, grade: StudentRow["grade"]) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, grade } : r)));
  };

  const clear = () => {
    setRows((prev) => prev.map((r) => ({ ...r, grade: "" })));
    setToast(null);
  };

  const submit = async () => {
    setToast(null);

    if (!hasAnyRows) {
      setToast({ kind: "error", msg: "No students available for this course." });
      return;
    }

    const missing = rows.filter((r) => !r.grade);
    if (missing.length > 0) {
      setToast({
        kind: "error",
        msg: `Please select grade for all students (${missing.length} missing).`,
      });
      return;
    }

    setSubmitting(true);
    try {
      // ✅ wire to backend later:
      // await fetch("/api/teacher/grades", { method:"POST", headers:{...}, body: JSON.stringify({ courseId, rows }) })
      await new Promise((r) => setTimeout(r, 650));

      setToast({
        kind: "success",
        msg: `Grades submitted for ${selectedCourse?.code ?? "course"} (${rows.length} student(s)).`,
      });
    } catch {
      setToast({ kind: "error", msg: "Submission failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full p-4 md:p-6 space-y-5">
      <PageTitle title="Grade Marking" />

      {/* Course filter row (no card background, like your screenshot header row) */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="sm:w-[120px] text-[13px] font-semibold text-rose-600">
          Course
        </div>

        <div className="relative w-full sm:max-w-[520px]">
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className={cn(
              "w-full h-11 rounded-xl px-3 pr-10 text-[13px]",
              "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100",
              "border border-slate-300/80 dark:border-slate-700",
              "shadow-inner",
              "focus:outline-none focus:ring-2 focus:ring-slate-400/30 dark:focus:ring-slate-500/30",
              "transition"
            )}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}-{c.name}
              </option>
            ))}
          </select>

          <ChevronDownIcon
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>
      </div>

      {/* Table */}
      <TableShell>
        <table className="min-w-[920px] w-full border-collapse">
          <thead>
            <tr>
              <Th>S No.</Th>
              <Th>Reg No.</Th>
              <Th>Student Name</Th>
              <Th>Grade</Th>
            </tr>
          </thead>

          <tbody>
            {!hasAnyRows ? (
              <tr>
                <Td colSpan={4 as any} className="py-10 text-center">
                  <div className="text-[13px] text-slate-700 dark:text-slate-200">
                    No data available in table
                  </div>
                </Td>
              </tr>
            ) : (
              rows.map((r, idx) => (
                <tr
                  key={`${r.regNo}-${idx}`}
                  className={cn(
                    idx % 2 === 0
                      ? "bg-white dark:bg-slate-900"
                      : "bg-slate-50/60 dark:bg-slate-900/60",
                    "hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
                  )}
                >
                  <Td className="tabular-nums">{r.sno}</Td>
                  <Td className="tabular-nums">{r.regNo}</Td>
                  <Td className="font-semibold text-slate-900 dark:text-white">
                    {r.studentName}
                  </Td>
                  <Td>
                    <div className="relative max-w-[220px]">
                      <select
                        value={r.grade}
                        onChange={(e) =>
                          setGrade(idx, e.target.value as StudentRow["grade"])
                        }
                        className={cn(
                          "w-full h-10 rounded-xl px-3 pr-9 text-[13px]",
                          "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100",
                          "border border-slate-300/80 dark:border-slate-700",
                          "shadow-inner",
                          "focus:outline-none focus:ring-2 focus:ring-slate-400/30 dark:focus:ring-slate-500/30",
                          "transition"
                        )}
                      >
                        <option value="">-- Select --</option>
                        {["A", "B", "C", "D", "E", "U"].map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableShell>

      {/* Footer line like “showing 0 to 0…” */}
      <div className="text-[13px] text-slate-600 dark:text-slate-300 text-center">
        Showing {hasAnyRows ? 1 : 0} to {hasAnyRows ? rows.length : 0} of{" "}
        {rows.length} entries
      </div>

      {/* Actions (centered like screenshot) */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <PrimaryButton onClick={submit} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit"}
        </PrimaryButton>
        <PrimaryButton onClick={clear} tone="amber" disabled={submitting}>
          Clear
        </PrimaryButton>
      </div>

      {toast && (
        <div className="max-w-3xl mx-auto pt-2">
          <Toast
            kind={toast.kind}
            title={toast.msg}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </div>
  );
}
