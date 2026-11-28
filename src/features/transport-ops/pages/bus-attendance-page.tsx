import { useMemo, useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { AlertTriangle, CircleOff, GraduationCap, SunMedium, Sunset, Users } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { TableCheckbox } from '@/features/attendance/components/students-tab'
import { clock } from '@/features/fleet/labels'
import { useBusRoutes } from '@/features/transport/api'
import { useBusAttendance, type BusAttendanceRow } from '../api'
import { OpsDayBar } from '../components/ops-day'
import { classAttendance, opsDay, rideStatus } from '../labels'
import type { BusAttendanceSearch } from '../search'

const route = getRouteApi('/_app/transport/bus-attendance')

function Ride({ status, at, extra }: { status: string; at: string | null; extra?: string | null }) {
  const ride = rideStatus(status)
  return (
    <div className='grid justify-items-start gap-0.5'>
      <Badge tone={ride.tone} className='font-medium'>
        {ride.label}
      </Badge>
      {at && (
        <span className='text-[12px] leading-[16px] text-slate-500 tabular-nums dark:text-slate-400'>
          {clock(at)}
        </span>
      )}
      {extra && (
        <span className='text-[12px] leading-[16px] break-words text-slate-500 dark:text-slate-400'>
          To {extra}
        </span>
      )}
    </div>
  )
}

function StudentCell({ row }: { row: BusAttendanceRow }) {
  return (
    <div className='grid min-w-0 gap-0.5'>
      <span className='flex flex-wrap items-center gap-1.5 text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
        {row.full_name}
        {row.mismatch && (
          <Badge
            tone='danger'
            className='font-medium'
            title='The bus and the class register do not agree'
          >
            <AlertTriangle className='size-3' />
            Mismatch
          </Badge>
        )}
        {row.pass_on_hold && (
          <Badge tone='warning' className='font-medium' title='The bus pass is on hold now'>
            Pass on hold
          </Badge>
        )}
        {row.boarded_on_hold && (
          <Badge
            tone='warning'
            className='font-medium'
            title='Got on today with the bus pass on hold'
          >
            Boarded on hold
          </Badge>
        )}
      </span>
      <span className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
        {row.class_section ?? 'No class'}
      </span>
    </div>
  )
}

function ClassCell({ row }: { row: BusAttendanceRow }) {
  const status = classAttendance(row.class_attendance)
  return status ? (
    <Badge tone={status.tone} className='font-medium'>
      {status.label}
    </Badge>
  ) : (
    <span className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
      Not marked
    </span>
  )
}

export function BusAttendancePage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/transport/bus-attendance' })
  const { day, live } = opsDay(search.date)
  const list = useBusAttendance(day, search.route_id, live)
  const routes = useBusRoutes()
  const all = useMemo(() => list.data ?? [], [list.data])
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const rows = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    return all.filter((row) => {
      if (search.mismatch && !row.mismatch) return false
      if (search.on_hold && !row.pass_on_hold) return false
      if (!q) return true
      return (
        row.full_name.toLowerCase().includes(q) ||
        row.route.name.toLowerCase().includes(q) ||
        (row.stop?.toLowerCase().includes(q) ?? false) ||
        (row.class_section?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [all, search.mismatch, search.on_hold, searchText])

  const maxPage = Math.max(1, Math.ceil(rows.length / limit))
  const currentPage = Math.min(page, maxPage)
  const paginatedRows = useMemo(
    () => rows.slice((currentPage - 1) * limit, currentPage * limit),
    [rows, currentPage, limit]
  )

  const pageIds = paginatedRows.map((row) => row.student_id)
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id))
  const isIndeterminate = !allOnPage && pageIds.some((id) => selected.has(id))
  const toggle = (id: number) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const togglePage = () =>
    setSelected((current) => {
      const next = new Set(current)
      for (const id of pageIds) {
        if (allOnPage) next.delete(id)
        else next.add(id)
      }
      return next
    })

  const count = (predicate: (row: BusAttendanceRow) => boolean) => all.filter(predicate).length

  const setSearch = (patch: Partial<BusAttendanceSearch>) => {
    setPage(1)
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })
  }

  useShortcut('app.refresh', () => void list.refetch())

  const mismatches = count((row) => row.mismatch)
  const cards: Insight[] = [
    { key: 'riders', label: 'Students', value: all.length, hint: 'On the bus list', icon: Users },
    {
      key: 'morning',
      label: 'Boarded in the morning',
      value: count((row) => row.pickup === 'boarded'),
      hint: `${count((row) => row.pickup === 'not_boarded')} not boarded`,
      icon: SunMedium,
      tone: 'success',
    },
    {
      key: 'evening',
      label: 'Dropped in the evening',
      value: count((row) => row.drop === 'dropped'),
      hint: `${count((row) => row.drop === 'on_bus')} on the bus`,
      icon: Sunset,
      tone: 'info',
    },
    {
      key: 'mismatch',
      label: 'Mismatches',
      value: mismatches,
      hint: 'Bus and class disagree',
      icon: AlertTriangle,
      tone: mismatches ? 'danger' : 'neutral',
      active: search.mismatch === true,
      onClick: () => setSearch({ mismatch: search.mismatch ? undefined : true }),
    },
  ]

  const columns: Column<BusAttendanceRow>[] = [
    {
      key: 'select',
      header: (
        <TableCheckbox
          ariaLabel='Select all students on this page'
          checked={allOnPage}
          indeterminate={isIndeterminate}
          onChange={togglePage}
        />
      ),
      className: 'w-12 text-center',
      cell: (row) => (
        <TableCheckbox
          ariaLabel={`Select ${row.full_name}`}
          checked={selected.has(row.student_id)}
          onChange={() => toggle(row.student_id)}
        />
      ),
    },
    { key: 'student', header: 'STUDENT', cell: (row) => <StudentCell row={row} /> },
    {
      key: 'route',
      header: 'ROUTE & STOP',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='truncate text-[13px] leading-[18px] font-medium text-slate-800 dark:text-slate-200'>
            {row.route.name}
          </span>
          <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            {row.stop ?? 'No stop'}
          </span>
        </div>
      ),
    },
    {
      key: 'morning',
      header: 'MORNING',
      cell: (row) => <Ride status={row.pickup} at={row.pickup_at} />,
    },
    {
      key: 'evening',
      header: 'EVENING',
      cell: (row) => <Ride status={row.drop} at={row.drop_at} extra={row.handed_to} />,
    },
    {
      key: 'away',
      header: 'AWAY NOTE',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='line-clamp-2 max-w-56 text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
          {row.away_note ?? '—'}
        </span>
      ),
    },
    { key: 'class', header: 'CLASS ATTENDANCE', cell: (row) => <ClassCell row={row} /> },
  ]

  const filtered = Boolean(searchText || search.route_id || search.mismatch || search.on_hold)

  return (
    <Page>
      <PageHeader
        eyebrow='Fleet'
        title='Bus attendance'
        description='Every student on a bus with their morning pickup and evening drop, who they were handed to, and whether the bus agrees with the class register.'
        actions={
          <OpsDayBar
            id='bus-attendance-date'
            day={day}
            live={live}
            onChange={(date) => setSearch({ date })}
          />
        }
      />

      <InsightCards items={cards} loading={list.isPending} />

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={list.data ? `${rows.length} ${rows.length === 1 ? 'student' : 'students'}` : ''}
          onClear={
            filtered
              ? () => {
                  setSearchText('')
                  setSearch({ route_id: undefined, mismatch: undefined, on_hold: undefined })
                }
              : undefined
          }
        >
          <SearchBox
            value={searchText}
            onChange={(value) => {
              setSearchText(value)
              setPage(1)
            }}
            placeholder='Search student, route or stop'
            label='Search bus attendance'
            compact
            showShortcut={false}
          />
          <FilterSelect
            id='bus-attendance-route'
            label='Filter by route'
            allLabel='All routes'
            value={search.route_id ? String(search.route_id) : undefined}
            options={(routes.data ?? []).map((item) => ({
              value: String(item.id),
              label: item.name,
              hint: item.code,
            }))}
            onChange={(value) => setSearch({ route_id: value ? Number(value) : undefined })}
          />
          <label className='flex items-center gap-2 text-sm font-medium'>
            <Switch
              checked={search.mismatch === true}
              onCheckedChange={(checked) => setSearch({ mismatch: checked ? true : undefined })}
              aria-label='Only mismatches'
            />
            Only mismatches
          </label>
          <label className='flex items-center gap-2 text-sm font-medium'>
            <Switch
              checked={search.on_hold === true}
              onCheckedChange={(checked) => setSearch({ on_hold: checked ? true : undefined })}
              aria-label='Only pass on hold'
            />
            Only pass on hold
          </label>
        </ListToolbar>
        <DataTable
          rows={paginatedRows}
          columns={columns}
          rowKey={(row) => `${row.student_id}-${row.route.id}`}
          loading={list.isFetching && !list.data}
          error={list.isError ? list.error.message : null}
          onRetry={() => list.refetch()}
          isSelected={(row) => selected.has(row.student_id)}
          onRowClick={(row) => toggle(row.student_id)}
          rowClassName={(row) => (row.mismatch && !selected.has(row.student_id) ? 'bg-destructive/5' : undefined)}
          empty={{
            icon: filtered ? CircleOff : GraduationCap,
            title: filtered ? 'No students match these filters' : 'No students on a bus',
            description: filtered
              ? 'Try another route or turn off the switches.'
              : 'Students assigned to a route appear here.',
          }}
          card={(row) => (
            <div className='grid gap-2'>
              <div className='flex items-start justify-between gap-3'>
                <StudentCell row={row} />
                <ClassCell row={row} />
              </div>
              <span className='text-xs text-muted-foreground'>
                {row.route.name} · {row.stop ?? 'No stop'}
              </span>
              <div className='flex flex-wrap gap-6'>
                <div className='grid gap-1'>
                  <span className='text-[11px] font-bold text-muted-foreground uppercase'>
                    Morning
                  </span>
                  <Ride status={row.pickup} at={row.pickup_at} />
                </div>
                <div className='grid gap-1'>
                  <span className='text-[11px] font-bold text-muted-foreground uppercase'>
                    Evening
                  </span>
                  <Ride status={row.drop} at={row.drop_at} extra={row.handed_to} />
                </div>
              </div>
              {row.away_note && (
                <span className='text-xs text-muted-foreground'>{row.away_note}</span>
              )}
            </div>
          )}
          pagination={{
            page: currentPage,
            limit,
            total: rows.length,
            label: 'students',
            onPageChange: setPage,
            onLimitChange: (next) => {
              setLimit(next)
              setPage(1)
            },
          }}
        />
      </Card>
    </Page>
  )
}
