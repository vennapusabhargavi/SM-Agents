// src/layouts/teacher/exam/ResultAnalysis.tsx
import React, { useMemo, useState } from "react";

type ResultRow = {
  sno: number;
  code: string;
  name: string;
  totalCount: number;
  passCount: number;
  theoryAvg: number;
  theoryStd: number;
  grandAvg: number;
  grandStd: number;
  facultyName: string;
  passPct: number; // 0-100
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-3 py-3 text-left text-[12.5px] font-semibold text-slate-700 dark:text-slate-200",
        "bg-white dark:bg-slate-950",
        "border-b border-slate-200 dark:border-slate-800",
        "sticky top-0 z-10",
        className
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
  align = "left",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  const a =
    align === "right"
      ? "text-right"
      : align === "center"
      ? "text-center"
      : "text-left";
  return (
    <td
      className={cn(
        "px-3 py-3 text-[13px] text-slate-800 dark:text-slate-100",
        "border-b border-slate-200/80 dark:border-slate-800/70",
        a,
        className
      )}
    >
      {children}
    </td>
  );
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
      <div className="overflow-auto">{children}</div>
    </div>
  );
}

const months = [
  { key: "June-2025", label: "June-2025" },
  { key: "May-2025", label: "May-2025" },
  { key: "April-2025", label: "April-2025" },
];

export default function ResultAnalysis() {
  const dataByMonth: Record<string, ResultRow[]> = useMemo(
    () => ({
      "June-2025": [
        {
          sno: 1,
          code: "UBA29",
          name: "Technical English",
          totalCount: 40,
          passCount: 40,
          theoryAvg: 158,
          theoryStd: 6.1,
          grandAvg: 418,
          grandStd: 13.1,
          facultyName: "VijayalakshmiP",
          passPct: 100,
        },
        {
          sno: 2,
          code: "UBA12",
          name: "Applied Probability",
          totalCount: 31,
          passCount: 30,
          theoryAvg: 133,
          theoryStd: 12.3,
          grandAvg: 382,
          grandStd: 25.9,
          facultyName: "Dr BalapriyaR",
          passPct: 96.8,
        },
        {
          sno: 3,
          code: "CSA08",
          name: "Python Programming",
          totalCount: 31,
          passCount: 22,
          theoryAvg: 110,
          theoryStd: 53.7,
          grandAvg: 322,
          grandStd: 68.6,
          facultyName: "Dr. S. Sivanantham",
          passPct: 71,
        },
        {
          sno: 4,
          code: "ECA14",
          name: "Embedded Systems",
          totalCount: 17,
          passCount: 14,
          theoryAvg: 128,
          theoryStd: 34.9,
          grandAvg: 382,
          grandStd: 41.1,
          facultyName: "RAJMOHANV",
          passPct: 82.4,
        },
        {
          sno: 5,
          code: "CSA02",
          name: "C Programming",
          totalCount: 31,
          passCount: 30,
          theoryAvg: 127,
          theoryStd: 28.6,
          grandAvg: 342,
          grandStd: 55.6,
          facultyName: "Dr. Moorthy A",
          passPct: 96.8,
        },
        {
          sno: 6,
          code: "DSA01",
          name: "Object Oriented Programming with C++",
          totalCount: 38,
          passCount: 37,
          theoryAvg: 136,
          theoryStd: 25.9,
          grandAvg: 365,
          grandStd: 33,
          facultyName: "Dr. Vinoth DDakshnamoorthy",
          passPct: 97.4,
        },
        {
          sno: 7,
          code: "CSA02",
          name: "C Programming",
          totalCount: 34,
          passCount: 33,
          theoryAvg: 124,
          theoryStd: 24.3,
          grandAvg: 348,
          grandStd: 44.3,
          facultyName: "Dr. Murali PP",
          passPct: 97.1,
        },
        {
          sno: 8,
          code: "EEA01",
          name: "Basic Electrical & Electronics Engineering",
          totalCount: 19,
          passCount: 17,
          theoryAvg: 132,
          theoryStd: 17.2,
          grandAvg: 394,
          grandStd: 29.5,
          facultyName: "EzhilarasanD",
          passPct: 89.5,
        },
        {
          sno: 9,
          code: "EEA01",
          name: "Basic Electrical & Electronics Engineering",
          totalCount: 14,
          passCount: 13,
          theoryAvg: 110,
          theoryStd: 30.5,
          grandAvg: 347,
          grandStd: 58.7,
          facultyName: "Dr. Srihari T",
          passPct: 92.9,
        },
        {
          sno: 10,
          code: "UBA06",
          name: "Applied Mathematics",
          totalCount: 10,
          passCount: 0,
          theoryAvg: 90,
          theoryStd: 13.5,
          grandAvg: 326,
          grandStd: 39.2,
          facultyName: "Dr. G. Shanmugam",
          passPct: 0,
        },
      ],
      "May-2025": [
        {
          sno: 1,
          code: "CSA11",
          name: "Data Structures",
          totalCount: 36,
          passCount: 34,
          theoryAvg: 121,
          theoryStd: 19.4,
          grandAvg: 356,
          grandStd: 31.2,
          facultyName: "Dr. Karthik S",
          passPct: 94.4,
        },
      ],
      "April-2025": [
        {
          sno: 1,
          code: "UBA03",
          name: "Communication Skills",
          totalCount: 42,
          passCount: 42,
          theoryAvg: 150,
          theoryStd: 7.2,
          grandAvg: 410,
          grandStd: 12.8,
          facultyName: "Meenakshi V",
          passPct: 100,
        },
      ],
    }),
    []
  );

  const [month, setMonth] = useState<string>("June-2025");
  const [appliedMonth, setAppliedMonth] = useState<string>("June-2025");

  const rows = dataByMonth[appliedMonth] ?? [];

  const fmtPct = (v: number) => {
    const isInt = Math.abs(v - Math.round(v)) < 1e-9;
    return isInt ? String(Math.round(v)) : v.toFixed(1);
  };

  return (
    <div className="w-full p-4 md:p-6 space-y-4">
      <div className="text-[28px] font-light text-slate-700 dark:text-slate-100 leading-none">
        Result Analysis
      </div>

      {/* Controls (like screenshot) */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm text-rose-500 font-medium min-w-[110px]">
          Month &amp; Year
        </div>

        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className={cn(
            "h-10 w-[240px] rounded-none px-3 text-sm",
            "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
            "border border-slate-200 dark:border-slate-800",
            "focus:outline-none focus:ring-2 focus:ring-emerald-400/50 dark:focus:ring-emerald-300/50"
          )}
        >
          {months.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setAppliedMonth(month)}
          className={cn(
            "h-10 px-4 rounded-none text-sm font-semibold",
            "bg-teal-500 hover:bg-teal-600 text-white",
            "active:translate-y-[0.5px] transition"
          )}
        >
          View Analysis
        </button>
      </div>

      {/* Table */}
      <TableShell>
        <table className="min-w-[1320px] w-full border-collapse">
          <thead>
            <tr>
              <Th className="w-[70px]">SNo.</Th>
              <Th className="w-[90px]">Code</Th>
              <Th className="min-w-[280px]">Name</Th>
              <Th className="w-[120px]">Totalcount</Th>
              <Th className="w-[120px]">Passcount</Th>
              <Th className="w-[160px]">Theory Average</Th>
              <Th className="w-[210px]">Theory Standard Deviation</Th>
              <Th className="w-[190px]">Grand Total Average</Th>
              <Th className="w-[240px]">Grand Total Standard Deviation</Th>
              <Th className="min-w-[240px]">Faculty Name</Th>
              <Th className="w-[150px]">PassPercentage</Th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <Td colSpan={11} className="py-10 text-center text-slate-500 dark:text-slate-400">
                  No data available in table
                </Td>
              </tr>
            ) : (
              rows.map((r, idx) => (
                <tr
                  key={`${r.code}-${r.sno}-${idx}`}
                  className={cn(
                    "transition",
                    idx % 2 === 0
                      ? "bg-white dark:bg-slate-950"
                      : "bg-slate-50/70 dark:bg-slate-900/20"
                  )}
                >
                  <Td align="center" className="tabular-nums">
                    {r.sno}
                  </Td>
                  <Td align="center" className="tabular-nums">
                    {r.code}
                  </Td>
                  <Td align="center">{r.name}</Td>
                  <Td align="center" className="tabular-nums">
                    {r.totalCount}
                  </Td>
                  <Td align="center" className={cn("tabular-nums", r.passCount === 0 && "text-rose-600 dark:text-rose-300")}>
                    {r.passCount}
                  </Td>
                  <Td align="center" className="tabular-nums">
                    {r.theoryAvg}
                  </Td>
                  <Td align="center" className="tabular-nums">
                    {r.theoryStd}
                  </Td>
                  <Td align="center" className="tabular-nums">
                    {r.grandAvg}
                  </Td>
                  <Td align="center" className="tabular-nums">
                    {r.grandStd}
                  </Td>
                  <Td align="center">{r.facultyName}</Td>
                  <Td align="center" className={cn("tabular-nums", r.passPct === 0 && "text-rose-600 dark:text-rose-300")}>
                    {fmtPct(r.passPct)}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
