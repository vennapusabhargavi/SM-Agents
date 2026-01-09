// src/layouts/student/StudentMyCourse.tsx
import React, { useMemo, useState, useEffect } from "react";
import {
  ListIcon,
  BellIcon,
  CheckCircle2Icon,
  CheckIcon,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

type CourseInProgressRow = {
  courseCode: string;
  courseName: string;
  status: "InProgress" | "Approved";
  enrollOn: string;
  type?: "in_progress" | "approved";
};

type CourseCompletedRow = {
  sno: number;
  courseCode: string;
  courseName: string;
  grade: string;
  status: "PASS";
  monthYear: string;
};


const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost/smart_campus_api";
const STUDENT_API = `${API_BASE}/api/student`;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}





function Section({
  title,
  icon,
  right,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {icon}
            </span>
          )}
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 uppercase tracking-wide">
            {title}
          </h2>
        </div>
        {right && <div>{right}</div>}
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function TableShell({
  children,
  maxHeightClass = "",
}: {
  children: React.ReactNode;
  maxHeightClass?: string;
}) {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_1px_0_rgba(15,23,42,0.06)] dark:shadow-black/20">
      <div
        className={cn(
          "overflow-x-auto",
          maxHeightClass && "overflow-y-auto",
          maxHeightClass
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** ✅ FIX: allow colSpan, rowSpan, etc. */
function Th({
  children,
  className = "",
  align = "left",
  ...rest
}: React.ThHTMLAttributes<HTMLTableCellElement> & {
  align?: "left" | "center" | "right";
}) {
  return (
    <th
      {...rest}
      className={cn(
        "text-[12.5px] font-semibold",
        "bg-slate-50/95 dark:bg-slate-800/70",
        "text-slate-700 dark:text-slate-200",
        "border-b border-slate-200 dark:border-slate-700",
        "px-3 py-2.5",
        "sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className
      )}
    >
      {children}
    </th>
  );
}

/** ✅ FIX: allow colSpan, rowSpan, etc. */
function Td({
  children,
  className = "",
  align = "left",
  ...rest
}: React.TdHTMLAttributes<HTMLTableCellElement> & {
  align?: "left" | "center" | "right";
}) {
  return (
    <td
      {...rest}
      className={cn(
        "text-[13px] leading-5",
        "text-slate-700 dark:text-slate-200",
        "border-b border-slate-200/70 dark:border-slate-800",
        "px-3 py-3",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className
      )}
    >
      {children}
    </td>
  );
}

function StatusBarInProgress() {
  return (
    <div className="w-[190px] max-w-full" aria-label="InProgress status">
      <div className="h-7 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full w-full flex items-center justify-center text-[12px] font-semibold text-white shadow-inner"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(59,130,246,0.78) 0px, rgba(59,130,246,0.78) 12px, rgba(147,197,253,0.78) 12px, rgba(147,197,253,0.78) 24px)",
          }}
        >
          InProgress
        </div>
      </div>
    </div>
  );
}

function PassPill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
      <CheckIcon size={14} />
      PASS
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === "InProgress") {
    return <StatusBarInProgress />;
  }
  if (status === "Approved") {
    return (
      <div className="w-[190px] max-w-full" aria-label="Approved status">
        <div className="h-7 rounded-full overflow-hidden border border-emerald-200 dark:border-emerald-700 bg-emerald-100 dark:bg-emerald-800">
          <div className="h-full w-full flex items-center justify-center text-[12px] font-semibold text-emerald-700 dark:text-emerald-200">
            Approved
          </div>
        </div>
      </div>
    );
  }
  return null;
}



const dummyInProgress: CourseInProgressRow[] = [
  {
    courseCode: "CS101",
    courseName: "Introduction to Computer Science",
    status: "InProgress",
    enrollOn: "01/01/2026",
    type: "in_progress",
  },
  {
    courseCode: "CS102",
    courseName: "Data Structures",
    status: "InProgress",
    enrollOn: "01/01/2026",
    type: "in_progress",
  },
];

const dummyApprovedCourses: CourseInProgressRow[] = [
  {
    courseCode: "CS103",
    courseName: "Algorithms",
    status: "Approved",
    enrollOn: "15/01/2026",
    type: "approved",
  },
];

const dummyCompleted: CourseCompletedRow[] = [
  {
    sno: 1,
    courseCode: "CS104",
    courseName: "Database Systems",
    grade: "A",
    status: "PASS",
    monthYear: "Dec 2025",
  },
  {
    sno: 2,
    courseCode: "CS105",
    courseName: "Operating Systems",
    grade: "B+",
    status: "PASS",
    monthYear: "Dec 2025",
  },
];

const dummyGraduation = {
  programElective: { completed: 2, total: 6 },
  programCore: { completed: 8, total: 12 },
  universityCore: { completed: 4, total: 8 },
  universityElective: { completed: 1, total: 4 },
};

export function StudentMyCourse() {
  const { user } = useAuth();
  const regNo = useMemo(
    () => user?.registerNumber || "19221314",
    [user]
  );

  const [inProgress, setInProgress] = useState<CourseInProgressRow[]>(() => {
    const stored = localStorage.getItem("studentInProgressCourses");
    return stored ? JSON.parse(stored) : dummyInProgress;
  });
  const [approvedCourses, setApprovedCourses] = useState<CourseInProgressRow[]>(() => {
    const stored = localStorage.getItem("studentApprovedCourses");
    return stored ? JSON.parse(stored) : dummyApprovedCourses;
  });
  const [completed, setCompleted] = useState<CourseCompletedRow[]>(() => {
    const stored = localStorage.getItem("studentCompletedCourses");
    return stored ? JSON.parse(stored) : dummyCompleted;
  });
  const [graduation, setGraduation] = useState(() => {
    const stored = localStorage.getItem("studentGraduation");
    return stored ? JSON.parse(stored) : dummyGraduation;
  });

  // Commented to show dummy data
  // useEffect(() => {
  //   const token = localStorage.getItem("authToken");
  //   const headers: Record<string, string> = {};
  //   if (token) headers.Authorization = `Bearer ${token}`;

  //   fetch(`${STUDENT_API}/courses/status`, { headers })
  //     .then((r) => (r.ok ? r.json() : null))
  //     .then((json) => {
  //       if (json?.inProgress) {
  //         const mappedInProgress: CourseInProgressRow[] = (json.inProgress as any[]).map((row, index) => ({
  //           courseCode: row.course_code,
  //           courseName: row.course_name,
  //           status: row.status || "InProgress",
  //           enrollOn: row.enrolled_on || row.enroll_on || "N/A",
  //           type: row.type,
  //         }));
  //         const actualInProgress = mappedInProgress.filter(r => r.type === "in_progress");
  //         const approvedCoursesList = mappedInProgress.filter(r => r.type === "approved");
  //         setInProgress(actualInProgress);
  //         setApprovedCourses(approvedCoursesList);
  //       }
  //       if (json?.completed) {
  //         const mappedCompleted: CourseCompletedRow[] = (json.completed as any[]).map((row, index) => ({
  //           sno: index + 1,
  //           courseCode: row.course_code,
  //           courseName: row.course_name,
  //           grade: row.grade || "N/A",
  //           status: "PASS" as const,
  //           monthYear: row.completed_on || "N/A",
  //         }));
  //         setCompleted(mappedCompleted);
  //       }
  //       if (json?.graduation) setGraduation(json.graduation);
  //     })
  //     .catch(() => {});
  // }, []);

  useEffect(() => {
    localStorage.setItem("studentInProgressCourses", JSON.stringify(inProgress));
  }, [inProgress]);

  useEffect(() => {
    localStorage.setItem("studentApprovedCourses", JSON.stringify(approvedCourses));
  }, [approvedCourses]);

  useEffect(() => {
    localStorage.setItem("studentCompletedCourses", JSON.stringify(completed));
  }, [completed]);

  useEffect(() => {
    localStorage.setItem("studentGraduation", JSON.stringify(graduation));
  }, [graduation]);



  const completedCount = completed.length;
  const inProgressCount = inProgress.length;
  const approvedCount = approvedCourses.length;

  const graduationProgress = useMemo(() => {
    const totalCompleted = graduation.programElective.completed + graduation.programCore.completed + graduation.universityCore.completed + graduation.universityElective.completed;
    const totalRequired = graduation.programElective.total + graduation.programCore.total + graduation.universityCore.total + graduation.universityElective.total;
    return totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0;
  }, [graduation]);

  console.log("Rendering StudentMyCourse");

  return (
    <div className="w-full p-4 md:p-6 space-y-5">
      {/* ✅ Header EXACT structure like your screenshot (no card/background) */}
      <div className="px-0">
        <div className="text-[34px] font-light text-slate-800 dark:text-slate-50 tracking-tight">
          My Course
        </div>
        <div className="mt-1 text-[14px] text-slate-600 dark:text-slate-300">
          Register No:{" "}
          <span className="font-semibold text-slate-900 dark:text-white">
            {regNo}
          </span>
        </div>
      </div>

      {/* ✅ content directly (no outer gradient card wrapper) */}
      <div className="space-y-6">
        {/* INPROGRESS COURSES */}
        <Section
          title="INPROGRESS COURSES"
          icon={<ListIcon size={16} />}
          right={<span className="text-sm text-slate-600 dark:text-slate-400">{inProgressCount} course(s)</span>}
        >
          <TableShell>
            <table className="min-w-[920px] w-full border-collapse">
              <thead>
                <tr>
                  <Th className="w-[180px]" align="center">
                    Course Code
                  </Th>
                  <Th align="center">Course Name</Th>
                  <Th className="w-[220px]" align="center">
                    Status
                  </Th>
                  <Th className="w-[180px]" align="center">
                    Enroll On
                  </Th>
                </tr>
              </thead>
              <tbody>
                {inProgress.map((r, idx) => (
                  <tr
                    key={r.courseCode}
                    className={cn(
                      idx % 2 === 0
                        ? "bg-white dark:bg-slate-900"
                        : "bg-slate-50/60 dark:bg-slate-900/60",
                      "hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
                    )}
                  >
                    <Td
                      align="center"
                      className="font-semibold text-slate-900 dark:text-white"
                    >
                      {r.courseCode}
                    </Td>
                    <Td align="center">{r.courseName}</Td>
                    <Td align="center">
                      <div className="flex justify-center">
                        <StatusBarInProgress />
                      </div>
                    </Td>
                    <Td align="center" className="tabular-nums">
                      {r.enrollOn}
                    </Td>
                  </tr>
                ))}

                {inProgress.length === 0 && (
                  <tr>
                    <Td
                      colSpan={4}
                      className="py-10 text-center text-slate-500 dark:text-slate-400"
                    >
                      No in-progress courses.
                    </Td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableShell>
        </Section>

        {/* APPROVED COURSES */}
        <Section
          title="APPROVED COURSES"
          icon={<CheckCircle2Icon size={16} />}
          right={<span className="text-sm text-slate-600 dark:text-slate-400">{approvedCount} course(s)</span>}
        >
          <TableShell>
            <table className="min-w-[920px] w-full border-collapse">
              <thead>
                <tr>
                  <Th className="w-[180px]" align="center">
                    Course Code
                  </Th>
                  <Th align="center">Course Name</Th>
                  <Th className="w-[220px]" align="center">
                    Status
                  </Th>
                  <Th className="w-[180px]" align="center">
                    Enroll On
                  </Th>
                </tr>
              </thead>
              <tbody>
                {approvedCourses.map((r, idx) => (
                  <tr
                    key={r.courseCode}
                    className={cn(
                      idx % 2 === 0
                        ? "bg-white dark:bg-slate-900"
                        : "bg-slate-50/60 dark:bg-slate-900/60",
                      "hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
                    )}
                  >
                    <Td
                      align="center"
                      className="font-semibold text-slate-900 dark:text-white"
                    >
                      {r.courseCode}
                    </Td>
                    <Td align="center">{r.courseName}</Td>
                    <Td align="center">
                      <div className="flex justify-center">
                        <StatusPill status={r.status} />
                      </div>
                    </Td>
                    <Td align="center" className="tabular-nums">
                      {r.enrollOn}
                    </Td>
                  </tr>
                ))}

                {approvedCourses.length === 0 && (
                  <tr>
                    <Td
                      colSpan={4}
                      className="py-10 text-center text-slate-500 dark:text-slate-400"
                    >
                      No approved courses.
                    </Td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableShell>
        </Section>

        {/* GRADUATION STATUS */}
        <Section
          title="GRADUATION STATUS"
          icon={<BellIcon size={16} />}
          right={<span className="text-sm text-slate-600 dark:text-slate-400">{graduationProgress}% completed</span>}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="text-center">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2">Program Elective</h3>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
                {graduation.programElective.completed}/{graduation.programElective.total}
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2">Program Core</h3>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
                {graduation.programCore.completed}/{graduation.programCore.total}
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2">University Core</h3>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
                {graduation.universityCore.completed}/{graduation.universityCore.total}
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2">University Elective</h3>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
                {graduation.universityElective.completed}/{graduation.universityElective.total}
              </p>
            </div>
          </div>
        </Section>

        {/* COMPLETED COURSES */}
        <Section
          title="COMPLETED COURSES"
          icon={<CheckCircle2Icon size={16} />}
          right={<span className="text-sm text-slate-600 dark:text-slate-400">{completedCount} record(s)</span>}
        >
          <TableShell maxHeightClass="max-h-[420px]">
            <table className="min-w-[1100px] w-full border-collapse">
              <thead>
                <tr>
                  <Th className="w-[80px]" align="center">
                    Sno
                  </Th>
                  <Th className="w-[170px]" align="center">
                    Course Code
                  </Th>
                  <Th align="center">Course Name</Th>
                  <Th className="w-[140px]" align="center">
                    Grade
                  </Th>
                  <Th className="w-[160px]" align="center">
                    Status
                  </Th>
                  <Th className="w-[220px]" align="center">
                    Month&amp;Year
                  </Th>
                </tr>
              </thead>
              <tbody>
                {completed.map((r, idx) => (
                  <tr
                    key={r.sno}
                    className={cn(
                      idx % 2 === 0
                        ? "bg-white dark:bg-slate-900"
                        : "bg-slate-50/60 dark:bg-slate-900/60",
                      "hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
                    )}
                  >
                    <Td align="center" className="tabular-nums">
                      {r.sno}
                    </Td>
                    <Td
                      align="center"
                      className="font-semibold text-slate-900 dark:text-white"
                    >
                      {r.courseCode}
                    </Td>
                    <Td align="center">{r.courseName}</Td>
                    <Td align="center" className="font-semibold">
                      {r.grade}
                    </Td>
                    <Td align="center">
                      <PassPill />
                    </Td>
                    <Td align="center">{r.monthYear}</Td>
                  </tr>
                ))}

                {completed.length === 0 && (
                  <tr>
                    <Td
                      colSpan={6}
                      className="py-10 text-center text-slate-500 dark:text-slate-400"
                    >
                      No completed courses.
                    </Td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableShell>
        </Section>
      </div>
    </div>
  );
}

export default StudentMyCourse;
