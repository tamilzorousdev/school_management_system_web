import { z } from 'zod'

const id = z.coerce.number().int().min(1).optional().catch(undefined)

export const officeSearchSchema = z.object({
  wing: id,
  class: id,
  section: id,
  page: z.coerce.number().int().min(1).catch(1),
  search: z.string().trim().max(80).optional().catch(undefined),
  filter: z.enum(['all', 'absent_today', 'fee_due', 'low_attendance']).optional().catch(undefined),
  sort: z
    .enum(['roll_no', 'name', 'attendance', 'fee_due', 'last_exam'])
    .optional()
    .catch(undefined),
  order: z.enum(['asc', 'desc']).optional().catch(undefined),
})

export type OfficeSearch = z.infer<typeof officeSearchSchema>

export const STUDENT_TABS = ['overview', 'timeline', 'exams', 'documents', 'health'] as const
export type StudentTab = (typeof STUDENT_TABS)[number]

export const student360SearchSchema = z.object({
  tab: z.enum(STUDENT_TABS).catch('overview'),
  type: z
    .enum([
      'admission',
      'enrolment',
      'attendance',
      'leave',
      'fee_invoice',
      'fee_payment',
      'exam',
      'gate',
      'behaviour',
      'achievement',
      'transport',
      'document',
      'library',
    ])
    .optional()
    .catch(undefined),
})

export type Student360Search = z.infer<typeof student360SearchSchema>

export const monitorSearchSchema = z.object({ ao: id })

export type MonitorSearch = z.infer<typeof monitorSearchSchema>
