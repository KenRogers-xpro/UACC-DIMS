import React, { useEffect } from 'react'
import { FileText, ArrowRight } from 'lucide-react'
import { useCirculation } from '@/lib/useCirculation'
import Button from '@/components/ui/Button'

export default function DocumentsAwaitingAction() {
  const { inbox, loading, fetchInbox } = useCirculation()

  useEffect(() => {
    fetchInbox()
  }, [fetchInbox])

  if (loading && inbox.length === 0) return null
  if (inbox.length === 0) return null

  return (
    <div className="card rounded-xl p-5 border border-uacc-gold/30 bg-uacc-gold/5 shadow-[0_0_15px_rgba(201,151,58,0.05)] mb-6 animate-in slide-in-from-top-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-sm text-uacc-gold flex items-center gap-2">
          <FileText size={16} />
          Documents Awaiting My Action
          <span className="bg-uacc-gold text-[#0b1120] text-[10px] px-2 py-0.5 rounded-full shadow-sm">
            {inbox.length}
          </span>
        </h3>
      </div>
      
      <div className="space-y-3">
        {inbox.map((doc) => (
          <div key={doc.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg bg-[#0b1120]/80 border border-uacc-gold/20 gap-4 hover:border-uacc-gold/50 transition-colors">
            <div>
              <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-1">
                Ref: {doc.id}
              </span>
              <h4 className="text-sm font-semibold text-white">{doc.title}</h4>
              <p className="text-[11px] text-white/60 mt-1">
                From: {doc.originator?.name || 'Unknown'} · Status: {doc.status}
              </p>
            </div>
            <Button size="sm" className="shrink-0 flex items-center gap-2 bg-uacc-gold/10 hover:bg-uacc-gold/20 text-uacc-gold border border-uacc-gold/30">
              Take Action <ArrowRight size={14} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
