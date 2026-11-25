import type { BadgeTone } from '@/components/ui/badge'
import type {
  AdmissionStatus,
  ApplicationStatus,
  BedStatus,
  CaseStatus,
  CheckoutReason,
  CheckoutStatus,
  ClearanceStatus,
  ComplaintCategory,
  ComplaintStatus,
  DepositStatus,
  Diet,
  DisciplineAction,
  DisciplineCategory,
  HostelGender,
  HostelStatus,
  IdProofType,
  LeaveKind,
  LeaveSource,
  LeaveStatus,
  MaintenanceCategory,
  OptionalModule,
  Priority,
  RefundMode,
  RollSlot,
  RollStatus,
  RoomStatus,
  Severity,
  TicketStatus,
  VisitStatus,
} from './api'

export type Tone = { label: string; tone: BadgeTone }

export const toneOptions = <T extends string>(labels: Record<T, Tone>) =>
  (Object.entries(labels) as [T, Tone][]).map(([value, item]) => ({ value, label: item.label }))

export const labelOptions = <T extends string>(labels: Record<T, string>) =>
  (Object.entries(labels) as [T, string][]).map(([value, label]) => ({ value, label }))

export const HOSTEL_GENDER: Record<HostelGender, string> = {
  boys: 'Boys',
  girls: 'Girls',
  mixed: 'Mixed',
}

export const HOSTEL_STATUS: Record<HostelStatus, Tone> = {
  active: { label: 'Active', tone: 'success' },
  inactive: { label: 'Inactive', tone: 'neutral' },
}

export const ROOM_STATUS: Record<RoomStatus, Tone> = {
  active: { label: 'Open', tone: 'success' },
  maintenance: { label: 'Under maintenance', tone: 'warning' },
  closed: { label: 'Closed', tone: 'neutral' },
}

export const BED_STATUS: Record<BedStatus, Tone> = {
  vacant: { label: 'Vacant', tone: 'success' },
  occupied: { label: 'Occupied', tone: 'info' },
  reserved: { label: 'Reserved', tone: 'info' },
  blocked: { label: 'Blocked', tone: 'neutral' },
  maintenance: { label: 'Maintenance', tone: 'warning' },
}

export const MODULE_LABELS: Record<OptionalModule, { label: string; description: string }> = {
  staff_duty: {
    label: 'Staff attendance & duty',
    description: 'Check-in of hostel staff, duty roster and night duty',
  },
  lockers: { label: 'Student lockers', description: 'Lockers, keys and the checkout locker step' },
  study_hall: { label: 'Study halls', description: 'Study halls, seats and hall attendance' },
  laundry: { label: 'Laundry', description: 'Laundry bags, pickup and delivery' },
  medical: { label: 'Medical & sick bay', description: 'Health notes, sick bay and medication' },
  mess: { label: 'Mess', description: 'Menu, meal attendance and feedback' },
}

export const APPLICATION_STATUS: Record<ApplicationStatus, Tone> = {
  pending: { label: 'Pending', tone: 'warning' },
  waitlisted: { label: 'Waitlisted', tone: 'info' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  admitted: { label: 'Admitted', tone: 'success' },
}

export const ADMISSION_STATUS: Record<AdmissionStatus, Tone> = {
  active: { label: 'Staying', tone: 'success' },
  on_leave: { label: 'On leave', tone: 'info' },
  checking_out: { label: 'Checking out', tone: 'warning' },
  checked_out: { label: 'Checked out', tone: 'neutral' },
}

export const DIET: Record<Diet, string> = {
  veg: 'Vegetarian',
  non_veg: 'Non-vegetarian',
  eggetarian: 'Eggetarian',
}

export const CHECKOUT_STATUS: Record<CheckoutStatus, Tone> = {
  open: { label: 'Open', tone: 'warning' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

export const CHECKOUT_REASON: Record<CheckoutReason, string> = {
  year_end: 'End of the year',
  withdrawn: 'Left the school',
  day_scholar: 'Becoming a day scholar',
  school_transfer: 'Moving to another school',
  disciplinary: 'Disciplinary',
  other: 'Other',
}

export const CLEARANCE_STATUS: Record<ClearanceStatus, Tone> = {
  pending: { label: 'Pending', tone: 'warning' },
  cleared: { label: 'Cleared', tone: 'success' },
  waived: { label: 'Waived', tone: 'neutral' },
}

export const ROLL_SLOT: Record<RollSlot, string> = {
  morning: 'Morning',
  evening: 'Evening',
  night: 'Night',
}

export const ROLL_STATUS: Record<RollStatus, Tone> = {
  present: { label: 'Present', tone: 'success' },
  absent: { label: 'Absent', tone: 'danger' },
  late: { label: 'Late', tone: 'warning' },
  on_leave: { label: 'On leave', tone: 'info' },
  outing: { label: 'Outing', tone: 'info' },
  sick: { label: 'Sick', tone: 'warning' },
}

export const LEAVE_KIND: Record<LeaveKind, string> = {
  home: 'Home leave',
  outing: 'Outing',
  medical: 'Medical',
  festival: 'Festival',
  other: 'Other',
}

export const LEAVE_STATUS: Record<LeaveStatus, Tone> = {
  awaiting_parent: { label: 'Waiting for parent', tone: 'warning' },
  pending: { label: 'To approve', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  out: { label: 'Out', tone: 'info' },
  returned: { label: 'Returned', tone: 'neutral' },
}

export const LEAVE_SOURCE: Record<LeaveSource, string> = {
  parent: 'Parent',
  warden: 'Warden',
  office: 'Office',
}

export const VISIT_STATUS: Record<VisitStatus, Tone> = {
  inside: { label: 'Inside', tone: 'info' },
  left: { label: 'Left', tone: 'neutral' },
  denied: { label: 'Turned away', tone: 'danger' },
}

export const ID_PROOF: Record<IdProofType, string> = {
  aadhaar: 'Aadhaar',
  driving_licence: 'Driving licence',
  voter_id: 'Voter ID',
  pan: 'PAN',
  passport: 'Passport',
  other: 'Other',
}

export const DEPOSIT_STATUS: Record<DepositStatus, Tone> = {
  none: { label: 'No deposit', tone: 'neutral' },
  unpaid: { label: 'Unpaid', tone: 'warning' },
  paid: { label: 'Held', tone: 'success' },
  settled: { label: 'Settled', tone: 'neutral' },
}

export const REFUND_MODE: Record<RefundMode, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
  upi: 'UPI',
  cheque: 'Cheque',
  adjusted_to_fees: 'Adjusted against school fees',
}

export const DISCIPLINE_CATEGORY: Record<DisciplineCategory, string> = {
  late_return: 'Late return',
  curfew: 'Curfew / lights out',
  misconduct: 'Misconduct',
  ragging: 'Ragging',
  fighting: 'Fighting',
  damage: 'Damage to property',
  contraband: 'Banned items',
  absent_without_leave: 'Absent without leave',
  other: 'Other',
}

export const SEVERITY: Record<Severity, Tone> = {
  minor: { label: 'Minor', tone: 'neutral' },
  major: { label: 'Major', tone: 'warning' },
  critical: { label: 'Critical', tone: 'danger' },
}

export const DISCIPLINE_ACTION: Record<DisciplineAction, string> = {
  warning: 'Warning',
  counselling: 'Counselling',
  parent_meeting: 'Parent meeting',
  fine: 'Fine',
  hostel_suspension: 'Hostel suspension',
  expulsion: 'Removal from hostel',
  no_action: 'No action',
}

export const CASE_STATUS: Record<CaseStatus, Tone> = {
  open: { label: 'Open', tone: 'warning' },
  action_taken: { label: 'Action taken', tone: 'info' },
  closed: { label: 'Closed', tone: 'neutral' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral' },
}

export const COMPLAINT_CATEGORY: Record<ComplaintCategory, string> = {
  room: 'Room',
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  cleanliness: 'Cleanliness',
  food: 'Food',
  water: 'Water',
  internet: 'Internet',
  security: 'Security',
  roommate: 'Roommate',
  staff: 'Staff',
  other: 'Other',
}

export const COMPLAINT_STATUS: Record<ComplaintStatus, Tone> = {
  open: { label: 'Open', tone: 'warning' },
  in_progress: { label: 'In progress', tone: 'info' },
  resolved: { label: 'Resolved', tone: 'success' },
  closed: { label: 'Closed', tone: 'neutral' },
  rejected: { label: 'Rejected', tone: 'danger' },
}

export const PRIORITY: Record<Priority, Tone> = {
  low: { label: 'Low', tone: 'neutral' },
  normal: { label: 'Normal', tone: 'info' },
  high: { label: 'High', tone: 'warning' },
  urgent: { label: 'Urgent', tone: 'danger' },
}

export const MAINTENANCE_CATEGORY: Record<MaintenanceCategory, string> = {
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  carpentry: 'Carpentry',
  painting: 'Painting',
  cleaning: 'Cleaning',
  pest_control: 'Pest control',
  appliance: 'Appliance',
  civil: 'Civil work',
  other: 'Other',
}

export const TICKET_STATUS: Record<TicketStatus, Tone> = {
  open: { label: 'Open', tone: 'warning' },
  assigned: { label: 'Assigned', tone: 'info' },
  in_progress: { label: 'In progress', tone: 'info' },
  on_hold: { label: 'On hold', tone: 'neutral' },
  done: { label: 'Done', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

export const studentLine = (student: {
  name: string
  admission_no: string
  class_name: string | null
  section_name: string | null
}) =>
  [student.admission_no, [student.class_name, student.section_name].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(' · ')
