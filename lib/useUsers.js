import { useState, useCallback } from 'react'
import api from './api'

export function useUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchUsers = useCallback(async (params = {}) => {
    setLoading(true)
    setError(null)
    try {
      const query = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v))
      ).toString()
      const res = await api.get(`/users${query ? `?${query}` : ''}`)
      if (!res.success) throw new Error(res.message || 'Failed to fetch users')
      setUsers(res.data || [])
      return res.data
    } catch (err) {
      setError(err.message || 'Failed to fetch users')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createUser = useCallback(async (data) => {
    const res = await api.post('/users', data)
    if (!res.success) throw new Error(res.message || 'Failed to create user')
    return res.data
  }, [])

  const updateUser = useCallback(async (id, data) => {
    const res = await api.put(`/users/${id}`, data)
    if (!res.success) throw new Error(res.message || 'Failed to update user')
    return res.data
  }, [])

  const deactivateUser = useCallback(async (id) => {
    const res = await api.put(`/users/${id}/deactivate`)
    if (!res.success) throw new Error(res.message || 'Failed to deactivate user')
    return res.data
  }, [])

  const reactivateUser = useCallback(async (id) => {
    const res = await api.put(`/users/${id}/reactivate`)
    if (!res.success) throw new Error(res.message || 'Failed to reactivate user')
    return res.data
  }, [])

  const resetPassword = useCallback(async (id) => {
    const res = await api.put(`/users/${id}/reset-password`)
    if (!res.success) throw new Error(res.message || 'Failed to reset password')
    return res.data
  }, [])

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deactivateUser,
    reactivateUser,
    resetPassword,
  }
}
