import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/api/client'

export type TransportFeeStatus = 'paid' | 'pending' | 'overdue' | 'not_billed'

export interface TransportFeeFigures {
  students: number
  billed: number
  collected: number
  pending: number
  overdue: number
}

export interface TransportFeeStop extends TransportFeeFigures {
  id: number
  name: string
  sequence: number
  monthly_fee: number
}

export interface TransportFeeRoute extends TransportFeeFigures {
  id: number
  code: string
  name: string
  monthly_fee: number
  riders: number
  stops: TransportFeeStop[]
}

export interface TransportFeeSummary {
  totals: TransportFeeFigures
  routes: TransportFeeRoute[]
}

export interface TransportFeeRow {
  student: { id: number; full_name: string; admission_no: string; class_section: string | null }
  route: { id: number; name: string }
  stop: { id: number; name: string }
  drop_stop: { id: number; name: string } | null
  monthly_fee: number
  billed: number
  paid: number
  pending: number
  overdue: number
  next_due_date: string | null
  status: TransportFeeStatus
}

export interface TransportFeeParams {
  page: number
  limit: number
  search?: string
  route_id?: number
  stop_id?: number
  status?: TransportFeeStatus
  student_id?: number
  sort?: 'name' | 'pending' | 'billed'
  order?: 'asc' | 'desc'
}

export const transportFeeKeys = {
  all: ['fees', 'transport'] as const,
  summary: (routeId?: number) => [...transportFeeKeys.all, 'summary', routeId ?? 0] as const,
  list: (params: TransportFeeParams) => [...transportFeeKeys.all, 'list', params] as const,
}

export const transportFeesApi = {
  summary: (routeId?: number) =>
    api.get<TransportFeeSummary>('/admin/fees/transport/summary', { route_id: routeId }),
  list: (params: TransportFeeParams) =>
    api.get<Paginated<TransportFeeRow>>('/admin/fees/transport', { ...params }),
}

export function useTransportFeeSummary(routeId?: number) {
  return useQuery({
    queryKey: transportFeeKeys.summary(routeId),
    queryFn: () => transportFeesApi.summary(routeId),
  })
}

export function useTransportFees(params: TransportFeeParams, enabled = true) {
  return useQuery({
    queryKey: transportFeeKeys.list(params),
    queryFn: () => transportFeesApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}
