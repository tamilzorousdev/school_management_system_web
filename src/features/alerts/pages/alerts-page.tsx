import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  BellRing,
  Check,
  CheckCircle2,
  CircleOff,
  MapPin,
  Phone,
  ShieldAlert,
  Siren,
  TriangleAlert,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { today } from '@/features/attendance/labels'
import { can, useMe } from '@/features/auth/api'
import { LiveBadge } from '@/features/fleet/components/live-badge'
import { useNow } from '@/hooks/use-now'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDateTime, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  useAcknowledgeAlert,
  useAlertInsights,
  useAlerts,
  type AlertKind,
  type AlertSeverity,
  type AlertStatus,
  type FleetAlert,
} from '../api'
import { ResolveAlertModal } from '../components/resolve-alert-modal'
import { AlertSheet } from '../components/alert-sheet'
import { ALERT_KIND, ALERT_SEVERITY, ALERT_STATUS, mapLink, telLink } from '../labels'
import { useAlertsLive } from '../live'
import type { AlertsSearch } from '../search'

const route = getRouteApi('/_app/fleet/alerts')
const LIMIT = 20

function KindCell({ alert }: { alert: FleetAlert }) {
  const Icon = ALERT_KIND[alert.kind].icon
  const sos = alert.kind === 'sos'
  return (
    <div className='flex min-w-0 items-start gap-2.5'>
      <span
        className={cn(
          'grid size-8 shrink-0 place-items-center rounded-lg',
          sos ? 'bg-destructive text-destructive-foreground' : 'bg-warning/10 text-warning'
        )}
      >
        <Icon className='size-4' />
      </span>
      <div className='grid max-w-md min-w-0 gap-0.5'>
        <span className='font-bold'>{alert.kind_label}</span>
        <span className='line-clamp-2 text-xs break-words text-muted-foreground'>
          {alert.message}
        </span>
      </div>
    </div>
  )
}

function BusCell({ alert }: { alert: FleetAlert }) {
  if (!alert.vehicle) return <span className='text-muted-foreground'>No bus</span>
  return (
    <div className='grid min-w-0'>
      <span className='font-medium'>{alert.vehicle.name}</span>
      <span className='font-mono text-xs text-muted-foreground'>
        {alert.vehicle.registration_no}
      </span>
      {alert.route && (
        <span className='truncate text-xs text-muted-foreground'>{alert.route.name}</span>
      )}
    </div>
  )
}

function StatusCell({ alert }: { alert: FleetAlert }) {
  return (
    <div className='grid max-w-64 justify-items-start gap-1'>
      <Badge tone={ALERT_STATUS[alert.status].tone} dot pulse={alert.status === 'open'}>
        {ALERT_STATUS[alert.status].label}
      </Badge>
      {alert.status === 'resolved' && alert.resolved_by && (
        <span className='text-[11px] text-muted-foreground'>
          by {alert.resolved_by.name}
          {alert.resolution_note ? `: ${alert.resolution_note}` : ''}
        </span>
      )}
      {alert.status === 'acknowledged' && alert.acknowledged_by && (
        <span className='text-[11px] text-muted-foreground'>by {alert.acknowledged_by.name}</span>
      )}
    </div>
  )
}

function ContactLinks({ alert }: { alert: FleetAlert }) {
  const call = telLink(alert.raised_by?.mobile)
  const map = mapLink(alert.position)
  if (!call && !map) return null
  return (
    <span className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
      {call && (
        <a href={call} className='inline-flex items-center gap-1 font-semibold text-primary'>
          <Phone className='size-3.5' />
          {alert.raised_by?.name} · {alert.raised_by?.mobile}
        </a>
      )}
      {map && (
        <a
          href={map}
          target='_blank'
          rel='noreferrer'
          className='inline-flex items-center gap-1 font-semibold text-primary'
        >
          <MapPin className='size-3.5' />
          Map
        </a>
      )}
    </span>
  )
}

export function AlertsPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/fleet/alerts' })
  const now = useNow(15_000)
  const me = useMe().data
  const canManage = can(me, 'fleet.manage')
  const socket = useAlertsLive()
  const [resolving, setResolving] = useState<FleetAlert | null>(null)
  const [viewing, setViewing] = useState<number | null>(null)
  const acknowledge = useAcknowledgeAlert()
  const { date, ...filters } = search
  const list = useAlerts({ ...filters, from: date, to: date, limit: LIMIT }, !socket.live)
  const insights = useAlertInsights(!socket.live)
  const rows = list.data?.items ?? []
  const data = insights.data

  const setSearch = (patch: Partial<AlertsSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })

  const pick = (patch: Partial<AlertsSearch>, active: boolean) =>
    setSearch(
      active
        ? { kind: undefined, status: undefined, severity: undefined, active: undefined }
        : { kind: undefined, status: undefined, severity: undefined, active: undefined, ...patch }
    )

  useShortcut('app.refresh', () => {
    void list.refetch()
    void insights.refetch()
  })

  const take = async (alert: FleetAlert) => {
    try {
      await acknowledge.mutateAsync(alert.id)
      alerts.success('Alert acknowledged')
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const isOpen = search.status === 'open' && !search.kind && !search.active
  const isSos = search.kind === 'sos' && search.active === true && !search.status
  const isHigh = search.severity === 'high' && search.active === true && !search.kind
  const isResolved = search.status === 'resolved' && !search.kind && !search.active

  const cards: Insight[] = [
    {
      key: 'sos',
      label: 'SOS active',
      value: data?.sos_active ?? 0,
      hint: 'From drivers and attendants',
      icon: Siren,
      tone: 'danger',
      active: isSos,
      onClick: () => pick({ kind: 'sos', active: true }, isSos),
    },
    {
      key: 'open',
      label: 'Open',
      value: data?.open ?? 0,
      hint: `${data?.acknowledged ?? 0} being handled`,
      icon: BellRing,
      tone: 'warning',
      active: isOpen,
      onClick: () => pick({ status: 'open' }, isOpen),
    },
    {
      key: 'high',
      label: 'High severity',
      value: data?.high_active ?? 0,
      hint: 'Safety alerts not resolved',
      icon: TriangleAlert,
      tone: 'danger',
      active: isHigh,
      onClick: () => pick({ severity: 'high', active: true }, isHigh),
    },
    {
      key: 'resolved',
      label: 'Resolved today',
      value: data?.resolved_today ?? 0,
      hint: `${data?.raised_today ?? 0} raised today`,
      icon: CheckCircle2,
      tone: 'success',
      active: isResolved,
      onClick: () => pick({ status: 'resolved' }, isResolved),
    },
  ]

  const actions = (alert: FleetAlert, full = false) =>
    canManage &&
    alert.status !== 'resolved' && (
      <div className={cn('flex flex-wrap gap-2', !full && 'justify-end')}>
        {alert.status === 'open' && (
          <Button
            size='sm'
            variant='outline'
            onClick={(event) => {
              event.stopPropagation()
              void take(alert)
            }}
            disabled={acknowledge.isPending}
          >
            <Check />
            Acknowledge
          </Button>
        )}
        <Button
          size='sm'
          onClick={(event) => {
            event.stopPropagation()
            setResolving(alert)
          }}
        >
          <CheckCircle2 />
          Resolve
        </Button>
      </div>
    )

  const columns: Column<FleetAlert>[] = [
    { key: 'alert', header: 'Alert', sortKey: 'kind', cell: (alert) => <KindCell alert={alert} /> },
    { key: 'bus', header: 'Bus', cell: (alert) => <BusCell alert={alert} /> },
    {
      key: 'raised_at',
      header: 'Raised',
      sortKey: 'raised_at',
      cell: (alert) => (
        <div className='grid gap-1'>
          <span className='text-sm' title={formatDateTime(alert.raised_at)}>
            {timeAgo(alert.raised_at, now)}
          </span>
          <ContactLinks alert={alert} />
        </div>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      sortKey: 'severity',
      hideBelow: 'lg',
      cell: (alert) => (
        <Badge tone={ALERT_SEVERITY[alert.severity].tone}>
          {ALERT_SEVERITY[alert.severity].label}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortKey: 'status',
      cell: (alert) => <StatusCell alert={alert} />,
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: <span className='sr-only'>Actions</span>,
            align: 'right' as const,
            cell: (alert: FleetAlert) => actions(alert),
          },
        ]
      : []),
  ]

  const filtered = Boolean(
    search.search || search.kind || search.status || search.severity || search.active || date
  )

  return (
    <Page>
      <PageHeader
        eyebrow='Fleet'
        title='Alerts'
        description='SOS from drivers and attendants, and safety alerts from the buses: overspeed, harsh braking, long idling and going off route. Acknowledge when you take it up and resolve with a note.'
        actions={<LiveBadge status={socket.status} state={socket.state} />}
      />

      <InsightCards items={cards} loading={insights.isPending} />

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={list.data ? `${list.data.total} alerts` : ''}
          onClear={filtered ? () => navigate({ search: { page: 1 }, replace: true }) : undefined}
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Search message, bus or driver'
            label='Search alerts'
          />
          <FilterSelect
            id='alert-kind'
            label='Filter by kind'
            allLabel='All kinds'
            value={search.kind}
            options={(Object.keys(ALERT_KIND) as AlertKind[]).map((value) => ({
              value,
              label: ALERT_KIND[value].label,
            }))}
            onChange={(kind) => setSearch({ kind: kind as AlertKind | undefined })}
          />
          <FilterSelect
            id='alert-status'
            label='Filter by status'
            allLabel='All statuses'
            value={search.active ? 'active' : search.status}
            options={[
              { value: 'active', label: 'Not resolved', hint: 'Open or being handled' },
              ...(Object.keys(ALERT_STATUS) as AlertStatus[]).map((value) => ({
                value,
                label: ALERT_STATUS[value].label,
              })),
            ]}
            onChange={(status) =>
              setSearch(
                status === 'active'
                  ? { status: undefined, active: true }
                  : { status: status as AlertStatus | undefined, active: undefined }
              )
            }
          />
          <FilterSelect
            id='alert-severity'
            label='Filter by severity'
            allLabel='All severities'
            value={search.severity}
            options={(Object.keys(ALERT_SEVERITY) as AlertSeverity[]).map((value) => ({
              value,
              label: ALERT_SEVERITY[value].label,
            }))}
            onChange={(severity) => setSearch({ severity: severity as AlertSeverity | undefined })}
          />
          <Input
            type='date'
            aria-label='Raised on'
            max={today()}
            value={date ?? ''}
            onChange={(event) => setSearch({ date: event.target.value || undefined })}
            className='w-full sm:w-44'
          />
        </ListToolbar>

        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(alert) => alert.id}
          loading={list.isFetching && !list.data}
          error={list.isError ? list.error.message : null}
          onRetry={() => list.refetch()}
          onRowClick={(alert) => setViewing(alert.id)}
          sort={{ sort: search.sort, order: search.order ?? 'desc' }}
          onSortChange={(next) => setSearch(next as Partial<AlertsSearch>)}
          empty={{
            icon: filtered ? CircleOff : ShieldAlert,
            title: filtered ? 'No alerts match these filters' : 'No alerts yet',
            description: filtered
              ? 'Try another search or clear the filters.'
              : 'SOS from the driver app and safety alerts from the buses appear here as they happen.',
          }}
          card={(alert) => (
            <div className='grid gap-2'>
              <div className='flex items-start justify-between gap-3'>
                <KindCell alert={alert} />
                <Badge tone={ALERT_SEVERITY[alert.severity].tone}>
                  {ALERT_SEVERITY[alert.severity].label}
                </Badge>
              </div>
              <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
                {alert.vehicle && (
                  <span>
                    {alert.vehicle.name} · {alert.vehicle.registration_no}
                  </span>
                )}
                <span title={formatDateTime(alert.raised_at)}>{timeAgo(alert.raised_at, now)}</span>
              </div>
              <ContactLinks alert={alert} />
              <StatusCell alert={alert} />
              {actions(alert, true)}
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: list.data?.total ?? 0,
            label: 'alerts',
            onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
          }}
        />
      </Card>

      <ResolveAlertModal
        alert={resolving}
        open={Boolean(resolving)}
        onOpenChange={(open) => !open && setResolving(null)}
      />
      <AlertSheet alertId={viewing} onOpenChange={(open) => !open && setViewing(null)} />
    </Page>
  )
}
