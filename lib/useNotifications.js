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

import { useStore } from './store'

export function useNotifications() {
  const notifications = useStore((state) => state.notifications) || { incoming: [], outgoing: [] }
  const unreadCount = useStore((state) => state.unreadCount)
  const setNotifications = useStore((state) => state.setNotifications)

  const incoming = notifications.incoming || []
  const outgoing = notifications.outgoing || []

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchNotifications = useCallback(async (force = false) => {
    const lastFetched = useStore.getState().notificationsLastFetched
    const cachedNotifications = useStore.getState().notifications
    const hasCachedData = cachedNotifications && (cachedNotifications.incoming || cachedNotifications.outgoing)

    if (force !== true && lastFetched && hasCachedData && (Date.now() - lastFetched < 30000)) {
      return
    }

    setLoading(true)
    try {
      const res = await api.get('/notifications')
      if (!res.success) throw new Error(res.message || 'Failed to load notifications')
      setNotifications(res.data || { incoming: [], outgoing: [] })
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [setNotifications])

  useEffect(() => {
    fetchNotifications(false)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications(false)
      }
    }, POLL_INTERVAL_MS)

    const handleEventRefresh = () => fetchNotifications(true)
    window.addEventListener(REFRESH_EVENT, handleEventRefresh)
    return () => {
      clearInterval(interval)
      window.removeEventListener(REFRESH_EVENT, handleEventRefresh)
    }
  }, [fetchNotifications])

  return {
    incoming,
    outgoing,
    unreadCount,
    loading,
    error,
    refresh: () => fetchNotifications(true)
  }
}
