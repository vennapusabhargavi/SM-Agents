// src/layouts/common/ViewResult.tsx
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

type ResultRow = {
  sno: number;
  regNo: string;
  studentName: string;
  theory100: number;
  viva100: number;
  ia100: number;
  grade: string;
  result: "PASS" | "FAIL";
  monthYear: string; // e.g. "December-2018"
  courseId: string;
};

type CourseOpt = { id: string; label: string };

function ResultPill({ v }: { v: "PASS" | "FAIL" }) {
  const cls =
    v === "PASS"
      ? "bg-teal-500 text-white"
      : "bg-rose-500 text-white";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold", cls)}>
      {v}
    </span>
  );
}

export default function ViewResult() {
  const months = useMemo(
    () => [
      "December-2018",
      "January-2019",
      "May-2019",
      "December-2025",
    ],
    []
  );

  const courses: CourseOpt[] = useMemo(
    () => [
      { id: "c1", label: "AE01601-Strength of Materials - Introduction" },
      { id: "c2", label: "MMA1254-Mentor Mentee Meeting" },
      { id: "c3", label: "CSA0204-C programming for Computing System" },
    ],
    []
  );

  const allRows: ResultRow[] = useMemo(
    () => [
      {
        sno: 1,
        regNo: "191716001",
        studentName: "K NIKHIL CHAKRAVARTHI",
        theory100: 0,
        viva100: 0,
        ia100: 60,
        grade: "RA",
        result: "FAIL",
        monthYear: "December-2018",
        courseId: "c1",
      },
      {
        sno: 2,
        regNo: "191716002",
        studentName: "MANDU YAGNESh",
        theory100: 50,
        viva100: 85,
        ia100: 58,
        grade: "D",
        result: "PASS",
        monthYear: "December-2018",
        courseId: "c1",
      },
      {
        sno: 3,
        regNo: "191716003",
        studentName: "HARI PRASAD.G",
        theory100: 50,
        viva100: 82,
        ia100: 52,
        grade: "E",
        result: "PASS",
        monthYear: "December-2018",
        courseId: "c1",
      },
      {
        sno: 4,
        regNo: "191716004",
        studentName: "HARISH KUMAR J",
        theory100: 59,
        viva100: 90,
        ia100: 50,
        grade: "D",
        result: "PASS",
        monthYear: "December-2018",
        courseId: "c1",
      },
      {
        sno: 5,
        regNo: "191716005",
        studentName: "YESU DAMODAR",
        theory100: 76,
        viva100: 93,
        ia100: 69,
        grade: "C",
        result: "PASS",
        monthYear: "December-2018",
        courseId: "c1",
      },
      {
        sno: 6,
        regNo: "191716006",
        studentName: "KARTHI KEYAN M",
        theory100: 13,
        viva100: 80,
        ia100: 46,
        grade: "RA",
        result: "FAIL",
        monthYear: "December-2018",
        courseId: "c1",
      },
      {
        sno: 7,
        regNo: "191716007",
        studentName: "DEEPAKKALYAN R",
        theory100: 79,
        viva100: 88,
        ia100: 62,
        grade: "C",
        result: "PASS",
        monthYear: "December-2018",
        courseId: "c1",
      },
      {
        sno: 8,
        regNo: "191716008",
        studentName: "DHANAPRAKASH.G",
        theory100: 20,
        viva100: 67,
        ia100: 49,
        grade: "RA",
        result: "FAIL",
        monthYear: "December-2018",
        courseId: "c1",
      },
      {
        sno: 9,
        regNo: "191716011",
        studentName: "P.KALIAPPA RANGARAJAN",
        theory100: 2,
        viva100: 50,
        ia100: 22,
        grade: "RA",
        result: "FAIL",
        monthYear: "December-2018",
        courseId: "c1",
      },
      {
        sno: 10,
        regNo: "191716014L",
        studentName: "ASHWIN G PRAKASH",
        theory100: 9,
        viva100: 83,
        ia100: 45,
        grade: "RA",
        result: "FAIL",
        monthYear: "December-2018",
        courseId: "c1",
      },
      {
        sno: 11,
        regNo: "191716015L",
        studentName: "SIVA SAI SUNDAR SINGH",
        theory100: 51,
        viva100: 93,
        ia100: 64,
        grade: "D",
        result: "PASS",
        monthYear: "December-2018",
        courseId: "c1",
      },
      {
        sno: 12,
        regNo: "191716016L",
        studentName: "HARIKRISHNA R",
        theory100: 51,
        viva100: 70,
        ia100: 49,
        grade: "E",
        result: "PASS",
        monthYear: "December-2018",
        courseId: "c1",
      },
      {
        sno: 13,
        regNo: "191716017L",
        studentName: "BHANUPRAKASH K",
        theory100: 14,
        viva100: 85,
        ia100: 47,
        grade: "RA",
        result: "FAIL",
        monthYear: "December-2018",
        courseId: "c1",
      },
      {
        sno: 14,
        regNo: "191716018L",
        studentName: "K VELMARAN",
        theory100: 50,
        viva100: 85,
        ia100: 54,
        grade: "D",
        result: "PASS",
        monthYear: "December-2018",
        courseId: "c1",
      },
      {
        sno: 15,
        regNo: "191716019L",
        studentName: "VAMSIKRISHNA KT",
        theory100: 33,
        viva100: 81,
        ia100: 60,
        grade: "RA",
        result: "FAIL",
        monthYear: "December-2018",
        courseId: "c1",
      },
    ],
    []
  );

  const [activeTab, setActiveTab] = useState<"view">("view");
  const [monthYear, setMonthYear] = useState(months[0]);
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [hasViewed, setHasViewed] = useState(true);

  const rows = useMemo(() => {
    if (!hasViewed) return [];
    return allRows.filter((r) => r.monthYear === monthYear && r.courseId === courseId);
  }, [allRows, monthYear, courseId, hasViewed]);

  return (
    <div className="w-full p-4 md:p-6">
      <PageTitle title="View Result" />

      {/* top-left tab + divider (no card/bg) */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("view")}
          className={cn(
            "px-4 py-2 text-[13px] border",
            activeTab === "view"
              ? "bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              : "bg-transparent border-transparent text-slate-600 dark:text-slate-300"
          )}
        >
          ⊕ View Result
        </button>
      </div>
      <div className="mt-2 border-b border-slate-200 dark:border-slate-800" />

      <div className="mt-3 text-[13px] text-slate-700 dark:text-slate-200">
        <span className="font-medium">To View Result</span>{" "}
        <span className="text-slate-500 dark:text-slate-400">To view the result</span>
      </div>

      {/* Filters row (centered like screenshot) */}
      <div className="mt-6 flex justify-center">
        <div className="w-full max-w-[1180px]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-3 lg:gap-6">
            <div className="flex items-center gap-3">
              <div className="w-[120px] text-right text-[13px] text-rose-600 font-medium">
                Month &amp; Year
              </div>
              <select
                value={monthYear}
                onChange={(e) => setMonthYear(e.target.value)}
                className={cn(
                  "h-9 w-[240px] px-2 text-[13px] rounded-sm",
                  "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100",
                  "border border-slate-200 dark:border-slate-800",
                  "focus:outline-none focus:ring-2 focus:ring-slate-400/25 dark:focus:ring-slate-500/25"
                )}
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-[120px] text-right text-[13px] text-rose-600 font-medium">
                Course
              </div>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className={cn(
                  "h-9 w-[520px] max-w-full px-2 text-[13px] rounded-sm",
                  "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100",
                  "border border-slate-200 dark:border-slate-800",
                  "focus:outline-none focus:ring-2 focus:ring-slate-400/25 dark:focus:ring-slate-500/25"
                )}
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setHasViewed(true)}
              className={cn(
                "h-9 px-4 rounded-sm text-[12.5px] font-semibold text-white",
                "bg-teal-600 hover:bg-teal-700 active:bg-teal-800 transition shadow-sm"
              )}
            >
              View Result
            </button>
          </div>

          {/* Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-[1100px] w-full border-collapse">
              <thead>
                <tr>
                  {[
                    "SNo.",
                    "Reg No.",
                    "StudentName",
                    "Theory / 100",
                    "Viva / 100",
                    "IA / 100",
                    "Grade",
                    "Result",
                  ].map((h) => (
                    <th
                      key={h}
                      className={cn(
                        "text-left text-[13px] font-semibold",
                        "border border-slate-200 dark:border-slate-800",
                        "px-3 py-2 bg-white dark:bg-slate-950",
                        "text-slate-800 dark:text-slate-100"
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.map((r, idx) => (
                  <tr
                    key={`${r.regNo}-${r.sno}`}
                    className={cn(
                      idx % 2 === 0
                        ? "bg-white dark:bg-slate-950"
                        : "bg-slate-50/70 dark:bg-slate-900/30"
                    )}
                  >
                    <td className="border border-slate-200 dark:border-slate-800 px-3 py-2 text-[13px]">
                      {r.sno}
                    </td>
                    <td className="border border-slate-200 dark:border-slate-800 px-3 py-2 text-[13px] tabular-nums">
                      {r.regNo}
                    </td>
                    <td className="border border-slate-200 dark:border-slate-800 px-3 py-2 text-[13px]">
                      {r.studentName}
                    </td>
                    <td className="border border-slate-200 dark:border-slate-800 px-3 py-2 text-[13px] tabular-nums">
                      {r.theory100}
                    </td>
                    <td className="border border-slate-200 dark:border-slate-800 px-3 py-2 text-[13px] tabular-nums">
                      {r.viva100}
                    </td>
                    <td className="border border-slate-200 dark:border-slate-800 px-3 py-2 text-[13px] tabular-nums">
                      {r.ia100}
                    </td>
                    <td className="border border-slate-200 dark:border-slate-800 px-3 py-2 text-[13px]">
                      {r.grade}
                    </td>
                    <td className="border border-slate-200 dark:border-slate-800 px-3 py-2 text-[13px]">
                      <ResultPill v={r.result} />
                    </td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="border border-slate-200 dark:border-slate-800 px-3 py-10 text-center text-[13px] text-slate-500 dark:text-slate-400"
                    >
                      No data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* keep airy spacing like screenshot */}
          <div className="h-[220px]" />
        </div>
      </div>
    </div>
  );
}
