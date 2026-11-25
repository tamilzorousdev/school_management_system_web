import { z } from 'zod'

const id = z.coerce.number().int().min(1).optional().catch(undefined)
const page = z.coerce.number().int().min(1).catch(1)
const text = z.string().trim().max(100).optional().catch(undefined)
const order = z.enum(['asc', 'desc']).optional().catch(undefined)
const flag = z.boolean().optional().catch(undefined)
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .catch(undefined)

export const hostelDashboardSearchSchema = z.object({ hostel_id: id })
export type HostelDashboardSearch = z.infer<typeof hostelDashboardSearchSchema>

export const RESIDENT_TABS = ['residents', 'applications', 'checkouts'] as const
export type ResidentTab = (typeof RESIDENT_TABS)[number]

export const residentsSearchSchema = z.object({
  tab: z.enum(RESIDENT_TABS).catch('residents'),
  page,
  search: text,
  hostel_id: id,
  status: z.enum(['active', 'on_leave', 'checking_out', 'checked_out']).optional().catch(undefined),
  has_bed: flag,
  application_status: z
    .enum(['pending', 'waitlisted', 'approved', 'rejected', 'cancelled', 'admitted'])
    .optional()
    .catch(undefined),
  checkout_status: z.enum(['open', 'completed', 'cancelled']).optional().catch(undefined),
  sort: z
    .enum([
      'created_at',
      'admitted_on',
      'admission_no',
      'name',
      'room_no',
      'priority',
      'wanted_from',
      'checkout_date',
    ])
    .optional()
    .catch(undefined),
  order,
})
export type ResidentsSearch = z.infer<typeof residentsSearchSchema>

export const RESIDENT_DETAIL_TABS = [
  'overview',
  'fees',
  'roll_call',
  'leaves',
  'conduct',
  'belongings',
] as const
export type ResidentDetailTab = (typeof RESIDENT_DETAIL_TABS)[number]

export const residentSearchSchema = z.object({
  tab: z.enum(RESIDENT_DETAIL_TABS).catch('overview'),
})
export type ResidentSearch = z.infer<typeof residentSearchSchema>

export const roomsSearchSchema = z.object({
  page,
  search: text,
  hostel_id: id,
  block_id: id,
  room_type_id: id,
  status: z.enum(['active', 'maintenance', 'closed']).optional().catch(undefined),
  has_vacancy: flag,
  room: id,
  sort: z.enum(['room_no', 'created_at', 'capacity', 'vacant_beds']).optional().catch(undefined),
  order,
})
export type RoomsSearch = z.infer<typeof roomsSearchSchema>

export const ROLL_VIEWS = ['sheet', 'history'] as const

export const rollCallSearchSchema = z.object({
  view: z.enum(ROLL_VIEWS).catch('sheet'),
  hostel_id: id,
  slot: z.enum(['morning', 'evening', 'night']).catch('night'),
  date,
  block_id: id,
  unmarked: flag,
  page,
})
export type RollCallSearch = z.infer<typeof rollCallSearchSchema>

export const LEAVE_TABS = ['leaves', 'gate'] as const

export const leavesSearchSchema = z.object({
  tab: z.enum(LEAVE_TABS).catch('leaves'),
  page,
  search: text,
  hostel_id: id,
  status: z
    .enum(['awaiting_parent', 'pending', 'approved', 'rejected', 'cancelled', 'out', 'returned'])
    .optional()
    .catch(undefined),
  kind: z.enum(['home', 'outing', 'medical', 'festival', 'other']).optional().catch(undefined),
  overdue: flag,
  sort: z.enum(['created_at', 'from_date', 'expected_return_at']).optional().catch(undefined),
  order,
})
export type LeavesSearch = z.infer<typeof leavesSearchSchema>

export const VISITOR_TABS = ['visits', 'blocklist'] as const

export const visitorsSearchSchema = z.object({
  tab: z.enum(VISITOR_TABS).catch('visits'),
  page,
  search: text,
  hostel_id: id,
  status: z.enum(['inside', 'left', 'denied']).optional().catch(undefined),
  date,
  sort: z.enum(['created_at', 'in_at', 'out_at']).optional().catch(undefined),
  order,
})
export type VisitorsSearch = z.infer<typeof visitorsSearchSchema>

export const FEE_TABS = ['dues', 'schedule'] as const

export const hostelFeesSearchSchema = z.object({
  tab: z.enum(FEE_TABS).catch('dues'),
  page,
  search: text,
  hostel_id: id,
  with_balance: flag,
  sort: z.enum(['balance', 'name', 'billed']).optional().catch(undefined),
  order,
})
export type HostelFeesSearch = z.infer<typeof hostelFeesSearchSchema>

export const disciplineSearchSchema = z.object({
  page,
  search: text,
  hostel_id: id,
  status: z.enum(['open', 'action_taken', 'closed', 'withdrawn']).optional().catch(undefined),
  category: z
    .enum([
      'late_return',
      'curfew',
      'misconduct',
      'ragging',
      'fighting',
      'damage',
      'contraband',
      'absent_without_leave',
      'other',
    ])
    .optional()
    .catch(undefined),
  severity: z.enum(['minor', 'major', 'critical']).optional().catch(undefined),
  sort: z.enum(['created_at', 'incident_at', 'severity']).optional().catch(undefined),
  order,
})
export type DisciplineSearch = z.infer<typeof disciplineSearchSchema>

export const COMPLAINT_TABS = ['complaints', 'maintenance'] as const

export const complaintsSearchSchema = z.object({
  tab: z.enum(COMPLAINT_TABS).catch('complaints'),
  page,
  search: text,
  hostel_id: id,
  complaint_status: z
    .enum(['open', 'in_progress', 'resolved', 'closed', 'rejected'])
    .optional()
    .catch(undefined),
  ticket_status: z
    .enum(['open', 'assigned', 'in_progress', 'on_hold', 'done', 'cancelled'])
    .optional()
    .catch(undefined),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().catch(undefined),
  overdue: flag,
  open: flag,
  sort: z.enum(['created_at', 'due_at', 'priority', 'scheduled_on']).optional().catch(undefined),
  order,
})
export type ComplaintsSearch = z.infer<typeof complaintsSearchSchema>

export const SETUP_TABS = ['hostels', 'structure', 'room_types', 'settings'] as const
export type SetupTab = (typeof SETUP_TABS)[number]

export const hostelSetupSearchSchema = z.object({
  tab: z.enum(SETUP_TABS).catch('hostels'),
  hostel_id: id,
})
export type HostelSetupSearch = z.infer<typeof hostelSetupSearchSchema>

export const HOSTEL_REPORTS = [
  'summary',
  'occupancy',
  'attendance',
  'leaves',
  'visitors',
  'fees',
  'discipline',
  'complaints',
  'mess',
  'health',
] as const
export type HostelReport = (typeof HOSTEL_REPORTS)[number]

export const hostelReportsSearchSchema = z.object({
  report: z.enum(HOSTEL_REPORTS).catch('summary'),
  hostel_id: id,
  from: date,
  to: date,
})
export type HostelReportsSearch = z.infer<typeof hostelReportsSearchSchema>

export const SAFETY_TABS = ['alerts', 'rules'] as const

export const safetySearchSchema = z.object({
  tab: z.enum(SAFETY_TABS).catch('alerts'),
  page,
  search: text,
  hostel_id: id,
  status: z.enum(['open', 'resolved', 'cancelled']).optional().catch(undefined),
  acknowledged: flag,
  sos: id,
})
export type SafetySearch = z.infer<typeof safetySearchSchema>

export const hostelAuditSearchSchema = z.object({
  page,
  search: text,
  entity: z.string().trim().max(30).optional().catch(undefined),
  from: date,
  to: date,
})
export type HostelAuditSearch = z.infer<typeof hostelAuditSearchSchema>
