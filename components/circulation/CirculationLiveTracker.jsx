'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  User, Users, Shield, Wallet, Megaphone, FileCheck2,
  Landmark, ClipboardList, ScrollText, Briefcase, Check,
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
 * Compact, package-tracking-style progress preview for a single circulation —
 * role icons in sequence, current holder pulsing. Fetches and polls its own
 * data by circulationId so it can be dropped into an inbox row or the top of
 * the full CirculationTimeline without the parent needing to already have
 * step data loaded.
 */
export default function CirculationLiveTracker({ circulationId }) {
  const [circulation, setCirculation] = useState(null)

  const fetchCirculation = useCallback(async () => {
    if (!circulationId) return
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

  if (!circulation) return null

  const steps = circulation.steps || []
  const sequence = steps.length > 0
    ? [steps[0].fromRole, ...steps.map((s) => s.toRole)]
    : [circulation.currentHolderRole]
  const isClosed = circulation.status === 'CLOSED'

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-0.5">
      {sequence.map((role, idx) => {
        const Icon = ROLE_ICONS[role] || User
        const isLast = idx === sequence.length - 1
        const isCurrent = isLast && !isClosed
        const isFinal = isLast && isClosed

        return (
          <div key={`${role}-${idx}`} className="flex items-center flex-shrink-0">
            {idx > 0 && (
              <div className="w-3 sm:w-4 h-px flex-shrink-0" style={{ background: 'var(--border-default)' }} />
            )}
            <div className="relative flex-shrink-0" title={`${roleLabel(role)}${isCurrent ? ' — current holder' : ''}`}>
              {isCurrent && (
                <span className="animate-ping absolute inset-0 rounded-full bg-uacc-gold opacity-60" />
              )}
              <div
                className="relative w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={
                  isFinal
                    ? { background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.5)' }
                    : isCurrent
                    ? { background: 'rgba(201,151,58,0.25)', border: '1px solid rgba(201,151,58,0.7)', boxShadow: '0 0 8px rgba(201,151,58,0.5)' }
                    : { background: 'var(--glass-bg)', border: '1px solid var(--border-default)' }
                }
              >
                {isFinal
                  ? <Check size={11} className="text-emerald-400" />
                  : <Icon size={11} className={isCurrent ? 'text-uacc-gold' : ''} style={!isCurrent ? { color: 'var(--text-muted)' } : undefined} />}
              </div>
            </div>
          </div>
        )
      })}
      <span className="ml-1.5 text-[10px] whitespace-nowrap flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
        {isClosed ? 'Closed' : `With ${roleLabel(circulation.currentHolderRole)}`}
      </span>
    </div>
  )
}
