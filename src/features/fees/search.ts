import { z } from 'zod'

export const FEE_TABS = ['dues', 'plans', 'payments', 'transport'] as const
export type FeeTab = (typeof FEE_TABS)[number]

const INVOICE_STATUSES = ['unpaid', 'partly_paid', 'paid', 'cancelled'] as const
const PAYMENT_MODES = ['cash', 'upi', 'card', 'bank_transfer', 'cheque'] as const
const DATE = /^\d{4}-\d{2}-\d{2}$/

export const feesSearchSchema = z.object({
  tab: z.enum(FEE_TABS).catch('dues'),
  search: z.string().optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
  status: z.enum(INVOICE_STATUSES).optional().catch(undefined),
  class_id: z.coerce.number().int().min(1).optional().catch(undefined),
  section_id: z.coerce.number().int().min(1).optional().catch(undefined),
  installment: z.string().optional().catch(undefined),
  overdue: z.boolean().optional().catch(undefined),
  sort: z.string().optional().catch(undefined),
  order: z.enum(['asc', 'desc']).optional().catch(undefined),
  invoice_id: z.coerce.number().int().min(1).optional().catch(undefined),
  plan_class_id: z.coerce.number().int().min(1).optional().catch(undefined),
  from: z.string().regex(DATE).optional().catch(undefined),
  to: z.string().regex(DATE).optional().catch(undefined),
  mode: z.enum(PAYMENT_MODES).optional().catch(undefined),
  route_id: z.coerce.number().int().min(1).optional().catch(undefined),
  stop_id: z.coerce.number().int().min(1).optional().catch(undefined),
  bus_status: z.enum(['paid', 'pending', 'overdue', 'not_billed']).optional().catch(undefined),
})

export type FeesSearch = z.infer<typeof feesSearchSchema>
