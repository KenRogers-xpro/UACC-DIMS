'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { motion } from 'framer-motion'
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
  X,
} from 'lucide-react'

// Navigation items with role access control
const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['GENERAL_MANAGER', 'DEPARTMENT_HEAD', 'STAFF',
            'IT_ADMINISTRATOR', 'AUDITOR', 'HR_MANAGER',
            'FINANCE_DIRECTOR', 'ACCOUNTS_OFFICER', 'MARKETING_OFFICER'],
  },
  {
    label: 'Documents',
    href: '/dashboard/documents',
    icon: FolderOpen,
    roles: ['GENERAL_MANAGER', 'DEPARTMENT_HEAD', 'STAFF',
            'IT_ADMINISTRATOR', 'AUDITOR', 'HR_MANAGER',
            'FINANCE_DIRECTOR', 'ACCOUNTS_OFFICER', 'MARKETING_OFFICER'],
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
            'IT_ADMINISTRATOR', 'AUDITOR', 'HR_MANAGER',
            'FINANCE_DIRECTOR', 'ACCOUNTS_OFFICER', 'MARKETING_OFFICER'],
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
]

const BOTTOM_NAV_ITEMS_ROLES = ['GENERAL_MANAGER', 'DEPARTMENT_HEAD', 'STAFF',
                                 'IT_ADMINISTRATOR', 'AUDITOR']

const PA_NAV_ITEMS = [
  { label: 'Dashboard',  href: '/dashboard',            icon: LayoutDashboard },
  { label: 'GM Inbox',   href: '/dashboard/pa-inbox',   icon: Inbox },
  { label: 'Schedule',   href: '/dashboard/schedule',   icon: CalendarClock },
  { label: 'Drafts',     href: '/dashboard/drafts',     icon: FileText },
  { label: 'Documents',  href: '/dashboard/documents',  icon: FolderOpen },
]

const PO_NAV_ITEMS = [
  { label: 'Dashboard',     href: '/dashboard',                 icon: LayoutDashboard },
  { label: 'Procurement',   href: '/dashboard/procurement',     icon: ClipboardList },
  { label: 'Activity Logs', href: '/dashboard/activity-logs',   icon: Clock },
]

const ROLE_META = {
  GENERAL_MANAGER:       { label: 'General Manager',      color: 'text-uacc-gold',    dot: 'bg-uacc-gold' },
  GM_PERSONAL_ASSISTANT: { label: 'GM Personal Asst.',    color: 'text-uacc-gold',    dot: 'bg-uacc-gold' },
  DEPARTMENT_HEAD:       { label: 'Department Head',       color: 'text-blue-400',     dot: 'bg-blue-400' },
  STAFF:                 { label: 'Staff',                 color: 'text-emerald-400',  dot: 'bg-emerald-400' },
  IT_ADMINISTRATOR:      { label: 'IT Administrator',      color: 'text-purple-400',   dot: 'bg-purple-400' },
  AUDITOR:               { label: 'Auditor',               color: 'text-rose-400',     dot: 'bg-rose-400' },
  RECORDS_EXECUTIVE:     { label: 'Records Executive',     color: 'text-amber-400',    dot: 'bg-amber-400' },
  PROCUREMENT_OFFICER:   { label: 'Procurement Officer',   color: 'text-orange-400',   dot: 'bg-orange-400' },
  HR_MANAGER:            { label: 'HR Manager',            color: 'text-pink-400',     dot: 'bg-pink-400' },
  FINANCE_DIRECTOR:      { label: 'Finance Director',       color: 'text-teal-400',     dot: 'bg-teal-400' },
  ACCOUNTS_OFFICER:      { label: 'Accounts Officer',       color: 'text-cyan-400',     dot: 'bg-cyan-400' },
  MARKETING_OFFICER:     { label: 'Marketing Officer',      color: 'text-indigo-400',   dot: 'bg-indigo-400' },
}

export default function Sidebar({ user, collapsed, mobileOpen, onMobileClose }) {
  const pathname = usePathname()
  const { logout } = useAuth()
  const userRole = user?.role || 'STAFF'
  const roleMeta = ROLE_META[userRole] || ROLE_META.STAFF

  const mainNav = userRole === 'GM_PERSONAL_ASSISTANT'
    ? PA_NAV_ITEMS
    : userRole === 'PROCUREMENT_OFFICER'
    ? PO_NAV_ITEMS
    : NAV_ITEMS.filter(item => item.roles.includes(userRole))

  const showSettings = userRole !== 'PROCUREMENT_OFFICER'

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`sidebar hidden md:flex flex-col fixed top-0 left-0 h-screen z-40
                    transition-all duration-300 overflow-hidden
                    ${collapsed ? 'w-[68px]' : 'w-[240px]'}`}
      >
        <SidebarContent
          user={user}
          roleMeta={roleMeta}
          mainNav={mainNav}
          showSettings={showSettings}
          pathname={pathname}
          collapsed={collapsed}
          onSignOut={logout}
        />
      </aside>

      {/* Mobile Drawer */}
      <aside
        className={`sidebar flex md:hidden flex-col fixed top-0 left-0 h-screen z-40 w-[272px]
                    transition-transform duration-300
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ boxShadow: '6px 0 32px rgba(0,0,0,0.6)' }}
      >
        <SidebarContent
          user={user}
          roleMeta={roleMeta}
          mainNav={mainNav}
          showSettings={showSettings}
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
  user, roleMeta, mainNav, showSettings, pathname,
  collapsed, onSignOut, onMobileClose, isMobile = false,
}) {
  return (
    <div className="flex flex-col h-full">

      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-4 h-[60px] flex-shrink-0"
           style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex-shrink-0">
          <Image
            src="/logo.png"
            alt="UACC"
            width={28}
            height={28}
            className="w-7 h-7 object-contain"
          />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight overflow-hidden">
            <span className="font-heading font-bold text-white text-sm tracking-wide truncate">
              UACC DIMS
            </span>
            <span className="text-[9px] uppercase tracking-[0.18em]"
                  style={{ color: 'rgba(201,151,58,0.7)' }}>
              Secure Platform · v1.0
            </span>
          </div>
        )}
        {isMobile && (
          <button
            onClick={onMobileClose}
            className="ml-auto p-1.5 rounded-md text-white/40 hover:text-white hover:bg-white/8 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── User Info ── */}
      {!collapsed ? (
        <div className="mx-3 mt-4 mb-1 p-3 rounded-lg"
             style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center
                            font-heading font-bold text-xs text-white flex-shrink-0"
                 style={{ background: 'rgba(201,151,58,0.2)', border: '1px solid rgba(201,151,58,0.35)' }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate font-heading leading-tight">
                {user?.name || 'User'}
              </p>
              <p className="text-[10px] truncate leading-tight mt-0.5" style={{ color: 'rgba(120,135,155,0.9)' }}>
                {user?.email}
              </p>
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${roleMeta.dot}`} />
            <span className={`text-[9px] font-heading font-bold uppercase tracking-[0.12em] ${roleMeta.color}`}>
              {roleMeta.label}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex justify-center mt-4 mb-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center
                          font-heading font-bold text-xs text-white"
               style={{ background: 'rgba(201,151,58,0.2)', border: '1px solid rgba(201,151,58,0.35)' }}
               title={user?.name}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      )}

      {/* ── Nav Section Label ── */}
      {!collapsed && (
        <p className="px-4 mt-5 mb-1.5 text-[9px] uppercase tracking-[0.22em] font-heading font-semibold"
           style={{ color: 'rgba(255,255,255,0.20)' }}>
          Main Menu
        </p>
      )}

      {/* ── Nav Items ── */}
      <nav className="flex-1 px-2 overflow-y-auto overflow-x-hidden">
        <motion.ul 
          className="flex flex-col gap-0.5"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05, delayChildren: 0 }
            }
          }}
        >
          {mainNav.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <motion.li 
                key={item.href}
                variants={{
                  hidden: { opacity: 0, x: -10 },
                  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
                }}
              >
                <Link
                  href={item.href}
                  className={`sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-md
                              text-sm relative group ${isActive ? 'active' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  {/* Animated active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-indicator"
                      className="absolute left-0 top-0 bottom-0 w-0.5 bg-uacc-gold rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 60 }}
                    />
                  )}
                
                  <Icon
                    size={16}
                    className={`flex-shrink-0 ${isActive ? 'text-uacc-gold' : ''}`}
                  />
                  {!collapsed && (
                    <>
                      <span className="flex-1 font-heading font-medium text-[12px]
                                       tracking-wide truncate">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded
                                          font-heading tracking-wider leading-none
                                          ${item.badge === 'AI'
                                            ? 'bg-uacc-gold/15 text-uacc-gold border border-uacc-gold/25'
                                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                                          }`}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </motion.li>
            )
          })}
        </motion.ul>
      </nav>

      {/* ── Bottom Items: Settings + Sign Out ── */}
      <div className="px-2 pb-3 mt-auto flex flex-col gap-0.5"
           style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
        {showSettings && (
          <Link
            href="/dashboard/settings"
            className={`sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-md text-sm
                        ${pathname === '/dashboard/settings' ? 'active' : ''}`}
            title={collapsed ? 'Settings' : undefined}
          >
            <Settings2 size={16} className={`flex-shrink-0 ${pathname === '/dashboard/settings' ? 'text-uacc-gold' : ''}`} />
            {!collapsed && (
              <span className="font-heading font-medium text-[12px] tracking-wide">
                Settings
              </span>
            )}
          </Link>
        )}
        <button
          onClick={onSignOut}
          className="sidebar-item sidebar-signout w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm"
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && (
            <span className="font-heading font-medium text-[12px] tracking-wide">
              Sign Out
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
