// src/layouts/teacher/classroom/ExamInvigilation.tsx
import React, { useState, useEffect, useMemo } from "react";
import { RefreshCwIcon } from "lucide-react";

type InvigilationStatus = "Assigned" | "Completed" | "Pending";

type ExamInvigilation = {
  id: string;
  examName: string;
  subjectCode: string;
  classroomId: string;
  classroomLabel: string;
  examDate: string;
  startTime: string;
  endTime: string;
  expectedStudents: number;
  invigilatorName: string;
  status: InvigilationStatus;
  remarks?: string;
};

function StatusPill({ status }: { status: InvigilationStatus }) {
  const cls =
    status === "Completed"
      ? "bg-emerald-600"
      : status === "Assigned"
      ? "bg-blue-600"
      : "bg-amber-500";
  return (
    <span className={`inline-flex rounded-sm px-2.5 py-1 text-[12px] font-semibold text-white ${cls}`}>
      {status}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2.5 text-left text-[13px] font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-3 py-3 text-[13px] text-slate-700 dark:text-slate-200 ${className}`}>
      {children}
    </td>
  );
}

export default function ExamInvigilation() {
  const [assignments, setAssignments] = useState<ExamInvigilation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch("/api/teacher/exam-invigilations", { headers });
      if (res.ok) {
        const json = await res.json();
        setAssignments(json.assignments || []);
      } else {
        setAssignments([]);
      }
    } catch (err) {
      console.error("Failed to fetch assignments:", err);
      setAssignments([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchAssignments();
      setLoading(false);
    };
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAssignments();
    setRefreshing(false);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Exam Invigilation Assignments
        </h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
        >
          <RefreshCwIcon size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full border-collapse">
            <thead>
              <tr>
                <Th>Exam Name</Th>
                <Th>Subject</Th>
                <Th>Classroom</Th>
                <Th>Date</Th>
                <Th>Time</Th>
                <Th>Students</Th>
                <Th>Invigilator</Th>
                <Th>Status</Th>
                <Th>Remarks</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-[13px] text-slate-600 dark:text-slate-300">
                    Loading...
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-[13px] text-slate-600 dark:text-slate-300">
                    No assignments found.
                  </td>
                </tr>
              ) : (
                assignments.map((a) => (
                  <tr
                    key={a.id}
                    className="border-t border-slate-200/70 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <Td>{a.examName}</Td>
                    <Td>{a.subjectCode}</Td>
                    <Td>{a.classroomLabel}</Td>
                    <Td>{new Date(a.examDate).toLocaleDateString()}</Td>
                    <Td>{a.startTime} - {a.endTime}</Td>
                    <Td>{a.expectedStudents}</Td>
                    <Td>{a.invigilatorName}</Td>
                    <Td>
                      <StatusPill status={a.status} />
                    </Td>
                    <Td className="max-w-[200px] truncate">
                      {a.remarks || "-"}
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}