// src/layouts/faculty/EditUpdateMarks.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ChevronDownIcon, SaveIcon, EraserIcon, InfoIcon } from "lucide-react";

const API_BASE = "http://localhost:5000";
const TEACHER_API = `${API_BASE}/api/teacher`;

type CourseOpt = { id: string; label: string };
type TestOpt = { id: string; label: string };

type MarkRow = {
  sno: number;
  regNo: string;
  studentName: string;
  mark: string; // keep string for input control
};

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function PageTitle({ title }: { title: string }) {
  return (
    <div className="mb-4">
      <div className="text-[32px] font-light text-slate-700 dark:text-slate-100 leading-none">
        {title}
      </div>
    </div>
  );
}

function toastMsg(setToast: React.Dispatch<React.SetStateAction<string>>, msg: string) {
  setToast(msg);
  window.setTimeout(() => setToast(""), 2400);
}

function isValidPercent(val: string) {
  if (!val.trim()) return false;
  // allow integer or decimal, 0..100 inclusive
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(val.trim())) return false;
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 && n <= 100;
}

function clampPercentString(val: string) {
  const v = val.trim();
  if (!v) return "";
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  const c = Math.max(0, Math.min(100, n));
  // keep up to 2 decimals if user typed decimals
  return v.includes(".") ? String(Math.round(c * 100) / 100) : String(Math.round(c));
}

export default function EditUpdateMarks() {
  const [courses, setCourses] = useState<CourseOpt[]>([{ id: "", label: "--Select--" }]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [tests, setTests] = useState<TestOpt[]>([{ id: "", label: "--Select--" }]);
  const [loadingTests, setLoadingTests] = useState(false);

  const [courseId, setCourseId] = useState<string>("");
  const [testId, setTestId] = useState<string>("");
  const [competencyText, setCompetencyText] = useState("NA");

  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);

  const [rows, setRows] = useState<MarkRow[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [dirty, setDirty] = useState(false);

  // Fetch approved courses for the teacher
  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const token = localStorage.getItem("authToken");
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${TEACHER_API}/courses`, { headers });
        if (res.ok) {
          const data = await res.json();
          const courseOpts = data.courses
            .filter((c: any) => c.approval_status === 'APPROVED')
            .map((c: any) => ({
              id: c.id.toString(),
              label: `${c.code} - ${c.title}`
            }));
          setCourses([{ id: "", label: "--Select--" }, ...courseOpts]);
        }
      } catch (err) {
        console.error("Failed to fetch courses", err);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  // Fetch tests for selected course - placeholder for now, can be expanded
  useEffect(() => {
    if (!courseId) {
      setTests([{ id: "", label: "--Select--" }]);
      return;
    }

    // For now, using static tests. This could be made dynamic based on course
    setTests([
      { id: "", label: "--Select--" },
      { id: "assignment", label: "Assignment" },
      { id: "presentation", label: "Presentation" },
      { id: "quiz1", label: "Quiz 1" },
      { id: "quiz2", label: "Quiz 2" },
      { id: "level1", label: "Level 1" },
      { id: "level2", label: "Level 2" },
      { id: "level3", label: "Level 3" },
      { id: "viva", label: "Viva" },
      { id: "debug", label: "Debug" },
      { id: "class_practical", label: "Class Practical" },
      { id: "capstone_project", label: "Capstone Project" },
    ]);
  }, [courseId]);

  // Fetch enrolled students when course is selected
  useEffect(() => {
    if (!courseId) {
      setRows([]);
      return;
    }

    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const token = localStorage.getItem("authToken");
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${TEACHER_API}/enrollment/approved?course_id=${courseId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          const studentRows: MarkRow[] = (data.enrollments || []).map((e: any, idx: number) => ({
            sno: idx + 1,
            regNo: e.regNo || e.reg_no,
            studentName: e.studentName || e.student_name,
            mark: "",
          }));
          setRows(studentRows);
        }
      } catch (err) {
        console.error("Failed to fetch students", err);
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, [courseId]);

  // Fetch existing marks when test is selected
  useEffect(() => {
    if (!courseId || !testId) return;

    const fetchMarks = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${TEACHER_API}/marks?course_id=${courseId}&test_name=${testId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          // Update existing rows with fetched marks
          setRows((prevRows) =>
            prevRows.map((row) => {
              const existingMark = data.marks?.find((m: any) => m.reg_no === row.regNo);
              return {
                ...row,
                mark: existingMark ? String(existingMark.mark) : row.mark,
              };
            })
          );
        }
      } catch (err) {
        console.error("Failed to fetch marks", err);
      }
    };
    fetchMarks();
  }, [courseId, testId]);

  const invalidCount = useMemo(() => rows.filter((r) => !isValidPercent(r.mark)).length, [rows]);

  const onChangeMark = (sno: number, next: string) => {
    // allow typing like "." / "0." temporarily but keep reasonable chars
    const safe = next.replace(/[^\d.]/g, "");
    // prevent multiple dots
    const parts = safe.split(".");
    const normalized = parts.length <= 2 ? safe : `${parts[0]}.${parts.slice(1).join("")}`;

    setRows((prev) => prev.map((r) => (r.sno === sno ? { ...r, mark: normalized } : r)));
    setDirty(true);
  };

  const onBlurMark = (sno: number) => {
    setRows((prev) =>
      prev.map((r) => (r.sno === sno ? { ...r, mark: clampPercentString(r.mark) } : r))
    );
  };

  const onClear = () => {
    setRows((prev) => prev.map((r) => ({ ...r, mark: "" })));
    setDirty(true);
    toastMsg(setToast, "Cleared marks.");
  };

  const onSubmit = async () => {
    if (!courseId) return toastMsg(setToast, "Please select course.");
    if (!testId) return toastMsg(setToast, "Please select test name.");
    if (invalidCount > 0) return toastMsg(setToast, "Fix invalid marks before submit.");

    setSaving(true);
    try {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const payload = {
        course_id: courseId,
        test_name: testId,
        competency_text: competencyText,
        marks: rows.map(r => ({
          reg_no: r.regNo,
          mark: parseFloat(r.mark) || 0
        }))
      };

      const res = await fetch(`${TEACHER_API}/marks/update`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setDirty(false);
        toastMsg(setToast, "Marks updated successfully.");
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update marks");
      }
    } catch (err: any) {
      console.error("Submit error:", err);
      toastMsg(setToast, err.message || "Failed to update marks. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full p-4 md:p-6">
      <PageTitle title="Edit or Update Marks" />

      {/* top form (no card background) */}
      <div className="max-w-[1200px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-4 items-start">
          {/* LEFT: Course + Competency */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] items-center gap-3">
              <div className="text-[13px] text-rose-600 font-medium md:text-right">Course</div>
              <div className="relative w-full max-w-[520px]">
                <select
                  value={courseId}
                  onChange={(e) => {
                    setCourseId(e.target.value);
                    setTestId(""); // Reset test selection when course changes
                    setCompetencyText("NA");
                  }}
                  disabled={loadingCourses}
                  className={cn(
                    "w-full h-10 rounded-sm px-3 pr-10 text-[13px]",
                    "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100",
                    "border border-slate-200 dark:border-slate-800 shadow-inner",
                    "focus:outline-none focus:ring-2 focus:ring-slate-400/25 dark:focus:ring-slate-500/25",
                    loadingCourses && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {courses.map((c) => (
                    <option key={c.id || "empty"} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] items-center gap-3">
              <div className="text-[13px] text-rose-600 font-medium md:text-right">
                Competency Text
              </div>
              <input
                value={competencyText}
                onChange={(e) => setCompetencyText(e.target.value)}
                className={cn(
                  "w-full max-w-[520px] h-10 rounded-sm px-3 text-[13px]",
                  "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100",
                  "border border-slate-200 dark:border-slate-800 shadow-inner",
                  "focus:outline-none focus:ring-2 focus:ring-slate-400/25 dark:focus:ring-slate-500/25"
                )}
              />
            </div>
          </div>

          {/* RIGHT: Test Name */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] items-center gap-3">
              <div className="text-[13px] text-rose-600 font-medium md:text-right">Test Name</div>
              <div className="relative w-full max-w-[420px]">
                <select
                  value={testId}
                  onChange={(e) => setTestId(e.target.value)}
                  className={cn(
                    "w-full h-10 rounded-sm px-3 pr-10 text-[13px]",
                    "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100",
                    "border border-slate-200 dark:border-slate-800 shadow-inner",
                    "focus:outline-none focus:ring-2 focus:ring-slate-400/25 dark:focus:ring-slate-500/25"
                  )}
                >
                  {tests.map((t) => (
                    <option key={t.id || "empty"} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* hint line */}
        <div className="mt-4 flex items-center justify-center">
          <div className="text-[13px] text-rose-600">
            Please enter marks in % . ( only decimal or integer values)
          </div>
        </div>

        {/* table */}
        <div className="mt-6">
          <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full border-collapse">
                <thead>
                  <tr className="bg-white dark:bg-slate-950">
                    <th className="w-[70px] px-3 py-2.5 text-left text-[13px] font-semibold border-b border-slate-200 dark:border-slate-800">
                      S No.
                    </th>
                    <th className="w-[210px] px-3 py-2.5 text-left text-[13px] font-semibold border-b border-slate-200 dark:border-slate-800">
                      Reg No.
                    </th>
                    <th className="px-3 py-2.5 text-left text-[13px] font-semibold border-b border-slate-200 dark:border-slate-800">
                      Student Name
                    </th>
                    <th className="w-[220px] px-3 py-2.5 text-left text-[13px] font-semibold border-b border-slate-200 dark:border-slate-800">
                      Mark %
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loadingStudents ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-10 text-center text-[13px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 border-t-slate-600 dark:border-t-slate-300 rounded-full animate-spin"></div>
                          Loading students...
                        </div>
                      </td>
                    </tr>
                  ) : rows.length > 0 ? (
                    rows.map((r) => {
                      const ok = !r.mark.trim() ? false : isValidPercent(r.mark);
                      return (
                        <tr key={r.sno} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                          <td className="px-3 py-3 text-[13px] border-b border-slate-200 dark:border-slate-800">
                            {r.sno}
                          </td>
                          <td className="px-3 py-3 text-[13px] border-b border-slate-200 dark:border-slate-800">
                            {r.regNo}
                          </td>
                          <td className="px-3 py-3 text-[13px] border-b border-slate-200 dark:border-slate-800">
                            <div className="text-center">{r.studentName}</div>
                          </td>
                          <td className="px-3 py-2.5 border-b border-slate-200 dark:border-slate-800">
                            <input
                              value={r.mark}
                              onChange={(e) => onChangeMark(r.sno, e.target.value)}
                              onBlur={() => onBlurMark(r.sno)}
                              inputMode="decimal"
                              disabled={!courseId || !testId}
                              className={cn(
                                "w-[160px] h-9 rounded-sm px-3 text-[13px]",
                                "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100",
                                "border shadow-inner outline-none",
                                ok
                                  ? "border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-slate-400/25 dark:focus:ring-slate-500/25"
                                  : "border-rose-400 focus:ring-2 focus:ring-rose-300/40",
                                (!courseId || !testId) && "opacity-60 cursor-not-allowed"
                              )}
                              placeholder=""
                              aria-label={`Mark percent for ${r.regNo}`}
                            />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-10 text-center text-[13px] text-slate-500 dark:text-slate-400"
                      >
                        {courseId ? "No enrolled students found for this course." : "Please select a course to view students."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* actions (centered like screenshot) */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onSubmit}
              disabled={saving || invalidCount > 0 || !dirty}
              className={cn(
                "h-9 px-4 rounded-sm text-[12.5px] font-semibold text-white",
                "bg-teal-600 hover:bg-teal-700 active:bg-teal-800",
                "shadow-sm transition",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "inline-flex items-center gap-2"
              )}
              title={
                invalidCount > 0
                  ? "Fix invalid marks"
                  : !dirty
                  ? "No changes"
                  : "Submit marks"
              }
            >
              <SaveIcon size={16} />
              {saving ? "Submitting..." : "Submit"}
            </button>

            <button
              type="button"
              onClick={onClear}
              disabled={saving}
              className={cn(
                "h-9 px-4 rounded-sm text-[12.5px] font-semibold text-slate-900",
                "bg-amber-400 hover:bg-amber-500 active:bg-amber-600",
                "shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed",
                "inline-flex items-center gap-2"
              )}
            >
              <EraserIcon size={16} />
              Clear
            </button>
          </div>

          {/* small inline validity note */}
          <div className="mt-3 flex items-center justify-center gap-2 text-[12.5px] text-slate-600 dark:text-slate-300">
            <InfoIcon size={14} className="text-slate-400" />
            <span>
              Valid range: <span className="font-semibold">0</span> to{" "}
              <span className="font-semibold">100</span> (up to 2 decimals).
              {invalidCount > 0 && (
                <span className="text-rose-600 font-semibold">
                  {" "}
                  • {invalidCount} invalid value(s)
                </span>
              )}
            </span>
          </div>
        </div>

        {/* toast */}
        {toast && (
          <div className="fixed bottom-5 right-5 z-[60]">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl px-4 py-3">
              <div className="text-[13px] text-slate-800 dark:text-slate-100">{toast}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
