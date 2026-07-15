import { useState, useCallback, useEffect } from 'react'
import api from './api'

const POLL_INTERVAL_MS = 20000
const REFRESH_EVENT = 'dims:notifications-refresh'

// Components that mark something read (DocumentViewerModal, the
// announcements page) call this so the bell badge decrements immediately
// instead of waiting for the next poll tick.
export function notifyNotificationsChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(REFRESH_EVENT))
}

export function useNotifications() {
  const [incoming, setIncoming] = useState([])
  const [outgoing, setOutgoing] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/notifications')
      setIncoming(res.data?.incoming || [])
      setOutgoing(res.data?.outgoing || [])
      setUnreadCount(res.data?.unreadCount || 0)
    } catch {
      // silent — decorative, shouldn't disrupt the rest of the shell
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications()
      }
    }, POLL_INTERVAL_MS)
    window.addEventListener(REFRESH_EVENT, fetchNotifications)
    return () => {
      clearInterval(interval)
      window.removeEventListener(REFRESH_EVENT, fetchNotifications)
    }
  }, [fetchNotifications])

  return { incoming, outgoing, unreadCount, loading, refresh: fetchNotifications }
}
