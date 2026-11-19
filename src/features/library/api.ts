import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated, type QueryParams } from '@/lib/api/client'

export const COPY_STATUSES = [
  'available',
  'issued',
  'lost',
  'damaged',
  'in_repair',
  'withdrawn',
] as const
export type CopyStatus = (typeof COPY_STATUSES)[number]
export const EDITABLE_COPY_STATUSES = ['available', 'damaged', 'in_repair', 'withdrawn'] as const
export type EditableCopyStatus = (typeof EDITABLE_COPY_STATUSES)[number]
export const COPY_CONDITIONS = ['new', 'good', 'fair', 'poor'] as const
export type CopyCondition = (typeof COPY_CONDITIONS)[number]
export const COPY_SOURCES = ['purchase', 'donation', 'other'] as const
export type CopySource = (typeof COPY_SOURCES)[number]
export const LOAN_STATES = [
  'on_loan',
  'due_soon',
  'due_today',
  'overdue',
  'returned',
  'lost',
] as const
export type LoanState = (typeof LOAN_STATES)[number]
export const OPEN_LOAN_STATES = ['on_loan', 'due_soon', 'due_today', 'overdue'] as const
export type OpenLoanState = (typeof OPEN_LOAN_STATES)[number]
export const ISSUE_STATUSES = ['issued', 'returned', 'lost'] as const
export type IssueStatus = (typeof ISSUE_STATUSES)[number]
export const ISSUE_PURPOSES = ['personal', 'class_set'] as const
export type IssuePurpose = (typeof ISSUE_PURPOSES)[number]
export const FOLLOW_UP_ACTIONS = [
  'called_parent',
  'reminded_student',
  'reminded_staff',
  'told_class_teacher',
  'promised_date',
  'other',
] as const
export type FollowUpAction = (typeof FOLLOW_UP_ACTIONS)[number]
export const MEMBER_TYPES = ['student', 'staff'] as const
export type MemberType = (typeof MEMBER_TYPES)[number]
export const MEMBER_STATUSES = ['active', 'suspended', 'left'] as const
export type MemberStatus = (typeof MEMBER_STATUSES)[number]
export const FINE_KINDS = ['overdue', 'lost', 'damage', 'other'] as const
export type FineKind = (typeof FINE_KINDS)[number]
export const FINE_STATUSES = ['unpaid', 'partly_paid', 'paid', 'waived'] as const
export type FineStatus = (typeof FINE_STATUSES)[number]
export const PAYMENT_MODES = ['cash', 'upi', 'card', 'bank_transfer', 'cheque'] as const
export type PaymentMode = (typeof PAYMENT_MODES)[number]
export const VISIT_KINDS = ['walk_in', 'period'] as const
export type VisitKind = (typeof VISIT_KINDS)[number]
export const VISIT_PURPOSES = ['read', 'borrow', 'return', 'study', 'period', 'other'] as const
export type VisitPurpose = (typeof VISIT_PURPOSES)[number]
export const AUDIT_FINDINGS = ['found', 'misplaced', 'was_issued', 'was_lost', 'unknown'] as const
export type AuditFinding = (typeof AUDIT_FINDINGS)[number]
export type AuditItemFinding = AuditFinding | 'missing'
export const BOOK_AVAILABILITY = ['available', 'none_available'] as const
export type BookAvailability = (typeof BOOK_AVAILABILITY)[number]

export type SortOrder = 'asc' | 'desc'

export interface Ref {
  id: number
  name: string
}

export interface LibrarySettings {
  student_loan_days: number
  staff_loan_days: number
  student_max_books: number
  staff_max_books: number
  fine_per_day: number
  grace_days: number
  max_fine_per_book: number | null
  lost_processing_fee: number
  max_renewals: number
  block_issue_above_fine: number
  skip_holidays: boolean
  charge_staff_fines: boolean
  due_soon_days: number
  escalate_after_days: number
  long_overdue_days: number
  opening_time: string
  closing_time: string
  isbn_lookup: boolean
  isbn_lookup_available: boolean
}

export type LibrarySettingsInput = Partial<Omit<LibrarySettings, 'isbn_lookup_available'>>

export interface Category {
  id: number
  name: string
  code: string
  is_reference: boolean
  description: string | null
  book_count: number
  copy_count: number
}

export interface CategoryInput {
  name: string
  code: string
  is_reference?: boolean
  description?: string | null
}

export interface CopyCounts {
  total: number
  available: number
  issued: number
  lost: number
  damaged: number
  in_repair: number
  withdrawn: number
}

export interface Book {
  id: number
  title: string
  subtitle: string | null
  isbn: string | null
  authors: string | null
  publisher: string | null
  edition: string | null
  published_year: number | null
  language: string
  category: Ref | null
  subject: Ref | null
  pages: number | null
  rack: string | null
  shelf: string | null
  price: number | null
  cover_file_id: number | null
  cover_url: string | null
  description: string | null
  keywords: string | null
  is_active: boolean
  is_reference: boolean
  copies: CopyCounts
  created_at: string
}

export interface BookInsights {
  titles: number
  copies: number
  available: number
  issued: number
  overdue: number
  lost: number
  damaged: number
  added_this_month: number
}

export interface CopyInput {
  count?: number
  barcodes?: string[]
  accession_nos?: string[]
  condition?: CopyCondition
  source?: CopySource
  vendor?: string | null
  bill_no?: string | null
  acquired_on?: string
  price?: number | null
  notes?: string | null
}

export interface BookInput {
  title: string
  subtitle?: string | null
  isbn?: string | null
  authors?: string | null
  publisher?: string | null
  edition?: string | null
  published_year?: number | null
  language?: string
  category_id?: number | null
  subject_id?: number | null
  pages?: number | null
  rack?: string | null
  shelf?: string | null
  price?: number | null
  cover_file_id?: number | null
  description?: string | null
  keywords?: string | null
}

export interface BookCreateInput extends BookInput {
  copies?: CopyInput
}

export interface BookUpdateInput extends Partial<BookInput> {
  is_active?: boolean
}

export interface BookSuggestion {
  title: string
  subtitle: string | null
  authors: string | null
  publisher: string | null
  published_year: number | null
  pages: number | null
  description: string | null
}

export interface IsbnLookup {
  isbn: string
  book: Book | null
  suggestion: BookSuggestion | null
}

export interface MemberRef {
  id: number
  member_type: MemberType
  card_no: string
  name: string
  detail: string | null
  student_id: number | null
  user_id: number | null
  photo_url: string | null
  phone: string | null
}

export interface CopyLoan {
  issue_id: number
  member: MemberRef
  due_date: string
  state: LoanState
  days_overdue: number
  running_fine: number
}

export interface CopyBook {
  id: number
  title: string
  authors: string | null
  isbn: string | null
  category: Ref | null
  is_reference: boolean
  cover_url: string | null
}

export interface Copy {
  id: number
  book_id: number
  book: CopyBook
  accession_no: string
  barcode: string
  status: CopyStatus
  condition: CopyCondition
  source: CopySource
  vendor: string | null
  bill_no: string | null
  acquired_on: string | null
  price: number | null
  notes: string | null
  location: string | null
  current_loan: CopyLoan | null
  created_at: string
}

export interface CopyUpdateInput {
  barcode?: string
  status?: EditableCopyStatus
  condition?: CopyCondition
  source?: CopySource
  vendor?: string | null
  bill_no?: string | null
  acquired_on?: string
  price?: number | null
  notes?: string | null
}

export interface CopyEvent {
  id: number
  kind: string
  note: string | null
  issue_id: number | null
  member: MemberRef | null
  actor: string | null
  created_at: string
}

export interface BookImportRow {
  row: number
  status: 'ok' | 'error'
  title: string | null
  isbn: string | null
  copies: number
  action: 'new_book' | 'add_copies' | null
  message: string | null
  book_id: number | null
}

export interface BookImportReport {
  mode: 'validate' | 'import'
  total_rows: number
  ok_rows: number
  error_rows: number
  books_created: number
  copies_added: number
  categories_created: number
  rows: BookImportRow[]
}

export interface MemberStudent {
  id: number
  admission_no: string
  class_section: string | null
  section_id: number | null
  status: string
}

export interface MemberStaff {
  user_id: number
  employee_no: string | null
  designation: string | null
  mobile: string
  status: string
}

export interface Member {
  id: number
  member_type: MemberType
  card_no: string
  name: string
  detail: string | null
  photo_url: string | null
  phone: string | null
  status: MemberStatus
  status_reason: string | null
  max_books: number
  loan_days: number
  max_books_override: number | null
  loan_days_override: number | null
  joined_on: string
  student: MemberStudent | null
  staff: MemberStaff | null
  open_loans: number
  overdue_loans: number
  unpaid_fines: number
  total_loans: number
  last_visit_at: string | null
}

export interface MemberInsights {
  members: number
  students: number
  staff: number
  suspended: number
  with_overdue: number
  with_fines: number
  students_not_enrolled: number
}

export interface MemberCreateInput {
  student_id?: number
  user_id?: number
}

export interface MemberBulkInput {
  section_id?: number
  class_id?: number
  all_students?: boolean
  all_staff?: boolean
}

export interface MemberBulkResult {
  created: number
  already_members: number
}

export interface MemberUpdateInput {
  status?: 'active' | 'suspended'
  status_reason?: string | null
  max_books?: number | null
  loan_days?: number | null
}

export interface Person {
  member_type: MemberType
  student_id: number | null
  user_id: number | null
  name: string
  detail: string | null
  photo_url: string | null
  member_id: number | null
  card_no: string | null
  member_status: MemberStatus | null
}

export interface LoanBook {
  id: number
  title: string
  authors: string | null
  isbn: string | null
  cover_url: string | null
}

export interface LoanCopy {
  id: number
  accession_no: string
  barcode: string
}

export interface FollowUp {
  id: number
  action: FollowUpAction
  note: string | null
  promised_on: string | null
  next_follow_up_on: string | null
  by: string | null
  created_at: string
}

export interface Loan {
  id: number
  status: IssueStatus
  state: LoanState
  purpose: IssuePurpose
  book: LoanBook
  copy: LoanCopy
  member: MemberRef
  section: Ref | null
  issued_at: string
  due_date: string
  returned_at: string | null
  return_condition: CopyCondition | null
  renew_count: number
  days_overdue: number
  running_fine: number
  remarks: string | null
  issued_by: string | null
  returned_by: string | null
  last_follow_up: FollowUp | null
}

export interface Refusal {
  code: string
  message: string
}

export interface MemberFine {
  id: number
  kind: string
  status: string
  amount: number
  balance: number
  reason: string
  created_at: string
}

export interface MemberSummary {
  member: Member
  loans: Loan[]
  fines: MemberFine[]
  books_left: number
  can_borrow: boolean
  refusal: Refusal | null
  enrolled_now: boolean
}

export interface IssueInput {
  member_id: number
  codes: string[]
  due_date?: string
  purpose?: IssuePurpose
  section_id?: number
  remarks?: string | null
}

export interface ReturnItemInput {
  code: string
  condition?: CopyCondition
  damage_fine?: number
  remarks?: string | null
}

export interface ReturnedItem {
  loan: Loan
  fines: MemberFine[]
}

export interface IssueInsights {
  on_loan: number
  overdue: number
  due_today: number
  due_soon: number
  issued_today: number
  returned_today: number
  lost: number
  running_fines: number
  follow_ups_due: number
}

export interface LoanReminder {
  kind: string
  sent_at: string
  recipients: number
}

export interface LoanDetail extends Loan {
  follow_ups: FollowUp[]
  fines: MemberFine[]
  reminders: LoanReminder[]
}

export interface FollowUpInput {
  action: FollowUpAction
  note?: string | null
  promised_on?: string
  next_follow_up_on?: string
}

export interface FineLoan {
  id: number
  book_title: string
  accession_no: string
  due_date: string
}

export interface Fine {
  id: number
  kind: FineKind
  status: FineStatus
  amount: number
  waived: number
  paid: number
  balance: number
  days_late: number | null
  reason: string
  member: MemberRef
  loan: FineLoan | null
  waive_reason: string | null
  waived_by: string | null
  created_at: string
}

export interface FineInsights {
  outstanding: number
  outstanding_count: number
  collected_this_month: number
  waived_this_month: number
  raised_this_month: number
  collected_today: number
}

export interface FinePaymentInput {
  amount: number
  mode: PaymentMode
  reference?: string | null
  paid_on?: string
  notes?: string | null
}

export interface FineWaiveInput {
  amount?: number
  reason: string
}

export interface FinePayment {
  id: number
  receipt_no: string
  amount: number
  mode: PaymentMode
  reference: string | null
  paid_on: string
  notes: string | null
  received_by: string | null
  fine_id: number
  fine_reason: string
  member: MemberRef
  created_at: string
}

export interface FinePaymentResult {
  fine: Fine
  payment: FinePayment
}

export interface Visitor {
  member_type: MemberType
  student_id: number | null
  user_id: number | null
  name: string
  detail: string | null
  photo_url: string | null
}

export interface Visit {
  id: number
  kind: VisitKind
  visitor: Visitor
  visit_date: string
  in_at: string | null
  out_at: string | null
  minutes: number | null
  purpose: VisitPurpose
  present: boolean
  period_no: number | null
  section: Ref | null
}

export interface VisitScanResult {
  action: 'checked_in' | 'checked_out'
  visit: Visit
}

export interface VisitInsights {
  date: string
  inside_now: number
  visitors_today: number
  students_today: number
  staff_today: number
  average_minutes: number | null
  periods_today: number
  periods_marked: number
  busiest_hour: number | null
}

export interface LibraryPeriod {
  slot_id: number
  date: string
  period_no: number
  period_name: string | null
  start_time: string | null
  end_time: string | null
  section: Ref
  teacher: string | null
  marked: boolean
  present: number
  absent: number
  total: number
}

export interface PeriodStudent {
  student_id: number
  name: string
  roll_no: number | null
  admission_no: string
  photo_url: string | null
  present: boolean | null
}

export interface PeriodRoster {
  period: LibraryPeriod
  students: PeriodStudent[]
}

export interface Audit {
  id: number
  name: string
  status: 'open' | 'closed'
  category: Ref | null
  rack: string | null
  expected: number
  scanned: number
  found: number
  misplaced: number
  mismatched: number
  was_issued: number
  was_lost: number
  unknown: number
  missing: number
  notes: string | null
  started_by: string | null
  created_at: string
  closed_at: string | null
}

export interface AuditCreateInput {
  name: string
  category_id?: number
  rack?: string | null
  notes?: string | null
}

export interface AuditScanResult {
  finding: AuditFinding
  message: string
  repeated: boolean
  copy: Copy | null
  audit: Audit
}

export interface AuditItem {
  id: number
  code: string
  finding: AuditItemFinding
  copy: Copy | null
  scanned_at: string
}

export interface MostBorrowed {
  book_id: number
  title: string
  authors: string | null
  category: string | null
  loans: number
  readers: number
}

export interface CategoryReport {
  category_id: number | null
  category: string
  titles: number
  copies: number
  available: number
  loans: number
  readers: number
  stock_value: number
}

export interface TopReader {
  member: MemberRef
  loans: number
  late_returns: number
}

export interface ClassReport {
  section_id: number
  section: string
  students: number
  members: number
  loans: number
  overdue: number
  visits: number
  period_present: number
  period_absent: number
}

export interface StockStatus {
  status: string
  copies: number
  value: number
}

export interface StockReport {
  titles: number
  copies: number
  value: number
  by_status: StockStatus[]
  by_category: CategoryReport[]
}

export interface LibraryDashboard {
  books: BookInsights
  loans: IssueInsights
  fines: FineInsights
  visits: VisitInsights
  due_today: Loan[]
  follow_ups: Loan[]
  recent: Loan[]
  periods_today: LibraryPeriod[]
}

export interface PersonLibrary {
  member: MemberRef | null
  status: string | null
  max_books: number
  books_left: number
  loans: Loan[]
  fines: MemberFine[]
  unpaid_fines: number
  history: Loan[]
  total_loans: number
  visits_this_month: number
}

interface ListParams {
  page: number
  limit: number
  search?: string
  sort?: string
  order?: SortOrder
}

export interface BookListParams extends ListParams {
  category_id?: number
  language?: string
  availability?: BookAvailability
  is_active?: boolean
}

export interface CopyListParams extends ListParams {
  status?: CopyStatus
  condition?: CopyCondition
  book_id?: number
  category_id?: number
}

export interface MemberListParams extends ListParams {
  member_type?: MemberType
  status?: MemberStatus
  class_id?: number
  section_id?: number
  has_overdue?: boolean
  has_fines?: boolean
}

export interface IssueFilters {
  search?: string
  sort?: string
  order?: SortOrder
  status?: IssueStatus
  state?: OpenLoanState
  member_id?: number
  book_id?: number
  copy_id?: number
  member_type?: MemberType
  class_id?: number
  section_id?: number
  purpose?: IssuePurpose
  from?: string
  to?: string
  on?: string
}

export interface IssueListParams extends IssueFilters {
  page: number
  limit: number
}

export interface FollowUpListParams extends ListParams {
  show?: 'due' | 'all'
  member_type?: MemberType
  class_id?: number
}

export interface FineListParams extends ListParams {
  status?: FineStatus
  kind?: FineKind
  member_id?: number
  member_type?: MemberType
  class_id?: number
  outstanding?: boolean
}

export interface FinePaymentListParams extends ListParams {
  mode?: PaymentMode
  member_id?: number
  from?: string
  to?: string
}

export interface VisitListParams extends ListParams {
  date?: string
  from?: string
  to?: string
  kind?: VisitKind
  member_type?: MemberType
  class_id?: number
  section_id?: number
  student_id?: number
  inside?: boolean
  present?: boolean
}

export interface AuditItemParams {
  page: number
  limit: number
  finding?: AuditItemFinding
}

export interface ReportParams {
  from?: string
  to?: string
  limit?: number
  member_type?: MemberType
}

export interface LabelsParams {
  copy_ids?: number[]
  book_id?: number
  added_from?: string
}

const BASE = '/admin/library'

const params = (value: object) => ({ ...value }) as QueryParams

export const labelsQuery = (value: LabelsParams): QueryParams => ({
  copy_ids: value.copy_ids?.length ? value.copy_ids.join(',') : undefined,
  book_id: value.book_id,
  added_from: value.added_from,
})

export const libraryFiles = {
  labels: `${BASE}/copies/labels`,
  receipt: (paymentId: number) => `${BASE}/fine-payments/${paymentId}/receipt`,
  importTemplate: `${BASE}/books/import/template`,
  issuesExport: `${BASE}/issues/export`,
}

export const libraryKeys = {
  all: ['library'] as const,
  dashboard: () => [...libraryKeys.all, 'dashboard'] as const,
  settings: () => [...libraryKeys.all, 'settings'] as const,
  categories: () => [...libraryKeys.all, 'categories'] as const,
  bookInsights: () => [...libraryKeys.all, 'book-insights'] as const,
  books: (p: BookListParams) => [...libraryKeys.all, 'books', p] as const,
  book: (id: number) => [...libraryKeys.all, 'book', id] as const,
  bookCopies: (id: number) => [...libraryKeys.all, 'book-copies', id] as const,
  copies: (p: CopyListParams) => [...libraryKeys.all, 'copies', p] as const,
  copyHistory: (id: number) => [...libraryKeys.all, 'copy-history', id] as const,
  memberInsights: () => [...libraryKeys.all, 'member-insights'] as const,
  people: (search: string, type?: MemberType) =>
    [...libraryKeys.all, 'people', search, type ?? 'all'] as const,
  members: (p: MemberListParams) => [...libraryKeys.all, 'members', p] as const,
  member: (id: number) => [...libraryKeys.all, 'member', id] as const,
  issueInsights: () => [...libraryKeys.all, 'issue-insights'] as const,
  issues: (p: IssueListParams) => [...libraryKeys.all, 'issues', p] as const,
  issue: (id: number) => [...libraryKeys.all, 'issue', id] as const,
  followUps: (p: FollowUpListParams) => [...libraryKeys.all, 'follow-ups', p] as const,
  fineInsights: () => [...libraryKeys.all, 'fine-insights'] as const,
  fines: (p: FineListParams) => [...libraryKeys.all, 'fines', p] as const,
  payments: (p: FinePaymentListParams) => [...libraryKeys.all, 'payments', p] as const,
  visitInsights: (date?: string) => [...libraryKeys.all, 'visit-insights', date ?? ''] as const,
  visits: (p: VisitListParams) => [...libraryKeys.all, 'visits', p] as const,
  periods: (date?: string) => [...libraryKeys.all, 'periods', date ?? ''] as const,
  roster: (slotId: number, date?: string) =>
    [...libraryKeys.all, 'roster', slotId, date ?? ''] as const,
  audits: () => [...libraryKeys.all, 'audits'] as const,
  audit: (id: number) => [...libraryKeys.all, 'audit', id] as const,
  auditItems: (id: number, p: AuditItemParams) =>
    [...libraryKeys.all, 'audit-items', id, p] as const,
  report: (name: string, p: ReportParams) => [...libraryKeys.all, 'report', name, p] as const,
  stock: () => [...libraryKeys.all, 'stock'] as const,
  person: (kind: 'student' | 'staff', id: number) =>
    [...libraryKeys.all, 'person', kind, id] as const,
}

export const libraryApi = {
  dashboard: () => api.get<LibraryDashboard>(`${BASE}/dashboard`),
  settings: () => api.get<LibrarySettings>(`${BASE}/settings`),
  saveSettings: (input: LibrarySettingsInput) =>
    api.put<LibrarySettings>(`${BASE}/settings`, input),
  categories: () => api.get<Category[]>(`${BASE}/categories`),
  createCategory: (input: CategoryInput) => api.post<Category>(`${BASE}/categories`, input),
  updateCategory: (id: number, input: Partial<CategoryInput>) =>
    api.patch<Category>(`${BASE}/categories/${id}`, input),
  removeCategory: (id: number) => api.delete<null>(`${BASE}/categories/${id}`),
  bookInsights: () => api.get<BookInsights>(`${BASE}/books/insights`),
  importBooks: (file: File, mode: 'validate' | 'import') => {
    const form = new FormData()
    form.append('file', file)
    form.append('mode', mode)
    return api.upload<BookImportReport>(`${BASE}/books/import`, form)
  },
  isbn: (isbn: string) => api.get<IsbnLookup>(`${BASE}/books/isbn/${encodeURIComponent(isbn)}`),
  books: (p: BookListParams) => api.get<Paginated<Book>>(`${BASE}/books`, params(p)),
  createBook: (input: BookCreateInput) => api.post<Book>(`${BASE}/books`, input),
  book: (id: number) => api.get<Book>(`${BASE}/books/${id}`),
  updateBook: (id: number, input: BookUpdateInput) => api.patch<Book>(`${BASE}/books/${id}`, input),
  removeBook: (id: number) => api.delete<null>(`${BASE}/books/${id}`),
  bookCopies: (id: number) => api.get<Copy[]>(`${BASE}/books/${id}/copies`),
  addCopies: (id: number, input: CopyInput) =>
    api.post<Copy[]>(`${BASE}/books/${id}/copies`, input),
  copies: (p: CopyListParams) => api.get<Paginated<Copy>>(`${BASE}/copies`, params(p)),
  lookupCopy: (code: string) => api.get<Copy>(`${BASE}/copies/lookup`, { code }),
  updateCopy: (id: number, input: CopyUpdateInput) =>
    api.patch<Copy>(`${BASE}/copies/${id}`, input),
  copyHistory: (id: number) => api.get<CopyEvent[]>(`${BASE}/copies/${id}/history`),
  memberInsights: () => api.get<MemberInsights>(`${BASE}/members/insights`),
  people: (search: string, member_type?: MemberType) =>
    api.get<Person[]>(`${BASE}/members/people`, { search: search || undefined, member_type }),
  lookupMember: (code: string) => api.get<MemberSummary>(`${BASE}/members/lookup`, { code }),
  members: (p: MemberListParams) => api.get<Paginated<Member>>(`${BASE}/members`, params(p)),
  createMember: (input: MemberCreateInput) => api.post<Member>(`${BASE}/members`, input),
  bulkMembers: (input: MemberBulkInput) =>
    api.post<MemberBulkResult>(`${BASE}/members/bulk`, input),
  member: (id: number) => api.get<MemberSummary>(`${BASE}/members/${id}`),
  updateMember: (id: number, input: MemberUpdateInput) =>
    api.patch<Member>(`${BASE}/members/${id}`, input),
  issueInsights: () => api.get<IssueInsights>(`${BASE}/issues/insights`),
  issues: (p: IssueListParams) => api.get<Paginated<Loan>>(`${BASE}/issues`, params(p)),
  issue: (input: IssueInput) => api.post<Loan[]>(`${BASE}/issues`, input),
  returnBooks: (items: ReturnItemInput[]) => api.post<ReturnedItem[]>(`${BASE}/returns`, { items }),
  followUps: (p: FollowUpListParams) => api.get<Paginated<Loan>>(`${BASE}/follow-ups`, params(p)),
  loan: (id: number) => api.get<LoanDetail>(`${BASE}/issues/${id}`),
  renew: (id: number, due_date?: string) =>
    api.post<Loan>(`${BASE}/issues/${id}/renew`, due_date ? { due_date } : {}),
  markLost: (id: number, note: string | null) =>
    api.post<LoanDetail>(`${BASE}/issues/${id}/lost`, { note }),
  markFound: (id: number) => api.post<LoanDetail>(`${BASE}/issues/${id}/found`),
  addFollowUp: (id: number, input: FollowUpInput) =>
    api.post<FollowUp>(`${BASE}/issues/${id}/follow-ups`, input),
  fineInsights: () => api.get<FineInsights>(`${BASE}/fines/insights`),
  fines: (p: FineListParams) => api.get<Paginated<Fine>>(`${BASE}/fines`, params(p)),
  payFine: (id: number, input: FinePaymentInput) =>
    api.post<FinePaymentResult>(`${BASE}/fines/${id}/payments`, input),
  waiveFine: (id: number, input: FineWaiveInput) =>
    api.post<Fine>(`${BASE}/fines/${id}/waive`, input),
  payments: (p: FinePaymentListParams) =>
    api.get<Paginated<FinePayment>>(`${BASE}/fine-payments`, params(p)),
  visitInsights: (date?: string) => api.get<VisitInsights>(`${BASE}/visits/insights`, { date }),
  scanVisit: (code: string, purpose?: VisitPurpose) =>
    api.post<VisitScanResult>(`${BASE}/visits/scan`, { code, purpose }),
  visits: (p: VisitListParams) => api.get<Paginated<Visit>>(`${BASE}/visits`, params(p)),
  checkOut: (id: number) => api.post<Visit>(`${BASE}/visits/${id}/check-out`),
  periods: (date?: string) => api.get<LibraryPeriod[]>(`${BASE}/periods`, { date }),
  roster: (slotId: number, date?: string) =>
    api.get<PeriodRoster>(`${BASE}/periods/${slotId}`, { date }),
  markPeriod: (slotId: number, date: string | undefined, absent_student_ids: number[]) =>
    api.put<PeriodRoster>(`${BASE}/periods/${slotId}/attendance`, { date, absent_student_ids }),
  audits: () => api.get<Audit[]>(`${BASE}/audits`),
  startAudit: (input: AuditCreateInput) => api.post<Audit>(`${BASE}/audits`, input),
  audit: (id: number) => api.get<Audit>(`${BASE}/audits/${id}`),
  auditItems: (id: number, p: AuditItemParams) =>
    api.get<Paginated<AuditItem>>(`${BASE}/audits/${id}/items`, params(p)),
  scanAudit: (id: number, code: string) =>
    api.post<AuditScanResult>(`${BASE}/audits/${id}/scan`, { code }),
  closeAudit: (id: number, withdraw_missing: boolean) =>
    api.post<Audit>(`${BASE}/audits/${id}/close`, { withdraw_missing }),
  mostBorrowed: (p: ReportParams) =>
    api.get<MostBorrowed[]>(`${BASE}/reports/most-borrowed`, params(p)),
  categoryReport: (p: ReportParams) =>
    api.get<CategoryReport[]>(`${BASE}/reports/categories`, params(p)),
  topReaders: (p: ReportParams) => api.get<TopReader[]>(`${BASE}/reports/top-readers`, params(p)),
  classReport: (p: ReportParams) => api.get<ClassReport[]>(`${BASE}/reports/classes`, params(p)),
  stock: () => api.get<StockReport>(`${BASE}/reports/stock`),
  studentLibrary: (id: number) => api.get<PersonLibrary>(`/admin/students/${id}/library`),
  staffLibrary: (id: number) => api.get<PersonLibrary>(`/admin/staff/${id}/library`),
}

const list = { placeholderData: keepPreviousData }

export function useLibraryDashboard() {
  return useQuery({ queryKey: libraryKeys.dashboard(), queryFn: libraryApi.dashboard })
}

export function useLibrarySettings() {
  return useQuery({ queryKey: libraryKeys.settings(), queryFn: libraryApi.settings })
}

export function useCategories() {
  return useQuery({ queryKey: libraryKeys.categories(), queryFn: libraryApi.categories })
}

export function useBookInsights() {
  return useQuery({ queryKey: libraryKeys.bookInsights(), queryFn: libraryApi.bookInsights })
}

export function useBooks(p: BookListParams) {
  return useQuery({ queryKey: libraryKeys.books(p), queryFn: () => libraryApi.books(p), ...list })
}

export function useBook(id: number) {
  return useQuery({ queryKey: libraryKeys.book(id), queryFn: () => libraryApi.book(id) })
}

export function useBookCopies(id: number) {
  return useQuery({
    queryKey: libraryKeys.bookCopies(id),
    queryFn: () => libraryApi.bookCopies(id),
  })
}

export function useCopies(p: CopyListParams) {
  return useQuery({
    queryKey: libraryKeys.copies(p),
    queryFn: () => libraryApi.copies(p),
    ...list,
  })
}

export function useCopyHistory(id: number | undefined) {
  return useQuery({
    queryKey: libraryKeys.copyHistory(id ?? 0),
    queryFn: () => libraryApi.copyHistory(id!),
    enabled: Boolean(id),
  })
}

export function useMemberInsights() {
  return useQuery({ queryKey: libraryKeys.memberInsights(), queryFn: libraryApi.memberInsights })
}

export function usePeople(search: string, type?: MemberType, enabled = true) {
  return useQuery({
    queryKey: libraryKeys.people(search, type),
    queryFn: () => libraryApi.people(search, type),
    enabled,
    ...list,
  })
}

export function useMembers(p: MemberListParams) {
  return useQuery({
    queryKey: libraryKeys.members(p),
    queryFn: () => libraryApi.members(p),
    ...list,
  })
}

export function useMember(id: number | undefined) {
  return useQuery({
    queryKey: libraryKeys.member(id ?? 0),
    queryFn: () => libraryApi.member(id!),
    enabled: Boolean(id),
  })
}

export function useIssueInsights() {
  return useQuery({ queryKey: libraryKeys.issueInsights(), queryFn: libraryApi.issueInsights })
}

export function useIssues(p: IssueListParams, enabled = true) {
  return useQuery({
    queryKey: libraryKeys.issues(p),
    queryFn: () => libraryApi.issues(p),
    enabled,
    ...list,
  })
}

export function useLoan(id: number | undefined) {
  return useQuery({
    queryKey: libraryKeys.issue(id ?? 0),
    queryFn: () => libraryApi.loan(id!),
    enabled: Boolean(id),
  })
}

export function useFollowUps(p: FollowUpListParams) {
  return useQuery({
    queryKey: libraryKeys.followUps(p),
    queryFn: () => libraryApi.followUps(p),
    ...list,
  })
}

export function useFineInsights() {
  return useQuery({ queryKey: libraryKeys.fineInsights(), queryFn: libraryApi.fineInsights })
}

export function useFines(p: FineListParams, enabled = true) {
  return useQuery({
    queryKey: libraryKeys.fines(p),
    queryFn: () => libraryApi.fines(p),
    enabled,
    ...list,
  })
}

export function useFinePayments(p: FinePaymentListParams) {
  return useQuery({
    queryKey: libraryKeys.payments(p),
    queryFn: () => libraryApi.payments(p),
    ...list,
  })
}

export function useVisitInsights(date?: string) {
  return useQuery({
    queryKey: libraryKeys.visitInsights(date),
    queryFn: () => libraryApi.visitInsights(date),
  })
}

export function useVisits(p: VisitListParams, enabled = true) {
  return useQuery({
    queryKey: libraryKeys.visits(p),
    queryFn: () => libraryApi.visits(p),
    enabled,
    ...list,
  })
}

export function usePeriods(date?: string) {
  return useQuery({ queryKey: libraryKeys.periods(date), queryFn: () => libraryApi.periods(date) })
}

export function usePeriodRoster(slotId: number | undefined, date?: string) {
  return useQuery({
    queryKey: libraryKeys.roster(slotId ?? 0, date),
    queryFn: () => libraryApi.roster(slotId!, date),
    enabled: Boolean(slotId),
    staleTime: 0,
  })
}

export function useAudits() {
  return useQuery({ queryKey: libraryKeys.audits(), queryFn: libraryApi.audits })
}

export function useAudit(id: number | undefined) {
  return useQuery({
    queryKey: libraryKeys.audit(id ?? 0),
    queryFn: () => libraryApi.audit(id!),
    enabled: Boolean(id),
  })
}

export function useAuditItems(id: number | undefined, p: AuditItemParams) {
  return useQuery({
    queryKey: libraryKeys.auditItems(id ?? 0, p),
    queryFn: () => libraryApi.auditItems(id!, p),
    enabled: Boolean(id),
    ...list,
  })
}

export function useMostBorrowed(p: ReportParams) {
  return useQuery({
    queryKey: libraryKeys.report('most-borrowed', p),
    queryFn: () => libraryApi.mostBorrowed(p),
    ...list,
  })
}

export function useCategoryReport(p: ReportParams) {
  return useQuery({
    queryKey: libraryKeys.report('categories', p),
    queryFn: () => libraryApi.categoryReport(p),
    ...list,
  })
}

export function useTopReaders(p: ReportParams) {
  return useQuery({
    queryKey: libraryKeys.report('top-readers', p),
    queryFn: () => libraryApi.topReaders(p),
    ...list,
  })
}

export function useClassReport(p: ReportParams) {
  return useQuery({
    queryKey: libraryKeys.report('classes', p),
    queryFn: () => libraryApi.classReport(p),
    ...list,
  })
}

export function useStockReport() {
  return useQuery({ queryKey: libraryKeys.stock(), queryFn: libraryApi.stock })
}

export function usePersonLibrary(kind: 'student' | 'staff', id: number) {
  return useQuery({
    queryKey: libraryKeys.person(kind, id),
    queryFn: () =>
      kind === 'student' ? libraryApi.studentLibrary(id) : libraryApi.staffLibrary(id),
  })
}

export function useLibraryMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: libraryKeys.all })
    },
  })
}
