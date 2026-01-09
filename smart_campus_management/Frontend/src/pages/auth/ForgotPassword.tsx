import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft as ArrowLeftIcon,
  Mail as MailIcon,
  CheckCircle as CheckCircleIcon,
  Key as KeyIcon,
  Lock as LockIcon,
  Sun as SunIcon,
  Moon as MoonIcon,
} from 'lucide-react';

type Step = 'email' | 'otp' | 'reset' | 'success';

type ThemeMode = 'light' | 'dark' | 'system';
const THEME_KEY = 'theme';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost/smart_campus_api';

// THEME HELPERS (same caching behavior as login)
function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const shouldBeDark = mode === 'dark' || (mode === 'system' && prefersDark);
  root.classList.toggle('dark', !!shouldBeDark);
}

export const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<Step>('email');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const navigate = useNavigate();

  // Theme boot (same pattern as Login)
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

  // API HANDLERS
  const handleEmailSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to send verification code.');
        return;
      }

      setStep('otp');
    } catch (err) {
      console.error(err);
      setError('Unable to reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit code.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Invalid or expired code.');
        return;
      }

      setStep('reset');
    } catch (err) {
      console.error(err);
      setError('Unable to reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to reset password.');
        return;
      }

      setStep('success');
    } catch (err) {
      console.error(err);
      setError('Unable to reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // UI TEXT
  const heading = useMemo(() => {
    if (step === 'email') return 'Reset your password';
    if (step === 'otp') return 'Check your email';
    if (step === 'reset') return 'Set a new password';
    return 'Password updated';
  }, [step]);

  const subheading = useMemo(() => {
    if (step === 'email')
      return 'Enter the email linked to your account. We’ll send a verification code.';
    if (step === 'otp')
      return (
        <>
          We sent a 6-digit code to{' '}
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {email || 'your email'}
          </span>
          . Enter it below to continue.
        </>
      );
    if (step === 'reset') return 'Choose a strong password you don’t use elsewhere.';
    return 'You can now sign in using your new password.';
  }, [step, email]);

  const Badge = ({ kind }: { kind: 'mail' | 'key' | 'lock' | 'success' }) => {
    const base =
      'h-11 w-11 rounded-2xl grid place-items-center border shadow-sm backdrop-blur ' +
      'border-slate-200/80 dark:border-slate-700/60 ' +
      'bg-white/75 dark:bg-slate-900/55';
    if (kind === 'mail')
      return (
        <div className={base}>
          <MailIcon size={18} className="text-slate-800 dark:text-slate-100" />
        </div>
      );
    if (kind === 'key')
      return (
        <div className={base}>
          <KeyIcon size={18} className="text-slate-800 dark:text-slate-100" />
        </div>
      );
    if (kind === 'lock')
      return (
        <div className={base}>
          <LockIcon size={18} className="text-slate-800 dark:text-slate-100" />
        </div>
      );
    return (
      <div className={base}>
        <CheckCircleIcon size={18} className="text-emerald-600 dark:text-emerald-400" />
      </div>
    );
  };

  const inputClass =
    'w-full rounded-2xl pl-9 pr-3 py-3 text-sm outline-none transition ' +
    'border border-slate-200/80 dark:border-slate-700/60 ' +
    'bg-white/80 dark:bg-slate-900/55 ' +
    'text-slate-900 dark:text-slate-100 ' +
    'placeholder:text-slate-400 dark:placeholder:text-slate-400 ' +
    'hover:border-slate-300/80 dark:hover:border-slate-600/70 ' +
    'focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500/60';

  const primaryBtn =
    'w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition shadow-sm ' +
    'bg-teal-500 hover:bg-teal-600 active:translate-y-[1px] ' +
    'disabled:opacity-60 disabled:active:translate-y-0';

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

      <div className="relative mx-auto max-w-3xl px-4 py-10">
        {/* top utilities */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium
                         text-slate-700 dark:text-slate-200
                         bg-white/60 dark:bg-slate-900/40 backdrop-blur
                         border border-slate-200/70 dark:border-slate-800/60
                         hover:bg-white/80 dark:hover:bg-slate-900/60 transition"
            >
              <ArrowLeftIcon size={16} />
              Back
            </button>

            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium
                         text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition"
            >
              <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
              Smart Campus
            </Link>
          </div>

          {/* theme toggles */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme('light')}
              aria-label="Light"
              title="Light"
              className={[
                'h-10 w-10 rounded-2xl grid place-items-center backdrop-blur transition active:scale-[0.98]',
                'border border-slate-200/70 dark:border-slate-800/60',
                'bg-white/60 dark:bg-slate-900/40',
                'hover:bg-white/85 dark:hover:bg-slate-900/60',
                themeMode === 'light' ? 'ring-2 ring-slate-900/10 dark:ring-white/10' : '',
              ].join(' ')}
            >
              <SunIcon size={16} className="text-slate-800 dark:text-slate-100" />
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              aria-label="Dark"
              title="Dark"
              className={[
                'h-10 w-10 rounded-2xl grid place-items-center backdrop-blur transition active:scale-[0.98]',
                'border border-slate-200/70 dark:border-slate-800/60',
                'bg-white/60 dark:bg-slate-900/40',
                'hover:bg-white/85 dark:hover:bg-slate-900/60',
                themeMode === 'dark' ? 'ring-2 ring-slate-900/10 dark:ring-white/10' : '',
              ].join(' ')}
            >
              <MoonIcon size={16} className="text-slate-800 dark:text-slate-100" />
            </button>
          </div>
        </div>

        {/* content */}
        <div className="mt-10">
          <div className="mx-auto max-w-xl">
            <div className="flex items-start gap-4">
              <Badge
                kind={step === 'email' ? 'mail' : step === 'otp' ? 'key' : step === 'reset' ? 'lock' : 'success'}
              />
              <div className="pt-0.5">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  {heading}
                </h1>
                <p className="mt-2 text-sm sm:text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
                  {subheading}
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-white/30 bg-white/35 dark:bg-slate-950/45 backdrop-blur-xl shadow-[0_24px_90px_-45px_rgba(0,0,0,0.75)]">
              <div className="px-6 py-6 sm:px-7 sm:py-7">
                {error && (
                  <div className="mb-5 rounded-2xl border border-red-200/80 dark:border-red-500/35 bg-red-50/90 dark:bg-red-500/10 px-3 py-2 text-[12px] text-red-700 dark:text-red-200">
                    {error}
                  </div>
                )}

                {step === 'email' && (
                  <form onSubmit={handleEmailSubmit} className="space-y-5">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-[12px] font-semibold text-slate-700 dark:text-slate-200"
                      >
                        Email address
                      </label>
                      <div className="mt-1.5 relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-300">
                          <MailIcon size={16} />
                        </span>
                        <input
                          id="email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@clinic.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <button type="submit" disabled={loading} className={primaryBtn}>
                      {loading ? 'Sending…' : 'Send code'}
                    </button>
                  </form>
                )}

                {step === 'otp' && (
                  <form onSubmit={handleOtpSubmit} className="space-y-5">
                    <div>
                      <label
                        htmlFor="otp"
                        className="block text-[12px] font-semibold text-slate-700 dark:text-slate-200"
                      >
                        Verification code
                      </label>
                      <div className="mt-1.5 relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-300">
                          <KeyIcon size={16} />
                        </span>
                        <input
                          id="otp"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          placeholder="123456"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          className={`${inputClass} tracking-[0.35em] font-medium`}
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[12px] text-slate-600 dark:text-slate-300">
                        <button
                          type="button"
                          onClick={() => setStep('email')}
                          className="underline underline-offset-2 decoration-dotted hover:text-slate-900 dark:hover:text-slate-100 transition"
                        >
                          Use different email
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEmailSubmit()}
                          disabled={loading}
                          className="underline underline-offset-2 decoration-dotted hover:text-slate-900 dark:hover:text-slate-100 transition disabled:opacity-60"
                        >
                          Resend
                        </button>
                      </div>
                    </div>

                    <button type="submit" disabled={loading} className={primaryBtn}>
                      {loading ? 'Verifying…' : 'Continue'}
                    </button>
                  </form>
                )}

                {step === 'reset' && (
                  <form onSubmit={handleResetSubmit} className="space-y-5">
                    <div>
                      <label
                        htmlFor="newPassword"
                        className="block text-[12px] font-semibold text-slate-700 dark:text-slate-200"
                      >
                        New password
                      </label>
                      <div className="mt-1.5 relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-300">
                          <LockIcon size={16} />
                        </span>
                        <input
                          id="newPassword"
                          type="password"
                          autoComplete="new-password"
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                        Minimum 8 characters.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-[12px] font-semibold text-slate-700 dark:text-slate-200"
                      >
                        Confirm password
                      </label>
                      <div className="mt-1.5 relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-300">
                          <LockIcon size={16} />
                        </span>
                        <input
                          id="confirmPassword"
                          type="password"
                          autoComplete="new-password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <button type="submit" disabled={loading} className={primaryBtn}>
                      {loading ? 'Updating…' : 'Update password'}
                    </button>

                    <div className="text-center text-[12px] text-slate-600 dark:text-slate-300">
                      <button
                        type="button"
                        onClick={() => setStep('otp')}
                        className="underline underline-offset-2 decoration-dotted hover:text-slate-900 dark:hover:text-slate-100 transition"
                      >
                        Go back
                      </button>
                    </div>
                  </form>
                )}

                {step === 'success' && (
                  <div className="text-center py-2">
                    <div className="mx-auto h-12 w-12 rounded-2xl grid place-items-center border border-emerald-500/30 bg-emerald-500/10">
                      <CheckCircleIcon size={22} className="text-emerald-600 dark:text-emerald-400" />
                    </div>

                    <div className="mt-4 text-sm text-slate-700 dark:text-slate-200">
                      Your password has been updated.
                    </div>
                    <div className="mt-1 text-[12px] text-slate-600 dark:text-slate-300">
                      We also sent you a confirmation email for security.
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className={`${primaryBtn} mt-6`}
                    >
                      Return to login
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4 text-[12px] text-slate-600 dark:text-slate-300">
              <Link
                to="/login"
                className="hover:text-slate-900 dark:hover:text-slate-100 transition"
              >
                Login
              </Link>
              <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              <Link
                to="/create-account"
                className="hover:text-slate-900 dark:hover:text-slate-100 transition"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
