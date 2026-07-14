import { useState, useCallback } from 'react'
import api from './api'

export function useDrafts() {
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchMyDrafts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/drafts/mine')
      setDrafts(res.data || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const createDraft = async (title, content) => {
    try {
      const res = await api.post('/drafts', { title, content })
      await fetchMyDrafts()
      return res
    } catch (err) {
      throw new Error(err.message)
    }
  }

  const updateDraft = async (id, title, content) => {
    try {
      const res = await api.put(`/drafts/${id}`, { title, content })
      await fetchMyDrafts()
      return res
    } catch (err) {
      throw new Error(err.message)
    }
  }

  const confirmReview = async (id) => {
    try {
      const res = await api.put(`/drafts/${id}/confirm-review`)
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
      const res = await api.put(`/drafts/${id}/submit`)
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
