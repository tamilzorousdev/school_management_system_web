import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { Clock, IdCard, UserRoundCheck, UserRoundX, Users } from 'lucide-react'
import { Avatar } from '@/components/common/avatar'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { clock } from '@/features/fleet/labels'
import { cn } from '@/lib/utils'
import { useDriverAttendance, type DriverDay } from '../api'
import { OpsDayBar } from '../components/ops-day'
import { DUTY_PLACE, hoursText, opsDay } from '../labels'
import type { OpsDaySearch } from '../search'

const route = getRouteApi('/_app/transport/driver-attendance')

function DriverCell({ row }: { row: DriverDay }) {
  return (
    <div className='flex items-center gap-3'>
      <Avatar
        name={row.driver.name}
        src={row.duty?.check_in_photo_url}
        previewable
        subtitle={row.duty ? `Check-in selfie · ${clock(row.duty.check_in_at)}` : undefined}
      />
      <div className='grid min-w-0'>
        <span
          className={cn(
            'truncate text-[13px] leading-[18px] font-semibold',
            row.duty ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
          )}
        >
          {row.driver.name}
        </span>
        <span className='font-mono text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
          {row.mobile ?? '—'}
        </span>
      </div>
    </div>
  )
}

function CheckInCell({ row }: { row: DriverDay }) {
  if (!row.duty) return <Badge className='font-medium'>Not checked in</Badge>
  const place = DUTY_PLACE[row.duty.check_in_place]
  return (
    <div className='grid justify-items-start gap-1'>
      <span className='text-[13px] leading-[18px] font-semibold text-slate-900 tabular-nums dark:text-slate-100'>
        {clock(row.duty.check_in_at)}
      </span>
      <Badge tone={place.tone} className='font-medium'>
        {place.label}
      </Badge>
    </div>
  )
}

function LateCell({ row }: { row: DriverDay }) {
  if (!row.duty) return <span className='text-slate-400'>—</span>
  return row.duty.late_minutes > 0 ? (
    <Badge tone='warning' className='font-medium'>
      {row.duty.late_minutes} min late
    </Badge>
  ) : (
    <Badge tone='success' className='font-medium'>
      On time
    </Badge>
  )
}

function AttendantCell({ row }: { row: DriverDay }) {
  const present = row.duty?.attendant_present
  if (present === null || present === undefined) {
    return <span className='text-slate-400'>—</span>
  }
  return (
    <div className='grid justify-items-start gap-0.5'>
      <Badge tone={present ? 'success' : 'danger'} className='font-medium'>
        {present ? 'Yes' : 'No'}
      </Badge>
      {row.duty?.attendant && (
        <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
          {row.duty.attendant.name}
        </span>
      )}
    </div>
  )
}

export function DriverAttendancePage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/transport/driver-attendance' })
  const { day, live } = opsDay(search.date)
  const list = useDriverAttendance(day, live)
  const rows = list.data ?? []
  const checkedIn = rows.filter((row) => row.duty).length
  const late = rows.filter((row) => (row.duty?.late_minutes ?? 0) > 0).length
  const noAttendant = rows.filter((row) => row.duty?.attendant_present === false).length

  const setSearch = (patch: Partial<OpsDaySearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })

  useShortcut('app.refresh', () => void list.refetch())

  const cards: Insight[] = [
    { key: 'total', label: 'Drivers', value: rows.length, hint: 'With a bus', icon: Users },
    {
      key: 'in',
      label: 'Checked in',
      value: checkedIn,
      hint: `${rows.length - checkedIn} not yet`,
      icon: UserRoundCheck,
      tone: 'success',
    },
    {
      key: 'late',
      label: 'Late',
      value: late,
      hint: 'After the reporting time',
      icon: Clock,
      tone: late ? 'warning' : 'neutral',
    },
    {
      key: 'attendant',
      label: 'Without attendant',
      value: noAttendant,
      hint: 'Driver said the helper is absent',
      icon: UserRoundX,
      tone: noAttendant ? 'danger' : 'neutral',
    },
  ]

  const columns: Column<DriverDay>[] = [
    { key: 'driver', header: 'DRIVER', cell: (row) => <DriverCell row={row} /> },
    {
      key: 'bus',
      header: 'BUS',
      cell: (row) => (
        <span className='text-[13px] leading-[18px] font-medium text-slate-800 dark:text-slate-200'>
          {row.vehicle?.name ?? 'No bus'}
        </span>
      ),
    },
    {
      key: 'reporting',
      header: 'REPORTING',
      cell: (row) => (
        <span className='text-[13px] leading-[18px] text-slate-700 tabular-nums dark:text-slate-300'>
          {row.duty?.reporting_time ?? '—'}
        </span>
      ),
    },
    { key: 'check_in', header: 'CHECK-IN', cell: (row) => <CheckInCell row={row} /> },
    { key: 'late', header: 'LATE', cell: (row) => <LateCell row={row} /> },
    {
      key: 'attendant',
      header: 'ATTENDANT',
      hideBelow: 'lg',
      cell: (row) => <AttendantCell row={row} />,
    },
    {
      key: 'check_out',
      header: 'CHECK-OUT',
      cell: (row) => (
        <span className='text-[13px] leading-[18px] text-slate-700 tabular-nums dark:text-slate-300'>
          {row.duty?.check_out_at ? clock(row.duty.check_out_at) : '—'}
        </span>
      ),
    },
    {
      key: 'hours',
      header: 'HOURS',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='text-[13px] leading-[18px] text-slate-700 tabular-nums dark:text-slate-300'>
          {hoursText(row.duty?.hours ?? null)}
        </span>
      ),
    },
  ]

  return (
    <Page>
      <PageHeader
        eyebrow='Fleet'
        title='Driver attendance'
        description='Drivers check in from the Driver app with a selfie and their location. Late is counted from the reporting time, 15 minutes before the first stop.'
        actions={
          <OpsDayBar
            id='driver-attendance-date'
            day={day}
            live={live}
            onChange={(date) => setSearch({ date })}
          />
        }
      />

      <InsightCards items={cards} loading={list.isPending} />

      <Card className='overflow-hidden'>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(row) => row.driver.id}
          loading={list.isFetching && !list.data}
          error={list.isError ? list.error.message : null}
          onRetry={() => list.refetch()}
          rowClassName={(row) => (row.duty ? undefined : 'bg-muted/40 text-muted-foreground')}
          empty={{
            icon: IdCard,
            title: 'No drivers yet',
            description: 'Drivers assigned to a bus appear here with their check-in for the day.',
          }}
          card={(row) => (
            <div className='grid gap-2'>
              <div className='flex items-start justify-between gap-3'>
                <DriverCell row={row} />
                <LateCell row={row} />
              </div>
              <span className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
                {row.vehicle?.name ?? 'No bus'} · Reporting {row.duty?.reporting_time ?? '—'}
              </span>
              <div className='flex flex-wrap items-start gap-4 text-[12px] leading-[16px]'>
                <CheckInCell row={row} />
                <AttendantCell row={row} />
                {row.duty?.check_out_at && (
                  <span>
                    Out {clock(row.duty.check_out_at)} · {hoursText(row.duty.hours)}
                  </span>
                )}
              </div>
            </div>
          )}
        />
      </Card>
    </Page>
  )
}
