import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/api/client'
import type { TripKind, TripTracking } from '@/features/fleet/api'

export const OPS_REFRESH_MS = 30_000

export interface OpsRef {
  id: number
  name: string
}

export type BoardStatus = 'not_started' | 'late_start' | 'running' | 'delayed' | 'completed'

export type ExceptionKind =
  | 'late_start'
  | 'delayed'
  | 'no_sweep'
  | 'not_boarded'
  | 'attendant_absent'
  | 'driver_not_checked_in'
  | 'open_incident'
  | 'sos'
  | 'boarded_on_hold'

export interface BoardTrip {
  route: OpsRef
  route_code: string
  kind: TripKind
  vehicle: OpsRef | null
  driver: OpsRef | null
  planned_start: string | null
  status: BoardStatus
  trip_id: number | null
  tracking: TripTracking | null
  started_at: string | null
  ended_at: string | null
  stops_done: number
  stops_total: number
  current_stop: string | null
  expected: number
  boarded: number
  away: number
  not_at_stop: number
  boarded_on_hold: number
  delay_minutes: number | null
  position: { lat: number; lng: number; recorded_at: string } | null
  swept_at: string | null
}

export interface BoardException {
  kind: ExceptionKind
  message: string
  trip_id: number | null
  vehicle_id: number | null
  incident_id: number | null
}

export interface OperationsBoard {
  date: string
  summary: {
    total: number
    not_started: number
    running: number
    delayed: number
    completed: number
  }
  drivers: { checked_in: number; total: number; late: number }
  trips: BoardTrip[]
  exceptions: BoardException[]
}

export type DutyPlace = 'school' | 'stop' | 'other' | 'unknown'

export interface Duty {
  id: number
  duty_date: string
  driver: OpsRef
  vehicle: OpsRef | null
  check_in_at: string
  check_in_place: DutyPlace
  check_in_photo_url: string | null
  reporting_time: string | null
  late_minutes: number
  attendant: OpsRef | null
  attendant_present: boolean | null
  check_out_at: string | null
  check_out_photo_url: string | null
  hours: number | null
}

export interface DriverDay {
  driver: OpsRef
  mobile: string | null
  vehicle: OpsRef | null
  duty: Duty | null
}

export type RideStatus =
  | 'boarded'
  | 'not_at_stop'
  | 'not_boarded'
  | 'waiting'
  | 'away'
  | 'no_trip'
  | 'not_riding'
  | 'dropped'
  | 'on_bus'

export interface BusAttendanceRow {
  student_id: number
  full_name: string
  class_section: string | null
  route: OpsRef
  stop: string | null
  pickup: RideStatus
  pickup_at: string | null
  drop: RideStatus
  drop_at: string | null
  handed_to: string | null
  away_note: string | null
  pass_on_hold: boolean
  boarded_on_hold: boolean
  class_attendance: string | null
  mismatch: boolean
}

export type IncidentType =
  'breakdown' | 'accident' | 'injury' | 'medical' | 'misbehaviour' | 'fight' | 'other'

export type IncidentStatus = 'open' | 'resolved'

export interface Incident {
  id: number
  type: IncidentType
  description: string
  status: IncidentStatus
  vehicle: OpsRef | null
  trip_id: number | null
  reported_by: OpsRef
  students: OpsRef[]
  photos: { id: number; url: string }[]
  lat: number | null
  lng: number | null
  occurred_at: string
  resolved_by: OpsRef | null
  resolved_at: string | null
  resolution_note: string | null
}

export interface IncidentInsights {
  open: number
  today: number
  this_month: number
  breakdowns: number
}

export interface IncidentListParams {
  page: number
  limit: number
  search?: string
  status?: IncidentStatus
  type?: IncidentType
  vehicle_id?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export type AwayReason = 'leave' | 'half_day' | 'od' | 'absent' | 'no_bus' | 'early_leave'

export interface TodayAway {
  reason: AwayReason
  note: string
}

export interface TodayRider {
  student: OpsRef
  admission_no: string | null
  class_section: string | null
  route: OpsRef
  bus: OpsRef | null
  stop: string | null
}

export interface TodayEarlyLeave extends TodayRider {
  status: 'approved' | 'released'
  pickup_name: string | null
  pickup_relation: string | null
  reason: string
  released_at: string | null
}

export interface TodayNotComing extends TodayRider {
  pickup: TodayAway | null
  drop: TodayAway | null
}

export interface TodayOnHold extends TodayRider {
  hold_kind: 'fee' | 'office' | null
  pass_note: string | null
}

export interface StudentsToday {
  date: string
  summary: {
    riders: number
    coming: number
    away_pickup: number
    away_drop: number
    early_leave: number
    early_leave_waiting: number
    passes_on_hold: number
  }
  early_leaves: TodayEarlyLeave[]
  away: TodayNotComing[]
  on_hold: TodayOnHold[]
}

export const opsKeys = {
  all: ['transport-ops'] as const,
  board: (date: string) => [...opsKeys.all, 'board', date] as const,
  drivers: (date: string) => [...opsKeys.all, 'drivers', date] as const,
  studentsToday: (date: string) => [...opsKeys.all, 'students-today', date] as const,
  bus: (date: string, routeId?: number) => [...opsKeys.all, 'bus', date, routeId ?? 0] as const,
  incidents: (params: IncidentListParams) => [...opsKeys.all, 'incidents', params] as const,
  incidentInsights: () => [...opsKeys.all, 'incident-insights'] as const,
  incident: (id: number) => [...opsKeys.all, 'incident', id] as const,
}

const base = '/admin/transport'

export const opsApi = {
  board: (date: string) => api.get<OperationsBoard>(`${base}/operations`, { date }),
  drivers: (date: string) => api.get<DriverDay[]>(`${base}/driver-attendance`, { date }),
  studentsToday: (date: string) => api.get<StudentsToday>(`${base}/students-today`, { date }),
  bus: (date: string, routeId?: number) =>
    api.get<BusAttendanceRow[]>(`${base}/bus-attendance`, { date, route_id: routeId }),
  incidents: (params: IncidentListParams) =>
    api.get<Paginated<Incident>>(`${base}/incidents`, { ...params }),
  incidentInsights: () => api.get<IncidentInsights>(`${base}/incidents/insights`),
  incident: (id: number) => api.get<Incident>(`${base}/incidents/${id}`),
  resolve: ({ id, note }: { id: number; note: string }) =>
    api.post<Incident>(`${base}/incidents/${id}/resolve`, { note }),
}

const pollWhen = (live: boolean) => (live ? OPS_REFRESH_MS : false)

export function useOperationsBoard(date: string, live: boolean) {
  return useQuery({
    queryKey: opsKeys.board(date),
    queryFn: () => opsApi.board(date),
    placeholderData: keepPreviousData,
    refetchInterval: pollWhen(live),
  })
}

export function useStudentsToday(date: string, live: boolean) {
  return useQuery({
    queryKey: opsKeys.studentsToday(date),
    queryFn: () => opsApi.studentsToday(date),
    placeholderData: keepPreviousData,
    refetchInterval: pollWhen(live),
  })
}

export function useDriverAttendance(date: string, live: boolean) {
  return useQuery({
    queryKey: opsKeys.drivers(date),
    queryFn: () => opsApi.drivers(date),
    placeholderData: keepPreviousData,
    refetchInterval: pollWhen(live),
  })
}

export function useBusAttendance(date: string, routeId: number | undefined, live: boolean) {
  return useQuery({
    queryKey: opsKeys.bus(date, routeId),
    queryFn: () => opsApi.bus(date, routeId),
    placeholderData: keepPreviousData,
    refetchInterval: pollWhen(live),
  })
}

export function useIncidents(params: IncidentListParams) {
  return useQuery({
    queryKey: opsKeys.incidents(params),
    queryFn: () => opsApi.incidents(params),
    placeholderData: keepPreviousData,
    refetchInterval: OPS_REFRESH_MS,
  })
}

export function useIncidentInsights() {
  return useQuery({
    queryKey: opsKeys.incidentInsights(),
    queryFn: opsApi.incidentInsights,
    refetchInterval: OPS_REFRESH_MS,
  })
}

export function useIncident(id: number | null) {
  return useQuery({
    queryKey: opsKeys.incident(id ?? 0),
    queryFn: () => opsApi.incident(id!),
    enabled: Boolean(id),
  })
}

export function useResolveIncident() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: opsApi.resolve,
    meta: { silent: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: opsKeys.all }),
  })
}
