import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  Building,
  Bus,
  CreditCard,
  HelpCircle,
  ShieldAlert,
  UserCheck,
  Users,
} from 'lucide-react'
import type { BadgeTone } from '@/components/ui/badge'
import type { ComplainantType, GrievanceCategory, GrievancePriority, GrievanceStatus } from './api'

export const GRIEVANCE_STATUS: Record<GrievanceStatus, { label: string; tone: BadgeTone }> = {
  submitted: { label: 'Submitted', tone: 'neutral' },
  acknowledged: { label: 'Acknowledged', tone: 'info' },
  in_progress: { label: 'In Progress', tone: 'warning' },
  action_taken: { label: 'Action Taken', tone: 'info' },
  resolved: { label: 'Resolved', tone: 'success' },
  reopened: { label: 'Reopened', tone: 'danger' },
  closed: { label: 'Closed', tone: 'neutral' },
  escalated: { label: 'Escalated', tone: 'danger' },
}

export const GRIEVANCE_PRIORITY: Record<GrievancePriority, { label: string; tone: BadgeTone }> = {
  low: { label: 'Low', tone: 'neutral' },
  medium: { label: 'Medium', tone: 'info' },
  high: { label: 'High', tone: 'warning' },
  critical: { label: 'Critical', tone: 'danger' },
}

export const GRIEVANCE_CATEGORY: Record<
  GrievanceCategory,
  { label: string; icon: LucideIcon; description: string }
> = {
  transport: {
    label: 'Transport & Fleet',
    icon: Bus,
    description: 'Buses, stops, delays, driver/attendant conduct',
  },
  academics: {
    label: 'Academics & Teaching',
    icon: BookOpen,
    description: 'Grading, curriculum pacing, homework, teaching quality',
  },
  safety_bullying: {
    label: 'Safety & Bullying',
    icon: ShieldAlert,
    description: 'Bullying, harassment, student safety, physical disputes',
  },
  fees_billing: {
    label: 'Fees & Accounts',
    icon: CreditCard,
    description: 'Payment reconciliation, refund, fee structures, receipts',
  },
  facilities: {
    label: 'Facilities & Campus',
    icon: Building,
    description: 'Hygiene, washrooms, canteen, electrical/classroom issues',
  },
  staff_conduct: {
    label: 'Staff Conduct',
    icon: UserCheck,
    description: 'Inappropriate behavior, non-responsiveness, policy breach',
  },
  workplace_staff: {
    label: 'Staff Workplace',
    icon: Users,
    description: 'Workload, timetable clash, internal staff grievances',
  },
  other: {
    label: 'General & Other',
    icon: HelpCircle,
    description: 'General suggestions and uncategorized concerns',
  },
}

export const COMPLAINANT_TYPE: Record<ComplainantType, { label: string; tone: BadgeTone }> = {
  parent: { label: 'Parent', tone: 'info' },
  staff: { label: 'Staff', tone: 'neutral' },
  student: { label: 'Student', tone: 'info' },
  anonymous: { label: 'Anonymous', tone: 'warning' },
}

export function formatSlaCountdown(
  slaDueAt: string,
  status: GrievanceStatus
): { text: string; tone: BadgeTone; breached: boolean } {
  if (status === 'resolved' || status === 'closed') {
    return { text: 'Resolved', tone: 'success', breached: false }
  }

  const due = new Date(slaDueAt).getTime()
  const now = Date.now()
  const diffMs = due - now

  if (diffMs < 0) {
    const overdueHours = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)))
    const overdueDays = Math.floor(overdueHours / 24)
    const text =
      overdueDays > 0
        ? `Breached by ${overdueDays}d`
        : `Breached by ${Math.max(1, overdueHours)}h`
    return { text, tone: 'danger', breached: true }
  }

  const hoursRemaining = Math.floor(diffMs / (1000 * 60 * 60))
  const daysRemaining = Math.floor(hoursRemaining / 24)

  if (daysRemaining > 0) {
    return {
      text: `${daysRemaining}d left`,
      tone: daysRemaining <= 1 ? 'warning' : 'neutral',
      breached: false,
    }
  }

  return {
    text: `${Math.max(1, hoursRemaining)}h left`,
    tone: hoursRemaining <= 4 ? 'danger' : 'warning',
    breached: false,
  }
}
