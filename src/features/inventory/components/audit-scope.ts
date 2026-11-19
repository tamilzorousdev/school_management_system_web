import type { Audit } from '../api'

export function auditScope(audit: Audit) {
  const parts = [
    audit.location?.name,
    audit.category?.name,
    audit.department?.name,
    audit.store?.name,
  ]
  return parts.filter(Boolean).join(' · ') || 'Whole school'
}
