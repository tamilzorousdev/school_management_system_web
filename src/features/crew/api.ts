import type { AllowedToday } from '@/features/transport/api'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NewDocument, VerifiableDoc } from '@/components/common/document-list'
import type { Language } from '@/features/auth/api'
import type { StaffDocumentType, StaffGender, StaffStatus } from '@/features/staff/api'
import type { CrewRole, DutyStatus, ExpiryKind, ExpiryState } from '@/features/transport/api'
import { api, type Paginated } from '@/lib/api/client'
import type { CrewSearch } from './search'

export type { CrewRole, DutyStatus }
export type LicenceType = 'LMV' | 'HMV' | 'TRANSPORT'
export type DocumentState = 'missing' | 'pending' | 'verified' | 'rejected'
export type ExpiryFilter = 'expired' | 'due_soon' | 'missing'

export interface Ref {
  id: number
  name: string
}

export interface CrewCheck {
  kind: ExpiryKind
  label: string
  document_type: StaffDocumentType
  document_status: DocumentState
  document_id: number | null
  expiry: ExpiryState
  clear: boolean
  problem: string | null
}

export interface CrewListItem {
  id: number
  user_id: number
  employee_no: string
  name: string
  mobile: string
  photo_file_id: number | null
  photo_url: string | null
  role: CrewRole
  designation: string
  status: StaffStatus
  duty_status: DutyStatus
  vehicle: Ref | null
  route: Ref | null
  licence_no: string | null
  licence_type: LicenceType | null
  expiries: ExpiryState[]
  on_app: boolean
}

export interface CrewDetail extends CrewListItem {
  email: string | null
  language: Language
  gender: StaffGender | null
  dob: string | null
  joining_date: string
  experience_years: number
  prior_experience_years: number
  address: string | null
  emergency_contact_name: string | null
  emergency_contact_mobile: string | null
  left_on: string | null
  licence_issued_on: string | null
  licence_expiry: string | null
  badge_no: string | null
  badge_expiry: string | null
  medical_fitness_expiry: string | null
  police_verified_on: string | null
  police_verification_expiry: string | null
  checks: CrewCheck[]
  clear: boolean
  approved_at: string | null
  approved_by: Ref | null
  approved_until: string | null
  last_reminded_at: string | null
  last_reminded_by: Ref | null
  documents: VerifiableDoc[]
  allowed_today: AllowedToday | null
}

export interface CrewInsights {
  drivers: number
  attendants: number
  approved: number
  pending: number
  blocked: number
  due_soon: number
  unassigned: number
}

export interface CrewFields {
  licence_no?: string | null
  licence_type?: LicenceType | null
  licence_issued_on?: string | null
  licence_expiry?: string | null
  badge_no?: string | null
  badge_expiry?: string | null
  medical_fitness_expiry?: string | null
  police_verified_on?: string | null
  police_verification_expiry?: string | null
}

export interface CrewProfileInput extends CrewFields {
  name: string
  mobile: string
  email?: string | null
  language?: Language
  gender?: StaffGender | null
  dob?: string | null
  joining_date?: string
  prior_experience_years?: number
  address?: string | null
  emergency_contact_name?: string | null
  emergency_contact_mobile?: string | null
  photo_file_id?: number | null
  employee_no?: string
}

export interface CreateCrewInput extends CrewProfileInput {
  role: CrewRole
  send_invite?: boolean
}

export interface UpdateCrewInput extends Partial<CrewProfileInput> {
  status?: StaffStatus
  left_on?: string | null
}

export type CrewListParams = Omit<CrewSearch, 'page'> & { page: number; limit: number }

export const crewKeys = {
  all: ['crew'] as const,
  list: (params: CrewListParams) => [...crewKeys.all, 'list', params] as const,
  insights: () => [...crewKeys.all, 'insights'] as const,
  detail: (id: number) => [...crewKeys.all, 'detail', id] as const,
}

const base = '/admin/crew'

export const crewApi = {
  list: (params: CrewListParams) => api.get<Paginated<CrewListItem>>(base, { ...params }),
  insights: () => api.get<CrewInsights>(`${base}/insights`),
  get: (id: number) => api.get<CrewDetail>(`${base}/${id}`),
  create: (input: CreateCrewInput) => api.post<CrewDetail>(base, input),
  update: (id: number, input: UpdateCrewInput) => api.patch<CrewDetail>(`${base}/${id}`, input),
  remove: (id: number) => api.delete<{ id: number }>(`${base}/${id}`),
  approve: (id: number) => api.post<CrewDetail>(`${base}/${id}/approve`),
  remind: (id: number) => api.post<CrewDetail>(`${base}/${id}/remind`),
  allowToday: (id: number, reason: string) =>
    api.post<AllowedToday>(`${base}/${id}/allow-today`, { reason }),
  remindMany: (staffIds: number[]) =>
    api.post<{ sent: number; skipped: number }>(`${base}/remind`, { staff_ids: staffIds }),
  addDocument: (id: number, input: NewDocument) =>
    api.post<VerifiableDoc>(`${base}/${id}/documents`, {
      type: input.type,
      title: input.title,
      file_id: input.file_id,
    }),
  verifyDocument: (
    id: number,
    documentId: number,
    status: 'verified' | 'rejected',
    remarks: string | null
  ) =>
    api.post<VerifiableDoc>(`${base}/${id}/documents/${documentId}/verify`, {
      status,
      ...(remarks ? { remarks } : {}),
    }),
  removeDocument: (id: number, documentId: number) =>
    api.delete<{ id: number }>(`${base}/${id}/documents/${documentId}`),
}

export function useCrewList(params: CrewListParams) {
  return useQuery({
    queryKey: crewKeys.list(params),
    queryFn: () => crewApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useCrewInsights() {
  return useQuery({ queryKey: crewKeys.insights(), queryFn: crewApi.insights })
}

export function useCrewMember(id: number | null) {
  return useQuery({
    queryKey: crewKeys.detail(id ?? 0),
    queryFn: () => crewApi.get(id!),
    enabled: Boolean(id),
  })
}

export function useCrewMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: crewKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['transport'] })
      void queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })
}
