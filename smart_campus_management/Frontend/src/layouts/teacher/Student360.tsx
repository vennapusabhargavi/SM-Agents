import React, { useMemo, useState } from "react";
import { useToast } from "../../components/Toast";

const cn = (...a: Array<string | false | undefined | null>) => a.filter(Boolean).join(" ");
const pad2 = (n: number) => String(n).padStart(2, "0");
const fmtDDMMYYYY = (d: Date) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost/smart_campus_api";
const TEACHER_API = `${API_BASE}/api/teacher`;

function getAuthHeaders() {
  const token = localStorage.getItem("authToken");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function fetchJson<T>(
  url: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  const timeoutMs = init?.timeoutMs ?? 12000;
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    const status = res.status;
    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    if (!res.ok) {
      return {
        ok: false,
        status,
        error: (json && (json.error || json.message)) || text || `HTTP ${status}`,
      };
    }
    return { ok: true, status, data: json as T };
  } catch (e: any) {
    return { ok: false, status: 0, error: e?.name === "AbortError" ? "Request timeout" : String(e) };
  } finally {
    window.clearTimeout(t);
  }
}

function Pill({ tone, children }: { tone: "red" | "green" | "blue" | "teal" | "amber" | "gray"; children: React.ReactNode }) {
  const map: Record<typeof tone, string> = {
    red: "bg-rose-500 text-white",
    green: "bg-emerald-600 text-white",
    blue: "bg-sky-600 text-white",
    teal: "bg-teal-500 text-white",
    amber: "bg-amber-500 text-white",
    gray: "bg-slate-500 text-white",
  };
  return <span className={cn("inline-flex items-center px-2 py-1 rounded text-xs font-semibold", map[tone])}>{children}</span>;
}

function Btn({
  children,
  tone = "primary",
  onClick,
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  tone?: "primary" | "success" | "warning" | "danger" | "muted";
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const map: Record<string, string> = {
    primary: "bg-sky-600 hover:bg-sky-700 text-white",
    success: "bg-teal-600 hover:bg-teal-700 text-white",
    warning: "bg-amber-500 hover:bg-amber-600 text-white",
    danger: "bg-rose-600 hover:bg-rose-700 text-white",
    muted: "bg-slate-200 hover:bg-slate-300 text-slate-800",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn("px-4 py-2 text-sm rounded disabled:opacity-60 disabled:cursor-not-allowed", map[tone])}
    >
      {children}
    </button>
  );
}

function Accordion({
  title,
  tone,
  defaultOpen = true,
  children,
}: {
  title: string;
  tone: "gray" | "purple" | "blue" | "red" | "teal";
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const map: Record<typeof tone, string> = {
    gray: "bg-slate-400",
    purple: "bg-[#8b7bb2]",
    blue: "bg-[#5a90bd]",
    red: "bg-[#c85a5a]",
    teal: "bg-[#40b0a6]",
  };

  return (
    <div className="border border-slate-300">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn("w-full flex items-center justify-between px-4 py-3 text-white", map[tone])}
      >
        <span className="font-semibold">{title}</span>
        <span className="text-xl leading-none">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="p-4 bg-white">{children}</div>}
    </div>
  );
}

function Donut({ value, label }: { value: number; label: string }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const pct = clamp(value, 0, 100);
  const dash = (pct / 100) * c;

  return (
    <div className="flex flex-col items-center">
      <div className="text-sm text-slate-800 mb-2">{label}</div>
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e5e7eb" strokeWidth="18" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="#dc2626"
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 60 60)"
        />
        <circle cx="60" cy="60" r="28" fill="#fff" />
        <text x="60" y="66" textAnchor="middle" fontSize="18" fontWeight="700" fill="#16a34a">
          {pct}%
        </text>
      </svg>
    </div>
  );
}

type Profile = {
  name: string;
  dob: string;
  email: string;
  regNo: string;
  program: string;
  mobile: string;
  photoUrl: string;
  recordScore: number;
};

type RecordOverview = {
  awards: number;
  conference: number;
  seminar: number;
  research: number;
  publication: number;
  sponsor: number;
};

type StudentRecordItem = {
  id: string;
  details: string;
  type: string;
  datedOn: string;
  fileName?: string;
};

type AttendanceRow = {
  id: string;
  courseCode: string;
  courseName: string;
  classAttended: number;
  attendedHours: number;
  totalClass: number;
  totalHours: number;
  percent: number;
};

type DisciplinaryRow = {
  id: string;
  issueDetails: string;
  lastActionDetails: string;
  lastActionOn: string;
  complainant: string;
  issueOn: string;
  status: string;
};

type CourseEnrollRow = {
  id: string;
  courseCode: string;
  courseName: string;
  status: string;
  enrollOn?: string;
  grade?: string;
  monthYear?: string;
};

type FeeDueRow = {
  id: string;
  feeType: string;
  amount: number;
  status: "Pay Now" | "Pending";
};

type FeePaidRow = {
  id: string;
  feeType: string;
  amount: number;
  mode: string;
  reference: string;
  datedOn: string;
};

export default function Student360() {
  const [regNoInput, setRegNoInput] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const overview: RecordOverview = useMemo(
    () => ({
      awards: 0,
      conference: 0,
      seminar: 0,
      research: 0,
      publication: 0,
      sponsor: 0,
    }),
    [profile]
  );

  const recordDetails: StudentRecordItem[] = useMemo(() => [], [profile]);

  const gradStatus = useMemo(
    () => ({
      programElective: 0,
      programCore: 0,
      universityCore: 0,
      universityElective: 0,
    }),
    [profile]
  );

  const attendanceRows: AttendanceRow[] = useMemo(() => [], [profile]);

  const disciplinaryRows: DisciplinaryRow[] = useMemo(() => [], [profile]);

  const inProgressCourses: CourseEnrollRow[] = useMemo(() => [], [profile]);

  const completedCourses: CourseEnrollRow[] = useMemo(() => [], [profile]);

  const dueList: FeeDueRow[] = useMemo(() => [], [profile]);

  const paidList: FeePaidRow[] = useMemo(() => [], [profile]);

  const onView = async () => {
    const regNo = regNoInput.trim();
    if (!regNo) {
      setError("Please enter a registration number");
      return;
    }
    setError("");
    setLoading(true);
    const r = await fetchJson<{ ok: boolean; profile?: Profile; message?: string }>(
      `${TEACHER_API}/student/profile/${encodeURIComponent(regNo)}`,
      { headers: getAuthHeaders() }
    );
    setLoading(false);
    if (r.ok && r.data?.ok && r.data.profile) {
      setProfile(r.data.profile);
      setError("");
    } else {
      setProfile(null);
      setError("Student not found");
    }
  };

  const percentTone = (p: number) => (p >= 75 ? "teal" : "amber");

  return (
    <div className="w-full bg-white">
      {/* top search row */}
      <div className="flex items-center justify-center gap-6 py-3">
        <div className="text-sm text-slate-700">Select Student</div>
        <input
          value={regNoInput}
          onChange={(e) => setRegNoInput(e.target.value)}
          className="border border-slate-400 px-3 py-2 text-sm w-[240px]"
          placeholder="Enter RegNo"
        />
        <Btn tone="primary" onClick={onView} disabled={loading}>
          {loading ? "Loading..." : "View"}
        </Btn>
      </div>

      {error && (
        <div className="text-red-600 text-sm mt-2 text-center">{error}</div>
      )}

      {profile && (
        <>
          {/* PROFILE DETAILS */}
          <Accordion title="Profile Details" tone="gray" defaultOpen>
        <div className="text-center font-semibold text-slate-800">STUDENT PROFILE</div>

        <div className="mt-6 grid grid-cols-12 gap-6 items-start">
          {/* left info */}
          <div className="col-span-12 lg:col-span-5">
            <div className="grid grid-cols-12 gap-y-3 text-sm">
              <div className="col-span-4 text-slate-700">Name</div>
              <div className="col-span-8 font-semibold">{profile.name}</div>

              <div className="col-span-4 text-slate-700">Date of Birth</div>
              <div className="col-span-8 font-semibold">{profile.dob}</div>

              <div className="col-span-4 text-slate-700">Email</div>
              <div className="col-span-8 font-semibold">{profile.email}</div>
            </div>
          </div>

          {/* middle info */}
          <div className="col-span-12 lg:col-span-4">
            <div className="grid grid-cols-12 gap-y-3 text-sm">
              <div className="col-span-4 text-slate-700">Reg No.</div>
              <div className="col-span-8 font-semibold">{profile.regNo}</div>

              <div className="col-span-4 text-slate-700">Program</div>
              <div className="col-span-8 font-semibold">{profile.program}</div>

              <div className="col-span-4 text-slate-700">Mobile No.</div>
              <div className="col-span-8 font-semibold">{profile.mobile}</div>
            </div>
          </div>

          {/* photo + record score */}
          <div className="col-span-12 lg:col-span-3 flex items-start justify-between gap-4">
            <img
              src={profile.photoUrl}
              alt="student"
              className="w-[140px] h-[95px] object-cover border border-slate-300"
            />
            <div className="w-[170px] h-[95px] border border-slate-300 bg-slate-400/60 flex items-center justify-center relative">
              <div className="text-white text-5xl font-light">{profile.recordScore}</div>
              <div className="absolute bottom-2 text-[10px] text-white/90 font-semibold">RECORD SCORE</div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center font-semibold text-slate-800">STUDENT RECORD OVERVIEW</div>

        <div className="mt-5 grid grid-cols-12 gap-5">
          <div className="col-span-12 md:col-span-4 border border-slate-300 bg-slate-400/70 text-white p-5">
            <div className="flex justify-between">
              <span>Awards</span>
              <span>{overview.awards}</span>
            </div>
            <div className="mt-3 flex justify-between">
              <span>Conference Attended</span>
              <span>{overview.conference}</span>
            </div>
          </div>

          <div className="col-span-12 md:col-span-4 border border-slate-300 bg-slate-400/70 text-white p-5">
            <div className="flex justify-between">
              <span>Seminar(attended)</span>
              <span>{overview.seminar}</span>
            </div>
            <div className="mt-3 flex justify-between">
              <span>Research Projects</span>
              <span>{overview.research}</span>
            </div>
          </div>

          <div className="col-span-12 md:col-span-4 border border-slate-300 bg-slate-400/70 text-white p-5">
            <div className="flex justify-between">
              <span>Publication</span>
              <span>{overview.publication}</span>
            </div>
            <div className="mt-3 flex justify-between">
              <span>Sponsor Project NIRF</span>
              <span>{overview.sponsor}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center font-semibold text-slate-800">STUDENT RECORD DETAILS</div>

        <div className="mt-4 overflow-auto border border-slate-200">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">SNo.</th>
                <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Details</th>
                <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Type</th>
                <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Dated On</th>
                <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Delete</th>
                <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">View File</th>
              </tr>
            </thead>
            <tbody>
              {recordDetails.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-700">
                    No data available in table
                  </td>
                </tr>
              ) : (
                recordDetails.map((r, idx) => (
                  <tr key={r.id} className="border-b border-slate-200">
                    <td className="px-3 py-3">{idx + 1}</td>
                    <td className="px-3 py-3">{r.details}</td>
                    <td className="px-3 py-3">{r.type}</td>
                    <td className="px-3 py-3">{r.datedOn}</td>
                    <td className="px-3 py-3">
                      <Btn tone="danger" onClick={() => alert("Delete (demo)")}>
                        Delete
                      </Btn>
                    </td>
                    <td className="px-3 py-3">
                      <Btn tone="muted" onClick={() => alert("Open file (demo)")}>
                        View
                      </Btn>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Accordion>

      {/* GRADUATION STATUS */}
      <div className="mt-6">
        <Accordion title="GRADUATION STATUS" tone="purple" defaultOpen>
          <div className="grid grid-cols-12 gap-8 justify-items-center">
            <div className="col-span-12 md:col-span-3">
              <Donut value={gradStatus.programElective} label="Program Elective - 0/6" />
            </div>
            <div className="col-span-12 md:col-span-3">
              <Donut value={gradStatus.programCore} label="Program Core - 0/25" />
            </div>
            <div className="col-span-12 md:col-span-3">
              <Donut value={gradStatus.universityCore} label="University Core - 0/12" />
            </div>
            <div className="col-span-12 md:col-span-3">
              <Donut value={gradStatus.universityElective} label="University Elective - 0/4" />
            </div>
          </div>
        </Accordion>
      </div>

      {/* Attendance Report */}
      <div className="mt-6">
        <Accordion title="Attendance Report" tone="blue" defaultOpen>
          <div className="overflow-auto border border-slate-200">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold whitespace-nowrap">S No.</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold whitespace-nowrap">Course Code</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold whitespace-nowrap">Course Name</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold whitespace-nowrap">Class Attended</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold whitespace-nowrap">Attended Hours</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold whitespace-nowrap">Total Class</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold whitespace-nowrap">Total Hours</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold whitespace-nowrap">%</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold whitespace-nowrap">View</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRows.map((r, idx) => (
                  <tr key={r.id} className="border-b border-slate-200">
                    <td className="px-3 py-3">{idx + 1}</td>
                    <td className="px-3 py-3">{r.courseCode}</td>
                    <td className="px-3 py-3">{r.courseName}</td>
                    <td className="px-3 py-3">{r.classAttended}</td>
                    <td className="px-3 py-3">{r.attendedHours}</td>
                    <td className="px-3 py-3">{r.totalClass}</td>
                    <td className="px-3 py-3">{r.totalHours}</td>
                    <td className="px-3 py-3">
                      <Pill tone={percentTone(r.percent)}>{r.percent} %</Pill>
                    </td>
                    <td className="px-3 py-3">
                      <Btn tone="danger" onClick={() => alert("Details (demo)")}>
                        Details
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-sm text-slate-700">Showing 1 to {attendanceRows.length} of {attendanceRows.length} entries</div>
        </Accordion>
      </div>

      {/* Disciplinary Record */}
      <div className="mt-6">
        <Accordion title="Disciplinary Record" tone="red" defaultOpen>
          <div className="overflow-auto border border-slate-200">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Sno</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Issue Details</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Last Action Details</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Last Action On</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Complainant</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Issue On</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Status</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">View</th>
                </tr>
              </thead>
              <tbody>
                {disciplinaryRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-slate-700">
                      No data available in table
                    </td>
                  </tr>
                ) : (
                  disciplinaryRows.map((r, idx) => (
                    <tr key={r.id} className="border-b border-slate-200">
                      <td className="px-3 py-3">{idx + 1}</td>
                      <td className="px-3 py-3">{r.issueDetails}</td>
                      <td className="px-3 py-3">{r.lastActionDetails}</td>
                      <td className="px-3 py-3">{r.lastActionOn}</td>
                      <td className="px-3 py-3">{r.complainant}</td>
                      <td className="px-3 py-3">{r.issueOn}</td>
                      <td className="px-3 py-3">{r.status}</td>
                      <td className="px-3 py-3">
                        <Btn tone="muted" onClick={() => alert("View (demo)")}>
                          View
                        </Btn>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Accordion>
      </div>

      {/* Course & Enroll Details */}
      <div className="mt-6">
        <Accordion title="Course & Enroll Details" tone="teal" defaultOpen>
          <div className="text-sm text-rose-500 font-semibold mb-3">⦿ INPROGRESS COURSES</div>
          <div className="overflow-auto border border-slate-200">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Course Code</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Course Name</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Status</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Enroll On</th>
                </tr>
              </thead>
              <tbody>
                {inProgressCourses.map((r) => (
                  <tr key={r.id} className="border-b border-slate-200">
                    <td className="px-3 py-3">{r.courseCode}</td>
                    <td className="px-3 py-3">{r.courseName}</td>
                    <td className="px-3 py-3">
                      <div className="w-[140px] bg-sky-200/70 text-sky-800 text-center text-xs py-1 font-semibold">
                        {r.status}
                      </div>
                    </td>
                    <td className="px-3 py-3">{r.enrollOn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 text-sm text-emerald-600 font-semibold mb-3">☆ COMPLETED COURSES</div>
          <div className="overflow-auto border border-slate-200">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Sno</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Course Code</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Course Name</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Grade</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Status</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Month&Year</th>
                </tr>
              </thead>
              <tbody>
                {completedCourses.map((r, idx) => (
                  <tr key={r.id} className="border-b border-slate-200">
                    <td className="px-3 py-3">{idx + 1}</td>
                    <td className="px-3 py-3">{r.courseCode}</td>
                    <td className="px-3 py-3">{r.courseName}</td>
                    <td className="px-3 py-3">{r.grade}</td>
                    <td className="px-3 py-3">
                      <Pill tone="teal">{r.status}</Pill>
                    </td>
                    <td className="px-3 py-3">{r.monthYear}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Accordion>
      </div>

      {/* Financial Record */}
      <div className="mt-6">
        <Accordion title="Financial Record" tone="blue" defaultOpen>
          <div className="text-sm text-rose-500 font-semibold mb-2">⦿ DUE LIST</div>
          <div className="overflow-auto border border-slate-200">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Fee Type</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Amount</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {dueList.map((d) => (
                  <tr key={d.id} className="border-b border-slate-200">
                    <td className="px-3 py-3">{d.feeType}</td>
                    <td className="px-3 py-3">{d.amount}</td>
                    <td className="px-3 py-3">
                      <Btn tone="danger" onClick={() => alert("Pay Now (demo)")}>
                        Pay Now
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 text-sm text-emerald-600 font-semibold mb-2">☆ PAID LIST</div>
          <div className="overflow-auto border border-slate-200">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Fee Type</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Amount</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Mode of Payment</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Reference</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-left font-semibold">Dated On</th>
                </tr>
              </thead>
              <tbody>
                {paidList.map((p) => (
                  <tr key={p.id} className="border-b border-slate-200">
                    <td className="px-3 py-3">{p.feeType}</td>
                    <td className="px-3 py-3">{p.amount}</td>
                    <td className="px-3 py-3">{p.mode}</td>
                    <td className="px-3 py-3">{p.reference}</td>
                    <td className="px-3 py-3">{p.datedOn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Accordion>
      </div>

      <div className="h-10" />
        </>
      )}
    </div>
  );
}
