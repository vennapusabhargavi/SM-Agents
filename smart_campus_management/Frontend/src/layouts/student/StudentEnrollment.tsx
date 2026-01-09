import React, { useMemo, useState, useEffect, useCallback } from "react";
import { ChevronDownIcon, InfoIcon, CheckIcon } from "lucide-react";

type Slot = string;
type CourseStatus = "APPROVED" | "PENDING" | "REJECTED" | "NONE";

type SlotDecision = Record<string, "APPROVED" | "PENDING" | "REJECTED">;

type Course = {
  id: string;
  code: string;
  title: string;
  faculty: string;
  seats: number;
  registered: number;
  availableSeats: number;
};




const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost/smart_campus_api";
const STUDENT_API = `${API_BASE}/api/student`;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function StatusLegendPill({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "amber" | "red";
}) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
      : tone === "amber"
      ? "bg-amber-100 text-amber-800 ring-amber-200"
      : "bg-rose-100 text-rose-800 ring-rose-200";

  return (
    <span className={cn("inline-flex px-3 py-1.5 rounded-md text-[13px] font-medium ring-1", toneClass)}>
      {label}
    </span>
  );
}

function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between gap-3",
          "px-4 md:px-5 py-3",
          "bg-gradient-to-r from-slate-600 to-slate-500 text-white",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        )}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/15">
            <InfoIcon size={16} />
          </span>
          <span className="text-[14px] font-semibold">{title}</span>
        </div>

        <ChevronDownIcon
          size={18}
          className={cn("transition-transform duration-300", open ? "rotate-180" : "rotate-0")}
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="p-4 md:p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function CourseCell({
  course,
  status,
  selected,
  onSelect,
}: {
  course: Course;
  status: CourseStatus;
  selected: boolean;
  onSelect?: () => void;
}) {
  const statusTone =
    status === "APPROVED"
      ? "bg-emerald-50 dark:bg-emerald-950/20"
      : status === "PENDING"
      ? "bg-amber-50 dark:bg-amber-950/15"
      : status === "REJECTED"
      ? "bg-rose-50 dark:bg-rose-950/15"
      : "bg-white dark:bg-slate-900";

  const ringTone =
    status === "APPROVED"
      ? "ring-emerald-200 dark:ring-emerald-900/40"
      : status === "PENDING"
      ? "ring-amber-200 dark:ring-amber-900/40"
      : status === "REJECTED"
      ? "ring-rose-200 dark:ring-rose-900/40"
      : "ring-slate-200 dark:ring-slate-800";

  const statusLabel =
    status === "APPROVED" ? "Approved" : status === "PENDING" ? "Pending" : status === "REJECTED" ? "Rejected" : "";

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!onSelect}
      className={cn(
        "w-full text-left min-h-[92px] p-3 rounded-xl ring-1 transition",
        "hover:shadow-sm hover:shadow-slate-900/5 dark:hover:shadow-black/20",
        selected ? "ring-2 ring-slate-900 dark:ring-white shadow-sm" : ringTone,
        statusTone,
        !onSelect && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-0.5 inline-flex h-4 w-4 rounded-full border",
            selected ? "border-slate-900 dark:border-white" : "border-slate-300 dark:border-slate-700"
          )}
          aria-hidden="true"
        >
          <span className={cn("m-auto h-2 w-2 rounded-full transition", selected ? "bg-slate-900 dark:bg-white" : "bg-transparent")} />
        </span>

        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-slate-900 dark:text-white leading-snug">
            {course.code} - {course.title}
          </div>
          <div className="mt-1 text-[12px] text-slate-600 dark:text-slate-300">{course.faculty}</div>

          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-teal-600/90 px-2 py-0.5 text-[11px] font-bold text-white">
              {course.registered}/{course.seats}
            </span>

            {status !== "NONE" && (
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                {statusLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

export function StudentEnrollment() {
  const reg = localStorage.getItem("userId") || "19221314";

  const [courses, setCourses] = useState<Course[]>([]);
  const availableSlots: Slot[] = ["Slot A", "Slot B", "Slot C", "Slot D", "Slot E", "Slot F", "Slot G", "Slot H", "Slot I", "Slot J", "Slot K", "Slot L", "Slot M", "Slot N", "Slot O", "Slot P", "Slot Q", "Slot R", "Slot S", "Slot T", "Slot U", "Slot V", "Slot W", "Slot X", "Slot Y", "Slot Z"];
  const [slot, setSlot] = useState<Slot>("Slot A");
  const [loading, setLoading] = useState(false);

  // Decisions per slot
  const [decisions, setDecisions] = useState<Record<string, SlotDecision>>({});

  // UI selection for current slot
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  // selectedCourseId is now independent of decisions state
  // It tracks user selection, decisions tracks actual request status

  function statusForCourse(courseId: string): CourseStatus {
    return decisions[slot]?.[courseId] || "NONE";
  }

  const isSlotLocked = useMemo(() => {
    const slotDecisions = decisions[slot] || {};
    return Object.values(slotDecisions).includes("APPROVED");
  }, [decisions, slot]);

  function selectCourse(courseId: string) {
    setSelectedCourseId(courseId);
    // Don't set pending status here - only after actually sending the request
  }

  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState<{ type: "ok" | "warn"; msg: string } | null>(null);

  // Load dummy data
  useEffect(() => {
    const storedDecisions = localStorage.getItem(`student_enrollment_decisions_${reg}`);
    if (storedDecisions) {
      setDecisions(JSON.parse(storedDecisions));
    } else {
      // Dummy initial decisions - some approved for demo
      const defaultDecisions: Record<string, SlotDecision> = {
        "Slot A": {
          "1": "APPROVED", // CS101 approved
        },
        "Slot B": {
          "2": "PENDING", // CS102 pending
        },
      };
      setDecisions(defaultDecisions);
      localStorage.setItem(`student_enrollment_decisions_${reg}`, JSON.stringify(defaultDecisions));
    }

    // Dummy courses - same for all slots for simplicity
    const dummyCourses: Course[] = [
      {
        id: "1",
        code: "CS101",
        title: "Introduction to Computer Science",
        faculty: "Dr. John Smith",
        seats: 50,
        registered: 45,
        availableSeats: 5,
      },
      {
        id: "2",
        code: "CS102",
        title: "Data Structures",
        faculty: "Prof. Jane Doe",
        seats: 50,
        registered: 40,
        availableSeats: 10,
      },
      {
        id: "3",
        code: "CS103",
        title: "Algorithms",
        faculty: "Dr. John Smith",
        seats: 30,
        registered: 20,
        availableSeats: 10,
      },
      {
        id: "4",
        code: "CS104",
        title: "Database Systems",
        faculty: "Prof. Jane Doe",
        seats: 40,
        registered: 30,
        availableSeats: 10,
      },
      {
        id: "5",
        code: "CS105",
        title: "Operating Systems",
        faculty: "Dr. John Smith",
        seats: 40,
        registered: 35,
        availableSeats: 5,
      },
    ];
    setCourses(dummyCourses);
    setLoading(false);
  }, [reg]);

  async function sendForApproval() {
    if (!selectedCourseId) {
      setFlash({ type: "warn", msg: "Please select a course to send for approval." });
      window.setTimeout(() => setFlash(null), 2200);
      return;
    }

    const currentStatuses = decisions[slot] || {};
    if (Object.values(currentStatuses).some(s => s === "PENDING" || s === "APPROVED")) {
      setFlash({ type: "warn", msg: "You already have a pending or approved request for this slot." });
      window.setTimeout(() => setFlash(null), 2200);
      return;
    }

    setSubmitting(true);
    setFlash(null);

    // Simulate API call
    setTimeout(() => {
      setDecisions((prev) => {
        const newDecisions = {
          ...prev,
          [slot]: {
            ...prev[slot],
            [selectedCourseId]: "PENDING",
          } as SlotDecision,
        };
        localStorage.setItem(`student_enrollment_decisions_${reg}`, JSON.stringify(newDecisions));
        return newDecisions;
      });
      setFlash({ type: "ok", msg: "Sent for approval successfully." });
      window.setTimeout(() => setFlash(null), 2200);
      setSubmitting(false);
    }, 1000);
  }

  return (
    <div className="w-full p-4 md:p-6">
      {/* Page title */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[28px] leading-none font-light text-slate-700 dark:text-slate-100">
            Enrollment
          </div>
          <div className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
            Register No:{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">{reg}</span>
          </div>
        </div>

        {flash && (
          <div
            className={cn(
              "rounded-xl px-3 py-2 text-[13px] font-medium ring-1",
              flash.type === "ok"
                ? "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-900/40"
                : "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/20 dark:text-amber-200 dark:ring-amber-900/40"
            )}
          >
            {flash.msg}
          </div>
        )}
      </div>

      {/* Top controls */}
      <div className="mb-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="text-[13px] font-medium text-rose-500">Select Slot</div>

            <div className="w-full sm:w-[520px]">
              <select
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                className={cn(
                  "w-full rounded-xl border border-slate-300/90 dark:border-slate-700",
                  "bg-white dark:bg-slate-950",
                  "px-3 py-2.5 text-[13px]",
                  "text-slate-900 dark:text-slate-100",
                  "shadow-inner",
                  "focus:outline-none focus:ring-2 focus:ring-slate-400/40 dark:focus:ring-slate-500/40"
                )}
              >
                {availableSlots.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
            <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Note:</span>
            <StatusLegendPill label="Approved" tone="green" />
            <StatusLegendPill label="Pending for Approval" tone="amber" />
            <StatusLegendPill label="Rejected" tone="red" />
          </div>
        </div>
      </div>

      {/* Course Details */}
      <CollapsibleSection title="Course Details" defaultOpen>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/20 p-3 md:p-4">
          <div
            className={cn(
              "hidden md:grid grid-cols-5 gap-3",
              "rounded-xl border border-slate-200 dark:border-slate-800",
              "bg-slate-100/70 dark:bg-slate-900/60",
              "px-3 py-2.5"
            )}
          >
            <div className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Select Course</div>
            <div />
            <div />
            <div />
            <div />
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-slate-500 dark:text-slate-400">Loading courses...</div>
                </div>
              </div>
            ) : courses.length === 0 ? (
              <div className="col-span-full flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-slate-500 dark:text-slate-400 mb-2">No courses available</div>
                  <div className="text-sm text-slate-400 dark:text-slate-500">
                    No approved courses found for {slot}.
                  </div>
                </div>
              </div>
            ) : (
              courses.map((c) => {
                const st = statusForCourse(c.id);
                const canSelect = !isSlotLocked || st !== "NONE";
                return (
                  <CourseCell
                    key={c.id}
                    course={c}
                    status={st}
                    selected={selectedCourseId === c.id}
                    onSelect={canSelect ? () => selectCourse(c.id) : undefined}
                  />
                );
              })
            )}
          </div>
        </div>

        {courses.length > 0 && !isSlotLocked && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={sendForApproval}
              disabled={submitting}
              className={cn(
                "inline-flex items-center justify-center gap-2",
                "rounded-xl px-5 py-2.5",
                "text-[13px] font-semibold text-white",
                "bg-teal-600 hover:bg-teal-700",
                "shadow-sm hover:shadow-md transition",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50",
                "disabled:opacity-60 disabled:cursor-not-allowed"
              )}
            >
              <CheckIcon size={16} />
              {submitting ? "Sending..." : "Send for Approval"}
            </button>
          </div>
        )}

        <div className="mt-3 text-center text-[12px] text-slate-500 dark:text-slate-400">
          Selected Slot: <span className="font-semibold text-slate-700 dark:text-slate-200">{slot}</span>
        </div>
      </CollapsibleSection>
    </div>
  );
}
