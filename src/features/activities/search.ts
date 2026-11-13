import { z } from 'zod'

export const ACTIVITY_TABS = ['leaderboard', 'all', 'on_duty'] as const
export type ActivityTab = (typeof ACTIVITY_TABS)[number]

export const CATEGORY_FILTERS = [
  'non_academic',
  'sports',
  'arts',
  'cultural',
  'competition',
  'leadership',
  'academic',
  'other',
] as const
export type CategoryFilter = (typeof CATEGORY_FILTERS)[number]

export const QUICK_FILTERS = ['sports', 'wins', 'outside', 'high'] as const
export type QuickFilter = (typeof QUICK_FILTERS)[number]

const id = z.coerce.number().int().min(1).optional().catch(undefined)
const text = z.string().trim().max(40).optional().catch(undefined)

export const activitiesSearchSchema = z.object({
  tab: z.enum(ACTIVITY_TABS).catch('leaderboard'),
  category: z.enum(CATEGORY_FILTERS).optional().catch(undefined),
  class_id: id,
  section_id: id,
  quick: z.enum(QUICK_FILTERS).optional().catch(undefined),
  search: z.string().trim().max(100).optional().catch(undefined),
  result: text,
  event_scope: text,
  venue_type: text,
  participation: text,
  page: z.coerce.number().int().min(1).catch(1),
})

export type ActivitiesSearch = z.infer<typeof activitiesSearchSchema>
