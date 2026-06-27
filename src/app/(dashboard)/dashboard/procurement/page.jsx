'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Plus,
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Paperclip,
  Check,
  X,
  Send,
  Eye,
  Download,
  Trash2,
  UploadCloud
} from 'lucide-react'

import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'

// FORMATTING HELPERS
const formatCost = (amount) =>
  `UGX ${amount.toLocaleString('en-UG')}`

const formatDept = (dept) =>
  dept.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  })

// MOCK DATA
const MOCK_PROCUREMENT = [
  {
    id: 'UACC-PROC-2026-0043',
    itemDescription: 'Network Switch (Cisco SG350-28 28-Port Gigabit)',
    quantity: 2,
    estimatedCost: 2850000,
    department: 'FINANCE_AND_ADMINISTRATION',
    justification: 'Current network switches are over 6 years old and causing frequent connectivity drops in the server room. Replacement is critical for system uptime.',
    requestedBy: 'Patrick Katusabe',
    requestedAt: '2026-06-24',
    status: 'PENDING',
    deptHeadApproval: null,
    deptHeadComment: null,
    gmApproval: null,
    gmComment: null,
    supportingDocument: 'network_quote.pdf',
  },
  {
    id: 'UACC-PROC-2026-0042',
    itemDescription: 'Printer Toner Cartridges HP LaserJet (x10 units)',
    quantity: 10,
    estimatedCost: 450000,
    department: 'OPERATIONS',
    justification: 'Monthly toner replacement for Operations department printers. Stock depleted.',
    requestedBy: 'Staff Operations',
    requestedAt: '2026-06-22',
    status: 'DEPT_HEAD_APPROVED',
    deptHeadApproval: 'APPROVED',
    deptHeadComment: 'Confirmed stock depletion. Approved for GM review.',
    gmApproval: null,
    gmComment: null,
    supportingDocument: null,
  },
  {
    id: 'UACC-PROC-2026-0041',
    itemDescription: 'Ergonomic Office Chairs (x5)',
    quantity: 5,
    estimatedCost: 1250000,
    department: 'ENGINEERING',
    justification: 'Engineering bay seating is worn out and causing staff discomfort. Replacement required for staff welfare compliance.',
    requestedBy: 'Head Engineering',
    requestedAt: '2026-06-20',
    status: 'APPROVED',
    deptHeadApproval: 'APPROVED',
    deptHeadComment: 'Approved. Staff welfare priority.',
    gmApproval: 'APPROVED',
    gmComment: 'Approved. Proceed with procurement within budget.',
    supportingDocument: 'chair_quotation.pdf',
  },
  {
    id: 'UACC-PROC-2026-0040',
    itemDescription: 'Antivirus Licenses — Kaspersky Endpoint (x20)',
    quantity: 20,
    estimatedCost: 3200000,
    department: 'FINANCE_AND_ADMINISTRATION',
    justification: 'Annual renewal of endpoint protection licenses for all office computers.',
    requestedBy: 'Patrick Katusabe',
    requestedAt: '2026-06-17',
    status: 'REJECTED',
    deptHeadApproval: 'APPROVED',
    deptHeadComment: 'Necessary for cybersecurity compliance.',
    gmApproval: 'REJECTED',
    gmComment: 'Budget exceeded for this quarter. Resubmit in Q3 with vendor comparison.',
    supportingDocument: 'kaspersky_quote.pdf',
  },
  {
    id: 'UACC-PROC-2026-0039',
    itemDescription: 'UPS Battery Replacement — APC Smart-UPS',
    quantity: 4,
    estimatedCost: 980000,
    department: 'FINANCE_AND_ADMINISTRATION',
    justification: 'Server room UPS batteries have degraded below 60% capacity. Critical for power backup integrity.',
    requestedBy: 'Patrick Katusabe',
    requestedAt: '2026-06-10',
    status: 'APPROVED',
    deptHeadApproval: 'APPROVED',
    deptHeadComment: 'Critical infrastructure. Approved.',
    gmApproval: 'APPROVED',
    gmComment: 'Approved. Server room priority.',
    supportingDocument: 'ups_quote.pdf',
  },
  {
    id: 'UACC-PROC-2026-0038',
    itemDescription: 'A4 Printing Paper — 80gsm Reams (x50)',
    quantity: 50,
    estimatedCost: 375000,
    department: 'OPERATIONS',
    justification: 'Monthly stationery replenishment for Operations.',
    requestedBy: 'Staff Operations',
    requestedAt: '2026-06-05',
    status: 'APPROVED',
    deptHeadApproval: 'APPROVED',
    deptHeadComment: 'Routine stationery. Approved.',
    gmApproval: 'APPROVED',
    gmComment: 'Approved.',
    supportingDocument: null,
  },
]

const DEPARTMENTS = [
  'GENERAL_MANAGER_OFFICE',
  'FINANCE_AND_ADMINISTRATION',
  'ENGINEERING',
  'PILOTS',
  'OPERATIONS',
]

const STATUS_TABS = ['ALL', 'PENDING', 'DEPT_HEAD_APPROVED', 'APPROVED', 'REJECTED']

export default function ProcurementPage() {
  // PAGE STATE
  const [activeTab, setActiveTab] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [submitFormOpen, setSubmitFormOpen] = useState(false)
  const [toast, setToast] = useState(null) // { message, type: 'success' | 'error' | 'info' }

  // Submit form state
  const [formData, setFormData] = useState({
    itemDescription: '',
    quantity: '',
    estimatedCost: '',
    department: DEPARTMENTS[0],
    justification: '',
    supportingDocument: null,
  })
  
  const [selectedFileName, setSelectedFileName] = useState('')
  const fileInputRef = useRef(null)

  // FILTERING LOGIC
  const filteredRequests = useMemo(() => {
    return MOCK_PROCUREMENT.filter((req) => {
      // Status Filter
      if (activeTab !== 'ALL' && req.status !== activeTab) return false
      
      // Search Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesId = req.id.toLowerCase().includes(query)
        const matchesDesc = req.itemDescription.toLowerCase().includes(query)
        const matchesDept = formatDept(req.department).toLowerCase().includes(query)
        if (!matchesId && !matchesDesc && !matchesDept) return false
      }
      return true
    })
  }, [activeTab, searchQuery])

  // STATS CALCULATIONS
  const stats = useMemo(() => {
    return {
      total: MOCK_PROCUREMENT.length,
      pending: MOCK_PROCUREMENT.filter(r => r.status === 'PENDING').length,
      approved: MOCK_PROCUREMENT.filter(r => r.status === 'APPROVED').length,
      rejected: MOCK_PROCUREMENT.filter(r => r.status === 'REJECTED').length,
    }
  }, [])

  // TOAST EFFECT
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // HANDLERS
  const openReviewModal = (req) => {
    setSelectedRequest(req)
    setReviewModalOpen(true)
  }

  const handleApprove = () => {
    setToast({ message: 'Request approved.', type: 'success' })
    setReviewModalOpen(false)
    setSelectedRequest(null)
  }

  const handleReject = () => {
    setToast({ message: 'Request rejected.', type: 'error' })
    setReviewModalOpen(false)
    setSelectedRequest(null)
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    setToast({ message: 'Procurement request submitted successfully. Reference: UACC-PROC-2026-0044', type: 'success' })
    setSubmitFormOpen(false)
    setFormData({
      itemDescription: '',
      quantity: '',
      estimatedCost: '',
      department: DEPARTMENTS[0],
      justification: '',
      supportingDocument: null,
    })
    setSelectedFileName('')
  }
  
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, supportingDocument: file })
      setSelectedFileName(file.name)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn relative">
      {/* PAGE HEADER */}
      <PageHeader
        title="Procurement Requests"
        subtitle="Digital Form 5 — Submit and track procurement requests"
      >
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setSubmitFormOpen(true)}
        >
          New Request
        </Button>
      </PageHeader>

      {/* STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Requests */}
        <div className="card rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-uacc-gold/10 text-uacc-gold border border-uacc-gold/20 flex-shrink-0">
            <ClipboardList size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold font-heading text-[var(--text-primary)] leading-none">{stats.total}</p>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mt-1">Total Requests</p>
          </div>
        </div>
        
        {/* Pending */}
        <div className="card rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-uacc-red/10 text-uacc-red border border-uacc-red/20 flex-shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold font-heading text-[var(--text-primary)] leading-none">{stats.pending}</p>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mt-1">Pending</p>
          </div>
        </div>

        {/* Approved */}
        <div className="card rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold font-heading text-[var(--text-primary)] leading-none">{stats.approved}</p>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mt-1">Approved</p>
          </div>
        </div>

        {/* Rejected */}
        <div className="card rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-uacc-red/10 text-uacc-red border border-uacc-red/20 flex-shrink-0">
            <XCircle size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold font-heading text-[var(--text-primary)] leading-none">{stats.rejected}</p>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mt-1">Rejected</p>
          </div>
        </div>
      </div>

      {/* STATUS FILTER TABS */}
      <div className="border-b border-[var(--border-subtle)] w-full overflow-x-auto">
        <div className="flex gap-6 min-w-max px-2">
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab
            const label = tab.replace(/_/g, ' ')
            let count = stats.total
            if (tab === 'PENDING') count = stats.pending
            else if (tab === 'APPROVED') count = stats.approved
            else if (tab === 'REJECTED') count = stats.rejected
            else if (tab === 'DEPT_HEAD_APPROVED') count = MOCK_PROCUREMENT.filter(r => r.status === 'DEPT_HEAD_APPROVED').length

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 flex items-center gap-2 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
                  isActive 
                    ? 'border-uacc-gold text-uacc-gold bg-uacc-gold/5 px-2 rounded-t-md' 
                    : 'border-transparent text-[var(--text-muted)] hover:bg-white/[0.02] hover:text-[var(--text-secondary)] px-2 rounded-t-md'
                }`}
              >
                {label}
                <span className={`text-[10px] py-0.5 px-2 rounded-full ${
                  isActive ? 'bg-uacc-gold/20 text-uacc-gold' : 'bg-surface-container text-[var(--text-muted)]'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative w-full max-w-xl">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
        <input
          type="text"
          placeholder="Search by item description, reference number, or department..."
          className="input-field pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* PROCUREMENT TABLE */}
      <div className="card rounded-xl overflow-hidden flex flex-col justify-between min-h-[300px]">
        <div className="overflow-x-auto w-full">
          {filteredRequests.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Item Description</th>
                  <th>Department</th>
                  <th>Requested By</th>
                  <th>Date</th>
                  <th className="text-right">Cost</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => (
                  <tr key={req.id}>
                    {/* Reference */}
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className="font-heading text-xs font-bold text-uacc-gold uppercase tracking-wider">
                          {req.id}
                        </span>
                        {req.supportingDocument && (
                          <Paperclip size={12} className="text-uacc-gold" title="Has supporting document" />
                        )}
                      </div>
                    </td>

                    {/* Item Description */}
                    <td>
                      <div className="flex flex-col min-w-0">
                        <span 
                          className="font-bold text-white max-w-[200px] truncate" 
                          title={req.itemDescription}
                        >
                          {req.itemDescription}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] mt-0.5">
                          Qty: {req.quantity}
                        </span>
                      </div>
                    </td>

                    {/* Department */}
                    <td>
                      <span className="text-xs text-[var(--text-muted)]">
                        {formatDept(req.department)}
                      </span>
                    </td>

                    {/* Requested By */}
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-uacc-gold bg-uacc-gold/10 border border-uacc-gold/20">
                          {req.requestedBy.charAt(0)}
                        </div>
                        <span className="text-xs truncate max-w-[120px]" title={req.requestedBy}>
                          {req.requestedBy}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td>
                      <span className="text-xs text-[var(--text-muted)]">
                        {formatDate(req.requestedAt)}
                      </span>
                    </td>

                    {/* Cost */}
                    <td className="text-right">
                      <span className="font-bold text-uacc-gold whitespace-nowrap">
                        {formatCost(req.estimatedCost)}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      {req.status === 'DEPT_HEAD_APPROVED' ? (
                        <span className="badge badge-draft">Dept Approved</span>
                      ) : (
                        <Badge status={req.status} />
                      )}
                    </td>

                    {/* Actions */}
                    <td className="text-right">
                      {(req.status === 'PENDING' || req.status === 'DEPT_HEAD_APPROVED') && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openReviewModal(req)}
                        >
                          Review
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12">
              <EmptyState
                icon={ClipboardList}
                title="No requests found"
                message="Adjust filters or submit a new request"
              />
            </div>
          )}
        </div>
      </div>

      {/* REVIEW MODAL */}
      {reviewModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="card rounded-2xl w-full max-w-2xl bg-[var(--bg-surface)] flex flex-col my-8 shadow-2xl relative shadow-black/50">
            {/* Header */}
            <div className="p-6 pb-4 flex items-center justify-between sticky top-0 bg-[var(--bg-surface)] z-10 rounded-t-2xl">
              <div className="flex items-center gap-4">
                <h2 className="font-heading font-bold text-xl text-uacc-gold tracking-wider">
                  {selectedRequest.id}
                </h2>
                {selectedRequest.status === 'DEPT_HEAD_APPROVED' ? (
                  <span className="badge badge-draft">Dept Approved</span>
                ) : (
                  <Badge status={selectedRequest.status} />
                )}
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <hr className="border-t border-uacc-gold/20 mx-6" />

            {/* Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Details */}
              <div className="flex flex-col gap-5">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-[var(--text-muted)] mb-2">Request Details</p>
                  <p className="text-base font-bold text-white leading-snug">
                    {selectedRequest.itemDescription}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Quantity</span>
                    <span className="text-sm font-semibold text-white">{selectedRequest.quantity}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Department</span>
                    <span className="text-sm font-semibold text-white">{formatDept(selectedRequest.department)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Requested By</span>
                    <span className="text-sm font-semibold text-white">{selectedRequest.requestedBy}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Date Submitted</span>
                    <span className="text-sm font-semibold text-white">{formatDate(selectedRequest.requestedAt)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-0.5 mt-2">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Estimated Cost</span>
                  <span className="text-2xl font-bold text-uacc-gold font-heading">{formatCost(selectedRequest.estimatedCost)}</span>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Justification</span>
                  <div className="bg-[var(--bg-surface-container)] rounded-lg p-3 text-sm text-[var(--text-secondary)] leading-relaxed border border-[var(--border-subtle)]">
                    {selectedRequest.justification}
                  </div>
                </div>

                {selectedRequest.supportingDocument && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Supporting Document</span>
                    <div className="flex items-center gap-3 bg-[var(--bg-surface-container)] border border-[var(--border-subtle)] rounded-lg p-3">
                      <Paperclip size={16} className="text-uacc-gold" />
                      <span className="text-sm font-medium text-white flex-1 truncate">{selectedRequest.supportingDocument}</span>
                      <a href="#" className="text-xs text-blue-400 hover:underline font-semibold flex items-center gap-1">
                        <Download size={12} /> Download
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Approval Chain */}
              <div className="flex flex-col">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-[var(--text-muted)] mb-4">Approval Chain</p>
                
                <div className="flex flex-col relative">
                  {/* Vertical Line */}
                  <div className="absolute left-[11px] top-3 bottom-8 w-0.5 bg-[var(--border-subtle)] z-0"></div>

                  {/* Step 1: Submitted */}
                  <div className="flex gap-4 relative z-10 mb-6">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                      <Check size={14} className="text-white" />
                    </div>
                    <div className="flex flex-col bg-[var(--bg-surface-low)] border-l-2 border-emerald-500 rounded-r-lg p-3 flex-1 border-y border-r border-y-[var(--border-subtle)] border-r-[var(--border-subtle)]">
                      <span className="text-sm font-bold text-white">Submitted</span>
                      <span className="text-xs text-[var(--text-muted)] mt-1">
                        By: {selectedRequest.requestedBy} &middot; {formatDate(selectedRequest.requestedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Step 2: Dept Head */}
                  <div className="flex gap-4 relative z-10 mb-6">
                    {selectedRequest.deptHeadApproval === 'APPROVED' ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                        <Check size={14} className="text-white" />
                      </div>
                    ) : selectedRequest.deptHeadApproval === 'REJECTED' ? (
                      <div className="w-6 h-6 rounded-full bg-uacc-red flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_10px_rgba(204,34,0,0.3)]">
                        <X size={14} className="text-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-uacc-gold/20 border-2 border-uacc-gold flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse">
                        <Clock size={12} className="text-uacc-gold" />
                      </div>
                    )}
                    
                    <div className={`flex flex-col bg-[var(--bg-surface-low)] border-l-2 rounded-r-lg p-3 flex-1 border-y border-r border-y-[var(--border-subtle)] border-r-[var(--border-subtle)] ${
                      selectedRequest.deptHeadApproval === 'APPROVED' ? 'border-emerald-500' :
                      selectedRequest.deptHeadApproval === 'REJECTED' ? 'border-uacc-red' : 'border-uacc-gold'
                    }`}>
                      <span className="text-sm font-bold text-white">Dept Head Review</span>
                      {selectedRequest.deptHeadApproval ? (
                        <>
                          <span className={`text-xs font-semibold mt-1 ${
                            selectedRequest.deptHeadApproval === 'APPROVED' ? 'text-emerald-400' : 'text-uacc-red'
                          }`}>
                            [{selectedRequest.deptHeadApproval}]
                          </span>
                          {selectedRequest.deptHeadComment && (
                            <span className="text-xs text-[var(--text-muted)] mt-1 italic">
                              "{selectedRequest.deptHeadComment}"
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)] mt-1">Awaiting review</span>
                      )}
                    </div>
                  </div>

                  {/* Step 3: GM Final */}
                  <div className="flex gap-4 relative z-10">
                    {selectedRequest.gmApproval === 'APPROVED' ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                        <Check size={14} className="text-white" />
                      </div>
                    ) : selectedRequest.gmApproval === 'REJECTED' ? (
                      <div className="w-6 h-6 rounded-full bg-uacc-red flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_10px_rgba(204,34,0,0.3)]">
                        <X size={14} className="text-white" />
                      </div>
                    ) : (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        selectedRequest.deptHeadApproval === 'APPROVED' ? 'bg-uacc-gold/20 border-2 border-uacc-gold animate-pulse' : 'bg-[var(--surface-container)] border border-[var(--border-subtle)]'
                      }`}>
                        {selectedRequest.deptHeadApproval === 'APPROVED' ? <Clock size={12} className="text-uacc-gold" /> : <Clock size={12} className="text-[var(--text-muted)]" />}
                      </div>
                    )}
                    
                    <div className={`flex flex-col bg-[var(--bg-surface-low)] border-l-2 rounded-r-lg p-3 flex-1 border-y border-r border-y-[var(--border-subtle)] border-r-[var(--border-subtle)] ${
                      selectedRequest.gmApproval === 'APPROVED' ? 'border-emerald-500' :
                      selectedRequest.gmApproval === 'REJECTED' ? 'border-uacc-red' :
                      selectedRequest.deptHeadApproval === 'APPROVED' ? 'border-uacc-gold' : 'border-[var(--border-subtle)]'
                    }`}>
                      <span className="text-sm font-bold text-white">GM Final Approval</span>
                      {selectedRequest.gmApproval ? (
                        <>
                          <span className={`text-xs font-semibold mt-1 ${
                            selectedRequest.gmApproval === 'APPROVED' ? 'text-emerald-400' : 'text-uacc-red'
                          }`}>
                            [{selectedRequest.gmApproval}]
                          </span>
                          {selectedRequest.gmComment && (
                            <span className="text-xs text-[var(--text-muted)] mt-1 italic">
                              "{selectedRequest.gmComment}"
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)] mt-1">
                          {selectedRequest.deptHeadApproval === 'APPROVED' ? 'Awaiting review' : 'Waiting for previous step'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions (Only for Pending or Dept Approved) */}
            {(selectedRequest.status === 'PENDING' || selectedRequest.status === 'DEPT_HEAD_APPROVED') && (
              <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-low)] rounded-b-2xl flex flex-col gap-4 sticky bottom-0">
                <textarea 
                  className="input-field resize-none w-full text-sm" 
                  rows={2} 
                  placeholder="Add a comment (optional)"
                />
                <div className="flex justify-end gap-3">
                  <Button variant="danger" onClick={handleReject} icon={XCircle}>
                    Reject
                  </Button>
                  <Button variant="primary" onClick={handleApprove} icon={CheckCircle}>
                    Approve
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBMIT NEW REQUEST SLIDE-IN PANEL */}
      {submitFormOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSubmitFormOpen(false)}
          ></div>
          
          {/* Panel */}
          <div className="relative z-50 w-full max-w-lg h-full bg-[var(--bg-surface)] shadow-2xl flex flex-col border-l border-[var(--border-subtle)] transform transition-transform animate-slideInRight overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-[var(--border-subtle)] flex items-start justify-between bg-[var(--bg-surface-low)]">
              <div>
                <h2 className="text-xl font-bold font-heading text-white mb-1">New Procurement Request</h2>
                <p className="text-xs font-semibold text-uacc-gold tracking-widest uppercase">Digital Form 5 — UACC</p>
              </div>
              <button
                onClick={() => setSubmitFormOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold font-heading text-[var(--text-muted)] uppercase tracking-wider">
                  Item Description <span className="text-uacc-red">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="E.g., Network Switch (Cisco SG350-28)"
                  className="input-field resize-none"
                  value={formData.itemDescription}
                  onChange={(e) => setFormData({...formData, itemDescription: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold font-heading text-[var(--text-muted)] uppercase tracking-wider">
                    Quantity <span className="text-uacc-red">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="1"
                    className="input-field"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold font-heading text-[var(--text-muted)] uppercase tracking-wider">
                    Estimated Cost (UGX) <span className="text-uacc-red">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="2850000"
                    className="input-field"
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData({...formData, estimatedCost: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold font-heading text-[var(--text-muted)] uppercase tracking-wider">
                  Department <span className="text-uacc-red">*</span>
                </label>
                <select
                  className="input-field cursor-pointer"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                >
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{formatDept(dept)}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold font-heading text-[var(--text-muted)] uppercase tracking-wider flex items-baseline gap-1">
                  Justification <span className="text-uacc-red">*</span>
                  <span className="text-[9px] text-[var(--text-faint)] lowercase normal-case">(explain why this is needed)</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide detailed justification for this procurement..."
                  className="input-field resize-none"
                  value={formData.justification}
                  onChange={(e) => setFormData({...formData, justification: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold font-heading text-[var(--text-muted)] uppercase tracking-wider">
                  Supporting Document
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[var(--border-default)] hover:border-uacc-gold hover:bg-white/[0.01] transition-all rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer gap-2"
                >
                  <UploadCloud size={28} className="text-uacc-gold" />
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
                  />
                </div>
                {selectedFileName && (
                  <div className="flex items-center gap-2 mt-1 bg-uacc-gold/5 border border-uacc-gold/20 px-3 py-2 rounded-lg text-xs">
                    <Paperclip size={14} className="text-uacc-gold" />
                    <span className="font-semibold text-white truncate flex-1">{selectedFileName}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFileName('')
                        setFormData({...formData, supportingDocument: null})
                      }}
                      className="text-[var(--text-muted)] hover:text-uacc-red transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Reference Preview */}
              <div className="mt-2 bg-uacc-gold/10 border border-uacc-gold/30 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-uacc-gold/80 uppercase tracking-widest font-semibold mb-1">Auto-Generated Reference</span>
                <span className="font-heading text-sm font-bold text-uacc-gold tracking-wider">UACC-PROC-2026-0044</span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-low)] flex justify-end gap-3 shrink-0">
              <Button variant="outline" onClick={() => setSubmitFormOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" icon={Send} onClick={handleFormSubmit}>
                Submit Request
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
            {toast.type === 'info' && <CheckCircle size={18} className="text-uacc-gold flex-shrink-0" />}
            <span className="text-xs font-semibold text-white">
              {toast.message}
            </span>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
