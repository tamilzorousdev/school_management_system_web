import type { BadgeTone } from '@/components/ui/badge'
import type {
  AttentionReason,
  StaffDocumentType,
  StaffGender,
  StaffRoleCode,
  StaffStatus,
  StaffType,
} from './api'

export const STAFF_TYPE_LABELS: Record<StaffType, string> = {
  teaching: 'Teaching',
  non_teaching: 'Non-teaching',
}

export const STAFF_STATUS: Record<StaffStatus, { label: string; tone: BadgeTone }> = {
  active: { label: 'Working', tone: 'success' },
  on_leave: { label: 'On leave', tone: 'warning' },
  resigned: { label: 'Resigned', tone: 'neutral' },
}

export const STAFF_STATUS_LABELS: Record<StaffStatus, string> = {
  active: STAFF_STATUS.active.label,
  on_leave: STAFF_STATUS.on_leave.label,
  resigned: STAFF_STATUS.resigned.label,
}

export const STAFF_ROLE_LABELS: Record<StaffRoleCode, string> = {
  PRINCIPAL: 'Principal',
  AO: 'Administrative officer',
  HOD: 'Head of department',
  TEACHER: 'Teacher',
  TRANSPORT_INCHARGE: 'Transport in-charge',
  DRIVER: 'Driver',
  ATTENDANT: 'Bus attendant',
  ADMIN: 'School admin',
}

export const STAFF_ROLE_CODES = Object.keys(STAFF_ROLE_LABELS) as StaffRoleCode[]

export const ATTENTION: Record<AttentionReason, { label: string; tone: BadgeTone }> = {
  documents_pending: { label: 'Documents to check', tone: 'warning' },
  document_rejected: { label: 'Document rejected', tone: 'danger' },
  no_documents: { label: 'No documents', tone: 'warning' },
  bank_missing: { label: 'Bank details missing', tone: 'warning' },
  no_classes: { label: 'No classes this year', tone: 'info' },
  overloaded: { label: 'Overloaded', tone: 'danger' },
}

export const STAFF_DOCUMENT_TYPES: Record<StaffDocumentType, string> = {
  id_proof: 'ID proof',
  address_proof: 'Address proof',
  degree_certificate: 'Degree certificate',
  experience_letter: 'Experience letter',
  police_verification: 'Police verification',
  medical_fitness: 'Medical fitness',
  driving_licence: 'Driving licence',
  psv_badge: 'PSV badge',
  photo: 'Photo',
  other: 'Other',
}

export const GENDER_LABELS: Record<StaffGender, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
}

export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ta', label: 'தமிழ் (Tamil)' },
]

export const toOptions = <T extends string>(labels: Record<T, string>) =>
  (Object.entries(labels) as [T, string][]).map(([value, label]) => ({ value, label }))

export const roleLabel = (role: { code: string; name: string }) =>
  STAFF_ROLE_LABELS[role.code as StaffRoleCode] ?? role.name

export const yearsLabel = (years: number) =>
  years === 0 ? 'Less than a year' : `${years} ${years === 1 ? 'year' : 'years'}`

export const loadTone = (load: number, max: number): 'success' | 'warning' | 'danger' =>
  load > max ? 'danger' : load >= max ? 'warning' : 'success'
