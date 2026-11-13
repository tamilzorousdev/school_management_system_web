import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/api/client'
import type { UploadedFile } from '@/lib/files'

export type ChatParty = 'teacher' | 'parent'

interface Ref {
  id: number
  name: string
}

export interface ChatPerson extends Ref {
  role: ChatParty
  label: string | null
}

export interface ChatMember {
  id: number
  user_id: number
  name: string
  role: string
  is_creator: boolean
  joined_at: string
}

export interface ChatDirectoryUser {
  id: number
  name: string
  role: string
  label?: string
}

export interface ChatThread {
  id: number
  is_group?: boolean
  title?: string | null
  member_count?: number
  members?: ChatMember[]
  teacher: ChatPerson | null
  parent: ChatPerson | null
  other: ChatPerson | null
  student: Ref | null
  class_section: string | null
  last_message_at: string | null
  last_message_preview: string | null
  unread: number
  message_count: number
  open_flags: number
  office_hours?: { start: string; end: string; open_now: boolean; next_open_at: string | null }
  academic_year: Ref
  archived: boolean
}

export interface AuditMessage {
  id: number
  thread_id: number
  sender: Ref
  sender_party: ChatParty
  body: string | null
  file: UploadedFile | null
  sent_at: string
  read_at: string | null
  held_for_office_hours: boolean
  flagged: boolean
  hidden: boolean
  original_body: string | null
  flag_reason: string | null
  flagged_by: Ref | null
  flagged_at: string | null
  flag_resolved_at: string | null
  hidden_by: Ref | null
  hidden_reason: string | null
  kind: 'text' | 'image' | 'file' | 'voice' | 'video'
  duration_seconds: number | null
  edited: boolean
  edited_at: string | null
  deleted: boolean
  deleted_at: string | null
  deleted_by: Ref | null
  deleted_for_me_by: Ref[]
}

export interface ChatAuditEntry {
  actor: Ref
  action: string
  message_id: number | null
  note: string | null
  at: string
}

export interface AuditThreadDetail extends ChatThread {
  messages: AuditMessage[]
  audit: ChatAuditEntry[]
}

export interface ChatInsights {
  threads: number
  active_today: number
  messages_today: number
  open_flags: number
  hidden: number
  held: number
}

export interface ChatThreadParams {
  page: number
  limit: number
  search?: string
  flagged?: boolean
  academic_year_id?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export const chatKeys = {
  all: ['chat-audit'] as const,
  threads: (params: ChatThreadParams) => [...chatKeys.all, 'threads', params] as const,
  insights: () => [...chatKeys.all, 'insights'] as const,
  thread: (id: number) => [...chatKeys.all, 'thread', id] as const,
}

export const chatApi = {
  threads: (params: ChatThreadParams) =>
    api.get<Paginated<ChatThread>>('/admin/chat/threads', { ...params }),
  insights: () => api.get<ChatInsights>('/admin/chat/insights'),
  thread: (id: number) => api.get<AuditThreadDetail>(`/admin/chat/threads/${id}`),
  hide: (id: number, reason: string) =>
    api.post<AuditMessage>(`/admin/chat/messages/${id}/hide`, { reason }),
  unhide: (id: number) => api.post<AuditMessage>(`/admin/chat/messages/${id}/unhide`),
  dismiss: (id: number) => api.post<AuditMessage>(`/admin/chat/messages/${id}/dismiss-flag`),
  createGroup: (dto: { name: string; member_user_ids: number[] }) =>
    api.post<ChatThread>('/admin/chat/groups', dto),
  addMembers: (id: number, dto: { user_ids: number[] }) =>
    api.post<ChatMember[]>(`/admin/chat/groups/${id}/members`, dto),
  members: (id: number) => api.get<ChatMember[]>(`/admin/chat/groups/${id}/members`),
  directory: (search?: string) =>
    api.get<ChatDirectoryUser[]>('/admin/chat/directory', { search }),
}

export function useChatThreads(params: ChatThreadParams) {
  return useQuery({
    queryKey: chatKeys.threads(params),
    queryFn: () => chatApi.threads(params),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  })
}

export function useChatInsights() {
  return useQuery({
    queryKey: chatKeys.insights(),
    queryFn: chatApi.insights,
    refetchInterval: 30_000,
  })
}

export function useChatThread(id: number | null) {
  return useQuery({
    queryKey: chatKeys.thread(id ?? 0),
    queryFn: () => chatApi.thread(id ?? 0),
    enabled: Boolean(id),
    staleTime: 60_000,
  })
}

export function useChatAction<TInput>(fn: (input: TInput) => Promise<AuditMessage>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.all }),
  })
}

export function useChatDirectory(search?: string) {
  return useQuery({
    queryKey: ['chat-directory', search],
    queryFn: () => chatApi.directory(search),
    staleTime: 60_000,
  })
}

export function useCreateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: chatApi.createGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.all }),
  })
}

export function useAddGroupMembers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ threadId, userIds }: { threadId: number; userIds: number[] }) =>
      chatApi.addMembers(threadId, { user_ids: userIds }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.all }),
  })
}
