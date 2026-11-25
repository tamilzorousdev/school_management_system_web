import { Link } from '@tanstack/react-router'
import {
  BarChart3,
  BedDouble,
  Siren,
  DoorClosed,
  DoorOpen,
  Gavel,
  IndianRupee,
  ListChecks,
  LogOut,
  ScrollText,
  Settings2,
  UsersRound,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { can, useMe } from '@/features/auth/api'
import { cn } from '@/lib/utils'

export type HostelPath =
  | '/hostel'
  | '/hostel/residents'
  | '/hostel/rooms'
  | '/hostel/roll-call'
  | '/hostel/leaves'
  | '/hostel/visitors'
  | '/hostel/fees'
  | '/hostel/discipline'
  | '/hostel/complaints'
  | '/hostel/setup'
  | '/hostel/audit'
  | '/hostel/safety'
  | '/hostel/reports'

const LINKS: {
  to: HostelPath
  label: string
  icon: LucideIcon
  search: Record<string, string | number>
  permission?: string
}[] = [
  { to: '/hostel', label: 'Dashboard', icon: BedDouble, search: {} },
  { to: '/hostel/residents', label: 'Residents', icon: UsersRound, search: { page: 1 } },
  { to: '/hostel/rooms', label: 'Rooms', icon: DoorClosed, search: { page: 1 } },
  { to: '/hostel/roll-call', label: 'Roll call', icon: ListChecks, search: { page: 1 } },
  { to: '/hostel/leaves', label: 'Leave & passes', icon: LogOut, search: { page: 1 } },
  { to: '/hostel/visitors', label: 'Visitors', icon: DoorOpen, search: { page: 1 } },
  { to: '/hostel/fees', label: 'Fees', icon: IndianRupee, search: { page: 1 } },
  { to: '/hostel/discipline', label: 'Discipline', icon: Gavel, search: { page: 1 } },
  { to: '/hostel/complaints', label: 'Complaints', icon: Wrench, search: { page: 1 } },
  { to: '/hostel/safety', label: 'Safety', icon: Siren, search: { page: 1 } },
  {
    to: '/hostel/reports',
    label: 'Reports',
    icon: BarChart3,
    search: {},
    permission: 'hostel.reports',
  },
  { to: '/hostel/setup', label: 'Setup', icon: Settings2, search: {} },
  { to: '/hostel/audit', label: 'Audit log', icon: ScrollText, search: { page: 1 } },
]

export function HostelTabs({ active }: { active: HostelPath }) {
  const me = useMe().data
  if (!can(me, 'hostel.view')) return null
  return (
    <nav aria-label='Hostel sections' className='-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0'>
      <div className='flex min-w-max gap-1 border-b'>
        {LINKS.filter((link) => !link.permission || can(me, link.permission)).map((link) => {
          const current = link.to === active
          return (
            <Link
              key={link.to}
              to={link.to}
              search={link.search as never}
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
