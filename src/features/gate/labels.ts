import type { BadgeTone } from '@/components/ui/badge'
import { formatTime } from '@/lib/format'
import type {
  CheckMethod,
  GateEventKind,
  IdProof,
  PassSource,
  PassStatus,
  PickupKind,
  VisitPurpose,
  VisitStatus,
} from './api'

type Tag = { label: string; tone: BadgeTone }

export const PASS_STATUS: Record<PassStatus, Tag> = {
  pending: { label: 'Waiting for approval', tone: 'warning' },
  approved: { label: 'Approved', tone: 'info' },
  rejected: { label: 'Rejected', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  released: { label: 'Released', tone: 'success' },
  expired: { label: 'Expired', tone: 'neutral' },
}

export const VISIT_STATUS: Record<VisitStatus, Tag> = {
  expected: { label: 'Expected', tone: 'info' },
  waiting: { label: 'Waiting at the gate', tone: 'warning' },
  allowed: { label: 'Allowed', tone: 'info' },
  declined: { label: 'Declined', tone: 'danger' },
  inside: { label: 'Inside', tone: 'success' },
  left: { label: 'Left', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

export const CHECK_METHOD: Record<string, Tag> = {
  qr: { label: 'QR', tone: 'info' },
  code: { label: 'Code', tone: 'neutral' },
  manual: { label: 'By hand', tone: 'warning' },
  auto: { label: 'Auto, end of day', tone: 'neutral' },
}

export const PASS_SOURCE: Record<PassSource, string> = {
  parent: 'Parent app',
  staff: 'Teacher',
  office: 'Office',
  gate: 'Gate',
}

export const PICKUP_KIND: Record<PickupKind, string> = {
  guardian: 'Registered parent',
  authorised: 'Saved pickup person',
  other: 'Someone else',
}

export const VISIT_PURPOSE: Record<VisitPurpose, string> = {
  meet_staff: 'Meet a staff member',
  parent_meeting: 'Parent meeting',
  fee_payment: 'Fee payment',
  admission_enquiry: 'Admission enquiry',
  delivery: 'Delivery',
  vendor: 'Vendor or repair work',
  interview: 'Interview',
  event: 'Event',
  other: 'Other',
}

export const ID_PROOF: Record<IdProof, string> = {
  aadhaar: 'Aadhaar',
  driving_licence: 'Driving licence',
  voter_id: 'Voter ID',
  pan: 'PAN',
  passport: 'Passport',
  other: 'Other ID',
}

const EVENT_GROUPS: { group: string; kinds: [GateEventKind, string][] }[] = [
  {
    group: 'Gate pass',
    kinds: [
      ['pass_requested', 'Pass requested'],
      ['pass_approved', 'Pass approved'],
      ['pass_rejected', 'Pass rejected'],
      ['pass_cancelled', 'Pass cancelled'],
      ['pass_expired', 'Pass expired'],
    ],
  },
  {
    group: 'Emergency',
    kinds: [
      ['emergency_raised', 'Emergency request'],
      ['emergency_escalated', 'Emergency not answered'],
      ['consent_asked', 'Parent asked to agree'],
      ['consent_approved', 'Parent agreed'],
      ['consent_rejected', 'Parent refused'],
      ['consent_verified', 'Parent code checked'],
    ],
  },
  {
    group: 'At the gate',
    kinds: [
      ['pass_checked', 'Pass checked'],
      ['check_failed', 'Check failed'],
      ['released', 'Student released'],
    ],
  },
  {
    group: 'Visitors',
    kinds: [
      ['visitor_registered', 'Visitor registered'],
      ['visitor_invited', 'Visitor invited'],
      ['visitor_allowed', 'Visitor allowed'],
      ['visitor_declined', 'Visitor declined'],
      ['visitor_in', 'Visitor came in'],
      ['visitor_out', 'Visitor left'],
      ['visitor_overstay', 'Visitor stayed too long'],
    ],
  },
  { group: 'Safety', kinds: [['blocked_person', 'Blocked person came']] },
]

export const EVENT_KIND_OPTIONS = EVENT_GROUPS.flatMap(({ group, kinds }) =>
  kinds.map(([value, label]) => ({ value, label, hint: group }))
)

const DANGER_EVENTS: GateEventKind[] = [
  'blocked_person',
  'check_failed',
  'emergency_escalated',
  'consent_rejected',
  'pass_rejected',
  'visitor_declined',
]
const WARNING_EVENTS: GateEventKind[] = ['emergency_raised', 'visitor_overstay', 'consent_asked']
const SUCCESS_EVENTS: GateEventKind[] = [
  'released',
  'visitor_in',
  'pass_approved',
  'visitor_allowed',
]

export const eventTone = (kind: GateEventKind): BadgeTone =>
  DANGER_EVENTS.includes(kind)
    ? 'danger'
    : WARNING_EVENTS.includes(kind)
      ? 'warning'
      : SUCCESS_EVENTS.includes(kind)
        ? 'success'
        : 'neutral'

export const TONE_DOT: Record<BadgeTone, string> = {
  danger: 'bg-destructive',
  warning: 'bg-warning',
  success: 'bg-success',
  info: 'bg-info',
  neutral: 'bg-muted-foreground/50',
}

const options = <T extends string>(map: Record<T, string | Tag>) =>
  (Object.keys(map) as T[]).map((value) => {
    const item = map[value]
    return { value, label: typeof item === 'string' ? item : item.label }
  })

export const PASS_STATUS_OPTIONS = options(PASS_STATUS)
export const VISIT_STATUS_OPTIONS = options(VISIT_STATUS)
export const PASS_SOURCE_OPTIONS = options(PASS_SOURCE)
export const VISIT_PURPOSE_OPTIONS = options(VISIT_PURPOSE)
export const CHECK_METHOD_OPTIONS = (['qr', 'code', 'manual'] as CheckMethod[]).map((value) => ({
  value,
  label: CHECK_METHOD[value].label,
}))
export const EMERGENCY_OPTIONS = [
  { value: 'true', label: 'Emergency only' },
  { value: 'false', label: 'Planned only' },
]

export const timeWindow = (from: string | null, until: string | null) =>
  from && until ? `${from} – ${until}` : (from ?? until ?? '—')

export const relationText = (relation: string | null) =>
  relation ? relation.charAt(0).toUpperCase() + relation.slice(1) : null

export const personLine = (person: { relation: string | null; mobile: string | null }) =>
  [relationText(person.relation), person.mobile].filter(Boolean).join(' · ')

export const photoSrc = (file: { url: string; thumbnail_url: string | null } | null) =>
  file ? (file.thumbnail_url ?? file.url) : null

export const clock = (value: string | null) => (value ? formatTime(value).slice(0, 5) : '—')
