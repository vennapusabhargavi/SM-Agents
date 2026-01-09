// src/layouts/teacher/Offers.tsx
import React, { useMemo, useState } from "react";

type OfferRow = {
  id: string;
  regNo: string;
  studentName: string;
  companyName: string;
  salary: string;
  offerDate: string; // dd/mm/yyyy
  fileName?: string;
};

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function todayDDMMYYYY() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function toInputDate(ddmmyyyy: string) {
  // dd/mm/yyyy -> yyyy-mm-dd (for <input type="date">)
  const [dd, mm, yyyy] = ddmmyyyy.split("/");
  if (!dd || !mm || !yyyy) return "";
  return `${yyyy}-${mm}-${dd}`;
}

function fromInputDate(yyyymmdd: string) {
  // yyyy-mm-dd -> dd/mm/yyyy
  if (!yyyymmdd) return "";
  const [yyyy, mm, dd] = yyyymmdd.split("-");
  if (!dd || !mm || !yyyy) return "";
  return `${dd}/${mm}/${yyyy}`;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
      {children}
    </div>
  );
}

function HelpText({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
      {children}
    </div>
  );
}

export default function Offers() {
  const [tab, setTab] = useState<"add" | "view">("add");

  // --------- Add Offer state ----------
  const [regNo, setRegNo] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [salary, setSalary] = useState("");
  const [offerDate, setOfferDate] = useState(todayDDMMYYYY());
  const [file, setFile] = useState<File | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  // demo “student search”
  const demoStudents = useMemo(
    () => [
      { regNo: "192123012", name: "M.ABINAYA" },
      { regNo: "192123024", name: "CHILAKAPATI ASHER" },
      { regNo: "192425321", name: "ANKEPALLI LOKANATH REDDY" },
    ],
    []
  );

  const inferredStudentName = useMemo(() => {
    const hit = demoStudents.find((s) => s.regNo.trim() === regNo.trim());
    return hit?.name ?? "";
  }, [demoStudents, regNo]);

  const [rows, setRows] = useState<OfferRow[]>(() => [
    {
      id: "o1",
      regNo: "192123012",
      studentName: "M.ABINAYA",
      companyName: "Acme Technologies Pvt Ltd",
      salary: "6.5 LPA",
      offerDate: "12/12/2025",
      fileName: "OfferLetter_Acme.pdf",
    },
    {
      id: "o2",
      regNo: "192123024",
      studentName: "CHILAKAPATI ASHER",
      companyName: "Northwind Labs",
      salary: "7.2 LPA",
      offerDate: "18/12/2025",
      fileName: "OfferLetter_Northwind.pdf",
    },
  ]);

  const clearForm = () => {
    setRegNo("");
    setCompanyName("");
    setSalary("");
    setOfferDate(todayDDMMYYYY());
    setFile(null);
  };

  const onSave = () => {
    const r = regNo.trim();
    const c = companyName.trim();
    const s = salary.trim();
    const d = offerDate.trim();

    if (!r) return showToast("Please enter/select student registration number.");
    if (!c) return showToast("Please enter company name.");
    if (!s) return showToast("Please enter salary.");
    if (!d) return showToast("Please select offer date.");
    if (file && file.type !== "application/pdf") {
      return showToast("Please upload PDF only.");
    }

    const studentName = inferredStudentName || "—";
    const newRow: OfferRow = {
      id: `o${Date.now()}`,
      regNo: r,
      studentName,
      companyName: c,
      salary: s,
      offerDate: d,
      fileName: file?.name,
    };

    setRows((prev) => [newRow, ...prev]);
    showToast("Offer saved successfully.");
    clearForm();
    setTab("view");
  };

  // --------- View tab state ----------
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => {
      const blob = `${r.regNo} ${r.studentName} ${r.companyName} ${r.salary} ${r.offerDate}`.toLowerCase();
      return blob.includes(s);
    });
  }, [q, rows]);

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Offer
        </h1>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 shadow-sm">
            Faculty
          </span>
        </div>
      </div>

      {/* Card shell */}
      <div className="mt-4 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] overflow-hidden">
        {/* Tabs */}
        <div className="px-4 sm:px-6 pt-4">
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setTab("add")}
              className={clsx(
                "h-10 px-4 text-sm font-semibold transition",
                tab === "add"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              Add Offer Details
            </button>
            <button
              type="button"
              onClick={() => setTab("view")}
              className={clsx(
                "h-10 px-4 text-sm font-semibold transition border-l border-slate-200 dark:border-slate-800",
                tab === "view"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              View Offer Details
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-6 py-5">
          {tab === "add" ? (
            <div className="max-w-4xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Select student */}
                <div className="lg:col-span-12">
                  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
                    <FieldLabel>Select Student</FieldLabel>
                    <div className="flex flex-col gap-2">
                      <input
                        value={regNo}
                        onChange={(e) => setRegNo(e.target.value)}
                        placeholder="Search by RegNo"
                        className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                      />
                      <div className="flex flex-wrap gap-2">
                        {demoStudents.map((s) => (
                          <button
                            key={s.regNo}
                            type="button"
                            onClick={() => setRegNo(s.regNo)}
                            className={clsx(
                              "text-xs px-2.5 py-1 rounded-full border shadow-sm transition",
                              regNo.trim() === s.regNo
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-200 dark:border-indigo-500/30"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800 dark:hover:bg-slate-800"
                            )}
                            title={s.name}
                          >
                            {s.regNo}
                          </button>
                        ))}
                      </div>

                      <HelpText>
                        {inferredStudentName
                          ? `Student: ${inferredStudentName}`
                          : "Tip: click a RegNo chip to auto-fill."}
                      </HelpText>
                    </div>
                  </div>
                </div>

                {/* Company name */}
                <div className="lg:col-span-12">
                  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-start gap-2">
                    <FieldLabel>Company Name</FieldLabel>
                    <textarea
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      rows={2}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 resize-y"
                      placeholder="Enter company name"
                    />
                  </div>
                </div>

                {/* Salary */}
                <div className="lg:col-span-12">
                  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
                    <FieldLabel>Salary</FieldLabel>
                    <input
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                      placeholder="e.g., 6.5 LPA / 50,000 per month"
                    />
                  </div>
                </div>

                {/* Offer date */}
                <div className="lg:col-span-12">
                  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
                    <FieldLabel>Offer Date</FieldLabel>
                    <div className="flex items-center gap-3">
                      <input
                        type="date"
                        value={toInputDate(offerDate)}
                        onChange={(e) => setOfferDate(fromInputDate(e.target.value))}
                        className="h-10 w-[220px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {offerDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* File upload */}
                <div className="lg:col-span-12">
                  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-start gap-2">
                    <FieldLabel>File Upload</FieldLabel>
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        className="block w-full text-sm
                          file:mr-3 file:h-10 file:px-4 file:rounded-xl
                          file:border file:border-slate-200 file:bg-white file:text-slate-800
                          hover:file:bg-slate-50
                          dark:file:border-slate-800 dark:file:bg-slate-900 dark:file:text-slate-100 dark:hover:file:bg-slate-800
                          text-slate-700 dark:text-slate-200"
                      />
                      <HelpText>
                        Note: Upload only <span className="font-semibold">PDF</span>{" "}
                        file.
                      </HelpText>
                      {file && (
                        <div className="text-xs text-slate-600 dark:text-slate-300">
                          Selected: <span className="font-semibold">{file.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="lg:col-span-12 pt-2">
                  <div className="sm:pl-[180px] flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={onSave}
                      className={clsx(
                        "h-10 px-4 rounded-xl text-sm font-semibold transition shadow-sm",
                        "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.99]"
                      )}
                    >
                      Save Offer
                    </button>
                    <button
                      type="button"
                      onClick={clearForm}
                      className={clsx(
                        "h-10 px-4 rounded-xl text-sm font-semibold transition shadow-sm",
                        "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 active:scale-[0.99]",
                        "dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // --------- VIEW TAB ----------
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Offer Details
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Search, review, and open offer records.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    Search:
                  </div>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="RegNo / student / company..."
                    className="h-10 w-full sm:w-[280px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                  />
                </div>
              </div>

              <div className="mt-4 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/40">
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">
                        RegNo
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[220px]">
                        Student
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[260px]">
                        Company
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">
                        Salary
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">
                        Offer Date
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[220px]">
                        File
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[110px]">
                        View
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center">
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            No data available in table
                          </div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Try a different search keyword.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition"
                        >
                          <td className="px-4 py-3 text-slate-900 dark:text-slate-50 tabular-nums">
                            {r.regNo}
                          </td>
                          <td className="px-4 py-3 text-slate-800 dark:text-slate-100">
                            {r.studentName}
                          </td>
                          <td className="px-4 py-3 text-slate-800 dark:text-slate-100">
                            {r.companyName}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                            {r.salary}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">
                            {r.offerDate}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                            {r.fileName ? (
                              <span className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                {r.fileName}
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() =>
                                alert(
                                  `View Offer\n\n${r.regNo} • ${r.studentName}\n${r.companyName}\n${r.salary} • ${r.offerDate}`
                                )
                              }
                              className="h-8 px-3 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition shadow-sm active:scale-[0.99]"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Showing <span className="font-semibold">{filtered.length}</span>{" "}
                record(s).
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Minimal toast (no heavy icons) */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[90]">
          <div className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
