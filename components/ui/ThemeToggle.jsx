'use client'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle({ className = '' }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch — only render after mount
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`
        relative flex items-center gap-2 px-3 py-2 rounded-lg
        border transition-all duration-300 cursor-pointer
        ${isDark
          ? 'bg-white/5 border-white/10 hover:border-uacc-gold/40 hover:bg-white/10'
          : 'bg-black/5 border-black/10 hover:border-uacc-gold/40 hover:bg-black/8'
        }
        ${className}
      `}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Track */}
      <div className={`
        relative w-9 h-5 rounded-full transition-colors duration-300
        ${isDark ? 'bg-uacc-gold/30' : 'bg-slate-200'}
      `}>
        {/* Thumb */}
        <div className={`
          absolute top-0.5 w-4 h-4 rounded-full shadow-sm
          transition-all duration-300
          ${isDark
            ? 'left-[18px] bg-uacc-gold'
            : 'left-0.5 bg-white border border-slate-300'
          }
        `} />
      </div>
      {/* Icon */}
      {isDark
        ? <Moon size={14} className="text-uacc-gold" />
        : <Sun size={14} className="text-amber-500" />
      }
    </button>
  )
}
