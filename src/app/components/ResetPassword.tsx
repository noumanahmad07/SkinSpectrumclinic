import React, { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Check, LockKeyhole, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import ssaLogo from '../../assets/ssa-logo.png';
import { sendPasswordResetEmail, updateSupabasePassword } from '../lib/supabase';

function getRecoveryToken() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const queryParams = new URLSearchParams(window.location.search);
  return hashParams.get('access_token') || queryParams.get('access_token') || '';
}

function getReadableError(error: unknown) {
  if (!(error instanceof Error) || !error.message) return '';

  try {
    const parsed = JSON.parse(error.message) as { msg?: string; message?: string; error_description?: string };
    return parsed.msg || parsed.message || parsed.error_description || error.message;
  } catch {
    return error.message;
  }
}

export default function ResetPassword() {
  const recoveryToken = useMemo(() => getRecoveryToken(), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!email.trim()) {
      setError('Please enter your staff email.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(email.trim().toLowerCase(), `${window.location.origin}/reset-password`);
      setMessage('Reset link sent. Please check your email inbox.');
    } catch (err) {
      const detail = getReadableError(err);
      setError(detail ? `Could not send reset link. ${detail}` : 'Could not send reset link. Please check Supabase Auth email and redirect settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!recoveryToken) {
      setError('Reset token is missing. Please open the reset link from your email again.');
      return;
    }
    if (password.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await updateSupabasePassword(recoveryToken, password);
      setMessage('Password updated successfully. You can now sign in.');
      window.history.replaceState(null, '', '/reset-password');
    } catch (err) {
      const detail = getReadableError(err);
      setError(detail ? `Could not update password. ${detail}` : 'Could not update password. The reset link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F5F0] px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className="w-full max-w-[440px] overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-[0_24px_64px_rgba(26,16,37,0.10)]">
        <div className="h-[3px] bg-gradient-to-r from-[#A07840] via-[#C9A96E] to-[#E8C98A]" />
        <div className="p-7 sm:p-9">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-[#1A1025] shadow-md">
                  <img src={ssaLogo} alt="Skin Spectrum Aesthetics" className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A07840]">Skin Spectrum</p>
                  <p className="text-[12px] text-muted-foreground">Staff password reset</p>
                </div>
              </div>
              <h1 style={{ fontFamily: 'var(--font-heading)' }} className="text-[1.75rem] font-bold leading-tight text-[#1A1025]">
                {recoveryToken ? 'Set new password' : 'Reset password'}
              </h1>
              <p className="mt-1.5 text-[13px] text-muted-foreground">
                {recoveryToken ? 'Enter a new password for your staff account.' : 'We will email you a secure reset link.'}
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1A1025] text-[#E8C98A]">
              <LockKeyhole size={18} strokeWidth={1.75} />
            </div>
          </div>

          {error && <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-[13px] font-medium text-destructive">{error}</div>}
          {message && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-[#2ECC8A]/20 bg-[#2ECC8A]/10 px-4 py-3 text-[13px] font-medium text-[#159B61]">
              <Check size={16} className="mt-0.5 shrink-0" />
              {message}
            </div>
          )}

          {recoveryToken ? (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#1A1025]">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="h-11 w-full rounded-xl border border-border bg-[#FAFAF8] px-4 text-[13px] outline-none focus:border-[#C9A96E]/60 focus:bg-white focus:ring-[3px] focus:ring-[#C9A96E]/12"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#1A1025]">Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm new password"
                  className="h-11 w-full rounded-xl border border-border bg-[#FAFAF8] px-4 text-[13px] outline-none focus:border-[#C9A96E]/60 focus:bg-white focus:ring-[3px] focus:ring-[#C9A96E]/12"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl text-[13px] font-semibold text-[#1A1025] shadow-[0_4px_16px_rgba(201,169,110,0.35)] disabled:opacity-70"
                style={{ background: 'linear-gradient(135deg, #B8894A 0%, #D4AD6A 50%, #E8C98A 100%)' }}>
                {loading ? 'Updating...' : 'Update password'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSendReset} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#1A1025]">Email address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@skinspectrum.com"
                    className="h-11 w-full rounded-xl border border-border bg-[#FAFAF8] pl-10 pr-4 text-[13px] outline-none focus:border-[#C9A96E]/60 focus:bg-white focus:ring-[3px] focus:ring-[#C9A96E]/12"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl text-[13px] font-semibold text-[#1A1025] shadow-[0_4px_16px_rgba(201,169,110,0.35)] disabled:opacity-70"
                style={{ background: 'linear-gradient(135deg, #B8894A 0%, #D4AD6A 50%, #E8C98A 100%)' }}>
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}

          <Link to="/login" className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#A07840] hover:text-[#1A1025]">
            <ArrowLeft size={14} />
            Back to sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
