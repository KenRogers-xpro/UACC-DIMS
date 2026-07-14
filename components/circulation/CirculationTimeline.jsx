import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import CirculationLiveTracker from '@/components/circulation/CirculationLiveTracker'

export default function CirculationTimeline({ circulation }) {
  if (!circulation || !circulation.steps || circulation.steps.length === 0) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="card p-3 rounded-xl border border-white/5 bg-white/[0.02]">
        <p className="text-[10px] font-bold text-(--text-muted) uppercase tracking-widest mb-2">Current Position</p>
        <CirculationLiveTracker circulationId={circulation.id} />
      </div>

      <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
      {circulation.steps.map((step, idx) => {
        const isDecision = !!step.decision
        const stepRoman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][step.stepNumber - 1] || step.stepNumber

        return (
          <motion.div
            key={step.id}
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: idx * 0.12, ease: "easeOut" }}
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
      })}
      </div>
    </div>
  )
}
