import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  BatteryMedium,
  Bus,
  CircleOff,
  Fuel,
  Gauge,
  KeyRound,
  MapPin,
  Navigation,
  PauseCircle,
  Route,
  Thermometer,
  Timer,
  Wrench,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState, ErrorState } from '@/components/common/display'
import { FleetMap } from '@/components/common/fleet-map'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { Page, PageHeader } from '@/components/common/page'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { today } from '@/features/attendance/labels'
import { can, useMe } from '@/features/auth/api'
import { useBuses, type Bus as SchoolBus } from '@/features/transport/api'
import { useNow } from '@/hooks/use-now'
import { useSelectedSchool } from '@/lib/auth/school-context'
import { formatDateTime, formatNumber, timeAgo } from '@/lib/format'
import { useLiveEvent, useLiveSubscription, type LivePosition } from '@/lib/live/socket'
import { cn } from '@/lib/utils'
import {
  ALERT_LABELS,
  EVENT_LABELS,
  fleetKeys,
  harshTotal,
  useFleetLive,
  usePositions,
  useTrips,
  VEHICLE_STATE,
  type Vehicle,
  type VehicleState,
} from '../api'
import { LiveBadge } from '../components/live-badge'
import { StartTripModal } from '../components/start-trip-modal'
import { TripsPanel } from '../components/trips-panel'
import { VehicleHealthCard } from '../components/vehicle-health-card'
import { showTripToast } from '../labels'

type Filter = 'all' | 'moving' | 'idle' | 'parked' | 'offline' | 'attention'

const matches = (vehicle: Vehicle, filter: Filter) => {
  if (filter === 'all') return true
  if (filter === 'attention') return vehicle.alerts.length > 0
  if (filter === 'offline') return vehicle.state === 'offline' || vehicle.state === 'no_data'
  return vehicle.state === filter
}

const duration = (since: string | null, now: number) => {
  if (!since) return null
  const minutes = Math.max(0, Math.round((now - new Date(since).getTime()) / 60000))
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`
}

const newer = (live: LivePosition | undefined, polled: Vehicle['position']) =>
  live && (!polled || new Date(live.recorded_at) > new Date(polled.recorded_at))

export function FleetPage() {
  const live = useFleetLive()
  const now = useNow()
  const queryClient = useQueryClient()
  const canManage = can(useMe().data, 'fleet.manage')
  const schoolId = useSelectedSchool()
  const socket = useLiveSubscription('fleet.subscribe', schoolId ? { school_id: schoolId } : {})
  const date = today()
  const trips = useTrips({ page: 1, limit: 50, date }, !socket.live)
  const buses = useBuses({ page: 1, limit: 100 })
  const [filter, setFilter] = useState<Filter>('all')
  const [openId, setOpenId] = useState<number | null>(null)
  const [starting, setStarting] = useState(false)
  const [livePositions, setLivePositions] = useState<Record<number, LivePosition>>({})
  const data = live.data
  const polled = data?.vehicles ?? []

  const trackerOf = (busId: number) => {
    const bus = buses.data?.items.find((item) => item.id === busId)
    if (!bus?.device) return null
    return (
      polled.find((vehicle) => bus.device!.imei && vehicle.imei === bus.device!.imei) ??
      polled.find((vehicle) => vehicle.id === bus.device!.id) ??
      null
    )
  }
  const busName = (busId: number) =>
    trips.data?.items.find((trip) => trip.vehicle.id === busId)?.vehicle.name ??
    buses.data?.items.find((bus) => bus.id === busId)?.name ??
    'A bus'

  useLiveEvent('trip.position', (message) => {
    const tracker = trackerOf(message.vehicle_id)
    if (!tracker) return
    setLivePositions((current) => ({ ...current, [tracker.id]: message.position }))
  })

  useLiveEvent('trip.event', (message) => {
    void queryClient.invalidateQueries({ queryKey: [...fleetKeys.all, 'trips'] })
    const trip = trips.data?.items.find((item) => item.id === message.trip_id)
    showTripToast(message, busName(message.vehicle_id), trip?.kind)
  })

  const all = polled.map((vehicle): Vehicle => {
    const fresh = livePositions[vehicle.id]
    if (!newer(fresh, vehicle.position) || !fresh) return vehicle
    return {
      ...vehicle,
      position: {
        lat: fresh.lat,
        lng: fresh.lng,
        speed: fresh.speed,
        heading: fresh.heading,
        ignition: vehicle.position?.ignition ?? null,
        recorded_at: fresh.recorded_at,
      },
    }
  })
  const vehicles = all.filter((vehicle) => matches(vehicle, filter))
  const open = all.find((vehicle) => vehicle.id === openId) ?? null
  const openBus = open
    ? (buses.data?.items.find(
        (bus) =>
          bus.device &&
          ((bus.device.imei && bus.device.imei === open.imei) || bus.device.id === open.id)
      ) ?? null)
    : null
  const attention = all.filter((vehicle) => vehicle.alerts.length > 0).length
  const toggle = (next: Filter) => setFilter((current) => (current === next ? 'all' : next))

  const cards: Insight[] = [
    {
      key: 'all',
      label: 'Buses',
      value: data?.total ?? 0,
      hint: `${data?.parked ?? 0} parked · ${data?.offline ?? 0} offline`,
      icon: Bus,
      tone: 'primary',
      active: filter === 'all',
      onClick: () => setFilter('all'),
    },
    {
      key: 'moving',
      label: 'Moving now',
      value: data?.moving ?? 0,
      hint: 'On the road',
      icon: Navigation,
      tone: 'success',
      active: filter === 'moving',
      onClick: () => toggle('moving'),
    },
    {
      key: 'idle',
      label: 'Idle, engine on',
      value: data?.idle ?? 0,
      hint: 'Stopped but burning fuel',
      icon: PauseCircle,
      tone: 'warning',
      active: filter === 'idle',
      onClick: () => toggle('idle'),
    },
    {
      key: 'attention',
      label: 'Need attention',
      value: attention,
      hint: `${data?.harsh_events_today ?? 0} harsh events today · ${data?.low_fuel ?? 0} low fuel${data?.engine_faults ? ` · ${data.engine_faults} engine faults` : ''}`,
      icon: AlertTriangle,
      tone: attention ? 'danger' : 'neutral',
      active: filter === 'attention',
      onClick: () => toggle('attention'),
    },
  ]

  const columns: Column<Vehicle>[] = [
    {
      key: 'bus',
      header: 'Bus',
      cell: (vehicle) => (
        <div className='grid'>
          <span className='font-bold'>{vehicle.name}</span>
          <span className='font-mono text-xs text-muted-foreground'>
            {vehicle.vehicle_no ?? vehicle.imei}
          </span>
        </div>
      ),
    },
    {
      key: 'state',
      header: 'Status',
      cell: (vehicle) => (
        <div className='grid justify-items-start gap-1'>
          <StateBadge state={vehicle.state} />
          {vehicle.stopped_since && vehicle.online && (
            <span className='text-xs text-muted-foreground'>
              for {duration(vehicle.stopped_since, now)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'ignition',
      header: 'Ignition',
      cell: (vehicle) => <Ignition value={vehicle.position?.ignition ?? null} />,
    },
    {
      key: 'speed',
      header: 'Speed',
      hideBelow: 'lg',
      cell: (vehicle) => (
        <span className='tabular font-semibold'>
          {formatNumber(vehicle.position?.speed, 0, ' km/h')}
        </span>
      ),
    },
    {
      key: 'fuel',
      header: 'Fuel',
      cell: (vehicle) => <Level value={vehicle.fuel} low={15} />,
    },
    {
      key: 'battery',
      header: 'Battery',
      cell: (vehicle) => (
        <Level
          value={vehicle.battery}
          low={20}
          suffix={vehicle.battery_voltage ? `${vehicle.battery_voltage.toFixed(1)} V` : undefined}
        />
      ),
    },
    {
      key: 'harsh',
      header: 'Harsh today',
      hideBelow: 'lg',
      cell: (vehicle) => <Harsh vehicle={vehicle} />,
    },
    {
      key: 'seen',
      header: 'Last signal',
      hideBelow: 'xl',
      cell: (vehicle) => (
        <span className='text-muted-foreground'>
          {vehicle.last_seen_at ? timeAgo(vehicle.last_seen_at, now) : 'Never'}
        </span>
      ),
    },
  ]

  return (
    <Page>
      <PageHeader
        eyebrow='Fleet'
        title='Bus tracking'
        description='Where every bus is, whether the engine is on, fuel, battery and harsh driving. Buses on a trip move live.'
        actions={<LiveBadge status={socket.status} state={socket.state} />}
      />
      {live.isError && !data ? (
        <Card className='p-6'>
          <ErrorState message={live.error.message} onRetry={() => live.refetch()} />
        </Card>
      ) : (
        <>
          <InsightCards items={cards} loading={live.isPending} />
          <div className='grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_26rem]'>
            <Card className='min-w-0 overflow-hidden'>
              {live.isPending ? (
                <Skeleton className='h-[360px] rounded-none xl:h-[420px]' />
              ) : (
                <FleetMap
                  className='h-[300px] sm:h-[360px] xl:h-[420px]'
                  emptyText='No bus has sent its position yet'
                  onSelect={setOpenId}
                  points={vehicles
                    .filter((vehicle) => vehicle.position)
                    .map((vehicle) => ({
                      id: vehicle.id,
                      lat: vehicle.position!.lat,
                      lng: vehicle.position!.lng,
                      label: vehicle.name,
                      sublabel: `${VEHICLE_STATE[vehicle.state].label} · ${formatNumber(vehicle.position!.speed, 0, ' km/h')}`,
                      color: VEHICLE_STATE[vehicle.state].color,
                    }))}
                />
              )}
            </Card>
            <TripsPanel
              trips={trips.data?.items}
              loading={trips.isPending}
              error={trips.isError ? trips.error.message : null}
              onRetry={() => trips.refetch()}
              canManage={canManage}
              onStart={() => setStarting(true)}
              className='min-w-0 overflow-hidden xl:h-[422px]'
            />
          </div>
          <Card className='overflow-hidden'>
            <div className='flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3'>
              <SegmentedControl
                label='Show buses'
                value={filter}
                onChange={setFilter}
                className='max-w-full overflow-x-auto'
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'moving', label: 'Moving' },
                  { value: 'idle', label: 'Idle' },
                  { value: 'parked', label: 'Parked' },
                  { value: 'offline', label: 'Offline' },
                  { value: 'attention', label: 'Attention' },
                ]}
              />
              <span className='text-sm text-muted-foreground'>
                {vehicles.length} of {all.length} buses
              </span>
            </div>
            <DataTable
              rows={vehicles}
              columns={columns}
              rowKey={(vehicle) => vehicle.id}
              loading={live.isPending}
              error={null}
              onRowClick={(vehicle) => setOpenId(vehicle.id)}
              empty={{
                icon: filter === 'all' ? Bus : CircleOff,
                title: filter === 'all' ? 'No buses yet' : 'No bus here right now',
                description:
                  filter === 'all'
                    ? 'Trackers are registered in the Telematics console. They appear here once added.'
                    : 'Choose All to see every bus.',
              }}
              card={(vehicle) => (
                <div className='grid gap-2'>
                  <div className='flex items-center justify-between gap-3'>
                    <div className='grid'>
                      <span className='font-bold'>{vehicle.name}</span>
                      <span className='text-xs text-muted-foreground'>
                        {vehicle.vehicle_no ?? vehicle.imei} ·{' '}
                        {vehicle.last_seen_at
                          ? timeAgo(vehicle.last_seen_at, now)
                          : 'No signal yet'}
                      </span>
                    </div>
                    <StateBadge state={vehicle.state} />
                  </div>
                  <div className='grid grid-cols-3 gap-2 text-xs'>
                    <Ignition value={vehicle.position?.ignition ?? null} />
                    <Level value={vehicle.fuel} low={15} />
                    <Level value={vehicle.battery} low={20} />
                  </div>
                  {vehicle.alerts.length > 0 && <Alerts vehicle={vehicle} />}
                </div>
              )}
            />
          </Card>
        </>
      )}
      <VehicleSheet vehicle={open} bus={openBus} now={now} onClose={() => setOpenId(null)} />
      {starting && <StartTripModal onClose={() => setStarting(false)} />}
    </Page>
  )
}

function StateBadge({ state }: { state: VehicleState }) {
  return (
    <Badge tone={VEHICLE_STATE[state].tone} dot pulse={state === 'moving'}>
      {VEHICLE_STATE[state].label}
    </Badge>
  )
}

function Ignition({ value }: { value: boolean | null }) {
  if (value === null) return <span className='text-muted-foreground'>—</span>
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold',
        value ? 'text-success' : 'text-muted-foreground'
      )}
    >
      <KeyRound className='size-3.5' />
      {value ? 'On' : 'Off'}
    </span>
  )
}

function Level({ value, low, suffix }: { value: number | null; low: number; suffix?: string }) {
  if (value === null) return <span className='text-muted-foreground'>—</span>
  const tone = value < low ? 'bg-destructive' : value < low * 2 ? 'bg-warning' : 'bg-success'
  return (
    <div className='grid min-w-20 gap-1'>
      <span className={cn('tabular text-sm font-semibold', value < low && 'text-destructive')}>
        {Math.round(value)}%
        {suffix && <span className='ml-1 text-xs font-normal text-muted-foreground'>{suffix}</span>}
      </span>
      <span className='h-1.5 overflow-hidden rounded-full bg-muted'>
        <span
          className={cn('block h-full rounded-full', tone)}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </span>
    </div>
  )
}

function Harsh({ vehicle }: { vehicle: Vehicle }) {
  if (!harshTotal(vehicle)) return <span className='text-muted-foreground'>None</span>
  return (
    <span className='flex flex-wrap gap-1'>
      {vehicle.harsh_today.brake > 0 && (
        <Badge tone='danger'>{vehicle.harsh_today.brake} braking</Badge>
      )}
      {vehicle.harsh_today.accel > 0 && (
        <Badge tone='warning'>{vehicle.harsh_today.accel} speeding up</Badge>
      )}
      {vehicle.harsh_today.turn > 0 && (
        <Badge tone='warning'>{vehicle.harsh_today.turn} turns</Badge>
      )}
    </span>
  )
}

function Alerts({ vehicle }: { vehicle: Vehicle }) {
  return (
    <span className='flex flex-wrap gap-1'>
      {vehicle.alerts.map((alert) => (
        <Badge key={alert} tone={alert === 'harsh_driving' ? 'warning' : 'danger'}>
          {ALERT_LABELS[alert]}
        </Badge>
      ))}
    </span>
  )
}

function Tile({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Fuel
  label: string
  children: React.ReactNode
}) {
  return (
    <div className='grid content-start gap-1.5 rounded-lg border p-3'>
      <span className='flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
        <Icon className='size-3.5' />
        {label}
      </span>
      <div className='text-sm font-semibold'>{children}</div>
    </div>
  )
}

function VehicleSheet({
  vehicle,
  bus,
  now,
  onClose,
}: {
  vehicle: Vehicle | null
  bus: SchoolBus | null
  now: number
  onClose: () => void
}) {
  const positions = usePositions(vehicle?.id ?? null)
  return (
    <Sheet open={Boolean(vehicle)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent aria-describedby={undefined}>
        {vehicle && (
          <>
            <SheetHeader>
              <SheetTitle>{vehicle.name}</SheetTitle>
              <SheetDescription className='flex flex-wrap items-center gap-2'>
                <span className='font-mono text-xs'>{vehicle.vehicle_no ?? vehicle.imei}</span>
                <StateBadge state={vehicle.state} />
              </SheetDescription>
            </SheetHeader>
            <SheetBody className='grid content-start gap-5'>
              {vehicle.alerts.length > 0 && <Alerts vehicle={vehicle} />}
              <div className='grid grid-cols-2 gap-2'>
                <Tile icon={KeyRound} label='Ignition'>
                  <Ignition value={vehicle.position?.ignition ?? null} />
                </Tile>
                <Tile icon={Gauge} label='Speed'>
                  {formatNumber(vehicle.position?.speed, 0, ' km/h')}
                </Tile>
                <Tile icon={Fuel} label='Fuel'>
                  <Level value={vehicle.fuel} low={15} />
                </Tile>
                <Tile icon={BatteryMedium} label='Battery'>
                  <Level
                    value={vehicle.battery}
                    low={20}
                    suffix={
                      vehicle.battery_voltage
                        ? `${vehicle.battery_voltage.toFixed(1)} V`
                        : undefined
                    }
                  />
                </Tile>
                <Tile icon={Timer} label={vehicle.state === 'parked' ? 'Parked for' : 'Idle for'}>
                  {vehicle.stopped_since && vehicle.online
                    ? duration(vehicle.stopped_since, now)
                    : '—'}
                </Tile>
                <Tile icon={AlertTriangle} label='Harsh today'>
                  <Harsh vehicle={vehicle} />
                </Tile>
                {vehicle.obd && (
                  <>
                    <Tile icon={Gauge} label='Engine'>
                      {formatNumber(vehicle.obd.rpm, 0, ' rpm')}
                    </Tile>
                    <Tile icon={Thermometer} label='Coolant'>
                      <span
                        className={
                          (vehicle.obd.coolant_c ?? 0) > 105
                            ? 'font-semibold text-destructive'
                            : undefined
                        }
                      >
                        {formatNumber(vehicle.obd.coolant_c, 0, ' °C')}
                      </span>
                    </Tile>
                    <Tile icon={Wrench} label='Fault codes'>
                      {vehicle.obd?.dtc?.length ? (
                        <span className='font-mono text-destructive'>
                          {vehicle.obd.dtc.join(', ')}
                        </span>
                      ) : (
                        'None'
                      )}
                    </Tile>
                    <Tile icon={Route} label='Odometer'>
                      {formatNumber(vehicle.obd.odometer_km, 0, ' km')}
                    </Tile>
                  </>
                )}
              </div>
              {bus && <VehicleHealthCard busId={bus.id} busName={bus.name} />}
              {!vehicle.position && (
                <EmptyState
                  icon={MapPin}
                  title='No position yet'
                  description='The tracker has not sent any data.'
                />
              )}
              <section className='grid gap-2'>
                <h3 className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
                  Recent readings
                </h3>
                {positions.isError ? (
                  <ErrorState
                    message={positions.error.message}
                    onRetry={() => positions.refetch()}
                  />
                ) : !positions.data ? (
                  <Skeleton className='h-40' />
                ) : positions.data.items.length === 0 ? (
                  <p className='text-sm text-muted-foreground'>Nothing recorded yet.</p>
                ) : (
                  <ul className='grid overflow-hidden rounded-lg border'>
                    {positions.data.items.map((row) => (
                      <li
                        key={row.id}
                        className='flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 text-sm last:border-0'
                      >
                        <span className='tabular text-muted-foreground'>
                          {formatDateTime(row.recorded_at)}
                        </span>
                        <span className='flex items-center gap-2'>
                          {row.event && <Badge tone='danger'>{EVENT_LABELS[row.event]}</Badge>}
                          <span className='tabular font-semibold'>
                            {formatNumber(row.speed, 0, ' km/h')}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </SheetBody>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
