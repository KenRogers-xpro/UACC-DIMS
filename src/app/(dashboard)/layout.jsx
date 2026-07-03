'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/dashboard/DashboardShell'
import { useAuth } from '@/lib/auth-context'

export default function DashboardLayout({ children }) {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [loading, isAuthenticated, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-uacc-gold border-t-transparent" />
          <p className="font-heading font-medium text-white tracking-widest uppercase text-sm">
            INITIALIZING SECURE SESSION...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <DashboardShell user={user}>
      {children}
    </DashboardShell>
  )
}
