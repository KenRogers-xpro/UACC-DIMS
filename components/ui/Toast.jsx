'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export function Toast({ 
  message, 
  type = 'info',
  onDismiss,
  autoClose = 5000 
}) {
  const icons = {
    success: { Icon: CheckCircle, bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)', color: '#3dda7a' },
    error: { Icon: AlertCircle, bg: 'rgba(204,34,0,0.1)', border: 'rgba(204,34,0,0.25)', color: '#f07060' },
    info: { Icon: Info, bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.25)', color: '#a5b4fc' },
  };

  const { Icon, bg, border, color } = icons[type] || icons.info;

  // Auto-dismiss after specified time
  React.useEffect(() => {
    if (autoClose && onDismiss) {
      const timer = setTimeout(onDismiss, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onDismiss]);

  return (
    <motion.div
      className="flex items-start gap-3 rounded-lg px-4 py-3 border backdrop-blur-sm"
      style={{ backgroundColor: bg, borderColor: border }}
      initial={{ opacity: 0, x: 100, y: -20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 100, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Icon size={16} style={{ color, flexShrink: 0, marginTop: '2px' }} />
      <p className="text-sm flex-1" style={{ color: 'var(--text-secondary)' }}>
        {message}
      </p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 hover:opacity-70 transition-opacity flex-shrink-0"
          aria-label="Dismiss notification"
        >
          <X size={14} style={{ color: 'var(--text-muted)' }} />
        </button>
      )}
    </motion.div>
  );
}

export function ToastContainer({ toasts = [] }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onDismiss={toast.onDismiss}
            autoClose={toast.autoClose}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
