import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { config } from '@/config/env'
import { api, type Paginated } from '@/lib/api/client'

export type AlertKind =
  'sos' | 'overspeed' | 'harsh_braking' | 'idle' | 'route_deviation' | 'vehicle_fault' | 'other'
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'
export type AlertStatus = 'open' | 'acknowledged' | 'resolved'

export interface AlertRef {
  id: number
  name: string
}

export interface FleetAlert {
  id: number
  kind: AlertKind
  kind_label: string
  severity: AlertSeverity
  status: AlertStatus
  source: 'driver_app' | 'telematics' | 'system'
  message: string
  trip: { id: number; kind: 'pickup' | 'drop' } | null
  vehicle: { id: number; registration_no: string; name: string; device_id: number | null } | null
  route: AlertRef | null
  raised_by: (AlertRef & { mobile: string | null }) | null
  position: { lat: number; lng: number; speed_kmh: number | null } | null
  data: Record<string, string | number | boolean | null>
  raised_at: string
  notified: number
  acknowledged_by: AlertRef | null
  acknowledged_at: string | null
  resolved_by: AlertRef | null
  resolved_at: string | null
  resolution_note: string | null
}

export interface AlertInsights {
  open: number
  sos_active: number
  high_active: number
  acknowledged: number
  resolved_today: number
  raised_today: number
  active_by_kind: Partial<Record<AlertKind, number>>
}

export interface AlertListParams {
  page: number
  limit: number
  search?: string
  kind?: AlertKind
  status?: AlertStatus
  severity?: AlertSeverity
  active?: boolean
  from?: string
  to?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export const alertKeys = {
  all: ['fleet-alerts'] as const,
  list: (params: AlertListParams) => [...alertKeys.all, 'list', params] as const,
  insights: () => [...alertKeys.all, 'insights'] as const,
  activeSos: () => [...alertKeys.all, 'active-sos'] as const,
  detail: (id: number) => [...alertKeys.all, 'detail', id] as const,
}

const base = '/admin/fleet/alerts'

export const alertsApi = {
  list: (params: AlertListParams) => api.get<Paginated<FleetAlert>>(base, { ...params }),
  insights: () => api.get<AlertInsights>(`${base}/insights`),
  get: (id: number) => api.get<FleetAlert>(`${base}/${id}`),
  acknowledge: (id: number) => api.post<FleetAlert>(`${base}/${id}/acknowledge`),
  resolve: ({ id, resolution_note }: { id: number; resolution_note: string }) =>
    api.post<FleetAlert>(`${base}/${id}/resolve`, { resolution_note }),
}

export function useAlerts(params: AlertListParams, poll: boolean) {
  return useQuery({
    queryKey: alertKeys.list(params),
    queryFn: () => alertsApi.list(params),
    placeholderData: keepPreviousData,
    refetchInterval: poll ? config.refreshIntervalMs * 3 : false,
  })
}

export function useAlertInsights(poll: boolean) {
  return useQuery({
    queryKey: alertKeys.insights(),
    queryFn: alertsApi.insights,
    refetchInterval: poll ? config.refreshIntervalMs * 3 : false,
  })
}

export function useAlert(id: number | null) {
  return useQuery({
    queryKey: alertKeys.detail(id ?? 0),
    queryFn: () => alertsApi.get(id!),
    enabled: Boolean(id),
  })
}

export function useActiveSos(enabled: boolean, poll: boolean) {
  return useQuery({
    queryKey: alertKeys.activeSos(),
    queryFn: () =>
      alertsApi.list({ page: 1, limit: 5, kind: 'sos', active: true, sort: 'raised_at' }),
    enabled,
    refetchInterval: poll ? config.refreshIntervalMs * 3 : false,
    retry: false,
  })
}

function useAlertMutation<TInput>(fn: (input: TInput) => Promise<FleetAlert>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: alertKeys.all }),
  })
}

export const useAcknowledgeAlert = () => useAlertMutation(alertsApi.acknowledge)
export const useResolveAlert = () => useAlertMutation(alertsApi.resolve)
