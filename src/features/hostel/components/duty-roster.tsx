import { useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MoonStar, Plus, X } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState, ErrorState } from '@/components/common/display'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Kbd } from '@/components/shortcuts/kbd'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import { useHostelMutation } from '../api'
import { dutyApi, useDutyShifts, useRoster, type RosterRow } from '../api-duty'
import { datesBetween, dayLabel, ROSTER_STATUS, shiftTime, weekStart } from './duty-helpers'
import { AddDutiesModal } from './duty-roster-modal'
import { shiftDate, todayIso } from './leave-helpers'

interface ShiftLine {
  id: number
  name: string
  start_time: string
  end_time: string
  is_night: boolean
}

const chipTone: Record<BadgeTone, string> = {
  neutral: 'border-border bg-muted/60',
  info: 'border-info/30 bg-info/10',
  success: 'border-success/30 bg-success/10',
  warning: 'border-warning/30 bg-warning/10',
  danger: 'border-destructive/30 bg-destructive/10',
}

export function DutyRosterTab({
  hostelId,
  from,
  canManage,
  onWeekChange,
}: {
  hostelId?: number
  from?: string
  canManage: boolean
  onWeekChange: (from: string | undefined) => void
}) {
  const today = todayIso()
  const thisWeek = weekStart(today)
  const start = from ? weekStart(from) : thisWeek
  const end = shiftDate(start, 6)
  const days = datesBetween(start, end)
  const roster = useRoster({ hostel_id: hostelId, from: start, to: end })
  const shifts = useDutyShifts()
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<RosterRow | null>(null)
  const remove = useHostelMutation((id: number) => dutyApi.removeDuty(id))
  const rows = roster.data ?? []

  useShortcut('hostel.create', () => setAdding(true), { enabled: canManage })

  const lines: ShiftLine[] = [
    ...(shifts.data ?? []).filter(
      (shift) => shift.active || rows.some((row) => row.shift_id === shift.id)
    ),
    ...rows
      .filter((row) => !(shifts.data ?? []).some((shift) => shift.id === row.shift_id))
      .map((row) => ({
        id: row.shift_id,
        name: row.shift_name,
        start_time: row.start_time,
        end_time: row.end_time,
        is_night: row.is_night,
      })),
  ]
    .filter((line, index, all) => all.findIndex((item) => item.id === line.id) === index)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))

  const cell = (shiftId: number, date: string) =>
    rows.filter((row) => row.shift_id === shiftId && row.duty_date === date)

  const canRemove = (row: RosterRow) =>
    canManage && row.status === 'scheduled' && row.duty_date >= today

  const confirmRemove = async () => {
    if (!removing) return
    try {
      await remove.mutateAsync(removing.id)
      alerts.success('Duty removed', {
        description: `${removing.user_name} · ${dayLabel(removing.duty_date)}`,
      })
      setRemoving(null)
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const body = () => {
    if (roster.isError && !rows.length)
      return <ErrorState message={roster.error.message} onRetry={() => roster.refetch()} />
    if ((roster.isPending || shifts.isPending) && !rows.length)
      return (
        <div className='grid gap-2 p-4'>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className='h-14' />
          ))}
        </div>
      )
    if (!lines.length)
      return (
        <EmptyState
          icon={Clock}
          title='No shifts yet'
          description='Add the duty shifts (morning, evening, night) in the Shifts tab first.'
        />
      )
    return (
      <div className={cn('transition-opacity', roster.isFetching && 'opacity-60')}>
        <div className='hidden xl:block'>
          <table className='w-full table-fixed border-collapse text-sm'>
            <thead>
              <tr className='border-b'>
                <th className='w-36 px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase'>
                  Shift
                </th>
                {days.map((day) => (
                  <th
                    key={day}
                    className={cn(
                      'px-2 py-2 text-left text-xs font-semibold text-muted-foreground',
                      day === today && 'text-primary'
                    )}
                  >
                    {dayLabel(day)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id} className='border-b align-top last:border-b-0'>
                  <td className='px-3 py-2'>
                    <div className='grid gap-0.5'>
                      <span className='flex items-center gap-1.5 font-semibold'>
                        {line.name}
                        {line.is_night && <MoonStar className='size-3.5 text-muted-foreground' />}
                      </span>
                      <span className='tabular text-xs text-muted-foreground'>
                        {shiftTime(line.start_time, line.end_time)}
                      </span>
                    </div>
                  </td>
                  {days.map((day) => (
                    <td key={day} className={cn('px-1.5 py-2', day === today && 'bg-primary/5')}>
                      <div className='grid gap-1'>
                        {cell(line.id, day).map((row) => (
                          <DutyChip
                            key={row.id}
                            row={row}
                            onRemove={canRemove(row) ? () => setRemoving(row) : undefined}
                          />
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className='grid divide-y xl:hidden'>
          {days.map((day) => {
            const dayRows = rows
              .filter((row) => row.duty_date === day)
              .sort((a, b) => a.start_time.localeCompare(b.start_time))
            return (
              <li key={day} className='grid gap-2 p-4'>
                <span
                  className={cn(
                    'text-sm font-semibold',
                    day === today ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {dayLabel(day)}
                  {day === today ? ' · Today' : ''}
                </span>
                {dayRows.length === 0 ? (
                  <span className='text-xs text-muted-foreground'>No duties</span>
                ) : (
                  <div className='grid gap-1.5 sm:grid-cols-2'>
                    {dayRows.map((row) => (
                      <DutyChip
                        key={row.id}
                        row={row}
                        showShift
                        onRemove={canRemove(row) ? () => setRemoving(row) : undefined}
                      />
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-center gap-2 border-b px-4 py-3'>
        <div className='flex items-center gap-1'>
          <Button
            variant='outline'
            size='icon-sm'
            aria-label='Previous week'
            onClick={() => onWeekChange(shiftDate(start, -7))}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant='outline'
            size='icon-sm'
            aria-label='Next week'
            onClick={() => onWeekChange(shiftDate(start, 7))}
          >
            <ChevronRight />
          </Button>
        </div>
        <span className='flex items-center gap-2 text-sm font-semibold'>
          <CalendarDays className='size-4 text-muted-foreground' />
          {dayLabel(start)} – {dayLabel(end)}
        </span>
        {start !== thisWeek && (
          <Button variant='ghost' size='sm' onClick={() => onWeekChange(undefined)}>
            This week
          </Button>
        )}
        <span className='tabular text-xs text-muted-foreground sm:ml-auto'>
          {rows.length} {rows.length === 1 ? 'duty' : 'duties'}
        </span>
        {canManage && (
          <Button size='sm' onClick={() => setAdding(true)}>
            <Plus />
            Add duties
            <Kbd id='hostel.create' inverted />
          </Button>
        )}
      </div>
      {body()}

      {adding && (
        <AddDutiesModal
          hostelId={hostelId}
          defaultDate={start > today ? start : today}
          onClose={() => setAdding(false)}
        />
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title='Remove duty'
        description={
          removing
            ? `Take ${removing.user_name} off the ${removing.shift_name} shift on ${dayLabel(removing.duty_date)}?`
            : ''
        }
        confirmText='Remove'
        destructive
        loading={remove.isPending}
        onConfirm={() => void confirmRemove()}
      />
    </Card>
  )
}

function DutyChip({
  row,
  showShift = false,
  onRemove,
}: {
  row: RosterRow
  showShift?: boolean
  onRemove?: () => void
}) {
  const status = ROSTER_STATUS[row.status]
  return (
    <div
      className={cn(
        'flex min-w-0 items-start gap-1 rounded-md border px-2 py-1',
        chipTone[status.tone]
      )}
    >
      <div className='grid min-w-0 flex-1 gap-0.5'>
        <span className='truncate text-xs font-semibold' title={row.user_name}>
          {row.user_name}
        </span>
        <span className='truncate text-[11px] text-muted-foreground'>
          {[
            showShift ? `${row.shift_name} · ${shiftTime(row.start_time, row.end_time)}` : null,
            row.block_name,
            row.status === 'scheduled' ? null : status.label,
          ]
            .filter(Boolean)
            .join(' · ') || row.hostel_name}
        </span>
        {row.swap_pending && (
          <Badge tone='warning' className='justify-self-start px-1.5 py-0 text-[10px]'>
            Swap pending
          </Badge>
        )}
      </div>
      {onRemove && (
        <button
          type='button'
          aria-label={`Remove ${row.user_name} from this shift`}
          onClick={onRemove}
          className='grid size-5 shrink-0 place-items-center rounded text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring/40'
        >
          <X className='size-3.5' />
        </button>
      )}
    </div>
  )
}
