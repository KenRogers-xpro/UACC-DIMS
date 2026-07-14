'use client'

import { useAuth } from '@/lib/auth-context'
import PageHeader from '@/components/ui/PageHeader'
import DocumentControlTool from '@/components/documents/DocumentControlTool'
import SystemActivityWidget from '@/components/ui/SystemActivityWidget'

export default function FinanceDirectorDashboard() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      <PageHeader
        title={`Good morning, ${user?.name?.split(' ')[0] || 'Finance Director'}`}
        subtitle="Financial oversight and reporting documents"
      />

      <SystemActivityWidget />

      <DocumentControlTool
        title="Finance Documents"
        description="Financial reports and statements — private to you until submitted"
        defaultCategory="REPORT"
        defaultDepartment="FINANCE_AND_ACCOUNTS"
      />
    </div>
  )
}
