'use client'
import { useState } from 'react'
import Sidebar from '@/components/dashboard/Sidebar'
import TopBar from '@/components/dashboard/TopBar'

export default function DashboardShell({ children, session }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      {/* Sidebar */}
      <Sidebar
        session={session}
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
          session={session}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onMobileMenuOpen={() => setMobileSidebarOpen(true)}
        />

        {/* Page content */}
        <main
          className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto"
          style={{ color: 'var(--text-secondary)' }}
        >
          {children}
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
    </div>
  )
}
