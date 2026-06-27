'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Bot,
  User,
  Send,
  Trash2,
  Download,
  ShieldCheck,
  ClipboardList,
  FolderOpen,
  Clock,
  AlertTriangle,
  BarChart2,
  Menu,
  X
} from 'lucide-react'

const SUGGESTED_QUESTIONS = [
  {
    id: 1,
    category: 'Procurement',
    icon: ClipboardList,
    color: 'red',
    question: 'Which department submitted the most procurement requests last quarter?',
    answer: 'Engineering submitted the most procurement requests last quarter with 14 total requests — the highest across all five departments. Of these, 11 were approved (78.6% approval rate), 2 were rejected due to budget constraints, and 1 is currently pending GM review. The total estimated value of Engineering requests was UGX 18,450,000.',
  },
  {
    id: 2,
    category: 'Documents',
    icon: FolderOpen,
    color: 'gold',
    question: 'How many documents were uploaded this month?',
    answer: 'A total of 43 documents were uploaded in June 2026. The breakdown by category is: Reports (14), Policies (9), Forms (8), Memos (7), Contracts (3), and Other (2). The Finance and Administration department uploaded the most files (18), followed by Engineering (12) and Operations (8). Document uploads are up 12% compared to May 2026.',
  },
  {
    id: 3,
    category: 'Activity Logs',
    icon: Clock,
    color: 'green',
    question: 'Which department has the lowest log compliance rate this week?',
    answer: 'The General Manager Office currently has the lowest activity log compliance rate at 85% for this week. This means approximately 15% of expected daily log entries were not submitted on time. Operations leads compliance at 97%, followed by Engineering at 94% and Pilots at 91%. I recommend sending a reminder to GM Office staff about the daily log submission policy.',
  },
  {
    id: 4,
    category: 'Procurement',
    icon: AlertTriangle,
    color: 'red',
    question: 'Are there any procurement requests with unusual cost estimates?',
    answer: 'I flagged 1 potentially unusual procurement request:\n\n• UACC-PROC-2026-0040 (Kaspersky Antivirus x20 — UGX 3,200,000): This cost is 34% higher than the historical average for software license renewals at UACC (avg: UGX 2,380,000). This request was rejected by the GM in Q2 and recommended for resubmission in Q3 with a vendor comparison. I suggest obtaining quotes from at least 2 alternative vendors before resubmission.',
  },
  {
    id: 5,
    category: 'Reports',
    icon: BarChart2,
    color: 'blue',
    question: 'Summarize this week\'s operational activity',
    answer: 'Here is the operational summary for Week 26 (23–27 June 2026):\n\n📁 Documents: 11 new uploads across 4 departments. Engineering leads with 5 uploads.\n\n📋 Procurement: 3 new requests submitted (total value: UGX 4,550,000). 2 approvals processed. 0 rejections this week.\n\n📝 Activity Logs: 42 log entries submitted. 214 total hours logged. Operations and Engineering are fully compliant.\n\n🔍 Audit Trail: 89 system actions recorded. No anomalies or unauthorized access attempts detected.\n\nOverall operational status: ✅ NORMAL',
  },
  {
    id: 6,
    category: 'System',
    icon: ShieldCheck,
    color: 'purple',
    question: 'Show me a summary of recent system audit activity',
    answer: 'Audit Trail Summary — Last 7 Days:\n\n• 89 total system actions recorded\n• 5 unique users active\n• Most active user: Patrick Katusabe (IT Administrator) — 34 actions\n• Action breakdown: 12 logins, 23 document uploads, 8 downloads, 6 procurement submissions, 4 approvals, 2 user management actions\n• No DELETE actions in the last 7 days\n• No failed login attempts detected\n• Last system access: Today at 08:45 AM (Patrick Katusabe)\n\nSystem security status: ✅ SECURE',
  },
]

const INITIAL_MESSAGE = {
  id: 0,
  role: 'ai',
  text: 'Hello! I\'m the DIMS AI Agent, powered by Claude (Anthropic). I have read-only access to UACC\'s operational data and can help you understand procurement trends, document activity, staff log compliance, and more.\n\nWhat would you like to know about UACC\'s operations today?',
  timestamp: new Date().toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' }),
  suggestions: [
    'Summarize this week\'s operational activity',
    'Which department has the lowest log compliance?',
    'Are there unusual procurement cost estimates?',
  ],
}

const FALLBACK_RESPONSE = {
  text: 'I understand your question. Based on the current UACC operational data available to me, I can help you with procurement analysis, document management insights, activity log compliance, and audit trail summaries. Could you rephrase your question or choose one of the suggested topics below?',
  suggestions: [
    'Show procurement summary',
    'Document upload activity',
    'Staff log compliance report',
  ],
}

const renderAIText = (text) => {
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <br key={i} />
    if (line.startsWith('•')) {
      return (
        <div key={i} className="flex items-start gap-2 my-1">
          <span className="text-uacc-gold mt-1 flex-shrink-0">•</span>
          <span>{line.substring(1).trim()}</span>
        </div>
      )
    }
    return <p key={i} className="leading-relaxed">{line}</p>
  })
}

const getColorClass = (color) => {
  switch (color) {
    case 'red': return 'text-red-500 bg-red-500/10 border-red-500/20'
    case 'gold': return 'text-uacc-gold bg-uacc-gold/10 border-uacc-gold/20'
    case 'green': return 'text-green-500 bg-green-500/10 border-green-500/20'
    case 'blue': return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
    case 'purple': return 'text-purple-500 bg-purple-500/10 border-purple-500/20'
    default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
  }
}

export default function AIAgentPage() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sessionStarted] = useState(new Date())
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])
  
  const getSessionTime = () => {
    const diff = Math.floor((new Date() - sessionStarted) / 60000)
    if (diff === 0) return 'Just now'
    return `${diff} min`
  }

  const sendMessage = (text) => {
    if (!text.trim() || isTyping) return
    
    setMobileDrawerOpen(false)
    
    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('en-UG', {
        hour: '2-digit', minute: '2-digit'
      }),
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Reset textarea height
    if (inputRef.current) {
        inputRef.current.style.height = 'auto'
    }

    // Find matching mock response
    const match = SUGGESTED_QUESTIONS.find(q =>
      q.question.toLowerCase() === text.trim().toLowerCase() ||
      text.toLowerCase().includes(q.category.toLowerCase())
    )

    setTimeout(() => {
      const aiMessage = {
        id: messages.length + 2,
        role: 'ai',
        text: match ? match.answer : FALLBACK_RESPONSE.text,
        timestamp: new Date().toLocaleTimeString('en-UG', {
          hour: '2-digit', minute: '2-digit'
        }),
        suggestions: match ? null : FALLBACK_RESPONSE.suggestions,
      }
      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
    }, 1200 + Math.random() * 800)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputValue)
    }
  }

  const handleInput = (e) => {
    setInputValue(e.target.value)
    // Auto-expand textarea
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const clearChat = () => {
    setMessages([{...INITIAL_MESSAGE, timestamp: new Date().toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })}])
  }

  const SidebarContent = () => (
    <>
      {/* Agent Info Card */}
      <div className="card rounded-xl p-5 border border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-uacc-gold/20 flex items-center justify-center border border-uacc-gold/30">
            <Bot size={24} className="text-uacc-gold" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">DIMS AI Agent</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-white/50">Powered by Claude</span>
              <span className="w-1 h-1 rounded-full bg-uacc-gold"></span>
              <span className="text-xs text-white/50">Anthropic</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </div>
          <span className="text-xs text-green-500 font-medium">Online</span>
        </div>
        
        <div className="h-px w-full bg-white/5 mb-4"></div>
        
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <ShieldCheck size={14} className="text-white/40" />
            <span>Data Sources: 4 modules</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Clock size={14} className="text-white/40" />
            <span>Session: {getSessionTime()}</span>
          </div>
        </div>
        
        <div className="h-px w-full bg-white/5 mb-4"></div>
        
        <div className="flex items-center gap-2 text-xs text-green-500/80 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
          <ShieldCheck size={14} />
          <span>Data stays on your server</span>
        </div>
      </div>

      {/* Suggested Questions Card */}
      <div className="card rounded-xl p-5 mt-4 border border-white/5 bg-white/[0.02]">
        <h3 className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-4">
          Suggested Questions
        </h3>
        <div className="space-y-3">
          {SUGGESTED_QUESTIONS.map((q) => {
            const Icon = q.icon
            return (
              <button
                key={q.id}
                onClick={() => sendMessage(q.question)}
                className="w-full text-left p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-uacc-gold/30 hover:scale-[1.01] transition-all duration-200 group flex flex-col gap-2"
              >
                <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md inline-flex items-center gap-1.5 w-fit border ${getColorClass(q.color)}`}>
                  <Icon size={10} />
                  {q.category}
                </div>
                <p className="text-sm text-white/80 line-clamp-2 group-hover:text-white transition-colors">
                  {q.question}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={clearChat}
        className="w-full mt-4 flex items-center justify-center gap-2 p-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-colors text-sm"
      >
        <Trash2 size={16} />
        Clear Conversation
      </button>
    </>
  )

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen pb-24 md:pb-8">
      
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Bot className="text-uacc-gold" />
          AI Assistant
        </h1>
        <p className="text-white/60 text-sm">
          Ask questions about operational data, procurement, and system activity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Sidebar - Desktop Only */}
        <div className="hidden md:block md:col-span-4 lg:col-span-3">
          <SidebarContent />
        </div>

        {/* Right Main Area - Chat Interface */}
        <div className="md:col-span-8 lg:col-span-9">
          <div className="card rounded-xl overflow-hidden flex flex-col h-[calc(100vh-220px)] min-h-[500px] border border-white/5 bg-white/[0.01]">
            
            {/* Chat Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-uacc-gold/30 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-uacc-gold flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">DIMS AI Agent</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    <span className="text-[10px] text-green-500 uppercase tracking-wider font-semibold">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-white/40">{messages.length} messages</span>
                <button 
                  onClick={() => alert('Conversation exported')}
                  className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Download size={14} />
                  Export
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {messages.map((msg, idx) => (
                <div key={msg.id || idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  
                  {/* AI Message */}
                  {msg.role === 'ai' && (
                    <div className="flex gap-3 max-w-[90%] md:max-w-[85%]">
                      <div className="w-8 h-8 rounded-full bg-uacc-gold flex-shrink-0 flex items-center justify-center mt-1 shadow-[0_0_15px_rgba(201,151,58,0.3)]">
                        <Bot size={16} className="text-white" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] uppercase tracking-wider text-white/40 ml-1 font-semibold">
                          DIMS AI Agent
                        </span>
                        <div className="bg-white/[0.03] border border-white/5 border-l-2 border-l-uacc-gold rounded-xl rounded-tl-sm px-4 py-3 shadow-sm backdrop-blur-sm">
                          <div className="text-sm text-white/90 space-y-2">
                            {renderAIText(msg.text)}
                          </div>
                        </div>
                        <span className="text-[10px] text-white/30 text-right mr-1">
                          {msg.timestamp}
                        </span>
                        
                        {/* Suggestions inline */}
                        {msg.suggestions && msg.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {msg.suggestions.map((suggestion, sIdx) => (
                              <button
                                key={sIdx}
                                onClick={() => sendMessage(suggestion)}
                                className="px-3 py-1.5 rounded-full border border-uacc-gold/30 bg-uacc-gold/10 hover:bg-uacc-gold/20 text-uacc-gold text-xs transition-colors backdrop-blur-sm"
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
                    <div className="flex gap-3 max-w-[90%] md:max-w-[75%] flex-row-reverse">
                      <div className="w-8 h-8 rounded-full bg-red-500/20 flex-shrink-0 flex items-center justify-center mt-1 border border-red-500/30">
                        <User size={16} className="text-red-400" />
                      </div>
                      <div className="flex flex-col gap-1.5 items-end">
                        <span className="text-[9px] uppercase tracking-wider text-white/40 mr-1 font-semibold">
                          You
                        </span>
                        <div className="bg-white/5 border border-white/10 rounded-xl rounded-tr-sm px-4 py-3 shadow-sm backdrop-blur-sm">
                          <p className="text-sm text-white whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        <span className="text-[10px] text-white/30 text-left ml-1">
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-uacc-gold flex-shrink-0 flex items-center justify-center mt-1 shadow-[0_0_15px_rgba(201,151,58,0.3)]">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] uppercase tracking-wider text-white/40 ml-1 font-semibold">
                      DIMS AI Agent is thinking...
                    </span>
                    <div className="bg-white/[0.03] border border-white/5 border-l-2 border-l-uacc-gold rounded-xl rounded-tl-sm px-5 py-4 w-fit">
                      <div className="flex gap-1.5 items-center">
                        <span className="w-1.5 h-1.5 bg-uacc-gold rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-uacc-gold rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-uacc-gold rounded-full animate-bounce"></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Area */}
            <div className="px-4 py-4 border-t border-white/10 bg-white/[0.02]">
              <div className="flex items-end gap-3 relative max-w-4xl mx-auto">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  disabled={isTyping}
                  placeholder="Ask about procurement, documents, staff logs, or system activity..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-uacc-gold/50 focus:bg-white/10 transition-all resize-none overflow-hidden min-h-[48px]"
                  rows={1}
                />
                <button
                  onClick={() => sendMessage(inputValue)}
                  disabled={!inputValue.trim() || isTyping}
                  className="w-12 h-12 flex-shrink-0 rounded-xl bg-uacc-gold/20 border border-uacc-gold/50 flex items-center justify-center text-uacc-gold hover:bg-uacc-gold hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-uacc-gold/20 disabled:hover:text-uacc-gold disabled:cursor-not-allowed"
                >
                  <Send size={18} className={inputValue.trim() && !isTyping ? "translate-x-0.5 -translate-y-0.5 transition-transform" : ""} />
                </button>
              </div>
              <div className="mt-3 text-center">
                <p className="text-[9px] uppercase tracking-wider text-white/30 font-medium">
                  DIMS AI Agent · Data stays on your server · Powered by Claude (Anthropic)
                </p>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Button */}
      <button 
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-uacc-gold text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-40"
        onClick={() => setMobileDrawerOpen(true)}
      >
        <Menu size={24} />
      </button>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileDrawerOpen(false)}></div>
          <div className="relative w-full bg-gray-900 border-t border-white/10 rounded-t-2xl p-6 h-[80vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-lg">Agent Menu</h2>
              <button onClick={() => setMobileDrawerOpen(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60">
                <X size={18} />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

    </div>
  )
}
