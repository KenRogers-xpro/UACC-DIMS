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
  const [loading, setLoading] = useState(false)

  // unreadCount is NOT a separate field from the API — it's derived here,
  // directly from the two arrays this hook hands to the dropdown. That's
  // deliberate: a badge count computed independently of the list it's
  // supposedly summarizing is exactly how you get "3 unread" next to an
  // empty "you're all caught up" list (which is what happened before this
  // fix, whether from a stray formula on the backend or a stale deploy of
  // one side but not the other). The backend still sends its own
  // unreadCount for other potential consumers, but this hook ignores it.
  const unreadCount = incoming.length + outgoing.length

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/notifications')
      setIncoming(res.data?.incoming || [])
      setOutgoing(res.data?.outgoing || [])
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
