// src/layouts/common/RaiseIssue.tsx
import React, { useState } from "react";

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function PageTitle({ title }: { title: string }) {
  return (
    <div className="mb-6">
      <div className="text-[32px] font-light text-slate-700 dark:text-slate-100 leading-none">
        {title}
      </div>
    </div>
  );
}

export default function RaiseIssue() {
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const isAllowed = (f: File) => {
    const name = f.name.toLowerCase();
    const type = (f.type || "").toLowerCase();
    const okByType =
      type === "application/pdf" ||
      type === "image/jpeg" ||
      type === "image/jpg" ||
      type === "image/png";
    const okByExt =
      name.endsWith(".pdf") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".png");
    return okByType || okByExt;
  };

  const pickFile = (f: File | null) => {
    setMsg(null);
    if (!f) {
      setFile(null);
      return;
    }
    if (!isAllowed(f)) {
      setFile(null);
      setMsg({ type: "err", text: 'Upload only pdf, jpg, jpeg file.' });
      return;
    }
    setFile(f);
  };

  const reset = () => {
    setContent("");
    setLocation("");
    setFile(null);
  };

  const submit = async () => {
    setMsg(null);

    const c = content.trim();
    const l = location.trim();

    if (!c) return setMsg({ type: "err", text: "Please enter Content." });
    if (!l) return setMsg({ type: "err", text: "Please enter Location." });
    if (!file) return setMsg({ type: "err", text: "Please upload a file." });

    setSubmitting(true);
    try {
      // end-to-end ready formdata (hook to API later)
      const fd = new FormData();
      fd.append("content", c);
      fd.append("location", l);
      fd.append("file", file);

      // TODO: replace with your real API call
      // await fetch("/api/issues", { method: "POST", body: fd });

      await new Promise((res) => setTimeout(res, 500));

      setMsg({ type: "ok", text: "Issue submitted successfully." });
      reset();
    } catch {
      setMsg({ type: "err", text: "Failed to submit. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full p-4 md:p-6">
      <PageTitle title="Raise Issue" />

      <div className="max-w-[1100px] mx-auto">
        <div className="flex justify-center">
          <div className="w-full max-w-[980px]">
            <div className="grid grid-cols-1 gap-5">
              {/* Content */}
              <div className="grid grid-cols-[160px_1fr] gap-6 items-start">
                <div className="pt-2 text-[13px] text-rose-600 font-medium text-right">
                  Content
                </div>
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setMsg(null);
                  }}
                  rows={6}
                  className={cn(
                    "w-full max-w-[820px] rounded-sm px-3 py-2 text-[13px]",
                    "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100",
                    "border border-slate-200 dark:border-slate-800",
                    "focus:outline-none focus:ring-2 focus:ring-slate-400/25 dark:focus:ring-slate-500/25"
                  )}
                />
              </div>

              {/* Upload File */}
              <div className="grid grid-cols-[160px_1fr] gap-6 items-start">
                <div className="pt-2 text-[13px] text-slate-700 dark:text-slate-200 font-medium text-right">
                  Upload File
                </div>

                <div className="max-w-[520px]">
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/jpg,image/png,.pdf,.jpg,.jpeg,.png"
                    onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                    className={cn(
                      "block w-full text-[13px]",
                      "file:mr-3 file:h-9 file:px-3 file:rounded-sm file:border file:border-slate-300",
                      "file:bg-slate-100 file:text-slate-900 file:text-[12.5px] file:font-medium",
                      "hover:file:bg-slate-200 dark:file:bg-slate-900 dark:file:text-slate-100 dark:file:border-slate-700"
                    )}
                  />

                  <div className="mt-3 text-[12px] text-rose-600">
                    Note: Upload only pdf,jpg,jpeg file
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-[160px_1fr] gap-6 items-start">
                <div className="pt-2 text-[13px] text-rose-600 font-medium text-right">
                  Location
                </div>

                <input
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setMsg(null);
                  }}
                  className={cn(
                    "w-full h-10 max-w-[520px] px-3 rounded-sm text-[13px]",
                    "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100",
                    "border border-slate-200 dark:border-slate-800",
                    "focus:outline-none focus:ring-2 focus:ring-slate-400/25 dark:focus:ring-slate-500/25"
                  )}
                />
              </div>

              {/* Submit button centered like screenshot */}
              <div className="grid grid-cols-[160px_1fr] gap-6">
                <div />
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={submit}
                    disabled={submitting}
                    className={cn(
                      "h-9 px-4 rounded-sm text-[12.5px] font-semibold text-white",
                      submitting
                        ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed"
                        : "bg-teal-600 hover:bg-teal-700 active:bg-teal-800",
                      "shadow-sm transition"
                    )}
                  >
                    {submitting ? "Submitting..." : "Submit your Issue"}
                  </button>
                </div>
              </div>

              {msg && (
                <div className="grid grid-cols-[160px_1fr] gap-6">
                  <div />
                  <div
                    className={cn(
                      "max-w-[520px] text-[13px] px-3 py-2 rounded-sm border",
                      msg.type === "ok"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200"
                        : "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200"
                    )}
                  >
                    {msg.text}
                  </div>
                </div>
              )}
            </div>

            {/* keep the page airy like screenshot */}
            <div className="h-[320px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
