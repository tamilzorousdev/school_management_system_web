import type { ReactNode } from 'react'
import { History } from 'lucide-react'
import { Avatar } from '@/components/common/avatar'
import { EmptyState, ErrorState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  useGateEvents,
  type GatePass,
  type GateStudent,
  type PickupPerson,
  type Visit,
} from '../api'
import {
  CHECK_METHOD,
  PASS_STATUS,
  TONE_DOT,
  VISIT_STATUS,
  eventTone,
  personLine,
  photoSrc,
} from '../labels'

export function MethodBadge({ method }: { method: string | null }) {
  if (!method) return null
  const tag = CHECK_METHOD[method] ?? { label: method, tone: 'neutral' as const }
  return <Badge tone={tag.tone}>{tag.label}</Badge>
}

export function PassStatusBadge({ pass }: { pass: GatePass }) {
  const status = PASS_STATUS[pass.status]
  return (
    <Badge tone={status.tone} dot pulse={pass.status === 'pending' && pass.is_emergency}>
      {status.label}
    </Badge>
  )
}

export function VisitStatusBadge({ visit }: { visit: Visit }) {
  const status = VISIT_STATUS[visit.status]
  return (
    <Badge tone={status.tone} dot pulse={visit.status === 'waiting'}>
      {status.label}
    </Badge>
  )
}

export function PassBadges({ pass }: { pass: GatePass }) {
  return (
    <span className='flex flex-wrap gap-1'>
      {pass.is_emergency && <Badge tone='danger'>Emergency</Badge>}
      {pass.release_method === 'manual' && <Badge tone='warning'>Checked by hand</Badge>}
      {pass.release_method && pass.release_method !== 'manual' && (
        <MethodBadge method={pass.release_method} />
      )}
      {pass.escalated && pass.status === 'pending' && <Badge tone='danger'>Call the office</Badge>}
      {pass.escalated_to_head_ao && <Badge tone='warning'>Escalated to head AO</Badge>}
      {pass.needs_consent && pass.consent_status === 'waiting' && (
        <Badge tone='warning'>Parent must agree first</Badge>
      )}
      {pass.needs_consent && pass.consent_status === 'rejected' && (
        <Badge tone='danger'>Parent refused</Badge>
      )}
    </span>
  )
}

export function VisitBadges({ visit }: { visit: Visit }) {
  if (!visit.overstay && !visit.blocked) return null
  return (
    <span className='flex flex-wrap gap-1'>
      {visit.blocked && <Badge tone='danger'>Blocked person</Badge>}
      {visit.overstay && <Badge tone='warning'>Stayed too long</Badge>}
    </span>
  )
}

export function StudentCell({
  student,
  size = 'md',
}: {
  student: GateStudent
  size?: 'sm' | 'md'
}) {
  return (
    <span className='flex min-w-0 items-center gap-2.5'>
      <Avatar name={student.name} src={photoSrc(student.photo)} size={size} previewable />
      <span className='grid min-w-0'>
        <span className='truncate font-semibold'>{student.name}</span>
        <span className='truncate text-xs text-muted-foreground'>
          {[student.class_section, student.admission_no].filter(Boolean).join(' · ')}
        </span>
      </span>
    </span>
  )
}

export function PersonCell({
  person,
  size = 'md',
}: {
  person: Pick<PickupPerson, 'name' | 'relation' | 'mobile' | 'photo'>
  size?: 'sm' | 'md' | 'lg'
}) {
  return (
    <span className='flex min-w-0 items-center gap-2.5'>
      <Avatar name={person.name} src={photoSrc(person.photo)} size={size} previewable />
      <span className='grid min-w-0'>
        <span className='truncate font-semibold'>{person.name}</span>
        <span className='truncate text-xs text-muted-foreground'>{personLine(person) || '—'}</span>
      </span>
    </span>
  )
}

export function Section({
  title,
  count,
  action,
  tone,
  children,
  className,
}: {
  title: string
  count?: number
  action?: ReactNode
  tone?: 'danger'
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card shadow-xs',
        tone === 'danger' && 'border-destructive/40',
        className
      )}
    >
      <div className='flex items-center justify-between gap-2 border-b px-4 py-3'>
        <h2
          className={cn(
            'flex items-center gap-2 font-semibold',
            tone === 'danger' && 'text-destructive'
          )}
        >
          {title}
          {count !== undefined && (
            <Badge tone={tone === 'danger' && count > 0 ? 'danger' : 'neutral'}>{count}</Badge>
          )}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function ListSkeleton() {
  return (
    <div className='grid gap-2 p-4'>
      <Skeleton className='h-12' />
      <Skeleton className='h-12' />
    </div>
  )
}

export function Timeline({ passId, visitId }: { passId?: number; visitId?: number }) {
  const events = useGateEvents(
    { page: 1, limit: 50, pass_id: passId, visit_id: visitId },
    Boolean(passId || visitId)
  )
  const rows = events.data?.items ?? []
  if (events.isPending) return <ListSkeleton />
  if (events.isError)
    return <ErrorState message={events.error.message} onRetry={() => events.refetch()} />
  if (rows.length === 0)
    return (
      <EmptyState
        icon={History}
        title='Nothing logged yet'
        description='Requests, approvals and gate checks show here as they happen.'
      />
    )
  return (
    <ol className='grid gap-0'>
      {rows.map((event, index) => (
        <li key={event.id} className='relative grid grid-cols-[auto_1fr] gap-3 pb-3'>
          <span className='relative flex flex-col items-center'>
            <span className={cn('mt-1.5 size-2.5 rounded-full', TONE_DOT[eventTone(event.kind)])} />
            {index < rows.length - 1 && <span className='mt-1 w-px flex-1 bg-border' />}
          </span>
          <span className='grid min-w-0 gap-0.5 text-sm'>
            <span className='flex flex-wrap items-center gap-x-2 gap-y-1'>
              <span className='font-semibold'>{event.label}</span>
              <MethodBadge method={event.method} />
            </span>
            <span className='tabular text-xs text-muted-foreground'>
              {formatDateTime(event.at)}
              {event.actor ? ` · ${event.actor.name}` : ''}
            </span>
            {event.note && (
              <span className='text-xs break-words text-muted-foreground'>{event.note}</span>
            )}
          </span>
        </li>
      ))}
    </ol>
  )
}

export function Quiet({ children }: { children: ReactNode }) {
  return <p className='px-4 py-6 text-center text-sm text-muted-foreground'>{children}</p>
}
