import { useState, useCallback, useEffect, useRef } from 'react'
import api from './api'
import { notifyNotificationsChanged } from './useNotifications'

const POLL_INTERVAL_MS = 30000

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const markedRead = useRef(new Set())

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/announcements')
      setAnnouncements(res.data || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch announcements')
    } finally {
      setLoading(false)
    }
  }, [])

  // Viewing this page is what "seeing" an announcement means — mark every
  // announcement currently in the list read (once per id per session) so
  // the notification bell stops counting it. Only used from the
  // announcements page itself, never from a passive/background fetch.
  const markVisibleRead = useCallback((list) => {
    const unmarked = list.filter((a) => !markedRead.current.has(a.id))
    if (unmarked.length === 0) return
    unmarked.forEach((a) => markedRead.current.add(a.id))
    Promise.all(unmarked.map((a) => api.post(`/notifications/ANNOUNCEMENT/${a.id}/read`, {}).catch(() => {})))
      .then(() => notifyNotificationsChanged())
  }, [])

  const createAnnouncement = useCallback(async (title, content, pinned = false) => {
    const res = await api.post('/announcements', { title, content, pinned })
    if (!res.success) throw new Error(res.message || 'Failed to post announcement')
    await fetchAnnouncements()
    return res.data
  }, [fetchAnnouncements])

  const editAnnouncement = useCallback(async (id, title, content) => {
    const res = await api.put(`/announcements/${id}`, { title, content })
    if (!res.success) throw new Error(res.message || 'Failed to edit announcement')
    await fetchAnnouncements()
    return res.data
  }, [fetchAnnouncements])

  const deleteAnnouncement = useCallback(async (id) => {
    const res = await api.delete(`/announcements/${id}`)
    if (!res.success) throw new Error(res.message || 'Failed to delete announcement')
    await fetchAnnouncements()
  }, [fetchAnnouncements])

  useEffect(() => {
    fetchAnnouncements()
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAnnouncements()
      }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchAnnouncements])

  // This hook backs the announcements page only (not any passive widget),
  // so every list it loads is by definition something the user is looking
  // at right now — safe to mark read as soon as it arrives.
  useEffect(() => {
    if (announcements.length > 0) markVisibleRead(announcements)
  }, [announcements, markVisibleRead])

  return {
    announcements,
    loading,
    error,
    fetchAnnouncements,
    createAnnouncement,
    editAnnouncement,
    deleteAnnouncement,
  }
}
