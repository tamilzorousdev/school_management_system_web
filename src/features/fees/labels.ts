import type { BadgeTone } from '@/components/ui/badge'
import { toApiError } from '@/lib/api/errors'
import { alerts } from '@/lib/alerts'
import { openFile } from '@/lib/files'
import {
  advanceReceiptUrl,
  receiptUrl,
  type AwardStatus,
  type BenefitCalcType,
  type BenefitKind,
  type BenefitType,
  type FeeAuditAction,
  type FeeRequestKind,
  type FeeRequestStatus,
  type FineStatus,
  type FeeAuditEntity,
  type FeeFrequency,
  type InvoiceStatus,
  type OnlineOrderStatus,
  type PaymentMode,
  type PaymentStatus,
  type PlanVersionStatus,
  type StudentFeeStatus,
} from './api'

export const INVOICE_STATUS: Record<InvoiceStatus, { label: string; tone: BadgeTone }> = {
  unpaid: { label: 'Unpaid', tone: 'warning' },
  partly_paid: { label: 'Partly paid', tone: 'info' },
  paid: { label: 'Paid', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

export const STUDENT_FEE_STATUS: Record<StudentFeeStatus, { label: string; tone: BadgeTone }> = {
  paid: { label: 'Paid', tone: 'success' },
  partly_paid: { label: 'Partly paid', tone: 'info' },
  due: { label: 'Due', tone: 'warning' },
  overdue: { label: 'Overdue', tone: 'danger' },
}

export const PAYMENT_MODES: Record<PaymentMode, string> = {
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
  bank_transfer: 'Bank transfer',
  cheque: 'Cheque',
  online: 'Online (Razorpay)',
  credit: 'Advance credit',
}

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: BadgeTone }> = {
  success: { label: 'Received', tone: 'success' },
  reversed: { label: 'Reversed', tone: 'danger' },
}

export const PAYMENT_STATUS_OPTIONS = (Object.keys(PAYMENT_STATUS) as PaymentStatus[]).map(
  (status) => ({ value: status, label: PAYMENT_STATUS[status].label })
)

export const FREQUENCIES: Record<FeeFrequency, string> = {
  one_time: 'One time',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  half_yearly: 'Half-yearly',
  yearly: 'Yearly',
  per_term: 'Per term',
  custom: 'As per plan',
}

export const FREQUENCY_OPTIONS = (Object.keys(FREQUENCIES) as FeeFrequency[]).map((value) => ({
  value,
  label: FREQUENCIES[value],
}))

export const AUDIT_ENTITIES: Record<FeeAuditEntity, string> = {
  fee_head: 'Fee head',
  fee_plan: 'Fee plan',
  fee_invoice: 'Invoice',
  fee_payment: 'Payment',
  invoice_run: 'Invoice run',
  fee_benefit: 'Concession or scholarship',
  benefit_award: 'Given to a student',
  fee_request: 'Approval request',
  fee_refund: 'Refund',
  fee_settings: 'Late fee settings',
  fee_fine: 'Fine',
  fine_type: 'Fine type',
}

export const AUDIT_ACTIONS: Record<FeeAuditAction, { label: string; tone: BadgeTone }> = {
  created: { label: 'Added', tone: 'success' },
  updated: { label: 'Changed', tone: 'info' },
  deleted: { label: 'Deleted', tone: 'danger' },
  replaced: { label: 'Plan saved', tone: 'info' },
  generated: { label: 'Invoices raised', tone: 'info' },
  discounted: { label: 'Discount', tone: 'warning' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
  paid: { label: 'Paid', tone: 'success' },
  reversed: { label: 'Reversed', tone: 'danger' },
  submitted: { label: 'Sent for approval', tone: 'info' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Sent back', tone: 'warning' },
  discarded: { label: 'Draft discarded', tone: 'neutral' },
  awarded: { label: 'Given', tone: 'success' },
  revoked: { label: 'Withdrawn', tone: 'danger' },
  requested: { label: 'Asked for approval', tone: 'info' },
  withdrawn: { label: 'Request withdrawn', tone: 'neutral' },
  refunded: { label: 'Refunded', tone: 'warning' },
  late_fee: { label: 'Late fee', tone: 'warning' },
}

export const AUDIT_ENTITY_OPTIONS = (Object.keys(AUDIT_ENTITIES) as FeeAuditEntity[]).map(
  (value) => ({ value, label: AUDIT_ENTITIES[value] })
)

export const AUDIT_ACTION_OPTIONS = (Object.keys(AUDIT_ACTIONS) as FeeAuditAction[]).map(
  (value) => ({ value, label: AUDIT_ACTIONS[value].label })
)

export function auditValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.length ? value.map(auditValue).join(', ') : 'None'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function newIdempotencyKey() {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
  return `pay-${random}`
}

export const MODE_OPTIONS = (Object.keys(PAYMENT_MODES) as PaymentMode[]).map((mode) => ({
  value: mode,
  label: PAYMENT_MODES[mode],
}))

export const MANUAL_MODE_OPTIONS = MODE_OPTIONS.filter(
  (option) => option.value !== 'online' && option.value !== 'credit'
)

export const STATUS_OPTIONS = (Object.keys(INVOICE_STATUS) as InvoiceStatus[]).map((status) => ({
  value: status,
  label: INVOICE_STATUS[status].label,
}))

export const MAX_AMOUNT = 10000000

const rupeeFormat = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const wholeRupeeFormat = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export const rupees = (value: number) => rupeeFormat.format(value)

export const wholeRupees = (value: number) => wholeRupeeFormat.format(Math.round(value))

export const round2 = (value: number) => Math.round(value * 100) / 100

export function amountError(text: string, max: number, label = 'amount') {
  const value = text.trim()
  if (!value) return `Enter the ${label}`
  const number = Number(value)
  if (Number.isNaN(number) || number < 0) return 'Enter an amount of 0 or more'
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return 'Use at most 2 decimal places'
  if (number > max) return `Enter an amount up to ${rupees(max)}`
  return undefined
}

export function formErrors(error: unknown, codeFields: Record<string, string> = {}) {
  const apiError = toApiError(error)
  const fields: Record<string, string> = Object.fromEntries(
    apiError.fieldErrors.map((item) => [item.field, item.message])
  )
  const field = codeFields[apiError.code]
  if (field) fields[field] = apiError.message
  if (!Object.keys(fields).length) alerts.error(apiError.message)
  return fields
}

export const invoicesText = (count: number) => `${count} ${count === 1 ? 'invoice' : 'invoices'}`

export function openReceipt(paymentId: number) {
  void openFile(receiptUrl(paymentId)).catch((error: unknown) =>
    alerts.error(error instanceof Error ? error.message : 'Could not open the receipt')
  )
}

export function openAdvanceReceipt(collectionId: number) {
  void openFile(advanceReceiptUrl(collectionId)).catch((error: unknown) =>
    alerts.error(error instanceof Error ? error.message : 'Could not open the receipt')
  )
}

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
]

const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function belowHundred(n: number): string {
  if (n < 20) return ONES[n]
  const ten = Math.floor(n / 10)
  const one = n % 10
  return `${TENS[ten]}${one ? ` ${ONES[one]}` : ''}`
}

function belowThousand(n: number): string {
  const hundred = Math.floor(n / 100)
  const rest = n % 100
  if (!hundred) return belowHundred(rest)
  return `${ONES[hundred]} Hundred${rest ? ` and ${belowHundred(rest)}` : ''}`
}

export function amountInWords(value: number): string {
  let rest = Math.floor(value)
  const paise = Math.round((value - rest) * 100)
  if (rest === 0 && paise === 0) return 'Rupees Zero Only'
  const parts: string[] = []
  const scales = [
    [10000000, 'Crore'],
    [100000, 'Lakh'],
    [1000, 'Thousand'],
  ] as const
  for (const [size, name] of scales) {
    const count = Math.floor(rest / size)
    if (count) {
      parts.push(`${count >= 100 ? belowThousand(count) : belowHundred(count)} ${name}`)
    }
    rest %= size
  }
  if (rest) parts.push(belowThousand(rest))
  const rupeesText = parts.length ? `Rupees ${parts.join(' ')}` : 'Rupees Zero'
  return `${rupeesText}${paise ? ` and ${belowHundred(paise)} Paise` : ''} Only`
}

export const PLAN_VERSION_STATUS: Record<PlanVersionStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  pending_approval: { label: 'Waiting for approval', tone: 'warning' },
  published: { label: 'In use', tone: 'success' },
  superseded: { label: 'Replaced', tone: 'neutral' },
}

export const BENEFIT_KINDS: Record<BenefitKind, string> = {
  concession: 'Concession',
  scholarship: 'Scholarship',
}

export const BENEFIT_KIND_OPTIONS = (Object.keys(BENEFIT_KINDS) as BenefitKind[]).map((value) => ({
  value,
  label: BENEFIT_KINDS[value],
}))

export const BENEFIT_TYPES: Record<BenefitType, string> = {
  sibling: 'Sibling',
  staff_child: 'Staff child',
  merit: 'Merit',
  sports: 'Sports',
  financial: 'Financial need',
  management: 'Management quota',
  government: 'Government',
  institution: 'School funded',
  trust: 'Trust',
  private: 'Private sponsor',
  other: 'Other',
}

export const TYPES_BY_KIND: Record<BenefitKind, BenefitType[]> = {
  concession: ['sibling', 'staff_child', 'merit', 'sports', 'financial', 'management', 'other'],
  scholarship: ['government', 'institution', 'trust', 'private', 'other'],
}

export const AWARD_STATUS: Record<AwardStatus, { label: string; tone: BadgeTone }> = {
  active: { label: 'Active', tone: 'success' },
  revoked: { label: 'Withdrawn', tone: 'neutral' },
}

export const AWARD_STATUS_OPTIONS = (Object.keys(AWARD_STATUS) as AwardStatus[]).map((value) => ({
  value,
  label: AWARD_STATUS[value].label,
}))

export function benefitValue(benefit: { calc_type: BenefitCalcType; value: number }): string {
  return benefit.calc_type === 'percent'
    ? `${Number(benefit.value)}%`
    : `${rupees(benefit.value)} a year`
}

export const REQUEST_KINDS: Record<FeeRequestKind, string> = {
  discount: 'Discount',
  cancel: 'Cancel invoice',
  reversal: 'Reverse payment',
  refund: 'Refund',
  reschedule: 'New due date',
  write_off: 'Write-off',
}

export const REQUEST_KIND_OPTIONS = (Object.keys(REQUEST_KINDS) as FeeRequestKind[]).map(
  (value) => ({ value, label: REQUEST_KINDS[value] })
)

export const ONLINE_ORDER_STATUS: Record<OnlineOrderStatus, { label: string; tone: BadgeTone }> = {
  created: { label: 'Not finished', tone: 'warning' },
  paid: { label: 'Paid', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
}

export const ONLINE_ORDER_STATUS_OPTIONS = (
  Object.keys(ONLINE_ORDER_STATUS) as OnlineOrderStatus[]
).map((value) => ({ value, label: ONLINE_ORDER_STATUS[value].label }))

export const REQUEST_STATUS: Record<FeeRequestStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Waiting', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral' },
}

export const FINE_STATUS: Record<FineStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Waiting', tone: 'warning' },
  approved: { label: 'Charged', tone: 'success' },
  rejected: { label: 'Not approved', tone: 'danger' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral' },
}

export const FINE_STATUS_OPTIONS = [
  ...(Object.keys(FINE_STATUS) as FineStatus[]).map((value) => ({
    value,
    label: FINE_STATUS[value].label,
  })),
  { value: 'all', label: 'All fines' },
]

export const REQUEST_STATUS_OPTIONS = [
  ...(Object.keys(REQUEST_STATUS) as FeeRequestStatus[]).map((value) => ({
    value,
    label: REQUEST_STATUS[value].label,
  })),
  { value: 'all', label: 'All requests' },
]

export const TRANSPORT_FEE_STATUS: Record<
  'paid' | 'pending' | 'overdue' | 'not_billed',
  { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }
> = {
  paid: { label: 'Paid', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  overdue: { label: 'Overdue', tone: 'danger' },
  not_billed: { label: 'Not billed yet', tone: 'neutral' },
}
