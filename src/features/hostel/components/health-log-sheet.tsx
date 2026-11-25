import { useState } from 'react'
import { BedSingle, CheckCircle2, LogOut, Pencil } from 'lucide-react'
import { DetailList, ErrorState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/format'
import { useHostelMutation } from '../api'
import { careApi, useHealthLog, type HealthLog, type HealthLogNoteInput } from '../api-care'
import { HEALTH_KIND, HEALTH_STATUS } from './health-helpers'
import { HealthLogModal } from './health-log-modal'
import { HealthNoteModal } from './health-parts'
import { InfoNote, StudentCell } from './leave-form-parts'

export function HealthLogSheet({ logId, onClose }: { logId?: number; onClose: () => void }) {
  const [shownId, setShownId] = useState(logId)
  if (logId && logId !== shownId) setShownId(logId)
  const log = useHealthLog(shownId ?? 0)
  const data = log.data

  return (
    <Sheet open={Boolean(logId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{data ? data.student.name : 'Health record'}</SheetTitle>
          <SheetDescription>
            {data
              ? `${HEALTH_KIND[data.kind]} · ${formatDateTime(data.logged_at)} · ${data.hostel_name}`
              : 'Loading'}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          {log.isError && !data ? (
            <ErrorState message={log.error.message} onRetry={() => log.refetch()} />
          ) : !data ? (
            <div className='grid gap-3'>
              <Skeleton className='h-20' />
              <Skeleton className='h-40' />
            </div>
          ) : (
            <HealthLogBody log={data} />
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

type NoteAction = 'discharge' | 'close'

const NOTE_ACTIONS: Record<
  NoteAction,
  { title: string; description: string; submit: string; done: string }
> = {
  discharge: {
    title: 'Discharge from the sick bay',
    description: 'The record stays open for follow-up until you close it.',
    submit: 'Discharge',
    done: 'Discharged from the sick bay',
  },
  close: {
    title: 'Close health record',
    description: 'Closing also discharges the resident from the sick bay.',
    submit: 'Close record',
    done: 'Health record closed',
  },
}

function HealthLogBody({ log }: { log: HealthLog }) {
  const me = useMe().data
  const canEdit = can(me, 'hostel.medical')
  const [editing, setEditing] = useState(false)
  const [action, setAction] = useState<NoteAction | null>(null)
  const toSickBay = useHostelMutation(() => careApi.patchHealthLog(log.id, { sick_bay: true }))
  const discharge = useHostelMutation((input: HealthLogNoteInput) =>
    careApi.discharge(log.id, input)
  )
  const close = useHostelMutation((input: HealthLogNoteInput) =>
    careApi.closeHealthLog(log.id, input)
  )
  const open = log.status === 'open'
  const status = HEALTH_STATUS[log.status]

  const moveToSickBay = async () => {
    try {
      await toSickBay.mutateAsync(undefined)
      alerts.success('Moved to the sick bay', { description: log.student.name })
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  return (
    <div className='grid gap-5'>
      <div className='flex flex-wrap items-center gap-2'>
        <Badge tone={status.tone} dot>
          {status.label}
        </Badge>
        <Badge tone='neutral'>{HEALTH_KIND[log.kind]}</Badge>
        {log.in_sick_bay && (
          <Badge tone='warning' dot pulse>
            In the sick bay
          </Badge>
        )}
        {log.hospital_visit && <Badge tone='info'>Seen by a doctor</Badge>}
        <Badge tone={log.parent_informed ? 'success' : 'neutral'}>
          {log.parent_informed ? 'Parents told' : 'Parents not told'}
        </Badge>
      </div>

      {canEdit && open && (
        <div className='flex flex-wrap gap-2'>
          <Button size='sm' variant='outline' onClick={() => setEditing(true)}>
            <Pencil />
            Edit
          </Button>
          {log.in_sick_bay ? (
            <Button size='sm' variant='outline' onClick={() => setAction('discharge')}>
              <LogOut />
              Discharge from sick bay
            </Button>
          ) : (
            <Button
              size='sm'
              variant='outline'
              loading={toSickBay.isPending}
              onClick={() => void moveToSickBay()}
            >
              <BedSingle />
              Move to sick bay
            </Button>
          )}
          <Button size='sm' onClick={() => setAction('close')}>
            <CheckCircle2 />
            Close record
          </Button>
        </div>
      )}

      {!open && (
        <InfoNote>
          This record is closed on {formatDateTime(log.closed_at)}. It can no longer change.
        </InfoNote>
      )}

      <div className='rounded-lg border p-3'>
        <StudentCell student={log.student} extra={log.bed ?? undefined} />
      </div>

      <div className='grid gap-1'>
        <h3 className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
          Symptoms
        </h3>
        <p className='text-sm whitespace-pre-wrap'>{log.symptoms}</p>
      </div>

      <DetailList
        items={[
          { label: 'Logged', value: formatDateTime(log.logged_at) },
          {
            label: 'Temperature',
            value: log.temperature !== null ? String(log.temperature) : '—',
          },
          { label: 'Action taken', value: log.action_taken ?? '—' },
          { label: 'Doctor', value: log.doctor_name ?? '—' },
          { label: 'Sick bay from', value: formatDateTime(log.sick_bay_from) },
          { label: 'Sick bay until', value: formatDateTime(log.sick_bay_to) },
          { label: 'Logged by', value: log.logged_by_name ?? '—' },
          { label: 'Hostel', value: log.hostel_name },
        ]}
      />

      {editing && <HealthLogModal log={log} onClose={() => setEditing(false)} />}
      {action && (
        <HealthNoteModal
          title={NOTE_ACTIONS[action].title}
          description={`${log.student.name}. ${NOTE_ACTIONS[action].description}`}
          submitText={NOTE_ACTIONS[action].submit}
          onClose={() => setAction(null)}
          onSubmit={async (input) => {
            await (action === 'close' ? close : discharge).mutateAsync(input)
            alerts.success(NOTE_ACTIONS[action].done, { description: log.student.name })
          }}
        />
      )}
    </div>
  )
}
