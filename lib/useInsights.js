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
        // First load this session. These insights may have been generated
        // while the user was logged out or on another tab — "just arrived"
        // means "not yet seen", not "arrived during a live poll", or the
        // popup would only ever fire for the narrow window of insights
        // created while this exact tab happened to be open and polling.
        // Seed every id so subsequent polls don't re-pop the same one, but
        // still surface the most recent unseen insight once, deliberately.
        knownIds.current = new Set(list.map((i) => i.id))
        const mostRecentUnseen = list.find((i) => !i.seenAt)
        if (mostRecentUnseen) setJustArrived(mostRecentUnseen)
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

// Shared by the floating widget's popup and the Insights tab panel so the
// pre-seeded chat message is built identically from either entry point.
// Explicitly naming [Document #N] — the same format the RAG prompt in
// ai.routes.js cites documents by — gives the model a strong retrieval
// anchor, rather than relying on the weak original question alone to score
// this specific document above threshold on the first try.
export function buildAskAboutMessage(insight) {
  const queryText = insight.queryText || ''
  const docRef = insight.sourceType === 'DOCUMENT'
    ? `[Document #${insight.sourceId}]${insight.documentTitle ? ` "${insight.documentTitle}"` : ''}`
    : 'the newly added item'
  return `Regarding my earlier question — "${queryText}" — I understand ${docRef} may now have the answer. Please tell me what it says.`
}
