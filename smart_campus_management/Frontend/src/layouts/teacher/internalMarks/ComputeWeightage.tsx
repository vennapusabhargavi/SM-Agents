// src/layouts/teacher/examination/ComputeWeightage.tsx
import React, { useMemo, useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";

type CourseOpt = { code: string; name: string };
type TestOpt = { id: string; name: string };

type WeightRow = {
  id: string;
  courseCode: string;
  courseName: string;
  testId: string;
  testName: string;
  weightage: string; // keep as string (one decimal)
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function normalizeOneDecimal(raw: string) {
  // allow "", digits, one dot, and at most 1 decimal place
  let v = raw.replace(/[^\d.]/g, "");
  const firstDot = v.indexOf(".");
  if (firstDot !== -1) {
    // remove any extra dots
    v =
      v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, "");
    // keep only one decimal place
    const [a, b = ""] = v.split(".");
    v = `${a}.${b.slice(0, 1)}`;
  }
  // avoid leading zeros like 00 -> 0 (keep "0." valid)
  if (v.length > 1 && v[0] === "0" && v[1] !== ".") {
    v = String(Number(v));
  }
  return v;
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-[120px] text-right">
        <div className="text-[13px] font-medium text-rose-600">{label}</div>
      </div>
      <div className="min-w-0">
        {children}
        {hint ? (
          <div className="mt-1 text-[11px] text-rose-500">{hint}</div>
        ) : null}
      </div>
    </div>
  );
}

export default function ComputeWeightage() {
  const courses: CourseOpt[] = useMemo(
    () => [
      { code: "CSA1524", name: "Cloud Computing and Big Data Analytics with Apache" },
      { code: "SPIC411", name: "Core Project" },
      { code: "ECA05", name: "Engineering Electromagnetics" },
    ],
    []
  );

  const testsByCourse: Record<string, TestOpt[]> = useMemo(
    () => ({
      CSA1524: [
        { id: "t1", name: "IA 1" },
        { id: "t2", name: "IA 2" },
        { id: "t3", name: "Model Test" },
      ],
      SPIC411: [
        { id: "t1", name: "IA 1" },
        { id: "t2", name: "IA 2" },
      ],
      ECA05: [
        { id: "t1", name: "IA 1" },
        { id: "t2", name: "IA 2" },
        { id: "t4", name: "Assignment Weight" },
      ],
    }),
    []
  );

  const [courseCode, setCourseCode] = useState("");
  const [testId, setTestId] = useState("");
  const [weightage, setWeightage] = useState("0");

  const [rows, setRows] = useState<WeightRow[]>([]);

  const selectedCourse = courses.find((c) => c.code === courseCode) || null;
  const tests = courseCode ? testsByCourse[courseCode] ?? [] : [];
  const selectedTest = tests.find((t) => t.id === testId) || null;

  const canAdd =
    !!selectedCourse &&
    !!selectedTest &&
    weightage.trim() !== "" &&
    !Number.isNaN(Number(weightage));

  const addRow = () => {
    if (!canAdd || !selectedCourse || !selectedTest) return;

    // prevent duplicate (same course+test)
    const dup = rows.some(
      (r) => r.courseCode === selectedCourse.code && r.testId === selectedTest.id
    );
    if (dup) return;

    const id = `${selectedCourse.code}-${selectedTest.id}-${Date.now()}`;
    setRows((prev) => [
      ...prev,
      {
        id,
        courseCode: selectedCourse.code,
        courseName: selectedCourse.name,
        testId: selectedTest.id,
        testName: selectedTest.name,
        weightage: weightage === "" ? "0" : weightage,
      },
    ]);
  };

  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  return (
    <div className="w-full">
      {/* Title */}
      <div className="text-[30px] font-light text-slate-700 dark:text-slate-100 leading-none">
        Compute IA Weightage
      </div>

      {/* Top form row (like screenshot) */}
      <div className="mt-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-center gap-6">
          <Field label="Course">
            <select
              value={courseCode}
              onChange={(e) => {
                setCourseCode(e.target.value);
                setTestId("");
              }}
              className={cn(
                "h-10 w-[280px] px-3 text-sm",
                "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
                "border border-slate-200 dark:border-slate-800",
                "focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              )}
            >
              <option value="">--Select--</option>
              {courses.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Test Name">
            <select
              value={testId}
              onChange={(e) => setTestId(e.target.value)}
              disabled={!courseCode}
              className={cn(
                "h-10 w-[260px] px-3 text-sm",
                "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
                "border border-slate-200 dark:border-slate-800",
                "focus:outline-none focus:ring-2 focus:ring-teal-500/30",
                !courseCode && "opacity-60 cursor-not-allowed"
              )}
            >
              <option value="">-Select-</option>
              {tests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Weightage" hint="one decimal only">
            <input
              value={weightage}
              onChange={(e) => setWeightage(normalizeOneDecimal(e.target.value))}
              inputMode="decimal"
              placeholder="0"
              className={cn(
                "h-10 w-[110px] px-3 text-sm text-right tabular-nums",
                "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
                "border border-slate-200 dark:border-slate-800",
                "focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              )}
            />
          </Field>

          <div className="flex items-center">
            <button
              type="button"
              onClick={addRow}
              disabled={!canAdd}
              className={cn(
                "h-10 px-4 text-sm font-semibold",
                "bg-teal-500 hover:bg-teal-600 text-white",
                "border border-teal-500",
                "transition active:scale-[0.99]",
                !canAdd && "opacity-50 cursor-not-allowed hover:bg-teal-500"
              )}
              title={canAdd ? "Add" : "Select course, test and weightage"}
            >
              <span className="inline-flex items-center gap-2">
                <PlusIcon size={16} />
                Add
              </span>
            </button>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="text-[12px] text-rose-600">
            Note: Mark details can&apos;t be change once submit into system
          </div>
        </div>
      </div>

      {/* Optional list (appears only after Add) */}
      {rows.length > 0 && (
        <div className="mt-8">
          <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Added Weightage
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                (Demo list — wire to API later)
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[920px] w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 w-[140px]">
                      Course
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Course Name
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 w-[160px]">
                      Test Name
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-200 w-[140px]">
                      Weightage
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-200 w-[120px]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr
                      key={r.id}
                      className={cn(
                        idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/20",
                        "border-b border-slate-200/70 dark:border-slate-800/70"
                      )}
                    >
                      <td className="px-3 py-3 text-sm font-semibold text-slate-900 dark:text-slate-50">
                        {r.courseCode}
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-800 dark:text-slate-100">
                        {r.courseName}
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-800 dark:text-slate-100">
                        {r.testName}
                      </td>
                      <td className="px-3 py-3 text-sm text-right tabular-nums text-slate-900 dark:text-slate-50">
                        {r.weightage}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeRow(r.id)}
                          className={cn(
                            "h-9 w-9 inline-flex items-center justify-center",
                            "border border-slate-200 dark:border-slate-800",
                            "bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/40",
                            "transition"
                          )}
                          aria-label="Remove"
                          title="Remove"
                        >
                          <Trash2Icon size={16} className="text-slate-600 dark:text-slate-300" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* small helper */}
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Tip: duplicates (same course + test) are prevented.
          </div>
        </div>
      )}
    </div>
  );
}
