'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
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
  X,
  BookOpen
} from 'lucide-react'

// ─── ROLE METADATA AND SUGGESTIONS ───────────────────────────────────────────

const ROLE_AGENT_META = {
  GENERAL_MANAGER: {
    name:     'DIMS Executive Assistant',
    subtitle: 'Full system intelligence · All departments',
    color:    'text-uacc-gold',
    bgColor:  'bg-uacc-gold/10',
    borderColor: 'border-uacc-gold/20',
    iconColor: 'text-uacc-gold',
    suggestions: [
      "What's awaiting my approval right now?",
      "Give me today's full operational summary",
      "Which department has the most pending procurement?",
      "Show me all high-priority registry entries",
      "How many activity logs were submitted this week?",
    ],
  },
  DEPARTMENT_HEAD: {
    name:     'DIMS Department Assistant',
    subtitle: 'Department intelligence · Approval queue',
    color:    'text-blue-400',
    bgColor:  'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    iconColor: 'text-blue-400',
    suggestions: [
      "What procurement requests are pending my approval?",
      "Show me my team's activity logs this week",
      "How many documents has my department uploaded?",
      "Give me a department overview",
    ],
  },
  STAFF: {
    name:     'DIMS Personal Assistant',
    subtitle: 'Your daily tasks · Request tracking',
    color:    'text-emerald-400',
    bgColor:  'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    iconColor: 'text-emerald-400',
    suggestions: [
      "Have I submitted my activity log today?",
      "What's the status of my procurement requests?",
      "Help me find a document",
      "Give me a summary of my recent activity",
    ],
  },
  IT_ADMINISTRATOR: {
    name:     'DIMS System Assistant',
    subtitle: 'System health · Security · User management',
    color:    'text-purple-400',
    bgColor:  'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    iconColor: 'text-purple-400',
    suggestions: [
      "Show me the security report for this week",
      "List all active users and their roles",
      "Give me a system health check",
      "Show me recent audit trail activity",
    ],
  },
  AUDITOR: {
    name:     'DIMS Audit Assistant',
    subtitle: 'Compliance · Anomaly detection · Evidence',
    color:    'text-rose-400',
    bgColor:  'bg-rose-500/10',
    borderColor: 'border-rose-500/20',
    iconColor: 'text-rose-400',
    suggestions: [
      "Detect any anomalies in the audit trail",
      "Show me the activity log compliance report",
      "Audit the procurement approval patterns",
      "Show me all document deletions this month",
    ],
  },
  RECORDS_EXECUTIVE: {
    name:     'DIMS Records Assistant',
    subtitle: 'Registry tracking · Document movement',
    color:    'text-amber-500',
    bgColor:  'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    iconColor: 'text-amber-500',
    suggestions: [
      "Show me the registry summary",
      "What documents are pending in the registry?",
      "Give me the volume of documents by direction",
      "Search the registry for a specific subject",
      "Provide a registry analytics report",
    ],
  },
}

const ROLE_SUGGESTIONS_WITH_META = {
  GENERAL_MANAGER: [
    { text: "What's awaiting my approval right now?", category: 'Procurement', icon: ClipboardList, color: 'red' },
    { text: "Give me today's full operational summary", category: 'System', icon: ShieldCheck, color: 'purple' },
    { text: "Which department has the most pending procurement?", category: 'Procurement', icon: ClipboardList, color: 'red' },
    { text: "Show me all high-priority registry entries", category: 'Documents', icon: FolderOpen, color: 'gold' },
  ],
  DEPARTMENT_HEAD: [
    { text: "What procurement requests are pending my approval?", category: 'Procurement', icon: ClipboardList, color: 'red' },
    { text: "Show me my team's activity logs this week", category: 'Activity Logs', icon: Clock, color: 'green' },
    { text: "Give me a department overview", category: 'Reports', icon: BarChart2, color: 'blue' },
  ],
  STAFF: [
    { text: "Have I submitted my activity log today?", category: 'Activity Logs', icon: Clock, color: 'green' },
    { text: "What's the status of my procurement requests?", category: 'Procurement', icon: ClipboardList, color: 'red' },
    { text: "Help me find a document", category: 'Documents', icon: FolderOpen, color: 'gold' },
  ],
  IT_ADMINISTRATOR: [
    { text: "Show me the security report for this week", category: 'System', icon: ShieldCheck, color: 'purple' },
    { text: "List all active users and their roles", category: 'System', icon: ShieldCheck, color: 'purple' },
    { text: "Give me a system health check", category: 'System', icon: ShieldCheck, color: 'purple' },
  ],
  AUDITOR: [
    { text: "Detect any anomalies in the audit trail", category: 'System', icon: ShieldCheck, color: 'purple' },
    { text: "Show me the activity log compliance report", category: 'Reports', icon: BarChart2, color: 'blue' },
    { text: "Audit the procurement approval patterns", category: 'Reports', icon: BarChart2, color: 'blue' },
  ],
  RECORDS_EXECUTIVE: [
    { text: "Show me the registry summary", category: 'Documents', icon: FolderOpen, color: 'gold' },
    { text: "What documents are pending in the registry?", category: 'Documents', icon: FolderOpen, color: 'gold' },
    { text: "Provide a registry analytics report", category: 'Reports', icon: BarChart2, color: 'blue' },
  ],
}

// Helper to get bootstrap color classes
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

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function AIAgentPage() {
  const { data: session } = useSession()

  // Fallback to a mock GM user if auth session is not active (for easy testing)
  const user = session?.user || {
    name: 'Lt. Gen. Nakibus Lakara',
    role: 'GENERAL_MANAGER',
    department: 'GENERAL_MANAGER_OFFICE',
  }
  const userRole = user.role || 'GENERAL_MANAGER'
  const meta = ROLE_AGENT_META[userRole] || ROLE_AGENT_META.STAFF

  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sessionStarted] = useState(new Date())
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Initialize/reset conversation on role change
  useEffect(() => {
    setMessages([
      {
        id: 0,
        role: 'ai',
        text: `Hello! I'm the ${meta.name}, your role-aware assistant. I have access to your modules and can fetch data using my integrated tools.\n\nWhat would you like to request or ask about UACC operations today?`,
        timestamp: new Date().toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' }),
        suggestions: meta.suggestions,
      }
    ])
  }, [userRole])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const getSessionTime = () => {
    const diff = Math.floor((new Date() - sessionStarted) / 60000)
    if (diff === 0) return 'Just now'
    return `${diff} min`
  }

  const sendMessage = async (text) => {
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
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInputValue('')
    setIsTyping(true)

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''
      const res = await fetch(`${API_BASE}/ai`, {
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
      console.error('AI Agent page error:', error)
      const errMessage = {
        id: updatedMessages.length + 1,
        role: 'ai',
        text: `Error communicating with AI Agent: ${error.message || 'Server error'}. Make sure ANTHROPIC_API_KEY is configured in .env.local.`,
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
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const clearChat = () => {
    setMessages([
      {
        id: 0,
        role: 'ai',
        text: `Hello! I'm the ${meta.name}, your role-aware assistant. I have access to your modules and can fetch data using my integrated tools.\n\nWhat would you like to request or ask about UACC operations today?`,
        timestamp: new Date().toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' }),
        suggestions: meta.suggestions,
      }
    ])
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
          <div key={i} className="flex items-start gap-2 my-1.5 pl-2">
            <span className={`${meta.color} mt-1.5 flex-shrink-0 text-xs`}>•</span>
            <span className="text-white/90">{parts.length > 0 ? parts : cleanLine}</span>
          </div>
        )
      }
      return <p key={i} className="leading-relaxed mb-2 text-white/90">{lineContent}</p>
    })
  }

  const SidebarContent = () => {
    const suggestions = ROLE_SUGGESTIONS_WITH_META[userRole] || ROLE_SUGGESTIONS_WITH_META.STAFF
    return (
      <>
        {/* Agent Info Card */}
        <div className={`card rounded-xl p-5 border ${meta.borderColor} ${meta.bgColor}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border ${meta.borderColor}`}>
              <Bot size={24} className={meta.color} />
            </div>
            <div>
              <h2 className="text-white font-bold text-base leading-tight">{meta.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-white/50">Dynamic AI Agent</span>
                <span className={`w-1 h-1 rounded-full ${meta.bgColor} bg-white`}></span>
                <span className="text-[10px] text-white/50">Claude SDK</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </div>
            <span className="text-xs text-green-500 font-medium">Online & Role-Aware</span>
          </div>
          
          <div className="h-px w-full bg-white/5 mb-4"></div>
          
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-xs text-white/60">
              <ShieldCheck size={14} className="text-white/40" />
              <span>User: <strong className="text-white font-medium">{user.name}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Clock size={14} className="text-white/40" />
              <span>Session Time: {getSessionTime()}</span>
            </div>
          </div>
          
          <div className="h-px w-full bg-white/5 mb-4"></div>
          
          <div className="flex items-center gap-2 text-xs text-green-500/80 bg-green-500/5 px-3 py-2 rounded-lg border border-green-500/10">
            <ShieldCheck size={14} />
            <span>Secure internal database bridge</span>
          </div>
        </div>

        {/* Dynamic Suggested Questions */}
        <div className="card rounded-xl p-5 mt-4 border border-white/5 bg-white/[0.02]">
          <h3 className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-4">
            Suggested Tasks
          </h3>
          <div className="space-y-3">
            {suggestions.map((q, sIdx) => {
              const Icon = q.icon
              return (
                <button
                  key={sIdx}
                  onClick={() => sendMessage(q.text)}
                  className="w-full text-left p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/5 hover:border-uacc-gold/30 hover:scale-[1.01] transition-all duration-200 group flex flex-col gap-2"
                >
                  <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md inline-flex items-center gap-1.5 w-fit border ${getColorClass(q.color)}`}>
                    <Icon size={10} />
                    {q.category}
                  </div>
                  <p className="text-xs text-white/80 leading-normal group-hover:text-white transition-colors">
                    {q.text}
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
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen pb-24 md:pb-8">
      
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Bot className={meta.color} />
          AI Operational Agent
        </h1>
        <p className="text-white/60 text-sm">
          Dynamic role-aware system intelligence tailored to your credentials.
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
            <div className={`flex items-center justify-between px-6 py-4 border-b ${meta.borderColor} bg-white/[0.02]`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border ${meta.borderColor}`}>
                  <Bot size={16} className={meta.color} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">{meta.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    <span className="text-[10px] text-green-500 uppercase tracking-wider font-semibold">Active Session</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-white/40">{messages.length} messages</span>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {messages.map((msg, idx) => (
                <div key={msg.id || idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  
                  {/* AI Message */}
                  {msg.role === 'ai' && (
                    <div className="flex gap-3 max-w-[90%] md:max-w-[85%]">
                      <div className={`w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center mt-1 border ${meta.borderColor}`}>
                        <Bot size={16} className={meta.color} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] uppercase tracking-wider text-white/40 ml-1 font-semibold">
                          {meta.name}
                        </span>
                        <div className={`bg-white/[0.03] border border-white/5 border-l-2 border-l-uacc-gold rounded-xl rounded-tl-sm px-4 py-3 shadow-sm backdrop-blur-sm`}>
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
                                className={`px-3 py-1.5 rounded-full border ${meta.borderColor} bg-white/5 hover:bg-white/10 ${meta.color} text-xs transition-colors backdrop-blur-sm`}
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
                      <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center mt-1 border border-white/15">
                        <User size={16} className="text-white/60" />
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
                  <div className={`w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center mt-1 border ${meta.borderColor}`}>
                    <Bot size={16} className={meta.color} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] uppercase tracking-wider text-white/40 ml-1 font-semibold">
                      {meta.name} is thinking...
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
                  placeholder={`Ask about registry, procurement, activity logs, documents, etc...`}
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
                  {meta.name} · Uganda Air Cargo Corporation · Confidential Internal Tool
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
