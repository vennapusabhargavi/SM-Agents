import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronDownIcon,
  XIcon,
  StarIcon,
  SendIcon,
  CheckCircle2Icon,
  MessageSquareTextIcon,
  BadgeCheckIcon,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

type InProgressRow = {
  courseCode: string;
  courseName: string;
  status: "InProgress";
  facultyName: string;
  enrollOn: string; // dd/mm/yyyy
};

type CompletedRow = {
  sno: number;
  courseCode: string;
  courseName: string;
  facultyName: string;
  monthYear: string;
  canSubmit: boolean;
};



const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost/smart_campus_api";
const STUDENT_API = `${API_BASE}/api/student`;

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function Pill({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "info" | "success" | "warn";
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

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <div className="overflow-x-auto scrollbar-hide">{children}</div>
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
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-4 py-3 text-[13px] text-slate-700 dark:text-slate-200 border-b border-slate-200/80 dark:border-slate-800",
        className
      )}
    >
      {children}
    </td>
  );
}

function SubmitButton({
  onClick,
  disabled,
  submitted,
}: {
  onClick: () => void;
  disabled?: boolean;
  submitted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!!disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold transition shadow-sm",
        disabled || submitted
          ? "bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
          : "bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.99]"
      )}
    >
      {submitted ? (
        <>
          <CheckCircle2Icon size={14} />
          Feedback Sent
        </>
      ) : (
        <>
          <SendIcon size={14} />
          Submit Feedback
        </>
      )}
    </button>
  );
}

function Section({
  title,
  tone,
  open,
  onToggle,
  right,
  children,
}: {
  title: string;
  tone: "red" | "teal";
  open: boolean;
  onToggle: () => void;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const header =
    tone === "red"
      ? "bg-gradient-to-r from-rose-600 via-red-500 to-orange-500"
      : "bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600";

  return (
    <section className="rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900 shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          header,
          "w-full px-4 md:px-5 py-3 flex items-center justify-between text-left"
        )}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-2xl bg-white/15 ring-1 ring-white/25 grid place-items-center">
            {tone === "red" ? (
              <MessageSquareTextIcon size={16} className="text-white" />
            ) : (
              <BadgeCheckIcon size={16} className="text-white" />
            )}
          </div>

          <div className="min-w-0">
            <div className="text-white font-semibold text-sm tracking-wide uppercase truncate">
              {title}
            </div>
            <div className="text-white/80 text-[12px] mt-0.5 truncate">
              {tone === "red"
                ? "Feedback for active courses"
                : "Feedback for completed courses"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {right}
          <ChevronDownIcon
            size={18}
            className={cn(
              "text-white/90 transition-transform",
              open ? "rotate-180" : "rotate-0"
            )}
          />
        </div>
      </button>

      {open && <div className="p-4 md:p-5">{children}</div>}
    </section>
  );
}

function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-3 sm:inset-6 grid place-items-center">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between">
            <div className="min-w-0">
              <div className="text-base font-semibold text-slate-900 dark:text-slate-50 truncate">
                {title}
              </div>
              {subtitle && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {subtitle}
                </div>
              )}
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

function Stars({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition grid place-items-center"
          aria-label={`${s} star`}
          title={`${s} star`}
        >
          <StarIcon
            size={16}
            className={s <= value ? "text-amber-500" : "text-slate-400"}
            fill={s <= value ? "currentColor" : "none"}
          />
        </button>
      ))}
    </div>
  );
}

export function StudentMyCourseFeedback() {
  const { user } = useAuth();
  const regNo = useMemo(() => user?.registerNumber || "19221314", [user]);

  const [openInProgress, setOpenInProgress] = useState(true);
  const [openCompleted, setOpenCompleted] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalCourse, setModalCourse] = useState<{
    courseCode: string;
    courseName: string;
    facultyName: string;
  } | null>(null);

  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [inProgress, setInProgress] = useState<InProgressRow[]>([]);
  const [completed, setCompleted] = useState<CompletedRow[]>([]);
  const [submittedCourses, setSubmittedCourses] = useState<string[]>([]);

  // Dummy data setup
  useEffect(() => {
    const storedInProgress = localStorage.getItem(`student_feedback_inprogress_${regNo}`);
    const storedCompleted = localStorage.getItem(`student_feedback_completed_${regNo}`);
    const storedSubmitted = localStorage.getItem(`student_feedback_submitted_${regNo}`);

    if (storedInProgress) {
      setInProgress(JSON.parse(storedInProgress));
    } else {
      const defaultInProgress: InProgressRow[] = [
        {
          courseCode: "CS101",
          courseName: "Introduction to Computer Science",
          status: "InProgress",
          facultyName: "Dr. John Smith",
          enrollOn: "01/01/2026",
        },
        {
          courseCode: "CS102",
          courseName: "Data Structures",
          status: "InProgress",
          facultyName: "Prof. Jane Doe",
          enrollOn: "15/01/2026",
        },
      ];
      setInProgress(defaultInProgress);
      localStorage.setItem(`student_feedback_inprogress_${regNo}`, JSON.stringify(defaultInProgress));
    }

    if (storedCompleted) {
      setCompleted(JSON.parse(storedCompleted));
    } else {
      const defaultCompleted: CompletedRow[] = [
        {
          sno: 1,
          courseCode: "CS103",
          courseName: "Algorithms",
          facultyName: "Dr. John Smith",
          monthYear: "Dec 2025",
          canSubmit: true,
        },
        {
          sno: 2,
          courseCode: "CS104",
          courseName: "Database Systems",
          facultyName: "Prof. Jane Doe",
          monthYear: "Nov 2025",
          canSubmit: false,
        },
        {
          sno: 3,
          courseCode: "CS105",
          courseName: "Operating Systems",
          facultyName: "Dr. John Smith",
          monthYear: "Oct 2025",
          canSubmit: true,
        },
      ];
      setCompleted(defaultCompleted);
      localStorage.setItem(`student_feedback_completed_${regNo}`, JSON.stringify(defaultCompleted));
    }

    if (storedSubmitted) {
      const submittedList = JSON.parse(storedSubmitted);
      setSubmittedCourses(submittedList);
      // Update completed to mark submitted as !canSubmit
      setCompleted(prev => prev.map(c => ({
        ...c,
        canSubmit: !submittedList.includes(c.courseCode)
      })));
    }
  }, [regNo]);

  // lock background scroll when modal is open
  useEffect(() => {
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [modalOpen]);



  const totalSubmittable = completed.filter((c) => c.canSubmit).length;

  const openSubmit = (row: {
    courseCode: string;
    courseName: string;
    facultyName: string;
  }) => {
    setSubmitted(false);
    setRating(4);
    setComment("");
    setModalCourse(row);
    setModalOpen(true);
  };

  const submit = async () => {
    if (!modalCourse) return;
    setSubmitted(false);
    // Simulate submission
    const storedSubmitted = localStorage.getItem(`student_feedback_submitted_${regNo}`);
    let submittedList = storedSubmitted ? JSON.parse(storedSubmitted) : [];
    if (!submittedList.includes(modalCourse.courseCode)) {
      submittedList.push(modalCourse.courseCode);
      localStorage.setItem(`student_feedback_submitted_${regNo}`, JSON.stringify(submittedList));
      setSubmittedCourses(submittedList);
      // Update completed courses
      setCompleted(prev => prev.map(c =>
        c.courseCode === modalCourse.courseCode ? { ...c, canSubmit: false } : c
      ));
      localStorage.setItem(`student_feedback_completed_${regNo}`, JSON.stringify(
        completed.map(c =>
          c.courseCode === modalCourse.courseCode ? { ...c, canSubmit: false } : c
        )
      ));
    }
    setSubmitted(true);
    setTimeout(() => setModalOpen(false), 900);
  };

  console.log("Rendering StudentMyCourseFeedback");

  return (
    <div className="w-full space-y-5">
      {/* ✅ Header like your screenshot: no card, no background */}
      <div className="px-0">
        <div className="text-[34px] font-light text-slate-800 dark:text-slate-50 tracking-tight">
          My Course Feedback
        </div>
        <div className="mt-1 text-[14px] text-slate-600 dark:text-slate-300">
          Register No: <span className="font-semibold text-slate-900 dark:text-white">{regNo}</span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Pill tone="info">{inProgress.length} in progress</Pill>
          <Pill tone="success">{totalSubmittable} ready</Pill>
          <Pill tone="neutral">{completed.length} completed</Pill>
        </div>
      </div>

      {/* Inprogress */}
      <Section
        title="INPROGRESS COURSES"
        tone="red"
        open={openInProgress}
        onToggle={() => setOpenInProgress((v) => !v)}
        right={<Pill tone="neutral">{inProgress.length} course(s)</Pill>}
      >
        <TableShell>
          <table className="min-w-[980px] w-full border-collapse">
            <thead>
              <tr>
                <Th>Course Code</Th>
                <Th>Course Name</Th>
                <Th>Status</Th>
                <Th>Faculty Name</Th>
                <Th>Enroll On</Th>
                <Th>Submit Feedback</Th>
              </tr>
            </thead>
            <tbody>
              {inProgress.map((r, idx) => (
                <tr
                  key={r.courseCode}
                  className={cn(
                    idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/60 dark:bg-slate-900/60",
                    "hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
                  )}
                >
                  <Td className="font-semibold text-slate-900 dark:text-white">{r.courseCode}</Td>
                  <Td className="text-slate-900 dark:text-white">{r.courseName}</Td>
                  <Td>
                    <div className="inline-flex items-center gap-2">
                      <Pill tone="info">InProgress</Pill>
                      <div className="h-2 w-24 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full w-2/3 bg-sky-500/80" />
                      </div>
                    </div>
                  </Td>
                  <Td>{r.facultyName}</Td>
                  <Td className="tabular-nums">{r.enrollOn}</Td>
                  <Td>
                    <SubmitButton
                      onClick={() =>
                        openSubmit({
                          courseCode: r.courseCode,
                          courseName: r.courseName,
                          facultyName: r.facultyName,
                        })
                      }
                      submitted={submittedCourses.includes(r.courseCode)}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      </Section>

      {/* Completed */}
      <Section
        title="COMPLETED COURSES"
        tone="teal"
        open={openCompleted}
        onToggle={() => setOpenCompleted((v) => !v)}
        right={<Pill tone="neutral">{completed.length} course(s)</Pill>}
      >
        <TableShell>
          <table className="min-w-[980px] w-full border-collapse">
            <thead>
              <tr>
                <Th>Sno</Th>
                <Th>Course Code</Th>
                <Th>Course Name</Th>
                <Th>Faculty Name</Th>
                <Th>Month & Year</Th>
                <Th>Submit</Th>
              </tr>
            </thead>
            <tbody>
              {completed.map((r, idx) => (
                <tr
                  key={r.sno}
                  className={cn(
                    idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/60 dark:bg-slate-900/60",
                    "hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
                  )}
                >
                  <Td className="text-slate-500 dark:text-slate-400 tabular-nums">{r.sno}</Td>
                  <Td className="font-semibold text-slate-900 dark:text-white">{r.courseCode}</Td>
                  <Td className="text-slate-900 dark:text-white">{r.courseName}</Td>
                  <Td className="text-slate-500 dark:text-slate-400">{r.facultyName || "—"}</Td>
                  <Td className="tabular-nums">{r.monthYear}</Td>
                  <Td>
                    <SubmitButton
                      onClick={() =>
                        openSubmit({
                          courseCode: r.courseCode,
                          courseName: r.courseName,
                          facultyName: r.facultyName || "Faculty",
                        })
                      }
                      disabled={!r.canSubmit}
                      submitted={submittedCourses.includes(r.courseCode)}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>

        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Tip: On mobile, swipe the table horizontally to view all columns.
        </div>
      </Section>

      {/* Feedback modal */}
      <Modal
        open={modalOpen}
        title={modalCourse ? `Submit Feedback • ${modalCourse.courseCode}` : "Submit Feedback"}
        subtitle={modalCourse ? modalCourse.courseName : undefined}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4">
          {modalCourse && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">Faculty</div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50 mt-1">
                {modalCourse.facultyName || "—"}
              </div>
            </div>
          )}

          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Overall Rating
            </div>
            <div className="mt-2">
              <Stars value={rating} onChange={setRating} />
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Choose 1 (poor) to 5 (excellent).
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Comments
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Write short feedback (optional)…"
              className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 dark:focus:ring-emerald-500/30"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-sm font-medium"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={submit}
              className="h-10 px-4 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.99] transition text-sm font-semibold inline-flex items-center gap-2 shadow-sm"
            >
              <SendIcon size={16} />
              Submit
            </button>
          </div>

          {submitted && (
            <div className="rounded-2xl border border-emerald-600/30 bg-emerald-600/10 p-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2Icon size={18} />
              Feedback submitted successfully.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default StudentMyCourseFeedback;
