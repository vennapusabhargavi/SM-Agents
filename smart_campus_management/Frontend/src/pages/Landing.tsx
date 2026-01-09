import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  PackageIcon,
  LineChartIcon,
  ClipboardListIcon,
  CheckIcon,
  UserIcon,
  UsersIcon,
  BuildingIcon,
  BriefcaseIcon,
  SunIcon,
  MoonIcon,
} from 'lucide-react';

type ThemeMode = 'light' | 'dark' | 'system';
const THEME_KEY = 'theme';

// --- THEME HELPERS (same cache key as Login/CreateAccount) ---
function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const shouldBeDark = mode === 'dark' || (mode === 'system' && prefersDark);
  root.classList.toggle('dark', !!shouldBeDark);
}

export const Landing: React.FC = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const navigate = useNavigate();

  // 🔐 AUTH GUARD: if user already logged in, redirect to role dashboard
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role = (localStorage.getItem('userRole') || '').toUpperCase();

    if (token && role) {
      if (role === 'ADMIN') {
        navigate('/app/AdminDashboard', { replace: true });
      } else if (role === 'DOCTOR') {
        navigate('/app/DoctorDashboard', { replace: true });
      } else {
        // default to patient
        navigate('/app/PatientDashboard', { replace: true });
      }
    }
  }, [navigate]);

  // theme boot (shared cache "theme")
  useEffect(() => {
    const cached = (localStorage.getItem(THEME_KEY) as ThemeMode | null) ?? 'system';
    const initial: ThemeMode =
      cached === 'light' || cached === 'dark' || cached === 'system' ? cached : 'system';

    setThemeMode(initial);
    applyTheme(initial);

    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onSystemChange = () => {
      const current = (localStorage.getItem(THEME_KEY) as ThemeMode | null) ?? initial;
      if (current === 'system') applyTheme('system');
    };

    mq?.addEventListener?.('change', onSystemChange);
    return () => mq?.removeEventListener?.('change', onSystemChange);
  }, []);

  const setTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    localStorage.setItem(THEME_KEY, mode);
    applyTheme(mode);
  };

  const cycleTheme = () => {
    const next: ThemeMode =
      themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'system' : 'light';
    setTheme(next);
  };

  const surface =
    'border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/45 backdrop-blur';
  const cardShadow = 'shadow-[0_26px_90px_-55px_rgba(15,23,42,0.45)]';
  const softShadow = 'shadow-[0_18px_55px_-40px_rgba(15,23,42,0.30)]';

  const navLink =
    'text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition';
  const pill =
    'inline-flex items-center gap-2 rounded-full border border-slate-200/70 dark:border-slate-800/70 bg-white/65 dark:bg-slate-900/45 px-3 py-1.5 text-[12px] font-semibold text-slate-700 dark:text-slate-200 backdrop-blur';

  const primaryBtn =
    'inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition shadow-sm ' +
    'bg-slate-900 text-white hover:bg-slate-800 active:translate-y-[1px] ' +
    'dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white';

  const secondaryBtn =
    'inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition ' +
    'border border-slate-200/80 dark:border-slate-700/70 ' +
    'bg-white/70 dark:bg-slate-900/45 ' +
    'text-slate-900 dark:text-slate-100 ' +
    'hover:bg-white dark:hover:bg-slate-900/70 active:translate-y-[1px]';

  const agentCards = useMemo(
    () => [
      {
        title: 'Appointments Agent',
        body: "Schedules, manages, and reminds patients—while optimizing your clinic’s calendar.",
        Icon: CalendarIcon,
        accent: 'text-sky-700 dark:text-sky-300',
        bg: 'bg-sky-500/10 dark:bg-sky-500/12',
        ring: 'ring-sky-500/10',
      },
      {
        title: 'Inventory Agent',
        body: 'Tracks supplies, predicts usage patterns, and prevents stockouts of critical materials.',
        Icon: PackageIcon,
        accent: 'text-amber-700 dark:text-amber-300',
        bg: 'bg-amber-500/10 dark:bg-amber-500/12',
        ring: 'ring-amber-500/10',
      },
      {
        title: 'Revenue Agent',
        body: 'Analyzes trends and provides actionable insights to improve profitability and cashflow.',
        Icon: LineChartIcon,
        accent: 'text-emerald-700 dark:text-emerald-300',
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/12',
        ring: 'ring-emerald-500/10',
      },
      {
        title: 'Case Tracking Agent',
        body: 'Monitors treatments, summarizes cases, and supports consistent, high-quality pathways.',
        Icon: ClipboardListIcon,
        accent: 'text-violet-700 dark:text-violet-300',
        bg: 'bg-violet-500/10 dark:bg-violet-500/12',
        ring: 'ring-violet-500/10',
      },
    ],
    [],
  );

  const benefits = useMemo(
    () => [
      {
        title: 'Automation',
        body: 'Reduce manual work with intelligent task handling and proactive workflows.',
      },
      {
        title: 'Accuracy',
        body: 'Minimize errors with AI-verified checks and consistent process enforcement.',
      },
      { title: 'Insights', body: 'Make faster decisions with analytics that surface what matters.' },
      { title: 'Efficiency', body: 'Improve resource allocation and scheduling utilization.' },
      { title: 'Satisfaction', body: 'Deliver a smoother patient experience with timely reminders.' },
      { title: 'Growth', body: 'Scale operations with support that adapts as your clinic expands.' },
    ],
    [],
  );

  const roles = useMemo(
    () => [
      {
        title: 'Dentist',
        body: 'Patient histories, treatment plans, and AI-assisted decision support.',
        Icon: UserIcon,
        accent: 'text-sky-700 dark:text-sky-300',
        bg: 'bg-sky-500/10 dark:bg-sky-500/12',
        bullets: ['Case analysis', 'Treatment tracking', 'Patient history'],
      },
      {
        title: 'Staff',
        body: 'Appointments, inventory, and day-to-day operations—done faster.',
        Icon: UsersIcon,
        accent: 'text-violet-700 dark:text-violet-300',
        bg: 'bg-violet-500/10 dark:bg-violet-500/12',
        bullets: ['Scheduling', 'Inventory management', 'Patient communication'],
      },
      {
        title: 'Manager',
        body: 'Performance metrics, financial analytics, and operational insights.',
        Icon: BuildingIcon,
        accent: 'text-emerald-700 dark:text-emerald-300',
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/12',
        bullets: ['Revenue analytics', 'Staff performance', 'Business insights'],
      },
      {
        title: 'Patient',
        body: 'Appointments, treatment details, and convenient payment options.',
        Icon: BriefcaseIcon,
        accent: 'text-amber-700 dark:text-amber-300',
        bg: 'bg-amber-500/10 dark:bg-amber-500/12',
        bullets: ['Self-scheduling', 'Treatment history', 'Payment management'],
      },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      {/* Global background (rich, smooth, subtle) */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-28 left-1/2 -translate-x-1/2 h-[720px] w-[720px] rounded-full bg-slate-900/[0.05] dark:bg-white/[0.06] blur-3xl" />
        <div className="absolute top-24 left-10 h-[420px] w-[420px] rounded-full bg-sky-500/10 dark:bg-sky-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[480px] w-[480px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(255,255,255,0.92),transparent)] dark:bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(2,6,23,0.22),transparent)]" />
      </div>

      {/* NAV */}
      <nav className="sticky top-0 z-20 border-b border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/55 grid place-items-center font-bold text-slate-900 dark:text-slate-50">
              DC
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-slate-900 dark:text-white">
                Dental Clinic Intelligence
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Agentic AI for modern clinic operations
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme */}
            <div className="hidden sm:flex items-center gap-1 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/65 dark:bg-slate-900/45 backdrop-blur px-1.5 py-1">
              <button
                type="button"
                onClick={() => setTheme('light')}
                title="Light"
                aria-label="Light theme"
                className={[
                  'h-9 w-9 rounded-xl grid place-items-center transition',
                  'text-slate-700 dark:text-slate-200',
                  'hover:bg-slate-100/80 dark:hover:bg-slate-800/70',
                  themeMode === 'light'
                    ? 'bg-slate-100/90 dark:bg-slate-800/80 ring-1 ring-slate-200/80 dark:ring-slate-700/60'
                    : '',
                ].join(' ')}
              >
                <SunIcon size={16} />
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                title="Dark"
                aria-label="Dark theme"
                className={[
                  'h-9 w-9 rounded-xl grid place-items-center transition',
                  'text-slate-700 dark:text-slate-200',
                  'hover:bg-slate-100/80 dark:hover:bg-slate-800/70',
                  themeMode === 'dark'
                    ? 'bg-slate-100/90 dark:bg-slate-800/80 ring-1 ring-slate-200/80 dark:ring-slate-700/60'
                    : '',
                ].join(' ')}
              >
                <MoonIcon size={16} />
              </button>

              <button
                type="button"
                onClick={cycleTheme}
                title="System / Cycle"
                aria-label="System theme"
                className={[
                  'h-9 w-9 rounded-xl grid place-items-center transition',
                  'hover:bg-slate-100/80 dark:hover:bg-slate-800/70',
                  themeMode === 'system'
                    ? 'bg-slate-100/90 dark:bg-slate-800/80 ring-1 ring-slate-200/80 dark:ring-slate-700/60'
                    : 'text-slate-700 dark:text-slate-200',
                ].join(' ')}
              >
                <span className="h-2 w-2 rounded-full bg-slate-900/35 dark:bg-white/35" />
              </button>
            </div>

            <Link to="/login" className={navLink}>
              Login
            </Link>

            <Link
              to="/create-account"
              className={[
                'inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition shadow-sm',
                'bg-slate-900 text-white hover:bg-slate-800',
                'dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white',
              ].join(' ')}
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-5">
              <span className={pill}>
                <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
                HIPAA-ready patterns • Role-based access • Audit-friendly
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-slate-900 dark:text-white leading-tight">
              Transform your clinic with{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-600 via-emerald-600 to-violet-600">
                Agentic AI
              </span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Four specialized AI agents streamline operations, reduce workload, and improve patient
              care—without changing how your team works.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
              <Link to="/login" className={primaryBtn}>
                Login
              </Link>
              <Link to="/app/AdminDashboard" className={secondaryBtn}>
                Explore Dashboard Demo
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-2 text-[12px] text-slate-500 dark:text-slate-400">
              <span className="px-2 py-1 rounded-full border border-slate-200/70 dark:border-slate-800/70 bg-white/60 dark:bg-slate-900/45">
                Faster scheduling
              </span>
              <span className="px-2 py-1 rounded-full border border-slate-200/70 dark:border-slate-800/70 bg-white/60 dark:bg-slate-900/45">
                Smarter inventory
              </span>
              <span className="px-2 py-1 rounded-full border border-slate-200/70 dark:border-slate-800/70 bg-white/60 dark:bg-slate-900/45">
                Revenue insights
              </span>
              <span className="px-2 py-1 rounded-full border border-slate-200/70 dark:border-slate-800/70 bg-white/60 dark:bg-slate-900/45">
                Case tracking
              </span>
            </div>
          </div>

          {/* Section divider */}
          <div className="mt-14 relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200/70 dark:border-slate-800/70" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white">
                AI Agents
              </span>
            </div>
          </div>

          {/* Agent cards */}
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {agentCards.map(({ title, body, Icon, accent, bg, ring }) => (
              <div
                key={title}
                className={[
                  'group rounded-3xl',
                  surface,
                  softShadow,
                  'p-6 transition-all',
                  'hover:translate-y-[-2px] hover:shadow-[0_24px_80px_-45px_rgba(15,23,42,0.55)]',
                ].join(' ')}
              >
                <div
                  className={[
                    'w-12 h-12 rounded-2xl grid place-items-center',
                    bg,
                    'ring-1',
                    ring,
                    'mb-4',
                    'transition-transform group-hover:scale-[1.03]',
                  ].join(' ')}
                >
                  <Icon size={22} className={accent} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">How it works</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              A clean integration flow that keeps your team focused on care—not tools.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                step: '01',
                title: 'Connect your data',
                body: 'Securely integrate practice systems so agents can learn from operational history.',
              },
              {
                step: '02',
                title: 'Continuous analysis',
                body: 'Agents monitor activity, detect patterns, and surface opportunities automatically.',
              },
              {
                step: '03',
                title: 'Automated intelligence',
                body: 'Get proactive alerts, recommendations, and workflow automation that saves time.',
              },
            ].map((s) => (
              <div key={s.step} className={`rounded-3xl ${surface} ${softShadow} p-6`}>
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    STEP
                  </div>
                  <div className="font-mono text-sm text-slate-500 dark:text-slate-400">
                    {s.step}
                  </div>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">Benefits</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Practical improvements you feel in day-to-day operations—without complexity.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {benefits.map((b) => (
              <div key={b.title} className={`rounded-3xl ${surface} ${softShadow} p-6`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-9 h-9 rounded-2xl grid place-items-center bg-slate-900/5 dark:bg-white/10 border border-slate-200/70 dark:border-slate-800/70">
                    <CheckIcon size={18} className="text-slate-900 dark:text-slate-100" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      {b.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {b.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USER ROLES */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">User roles</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Role-specific experiences—simple, clear, and aligned to responsibilities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {roles.map(({ title, body, Icon, accent, bg, bullets }) => (
              <div
                key={title}
                className={`rounded-3xl ${surface} ${softShadow} p-6 transition-all hover:translate-y-[-2px]`}
              >
                <div className={`w-12 h-12 rounded-2xl grid place-items-center ${bg} mb-4`}>
                  <Icon size={22} className={accent} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {body}
                </p>

                <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  {bullets.map((x) => (
                    <li key={x} className="flex items-center gap-2">
                      <CheckIcon size={16} className="text-slate-900/70 dark:text-slate-100/70" />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={[
              'rounded-[32px] p-10 sm:p-12',
              'border border-slate-200/70 dark:border-slate-800/70',
              'bg-gradient-to-br from-white/85 via-white/70 to-white/60 dark:from-slate-900/55 dark:via-slate-900/45 dark:to-slate-900/35',
              'backdrop-blur',
              cardShadow,
            ].join(' ')}
          >
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
                Ready to transform your dental practice?
              </h2>
              <p className="mt-3 text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Start with role-based access, clean dashboards, and agents that reduce workload from
                day one.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3">
                <Link to="/login" className={primaryBtn}>
                  Get Started
                </Link>
                <Link to="/app/AdminDashboard" className={secondaryBtn}>
                  View Demo
                </Link>
              </div>

              <div className="mt-6 text-[12px] text-slate-500 dark:text-slate-400">
                No heavy UI. Just a smooth, professional workflow.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/70 dark:border-slate-800/70 bg-white/60 dark:bg-slate-950/30 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-9 h-9 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/55 grid place-items-center font-bold text-slate-900 dark:text-slate-50 mr-2">
                  DC
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">
                  Dental Clinic AI
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                Transforming dental practices with intelligent AI solutions.
              </p>
            </div>

            {[
              {
                title: 'Product',
                items: ['Features', 'Pricing', 'Integrations', 'Security'],
              },
              {
                title: 'Company',
                items: ['About Us', 'Careers', 'Blog', 'Press'],
              },
              {
                title: 'Support',
                items: ['Help Center', 'Contact Us', 'Privacy Policy', 'Terms of Service'],
              },
            ].map((col) => (
              <div key={col.title}>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{col.title}</h3>
                <ul className="space-y-2 text-sm">
                  {col.items.map((x) => (
                    <li key={x}>
                      <a
                        href="#"
                        className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
                      >
                        {x}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200/70 dark:border-slate-800/70 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              © 2023 Dental Clinic Intelligence. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0 text-sm">
              {['Twitter', 'LinkedIn', 'Facebook', 'Instagram'].map((x) => (
                <a
                  key={x}
                  href="#"
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                >
                  {x}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
