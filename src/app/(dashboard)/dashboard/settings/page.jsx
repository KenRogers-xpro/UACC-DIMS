'use client'

import React, { useState, useEffect } from 'react'
import { Camera, Lock, Eye, EyeOff, Monitor, Smartphone, Moon, Sun, Check, KeyRound } from 'lucide-react'
import { useTheme } from 'next-themes'
import api from '@/lib/api'

const TABS = ['Profile', 'Security', 'Preferences', 'System Info']

function ToggleSwitch({ enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200
        ${enabled ? 'bg-uacc-gold' : 'bg-white/10'}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow
        transition-transform duration-200
        ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
    </button>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Profile')
  const [toast, setToast] = useState(null)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Profile State
  const [profileData, setProfileData] = useState({
    jobTitle: '',
    phone: '',
    bio: ''
  })

  // Security State
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [showPass, setShowPass] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // Signing PIN — the one genuinely API-wired section on this page (the rest
  // is still mock data). Same endpoints SigningModal uses, so setting or
  // changing it here is immediately reflected the next time you sign.
  const [pinStatus, setPinStatus] = useState({ hasPinSet: false, pinRequired: true, loading: true })
  const [pinForm, setPinForm] = useState({ newPin: '', confirmPin: '', password: '' })
  const [savingPin, setSavingPin] = useState(false)
  const [pinError, setPinError] = useState('')

  useEffect(() => {
    api.get('/users/me/signing-pin-status')
      .then((res) => setPinStatus({
        hasPinSet: Boolean(res.data?.hasPinSet),
        pinRequired: res.data?.pinRequired !== false,
        loading: false,
      }))
      .catch(() => setPinStatus((s) => ({ ...s, loading: false })))
  }, [])

  const handleSavePin = async (e) => {
    e.preventDefault()
    if (!/^\d{4,6}$/.test(pinForm.newPin)) {
      setPinError('PIN must be 4 to 6 digits')
      return
    }
    if (pinForm.newPin !== pinForm.confirmPin) {
      setPinError('PINs do not match')
      return
    }
    setSavingPin(true)
    setPinError('')
    try {
      await api.post('/users/me/signing-pin', { newPin: pinForm.newPin, password: pinForm.password })
      setPinStatus((s) => ({ ...s, hasPinSet: true }))
      setPinForm({ newPin: '', confirmPin: '', password: '' })
      showSuccessToast('Signing PIN saved.')
    } catch (err) {
      setPinError(err.message || 'Failed to save PIN')
    } finally {
      setSavingPin(false)
    }
  }

  // Preferences State
  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    procurementAlerts: true,
    activityLogReminders: false,
    autoRefresh: true,
    dateFormat: 'DD MMM YYYY',
    language: 'English (UK)'
  })

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showSuccessToast = (message) => {
    setToast({ type: 'success', message })
  }

  const getPasswordStrength = (pass) => {
    if (!pass) return { label: '', color: 'bg-transparent', width: 'w-0' }
    if (pass.length < 6) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/4' }
    if (pass.length < 8) return { label: 'Fair', color: 'bg-orange-500', width: 'w-2/4' }
    if (pass.length < 10) return { label: 'Good', color: 'bg-uacc-gold', width: 'w-3/4' }
    return { label: 'Strong', color: 'bg-green-500', width: 'w-full' }
  }

  const passwordStrength = getPasswordStrength(passwords.new)

  return (
    <div className="p-6 md:p-8 w-full max-w-screen-2xl mx-auto min-h-screen pb-24">
      
      {/* PAGE HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Settings</h1>
        <p className="text-[var(--text-muted)] text-sm">Manage your account and system preferences</p>
      </div>

      {/* TABS */}
      <div className="flex border-b border-white/10 mb-8 overflow-x-auto scrollbar-none">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-semibold text-sm whitespace-nowrap transition-colors relative ${
              activeTab === tab ? 'text-uacc-gold' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-uacc-gold"></div>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1 — Profile */}
      {activeTab === 'Profile' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Avatar Card */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <div className="card rounded-xl p-6 text-center flex flex-col items-center gap-4 border border-white/5 bg-white/[0.02]">
              <div className="w-20 h-20 rounded-full bg-uacc-gold flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-uacc-gold/20">
                P
              </div>
              <div>
                <h2 className="font-bold text-xl text-[var(--text-primary)]">Patrick Katusabe</h2>
                <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  IT Administrator
                </span>
                <p className="text-sm text-[var(--text-muted)] mt-2">Finance and Administration</p>
                <p className="text-xs text-[var(--text-faint)] mt-1">it@uacc.go.ug</p>
              </div>
              <button 
                onClick={() => showSuccessToast("Photo update requested.")}
                className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors text-sm font-bold"
              >
                <Camera size={16} />
                Change Photo
              </button>
              
              <div className="w-full h-px bg-white/10 my-2"></div>
              
              <div className="w-full space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--text-muted)] font-semibold">Member Since</span>
                  <span className="text-xs text-[var(--text-primary)] font-medium">15 Jan 2026</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--text-muted)] font-semibold">Last Login</span>
                  <span className="text-xs text-[var(--text-primary)] font-medium">Today at 08:45 AM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--text-muted)] font-semibold">Account Status</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    <span className="text-xs text-[var(--text-primary)] font-medium">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="md:col-span-8">
            <div className="card rounded-xl p-6 border border-white/5 bg-white/[0.02]">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Personal Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Full Name</label>
                    <input 
                      type="text" 
                      value="Patrick Katusabe" 
                      readOnly 
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[var(--text-muted)] cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <input 
                        type="email" 
                        value="it@uacc.go.ug" 
                        readOnly 
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-4 pr-10 py-2.5 text-sm text-[var(--text-muted)] cursor-not-allowed"
                      />
                      <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
                    </div>
                    <p className="text-[10px] text-[var(--text-faint)] mt-1">Contact IT Admin to change</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Department</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value="Finance and Administration" 
                        readOnly 
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-4 pr-10 py-2.5 text-sm text-[var(--text-muted)] cursor-not-allowed"
                      />
                      <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
                    </div>
                    <p className="text-[10px] text-[var(--text-faint)] mt-1">Contact IT Admin to change</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Job Title</label>
                    <input 
                      type="text" 
                      value={profileData.jobTitle}
                      onChange={(e) => setProfileData({...profileData, jobTitle: e.target.value})}
                      placeholder="e.g. IT Specialist" 
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-uacc-gold/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Phone Number</label>
                  <input 
                    type="text" 
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    placeholder="+256 7XX XXX XXX" 
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-uacc-gold/50 max-w-md"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Bio / Notes</label>
                  <textarea 
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    placeholder="Brief description of your role..." 
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-uacc-gold/50 resize-none"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    onClick={() => showSuccessToast("Profile changes saved successfully.")}
                    className="px-6 py-2.5 rounded-lg bg-uacc-gold/20 text-uacc-gold border border-uacc-gold/50 hover:bg-uacc-gold hover:text-[var(--text-primary)] transition-colors text-sm font-bold"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 — Security */}
      {activeTab === 'Security' && (
        <div className="max-w-3xl">
          <div className="card rounded-xl p-6 border border-white/5 bg-white/[0.02]">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Change Password</h3>
            <div className="space-y-5 max-w-md">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Current Password</label>
                <div className="relative">
                  <input 
                    type={showPass.current ? "text" : "password"}
                    value={passwords.current}
                    onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-4 pr-10 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-uacc-gold/50"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPass({...showPass, current: !showPass.current})}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text-primary)]"
                  >
                    {showPass.current ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <input 
                    type={showPass.new ? "text" : "password"}
                    value={passwords.new}
                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-4 pr-10 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-uacc-gold/50"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPass({...showPass, new: !showPass.new})}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text-primary)]"
                  >
                    {showPass.new ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwords.new && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${passwordStrength.width} ${passwordStrength.color} transition-all duration-300`}></div>
                    </div>
                    <span className={`text-[10px] uppercase font-bold w-12 text-right ${passwordStrength.color.replace('bg-', 'text-')}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Confirm New Password</label>
                <div className="relative">
                  <input 
                    type={showPass.confirm ? "text" : "password"}
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-4 pr-10 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-uacc-gold/50"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPass({...showPass, confirm: !showPass.confirm})}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text-primary)]"
                  >
                    {showPass.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button 
                onClick={() => {
                  showSuccessToast("Password updated successfully.")
                  setPasswords({ current: '', new: '', confirm: '' })
                }}
                disabled={!passwords.current || !passwords.new || passwords.new !== passwords.confirm}
                className="px-6 py-2.5 rounded-lg bg-uacc-gold/20 text-uacc-gold border border-uacc-gold/50 hover:bg-uacc-gold hover:text-[var(--text-primary)] transition-colors text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Password
              </button>
            </div>
          </div>

          <div className="card rounded-xl p-6 mt-4 border border-white/5 bg-white/[0.02]">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
              <KeyRound size={18} className="text-uacc-gold" /> Signing PIN
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-6">
              A separate 4-6 digit PIN used to sign circulated documents — not your account password.
              {!pinStatus.pinRequired && ' This environment currently has PIN verification disabled for signing (demo mode).'}
            </p>
            {pinStatus.loading ? (
              <p className="text-xs text-[var(--text-muted)]">Checking status...</p>
            ) : (
              <form onSubmit={handleSavePin} className="space-y-4 max-w-md">
                <div className="flex items-center gap-2 text-xs">
                  <span className={`w-2 h-2 rounded-full ${pinStatus.hasPinSet ? 'bg-green-500' : 'bg-white/20'}`} />
                  <span className="text-[var(--text-secondary)]">
                    {pinStatus.hasPinSet ? 'A signing PIN is set' : 'No signing PIN set yet'}
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                    {pinStatus.hasPinSet ? 'New PIN' : 'Set PIN'}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={pinForm.newPin}
                    onChange={(e) => setPinForm((f) => ({ ...f, newPin: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    placeholder="4-6 digits"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-uacc-gold/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Confirm PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={pinForm.confirmPin}
                    onChange={(e) => setPinForm((f) => ({ ...f, confirmPin: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-uacc-gold/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Account Password</label>
                  <input
                    type="password"
                    value={pinForm.password}
                    onChange={(e) => setPinForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Confirm it's you"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-uacc-gold/50"
                  />
                </div>
                {pinError && <p className="text-xs text-red-400">{pinError}</p>}
                <button
                  type="submit"
                  disabled={savingPin}
                  className="px-6 py-2.5 rounded-lg bg-uacc-gold/20 text-uacc-gold border border-uacc-gold/50 hover:bg-uacc-gold hover:text-[var(--text-primary)] transition-colors text-sm font-bold disabled:opacity-50"
                >
                  {pinStatus.hasPinSet ? 'Change PIN' : 'Set PIN'}
                </button>
              </form>
            )}
          </div>

          <div className="card rounded-xl p-6 mt-4 border border-white/5 bg-white/[0.02]">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Active Sessions</h3>
            <div className="space-y-4">
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-uacc-gold/10 flex items-center justify-center text-uacc-gold">
                    <Monitor size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">This device · Chrome · Windows</h4>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">192.168.1.45</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    <span className="text-xs text-green-500 font-medium">Active now</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[var(--text-muted)]">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">Mobile · Chrome · Android</h4>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">192.168.1.55 · 2 hours ago</p>
                  </div>
                </div>
                <button 
                  onClick={() => showSuccessToast("Session revoked successfully.")}
                  className="px-3 py-1.5 rounded-md text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-[var(--text-primary)] transition-colors"
                >
                  Revoke
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 3 — Preferences */}
      {activeTab === 'Preferences' && (
        <div className="max-w-3xl">
          <div className="card rounded-xl p-6 border border-white/5 bg-white/[0.02]">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Display & Notifications</h3>
            
            <div className="space-y-6 divide-y divide-white/10">
              
              <div className="flex items-center justify-between pt-2 pb-2">
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">Theme</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Choose your preferred color scheme</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => mounted && setTheme('dark')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors text-sm font-medium ${
                      mounted && theme === 'dark' 
                        ? 'bg-uacc-gold/20 border-uacc-gold/50 text-uacc-gold' 
                        : 'bg-white/5 border-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Moon size={14} />
                    Dark
                  </button>
                  <button 
                    onClick={() => mounted && setTheme('light')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors text-sm font-medium ${
                      mounted && theme === 'light' 
                        ? 'bg-uacc-gold/20 border-uacc-gold/50 text-uacc-gold' 
                        : 'bg-white/5 border-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Sun size={14} />
                    Light
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 pb-2">
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">Email Notifications</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Receive email alerts for procurement approvals</p>
                </div>
                <ToggleSwitch 
                  enabled={prefs.emailNotifications} 
                  onToggle={() => setPrefs({...prefs, emailNotifications: !prefs.emailNotifications})} 
                />
              </div>

              <div className="flex items-center justify-between pt-6 pb-2">
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">Procurement Alerts</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Notify me when my requests are approved or rejected</p>
                </div>
                <ToggleSwitch 
                  enabled={prefs.procurementAlerts} 
                  onToggle={() => setPrefs({...prefs, procurementAlerts: !prefs.procurementAlerts})} 
                />
              </div>

              <div className="flex items-center justify-between pt-6 pb-2">
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">Activity Log Reminders</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Daily reminder to submit activity log by 5PM</p>
                </div>
                <ToggleSwitch 
                  enabled={prefs.activityLogReminders} 
                  onToggle={() => setPrefs({...prefs, activityLogReminders: !prefs.activityLogReminders})} 
                />
              </div>

              <div className="flex items-center justify-between pt-6 pb-2">
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">Dashboard Auto-refresh</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Refresh dashboard data every 5 minutes</p>
                </div>
                <ToggleSwitch 
                  enabled={prefs.autoRefresh} 
                  onToggle={() => setPrefs({...prefs, autoRefresh: !prefs.autoRefresh})} 
                />
              </div>

              <div className="flex items-center justify-between pt-6 pb-2">
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">Date Format</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Choose date display format</p>
                </div>
                <select 
                  value={prefs.dateFormat}
                  onChange={(e) => setPrefs({...prefs, dateFormat: e.target.value})}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-uacc-gold/50 appearance-none min-w-[150px]"
                >
                  <option value="DD MMM YYYY">DD MMM YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-6 pb-2">
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">Language</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1">System interface language</p>
                </div>
                <select 
                  value={prefs.language}
                  onChange={(e) => setPrefs({...prefs, language: e.target.value})}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-uacc-gold/50 appearance-none min-w-[150px]"
                >
                  <option value="English (UK)">English (UK)</option>
                  <option value="English (US)" disabled className="text-[var(--text-faint)]">English (US)</option>
                  <option value="French" disabled className="text-[var(--text-faint)]">French</option>
                </select>
              </div>

            </div>
            
            <div className="pt-8 flex justify-end border-t border-white/10 mt-6">
              <button 
                onClick={() => showSuccessToast("Preferences saved successfully.")}
                className="px-6 py-2.5 rounded-lg bg-uacc-gold/20 text-uacc-gold border border-uacc-gold/50 hover:bg-uacc-gold hover:text-[var(--text-primary)] transition-colors text-sm font-bold"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4 — System Info */}
      {activeTab === 'System Info' && (
        <div className="max-w-3xl">
          <div className="card rounded-xl p-6 border border-white/5 bg-white/[0.02]">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">DIMS System Information</h3>
            
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-0 p-4 bg-white/5">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">System Version</span>
                <span className="text-sm font-heading font-medium text-[var(--text-primary)]">DIMS v1.0.0</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-0 p-4 bg-transparent">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Build Date</span>
                <span className="text-sm font-heading font-medium text-[var(--text-primary)]">June 2026</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-0 p-4 bg-white/5">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Framework</span>
                <span className="text-sm font-heading font-medium text-[var(--text-primary)]">Next.js 16 + React 19</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-0 p-4 bg-transparent">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Database</span>
                <span className="text-sm font-heading font-medium text-[var(--text-primary)]">MySQL 8.0 (Prisma ORM)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-0 p-4 bg-white/5">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">AI Engine</span>
                <span className="text-sm font-heading font-medium text-[var(--text-primary)]">Claude (Anthropic) via Vercel AI SDK</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-0 p-4 bg-transparent">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Authentication</span>
                <span className="text-sm font-heading font-medium text-[var(--text-primary)]">NextAuth.js v5</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-0 p-4 bg-white/5">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Deployment</span>
                <span className="text-sm font-heading font-medium text-[var(--text-primary)]">Local — UACC Server</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-0 p-4 bg-transparent">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Developed by</span>
                <span className="text-sm font-heading font-medium text-[var(--text-primary)]">Lutaaya Ken Rogers</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-0 p-4 bg-white/5">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Institution</span>
                <span className="text-sm font-heading font-medium text-[var(--text-primary)]">Nkumba University — BCS 2026</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-0 p-4 bg-transparent border-b-0">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Supervisor</span>
                <span className="text-sm font-heading font-medium text-[var(--text-primary)]">Mr. Kawuma Richard</span>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl border border-uacc-gold/30 bg-uacc-gold/5">
              <p className="text-sm text-uacc-gold/90 leading-relaxed text-center">
                This system was developed as a final-year research project for the Bachelor of Computer Science programme at Nkumba University, in partial fulfillment of degree requirements. Deployed for Uganda Air Cargo Corporation, Entebbe.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md bg-green-500/10 border-green-500/20 text-green-400">
            <Check size={18} />
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}

    </div>
  )
}
