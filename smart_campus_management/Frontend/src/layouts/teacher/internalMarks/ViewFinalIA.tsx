// src/layouts/teacher/internalMarks/ViewFinalIA.tsx
import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:5000";
const TEACHER_API = `${API_BASE}/api/teacher`;

type CourseOpt = { id: string; label: string };

type WeightageRow = {
  id: string;
  testName: string;
  weightage: number;
  datedOn: string; // DD/MM/YYYY
};

type MarkRow = {
  id: string;
  sno: number;
  regNo: string;
  name: string;
  markValue: number;
};

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Badge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center text-[11px] font-semibold px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 shadow-sm">
      {text}
    </span>
  );
}

function TableShell({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] overflow-hidden">
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
            {title}
          </div>
          {subtitle && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {subtitle}
            </div>
          )}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

export default function ViewFinalIA() {
  const [courses, setCourses] = useState<CourseOpt[]>([{ id: "", label: "--Select--" }]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courseId, setCourseId] = useState<string>("");
  const [weightageData, setWeightageData] = useState<Record<string, WeightageRow[]>>({});
  const [markData, setMarkData] = useState<Record<string, MarkRow[]>>({});
  const [loadingData, setLoadingData] = useState(false);

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

  // Fetch weightage and marks data when course is selected
  useEffect(() => {
    if (!courseId) {
      setWeightageData({});
      setMarkData({});
      return;
    }

    const fetchData = async () => {
      setLoadingData(true);
      try {
        const token = localStorage.getItem("authToken");
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        // For demo purposes, we'll simulate fetching weightage and marks
        // In a real implementation, you'd have separate endpoints for these
        const enrolledRes = await fetch(`${TEACHER_API}/enrollment/approved?course_id=${courseId}`, { headers });
        if (enrolledRes.ok) {
          const enrolledData = await enrolledRes.json();
          const students: MarkRow[] = (enrolledData.enrollments || []).map((e: any, idx: number) => ({
            id: `m${idx + 1}`,
            sno: idx + 1,
            regNo: e.regNo || e.reg_no,
            name: e.studentName || e.student_name,
            markValue: 0, // Default mark, would be calculated from actual marks in backend
          }));

          // Mock weightage data - in real app, this would come from backend
          const mockWeightage: WeightageRow[] = [
            { id: "w1", testName: "ASSIGNMENT", weightage: 10, datedOn: "28/03/2025" },
            { id: "w2", testName: "Capstone project", weightage: 10, datedOn: "28/03/2025" },
            { id: "w3", testName: "Class practical", weightage: 10, datedOn: "28/03/2025" },
            { id: "w4", testName: "Debug", weightage: 15, datedOn: "28/03/2025" },
            { id: "w5", testName: "LEVEL 1", weightage: 15, datedOn: "28/03/2025" },
            { id: "w6", testName: "LEVEL 2", weightage: 15, datedOn: "28/03/2025" },
            { id: "w7", testName: "LEVEL 3", weightage: 15, datedOn: "28/03/2025" },
            { id: "w8", testName: "Viva", weightage: 10, datedOn: "28/03/2025" },
          ];

          setMarkData({ [courseId]: students });
          setWeightageData({ [courseId]: mockWeightage });
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [courseId]);

  const [loadedCourse, setLoadedCourse] = useState<string>(""); // only changes on View click
  const [error, setError] = useState<string>("");

  const currentWeightage = weightageData[loadedCourse] ?? [];
  const currentMarks = markData[loadedCourse] ?? [];

  const totalWeightage = useMemo(
    () => currentWeightage.reduce((sum, r) => sum + (Number(r.weightage) || 0), 0),
    [currentWeightage]
  );

  const stats = useMemo(() => {
    if (!currentMarks.length) return { avg: 0, min: 0, max: 0 };
    const vals = currentMarks.map((m) => m.markValue);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    return { avg, min, max };
  }, [currentMarks]);

  const onView = () => {
    setError("");
    if (!courseId) {
      setError("Please select a course to view Final IA.");
      return;
    }
    setLoadedCourse(courseId);
  };

  const courseLabel = useMemo(
    () => courses.find((c) => c.id === loadedCourse)?.label ?? "--Select--",
    [courses, loadedCourse]
  );

  return (
    <div className="w-full">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">View Final IA</h1>

      {/* Top row (course + view button like screenshot) */}
      <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)]">
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 sm:grid-cols-[110px_1fr] gap-2 sm:gap-4 items-center">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <span className="text-rose-600 dark:text-rose-400">*</span> Course
                </div>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  {courses.map((c) => (
                    <option key={c.id + c.label} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Viewing: <span className="font-semibold">{courseLabel}</span>
              </div>
            </div>

            <div className="lg:col-span-4 flex items-center gap-3 lg:justify-end">
              <button
                type="button"
                onClick={onView}
                className="h-10 px-6 rounded-xl bg-gradient-to-r from-slate-800 via-slate-900 to-indigo-900 text-white text-sm font-semibold shadow-sm hover:opacity-95 active:scale-[0.99] transition"
              >
                View
              </button>

              <div className="hidden lg:flex items-center gap-2">
                <Badge text={`Weightage: ${totalWeightage}%`} />
                <Badge text={`${currentMarks.length} Students`} />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Weightage Details */}
      <div className="mt-4">
        <TableShell
          title="Weightage Details"
          subtitle="Configured weightage details below"
          right={
            <div className="flex items-center gap-2">
              <Badge text={`Total: ${totalWeightage}%`} />
            </div>
          }
        >
          <div className="max-h-[360px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-white dark:bg-slate-950">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                    Test Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 w-[140px]">
                    Weightage
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 w-[160px]">
                    Dated On
                  </th>
                </tr>
              </thead>

              <tbody>
                {currentWeightage.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition"
                  >
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-50">
                      {r.testName}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {r.weightage}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {r.datedOn}
                    </td>
                  </tr>
                ))}

                {currentWeightage.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center">
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        No Weightage Configured
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Configure weightage to compute Final IA.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TableShell>
      </div>

      {/* Mark Details */}
      <div className="mt-4">
        <TableShell
          title="Mark Details"
          subtitle="Mark details below"
          right={
            <div className="hidden sm:flex items-center gap-2">
              <Badge text={`Avg: ${stats.avg.toFixed(2)}`} />
              <Badge text={`Min: ${stats.min.toFixed(2)}`} />
              <Badge text={`Max: ${stats.max.toFixed(2)}`} />
            </div>
          }
        >
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-white dark:bg-slate-950">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 w-[90px]">
                    Sno.
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 w-[260px]">
                    Registration Number
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                    Student Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 w-[160px]">
                    MarkValue
                  </th>
                </tr>
              </thead>

              <tbody>
                {currentMarks.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition"
                  >
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{m.sno}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{m.regNo}</td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-50">{m.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          "inline-flex items-center justify-center min-w-[88px] px-3 py-1.5 rounded-xl text-sm font-semibold shadow-sm",
                          "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        )}
                      >
                        {m.markValue}
                      </span>
                    </td>
                  </tr>
                ))}

                {currentMarks.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center">
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        No Marks Available
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Please click “View” after selecting a course.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TableShell>
      </div>
    </div>
  );
}
