import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/api/client'

export type Order = 'asc' | 'desc'
export type HostelGender = 'boys' | 'girls' | 'mixed'
export type HostelStatus = 'active' | 'inactive'
export type RoomStatus = 'active' | 'maintenance' | 'closed'
export type BedStatus = 'vacant' | 'occupied' | 'reserved' | 'blocked' | 'maintenance'
export type OptionalModule =
  'staff_duty' | 'lockers' | 'study_hall' | 'laundry' | 'medical' | 'mess'
export type ApplicationStatus =
  'pending' | 'waitlisted' | 'approved' | 'rejected' | 'cancelled' | 'admitted'
export type ApplicationAction = 'approve' | 'waitlist' | 'reject' | 'cancel'
export type AdmissionStatus = 'active' | 'on_leave' | 'checking_out' | 'checked_out'
export type Diet = 'veg' | 'non_veg' | 'eggetarian'
export type CheckoutStatus = 'open' | 'completed' | 'cancelled'
export type CheckoutReason =
  'year_end' | 'withdrawn' | 'day_scholar' | 'school_transfer' | 'disciplinary' | 'other'
export type ClearanceStatus = 'pending' | 'cleared' | 'waived'
export type RollSlot = 'morning' | 'evening' | 'night'
export type RollStatus = 'present' | 'absent' | 'late' | 'on_leave' | 'outing' | 'sick'
export type MarkMethod = 'manual' | 'qr' | 'auto'
export type LeaveKind = 'home' | 'outing' | 'medical' | 'festival' | 'other'
export type LeaveStatus =
  'awaiting_parent' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'out' | 'returned'
export type LeaveSource = 'parent' | 'warden' | 'office'
export type ConsentStatus = 'not_needed' | 'waiting' | 'given' | 'refused'
export type LeaveDecision = 'approve' | 'reject' | 'cancel'
export type PassVerdict =
  'can_go_out' | 'can_come_in' | 'not_approved' | 'not_started' | 'expired' | 'closed'
export type VisitStatus = 'inside' | 'left' | 'denied'
export type IdProofType = 'aadhaar' | 'driving_licence' | 'voter_id' | 'pan' | 'passport' | 'other'
export type ChargeKind = 'rent' | 'deposit'
export type RefundMode = 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'adjusted_to_fees'
export type DepositStatus = 'none' | 'unpaid' | 'paid' | 'settled'
export type DisciplineCategory =
  | 'late_return'
  | 'curfew'
  | 'misconduct'
  | 'ragging'
  | 'fighting'
  | 'damage'
  | 'contraband'
  | 'absent_without_leave'
  | 'other'
export type Severity = 'minor' | 'major' | 'critical'
export type DisciplineAction =
  | 'warning'
  | 'counselling'
  | 'parent_meeting'
  | 'fine'
  | 'hostel_suspension'
  | 'expulsion'
  | 'no_action'
export type CaseStatus = 'open' | 'action_taken' | 'closed' | 'withdrawn'
export type ComplaintCategory =
  | 'room'
  | 'electrical'
  | 'plumbing'
  | 'cleanliness'
  | 'food'
  | 'water'
  | 'internet'
  | 'security'
  | 'roommate'
  | 'staff'
  | 'other'
export type ComplaintStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'rejected'
export type ComplaintAction = 'start' | 'resolve' | 'close' | 'reject' | 'reopen'
export type Priority = 'low' | 'normal' | 'high' | 'urgent'
export type MaintenanceCategory =
  | 'electrical'
  | 'plumbing'
  | 'carpentry'
  | 'painting'
  | 'cleaning'
  | 'pest_control'
  | 'appliance'
  | 'civil'
  | 'other'
export type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'on_hold' | 'done' | 'cancelled'

export type EnabledModules = Record<OptionalModule, boolean>

export interface HostelSettings {
  enabled_modules: EnabledModules
  wake_up_time: string
  study_start_time: string
  study_end_time: string
  in_time: string
  lights_out_time: string
  outing_from_time: string
  outing_until_time: string
  parent_consent_for_leave: boolean
  holiday_mode: boolean
  rules: string | null
  caution_deposit: number
  bill_on_admission: boolean
}

export type HostelSettingsInput = Partial<Omit<HostelSettings, 'enabled_modules'>> & {
  enabled_modules?: Partial<EnabledModules>
}

export interface HostelModules {
  enabled_modules: EnabledModules
  holiday_mode: boolean
}

export interface Hostel {
  id: number
  name: string
  code: string
  gender: HostelGender
  status: HostelStatus
  warden_user_id: number | null
  warden_name: string | null
  phone: string | null
  address: string | null
  notes: string | null
  block_count: number
  room_count: number
  bed_count: number
  occupied_beds: number
}

export interface HostelInput {
  name: string
  code: string
  gender: HostelGender
  status?: HostelStatus
  warden_user_id?: number | null
  phone?: string | null
  address?: string | null
  notes?: string | null
}

export interface Block {
  id: number
  hostel_id: number
  name: string
  code: string
  sort_order: number
  incharge_user_id: number | null
  incharge_name: string | null
  floor_count: number
  room_count: number
  bed_count: number
  occupied_beds: number
}

export interface BlockInput {
  hostel_id: number
  name: string
  code: string
  sort_order?: number
  incharge_user_id?: number | null
}

export interface Floor {
  id: number
  hostel_id: number
  block_id: number
  name: string
  level: number
  room_count: number
  bed_count: number
  occupied_beds: number
}

export interface FloorInput {
  block_id: number
  name: string
  level: number
}

export interface RoomType {
  id: number
  name: string
  code: string
  default_beds: number
  is_ac: boolean
  attached_bathroom: boolean
  annual_fee: number
  amenities: string | null
  room_count: number
}

export interface RoomTypeInput {
  name: string
  code: string
  default_beds: number
  is_ac?: boolean
  attached_bathroom?: boolean
  annual_fee?: number
  amenities?: string | null
}

export interface BedOccupant {
  admission_id: number
  student_id: number
  student_name: string
  class_section: string | null
  from_date: string
}

export interface Bed {
  id: number
  room_id: number
  bed_no: string
  status: BedStatus
  notes: string | null
  occupant: BedOccupant | null
}

export interface Room {
  id: number
  hostel_id: number
  hostel_name: string
  block_id: number
  block_name: string
  floor_id: number
  floor_name: string
  room_type_id: number
  room_type_name: string
  room_no: string
  capacity: number
  status: RoomStatus
  notes: string | null
  occupied_beds: number
  vacant_beds: number
}

export interface RoomDetail extends Room {
  beds: Bed[]
}

export interface RoomInput {
  floor_id: number
  room_type_id: number
  room_no: string
  capacity?: number
  notes?: string | null
}

export interface RoomUpdateInput {
  room_type_id?: number
  room_no?: string
  capacity?: number
  status?: RoomStatus
  notes?: string | null
}

export interface RoomBulkInput {
  floor_id: number
  room_type_id: number
  prefix?: string
  start_no: number
  count: number
  pad?: number
}

export interface RoomBulkResult {
  created: number
  room_nos: string[]
}

export interface AvailableBed {
  bed_id: number
  bed_no: string
  room_id: number
  room_no: string
  block_name: string
  floor_name: string
  hostel_name: string
  room_type_name: string
}

export interface HostelDashboard {
  hostels: number
  blocks: number
  rooms: number
  total_beds: number
  occupied_beds: number
  vacant_beds: number
  reserved_beds: number
  unavailable_beds: number
  occupancy_percent: number
  rooms_under_maintenance: number
  enabled_modules: EnabledModules
}

export interface HostelStudent {
  id: number
  name: string
  admission_no: string
  gender: string
  class_name: string | null
  section_name: string | null
  photo_file_id: number | null
}

export interface GuardianContact {
  name: string
  mobile: string
  relation: string
}

export interface CurrentBed {
  bed_id: number
  bed_no: string
  room_id: number
  room_no: string
  block_name: string
  floor_name: string
  from_date: string
}

export interface Application {
  id: number
  application_no: string
  student: HostelStudent
  hostel_id: number | null
  hostel_name: string | null
  room_type_id: number | null
  room_type_name: string | null
  source: 'office' | 'parent'
  status: ApplicationStatus
  priority: number
  wanted_from: string | null
  reason: string | null
  decision_note: string | null
  decided_at: string | null
  admission_id: number | null
  created_at: string
}

export interface ApplicationInput {
  student_id: number
  hostel_id?: number | null
  room_type_id?: number | null
  priority?: number
  wanted_from?: string
  reason?: string | null
}

export interface AdmissionDetailsInput {
  diet?: Diet
  local_guardian_name?: string | null
  local_guardian_mobile?: string | null
  local_guardian_relation?: string | null
  local_guardian_address?: string | null
  medical_notes?: string | null
  notes?: string | null
}

export interface AdmissionInput extends AdmissionDetailsInput {
  student_id: number
  hostel_id: number
  application_id?: number
  bed_id?: number
  admitted_on?: string
}

export interface Admission {
  id: number
  admission_no: string
  student: HostelStudent
  hostel_id: number
  hostel_name: string
  status: AdmissionStatus
  admitted_on: string
  checked_out_on: string | null
  diet: Diet
  bed: CurrentBed | null
  primary_guardian: GuardianContact | null
  local_guardian_name: string | null
  local_guardian_mobile: string | null
  local_guardian_relation: string | null
  local_guardian_address: string | null
  medical_notes: string | null
  notes: string | null
}

export interface AllocationHistory {
  id: number
  room_no: string
  bed_no: string
  hostel_name: string
  from_date: string
  to_date: string | null
  end_reason: string | null
}

export interface TransferHistory {
  id: number
  kind: 'transfer' | 'swap'
  from_bed: string | null
  to_bed: string
  transfer_date: string
  reason: string | null
}

export interface AdmissionDetail extends Admission {
  allocations: AllocationHistory[]
  transfers: TransferHistory[]
  open_checkout_id: number | null
}

export interface AdmissionInsights {
  active: number
  on_leave: number
  checking_out: number
  without_bed: number
  checked_out: number
  pending_applications: number
  waitlisted_applications: number
}

export interface StudentPick extends HostelStudent {
  hostel_admission_id: number | null
  application_id: number | null
  application_status: string | null
}

export interface StudentHostel {
  current: AdmissionDetail | null
  history: Admission[]
}

export interface ClearanceItem {
  code: string
  label: string
  status: ClearanceStatus
  amount: number | null
  note: string | null
  cleared_by_name: string | null
  cleared_at: string | null
}

export interface Checkout {
  id: number
  admission_id: number
  admission_no: string
  student: HostelStudent
  hostel_name: string
  bed: string | null
  status: CheckoutStatus
  reason: CheckoutReason
  checkout_date: string
  forwarding_address: string | null
  remarks: string | null
  pending_items: number
  hostel_dues: number
  deposit_held: number
  items: ClearanceItem[]
  completed_at: string | null
  created_at: string
}

export interface CheckoutStartInput {
  reason: CheckoutReason
  checkout_date?: string
  forwarding_address?: string | null
  remarks?: string | null
}

export interface ClearanceInput {
  status: ClearanceStatus
  amount?: number | null
  note?: string | null
}

export interface AuditEntry {
  id: number
  entity: string
  entity_id: number
  action: string
  student_id: number | null
  student_name: string | null
  actor_name: string | null
  changes: Record<string, unknown> | null
  note: string | null
  created_at: string
}

export interface RollCounts {
  total: number
  present: number
  absent: number
  late: number
  on_leave: number
  outing: number
  sick: number
  unmarked: number
}

export interface RollEntry {
  admission_id: number
  student: HostelStudent
  room_no: string | null
  bed_no: string | null
  block_name: string | null
  status: RollStatus | null
  suggested_status: RollStatus | null
  method: MarkMethod | null
  note: string | null
  marked_at: string | null
}

export interface RollSheet {
  roll_call_id: number | null
  date: string
  slot: RollSlot
  finished_at: string | null
  holiday_mode: boolean
  counts: RollCounts
  students: RollEntry[]
}

export interface RollSession {
  id: number
  hostel_id: number
  hostel_name: string
  roll_date: string
  slot: RollSlot
  finished_at: string | null
  present: number
  absent: number
  late: number
  away: number
  marked: number
}

export interface RollHistoryItem {
  date: string
  slot: RollSlot
  status: RollStatus
  method: MarkMethod
  note: string | null
  marked_at: string
}

export interface RollMarkInput {
  hostel_id: number
  slot: RollSlot
  date?: string
  entries: { admission_id: number; status: RollStatus; note?: string | null }[]
}

export interface RollFinishInput {
  hostel_id: number
  slot: RollSlot
  date?: string
  unmarked_as: 'present' | 'absent'
  block_id?: number
}

export interface Leave {
  id: number
  leave_no: string
  admission_id: number
  student: HostelStudent
  hostel_name: string
  bed: string | null
  kind: LeaveKind
  from_date: string
  to_date: string
  depart_time: string | null
  return_time: string | null
  expected_return_at: string
  reason: string
  source: LeaveSource
  status: LeaveStatus
  consent_status: ConsentStatus
  escort_name: string | null
  escort_relation: string | null
  escort_mobile: string | null
  decision_note: string | null
  decided_by_name: string | null
  departed_at: string | null
  returned_at: string | null
  late_minutes: number | null
  overdue: boolean
  qr_token: string | null
  created_at: string
}

export interface LeaveInput {
  admission_id: number
  kind: LeaveKind
  from_date: string
  to_date?: string
  depart_time?: string
  return_time?: string
  reason: string
  escort_name?: string | null
  escort_relation?: string | null
  escort_mobile?: string | null
  approve_now?: boolean
}

export interface PassCheckResult {
  ok: boolean
  verdict: PassVerdict
  message: string
  leave: Leave
}

export interface Visit {
  id: number
  visit_no: string
  admission_id: number
  student: HostelStudent
  hostel_name: string
  visitor_name: string
  relation: string
  mobile: string
  people_count: number
  id_proof_type: IdProofType | null
  id_proof_last4: string | null
  photo_file_id: number | null
  purpose: string | null
  is_known: boolean
  status: VisitStatus
  note: string | null
  in_at: string | null
  out_at: string | null
}

export interface VisitInput {
  admission_id: number
  visitor_name: string
  relation: string
  mobile: string
  people_count?: number
  id_proof_type?: IdProofType
  id_proof_last4?: string
  purpose?: string | null
  deny?: boolean
  note?: string | null
}

export interface VisitorLookup {
  blocked: boolean
  blocked_reason: string | null
  known: boolean
  known_name: string | null
  known_relation: string | null
  photo_file_id: number | null
  last_visit_at: string | null
}

export interface ApprovedVisitor {
  id: number
  student_id: number
  name: string
  relation: string
  mobile: string
  photo_file_id: number | null
  added_by_role: 'parent' | 'staff'
  created_at: string
}

export interface ApprovedVisitorInput {
  name: string
  relation: string
  mobile: string
}

export interface Blocked {
  id: number
  mobile: string
  name: string | null
  reason: string
  created_at: string
}

export interface BlockedInput {
  mobile: string
  name?: string | null
  reason: string
}

export interface ScheduleItem {
  id: number
  label: string
  due_date: string
  share_percent: number
  invoiced: number
}

export interface Schedule {
  academic_year_id: number
  year_name: string
  items: ScheduleItem[]
  locked: boolean
}

export interface ScheduleItemInput {
  label: string
  due_date: string
  share_percent: number
}

export interface BillResult {
  invoices_created: number
  deposits_created: number
  amount: number
  skipped: { admission_id: number; student_name: string; reason: string }[]
}

export interface Charge {
  id: number
  kind: ChargeKind
  label: string
  amount: number
  invoice_id: number
  invoice_no: string
  due_date: string
  invoice_status: string
  paid: number
  balance: number
  settled_at: string | null
  deduction_amount: number | null
  deduction_reason: string | null
  refund_amount: number | null
  refund_mode: RefundMode | null
  refund_reference: string | null
}

export interface ResidentFees {
  admission_id: number
  student: HostelStudent
  room_type: string | null
  annual_fee: number | null
  billed: number
  paid: number
  balance: number
  dues: number
  charges: Charge[]
}

export interface DuesRow {
  admission_id: number
  student: HostelStudent
  hostel_name: string
  bed: string | null
  billed: number
  paid: number
  balance: number
  unbilled: number
  deposit_status: DepositStatus
}

export interface FeesInsights {
  billed: number
  collected: number
  outstanding: number
  residents_with_dues: number
  unbilled_residents: number
  deposits_held: number
}

export interface DepositSettleInput {
  deduction_amount?: number
  deduction_reason?: string | null
  refund_mode: RefundMode
  refund_reference?: string | null
}

export interface DisciplineCase {
  id: number
  case_no: string
  admission_id: number
  student: HostelStudent
  hostel_name: string
  bed: string | null
  leave_id: number | null
  category: DisciplineCategory
  severity: Severity
  incident_at: string
  location: string | null
  description: string
  witnesses: string | null
  status: CaseStatus
  action: DisciplineAction | null
  action_note: string | null
  suspended_from: string | null
  suspended_to: string | null
  fine_amount: number | null
  fee_fine_id: number | null
  fine_status: string | null
  visible_to_parent: boolean
  reported_by_name: string | null
  decided_by_name: string | null
  strikes: number
  created_at: string
}

export interface CaseInput {
  admission_id: number
  category: DisciplineCategory
  severity: Severity
  incident_at?: string
  location?: string | null
  description: string
  witnesses?: string | null
  leave_id?: number
  visible_to_parent?: boolean
}

export interface CaseActionInput {
  action: DisciplineAction
  action_note?: string | null
  fine_amount?: number
  suspended_from?: string
  suspended_to?: string
}

export interface TicketUpdate {
  status: string | null
  note: string | null
  actor_name: string | null
  created_at: string
}

export interface Complaint {
  id: number
  complaint_no: string
  hostel_id: number
  hostel_name: string
  room_id: number | null
  room_no: string | null
  admission_id: number | null
  student: HostelStudent | null
  category: ComplaintCategory
  priority: Priority
  title: string
  description: string
  photo_file_id: number | null
  raised_by_role: 'parent' | 'staff'
  raised_by_name: string | null
  status: ComplaintStatus
  assigned_to: number | null
  assigned_to_name: string | null
  due_at: string
  overdue: boolean
  resolution: string | null
  resolved_at: string | null
  rating: number | null
  rating_comment: string | null
  maintenance_ticket_id: number | null
  created_at: string
}

export interface ComplaintDetail extends Complaint {
  updates: TicketUpdate[]
}

export interface ComplaintInput {
  category: ComplaintCategory
  title: string
  description: string
  hostel_id?: number
  room_id?: number
  admission_id?: number
  priority?: Priority
}

export interface ComplaintPatchInput {
  priority?: Priority
  assigned_to?: number | null
  note?: string | null
}

export interface Ticket {
  id: number
  ticket_no: string
  hostel_id: number
  hostel_name: string
  room_id: number | null
  room_no: string | null
  bed_id: number | null
  bed_no: string | null
  category: MaintenanceCategory
  priority: Priority
  title: string
  description: string | null
  photo_file_id: number | null
  status: TicketStatus
  assigned_to: number | null
  assigned_to_name: string | null
  vendor_name: string | null
  scheduled_on: string | null
  blocks_room: boolean
  cost: number | null
  due_at: string
  overdue: boolean
  completed_at: string | null
  complaint_id: number | null
  charged_admission_id: number | null
  charged_fine_id: number | null
  created_by_name: string | null
  created_at: string
}

export interface TicketDetail extends Ticket {
  updates: TicketUpdate[]
}

export interface TicketInput {
  hostel_id?: number
  room_id?: number
  bed_id?: number
  category: MaintenanceCategory
  priority?: Priority
  title: string
  description?: string | null
  blocks_room?: boolean
}

export interface TicketChangeInput {
  status?: TicketStatus
  priority?: Priority
  assigned_to?: number | null
  vendor_name?: string | null
  scheduled_on?: string
  cost?: number | null
  note?: string | null
}

export interface TicketChargeInput {
  admission_id: number
  amount: number
  reason: string
}

export interface ConductInsights {
  open_cases: number
  open_complaints: number
  overdue_complaints: number
  open_tickets: number
  overdue_tickets: number
  average_rating: number | null
}

interface PageParams {
  page: number
  limit: number
  search?: string
  sort?: string
  order?: Order
}

export interface RoomListParams extends PageParams {
  hostel_id?: number
  block_id?: number
  floor_id?: number
  room_type_id?: number
  status?: RoomStatus
  has_vacancy?: boolean
}

export interface ApplicationListParams extends PageParams {
  status?: ApplicationStatus
  hostel_id?: number
}

export interface AdmissionListParams extends PageParams {
  hostel_id?: number
  block_id?: number
  room_id?: number
  class_id?: number
  status?: AdmissionStatus
  has_bed?: boolean
}

export interface CheckoutListParams extends PageParams {
  status?: CheckoutStatus
  hostel_id?: number
}

export interface AuditListParams extends PageParams {
  entity?: string
  student_id?: number
  from?: string
  to?: string
}

export interface RollSheetParams {
  hostel_id: number
  slot: RollSlot
  date?: string
  block_id?: number
  floor_id?: number
  room_id?: number
  unmarked?: boolean
}

export interface RollSessionParams extends PageParams {
  hostel_id?: number
  slot?: RollSlot
  from?: string
  to?: string
}

export interface LeaveListParams extends PageParams {
  hostel_id?: number
  admission_id?: number
  status?: LeaveStatus
  kind?: LeaveKind
  overdue?: boolean
  on_date?: string
}

export interface VisitListParams extends PageParams {
  hostel_id?: number
  admission_id?: number
  status?: VisitStatus
  date?: string
}

export interface DuesListParams extends PageParams {
  hostel_id?: number
  with_balance?: boolean
}

export interface CaseListParams extends PageParams {
  hostel_id?: number
  admission_id?: number
  status?: CaseStatus
  category?: DisciplineCategory
  severity?: Severity
}

export interface ComplaintListParams extends PageParams {
  hostel_id?: number
  admission_id?: number
  status?: ComplaintStatus
  category?: ComplaintCategory
  priority?: Priority
  overdue?: boolean
}

export interface TicketListParams extends PageParams {
  hostel_id?: number
  room_id?: number
  status?: TicketStatus
  category?: MaintenanceCategory
  priority?: Priority
  open?: boolean
  overdue?: boolean
}

const BASE = '/admin/hostel'

export const hostelKeys = {
  all: ['hostel'] as const,
  dashboard: (hostelId?: number) => [...hostelKeys.all, 'dashboard', hostelId ?? null] as const,
  settings: () => [...hostelKeys.all, 'settings'] as const,
  modules: () => [...hostelKeys.all, 'modules'] as const,
  hostels: () => [...hostelKeys.all, 'hostels'] as const,
  blocks: (hostelId?: number) => [...hostelKeys.all, 'blocks', hostelId ?? null] as const,
  floors: (blockId?: number) => [...hostelKeys.all, 'floors', blockId ?? null] as const,
  roomTypes: () => [...hostelKeys.all, 'room-types'] as const,
  rooms: (params: RoomListParams) => [...hostelKeys.all, 'rooms', params] as const,
  room: (id: number) => [...hostelKeys.all, 'room', id] as const,
  availableBeds: (hostelId?: number) =>
    [...hostelKeys.all, 'available-beds', hostelId ?? null] as const,
  applications: (params: ApplicationListParams) =>
    [...hostelKeys.all, 'applications', params] as const,
  admissions: (params: AdmissionListParams) => [...hostelKeys.all, 'admissions', params] as const,
  admissionInsights: (hostelId?: number) =>
    [...hostelKeys.all, 'admission-insights', hostelId ?? null] as const,
  admission: (id: number) => [...hostelKeys.all, 'admission', id] as const,
  studentHostel: (studentId: number) => [...hostelKeys.all, 'student', studentId] as const,
  checkouts: (params: CheckoutListParams) => [...hostelKeys.all, 'checkouts', params] as const,
  checkout: (id: number) => [...hostelKeys.all, 'checkout', id] as const,
  audit: (params: AuditListParams) => [...hostelKeys.all, 'audit', params] as const,
  rollSheet: (params: RollSheetParams) => [...hostelKeys.all, 'roll-sheet', params] as const,
  rollSessions: (params: RollSessionParams) =>
    [...hostelKeys.all, 'roll-sessions', params] as const,
  rollHistory: (admissionId: number) => [...hostelKeys.all, 'roll-history', admissionId] as const,
  leaves: (params: LeaveListParams) => [...hostelKeys.all, 'leaves', params] as const,
  visits: (params: VisitListParams) => [...hostelKeys.all, 'visits', params] as const,
  approvedVisitors: (studentId: number) =>
    [...hostelKeys.all, 'approved-visitors', studentId] as const,
  blocklist: () => [...hostelKeys.all, 'blocklist'] as const,
  schedule: () => [...hostelKeys.all, 'schedule'] as const,
  feesInsights: (hostelId?: number) =>
    [...hostelKeys.all, 'fees-insights', hostelId ?? null] as const,
  dues: (params: DuesListParams) => [...hostelKeys.all, 'dues', params] as const,
  residentFees: (admissionId: number) => [...hostelKeys.all, 'resident-fees', admissionId] as const,
  conductInsights: (hostelId?: number) =>
    [...hostelKeys.all, 'conduct-insights', hostelId ?? null] as const,
  cases: (params: CaseListParams) => [...hostelKeys.all, 'cases', params] as const,
  complaints: (params: ComplaintListParams) => [...hostelKeys.all, 'complaints', params] as const,
  complaint: (id: number) => [...hostelKeys.all, 'complaint', id] as const,
  tickets: (params: TicketListParams) => [...hostelKeys.all, 'tickets', params] as const,
  ticket: (id: number) => [...hostelKeys.all, 'ticket', id] as const,
}

export const hostelApi = {
  dashboard: (hostelId?: number) =>
    api.get<HostelDashboard>(`${BASE}/dashboard`, { hostel_id: hostelId }),
  settings: () => api.get<HostelSettings>(`${BASE}/settings`),
  updateSettings: (input: HostelSettingsInput) =>
    api.put<HostelSettings>(`${BASE}/settings`, input),
  modules: () => api.get<HostelModules>(`${BASE}/modules`),
  hostels: () => api.get<Hostel[]>(`${BASE}/hostels`),
  createHostel: (input: HostelInput) => api.post<Hostel>(`${BASE}/hostels`, input),
  updateHostel: (id: number, input: Partial<HostelInput>) =>
    api.patch<Hostel>(`${BASE}/hostels/${id}`, input),
  removeHostel: (id: number) => api.delete<unknown>(`${BASE}/hostels/${id}`),
  blocks: (hostelId?: number) => api.get<Block[]>(`${BASE}/blocks`, { hostel_id: hostelId }),
  createBlock: (input: BlockInput) => api.post<Block>(`${BASE}/blocks`, input),
  updateBlock: (id: number, input: Partial<BlockInput>) =>
    api.patch<Block>(`${BASE}/blocks/${id}`, input),
  removeBlock: (id: number) => api.delete<unknown>(`${BASE}/blocks/${id}`),
  floors: (blockId?: number) => api.get<Floor[]>(`${BASE}/floors`, { block_id: blockId }),
  createFloor: (input: FloorInput) => api.post<Floor>(`${BASE}/floors`, input),
  updateFloor: (id: number, input: Partial<FloorInput>) =>
    api.patch<Floor>(`${BASE}/floors/${id}`, input),
  removeFloor: (id: number) => api.delete<unknown>(`${BASE}/floors/${id}`),
  roomTypes: () => api.get<RoomType[]>(`${BASE}/room-types`),
  createRoomType: (input: RoomTypeInput) => api.post<RoomType>(`${BASE}/room-types`, input),
  updateRoomType: (id: number, input: Partial<RoomTypeInput>) =>
    api.patch<RoomType>(`${BASE}/room-types/${id}`, input),
  removeRoomType: (id: number) => api.delete<unknown>(`${BASE}/room-types/${id}`),
  rooms: (params: RoomListParams) => api.get<Paginated<Room>>(`${BASE}/rooms`, { ...params }),
  room: (id: number) => api.get<RoomDetail>(`${BASE}/rooms/${id}`),
  createRoom: (input: RoomInput) => api.post<RoomDetail>(`${BASE}/rooms`, input),
  bulkRooms: (input: RoomBulkInput) => api.post<RoomBulkResult>(`${BASE}/rooms/bulk`, input),
  updateRoom: (id: number, input: RoomUpdateInput) =>
    api.patch<RoomDetail>(`${BASE}/rooms/${id}`, input),
  removeRoom: (id: number) => api.delete<unknown>(`${BASE}/rooms/${id}`),
  updateBed: (
    id: number,
    input: { status?: 'vacant' | 'blocked' | 'maintenance'; notes?: string | null }
  ) => api.patch<Bed>(`${BASE}/beds/${id}`, input),
  availableBeds: (hostelId?: number) =>
    api.get<AvailableBed[]>(`${BASE}/beds/available`, { hostel_id: hostelId }),
  applications: (params: ApplicationListParams) =>
    api.get<Paginated<Application>>(`${BASE}/applications`, { ...params }),
  createApplication: (input: ApplicationInput) =>
    api.post<Application>(`${BASE}/applications`, input),
  decideApplication: (id: number, action: ApplicationAction, note?: string | null) =>
    api.post<Application>(`${BASE}/applications/${id}/${action}`, { note: note ?? null }),
  admissions: (params: AdmissionListParams) =>
    api.get<Paginated<Admission>>(`${BASE}/admissions`, { ...params }),
  admissionInsights: (hostelId?: number) =>
    api.get<AdmissionInsights>(`${BASE}/admissions/insights`, { hostel_id: hostelId }),
  admission: (id: number) => api.get<AdmissionDetail>(`${BASE}/admissions/${id}`),
  admit: (input: AdmissionInput) => api.post<AdmissionDetail>(`${BASE}/admissions`, input),
  updateAdmission: (id: number, input: AdmissionDetailsInput) =>
    api.patch<AdmissionDetail>(`${BASE}/admissions/${id}`, input),
  allocate: (id: number, input: { bed_id: number; from_date?: string }) =>
    api.post<AdmissionDetail>(`${BASE}/admissions/${id}/allocate`, input),
  transfer: (
    id: number,
    input: { bed_id: number; transfer_date?: string; reason?: string | null }
  ) => api.post<AdmissionDetail>(`${BASE}/admissions/${id}/transfer`, input),
  swap: (
    id: number,
    input: { other_admission_id: number; transfer_date?: string; reason?: string | null }
  ) => api.post<AdmissionDetail>(`${BASE}/admissions/${id}/swap`, input),
  vacate: (id: number, input: { date?: string; reason?: string | null }) =>
    api.post<AdmissionDetail>(`${BASE}/admissions/${id}/vacate`, input),
  startCheckout: (id: number, input: CheckoutStartInput) =>
    api.post<Checkout>(`${BASE}/admissions/${id}/checkout`, input),
  studentHostel: (studentId: number) => api.get<StudentHostel>(`${BASE}/students/${studentId}`),
  checkouts: (params: CheckoutListParams) =>
    api.get<Paginated<Checkout>>(`${BASE}/checkouts`, { ...params }),
  checkout: (id: number) => api.get<Checkout>(`${BASE}/checkouts/${id}`),
  updateClearance: (id: number, code: string, input: ClearanceInput) =>
    api.patch<Checkout>(`${BASE}/checkouts/${id}/items/${code}`, input),
  completeCheckout: (id: number) => api.post<Checkout>(`${BASE}/checkouts/${id}/complete`),
  cancelCheckout: (id: number) => api.post<Checkout>(`${BASE}/checkouts/${id}/cancel`),
  audit: (params: AuditListParams) =>
    api.get<Paginated<AuditEntry>>(`${BASE}/audit-log`, { ...params }),
  rollSheet: (params: RollSheetParams) =>
    api.get<RollSheet>(`${BASE}/roll-calls/sheet`, { ...params }),
  rollSessions: (params: RollSessionParams) =>
    api.get<Paginated<RollSession>>(`${BASE}/roll-calls`, { ...params }),
  markRoll: (input: RollMarkInput) => api.post<RollSheet>(`${BASE}/roll-calls/mark`, input),
  finishRoll: (input: RollFinishInput) => api.post<RollSheet>(`${BASE}/roll-calls/finish`, input),
  rollHistory: (admissionId: number) =>
    api.get<RollHistoryItem[]>(`${BASE}/admissions/${admissionId}/roll-calls`),
  leaves: (params: LeaveListParams) => api.get<Paginated<Leave>>(`${BASE}/leaves`, { ...params }),
  createLeave: (input: LeaveInput) => api.post<Leave>(`${BASE}/leaves`, input),
  decideLeave: (id: number, action: LeaveDecision, note?: string | null) =>
    api.post<Leave>(`${BASE}/leaves/${id}/${action}`, { note: note ?? null }),
  checkPass: (input: { qr?: string; leave_no?: string }) =>
    api.post<PassCheckResult>(`${BASE}/passes/check`, input),
  passOut: (id: number) => api.post<Leave>(`${BASE}/passes/${id}/out`),
  passIn: (id: number) => api.post<Leave>(`${BASE}/passes/${id}/in`),
  visits: (params: VisitListParams) => api.get<Paginated<Visit>>(`${BASE}/visits`, { ...params }),
  lookupVisitor: (mobile: string, admissionId?: number) =>
    api.get<VisitorLookup>(`${BASE}/visitors/lookup`, { mobile, admission_id: admissionId }),
  checkIn: (input: VisitInput) => api.post<Visit>(`${BASE}/visits`, input),
  checkOut: (id: number) => api.post<Visit>(`${BASE}/visits/${id}/out`),
  approvedVisitors: (studentId: number) =>
    api.get<ApprovedVisitor[]>(`${BASE}/students/${studentId}/approved-visitors`),
  addApprovedVisitor: (studentId: number, input: ApprovedVisitorInput) =>
    api.post<ApprovedVisitor>(`${BASE}/students/${studentId}/approved-visitors`, input),
  removeApprovedVisitor: (studentId: number, id: number) =>
    api.delete<unknown>(`${BASE}/students/${studentId}/approved-visitors/${id}`),
  blocklist: () => api.get<Blocked[]>(`${BASE}/blocklist`),
  block: (input: BlockedInput) => api.post<Blocked>(`${BASE}/blocklist`, input),
  unblock: (id: number) => api.delete<unknown>(`${BASE}/blocklist/${id}`),
  schedule: () => api.get<Schedule>(`${BASE}/fees/schedule`),
  saveSchedule: (items: ScheduleItemInput[]) =>
    api.put<Schedule>(`${BASE}/fees/schedule`, { items }),
  bill: (input: { admission_ids?: number[]; hostel_id?: number }) =>
    api.post<BillResult>(`${BASE}/fees/bill`, input),
  feesInsights: (hostelId?: number) =>
    api.get<FeesInsights>(`${BASE}/fees/insights`, { hostel_id: hostelId }),
  dues: (params: DuesListParams) => api.get<Paginated<DuesRow>>(`${BASE}/fees/dues`, { ...params }),
  residentFees: (admissionId: number) =>
    api.get<ResidentFees>(`${BASE}/admissions/${admissionId}/fees`),
  settleDeposit: (admissionId: number, input: DepositSettleInput) =>
    api.post<ResidentFees>(`${BASE}/admissions/${admissionId}/deposit/settle`, input),
  conductInsights: (hostelId?: number) =>
    api.get<ConductInsights>(`${BASE}/conduct/insights`, { hostel_id: hostelId }),
  cases: (params: CaseListParams) =>
    api.get<Paginated<DisciplineCase>>(`${BASE}/discipline`, { ...params }),
  createCase: (input: CaseInput) => api.post<DisciplineCase>(`${BASE}/discipline`, input),
  actOnCase: (id: number, input: CaseActionInput) =>
    api.post<DisciplineCase>(`${BASE}/discipline/${id}/action`, input),
  closeCase: (id: number, note?: string | null) =>
    api.post<DisciplineCase>(`${BASE}/discipline/${id}/close`, { note: note ?? null }),
  withdrawCase: (id: number, note?: string | null) =>
    api.post<DisciplineCase>(`${BASE}/discipline/${id}/withdraw`, { note: note ?? null }),
  complaints: (params: ComplaintListParams) =>
    api.get<Paginated<Complaint>>(`${BASE}/complaints`, { ...params }),
  complaint: (id: number) => api.get<ComplaintDetail>(`${BASE}/complaints/${id}`),
  createComplaint: (input: ComplaintInput) =>
    api.post<ComplaintDetail>(`${BASE}/complaints`, input),
  patchComplaint: (id: number, input: ComplaintPatchInput) =>
    api.patch<ComplaintDetail>(`${BASE}/complaints/${id}`, input),
  actOnComplaint: (id: number, action: ComplaintAction, note?: string | null) =>
    api.post<ComplaintDetail>(`${BASE}/complaints/${id}/${action}`, { note: note ?? null }),
  complaintToTicket: (id: number, input: TicketInput) =>
    api.post<TicketDetail>(`${BASE}/complaints/${id}/maintenance`, input),
  tickets: (params: TicketListParams) =>
    api.get<Paginated<Ticket>>(`${BASE}/maintenance`, { ...params }),
  ticket: (id: number) => api.get<TicketDetail>(`${BASE}/maintenance/${id}`),
  createTicket: (input: TicketInput) => api.post<TicketDetail>(`${BASE}/maintenance`, input),
  changeTicket: (id: number, input: TicketChangeInput) =>
    api.patch<TicketDetail>(`${BASE}/maintenance/${id}`, input),
  chargeTicket: (id: number, input: TicketChargeInput) =>
    api.post<TicketDetail>(`${BASE}/maintenance/${id}/charge`, input),
}

const validId = (id: number) => Number.isFinite(id) && id > 0

export function useHostelDashboard(hostelId?: number, enabled = true) {
  return useQuery({
    queryKey: hostelKeys.dashboard(hostelId),
    queryFn: () => hostelApi.dashboard(hostelId),
    enabled,
  })
}

export function useHostelSettings(enabled = true) {
  return useQuery({ queryKey: hostelKeys.settings(), queryFn: hostelApi.settings, enabled })
}

export function useHostelModules(enabled = true) {
  return useQuery({ queryKey: hostelKeys.modules(), queryFn: hostelApi.modules, enabled })
}

export function useHostels(enabled = true) {
  return useQuery({ queryKey: hostelKeys.hostels(), queryFn: hostelApi.hostels, enabled })
}

export function useBlocks(hostelId?: number, enabled = true) {
  return useQuery({
    queryKey: hostelKeys.blocks(hostelId),
    queryFn: () => hostelApi.blocks(hostelId),
    enabled,
  })
}

export function useFloors(blockId?: number, enabled = true) {
  return useQuery({
    queryKey: hostelKeys.floors(blockId),
    queryFn: () => hostelApi.floors(blockId),
    enabled,
  })
}

export function useRoomTypes(enabled = true) {
  return useQuery({ queryKey: hostelKeys.roomTypes(), queryFn: hostelApi.roomTypes, enabled })
}

export function useRooms(params: RoomListParams, enabled = true) {
  return useQuery({
    queryKey: hostelKeys.rooms(params),
    queryFn: () => hostelApi.rooms(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useRoom(id: number) {
  return useQuery({
    queryKey: hostelKeys.room(id),
    queryFn: () => hostelApi.room(id),
    enabled: validId(id),
  })
}

export function useAvailableBeds(hostelId?: number, enabled = true) {
  return useQuery({
    queryKey: hostelKeys.availableBeds(hostelId),
    queryFn: () => hostelApi.availableBeds(hostelId),
    enabled,
  })
}

export function useApplications(params: ApplicationListParams, enabled = true) {
  return useQuery({
    queryKey: hostelKeys.applications(params),
    queryFn: () => hostelApi.applications(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useAdmissions(params: AdmissionListParams, enabled = true) {
  return useQuery({
    queryKey: hostelKeys.admissions(params),
    queryFn: () => hostelApi.admissions(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useAdmissionInsights(hostelId?: number, enabled = true) {
  return useQuery({
    queryKey: hostelKeys.admissionInsights(hostelId),
    queryFn: () => hostelApi.admissionInsights(hostelId),
    enabled,
  })
}

export function useAdmission(id: number) {
  return useQuery({
    queryKey: hostelKeys.admission(id),
    queryFn: () => hostelApi.admission(id),
    enabled: validId(id),
  })
}

export function useStudentHostel(studentId: number, enabled = true) {
  return useQuery({
    queryKey: hostelKeys.studentHostel(studentId),
    queryFn: () => hostelApi.studentHostel(studentId),
    enabled: enabled && validId(studentId),
  })
}

export function useCheckouts(params: CheckoutListParams, enabled = true) {
  return useQuery({
    queryKey: hostelKeys.checkouts(params),
    queryFn: () => hostelApi.checkouts(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useCheckout(id: number) {
  return useQuery({
    queryKey: hostelKeys.checkout(id),
    queryFn: () => hostelApi.checkout(id),
    enabled: validId(id),
  })
}

export function useHostelAudit(params: AuditListParams, enabled = true) {
  return useQuery({
    queryKey: hostelKeys.audit(params),
    queryFn: () => hostelApi.audit(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useRollSheet(params: RollSheetParams, enabled = true) {
  return useQuery({
    queryKey: hostelKeys.rollSheet(params),
    queryFn: () => hostelApi.rollSheet(params),
    placeholderData: keepPreviousData,
    enabled: enabled && validId(params.hostel_id),
  })
}

export function useRollSessions(params: RollSessionParams, enabled = true) {
  return useQuery({
    queryKey: hostelKeys.rollSessions(params),
    queryFn: () => hostelApi.rollSessions(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useRollHistory(admissionId: number, enabled = true) {
  return useQuery({
    queryKey: hostelKeys.rollHistory(admissionId),
    queryFn: () => hostelApi.rollHistory(admissionId),
    enabled: enabled && validId(admissionId),
  })
}

export function useLeaves(params: LeaveListParams, enabled = true) {
  return useQuery({
    queryKey: hostelKeys.leaves(params),
    queryFn: () => hostelApi.leaves(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useVisits(params: VisitListParams, enabled = true) {
  return useQuery({
    queryKey: hostelKeys.visits(params),
    queryFn: () => hostelApi.visits(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useApprovedVisitors(studentId: number, enabled = true) {
  return useQuery({
    queryKey: hostelKeys.approvedVisitors(studentId),
    queryFn: () => hostelApi.approvedVisitors(studentId),
    enabled: enabled && validId(studentId),
  })
}

export function useBlocklist(enabled = true) {
  return useQuery({ queryKey: hostelKeys.blocklist(), queryFn: hostelApi.blocklist, enabled })
}

export function useFeeSchedule(enabled = true) {
  return useQuery({
    queryKey: hostelKeys.schedule(),
    queryFn: hostelApi.schedule,
    enabled,
    meta: { silent: true },
  })
}

export function useFeesInsights(hostelId?: number, enabled = true) {
  return useQuery({
    queryKey: hostelKeys.feesInsights(hostelId),
    queryFn: () => hostelApi.feesInsights(hostelId),
    enabled,
  })
}

export function useDues(params: DuesListParams, enabled = true) {
  return useQuery({
    queryKey: hostelKeys.dues(params),
    queryFn: () => hostelApi.dues(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useResidentFees(admissionId: number, enabled = true) {
  return useQuery({
    queryKey: hostelKeys.residentFees(admissionId),
    queryFn: () => hostelApi.residentFees(admissionId),
    enabled: enabled && validId(admissionId),
  })
}

export function useConductInsights(hostelId?: number, enabled = true) {
  return useQuery({
    queryKey: hostelKeys.conductInsights(hostelId),
    queryFn: () => hostelApi.conductInsights(hostelId),
    enabled,
  })
}

export function useCases(params: CaseListParams, enabled = true) {
  return useQuery({
    queryKey: hostelKeys.cases(params),
    queryFn: () => hostelApi.cases(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useComplaints(params: ComplaintListParams, enabled = true) {
  return useQuery({
    queryKey: hostelKeys.complaints(params),
    queryFn: () => hostelApi.complaints(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useComplaint(id: number) {
  return useQuery({
    queryKey: hostelKeys.complaint(id),
    queryFn: () => hostelApi.complaint(id),
    enabled: validId(id),
  })
}

export function useTickets(params: TicketListParams, enabled = true) {
  return useQuery({
    queryKey: hostelKeys.tickets(params),
    queryFn: () => hostelApi.tickets(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useTicket(id: number) {
  return useQuery({
    queryKey: hostelKeys.ticket(id),
    queryFn: () => hostelApi.ticket(id),
    enabled: validId(id),
  })
}

export function useHostelMutation<TInput, TResult>(
  fn: (input: TInput) => Promise<TResult>,
  silent = true
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hostelKeys.all })
    },
  })
}
