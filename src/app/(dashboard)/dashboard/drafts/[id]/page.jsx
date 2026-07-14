'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import { useDrafts } from '@/lib/useDrafts'
import api from '@/lib/api'
import { AlertCircle, CheckCircle, Save, Send } from 'lucide-react'

export default function DraftEditorPage() {
  const { id } = useParams()
  const router = useRouter()
  const { updateDraft, confirmReview, submitDraft } = useDrafts()
  
  const [draft, setDraft] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const isNew = id === 'new'

  useEffect(() => {
    if (isNew) {
      setLoading(false)
      return
    }
    
    // Fetch draft
    api.get(`/drafts/mine`).then(drafts => {
      // response might be { data: drafts } or just drafts depending on the api structure.
      // let's assume it's like others and returns just the array or res.data
      const draftList = drafts.data || drafts || []
      const found = draftList.find(d => d.id === id)
      if (found) {
        setDraft(found)
        setTitle(found.title)
        setContent(found.content)
      }
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [id, isNew])

  // Debounced save
  useEffect(() => {
    if (isNew || !draft) return
    if (title === draft.title && content === draft.content) return

    const timer = setTimeout(async () => {
      setSaving(true)
      try {
        const updated = await updateDraft(id, title, content)
        setDraft(updated.data || updated) // depends on api wrapper
      } catch (err) {
        console.error('Auto-save failed', err)
      } finally {
        setSaving(false)
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [title, content, id, isNew, updateDraft, draft])

  const handleCreate = async () => {
    setSaving(true)
    try {
      const res = await api.post('/drafts', { title, content })
      const newDraft = res.data || res
      router.push(`/dashboard/drafts/${newDraft.id}`)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmReview = async () => {
    if (isNew) return
    setSaving(true)
    try {
      const res = await confirmReview(id)
      setDraft(res.data || res)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (isNew) return
    if (draft.origin === 'AI_GENERATED' && !draft.reviewedAt) {
      alert("Please review the AI draft first.")
      return
    }
    setSaving(true)
    try {
      await submitDraft(id)
      router.push('/dashboard/drafts')
    } catch (err) {
      alert("Failed to submit: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-(--text-muted)">Loading...</div>

  const needsReview = draft?.origin === 'AI_GENERATED' && !draft?.reviewedAt
  const canSubmit = !isNew && (!needsReview)

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn pb-24">
      <PageHeader
        title={isNew ? "New Draft" : "Edit Draft"}
        subtitle="Compose and edit your document"
      >
        <div className="flex gap-2">
          <Link href="/dashboard/drafts">
            <Button variant="outline">Back</Button>
          </Link>
          {isNew ? (
            <Button variant="primary" onClick={handleCreate} disabled={saving || !title || !content}>
              {saving ? 'Saving...' : 'Create Draft'}
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit || saving}>
              <Send size={16} className="mr-2" />
              Submit to Circulation
            </Button>
          )}
        </div>
      </PageHeader>

      {!isNew && needsReview && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-amber-500">
            <AlertCircle size={20} />
            <div>
              <p className="text-sm font-medium">AI-Generated Draft Needs Review</p>
              <p className="text-xs opacity-80 mt-0.5">Please review the content and explicitly confirm before submitting. Any edits will also count as a review.</p>
            </div>
          </div>
          <Button variant="primary" onClick={handleConfirmReview} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-white border-none">
            <CheckCircle size={16} className="mr-2" />
            Confirm Review
          </Button>
        </div>
      )}

      <div className="card rounded-xl p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-(--text-primary)">Document Details</h3>
          {!isNew && (
            <div className="flex items-center gap-2 text-xs text-(--text-muted)">
              {saving ? <><Save size={12} className="animate-pulse" /> Saving...</> : 'Saved'}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-(--text-secondary)">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Document Title"
            className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-uacc-gold/50"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-(--text-secondary)">Content</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Start typing your document content here (Markdown supported)..."
            className="w-full h-[400px] bg-slate-900 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-uacc-gold/50 resize-y font-mono"
          />
        </div>
      </div>
    </div>
  )
}
