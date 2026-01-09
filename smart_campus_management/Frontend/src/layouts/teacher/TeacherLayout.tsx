import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { PanelLeftIcon } from "lucide-react";
import { TeacherSidebar } from "./TeacherSidebar";
import { useAuth } from "../../contexts/AuthContext";

const SIDEBAR_KEY = "teacher_sidebar_open";

function getInitialSidebarOpen() {
  if (typeof window === "undefined") return true;
  const saved = localStorage.getItem(SIDEBAR_KEY);
  if (saved === "1") return true;
  if (saved === "0") return false;
  return window.innerWidth >= 1024;
}

export default function TeacherLayout() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() =>
    getInitialSidebarOpen()
  );
  const { user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, sidebarOpen ? "1" : "0");
  }, [sidebarOpen]);

  const toggleSidebar = () => setSidebarOpen((v) => !v);

  return (
    <div className="h-screen w-full overflow-hidden bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="flex h-full">
        <TeacherSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

        <div className="flex min-w-0 flex-1 flex-col h-full">
          {/* Mobile header */}
          <header className="lg:hidden shrink-0 sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-950">
            <button
              type="button"
              onClick={toggleSidebar}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200"
              aria-label="Toggle sidebar"
            >
              <PanelLeftIcon size={18} />
            </button>

            <div className="min-w-0">
              <div className="text-sm font-semibold leading-tight truncate">
                Teacher Console
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user?.name || "Teacher"} • {user?.registerNumber || "EMP-0000"}
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50 p-4 lg:p-6 dark:bg-slate-900/40">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
