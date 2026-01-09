// src/layouts/teacher/classroom/RequestClassroom.tsx
import React, { useState, useMemo, useEffect } from "react";
import { useToast } from "../../../components/Toast";

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

type CourseOption = { id: string; label: string };

type ClassroomOption = { id: string; label: string; capacity: number };

function yyyyMmDd(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function RequestClassroom() {
  const [courses, setCourses] = useState<CourseOption[]>([{ id: "", label: "--Select--" }]);
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([{ id: "", label: "--Select--", capacity: 0 }]);
  const [courseId, setCourseId] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [requestDate, setRequestDate] = useState<string>(() => yyyyMmDd(new Date()));
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [expectedStudents, setExpectedStudents] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const { showToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      // Fetch courses
      try {
        const resCourses = await fetch(`${API_BASE}/api/teacher/courses`, { headers });
        if (resCourses.ok) {
          const dataCourses = await resCourses.json();
          const mappedCourses: CourseOption[] = [{ id: "", label: "--Select--" }];
          (dataCourses.courses || []).forEach((c: any) => {
            mappedCourses.push({ id: c.code, label: `${c.code} - ${c.title} (${c.slot})` });
          });
          setCourses(mappedCourses);
        }
      } catch (err) {
        console.error("Failed to fetch courses", err);
      }

      // Fetch classrooms
      try {
        const resClassrooms = await fetch(`${API_BASE}/api/admin/classrooms`, { headers });
        if (resClassrooms.ok) {
          const dataClassrooms = await resClassrooms.json();
          const mappedClassrooms: ClassroomOption[] = [{ id: "", label: "--Select--", capacity: 0 }];
          (dataClassrooms || []).forEach((c: any) => {
            mappedClassrooms.push({ id: c.code, label: `${c.code} - ${c.name}`, capacity: c.capacity });
          });
          setClassrooms(mappedClassrooms);
        }
      } catch (err) {
        console.error("Failed to fetch classrooms", err);
      }
    };
    fetchData();
  }, []);

  const courseLabel = useMemo(
    () => courses.find((c) => c.id === courseId)?.label ?? "--Select--",
    [courseId]
  );

  const classroomLabel = useMemo(
    () => classrooms.find((c) => c.id === classroomId)?.label ?? "--Select--",
    [classroomId]
  );

  const classroomCapacity = useMemo(
    () => classrooms.find((c) => c.id === classroomId)?.capacity ?? 0,
    [classroomId]
  );

  const clearAll = () => {
    setCourseId("");
    setClassroomId("");
    setRequestDate(yyyyMmDd(new Date()));
    setStartTime("");
    setEndTime("");
    setExpectedStudents(0);
    setReason("");
    setError("");
  };

  const submitRequest = async () => {
    setError("");

    if (!courseId) return setError("Please select a course.");
    if (!classroomId) return setError("Please select a classroom.");
    if (!requestDate) return setError("Please select a date.");
    if (!startTime) return setError("Please select start time.");
    if (!endTime) return setError("Please select end time.");
    if (expectedStudents <= 0) return setError("Please enter expected number of students.");
    if (expectedStudents > classroomCapacity) return setError(`Expected students (${expectedStudents}) exceed classroom capacity (${classroomCapacity}).`);
    if (!reason.trim()) return setError("Please provide a reason.");

    const payload = {
      requesterId: localStorage.getItem("userId"),
      courseId,
      courseLabel,
      classroomId,
      classroomLabel,
      startAt: `${requestDate}T${startTime}`,
      endAt: `${requestDate}T${endTime}`,
      expectedStudents,
      reason: reason.trim(),
    };

    const token = localStorage.getItem("authToken");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const response = await fetch(`${API_BASE}/api/teacher/room-requests`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Failed to submit request");
      }
      showToast('success', 'Request Submitted', 'Classroom request submitted successfully.');
      clearAll();
    } catch (error) {
      console.error("Error submitting request:", error);
      showToast('error', 'Submission Failed', 'Failed to submit request. Please try again.');
    }
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
        Request Classroom
      </h1>

      <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)]">
        <div className="p-4 sm:p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-2 lg:gap-6 items-center">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                <span className="text-rose-600 dark:text-rose-400">*</span> Course
              </div>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/35"
              >
                {courses.map((c) => (
                  <option key={c.label + c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-2 lg:gap-6 items-center">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                <span className="text-rose-600 dark:text-rose-400">*</span> Classroom
              </div>
              <select
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/35"
              >
                {classrooms.map((c) => (
                  <option key={c.label + c.id} value={c.id}>
                    {c.label} (Capacity: {c.capacity})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-2 lg:gap-6 items-center">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                <span className="text-rose-600 dark:text-rose-400">*</span> Request Date
              </div>
              <input
                type="date"
                value={requestDate}
                onChange={(e) => setRequestDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/35"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-2 lg:gap-6">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 pt-2">
                <span className="text-rose-600 dark:text-rose-400">*</span> Time Slot
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-slate-600 dark:text-slate-400">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/35"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-slate-600 dark:text-slate-400">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/35"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-2 lg:gap-6 items-center">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                <span className="text-rose-600 dark:text-rose-400">*</span> Expected Students
              </div>
              <input
                type="number"
                value={expectedStudents}
                onChange={(e) => setExpectedStudents(Number(e.target.value))}
                min="1"
                className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/35"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-2 lg:gap-6 items-start">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 pt-2">
                <span className="text-rose-600 dark:text-rose-400">*</span> Reason
              </div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide reason for the classroom request..."
                className="w-full min-h-[90px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/35"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-200">
                {error}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={submitRequest}
                className="h-10 px-5 rounded-xl bg-gradient-to-r from-sky-700 via-blue-600 to-indigo-700 text-white text-sm font-semibold shadow-sm hover:opacity-95 active:scale-[0.99] transition"
              >
                Submit Request
              </button>

              <button
                type="button"
                onClick={clearAll}
                className="h-10 px-5 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-200 text-sm font-semibold hover:bg-amber-100 dark:hover:bg-amber-500/15 transition"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}