import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, NavigateFunction, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";


import {
  Hash as HashIcon,
  Lock as LockIcon,
  Sun as SunIcon,
  Moon as MoonIcon,
  Laptop2 as SystemIcon,
} from "lucide-react";

// Roles for Smart Campus
type Role = "ADMIN" | "FACULTY" | "STUDENT";

type ThemeMode = "light" | "dark" | "system";
const THEME_KEY = "theme";

// ---------- THEME HELPERS ----------
function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  const shouldBeDark = mode === "dark" || (mode === "system" && prefersDark);
  root.classList.toggle("dark", shouldBeDark);
}

// ---------- AUTH HELPERS ----------
function normalizeRoleString(value: unknown): Role | null {
  if (!value) return null;
  const upper = String(value).toUpperCase();
  if (upper === "ADMIN" || upper === "FACULTY" || upper === "STUDENT") return upper as Role;
  return null;
}

function redirectAfterAuth(role: Role, navigate: NavigateFunction) {
  if (role === "ADMIN") navigate("/admin/dashboard", { replace: true });
  else if (role === "FACULTY") navigate("/teacher/dashboard", { replace: true });
  else navigate("/student/dashboard", { replace: true });
}



export const Login: React.FC = () => {
  const [registerNumber, setRegisterNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role !== "ADMIN") {
        redirectAfterAuth(user.role, navigate);
      }
    }
  }, [isAuthenticated, user, navigate]);

  // theme boot
  useEffect(() => {
    const cached = (localStorage.getItem(THEME_KEY) as ThemeMode | null) ?? "system";
    const initial: ThemeMode =
      cached === "light" || cached === "dark" || cached === "system" ? cached : "system";

    setThemeMode(initial);
    applyTheme(initial);

    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      const current = (localStorage.getItem(THEME_KEY) as ThemeMode | null) ?? initial;
      if (current === "system") applyTheme("system");
    };

    mq?.addEventListener?.("change", onSystemChange);
    return () => mq?.removeEventListener?.("change", onSystemChange);
  }, []);

  const setTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    localStorage.setItem(THEME_KEY, mode);
    applyTheme(mode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const rn = registerNumber.trim().toUpperCase();
    if (!rn || !password) {
      setError("Please enter Register Number and Password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registerNumber: rn, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || "Invalid Register Number or Password.");
        return;
      }

      const data = await response.json();
      const role = normalizeRoleString(data.role);
      if (!role) {
        setError("Invalid user role received.");
        return;
      }

      // Use auth context to login
      login({
        id: data.userId,
        name: data.userName,
        role,
        registerNumber: data.registerNumber,
      }, data.token);
    } catch (err) {
      console.error(err);
      setError("Login failed due to an unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 dark:from-purple-950 dark:via-indigo-900 dark:to-blue-900 text-slate-900 dark:text-slate-50">
      {/* Professional background pattern */}
      <div className="absolute inset-0 opacity-15 dark:opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(79, 70, 229, 0.3) 0%, transparent 50%),
                           radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)`,
          backgroundSize: '500px 500px'
        }} />
      </div>

      {/* Center */}
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Theme controls (small, premium) */}
          <div className="flex justify-end mb-3">
            <div className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-300/80 bg-white/90 dark:bg-black/40 dark:border-white/30 backdrop-blur px-2 py-1.5 shadow-sm">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={[
                  "h-9 w-9 rounded-xl grid place-items-center transition",
                  themeMode === "light"
                    ? "bg-slate-800 text-white"
                    : "bg-white text-slate-900 dark:bg-white dark:text-slate-900",
                ].join(" ")}
                aria-label="Light theme"
                title="Light"
              >
                <SunIcon size={16} />
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={[
                  "h-9 w-9 rounded-xl grid place-items-center transition",
                  themeMode === "dark"
                    ? "bg-slate-800 text-white"
                    : "bg-white text-slate-900 dark:bg-white dark:text-slate-900",
                ].join(" ")}
                aria-label="Dark theme"
                title="Dark"
              >
                <MoonIcon size={16} />
              </button>
              <button
                type="button"
                onClick={() => setTheme("system")}
                className={[
                  "h-9 w-9 rounded-xl grid place-items-center transition",
                  themeMode === "system"
                    ? "bg-slate-800 text-white"
                    : "bg-white text-slate-900 dark:bg-white dark:text-slate-900",
                ].join(" ")}
                aria-label="System theme"
                title="System"
              >
                <SystemIcon size={16} />
              </button>
            </div>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl border border-white/30 bg-white/35 dark:bg-slate-950/45 backdrop-blur-xl shadow-[0_24px_90px_-45px_rgba(0,0,0,0.75)] overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-8 pb-6 text-center">
              <div className="flex items-center justify-center">
                <div className="rounded-xl bg-white/60 dark:bg-white/10 border border-white/50 dark:border-white/15 px-4 py-3 shadow-sm">
                  <img
                    src="/assets/logo.png"
                    alt="Smart Campus"
                    className="h-10 w-auto object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="text-slate-900 dark:text-slate-50 font-semibold tracking-wide text-sm">
                    SMART CAMPUS
                    <span className="font-normal opacity-80"> • MANAGEMENT</span>
                  </div>
                </div>
              </div>

              <h1 className="mt-5 text-2xl font-semibold text-sky-700 dark:text-sky-300">
                Sign In
              </h1>
            </div>

            {/* Form */}
            <div className="px-8 pb-8">
              {error && (
                <div className="mb-4 rounded-xl border border-red-200/80 dark:border-red-500/30 bg-red-50/80 dark:bg-red-500/10 px-3 py-2 text-[12px] text-red-700 dark:text-red-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 dark:text-slate-300">
                    <HashIcon size={16} />
                  </span>
                  <input
                    type="text"
                    value={registerNumber}
                    onChange={(e) => setRegisterNumber(e.target.value)}
                    placeholder="Register Number"
                    className={[
                      "w-full h-12 rounded-md px-10 text-sm outline-none transition",
                      "border border-slate-200/90 dark:border-white/10",
                      "bg-white/85 dark:bg-slate-900/55",
                      "text-slate-900 dark:text-slate-50",
                      "placeholder:text-slate-400 dark:placeholder:text-slate-400",
                      "focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500/60",
                    ].join(" ")}
                    autoComplete="off"
                  />
                </div>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 dark:text-slate-300">
                    <LockIcon size={16} />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className={[
                      "w-full h-12 rounded-md px-10 text-sm outline-none transition",
                      "border border-slate-200/90 dark:border-white/10",
                      "bg-white/85 dark:bg-slate-900/55",
                      "text-slate-900 dark:text-slate-50",
                      "placeholder:text-slate-400 dark:placeholder:text-slate-400",
                      "focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500/60",
                    ].join(" ")}
                    autoComplete="current-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={[
                    "w-28 h-10 rounded-md text-sm font-semibold text-white transition",
                    "bg-teal-500 hover:bg-teal-600",
                    "shadow-sm active:translate-y-[1px]",
                    "disabled:opacity-60 disabled:active:translate-y-0",
                  ].join(" ")}
                >
                  {loading ? "..." : "LOGIN"}
                </button>

                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-[12px] text-slate-700 dark:text-slate-200/90 hover:text-slate-900 dark:hover:text-white underline underline-offset-2"
                  >
                    Forgot password?
                  </button>
                  <Link
                    to="/create-account"
                    className="text-[12px] text-slate-700 dark:text-slate-200/90 hover:text-slate-900 dark:hover:text-white underline underline-offset-2"
                  >
                    Admin Signup
                  </Link>
                </div>


              </form>
            </div>

            {/* Footer (our own) */}
            <div className="px-6 py-3 border-t border-white/25 dark:border-white/10 bg-white/20 dark:bg-black/15 text-center text-[11px] text-slate-800/80 dark:text-white/70">
              © {year} Smart Campus Management System • All rights reserved
            </div>
          </div>

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
};
