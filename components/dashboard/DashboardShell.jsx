'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/dashboard/Sidebar'
import TopBar from '@/components/dashboard/TopBar'
import AIAgentWidget from '@/components/dashboard/AIAgentWidget'
import DocumentsAwaitingAction from '@/components/circulation/DocumentsAwaitingAction'

export default function DashboardShell({ children, user }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      {/* Sidebar */}
      <Sidebar
        user={user}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <div
        className={`
          flex-1 flex flex-col min-h-screen transition-all duration-300
          ${sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-[240px]'}
        `}
      >
        {/* Top bar */}
        <TopBar
          user={user}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onMobileMenuOpen={() => setMobileSidebarOpen(true)}
        />

        {/* Page content */}
        <main
          className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto"
          style={{ color: 'var(--text-secondary)' }}
        >
          <DocumentsAwaitingAction />
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer strip */}
        <div
          className="px-6 py-3 text-[10px] uppercase tracking-widest text-center"
          style={{
            borderTop: '1px solid var(--border-subtle)',
            color: 'var(--text-faint)',
          }}
        >
          DIMS v1.0 · Uganda Air Cargo Corporation · Internal Use Only · © 2026
        </div>
      </div>

      {/* Floating AI Agent widget */}
      <AIAgentWidget />
    </div>
  )
}
