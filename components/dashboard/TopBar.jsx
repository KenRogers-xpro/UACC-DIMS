'use client'
import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Bell, ChevronLeft, ChevronRight, Search, FileText, MessageSquare, Megaphone, CheckCheck } from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'
import StatusDot from '@/components/ui/StatusDot'
import { useOnlineStatus } from '@/lib/useOnlineStatus'
import { useNotifications } from '@/lib/useNotifications'

const NOTIFICATION_ICONS = {
  CIRCULATION: FileText,
  MESSAGE: MessageSquare,
  ANNOUNCEMENT: Megaphone,
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

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
  const router = useRouter()
  const page = PAGE_TITLES[pathname] || { title: 'DIMS', sub: 'Uganda Air Cargo Corporation' }
  const { isUserOnline } = useOnlineStatus()
  const { incoming, outgoing, unreadCount, refresh: refreshNotifications } = useNotifications()

  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)

  useEffect(() => {
    if (!notifOpen) return
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [notifOpen])

  const handleNotificationClick = (item) => {
    setNotifOpen(false)
    router.push(item.link)
  }

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
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setNotifOpen((open) => !open)
              if (!notifOpen) refreshNotifications()
            }}
            className="relative p-2 rounded-md topbar-icon-btn transition-colors"
            style={{ color: 'var(--text-muted)' }}
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span
                className="absolute top-0.5 right-0.5 min-w-[15px] h-[15px] px-[3px] flex items-center justify-center rounded-full bg-uacc-red text-white text-[9px] font-bold leading-none"
                style={{ boxShadow: '0 0 0 1.5px var(--nav-bg)' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                className="card absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl overflow-hidden shadow-2xl z-30"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
                initial={{ opacity: 0, scale: 0.96, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span className="font-heading font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-uacc-gold/15 text-uacc-gold">
                      {unreadCount} unread
                    </span>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {incoming.length === 0 && outgoing.length === 0 ? (
                    <div className="px-4 py-8 flex flex-col items-center gap-2 text-center">
                      <CheckCheck size={22} style={{ color: 'var(--text-faint)' }} />
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>You&apos;re all caught up</p>
                    </div>
                  ) : (
                    <>
                      {incoming.length > 0 && (
                        <div>
                          <p className="px-4 pt-2.5 pb-1 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                            Incoming
                          </p>
                          {incoming.map((item) => (
                            <NotificationRow key={`in-${item.type}-${item.id}`} item={item} onClick={handleNotificationClick} />
                          ))}
                        </div>
                      )}
                      {outgoing.length > 0 && (
                        <div>
                          <p className="px-4 pt-2.5 pb-1 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                            Outgoing
                          </p>
                          {outgoing.map((item) => (
                            <NotificationRow key={`out-${item.type}-${item.id}`} item={item} onClick={handleNotificationClick} />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-4 mx-1"
             style={{ background: 'var(--border-default)' }} />

        {/* User pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-default"
             style={{
               background: 'var(--glass-bg)',
               border: '1px solid var(--border-default)',
             }}>
          <div className="relative flex-shrink-0">
            <div className="w-6 h-6 rounded-full flex items-center justify-center
                            font-heading font-bold text-[10px] text-white"
                 style={{ background: 'rgba(201,151,58,0.25)', border: '1px solid rgba(201,151,58,0.35)' }}>
              {userInitial}
            </div>
            <StatusDot online={isUserOnline(user?.id)} size={7} className="absolute -bottom-0.5 -right-0.5" />
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

function NotificationRow({ item, onClick }) {
  const Icon = NOTIFICATION_ICONS[item.type] || Bell
  return (
    <button
      onClick={() => onClick(item)}
      className="w-full text-left px-4 py-3 border-b hover:bg-white/5 transition-colors flex items-start gap-3"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
           style={{ background: 'rgba(201,151,58,0.12)', border: '1px solid rgba(201,151,58,0.25)' }}>
        <Icon size={13} className="text-uacc-gold" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
        <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{item.subtitle}</p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>{timeAgo(item.createdAt)}</p>
      </div>
    </button>
  )
}
