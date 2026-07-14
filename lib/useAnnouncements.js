import { useState, useCallback, useEffect } from 'react'
import api from './api'

const POLL_INTERVAL_MS = 30000

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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

  const createAnnouncement = useCallback(async (title, content, pinned = false) => {
    const res = await api.post('/announcements', { title, content, pinned })
    if (!res.success) throw new Error(res.message || 'Failed to post announcement')
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
    const interval = setInterval(fetchAnnouncements, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchAnnouncements])

  return {
    announcements,
    loading,
    error,
    fetchAnnouncements,
    createAnnouncement,
    deleteAnnouncement,
  }
}
