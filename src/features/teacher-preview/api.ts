import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

interface Ref {
  id: number
  name: string
}

export type PeriodKind = 'class' | 'substitute' | 'free' | 'break'

export interface TodayPeriod {
  period_no: number | null
  name: string
  start_time: string
  end_time: string
  is_break: boolean
  kind: PeriodKind
  section: Ref | null
  subject: (Ref & { code: string }) | null
  room: string | null
  students: number
  present: number | null
  attendance_marked: boolean
  is_now: boolean
}

export interface TodayTimetable {
  date: string
  day_of_week: number
  day_name: string
  working_day: boolean
  holiday: string | null
  my_periods: number
  periods: TodayPeriod[]
}

export interface TeacherClass {
  section_id: number
  class_name: string
  section_name: string
  is_class_teacher: boolean
  subjects: Ref[]
  student_count: number
  room: string | null
}

export interface TeacherPreview {
  teacher: {
    staff_id: number
    user_id: number
    name: string
    designation: string
    employee_no: string
    can_sign_in: boolean
    photo_file_id?: number | null
    photo_url?: string | null
  }
  today: TodayTimetable
  classes: TeacherClass[]
  counts: {
    diary_pending: number
    meetings_upcoming: number
    chat_unread: number
    announcements_unread: number
  }
}

export const teacherBase = (staffId: number) => `/admin/staff/${staffId}/teacher-view`

export function useTeacherPreview(staffId: number) {
  return useQuery({
    queryKey: ['teacher-preview', 'home', staffId] as const,
    queryFn: () => api.get<TeacherPreview>(teacherBase(staffId)),
    enabled: staffId > 0,
  })
}
