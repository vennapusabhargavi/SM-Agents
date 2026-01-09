// src/layouts/student/StudentLayout.tsx
import React, { useEffect, useMemo, useState } from "react";
import { MenuIcon } from "lucide-react";
import StudentSidebar from "./StudentSidebar";
import { useAuth } from "../../contexts/AuthContext";

type StudentLayoutProps = {
  children: React.ReactNode;
};

const SIDEBAR_KEY = "student_sidebar_open";

function getInitialSidebarOpen() {
  if (typeof window === "undefined") return true;
  const saved = localStorage.getItem(SIDEBAR_KEY);
  if (saved === "1") return true;
  if (saved === "0") return false;
  return window.innerWidth >= 1024;
}

export function StudentLayout({ children }: StudentLayoutProps) {
  const [isOpen, setIsOpen] = useState<boolean>(() => getInitialSidebarOpen());
  const { user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, isOpen ? "1" : "0");
  }, [isOpen]);

  const studentName = user?.name || "Student";
  const regNo = user?.registerNumber || "REG-0000";

  const toggle = () => setIsOpen((v) => !v);

  return (
    // ✅ full app uses fixed-height viewport
    <div className="h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 overflow-hidden">
      <div className="flex h-full">
        {/* Sidebar column stays fixed-height */}
        <StudentSidebar isOpen={isOpen} onToggle={toggle} />

        {/* Main column */}
        <div className="flex-1 min-w-0 flex flex-col h-full">
          {/* Header is fixed/sticky inside main */}
          <header className="shrink-0 sticky top-0 z-30 bg-white/80 dark:bg-slate-900/70 backdrop-blur border-b border-slate-200 dark:border-slate-800">
            <div className="h-14 px-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggle}
                  className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Open menu"
                >
                  <MenuIcon size={18} />
                </button>

                <div className="leading-tight">
                  <div className="text-sm font-semibold">Student Portal</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {studentName} • {regNo}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* ✅ ONLY this area scrolls */}
          <main className="flex-1 min-w-0 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default StudentLayout;
