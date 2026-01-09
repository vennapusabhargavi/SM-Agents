// src/layouts/teacher/TeacherSidebar.tsx
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboardIcon,
  BookOpenIcon,
  CalendarCheck2Icon,
  ClipboardListIcon,
  ClipboardSignatureIcon,
  FileTextIcon,
  GraduationCapIcon,
  BadgePercentIcon,
  ShieldAlertIcon,
  WrenchIcon,
  AwardIcon,
  UsersIcon,
  SparklesIcon,
  UserIcon,
  BellIcon,
  HelpCircleIcon,
  LogOutIcon,
  PanelLeftIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
  MapPinIcon,
} from "lucide-react";
import { clearAuth } from "../../components/ProtectedRoute";
import { useAuth } from "../../contexts/AuthContext";

interface TeacherSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

type ThemeMode = "light" | "dark";
const THEME_KEY = "theme";

/** Persist sidebar scroll across route changes & dropdown toggles */
const SIDEBAR_SCROLL_KEY = "teacher_sidebar_scroll_top_v1";

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
  "flex items-center rounded-xl py-1.5 text-sm transition-colors";
const activeStyles =
  "bg-slate-900/90 text-slate-50 shadow-sm border border-slate-700";
const inactiveStyles =
  "text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent";

const groupHeaderBase =
  "w-full flex items-center rounded-xl py-1.5 text-sm transition-colors border border-transparent text-slate-300 hover:text-white hover:bg-slate-800/70";
const subItemBase =
  "flex items-center rounded-xl py-1.5 text-[13px] transition-colors ml-2";

type NavLeaf = {
  type: "link";
  label: string;
  to: string;
  Icon: React.ComponentType<{ size?: number | string; className?: string }>;
  badge?: { text: string };
};

type NavGroup = {
  type: "group";
  key:
    | "course"
    | "attendance"
    | "noDue"
    | "assignment"
    | "internalMarks"
    | "classroom"
    | "disciplinary"
    | "raiseInfra"
    | "result";
  label: string;
  Icon: React.ComponentType<{ size?: number | string; className?: string }>;
  items: Array<{
    label: string;
    to: string;
    badge?: { text: string };
  }>;
};

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
    // Measure content height
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

export const TeacherSidebar: React.FC<TeacherSidebarProps> = ({
  isOpen,
  onToggle,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userName = user?.name || "Teacher";
  const userId = user?.registerNumber || "EMP-0000";

  // ---------------- THEME ----------------
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getInitialTheme());
  useEffect(() => {
    applyTheme(themeMode);
    localStorage.setItem(THEME_KEY, themeMode);
  }, [themeMode]);

  const toggleTheme = () =>
    setThemeMode((p) => (p === "dark" ? "light" : "dark"));

  const handleLogout = () => {
    logout();
  };

  const handleNavClick = () => {
    // ✅ Save scroll before route change (important!)
    saveScrollNow();
    if (window.innerWidth < 1024) onToggle();
  };

  // ---------------- NAV CONFIG ----------------
  const nav: Array<NavLeaf | NavGroup> = useMemo(
    () => [
      { type: "link", label: "Home", to: "/teacher/dashboard", Icon: LayoutDashboardIcon },

      {
        type: "group",
        key: "course",
        label: "Course",
        Icon: BookOpenIcon,
        items: [
          { label: "Create Course", to: "/teacher/course/create", badge: { text: "New" } },
          { label: "View Course", to: "/teacher/course/view" },
          { label: "Course Approve", to: "/teacher/course/approve" },
        ],
      },

      {
        type: "group",
        key: "attendance",
        label: "Attendance",
        Icon: CalendarCheck2Icon,
        items: [
          { label: "Attendance Marking", to: "/teacher/attendance/marking" },
          { label: "Grade", to: "/teacher/attendance/grade" },
          { label: "OD Approval", to: "/teacher/attendance/od-approval", badge: { text: "New" } },
          { label: "Student Attendance", to: "/teacher/attendance/student-attendance" },
        ],
      },

      {
        type: "group",
        key: "noDue",
        label: "No Due",
        Icon: BadgePercentIcon,
        items: [
          { label: "No Due Approval", to: "/teacher/no-due/approval" },
          { label: "No Due Approval / Rejected List", to: "/teacher/no-due/rejected" },
        ],
      },

      {
        type: "group",
        key: "assignment",
        label: "Assignment",
        Icon: ClipboardSignatureIcon,
        items: [
          { label: "Publish Assignment", to: "/teacher/assignment/publish" },
          { label: "Approve Assignment", to: "/teacher/assignment/approve" },
          { label: "Upload Content", to: "/teacher/assignment/upload-content" },
        ],
      },

      {
        type: "group",
        key: "classroom",
        label: "Classroom",
        Icon: MapPinIcon,
        items: [
          { label: "Request Classroom", to: "/teacher/classroom/request" },
          { label: "Allocated Classes", to: "/teacher/classroom/allocated" },
          { label: "Classroom Status", to: "/teacher/classroom/status" },
        ],
      },

      { type: "link", label: "Exam Invigilation", to: "/teacher/classroom/exam-invigilation", Icon: BadgePercentIcon },

      {
        type: "group",
        key: "internalMarks",
        label: "Internal Marks",
        Icon: ClipboardListIcon,
        items: [
          { label: "Declare & Enter Marks", to: "/teacher/internal-marks/declare-enter" },
          { label: "Edit or Update Marks", to: "/teacher/internal-marks/edit-update" },
          { label: "View Marks", to: "/teacher/internal-marks/view" },
          { label: "Compute IA Weightage", to: "/teacher/internal-marks/compute-weightage" },
          { label: "View Final IA", to: "/teacher/internal-marks/view-final" },
        ],
      },

      { type: "link", label: "Formative Marks", to: "/teacher/formative-marks", Icon: FileTextIcon },

      {
        type: "group",
        key: "disciplinary",
        label: "Disciplinary",
        Icon: ShieldAlertIcon,
        items: [
          { label: "Disciplinary Entry", to: "/teacher/disciplinary/entry" },
          { label: "Disciplinary Action Taken", to: "/teacher/disciplinary/action-taken" },
        ],
      },

      {
        type: "group",
        key: "raiseInfra",
        label: "Raise Infra Issue",
        Icon: WrenchIcon,
        items: [
          { label: "Raise Issue", to: "/teacher/raise-infra/raise" },
          { label: "My Issue", to: "/teacher/raise-infra/my-issue" },
          { label: "Assigned Issue", to: "/teacher/raise-infra/assigned" },
        ],
      },

      {
        type: "group",
        key: "result",
        label: "Result",
        Icon: AwardIcon,
        items: [
          { label: "View Result", to: "/teacher/result/view" },
          { label: "View Result", to: "/teacher/result/view-new", badge: { text: "New" } },
          { label: "Result Analysis", to: "/teacher/result/analysis", badge: { text: "New" } },
        ],
      },

      { type: "link", label: "Student 360° View", to: "/teacher/student-360", Icon: UsersIcon },
      { type: "link", label: "Offers", to: "/teacher/offers", Icon: SparklesIcon },
      { type: "link", label: "Add Data Record", to: "/teacher/add-data-record", Icon: GraduationCapIcon },

      { type: "link", label: "Notifications", to: "/teacher/notifications", Icon: BellIcon },
      { type: "link", label: "My Profile", to: "/teacher/profile", Icon: UserIcon },
    ],
    []
  );

  // ---------------- GROUP OPEN STATE ----------------
  const groupKeyFromPath = (pathname: string): NavGroup["key"] | null => {
    if (pathname.startsWith("/teacher/course")) return "course";
    if (pathname.startsWith("/teacher/attendance")) return "attendance";
    if (pathname.startsWith("/teacher/no-due")) return "noDue";
    if (pathname.startsWith("/teacher/assignment")) return "assignment";
    if (pathname.startsWith("/teacher/classroom")) return "classroom";
    if (pathname.startsWith("/teacher/internal-marks")) return "internalMarks";
    if (pathname.startsWith("/teacher/disciplinary")) return "disciplinary";
    if (pathname.startsWith("/teacher/raise-infra")) return "raiseInfra";
    if (pathname.startsWith("/teacher/result")) return "result";
    return null;
  };

  const initialOpen = useMemo(() => {
    const k = groupKeyFromPath(location.pathname);
    return k ? { [k]: true } : {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(initialOpen);

  useEffect(() => {
    const k = groupKeyFromPath(location.pathname);
    if (!k) return;
    setOpenGroups((prev) => (prev[k] ? prev : { ...prev, [k]: true }));
  }, [location.pathname]);

  const isAnyChildActive = (g: NavGroup) =>
    g.items.some((it) => location.pathname === it.to || location.pathname.startsWith(it.to + "/"));

  // ---------------- ✅ SCROLL PERSIST (FIXED) ----------------
  // Two scroll containers exist (desktop + mobile). Use separate refs and always restore the active one.
  const desktopScrollRef = useRef<HTMLDivElement | null>(null);
  const mobileScrollRef = useRef<HTMLDivElement | null>(null);

  const lastScrollTopRef = useRef<number>(Number(sessionStorage.getItem(SIDEBAR_SCROLL_KEY) || "0"));

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

    // Restore both (so switching breakpoints doesn't reset either)
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

  // Save on scroll
  const handleScroll = () => saveScrollNow();

  // IMPORTANT: Save before dropdown toggle (so state update never resets you to 0)
  const toggleGroup = (key: NavGroup["key"]) => {
    saveScrollNow();
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

    // Restore immediately after DOM expands/collapses (keeps your exact position)
    requestAnimationFrame(() => restoreScrollNow());
  };

  const Badge = ({ text }: { text: string }) => (
    <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-rose-500/90 text-white">
      {text}
    </span>
  );

  const renderSidebarBody = (scrollRef: React.RefObject<HTMLDivElement>) => (
    <div className="flex h-full flex-col bg-slate-950 text-slate-50 border-r border-slate-800">
      {/* HEADER */}
      <div
        className={`flex items-center border-b border-slate-800 gap-2 ${
          isOpen ? "justify-between px-3 pt-3 pb-3" : "justify-center px-1 py-3"
        }`}
      >
        {isOpen && (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-slate-900 border border-slate-800 grid place-items-center">
              <GraduationCapIcon size={18} className="text-emerald-300" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Teacher Console</div>
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
          className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-800 text-slate-400"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <PanelLeftIcon
            size={18}
            className={isOpen ? "rotate-180 transition-transform" : "transition-transform"}
          />
        </button>
      </div>

      {/* NAV */}
      <div
        ref={scrollRef as any}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-hide px-2 py-3 space-y-6"
      >
        <div>
          {isOpen && (
            <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500 mb-2.5">
              Workspace
            </div>
          )}

          <nav className="space-y-1">
            {nav.map((item) => {
              if (item.type === "link") {
                const isHome =
                  item.label === "Home" &&
                  (location.pathname === "/teacher" ||
                    location.pathname === "/teacher/dashboard");

                return (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        navItemBase,
                        isOpen ? "px-3 gap-2.5 justify-start" : "px-0 gap-0 justify-center",
                        isActive || isHome ? activeStyles : inactiveStyles,
                      ].join(" ")
                    }
                    onClick={handleNavClick}
                  >
                    <item.Icon size={18} className="shrink-0" />
                    {isOpen && <span>{item.label}</span>}
                    {isOpen && item.badge?.text && <Badge text={item.badge.text} />}
                  </NavLink>
                );
              }

              const expanded = !!openGroups[item.key];
              const groupActive = isAnyChildActive(item);

              return (
                <div key={item.key} className="space-y-1">
                  <button
                    type="button"
                    onMouseDown={() => {
                      // ✅ Save BEFORE click (prevents scroll reset)
                      saveScrollNow();
                    }}
                    onClick={() => toggleGroup(item.key)}
                    className={[
                      groupHeaderBase,
                      isOpen ? "px-3 gap-2.5 justify-start" : "px-0 gap-0 justify-center",
                      groupActive ? activeStyles : inactiveStyles,
                    ].join(" ")}
                  >
                    <item.Icon size={18} className="shrink-0" />
                    {isOpen && (
                      <>
                        <span>{item.label}</span>
                        <ChevronDownIcon
                          size={16}
                          className={[
                            "ml-auto shrink-0 transition-transform text-slate-400",
                            expanded ? "rotate-180" : "rotate-0",
                          ].join(" ")}
                        />
                      </>
                    )}
                  </button>

                  {/* children (✅ transition) */}
                  {isOpen && (
                    <Collapse open={expanded}>
                      <div className="space-y-1 pl-2 pt-1">
                        {item.items.map((sub) => (
                          <NavLink
                            key={sub.label + sub.to}
                            to={sub.to}
                            className={({ isActive }) =>
                              [
                                subItemBase,
                                "px-3 gap-2.5 justify-start",
                                isActive ? activeStyles : inactiveStyles,
                              ].join(" ")
                            }
                            onClick={handleNavClick}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-500 shrink-0" />
                            <span className="truncate">{sub.label}</span>
                            {sub.badge?.text && <Badge text={sub.badge.text} />}
                          </NavLink>
                        ))}
                      </div>
                    </Collapse>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* SUPPORT */}
        <div>
          {isOpen && (
            <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500 mb-2.5">
              Support
            </div>
          )}
          <nav className="space-y-1">
            <NavLink
              to="/teacher/help"
              className={({ isActive }) =>
                [
                  navItemBase,
                  isOpen ? "px-3 gap-2.5 justify-start" : "px-0 gap-0 justify-center",
                  isActive ? activeStyles : inactiveStyles,
                  "text-slate-300",
                ].join(" ")
              }
              onClick={handleNavClick}
            >
              <HelpCircleIcon size={18} className="shrink-0" />
              {isOpen && <span>Help & docs</span>}
            </NavLink>
          </nav>
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-t border-slate-800 px-3 py-3 space-y-2">
        {isOpen && (
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-2 py-1.5">
            <span className="text-[11px] text-slate-400">Appearance</span>
            <div className="inline-flex items-center gap-1 rounded-xl bg-slate-900">
              <button
                type="button"
                onClick={toggleTheme}
                className={`h-7 w-7 rounded-lg grid place-items-center text-slate-300 ${
                  themeMode === "light" ? "bg-slate-100 text-slate-900" : "hover:bg-slate-800"
                }`}
                aria-label="Light theme"
              >
                <SunIcon size={15} />
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className={`h-7 w-7 rounded-lg grid place-items-center text-slate-300 ${
                  themeMode === "dark" ? "bg-slate-800 text-slate-50" : "hover:bg-slate-800"
                }`}
                aria-label="Dark theme"
              >
                <MoonIcon size={15} />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-slate-800 grid place-items-center text-xs font-semibold text-slate-100">
              <UserIcon size={14} />
            </div>
            {isOpen && (
              <div className="leading-tight">
                <p className="text-xs font-medium text-slate-100">{userName}</p>
                <p className="text-[11px] text-slate-500">{userId}</p>
              </div>
            )}
          </div>

          {isOpen && (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-800/80 transition"
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
        className={`hidden lg:block sticky top-0 h-screen overflow-hidden transition-[width] duration-150 ease-out ${
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
          className={`absolute inset-y-0 left-0 w-64 max-w-[80%] h-full bg-slate-950 shadow-2xl transform transition-transform duration-200 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {renderSidebarBody(mobileScrollRef)}
        </aside>
      </div>
    </>
  );
};
