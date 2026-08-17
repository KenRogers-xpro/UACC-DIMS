'use client'

import { useState, useEffect, useCallback } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  UserIcon, UserMultipleIcon, Shield01Icon, Wallet01Icon, Megaphone01Icon, Task01Icon,
  BankIcon, CheckListIcon, Note01Icon, Briefcase02Icon, Tick01Icon, ArrowRight01Icon,
} from '@hugeicons/core-free-icons'
import api from '@/lib/api'

const POLL_INTERVAL_MS = 20000

const ROLE_ICONS = {
  GENERAL_MANAGER: BankIcon,
  GM_PERSONAL_ASSISTANT: UserIcon,
  DEPARTMENT_HEAD: Briefcase02Icon,
  STAFF: UserIcon,
  IT_ADMINISTRATOR: Shield01Icon,
  INTERNAL_AUDITOR: Task01Icon,
  RECORDS_EXECUTIVE: Note01Icon,
  PROCUREMENT_OFFICER: CheckListIcon,
  HR_MANAGER: UserMultipleIcon,
  FINANCE_DIRECTOR: Wallet01Icon,
  MARKETING_OFFICER: Megaphone01Icon,
  CORPORATION_SECRETARY: Briefcase02Icon,
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
      // GET /api/circulation/:id is one of the raw circulation.routes.js
      // endpoints — unlike most of the API, it doesn't go through the
      // shared success() helper, so the payload sits at the top-level
      // `circulation` key, not nested under `data`. res.data is always
      // undefined here; reading only that silently rendered "Not yet
      // circulated" for every circulation regardless of whether one
      // actually existed. lib/useCirculation.js's fetchTimeline already
      // handles this correctly — mirroring that fallback order here.
      setCirculation(res.circulation || res.data?.circulation || res.data || null)
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
          <HugeiconsIcon icon={UserIcon} size={11} color="currentColor" strokeWidth={1.5} style={{ color: 'var(--text-faint)' }} />
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
  // Deduped across every step — informed-only roles, shown once regardless
  // of how many hops actually cc'd them.
  const ccRoles = [...new Set(steps.flatMap((s) => s.ccRoles || []))]

  return (
    <div className="flex flex-col gap-1 py-1">
    <div className="flex items-center gap-1 overflow-x-auto">
      {sequence.map((role, idx) => {
        const Icon = ROLE_ICONS[role] || UserIcon
        const isLast = idx === sequence.length - 1
        const isCurrent = isLast && !isClosed
        const isCompleted = !isCurrent

        return (
          <div key={`${role}-${idx}`} className="flex items-center flex-shrink-0">
            {idx > 0 && (
              <HugeiconsIcon icon={ArrowRight01Icon} size={13} color="currentColor" strokeWidth={1.5} className="flex-shrink-0 mx-0.5" style={{ color: 'var(--border-strong)' }} />
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
                  ? <HugeiconsIcon icon={Tick01Icon} size={13} color="currentColor" strokeWidth={1.5} className="text-uacc-gold" />
                  : <HugeiconsIcon icon={Icon} size={13} color="currentColor" strokeWidth={1.5} className="text-uacc-gold" />}
              </div>
            </div>
          </div>
        )
      })}
      <span className="ml-2 text-[10px] whitespace-nowrap flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
        {isClosed ? 'Closed' : `With ${roleLabel(circulation.currentHolderRole)}`}
      </span>
    </div>
    {ccRoles.length > 0 && (
      <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
        Cc: {ccRoles.map(roleLabel).join(', ')}
      </span>
    )}
    </div>
  )
}
