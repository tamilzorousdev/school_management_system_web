import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/api/client'

export type Channel = 'in_app' | 'push' | 'sms'
export type NotificationStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'skipped'
export type NotificationCategory =
  | 'system'
  | 'account'
  | 'attendance'
  | 'transport'
  | 'diary'
  | 'chat'
  | 'meeting'
  | 'alert'
  | 'fees'
  | 'announcement'
  | 'approval'
  | 'library'

export interface MyNotification {
  id: number
  category: NotificationCategory
  template_code: string | null
  title: string
  body: string
  data: Record<string, string>
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface OutboxItem {
  id: number
  channel: Channel
  category: NotificationCategory
  template_code: string | null
  title: string
  body: string
  status: NotificationStatus
  recipient: string | null
  provider: string | null
  error: string | null
  attempts: number
  sent_at: string | null
  created_at: string
  user: { id: number; name: string; mobile: string } | null
}

export interface OutboxInsights {
  last_24h: number
  push: Record<string, number>
  sms: Record<string, number>
  unread_in_app: number
}

export interface OutboxParams {
  page: number
  limit: number
  search?: string
  channel?: Channel
  status?: NotificationStatus
  sort?: string
  order?: 'asc' | 'desc'
}

export const notificationKeys = {
  all: ['notifications'] as const,
  mine: () => [...notificationKeys.all, 'mine'] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
  outbox: (params: OutboxParams) => [...notificationKeys.all, 'outbox', params] as const,
  insights: () => [...notificationKeys.all, 'insights'] as const,
}

export const notificationsApi = {
  mine: () => api.get<Paginated<MyNotification>>('/me/notifications', { page: 1, limit: 8 }),
  unread: () => api.get<{ unread: number }>('/me/notifications/unread-count'),
  markRead: (id: number) => api.patch<MyNotification>(`/me/notifications/${id}/read`),
  markAllRead: () => api.post<{ updated: number }>('/me/notifications/read-all'),
  outbox: (params: OutboxParams) =>
    api.get<Paginated<OutboxItem>>('/admin/notifications', { ...params }),
  insights: () => api.get<OutboxInsights>('/admin/notifications/insights'),
  sendTest: (userId: number) =>
    api.post<{ batch_id: string; recipients: number }>('/admin/notifications/test', {
      user_id: userId,
    }),
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: notificationsApi.unread,
    refetchInterval: 30_000,
    meta: { silent: true },
  })
}

export function useMyNotifications(enabled: boolean) {
  return useQuery({
    queryKey: notificationKeys.mine(),
    queryFn: notificationsApi.mine,
    enabled,
    meta: { silent: true },
  })
}

export function useMarkAllRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}

export function useMarkRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationsApi.markRead,
    meta: { silent: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}

export function useOutbox(params: OutboxParams) {
  return useQuery({
    queryKey: notificationKeys.outbox(params),
    queryFn: () => notificationsApi.outbox(params),
    placeholderData: keepPreviousData,
    refetchInterval: 15_000,
  })
}

export function useOutboxInsights() {
  return useQuery({
    queryKey: notificationKeys.insights(),
    queryFn: notificationsApi.insights,
    refetchInterval: 15_000,
  })
}

export function useSendTest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationsApi.sendTest,
    meta: { silent: true },
    onSuccess: () => {
      window.setTimeout(
        () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
        1200
      )
    },
  })
}
