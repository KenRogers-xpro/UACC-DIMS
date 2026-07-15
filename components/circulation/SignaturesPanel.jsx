'use client'

import { useState } from 'react'
import { KeyRound, Lock, ShieldCheck, ShieldAlert, Fingerprint, Clock, PenTool } from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import api from '@/lib/api'

function truncateHash(hash) {
  if (!hash || hash.length < 10) return hash || ''
  return `${hash.slice(0, 4)}...${hash.slice(-4)}`
}

const STEP_ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

/**
 * The proof-of-authenticity view for a circulation — deliberately distinct
 * from CirculationTimeline (the routing/instruction history). Every field
 * here comes straight off the DigitalSignature record itself, not the
 * CirculationStep it's attached to: signerId (resolved to a name),
 * signerRole, decision, how it was verified (PIN vs. password), its
 * tamper-evident hash, and when it was actually signed. A step with no
 * linked signature yet (mid-flow, before the holder has signed) is shown
 * as "Awaiting signature" rather than silently omitted.
 */
export default function SignaturesPanel({ circulation }) {
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState(null)
  const [verifyError, setVerifyError] = useState('')

  if (!circulation || !circulation.steps || circulation.steps.length === 0) {
    return <EmptyState icon={PenTool} title="No circulation yet" message="This document has not entered circulation yet." />
  }

  const handleVerify = async () => {
    setVerifying(true)
    setVerifyError('')
    try {
      const res = await api.get(`/circulation/${circulation.id}/verify-integrity`)
      setVerifyResult(res)
    } catch (err) {
      setVerifyError(err.message || 'Failed to verify integrity')
    } finally {
      setVerifying(false)
    }
  }

  const resultByStepId = new Map((verifyResult?.signatures || []).map((s) => [s.stepId, s]))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Each entry is a tamper-evident signature record, not the routing history.
        </p>
        <Button variant="outline" size="sm" icon={ShieldCheck} onClick={handleVerify} loading={verifying}>
          Verify Integrity
        </Button>
      </div>

      {verifyError && <p className="text-xs text-uacc-red">{verifyError}</p>}

      {verifyResult && (
        <div className={`rounded-lg p-3 border flex items-center gap-2 text-xs font-semibold ${
          verifyResult.chainValid
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            : 'border-uacc-red/30 bg-uacc-red/10 text-uacc-red'
        }`}>
          {verifyResult.chainValid ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
          {verifyResult.chainValid
            ? `All ${verifyResult.signatureCount} signature(s) verified — hash chain intact.`
            : 'Integrity check failed — one or more signatures do not match their recorded hash.'}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {circulation.steps.map((step) => {
          const sig = step.signature
          const stepRoman = STEP_ROMAN[step.stepNumber - 1] || step.stepNumber
          const check = resultByStepId.get(step.id)

          return (
            <div
              key={step.id}
              className="rounded-xl p-4 border"
              style={{ borderColor: 'var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-full border border-uacc-gold/50 flex items-center justify-center text-[10px] font-bold text-uacc-gold flex-shrink-0">
                    {stepRoman}
                  </span>
                  <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {step.fromRole?.replace(/_/g, ' ')}
                  </span>
                </div>
                {check && (
                  check.valid ? (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 flex-shrink-0">
                      <ShieldCheck size={11} /> Verified
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-uacc-red flex items-center gap-1 flex-shrink-0">
                      <ShieldAlert size={11} /> Mismatch
                    </span>
                  )
                )}
              </div>

              {!sig ? (
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-faint)' }}>
                  <Clock size={12} />
                  Awaiting signature
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {sig.signer?.name || `User #${sig.signerId}`}
                    </span>
                    <span
                      className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {sig.signerRole?.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      sig.decision === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-400' :
                      sig.decision === 'REJECTED' ? 'bg-uacc-red/15 text-uacc-red' :
                      'bg-white/10 text-(--text-muted)'
                    }`}>
                      {sig.decision}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {sig.verifiedWithPin && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-uacc-gold/10 text-uacc-gold border border-uacc-gold/25">
                        <KeyRound size={10} /> PIN Verified
                      </span>
                    )}
                    {sig.verifiedWithPassword && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/25">
                        <Lock size={10} /> Password Verified — high-stakes
                      </span>
                    )}
                  </div>

                  <div
                    className="flex flex-wrap items-center justify-between gap-2 pt-2 mt-1 border-t"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-mono tracking-tight"
                      style={{ color: 'var(--text-faint)' }}
                      title={sig.signatureHash}
                    >
                      <Fingerprint size={10} />
                      {truncateHash(sig.signatureHash)}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                      {new Date(sig.signedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
