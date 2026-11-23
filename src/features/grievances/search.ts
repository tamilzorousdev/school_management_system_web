import { z } from 'zod'

export const grievancesSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  search: z.string().trim().max(100).optional().catch(undefined),
  status: z
    .enum([
      'submitted',
      'acknowledged',
      'in_progress',
      'action_taken',
      'resolved',
      'reopened',
      'closed',
      'escalated',
    ])
    .optional()
    .catch(undefined),
  category: z
    .enum([
      'transport',
      'academics',
      'safety_bullying',
      'fees_billing',
      'facilities',
      'staff_conduct',
      'workplace_staff',
      'other',
    ])
    .optional()
    .catch(undefined),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional().catch(undefined),
  assigned_to: z.coerce.number().int().min(1).optional().catch(undefined),
  sla_breached: z.boolean().optional().catch(undefined),
  sort: z.enum(['created_at', 'sla_due_at', 'priority', 'ticket_no']).optional().catch(undefined),
  order: z.enum(['asc', 'desc']).optional().catch(undefined),
  grievance: z.coerce.number().int().min(1).optional().catch(undefined),
})

export type GrievancesSearch = z.infer<typeof grievancesSearchSchema>
