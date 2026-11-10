import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/api/client'

export type MeetingStatus =
  'scheduled' | 'in_progress' | 'time_exceeded' | 'completed' | 'missed' | 'cancelled'
export type MeetingParty = 'teacher' | 'parent'
export type MeetingWhen = 'today' | 'upcoming' | 'past'

export interface MeetingPerson {
  id: number
  name: string
  role: MeetingParty
  label: string | null
}

export type MeetingResponse = 'pending' | 'accepted' | 'declined'

export interface Meeting {
  id: number
  title: string
  agenda: string | null
  status: MeetingStatus
  response: MeetingResponse
  responded_at: string | null
  response_note: string | null
  scheduled_at: string
  ends_at: string
  duration_minutes: number
  extended_minutes: number
  extended_at: string | null
  extended_by: { id: number; name: string } | null
  academic_year: { id: number; name: string }
  host_id: number
  scheduled_by: MeetingParty
  from: MeetingPerson
  to: MeetingPerson
  teacher: MeetingPerson
  parent: MeetingPerson
  student: { id: number; name: string; class_section: string | null }
  can_join: boolean
  join_opens_at: string
  join_closes_at: string | null
  started_at: string | null
  ended_at: string | null
  call_minutes: number | null
  ended_by: { id: number; name: string } | null
  end_reason: 'host_ended' | 'empty' | null
  cancelled_by: { id: number; name: string } | null
  cancel_reason: string | null
  created_at: string
}

export interface MeetingCallLog {
  user: { id: number; name: string }
  party: MeetingParty
  platform: string
  source: 'app' | 'agora'
  leave_reason: string | null
  joined_at: string
  left_at: string | null
  minutes: number | null
}

export interface MeetingDetail extends Meeting {
  call_log: MeetingCallLog[]
}

export interface MeetingInsights {
  total: number
  today: number
  upcoming: number
  live: number
  time_exceeded: number
  completed: number
  missed: number
  cancelled: number
}

export interface MeetingListParams {
  page: number
  limit: number
  search?: string
  status?: MeetingStatus
  when?: MeetingWhen
  scheduled_by?: MeetingParty
  guardian_id?: number
  student_id?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export const meetingKeys = {
  all: ['meetings'] as const,
  list: (params: MeetingListParams) => [...meetingKeys.all, 'list', params] as const,
  insights: () => [...meetingKeys.all, 'insights'] as const,
  detail: (id: number) => [...meetingKeys.all, 'detail', id] as const,
}

export const meetingsApi = {
  list: (params: MeetingListParams) =>
    api.get<Paginated<Meeting>>('/admin/meetings', { ...params }),
  insights: () => api.get<MeetingInsights>('/admin/meetings/insights'),
  detail: (id: number) => api.get<MeetingDetail>(`/admin/meetings/${id}`),
}

export function useMeetings(params: MeetingListParams, enabled = true) {
  return useQuery({
    queryKey: meetingKeys.list(params),
    queryFn: () => meetingsApi.list(params),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
    enabled,
  })
}

export function useMeetingInsights() {
  return useQuery({
    queryKey: meetingKeys.insights(),
    queryFn: meetingsApi.insights,
    refetchInterval: 30_000,
  })
}

export function useMeeting(id: number | null) {
  return useQuery({
    queryKey: meetingKeys.detail(id ?? 0),
    queryFn: () => meetingsApi.detail(id ?? 0),
    enabled: Boolean(id),
  })
}
