'use client';

import { motion } from 'framer-motion';

export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center py-14 gap-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {Icon && (
        <motion.div 
          className="p-4 rounded-xl"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--border-gold)',
            boxShadow: 'var(--shadow-card)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1, type: "spring", stiffness: 400, damping: 60 }}
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Icon size={26} style={{ color: 'var(--text-muted)' }} />
          </motion.div>
        </motion.div>
      )}
      <div className="text-center flex flex-col gap-1">
        <p className="font-heading font-bold text-sm"
           style={{ color: 'var(--text-primary)' }}>
          {title}
        </p>
        <p className="text-xs leading-relaxed max-w-xs mx-auto"
           style={{ color: 'var(--text-muted)' }}>
          {message}
        </p>
      </div>
      {action && <div className="mt-1">{action}</div>}
    </motion.div>
  )
}
