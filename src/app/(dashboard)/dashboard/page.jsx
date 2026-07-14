'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import api from '@/lib/api'
import {
  FolderOpen,
  ClipboardList,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  LogIn,
  UserPlus,
  Bot
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import SystemActivityWidget from '@/components/ui/SystemActivityWidget'
import PADashboard from '@/components/dashboard/PADashboard'
import ProcurementOfficerDashboard from '@/components/dashboard/ProcurementOfficerDashboard'
import HRManagerDashboard from '@/components/dashboard/HRManagerDashboard'
import FinanceDirectorDashboard from '@/components/dashboard/FinanceDirectorDashboard'
import CorporationSecretaryDashboard from '@/components/dashboard/CorporationSecretaryDashboard'
import MarketingOfficerDashboard from '@/components/dashboard/MarketingOfficerDashboard'
import InternalAuditorDashboard from '@/components/dashboard/InternalAuditorDashboard'

// HELPER FUNCTIONS
const formatDept = (dept) => {
  if (!dept) return ''
  return dept.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

const formatUGX = (amount) => {
  return `UGX ${amount.toLocaleString('en-US')}`
}

const getActionDetails = (action) => {
  switch (action) {
    case 'DOCUMENT_UPLOAD':
    case 'DOCUMENT_DOWNLOAD':
      return {
        icon: FolderOpen,
        color: '#C9973A',
        bg: 'rgba(201,151,58,0.1)'
      }
    case 'PROCUREMENT_APPROVE':
      return {
        icon: CheckCircle2,
        color: '#4ade80',
        bg: 'rgba(34,197,94,0.1)'
      }
    case 'PROCUREMENT_SUBMIT':
      return {
        icon: ClipboardList,
        color: '#a5b4fc',
        bg: 'rgba(99,102,241,0.1)'
      }
    case 'PROCUREMENT_REJECT':
      return {
        icon: XCircle,
        color: '#CC2200',
        bg: 'rgba(204,34,0,0.1)'
      }
    case 'LOG_ENTRY':
      return {
        icon: Clock,
        color: '#C9973A',
        bg: 'rgba(201,151,58,0.1)'
      }
    case 'LOGIN':
    case 'LOGOUT':
      return {
        icon: LogIn,
        color: '#A0AEC0',
        bg: 'rgba(160,174,192,0.1)'
      }
    case 'USER_CREATED':
      return {
        icon: UserPlus,
        color: '#c084fc',
        bg: 'rgba(192,132,252,0.1)'
      }
    default:
      return {
        icon: Clock,
        color: '#A0AEC0',
        bg: 'rgba(160,174,192,0.1)'
      }
  }
}

// Recharts Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="glass-panel rounded-lg p-3 text-xs flex flex-col gap-1.5"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-gold)',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <p className="font-heading font-bold" style={{ color: 'var(--text-primary)' }}>
          {label}
        </p>
        {payload.map((pld, index) => (
          <p key={index} className="flex items-center gap-2" style={{ color: pld.color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pld.color }} />
            <span className="font-semibold text-(--text-secondary)">{pld.name}:</span>
            <span className="font-bold">{pld.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardHome() {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState({
    totalDocuments: 0,
    documentsThisMonth: 0,
    pendingApprovals: 0,
    activityLogsToday: 0,
    totalStaff: 0
  })
  const [chartData, setChartData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [pendingProcurement, setPendingProcurement] = useState([])

  useEffect(() => {
    setMounted(true)

    async function fetchDashboardData() {
      try {
        const [
          statsRes,
          chartRes,
          catRes,
          activityRes,
          procRes
        ] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/procurement-chart'),
          api.get('/dashboard/documents-by-category'),
          api.get('/dashboard/recent-activity'),
          api.get('/dashboard/pending-procurement')
        ])

        if (statsRes.success) {
          setStats(statsRes.data || statsRes)
        }
        if (chartRes.success) {
          setChartData(chartRes.data || [])
        }
        if (catRes.success) {
          setCategoryData(catRes.data || [])
        }
        if (activityRes.success) {
          setRecentActivity(activityRes.data || [])
        }
        if (procRes.success) {
          setPendingProcurement(procRes.data || [])
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-80 text-sm" style={{ color: 'var(--text-muted)' }}>
        Loading dashboard...
      </div>
    )
  }

  if (user?.role === 'GM_PERSONAL_ASSISTANT') {
    return <PADashboard />
  }

  if (user?.role === 'PROCUREMENT_OFFICER') {
    return <ProcurementOfficerDashboard />
  }

  if (user?.role === 'HR_MANAGER') {
    return <HRManagerDashboard />
  }

  if (user?.role === 'FINANCE_DIRECTOR') {
    return <FinanceDirectorDashboard />
  }

  if (user?.role === 'CORPORATION_SECRETARY') {
    return <CorporationSecretaryDashboard />
  }

  if (user?.role === 'INTERNAL_AUDITOR') {
    return <InternalAuditorDashboard />
  }

  if (user?.role === 'MARKETING_OFFICER') {
    return <MarketingOfficerDashboard />
  }

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="flex flex-col gap-5 w-full animate-fadeIn">
      {/* PAGE HEADER */}
      <PageHeader
        title={`${greeting}, ${user?.name?.split(' ')[0] || 'User'}`}
        subtitle={`${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · Here&apos;s what&apos;s happening at UACC today`}
      />

      <SystemActivityWidget />

      {/* ROW 1 — STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          index={0}
          title="Total Documents"
          value={stats.totalDocuments}
          icon={FolderOpen}
          accentColor="gold"
          subtitle={`${stats.documentsThisMonth || 0} this month`}
        />
        <StatCard
          index={1}
          title="Pending Approvals"
          value={stats.pendingApprovals}
          icon={ClipboardList}
          accentColor="red"
          subtitle="Awaiting GM sign-off"
        />
        <StatCard
          index={2}
          title="Logs Today"
          value={stats.activityLogsToday}
          icon={Clock}
          accentColor="green"
          subtitle="Across all departments"
        />
        <StatCard
          index={3}
          title="Total Staff"
          value={stats.totalStaff}
          icon={Users}
          accentColor="blue"
          subtitle="System wide"
        />
      </div>

      {/* ROW 2 — CHARTS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Chart: Procurement Requests */}
        <div className="card rounded-xl p-5 md:col-span-7 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-heading font-bold text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Procurement Requests
              </h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Approved vs Rejected — last 6 months
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-heading">
              <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#C9973A' }} />
                Approved
              </span>
              <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#CC2200' }} />
                Rejected
              </span>
            </div>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {mounted && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 4, left: -22, bottom: 0 }}
                  barGap={4}
                >
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-heading)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-heading)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.025)' }} />
                  <Bar name="Approved" dataKey="approved" fill="#C9973A" radius={[3, 3, 0, 0]} maxBarSize={28} />
                  <Bar name="Rejected" dataKey="rejected" fill="#CC2200" radius={[3, 3, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                No chart data available
              </p>
            )}
          </div>
        </div>

        {/* Right Chart: Documents by Category */}
        <div className="card rounded-xl p-5 md:col-span-5 flex flex-col gap-4">
          <div>
            <h3 className="font-heading font-bold text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Documents by Category
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Distribution across all files
            </p>
          </div>

          <div className="relative h-52 flex items-center justify-center">
            {mounted && categoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Label */}
                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold font-heading" style={{ color: 'var(--text-primary)' }}>
                    {stats.totalDocuments}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>
                    Total Docs
                  </span>
                </div>
              </>
            ) : (
              <div className="text-xs text-muted" style={{ color: 'var(--text-muted)' }}>
                No category data available
              </div>
            )}
          </div>

          {/* Custom Category Legend */}
          <div className="grid grid-cols-3 gap-x-2 gap-y-3 mt-2 pt-3 border-t border-(--border-subtle)">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <div className="min-w-0 flex flex-col">
                  <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-secondary)' }}>
                    {cat.name}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {cat.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 3 — TWO PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Panel: Recent System Activity */}
        <div className="card rounded-xl p-5 md:col-span-7 flex flex-col gap-4">
          <div className="flex items-start justify-between shrink-0">
            <div>
              <h3 className="font-heading font-bold text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Recent System Activity
              </h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Live operational actions
              </p>
            </div>
            <Link href="/dashboard/audit-trail" className="text-[10px] hover:underline uppercase tracking-wider font-semibold font-heading text-uacc-gold flex-shrink-0">
              View All &rarr;
            </Link>
          </div>

          <div className="flex-1 max-h-95 overflow-y-auto pr-1 flex flex-col gap-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((item, index) => {
                const act = getActionDetails(item.action)
                const Icon = act.icon
                const isLast = index === recentActivity.length - 1

                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 pb-3 ${
                      !isLast ? 'border-b border-(--border-subtle)' : ''
                    }`}
                  >
                    {/* Left: icon circle */}
                    <div
                      className="p-2 rounded-lg shrink-0 border"
                      style={{
                        backgroundColor: act.bg,
                        borderColor: `rgba(${act.color === '#C9973A' ? '201,151,58' : act.color === '#4ade80' ? '34,197,94' : act.color === '#CC2200' ? '204,34,0' : '156,163,175'}, 0.2)`
                      }}
                    >
                      <Icon size={16} style={{ color: act.color }} />
                    </div>

                    {/* Center info */}
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {item.user}
                        </span>
                        <span className="text-[10px] text-(--text-muted) font-medium">
                          ({item.role?.replace(/_/g, ' ') || ''})
                        </span>
                        <Badge status={item.module?.toUpperCase()?.replace(/\s+/g, '_') || 'SYSTEM'} label={item.module} />
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {item.description}
                      </p>
                    </div>

                    {/* Right time */}
                    <span className="text-[10px] shrink-0 font-medium whitespace-nowrap self-start mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {item.time}
                    </span>
                  </div>
                )
              })
            ) : (
              <div className="text-xs text-muted text-center py-8" style={{ color: 'var(--text-muted)' }}>
                No recent activity logs
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Pending Procurement Requests */}
        <div className="card rounded-xl p-5 md:col-span-5 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Awaiting Approval
                </h3>
                {pendingProcurement.length > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded font-heading
                                   bg-uacc-red/12 text-uacc-red border border-uacc-red/20">
                    {pendingProcurement.length}
                  </span>
                )}
              </div>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Procurement requests pending
              </p>
            </div>
            <Link href="/dashboard/procurement" className="text-[10px] hover:underline uppercase tracking-wider font-semibold font-heading text-uacc-gold flex-shrink-0">
              View All &rarr;
            </Link>
          </div>

          <div className="flex-1 flex flex-col gap-3">
            {pendingProcurement.length > 0 ? (
              pendingProcurement.map((req) => (
                <div
                  key={req.id}
                  className="border border-(--border-default) rounded-lg p-4 bg-(--bg-surface-low) hover:border-(--border-gold) transition-all duration-200 flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-uacc-gold uppercase tracking-wider font-heading">
                      {req.id}
                    </span>
                    <Badge status={req.status} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-(--text-primary) truncate" title={req.item}>
                      {req.item}
                    </h4>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {formatDept(req.dept)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-1 pt-2 border-t border-(--border-subtle)">
                    <span className="text-xs font-heading font-bold" style={{ color: 'var(--text-primary)' }}>
                      {formatUGX(req.cost)}
                    </span>
                    <Link href="/dashboard/procurement">
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted text-center py-8" style={{ color: 'var(--text-muted)' }}>
                No pending procurement approvals
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ROW 4 — AI AGENT QUICK PANEL */}
      <div
        className="rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{
          background: 'linear-gradient(to right, rgba(201,151,58,0.06), transparent)',
          border: '1px solid rgba(201,151,58,0.20)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* Left */}
        <div className="flex items-center gap-3.5">
          <div
            className="p-2.5 rounded-xl shrink-0"
            style={{
              background: 'rgba(201,151,58,0.10)',
              border: '1px solid rgba(201,151,58,0.22)',
            }}
          >
            <Bot size={18} className="text-uacc-gold" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-heading tracking-tight" style={{ color: 'var(--text-primary)' }}>
              DIMS AI Agent
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Your intelligent operational assistant is ready
            </p>
          </div>
        </div>

        {/* Center: quick prompts */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            "Summarize today's activity",
            "Show pending approvals",
            "Recent document uploads",
          ].map((prompt) => (
            <button
              key={prompt}
              className="px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer"
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Right */}
        <div className="shrink-0">
          <Link href="/dashboard/ai-agent">
            <Button variant="ghost" size="sm">
              Open AI Agent &rarr;
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

