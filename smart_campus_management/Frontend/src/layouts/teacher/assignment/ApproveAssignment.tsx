// src/layouts/teacher/assignment/ApproveAssignment.tsx
import React, { useEffect, useMemo, useState } from "react";
import { SearchIcon, CheckIcon, XIcon } from "lucide-react";

const API_BASE = "http://localhost:5000";
const TEACHER_API = `${API_BASE}/api/teacher`;

type Assignment = {
  id: string;
  title: string;
  courseCode: string;
  dueDate: string; // DD/MM/YYYY
};

type StudentRow = {
  id: string;
  regNo: string;
  name: string;
  submittedOn: string; // DD/MM/YYYY
  status: "PENDING" | "APPROVED" | "REJECTED";
  student_user_id?: string;
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950",
        "shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)]",
        "rounded-none overflow-hidden",
        className
      )}
    >
      <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800">
        <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {title}
        </div>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <SearchIcon
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-10 w-full pl-9 pr-3 text-sm rounded-none",
          "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
          "border border-slate-200 dark:border-slate-800",
          "focus:outline-none focus:ring-2 focus:ring-slate-300/70 dark:focus:ring-slate-700/70"
        )}
      />
    </div>
  );
}

function ActionBtn({
  tone,
  onClick,
  children,
}: {
  tone: "approve" | "reject";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const cls =
    tone === "approve"
      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
      : "bg-rose-600 hover:bg-rose-700 text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 px-3 text-xs font-semibold rounded-none transition",
        cls,
        "active:scale-[0.99]"
      )}
    >
      {children}
    </button>
  );
}

export default function ApproveAssignment() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [studentMap, setStudentMap] = useState<Record<string, StudentRow[]>>({});
  const [loadingStudents, setLoadingStudents] = useState<Record<string, boolean>>({});

  const [activeAssignmentId, setActiveAssignmentId] = useState<string>("");
  const [qAssign, setQAssign] = useState("");
  const [qStudent, setQStudent] = useState("");

  // Fetch assignments for the teacher's courses
  useEffect(() => {
    const fetchAssignments = async () => {
      setLoadingAssignments(true);
      try {
        const token = localStorage.getItem("authToken");
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${TEACHER_API}/assignments`, { headers });
        if (res.ok) {
          const data = await res.json();
          const assignmentList: Assignment[] = (data.assignments || []).map((a: any) => ({
            id: a.id.toString(),
            title: a.title,
            courseCode: a.course_code,
            dueDate: formatDate(a.due_date),
          }));
          setAssignments(assignmentList);

          // Set first assignment as active if available
          if (assignmentList.length > 0) {
            setActiveAssignmentId(assignmentList[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch assignments", err);
      } finally {
        setLoadingAssignments(false);
      }
    };
    fetchAssignments();
  }, []);

  // Fetch student submissions when assignment is selected
  useEffect(() => {
    if (!activeAssignmentId) return;

    const fetchStudentSubmissions = async () => {
      setLoadingStudents((prev) => ({ ...prev, [activeAssignmentId]: true }));
      try {
        const token = localStorage.getItem("authToken");
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${TEACHER_API}/assignments/${activeAssignmentId}/submissions`, { headers });
        if (res.ok) {
          const data = await res.json();
          const submissions: StudentRow[] = (data.submissions || []).map((s: any, idx: number) => ({
            id: `s-${s.student_user_id}-${idx}`,
            regNo: s.reg_no || s.regNo,
            name: s.student_name || s.name,
            submittedOn: formatDate(s.submitted_on || s.submittedOn),
            status: (s.status || "PENDING").toUpperCase() as "PENDING" | "APPROVED" | "REJECTED",
            student_user_id: s.student_user_id,
          }));

          setStudentMap((prev) => ({
            ...prev,
            [activeAssignmentId]: submissions,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch student submissions", err);
        setStudentMap((prev) => ({
          ...prev,
          [activeAssignmentId]: [],
        }));
      } finally {
        setLoadingStudents((prev) => ({ ...prev, [activeAssignmentId]: false }));
      }
    };
    fetchStudentSubmissions();
  }, [activeAssignmentId]);

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  };

  const activeAssignment = assignments.find((a) => a.id === activeAssignmentId);

  const filteredAssignments = useMemo(() => {
    const s = qAssign.trim().toLowerCase();
    if (!s) return assignments;
    return assignments.filter(
      (a) =>
        a.title.toLowerCase().includes(s) ||
        a.courseCode.toLowerCase().includes(s) ||
        a.dueDate.toLowerCase().includes(s)
    );
  }, [assignments, qAssign]);

  const students = studentMap[activeAssignmentId] ?? [];

  const filteredStudents = useMemo(() => {
    const s = qStudent.trim().toLowerCase();
    if (!s) return students;
    return students.filter(
      (r) =>
        r.regNo.toLowerCase().includes(s) ||
        r.name.toLowerCase().includes(s) ||
        r.submittedOn.toLowerCase().includes(s) ||
        r.status.toLowerCase().includes(s)
    );
  }, [students, qStudent]);

  const setStatus = async (studentId: string, status: StudentRow["status"]) => {
    try {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const payload = {
        assignment_id: activeAssignmentId,
        student_id: studentId,
        status: status.toLowerCase(),
      };

      const res = await fetch(`${TEACHER_API}/assignments/approve`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Update local state on success
        setStudentMap((prev) => {
          const list = prev[activeAssignmentId] ?? [];
          return {
            ...prev,
            [activeAssignmentId]: list.map((r) =>
              r.id === studentId ? { ...r, status } : r
            ),
          };
        });
      } else {
        console.error("Failed to update assignment status");
        // Could show a toast notification here
      }
    } catch (err) {
      console.error("Error updating assignment status:", err);
      // Could show a toast notification here
    }
  };

  return (
    <div className="w-full">
      {/* Title */}
      <div className="text-[28px] font-light text-slate-700 dark:text-slate-100 leading-none mb-4">
        Approve Assignment
      </div>

      {/* Two-panels layout like screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: List of Assignment */}
        <div className="lg:col-span-4">
          <Card title="List of Assignment">
            <div className="space-y-3">
              <Input
                value={qAssign}
                onChange={setQAssign}
                placeholder="Search assignment..."
              />

              <div className="border border-slate-200 dark:border-slate-800 rounded-none">
                <div className="max-h-[620px] overflow-auto">
                  {loadingAssignments ? (
                    <div className="p-4 text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 border-t-slate-600 dark:border-t-slate-300 rounded-full animate-spin mr-2"></div>
                      Loading assignments...
                    </div>
                  ) : filteredAssignments.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500 dark:text-slate-400">
                      No assignments found.
                    </div>
                  ) : (
                    filteredAssignments.map((a) => {
                      const active = a.id === activeAssignmentId;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setActiveAssignmentId(a.id)}
                          className={cn(
                            "w-full text-left px-3 py-3 border-b border-slate-200 dark:border-slate-800 transition",
                            active
                              ? "bg-slate-50 dark:bg-slate-900/40"
                              : "bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                          )}
                        >
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                            {a.title}
                          </div>
                          <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                            {a.courseCode} • Due:{" "}
                            <span className="tabular-nums">{a.dueDate}</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT: List of Student */}
        <div className="lg:col-span-8">
          <Card title="List of Student">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-slate-700 dark:text-slate-200">
                  {activeAssignment ? (
                    <>
                      <span className="font-semibold">
                        {activeAssignment.title}
                      </span>{" "}
                      <span className="text-slate-500 dark:text-slate-400">
                        • {activeAssignment.courseCode}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400">
                      Select an assignment
                    </span>
                  )}
                </div>

                <div className="w-full sm:w-[320px]">
                  <Input
                    value={qStudent}
                    onChange={setQStudent}
                    placeholder="Search student..."
                  />
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-none overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-[920px] w-full">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 w-[140px]">
                          Reg No.
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200">
                          Student Name
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 w-[170px]">
                          Submitted On
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 w-[140px]">
                          Status
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 w-[220px]">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {loadingStudents[activeAssignmentId] ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 py-10 text-sm text-center text-slate-500 dark:text-slate-400"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 border-t-slate-600 dark:border-t-slate-300 rounded-full animate-spin"></div>
                              Loading student submissions...
                            </div>
                          </td>
                        </tr>
                      ) : filteredStudents.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 py-10 text-sm text-center text-slate-500 dark:text-slate-400"
                          >
                            {activeAssignmentId ? "No student submissions found for this assignment." : "Select an assignment to view submissions."}
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((r, idx) => (
                          <tr
                            key={r.id}
                            className={cn(
                              idx % 2 === 0
                                ? "bg-white dark:bg-slate-950"
                                : "bg-slate-50/60 dark:bg-slate-900/20",
                              "border-b border-slate-200/70 dark:border-slate-800/70"
                            )}
                          >
                            <td className="px-3 py-3 text-sm tabular-nums text-slate-800 dark:text-slate-100">
                              {r.regNo}
                            </td>
                            <td className="px-3 py-3 text-sm text-slate-800 dark:text-slate-100">
                              {r.name}
                            </td>
                            <td className="px-3 py-3 text-sm tabular-nums text-slate-800 dark:text-slate-100">
                              {r.submittedOn}
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className={cn(
                                  "inline-flex items-center px-3 py-1 text-xs font-semibold rounded-none",
                                  r.status === "APPROVED"
                                    ? "bg-teal-500 text-white"
                                    : r.status === "REJECTED"
                                    ? "bg-rose-500 text-white"
                                    : "bg-amber-500 text-white"
                                )}
                              >
                                {r.status}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <ActionBtn
                                  tone="approve"
                                  onClick={() => setStatus(r.id, "APPROVED")}
                                >
                                  <span className="inline-flex items-center gap-2">
                                    <CheckIcon size={14} />
                                    Approve
                                  </span>
                                </ActionBtn>

                                <ActionBtn
                                  tone="reject"
                                  onClick={() => setStatus(r.id, "REJECTED")}
                                >
                                  <span className="inline-flex items-center gap-2">
                                    <XIcon size={14} />
                                    Reject
                                  </span>
                                </ActionBtn>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                Tip: Select an assignment on the left to load students on the
                right.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
