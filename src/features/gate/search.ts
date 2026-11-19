import { z } from 'zod'

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .catch(undefined)
const id = z.coerce.number().int().min(1).optional().catch(undefined)

export const GATE_TABS = [
  'live',
  'passes',
  'visitors',
  'log',
  'pickups',
  'blocked',
  'reports',
  'settings',
] as const
export type GateTab = (typeof GATE_TABS)[number]

const PASS_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'released',
  'expired',
] as const
const VISIT_STATUSES = [
  'expected',
  'waiting',
  'allowed',
  'declined',
  'inside',
  'left',
  'cancelled',
] as const
const PURPOSES = [
  'meet_staff',
  'parent_meeting',
  'fee_payment',
  'admission_enquiry',
  'delivery',
  'vendor',
  'interview',
  'event',
  'other',
] as const
const EVENT_KINDS = [
  'pass_requested',
  'pass_approved',
  'pass_rejected',
  'pass_cancelled',
  'pass_expired',
  'emergency_raised',
  'emergency_escalated',
  'consent_asked',
  'consent_approved',
  'consent_rejected',
  'consent_verified',
  'pass_checked',
  'check_failed',
  'released',
  'visitor_registered',
  'visitor_invited',
  'visitor_allowed',
  'visitor_declined',
  'visitor_in',
  'visitor_out',
  'visitor_overstay',
  'blocked_person',
] as const

export const gateSearchSchema = z.object({
  tab: z.enum(GATE_TABS).catch('live'),
  page: z.coerce.number().int().min(1).catch(1),
  search: z.string().trim().max(100).optional().catch(undefined),
  from: date,
  to: date,
  status: z.enum(PASS_STATUSES).optional().catch(undefined),
  visit_status: z.enum(VISIT_STATUSES).optional().catch(undefined),
  source: z.enum(['parent', 'staff', 'office', 'gate']).optional().catch(undefined),
  method: z.enum(['qr', 'code', 'manual']).optional().catch(undefined),
  emergency: z.boolean().optional().catch(undefined),
  class_id: id,
  section_id: id,
  purpose: z.enum(PURPOSES).optional().catch(undefined),
  host_user_id: id,
  kind: z.enum(EVENT_KINDS).optional().catch(undefined),
  student_id: id,
  sort: z
    .enum(['pass_date', 'created_at', 'released_at', 'visit_date', 'checked_in_at'])
    .optional()
    .catch(undefined),
  order: z.enum(['asc', 'desc']).optional().catch(undefined),
})

export type GateSearch = z.infer<typeof gateSearchSchema>

export interface GateTabProps {
  search: GateSearch
  setSearch: (patch: Partial<GateSearch>) => void
  onPageChange: (page: number) => void
  onClear: () => void
  canManage: boolean
  canApprove: boolean
  adding: boolean
  onAddingChange: (open: boolean) => void
  goTo: (tab: GateTab, patch?: Partial<GateSearch>) => void
}
