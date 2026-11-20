import { z } from 'zod'

export const quizSearchSchema = z.object({
  tab: z.enum(['all', 'pending', 'approved', 'rejected']).optional().default('all'),
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().optional().default(1),
})

export type QuizSearch = z.infer<typeof quizSearchSchema>

