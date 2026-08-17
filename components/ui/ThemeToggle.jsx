'use client'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Sun01Icon, Moon01Icon } from '@hugeicons/core-free-icons'

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
      className={`relative flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer ${className}`}
      style={{
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(10,22,40,0.05)',
        borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(10,22,40,0.14)',
      }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Track */}
      <div
        className="relative w-9 h-5 rounded-full"
        style={{ background: isDark ? 'rgba(201,151,58,0.30)' : 'rgba(10,22,40,0.15)' }}
      >
        {/* Thumb */}
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full shadow-sm"
          style={{
            left: isDark ? '18px' : '2px',
            background: isDark ? '#C9973A' : '#FAFBFD',
            border: isDark ? 'none' : '1px solid rgba(10,22,40,0.20)',
            transition: 'left 0.25s ease',
          }}
        />
      </div>
      {/* Icon */}
      {isDark
        ? <HugeiconsIcon icon={Moon01Icon} size={14} color="currentColor" strokeWidth={1.5} className="text-uacc-gold" />
        : <HugeiconsIcon icon={Sun01Icon} size={14} color="#C9973A" strokeWidth={1.5} />
      }
    </button>
  )
}
