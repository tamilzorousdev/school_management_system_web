import { z } from 'zod'

export const PERFORMANCE_TABS = ['classes', 'below', 'special'] as const
export type PerformanceTab = (typeof PERFORMANCE_TABS)[number]

const id = z.coerce.number().int().min(1).optional().catch(undefined)

export const performanceSearchSchema = z.object({
  tab: z.enum(PERFORMANCE_TABS).catch('classes'),
  exam_id: id,
  class_id: id,
  section_id: id,
  below: z.coerce.number().min(1).max(100).optional().catch(undefined),
})

export type PerformanceSearch = z.infer<typeof performanceSearchSchema>
