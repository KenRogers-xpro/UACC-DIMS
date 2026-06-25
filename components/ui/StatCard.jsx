export default function StatCard({ title, value, subtitle, icon: Icon,
                                   accentColor = 'gold', trend }) {
  const colors = {
    gold: { bg: 'rgba(201,151,58,0.10)', text: '#C9973A', border: 'rgba(201,151,58,0.20)' },
    red:  { bg: 'rgba(204,34,0,0.10)',   text: '#CC2200', border: 'rgba(204,34,0,0.20)' },
    green:{ bg: 'rgba(34,197,94,0.10)',  text: '#4ade80', border: 'rgba(34,197,94,0.20)' },
    blue: { bg: 'rgba(99,102,241,0.10)', text: '#a5b4fc', border: 'rgba(99,102,241,0.20)' },
  }
  const c = colors[accentColor] || colors.gold

  return (
    <div className="card rounded-xl p-5 flex items-start gap-4">
      {Icon && (
        <div className="p-3 rounded-lg flex-shrink-0"
             style={{ background: c.bg, border: `1px solid ${c.border}` }}>
          <Icon size={20} style={{ color: c.text }} />
        </div>
      )}
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-xs font-heading uppercase tracking-wider truncate"
           style={{ color: 'var(--text-muted)' }}>
          {title}
        </p>
        <p className="font-heading font-bold text-2xl leading-none"
           style={{ color: 'var(--text-primary)' }}>
          {value}
        </p>
        {subtitle && (
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
        {trend && (
          <p className={`text-[11px] font-semibold font-heading ${
            trend > 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% this month
          </p>
        )}
      </div>
    </div>
  )
}
