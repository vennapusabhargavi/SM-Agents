// src/layouts/faculty/UploadContent.tsx
import React, { useMemo, useRef, useState } from "react";
import { ChevronDownIcon, UploadCloudIcon, FileTextIcon, XIcon } from "lucide-react";

type CourseOpt = { id: string; label: string };

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

function toastMsg(setToast: React.Dispatch<React.SetStateAction<string>>, msg: string) {
  setToast(msg);
  window.setTimeout(() => setToast(""), 2200);
}

export default function UploadContent() {
  // demo courses; wire to API later
  const courses: CourseOpt[] = useMemo(
    () => [
      { id: "", label: "--Select--" },
      { id: "MMA1254", label: "MMA1254 - Mentor Mentee Meeting" },
      { id: "CSA1524", label: "CSA1524 - Cloud Computing & Big Data" },
      { id: "SPIC411", label: "SPIC411 - Core Project" },
    ],
    []
  );

  const [courseId, setCourseId] = useState("");
  const [contentName, setContentName] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const fileRef = useRef<HTMLInputElement | null>(null);

  const acceptExt = ".pdf,.doc,.docx";
  const noteText = "Note: Upload only pdf or doc file";

  const fileLabel = file ? file.name : "No file chosen";

  const validate = () => {
    if (!courseId) return "Please select course.";
    if (!contentName.trim()) return "Please enter content name.";
    if (!file) return "Please choose a file.";
    const name = file.name.toLowerCase();
    const ok = name.endsWith(".pdf") || name.endsWith(".doc") || name.endsWith(".docx");
    if (!ok) return "Only PDF/DOC/DOCX files are allowed.";
    return "";
  };

  const onChooseFile = (f: File | null) => {
    if (!f) {
      setFile(null);
      return;
    }
    const name = f.name.toLowerCase();
    const ok = name.endsWith(".pdf") || name.endsWith(".doc") || name.endsWith(".docx");
    if (!ok) {
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      toastMsg(setToast, "Only PDF/DOC/DOCX files are allowed.");
      return;
    }
    setFile(f);
  };

  const onSave = async () => {
    const err = validate();
    if (err) return toastMsg(setToast, err);

    // ✅ end-to-end UI flow (demo): replace with API call
    // Example API:
    // const fd = new FormData();
    // fd.append("course_id", courseId);
    // fd.append("content_name", contentName.trim());
    // fd.append("file", file!);
    // await fetch("/api/content/upload", { method: "POST", body: fd });

    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 650));
      toastMsg(setToast, "Content saved successfully.");
      // keep values (original systems keep values), or clear after save if you want:
      // onClear();
    } finally {
      setSaving(false);
    }
  };

  const onClear = () => {
    setCourseId("");
    setContentName("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    toastMsg(setToast, "Cleared.");
  };

  return (
    <div className="w-full p-4 md:p-6">
      <PageTitle title="Content Upload" />

      {/* Plain page (no card), aligned like screenshot */}
      <div className="w-full">
        <div className="max-w-[1120px]">
          <div className="grid grid-cols-1 gap-6">
            {/* row: Course */}
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] items-center gap-3">
              <div className="text-[13px] text-rose-600 font-medium md:text-right">Course</div>

              <div className="relative w-full max-w-[760px]">
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className={cn(
                    "w-full h-10 rounded-sm px-3 pr-10 text-[13px]",
                    "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100",
                    "border border-slate-200 dark:border-slate-800",
                    "focus:outline-none focus:ring-2 focus:ring-slate-400/25 dark:focus:ring-slate-500/25",
                    "shadow-inner"
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
            </div>

            {/* row: Content Name */}
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] items-center gap-3">
              <div className="text-[13px] text-rose-600 font-medium md:text-right">
                Content Name
              </div>

              <input
                value={contentName}
                onChange={(e) => setContentName(e.target.value)}
                className={cn(
                  "w-full max-w-[760px] h-10 rounded-sm px-3 text-[13px]",
                  "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100",
                  "border border-slate-200 dark:border-slate-800",
                  "focus:outline-none focus:ring-2 focus:ring-slate-400/25 dark:focus:ring-slate-500/25",
                  "shadow-inner"
                )}
              />
            </div>

            {/* row: File Upload + note on right */}
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] items-center gap-3">
              <div className="text-[13px] text-rose-600 font-medium md:text-right">File Upload</div>

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                {/* file picker (classic style meaning: Choose File + label) */}
                <div className="flex items-center gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept={acceptExt}
                    onChange={(e) => onChooseFile(e.target.files?.[0] ?? null)}
                    className={cn(
                      "block text-[13px] text-slate-700 dark:text-slate-200",
                      "file:mr-2 file:rounded-sm file:border file:border-slate-300/80 dark:file:border-slate-700",
                      "file:bg-white dark:file:bg-slate-900 file:px-3 file:py-1.5 file:text-[12.5px] file:font-medium",
                      "file:hover:bg-slate-50 dark:file:hover:bg-slate-800/60 file:transition",
                      "cursor-pointer"
                    )}
                  />
                  <div className="text-[13px] text-slate-600 dark:text-slate-300 truncate max-w-[360px]">
                    {fileLabel}
                  </div>

                  {file && (
                    <button
                      type="button"
                      onClick={() => onChooseFile(null)}
                      className="h-8 w-8 grid place-items-center rounded-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
                      aria-label="Remove file"
                      title="Remove"
                    >
                      <XIcon size={16} className="text-slate-500" />
                    </button>
                  )}
                </div>

                <div className="text-[13px] text-rose-600 lg:text-right">{noteText}</div>
              </div>
            </div>

            {/* buttons row */}
            <div className="grid grid-cols-1_toggle md:grid-cols-[180px_1fr] items-center gap-3">
              <div />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving}
                  className={cn(
                    "h-9 px-4 rounded-sm text-[12.5px] font-semibold text-white",
                    "bg-teal-600 hover:bg-teal-700 active:bg-teal-800",
                    "shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed",
                    "inline-flex items-center gap-2"
                  )}
                >
                  <UploadCloudIcon size={16} />
                  {saving ? "Saving..." : "Save Content"}
                </button>

                <button
                  type="button"
                  onClick={onClear}
                  disabled={saving}
                  className={cn(
                    "h-9 px-4 rounded-sm text-[12.5px] font-semibold text-slate-900",
                    "bg-amber-400 hover:bg-amber-500 active:bg-amber-600",
                    "shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                  )}
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* tiny toast */}
        {toast && (
          <div className="fixed bottom-5 right-5 z-[60]">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl px-4 py-3 flex items-center gap-2">
              <FileTextIcon size={16} className="text-slate-500" />
              <div className="text-[13px] text-slate-800 dark:text-slate-100">{toast}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
