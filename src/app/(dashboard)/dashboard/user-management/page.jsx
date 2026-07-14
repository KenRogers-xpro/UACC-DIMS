'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus, Search, Pencil, KeyRound, UserX, UserCheck, X,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useUsers } from '@/lib/useUsers'
import { useOnlineStatus } from '@/lib/useOnlineStatus'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import StatusDot from '@/components/ui/StatusDot'
import { SkeletonLine } from '@/components/ui/SkeletonLoader'

const ROLES = [
  'GENERAL_MANAGER', 'GM_PERSONAL_ASSISTANT', 'DEPARTMENT_HEAD', 'STAFF',
  'IT_ADMINISTRATOR', 'INTERNAL_AUDITOR', 'RECORDS_EXECUTIVE',
  'PROCUREMENT_OFFICER', 'HR_MANAGER', 'FINANCE_DIRECTOR',
  'MARKETING_OFFICER', 'CORPORATION_SECRETARY',
]

const DEPARTMENTS = [
  'GENERAL_MANAGER_OFFICE', 'FINANCE_AND_ADMINISTRATION', 'ENGINEERING',
  'PILOTS', 'OPERATIONS', 'HUMAN_RESOURCES', 'FINANCE_AND_ACCOUNTS', 'MARKETING',
]

const formatEnum = (str = '') => str.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())

const emptyForm = { name: '', email: '', password: '', role: 'STAFF', department: 'OPERATIONS' }

export default function UserManagementPage() {
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useAuth()
  const {
    users, loading, error,
    fetchUsers, createUser, updateUser, deactivateUser, reactivateUser, resetPassword,
  } = useUsers()
  const { isUserOnline } = useOnlineStatus()

  // Backend already enforces IT_ADMINISTRATOR-only via authorize() on every
  // endpoint this page calls — this is just so a non-admin who navigates
  // here directly lands back on their own dashboard instead of a broken
  // empty page.
  useEffect(() => {
    if (!authLoading && currentUser && currentUser.role !== 'IT_ADMINISTRATOR') {
      router.push('/dashboard')
    }
  }, [authLoading, currentUser, router])

  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(emptyForm)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', role: '', department: '' })
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const [confirmAction, setConfirmAction] = useState(null) // { type, user }
  const [actingOn, setActingOn] = useState(false)

  const [toast, setToast] = useState('')

  const refresh = useCallback(() => {
    fetchUsers({
      search: searchTerm,
      role: roleFilter !== 'ALL' ? roleFilter : '',
      status: statusFilter !== 'ALL' ? statusFilter : '',
    }).catch(() => {})
  }, [fetchUsers, searchTerm, roleFilter, statusFilter])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    try {
      await createUser(createForm)
      setCreateOpen(false)
      setCreateForm(emptyForm)
      setToast('User created — welcome email queued')
      refresh()
    } catch (err) {
      setCreateError(err.message || 'Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (u) => {
    setEditingUser(u)
    setEditForm({ name: u.name, role: u.role, department: u.department })
    setEditError('')
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setEditError('')
    try {
      await updateUser(editingUser.id, editForm)
      setEditingUser(null)
      setToast('User updated')
      refresh()
    } catch (err) {
      setEditError(err.message || 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmedAction = async () => {
    if (!confirmAction) return
    setActingOn(true)
    try {
      if (confirmAction.type === 'DEACTIVATE') {
        await deactivateUser(confirmAction.user.id)
        setToast(`${confirmAction.user.name} deactivated`)
      } else if (confirmAction.type === 'REACTIVATE') {
        await reactivateUser(confirmAction.user.id)
        setToast(`${confirmAction.user.name} reactivated`)
      } else if (confirmAction.type === 'RESET_PASSWORD') {
        await resetPassword(confirmAction.user.id)
        setToast(`Password reset for ${confirmAction.user.name}`)
      }
      setConfirmAction(null)
      refresh()
    } catch (err) {
      setToast(err.message || 'Action failed')
    } finally {
      setActingOn(false)
    }
  }

  if (currentUser && currentUser.role !== 'IT_ADMINISTRATOR') return null

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn relative">
      <PageHeader title="User Management" subtitle="Manage system users, roles, and access">
        <Button variant="primary" icon={UserPlus} onClick={() => setCreateOpen(true)}>Create User</Button>
      </PageHeader>

      {/* Filters */}
      <div className="card rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            className="input-field pl-9 w-full"
            placeholder="Search name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="input-field w-full sm:w-52" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="ALL">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{formatEnum(r)}</option>)}
        </select>
        <select className="input-field w-full sm:w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="card rounded-xl overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="p-6 flex flex-col gap-3">
            <SkeletonLine height="h-10" /><SkeletonLine height="h-10" /><SkeletonLine height="h-10" />
          </div>
        ) : error ? (
          <p className="p-6 text-sm text-uacc-red">{error}</p>
        ) : users.length === 0 ? (
          <div className="p-8">
            <EmptyState icon={UserPlus} title="No users found" message="Try adjusting your search or filters." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr className="text-left">
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>User</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Role</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Department</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-right" style={{ color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <StatusDot online={u.isOnline || isUserOnline(u.id)} size={7} />
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{u.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{formatEnum(u.role)}</td>
                    <td className="p-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{formatEnum(u.department)}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        u.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-[var(--text-faint)] border border-white/10'
                      }`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded hover:bg-white/5" style={{ color: 'var(--text-muted)' }} title="Edit">
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setConfirmAction({ type: 'RESET_PASSWORD', user: u })}
                          className="p-1.5 rounded hover:bg-white/5"
                          style={{ color: 'var(--text-muted)' }}
                          title="Reset Password"
                        >
                          <KeyRound size={15} />
                        </button>
                        {u.isActive ? (
                          <button
                            onClick={() => setConfirmAction({ type: 'DEACTIVATE', user: u })}
                            disabled={u.id === currentUser?.id}
                            className="p-1.5 rounded hover:bg-uacc-red/10 hover:text-uacc-red disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{ color: 'var(--text-muted)' }}
                            title={u.id === currentUser?.id ? "You can't deactivate yourself" : 'Deactivate'}
                          >
                            <UserX size={15} />
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmAction({ type: 'REACTIVATE', user: u })}
                            className="p-1.5 rounded hover:bg-emerald-500/10 hover:text-emerald-400"
                            style={{ color: 'var(--text-muted)' }}
                            title="Reactivate"
                          >
                            <UserCheck size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      <AnimatePresence>
        {createOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <motion.div
              className="card rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4"
              style={{ background: 'var(--bg-surface)' }}
              initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Create User</h2>
                <button onClick={() => setCreateOpen(false)} className="p-1 hover:bg-white/5 rounded-lg" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
              </div>
              <form onSubmit={handleCreate} className="flex flex-col gap-3">
                <input className="input-field w-full" placeholder="Full name" value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} />
                <input className="input-field w-full" type="email" placeholder="Email" value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} />
                <input className="input-field w-full" type="password" placeholder="Initial password (min 6 chars)" value={createForm.password} onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))} />
                <div className="grid grid-cols-2 gap-3">
                  <select className="input-field w-full" value={createForm.role} onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}>
                    {ROLES.map((r) => <option key={r} value={r}>{formatEnum(r)}</option>)}
                  </select>
                  <select className="input-field w-full" value={createForm.department} onChange={(e) => setCreateForm((f) => ({ ...f, department: e.target.value }))}>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{formatEnum(d)}</option>)}
                  </select>
                </div>
                {createError && <p className="text-xs text-uacc-red">{createError}</p>}
                <div className="flex justify-end gap-3 mt-1">
                  <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button variant="primary" type="submit" loading={creating}>Create User</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT USER MODAL */}
      <AnimatePresence>
        {editingUser && (
          <motion.div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <motion.div
              className="card rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4"
              style={{ background: 'var(--bg-surface)' }}
              initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Edit User</h2>
                <button onClick={() => setEditingUser(null)} className="p-1 hover:bg-white/5 rounded-lg" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
              </div>
              <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
                <input className="input-field w-full" placeholder="Full name" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                <div className="grid grid-cols-2 gap-3">
                  <select className="input-field w-full" value={editForm.role} onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}>
                    {ROLES.map((r) => <option key={r} value={r}>{formatEnum(r)}</option>)}
                  </select>
                  <select className="input-field w-full" value={editForm.department} onChange={(e) => setEditForm((f) => ({ ...f, department: e.target.value }))}>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{formatEnum(d)}</option>)}
                  </select>
                </div>
                {editError && <p className="text-xs text-uacc-red">{editError}</p>}
                <div className="flex justify-end gap-3 mt-1">
                  <Button variant="outline" type="button" onClick={() => setEditingUser(null)}>Cancel</Button>
                  <Button variant="primary" type="submit" loading={saving}>Save Changes</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFIRM ACTION MODAL (deactivate / reactivate / reset password) */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <motion.div
              className="card rounded-2xl w-full max-w-sm p-6 flex flex-col items-center text-center gap-3"
              style={{ background: 'var(--bg-surface)' }}
              initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <h3 className="font-heading font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                {confirmAction.type === 'DEACTIVATE' && `Deactivate ${confirmAction.user.name}?`}
                {confirmAction.type === 'REACTIVATE' && `Reactivate ${confirmAction.user.name}?`}
                {confirmAction.type === 'RESET_PASSWORD' && `Reset password for ${confirmAction.user.name}?`}
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {confirmAction.type === 'DEACTIVATE' && "They won't be able to log in, but their history stays intact."}
                {confirmAction.type === 'REACTIVATE' && 'They will be able to log in again immediately.'}
                {confirmAction.type === 'RESET_PASSWORD' && "A new temporary password will be generated and emailed to them — it won't be shown here."}
              </p>
              <div className="flex justify-center gap-3 w-full mt-2">
                <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
                <Button variant={confirmAction.type === 'DEACTIVATE' ? 'danger' : 'primary'} onClick={handleConfirmedAction} loading={actingOn}>
                  Confirm
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOAST */}
      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${toast ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0 pointer-events-none'}`}>
        <div className="card rounded-xl px-5 py-4 flex items-center gap-3" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-card)' }}>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{toast}</span>
        </div>
      </div>
    </div>
  )
}
