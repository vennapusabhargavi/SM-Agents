import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2Icon,
  BriefcaseIcon,
  BadgeCheckIcon,
  XCircleIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  SearchIcon,
  GraduationCapIcon,
  ClipboardCheckIcon,
  CalendarDaysIcon,
  FileTextIcon,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost/smart_campus_api";
const STUDENT_API = `${API_BASE}/api/student`;

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
async function apiJson<T>(path: string, init?: RequestInit, timeoutMs = 12000): Promise<T | null> {
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
      return null;
    }
    return (await res.json()) as T;
  } catch {
    return null;
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

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type EligibilityStatus = "SHORTLISTED" | "INELIGIBLE" | "APPLIED";
type IneligibleReasonCode = "CGPA" | "BACKLOGS" | "ATTENDANCE";



type Drive = {
  id: string;
  companyName: string;
  role: string;
  packageLpa: number;
  location: string;
  driveDate: string; // dd/mm/yyyy
  criteria: {
    minCgpa: number;
    maxBacklogs: number;
    minAttendance: number;
  };
};

type StudentProfile = {
  regNo: string;
  name: string;
  program: string;
  year: string;
  cgpa: number;
  backlogs: number;
  attendance: number;
};

type Application = {
  id: string;
  driveId: string;
  appliedOn: string; // dd/mm/yyyy
  status: EligibilityStatus;
  reasons: Array<{ code: IneligibleReasonCode; message: string }>;
  agentRun?: AgentRunRef;
};

type AgentRunRef = {
  runId: string;
  ranAtIso: string;
  agent: string;
};

type TabKey = "all" | "mine";

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function Chip({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "info" | "success" | "warn" | "danger";
  children: React.ReactNode;
}) {
  const map = {
    neutral:
      "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-900/60 dark:text-slate-200 dark:ring-slate-800",
    info:
      "bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-900/40",
    success:
      "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/35 dark:text-emerald-200 dark:ring-emerald-900/40",
    warn:
      "bg-amber-50 text-amber-800 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900/40",
    danger:
      "bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-950/35 dark:text-rose-200 dark:ring-rose-900/40",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
        map[tone]
      )}
    >
      {children}
    </span>
  );
}

function Panel({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white dark:bg-slate-950 ring-1 ring-slate-200 dark:ring-slate-800 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)] overflow-hidden">
      <div className="px-4 sm:px-5 py-3 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900">
        <div className="text-white text-[13px] font-semibold tracking-wide uppercase">
          {title}
        </div>
        {right}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function SegTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold transition rounded-xl",
        active
          ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-50 dark:ring-slate-800"
          : "text-slate-600 hover:text-slate-900 hover:bg-white/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-950/50"
      )}
    >
      <span className={cn("opacity-90", active && "text-indigo-600 dark:text-indigo-300")}>
        {icon}
      </span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

function fmtDtShort(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function todayDdMmYyyy() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function evaluateEligibility(profile: StudentProfile, drive: Drive) {
  const r: Array<{ code: IneligibleReasonCode; message: string }> = [];

  if (profile.cgpa < drive.criteria.minCgpa) {
    r.push({
      code: "CGPA",
      message: `CGPA mismatch: requires ≥ ${drive.criteria.minCgpa}, yours is ${profile.cgpa.toFixed(2)}.`,
    });
  }
  if (profile.backlogs > drive.criteria.maxBacklogs) {
    r.push({
      code: "BACKLOGS",
      message: `Backlog mismatch: allows ≤ ${drive.criteria.maxBacklogs}, yours is ${profile.backlogs}.`,
    });
  }
  if (profile.attendance < drive.criteria.minAttendance) {
    r.push({
      code: "ATTENDANCE",
      message: `Attendance mismatch: requires ≥ ${drive.criteria.minAttendance}%, yours is ${profile.attendance}%.`,
    });
  }

  return r;
}

/** Try multiple endpoints without breaking UI (prod + fallback) */
async function tryFetchJson<T>(urls: string[], init?: RequestInit): Promise<T | null> {
  let lastErr: any = null;
  for (const u of urls) {
    try {
      const res = await fetch(u, init);
      if (!res.ok) continue;
      return (await res.json()) as T;
    } catch (e) {
      lastErr = e;
    }
  }
  return null;
}

export function StudentPlacementDrives() {
  // Profile from API
  const [profile, setProfile] = useState<StudentProfile>({
    regNo: "",
    name: "",
    program: "",
    year: "",
    cgpa: 0,
    backlogs: 0,
    attendance: 0,
  });

  const [drives, setDrives] = useState<Drive[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [tab, setTab] = useState<TabKey>("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [agentRunning, setAgentRunning] = useState(false);

  // Resume state
  const [resumeUrl, setResumeUrl] = useState<string>("");
  const [resumeDataUrl, setResumeDataUrl] = useState<string>("");
  const [resumeName, setResumeName] = useState<string>("");
  const [resumeMime, setResumeMime] = useState<string>("");
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeMsg, setResumeMsg] = useState<string | null>(null);
  const resumeInputRef = useRef<HTMLInputElement | null>(null);

  const driveById = useMemo(() => {
    const m = new Map<string, Drive>();
    drives.forEach((d) => m.set(d.id, d));
    return m;
  }, [drives]);



  // ✅ Load from backend, fallback to demo (no UI break)
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        // PROFILE (optional)
        const p = await tryFetchJson<any>(
          [
            `${STUDENT_API}/profile`,
            `${STUDENT_API}/me`,
            `${API_BASE}/api/profile/me`,
          ],
          { headers: getAuthHeaders() }
        );
        if (p && alive) {
          // map flexibly
          const mapped: StudentProfile = {
            regNo: String(p.regNo ?? p.reg_no ?? p.registration_no ?? profile.regNo),
            name: String(p.name ?? p.full_name ?? profile.name),
            program: String(p.program ?? p.department ?? profile.program),
            year: String(p.year ?? p.year_of_study ?? profile.year),
            cgpa: Number(p.cgpa ?? profile.cgpa),
            backlogs: Number(p.backlogs ?? p.arrears_count ?? profile.backlogs),
            attendance: Number(p.attendance ?? p.attendance_percent ?? profile.attendance),
          };
          setProfile(mapped);
        }

        // DRIVES
        const drivesRes = await tryFetchJson<any>(
          [
            `${STUDENT_API}/placements/drives`,
            `${STUDENT_API}/drives`,
            `${API_BASE}/api/placements/drives`,
          ],
          { headers: getAuthHeaders() }
        );

        if (drivesRes && alive) {
          // allow either {ok, drives:[...]} or raw array
          const drivesArr: any[] = Array.isArray(drivesRes) ? drivesRes : (drivesRes.drives ?? []);
          const mappedDrives: Drive[] = drivesArr.map((d: any) => ({
            id: String(d.id ?? d.drive_id ?? d.driveId),
            companyName: String(d.companyName ?? d.company_name ?? d.company ?? "—"),
            role: String(d.role ?? d.job_role ?? d.drive_title ?? "—"),
            packageLpa: Number(d.packageLpa ?? d.package_lpa ?? d.ctc_lpa ?? 0),
            location: String(d.location ?? d.city ?? "—"),
            driveDate: String(d.driveDate ?? d.drive_date ?? d.date ?? "—"),
            criteria: {
              minCgpa: Number(d.criteria?.minCgpa ?? d.min_cgpa ?? 0),
              maxBacklogs: Number(d.criteria?.maxBacklogs ?? d.max_arrears ?? 0),
              minAttendance: Number(d.criteria?.minAttendance ?? d.min_attendance ?? 0),
            },
          }));

          if (mappedDrives.length) setDrives(mappedDrives);
        }

        // APPLICATIONS
        const appsRes = await tryFetchJson<any>(
          [
            `${STUDENT_API}/placements/applications`,
            `${STUDENT_API}/applications`,
            `${API_BASE}/api/placements/my-applications`,
          ],
          { headers: getAuthHeaders() }
        );

        if (appsRes && alive) {
          const appsArr: any[] = Array.isArray(appsRes) ? appsRes : (appsRes.applications ?? []);
          const mappedApps: Application[] = appsArr.map((a: any, i: number) => ({
            id: String(a.id ?? a.application_id ?? `APP-${String(i + 1).padStart(4, "0")}`),
            driveId: String(a.driveId ?? a.drive_id ?? a.drive ?? a.driveId),
            appliedOn: String(a.appliedOn ?? a.applied_on ?? a.created_at ?? todayDdMmYyyy()),
            status: String(a.status ?? a.application_status ?? "APPLIED") as EligibilityStatus,
            reasons: Array.isArray(a.reasons)
              ? a.reasons.map((r: any) => ({
                  code: String(r.code ?? r.reason_code ?? "CGPA") as IneligibleReasonCode,
                  message: String(r.message ?? r.reason ?? ""),
                }))
              : [],
          }));

          setApps(mappedApps);
        }
      } catch {
        // API failed, no data
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const filteredAllDrives = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return drives;
    return drives.filter((d) => {
      return (
        d.id.toLowerCase().includes(needle) ||
        d.companyName.toLowerCase().includes(needle) ||
        d.role.toLowerCase().includes(needle) ||
        d.location.toLowerCase().includes(needle) ||
        d.driveDate.toLowerCase().includes(needle)
      );
    });
  }, [drives, q]);

  const filteredMyApps = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const rows = apps.map((a) => ({ a, d: driveById.get(a.driveId)! })).filter((x) => x.d);
    if (!needle) return rows;
    return rows.filter(({ a, d }) => {
      return (
        a.id.toLowerCase().includes(needle) ||
        d.companyName.toLowerCase().includes(needle) ||
        d.role.toLowerCase().includes(needle) ||
        a.status.toLowerCase().includes(needle) ||
        a.reasons.some((r) => r.message.toLowerCase().includes(needle))
      );
    });
  }, [apps, driveById, q]);

  const statusChip = (s: EligibilityStatus) => {
    if (s === "SHORTLISTED") return <Chip tone="success">SHORTLISTED</Chip>;
    if (s === "INELIGIBLE") return <Chip tone="danger">INELIGIBLE</Chip>;
    return <Chip tone="info">APPLIED</Chip>;
  };

  // ✅ Real “Refresh Agent Status”: tries backend, then refetch; fallback to local compute
  const refreshPlacementAgent = async () => {
    setAgentRunning(true);
    try {
      // Try to trigger agent run (if endpoint exists)
      try {
        await tryFetchJson<any>(
          [
            `${STUDENT_API}/placements/agent/refresh`,
            `${STUDENT_API}/placements/agent/run`,
            `${API_BASE}/api/placements/agent/run`,
          ],
          { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({}) }
        );
      } catch {
        // ignore if no endpoint; fallback below
      }

      // Re-fetch applications (preferred)
      try {
        const appsRes = await tryFetchJson<any>(
          [
            `${STUDENT_API}/placements/applications`,
            `${STUDENT_API}/applications`,
            `${API_BASE}/api/placements/my-applications`,
          ],
          { headers: getAuthHeaders() }
        );
        const appsArr: any[] = Array.isArray(appsRes) ? appsRes : (appsRes.applications ?? []);
        const mappedApps: Application[] = appsArr.map((a: any, i: number) => ({
          id: String(a.id ?? a.application_id ?? `APP-${String(i + 1).padStart(4, "0")}`),
          driveId: String(a.driveId ?? a.drive_id ?? a.drive ?? a.driveId),
          appliedOn: String(a.appliedOn ?? a.applied_on ?? a.created_at ?? todayDdMmYyyy()),
          status: String(a.status ?? a.application_status ?? "APPLIED") as EligibilityStatus,
          reasons: Array.isArray(a.reasons)
            ? a.reasons.map((r: any) => ({
                code: String(r.code ?? r.reason_code ?? "CGPA") as IneligibleReasonCode,
                message: String(r.message ?? r.reason ?? ""),
              }))
            : [],
          agentRun: a.agentRun
            ? {
                runId: String(a.agentRun.runId ?? a.agentRun.run_id),
                ranAtIso: String(a.agentRun.ranAtIso ?? a.agentRun.ran_at ?? new Date().toISOString()),
                agent: "PlacementAgent",
              }
            : a.run_id
            ? {
                runId: String(a.run_id),
                ranAtIso: String(a.ran_at ?? new Date().toISOString()),
                agent: "PlacementAgent",
              }
            : undefined,
        }));
        setApps(mappedApps);
        return;
      } catch {
        // fallback local compute
      }

      // Fallback: compute locally (keeps UI working)
      const run: AgentRunRef = {
        runId: `RUN-PLA-${String(Date.now()).slice(-4)}`,
        ranAtIso: new Date().toISOString(),
        agent: "PlacementAgent",
      };

      setApps((prev) =>
        prev.map((a) => {
          const drive = driveById.get(a.driveId);
          if (!drive) return a;
          const reasons = evaluateEligibility(profile, drive);
          const status: EligibilityStatus = reasons.length === 0 ? "SHORTLISTED" : "INELIGIBLE";
          return { ...a, status, reasons, agentRun: run };
        })
      );
    } finally {
      setAgentRunning(false);
    }
  };

  // ✅ NEW: Resume upload handlers (API-first, demo fallback)
  function showResumeMsg(m: string) {
    setResumeMsg(m);
    window.setTimeout(() => setResumeMsg(null), 2400);
  }

  function validateResumeFile(f: File): string | null {
    const maxMB = 5;
    const ok =
      f.type === "application/pdf" ||
      f.type === "application/msword" ||
      f.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      /\.pdf$|\.docx?$/.test(f.name.toLowerCase());

    if (!ok) return "Upload only PDF/DOC/DOCX.";
    if (f.size > maxMB * 1024 * 1024) return `File too large. Max ${maxMB}MB.`;
    return null;
  }

  async function tryUploadResumeApi(file: File) {
    // tries common backend endpoint names (if any exists, it'll work)
    const attempts = [
      { path: "/api/student/profile/resume/upload", field: "resume" },
      { path: "/api/student/profile/resume", field: "resume" },
      { path: "/api/student/profile/upload_resume", field: "resume" },
      { path: "/api/student/profile/resume_upload", field: "file" },
      { path: "/api/student/profile/resume_upload", field: "resume" },
    ];

    let lastErr: any = null;

    for (const a of attempts) {
      try {
        const fd = new FormData();
        fd.append(a.field, file);
        // optionally pass regNo if backend needs it (safe extra)
        fd.append("regNo", profile.regNo);

        const out = await apiUpload<any>(a.path, fd);
        // accept common shapes
        const url =
          out?.resume_url ||
          out?.resumeUrl ||
          out?.url ||
          out?.data?.resume_url ||
          out?.data?.url ||
          "";

        if (url && typeof url === "string") {
          setResumeUrl(url);
          setResumeDataUrl("");
          setResumeName(file.name);
          setResumeMime(file.type || "");
          showResumeMsg("Resume uploaded.");
          return true;
        }
      } catch (e) {
        lastErr = e;
      }
    }

    throw lastErr ?? new Error("No upload endpoint matched");
  }

  async function onResumePicked(file: File | null) {
    if (!file) return;
    const err = validateResumeFile(file);
    if (err) return showResumeMsg(err);

    setResumeUploading(true);
    try {
      await tryUploadResumeApi(file);
    } catch {
      showResumeMsg("Upload failed. No API endpoint available.");
    } finally {
      setResumeUploading(false);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
    }
  }

  function openResume() {
    if (resumeUrl) {
      window.open(resumeUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (resumeDataUrl) {
      // open dataurl in new tab
      const w = window.open();
      if (!w) return showResumeMsg("Popup blocked. Allow popups to view resume.");
      w.document.write(
        `<iframe src="${resumeDataUrl}" style="border:0;width:100%;height:100vh;"></iframe>`
      );
      w.document.close();
      return;
    }
    showResumeMsg("No resume uploaded yet.");
  }

  async function removeResume() {
    try {
      await apiJson<any>("/api/student/profile/resume", { method: "DELETE" });
    } catch {
      // ignore
    }
    setResumeUrl("");
    setResumeDataUrl("");
    setResumeName("");
    setResumeMime("");
    showResumeMsg("Resume removed.");
  }

  const hasResume = Boolean(resumeUrl || resumeDataUrl);

  const kpi = useMemo(() => {
    const shortlisted = apps.filter((a) => a.status === "SHORTLISTED").length;
    const ineligible = apps.filter((a) => a.status === "INELIGIBLE").length;
    return { total: apps.length, shortlisted, ineligible };
  }, [apps]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl bg-white dark:bg-slate-950 ring-1 ring-slate-200 dark:ring-slate-800 shadow-[0_18px_60px_-45px_rgba(15,23,42,0.45)]">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Placement Drives
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Shortlisting and eligibility is processed automatically.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl ring-1 ring-slate-200 dark:ring-slate-800 bg-slate-50 dark:bg-slate-900/35">
                <GraduationCapIcon size={16} className="text-slate-600 dark:text-slate-300" />
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-slate-50">{profile.name}</span>{" "}
                  • {profile.regNo} • {profile.program} Y{profile.year}
                </div>
              </div>

              {/* Resume */}
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-950">
                <FileTextIcon size={16} className="text-slate-600 dark:text-slate-300" />
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-slate-50">
                    {hasResume ? "Resume Uploaded" : "No Resume"}
                  </span>
                  {resumeName && <span> • {resumeName}</span>}
                </div>
                {hasResume && (
                  <button
                    type="button"
                    onClick={openResume}
                    className="ml-2 text-[11px] font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                  >
                    View
                  </button>
                )}
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => onResumePicked(e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => resumeInputRef.current?.click()}
                  className="ml-2 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                  disabled={resumeUploading}
                >
                  {resumeUploading ? "Uploading..." : "Upload"}
                </button>
                {hasResume && (
                  <button
                    type="button"
                    onClick={removeResume}
                    className="ml-2 text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                  >
                    Remove
                  </button>
                )}
              </div>


            </div>
          </div>

          {/* Seg tabs */}
          <div className="mt-4 flex flex-wrap gap-2 rounded-2xl bg-slate-50 dark:bg-slate-900/35 ring-1 ring-slate-200 dark:ring-slate-800 p-2">
            <SegTab
              active={tab === "all"}
              icon={<BriefcaseIcon size={16} />}
              label="All Drives"
              onClick={() => setTab("all")}
            />
            <SegTab
              active={tab === "mine"}
              icon={<ClipboardCheckIcon size={16} />}
              label="My Applications"
              onClick={() => setTab("mine")}
            />
          </div>

          {/* Search + KPIs */}
          <div className="mt-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone="info">Total Applied: {kpi.total}</Chip>
              <Chip tone="success">Shortlisted: {kpi.shortlisted}</Chip>
              <Chip tone="danger">Ineligible: {kpi.ineligible}</Chip>
              {loading && <Chip tone="neutral">Loading…</Chip>}
            </div>

            <div className="relative w-full lg:w-[420px]">
              <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search company / role / status / reason…"
                className={cn(
                  "w-full h-11 rounded-xl pl-9 pr-3 text-sm",
                  "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
                  "ring-1 ring-slate-200 dark:ring-slate-800",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 dark:focus:ring-indigo-300/60",
                  "transition"
                )}
              />
            </div>
          </div>
        </div>
      </div>



      {/* All drives */}
      {tab === "all" && (
        <Panel
          title="ALL DRIVES"
          right={<div className="text-white/90 text-xs font-semibold">{filteredAllDrives.length} drive(s)</div>}
        >
          <div className="overflow-x-auto rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800">
            <div className="min-w-[1100px]">
              <table className="w-full">
                <thead>
                  <tr>
                    {["Drive", "Company / Role", "Package", "Location", "Drive Date", "Criteria"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[12px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAllDrives.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                        No drives found.
                      </td>
                    </tr>
                  ) : (
                    filteredAllDrives.map((d, idx) => (
                      <tr
                        key={d.id}
                        className={cn(
                          "transition",
                          idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/20",
                          "hover:bg-indigo-50/60 dark:hover:bg-indigo-950/25"
                        )}
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-50 border-b border-slate-200/70 dark:border-slate-800/70">
                          {d.id}
                        </td>
                        <td className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-800/70">
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5 h-8 w-8 rounded-xl bg-slate-50 dark:bg-slate-900/30 ring-1 ring-slate-200 dark:ring-slate-800 grid place-items-center">
                              <Building2Icon size={16} className="text-slate-600 dark:text-slate-300" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                {d.companyName}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{d.role}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100 border-b border-slate-200/70 dark:border-slate-800/70">
                          <Chip tone="info">{Number(d.packageLpa || 0).toFixed(1)} LPA</Chip>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100 border-b border-slate-200/70 dark:border-slate-800/70">
                          {d.location}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100 border-b border-slate-200/70 dark:border-slate-800/70">
                          {d.driveDate}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200 border-b border-slate-200/70 dark:border-slate-800/70">
                          <div className="flex flex-wrap gap-2">
                            <Chip tone="neutral">CGPA ≥ {d.criteria.minCgpa}</Chip>
                            <Chip tone="neutral">Backlogs ≤ {d.criteria.maxBacklogs}</Chip>
                            <Chip tone="neutral">Attendance ≥ {d.criteria.minAttendance}%</Chip>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Panel>
      )}

      {/* My applications */}
      {tab === "mine" && (
        <Panel
          title="MY APPLICATIONS — STATUS + REASON"
          right={<div className="text-white/90 text-xs font-semibold">{filteredMyApps.length} application(s)</div>}
        >
          <div className="overflow-x-auto rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800">
            <div className="min-w-[1280px]">
              <table className="w-full">
                <thead>
                  <tr>
                    {["Application", "Company / Role", "Applied On", "Agent Status", "Reason (if INELIGIBLE)"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-[12px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredMyApps.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                        No applications found.
                      </td>
                    </tr>
                  ) : (
                    filteredMyApps.map(({ a, d }, idx) => (
                      <tr
                        key={a.id}
                        className={cn(
                          "transition",
                          idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/20",
                          "hover:bg-indigo-50/60 dark:hover:bg-indigo-950/25"
                        )}
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-50 border-b border-slate-200/70 dark:border-slate-800/70">
                          {a.id}
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{d?.id || a.driveId}</div>
                        </td>

                        <td className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-800/70">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{d?.companyName || "—"}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{d?.role || "—"}</div>
                        </td>

                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100 border-b border-slate-200/70 dark:border-slate-800/70">
                          {a.appliedOn}
                        </td>

                        <td className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-800/70">
                          <div className="flex items-center gap-2">
                            {a.status === "SHORTLISTED" ? (
                              <BadgeCheckIcon size={18} className="text-emerald-600 dark:text-emerald-300" />
                            ) : a.status === "INELIGIBLE" ? (
                              <XCircleIcon size={18} className="text-rose-600 dark:text-rose-300" />
                            ) : (
                              <AlertTriangleIcon size={18} className="text-amber-600 dark:text-amber-300" />
                            )}
                            {statusChip(a.status)}
                          </div>
                        </td>

                        <td className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-800/70">
                          {a.status !== "INELIGIBLE" ? (
                            <span className="text-sm text-slate-400">—</span>
                          ) : (
                            <div className="space-y-1">
                              {a.reasons.map((r, i) => (
                                <div key={i} className="text-sm text-slate-800 dark:text-slate-100">
                                  <Chip tone="danger">{r.code}</Chip>{" "}
                                  <span className="text-slate-700 dark:text-slate-200">{r.message}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>


                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Panel>
      )}

      {/* ✅ NEW: small toast for resume */}
      {resumeMsg && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[90]">
          <div className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm shadow-lg">
            {resumeMsg}
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentPlacementDrives;
