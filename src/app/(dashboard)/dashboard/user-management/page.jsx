'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  UserPlus, Users, UserCheck, UserX, Building2, Search, Pencil, 
  MoreVertical, AlertTriangle, Eye, EyeOff, Check, X
} from 'lucide-react'

const MOCK_USERS = [
  { id: 1, name: 'Lt. Gen. Nakibus Lakara', email: 'gm@uacc.go.ug',              role: 'GENERAL_MANAGER',  department: 'GENERAL_MANAGER_OFFICE',    isActive: true,  createdAt: '2026-01-15', lastLogin: '2026-06-26 07:30' },
  { id: 2, name: 'Patrick Katusabe',        email: 'it@uacc.go.ug',              role: 'IT_ADMINISTRATOR', department: 'FINANCE_AND_ADMINISTRATION', isActive: true,  createdAt: '2026-01-15', lastLogin: '2026-06-26 08:45' },
  { id: 3, name: 'Head Engineering',        email: 'engineering.head@uacc.go.ug', role: 'DEPARTMENT_HEAD', department: 'ENGINEERING',               isActive: true,  createdAt: '2026-01-20', lastLogin: '2026-06-25 09:10' },
  { id: 4, name: 'Staff Operations',        email: 'staff@uacc.go.ug',           role: 'STAFF',            department: 'OPERATIONS',                isActive: true,  createdAt: '2026-02-01', lastLogin: '2026-06-26 06:30' },
  { id: 5, name: 'Internal Auditor',        email: 'auditor@uacc.go.ug',         role: 'AUDITOR',          department: 'FINANCE_AND_ADMINISTRATION', isActive: true,  createdAt: '2026-02-10', lastLogin: '2026-06-24 14:00' },
  { id: 6, name: 'Head Pilots',             email: 'pilots.head@uacc.go.ug',     role: 'DEPARTMENT_HEAD',  department: 'PILOTS',                    isActive: false, createdAt: '2026-03-05', lastLogin: '2026-05-30 11:20' },
  { id: 7, name: 'Finance Officer',         email: 'finance@uacc.go.ug',         role: 'STAFF',            department: 'FINANCE_AND_ADMINISTRATION', isActive: true,  createdAt: '2026-03-15', lastLogin: '2026-06-25 10:00' },
]

const ROLES = [
  'GENERAL_MANAGER',
  'DEPARTMENT_HEAD',
  'STAFF',
  'IT_ADMINISTRATOR',
  'AUDITOR',
]

const DEPARTMENTS = [
  'GENERAL_MANAGER_OFFICE',
  'FINANCE_AND_ADMINISTRATION',
  'ENGINEERING',
  'PILOTS',
  'OPERATIONS',
]

const ROLE_COLORS = {
  GENERAL_MANAGER:  'bg-uacc-gold/20 text-uacc-gold border border-uacc-gold/30',
  DEPARTMENT_HEAD:  'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  STAFF:            'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  IT_ADMINISTRATOR: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  AUDITOR:          'bg-rose-500/20 text-rose-400 border border-rose-500/30',
}

const ROLE_DESCRIPTIONS = {
  GENERAL_MANAGER: "Full system access across all modules",
  DEPARTMENT_HEAD: "Approve requests and view department reports",
  STAFF: "Submit logs, requests and access documents",
  IT_ADMINISTRATOR: "Manage users and system configuration",
  AUDITOR: "Read-only access to audit trail and reports",
}

const formatString = (str) => {
  return str.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')
}

const getInitials = (name) => {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

export default function UserManagementPage() {
  const [users, setUsers] = useState(MOCK_USERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [deactivateConfirm, setDeactivateConfirm] = useState(null)
  const [toast, setToast] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '', email: '', role: 'STAFF',
    department: 'OPERATIONS', password: '', confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleShowToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        password: '',
        confirmPassword: ''
      })
    } else {
      setEditingUser(null)
      setFormData({
        name: '', email: '', role: 'STAFF',
        department: 'OPERATIONS', password: '', confirmPassword: '',
      })
    }
    setModalOpen(true)
  }

  const handleSaveUser = () => {
    // Basic validation
    if (!formData.name || !formData.email) return

    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? {
        ...u,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department
      } : u))
      handleShowToast("User details updated successfully.")
    } else {
      const newUser = {
        id: users.length + 1,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0],
        lastLogin: null
      }
      setUsers([...users, newUser])
      handleShowToast("User account created successfully.")
    }
    setModalOpen(false)
  }

  const handleToggleStatus = (user) => {
    if (user.isActive) {
      setDeactivateConfirm(user)
    } else {
      // Reactivate directly
      setUsers(users.map(u => u.id === user.id ? { ...u, isActive: true } : u))
      handleShowToast("User reactivated successfully.")
    }
  }

  const confirmDeactivate = () => {
    setUsers(users.map(u => u.id === deactivateConfirm.id ? { ...u, isActive: false } : u))
    setDeactivateConfirm(null)
    handleShowToast("User deactivated. They can no longer access DIMS.")
  }

  const getPasswordStrength = (pass) => {
    if (!pass) return { label: '', color: 'bg-transparent', width: 'w-0' }
    if (pass.length < 6) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/4' }
    if (pass.length < 8) return { label: 'Fair', color: 'bg-orange-500', width: 'w-2/4' }
    if (pass.length < 10) return { label: 'Good', color: 'bg-uacc-gold', width: 'w-3/4' }
    return { label: 'Strong', color: 'bg-green-500', width: 'w-full' }
  }
  
  const passwordStrength = getPasswordStrength(formData.password)

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            user.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRole = filterRole === 'ALL' || user.role === filterRole
      const matchesStatus = filterStatus === 'ALL' || 
                            (filterStatus === 'Active' && user.isActive) || 
                            (filterStatus === 'Inactive' && !user.isActive)
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchQuery, filterRole, filterStatus])

  // Stats
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.isActive).length
  const inactiveUsers = users.filter(u => !u.isActive).length
  const uniqueDepartments = new Set(users.map(u => u.department)).size

  return (
    <div className="p-6 md:p-8 w-full max-w-screen-2xl mx-auto min-h-screen pb-24">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">User Management</h1>
          <p className="text-white/60 text-sm">Manage system users, roles and access permissions</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="btn-primary flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-bold text-sm"
        >
          <UserPlus size={16} />
          Add New User
        </button>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card rounded-xl p-5 border border-white/5 bg-white/[0.02] flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-uacc-gold/20 flex items-center justify-center border border-uacc-gold/30 flex-shrink-0">
            <Users size={24} className="text-uacc-gold" />
          </div>
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1">Total Users</p>
            <p className="text-2xl font-bold text-white">{totalUsers}</p>
          </div>
        </div>
        <div className="card rounded-xl p-5 border border-white/5 bg-white/[0.02] flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30 flex-shrink-0">
            <UserCheck size={24} className="text-green-500" />
          </div>
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1">Active Users</p>
            <p className="text-2xl font-bold text-white">{activeUsers}</p>
          </div>
        </div>
        <div className="card rounded-xl p-5 border border-white/5 bg-white/[0.02] flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30 flex-shrink-0">
            <UserX size={24} className="text-red-500" />
          </div>
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1">Inactive Users</p>
            <p className="text-2xl font-bold text-white">{inactiveUsers}</p>
          </div>
        </div>
        <div className="card rounded-xl p-5 border border-white/5 bg-white/[0.02] flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 flex-shrink-0">
            <Building2 size={24} className="text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1">Departments</p>
            <p className="text-2xl font-bold text-white">{uniqueDepartments}</p>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="card rounded-xl p-4 mb-6 border border-white/5 bg-white/[0.02]">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-uacc-gold/50"
            />
          </div>
          
          <div className="flex gap-4 flex-col sm:flex-row">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-uacc-gold/50 appearance-none min-w-[150px]"
            >
              <option value="ALL">All Roles</option>
              {ROLES.map(role => (
                <option key={role} value={role}>{formatString(role)}</option>
              ))}
            </select>

            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
              {['ALL', 'Active', 'Inactive'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    filterStatus === status 
                      ? 'bg-uacc-gold/20 text-uacc-gold border border-uacc-gold/30' 
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-white/40">Showing {filteredUsers.length} of {totalUsers} users</span>
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="card rounded-xl overflow-visible border border-white/5 bg-white/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-6 py-4 text-xs font-bold text-white/50 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-white/50 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-white/50 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-xs font-bold text-white/50 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-white/50 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-4 text-xs font-bold text-white/50 uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-xs font-bold text-white/50 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-white/50 text-sm">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${ROLE_COLORS[user.role]}`}>
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{user.name}</p>
                          <p className="text-xs text-white/40">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md inline-flex ${ROLE_COLORS[user.role]}`}>
                        {formatString(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs text-white/60">
                        {formatString(user.department)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        onClick={() => handleToggleStatus(user)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${user.isActive ? 'bg-green-500' : 'bg-white/20'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${user.isActive ? 'translate-x-4.5' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-white/40">
                      {user.lastLogin || "Never"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-white/40">
                      {user.createdAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2 relative">
                        <button 
                          onClick={() => handleOpenModal(user)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-uacc-gold hover:bg-uacc-gold/10 transition-colors"
                          title="Edit User"
                        >
                          <Pencil size={16} />
                        </button>
                        
                        <div className="relative">
                          <button 
                            onClick={() => setDropdownOpen(dropdownOpen === user.id ? null : user.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {dropdownOpen === user.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(null)}></div>
                              <div className="absolute right-0 mt-2 w-48 bg-[#151515] border border-white/10 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                                <button className="w-full text-left px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                                  Reset Password
                                </button>
                                <button className="w-full text-left px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                                  View Activity
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={() => setModalOpen(false)}></div>
          <div className="relative w-full max-w-3xl card rounded-2xl p-8 border border-white/10 bg-[#121212] shadow-2xl overflow-y-auto max-h-[90vh] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pointer-events-auto">
            
            <button 
              onClick={() => setModalOpen(false)}
              className="absolute top-6 right-6 text-white/40 hover:text-white"
            >
              <X size={20} />
            </button>
            
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">
                {editingUser ? `Edit User — ${editingUser.name}` : "Add New User"}
              </h2>
              <p className="text-sm text-white/50">
                {editingUser ? "Update user details and permissions" : "Create a new DIMS user account"}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wider">Full Name *</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-uacc-gold/50"
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wider">Email Address *</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-uacc-gold/50"
                  placeholder="e.g. name@uacc.go.ug"
                  required
                />
                <p className="text-[10px] text-white/40 mt-1">Use official UACC email address (@uacc.go.ug)</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wider">Role</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-uacc-gold/50 appearance-none"
                >
                  {ROLES.map(role => (
                    <option key={role} value={role}>{formatString(role)}</option>
                  ))}
                </select>
                <p className="text-[10px] text-uacc-gold/80 mt-1.5">{ROLE_DESCRIPTIONS[formData.role]}</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wider">Department</label>
                <select 
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-uacc-gold/50 appearance-none"
                >
                  {DEPARTMENTS.map(dep => (
                    <option key={dep} value={dep}>{formatString(dep)}</option>
                  ))}
                </select>
              </div>

              {!editingUser && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-4 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-uacc-gold/50"
                        placeholder="Create password"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {formData.password && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full ${passwordStrength.width} ${passwordStrength.color} transition-all duration-300`}></div>
                        </div>
                        <span className={`text-[10px] uppercase font-bold w-12 text-right ${passwordStrength.color.replace('bg-', 'text-')}`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wider">Confirm Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-4 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-uacc-gold/50"
                        placeholder="Confirm password"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-8 pt-6 border-t border-white/10">
              <button 
                onClick={() => setModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-colors text-sm font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveUser}
                disabled={!formData.name || !formData.email || (!editingUser && formData.password !== formData.confirmPassword)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-uacc-gold/20 text-uacc-gold border border-uacc-gold/50 hover:bg-uacc-gold hover:text-white transition-colors text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingUser ? "Save User" : "Add User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEACTIVATE CONFIRMATION DIALOG */}
      {deactivateConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-auto" onClick={(e) => e.target === e.currentTarget && setDeactivateConfirm(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={() => setDeactivateConfirm(null)}></div>
          <div className="relative w-full max-w-sm card rounded-2xl p-6 border border-white/10 bg-[#121212] shadow-2xl flex flex-col items-center text-center pointer-events-auto">
            
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-500">
              <AlertTriangle size={32} />
            </div>
            
            <h3 className="text-lg font-bold text-white mb-2">Deactivate User?</h3>
            <p className="text-sm text-white/60 mb-6">
              Are you sure you want to deactivate <span className="font-bold text-white">{deactivateConfirm.name}</span>? They will immediately lose access to DIMS.
            </p>
            
            <div className="flex w-full gap-3">
              <button 
                onClick={() => setDeactivateConfirm(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-colors text-sm font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeactivate}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white transition-colors text-sm font-bold"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md ${
            toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-uacc-gold/10 border-uacc-gold/20 text-uacc-gold'
          }`}>
            <Check size={18} />
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}

    </div>
  )
}
