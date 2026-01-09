// src/layouts/teacher/classroom/ClassroomStatus.tsx
import React, { useState, useEffect, useMemo } from "react";
import { RefreshCwIcon } from "lucide-react";

type RequestStatus = "Pending" | "Approved" | "Rejected" | "Allocated";

type ClassroomRequest = {
  id: string;
  courseId: string;
  courseLabel: string;
  classroomId: string;
  classroomLabel: string;
  requestDate: string;
  startTime: string;
  endTime: string;
  expectedStudents: number;
  reason: string;
  status: RequestStatus;
  allocatedDate?: string;
  remarks?: string;
};

function StatusPill({ status }: { status: RequestStatus }) {
  const cls =
    status === "Approved" || status === "Allocated"
      ? "bg-emerald-600"
      : status === "Rejected"
      ? "bg-rose-600"
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

export default function ClassroomStatus() {
  const [requests, setRequests] = useState<ClassroomRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch("/api/teacher/room-requests", { headers });
      if (res.ok) {
        const json = await res.json();
        setRequests((json.requests || []).map((r: any) => ({
          id: String(r.id),
          courseId: r.course_id || r.courseId,
          courseLabel: r.course_label || r.courseLabel,
          classroomId: r.classroom_id || r.classroomId,
          classroomLabel: r.classroom_label || r.classroomLabel,
          requestDate: r.request_date || r.requestDate,
          startTime: r.start_time || r.startTime,
          endTime: r.end_time || r.endTime,
          expectedStudents: r.expected_students || r.expectedStudents,
          reason: r.reason,
          status: (r.status.charAt(0).toUpperCase() + r.status.slice(1).toLowerCase()) as RequestStatus,
          allocatedDate: r.created_at || r.updated_at,
          remarks: r.remarks,
        })));
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error("Failed to fetch requests:", err);
      setRequests([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchRequests();
      setLoading(false);
    };
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Classroom Request Status
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
                <Th>Course</Th>
                <Th>Classroom</Th>
                <Th>Date</Th>
                <Th>Time</Th>
                <Th>Students</Th>
                <Th>Reason</Th>
                <Th>Status</Th>
                <Th>Allocated Date</Th>
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
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-[13px] text-slate-600 dark:text-slate-300">
                    No requests found.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-slate-200/70 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <Td>{r.courseLabel}</Td>
                    <Td>{r.classroomLabel}</Td>
                    <Td>{new Date(r.requestDate).toLocaleDateString()}</Td>
                    <Td>{r.startTime} - {r.endTime}</Td>
                    <Td>{r.expectedStudents}</Td>
                    <Td className="max-w-[200px] truncate">
                      {r.reason}
                    </Td>
                    <Td>
                      <StatusPill status={r.status} />
                    </Td>
                    <Td>{r.allocatedDate ? new Date(r.allocatedDate).toLocaleDateString() : "-"}</Td>
                    <Td className="max-w-[200px] truncate">
                      {r.remarks || "-"}
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