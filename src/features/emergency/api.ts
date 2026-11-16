import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/api/client'

export interface Ref {
  id: number
  name: string
}

export type EmergencyCategory =
  'weather' | 'school_closed' | 'security' | 'health' | 'transport' | 'all_clear' | 'other'
export type EmergencySeverity = 'info' | 'warning' | 'critical'
export type EmergencyAudience =
  'everyone' | 'parents' | 'staff' | 'classes' | 'sections' | 'students'
export type EmergencyChannel = 'push' | 'sms'
export type BroadcastStatus = 'sending' | 'sent' | 'partly_failed'
export type DeliveryStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'skipped' | 'none'
export type RecipientFilter =
  'all' | 'failed' | 'not_read' | 'not_acknowledged' | 'sms_only' | 'unreachable'

export interface AudienceInput {
  audience: EmergencyAudience
  class_ids?: number[]
  section_ids?: number[]
  student_ids?: number[]
  include_teachers?: boolean
}

export interface EmergencyInput extends AudienceInput {
  title: string
  message: string
  title_ta?: string
  message_ta?: string
  category: EmergencyCategory
  severity: EmergencySeverity
  channels: EmergencyChannel[]
  client_id: string
  follow_up_of?: number
}

export interface EmergencyPreview {
  recipients: number
  parents: number
  staff: number
  with_app: number
  with_mobile: number
  sms_only: number
  unreachable: number
}

export interface ChannelCounts {
  pending: number
  sending: number
  sent: number
  failed: number
  skipped: number
}

export interface EmergencyCounts {
  total: number
  parents: number
  staff: number
  in_app: number
  push: ChannelCounts
  sms: ChannelCounts
  reached: number
  read: number
  acknowledged: number
  reached_percent: number | null
  acknowledged_percent: number | null
}

export interface EmergencyBroadcast {
  id: number
  title: string
  message: string
  title_ta: string | null
  message_ta: string | null
  category: EmergencyCategory
  severity: EmergencySeverity
  audience: EmergencyAudience
  audience_label: string
  class_ids: number[]
  section_ids: number[]
  student_ids: number[]
  include_teachers: boolean
  channels: EmergencyChannel[]
  status: BroadcastStatus
  sent_by: Ref | null
  sent_at: string
  completed_at: string | null
  follow_up_of: Ref | null
  counts: EmergencyCounts
}

export interface EmergencyRecipient {
  id: number
  kind: 'parent' | 'staff' | 'both'
  name: string
  mobile: string | null
  has_app: boolean
  students: { id: number; name: string; section: string | null }[]
  push_status: DeliveryStatus
  push_error: string | null
  sms_status: DeliveryStatus
  sms_error: string | null
  read_at: string | null
  acknowledged_at: string | null
}

export interface EmergencyTemplate {
  key: string
  category: EmergencyCategory
  severity: EmergencySeverity
  title: string
  message: string
  title_ta: string
  message_ta: string
}

export interface EmergencyInsights {
  this_month: number
  recipients: number
  reached_percent: number | null
  acknowledged_percent: number | null
  sending: number
  last: EmergencyBroadcast | null
}

export interface EmergencyListParams {
  page: number
  limit: number
  search?: string
  category?: EmergencyCategory
  status?: BroadcastStatus
}

export interface RecipientParams {
  page: number
  limit: number
  filter?: RecipientFilter
  search?: string
}

export const emergencyKeys = {
  all: ['emergency'] as const,
  list: (params: EmergencyListParams) => [...emergencyKeys.all, 'list', params] as const,
  detail: (id: number) => [...emergencyKeys.all, 'detail', id] as const,
  recipients: (id: number, params: RecipientParams) =>
    [...emergencyKeys.all, 'recipients', id, params] as const,
  insights: () => [...emergencyKeys.all, 'insights'] as const,
  templates: () => [...emergencyKeys.all, 'templates'] as const,
  preview: (input: AudienceInput) => [...emergencyKeys.all, 'preview', input] as const,
}

export const emergencyApi = {
  list: (params: EmergencyListParams) =>
    api.get<Paginated<EmergencyBroadcast>>('/admin/emergency-broadcasts', { ...params }),
  detail: (id: number) => api.get<EmergencyBroadcast>(`/admin/emergency-broadcasts/${id}`),
  recipients: (id: number, params: RecipientParams) =>
    api.get<Paginated<EmergencyRecipient>>(`/admin/emergency-broadcasts/${id}/recipients`, {
      ...params,
    }),
  insights: () => api.get<EmergencyInsights>('/admin/emergency-broadcasts/insights'),
  templates: () => api.get<EmergencyTemplate[]>('/admin/emergency-broadcasts/templates'),
  preview: (input: AudienceInput) =>
    api.post<EmergencyPreview>('/admin/emergency-broadcasts/preview', input),
  send: (input: EmergencyInput) =>
    api.post<EmergencyBroadcast>('/admin/emergency-broadcasts', input),
  resend: (id: number, target: 'failed' | 'not_acknowledged') =>
    api.post<{ queued: number }>(`/admin/emergency-broadcasts/${id}/resend`, { target }),
}

const refreshWhileSending = (status?: BroadcastStatus) => (status === 'sending' ? 2000 : false)

export function useEmergencyList(params: EmergencyListParams) {
  return useQuery({
    queryKey: emergencyKeys.list(params),
    queryFn: () => emergencyApi.list(params),
    placeholderData: keepPreviousData,
    refetchInterval: (query) =>
      query.state.data?.items.some((item) => item.status === 'sending') ? 2000 : false,
  })
}

export function useEmergency(id: number | undefined) {
  return useQuery({
    queryKey: emergencyKeys.detail(id ?? 0),
    queryFn: () => emergencyApi.detail(id!),
    enabled: Boolean(id),
    refetchInterval: (query) => refreshWhileSending(query.state.data?.status),
  })
}

export function useEmergencyRecipients(
  id: number | undefined,
  params: RecipientParams,
  live: boolean
) {
  return useQuery({
    queryKey: emergencyKeys.recipients(id ?? 0, params),
    queryFn: () => emergencyApi.recipients(id!, params),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
    refetchInterval: live ? 2000 : false,
  })
}

export function useEmergencyInsights() {
  return useQuery({
    queryKey: emergencyKeys.insights(),
    queryFn: emergencyApi.insights,
    refetchInterval: (query) => (query.state.data?.sending ? 2000 : false),
  })
}

export function useEmergencyTemplates() {
  return useQuery({
    queryKey: emergencyKeys.templates(),
    queryFn: emergencyApi.templates,
    staleTime: Infinity,
  })
}

export function useEmergencyPreview(input: AudienceInput | null) {
  return useQuery({
    queryKey: emergencyKeys.preview(input ?? { audience: 'parents' }),
    queryFn: () => emergencyApi.preview(input!),
    enabled: Boolean(input),
    placeholderData: keepPreviousData,
    meta: { silent: true },
  })
}

export function useEmergencyMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: emergencyKeys.all }),
  })
}
