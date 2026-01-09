// src/layouts/admin/AdminLayout.tsx
import React, { useEffect, useState, useMemo } from "react";
import { MenuIcon, LogOutIcon } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";
import { useAuth } from "../../contexts/AuthContext";

type Props = {
  children: React.ReactNode;
};

const SIDEBAR_KEY = "admin_sidebar_open";

function getInitialSidebarOpen() {
  if (typeof window === "undefined") return true;
  const saved = localStorage.getItem(SIDEBAR_KEY);
  if (saved === "1") return true;
  if (saved === "0") return false;
  return window.innerWidth >= 1024;
}

export const AdminLayout: React.FC<Props> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(() => getInitialSidebarOpen());
  const { logout, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, isOpen ? "1" : "0");
  }, [isOpen]);

  const toggle = () => setIsOpen((v) => !v);

  const adminName = user?.name || "Admin";
  const adminId = user?.registerNumber || "AD-0000";

  return (
    // ✅ fixed viewport height, no document scroll
    <div className="h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 overflow-hidden">
      <div className="flex h-full">
        {/* ✅ Sidebar */}
        <AdminSidebar isOpen={isOpen} onToggle={toggle} />

        {/* ✅ Main column */}
        <div className="flex-1 min-w-0 flex flex-col h-full">
          {/* ✅ Sticky header */}
          <header className="shrink-0 sticky top-0 z-30 bg-white/80 dark:bg-slate-950/70 backdrop-blur border-b border-slate-200 dark:border-slate-800">
            <div className="h-14 px-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggle}
                  className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900"
                  aria-label="Open menu"
                >
                  <MenuIcon size={18} />
                </button>

                <div className="leading-tight">
                  <div className="text-sm font-semibold">Admin Portal</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {adminName} • {adminId}
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                title="Logout"
              >
                <LogOutIcon size={16} />
              </button>
            </div>
          </header>

          {/* ✅ ONLY this scrolls */}
          <main className="flex-1 min-w-0 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
