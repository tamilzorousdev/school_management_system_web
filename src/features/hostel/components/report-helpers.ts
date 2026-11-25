import {
  BarChart3,
  BedDouble,
  Gavel,
  HeartPulse,
  IndianRupee,
  ListChecks,
  LogOut,
  DoorOpen,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { ExportableReport } from '../api-reports'
import type { OptionalModule } from '../api'
import type { HostelReport } from '../search'
import { shiftDate, todayIso } from './leave-helpers'

export type BarTone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export const BAR_TONE: Record<BarTone, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  info: 'bg-info',
  neutral: 'bg-muted-foreground/40',
}

export const REPORT_META: Record<
  HostelReport,
  { label: string; description: string; icon: LucideIcon; module?: OptionalModule }
> = {
  summary: {
    label: 'Summary',
    description: 'Headline numbers from every report',
    icon: BarChart3,
  },
  occupancy: {
    label: 'Occupancy',
    description: 'Beds by hostel, block and room type, right now',
    icon: BedDouble,
  },
  attendance: {
    label: 'Roll call',
    description: 'Present %, slots, daily trend and absentees',
    icon: ListChecks,
  },
  leaves: {
    label: 'Leave & passes',
    description: 'Leaves and outings, who raised them, late returns',
    icon: LogOut,
  },
  visitors: {
    label: 'Visitors',
    description: 'Visits per day, relations, denied and unknown visitors',
    icon: DoorOpen,
  },
  fees: {
    label: 'Fees',
    description: 'Rent billed and collected, deposits, top dues',
    icon: IndianRupee,
  },
  discipline: {
    label: 'Discipline',
    description: 'Cases by category, severity and month; fines',
    icon: Gavel,
  },
  complaints: {
    label: 'Complaints',
    description: 'Complaints and maintenance tickets, SLA and cost',
    icon: Wrench,
  },
  mess: {
    label: 'Mess',
    description: 'Meals eaten and skipped, feedback per meal',
    icon: UtensilsCrossed,
    module: 'mess',
  },
  health: {
    label: 'Health',
    description: 'Health logs, sick bay stays and medication doses',
    icon: HeartPulse,
    module: 'medical',
  },
}

export const EXPORTABLE_REPORTS: readonly ExportableReport[] = [
  'occupancy',
  'attendance',
  'leaves',
  'fees',
  'discipline',
]

export const isExportable = (report: HostelReport): report is ExportableReport =>
  (EXPORTABLE_REPORTS as readonly string[]).includes(report)

export const SNAPSHOT_REPORTS: readonly HostelReport[] = ['occupancy', 'fees']

export const DEFAULT_DAYS = 30

export const defaultRange = () => {
  const to = todayIso()
  return { from: shiftDate(to, -(DEFAULT_DAYS - 1)), to }
}

export const humanize = (key: string) => {
  const text = key.replace(/_/g, ' ').trim()
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : 'Not given'
}

export const labelFor = (labels: Record<string, string | { label: string }>, key: string) => {
  const found = labels[key]
  if (!found) return humanize(key)
  return typeof found === 'string' ? found : found.label
}

export const percent = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : `${value}%`

export const ratio = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 1000) / 10 : null

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const monthLabel = (key: string) => {
  const [year, month] = key.split('-').map(Number)
  return MONTHS[month - 1] ? `${MONTHS[month - 1]} ${year}` : key
}

export const shortDate = (iso: string) => {
  const [, month, day] = iso.split('-').map(Number)
  return MONTHS[month - 1] ? `${day} ${MONTHS[month - 1]}` : iso
}

export const minutesText = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '—'
  if (value < 60) return `${Math.round(value)} min`
  const hours = Math.floor(value / 60)
  const minutes = Math.round(value % 60)
  return minutes ? `${hours} h ${minutes} min` : `${hours} h`
}

export const decimal = (value: number | null | undefined, unit = '') =>
  value === null || value === undefined ? '—' : `${value}${unit}`
