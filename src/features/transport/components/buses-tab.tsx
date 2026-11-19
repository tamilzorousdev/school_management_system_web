import { useState } from 'react'
import {
  Bus as BusIcon,
  CircleOff,
  FileText,
  Pencil,
  Plus,
  Radio,
  ShieldAlert,
  Trash2,
} from 'lucide-react'
import { Combobox } from '@/components/common/combobox'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { run } from '@/features/setup/form-actions'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/format'
import { transportApi, useBuses, useTransportMutation, type Bus, type BusFlag } from '../api'
import { FLAG_LABELS, toOptions, VEHICLE_TYPE_LABELS } from '../labels'
import { AllowTodayModal } from './allow-today-modal'
import { BusDocumentsModal } from './bus-documents-modal'
import { BusFormModal } from './bus-form-modal'
import { ExpiryBadges } from './expiry-badges'

const LIMIT = 20

function Seats({ bus }: { bus: Bus }) {
  return (
    <span className='grid'>
      <span
        className={cn(
          'tabular font-semibold',
          bus.over_capacity && 'text-destructive',
          bus.nearly_full && 'text-warning'
        )}
      >
        {bus.students}/{bus.capacity}
        <span className='font-normal text-muted-foreground'> seats used</span>
      </span>
      {(bus.nearly_full || bus.over_capacity) && (
        <span className='text-xs text-muted-foreground'>
          {bus.over_capacity ? 'More students than seats' : `${bus.occupancy_percent}% full`}
        </span>
      )}
    </span>
  )
}

export function RoadStatus({ bus }: { bus: Bus }) {
  if (bus.road_worthy) return null
  return bus.allowed_today ? (
    <Badge
      tone='warning'
      title={`${bus.allowed_today.reason} · ${bus.allowed_today.by?.name ?? ''} · ${formatDateTime(bus.allowed_today.at)}`}
    >
      Allowed today
    </Badge>
  ) : (
    <Badge tone='danger' title={`${bus.road_blockers?.join(', ') || 'Documents'} expired`}>
      Not road-worthy
    </Badge>
  )
}

function Tracker({ bus }: { bus: Bus }) {
  return bus.device ? (
    <span className='flex items-center gap-1.5 font-mono text-xs'>
      <Radio className='size-3.5 text-success' />
      {bus.device.imei ?? `Tracker ${bus.device.id}`}
    </span>
  ) : (
    <span className='text-xs text-muted-foreground'>No tracker</span>
  )
}

const person = (value: Bus['driver']) =>
  value ? (
    <span className='grid'>
      <span className='font-semibold'>{value.name}</span>
      <span className='tabular text-xs text-muted-foreground'>{value.mobile}</span>
    </span>
  ) : (
    <span className='text-muted-foreground'>Not assigned</span>
  )

export function BusesTab({
  search,
  page,
  flag,
  canManage,
  onSearch,
  onFlag,
  onPage,
}: {
  search?: string
  page: number
  flag?: BusFlag
  canManage: boolean
  onSearch: (search: string | undefined) => void
  onFlag: (flag: BusFlag | undefined) => void
  onPage: (page: number) => void
}) {
  const buses = useBuses({ page, limit: LIMIT, search, flag })
  const [editing, setEditing] = useState<Bus | 'new' | null>(null)
  const [removing, setRemoving] = useState<Bus | null>(null)
  const [documents, setDocuments] = useState<Bus | null>(null)
  const [allowing, setAllowing] = useState<Bus | null>(null)
  const remove = useTransportMutation((id: number) => transportApi.removeBus(id))
  const allow = useTransportMutation((input: { id: number; reason: string }) =>
    transportApi.allowBusToday(input.id, input.reason)
  )
  const filtered = Boolean(search || flag)
  const rows = buses.data?.items ?? []

  const actions = (bus: Bus) => (
    <span className='flex justify-end'>
      {canManage && !bus.road_worthy && !bus.allowed_today && (
        <Button
          size='icon-sm'
          variant='ghost'
          aria-label={`Allow ${bus.registration_no} today`}
          title='Allow for today'
          className='text-warning hover:bg-warning/10'
          onClick={() => setAllowing(bus)}
        >
          <ShieldAlert />
        </Button>
      )}
      <Button
        size='icon-sm'
        variant='ghost'
        aria-label={`Documents of ${bus.registration_no}`}
        title='Documents'
        onClick={() => setDocuments(bus)}
      >
        <FileText />
      </Button>
      {canManage && (
        <Button
          size='icon-sm'
          variant='ghost'
          aria-label={`Edit ${bus.registration_no}`}
          onClick={() => setEditing(bus)}
        >
          <Pencil />
        </Button>
      )}
      {canManage && (
        <Button
          size='icon-sm'
          variant='ghost'
          aria-label={`Delete ${bus.registration_no}`}
          className='text-destructive hover:bg-destructive/10'
          onClick={() => setRemoving(bus)}
        >
          <Trash2 />
        </Button>
      )}
    </span>
  )

  const columns: Column<Bus>[] = [
    {
      key: 'bus',
      header: 'Bus',
      cell: (bus) => (
        <span className='grid'>
          <span className='flex flex-wrap items-center gap-1.5 font-mono font-bold'>
            {bus.registration_no}
            {bus.status === 'inactive' && <Badge>Off the road</Badge>}
            <RoadStatus bus={bus} />
          </span>
          <span className='text-xs text-muted-foreground'>
            {bus.name} · {VEHICLE_TYPE_LABELS[bus.vehicle_type]}
            {bus.make_model ? ` · ${bus.make_model}` : ''}
            {bus.ownership === 'contractor' ? ` · ${bus.contractor_name ?? 'Contractor'}` : ''}
          </span>
        </span>
      ),
    },
    { key: 'seats', header: 'Students', cell: (bus) => <Seats bus={bus} /> },
    { key: 'tracker', header: 'Tracker', cell: (bus) => <Tracker bus={bus} /> },
    { key: 'driver', header: 'Driver', cell: (bus) => person(bus.driver), hideBelow: 'lg' },
    {
      key: 'attendant',
      header: 'Attendant',
      cell: (bus) => person(bus.attendant),
      hideBelow: 'xl',
    },
    {
      key: 'documents',
      header: 'Documents',
      cell: (bus) => <ExpiryBadges items={bus.expiries} attentionOnly />,
      className: 'max-w-72',
    },
    { key: 'actions', header: '', align: 'right', cell: actions },
  ]

  return (
    <Card className='overflow-hidden'>
      <ListToolbar summary={buses.data ? `${buses.data.total} buses` : ''}>
        <SearchBox
          value={search ?? ''}
          onChange={(value) => onSearch(value || undefined)}
          placeholder='Registration, name or model'
          label='Search buses'
        />
        <Combobox
          id='bus-flag'
          label='Show buses'
          value={flag}
          options={toOptions(FLAG_LABELS)}
          allLabel='All buses'
          placeholder='All buses'
          onChange={(value) => onFlag(value as BusFlag | undefined)}
        />
        {canManage && (
          <Button onClick={() => setEditing('new')}>
            <Plus />
            Add bus
          </Button>
        )}
      </ListToolbar>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(bus) => bus.id}
        loading={buses.isFetching}
        error={buses.isError ? buses.error.message : null}
        onRetry={() => buses.refetch()}
        empty={{
          icon: filtered ? CircleOff : BusIcon,
          title: filtered ? 'No buses match' : 'No buses yet',
          description: filtered
            ? 'Try another registration, name or filter.'
            : 'Add the school buses with their seats, tracker, driver and documents.',
          action: !filtered && canManage && (
            <Button onClick={() => setEditing('new')}>
              <Plus />
              Add bus
            </Button>
          ),
        }}
        card={(bus) => (
          <div className='grid gap-2'>
            <div className='flex items-start justify-between gap-2'>
              <span className='grid min-w-0'>
                <span className='flex flex-wrap items-center gap-1.5 font-mono font-bold'>
                  {bus.registration_no}
                  <RoadStatus bus={bus} />
                </span>
                <span className='truncate text-xs text-muted-foreground'>
                  {bus.name} · {VEHICLE_TYPE_LABELS[bus.vehicle_type]}
                  {bus.make_model ? ` · ${bus.make_model}` : ''}
                </span>
              </span>
              {actions(bus)}
            </div>
            <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-sm'>
              <Seats bus={bus} />
              <Tracker bus={bus} />
            </div>
            <span className='text-xs text-muted-foreground'>
              Driver{' '}
              <span className='font-semibold text-foreground'>
                {bus.driver?.name ?? 'Not assigned'}
              </span>{' '}
              · Attendant{' '}
              <span className='font-semibold text-foreground'>
                {bus.attendant?.name ?? 'Not assigned'}
              </span>
            </span>
            <ExpiryBadges items={bus.expiries} attentionOnly />
          </div>
        )}
        pagination={{
          page,
          limit: LIMIT,
          total: buses.data?.total ?? 0,
          label: 'buses',
          onPageChange: onPage,
        }}
      />
      {documents && (
        <BusDocumentsModal
          bus={documents}
          canManage={canManage}
          onClose={() => setDocuments(null)}
        />
      )}
      {allowing && (
        <AllowTodayModal
          title={`Let ${allowing.registration_no} run today?`}
          description={`${allowing.road_blockers?.join(', ') || 'Documents'} expired. Trips can start until midnight; renew the document to clear it for good.`}
          onAllow={(reason) => allow.mutateAsync({ id: allowing.id, reason })}
          onClose={() => setAllowing(null)}
        />
      )}
      {editing && (
        <BusFormModal
          bus={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Delete ${removing?.registration_no ?? ''}?`}
        description='The bus is removed. Its routes and their students stay, without a bus.'
        confirmText='Delete bus'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          if (removing)
            await run(() => remove.mutateAsync(removing.id), `${removing.registration_no} deleted`)
          setRemoving(null)
        }}
      />
    </Card>
  )
}
