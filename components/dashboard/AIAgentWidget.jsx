'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { usePathname } from 'next/navigation'
import {
  Bot,
  User,
  Send,
  X,
  ChevronDown,
  Clock,
  ShieldCheck,
  Minimize2,
  Sparkles
} from 'lucide-react'

// ─── ROLE METADATA AND SUGGESTIONS ───────────────────────────────────────────

const ROLE_AGENT_META = {
  GENERAL_MANAGER: {
    name:     'Executive Assistant',
    subtitle: 'Full System Intelligence',
    color:    'text-uacc-gold',
    bgColor:  'bg-uacc-gold/10',
    borderColor: 'border-uacc-gold/20',
    suggestions: [
      "What's awaiting my approval right now?",
      "Give me today's full operational summary",
      "Which department has the most pending procurement?",
    ],
  },
  DEPARTMENT_HEAD: {
    name:     'Department Assistant',
    subtitle: 'Department approvals & logs',
    color:    'text-blue-400',
    bgColor:  'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    suggestions: [
      "What procurement requests are pending my approval?",
      "Show me my team's activity logs this week",
      "Give me a department overview",
    ],
  },
  STAFF: {
    name:     'Personal Assistant',
    subtitle: 'Daily tasks & requests',
    color:    'text-emerald-400',
    bgColor:  'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    suggestions: [
      "Have I submitted my activity log today?",
      "What's the status of my procurement requests?",
      "Give me a summary of my recent activity",
    ],
  },
  IT_ADMINISTRATOR: {
    name:     'System Assistant',
    subtitle: 'Health & Audit tracking',
    color:    'text-purple-400',
    bgColor:  'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    suggestions: [
      "Show me the security report for this week",
      "Give me a system health check",
      "Show me recent audit trail activity",
    ],
  },
  AUDITOR: {
    name:     'Audit Assistant',
    subtitle: 'Compliance & Anomalies',
    color:    'text-rose-400',
    bgColor:  'bg-rose-500/10',
    borderColor: 'border-rose-500/20',
    suggestions: [
      "Detect any anomalies in the audit trail",
      "Show me the activity log compliance report",
      "Audit the procurement approval patterns",
    ],
  },
  RECORDS_EXECUTIVE: {
    name:     'Records Assistant',
    subtitle: 'Document Registry Tracking',
    color:    'text-amber-500',
    bgColor:  'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    suggestions: [
      "Show me the registry summary",
      "What documents are pending in the registry?",
      "Provide a registry analytics report",
    ],
  },
}

export default function AIAgentWidget() {
  const { user: authUser } = useAuth()
  const pathname = usePathname()

  // Do not show the floating widget on the full AI Agent chat page itself
  if (pathname === '/dashboard/ai-agent') return null

  // Fallback to a mock GM user if auth session is not active (for easy testing)
  const user = authUser || {
    name: 'Lt. Gen. Nakibus Lakara',
    role: 'GENERAL_MANAGER',
    department: 'GENERAL_MANAGER_OFFICE',
  }
  const userRole = user.role || 'GENERAL_MANAGER'
  const meta = ROLE_AGENT_META[userRole] || ROLE_AGENT_META.STAFF

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [unread, setUnread] = useState(true)
  
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Initialize/reset conversation on role change
  useEffect(() => {
    setMessages([
      {
        id: 0,
        role: 'ai',
        text: `Hi ${user.name.split(' ')[0]}! I'm your ${meta.name}. Ask me any question about UACC documents, procurement approvals, or logs.`,
        timestamp: new Date().toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' }),
        suggestions: meta.suggestions,
      }
    ])
    setUnread(true)
  }, [userRole, user.name])

  // Scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping, isOpen])

  const sendMessage = async (text) => {
    if (!text.trim() || isTyping) return
    
    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('en-UG', {
        hour: '2-digit', minute: '2-digit'
      }),
    }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInputValue('')
    setIsTyping(true)

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: updatedMessages }),
      })
      const data = await res.json()
      if (data.success) {
        const aiMessage = {
          id: updatedMessages.length + 1,
          role: 'ai',
          text: data.message,
          timestamp: new Date().toLocaleTimeString('en-UG', {
            hour: '2-digit', minute: '2-digit'
          }),
          suggestions: meta.suggestions,
        }
        setMessages(prev => [...prev, aiMessage])
      } else {
        throw new Error(data.error || 'Failed to generate response')
      }
    } catch (error) {
      console.error('AI Agent widget error:', error)
      const errMessage = {
        id: updatedMessages.length + 1,
        role: 'ai',
        text: `Error communicating with AI Agent: ${error.message || 'Server error'}. Please verify system configurations.`,
        timestamp: new Date().toLocaleTimeString('en-UG', {
          hour: '2-digit', minute: '2-digit'
        }),
      }
      setMessages(prev => [...prev, errMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputValue)
    }
  }

  const handleInput = (e) => {
    setInputValue(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'
  }

  const toggleWidget = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setUnread(false)
    }
  }

  const renderAIText = (text) => {
    return text.split('\n').map((line, i) => {
      if (!line.trim()) return <br key={i} />
      
      // Basic bold formatting support: **text**
      let formattedLine = line
      const boldRegex = /\*\*(.*?)\*\*/g
      let match
      const parts = []
      let lastIndex = 0
      
      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index))
        }
        parts.push(<strong key={match.index} className="font-bold text-white">{match[1]}</strong>)
        lastIndex = boldRegex.lastIndex
      }
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex))
      }
      
      const lineContent = parts.length > 0 ? parts : line

      if (line.startsWith('•') || line.trim().startsWith('-')) {
        const cleanLine = line.replace(/^[•-]\s*/, '')
        return (
          <div key={i} className="flex items-start gap-1 my-1 pl-1 text-xs">
            <span className={`${meta.color} mt-1 flex-shrink-0`}>•</span>
            <span className="text-white/90">{parts.length > 0 ? parts : cleanLine}</span>
          </div>
        )
      }
      return <p key={i} className="leading-relaxed mb-1.5 text-xs text-white/90">{lineContent}</p>
    })
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* ── Chat Window Panel ── */}
      {isOpen && (
        <div 
          className="w-[360px] md:w-[400px] h-[520px] mb-4 flex flex-col rounded-2xl border bg-slate-950/95 backdrop-blur-md shadow-2xl transition-all duration-300 transform scale-100 origin-bottom-right"
          style={{ borderColor: 'var(--border-default)' }}
        >
          {/* Header */}
          <div className={`px-4 py-3 rounded-t-2xl border-b bg-white/[0.02] flex items-center justify-between`} style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border ${meta.borderColor}`}>
                <Bot size={16} className={meta.color} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white leading-tight flex items-center gap-1.5">
                  {meta.name}
                  <Sparkles size={11} className={meta.color} />
                </h4>
                <p className="text-[10px] text-white/50">{meta.subtitle}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={toggleWidget}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                title="Minimize"
              >
                <Minimize2 size={14} />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                title="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {messages.map((msg, idx) => (
              <div key={msg.id || idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                
                {/* AI Message */}
                {msg.role === 'ai' && (
                  <div className="flex gap-2 max-w-[85%]">
                    <div className={`w-6 h-6 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center mt-0.5 border ${meta.borderColor}`}>
                      <Bot size={12} className={meta.color} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="bg-white/[0.04] border border-white/5 border-l-2 border-l-uacc-gold rounded-xl rounded-tl-sm px-3 py-2 shadow-sm">
                        <div className="text-xs text-white/90 space-y-1">
                          {renderAIText(msg.text)}
                        </div>
                      </div>
                      
                      {/* Suggestions list */}
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="flex flex-col gap-1 mt-1.5">
                          {msg.suggestions.map((suggestion, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => sendMessage(suggestion)}
                              className={`text-left px-2.5 py-1.5 rounded-lg border ${meta.borderColor} bg-white/[0.02] hover:bg-white/[0.06] ${meta.color} text-[10px] transition-colors`}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* User Message */}
                {msg.role === 'user' && (
                  <div className="flex gap-2 max-w-[80%] flex-row-reverse">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center mt-0.5 border border-white/15">
                      <User size={12} className="text-white/60" />
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <div className="bg-white/5 border border-white/10 rounded-xl rounded-tr-sm px-3 py-2 shadow-sm">
                        <p className="text-xs text-white whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-2 max-w-[85%]">
                <div className={`w-6 h-6 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center mt-0.5 border ${meta.borderColor}`}>
                  <Bot size={12} className={meta.color} />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="bg-white/[0.04] border border-white/5 border-l-2 border-l-uacc-gold rounded-xl rounded-tl-sm px-3.5 py-2 w-fit">
                    <div className="flex gap-1 items-center">
                      <span className="w-1 h-1 bg-uacc-gold rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1 h-1 bg-uacc-gold rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1 h-1 bg-uacc-gold rounded-full animate-bounce"></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t bg-white/[0.01]" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-end gap-2 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                placeholder="Ask DIMS AI Agent..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-uacc-gold/50 focus:bg-white/10 transition-all resize-none overflow-hidden min-h-[36px]"
                rows={1}
              />
              <button
                onClick={() => sendMessage(inputValue)}
                disabled={!inputValue.trim() || isTyping}
                className="w-9 h-9 flex-shrink-0 rounded-xl bg-uacc-gold/20 border border-uacc-gold/50 flex items-center justify-center text-uacc-gold hover:bg-uacc-gold hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-uacc-gold/20 disabled:hover:text-uacc-gold disabled:cursor-not-allowed"
              >
                <Send size={14} />
              </button>
            </div>
            <div className="mt-2 text-center flex items-center justify-center gap-1 text-[8px] uppercase tracking-wider text-white/30 font-medium">
              <ShieldCheck size={9} />
              <span>DIMS AI SECURE CANAL</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Pulsing Floating Action Button ── */}
      <button
        onClick={toggleWidget}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-[0_4px_24px_rgba(0,0,0,0.5)] border relative cursor-pointer group ${
          isOpen ? 'bg-slate-900 border-white/15' : 'bg-uacc-gold/25 border-uacc-gold/45 hover:bg-uacc-gold/35'
        }`}
        style={{
          boxShadow: isOpen 
            ? '0 4px 20px rgba(0,0,0,0.6)' 
            : '0 0 25px rgba(201,151,58,0.25), 0 4px 15px rgba(0,0,0,0.4)',
        }}
      >
        {/* Glow pulsing ring for unread notification */}
        {!isOpen && unread && (
          <span className="absolute -inset-0.5 rounded-full border border-uacc-gold/40 animate-ping opacity-60"></span>
        )}
        
        {isOpen ? (
          <ChevronDown size={22} className="text-white animate-fade-in" />
        ) : (
          <Bot size={24} className="text-uacc-gold animate-bounce" style={{ animationDuration: '4s' }} />
        )}
        
        {/* Small badge */}
        {!isOpen && unread && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border border-slate-900 flex items-center justify-center text-[8px] font-bold text-white">
            1
          </span>
        )}
      </button>
      
    </div>
  )
}
