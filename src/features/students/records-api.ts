import { useQuery } from '@tanstack/react-query'
import type { NewDocument, VerifiableDoc } from '@/components/common/document-list'
import { api } from '@/lib/api/client'
import type { UploadedFile } from '@/lib/files'
import type { IdCardDesign } from '@/lib/id-card-design'
import type { Ref } from './api'
import { studentKeys } from './api'

export type BehaviourCategory = 'appreciation' | 'concern' | 'incident'
export type ExitType = 'transferred' | 'withdrawn'

export interface RecordCounts {
  documents: number
  documents_pending: number
  behaviour_notes: number
  concerns: number
  vaccinations_overdue: number
}

export interface StudentDocument extends VerifiableDoc {
  visible_to_parent: boolean
}

export interface Vaccination {
  id: number
  vaccine: string
  dose: string | null
  given_on: string | null
  due_on: string | null
  overdue: boolean
  notes: string | null
}

export interface Health {
  blood_group: string | null
  height_cm: number | null
  weight_kg: number | null
  bmi: number | null
  allergies: string | null
  conditions: string | null
  medications: string | null
  vision: string | null
  doctor_name: string | null
  doctor_mobile: string | null
  notes: string | null
  last_checkup_on: string | null
  updated_at: string | null
  vaccinations: Vaccination[]
}

export type HealthInput = Partial<
  Omit<Health, 'blood_group' | 'bmi' | 'updated_at' | 'vaccinations'>
>

export interface VaccinationInput {
  vaccine: string
  dose?: string | null
  given_on?: string | null
  due_on?: string | null
  notes?: string | null
}

export interface BehaviourNote {
  id: number
  noted_on: string
  category: BehaviourCategory
  title: string
  details: string | null
  action_taken: string | null
  visible_to_parent: boolean
  recorded_by: Ref | null
  created_at: string
}

export interface BehaviourInput {
  category: BehaviourCategory
  title: string
  details?: string | null
  action_taken?: string | null
  noted_on?: string
  visible_to_parent?: boolean
}

export interface DigitalId {
  student_id: number
  qr_token: string
  full_name: string
  admission_no: string
  class_section: string | null
  roll_no: number | null
  academic_year: string | null
  valid_till: string | null
}

export interface TransferCertificate {
  id: number
  tc_no: string
  exit_type: ExitType
  leaving_date: string
  issued_on: string
  reason: string
  conduct: string
  class_name: string | null
  section_name: string | null
  academic_year_name: string | null
  promotion_eligible: boolean
  remarks: string | null
}

export interface ExitInput {
  exit_type: ExitType
  leaving_date: string
  reason: string
  conduct?: string
  promotion_eligible?: boolean
  remarks?: string | null
}

export type ImportRowStatus = 'valid' | 'error' | 'created' | 'failed'

export interface ImportReport {
  mode: 'validate' | 'import'
  total_rows: number
  valid_rows: number
  error_rows: number
  created: number
  failed: number
  rows: {
    row: number
    status: ImportRowStatus
    name: string
    class_section: string | null
    admission_no: string | null
    errors: { field: string; message: string }[]
  }[]
}

export interface PromotionPreview {
  from_year: Ref
  to_year: Ref
  from_class: Ref
  suggested_class: Ref | null
  to_sections: Ref[]
  students: {
    student_id: number
    full_name: string
    admission_no: string
    section_name: string | null
    roll_no: number | null
    already_moved: boolean
  }[]
}

export interface PromotionInput {
  from_class_id: number
  to_class_id: number
  to_section_id?: number
  student_ids?: number[]
  detained_ids?: number[]
}

export type AchievementCategory =
  'academic' | 'sports' | 'arts' | 'cultural' | 'competition' | 'leadership' | 'other'
export type AchievementLevel =
  'class' | 'school' | 'zone' | 'district' | 'state' | 'national' | 'international'
export type AchievementResult = 'winner' | 'runner_up' | 'third_place' | 'participated'
export type EventScope = 'sports_day' | 'in_school' | 'inter_school' | 'out_of_school'
export type VenueType = 'indoor' | 'outdoor'
export type Participation = 'individual' | 'team'

export interface Achievement {
  id: number
  title: string
  category: AchievementCategory
  level: AchievementLevel
  result: AchievementResult
  event_scope: EventScope
  venue_type: VenueType | null
  participation: Participation
  team_name: string | null
  position: string | null
  prize_received: string | null
  school_reward: string | null
  points: number
  achieved_on: string
  description: string | null
  file: UploadedFile | null
  visible_to_parent: boolean
  added_by: Ref | null
  created_at: string
}

export interface AchievementInput {
  title: string
  category: AchievementCategory
  level: AchievementLevel
  result: AchievementResult
  event_scope: EventScope
  venue_type: VenueType | null
  participation: Participation
  team_name: string | null
  position: string | null
  prize_received: string | null
  school_reward: string | null
  achieved_on: string
  description: string | null
  file_id: number | null
  visible_to_parent: boolean
}

export const recordKeys = {
  all: (id: number) => [...studentKeys.all, 'records', id] as const,
  counts: (id: number) => [...recordKeys.all(id), 'counts'] as const,
  documents: (id: number) => [...recordKeys.all(id), 'documents'] as const,
  health: (id: number) => [...recordKeys.all(id), 'health'] as const,
  behaviour: (id: number) => [...recordKeys.all(id), 'behaviour'] as const,
  achievements: (id: number) => [...recordKeys.all(id), 'achievements'] as const,
  tc: (id: number) => [...recordKeys.all(id), 'tc'] as const,
  promotion: (classId: number) => [...studentKeys.all, 'promotion', classId] as const,
}

const base = (id: number) => `/admin/students/${id}`

export const recordsApi = {
  counts: (id: number) => api.get<RecordCounts>(`${base(id)}/record-counts`),
  documents: (id: number) => api.get<StudentDocument[]>(`${base(id)}/documents`),
  addDocument: (id: number, input: NewDocument) =>
    api.post<StudentDocument>(`${base(id)}/documents`, input),
  verifyDocument: (
    id: number,
    documentId: number,
    status: 'verified' | 'rejected',
    remarks: string | null
  ) =>
    api.post<StudentDocument>(`${base(id)}/documents/${documentId}/verify`, {
      status,
      ...(remarks ? { remarks } : {}),
    }),
  removeDocument: (id: number, documentId: number) =>
    api.delete<{ id: number }>(`${base(id)}/documents/${documentId}`),
  health: (id: number) => api.get<Health>(`${base(id)}/health`),
  saveHealth: (id: number, input: HealthInput) => api.put<Health>(`${base(id)}/health`, input),
  addVaccination: (id: number, input: VaccinationInput) =>
    api.post<Health>(`${base(id)}/vaccinations`, input),
  updateVaccination: (id: number, vaccinationId: number, input: Partial<VaccinationInput>) =>
    api.patch<Health>(`${base(id)}/vaccinations/${vaccinationId}`, input),
  removeVaccination: (id: number, vaccinationId: number) =>
    api.delete<Health>(`${base(id)}/vaccinations/${vaccinationId}`),
  behaviour: (id: number) => api.get<BehaviourNote[]>(`${base(id)}/behaviour`),
  addBehaviour: (id: number, input: BehaviourInput) =>
    api.post<BehaviourNote>(`${base(id)}/behaviour`, input),
  updateBehaviour: (id: number, noteId: number, input: Partial<BehaviourInput>) =>
    api.patch<BehaviourNote>(`${base(id)}/behaviour/${noteId}`, input),
  removeBehaviour: (id: number, noteId: number) =>
    api.delete<{ id: number }>(`${base(id)}/behaviour/${noteId}`),
  achievements: (id: number) => api.get<Achievement[]>(`${base(id)}/achievements`),
  addAchievement: (id: number, input: AchievementInput) =>
    api.post<Achievement>(`${base(id)}/achievements`, input),
  updateAchievement: (id: number, achievementId: number, input: Partial<AchievementInput>) =>
    api.patch<Achievement>(`${base(id)}/achievements/${achievementId}`, input),
  removeAchievement: (id: number, achievementId: number) =>
    api.delete<null>(`${base(id)}/achievements/${achievementId}`),
  reissueCard: (id: number) => api.post<DigitalId>(`${base(id)}/id-card/reissue`),
  exit: (id: number, input: ExitInput) => api.post<TransferCertificate>(`${base(id)}/exit`, input),
  tc: (id: number) => api.get<TransferCertificate>(`${base(id)}/tc`),
  importStudents: (file: File, mode: 'validate' | 'import', sendInvites: boolean) => {
    const form = new FormData()
    form.append('file', file)
    form.append('mode', mode)
    form.append('send_invites', String(sendInvites))
    return api.upload<ImportReport>('/admin/student-import', form)
  },
  promotionPreview: (classId: number) =>
    api.get<PromotionPreview>('/admin/promotions/preview', { class_id: classId }),
  promote: (input: PromotionInput) =>
    api.post<{ promoted: number; detained: number; skipped: number }>('/admin/promotions', input),
}

export const studentFiles = {
  idCard: (id: number, design?: IdCardDesign) =>
    `${base(id)}/id-card${design ? `?design=${design}` : ''}`,
  idCards: '/admin/id-cards',
  tc: (id: number) => `${base(id)}/tc/pdf`,
  template: '/admin/student-import/template',
}

export function useRecordCounts(id: number) {
  return useQuery({ queryKey: recordKeys.counts(id), queryFn: () => recordsApi.counts(id) })
}

export function useStudentDocuments(id: number) {
  return useQuery({ queryKey: recordKeys.documents(id), queryFn: () => recordsApi.documents(id) })
}

export function useHealth(id: number) {
  return useQuery({ queryKey: recordKeys.health(id), queryFn: () => recordsApi.health(id) })
}

export function useBehaviour(id: number) {
  return useQuery({ queryKey: recordKeys.behaviour(id), queryFn: () => recordsApi.behaviour(id) })
}

export function useAchievements(id: number) {
  return useQuery({
    queryKey: recordKeys.achievements(id),
    queryFn: () => recordsApi.achievements(id),
  })
}

export function useTransferCertificate(id: number, enabled: boolean) {
  return useQuery({
    queryKey: recordKeys.tc(id),
    queryFn: () => recordsApi.tc(id),
    enabled,
    retry: false,
    meta: { silent: true },
  })
}

export function usePromotionPreview(classId: number | null) {
  return useQuery({
    queryKey: recordKeys.promotion(classId ?? 0),
    queryFn: () => recordsApi.promotionPreview(classId!),
    enabled: Boolean(classId),
    retry: false,
    meta: { silent: true },
  })
}
