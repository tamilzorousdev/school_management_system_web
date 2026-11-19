import type { BadgeTone } from '@/components/ui/badge'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { openFile } from '@/lib/files'
import { voucherUrl, type AccountKind, type AccountPaymentMode, type EntryStatus } from './api'

export const KIND_LABEL: Record<AccountKind, string> = { expense: 'Expense', income: 'Income' }

export const PAYMENT_MODE: Record<AccountPaymentMode, string> = {
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
  bank_transfer: 'Bank transfer',
  cheque: 'Cheque',
}

export const PAYMENT_MODE_OPTIONS = (Object.keys(PAYMENT_MODE) as AccountPaymentMode[]).map(
  (value) => ({ value, label: PAYMENT_MODE[value] })
)

export const STATUS: Record<EntryStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Waiting for approval', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  void: { label: 'Void', tone: 'neutral' },
}

export const STATUS_OPTIONS = (Object.keys(STATUS) as EntryStatus[]).map((value) => ({
  value,
  label: STATUS[value].label,
}))

export { rupees } from '@/features/fees/labels'

export function openVoucher(id: number) {
  void openFile(voucherUrl(id)).catch((error: unknown) => alerts.error(toApiError(error).message))
}
