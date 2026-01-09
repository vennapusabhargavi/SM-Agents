// src/layouts/teacher/internalMarks/DeclareEnterMarks.tsx
import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:5000";
const TEACHER_API = `${API_BASE}/api/teacher`;

type StudentRow = {
  id: string;
  regNo: string;
  name: string;
};

type CourseOpt = { id: string; label: string };

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function isValidMark(v: string) {
  // allow "" while typing, but final submit should not be empty
  if (v.trim() === "") return true;
  // allow integer/decimal (no negative)
  if (!/^\d+(\.\d{0,2})?$/.test(v.trim())) return false;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 100;
}

export default function DeclareEnterMarks() {
  const [courses, setCourses] = useState<CourseOpt[]>([{ id: "", label: "--Select--" }]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [testName, setTestName] = useState("");
  const [competency, setCompetency] = useState("");
  const [courseId, setCourseId] = useState("");

  // default marks = "0"
  const [marks, setMarks] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    students.forEach((s) => (init[s.id] = "0"));
    return init;
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [pageError, setPageError] = useState<string>("");

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

  // Fetch enrolled students when course is selected
  useEffect(() => {
    if (!courseId) {
      setStudents([]);
      setMarks({});
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
          const studentList: StudentRow[] = (data.enrollments || []).map((e: any, idx: number) => ({
            id: `s${idx + 1}`,
            regNo: e.regNo || e.reg_no,
            name: e.studentName || e.student_name,
          }));
          setStudents(studentList);
          // Initialize marks with empty strings
          const initMarks: Record<string, string> = {};
          studentList.forEach((s) => (initMarks[s.id] = ""));
          setMarks(initMarks);
        }
      } catch (err) {
        console.error("Failed to fetch students", err);
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, [courseId]);

  const courseLabel = useMemo(
    () => courses.find((c) => c.id === courseId)?.label ?? "--Select--",
    [courses, courseId]
  );

  const onChangeMark = (id: string, v: string) => {
    // keep raw for typing, but guard against obviously invalid formats
    if (v === "" || /^\d+(\.\d{0,2})?$/.test(v)) {
      setMarks((p) => ({ ...p, [id]: v }));
    } else {
      // ignore extra characters (keeps UX clean)
      setMarks((p) => ({ ...p, [id]: p[id] ?? "0" }));
    }
  };

  const resetAll = () => {
    setTestName("");
    setCompetency("");
    setCourseId("");
    setStudents([]);
    setMarks({});
    setTouched({});
    setPageError("");
  };

  const submit = async () => {
    setPageError("");

    if (!testName.trim()) return setPageError("Please enter Name of the Test.");
    if (!courseId) return setPageError("Please select Course.");

    // final validation: no empty, numeric, 0..100
    for (const s of students) {
      const v = (marks[s.id] ?? "").trim();
      if (v === "") {
        setTouched((p) => ({ ...p, [s.id]: true }));
        return setPageError("Please fill the mark % without empty. Enter Zero if absent.");
      }
      if (!isValidMark(v)) {
        setTouched((p) => ({ ...p, [s.id]: true }));
        return setPageError("Please enter marks in % (only decimal or integer values, 0 to 100).");
      }
    }

    const payload = {
      testName: testName.trim(),
      competency: competency.trim(),
      courseId,
      courseLabel,
      marks: students.map((s, idx) => ({
        sNo: idx + 1,
        regNo: s.regNo,
        name: s.name,
        markPercent: Number(marks[s.id]),
      })),
    };

    // Submit to API
    try {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${TEACHER_API}/marks/declare-enter`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          courseId,
          testName: testName.trim(),
          marks: students.map((s, idx) => ({
            sNo: idx + 1,
            regNo: s.regNo,
            name: s.name,
            markPercent: Number(marks[s.id]),
          })),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save marks");
      }
      alert("Marks saved successfully.");
      resetAll();
    } catch (error) {
      console.error("Error saving marks:", error);
      alert(`Failed to save marks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
        Declare &amp; Enter Marks
      </h1>

      {/* Top form (matches screenshot layout, but polished) */}
      <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)]">
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left (Test + Competency) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-2 sm:gap-4 items-center">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <span className="text-rose-600 dark:text-rose-400">*</span>{" "}
                  Name of the Test
                </div>
                <input
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="Name of the Test"
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-2 sm:gap-4 items-center">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Competency Text
                </div>
                <input
                  value={competency}
                  onChange={(e) => setCompetency(e.target.value)}
                  placeholder="Competency"
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            {/* Right (Course) */}
            <div className="lg:col-span-4">
              <div className="grid grid-cols-1 sm:grid-cols-[90px_1fr] lg:grid-cols-1 gap-2 items-center">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 sm:text-right lg:text-left">
                  <span className="text-rose-600 dark:text-rose-400">*</span>{" "}
                  Course
                </div>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  disabled={loadingCourses}
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50"
                >
                  {courses.map((c) => (
                    <option key={c.id + c.label} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Selected: <span className="font-semibold">{courseLabel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions (center red like screenshot, but cleaner) */}
          <div className="mt-4 rounded-xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-500/10 px-4 py-3">
            <div className="text-sm font-semibold text-rose-700 dark:text-rose-200 text-center">
              Please enter marks in % (only decimal or integer values)
            </div>
            <div className="text-sm text-rose-700 dark:text-rose-200 text-center">
              Please fill the mark % without empty. Enter Zero if absent
            </div>
          </div>

          {pageError && (
            <div className="mt-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
              {pageError}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Students
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Showing 1 to {students.length} of {students.length} entries
          </div>
        </div>

        <div className="max-h-[560px] overflow-auto">
          {loadingStudents ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 dark:text-gray-300">Loading enrolled students...</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-white dark:bg-slate-950">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 w-[72px]">
                    S No.
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 w-[220px]">
                    Reg No.
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                    Student Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 w-[200px]">
                    Mark %
                  </th>
                </tr>
              </thead>

              <tbody>
              {students.map((s, idx) => {
                const v = marks[s.id] ?? "";
                const showErr = !!touched[s.id] && (v.trim() === "" || !isValidMark(v));
                return (
                  <tr
                    key={s.id}
                    className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition"
                  >
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {s.regNo}
                    </td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-50">
                      {s.name}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <input
                          value={v}
                          inputMode="decimal"
                          onChange={(e) => onChangeMark(s.id, e.target.value)}
                          onBlur={() => setTouched((p) => ({ ...p, [s.id]: true }))}
                          className={clsx(
                            "h-10 w-full rounded-xl border bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2",
                            showErr
                              ? "border-rose-300 dark:border-rose-900/60 focus:ring-rose-500/25"
                              : "border-slate-200 dark:border-slate-800 focus:ring-indigo-500/30"
                          )}
                          placeholder="0"
                          aria-label={`Mark percent for ${s.regNo}`}
                        />
                        {showErr && (
                          <div className="mt-1 text-[11px] text-rose-600 dark:text-rose-300">
                            Enter 0–100 (integer/decimal). Keep not empty.
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-center gap-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
          <button
            type="button"
            onClick={submit}
            className="h-10 px-6 rounded-xl bg-gradient-to-r from-slate-800 via-slate-900 to-indigo-900 text-white text-sm font-semibold shadow-sm hover:opacity-95 active:scale-[0.99] transition"
          >
            Save Marks
          </button>
          <button
            type="button"
            onClick={resetAll}
            className="h-10 px-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-900 transition"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
