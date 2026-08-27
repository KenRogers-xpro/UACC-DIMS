import { useState, useCallback } from 'react'
import api from './api'

export function useProcurement() {
  const [requests, setRequests] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // The page shows every request in one table with client-side tab/search
  // filtering (same pattern the mock data used), so this always fetches the
  // full unfiltered set — status/search stay out of the query string — and
  // stat cards + tab badges are derived from this one array. No second query.
  const fetchRequests = useCallback(async (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))
    ).toString()

    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/procurement${query ? `?${query}` : ''}`)
      if (!res.success) throw new Error(res.message || 'Failed to fetch procurement requests')
      const data = res.data?.requests || []
      setRequests(data)
      setPagination(res.data?.pagination || null)
      return data
    } catch (err) {
      setError(err.message || 'Failed to fetch procurement requests')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createRequest = useCallback(async (data) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post('/procurement', data)
      if (!res.success) throw new Error(res.message || 'Failed to submit request')
      return res
    } catch (err) {
      setError(err.message || 'Failed to submit request')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const decide = useCallback(async (id, decisionData) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.patch(`/procurement/${id}/decision`, decisionData)
      if (!res.success) throw new Error(res.message || 'Failed to record decision')
      return res
    } catch (err) {
      setError(err.message || 'Failed to record decision')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    requests,
    pagination,
    loading,
    error,
    fetchRequests,
    createRequest,
    decide,
  }
}
