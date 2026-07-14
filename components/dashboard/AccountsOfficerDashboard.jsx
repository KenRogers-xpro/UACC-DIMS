'use client'

import { useAuth } from '@/lib/auth-context'
import PageHeader from '@/components/ui/PageHeader'
import DocumentControlTool from '@/components/documents/DocumentControlTool'

export default function AccountsOfficerDashboard() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      <PageHeader
        title={`Good morning, ${user?.name?.split(' ')[0] || 'Accounts Officer'}`}
        subtitle="Payment processing and reconciliation documents"
      />

      <DocumentControlTool
        title="Accounts Documents"
        description="Invoices, receipts and reconciliation records — private to you until submitted"
        defaultCategory="REPORT"
        defaultDepartment="FINANCE_AND_ACCOUNTS"
      />
    </div>
  )
}
