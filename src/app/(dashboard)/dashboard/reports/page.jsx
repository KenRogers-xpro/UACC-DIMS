'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  FolderOpen,
  ClipboardList,
  Clock,
  BarChart2,
  FileText,
  Eye,
  Download,
  Loader2,
  X,
  CheckCircle,
  XCircle
} from 'lucide-react'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts'

import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

// MOCK DATA
const MOCK_MONTHLY_PROCUREMENT = [
  { month: 'Jan', submitted: 8,  approved: 6,  rejected: 2,  totalCost: 4200000 },
  { month: 'Feb', submitted: 12, approved: 9,  rejected: 3,  totalCost: 7800000 },
  { month: 'Mar', submitted: 7,  approved: 7,  rejected: 0,  totalCost: 3100000 },
  { month: 'Apr', submitted: 15, approved: 11, rejected: 4,  totalCost: 12400000 },
  { month: 'May', submitted: 10, approved: 8,  rejected: 2,  totalCost: 6750000 },
  { month: 'Jun', submitted: 18, approved: 14, rejected: 4,  totalCost: 9850000 },
]

const MOCK_DOCS_BY_DEPT = [
  { dept: 'GM Office',    count: 87  },
  { dept: 'Finance',      count: 214 },
  { dept: 'Engineering',  count: 312 },
  { dept: 'Pilots',       count: 98  },
  { dept: 'Operations',   count: 136 },
]

const MOCK_ACTIVITY_TREND = [
  { week: 'Week 1', logs: 28, hours: 142 },
  { week: 'Week 2', logs: 34, hours: 178 },
  { week: 'Week 3', logs: 29, hours: 151 },
  { week: 'Week 4', logs: 38, hours: 196 },
  { week: 'Week 5', logs: 31, hours: 163 },
  { week: 'Week 6', logs: 42, hours: 214 },
]

const MOCK_DEPT_PERFORMANCE = [
  { dept: 'Engineering',  logsSubmitted: 156, avgHours: 5.8, compliance: 94 },
  { dept: 'Operations',   logsSubmitted: 189, avgHours: 6.1, compliance: 97 },
  { dept: 'Finance',      logsSubmitted: 142, avgHours: 4.9, compliance: 89 },
  { dept: 'Pilots',       logsSubmitted: 98,  avgHours: 7.2, compliance: 91 },
  { dept: 'GM Office',    logsSubmitted: 45,  avgHours: 3.8, compliance: 85 },
]

const REPORT_TYPES = [
  { value: 'PROCUREMENT_SUMMARY',  label: 'Procurement Summary Report' },
  { value: 'ACTIVITY_LOG_REPORT',  label: 'Activity Log Report' },
  { value: 'DOCUMENT_INVENTORY',   label: 'Document Inventory Report' },
  { value: 'DEPT_PERFORMANCE',     label: 'Department Performance Report' },
  { value: 'AUDIT_SUMMARY',        label: 'Audit Trail Summary' },
]

const DEPARTMENTS = [
  'ALL',
  'GENERAL_MANAGER_OFFICE',
  'FINANCE_AND_ADMINISTRATION',
  'ENGINEERING',
  'PILOTS',
  'OPERATIONS',
]

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--surface-container)] border border-[var(--border-subtle)] p-3 rounded-lg shadow-xl text-sm">
        <p className="font-bold text-white mb-2 pb-1 border-b border-[var(--border-subtle)]">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="flex justify-between gap-4 font-semibold text-xs mb-1">
            <span className="capitalize">{entry.name}:</span>
            <span>{entry.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function ReportsPage() {
  // FORM STATE
  const [reportType, setReportType] = useState('PROCUREMENT_SUMMARY')
  const [dateFrom, setDateFrom] = useState('2026-01-01')
  const [dateTo, setDateTo] = useState('2026-06-30')
  const [department, setDepartment] = useState('ALL')
  
  // ACTION STATE
  const [generating, setGenerating] = useState(false)
  const [toast, setToast] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  // TOAST EFFECT
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleExport = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setToast({ type: 'success', message: 'Report exported successfully. Check your downloads.' })
      if (previewOpen) setPreviewOpen(false)
    }, 2500)
  }

  const handlePreview = () => {
    setPreviewOpen(true)
  }

  const formatDept = (dept) =>
    dept.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  const selectedReportLabel = REPORT_TYPES.find(r => r.value === reportType)?.label

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn pb-10">
      {/* PAGE HEADER */}
      <PageHeader
        title="Reports & Analytics"
        subtitle="Operational insights and exportable reports for UACC management"
      />

      {/* ROW 1 — Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-uacc-gold/10 text-uacc-gold border border-uacc-gold/20 flex-shrink-0">
            <FolderOpen size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold font-heading text-[var(--text-primary)] leading-none">43</p>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mt-1">Documents This Month</p>
          </div>
        </div>

        <div className="card rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-uacc-red/10 text-uacc-red border border-uacc-red/20 flex-shrink-0">
            <ClipboardList size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold font-heading text-[var(--text-primary)] leading-none">18</p>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mt-1">Procurement Requests</p>
          </div>
        </div>

        <div className="card rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold font-heading text-[var(--text-primary)] leading-none">42</p>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mt-1">Activity Logs This Week</p>
          </div>
        </div>

        <div className="card rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex-shrink-0">
            <BarChart2 size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold font-heading text-[var(--text-primary)] leading-none">214 <span className="text-sm">hrs</span></p>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mt-1">Total Hours Logged</p>
          </div>
        </div>
      </div>

      {/* ROW 2 — Two Charts */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Procurement Trend Line Chart */}
        <div className="md:col-span-8 card rounded-xl p-6">
          <h3 className="font-heading font-bold text-white mb-6">Procurement Requests — 6 Month Trend</h3>
          <div className="w-full" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK_MONTHLY_PROCUREMENT} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="submitted" stroke="#C9973A" strokeWidth={2} dot={{ fill: '#C9973A', r: 4 }} activeDot={{ r: 6 }} name="Submitted" />
                <Line type="monotone" dataKey="approved" stroke="#4ade80" strokeWidth={2} dot={{ fill: '#4ade80', r: 4 }} activeDot={{ r: 6 }} name="Approved" />
                <Line type="monotone" dataKey="rejected" stroke="#CC2200" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#CC2200', r: 4 }} activeDot={{ r: 6 }} name="Rejected" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Documents by Department Bar Chart */}
        <div className="md:col-span-4 card rounded-xl p-6">
          <h3 className="font-heading font-bold text-white mb-6">Documents by Department</h3>
          <div className="w-full" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_DOCS_BY_DEPT} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="dept" type="category" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'var(--surface-container)'}} />
                {/* Gradient Definition */}
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#C9973A" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#CC2200" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <Bar dataKey="count" fill="url(#colorCount)" radius={[0, 4, 4, 0]} barSize={24} label={{ position: 'right', fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 'bold' }} name="Documents" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 3 — Two Charts */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Activity Log Trend AreaChart */}
        <div className="md:col-span-6 card rounded-xl p-6">
          <h3 className="font-heading font-bold text-white mb-6">Activity Log Submissions — Weekly Trend</h3>
          <div className="w-full" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_ACTIVITY_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="week" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="hours" stroke="#CC2200" fill="rgba(204,34,0,0.10)" strokeWidth={2} name="Hours Logged" />
                <Area type="monotone" dataKey="logs" stroke="#C9973A" fill="rgba(201,151,58,0.15)" strokeWidth={2} name="Logs Submitted" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Department Performance Table */}
        <div className="md:col-span-6 card rounded-xl p-6 flex flex-col">
          <h3 className="font-heading font-bold text-white mb-6">Department Log Compliance</h3>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="pb-3 font-semibold">Department</th>
                  <th className="pb-3 font-semibold text-right">Logs</th>
                  <th className="pb-3 font-semibold text-right">Avg Hours</th>
                  <th className="pb-3 font-semibold w-1/3">Compliance %</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_DEPT_PERFORMANCE.map((dept, idx) => (
                  <tr key={dept.dept} className={`border-b border-[var(--border-subtle)]/50 ${idx === MOCK_DEPT_PERFORMANCE.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="py-3 text-sm font-semibold text-white whitespace-nowrap">{dept.dept}</td>
                    <td className="py-3 text-sm text-[var(--text-secondary)] text-right">{dept.logsSubmitted}</td>
                    <td className="py-3 text-sm text-[var(--text-secondary)] text-right">{dept.avgHours.toFixed(1)}</td>
                    <td className="py-3 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-[var(--border-subtle)] rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${dept.compliance >= 90 ? 'bg-uacc-gold' : 'bg-uacc-red'}`} 
                            style={{ width: `${dept.compliance}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-white w-8 text-right">{dept.compliance}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ROW 4 — Generate Report Panel */}
      <div className="card rounded-xl p-6 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-uacc-gold/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-3 mb-2 relative z-10">
          <FileText className="text-uacc-gold" size={24} />
          <h3 className="font-heading font-bold text-xl text-white">Generate Report</h3>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-6 relative z-10">Select report parameters and export as a formatted PDF.</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 relative z-10">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold font-heading text-[var(--text-muted)] uppercase tracking-wider">Report Type</label>
            <select className="input-field" value={reportType} onChange={(e) => setReportType(e.target.value)}>
              {REPORT_TYPES.map(rt => (
                <option key={rt.value} value={rt.value}>{rt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold font-heading text-[var(--text-muted)] uppercase tracking-wider">Date From</label>
            <input type="date" className="input-field" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold font-heading text-[var(--text-muted)] uppercase tracking-wider">Date To</label>
            <input type="date" className="input-field" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold font-heading text-[var(--text-muted)] uppercase tracking-wider">Department</label>
            <select className="input-field" value={department} onChange={(e) => setDepartment(e.target.value)}>
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept === 'ALL' ? 'All Departments' : formatDept(dept)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 relative z-10">
          <Button variant="ghost" icon={Eye} onClick={handlePreview} disabled={generating}>
            Preview Report
          </Button>
          <Button variant="primary" icon={generating ? Loader2 : Download} onClick={handleExport} disabled={generating} className={generating ? 'opacity-80 cursor-wait' : ''}>
            {generating ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Generating PDF...
              </span>
            ) : (
              'Export as PDF'
            )}
          </Button>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="card rounded-2xl w-full max-w-2xl bg-[var(--bg-surface)] flex flex-col my-8 shadow-2xl overflow-hidden relative shadow-black/50 animate-fadeIn">
            
            {/* Modal Actions */}
            <div className="absolute top-4 right-4 z-20 flex gap-2">
              <button
                onClick={() => setPreviewOpen(false)}
                className="p-1.5 rounded-lg bg-black/20 text-white/70 hover:bg-black/40 hover:text-white transition-colors cursor-pointer backdrop-blur-md"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mock PDF Header Band */}
            <div className="bg-[#0A2342] border-b-4 border-uacc-gold px-8 py-10 relative z-10 flex flex-col items-center text-center">
              {/* Optional Placeholder Logo if next/image errors without src, using a div fallback */}
              <div className="w-16 h-16 bg-uacc-gold/20 border-2 border-uacc-gold rounded-full flex items-center justify-center mb-4 shadow-lg shadow-uacc-gold/20">
                <FileText size={28} className="text-uacc-gold" />
              </div>
              <h1 className="text-white font-heading font-bold text-xl tracking-[0.2em] mb-2 uppercase">Uganda Air Cargo Corporation</h1>
              <h2 className="text-uacc-gold font-bold text-2xl font-heading tracking-wide mb-3">{selectedReportLabel}</h2>
              <div className="inline-flex bg-white/10 px-4 py-1.5 rounded-full text-xs font-semibold text-white/80 tracking-widest uppercase">
                {dateFrom} &mdash; {dateTo}
              </div>
              {department !== 'ALL' && (
                <div className="mt-3 text-xs text-blue-200 uppercase tracking-widest font-semibold">
                  Department: {formatDept(department)}
                </div>
              )}
            </div>

            {/* Mock PDF Body */}
            <div className="bg-white p-8 pb-12 min-h-[300px]">
              <div className="mb-6 border-b-2 border-gray-100 pb-4">
                <h3 className="text-gray-800 font-bold font-heading text-lg uppercase tracking-wider mb-1">Executive Summary</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  This document provides an automated compilation of records based on the selected criteria. Data represented herein reflects verified system entries as of the generation date.
                </p>
              </div>

              {/* Data Presentation (Simplified for mock) */}
              <h4 className="text-gray-700 font-bold text-sm uppercase tracking-wider mb-3">Data Overview</h4>
              {reportType === 'PROCUREMENT_SUMMARY' ? (
                <table className="w-full text-left border-collapse border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr className="text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
                      <th className="p-3 border-r border-gray-200">Month</th>
                      <th className="p-3 border-r border-gray-200">Submitted</th>
                      <th className="p-3 border-r border-gray-200">Approved</th>
                      <th className="p-3">Est. Cost (UGX)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_MONTHLY_PROCUREMENT.slice(0, 4).map((row, i) => (
                      <tr key={i} className="border-b border-gray-200 text-sm text-gray-700">
                        <td className="p-3 font-semibold border-r border-gray-200">{row.month}</td>
                        <td className="p-3 border-r border-gray-200">{row.submitted}</td>
                        <td className="p-3 border-r border-gray-200">{row.approved}</td>
                        <td className="p-3 font-bold text-gray-900">{row.totalCost.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50/50 text-sm italic text-gray-500">
                      <td colSpan={4} className="p-3 text-center border-t-2 border-gray-200">+ {MOCK_MONTHLY_PROCUREMENT.length - 4} more records...</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center text-center">
                  <BarChart2 size={32} className="text-gray-300 mb-3" />
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Tabular Data Rendered Here</p>
                  <p className="text-xs text-gray-400 mt-1">Full dataset will be included in the exported PDF.</p>
                </div>
              )}
            </div>

            {/* Mock PDF Footer */}
            <div className="bg-gray-100 p-6 flex flex-col items-center justify-center text-center border-t border-gray-200 gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Confidential &middot; Internal Use Only</span>
              <span className="text-[10px] text-gray-400">Generated by DIMS v1.0 on {new Date().toLocaleString()}</span>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-low)] flex justify-end gap-3 shrink-0">
              <Button variant="outline" onClick={() => setPreviewOpen(false)} disabled={generating}>
                Close Preview
              </Button>
              <Button variant="primary" icon={generating ? Loader2 : Download} onClick={handleExport} disabled={generating}>
                {generating ? 'Generating PDF...' : 'Export PDF'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 transform ${
          toast ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0 pointer-events-none'
        }`}
      >
        {toast && (
          <div
            className={`card rounded-xl px-5 py-4 flex items-center gap-3 border shadow-2xl ${
              toast.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10' :
              toast.type === 'error' ? 'border-uacc-red/30 bg-uacc-red/10' :
              'border-uacc-gold/30 bg-uacc-gold/10'
            }`}
          >
            {toast.type === 'success' && <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />}
            {toast.type === 'error' && <XCircle size={18} className="text-uacc-red flex-shrink-0" />}
            <span className="text-xs font-semibold text-white">
              {toast.message}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
