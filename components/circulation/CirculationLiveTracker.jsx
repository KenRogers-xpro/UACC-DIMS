'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  User, Users, Shield, Wallet, Megaphone, FileCheck2,
  Landmark, ClipboardList, ScrollText, Briefcase, Check, ArrowRight,
} from 'lucide-react'
import api from '@/lib/api'

const POLL_INTERVAL_MS = 20000

const ROLE_ICONS = {
  GENERAL_MANAGER: Landmark,
  GM_PERSONAL_ASSISTANT: User,
  DEPARTMENT_HEAD: Briefcase,
  STAFF: User,
  IT_ADMINISTRATOR: Shield,
  INTERNAL_AUDITOR: FileCheck2,
  RECORDS_EXECUTIVE: ScrollText,
  PROCUREMENT_OFFICER: ClipboardList,
  HR_MANAGER: Users,
  FINANCE_DIRECTOR: Wallet,
  MARKETING_OFFICER: Megaphone,
  CORPORATION_SECRETARY: Briefcase,
}

function roleLabel(role) {
  return role ? role.replace(/_/g, ' ') : 'Unknown'
}

/**
 * Compact, package-tracking-style horizontal stepper for a single
 * circulation — role icons left to right, connected by arrows. Completed
 * hops are muted gold with a check; the current holder pulses gold; a
 * document that hasn't entered circulation yet (still PRIVATE, no
 * circulationId) renders as a single outlined "Not yet circulated" node
 * rather than disappearing, so placement stays consistent everywhere this
 * is embedded (inbox rows, DocumentViewerModal). Fetches and polls its own
 * data by circulationId so the parent never needs to already have step data
 * loaded.
 */
export default function CirculationLiveTracker({ circulationId }) {
  const [circulation, setCirculation] = useState(null)

  const fetchCirculation = useCallback(async () => {
    if (!circulationId) {
      setCirculation(null)
      return
    }
    try {
      const res = await api.get(`/circulation/${circulationId}`)
      setCirculation(res.data?.circulation || res.data || null)
    } catch {
      // silent — this is a decorative preview, shouldn't disrupt the row/panel it's embedded in
    }
  }, [circulationId])

  useEffect(() => {
    fetchCirculation()
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchCirculation()
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchCirculation])

  // No circulation at all — a still-PRIVATE document that's never been
  // submitted. Shown, not hidden, so this component's placement never shifts.
  if (!circulationId || !circulation) {
    return (
      <div className="flex items-center gap-2 py-1">
        <div
          className="w-6 h-6 rounded-full border border-dashed flex items-center justify-center flex-shrink-0"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <User size={11} style={{ color: 'var(--text-faint)' }} />
        </div>
        <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>Not yet circulated</span>
      </div>
    )
  }

  const steps = circulation.steps || []
  const sequence = steps.length > 0
    ? [steps[0].fromRole, ...steps.map((s) => s.toRole)]
    : [circulation.currentHolderRole]
  const isClosed = circulation.status === 'CLOSED'

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-1">
      {sequence.map((role, idx) => {
        const Icon = ROLE_ICONS[role] || User
        const isLast = idx === sequence.length - 1
        const isCurrent = isLast && !isClosed
        const isCompleted = !isCurrent

        return (
          <div key={`${role}-${idx}`} className="flex items-center flex-shrink-0">
            {idx > 0 && (
              <ArrowRight size={13} className="flex-shrink-0 mx-0.5" style={{ color: 'var(--border-strong)' }} />
            )}
            <div
              className="relative flex-shrink-0"
              title={`${roleLabel(role)}${isCurrent ? ' — current holder, awaiting action' : isCompleted ? ' — completed' : ''}`}
            >
              {isCurrent && (
                <span className="animate-ping absolute inset-0 rounded-full bg-uacc-gold opacity-60" />
              )}
              <div
                className="relative w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={
                  isCurrent
                    ? { background: 'rgba(201,151,58,0.25)', border: '1.5px solid rgba(201,151,58,0.8)', boxShadow: '0 0 10px rgba(201,151,58,0.5)' }
                    : { background: 'rgba(201,151,58,0.12)', border: '1.5px solid rgba(201,151,58,0.4)' }
                }
              >
                {isCompleted
                  ? <Check size={13} className="text-uacc-gold" />
                  : <Icon size={13} className="text-uacc-gold" />}
              </div>
            </div>
          </div>
        )
      })}
      <span className="ml-2 text-[10px] whitespace-nowrap flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
        {isClosed ? 'Closed' : `With ${roleLabel(circulation.currentHolderRole)}`}
      </span>
    </div>
  )
}
