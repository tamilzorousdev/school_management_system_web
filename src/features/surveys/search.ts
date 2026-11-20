import { z } from 'zod'

const id = z.coerce.number().int().min(1).optional().catch(undefined)

export const surveysSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  search: z.string().trim().max(80).optional().catch(undefined),
  status: z.enum(['open', 'scheduled', 'draft', 'closed']).catch('open'),
})

export const surveyResultsSearchSchema = z.object({
  tab: z.enum(['results', 'not_answered']).catch('results'),
  class_id: id,
  section_id: id,
  role: z.enum(['parent', 'staff']).optional().catch(undefined),
  search: z.string().trim().max(80).optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
})

export type SurveysSearch = z.infer<typeof surveysSearchSchema>
export type SurveyResultsSearch = z.infer<typeof surveyResultsSearchSchema>
