import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/api/client'

export type EventAudience = 'school' | 'classes'
export type EventStatus = 'draft' | 'published' | 'cancelled'
export type RsvpResponse = 'attending' | 'not_attending' | 'maybe'
export type ResponseFilter = RsvpResponse | 'no_response'

interface Ref {
  id: number
  name: string
}

export interface RsvpCounts {
  invited: number
  attending: number
  not_attending: number
  maybe: number
  no_response: number
}

export interface SchoolEvent {
  id: number
  title: string
  description: string | null
  event_date: string
  start_time: string | null
  end_time: string | null
  venue: string | null
  audience: EventAudience
  audience_label: string
  classes: Ref[]
  sections: Ref[]
  rsvp_required: boolean
  rsvp_deadline: string | null
  rsvp_open: boolean
  status: EventStatus
  published_at: string | null
  cancelled_at: string | null
  cancel_reason: string | null
  counts: RsvpCounts
  created_by: Ref
  created_at: string
}

export interface EventResponseRow {
  student: Ref
  admission_no: string
  class_section: string | null
  response: ResponseFilter
  responded_by: Ref | null
  responded_at: string | null
  parent_mobile: string | null
}

export interface EventInsights {
  this_month: number
  upcoming: number
  awaiting_replies: number
  drafts: number
  cancelled: number
}

export interface EventInput {
  title: string
  description?: string | null
  event_date: string
  start_time?: string | null
  end_time?: string | null
  venue?: string | null
  audience: EventAudience
  class_ids?: number[]
  section_ids?: number[]
  rsvp_required: boolean
  rsvp_deadline?: string | null
  publish?: boolean
}

export interface EventListParams {
  page: number
  limit: number
  search?: string
  from?: string
  to?: string
  status?: EventStatus
  class_id?: number
  upcoming?: boolean
  sort?: string
  order?: 'asc' | 'desc'
}

export interface ResponseParams {
  page: number
  limit: number
  response?: ResponseFilter
  class_id?: number
  search?: string
}

export const eventKeys = {
  all: ['events'] as const,
  list: (params: EventListParams) => [...eventKeys.all, 'list', params] as const,
  insights: () => [...eventKeys.all, 'insights'] as const,
  detail: (id: number) => [...eventKeys.all, 'detail', id] as const,
  responses: (id: number, params: ResponseParams) =>
    [...eventKeys.all, 'responses', id, params] as const,
}

export const eventsApi = {
  list: (params: EventListParams) =>
    api.get<Paginated<SchoolEvent>>('/admin/events', { ...params }),
  insights: () => api.get<EventInsights>('/admin/events/insights'),
  detail: (id: number) => api.get<SchoolEvent>(`/admin/events/${id}`),
  responses: (id: number, params: ResponseParams) =>
    api.get<Paginated<EventResponseRow>>(`/admin/events/${id}/responses`, { ...params }),
  create: (input: EventInput) => api.post<SchoolEvent>('/admin/events', input),
  update: (id: number, input: EventInput) => api.patch<SchoolEvent>(`/admin/events/${id}`, input),
  publish: (id: number) => api.post<SchoolEvent>(`/admin/events/${id}/publish`, {}),
  cancel: (id: number, reason: string | null) =>
    api.post<SchoolEvent>(`/admin/events/${id}/cancel`, { reason }),
  remove: (id: number) => api.delete<null>(`/admin/events/${id}`),
}

export function useEvents(params: EventListParams, enabled = true) {
  return useQuery({
    queryKey: eventKeys.list(params),
    queryFn: () => eventsApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useEventInsights() {
  return useQuery({ queryKey: eventKeys.insights(), queryFn: eventsApi.insights })
}

export function useEvent(id: number | null) {
  return useQuery({
    queryKey: eventKeys.detail(id ?? 0),
    queryFn: () => eventsApi.detail(id ?? 0),
    enabled: Boolean(id),
  })
}

export function useEventResponses(id: number | null, params: ResponseParams) {
  return useQuery({
    queryKey: eventKeys.responses(id ?? 0, params),
    queryFn: () => eventsApi.responses(id ?? 0, params),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  })
}

export function useEventAction<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventKeys.all }),
  })
}
