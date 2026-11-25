import type { LaundryStatus } from '../api-care'
import type { Tone } from '../labels'

export const LAUNDRY_STATUS: Record<LaundryStatus, Tone> = {
  collected: { label: 'Collected', tone: 'info' },
  sent: { label: 'At the laundry', tone: 'warning' },
  returned: { label: 'Returned', tone: 'success' },
  closed: { label: 'Closed', tone: 'neutral' },
}

export interface LaundryRow {
  admission_id: string
  name: string
  hint?: string
  items_given: number
}

export const sameRows = (a: LaundryRow[], b: LaundryRow[]) =>
  a.length === b.length &&
  a.every(
    (row, index) =>
      row.admission_id === b[index].admission_id && row.items_given === b[index].items_given
  )
