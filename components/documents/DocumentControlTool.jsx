'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, FileText, Plus, X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useDocuments } from '@/lib/useDocuments'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonLine } from '@/components/ui/SkeletonLoader'
import DocumentViewerModal from '@/components/documents/DocumentViewerModal'

const CATEGORIES = ['POLICY', 'REPORT', 'MEMO', 'CONTRACT', 'FORM', 'OTHER']

/**
 * Reusable "personal document staging" control — upload button, the
 * logged-in user's own documents (private drafts + whatever they've since
 * submitted), and the preview/edit modal. Embed once per module page with
 * different defaultCategory/defaultDepartment props; don't fork this file.
 */
export default function DocumentControlTool({
  title = 'My Documents',
  description = 'Upload and manage documents before submitting them for circulation',
  defaultCategory = 'OTHER',
  defaultDepartment,
}) {
  const { user } = useAuth()
  const {
    documents, loading, fetchDocuments,
    uploadDocument, updateDocument, submitDocument,
  } = useDocuments()

  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [form, setForm] = useState({ title: '', category: defaultCategory, description: '' })
  const [selectedFileName, setSelectedFileName] = useState('')
  const [previewDoc, setPreviewDoc] = useState(null)
  const fileInputRef = useRef(null)

  const department = defaultDepartment || user?.department

  const refresh = useCallback(() => {
    fetchDocuments({ department }).catch(() => {})
  }, [fetchDocuments, department])

  useEffect(() => {
    refresh()
  }, [refresh])

  const myDocuments = (documents || []).filter((d) => d.uploadedBy === user?.id)

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFileName(file.name)
      if (!form.title) {
        setForm((f) => ({ ...f, title: file.name.replace(/\.[^/.]+$/, '') }))
      }
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !fileInputRef.current?.files?.[0]) {
      setUploadError('Title and file are required.')
      return
    }
    setUploading(true)
    setUploadError('')
    try {
      const fd = new FormData()
      fd.append('title', form.title.trim())
      fd.append('category', form.category)
      fd.append('department', department)
      fd.append('description', form.description)
      fd.append('file', fileInputRef.current.files[0])

      const created = await uploadDocument(fd)

      setUploadOpen(false)
      setForm({ title: '', category: defaultCategory, description: '' })
      setSelectedFileName('')
      if (fileInputRef.current) fileInputRef.current.value = ''

      await refresh()
      setPreviewDoc(created)
    } catch (err) {
      setUploadError(err.message || 'Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (id, data) => {
    const updated = await updateDocument(id, data)
    await refresh()
    setPreviewDoc(updated)
  }

  const handleSubmitDoc = async (id, toRole, instruction) => {
    const result = await submitDocument(id, toRole, instruction)
    await refresh()
    setPreviewDoc(result?.document || null)
  }

  return (
    <div className="card rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-heading font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setUploadOpen(true)}>
          Upload
        </Button>
      </div>

      {loading && myDocuments.length === 0 ? (
        <div className="flex flex-col gap-2">
          <SkeletonLine height="h-10" />
          <SkeletonLine height="h-10" />
        </div>
      ) : myDocuments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          message="Upload a document to get started — it stays private to you until you submit it."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {myDocuments.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setPreviewDoc(doc)}
              className="flex items-center justify-between gap-3 p-3 rounded-lg border text-left hover:bg-white/5 transition-colors"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-uacc-gold/10 text-uacc-gold flex-shrink-0">
                  <FileText size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{doc.title}</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {new Date(doc.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge status={doc.category} />
                {doc.status === 'PRIVATE'
                  ? <Badge status="PRIVATE" label="Private" />
                  : <Badge status="APPROVED" label={doc.status} />}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* UPLOAD MODAL */}
      <AnimatePresence>
        {uploadOpen && (
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
                <h2 className="font-heading font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                  Upload Document
                </h2>
                <button onClick={() => setUploadOpen(false)} className="p-1 hover:bg-white/5 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUpload} className="flex flex-col gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Title
                  </label>
                  <input
                    className="input-field w-full"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Document title"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Category
                  </label>
                  <select
                    className="input-field w-full"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Description (optional)
                  </label>
                  <textarea
                    className="input-field w-full"
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed rounded-lg p-4 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors"
                  style={{ borderColor: 'var(--border-default)' }}
                >
                  <UploadCloud size={18} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {selectedFileName || 'Click to choose a file'}
                  </span>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
                </div>

                {uploadError && <p className="text-xs text-uacc-red">{uploadError}</p>}

                <div className="flex justify-end gap-3 mt-2">
                  <Button variant="outline" type="button" onClick={() => setUploadOpen(false)}>Cancel</Button>
                  <Button variant="primary" type="submit" loading={uploading}>Upload Document</Button>
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
        onSave={handleSave}
        onSubmit={handleSubmitDoc}
      />
    </div>
  )
}
