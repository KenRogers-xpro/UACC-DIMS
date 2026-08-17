import { useState, useCallback } from 'react'
import api from './api'
import { useStore } from './store'

export function useDocuments() {
  const [documents, setDocuments] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const documentsCache = useStore((state) => state.documentsCache)
  const setDocumentsCache = useStore((state) => state.setDocumentsCache)

  const fetchDocuments = useCallback(async (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))
    ).toString()
    const cacheKey = query || 'all'

    // Check cache: fresh if under 30 seconds old
    const cachedEntry = documentsCache[cacheKey]
    const cacheTTL = 30000 // 30 seconds
    if (cachedEntry && (Date.now() - cachedEntry.ts < cacheTTL)) {
      setDocuments(cachedEntry.data.documents)
      setPagination(cachedEntry.data.pagination)
      return cachedEntry.data.documents
    }

    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/documents${query ? `?${query}` : ''}`)
      const data = res.data?.documents || res.documents || []
      const paginationData = res.data?.pagination || res.pagination || null
      setDocuments(data)
      setPagination(paginationData)

      // Store in cache
      setDocumentsCache(cacheKey, { documents: data, pagination: paginationData })

      return data
    } catch (err) {
      setError(err.message || 'Failed to fetch documents')
      throw err
    } finally {
      setLoading(false)
    }
  }, [documentsCache, setDocumentsCache])

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
      // Clear documents cache on upload
      useStore.getState().clearDocumentsCache()
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
      // Clear documents cache on update
      useStore.getState().clearDocumentsCache()
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
      // Clear documents cache on submit
      useStore.getState().clearDocumentsCache()
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
      // Clear documents cache on delete
      useStore.getState().clearDocumentsCache()
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
