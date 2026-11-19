import { z } from 'zod'

export const LIBRARY_TABS = [
  'dashboard',
  'catalogue',
  'inventory',
  'desk',
  'loans',
  'follow-ups',
  'members',
  'fines',
  'attendance',
  'stock-check',
  'reports',
  'settings',
] as const
export type LibraryTab = (typeof LIBRARY_TABS)[number]

const DATE = /^\d{4}-\d{2}-\d{2}$/
const id = z.coerce.number().int().min(1).optional().catch(undefined)
const text = z.string().optional().catch(undefined)
const date = z.string().regex(DATE).optional().catch(undefined)
const flag = z.boolean().optional().catch(undefined)

export const librarySearchSchema = z.object({
  tab: z.enum(LIBRARY_TABS).catch('dashboard'),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
  search: text,
  sort: text,
  order: z.enum(['asc', 'desc']).optional().catch(undefined),
  status: text,
  state: text,
  kind: text,
  condition: text,
  language: text,
  availability: text,
  member_type: text,
  purpose: text,
  mode: text,
  finding: text,
  category_id: id,
  class_id: id,
  section_id: id,
  audit_id: id,
  loan_id: id,
  is_active: flag,
  has_overdue: flag,
  has_fines: flag,
  outstanding: flag,
  present: flag,
  from: date,
  to: date,
  date,
  show: z.enum(['due', 'all']).optional().catch(undefined),
  view: z.enum(['fines', 'collections']).optional().catch(undefined),
  desk: z.enum(['issue', 'return']).optional().catch(undefined),
})

export type LibrarySearch = z.infer<typeof librarySearchSchema>

export const libraryDetailSearchSchema = z.object({
  page: z.coerce.number().int().min(1).optional().catch(undefined),
})

export type LibraryDetailSearch = z.infer<typeof libraryDetailSearchSchema>

export function oneOf<T extends string>(values: readonly T[], value: string | undefined) {
  return values.includes(value as T) ? (value as T) : undefined
}

export interface LibraryTabProps {
  search: LibrarySearch
  onChange: (patch: Partial<LibrarySearch>) => void
  onGo: (tab: LibraryTab, patch?: Partial<LibrarySearch>) => void
}

export const LIST_LIMIT = 20
