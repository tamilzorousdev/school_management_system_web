import { useState } from 'react'
import { Check, CheckCircle2, CircleDot, MapPin, Phone, Siren } from 'lucide-react'
import { ErrorState } from '@/components/common/display'
import { FleetMap } from '@/components/common/fleet-map'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAcknowledgeAlert, useAlert, type FleetAlert } from '../api'
import { ALERT_SEVERITY, ALERT_STATUS, mapLink, SOS_MAP_COLOR, telLink } from '../labels'
import { ResolveAlertModal } from './resolve-alert-modal'

export function AlertSheet({
  alertId,
  onOpenChange,
}: {
  alertId: number | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={Boolean(alertId)} onOpenChange={onOpenChange}>
      <SheetContent>
        <AlertDetail alertId={alertId} />
      </SheetContent>
    </Sheet>
  )
}

function AlertDetail({ alertId }: { alertId: number | null }) {
  const me = useMe().data
  const canManage = can(me, 'fleet.manage')
  const alert = useAlert(alertId)
  const acknowledge = useAcknowledgeAlert()
  const [resolving, setResolving] = useState<FleetAlert | null>(null)

  if (!alertId) return null
  if (alert.isPending) {
    return (
      <>
        <SheetHeader>
          <SheetTitle>Alert</SheetTitle>
          <SheetDescription>Loading…</SheetDescription>
        </SheetHeader>
        <SheetBody className='grid content-start gap-4'>
          <Skeleton className='h-56' />
          <Skeleton className='h-32' />
        </SheetBody>
      </>
    )
  }
  if (alert.isError) {
    return (
      <>
        <SheetHeader>
          <SheetTitle>Alert</SheetTitle>
          <SheetDescription>Could not load this alert</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <ErrorState message={alert.error.message} onRetry={() => alert.refetch()} />
        </SheetBody>
      </>
    )
  }

  const data = alert.data
  const status = ALERT_STATUS[data.status]
  const call = telLink(data.raised_by?.mobile)
  const map = mapLink(data.position)
  const cancelled = data.data?.cancelled === true
  const bus = data.vehicle ? `${data.vehicle.name} · ${data.vehicle.registration_no}` : 'No bus'

  const take = async () => {
    try {
      await acknowledge.mutateAsync(data.id)
      alerts.success('Acknowledged', { description: 'The driver and attendant are told.' })
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const steps = [
    {
      key: 'raised',
      label: 'Raised',
      done: true,
      who: data.raised_by?.name ?? (data.source === 'telematics' ? 'Bus tracker' : null),
      at: data.raised_at,
    },
    {
      key: 'acknowledged',
      label: 'Acknowledged',
      done: Boolean(data.acknowledged_at),
      who: data.acknowledged_by?.name ?? null,
      at: data.acknowledged_at,
    },
    {
      key: 'resolved',
      label: cancelled ? 'Cancelled by the crew' : 'Resolved',
      done: Boolean(data.resolved_at),
      who: data.resolved_by?.name ?? null,
      at: data.resolved_at,
    },
  ]

  return (
    <>
      <SheetHeader>
        <SheetTitle className='flex flex-wrap items-center gap-2'>
          {data.kind === 'sos' && <Siren className='size-5 text-destructive' />}
          {data.kind_label}
          <Badge tone={status.tone} dot>
            {cancelled ? 'Cancelled' : status.label}
          </Badge>
          <Badge tone={ALERT_SEVERITY[data.severity].tone}>
            {ALERT_SEVERITY[data.severity].label}
          </Badge>
        </SheetTitle>
        <SheetDescription className='break-words'>{data.message}</SheetDescription>
      </SheetHeader>
      <SheetBody className='grid content-start gap-5'>
        <FleetMap
          className='h-56'
          emptyText='No location was sent with this alert'
          points={
            data.position
              ? [
                  {
                    id: data.id,
                    lat: data.position.lat,
                    lng: data.position.lng,
                    label: data.kind === 'sos' ? `SOS · ${bus}` : bus,
                    sublabel: data.raised_by?.name,
                    color: SOS_MAP_COLOR,
                  },
                ]
              : []
          }
        />

        <dl className='grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2'>
          <Fact label='Bus' value={bus} />
          <Fact label='Route' value={data.route?.name ?? 'No route'} />
          <Fact
            label='Trip'
            value={
              data.trip
                ? data.trip.kind === 'pickup'
                  ? 'Morning pickup'
                  : 'Evening drop'
                : 'No trip running'
            }
          />
          <Fact
            label='Raised by'
            value={
              data.raised_by
                ? `${data.raised_by.name}${data.data?.role ? ` (${String(data.data.role)})` : ''}`
                : 'Bus tracker'
            }
          />
          <Fact label='Time' value={formatDateTime(data.raised_at)} />
          <Fact
            label='Location'
            value={
              data.position
                ? `${data.position.lat.toFixed(5)}, ${data.position.lng.toFixed(5)}`
                : 'Not sent'
            }
          />
          {typeof data.data?.note === 'string' && (
            <Fact label='Note from the crew' value={data.data.note} className='sm:col-span-2' />
          )}
          <Fact label='People told' value={`${data.notified} by push and SMS`} />
        </dl>

        <div className='flex flex-wrap gap-2'>
          {call && (
            <Button asChild variant='outline' size='sm'>
              <a href={call}>
                <Phone />
                Call {data.raised_by?.mobile}
              </a>
            </Button>
          )}
          {map && (
            <Button asChild variant='outline' size='sm'>
              <a href={map} target='_blank' rel='noreferrer'>
                <MapPin />
                Open in Maps
              </a>
            </Button>
          )}
          {canManage && data.status === 'open' && (
            <Button size='sm' variant='outline' onClick={take} loading={acknowledge.isPending}>
              <Check />
              Acknowledge
            </Button>
          )}
          {canManage && data.status !== 'resolved' && (
            <Button size='sm' onClick={() => setResolving(data)}>
              <CheckCircle2 />
              Resolve
            </Button>
          )}
        </div>

        <section className='grid gap-2'>
          <h3 className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
            Status
          </h3>
          <ol className='grid gap-3'>
            {steps.map((step) => (
              <li key={step.key} className='flex gap-3'>
                <CircleDot
                  className={cn(
                    'mt-0.5 size-4 shrink-0',
                    step.done ? 'text-primary' : 'text-muted-foreground/40'
                  )}
                />
                <span className='grid'>
                  <span className={cn('font-semibold', !step.done && 'text-muted-foreground')}>
                    {step.label}
                  </span>
                  <span className='text-xs text-muted-foreground'>
                    {step.done
                      ? [step.who, step.at ? formatDateTime(step.at) : null]
                          .filter(Boolean)
                          .join(' · ')
                      : 'Not yet'}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          {data.resolution_note && (
            <p className='rounded-lg border bg-muted/40 px-3 py-2 text-sm'>
              {data.resolution_note}
            </p>
          )}
        </section>
      </SheetBody>
      <ResolveAlertModal
        alert={resolving}
        open={Boolean(resolving)}
        onOpenChange={(open) => !open && setResolving(null)}
      />
    </>
  )
}

function Fact({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn('grid gap-0.5', className)}>
      <dt className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
        {label}
      </dt>
      <dd className='font-medium break-words'>{value}</dd>
    </div>
  )
}
