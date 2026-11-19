import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fleetKeys } from '@/features/fleet/api'
import { api, type Paginated } from '@/lib/api/client'
import { downloadFile, type UploadedFile } from '@/lib/files'

export type TicketStatus = 'open' | 'in_progress' | 'done'
export type TicketSource = 'obd' | 'manual' | 'driver'
export type TicketSeverity = 'low' | 'medium' | 'high'
export type TicketKind = 'repair' | 'service'
export type SortOrder = 'asc' | 'desc'
export type ServiceCategory =
  | 'engine_oil'
  | 'tyres'
  | 'brakes'
  | 'battery'
  | 'ac'
  | 'body'
  | 'electrical'
  | 'general_service'
  | 'other'
export type ExpenseCategory =
  | 'tyres'
  | 'insurance'
  | 'fitness'
  | 'permit'
  | 'puc'
  | 'road_tax'
  | 'rc'
  | 'speed_governor'
  | 'fire_extinguisher'
  | 'first_aid'
  | 'fine'
  | 'toll'
  | 'parking'
  | 'cleaning'
  | 'other'
export type PaymentMode = 'cash' | 'upi' | 'card' | 'fuel_card' | 'credit' | 'driver_paid'
export type FuelStatus = 'approved' | 'pending' | 'rejected'
export type VendorKind = 'garage' | 'fuel_station' | 'other'
export type DueStatus = 'ok' | 'due_soon' | 'overdue'
export type CheckState = 'ok' | 'failed' | 'blocked'
export type LogType = 'fuel' | 'service' | 'repair' | 'expense' | 'check'
export type ReportName = 'costs' | 'mileage' | 'due' | 'spend' | 'idle' | 'reimbursements'
export type ChangeEntity = 'fuel' | 'expense' | 'ticket' | 'settings'

export interface VehicleRef {
  id: number
  registration_no: string
  name: string
}

export interface PersonRef {
  id: number
  name: string
}

export interface VendorRef {
  id: number
  name: string
  phone: string | null
}

export interface WarrantyClaim {
  ticket_id: number
  until: string | null
  until_km: number | null
}

export interface Ticket {
  id: number
  vehicle: VehicleRef
  source: TicketSource
  fault_code: string | null
  severity: TicketSeverity | null
  title: string
  description: string | null
  status: TicketStatus
  opened_at: string
  closed_at: string | null
  cost: number | null
  vendor: string | null
  odometer_km: number | null
  notes: string | null
  kind: TicketKind
  category: ServiceCategory | null
  schedule_id: number | null
  parts_cost: number | null
  labour_cost: number | null
  garage: VendorRef | null
  bill_file: UploadedFile | null
  photo_file: UploadedFile | null
  off_road: boolean
  warranty_months: number | null
  warranty_km: number | null
  warranty_claim: WarrantyClaim | null
  reported_by: PersonRef | null
  created_at: string
  updated_at: string
}

export interface TicketInsights {
  total: number
  open: number
  in_progress: number
  done: number
  obd_open: number
  cost_this_month: number
  off_road: number
}

export interface TicketListParams {
  page: number
  limit: number
  search?: string
  sort?: 'opened_at' | 'closed_at' | 'cost' | 'status'
  order?: SortOrder
  status?: TicketStatus
  source?: TicketSource
  kind?: TicketKind
  category?: ServiceCategory
  off_road?: boolean
  vehicle_id?: number
}

export interface TicketInput {
  vehicle_id?: number
  title?: string
  description?: string | null
  fault_code?: string | null
  severity?: TicketSeverity | null
  status?: TicketStatus
  odometer_km?: number | null
  vendor?: string | null
  cost?: number | null
  notes?: string | null
  kind?: TicketKind
  category?: ServiceCategory | null
  schedule_id?: number | null
  parts_cost?: number | null
  labour_cost?: number | null
  vendor_id?: number | null
  bill_file_id?: number | null
  photo_file_id?: number | null
  off_road?: boolean
  warranty_months?: number | null
  warranty_km?: number | null
}

export interface CloseTicketInput {
  cost?: number
  vendor?: string
  notes?: string
  odometer_km?: number
  parts_cost?: number
  labour_cost?: number
  vendor_id?: number
  bill_file_id?: number
  warranty_months?: number
  warranty_km?: number
}

export interface GpsCheck {
  odometer_km: number | null
  gps_km: number | null
  status: 'ok' | 'mismatch' | 'unknown'
}

export interface FuelEntry {
  id: number
  vehicle: VehicleRef
  filled_on: string
  litres: number
  amount: number
  price_per_litre: number
  odometer_km: number
  km_since_last: number | null
  km_per_litre: number | null
  station: string | null
  bill_file: UploadedFile | null
  filled_by: PersonRef | null
  is_full: boolean
  status: FuelStatus
  review_note: string | null
  reviewed_by: PersonRef | null
  payment_mode: PaymentMode
  reimbursed_at: string | null
  fuel_station: VendorRef | null
  price_warning: string | null
  gps_check: GpsCheck | null
  created_at: string
}

export interface FuelInsights {
  entries_this_month: number
  litres_this_month: number
  amount_this_month: number
  avg_km_per_litre: number | null
  pending_approvals: number
  driver_paid_pending: number
}

export interface FuelListParams {
  page: number
  limit: number
  search?: string
  sort?: 'filled_on' | 'amount' | 'litres'
  order?: SortOrder
  vehicle_id?: number
  from?: string
  to?: string
  status?: FuelStatus
  payment_mode?: PaymentMode
  reimbursed?: boolean
}

export interface FuelInput {
  vehicle_id: number
  filled_on: string
  litres: number
  amount: number
  odometer_km: number
  station?: string | null
  bill_file_id?: number | null
  filled_by?: number | null
  is_full?: boolean
  payment_mode?: PaymentMode
  station_id?: number | null
  reason?: string | null
}

export interface Vendor extends VendorRef {
  kind: VendorKind
  gst_no: string | null
  address: string | null
  is_active: boolean
  total_spent: number
}

export interface VendorInput {
  kind?: VendorKind
  name?: string
  phone?: string | null
  gst_no?: string | null
  address?: string | null
  is_active?: boolean
}

export interface VendorListParams {
  page: number
  limit: number
  search?: string
  kind?: VendorKind
  active?: boolean
}

export interface Schedule {
  id: number
  vehicle: VehicleRef
  category: ServiceCategory
  title: string
  every_km: number | null
  every_months: number | null
  last_done_on: string
  last_done_km: number | null
  is_active: boolean
  current_km: number | null
  next_due_on: string | null
  next_due_km: number | null
  days_left: number | null
  km_left: number | null
  status: DueStatus
}

export interface ScheduleInput {
  vehicle_ids: number[]
  category: ServiceCategory
  title?: string
  every_km?: number | null
  every_months?: number | null
  last_done_on?: string
  last_done_km?: number | null
}

export interface ScheduleUpdate {
  title?: string
  every_km?: number | null
  every_months?: number | null
  last_done_on?: string
  last_done_km?: number | null
  is_active?: boolean
}

export interface ScheduleListParams {
  page: number
  limit: number
  search?: string
  vehicle_id?: number
  status?: DueStatus
  category?: ServiceCategory
}

export interface Expense {
  id: number
  vehicle: VehicleRef
  spent_on: string
  category: ExpenseCategory
  amount: number
  vendor: VendorRef | null
  paid_to: string | null
  payment_mode: PaymentMode
  reimbursed_at: string | null
  bill_file: UploadedFile | null
  note: string | null
  renewed_until: string | null
  created_by: PersonRef | null
  created_at: string
}

export interface ExpenseInput {
  vehicle_id?: number
  spent_on?: string
  category?: ExpenseCategory
  amount?: number
  vendor_id?: number | null
  paid_to?: string | null
  payment_mode?: PaymentMode
  bill_file_id?: number | null
  note?: string | null
  renewed_until?: string | null
  reason?: string | null
}

export interface ExpenseListParams {
  page: number
  limit: number
  search?: string
  sort?: 'spent_on' | 'amount'
  order?: SortOrder
  vehicle_id?: number
  category?: ExpenseCategory
  payment_mode?: PaymentMode
  reimbursed?: boolean
  from?: string
  to?: string
}

export interface ExpenseInsights {
  entries_this_month: number
  amount_this_month: number
  by_category: { category: string; amount: number }[]
  driver_paid_pending: number
}

export interface PreTripMark {
  item: string
  label: string
  ok: boolean
  note: string | null
  critical: boolean
}

export interface PreTripCheck {
  id: number
  vehicle: VehicleRef
  check_date: string
  checked_by: PersonRef
  items: PreTripMark[]
  odometer_km: number | null
  failed_count: number
  critical_failed: boolean
  blocked: boolean
  ticket_id: number | null
  photo_file: UploadedFile | null
  cleared_by: PersonRef | null
  cleared_at: string | null
  clear_note: string | null
  created_at: string
}

export interface PreTripTodayRow {
  vehicle: VehicleRef
  check: PreTripCheck | null
  off_road: boolean
}

export interface PreTripListParams {
  page: number
  limit: number
  search?: string
  vehicle_id?: number
  date?: string
  state?: CheckState
}

export interface VehicleSummary {
  vehicle: VehicleRef
  current_km: number | null
  odometer_source: 'tracker' | 'entries' | 'none'
  tank_litres: number | null
  monthly_budget: number | null
  spent_this_month: number
  fuel_this_month: number
  km_per_litre_this_month: number | null
  next_service: Schedule | null
  open_tickets: number
  off_road: boolean
}

export interface VehiclePlanInput {
  tank_litres: number | null
  monthly_budget: number | null
}

export interface VehicleLogEntry {
  type: LogType
  id: number
  on: string
  title: string
  detail: string | null
  amount: number | null
  status: string | null
  odometer_km: number | null
}

export interface VehicleLogParams {
  page: number
  limit: number
  search?: string
  type?: LogType
  from?: string
  to?: string
}

export interface ReportRange {
  from?: string
  to?: string
  vehicle_id?: number
}

export interface FleetInsights {
  fuel_this_month: number
  maintenance_this_month: number
  other_this_month: number
  total_this_month: number
  overdue_services: number
  due_soon_services: number
  avg_km_per_litre: number | null
  off_road_buses: number
  pending_fuel_approvals: number
  blocked_checks: number
  pending_reimbursements: number
  over_budget_buses: number
}

export interface CostRow {
  vehicle: VehicleRef
  month: string
  fuel: number
  service: number
  repair: number
  other: number
  total: number
  km: number | null
  cost_per_km: number | null
  cost_per_seat: number | null
  budget: number | null
  over_budget: boolean
}

export interface MileageRow {
  vehicle: VehicleRef
  month: string
  litres: number
  km: number | null
  km_per_litre: number | null
  normal: number | null
  low: boolean
}

export interface DocumentDue {
  vehicle: VehicleRef
  kind: string
  expiry: string
  days_left: number
}

export interface DueReport {
  services: Schedule[]
  documents: DocumentDue[]
}

export interface SpendRow {
  key: string
  label: string
  amount: number
  entries: number
}

export interface IdleRow {
  vehicle: VehicleRef
  alerts: number
  minutes: number
  litres: number
  amount: number
}

export interface ReimbursementRow {
  type: 'fuel' | 'expense'
  id: number
  vehicle: VehicleRef
  on: string
  amount: number
  paid_by: PersonRef | null
  title: string
}

export interface FleetSettings {
  due_soon_km: number
  due_soon_days: number
  low_mileage_drop_pct: number
  price_warning_pct: number
  idle_litres_per_hour: number
  pre_trip_check_required: boolean
  locked_until: string | null
}

export interface Change {
  id: number
  entity: ChangeEntity
  entity_id: number
  vehicle: VehicleRef | null
  action: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  note: string | null
  summary: string
  changed_by: PersonRef | null
  at: string
}

export interface ChangeParams {
  page: number
  limit: number
  entity?: ChangeEntity
  entity_id?: number
  vehicle_id?: number
}

export type SpendGroup = 'category' | 'vendor'

export const maintenanceKeys = {
  all: ['maintenance'] as const,
  tickets: (params: TicketListParams) => [...maintenanceKeys.all, 'tickets', params] as const,
  ticketInsights: (vehicleId?: number) =>
    [...maintenanceKeys.all, 'ticket-insights', vehicleId ?? 0] as const,
  fuel: (params: FuelListParams) => [...maintenanceKeys.all, 'fuel', params] as const,
  fuelInsights: (vehicleId?: number) =>
    [...maintenanceKeys.all, 'fuel-insights', vehicleId ?? 0] as const,
  schedules: (params: ScheduleListParams) => [...maintenanceKeys.all, 'schedules', params] as const,
  expenses: (params: ExpenseListParams) => [...maintenanceKeys.all, 'expenses', params] as const,
  expenseInsights: (vehicleId?: number) =>
    [...maintenanceKeys.all, 'expense-insights', vehicleId ?? 0] as const,
  vendors: (params: VendorListParams) => [...maintenanceKeys.all, 'vendors', params] as const,
  checks: (params: PreTripListParams) => [...maintenanceKeys.all, 'checks', params] as const,
  checksToday: () => [...maintenanceKeys.all, 'checks-today'] as const,
  summary: (vehicleId: number) => [...maintenanceKeys.all, 'summary', vehicleId] as const,
  log: (vehicleId: number, params: VehicleLogParams) =>
    [...maintenanceKeys.all, 'log', vehicleId, params] as const,
  report: (name: string, params: object) =>
    [...maintenanceKeys.all, 'report', name, params] as const,
  settings: () => [...maintenanceKeys.all, 'settings'] as const,
  changes: (params: ChangeParams) => [...maintenanceKeys.all, 'changes', params] as const,
}

const tickets = '/admin/fleet/maintenance'
const fuel = '/admin/fleet/fuel'
const fleet = '/admin/fleet'

export const maintenanceApi = {
  tickets: (params: TicketListParams) => api.get<Paginated<Ticket>>(tickets, { ...params }),
  ticketInsights: (vehicleId?: number) =>
    api.get<TicketInsights>(`${tickets}/insights`, { vehicle_id: vehicleId }),
  createTicket: (input: TicketInput) => api.post<Ticket>(tickets, input),
  updateTicket: (id: number, input: TicketInput) => api.patch<Ticket>(`${tickets}/${id}`, input),
  closeTicket: (id: number, input: CloseTicketInput) =>
    api.post<Ticket>(`${tickets}/${id}/close`, input),
  fuel: (params: FuelListParams) => api.get<Paginated<FuelEntry>>(fuel, { ...params }),
  fuelInsights: (vehicleId?: number) =>
    api.get<FuelInsights>(`${fuel}/insights`, { vehicle_id: vehicleId }),
  createFuel: (input: FuelInput) => api.post<FuelEntry>(fuel, input),
  updateFuel: (id: number, input: Partial<FuelInput>) =>
    api.patch<FuelEntry>(`${fuel}/${id}`, input),
  removeFuel: (id: number, reason?: string) =>
    api.delete<null>(`${fuel}/${id}`, { reason: reason || undefined }),
  approveFuel: (id: number, note?: string) =>
    api.post<FuelEntry>(`${fuel}/${id}/approve`, { note: note || undefined }),
  rejectFuel: (id: number, note: string) => api.post<FuelEntry>(`${fuel}/${id}/reject`, { note }),
  reimburseFuel: (id: number) => api.post<FuelEntry>(`${fuel}/${id}/reimburse`),
  schedules: (params: ScheduleListParams) =>
    api.get<Paginated<Schedule>>(`${fleet}/schedules`, { ...params }),
  createSchedules: (input: ScheduleInput) => api.post<Schedule[]>(`${fleet}/schedules`, input),
  applyStandard: (vehicleIds?: number[]) =>
    api.post<{ added: number; buses: number }>(`${fleet}/schedules/apply-standard`, {
      vehicle_ids: vehicleIds?.length ? vehicleIds : undefined,
    }),
  updateSchedule: (id: number, input: ScheduleUpdate) =>
    api.patch<Schedule>(`${fleet}/schedules/${id}`, input),
  removeSchedule: (id: number) => api.delete<null>(`${fleet}/schedules/${id}`),
  expenses: (params: ExpenseListParams) =>
    api.get<Paginated<Expense>>(`${fleet}/expenses`, { ...params }),
  expenseInsights: (vehicleId?: number) =>
    api.get<ExpenseInsights>(`${fleet}/expenses/insights`, { vehicle_id: vehicleId }),
  createExpense: (input: ExpenseInput) => api.post<Expense>(`${fleet}/expenses`, input),
  updateExpense: (id: number, input: ExpenseInput) =>
    api.patch<Expense>(`${fleet}/expenses/${id}`, input),
  removeExpense: (id: number, reason?: string) =>
    api.delete<null>(`${fleet}/expenses/${id}`, { reason: reason || undefined }),
  reimburseExpense: (id: number) => api.post<Expense>(`${fleet}/expenses/${id}/reimburse`),
  vendors: (params: VendorListParams) =>
    api.get<Paginated<Vendor>>(`${fleet}/vendors`, { ...params }),
  createVendor: (input: VendorInput) => api.post<Vendor>(`${fleet}/vendors`, input),
  updateVendor: (id: number, input: VendorInput) =>
    api.patch<Vendor>(`${fleet}/vendors/${id}`, input),
  removeVendor: (id: number) => api.delete<null>(`${fleet}/vendors/${id}`),
  checks: (params: PreTripListParams) =>
    api.get<Paginated<PreTripCheck>>(`${fleet}/pre-trip-checks`, { ...params }),
  checksToday: () => api.get<PreTripTodayRow[]>(`${fleet}/pre-trip-checks/today`),
  clearCheck: (id: number, note: string) =>
    api.post<PreTripCheck>(`${fleet}/pre-trip-checks/${id}/clear`, { note }),
  summary: (vehicleId: number) => api.get<VehicleSummary>(`${fleet}/vehicles/${vehicleId}/summary`),
  log: (vehicleId: number, params: VehicleLogParams) =>
    api.get<Paginated<VehicleLogEntry>>(`${fleet}/vehicles/${vehicleId}/log`, { ...params }),
  downloadLog: (
    vehicleId: number,
    params: Omit<VehicleLogParams, 'page' | 'limit'>,
    name: string
  ) =>
    downloadFile(`${fleet}/vehicles/${vehicleId}/log/xlsx`, `Bus-log-${name}.xlsx`, {
      ...params,
    }),
  updatePlan: (vehicleId: number, input: VehiclePlanInput) =>
    api.patch<VehicleSummary>(`${fleet}/vehicles/${vehicleId}/plan`, input),
  insights: () => api.get<FleetInsights>(`${fleet}/reports/insights`),
  due: () => api.get<DueReport>(`${fleet}/reports/due`),
  costs: (range: ReportRange) => api.get<CostRow[]>(`${fleet}/reports/costs`, { ...range }),
  mileage: (range: ReportRange) => api.get<MileageRow[]>(`${fleet}/reports/mileage`, { ...range }),
  spend: (range: ReportRange & { group?: SpendGroup }) =>
    api.get<SpendRow[]>(`${fleet}/reports/spend`, { ...range }),
  idle: (range: ReportRange) => api.get<IdleRow[]>(`${fleet}/reports/idle`, { ...range }),
  reimbursements: () => api.get<ReimbursementRow[]>(`${fleet}/reports/reimbursements`),
  downloadReport: (report: ReportName, params: ReportRange & { group?: SpendGroup }) =>
    downloadFile(`${fleet}/reports/${report}/xlsx`, `Bus-${report}-report.xlsx`, { ...params }),
  settings: () => api.get<FleetSettings>(`${fleet}/maintenance-settings`),
  updateSettings: (input: Partial<FleetSettings>) =>
    api.patch<FleetSettings>(`${fleet}/maintenance-settings`, input),
  changes: (params: ChangeParams) => api.get<Paginated<Change>>(`${fleet}/changes`, { ...params }),
}

export function useTickets(params: TicketListParams, enabled = true) {
  return useQuery({
    queryKey: maintenanceKeys.tickets(params),
    queryFn: () => maintenanceApi.tickets(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useTicketInsights(vehicleId?: number, enabled = true) {
  return useQuery({
    queryKey: maintenanceKeys.ticketInsights(vehicleId),
    queryFn: () => maintenanceApi.ticketInsights(vehicleId),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useFuelLog(params: FuelListParams, enabled = true) {
  return useQuery({
    queryKey: maintenanceKeys.fuel(params),
    queryFn: () => maintenanceApi.fuel(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useFuelInsights(vehicleId?: number, enabled = true) {
  return useQuery({
    queryKey: maintenanceKeys.fuelInsights(vehicleId),
    queryFn: () => maintenanceApi.fuelInsights(vehicleId),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useSchedules(params: ScheduleListParams, enabled = true) {
  return useQuery({
    queryKey: maintenanceKeys.schedules(params),
    queryFn: () => maintenanceApi.schedules(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useExpenses(params: ExpenseListParams, enabled = true) {
  return useQuery({
    queryKey: maintenanceKeys.expenses(params),
    queryFn: () => maintenanceApi.expenses(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useExpenseInsights(vehicleId?: number, enabled = true) {
  return useQuery({
    queryKey: maintenanceKeys.expenseInsights(vehicleId),
    queryFn: () => maintenanceApi.expenseInsights(vehicleId),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useVendors(params: VendorListParams, enabled = true) {
  return useQuery({
    queryKey: maintenanceKeys.vendors(params),
    queryFn: () => maintenanceApi.vendors(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useVendorOptions(kind?: VendorKind) {
  const vendors = useVendors({ page: 1, limit: 100, kind, active: true })
  return (vendors.data?.items ?? []).map((vendor) => ({
    value: String(vendor.id),
    label: vendor.name,
    hint: vendor.phone ?? undefined,
  }))
}

export function useChecks(params: PreTripListParams, enabled = true) {
  return useQuery({
    queryKey: maintenanceKeys.checks(params),
    queryFn: () => maintenanceApi.checks(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useChecksToday(enabled = true) {
  return useQuery({
    queryKey: maintenanceKeys.checksToday(),
    queryFn: maintenanceApi.checksToday,
    enabled,
  })
}

export function useVehicleSummary(vehicleId?: number) {
  return useQuery({
    queryKey: maintenanceKeys.summary(vehicleId ?? 0),
    queryFn: () => maintenanceApi.summary(vehicleId ?? 0),
    enabled: Boolean(vehicleId),
  })
}

export function useVehicleLog(vehicleId: number | undefined, params: VehicleLogParams) {
  return useQuery({
    queryKey: maintenanceKeys.log(vehicleId ?? 0, params),
    queryFn: () => maintenanceApi.log(vehicleId ?? 0, params),
    placeholderData: keepPreviousData,
    enabled: Boolean(vehicleId),
  })
}

export function useFleetInsights(enabled = true) {
  return useQuery({
    queryKey: maintenanceKeys.report('insights', {}),
    queryFn: maintenanceApi.insights,
    enabled,
  })
}

export function useDueReport(enabled = true) {
  return useQuery({
    queryKey: maintenanceKeys.report('due', {}),
    queryFn: maintenanceApi.due,
    enabled,
  })
}

export function useReport<T>(name: string, params: object, fn: () => Promise<T>, enabled = true) {
  return useQuery({
    queryKey: maintenanceKeys.report(name, params),
    queryFn: fn,
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useFleetSettings(enabled = true) {
  return useQuery({
    queryKey: maintenanceKeys.settings(),
    queryFn: maintenanceApi.settings,
    enabled,
  })
}

export function useChanges(params: ChangeParams, enabled = true) {
  return useQuery({
    queryKey: maintenanceKeys.changes(params),
    queryFn: () => maintenanceApi.changes(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useMaintenanceMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: maintenanceKeys.all })
      void queryClient.invalidateQueries({ queryKey: [...fleetKeys.all, 'health'] })
    },
  })
}
