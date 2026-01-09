// src/layouts/teacher/internalMarks/ViewMarks.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ChevronDownIcon } from "lucide-react";

const API_BASE = "http://localhost:5000";
const TEACHER_API = `${API_BASE}/api/teacher`;

type CourseOpt = { id: string; label: string };

type MarksRow = {
  regNo: string;
  studentName: string;
  level1: number;
  level2: number;
  level3: number;
  assignment: number;
  viva: number;
  debug: number;
  classPractical: number;
  capstoneProject: number;
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

export default function ViewMarks() {
  const [courses, setCourses] = useState<CourseOpt[]>([
    { id: "", label: "--Select--" },
    { id: "1", label: "CS101 - Introduction to Computer Science" },
    { id: "2", label: "CS102 - Data Structures" },
    { id: "3", label: "CS103 - Algorithms" },
  ]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const dummyMarks: MarksRow[] = [
    {
      regNo: "19221314",
      studentName: "Alice Johnson",
      level1: 85,
      level2: 90,
      level3: 88,
      assignment: 92,
      viva: 87,
      debug: 80,
      classPractical: 85,
      capstoneProject: 90,
    },
    {
      regNo: "19221315",
      studentName: "Bob Smith",
      level1: 78,
      level2: 82,
      level3: 85,
      assignment: 88,
      viva: 80,
      debug: 75,
      classPractical: 78,
      capstoneProject: 82,
    },
    {
      regNo: "19231316",
      studentName: "Charlie Brown",
      level1: 92,
      level2: 95,
      level3: 90,
      assignment: 96,
      viva: 93,
      debug: 88,
      classPractical: 92,
      capstoneProject: 95,
    },
  ];

  const [rows, setRows] = useState<MarksRow[]>(dummyMarks);
  const [loadingMarks, setLoadingMarks] = useState(false);

  const [courseId, setCourseId] = useState<string>("1");
  const [viewed, setViewed] = useState(true);

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

  // Fetch marks when course is selected and viewed
  // Commented to show dummy data
  // useEffect(() => {
  //   if (!courseId || !viewed) {
  //     setRows([]);
  //     return;
  //   }

  //   const fetchMarks = async () => {
  //     setLoadingMarks(true);
  //     try {
  //       const token = localStorage.getItem("authToken");
  //       const headers: Record<string, string> = {};
  //       if (token) headers.Authorization = `Bearer ${token}`;

  //       const res = await fetch(`${TEACHER_API}/marks?course_id=${courseId}`, { headers });
  //       if (res.ok) {
  //         const data = await res.json();
  //         // Transform backend data to frontend format
  //         // Group marks by student and test name
  //         const studentMarksMap: Record<string, any> = {};

  //         data.marks?.forEach((mark: any) => {
  //           const key = mark.reg_no;
  //           if (!studentMarksMap[key]) {
  //             studentMarksMap[key] = {
  //               regNo: mark.reg_no,
  //               studentName: mark.student_name || mark.studentName,
  //               level1: 0,
  //               level2: 0,
  //               level3: 0,
  //               assignment: 0,
  //               viva: 0,
  //               debug: 0,
  //               classPractical: 0,
  //               capstoneProject: 0,
  //             };
  //           }

  //           // Map test names to the correct columns
  //           const testName = mark.test_name?.toLowerCase().replace(/\s+/g, '_');
  //           switch (testName) {
  //             case 'level_1':
  //             case 'level1':
  //               studentMarksMap[key].level1 = mark.mark;
  //               break;
  //             case 'level_2':
  //             case 'level2':
  //               studentMarksMap[key].level2 = mark.mark;
  //               break;
  //             case 'level_3':
  //             case 'level3':
  //               studentMarksMap[key].level3 = mark.mark;
  //               break;
  //             case 'assignment':
  //               studentMarksMap[key].assignment = mark.mark;
  //               break;
  //             case 'viva':
  //               studentMarksMap[key].viva = mark.mark;
  //               break;
  //             case 'debug':
  //               studentMarksMap[key].debug = mark.mark;
  //               break;
  //             case 'class_practical':
  //             case 'classpractical':
  //               studentMarksMap[key].classPractical = mark.mark;
  //               break;
  //             case 'capstone_project':
  //             case 'capstoneproject':
  //               studentMarksMap[key].capstoneProject = mark.mark;
  //               break;
  //           }
  //         });

  //         const marksArray = Object.values(studentMarksMap) as MarksRow[];
  //         setRows(marksArray);
  //       }
  //     } catch (err) {
  //       console.error("Failed to fetch marks", err);
  //       setRows([]);
  //     } finally {
  //       setLoadingMarks(false);
  //     }
  //   };
  //   fetchMarks();
  // }, [courseId, viewed]);

  return (
    <div className="w-full p-4 md:p-6">
      <PageTitle title="View Marks" />

      {/* top controls (no card background) */}
      <div className="max-w-[1280px]">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
          <div className="flex items-center gap-3">
            <div className="text-[13px] text-rose-600 font-medium">Course</div>

            <div className="relative w-[420px] max-w-full">
              <select
                value={courseId}
                onChange={(e) => {
                  setCourseId(e.target.value);
                  setViewed(false);
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

            <button
              type="button"
              onClick={() => setViewed(true)}
              className={cn(
                "h-9 px-4 rounded-sm text-[12.5px] font-semibold text-white",
                "bg-teal-600 hover:bg-teal-700 active:bg-teal-800",
                "shadow-sm transition"
              )}
            >
              View
            </button>
          </div>
        </div>

        {/* table */}
        <div className="mt-6 rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[1400px] w-full border-collapse">
              <thead>
                <tr className="bg-white dark:bg-slate-950">
                  <th className="px-3 py-2.5 text-left text-[13px] font-semibold border-b border-slate-200 dark:border-slate-800">
                    Registration Number
                  </th>
                  <th className="px-3 py-2.5 text-left text-[13px] font-semibold border-b border-slate-200 dark:border-slate-800">
                    Student Name
                  </th>
                  <th className="px-3 py-2.5 text-center text-[13px] font-semibold border-b border-slate-200 dark:border-slate-800">
                    LEVEL 1
                  </th>
                  <th className="px-3 py-2.5 text-center text-[13px] font-semibold border-b border-slate-200 dark:border-slate-800">
                    LEVEL 2
                  </th>
                  <th className="px-3 py-2.5 text-center text-[13px] font-semibold border-b border-slate-200 dark:border-slate-800">
                    LEVEL 3
                  </th>
                  <th className="px-3 py-2.5 text-center text-[13px] font-semibold border-b border-slate-200 dark:border-slate-800">
                    ASSIGNMENT
                  </th>
                  <th className="px-3 py-2.5 text-center text-[13px] font-semibold border-b border-slate-200 dark:border-slate-800">
                    Viva
                  </th>
                  <th className="px-3 py-2.5 text-center text-[13px] font-semibold border-b border-slate-200 dark:border-slate-800">
                    Debug
                  </th>
                  <th className="px-3 py-2.5 text-center text-[13px] font-semibold border-b border-slate-200 dark:border-slate-800">
                    Class practical
                  </th>
                  <th className="px-3 py-2.5 text-center text-[13px] font-semibold border-b border-slate-200 dark:border-slate-800">
                    Capstone project
                  </th>
                </tr>
              </thead>

              <tbody>
                {loadingMarks ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-10 text-center text-[13px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 border-t-slate-600 dark:border-t-slate-300 rounded-full animate-spin"></div>
                        Loading marks...
                      </div>
                    </td>
                  </tr>
                ) : rows.length > 0 ? (
                  rows.map((r, idx) => (
                    <tr
                      key={`${r.regNo}-${idx}`}
                      className={cn(
                        "border-b border-slate-200/70 dark:border-slate-800/70",
                        "hover:bg-slate-50 dark:hover:bg-slate-900/40"
                      )}
                    >
                      <td className="px-3 py-3 text-[13px]">{r.regNo}</td>
                      <td className="px-3 py-3 text-[13px]">
                        <div className="text-center">{r.studentName}</div>
                      </td>
                      <td className="px-3 py-3 text-[13px] text-center">{r.level1 || '-'}</td>
                      <td className="px-3 py-3 text-[13px] text-center">{r.level2 || '-'}</td>
                      <td className="px-3 py-3 text-[13px] text-center">{r.level3 || '-'}</td>
                      <td className="px-3 py-3 text-[13px] text-center">{r.assignment || '-'}</td>
                      <td className="px-3 py-3 text-[13px] text-center">{r.viva || '-'}</td>
                      <td className="px-3 py-3 text-[13px] text-center">{r.debug || '-'}</td>
                      <td className="px-3 py-3 text-[13px] text-center">{r.classPractical || '-'}</td>
                      <td className="px-3 py-3 text-[13px] text-center">{r.capstoneProject || '-'}</td>
                    </tr>
                  ))
                ) : viewed && courseId ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-3 py-10 text-center text-[13px] text-slate-500 dark:text-slate-400"
                    >
                      No marks found for this course.
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-3 py-10 text-center text-[13px] text-slate-500 dark:text-slate-400"
                    >
                      Please select a course and click "View" to display marks.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
