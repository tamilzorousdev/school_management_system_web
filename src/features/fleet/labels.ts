import type { BadgeTone } from '@/components/ui/badge'
import { config } from '@/config/env'
import { alerts } from '@/lib/alerts'
import type { TripEventMessage, TripPositionMessage } from '@/lib/live/socket'
import type {
  BoardingAction,
  BoardingMethod,
  HealthStatus,
  RiderStatus,
  SafetyKind,
  Severity,
  StopStatus,
  TripDetail,
  TripKind,
  TripStatus,
  TripFlag,
  TripTracking,
  TripStop,
} from './api'

export const RIDER_STATUS: Record<RiderStatus, { label: string; tone: BadgeTone }> = {
  waiting: { label: 'Waiting', tone: 'warning' },
  not_at_stop: { label: 'Not at stop', tone: 'warning' },
  on_bus: { label: 'On the bus', tone: 'info' },
  off_bus: { label: 'Got off', tone: 'success' },
  away: { label: 'Away today', tone: 'neutral' },
}

export const TRIP_FLAG: Record<TripFlag, { label: string; tone: BadgeTone }> = {
  not_boarded: { label: 'Never got on', tone: 'warning' },
  not_alighted: { label: 'Not marked off', tone: 'danger' },
}

export const TRIP_FLAG_OPTIONS = [
  { value: 'any', label: 'Any boarding problem' },
  { value: 'not_alighted', label: 'Left marked on the bus' },
  { value: 'not_boarded', label: 'A child never got on' },
]

export const BOARDING_METHOD: Record<BoardingMethod, string> = {
  qr: 'ID card',
  manual: 'Tapped',
}

export const BOARDING_ACTION: Record<BoardingAction, string> = {
  boarded: 'Got on',
  alighted: 'Got off',
  missed: 'Not at stop',
}

export const TRIP_KIND: Record<TripKind, string> = {
  pickup: 'Morning pickup',
  drop: 'Evening drop',
}

export const TRIP_KIND_OPTIONS = (Object.keys(TRIP_KIND) as TripKind[]).map((value) => ({
  value,
  label: TRIP_KIND[value],
  hint: value === 'pickup' ? 'Stops to school' : 'School to stops',
}))

export const TRIP_STATUS: Record<TripStatus, { label: string; tone: BadgeTone }> = {
  active: { label: 'On the road', tone: 'success' },
  ended: { label: 'Ended', tone: 'neutral' },
}

export const TRIP_TRACKING: Record<TripTracking, { label: string; tone: BadgeTone; hint: string }> =
  {
    telematics: { label: 'GPS', tone: 'info', hint: 'The GPS tracker moves the stops by itself' },
    phone: { label: 'Phone', tone: 'neutral', hint: 'No tracker: the driver taps each stop' },
  }

export const STOP_STATUS: Record<StopStatus, { label: string; tone: BadgeTone; pin: string }> = {
  pending: { label: 'Not reached', tone: 'neutral', pin: 'bg-muted-foreground' },
  approaching: { label: 'Coming up', tone: 'warning', pin: 'bg-warning' },
  arrived: { label: 'At the stop', tone: 'info', pin: 'bg-info' },
  departed: { label: 'Done', tone: 'success', pin: 'bg-success' },
  skipped: { label: 'Skipped', tone: 'danger', pin: 'bg-destructive' },
}

export const TRIP_STATUS_OPTIONS = (Object.keys(TRIP_STATUS) as TripStatus[]).map((value) => ({
  value,
  label: TRIP_STATUS[value].label,
}))

export const HEALTH_STATUS: Record<HealthStatus, { label: string; tone: BadgeTone }> = {
  good: { label: 'Good', tone: 'success' },
  warning: { label: 'Needs a look', tone: 'warning' },
  critical: { label: 'Critical', tone: 'danger' },
  unknown: { label: 'Unknown', tone: 'neutral' },
}

export const SEVERITY: Record<Severity, { label: string; tone: BadgeTone; color: string }> = {
  low: { label: 'Low', tone: 'info', color: '#2563eb' },
  medium: { label: 'Medium', tone: 'warning', color: '#c27a00' },
  high: { label: 'High', tone: 'danger', color: '#d92d20' },
}

export const SAFETY_KIND: Record<SafetyKind, string> = {
  overspeed: 'Overspeed',
  harsh_braking: 'Harsh braking',
  idle: 'Long idle',
  route_deviation: 'Off route',
}

export const durationText = (seconds: number | null | undefined) => {
  if (seconds === null || seconds === undefined) return '—'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`
}

export const END_REASON: Record<string, string> = {
  arrived_school: 'Reached school',
  route_complete: 'Last stop done',
  driver: 'Ended by the driver',
  admin: 'Ended from the office',
  timeout: 'Ended automatically',
}

const clockFormat = new Intl.DateTimeFormat('en-IN', {
  timeZone: config.timeZone,
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
})

export const clock = (value: string | null | undefined) =>
  value ? clockFormat.format(new Date(value)) : '—'

export const minutesFrom = (seconds: number | null) => Math.max(1, Math.round((seconds ?? 60) / 60))

export const etaText = (seconds: number | null) => {
  if (seconds === null) return '—'
  if (seconds <= 30) return 'Due now'
  const minutes = minutesFrom(seconds)
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`
}

export const secondsAgo = (value: string | null | undefined, now: number) => {
  if (!value) return null
  const seconds = Math.max(0, Math.round((now - new Date(value).getTime()) / 1000))
  if (seconds < 60) return `${seconds} s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min ago`
}

export const destinationLabel = (kind: TripKind) => (kind === 'pickup' ? 'School' : 'Last stop')

export const peopleTold = (type: TripEventMessage['type'], count: number) => {
  if (!count) return null
  const who = type === 'trip.ended' ? 'class teacher' : 'parent'
  return `Told ${count} ${count === 1 ? who : `${who}s`}`
}

export const eventTitle = (
  type: TripEventMessage['type'],
  stop: string | null,
  eta: number | null,
  kind?: TripKind
) => {
  switch (type) {
    case 'trip.started':
      return kind ? `${TRIP_KIND[kind]} started` : 'Trip started'
    case 'stop.approaching':
      return `${minutesFrom(eta)} min from ${stop ?? 'the next stop'}`
    case 'stop.arrived':
      return `Reached ${stop ?? 'a stop'}`
    case 'stop.departed':
      return `Left ${stop ?? 'a stop'}`
    case 'trip.ended':
      return 'Trip ended'
  }
}

export function showTripToast(
  message: TripEventMessage,
  bus: string,
  kind: TripKind | undefined,
  includeDeparted = false
) {
  const stop = message.stop?.name ?? null
  const told = peopleTold(message.type, message.notified) ?? undefined
  const options = { id: `trip-${message.trip_id}`, description: told }
  const trip = kind ? TRIP_KIND[kind].toLowerCase() : 'trip'
  switch (message.type) {
    case 'trip.started':
      alerts.info(`${bus} started the ${trip}`, options)
      return
    case 'stop.approaching':
      alerts.warning(
        `${bus} is ${minutesFrom(message.eta_seconds)} min from ${stop ?? 'the next stop'}`,
        options
      )
      return
    case 'stop.arrived':
      alerts.info(`${bus} reached ${stop ?? 'a stop'}`, options)
      return
    case 'stop.departed':
      if (includeDeparted) alerts.info(`${bus} left ${stop ?? 'a stop'}`, options)
      return
    case 'trip.ended':
      alerts.success(`${bus} finished the ${trip}`, {
        ...options,
        description:
          [message.end_reason ? END_REASON[message.end_reason] : null, told]
            .filter(Boolean)
            .join(' · ') || undefined,
      })
  }
}

const EVENT_STATUS: Partial<Record<TripEventMessage['type'], StopStatus>> = {
  'stop.approaching': 'approaching',
  'stop.arrived': 'arrived',
  'stop.departed': 'departed',
}

const RANK: Record<StopStatus, number> = {
  pending: 0,
  approaching: 1,
  arrived: 2,
  departed: 3,
  skipped: 3,
}

const applyStop = (stops: TripStop[], message: TripEventMessage) => {
  const status = EVENT_STATUS[message.type]
  const index = stops.findIndex((stop) => stop.stop_id === message.stop?.id)
  if (!status || index < 0) return stops
  return stops.map((stop, position): TripStop => {
    if (position < index && RANK[stop.status] < 2 && status !== 'approaching') {
      return { ...stop, status: 'skipped', eta_seconds: null }
    }
    if (position !== index || RANK[status] < RANK[stop.status]) return stop
    return {
      ...stop,
      status,
      eta_seconds: status === 'approaching' ? message.eta_seconds : status === 'arrived' ? 0 : null,
      approached_at: status === 'approaching' ? message.at : stop.approached_at,
      arrived_at: status === 'arrived' ? message.at : stop.arrived_at,
      departed_at: status === 'departed' ? message.at : stop.departed_at,
    }
  })
}

export const applyPosition = (
  detail: TripDetail | undefined,
  message: TripPositionMessage
): TripDetail | undefined => (detail ? { ...detail, position: message.position } : detail)

export const applyEvent = (
  detail: TripDetail | undefined,
  message: TripEventMessage
): TripDetail | undefined => {
  if (!detail) return detail
  const stop_list = applyStop(detail.stop_list, message)
  const ended = message.type === 'trip.ended'
  return {
    ...detail,
    stop_list,
    position: message.position ?? detail.position,
    stops_done: stop_list.filter((stop) => RANK[stop.status] === 3).length,
    ...(ended
      ? {
          status: 'ended' as const,
          ended_at: message.at,
          end_reason: message.end_reason ?? detail.end_reason,
        }
      : {}),
  }
}
