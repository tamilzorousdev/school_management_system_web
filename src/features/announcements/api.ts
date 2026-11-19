import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/api/client'
import type { UploadedFile } from '@/lib/files'

export type AnnouncementAudience = 'everyone' | 'parents' | 'staff' | 'classes' | 'individuals'
export type AnnouncementPriority = 'normal' | 'urgent'
export type AnnouncementStatus = 'draft' | 'scheduled' | 'published' | 'archived'

interface Ref {
  id: number
  name: string
}

export interface Announcement {
  id: number
  title: string
  body: string
  audience: AnnouncementAudience
  audience_label: string
  classes: Ref[]
  sections: Ref[]
  students: Ref[]
  staff: Ref[]
  priority: AnnouncementPriority
  status: AnnouncementStatus
  publish_at: string | null
  published_at: string | null
  expires_at: string | null
  attachments: UploadedFile[]
  recipient_count: number
  read_count: number
  read_percent: number
  author: Ref
  academic_year: Ref
  edited_at: string | null
  edited_by: Ref | null
  created_at: string
}

export interface AnnouncementReader {
  user: Ref
  mobile: string
  segment: 'parent' | 'staff'
  read_at: string | null
  students: Ref[]
}

export interface ReaderParams {
  page: number
  limit: number
  state?: 'read' | 'unread'
  segment?: 'parent' | 'staff'
  class_id?: number
  search?: string
}

export interface AnnouncementInsights {
  drafts: number
  scheduled: number
  published: number
  archived: number
  urgent_live: number
  average_read_percent: number
}

export interface AnnouncementInput {
  title: string
  body: string
  audience: AnnouncementAudience
  class_ids?: number[]
  section_ids?: number[]
  student_ids?: number[]
  staff_user_ids?: number[]
  file_ids?: number[]
  priority: AnnouncementPriority
  publish_at?: string | null
  expires_at?: string | null
  publish_now?: boolean
  notify_again?: boolean
}

export interface AnnouncementListParams {
  page: number
  limit: number
  search?: string
  status?: AnnouncementStatus
  audience?: AnnouncementAudience
  priority?: AnnouncementPriority
  sort?: string
  order?: 'asc' | 'desc'
}

export const announcementKeys = {
  all: ['announcements'] as const,
  list: (params: AnnouncementListParams) => [...announcementKeys.all, 'list', params] as const,
  insights: () => [...announcementKeys.all, 'insights'] as const,
  detail: (id: number) => [...announcementKeys.all, 'detail', id] as const,
  readers: (id: number, params: ReaderParams) =>
    [...announcementKeys.all, 'readers', id, params] as const,
}

export const announcementsApi = {
  list: (params: AnnouncementListParams) =>
    api.get<Paginated<Announcement>>('/admin/announcements', { ...params }),
  insights: () => api.get<AnnouncementInsights>('/admin/announcements/insights'),
  detail: (id: number) => api.get<Announcement>(`/admin/announcements/${id}`),
  readers: (id: number, params: ReaderParams) =>
    api.get<Paginated<AnnouncementReader>>(`/admin/announcements/${id}/readers`, { ...params }),
  create: (input: AnnouncementInput) => api.post<Announcement>('/admin/announcements', input),
  update: (id: number, input: AnnouncementInput) =>
    api.patch<Announcement>(`/admin/announcements/${id}`, input),
  publish: (id: number) => api.post<Announcement>(`/admin/announcements/${id}/publish`, {}),
  archive: (id: number) => api.post<Announcement>(`/admin/announcements/${id}/archive`),
  remove: (id: number) => api.delete<null>(`/admin/announcements/${id}`),
}

export function useAnnouncements(params: AnnouncementListParams) {
  return useQuery({
    queryKey: announcementKeys.list(params),
    queryFn: () => announcementsApi.list(params),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  })
}

export function useAnnouncementInsights() {
  return useQuery({ queryKey: announcementKeys.insights(), queryFn: announcementsApi.insights })
}

export function useAnnouncement(id: number | null) {
  return useQuery({
    queryKey: announcementKeys.detail(id ?? 0),
    queryFn: () => announcementsApi.detail(id ?? 0),
    enabled: Boolean(id),
  })
}

export function useAnnouncementReaders(id: number | null, params: ReaderParams) {
  return useQuery({
    queryKey: announcementKeys.readers(id ?? 0, params),
    queryFn: () => announcementsApi.readers(id ?? 0, params),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  })
}

export function useAnnouncementAction<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: announcementKeys.all }),
  })
}
