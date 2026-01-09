// src/layouts/teacher/assignment/PublishAssignment.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";

type CourseOption = { id: string; label: string };

const courses: CourseOption[] = [
  { id: "", label: "--Select--" },
  { id: "MMA1135", label: "MMA1135 - Mentor Mentee Meeting" },
  { id: "CSA1524", label: "CSA1524 - Cloud Computing & Big Data Analytics" },
  { id: "SPIC411", label: "SPIC411 - Core Project" },
];

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function yyyyMmDd(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function ddMmYyyyFromInput(v: string) {
  // input: YYYY-MM-DD -> DD/MM/YYYY
  if (!v || v.length < 10) return "";
  const [y, m, d] = v.split("-");
  return `${d}/${m}/${y}`;
}

function isAllowedFile(file: File) {
  const name = file.name.toLowerCase();
  return name.endsWith(".pdf") || name.endsWith(".doc") || name.endsWith(".docx");
}

function sanitizeHtmlBasic(html: string) {
  // basic cleanup (demo-friendly). Real app should sanitize server-side too.
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/ on\w+="[^"]*"/g, "");
}

function RichTextEditor({
  valueHtml,
  onChangeHtml,
  placeholder,
}: {
  valueHtml: string;
  onChangeHtml: (html: string) => void;
  placeholder?: string;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceText, setSourceText] = useState(valueHtml);

  // keep editor in sync when external value changes
  useEffect(() => {
    if (sourceMode) {
      setSourceText(valueHtml);
      return;
    }
    const el = editorRef.current;
    if (!el) return;
    const current = el.innerHTML;
    if (current !== valueHtml) el.innerHTML = valueHtml || "";
  }, [valueHtml, sourceMode]);

  const exec = (cmd: string, val?: string) => {
    if (sourceMode) return;
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    // execCommand still works in browsers (good enough for demo UI)
    document.execCommand(cmd, false, val);
    const next = el.innerHTML;
    onChangeHtml(sanitizeHtmlBasic(next));
  };

  const insertLink = () => {
    if (sourceMode) return;
    const url = window.prompt("Enter link URL (https://...)");
    if (!url) return;
    exec("createLink", url);
  };

  const onEditorInput = () => {
    if (sourceMode) return;
    const el = editorRef.current;
    if (!el) return;
    onChangeHtml(sanitizeHtmlBasic(el.innerHTML));
  };

  const toggleSource = () => {
    setSourceMode((p) => {
      const next = !p;
      if (next) {
        setSourceText(valueHtml);
      } else {
        // apply source -> editor
        onChangeHtml(sanitizeHtmlBasic(sourceText));
      }
      return next;
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
      {/* Toolbar (text-only, no heavy icons) */}
      <div className="flex flex-wrap items-center gap-1.5 px-2 py-2 bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => exec("bold")}
          className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Bold"
          aria-label="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => exec("italic")}
          className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Italic"
          aria-label="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => exec("underline")}
          className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Underline"
          aria-label="Underline"
        >
          U
        </button>

        <span className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-800" />

        <button
          type="button"
          onClick={() => exec("insertUnorderedList")}
          className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Bullets"
          aria-label="Bullets"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => exec("insertOrderedList")}
          className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Numbered list"
          aria-label="Numbered list"
        >
          1. List
        </button>

        <span className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-800" />

        <button
          type="button"
          onClick={insertLink}
          className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Insert link"
          aria-label="Insert link"
        >
          Link
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSource}
            className={clsx(
              "h-8 px-3 rounded-lg border text-xs font-semibold transition",
              sourceMode
                ? "border-slate-300 dark:border-slate-700 bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
            title="Toggle HTML Source"
            aria-label="Toggle HTML Source"
          >
            Source
          </button>
        </div>
      </div>

      {/* Editor body */}
      <div className="p-0">
        {sourceMode ? (
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            className="w-full min-h-[320px] p-4 text-sm font-mono bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 outline-none"
            placeholder="<p>Write HTML here...</p>"
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={onEditorInput}
            className="w-full min-h-[320px] p-4 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 outline-none"
            data-placeholder={placeholder || "Type assignment content..."}
            suppressContentEditableWarning
            style={{
              // placeholder for contentEditable
              position: "relative",
            }}
          />
        )}
      </div>

      {/* contentEditable placeholder styling */}
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: rgba(100,116,139,0.9);
        }
        .dark [contenteditable][data-placeholder]:empty:before {
          color: rgba(148,163,184,0.8);
        }
      `}</style>
    </div>
  );
}

export default function PublishAssignment() {
  const [courseId, setCourseId] = useState("");
  const [assignmentName, setAssignmentName] = useState("");

  const today = useMemo(() => new Date(), []);
  const [publishOn, setPublishOn] = useState<string>(() => yyyyMmDd(today));
  const [dueDate, setDueDate] = useState<string>(() => yyyyMmDd(today));

  const [contentHtml, setContentHtml] = useState<string>("");
  const [smsText, setSmsText] = useState<string>("");

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");

  const courseLabel = useMemo(
    () => courses.find((c) => c.id === courseId)?.label ?? "--Select--",
    [courseId]
  );

  const clearAll = () => {
    setCourseId("");
    setAssignmentName("");
    setPublishOn(yyyyMmDd(new Date()));
    setDueDate(yyyyMmDd(new Date()));
    setContentHtml("");
    setSmsText("");
    setFile(null);
    setError("");
  };

  const onPickFile = (f: File | null) => {
    setError("");
    if (!f) {
      setFile(null);
      return;
    }
    if (!isAllowedFile(f)) {
      setFile(null);
      setError("Upload only PDF or DOC/DOCX file.");
      return;
    }
    setFile(f);
  };

  const publishAssignment = async () => {
    setError("");

    if (!courseId) return setError("Please select a course.");
    if (!assignmentName.trim()) return setError("Please enter assignment name.");
    if (!publishOn) return setError("Please select publish date.");
    if (!dueDate) return setError("Please select due date.");
    if (new Date(dueDate).getTime() < new Date(publishOn).getTime()) {
      return setError("Due date cannot be earlier than publish date.");
    }

    // demo payload
    const payload = {
      courseId,
      courseLabel,
      assignmentName: assignmentName.trim(),
      publishOn,
      dueDate,
      publishOnLabel: ddMmYyyyFromInput(publishOn),
      dueDateLabel: ddMmYyyyFromInput(dueDate),
      contentHtml,
      smsText,
      fileName: file?.name ?? null,
    };

    // Submit to API
    try {
      const response = await fetch("/api/assignments/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Failed to publish assignment");
      }
      alert("Assignment published successfully.");
      clearAll();
    } catch (error) {
      console.error("Error publishing assignment:", error);
      alert("Failed to publish assignment. Please try again.");
    }
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
        Publish Assignment
      </h1>

      {/* Form shell */}
      <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)]">
        <div className="p-4 sm:p-6">
          {/* Row grid like screenshot (labels left, fields right) */}
          <div className="space-y-4">
            {/* Course */}
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-2 lg:gap-6 items-center">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                <span className="text-rose-600 dark:text-rose-400">*</span> Course
              </div>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/35"
              >
                {courses.map((c) => (
                  <option key={c.label + c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignment Name */}
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-2 lg:gap-6 items-center">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                <span className="text-rose-600 dark:text-rose-400">*</span> Assignment Name
              </div>
              <input
                value={assignmentName}
                onChange={(e) => setAssignmentName(e.target.value)}
                placeholder=""
                className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/35"
              />
            </div>

            {/* Dates row */}
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-2 lg:gap-6">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 pt-2">
                <span className="text-rose-600 dark:text-rose-400">*</span> Publish On
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={publishOn}
                    onChange={(e) => setPublishOn(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/35"
                  />
                </div>

                <div className="grid grid-cols-[110px_1fr] items-center gap-3">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 text-right sm:text-left">
                    <span className="text-rose-600 dark:text-rose-400">*</span> Due Date
                  </div>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/35"
                  />
                </div>
              </div>
            </div>

            {/* Content editor */}
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-2 lg:gap-6">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 pt-2">
                Content
              </div>
              <RichTextEditor
                valueHtml={contentHtml}
                onChangeHtml={setContentHtml}
                placeholder="Type assignment content here..."
              />
            </div>

            {/* SMS Text */}
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-2 lg:gap-6 items-start">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 pt-2">
                SMS Text
              </div>
              <textarea
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                className="w-full min-h-[90px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/35"
              />
            </div>

            {/* File upload */}
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-2 lg:gap-6 items-center">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                File Upload
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-slate-600 dark:text-slate-300
                             file:mr-3 file:h-10 file:px-4 file:rounded-xl file:border file:border-slate-200 dark:file:border-slate-700
                             file:bg-white dark:file:bg-slate-900 file:text-slate-800 dark:file:text-slate-100
                             hover:file:bg-slate-50 dark:hover:file:bg-slate-800 transition"
                />

                <div className="text-xs text-rose-600 dark:text-rose-400 sm:ml-auto">
                  Note: Upload only pdf or doc file
                </div>
              </div>

              {file && (
                <div className="lg:col-start-2 text-xs text-slate-600 dark:text-slate-300">
                  Selected: <span className="font-semibold">{file.name}</span>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-200">
                {error}
              </div>
            )}

            {/* Actions (centered like screenshot) */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={publishAssignment}
                className="h-10 px-5 rounded-xl bg-gradient-to-r from-sky-700 via-blue-600 to-indigo-700 text-white text-sm font-semibold shadow-sm hover:opacity-95 active:scale-[0.99] transition"
              >
                Publish Assignment
              </button>

              <button
                type="button"
                onClick={clearAll}
                className="h-10 px-5 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-200 text-sm font-semibold hover:bg-amber-100 dark:hover:bg-amber-500/15 transition"
              >
                Clear All
              </button>
            </div>

            {/* Small footer hint */}
            <div className="text-center text-xs text-slate-500 dark:text-slate-400">
              Tip: Keep SMS text short. Attachments should be PDF/DOC only.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
