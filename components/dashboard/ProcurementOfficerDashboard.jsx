'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import api from '@/lib/api'
import { ClipboardList, Clock, TrendingUp, AlertCircle, ArrowRight, TrendingDown } from 'lucide-react'

import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Button from '@/components/ui/Button'

export default function ProcurementOfficerDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    pendingVerification: 0,
    averageProcessingTime: '0 hours',
    requestsThisMonth: { count: 0, percentChange: 0 },
    flaggedForClarification: 0,
    vendorBreakdown: []
  })

  useEffect(() => {
    let cancelled = false
    async function loadDashboard() {
      try {
        const res = await api.get('/dashboard/stats')
        if (!cancelled && res.success) {
          setStats(res.data || res)
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    loadDashboard()
    return () => { cancelled = true }
  }, [])

  if (!user) return null

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      <PageHeader
        title={`Good morning, ${user.name}`}
        subtitle="Your Procurement Command Center"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard
          title="Pending Verification"
          value={loading ? '—' : stats.pendingVerification}
          icon={ClipboardList}
          accentColor="gold"
          subtitle="Awaiting your review"
        />
        <StatCard
          title="Avg Processing Time"
          value={loading ? '—' : stats.averageProcessingTime}
          icon={Clock}
          accentColor="blue"
          subtitle="Last 30 days"
        />
        <StatCard
          title="Requests This Month"
          value={loading ? '—' : stats.requestsThisMonth?.count || 0}
          icon={(stats.requestsThisMonth?.percentChange || 0) >= 0 ? TrendingUp : TrendingDown}
          accentColor={(stats.requestsThisMonth?.percentChange || 0) >= 0 ? "green" : "red"}
          subtitle={`${(stats.requestsThisMonth?.percentChange || 0) > 0 ? '+' : ''}${stats.requestsThisMonth?.percentChange || 0}% vs last month`}
        />
        <StatCard
          title="Flagged for Clarification"
          value={loading ? '—' : stats.flaggedForClarification}
          icon={AlertCircle}
          accentColor="red"
          subtitle="Returned to Dept Head"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Vendors */}
        <div className="card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Top Vendors
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Most utilized vendors
              </p>
            </div>
            <Link href="/dashboard/procurement/vendors" className="text-xs hover:underline uppercase tracking-wider font-semibold font-heading text-uacc-gold">
              View All &rarr;
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="text-xs text-muted py-4" style={{ color: 'var(--text-muted)' }}>Loading...</div>
            ) : stats.vendorBreakdown && stats.vendorBreakdown.length > 0 ? (
              stats.vendorBreakdown.map((v, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-black/10" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{v.vendor}</span>
                  <span className="text-xs font-bold text-uacc-gold bg-uacc-gold/10 px-2 py-1 rounded-full">{v.count} requests</span>
                </div>
              ))
            ) : (
              <div className="text-xs py-4" style={{ color: 'var(--text-muted)' }}>No vendor data available.</div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card rounded-xl p-6">
          <div className="mb-4">
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Quick Actions
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Common procurement tasks
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/dashboard/procurement?filter=pending_po">
              <Button variant="outline" className="w-full justify-between py-6">
                <span className="flex items-center gap-2"><ClipboardList size={18}/> Review Pending Requests</span>
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/dashboard/procurement/vendors">
              <Button variant="outline" className="w-full justify-between py-6">
                <span className="flex items-center gap-2"><TrendingUp size={18}/> Vendor List</span>
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
