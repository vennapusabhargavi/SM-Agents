import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, LockIcon, CheckCircleIcon } from 'lucide-react';
export const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Simple validation
    if (!password || !confirmPassword) {
      setError('Please enter both password fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to reset password');
        return;
      }
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred');
    }
  };
  const handleReturn = () => {
    navigate('/login');
  };
  return <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 dark:from-purple-950 dark:via-indigo-900 dark:to-blue-900 flex items-center justify-center p-4">
      {/* Professional background pattern */}
      <div className="absolute inset-0 opacity-15 dark:opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(79, 70, 229, 0.3) 0%, transparent 50%),
                           radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)`,
          backgroundSize: '500px 500px'
        }} />
      </div>
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/30 bg-white/35 dark:bg-slate-950/45 backdrop-blur-xl shadow-[0_24px_90px_-45px_rgba(0,0,0,0.75)] p-8">
          <div className="mb-6">
            <Link to="/login" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              <ArrowLeftIcon size={16} className="mr-2" />
              Back to login
            </Link>
          </div>
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold mx-auto mb-4">
              SC
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Reset Your Password
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Create a new password for your account
            </p>
          </div>
          {!submitted ? <>
              {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm dark:bg-red-900/30 dark:text-red-300">
                  {error}
                </div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="password" className="label">
                    New Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-500">
                      <LockIcon size={18} />
                    </span>
                    <input id="password" type="password" className="input pl-10" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Password must be at least 8 characters
                  </p>
                </div>
                <div className="mb-6">
                  <label htmlFor="confirmPassword" className="label">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-500">
                      <LockIcon size={18} />
                    </span>
                    <input id="confirmPassword" type="password" className="input pl-10" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-colors shadow-sm">
                  Reset Password
                </button>
              </form>
            </> : <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon size={32} className="text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Password Reset Successfully
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Your password has been successfully reset. You can now use your
                new password to log in to your account.
              </p>
              <button onClick={handleReturn} className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-colors shadow-sm">
                Return to Login
              </button>
            </div>}
        </div>
      </div>
    </div>;
};