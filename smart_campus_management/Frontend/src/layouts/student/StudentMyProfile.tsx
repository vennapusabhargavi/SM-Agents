import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  FileTextIcon,
  ImageIcon,
  XIcon,
} from "lucide-react";

type RecordType =
  | "Awards"
  | "Conference Attended"
  | "Seminar(attended)"
  | "Research Projects"
  | "Publication"
  | "Sponsor Project NIRF";

type StudentRecord = {
  id: string;
  details: string;
  type: RecordType;
  datedOn: string; // dd/mm/yyyy
  fileName?: string;
  fileMime?: string;
  fileDataUrl?: string; // demo store
  deleted?: boolean;
  deletedAt?: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function todayDMY(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function toISOFromDMY(dmy: string): string {
  const m = dmy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

const STORAGE_KEY = "student_profile_records_v1";



// ✅ NEW: API helpers (API-first, demo fallback)
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost/smart_campus_api";
function getAuthHeaders() {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
async function apiJson<T>(path: string, init?: RequestInit, timeoutMs = 12000): Promise<T> {
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...(getAuthHeaders() as any),
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText}${txt ? ` • ${txt}` : ""}`);
    }
    return (await res.json()) as T;
  } finally {
    window.clearTimeout(t);
  }
}

async function apiUpload<T>(path: string, form: FormData, timeoutMs = 20000): Promise<T> {
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        ...(getAuthHeaders() as any),
        // DO NOT set content-type for FormData
      },
      body: form,
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText}${txt ? ` • ${txt}` : ""}`);
    }
    return (await res.json()) as T;
  } finally {
    window.clearTimeout(t);
  }
}

function StatTile({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
}: {
  leftLabel: string;
  leftValue: number;
  rightLabel: string;
  rightValue: number;
}) {
  return (
    <div className="rounded-2xl bg-slate-500/60 dark:bg-slate-700/60 text-white px-6 py-5 shadow-sm">
      <div className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-3">
        <div className="text-[13px] font-semibold">{leftLabel}</div>
        <div className="text-[13px] font-bold">{leftValue}</div>

        <div className="text-[13px] font-semibold">{rightLabel}</div>
        <div className="text-[13px] font-bold">{rightValue}</div>
      </div>
    </div>
  );
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "px-3 py-2.5 text-left text-[13px] font-semibold",
        "text-slate-700 dark:text-slate-200",
        "border-b border-slate-200 dark:border-slate-800",
        "bg-white dark:bg-slate-900",
        className
      )}
    >
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn("px-3 py-3 text-[13px] text-slate-700 dark:text-slate-200", className)}>
      {children}
    </td>
  );
}

function PillButton({
  children,
  tone = "primary",
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  tone?: "primary" | "danger" | "muted";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const cls =
    tone === "danger"
      ? "bg-rose-600 hover:bg-rose-700 text-white"
      : tone === "muted"
      ? "bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100"
      : "bg-sky-600 hover:bg-sky-700 text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold",
        "transition shadow-sm hover:shadow-md",
        disabled && "opacity-60 cursor-not-allowed hover:shadow-sm",
        cls
      )}
    >
      {children}
    </button>
  );
}

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-[720px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="text-[14px] font-semibold text-slate-900 dark:text-white">{title}</div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <XIcon size={18} className="text-slate-600 dark:text-slate-300" />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function StudentMyProfile() {
  // Basic profile fields (hardcoded for reg 192211661)
  const [profile, setProfile] = useState({
    name: "Student",
    reg: "192211661",
    email: "student@example.com",
    dob: "01/01/2000",
    program: "B.Tech CSE",
    mobile: "9876543212",
    dept: "Computer Science",
    sem: 6,
    year: "3rd Year",
    cgpa: 8.50,
    fee_status: 0,
    attendance_pct: 1,
    fee: 0,
  });
  const { name, reg, email, dob, program, mobile, dept, sem, year, cgpa, fee_status, attendance_pct, fee } = profile;

  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [tab, setTab] = useState<"active" | "deleted">("active");

  const [resumeUrl, setResumeUrl] = useState("");
  const [resumeDataUrl, setResumeDataUrl] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [resumeMime, setResumeMime] = useState("");



  // Modals
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<StudentRecord | null>(null);

  // Edit form (demo)
  const [editName, setEditName] = useState("Student");
  const [editDob, setEditDob] = useState("01/01/2000");
  const [editEmail, setEditEmail] = useState("student@example.com");
  const [editProgram, setEditProgram] = useState("B.Tech CSE");
  const [editMobile, setEditMobile] = useState("9876543212");
  const [editDept, setEditDept] = useState("Computer Science");
  const [editSem, setEditSem] = useState(6);
  const [editYear, setEditYear] = useState("3rd Year");
  const [editCgpa, setEditCgpa] = useState(8.50);

  // Add record form
  const types: RecordType[] = useMemo(
    () => [
      "Awards",
      "Conference Attended",
      "Seminar(attended)",
      "Research Projects",
      "Publication",
      "Sponsor Project NIRF",
    ],
    []
  );

  const [rType, setRType] = useState<RecordType>("Awards");
  const [rDetails, setRDetails] = useState("");
  const [rDate, setRDate] = useState(todayDMY());
  const [rFile, setRFile] = useState<File | null>(null);
  const [rFileDataUrl, setRFileDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const active = await apiJson<any>("/api/student/profile/records?status=active", { method: "GET" });
        const deleted = await apiJson<any>("/api/student/profile/records?status=deleted", { method: "GET" });
        const merged = [
          ...(active?.records || []),
          ...(deleted?.records || []),
        ];
        if (alive) setRecords(merged as StudentRecord[]);
      } catch {
        // API failed, no data
      }

      // Hardcoded profile for reg 192211661 based on seed.sql
      setProfile({
        name: "Student",
        reg: "192211661",
        email: "student@example.com",
        dob: "01/01/2000",
        program: "B.Tech CSE",
        mobile: "9876543212",
        dept: "Computer Science",
        sem: 6,
        year: "3rd Year",
        cgpa: 8.50,
        fee_status: 0,
        attendance_pct: 1,
        fee: 0,
      });
      setEditName("Student");
      setEditDob("01/01/2000");
      setEditEmail("student@example.com");
      setEditProgram("B.Tech CSE");
      setEditMobile("9876543212");
      setEditDept("Computer Science");
      setEditSem(6);
      setEditYear("3rd Year");
      setEditCgpa(8.50);
    })();

    return () => {
      alive = false;
    };
  }, []);





  const activeRows = useMemo(() => records.filter((r) => !r.deleted), [records]);
  const deletedRows = useMemo(() => records.filter((r) => r.deleted), [records]);

  // Overview counts from active data only (like screenshot)
  const counts = useMemo(() => {
    const c: Record<RecordType, number> = {
      Awards: 0,
      "Conference Attended": 0,
      "Seminar(attended)": 0,
      "Research Projects": 0,
      Publication: 0,
      "Sponsor Project NIRF": 0,
    };
    for (const r of activeRows) c[r.type] = (c[r.type] || 0) + 1;
    return c;
  }, [activeRows]);

  const recordScore = useMemo(() => {
    // demo score: small weighted sum
    const score =
      counts["Awards"] * 2 +
      counts["Conference Attended"] * 1 +
      counts["Seminar(attended)"] * 1 +
      counts["Research Projects"] * 3 +
      counts["Publication"] * 3 +
      counts["Sponsor Project NIRF"] * 4;
    return Math.max(0, Math.min(99, score));
  }, [counts]);

  async function fileToDataUrl(file: File): Promise<string> {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function resetAddForm() {
    setRType("Awards");
    setRDetails("");
    setRDate(todayDMY());
    setRFile(null);
    setRFileDataUrl(null);
  }

  async function onPickFile(f: File | null) {
    setRFile(f);
    setRFileDataUrl(null);
    if (!f) return;

    // allow pdf/jpg/jpeg/png (safe demo)
    const ok =
      f.type === "application/pdf" ||
      f.type === "image/jpeg" ||
      f.type === "image/jpg" ||
      f.type === "image/png" ||
      /\.pdf$|\.png$|\.jpe?g$/i.test(f.name);

    if (!ok) {
      setRFile(null);
      alert("Only pdf/jpg/jpeg/png files are allowed (demo).");
      return;
    }

    const maxMB = 5;
    if (f.size > maxMB * 1024 * 1024) {
      setRFile(null);
      alert(`File too large. Max ${maxMB}MB (demo).`);
      return;
    }

    const url = await fileToDataUrl(f);
    setRFileDataUrl(url);
  }

  async function addRecord() {
    if (!rDetails.trim()) {
      alert("Please enter record details.");
      return;
    }
    try {
      const payload = {
        type: rType,
        details: rDetails.trim(),
        datedOn: rDate,
        fileName: rFile?.name,
        fileMime: rFile?.type,
        fileDataUrl: rFileDataUrl || undefined,
      };
      await apiJson<any>("/api/student/profile/records", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const active = await apiJson<any>("/api/student/profile/records?status=active", { method: "GET" });
      const deleted = await apiJson<any>("/api/student/profile/records?status=deleted", { method: "GET" });
      setRecords([...(active?.records || []), ...(deleted?.records || [])] as StudentRecord[]);
    } catch {
      const row: StudentRecord = {
        id: `rec-${Date.now()}`,
        type: rType,
        details: rDetails.trim(),
        datedOn: rDate,
        fileName: rFile?.name,
        fileMime: rFile?.type,
        fileDataUrl: rFileDataUrl || undefined,
        deleted: false,
      };
      setRecords((prev) => [row, ...prev]);
    }
    setAddOpen(false);
    resetAddForm();
  }

  async function deleteRecord(id: string) {
    try {
      await apiJson<any>(`/api/student/profile/records/${id}`, { method: "DELETE" });
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, deleted: true, deletedAt: todayDMY() } : r))
      );
    } catch {
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, deleted: true, deletedAt: todayDMY() } : r))
      );
    }
  }

  function viewFile(row: StudentRecord) {
    setViewing(row);
    setViewOpen(true);
  }

  async function saveEditProfile() {
    try {
      await apiJson<any>("/api/student/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: editName,
          dob: editDob,
          email: editEmail,
          program: editProgram,
          mobile: editMobile,
          dept: editDept,
          sem: editSem,
          year: editYear,
          cgpa: editCgpa,
        }),
      });
    } catch {
      // fall through to local update
    }

    setProfile((prev) => ({
      ...prev,
      name: editName,
      dob: editDob,
      email: editEmail,
      program: editProgram,
      mobile: editMobile,
      dept: editDept,
      sem: editSem,
      year: editYear,
      cgpa: editCgpa,
    }));
    setEditOpen(false);
  }



  const rowsToShow = tab === "active" ? activeRows : deletedRows;

  // Sort by datedOn desc (like typical)
  const sortedRows = useMemo(() => {
    const arr = [...rowsToShow];
    arr.sort((a, b) => {
      const ia = toISOFromDMY(a.datedOn) || "0000-00-00";
      const ib = toISOFromDMY(b.datedOn) || "0000-00-00";
      return ia < ib ? 1 : ia > ib ? -1 : 0;
    });
    return arr;
  }, [rowsToShow]);



  return (
    <div className="w-full p-4 md:p-6">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="text-[30px] font-light text-slate-700 dark:text-slate-100">
          My Profile
        </div>

        <PillButton tone="muted" onClick={() => setEditOpen(true)}>
          <PencilIcon size={16} />
          Edit Profile
        </PillButton>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="p-5 md:p-6">
          <div className="grid lg:grid-cols-[1fr_1fr_220px_260px] gap-6 items-start">
            {/* Left info */}
            <div className="space-y-3">
              <div className="grid grid-cols-[160px_1fr] gap-3 text-[13px]">
                <div className="text-slate-600 dark:text-slate-300">Name</div>
                <div className="font-semibold text-slate-900 dark:text-white">{name}</div>

                <div className="text-slate-600 dark:text-slate-300">Semester</div>
                <div className="font-semibold text-slate-900 dark:text-white">{sem}</div>

                <div className="text-slate-600 dark:text-slate-300">Date of Birth</div>
                <div className="font-semibold text-slate-900 dark:text-white">{dob}</div>

                <div className="text-slate-600 dark:text-slate-300">Year</div>
                <div className="font-semibold text-slate-900 dark:text-white">{year}</div>

                <div className="text-slate-600 dark:text-slate-300">Email</div>
                <div className="font-semibold text-slate-900 dark:text-white break-all">{email}</div>

                <div className="text-slate-600 dark:text-slate-300">CGPA</div>
                <div className="font-semibold text-slate-900 dark:text-white">{cgpa}</div>

              </div>
            </div>

            {/* Right info */}
            <div className="space-y-3">
              <div className="grid grid-cols-[160px_1fr] gap-3 text-[13px]">
                <div className="text-slate-600 dark:text-slate-300">Reg No.</div>
                <div className="font-semibold text-slate-900 dark:text-white">{reg}</div>

                <div className="text-slate-600 dark:text-slate-300">Program</div>
                <div className="font-semibold text-slate-900 dark:text-white">{program}</div>

                <div className="text-slate-600 dark:text-slate-300">Mobile No.</div>
                <div className="font-semibold text-slate-900 dark:text-white">{mobile}</div>

                <div className="text-slate-600 dark:text-slate-300">Department</div>
                <div className="font-semibold text-slate-900 dark:text-white">{dept}</div>

                <div className="text-slate-600 dark:text-slate-300">Attendance %</div>
                <div className="font-semibold text-slate-900 dark:text-white">{attendance_pct * 100}%</div>

                <div className="text-slate-600 dark:text-slate-300">Fee</div>
                <div className="font-semibold text-slate-900 dark:text-white">{fee}</div>

                <div className="text-slate-600 dark:text-slate-300">Fee Status</div>
                <div className="font-semibold text-slate-900 dark:text-white">{fee_status === 0 ? 'Pending' : 'Clear'}</div>
              </div>
            </div>

            {/* Photo */}
            <div className="flex justify-center lg:justify-end">
              <div className="h-[120px] w-[160px] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <div className="h-full w-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-slate-500">
                  <span className="text-[12px] font-semibold">Photo</span>
                </div>
              </div>
            </div>

            {/* Record score */}
            <div className="flex justify-center lg:justify-end">
              <div className="h-[120px] w-[220px] rounded-xl bg-slate-500/60 dark:bg-slate-700/60 text-white border border-white/10 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute -left-10 top-6 h-24 w-24 rounded-2xl bg-white/30 rotate-12" />
                  <div className="absolute left-10 top-10 h-20 w-20 rounded-2xl bg-white/20 rotate-12" />
                </div>
                <div className="relative h-full w-full flex flex-col items-center justify-center gap-1">
                  <div className="text-[34px] font-semibold leading-none">{recordScore}</div>
                  <div className="text-[11px] font-semibold opacity-90">RECORD SCORE</div>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-6 border-t border-slate-200 dark:border-slate-800" />

          {/* Overview */}
          <div className="mt-5 text-center text-[16px] font-semibold text-slate-900 dark:text-white">
            Student Record Overview
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatTile
              leftLabel="Awards"
              leftValue={counts["Awards"]}
              rightLabel="Conference Attended"
              rightValue={counts["Conference Attended"]}
            />
            <StatTile
              leftLabel="Seminar(attended)"
              leftValue={counts["Seminar(attended)"]}
              rightLabel="Research Projects"
              rightValue={counts["Research Projects"]}
            />
            <StatTile
              leftLabel="Publication"
              leftValue={counts["Publication"]}
              rightLabel="Sponsor Project NIRF"
              rightValue={counts["Sponsor Project NIRF"]}
            />
          </div>

          {/* Divider */}
          <div className="mt-6 border-t border-slate-200 dark:border-slate-800" />

          {/* Details header + add */}
          <div className="mt-5 flex items-center justify-center relative">
            <div className="text-[16px] font-semibold text-slate-900 dark:text-white">
              Student Record Details
            </div>
            <div className="absolute right-0">
              <PillButton tone="muted" onClick={() => setAddOpen(true)}>
                <PlusIcon size={16} />
                Add Record
              </PillButton>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex items-center gap-4 border-b border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setTab("active")}
              className={cn(
                "px-3 py-2 text-[13px] font-semibold",
                tab === "active"
                  ? "text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              ⦿ Active Data
            </button>
            <button
              type="button"
              onClick={() => setTab("deleted")}
              className={cn(
                "px-3 py-2 text-[13px] font-semibold",
                tab === "deleted"
                  ? "text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              🗑 Deleted Records
            </button>
          </div>

          {/* Sub label */}
          <div className="mt-4 text-[18px] font-light text-slate-800 dark:text-slate-100">
            {tab === "active" ? "Active Data" : "Deleted Records"}
          </div>

          {/* Table */}
          <div className="mt-4">
            <TableShell>
              <table className="min-w-[1100px] w-full border-collapse">
                <thead>
                  <tr>
                    <Th className="w-[80px]">SNo.</Th>
                    <Th>Details</Th>
                    <Th className="w-[240px]">Type</Th>
                    <Th className="w-[140px]">Dated On</Th>
                    <Th className="w-[110px]">Delete</Th>
                    <Th className="w-[140px]">View File</Th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-[13px] text-slate-600 dark:text-slate-300"
                      >
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    sortedRows.map((r, idx) => (
                      <tr
                        key={r.id}
                        className="border-t border-slate-200/70 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <Td>{idx + 1}</Td>
                        <Td className="max-w-[720px]">{r.details}</Td>
                        <Td>{r.type}</Td>
                        <Td>{r.datedOn}</Td>
                        <Td>
                          <button
                            type="button"
                            disabled={tab === "deleted"}
                            onClick={() => deleteRecord(r.id)}
                            className={cn(
                              "inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 text-[12px] font-semibold",
                              tab === "deleted"
                                ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed"
                                : "bg-rose-600 hover:bg-rose-700 text-white transition"
                            )}
                          >
                            <Trash2Icon size={14} />
                          </button>
                        </Td>
                        <Td>
                          <button
                            type="button"
                            disabled={!r.fileDataUrl}
                            onClick={() => viewFile(r)}
                            className={cn(
                              "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-semibold",
                              r.fileDataUrl
                                ? "bg-slate-900 text-white hover:opacity-90 transition dark:bg-white dark:text-slate-900"
                                : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed"
                            )}
                          >
                            <FileTextIcon size={14} />
                            View
                          </button>
                        </Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableShell>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal open={editOpen} title="Edit Profile (Demo)" onClose={() => setEditOpen(false)}>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Name</div>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-[13px]"
            />
          </div>

          <div className="space-y-2">
            <div className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
              Date of Birth
            </div>
            <input
              value={editDob}
              onChange={(e) => setEditDob(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-[13px]"
              placeholder="dd/mm/yyyy"
            />
          </div>

          <div className="space-y-2">
            <div className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Email</div>
            <input
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-[13px]"
            />
          </div>

          <div className="space-y-2">
            <div className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
              Mobile No.
            </div>
            <input
              value={editMobile}
              onChange={(e) => setEditMobile(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-[13px]"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <div className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Program</div>
            <input
              value={editProgram}
              onChange={(e) => setEditProgram(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-[13px]"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <div className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Department</div>
            <input
              value={editDept}
              onChange={(e) => setEditDept(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-[13px]"
            />
          </div>

          <div className="space-y-2">
            <div className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Semester</div>
            <input
              type="number"
              value={editSem}
              onChange={(e) => setEditSem(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-[13px]"
            />
          </div>

          <div className="space-y-2">
            <div className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Year</div>
            <input
              value={editYear}
              onChange={(e) => setEditYear(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-[13px]"
            />
          </div>

          <div className="space-y-2">
            <div className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">CGPA</div>
            <input
              type="number"
              step="0.01"
              value={editCgpa}
              onChange={(e) => setEditCgpa(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-[13px]"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditOpen(false)}
            className="rounded-xl px-4 py-2 text-[13px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saveEditProfile}
            className="rounded-xl px-4 py-2 text-[13px] font-semibold bg-sky-600 hover:bg-sky-700 text-white transition"
          >
            Save
          </button>
        </div>
      </Modal>

      {/* Add Record Modal */}
      <Modal
        open={addOpen}
        title="Add Record (Demo)"
        onClose={() => {
          setAddOpen(false);
          resetAddForm();
        }}
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Type</div>
            <select
              value={rType}
              onChange={(e) => setRType(e.target.value as RecordType)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-[13px]"
            >
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Dated On</div>
            <input
              value={rDate}
              onChange={(e) => setRDate(e.target.value)}
              placeholder="dd/mm/yyyy"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-[13px]"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <div className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Details</div>
            <textarea
              value={rDetails}
              onChange={(e) => setRDetails(e.target.value)}
              className="w-full min-h-[110px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-[13px]"
              placeholder="Enter details..."
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <div className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
              Upload File (optional)
            </div>
            <label className="inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-[13px] font-semibold text-slate-800 dark:text-slate-100 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition">
              <ImageIcon size={16} className="opacity-80" />
              Choose File
              <input
                type="file"
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0] || null)}
              />
            </label>
            <div className="text-[12px] text-slate-600 dark:text-slate-300">{rFile ? rFile.name : "No file chosen"}</div>
            <div className="text-[12px] text-rose-500">Note: Upload only pdf,jpg,jpeg,png file (demo)</div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setAddOpen(false);
              resetAddForm();
            }}
            className="rounded-xl px-4 py-2 text-[13px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={addRecord}
            className="rounded-xl px-4 py-2 text-[13px] font-semibold bg-sky-600 hover:bg-sky-700 text-white transition"
          >
            Add
          </button>
        </div>
      </Modal>

      {/* View File Modal */}
      <Modal
        open={viewOpen}
        title="View File (Demo)"
        onClose={() => {
          setViewOpen(false);
          setViewing(null);
        }}
      >
        {!viewing?.fileDataUrl ? (
          <div className="text-[13px] text-slate-600 dark:text-slate-300">No file available.</div>
        ) : (
          <div className="space-y-3">
            <div className="text-[13px] text-slate-700 dark:text-slate-200">
              <span className="font-semibold">File:</span> {viewing.fileName || "Attachment"}
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
              {viewing.fileDataUrl.startsWith("data:application/pdf") ? (
                <iframe title="pdf" src={viewing.fileDataUrl} className="w-full h-[520px]" />
              ) : (
                <img
                  alt="attachment"
                  src={viewing.fileDataUrl}
                  className="w-full max-h-[520px] object-contain bg-white"
                />
              )}
            </div>
          </div>
        )}
      </Modal>


    </div>
  );
}
