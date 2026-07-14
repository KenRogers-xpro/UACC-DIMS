'use client'

import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'
import { useOnlineStatus } from '@/lib/useOnlineStatus'

/**
 * "The system is alive" signal — count of currently-online users,
 * company-wide. One shared component embedded on every role's dashboard;
 * don't fork it per module.
 */
export default function SystemActivityWidget() {
  const { onlineCount } = useOnlineStatus()

  return (
    <motion.div
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl w-fit"
      style={{
        background: 'rgba(34,197,94,0.06)',
        border: '1px solid rgba(34,197,94,0.18)',
      }}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
      </span>
      <Activity size={14} className="text-emerald-400" />
      <span className="text-xs font-heading font-semibold" style={{ color: 'var(--text-secondary)' }}>
        <span className="font-bold text-emerald-400">{onlineCount}</span> {onlineCount === 1 ? 'person' : 'people'} online now
      </span>
    </motion.div>
  )
}
