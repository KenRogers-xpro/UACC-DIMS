'use client'

import { useAuth } from '@/lib/auth-context'
import PageHeader from '@/components/ui/PageHeader'
import DocumentControlTool from '@/components/documents/DocumentControlTool'

export default function CorporationSecretaryDashboard() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      <PageHeader
        title={`Good morning, ${user?.name?.split(' ')[0] || 'Corporation Secretary'}`}
        subtitle="Board affairs, governance records, and executive correspondence"
      />

      <DocumentControlTool
        title="Governance Documents"
        description="Board minutes, resolutions and executive correspondence — private to you until submitted"
        defaultCategory="MEMO"
        defaultDepartment="GENERAL_MANAGER_OFFICE"
      />
    </div>
  )
}
