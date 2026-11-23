import type { BadgeTone } from '@/components/ui/badge'
import { formatDate, formatDateTime } from '@/lib/format'
import type {
  AlumniExitType,
  AlumniGender,
  AlumniSource,
  AlumniStatus,
  FinalResult,
  HistoryResult,
  OccupationStatus,
  SubmissionStatus,
  SubmissionType,
  TimelineAction,
} from './api'

type Tone = { label: string; tone: BadgeTone }

export const ALUMNI_SOURCE: Record<AlumniSource, Tone> = {
  pass_out: { label: 'Passed out', tone: 'success' },
  converted: { label: 'Left with TC', tone: 'warning' },
  registered: { label: 'Added by staff', tone: 'neutral' },
  self: { label: 'Self-registered', tone: 'info' },
}

export const ALUMNI_STATUS: Record<AlumniStatus, Tone> = {
  active: { label: 'Active', tone: 'success' },
  inactive: { label: 'Do not contact', tone: 'neutral' },
}

export const EXIT_TYPE: Record<AlumniExitType, Tone> = {
  graduated: { label: 'Graduated', tone: 'success' },
  transferred: { label: 'Transferred', tone: 'warning' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral' },
}

export const OCCUPATION: Record<OccupationStatus, string> = {
  higher_studies: 'Higher studies',
  employed: 'Employed',
  self_employed: 'Self-employed',
  seeking: 'Looking for work',
  other: 'Other',
  unknown: 'Not known',
}

export const FINAL_RESULT: Record<FinalResult, Tone> = {
  pass: { label: 'Pass', tone: 'success' },
  fail: { label: 'Fail', tone: 'danger' },
}

export const GENDER: Record<AlumniGender, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
}

export const HISTORY_RESULT: Record<HistoryResult, Tone> = {
  promoted: { label: 'Promoted', tone: 'success' },
  detained: { label: 'Detained', tone: 'danger' },
  completed: { label: 'Completed', tone: 'info' },
  left: { label: 'Left', tone: 'warning' },
  studying: { label: 'Studying', tone: 'neutral' },
}

export const SUBMISSION_TYPE: Record<SubmissionType, Tone> = {
  registration: { label: 'New registration', tone: 'info' },
  update: { label: 'Details update', tone: 'neutral' },
}

export const SUBMISSION_STATUS: Record<SubmissionStatus, Tone> = {
  pending: { label: 'Waiting', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
}

export const TIMELINE_ACTION: Record<TimelineAction, string> = {
  created: 'Record created',
  passed_out: 'Passed out at year close',
  converted: 'Added from student record',
  updated: 'Profile updated',
  history_updated: 'Academic history updated',
  self_registered: 'Self-registration approved',
  self_update_approved: 'Self-update approved',
  status_changed: 'Status changed',
  link_issued: 'Update link created',
}

export const FIELD_LABELS: Record<string, string> = {
  first_name: 'First name',
  last_name: 'Last name',
  gender: 'Gender',
  dob: 'Date of birth',
  admission_no: 'Admission no',
  admission_date: 'Admitted on',
  batch_year: 'Batch',
  left_on: 'Left on',
  exit_type: 'How they left',
  final_class_name: 'Final class',
  final_section_name: 'Final section',
  final_academic_year_name: 'Final academic year',
  final_percent: 'Final %',
  final_grade: 'Final grade',
  final_result: 'Final result',
  tc_no: 'TC number',
  photo_file_id: 'Photo',
  mobile: 'Mobile',
  alt_mobile: 'Alternate mobile',
  email: 'Email',
  address_line: 'Address',
  city: 'City',
  state: 'State',
  pincode: 'Pincode',
  country: 'Country',
  linkedin_url: 'LinkedIn',
  contact_consent: 'Agrees to be contacted',
  occupation_status: 'Occupation',
  institution: 'Institution',
  course: 'Course',
  organization: 'Organisation',
  designation: 'Designation',
  notes: 'Staff notes',
  status: 'Status',
}

export const PAYLOAD_ORDER = [
  'first_name',
  'last_name',
  'gender',
  'dob',
  'batch_year',
  'final_class_name',
  'admission_no',
  'mobile',
  'alt_mobile',
  'email',
  'address_line',
  'city',
  'state',
  'pincode',
  'country',
  'linkedin_url',
  'occupation_status',
  'institution',
  'course',
  'organization',
  'designation',
  'contact_consent',
]

export const fieldLabel = (field: string) =>
  FIELD_LABELS[field] ?? field.replace(/_/g, ' ').replace(/^\w/, (char) => char.toUpperCase())

const DATE_FIELDS = new Set(['dob', 'admission_date', 'left_on'])

export function fieldValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (field === 'occupation_status' && typeof value === 'string')
    return OCCUPATION[value as OccupationStatus] ?? value
  if (field === 'exit_type' && typeof value === 'string')
    return EXIT_TYPE[value as AlumniExitType]?.label ?? value
  if (field === 'final_result' && typeof value === 'string')
    return FINAL_RESULT[value as FinalResult]?.label ?? value
  if (field === 'gender' && typeof value === 'string') return GENDER[value as AlumniGender] ?? value
  if (field === 'status' && typeof value === 'string')
    return ALUMNI_STATUS[value as AlumniStatus]?.label ?? value
  if (DATE_FIELDS.has(field) && typeof value === 'string') return formatDate(value)
  if (field.endsWith('_at') && typeof value === 'string') return formatDateTime(value)
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export const toOptions = <T extends string>(labels: Record<T, string>) =>
  (Object.entries(labels) as [T, string][]).map(([value, label]) => ({ value, label }))

export const toneOptions = <T extends string>(labels: Record<T, Tone>) =>
  (Object.entries(labels) as [T, Tone][]).map(([value, item]) => ({ value, label: item.label }))

export const classLabel = (className: string | null, sectionName: string | null) =>
  className
    ? [/^\d+$/.test(className) ? `Class ${className}` : className, sectionName]
        .filter(Boolean)
        .join(' - ')
    : '—'

export const careerLine = (item: {
  occupation_status: OccupationStatus
  institution: string | null
  organization: string | null
}) => {
  const place =
    item.occupation_status === 'higher_studies'
      ? (item.institution ?? item.organization)
      : (item.organization ?? item.institution)
  return [OCCUPATION[item.occupation_status], place].filter(Boolean).join(' · ')
}
