// src/layouts/teacher/course/CreateCourse.tsx
import React, { useMemo, useState } from "react";
import {
  ChevronDownIcon,
  EyeIcon,
  SaveIcon,
  XIcon,
  LayersIcon,
  BookOpenIcon,
  HashIcon,
  LayoutGridIcon,
  SearchIcon,
} from "lucide-react";
import { useToast } from "../../../components/Toast";

type Option = { value: string; label: string };

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
      {children}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] text-slate-500 dark:text-slate-400">{children}</div>;
}

function FieldShell({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1.5">{children}</div>;
}

function Input({
  value,
  onChange,
  placeholder,
  disabled,
  inputMode,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      inputMode={inputMode}
      className={cn(
        "w-full h-11 rounded-xl px-3 text-sm",
        "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
        "ring-1 ring-slate-200 dark:ring-slate-800",
        "placeholder:text-slate-400 dark:placeholder:text-slate-500",
        "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 dark:focus:ring-indigo-300/60",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        "transition"
      )}
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full h-11 rounded-xl px-3 pr-10 text-sm appearance-none",
          "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
          "ring-1 ring-slate-200 dark:ring-slate-800",
          "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 dark:focus:ring-indigo-300/60",
          "transition"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
    </div>
  );
}

function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Search...",
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options.slice(0, 50); // Limit to 50 for performance
    return options.filter(opt => opt.toLowerCase().includes(q)).slice(0, 50);
  }, [options, search]);

  const displayValue = value || "";

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-11 rounded-xl px-3 pr-10 text-sm cursor-pointer",
          "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
          "ring-1 ring-slate-200 dark:ring-slate-800",
          "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 dark:focus:ring-indigo-300/60",
          "transition flex items-center"
        )}
      >
        <span className={cn("truncate", !displayValue && "text-slate-400 dark:text-slate-500")}>
          {displayValue || placeholder}
        </span>
      </div>
      <ChevronDownIcon
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
              <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses..."
                className="w-full h-9 pl-9 pr-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400/60"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            <div
              onClick={() => {
                onChange("None");
                setSearch("");
                setIsOpen(false);
              }}
              className="px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-slate-500 dark:text-slate-400"
            >
              -- None --
            </div>
            {filtered.map((option) => (
              <div
                key={option}
                onClick={() => {
                  onChange(option);
                  setSearch("");
                  setIsOpen(false);
                }}
                className={cn(
                  "px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800",
                  value === option && "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300"
                )}
              >
                {option}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Button({
  tone = "primary",
  children,
  onClick,
  type = "button",
  disabled,
}: {
  tone?: "primary" | "ghost" | "danger";
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const base = cn(
    "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl",
    "text-sm font-semibold transition",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950",
    disabled && "opacity-60 cursor-not-allowed"
  );

  const styles =
    tone === "primary"
      ? cn(
          "text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800",
          "shadow-sm shadow-teal-600/20",
          "focus-visible:ring-teal-400/60 dark:focus-visible:ring-teal-300/60"
        )
      : tone === "danger"
      ? cn(
          "text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800",
          "shadow-sm shadow-rose-600/20",
          "focus-visible:ring-rose-400/60 dark:focus-visible:ring-rose-300/60"
        )
      : cn(
          "bg-white hover:bg-slate-50 text-slate-800 ring-1 ring-slate-200",
          "dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-100 dark:ring-slate-800",
          "focus-visible:ring-slate-400/40 dark:focus-visible:ring-slate-700/60"
        );

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cn(base, styles)}>
      {children}
    </button>
  );
}



export default function CreateCourse() {
  const { showToast } = useToast();
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost/smart_campus_api";
  const TEACHER_API = `${API_BASE}/api/teacher`;

  // ---- options (demo; wire to API later) ----
  const typeOptions: Option[] = useMemo(
    () => [
      { value: "CONTACT", label: "Contact Course" },
      { value: "NON_CONTACT", label: "Non-Contact Course" },
      { value: "LAB", label: "Lab / Practical" },
    ],
    []
  );

  const subjectCategoryOptions: Option[] = useMemo(
    () => [
      { value: "", label: "--Select--" },
      { value: "PROGRAM_CORE", label: "Program Core" },
      { value: "PROGRAM_ELECTIVE", label: "Program Elective" },
      { value: "UNIVERSITY_CORE", label: "University Core" },
      { value: "UNIVERSITY_ELECTIVE", label: "University Elective" },
    ],
    []
  );

  const courseCategoryOptions: Option[] = useMemo(
    () => [
      { value: "", label: "--Select--" },
      { value: "THEORY", label: "Theory" },
      { value: "LAB", label: "Lab" },
      { value: "PROJECT", label: "Project" },
      { value: "MANDATORY", label: "Mandatory" },
    ],
    []
  );

  const slotOptions: Option[] = useMemo(
    () => [
      { value: "", label: "--Select--" },
      { value: "Slot A", label: "Slot A" },
      { value: "Slot B", label: "Slot B" },
      { value: "Slot C", label: "Slot C" },
      { value: "Slot D", label: "Slot D" },
      { value: "Slot E", label: "Slot E" },
      { value: "Slot F", label: "Slot F" },
      { value: "Slot G", label: "Slot G" },
      { value: "Slot H", label: "Slot H" },
      { value: "Slot I", label: "Slot I" },
      { value: "Slot J", label: "Slot J" },
      { value: "Slot K", label: "Slot K" },
      { value: "Slot L", label: "Slot L" },
      { value: "Slot M", label: "Slot M" },
      { value: "Slot N", label: "Slot N" },
      { value: "Slot O", label: "Slot O" },
      { value: "Slot P", label: "Slot P" },
      { value: "Slot Q", label: "Slot Q" },
      { value: "Slot R", label: "Slot R" },
      { value: "Slot S", label: "Slot S" },
      { value: "Slot T", label: "Slot T" },
      { value: "Slot U", label: "Slot U" },
      { value: "Slot V", label: "Slot V" },
      { value: "Slot W", label: "Slot W" },
      { value: "Slot X", label: "Slot X" },
      { value: "Slot Y", label: "Slot Y" },
      { value: "Slot Z", label: "Slot Z" },
    ],
    []
  );

  const prerequisiteOptions: string[] = useMemo(
    () => [
      // Prerequisites will be dynamically loaded from existing courses in future
      // For now, teachers can enter custom prerequisite text or leave empty
    ],
    []
  );

  // ---- form state ----
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("CONTACT");
  const [subjectCategory, setSubjectCategory] = useState("");
  const [courseCategory, setCourseCategory] = useState("");
  const [prereq, setPrereq] = useState("None");
  const [slot, setSlot] = useState("");
  const [maxSlotCount, setMaxSlotCount] = useState("30");

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!code.trim()) e.code = "Course Code is required.";
    if (!name.trim()) e.name = "Course Name is required.";
    if (!subjectCategory) e.subjectCategory = "Select Subject Category.";
    if (!courseCategory) e.courseCategory = "Select Course Category.";
    if (!slot) e.slot = "Select Slot.";
    const n = Number(maxSlotCount);
    if (!Number.isFinite(n) || n <= 0) e.maxSlotCount = "Max Slot Count must be a positive number.";
    return e;
  }, [code, name, subjectCategory, courseCategory, slot, maxSlotCount]);

  const isValid = Object.keys(errors).length === 0;

  const onViewCourse = () => alert("Navigate to View Course page (wire to route later).");

  const onClear = () => {
    setCode("");
    setName("");
    setType("CONTACT");
    setSubjectCategory("");
    setCourseCategory("");
    setPrereq("None");
    setSlot("");
    setMaxSlotCount("30");
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      alert(Object.values(errors)[0] || "Please fix errors.");
      return;
    }

    const payload = {
      code: code.trim().toUpperCase(),
      title: name.trim(),
      slot: slot,
      seats: Number(maxSlotCount),
      type,
      subjectCategory,
      courseCategory,
      prerequisite: prereq === "None" ? "" : prereq,
    };

    try {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${TEACHER_API}/courses`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create course");
      }

      showToast("success", "Course created successfully");
      onClear();
    } catch (err: any) {
      showToast("error", "Error", err.message);
    }
  };

  return (
    <div className="w-full relative">
      {/* page container (same dashboard feel) */}
      <div className="w-full p-4 md:p-6 space-y-4">
        {/* top line */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[28px] font-light text-slate-700 dark:text-slate-100 leading-none">
              Create Course
            </div>
            <div className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
              Define course metadata, slot and categories.
            </div>
          </div>

          <Button tone="primary" onClick={onViewCourse}>
            <EyeIcon size={16} />
            View Course
          </Button>
        </div>

        {/* surface */}
        <div
          className={cn(
            "rounded-2xl p-4 md:p-5",
            "bg-gradient-to-b from-slate-50 to-slate-100/60",
            "dark:from-slate-950/40 dark:to-slate-950/10",
            "border border-slate-200/70 dark:border-slate-800",
            "shadow-sm"
          )}
        >
          <form onSubmit={onSave} className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-4">
                <FieldShell>
                  <Label>
                    <span className="inline-flex items-center gap-2">
                      <HashIcon size={14} className="text-slate-400" />
                      Code
                    </span>
                  </Label>
                  <Input value={code} onChange={setCode} placeholder="Course Code" />
                  {errors.code ? <Hint>{errors.code}</Hint> : <Hint>Example: ECA03, MMA1088</Hint>}
                </FieldShell>
              </div>

              <div className="lg:col-span-8">
                <FieldShell>
                  <Label>
                    <span className="inline-flex items-center gap-2">
                      <BookOpenIcon size={14} className="text-slate-400" />
                      Course Name
                    </span>
                  </Label>
                  <Input value={name} onChange={setName} placeholder="Course Name" />
                  {errors.name ? <Hint>{errors.name}</Hint> : <Hint>Displayed to students & faculty.</Hint>}
                </FieldShell>
              </div>

              <div className="lg:col-span-4">
                <FieldShell>
                  <Label>
                    <span className="inline-flex items-center gap-2">
                      <LayersIcon size={14} className="text-slate-400" />
                      Type
                    </span>
                  </Label>
                  <Select value={type} onChange={setType} options={typeOptions} />
                  <Hint>Choose delivery type.</Hint>
                </FieldShell>
              </div>

              <div className="lg:col-span-5">
                <FieldShell>
                  <Label>
                    <span className="inline-flex items-center gap-2">
                      <LayoutGridIcon size={14} className="text-slate-400" />
                      Subject Category
                    </span>
                  </Label>

                  <Select
                    value={subjectCategory}
                    onChange={setSubjectCategory}
                    options={subjectCategoryOptions}
                  />

                  {errors.subjectCategory ? <Hint>{errors.subjectCategory}</Hint> : <Hint>Maps to graduation status.</Hint>}
                </FieldShell>
              </div>

              <div className="lg:col-span-3">
                <FieldShell>
                  <Label>Course Category</Label>
                  <Select value={courseCategory} onChange={setCourseCategory} options={courseCategoryOptions} />
                  {errors.courseCategory ? <Hint>{errors.courseCategory}</Hint> : <Hint>Theory / Lab / Project.</Hint>}
                </FieldShell>
              </div>

              <div className="lg:col-span-4">
                <FieldShell>
                  <Label>Prerequisite Course</Label>
                  <SearchableSelect
                    value={prereq}
                    onChange={setPrereq}
                    options={prerequisiteOptions}
                    placeholder="-- Select Prerequisite --"
                  />
                  <Hint>Optional.</Hint>
                </FieldShell>
              </div>

              <div className="lg:col-span-4">
                <FieldShell>
                  <Label>Slot</Label>
                  <Select value={slot} onChange={setSlot} options={slotOptions} />
                  {errors.slot ? <Hint>{errors.slot}</Hint> : <Hint>Assign timetable slot.</Hint>}
                </FieldShell>
              </div>

              <div className="lg:col-span-4">
                <FieldShell>
                  <Label>Max Slot Count</Label>
                  <Input
                    value={maxSlotCount}
                    onChange={(v) => setMaxSlotCount(v.replace(/[^\d]/g, ""))}
                    placeholder="30"
                    inputMode="numeric"
                  />
                  {errors.maxSlotCount ? <Hint>{errors.maxSlotCount}</Hint> : <Hint>Maximum students allowed in this slot.</Hint>}
                </FieldShell>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <Button type="submit" tone="primary" disabled={!isValid}>
                <SaveIcon size={16} />
                Save
              </Button>
              <Button tone="ghost" onClick={onClear}>
                Clear
              </Button>
            </div>
          </form>
        </div>


      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
