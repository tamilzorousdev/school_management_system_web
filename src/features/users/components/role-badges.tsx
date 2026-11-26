import { Badge, type BadgeTone } from '@/components/ui/badge'
import type { AppSection, RoleSummary } from '@/features/auth/api'

const APP_TONES: Record<AppSection, BadgeTone> = {
  admin: 'info',
  staff: 'success',
  parent: 'warning',
  driver: 'neutral',
}

export function RoleBadges({ roles, max = 3 }: { roles: RoleSummary[]; max?: number }) {
  if (!roles.length) return <span className='text-[12px] text-slate-400'>No role</span>
  const shown = roles.slice(0, max)
  return (
    <span className='flex flex-wrap items-center gap-1'>
      {shown.map((role) => (
        <Badge key={role.code} tone={APP_TONES[role.app]} className='text-[11.5px] font-medium'>
          {role.name}
        </Badge>
      ))}
      {roles.length > max && (
        <Badge tone='neutral' className='text-[11.5px] font-medium'>
          +{roles.length - max}
        </Badge>
      )}
    </span>
  )
}
