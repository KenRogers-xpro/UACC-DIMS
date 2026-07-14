'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import { useDrafts } from '@/lib/useDrafts'
import { FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react'

export default function DraftsPage() {
  const { drafts, loading, fetchMyDrafts } = useDrafts()

  useEffect(() => {
    fetchMyDrafts()
  }, [fetchMyDrafts])

  const renderBadge = (draft) => {
    if (draft.origin === 'AI_GENERATED' && !draft.reviewedAt) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <AlertCircle size={12} />
          AI-Generated — Needs Review
        </span>
      )
    }
    if (draft.origin === 'AI_GENERATED' && draft.reviewedAt && draft.status === 'DRAFT') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
          <CheckCircle size={12} />
          Reviewed — Ready to Submit
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white/10 text-white/70 border border-white/10">
        <Clock size={12} />
        Draft
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      <PageHeader
        title="My Drafts"
        subtitle="Manage your draft documents before submission"
      >
        <Link href="/dashboard/drafts/new">
          <Button variant="primary">New Draft</Button>
        </Link>
      </PageHeader>

      <div className="flex flex-col gap-4">
        {loading && <p className="text-white/50 text-sm">Loading drafts...</p>}
        {!loading && drafts.length === 0 && (
          <div className="card rounded-xl p-8 text-center border-dashed border-white/10">
            <FileText className="mx-auto h-8 w-8 text-white/20 mb-3" />
            <p className="text-sm text-white/60">No drafts found.</p>
            <p className="text-xs text-white/40 mt-1">Create a new draft or ask the AI Agent to draft one for you.</p>
          </div>
        )}
        {!loading && drafts.map(draft => (
          <Link key={draft.id} href={`/dashboard/drafts/${draft.id}`}>
            <div className="card rounded-xl p-5 hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
                  <FileText size={20} className="text-white/50 group-hover:text-white/80" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">{draft.title || 'Untitled Draft'}</h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-xs text-white/40">
                      Last updated {new Date(draft.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-center ml-14 sm:ml-0">
                {renderBadge(draft)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
