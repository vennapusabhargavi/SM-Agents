// src/layouts/teacher/classroom/ClassroomAllocated.tsx
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

type AllocationType = "class" | "exam";

type CombinedAllocation = {
  type: AllocationType;
  data: ClassroomRequest | ExamInvigilation;
};

function StatusPill({ status, type }: { status: RequestStatus | InvigilationStatus; type: AllocationType }) {
  const cls =
    status === "Approved" || status === "Allocated" || status === "Assigned" || status === "Completed"
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

export default function ClassroomAllocated() {
  const [allocations, setAllocations] = useState<CombinedAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Demo classroom requests
  const demoRequests: ClassroomRequest[] = useMemo(
    () => [
      {
        id: "req1",
        courseId: "CSA1524",
        courseLabel: "CSA1524 - Cloud Computing",
        classroomId: "CR101",
        classroomLabel: "CR101 - Lecture Hall",
        requestDate: "2025-01-15",
        startTime: "10:00",
        endTime: "11:30",
        expectedStudents: 80,
        reason: "Regular lecture",
        status: "Approved",
        allocatedDate: "2025-01-10",
      },
      {
        id: "req2",
        courseId: "MMA1135",
        courseLabel: "MMA1135 - Mentor Mentee Meeting",
        classroomId: "CR102",
        classroomLabel: "CR102 - Seminar Room",
        requestDate: "2025-01-16",
        startTime: "14:00",
        endTime: "15:30",
        expectedStudents: 25,
        reason: "Meeting with students",
        status: "Pending",
      },
    ],
    []
  );

  // Demo exam invigilation - removed

  const fetchAllocations = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      // Fetch classroom requests
      const resRequests = await fetch("/api/teacher/room-requests", { headers });
      let realRequests: ClassroomRequest[] = [];
      if (resRequests.ok) {
        const data = await resRequests.json();
        realRequests = (data.requests || []).map((r: any) => ({
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
        }));
      }

      // Combine data
      const combined: CombinedAllocation[] = [
        ...realRequests.map(r => ({ type: "class" as AllocationType, data: r })),
      ];
      setAllocations(combined);
    } catch (err) {
      console.error("Failed to fetch allocations", err);
      setAllocations([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchAllocations();
      setLoading(false);
    };
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllocations();
    setRefreshing(false);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Allocated Classes & Exam Invigilation
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

      {/* Classroom Requests */}
      <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Classroom Request Status</h2>
        </div>
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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[13px] text-slate-600 dark:text-slate-300">
                    Loading...
                  </td>
                </tr>
              ) : (
                allocations.filter(a => a.type === "class").map(a => {
                  const r = a.data as ClassroomRequest;
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-slate-200/70 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <Td>{r.courseLabel}</Td>
                      <Td>{r.classroomLabel}</Td>
                      <Td>{new Date(r.requestDate).toLocaleDateString()}</Td>
                      <Td>{r.startTime} - {r.endTime}</Td>
                      <Td>{r.expectedStudents}</Td>
                      <Td className="max-w-[200px] truncate">{r.reason}</Td>
                      <Td>
                        <StatusPill status={r.status} type="class" />
                      </Td>
                      <Td>{r.allocatedDate ? new Date(r.allocatedDate).toLocaleDateString() : "-"}</Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exam Invigilation */}
      <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Exam Invigilation Assignments</h2>
        </div>
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
                <Th>Status</Th>
                <Th>Remarks</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[13px] text-slate-600 dark:text-slate-300">
                  No exam invigilation assignments.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}