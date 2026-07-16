'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, MessageSquare, StickyNote, ListChecks, Flag, Paperclip } from 'lucide-react'
import Badge from '@/components/ui/Badge'

const STEP_ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

const ANNOTATION_ICONS = {
  COMMENT: MessageSquare,
  NOTE: StickyNote,
  ACTION: ListChecks,
  FLAG: Flag,
}

/**
 * The unified document trail — every mark on the document, routing step or
 * side note, threaded on one chronological line. This is the physical-docket
 * model: a CirculationStep ("forwarded to X, please review") and an
 * Annotation ("Sir, no objection") both just sit on the same page in the
 * order they were written, so they render together here rather than in
 * separate tabs. SignaturesPanel is the deliberately separate, pure
 * proof-of-authenticity view — this component carries no hash/PIN data.
 */
export default function AnnotationTrail({ circulation, annotations, attachments }) {
  const steps = circulation?.steps || []
  const notes = annotations || []
  const files = attachments || []

  const items = [
    ...steps.map((step) => ({
      kind: 'STEP',
      id: `step-${step.id}`,
      timestamp: step.signedAt || step.createdAt,
      step,
    })),
    ...notes.map((a) => ({
      kind: 'ANNOTATION',
      id: `ann-${a.id}`,
      timestamp: a.createdAt,
      annotation: a,
    })),
    ...files.map((att) => ({
      kind: 'ATTACHMENT',
      id: `att-${att.id}`,
      timestamp: att.createdAt,
      attachment: att,
    })),
  ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

  if (items.length === 0) return null

  return (
    <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
      {items.map((item, idx) => {
        if (item.kind === 'STEP') {
          const step = item.step
          const isDecision = !!step.decision
          const stepRoman = STEP_ROMAN[step.stepNumber - 1] || step.stepNumber

          return (
            <motion.div
              key={item.id}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: idx * 0.08, ease: 'easeOut' }}
            >
              {/* Step Number Badge */}
              <div className="flex items-center justify-center w-6 h-6 rounded-full border border-uacc-gold/50 bg-[#0b1120] text-uacc-gold text-xs font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_10px_rgba(201,151,58,0.2)] z-10 absolute left-[-28px] top-4 md:static">
                {stepRoman}
              </div>

              {/* Card Content */}
              <div className="w-full md:w-[calc(50%-2rem)] card p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors shadow-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xs font-bold text-(--text-muted) uppercase tracking-wider flex items-center gap-2">
                    <span className="text-(--text-secondary)">{step.fromRole.replace(/_/g, ' ')}</span>
                    <ArrowRight size={12} className="text-(--text-faint)" />
                    <span className="text-uacc-gold">{step.toRole.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="text-[10px] text-(--text-faint) whitespace-nowrap">
                    {new Date(step.signedAt).toLocaleString()}
                  </span>
                </div>

                <p className="text-sm text-(--text-secondary) mt-2 italic border-l-2 border-white/10 pl-3">
                  "{step.instruction}"
                </p>

                {isDecision && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      step.decision === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                      step.decision === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                      'bg-white/10 text-(--text-muted)'
                    }`}>
                      {step.decision}
                    </span>
                    {step.amount && (
                      <span className="text-xs font-semibold text-uacc-gold">
                        UGX {Number(step.amount).toLocaleString()}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-3">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                    <CheckCircle2 size={12} className="text-uacc-gold/70" />
                  </div>
                  <span className="text-[10px] text-(--text-muted) font-mono tracking-tighter">
                    Signed: {step.fromUser?.name || step.fromUserId}
                  </span>
                </div>
              </div>
            </motion.div>
          )
        }

        if (item.kind === 'ATTACHMENT') {
          const att = item.attachment
          return (
            <motion.div
              key={item.id}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: idx * 0.08, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-full border border-uacc-gold/30 bg-[#0b1120] text-uacc-gold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 absolute left-[-28px] top-4 md:static">
                <Paperclip size={12} />
              </div>

              <div className="w-full md:w-[calc(50%-2rem)] card p-4 rounded-xl border border-uacc-gold/10 bg-uacc-gold/[0.03] hover:bg-uacc-gold/[0.05] transition-colors shadow-lg">
                <div className="flex justify-between items-start mb-1.5">
                  <span className="text-xs font-semibold text-uacc-gold">
                    Attached: {att.document?.title}
                  </span>
                  <span className="text-[10px] text-(--text-faint) whitespace-nowrap">
                    {new Date(att.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                </div>
                {att.note && <p className="text-sm text-(--text-secondary) italic">"{att.note}"</p>}
                <p className="text-[10px] text-(--text-faint) mt-1">by {att.attachedBy?.name || 'Unknown'}</p>
              </div>
            </motion.div>
          )
        }

        // ANNOTATION
        const a = item.annotation
        const Icon = ANNOTATION_ICONS[a.type] || MessageSquare

        return (
          <motion.div
            key={item.id}
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: idx * 0.08, ease: 'easeOut' }}
          >
            {/* Node — an icon badge rather than a roman numeral, so a glance
                down the trail tells routing steps and side notes apart. */}
            <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white/10 bg-[#0b1120] text-(--text-muted) shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 absolute left-[-28px] top-4 md:static">
              <Icon size={12} />
            </div>

            <div className="w-full md:w-[calc(50%-2rem)] card p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors shadow-lg">
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-(--text-primary)">{a.author?.name}</span>
                  <Badge status={a.type} label={a.type} />
                </div>
                <span className="text-[10px] text-(--text-faint) whitespace-nowrap">
                  {new Date(a.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-(--text-secondary)">{a.text}</p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
