import { useCallback, useEffect } from 'react'
import api from './api'
import { useStore } from './store'

const POLL_INTERVAL_MS = 45000

export function useOnlineStatus() {
  const onlineUsers = useStore((state) => state.onlineUsers) || []
  const setOnlineUsers = useStore((state) => state.setOnlineUsers)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get('/users/online-status')
      setOnlineUsers(res.data?.users || [])
    } catch {
      // silent — this is a non-critical, decorative indicator
    }
  }, [setOnlineUsers])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchStatus()
      }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const isUserOnline = useCallback(
    (userId) => onlineUsers.find((u) => u.id === userId)?.isOnline || false,
    [onlineUsers]
  )

  const onlineCount = onlineUsers.filter((u) => u.isOnline).length

  return { users: onlineUsers, onlineCount, isUserOnline, refresh: fetchStatus }
}
