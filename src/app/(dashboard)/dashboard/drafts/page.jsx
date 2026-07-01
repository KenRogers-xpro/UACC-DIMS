import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'

export default function DraftsPage() {
  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      <PageHeader
        title="Drafts"
        subtitle="Manage draft documents for GM review and finalization"
      >
        <Link href="/dashboard/drafts/new">
          <Button variant="primary">New Draft</Button>
        </Link>
      </PageHeader>

      <div className="card rounded-xl p-6">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Use the new draft page to compose a document, then submit it for GM review.
        </p>
      </div>
    </div>
  )
}
