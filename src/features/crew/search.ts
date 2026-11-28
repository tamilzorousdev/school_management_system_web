import { z } from 'zod'

const page = z.coerce.number().int().min(1).catch(1)
const text = z.string().trim().max(100).optional().catch(undefined)
const id = z.coerce.number().int().min(1).optional().catch(undefined)
const flag = z.boolean().optional().catch(undefined)
const order = z.enum(['asc', 'desc']).optional().catch(undefined)

export const CREW_TABS = ['crew', 'ratings'] as const
export type CrewTab = (typeof CREW_TABS)[number]

export const crewSearchSchema = z.object({
  tab: z.enum(CREW_TABS).optional().catch(undefined),
  page,
  search: text,
  sort: z
    .enum(['name', 'employee_no', 'licence_expiry', 'joining_date', 'created_at'])
    .optional()
    .catch(undefined),
  order,
  role: z.enum(['driver', 'attendant']).optional().catch(undefined),
  duty_status: z.enum(['pending', 'approved', 'blocked']).optional().catch(undefined),
  expiry_state: z.enum(['expired', 'due_soon', 'missing']).optional().catch(undefined),
  vehicle_id: id,
  unassigned: flag,
  status: z.enum(['active', 'on_leave', 'resigned']).optional().catch(undefined),
})

export const CREW_PROFILE_TABS = ['clearance', 'profile', 'documents'] as const
export type CrewProfileTab = (typeof CREW_PROFILE_TABS)[number]

export const crewProfileSearchSchema = z.object({
  tab: z.enum(CREW_PROFILE_TABS).catch('clearance'),
})

export type CrewSearch = z.infer<typeof crewSearchSchema>
export type CrewProfileSearch = z.infer<typeof crewProfileSearchSchema>
