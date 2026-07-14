'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Megaphone, Plus, X, Pin, Trash2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useAnnouncements } from '@/lib/useAnnouncements'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/SkeletonLoader'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function AnnouncementsPage() {
  const { user } = useAuth()
  const { announcements, loading, createAnnouncement, deleteAnnouncement } = useAnnouncements()

  const [composeOpen, setComposeOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [pinned, setPinned] = useState(false)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  const handlePost = async (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required')
      return
    }
    setPosting(true)
    setError('')
    try {
      await createAnnouncement(title.trim(), content.trim(), pinned)
      setTitle('')
      setContent('')
      setPinned(false)
      setComposeOpen(false)
    } catch (err) {
      setError(err.message || 'Failed to post announcement')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      <PageHeader title="Announcements" subtitle="Company-wide updates for everyone at UACC">
        <Button variant="primary" icon={Plus} onClick={() => setComposeOpen(true)}>New Announcement</Button>
      </PageHeader>

      {loading && announcements.length === 0 ? (
        <div className="flex flex-col gap-4">
          <SkeletonCard /><SkeletonCard />
        </div>
      ) : announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements yet" message="Post the first one for the company to see." />
      ) : (
        <div className="flex flex-col gap-4">
          {announcements.map((a) => {
            const canDelete = a.author?.id === user?.id || user?.role === 'GENERAL_MANAGER'
            return (
              <motion.div
                key={a.id}
                className="card rounded-xl p-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={a.pinned ? { borderColor: 'var(--border-gold)' } : undefined}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {a.pinned && <Pin size={14} className="text-uacc-gold" />}
                    <h3 className="font-heading font-bold text-base" style={{ color: 'var(--text-primary)' }}>{a.title}</h3>
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => deleteAnnouncement(a.id)}
                      className="p-1.5 rounded hover:bg-uacc-red/10 hover:text-uacc-red flex-shrink-0"
                      style={{ color: 'var(--text-muted)' }}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p className="text-sm mb-3 whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{a.content}</p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {a.author?.name} · {a.author?.role?.replace(/_/g, ' ')} · {formatDate(a.createdAt)}
                </p>
              </motion.div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {composeOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <motion.div
              className="card rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4"
              style={{ background: 'var(--bg-surface)' }}
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-bold text-lg" style={{ color: 'var(--text-primary)' }}>New Announcement</h2>
                <button onClick={() => setComposeOpen(false)} className="p-1 hover:bg-white/5 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handlePost} className="flex flex-col gap-3">
                <input
                  className="input-field w-full"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <textarea
                  className="input-field w-full"
                  rows={5}
                  placeholder="What's the announcement?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
                  Pin to top
                </label>

                {error && <p className="text-xs text-uacc-red">{error}</p>}

                <div className="flex justify-end gap-3 mt-1">
                  <Button variant="outline" type="button" onClick={() => setComposeOpen(false)}>Cancel</Button>
                  <Button variant="primary" type="submit" loading={posting}>Post</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
