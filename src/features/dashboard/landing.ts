import type { Me } from '@/features/auth/api'
import { can } from '@/features/auth/api'

export const DASHBOARD_PERMISSIONS = [
  'students.view',
  'attendance.view',
  'staff.view',
  'fleet.view',
  'fees.view',
  'exams.view',
]

export const FALLBACK_LANDINGS = [{ permission: 'inventory.view', to: '/inventory' }] as const

export type FallbackLanding = (typeof FALLBACK_LANDINGS)[number]['to']

export function fallbackLanding(me: Me | undefined): FallbackLanding | null {
  if (!me || DASHBOARD_PERMISSIONS.some((permission) => can(me, permission))) return null
  return FALLBACK_LANDINGS.find((landing) => can(me, landing.permission))?.to ?? null
}
