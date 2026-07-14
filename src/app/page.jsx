'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
// using standard <img> for external logo URL
import { 
  FileText, 
  ClipboardList, 
  Clock, 
  BarChart2, 
  User, 
  Building2, 
  Shield, 
  Settings, 
  Search, 
  Menu, 
  X, 
  Check, 
  Plane, 
  Bot, 
  Send,
  Briefcase,
  UserCheck,
  FileArchive,
  ShoppingCart,
  Users,
  TrendingUp,
  Megaphone,
  Inbox,
  ScrollText,
} from 'lucide-react';

// Helper component for animated number counting
function CountingNumber({ value, duration = 2 }) {
  const [count, setCount] = useState(0);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    
    let start = 0;
    const increment = value / (duration * 60); // 60fps
    const interval = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(interval);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(interval);
  }, [isInView, value, duration]);

  return <span ref={ref}>{count}</span>;
}

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'user',
      text: 'Which department submitted the most procurement requests last quarter?'
    },
    {
      role: 'ai',
      text: 'Engineering submitted 14 requests — the highest of all departments. 11 were approved, 2 rejected due to cost limits, and 1 is pending GM review.'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Scripted "composing live" reveal for the two seed chat messages —
  // purely presentational, independent of the real askAI interaction below
  const chatPreviewRef = React.useRef(null);
  const chatPreviewInView = useInView(chatPreviewRef, { once: true, margin: '-100px' });
  const [seedRevealCount, setSeedRevealCount] = useState(0);
  const [seedTyping, setSeedTyping] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!chatPreviewInView) return;
    const timers = [
      setTimeout(() => setSeedTyping(true), 400),
      setTimeout(() => { setSeedTyping(false); setSeedRevealCount(1); }, 1000),
      setTimeout(() => setSeedTyping(true), 1500),
      setTimeout(() => { setSeedTyping(false); setSeedRevealCount(2); }, 2400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [chatPreviewInView]);

  // Use resolvedTheme for rendering decisions (avoids hydration mismatch)
  const currentTheme = mounted ? (resolvedTheme || 'dark') : 'dark';

  // Monitor scroll positioning to update active navigation links
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'features', 'modules', 'ai-agent', 'about'];
      const scrollPosition = window.scrollY + 150; // offset for sticky navbar

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle interactive predefined AI chatbot questions
  const askAI = (question, answer) => {
    if (isTyping) return;
    setChatMessages(prev => [...prev, { role: 'user', text: question }]);
    setIsTyping(true);

    setTimeout(() => {
      setChatMessages(prev => [...prev, { role: 'ai', text: answer }]);
      setIsTyping(false);
    }, 1200);
  };

  const navLinks = [
    { label: 'Home', href: '#home', id: 'home' },
    { label: 'Features', href: '#features', id: 'features' },
    { label: 'Modules', href: '#modules', id: 'modules' },
    { label: 'AI Agent', href: '#ai-agent', id: 'ai-agent' },
    { label: 'About', href: '#about', id: 'about' }
  ];

  return (
    <div className="relative min-h-screen font-sans selection:bg-uacc-red selection:text-white" style={{ color: 'var(--text-secondary)' }}>
      {/* Animated Fixed Dot Grid Background */}
      <div className="dot-grid" />

      {/* SECTION 1 — Navbar (sticky) */}
      <nav className="fixed top-0 w-full z-50 nav-shell">
        <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4 w-full max-w-7xl mx-auto">
          {/* Logo container */}
          <div className="flex items-center gap-3">
            <img
              src="https://uganda-aircargo.com/wp-content/uploads/2025/03/Uganda-Air-Cargo-Logo-1.png"
              alt="UACC Logo"
              height={36}
              width={140}
              className="h-9 w-auto object-contain"
            />
            <span className="font-heading font-bold text-lg md:text-xl tracking-tight border-l pl-3 hidden sm:inline" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-gold)' }}>
              DIMS
            </span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`font-heading text-sm uppercase tracking-wider px-3 py-1.5 rounded transition-all duration-300 relative nav-hover ${
                  activeSection === link.id
                    ? 'text-uacc-gold font-semibold'
                    : ''
                }`}
                style={activeSection !== link.id ? { color: 'var(--text-muted)' } : {}}
              >
                {link.label}
                {activeSection === link.id && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-uacc-gold rounded-full" />
                )}
              </a>
            ))}
          </div>

          {/* Action buttons (desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Link 
              href="/login" 
              className="px-5 py-2 border rounded font-heading text-xs uppercase tracking-wider transition-all duration-200"
              style={{ color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
            >
              Sign In
            </Link>
            <Link 
              href="/login" 
              className="btn-primary px-5 py-2 rounded font-heading text-xs uppercase tracking-wider font-bold"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger menu toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 focus:outline-none"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Collapsed Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden w-full px-margin-mobile py-6 flex flex-col gap-4 animate-fadeIn" style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-gold)' }}>
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`font-heading text-sm uppercase tracking-wider py-3 px-4 rounded transition-all ${
                    activeSection === link.id
                      ? 'bg-uacc-gold/10 text-uacc-gold font-bold'
                      : ''
                  }`}
                  style={activeSection !== link.id ? { color: 'var(--text-muted)' } : {}}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <hr style={{ borderColor: 'var(--border-subtle)' }} />
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-center pt-2">
                <ThemeToggle />
              </div>
              <Link 
                href="/login" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 border rounded font-heading text-xs uppercase tracking-wider transition-all"
                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
              >
                Sign In
              </Link>
              <Link 
                href="/login" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center btn-primary py-3 rounded font-heading text-xs uppercase tracking-wider font-bold"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* SECTION 2 — Hero */}
      <section 
        id="home" 
        className="relative z-10 pt-28 md:pt-40 pb-20 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto min-h-screen flex flex-col justify-center overflow-hidden"
      >
        {/* Background elements (low opacity 0.15) */}
        {/* Crane Logo curved arc outline */}
        <div className="absolute top-1/4 left-0 w-[400px] h-[400px] md:w-[600px] md:h-[600px] pointer-events-none opacity-[0.12] z-0 text-uacc-red">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M 0 100 A 100 100 0 0 1 100 0" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
            <path d="M 0 100 A 85 85 0 0 1 85 15" stroke="currentColor" strokeWidth="0.5" />
            <path d="M 0 100 A 115 115 0 0 1 115 -15" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
        {/* Gold Glow Top Right */}
<div className="absolute top-0 right-0 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-linear-to-bl from-uacc-gold/10 to-transparent rounded-full blur-[100px] pointer-events-none z-0"></div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column (60% desktop) */}
          <motion.div 
            className="md:col-span-7 flex flex-col items-start gap-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            viewport={{ once: true, margin: "-100px" }}
          >
            {/* AI Platform Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 glass-panel rounded-full border-uacc-gold/30 bg-white/5">
              <span className="text-uacc-gold text-xs">✦</span>
              <span className="font-heading text-[10px] tracking-[0.2em] text-uacc-gold-light uppercase font-semibold">
                AI-Enhanced Platform
              </span>
            </div>

            {/* H1 Heading — uses var(--text-primary) so it works in both themes */}
            <h1 className="font-heading text-4xl sm:text-5xl md:text-[68px] font-bold tracking-tight leading-[1.05]"
                style={{ color: 'var(--text-primary)' }}>
              The Future of <br className="hidden sm:inline" />
              Operations at <br />
              <span className="gradient-text-gold">Uganda Air Cargo Corporation</span>
            </h1>

            {/* Subtext */}
            <p className="text-base md:text-lg max-w-2xl leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              DIMS replaces paper-based workflows with a secure, intelligent digital system — document management, procurement approvals, activity logging, and an AI agent that learns from your data.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <a 
                href="/login" 
                className="btn-primary px-8 py-4 rounded font-heading text-xs font-bold tracking-wider"
              >
                Access DIMS
              </a>
              <a 
                href="#features" 
                className="btn-ghost px-8 py-4 rounded font-heading text-xs font-bold tracking-wider flex items-center gap-2"
              >
                See How It Works <span className="text-uacc-gold">→</span>
              </a>
            </div>

            {/* Stats row below thin divider */}
            <div className="w-full mt-8 pt-8" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <p className="font-heading text-xs md:text-sm tracking-wider flex flex-wrap items-center gap-x-3 gap-y-1" style={{ color: 'var(--text-muted)' }}>
                <span className="text-uacc-gold font-bold">230+</span> Assets Digitized 
                <span style={{ color: 'var(--text-faint)' }}>·</span>
                <span className="text-uacc-gold font-bold">5</span> Departments Connected 
                <span style={{ color: 'var(--text-faint)' }}>·</span>
                <span className="text-uacc-gold font-bold animate-pulse">AI-Powered</span> Insights
              </p>
            </div>
          </motion.div>

          {/* Right Column (40% desktop) */}
          <motion.div 
            className="md:col-span-5 relative w-full"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            viewport={{ once: true, margin: "-100px" }}
          >
            {/* Ambient decorative glowing card in background */}
            <div className="glass-panel rounded-xl p-6 absolute -top-6 -right-6 z-0 opacity-40 blur-sm w-48 h-48 border-uacc-gold/10 pointer-events-none"></div>

            {/* Main status glass card */}
            <motion.div 
              className="glass-panel rounded-xl p-6 md:p-8 relative z-10 w-full backdrop-blur-2xl shadow-[0_0_40px_rgba(201,151,58,0.1)]" 
              style={{ borderColor: 'var(--border-gold-hover)' }}
              whileHover={{ y: -8, boxShadow: '0 20px 60px rgba(201, 151, 58, 0.15)' }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Status Header */}
              <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
                <span className="font-heading text-xs uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>System Status</span>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-heading text-[10px] text-emerald-400 tracking-wider font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                    OPERATIONAL
                  </span>
                </div>
              </div>

              {/* 3 Metric Mini-cards */}
              <div className="flex flex-col gap-3 mb-6">
                <div className="flex justify-between items-center px-4 py-2.5 rounded transition-all duration-300" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Total Documents</span>
                  <span className="text-base font-bold font-heading text-uacc-gold-light"><CountingNumber value={847} duration={1.5} /></span>
                </div>
                <div className="flex justify-between items-center px-4 py-2.5 rounded transition-all duration-300" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Pending Approvals</span>
                  <span className="text-base font-bold font-heading text-uacc-red"><CountingNumber value={12} duration={1.5} /></span>
                </div>
                <div className="flex justify-between items-center px-4 py-2.5 rounded transition-all duration-300" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Logs Today</span>
                  <span className="text-base font-bold font-heading text-uacc-gold-light"><CountingNumber value={34} duration={1.5} /></span>
                </div>
              </div>

              {/* Mini CSS Bar Chart Mockup */}
              <div className="rounded p-4 mb-6" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] uppercase tracking-wider font-heading" style={{ color: 'var(--text-muted)' }}>
                    Procurement Requests — Last 30 Days
                  </span>
                  <span className="text-[10px] text-uacc-gold font-semibold font-heading">Active</span>
                </div>
                <div className="flex items-end justify-between h-14 gap-2 pt-2 px-1">
                  <div className="w-full bg-uacc-gold/50 h-[35%] rounded-sm hover:bg-uacc-gold transition-all duration-300" title="Week 1"></div>
                  <div className="w-full bg-uacc-red/50 h-[70%] rounded-sm hover:bg-uacc-red transition-all duration-300" title="Week 2"></div>
                  <div className="w-full bg-uacc-gold-light/50 h-[50%] rounded-sm hover:bg-uacc-gold-light transition-all duration-300" title="Week 3"></div>
                  <div className="w-full bg-uacc-gold/50 h-[85%] rounded-sm hover:bg-uacc-gold transition-all duration-300" title="Week 4"></div>
                  <div className="w-full bg-uacc-red/50 h-[55%] rounded-sm hover:bg-uacc-red transition-all duration-300" title="Week 5"></div>
                </div>
              </div>

              {/* AI Chat Bubble at Bottom */}
              <div className="p-3.5 glass-panel border-uacc-red/20 rounded-lg"
                   style={{ background: 'rgba(204,34,0,0.08)' }}>
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-full bg-uacc-red/20 text-uacc-red shrink-0">
                    <Bot size={16} />
                  </div>
                  <div>
                    <p className="font-heading text-[10px] text-uacc-red font-bold tracking-widest uppercase mb-1">
                      DIMS AI Assistant
                    </p>
                    <p className="text-xs leading-normal" style={{ color: 'var(--text-secondary)' }}>
                      3 procurement requests are awaiting your approval. Engineering dept has the highest pending count.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 3 — Context Bar — stays dark in both themes for brand consistency */}
      <section className="border-y border-uacc-gold/20 bg-[#080C14] py-6 relative z-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop text-center flex items-center justify-center gap-3">
          <Plane className="text-uacc-gold w-4 h-4 shrink-0 animate-pulse rotate-90" />
          <p className="font-heading text-[10px] md:text-xs text-uacc-gold-light uppercase tracking-[0.25em] leading-normal max-w-full">
            ✈ Deployed for Uganda Air Cargo Corporation <span className="mx-2 text-uacc-gold/30">·</span> Entebbe International Airport <span className="mx-2 text-uacc-gold/30">·</span> Ministry of Defence &amp; Veteran Affairs
          </p>
        </div>
      </section>

      {/* SECTION 4 — Four Core Modules */}
      <section 
        id="features" 
        className="relative z-10 py-24 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto"
      >
        {/* Section Heading */}
        <div className="flex flex-col items-center text-center mb-16 gap-3">
          <span className="font-heading text-xs tracking-[0.25em] text-uacc-gold uppercase font-semibold">
            What DIMS Does
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Four Modules. One Intelligent System.
          </h2>
          <div className="w-16 h-0.5 bg-linear-to-r from-uacc-gold to-uacc-red mt-2 rounded"></div>
        </div>

        {/* 2x2 Grid / 1 column mobile */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.15, delayChildren: 0 }
            }
          }}
        >
          {/* Card 1 — Document Management */}
          <motion.div 
            className="glass-panel rounded-xl p-8 hover:border-uacc-gold/40 hover:shadow-[inset_0_0_20px_rgba(201,151,58,0.05)] relative overflow-hidden group"
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
            }}
            whileHover={{ translateY: -4 }}
          >
            {/* Hover light indicator */}
            <div className="absolute top-0 left-0 w-2 h-full bg-uacc-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="flex items-start gap-5">
              <div className="p-4 rounded-lg bg-uacc-gold/10 text-uacc-gold shrink-0 group-hover:scale-110 transition-transform duration-300">
                <FileText size={24} />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-heading text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Document Storage &amp; Retrieval
                </h3>
                <p className="text-sm md:text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Upload, categorize, search, and retrieve official documents instantly — replacing physical filing cabinets with full-text search and role-based access control.
                </p>
                <span className="text-xs text-uacc-gold font-semibold uppercase tracking-wider mt-2 group-hover:translate-x-2 transition-transform duration-300 inline-flex items-center gap-1.5">
                  Hover Accent: Gold <span>→</span>
                </span>
              </div>
            </div>
          </motion.div>

          {/* Card 2 — Procurement Workflow */}
          <motion.div 
            className="glass-panel rounded-xl p-8 accent-red hover:border-uacc-red/40 hover:shadow-[inset_0_0_20px_rgba(204,34,0,0.05)] relative overflow-hidden group"
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
            }}
            whileHover={{ translateY: -4 }}
          >
            {/* Hover light indicator */}
            <div className="absolute top-0 left-0 w-2 h-full bg-uacc-red opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="flex items-start gap-5">
              <div className="p-4 rounded-lg bg-uacc-red/10 text-uacc-red shrink-0 group-hover:scale-110 transition-transform duration-300">
                <ClipboardList size={24} />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-heading text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Digital Form 5 &amp; Approval Chain
                </h3>
                <p className="text-sm md:text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Automatic multi-stage routing through Department Head, Procurement Officer, and General Manager, with vendor and budget verification at every stage.
                </p>
                <span className="text-xs text-uacc-red font-semibold uppercase tracking-wider mt-2 group-hover:translate-x-2 transition-transform duration-300 inline-flex items-center gap-1.5">
                  Hover Accent: Red <span>→</span>
                </span>
              </div>
            </div>
          </motion.div>

          {/* Card 3 — Activity Logs */}
          <motion.div 
            className="glass-panel rounded-xl p-8 hover:border-uacc-gold/40 hover:shadow-[inset_0_0_20px_rgba(201,151,58,0.05)] relative overflow-hidden group"
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
            }}
            whileHover={{ translateY: -4 }}
          >
            {/* Hover light indicator */}
            <div className="absolute top-0 left-0 w-2 h-full bg-uacc-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="flex items-start gap-5">
              <div className="p-4 rounded-lg bg-uacc-gold/10 text-uacc-gold shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Clock size={24} />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-heading text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Staff Activity Records
                </h3>
                <p className="text-sm md:text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Replace handwritten departmental logbooks with timestamped digital entries — searchable, cross-referenceable, and exportable as PDF for audit purposes.
                </p>
                <span className="text-xs text-uacc-gold font-semibold uppercase tracking-wider mt-2 group-hover:translate-x-2 transition-transform duration-300 inline-flex items-center gap-1.5">
                  Hover Accent: Gold <span>→</span>
                </span>
              </div>
            </div>
          </motion.div>

          {/* Card 4 — Reports & Dashboard */}
          <motion.div 
            className="glass-panel rounded-xl p-8 accent-red hover:border-uacc-red/40 hover:shadow-[inset_0_0_20px_rgba(204,34,0,0.05)] relative overflow-hidden group"
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
            }}
            whileHover={{ translateY: -4 }}
          >
            {/* Hover light indicator */}
            <div className="absolute top-0 left-0 w-2 h-full bg-uacc-red opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="flex items-start gap-5">
              <div className="p-4 rounded-lg bg-uacc-red/10 text-uacc-red shrink-0 group-hover:scale-110 transition-transform duration-300">
                <BarChart2 size={24} />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-heading text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Real-Time Management Dashboard
                </h3>
                <p className="text-sm md:text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Live metrics, interactive charts, and one-click PDF report generation — giving management instant operational visibility across all departments.
                </p>
                <span className="text-xs text-uacc-red font-semibold uppercase tracking-wider mt-2 group-hover:translate-x-2 transition-transform duration-300 inline-flex items-center gap-1.5">
                  Hover Accent: Red <span>→</span>
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* SECTION 5 — AI Agent Spotlight */}
      <section 
        id="ai-agent" 
        className="relative z-10 py-24 overflow-hidden"
        style={{ backgroundColor: 'var(--bg-overlay)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        {/* Subtle diagonal red-to-gold glow behind content */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_50%,rgba(204,34,0,0.04)_0%,rgba(201,151,58,0.04)_60%,transparent_100%)] pointer-events-none z-0"></div>

        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column (text) */}
          <motion.div 
            className="md:col-span-6 flex flex-col items-start gap-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <span className="font-heading text-xs tracking-[0.25em] text-uacc-gold uppercase font-semibold">
              ✦ Intelligent Core
            </span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              An AI Agent That Learns From Your Operations
            </h2>
            <p className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              DIMS includes a built-in AI agent powered by Claude (Anthropic) that reads your live operational data and surfaces insights, flags anomalies, and answers questions in plain English.
            </p>

            {/* Bullet points with checkmarks */}
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-start gap-3">
                <span className="p-1 rounded bg-uacc-gold/20 text-uacc-gold shrink-0 mt-0.5">
                  <Check size={14} className="stroke-3" />
                </span>
                <span className="text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
                  Suggests procurement item details based on historical approvals
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="p-1 rounded bg-uacc-gold/20 text-uacc-gold shrink-0 mt-0.5">
                  <Check size={14} className="stroke-3" />
                </span>
                <span className="text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
                  Flags unusual cost estimates before submission
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="p-1 rounded bg-uacc-gold/20 text-uacc-gold shrink-0 mt-0.5">
                  <Check size={14} className="stroke-3" />
                </span>
                <span className="text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
                  Answers questions like &quot;Which department had the most pending requests this month?&quot;
                </span>
              </div>
            </div>

            {/* CTA & Muted Labels */}
            <div className="flex flex-col gap-3 mt-4 w-full sm:w-auto">
              <a 
                href="/login" 
                className="btn-ghost px-8 py-4 rounded font-heading text-xs font-bold tracking-wider text-center"
              >
                Meet the AI Agent →
              </a>
              <span className="font-heading text-[10px] uppercase tracking-widest text-center sm:text-left" style={{ color: 'var(--text-faint)' }}>
                Powered by Claude · Anthropic API · Data stays on your server
              </span>
            </div>
          </motion.div>

          {/* Right Column (chat interface card) */}
          <motion.div
            ref={chatPreviewRef}
            className="md:col-span-6 w-full"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
            viewport={{ once: true, margin: "-100px" }}
          >
            {/* Chat Frame Container */}
            <div className="glass-panel border-t-2 border-t-uacc-gold rounded-xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.5)]" style={{ backgroundColor: 'var(--bg-surface)' }}>
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4" style={{ backgroundColor: 'var(--bg-surface-low)', borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-uacc-gold/10 text-uacc-gold">
                    <Bot size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-heading font-bold" style={{ color: 'var(--text-primary)' }}>DIMS AI Agent</h4>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Online</span>
                    </div>
                  </div>
                </div>
                {/* Predefined prompts chips */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => askAI(
                      "Show doc status for Engineering.", 
                      "Engineering has uploaded 145 files this month. 98% are technical manuals."
                    )}
                    className="text-[9px] px-2.5 py-1 rounded text-uacc-gold transition-all"
                    style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-default)' }}
                  >
                    Doc Status
                  </button>
                  <button 
                    onClick={() => askAI(
                      "How many logs today?", 
                      "34 logs submitted across 5 departments. 30 approved, 4 pending in Operations."
                    )}
                    className="text-[9px] px-2.5 py-1 rounded text-uacc-gold transition-all"
                    style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-default)' }}
                  >
                    Today&apos;s Logs
                  </button>
                </div>
              </div>

              {/* Message Log Body */}
              <div className="p-6 h-[300px] overflow-y-auto flex flex-col gap-4">
                {chatMessages.map((msg, idx) => {
                  // The first two seed messages are held back until this card
                  // scrolls into view, then revealed in sequence — see the
                  // seedRevealCount effect above. Messages appended by askAI
                  // (idx >= 2) always render immediately as before.
                  if (idx < 2 && idx >= seedRevealCount) return null;
                  return (
                  <motion.div
                    key={idx}
                    className={`flex flex-col max-w-[85%] ${
                      msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx < 2 ? 0 : idx * 0.1 }}
                  >
                    <span className="text-[9px] font-heading uppercase mb-1 tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      {msg.role === 'user' ? 'You' : 'DIMS AI Agent'}
                    </span>
                    <div 
                      className={`p-3.5 rounded-lg text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'rounded-tr-none'
                          : 'border-l-2 border-uacc-gold rounded-tl-none'
                      }`}
                      style={msg.role === 'user' 
                        ? { background: 'var(--glass-bg)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }
                        : { background: 'rgba(201,151,58,0.08)', color: 'var(--text-secondary)' }
                      }
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                  );
                })}

                {/* Animated Typing Indicator */}
                {(isTyping || seedTyping) && (
                  <div className="self-start flex flex-col items-start max-w-[85%]">
                    <span className="text-[9px] font-heading uppercase mb-1 tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      DIMS AI Agent
                    </span>
                    <div className="flex gap-1.5 items-center px-4 py-3 border-l-2 border-uacc-gold rounded-lg rounded-tl-none" style={{ background: 'rgba(201,151,58,0.08)' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-uacc-gold animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-uacc-gold animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-uacc-gold animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input placeholder */}
              <div className="p-4 flex gap-2" style={{ backgroundColor: 'var(--bg-surface-low)', borderTop: '1px solid var(--border-subtle)' }}>
                <input 
                  type="text" 
                  placeholder="Ask a question about aircraft logistics, procurement status..." 
                  disabled
                  className="input-field cursor-not-allowed"
                />
                <button 
                  disabled
                  className="p-2 rounded bg-uacc-gold/20 text-uacc-gold-light border border-uacc-gold/30 cursor-not-allowed"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>

            {/* Illustrative caption */}
            <div className="mt-3 text-center text-[10px]" style={{ color: 'var(--text-faint)' }}>
              Example conversation — illustrative
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 6 — Built For Every Role */}
      <section 
        id="modules" 
        className="relative z-10 py-24 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto"
      >
        {/* Title Heading */}
        <div className="flex flex-col items-center text-center mb-16 gap-3">
          <span className="font-heading text-xs tracking-[0.25em] text-uacc-gold uppercase font-semibold">
            Operational Scopes
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Built for Every Role at UACC
          </h2>
          <div className="w-16 h-0.5 bg-linear-to-r from-uacc-gold to-uacc-red mt-2 rounded"></div>
        </div>

        {/* 12 roles grid — 3 columns desktop, 2 mobile */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.08, delayChildren: 0 }
            }
          }}
        >
          {[
            { Icon: Briefcase, emoji: '👔', title: 'General Manager', desc: 'Full visibility across all departments' },
            { Icon: UserCheck, emoji: '🏢', title: 'Department Head', desc: 'Approve requests, review team logs' },
            { Icon: User, emoji: '👤', title: 'Staff', desc: 'Submit requests, log activity, access documents' },
            { Icon: Settings, emoji: '🖥️', title: 'IT Administrator', desc: 'Manage users, roles, system settings' },
            { Icon: Shield, emoji: '🔍', title: 'Internal Auditor', desc: 'Verify requests, full audit trail access' },
            { Icon: FileArchive, emoji: '📁', title: 'Records Executive', desc: 'Universal document registry and filing' },
            { Icon: ShoppingCart, emoji: '🛒', title: 'Procurement Officer', desc: 'Vendor verification, procurement processing' },
            { Icon: Users, emoji: '🧑‍💼', title: 'HR Manager', desc: 'Staff records and HR workflow management' },
            { Icon: TrendingUp, emoji: '💰', title: 'Finance Director', desc: 'Financial oversight and spend visibility' },
            { Icon: ScrollText, emoji: '📋', title: 'Corporation Secretary', desc: 'Board affairs, governance records, and executive correspondence' },
            { Icon: Megaphone, emoji: '📣', title: 'Marketing Officer', desc: 'Campaign materials and company announcements' },
            { Icon: Inbox, emoji: '🗂️', title: 'GM Personal Assistant', desc: 'Document triage, scheduling, GM communications' },
          ].map((role) => (
            <motion.div
              key={role.title}
              className="glass-panel rounded-lg p-6 hover:border-uacc-gold/40 hover:shadow-[inset_0_0_15px_rgba(201,151,58,0.05)] flex flex-col gap-4 text-left transition-all duration-300"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
              }}
              whileHover={{ translateY: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.25)' }}
            >
              <div className="p-3 rounded bg-uacc-gold/10 text-uacc-gold w-fit">
                <role.Icon size={20} />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-heading text-base font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                  {role.title} <span className="text-xs">{role.emoji}</span>
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {role.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* SECTION 7 — CTA Banner — intentionally dark red in both themes */}
      <section 
        id="about" 
        className="relative z-10 w-full py-20 border-t border-uacc-gold/30 overflow-hidden"
        style={{ background: 'linear-gradient(90deg,#1A0500,#2D0800)' }}
      >
        {/* Glow vector arc ornament */}
        <div className="absolute right-0 bottom-0 w-[400px] h-[200px] opacity-10 pointer-events-none text-uacc-gold">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full rotate-180">
            <path d="M 0 100 A 100 100 0 0 1 100 0" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>

        <div className="max-w-4xl mx-auto px-margin-mobile text-center flex flex-col items-center gap-6 relative z-10">
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-white tracking-tight">
            Ready to go paperless?
          </h2>
          <p className="text-white/80 text-base md:text-lg max-w-2xl leading-relaxed">
            DIMS is built specifically for UACC&apos;s operational structure, legal obligations, and multi-department workflow.
          </p>
          <div className="mt-4">
            <Link 
              href="/login" 
              className="px-8 py-4 bg-white text-uacc-red font-heading text-xs uppercase tracking-wider font-bold rounded-full hover:bg-neutral-100 transform hover:-translate-y-0.5 transition-all shadow-[0_4px_20px_rgba(204,34,0,0.15)] inline-block"
            >
              Access the System
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 8 — Footer */}
      <footer className="relative z-10 pt-16 pb-8" style={{ backgroundColor: 'var(--bg-base)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
          {/* Column 1 (Left: Branding & Architect info) */}
          <div className="md:col-span-5 flex flex-col items-start gap-4">
            <img
              src="https://uganda-aircargo.com/wp-content/uploads/2025/03/Uganda-Air-Cargo-Logo-1.png"
              alt="UACC Logo"
              height={40}
              width={160}
              className="h-10 w-auto object-contain"
            />
            <div className="text-sm font-heading font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>
              DIMS v1.0 — Digital Information and Management System
            </div>
            <p className="text-xs leading-relaxed max-w-sm" style={{ color: 'var(--text-muted)' }}>
              Developed by Lutaaya Ken Rogers · Nkumba University · BCS Final Year Project 2026
            </p>
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
              © 2026 Uganda Air Cargo Corporation. All rights reserved.
            </p>
          </div>

          {/* Column 2 (Center: Platform directory links to login) */}
          <div className="md:col-span-3 flex flex-col gap-4 md:pl-10">
            <h4 className="font-heading text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--text-primary)' }}>
              Platform Nav
            </h4>
            <div className="flex flex-col gap-2.5">
              {['Dashboard', 'Documents', 'Procurement', 'Activity Logs', 'Reports'].map((link) => (
                <Link 
                  key={link} 
                  href="/login" 
                  className="text-xs hover:text-uacc-gold transition-colors duration-200"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {link}
                </Link>
              ))}
            </div>
          </div>

          {/* Column 3 (Right: Address & Hub Info) */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <h4 className="font-heading text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--text-primary)' }}>
              Contact &amp; Hub
            </h4>
            <div className="flex flex-col gap-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Uganda Air Cargo Corporation</span>
              <span>Plot 103A–107A, Circular Road, Bugonga</span>
              <span>Entebbe International Airport, Uganda</span>
              <span>P.O. Box 343 Entebbe</span>
              <a 
                href="mailto:marketing@uganda-aircargo.com" 
                className="text-uacc-gold hover:underline mt-1 inline-block"
              >
                marketing@uganda-aircargo.com
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Thin gold line divider and centered copyright */}
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop border-t border-uacc-gold/25 pt-6 text-center">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
            UGANDA AIR CARGO CORPORATION · SECURITY LEVEL: SECURE LOGISTICS PLATFORM · INTERNAL USE ONLY
          </p>
        </div>
      </footer>
    </div>
  );
}
