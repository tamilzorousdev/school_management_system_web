import type { BadgeTone } from '@/components/ui/badge'
import { today } from '@/features/attendance/labels'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import type { QueryParams } from '@/lib/api/client'
import { downloadFile, openFile } from '@/lib/files'
import { can, useMe } from '@/features/auth/api'
import {
  AUDIT_FINDINGS,
  libraryFiles,
  type AuditItemFinding,
  type CopyCondition,
  type CopySource,
  type CopyStatus,
  type FineKind,
  type FineStatus,
  type FollowUpAction,
  type IssuePurpose,
  type IssueStatus,
  type LoanState,
  type MemberStatus,
  type MemberType,
  type PaymentMode,
  type VisitKind,
  type VisitPurpose,
  type Loan,
} from './api'

type Labelled = { label: string; tone: BadgeTone }

export const COPY_STATUS: Record<CopyStatus, Labelled> = {
  available: { label: 'Available', tone: 'success' },
  issued: { label: 'Issued', tone: 'info' },
  lost: { label: 'Lost', tone: 'danger' },
  damaged: { label: 'Damaged', tone: 'warning' },
  in_repair: { label: 'In repair', tone: 'warning' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral' },
}

export const COPY_CONDITION: Record<CopyCondition, string> = {
  new: 'New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
}

export const COPY_SOURCE: Record<CopySource, string> = {
  purchase: 'Purchase',
  donation: 'Donation',
  other: 'Other',
}

export const LOAN_STATE: Record<LoanState, Labelled> = {
  on_loan: { label: 'On loan', tone: 'info' },
  due_soon: { label: 'Due soon', tone: 'warning' },
  due_today: { label: 'Due today', tone: 'warning' },
  overdue: { label: 'Overdue', tone: 'danger' },
  returned: { label: 'Returned', tone: 'success' },
  lost: { label: 'Lost', tone: 'danger' },
}

export const ISSUE_STATUS: Record<IssueStatus, string> = {
  issued: 'Issued',
  returned: 'Returned',
  lost: 'Lost',
}

export const ISSUE_PURPOSE: Record<IssuePurpose, string> = {
  personal: 'Personal',
  class_set: 'Class set',
}

export const FOLLOW_UP_ACTION: Record<FollowUpAction, string> = {
  called_parent: 'Called the parent',
  reminded_student: 'Reminded the student',
  reminded_staff: 'Reminded the staff member',
  told_class_teacher: 'Told the class teacher',
  promised_date: 'Promised a return date',
  other: 'Other',
}

export const MEMBER_TYPE: Record<MemberType, string> = {
  student: 'Student',
  staff: 'Staff',
}

export const MEMBER_STATUS: Record<MemberStatus, Labelled> = {
  active: { label: 'Active', tone: 'success' },
  suspended: { label: 'Suspended', tone: 'danger' },
  left: { label: 'Left', tone: 'neutral' },
}

export const FINE_KIND: Record<FineKind, string> = {
  overdue: 'Late return',
  lost: 'Lost book',
  damage: 'Damage',
  other: 'Other',
}

export const FINE_STATUS: Record<FineStatus, Labelled> = {
  unpaid: { label: 'Unpaid', tone: 'danger' },
  partly_paid: { label: 'Partly paid', tone: 'warning' },
  paid: { label: 'Paid', tone: 'success' },
  waived: { label: 'Waived', tone: 'neutral' },
}

export const PAYMENT_MODE: Record<PaymentMode, string> = {
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
  bank_transfer: 'Bank transfer',
  cheque: 'Cheque',
}

export const VISIT_KIND: Record<VisitKind, string> = {
  walk_in: 'Walk-in',
  period: 'Library period',
}

export const VISIT_PURPOSE: Record<VisitPurpose, string> = {
  read: 'Read',
  borrow: 'Borrow',
  return: 'Return',
  study: 'Study',
  period: 'Library period',
  other: 'Other',
}

export const AUDIT_FINDING: Record<AuditItemFinding, Labelled> = {
  found: { label: 'Found', tone: 'success' },
  misplaced: { label: 'Misplaced', tone: 'warning' },
  was_issued: { label: 'Shown as issued', tone: 'warning' },
  was_lost: { label: 'Shown as lost', tone: 'info' },
  unknown: { label: 'Not in catalogue', tone: 'danger' },
  missing: { label: 'Missing', tone: 'danger' },
}

export const AUDIT_FINDING_KEYS: AuditItemFinding[] = [...AUDIT_FINDINGS, 'missing']

export function badgeOf(map: Record<string, Labelled>, value: string): Labelled {
  return map[value] ?? { label: value.replace(/_/g, ' '), tone: 'neutral' }
}

export function labelOf(map: Record<string, string>, value: string) {
  return map[value] ?? value.replace(/_/g, ' ')
}

export const optionsOf = (map: Record<string, string | Labelled>) =>
  Object.entries(map).map(([value, item]) => ({
    value,
    label: typeof item === 'string' ? item : item.label,
  }))

export const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`

export { today }

export function errorText(error: unknown) {
  return toApiError(error).message
}

export function fieldErrors(error: unknown) {
  const apiError = toApiError(error)
  return Object.fromEntries(apiError.fieldErrors.map((item) => [item.field, item.message]))
}

const report = (error: unknown) => alerts.error(errorText(error))

export function openLabels(query: QueryParams) {
  void openFile(libraryFiles.labels, query).catch(report)
}

export function downloadLabels(query: QueryParams) {
  return downloadFile(libraryFiles.labels, `library-labels-${today()}.pdf`, query).catch(report)
}

export function openFineReceipt(paymentId: number) {
  void openFile(libraryFiles.receipt(paymentId)).catch(report)
}

export function downloadFineReceipt(paymentId: number, receiptNo: string) {
  return downloadFile(libraryFiles.receipt(paymentId), `Library-Receipt-${receiptNo}.pdf`).catch(
    report
  )
}

export function downloadImportTemplate() {
  return downloadFile(libraryFiles.importTemplate, 'library-book-import.xlsx').catch(report)
}

export function downloadIssuesCsv(query: QueryParams) {
  return downloadFile(
    libraryFiles.issuesExport,
    `library-transactions-${today()}.csv`,
    query
  ).catch(report)
}

export type LoanAction = 'renew' | 'lost' | 'found' | 'return' | 'follow-up'

export function loanActions(loan: Loan): LoanAction[] {
  if (loan.status === 'issued') {
    const list: LoanAction[] = ['return', 'renew']
    if (loan.state === 'overdue') list.push('follow-up')
    list.push('lost')
    return list
  }
  if (loan.status === 'lost') return ['found']
  return []
}

export function useCanPickClasses() {
  return can(useMe().data, 'schools.view')
}
