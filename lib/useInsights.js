import { useState, useCallback, useEffect, useRef } from 'react'
import api from './api'

// Reuses the existing notification bell's polling cadence, per the
// directive — one more 20s poll alongside it is negligible, and keeping
// the same rhythm means both surfaces feel like part of the same system.
const POLL_INTERVAL_MS = 20000

export function useInsights() {
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  // The single most recently-arrived insight the floating widget hasn't
  // popped up for yet — set when a poll turns up an id we haven't seen in
  // this browser session before, cleared once the widget's popup consumes
  // it (see consumeJustArrived below). Never re-populated for an insight
  // that's already seen/dismissed server-side — knownIds below is seeded
  // from the very first fetch specifically so a page load doesn't treat
  // every already-existing unseen insight as "just arrived".
  const [justArrived, setJustArrived] = useState(null)
  const knownIds = useRef(null) // null = not seeded yet

  // unseenCount is derived from the same array the panel renders — never a
  // separately-computed number (see the notification bell fix this exact
  // bug caused there).
  const unseenCount = insights.filter((i) => !i.seenAt).length

  const fetchInsights = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/insights')
      if (!res.success) throw new Error(res.message || 'Failed to load insights')
      const list = res.data || []
      setInsights(list)
      setError(null)

      if (knownIds.current === null) {
        // First load this session — these are pre-existing, not "just
        // arrived". Seed silently, no popup.
        knownIds.current = new Set(list.map((i) => i.id))
      } else {
        const brandNew = list.find((i) => !i.seenAt && !knownIds.current.has(i.id))
        list.forEach((i) => knownIds.current.add(i.id))
        if (brandNew) setJustArrived(brandNew)
      }
    } catch (err) {
      setError(err.message || 'Failed to load insights')
    } finally {
      setLoading(false)
    }
  }, [])

  const markSeen = useCallback(async (id) => {
    setInsights((prev) => prev.map((i) => (i.id === id ? { ...i, seenAt: i.seenAt || new Date().toISOString() } : i)))
    await api.put(`/insights/${id}/seen`).catch(() => {})
  }, [])

  const dismiss = useCallback(async (id) => {
    setInsights((prev) => prev.filter((i) => i.id !== id))
    await api.put(`/insights/${id}/dismiss`).catch(() => {})
  }, [])

  // Called by the floating widget once it's shown (or skipped) the popup
  // for the current justArrived insight, so the same one doesn't re-trigger.
  const consumeJustArrived = useCallback(() => setJustArrived(null), [])

  useEffect(() => {
    fetchInsights()
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchInsights()
      }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchInsights])

  return { insights, unseenCount, loading, error, justArrived, markSeen, dismiss, consumeJustArrived, refresh: fetchInsights }
}
