'use client'

import { useAuth } from '@/lib/auth-context'
import PageHeader from '@/components/ui/PageHeader'
import DocumentControlTool from '@/components/documents/DocumentControlTool'
import SystemActivityWidget from '@/components/ui/SystemActivityWidget'

export default function HRManagerDashboard() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      <PageHeader
        title={`Good morning, ${user?.name?.split(' ')[0] || 'HR Manager'}`}
        subtitle="Staff records and HR document management"
      />

      <SystemActivityWidget />

      <DocumentControlTool
        title="HR Documents"
        description="Staff records, policies and HR forms — private to you until submitted"
        defaultCategory="FORM"
        defaultDepartment="HUMAN_RESOURCES"
      />
    </div>
  )
}
