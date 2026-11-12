import { z } from 'zod'

export const SETUP_TABS = [
  'profile',
  'years',
  'classes',
  'subjects',
  'holidays',
  'communication',
  'id-cards',
] as const
export type SetupTab = (typeof SETUP_TABS)[number]

export const setupSearchSchema = z.object({
  tab: z.enum(SETUP_TABS).catch('classes'),
})
