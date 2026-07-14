import { useState, useCallback } from 'react'
import { apiCall } from './api'

export function useDrafts() {
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchMyDrafts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiCall('/api/drafts/mine')
      setDrafts(res || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const createDraft = async (title, content) => {
    try {
      const res = await apiCall('/api/drafts', {
        method: 'POST',
        body: JSON.stringify({ title, content }),
      })
      await fetchMyDrafts()
      return res
    } catch (err) {
      throw new Error(err.message)
    }
  }

  const updateDraft = async (id, title, content) => {
    try {
      const res = await apiCall(`/api/drafts/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ title, content }),
      })
      await fetchMyDrafts()
      return res
    } catch (err) {
      throw new Error(err.message)
    }
  }

  const confirmReview = async (id) => {
    try {
      const res = await apiCall(`/api/drafts/${id}/confirm-review`, {
        method: 'PUT',
      })
      await fetchMyDrafts()
      return res
    } catch (err) {
      throw new Error(err.message)
    }
  }

  const submitDraft = async (id) => {
    try {
      // NOTE: the submit endpoint triggers the PA workflow for GM review.
      // Or users can circulate it using the circulation endpoint.
      // For generic submit, we keep this, but general users might just circulate.
      const res = await apiCall(`/api/drafts/${id}/submit`, {
        method: 'PUT',
      })
      await fetchMyDrafts()
      return res
    } catch (err) {
      throw new Error(err.message)
    }
  }

  return {
    drafts,
    loading,
    error,
    fetchMyDrafts,
    createDraft,
    updateDraft,
    confirmReview,
    submitDraft
  }
}
