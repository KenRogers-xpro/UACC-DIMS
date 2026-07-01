import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'

export default function SchedulePage({ searchParams }) {
  const isNewAction = searchParams?.action === 'new'

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      <PageHeader
        title="Schedule"
        subtitle="Manage General Manager appointments and events"
      >
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </PageHeader>

      <div className="card rounded-xl p-6">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {isNewAction
            ? 'Start a new schedule event from here once the full calendar editor is connected.'
            : 'The schedule view is ready for the full event timeline and editor flow.'}
        </p>
      </div>
    </div>
  )
}
