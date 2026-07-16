'use client';

import { motion, useInView } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronDown, ArrowRight } from 'lucide-react';
import StatusDot from './StatusDot';

/**
 * fetchItems (optional): async () => { items: [{id, primary, secondary, href, online?}], viewAllHref }
 * When provided, the card becomes clickable — expands inline to show the
 * top handful of records behind the number, lazily fetched on first
 * expand so cards nobody opens never cost a request. Cards without
 * fetchItems behave exactly as before (no interactivity, no regression).
 */
export default function StatCard({ title, value, subtitle, icon: Icon,
                                   accentColor = 'gold', trend, index = 0, fetchItems }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState(null);
  const [viewAllHref, setViewAllHref] = useState('#');
  const [itemsLoading, setItemsLoading] = useState(false);

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

  const handleToggle = async () => {
    if (!fetchItems) return
    const next = !expanded
    setExpanded(next)
    if (next && items === null) {
      setItemsLoading(true)
      try {
        const res = await fetchItems()
        setItems(res?.items || [])
        setViewAllHref(res?.viewAllHref || '#')
      } catch {
        setItems([])
      } finally {
        setItemsLoading(false)
      }
    }
  }

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
      <button
        type="button"
        onClick={handleToggle}
        disabled={!fetchItems}
        className={`flex flex-col gap-3 text-left w-full ${fetchItems ? 'cursor-pointer' : 'cursor-default'}`}
      >
        {/* Top row: icon + title */}
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-heading font-semibold uppercase tracking-[0.12em] leading-tight"
             style={{ color: 'var(--text-muted)' }}>
            {title}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {Icon && (
              <div className="p-2 rounded-lg"
                   style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                <Icon size={16} style={{ color: c.text }} />
              </div>
            )}
            {fetchItems && (
              <ChevronDown
                size={14}
                style={{ color: 'var(--text-faint)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
              />
            )}
          </div>
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
      </button>

      {/* Expanded drill-down — top handful of records behind the number */}
      {expanded && fetchItems && (
        <div className="flex flex-col gap-1 pt-2 mt-1 border-t" style={{ borderColor: 'var(--border-subtle)' }} onClick={(e) => e.stopPropagation()}>
          {itemsLoading ? (
            <p className="text-[11px] py-2" style={{ color: 'var(--text-faint)' }}>Loading...</p>
          ) : items && items.length > 0 ? (
            <>
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center gap-2 py-1.5 px-1.5 -mx-1.5 rounded-lg hover:bg-white/5 transition-colors min-w-0"
                >
                  {item.online !== undefined && <StatusDot online={item.online} size={6} className="flex-shrink-0" />}
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{item.primary}</span>
                    {item.secondary && (
                      <span className="block text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{item.secondary}</span>
                    )}
                  </span>
                </Link>
              ))}
              <Link
                href={viewAllHref}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider mt-1 pt-2 border-t"
                style={{ color: c.text, borderColor: 'var(--border-subtle)' }}
              >
                View all <ArrowRight size={11} />
              </Link>
            </>
          ) : (
            <p className="text-[11px] py-2" style={{ color: 'var(--text-faint)' }}>Nothing here right now.</p>
          )}
        </div>
      )}
    </motion.div>
  )
}
