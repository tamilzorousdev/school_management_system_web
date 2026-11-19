import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { ErrorState } from '@/components/common/display'
import { Avatar } from '@/components/common/avatar'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  libraryApi,
  useLibraryMutation,
  usePeriodRoster,
  type LibraryPeriod,
  type PeriodRoster,
} from '../api'
import { FormError } from './library-parts'

export function PeriodRosterModal({
  period,
  date,
  onClose,
}: {
  period: LibraryPeriod | null
  date: string
  onClose: () => void
}) {
  const [shown, setShown] = useState(period)
  if (period && period !== shown) setShown(period)
  const roster = usePeriodRoster(period?.slot_id, date)

  return (
    <AppModal
      open={Boolean(period)}
      onOpenChange={(open) => !open && onClose()}
      title={
        shown
          ? `${shown.section.name} · ${shown.period_name ?? `Period ${shown.period_no}`}`
          : 'Library period'
      }
      description={`${formatDate(date)}${shown?.teacher ? ` · ${shown.teacher}` : ''}`}
      size='lg'
    >
      {roster.isError ? (
        <ErrorState message={roster.error.message} onRetry={() => roster.refetch()} />
      ) : !roster.data || roster.isFetching ? (
        <Skeleton className='h-60' />
      ) : (
        <RosterForm
          key={`${roster.data.period.slot_id}-${date}`}
          roster={roster.data}
          date={date}
          onDone={onClose}
        />
      )}
    </AppModal>
  )
}

function RosterForm({
  roster,
  date,
  onDone,
}: {
  roster: PeriodRoster
  date: string
  onDone: () => void
}) {
  const canMark = can(useMe().data, 'library.attendance')
  const [absent, setAbsent] = useState<number[]>(
    roster.students
      .filter((student) => student.present === false)
      .map((student) => student.student_id)
  )
  const [error, setError] = useState<string | null>(null)
  const save = useLibraryMutation((ids: number[]) =>
    libraryApi.markPeriod(roster.period.slot_id, date, ids)
  )
  const toggle = (id: number) =>
    setAbsent((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    )
  const present = roster.students.length - absent.length

  return (
    <div className='grid gap-3'>
      <FormError message={error} />
      <div className='flex flex-wrap items-center justify-between gap-2 text-sm'>
        <span>
          <span className='font-bold text-success'>{present} present</span> ·{' '}
          <span className='font-bold text-destructive'>{absent.length} absent</span>
          {!roster.period.marked && (
            <span className='text-muted-foreground'> · not saved yet, everyone starts present</span>
          )}
        </span>
        {canMark && (
          <div className='flex gap-1'>
            <Button size='sm' variant='ghost' onClick={() => setAbsent([])}>
              All present
            </Button>
          </div>
        )}
      </div>
      <ul className='max-h-[55vh] divide-y overflow-y-auto rounded-lg border'>
        {roster.students.map((student) => {
          const isAbsent = absent.includes(student.student_id)
          return (
            <li
              key={student.student_id}
              className='flex items-center justify-between gap-3 px-3 py-2'
            >
              <div className='flex min-w-0 items-center gap-2.5'>
                <Avatar name={student.name} src={student.photo_url} size='sm' />
                <div className='grid min-w-0'>
                  <span className='truncate font-semibold'>{student.name}</span>
                  <span className='text-xs text-muted-foreground'>
                    {student.roll_no ? `Roll ${student.roll_no} · ` : ''}
                    {student.admission_no}
                  </span>
                </div>
              </div>
              <button
                type='button'
                role='switch'
                aria-checked={!isAbsent}
                aria-label={`${student.name} present`}
                disabled={!canMark}
                onClick={() => toggle(student.student_id)}
                className={cn(
                  'inline-flex h-8 shrink-0 items-center gap-1 rounded-md border px-2.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-70',
                  isAbsent
                    ? 'border-destructive/30 bg-destructive/10 text-destructive'
                    : 'border-success/30 bg-success/10 text-success'
                )}
              >
                {isAbsent ? <X className='size-3.5' /> : <Check className='size-3.5' />}
                {isAbsent ? 'Absent' : 'Present'}
              </button>
            </li>
          )
        })}
      </ul>
      <DialogFooter>
        <Button variant='outline' onClick={onDone}>
          {canMark ? 'Cancel' : 'Close'}
        </Button>
        {canMark && (
          <Button
            loading={save.isPending}
            onClick={async () => {
              setError(null)
              try {
                await save.mutateAsync(absent)
                alerts.success('Library period attendance saved')
                onDone()
              } catch (caught) {
                setError(toApiError(caught).message)
              }
            }}
          >
            Save attendance
          </Button>
        )}
      </DialogFooter>
    </div>
  )
}
