import { z } from 'zod'

const id = z.coerce.number().int().min(1).optional().catch(undefined)
const page = z.coerce.number().int().min(1).catch(1)
const text = z.string().trim().max(100).optional().catch(undefined)
const order = z.enum(['asc', 'desc']).optional().catch(undefined)
const flag = z.boolean().optional().catch(undefined)
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .catch(undefined)
const sort = z.string().trim().max(30).optional().catch(undefined)

export const MESS_TABS = ['today', 'menu', 'skips', 'feedback'] as const
export const messSearchSchema = z.object({
  tab: z.enum(MESS_TABS).catch('today'),
  hostel_id: id,
  date,
  meal: z.enum(['breakfast', 'lunch', 'snacks', 'dinner']).optional().catch(undefined),
  page,
})
export type MessSearch = z.infer<typeof messSearchSchema>

export const HEALTH_TABS = ['logs', 'sick_bay', 'medications'] as const
export const healthSearchSchema = z.object({
  tab: z.enum(HEALTH_TABS).catch('logs'),
  page,
  search: text,
  hostel_id: id,
  status: z.enum(['open', 'closed']).optional().catch(undefined),
  kind: z.enum(['illness', 'injury', 'checkup', 'sick_bay', 'other']).optional().catch(undefined),
  date,
  log: id,
  sort,
  order,
})
export type HealthSearch = z.infer<typeof healthSearchSchema>

export const laundrySearchSchema = z.object({
  page,
  hostel_id: id,
  status: z.enum(['collected', 'sent', 'returned', 'closed']).optional().catch(undefined),
  batch: id,
  missing: flag,
})
export type LaundrySearch = z.infer<typeof laundrySearchSchema>

export const DUTY_TABS = ['today', 'roster', 'shifts', 'swaps', 'rounds', 'report'] as const
export const dutySearchSchema = z.object({
  tab: z.enum(DUTY_TABS).catch('today'),
  hostel_id: id,
  from: date,
  to: date,
  date,
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).optional().catch(undefined),
  page,
})
export type DutySearch = z.infer<typeof dutySearchSchema>

export const STUDY_TABS = ['today', 'schedules', 'halls', 'report'] as const
export const studySearchSchema = z.object({
  tab: z.enum(STUDY_TABS).catch('today'),
  hostel_id: id,
  schedule_id: id,
  hall: id,
  date,
  from: date,
  to: date,
  page,
  search: text,
  sort,
  order,
})
export type StudySearch = z.infer<typeof studySearchSchema>

export const lockersSearchSchema = z.object({
  page,
  search: text,
  hostel_id: id,
  block_id: id,
  status: z.enum(['available', 'allotted', 'damaged', 'blocked']).optional().catch(undefined),
  available: flag,
  locker: id,
  sort,
  order,
})
export type LockersSearch = z.infer<typeof lockersSearchSchema>

export const INSPECTION_TABS = ['inspections', 'due', 'assets'] as const
export const inspectionsSearchSchema = z.object({
  tab: z.enum(INSPECTION_TABS).catch('inspections'),
  page,
  hostel_id: id,
  room_id: id,
  result: z.enum(['ok', 'issues']).optional().catch(undefined),
  condition: z.enum(['good', 'fair', 'damaged', 'missing']).optional().catch(undefined),
  from: date,
  to: date,
  inspection: id,
  sort,
  order,
})
export type InspectionsSearch = z.infer<typeof inspectionsSearchSchema>
