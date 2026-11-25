import {
  Ambulance,
  BusFront,
  Bandage,
  CarFront,
  Clock3,
  CreditCard,
  MessageCircleWarning,
  ScanSearch,
  ShieldAlert,
  Siren,
  Swords,
  Timer,
  TriangleAlert,
  UserRoundX,
  UserX,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { BadgeTone } from '@/components/ui/badge'
import { ATTENDANCE_STATUS, today } from '@/features/attendance/labels'
import type { AttendanceStatus } from '@/features/attendance/api'
import type {
  BoardStatus,
  DutyPlace,
  ExceptionKind,
  IncidentStatus,
  IncidentType,
  RideStatus,
} from './api'

export const BOARD_STATUS: Record<BoardStatus, { label: string; tone: BadgeTone }> = {
  not_started: { label: 'Not started', tone: 'neutral' },
  late_start: { label: 'Late start', tone: 'danger' },
  running: { label: 'Running', tone: 'success' },
  delayed: { label: 'Delayed', tone: 'warning' },
  completed: { label: 'Completed', tone: 'info' },
}

export const BOARD_STATUS_OPTIONS = (Object.keys(BOARD_STATUS) as BoardStatus[]).map((value) => ({
  value,
  label: BOARD_STATUS[value].label,
}))

export const EXCEPTION_KIND: Record<
  ExceptionKind,
  { label: string; tone: BadgeTone; icon: LucideIcon; rank: number }
> = {
  sos: { label: 'SOS', tone: 'danger', icon: Siren, rank: 0 },
  open_incident: { label: 'Incident', tone: 'danger', icon: ShieldAlert, rank: 1 },
  no_sweep: { label: 'No sweep', tone: 'danger', icon: ScanSearch, rank: 2 },
  not_boarded: { label: 'Not boarded', tone: 'warning', icon: UserX, rank: 3 },
  late_start: { label: 'Late start', tone: 'warning', icon: Clock3, rank: 4 },
  driver_not_checked_in: {
    label: 'Driver not in',
    tone: 'warning',
    icon: UserRoundX,
    rank: 5,
  },
  boarded_on_hold: { label: 'Boarded on hold', tone: 'warning', icon: CreditCard, rank: 6 },
  delayed: { label: 'Delayed', tone: 'warning', icon: Timer, rank: 7 },
  attendant_absent: { label: 'No attendant', tone: 'info', icon: TriangleAlert, rank: 8 },
}

export const DUTY_PLACE: Record<DutyPlace, { label: string; tone: BadgeTone }> = {
  school: { label: 'At school', tone: 'success' },
  stop: { label: 'At a stop', tone: 'info' },
  other: { label: 'Elsewhere', tone: 'warning' },
  unknown: { label: 'No location', tone: 'neutral' },
}

export const RIDE_STATUS: Record<RideStatus, { label: string; tone: BadgeTone }> = {
  boarded: { label: 'Boarded', tone: 'success' },
  dropped: { label: 'Dropped', tone: 'success' },
  on_bus: { label: 'On the bus', tone: 'info' },
  waiting: { label: 'Waiting', tone: 'warning' },
  not_at_stop: { label: 'Not at stop', tone: 'warning' },
  not_boarded: { label: 'Not boarded', tone: 'danger' },
  away: { label: 'Away', tone: 'neutral' },
  no_trip: { label: 'No trip yet', tone: 'neutral' },
  not_riding: { label: 'Not riding', tone: 'neutral' },
}

export const rideStatus = (value: string) =>
  RIDE_STATUS[value as RideStatus] ?? { label: value, tone: 'neutral' as BadgeTone }

export const classAttendance = (value: string | null) =>
  value ? (ATTENDANCE_STATUS[value as AttendanceStatus] ?? { label: value, tone: 'neutral' }) : null

export const INCIDENT_TYPE: Record<IncidentType, { label: string; icon: LucideIcon }> = {
  breakdown: { label: 'Breakdown', icon: Wrench },
  accident: { label: 'Accident', icon: CarFront },
  injury: { label: 'Injury', icon: Bandage },
  medical: { label: 'Medical', icon: Ambulance },
  misbehaviour: { label: 'Misbehaviour', icon: MessageCircleWarning },
  fight: { label: 'Fight', icon: Swords },
  other: { label: 'Other', icon: BusFront },
}

export const INCIDENT_TYPE_OPTIONS = (Object.keys(INCIDENT_TYPE) as IncidentType[]).map(
  (value) => ({ value, label: INCIDENT_TYPE[value].label })
)

export const INCIDENT_STATUS: Record<IncidentStatus, { label: string; tone: BadgeTone }> = {
  open: { label: 'Open', tone: 'danger' },
  resolved: { label: 'Resolved', tone: 'success' },
}

export const INCIDENT_STATUS_OPTIONS = (Object.keys(INCIDENT_STATUS) as IncidentStatus[]).map(
  (value) => ({ value, label: INCIDENT_STATUS[value].label })
)

export const mapsLink = (lat: number | null, lng: number | null) =>
  lat !== null && lng !== null ? `https://maps.google.com/?q=${lat},${lng}` : null

export const hoursText = (hours: number | null) =>
  hours === null ? '—' : `${hours.toLocaleString('en-IN', { maximumFractionDigits: 1 })} h`

export const opsDay = (date: string | undefined) => {
  const now = today()
  const day = date ?? now
  return { day, live: day === now }
}
