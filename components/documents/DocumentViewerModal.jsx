'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, FileText, Pencil, Send, Lock, MessageSquare, History, Eye, PenTool, Maximize2, Minimize2 } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonLine } from '@/components/ui/SkeletonLoader'
import SignaturesPanel from '@/components/circulation/SignaturesPanel'
import AnnotationTrail from '@/components/circulation/AnnotationTrail'
import CirculationLiveTracker from '@/components/circulation/CirculationLiveTracker'
import SigningModal from '@/components/circulation/SigningModal'
import { useCirculation } from '@/lib/useCirculation'
import { notifyNotificationsChanged } from '@/lib/useNotifications'
import api from '@/lib/api'

const CATEGORIES = ['POLICY', 'REPORT', 'MEMO', 'CONTRACT', 'FORM', 'OTHER']
const ANNOTATION_TYPES = ['COMMENT', 'NOTE', 'ACTION', 'FLAG']
// Every role a document can be sent to.
const SUBMIT_ROLES = [
  { value: 'GENERAL_MANAGER',       label: 'General Manager' },
  { value: 'GM_PERSONAL_ASSISTANT', label: 'GM Personal Assistant' },
  { value: 'DEPARTMENT_HEAD',       label: 'Department Head' },
  { value: 'STAFF',                 label: 'Staff' },
  { value: 'IT_ADMINISTRATOR',      label: 'IT Administrator' },
  { value: 'INTERNAL_AUDITOR',      label: 'Internal Auditor' },
  { value: 'RECORDS_EXECUTIVE',     label: 'Records Executive' },
  { value: 'PROCUREMENT_OFFICER',   label: 'Procurement Officer' },
  { value: 'HR_MANAGER',            label: 'HR Manager' },
  { value: 'FINANCE_DIRECTOR',      label: 'Finance Director' },
  { value: 'MARKETING_OFFICER',     label: 'Marketing Officer' },
  { value: 'CORPORATION_SECRETARY', label: 'Corporation Secretary' },
]

const TABS = [
  { key: 'preview', label: 'Preview', icon: Eye },
  { key: 'annotations', label: 'Annotations', icon: MessageSquare },
  { key: 'signatures', label: 'Signatures', icon: History },
]

function getFileKind(document) {
  const mimeType = document?.mimeType || ''
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType) return 'other'

  // Fall back to the original filename's extension for older rows with no
  // mimeType recorded (pre-migration documents).
  const ext = (document?.filePath || '').split('?')[0].split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'pdf'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image'
  return 'other'
}

/**
 * Unified document viewer — Preview / Annotations / Signatures tabs.
 * Save/submit/delete are delegated to the parent via callbacks; annotations
 * and circulation/signature data are fetched directly here since they're
 * viewer-local, not part of the parent's document list state.
 */
export default function DocumentViewerModal({
  document,
  isOpen,
  onClose,
  currentUserId,
  currentUserRole,
  onSave,
  onSubmit,
}) {
  const [tab, setTab] = useState('preview')

  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [toRole, setToRole] = useState(SUBMIT_ROLES[0].value)
  const [instruction, setInstruction] = useState('')
  const [form, setForm] = useState({ title: '', description: '', category: 'OTHER' })
  const [saveError, setSaveError] = useState('')

  const [annotations, setAnnotations] = useState([])
  const [annotationsLoading, setAnnotationsLoading] = useState(false)
  const [newAnnotationText, setNewAnnotationText] = useState('')
  const [newAnnotationType, setNewAnnotationType] = useState('COMMENT')
  const [postingAnnotation, setPostingAnnotation] = useState(false)

  const [circulation, setCirculation] = useState(undefined) // undefined = not fetched yet, null = none
  const [circulationLoading, setCirculationLoading] = useState(false)
  const [signingOpen, setSigningOpen] = useState(false)

  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // Fullscreen for the preview box only — requestFullscreen on this
  // specific container, not the whole modal, so "full screen" means the
  // document itself, edge to edge, with everything else (header, tabs,
  // footer) out of the way.
  const previewBoxRef = useRef(null)
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false)

  useEffect(() => {
    const handleFsChange = () => setIsPreviewFullscreen(document.fullscreenElement === previewBoxRef.current)
    window.document.addEventListener('fullscreenchange', handleFsChange)
    return () => window.document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  const togglePreviewFullscreen = () => {
    if (window.document.fullscreenElement) {
      window.document.exitFullscreen()
    } else {
      previewBoxRef.current?.requestFullscreen()
    }
  }

  const [showForwardForm, setShowForwardForm] = useState(false)
  const [forwardToRole, setForwardToRole] = useState(SUBMIT_ROLES[0].value)
  const [forwardInstruction, setForwardInstruction] = useState('')
  const [forwarding, setForwarding] = useState(false)
  const { addStep } = useCirculation()

  useEffect(() => {
    if (document) {
      setForm({
        title: document.title || '',
        description: document.description || '',
        category: document.category || 'OTHER',
      })
      setEditing(false)
      setShowSubmitForm(false)
      setSaveError('')
      setTab('preview')
      setAnnotations([])
      setCirculation(undefined)
    }
  }, [document])

  // Files are served from our own auth-gated API, not a public URL, so we
  // fetch as a blob and render via an object URL — revoked whenever the
  // document changes or the modal closes, to avoid leaking them.
  useEffect(() => {
    if (!document || !isOpen) return
    let cancelled = false
    let objectUrl = null
    setPreviewLoading(true)
    api.getBlob(`/documents/${document.id}/file`)
      .then((url) => {
        if (cancelled) { URL.revokeObjectURL(url); return }
        objectUrl = url
        setPreviewUrl(url)
      })
      .catch(() => { if (!cancelled) setPreviewUrl(null) })
      .finally(() => { if (!cancelled) setPreviewLoading(false) })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [document, isOpen])

  const fetchAnnotations = useCallback(async () => {
    if (!document) return
    setAnnotationsLoading(true)
    try {
      const res = await api.get(`/documents/${document.id}/annotations`)
      setAnnotations(res.data || [])
    } catch {
      setAnnotations([])
    } finally {
      setAnnotationsLoading(false)
    }
  }, [document])

  const fetchCirculation = useCallback(async () => {
    if (!document) return
    setCirculationLoading(true)
    try {
      const res = await api.get(`/documents/${document.id}/circulation`)
      const data = res.data || null
      setCirculation(data)

      // The user is genuinely viewing this circulation's current state right
      // now (that's what opening this modal means) — mark its latest step
      // read so the notification bell stops counting it, whether it landed
      // on them (awaiting action) or they're just checking on something they
      // forwarded earlier.
      const latestStep = data?.steps?.[data.steps.length - 1]
      if (latestStep) {
        api.post(`/notifications/CIRCULATION_STEP/${latestStep.id}/read`, {})
          .then(() => notifyNotificationsChanged())
          .catch(() => {})
      }
    } catch {
      setCirculation(null)
    } finally {
      setCirculationLoading(false)
    }
  }, [document])

  useEffect(() => {
    if (!document) return
    if (tab === 'annotations' && annotations.length === 0) fetchAnnotations()
  }, [tab, document, annotations.length, fetchAnnotations])

  // Circulation is fetched eagerly (not gated on the Signatures tab) since
  // the footer's Send/Circulate button needs to know the current holder
  // regardless of which tab is open.
  useEffect(() => {
    if (!document || !isOpen) return
    fetchCirculation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document, isOpen])

  if (!document) return null

  const isOwner = currentUserId != null && document.uploadedBy === currentUserId
  const isPrivate = document.status === 'PRIVATE'
  const canEdit = isOwner && isPrivate && document.isEditable !== false
  const fileKind = getFileKind(document)
  // The extra !latestStep?.signature guard matters for the FINAL_DECISION-
  // to-self case: signing a step can leave currentHolderRole equal to the
  // signer's own role (closing the loop), which would otherwise leave the
  // sign button showing for a step that's already been signed.
  const latestStep = circulation?.steps?.[circulation.steps.length - 1]
  const canSign = circulation && circulation.status === 'IN_CIRCULATION' && circulation.currentHolderRole === currentUserRole && !latestStep?.signature

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const url = previewUrl || await api.getBlob(`/documents/${document.id}/file`)
      const link = window.document.createElement('a')
      link.href = url
      link.download = document.filePath || document.title
      link.click()
      if (!previewUrl) URL.revokeObjectURL(url)
    } catch {
      // no-op — download failing silently degrades to nothing happening,
      // consistent with the rest of this component's error handling
    } finally {
      setDownloading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    try {
      await onSave(document.id, form)
      setEditing(false)
    } catch (err) {
      setSaveError(err.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitDocument = async () => {
    setSubmitting(true)
    setSaveError('')
    try {
      await onSubmit(document.id, toRole, instruction)
      setShowSubmitForm(false)
    } catch (err) {
      setSaveError(err.message || 'Failed to submit document')
    } finally {
      setSubmitting(false)
    }
  }

  // Forwards a document that's already in circulation to another role —
  // reuses useCirculation's addStep (POST /api/circulation/:id/step)
  // directly, per the brief, rather than a new send mechanism. The initial
  // PRIVATE -> circulation handoff stays on the existing onSubmit path
  // (POST /api/documents/:id/submit), since that also bridges into the
  // registry and kicks off embedding ingestion — a plain
  // initiateCirculation() call here would silently skip both.
  const handleForward = async () => {
    setForwarding(true)
    setSaveError('')
    try {
      await addStep(circulation.id, {
        toRole: forwardToRole,
        instruction: forwardInstruction || `Forwarded "${document.title}" for review.`,
        stepType: 'FORWARD',
      })
      setShowForwardForm(false)
      setForwardInstruction('')
      await fetchCirculation()
    } catch (err) {
      setSaveError(err.message || 'Failed to forward document')
    } finally {
      setForwarding(false)
    }
  }

  const handlePostAnnotation = async (e) => {
    e.preventDefault()
    if (!newAnnotationText.trim()) return
    setPostingAnnotation(true)
    try {
      await api.post(`/documents/${document.id}/annotations`, {
        text: newAnnotationText.trim(),
        type: newAnnotationType,
      })
      setNewAnnotationText('')
      await fetchAnnotations()
    } catch {
      // surfaced inline below via annotations staying unchanged
    } finally {
      setPostingAnnotation(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm md:flex md:items-center md:justify-center md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {/* Below md: a full-screen takeover (fixed inset-0 + w-screen
              h-screen, no rounded corners) — a bounded dialog this large has
              nowhere good to sit on a small screen. At md+: near-fullscreen,
              w-[95vw] h-[95vh]. max-w-none is deliberate — a leftover
              max-w-* class overrides an explicit width utility since it caps
              growth regardless of what width is requested, which is exactly
              why this kept rendering smaller than intended. */}
          <motion.div
            className="card rounded-none md:rounded-2xl bg-[var(--bg-surface)] flex flex-col shadow-2xl shadow-black/50 fixed inset-0 w-screen h-screen md:static md:w-[95vw] md:h-[95vh] md:max-w-none"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="p-5 border-b flex items-start justify-between gap-4 flex-shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex-1 min-w-0">
                {editing ? (
                  <input
                    className="input-field font-heading font-bold text-lg w-full"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  />
                ) : (
                  <h2 className="font-heading font-bold text-lg truncate" style={{ color: 'var(--text-primary)' }}>
                    {document.title}
                  </h2>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge status={document.category} />
                  {isPrivate ? (
                    <Badge status="PRIVATE" label="Private Draft" />
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Lock size={10} /> Submitted — no longer editable
                    </span>
                  )}
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Uploaded by {document.uploader?.name || 'Unknown'}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Circulation status strip — persistently visible across all
                three tabs (not buried inside one), so it sits between the
                header and the tab bar rather than inside the tab body. */}
            <div className="px-5 py-2 flex-shrink-0 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <CirculationLiveTracker circulationId={circulation?.id} />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-5 pt-3 flex-shrink-0 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-t-lg transition-colors relative ${
                    tab === t.key ? 'text-uacc-gold' : ''
                  }`}
                  style={tab !== t.key ? { color: 'var(--text-muted)' } : undefined}
                >
                  <t.icon size={13} />
                  {t.label}
                  {tab === t.key && (
                    <motion.div layoutId="viewer-tab-underline" className="absolute left-0 right-0 -bottom-px h-0.5 bg-uacc-gold rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 min-h-0">
              {tab === 'preview' && (
                <div className="flex flex-col gap-5 flex-1 min-h-0">
                  {/* flex-1 + min-h-0 on this wrapper (not h-full/percentage
                      sizing) is what makes it actually get a real, definite
                      height from the flex layout — the modal above is a
                      fixed h-[95vh], not just a max-height, so that height
                      is real all the way down this chain. The iframe fills
                      it with plain w-full h-full: no max-width/aspect-ratio
                      constraint, so it renders the same way a PDF does in
                      its own browser tab — full-bleed, with the viewer's
                      own zoom/page controls, not letterboxed down to a
                      forced page-shaped box (that was the previous bug:
                      an aspect-[1/1.414] wrapper computed its width from
                      height/ratio, which is far narrower than this modal is
                      wide, so the PDF rendered small in the middle of a
                      mostly-empty container). */}
                  <div
                    ref={previewBoxRef}
                    className="relative rounded-xl overflow-hidden border bg-black/20 flex-1 min-h-[420px] flex flex-col"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    {previewUrl && (fileKind === 'pdf' || fileKind === 'image') && (
                      <button
                        onClick={togglePreviewFullscreen}
                        className="absolute top-2 right-2 z-10 p-2 rounded-lg backdrop-blur-sm hover:bg-black/60 transition-colors"
                        style={{ background: 'rgba(0,0,0,0.4)', color: '#fff' }}
                        title={isPreviewFullscreen ? 'Exit full screen' : 'Full screen'}
                      >
                        {isPreviewFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                      </button>
                    )}
                    {previewLoading ? (
                      <div className="flex-1 flex items-center justify-center py-16"><SkeletonLine height="h-8" /></div>
                    ) : !previewUrl ? (
                      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 text-center px-6">
                        <FileText size={40} style={{ color: 'var(--text-muted)' }} />
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          Couldn&apos;t load this file.
                        </p>
                      </div>
                    ) : fileKind === 'pdf' ? (
                      // #view=FitH tells the browser's built-in PDF viewer to
                      // open at "fit width" zoom instead of its 100%/actual-
                      // size default — at 100% zoom an A4 page is much
                      // narrower than this container, and the leftover space
                      // was being left-aligned rather than centered. Fitting
                      // the page to the available width removes the leftover
                      // space entirely instead of trying to center it.
                      <iframe src={`${previewUrl}#view=FitH`} title={document.title} className="w-full h-full flex-1" />
                    ) : fileKind === 'image' ? (
                      <div className="flex-1 min-h-0 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previewUrl} alt={document.title} className="max-w-full max-h-full object-contain" />
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 text-center px-6">
                        <FileText size={40} style={{ color: 'var(--text-muted)' }} />
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          This file type can&apos;t be previewed inline.
                        </p>
                        <Button variant="outline" icon={Download} onClick={handleDownload} loading={downloading}>
                          Download to view
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 flex-shrink-0">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        Description
                      </label>
                      {editing ? (
                        <textarea
                          className="input-field w-full"
                          rows={3}
                          value={form.description}
                          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                          placeholder="Add a description"
                        />
                      ) : (
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {document.description || 'No description provided.'}
                        </p>
                      )}
                    </div>

                    {editing && (
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                          Category
                        </label>
                        <select
                          className="input-field w-full"
                          value={form.category}
                          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {showSubmitForm && (
                      <div className="rounded-lg p-4 flex flex-col gap-3 border" style={{ borderColor: 'var(--border-gold)', background: 'rgba(201,151,58,0.05)' }}>
                        <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                          Submit for circulation
                        </p>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                            Send to
                          </label>
                          <select className="input-field w-full" value={toRole} onChange={(e) => setToRole(e.target.value)}>
                            {SUBMIT_ROLES.map((r) => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                            Instruction (optional)
                          </label>
                          <textarea
                            className="input-field w-full"
                            rows={2}
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                            placeholder="Please review this document."
                          />
                        </div>
                      </div>
                    )}

                    {saveError && <p className="text-xs text-uacc-red">{saveError}</p>}
                  </div>
                </div>
              )}

              {tab === 'annotations' && (
                <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto">
                  <form onSubmit={handlePostAnnotation} className="flex items-start gap-3 w-full">
                    <select
                      className="input-field w-40 shrink-0 py-2 px-2 text-xs"
                      value={newAnnotationType}
                      onChange={(e) => setNewAnnotationType(e.target.value)}
                    >
                      {ANNOTATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {/* Textarea, not a single-line input — real annotations
                        ("Sir, audit has no objection, forwarded for your
                        further consideration") are sentences. */}
                    <textarea
                      className="input-field flex-1 min-w-0 resize-none"
                      rows={2}
                      placeholder="Add a comment or note..."
                      value={newAnnotationText}
                      onChange={(e) => setNewAnnotationText(e.target.value)}
                    />
                    <Button type="submit" variant="primary" size="sm" loading={postingAnnotation} className="shrink-0">Add</Button>
                  </form>

                  {/* Unified trail — CirculationStep routing history and
                      Annotation side notes interleaved by timestamp, the
                      same way both sit on the same page of a physical
                      docket. SignaturesPanel (the other tab) stays the
                      separate, pure proof-of-authenticity view. */}
                  {(annotationsLoading || circulationLoading) ? (
                    <div className="flex flex-col gap-2">
                      <SkeletonLine height="h-16" />
                      <SkeletonLine height="h-16" />
                    </div>
                  ) : annotations.length === 0 && !(circulation?.steps?.length) ? (
                    <EmptyState icon={MessageSquare} title="No annotations yet" message="Comments, notes, and routing history for this document will appear here." />
                  ) : (
                    <AnnotationTrail circulation={circulation} annotations={annotations} />
                  )}
                </div>
              )}

              {tab === 'signatures' && (
                <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto">
                  {circulationLoading ? (
                    <div className="flex flex-col gap-2">
                      <SkeletonLine height="h-16" />
                      <SkeletonLine height="h-16" />
                    </div>
                  ) : !circulation ? (
                    <EmptyState icon={PenTool} title="No circulation yet" message="This document has not entered circulation yet." />
                  ) : (
                    <>
                      {canSign && (
                        <div className="flex justify-end">
                          <Button variant="primary" icon={PenTool} onClick={() => setSigningOpen(true)}>
                            Sign This Step
                          </Button>
                        </div>
                      )}
                      <SignaturesPanel circulation={circulation} />
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Forward dialog — shown regardless of active tab, unlike the
                submit-for-circulation panel which lives inside the Preview
                tab's body */}
            {showForwardForm && (
              <div className="px-5 pb-5 flex-shrink-0">
                <div className="rounded-lg p-4 flex flex-col gap-3 border" style={{ borderColor: 'var(--border-gold)', background: 'rgba(201,151,58,0.05)' }}>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Send / Circulate — currently with {currentUserRole?.replace(/_/g, ' ')}
                  </p>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      Forward to
                    </label>
                    <select className="input-field w-full" value={forwardToRole} onChange={(e) => setForwardToRole(e.target.value)}>
                      {SUBMIT_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      Instruction (optional)
                    </label>
                    <textarea
                      className="input-field w-full"
                      rows={2}
                      value={forwardInstruction}
                      onChange={(e) => setForwardInstruction(e.target.value)}
                      placeholder="Please review and action."
                    />
                  </div>
                  {saveError && <p className="text-xs text-uacc-red">{saveError}</p>}
                </div>
              </div>
            )}

            {/* Footer actions */}
            <div className="p-5 border-t flex items-center justify-end gap-3 flex-shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
              {!editing && !showSubmitForm && !showForwardForm && (
                <Button variant="outline" icon={Download} onClick={handleDownload} loading={downloading}>
                  Download
                </Button>
              )}
              {canEdit && !editing && !showSubmitForm && (
                <>
                  <Button variant="outline" icon={Pencil} onClick={() => setEditing(true)}>Edit</Button>
                  <Button variant="primary" icon={Send} onClick={() => setShowSubmitForm(true)}>Send / Circulate</Button>
                </>
              )}
              {editing && (
                <>
                  <Button variant="outline" onClick={() => { setEditing(false); setForm({ title: document.title, description: document.description || '', category: document.category }) }}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleSave} loading={saving}>Save Changes</Button>
                </>
              )}
              {showSubmitForm && (
                <>
                  <Button variant="outline" onClick={() => setShowSubmitForm(false)}>Cancel</Button>
                  <Button variant="primary" icon={Send} onClick={handleSubmitDocument} loading={submitting}>
                    Confirm Submit
                  </Button>
                </>
              )}
              {!canEdit && !editing && !showSubmitForm && canSign && !showForwardForm && (
                <Button variant="primary" icon={Send} onClick={() => setShowForwardForm(true)}>
                  Send / Circulate
                </Button>
              )}
              {showForwardForm && (
                <>
                  <Button variant="outline" onClick={() => setShowForwardForm(false)}>Cancel</Button>
                  <Button variant="primary" icon={Send} onClick={handleForward} loading={forwarding}>
                    Confirm Forward
                  </Button>
                </>
              )}
            </div>
          </motion.div>

          <SigningModal
            circulationId={circulation?.id}
            currentUserRole={currentUserRole}
            isOpen={signingOpen}
            onClose={() => setSigningOpen(false)}
            onSigned={() => fetchCirculation()}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
