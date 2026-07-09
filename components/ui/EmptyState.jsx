export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-5">
      {Icon && (
        <div className="p-4 rounded-xl"
             style={{
               background: 'var(--glass-bg)',
               border: '1px solid var(--border-gold)',
               boxShadow: 'var(--shadow-card)',
             }}>
          <Icon size={26} style={{ color: 'var(--text-muted)' }} />
        </div>
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
    </div>
  )
}
