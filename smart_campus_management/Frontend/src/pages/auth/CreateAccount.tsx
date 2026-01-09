import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, NavigateFunction } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircleIcon,
  Laptop2Icon,
  LockIcon,
  MailIcon,
  MapPinIcon,
  MoonIcon,
  PhoneIcon,
  ShieldIcon,
  SunIcon,
  UserIcon,
} from 'lucide-react';

type UserType = 'ADMIN' | 'FACULTY' | 'STUDENT';
type Role = 'ADMIN' | 'FACULTY' | 'STUDENT';
type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'theme';

// ✅ API endpoints (env first)
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost/smart_campus_api';
const REGISTER_URL = `${API_BASE}/api/auth/register`;
const LOGIN_URL = `${API_BASE}/api/auth/login`;
const EMAIL_OTP_REQUEST_URL = `${API_BASE}/api/auth/email-otp/request`;
const EMAIL_OTP_VERIFY_URL = `${API_BASE}/api/auth/email-otp/verify`;

// ---------- THEME HELPERS ----------
function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const shouldBeDark = mode === 'dark' || (mode === 'system' && prefersDark);
  root.classList.toggle('dark', !!shouldBeDark);
}

// ---------- AUTH HELPERS ----------
function normalizeRoleString(value: unknown): Role | null {
  if (!value) return null;
  const upper = String(value).toUpperCase();
  if (upper === 'ADMIN' || upper === 'FACULTY' || upper === 'STUDENT') {
    return upper as Role;
  }
  return null;
}

function normalizeRoleFromUserType(userType: UserType): Role {
  switch (userType) {
    case 'ADMIN':
      return 'ADMIN';
    case 'FACULTY':
      return 'FACULTY';
    default:
      return 'STUDENT';
  }
}

function redirectAfterAuth(role: Role, navigate: NavigateFunction) {
  if (role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
  else if (role === 'FACULTY') navigate('/teacher/dashboard', { replace: true });
  else navigate('/student/dashboard', { replace: true });
}

function isValidEmail(email: string) {
  // simple, safe check
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export const CreateAccount: React.FC = () => {
  const navigate = useNavigate();

  const userType: UserType = 'ADMIN';

  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [generatedId, setGeneratedId] = useState('');
  const [error, setError] = useState('');

  const [themeMode, setThemeMode] = useState<ThemeMode>('system');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  // Email OTP state (for sign-up verification)
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  const [emailOtpStatus, setEmailOtpStatus] = useState<string | null>(null);
  const [emailOtpError, setEmailOtpError] = useState<string | null>(null);
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);

  // Allow anyone to create accounts for signup
  // useEffect(() => {
  //   const token = localStorage.getItem('authToken');
  //   const storedRole = normalizeRoleString(localStorage.getItem('userRole'));
  //   if (!token || storedRole !== 'ADMIN') {
  //     navigate('/login', { replace: true });
  //   }
  // }, [navigate]);

  // Theme: load cache + apply, keep in sync with OS when mode is "system"
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

  const roleCopy = useMemo(() => ({
    eyebrow: 'For administration',
    title: 'Admin controls, simplified',
    body: 'Manage users, classrooms, exams, and permissions—clean and auditable.',
  }), []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'email') {
      // Reset email verification state if email changes
      setEmailOtpCode('');
      setEmailOtpSent(false);
      setEmailOtpVerified(false);
      setEmailOtpStatus(null);
      setEmailOtpError(null);
    }
  };

  // ---------- EMAIL OTP HANDLERS ----------
  const handleSendEmailOtp = async () => {
    setEmailOtpError(null);
    setEmailOtpStatus(null);

    const email = formData.email.trim();
    if (!email) {
      setEmailOtpError('Please enter your email first.');
      return;
    }
    if (!isValidEmail(email)) {
      setEmailOtpError('Please enter a valid email address.');
      return;
    }

    try {
      setEmailOtpLoading(true);
      const res = await fetch(EMAIL_OTP_REQUEST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEmailOtpError(data.message || 'Failed to send verification code.');
        return;
      }

      setEmailOtpSent(true);
      setEmailOtpVerified(false);
      setEmailOtpStatus('Verification code sent to your email.');
    } catch (err) {
      console.error('EMAIL OTP REQUEST ERROR:', err);
      setEmailOtpError('Unable to send verification code. Please try again.');
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    setEmailOtpError(null);
    setEmailOtpStatus(null);

    const email = formData.email.trim();
    if (!email) {
      setEmailOtpError('Please enter your email first.');
      return;
    }
    if (!emailOtpCode.trim()) {
      setEmailOtpError('Please enter the verification code.');
      return;
    }

    try {
      setEmailOtpLoading(true);
      const res = await fetch(EMAIL_OTP_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: emailOtpCode.trim() }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.valid) {
        setEmailOtpError(data.message || 'Invalid or expired code.');
        setEmailOtpVerified(false);
        return;
      }

      setEmailOtpVerified(true);
      setEmailOtpStatus('Email verified successfully.');
    } catch (err) {
      console.error('EMAIL OTP VERIFY ERROR:', err);
      setEmailOtpError('Unable to verify code. Please try again.');
    } finally {
      setEmailOtpLoading(false);
    }
  };

  // ---------- SUBMIT HANDLER ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const email = formData.email.trim();

    if (!formData.fullName || !email || !formData.password) {
      setError('Please fill in all required fields marked with *.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!emailOtpVerified) {
      setError('Please verify your email before creating your account.');
      return;
    }

    try {
      setLoading(true);

      // ✅ backend-safe role
      const roleUpper: Role = 'ADMIN';

      const res = await fetch(REGISTER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: roleUpper,
          userType,

          fullName: formData.fullName,
          email,
          phone: formData.phone || null,
          dob: formData.dob || null,
          gender: formData.gender || null,
          address: formData.address || null,
          password: formData.password,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || 'Failed to create account.');
        return;
      }

      setGeneratedId(data.uid || '');

      const apiRole = normalizeRoleString(data.role);
      const normalizedRole: Role = apiRole ?? roleUpper;

      // Prefer direct token from /register if backend returns it
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userRole', normalizedRole);
        localStorage.setItem('userId', data.uid || '');
        localStorage.setItem('userName', data.name || formData.fullName);

        redirectAfterAuth(normalizedRole, navigate);
        return;
      }

      // Fallback: auto-login once if register didn’t send token
      try {
        const loginRes = await fetch(LOGIN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password: formData.password,
            role: normalizedRole,
            userType,
          }),
        });

        const loginData = await loginRes.json().catch(() => ({}));
        if (!loginRes.ok) {
          setError(
            loginData.message ||
              'Account created, but automatic login failed. Please sign in manually.',
          );
          setStep('success');
          return;
        }

        const finalRole = normalizeRoleString(loginData.role) ?? normalizedRole;

        localStorage.setItem('authToken', loginData.token);
        localStorage.setItem('userRole', finalRole);
        localStorage.setItem('userId', loginData.uid || data.uid || '');
        localStorage.setItem('userName', loginData.name || formData.fullName);

        redirectAfterAuth(finalRole, navigate);
      } catch (fallbackErr) {
        console.error(fallbackErr);
        setError(
          'Your account was created, but automatic login failed due to a network issue. Please sign in manually.',
        );
        setStep('success');
      }
    } catch (err) {
      console.error(err);
      setError('Unable to reach server. Make sure Node server is running.');
    } finally {
      setLoading(false);
    }
  };

  const ThemeToggle = (
    <div className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-300/80 bg-white/90 dark:bg-black/40 backdrop-blur px-2 py-1.5 shadow-sm">
      <button
        type="button"
        onClick={() => setTheme('light')}
        aria-label="Light theme"
        title="Light"
        className={[
          'h-9 w-9 rounded-xl grid place-items-center transition',
          'text-slate-600 dark:text-slate-300',
          'hover:bg-slate-100/80 dark:hover:bg-slate-900/70',
          'active:scale-[0.98]',
          themeMode === 'light'
            ? 'bg-slate-100/90 dark:bg-slate-900/80 text-slate-900 dark:text-slate-50 ring-1 ring-slate-200/80 dark:ring-slate-800/80'
            : '',
        ].join(' ')}
      >
        <SunIcon size={16} />
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        aria-label="Dark theme"
        title="Dark"
        className={[
          'h-9 w-9 rounded-xl grid place-items-center transition',
          'text-slate-600 dark:text-slate-300',
          'hover:bg-slate-100/80 dark:hover:bg-slate-900/70',
          'active:scale-[0.98]',
          themeMode === 'dark'
            ? 'bg-slate-100/90 dark:bg-slate-900/80 text-slate-900 dark:text-slate-50 ring-1 ring-slate-200/80 dark:ring-slate-800/80'
            : '',
        ].join(' ')}
      >
        <MoonIcon size={16} />
      </button>

      <button
        type="button"
        onClick={() => setTheme('system')}
        aria-label="System theme"
        title="System"
        className={[
          'h-9 w-9 rounded-xl grid place-items-center transition',
          'text-slate-600 dark:text-slate-300',
          'hover:bg-slate-100/80 dark:hover:bg-slate-900/70',
          'active:scale-[0.98]',
          themeMode === 'system'
            ? 'bg-slate-100/90 dark:bg-slate-900/80 text-slate-900 dark:text-slate-50 ring-1 ring-slate-200/80 dark:ring-slate-800/80'
            : '',
        ].join(' ')}
      >
        <Laptop2Icon size={16} />
      </button>
    </div>
  );

  // SUCCESS SCREEN (only used when auto-login failed but account exists)
  if (step === 'success') {
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

        <div className="relative mx-auto max-w-6xl px-4 py-10">
          <div className="flex items-center justify-between">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition"
            >
              <ArrowLeftIcon size={16} />
              Back to login
            </Link>
            {ThemeToggle}
          </div>

          <div className="mt-10 mx-auto max-w-md">
            <div className="rounded-2xl border border-white/30 bg-white/35 dark:bg-slate-950/45 backdrop-blur-xl shadow-[0_24px_90px_-45px_rgba(0,0,0,0.75)] px-8 py-8">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mb-5">
                <CheckCircleIcon size={30} className="text-emerald-600 dark:text-emerald-400" />
              </div>

              <h2 className="text-2xl font-semibold tracking-tight">Admin account created</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Your admin access is ready.
              </p>

              {generatedId && (
                <div className="mt-6 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/70 dark:bg-slate-900/40 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    ID
                  </div>
                  <div className="mt-1 font-mono text-base font-semibold text-emerald-700 dark:text-emerald-300">
                    {generatedId}
                  </div>
                </div>
              )}

              {error && (
                <p className="mt-4 text-xs text-red-600 dark:text-red-300 leading-relaxed">
                  {error}
                </p>
              )}

              <button
                onClick={() => navigate('/login')}
                className="mt-6 w-full rounded-2xl bg-teal-500 text-white py-3.5 text-sm font-semibold shadow-sm hover:bg-teal-600 active:translate-y-[1px] transition"
              >
                Go to login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // FORM SCREEN
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

      <div className="relative mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-center justify-between">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition"
          >
            <ArrowLeftIcon size={16} />
            Back to login
          </Link>
          {ThemeToggle}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-[1.05fr,1fr] gap-10 items-start">
          {/* Left copy */}
          <div className="pt-3 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-950/60 backdrop-blur px-3 py-1.5">
              <ShieldIcon size={14} className="text-emerald-700 dark:text-emerald-300" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Smart Campus
              </span>
            </div>

            <div>
              <h1 className="text-4xl font-semibold tracking-tight">
                Create your{' '}
                <span className="text-emerald-700 dark:text-emerald-300">Smart Campus</span>{' '}
                account
              </h1>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Role-based access and a clean workflow—your experience adapts automatically.
              </p>
            </div>

            {/* Role copy card */}
            <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-950/70 backdrop-blur px-6 py-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.30)] hidden sm:block">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                {roleCopy.eyebrow}
              </div>
              <div className="mt-2 text-lg font-semibold">{roleCopy.title}</div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {roleCopy.body}
              </div>
            </div>
          </div>

          {/* Right: form card */}
          <div className="relative">
            <div className="rounded-2xl border border-white/30 bg-white/35 dark:bg-slate-950/45 backdrop-blur-xl shadow-[0_24px_90px_-45px_rgba(0,0,0,0.75)] px-6 py-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">Create admin account</div>
                  <div className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
                    Creating an{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      admin
                    </span>{' '}
                    profile
                  </div>
                </div>

                <div className="h-10 w-10 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/70 dark:bg-slate-900/40 grid place-items-center text-slate-700 dark:text-slate-200 font-bold">
                  SC
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mt-4 rounded-2xl border border-red-200/60 bg-red-50/60 dark:border-red-900/40 dark:bg-red-950/20 px-4 py-3 text-xs text-red-700 dark:text-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {/* Full name */}
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-[12px] font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Full name *
                  </label>
                  <div className="mt-1.5 relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                      <UserIcon size={16} />
                    </span>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="Your name"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={[
                        'w-full rounded-2xl pl-9 pr-3 py-3 text-sm outline-none transition',
                        'border border-slate-200/70 dark:border-slate-800/70',
                        'bg-white/70 dark:bg-slate-950/40',
                        'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                        'hover:border-slate-300/80 dark:hover:border-slate-700/80',
                        'focus:border-emerald-500/55 focus:ring-4 focus:ring-emerald-500/12',
                      ].join(' ')}
                    />
                  </div>
                </div>

                {/* Email + Send OTP */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-[12px] font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Email *
                  </label>
                  <div className="mt-1.5 flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                        <MailIcon size={16} />
                      </span>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        className={[
                          'w-full rounded-2xl pl-9 pr-3 py-3 text-sm outline-none transition',
                          'border border-slate-200/70 dark:border-slate-800/70',
                          'bg-white/70 dark:bg-slate-950/40',
                          'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                          'hover:border-slate-300/80 dark:hover:border-slate-700/80',
                          'focus:border-emerald-500/55 focus:ring-4 focus:ring-emerald-500/12',
                        ].join(' ')}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      disabled={emailOtpLoading || !formData.email.trim() || emailOtpVerified}
                      className={[
                        'rounded-2xl px-3 py-2.5 text-[12px] font-semibold whitespace-nowrap',
                        'border border-emerald-700/40 bg-emerald-600 text-white',
                        'hover:bg-emerald-700 active:translate-y-[1px]',
                        'disabled:opacity-60 disabled:hover:bg-emerald-600 disabled:active:translate-y-0',
                        'sm:w-auto w-full',
                      ].join(' ')}
                    >
                      {emailOtpVerified ? 'Verified' : emailOtpLoading ? 'Sending…' : 'Send OTP'}
                    </button>
                  </div>

                  {emailOtpStatus && (
                    <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-300">
                      {emailOtpStatus}
                    </p>
                  )}
                  {emailOtpError && (
                    <p className="mt-1 text-[11px] text-red-600 dark:text-red-300">
                      {emailOtpError}
                    </p>
                  )}
                </div>

                {/* Email OTP input + verify */}
                {emailOtpSent && !emailOtpVerified && (
                  <div>
                    <label
                      htmlFor="emailOtp"
                      className="block text-[12px] font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Email verification code
                    </label>
                    <div className="mt-1.5 flex flex-col sm:flex-row gap-2 sm:items-stretch">
                      <input
                        id="emailOtp"
                        name="emailOtp"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Enter 6-digit code"
                        value={emailOtpCode}
                        onChange={(e) => setEmailOtpCode(e.target.value)}
                        className={[
                          'w-full rounded-2xl px-3 py-3 text-sm outline-none transition',
                          'border border-slate-200/70 dark:border-slate-800/70',
                          'bg-white/70 dark:bg-slate-950/40',
                          'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                          'hover:border-slate-300/80 dark:hover:border-slate-700/80',
                          'focus:border-emerald-500/55 focus:ring-4 focus:ring-emerald-500/12',
                        ].join(' ')}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyEmailOtp}
                        disabled={emailOtpLoading || !emailOtpCode.trim()}
                        className={[
                          'rounded-2xl px-3 py-2.5 text-[12px] font-semibold whitespace-nowrap',
                          'border border-slate-800/70 bg-slate-900 text-slate-50',
                          'hover:bg-slate-800 active:translate-y-[1px]',
                          'disabled:opacity-60 disabled:hover:bg-slate-900 disabled:active:translate-y-0',
                          'sm:w-auto w-full',
                        ].join(' ')}
                      >
                        {emailOtpLoading ? 'Verifying…' : 'Verify code'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-[12px] font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Phone
                  </label>
                  <div className="mt-1.5 relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                      <PhoneIcon size={16} />
                    </span>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.phone}
                      onChange={handleChange}
                      className={[
                        'w-full rounded-2xl pl-9 pr-3 py-3 text-sm outline-none transition',
                        'border border-slate-200/70 dark:border-slate-800/70',
                        'bg-white/70 dark:bg-slate-950/40',
                        'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                        'hover:border-slate-300/80 dark:hover:border-slate-700/80',
                        'focus:border-emerald-500/55 focus:ring-4 focus:ring-emerald-500/12',
                      ].join(' ')}
                    />
                  </div>
                </div>

                {/* DOB & gender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="dob"
                      className="block text-[12px] font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Date of birth
                    </label>
                    <div className="mt-1.5 relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                        <CalendarIcon size={16} />
                      </span>
                      <input
                        id="dob"
                        name="dob"
                        type="date"
                        value={formData.dob}
                        onChange={handleChange}
                        className={[
                          'w-full rounded-2xl pl-9 pr-3 py-3 text-sm outline-none transition',
                          'border border-slate-200/70 dark:border-slate-800/70',
                          'bg-white/70 dark:bg-slate-950/40',
                          'hover:border-slate-300/80 dark:hover:border-slate-700/80',
                          'focus:border-emerald-500/55 focus:ring-4 focus:ring-emerald-500/12',
                        ].join(' ')}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="gender"
                      className="block text-[12px] font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Gender
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className={[
                        'mt-1.5 w-full rounded-2xl px-3 py-3 text-sm outline-none transition',
                        'border border-slate-200/70 dark:border-slate-800/70',
                        'bg-white/70 dark:bg-slate-950/40',
                        'hover:border-slate-300/80 dark:hover:border-slate-700/80',
                        'focus:border-emerald-500/55 focus:ring-4 focus:ring-emerald-500/12',
                      ].join(' ')}
                    >
                      <option value="">Select</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label
                    htmlFor="address"
                    className="block text-[12px] font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Address
                  </label>
                  <div className="mt-1.5 relative">
                    <span className="absolute top-3.5 left-3 text-slate-400 dark:text-slate-500">
                      <MapPinIcon size={16} />
                    </span>
                    <textarea
                      id="address"
                      name="address"
                      rows={3}
                      placeholder="Campus address or home address"
                      value={formData.address}
                      onChange={handleChange}
                      className={[
                        'w-full rounded-2xl pl-9 pr-3 py-3 text-sm outline-none transition resize-none',
                        'border border-slate-200/70 dark:border-slate-800/70',
                        'bg-white/70 dark:bg-slate-950/40',
                        'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                        'hover:border-slate-300/80 dark:hover:border-slate-700/80',
                        'focus:border-emerald-500/55 focus:ring-4 focus:ring-emerald-500/12',
                      ].join(' ')}
                    />
                  </div>
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-[12px] font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Password *
                    </label>
                    <div className="mt-1.5 relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                        <LockIcon size={16} />
                      </span>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        className={[
                          'w-full rounded-2xl pl-9 pr-3 py-3 text-sm outline-none transition',
                          'border border-slate-200/70 dark:border-slate-800/70',
                          'bg-white/70 dark:bg-slate-950/40',
                          'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                          'hover:border-slate-300/80 dark:hover:border-slate-700/80',
                          'focus:border-emerald-500/55 focus:ring-4 focus:ring-emerald-500/12',
                        ].join(' ')}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-[12px] font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Confirm *
                    </label>
                    <div className="mt-1.5 relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                        <LockIcon size={16} />
                      </span>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={[
                          'w-full rounded-2xl pl-9 pr-3 py-3 text-sm outline-none transition',
                          'border border-slate-200/70 dark:border-slate-800/70',
                          'bg-white/70 dark:bg-slate-950/40',
                          'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                          'hover:border-slate-300/80 dark:hover:border-slate-700/80',
                          'focus:border-emerald-500/55 focus:ring-4 focus:ring-emerald-500/12',
                        ].join(' ')}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !emailOtpVerified}
                  className={[
                    'w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition',
                    'bg-teal-500 hover:bg-teal-600',
                    'shadow-sm active:translate-y-[1px]',
                    'disabled:opacity-60 disabled:active:translate-y-0',
                  ].join(' ')}
                >
                  {loading ? 'Creating…' : 'Create account'}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between text-[12px] text-slate-600 dark:text-slate-300">
                <span>Already have an account?</span>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="font-semibold text-slate-900 dark:text-slate-50 hover:opacity-80 transition"
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAccount;
