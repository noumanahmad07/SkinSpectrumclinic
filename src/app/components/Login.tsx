import { useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const success = login(email, password);
    if (!success) {
      setError('Invalid credentials. Please use a @skinspectrum.com email.');
    }
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.06fr_0.94fr] bg-[#F7F2EA]">
      <div
        className="hidden lg:flex relative overflow-hidden min-h-screen"
        style={{
          background:
            'radial-gradient(circle at 18% 16%, rgba(232, 201, 138, 0.14), transparent 28%), radial-gradient(circle at 82% 72%, rgba(143, 96, 154, 0.2), transparent 34%), linear-gradient(135deg, #130A1D 0%, #241631 52%, #34213A 100%)',
        }}>
        <div className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(245, 236, 215, 0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(245, 236, 215, 0.9) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />

        <div className="relative z-10 flex min-h-screen w-full flex-col justify-between px-16 py-12">
          <div className="flex items-center gap-4 text-[#F8EEDB]">
            <div
              className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-[#E8C98A]/45 bg-black"
              style={{
                boxShadow: '0 18px 48px rgba(209, 173, 105, 0.28)',
              }}>
              <img src={ssaLogo} alt="Skin Spectrum Aesthetics" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-[#E8C98A] uppercase">
                Skin Spectrum
              </p>
              <p className="text-sm text-[#F8EEDB]/62">Clinical esthetics suite</p>
            </div>
          </div>

          <div className="max-w-xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#E8C98A]/25 bg-white/[0.06] px-4 py-2 text-sm font-medium text-[#F8EEDB]/86 shadow-[0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur">
              <Sparkles size={16} className="text-[#E8C98A]" />
              Premium staff dashboard
            </div>

            <h1
              style={{ fontFamily: 'var(--font-heading)' }}
              className="max-w-[680px] text-[4.7rem] font-bold leading-[0.94] text-[#FFF7E8]">
              Where Skin Meets Science
            </h1>

            <p className="mt-7 max-w-lg text-xl leading-8 text-[#F8EEDB]/76">
              Manage appointments, client care, billing, and inventory from one polished workspace.
            </p>

            <div className="mt-10 grid max-w-lg grid-cols-2 gap-4">
              {[
                ['24', 'active treatment rooms'],
                ['98%', 'client record accuracy'],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-lg border border-white/10 bg-white/[0.07] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.14)] backdrop-blur">
                  <p
                    style={{ fontFamily: 'var(--font-heading)' }}
                    className="text-4xl font-bold text-[#F4D58A]">
                    {value}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-[#F8EEDB]/64">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex max-w-xl items-center justify-between border-t border-white/10 pt-7 text-sm text-[#F8EEDB]/70">
            <span className="inline-flex items-center gap-2">
              <BadgeCheck size={18} className="text-[#E8C98A]" />
              Appointments synced
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#E8C98A]" />
              Staff access secured
            </span>
          </div>
        </div>
      </div>

      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-8">
        <div className="absolute inset-0"
          style={{
            background:
              'linear-gradient(145deg, #FCFAF6 0%, #F5EEE4 54%, #EFE4D8 100%)',
          }}
        />

        <div className="relative z-10 w-full max-w-[520px]">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-3">
              <div
                className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-black"
                style={{
                  boxShadow: '0 12px 28px rgba(201, 169, 110, 0.24)',
                }}>
                <img src={ssaLogo} alt="Skin Spectrum Aesthetics" className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.14em] text-[#A67F3F] uppercase">
                  Skin Spectrum
                </p>
                <p className="text-sm text-[#766B78]">Staff dashboard</p>
              </div>
            </div>
          </div>

          <div
            className="rounded-lg border border-white/80 bg-white/90 p-7 shadow-[0_24px_70px_rgba(50,33,49,0.12)] backdrop-blur sm:p-10">
            <div className="mb-8 flex items-start justify-between gap-5">
              <div>
                <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#F7EFE1] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#A67F3F]">
                  <ShieldCheck size={14} />
                  Staff Access
                </p>
                <h2
                  style={{ fontFamily: 'var(--font-heading)' }}
                  className="text-4xl font-bold leading-tight text-[#170D20] sm:text-5xl">
                  Welcome Back
                </h2>
                <p className="mt-3 text-base text-[#6E6472]">
                  Sign in to continue to Skin Spectrum.
                </p>
              </div>
              <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#1A1025] text-[#F2D794] shadow-[0_16px_32px_rgba(26,16,37,0.18)] sm:flex">
                <LockKeyhole size={21} />
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-lg border border-[#E5445A]/20 bg-[#E5445A]/10 p-4 text-sm font-medium text-[#BE3146]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#1A1025]">
                  Email Address
                </label>
                <div className="group relative">
                  <Mail
                    size={19}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A69BA8] transition-colors group-focus-within:text-[#B58A45]"
                  />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@skinspectrum.com"
                    required
                    className="h-14 w-full rounded-lg border border-[#E8DFD4] bg-[#FFFCF8] px-4 pl-12 text-[#21162B] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none transition-all placeholder:text-[#8C8390] focus:border-[#C9A96E] focus:bg-white focus:ring-4 focus:ring-[#C9A96E]/18"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#1A1025]">
                  Password
                </label>
                <div className="group relative">
                  <LockKeyhole
                    size={19}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A69BA8] transition-colors group-focus-within:text-[#B58A45]"
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="h-14 w-full rounded-lg border border-[#E8DFD4] bg-[#FFFCF8] px-4 pl-12 pr-12 text-[#21162B] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none transition-all placeholder:text-[#8C8390] focus:border-[#C9A96E] focus:bg-white focus:ring-4 focus:ring-[#C9A96E]/18"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#7F7482] transition-colors hover:bg-[#F7EFE1] hover:text-[#A67F3F]">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-[#D8CABA] text-[#C9A96E] focus:ring-[#C9A96E] focus:ring-offset-0"
                />
                  <label htmlFor="remember" className="ml-2 text-sm text-[#6B6570]">
                  Remember me for 30 days
                </label>
                </div>
                <span className="hidden text-sm font-medium text-[#A67F3F] sm:inline">Authorized staff only</span>
              </div>

              <button
                type="submit"
                className="group flex h-14 w-full items-center justify-center gap-2 rounded-lg px-6 font-semibold text-[#170D20] shadow-[0_14px_30px_rgba(201,169,110,0.28)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(201,169,110,0.36)] active:translate-y-0"
                style={{
                  background: 'linear-gradient(135deg, #C79C53 0%, #F0CF82 100%)',
                }}>
                Sign In
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-[#6B6570]">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#C9A96E] shadow-[0_0_0_5px_rgba(201,169,110,0.14)]" />
              Secure Skin Spectrum access
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
