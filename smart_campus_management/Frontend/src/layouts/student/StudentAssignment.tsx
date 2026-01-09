// src/layouts/student/StudentAssignment.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarClockIcon,
  CheckCircle2Icon,
  BookOpenIcon,
  ClipboardListIcon,
  DownloadIcon,
  ExternalLinkIcon,
  SearchIcon,
  ChevronDownIcon,
} from "lucide-react";

type TabKey = "upcoming" | "completed" | "content" | "exams";
type Course = { code: string; name: string };

type AssignmentRow = {
  id: string;
  title: string;
  courseCode: string;
  dueDate: string;
  status: "Upcoming" | "Submitted" | "Evaluated" | "Missing";
  faculty?: string;
  maxMarks?: number;
};

type ContentRow = {
  id: string;
  title: string;
  courseCode: string;
  kind: "PDF" | "PPT" | "Link" | "Video";
  postedOn: string;
  url?: string;
};

type ExamRow = {
  id: string;
  courseCode: string;
  examName: string;
  date: string;
  mode: "Online" | "Offline";
  status: "Scheduled" | "Completed";
};

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost/smart_campus_api";
const STUDENT_API = `${API_BASE}/api/student`;

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function Chip({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "info" | "success" | "warn" | "danger";
  children: React.ReactNode;
}) {
  const map = {
    neutral:
      "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-900/60 dark:text-slate-200 dark:ring-slate-800",
    info:
      "bg-sky-100 text-sky-800 ring-sky-200 dark:bg-sky-950/30 dark:text-sky-200 dark:ring-sky-900/40",
    success:
      "bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-900/40",
    warn:
      "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-950/25 dark:text-amber-200 dark:ring-amber-900/40",
    danger:
      "bg-rose-100 text-rose-800 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-200 dark:ring-rose-900/40",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1",
        map[tone]
      )}
    >
      {children}
    </span>
  );
}

function PrimaryButton({
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
        "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl",
        "text-[13px] font-semibold text-white",
        "bg-teal-600 hover:bg-teal-700 active:bg-teal-800",
        "shadow-sm hover:shadow-md transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50",
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
        "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl",
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

function SegTab({
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
        "inline-flex items-center gap-2 px-3 py-2 rounded-xl transition",
        "text-[13px] font-semibold",
        active
          ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-800"
          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-900/50"
      )}
    >
      <span className={cn("opacity-90", active && "text-teal-700 dark:text-teal-300")}>
        {icon}
      </span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

function Panel({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <div className="px-4 md:px-5 py-3 flex items-center justify-between bg-gradient-to-r from-slate-600 to-slate-500 text-white">
        <div className="text-[13px] font-semibold tracking-wide uppercase">{title}</div>
        {right}
      </div>
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/25 p-10 text-center">
      <div className="text-sm font-semibold text-slate-900 dark:text-white">{title}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</div>
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

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-4 py-3 text-[13px] text-slate-700 dark:text-slate-200 border-b border-slate-200/80 dark:border-slate-800">
      {children}
    </td>
  );
}

const STORAGE_ASSIGNMENTS = "student_assignments_192211661";
const STORAGE_CONTENT = "student_content_192211661";
const STORAGE_EXAMS = "student_exams_192211661";

export function StudentAssignment() {
  // ===== sample data =====
  const demoCourses: Course[] = useMemo(
    () => [
      { code: "MMA1088", name: "Mentor Mentee Meeting" },
      { code: "ECA15", name: "Transmission Lines And Waveguides" },
      { code: "ECA03", name: "Signals and Systems" },
    ],
    []
  );

  const demoAssignments: AssignmentRow[] = useMemo(
    () => [
      {
        id: "a1",
        title: "Reflection Note - Week 1",
        courseCode: "MMA1088",
        dueDate: "10/01/2026",
        status: "Upcoming",
        faculty: "MATHIVANAN P",
        maxMarks: 10,
      },
      {
        id: "a2",
        title: "Quiz Worksheet - Unit 2",
        courseCode: "ECA03",
        dueDate: "12/01/2026",
        status: "Submitted",
        faculty: "Faculty Name",
        maxMarks: 20,
      },
      {
        id: "a3",
        title: "Problem Set - Waveguides",
        courseCode: "ECA15",
        dueDate: "05/12/2025",
        status: "Evaluated",
        faculty: "Faculty Name",
        maxMarks: 15,
      },
    ],
    []
  );

  const demoContent: ContentRow[] = useMemo(
    () => [
      { id: "c1", title: "Unit 1 Notes (PDF)", courseCode: "ECA03", kind: "PDF", postedOn: "02/01/2026" },
      { id: "c2", title: "Lab Manual", courseCode: "ECA15", kind: "PDF", postedOn: "28/12/2025" },
      { id: "c3", title: "Reference Link", courseCode: "MMA1088", kind: "Link", postedOn: "01/01/2026", url: "https://example.com" },
    ],
    []
  );

  const demoExams: ExamRow[] = useMemo(
    () => [
      { id: "e1", courseCode: "ECA03", examName: "Internal Assessment 1", date: "20/01/2026", mode: "Offline", status: "Scheduled" },
      { id: "e2", courseCode: "ECA15", examName: "Model Exam", date: "15/12/2025", mode: "Offline", status: "Completed" },
    ],
    []
  );

  // ===== state =====
  const [courses, setCourses] = useState<Course[]>(demoCourses);
  const [assignments, setAssignments] = useState<AssignmentRow[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_ASSIGNMENTS);
      return stored ? JSON.parse(stored) : demoAssignments;
    } catch {
      return demoAssignments;
    }
  });
  const [content, setContent] = useState<ContentRow[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_CONTENT);
      return stored ? JSON.parse(stored) : demoContent;
    } catch {
      return demoContent;
    }
  });
  const [exams, setExams] = useState<ExamRow[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_EXAMS);
      return stored ? JSON.parse(stored) : demoExams;
    } catch {
      return demoExams;
    }
  });

  const [course, setCourse] = useState<string>(""); // "" = all
  const [tab, setTab] = useState<TabKey>("upcoming");
  const [q, setQ] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`${STUDENT_API}/courses`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.courses) setCourses(json.courses as Course[]);
      })
      .catch(() => {});

    fetch(`${STUDENT_API}/assignments`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.assignments) {
          setAssignments(json.assignments as AssignmentRow[]);
          localStorage.setItem(STORAGE_ASSIGNMENTS, JSON.stringify(json.assignments));
        }
      })
      .catch(() => {});

    fetch(`${STUDENT_API}/assignments/content`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.content) {
          setContent(json.content as ContentRow[]);
          localStorage.setItem(STORAGE_CONTENT, JSON.stringify(json.content));
        }
      })
      .catch(() => {});

    fetch(`${STUDENT_API}/assignments/exams`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.exams) {
          setExams(json.exams as ExamRow[]);
          localStorage.setItem(STORAGE_EXAMS, JSON.stringify(json.exams));
        }
      })
      .catch(() => {});
  }, []);

  const filteredAssignments = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return assignments.filter((a) => {
      const courseOk = !course || a.courseCode === course;
      const queryOk =
        !needle ||
        a.title.toLowerCase().includes(needle) ||
        a.courseCode.toLowerCase().includes(needle) ||
        (a.faculty || "").toLowerCase().includes(needle);
      return courseOk && queryOk;
    });
  }, [assignments, course, q]);

  const upcoming = filteredAssignments.filter((a) => a.status === "Upcoming");
  const completed = filteredAssignments.filter((a) => a.status !== "Upcoming");

  const filteredContent = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return content.filter((c) => {
      const courseOk = !course || c.courseCode === course;
      const queryOk =
        !needle ||
        c.title.toLowerCase().includes(needle) ||
        c.courseCode.toLowerCase().includes(needle) ||
        c.kind.toLowerCase().includes(needle);
      return courseOk && queryOk;
    });
  }, [content, course, q]);

  const filteredExams = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return exams.filter((e) => {
      const courseOk = !course || e.courseCode === course;
      const queryOk =
        !needle ||
        e.examName.toLowerCase().includes(needle) ||
        e.courseCode.toLowerCase().includes(needle) ||
        e.status.toLowerCase().includes(needle);
      return courseOk && queryOk;
    });
  }, [exams, course, q]);

  const statusChip = (s: AssignmentRow["status"]) => {
    if (s === "Upcoming") return <Chip tone="warn">Upcoming</Chip>;
    if (s === "Submitted") return <Chip tone="info">Submitted</Chip>;
    if (s === "Evaluated") return <Chip tone="success">Evaluated</Chip>;
    return <Chip tone="danger">Missing</Chip>;
  };

  return (
    <div className="w-full p-4 md:p-6 space-y-5">
      {/* ===== Page Title (our style) ===== */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="text-[28px] font-light text-slate-700 dark:text-slate-100 leading-none">
            Assignment
          </div>
          <div className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
            Manage assignments, course content and exam schedule — in one place
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={() => alert("Export (wire to backend later).")}>
            <DownloadIcon size={16} />
            Export
          </GhostButton>
        </div>
      </div>

      {/* ===== Filters Card ===== */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 md:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
          <div className="lg:col-span-5">
            <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">
              Course
            </label>
            <div className="mt-1 relative">
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className={cn(
                  "w-full h-11 rounded-xl px-3 pr-10 text-[13px]",
                  "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100",
                  "border border-slate-300/80 dark:border-slate-700",
                  "shadow-inner",
                  "focus:outline-none focus:ring-2 focus:ring-slate-400/30 dark:focus:ring-slate-500/30",
                  "transition"
                )}
              >
                <option value="">-- Select --</option>
                {courses.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          <div className="lg:col-span-4">
            <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">
              Search
            </label>
            <div className="mt-1 relative">
              <SearchIcon
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by title, faculty, course…"
                className={cn(
                  "w-full h-11 rounded-xl pl-9 pr-3 text-[13px]",
                  "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100",
                  "border border-slate-300/80 dark:border-slate-700",
                  "shadow-inner",
                  "focus:outline-none focus:ring-2 focus:ring-slate-400/30 dark:focus:ring-slate-500/30",
                  "transition"
                )}
              />
            </div>
          </div>

          <div className="lg:col-span-3">
            <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">
              Quick Summary
            </label>
            <div className="mt-1 h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 px-3 flex items-center gap-2">
              <Chip tone="warn">{upcoming.length} upcoming</Chip>
              <Chip tone="success">{completed.length} completed</Chip>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-2">
          <SegTab
            active={tab === "upcoming"}
            icon={<CalendarClockIcon size={16} />}
            label="Today / Upcoming"
            onClick={() => setTab("upcoming")}
          />
          <SegTab
            active={tab === "completed"}
            icon={<CheckCircle2Icon size={16} />}
            label="Completed"
            onClick={() => setTab("completed")}
          />
          <SegTab
            active={tab === "content"}
            icon={<BookOpenIcon size={16} />}
            label="Content"
            onClick={() => setTab("content")}
          />
          <SegTab
            active={tab === "exams"}
            icon={<ClipboardListIcon size={16} />}
            label="Exams"
            onClick={() => setTab("exams")}
          />
        </div>
      </div>

      {/* ===== Panels ===== */}
      {tab === "upcoming" && (
        <Panel
          title="TODAY / UPCOMING ASSIGNMENT"
          right={<div className="text-white/90 text-xs font-semibold">{upcoming.length} item(s)</div>}
        >
          {upcoming.length === 0 ? (
            <EmptyState title="No upcoming assignments" subtitle="New assignments published by faculty will appear here." />
          ) : (
            <TableShell>
              <table className="min-w-[980px] w-full border-collapse">
                <thead>
                  <tr>
                    <Th>Course</Th>
                    <Th>Title</Th>
                    <Th>Due</Th>
                    <Th>Faculty</Th>
                    <Th>Status</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((a, idx) => (
                    <tr
                      key={a.id}
                      className={cn(
                        idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/60 dark:bg-slate-900/60",
                        "hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
                      )}
                    >
                      <Td>
                        <span className="font-semibold text-slate-900 dark:text-white">{a.courseCode}</span>
                      </Td>
                      <Td>
                        <div className="font-semibold text-slate-900 dark:text-white">{a.title}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Max Marks: {a.maxMarks ?? "—"}
                        </div>
                      </Td>
                      <Td className="tabular-nums">{a.dueDate}</Td>
                      <Td>{a.faculty || "—"}</Td>
                      <Td>{statusChip(a.status)}</Td>
                      <Td>
                        <PrimaryButton onClick={() => alert("Open assignment details (wire to API later).")}>
                          View / Submit
                        </PrimaryButton>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          )}
        </Panel>
      )}

      {tab === "completed" && (
        <Panel
          title="COMPLETED ASSIGNMENT"
          right={<div className="text-white/90 text-xs font-semibold">{completed.length} item(s)</div>}
        >
          <div className="mb-3 text-[13px] text-slate-700 dark:text-slate-200">
            <span className="font-semibold">Completed Assignment</span>{" "}
            <span className="text-slate-500 dark:text-slate-400">— to view the completed assignment</span>
          </div>

          {completed.length === 0 ? (
            <EmptyState title="No completed assignments" subtitle="Submitted & evaluated assignments will be listed here." />
          ) : (
            <TableShell>
              <table className="min-w-[980px] w-full border-collapse">
                <thead>
                  <tr>
                    <Th>Course</Th>
                    <Th>Title</Th>
                    <Th>Due</Th>
                    <Th>Status</Th>
                    <Th>View</Th>
                  </tr>
                </thead>
                <tbody>
                  {completed.map((a, idx) => (
                    <tr
                      key={a.id}
                      className={cn(
                        idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/60 dark:bg-slate-900/60",
                        "hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
                      )}
                    >
                      <Td>
                        <span className="font-semibold text-slate-900 dark:text-white">{a.courseCode}</span>
                      </Td>
                      <Td>
                        <div className="font-semibold text-slate-900 dark:text-white">{a.title}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Faculty: {a.faculty || "—"}
                        </div>
                      </Td>
                      <Td className="tabular-nums">{a.dueDate}</Td>
                      <Td>{statusChip(a.status)}</Td>
                      <Td>
                        <GhostButton onClick={() => alert("Open completed assignment (wire to API later).")}>
                          View
                        </GhostButton>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          )}
        </Panel>
      )}

      {tab === "content" && (
        <Panel
          title="CONTENT"
          right={<div className="text-white/90 text-xs font-semibold">{filteredContent.length} item(s)</div>}
        >
          {filteredContent.length === 0 ? (
            <EmptyState title="No content available" subtitle="Shared files/links will appear here." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredContent.map((c) => {
                const tone = c.kind === "PDF" ? "info" : c.kind === "Link" ? "success" : "neutral";
                return (
                  <div
                    key={c.id}
                    className={cn(
                      "rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm",
                      "p-4 hover:shadow-md transition"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">
                          {c.title}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {c.courseCode} • Posted {c.postedOn}
                        </div>
                      </div>
                      <Chip tone={tone as any}>{c.kind}</Chip>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <GhostButton onClick={() => alert("Download/open content (wire to API later).")}>
                        <DownloadIcon size={16} />
                        Download
                      </GhostButton>

                      {c.url && (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(
                            "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl",
                            "text-[13px] font-semibold text-white",
                            "bg-slate-900 hover:bg-slate-800",
                            "dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100",
                            "shadow-sm transition"
                          )}
                        >
                          <ExternalLinkIcon size={16} />
                          Open
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      {tab === "exams" && (
        <Panel
          title="EXAMS"
          right={<div className="text-white/90 text-xs font-semibold">{filteredExams.length} item(s)</div>}
        >
          {filteredExams.length === 0 ? (
            <EmptyState title="No exams found" subtitle="Published schedules will appear here." />
          ) : (
            <TableShell>
              <table className="min-w-[980px] w-full border-collapse">
                <thead>
                  <tr>
                    <Th>Course</Th>
                    <Th>Exam</Th>
                    <Th>Date</Th>
                    <Th>Mode</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExams.map((e, idx) => (
                    <tr
                      key={e.id}
                      className={cn(
                        idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/60 dark:bg-slate-900/60",
                        "hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
                      )}
                    >
                      <Td>
                        <span className="font-semibold text-slate-900 dark:text-white">{e.courseCode}</span>
                      </Td>
                      <Td>
                        <span className="font-semibold text-slate-900 dark:text-white">{e.examName}</span>
                      </Td>
                      <Td className="tabular-nums">{e.date}</Td>
                      <Td>
                        <Chip tone="neutral">{e.mode}</Chip>
                      </Td>
                      <Td>
                        {e.status === "Scheduled" ? (
                          <Chip tone="warn">Scheduled</Chip>
                        ) : (
                          <Chip tone="success">Completed</Chip>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          )}
        </Panel>
      )}
    </div>
  );
}

export default StudentAssignment;
