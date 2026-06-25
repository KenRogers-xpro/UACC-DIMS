import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/dashboard/DashboardShell'

export default async function DashboardLayout({ children }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <DashboardShell session={session}>
      {children}
    </DashboardShell>
  )
}
