'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, ArrowLeftRight, BarChart2, Plus, Download,
  ArrowDownCircle, ArrowUpCircle, ArrowRightCircle, Lock,
  Search, FileText, Mail, MessageSquare, MapPin, Eye, Edit,
  Printer, Check, X, Calendar, Inbox, ChevronRight
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import api from '@/lib/api'

const MOCK_REGISTRY = [
  {
    id: 'REG-UACC-2026-0021',
    subject: 'NCNDA Agreement — UACC & Air Dynamics Solutions (ADS)',
    docType: 'CONTRACT',
    direction: 'INCOMING',
    source: 'Air Dynamics Solutions, Abu Dhabi, UAE',
    destination: 'Office of the General Manager',
    receivedFrom: 'Mr. Salman Alamoudi (ADS)',
    handledBy: 'Records Executive',
    dateRegistered: '2026-05-19',
    dateDispatched: '2026-05-19',
    dateReceived: '2026-05-19',
    status: 'CLOSED',
    priority: 'HIGH',
    medium: 'PHYSICAL',
    fileRef: 'UACC/LEGAL/2026/005',
    physicalLocation: 'Cabinet 3, Shelf B, GM Office',
    linkedDocumentId: 6,
    annotations: [
      { id: 1, author: 'Records Executive', role: 'RECORDS_EXECUTIVE', text: 'Original signed copy received. Stamped and registered. Forwarded to GM for signature.', timestamp: '2026-05-19 10:30' },
      { id: 2, author: 'Lt. Gen. Lakara',   role: 'GENERAL_MANAGER',   text: 'Reviewed and signed. Return copy dispatched to ADS via email. File original in legal cabinet.', timestamp: '2026-05-19 14:45' },
      { id: 3, author: 'Records Executive', role: 'RECORDS_EXECUTIVE', text: 'Original filed in Cabinet 3, Shelf B. Scanned copy uploaded to DIMS Documents module. Registry entry closed.', timestamp: '2026-05-19 16:00' },
    ],
  },
  {
    id: 'REG-UACC-2026-0022',
    subject: 'NITA-Uganda Digital Transformation Partnership MOU',
    docType: 'MEMO',
    direction: 'INCOMING',
    source: 'National Information Technology Authority — Uganda (NITA-U)',
    destination: 'Office of the General Manager',
    receivedFrom: 'NITA-U Director General',
    handledBy: 'Records Executive',
    dateRegistered: '2026-05-28',
    dateDispatched: null,
    dateReceived: '2026-05-28',
    status: 'ACTIONED',
    priority: 'HIGH',
    medium: 'BOTH',
    fileRef: 'UACC/ICT/2026/012',
    physicalLocation: 'Cabinet 1, Shelf A, IT Office',
    linkedDocumentId: null,
    annotations: [
      { id: 1, author: 'Records Executive', role: 'RECORDS_EXECUTIVE', text: 'MOU received via email and physical courier. Both copies registered. Forwarded to GM and IT Specialist for review.', timestamp: '2026-05-28 09:00' },
      { id: 2, author: 'Patrick Katusabe',  role: 'IT_ADMINISTRATOR',  text: 'Reviewed MOU. Partnership covers UACC network upgrade, cybersecurity training, and DIMS deployment support. Recommended for GM signature.', timestamp: '2026-05-28 11:30' },
      { id: 3, author: 'Lt. Gen. Lakara',   role: 'GENERAL_MANAGER',   text: 'MOU approved. Signed and returned to NITA-U. Proceed with partnership activities.', timestamp: '2026-05-29 08:00' },
    ],
  },
  {
    id: 'REG-UACC-2026-0023',
    subject: 'Engineering Per-Diem Payment Request — Field Team Uganda North',
    docType: 'MEMO',
    direction: 'INTERNAL',
    source: 'Engineering Department',
    destination: 'Finance and Administration',
    receivedFrom: 'Head Engineering',
    handledBy: 'Records Executive',
    dateRegistered: '2026-06-05',
    dateDispatched: '2026-06-05',
    dateReceived: '2026-06-05',
    status: 'ACTIONED',
    priority: 'NORMAL',
    medium: 'PHYSICAL',
    fileRef: 'UACC/FIN/2026/034',
    physicalLocation: 'Cabinet 2, Shelf C, Finance Office',
    linkedDocumentId: null,
    annotations: [
      { id: 1, author: 'Records Executive', role: 'RECORDS_EXECUTIVE', text: 'Internal memo received from Engineering. Registered and dispatched to Finance & Administration for processing.', timestamp: '2026-06-05 08:30' },
      { id: 2, author: 'Records Executive', role: 'RECORDS_EXECUTIVE', text: 'Finance confirmed receipt. Per-diem processing initiated. Estimated disbursement: 3 working days.', timestamp: '2026-06-05 14:00' },
    ],
  },
  {
    id: 'REG-UACC-2026-0024',
    subject: 'Ministry of Defence Quarterly Operations Report Submission',
    docType: 'REPORT',
    direction: 'OUTGOING',
    source: 'Office of the General Manager',
    destination: 'Ministry of Defence and Veteran Affairs (MODVA)',
    receivedFrom: null,
    handledBy: 'Records Executive',
    dateRegistered: '2026-06-10',
    dateDispatched: '2026-06-10',
    dateReceived: null,
    status: 'DISPATCHED',
    priority: 'HIGH',
    medium: 'BOTH',
    fileRef: 'UACC/GM/2026/019',
    physicalLocation: null,
    linkedDocumentId: null,
    annotations: [
      { id: 1, author: 'Records Executive', role: 'RECORDS_EXECUTIVE', text: 'Q1 Operations Report compiled and registered. Physical copy dispatched to MODVA via courier. Digital copy sent via official email.', timestamp: '2026-06-10 10:00' },
      { id: 2, author: 'Records Executive', role: 'RECORDS_EXECUTIVE', text: 'Courier tracking confirmed: delivered to MODVA Registry on 12 Jun 2026. Awaiting acknowledgement receipt.', timestamp: '2026-06-12 11:00' },
    ],
  },
  {
    id: 'REG-UACC-2026-0025',
    subject: 'Flight Dispatch and Operations Manual (FDPM) — Revision 4',
    docType: 'POLICY',
    direction: 'INTERNAL',
    source: 'Operations Department',
    destination: 'All Departments',
    receivedFrom: 'Head Operations',
    handledBy: 'Records Executive',
    dateRegistered: '2026-06-15',
    dateDispatched: '2026-06-15',
    dateReceived: '2026-06-15',
    status: 'CLOSED',
    priority: 'NORMAL',
    medium: 'BOTH',
    fileRef: 'UACC/OPS/2026/007',
    physicalLocation: 'Cabinet 4, Shelf A, Operations Office',
    linkedDocumentId: null,
    annotations: [
      { id: 1, author: 'Records Executive', role: 'RECORDS_EXECUTIVE', text: 'FDPM Revision 4 received from Operations. Registered and copies dispatched to all department heads.', timestamp: '2026-06-15 09:00' },
      { id: 2, author: 'Head Engineering',  role: 'DEPARTMENT_HEAD',   text: 'Received and acknowledged. Engineering copy filed.', timestamp: '2026-06-15 11:30' },
      { id: 3, author: 'Records Executive', role: 'RECORDS_EXECUTIVE', text: 'All departments confirmed receipt. Registry entry closed.', timestamp: '2026-06-16 08:00' },
    ],
  },
  {
    id: 'REG-UACC-2026-0026',
    subject: 'Fuel Supply Tender — Uganda Petroleum Ltd Invoice',
    docType: 'INVOICE',
    direction: 'INCOMING',
    source: 'Uganda Petroleum Ltd',
    destination: 'Finance and Administration',
    receivedFrom: 'Uganda Petroleum Ltd Accounts',
    handledBy: 'Records Executive',
    dateRegistered: '2026-06-18',
    dateDispatched: '2026-06-18',
    dateReceived: '2026-06-18',
    status: 'PENDING',
    priority: 'NORMAL',
    medium: 'EMAIL',
    fileRef: 'UACC/FIN/2026/041',
    physicalLocation: null,
    linkedDocumentId: null,
    annotations: [
      { id: 1, author: 'Records Executive', role: 'RECORDS_EXECUTIVE', text: 'Invoice received via email. Registered and forwarded to Finance for payment processing.', timestamp: '2026-06-18 10:15' },
    ],
  },
  {
    id: 'REG-UACC-2026-0027',
    subject: 'Staff Disciplinary Notice — Operations Department',
    docType: 'LETTER',
    direction: 'INTERNAL',
    source: 'Human Resources (Finance & Administration)',
    destination: 'Operations Department',
    receivedFrom: 'HR Manager',
    handledBy: 'Records Executive',
    dateRegistered: '2026-06-20',
    dateDispatched: '2026-06-20',
    dateReceived: null,
    status: 'DISPATCHED',
    priority: 'CONFIDENTIAL',
    medium: 'PHYSICAL',
    fileRef: 'UACC/HR/2026/008',
    physicalLocation: 'Confidential Cabinet, HR Office',
    linkedDocumentId: null,
    annotations: [
      { id: 1, author: 'Records Executive', role: 'RECORDS_EXECUTIVE', text: 'Confidential disciplinary notice registered. Dispatched to Operations Department Head via sealed envelope. Delivery confirmation pending.', timestamp: '2026-06-20 09:30' },
    ],
  },
]

const DOC_TYPES = ['ALL', 'MEMO', 'REPORT', 'CONTRACT', 'POLICY', 'LETTER', 'INVOICE', 'FORM', 'LOGBOOK', 'OTHER']
const DIRECTIONS = ['ALL', 'INCOMING', 'OUTGOING', 'INTERNAL']
const STATUSES   = ['ALL', 'PENDING', 'DISPATCHED', 'RECEIVED', 'ACTIONED', 'CLOSED']
const PRIORITIES = ['ALL', 'NORMAL', 'HIGH', 'CONFIDENTIAL']
const MEDIUMS    = ['ALL', 'PHYSICAL', 'EMAIL', 'BOTH']

const STATUS_META = {
  PENDING:    { label: 'Pending',    class: 'bg-amber-500/10 text-amber-500 border border-amber-500/20' },
  DISPATCHED: { label: 'Dispatched', class: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  RECEIVED:   { label: 'Received',   class: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  ACTIONED:   { label: 'Actioned',   class: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' },
  CLOSED:     { label: 'Closed',     class: 'bg-white/10 text-[var(--text-muted)] border border-white/10' },
}

const DIRECTION_META = {
  INCOMING: { label: 'Incoming', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: ArrowDownCircle },
  OUTGOING: { label: 'Outgoing', color: 'text-red-400',    bg: 'bg-red-500/10',    icon: ArrowUpCircle },
  INTERNAL: { label: 'Internal', color: 'text-uacc-gold',   bg: 'bg-uacc-gold/10',   icon: ArrowRightCircle },
}

const PRIORITY_META = {
  NORMAL:       { label: 'Normal',       class: 'text-[var(--text-muted)] border border-white/10 bg-white/5' },
  HIGH:         { label: 'High',         class: 'text-amber-400 border border-amber-500/30 bg-amber-500/10' },
  CONFIDENTIAL: { label: 'Confidential', class: 'text-red-400 border border-red-500/30 bg-red-500/10' },
}

const ROLE_COLORS = {
  RECORDS_EXECUTIVE: 'bg-purple-500/20 text-purple-400',
  GENERAL_MANAGER: 'bg-uacc-gold/20 text-uacc-gold',
  IT_ADMINISTRATOR: 'bg-blue-500/20 text-blue-400',
  DEPARTMENT_HEAD: 'bg-emerald-500/20 text-emerald-400'
}

const ANALYTICS_DATA = {
  byDirection: [
    { name: 'Incoming', value: 3, color: '#4ade80' },
    { name: 'Outgoing', value: 1, color: '#f87171' },
    { name: 'Internal', value: 3, color: '#C9973A' },
  ],
  byType: [
    { type: 'Memo',     count: 2 },
    { type: 'Report',   count: 1 },
    { type: 'Contract', count: 1 },
    { type: 'Policy',   count: 1 },
    { type: 'Letter',   count: 1 },
    { type: 'Invoice',  count: 1 },
  ],
  byStatus: [
    { status: 'Pending',    count: 1 },
    { status: 'Dispatched', count: 2 },
    { status: 'Actioned',   count: 2 },
    { status: 'Closed',     count: 2 },
  ],
  byMonth: [
    { month: 'Jan', incoming: 3, outgoing: 1, internal: 2 },
    { month: 'Feb', incoming: 2, outgoing: 2, internal: 4 },
    { month: 'Mar', incoming: 5, outgoing: 3, internal: 3 },
    { month: 'Apr', incoming: 4, outgoing: 2, internal: 5 },
    { month: 'May', incoming: 6, outgoing: 4, internal: 3 },
    { month: 'Jun', incoming: 3, outgoing: 1, internal: 3 },
  ],
}

export default function RecordsExecutivePage() {
  const [activeView, setActiveView] = useState('register')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [filterDirection, setFilterDirection] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterPriority, setFilterPriority] = useState('ALL')
  const [filterMedium, setFilterMedium] = useState('ALL')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [detailPanelOpen, setDetailPanelOpen] = useState(false)
  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [annotationText, setAnnotationText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [toast, setToast] = useState(null)
  const [pendingCopiesCount, setPendingCopiesCount] = useState(0)
  
  const ROWS_PER_PAGE = 8

  const [formData, setFormData] = useState({
    subject: '',
    docType: 'MEMO',
    direction: 'INCOMING',
    source: '',
    destination: '',
    receivedFrom: '',
    priority: 'NORMAL',
    medium: 'PHYSICAL',
    fileRef: '',
    physicalLocation: '',
    dateRegistered: new Date().toISOString().split('T')[0],
    notes: '',
    attachFile: null,
  })

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await api.get('/records/circulation-copies?status=PENDING_FILING')
        if (res.data && res.data.data) {
          setPendingCopiesCount(res.data.data.length)
        }
      } catch (err) {
        console.error('Failed to fetch pending copies', err)
      }
    }
    fetchPending()
  }, [])

  const showToast = (message) => {
    setToast({ type: 'success', message })
  }

  const handleRegisterSubmit = (e) => {
    e.preventDefault()
    setRegisterModalOpen(false)
    showToast("Document registered successfully. Reference: REG-UACC-2026-0028")
    setFormData({
      subject: '', docType: 'MEMO', direction: 'INCOMING', source: '', destination: '',
      receivedFrom: '', priority: 'NORMAL', medium: 'PHYSICAL', fileRef: '',
      physicalLocation: '', dateRegistered: new Date().toISOString().split('T')[0],
      notes: '', attachFile: null,
    })
  }

  const handleAddAnnotation = () => {
    if (!annotationText.trim()) return
    showToast("Annotation added to registry entry.")
    setAnnotationText('')
  }

  // Filtering
  const filteredData = useMemo(() => {
    return MOCK_REGISTRY.filter(item => {
      const matchSearch = item.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.destination.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchDirection = filterDirection === 'ALL' || item.direction === filterDirection
      const matchStatus = filterStatus === 'ALL' || item.status === filterStatus
      const matchPriority = filterPriority === 'ALL' || item.priority === filterPriority
      const matchType = filterType === 'ALL' || item.docType === filterType
      const matchMedium = filterMedium === 'ALL' || item.medium === filterMedium
      
      let matchDate = true
      if (filterDateFrom && filterDateTo) {
        matchDate = item.dateRegistered >= filterDateFrom && item.dateRegistered <= filterDateTo
      }

      return matchSearch && matchDirection && matchStatus && matchPriority && matchType && matchMedium && matchDate
    })
  }, [searchQuery, filterDirection, filterStatus, filterPriority, filterType, filterMedium, filterDateFrom, filterDateTo])

  // Stats calculation
  const stats = useMemo(() => {
    const total = MOCK_REGISTRY.length
    const incoming = MOCK_REGISTRY.filter(i => i.direction === 'INCOMING').length
    const outgoing = MOCK_REGISTRY.filter(i => i.direction === 'OUTGOING').length
    const internal = MOCK_REGISTRY.filter(i => i.direction === 'INTERNAL').length
    const confidential = MOCK_REGISTRY.filter(i => i.priority === 'CONFIDENTIAL').length
    return { total, incoming, outgoing, internal, confidential }
  }, [])

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto min-h-screen pb-24">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Records Executive</h1>
          <p className="text-[var(--text-muted)] text-sm">Universal document registry — tracking all correspondence in and out of UACC</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => showToast("Document register exported. File: UACC_Registry_Jun2026.pdf")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-white/5 text-[var(--text-secondary)] hover:bg-white/10 hover:text-[var(--text-primary)] transition-colors"
          >
            <Download size={16} /> Export Register
          </button>
          <button 
            onClick={() => setRegisterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-uacc-gold text-[var(--text-primary)] hover:bg-uacc-gold/90 transition-colors shadow-lg shadow-uacc-gold/20"
          >
            <Plus size={16} /> Register Document
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="card rounded-xl p-4 border border-white/5 flex flex-col gap-2 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Pending Filing</span>
            <Inbox size={16} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)] font-heading">{pendingCopiesCount}</div>
        </div>
        <div className="card rounded-xl p-4 border border-white/5 flex flex-col gap-2 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Total Registered</span>
            <BookOpen size={16} className="text-uacc-gold" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)] font-heading">{stats.total}</div>
        </div>
        <div className="card rounded-xl p-4 border border-white/5 flex flex-col gap-2 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Incoming</span>
            <ArrowDownCircle size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)] font-heading">{stats.incoming}</div>
        </div>
        <div className="card rounded-xl p-4 border border-white/5 flex flex-col gap-2 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Outgoing</span>
            <ArrowUpCircle size={16} className="text-red-400" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)] font-heading">{stats.outgoing}</div>
        </div>
        <div className="card rounded-xl p-4 border border-white/5 flex flex-col gap-2 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Internal</span>
            <ArrowRightCircle size={16} className="text-uacc-gold" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)] font-heading">{stats.internal}</div>
        </div>
        <div className="card rounded-xl p-4 border border-white/5 flex flex-col gap-2 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Confidential</span>
            <Lock size={16} className="text-red-400" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)] font-heading">{stats.confidential}</div>
        </div>
      </div>

      {/* VIEW TOGGLES */}
      <div className="flex gap-2 mb-6 border-b border-white/10 pb-4 overflow-x-auto scrollbar-none">
        <button 
          onClick={() => setActiveView('register')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            activeView === 'register' ? 'bg-uacc-gold text-[var(--text-primary)]' : 'border border-white/10 text-[var(--text-muted)] hover:bg-white/5'
          }`}
        >
          <BookOpen size={16} /> Document Register
        </button>
        <button 
          onClick={() => setActiveView('movement')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            activeView === 'movement' ? 'bg-uacc-gold text-[var(--text-primary)]' : 'border border-white/10 text-[var(--text-muted)] hover:bg-white/5'
          }`}
        >
          <ArrowLeftRight size={16} /> Movement Tracker
        </button>
        <button 
          onClick={() => setActiveView('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            activeView === 'analytics' ? 'bg-uacc-gold text-[var(--text-primary)]' : 'border border-white/10 text-[var(--text-muted)] hover:bg-white/5'
          }`}
        >
          <BarChart2 size={16} /> Analytics
        </button>
      </div>

      {/* VIEW A: REGISTER */}
      {activeView === 'register' && (
        <div className="space-y-6">
          <div className="card rounded-xl p-4 border border-white/5 space-y-4 bg-white/[0.02]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" size={16} />
              <input 
                type="text" 
                placeholder="Search subject, registry ID, source, or destination..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-uacc-gold/50"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                {DIRECTIONS.map(dir => (
                  <button 
                    key={dir} 
                    onClick={() => setFilterDirection(dir)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      filterDirection === dir ? 'bg-white/10 text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    {dir}
                  </button>
                ))}
              </div>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none appearance-none">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none appearance-none">
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none appearance-none">
                {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={filterMedium} onChange={(e) => setFilterMedium(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none appearance-none">
                {MEDIUMS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-[var(--text-secondary)]" />
                <span className="text-[var(--text-faint)] text-xs">to</span>
                <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-[var(--text-secondary)]" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-[var(--text-muted)]">{filteredData.length} records found</span>
                <button 
                  onClick={() => {
                    setSearchQuery(''); setFilterType('ALL'); setFilterDirection('ALL'); 
                    setFilterStatus('ALL'); setFilterPriority('ALL'); setFilterMedium('ALL');
                    setFilterDateFrom(''); setFilterDateTo('');
                  }}
                  className="text-xs text-uacc-gold hover:underline font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          <div className="card rounded-xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse data-table">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Registry No</th>
                    <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Direction</th>
                    <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Subject</th>
                    <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden md:table-cell">Source → Dest</th>
                    <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Medium / Priority</th>
                    <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                    <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredData.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE).map(row => {
                    const DirIcon = DIRECTION_META[row.direction].icon
                    return (
                      <tr 
                        key={row.id} 
                        onClick={() => { setSelectedEntry(row); setDetailPanelOpen(true) }}
                        className={`hover:bg-white/[0.03] cursor-pointer transition-colors ${row.priority === 'CONFIDENTIAL' ? 'bg-red-500/5' : ''} ${row.status === 'CLOSED' ? 'opacity-75' : ''}`}
                      >
                        <td className="p-4 whitespace-nowrap">
                          <span className="text-xs font-heading font-bold text-uacc-gold cursor-pointer hover:underline">{row.id}</span>
                          <div className="text-[10px] text-[var(--text-faint)] mt-1">{row.dateRegistered}</div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${DIRECTION_META[row.direction].bg} ${DIRECTION_META[row.direction].color}`}>
                            <DirIcon size={14} />
                            <span className="text-[10px] font-bold uppercase">{DIRECTION_META[row.direction].label}</span>
                          </div>
                        </td>
                        <td className="p-4 min-w-[200px] max-w-[300px]">
                          <p className="text-sm text-[var(--text-primary)] font-medium truncate" title={row.subject}>{row.subject}</p>
                          <span className="text-[10px] text-[var(--text-faint)] uppercase tracking-widest mt-1 inline-block">{row.docType}</span>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-[var(--text-muted)] truncate max-w-[200px]" title={row.source}>{row.source}</span>
                            <span className="text-[10px] text-[var(--text-faint)] truncate max-w-[200px]" title={row.destination}>→ {row.destination}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                              {row.medium === 'PHYSICAL' && <FileText size={14} />}
                              {row.medium === 'EMAIL' && <Mail size={14} />}
                              {row.medium === 'BOTH' && <><FileText size={12} /><Mail size={12} /></>}
                              <span className="text-[10px]">{row.medium}</span>
                            </div>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider w-max ${PRIORITY_META[row.priority].class}`}>
                              {PRIORITY_META[row.priority].label}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-2">
                            <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider w-max ${STATUS_META[row.status].class}`}>
                              {STATUS_META[row.status].label}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-uacc-gold bg-uacc-gold/10 px-2 py-0.5 rounded-full w-max border border-uacc-gold/20">
                              <MessageSquare size={10} />
                              <span>{row.annotations.length} notes</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 rounded-md transition-colors"><Eye size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">No registry entries found matching your filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {filteredData.length > ROWS_PER_PAGE && (
              <div className="p-4 border-t border-white/10 flex justify-between items-center bg-white/5">
                <span className="text-xs text-[var(--text-muted)]">
                  Showing {(currentPage - 1) * ROWS_PER_PAGE + 1} to {Math.min(currentPage * ROWS_PER_PAGE, filteredData.length)} of {filteredData.length}
                </span>
                <div className="flex gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(c => c - 1)}
                    className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-semibold text-[var(--text-secondary)] hover:bg-white/10 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button 
                    disabled={currentPage * ROWS_PER_PAGE >= filteredData.length}
                    onClick={() => setCurrentPage(c => c + 1)}
                    className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-semibold text-[var(--text-secondary)] hover:bg-white/10 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW B: MOVEMENT TRACKER */}
      {activeView === 'movement' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Document Movement Log</h2>
          </div>
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[23px] before:w-0.5 before:bg-white/10">
            {MOCK_REGISTRY.map((row, idx) => {
              const DirIcon = DIRECTION_META[row.direction].icon
              const borderColor = row.direction === 'INCOMING' ? 'border-emerald-500' : row.direction === 'OUTGOING' ? 'border-red-500' : 'border-uacc-gold'
              return (
                <div key={row.id} className="flex gap-4 relative">
                  <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center border-4 border-[#0b1120] relative z-10 ${DIRECTION_META[row.direction].bg} ${DIRECTION_META[row.direction].color}`}>
                    <DirIcon size={20} />
                  </div>
                  <div 
                    onClick={() => { setSelectedEntry(row); setDetailPanelOpen(true) }}
                    className={`card flex-1 rounded-xl p-5 border border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer border-l-4 ${borderColor} ${row.priority === 'CONFIDENTIAL' ? 'bg-red-500/5' : 'bg-white/[0.02]'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-heading font-bold text-uacc-gold text-sm">{row.id}</span>
                        {row.priority === 'CONFIDENTIAL' && <Lock size={14} className="text-red-400" />}
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${STATUS_META[row.status].class}`}>{STATUS_META[row.status].label}</span>
                      </div>
                      <span className="text-xs text-[var(--text-faint)]">{row.dateRegistered}</span>
                    </div>
                    
                    <h3 className="text-[var(--text-primary)] font-semibold text-sm mb-4">{row.subject}</h3>
                    
                    <div className="bg-white/5 rounded-lg p-3 mb-4 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[var(--text-faint)] w-12 font-bold uppercase">From</span>
                        <span className="text-[var(--text-secondary)] font-medium truncate">{row.source}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[var(--text-faint)] w-12 font-bold uppercase">To</span>
                        <span className="text-[var(--text-secondary)] font-medium truncate">{row.destination}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          {row.medium === 'PHYSICAL' && <FileText size={14} />}
                          {row.medium === 'EMAIL' && <Mail size={14} />}
                          {row.medium === 'BOTH' && <><FileText size={14} /><Mail size={14} /></>}
                          <span>{row.medium}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MessageSquare size={14} />
                          <span>{row.annotations.length} annotations</span>
                        </div>
                      </div>
                      <div className="font-medium text-uacc-gold flex items-center gap-1 hover:underline">
                        View Details <ChevronRight size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* VIEW C: ANALYTICS */}
      {activeView === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card rounded-xl p-6 border border-white/5">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-6 uppercase tracking-wider text-center">Document Flow by Month</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ANALYTICS_DATA.byMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="incoming" name="Incoming" stackId="a" fill="#4ade80" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="internal" name="Internal" stackId="a" fill="#C9973A" />
                  <Bar dataKey="outgoing" name="Outgoing" stackId="a" fill="#f87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card rounded-xl p-6 border border-white/5 flex flex-col">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-2 uppercase tracking-wider text-center">Documents by Direction</h3>
            <div className="flex-1 min-h-[300px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ANALYTICS_DATA.byDirection}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {ANALYTICS_DATA.byDirection.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                <span className="text-3xl font-heading font-bold text-[var(--text-primary)]">{stats.total}</span>
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Total</span>
              </div>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {ANALYTICS_DATA.byDirection.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                  <span className="text-xs text-[var(--text-secondary)]">{d.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card rounded-xl p-6 border border-white/5">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-6 uppercase tracking-wider text-center">Documents by Type</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ANALYTICS_DATA.byType} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="type" type="category" stroke="rgba(255,255,255,0.7)" fontSize={12} tickLine={false} axisLine={false} width={80} />
                  <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  <Bar dataKey="count" name="Count" fill="#C9973A" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card rounded-xl p-6 border border-white/5">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-6 uppercase tracking-wider text-center">Registry Status Distribution</h3>
            <div className="flex flex-col justify-center h-full gap-5 pb-6">
              {ANALYTICS_DATA.byStatus.map(s => (
                <div key={s.status} className="space-y-2">
                  <div className="flex justify-between items-end text-sm">
                    <span className="text-[var(--text-secondary)] font-medium">{s.status}</span>
                    <span className="text-[var(--text-primary)] font-bold">{s.count}</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-uacc-gold rounded-full transition-all duration-1000"
                      style={{ width: `${(s.count / stats.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DETAIL PANEL SLIDE-IN */}
      {detailPanelOpen && selectedEntry && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDetailPanelOpen(false)}></div>
          <div className="relative w-full max-w-2xl h-full bg-[#0b1120] shadow-2xl border-l border-white/10 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Panel Header */}
            <div className="p-6 border-b border-white/10 bg-white/[0.02] border-t-4 border-t-uacc-gold flex justify-between items-start flex-shrink-0">
              <div>
                <h2 className="text-2xl font-heading font-bold text-uacc-gold">{selectedEntry.id}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${DIRECTION_META[selectedEntry.direction].bg} ${DIRECTION_META[selectedEntry.direction].color}`}>
                    {React.createElement(DIRECTION_META[selectedEntry.direction].icon, { size: 14 })}
                    <span className="text-[10px] font-bold uppercase">{DIRECTION_META[selectedEntry.direction].label}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${STATUS_META[selectedEntry.status].class}`}>
                    {STATUS_META[selectedEntry.status].label}
                  </span>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${PRIORITY_META[selectedEntry.priority].class}`}>
                    {PRIORITY_META[selectedEntry.priority].label}
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-3 flex items-center gap-1">
                  <FileText size={12} /> Ref: {selectedEntry.fileRef || 'N/A'}
                </p>
              </div>
              <button onClick={() => setDetailPanelOpen(false)} className="p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Document Details */}
              <div className="card rounded-xl p-5 border border-white/5 bg-white/[0.02]">
                <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Document Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-4">
                  <div className="col-span-2">
                    <span className="block text-[10px] text-[var(--text-faint)] uppercase font-bold mb-1">Subject</span>
                    <span className="text-[var(--text-primary)] font-semibold text-sm leading-relaxed">{selectedEntry.subject}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[var(--text-faint)] uppercase font-bold mb-1">Document Type</span>
                    <span className="text-[var(--text-secondary)] text-sm">{selectedEntry.docType}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[var(--text-faint)] uppercase font-bold mb-1">Handled By</span>
                    <span className="text-[var(--text-secondary)] text-sm">{selectedEntry.handledBy}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[var(--text-faint)] uppercase font-bold mb-1">Source</span>
                    <span className="text-[var(--text-secondary)] text-sm font-medium">{selectedEntry.source}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[var(--text-faint)] uppercase font-bold mb-1">Destination</span>
                    <span className="text-[var(--text-secondary)] text-sm font-medium">{selectedEntry.destination}</span>
                  </div>
                  {selectedEntry.receivedFrom && (
                    <div className="col-span-2">
                      <span className="block text-[10px] text-[var(--text-faint)] uppercase font-bold mb-1">Received From / Attention</span>
                      <span className="text-[var(--text-secondary)] text-sm">{selectedEntry.receivedFrom}</span>
                    </div>
                  )}
                  {selectedEntry.physicalLocation && (
                    <div className="col-span-2 bg-white/5 p-3 rounded-lg border border-white/10 flex items-center gap-3">
                      <MapPin size={18} className="text-uacc-gold shrink-0" />
                      <div>
                        <span className="block text-[10px] text-uacc-gold/80 uppercase font-bold mb-0.5">Physical Location</span>
                        <span className="text-[var(--text-primary)] text-sm">{selectedEntry.physicalLocation}</span>
                      </div>
                    </div>
                  )}
                  {selectedEntry.linkedDocumentId && (
                    <div className="col-span-2 text-sm text-blue-400 hover:underline cursor-pointer flex items-center gap-1 font-medium">
                      View in Documents module <ArrowRightCircle size={14} />
                    </div>
                  )}
                </div>
              </div>

              {/* Document Journey */}
              <div className="card rounded-xl p-5 border border-white/5 bg-white/[0.02]">
                <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-6">Document Journey</h3>
                
                <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                  {/* Registered */}
                  <div className="relative z-10">
                    <div className="absolute -left-[30px] top-0 w-6 h-6 rounded-full bg-emerald-500 border-4 border-[#0b1120] flex items-center justify-center">
                      <Check size={12} className="text-[#0b1120]" />
                    </div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] mb-0.5">REGISTERED</h4>
                    <p className="text-xs text-[var(--text-muted)]">{selectedEntry.dateRegistered} · By: {selectedEntry.handledBy}</p>
                  </div>

                  {/* Dispatched */}
                  <div className="relative z-10">
                    <div className={`absolute -left-[30px] top-0 w-6 h-6 rounded-full border-4 border-[#0b1120] flex items-center justify-center ${selectedEntry.dateDispatched ? 'bg-emerald-500' : 'bg-white/10'}`}>
                      {selectedEntry.dateDispatched && <Check size={12} className="text-[#0b1120]" />}
                    </div>
                    <h4 className={`text-sm font-bold mb-0.5 ${selectedEntry.dateDispatched ? 'text-[var(--text-primary)]' : 'text-[var(--text-faint)]'}`}>DISPATCHED</h4>
                    {selectedEntry.dateDispatched ? (
                      <p className="text-xs text-[var(--text-muted)]">{selectedEntry.dateDispatched} · Medium: {selectedEntry.medium}</p>
                    ) : (
                      <p className="text-xs text-[var(--text-faint)] italic">Pending dispatch</p>
                    )}
                  </div>

                  {/* Received */}
                  <div className="relative z-10">
                    <div className={`absolute -left-[30px] top-0 w-6 h-6 rounded-full border-4 border-[#0b1120] flex items-center justify-center ${selectedEntry.dateReceived ? 'bg-emerald-500' : 'bg-white/10'}`}>
                      {selectedEntry.dateReceived && <Check size={12} className="text-[#0b1120]" />}
                    </div>
                    <h4 className={`text-sm font-bold mb-0.5 ${selectedEntry.dateReceived ? 'text-[var(--text-primary)]' : 'text-[var(--text-faint)]'}`}>RECEIVED</h4>
                    {selectedEntry.dateReceived ? (
                      <p className="text-xs text-[var(--text-muted)]">{selectedEntry.dateReceived} · At Destination</p>
                    ) : (
                      <p className="text-xs text-[var(--text-faint)] italic">Pending receipt confirmation</p>
                    )}
                  </div>

                  {/* Actioned */}
                  <div className="relative z-10">
                    <div className={`absolute -left-[30px] top-0 w-6 h-6 rounded-full border-4 border-[#0b1120] flex items-center justify-center ${(selectedEntry.status === 'ACTIONED' || selectedEntry.status === 'CLOSED') ? 'bg-emerald-500' : 'bg-white/10'}`}>
                      {(selectedEntry.status === 'ACTIONED' || selectedEntry.status === 'CLOSED') && <Check size={12} className="text-[#0b1120]" />}
                    </div>
                    <h4 className={`text-sm font-bold mb-0.5 ${(selectedEntry.status === 'ACTIONED' || selectedEntry.status === 'CLOSED') ? 'text-[var(--text-primary)]' : 'text-[var(--text-faint)]'}`}>ACTIONED</h4>
                    <p className="text-xs text-[var(--text-muted)]">{(selectedEntry.status === 'ACTIONED' || selectedEntry.status === 'CLOSED') ? 'See annotations for details' : 'Awaiting action'}</p>
                  </div>

                  {/* Closed */}
                  <div className="relative z-10">
                    <div className={`absolute -left-[30px] top-0 w-6 h-6 rounded-full border-4 border-[#0b1120] flex items-center justify-center ${selectedEntry.status === 'CLOSED' ? 'bg-uacc-gold' : 'bg-white/10 border-dashed'}`}>
                      {selectedEntry.status === 'CLOSED' && <Check size={12} className="text-[#0b1120]" />}
                    </div>
                    <h4 className={`text-sm font-bold mb-0.5 ${selectedEntry.status === 'CLOSED' ? 'text-uacc-gold' : 'text-[var(--text-faint)]'}`}>CLOSED</h4>
                    {selectedEntry.status === 'CLOSED' ? (
                      <p className="text-xs text-[var(--text-muted)]">Registry entry closed and filed</p>
                    ) : (
                      <p className="text-xs text-[var(--text-faint)] italic">Entry remains open</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Annotation Chain */}
              <div className="card rounded-xl p-5 border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Annotation Chain</h3>
                  <span className="bg-uacc-gold/20 text-uacc-gold px-2 py-0.5 rounded-full text-[10px] font-bold">{selectedEntry.annotations.length}</span>
                </div>
                <p className="text-xs text-[var(--text-faint)] mb-6 italic">All remarks, instructions and actions recorded in chronological order</p>

                <div className="space-y-4">
                  {selectedEntry.annotations.map(ann => (
                    <div key={ann.id} className="flex gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${ROLE_COLORS[ann.role] || 'bg-white/10 text-[var(--text-primary)]'}`}>
                        {ann.author.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[var(--text-primary)]">{ann.author}</span>
                            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${ROLE_COLORS[ann.role] || 'bg-white/10 text-[var(--text-muted)]'}`}>
                              {ann.role.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="text-[10px] text-[var(--text-faint)]">{ann.timestamp}</span>
                        </div>
                        <div className="bg-white/5 border border-white/5 border-l-2 border-l-uacc-gold rounded-r-lg rounded-bl-lg p-3 text-sm text-[var(--text-secondary)] leading-relaxed shadow-sm">
                          {ann.text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-white/10">
                  <h4 className="text-xs font-bold text-[var(--text-primary)] mb-3">Add Annotation</h4>
                  <textarea 
                    value={annotationText}
                    onChange={(e) => setAnnotationText(e.target.value)}
                    placeholder="Add a remark, instruction, or update to this registry entry..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-uacc-gold/50 resize-none h-24 mb-3"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-faint)]">{annotationText.length} characters</span>
                    <button 
                      onClick={handleAddAnnotation}
                      disabled={!annotationText.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-uacc-gold/20 text-uacc-gold border border-uacc-gold/30 hover:bg-uacc-gold hover:text-[var(--text-primary)] transition-colors text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <MessageSquare size={16} /> Add Annotation
                    </button>
                  </div>
                </div>
              </div>
              
            </div>

            {/* Panel Footer */}
            <div className="p-4 border-t border-white/10 bg-[#0b1120] shrink-0 flex items-center justify-between">
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors text-sm font-medium">
                  Update Status <ArrowDownCircle size={16} className="text-white/50" />
                </button>
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#0b1120] border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none group-hover:pointer-events-auto">
                  <button onClick={() => showToast("Status updated to DISPATCHED.")} className="block w-full text-left px-4 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">Mark as Dispatched</button>
                  <button onClick={() => showToast("Status updated to RECEIVED.")} className="block w-full text-left px-4 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">Mark as Received</button>
                  <button onClick={() => showToast("Status updated to ACTIONED.")} className="block w-full text-left px-4 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">Mark as Actioned</button>
                  <div className="border-t border-white/10 my-1"></div>
                  <button onClick={() => showToast("Status updated to CLOSED.")} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10">Close Entry</button>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => showToast("Printing registry card...")}
                  className="p-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Printer size={18} />
                </button>
                <button 
                  onClick={() => setDetailPanelOpen(false)}
                  className="px-6 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors text-sm font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER NEW DOCUMENT MODAL */}
      <AnimatePresence>
        {registerModalOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRegisterModalOpen(false)}></div>
          <motion.div
            className="relative w-full max-w-2xl bg-[#0b1120] rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[90vh]"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            
            <div className="p-5 border-b border-white/10 bg-white/[0.02] rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Register New Document</h2>
                <span className="text-xs text-uacc-gold font-heading tracking-widest">REG-UACC-2026-0028 (Auto-assigned)</span>
              </div>
              <button onClick={() => setRegisterModalOpen(false)} className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <form id="register-form" onSubmit={handleRegisterSubmit} className="space-y-5">
                
                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1.5 uppercase tracking-wider">Document Subject *</label>
                  <textarea 
                    required
                    value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}
                    placeholder="Brief, descriptive subject of the document"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-uacc-gold/50 resize-none h-16"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1.5 uppercase tracking-wider">Document Type</label>
                    <select 
                      value={formData.docType} onChange={e => setFormData({...formData, docType: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none appearance-none"
                    >
                      {DOC_TYPES.filter(t => t !== 'ALL').map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1.5 uppercase tracking-wider">Direction</label>
                    <select 
                      value={formData.direction} onChange={e => setFormData({...formData, direction: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none appearance-none"
                    >
                      {DIRECTIONS.filter(d => d !== 'ALL').map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1.5 uppercase tracking-wider">Source *</label>
                    <input type="text" required value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} placeholder="e.g. Ministry of Transport" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-uacc-gold/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1.5 uppercase tracking-wider">Destination *</label>
                    <input type="text" required value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} placeholder="e.g. GM Office" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-uacc-gold/50" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {formData.direction === 'INCOMING' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-white/70 mb-1.5 uppercase tracking-wider">Received From / Attention</label>
                        <input type="text" value={formData.receivedFrom} onChange={e => setFormData({...formData, receivedFrom: e.target.value})} placeholder="Name of courier or contact" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-uacc-gold/50" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white/70 mb-1.5 uppercase tracking-wider">Date Received</label>
                        <input type="date" value={formData.dateRegistered} onChange={e => setFormData({...formData, dateRegistered: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/80 focus:outline-none focus:border-uacc-gold/50" />
                      </div>
                    </>
                  )}
                  {formData.direction === 'OUTGOING' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-white/70 mb-1.5 uppercase tracking-wider">Dispatched To / Attention</label>
                        <input type="text" value={formData.receivedFrom} onChange={e => setFormData({...formData, receivedFrom: e.target.value})} placeholder="Name of recipient" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-uacc-gold/50" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white/70 mb-1.5 uppercase tracking-wider">Date Dispatched</label>
                        <input type="date" value={formData.dateRegistered} onChange={e => setFormData({...formData, dateRegistered: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/80 focus:outline-none focus:border-uacc-gold/50" />
                      </div>
                    </>
                  )}
                  {formData.direction === 'INTERNAL' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-white/70 mb-1.5 uppercase tracking-wider">From Department</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none appearance-none">
                          <option>Operations</option><option>Engineering</option><option>Finance</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white/70 mb-1.5 uppercase tracking-wider">To Department</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none appearance-none">
                          <option>Finance</option><option>Operations</option><option>Engineering</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1.5 uppercase tracking-wider">Priority</label>
                    <select 
                      value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none appearance-none"
                    >
                      {PRIORITIES.filter(p => p !== 'ALL').map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1.5 uppercase tracking-wider">Medium</label>
                    <select 
                      value={formData.medium} onChange={e => setFormData({...formData, medium: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none appearance-none"
                    >
                      {MEDIUMS.filter(m => m !== 'ALL').map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                {formData.priority === 'CONFIDENTIAL' && (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex gap-3 text-red-400 text-sm">
                    <Lock size={20} className="shrink-0" />
                    <p><strong>Warning:</strong> This document is marked CONFIDENTIAL. Access will be restricted to Records Executive, Department Head, and General Manager only.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1.5 uppercase tracking-wider">File Reference</label>
                    <input type="text" value={formData.fileRef} onChange={e => setFormData({...formData, fileRef: e.target.value})} placeholder="e.g. UACC/LEGAL/2026/005" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-uacc-gold/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1.5 uppercase tracking-wider">Physical Location</label>
                    <input type="text" value={formData.physicalLocation} onChange={e => setFormData({...formData, physicalLocation: e.target.value})} placeholder="e.g. Cabinet 3, Shelf B" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-uacc-gold/50" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1.5 uppercase tracking-wider">Initial Annotation / Notes</label>
                  <textarea 
                    value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}
                    placeholder="Add first annotation or handling instructions..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-uacc-gold/50 resize-none h-20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1.5 uppercase tracking-wider">Attach Digital Copy (Optional)</label>
                  <div className="border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-white/[0.01] hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 text-white/50">
                      <Download size={20} />
                    </div>
                    <p className="text-sm text-white font-medium mb-1">Click to upload or drag and drop</p>
                    <p className="text-xs text-white/40">PDF, JPG, PNG or DOCX (max. 10MB)</p>
                  </div>
                </div>

              </form>
            </div>

            <div className="p-4 border-t border-white/10 bg-white/[0.02] rounded-b-2xl flex justify-end gap-3">
              <button 
                onClick={() => setRegisterModalOpen(false)}
                className="px-6 py-2.5 rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-semibold text-sm transition-colors"
              >
                Cancel
              </button>
              <button 
                form="register-form" type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-uacc-gold text-white font-bold text-sm hover:bg-uacc-gold/90 transition-colors shadow-lg shadow-uacc-gold/20"
              >
                <BookOpen size={16} /> Register Document
              </button>
            </div>

          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>

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
