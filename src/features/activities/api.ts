import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/api/client'
import type { Achievement, AchievementLevel } from '@/features/students/records-api'

export interface ActivityStudent {
  id: number
  name: string
  admission_no: string
  section: string | null
  photo_file_id: number | null
}

export interface SchoolAchievement extends Achievement {
  student: ActivityStudent
}

export interface LeaderboardRow {
  rank: number
  student: ActivityStudent
  points: number
  achievements: number
  wins: number
  podiums: number
  outside_events: number
  best_level: AchievementLevel
}

export interface SportsOnDutyStudent {
  id: number
  name: string
  admission_no: string
  section_name: string | null
}

export interface SportsOnDuty {
  id: number
  student: SportsOnDutyStudent
  sport_name: string
  title: string
  from_date: string
  to_date: string
  session: string | null
  venue: string | null
  notes: string | null
  created_at: string
}

export interface CreateSportsOnDutyInput {
  student_ids: number[]
  sport_name: string
  title: string
  from_date: string
  to_date: string
  session?: 'morning' | 'afternoon' | null
  venue?: string | null
  notes?: string | null
}

export interface SportsOnDutyParams {
  [key: string]: string | number | boolean | undefined | null
  date?: string
  search?: string
  student_id?: number
  class_id?: number
  section_id?: number
}

export interface Leaderboard {
  from: string
  to: string
  rows: LeaderboardRow[]
}

export interface ActivityInsights {
  total: number
  sports: number
  wins: number
  outside_events: number
  district_or_above: number
  students: number
}

export interface ActivityFilter {
  category?: string
  class_id?: number
  section_id?: number
}

export interface ActivityListParams extends ActivityFilter {
  page?: number
  limit?: number
  search?: string
  level?: string
  result?: string
  event_scope?: string
  venue_type?: string
  participation?: string
  district_or_above?: boolean
  outside_school?: boolean
}

export const activityKeys = {
  all: ['activities'] as const,
  list: (params: ActivityListParams) => [...activityKeys.all, 'list', params] as const,
  insights: (params: ActivityFilter) => [...activityKeys.all, 'insights', params] as const,
  leaderboard: (params: ActivityFilter & { limit?: number }) =>
    [...activityKeys.all, 'leaderboard', params] as const,
  onDuty: (params?: SportsOnDutyParams) => [...activityKeys.all, 'on-duty', params] as const,
}

export const activitiesApi = {
  list: (params: ActivityListParams) =>
    api.get<Paginated<SchoolAchievement>>('/admin/achievements', { ...params }),
  insights: (params: ActivityFilter) =>
    api.get<ActivityInsights>('/admin/achievements/insights', { ...params }),
  leaderboard: (params: ActivityFilter & { limit?: number }) =>
    api.get<Leaderboard>('/admin/achievements/leaderboard', { ...params }),
  listOnDuty: (params?: SportsOnDutyParams) =>
    api.get<SportsOnDuty[]>('/admin/sports-on-duty', params),
  createOnDuty: (input: CreateSportsOnDutyInput) =>
    api.post<SportsOnDuty[]>('/admin/sports-on-duty', input),
  removeOnDuty: (id: number) => api.delete<{ message: string }>(`/admin/sports-on-duty/${id}`),
}

export function useActivityList(params: ActivityListParams) {
  return useQuery({
    queryKey: activityKeys.list(params),
    queryFn: () => activitiesApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useActivityInsights(params: ActivityFilter) {
  return useQuery({
    queryKey: activityKeys.insights(params),
    queryFn: () => activitiesApi.insights(params),
    placeholderData: keepPreviousData,
  })
}

export function useLeaderboard(params: ActivityFilter & { limit?: number }, enabled = true) {
  return useQuery({
    queryKey: activityKeys.leaderboard(params),
    queryFn: () => activitiesApi.leaderboard(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useSportsOnDutyList(params?: SportsOnDutyParams) {
  return useQuery({
    queryKey: activityKeys.onDuty(params),
    queryFn: () => activitiesApi.listOnDuty(params),
  })
}

export function useSportsOnDutyMutation<TInput, TOutput>(
  mutationFn: (input: TInput) => Promise<TOutput>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: activityKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
  })
}
