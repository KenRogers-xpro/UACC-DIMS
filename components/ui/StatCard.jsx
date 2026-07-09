export default function StatCard({ title, value, subtitle, icon: Icon,
                                   accentColor = 'gold', trend }) {
  const colors = {
    gold:  { bg: 'rgba(201,151,58,0.08)',   text: '#C9973A',  border: 'rgba(201,151,58,0.18)',  bar: '#C9973A' },
    red:   { bg: 'rgba(204,34,0,0.08)',     text: '#CC2200',  border: 'rgba(204,34,0,0.18)',    bar: '#CC2200' },
    green: { bg: 'rgba(34,197,94,0.08)',    text: '#3dda7a',  border: 'rgba(34,197,94,0.18)',   bar: '#3dda7a' },
    blue:  { bg: 'rgba(99,102,241,0.08)',   text: '#a5b4fc',  border: 'rgba(99,102,241,0.18)',  bar: '#a5b4fc' },
  }
  const c = colors[accentColor] || colors.gold

  return (
    <div
      className="card rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden"
      style={{ borderLeft: `3px solid ${c.bar}` }}
    >
      {/* Top row: icon + title */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-heading font-semibold uppercase tracking-[0.12em] leading-tight"
           style={{ color: 'var(--text-muted)' }}>
          {title}
        </p>
        {Icon && (
          <div className="p-2 rounded-lg flex-shrink-0"
               style={{ background: c.bg, border: `1px solid ${c.border}` }}>
            <Icon size={16} style={{ color: c.text }} />
          </div>
        )}
      </div>

      {/* Value */}
      <p className="font-heading font-bold text-3xl leading-none tracking-tight"
         style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>

      {/* Subtitle / Trend */}
      <div className="flex items-center gap-2">
        {trend && (
          <span
            className="text-[10px] font-semibold font-heading px-1.5 py-0.5 rounded"
            style={trend > 0
              ? { color: 'var(--badge-approved-text)', background: 'var(--badge-approved-bg)' }
              : { color: 'var(--badge-rejected-text)', background: 'var(--badge-rejected-bg)' }
            }
          >
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
        {subtitle && (
          <p className="text-[11px] leading-snug" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
