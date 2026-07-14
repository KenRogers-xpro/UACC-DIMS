'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock, ShieldCheck, Check, KeyRound } from 'lucide-react'
import api from '@/lib/api'
import Button from '@/components/ui/Button'

const ROLE_OPTIONS = [
  { value: 'GENERAL_MANAGER',   label: 'General Manager' },
  { value: 'DEPARTMENT_HEAD',   label: 'Department Head' },
  { value: 'RECORDS_EXECUTIVE', label: 'Records Executive' },
  { value: 'IT_ADMINISTRATOR',  label: 'IT Administrator' },
  { value: 'PROCUREMENT_OFFICER', label: 'Procurement Officer' },
]

/**
 * Real PIN-verified signing flow for a circulation step. Handles the
 * first-time "no PIN set yet" case inline, then the actual sign action —
 * POST /api/circulation/:id/sign — with a shake on wrong PIN and a
 * checkmark on success. Reused anywhere a user needs to act on a document
 * that's currently held by their role (DocumentsAwaitingAction, the unified
 * viewer's Signatures tab).
 */
export default function SigningModal({ circulationId, currentUserRole, isOpen, onClose, onSigned }) {
  const [checkingPin, setCheckingPin] = useState(true)
  const [hasPinSet, setHasPinSet] = useState(true)

  // Set-PIN sub-form state
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [password, setPassword] = useState('')
  const [settingPin, setSettingPin] = useState(false)
  const [setPinError, setSetPinError] = useState('')

  // Signing form state
  const [decision, setDecision] = useState('APPROVED')
  const [finalDecision, setFinalDecision] = useState(false)
  const [toRole, setToRole] = useState(ROLE_OPTIONS[0].value)
  const [instruction, setInstruction] = useState('')
  const [amount, setAmount] = useState('')
  const [pin, setPin] = useState('')
  const [signing, setSigning] = useState(false)
  const [signError, setSignError] = useState('')
  const [shake, setShake] = useState(false)
  const [success, setSuccess] = useState(false)
  const pinInputRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    setCheckingPin(true)
    setSuccess(false)
    setSignError('')
    setPin('')
    api.get('/users/me/signing-pin-status')
      .then((res) => setHasPinSet(Boolean(res.data?.hasPinSet)))
      .catch(() => setHasPinSet(true))
      .finally(() => setCheckingPin(false))
  }, [isOpen])

  const handleSetPin = async (e) => {
    e.preventDefault()
    if (!/^\d{4,6}$/.test(newPin)) {
      setSetPinError('PIN must be 4 to 6 digits')
      return
    }
    if (newPin !== confirmPin) {
      setSetPinError('PINs do not match')
      return
    }
    setSettingPin(true)
    setSetPinError('')
    try {
      await api.post('/users/me/signing-pin', { newPin, password })
      setHasPinSet(true)
      setPassword('')
    } catch (err) {
      setSetPinError(err.message || 'Failed to set PIN')
    } finally {
      setSettingPin(false)
    }
  }

  const handleSign = async (e) => {
    e.preventDefault()
    if (!/^\d{4,6}$/.test(pin)) {
      setSignError('Enter your PIN')
      return
    }
    setSigning(true)
    setSignError('')
    try {
      const res = await api.post(`/circulation/${circulationId}/sign`, {
        pin,
        decision,
        toRole: finalDecision ? currentUserRole : toRole,
        instruction: instruction || undefined,
        stepType: finalDecision ? 'FINAL_DECISION' : 'FORWARD',
        amount: amount || undefined,
      })
      if (!res.success) throw new Error(res.message || 'Signing failed')

      setSuccess(true)
      setTimeout(() => {
        onSigned?.(res.step)
        onClose?.()
      }, 900)
    } catch (err) {
      if (err.message === 'Incorrect PIN' || String(err.message).includes('PIN')) {
        setShake(true)
        setTimeout(() => setShake(false), 500)
      }
      setSignError(err.message || 'Failed to sign')
      setPin('')
      pinInputRef.current?.focus()
    } finally {
      setSigning(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <motion.div
            className="card rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--bg-surface)' }}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <ShieldCheck size={20} className="text-uacc-gold" />
                {success ? 'Signed' : hasPinSet ? 'Sign Document' : 'Set Signing PIN'}
              </h2>
              <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {checkingPin ? (
              <div className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Checking your account...</div>
            ) : success ? (
              <motion.div
                className="flex flex-col items-center gap-3 py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                  <Check size={32} className="text-emerald-400" />
                </motion.div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Signature recorded</p>
              </motion.div>
            ) : !hasPinSet ? (
              <form onSubmit={handleSetPin} className="flex flex-col gap-3">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  You need a signing PIN before you can sign documents. This is separate from your login password.
                </p>
                <input
                  type="password"
                  inputMode="numeric"
                  className="input-field w-full"
                  placeholder="New PIN (4-6 digits)"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                <input
                  type="password"
                  inputMode="numeric"
                  className="input-field w-full"
                  placeholder="Confirm PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                <input
                  type="password"
                  className="input-field w-full"
                  placeholder="Your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {setPinError && <p className="text-xs text-uacc-red">{setPinError}</p>}
                <Button type="submit" variant="primary" loading={settingPin} icon={KeyRound}>
                  Set PIN
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSign} className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDecision('APPROVED')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors ${
                      decision === 'APPROVED'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                        : 'border-[var(--border-default)] text-[var(--text-muted)]'
                    }`}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('REJECTED')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors ${
                      decision === 'REJECTED'
                        ? 'bg-uacc-red/15 border-uacc-red/40 text-uacc-red'
                        : 'border-[var(--border-default)] text-[var(--text-muted)]'
                    }`}
                  >
                    Reject
                  </button>
                </div>

                <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <input type="checkbox" checked={finalDecision} onChange={(e) => setFinalDecision(e.target.checked)} />
                  This is the final decision (closes the circulation)
                </label>

                {!finalDecision && (
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      Forward to
                    </label>
                    <select className="input-field w-full" value={toRole} onChange={(e) => setToRole(e.target.value)}>
                      {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                )}

                <textarea
                  className="input-field w-full"
                  rows={2}
                  placeholder="Comment (optional)"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                />

                <input
                  type="number"
                  className="input-field w-full"
                  placeholder="Amount, if this is a financial approval (optional)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />

                <motion.div
                  animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : { x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <label className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    <Lock size={12} /> Signing PIN
                  </label>
                  <input
                    ref={pinInputRef}
                    type="password"
                    inputMode="numeric"
                    autoFocus
                    className={`input-field w-full text-center tracking-[0.5em] font-bold ${shake ? 'border-uacc-red' : ''}`}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </motion.div>

                {signError && <p className="text-xs text-uacc-red">{signError}</p>}

                <div className="flex justify-end gap-3 mt-1">
                  <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                  <Button variant="primary" type="submit" loading={signing}>
                    Sign & Submit
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
