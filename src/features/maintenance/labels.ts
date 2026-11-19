import { z } from 'zod'
import type { BadgeTone } from '@/components/ui/badge'
import { SEVERITY } from '@/features/fleet/labels'
import { formatDate, formatNumber } from '@/lib/format'
import type {
  CheckState,
  DueStatus,
  ExpenseCategory,
  FuelStatus,
  LogType,
  PaymentMode,
  ServiceCategory,
  TicketKind,
  TicketSeverity,
  TicketSource,
  Ticket,
  TicketStatus,
  VendorKind,
} from './api'

export const TICKET_STATUS: Record<TicketStatus, { label: string; tone: BadgeTone }> = {
  open: { label: 'Open', tone: 'danger' },
  in_progress: { label: 'In progress', tone: 'warning' },
  done: { label: 'Done', tone: 'success' },
}

export const TICKET_SOURCE: Record<TicketSource, { label: string; tone: BadgeTone }> = {
  obd: { label: 'OBD', tone: 'info' },
  manual: { label: 'Manual', tone: 'neutral' },
  driver: { label: 'Driver', tone: 'warning' },
}

export const TICKET_KIND: Record<TicketKind, { label: string; tone: BadgeTone }> = {
  service: { label: 'Service', tone: 'info' },
  repair: { label: 'Repair', tone: 'warning' },
}

export const SERVICE_CATEGORY: Record<ServiceCategory, string> = {
  engine_oil: 'Engine oil',
  tyres: 'Tyres',
  brakes: 'Brakes',
  battery: 'Battery',
  ac: 'AC',
  body: 'Body work',
  electrical: 'Electrical',
  general_service: 'General service',
  other: 'Other',
}

export const EXPENSE_CATEGORY: Record<ExpenseCategory, string> = {
  tyres: 'Tyres',
  insurance: 'Insurance',
  fitness: 'Fitness certificate',
  permit: 'Permit',
  puc: 'PUC certificate',
  road_tax: 'Road tax',
  rc: 'RC renewal',
  speed_governor: 'Speed governor',
  fire_extinguisher: 'Fire extinguisher',
  first_aid: 'First aid kit',
  fine: 'Fine',
  toll: 'Toll',
  parking: 'Parking',
  cleaning: 'Cleaning',
  other: 'Other',
}

export const DOCUMENT_CATEGORIES: ExpenseCategory[] = [
  'insurance',
  'fitness',
  'permit',
  'puc',
  'road_tax',
  'rc',
  'speed_governor',
  'fire_extinguisher',
  'first_aid',
]

export const PAYMENT_MODE: Record<PaymentMode, string> = {
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
  fuel_card: 'Fuel card',
  credit: 'On credit',
  driver_paid: 'Paid by driver',
}

export const FUEL_STATUS: Record<FuelStatus, { label: string; tone: BadgeTone }> = {
  approved: { label: 'Approved', tone: 'success' },
  pending: { label: 'Waiting for check', tone: 'warning' },
  rejected: { label: 'Rejected', tone: 'danger' },
}

export const DUE_STATUS: Record<DueStatus, { label: string; tone: BadgeTone }> = {
  ok: { label: 'OK', tone: 'success' },
  due_soon: { label: 'Due soon', tone: 'warning' },
  overdue: { label: 'Overdue', tone: 'danger' },
}

export const CHECK_STATE: Record<CheckState, { label: string; tone: BadgeTone }> = {
  ok: { label: 'All OK', tone: 'success' },
  failed: { label: 'Problems found', tone: 'warning' },
  blocked: { label: 'Blocked', tone: 'danger' },
}

export const VENDOR_KIND: Record<VendorKind, string> = {
  garage: 'Garage',
  fuel_station: 'Fuel station',
  other: 'Other vendor',
}

export const LOG_TYPE: Record<LogType, { label: string; tone: BadgeTone }> = {
  fuel: { label: 'Fuel', tone: 'info' },
  service: { label: 'Service', tone: 'success' },
  repair: { label: 'Repair', tone: 'warning' },
  expense: { label: 'Expense', tone: 'neutral' },
  check: { label: 'Pre-trip check', tone: 'neutral' },
}

const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }))

const toneOptions = (labels: Record<string, { label: string }>) =>
  Object.entries(labels).map(([value, item]) => ({ value, label: item.label }))

export const TICKET_STATUS_OPTIONS = toneOptions(TICKET_STATUS)
export const TICKET_KIND_OPTIONS = toneOptions(TICKET_KIND)
export const SERVICE_CATEGORY_OPTIONS = toOptions(SERVICE_CATEGORY)
export const EXPENSE_CATEGORY_OPTIONS = toOptions(EXPENSE_CATEGORY)
export const PAYMENT_MODE_OPTIONS = toOptions(PAYMENT_MODE)
export const FUEL_STATUS_OPTIONS = toneOptions(FUEL_STATUS)
export const DUE_STATUS_OPTIONS = toneOptions(DUE_STATUS)
export const CHECK_STATE_OPTIONS = toneOptions(CHECK_STATE)
export const VENDOR_KIND_OPTIONS = toOptions(VENDOR_KIND)
export const LOG_TYPE_OPTIONS = toneOptions(LOG_TYPE)

export const TICKET_SOURCE_OPTIONS = [
  { value: 'obd', label: 'From OBD' },
  { value: 'manual', label: 'Added by hand' },
  { value: 'driver', label: 'Reported by driver' },
]

export const SEVERITY_OPTIONS = (Object.keys(SEVERITY) as TicketSeverity[]).map((value) => ({
  value,
  label: SEVERITY[value].label,
}))

export const rupees = (value: number | null | undefined) =>
  value === null || value === undefined
    ? '—'
    : `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

export const optionalNumber = (value: string) => {
  const text = value.trim()
  return text === '' ? undefined : Number(text)
}

export const numberText = (min: number, max: number, message: string) =>
  z
    .string()
    .trim()
    .refine((value) => {
      if (value === '') return true
      const number = Number(value)
      return Number.isFinite(number) && number >= min && number <= max
    }, message)

export const wholeText = (min: number, max: number, message: string) =>
  z
    .string()
    .trim()
    .refine((value) => {
      if (value === '') return true
      const number = Number(value)
      return Number.isInteger(number) && number >= min && number <= max
    }, message)

export const daysText = (days: number | null) => {
  if (days === null) return null
  if (days < 0) return `${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} late`
  if (days === 0) return 'Today'
  return `${days} ${days === 1 ? 'day' : 'days'} left`
}

export const kmText = (km: number | null) => {
  if (km === null) return null
  const rounded = Math.round(km)
  return rounded < 0
    ? `${Math.abs(rounded).toLocaleString('en-IN')} km over`
    : `${rounded.toLocaleString('en-IN')} km left`
}

export function warrantyText(ticket: Ticket) {
  const claim = ticket.warranty_claim
  if (!claim) return null
  const until = [
    claim.until ? `until ${formatDate(claim.until)}` : null,
    claim.until_km !== null ? `up to ${formatNumber(claim.until_km, 0, 'km')}` : null,
  ]
    .filter(Boolean)
    .join(' or ')
  return `The same part was fitted in ticket #${claim.ticket_id} and is still under warranty${until ? ` ${until}` : ''}.`
}
