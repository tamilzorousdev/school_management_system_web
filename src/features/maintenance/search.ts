import { z } from 'zod'

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .catch(undefined)

export const MAINTENANCE_TABS = [
  'overview',
  'schedules',
  'tickets',
  'fuel',
  'expenses',
  'checks',
  'bus-log',
  'reports',
  'settings',
] as const
export type MaintenanceTab = (typeof MAINTENANCE_TABS)[number]

export const REPORT_VIEWS = ['costs', 'mileage', 'spend', 'idle', 'reimbursements'] as const
export type ReportView = (typeof REPORT_VIEWS)[number]

const SERVICE_CATEGORIES = [
  'engine_oil',
  'tyres',
  'brakes',
  'battery',
  'ac',
  'body',
  'electrical',
  'general_service',
  'other',
] as const

const EXPENSE_CATEGORIES = [
  'tyres',
  'insurance',
  'fitness',
  'permit',
  'puc',
  'road_tax',
  'rc',
  'speed_governor',
  'fire_extinguisher',
  'first_aid',
  'fine',
  'toll',
  'parking',
  'cleaning',
  'other',
] as const

export const maintenanceSearchSchema = z.object({
  tab: z.enum(MAINTENANCE_TABS).catch('overview'),
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(10).max(50).optional().catch(undefined),
  search: z.string().trim().max(100).optional().catch(undefined),
  vehicle_id: z.coerce.number().int().min(1).optional().catch(undefined),
  status: z.enum(['open', 'in_progress', 'done']).optional().catch(undefined),
  source: z.enum(['obd', 'manual', 'driver']).optional().catch(undefined),
  kind: z.enum(['repair', 'service']).optional().catch(undefined),
  category: z.enum(SERVICE_CATEGORIES).optional().catch(undefined),
  off_road: z.boolean().optional().catch(undefined),
  fuel_status: z.enum(['approved', 'pending', 'rejected']).optional().catch(undefined),
  payment_mode: z
    .enum(['cash', 'upi', 'card', 'fuel_card', 'credit', 'driver_paid'])
    .optional()
    .catch(undefined),
  reimbursed: z.boolean().optional().catch(undefined),
  due: z.enum(['ok', 'due_soon', 'overdue']).optional().catch(undefined),
  expense_category: z.enum(EXPENSE_CATEGORIES).optional().catch(undefined),
  state: z.enum(['ok', 'failed', 'blocked']).optional().catch(undefined),
  date,
  log_type: z.enum(['fuel', 'service', 'repair', 'expense', 'check']).optional().catch(undefined),
  report: z.enum(REPORT_VIEWS).optional().catch(undefined),
  group: z.enum(['category', 'vendor']).optional().catch(undefined),
  from: date,
  to: date,
  sort: z
    .enum(['opened_at', 'closed_at', 'cost', 'status', 'filled_on', 'amount', 'litres', 'spent_on'])
    .optional()
    .catch(undefined),
  order: z.enum(['asc', 'desc']).optional().catch(undefined),
})

export type MaintenanceSearch = z.infer<typeof maintenanceSearchSchema>

export interface TabProps {
  search: MaintenanceSearch
  setSearch: (patch: Partial<MaintenanceSearch>) => void
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  onClear: () => void
  canManage: boolean
  adding: boolean
  onAddingChange: (open: boolean) => void
  goTo: (tab: MaintenanceTab, patch?: Partial<MaintenanceSearch>) => void
}
