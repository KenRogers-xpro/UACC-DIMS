import { Loader2 } from 'lucide-react'

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  icon: Icon,
}) {
  const base = `inline-flex items-center justify-center gap-2 font-heading
                font-bold uppercase tracking-wider rounded-lg transition-all
                duration-200 cursor-pointer disabled:opacity-50
                disabled:cursor-not-allowed`

  const variants = {
    primary: 'btn-primary',
    ghost:   'btn-ghost',
    danger:  `bg-uacc-red/10 text-uacc-red border border-uacc-red/30
              hover:bg-uacc-red hover:text-white`,
    outline: `border text-[var(--text-secondary)] hover:bg-white/5`,
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-[10px]',
    md: 'px-5 py-2.5 text-[11px]',
    lg: 'px-7 py-3.5 text-xs',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      style={variant === 'outline' ? { borderColor: 'var(--border-default)' } : {}}
    >
      {loading
        ? <Loader2 size={14} className="animate-spin" />
        : Icon && <Icon size={14} />
      }
      {loading ? 'Loading...' : children}
    </button>
  )
}
