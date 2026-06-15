import React, { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAuth } from '../App';
import ssaLogo from '../../assets/ssa-logo.png';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    await new Promise((r) => setTimeout(r, 400));

    const result = await login(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Invalid email or password, or this staff profile is not active.');
    }
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* ── Brand panel ── */}
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 10% 20%, rgba(232,201,138,0.12) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 90% 80%, rgba(143,96,154,0.18) 0%, transparent 50%), linear-gradient(160deg, #0E0716 0%, #1A1025 45%, #2A1835 100%)',
          }}
        />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(245,236,215,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(245,236,215,0.8) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Ambient orbs */}
        <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-[#C9A96E]/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-1/4 h-56 w-56 rounded-full bg-[#8F609A]/15 blur-3xl" />

        <div className="relative z-10 flex min-h-screen flex-col justify-between px-14 py-10 xl:px-20 xl:py-14">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-[#E8C98A]/30 bg-black/60 shadow-[0_8px_32px_rgba(201,169,110,0.2)] ring-1 ring-white/5">
              <img src={ssaLogo} alt="Skin Spectrum Aesthetics" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8C98A]">Skin Spectrum</p>
              <p className="text-[13px] text-[#F5ECD7]/50">Clinical esthetics suite</p>
            </div>
          </motion.div>

          {/* Hero copy */}
          <div className="max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#E8C98A]/20 bg-white/[0.05] px-3.5 py-1.5 text-[12px] font-medium text-[#F5ECD7]/80 backdrop-blur-sm">
              <Sparkles size={13} className="text-[#E8C98A]" />
              Premium staff dashboard
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.15, ease: 'easeOut' }}
              style={{ fontFamily: 'var(--font-heading)' }}
              className="text-[2.75rem] font-bold leading-[1.08] tracking-tight text-[#FFF7E8] xl:text-[3.25rem]">
              Where Skin
              <br />
              <span className="bg-gradient-to-r from-[#E8C98A] to-[#F5D88A] bg-clip-text text-transparent">
                Meets Science
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
              className="mt-5 max-w-md text-[15px] leading-relaxed text-[#F5ECD7]/60">
              Manage appointments, client care, billing, and inventory from one polished workspace built for clinical excellence.
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}
              className="mt-9 grid grid-cols-2 gap-3">
              {[
                { value: '24', label: 'active treatment rooms', icon: CalendarDays },
                { value: '98%', label: 'client record accuracy', icon: Users },
              ].map(({ value, label, icon: Icon }) => (
                <div
                  key={label}
                  className="group rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-sm transition-colors hover:border-[#E8C98A]/20 hover:bg-white/[0.06]">
                  <Icon size={15} className="mb-2.5 text-[#E8C98A]/60" strokeWidth={1.75} />
                  <p style={{ fontFamily: 'var(--font-heading)' }} className="text-2xl font-bold text-[#E8C98A]">
                    {value}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-[#F5ECD7]/45">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Footer trust signals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="flex items-center gap-6 border-t border-white/[0.07] pt-6 text-[12px] text-[#F5ECD7]/45">
            <span className="inline-flex items-center gap-2">
              <BadgeCheck size={15} className="text-[#E8C98A]/70" strokeWidth={1.75} />
              Appointments synced
            </span>
            <span className="h-3 w-px bg-white/10" />
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={15} className="text-[#E8C98A]/70" strokeWidth={1.75} />
              Staff access secured
            </span>
          </motion.div>
        </div>
      </div>

      {/* ── Login panel ── */}
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8F5F0] px-5 py-10 sm:px-8">
        {/* Background texture */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(201,169,110,0.08) 0%, transparent 60%), linear-gradient(180deg, #FAF7F2 0%, #F3EBE0 100%)',
          }}
        />
        <div className="pointer-events-none absolute -right-20 top-20 h-64 w-64 rounded-full bg-[#C9A96E]/8 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-32 h-48 w-48 rounded-full bg-[#1A1025]/5 blur-3xl" />

        <div className="relative z-10 w-full max-w-[440px]">
          {/* Mobile logo */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-7 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-[#1A1025] shadow-md">
              <img src={ssaLogo} alt="Skin Spectrum Aesthetics" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A07840]">Skin Spectrum</p>
              <p className="text-[12px] text-muted-foreground">Staff dashboard</p>
            </div>
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28, delay: 0.05 }}
            className="overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-[0_4px_6px_rgba(26,16,37,0.04),0_24px_64px_rgba(26,16,37,0.10)] backdrop-blur-sm">
            {/* Gold accent bar */}
            <div className="h-[3px] bg-gradient-to-r from-[#A07840] via-[#C9A96E] to-[#E8C98A]" />

            <div className="p-7 sm:p-9">
              {/* Header */}
              <div className="mb-7 flex items-start justify-between gap-4">
                <div>
                  <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#F5ECD7]/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A07840] ring-1 ring-[#C9A96E]/20">
                    <ShieldCheck size={11} strokeWidth={2.5} />
                    Staff Access
                  </span>
                  <h2
                    style={{ fontFamily: 'var(--font-heading)' }}
                    className="text-[1.75rem] font-bold leading-tight tracking-tight text-[#1A1025] sm:text-[2rem]">
                    Welcome back
                  </h2>
                  <p className="mt-1.5 text-[13px] text-muted-foreground">
                    Sign in to continue to Skin Spectrum
                  </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1A1025] text-[#E8C98A] shadow-[0_4px_16px_rgba(26,16,37,0.2)]">
                  <LockKeyhole size={18} strokeWidth={1.75} />
                </div>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-5 overflow-hidden rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-[13px] font-medium text-destructive">
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-[12px] font-semibold text-[#1A1025]">
                    Email address
                  </label>
                  <div className="group relative">
                    <Mail
                      size={16}
                      strokeWidth={1.75}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors group-focus-within:text-[#C9A96E]"
                    />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="staff@skinspectrum.com"
                      required
                      autoComplete="email"
                      className="h-11 w-full rounded-xl border border-border bg-[#FAFAF8] pl-10 pr-4 text-[13px] text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:border-[#C9A96E]/60 focus:bg-white focus:ring-[3px] focus:ring-[#C9A96E]/12"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="mb-1.5 block text-[12px] font-semibold text-[#1A1025]">
                    Password
                  </label>
                  <div className="group relative">
                    <LockKeyhole
                      size={16}
                      strokeWidth={1.75}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors group-focus-within:text-[#C9A96E]"
                    />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      className="h-11 w-full rounded-xl border border-border bg-[#FAFAF8] pl-10 pr-11 text-[13px] text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:border-[#C9A96E]/60 focus:bg-white focus:ring-[3px] focus:ring-[#C9A96E]/12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember + note */}
                <div className="flex items-center justify-between gap-3 pt-0.5">
                  <label htmlFor="remember" className="flex cursor-pointer items-center gap-2">
                    <input
                      id="remember"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-border text-[#C9A96E] focus:ring-[#C9A96E]/30 focus:ring-offset-0"
                    />
                    <span className="text-[12px] text-muted-foreground">Remember me for 30 days</span>
                  </label>
                  <Link to="/reset-password" className="text-[11px] font-medium text-[#A07840] transition-colors hover:text-[#1A1025]">
                    Forgot password?
                  </Link>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative mt-1 flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-[13px] font-semibold text-[#1A1025] shadow-[0_4px_16px_rgba(201,169,110,0.35)] transition-all hover:shadow-[0_6px_24px_rgba(201,169,110,0.45)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ background: 'linear-gradient(135deg, #B8894A 0%, #D4AD6A 50%, #E8C98A 100%)' }}>
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#1A1025]/20 border-t-[#1A1025]" />
                      Signing in…
                    </span>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight size={16} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-5 flex items-center justify-center gap-2 text-[12px] text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C9A96E]/40 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C9A96E]" />
            </span>
            Secure Skin Spectrum access
          </motion.p>
        </div>
      </div>
    </div>
  );
}
