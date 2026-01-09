import React, { useEffect, useState } from "react";
import { StudentPageShell } from "./StudentPageShell";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost/smart_campus_api";
const STUDENT_API = `${API_BASE}/api/student`;

type Summary = {
  attendancePct: number;
  internalMarksPct: number;
  noDueClear: boolean;
  offerStatus: string;
};

export function StudentHome() {
  const [summary, setSummary] = useState<Summary>(() => {
    const stored = localStorage.getItem("studentSummary");
    return stored ? JSON.parse(stored) : {
      attendancePct: 85,
      internalMarksPct: 88,
      noDueClear: true,
      offerStatus: "1 offer pending",
    };
  });

  // Commented to show dummy data
  // useEffect(() => {
  //   const token = localStorage.getItem("authToken");
  //   const headers = token ? { Authorization: `Bearer ${token}` } : {};
  //   fetch(`${STUDENT_API}/summary`, { headers })
  //     .then((r) => (r.ok ? r.json() : null))
  //     .then((json) => {
  //       if (json) setSummary(json as Summary);
  //     })
  //     .catch(() => {});
  // }, []);

  useEffect(() => {
    localStorage.setItem("studentSummary", JSON.stringify(summary));
  }, [summary]);

  return (
    <StudentPageShell
      title="Home"
      subtitle="Student portal overview with key metrics and quick access."
      crumbs={[{ label: "Student" }, { label: "Home" }]}
    >
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900">
          <div className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Quick Status
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 dark:text-slate-300">Overall Attendance</span>
              <span className={`text-sm font-semibold ${summary.attendancePct >= 75 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {summary.attendancePct}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 dark:text-slate-300">Internal Marks Average</span>
              <span className={`text-sm font-semibold ${summary.internalMarksPct >= 75 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {summary.internalMarksPct}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 dark:text-slate-300">No Due Status</span>
              <span className={`text-sm font-semibold ${summary.noDueClear ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {summary.noDueClear ? 'Clear' : 'Pending'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 dark:text-slate-300">Placement Offers</span>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {summary.offerStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900">
          <div className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Quick Actions
          </div>
          <div className="space-y-3">
            <button
              className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              onClick={() => alert('Navigate to Attendance Report')}
            >
              <div className="text-sm font-medium text-slate-900 dark:text-white">View Attendance Report</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Check your attendance across courses</div>
            </button>
            <button
              className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              onClick={() => alert('Navigate to Internal Marks')}
            >
              <div className="text-sm font-medium text-slate-900 dark:text-white">Check Internal Marks</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">View your assessment scores</div>
            </button>
            <button
              className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              onClick={() => alert('Navigate to Fee Payment')}
            >
              <div className="text-sm font-medium text-slate-900 dark:text-white">Pay Fees Online</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Secure online payment portal</div>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900">
        <div className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Recent Activity
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">Attendance Marked</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">CS101 - Introduction to Computer Science</div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">2 hours ago</div>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">Fee Payment Received</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Tuition Fee - Semester 1</div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">1 day ago</div>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">Assignment Submitted</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Data Structures - Assignment 3</div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">3 days ago</div>
          </div>
        </div>
      </div>
    </StudentPageShell>
  );
}
