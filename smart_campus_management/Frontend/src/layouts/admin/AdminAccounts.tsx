import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "../../components/Toast";

type Role = "STUDENT" | "TEACHER";

type AccountRow = {
  id: string;
  role: Role;
  fullName: string;
  email: string;
  regNo?: string;   // registration number for both students and teachers
  empId?: string;   // alias for regNo (for backward compatibility)
  department?: string;
  createdAt: string; // dd/mm/yyyy
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost/smart_campus_api";
const ADMIN_API = `${API_BASE}/api/admin`;

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("authToken");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function clsx(...p: Array<string | false | null | undefined>) {
  return p.filter(Boolean).join(" ");
}

function ddmmyyyy(d = new Date()) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function randomPassword(len = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function fetchAccounts(): Promise<AccountRow[]> {
  const res = await fetch(`${ADMIN_API}/accounts`, { headers: getAuthHeaders() });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || res.statusText);
  }
  const data = (await res.json()) as { accounts?: AccountRow[] };
  return Array.isArray(data.accounts) ? data.accounts : [];
}

export default function AdminAccounts() {
  const { showToast } = useToast();

  const [tab, setTab] = useState<"create" | "view">("create");

  const [rows, setRows] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);

  // form
  const [role, setRole] = useState<Role>("STUDENT");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [regNo, setRegNo] = useState(""); // Used for both students and teachers
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [sendCredentials, setSendCredentials] = useState(true);

  // Additional fields for students
  const [program, setProgram] = useState("");

  // Additional fields for teachers and students
  const [dob, setDob] = useState("");
  const [mobile, setMobile] = useState("");

  // Additional fields for teachers
  const [speciality, setSpeciality] = useState("");
  const [ugUniversity, setUgUniversity] = useState("");
  const [pgUniversity, setPgUniversity] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [designation, setDesignation] = useState("");
  const [ugYear, setUgYear] = useState("");
  const [pgYear, setPgYear] = useState("");

  // view
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => {
      const blob = `${r.role} ${r.fullName} ${r.email} ${r.regNo ?? ""} ${r.department ?? ""} ${r.createdAt}`.toLowerCase();
      return blob.includes(s);
    });
  }, [q, rows]);

  const clear = () => {
    setFullName("");
    setEmail("");
    setRegNo("");
    setDepartment("");
    setPassword("");
    setSendCredentials(true);
    setProgram("");
    setDob("");
    setMobile("");
    setSpeciality("");
    setUgUniversity("");
    setPgUniversity("");
    setAppointmentDate("");
    setDesignation("");
    setUgYear("");
    setPgYear("");
  };

  const createAccount = async () => {
    const name = fullName.trim();
    const mail = email.trim().toLowerCase();

    if (!name) return showToast("error", "Validation Error", "Please enter full name.");
    if (!mail || !isEmail(mail)) return showToast("error", "Validation Error", "Please enter a valid email.");
    if (!password || password.trim().length < 6)
      return showToast("error", "Validation Error", "Password must be at least 6 characters.");

    if (!regNo.trim())
      return showToast("error", "Validation Error", `Please enter ${role === "STUDENT" ? "Student" : "Teacher"} Registration Number.`);

    const exists = rows.some((r) => r.email.toLowerCase() === mail);
    if (exists) return showToast("error", "Validation Error", "This email already exists.");

    try {
      const res = await fetch(`${ADMIN_API}/accounts`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          role,
          fullName: name,
          email: mail,
          password,
          regNo: regNo.trim(), // Used for both students and teachers
          department: department.trim() || undefined,
          // Additional fields
          program: program.trim() || undefined,
          dob: dob || undefined,
          mobile: mobile.trim() || undefined,
          // Faculty specific fields
          speciality: speciality.trim() || undefined,
          ugUniversity: ugUniversity.trim() || undefined,
          pgUniversity: pgUniversity.trim() || undefined,
          appointmentDate: appointmentDate || undefined,
          designation: designation.trim() || undefined,
          ugYear: ugYear.trim() || undefined,
          pgYear: pgYear.trim() || undefined,
          sendCredentials,
        }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        return showToast("error", "Account Creation Failed", txt || "Failed to create account.");
      }
      const out = (await res.json()) as { account?: AccountRow };
      if (out.account) setRows((prev) => [out.account as AccountRow, ...prev]);
      showToast("success", "Account Created", sendCredentials ? "Account created. Credentials queued." : "Account created.");
    } catch (e: any) {
      showToast("error", "Account Creation Failed", `Failed to create account: ${String(e?.message || e)}`);
      return;
    }

    clear();
    setTab("view");
  };

  const deleteRow = async (id: string) => {
    try {
      const res = await fetch(`${ADMIN_API}/accounts/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        return showToast("error", "Delete Failed", txt || "Failed to delete.");
      }
      setRows((prev) => prev.filter((r) => r.id !== id));
      showToast("success", "Account Deleted", "Account has been successfully deleted.");
    } catch (e: any) {
      showToast("error", "Delete Failed", `Failed to delete: ${String(e?.message || e)}`);
    }
  };

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const data = await fetchAccounts();
        if (live) setRows(data);
      } catch (e: any) {
        if (live) showToast("error", "Loading Failed", `Failed to load accounts: ${String(e?.message || e)}`);
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const exportCsv = () => {
    const header = [
      "role",
      "fullName",
      "email",
      "registrationNumber",
      "department",
      "createdAt",
    ];
    const body = rows.map((r) => [
      r.role,
      r.fullName,
      r.email,
      r.regNo ?? "",
      r.department ?? "",
      r.createdAt,
    ]);

    const csv =
      header.join(",") +
      "\n" +
      body
        .map((line) =>
          line
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `accounts_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Accounts
          </h1>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Create Student and Teacher accounts.
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="h-10 px-4 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 shadow-sm
                       dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
        {/* tabs */}
        <div className="px-4 sm:px-6 pt-4">
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setTab("create")}
              className={clsx(
                "h-10 px-4 text-sm font-semibold transition",
                tab === "create"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              Create Account
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
              View Accounts
            </button>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-5">
          {tab === "create" ? (
            <div className="max-w-4xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Role */}
                <div className="lg:col-span-12">
                  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Account Type
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setRole("STUDENT")}
                        className={clsx(
                          "h-10 px-4 rounded-xl text-sm font-semibold border shadow-sm transition",
                          role === "STUDENT"
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"
                        )}
                      >
                        Student
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("TEACHER")}
                        className={clsx(
                          "h-10 px-4 rounded-xl text-sm font-semibold border shadow-sm transition",
                          role === "TEACHER"
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"
                        )}
                      >
                        Teacher
                      </button>
                    </div>
                  </div>
                </div>

                {/* Full name */}
                <div className="lg:col-span-12">
                  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Full Name
                    </div>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                      placeholder="Enter full name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="lg:col-span-12">
                  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Email
                    </div>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                      placeholder="name@college.edu"
                    />
                  </div>
                </div>

                {/* Registration Number */}
                <div className="lg:col-span-12">
                  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Registration Number
                    </div>
                    <input
                      value={regNo}
                      onChange={(e) => setRegNo(e.target.value)}
                      className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                      placeholder={role === "STUDENT" ? "e.g., 192211661" : "e.g., ssetsec123"}
                    />
                  </div>
                </div>

                {/* Department */}
                <div className="lg:col-span-12">
                  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Department
                    </div>
                    <input
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                      placeholder="e.g., CSE / ECE / MBA"
                    />
                  </div>
                </div>

                {role === "STUDENT" && (
                  <>
                    {/* Program */}
                    <div className="lg:col-span-6">
                      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Program
                        </div>
                        <input
                          value={program}
                          onChange={(e) => setProgram(e.target.value)}
                          className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                          placeholder="e.g., B.Tech / M.Tech"
                        />
                      </div>
                    </div>
                  </>
                )}

                {role === "TEACHER" && (
                  <>
                    {/* Speciality */}
                    <div className="lg:col-span-6">
                      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Speciality
                        </div>
                        <input
                          value={speciality}
                          onChange={(e) => setSpeciality(e.target.value)}
                          className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                          placeholder="e.g., Computer Science"
                        />
                      </div>
                    </div>

                    {/* UG University */}
                    <div className="lg:col-span-6">
                      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          UG University
                        </div>
                        <input
                          value={ugUniversity}
                          onChange={(e) => setUgUniversity(e.target.value)}
                          className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                          placeholder="e.g., University of Example"
                        />
                      </div>
                    </div>

                    {/* PG University */}
                    <div className="lg:col-span-6">
                      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          PG University
                        </div>
                        <input
                          value={pgUniversity}
                          onChange={(e) => setPgUniversity(e.target.value)}
                          className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                          placeholder="e.g., University of Example"
                        />
                      </div>
                    </div>

                    {/* Appointment Date */}
                    <div className="lg:col-span-6">
                      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Appointment Date
                        </div>
                        <input
                          type="date"
                          value={appointmentDate}
                          onChange={(e) => setAppointmentDate(e.target.value)}
                          className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                        />
                      </div>
                    </div>

                    {/* Designation */}
                    <div className="lg:col-span-6">
                      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Designation
                        </div>
                        <input
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                          placeholder="e.g., Assistant Professor"
                        />
                      </div>
                    </div>

                    {/* UG Year */}
                    <div className="lg:col-span-6">
                      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          UG Year
                        </div>
                        <input
                          value={ugYear}
                          onChange={(e) => setUgYear(e.target.value)}
                          className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                          placeholder="e.g., 2010"
                        />
                      </div>
                    </div>

                    {/* PG Year */}
                    <div className="lg:col-span-6">
                      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          PG Year
                        </div>
                        <input
                          value={pgYear}
                          onChange={(e) => setPgYear(e.target.value)}
                          className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                          placeholder="e.g., 2012"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* DOB */}
                <div className="lg:col-span-6">
                  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Date of Birth
                    </div>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                    />
                  </div>
                </div>

                {/* Mobile */}
                <div className="lg:col-span-6">
                  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Mobile
                    </div>
                    <input
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/[^\d]/g, ""))}
                      className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                      placeholder="10-digit number"
                      inputMode="tel"
                      maxLength={10}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="lg:col-span-12">
                  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-start gap-2">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 pt-2">
                      Password
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-10 flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                          placeholder="Minimum 6 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setPassword(randomPassword(10))}
                          className="h-10 px-4 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 shadow-sm
                                     dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          Auto-generate
                        </button>
                      </div>

                      <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={sendCredentials}
                          onChange={(e) => setSendCredentials(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
                        />
                        Send credentials to email
                      </label>

                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="lg:col-span-12 pt-2">
                  <div className="sm:pl-[180px] flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={createAccount}
                      className="h-10 px-4 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 active:scale-[0.99] transition shadow-sm"
                    >
                      Create Account
                    </button>
                    <button
                      type="button"
                      onClick={clear}
                      className="h-10 px-4 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 active:scale-[0.99]
                                 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // VIEW
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Accounts List
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {loading ? "Loading accounts..." : "Accounts loaded from backend."}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    Search:
                  </div>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Name / email / registration number..."
                    className="h-10 w-full sm:w-[320px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                  />
                </div>
              </div>

              <div className="mt-4 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/40">
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[120px]">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[220px]">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[260px]">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[160px]">
                        Registration Number
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[180px]">
                        Department
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px]">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[120px]">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center">
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            No accounts found
                          </div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Create accounts from the Create tab.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition"
                        >
                          <td className="px-4 py-3">
                            <span
                              className={clsx(
                                "text-xs px-2 py-1 rounded-lg border",
                                r.role === "STUDENT"
                                  ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
                                  : "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                              )}
                            >
                              {r.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-900 dark:text-slate-50">
                            {r.fullName}
                          </td>
                          <td className="px-4 py-3 text-slate-800 dark:text-slate-100">
                            {r.email}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">
                            {r.regNo ?? r.empId ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                            {r.department ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200 tabular-nums">
                            {r.createdAt}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => deleteRow(r.id)}
                              className="h-8 px-3 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50
                                         dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition shadow-sm active:scale-[0.99]"
                            >
                              Delete
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
                of <span className="font-semibold">{rows.length}</span> account(s).
              </div>
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
