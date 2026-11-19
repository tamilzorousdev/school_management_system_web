import { z } from 'zod'
import {
  ALLOCATION_STATUSES,
  ASSET_CONDITIONS,
  ASSET_STATUSES,
  ASSIGNEE_TYPES,
  AUDIT_FINDINGS,
  CATEGORY_KINDS,
  DISPOSAL_METHODS,
  DISPOSAL_STATUSES,
  FUNDING_SOURCES,
  GROUP_BY,
  LOCATION_KINDS,
  MOVEMENT_KINDS,
  REQUISITION_STATUSES,
  SCHEDULE_STATES,
  TICKET_KINDS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TRANSFER_STATUSES,
  WARRANTY_STATES,
} from './api'

export const INVENTORY_TABS = [
  'dashboard',
  'assets',
  'allocations',
  'transfers',
  'maintenance',
  'stock',
  'requisitions',
  'audits',
  'disposals',
  'reports',
  'masters',
  'settings',
] as const
export type InventoryTab = (typeof INVENTORY_TABS)[number]

export const MAINTENANCE_VIEWS = ['tickets', 'schedules'] as const
export const STOCK_VIEWS = ['items', 'receipts', 'ledger'] as const
export const MASTER_VIEWS = ['categories', 'locations', 'departments', 'vendors', 'stores'] as const
export const REPORT_VIEWS = [
  'assets',
  'depreciation',
  'maintenance',
  'consumption',
  'valuation',
] as const
export const VIEWS = [
  ...MAINTENANCE_VIEWS,
  ...STOCK_VIEWS,
  ...MASTER_VIEWS,
  ...REPORT_VIEWS,
] as const
export type InventoryView = (typeof VIEWS)[number]

const STATUSES = [
  ...new Set([
    ...ASSET_STATUSES,
    ...ALLOCATION_STATUSES,
    ...TRANSFER_STATUSES,
    ...DISPOSAL_STATUSES,
    ...TICKET_STATUSES,
    ...REQUISITION_STATUSES,
  ]),
] as [string, ...string[]]

const KINDS = [
  ...new Set([...TICKET_KINDS, ...MOVEMENT_KINDS, ...LOCATION_KINDS, ...CATEGORY_KINDS]),
] as [string, ...string[]]

const DATE = /^\d{4}-\d{2}-\d{2}$/
const page = z.coerce.number().int().min(1).optional().catch(undefined)
const id = z.coerce.number().int().min(1).optional().catch(undefined)
const flag = z.boolean().optional().catch(undefined)
const date = z.string().regex(DATE).optional().catch(undefined)

export const inventorySearchSchema = z.object({
  tab: z.enum(INVENTORY_TABS).catch('dashboard'),
  view: z.enum(VIEWS).optional().catch(undefined),
  page,
  search: z.string().trim().max(100).optional().catch(undefined),
  sort: z
    .string()
    .regex(/^[a-z_]+$/)
    .optional()
    .catch(undefined),
  order: z.enum(['asc', 'desc']).optional().catch(undefined),
  status: z.enum(STATUSES).optional().catch(undefined),
  condition: z.enum(ASSET_CONDITIONS).optional().catch(undefined),
  category_id: id,
  location_id: id,
  department_id: id,
  user_id: id,
  vendor_id: id,
  store_id: id,
  item_id: id,
  warranty: z.enum(WARRANTY_STATES).optional().catch(undefined),
  funding_source: z.enum(FUNDING_SOURCES).optional().catch(undefined),
  assignee_type: z.enum(ASSIGNEE_TYPES).optional().catch(undefined),
  overdue: flag,
  unacknowledged: flag,
  kind: z.enum(KINDS).optional().catch(undefined),
  priority: z.enum(TICKET_PRIORITIES).optional().catch(undefined),
  active: flag,
  state: z.enum(SCHEDULE_STATES).optional().catch(undefined),
  low: flag,
  is_active: flag,
  method: z.enum(DISPOSAL_METHODS).optional().catch(undefined),
  from: date,
  to: date,
  as_on: date,
  group_by: z.enum(GROUP_BY).optional().catch(undefined),
  open: id,
  audit_id: id,
  finding: z
    .enum([...AUDIT_FINDINGS, 'missing'])
    .optional()
    .catch(undefined),
})

export type InventorySearch = z.infer<typeof inventorySearchSchema>
export type InventorySearchPatch = Partial<Omit<InventorySearch, 'tab'>>

export function pick<T extends string>(list: readonly T[], value: string | undefined) {
  return list.includes(value as T) ? (value as T) : undefined
}

export const ASSET_PAGE_TABS = ['details', 'maintenance', 'allocations', 'history'] as const
export type AssetPageTab = (typeof ASSET_PAGE_TABS)[number]

export const assetPageSearchSchema = z.object({
  tab: z.enum(ASSET_PAGE_TABS).catch('details'),
})

export const stockItemSearchSchema = z.object({
  page,
  store_id: id,
  kind: z.enum(MOVEMENT_KINDS).optional().catch(undefined),
  from: date,
  to: date,
})

export type AssetPageSearch = z.infer<typeof assetPageSearchSchema>
export type StockItemSearch = z.infer<typeof stockItemSearchSchema>
