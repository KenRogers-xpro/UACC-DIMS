'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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

// MOCK DATA
const MOCK_STATS = {
  totalDocuments: 847,
  pendingApprovals: 12,
  activityLogsToday: 34,
  totalStaff: 67,
  documentsThisMonth: 43,
  procurementThisMonth: 28,
}

const MOCK_PROCUREMENT_CHART = [
  { month: 'Jan', requests: 8,  approved: 6,  rejected: 2 },
  { month: 'Feb', requests: 12, approved: 9,  rejected: 3 },
  { month: 'Mar', requests: 7,  approved: 7,  rejected: 0 },
  { month: 'Apr', requests: 15, approved: 11, rejected: 4 },
  { month: 'May', requests: 10, approved: 8,  rejected: 2 },
  { month: 'Jun', requests: 18, approved: 14, rejected: 4 },
]

const MOCK_DOCUMENTS_BY_CATEGORY = [
  { name: 'Policy',   value: 124, color: '#C9973A' },
  { name: 'Report',   value: 289, color: '#CC2200' },
  { name: 'Memo',     value: 198, color: '#4ade80' },
  { name: 'Contract', value: 87,  color: '#a5b4fc' },
  { name: 'Form',     value: 103, color: '#f4be5d' },
  { name: 'Other',    value: 46,  color: '#94a3b8' },
]

const MOCK_RECENT_ACTIVITY = [
  { id: 1, user: 'Patrick Katusabe',   role: 'IT_ADMINISTRATOR', action: 'DOCUMENT_UPLOAD',    module: 'Documents',   time: '2 min ago',  description: 'Uploaded "IT Policy 2026.pdf"' },
  { id: 2, user: 'Head Engineering',   role: 'DEPARTMENT_HEAD',  action: 'PROCUREMENT_APPROVE', module: 'Procurement', time: '15 min ago', description: 'Approved request UACC-PROC-2026-0041' },
  { id: 3, user: 'Staff Operations',   role: 'STAFF',            action: 'LOG_ENTRY',           module: 'Activity Logs', time: '1 hr ago', description: 'Submitted daily activity log' },
  { id: 4, user: 'Internal Auditor',   role: 'AUDITOR',          action: 'LOGIN',               module: 'Auth',        time: '2 hr ago',  description: 'Logged into the system' },
  { id: 5, user: 'Staff Operations',   role: 'STAFF',            action: 'PROCUREMENT_SUBMIT',  module: 'Procurement', time: '3 hr ago',  description: 'Submitted new procurement request' },
  { id: 6, user: 'Patrick Katusabe',   role: 'IT_ADMINISTRATOR', action: 'USER_CREATED',        module: 'Users',       time: '5 hr ago',  description: 'Created new user account' },
  { id: 7, user: 'Head Engineering',   role: 'DEPARTMENT_HEAD',  action: 'DOCUMENT_DOWNLOAD',   module: 'Documents',   time: 'Yesterday', description: 'Downloaded "Engineering Manual v3.pdf"' },
  { id: 8, user: 'Lt. Gen. Lakara',    role: 'GENERAL_MANAGER',  action: 'PROCUREMENT_APPROVE', module: 'Procurement', time: 'Yesterday', description: 'Final approval on UACC-PROC-2026-0039' },
]

const MOCK_PENDING_PROCUREMENTS = [
  { id: 'UACC-PROC-2026-0043', item: 'Network Switch (Cisco SG350)',    dept: 'FINANCE_AND_ADMINISTRATION', cost: 2850000, requestedBy: 'Patrick Katusabe',  status: 'PENDING' },
  { id: 'UACC-PROC-2026-0042', item: 'Printer Toner Cartridges (x10)',  dept: 'OPERATIONS',                 cost: 450000,  requestedBy: 'Staff Operations',   status: 'DEPT_HEAD_APPROVED' },
  { id: 'UACC-PROC-2026-0041', item: 'Office Chairs (x5)',              dept: 'ENGINEERING',                cost: 1250000, requestedBy: 'Head Engineering',   status: 'PENDING' },
]

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
            <span className="font-semibold text-[var(--text-secondary)]">{pld.name}:</span>
            <span className="font-bold">{pld.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardHome() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      {/* PAGE HEADER */}
      <PageHeader
        title="Good morning, Lt. Gen. Lakara"
        subtitle="Friday, 27 June 2026 · Here's what's happening at UACC today"
      />

      {/* ROW 1 — STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Documents"
          value={MOCK_STATS.totalDocuments}
          icon={FolderOpen}
          accentColor="gold"
          subtitle="43 uploaded this month"
          trend={12}
        />
        <StatCard
          title="Pending Approvals"
          value={MOCK_STATS.pendingApprovals}
          icon={ClipboardList}
          accentColor="red"
          subtitle="3 awaiting GM sign-off"
          trend={null}
        />
        <StatCard
          title="Activity Logs Today"
          value={MOCK_STATS.activityLogsToday}
          icon={Clock}
          accentColor="green"
          subtitle="Across 5 departments"
          trend={8}
        />
        <StatCard
          title="Total Staff"
          value={MOCK_STATS.totalStaff}
          icon={Users}
          accentColor="blue"
          subtitle="5 active departments"
          trend={null}
        />
      </div>

      {/* ROW 2 — CHARTS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Chart: Procurement Requests */}
        <div className="card rounded-xl p-6 md:col-span-7 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Procurement Requests — Last 6 Months
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Approved vs Rejected breakdown
            </p>
          </div>
          <div className="h-[280px] w-full flex items-center justify-center">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={MOCK_PROCUREMENT_CHART}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-heading)',
                      color: 'var(--text-secondary)',
                      paddingTop: '10px'
                    }}
                  />
                  <Bar
                    name="Approved"
                    dataKey="approved"
                    fill="#C9973A"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    name="Rejected"
                    dataKey="rejected"
                    fill="#CC2200"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-muted" style={{ color: 'var(--text-muted)' }}>
                Loading chart...
              </div>
            )}
          </div>
        </div>

        {/* Right Chart: Documents by Category */}
        <div className="card rounded-xl p-6 md:col-span-5 flex flex-col justify-between">
          <div>
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Documents by Category
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Category distribution of all files
            </p>
          </div>

          <div className="relative h-[220px] flex items-center justify-center my-2">
            {mounted ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={MOCK_DOCUMENTS_BY_CATEGORY}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {MOCK_DOCUMENTS_BY_CATEGORY.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Label */}
                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold font-heading" style={{ color: 'var(--text-primary)' }}>
                    {MOCK_STATS.totalDocuments}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>
                    Total Docs
                  </span>
                </div>
              </>
            ) : (
              <div className="text-xs text-muted" style={{ color: 'var(--text-muted)' }}>
                Loading chart...
              </div>
            )}
          </div>

          {/* Custom Category Legend */}
          <div className="grid grid-cols-3 gap-x-2 gap-y-3 mt-2 pt-3 border-t border-[var(--border-subtle)]">
            {MOCK_DOCUMENTS_BY_CATEGORY.map((cat) => (
              <div key={cat.name} className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Panel: Recent System Activity */}
        <div className="card rounded-xl p-6 md:col-span-7 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div>
              <h3 className="font-heading font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Recent System Activity
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Live operational actions
              </p>
            </div>
            <Link href="/dashboard/audit-trail" className="text-xs hover:underline uppercase tracking-wider font-semibold font-heading text-uacc-gold">
              View All &rarr;
            </Link>
          </div>

          <div className="flex-1 max-h-[380px] overflow-y-auto pr-1 flex flex-col gap-3">
            {MOCK_RECENT_ACTIVITY.map((item, index) => {
              const act = getActionDetails(item.action)
              const Icon = act.icon
              const isLast = index === MOCK_RECENT_ACTIVITY.length - 1

              return (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 pb-3 ${
                    !isLast ? 'border-b border-[var(--border-subtle)]' : ''
                  }`}
                >
                  {/* Left: icon circle */}
                  <div
                    className="p-2 rounded-lg flex-shrink-0 border"
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
                      <span className="text-[10px] text-slate-400 font-medium">
                        ({item.role.replace(/_/g, ' ')})
                      </span>
                      <Badge status={item.module.toUpperCase().replace(/\s+/g, '_')} label={item.module} />
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
            })}
          </div>
        </div>

        {/* Right Panel: Pending Procurement Requests */}
        <div className="card rounded-xl p-6 md:col-span-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Awaiting Approval
              </h3>
              <Badge status="REJECTED" label="12" />
            </div>
            <Link href="/dashboard/procurement" className="text-xs hover:underline uppercase tracking-wider font-semibold font-heading text-uacc-gold">
              View All &rarr;
            </Link>
          </div>

          <div className="flex-1 flex flex-col gap-3">
            {MOCK_PENDING_PROCUREMENTS.map((req) => (
              <div
                key={req.id}
                className="border border-[var(--border-default)] rounded-lg p-4 bg-surface-low/30 hover:border-[var(--border-gold)] transition-all duration-200 flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-uacc-gold uppercase tracking-wider font-heading">
                    {req.id}
                  </span>
                  <Badge status={req.status} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white truncate" title={req.item}>
                    {req.item}
                  </h4>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {formatDept(req.dept)}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-1 pt-2 border-t border-[var(--border-subtle)]">
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
            ))}
          </div>
        </div>
      </div>

      {/* ROW 4 — AI AGENT QUICK PANEL */}
      <div className="card rounded-xl p-5 border-l-4 border-uacc-gold flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-uacc-gold/10 text-uacc-gold border border-uacc-gold/20 flex-shrink-0">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold font-heading" style={{ color: 'var(--text-primary)' }}>
              DIMS AI Agent
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Your intelligent operational assistant is ready
            </p>
          </div>
        </div>

        {/* Center */}
        <div className="flex flex-wrap items-center gap-2">
          <button className="glass-panel px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
            📊 Summarize today's activity
          </button>
          <button className="glass-panel px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
            📋 Show pending approvals
          </button>
          <button className="glass-panel px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
            📁 Recent document uploads
          </button>
        </div>

        {/* Right */}
        <div className="flex-shrink-0">
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
