'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
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
  FileText
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useCirculation } from '@/lib/useCirculation'

import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'

// MOCK DATA
const MOCK_DOCUMENTS = [
  { id: 1,  title: 'UACC IT Policy 2026',              category: 'POLICY',   department: 'FINANCE_AND_ADMINISTRATION', uploadedBy: 'Patrick Katusabe',  fileSize: '2.4 MB', createdAt: '2026-06-20', filePath: '#' },
  { id: 2,  title: 'Q1 2026 Operations Report',        category: 'REPORT',   department: 'OPERATIONS',                uploadedBy: 'Staff Operations',  fileSize: '5.1 MB', createdAt: '2026-06-18', filePath: '#' },
  { id: 3,  title: 'Engineering Maintenance Manual v3', category: 'FORM',     department: 'ENGINEERING',               uploadedBy: 'Head Engineering',  fileSize: '8.7 MB', createdAt: '2026-06-15', filePath: '#' },
  { id: 4,  title: 'Staff Code of Conduct',            category: 'POLICY',   department: 'GENERAL_MANAGER_OFFICE',    uploadedBy: 'Lt. Gen. Lakara',   fileSize: '1.2 MB', createdAt: '2026-06-10', filePath: '#' },
  { id: 5,  title: 'Procurement Guidelines 2026',      category: 'POLICY',   department: 'FINANCE_AND_ADMINISTRATION', uploadedBy: 'Patrick Katusabe', fileSize: '0.9 MB', createdAt: '2026-06-08', filePath: '#' },
  { id: 6,  title: 'NCNDA — UACC & ADS Agreement',    category: 'CONTRACT', department: 'GENERAL_MANAGER_OFFICE',    uploadedBy: 'Lt. Gen. Lakara',   fileSize: '3.3 MB', createdAt: '2025-05-19', filePath: '#' },
  { id: 7,  title: 'Fleet Maintenance Schedule Q2',   category: 'REPORT',   department: 'ENGINEERING',               uploadedBy: 'Head Engineering',  fileSize: '2.1 MB', createdAt: '2026-05-14', filePath: '#' },
  { id: 8,  title: 'Staff Meeting Minutes — May 2026', category: 'MEMO',     department: 'FINANCE_AND_ADMINISTRATION', uploadedBy: 'Patrick Katusabe', fileSize: '0.4 MB', createdAt: '2026-05-10', filePath: '#' },
  { id: 9,  title: 'Cargo Operations SOP',            category: 'FORM',     department: 'OPERATIONS',                uploadedBy: 'Staff Operations',  fileSize: '4.6 MB', createdAt: '2026-05-05', filePath: '#' },
  { id: 10, title: 'Annual Safety Audit Report 2025', category: 'REPORT',   department: 'GENERAL_MANAGER_OFFICE',    uploadedBy: 'Internal Auditor',  fileSize: '6.8 MB', createdAt: '2026-04-28', filePath: '#' },
  { id: 11, title: 'Pilot Training Records — Q1',    category: 'FORM',     department: 'PILOTS',                    uploadedBy: 'Head Engineering',  fileSize: '3.2 MB', createdAt: '2026-04-20', filePath: '#' },
  { id: 12, title: 'Board Resolution — April 2026',  category: 'MEMO',     department: 'GENERAL_MANAGER_OFFICE',    uploadedBy: 'Lt. Gen. Lakara',   fileSize: '0.7 MB', createdAt: '2026-04-15', filePath: '#' },
]

const CATEGORIES = ['All', 'POLICY', 'REPORT', 'MEMO', 'CONTRACT', 'FORM', 'OTHER']
const DEPARTMENTS = ['All', 'GENERAL_MANAGER_OFFICE', 'FINANCE_AND_ADMINISTRATION', 'ENGINEERING', 'PILOTS', 'OPERATIONS']

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
  const { initiateCirculation } = useCirculation()

  // STATE MANAGEMENT
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [departmentFilter, setDepartmentFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  // UPLOAD FORM STATE
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('POLICY')
  const [newDepartment, setNewDepartment] = useState('GENERAL_MANAGER_OFFICE')
  const [newDescription, setNewDescription] = useState('')
  const [selectedFileName, setSelectedFileName] = useState('')

  // TOAST STATE
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const fileInputRef = useRef(null)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, categoryFilter, departmentFilter])

  // Auto-dismiss toast
  useEffect(() => {
    if (toastVisible) {
      const timer = setTimeout(() => {
        setToastVisible(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toastVisible])

  // REAL-TIME FILTERING (useMemo)
  const filteredDocs = useMemo(() => {
    return MOCK_DOCUMENTS.filter((doc) => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === 'All' || doc.category === categoryFilter
      const matchesDepartment = departmentFilter === 'All' || doc.department === departmentFilter
      return matchesSearch && matchesCategory && matchesDepartment
    })
  }, [searchTerm, categoryFilter, departmentFilter])

  // PAGINATION (8 items per page)
  const itemsPerPage = 8
  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage) || 1
  const paginatedDocs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredDocs.slice(start, start + itemsPerPage)
  }, [filteredDocs, currentPage])

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
      alert('Document Title is required.')
      return
    }

    try {
      // Initiate real circulation
      await initiateCirculation({
        title: newTitle,
        sourceType: 'DOCUMENT',
        sourceId: null, // Should be actual document ID after upload
        toRole: 'GENERAL_MANAGER', // Defaulting for demo purposes
        instruction: newDescription || 'Please review this new document.'
      })

      // Trigger Success Toast
      setToastMessage('Document uploaded and circulation initiated!')
      setToastVisible(true)

      // Close Modal
      setUploadModalOpen(false)

      // Reset Form Fields
      setNewTitle('')
      setNewCategory('POLICY')
      setNewDepartment('GENERAL_MANAGER_OFFICE')
      setNewDescription('')
      setSelectedFileName('')
    } catch (err) {
      alert('Failed to initiate circulation: ' + err.message)
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
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Showing <span className="font-bold text-[var(--text-primary)]">{filteredDocs.length}</span> of{' '}
          <span className="font-bold text-[var(--text-primary)]">{MOCK_DOCUMENTS.length}</span> documents
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
                              <span className="block font-bold text-white truncate max-w-[260px]" title={doc.title}>
                                {doc.title}
                              </span>
                              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{doc.fileSize}</span>
                            </div>
                          </div>
                        </td>
                        <td><Badge status={doc.category} /></td>
                        <td><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDept(doc.department)}</span></td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-uacc-gold bg-uacc-gold/10 border border-uacc-gold/20">
                              {doc.uploadedBy.charAt(0)}
                            </div>
                            <span className="text-xs truncate max-w-[120px]" title={doc.uploadedBy}>{doc.uploadedBy}</span>
                          </div>
                        </td>
                        <td><span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{formatDate(doc.createdAt)}</span></td>
                        <td>
                          <div className="flex items-center justify-end gap-1.5">
                            <button className="p-1.5 hover:text-uacc-gold text-[var(--text-muted)] transition-colors cursor-pointer" title="View" onClick={() => triggerActionMessage('View', doc.title)}><Eye size={16} /></button>
                            <button className="p-1.5 hover:text-blue-400 text-[var(--text-muted)] transition-colors cursor-pointer" title="Download" onClick={() => triggerActionMessage('Download', doc.title)}><Download size={16} /></button>
                            <button className="p-1.5 hover:text-uacc-red text-[var(--text-muted)] transition-colors cursor-pointer" title="Delete" onClick={() => triggerActionMessage('Delete', doc.title)}><Trash2 size={16} /></button>
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
                        <p className="font-bold text-white text-sm leading-snug" title={doc.title}>{doc.title}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{doc.fileSize} · {formatDate(doc.createdAt)}</p>
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
                          {doc.uploadedBy.charAt(0)}
                        </div>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{doc.uploadedBy}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:text-uacc-gold text-[var(--text-muted)] transition-colors cursor-pointer rounded-lg hover:bg-white/5" onClick={() => triggerActionMessage('View', doc.title)}><Eye size={15} /></button>
                        <button className="p-2 hover:text-blue-400 text-[var(--text-muted)] transition-colors cursor-pointer rounded-lg hover:bg-white/5" onClick={() => triggerActionMessage('Download', doc.title)}><Download size={15} /></button>
                        <button className="p-2 hover:text-uacc-red text-[var(--text-muted)] transition-colors cursor-pointer rounded-lg hover:bg-white/5" onClick={() => triggerActionMessage('Delete', doc.title)}><Trash2 size={15} /></button>
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
              message="Try adjusting your search or filter criteria"
            />
          </div>
        )}

        {/* Pagination Bar */}
        {filteredDocs.length > 0 && (
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
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm p-0 sm:p-6 pointer-events-auto" onClick={(e) => e.target === e.currentTarget && setUploadModalOpen(false)}>
          <div
            className="card w-full sm:max-w-2xl sm:mx-auto sm:rounded-2xl rounded-t-2xl rounded-b-none flex flex-col gap-5 max-h-[92vh] overflow-y-auto p-5 sm:p-8 pointer-events-auto"
            style={{ background: 'var(--bg-surface)' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                Upload Document
              </h2>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1 hover:bg-white/5 rounded-lg text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
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
                    <span className="font-semibold text-white truncate flex-1">{selectedFileName}</span>
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

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 mt-2">
                <Button
                  variant="outline"
                  onClick={() => setUploadModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                >
                  Upload Document
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
          <span className="text-xs font-semibold text-white">
            {toastMessage}
          </span>
        </div>
      </div>
    </div>
  )
}
