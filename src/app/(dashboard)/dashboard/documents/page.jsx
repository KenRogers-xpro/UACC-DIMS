'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FolderOpen,
  Search,
  X,
  UploadCloud,
  Eye,
  Download,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  FileText,
  Sparkles,
  Sparkle,
  Inbox,
  Repeat,
  Archive,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useDocuments } from '@/lib/useDocuments'
import api from '@/lib/api'

import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import DocumentViewerModal from '@/components/documents/DocumentViewerModal'
import DocumentsAwaitingAction from '@/components/circulation/DocumentsAwaitingAction'

const STATE_TABS = [
  { key: 'new', label: 'New Arrivals', state: 'NEW', icon: Sparkle },
  { key: 'pending', label: 'Pending My Action', state: 'PENDING', icon: Inbox },
  { key: 'circulating', label: 'In Circulation', state: 'IN_CIRCULATION', icon: Repeat },
  { key: 'stored', label: 'Stored / Closed', state: 'STORED', icon: Archive },
]

const CATEGORIES = ['All', 'POLICY', 'REPORT', 'MEMO', 'CONTRACT', 'FORM', 'OTHER']
const DEPARTMENTS = [
  'All', 'GENERAL_MANAGER_OFFICE', 'FINANCE_AND_ADMINISTRATION', 'ENGINEERING', 'PILOTS',
  'OPERATIONS', 'HUMAN_RESOURCES', 'FINANCE_AND_ACCOUNTS', 'MARKETING',
]

const formatFileSize = (bytes) => {
  if (bytes === null || bytes === undefined) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// FORMATTING HELPERS
const formatDept = (dept) => {
  if (!dept) return ''
  if (dept === 'All') return 'All Departments'
  return dept.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

const formatCategory = (cat) => {
  if (!cat) return ''
  if (cat === 'All') return 'All Categories'
  return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase()
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const [year, month, day] = parts
  const monthIndex = parseInt(month, 10) - 1
  return `${parseInt(day, 10)} ${months[monthIndex]} ${year}`
}

const getCategoryColor = (category) => {
  switch (category) {
    case 'POLICY':
    case 'FORM':
      return '#C9973A' // Gold
    case 'REPORT':
      return '#CC2200' // Red
    case 'CONTRACT':
      return '#a5b4fc' // Blue
    case 'MEMO':
      return '#4ade80' // Green
    default:
      return '#94a3b8' // Muted
  }
}

export default function DocumentsPage() {
  const { user } = useAuth()
  const {
    documents, pagination, fetchDocuments, semanticSearch,
    uploadDocument, updateDocument, submitDocument, deleteDocument,
  } = useDocuments()
  const [semanticActive, setSemanticActive] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  // STATE MANAGEMENT
  const initialTab = STATE_TABS.find((t) => t.key === searchParams.get('tab'))?.key || 'pending'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [departmentFilter, setDepartmentFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [newArrivalsCount, setNewArrivalsCount] = useState(0)

  // UPLOAD FORM STATE
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('POLICY')
  const [newDepartment, setNewDepartment] = useState('GENERAL_MANAGER_OFFICE')
  const [newDescription, setNewDescription] = useState('')
  const [selectedFileName, setSelectedFileName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // TOAST STATE
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const fileInputRef = useRef(null)
  const itemsPerPage = 8

  // Deep link from the notification bell (?tab=pending etc.) — sync if the
  // query param changes while already on this page.
  useEffect(() => {
    const tabParam = STATE_TABS.find((t) => t.key === searchParams.get('tab'))?.key
    if (tabParam && tabParam !== activeTab) setActiveTab(tabParam)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleTabChange = (key) => {
    setActiveTab(key)
    router.replace(`/dashboard/documents?tab=${key}`, { scroll: false })
  }

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, categoryFilter, departmentFilter, activeTab])

  // Fetch from the real API whenever filters/page change
  const refresh = useCallback(async () => {
    const noOtherFilters = categoryFilter === 'All' && departmentFilter === 'All'
    // Semantic (RAG) search only applies to the free-text query, and only
    // when no category/department filter narrows things further — those
    // still go through the plain keyword fetch below. Falls back to
    // keyword search if the embeddings/Gemini path errors for any reason.
    if (searchTerm.trim() && noOtherFilters) {
      try {
        await semanticSearch(searchTerm.trim(), itemsPerPage)
        setSemanticActive(true)
        return
      } catch {
        setSemanticActive(false)
      }
    } else {
      setSemanticActive(false)
    }

    const activeState = STATE_TABS.find((t) => t.key === activeTab)?.state

    fetchDocuments({
      search: searchTerm || undefined,
      category: categoryFilter !== 'All' ? categoryFilter : undefined,
      department: departmentFilter !== 'All' ? departmentFilter : undefined,
      state: activeState,
      page: currentPage,
      limit: itemsPerPage,
    }).catch(() => {})
  }, [fetchDocuments, semanticSearch, searchTerm, categoryFilter, departmentFilter, activeTab, currentPage])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Tab badge — deliberately the SAME query the New Arrivals tab itself
  // uses (state=NEW), not a separately-derived number, so the count and the
  // list it describes can never drift apart. Independent of which tab is
  // currently active so it stays accurate while browsing other tabs, and
  // re-fetched whenever the viewer closes (opening a document is what marks
  // an arrival seen).
  const fetchNewArrivalsCount = useCallback(async () => {
    try {
      const res = await api.get('/documents?state=NEW&limit=1')
      setNewArrivalsCount(res.data?.pagination?.total || 0)
    } catch {
      // silent — decorative badge
    }
  }, [])

  useEffect(() => { fetchNewArrivalsCount() }, [fetchNewArrivalsCount, previewDoc])

  // Auto-dismiss toast
  useEffect(() => {
    if (toastVisible) {
      const timer = setTimeout(() => {
        setToastVisible(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toastVisible])

  const paginatedDocs = documents
  const totalPages = pagination?.totalPages || 1
  const totalCount = pagination?.total || 0

  // HANDLERS
  const handleUploadAreaClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFileName(file.name)
      if (!newTitle) {
        // Auto-fill title with filename minus extension
        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
        setNewTitle(nameWithoutExt)
      }
    }
  }

  const handleUploadSubmit = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) {
      setUploadError('Document Title is required.')
      return
    }
    if (!fileInputRef.current?.files?.[0]) {
      setUploadError('Please choose a file to upload.')
      return
    }

    setUploading(true)
    setUploadError('')
    try {
      const fd = new FormData()
      fd.append('title', newTitle.trim())
      fd.append('category', newCategory)
      fd.append('department', newDepartment)
      fd.append('description', newDescription)
      fd.append('file', fileInputRef.current.files[0])

      const created = await uploadDocument(fd)

      // Trigger Success Toast
      setToastMessage('Document uploaded — it stays private to you until you submit it.')
      setToastVisible(true)

      // Close Modal
      setUploadModalOpen(false)

      // Reset Form Fields
      setNewTitle('')
      setNewCategory('POLICY')
      setNewDepartment('GENERAL_MANAGER_OFFICE')
      setNewDescription('')
      setSelectedFileName('')
      if (fileInputRef.current) fileInputRef.current.value = ''

      refresh()
      // Open the new document immediately so there's no dead end after upload
      setPreviewDoc(created)
    } catch (err) {
      setUploadError(err.message || 'Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveEdit = async (id, data) => {
    const updated = await updateDocument(id, data)
    refresh()
    setPreviewDoc(updated)
  }

  const handleSubmitDoc = async (id, toRole, instruction, ccRoles) => {
    const result = await submitDocument(id, toRole, instruction, ccRoles)
    refresh()
    setPreviewDoc(result?.document || null)
  }

  const handleDownload = async (doc) => {
    try {
      // Files are served from our own auth-gated API, not a public URL —
      // fetch as a blob (carrying the Authorization header) rather than
      // linking straight to doc.filePath, which is just the original
      // filename now, not a fetchable address.
      const url = await api.getBlob(`/documents/${doc.id}/file`)
      const link = window.document.createElement('a')
      link.href = url
      link.download = doc.filePath || doc.title
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setToastMessage(err.message || 'Failed to download document')
      setToastVisible(true)
    }
  }

  const handleDelete = async (doc) => {
    try {
      await deleteDocument(doc.id)
      setToastMessage(`Deleted: ${doc.title}`)
      setToastVisible(true)
      refresh()
    } catch (err) {
      setToastMessage(err.message || 'Failed to delete document')
      setToastVisible(true)
    }
  }

  const triggerActionMessage = (actionName, docTitle) => {
    setToastMessage(`Action "${actionName}" triggered for: ${docTitle}`)
    setToastVisible(true)
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn relative">
      {/* PAGE HEADER */}
      <PageHeader
        title="Document Repository"
        subtitle="Upload, search and retrieve official UACC documents"
      >
        <Button
          variant="primary"
          onClick={() => setUploadModalOpen(true)}
          icon={Plus}
        >
          Upload Document
        </Button>
      </PageHeader>

      {/* STATE TABS — New Arrivals / Pending My Action / In Circulation / Stored */}
      <div className="card rounded-xl p-1.5 flex gap-1 overflow-x-auto">
        {STATE_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors flex-shrink-0 ${
              activeTab === tab.key ? 'text-uacc-gold' : 'hover:bg-white/5'
            }`}
            style={activeTab !== tab.key ? { color: 'var(--text-muted)' } : undefined}
          >
            {activeTab === tab.key && (
              <motion.div
                layoutId="documents-tab-active"
                className="absolute inset-0 rounded-lg bg-uacc-gold/10 border border-uacc-gold/25"
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            <tab.icon size={13} className="relative" />
            <span className="relative">{tab.label}</span>
            {tab.key === 'new' && newArrivalsCount > 0 && (
              <span className="relative text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-uacc-gold text-[#0b1120]">
                {newArrivalsCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Circulation-inbox panel — only shown under the New Arrivals tab,
          not globally on every dashboard anymore */}
      {activeTab === 'new' && <DocumentsAwaitingAction />}

      {/* FILTER BAR CARD */}
      <div className="card rounded-xl p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search documents..."
              className="input-field pl-10 h-[42px] w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Category Dropdown */}
            <select
              className="input-field py-2 px-3 cursor-pointer h-[42px] flex-1 min-w-[130px]"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {formatCategory(cat)}
                </option>
              ))}
            </select>

            {/* Department Dropdown */}
            <select
              className="input-field py-2 px-3 cursor-pointer h-[42px] flex-1 min-w-[160px]"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {formatDept(dept)}
                </option>
              ))}
            </select>

            {/* Clear Filters Button */}
            {(searchTerm || categoryFilter !== 'All' || departmentFilter !== 'All') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setCategoryFilter('All')
                  setDepartmentFilter('All')
                }}
                className="h-[42px] px-4 whitespace-nowrap"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Result Count */}
        <div className="text-xs flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
          {semanticActive ? (
            <>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-uacc-gold/10 text-uacc-gold border border-uacc-gold/20">
                <Sparkles size={10} /> AI Search
              </span>
              <span><span className="font-bold text-[var(--text-primary)]">{paginatedDocs.length}</span> semantically relevant results</span>
            </>
          ) : (
            <span>
              Showing <span className="font-bold text-[var(--text-primary)]">{paginatedDocs.length}</span> of{' '}
              <span className="font-bold text-[var(--text-primary)]">{totalCount}</span> documents
            </span>
          )}
        </div>
      </div>

      {/* DOCUMENTS — mobile cards + desktop table */}
      <div className="card rounded-xl overflow-hidden flex flex-col justify-between min-h-[400px]">

        {paginatedDocs.length > 0 ? (
          <>
            {/* ── DESKTOP TABLE (hidden on mobile) ── */}
            <div className="hidden md:block overflow-x-auto w-full">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Category</th>
                    <th>Department</th>
                    <th>Uploaded By</th>
                    <th>Date</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDocs.map((doc) => {
                    const catColor = getCategoryColor(doc.category)
                    return (
                      <tr key={doc.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div
                              className="p-2 rounded-lg flex-shrink-0 border"
                              style={{ backgroundColor: `${catColor}15`, borderColor: `${catColor}30` }}
                            >
                              <FileText size={18} style={{ color: catColor }} />
                            </div>
                            <div className="min-w-0 flex flex-col">
                              <span className="block font-bold text-(--text-primary) truncate max-w-[260px]" title={doc.title}>
                                {doc.title}
                              </span>
                              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{formatFileSize(doc.fileSize)}</span>
                            </div>
                          </div>
                        </td>
                        <td><Badge status={doc.category} /></td>
                        <td><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDept(doc.department)}</span></td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-uacc-gold bg-uacc-gold/10 border border-uacc-gold/20">
                              {doc.uploader?.name?.charAt(0) || '?'}
                            </div>
                            <span className="text-xs truncate max-w-[120px]" title={doc.uploader?.name}>{doc.uploader?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td><span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{formatDate(doc.createdAt)}</span></td>
                        <td>
                          <div className="flex items-center justify-end gap-1.5">
                            <button className="p-1.5 hover:text-uacc-gold text-[var(--text-muted)] transition-colors cursor-pointer" title="View" onClick={() => setPreviewDoc(doc)}><Eye size={16} /></button>
                            <button onClick={() => handleDownload(doc)} className="p-1.5 hover:text-blue-400 text-[var(--text-muted)] transition-colors cursor-pointer" title="Download"><Download size={16} /></button>
                            <button className="p-1.5 hover:text-uacc-red text-[var(--text-muted)] transition-colors cursor-pointer" title="Delete" onClick={() => handleDelete(doc)}><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* ── MOBILE CARDS (visible only on mobile) ── */}
            <div className="flex md:hidden flex-col divide-y divide-white/5">
              {paginatedDocs.map((doc) => {
                const catColor = getCategoryColor(doc.category)
                return (
                  <div key={doc.id} className="p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className="p-2 rounded-lg flex-shrink-0 border mt-0.5"
                        style={{ backgroundColor: `${catColor}15`, borderColor: `${catColor}30` }}
                      >
                        <FileText size={18} style={{ color: catColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-(--text-primary) text-sm leading-snug" title={doc.title}>{doc.title}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatFileSize(doc.fileSize)} · {formatDate(doc.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge status={doc.category} />
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10" style={{ color: 'var(--text-muted)' }}>
                        {formatDept(doc.department)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-uacc-gold bg-uacc-gold/10 border border-uacc-gold/20">
                          {doc.uploader?.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{doc.uploader?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:text-uacc-gold text-[var(--text-muted)] transition-colors cursor-pointer rounded-lg hover:bg-white/5" onClick={() => setPreviewDoc(doc)}><Eye size={15} /></button>
                        <button onClick={() => handleDownload(doc)} className="p-2 hover:text-blue-400 text-[var(--text-muted)] transition-colors cursor-pointer rounded-lg hover:bg-white/5" title="Download"><Download size={15} /></button>
                        <button className="p-2 hover:text-uacc-red text-[var(--text-muted)] transition-colors cursor-pointer rounded-lg hover:bg-white/5" onClick={() => handleDelete(doc)}><Trash2 size={15} /></button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="py-12">
            <EmptyState
              icon={FolderOpen}
              title="No documents found"
              message={
                searchTerm || categoryFilter !== 'All' || departmentFilter !== 'All'
                  ? 'Try adjusting your search or filter criteria'
                  : {
                      new: 'Nothing has landed with you recently.',
                      pending: "You're all caught up — nothing awaiting your action.",
                      circulating: 'No documents are currently circulating elsewhere.',
                      stored: 'No closed or archived documents yet.',
                    }[activeTab]
              }
            />
          </div>
        )}

        {/* Pagination Bar */}
        {totalCount > 0 && (
          <div className="px-4 md:px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] flex-shrink-0">
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Page <span className="font-bold text-[var(--text-primary)]">{currentPage}</span> of{' '}
              <span className="font-bold text-[var(--text-primary)]">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} icon={ChevronLeft}>Prev</Button>
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} icon={ChevronRight}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* UPLOAD DOCUMENT MODAL */}
      <AnimatePresence>
        {uploadModalOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm p-0 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <motion.div
            className="card w-full sm:max-w-2xl sm:mx-auto sm:rounded-2xl rounded-t-2xl rounded-b-none flex flex-col gap-5 max-h-[92vh] overflow-y-auto p-5 sm:p-8"
            style={{ background: 'var(--bg-surface)' }}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                Upload Document
              </h2>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1 hover:bg-white/5 rounded-lg text-[var(--text-muted)] hover:text-(--text-primary) transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Divider */}
            <hr className="border-t border-uacc-gold/20" />

            {/* Modal Form */}
            <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4">
              {/* File Upload Area */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold font-heading text-[var(--text-muted)] uppercase tracking-wider">
                  Select File
                </label>
                <div
                  onClick={handleUploadAreaClick}
                  className="border-2 border-dashed border-[var(--border-default)] hover:border-uacc-gold hover:bg-white/[0.01] transition-all rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer gap-2"
                >
                  <UploadCloud size={32} className="text-uacc-gold" />
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Drag & drop your file here, or <span className="text-uacc-gold hover:underline">click to browse</span>
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    Accepts PDF, DOCX, XLSX — max 10MB
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.docx,.xlsx"
                  />
                </div>
                {/* File name indicator */}
                {selectedFileName && (
                  <div className="flex items-center gap-2 mt-1.5 bg-uacc-gold/5 border border-uacc-gold/20 px-3 py-2 rounded-lg text-xs">
                    <FileText size={14} className="text-uacc-gold" />
                    <span className="font-semibold text-(--text-primary) truncate flex-1">{selectedFileName}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFileName('')
                      }}
                      className="text-[var(--text-muted)] hover:text-uacc-red transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold font-heading text-[var(--text-muted)] uppercase tracking-wider">
                  Document Title <span className="text-uacc-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter document title"
                  className="input-field"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              {/* Category & Department (side by side on wider layouts) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold font-heading text-[var(--text-muted)] uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    className="input-field py-2.5 px-3 cursor-pointer"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    {CATEGORIES.slice(1).map((cat) => (
                      <option key={cat} value={cat}>
                        {formatCategory(cat)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold font-heading text-[var(--text-muted)] uppercase tracking-wider">
                    Department
                  </label>
                  <select
                    className="input-field py-2.5 px-3 cursor-pointer"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                  >
                    {DEPARTMENTS.slice(1).map((dept) => (
                      <option key={dept} value={dept}>
                        {formatDept(dept)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold font-heading text-[var(--text-muted)] uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide a brief description of the document..."
                  className="input-field resize-none"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>

              {uploadError && <p className="text-xs text-uacc-red">{uploadError}</p>}

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 mt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={uploading}
                >
                  Upload Document
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>

      <DocumentViewerModal
        document={previewDoc}
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        currentUserId={user?.id}
        currentUserRole={user?.role}
        onSave={handleSaveEdit}
        onSubmit={handleSubmitDoc}
      />

      {/* SUCCESS TOAST ALERT */}
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 transform ${
          toastVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="card rounded-xl px-5 py-4 flex items-center gap-3 border border-emerald-500/20"
          style={{
            background: 'var(--bg-surface)',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-(--text-primary)">
            {toastMessage}
          </span>
        </div>
      </div>
    </div>
  )
}
