import { useState, useCallback } from 'react'
import api from './api'

export function useCirculation() {
  const [inbox, setInbox] = useState([])
  const [timeline, setTimeline] = useState(null)
  const [paGateway, setPaGateway] = useState({ toGM: [], fromGM: [] })
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

  // PA's own gatekeeping queues — GET /circulation/pa-gateway is a raw
  // endpoint like /circulation/:id (not the shared success() helper), so
  // toGM/fromGM sit at the top level of the response, not under res.data.
  const fetchPaGateway = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/circulation/pa-gateway')
      setPaGateway({
        toGM: res.toGM || res.data?.toGM || [],
        fromGM: res.fromGM || res.data?.fromGM || [],
      })
    } catch (err) {
      setError(err.message || 'Failed to fetch PA gateway')
    } finally {
      setLoading(false)
    }
  }, [])

  const releaseCirculation = useCallback(async (id, note) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.put(`/circulation/${id}/release`, { note })
      if (res.success === false) throw new Error(res.message || 'Failed to release')
      return res.step || res.data
    } catch (err) {
      setError(err.message || 'Failed to release')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Only callable once CLOSED, by whoever is currentHolderRole at close time
  // — enforced server-side (circulation.routes.js POST /:id/send-to-file),
  // not just hidden in the UI.
  const sendToFile = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post(`/circulation/${id}/send-to-file`, {})
      if (res.success === false) throw new Error(res.message || 'Failed to send to file')
      return res.recordsCopy || res.data
    } catch (err) {
      setError(err.message || 'Failed to send to file')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    inbox,
    timeline,
    paGateway,
    loading,
    error,
    fetchInbox,
    fetchTimeline,
    initiateCirculation,
    addStep,
    fetchPaGateway,
    releaseCirculation,
    sendToFile,
  }
}
