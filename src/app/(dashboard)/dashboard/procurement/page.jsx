'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
import { useAuth } from '@/lib/auth-context'
import { useProcurement } from '@/lib/useProcurement'

// FORMATTING HELPERS
// estimatedCost is a Prisma Decimal(12,2) — it arrives over JSON as a
// string (Decimal's own toJSON), so this must coerce before formatting.
const formatCost = (amount) =>
  `UGX ${Number(amount).toLocaleString('en-UG')}`

const formatDept = (dept) =>
  dept.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  })

// Real Department enum (backend/prisma/schema.prisma) — all 8 values, so
// every department's own users can submit a request against their own
// department.
const DEPARTMENTS = [
  'GENERAL_MANAGER_OFFICE',
  'FINANCE_AND_ADMINISTRATION',
  'ENGINEERING',
  'PILOTS',
  'OPERATIONS',
  'HUMAN_RESOURCES',
  'FINANCE_AND_ACCOUNTS',
  'MARKETING',
]

// Real ProcurementStatus enum (backend/prisma/schema.prisma) — 5 values,
// not the 4 invented ones the mock data used.
const STATUS_TABS = ['ALL', 'PENDING_DEPT_HEAD', 'PENDING_PROCUREMENT_OFFICER', 'PENDING_GM', 'APPROVED', 'REJECTED']

const STATUS_LABELS = {
  PENDING_DEPT_HEAD: 'Pending Dept. Head',
  PENDING_PROCUREMENT_OFFICER: 'Pending Procurement',
  PENDING_GM: 'Pending GM',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

// Roles allowed to originate a request — mirrors POST /api/procurement's
// own allowedRoles check exactly.
const CAN_SUBMIT_ROLES = ['STAFF', 'DEPARTMENT_HEAD', 'IT_ADMINISTRATOR']

// Which role's turn it is at each pending stage — mirrors PATCH
// /api/procurement/:id/decision's own per-role status checks exactly.
const STAGE_OWNER_ROLE = {
  PENDING_DEPT_HEAD: 'DEPARTMENT_HEAD',
  PENDING_PROCUREMENT_OFFICER: 'PROCUREMENT_OFFICER',
  PENDING_GM: 'GENERAL_MANAGER',
}

export default function ProcurementPage() {
  const { user } = useAuth()
  const { requests, pagination, loading, error, fetchRequests, createRequest, decide } = useProcurement()

  // PAGE STATE
  const [activeTab, setActiveTab] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [submitFormOpen, setSubmitFormOpen] = useState(false)
  const [toast, setToast] = useState(null) // { message, type: 'success' | 'error' | 'info' }
  const [actionLoading, setActionLoading] = useState(false)

  // Submit form state
  const [formData, setFormData] = useState({
    itemDescription: '',
    quantity: '',
    estimatedCost: '',
    department: user?.department || DEPARTMENTS[0],
    justification: '',
  })

  const [selectedFileName, setSelectedFileName] = useState('')
  const fileInputRef = useRef(null)

  // Review form state — Dept Head / GM only need a comment; Procurement
  // Officer's stage additionally needs the vendor + verification fields
  // PATCH /:id/decision accepts for that role.
  const [reviewForm, setReviewForm] = useState({
    comment: '',
    vendorName: '',
    vendorVerified: false,
    budgetVerified: false,
  })

  // Full unfiltered set is fetched once (and re-fetched after any action) —
  // the table, stats, and tab badges all derive from this one array, never
  // a second/different query.
  useEffect(() => {
    fetchRequests({ limit: 100 }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // FILTERING LOGIC
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Status Filter
      if (activeTab !== 'ALL' && req.status !== activeTab) return false

      // Search Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesRef = req.referenceNo.toLowerCase().includes(query)
        const matchesDesc = req.itemDescription.toLowerCase().includes(query)
        const matchesDept = formatDept(req.department).toLowerCase().includes(query)
        if (!matchesRef && !matchesDesc && !matchesDept) return false
      }
      return true
    })
  }, [requests, activeTab, searchQuery])

  // STATS CALCULATIONS — derived from the same fetched `requests` array.
  const stats = useMemo(() => {
    return {
      total: pagination?.total ?? requests.length,
      pending: requests.filter(r => STAGE_OWNER_ROLE[r.status]).length,
      approved: requests.filter(r => r.status === 'APPROVED').length,
      rejected: requests.filter(r => r.status === 'REJECTED').length,
    }
  }, [requests, pagination])

  // TOAST EFFECT
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // Whether the signed-in user's role owns the NEXT action on this request.
  const canReview = (req) => STAGE_OWNER_ROLE[req.status] === user?.role

  // HANDLERS
  const openReviewModal = (req) => {
    setSelectedRequest(req)
    setReviewForm({ comment: '', vendorName: req.vendorName || '', vendorVerified: false, budgetVerified: false })
    setReviewModalOpen(true)
  }

  const closeReviewModal = () => {
    setReviewModalOpen(false)
    setSelectedRequest(null)
  }

  const submitDecision = async (decision) => {
    if (!selectedRequest) return
    setActionLoading(true)
    try {
      const payload = { decision, comment: reviewForm.comment }
      if (user?.role === 'PROCUREMENT_OFFICER') {
        payload.vendorName = reviewForm.vendorName
        payload.vendorVerified = reviewForm.vendorVerified
        payload.budgetVerified = reviewForm.budgetVerified
      }
      const res = await decide(selectedRequest.id, payload)
      setToast({ message: res.message || 'Decision recorded.', type: 'success' })
      closeReviewModal()
      fetchRequests({ limit: 100 }).catch(() => {})
    } catch (err) {
      setToast({ message: err.message || 'Failed to record decision.', type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      const res = await createRequest({
        itemDescription: formData.itemDescription,
        quantity: formData.quantity,
        estimatedCost: formData.estimatedCost,
        department: formData.department,
        justification: formData.justification,
      })
      setToast({ message: res.message || 'Procurement request submitted.', type: 'success' })
      setSubmitFormOpen(false)
      setFormData({
        itemDescription: '',
        quantity: '',
        estimatedCost: '',
        department: user?.department || DEPARTMENTS[0],
        justification: '',
      })
      setSelectedFileName('')
      fetchRequests({ limit: 100 }).catch(() => {})
    } catch (err) {
      setToast({ message: err.message || 'Failed to submit request.', type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  // Selecting a file only updates the local filename preview — the backend
  // route (POST /api/procurement) has no file-handling: it destructures
  // itemDescription/quantity/estimatedCost/department/justification only,
  // with no multer/upload middleware. Nothing is actually sent or stored.
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFileName(file.name)
    }
  }

  const canSubmitNewRequest = CAN_SUBMIT_ROLES.includes(user?.role)

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn relative">
      {/* PAGE HEADER */}
      <PageHeader
        title="Procurement Requests"
        subtitle="Digital Form 5 — Submit and track procurement requests"
      >
        {canSubmitNewRequest && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setSubmitFormOpen(true)}
          >
            New Request
          </Button>
        )}
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
            const label = tab === 'ALL' ? 'All' : STATUS_LABELS[tab]
            const count = tab === 'ALL' ? stats.total : requests.filter(r => r.status === tab).length

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
          {loading && requests.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--text-muted)]">Loading requests...</div>
          ) : error && requests.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={XCircle}
                title="Could not load requests"
                message={error}
              />
            </div>
          ) : filteredRequests.length > 0 ? (
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
                          {req.referenceNo}
                        </span>
                      </div>
                    </td>

                    {/* Item Description */}
                    <td>
                      <div className="flex flex-col min-w-0">
                        <span
                          className="font-bold text-[var(--text-primary)] max-w-[200px] truncate"
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
                          {req.requestedBy?.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-xs truncate max-w-[120px]" title={req.requestedBy?.name}>
                          {req.requestedBy?.name}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td>
                      <span className="text-xs text-[var(--text-muted)]">
                        {formatDate(req.createdAt)}
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
                      <Badge status={req.status} label={STATUS_LABELS[req.status]} />
                    </td>

                    {/* Actions */}
                    <td className="text-right">
                      {canReview(req) && (
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
      <AnimatePresence>
        {reviewModalOpen && selectedRequest && (
        <motion.div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <motion.div
            className="card rounded-2xl w-full max-w-2xl bg-[var(--bg-surface)] flex flex-col my-8 shadow-2xl relative shadow-black/50 max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="p-6 pb-4 flex items-center justify-between sticky top-0 bg-[var(--bg-surface)] z-10 rounded-t-2xl">
              <div className="flex items-center gap-4">
                <h2 className="font-heading font-bold text-xl text-uacc-gold tracking-wider">
                  {selectedRequest.referenceNo}
                </h2>
                <Badge status={selectedRequest.status} label={STATUS_LABELS[selectedRequest.status]} />
              </div>
              <button
                onClick={closeReviewModal}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
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
                  <p className="text-base font-bold text-[var(--text-primary)] leading-snug">
                    {selectedRequest.itemDescription}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Quantity</span>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{selectedRequest.quantity}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Department</span>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{formatDept(selectedRequest.department)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Requested By</span>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{selectedRequest.requestedBy?.name}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Date Submitted</span>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{formatDate(selectedRequest.createdAt)}</span>
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
              </div>

              {/* Right Column: Approval Chain — real 4-stage chain
                  (Submitted -> Dept Head -> Procurement Officer -> GM),
                  not the mock's 3-stage version. */}
              <div className="flex flex-col">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-[var(--text-muted)] mb-4">Approval Chain</p>

                <div className="flex flex-col relative">
                  <div className="absolute left-[11px] top-3 bottom-8 w-0.5 bg-[var(--border-subtle)] z-0"></div>

                  {/* Step 1: Submitted */}
                  <ChainStep
                    state="done"
                    title="Submitted"
                    detail={`By: ${selectedRequest.requestedBy?.name} · ${formatDate(selectedRequest.createdAt)}`}
                  />

                  {/* Step 2: Dept Head */}
                  <ChainStep
                    state={
                      selectedRequest.deptHeadApproval === 'APPROVED' ? 'done' :
                      selectedRequest.deptHeadApproval === 'REJECTED' ? 'rejected' :
                      selectedRequest.status === 'PENDING_DEPT_HEAD' ? 'active' : 'waiting'
                    }
                    title="Dept Head Review"
                    detail={
                      selectedRequest.deptHeadApproval
                        ? [`[${selectedRequest.deptHeadApproval}]`, selectedRequest.deptHeadComment && `"${selectedRequest.deptHeadComment}"`].filter(Boolean)
                        : selectedRequest.status === 'PENDING_DEPT_HEAD' ? 'Awaiting review' : 'Waiting for previous step'
                    }
                  />

                  {/* Step 3: Procurement Officer */}
                  <ChainStep
                    state={
                      selectedRequest.poProcessedAt && selectedRequest.status !== 'PENDING_DEPT_HEAD' ? 'done' :
                      selectedRequest.poProcessedAt && selectedRequest.status === 'PENDING_DEPT_HEAD' ? 'rejected' :
                      selectedRequest.status === 'PENDING_PROCUREMENT_OFFICER' ? 'active' : 'waiting'
                    }
                    title="Procurement Officer Verification"
                    detail={
                      selectedRequest.poProcessedAt
                        ? [
                            selectedRequest.status === 'PENDING_DEPT_HEAD' ? '[RETURNED]' : '[VERIFIED]',
                            selectedRequest.vendorName && `Vendor: ${selectedRequest.vendorName}`,
                            selectedRequest.poNotes && `"${selectedRequest.poNotes}"`,
                          ].filter(Boolean)
                        : selectedRequest.status === 'PENDING_PROCUREMENT_OFFICER' ? 'Awaiting review' : 'Waiting for previous step'
                    }
                  />

                  {/* Step 4: GM Final */}
                  <ChainStep
                    last
                    state={
                      selectedRequest.gmApproval === 'APPROVED' ? 'done' :
                      selectedRequest.gmApproval === 'REJECTED' ? 'rejected' :
                      selectedRequest.status === 'PENDING_GM' ? 'active' : 'waiting'
                    }
                    title="GM Final Approval"
                    detail={
                      selectedRequest.gmApproval
                        ? [`[${selectedRequest.gmApproval}]`, selectedRequest.gmComment && `"${selectedRequest.gmComment}"`].filter(Boolean)
                        : selectedRequest.status === 'PENDING_GM' ? 'Awaiting review' : 'Waiting for previous step'
                    }
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions — role- and stage-aware. Only the role that
                owns the CURRENT stage sees an action panel; everyone else
                gets a read-only view (matches PATCH /:id/decision's own
                per-role, per-status checks). */}
            {canReview(selectedRequest) && user?.role === 'PROCUREMENT_OFFICER' && (
              <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-low)] rounded-b-2xl flex flex-col gap-4 sticky bottom-0">
                <input
                  className="input-field text-sm"
                  placeholder="Vendor name"
                  value={reviewForm.vendorName}
                  onChange={(e) => setReviewForm({ ...reviewForm, vendorName: e.target.value })}
                />
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reviewForm.vendorVerified}
                      onChange={(e) => setReviewForm({ ...reviewForm, vendorVerified: e.target.checked })}
                    />
                    Vendor Verified
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reviewForm.budgetVerified}
                      onChange={(e) => setReviewForm({ ...reviewForm, budgetVerified: e.target.checked })}
                    />
                    Budget Verified
                  </label>
                </div>
                <textarea
                  className="input-field resize-none w-full text-sm"
                  rows={2}
                  placeholder="Notes (optional)"
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                />
                <div className="flex justify-end gap-3">
                  <Button variant="danger" disabled={actionLoading} onClick={() => submitDecision('RETURNED')} icon={XCircle}>
                    Return
                  </Button>
                  <Button variant="primary" disabled={actionLoading} onClick={() => submitDecision('VERIFIED')} icon={CheckCircle}>
                    Verify
                  </Button>
                </div>
              </div>
            )}

            {canReview(selectedRequest) && user?.role !== 'PROCUREMENT_OFFICER' && (
              <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-low)] rounded-b-2xl flex flex-col gap-4 sticky bottom-0">
                <textarea
                  className="input-field resize-none w-full text-sm"
                  rows={2}
                  placeholder="Add a comment (optional)"
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                />
                <div className="flex justify-end gap-3">
                  <Button variant="danger" disabled={actionLoading} onClick={() => submitDecision('REJECTED')} icon={XCircle}>
                    Reject
                  </Button>
                  <Button variant="primary" disabled={actionLoading} onClick={() => submitDecision('APPROVED')} icon={CheckCircle}>
                    Approve
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>

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
                <h2 className="text-xl font-bold font-heading text-[var(--text-primary)] mb-1">New Procurement Request</h2>
                <p className="text-xs font-semibold text-uacc-gold tracking-widest uppercase">Digital Form 5 — UACC</p>
              </div>
              <button
                onClick={() => setSubmitFormOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <span className="font-semibold text-[var(--text-primary)] truncate flex-1">{selectedFileName}</span>
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
                {/* No storage endpoint exists on the backend for this field
                    yet (see the comment on handleFileSelect) — the file
                    name is shown for UX continuity only and nothing is
                    uploaded. */}
                <p className="text-[10px] text-[var(--text-faint)]">
                  Attachment storage is not wired up yet — this file is not sent with the request.
                </p>
              </div>

              {/* Reference is assigned by the server on submission — no
                  client-side placeholder. */}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-low)] flex justify-end gap-3 shrink-0">
              <Button variant="outline" onClick={() => setSubmitFormOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" icon={Send} disabled={actionLoading} onClick={handleFormSubmit}>
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
            <span className="text-xs font-semibold text-[var(--text-primary)]">
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

// One step in the Approval Chain visual. `state` is 'done' | 'active' |
// 'rejected' | 'waiting'. `detail` may be a string or an array of lines.
function ChainStep({ state, title, detail, last = false }) {
  const lines = Array.isArray(detail) ? detail : [detail]
  const borderColor =
    state === 'done' ? 'border-emerald-500' :
    state === 'rejected' ? 'border-uacc-red' :
    state === 'active' ? 'border-uacc-gold' :
    'border-[var(--border-subtle)]'

  return (
    <div className={`flex gap-4 relative z-10 ${last ? '' : 'mb-6'}`}>
      {state === 'done' ? (
        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
          <Check size={14} className="text-white" />
        </div>
      ) : state === 'rejected' ? (
        <div className="w-6 h-6 rounded-full bg-uacc-red flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_10px_rgba(204,34,0,0.3)]">
          <X size={14} className="text-white" />
        </div>
      ) : state === 'active' ? (
        <div className="w-6 h-6 rounded-full bg-uacc-gold/20 border-2 border-uacc-gold flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse">
          <Clock size={12} className="text-uacc-gold" />
        </div>
      ) : (
        <div className="w-6 h-6 rounded-full bg-[var(--bg-surface-container)] border border-[var(--border-subtle)] flex items-center justify-center flex-shrink-0 mt-0.5">
          <Clock size={12} className="text-[var(--text-muted)]" />
        </div>
      )}

      <div className={`flex flex-col bg-[var(--bg-surface-low)] border-l-2 rounded-r-lg p-3 flex-1 border-y border-r border-y-[var(--border-subtle)] border-r-[var(--border-subtle)] ${borderColor}`}>
        <span className="text-sm font-bold text-[var(--text-primary)]">{title}</span>
        {lines.filter(Boolean).map((line, i) => (
          <span key={i} className="text-xs text-[var(--text-muted)] mt-1 italic first:not-italic first:font-semibold first:text-[var(--text-secondary)]">
            {line}
          </span>
        ))}
      </div>
    </div>
  )
}
