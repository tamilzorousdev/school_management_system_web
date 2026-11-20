import { z } from 'zod'

const page = z.coerce.number().int().min(1).catch(1)
const text = z.string().trim().max(100).optional().catch(undefined)
const id = z.coerce.number().int().min(1).optional().catch(undefined)
const flag = z.boolean().optional().catch(undefined)
const order = z.enum(['asc', 'desc']).optional().catch(undefined)

export const staffSearchSchema = z.object({
  page,
  search: text,
  sort: z
    .enum(['name', 'employee_no', 'joining_date', 'designation', 'created_at'])
    .optional()
    .catch(undefined),
  order,
  staff_type: z.enum(['teaching', 'non_teaching']).optional().catch(undefined),
  status: z.enum(['active', 'on_leave', 'resigned']).optional().catch(undefined),
  role: z
    .enum([
      'PRINCIPAL',
      'AO',
      'HOD',
      'TEACHER',
      'TRANSPORT_INCHARGE',
      'DRIVER',
      'ATTENDANT',
      'ADMIN',
    ])
    .optional()
    .catch(undefined),
  class_teacher: flag,
  needs_attention: flag,
  overloaded: flag,
  department: z.string().trim().max(60).optional().catch(undefined),
})

export const STAFF_PROFILE_TABS = [
  'profile',
  'classes',
  'documents',
  'bank',
  'library',
  'assets',
] as const
export type StaffProfileTab = (typeof STAFF_PROFILE_TABS)[number]

export const staffProfileSearchSchema = z.object({
  tab: z.enum(STAFF_PROFILE_TABS).catch('profile'),
})

export const assignmentsSearchSchema = z.object({
  class_id: id,
})

export const APPRAISAL_STATUSES = ['draft', 'submitted', 'reviewed', 'appealed', 'finalized'] as const
export type AppraisalStatus = (typeof APPRAISAL_STATUSES)[number]

export const OVERALL_RATINGS = [
  'outstanding',
  'exceeds_expectations',
  'meets_expectations',
  'needs_improvement',
  'unsatisfactory',
] as const
export type OverallRating = (typeof OVERALL_RATINGS)[number]

export const appraisalsSearchSchema = z.object({
  page,
  search: text,
  status: z.enum(APPRAISAL_STATUSES).optional().catch(undefined),
  rating: z.enum(OVERALL_RATINGS).optional().catch(undefined),
  academic_year_id: id,
  staff_id: id,
  sort: z.enum(['review_date', 'created_at']).optional().catch(undefined),
  order: z.enum(['asc', 'desc']).optional().catch(undefined),
  appraisal: id,
})

export type StaffSearch = z.infer<typeof staffSearchSchema>
export type StaffProfileSearch = z.infer<typeof staffProfileSearchSchema>
export type AssignmentsSearch = z.infer<typeof assignmentsSearchSchema>
export type AppraisalsSearch = z.infer<typeof appraisalsSearchSchema>
