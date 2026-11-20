import { Badge } from '@/components/ui/badge'
import type { GrievancePriority, GrievanceStatus } from '../api'
import { GRIEVANCE_PRIORITY, GRIEVANCE_STATUS } from '../labels'

interface GrievanceStatusBadgeProps {
  status: GrievanceStatus
  priority?: GrievancePriority
  isSlaBreached?: boolean
}

export function GrievanceStatusBadge({
  status,
  priority,
  isSlaBreached,
}: GrievanceStatusBadgeProps) {
  const meta = GRIEVANCE_STATUS[status] ?? { label: status, tone: 'neutral' }
  const isUrgent =
    status === 'escalated' ||
    priority === 'critical' ||
    (isSlaBreached && status !== 'resolved' && status !== 'closed')

  return (
    <Badge
      tone={isUrgent ? 'danger' : meta.tone}
      dot={isUrgent || status === 'in_progress'}
      pulse={isUrgent}
    >
      {meta.label}
    </Badge>
  )
}

export function GrievancePriorityBadge({ priority }: { priority: GrievancePriority }) {
  const meta = GRIEVANCE_PRIORITY[priority] ?? { label: priority, tone: 'neutral' }
  return (
    <Badge tone={meta.tone} dot={priority === 'critical' || priority === 'high'}>
      {meta.label}
    </Badge>
  )
}
