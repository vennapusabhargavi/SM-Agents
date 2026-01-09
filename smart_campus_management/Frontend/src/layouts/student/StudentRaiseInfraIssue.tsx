import React, { useEffect, useMemo, useState } from "react";
import { PaperclipIcon, MapPinIcon, CheckCircle2Icon, AlertTriangleIcon } from "lucide-react";

type IssueStatus = "Submitted" | "In Review" | "Resolved";


const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost/smart_campus_api";
const STUDENT_API = `${API_BASE}/api/student`;

type IssueRow = {
  id: string;
  content: string;
  location: string;
  fileName?: string;
  fileType?: string;
  createdAt: string; // display string
  status: IssueStatus;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function nowDisplay(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = d.getHours();
  const min = String(d.getMinutes()).padStart(2, "0");
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = ((hh + 11) % 12) + 1;
  return `${dd}/${mm}/${yyyy} ${h12}:${min}${ampm}`;
}

function StatusPill({ s }: { s: IssueStatus }) {
  const cls =
    s === "Resolved"
      ? "bg-emerald-600 text-white"
      : s === "In Review"
      ? "bg-amber-500 text-white"
      : "bg-teal-600 text-white";

  return (
    <span className={cn("inline-flex rounded-sm px-2.5 py-1 text-[12px] font-semibold", cls)}>
      {s}
    </span>
  );
}

function Toast({
  type,
  msg,
}: {
  type: "ok" | "warn";
  msg: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl px-3 py-2 text-[13px] font-medium ring-1 inline-flex items-center gap-2",
        type === "ok"
          ? "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-900/40"
          : "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/20 dark:text-amber-200 dark:ring-amber-900/40"
      )}
    >
      {type === "ok" ? <CheckCircle2Icon size={16} /> : <AlertTriangleIcon size={16} />}
      {msg}
    </div>
  );
}

const STORAGE_KEY = "student_infra_issues_v1";

export function StudentRaiseInfraIssue() {
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState<{ type: "ok" | "warn"; msg: string } | null>(null);
  function showToast(t: { type: "ok" | "warn"; msg: string }) {
    setToast(t);
    window.setTimeout(() => setToast(null), 2200);
  }

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${STUDENT_API}/infra-issues`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.issues) setIssues(json.issues as IssueRow[]);
        else {
          try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) setIssues(JSON.parse(raw));
          } catch {}
        }
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) setIssues(JSON.parse(raw));
        } catch {}
      });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
    } catch {
      // ignore
    }
  }, [issues]);

  const acceptTypes = useMemo(() => ["application/pdf", "image/jpeg", "image/jpg"], []);
  const acceptExtHint = "pdf,jpg,jpeg";

  function validateFile(f: File) {
    // allow pdf, jpg, jpeg
    const okType = acceptTypes.includes(f.type) || /\.pdf$|\.jpe?g$/i.test(f.name);
    if (!okType) return "Only pdf, jpg, jpeg files are allowed.";
    // keep it reasonable for demo
    const maxMB = 5;
    if (f.size > maxMB * 1024 * 1024) return `File too large (max ${maxMB}MB).`;
    return null;
  }

  async function submit() {
    if (!content.trim()) return showToast({ type: "warn", msg: "Please enter content." });
    if (!location.trim()) return showToast({ type: "warn", msg: "Please enter location." });
    if (file) {
      const err = validateFile(file);
      if (err) return showToast({ type: "warn", msg: err });
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("authToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const form = new FormData();
      form.append("content", content.trim());
      form.append("location", location.trim());
      if (file) form.append("file", file);

      const res = await fetch(`${STUDENT_API}/infra-issues`, {
        method: "POST",
        headers,
        body: form,
      });
      if (!res.ok) throw new Error("Failed");

      const r = await fetch(`${STUDENT_API}/infra-issues`, { headers });
      if (r.ok) {
        const json = await r.json();
        if (json?.issues) setIssues(json.issues as IssueRow[]);
      }

      setContent("");
      setLocation("");
      setFile(null);
      showToast({ type: "ok", msg: "Issue submitted successfully." });
    } catch {
      const row: IssueRow = {
        id: `issue-${Date.now()}`,
        content: content.trim(),
        location: location.trim(),
        fileName: file?.name,
        fileType: file?.type,
        createdAt: nowDisplay(),
        status: "Submitted",
      };
      setIssues((prev) => [row, ...prev]);
      showToast({ type: "ok", msg: "Issue submitted locally." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full p-4 md:p-6">
      {/* Title */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="text-[30px] font-light text-slate-700 dark:text-slate-100">
          Raise Issue
        </div>
        {toast && <Toast type={toast.type} msg={toast.msg} />}
      </div>

      {/* Form surface */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="p-5 md:p-7">
          <div className="max-w-[980px] mx-auto">
            <div className="grid lg:grid-cols-[220px_1fr] gap-x-6 gap-y-4">
              {/* Content */}
              <div className="text-[13px] font-medium text-rose-500 lg:text-right lg:pt-2.5">
                Content
              </div>
              <div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className={cn(
                    "w-full min-h-[160px] rounded-2xl",
                    "border border-slate-300/90 dark:border-slate-700",
                    "bg-white dark:bg-slate-950",
                    "px-3 py-3 text-[13px]",
                    "text-slate-900 dark:text-slate-100",
                    "shadow-inner",
                    "focus:outline-none focus:ring-2 focus:ring-slate-400/30 dark:focus:ring-slate-500/30"
                  )}
                />
              </div>

              {/* Upload */}
              <div className="text-[13px] font-medium text-slate-700 dark:text-slate-200 lg:text-right lg:pt-2.5">
                Upload File
              </div>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label
                    className={cn(
                      "inline-flex items-center gap-2",
                      "rounded-lg px-3 py-2",
                      "border border-slate-300/90 dark:border-slate-700",
                      "bg-white dark:bg-slate-950",
                      "text-[13px] font-semibold text-slate-800 dark:text-slate-100",
                      "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition"
                    )}
                  >
                    <PaperclipIcon size={16} className="opacity-80" />
                    Choose File
                    <input
                      type="file"
                      accept={acceptExtHint}
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        if (!f) return setFile(null);
                        const err = validateFile(f);
                        if (err) {
                          setFile(null);
                          showToast({ type: "warn", msg: err });
                          return;
                        }
                        setFile(f);
                      }}
                    />
                  </label>

                  <div className="text-[13px] text-slate-600 dark:text-slate-300">
                    {file ? (
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {file.name}
                      </span>
                    ) : (
                      "No file chosen"
                    )}
                  </div>
                </div>

                <div className="text-[12px] text-rose-500">
                  Note: Upload only pdf,jpg,jpeg file
                </div>
              </div>

              {/* Location */}
              <div className="text-[13px] font-medium text-rose-500 lg:text-right lg:pt-2.5">
                Location
              </div>
              <div className="relative">
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={cn(
                    "w-full rounded-xl",
                    "border border-slate-300/90 dark:border-slate-700",
                    "bg-white dark:bg-slate-950",
                    "px-3 py-2.5 pl-10 text-[13px]",
                    "text-slate-900 dark:text-slate-100",
                    "shadow-inner",
                    "focus:outline-none focus:ring-2 focus:ring-slate-400/30 dark:focus:ring-slate-500/30"
                  )}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <MapPinIcon size={16} />
                </span>
              </div>

              {/* Submit */}
              <div className="hidden lg:block" />
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting}
                  className={cn(
                    "inline-flex items-center justify-center",
                    "rounded-xl px-5 py-2.5",
                    "text-[13px] font-semibold text-white",
                    "bg-teal-600 hover:bg-teal-700",
                    "shadow-sm hover:shadow-md transition",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50",
                    "disabled:opacity-60 disabled:cursor-not-allowed"
                  )}
                >
                  {submitting ? "Submitting..." : "Submit your Issue"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* My Issues (extra, but makes it feel real) */}
      <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="text-[14px] font-semibold text-slate-900 dark:text-white">
            My Issues
          </div>
          <div className="text-[12px] text-slate-600 dark:text-slate-300 mt-0.5">
            Recent submissions (demo stored in browser).
          </div>
        </div>

        {issues.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13px] text-slate-600 dark:text-slate-300">
            No issues yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {issues.slice(0, 6).map((it) => (
              <div key={it.id} className="px-5 py-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="text-[13px] font-semibold text-slate-900 dark:text-white">
                    {it.location}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-[12px] text-slate-600 dark:text-slate-300">
                      {it.createdAt}
                    </div>
                    <StatusPill s={it.status} />
                  </div>
                </div>

                <div className="mt-2 text-[13px] text-slate-700 dark:text-slate-200">
                  {it.content}
                </div>

                {it.fileName && (
                  <div className="mt-2 text-[12px] text-slate-600 dark:text-slate-300 inline-flex items-center gap-2">
                    <PaperclipIcon size={14} />
                    <span className="font-medium">{it.fileName}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
