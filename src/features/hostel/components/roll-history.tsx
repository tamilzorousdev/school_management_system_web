import { useState } from 'react'
import { CircleOff, History } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { DatePicker } from '@/components/common/date-picker'
import { FilterSelect, ListToolbar } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatDate, formatDateTime } from '@/lib/format'
import { useRollSessions, type RollSession, type RollSlot } from '../api'
import { labelOptions, ROLL_SLOT } from '../labels'
import { HostelSelect } from './pickers'

const LIMIT = 20

export function RollHistoryView({
  hostelId,
  page,
  onHostelChange,
  onPageChange,
  onOpen,
}: {
  hostelId?: number
  page: number
  onHostelChange: (hostelId?: number) => void
  onPageChange: (page: number) => void
  onOpen: (row: RollSession) => void
}) {
  const [slot, setSlot] = useState<RollSlot | undefined>()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const sessions = useRollSessions({
    page,
    limit: LIMIT,
    hostel_id: hostelId,
    slot,
    from: from || undefined,
    to: to || undefined,
  })
  const filtered = Boolean(hostelId || slot || from || to)

  const columns: Column<RollSession>[] = [
    {
      key: 'date',
      header: 'Date',
      cell: (row) => (
        <div className='grid gap-0.5'>
          <span className='font-semibold'>{formatDate(row.roll_date)}</span>
          <span className='text-xs text-muted-foreground'>{ROLL_SLOT[row.slot]}</span>
        </div>
      ),
    },
    { key: 'hostel', header: 'Hostel', hideBelow: 'lg', cell: (row) => row.hostel_name },
    {
      key: 'present',
      header: 'Present',
      align: 'right',
      cell: (row) => <span className='tabular text-success'>{row.present}</span>,
    },
    {
      key: 'absent',
      header: 'Absent',
      align: 'right',
      cell: (row) => <span className='tabular text-destructive'>{row.absent}</span>,
    },
    { key: 'late', header: 'Late', align: 'right', cell: (row) => <Num value={row.late} /> },
    { key: 'away', header: 'Away', align: 'right', cell: (row) => <Num value={row.away} /> },
    {
      key: 'marked',
      header: 'Marked',
      align: 'right',
      cell: (row) => <Num value={row.marked} />,
    },
    {
      key: 'finished',
      header: 'Finished',
      cell: (row) =>
        row.finished_at ? (
          <span className='text-xs text-muted-foreground'>{formatDateTime(row.finished_at)}</span>
        ) : (
          <Badge tone='warning'>Not finished</Badge>
        ),
    },
  ]

  return (
    <Card className='overflow-hidden'>
      <ListToolbar
        summary={sessions.data ? `${sessions.data.total} roll calls` : ''}
        onClear={
          filtered
            ? () => {
                setSlot(undefined)
                setFrom('')
                setTo('')
                onHostelChange(undefined)
              }
            : undefined
        }
      >
        <HostelSelect
          id='roll-history-hostel'
          allLabel='All hostels'
          value={hostelId ? String(hostelId) : undefined}
          onChange={(value) => onHostelChange(value ? Number(value) : undefined)}
        />
        <FilterSelect
          id='roll-history-slot'
          label='Filter by slot'
          allLabel='All slots'
          value={slot}
          options={labelOptions(ROLL_SLOT)}
          onChange={(value) => {
            setSlot(value as RollSlot | undefined)
            onPageChange(1)
          }}
        />
        <DatePicker
          id='roll-history-from'
          value={from}
          max={to || undefined}
          placeholder='From date'
          className='sm:w-40'
          onChange={(value: string) => {
            setFrom(value)
            onPageChange(1)
          }}
        />
        <DatePicker
          id='roll-history-to'
          value={to}
          min={from || undefined}
          placeholder='To date'
          className='sm:w-40'
          onChange={(value: string) => {
            setTo(value)
            onPageChange(1)
          }}
        />
      </ListToolbar>
      <DataTable
        rows={sessions.data?.items ?? []}
        columns={columns}
        rowKey={(row) => row.id}
        loading={sessions.isFetching}
        error={sessions.isError ? sessions.error.message : null}
        onRetry={() => sessions.refetch()}
        onRowClick={onOpen}
        empty={{
          icon: filtered ? CircleOff : History,
          title: filtered ? 'No roll calls match these filters' : 'No roll calls yet',
          description:
            'Each hostel, date and slot gets one roll call once the first mark is saved.',
        }}
        card={(row) => (
          <div className='grid gap-2'>
            <div className='flex items-start justify-between gap-2'>
              <div className='grid gap-0.5'>
                <span className='font-semibold'>
                  {formatDate(row.roll_date)} · {ROLL_SLOT[row.slot]}
                </span>
                <span className='text-xs text-muted-foreground'>{row.hostel_name}</span>
              </div>
              {row.finished_at ? (
                <Badge tone='success'>Finished</Badge>
              ) : (
                <Badge tone='warning'>Not finished</Badge>
              )}
            </div>
            <span className='tabular text-xs text-muted-foreground'>
              {row.present} present · {row.absent} absent · {row.late} late · {row.away} away ·{' '}
              {row.marked} marked
            </span>
          </div>
        )}
        pagination={{
          page,
          limit: LIMIT,
          total: sessions.data?.total ?? 0,
          label: 'roll calls',
          onPageChange,
        }}
      />
    </Card>
  )
}

function Num({ value }: { value: number }) {
  return <span className='tabular'>{value}</span>
}
