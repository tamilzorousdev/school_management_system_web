import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/api/client'
import { downloadFile, type UploadedFile } from '@/lib/files'

export type PassStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'released' | 'expired'
export type PassSource = 'parent' | 'staff' | 'office' | 'gate'
export type PickupKind = 'guardian' | 'authorised' | 'other'
export type CheckMethod = 'qr' | 'code' | 'manual'
export type ConsentStatus = 'waiting' | 'approved' | 'rejected'
export type IdProof = 'aadhaar' | 'driving_licence' | 'voter_id' | 'pan' | 'passport' | 'other'
export type VisitStatus =
  'expected' | 'waiting' | 'allowed' | 'declined' | 'inside' | 'left' | 'cancelled'
export type VisitPurpose =
  | 'meet_staff'
  | 'parent_meeting'
  | 'fee_payment'
  | 'admission_enquiry'
  | 'delivery'
  | 'vendor'
  | 'interview'
  | 'event'
  | 'other'
export type GateEventKind =
  | 'pass_requested'
  | 'pass_approved'
  | 'pass_rejected'
  | 'pass_cancelled'
  | 'pass_expired'
  | 'emergency_raised'
  | 'emergency_escalated'
  | 'consent_asked'
  | 'consent_approved'
  | 'consent_rejected'
  | 'consent_verified'
  | 'pass_checked'
  | 'check_failed'
  | 'released'
  | 'visitor_registered'
  | 'visitor_invited'
  | 'visitor_allowed'
  | 'visitor_declined'
  | 'visitor_in'
  | 'visitor_out'
  | 'visitor_overstay'
  | 'blocked_person'
export type SortOrder = 'asc' | 'desc'

export interface GateRef {
  id: number
  name: string
}

export interface GateStudent {
  id: number
  name: string
  admission_no: string
  class_section: string | null
  photo: UploadedFile | null
}

export interface PickupPerson {
  kind: PickupKind
  id: number | null
  name: string
  relation: string | null
  mobile: string | null
  photo: UploadedFile | null
  valid_until: string | null
}

export interface GatePass {
  id: number
  pass_no: string
  student: GateStudent
  pass_date: string
  from_time: string
  until_time: string
  reason: string
  pickup: PickupPerson
  status: PassStatus
  source: PassSource
  is_emergency: boolean
  needs_consent: boolean
  consent_status: ConsentStatus | null
  consent_verified: boolean
  requested_by: GateRef | null
  decided_by: GateRef | null
  decided_at: string | null
  decision_note: string | null
  released_at: string | null
  released_by: GateRef | null
  release_method: CheckMethod | null
  release_photo: UploadedFile | null
  id_proof_kind: IdProof | null
  id_proof_last4: string | null
  escalated: boolean
  qr_token: string | null
  code: string | null
  created_at: string
}

export interface GateStudentCard {
  student: GateStudent
  people: PickupPerson[]
  today_passes: GatePass[]
  absent_today: boolean
}

export interface AuthorisedPickup {
  id: number
  student_id: number
  name: string
  relation: string
  mobile: string
  photo: UploadedFile | null
  valid_until: string | null
  is_active: boolean
  added_by: GateRef | null
}

export interface Visit {
  id: number
  visit_no: string
  visit_date: string
  name: string
  mobile: string
  photo: UploadedFile | null
  id_proof_kind: IdProof | null
  id_proof_last4: string | null
  purpose: VisitPurpose
  purpose_note: string | null
  company: string | null
  people_count: number
  vehicle_no: string | null
  host: GateRef | null
  student: GateStudent | null
  status: VisitStatus
  expected_from: string | null
  expected_until: string | null
  invited_by: GateRef | null
  decided_by: GateRef | null
  decision_note: string | null
  checked_in_at: string | null
  check_in_method: CheckMethod | null
  checked_out_at: string | null
  check_out_method: string | null
  overstay: boolean
  blocked: boolean
  qr_token: string | null
  code: string | null
  created_at: string
}

export interface GateEvent {
  id: number
  kind: GateEventKind
  label: string
  at: string
  actor: GateRef | null
  method: string | null
  note: string | null
  pass_id: number | null
  visit_id: number | null
}

export interface GateCounts {
  waiting_release: number
  released_today: number
  pending_approvals: number
  emergencies_waiting: number
  manual_today: number
  visitors_inside: number
  visitors_expected: number
  visitors_waiting: number
  overstays: number
  blocked_today: number
}

export interface GateToday {
  date: string
  counts: GateCounts
  due: GatePass[]
  emergencies: GatePass[]
  inside: Visit[]
  coming: Visit[]
  recent: GateEvent[]
}

export interface GateDayRow {
  date: string
  requested: number
  released: number
  emergencies: number
  manual: number
  rejected: number
  expired: number
  visitors: number
}

export interface GateCountRow {
  key: string
  label: string
  count: number
}

export interface GateReport {
  from: string
  to: string
  by_day: GateDayRow[]
  by_class: GateCountRow[]
  by_method: GateCountRow[]
  by_purpose: GateCountRow[]
  by_hour: GateCountRow[]
}

export interface Block {
  id: number
  name: string
  mobile: string | null
  reason: string
  is_active: boolean
  added_by: GateRef | null
  created_at: string
}

export interface StaffOption {
  id: number
  name: string
  role: string | null
}

export interface GateSettings {
  grace_minutes: number
  emergency_wait_minutes: number
  visitor_photo_required: boolean
  visitor_id_required: boolean
  visitor_checkout_time: string
  notify_office_on_manual: boolean
}

export interface PickupInput {
  kind: PickupKind
  guardian_id?: number
  authorised_id?: number
  name?: string
  relation?: string
  mobile?: string
  photo_file_id?: number
}

export interface StaffPassInput {
  student_id: number
  pass_date: string
  from_time: string
  until_time?: string
  reason: string
  pickup: PickupInput
  approve_now?: boolean
}

export interface InviteInput {
  name: string
  mobile: string
  purpose: VisitPurpose
  purpose_note?: string | null
  host_user_id?: number | null
  student_id?: number | null
  company?: string | null
  people_count?: number
  vehicle_no?: string | null
  visit_date: string
  expected_from?: string | null
  expected_until?: string | null
}

export interface AuthorisedPickupInput {
  name: string
  relation: string
  mobile: string
  photo_file_id?: number | null
  valid_until?: string | null
}

export type AuthorisedPickupUpdate = Partial<AuthorisedPickupInput> & { is_active?: boolean }

export interface BlockInput {
  name: string
  mobile?: string | null
  reason: string
  is_active?: boolean
}

export type BlockUpdate = Partial<BlockInput>

export interface DateRange {
  from?: string
  to?: string
}

export interface PassListParams extends DateRange {
  page: number
  limit: number
  search?: string
  sort?: 'pass_date' | 'created_at' | 'released_at'
  order?: SortOrder
  status?: PassStatus
  source?: PassSource
  method?: CheckMethod
  emergency?: boolean
  class_id?: number
  section_id?: number
}

export interface VisitListParams extends DateRange {
  page: number
  limit: number
  search?: string
  sort?: 'created_at' | 'visit_date' | 'checked_in_at'
  order?: SortOrder
  status?: VisitStatus
  purpose?: VisitPurpose
  host_user_id?: number
}

export interface EventListParams extends DateRange {
  page: number
  limit: number
  search?: string
  kind?: GateEventKind
  pass_id?: number
  visit_id?: number
}

export const gateKeys = {
  all: ['gate'] as const,
  today: () => [...gateKeys.all, 'today'] as const,
  passes: (params: PassListParams) => [...gateKeys.all, 'passes', params] as const,
  pass: (id: number) => [...gateKeys.all, 'pass', id] as const,
  visits: (params: VisitListParams) => [...gateKeys.all, 'visits', params] as const,
  visit: (id: number) => [...gateKeys.all, 'visit', id] as const,
  events: (params: EventListParams) => [...gateKeys.all, 'events', params] as const,
  report: (range: DateRange) => [...gateKeys.all, 'report', range] as const,
  settings: () => [...gateKeys.all, 'settings'] as const,
  students: (search: string) => [...gateKeys.all, 'students', search] as const,
  pickups: (studentId: number) => [...gateKeys.all, 'pickups', studentId] as const,
  blocklist: () => [...gateKeys.all, 'blocklist'] as const,
  staff: (search: string) => [...gateKeys.all, 'staff', search] as const,
  myVisitors: () => [...gateKeys.all, 'my-visitors'] as const,
}

const gate = '/admin/gate'

export const gateApi = {
  today: () => api.get<GateToday>(`${gate}/today`),
  events: (params: EventListParams) =>
    api.get<Paginated<GateEvent>>(`${gate}/events`, { ...params }),
  report: (range: DateRange) => api.get<GateReport>(`${gate}/report`, { ...range }),
  settings: () => api.get<GateSettings>(`${gate}/settings`),
  updateSettings: (input: Partial<GateSettings>) =>
    api.patch<GateSettings>(`${gate}/settings`, input),
  passes: (params: PassListParams) => api.get<Paginated<GatePass>>(`${gate}/passes`, { ...params }),
  downloadPasses: (params: Omit<PassListParams, 'page' | 'limit'>) =>
    downloadFile(`${gate}/passes/xlsx`, 'Gate-passes.xlsx', { ...params }),
  pass: (id: number) => api.get<GatePass>(`${gate}/passes/${id}`),
  createPass: (input: StaffPassInput) => api.post<GatePass>(`${gate}/passes`, input),
  decidePass: (id: number, approve: boolean, note?: string) =>
    api.post<GatePass>(`${gate}/passes/${id}/decision`, { approve, note: note || undefined }),
  cancelPass: (id: number) => api.post<GatePass>(`${gate}/passes/${id}/cancel`),
  students: (search: string) => api.get<GateStudentCard[]>(`${gate}/students`, { search }),
  pickups: (studentId: number) =>
    api.get<AuthorisedPickup[]>(`${gate}/students/${studentId}/pickups`),
  addPickup: (studentId: number, input: AuthorisedPickupInput) =>
    api.post<AuthorisedPickup>(`${gate}/students/${studentId}/pickups`, input),
  updatePickup: (id: number, input: AuthorisedPickupUpdate) =>
    api.patch<AuthorisedPickup>(`${gate}/pickups/${id}`, input),
  removePickup: (id: number) => api.delete<null>(`${gate}/pickups/${id}`),
  visits: (params: VisitListParams) => api.get<Paginated<Visit>>(`${gate}/visits`, { ...params }),
  downloadVisits: (params: Omit<VisitListParams, 'page' | 'limit'>) =>
    downloadFile(`${gate}/visits/xlsx`, 'Visitor-log.xlsx', { ...params }),
  visit: (id: number) => api.get<Visit>(`${gate}/visits/${id}`),
  invite: (input: InviteInput) => api.post<Visit>(`${gate}/visits/invite`, input),
  decideVisit: (id: number, allow: boolean, note?: string) =>
    api.post<Visit>(`${gate}/visits/${id}/decision`, { allow, note: note || undefined }),
  checkOut: (id: number) => api.post<Visit>(`${gate}/visits/${id}/out`),
  cancelVisit: (id: number) => api.post<Visit>(`${gate}/visits/${id}/cancel`),
  blocklist: () => api.get<Block[]>(`${gate}/blocklist`),
  addBlock: (input: BlockInput) => api.post<Block[]>(`${gate}/blocklist`, input),
  updateBlock: (id: number, input: BlockUpdate) =>
    api.patch<Block[]>(`${gate}/blocklist/${id}`, input),
  removeBlock: (id: number) => api.delete<null>(`${gate}/blocklist/${id}`),
  staff: (search?: string) => api.get<StaffOption[]>(`${gate}/staff`, { search }),
  myVisitors: () => api.get<Visit[]>('/me/visitors'),
  decideMyVisitor: (id: number, allow: boolean, note?: string) =>
    api.post<Visit>(`/me/visitors/${id}/decision`, { allow, note: note || undefined }),
}

const LIVE_REFRESH_MS = 20_000

export function useGateToday(enabled = true) {
  return useQuery({
    queryKey: gateKeys.today(),
    queryFn: gateApi.today,
    refetchInterval: LIVE_REFRESH_MS,
    enabled,
  })
}

export function useMyVisitors(enabled = true) {
  return useQuery({
    queryKey: gateKeys.myVisitors(),
    queryFn: gateApi.myVisitors,
    refetchInterval: LIVE_REFRESH_MS,
    enabled,
    meta: { silent: true },
  })
}

export function useGatePasses(params: PassListParams, enabled = true) {
  return useQuery({
    queryKey: gateKeys.passes(params),
    queryFn: () => gateApi.passes(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useGatePass(id: number | undefined) {
  return useQuery({
    queryKey: gateKeys.pass(id ?? 0),
    queryFn: () => gateApi.pass(id!),
    enabled: Boolean(id),
  })
}

export function useGateVisits(params: VisitListParams, enabled = true) {
  return useQuery({
    queryKey: gateKeys.visits(params),
    queryFn: () => gateApi.visits(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useGateVisit(id: number | undefined) {
  return useQuery({
    queryKey: gateKeys.visit(id ?? 0),
    queryFn: () => gateApi.visit(id!),
    enabled: Boolean(id),
  })
}

export function useGateEvents(params: EventListParams, enabled = true) {
  return useQuery({
    queryKey: gateKeys.events(params),
    queryFn: () => gateApi.events(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useGateReport(range: DateRange) {
  return useQuery({
    queryKey: gateKeys.report(range),
    queryFn: () => gateApi.report(range),
    placeholderData: keepPreviousData,
  })
}

export function useGateSettings() {
  return useQuery({ queryKey: gateKeys.settings(), queryFn: gateApi.settings })
}

export function useGateStudents(search: string) {
  const term = search.trim()
  return useQuery({
    queryKey: gateKeys.students(term),
    queryFn: () => gateApi.students(term),
    enabled: term.length >= 2,
    placeholderData: keepPreviousData,
    meta: { silent: true },
  })
}

export function usePickups(studentId: number | undefined) {
  return useQuery({
    queryKey: gateKeys.pickups(studentId ?? 0),
    queryFn: () => gateApi.pickups(studentId!),
    enabled: Boolean(studentId),
  })
}

export function useBlocklist() {
  return useQuery({ queryKey: gateKeys.blocklist(), queryFn: gateApi.blocklist })
}

export function useGateStaff(search: string) {
  const term = search.trim()
  return useQuery({
    queryKey: gateKeys.staff(term),
    queryFn: () => gateApi.staff(term || undefined),
    placeholderData: keepPreviousData,
    meta: { silent: true },
  })
}

export function useGateMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: gateKeys.all })
    },
  })
}
