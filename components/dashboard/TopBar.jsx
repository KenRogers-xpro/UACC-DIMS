'use client'
import { usePathname } from 'next/navigation'
import { Menu, Bell, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'

const PAGE_TITLES = {
  '/dashboard':                 { title: 'Dashboard',       sub: 'Overview of operational activities' },
  '/dashboard/documents':       { title: 'Documents',        sub: 'Upload, search and retrieve files' },
  '/dashboard/records':         { title: 'Records',          sub: 'Official registry and archives' },
  '/dashboard/procurement':     { title: 'Procurement',      sub: 'Requests and approval workflow' },
  '/dashboard/activity-logs':   { title: 'Activity Logs',    sub: 'Staff daily activity records' },
  '/dashboard/reports':         { title: 'Reports',          sub: 'Analytics and exported reports' },
  '/dashboard/user-management': { title: 'User Management',  sub: 'Manage system users and roles' },
  '/dashboard/audit-trail':     { title: 'Audit Trail',      sub: 'Full system activity log' },
  '/dashboard/ai-agent':        { title: 'AI Agent',         sub: 'Intelligent operational assistant' },
  '/dashboard/settings':        { title: 'Settings',         sub: 'Account and system preferences' },
  '/dashboard/pa-inbox':        { title: 'GM Inbox',         sub: "General Manager's correspondence" },
  '/dashboard/schedule':        { title: 'Schedule',         sub: 'Meetings and calendar management' },
  '/dashboard/drafts':          { title: 'Drafts',           sub: 'Work-in-progress correspondence' },
}

export default function TopBar({ user, sidebarCollapsed, onToggleSidebar, onMobileMenuOpen }) {
  const pathname = usePathname()
  const page = PAGE_TITLES[pathname] || { title: 'DIMS', sub: 'Uganda Air Cargo Corporation' }

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U'
  const firstName = user?.name?.split(' ')[0] || 'User'
  const roleLabel = user?.role?.replace(/_/g, ' ') || 'Staff'

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-5 h-[60px] flex-shrink-0"
      style={{
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--border-gold)',
      }}
    >
      {/* Left: toggle + page title */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Mobile hamburger */}
        <button
          onClick={onMobileMenuOpen}
          className="md:hidden p-2 rounded-md topbar-icon-btn transition-colors flex-shrink-0"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>

        {/* Desktop collapse toggle */}
        <button
          onClick={onToggleSidebar}
          className="hidden md:flex p-2 rounded-md topbar-icon-btn transition-colors flex-shrink-0"
          style={{ color: 'var(--text-muted)' }}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Vertical divider */}
        <div className="hidden md:block w-px h-4 mx-1 flex-shrink-0"
             style={{ background: 'var(--border-default)' }} />

        {/* Page title */}
        <div className="flex flex-col justify-center min-w-0">
          <h1 className="font-heading font-bold text-sm leading-tight truncate"
              style={{ color: 'var(--text-primary)' }}>
            {page.title}
          </h1>
          {page.sub && (
            <p className="text-[10px] hidden sm:block leading-tight truncate"
               style={{ color: 'var(--text-muted)' }}>
              {page.sub}
            </p>
          )}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notification bell */}
        <button
          className="relative p-2 rounded-md topbar-icon-btn transition-colors"
          style={{ color: 'var(--text-muted)' }}
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell size={16} />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-uacc-red"
            style={{ boxShadow: '0 0 0 1.5px var(--nav-bg)' }}
          />
        </button>

        {/* Divider */}
        <div className="hidden sm:block w-px h-4 mx-1"
             style={{ background: 'var(--border-default)' }} />

        {/* User pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-default"
             style={{
               background: 'var(--glass-bg)',
               border: '1px solid var(--border-default)',
             }}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center
                          font-heading font-bold text-[10px] text-white flex-shrink-0"
               style={{ background: 'rgba(201,151,58,0.25)', border: '1px solid rgba(201,151,58,0.35)' }}>
            {userInitial}
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[11px] font-semibold font-heading truncate max-w-[90px]"
                  style={{ color: 'var(--text-primary)' }}>
              {firstName}
            </span>
            <span className="text-[9px] uppercase tracking-wider truncate max-w-[90px]"
                  style={{ color: 'var(--text-muted)' }}>
              {roleLabel}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
