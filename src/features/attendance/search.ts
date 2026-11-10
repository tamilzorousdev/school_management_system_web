import { z } from 'zod'

export const ATTENDANCE_TABS = ['students', 'staff', 'leave'] as const
export type AttendanceTab = (typeof ATTENDANCE_TABS)[number]

export const LEAVE_KINDS = ['student', 'staff'] as const
export type LeaveKind = (typeof LEAVE_KINDS)[number]

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .catch(undefined)

export const attendanceSearchSchema = z.object({
  tab: z.enum(ATTENDANCE_TABS).catch('students'),
  date,
  section_id: z.coerce.number().int().min(1).optional().catch(undefined),
  session: z.enum(['morning', 'afternoon']).optional().catch(undefined),
  leave: z.enum(LEAVE_KINDS).catch('student'),
  status: z
    .enum([
      'all',
      'waiting',
      'pending',
      'pending_hod',
      'pending_principal',
      'approved',
      'rejected',
      'cancelled',
    ])
    .optional()
    .catch(undefined),
  search: z.string().trim().max(100).optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
  staff_page: z.coerce.number().int().min(1).optional().catch(undefined),
  staff_search: z.string().trim().max(100).optional().catch(undefined),
  staff_status: z
    .enum(['present', 'late', 'on_leave', 'not_checked_in'])
    .optional()
    .catch(undefined),
})

export type AttendanceSearch = z.infer<typeof attendanceSearchSchema>
