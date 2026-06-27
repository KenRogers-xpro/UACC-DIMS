export default function Badge({ status, label }) {
  const map = {
    PENDING:             'badge badge-pending',
    DEPT_HEAD_APPROVED:  'badge badge-draft',
    APPROVED:            'badge badge-approved',
    REJECTED:            'badge badge-rejected',
    ACTIVE:              'badge badge-approved',
    INACTIVE:            'badge badge-rejected',
    POLICY:              'badge badge-draft',
    REPORT:              'badge badge-approved',
    MEMO:                'badge badge-pending',
    CONTRACT:            'badge badge-rejected',
    FORM:                'badge badge-draft',
    OTHER:               'badge badge-pending',
  }

  const display = label || status?.replace(/_/g, ' ')

  return (
    <span className={map[status] || 'badge badge-draft'}>
      {display}
    </span>
  )
}
