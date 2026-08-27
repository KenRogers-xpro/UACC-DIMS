'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Folder, X } from 'lucide-react'
import api from '@/lib/api'

// Extracted from the inline "archive picker" that used to live only in
// records/page.jsx (bulk-ingest's "File" action) — same search-a-file
// pattern, same immediate-attach-on-pick behavior (PUT
// /records/documents/:docId/attach-to-file), now reusable from anywhere a
// document needs filing into a dossier (see documents/page.jsx's Archive
// tab). Self-contained: fetches its own active-files list rather than
// assuming the host page already has one loaded, and surfaces its own
// errors inline rather than depending on a host-specific toast system.
//
// onCreateNew is optional and deliberately not part of this component's own
// flow — records/page.jsx still owns the actual "New Records File" form (a
// much larger, page-specific modal) and just wants to know when the user
// asked to create one instead of picking; passing this prop renders the
// "+ New" button, omitting it (as documents/page.jsx does) hides it.
export default function FileIntoDossierModal({ documentId, documentTitle, onClose, onFiled, onCreateNew }) {
  const [files, setFiles] = useState([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filing, setFiling] = useState(false)
  const [error, setError] = useState('')

  const fetchFiles = useCallback(async () => {
    setFilesLoading(true)
    try {
      const res = await api.get('/records/files')
      setFiles(res.data || [])
    } catch (err) {
      console.error('Failed to fetch records files', err)
    } finally {
      setFilesLoading(false)
    }
  }, [])

  useEffect(() => { fetchFiles() }, [fetchFiles])

  const handleAttach = async (fileId) => {
    if (!documentId || filing) return
    setFiling(true)
    setError('')
    try {
      const res = await api.put(`/records/documents/${documentId}/attach-to-file`, { recordsFileId: fileId })
      if (!res.success) throw new Error(res.message || 'Failed to file document')
      onFiled?.(fileId)
    } catch (err) {
      setError(err.message || 'Failed to file document')
    } finally {
      setFiling(false)
    }
  }

  const allActiveFiles = files.filter((f) => f.status === 'ACTIVE')
  const activeFiles = allActiveFiles.filter((f) =>
    !search.trim() ||
    f.fileNumber.toLowerCase().includes(search.toLowerCase()) ||
    f.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
      >
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => { if (!filing) onClose?.() }}
        />
        <motion.div
          className="relative w-full max-w-md bg-[#0b1120] rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[70vh]"
          initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.22 }}
        >
          <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white">File into dossier</h2>
              <p className="text-xs text-white/40 truncate">{documentTitle}</p>
            </div>
            <button
              onClick={() => onClose?.()}
              className="p-1.5 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-colors flex-shrink-0"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
          <div className="p-4 border-b border-white/10 flex gap-2">
            <div className="relative flex-1">
              <Search size={15} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search file number or title..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-uacc-gold/50"
              />
            </div>
            {onCreateNew && (
              <button
                type="button"
                onClick={onCreateNew}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-uacc-gold/30 bg-uacc-gold/10 text-uacc-gold hover:bg-uacc-gold/20 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                <Plus size={14} strokeWidth={1.5} /> New
              </button>
            )}
          </div>
          {error && (
            <p className="px-4 pt-3 text-xs text-uacc-red">{error}</p>
          )}
          <div className="flex-1 overflow-y-auto p-2">
            {filesLoading ? (
              <p className="text-xs text-white/40 text-center py-6">Loading files...</p>
            ) : (
              activeFiles.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  disabled={filing}
                  onClick={() => handleAttach(f.id)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2.5 disabled:opacity-50 cursor-pointer"
                >
                  <Folder size={15} strokeWidth={1.5} className="text-uacc-gold flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{f.fileNumber}</p>
                    <p className="text-xs text-white/40 truncate">{f.title}</p>
                  </div>
                </button>
              ))
            )}
            {!filesLoading && allActiveFiles.length > 0 && activeFiles.length === 0 && (
              <p className="text-xs text-white/40 text-center py-6">No files match &ldquo;{search}&rdquo;</p>
            )}
            {!filesLoading && allActiveFiles.length === 0 && (
              <p className="text-xs text-white/40 text-center py-6">No active files yet{onCreateNew ? ' — create one above.' : '.'}</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
