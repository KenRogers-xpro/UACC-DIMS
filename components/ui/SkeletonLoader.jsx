'use client';

import { motion } from 'framer-motion';

export function SkeletonCard({ className = '' }) {
  return (
    <motion.div
      className={`rounded-lg p-5 flex flex-col gap-3 relative overflow-hidden bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{
          x: ['100%', '-100%'],
        }}
        transition={{
          duration: 1.5,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
      />

      {/* Content placeholders */}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="h-3 w-24 bg-slate-600/50 rounded" />
        <div className="h-6 w-6 bg-slate-600/50 rounded" />
      </div>
      <div className="relative z-10 h-8 w-16 bg-slate-600/50 rounded" />
      <div className="relative z-10 flex items-center gap-2">
        <div className="h-4 w-12 bg-slate-600/50 rounded" />
        <div className="h-3 w-32 bg-slate-600/50 rounded" />
      </div>
    </motion.div>
  );
}

export function SkeletonLine({ width = 'w-full', height = 'h-4' }) {
  return (
    <motion.div
      className={`${width} ${height} rounded bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 relative overflow-hidden`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{
          x: ['100%', '-100%'],
        }}
        transition={{
          duration: 1.5,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
      />
    </motion.div>
  );
}

export function SkeletonParagraph({ lines = 3 }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine
          key={i}
          width={i === lines - 1 ? 'w-2/3' : 'w-full'}
          height="h-3"
        />
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 4, columns = 'md:grid-cols-2 lg:grid-cols-4' }) {
  return (
    <div className={`grid grid-cols-1 ${columns} gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
