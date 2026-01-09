// src/layouts/teacher/examination/FormativeMarks.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { EyeIcon, UploadIcon, PrinterIcon, XIcon } from "lucide-react";

const API_BASE = "http://localhost:5000";
const TEACHER_API = `${API_BASE}/api/teacher`;

type CourseOpt = { id: string; code: string; name: string; title: string };
type TestOpt = { id: string; name: string; type: string; defaultMax: number };

type StudentRow = { sno: number; regNo: string; name: string };

type EnteredRow = {
  id: string;
  courseCode: string;
  courseName: string;
  testId: string;
  testName: string;
  type: string;
  maxMark: number;
  enteredOn: string; // DD/MM/YYYY
  uploaded: boolean;
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const pad2 = (n: number) => String(n).padStart(2, "0");
const fmtDDMMYYYY = (d: Date) =>
  `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;

function isMarkValid(v: string, maxMark: number) {
  const s = v.trim();
  if (!s) return false;
  if (s.toUpperCase() === "AB") return true;
  if (!/^\d+(\.\d+)?$/.test(s)) return false;
  const num = Number(s);
  if (Number.isNaN(num)) return false;
  if (num < 0) return false;
  if (maxMark <= 0) return false;
  if (num > maxMark) return false;
  return true;
}

function normalizeMarkInput(raw: string) {
  // allow AB / ab, digits, and a single dot; keep it simple and teacher-friendly
  const s = raw.trim();
  if (!s) return "";
  if (/^ab$/i.test(s)) return "AB";
  // remove invalid chars
  let v = raw.replace(/[^\d.]/g, "");
  const firstDot = v.indexOf(".");
  if (firstDot !== -1) {
    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, "");
  }
  return v;
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-2 bg-slate-600 text-white text-sm font-semibold text-center">
      {children}
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "px-3 py-2 text-left text-[12.5px] font-semibold",
        "bg-slate-50 dark:bg-slate-900/40",
        "text-slate-700 dark:text-slate-200",
        "border border-slate-200 dark:border-slate-800",
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
        "px-3 py-2 text-[13px]",
        "text-slate-800 dark:text-slate-100",
        "border border-slate-200 dark:border-slate-800",
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
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute inset-3 sm:inset-6 grid place-items-center">
        <div className="w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="text-base font-semibold text-slate-900 dark:text-slate-50">
              {title}
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
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function FormativeMarks() {
  const [courses, setCourses] = useState<CourseOpt[]>([{ id: "", code: "", name: "", title: "--Select--" }]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [tests, setTests] = useState<TestOpt[]>([{ id: "", name: "--Select Test--", type: "", defaultMax: 0 }]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // initial selections
  const [courseCode, setCourseCode] = useState<string>("");
  const [testId, setTestId] = useState<string>("");
  const [maxMark, setMaxMark] = useState<string>("0");

  const selectedCourse = courses.find((c) => c.id === courseCode) || null;
  const selectedTest = tests.find((t) => t.id === testId) || null;

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
              code: c.code,
              name: c.title,
              title: `${c.code} - ${c.title}`
            }));
          setCourses([{ id: "", code: "", name: "", title: "--Select--" }, ...courseOpts]);
        }
      } catch (err) {
        console.error("Failed to fetch courses", err);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  // Set default tests (static for now, could be made dynamic)
  useEffect(() => {
    if (!courseCode) {
      setTests([{ id: "", name: "--Select Test--", type: "", defaultMax: 0 }]);
      return;
    }

    // For now, using common formative assessment tests
    const defaultTests: TestOpt[] = [
      { id: "", name: "--Select Test--", type: "", defaultMax: 0 },
      { id: "class_test", name: "Class Test (IA)", type: "IA", defaultMax: 25 },
      { id: "quiz", name: "Quiz", type: "IA", defaultMax: 10 },
      { id: "assignment", name: "Assignment", type: "IA", defaultMax: 20 },
      { id: "presentation", name: "Presentation", type: "IA", defaultMax: 15 },
      { id: "attendance", name: "Attendance Component", type: "IA", defaultMax: 5 },
    ];
    setTests(defaultTests);
  }, [courseCode]);

  // Fetch enrolled students when course is selected
  useEffect(() => {
    if (!courseCode) {
      setStudents([]);
      return;
    }

    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const token = localStorage.getItem("authToken");
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${TEACHER_API}/enrollment/approved?course_id=${courseCode}`, { headers });
        if (res.ok) {
          const data = await res.json();
          const studentRows: StudentRow[] = (data.enrollments || []).map((e: any, idx: number) => ({
            sno: idx + 1,
            regNo: e.regNo || e.reg_no,
            name: e.studentName || e.student_name,
          }));
          setStudents(studentRows);
        }
      } catch (err) {
        console.error("Failed to fetch students", err);
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, [courseCode]);

  // mark entry map (regNo -> value)
  const [marks, setMarks] = useState<Record<string, string>>({});

  // marks entered list
  const [entered, setEntered] = useState<EnteredRow[]>([]);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewRow, setViewRow] = useState<EnteredRow | null>(null);

  const uploadRef = useRef<HTMLInputElement | null>(null);

  // set default max mark when course/test changes (but keep user-edit if they typed)
  useEffect(() => {
    const def = selectedTest?.defaultMax ?? 0;
    setMaxMark(String(def));
  }, [courseCode, testId]); // eslint-disable-line react-hooks/exhaustive-deps

  // reset marks when course/test changes (fresh entry)
  useEffect(() => {
    const next: Record<string, string> = {};
    students.forEach((s) => (next[s.regNo] = ""));
    setMarks(next);
  }, [courseCode, testId]); // eslint-disable-line react-hooks/exhaustive-deps

  const maxMarkNum = Number(maxMark);
  const anyInvalidMax = !maxMark.trim() || Number.isNaN(maxMarkNum) || maxMarkNum < 0;

  const allMarksValid =
    students.length > 0 &&
    !anyInvalidMax &&
    students.every((s) => isMarkValid(marks[s.regNo] ?? "", maxMarkNum));

  const keyForEntered = `${courseCode}::${testId}`;
  const activeEnteredRow = entered.find((e) => `${e.courseCode}::${e.testId}` === keyForEntered) || null;
  const isUploaded = !!activeEnteredRow?.uploaded;

  const onPrint = () => {
    if (!selectedCourse || !selectedTest) return;
    if (!allMarksValid) return;

    const now = new Date();
    const row: EnteredRow = {
      id: `e-${Date.now()}`,
      courseCode: selectedCourse.code,
      courseName: selectedCourse.name,
      testId: selectedTest.id,
      testName: selectedTest.name,
      type: selectedTest.type,
      maxMark: maxMarkNum,
      enteredOn: fmtDDMMYYYY(now),
      uploaded: activeEnteredRow?.uploaded ?? false,
    };

    setEntered((prev) => {
      // replace same course+test (reprint / re-enter)
      const filtered = prev.filter((p) => `${p.courseCode}::${p.testId}` !== keyForEntered);
      return [row, ...filtered];
    });

    // optional browser print — keeps UX close to screenshot button
    window.print();
  };

  const openUploadPicker = () => {
    if (!activeEnteredRow) return;
    uploadRef.current?.click();
  };

  const onUploadPicked = (file?: File | null) => {
    if (!file || !activeEnteredRow) return;
    setEntered((prev) =>
      prev.map((r) =>
        r.id === activeEnteredRow.id ? { ...r, uploaded: true } : r
      )
    );
  };

  const onView = (r: EnteredRow) => {
    setViewRow(r);
    setViewOpen(true);
  };

  return (
    <div className="w-full">
      {/* Title */}
      <div className="text-[30px] font-light text-slate-700 dark:text-slate-100 leading-none">
        Formative Marks
      </div>

      {/* Top controls row */}
      <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Course */}
          <div className="lg:col-span-4 flex items-center gap-3">
            <div className="w-[140px] text-right">
              <div className="text-[13px] font-medium text-rose-600">Course</div>
            </div>
            <select
              value={courseCode}
              onChange={(e) => {
                setCourseCode(e.target.value);
                setTestId(""); // Reset test selection when course changes
                setMaxMark("0");
              }}
              disabled={loadingCourses}
              className={cn(
                "h-10 w-full px-3 text-sm",
                "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
                "border border-slate-200 dark:border-slate-800",
                "focus:outline-none focus:ring-2 focus:ring-teal-500/30",
                loadingCourses && "opacity-60 cursor-not-allowed"
              )}
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Name of the Test */}
          <div className="lg:col-span-5 flex items-center gap-3">
            <div className="w-[170px] text-right">
              <div className="text-[13px] font-medium text-rose-600">Name of the Test</div>
            </div>
            <select
              value={testId}
              onChange={(e) => setTestId(e.target.value)}
              className={cn(
                "h-10 w-full px-3 text-sm",
                "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
                "border border-slate-200 dark:border-slate-800",
                "focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              )}
            >
              {tests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Max Mark */}
          <div className="lg:col-span-3 flex items-center gap-3">
            <div className="w-[120px] text-right">
              <div className="text-[13px] font-medium text-rose-600">Max Mark</div>
            </div>
            <input
              value={maxMark}
              onChange={(e) => setMaxMark(e.target.value.replace(/[^\d.]/g, ""))}
              inputMode="decimal"
              className={cn(
                "h-10 w-full px-3 text-sm tabular-nums",
                "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
                "border border-slate-200 dark:border-slate-800",
                "focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              )}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="mt-3 text-center text-rose-600 text-[12.5px] leading-snug">
          <div>Note: If student is absent please mark as "AB" in mark textbox</div>
          <div>
            If marks wrongly entered, please reenter the marks again then system will replace the
            marks
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="mt-4 grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* LEFT: Student List */}
        <div className="xl:col-span-7">
          <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
            <PanelTitle>Student List</PanelTitle>
            <div className="max-h-[640px] overflow-auto">
              <table className="min-w-[860px] w-full border-collapse">
                <thead>
                  <tr>
                    <Th className="w-[70px] text-center">S No.</Th>
                    <Th className="w-[180px]">Reg No.</Th>
                    <Th>Student Name</Th>
                    <Th className="w-[140px] text-center">Mark</Th>
                  </tr>
                </thead>
                <tbody>
                  {loadingStudents ? (
                    <tr>
                      <Td colSpan={4} className="text-center py-10 text-slate-500 dark:text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 border-t-slate-600 dark:border-t-slate-300 rounded-full animate-spin"></div>
                          Loading students...
                        </div>
                      </Td>
                    </tr>
                  ) : students.length > 0 ? (
                    students.map((s, idx) => {
                      const v = marks[s.regNo] ?? "";
                      const valid = isMarkValid(v, maxMarkNum);
                      return (
                        <tr
                          key={s.regNo}
                          className={cn(
                            idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/20"
                          )}
                        >
                          <Td className="text-center tabular-nums">{s.sno}</Td>
                          <Td className="tabular-nums">{s.regNo}</Td>
                          <Td className="text-center">{s.name}</Td>
                          <Td className="text-center">
                            <input
                              value={v}
                              onChange={(e) => {
                                if (isUploaded) return;
                                const next = normalizeMarkInput(e.target.value);
                                setMarks((prev) => ({ ...prev, [s.regNo]: next }));
                              }}
                              placeholder="0"
                              disabled={isUploaded || !courseCode || !testId}
                              className={cn(
                                "h-9 w-[110px] px-3 text-sm text-right tabular-nums",
                                "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
                                "border border-slate-200 dark:border-slate-800",
                                "focus:outline-none focus:ring-2 focus:ring-teal-500/30",
                                (isUploaded || !courseCode || !testId) && "opacity-60 cursor-not-allowed",
                                v && !valid && "border-rose-400 focus:ring-rose-400/40"
                              )}
                              title={
                                isUploaded
                                  ? "Marks entry is restricted after upload"
                                  : !courseCode || !testId
                                  ? "Please select course and test first"
                                  : `Enter number (0-${maxMarkNum || 0}) or AB`
                              }
                            />
                          </Td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <Td colSpan={4} className="text-center py-10 text-slate-500 dark:text-slate-400">
                        {courseCode ? "No enrolled students found for this course." : "Please select a course to view students."}
                      </Td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT: Marks Entered */}
        <div className="xl:col-span-5">
          <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
            <PanelTitle>Marks Entered</PanelTitle>

            <div className="overflow-x-auto">
              <table className="min-w-[740px] w-full border-collapse">
                <thead>
                  <tr>
                    <Th>Test Name</Th>
                    <Th className="w-[120px]">Type</Th>
                    <Th className="w-[120px]">Max Mark</Th>
                    <Th className="w-[140px]">Entered On</Th>
                    <Th className="w-[90px] text-center">View</Th>
                  </tr>
                </thead>
                <tbody>
                  {entered.length === 0 ? (
                    <tr>
                      <Td colSpan={5} className="text-center py-10 text-slate-500 dark:text-slate-400">
                        No data available in table
                      </Td>
                    </tr>
                  ) : (
                    entered.map((r, idx) => (
                      <tr
                        key={r.id}
                        className={cn(
                          idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/20"
                        )}
                      >
                        <Td>{r.testName}</Td>
                        <Td>{r.type}</Td>
                        <Td className="tabular-nums">{r.maxMark}</Td>
                        <Td className="tabular-nums">{r.enteredOn}</Td>
                        <Td className="text-center">
                          <button
                            type="button"
                            onClick={() => onView(r)}
                            className={cn(
                              "inline-flex items-center justify-center h-9 w-10",
                              "border border-slate-200 dark:border-slate-800",
                              "bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/40",
                              "transition"
                            )}
                            aria-label="View"
                            title="View"
                          >
                            <EyeIcon size={16} />
                          </button>
                        </Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* actions like screenshot */}
            <div className="px-4 py-5 space-y-3">
              <div className="text-center text-rose-600 text-[12px]">
                Please enter all the required mark before print
              </div>

              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={onPrint}
                  disabled={!allMarksValid}
                  className={cn(
                    "h-9 px-5 text-sm font-semibold",
                    "bg-teal-500 hover:bg-teal-600 text-white",
                    "transition active:scale-[0.99]",
                    !allMarksValid && "opacity-50 cursor-not-allowed hover:bg-teal-500"
                  )}
                  title={allMarksValid ? "Print" : 'Fill all marks (or "AB") and set Max Mark'}
                >
                  <span className="inline-flex items-center gap-2">
                    <PrinterIcon size={16} />
                    Print
                  </span>
                </button>
              </div>

              <div className="text-center text-rose-600 text-[12px]">
                Mark enter restricted once upload the mark entered document.
              </div>

              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={openUploadPicker}
                  disabled={!activeEnteredRow || activeEnteredRow.uploaded}
                  className={cn(
                    "h-10 px-5 text-sm font-semibold text-white",
                    "bg-rose-500 hover:bg-rose-600 active:bg-rose-700",
                    "transition active:scale-[0.99]",
                    (!activeEnteredRow || activeEnteredRow.uploaded) &&
                      "opacity-50 cursor-not-allowed hover:bg-rose-500"
                  )}
                  title={
                    !activeEnteredRow
                      ? "Print first to enable upload"
                      : activeEnteredRow.uploaded
                      ? "Already uploaded"
                      : "Upload"
                  }
                >
                  <span className="inline-flex items-center gap-2">
                    <UploadIcon size={16} />
                    Upload (Printed &amp; Signed Document)
                  </span>
                </button>

                <input
                  ref={uploadRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => onUploadPicked(e.target.files?.[0])}
                />
              </div>

              {isUploaded && (
                <div className="text-center text-[12px] text-slate-600 dark:text-slate-300">
                  Uploaded • Marks entry is now restricted for this test.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View modal */}
      <Modal
        open={viewOpen}
        title="Marks Entered"
        onClose={() => setViewOpen(false)}
      >
        {viewRow ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 p-4">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {viewRow.courseCode} — {viewRow.courseName}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {viewRow.testName} • Type: {viewRow.type} • Max:{" "}
                <span className="font-semibold tabular-nums">{viewRow.maxMark}</span> • Entered On:{" "}
                <span className="font-semibold tabular-nums">{viewRow.enteredOn}</span>
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              Demo preview only (wire to backend to show the uploaded document / print PDF).
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setViewOpen(false)}
                className={cn(
                  "h-10 px-4 rounded-xl text-sm font-semibold transition",
                  "bg-white hover:bg-slate-50 text-slate-800 ring-1 ring-slate-200",
                  "dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-100 dark:ring-slate-800"
                )}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="h-10 px-4 rounded-xl text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white transition"
              >
                Print
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
