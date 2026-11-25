import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/api/client'
import type { HostelStudent, Order } from './api'

export type SosKind =
  'fire' | 'medical' | 'security' | 'missing_student' | 'natural_disaster' | 'drill' | 'other'
export type SosStatus = 'open' | 'resolved' | 'cancelled'
export type SosMark = 'safe' | 'missing' | 'injured' | 'away'

export interface SosCounts {
  total: number
  safe: number
  missing: number
  injured: number
  away: number
  unmarked: number
}

export interface Sos {
  id: number
  sos_no: string
  hostel_id: number
  hostel_name: string
  kind: SosKind
  message: string
  student: HostelStudent | null
  is_drill: boolean
  notify_parents: boolean
  status: SosStatus
  raised_by_name: string | null
  resolved_by_name: string | null
  resolved_at: string | null
  resolution: string | null
  counts: SosCounts
  created_at: string
}

export interface SosEntry {
  admission_id: number
  student: HostelStudent
  room_no: string | null
  block_name: string | null
  status: SosMark | null
  suggested_status: SosMark | null
  marked_at: string | null
}

export interface SosDetail extends Sos {
  students: SosEntry[]
}

export interface SosInput {
  hostel_id: number
  kind: SosKind
  message: string
  admission_id?: number
  is_drill?: boolean
  notify_parents?: boolean
}

export interface SosMarkItem {
  admission_id: number
  status: SosMark
}

export interface SosCloseInput {
  note?: string | null
}

export interface SosListParams {
  page: number
  limit: number
  search?: string
  hostel_id?: number
  status?: SosStatus
  sort?: 'created_at'
  order?: Order
}

export interface HostelRules {
  rules: string | null
  wake_up_time: string
  study_start_time: string
  study_end_time: string
  in_time: string
  lights_out_time: string
  outing_from_time: string
  outing_until_time: string
  version: string
  acknowledged: boolean
  acknowledged_at: string | null
}

export interface RuleAckRow {
  admission_id: number
  student: HostelStudent
  hostel_name: string
  acknowledged: boolean
  acknowledged_at: string | null
  acknowledged_by: string | null
}

export interface RuleAckParams {
  page: number
  limit: number
  search?: string
  hostel_id?: number
  acknowledged?: boolean
}

export interface RuleAckSummary {
  version: string
  residents: number
  acknowledged: number
}

const BASE = '/admin/hostel'
const LIVE_POLL = 15_000
const IDLE_POLL = 60_000

export const safetyKeys = {
  all: ['hostel', 'safety'] as const,
  sosList: (params: SosListParams) => [...safetyKeys.all, 'sos', 'list', params] as const,
  active: (hostelId?: number) => [...safetyKeys.all, 'sos', 'active', hostelId ?? null] as const,
  sos: (id: number) => [...safetyKeys.all, 'sos', 'detail', id] as const,
  rules: () => [...safetyKeys.all, 'rules'] as const,
  acks: (params: RuleAckParams) => [...safetyKeys.all, 'acks', params] as const,
  ackSummary: (hostelId?: number) =>
    [...safetyKeys.all, 'acks', 'summary', hostelId ?? null] as const,
}

export const safetyApi = {
  sosList: (params: SosListParams) => api.get<Paginated<Sos>>(`${BASE}/sos`, { ...params }),
  active: (hostelId?: number) => api.get<Sos[]>(`${BASE}/sos/active`, { hostel_id: hostelId }),
  sos: (id: number) => api.get<SosDetail>(`${BASE}/sos/${id}`),
  raise: (input: SosInput) => api.post<SosDetail>(`${BASE}/sos`, input),
  mark: (id: number, entries: SosMarkItem[]) =>
    api.post<SosDetail>(`${BASE}/sos/${id}/mark`, { entries }),
  resolve: (id: number, input: SosCloseInput) =>
    api.post<SosDetail>(`${BASE}/sos/${id}/resolve`, input),
  cancel: (id: number, input: SosCloseInput) =>
    api.post<SosDetail>(`${BASE}/sos/${id}/cancel`, input),
  rules: () => api.get<HostelRules>(`${BASE}/rules`),
  acks: (params: RuleAckParams) =>
    api.get<Paginated<RuleAckRow>>(`${BASE}/rules/acknowledgements`, { ...params }),
  ackSummary: (hostelId?: number) =>
    api.get<RuleAckSummary>(`${BASE}/rules/acknowledgements/summary`, { hostel_id: hostelId }),
}

export function useSosList(params: SosListParams, enabled = true) {
  return useQuery({
    queryKey: safetyKeys.sosList(params),
    queryFn: () => safetyApi.sosList(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useActiveSos(hostelId?: number, enabled = true) {
  return useQuery({
    queryKey: safetyKeys.active(hostelId),
    queryFn: () => safetyApi.active(hostelId),
    placeholderData: keepPreviousData,
    refetchInterval: (query) => (query.state.data?.length ? LIVE_POLL : IDLE_POLL),
    enabled,
  })
}

export function useSos(id: number, enabled = true) {
  return useQuery({
    queryKey: safetyKeys.sos(id),
    queryFn: () => safetyApi.sos(id),
    refetchInterval: (query) => (query.state.data?.status === 'open' ? LIVE_POLL : false),
    enabled: enabled && Number.isFinite(id) && id > 0,
  })
}

export function useHostelRules(enabled = true) {
  return useQuery({ queryKey: safetyKeys.rules(), queryFn: safetyApi.rules, enabled })
}

export function useRuleAcks(params: RuleAckParams, enabled = true) {
  return useQuery({
    queryKey: safetyKeys.acks(params),
    queryFn: () => safetyApi.acks(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useRuleAckSummary(hostelId?: number, enabled = true) {
  return useQuery({
    queryKey: safetyKeys.ackSummary(hostelId),
    queryFn: () => safetyApi.ackSummary(hostelId),
    placeholderData: keepPreviousData,
    enabled,
  })
}
