import type { BadgeTone } from '@/components/ui/badge'
import type { AdmissionStatus, BloodGroup, Gender, Relation, StudentStatus } from './api'
import type { ExitType, NocDepartment } from './records-api'

export const RELATION_LABELS: Record<Relation, string> = {
  father: 'Father',
  mother: 'Mother',
  guardian: 'Guardian',
  grandparent: 'Grandparent',
  sibling: 'Elder sibling',
  other: 'Other',
}

export const GENDER_LABELS: Record<Gender, string> = { male: 'Boy', female: 'Girl', other: 'Other' }

export const STUDENT_STATUS: Record<StudentStatus, { label: string; tone: BadgeTone }> = {
  active: { label: 'Studying', tone: 'success' },
  transferred: { label: 'Transferred', tone: 'warning' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral' },
  alumni: { label: 'Alumni', tone: 'info' },
}

export const ADMISSION_STATUS: Record<AdmissionStatus, { label: string; tone: BadgeTone }> = {
  applied: { label: 'Waiting', tone: 'info' },
  approved: { label: 'Approved', tone: 'warning' },
  rejected: { label: 'Rejected', tone: 'danger' },
  enrolled: { label: 'Enrolled', tone: 'success' },
}

export const NOC_DEPARTMENT_LABELS: Record<NocDepartment, string> = {
  fees: 'Fees',
  library: 'Library',
  transport: 'Transport',
  inventory: 'Inventory and lab',
  class_teacher: 'Class teacher',
}

export const NOC_DEPARTMENT_HINTS: Record<NocDepartment, string> = {
  fees: 'Fee dues settled or acknowledged by accounts',
  library: 'Books returned and library fines paid',
  transport: 'Bus pass handed back; the student is taken off the bus',
  inventory: 'Lab, sports and other school items returned',
  class_teacher: 'Textbooks, ID card and class items handed back',
}

export const NOC_STATUS: Record<'open' | 'cleared', { label: string; tone: BadgeTone }> = {
  open: { label: 'Leaving: NOC pending', tone: 'warning' },
  cleared: { label: 'NOC cleared', tone: 'success' },
}

export const EXIT_TYPE_LABELS: Record<ExitType, string> = {
  transferred: 'Moving to another school',
  withdrawn: 'Withdrawn',
}

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  birth_certificate: 'Birth certificate',
  aadhaar: 'Aadhaar card',
  transfer_certificate: 'Transfer certificate',
  previous_marksheet: 'Previous mark sheet',
  community_certificate: 'Community certificate',
  medical_certificate: 'Medical certificate',
  photo: 'Photo',
  other: 'Other document',
}

export const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export const HOUSES = ['Red', 'Blue', 'Green', 'Yellow']

export const toOptions = <T extends string>(labels: Record<T, string>) =>
  (Object.entries(labels) as [T, string][]).map(([value, label]) => ({ value, label }))

export const classSection = (className?: string | null, sectionName?: string | null) =>
  className ? [className, sectionName].filter(Boolean).join(' - ') : 'Not placed'

export const yearsLabel = (years: number) =>
  years === 0 ? 'First year' : `${years} ${years === 1 ? 'year' : 'years'} here`
