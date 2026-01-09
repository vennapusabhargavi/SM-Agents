// src/layouts/student/StudentSidebar.tsx
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  LayoutDashboardIcon,
  BookOpenIcon,
  MessageSquareTextIcon,
  GraduationCapIcon,
  CalendarCheck2Icon,
  ClipboardListIcon,
  FileCheck2Icon,
  FileTextIcon,
  WalletIcon,
  GavelIcon,
  BadgePercentIcon,
  WrenchIcon,
  UserIcon,
  PanelLeftIcon,
  SunIcon,
  MoonIcon,
  LogOutIcon,
  ChevronDownIcon,
  BriefcaseIcon, // ✅ Placement Drives
  Building2Icon, // ✅ NEW: Classroom Allocation (separate)
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { clearAuth } from "../../components/ProtectedRoute";
import { useAuth } from "../../contexts/AuthContext";

interface StudentSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

type ThemeMode = "light" | "dark";
const THEME_KEY = "theme";

/** Persist sidebar scroll across route changes & dropdown toggles */
const SIDEBAR_SCROLL_KEY = "student_sidebar_scroll_top_v1";

const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem(THEME_KEY) as ThemeMode | null;
  if (saved === "light" || saved === "dark") return saved;
  const prefersDark =
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
  return prefersDark ? "dark" : "light";
};

const applyTheme = (mode: ThemeMode) => {
  const root = document.documentElement;
  if (mode === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
};

const navItemBase =
  "flex items-center rounded-xl py-2 text-sm font-medium transition-colors";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** ✅ Smooth dropdown transition (height + opacity) */
function Collapse({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [maxH, setMaxH] = useState(0);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    setMaxH(el.scrollHeight);
  }, [children, open]);

  return (
    <div
      className="overflow-hidden transition-[max-height,opacity] duration-200 ease-out"
      style={{ maxHeight: open ? maxH : 0, opacity: open ? 1 : 0 }}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
}

function StudentSidebar({ isOpen, onToggle }: StudentSidebarProps) {
  const { user, logout } = useAuth();
  const userName = user?.name || "Student";
  const userId = user?.registerNumber || "ST-0000";
  const navigate = useNavigate();
  const location = useLocation();

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getInitialTheme());

  // ✅ only dropdowns: Attendance + Examination
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [examOpen, setExamOpen] = useState(false);

  useEffect(() => {
    applyTheme(themeMode);
    localStorage.setItem(THEME_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    const p = location.pathname;

    setAttendanceOpen(p.startsWith("/student/attendance/"));

    // ✅ Examination dropdown should NOT auto-open for Classroom Allocation page
    const isExamArea = p.startsWith("/student/examination/");
    const isClassAllotment = p.startsWith("/student/examination/class-allotment");
    setExamOpen(isExamArea && !isClassAllotment);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
  };

  // ---------------- ✅ SCROLL PERSIST ----------------
  const desktopScrollRef = useRef<HTMLDivElement | null>(null);
  const mobileScrollRef = useRef<HTMLDivElement | null>(null);

  const lastScrollTopRef = useRef<number>(() => {
    const saved = Number(sessionStorage.getItem(SIDEBAR_SCROLL_KEY) || "0");
    return Number.isFinite(saved) ? saved : 0;
  }) as React.MutableRefObject<number>;

  const isDesktop = () =>
    typeof window !== "undefined" &&
    window.matchMedia?.("(min-width: 1024px)")?.matches;

  const getActiveScrollEl = () => {
    const d = desktopScrollRef.current;
    const m = mobileScrollRef.current;
    return isDesktop() ? d : m;
  };

  const saveScrollNow = () => {
    const el = getActiveScrollEl();
    if (!el) return;
    const v = el.scrollTop;
    lastScrollTopRef.current = v;
    sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(v));
  };

  const restoreScrollNow = () => {
    const v = lastScrollTopRef.current;
    const d = desktopScrollRef.current;
    const m = mobileScrollRef.current;
    if (d) d.scrollTop = v;
    if (m) m.scrollTop = v;
  };

  // Restore after route change
  useEffect(() => {
    requestAnimationFrame(() => restoreScrollNow());
  }, [location.pathname]);

  // Restore after sidebar collapse/expand
  useEffect(() => {
    requestAnimationFrame(() => restoreScrollNow());
  }, [isOpen]);

  const handleScroll = () => saveScrollNow();

  const handleNavClick = () => {
    saveScrollNow();
    if (window.innerWidth < 1024) onToggle();
  };

  const toggleAttendance = () => {
    saveScrollNow();
    setAttendanceOpen((v) => !v);
    requestAnimationFrame(() => restoreScrollNow());
  };

  const toggleExam = () => {
    saveScrollNow();
    setExamOpen((v) => !v);
    requestAnimationFrame(() => restoreScrollNow());
  };

  const itemClass = (isActive: boolean) =>
    [
      navItemBase,
      isOpen ? "px-3 gap-2.5 justify-start" : "px-0 gap-0 justify-center",
      isActive
        ? "bg-emerald-500/15 text-emerald-300"
        : "text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800/80",
    ].join(" ");

  const subItemClass = (isActive: boolean) =>
    [
      "flex items-center rounded-xl py-2 text-[13px] transition-colors",
      isOpen ? "pl-11 pr-3 justify-start" : "px-0 justify-center",
      isActive
        ? "bg-emerald-500/10 text-emerald-300"
        : "text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800/60",
    ].join(" ");

  const renderSidebarBody = (scrollRef: React.RefObject<HTMLDivElement>) => (
    <div className="flex h-full flex-col bg-neutral-950 text-neutral-50 border-r border-neutral-800">
      {/* HEADER */}
      <div
        className={cn(
          "flex items-center border-b border-neutral-800 gap-2",
          isOpen ? "justify-between px-3 pt-3 pb-3" : "justify-center px-1 py-3"
        )}
      >
        {isOpen && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-sky-400 flex items-center justify-center font-bold text-neutral-950 text-sm">
              ST
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-neutral-50">
                Student portal
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            saveScrollNow();
            onToggle();
            requestAnimationFrame(() => restoreScrollNow());
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-800 text-neutral-400"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <PanelLeftIcon
            size={18}
            className={
              isOpen ? "rotate-180 transition-transform" : "transition-transform"
            }
          />
        </button>
      </div>

      {/* NAV (scroll container) */}
      <div
        ref={scrollRef as any}
        onScroll={handleScroll}
        className="flex-1 px-2 py-4 space-y-2 overflow-y-auto scrollbar-hide"
      >
        {/* Dashboard */}
        <NavLink
          to="/student/dashboard"
          className={({ isActive }) => itemClass(isActive)}
          onClick={handleNavClick}
        >
          <LayoutDashboardIcon size={18} />
          {isOpen && <span>Home</span>}
        </NavLink>

        <NavLink
          to="/student/my-course"
          className={({ isActive }) => itemClass(isActive)}
          onClick={handleNavClick}
        >
          <BookOpenIcon size={18} />
          {isOpen && <span>My Course</span>}
        </NavLink>

        <NavLink
          to="/student/my-course-feedback"
          className={({ isActive }) => itemClass(isActive)}
          onClick={handleNavClick}
        >
          <MessageSquareTextIcon size={18} />
          {isOpen && <span>My Course Feedback</span>}
        </NavLink>

        <NavLink
          to="/student/enrollment"
          className={({ isActive }) => itemClass(isActive)}
          onClick={handleNavClick}
        >
          <GraduationCapIcon size={18} />
          {isOpen && <span>Enrollment</span>}
        </NavLink>

        {/* Attendance dropdown */}
        <button
          type="button"
          onMouseDown={saveScrollNow}
          onClick={toggleAttendance}
          className={cn(
            navItemBase,
            isOpen ? "px-3 gap-2.5 justify-start w-full" : "px-0 justify-center w-full",
            attendanceOpen
              ? "bg-neutral-900 text-neutral-100"
              : "text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800/80"
          )}
          aria-expanded={attendanceOpen}
        >
          <CalendarCheck2Icon size={18} />
          {isOpen && (
            <>
              <span className="flex-1 text-left">Attendance</span>
              <ChevronDownIcon
                size={16}
                className={
                  attendanceOpen
                    ? "transition-transform rotate-180"
                    : "transition-transform"
                }
              />
            </>
          )}
        </button>

        {isOpen && (
          <Collapse open={attendanceOpen}>
            <div className="mt-1 space-y-1">
              <NavLink
                to="/student/attendance/report"
                className={({ isActive }) => subItemClass(isActive)}
                onClick={handleNavClick}
              >
                <span>Attendance Report</span>
              </NavLink>

              <NavLink
                to="/student/attendance/request-od"
                className={({ isActive }) => subItemClass(isActive)}
                onClick={handleNavClick}
              >
                <span>Request - OD</span>
              </NavLink>
            </div>
          </Collapse>
        )}

        <NavLink
          to="/student/assignment"
          className={({ isActive }) => itemClass(isActive)}
          onClick={handleNavClick}
        >
          <ClipboardListIcon size={18} />
          {isOpen && <span>Assignment</span>}
        </NavLink>

        {/* Examination dropdown */}
        <button
          type="button"
          onMouseDown={saveScrollNow}
          onClick={toggleExam}
          className={cn(
            navItemBase,
            isOpen ? "px-3 gap-2.5 justify-start w-full" : "px-0 justify-center w-full",
            examOpen
              ? "bg-neutral-900 text-neutral-100"
              : "text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800/80"
          )}
          aria-expanded={examOpen}
        >
          <FileCheck2Icon size={18} />
          {isOpen && (
            <>
              <span className="flex-1 text-left">Examination</span>
              <ChevronDownIcon
                size={16}
                className={
                  examOpen ? "transition-transform rotate-180" : "transition-transform"
                }
              />
            </>
          )}
        </button>

        {isOpen && (
          <Collapse open={examOpen}>
            <div className="mt-1 space-y-1">
              <NavLink
                to="/student/examination/internal-marks"
                className={({ isActive }) => subItemClass(isActive)}
                onClick={handleNavClick}
              >
                <span>Internal Marks</span>
              </NavLink>

              <NavLink
                to="/student/examination/no-due"
                className={({ isActive }) => subItemClass(isActive)}
                onClick={handleNavClick}
              >
                <span>No Due</span>
              </NavLink>

              <NavLink
                to="/student/examination/revaluation"
                className={({ isActive }) => subItemClass(isActive)}
                onClick={handleNavClick}
              >
                <span>Revaluation</span>
              </NavLink>

              {/* ❌ REMOVED: Class Allotment from Examination dropdown */}
            </div>
          </Collapse>
        )}

        {/* ✅ NEW: Classroom Allocation (separate top-level item) */}
        <NavLink
          to="/student/examination/class-allotment"
          className={({ isActive }) => itemClass(isActive)}
          onClick={handleNavClick}
        >
          <Building2Icon size={18} />
          {isOpen && <span>Classroom Allocation</span>}
        </NavLink>

        <NavLink
          to="/student/financial-record"
          className={({ isActive }) => itemClass(isActive)}
          onClick={handleNavClick}
        >
          <WalletIcon size={18} />
          {isOpen && <span>Financial Record</span>}
        </NavLink>

        <NavLink
          to="/student/disciplinary"
          className={({ isActive }) => itemClass(isActive)}
          onClick={handleNavClick}
        >
          <GavelIcon size={18} />
          {isOpen && <span>Disciplinary</span>}
        </NavLink>

        <NavLink
          to="/student/offer"
          className={({ isActive }) => itemClass(isActive)}
          onClick={handleNavClick}
        >
          <BadgePercentIcon size={18} />
          {isOpen && <span>Offer</span>}
        </NavLink>

        {/* ✅ Placement Drives */}
        <NavLink
          to="/student/placements/drives"
          className={({ isActive }) => itemClass(isActive)}
          onClick={handleNavClick}
        >
          <BriefcaseIcon size={18} />
          {isOpen && <span>Placement Drives</span>}
        </NavLink>

        <NavLink
          to="/student/raise-infra-issue"
          className={({ isActive }) => itemClass(isActive)}
          onClick={handleNavClick}
        >
          <WrenchIcon size={18} />
          {isOpen && <span>Raise Infra Issue</span>}
        </NavLink>

        <NavLink
          to="/student/my-profile"
          className={({ isActive }) => itemClass(isActive)}
          onClick={handleNavClick}
        >
          <UserIcon size={18} />
          {isOpen && <span>My Profile</span>}
        </NavLink>
      </div>

      {/* FOOTER */}
      <div className="border-t border-neutral-800 px-3 py-3 space-y-2">
        {isOpen && (
          <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 px-2 py-1.5">
            <span className="text-[11px] text-neutral-400">Appearance</span>
            <div className="inline-flex items-center gap-1 rounded-xl bg-neutral-900">
              <button
                type="button"
                onClick={() => setThemeMode("light")}
                className={cn(
                  "h-7 w-7 rounded-lg grid place-items-center",
                  themeMode === "light"
                    ? "bg-neutral-100 text-neutral-900"
                    : "hover:bg-neutral-800 text-neutral-300"
                )}
                aria-label="Light theme"
              >
                <SunIcon size={15} />
              </button>
              <button
                type="button"
                onClick={() => setThemeMode("dark")}
                className={cn(
                  "h-7 w-7 rounded-lg grid place-items-center",
                  themeMode === "dark"
                    ? "bg-neutral-800 text-neutral-50"
                    : "hover:bg-neutral-800 text-neutral-300"
                )}
                aria-label="Dark theme"
              >
                <MoonIcon size={15} />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-neutral-800 grid place-items-center text-xs font-semibold text-neutral-100">
              <UserIcon size={14} />
            </div>
            {isOpen && (
              <div className="leading-tight">
                <p className="text-xs font-medium text-neutral-100">{userName}</p>
                <p className="text-[11px] text-neutral-500">{userId}</p>
              </div>
            )}
          </div>

          {isOpen && (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 px-2.5 py-1 text-[11px] font-medium text-neutral-200 hover:bg-neutral-800/80 transition"
            >
              <LogOutIcon size={13} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP */}
      <aside
        className={`hidden lg:block h-screen sticky top-0 overflow-hidden transition-[width] duration-150 ease-out ${
          isOpen ? "w-64" : "w-16"
        }`}
      >
        {renderSidebarBody(desktopScrollRef)}
      </aside>

      {/* MOBILE */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => {
            saveScrollNow();
            onToggle();
            requestAnimationFrame(() => restoreScrollNow());
          }}
          aria-hidden="true"
        />
        <aside
          className={`absolute inset-y-0 left-0 w-64 max-w-[80%] h-full shadow-2xl transform transition-transform duration-200 bg-neutral-950 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {renderSidebarBody(mobileScrollRef)}
        </aside>
      </div>
    </>
  );
}

export { StudentSidebar };
export default StudentSidebar;
