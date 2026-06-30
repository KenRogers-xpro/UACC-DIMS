'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  ShieldCheck, Download, Activity, Users, AlertTriangle, 
  Search, ChevronLeft, ChevronRight, X, Check,
  LogIn, LogOut, Upload, Trash2, Send, CheckCircle, XCircle, 
  Clock, UserPlus, UserCheck, UserX
} from 'lucide-react'

const MOCK_AUDIT_LOGS = [
  { id: 1,  userId: 2, userName: 'Patrick Katusabe',  userRole: 'IT_ADMINISTRATOR', action: 'DOCUMENT_UPLOAD',    module: 'Documents',   description: 'Uploaded "UACC IT Policy 2026.pdf" (2.4 MB) to Finance & Administration',           ipAddress: '192.168.1.45',  createdAt: '2026-06-26 08:45:12' },
  { id: 2,  userId: 3, userName: 'Head Engineering',  userRole: 'DEPARTMENT_HEAD',  action: 'PROCUREMENT_APPROVE', module: 'Procurement', description: 'Approved procurement request UACC-PROC-2026-0041 (Office Chairs x5)',                ipAddress: '192.168.1.62',  createdAt: '2026-06-26 08:30:44' },
  { id: 3,  userId: 4, userName: 'Staff Operations',  userRole: 'STAFF',            action: 'LOG_ENTRY',           module: 'Activity Logs', description: 'Submitted daily activity log for 26 Jun 2026 (6.0 hours)',                         ipAddress: '192.168.1.78',  createdAt: '2026-06-26 09:00:33' },
  { id: 4,  userId: 5, userName: 'Internal Auditor',  userRole: 'AUDITOR',          action: 'LOGIN',               module: 'Auth',        description: 'Successful login from 192.168.1.91',                                               ipAddress: '192.168.1.91',  createdAt: '2026-06-26 07:15:02' },
  { id: 5,  userId: 2, userName: 'Patrick Katusabe',  userRole: 'IT_ADMINISTRATOR', action: 'USER_CREATED',        module: 'Users',       description: 'Created new user account: Finance Officer (finance@uacc.go.ug) — Role: STAFF',      ipAddress: '192.168.1.45',  createdAt: '2026-06-25 16:20:11' },
  { id: 6,  userId: 1, userName: 'Lt. Gen. Lakara',   userRole: 'GENERAL_MANAGER',  action: 'PROCUREMENT_APPROVE', module: 'Procurement', description: 'Final GM approval on UACC-PROC-2026-0039 (UPS Battery Replacement — UGX 980,000)', ipAddress: '192.168.1.10',  createdAt: '2026-06-25 14:10:58' },
  { id: 7,  userId: 4, userName: 'Staff Operations',  userRole: 'STAFF',            action: 'PROCUREMENT_SUBMIT',  module: 'Procurement', description: 'Submitted new procurement request UACC-PROC-2026-0042 (Toner Cartridges x10)',     ipAddress: '192.168.1.78',  createdAt: '2026-06-25 11:45:30' },
  { id: 8,  userId: 2, userName: 'Patrick Katusabe',  userRole: 'IT_ADMINISTRATOR', action: 'DOCUMENT_UPLOAD',    module: 'Documents',   description: 'Uploaded "Network Topology Diagram v2.pdf" (1.1 MB) to Engineering',               ipAddress: '192.168.1.45',  createdAt: '2026-06-25 10:30:20' },
  { id: 9,  userId: 3, userName: 'Head Engineering',  userRole: 'DEPARTMENT_HEAD',  action: 'DOCUMENT_DOWNLOAD',  module: 'Documents',   description: 'Downloaded "Engineering Maintenance Manual v3.pdf" (8.7 MB)',                       ipAddress: '192.168.1.62',  createdAt: '2026-06-25 09:55:14' },
  { id: 10, userId: 1, userName: 'Lt. Gen. Lakara',   userRole: 'GENERAL_MANAGER',  action: 'PROCUREMENT_REJECT', module: 'Procurement', description: 'Rejected UACC-PROC-2026-0040 (Kaspersky x20 — UGX 3,200,000). Reason: Budget.',    ipAddress: '192.168.1.10',  createdAt: '2026-06-24 15:30:05' },
  { id: 11, userId: 2, userName: 'Patrick Katusabe',  userRole: 'IT_ADMINISTRATOR', action: 'USER_UPDATED',       module: 'Users',       description: 'Updated user profile: Head Pilots — Status changed to Inactive',                    ipAddress: '192.168.1.45',  createdAt: '2026-06-24 14:45:22' },
  { id: 12, userId: 5, userName: 'Internal Auditor',  userRole: 'AUDITOR',          action: 'LOGIN',               module: 'Auth',        description: 'Successful login from 192.168.1.91',                                               ipAddress: '192.168.1.91',  createdAt: '2026-06-24 14:00:01' },
  { id: 13, userId: 4, userName: 'Staff Operations',  userRole: 'STAFF',            action: 'LOG_ENTRY',           module: 'Activity Logs', description: 'Submitted daily activity log for 24 Jun 2026 (6.5 hours)',                         ipAddress: '192.168.1.78',  createdAt: '2026-06-24 09:30:44' },
  { id: 14, userId: 2, userName: 'Patrick Katusabe',  userRole: 'IT_ADMINISTRATOR', action: 'DOCUMENT_DELETE',    module: 'Documents',   description: 'Deleted document: "Draft Network Plan v1.pdf" — Reason: Superseded by v2',         ipAddress: '192.168.1.45',  createdAt: '2026-06-23 16:10:33' },
  { id: 15, userId: 1, userName: 'Lt. Gen. Lakara',   userRole: 'GENERAL_MANAGER',  action: 'LOGIN',               module: 'Auth',        description: 'Successful login from 192.168.1.10',                                               ipAddress: '192.168.1.10',  createdAt: '2026-06-23 07:00:15' },
]

const ACTION_TYPES = [
  'ALL',
  'LOGIN',
  'LOGOUT',
  'DOCUMENT_UPLOAD',
  'DOCUMENT_DOWNLOAD',
  'DOCUMENT_DELETE',
  'PROCUREMENT_SUBMIT',
  'PROCUREMENT_APPROVE',
  'PROCUREMENT_REJECT',
  'LOG_ENTRY',
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DEACTIVATED',
]

const ACTION_META = {
  LOGIN:               { label: 'Login',            color: 'text-emerald-400', bg: 'bg-emerald-500/10',  icon: LogIn         },
  LOGOUT:              { label: 'Logout',           color: 'text-slate-400',   bg: 'bg-slate-500/10',    icon: LogOut        },
  DOCUMENT_UPLOAD:     { label: 'Upload',           color: 'text-uacc-gold',   bg: 'bg-uacc-gold/10',    icon: Upload        },
  DOCUMENT_DOWNLOAD:   { label: 'Download',         color: 'text-blue-400',    bg: 'bg-blue-500/10',     icon: Download      },
  DOCUMENT_DELETE:     { label: 'Delete',           color: 'text-red-400',     bg: 'bg-red-500/10',      icon: Trash2        },
  PROCUREMENT_SUBMIT:  { label: 'Submitted',        color: 'text-blue-400',    bg: 'bg-blue-500/10',     icon: Send          },
  PROCUREMENT_APPROVE: { label: 'Approved',         color: 'text-emerald-400', bg: 'bg-emerald-500/10',  icon: CheckCircle   },
  PROCUREMENT_REJECT:  { label: 'Rejected',         color: 'text-red-400',     bg: 'bg-red-500/10',      icon: XCircle       },
  LOG_ENTRY:           { label: 'Log Entry',        color: 'text-uacc-gold',   bg: 'bg-uacc-gold/10',    icon: Clock         },
  USER_CREATED:        { label: 'User Created',     color: 'text-purple-400',  bg: 'bg-purple-500/10',   icon: UserPlus      },
  USER_UPDATED:        { label: 'User Updated',     color: 'text-blue-400',    bg: 'bg-blue-500/10',     icon: UserCheck     },
  USER_DEACTIVATED:    { label: 'Deactivated',      color: 'text-red-400',     bg: 'bg-red-500/10',      icon: UserX         },
}

const ROLE_COLORS = {
  GENERAL_MANAGER:  'bg-uacc-gold/20 text-uacc-gold border-uacc-gold/30',
  DEPARTMENT_HEAD:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  STAFF:            'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  IT_ADMINISTRATOR: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  AUDITOR:          'bg-rose-500/20 text-rose-400 border-rose-500/30',
}

const formatString = (str) => {
  return str.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')
}

const getInitials = (name) => {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

export default function AuditTrailPage() {
  const [filterAction, setFilterAction] = useState('ALL')
  const [filterUser, setFilterUser] = useState('ALL')
  const [filterModule, setFilterModule] = useState('ALL')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedLog, setExpandedLog] = useState(null)
  const [toast, setToast] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  
  const ROWS_PER_PAGE = 10

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleExport = () => {
    setIsExporting(true)
    setTimeout(() => {
      setToast({
        type: 'success',
        message: 'Audit trail exported. File: UACC_Audit_Trail_Jun2026.pdf'
      })
      setIsExporting(false)
    }, 1500)
  }

  const clearFilters = () => {
    setFilterAction('ALL')
    setFilterUser('ALL')
    setFilterModule('ALL')
    setFilterDateFrom('')
    setFilterDateTo('')
    setSearchQuery('')
    setCurrentPage(1)
  }

  const uniqueUsers = useMemo(() => {
    const users = new Set(MOCK_AUDIT_LOGS.map(log => log.userName))
    return Array.from(users).sort()
  }, [])

  const uniqueModules = useMemo(() => {
    return ['Auth', 'Documents', 'Procurement', 'Activity Logs', 'Users']
  }, [])

  const filteredLogs = useMemo(() => {
    return MOCK_AUDIT_LOGS.filter(log => {
      const matchesSearch = 
        log.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
        log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.module.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesAction = filterAction === 'ALL' || log.action === filterAction
      const matchesUser = filterUser === 'ALL' || log.userName === filterUser
      const matchesModule = filterModule === 'ALL' || log.module === filterModule
      
      const logDate = new Date(log.createdAt.split(' ')[0])
      const fromDate = filterDateFrom ? new Date(filterDateFrom) : null
      const toDate = filterDateTo ? new Date(filterDateTo) : null
      
      const matchesDateFrom = !fromDate || logDate >= fromDate
      const matchesDateTo = !toDate || logDate <= toDate

      return matchesSearch && matchesAction && matchesUser && matchesModule && matchesDateFrom && matchesDateTo
    })
  }, [searchQuery, filterAction, filterUser, filterModule, filterDateFrom, filterDateTo])

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / ROWS_PER_PAGE)
  const currentLogs = filteredLogs.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  )

  // Stats
  const totalActions = MOCK_AUDIT_LOGS.length
  const uniqueUsersCount = new Set(MOCK_AUDIT_LOGS.map(log => log.userId)).size
  const deleteActions = MOCK_AUDIT_LOGS.filter(log => log.action.includes('DELETE')).length
  const todayActions = MOCK_AUDIT_LOGS.filter(log => log.createdAt.startsWith('2026-06-26')).length

  const toggleRowExpand = (id) => {
    if (expandedLog === id) {
      setExpandedLog(null)
    } else {
      setExpandedLog(id)
    }
  }

  return (
    <div className="p-6 md:p-8 w-full max-w-screen-2xl mx-auto min-h-screen pb-24">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">System Audit Trail</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-wider">
              Read Only
            </span>
          </div>
          <p className="text-white/60 text-sm">Complete read-only record of all system actions — tamper-evident log</p>
        </div>
        <button 
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-bold text-sm bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <Download size={16} />
          {isExporting ? "Exporting..." : "Export PDF"}
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
          <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold mb-1">Total Actions</p>
          <p className="text-2xl font-bold text-uacc-gold">{totalActions}</p>
        </div>
        <div className="card rounded-xl p-4 border border-white/5 bg-white/[0.02]">
          <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold mb-1">Unique Users</p>
          <p className="text-2xl font-bold text-blue-400">{uniqueUsersCount}</p>
        </div>
        <div className="card rounded-xl p-4 border border-white/5 bg-white/[0.02]">
          <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold mb-1">Delete Actions</p>
          <p className={`text-2xl font-bold ${deleteActions > 0 ? 'text-red-500' : 'text-white'}`}>{deleteActions}</p>
        </div>
        <div className="card rounded-xl p-4 border border-white/5 bg-white/[0.02]">
          <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold mb-1">Today's Actions</p>
          <p className="text-2xl font-bold text-green-500">{todayActions}</p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="card rounded-xl p-4 mb-6 border border-white/5 bg-white/[0.02] space-y-4">
        
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <input 
              type="text" 
              placeholder="Search descriptions, users, modules..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-uacc-gold/50"
            />
          </div>
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-uacc-gold/50 appearance-none"
          >
            <option value="ALL">All Users</option>
            {uniqueUsers.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-uacc-gold/50 appearance-none"
          >
            <option value="ALL">All Modules</option>
            {uniqueModules.map(mod => (
              <option key={mod} value={mod}>{mod}</option>
            ))}
          </select>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-uacc-gold/50 appearance-none"
          >
            {ACTION_TYPES.map(action => (
              <option key={action} value={action}>{action === 'ALL' ? 'All Action Types' : formatString(action)}</option>
            ))}
          </select>
          <input 
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-uacc-gold/50"
            style={{ colorScheme: 'dark' }}
          />
          <input 
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-uacc-gold/50"
            style={{ colorScheme: 'dark' }}
          />
          <button 
            onClick={clearFilters}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-bold text-sm border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={14} />
            Clear All Filters
          </button>
        </div>
        
        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-white/40">Showing {filteredLogs.length} of {totalActions} entries</span>
        </div>
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="card rounded-xl overflow-hidden border border-white/5 bg-white/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider w-16">#</th>
                <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider w-40">Timestamp</th>
                <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider w-64">User</th>
                <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider w-40">Action</th>
                <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider w-32">Module</th>
                <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider w-32 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {currentLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-white/50 text-sm">
                    No audit logs found matching your filters.
                  </td>
                </tr>
              ) : (
                currentLogs.map(log => {
                  const meta = ACTION_META[log.action] || { label: log.action, color: 'text-white', bg: 'bg-white/10', icon: Activity }
                  const ActionIcon = meta.icon
                  
                  // Row tinting
                  let rowTint = ''
                  if (log.action.includes('DELETE') || log.action.includes('REJECT')) {
                    rowTint = 'bg-red-500/5'
                  } else if (log.action.includes('APPROVE')) {
                    rowTint = 'bg-emerald-500/5'
                  }

                  // Split timestamp
                  const [datePart, timePart] = log.createdAt.split(' ')
                  const dateObj = new Date(datePart)
                  const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')} ${dateObj.toLocaleString('en-US', { month: 'short' })} ${dateObj.getFullYear()}`

                  const isExpanded = expandedLog === log.id

                  return (
                    <React.Fragment key={log.id}>
                      <tr 
                        onClick={() => toggleRowExpand(log.id)}
                        className={`cursor-pointer transition-colors group ${rowTint} hover:bg-white/[0.04]`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs font-heading text-white/40">{log.id.toString().padStart(4, '0')}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col text-xs text-white/40">
                            <span className="font-bold text-white/70">{formattedDate}</span>
                            <span>{timePart}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border ${ROLE_COLORS[log.userRole]}`}>
                              {getInitials(log.userName)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-white">{log.userName}</span>
                              <span className={`text-[9px] uppercase tracking-wider font-bold mt-0.5 ${ROLE_COLORS[log.userRole]?.split(' ')[1] || 'text-white/40'}`}>
                                {formatString(log.userRole)}
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
                          <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-white/60 font-semibold uppercase tracking-wider">
                            {log.module}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-white/70 truncate max-w-[250px] lg:max-w-[400px]">
                            {log.description}
                          </p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className="font-mono text-xs text-white/40">{log.ipAddress}</span>
                        </td>
                      </tr>
                      
                      {/* Expanded Row Content */}
                      {isExpanded && (
                        <tr className="bg-white/[0.01] border-b border-white/5">
                          <td colSpan="7" className="px-4 py-4">
                            <div className="pl-[272px] pr-4">
                              <h4 className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-1">Full Description</h4>
                              <p className="text-sm text-white/90 leading-relaxed mb-4">
                                {log.description}
                              </p>
                              
                              <div className="flex items-center gap-6 text-[10px] uppercase tracking-wider text-white/40 font-bold border-t border-white/5 pt-3">
                                <span>Log ID: {log.id}</span>
                                <span>User ID: {log.userId}</span>
                                <span>Module: {log.module}</span>
                                <span>Timestamp: {log.createdAt}</span>
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
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
            <span className="text-xs text-white/50">
              Entries {(currentPage - 1) * ROWS_PER_PAGE + 1}–{Math.min(currentPage * ROWS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length}
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                      currentPage === page 
                        ? 'bg-uacc-gold/20 text-uacc-gold border border-uacc-gold/30' 
                        : 'bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            <Check size={18} />
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}

    </div>
  )
}
