export default function StatusDot({ online, size = 8, className = '' }) {
  return (
    <span
      className={`relative inline-flex flex-shrink-0 rounded-full ${className}`}
      style={{ width: size, height: size }}
      title={online ? 'Online' : 'Offline'}
    >
      {online && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      )}
      <span
        className="relative inline-flex rounded-full h-full w-full"
        style={{ background: online ? '#22c55e' : 'var(--text-faint)' }}
      />
    </span>
  )
}
