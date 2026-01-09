import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export type Role = "ADMIN" | "FACULTY" | "STUDENT";

export function clearAuth() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userId");
  localStorage.removeItem("userName");
  localStorage.removeItem("registerNumber");
}

function normalizeRole(value: unknown): Role | null {
  const upper = String(value ?? "").toUpperCase();
  if (upper === "ADMIN" || upper === "FACULTY" || upper === "STUDENT") return upper as Role;
  return null;
}

function roleHome(role: Role) {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "FACULTY") return "/teacher/dashboard";
  return "/student/dashboard";
}

export function ProtectedRoute({
  children,
  allowRoles,
}: {
  children: React.ReactNode;
  allowRoles?: Role[];
}) {
  const location = useLocation();
  const token = localStorage.getItem("authToken");
  const role = normalizeRole(localStorage.getItem("userRole"));

  if (!token || !role) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowRoles?.length && !allowRoles.includes(role)) {
    return <Navigate to={roleHome(role)} replace />;
  }

  return <>{children}</>;
}
