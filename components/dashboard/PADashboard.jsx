'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import api from '@/lib/api'
import { CalendarClock, Inbox, FileText, Sparkles, Loader2, ArrowRight } from 'lucide-react'

import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Button from '@/components/ui/Button'
import SystemActivityWidget from '@/components/ui/SystemActivityWidget'
import { searchKnowledgeBase } from '@/lib/ai'

function getTodayBounds() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return { start, end }
}

function getWeekStart() {
  const date = new Date()
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const weekStart = new Date(date)
  weekStart.setDate(diff)
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

function BriefingCard({ briefing, loading }) {
  return (
    <div
      className="card rounded-xl p-6 border"
      style={{
        borderColor: 'rgba(201,151,58,0.20)',
        backgroundImage: 'linear-gradient(135deg, rgba(201,151,58,0.10) 0%, rgba(255,255,255,0.03) 55%, transparent 100%)',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-full bg-uacc-gold/15 text-uacc-gold border border-uacc-gold/20">
          <Sparkles size={18} />
        </div>
        <div>
          <h3 className="font-heading font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
            AI Briefing
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Morning summary for the General Manager
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-black/10 p-4" style={{ minHeight: 120, borderColor: 'var(--border-subtle)' }}>
        {loading ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            <Loader2 size={16} className="animate-spin" />
            Preparing briefing...
          </div>
        ) : (
          <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
            {briefing || 'The briefing will appear here once the PA dashboard syncs with the live queues.'}
          </p>
        )}
      </div>
    </div>
  )
}

export default function PADashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [briefingLoading, setBriefingLoading] = useState(true)
  const [briefing, setBriefing] = useState('')
  const [stats, setStats] = useState({
    pendingTriage: 0,
    todaysSchedule: 0,
    draftsAwaitingReview: 0,
    draftsRejectedThisWeek: 0,
  })

  const displayName = user?.name || 'General Manager'

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setLoading(true)
      setBriefingLoading(true)

      try {
        const { start, end } = getTodayBounds()
        const weekStart = getWeekStart()

        const [inboxData, scheduleData, draftsData] = await Promise.all([
          api.get('/pa/inbox'),
          api.get(`/schedule?startDate=${encodeURIComponent(start.toISOString())}&endDate=${encodeURIComponent(end.toISOString())}`),
          api.get('/drafts/summary'),
        ])

        if (cancelled) return

        const nextStats = {
          pendingTriage: Array.isArray(inboxData?.data) ? inboxData.data.length : 0,
          todaysSchedule: Array.isArray(scheduleData?.data?.events) ? scheduleData.data.events.length : 0,
          draftsAwaitingReview: draftsData?.data?.summary?.pendingGMReviewCount || 0,
          draftsRejectedThisWeek: draftsData?.data?.summary?.rejectedThisWeekCount || 0,
        }

        setStats(nextStats)

        const briefingText = await searchKnowledgeBase({
          query: "summarize today's pending items, schedule, and flagged documents for the General Manager",
          context: {
            pendingTriage: nextStats.pendingTriage,
            todaysSchedule: nextStats.todaysSchedule,
            draftsAwaitingReview: nextStats.draftsAwaitingReview,
            draftsRejectedThisWeek: nextStats.draftsRejectedThisWeek,
            weekStart: weekStart.toISOString(),
          },
        })

        if (!cancelled) {
          setBriefing(briefingText)
        }
      } catch (error) {
        if (!cancelled) {
          setBriefing('The PA dashboard could not load the live briefing right now. Review the queue cards below for the current status.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setBriefingLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  const quickActions = useMemo(() => ([
    { href: '/dashboard/drafts/new', label: 'New Draft' },
    { href: '/dashboard/schedule?action=new', label: 'Add Schedule Event' },
    { href: '/dashboard/pa-inbox', label: 'View Inbox' },
  ]), [])

  if (!user) {
    return (
      <div className="flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)', minHeight: 320 }}>
        Loading dashboard...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      <PageHeader
        title={`Good morning, ${displayName}`}
        subtitle="Your PA command center for the day"
      />

      <SystemActivityWidget />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard
          index={0}
          title="Pending Triage"
          value={loading ? '—' : stats.pendingTriage}
          icon={Inbox}
          accentColor="red"
          subtitle="Items awaiting your review"
        />
        <StatCard
          index={1}
          title="Today's Schedule"
          value={loading ? '—' : stats.todaysSchedule}
          icon={CalendarClock}
          accentColor="gold"
          subtitle="Events on today's calendar"
        />
        <StatCard
          index={2}
          title="Drafts Awaiting GM Review"
          value={loading ? '—' : stats.draftsAwaitingReview}
          icon={FileText}
          accentColor="blue"
          subtitle="Ready for the General Manager"
        />
        <StatCard
          index={3}
          title="Drafts Rejected This Week"
          value={loading ? '—' : stats.draftsRejectedThisWeek}
          icon={FileText}
          accentColor="green"
          subtitle="Signals drafting adjustments"
        />
      </div>

      <BriefingCard briefing={briefing} loading={briefingLoading} />

      <div className="card rounded-xl p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Quick Actions
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Common PA tasks and shortcuts
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Button variant="outline" className="justify-between" style={{ minWidth: 180 }}>
                {action.label}
                <ArrowRight size={14} />
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}