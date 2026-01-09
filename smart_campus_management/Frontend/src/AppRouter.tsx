import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { Landing } from "./pages/Landing";
import { Login } from "./pages/auth/Login";
import { CreateAccount } from "./pages/auth/CreateAccount";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { ResetPassword } from "./pages/auth/ResetPassword";

import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./components/Toast";

// Admin (unchanged)
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminLayout } from "./layouts/admin/AdminLayout";
import { AdminNotificationsPage } from "./layouts/admin/NotificationsPage";
import { AdminClassrooms } from "./layouts/admin/AdminClassrooms";
import { AdminExams } from "./layouts/admin/AdminExams";
import { AdminFees } from "./layouts/admin/AdminFees";
import { AdminPlacements } from "./layouts/admin/AdminPlacements";
import AdminAccounts from "./layouts/admin/AdminAccounts";
import AdminCourses from "./layouts/admin/AdminCourses";

// Teacher
import TeacherLayout from "./layouts/teacher/TeacherLayout";
import TeacherDashboard from "./layouts/teacher/TeacherDashboard";
import FormativeMarks from "./layouts/teacher/FormativeMarks";
import Student360 from "./layouts/teacher/Student360";
import Offers from "./layouts/teacher/Offers";
import AddDataRecord from "./layouts/teacher/AddDataRecord";
import TeacherNotifications from "./layouts/teacher/TeacherNotifications";
import TeacherProfile from "./layouts/teacher/TeacherProfile";
import TeacherHelp from "./layouts/teacher/TeacherHelp";

// Teacher → Course
import CreateCourse from "./layouts/teacher/course/CreateCourse";
import ViewCourse from "./layouts/teacher/course/ViewCourse";
import CourseApprove from "./layouts/teacher/course/CourseApprove";

// Teacher → Attendance
import AttendanceMarking from "./layouts/teacher/attendance/AttendanceMarking";
import AttendanceGrade from "./layouts/teacher/attendance/AttendanceGrade";
import OdApproval from "./layouts/teacher/attendance/OdApproval";
import StudentAttendance from "./layouts/teacher/attendance/StudentAttendance";

// Teacher → No Due
import NoDueApproval from "./layouts/teacher/noDue/NoDueApproval";
import NoDueRejected from "./layouts/teacher/noDue/NoDueRejected";

// Teacher → Assignment
import PublishAssignment from "./layouts/teacher/assignment/PublishAssignment";
import ApproveAssignment from "./layouts/teacher/assignment/ApproveAssignment";
import UploadContent from "./layouts/teacher/assignment/UploadContent";

// Teacher → Internal Marks
import DeclareEnterMarks from "./layouts/teacher/internalMarks/DeclareEnterMarks";
import EditUpdateMarks from "./layouts/teacher/internalMarks/EditUpdateMarks";
import ViewMarks from "./layouts/teacher/internalMarks/ViewMarks";
import ComputeWeightage from "./layouts/teacher/internalMarks/ComputeWeightage";
import ViewFinalIA from "./layouts/teacher/internalMarks/ViewFinalIA";

// Teacher → Disciplinary
import DisciplinaryEntry from "./layouts/teacher/disciplinary/DisciplinaryEntry";
import ActionTaken from "./layouts/teacher/disciplinary/ActionTaken";
// import (near other student imports)
import { StudentPlacementDrives } from "./layouts/student/StudentPlacementDrives";

// Teacher → Raise Infra
import RaiseIssue from "./layouts/teacher/raiseInfra/RaiseIssue";
import MyIssue from "./layouts/teacher/raiseInfra/MyIssue";
import AssignedIssue from "./layouts/teacher/raiseInfra/AssignedIssue";

// Teacher → Classroom
import RequestClassroom from "./layouts/teacher/classroom/RequestClassroom";
import ClassroomAllocated from "./layouts/teacher/classroom/ClassroomAllocated";
import ExamInvigilation from "./layouts/teacher/classroom/ExamInvigilation";
import ClassroomStatus from "./layouts/teacher/classroom/ClassroomStatus";

// Teacher → Result
import ViewResult from "./layouts/teacher/result/ViewResult";
import ViewResultNew from "./layouts/teacher/result/ViewResultNew";
import ResultAnalysis from "./layouts/teacher/result/ResultAnalysis";

// Student (unchanged)
import StudentLayout from "./layouts/student/StudentLayout";
import StudentDashboard from "./layouts/student/StudentDashboard";
import { StudentHome } from "./layouts/student/StudentHome";
import { StudentMyCourse } from "./layouts/student/StudentMyCourse";
import { StudentMyCourseFeedback } from "./layouts/student/StudentMyCourseFeedback";
import { StudentEnrollment } from "./layouts/student/StudentEnrollment";
import { StudentAttendanceReport } from "./layouts/student/attendance/StudentAttendanceReport";
import { StudentAttendanceRequestOD } from "./layouts/student/attendance/StudentAttendanceRequestOD";
import { StudentAssignment } from "./layouts/student/StudentAssignment";
import { StudentExamInternalMarks } from "./layouts/student/examination/StudentExamInternalMarks";
import { StudentExamNoDue } from "./layouts/student/examination/StudentExamNoDue";
import { StudentExamRevaluation } from "./layouts/student/examination/StudentExamRevaluation";
import { StudentFinancialRecord } from "./layouts/student/StudentFinancialRecord";
import { StudentDisciplinary } from "./layouts/student/StudentDisciplinary";
import { StudentOffer } from "./layouts/student/StudentOffer";
import { StudentRaiseInfraIssue } from "./layouts/student/StudentRaiseInfraIssue";
import { StudentMyProfile } from "./layouts/student/StudentMyProfile";

// ✅ NEW: Student → Examination → Class Allotment
import { StudentExamClassAllotment } from "./layouts/student/examination/StudentExamClassAllotment";

// Help
import { HelpAndContact } from "./pages/HelpAndContact";
import { ContactSupport } from "./pages/help/ContactSupport";

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-soft">
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
      {title}
    </h1>
    <p className="text-gray-600 dark:text-gray-300">
      This page is a minimal placeholder (demo).
    </p>
  </div>
);

function AppRouterInner() {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
        {/* ---------- Public ---------- */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ---------- ADMIN ---------- */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowRoles={["ADMIN"]}>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/classrooms"
          element={
            <ProtectedRoute allowRoles={["ADMIN"]}>
              <AdminLayout>
                <AdminClassrooms />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/exams"
          element={
            <ProtectedRoute allowRoles={["ADMIN"]}>
              <AdminLayout>
                <AdminExams />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/fees"
          element={
            <ProtectedRoute allowRoles={["ADMIN"]}>
              <AdminLayout>
                <AdminFees />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/placements"
          element={
            <ProtectedRoute allowRoles={["ADMIN"]}>
              <AdminLayout>
                <AdminPlacements />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <ProtectedRoute allowRoles={["ADMIN"]}>
              <AdminLayout>
                <AdminNotificationsPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/help"
          element={
            <ProtectedRoute allowRoles={["ADMIN"]}>
              <AdminLayout>
                <HelpAndContact />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/accounts"
          element={
            <ProtectedRoute allowRoles={["ADMIN"]}>
              <AdminLayout>
                <AdminAccounts />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <ProtectedRoute allowRoles={["ADMIN"]}>
              <AdminLayout>
                <AdminCourses />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* ---------- TEACHER (NESTED ROUTES) ---------- */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowRoles={["FACULTY"]}>
              <TeacherLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboard />} />

          {/* Course */}
          <Route path="course/create" element={<CreateCourse />} />
          <Route path="course/view" element={<ViewCourse />} />
          <Route path="course/approve" element={<CourseApprove />} />

          {/* Attendance */}
          <Route path="attendance/marking" element={<AttendanceMarking />} />
          <Route path="attendance/grade" element={<AttendanceGrade />} />
          <Route path="attendance/od-approval" element={<OdApproval />} />

          <Route path="attendance/student-attendance" element={<StudentAttendance />} />

          {/* No Due */}
          <Route path="no-due/approval" element={<NoDueApproval />} />
          <Route path="no-due/rejected" element={<NoDueRejected />} />

          {/* Assignment */}
          <Route path="assignment/publish" element={<PublishAssignment />} />
          <Route path="assignment/approve" element={<ApproveAssignment />} />
          <Route path="assignment/upload-content" element={<UploadContent />} />

          {/* Internal Marks */}
          <Route path="internal-marks/declare-enter" element={<DeclareEnterMarks />} />
          <Route path="internal-marks/edit-update" element={<EditUpdateMarks />} />
          <Route path="internal-marks/view" element={<ViewMarks />} />
          <Route path="internal-marks/compute-weightage" element={<ComputeWeightage />} />
          <Route path="internal-marks/view-final" element={<ViewFinalIA />} />

          {/* Classroom */}
          <Route path="classroom/request" element={<RequestClassroom />} />
          <Route path="classroom/allocated" element={<ClassroomAllocated />} />
          <Route path="classroom/exam-invigilation" element={<ExamInvigilation />} />
          <Route path="classroom/status" element={<ClassroomStatus />} />

          <Route path="formative-marks" element={<FormativeMarks />} />

          {/* Disciplinary */}
          <Route path="disciplinary/entry" element={<DisciplinaryEntry />} />
          <Route path="disciplinary/action-taken" element={<ActionTaken />} />

          {/* Raise Infra */}
          <Route path="raise-infra/raise" element={<RaiseIssue />} />
          <Route path="raise-infra/my-issue" element={<MyIssue />} />
          <Route path="raise-infra/assigned" element={<AssignedIssue />} />

          {/* Result */}
          <Route path="result/view" element={<ViewResult />} />
          <Route path="result/view-new" element={<ViewResultNew />} />
          <Route path="result/analysis" element={<ResultAnalysis />} />

          {/* Others */}
          <Route path="student-360" element={<Student360 />} />
          <Route path="offers" element={<Offers />} />
          <Route path="add-data-record" element={<AddDataRecord />} />
          <Route path="notifications" element={<TeacherNotifications />} />
          <Route path="profile" element={<TeacherProfile />} />
          <Route path="help" element={<TeacherHelp />} />
        </Route>

        {/* ---------- STUDENT ---------- */}
        <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />

        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowRoles={["STUDENT"]}>
              <StudentLayout>
                <StudentDashboard />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/home"
          element={
            <ProtectedRoute allowRoles={["STUDENT"]}>
              <StudentLayout>
                <StudentHome />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/my-course"
          element={
            <ProtectedRoute allowRoles={["STUDENT"]}>
              <StudentLayout>
                <StudentMyCourse />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        // route (near other student routes)
<Route
  path="/student/placements/drives"
  element={
    <ProtectedRoute allowRoles={["STUDENT"]}>
      <StudentLayout>
        <StudentPlacementDrives />
      </StudentLayout>
    </ProtectedRoute>
  }
/>

        <Route
          path="/student/my-course-feedback"
          element={
            <ProtectedRoute allowRoles={["STUDENT"]}>
              <StudentLayout>
                <StudentMyCourseFeedback />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/enrollment"
          element={
            <ProtectedRoute allowRoles={["STUDENT"]}>
              <StudentLayout>
                <StudentEnrollment />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/attendance/report"
          element={
            <ProtectedRoute allowRoles={["STUDENT"]}>
              <StudentLayout>
                <StudentAttendanceReport />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/attendance/request-od"
          element={
            <ProtectedRoute allowRoles={["STUDENT"]}>
              <StudentLayout>
                <StudentAttendanceRequestOD />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/assignment"
          element={
            <ProtectedRoute allowRoles={["STUDENT"]}>
              <StudentLayout>
                <StudentAssignment />
              </StudentLayout>
            </ProtectedRoute>
          }
        />

        {/* Student → Examination */}
        <Route
          path="/student/examination/internal-marks"
          element={
            <ProtectedRoute allowRoles={["STUDENT"]}>
              <StudentLayout>
                <StudentExamInternalMarks />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/examination/no-due"
          element={
            <ProtectedRoute allowRoles={["STUDENT"]}>
              <StudentLayout>
                <StudentExamNoDue />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/examination/revaluation"
          element={
            <ProtectedRoute allowRoles={["STUDENT"]}>
              <StudentLayout>
                <StudentExamRevaluation />
              </StudentLayout>
            </ProtectedRoute>
          }
        />

        {/* ✅ NEW: Student → Examination → Class Allotment */}
        <Route
          path="/student/examination/class-allotment"
          element={
            <ProtectedRoute allowRoles={["STUDENT"]}>
              <StudentLayout>
                <StudentExamClassAllotment />
              </StudentLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/financial-record"
          element={
            <ProtectedRoute allowRoles={["STUDENT"]}>
              <StudentLayout>
                <StudentFinancialRecord />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/disciplinary"
          element={
            <ProtectedRoute allowRoles={["STUDENT"]}>
              <StudentLayout>
                <StudentDisciplinary />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/offer"
          element={
            <ProtectedRoute allowRoles={["STUDENT"]}>
              <StudentLayout>
                <StudentOffer />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/raise-infra-issue"
          element={
            <ProtectedRoute allowRoles={["STUDENT"]}>
              <StudentLayout>
                <StudentRaiseInfraIssue />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/my-profile"
          element={
            <ProtectedRoute allowRoles={["STUDENT"]}>
              <StudentLayout>
                <StudentMyProfile />
              </StudentLayout>
            </ProtectedRoute>
          }
        />

        {/* ---------- GLOBAL HELP ---------- */}
        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <HelpAndContact />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help/contact"
          element={
            <ProtectedRoute>
              <ContactSupport />
            </ProtectedRoute>
          }
        />

        {/* Legacy */}
        <Route
          path="/app/*"
          element={
            <ProtectedRoute>
              <PlaceholderPage title="Legacy routes removed in Smart Campus edition" />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRouterInner />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
