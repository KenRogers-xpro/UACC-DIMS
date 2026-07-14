'use client'

import { useAuth } from '@/lib/auth-context'
import PageHeader from '@/components/ui/PageHeader'
import DocumentControlTool from '@/components/documents/DocumentControlTool'
import SystemActivityWidget from '@/components/ui/SystemActivityWidget'

export default function MarketingOfficerDashboard() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      <PageHeader
        title={`Good morning, ${user?.name?.split(' ')[0] || 'Marketing Officer'}`}
        subtitle="Campaign materials and company announcements"
      />

      <SystemActivityWidget />

      <DocumentControlTool
        title="Marketing Documents"
        description="Campaign materials and announcements — private to you until submitted"
        defaultCategory="MEMO"
        defaultDepartment="MARKETING"
      />
    </div>
  )
}
