import { useState, useCallback, useEffect } from 'react'
import api from './api'

const POLL_INTERVAL_MS = 45000

export function useOnlineStatus() {
  const [users, setUsers] = useState([])
  const [onlineCount, setOnlineCount] = useState(0)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get('/users/online-status')
      setUsers(res.data?.users || [])
      setOnlineCount(res.data?.onlineCount || 0)
    } catch {
      // silent — this is a non-critical, decorative indicator
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const isUserOnline = useCallback(
    (userId) => users.find((u) => u.id === userId)?.isOnline || false,
    [users]
  )

  return { users, onlineCount, isUserOnline, refresh: fetchStatus }
}
