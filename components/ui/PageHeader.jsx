export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center
                    justify-between gap-4 mb-6">
      <div>
        <h1 className="font-heading font-bold text-xl md:text-2xl"
            style={{ color: 'var(--text-primary)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3 flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  )
}
