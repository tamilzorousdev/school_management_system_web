import { useQuery } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/api/client'
import type { UploadedFile } from '@/lib/files'
import type { DiarySubmission, DiaryType } from '@/features/diary/api'

export type AppParty = 'parent' | 'teacher'

interface Ref {
  id: number
  name: string
}

export interface DiaryFeedItem {
  id: number
  type: DiaryType
  title: string
  body: string
  due_date: string | null
  subject: Ref | null
  teacher: Ref
  attachments: UploadedFile[]
  published_at: string
  seen: boolean
  seen_at: string | null
  submission?: DiarySubmission | null
}

export interface PreviewMessage {
  id: number
  thread_id: number
  sender: Ref
  sender_party: AppParty
  body: string | null
  file: UploadedFile | null
  sent_at: string
  read_at: string | null
  held_for_office_hours: boolean
  hidden: boolean
}

export interface MessagesPage {
  items: PreviewMessage[]
  has_more: boolean
}

export interface MyAnnouncement {
  id: number
  title: string
  body: string
  priority: 'normal' | 'urgent'
  school: Ref
  attachments: UploadedFile[]
  published_at: string
  expires_at: string | null
  is_read: boolean
  read_at: string | null
}

export type ConnectPath = 'diary' | 'meetings' | 'chat' | 'announcements'

const keys = {
  all: ['app-preview'] as const,
  list: (base: string, path: ConnectPath, params: object) =>
    [...keys.all, base, path, params] as const,
  messages: (base: string, threadId: number) => [...keys.all, base, 'messages', threadId] as const,
}

export function usePreviewList<T>(
  base: string,
  path: ConnectPath,
  params: Record<string, string | number | boolean | undefined>
) {
  return useQuery({
    queryKey: keys.list(base, path, params),
    queryFn: () => api.get<Paginated<T>>(`${base}/${path}`, params),
  })
}

export function usePreviewMessages(base: string, threadId: number) {
  return useQuery({
    queryKey: keys.messages(base, threadId),
    queryFn: () => api.get<MessagesPage>(`${base}/chat/${threadId}/messages`, { limit: 50 }),
  })
}
