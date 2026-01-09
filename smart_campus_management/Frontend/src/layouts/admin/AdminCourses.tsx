import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2Icon,
  XCircleIcon,
  Clock3Icon,
  SearchIcon,
  CheckIcon,
  XIcon,
  BookOpenIcon,
  UsersIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ShieldXIcon,
  AlertCircleIcon,
} from "lucide-react";
import toast from "react-hot-toast";

type CourseRow = {
  id: string;
  code: string;
  title: string;
  faculty: string;
  slot: string;
  seats: number;
  approval_status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost/smart_campus_api";
const ADMIN_API = `${API_BASE}/api/admin`;

function getAuthHeaders() {
  const token = localStorage.getItem("authToken");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function clsx(...p: Array<string | false | null | undefined>) {
  return p.filter(Boolean).join(" ");
}

async function fetchCourses(): Promise<CourseRow[]> {
  const res = await fetch(`${ADMIN_API}/courses/pending`, { headers: getAuthHeaders() });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || res.statusText);
  }
  const data = (await res.json()) as { courses?: CourseRow[] };
  return Array.isArray(data.courses) ? data.courses : [];
}

export default function AdminCourses() {
  const [rows, setRows] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvedToday, setApprovedToday] = useState(() => {
    const saved = localStorage.getItem('approvedToday');
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('approvedTodayDate');
    if (savedDate === today) {
      return parseInt(saved) || 0;
    }
    return 0;
  });

  const [q, setQ] = useState("");



  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => {
      const blob = `${r.code} ${r.title} ${r.faculty} ${r.slot} ${r.approval_status}`.toLowerCase();
      return blob.includes(s);
    });
  }, [q, rows]);

  const approveCourse = async (id: string) => {
    try {
      const res = await fetch(`${ADMIN_API}/courses/${encodeURIComponent(id)}/approve`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        return toast.error(txt || "Failed to approve.");
      }
      setRows((prev) => prev.filter((r) => r.id !== id));
      setApprovedToday((prev) => {
        const newCount = prev + 1;
        localStorage.setItem('approvedToday', newCount.toString());
        localStorage.setItem('approvedTodayDate', new Date().toDateString());
        return newCount;
      });
      toast.success("Course approved.");
    } catch (e: any) {
      toast.error(`Failed to approve: ${String(e?.message || e)}`);
    }
  };

  const rejectCourse = async (id: string) => {
    try {
      const res = await fetch(`${ADMIN_API}/courses/${encodeURIComponent(id)}/reject`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        return toast.error(txt || "Failed to reject.");
      }
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success("Course rejected.");
    } catch (e: any) {
      toast.error(`Failed to reject: ${String(e?.message || e)}`);
    }
  };

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const data = await fetchCourses();
        if (live) setRows(data);
      } catch (e: any) {
        if (live) toast.error(`Failed to load courses: ${String(e?.message || e)}`);
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Course Approvals
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-base">
          Review and approve course submissions from faculty members before they become available to students.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Courses</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{rows.length}</p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-full">
              <Clock3Icon size={24} className="text-amber-600 dark:text-amber-500" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved Today</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {approvedToday}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-full">
              <CheckCircle2Icon size={24} className="text-emerald-600 dark:text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Processed</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {filtered.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <ShieldCheckIcon size={24} className="text-blue-600 dark:text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Course Review Queue
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {loading ? "Loading courses..." : `${rows.length} courses pending approval`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <SearchIcon
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search courses..."
                  className="h-10 w-full sm:w-[280px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-10 pr-4 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Course Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Faculty
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-700">
                        <BookOpenIcon size={32} className="text-gray-400" />
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                          {loading ? "Loading courses..." : "No pending courses"}
                        </div>
                        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {loading ? "Please wait while we fetch the data." : "All courses have been processed."}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                          <BookOpenIcon size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {row.code}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {row.title}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{row.faculty}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Slot: {row.slot}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{row.seats} seats</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Available</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        row.approval_status === "APPROVED"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : row.approval_status === "REJECTED"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                      }`}>
                        {row.approval_status === "APPROVED" && <CheckCircle2Icon size={12} className="mr-1" />}
                        {row.approval_status === "REJECTED" && <XCircleIcon size={12} className="mr-1" />}
                        {row.approval_status === "PENDING" && <Clock3Icon size={12} className="mr-1" />}
                        {row.approval_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {row.approval_status !== "APPROVED" && (
                          <>
                            <button
                              onClick={() => approveCourse(row.id)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 transition-colors duration-200"
                            >
                              <CheckCircle2Icon size={14} />
                              Approve
                            </button>
                            <button
                              onClick={() => rejectCourse(row.id)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 transition-colors duration-200"
                            >
                              <XCircleIcon size={14} />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-medium">{filtered.length}</span> of{" "}
            <span className="font-medium">{rows.length}</span> courses
          </div>
        </div>
      </div>


    </div>
  );
}