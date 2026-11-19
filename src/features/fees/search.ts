import { z } from 'zod'

export const FEE_TABS = [
  'dues',
  'plans',
  'benefits',
  'payments',
  'transport',
  'online',
  'approvals',
  'fines',
  'reports',
  'audit',
] as const
export type FeeTab = (typeof FEE_TABS)[number]

const INVOICE_STATUSES = ['unpaid', 'partly_paid', 'paid', 'cancelled'] as const
const PAYMENT_MODES = [
  'cash',
  'upi',
  'card',
  'bank_transfer',
  'cheque',
  'online',
  'credit',
] as const
const PAYMENT_STATUSES = ['success', 'reversed'] as const
const AUDIT_ENTITIES = [
  'fee_head',
  'fee_plan',
  'fee_invoice',
  'fee_payment',
  'invoice_run',
  'fee_benefit',
  'benefit_award',
  'fee_request',
  'fee_refund',
  'fee_settings',
  'fee_fine',
  'fine_type',
] as const
const AUDIT_ACTIONS = [
  'created',
  'updated',
  'deleted',
  'replaced',
  'generated',
  'discounted',
  'cancelled',
  'paid',
  'reversed',
  'submitted',
  'approved',
  'rejected',
  'discarded',
  'awarded',
  'revoked',
  'requested',
  'withdrawn',
  'refunded',
  'late_fee',
] as const
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
  payment_status: z.enum(PAYMENT_STATUSES).optional().catch(undefined),
  online_status: z.enum(['created', 'paid', 'failed']).optional().catch(undefined),
  entity: z.enum(AUDIT_ENTITIES).optional().catch(undefined),
  action: z.enum(AUDIT_ACTIONS).optional().catch(undefined),
  kind: z.enum(['concession', 'scholarship']).optional().catch(undefined),
  benefit_id: z.coerce.number().int().min(1).optional().catch(undefined),
  award_status: z.enum(['active', 'revoked']).optional().catch(undefined),
  request_status: z
    .enum(['pending', 'approved', 'rejected', 'withdrawn', 'all'])
    .optional()
    .catch(undefined),
  request_kind: z
    .enum(['discount', 'cancel', 'reversal', 'refund', 'reschedule', 'write_off'])
    .optional()
    .catch(undefined),
  fine_status: z
    .enum(['pending', 'approved', 'rejected', 'withdrawn', 'all'])
    .optional()
    .catch(undefined),
  report: z
    .enum(['classes', 'heads', 'installments', 'benefits', 'defaulters', 'collections'])
    .optional()
    .catch(undefined),
  route_id: z.coerce.number().int().min(1).optional().catch(undefined),
  stop_id: z.coerce.number().int().min(1).optional().catch(undefined),
  bus_status: z.enum(['paid', 'pending', 'overdue', 'not_billed']).optional().catch(undefined),
})

export type FeesSearch = z.infer<typeof feesSearchSchema>
