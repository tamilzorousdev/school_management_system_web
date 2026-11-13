import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ComboboxOption } from '@/components/common/combobox'
import { api, type Paginated } from '@/lib/api/client'

export type ExpiryKind = 'insurance' | 'fitness' | 'puc' | 'permit' | 'licence'
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

export interface Bus {
  id: number
  registration_no: string
  name: string
  make_model: string | null
  capacity: number
  device: { id: number; imei: string | null } | null
  driver: PersonContact | null
  attendant: PersonContact | null
  insurance_expiry: string | null
  fitness_expiry: string | null
  puc_expiry: string | null
  permit_expiry: string | null
  expiries: ExpiryState[]
  routes: Ref[]
  students: number
  status: VehicleStatus
}

export interface BusInput {
  registration_no: string
  name: string
  make_model?: string | null
  capacity?: number
  device_id?: number | null
  driver_user_id?: number | null
  attendant_user_id?: number | null
  insurance_expiry?: string | null
  fitness_expiry?: string | null
  puc_expiry?: string | null
  permit_expiry?: string | null
  status?: VehicleStatus
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
}

export interface LicenceInput {
  licence_no: string | null
  licence_expiry: string | null
}

export interface RouteBus {
  id: number
  registration_no: string
  name: string
  capacity: number
}

export interface BusRoute {
  id: number
  code: string
  name: string
  vehicle: RouteBus | null
  is_active: boolean
  stops: number
  students: number
  first_pickup: string | null
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

export interface Rider {
  id: number
  student: { id: number; full_name: string; admission_no: string; class_section: string | null }
  route: Ref
  stop: { id: number; name: string; pickup_time: string | null; drop_time: string | null }
  mode: TransportMode
  start_date: string
  passenger_ref: string
  monthly_fee: number
}

export interface RiderInput {
  route_id: number
  stop_id: number
  mode?: TransportMode
  start_date?: string
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
}

export interface RiderListParams {
  page: number
  limit: number
  search?: string
  route_id?: number
  stop_id?: number
}

export const transportKeys = {
  all: ['transport'] as const,
  buses: (params: BusListParams) => [...transportKeys.all, 'buses', params] as const,
  trackers: () => [...transportKeys.all, 'trackers'] as const,
  crew: () => [...transportKeys.all, 'crew'] as const,
  expiries: (days: number) => [...transportKeys.all, 'expiries', days] as const,
  routes: () => [...transportKeys.all, 'routes'] as const,
  route: (id: number) => [...transportKeys.all, 'route', id] as const,
  riders: (params: RiderListParams) => [...transportKeys.all, 'riders', params] as const,
}

const base = '/admin/transport'

export const transportApi = {
  buses: (params: BusListParams) => api.get<Paginated<Bus>>(`${base}/vehicles`, { ...params }),
  createBus: (input: BusInput) => api.post<Bus>(`${base}/vehicles`, input),
  updateBus: (id: number, input: Partial<BusInput>) =>
    api.patch<Bus>(`${base}/vehicles/${id}`, input),
  removeBus: (id: number) => api.delete<null>(`${base}/vehicles/${id}`),
  trackers: () => api.get<Tracker[]>(`${base}/devices`),
  crew: () => api.get<Crew[]>(`${base}/drivers`),
  saveLicence: (userId: number, input: LicenceInput) =>
    api.put<Crew>(`${base}/drivers/${userId}/licence`, input),
  expiries: (days: number) => api.get<Expiry[]>(`${base}/expiries`, { days }),
  checkExpiries: () => api.post<ExpiryRun>(`${base}/expiries/check`),
  routes: () => api.get<BusRoute[]>(`${base}/routes`),
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
}

export function useBuses(params: BusListParams) {
  return useQuery({
    queryKey: transportKeys.buses(params),
    queryFn: () => transportApi.buses(params),
    placeholderData: keepPreviousData,
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

export function useExpiries(days = 30) {
  return useQuery({
    queryKey: transportKeys.expiries(days),
    queryFn: () => transportApi.expiries(days),
  })
}

export function useBusRoutes() {
  return useQuery({ queryKey: transportKeys.routes(), queryFn: transportApi.routes })
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
