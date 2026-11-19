import { z } from 'zod'

const page = z.coerce.number().int().min(1).catch(1)
const text = z.string().trim().max(100).optional().catch(undefined)
const id = z.coerce.number().int().min(1).optional().catch(undefined)
const flag = z.boolean().optional().catch(undefined)
const order = z.enum(['asc', 'desc']).optional().catch(undefined)

export const studentsSearchSchema = z.object({
  page,
  search: text,
  class_id: id,
  section_id: id,
  gender: z.enum(['male', 'female', 'other']).optional().catch(undefined),
  no_section: flag,
  has_siblings: flag,
  new_this_month: flag,
  sort: z
    .enum(['name', 'admission_no', 'admission_date', 'roll_no', 'class'])
    .optional()
    .catch(undefined),
  order,
})

export const admissionsSearchSchema = z.object({
  page,
  search: text,
  status: z.enum(['applied', 'approved', 'rejected', 'enrolled']).optional().catch(undefined),
  class_id: id,
  sort: z.enum(['created_at', 'first_name', 'status', 'class']).optional().catch(undefined),
  order,
})

export const guardiansSearchSchema = z.object({
  page,
  search: text,
  on_app: flag,
  multiple_children: flag,
  language: z.enum(['en', 'ta']).optional().catch(undefined),
  sort: z.enum(['name', 'created_at', 'last_login_at']).optional().catch(undefined),
  order,
  parent: id,
})

export const STUDENT_TABS = [
  'profile',
  'guardians',
  'documents',
  'health',
  'behaviour',
  'transport',
  'achievements',
  'results',
  'report-card',
  'fees',
  'library',
] as const
export type StudentTab = (typeof STUDENT_TABS)[number]

export const studentProfileSearchSchema = z.object({
  tab: z.enum(STUDENT_TABS).catch('profile'),
})

export type StudentsSearch = z.infer<typeof studentsSearchSchema>
export type AdmissionsSearch = z.infer<typeof admissionsSearchSchema>
export type GuardiansSearch = z.infer<typeof guardiansSearchSchema>
