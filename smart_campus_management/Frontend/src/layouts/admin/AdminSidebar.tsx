import React, { useEffect, useState } from "react";
import {
  LayoutDashboardIcon,
  DoorClosedIcon,
  ClipboardListIcon,
  WalletIcon,
  BriefcaseIcon,
  BellIcon,
  HelpCircleIcon,
  PanelLeftIcon,
  SunIcon,
  MoonIcon,
  LogOutIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { clearAuth } from "../../components/ProtectedRoute";
import { useAuth } from "../../contexts/AuthContext";

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

type ThemeMode = "light" | "dark";
const THEME_KEY = "theme";

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

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  onToggle,
}) => {
  const { user, logout } = useAuth();
  const userName = user?.name || "Admin";
  const userId = user?.registerNumber || "AD-0000";
  const navigate = useNavigate();

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(themeMode);
    localStorage.setItem(THEME_KEY, themeMode);
  }, [themeMode]);

  const handleLogout = () => {
    logout();
  };

  const handleNavClick = () => {
    if (window.innerWidth < 1024) onToggle();
  };

  const itemClass = (isActive: boolean) =>
    [
      navItemBase,
      isOpen ? "px-3 gap-2.5 justify-start" : "px-0 gap-0 justify-center",
      isActive
        ? "bg-indigo-500/15 text-indigo-200"
        : "text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800/80",
    ].join(" ");

  const SidebarBody: React.FC = () => (
    <div className="flex h-full flex-col bg-neutral-950 text-neutral-50 border-r border-neutral-800">
      {/* HEADER */}
      <div
        className={`flex items-center border-b border-neutral-800 gap-2 ${
          isOpen ? "justify-between px-3 pt-3 pb-3" : "justify-center px-1 py-3"
        }`}
      >
        {isOpen && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-sky-400 flex items-center justify-center font-bold text-neutral-950 text-sm">
              AD
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-neutral-50">
                Admin portal
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onToggle}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-800 text-neutral-400"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <PanelLeftIcon
            size={18}
            className={isOpen ? "rotate-180 transition-transform" : "transition-transform"}
          />
        </button>
      </div>

      {/* NAV */}
      <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto scrollbar-hide">
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) => itemClass(isActive)}
          onClick={handleNavClick}
        >
          <LayoutDashboardIcon size={18} />
          {isOpen && <span>Dashboard</span>}
        </NavLink>

        {/* NEW: Accounts */}
        <NavLink
          to="/admin/accounts"
          className={({ isActive }) => itemClass(isActive)}
          onClick={handleNavClick}
        >
          <UsersIcon size={18} />
          {isOpen && <span>Accounts</span>}
        </NavLink>

        <NavLink
          to="/admin/courses"
          className={({ isActive }) => itemClass(isActive)}
          onClick={handleNavClick}
        >
          <ClipboardListIcon size={18} />
          {isOpen && <span>Courses</span>}
        </NavLink>

        <NavLink
          to="/admin/classrooms"
          className={({ isActive }) => itemClass(isActive)}
          onClick={handleNavClick}
        >
          <DoorClosedIcon size={18} />
          {isOpen && <span>Classrooms</span>}
        </NavLink>

        <NavLink
          to="/admin/exams"
          className={({ isActive }) => itemClass(isActive)}
          onClick={handleNavClick}
        >
          <ClipboardListIcon size={18} />
          {isOpen && <span>Examinations</span>}
        </NavLink>

        <NavLink
          to="/admin/fees"
          className={({ isActive }) => itemClass(isActive)}
          onClick={handleNavClick}
        >
          <WalletIcon size={18} />
          {isOpen && <span>Fees & Finance</span>}
        </NavLink>

        <NavLink
          to="/admin/placements"
          className={({ isActive }) => itemClass(isActive)}
          onClick={handleNavClick}
        >
          <BriefcaseIcon size={18} />
          {isOpen && <span>Placements</span>}
        </NavLink>

        <NavLink
          to="/admin/notifications"
          className={({ isActive }) => itemClass(isActive)}
          onClick={handleNavClick}
        >
          <BellIcon size={18} />
          {isOpen && <span>Notifications</span>}
        </NavLink>

        <NavLink
          to="/admin/help"
          className={({ isActive }) => itemClass(isActive)}
          onClick={handleNavClick}
        >
          <HelpCircleIcon size={18} />
          {isOpen && <span>Help</span>}
        </NavLink>
      </nav>

      {/* FOOTER */}
      <div className="border-t border-neutral-800 px-3 py-3 space-y-2">
        {isOpen && (
          <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 px-2 py-1.5">
            <span className="text-[11px] text-neutral-400">Appearance</span>
            <div className="inline-flex items-center gap-1 rounded-xl bg-neutral-900">
              <button
                type="button"
                onClick={() => setThemeMode("light")}
                className={`h-7 w-7 rounded-lg grid place-items-center ${
                  themeMode === "light"
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-neutral-300 hover:bg-neutral-800"
                }`}
                aria-label="Light theme"
                title="Light"
              >
                <SunIcon size={15} />
              </button>
              <button
                type="button"
                onClick={() => setThemeMode("dark")}
                className={`h-7 w-7 rounded-lg grid place-items-center ${
                  themeMode === "dark"
                    ? "bg-neutral-800 text-neutral-50"
                    : "text-neutral-300 hover:bg-neutral-800"
                }`}
                aria-label="Dark theme"
                title="Dark"
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
        <SidebarBody />
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
          onClick={onToggle}
          aria-hidden="true"
        />
        <aside
          className={`absolute inset-y-0 left-0 w-64 max-w-[80%] h-full shadow-2xl transform transition-transform duration-200 bg-neutral-950 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarBody />
        </aside>
      </div>
    </>
  );
};
