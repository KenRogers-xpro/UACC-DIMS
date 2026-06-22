'use client';

import { useState } from 'react';
import { Lock, Mail, ChevronDown, CheckSquare, ArrowRight, Plane } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Select Access Group');
  const [remember, setRemember] = useState(false);

  const departments = [
    'Operations',
    'Ground Handling',
    'Procurement',
    'Security',
    'Administration'
  ];

  return (
    <main className="min-h-screen bg-[#060916] text-white flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-1/2 top-0 w-[950px] h-[950px] -translate-x-1/2 rounded-full bg-gradient-to-br from-[#CC2200]/15 via-transparent to-transparent blur-[120px] opacity-70" />
        <div className="absolute right-0 bottom-0 w-[700px] h-[700px] rounded-full bg-gradient-to-tl from-[#C9973A]/15 via-transparent to-transparent blur-[100px] opacity-60" />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-[32px] border border-white/10 bg-[#0c1120]/95 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl overflow-hidden">
        <div className="px-10 py-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-3 rounded-full bg-white/5 px-4 py-2 border border-white/10">
              <Plane className="w-5 h-5 text-uacc-gold" />
              <span className="text-sm uppercase tracking-[0.35em] text-uacc-gold-light font-semibold">UACC DIMS</span>
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold">Sign in to DIMS</h1>
              <p className="mt-3 text-sm text-white/60 max-w-xs">
                Enterprise operational portal for Uganda Air Cargo Corporation
              </p>
            </div>
          </div>

          <div className="mt-12 space-y-6">
            <label className="block text-[11px] uppercase tracking-[0.3em] text-white/60 mb-3">
              Employee Email / ID
            </label>
            <div className="relative rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. j.doe@uacc.go.ug"
                className="w-full bg-transparent pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/30"
              />
            </div>

            <label className="block text-[11px] uppercase tracking-[0.3em] text-white/60 mb-3">
              Password
            </label>
            <div className="relative rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-transparent pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/30"
              />
              <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-xs uppercase tracking-[0.24em] text-uacc-red hover:text-white transition">
                Forgot Password?
              </button>
            </div>

            <label className="block text-[11px] uppercase tracking-[0.3em] text-white/60 mb-3">
              Departmental Node
            </label>
            <div className="relative rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3 text-sm text-white/80">
                <span>{department}</span>
                <ChevronDown className="w-4 h-4 text-white/50" />
              </div>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                <option disabled>Select Access Group</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setRemember(!remember)}
                className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 hover:bg-white/10 transition"
              >
                <span className={`grid h-5 w-5 place-items-center rounded-lg border ${remember ? 'border-uacc-gold bg-uacc-gold/15 text-uacc-gold' : 'border-white/10 bg-transparent text-white/0'}`}>
                  {remember && <CheckSquare className="h-4 w-4" />}
                </span>
                Remember this secure workstation
              </button>
            </div>

            <button
              type="button"
              className="mt-3 w-full rounded-2xl bg-uacc-red px-6 py-4 text-sm font-semibold uppercase tracking-[0.24em] text-white shadow-[0_20px_40px_rgba(204,34,0,0.28)] hover:bg-[#e63900] transition"
            >
              Authenticate Access <ArrowRight className="inline-block ml-2 h-4 w-4 align-middle" />
            </button>
          </div>
        </div>

        <div className="border-t border-white/10 bg-white/5 px-10 py-5 text-center text-[11px] text-white/50">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] uppercase tracking-[0.35em] text-white/70 mx-auto">
            <Shield className="h-3.5 w-3.5 text-uacc-gold" />
            Protected by enterprise security
          </div>
          <p className="mt-4">This is a secure government system. All activities are logged and monitored.</p>
          <p className="mt-3 text-[10px] text-white/40">© 2026 Uganda Air Cargo Corporation</p>
        </div>
      </div>
    </main>
  );
}
