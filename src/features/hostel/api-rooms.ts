import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/api/client'
import type {
  DisciplineCategory,
  HostelStudent,
  MaintenanceCategory,
  Order,
  Priority,
  Severity,
} from './api'

export type LockerSize = 'small' | 'medium' | 'large'
export type LockerStatus = 'available' | 'allotted' | 'damaged' | 'blocked'
export type LockerSettableStatus = 'available' | 'damaged' | 'blocked'
export type LockType = 'school' | 'own'
export type AssetCondition = 'good' | 'fair' | 'damaged' | 'missing'
export type InspectionResult = 'ok' | 'issues'
export type CheckResult = 'ok' | 'issue' | 'na'
export type BelongingStatus = 'with_student' | 'returned_home' | 'lost' | 'confiscated'

export interface LockerHolder {
  allocation_id: number
  admission_id: number
  student: HostelStudent
  from_date: string
  keys_given: number
  lock_type: LockType
  deposit: number | null
}

export interface Locker {
  id: number
  hostel_id: number
  hostel_name: string
  block_id: number | null
  block_name: string | null
  room_id: number | null
  room_no: string | null
  locker_no: string
  size: LockerSize | null
  status: LockerStatus
  notes: string | null
  holder: LockerHolder | null
  created_at: string
}

export interface LockerAllocation {
  id: number
  locker_id: number
  locker_no: string
  admission_id: number
  student: HostelStudent
  from_date: string
  to_date: string | null
  keys_given: number
  keys_returned: number | null
  lock_type: LockType
  deposit: number | null
  return_note: string | null
  given_by_name: string | null
  returned_by_name: string | null
  created_at: string
}

export interface LockerDetail extends Locker {
  history: LockerAllocation[]
}

export interface LockerSummary {
  total: number
  available: number
  allotted: number
  damaged: number
  blocked: number
}

interface LockerPlaceInput {
  block_id?: number
  room_id?: number
  size?: LockerSize
}

export interface LockerInput extends LockerPlaceInput {
  hostel_id: number
  locker_no: string
  notes?: string | null
}

export interface LockerBulkInput extends LockerPlaceInput {
  hostel_id: number
  prefix?: string
  start_no: number
  count: number
  pad?: number
}

export interface LockerBulkResult {
  created: number
  locker_nos: string[]
}

export interface LockerUpdateInput {
  status?: LockerSettableStatus
  size?: LockerSize | null
  block_id?: number | null
  room_id?: number | null
  notes?: string | null
}

export interface LockerAllocateInput {
  admission_id: number
  keys_given?: number
  lock_type?: LockType
  deposit?: number | null
}

export interface LockerReturnInput {
  keys_returned: number
  damaged?: boolean
  note?: string | null
}

export interface RoomAsset {
  id: number
  hostel_id: number
  hostel_name: string
  room_id: number
  room_no: string
  block_name: string | null
  item_name: string
  quantity: number
  condition: AssetCondition
  inventory_asset_id: number | null
  asset_tag: string | null
  notes: string | null
  last_checked_at: string | null
  updated_at: string
}

export interface RoomAssetInput {
  item_name: string
  quantity: number
  condition?: AssetCondition
  inventory_asset_id?: number | null
  notes?: string | null
}

export type RoomAssetUpdateInput = Partial<RoomAssetInput>

export interface AssetTemplateItem {
  item_name: string
  quantity: number
}

export interface AssetApplyInput {
  room_ids?: number[]
  room_type_id?: number
  hostel_id?: number
  items: AssetTemplateItem[]
}

export interface AssetApplyResult {
  rooms: number
  added: number
}

export interface Checklist {
  items: string[]
}

export interface InspectionItemInput {
  item: string
  result: CheckResult
  note?: string | null
}

export interface AssetConditionInput {
  asset_id: number
  condition: AssetCondition
}

export interface InspectionTicketInput {
  category: MaintenanceCategory
  priority?: Priority
  title: string
  description?: string | null
  blocks_room?: boolean
}

export interface InspectionCaseInput {
  admission_id: number
  category: DisciplineCategory
  severity: Severity
  description: string
}

export interface InspectionInput {
  room_id: number
  inspected_at?: string
  cleanliness?: number
  items: InspectionItemInput[]
  notes?: string | null
  update_assets?: AssetConditionInput[]
  raise_ticket?: InspectionTicketInput
  raise_case?: InspectionCaseInput
}

export interface Inspection {
  id: number
  hostel_id: number
  hostel_name: string
  room_id: number
  room_no: string
  block_name: string | null
  inspected_at: string
  inspector_name: string | null
  score: number
  cleanliness: number | null
  result: InspectionResult
  issues: number
  notes: string | null
  maintenance_ticket_id: number | null
  ticket_no: string | null
  discipline_case_id: number | null
  case_no: string | null
  created_at: string
}

export interface InspectionItem {
  id: number
  item: string
  result: CheckResult
  note: string | null
}

export interface InspectionDetail extends Inspection {
  items: InspectionItem[]
}

export interface InspectionDue {
  room_id: number
  room_no: string
  hostel_id: number
  hostel_name: string
  block_name: string | null
  floor_name: string | null
  last_inspected_at: string | null
  days_since: number | null
}

export interface Belonging {
  id: number
  admission_id: number
  student_id: number
  item: string
  description: string | null
  serial_no: string | null
  quantity: number
  declared_on: string
  status: BelongingStatus
  photo_file_id: number | null
  notes: string | null
  declared_by_name: string | null
  created_at: string
}

export interface BelongingInput {
  item: string
  description?: string | null
  serial_no?: string | null
  quantity?: number
  declared_on?: string
  photo_file_id?: number
  notes?: string | null
}

export interface BelongingUpdateInput {
  status?: BelongingStatus
  notes?: string | null
}

interface PageParams {
  page: number
  limit: number
  search?: string
  sort?: string
  order?: Order
}

export interface LockerListParams extends PageParams {
  hostel_id?: number
  block_id?: number
  room_id?: number
  status?: LockerStatus
  available?: boolean
}

export interface AssetListParams extends PageParams {
  hostel_id?: number
  block_id?: number
  room_id?: number
  condition?: AssetCondition
}

export interface InspectionListParams extends PageParams {
  hostel_id?: number
  room_id?: number
  result?: InspectionResult
  from?: string
  to?: string
}

export interface InspectionDueParams extends PageParams {
  hostel_id?: number
  days?: number
}

const BASE = '/admin/hostel'

export const roomsKeys = {
  lockers: ['hostel', 'lockers'] as const,
  lockerSummary: (hostelId?: number) =>
    [...roomsKeys.lockers, 'summary', hostelId ?? null] as const,
  lockerList: (params: LockerListParams) => [...roomsKeys.lockers, 'list', params] as const,
  locker: (id: number) => [...roomsKeys.lockers, 'detail', id] as const,
  assets: ['hostel', 'assets'] as const,
  roomAssets: (roomId: number) => [...roomsKeys.assets, 'room', roomId] as const,
  assetList: (params: AssetListParams) => [...roomsKeys.assets, 'list', params] as const,
  inspections: ['hostel', 'inspections'] as const,
  checklist: () => [...roomsKeys.inspections, 'checklist'] as const,
  inspectionList: (params: InspectionListParams) =>
    [...roomsKeys.inspections, 'list', params] as const,
  inspectionDue: (params: InspectionDueParams) =>
    [...roomsKeys.inspections, 'due', params] as const,
  inspection: (id: number) => [...roomsKeys.inspections, 'detail', id] as const,
  belongings: (admissionId: number) => ['hostel', 'belongings', admissionId] as const,
}

export const roomsApi = {
  lockerSummary: (hostelId?: number) =>
    api.get<LockerSummary>(`${BASE}/lockers/summary`, { hostel_id: hostelId }),
  lockers: (params: LockerListParams) =>
    api.get<Paginated<Locker>>(`${BASE}/lockers`, { ...params }),
  locker: (id: number) => api.get<LockerDetail>(`${BASE}/lockers/${id}`),
  createLocker: (input: LockerInput) => api.post<LockerDetail>(`${BASE}/lockers`, input),
  bulkLockers: (input: LockerBulkInput) =>
    api.post<LockerBulkResult>(`${BASE}/lockers/bulk`, input),
  updateLocker: (id: number, input: LockerUpdateInput) =>
    api.patch<LockerDetail>(`${BASE}/lockers/${id}`, input),
  removeLocker: (id: number) => api.delete<void>(`${BASE}/lockers/${id}`),
  allocateLocker: (id: number, input: LockerAllocateInput) =>
    api.post<LockerDetail>(`${BASE}/lockers/${id}/allocate`, input),
  returnLocker: (allocationId: number, input: LockerReturnInput) =>
    api.post<LockerDetail>(`${BASE}/locker-allocations/${allocationId}/return`, input),

  roomAssets: (roomId: number) => api.get<RoomAsset[]>(`${BASE}/rooms/${roomId}/assets`),
  addRoomAsset: (roomId: number, input: RoomAssetInput) =>
    api.post<RoomAsset>(`${BASE}/rooms/${roomId}/assets`, input),
  assets: (params: AssetListParams) =>
    api.get<Paginated<RoomAsset>>(`${BASE}/assets`, { ...params }),
  applyAssets: (input: AssetApplyInput) =>
    api.post<AssetApplyResult>(`${BASE}/assets/apply`, input),
  updateAsset: (id: number, input: RoomAssetUpdateInput) =>
    api.patch<RoomAsset>(`${BASE}/assets/${id}`, input),
  removeAsset: (id: number) => api.delete<void>(`${BASE}/assets/${id}`),

  checklist: () => api.get<Checklist>(`${BASE}/inspections/checklist`),
  inspectionsDue: (params: InspectionDueParams) =>
    api.get<Paginated<InspectionDue>>(`${BASE}/inspections/due`, { ...params }),
  inspections: (params: InspectionListParams) =>
    api.get<Paginated<Inspection>>(`${BASE}/inspections`, { ...params }),
  inspection: (id: number) => api.get<InspectionDetail>(`${BASE}/inspections/${id}`),
  createInspection: (input: InspectionInput) =>
    api.post<InspectionDetail>(`${BASE}/inspections`, input),

  belongings: (admissionId: number) =>
    api.get<Belonging[]>(`${BASE}/admissions/${admissionId}/belongings`),
  addBelonging: (admissionId: number, input: BelongingInput) =>
    api.post<Belonging>(`${BASE}/admissions/${admissionId}/belongings`, input),
  updateBelonging: (id: number, input: BelongingUpdateInput) =>
    api.patch<Belonging>(`${BASE}/belongings/${id}`, input),
  removeBelonging: (id: number) => api.delete<void>(`${BASE}/belongings/${id}`),
}

const validId = (id: number) => Number.isFinite(id) && id > 0

export function useLockerSummary(hostelId?: number, enabled = true) {
  return useQuery({
    queryKey: roomsKeys.lockerSummary(hostelId),
    queryFn: () => roomsApi.lockerSummary(hostelId),
    enabled,
  })
}

export function useLockers(params: LockerListParams, enabled = true) {
  return useQuery({
    queryKey: roomsKeys.lockerList(params),
    queryFn: () => roomsApi.lockers(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useLocker(id: number) {
  return useQuery({
    queryKey: roomsKeys.locker(id),
    queryFn: () => roomsApi.locker(id),
    enabled: validId(id),
  })
}

export function useRoomAssets(roomId: number, enabled = true) {
  return useQuery({
    queryKey: roomsKeys.roomAssets(roomId),
    queryFn: () => roomsApi.roomAssets(roomId),
    enabled: enabled && validId(roomId),
  })
}

export function useAssets(params: AssetListParams, enabled = true) {
  return useQuery({
    queryKey: roomsKeys.assetList(params),
    queryFn: () => roomsApi.assets(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useChecklist(enabled = true) {
  return useQuery({
    queryKey: roomsKeys.checklist(),
    queryFn: roomsApi.checklist,
    staleTime: Infinity,
    enabled,
  })
}

export function useInspections(params: InspectionListParams, enabled = true) {
  return useQuery({
    queryKey: roomsKeys.inspectionList(params),
    queryFn: () => roomsApi.inspections(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useInspectionsDue(params: InspectionDueParams, enabled = true) {
  return useQuery({
    queryKey: roomsKeys.inspectionDue(params),
    queryFn: () => roomsApi.inspectionsDue(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useInspection(id: number) {
  return useQuery({
    queryKey: roomsKeys.inspection(id),
    queryFn: () => roomsApi.inspection(id),
    enabled: validId(id),
  })
}

export function useBelongings(admissionId: number, enabled = true) {
  return useQuery({
    queryKey: roomsKeys.belongings(admissionId),
    queryFn: () => roomsApi.belongings(admissionId),
    enabled: enabled && validId(admissionId),
  })
}
