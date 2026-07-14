'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon,
                                   accentColor = 'gold', trend, index = 0 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    
    let start = 0;
    const increment = value / 60; // Count up over ~60 frames at 60fps
    const interval = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(interval);
  }, [isInView, value]);
  const colors = {
    gold:  { bg: 'rgba(201,151,58,0.08)',   text: '#C9973A',  border: 'rgba(201,151,58,0.18)',  bar: '#C9973A' },
    red:   { bg: 'rgba(204,34,0,0.08)',     text: '#CC2200',  border: 'rgba(204,34,0,0.18)',    bar: '#CC2200' },
    green: { bg: 'rgba(34,197,94,0.08)',    text: '#3dda7a',  border: 'rgba(34,197,94,0.18)',   bar: '#3dda7a' },
    blue:  { bg: 'rgba(99,102,241,0.08)',   text: '#a5b4fc',  border: 'rgba(99,102,241,0.18)',  bar: '#a5b4fc' },
  }
  const c = colors[accentColor] || colors.gold

  return (
    <motion.div
      ref={ref}
      className="card rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden"
      style={{ borderLeft: `3px solid ${c.bar}` }}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: "easeOut" }}
      whileHover={{ y: -2, boxShadow: 'var(--shadow-card-hover)' }}
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
        {displayValue}
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
    </motion.div>
  )
}
