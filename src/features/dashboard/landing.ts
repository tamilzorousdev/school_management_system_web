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

const SCHOOL_WIDE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL']

export function landsOnOffice(me: Me | undefined) {
  const roles = me?.roles.map((role) => role.code) ?? []
  return (
    roles.includes('AO') &&
    !roles.some((role) => SCHOOL_WIDE_ROLES.includes(role)) &&
    can(me, 'office.view')
  )
}
