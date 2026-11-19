import { useState } from 'react'
import { Activity, CircleOff } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { DataTable, type Column } from '@/components/common/data-table'
import { ListToolbar } from '@/components/common/list-toolbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDateTime, formatNumber } from '@/lib/format'
import { useObdLog, type ObdReading } from '../api'

const LIMIT = 20

const startOf = (date: string) => (date ? `${date}T00:00:00+05:30` : undefined)
const endOf = (date: string) => (date ? `${date}T23:59:59+05:30` : undefined)

interface ObdLogModalProps {
  busId: number
  busName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ObdLogModal({ busId, busName, open, onOpenChange }: ObdLogModalProps) {
  const [page, setPage] = useState(1)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const log = useObdLog(open ? busId : null, {
    page,
    limit: LIMIT,
    from: startOf(from),
    to: endOf(to),
  })
  const rows = log.data?.items ?? []

  const columns: Column<ObdReading>[] = [
    {
      key: 'at',
      header: 'Time',
      cell: (row) => <span className='tabular text-xs'>{formatDateTime(row.recorded_at)}</span>,
    },
    {
      key: 'rpm',
      header: 'RPM',
      align: 'right',
      cell: (row) => <span className='tabular'>{formatNumber(row.rpm)}</span>,
    },
    {
      key: 'speed',
      header: 'Speed',
      align: 'right',
      cell: (row) => <span className='tabular'>{formatNumber(row.speed, 0, 'km/h')}</span>,
    },
    {
      key: 'coolant',
      header: 'Coolant',
      align: 'right',
      cell: (row) => (
        <span className={(row.coolant_c ?? 0) > 105 ? 'font-semibold text-destructive' : ''}>
          {formatNumber(row.coolant_c, 0, '°C')}
        </span>
      ),
    },
    {
      key: 'load',
      header: 'Load',
      align: 'right',
      hideBelow: 'lg',
      cell: (row) => <span className='tabular'>{formatNumber(row.engine_load_pct, 0, '%')}</span>,
    },
    {
      key: 'fuel',
      header: 'Fuel',
      align: 'right',
      cell: (row) => <span className='tabular'>{formatNumber(row.fuel_pct, 0, '%')}</span>,
    },
    {
      key: 'battery',
      header: 'Battery',
      align: 'right',
      cell: (row) => <span className='tabular'>{formatNumber(row.battery_v, 1, 'V')}</span>,
    },
    {
      key: 'odometer',
      header: 'Odometer',
      align: 'right',
      hideBelow: 'lg',
      cell: (row) => <span className='tabular'>{formatNumber(row.odometer_km, 0, 'km')}</span>,
    },
    {
      key: 'dtc',
      header: 'Faults',
      cell: (row) =>
        row.dtc?.length ? (
          <span className='font-mono text-xs text-destructive'>{row.dtc.join(', ')}</span>
        ) : (
          <span className='text-muted-foreground'>—</span>
        ),
    },
  ]

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={`OBD log · ${busName}`}
      description='Engine readings from the tracker, newest first.'
      size='xl'
    >
      <div className='-mx-6 grid min-w-0 border-y'>
        <ListToolbar
          summary={log.data ? `${log.data.total} readings` : ''}
          onClear={
            from || to
              ? () => {
                  setFrom('')
                  setTo('')
                  setPage(1)
                }
              : undefined
          }
        >
          <Input
            type='date'
            aria-label='From date'
            value={from}
            max={to || undefined}
            onChange={(event) => {
              setFrom(event.target.value)
              setPage(1)
            }}
            className='w-full sm:w-40'
          />
          <Input
            type='date'
            aria-label='To date'
            value={to}
            min={from || undefined}
            onChange={(event) => {
              setTo(event.target.value)
              setPage(1)
            }}
            className='w-full sm:w-40'
          />
        </ListToolbar>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(row) => row.id}
          loading={log.isFetching}
          error={log.isError ? log.error.message : null}
          onRetry={() => log.refetch()}
          empty={{
            icon: from || to ? CircleOff : Activity,
            title: from || to ? 'No readings in these dates' : 'No engine readings yet',
            description: 'Readings appear when the tracker sends OBD data.',
            action: (from || to) && (
              <Button
                variant='outline'
                onClick={() => {
                  setFrom('')
                  setTo('')
                }}
              >
                Show all dates
              </Button>
            ),
          }}
          card={(row) => (
            <div className='grid gap-1.5 text-sm'>
              <div className='flex items-center justify-between gap-2'>
                <span className='tabular text-xs text-muted-foreground'>
                  {formatDateTime(row.recorded_at)}
                </span>
                {Boolean(row.dtc?.length) && (
                  <span className='font-mono text-xs text-destructive'>{row.dtc.join(', ')}</span>
                )}
              </div>
              <div className='tabular grid grid-cols-3 gap-2 text-xs'>
                <span>{formatNumber(row.rpm, 0, 'rpm')}</span>
                <span>{formatNumber(row.coolant_c, 0, '°C')}</span>
                <span>{formatNumber(row.battery_v, 1, 'V')}</span>
                <span>{formatNumber(row.speed, 0, 'km/h')}</span>
                <span>Fuel {formatNumber(row.fuel_pct, 0, '%')}</span>
                <span>{formatNumber(row.odometer_km, 0, 'km')}</span>
              </div>
            </div>
          )}
          pagination={{
            page,
            limit: LIMIT,
            total: log.data?.total ?? 0,
            label: 'readings',
            onPageChange: setPage,
          }}
        />
      </div>
    </AppModal>
  )
}
