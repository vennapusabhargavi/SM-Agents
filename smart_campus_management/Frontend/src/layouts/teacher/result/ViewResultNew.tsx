// src/layouts/teacher/result/ViewResultNew.tsx
import React, { useMemo, useState } from "react";

type Row = {
  sno: number;
  regNo: string;
  studentName: string;
  summativeTotal: number;
  formativeTotal: number;
  theoryConvertedMark: number;
  grandTotal: number;
  grade: string;
  result: "PASS" | "FAIL";
};

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function ResultPill({ v }: { v: Row["result"] }) {
  const isPass = v === "PASS";
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide",
        "border shadow-sm",
        isPass
          ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-200 dark:border-indigo-500/30"
          : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:border-rose-500/30"
      )}
    >
      {v}
    </span>
  );
}

export default function ViewResultNew() {
  const monthYearOptions = useMemo(
    () => [
      "January-2025",
      "February-2025",
      "March-2025",
      "April-2025",
      "May-2025",
      "June-2025",
      "July-2025",
      "August-2025",
      "September-2025",
      "October-2025",
      "November-2025",
      "December-2025",
    ],
    []
  );

  const courseOptions = useMemo(
    () => [
      "ACA27-Food Packaging Technology",
      "CSA0289-C programming for Quantum Computing",
      "CSA0204-C programming for Computing System",
      "MMA1135-Mentor Mentee Meeting",
    ],
    []
  );

  const [monthYear, setMonthYear] = useState("July-2025");
  const [course, setCourse] = useState("ACA27-Food Packaging Technology");
  const [loaded, setLoaded] = useState(true);

  // demo dataset (replace later with API)
  const allDataByKey = useMemo(() => {
    const base: Row[] = [
      {
        sno: 1,
        regNo: "192123012",
        studentName: "M.ABINAYA",
        summativeTotal: 138,
        formativeTotal: 257,
        theoryConvertedMark: 60,
        grandTotal: 395,
        grade: "B",
        result: "PASS",
      },
      {
        sno: 2,
        regNo: "192123024",
        studentName: "CHILAKAPATI ASHER",
        summativeTotal: 135,
        formativeTotal: 262,
        theoryConvertedMark: 61,
        grandTotal: 397,
        grade: "B",
        result: "PASS",
      },
    ];

    return {
      "July-2025|ACA27-Food Packaging Technology": base,
      "July-2025|CSA0289-C programming for Quantum Computing": [
        { ...base[0], sno: 1, regNo: "192425321", studentName: "ANKEPALLI LOKANATH REDDY", grade: "A", grandTotal: 418, result: "PASS" },
        { ...base[1], sno: 2, regNo: "192425201", studentName: "BADHRI HARSHA VARDHAN", grade: "B", grandTotal: 392, result: "PASS" },
      ],
      "June-2025|ACA27-Food Packaging Technology": [],
    } as Record<string, Row[]>;
  }, []);

  const key = `${monthYear}|${course}`;
  const rows = loaded ? allDataByKey[key] ?? [] : [];

  const onView = () => {
    // for now just toggles "loaded"; keep hook point for API
    setLoaded(false);
    window.setTimeout(() => setLoaded(true), 120);
  };

  const onRowView = (r: Row) => {
    // keep it simple (no icons). replace with navigation/modal later.
    alert(`View: ${r.regNo} • ${r.studentName}`);
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
        New View Result
      </h1>

      <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] overflow-hidden">
        {/* top controls */}
        <div className="px-4 sm:px-6 py-4 bg-slate-50/70 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:items-center">
            <div className="lg:col-span-5">
              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-2">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Month &amp; Year
                </div>
                <select
                  value={monthYear}
                  onChange={(e) => setMonthYear(e.target.value)}
                  className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                >
                  {monthYearOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="grid grid-cols-1 sm:grid-cols-[80px_1fr] items-center gap-2">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Course
                </div>
                <select
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                >
                  {courseOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="lg:col-span-2 flex lg:justify-end">
              <button
                type="button"
                onClick={onView}
                className={clsx(
                  "h-10 px-4 rounded-xl text-sm font-semibold transition shadow-sm",
                  "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.99]",
                  "dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                )}
              >
                View Result
              </button>
            </div>
          </div>
        </div>

        {/* table */}
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-white dark:bg-slate-950">
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[80px]">
                  SNo.
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">
                  RegNo
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[260px]">
                  StudentName
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[180px]">
                  Sumative Total
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[190px]">
                  Formative Total
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[280px]">
                  Theory Converted Mark
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[150px]">
                  Grand Total
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[90px]">
                  Grade
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[100px]">
                  Result
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[100px]">
                  ViewId
                </th>
              </tr>
            </thead>

            <tbody>
              {!loaded ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Loading results...
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Please wait.
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-14 text-center">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      No data available in table
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Choose a different Month &amp; Year or Course.
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={`${r.regNo}-${r.sno}`}
                    className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition"
                  >
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-100 tabular-nums">
                      {r.sno}
                    </td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-100 tabular-nums">
                      {r.regNo}
                    </td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-50">
                      {r.studentName}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">
                      {r.summativeTotal}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">
                      {r.formativeTotal}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">
                      {r.theoryConvertedMark}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">
                      {r.grandTotal}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {r.grade}
                    </td>
                    <td className="px-4 py-3">
                      <ResultPill v={r.result} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onRowView(r)}
                        className={clsx(
                          "h-8 px-3 rounded-lg text-xs font-semibold transition shadow-sm",
                          "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.99]"
                        )}
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

        {/* footer spacing (keeps same “empty space” feel) */}
        <div className="px-4 sm:px-6 py-4 bg-white dark:bg-slate-950" />
      </div>
    </div>
  );
}
