'use client'

import React, { useState, useMemo, useEffect } from 'react'
import api from '@/lib/api'
import {
  ShieldCheck, Download, Activity, Search, ChevronLeft, ChevronRight, X,
  LogIn, LogOut, Upload, Trash2, Send, CheckCircle, CheckCircle2, XCircle,
  Clock, UserPlus, UserCheck, UserX, FilePlus, Eye, BookOpen, MessageSquare,
  FolderPlus, Paperclip, Unlink, Share2, ArrowRightCircle, RotateCcw,
  RefreshCw, PenTool, KeyRound, Truck, CalendarPlus, CalendarClock,
  CalendarX, Megaphone, MegaphoneOff, FileCheck2, StickyNote,
} from 'lucide-react'

const ROWS_PER_PAGE = 10
const SEARCH_DEBOUNCE_MS = 300

// Full AuditAction enum (prisma/schema.prisma) — kept in the same order as
// the schema so this list doesn't drift silently out of sync with it.
const ACTION_TYPES = [
  'ALL',
  'LOGIN', 'LOGOUT',
  'DOCUMENT_UPLOAD', 'DOCUMENT_DOWNLOAD', 'DOCUMENT_DELETE',
  'PROCUREMENT_SUBMIT', 'PROCUREMENT_VENDOR_VERIFIED', 'PROCUREMENT_APPROVE', 'PROCUREMENT_REJECT',
  'PA_TRIAGED_DOCUMENT', 'PA_SENT_GM_COMMUNICATION',
  'DRAFT_CREATED', 'DRAFT_SUBMITTED', 'DRAFT_REVIEWED', 'DRAFT_FINALIZED',
  'LOG_ENTRY',
  'USER_CREATED', 'USER_UPDATED', 'USER_DEACTIVATED',
  'REGISTRY_ENTRY_CREATED', 'REGISTRY_ENTRY_UPDATED', 'REGISTRY_ENTRY_DELETED',
  'ANNOTATION_ADDED', 'ANNOTATION_DELETED',
  'RECORDS_FILE_CREATED', 'ENTRY_ATTACHED_TO_FILE', 'ENTRY_DETACHED_FROM_FILE',
  'CIRCULATION_INITIATED', 'CIRCULATION_STEP_ADDED',
  'DOCUMENT_RETURNED_FOR_CORRECTION', 'DOCUMENT_RESUBMITTED',
  'SIGNATURE_CREATED', 'SIGNING_PIN_SET', 'SIGNING_PIN_CHANGED',
  'DISPATCH_CREATED', 'DISPATCH_ACKNOWLEDGED', 'DISPATCH_STATUS_UPDATED',
  'SCHEDULE_EVENT_CREATED', 'SCHEDULE_EVENT_UPDATED', 'SCHEDULE_EVENT_CANCELLED',
  'MESSAGE_SENT',
  'ANNOUNCEMENT_CREATED', 'ANNOUNCEMENT_DELETED',
]

const ACTION_META = {
  LOGIN:                              { label: 'Login',                  color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: LogIn },
  LOGOUT:                             { label: 'Logout',                 color: 'text-slate-400',   bg: 'bg-slate-500/10',   icon: LogOut },
  DOCUMENT_UPLOAD:                    { label: 'Upload',                 color: 'text-uacc-gold',   bg: 'bg-uacc-gold/10',   icon: Upload },
  DOCUMENT_DOWNLOAD:                  { label: 'Download',               color: 'text-blue-400',    bg: 'bg-blue-500/10',    icon: Download },
  DOCUMENT_DELETE:                    { label: 'Delete',                 color: 'text-red-400',     bg: 'bg-red-500/10',     icon: Trash2 },
  PROCUREMENT_SUBMIT:                 { label: 'Submitted',              color: 'text-blue-400',    bg: 'bg-blue-500/10',    icon: Send },
  PROCUREMENT_VENDOR_VERIFIED:        { label: 'Vendor Verified',        color: 'text-teal-400',    bg: 'bg-teal-500/10',    icon: CheckCircle2 },
  PROCUREMENT_APPROVE:                { label: 'Approved',               color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle },
  PROCUREMENT_REJECT:                 { label: 'Rejected',               color: 'text-red-400',     bg: 'bg-red-500/10',     icon: XCircle },
  PA_TRIAGED_DOCUMENT:                { label: 'PA Triaged',             color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  icon: FileCheck2 },
  PA_SENT_GM_COMMUNICATION:           { label: 'PA → GM Message',        color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  icon: MessageSquare },
  DRAFT_CREATED:                      { label: 'Draft Created',          color: 'text-uacc-gold',   bg: 'bg-uacc-gold/10',   icon: FilePlus },
  DRAFT_SUBMITTED:                    { label: 'Draft Submitted',        color: 'text-blue-400',    bg: 'bg-blue-500/10',    icon: Send },
  DRAFT_REVIEWED:                     { label: 'Draft Reviewed',         color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    icon: Eye },
  DRAFT_FINALIZED:                    { label: 'Draft Finalized',        color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  LOG_ENTRY:                          { label: 'Log Entry',              color: 'text-uacc-gold',   bg: 'bg-uacc-gold/10',   icon: Clock },
  USER_CREATED:                       { label: 'User Created',           color: 'text-purple-400',  bg: 'bg-purple-500/10',  icon: UserPlus },
  USER_UPDATED:                       { label: 'User Updated',           color: 'text-blue-400',    bg: 'bg-blue-500/10',    icon: UserCheck },
  USER_DEACTIVATED:                   { label: 'Deactivated',            color: 'text-red-400',     bg: 'bg-red-500/10',     icon: UserX },
  REGISTRY_ENTRY_CREATED:             { label: 'Registry Entry Created', color: 'text-amber-400',   bg: 'bg-amber-500/10',   icon: FolderPlus },
  REGISTRY_ENTRY_UPDATED:             { label: 'Registry Entry Updated', color: 'text-amber-400',   bg: 'bg-amber-500/10',   icon: BookOpen },
  REGISTRY_ENTRY_DELETED:             { label: 'Registry Entry Deleted', color: 'text-red-400',     bg: 'bg-red-500/10',     icon: Trash2 },
  ANNOTATION_ADDED:                   { label: 'Annotation Added',       color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    icon: StickyNote },
  ANNOTATION_DELETED:                 { label: 'Annotation Deleted',     color: 'text-red-400',     bg: 'bg-red-500/10',     icon: Trash2 },
  RECORDS_FILE_CREATED:               { label: 'Records File Created',   color: 'text-amber-400',   bg: 'bg-amber-500/10',   icon: FolderPlus },
  ENTRY_ATTACHED_TO_FILE:             { label: 'Attached to File',       color: 'text-amber-400',   bg: 'bg-amber-500/10',   icon: Paperclip },
  ENTRY_DETACHED_FROM_FILE:           { label: 'Detached from File',     color: 'text-slate-400',   bg: 'bg-slate-500/10',   icon: Unlink },
  CIRCULATION_INITIATED:              { label: 'Circulation Initiated',  color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  icon: Share2 },
  CIRCULATION_STEP_ADDED:             { label: 'Circulation Step',       color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  icon: ArrowRightCircle },
  DOCUMENT_RETURNED_FOR_CORRECTION:   { label: 'Returned for Correction',color: 'text-red-400',     bg: 'bg-red-500/10',     icon: RotateCcw },
  DOCUMENT_RESUBMITTED:               { label: 'Resubmitted',            color: 'text-blue-400',    bg: 'bg-blue-500/10',    icon: RefreshCw },
  SIGNATURE_CREATED:                  { label: 'Signature Created',      color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: PenTool },
  SIGNING_PIN_SET:                    { label: 'Signing PIN Set',        color: 'text-purple-400',  bg: 'bg-purple-500/10',  icon: KeyRound },
  SIGNING_PIN_CHANGED:                { label: 'Signing PIN Changed',    color: 'text-purple-400',  bg: 'bg-purple-500/10',  icon: KeyRound },
  DISPATCH_CREATED:                   { label: 'Dispatch Created',       color: 'text-blue-400',    bg: 'bg-blue-500/10',    icon: Truck },
  DISPATCH_ACKNOWLEDGED:              { label: 'Dispatch Acknowledged',  color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  DISPATCH_STATUS_UPDATED:            { label: 'Dispatch Status Update', color: 'text-blue-400',    bg: 'bg-blue-500/10',    icon: RefreshCw },
  SCHEDULE_EVENT_CREATED:             { label: 'Schedule Event Created', color: 'text-uacc-gold',   bg: 'bg-uacc-gold/10',   icon: CalendarPlus },
  SCHEDULE_EVENT_UPDATED:             { label: 'Schedule Event Updated', color: 'text-blue-400',    bg: 'bg-blue-500/10',    icon: CalendarClock },
  SCHEDULE_EVENT_CANCELLED:           { label: 'Schedule Event Cancelled', color: 'text-red-400',   bg: 'bg-red-500/10',     icon: CalendarX },
  MESSAGE_SENT:                       { label: 'Message Sent',           color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    icon: MessageSquare },
  ANNOUNCEMENT_CREATED:               { label: 'Announcement Created',   color: 'text-uacc-gold',   bg: 'bg-uacc-gold/10',   icon: Megaphone },
  ANNOUNCEMENT_DELETED:               { label: 'Announcement Deleted',   color: 'text-red-400',     bg: 'bg-red-500/10',     icon: MegaphoneOff },
}

// Full Role enum (prisma/schema.prisma), colors mirrored from Sidebar.jsx's
// ROLE_META so a given role reads the same everywhere in the app.
const ROLE_COLORS = {
  GENERAL_MANAGER:        'bg-uacc-gold/20 text-uacc-gold border-uacc-gold/30',
  GM_PERSONAL_ASSISTANT:  'bg-uacc-gold/20 text-uacc-gold border-uacc-gold/30',
  DEPARTMENT_HEAD:        'bg-blue-500/20 text-blue-400 border-blue-500/30',
  STAFF:                  'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  IT_ADMINISTRATOR:       'bg-purple-500/20 text-purple-400 border-purple-500/30',
  INTERNAL_AUDITOR:       'bg-rose-500/20 text-rose-400 border-rose-500/30',
  RECORDS_EXECUTIVE:      'bg-amber-500/20 text-amber-400 border-amber-500/30',
  PROCUREMENT_OFFICER:    'bg-orange-500/20 text-orange-400 border-orange-500/30',
  HR_MANAGER:             'bg-pink-500/20 text-pink-400 border-pink-500/30',
  FINANCE_DIRECTOR:       'bg-teal-500/20 text-teal-400 border-teal-500/30',
  MARKETING_OFFICER:      'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  CORPORATION_SECRETARY:  'bg-sky-500/20 text-sky-400 border-sky-500/30',
}
const DEFAULT_ROLE_COLOR = 'bg-white/10 text-[var(--text-faint)] border-white/15'

// Real `module` strings actually written by logAudit() calls across the
// backend (grepped, not guessed) — there's no dedicated "distinct modules"
// endpoint, so this list is maintained by hand alongside those call sites.
const MODULES = [
  'Account Security', 'Activity Logs', 'Authentication', 'Circulation',
  'Communications', 'Documents', 'Drafts', 'PA Communications', 'PA Inbox',
  'Procurement', 'Records', 'Schedule', 'User Management',
]

const formatString = (str) => {
  return str.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')
}

const getInitials = (name) => {
  return (name || '?').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

export default function AuditTrailPage() {
  const [filterAction, setFilterAction] = useState('ALL')
  const [filterUserId, setFilterUserId] = useState('ALL')
  const [filterModule, setFilterModule] = useState('ALL')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedLog, setExpandedLog] = useState(null)
  const [toast, setToast] = useState(null)

  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState({ totalActions: 0, deleteActions: 0, todayActions: 0, uniqueUsers: 0 })
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: ROWS_PER_PAGE, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  // Users seen so far across fetched pages, keyed by id — feeds the "User"
  // filter dropdown. GET /api/audit-trail doesn't expose a separate
  // distinct-user list, and GET /api/users is IT_ADMINISTRATOR-only (would
  // 403 for GENERAL_MANAGER/INTERNAL_AUDITOR, who are also authorized here),
  // so this grows from real results as the page is used rather than a full
  // roster fetched up front.
  const [knownUsers, setKnownUsers] = useState(new Map())

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // Debounce free-text search so it doesn't refetch on every keystroke. Page
  // reset lives in this same async callback (not a synchronous effect body)
  // since a settled search term is exactly when the result set changes.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Other filters reset the page directly in their own change handlers
  // (see onChange props below) rather than in an effect keyed on their
  // values — same result, without a synchronous setState-in-effect.

  useEffect(() => {
    let cancelled = false

    async function fetchLogs() {
      setLoading(true)
      setFetchError(null)
      try {
        const params = new URLSearchParams()
        if (debouncedSearch)        params.set('search', debouncedSearch)
        if (filterAction !== 'ALL') params.set('action', filterAction)
        if (filterModule !== 'ALL') params.set('module', filterModule)
        if (filterUserId !== 'ALL') params.set('userId', filterUserId)
        if (filterDateFrom)         params.set('dateFrom', filterDateFrom)
        if (filterDateTo)           params.set('dateTo', filterDateTo)
        params.set('page', String(currentPage))
        params.set('limit', String(ROWS_PER_PAGE))

        const res = await api.get(`/audit-trail?${params.toString()}`)
        if (cancelled) return

        if (res.success) {
          const data = res.data || {}
          setLogs(data.logs || [])
          setStats(data.stats || { totalActions: 0, deleteActions: 0, todayActions: 0, uniqueUsers: 0 })
          setPagination(data.pagination || { total: 0, page: 1, limit: ROWS_PER_PAGE, totalPages: 1 })
          setKnownUsers((prev) => {
            const next = new Map(prev)
            for (const log of data.logs || []) {
              if (log.user) next.set(log.user.id, log.user)
            }
            return next
          })
        } else {
          setFetchError(res.message || 'Failed to load audit trail')
        }
      } catch (err) {
        if (!cancelled) setFetchError(err.message || 'Failed to load audit trail')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchLogs()
    return () => { cancelled = true }
  }, [debouncedSearch, filterAction, filterUserId, filterModule, filterDateFrom, filterDateTo, currentPage])

  const clearFilters = () => {
    setFilterAction('ALL')
    setFilterUserId('ALL')
    setFilterModule('ALL')
    setFilterDateFrom('')
    setFilterDateTo('')
    setSearchQuery('')
    setCurrentPage(1)
  }

  const sortedKnownUsers = useMemo(
    () => Array.from(knownUsers.values()).sort((a, b) => a.name.localeCompare(b.name)),
    [knownUsers]
  )

  const toggleRowExpand = (id) => {
    setExpandedLog((prev) => (prev === id ? null : id))
  }

  return (
    <div className="p-6 md:p-8 w-full max-w-screen-2xl mx-auto min-h-screen pb-24">

      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">System Audit Trail</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-wider">
              Read Only
            </span>
          </div>
          <p className="text-[var(--text-muted)] text-sm">Complete read-only record of all system actions — tamper-evident log</p>
        </div>
        <button
          disabled
          title="PDF export for the Audit Trail isn't wired up yet"
          className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-bold text-sm bg-white/5 border border-white/10 text-[var(--text-faint)] cursor-not-allowed opacity-60"
        >
          <Download size={16} />
          Export PDF — Coming Soon
        </button>
      </div>

      {/* SECURITY NOTICE BANNER */}
      <div className="card rounded-xl p-4 mb-6 border border-white/5 border-l-4 border-l-uacc-gold bg-uacc-gold/5 flex items-start gap-3">
        <ShieldCheck className="text-uacc-gold flex-shrink-0 mt-0.5" size={18} />
        <p className="text-sm text-uacc-gold/90">
          This audit trail is tamper-evident and records all user actions automatically. Entries cannot be edited or deleted.
        </p>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card rounded-xl p-4 border border-white/5 bg-white/[0.02]">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Total Actions</p>
          <p className="text-2xl font-bold text-uacc-gold">{stats.totalActions}</p>
        </div>
        <div className="card rounded-xl p-4 border border-white/5 bg-white/[0.02]">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Unique Users</p>
          <p className="text-2xl font-bold text-blue-400">{stats.uniqueUsers}</p>
        </div>
        <div className="card rounded-xl p-4 border border-white/5 bg-white/[0.02]">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Delete Actions</p>
          <p className={`text-2xl font-bold ${stats.deleteActions > 0 ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>{stats.deleteActions}</p>
        </div>
        <div className="card rounded-xl p-4 border border-white/5 bg-white/[0.02]">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Today&apos;s Actions</p>
          <p className="text-2xl font-bold text-green-500">{stats.todayActions}</p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="card rounded-xl p-4 mb-6 border border-white/5 bg-white/[0.02] space-y-4">

        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" size={16} />
            <input
              type="text"
              placeholder="Search descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-uacc-gold/50"
            />
          </div>
          <select
            value={filterUserId}
            onChange={(e) => { setFilterUserId(e.target.value); setCurrentPage(1) }}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-uacc-gold/50 appearance-none"
          >
            <option value="ALL">All Users</option>
            {sortedKnownUsers.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <select
            value={filterModule}
            onChange={(e) => { setFilterModule(e.target.value); setCurrentPage(1) }}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-uacc-gold/50 appearance-none"
          >
            <option value="ALL">All Modules</option>
            {MODULES.map(mod => (
              <option key={mod} value={mod}>{mod}</option>
            ))}
          </select>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setCurrentPage(1) }}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-uacc-gold/50 appearance-none"
          >
            {ACTION_TYPES.map(action => (
              <option key={action} value={action}>{action === 'ALL' ? 'All Action Types' : formatString(action)}</option>
            ))}
          </select>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => { setFilterDateFrom(e.target.value); setCurrentPage(1) }}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-uacc-gold/50"
            style={{ colorScheme: 'dark' }}
          />
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => { setFilterDateTo(e.target.value); setCurrentPage(1) }}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-uacc-gold/50"
            style={{ colorScheme: 'dark' }}
          />
          <button
            onClick={clearFilters}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-bold text-sm border border-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
          >
            <X size={14} />
            Clear All Filters
          </button>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-[var(--text-faint)]">
            {loading ? 'Loading…' : `Showing ${logs.length ? (pagination.page - 1) * pagination.limit + 1 : 0}–${(pagination.page - 1) * pagination.limit + logs.length} of ${pagination.total} entries`}
          </span>
        </div>
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="card rounded-xl overflow-hidden border border-white/5 bg-white/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider w-16">#</th>
                <th className="px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider w-40">Timestamp</th>
                <th className="px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider w-64">User</th>
                <th className="px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider w-40">Action</th>
                <th className="px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider w-32">Module</th>
                <th className="px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider w-32 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-[var(--text-muted)] text-sm">
                    Loading audit logs...
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-red-400 text-sm">
                    {fetchError}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-[var(--text-muted)] text-sm">
                    No audit logs found matching your filters.
                  </td>
                </tr>
              ) : (
                logs.map(log => {
                  const meta = ACTION_META[log.action] || { label: formatString(log.action || ''), color: 'text-[var(--text-primary)]', bg: 'bg-white/10', icon: Activity }
                  const ActionIcon = meta.icon
                  const roleColor = ROLE_COLORS[log.user?.role] || DEFAULT_ROLE_COLOR

                  // Row tinting
                  let rowTint = ''
                  if (log.action.includes('DELETE') || log.action.includes('REJECT')) {
                    rowTint = 'bg-red-500/5'
                  } else if (log.action.includes('APPROVE')) {
                    rowTint = 'bg-emerald-500/5'
                  }

                  const dateObj = new Date(log.createdAt)
                  const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')} ${dateObj.toLocaleString('en-US', { month: 'short' })} ${dateObj.getFullYear()}`
                  const formattedTime = dateObj.toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

                  const isExpanded = expandedLog === log.id

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => toggleRowExpand(log.id)}
                        className={`cursor-pointer transition-colors group ${rowTint} hover:bg-white/[0.04]`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs font-heading text-[var(--text-faint)]">{String(log.id).padStart(4, '0')}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col text-xs text-[var(--text-faint)]">
                            <span className="font-bold text-[var(--text-secondary)]">{formattedDate}</span>
                            <span>{formattedTime}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border ${roleColor}`}>
                              {getInitials(log.user?.name)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-[var(--text-primary)]">{log.user?.name || 'Unknown user'}</span>
                              <span className={`text-[9px] uppercase tracking-wider font-bold mt-0.5 ${roleColor.split(' ')[1] || 'text-[var(--text-faint)]'}`}>
                                {log.user?.role ? formatString(log.user.role) : '—'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${meta.bg}`}>
                              <ActionIcon size={12} className={meta.color} />
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-wider ${meta.color}`}>
                              {meta.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                            {log.module}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-[var(--text-secondary)] truncate max-w-[250px] lg:max-w-[400px]">
                            {log.description}
                          </p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className="font-mono text-xs text-[var(--text-faint)]">{log.ipAddress || '—'}</span>
                        </td>
                      </tr>

                      {/* Expanded Row Content */}
                      {isExpanded && (
                        <tr className="bg-white/[0.01] border-b border-white/5">
                          <td colSpan="7" className="px-4 py-4">
                            <div className="pl-4 md:pl-[272px] pr-4">
                              <h4 className="text-[10px] uppercase tracking-wider text-[var(--text-faint)] font-bold mb-1">Full Description</h4>
                              <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-4">
                                {log.description}
                              </p>

                              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[10px] uppercase tracking-wider text-[var(--text-faint)] font-bold border-t border-white/5 pt-3">
                                <span>Log ID: {log.id}</span>
                                <span>User ID: {log.userId}</span>
                                <span>Module: {log.module}</span>
                                <span>Timestamp: {dateObj.toLocaleString('en-UG', { dateStyle: 'medium', timeStyle: 'medium' })}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                      currentPage === page
                        ? 'bg-uacc-gold/20 text-uacc-gold border border-uacc-gold/30'
                        : 'bg-white/5 border border-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                disabled={currentPage === pagination.totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md bg-green-500/10 border-green-500/20 text-green-400">
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}

    </div>
  )
}
