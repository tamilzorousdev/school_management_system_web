export const AUDIT_ENTITIES: Record<string, string> = {
  application: 'Application',
  admission: 'Admission',
  leave: 'Leave',
  visit: 'Visit',
  approved_visitor: 'Approved visitor',
  blocklist: 'Blocklist',
  checkout: 'Checkout',
  discipline: 'Discipline',
  maintenance: 'Maintenance',
  fee_schedule: 'Fee schedule',
}

export const humanize = (value: string) => value.replace(/[_.]+/g, ' ').trim()

export const auditTitle = (entity: string, action: string) =>
  `${(AUDIT_ENTITIES[entity] ?? humanize(entity)).toLowerCase()} · ${humanize(action)}`

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export interface ChangeLine {
  key: string
  label: string
  before?: string
  after: string
}

export const changeLines = (changes: Record<string, unknown> | null): ChangeLine[] =>
  Object.entries(changes ?? {}).map(([key, value]) =>
    Array.isArray(value) && value.length === 2
      ? { key, label: humanize(key), before: formatValue(value[0]), after: formatValue(value[1]) }
      : { key, label: humanize(key), after: formatValue(value) }
  )
