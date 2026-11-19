import { useState } from 'react'
import {
  CalendarCheck,
  CheckCheck,
  Clock,
  Palmtree,
  PenLine,
  RotateCw,
  UserRoundX,
  UsersRound,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useStaffBoard, type StaffBoardRow } from '../api'
import { SOURCE_LABELS, STAFF_DAY_STATUS, clockTime } from '../labels'
import type { AttendanceSearch } from '../search'
import { TableCheckbox, StatusPill } from './students-tab'
import { BulkActionBar } from './bulk-action-bar'
import { BulkStaffModal } from './bulk-mark-modal'
import { CorrectModal } from './correct-modal'
import { DateStepper } from './date-stepper'

const timeText = (value: string | null) => clockTime(value) || '—'
const PAGE_SIZE = 20

type StaffFilter = NonNullable<AttendanceSearch['staff_status']>

export function StaffTab({
  date,
  canManage,
  page,
  search,
  status,
  onDateChange,
  onSearchChange,
}: {
  date: string
  canManage: boolean
  page: number
  search?: string
  status?: StaffFilter
  onDateChange: (date: string) => void
  onSearchChange: (patch: Partial<AttendanceSearch>) => void
}) {
  const board = useStaffBoard({ date, page, limit: PAGE_SIZE, search, status })
  const data = board.data
  const [correcting, setCorrecting] = useState<StaffBoardRow | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [selectedDate, setSelectedDate] = useState(date)
  const [bulk, setBulk] = useState<number[] | 'not_checked_in' | null>(null)
  if (selectedDate !== date) {
    setSelectedDate(date)
    setSelected(new Set())
  }
  const rows = data?.staff ?? []
  const pageIds = rows.map((row) => row.user_id)
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id))
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
  const filterBy = (value: StaffFilter) =>
    onSearchChange({ staff_status: status === value ? undefined : value, staff_page: 1 })

  useShortcut('app.refresh', () => void board.refetch())

  const cards: Insight[] = [
    {
      key: 'present',
      label: 'Present',
      value: data?.present ?? 0,
      hint: `of ${data?.total ?? 0} staff`,
      icon: CalendarCheck,
      tone: 'success',
      active: status === 'present',
      onClick: () => filterBy('present'),
    },
    {
      key: 'late',
      label: 'Late',
      value: data?.late ?? 0,
      hint: data ? `After ${data.reporting_time}` : 'After reporting time',
      icon: Clock,
      tone: data?.late ? 'warning' : 'neutral',
      active: status === 'late',
      onClick: () => filterBy('late'),
    },
    {
      key: 'leave',
      label: 'On leave',
      value: data?.on_leave ?? 0,
      hint: 'Approved leave today',
      icon: Palmtree,
      tone: 'info',
      active: status === 'on_leave',
      onClick: () => filterBy('on_leave'),
    },
    {
      key: 'not-in',
      label: 'Not checked in',
      value: data?.not_checked_in ?? 0,
      hint: 'No check-in yet',
      icon: UserRoundX,
      tone: data?.not_checked_in ? 'danger' : 'success',
      active: status === 'not_checked_in',
      onClick: () => filterBy('not_checked_in'),
    },
  ]

  const correctButton = (row: StaffBoardRow) =>
    canManage && (
      <Button
        variant='outline'
        size='sm'
        aria-label={`Correct attendance for ${row.name}`}
        onClick={(event) => {
          event.stopPropagation()
          setCorrecting(row)
        }}
        className='h-7.5 px-2.5 text-[12px] font-medium'
      >
        <PenLine className='size-3.5' />
        Correct
      </Button>
    )

  const columns: Column<StaffBoardRow>[] = [
    ...(canManage
      ? [
          {
            key: 'select',
            header: (
              <TableCheckbox
                ariaLabel='Select everyone on this page'
                checked={allOnPage}
                onChange={togglePage}
              />
            ),
            className: 'w-12 text-center',
            cell: (row: StaffBoardRow) => (
              <TableCheckbox
                ariaLabel={`Select ${row.name}`}
                checked={selected.has(row.user_id)}
                onChange={() => toggle(row.user_id)}
              />
            ),
          },
        ]
      : []),
    {
      key: 'name',
      header: 'STAFF ⇅',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='truncate font-semibold text-[13px] leading-[18px] text-slate-900 dark:text-slate-100'>
            {row.name}
          </span>
          <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            {row.designation}
            {row.department ? ` · ${row.department}` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      cell: (row) => {
        const info = STAFF_DAY_STATUS[row.status]
        const toneMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
          success: 'success',
          warning: 'warning',
          danger: 'danger',
          info: 'info',
          neutral: 'neutral',
        }
        return <StatusPill tone={toneMap[info.tone] ?? 'neutral'} label={info.label} />
      },
    },
    {
      key: 'in',
      header: 'CHECK-IN',
      cell: (row) => (
        <span className='tabular-nums text-[13px] leading-[18px] font-normal text-slate-700 dark:text-slate-300'>
          {timeText(row.check_in_at)}
        </span>
      ),
    },
    {
      key: 'out',
      header: 'CHECK-OUT',
      cell: (row) => (
        <span className='tabular-nums text-[13px] leading-[18px] font-normal text-slate-700 dark:text-slate-300'>
          {timeText(row.check_out_at)}
        </span>
      ),
    },
    {
      key: 'distance',
      header: 'DISTANCE',
      hideBelow: 'lg',
      cell: (row) =>
        row.check_in_distance_m !== null ? (
          <span className='tabular-nums text-[13px] leading-[18px] font-normal text-slate-700 dark:text-slate-300'>
            {row.check_in_distance_m} m
          </span>
        ) : (
          <span className='text-slate-400'>—</span>
        ),
    },
    {
      key: 'source',
      header: 'Source',
      hideBelow: 'lg',
      cell: (row) =>
        row.source ? (
          <span className='grid'>
            <span>{SOURCE_LABELS[row.source]}</span>
            {row.remarks && (
              <span className='max-w-48 truncate text-xs text-muted-foreground'>{row.remarks}</span>
            )}
          </span>
        ) : (
          <span className='text-muted-foreground'>—</span>
        ),
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: '',
            align: 'right' as const,
            cell: correctButton,
          },
        ]
      : []),
  ]

  return (
    <div className='grid gap-4'>
      <DateStepper id='staff-attendance-date' value={date} onChange={onDateChange} />
      <InsightCards items={cards} loading={board.isPending} />
      <Card className='overflow-hidden'>
        <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
          <h2 className='font-bold'>Staff check-ins</h2>
          <div className='flex flex-wrap items-center gap-2'>
            {data && (
              <span className='text-xs text-muted-foreground'>
                Reporting time {data.reporting_time}
              </span>
            )}
            {canManage && Boolean(data?.not_checked_in) && (
              <Button size='sm' variant='outline' onClick={() => setBulk('not_checked_in')}>
                <CheckCheck />
                Mark everyone not checked in
              </Button>
            )}
          </div>
        </div>
        <ListToolbar
          summary={
            data
              ? `${data.filtered_total} of ${data.total} staff${status ? ` · ${STAFF_DAY_STATUS[status].label}` : ''}`
              : ''
          }
          onClear={
            search || status
              ? () =>
                  onSearchChange({
                    staff_search: undefined,
                    staff_status: undefined,
                    staff_page: 1,
                  })
              : undefined
          }
        >
          <SearchBox
            value={search ?? ''}
            onChange={(value) =>
              onSearchChange({ staff_search: value || undefined, staff_page: 1 })
            }
            placeholder='Name, designation or department'
            label='Search staff'
          />
        </ListToolbar>
        {canManage && selected.size > 0 && (
          <BulkActionBar
            count={selected.size}
            label='selected'
            onClear={() => setSelected(new Set())}
            actions={[
              {
                label: 'Change status',
                icon: <RotateCw className='size-3.5' />,
                onClick: () => setBulk([...selected]),
              },
            ]}
            primaryAction={{
              label: 'Mark selected',
              icon: <CheckCheck className='size-3.5' />,
              onClick: () => setBulk([...selected]),
              variant: 'primary',
            }}
          />
        )}
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(row) => row.user_id}
          loading={board.isFetching}
          error={board.isError ? board.error.message : null}
          onRetry={() => board.refetch()}
          pagination={
            data
              ? {
                  page: data.page,
                  limit: data.limit,
                  total: data.filtered_total,
                  label: 'staff',
                  onPageChange: (next) => onSearchChange({ staff_page: next }),
                }
              : undefined
          }
          empty={
            search || status
              ? {
                  icon: UsersRound,
                  title: 'No staff match',
                  description: 'Change the search or click the card again to see everyone.',
                }
              : {
                  icon: UsersRound,
                  title: 'No staff yet',
                  description: 'Add staff in the Staff page so they can check in.',
                }
          }
          card={(row) => (
            <div className='flex items-start gap-3 table-typography'>
              {canManage && (
                <span className='pt-1'>
                  <TableCheckbox
                    ariaLabel={`Select ${row.name}`}
                    checked={selected.has(row.user_id)}
                    onChange={() => toggle(row.user_id)}
                  />
                </span>
              )}
              <div className='grid min-w-0 flex-1 gap-1.5'>
                <div className='flex items-start justify-between gap-2'>
                  <span className='grid min-w-0'>
                    <span className='truncate font-semibold text-[13px] leading-[18px] text-slate-900 dark:text-slate-100'>
                      {row.name}
                    </span>
                    <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
                      {row.designation}
                    </span>
                  </span>
                  {(() => {
                    const info = STAFF_DAY_STATUS[row.status]
                    const toneMap: Record<
                      string,
                      'success' | 'warning' | 'danger' | 'info' | 'neutral'
                    > = {
                      success: 'success',
                      warning: 'warning',
                      danger: 'danger',
                      info: 'info',
                      neutral: 'neutral',
                    }
                    return <StatusPill tone={toneMap[info.tone] ?? 'neutral'} label={info.label} />
                  })()}
                </div>
                <span className='tabular-nums text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
                  In {timeText(row.check_in_at)} · Out {timeText(row.check_out_at)}
                  {row.check_in_distance_m !== null && ` · ${row.check_in_distance_m} m`}
                  {row.source && ` · ${SOURCE_LABELS[row.source]}`}
                </span>
                {canManage && <div>{correctButton(row)}</div>}
              </div>
            </div>
          )}
        />
      </Card>
      {correcting && <CorrectModal row={correcting} onClose={() => setCorrecting(null)} />}
      {bulk && (
        <BulkStaffModal
          date={date}
          userIds={bulk}
          onClose={() => setBulk(null)}
          onDone={() => {
            setBulk(null)
            setSelected(new Set())
          }}
        />
      )}
    </div>
  )
}
