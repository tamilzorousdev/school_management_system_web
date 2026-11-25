import { Link } from '@tanstack/react-router'
import {
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  HeartPulse,
  Lock,
  Settings2,
  Shirt,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'
import { EmptyState } from '@/components/common/display'
import { Button } from '@/components/ui/button'
import { can, useMe } from '@/features/auth/api'
import { cn } from '@/lib/utils'
import { useHostelModules, type OptionalModule } from '../api'
import { MODULE_LABELS } from '../labels'

export type HostelLifePath =
  | '/hostel/mess'
  | '/hostel/health'
  | '/hostel/study'
  | '/hostel/duty'
  | '/hostel/lockers'
  | '/hostel/inspections'
  | '/hostel/laundry'

const LINKS: {
  to: HostelLifePath
  label: string
  icon: LucideIcon
  module?: OptionalModule
}[] = [
  { to: '/hostel/mess', label: 'Mess', icon: UtensilsCrossed, module: 'mess' },
  { to: '/hostel/health', label: 'Health', icon: HeartPulse, module: 'medical' },
  { to: '/hostel/study', label: 'Study', icon: BookOpen },
  { to: '/hostel/duty', label: 'Staff duty', icon: CalendarClock, module: 'staff_duty' },
  { to: '/hostel/lockers', label: 'Lockers', icon: Lock, module: 'lockers' },
  { to: '/hostel/inspections', label: 'Inspections', icon: ClipboardCheck },
  { to: '/hostel/laundry', label: 'Laundry', icon: Shirt, module: 'laundry' },
]

export function HostelLifeTabs({ active }: { active: HostelLifePath }) {
  const me = useMe().data
  const modules = useHostelModules(can(me, 'hostel.view'))
  if (!can(me, 'hostel.view')) return null
  const enabled = modules.data?.enabled_modules
  const links = LINKS.filter(
    (link) => link.to === active || !link.module || !enabled || enabled[link.module]
  )
  return (
    <nav aria-label='Hostel life sections' className='-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0'>
      <div className='flex min-w-max gap-1 border-b'>
        {links.map((link) => {
          const current = link.to === active
          return (
            <Link
              key={link.to}
              to={link.to}
              search={{ page: 1 } as never}
              aria-current={current ? 'page' : undefined}
              className={cn(
                'relative flex h-10 items-center gap-2 rounded-t-md px-3 text-sm font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
                current ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <link.icon className={cn('size-4', current && 'text-primary')} />
              {link.label}
              {current && (
                <span className='absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary' />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function ModuleOffState({ module }: { module: OptionalModule }) {
  const me = useMe().data
  return (
    <EmptyState
      icon={Settings2}
      title={`${MODULE_LABELS[module].label} is turned off`}
      description='Turn it on in Hostel setup → Settings to use these screens here and in the apps.'
      action={
        can(me, 'hostel.settings') ? (
          <Button asChild variant='outline'>
            <Link to='/hostel/setup' search={{ tab: 'settings' }}>
              <Settings2 />
              Open hostel settings
            </Link>
          </Button>
        ) : undefined
      }
    />
  )
}
