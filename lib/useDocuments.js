import { useState, useCallback } from 'react'
import api from './api'

export function useDocuments() {
  const [documents, setDocuments] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchDocuments = useCallback(async (params = {}) => {
    setLoading(true)
    setError(null)
    try {
      const query = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))
      ).toString()
      const res = await api.get(`/documents${query ? `?${query}` : ''}`)
      const data = res.data?.documents || res.documents || []
      setDocuments(data)
      setPagination(res.data?.pagination || res.pagination || null)
      return data
    } catch (err) {
      setError(err.message || 'Failed to fetch documents')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const semanticSearch = useCallback(async (query, limit = 10) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/documents/search/semantic?q=${encodeURIComponent(query)}&limit=${limit}`)
      if (!res.success) throw new Error(res.message || 'Semantic search failed')
      const data = res.data || []
      setDocuments(data)
      setPagination(null)
      return data
    } catch (err) {
      setError(err.message || 'Semantic search failed')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDocument = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/documents/${id}`)
      return res.data
    } catch (err) {
      setError(err.message || 'Failed to fetch document')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const uploadDocument = useCallback(async (formData) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post('/documents', formData)
      if (!res.success) throw new Error(res.message || 'Failed to upload document')
      return res.data
    } catch (err) {
      setError(err.message || 'Failed to upload document')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateDocument = useCallback(async (id, data) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.put(`/documents/${id}`, data)
      if (!res.success) throw new Error(res.message || 'Failed to update document')
      return res.data
    } catch (err) {
      setError(err.message || 'Failed to update document')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const submitDocument = useCallback(async (id, toRole, instruction, ccRoles) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post(`/documents/${id}/submit`, { toRole, instruction, ccRoles })
      if (!res.success) throw new Error(res.message || 'Failed to submit document')
      return res.data
    } catch (err) {
      setError(err.message || 'Failed to submit document')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteDocument = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.delete(`/documents/${id}`)
      if (!res.success) throw new Error(res.message || 'Failed to delete document')
      return res.data
    } catch (err) {
      setError(err.message || 'Failed to delete document')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    documents,
    pagination,
    loading,
    error,
    fetchDocuments,
    semanticSearch,
    fetchDocument,
    uploadDocument,
    updateDocument,
    submitDocument,
    deleteDocument,
  }
}
