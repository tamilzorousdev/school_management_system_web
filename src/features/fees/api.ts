import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/api/client'

export type InvoiceStatus = 'unpaid' | 'partly_paid' | 'paid' | 'cancelled'
export type StudentFeeStatus = 'paid' | 'partly_paid' | 'due' | 'overdue'
export type PaymentMode = 'cash' | 'upi' | 'card' | 'bank_transfer' | 'cheque' | 'online' | 'credit'
export type ManualPaymentMode = Exclude<PaymentMode, 'online' | 'credit'>
export type PaymentStatus = 'success' | 'reversed'
export type FeeFrequency =
  'one_time' | 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'per_term' | 'custom'

export type FeeAuditEntity =
  | 'fee_head'
  | 'fee_plan'
  | 'fee_invoice'
  | 'fee_payment'
  | 'invoice_run'
  | 'fee_benefit'
  | 'benefit_award'
  | 'fee_request'
  | 'fee_refund'
  | 'fee_settings'
  | 'fee_fine'
  | 'fine_type'
export type FeeAuditAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'replaced'
  | 'generated'
  | 'discounted'
  | 'cancelled'
  | 'paid'
  | 'reversed'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'discarded'
  | 'awarded'
  | 'revoked'
  | 'requested'
  | 'withdrawn'
  | 'refunded'
  | 'late_fee'

export type FeeRequestKind =
  'discount' | 'cancel' | 'reversal' | 'refund' | 'reschedule' | 'write_off'
export type FeeRequestStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn'
export type LateFeeType = 'none' | 'flat' | 'percent'

export interface FeeRequest {
  id: number
  kind: FeeRequestKind
  status: FeeRequestStatus
  invoice: {
    id: number
    invoice_no: string
    installment: string
    gross: number
    total: number
    paid: number
    balance: number
    status: InvoiceStatus
  }
  payment: { id: number; receipt_no: string; amount: number; mode: string; paid_on: string } | null
  student: FeeStudentRef
  amount: number | null
  details: {
    discount?: number
    mode?: PaymentMode
    reference?: string | null
    paid_on?: string
    due_date?: string
    old_due_date?: string
  }
  reason: string
  requested_by: PersonRef | null
  requested_at: string
  decided_by: PersonRef | null
  decided_at: string | null
  decision_comment: string | null
}

export interface PendingRequest {
  id: number
  kind: FeeRequestKind
  amount: number | null
  details: FeeRequest['details']
  payment_id: number | null
  reason: string
  requested_by: PersonRef | null
  requested_at: string
}

export interface FeeRefund {
  id: number
  refund_no: string
  amount: number
  mode: PaymentMode
  reference: string | null
  paid_on: string
  reason: string
}

export interface RefundInput {
  amount: number
  mode: PaymentMode
  reference?: string
  paid_on?: string
  reason: string
}

export interface FeeRequestParams {
  page: number
  limit: number
  search?: string
  status?: FeeRequestStatus
  kind?: FeeRequestKind
  invoice_id?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface UpcomingInstallment {
  installment: string
  due_date: string
  amount: number
  lines: { head_name: string; amount: number }[]
}

export interface FeeSettings {
  grace_days: number
  late_fee_type: LateFeeType
  late_fee_value: number
  reminder_days: number
  updated_by: PersonRef | null
  updated_at: string | null
}

export interface PreviousDues {
  amount: number
  invoices: number
  academic_years: string[]
}

export type PlanVersionStatus = 'draft' | 'pending_approval' | 'published' | 'superseded'
export type BenefitKind = 'concession' | 'scholarship'
export type BenefitType =
  | 'sibling'
  | 'staff_child'
  | 'merit'
  | 'sports'
  | 'financial'
  | 'management'
  | 'government'
  | 'institution'
  | 'trust'
  | 'private'
  | 'other'
export type BenefitCalcType = 'percent' | 'fixed'
export type AwardStatus = 'active' | 'revoked'

export interface PersonRef {
  id: number
  name: string
}

export interface FeePlanVersionLine {
  fee_head_id: number
  head_name: string
  installment: string
  amount: number
  due_date: string
}

export interface FeePlanVersion {
  id: number
  version: number
  status: PlanVersionStatus
  lines: FeePlanVersionLine[]
  installments: InstallmentTotal[]
  total: number
  note: string | null
  created_by: PersonRef | null
  submitted_by: PersonRef | null
  submitted_at: string | null
  reviewed_by: PersonRef | null
  reviewed_at: string | null
  review_comment: string | null
  published_at: string | null
  updated_at: string
}

export interface FeeBenefit {
  id: number
  academic_year_id: number
  kind: BenefitKind
  name: string
  type: BenefitType
  calc_type: BenefitCalcType
  value: number
  fee_head_ids: number[]
  class_ids: number[]
  description: string | null
  is_active: boolean
  active_awards: number
  amount_given: number
  created_at: string
}

export interface FeeBenefitInput {
  kind: BenefitKind
  name: string
  type: BenefitType
  calc_type: BenefitCalcType
  value: number
  fee_head_ids: number[]
  class_ids: number[]
  description: string | null
  is_active: boolean
}

export interface BenefitListParams {
  page: number
  limit: number
  search?: string
  kind?: BenefitKind
  is_active?: boolean
  sort?: string
  order?: 'asc' | 'desc'
}

export interface FeeAward {
  id: number
  student: FeeStudentRef
  benefit: {
    id: number
    kind: BenefitKind
    name: string
    calc_type: BenefitCalcType
    value: number
  }
  status: AwardStatus
  reason: string | null
  awarded_by: PersonRef | null
  awarded_at: string
  revoked_at: string | null
  revoked_by: PersonRef | null
  revoke_reason: string | null
  amount_given: number
}

export interface AwardListParams {
  page: number
  limit: number
  search?: string
  benefit_id?: number
  kind?: BenefitKind
  student_id?: number
  status?: AwardStatus
  sort?: string
  order?: 'asc' | 'desc'
}

export interface AwardResult {
  awarded: number
  already_awarded: number
  items: FeeAward[]
}

export interface CopyPlanRow {
  class_id: number
  class_name: string
  status: 'drafted' | 'skipped'
  version: number | null
  lines: number
  left_out: number
  reason: string | null
}

export interface CopyPlanResult {
  drafted: number
  skipped: number
  classes: CopyPlanRow[]
}

export type FeeReportType =
  'classes' | 'heads' | 'installments' | 'benefits' | 'defaulters' | 'collections' | 'collectors'

export interface ReportColumn {
  key: string
  label: string
  kind: 'text' | 'money' | 'number' | 'percent' | 'date'
}

export type ReportValue = string | number | null

export interface FeeReport {
  title: string
  academic_year: string
  note: string | null
  from: string | null
  to: string | null
  columns: ReportColumn[]
  rows: Record<string, ReportValue>[]
  totals: Record<string, ReportValue> | null
}

export interface FeeReportParams {
  class_id?: number
  section_id?: number
  installment?: string
  kind?: BenefitKind
  overdue_only?: boolean
  from?: string
  to?: string
  received_by?: number
}

export interface CollectorOption {
  id: number
  name: string
}

export interface CollectionResult {
  collection_id: number | null
  amount: number
  applied_amount: number
  advance_amount: number
  advance_receipt_no: string | null
  credit_balance: number
  replayed: boolean
  payments: {
    id: number
    invoice_id: number
    invoice_no: string
    installment: string
    amount: number
    receipt_no: string
    mode: PaymentMode
  }[]
}

export interface InvoiceBenefit {
  benefit_id: number
  kind: BenefitKind
  name: string
  fee_head_id: number | null
  amount: number
}

export interface FeeAuditLog {
  id: number
  entity: FeeAuditEntity
  entity_id: number | null
  action: FeeAuditAction
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  reason: string | null
  user: { id: number; name: string } | null
  created_at: string
}

export interface FeeAuditParams {
  page: number
  limit: number
  search?: string
  entity?: FeeAuditEntity
  action?: FeeAuditAction
  from?: string
  to?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export interface InvoiceMismatch {
  invoice_id: number
  invoice_no: string
  student_id: number
  status: InvoiceStatus
  gross: number
  benefit: number
  discount: number
  total: number
  paid: number
  balance: number
  payments_total: number
}

export interface Reconciliation {
  invoices_checked: number
  mismatches: InvoiceMismatch[]
}

export interface FeeHead {
  id: number
  name: string
  code: string
  is_transport: boolean
  is_active: boolean
  description: string | null
  fee_group: string | null
  is_mandatory: boolean
  frequency: FeeFrequency
  is_refundable: boolean
  applicable_class_ids: number[]
  plan_lines: number
  created_at: string
}

export interface FeeHeadInput {
  name: string
  code: string
  is_transport: boolean
  is_active: boolean
  description: string | null
  fee_group: string | null
  is_mandatory: boolean
  frequency: FeeFrequency
  is_refundable: boolean
  applicable_class_ids: number[]
}

export interface InstallmentTotal {
  installment: string
  due_date: string
  amount: number
}

export interface FeePlanLine {
  id: number
  fee_head_id: number
  head_name: string
  installment: string
  amount: number
  due_date: string
}

export interface FeePlan {
  class_id: number
  class_name: string
  academic_year_id: number
  academic_year: string
  lines: FeePlanLine[]
  installments: InstallmentTotal[]
  total: number
  version: number | null
  draft: FeePlanVersion | null
}

export interface FeePlanSummary {
  class_id: number
  class_name: string
  student_count: number
  installments: InstallmentTotal[]
  total: number
  version: number | null
  draft_status: 'draft' | 'pending_approval' | null
}

export interface FeePlanLineInput {
  fee_head_id: number
  installment: string
  amount: number
  due_date: string
}

export interface GenerateInput {
  class_id?: number
  installment: string
  due_date?: string
}

export interface GenerateResult {
  installment: string
  classes: number
  created: number
  already_invoiced: number
  with_transport: number
  with_benefits: number
  benefit_amount: number
  total_amount: number
}

export interface FeeStudentRef {
  id: number
  full_name: string
  admission_no: string
  class_section: string | null
}

export interface InvoiceLine {
  id: number
  fee_head_id: number | null
  head_name: string
  description: string | null
  amount: number
}

export interface FeePayment {
  id: number
  receipt_no: string
  invoice_id: number
  invoice_no: string
  installment: string
  student: FeeStudentRef
  amount: number
  mode: PaymentMode
  reference: string | null
  paid_on: string
  received_by: string | null
  notes: string | null
  invoice_balance: number
  status: PaymentStatus
  reversed_at: string | null
  reversed_by: string | null
  reversal_reason: string | null
  created_at: string
}

export type InvoiceKind = 'fee' | 'fine'

export interface FeeInvoice {
  id: number
  invoice_no: string
  academic_year_id: number
  installment: string
  kind: InvoiceKind
  due_date: string
  student: FeeStudentRef
  class_id: number
  section_id: number | null
  gross: number
  benefit: number
  discount: number
  discount_reason: string | null
  original_due_date: string | null
  late_fee: number
  refunded: number
  total: number
  paid: number
  balance: number
  status: InvoiceStatus
  is_overdue: boolean
  days_overdue: number
  cancel_reason: string | null
  created_at: string
}

export interface FeeInvoiceDetail extends FeeInvoice {
  lines: InvoiceLine[]
  benefits: InvoiceBenefit[]
  refunds: FeeRefund[]
  pending_requests: PendingRequest[]
  payments: FeePayment[]
}

export interface FeeTotals {
  status: StudentFeeStatus
  total: number
  paid: number
  balance: number
  overdue_amount: number
  next_due_date: string | null
  last_payment: { date: string; amount: number } | null
}

export interface AdvanceReceipt {
  collection_id: number
  receipt_no: string
  amount: number
  collected: number
  mode: PaymentMode
  paid_on: string
}

export interface StudentFees extends FeeTotals {
  student: FeeStudentRef
  credit_balance: number
  previous_dues: PreviousDues
  invoices: FeeInvoiceDetail[]
  payments: FeePayment[]
  advances: AdvanceReceipt[]
  upcoming: UpcomingInstallment[]
}

export interface FeeInsights {
  academic_year: string
  invoices: number
  total_billed: number
  collected: number
  outstanding: number
  overdue_amount: number
  students_overdue: number
  todays_collection: number
  todays_payments: number
  todays_advance: number
  by_status: Record<Exclude<InvoiceStatus, 'cancelled'>, number>
  concessions: number
  discounts: number
  late_fees: number
  refunded: number
  pending_requests: number
}

export interface PaymentInput {
  amount: number
  mode: PaymentMode
  reference?: string
  paid_on?: string
  notes?: string
}

export interface PaymentSummary {
  count: number
  amount: number
  by_mode: { mode: PaymentMode; count: number; amount: number }[]
}

export interface InvoiceListParams {
  page: number
  limit: number
  search?: string
  status?: InvoiceStatus
  class_id?: number
  section_id?: number
  installment?: string
  overdue?: boolean
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaymentFilters {
  from?: string
  to?: string
  mode?: PaymentMode
  class_id?: number
  received_by?: number
}

export type OnlineOrderStatus = 'created' | 'paid' | 'failed'

export interface OnlineOrder {
  id: number
  gateway: string
  gateway_order_id: string
  gateway_payment_id: string | null
  status: OnlineOrderStatus
  amount: number
  invoice_id: number
  invoice_no: string
  student: FeeStudentRef
  failure_reason: string | null
  paid_at: string | null
  created_at: string
}

export interface OnlineOrderParams {
  page: number
  limit: number
  status?: OnlineOrderStatus
  search?: string
  order?: 'asc' | 'desc'
}

export interface PaymentListParams extends PaymentFilters {
  page: number
  limit: number
  status?: PaymentStatus
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export type FineStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn'

export interface FineType {
  id: number
  name: string
  default_amount: number
  description: string | null
  is_active: boolean
  fines: number
}

export interface FineTypeInput {
  name: string
  default_amount: number
  description?: string | null
  is_active?: boolean
}

export interface Fine {
  id: number
  fine_no: string
  status: FineStatus
  student: FeeStudentRef
  fine_type: { id: number; name: string } | null
  title: string
  amount: number
  incident_on: string
  details: string | null
  raised_by: { id: number; name: string } | null
  raised_at: string
  decided_by: { id: number; name: string } | null
  decided_at: string | null
  decision_comment: string | null
  invoice: {
    id: number
    invoice_no: string
    due_date: string
    balance: number
    status: InvoiceStatus
  } | null
  behaviour_note_id: number | null
}

export interface FineInput {
  student_id: number
  fine_type_id?: number
  title?: string
  amount?: number
  incident_on?: string
  details?: string
}

export interface FineListParams {
  page?: number
  limit?: number
  search?: string
  status?: FineStatus
  student_id?: number
  fine_type_id?: number
}

export const feeKeys = {
  all: ['fees'] as const,
  insights: () => [...feeKeys.all, 'insights'] as const,
  heads: () => [...feeKeys.all, 'heads'] as const,
  plans: () => [...feeKeys.all, 'plans'] as const,
  plan: (classId: number) => [...feeKeys.all, 'plan', classId] as const,
  planVersions: (classId: number) => [...feeKeys.all, 'plan-versions', classId] as const,
  benefits: (params: BenefitListParams) => [...feeKeys.all, 'benefits', params] as const,
  report: (type: FeeReportType, params: FeeReportParams) =>
    [...feeKeys.all, 'report', type, params] as const,
  requests: (params: FeeRequestParams) => [...feeKeys.all, 'requests', params] as const,
  settings: () => [...feeKeys.all, 'settings'] as const,
  awards: (params: AwardListParams) => [...feeKeys.all, 'awards', params] as const,
  installments: () => [...feeKeys.all, 'installments'] as const,
  invoices: (params: InvoiceListParams) => [...feeKeys.all, 'invoices', params] as const,
  invoice: (id: number) => [...feeKeys.all, 'invoice', id] as const,
  payments: (params: PaymentListParams) => [...feeKeys.all, 'payments', params] as const,
  paymentSummary: (filters: PaymentFilters) =>
    [...feeKeys.all, 'payment-summary', filters] as const,
  onlineOrders: (params: OnlineOrderParams) => [...feeKeys.all, 'online-orders', params] as const,
  student: (id: number) => [...feeKeys.all, 'student', id] as const,
  audit: (params: FeeAuditParams) => [...feeKeys.all, 'audit', params] as const,
  reconciliation: () => [...feeKeys.all, 'reconciliation'] as const,
  fines: (params: FineListParams) => [...feeKeys.all, 'fines', params] as const,
  fineTypes: () => [...feeKeys.all, 'fine-types'] as const,
  collectors: () => [...feeKeys.all, 'collectors'] as const,
}

export const receiptUrl = (paymentId: number) => `/admin/fees/payments/${paymentId}/receipt`
export const refundReceiptUrl = (refundId: number) => `/admin/fees/refunds/${refundId}/receipt`
export const invoicePdfUrl = (invoiceId: number) => `/admin/fees/invoices/${invoiceId}/pdf`
export const DAY_SHEET_URL = '/admin/fees/reports/day-sheet'
export const advanceReceiptUrl = (collectionId: number) =>
  `/admin/fees/collections/${collectionId}/advance-receipt`

export const feesApi = {
  insights: () => api.get<FeeInsights>('/admin/fees/insights'),
  heads: () =>
    api.get<Paginated<FeeHead>>('/admin/fees/heads', { limit: 100, sort: 'name', order: 'asc' }),
  createHead: (input: FeeHeadInput) => api.post<FeeHead>('/admin/fees/heads', input),
  updateHead: (id: number, input: Partial<FeeHeadInput>) =>
    api.patch<FeeHead>(`/admin/fees/heads/${id}`, input),
  removeHead: (id: number) => api.delete<null>(`/admin/fees/heads/${id}`),
  plans: () => api.get<FeePlanSummary[]>('/admin/fees/plans'),
  plan: (classId: number) => api.get<FeePlan>(`/admin/fees/plans/${classId}`),
  setPlan: (classId: number, lines: FeePlanLineInput[]) =>
    api.put<FeePlan>(`/admin/fees/plans/${classId}`, { lines }),
  planVersions: (classId: number) =>
    api.get<FeePlanVersion[]>(`/admin/fees/plans/${classId}/versions`),
  submitPlan: (classId: number, note?: string) =>
    api.post<FeePlan>(`/admin/fees/plans/${classId}/submit`, { note: note || undefined }),
  approvePlan: (classId: number, comment?: string) =>
    api.post<FeePlan>(`/admin/fees/plans/${classId}/approve`, { comment: comment || undefined }),
  rejectPlan: (classId: number, comment: string) =>
    api.post<FeePlan>(`/admin/fees/plans/${classId}/reject`, { comment }),
  discardPlanDraft: (classId: number) => api.delete<FeePlan>(`/admin/fees/plans/${classId}/draft`),
  copyPlan: (classId: number, toClassIds: number[]) =>
    api.post<CopyPlanResult>(`/admin/fees/plans/${classId}/copy`, { to_class_ids: toClassIds }),
  copyYear: (fromYearId: number, classIds?: number[]) =>
    api.post<CopyPlanResult>('/admin/fees/plans/copy-year', {
      from_academic_year_id: fromYearId,
      class_ids: classIds?.length ? classIds : undefined,
    }),
  report: (type: FeeReportType, params: FeeReportParams) =>
    api.get<FeeReport>(`/admin/fees/reports/${type}`, { ...params }),
  benefits: (params: BenefitListParams) =>
    api.get<Paginated<FeeBenefit>>('/admin/fees/benefits', { ...params }),
  createBenefit: (input: FeeBenefitInput) => api.post<FeeBenefit>('/admin/fees/benefits', input),
  updateBenefit: (id: number, input: Partial<FeeBenefitInput>) =>
    api.patch<FeeBenefit>(`/admin/fees/benefits/${id}`, input),
  removeBenefit: (id: number) => api.delete<null>(`/admin/fees/benefits/${id}`),
  awards: (params: AwardListParams) =>
    api.get<Paginated<FeeAward>>('/admin/fees/benefit-awards', { ...params }),
  award: (benefitId: number, studentIds: number[], reason: string) =>
    api.post<AwardResult>('/admin/fees/benefit-awards', {
      benefit_id: benefitId,
      student_ids: studentIds,
      reason,
    }),
  revokeAward: (id: number, reason: string) =>
    api.post<FeeAward>(`/admin/fees/benefit-awards/${id}/revoke`, { reason }),
  installments: () => api.get<InstallmentTotal[]>('/admin/fees/installments'),
  generate: (input: GenerateInput) =>
    api.post<GenerateResult>('/admin/fees/invoices/generate', input),
  invoices: (params: InvoiceListParams) =>
    api.get<Paginated<FeeInvoice>>('/admin/fees/invoices', { ...params }),
  invoice: (id: number) => api.get<FeeInvoiceDetail>(`/admin/fees/invoices/${id}`),
  discount: (id: number, discount: number, reason: string) =>
    api.patch<FeeRequest>(`/admin/fees/invoices/${id}/discount`, { discount, reason }),
  cancel: (id: number, reason: string) =>
    api.post<FeeRequest>(`/admin/fees/invoices/${id}/cancel`, { reason }),
  writeOff: (id: number, reason: string) =>
    api.post<FeeRequest>(`/admin/fees/invoices/${id}/write-off`, { reason }),
  collect: (studentId: number, input: PaymentInput, idempotencyKey: string) =>
    api.post<CollectionResult>(`/admin/fees/students/${studentId}/payments`, input, {
      'Idempotency-Key': idempotencyKey,
    }),
  applyCredit: (studentId: number) =>
    api.post<CollectionResult>(`/admin/fees/students/${studentId}/apply-credit`),
  reschedule: (id: number, dueDate: string, reason: string) =>
    api.post<FeeRequest>(`/admin/fees/invoices/${id}/reschedule`, { due_date: dueDate, reason }),
  refund: (id: number, input: RefundInput) =>
    api.post<FeeRequest>(`/admin/fees/invoices/${id}/refunds`, input),
  requests: (params: FeeRequestParams) =>
    api.get<Paginated<FeeRequest>>('/admin/fees/requests', { ...params }),
  approveRequest: (id: number, comment?: string) =>
    api.post<FeeRequest>(`/admin/fees/requests/${id}/approve`, { comment: comment || undefined }),
  rejectRequest: (id: number, comment: string) =>
    api.post<FeeRequest>(`/admin/fees/requests/${id}/reject`, { comment }),
  withdrawRequest: (id: number) => api.post<FeeRequest>(`/admin/fees/requests/${id}/withdraw`),
  settings: () => api.get<FeeSettings>('/admin/fees/settings'),
  saveSettings: (
    input: Pick<FeeSettings, 'grace_days' | 'late_fee_type' | 'late_fee_value' | 'reminder_days'>
  ) => api.put<FeeSettings>('/admin/fees/settings', input),
  runLateFees: () => api.post<{ invoices: number; amount: number }>('/admin/fees/late-fees/run'),
  pay: (id: number, input: PaymentInput, idempotencyKey: string) =>
    api.post<FeePayment>(`/admin/fees/invoices/${id}/payments`, input, {
      'Idempotency-Key': idempotencyKey,
    }),
  reverse: (paymentId: number, reason: string) =>
    api.post<FeeRequest>(`/admin/fees/payments/${paymentId}/reverse`, { reason }),
  payments: (params: PaymentListParams) =>
    api.get<Paginated<FeePayment>>('/admin/fees/payments', { ...params }),
  paymentSummary: (filters: PaymentFilters) =>
    api.get<PaymentSummary>('/admin/fees/payments/summary', { ...filters }),
  collectors: () => api.get<CollectorOption[]>('/admin/fees/reports/collector-options'),
  onlineOrders: (params: OnlineOrderParams) =>
    api.get<Paginated<OnlineOrder>>('/admin/fees/online-payments', { ...params }),
  student: (id: number) => api.get<StudentFees>(`/admin/students/${id}/fees`),
  auditLogs: (params: FeeAuditParams) =>
    api.get<Paginated<FeeAuditLog>>('/admin/fees/audit-logs', { ...params }),
  reconciliation: () => api.get<Reconciliation>('/admin/fees/reconciliation'),
  sendOverdueReminders: () =>
    api.post<{ sent: number; due_soon: number }>('/admin/fees/overdue-reminders'),
  fineTypes: () => api.get<FineType[]>('/admin/fees/fine-types'),
  createFineType: (input: FineTypeInput) => api.post<FineType>('/admin/fees/fine-types', input),
  updateFineType: (id: number, input: Partial<FineTypeInput>) =>
    api.patch<FineType>(`/admin/fees/fine-types/${id}`, input),
  removeFineType: (id: number) => api.delete<null>(`/admin/fees/fine-types/${id}`),
  fines: (params: FineListParams) => api.get<Paginated<Fine>>('/admin/fees/fines', { ...params }),
  raiseFine: (input: FineInput) => api.post<Fine>('/admin/fees/fines', input),
  approveFine: (id: number, input: { due_date?: string; comment?: string }) =>
    api.post<Fine>(`/admin/fees/fines/${id}/approve`, input),
  rejectFine: (id: number, comment: string) =>
    api.post<Fine>(`/admin/fees/fines/${id}/reject`, { comment }),
  withdrawFine: (id: number) => api.post<Fine>(`/admin/fees/fines/${id}/withdraw`),
}

export function useFeeInsights() {
  return useQuery({ queryKey: feeKeys.insights(), queryFn: feesApi.insights })
}

export function useFeeHeads() {
  return useQuery({ queryKey: feeKeys.heads(), queryFn: feesApi.heads })
}

export function useFeePlans() {
  return useQuery({ queryKey: feeKeys.plans(), queryFn: feesApi.plans })
}

export function useFeePlan(classId: number | undefined) {
  return useQuery({
    queryKey: feeKeys.plan(classId ?? 0),
    queryFn: () => feesApi.plan(classId!),
    enabled: Boolean(classId),
    staleTime: 0,
  })
}

export function usePlanVersions(classId: number, enabled = true) {
  return useQuery({
    queryKey: feeKeys.planVersions(classId),
    queryFn: () => feesApi.planVersions(classId),
    enabled,
  })
}

export function useFeeBenefits(params: BenefitListParams) {
  return useQuery({
    queryKey: feeKeys.benefits(params),
    queryFn: () => feesApi.benefits(params),
    placeholderData: keepPreviousData,
  })
}

export function useFeeAwards(params: AwardListParams, enabled = true) {
  return useQuery({
    queryKey: feeKeys.awards(params),
    queryFn: () => feesApi.awards(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useFeeReport(type: FeeReportType, params: FeeReportParams) {
  return useQuery({
    queryKey: feeKeys.report(type, params),
    queryFn: () => feesApi.report(type, params),
    placeholderData: keepPreviousData,
  })
}

export function useFeeRequests(params: FeeRequestParams, enabled = true) {
  return useQuery({
    queryKey: feeKeys.requests(params),
    queryFn: () => feesApi.requests(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useFeeSettings() {
  return useQuery({ queryKey: feeKeys.settings(), queryFn: feesApi.settings })
}

export function useInstallments() {
  return useQuery({ queryKey: feeKeys.installments(), queryFn: feesApi.installments })
}

export function useInvoices(params: InvoiceListParams) {
  return useQuery({
    queryKey: feeKeys.invoices(params),
    queryFn: () => feesApi.invoices(params),
    placeholderData: keepPreviousData,
  })
}

export function useInvoice(id: number | undefined) {
  return useQuery({
    queryKey: feeKeys.invoice(id ?? 0),
    queryFn: () => feesApi.invoice(id!),
    enabled: Boolean(id),
  })
}

export function usePayments(params: PaymentListParams) {
  return useQuery({
    queryKey: feeKeys.payments(params),
    queryFn: () => feesApi.payments(params),
    placeholderData: keepPreviousData,
  })
}

export function useOnlineOrders(params: OnlineOrderParams) {
  return useQuery({
    queryKey: feeKeys.onlineOrders(params),
    queryFn: () => feesApi.onlineOrders(params),
    placeholderData: keepPreviousData,
  })
}

export function useCollectorOptions() {
  return useQuery({
    queryKey: feeKeys.collectors(),
    queryFn: feesApi.collectors,
    staleTime: 5 * 60_000,
    select: (rows) => rows.map((row) => ({ value: String(row.id), label: row.name })),
  })
}

export function usePaymentSummary(filters: PaymentFilters) {
  return useQuery({
    queryKey: feeKeys.paymentSummary(filters),
    queryFn: () => feesApi.paymentSummary(filters),
    placeholderData: keepPreviousData,
  })
}

export function useStudentFees(id: number, enabled = true) {
  return useQuery({
    queryKey: feeKeys.student(id),
    queryFn: () => feesApi.student(id),
    enabled,
  })
}

export function useFeeAudit(params: FeeAuditParams) {
  return useQuery({
    queryKey: feeKeys.audit(params),
    queryFn: () => feesApi.auditLogs(params),
    placeholderData: keepPreviousData,
  })
}

export function useReconciliation() {
  return useQuery({ queryKey: feeKeys.reconciliation(), queryFn: feesApi.reconciliation })
}

export function useFines(params: FineListParams, enabled = true) {
  return useQuery({
    queryKey: feeKeys.fines(params),
    queryFn: () => feesApi.fines(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useFineTypes() {
  return useQuery({ queryKey: feeKeys.fineTypes(), queryFn: feesApi.fineTypes })
}

export function useFeesMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: feeKeys.all })
    },
  })
}
