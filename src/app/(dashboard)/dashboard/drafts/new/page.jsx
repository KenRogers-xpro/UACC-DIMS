import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'

export default function NewDraftPage() {
  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      <PageHeader
        title="New Draft"
        subtitle="Compose a draft document for the General Manager"
      >
        <Link href="/dashboard/drafts">
          <Button variant="outline">Back to Drafts</Button>
        </Link>
      </PageHeader>

      <div className="card rounded-xl p-6">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Draft composition is ready to be connected to the full editor flow.
        </p>
      </div>
    </div>
  )
}
