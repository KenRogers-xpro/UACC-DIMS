'use client'

import { useState, useEffect, useMemo } from 'react'
import { Send, Search, Plus, X, MessageSquare } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useMessages } from '@/lib/useMessages'
import { useOnlineStatus } from '@/lib/useOnlineStatus'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import StatusDot from '@/components/ui/StatusDot'
import { SkeletonLine } from '@/components/ui/SkeletonLoader'

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function MessagesPage() {
  const { user } = useAuth()
  const {
    directory, conversations, thread, loading,
    fetchDirectory, fetchConversations, openThread, sendMessage,
  } = useMessages()
  const { isUserOnline } = useOnlineStatus()

  const [activePartnerId, setActivePartnerId] = useState(null)
  const [composeText, setComposeText] = useState('')
  const [sending, setSending] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')

  useEffect(() => {
    fetchDirectory()
    fetchConversations()
  }, [fetchDirectory, fetchConversations])

  const filteredDirectory = useMemo(() => {
    const q = pickerSearch.toLowerCase()
    return directory.filter((u) => u.name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q))
  }, [directory, pickerSearch])

  const handleOpenThread = async (partnerId) => {
    setActivePartnerId(partnerId)
    setPickerOpen(false)
    await openThread(partnerId)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!composeText.trim() || !activePartnerId) return
    setSending(true)
    try {
      await sendMessage(activePartnerId, composeText.trim())
      setComposeText('')
    } finally {
      setSending(false)
    }
  }

  const activePartner = thread?.otherUser

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      <PageHeader title="Messages" subtitle="Direct conversations across UACC" />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4" style={{ minHeight: '60vh' }}>
        {/* Conversation list */}
        <div className="md:col-span-4 card rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
            <h3 className="font-heading font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Conversations</h3>
            <Button size="sm" variant="outline" icon={Plus} onClick={() => setPickerOpen(true)}>New</Button>
          </div>

          {pickerOpen && (
            <div className="p-3 border-b flex flex-col gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    className="input-field pl-8 py-1.5 text-xs w-full"
                    placeholder="Search people..."
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                  />
                </div>
                <button onClick={() => setPickerOpen(false)} className="p-1.5 rounded hover:bg-white/5" style={{ color: 'var(--text-muted)' }}>
                  <X size={14} />
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
                {filteredDirectory.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleOpenThread(u.id)}
                    className="text-left px-2 py-1.5 rounded hover:bg-white/5 text-xs"
                  >
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{u.name}</span>
                    <span className="ml-2" style={{ color: 'var(--text-muted)' }}>{u.role.replace(/_/g, ' ')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4">
                <EmptyState icon={MessageSquare} title="No conversations yet" message="Start a new one with the button above." />
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.partner.id}
                  onClick={() => handleOpenThread(c.partner.id)}
                  className={`w-full text-left px-4 py-3 border-b hover:bg-white/5 transition-colors flex items-start justify-between gap-2 ${
                    activePartnerId === c.partner.id ? 'bg-white/5' : ''
                  }`}
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                      <StatusDot online={isUserOnline(c.partner.id)} size={6} />
                      {c.partner.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{c.lastMessage.content}</p>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-uacc-gold text-white flex-shrink-0">
                      {c.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Thread */}
        <div className="md:col-span-8 card rounded-xl flex flex-col overflow-hidden">
          {!activePartnerId ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon={MessageSquare} title="Select a conversation" message="Pick someone from the list or start a new conversation." />
            </div>
          ) : (
            <>
              <div className="p-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
                <h3 className="font-heading font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                  {activePartner && <StatusDot online={isUserOnline(activePartner.id)} size={7} />}
                  {activePartner?.name || '...'}
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{activePartner?.role?.replace(/_/g, ' ')}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {loading && !thread ? (
                  <><SkeletonLine height="h-10" /><SkeletonLine height="h-10" /></>
                ) : (
                  thread?.messages.map((m) => (
                    <div key={m.id} className={`flex flex-col max-w-[75%] ${m.senderId === user.id ? 'self-end items-end' : 'self-start items-start'}`}>
                      <div
                        className="px-3.5 py-2.5 rounded-lg text-sm"
                        style={m.senderId === user.id
                          ? { background: 'var(--glass-bg)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }
                          : { background: 'rgba(201,151,58,0.08)', color: 'var(--text-secondary)' }}
                      >
                        {m.content}
                      </div>
                      <span className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>{formatTime(m.createdAt)}</span>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSend} className="p-3 border-t flex gap-2 flex-shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
                <input
                  className="input-field flex-1"
                  placeholder="Type a message..."
                  value={composeText}
                  onChange={(e) => setComposeText(e.target.value)}
                />
                <Button type="submit" variant="primary" icon={Send} loading={sending}>Send</Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
