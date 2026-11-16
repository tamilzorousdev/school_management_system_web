import type { BadgeTone } from '@/components/ui/badge'
import { STAFF_DOCUMENT_TYPES } from '@/features/staff/labels'
import type { CrewRole, DocumentState, DutyStatus, ExpiryFilter, LicenceType } from './api'

export const DUTY_STATUS: Record<DutyStatus, { label: string; tone: BadgeTone; hint: string }> = {
  approved: { label: 'On duty', tone: 'success', hint: 'Cleared and approved to run a bus' },
  pending: { label: 'Not approved', tone: 'warning', hint: 'Check the documents, then approve' },
  blocked: { label: 'Blocked', tone: 'danger', hint: 'A document expired or was rejected' },
}

export const DUTY_LABELS: Record<DutyStatus, string> = {
  approved: DUTY_STATUS.approved.label,
  pending: DUTY_STATUS.pending.label,
  blocked: DUTY_STATUS.blocked.label,
}

export const ROLE_LABELS: Record<CrewRole, string> = {
  driver: 'Driver',
  attendant: 'Bus attendant',
}

export const EXPIRY_FILTER_LABELS: Record<ExpiryFilter, string> = {
  expired: 'Something expired',
  due_soon: 'Ending in 30 days',
  missing: 'Date not set',
}

export const LICENCE_TYPE_LABELS: Record<LicenceType, string> = {
  LMV: 'LMV (light motor vehicle)',
  HMV: 'HMV (heavy motor vehicle)',
  TRANSPORT: 'Transport vehicle',
}

export const DOCUMENT_STATE: Record<DocumentState, { label: string; tone: BadgeTone }> = {
  missing: { label: 'Not uploaded', tone: 'neutral' },
  pending: { label: 'To check', tone: 'warning' },
  verified: { label: 'Verified', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
}

export const CREW_DOCUMENT_TYPES: Record<string, string> = {
  driving_licence: STAFF_DOCUMENT_TYPES.driving_licence,
  psv_badge: STAFF_DOCUMENT_TYPES.psv_badge,
  medical_fitness: STAFF_DOCUMENT_TYPES.medical_fitness,
  police_verification: STAFF_DOCUMENT_TYPES.police_verification,
  id_proof: STAFF_DOCUMENT_TYPES.id_proof,
  address_proof: STAFF_DOCUMENT_TYPES.address_proof,
  photo: STAFF_DOCUMENT_TYPES.photo,
  other: STAFF_DOCUMENT_TYPES.other,
}
