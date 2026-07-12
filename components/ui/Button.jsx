'use client';

import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
                font-bold uppercase tracking-wider rounded-lg cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed`

  const variants = {
    primary: 'btn-primary',
    ghost:   'btn-ghost',
    danger: `bg-uacc-red/8 text-uacc-red border border-uacc-red/25
             hover:bg-uacc-red hover:text-white hover:border-uacc-red`,
    outline: `border hover:bg-white/5`,
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-[9px]',
    md: 'px-4 py-2 text-[10px]',
    lg: 'px-6 py-3 text-[11px]',
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      style={
        variant === 'outline'
          ? { borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }
          : undefined
      }
      whileHover={disabled || loading ? {} : { y: -2 }}
      whileTap={disabled || loading ? {} : { scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {loading
        ? <Loader2 size={13} className="animate-spin" />
        : Icon && <Icon size={13} />
      }
      {loading ? 'Loading...' : children}
    </motion.button>
  )
}
