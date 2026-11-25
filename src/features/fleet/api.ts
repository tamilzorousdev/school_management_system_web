import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { BadgeTone } from '@/components/ui/badge'
import { config } from '@/config/env'
import { api, type Paginated } from '@/lib/api/client'
import type { LivePosition, LiveTripEventType } from '@/lib/live/socket'

export type VehicleState = 'moving' | 'idle' | 'parked' | 'offline' | 'no_data'
export type VehicleAlert =
  'low_fuel' | 'low_battery' | 'harsh_driving' | 'engine_fault' | 'engine_overheat'
export type DrivingEvent = 'harsh_brake' | 'harsh_accel' | 'harsh_turn'

export interface Position {
  lat: number
  lng: number
  speed: number | null
  heading: number | null
  ignition: boolean | null
  recorded_at: string
}

export interface ObdSnapshot {
  rpm: number | null
  speed: number | null
  coolant_c: number | null
  engine_load_pct: number | null
  throttle_pct: number | null
  fuel_pct: number | null
  battery_v: number | null
  odometer_km: number | null
  dtc: string[]
  at: string
}

export interface Vehicle {
  id: number
  imei: string
  name: string
  vehicle_no: string | null
  state: VehicleState
  online: boolean
  last_seen_at: string | null
  fuel: number | null
  battery: number | null
  battery_voltage: number | null
  stopped_since: string | null
  harsh_today: { brake: number; accel: number; turn: number }
  alerts: VehicleAlert[]
  position: Position | null
  obd?: ObdSnapshot | null
}

export interface FleetLive {
  total: number
  moving: number
  idle: number
  parked: number
  offline: number
  harsh_events_today: number
  low_fuel: number
  engine_faults?: number
  vehicles: Vehicle[]
}

export interface PositionRow extends Position {
  id: string
  fuel: number | null
  battery: number | null
  event: DrivingEvent | null
}

export const VEHICLE_STATE: Record<
  VehicleState,
  { label: string; tone: BadgeTone; color: string }
> = {
  moving: { label: 'Moving', tone: 'success', color: '#159053' },
  idle: { label: 'Idle, engine on', tone: 'warning', color: '#c27a00' },
  parked: { label: 'Parked, engine off', tone: 'info', color: '#2563eb' },
  offline: { label: 'Offline', tone: 'neutral', color: '#7f938a' },
  no_data: { label: 'No signal yet', tone: 'neutral', color: '#7f938a' },
}

export const ALERT_LABELS: Record<VehicleAlert, string> = {
  low_fuel: 'Low fuel',
  low_battery: 'Low battery',
  harsh_driving: 'Harsh driving',
  engine_fault: 'Engine fault',
  engine_overheat: 'Engine overheating',
}

export const EVENT_LABELS: Record<DrivingEvent, string> = {
  harsh_brake: 'Harsh braking',
  harsh_accel: 'Harsh acceleration',
  harsh_turn: 'Harsh turn',
}

export const harshTotal = (vehicle: Vehicle) =>
  vehicle.harsh_today.brake + vehicle.harsh_today.accel + vehicle.harsh_today.turn

export type TripKind = 'pickup' | 'drop'
export type TripStatus = 'active' | 'ended'
export type TripTracking = 'telematics' | 'phone'
export type StopStatus = 'pending' | 'approaching' | 'arrived' | 'departed' | 'skipped'

export interface TripRef {
  id: number
  name: string
}

export interface TripVehicle {
  id: number
  registration_no: string
  name: string
  device_id: number | null
}

export interface Trip {
  id: number
  kind: TripKind
  status: TripStatus
  trip_date: string
  route: TripRef
  vehicle: TripVehicle
  started_by: TripRef | null
  started_at: string
  ended_at: string | null
  end_reason: string | null
  position: LivePosition | null
  destination_eta_seconds: number | null
  stops_done: number
  stops_total: number
  flags?: TripFlagCounts | null
  delay?: { minutes: number; reason: string | null; at: string } | null
  handover_of?: number | null
  replaced_by?: number | null
  tracking?: TripTracking
  swept_at?: string | null
}

export interface HandoverResult {
  old_trip: Trip
  new_trip: Trip
  on_board: number
  waiting: number
  parents_told: number
  warning: string | null
}

export type TripFlag = 'not_boarded' | 'not_alighted'
export type TripFlagFilter = 'any' | TripFlag
export type RiderStatus = 'away' | 'waiting' | 'not_at_stop' | 'on_bus' | 'off_bus'
export type BoardingMethod = 'qr' | 'manual'
export type BoardingAction = 'boarded' | 'alighted' | 'missed'

export interface TripFlagCounts {
  not_boarded: number
  not_alighted: number
}

export interface BoardingMark {
  id: number
  at: string
  method: BoardingMethod
  stop: TripRef | null
  recorded_by: TripRef | null
  pass_on_hold: boolean
  handed_to?: string | null
}

export interface ChecklistSummary {
  total: number
  away: number
  waiting: number
  on_bus: number
  off_bus: number
  not_boarded: number
  not_alighted: number
  not_at_stop: number
  boarded_on_hold?: number
}

export interface ChecklistParent {
  name: string
  relation: string
  mobile: string
  is_primary: boolean
}

export interface ChecklistStudent {
  student_id: number
  full_name: string
  class_section: string | null
  stop: TripRef | null
  status: RiderStatus
  flag: TripFlag | null
  boarded: BoardingMark | null
  alighted: BoardingMark | null
  missed: BoardingMark | null
  away_note: string | null
  photo_url: string | null
  parents: ChecklistParent[]
  pass_status: 'active' | 'on_hold'
}

export interface TripChecklist {
  trip: Trip
  summary: ChecklistSummary
  students: ChecklistStudent[]
}

export interface StudentTrip {
  trip_id: number
  trip_date: string
  kind: TripKind
  trip_status: TripStatus
  route: TripRef
  status: RiderStatus
  flag: TripFlag | null
  boarded: BoardingMark | null
  alighted: BoardingMark | null
  missed: BoardingMark | null
  away_note: string | null
}

export interface TripStop {
  stop_id: number
  name: string
  sequence: number
  lat: number
  lng: number
  radius_m: number
  planned_time: string | null
  status: StopStatus
  eta_seconds: number | null
  approached_at: string | null
  arrived_at: string | null
  departed_at: string | null
  riders: number
}

export interface TripEventRow {
  id: number
  type: LiveTripEventType
  stop: TripRef | null
  eta_seconds: number | null
  occurred_at: string
  notified: number
}

export interface TripRider {
  student_id: number
  full_name: string
  class_section: string | null
  stop_id: number
  mode: 'both' | 'pickup' | 'drop'
  passenger_ref: string
  boarded: boolean
  alighted: boolean
  away_today: boolean
  away_note: string | null
}

export interface TripBoarding {
  id: number
  trip_id: number
  student_id: number
  full_name: string
  class_section: string | null
  action: BoardingAction
  method: 'qr' | 'manual'
  stop: TripRef | null
  recorded_by: TripRef | null
  handed_to?: string | null
  pass_on_hold: boolean
  occurred_at: string
}

export interface TripDetail extends Trip {
  stop_list: TripStop[]
  school: { lat: number; lng: number } | null
  events: TripEventRow[]
  riders: TripRider[]
  not_boarded: TripRider[]
  boardings: TripBoarding[]
}

export interface TripListParams {
  page: number
  limit: number
  date?: string
  status?: TripStatus
  route_id?: number
  vehicle_id?: number
  flag?: TripFlagFilter
}

export type HealthStatus = 'good' | 'warning' | 'critical' | 'unknown'
export type Severity = 'low' | 'medium' | 'high'
export type SafetyKind = 'overspeed' | 'harsh_braking' | 'idle' | 'route_deviation'

export interface LatLng {
  lat: number
  lng: number
}

export interface TrackPoint extends LatLng {
  at: string
  speed: number | null
  heading: number | null
}

export interface StopArrival extends LatLng {
  stop_id: number
  name: string
  sequence: number
  status: StopStatus
  planned_time: string | null
  arrived_at: string | null
  departed_at: string | null
}

export interface SafetyEvent extends LatLng {
  id: number
  kind: SafetyKind
  severity: Severity
  message: string
  value: number | null
  limit: number | null
  at: string
  speed_kmh: number | null
}

export interface TripPlayback {
  trip: Trip
  school: LatLng | null
  path: LatLng[]
  points: TrackPoint[]
  total_points: number
  sampled: boolean
  distance_km: number
  duration_seconds: number
  max_speed: number | null
  avg_speed: number | null
  stop_arrivals: StopArrival[]
  safety_events: SafetyEvent[]
}

export interface BusRef {
  id: number
  registration_no: string
  name: string
}

export interface HealthFault {
  code: string
  description: string
  severity: Severity
  first_seen_at: string | null
}

export interface VehicleHealth {
  device_id: number
  status: HealthStatus
  reasons: string[]
  reading_at: string | null
  battery_v: number | null
  coolant_c: number | null
  rpm: number | null
  fuel_pct: number | null
  odometer_km: number | null
  engine_load_pct: number | null
  faults: HealthFault[]
}

export interface BusHealth {
  bus: BusRef
  has_tracker: boolean
  open_tickets: number
  health: VehicleHealth | null
}

export interface ObdReading {
  id: string
  recorded_at: string
  rpm: number | null
  speed: number | null
  coolant_c: number | null
  engine_load_pct: number | null
  throttle_pct: number | null
  fuel_pct: number | null
  battery_v: number | null
  odometer_km: number | null
  dtc: string[]
}

export interface ObdParams {
  page: number
  limit: number
  from?: string
  to?: string
}

export interface StartTripInput {
  route_id: number
  kind: TripKind
}

export const fleetKeys = {
  all: ['fleet'] as const,
  live: () => [...fleetKeys.all, 'live'] as const,
  positions: (id: number) => [...fleetKeys.all, 'positions', id] as const,
  trips: (params: TripListParams) => [...fleetKeys.all, 'trips', params] as const,
  trip: (id: number) => [...fleetKeys.all, 'trip', id] as const,
  checklist: (id: number) => [...fleetKeys.all, 'checklist', id] as const,
  studentTrips: (studentId: number, page: number) =>
    [...fleetKeys.all, 'student-trips', studentId, page] as const,
  playback: (id: number) => [...fleetKeys.all, 'playback', id] as const,
  health: (busId: number) => [...fleetKeys.all, 'health', busId] as const,
  obd: (busId: number, params: ObdParams) => [...fleetKeys.all, 'obd', busId, params] as const,
}

const trips = '/admin/transport/trips'

export const fleetApi = {
  live: () => api.get<FleetLive>('/admin/fleet/live'),
  positions: (id: number, limit = 20) =>
    api.get<Paginated<PositionRow>>(`/admin/fleet/vehicles/${id}/positions`, { page: 1, limit }),
  trips: (params: TripListParams) => api.get<Paginated<Trip>>(trips, { ...params }),
  trip: (id: number) => api.get<TripDetail>(`${trips}/${id}`),
  checklist: (id: number) => api.get<TripChecklist>(`${trips}/${id}/checklist`),
  studentTrips: (studentId: number, page: number, limit = 10) =>
    api.get<Paginated<StudentTrip>>(`/admin/students/${studentId}/bus-history`, { page, limit }),
  startTrip: (input: StartTripInput) => api.post<TripDetail>(trips, input),
  endTrip: (id: number) => api.post<TripDetail>(`${trips}/${id}/end`),
  handover: (id: number, input: { vehicle_id: number; reason?: string; keep_for_today: boolean }) =>
    api.post<HandoverResult>(`${trips}/${id}/handover`, input),
  playback: (id: number, maxPoints = 1500) =>
    api.get<TripPlayback>(`/admin/fleet/trips/${id}/playback`, { max_points: maxPoints }),
  health: (busId: number) => api.get<BusHealth>(`/admin/fleet/buses/${busId}/health`),
  obd: (busId: number, params: ObdParams) =>
    api.get<Paginated<ObdReading>>(`/admin/fleet/buses/${busId}/obd`, { ...params }),
}

export function useFleetLive(enabled = true) {
  return useQuery({
    queryKey: fleetKeys.live(),
    queryFn: fleetApi.live,
    refetchInterval: config.refreshIntervalMs,
    placeholderData: keepPreviousData,
    enabled,
    retry: false,
  })
}

export function usePositions(id: number | null) {
  return useQuery({
    queryKey: fleetKeys.positions(id ?? 0),
    queryFn: () => fleetApi.positions(id!),
    enabled: Boolean(id),
    refetchInterval: config.refreshIntervalMs,
  })
}

export function useTrips(params: TripListParams, poll = true) {
  return useQuery({
    queryKey: fleetKeys.trips(params),
    queryFn: () => fleetApi.trips(params),
    placeholderData: keepPreviousData,
    refetchInterval: poll ? config.refreshIntervalMs * 3 : false,
  })
}

export function useTrip(id: number, poll: boolean) {
  return useQuery({
    queryKey: fleetKeys.trip(id),
    queryFn: () => fleetApi.trip(id),
    refetchInterval: (query) =>
      poll && query.state.data?.status !== 'ended' ? config.refreshIntervalMs : false,
  })
}

export function useTripChecklist(id: number | null, poll: boolean) {
  return useQuery({
    queryKey: fleetKeys.checklist(id ?? 0),
    queryFn: () => fleetApi.checklist(id!),
    enabled: Boolean(id),
    refetchInterval: (query) =>
      poll && query.state.data?.trip.status !== 'ended' ? config.refreshIntervalMs : false,
  })
}

export function useStudentTrips(studentId: number, page: number) {
  return useQuery({
    queryKey: fleetKeys.studentTrips(studentId, page),
    queryFn: () => fleetApi.studentTrips(studentId, page),
    placeholderData: keepPreviousData,
  })
}

export function useTripMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...fleetKeys.all, 'trips'] })
      void queryClient.invalidateQueries({ queryKey: [...fleetKeys.all, 'trip'] })
    },
  })
}

export function usePlayback(id: number) {
  return useQuery({
    queryKey: fleetKeys.playback(id),
    queryFn: () => fleetApi.playback(id),
    retry: false,
    meta: { silent: true },
  })
}

export function useBusHealth(busId: number | null) {
  return useQuery({
    queryKey: fleetKeys.health(busId ?? 0),
    queryFn: () => fleetApi.health(busId!),
    enabled: Boolean(busId),
    refetchInterval: config.refreshIntervalMs * 3,
    retry: false,
    meta: { silent: true },
  })
}

export function useObdLog(busId: number | null, params: ObdParams) {
  return useQuery({
    queryKey: fleetKeys.obd(busId ?? 0, params),
    queryFn: () => fleetApi.obd(busId!, params),
    enabled: Boolean(busId),
    placeholderData: keepPreviousData,
    retry: false,
    meta: { silent: true },
  })
}
