'use client'

import { useAuth } from '@/lib/auth-context'
import PageHeader from '@/components/ui/PageHeader'
import DocumentControlTool from '@/components/documents/DocumentControlTool'

export default function InternalAuditorDashboard() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      <PageHeader
        title={`Good morning, ${user?.name?.split(' ')[0] || 'Internal Auditor'}`}
        subtitle="Compliance evidence, working papers, and audit findings"
      />

      <DocumentControlTool
        title="Audit Documents"
        description="Working papers and audit evidence — private to you until submitted"
        defaultCategory="REPORT"
        defaultDepartment="FINANCE_AND_ADMINISTRATION"
      />
    </div>
  )
}
