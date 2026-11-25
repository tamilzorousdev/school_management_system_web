import type {
  ComplaintAction,
  ComplaintCategory,
  ComplaintStatus,
  MaintenanceCategory,
  TicketStatus,
} from '../api'

export const TICKET_NEXT: Record<TicketStatus, TicketStatus[]> = {
  open: ['assigned', 'in_progress', 'on_hold', 'done', 'cancelled'],
  assigned: ['in_progress', 'on_hold', 'done', 'cancelled'],
  in_progress: ['on_hold', 'done', 'cancelled'],
  on_hold: ['assigned', 'in_progress', 'done', 'cancelled'],
  done: [],
  cancelled: [],
}

export const COMPLAINT_NEXT: Record<ComplaintStatus, ComplaintAction[]> = {
  open: ['start', 'resolve', 'reject'],
  in_progress: ['resolve', 'reject'],
  resolved: ['close', 'reopen'],
  closed: [],
  rejected: [],
}

export const COMPLAINT_ACTION: Record<
  ComplaintAction,
  { label: string; title: string; done: string; needsNote: boolean; description: string }
> = {
  start: {
    label: 'Start work',
    title: 'Start work',
    done: 'Marked in progress',
    needsNote: false,
    description: 'The parent sees that someone is working on it.',
  },
  resolve: {
    label: 'Resolve',
    title: 'Resolve complaint',
    done: 'Complaint resolved',
    needsNote: true,
    description: 'Say what was done. The parent can rate it or reopen it.',
  },
  reject: {
    label: 'Reject',
    title: 'Reject complaint',
    done: 'Complaint rejected',
    needsNote: true,
    description: 'Say why nothing will be done. The parent is told.',
  },
  close: {
    label: 'Close',
    title: 'Close complaint',
    done: 'Complaint closed',
    needsNote: false,
    description: 'Close it without waiting for the parent’s rating.',
  },
  reopen: {
    label: 'Reopen',
    title: 'Reopen complaint',
    done: 'Complaint reopened',
    needsNote: false,
    description: 'Put it back in progress because the problem is not fixed.',
  },
}

const MAINTENANCE_FOR: Partial<Record<ComplaintCategory, MaintenanceCategory>> = {
  electrical: 'electrical',
  plumbing: 'plumbing',
  water: 'plumbing',
  cleanliness: 'cleaning',
  room: 'civil',
  internet: 'appliance',
}

export const maintenanceCategoryFor = (category: ComplaintCategory): MaintenanceCategory =>
  MAINTENANCE_FOR[category] ?? 'other'
