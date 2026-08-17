'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertTriangle } from 'lucide-react'
import Button from './Button'

// Portals to document.body, same pattern as DocumentViewerModal — mounted
// gate avoids an SSR/hydration mismatch (document.body doesn't exist yet
// during SSR), and portaling past every ancestor is what keeps this
// `position: fixed` overlay pinned to the real viewport instead of getting
// silently confined by an ancestor's transform (e.g. a page-transition
// wrapper), which is the exact bug this codebase has hit more than once.
export default function IdleWarningModal({ isOpen, secondsLeft, onStayLoggedIn }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 z-[100] backdrop-blur-sm flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="idle-warning-title"
            className="card w-full max-w-sm rounded-2xl p-6 shadow-2xl"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(204,34,0,0.10)', border: '1px solid rgba(204,34,0,0.22)' }}
              >
                <AlertTriangle size={24} strokeWidth={1.5} className="text-uacc-gold" />
              </div>
              <h2 id="idle-warning-title" className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Still there?
              </h2>
            </div>

            <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>
              You&apos;ve been inactive — you&apos;ll be logged out in{' '}
              <span className="font-bold text-uacc-gold tabular-nums">{secondsLeft}s</span>.
            </p>

            <Button variant="primary" className="w-full" onClick={onStayLoggedIn}>
              Stay logged in
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    window.document.body
  )
}
