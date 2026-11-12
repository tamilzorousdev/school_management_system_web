import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { config } from '@/config/env'
import { api } from '@/lib/api/client'

export interface DashboardStudents {
  total: number
  joined_this_month: number
  applications_waiting: number
  approved_not_enrolled: number
}

export interface DashboardStaff {
  total: number
  teachers: number
  need_attention: number
}

export interface StudentAttendanceToday {
  working_day: boolean
  marked_sections: number
  total_sections: number
  present: number
  absent: number
  on_leave: number
  percent: number | null
}

export interface StaffAttendanceToday {
  total: number
  checked_in: number
  late: number
  on_leave: number
  absent: number
  percent: number | null
}

export interface DashboardBuses {
  telematics_available: boolean
  total: number
  with_tracker: number
  live: number | null
  moving: number | null
  offline: number | null
}

export interface DashboardAlerts {
  open: number
  sos_open: number
  high_open: number
}

export interface DashboardFees {
  academic_year: string
  due_amount: number
  overdue_amount: number
  overdue_students: number
  todays_collection: number
}

export interface DashboardExams {
  total: number
  upcoming: number
  in_progress: number
  published: number
}

export interface Dashboard {
  date: string
  students: DashboardStudents | null
  staff: DashboardStaff | null
  attendance: { students: StudentAttendanceToday; staff: StaffAttendanceToday } | null
  buses: DashboardBuses | null
  alerts: DashboardAlerts | null
  fees: DashboardFees | null
  exams: DashboardExams | null
}

export interface YearFeeHead {
  name: string
  is_transport: boolean
  billed: number
  collected: number
  collection_percent: number | null
}

export interface YearPerformance {
  academic_year: {
    id: number
    name: string
    start_date: string
    end_date: string
    is_current: boolean
  }
  students: { enrolled: number; promoted: number; left: number } | null
  attendance: {
    percent: number | null
    days_marked: number
    below_75: number
    staff_percent: number | null
  } | null
  studies: {
    exams: number
    students: number
    average_percent: number | null
    pass_percent: number | null
    fail_percent: number | null
    absent_percent: number | null
  } | null
  activities: {
    total: number
    sports: number
    podium: number
    students: number
    points: number
    top_level: string | null
  } | null
  fees: {
    billed: number
    collected: number
    collection_percent: number | null
    heads: YearFeeHead[]
  } | null
}

export const dashboardKeys = {
  all: ['dashboard'] as const,
  overview: () => [...dashboardKeys.all, 'overview'] as const,
  yearPerformance: () => [...dashboardKeys.all, 'year-performance'] as const,
}

export const dashboardApi = {
  overview: () => api.get<Dashboard>('/admin/dashboard'),
  yearPerformance: () => api.get<{ years: YearPerformance[] }>('/admin/dashboard/year-performance'),
}

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.overview(),
    queryFn: dashboardApi.overview,
    refetchInterval: config.refreshIntervalMs * 3,
    placeholderData: keepPreviousData,
  })
}

export function useYearPerformance() {
  return useQuery({
    queryKey: dashboardKeys.yearPerformance(),
    queryFn: dashboardApi.yearPerformance,
    select: (data) => data.years,
  })
}
