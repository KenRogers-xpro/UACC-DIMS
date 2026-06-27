'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Check,
  ArrowLeft,
} from 'lucide-react';

// ─── Feature list items shown in the left panel ──────────────────────────────
const features = [
  'Document management & retrieval',
  'Procurement workflow & approvals',
  'AI-powered operational insights',
];

export default function LoginPage() {
  const router = useRouter();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Submit handler (NextAuth credentials) ───────────────────────────────────
  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
    } else {
      router.refresh();
    }
  };

  // ── Allow Enter key submission ───────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) handleSubmit();
  };

  return (
    <div
      className="relative min-h-screen font-sans overflow-hidden"
      style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-secondary)' }}
    >
      {/* ── Animated dot-grid background ───────────────────────────────────── */}
      <div className="dot-grid" />

      {/* ── Gold radial glow — top-right ────────────────────────────────────── */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-uacc-gold/10 to-transparent rounded-full blur-[120px] pointer-events-none z-0" />

      {/* ── Back to home link ───────────────────────────────────────────────── */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-50 flex items-center gap-2 hover:text-uacc-gold-light text-xs font-heading tracking-wider transition-colors duration-200 group"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft
          size={14}
          className="group-hover:-translate-x-0.5 transition-transform duration-200"
        />
        Back to Home
      </Link>

      {/* ── Two-column layout wrapper ───────────────────────────────────────── */}
      <div className="relative z-10 flex min-h-screen">

        {/* ══════════════════════════════════════════════════════════════════
            LEFT PANEL — desktop only (hidden on mobile)
            Stays dark navy (#0A1628) in both themes for brand identity
        ══════════════════════════════════════════════════════════════════ */}
        <div
          className="hidden lg:flex lg:w-1/2 flex-col justify-between py-16 px-14 relative overflow-hidden"
          style={{ backgroundColor: '#0A1628' }}
        >
          {/* Subtle red arc SVG ornament — low opacity */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.08] text-uacc-red z-0">
            <svg
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              <path
                d="M 0 100 A 100 100 0 0 1 100 0"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <path
                d="M 0 100 A 85 85 0 0 1 85 15"
                stroke="currentColor"
                strokeWidth="0.5"
              />
              <path
                d="M 0 100 A 115 115 0 0 1 115 -15"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          {/* ── Main centered content ─────────────────────────────────────── */}
          <div className="flex flex-col justify-center flex-1 gap-10 relative z-10">
            {/* UACC Logo */}
            <div>
              <Image
                src="/logo.png"
                alt="Uganda Air Cargo Corporation"
                height={60}
                width={240}
                className="object-contain"
                priority
              />
            </div>

            {/* Heading block */}
            <div className="flex flex-col gap-4">
              <h1 className="font-heading text-4xl xl:text-5xl font-bold text-white tracking-tight leading-[1.1]">
                Secure Access to DIMS
              </h1>
              <p className="text-sm md:text-base leading-relaxed max-w-sm" style={{ color: '#cbd5e0' }}>
                Digital Information and Management System &mdash; Uganda Air
                Cargo Corporation
              </p>
            </div>

            {/* Gold thin divider */}
            <div className="w-full h-px bg-gradient-to-r from-uacc-gold/60 via-uacc-gold/20 to-transparent" />

            {/* Feature rows */}
            <div className="flex flex-col gap-5">
              {features.map((feat) => (
                <div key={feat} className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-uacc-gold/15 border border-uacc-gold/30 flex items-center justify-center">
                    <Check size={13} className="text-uacc-gold stroke-[2.5]" />
                  </div>
                  <span className="text-white/90 text-sm">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom label */}
          <p className="text-[10px] text-white/25 font-heading tracking-widest uppercase relative z-10">
            Uganda Air Cargo Corporation &middot; Entebbe International Airport
            &middot; Est. 1994
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            RIGHT PANEL — login card (full width on mobile, 50% on desktop)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-5 sm:px-8 py-20 lg:py-12">
          {/* Glass card */}
          <div
            className="w-full max-w-[460px] glass-panel rounded-2xl p-8 sm:p-10 shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
          >
            {/* ── Card Header ──────────────────────────────────────────── */}
            <div className="flex flex-col gap-2 mb-8">
              {/* Logo — mobile only */}
              <div className="lg:hidden mb-4">
                <Image
                  src="/logo.png"
                  alt="Uganda Air Cargo Corporation"
                  height={36}
                  width={150}
                  className="object-contain"
                  priority
                />
              </div>

              <h2
                className="font-heading text-[28px] font-bold leading-tight tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Sign In
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Enter your credentials to access DIMS
              </p>
            </div>

            {/* ── Form (div with role="form", no <form> tag) ───────────── */}
            <div
              role="form"
              aria-label="DIMS Login Form"
              className="flex flex-col gap-5"
            >
              {/* Email field */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="login-email"
                  className="text-xs font-heading font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="your.email@uacc.go.ug"
                  autoComplete="email"
                  disabled={loading}
                  className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Password field */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="login-password"
                  className="text-xs font-heading font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                    className="input-field pr-12 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    id="toggle-password-visibility"
                    onClick={() => setShowPassword((v) => !v)}
                    disabled={loading}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-uacc-gold-light transition-colors duration-200 disabled:opacity-40"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div
                  role="alert"
                  className="flex items-center gap-3 rounded-lg px-4 py-3 border border-uacc-red/30 animate-fadeIn"
                  style={{ backgroundColor: 'rgba(204,34,0,0.10)' }}
                >
                  <AlertCircle
                    size={15}
                    className="text-uacc-red shrink-0"
                  />
                  <p className="text-xs text-uacc-red leading-snug">{error}</p>
                </div>
              )}

              {/* Submit button */}
              <button
                id="login-submit-btn"
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary w-full rounded-lg py-3.5 font-heading font-bold text-xs tracking-wider flex items-center justify-center gap-2.5 mt-1 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Authenticating&hellip;
                  </>
                ) : (
                  'Sign In to DIMS'
                )}
              </button>
            </div>

            {/* ── Below form ────────────────────────────────────────────── */}
            <div className="mt-8 flex flex-col gap-4">
              <hr style={{ borderColor: 'var(--border-subtle)' }} />
              <p className="text-center text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Access is restricted to authorized UACC personnel only.
              </p>
              <p className="text-center text-[10px] font-heading tracking-wider" style={{ color: 'var(--text-faint)' }}>
                DIMS v1.0 &nbsp;&middot;&nbsp; &copy; 2026 Uganda Air Cargo
                Corporation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
