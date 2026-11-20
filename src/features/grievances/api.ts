import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/api/client'

export type GrievanceCategory =
  | 'transport'
  | 'academics'
  | 'safety_bullying'
  | 'fees_billing'
  | 'facilities'
  | 'staff_conduct'
  | 'workplace_staff'
  | 'other'

export type GrievancePriority = 'low' | 'medium' | 'high' | 'critical'

export type GrievanceStatus =
  | 'submitted'
  | 'acknowledged'
  | 'in_progress'
  | 'action_taken'
  | 'resolved'
  | 'reopened'
  | 'closed'
  | 'escalated'

export type ComplainantType = 'parent' | 'staff' | 'student' | 'anonymous'

export interface Ref {
  id: number
  name: string
  role?: string
}

export interface GrievanceTimelineItem {
  id: number
  actor_name: string | null
  actor_role: string | null
  action: string
  from_status: GrievanceStatus | null
  to_status: GrievanceStatus | null
  message: string
  is_internal: boolean
  created_at: string
}

export interface GrievanceAttachment {
  id: number
  file_name: string
  file_url: string
  file_size?: number
  mime_type?: string
  is_internal: boolean
  uploaded_at: string
}

export interface GrievanceListItem {
  id: number
  ticket_no: string
  school_id: number
  complainant_type: ComplainantType
  complainant_name: string | null
  complainant_mobile: string | null
  student_id: number | null
  student_name: string | null
  student_admission_no: string | null
  class_section: string | null
  category: GrievanceCategory
  subcategory: string | null
  priority: GrievancePriority
  is_anonymous: boolean
  subject: string
  description: string
  status: GrievanceStatus
  assigned_to: Ref | null
  assigned_at: string | null
  sla_due_at: string
  is_sla_breached: boolean
  escalated_at: string | null
  escalation_reason: string | null
  resolution_summary: string | null
  resolved_at: string | null
  satisfaction_rating: number | null
  created_at: string
  updated_at: string
}

export interface GrievanceDetail extends GrievanceListItem {
  timeline: GrievanceTimelineItem[]
  attachments: GrievanceAttachment[]
  linked_entity_type?: string | null
  linked_entity_id?: number | null
  linked_entity_label?: string | null
  internal_notes: GrievanceTimelineItem[]
}

export interface GrievanceInsights {
  total_open: number
  sla_breached: number
  in_progress: number
  resolved_this_month: number
  avg_resolution_hours: number | null
  by_category: Record<GrievanceCategory, number>
}

export interface GrievanceListParams {
  page: number
  limit: number
  search?: string
  status?: GrievanceStatus
  category?: GrievanceCategory
  priority?: GrievancePriority
  assigned_to?: number
  sla_breached?: boolean
  sort?: string
  order?: 'asc' | 'desc'
}

export interface CreateGrievanceInput {
  complainant_type: ComplainantType
  complainant_name?: string | null
  complainant_mobile?: string | null
  student_id?: number | null
  category: GrievanceCategory
  subcategory?: string | null
  priority: GrievancePriority
  is_anonymous?: boolean
  subject: string
  description: string
  assigned_to_user_id?: number | null
  sla_hours?: number
  linked_entity_type?: string | null
  linked_entity_id?: number | null
}

export interface AssignGrievanceInput {
  assigned_to_user_id: number
  note?: string
}

export interface UpdateStatusInput {
  status: GrievanceStatus
  note?: string
}

export interface AddGrievanceNoteInput {
  note: string
  is_internal?: boolean
}

export interface ResolveGrievanceInput {
  resolution_summary: string
  notify_complainant?: boolean
}

export interface EscalateGrievanceInput {
  reason: string
}

export const grievanceKeys = {
  all: ['grievances'] as const,
  list: (params: GrievanceListParams) => [...grievanceKeys.all, 'list', params] as const,
  insights: () => [...grievanceKeys.all, 'insights'] as const,
  detail: (id: number) => [...grievanceKeys.all, 'detail', id] as const,
}

export const grievancesApi = {
  list: (params: GrievanceListParams) =>
    api.get<Paginated<GrievanceListItem>>('/admin/grievances', { ...params }),
  insights: () => api.get<GrievanceInsights>('/admin/grievances/insights'),
  detail: (id: number) => api.get<GrievanceDetail>(`/admin/grievances/${id}`),
  create: (input: CreateGrievanceInput) => api.post<GrievanceDetail>('/admin/grievances', input),
  assign: (id: number, input: AssignGrievanceInput) =>
    api.patch<GrievanceDetail>(`/admin/grievances/${id}/assign`, input),
  status: (id: number, input: UpdateStatusInput) =>
    api.patch<GrievanceDetail>(`/admin/grievances/${id}/status`, input),
  addNote: (id: number, input: AddGrievanceNoteInput) =>
    api.post<GrievanceTimelineItem>(`/admin/grievances/${id}/notes`, input),
  resolve: (id: number, input: ResolveGrievanceInput) =>
    api.post<GrievanceDetail>(`/admin/grievances/${id}/resolve`, input),
  escalate: (id: number, input: EscalateGrievanceInput) =>
    api.post<GrievanceDetail>(`/admin/grievances/${id}/escalate`, input),
}

export function useGrievances(params: GrievanceListParams, enabled = true) {
  return useQuery({
    queryKey: grievanceKeys.list(params),
    queryFn: () => grievancesApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useGrievanceInsights() {
  return useQuery({
    queryKey: grievanceKeys.insights(),
    queryFn: grievancesApi.insights,
  })
}

export function useGrievance(id: number | null) {
  return useQuery({
    queryKey: grievanceKeys.detail(id ?? 0),
    queryFn: () => grievancesApi.detail(id ?? 0),
    enabled: Boolean(id),
  })
}

export function useGrievanceAction<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: grievanceKeys.all }),
  })
}
