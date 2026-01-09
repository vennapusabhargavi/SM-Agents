// src/layouts/teacher/attendance/AttendanceMarking.tsx
import React, { useMemo, useState, useEffect } from "react";
import type { ReactNode } from "react";

// Suppress console.error to prevent logs
console.error = () => {};

type StudentRow = {
  sno: number;
  regNo: string;
  name: string;
};

type CourseOption = {
  id: string;
  label: string;
};

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function AttendanceMarking() {
  const [courseId, setCourseId] = useState("CS101");
  const [courses, setCourses] = useState<CourseOption[]>([
    { id: "CS101", label: "CS101 - Introduction to Computer Science" },
    { id: "CS102", label: "CS102 - Data Structures" },
    { id: "CS103", label: "CS103 - Algorithms" },
  ]);
  const [students, setStudents] = useState<StudentRow[]>([
    { sno: 1, regNo: "19221314", name: "Alice Johnson" },
    { sno: 2, regNo: "19221315", name: "Bob Smith" },
    { sno: 3, regNo: "19231316", name: "Charlie Brown" },
    { sno: 4, regNo: "19221317", name: "Diana Prince" },
    { sno: 5, regNo: "19231318", name: "Eve Wilson" },
  ]);

  // Commented to show dummy courses
  // useEffect(() => {
  //   const fetchCourses = async () => {
  //     try {
  //       const token = localStorage.getItem("authToken");
  //       const headers: Record<string, string> = {};
  //       if (token) headers.Authorization = `Bearer ${token}`;
  //       const res = await fetch("/api/teacher/courses", { headers });
  //       if (res.ok) {
  //         const data = await res.json();
  //         const mapped: CourseOption[] = (data.courses || []).filter((c: any) => c.approval_status === 'APPROVED').map((c: any) => ({
  //           id: c.code,
  //           label: `${c.code} - ${c.title}`
  //         }));
  //         setCourses(mapped);
  //         if (mapped.length > 0) setCourseId(mapped[0].id);
  //       }
  //     } catch (err) {
  //       console.error("Failed to fetch courses", err);
  //     }
  //   };
  //   fetchCourses();
  // }, []);

  // Commented to show dummy students
  // useEffect(() => {
  //   if (!courseId) return;
  //   const fetchStudents = async () => {
  //     try {
  //       const token = localStorage.getItem("authToken");
  //       const headers: Record<string, string> = {};
  //       if (token) headers.Authorization = `Bearer ${token}`;
  //       const res = await fetch("/api/teacher/enrollment/approved?course_id=" + courseId, { headers });
  //       if (res.ok) {
  //         const data = await res.json();
  //         const mapped: StudentRow[] = (data.enrollments || []).map((e: any, idx: number) => ({
  //           sno: idx + 1,
  //           regNo: e.regNo || e.reg_no,
  //           name: e.studentName || e.student_name,
  //         }));
  //         setStudents(mapped);
  //         setPresentMap(Object.fromEntries(mapped.map((s) => [s.regNo, true])));
  //       }
  //     } catch (err) {
  //       console.error("Failed to fetch students", err);
  //     }
  //   };
  //   fetchStudents();
  // }, [courseId]);

  // Load approved ODs from localStorage
  const approvedODs = useMemo(() => {
    try {
      const stored = localStorage.getItem("approvedODs");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  // Check if student has approved OD for today
  const getStudentODStatus = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    return (regNo: string) => {
      return approvedODs.some((od: any) =>
        od.regNo === regNo &&
        od.status === "approved" &&
        isDateInRange(todayStr, od.startDate, od.endDate)
      );
    };
  }, [approvedODs]);

  // Helper function to check if date falls within OD range
  function isDateInRange(checkDate: string, startDate: string, endDate: string) {
    const check = new Date(checkDate);
    const start = new Date(startDate.split('/').reverse().join('-')); // Convert DD/MM/YYYY to YYYY-MM-DD
    const end = new Date(endDate.split('/').reverse().join('-'));

    return check >= start && check <= end;
  }

  // ✅ true = Present (tick), false = Absent (no tick)
  // OD students are automatically marked as present and cannot be toggled
  const [presentMap, setPresentMap] = useState<Record<string, boolean>>(() => {
    const stored = localStorage.getItem("attendancePresentMap");
    return stored ? JSON.parse(stored) : Object.fromEntries(students.map((s) => [s.regNo, true]));
  });

  const [savedSlots, setSavedSlots] = useState<Record<string, number>>(() => {
    const stored = localStorage.getItem("savedSlots");
    return stored ? JSON.parse(stored) : {};
  });

  const totals = useMemo(() => {
    let present = 0;
    let absent = 0;
    let onDuty = 0;

    for (const s of students) {
      if (getStudentODStatus(s.regNo)) {
        onDuty += 1;
        present += 1; // OD students are considered present
      } else if (presentMap[s.regNo]) {
        present += 1;
      } else {
        absent += 1;
      }
    }

    return { present, absent, onDuty, total: students.length };
  }, [presentMap, students, getStudentODStatus]);

  const toggle = (regNo: string) => {
    // Don't allow toggling for OD students
    if (getStudentODStatus(regNo)) return;
    setPresentMap((prev) => {
      const next = { ...prev, [regNo]: !prev[regNo] };
      localStorage.setItem("attendancePresentMap", JSON.stringify(next));
      return next;
    });
  };

  const markAllPresent = () => {
    const next: Record<string, boolean> = {};
    for (const s of students) next[s.regNo] = true;
    localStorage.setItem("attendancePresentMap", JSON.stringify(next));
    setPresentMap(next);
  };

  const markAllAbsent = () => {
    const next: Record<string, boolean> = {};
    for (const s of students) {
      // Don't mark OD students as absent
      next[s.regNo] = getStudentODStatus(s.regNo) ? true : false;
    }
    localStorage.setItem("attendancePresentMap", JSON.stringify(next));
    setPresentMap(next);
  };

  const handleSave = () => {
    // Simulate saving attendance
    const updated = { ...savedSlots, [courseId]: Date.now() };
    setSavedSlots(updated);
    localStorage.setItem("savedSlots", JSON.stringify(updated));
    alert("Attendance saved successfully.");
  };

  const courseLabel = courses.find((c) => c.id === courseId)?.label ?? courseId;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Attendance Marking
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tick only for present. Unticked = absent.
          </p>
        </div>

        {/* Minimal counts (no icons, no dots) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-200">
            Present: {totals.present}
          </span>
          <span className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-200">
            Absent: {totals.absent}
          </span>
          {totals.onDuty > 0 && (
            <span className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-3 py-1.5 shadow-sm text-xs font-semibold text-amber-700 dark:text-amber-300">
              On Duty: {totals.onDuty}
            </span>
          )}
          <span className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-200">
            Total: {totals.total}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          {/* Course & Date selects */}
          <div className="flex flex-col gap-4">
            {/* Course select */}
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 w-[60px]">
                <span className="text-rose-600 dark:text-rose-400">*</span> Course
              </div>

              <div className="min-w-[260px] w-full sm:w-[420px]">
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/35"
                  aria-label="Select course"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                  Selected: {courseLabel}
                </div>
              </div>
            </div>


          </div>

          {/* Actions (text-only) */}
          <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
            <button
              type="button"
              onClick={markAllPresent}
              className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Mark all Present
            </button>
            <button
              type="button"
              onClick={markAllAbsent}
              className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Mark all Absent
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="h-10 px-4 rounded-xl bg-gradient-to-r from-indigo-700 via-sky-600 to-blue-600 text-white text-sm font-semibold shadow-sm hover:opacity-95 active:scale-[0.99] transition"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Table or Marked Message */}
      {(savedSlots[courseId] && Date.now() - savedSlots[courseId] < 2 * 60 * 60 * 1000 ? (
        <div className="mt-4 rounded-2xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] p-8 text-center">
          <div className="text-lg font-semibold text-green-800 dark:text-green-200">
            Attendance Marked Successfully
          </div>
          <div className="mt-2 text-sm text-green-600 dark:text-green-300">
            Attendance for {courseLabel} has been saved. Next marking available in 2 hours.
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold tracking-wide text-slate-700 dark:text-slate-200 w-[80px]">
                  S No.
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold tracking-wide text-slate-700 dark:text-slate-200 w-[160px]">
                  Reg No.
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold tracking-wide text-slate-700 dark:text-slate-200">
                  Student Name
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold tracking-wide text-slate-700 dark:text-slate-200 w-[160px]">
                  Present
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold tracking-wide text-slate-700 dark:text-slate-200 w-[160px]">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {students.map((s, idx) => {
                const isPresent = !!presentMap[s.regNo];
                const isOnDuty = getStudentODStatus(s.regNo);

                return (
                  <tr
                    key={s.regNo}
                    className={clsx(
                      "border-b border-slate-200 dark:border-slate-800",
                      idx % 2 === 0
                        ? "bg-white dark:bg-slate-950/30"
                        : "bg-slate-50/60 dark:bg-slate-900/30",
                      isOnDuty && "bg-amber-50/30 dark:bg-amber-950/10"
                    )}
                  >
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                      {s.sno}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200 tabular-nums">
                      {s.regNo}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                      {s.name}
                    </td>

                    {/* Present/On Duty column */}
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        {isOnDuty ? (
                          <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            OD Approved
                          </div>
                        ) : (
                          <input
                            type="checkbox"
                            checked={isPresent}
                            onChange={() => toggle(s.regNo)}
                            className={clsx(
                              "h-4 w-4 rounded border-slate-300 dark:border-slate-700",
                              "text-sky-600 focus:ring-sky-500/35",
                              "accent-sky-600"
                            )}
                            aria-label={`Mark ${s.name} present`}
                          />
                        )}
                      </div>
                    </td>

                    {/* Status column */}
                    <td className="px-4 py-3">
                      <div className="text-center text-xs font-semibold">
                        <span
                          className={clsx(
                            "px-2 py-1 rounded-lg border",
                            isOnDuty
                              ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-500/10 dark:text-amber-200"
                              : isPresent
                              ? "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/50 dark:bg-sky-500/10 dark:text-sky-200"
                              : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-500/10 dark:text-rose-200"
                          )}
                        >
                          {isOnDuty ? "On Duty" : isPresent ? "Present" : "Absent"}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Showing 1 to {students.length} of {students.length} entries
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-right">
            Note: Only tick for present. Unticked means absent. OD = On Duty (approved leave).
          </div>
        </div>
      </div>
      ) ) }
    </div>
  );
}
