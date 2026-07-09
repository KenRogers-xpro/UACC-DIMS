'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Check,
  ArrowLeft,
  ShieldCheck,
  Lock,
} from 'lucide-react';

const features = [
  { text: 'Document management and secure retrieval' },
  { text: 'Procurement workflow and approvals' },
  { text: 'AI-powered operational insights' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');

    const result = await login(email, password);

    if (!result.success) {
      setError(result.error || 'Invalid email or password. Please try again.');
      setLoading(false);
    } else {
      setLoading(false);
      router.push('/dashboard');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading && !e.nativeEvent.isComposing) {
      handleSubmit();
    }
  };

  return (
    <div
      className="relative min-h-screen font-sans overflow-hidden"
      style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-secondary)' }}
    >
      {/* Animated dot-grid background */}
      <div className="dot-grid" />

      {/* Gold glow — top right */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none z-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(201,151,58,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Back to home */}
      <Link
        href="/"
        className="absolute top-5 left-5 z-50 flex items-center gap-1.5 text-xs
                   font-heading tracking-wider group"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft
          size={13}
          className="group-hover:-translate-x-0.5 transition-transform duration-200"
        />
        <span className="group-hover:text-uacc-gold-light transition-colors">Back to Home</span>
      </Link>

      {/* Two-column layout */}
      <div className="relative z-10 flex min-h-screen">

        {/* ──────────────────────────────────────────────────────
            LEFT PANEL (desktop only) — always dark navy
        ────────────────────────────────────────────────────── */}
        <div
          className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col flex-shrink-0 relative overflow-hidden"
          style={{ backgroundColor: '#060D1A' }}
        >
          {/* Subtle arc SVG ornament */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 520 100%"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M 0 100% A 520 520 0 0 1 520 0"
              stroke="rgba(204,34,0,0.06)"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
            <path
              d="M 0 100% A 380 380 0 0 1 380 20%"
              stroke="rgba(201,151,58,0.05)"
              strokeWidth="0.8"
            />
          </svg>

          {/* Gold vertical accent line on right edge */}
          <div
            className="absolute top-0 right-0 w-px h-full"
            style={{ background: 'linear-gradient(to bottom, transparent, rgba(201,151,58,0.20), transparent)' }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full px-12 py-14">
            {/* Logo */}
            <div>
              <Image
                src="/logo.png"
                alt="Uganda Air Cargo Corporation"
                height={52}
                width={200}
                className="object-contain"
                priority
              />
            </div>

            {/* Main heading block */}
            <div className="flex flex-col gap-5 mt-14">
              <div className="flex items-center gap-2">
                <span
                  className="text-[9px] font-heading font-bold uppercase tracking-[0.2em] px-2.5 py-1 rounded"
                  style={{
                    color: 'rgba(201,151,58,0.9)',
                    background: 'rgba(201,151,58,0.10)',
                    border: '1px solid rgba(201,151,58,0.20)',
                  }}
                >
                  Secure Access
                </span>
              </div>

              <h1 className="font-heading text-4xl xl:text-[46px] font-bold text-white
                             tracking-tight leading-[1.08] text-balance">
                Digital Information &amp; Management System
              </h1>

              <p className="text-sm leading-relaxed" style={{ color: 'rgba(160,174,192,0.85)', maxWidth: '300px' }}>
                Uganda Air Cargo Corporation&apos;s secure platform for document management,
                procurement workflows, and operational intelligence.
              </p>
            </div>

            {/* Thin gold divider */}
            <div
              className="w-12 h-px mt-10"
              style={{ background: 'rgba(201,151,58,0.5)' }}
            />

            {/* Feature list */}
            <div className="flex flex-col gap-4 mt-8">
              {features.map((feat) => (
                <div key={feat.text} className="flex items-start gap-3">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: 'rgba(201,151,58,0.12)',
                      border: '1px solid rgba(201,151,58,0.25)',
                    }}
                  >
                    <Check size={11} className="text-uacc-gold stroke-[2.5]" />
                  </div>
                  <span className="text-sm" style={{ color: 'rgba(203,213,224,0.85)' }}>
                    {feat.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Security note */}
            <div
              className="mt-auto flex items-center gap-2 pt-8"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <ShieldCheck size={13} style={{ color: 'rgba(201,151,58,0.6)', flexShrink: 0 }} />
              <p
                className="text-[10px] font-heading uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.20)' }}
              >
                Uganda Air Cargo &middot; Entebbe Int&apos;l Airport &middot; Est. 1994
              </p>
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────
            RIGHT PANEL — login form
        ────────────────────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-20 lg:py-12">
          <div
            className="w-full max-w-[440px]"
          >
            {/* Logo — mobile only */}
            <div className="lg:hidden mb-8 flex justify-center">
              <Image
                src="/logo.png"
                alt="Uganda Air Cargo Corporation"
                height={40}
                width={160}
                className="object-contain"
                priority
              />
            </div>

            {/* Form card */}
            <div
              className="rounded-2xl p-8 sm:p-10"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
              }}
            >
              {/* Card header */}
              <div className="flex flex-col gap-1.5 mb-8">
                <div className="flex items-center gap-2.5 mb-1">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: 'rgba(204,34,0,0.10)',
                      border: '1px solid rgba(204,34,0,0.22)',
                    }}
                  >
                    <Lock size={15} className="text-uacc-red" />
                  </div>
                </div>
                <h2
                  className="font-heading text-2xl font-bold leading-tight tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Sign In
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Enter your UACC credentials to continue
                </p>
              </div>

              {/* Form */}
              <div
                role="form"
                aria-label="DIMS Login Form"
                className="flex flex-col gap-5"
              >
                {/* Email */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="login-email"
                    className="text-[10px] font-heading font-semibold uppercase tracking-[0.12em]"
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
                    className="input-field"
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="login-password"
                    className="text-[10px] font-heading font-semibold uppercase tracking-[0.12em]"
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
                      className="input-field pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      disabled={loading}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2
                                 hover:text-uacc-gold-light transition-colors duration-150
                                 disabled:opacity-40"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-3 rounded-lg px-4 py-3 border animate-fadeIn"
                    style={{
                      backgroundColor: 'rgba(204,34,0,0.08)',
                      borderColor: 'rgba(204,34,0,0.25)',
                    }}
                  >
                    <AlertCircle size={14} className="text-uacc-red shrink-0 mt-0.5" />
                    <p className="text-xs leading-snug" style={{ color: '#f07060' }}>{error}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  id="login-submit-btn"
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-primary w-full rounded-lg py-3.5 font-heading font-bold
                             text-xs tracking-wider flex items-center justify-center gap-2
                             mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Authenticating&hellip;
                    </>
                  ) : (
                    'Sign In to DIMS'
                  )}
                </button>
              </div>

              {/* Below form */}
              <div className="mt-7 flex flex-col gap-3.5">
                <hr style={{ borderColor: 'var(--border-subtle)' }} />
                <p
                  className="text-center text-[11px] leading-relaxed"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Access is restricted to authorized UACC personnel only.
                </p>
                <p
                  className="text-center text-[10px] font-heading tracking-wider"
                  style={{ color: 'var(--text-faint)' }}
                >
                  DIMS v1.0 &nbsp;&middot;&nbsp; &copy; 2026 Uganda Air Cargo Corporation
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
