import { z } from 'zod'

export const FEEDBACK_TABS = ['ranking', 'ratings', 'report', 'students'] as const
export type FeedbackTab = (typeof FEEDBACK_TABS)[number]

const id = z.coerce.number().int().min(1).optional().catch(undefined)

export const feedbackSearchSchema = z.object({
  tab: z.enum(FEEDBACK_TABS).catch('ranking'),
  page: z.coerce.number().int().min(1).catch(1),
  search: z.string().trim().max(80).optional().catch(undefined),
  teacher_user_id: id,
  behaviour: z.enum(['good', 'bad']).optional().catch(undefined),
  low: z.coerce.boolean().optional().catch(undefined),
  exam_id: id,
  section_id: id,
})

export type FeedbackSearch = z.infer<typeof feedbackSearchSchema>
