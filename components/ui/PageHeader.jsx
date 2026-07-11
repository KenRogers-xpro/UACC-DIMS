export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start
                    justify-between gap-4 pb-5 mb-2"
         style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading font-bold text-xl md:text-2xl tracking-tight"
            style={{ color: 'var(--text-primary)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  )
}
