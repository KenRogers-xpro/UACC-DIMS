'use client'

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, ArrowLeftRight, BarChart2, Plus, Download,
  ArrowDownCircle, ArrowUpCircle, ArrowRightCircle, Lock,
  Search, FileText, Mail, MessageSquare, MapPin, Eye, Edit,
  Printer, Check, X, Calendar, Inbox, ChevronRight, Folder,
  UploadCloud, ChevronDown,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import api from '@/lib/api'

// Adapts a real RegistryEntry (from GET/POST /api/records) into the flat
// display shape this page's JSX already expects — `id` stays the display-
// friendly registryNo (used as the row key and shown everywhere), dates are
// trimmed to YYYY-MM-DD to match the date-range filter's string comparison,
// and annotations/handledBy are flattened from their relational shape.
function adaptRecord(r) {
  return {
    ...r,
    id: r.registryNo,
    dbId: r.id,
    handledBy: r.handledBy?.name || 'Unknown',
    dateRegistered: r.dateRegistered ? String(r.dateRegistered).slice(0, 10) : '',
    dateDispatched: r.dateDispatched ? String(r.dateDispatched).slice(0, 10) : null,
    dateReceived: r.dateReceived ? String(r.dateReceived).slice(0, 10) : null,
    linkedDocumentId: r.sourceDocumentId || null,
    recordsFile: r.recordsFile || null,
    annotations: (r.annotations || []).map((a) => ({
      id: a.id,
      author: a.author?.name || 'Unknown',
      role: a.author?.role,
      text: a.text,
      timestamp: new Date(a.createdAt).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      }),
    })),
  }
}


const STEP_ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

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

  // Real data — replaces the old MOCK_REGISTRY/ANALYTICS_DATA-only prototype.
  const [records, setRecords] = useState([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [files, setFiles] = useState([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [newFileModalOpen, setNewFileModalOpen] = useState(false)
  const [newFileForm, setNewFileForm] = useState({ fileNumber: '', title: '', fileType: '', description: '' })
  const [newFileSubmitting, setNewFileSubmitting] = useState(false)
  const [newFileError, setNewFileError] = useState('')

  // Filing Queue — PENDING_FILING circulation copies
  const [filingQueue, setFilingQueue] = useState([])
  const [filingQueueLoading, setFilingQueueLoading] = useState(false)
  const [fileDialogCopy, setFileDialogCopy] = useState(null)
  const [fileDialogSelectedId, setFileDialogSelectedId] = useState('')
  const [fileDialogSearch, setFileDialogSearch] = useState('')
  const [filingSubmitting, setFilingSubmitting] = useState(false)

  // File drill-in — the per-file view opened from a File chip in the
  // register table or a row in the Files tab.
  const [fileDrillIn, setFileDrillIn] = useState(null)

  const ROWS_PER_PAGE = 8

  const emptyFormData = {
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
  }
  const [formData, setFormData] = useState(emptyFormData)
  const [attachedFile, setAttachedFile] = useState(null) // real File object for the dropzone
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  // Link to File — 'none' | 'existing' | 'new'
  const [linkMode, setLinkMode] = useState('none')
  const [linkFileId, setLinkFileId] = useState('')
  const [fileSearchQuery, setFileSearchQuery] = useState('')
  const [filePickerOpen, setFilePickerOpen] = useState(false)
  const [newLinkFileNumber, setNewLinkFileNumber] = useState('')
  const [newLinkFileTitle, setNewLinkFileTitle] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const fetchRecords = useCallback(async () => {
    setRecordsLoading(true)
    try {
      const res = await api.get('/records?limit=200')
      setRecords((res.data?.records || []).map(adaptRecord))
    } catch (err) {
      console.error('Failed to fetch records', err)
    } finally {
      setRecordsLoading(false)
    }
  }, [])

  const fetchFiles = useCallback(async () => {
    setFilesLoading(true)
    try {
      const res = await api.get('/records/files')
      setFiles(res.data || [])
    } catch (err) {
      console.error('Failed to fetch records files', err)
    } finally {
      setFilesLoading(false)
    }
  }, [])

  useEffect(() => { fetchRecords() }, [fetchRecords])
  useEffect(() => { fetchFiles() }, [fetchFiles])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const fetchFilingQueue = useCallback(async () => {
    setFilingQueueLoading(true)
    try {
      const res = await api.get('/records/circulation-copies?status=PENDING_FILING')
      const list = res.data || []
      setFilingQueue(list)
      setPendingCopiesCount(list.length)
    } catch (err) {
      console.error('Failed to fetch filing queue', err)
    } finally {
      setFilingQueueLoading(false)
    }
  }, [])

  useEffect(() => { fetchFilingQueue() }, [fetchFilingQueue])

  const showToast = (message, type = 'success') => {
    setToast({ type, message })
  }

  const resetRegisterForm = () => {
    setFormData(emptyFormData)
    setAttachedFile(null)
    setLinkMode('none')
    setLinkFileId('')
    setFileSearchQuery('')
    setNewLinkFileNumber('')
    setNewLinkFileTitle('')
    setSubmitError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError('')
    try {
      const fd = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) fd.append(key, value)
      })
      if (attachedFile) fd.append('file', attachedFile)
      if (linkMode === 'existing' && linkFileId) {
        fd.append('recordsFileId', linkFileId)
      } else if (linkMode === 'new' && newLinkFileTitle.trim()) {
        if (newLinkFileNumber.trim()) fd.append('newFileNumber', newLinkFileNumber.trim())
        fd.append('newFileTitle', newLinkFileTitle.trim())
      }

      const res = await api.post('/records', fd)
      if (!res.success) throw new Error(res.message || 'Failed to register document')

      setRegisterModalOpen(false)
      resetRegisterForm()
      showToast(`Document registered successfully. Reference: ${res.data.registryNo}`)
      await fetchRecords()
      if (linkMode === 'new') await fetchFiles()
    } catch (err) {
      setSubmitError(err.message || 'Failed to register document')
      showToast(err.message || 'Failed to register document', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) setAttachedFile(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) setAttachedFile(file)
  }

  const handleAddAnnotation = () => {
    if (!annotationText.trim()) return
    showToast("Annotation added to registry entry.")
    setAnnotationText('')
  }

  // Pre-fill the auto-suggested next file number when the standalone "+ New
  // File" modal opens, same sequential pattern as registry numbers.
  useEffect(() => {
    if (!newFileModalOpen) return
    api.get('/records/files/next-number')
      .then((res) => setNewFileForm((f) => (f.fileNumber ? f : { ...f, fileNumber: res.data?.fileNumber || '' })))
      .catch(() => {})
  }, [newFileModalOpen])

  const handleCreateFile = async (e) => {
    e.preventDefault()
    if (!newFileForm.title.trim()) return
    setNewFileSubmitting(true)
    setNewFileError('')
    try {
      const res = await api.post('/records/files', newFileForm)
      if (!res.success) throw new Error(res.message || 'Failed to create file')
      setNewFileModalOpen(false)
      setNewFileForm({ fileNumber: '', title: '', fileType: '', description: '' })
      showToast(`File ${res.data.fileNumber} created.`)
      await fetchFiles()
    } catch (err) {
      setNewFileError(err.message || 'Failed to create file')
    } finally {
      setNewFileSubmitting(false)
    }
  }

  const openFileDialog = (copy) => {
    setFileDialogCopy(copy)
    setFileDialogSelectedId('')
    setFileDialogSearch('')
  }

  const handleConfirmFiling = async () => {
    if (!fileDialogCopy) return
    setFilingSubmitting(true)
    try {
      const res = await api.put(`/records/circulation-copies/${fileDialogCopy.id}/file`, {
        recordsFileId: fileDialogSelectedId || undefined,
      })
      if (!res.success) throw new Error(res.message || 'Failed to file copy')
      showToast('Marked as filed.')
      setFileDialogCopy(null)
      await fetchFilingQueue()
      if (fileDialogSelectedId) await fetchFiles()
    } catch (err) {
      showToast(err.message || 'Failed to file copy', 'error')
    } finally {
      setFilingSubmitting(false)
    }
  }

  // Filtering
  const filteredData = useMemo(() => {
    return records.filter(item => {
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
    const total = records.length
    const incoming = records.filter(i => i.direction === 'INCOMING').length
    const outgoing = records.filter(i => i.direction === 'OUTGOING').length
    const internal = records.filter(i => i.direction === 'INTERNAL').length
    const confidential = records.filter(i => i.priority === 'CONFIDENTIAL').length
    return { total, incoming, outgoing, internal, confidential }
  }, [records])

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
        <button
          onClick={() => setActiveView('filing')}
          className="card rounded-xl p-4 border border-white/5 flex flex-col gap-2 relative overflow-hidden group text-left hover:border-uacc-gold/30 transition-colors cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Pending Filing</span>
            <Inbox size={16} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)] font-heading">{pendingCopiesCount}</div>
        </button>
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
          onClick={() => setActiveView('filing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            activeView === 'filing' ? 'bg-uacc-gold text-[var(--text-primary)]' : 'border border-white/10 text-[var(--text-muted)] hover:bg-white/5'
          }`}
        >
          <Inbox size={16} /> Filing Queue
          {pendingCopiesCount > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300">{pendingCopiesCount}</span>
          )}
        </button>
        <button
          onClick={() => setActiveView('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            activeView === 'analytics' ? 'bg-uacc-gold text-[var(--text-primary)]' : 'border border-white/10 text-[var(--text-muted)] hover:bg-white/5'
          }`}
        >
          <BarChart2 size={16} /> Analytics
        </button>
        <button
          onClick={() => setActiveView('files')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            activeView === 'files' ? 'bg-uacc-gold text-[var(--text-primary)]' : 'border border-white/10 text-[var(--text-muted)] hover:bg-white/5'
          }`}
        >
          <Folder size={16} /> Files
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
                    <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden lg:table-cell">File</th>
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
                        <td className="p-4 hidden lg:table-cell">
                          {row.recordsFile ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); setFileDrillIn(row.recordsFile) }}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold bg-uacc-gold/10 text-uacc-gold border border-uacc-gold/20 hover:bg-uacc-gold/20 transition-colors"
                            >
                              <Folder size={11} /> {row.recordsFile.fileNumber}
                            </button>
                          ) : (
                            <span className="text-[10px] text-[var(--text-faint)] italic">unfiled</span>
                          )}
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
                      <td colSpan={8} className="p-8 text-center text-[var(--text-muted)]">No registry entries found matching your filters.</td>
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

      {/* VIEW: FILING QUEUE — every CirculationRecordsCopy auto-created per
          circulation step, awaiting physical/digital filing by Records. */}
      {activeView === 'filing' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Filing Queue</h2>
            <p className="text-[var(--text-muted)] text-sm">Circulation steps awaiting filing — one copy per step, auto-generated as documents move</p>
          </div>

          <div className="card rounded-xl border border-white/5 overflow-hidden">
            {filingQueueLoading ? (
              <p className="p-8 text-center text-[var(--text-muted)]">Loading filing queue...</p>
            ) : filingQueue.length === 0 ? (
              <p className="p-8 text-center text-[var(--text-muted)]">Nothing pending filing right now.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {filingQueue.map((copy) => {
                  const step = copy.step
                  const stepRoman = STEP_ROMAN[step.stepNumber - 1] || step.stepNumber
                  return (
                    <div key={copy.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-5 h-5 rounded-full border border-uacc-gold/50 flex items-center justify-center text-[10px] font-bold text-uacc-gold flex-shrink-0">
                            {stepRoman}
                          </span>
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{step.circulation?.title}</p>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] italic truncate">"{step.instruction}"</p>
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5 text-[10px] text-[var(--text-faint)]">
                          <span className="font-semibold text-[var(--text-muted)]">{step.fromRole?.replace(/_/g, ' ')}</span>
                          <ArrowLeftRight size={10} />
                          <span className="font-semibold text-uacc-gold">{step.toRole?.replace(/_/g, ' ')}</span>
                          <span>· {new Date(step.signedAt || copy.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => openFileDialog(copy)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-uacc-gold/10 text-uacc-gold border border-uacc-gold/25 hover:bg-uacc-gold/20 transition-colors flex-shrink-0 whitespace-nowrap"
                      >
                        <Folder size={13} /> File
                      </button>
                    </div>
                  )
                })}
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
            {records.map((row, idx) => {
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

      {/* VIEW D: FILES — standalone RecordsFile management, independent of
          registering any document. A file can sit empty, waiting for
          entries to be filed into it later via the register modal's Link
          to File field or the attach-to-file endpoint. */}
      {activeView === 'files' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Records Files</h2>
              <p className="text-[var(--text-muted)] text-sm">Dossiers and folders — create one before documents exist to file into it</p>
            </div>
            <button
              onClick={() => setNewFileModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-uacc-gold text-[var(--text-primary)] hover:bg-uacc-gold/90 transition-colors shadow-lg shadow-uacc-gold/20"
            >
              <Plus size={16} /> New File
            </button>
          </div>

          <div className="card rounded-xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse data-table">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">File Number</th>
                    <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Title</th>
                    <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden md:table-cell">Type</th>
                    <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-center">Entries</th>
                    <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                    <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden md:table-cell">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filesLoading ? (
                    <tr><td colSpan={6} className="p-8 text-center text-[var(--text-muted)]">Loading files...</td></tr>
                  ) : files.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-[var(--text-muted)]">No records files yet. Create one to get started.</td></tr>
                  ) : (
                    files.map((f) => (
                      <tr key={f.id} onClick={() => setFileDrillIn(f)} className="hover:bg-white/[0.03] transition-colors cursor-pointer">
                        <td className="p-4 whitespace-nowrap">
                          <span className="text-xs font-heading font-bold text-uacc-gold">{f.fileNumber}</span>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-[var(--text-primary)] font-medium">{f.title}</p>
                          {f.description && <p className="text-[10px] text-[var(--text-faint)] mt-0.5 truncate max-w-[300px]">{f.description}</p>}
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <span className="text-xs text-[var(--text-muted)]">{f.fileType || '—'}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-uacc-gold bg-uacc-gold/10 px-2 py-0.5 rounded-full border border-uacc-gold/20">
                            {f._count?.entries ?? 0}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider w-max ${
                            f.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            f.status === 'ARCHIVED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-white/10 text-[var(--text-muted)] border border-white/10'
                          }`}>
                            {f.status}
                          </span>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <span className="text-xs text-[var(--text-muted)]">{new Date(f.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* NEW FILE MODAL — standalone creation, independent of registering a document */}
      <AnimatePresence>
        {newFileModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setNewFileModalOpen(false)}></div>
            <motion.div
              className="relative w-full max-w-md bg-[#0b1120] rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[90vh]"
              initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22 }}
            >
              <div className="p-5 border-b border-white/10 bg-white/[0.02] rounded-t-2xl flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">New Records File</h2>
                <button onClick={() => setNewFileModalOpen(false)} className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <form id="new-file-form" onSubmit={handleCreateFile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1.5 uppercase tracking-wider">File Number</label>
                    <input
                      type="text" value={newFileForm.fileNumber}
                      onChange={e => setNewFileForm({ ...newFileForm, fileNumber: e.target.value })}
                      placeholder="Auto-suggested"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-uacc-gold/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1.5 uppercase tracking-wider">Title *</label>
                    <input
                      type="text" required value={newFileForm.title}
                      onChange={e => setNewFileForm({ ...newFileForm, title: e.target.value })}
                      placeholder="e.g. Aircraft 5X-ABC — Maintenance Records"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-uacc-gold/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1.5 uppercase tracking-wider">File Type</label>
                    <input
                      type="text" value={newFileForm.fileType}
                      onChange={e => setNewFileForm({ ...newFileForm, fileType: e.target.value })}
                      placeholder="Free text — e.g. Personal File, Asset File..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-uacc-gold/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1.5 uppercase tracking-wider">Description</label>
                    <textarea
                      value={newFileForm.description}
                      onChange={e => setNewFileForm({ ...newFileForm, description: e.target.value })}
                      placeholder="Optional notes about this file's scope"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-uacc-gold/50 resize-none h-20"
                    />
                  </div>
                  {newFileError && <p className="text-xs text-uacc-red">{newFileError}</p>}
                </form>
              </div>
              <div className="p-4 border-t border-white/10 bg-white/[0.02] rounded-b-2xl flex justify-end gap-3">
                <button
                  onClick={() => setNewFileModalOpen(false)} disabled={newFileSubmitting}
                  className="px-6 py-2.5 rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  form="new-file-form" type="submit" disabled={newFileSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-uacc-gold text-white font-bold text-sm hover:bg-uacc-gold/90 transition-colors shadow-lg shadow-uacc-gold/20 disabled:opacity-50"
                >
                  <Folder size={16} /> {newFileSubmitting ? 'Creating...' : 'Create File'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FILE DIALOG — confirm filing a circulation copy, optionally linking
          it to a RecordsFile. Same search-and-pick UX as the register
          modal's Link to File field, over the already-fetched `files` list. */}
      <AnimatePresence>
        {fileDialogCopy && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setFileDialogCopy(null)}></div>
            <motion.div
              className="relative w-full max-w-md bg-[#0b1120] rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[80vh]"
              initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22 }}
            >
              <div className="p-5 border-b border-white/10 bg-white/[0.02] rounded-t-2xl flex justify-between items-center">
                <h2 className="text-lg font-bold text-white">Mark as Filed</h2>
                <button onClick={() => setFileDialogCopy(null)} className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
                <p className="text-xs text-white/50">
                  Optionally link this copy to a RecordsFile dossier before marking it filed.
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={15} />
                  <input
                    type="text"
                    value={fileDialogSearch}
                    onChange={(e) => setFileDialogSearch(e.target.value)}
                    placeholder="Search file number or title..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-uacc-gold/50"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
                  {files
                    .filter(f =>
                      !fileDialogSearch.trim() ||
                      f.fileNumber.toLowerCase().includes(fileDialogSearch.toLowerCase()) ||
                      f.title.toLowerCase().includes(fileDialogSearch.toLowerCase())
                    )
                    .map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFileDialogSelectedId(f.id === fileDialogSelectedId ? '' : f.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                          fileDialogSelectedId === f.id ? 'bg-uacc-gold/15 border border-uacc-gold/30' : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <Folder size={14} className="text-uacc-gold flex-shrink-0" />
                        <span className="min-w-0">
                          <span className="block text-sm text-white font-medium truncate">{f.fileNumber}</span>
                          <span className="block text-xs text-white/40 truncate">{f.title}</span>
                        </span>
                      </button>
                    ))}
                  {files.length === 0 && (
                    <p className="text-xs text-white/40 text-center py-4">No files yet — you can still file without linking one.</p>
                  )}
                </div>
              </div>
              <div className="p-4 border-t border-white/10 bg-white/[0.02] rounded-b-2xl flex justify-end gap-3">
                <button
                  onClick={() => setFileDialogCopy(null)} disabled={filingSubmitting}
                  className="px-6 py-2.5 rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmFiling} disabled={filingSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-uacc-gold text-white font-bold text-sm hover:bg-uacc-gold/90 transition-colors shadow-lg shadow-uacc-gold/20 disabled:opacity-50"
                >
                  <Check size={16} /> {filingSubmitting ? 'Filing...' : (fileDialogSelectedId ? 'Link & Mark Filed' : 'Mark Filed')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FILE DRILL-IN — opened from a File chip in the register table or a
          row in the Files tab. Entries are filtered client-side from the
          already-fetched `records` list rather than a new endpoint. */}
      <AnimatePresence>
        {fileDrillIn && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setFileDrillIn(null)}></div>
            <motion.div
              className="relative w-full max-w-2xl bg-[#0b1120] rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[85vh]"
              initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22 }}
            >
              <div className="p-5 border-b border-white/10 bg-white/[0.02] rounded-t-2xl flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Folder size={18} className="text-uacc-gold" />
                    <h2 className="text-xl font-bold text-white">{fileDrillIn.fileNumber}</h2>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      fileDrillIn.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      fileDrillIn.status === 'ARCHIVED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-white/10 text-white/50 border border-white/10'
                    }`}>
                      {fileDrillIn.status}
                    </span>
                  </div>
                  <p className="text-sm text-white/70">{fileDrillIn.title}</p>
                  {fileDrillIn.fileType && <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">{fileDrillIn.fileType}</p>}
                </div>
                <button onClick={() => setFileDrillIn(null)} className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-colors flex-shrink-0">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">
                  Entries in this file ({records.filter(r => r.recordsFile?.id === fileDrillIn.id).length})
                </p>
                <div className="flex flex-col gap-2">
                  {records.filter(r => r.recordsFile?.id === fileDrillIn.id).map(r => (
                    <button
                      key={r.dbId}
                      onClick={() => { setFileDrillIn(null); setSelectedEntry(r); setDetailPanelOpen(true) }}
                      className="w-full text-left p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-heading font-bold text-uacc-gold">{r.id}</p>
                        <p className="text-sm text-white truncate">{r.subject}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex-shrink-0 ${STATUS_META[r.status].class}`}>
                        {STATUS_META[r.status].label}
                      </span>
                    </button>
                  ))}
                  {records.filter(r => r.recordsFile?.id === fileDrillIn.id).length === 0 && (
                    <p className="text-sm text-white/40 text-center py-8">No entries filed into this dossier yet.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <span className="text-xs text-uacc-gold font-heading tracking-widest">Registry No. auto-assigned on save</span>
              </div>
              <button onClick={() => { setRegisterModalOpen(false); resetRegisterForm() }} className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-colors">
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
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.docx"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
                      isDragging ? 'border-uacc-gold bg-uacc-gold/5' : 'border-white/10 bg-white/[0.01] hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 text-white/50">
                      <UploadCloud size={20} />
                    </div>
                    <p className="text-sm text-white font-medium mb-1">Click to upload or drag and drop</p>
                    <p className="text-xs text-white/40">PDF, JPG, PNG or DOCX (max. 10MB)</p>
                  </div>
                  {attachedFile && (
                    <div className="flex items-center gap-2 mt-2 bg-uacc-gold/5 border border-uacc-gold/20 px-3 py-2 rounded-lg text-xs">
                      <FileText size={14} className="text-uacc-gold shrink-0" />
                      <span className="font-semibold text-white truncate flex-1">{attachedFile.name}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setAttachedFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                        className="text-white/40 hover:text-uacc-red transition-colors shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1.5 uppercase tracking-wider">Link to File (Optional)</label>
                  {linkMode === 'none' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFilePickerOpen(true)}
                        className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 text-sm transition-colors"
                      >
                        <Folder size={15} /> Pick an existing file...
                      </button>
                      <button
                        type="button"
                        onClick={() => setLinkMode('new')}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-uacc-gold/30 bg-uacc-gold/10 text-uacc-gold hover:bg-uacc-gold/20 text-sm font-semibold transition-colors whitespace-nowrap"
                      >
                        <Plus size={15} /> Create New File
                      </button>
                    </div>
                  )}

                  {linkMode === 'existing' && (
                    <div className="flex items-center justify-between gap-3 bg-uacc-gold/5 border border-uacc-gold/20 px-4 py-2.5 rounded-lg">
                      <span className="text-sm text-white flex items-center gap-2 min-w-0">
                        <Folder size={14} className="text-uacc-gold shrink-0" />
                        <span className="truncate">
                          {files.find(f => f.id === linkFileId)?.fileNumber} — {files.find(f => f.id === linkFileId)?.title}
                        </span>
                      </span>
                      <button type="button" onClick={() => { setLinkMode('none'); setLinkFileId('') }} className="text-white/40 hover:text-uacc-red shrink-0">
                        <X size={15} />
                      </button>
                    </div>
                  )}

                  {linkMode === 'new' && (
                    <div className="rounded-lg p-4 flex flex-col gap-3 border border-uacc-gold/20 bg-uacc-gold/5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-uacc-gold uppercase tracking-wider">New Records File</p>
                        <button type="button" onClick={() => { setLinkMode('none'); setNewLinkFileNumber(''); setNewLinkFileTitle('') }} className="text-white/40 hover:text-uacc-red">
                          <X size={15} />
                        </button>
                      </div>
                      <input
                        type="text" value={newLinkFileNumber} onChange={e => setNewLinkFileNumber(e.target.value)}
                        placeholder="File Number (leave blank to auto-assign)"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-uacc-gold/50"
                      />
                      <input
                        type="text" required value={newLinkFileTitle} onChange={e => setNewLinkFileTitle(e.target.value)}
                        placeholder="File Title *"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-uacc-gold/50"
                      />
                    </div>
                  )}
                </div>

                {submitError && <p className="text-xs text-uacc-red">{submitError}</p>}

              </form>
            </div>

            <div className="p-4 border-t border-white/10 bg-white/[0.02] rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => { setRegisterModalOpen(false); resetRegisterForm() }}
                disabled={submitting}
                className="px-6 py-2.5 rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-semibold text-sm transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                form="register-form" type="submit" disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-uacc-gold text-white font-bold text-sm hover:bg-uacc-gold/90 transition-colors shadow-lg shadow-uacc-gold/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BookOpen size={16} /> {submitting ? 'Registering...' : 'Register Document'}
              </button>
            </div>

          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* LINK TO FILE PICKER */}
      <AnimatePresence>
        {filePickerOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setFilePickerOpen(false); setFileSearchQuery('') }}></div>
            <motion.div
              className="relative w-full max-w-md bg-[#0b1120] rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[70vh]"
              initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22 }}
            >
              <div className="p-4 border-b border-white/10">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={15} />
                  <input
                    autoFocus
                    type="text"
                    value={fileSearchQuery}
                    onChange={(e) => setFileSearchQuery(e.target.value)}
                    placeholder="Search file number or title..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-uacc-gold/50"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {filesLoading ? (
                  <p className="text-xs text-white/40 text-center py-6">Loading files...</p>
                ) : (
                  files
                    .filter(f =>
                      !fileSearchQuery.trim() ||
                      f.fileNumber.toLowerCase().includes(fileSearchQuery.toLowerCase()) ||
                      f.title.toLowerCase().includes(fileSearchQuery.toLowerCase())
                    )
                    .map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          setLinkMode('existing'); setLinkFileId(f.id)
                          setFilePickerOpen(false); setFileSearchQuery('')
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2.5"
                      >
                        <Folder size={15} className="text-uacc-gold shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-white font-medium truncate">{f.fileNumber}</p>
                          <p className="text-xs text-white/40 truncate">{f.title} · {f._count?.entries ?? 0} entries</p>
                        </div>
                      </button>
                    ))
                )}
                {!filesLoading && files.length === 0 && (
                  <p className="text-xs text-white/40 text-center py-6">No files yet — create one from the Files tab or the form.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md ${
            toast.type === 'error'
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : 'bg-green-500/10 border-green-500/20 text-green-400'
          }`}>
            {toast.type === 'error' ? <X size={18} /> : <Check size={18} />}
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}

    </div>
  )
}
