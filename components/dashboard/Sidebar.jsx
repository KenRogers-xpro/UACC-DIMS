'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import {
  LayoutDashboard,
  FolderOpen,
  ClipboardList,
  Clock,
  BarChart2,
  Users,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bot,
  Settings2,
  BookOpen,
  Inbox,
  CalendarClock,
  FileText,
} from 'lucide-react'

// Navigation items with role access control
const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['GENERAL_MANAGER', 'DEPARTMENT_HEAD', 'STAFF',
            'IT_ADMINISTRATOR', 'AUDITOR'],
  },
  {
    label: 'Documents',
    href: '/dashboard/documents',
    icon: FolderOpen,
    roles: ['GENERAL_MANAGER', 'DEPARTMENT_HEAD', 'STAFF',
            'IT_ADMINISTRATOR', 'AUDITOR'],
  },
  {
    label: 'Records',
    href: '/dashboard/records',
    icon: BookOpen,
    roles: ['GENERAL_MANAGER', 'DEPARTMENT_HEAD', 'STAFF',
            'IT_ADMINISTRATOR', 'AUDITOR', 'RECORDS_EXECUTIVE'],
    badge: 'NEW',
  },
  {
    label: 'Procurement',
    href: '/dashboard/procurement',
    icon: ClipboardList,
    roles: ['GENERAL_MANAGER', 'DEPARTMENT_HEAD', 'STAFF',
            'IT_ADMINISTRATOR', 'PROCUREMENT_OFFICER'],
  },
  {
    label: 'Activity Logs',
    href: '/dashboard/activity-logs',
    icon: Clock,
    roles: ['GENERAL_MANAGER', 'DEPARTMENT_HEAD', 'STAFF',
            'IT_ADMINISTRATOR', 'AUDITOR'],
  },
  {
    label: 'Reports',
    href: '/dashboard/reports',
    icon: BarChart2,
    roles: ['GENERAL_MANAGER', 'DEPARTMENT_HEAD', 'IT_ADMINISTRATOR',
            'AUDITOR'],
  },
  {
    label: 'User Management',
    href: '/dashboard/user-management',
    icon: Users,
    roles: ['IT_ADMINISTRATOR'],
  },
  {
    label: 'Audit Trail',
    href: '/dashboard/audit-trail',
    icon: ShieldCheck,
    roles: ['AUDITOR', 'GENERAL_MANAGER', 'IT_ADMINISTRATOR'],
  },
  {
    label: 'AI Agent',
    href: '/dashboard/ai-agent',
    icon: Bot,
    roles: ['GENERAL_MANAGER', 'DEPARTMENT_HEAD', 'IT_ADMINISTRATOR'],
    badge: 'AI',
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings2,
    roles: ['GENERAL_MANAGER', 'DEPARTMENT_HEAD', 'STAFF',
            'IT_ADMINISTRATOR', 'AUDITOR'],
  },
]

const PA_NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'GM Inbox',
    href: '/dashboard/pa-inbox',
    icon: Inbox,
  },
  {
    label: 'Schedule',
    href: '/dashboard/schedule',
    icon: CalendarClock,
  },
  {
    label: 'Drafts',
    href: '/dashboard/drafts',
    icon: FileText,
  },
  {
    label: 'Documents',
    href: '/dashboard/documents',
    icon: FolderOpen,
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings2,
  },
]

const PO_NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Procurement',
    href: '/dashboard/procurement',
    icon: ClipboardList,
  },
  {
    label: 'Activity Logs',
    href: '/dashboard/activity-logs',
    icon: Clock,
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings2,
  },
]

// Role display labels and badge colors
const ROLE_META = {
  GENERAL_MANAGER:  { label: 'General Manager',  color: 'bg-uacc-gold/20 text-uacc-gold' },
  GM_PERSONAL_ASSISTANT: { label: 'GM Personal Assistant', color: 'bg-uacc-gold/20 text-uacc-gold' },
  DEPARTMENT_HEAD:  { label: 'Department Head',   color: 'bg-blue-500/20 text-blue-400' },
  STAFF:            { label: 'Staff',              color: 'bg-emerald-500/20 text-emerald-400' },
  IT_ADMINISTRATOR: { label: 'IT Administrator',  color: 'bg-purple-500/20 text-purple-400' },
  AUDITOR:          { label: 'Auditor',            color: 'bg-rose-500/20 text-rose-400' },
  RECORDS_EXECUTIVE:{ label: 'Records Executive',  color: 'bg-teal-500/20 text-teal-400' },
  PROCUREMENT_OFFICER: { label: 'Procurement Officer', color: 'bg-amber-500/20 text-amber-400' },
}

export default function Sidebar({
  user,
  collapsed,
  mobileOpen,
  onMobileClose,
}) {
  const pathname = usePathname()
  const { logout } = useAuth()
  const userRole = user?.role || 'STAFF'
  const roleMeta = ROLE_META[userRole] || ROLE_META.STAFF

  // Filter nav items based on user role
  const visibleNav = userRole === 'GM_PERSONAL_ASSISTANT'
    ? PA_NAV_ITEMS
    : userRole === 'PROCUREMENT_OFFICER'
    ? PO_NAV_ITEMS
    : NAV_ITEMS.filter(item => item.roles.includes(userRole))

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside
        className={`
          sidebar hidden md:flex flex-col fixed top-0 left-0 h-screen z-40
          transition-all duration-300 overflow-hidden
          ${collapsed ? 'w-[72px]' : 'w-[240px]'}
        `}
        style={{ boxShadow: '2px 0 12px rgba(0,0,0,0.3)' }}
      >
        <SidebarContent
          user={user}
          roleMeta={roleMeta}
          visibleNav={visibleNav}
          pathname={pathname}
          collapsed={collapsed}
          onSignOut={logout}
        />
      </aside>

      {/* ── Mobile Drawer Sidebar ── */}
      <aside
        className={`
          sidebar flex md:hidden flex-col fixed top-0 left-0 h-screen z-40 w-[280px]
          transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ boxShadow: '4px 0 24px rgba(0,0,0,0.5)' }}
      >
        <SidebarContent
          user={user}
          roleMeta={roleMeta}
          visibleNav={visibleNav}
          pathname={pathname}
          collapsed={false}
          onSignOut={logout}
          onMobileClose={onMobileClose}
          isMobile
        />
      </aside>
    </>
  )
}

function SidebarContent({
  user,
  roleMeta,
  visibleNav,
  pathname,
  collapsed,
  onSignOut,
  onMobileClose,
  isMobile = false,
}) {
  return (
    <div className="flex flex-col h-full">

      {/* ── Logo Area ── */}
      <div
        className="flex items-center gap-3 px-4 py-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Image
          src="/logo.png"
          alt="UACC"
          width={32}
          height={32}
          className="w-8 h-8 object-contain flex-shrink-0"
        />
        {!collapsed && (
          <div className="flex flex-col leading-tight overflow-hidden">
            <span className="font-heading font-bold text-white text-sm tracking-wide truncate">
              UACC DIMS
            </span>
            <span className="text-[9px] uppercase tracking-widest"
              style={{ color: 'var(--sidebar-text)' }}>
              v1.0 · Secure Platform
            </span>
          </div>
        )}
        {/* Mobile close button */}
        {isMobile && (
          <button
            onClick={onMobileClose}
            className="ml-auto p-1 rounded hover:bg-white/10 text-white/60
                       hover:text-white transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* ── User Info Card ── */}
      {!collapsed && (
        <div
          className="mx-3 mt-4 mb-2 p-3 rounded-lg"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Avatar circle */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center
                         font-heading font-bold text-sm text-white flex-shrink-0"
              style={{ background: 'rgba(201,151,58,0.25)', border: '1px solid rgba(201,151,58,0.4)' }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate font-heading">
                {user?.name || 'User'}
              </p>
              <p className="text-[10px] truncate" style={{ color: 'var(--sidebar-text)' }}>
                {user?.email}
              </p>
            </div>
          </div>
          {/* Role badge */}
          <div className="mt-2">
            <span className={`text-[9px] font-heading font-bold uppercase
                             tracking-wider px-2 py-0.5 rounded-full ${roleMeta.color}`}>
              {roleMeta.label}
            </span>
          </div>
        </div>
      )}

      {/* Collapsed avatar */}
      {collapsed && (
        <div className="flex justify-center mt-4 mb-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center
                       font-heading font-bold text-sm text-white"
            style={{ background: 'rgba(201,151,58,0.25)', border: '1px solid rgba(201,151,58,0.4)' }}
            title={user?.name}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      )}

      {/* ── Navigation Section Label ── */}
      {!collapsed && (
        <p className="px-4 mt-4 mb-2 text-[9px] uppercase tracking-[0.2em] font-heading font-semibold"
          style={{ color: 'rgba(255,255,255,0.25)' }}>
          Navigation
        </p>
      )}

      {/* ── Nav Items ── */}
      <nav className="flex-1 px-2 overflow-y-auto">
        <ul className="flex flex-col gap-1">
          {visibleNav.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg
                              text-sm transition-all duration-200
                              ${isActive ? 'active' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    size={18}
                    className={`flex-shrink-0 transition-colors ${
                      isActive ? 'text-uacc-gold' : ''
                    }`}
                  />
                  {!collapsed && (
                    <>
                      <span className="flex-1 font-heading font-medium text-xs
                                       tracking-wide truncate">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded
                                         bg-uacc-gold/20 text-uacc-gold font-heading
                                         tracking-wider">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ── Sign Out Button ── */}
      <div
        className="p-3 mt-auto"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        <button
          onClick={onSignOut}
          className={`sidebar-item w-full flex items-center gap-3 px-3 py-2.5
                      rounded-lg text-sm transition-all duration-200
                      hover:bg-uacc-red/10 hover:text-red-400`}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && (
            <span className="font-heading font-medium text-xs tracking-wide">
              Sign Out
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
