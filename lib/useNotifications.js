import { useState, useCallback, useEffect } from 'react'
import api from './api'

const POLL_INTERVAL_MS = 20000

export function useNotifications() {
  const [items, setItems] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/notifications')
      setItems(res.data?.items || [])
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
    return () => clearInterval(interval)
  }, [fetchNotifications])

  return { items, unreadCount, loading, refresh: fetchNotifications }
}
