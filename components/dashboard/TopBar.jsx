'use client'
import { usePathname } from 'next/navigation'
import { Menu, Bell, ChevronRight, ChevronLeft } from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'

// Map routes to readable page titles
const PAGE_TITLES = {
  '/dashboard':                  { title: 'Dashboard',        sub: 'Overview of operational activities' },
  '/dashboard/documents':        { title: 'Documents',         sub: 'Upload, search and retrieve files' },
  '/dashboard/procurement':      { title: 'Procurement',       sub: 'Requests and approval workflow' },
  '/dashboard/activity-logs':    { title: 'Activity Logs',     sub: 'Staff daily activity records' },
  '/dashboard/reports':          { title: 'Reports',           sub: 'Analytics and exported reports' },
  '/dashboard/user-management':  { title: 'User Management',   sub: 'Manage system users and roles' },
  '/dashboard/audit-trail':      { title: 'Audit Trail',       sub: 'Full system activity log' },
  '/dashboard/ai-agent':         { title: 'AI Agent',          sub: 'Intelligent operational assistant' },
}

export default function TopBar({
  user,
  sidebarCollapsed,
  onToggleSidebar,
  onMobileMenuOpen,
}) {
  const pathname = usePathname()
  const page = PAGE_TITLES[pathname] || { title: 'DIMS', sub: '' }

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between
                 px-4 md:px-6 py-3 h-[60px]"
      style={{
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-gold)',
      }}
    >
      {/* Left: toggle + breadcrumb */}
      <div className="flex items-center gap-3">

        {/* Mobile hamburger */}
        <button
          onClick={onMobileMenuOpen}
          className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <Menu size={20} />
        </button>

        {/* Desktop collapse toggle */}
        <button
          onClick={onToggleSidebar}
          className="hidden md:flex p-2 rounded-lg transition-all duration-200
                     hover:bg-white/5"
          style={{ color: 'var(--text-muted)' }}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed
            ? <ChevronRight size={18} />
            : <ChevronLeft size={18} />
          }
        </button>

        {/* Divider */}
        <div className="hidden md:block w-px h-5"
             style={{ background: 'var(--border-default)' }} />

        {/* Breadcrumb */}
        <div className="flex flex-col">
          <h1
            className="font-heading font-bold text-sm md:text-base leading-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {page.title}
          </h1>
          {page.sub && (
            <p className="text-[10px] hidden sm:block"
               style={{ color: 'var(--text-muted)' }}>
              {page.sub}
            </p>
          )}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 md:gap-3">

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: 'var(--text-muted)' }}
          title="Notifications"
        >
          <Bell size={18} />
          {/* Notification dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full
                           bg-uacc-red border-2"
                style={{ borderColor: 'var(--nav-bg)' }} />
        </button>

        {/* Divider */}
        <div className="hidden sm:block w-px h-5"
             style={{ background: 'var(--border-default)' }} />

        {/* User pill */}
        <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg"
             style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-default)' }}>
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center
                       font-heading font-bold text-[10px] text-white flex-shrink-0"
            style={{ background: 'rgba(201,151,58,0.3)' }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xs font-semibold font-heading truncate max-w-[100px]"
                  style={{ color: 'var(--text-primary)' }}>
              {user?.name?.split(' ')[0] || 'User'}
            </span>
            <span className="text-[9px] uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}>
              {user?.role?.replace('_', ' ') || 'Staff'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
