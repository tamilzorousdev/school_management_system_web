import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated, type QueryParams } from '@/lib/api/client'
import { can, useMe } from '@/features/auth/api'

export const INVENTORY_BASE = '/admin/inventory'

export const CATEGORY_KINDS = ['asset', 'stock'] as const
export type CategoryKind = (typeof CATEGORY_KINDS)[number]
export const LOCATION_KINDS = [
  'classroom',
  'lab',
  'office',
  'staff_room',
  'store',
  'library',
  'hall',
  'ground',
  'other',
] as const
export type LocationKind = (typeof LOCATION_KINDS)[number]
export const DEPRECIATION_METHODS = ['straight_line', 'written_down'] as const
export type DepreciationMethod = (typeof DEPRECIATION_METHODS)[number]
export const ASSET_STATUSES = [
  'in_store',
  'allocated',
  'in_maintenance',
  'lost',
  'disposed',
] as const
export type AssetStatus = (typeof ASSET_STATUSES)[number]
export const ASSET_CONDITIONS = ['new', 'good', 'fair', 'poor', 'damaged'] as const
export type AssetCondition = (typeof ASSET_CONDITIONS)[number]
export const ASSIGNEE_TYPES = ['staff', 'department', 'location'] as const
export type AssigneeType = (typeof ASSIGNEE_TYPES)[number]
export const FUNDING_SOURCES = ['school', 'government', 'donation', 'pta', 'other'] as const
export type FundingSource = (typeof FUNDING_SOURCES)[number]
export const TRANSFER_STATUSES = [
  'requested',
  'approved',
  'rejected',
  'completed',
  'cancelled',
] as const
export type TransferStatus = (typeof TRANSFER_STATUSES)[number]
export const DISPOSAL_METHODS = ['sold', 'scrapped', 'donated', 'lost', 'written_off'] as const
export type DisposalMethod = (typeof DISPOSAL_METHODS)[number]
export const DISPOSAL_STATUSES = ['requested', 'approved', 'rejected'] as const
export type DisposalStatus = (typeof DISPOSAL_STATUSES)[number]
export const ASSET_EVENT_KINDS = [
  'registered',
  'edited',
  'allocated',
  'acknowledged',
  'returned',
  'transfer_requested',
  'transferred',
  'maintenance_opened',
  'maintenance_closed',
  'condition_changed',
  'audited',
  'marked_lost',
  'found',
  'disposal_requested',
  'disposed',
] as const
export type AssetEventKind = (typeof ASSET_EVENT_KINDS)[number]
export const WARRANTY_STATES = ['active', 'expiring', 'expired', 'none'] as const
export type WarrantyState = (typeof WARRANTY_STATES)[number]
export const ALLOCATION_STATUSES = ['active', 'returned'] as const
export type AllocationStatus = (typeof ALLOCATION_STATUSES)[number]
export const TICKET_KINDS = ['breakdown', 'preventive', 'inspection'] as const
export type TicketKind = (typeof TICKET_KINDS)[number]
export const TICKET_PRIORITIES = ['low', 'medium', 'high'] as const
export type TicketPriority = (typeof TICKET_PRIORITIES)[number]
export const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'cancelled'] as const
export type TicketStatus = (typeof TICKET_STATUSES)[number]
export const SCHEDULE_STATES = ['overdue', 'due_soon', 'scheduled'] as const
export type ScheduleState = (typeof SCHEDULE_STATES)[number]
export const STOCK_UNITS = [
  'pcs',
  'box',
  'pack',
  'ream',
  'kg',
  'g',
  'litre',
  'ml',
  'set',
  'pair',
  'roll',
  'bottle',
] as const
export type StockUnit = (typeof STOCK_UNITS)[number]
export const MOVEMENT_KINDS = ['receipt', 'issue', 'return', 'adjustment'] as const
export type MovementKind = (typeof MOVEMENT_KINDS)[number]
export const REQUISITION_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'issued',
  'partly_issued',
  'cancelled',
] as const
export type RequisitionStatus = (typeof REQUISITION_STATUSES)[number]
export const AUDIT_KINDS = ['asset', 'stock'] as const
export type AuditKind = (typeof AUDIT_KINDS)[number]
export const AUDIT_STATUSES = ['open', 'closed'] as const
export type AuditStatus = (typeof AUDIT_STATUSES)[number]
export const AUDIT_FINDINGS = ['found', 'misplaced', 'not_available', 'unknown'] as const
export type AuditFinding = (typeof AUDIT_FINDINGS)[number]
export type AuditItemFinding = AuditFinding | 'missing'
export const ADJUSTMENT_REASONS = [
  'damaged',
  'expired',
  'count_correction',
  'returned',
  'other',
] as const
export type AdjustmentReason = (typeof ADJUSTMENT_REASONS)[number]
export const GROUP_BY = ['category', 'location', 'department', 'custodian', 'status'] as const
export type GroupBy = (typeof GROUP_BY)[number]
export const IMPORT_MODES = ['validate', 'import'] as const
export type ImportMode = (typeof IMPORT_MODES)[number]

export interface Ref {
  id: number
  name: string
}

export interface UserRef {
  id: number
  name: string
  detail: string | null
}

export interface ListParams {
  page?: number
  limit?: number
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export interface InventorySettings {
  approve_transfers: boolean
  approve_requisitions: boolean
  approve_disposals: boolean
  depreciation_method: DepreciationMethod
  warranty_alert_days: number
  maintenance_alert_days: number
}

export type InventorySettingsInput = Partial<InventorySettings>

export interface Category {
  id: number
  name: string
  code: string
  kind: CategoryKind
  parent: Ref | null
  depreciation_rate: number | null
  useful_life_years: number | null
  maintenance_interval_days: number | null
  description: string | null
  item_count: number
}

export interface CategoryInput {
  name: string
  code: string
  kind: CategoryKind
  parent_id?: number | null
  depreciation_rate?: number | null
  useful_life_years?: number | null
  maintenance_interval_days?: number | null
  description?: string | null
}

export interface Location {
  id: number
  name: string
  code: string
  kind: LocationKind
  building: string | null
  floor: string | null
  section: Ref | null
  is_active: boolean
  asset_count: number
}

export interface LocationInput {
  name: string
  code: string
  kind?: LocationKind
  building?: string | null
  floor?: string | null
  section_id?: number | null
  is_active?: boolean
}

export interface LocationParams extends ListParams {
  kind?: LocationKind
  building?: string
  is_active?: boolean
}

export interface Department {
  id: number
  name: string
  code: string
  head: UserRef | null
  description: string | null
  is_active: boolean
  staff_count: number
  asset_count: number
}

export interface DepartmentInput {
  name: string
  code?: string
  head_user_id?: number | null
  description?: string | null
  is_active?: boolean
}

export interface SyncResult {
  created: number
  existing: number
}

export interface Vendor {
  id: number
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  gstin: string | null
  address: string | null
  supplies: string | null
  is_active: boolean
  asset_count: number
  receipt_count: number
}

export interface VendorInput {
  name: string
  contact_person?: string | null
  phone?: string | null
  email?: string | null
  gstin?: string | null
  address?: string | null
  supplies?: string | null
  is_active?: boolean
}

export interface Store {
  id: number
  name: string
  code: string
  location: Ref | null
  keeper: UserRef | null
  is_active: boolean
  item_count: number
  stock_value: number
}

export interface StoreInput {
  name: string
  code: string
  location_id?: number | null
  keeper_user_id?: number | null
  is_active?: boolean
}

export interface Assignee {
  type: AssigneeType
  id: number
  name: string
  detail: string | null
}

export interface CurrentAllocation {
  id: number
  assignee: Assignee
  allocated_on: string
  expected_return_on: string | null
  acknowledged_at: string | null
  overdue: boolean
}

export interface Asset {
  id: number
  asset_tag: string
  name: string
  category: Ref
  make: string | null
  model: string | null
  serial_no: string | null
  description: string | null
  vendor: Ref | null
  invoice_no: string | null
  invoice_file_id: number | null
  invoice_url: string | null
  purchase_date: string | null
  cost: number | null
  residual_value: number | null
  book_value: number | null
  warranty_until: string | null
  warranty_state: WarrantyState
  amc_until: string | null
  amc_vendor: Ref | null
  funding_source: FundingSource
  condition: AssetCondition
  status: AssetStatus
  location: Ref | null
  department: Ref | null
  custodian: UserRef | null
  store: Ref | null
  current_allocation: CurrentAllocation | null
  photo_file_id: number | null
  photo_url: string | null
  notes: string | null
  open_tickets: number
  next_maintenance_on: string | null
  created_at: string
}

export interface AssetParams extends ListParams {
  status?: AssetStatus | AssetStatus[]
  condition?: AssetCondition
  category_id?: number
  location_id?: number
  department_id?: number
  custodian_user_id?: number
  vendor_id?: number
  warranty?: WarrantyState
  funding_source?: FundingSource
}

export interface AssetInsights {
  total: number
  total_cost: number
  book_value: number
  in_store: number
  allocated: number
  in_maintenance: number
  lost: number
  disposed: number
  warranty_expiring: number
  overdue_returns: number
  unacknowledged: number
}

export interface AssetInput {
  name: string
  category_id: number
  make?: string | null
  model?: string | null
  serial_no?: string | null
  description?: string | null
  vendor_id?: number | null
  invoice_no?: string | null
  invoice_file_id?: number | null
  purchase_date?: string | null
  cost?: number | null
  residual_value?: number | null
  warranty_until?: string | null
  amc_until?: string | null
  amc_vendor_id?: number | null
  funding_source?: FundingSource
  condition?: AssetCondition
  location_id?: number | null
  store_id?: number | null
  photo_file_id?: number | null
  notes?: string | null
}

export interface AssetCreateInput extends AssetInput {
  quantity?: number
  serial_nos?: string[]
  schedule_maintenance?: boolean
}

export interface AssetCreateResult {
  assets: Asset[]
}

export interface AssetLabelsParams {
  asset_ids?: number[]
  location_id?: number
  category_id?: number
  added_from?: string
}

export interface AssetEvent {
  id: number
  kind: AssetEventKind
  note: string | null
  ref_type: string | null
  ref_id: number | null
  actor: string | null
  created_at: string
}

export interface AssignTarget {
  assignee_type: AssigneeType
  user_id?: number
  department_id?: number
  location_id?: number
}

export interface AllocateInput extends AssignTarget {
  asset_ids: number[]
  allocated_on?: string
  expected_return_on?: string
  remarks?: string | null
}

export interface ReturnInput {
  asset_ids: number[]
  condition?: AssetCondition
  store_id?: number
  send_to_maintenance?: boolean
  remarks?: string | null
}

export interface Allocation {
  id: number
  asset: Ref
  asset_tag: string
  assignee: Assignee
  allocated_on: string
  expected_return_on: string | null
  acknowledged_at: string | null
  returned_on: string | null
  return_condition: AssetCondition | null
  status: AllocationStatus
  overdue: boolean
  allocated_by: string | null
  returned_by: string | null
  remarks: string | null
}

export interface AllocationParams extends ListParams {
  status?: AllocationStatus
  assignee_type?: AssigneeType
  user_id?: number
  department_id?: number
  location_id?: number
  asset_id?: number
  overdue?: boolean
  unacknowledged?: boolean
}

export interface TransferItem {
  asset_id: number
  asset_tag: string
  name: string
  from: string | null
}

export interface Transfer {
  id: number
  transfer_no: string
  to: Assignee
  items: TransferItem[]
  reason: string
  status: TransferStatus
  requested_by: string | null
  decided_by: string | null
  decided_at: string | null
  decision_note: string | null
  completed_at: string | null
  created_at: string
}

export interface TransferInput extends AssignTarget {
  asset_ids: number[]
  reason: string
}

export interface TransferParams extends ListParams {
  status?: TransferStatus
  asset_id?: number
}

export interface Disposal {
  id: number
  disposal_no: string
  asset: Ref
  asset_tag: string
  method: DisposalMethod
  reason: string
  value_realised: number | null
  book_value: number | null
  status: DisposalStatus
  requested_by: string | null
  decided_by: string | null
  decided_at: string | null
  decision_note: string | null
  created_at: string
}

export interface DisposalInput {
  asset_id: number
  method: DisposalMethod
  reason: string
  value_realised?: number | null
}

export interface DisposalParams extends ListParams {
  status?: DisposalStatus
  method?: DisposalMethod
}

export interface ImportRow {
  row: number
  status: 'ok' | 'error'
  name: string | null
  quantity: number
  message: string | null
  asset_tags: string[]
  asset_ids: number[]
}

export interface ImportReport {
  mode: ImportMode
  total_rows: number
  ok_rows: number
  error_rows: number
  assets_created: number
  masters_created: number
  rows: ImportRow[]
}

export interface Ticket {
  id: number
  ticket_no: string
  asset: Ref
  asset_tag: string
  location: Ref | null
  kind: TicketKind
  title: string
  description: string | null
  priority: TicketPriority
  status: TicketStatus
  reported_by: string | null
  assigned_to: UserRef | null
  vendor: Ref | null
  under_warranty: boolean
  cost: number | null
  parts: string | null
  opened_at: string
  resolved_at: string | null
  downtime_days: number | null
  resolution: string | null
}

export interface TicketInput {
  asset_id: number
  kind?: TicketKind
  title: string
  description?: string | null
  priority?: TicketPriority
  assigned_to_user_id?: number | null
  vendor_id?: number | null
}

export interface TicketUpdateInput {
  status?: 'open' | 'in_progress'
  priority?: TicketPriority
  assigned_to_user_id?: number | null
  vendor_id?: number | null
  description?: string | null
}

export interface TicketResolveInput {
  resolution: string
  cost?: number | null
  parts?: string | null
  condition?: AssetCondition
}

export interface TicketParams extends ListParams {
  status?: TicketStatus
  kind?: TicketKind
  priority?: TicketPriority
  asset_id?: number
  vendor_id?: number
  active?: boolean
}

export interface Schedule {
  id: number
  asset: Ref
  asset_tag: string
  title: string
  interval_days: number
  next_due_on: string
  last_done_on: string | null
  vendor: Ref | null
  is_active: boolean
  state: ScheduleState
  open_ticket_id: number | null
}

export interface ScheduleInput {
  asset_id: number
  title: string
  interval_days: number
  next_due_on: string
  vendor_id?: number | null
  is_active?: boolean
}

export interface ScheduleParams extends ListParams {
  state?: ScheduleState
  asset_id?: number
}

export interface StockItem {
  id: number
  name: string
  code: string
  category: Ref
  unit: StockUnit
  reorder_level: number
  description: string | null
  is_active: boolean
  quantity: number
  value: number
  average_rate: number
  low: boolean
}

export interface StockBalance {
  store: Ref
  quantity: number
  value: number
}

export interface StockItemDetail extends StockItem {
  balances: StockBalance[]
}

export interface StockItemInput {
  name: string
  code?: string
  category_id: number
  unit?: StockUnit
  reorder_level?: number
  description?: string | null
  is_active?: boolean
}

export interface StockItemParams extends ListParams {
  category_id?: number
  store_id?: number
  low?: boolean
  is_active?: boolean
}

export interface StockInsights {
  items: number
  stock_value: number
  low_stock: number
  out_of_stock: number
  pending_requisitions: number
  to_issue: number
  received_this_month: number
  issued_this_month: number
}

export interface ReceiptLineInput {
  item_id: number
  quantity: number
  rate: number
}

export interface ReceiptInput {
  store_id: number
  vendor_id?: number | null
  invoice_no?: string | null
  invoice_date?: string
  received_on?: string
  notes?: string | null
  lines: ReceiptLineInput[]
}

export interface ReceiptLine {
  item: Ref
  unit: StockUnit
  quantity: number
  rate: number
  amount: number
}

export interface Receipt {
  id: number
  receipt_no: string
  store: Ref
  vendor: Ref | null
  invoice_no: string | null
  invoice_date: string | null
  received_on: string
  total: number
  notes: string | null
  received_by: string | null
  lines: ReceiptLine[]
  created_at: string
}

export interface ReceiptParams extends ListParams {
  store_id?: number
  vendor_id?: number
  from?: string
  to?: string
}

export interface AdjustmentInput {
  item_id: number
  store_id: number
  quantity: number
  reason: AdjustmentReason
  note?: string | null
  rate?: number
}

export interface QuantityLine {
  item_id: number
  quantity: number
}

export interface DirectIssueInput {
  store_id: number
  department_id?: number
  user_id?: number
  section_id?: number
  purpose: string
  lines: QuantityLine[]
}

export interface Movement {
  id: number
  item: Ref
  unit: StockUnit
  store: Ref
  kind: MovementKind
  quantity: number
  rate: number
  value: number
  balance_after: number
  reference: string | null
  department: Ref | null
  person: string | null
  section: Ref | null
  note: string | null
  moved_on: string
  by: string | null
  created_at: string
}

export interface MovementParams extends ListParams {
  item_id?: number
  store_id?: number
  kind?: MovementKind
  department_id?: number
  from?: string
  to?: string
}

export interface RequisitionInput {
  store_id: number
  department_id?: number
  requested_for_user_id?: number
  section_id?: number
  purpose: string
  needed_by?: string
  lines: QuantityLine[]
}

export interface RequisitionApproveInput {
  lines?: { item_id: number; approved_quantity: number }[]
  note?: string | null
}

export interface RequisitionIssueInput {
  lines?: QuantityLine[]
}

export interface RequisitionLine {
  item: Ref
  unit: StockUnit
  quantity: number
  approved_quantity: number | null
  issued_quantity: number
  available: number
}

export interface Requisition {
  id: number
  requisition_no: string
  store: Ref
  department: Ref | null
  requested_for: UserRef | null
  section: Ref | null
  purpose: string
  needed_by: string | null
  status: RequisitionStatus
  raised_by: string | null
  decided_by: string | null
  decided_at: string | null
  decision_note: string | null
  issued_at: string | null
  lines: RequisitionLine[]
  created_at: string
}

export interface RequisitionParams extends ListParams {
  status?: RequisitionStatus
  department_id?: number
  store_id?: number
}

export interface Audit {
  id: number
  name: string
  kind: AuditKind
  status: AuditStatus
  location: Ref | null
  category: Ref | null
  department: Ref | null
  store: Ref | null
  expected: number
  checked: number
  found: number
  misplaced: number
  not_available: number
  unknown: number
  missing: number
  differences: number
  notes: string | null
  started_by: string | null
  created_at: string
  closed_at: string | null
}

export interface AuditInput {
  name: string
  kind: AuditKind
  location_id?: number
  category_id?: number
  department_id?: number
  store_id?: number
  notes?: string | null
}

export interface AuditScanInput {
  code: string
  location_id?: number
}

export interface AuditItem {
  id: number
  code: string
  finding: AuditItemFinding
  asset: Asset | null
  found_location: Ref | null
  scanned_at: string | null
}

export interface AuditItemsParams {
  page?: number
  limit?: number
  finding?: AuditItemFinding
}

export interface AuditScanResult {
  finding: AuditFinding
  message: string
  repeated: boolean
  asset: Asset | null
  audit: Audit
}

export interface CountLine {
  id: number
  item: Ref
  unit: StockUnit
  system_quantity: number
  counted_quantity: number | null
  difference: number | null
  note: string | null
}

export interface CountInputLine {
  item_id: number
  counted_quantity: number
  note?: string | null
}

export interface AuditCloseInput {
  mark_missing_lost?: boolean
  post_adjustments?: boolean
}

export interface ReportParams {
  from?: string
  to?: string
  category_id?: number
  location_id?: number
  department_id?: number
  as_on?: string
}

export interface GroupRow {
  id: number | null
  name: string
  assets: number
  cost: number
  book_value: number
  allocated: number
  in_maintenance: number
}

export interface DepreciationRow {
  category: Ref
  assets: number
  cost: number
  opening_value: number
  depreciation: number
  closing_value: number
}

export interface MaintenanceCostRow {
  category: Ref
  tickets: number
  resolved: number
  cost: number
  average_downtime_days: number | null
}

export interface ConsumptionRow {
  department: Ref | null
  item: Ref
  unit: StockUnit
  quantity: number
  value: number
}

export interface StockValuationRow {
  item: Ref
  category: Ref
  unit: StockUnit
  quantity: number
  average_rate: number
  value: number
  reorder_level: number
  low: boolean
}

export interface InventoryDashboard {
  assets: AssetInsights
  stock: StockInsights
  open_tickets: number
  maintenance_due: number
  pending_transfers: number
  pending_disposals: number
  low_stock: StockItem[]
  maintenance_due_list: Schedule[]
  warranty_expiring: Asset[]
  overdue_returns: Allocation[]
  requisitions: Requisition[]
  transfers: Transfer[]
  disposals: Disposal[]
}

export interface PeopleAssets {
  current: Allocation[]
  history: Allocation[]
}

const B = INVENTORY_BASE
const params = (value: object) => ({ ...value }) as QueryParams
const ids = (value?: number[]) => (value?.length ? value.join(',') : undefined)
const assetQuery = (p: AssetParams): QueryParams => ({
  ...p,
  status: Array.isArray(p.status) ? p.status.join(',') || undefined : p.status,
})

export const inventoryFiles = {
  importTemplate: `${B}/assets/import/template`,
  labels: `${B}/assets/labels`,
  registerExport: `${B}/reports/register/export`,
  movementsExport: `${B}/reports/movements/export`,
  labelsParams: (value: AssetLabelsParams): QueryParams => ({
    asset_ids: ids(value.asset_ids),
    location_id: value.location_id,
    category_id: value.category_id,
    added_from: value.added_from,
  }),
  fileContent: (fileId: number) => `/files/${fileId}/content`,
  registerParams: (value: AssetParams): QueryParams => assetQuery(value),
}

export const inventoryKeys = {
  all: ['inventory'] as const,
  dashboard: () => [...inventoryKeys.all, 'dashboard'] as const,
  settings: () => [...inventoryKeys.all, 'settings'] as const,
  categories: (kind?: CategoryKind) => [...inventoryKeys.all, 'categories', kind ?? 'all'] as const,
  locations: (p: LocationParams) => [...inventoryKeys.all, 'locations', p] as const,
  departments: () => [...inventoryKeys.all, 'departments'] as const,
  departmentAssets: (id: number) => [...inventoryKeys.all, 'department-assets', id] as const,
  vendors: () => [...inventoryKeys.all, 'vendors'] as const,
  stores: () => [...inventoryKeys.all, 'stores'] as const,
  assets: (p: AssetParams) => [...inventoryKeys.all, 'assets', p] as const,
  assetInsights: () => [...inventoryKeys.all, 'asset-insights'] as const,
  asset: (id: number) => [...inventoryKeys.all, 'asset', id] as const,
  assetHistory: (id: number) => [...inventoryKeys.all, 'asset-history', id] as const,
  allocations: (p: AllocationParams) => [...inventoryKeys.all, 'allocations', p] as const,
  transfers: (p: TransferParams) => [...inventoryKeys.all, 'transfers', p] as const,
  transfer: (id: number) => [...inventoryKeys.all, 'transfer', id] as const,
  disposals: (p: DisposalParams) => [...inventoryKeys.all, 'disposals', p] as const,
  tickets: (p: TicketParams) => [...inventoryKeys.all, 'tickets', p] as const,
  ticket: (id: number) => [...inventoryKeys.all, 'ticket', id] as const,
  schedules: (p: ScheduleParams) => [...inventoryKeys.all, 'schedules', p] as const,
  stockInsights: () => [...inventoryKeys.all, 'stock-insights'] as const,
  stockItems: (p: StockItemParams) => [...inventoryKeys.all, 'stock-items', p] as const,
  stockItem: (id: number) => [...inventoryKeys.all, 'stock-item', id] as const,
  receipts: (p: ReceiptParams) => [...inventoryKeys.all, 'receipts', p] as const,
  receipt: (id: number) => [...inventoryKeys.all, 'receipt', id] as const,
  movements: (p: MovementParams) => [...inventoryKeys.all, 'movements', p] as const,
  requisitions: (p: RequisitionParams) => [...inventoryKeys.all, 'requisitions', p] as const,
  requisition: (id: number) => [...inventoryKeys.all, 'requisition', id] as const,
  audits: () => [...inventoryKeys.all, 'audits'] as const,
  audit: (id: number) => [...inventoryKeys.all, 'audit', id] as const,
  auditItems: (id: number, p: AuditItemsParams) =>
    [...inventoryKeys.all, 'audit-items', id, p] as const,
  auditCount: (id: number) => [...inventoryKeys.all, 'audit-count', id] as const,
  report: (name: string, p: object) => [...inventoryKeys.all, 'report', name, p] as const,
  staffAssets: (staffId: number) => [...inventoryKeys.all, 'staff-assets', staffId] as const,
}

export const inventoryApi = {
  dashboard: () => api.get<InventoryDashboard>(`${B}/dashboard`),
  settings: () => api.get<InventorySettings>(`${B}/settings`),
  saveSettings: (input: InventorySettingsInput) =>
    api.put<InventorySettings>(`${B}/settings`, input),

  categories: (kind?: CategoryKind) => api.get<Category[]>(`${B}/categories`, { kind }),
  createCategory: (input: CategoryInput) => api.post<Category>(`${B}/categories`, input),
  updateCategory: (id: number, input: Partial<CategoryInput>) =>
    api.patch<Category>(`${B}/categories/${id}`, input),
  removeCategory: (id: number) => api.delete<null>(`${B}/categories/${id}`),

  locations: (p: LocationParams) => api.get<Paginated<Location>>(`${B}/locations`, params(p)),
  createLocation: (input: LocationInput) => api.post<Location>(`${B}/locations`, input),
  syncRooms: () => api.post<SyncResult>(`${B}/locations/sync-rooms`),
  updateLocation: (id: number, input: Partial<LocationInput>) =>
    api.patch<Location>(`${B}/locations/${id}`, input),
  removeLocation: (id: number) => api.delete<null>(`${B}/locations/${id}`),

  departments: () => api.get<Department[]>(`${B}/departments`),
  createDepartment: (input: DepartmentInput) => api.post<Department>(`${B}/departments`, input),
  syncDepartments: () => api.post<SyncResult>(`${B}/departments/sync`),
  departmentAssets: (id: number) => api.get<PeopleAssets>(`${B}/departments/${id}/assets`),
  updateDepartment: (id: number, input: Partial<DepartmentInput>) =>
    api.patch<Department>(`${B}/departments/${id}`, input),
  removeDepartment: (id: number) => api.delete<null>(`${B}/departments/${id}`),

  vendors: () => api.get<Vendor[]>(`${B}/vendors`),
  createVendor: (input: VendorInput) => api.post<Vendor>(`${B}/vendors`, input),
  updateVendor: (id: number, input: Partial<VendorInput>) =>
    api.patch<Vendor>(`${B}/vendors/${id}`, input),
  removeVendor: (id: number) => api.delete<null>(`${B}/vendors/${id}`),

  stores: () => api.get<Store[]>(`${B}/stores`),
  createStore: (input: StoreInput) => api.post<Store>(`${B}/stores`, input),
  updateStore: (id: number, input: Partial<StoreInput>) =>
    api.patch<Store>(`${B}/stores/${id}`, input),
  removeStore: (id: number) => api.delete<null>(`${B}/stores/${id}`),

  assetInsights: () => api.get<AssetInsights>(`${B}/assets/insights`),
  importAssets: (file: File, mode: ImportMode) => {
    const form = new FormData()
    form.append('file', file)
    form.append('mode', mode)
    return api.upload<ImportReport>(`${B}/assets/import`, form)
  },
  lookup: (code: string) => api.get<Asset>(`${B}/assets/lookup`, { code }),
  assets: (p: AssetParams) => api.get<Paginated<Asset>>(`${B}/assets`, assetQuery(p)),
  createAssets: (input: AssetCreateInput) => api.post<AssetCreateResult>(`${B}/assets`, input),
  asset: (id: number) => api.get<Asset>(`${B}/assets/${id}`),
  updateAsset: (id: number, input: Partial<AssetInput>) =>
    api.patch<Asset>(`${B}/assets/${id}`, input),
  removeAsset: (id: number) => api.delete<null>(`${B}/assets/${id}`),
  assetHistory: (id: number) => api.get<AssetEvent[]>(`${B}/assets/${id}/history`),
  markLost: (id: number, note: string) => api.post<Asset>(`${B}/assets/${id}/lost`, { note }),
  markFound: (id: number) => api.post<Asset>(`${B}/assets/${id}/found`),

  allocate: (input: AllocateInput) => api.post<Allocation[]>(`${B}/allocations`, input),
  returnAssets: (input: ReturnInput) => api.post<Allocation[]>(`${B}/allocations/return`, input),
  allocations: (p: AllocationParams) =>
    api.get<Paginated<Allocation>>(`${B}/allocations`, params(p)),
  acknowledge: (id: number) => api.post<Allocation>(`${B}/allocations/${id}/acknowledge`),

  transfers: (p: TransferParams) => api.get<Paginated<Transfer>>(`${B}/transfers`, params(p)),
  createTransfer: (input: TransferInput) => api.post<Transfer>(`${B}/transfers`, input),
  transfer: (id: number) => api.get<Transfer>(`${B}/transfers/${id}`),
  approveTransfer: (id: number, note?: string | null) =>
    api.post<Transfer>(`${B}/transfers/${id}/approve`, { note: note || null }),
  rejectTransfer: (id: number, note: string) =>
    api.post<Transfer>(`${B}/transfers/${id}/reject`, { note }),
  cancelTransfer: (id: number) => api.post<Transfer>(`${B}/transfers/${id}/cancel`),

  disposals: (p: DisposalParams) => api.get<Paginated<Disposal>>(`${B}/disposals`, params(p)),
  createDisposal: (input: DisposalInput) => api.post<Disposal>(`${B}/disposals`, input),
  approveDisposal: (id: number, note?: string | null) =>
    api.post<Disposal>(`${B}/disposals/${id}/approve`, { note: note || null }),
  rejectDisposal: (id: number, note: string) =>
    api.post<Disposal>(`${B}/disposals/${id}/reject`, { note }),

  tickets: (p: TicketParams) => api.get<Paginated<Ticket>>(`${B}/maintenance`, params(p)),
  openTicket: (input: TicketInput) => api.post<Ticket>(`${B}/maintenance`, input),
  ticket: (id: number) => api.get<Ticket>(`${B}/maintenance/${id}`),
  updateTicket: (id: number, input: TicketUpdateInput) =>
    api.patch<Ticket>(`${B}/maintenance/${id}`, input),
  resolveTicket: (id: number, input: TicketResolveInput) =>
    api.post<Ticket>(`${B}/maintenance/${id}/resolve`, input),
  cancelTicket: (id: number, note: string) =>
    api.post<Ticket>(`${B}/maintenance/${id}/cancel`, { note }),

  schedules: (p: ScheduleParams) => api.get<Paginated<Schedule>>(`${B}/schedules`, params(p)),
  createSchedule: (input: ScheduleInput) => api.post<Schedule>(`${B}/schedules`, input),
  updateSchedule: (id: number, input: Partial<ScheduleInput>) =>
    api.patch<Schedule>(`${B}/schedules/${id}`, input),
  startSchedule: (id: number) => api.post<Ticket>(`${B}/schedules/${id}/start`),

  stockInsights: () => api.get<StockInsights>(`${B}/stock/insights`),
  stockItems: (p: StockItemParams) => api.get<Paginated<StockItem>>(`${B}/stock/items`, params(p)),
  createStockItem: (input: StockItemInput) => api.post<StockItem>(`${B}/stock/items`, input),
  stockItem: (id: number) => api.get<StockItemDetail>(`${B}/stock/items/${id}`),
  updateStockItem: (id: number, input: Partial<StockItemInput>) =>
    api.patch<StockItem>(`${B}/stock/items/${id}`, input),
  removeStockItem: (id: number) => api.delete<null>(`${B}/stock/items/${id}`),
  receipts: (p: ReceiptParams) => api.get<Paginated<Receipt>>(`${B}/stock/receipts`, params(p)),
  receive: (input: ReceiptInput) => api.post<Receipt>(`${B}/stock/receipts`, input),
  receipt: (id: number) => api.get<Receipt>(`${B}/stock/receipts/${id}`),
  adjust: (input: AdjustmentInput) => api.post<Movement>(`${B}/stock/adjustments`, input),
  issue: (input: DirectIssueInput) => api.post<Movement[]>(`${B}/stock/issues`, input),
  movements: (p: MovementParams) => api.get<Paginated<Movement>>(`${B}/stock/movements`, params(p)),

  requisitions: (p: RequisitionParams) =>
    api.get<Paginated<Requisition>>(`${B}/requisitions`, params(p)),
  raiseRequisition: (input: RequisitionInput) => api.post<Requisition>(`${B}/requisitions`, input),
  requisition: (id: number) => api.get<Requisition>(`${B}/requisitions/${id}`),
  approveRequisition: (id: number, input: RequisitionApproveInput) =>
    api.post<Requisition>(`${B}/requisitions/${id}/approve`, input),
  rejectRequisition: (id: number, note: string) =>
    api.post<Requisition>(`${B}/requisitions/${id}/reject`, { note }),
  issueRequisition: (id: number, input: RequisitionIssueInput) =>
    api.post<Requisition>(`${B}/requisitions/${id}/issue`, input),
  cancelRequisition: (id: number) => api.post<Requisition>(`${B}/requisitions/${id}/cancel`),

  audits: () => api.get<Audit[]>(`${B}/audits`),
  startAudit: (input: AuditInput) => api.post<Audit>(`${B}/audits`, input),
  audit: (id: number) => api.get<Audit>(`${B}/audits/${id}`),
  scan: (id: number, input: AuditScanInput) =>
    api.post<AuditScanResult>(`${B}/audits/${id}/scan`, input),
  auditItems: (id: number, p: AuditItemsParams) =>
    api.get<Paginated<AuditItem>>(`${B}/audits/${id}/items`, params(p)),
  countSheet: (id: number) => api.get<CountLine[]>(`${B}/audits/${id}/count`),
  saveCount: (id: number, lines: CountInputLine[]) =>
    api.put<CountLine[]>(`${B}/audits/${id}/count`, { lines }),
  closeAudit: (id: number, input: AuditCloseInput) =>
    api.post<Audit>(`${B}/audits/${id}/close`, input),

  groupReport: (p: ReportParams & { group_by: GroupBy }) =>
    api.get<GroupRow[]>(`${B}/reports/assets`, params(p)),
  depreciationReport: (p: ReportParams) =>
    api.get<DepreciationRow[]>(`${B}/reports/depreciation`, params(p)),
  maintenanceReport: (p: ReportParams) =>
    api.get<MaintenanceCostRow[]>(`${B}/reports/maintenance`, params(p)),
  consumptionReport: (p: ReportParams) =>
    api.get<ConsumptionRow[]>(`${B}/reports/consumption`, params(p)),
  valuationReport: (p: ReportParams) =>
    api.get<StockValuationRow[]>(`${B}/reports/stock-valuation`, params(p)),

  staffAssets: (staffId: number) => api.get<PeopleAssets>(`/admin/staff/${staffId}/assets`),
}

export function useInventoryAccess() {
  const me = useMe().data
  return {
    view: can(me, 'inventory.view'),
    manage: can(me, 'inventory.manage'),
    stock: can(me, 'inventory.stock'),
    approve: can(me, 'inventory.approve'),
    audit: can(me, 'inventory.audit'),
  }
}

export type InventoryAccess = ReturnType<typeof useInventoryAccess>

export function useInventoryMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })
}

export function useInventoryDashboard() {
  return useQuery({ queryKey: inventoryKeys.dashboard(), queryFn: inventoryApi.dashboard })
}

export function useInventorySettings() {
  return useQuery({ queryKey: inventoryKeys.settings(), queryFn: inventoryApi.settings })
}

export function useCategories(kind?: CategoryKind) {
  return useQuery({
    queryKey: inventoryKeys.categories(kind),
    queryFn: () => inventoryApi.categories(kind),
    staleTime: 60_000,
  })
}

export function useLocations(p: LocationParams, enabled = true) {
  return useQuery({
    queryKey: inventoryKeys.locations(p),
    queryFn: () => inventoryApi.locations(p),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useDepartments() {
  return useQuery({
    queryKey: inventoryKeys.departments(),
    queryFn: inventoryApi.departments,
    staleTime: 60_000,
  })
}

export function useDepartmentAssets(id: number | null) {
  return useQuery({
    queryKey: inventoryKeys.departmentAssets(id ?? 0),
    queryFn: () => inventoryApi.departmentAssets(id!),
    enabled: Boolean(id),
  })
}

export function useVendors() {
  return useQuery({
    queryKey: inventoryKeys.vendors(),
    queryFn: inventoryApi.vendors,
    staleTime: 60_000,
  })
}

export function useStores() {
  return useQuery({
    queryKey: inventoryKeys.stores(),
    queryFn: inventoryApi.stores,
    staleTime: 60_000,
  })
}

export function useAssets(p: AssetParams, enabled = true) {
  return useQuery({
    queryKey: inventoryKeys.assets(p),
    queryFn: () => inventoryApi.assets(p),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useAssetInsights() {
  return useQuery({ queryKey: inventoryKeys.assetInsights(), queryFn: inventoryApi.assetInsights })
}

export function useAsset(id: number | null) {
  return useQuery({
    queryKey: inventoryKeys.asset(id ?? 0),
    queryFn: () => inventoryApi.asset(id!),
    enabled: Boolean(id),
  })
}

export function useAssetHistory(id: number | null) {
  return useQuery({
    queryKey: inventoryKeys.assetHistory(id ?? 0),
    queryFn: () => inventoryApi.assetHistory(id!),
    enabled: Boolean(id),
  })
}

export function useAllocations(p: AllocationParams, enabled = true) {
  return useQuery({
    queryKey: inventoryKeys.allocations(p),
    queryFn: () => inventoryApi.allocations(p),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useTransfers(p: TransferParams) {
  return useQuery({
    queryKey: inventoryKeys.transfers(p),
    queryFn: () => inventoryApi.transfers(p),
    placeholderData: keepPreviousData,
  })
}

export function useTransfer(id: number | null) {
  return useQuery({
    queryKey: inventoryKeys.transfer(id ?? 0),
    queryFn: () => inventoryApi.transfer(id!),
    enabled: Boolean(id),
  })
}

export function useDisposals(p: DisposalParams) {
  return useQuery({
    queryKey: inventoryKeys.disposals(p),
    queryFn: () => inventoryApi.disposals(p),
    placeholderData: keepPreviousData,
  })
}

export function useTickets(p: TicketParams, enabled = true) {
  return useQuery({
    queryKey: inventoryKeys.tickets(p),
    queryFn: () => inventoryApi.tickets(p),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useSchedules(p: ScheduleParams, enabled = true) {
  return useQuery({
    queryKey: inventoryKeys.schedules(p),
    queryFn: () => inventoryApi.schedules(p),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useStockInsights() {
  return useQuery({ queryKey: inventoryKeys.stockInsights(), queryFn: inventoryApi.stockInsights })
}

export function useStockItems(p: StockItemParams, enabled = true) {
  return useQuery({
    queryKey: inventoryKeys.stockItems(p),
    queryFn: () => inventoryApi.stockItems(p),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useStockItem(id: number | null) {
  return useQuery({
    queryKey: inventoryKeys.stockItem(id ?? 0),
    queryFn: () => inventoryApi.stockItem(id!),
    enabled: Boolean(id),
  })
}

export function useReceipts(p: ReceiptParams, enabled = true) {
  return useQuery({
    queryKey: inventoryKeys.receipts(p),
    queryFn: () => inventoryApi.receipts(p),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useReceipt(id: number | null) {
  return useQuery({
    queryKey: inventoryKeys.receipt(id ?? 0),
    queryFn: () => inventoryApi.receipt(id!),
    enabled: Boolean(id),
  })
}

export function useMovements(p: MovementParams, enabled = true) {
  return useQuery({
    queryKey: inventoryKeys.movements(p),
    queryFn: () => inventoryApi.movements(p),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useRequisitions(p: RequisitionParams) {
  return useQuery({
    queryKey: inventoryKeys.requisitions(p),
    queryFn: () => inventoryApi.requisitions(p),
    placeholderData: keepPreviousData,
  })
}

export function useRequisition(id: number | null) {
  return useQuery({
    queryKey: inventoryKeys.requisition(id ?? 0),
    queryFn: () => inventoryApi.requisition(id!),
    enabled: Boolean(id),
  })
}

export function useAudits() {
  return useQuery({ queryKey: inventoryKeys.audits(), queryFn: inventoryApi.audits })
}

export function useAudit(id: number | null) {
  return useQuery({
    queryKey: inventoryKeys.audit(id ?? 0),
    queryFn: () => inventoryApi.audit(id!),
    enabled: Boolean(id),
  })
}

export function useAuditItems(id: number | null, p: AuditItemsParams) {
  return useQuery({
    queryKey: inventoryKeys.auditItems(id ?? 0, p),
    queryFn: () => inventoryApi.auditItems(id!, p),
    placeholderData: keepPreviousData,
    enabled: Boolean(id),
  })
}

export function useCountSheet(id: number | null) {
  return useQuery({
    queryKey: inventoryKeys.auditCount(id ?? 0),
    queryFn: () => inventoryApi.countSheet(id!),
    enabled: Boolean(id),
  })
}

export function useReport<T>(name: string, p: object, fn: () => Promise<T>, enabled = true) {
  return useQuery({
    queryKey: inventoryKeys.report(name, p),
    queryFn: fn,
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useStaffAssets(staffId: number, enabled = true) {
  return useQuery({
    queryKey: inventoryKeys.staffAssets(staffId),
    queryFn: () => inventoryApi.staffAssets(staffId),
    enabled,
  })
}
