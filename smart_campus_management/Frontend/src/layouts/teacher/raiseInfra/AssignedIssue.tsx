// src/layouts/teacher/raiseInfra/AssignedIssue.tsx
import React, { useMemo, useState } from "react";

type TabKey = "Assigned" | "Closed";

type IssueRow = {
  id: string;
  regNoOrEmpId: string;
  name: string;
  userType: "Student" | "Faculty" | "Staff";
  issue: string;
  location: string;
  createdOn: string; // DD/MM/YYYY
  solutionOn?: string; // DD/MM/YYYY
  status: TabKey;
};

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function MetricCard({
  label,
  value,
  tone,
  subtitle,
}: {
  label: string;
  value: number;
  subtitle?: string;
  tone: "indigo" | "slate" | "violet";
}) {
  const bg =
    tone === "indigo"
      ? "from-indigo-800 via-indigo-700 to-slate-800"
      : tone === "slate"
      ? "from-slate-800 via-slate-800 to-slate-700"
      : "from-violet-800 via-violet-700 to-slate-800";

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)]">
      <div className={clsx("px-5 py-4 bg-gradient-to-r", bg)}>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[12px] font-semibold tracking-wide text-white/85 uppercase truncate">
              {label}
            </div>
            <div className="mt-1 text-[11px] text-white/70">
              {subtitle ?? "Raise Infra"}
            </div>
          </div>
          <div className="text-3xl font-semibold text-white tabular-nums">
            {value}
          </div>
        </div>
      </div>
      <div className="px-5 py-3 bg-slate-50/70 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800">
        <div className="text-xs text-slate-600 dark:text-slate-300">
          Updated just now
        </div>
      </div>
    </div>
  );
}

function TabPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition shadow-sm border",
        active
          ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
          : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/60"
      )}
    >
      <span
        className={clsx(
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-white/90 dark:bg-slate-900" : "bg-slate-400"
        )}
      />
      {label}
    </button>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="py-14 text-center">
      <div className="text-sm font-semibold text-slate-900 dark:text-white">
        {title}
      </div>
      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {subtitle}
      </div>
    </div>
  );
}

export default function AssignedIssue() {
  // Demo data (replace later with API)
  const rows: IssueRow[] = useMemo(
    () => [
      // keep a couple examples; delete all to match screenshot "No data"
      {
        id: "i1",
        regNoOrEmpId: "192211856",
        name: "KARMURI SRI RAMCHARAN REDDY",
        userType: "Student",
        issue: "Projector not working in Seminar Hall.",
        location: "Seminar Hall - Block A",
        createdOn: "24/12/2025",
        status: "Assigned",
      },
      {
        id: "i2",
        regNoOrEmpId: "EMP-0142",
        name: "SURESH K",
        userType: "Faculty",
        issue: "Wi-Fi intermittent in Staff Room.",
        location: "Staff Room - Block C",
        createdOn: "20/12/2025",
        solutionOn: "22/12/2025",
        status: "Closed",
      },
    ],
    []
  );

  const [tab, setTab] = useState<TabKey>("Assigned");
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const counts = useMemo(() => {
    const assigned = rows.filter((r) => r.status === "Assigned").length;
    const closed = rows.filter((r) => r.status === "Closed").length;
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const todayLabel = `${dd}/${mm}/${yyyy}`;
    const todayCount = rows.filter((r) => r.createdOn === todayLabel).length;
    return { todayCount, assigned, closed };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => r.status === tab)
      .filter((r) => {
        if (!q) return true;
        const hay = `${r.regNoOrEmpId} ${r.name} ${r.userType} ${r.issue} ${r.location} ${r.createdOn} ${r.solutionOn ?? ""}`.toLowerCase();
        return hay.includes(q);
      });
  }, [rows, tab, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  React.useEffect(() => {
    setPage(1);
  }, [tab, pageSize, query]);

  const exportIssues = () => {
    // Simple CSV export (client-side, no icons)
    const headers = [
      "RegNoOrEmpId",
      "Name",
      "UserType",
      "Issue",
      "Location",
      "CreatedOn",
      "SolutionOn",
      "Status",
    ];
    const data = filtered.map((r) => [
      r.regNoOrEmpId,
      r.name,
      r.userType,
      r.issue,
      r.location,
      r.createdOn,
      r.solutionOn ?? "",
      r.status,
    ]);

    const csv =
      headers.join(",") +
      "\n" +
      data
        .map((row) =>
          row
            .map((v) => `"${String(v).replaceAll('"', '""')}"`)
            .join(",")
        )
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assigned_issues_${tab.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Assigned Issue
        </h1>

        <button
          type="button"
          onClick={exportIssues}
          className={clsx(
            "h-9 px-3 rounded-xl text-sm font-semibold transition shadow-sm",
            "border border-slate-200 dark:border-slate-800",
            "bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100",
            "hover:bg-slate-50 dark:hover:bg-slate-900/60"
          )}
        >
          Export Issues
        </button>
      </div>

      {/* top cards */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Today" value={counts.todayCount} tone="indigo" />
        <MetricCard label="Assigned" value={counts.assigned} tone="slate" />
        <MetricCard label="Closed" value={counts.closed} tone="violet" />
      </div>

      {/* tabs + table */}
      <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/30">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <TabPill
                active={tab === "Assigned"}
                onClick={() => setTab("Assigned")}
                label="Assigned"
              />
              <TabPill
                active={tab === "Closed"}
                onClick={() => setTab("Closed")}
                label="Closed"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-800 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  records
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Search:
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="RegNo / Name / Location..."
                  className="h-9 w-full sm:w-[240px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-white dark:bg-slate-950">
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[180px]">
                  RegNo or Empid
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[200px]">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">
                  User Type
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[420px]">
                  Issue
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[220px]">
                  Location
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">
                  Created On
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">
                  Solution On
                </th>
              </tr>
            </thead>

            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4">
                    <EmptyState
                      title="No data available in table"
                      subtitle="Try changing the tab or clearing search."
                    />
                  </td>
                </tr>
              ) : (
                pageRows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition"
                  >
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-100 font-medium">
                      {r.regNoOrEmpId}
                    </td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-50">
                      {r.name}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {r.userType}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {r.issue}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {r.location}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">
                      {r.createdOn}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">
                      {r.solutionOn ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50/60 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Showing{" "}
            <span className="font-semibold">
              {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold">
              {Math.min(safePage * pageSize, filtered.length)}
            </span>{" "}
            of <span className="font-semibold">{filtered.length}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="h-9 w-9 grid place-items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition disabled:opacity-50"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
              title="Previous"
            >
              ‹
            </button>

            <div className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-700 dark:text-slate-200 tabular-nums">
              {safePage} / {totalPages}
            </div>

            <button
              type="button"
              className="h-9 w-9 grid place-items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition disabled:opacity-50"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
              title="Next"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
