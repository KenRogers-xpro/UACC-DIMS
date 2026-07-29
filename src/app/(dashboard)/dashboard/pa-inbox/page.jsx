'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Inbox, ArrowRight, Send, RotateCcw, Eye } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useCirculation } from '@/lib/useCirculation'
import api from '@/lib/api'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import CirculationLiveTracker from '@/components/circulation/CirculationLiveTracker'
import DocumentViewerModal from '@/components/documents/DocumentViewerModal'

function roleLabel(role) {
  return role ? role.replace(/_/g, ' ') : 'Recipient'
}

// Inline note + confirm row, shared by both "Release" and "Return for
// Correction" — a note is optional for release, required for a return since
// the whole point is telling the true originator what to fix.
function GatewayItemCard({ item, onRelease, onReturn, onView, viewing, busy }) {
  const [openAction, setOpenAction] = useState(null) // 'release' | 'return' | null
  const [note, setNote] = useState('')

  const steps = item.steps || []
  const firstStep = steps[0]
  const latestStep = steps[steps.length - 1]
  const declaredRole = latestStep?.toRole
  const originatorRole = firstStep?.fromRole

  const toggle = (action) => {
    setOpenAction((current) => (current === action ? null : action))
    setNote('')
  }

  const confirm = async () => {
    if (openAction === 'release') await onRelease(item.id, note)
    else if (openAction === 'return') await onReturn(item.id, originatorRole, note)
    setOpenAction(null)
    setNote('')
  }

  return (
    <div className="flex flex-col gap-3 p-3 rounded-lg bg-[#0b1120]/80 border border-uacc-gold/20 hover:border-uacc-gold/50 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-1">Ref: {item.id}</span>
          <h4 className="text-sm font-semibold text-white">{item.title}</h4>
          <p className="text-[11px] text-white/60 mt-1">
            True originator: {item.originator?.name || 'Unknown'}
            {originatorRole ? ` (${roleLabel(originatorRole)})` : ''}
            {' · '}Declared destination: {declaredRole ? roleLabel(declaredRole) : 'Unknown'}
          </p>
          <div className="mt-2">
            <CirculationLiveTracker circulationId={item.id} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {item.sourceType === 'DOCUMENT' && (
            <Button size="sm" variant="outline" onClick={() => onView(item)} loading={viewing} className="flex items-center gap-2">
              View <Eye size={14} />
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => toggle('release')}
            className="flex items-center gap-2 bg-uacc-gold/10 hover:bg-uacc-gold/20 text-uacc-gold border border-uacc-gold/30"
          >
            Release to {roleLabel(declaredRole)} <Send size={14} />
          </Button>
          <Button size="sm" variant="outline" onClick={() => toggle('return')} className="flex items-center gap-2">
            Return for Correction <RotateCcw size={14} />
          </Button>
        </div>
      </div>

      {openAction && (
        <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-white/5">
          <input
            type="text"
            className="input-field flex-1 text-xs"
            placeholder={
              openAction === 'release'
                ? 'Optional note (e.g. "Reviewed, forwarded")'
                : 'Reason for returning (required)'
            }
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button
            size="sm"
            disabled={busy || (openAction === 'return' && !note.trim())}
            loading={busy}
            onClick={confirm}
          >
            Confirm {openAction === 'release' ? 'Release' : 'Return'}
          </Button>
        </div>
      )}
    </div>
  )
}

function GatewaySection({ icon: Icon, title, items, emptyMessage, onRelease, onReturn, onView, viewingId, busyId }) {
  return (
    <div className="card rounded-xl p-5">
      <h3
        className="font-heading font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2"
        style={{ color: 'var(--text-primary)' }}
      >
        <Icon size={16} className="text-uacc-gold" /> {title}
        <span className="bg-uacc-gold text-[#0b1120] text-[10px] px-2 py-0.5 rounded-full">{items.length}</span>
      </h3>
      {items.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <GatewayItemCard
              key={item.id}
              item={item}
              onRelease={onRelease}
              onReturn={onReturn}
              onView={onView}
              viewing={viewingId === item.id}
              busy={busyId === item.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function PAInboxPage() {
  const { user } = useAuth()
  const { paGateway, fetchPaGateway, releaseCirculation, addStep } = useCirculation()
  const [busyId, setBusyId] = useState(null)
  const [toastMessage, setToastMessage] = useState('')
  const [previewDoc, setPreviewDoc] = useState(null)
  const [viewingId, setViewingId] = useState(null)

  useEffect(() => {
    if (user?.role === 'GM_PERSONAL_ASSISTANT') fetchPaGateway()
  }, [user, fetchPaGateway])

  const handleRelease = async (id, note) => {
    setBusyId(id)
    setToastMessage('')
    try {
      await releaseCirculation(id, note)
      setToastMessage('Released to the declared recipient.')
      await fetchPaGateway()
    } catch (err) {
      setToastMessage(err.message || 'Failed to release')
    } finally {
      setBusyId(null)
    }
  }

  // Same pattern as the AI Agent page's "Open document" from an insight —
  // the card only has the circulation (sourceType/sourceId), so resolve the
  // actual Document via GET /documents/:id and hand that to the existing
  // viewer. no-op onSave/onSubmit below is the same convention that call
  // site uses; it suppresses this page's own edit/submit flow, though it
  // doesn't block the viewer's own internal actions (annotations, signing) —
  // those already aren't owner-gated, and for these gatekept items PA
  // genuinely is the current holder, so that's an existing capability
  // elsewhere, not a hole opened by this change.
  const openDocumentPreview = async (item) => {
    if (item.sourceType !== 'DOCUMENT') return
    setViewingId(item.id)
    try {
      const res = await api.get(`/documents/${item.sourceId}`)
      if (res.success) setPreviewDoc(res.data)
    } catch {
      // fail quietly — nothing actionable to show if this doesn't resolve
    } finally {
      setViewingId(null)
    }
  }

  const handleReturn = async (id, originatorRole, note) => {
    if (!originatorRole) {
      setToastMessage('Could not determine the true originator for this item.')
      return
    }
    setBusyId(id)
    setToastMessage('')
    try {
      await addStep(id, {
        toRole: originatorRole,
        instruction: note,
        stepType: 'RETURNED_FOR_CORRECTION',
      })
      setToastMessage('Returned for correction.')
      await fetchPaGateway()
    } catch (err) {
      setToastMessage(err.message || 'Failed to return for correction')
    } finally {
      setBusyId(null)
    }
  }

  if (user && user.role !== 'GM_PERSONAL_ASSISTANT') {
    return (
      <div className="flex flex-col gap-6 w-full animate-fadeIn">
        <PageHeader title="GM Inbox" subtitle="This section is only available to the GM's Personal Assistant" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      <PageHeader title="GM Inbox" subtitle="Items gatekept through you, in either direction">
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </PageHeader>

      {toastMessage && (
        <div className="card rounded-xl px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
          {toastMessage}
        </div>
      )}

      <GatewaySection
        icon={Inbox}
        title="Going to GM"
        items={paGateway.toGM}
        emptyMessage="Nothing waiting to reach the GM right now."
        onRelease={handleRelease}
        onReturn={handleReturn}
        onView={openDocumentPreview}
        viewingId={viewingId}
        busyId={busyId}
      />

      <GatewaySection
        icon={ArrowRight}
        title="From GM"
        items={paGateway.fromGM}
        emptyMessage="Nothing outgoing from the GM waiting on you right now."
        onRelease={handleRelease}
        onReturn={handleReturn}
        onView={openDocumentPreview}
        viewingId={viewingId}
        busyId={busyId}
      />

      <DocumentViewerModal
        document={previewDoc}
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        currentUserId={user?.id}
        currentUserRole={user?.role}
        onSave={async () => {}}
        onSubmit={async () => {}}
      />
    </div>
  )
}
