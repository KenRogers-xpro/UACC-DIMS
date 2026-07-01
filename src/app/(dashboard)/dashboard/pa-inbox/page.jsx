import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'

export default function PAInboxPage() {
  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      <PageHeader
        title="GM Inbox"
        subtitle="Pending triage items routed through the PA workflow"
      >
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </PageHeader>

      <div className="card rounded-xl p-6">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Open the PA inbox from the dashboard to review routed documents, registry entries, and procurement requests.
        </p>
      </div>
    </div>
  )
}
