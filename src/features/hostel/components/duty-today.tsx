import { useState } from 'react'
import {
  AlarmClock,
  CalendarCheck,
  LogIn,
  LogOut,
  MoonStar,
  Repeat2,
  UserRoundX,
  Users,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useNow } from '@/hooks/use-now'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatTime } from '@/lib/format'
import { useHostelMutation } from '../api'
import { dutyApi, useDutyToday, useMyDuties, type RosterRow } from '../api-duty'
import { checkInOpens, checkWindow, dayLabel, ROSTER_STATUS, shiftTime } from './duty-helpers'
import { SwapRequestModal } from './duty-swap-modal'
import { todayIso } from './leave-helpers'

export function DutyTodayTab({ hostelId, canManage }: { hostelId?: number; canManage: boolean }) {
  const board = useDutyToday(hostelId)
  const [absentRow, setAbsentRow] = useState<RosterRow | null>(null)
  const absent = useHostelMutation((id: number) => dutyApi.markAbsent(id))
  const rows = board.data ?? []
  const onDuty = rows.filter((row) => row.status === 'checked_in').length
  const late = rows.filter((row) => row.running_late).length

  const markAbsent = async () => {
    if (!absentRow) return
    try {
      await absent.mutateAsync(absentRow.id)
      alerts.success(`${absentRow.user_name} marked absent`)
      setAbsentRow(null)
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const columns: Column<RosterRow>[] = [
    {
      key: 'staff',
      header: 'Staff',
      cell: (row) => <StaffCell row={row} />,
    },
    {
      key: 'shift',
      header: 'Shift',
      cell: (row) => <ShiftCell row={row} />,
    },
    {
      key: 'place',
      header: 'Where',
      hideBelow: 'lg',
      cell: (row) => (
        <div className='grid gap-0.5 text-sm'>
          <span>{row.hostel_name}</span>
          {row.block_name && (
            <span className='text-xs text-muted-foreground'>{row.block_name}</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <DutyStatus row={row} />,
    },
    {
      key: 'times',
      header: 'In / out',
      hideBelow: 'xl',
      cell: (row) => <InOut row={row} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (row) =>
        canManage && row.status === 'scheduled' ? (
          <Button variant='outline' size='sm' onClick={() => setAbsentRow(row)}>
            <UserRoundX />
            Mark absent
          </Button>
        ) : null,
    },
  ]

  return (
    <div className='grid gap-6'>
      <MyDutyCard />

      <Card className='overflow-hidden'>
        <div className='flex flex-wrap items-center gap-2 border-b px-4 py-3'>
          <span className='text-sm font-semibold'>Today’s duty board</span>
          <Badge tone='info'>
            On duty <span className='tabular font-extrabold'>{onDuty}</span>
          </Badge>
          {late > 0 && (
            <Badge tone='danger'>
              Running late <span className='tabular font-extrabold'>{late}</span>
            </Badge>
          )}
          <span className='tabular ml-auto text-xs text-muted-foreground'>
            {rows.length} {rows.length === 1 ? 'duty' : 'duties'}
          </span>
        </div>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(row) => row.id}
          loading={board.isFetching}
          error={board.isError ? board.error.message : null}
          onRetry={() => board.refetch()}
          empty={{
            icon: Users,
            title: 'Nobody is on duty today',
            description: 'Put staff on the roster to see them here.',
          }}
          card={(row) => (
            <div className='grid gap-2'>
              <div className='flex items-start justify-between gap-2'>
                <StaffCell row={row} />
                <DutyStatus row={row} />
              </div>
              <ShiftCell row={row} />
              <span className='text-xs text-muted-foreground'>
                {[row.hostel_name, row.block_name].filter(Boolean).join(' · ')}
              </span>
              <InOut row={row} />
              {canManage && row.status === 'scheduled' && (
                <Button
                  variant='outline'
                  size='sm'
                  className='justify-self-start'
                  onClick={() => setAbsentRow(row)}
                >
                  <UserRoundX />
                  Mark absent
                </Button>
              )}
            </div>
          )}
        />
      </Card>

      <ConfirmDialog
        open={Boolean(absentRow)}
        onOpenChange={(open) => !open && setAbsentRow(null)}
        title='Mark absent'
        description={
          absentRow
            ? `${absentRow.user_name} did not come for the ${absentRow.shift_name} shift. This is counted as absent in the duty report.`
            : ''
        }
        confirmText='Mark absent'
        destructive
        loading={absent.isPending}
        onConfirm={() => void markAbsent()}
      />
    </div>
  )
}

function MyDutyCard() {
  const mine = useMyDuties()
  const now = useNow(30_000)
  const today = todayIso()
  const [swapRow, setSwapRow] = useState<RosterRow | null>(null)
  const checkIn = useHostelMutation((id: number) => dutyApi.checkIn(id))
  const checkOut = useHostelMutation((id: number) => dutyApi.checkOut(id))
  const rows = (mine.data ?? [])
    .filter(
      (row) =>
        row.status === 'checked_in' ||
        (row.status === 'scheduled' && checkWindow(row, now) !== 'over')
    )
    .sort((a, b) => a.shift_start_at.localeCompare(b.shift_start_at))
  const shown = rows.slice(0, 5)

  const run = async (row: RosterRow, action: 'in' | 'out') => {
    try {
      const saved = await (action === 'in' ? checkIn : checkOut).mutateAsync(row.id)
      if (action === 'in') {
        alerts.success('Checked in', {
          description: saved.late_minutes ? `${saved.late_minutes} minutes late` : 'On time',
        })
      } else {
        alerts.success('Checked out', { description: `${row.shift_name} duty completed` })
      }
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  return (
    <Card className='grid gap-4 p-5'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <CalendarCheck className='size-4 text-primary' />
          <h2 className='font-bold'>My duty</h2>
        </div>
        <span className='text-xs text-muted-foreground'>Next 14 days</span>
      </div>
      {mine.isPending ? (
        <Skeleton className='h-16' />
      ) : mine.isError ? (
        <p className='text-sm text-destructive'>{mine.error.message}</p>
      ) : shown.length === 0 ? (
        <p className='text-sm text-muted-foreground'>You are not on the hostel duty roster.</p>
      ) : (
        <ul className='grid gap-2'>
          {shown.map((row) => {
            const slot = checkWindow(row, now)
            return (
              <li
                key={row.id}
                className='flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2'
              >
                <div className='grid min-w-0 gap-0.5'>
                  <span className='flex flex-wrap items-center gap-2 font-semibold'>
                    {row.duty_date === today ? 'Today' : dayLabel(row.duty_date)} · {row.shift_name}
                    {row.is_night && <MoonStar className='size-3.5 text-muted-foreground' />}
                  </span>
                  <span className='text-xs text-muted-foreground'>
                    {shiftTime(row.start_time, row.end_time)} ·{' '}
                    {[row.hostel_name, row.block_name].filter(Boolean).join(' · ')}
                  </span>
                </div>
                <div className='flex flex-wrap items-center gap-2'>
                  <DutyStatus row={row} />
                  {row.status === 'scheduled' && slot === 'open' && (
                    <Button
                      size='sm'
                      loading={checkIn.isPending && checkIn.variables === row.id}
                      onClick={() => void run(row, 'in')}
                    >
                      <LogIn />
                      Check in
                    </Button>
                  )}
                  {row.status === 'scheduled' &&
                    slot === 'too_early' &&
                    row.duty_date === today && (
                      <Button size='sm' variant='outline' disabled>
                        <LogIn />
                        Check in from {checkInOpens(row.start_time)}
                      </Button>
                    )}
                  {row.status === 'checked_in' && (
                    <Button
                      size='sm'
                      variant='outline'
                      loading={checkOut.isPending && checkOut.variables === row.id}
                      onClick={() => void run(row, 'out')}
                    >
                      <LogOut />
                      Check out
                    </Button>
                  )}
                  {row.status === 'scheduled' && !row.swap_pending && row.duty_date >= today && (
                    <Button size='sm' variant='ghost' onClick={() => setSwapRow(row)}>
                      <Repeat2 />
                      Request swap
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {rows.length > shown.length && (
        <p className='text-xs text-muted-foreground'>
          {rows.length - shown.length} more duties later. See the Roster tab.
        </p>
      )}
      {swapRow && <SwapRequestModal duty={swapRow} onClose={() => setSwapRow(null)} />}
    </Card>
  )
}

function StaffCell({ row }: { row: RosterRow }) {
  return (
    <div className='grid min-w-0 gap-0.5'>
      <span className='truncate font-semibold'>{row.user_name}</span>
      {row.user_mobile && (
        <span className='tabular truncate text-xs text-muted-foreground'>{row.user_mobile}</span>
      )}
    </div>
  )
}

function ShiftCell({ row }: { row: RosterRow }) {
  return (
    <div className='grid gap-0.5 text-sm'>
      <span className='flex items-center gap-1.5 font-medium'>
        {row.shift_name}
        {row.is_night && <MoonStar className='size-3.5 text-muted-foreground' />}
      </span>
      <span className='tabular text-xs text-muted-foreground'>
        {shiftTime(row.start_time, row.end_time)}
      </span>
    </div>
  )
}

export function DutyStatus({ row }: { row: RosterRow }) {
  return (
    <div className='flex flex-wrap items-center gap-1'>
      <Badge tone={ROSTER_STATUS[row.status].tone} dot>
        {ROSTER_STATUS[row.status].label}
      </Badge>
      {row.running_late && (
        <Badge tone='danger'>
          <AlarmClock className='size-3' />
          Running late
        </Badge>
      )}
      {row.late_minutes ? <Badge tone='warning'>{row.late_minutes} min late</Badge> : null}
      {row.swap_pending && <Badge tone='warning'>Swap pending</Badge>}
    </div>
  )
}

function InOut({ row }: { row: RosterRow }) {
  if (!row.check_in_at) return <span className='text-xs text-muted-foreground'>Not in yet</span>
  return (
    <span className='tabular text-xs text-muted-foreground'>
      In {formatTime(row.check_in_at).slice(0, 5)}
      {row.check_out_at ? ` · Out ${formatTime(row.check_out_at).slice(0, 5)}` : ''}
    </span>
  )
}
