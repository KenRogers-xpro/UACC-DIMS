export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      {Icon && (
        <div className="p-4 rounded-full"
             style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-gold)' }}>
          <Icon size={28} style={{ color: 'var(--text-muted)' }} />
        </div>
      )}
      <div className="text-center">
        <p className="font-heading font-bold text-base"
           style={{ color: 'var(--text-primary)' }}>
          {title}
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {message}
        </p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
