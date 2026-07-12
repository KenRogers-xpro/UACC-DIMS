import { useState, useCallback } from 'react'
import api from './api'

export function useCirculation() {
  const [inbox, setInbox] = useState([])
  const [timeline, setTimeline] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchInbox = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/circulation/inbox')
      // Safely handle different response structures
      const data = res.data?.circulations || res.data?.data || res.circulations || res.data || []
      setInbox(data)
    } catch (err) {
      setError(err.message || 'Failed to fetch inbox')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTimeline = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/circulation/${id}`)
      const data = res.data?.circulation || res.data?.data || res.circulation || res.data
      setTimeline(data)
      return data
    } catch (err) {
      setError(err.message || 'Failed to fetch timeline')
    } finally {
      setLoading(false)
    }
  }, [])

  const initiateCirculation = useCallback(async (data) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post('/circulation', data)
      return res.data
    } catch (err) {
      setError(err.message || 'Failed to initiate circulation')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const addStep = useCallback(async (id, data) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post(`/circulation/${id}/step`, data)
      return res.data
    } catch (err) {
      setError(err.message || 'Failed to add step')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    inbox,
    timeline,
    loading,
    error,
    fetchInbox,
    fetchTimeline,
    initiateCirculation,
    addStep
  }
}
