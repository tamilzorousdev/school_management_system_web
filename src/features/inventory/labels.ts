import type { BadgeTone } from '@/components/ui/badge'
import type { ComboboxOption } from '@/components/common/combobox'
import { toApiError } from '@/lib/api/errors'
import { alerts } from '@/lib/alerts'
import { downloadFile, openFile } from '@/lib/files'
import type { QueryParams } from '@/lib/api/client'
import type {
  AdjustmentReason,
  AllocationStatus,
  Assignee,
  AssetCondition,
  AssetEventKind,
  AssetStatus,
  AssigneeType,
  AuditItemFinding,
  CategoryKind,
  DepreciationMethod,
  DisposalMethod,
  DisposalStatus,
  FundingSource,
  GroupBy,
  LocationKind,
  MovementKind,
  RequisitionStatus,
  ScheduleState,
  StockUnit,
  TicketKind,
  TicketPriority,
  TicketStatus,
  TransferStatus,
  WarrantyState,
} from './api'

export interface Tagged {
  label: string
  tone: BadgeTone
}

export const ASSET_STATUS: Record<AssetStatus, Tagged> = {
  in_store: { label: 'In store', tone: 'info' },
  allocated: { label: 'Allocated', tone: 'success' },
  in_maintenance: { label: 'Under maintenance', tone: 'warning' },
  lost: { label: 'Lost', tone: 'danger' },
  disposed: { label: 'Disposed', tone: 'neutral' },
}

export const ASSET_CONDITION: Record<AssetCondition, Tagged> = {
  new: { label: 'New', tone: 'success' },
  good: { label: 'Good', tone: 'success' },
  fair: { label: 'Fair', tone: 'info' },
  poor: { label: 'Poor', tone: 'warning' },
  damaged: { label: 'Damaged', tone: 'danger' },
}

export const WARRANTY_STATE: Record<WarrantyState, Tagged> = {
  active: { label: 'Under warranty', tone: 'success' },
  expiring: { label: 'Warranty ending soon', tone: 'warning' },
  expired: { label: 'Warranty over', tone: 'neutral' },
  none: { label: 'No warranty', tone: 'neutral' },
}

export const FUNDING_SOURCE: Record<FundingSource, string> = {
  school: 'School funds',
  government: 'Government grant',
  donation: 'Donation',
  pta: 'PTA',
  other: 'Other',
}

export const ASSIGNEE_TYPE: Record<AssigneeType, string> = {
  staff: 'Staff member',
  department: 'Department',
  location: 'Location',
}

export const ALLOCATION_STATUS: Record<AllocationStatus, Tagged> = {
  active: { label: 'With them', tone: 'success' },
  returned: { label: 'Returned', tone: 'neutral' },
}

export const TRANSFER_STATUS: Record<TransferStatus, Tagged> = {
  requested: { label: 'Waiting for approval', tone: 'warning' },
  approved: { label: 'Approved', tone: 'info' },
  rejected: { label: 'Rejected', tone: 'danger' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

export const DISPOSAL_STATUS: Record<DisposalStatus, Tagged> = {
  requested: { label: 'Waiting for approval', tone: 'warning' },
  approved: { label: 'Disposed', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
}

export const DISPOSAL_METHOD: Record<DisposalMethod, string> = {
  sold: 'Sold',
  scrapped: 'Scrapped',
  donated: 'Donated',
  lost: 'Lost',
  written_off: 'Written off',
}

export const TICKET_STATUS: Record<TicketStatus, Tagged> = {
  open: { label: 'Open', tone: 'warning' },
  in_progress: { label: 'In progress', tone: 'info' },
  resolved: { label: 'Resolved', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

export const TICKET_KIND: Record<TicketKind, string> = {
  breakdown: 'Breakdown',
  preventive: 'Preventive',
  inspection: 'Inspection',
}

export const TICKET_PRIORITY: Record<TicketPriority, Tagged> = {
  low: { label: 'Low', tone: 'neutral' },
  medium: { label: 'Medium', tone: 'info' },
  high: { label: 'High', tone: 'danger' },
}

export const SCHEDULE_STATE: Record<ScheduleState, Tagged> = {
  overdue: { label: 'Overdue', tone: 'danger' },
  due_soon: { label: 'Due soon', tone: 'warning' },
  scheduled: { label: 'Scheduled', tone: 'neutral' },
}

export const REQUISITION_STATUS: Record<RequisitionStatus, Tagged> = {
  pending: { label: 'Waiting for approval', tone: 'warning' },
  approved: { label: 'Approved, to issue', tone: 'info' },
  rejected: { label: 'Rejected', tone: 'danger' },
  issued: { label: 'Issued', tone: 'success' },
  partly_issued: { label: 'Partly issued', tone: 'info' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

export const MOVEMENT_KIND: Record<MovementKind, Tagged> = {
  receipt: { label: 'Received', tone: 'success' },
  issue: { label: 'Issued', tone: 'info' },
  return: { label: 'Returned', tone: 'neutral' },
  adjustment: { label: 'Adjusted', tone: 'warning' },
}

export const ADJUSTMENT_REASON: Record<AdjustmentReason, string> = {
  damaged: 'Damaged',
  expired: 'Expired',
  count_correction: 'Count correction',
  returned: 'Returned to store',
  other: 'Other',
}

export const STOCK_UNIT: Record<StockUnit, string> = {
  pcs: 'Pieces',
  box: 'Boxes',
  pack: 'Packs',
  ream: 'Reams',
  kg: 'Kilograms',
  g: 'Grams',
  litre: 'Litres',
  ml: 'Millilitres',
  set: 'Sets',
  pair: 'Pairs',
  roll: 'Rolls',
  bottle: 'Bottles',
}

export const CATEGORY_KIND: Record<CategoryKind, string> = {
  asset: 'Asset',
  stock: 'Stock',
}

export const LOCATION_KIND: Record<LocationKind, string> = {
  classroom: 'Classroom',
  lab: 'Lab',
  office: 'Office',
  staff_room: 'Staff room',
  store: 'Store',
  library: 'Library',
  hall: 'Hall',
  ground: 'Ground',
  other: 'Other',
}

export const DEPRECIATION_METHOD: Record<DepreciationMethod, string> = {
  straight_line: 'Straight line',
  written_down: 'Written down value',
}

export const AUDIT_FINDING: Record<AuditItemFinding, Tagged> = {
  found: { label: 'Found', tone: 'success' },
  misplaced: { label: 'Misplaced', tone: 'warning' },
  not_available: { label: 'Not available in records', tone: 'info' },
  unknown: { label: 'Unknown tag', tone: 'danger' },
  missing: { label: 'Missing', tone: 'danger' },
}

export const GROUP_BY_LABEL: Record<GroupBy, string> = {
  category: 'Category',
  location: 'Location',
  department: 'Department',
  custodian: 'Custodian',
  status: 'Status',
}

export const EVENT_KIND: Record<AssetEventKind, Tagged> = {
  registered: { label: 'Registered', tone: 'info' },
  edited: { label: 'Details edited', tone: 'neutral' },
  allocated: { label: 'Allocated', tone: 'success' },
  acknowledged: { label: 'Received by the person', tone: 'success' },
  returned: { label: 'Returned to store', tone: 'neutral' },
  transfer_requested: { label: 'Transfer requested', tone: 'warning' },
  transferred: { label: 'Transferred', tone: 'info' },
  maintenance_opened: { label: 'Maintenance ticket opened', tone: 'warning' },
  maintenance_closed: { label: 'Maintenance ticket closed', tone: 'success' },
  condition_changed: { label: 'Condition changed', tone: 'neutral' },
  audited: { label: 'Verified in audit', tone: 'info' },
  marked_lost: { label: 'Marked lost', tone: 'danger' },
  found: { label: 'Found', tone: 'success' },
  disposal_requested: { label: 'Disposal requested', tone: 'warning' },
  disposed: { label: 'Disposed', tone: 'neutral' },
}

export function options<T extends string>(labels: Record<T, string | Tagged>): ComboboxOption[] {
  return (Object.keys(labels) as T[]).map((value) => {
    const entry = labels[value]
    return { value, label: typeof entry === 'string' ? entry : entry.label }
  })
}

export const ASSET_STATUS_OPTIONS = options(ASSET_STATUS)
export const ASSET_CONDITION_OPTIONS = options(ASSET_CONDITION)
export const WARRANTY_OPTIONS = options(WARRANTY_STATE)
export const FUNDING_OPTIONS = options(FUNDING_SOURCE)
export const ASSIGNEE_TYPE_OPTIONS = options(ASSIGNEE_TYPE)
export const STOCK_UNIT_OPTIONS = (Object.keys(STOCK_UNIT) as StockUnit[]).map((unit) => ({
  value: unit,
  label: `${STOCK_UNIT[unit]} (${unit})`,
}))

const rupeeFormat = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})
const wholeRupeeFormat = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export const money = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : rupeeFormat.format(value)

export const wholeMoney = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : wholeRupeeFormat.format(Math.round(value))

export const qty = (value: number | null | undefined, unit?: string) => {
  if (value === null || value === undefined) return '—'
  const text = value.toLocaleString('en-IN', { maximumFractionDigits: 2 })
  return unit ? `${text} ${unit}` : text
}

export const assigneeText = (assignee: Assignee) =>
  assignee.detail ? `${assignee.name} · ${assignee.detail}` : assignee.name

export const today = () => {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export const toNumber = (value: string | undefined | null) => {
  const text = (value ?? '').trim()
  if (!text) return null
  const number = Number(text)
  return Number.isFinite(number) ? number : null
}

export const blankToNull = (value: string | undefined | null) => {
  const text = (value ?? '').trim()
  return text ? text : null
}

export const blankToUndefined = (value: string | undefined | null) => {
  const text = (value ?? '').trim()
  return text ? text : undefined
}

export const idOrUndefined = (value: string | undefined | null) =>
  value ? Number(value) : undefined

export const idOrNull = (value: string | undefined | null) => (value ? Number(value) : null)

export const stringId = (value: number | null | undefined) =>
  value === null || value === undefined ? undefined : String(value)

export function reportError(error: unknown) {
  alerts.error(toApiError(error).message)
}

export function openInventoryFile(url: string, params?: QueryParams) {
  void openFile(url, params).catch(reportError)
}

export async function downloadInventoryFile(url: string, name: string, params?: QueryParams) {
  try {
    await downloadFile(url, name, params)
  } catch (error) {
    reportError(error)
  }
}

export interface TargetValue {
  assignee_type: AssigneeType
  user_id?: string
  department_id?: string
  location_id?: string
}

export function targetError(value: TargetValue) {
  if (value.assignee_type === 'staff' && !value.user_id) return 'Choose the staff member'
  if (value.assignee_type === 'department' && !value.department_id) return 'Choose the department'
  if (value.assignee_type === 'location' && !value.location_id) return 'Choose the location'
  return undefined
}

export function targetInput(value: TargetValue) {
  return {
    assignee_type: value.assignee_type,
    user_id: value.assignee_type === 'staff' ? idOrUndefined(value.user_id) : undefined,
    department_id:
      value.assignee_type === 'department' ? idOrUndefined(value.department_id) : undefined,
    location_id: value.assignee_type === 'location' ? idOrUndefined(value.location_id) : undefined,
  }
}
