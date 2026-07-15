import { useState, useCallback, useEffect, useRef } from 'react'
import api from './api'

const POLL_INTERVAL_MS = 6000

export function useMessages() {
  const [directory, setDirectory] = useState([])
  const [conversations, setConversations] = useState([])
  const [thread, setThread] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const activeThreadUserId = useRef(null)

  const fetchDirectory = useCallback(async () => {
    try {
      const res = await api.get('/messages/directory')
      setDirectory(res.data || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch directory')
    }
  }, [])

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/messages/conversations')
      setConversations(res.data || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch conversations')
    }
  }, [])

  const fetchThread = useCallback(async (userId) => {
    setLoading(true)
    try {
      const res = await api.get(`/messages/thread/${userId}`)
      setThread(res.data)
      return res.data
    } catch (err) {
      setError(err.message || 'Failed to fetch thread')
    } finally {
      setLoading(false)
    }
  }, [])

  const sendMessage = useCallback(async (recipientId, content) => {
    const res = await api.post('/messages', { recipientId, content })
    if (!res.success) throw new Error(res.message || 'Failed to send message')
    await fetchThread(recipientId)
    await fetchConversations()
    return res.data
  }, [fetchThread, fetchConversations])

  const editMessage = useCallback(async (id, content, otherUserId) => {
    const res = await api.put(`/messages/${id}`, { content })
    if (!res.success) throw new Error(res.message || 'Failed to edit message')
    await fetchThread(otherUserId)
    return res.data
  }, [fetchThread])

  const deleteMessage = useCallback(async (id, otherUserId) => {
    const res = await api.delete(`/messages/${id}`)
    if (!res.success) throw new Error(res.message || 'Failed to delete message')
    await fetchThread(otherUserId)
    await fetchConversations()
  }, [fetchThread, fetchConversations])

  const markThreadRead = useCallback(async (userId) => {
    await api.patch(`/messages/thread/${userId}/read`).catch(() => {})
    fetchConversations()
  }, [fetchConversations])

  const openThread = useCallback(async (userId) => {
    activeThreadUserId.current = userId
    await fetchThread(userId)
    await markThreadRead(userId)
  }, [fetchThread, markThreadRead])

  // Poll the open thread and the conversation list every few seconds so new
  // messages show up without a manual refresh.
  useEffect(() => {
    fetchConversations()
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchConversations()
        if (activeThreadUserId.current) {
          fetchThread(activeThreadUserId.current)
        }
      }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchConversations, fetchThread])

  return {
    directory,
    conversations,
    thread,
    loading,
    error,
    fetchDirectory,
    fetchConversations,
    fetchThread,
    sendMessage,
    editMessage,
    deleteMessage,
    openThread,
  }
}
