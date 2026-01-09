import React, { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, ChevronDown, ChevronUp, FileText, X } from "lucide-react";

type Row = {
  id: string;
  sno: number;
  issueDetails: string;
  lastActionDetails: string;
  lastActionOn: string; // dd/MM/yyyy or empty
  complainant: string;
  issueOn: string; // dd/MM/yyyy
  status: "InProgress" | "Closed" | "Rejected";
  fileName: string;
  fileContent: string; // demo text for "file"
};

type SortKey =
  | "sno"
  | "issueDetails"
  | "lastActionDetails"
  | "lastActionOn"
  | "complainant"
  | "issueOn"
  | "status";

type SortDir = "asc" | "desc";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost/smart_campus_api";
const STUDENT_API = `${API_BASE}/api/student`;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function toDateKey(s: string) {
  // dd/MM/yyyy -> yyyyMMdd for compare
  if (!s) return "";
  const [dd, mm, yyyy] = s.split("/");
  if (!dd || !mm || !yyyy) return s;
  return `${yyyy}${mm}${dd}`;
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function Th({
  children,
  onClick,
  active,
  dir,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  dir?: SortDir;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "text-left text-[12.5px] font-semibold",
        "text-slate-700 dark:text-slate-200",
        "bg-white dark:bg-slate-900",
        "border-b border-slate-200 dark:border-slate-800",
        "px-3 py-2.5 whitespace-nowrap sticky top-0 z-10",
        className
      )}
    >
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "inline-flex items-center gap-1.5",
            "hover:text-slate-900 dark:hover:text-white transition",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 rounded"
          )}
        >
          {children}
          {active ? (
            dir === "asc" ? (
              <ChevronUp className="h-4 w-4 opacity-80" />
            ) : (
              <ChevronDown className="h-4 w-4 opacity-80" />
            )
          ) : (
            <ArrowUpDown className="h-4 w-4 opacity-35" />
          )}
        </button>
      ) : (
        children
      )}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td
      className={cn(
        "text-[13px]",
        "text-slate-700 dark:text-slate-200",
        "border-b border-slate-200/80 dark:border-slate-800",
        "px-3 py-3 align-top",
        className
      )}
    >
      {children}
    </td>
  );
}

function StatusChip({ status }: { status: Row["status"] }) {
  const cls =
    status === "InProgress"
      ? "bg-sky-100 text-sky-800 ring-sky-200 dark:bg-sky-950/30 dark:text-sky-200 dark:ring-sky-900/40"
      : status === "Closed"
      ? "bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-900/40"
      : "bg-rose-100 text-rose-800 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-200 dark:ring-rose-900/40";

  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1", cls)}>
      {status}
    </span>
  );
}

function FileModal({
  open,
  onClose,
  title,
  content,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  content: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-black/35"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              <div className="text-[14px] font-semibold text-slate-900 dark:text-white">
                {title}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40"
            >
              <X className="h-5 w-5 text-slate-700 dark:text-slate-200" />
            </button>
          </div>

          <div className="p-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 text-[13px] text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
              {content}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className={cn(
                  "rounded-xl px-4 py-2 text-[13px] font-semibold",
                  "bg-slate-900 text-white hover:bg-slate-800",
                  "dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100",
                  "shadow-sm transition",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40"
                )}
              >
                Print
              </button>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "rounded-xl px-4 py-2 text-[13px] font-semibold",
                  "border border-slate-200 dark:border-slate-800",
                  "bg-white dark:bg-slate-900",
                  "hover:bg-slate-50 dark:hover:bg-slate-800/60",
                  "transition",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40"
                )}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StudentDisciplinary() {
  const [rows, setRows] = useState<Row[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("sno");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    fetch(`${STUDENT_API}/disciplinary`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.rows) setRows(json.rows as Row[]);
      })
      .catch(() => {});
  }, []);

  const sorted = useMemo(() => {
    const copy = [...rows];
    const dir = sortDir === "asc" ? 1 : -1;
    copy.sort((a, b) => {
      const va = a[sortKey] as any;
      const vb = b[sortKey] as any;

      if (sortKey === "issueOn" || sortKey === "lastActionOn") {
        return toDateKey(String(va)).localeCompare(toDateKey(String(vb))) * dir;
      }

      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb), undefined, { sensitivity: "base" }) * dir;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  function toggleSort(k: SortKey) {
    setSortKey((prev) => {
      if (prev === k) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir("asc");
      return k;
    });
  }

  const [fileOpen, setFileOpen] = useState(false);
  const [fileTitle, setFileTitle] = useState("");
  const [fileContent, setFileContent] = useState("");

  function openFile(row: Row) {
    setFileTitle(row.fileName);
    setFileContent(row.fileContent);
    setFileOpen(true);
  }

  return (
    <div className="w-full p-4 md:p-6">
      <div className="mb-4">
        <div className="text-[28px] font-light text-slate-700 dark:text-slate-100 leading-none">
          Disciplinary Record
        </div>
      </div>

      <TableShell>
        <table className="min-w-[1100px] w-full border-collapse">
          <thead>
            <tr>
              <Th className="w-[70px]" onClick={() => toggleSort("sno")} active={sortKey === "sno"} dir={sortDir}>
                Sno
              </Th>
              <Th onClick={() => toggleSort("issueDetails")} active={sortKey === "issueDetails"} dir={sortDir}>
                Issue Details
              </Th>
              <Th onClick={() => toggleSort("lastActionDetails")} active={sortKey === "lastActionDetails"} dir={sortDir}>
                Last Action Details
              </Th>
              <Th className="w-[150px]" onClick={() => toggleSort("lastActionOn")} active={sortKey === "lastActionOn"} dir={sortDir}>
                Last Action On
              </Th>
              <Th className="w-[160px]" onClick={() => toggleSort("complainant")} active={sortKey === "complainant"} dir={sortDir}>
                Complainant
              </Th>
              <Th className="w-[150px]" onClick={() => toggleSort("issueOn")} active={sortKey === "issueOn"} dir={sortDir}>
                Issue On
              </Th>
              <Th className="w-[140px]" onClick={() => toggleSort("status")} active={sortKey === "status"} dir={sortDir}>
                Status
              </Th>
              <Th className="w-[120px] text-center">View</Th>
            </tr>
          </thead>

          <tbody>
            {sorted.map((r, idx) => (
              <tr
                key={r.id}
                className={cn(
                  idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/60 dark:bg-slate-900/60",
                  "hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
                )}
              >
                <Td className="tabular-nums">{r.sno}</Td>
                <Td className="max-w-[520px]">{r.issueDetails}</Td>
                <Td className="max-w-[420px]">{r.lastActionDetails || "—"}</Td>
                <Td className="tabular-nums">{r.lastActionOn || "—"}</Td>
                <Td>{r.complainant}</Td>
                <Td className="tabular-nums">{r.issueOn}</Td>
                <Td>
                  <StatusChip status={r.status} />
                </Td>
                <Td className="text-center">
                  <button
                    type="button"
                    onClick={() => openFile(r)}
                    className={cn(
                      "inline-flex items-center justify-center",
                      "rounded-full px-3 py-1.5",
                      "text-[12px] font-semibold text-white",
                      "bg-teal-600 hover:bg-teal-700",
                      "shadow-sm transition",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50"
                    )}
                  >
                    View File
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      <FileModal
        open={fileOpen}
        onClose={() => setFileOpen(false)}
        title={fileTitle}
        content={fileContent}
      />
    </div>
  );
}
