// src/layouts/faculty/DisciplinaryEntry.tsx
import React, { useMemo, useState } from "react";

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

type StudentOpt = { regNo: string; name: string };

export default function DisciplinaryEntry() {
  const students: StudentOpt[] = useMemo(
    () => [
      { regNo: "1922111661", name: "KARMURI SRI RAMCHARAN REDDY" },
      { regNo: "1924210902", name: "SUMADHURA MATAM" },
      { regNo: "1924210300", name: "NAVEEN KUMAR S" },
      { regNo: "1924210120", name: "SRI SAYEE K" },
      { regNo: "1924212181", name: "KAVYA S" },
    ],
    []
  );

  const [regNo, setRegNo] = useState("");
  const [issueDetails, setIssueDetails] = useState("");
  const [complainant, setComplainant] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const suggestions = useMemo(() => {
    const q = regNo.trim();
    if (!q) return [];
    return students
      .filter((s) => s.regNo.includes(q))
      .slice(0, 6);
  }, [regNo, students]);

  const pickFile = (f: File | null) => {
    setMsg(null);
    if (!f) {
      setFile(null);
      return;
    }
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setFile(null);
      setMsg({ type: "err", text: "Only PDF files are allowed." });
      return;
    }
    setFile(f);
  };

  const reset = () => {
    setRegNo("");
    setIssueDetails("");
    setComplainant("");
    setFile(null);
  };

  const submit = async () => {
    setMsg(null);

    const r = regNo.trim();
    const i = issueDetails.trim();
    const c = complainant.trim();

    if (!r) return setMsg({ type: "err", text: "Please enter Student RegNo." });
    if (!i) return setMsg({ type: "err", text: "Please enter Issue Details." });
    if (!c) return setMsg({ type: "err", text: "Please enter Complainant." });
    if (!file) return setMsg({ type: "err", text: "Please upload a PDF file." });

    setSubmitting(true);
    try {
      // demo "end-to-end": build form-data (ready to connect API)
      const fd = new FormData();
      fd.append("reg_no", r);
      fd.append("issue_details", i);
      fd.append("complainant", c);
      fd.append("file", file);

      // TODO: replace with your real API call
      // await fetch("/api/disciplinary", { method: "POST", body: fd });

      await new Promise((res) => setTimeout(res, 500));

      setMsg({ type: "ok", text: "Disciplinary entry submitted successfully." });
      reset();
    } catch {
      setMsg({ type: "err", text: "Failed to submit. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full p-4 md:p-6">
      <PageTitle title="Disciplinary Entry" />

      {/* Centered form like screenshot */}
      <div className="w-full">
        <div className="max-w-[980px] mx-auto">
          <div className="flex justify-center">
            <div className="w-full max-w-[760px]">
              {/* rows */}
              <div className="grid grid-cols-1 gap-4">
                {/* Select Student */}
                <div className="grid grid-cols-[160px_1fr] items-start gap-5">
                  <div className="pt-2 text-[13px] text-rose-600 font-medium text-right">
                    Select Student
                  </div>

                  <div className="relative max-w-[380px]">
                    <input
                      value={regNo}
                      onChange={(e) => {
                        setRegNo(e.target.value);
                        setMsg(null);
                      }}
                      placeholder="Search by RegNo"
                      className={cn(
                        "w-full h-10 px-3 rounded-sm text-[13px]",
                        "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100",
                        "border border-slate-200 dark:border-slate-800",
                        "focus:outline-none focus:ring-2 focus:ring-slate-400/25 dark:focus:ring-slate-500/25"
                      )}
                    />

                    {suggestions.length > 0 && (
                      <div className="absolute z-20 mt-1 w-full rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg overflow-hidden">
                        {suggestions.map((s) => (
                          <button
                            key={s.regNo}
                            type="button"
                            onClick={() => setRegNo(s.regNo)}
                            className={cn(
                              "w-full text-left px-3 py-2 text-[12.5px]",
                              "hover:bg-slate-50 dark:hover:bg-slate-900/60"
                            )}
                          >
                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                              {s.regNo}
                            </span>{" "}
                            <span className="text-slate-500 dark:text-slate-400">
                              — {s.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Issue Details */}
                <div className="grid grid-cols-[160px_1fr] items-start gap-5">
                  <div className="pt-2 text-[13px] text-rose-600 font-medium text-right">
                    Issue Details
                  </div>

                  <textarea
                    value={issueDetails}
                    onChange={(e) => {
                      setIssueDetails(e.target.value);
                      setMsg(null);
                    }}
                    rows={5}
                    className={cn(
                      "w-full max-w-[520px] rounded-sm px-3 py-2 text-[13px]",
                      "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100",
                      "border border-slate-200 dark:border-slate-800",
                      "focus:outline-none focus:ring-2 focus:ring-slate-400/25 dark:focus:ring-slate-500/25"
                    )}
                  />
                </div>

                {/* Complainant */}
                <div className="grid grid-cols-[160px_1fr] items-start gap-5">
                  <div className="pt-2 text-[13px] text-rose-600 font-medium text-right">
                    Complainant
                  </div>

                  <input
                    value={complainant}
                    onChange={(e) => {
                      setComplainant(e.target.value);
                      setMsg(null);
                    }}
                    className={cn(
                      "w-full h-10 max-w-[380px] px-3 rounded-sm text-[13px]",
                      "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100",
                      "border border-slate-200 dark:border-slate-800",
                      "focus:outline-none focus:ring-2 focus:ring-slate-400/25 dark:focus:ring-slate-500/25"
                    )}
                  />
                </div>

                {/* Upload File */}
                <div className="grid grid-cols-[160px_1fr] items-start gap-5">
                  <div className="pt-2 text-[13px] text-slate-700 dark:text-slate-200 font-medium text-right">
                    Upload File
                  </div>

                  <div className="max-w-[520px]">
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                      className={cn(
                        "block w-full text-[13px]",
                        "file:mr-3 file:h-9 file:px-3 file:rounded-sm file:border file:border-slate-300",
                        "file:bg-slate-100 file:text-slate-900 file:text-[12.5px] file:font-medium",
                        "hover:file:bg-slate-200 dark:file:bg-slate-900 dark:file:text-slate-100 dark:file:border-slate-700"
                      )}
                    />

                    <div className="mt-3 text-center text-[12px] text-rose-600">
                      Note: Upload only "pdf" file
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="grid grid-cols-[160px_1fr] items-start gap-5">
                  <div />
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={submit}
                      disabled={submitting}
                      className={cn(
                        "h-9 px-5 rounded-sm text-[12.5px] font-semibold text-white",
                        submitting
                          ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed"
                          : "bg-teal-600 hover:bg-teal-700 active:bg-teal-800",
                        "shadow-sm transition"
                      )}
                    >
                      {submitting ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </div>

                {msg && (
                  <div className="grid grid-cols-[160px_1fr] gap-5">
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

              {/* spacing like screenshot */}
              <div className="h-[260px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
