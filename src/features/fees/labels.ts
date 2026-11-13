import type { BadgeTone } from '@/components/ui/badge'
import { toApiError } from '@/lib/api/errors'
import { alerts } from '@/lib/alerts'
import { openFile } from '@/lib/files'
import { receiptUrl, type InvoiceStatus, type PaymentMode, type StudentFeeStatus } from './api'

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
}

export const MODE_OPTIONS = (Object.keys(PAYMENT_MODES) as PaymentMode[]).map((mode) => ({
  value: mode,
  label: PAYMENT_MODES[mode],
}))

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
