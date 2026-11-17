import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ComboboxOption } from '@/components/common/combobox'
import type { VerifiableDoc } from '@/components/common/document-list'
import { api, type Paginated } from '@/lib/api/client'

export type BusExpiryKind =
  | 'insurance'
  | 'fitness'
  | 'permit'
  | 'puc'
  | 'rc'
  | 'road_tax'
  | 'speed_governor'
  | 'fire_extinguisher'
  | 'first_aid'
export type ExpiryKind = BusExpiryKind | 'licence' | 'badge' | 'medical' | 'police'
export type BusDocumentType = BusExpiryKind | 'other'
export type VehicleType = 'bus' | 'mini_bus' | 'van' | 'car'
export type FuelType = 'diesel' | 'petrol' | 'cng' | 'electric'
export type Ownership = 'school' | 'contractor'
export type BusFlag = 'not_road_worthy' | 'expired' | 'due_soon' | 'nearly_full' | 'contractor'
export type DutyStatus = 'pending' | 'approved' | 'blocked'
export type ExpiryStateCode = 'ok' | 'due_soon' | 'expired' | 'missing'
export type VehicleStatus = 'active' | 'inactive'
export type TransportMode = 'both' | 'pickup' | 'drop'
export type CrewRole = 'driver' | 'attendant'

export interface Ref {
  id: number
  name: string
}

export interface PersonContact {
  id: number
  name: string
  mobile: string
}

export interface ExpiryState {
  kind: ExpiryKind
  label: string
  date: string | null
  days_left: number | null
  state: ExpiryStateCode
}

export interface AllowedToday {
  on_date: string
  reason: string
  by: Ref | null
  at: string
}

export type BusDates = Record<`${BusExpiryKind}_expiry`, string | null>

export interface Bus extends BusDates {
  id: number
  registration_no: string
  name: string
  make_model: string | null
  capacity: number
  vehicle_type: VehicleType
  fuel_type: FuelType | null
  manufacture_year: number | null
  chassis_no: string | null
  engine_no: string | null
  ownership: Ownership
  contractor_name: string | null
  contractor_mobile: string | null
  road_worthy: boolean
  road_blockers: string[]
  allowed_today: AllowedToday | null
  occupancy_percent: number
  nearly_full: boolean
  over_capacity: boolean
  device: { id: number; imei: string | null } | null
  driver: PersonContact | null
  attendant: PersonContact | null
  expiries: ExpiryState[]
  routes: Ref[]
  students: number
  status: VehicleStatus
}

export interface BusInput extends Partial<BusDates> {
  registration_no: string
  name: string
  make_model?: string | null
  capacity?: number
  vehicle_type?: VehicleType
  fuel_type?: FuelType | null
  manufacture_year?: number | null
  chassis_no?: string | null
  engine_no?: string | null
  ownership?: Ownership
  contractor_name?: string | null
  contractor_mobile?: string | null
  device_id?: number | null
  driver_user_id?: number | null
  attendant_user_id?: number | null
  status?: VehicleStatus
}

export interface BusInsights {
  total: number
  not_road_worthy: number
  expired: number
  due_soon: number
  nearly_full: number
  contractor: number
}

export interface BusDocument extends VerifiableDoc {
  type: BusDocumentType
  number: string | null
  expiry_date: string | null
  current: boolean
}

export interface BusDocumentInput {
  type: string
  title: string
  file_id: number
  number?: string | null
  expiry_date?: string | null
}

export interface Tracker {
  id: number
  imei: string
  name: string
  vehicle_no: string | null
  last_seen_at: string | null
  linked_vehicle: Ref | null
}

export interface Crew {
  user_id: number
  name: string
  mobile: string
  role: CrewRole
  licence_no: string | null
  licence_expiry: string | null
  licence: ExpiryState | null
  vehicle: Ref | null
  duty_status: DutyStatus
}

export interface RouteBus {
  id: number
  registration_no: string
  name: string
  capacity: number
}

export interface RouteTimings {
  leaves_at: string | null
  reaches_school_at: string | null
  leaves_school_at: string | null
  last_drop_at: string | null
}

export interface ScheduleProblem {
  code: string
  severity: 'error' | 'warning'
  stop: string | null
  field: string | null
  message: string
}

export type RouteFlag = 'no_bus' | 'inactive' | 'has_problems'
export type PassStatus = 'active' | 'on_hold'

export interface RouteChange {
  id: number
  kind: string
  summary: string
  stop: Ref | null
  student: Ref | null
  parents_told: number
  changed_by: Ref | null
  at: string
}

export interface RouteInsights {
  routes: number
  active: number
  stops: number
  students: number
  no_bus: number
  with_problems: number
}

export interface BusRoute {
  id: number
  code: string
  name: string
  vehicle: RouteBus | null
  is_active: boolean
  stops: number
  students: number
  morning_riders: number
  evening_riders: number
  first_pickup: string | null
  timings: RouteTimings
  problems: number
}

export interface Stop {
  id: number
  name: string
  landmark: string | null
  lat: number
  lng: number
  sequence: number
  pickup_time: string | null
  drop_time: string | null
  geofence_radius_m: number
  monthly_fee: number
  students: number
}

export interface RouteDetail extends BusRoute {
  stop_list: Stop[]
  school_location: { lat: number; lng: number } | null
  distance_km: number
  schedule_problems: ScheduleProblem[]
  warnings: string[]
}

export interface RouteInput {
  code: string
  name: string
  vehicle_id?: number | null
  is_active?: boolean
}

export interface StopInput {
  id?: number
  name: string
  landmark?: string | null
  lat: number
  lng: number
  pickup_time?: string | null
  drop_time?: string | null
  geofence_radius_m?: number
  monthly_fee?: number
}

export interface RiderStop {
  id: number
  name: string
  pickup_time: string | null
  drop_time: string | null
}

export interface RiderStudent {
  id: number
  full_name: string
  admission_no: string
  class_section: string | null
}

export interface Rider {
  id: number
  student: RiderStudent
  route: Ref
  stop: RiderStop
  drop_stop: RiderStop | null
  mode: TransportMode
  start_date: string
  passenger_ref: string
  monthly_fee: number
  pass_status: PassStatus
  pass_note: string | null
  pass_changed_at: string | null
}

export interface RiderInput {
  route_id: number
  stop_id: number
  drop_stop_id?: number | null
  mode?: TransportMode
  start_date?: string
}

export interface RosterStudent extends RiderStudent {
  mode: TransportMode
  guardian_name: string | null
  guardian_mobile: string | null
  pass_status: PassStatus
  away_morning: string | null
  away_evening: string | null
}

export interface RosterStop {
  id: number
  sequence: number
  name: string
  landmark: string | null
  pickup_time: string | null
  drop_time: string | null
  pickup_students: RosterStudent[]
  drop_students: RosterStudent[]
}

export interface RouteRoster {
  id: number
  code: string
  name: string
  vehicle: RouteBus | null
  morning_riders: number
  evening_riders: number
  bus_morning_riders: number
  bus_evening_riders: number
  stops: RosterStop[]
}

export type TransportChangeAction = 'assigned' | 'moved' | 'removed'

export interface TransportChangePlace {
  route: Ref
  stop: Ref
  drop_stop: Ref | null
}

export interface TransportChange {
  id: number
  action: TransportChangeAction
  from: TransportChangePlace | null
  to: TransportChangePlace | null
  mode: TransportMode | null
  by: Ref | null
  at: string
}

export interface AssignResult {
  assigned: number
  moved: number
  route: RouteDetail
}

export interface Expiry {
  kind: ExpiryKind
  label: string
  subject: string
  ref_id: number
  vehicle_id: number | null
  staff_id: number | null
  date: string
  days_left: number
}

export interface ExpiryRun {
  alerts_sent: number
  upcoming: Expiry[]
}

export interface BusListParams {
  page: number
  limit: number
  search?: string
  flag?: BusFlag
}

export type RiderSort = 'name' | 'admission_no' | 'class' | 'stop' | 'created_at'

export interface RiderListParams {
  page: number
  limit: number
  search?: string
  route_id?: number
  stop_id?: number
  class_id?: number
  mode?: TransportMode
  sort?: RiderSort
  order?: 'asc' | 'desc'
  pass_status?: PassStatus
}

export interface RatingTag {
  code: string
  label: string
  positive: boolean
}

export interface RatedDriver {
  id: number
  name: string
  photo_url: string | null
}

export interface RatedBus {
  id: number
  registration_no: string
  name: string
}

export interface DriverRating {
  id: number
  rating: number
  tags: RatingTag[]
  comment: string | null
  month: string
  driver: { id: number; name: string }
  vehicle: RatedBus | null
  student: { id: number; full_name: string; class_section: string | null }
  parent: { id: number; name: string }
  created_at: string
  updated_at: string
}

export interface DriverRatingSummary {
  driver: RatedDriver
  vehicle: RatedBus | null
  average: number | null
  count: number
  month_average: number | null
  month_count: number
  low_count: number
  distribution: number[]
  top_tags: (RatingTag & { count: number })[]
}

export interface DriverRatingInsights {
  average: number | null
  count: number
  month_count: number
  month_low: number
  drivers_rated: number
}

export interface DriverRatingParams {
  page: number
  limit: number
  search?: string
  driver_user_id?: number
  rating?: number
  low?: boolean
}

export const transportKeys = {
  all: ['transport'] as const,
  buses: (params: BusListParams) => [...transportKeys.all, 'buses', params] as const,
  busInsights: () => [...transportKeys.all, 'bus-insights'] as const,
  busDocuments: (id: number) => [...transportKeys.all, 'bus-documents', id] as const,
  trackers: () => [...transportKeys.all, 'trackers'] as const,
  crew: () => [...transportKeys.all, 'crew'] as const,
  expiries: (days: number) => [...transportKeys.all, 'expiries', days] as const,
  routes: (flag?: RouteFlag) => [...transportKeys.all, 'routes', flag ?? 'all'] as const,
  routeInsights: () => [...transportKeys.all, 'route-insights'] as const,
  routeHistory: (id: number) => [...transportKeys.all, 'route-history', id] as const,
  route: (id: number) => [...transportKeys.all, 'route', id] as const,
  riders: (params: RiderListParams) => [...transportKeys.all, 'riders', params] as const,
  roster: (routeId: number) => [...transportKeys.all, 'roster', routeId] as const,
  student: (studentId: number) => [...transportKeys.all, 'student', studentId] as const,
  history: (studentId: number) => [...transportKeys.all, 'history', studentId] as const,
  ratings: (params: DriverRatingParams) => [...transportKeys.all, 'ratings', params] as const,
  ratingSummary: () => [...transportKeys.all, 'rating-summary'] as const,
  ratingInsights: () => [...transportKeys.all, 'rating-insights'] as const,
}

const base = '/admin/transport'

export const transportApi = {
  driverRatings: (params: DriverRatingParams) =>
    api.get<Paginated<DriverRating>>(`${base}/driver-ratings`, { ...params }),
  driverRatingSummary: () => api.get<DriverRatingSummary[]>(`${base}/driver-ratings/summary`),
  driverRatingInsights: () => api.get<DriverRatingInsights>(`${base}/driver-ratings/insights`),
  buses: (params: BusListParams) => api.get<Paginated<Bus>>(`${base}/vehicles`, { ...params }),
  createBus: (input: BusInput) => api.post<Bus>(`${base}/vehicles`, input),
  updateBus: (id: number, input: Partial<BusInput>) =>
    api.patch<Bus>(`${base}/vehicles/${id}`, input),
  removeBus: (id: number) => api.delete<null>(`${base}/vehicles/${id}`),
  busInsights: () => api.get<BusInsights>(`${base}/vehicles/insights`),
  busDocuments: (id: number) => api.get<BusDocument[]>(`${base}/vehicles/${id}/documents`),
  addBusDocument: (id: number, input: BusDocumentInput) =>
    api.post<BusDocument>(`${base}/vehicles/${id}/documents`, input),
  verifyBusDocument: (
    id: number,
    documentId: number,
    status: 'verified' | 'rejected',
    remarks: string | null
  ) =>
    api.post<BusDocument>(`${base}/vehicles/${id}/documents/${documentId}/verify`, {
      status,
      ...(remarks ? { remarks } : {}),
    }),
  removeBusDocument: (id: number, documentId: number) =>
    api.delete<{ id: number }>(`${base}/vehicles/${id}/documents/${documentId}`),
  allowBusToday: (id: number, reason: string) =>
    api.post<AllowedToday>(`${base}/vehicles/${id}/allow-today`, { reason }),
  trackers: () => api.get<Tracker[]>(`${base}/devices`),
  crew: () => api.get<Crew[]>(`${base}/drivers`),
  expiries: (days: number) => api.get<Expiry[]>(`${base}/expiries`, { days }),
  checkExpiries: () => api.post<ExpiryRun>(`${base}/expiries/check`),
  routes: (flag?: RouteFlag) => api.get<BusRoute[]>(`${base}/routes`, { flag }),
  routeInsights: () => api.get<RouteInsights>(`${base}/routes/insights`),
  routeHistory: (id: number) => api.get<RouteChange[]>(`${base}/routes/${id}/history`),
  setPass: (studentId: number, status: PassStatus, note: string | null) =>
    api.put<Rider>(`/admin/students/${studentId}/transport/pass`, { status, note }),
  route: (id: number) => api.get<RouteDetail>(`${base}/routes/${id}`),
  createRoute: (input: RouteInput) => api.post<RouteDetail>(`${base}/routes`, input),
  updateRoute: (id: number, input: Partial<RouteInput>) =>
    api.patch<RouteDetail>(`${base}/routes/${id}`, input),
  removeRoute: (id: number) => api.delete<null>(`${base}/routes/${id}`),
  saveStops: (id: number, items: StopInput[]) =>
    api.put<RouteDetail>(`${base}/routes/${id}/stops`, { items }),
  autoSequence: (id: number) => api.post<RouteDetail>(`${base}/routes/${id}/auto-sequence`),
  assignStop: (routeId: number, stopId: number, studentIds: number[], mode: TransportMode) =>
    api.post<AssignResult>(`${base}/routes/${routeId}/stops/${stopId}/students`, {
      student_ids: studentIds,
      mode,
    }),
  riders: (params: RiderListParams) => api.get<Paginated<Rider>>(`${base}/students`, { ...params }),
  setRider: (studentId: number, input: RiderInput) =>
    api.put<Rider>(`/admin/students/${studentId}/transport`, input),
  removeRider: (studentId: number) => api.delete<null>(`/admin/students/${studentId}/transport`),
  studentTransport: (studentId: number) =>
    api.get<Rider | null>(`/admin/students/${studentId}/transport`),
  history: (studentId: number) =>
    api.get<TransportChange[]>(`/admin/students/${studentId}/transport/history`),
  roster: (routeId: number) => api.get<RouteRoster>(`${base}/routes/${routeId}/roster`),
}

export function useBuses(params: BusListParams) {
  return useQuery({
    queryKey: transportKeys.buses(params),
    queryFn: () => transportApi.buses(params),
    placeholderData: keepPreviousData,
  })
}

export function useBusInsights() {
  return useQuery({ queryKey: transportKeys.busInsights(), queryFn: transportApi.busInsights })
}

export function useBusDocuments(id: number) {
  return useQuery({
    queryKey: transportKeys.busDocuments(id),
    queryFn: () => transportApi.busDocuments(id),
  })
}

export function useBusOptions(): ComboboxOption[] {
  const buses = useBuses({ page: 1, limit: 100 })
  return (buses.data?.items ?? []).map((bus) => ({
    value: String(bus.id),
    label: `${bus.registration_no} · ${bus.name}`,
    hint: `${bus.capacity} seats`,
  }))
}

export function useTrackers(enabled = true) {
  return useQuery({
    queryKey: transportKeys.trackers(),
    queryFn: transportApi.trackers,
    enabled,
    retry: false,
    meta: { silent: true },
  })
}

export function useCrew() {
  return useQuery({ queryKey: transportKeys.crew(), queryFn: transportApi.crew })
}

export function useDriverRatings(params: DriverRatingParams) {
  return useQuery({
    queryKey: transportKeys.ratings(params),
    queryFn: () => transportApi.driverRatings(params),
    placeholderData: keepPreviousData,
  })
}

export function useDriverRatingSummary() {
  return useQuery({
    queryKey: transportKeys.ratingSummary(),
    queryFn: transportApi.driverRatingSummary,
  })
}

export function useDriverRatingInsights() {
  return useQuery({
    queryKey: transportKeys.ratingInsights(),
    queryFn: transportApi.driverRatingInsights,
  })
}

export function useExpiries(days = 30) {
  return useQuery({
    queryKey: transportKeys.expiries(days),
    queryFn: () => transportApi.expiries(days),
  })
}

export function useBusRoutes(flag?: RouteFlag) {
  return useQuery({
    queryKey: transportKeys.routes(flag),
    queryFn: () => transportApi.routes(flag),
  })
}

export function useRouteInsights() {
  return useQuery({ queryKey: transportKeys.routeInsights(), queryFn: transportApi.routeInsights })
}

export function useRouteHistory(id: number | undefined) {
  return useQuery({
    queryKey: transportKeys.routeHistory(id ?? 0),
    queryFn: () => transportApi.routeHistory(id!),
    enabled: Boolean(id),
  })
}

export function useRouteDetail(id: number | undefined) {
  return useQuery({
    queryKey: transportKeys.route(id ?? 0),
    queryFn: () => transportApi.route(id!),
    enabled: Boolean(id),
  })
}

export function useRiders(params: RiderListParams, enabled = true) {
  return useQuery({
    queryKey: transportKeys.riders(params),
    queryFn: () => transportApi.riders(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useRouteRoster(routeId: number | undefined) {
  return useQuery({
    queryKey: transportKeys.roster(routeId ?? 0),
    queryFn: () => transportApi.roster(routeId!),
    enabled: Boolean(routeId),
  })
}

export function useStudentTransport(studentId: number) {
  return useQuery({
    queryKey: transportKeys.student(studentId),
    queryFn: () => transportApi.studentTransport(studentId),
  })
}

export function useTransportHistory(studentId: number) {
  return useQuery({
    queryKey: transportKeys.history(studentId),
    queryFn: () => transportApi.history(studentId),
  })
}

export function useTransportMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: transportKeys.all })
    },
  })
}
