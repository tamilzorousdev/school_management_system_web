import { Link } from '@tanstack/react-router'
import {
  BarChart3,
  Images,
  ScrollText,
  Settings2,
  Sparkles,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { can, useMe } from '@/features/auth/api'
import { cn } from '@/lib/utils'

type GalleryPath =
  | '/gallery'
  | '/gallery/trash'
  | '/gallery/cleanup'
  | '/gallery/reports'
  | '/gallery/audit'
  | '/gallery/settings'

const LINKS: {
  to: GalleryPath
  label: string
  icon: LucideIcon
  permission: string
  search: Record<string, string | number>
}[] = [
  {
    to: '/gallery',
    label: 'Albums',
    icon: Images,
    permission: 'gallery.view',
    search: { page: 1 },
  },
  {
    to: '/gallery/trash',
    label: 'Trash',
    icon: Trash2,
    permission: 'gallery.manage',
    search: { page: 1, kind: 'media' },
  },
  {
    to: '/gallery/cleanup',
    label: 'Cleanup',
    icon: Sparkles,
    permission: 'gallery.view',
    search: { page: 1, item_page: 1 },
  },
  {
    to: '/gallery/reports',
    label: 'Reports',
    icon: BarChart3,
    permission: 'gallery.view',
    search: { report: 'class_usage' },
  },
  {
    to: '/gallery/audit',
    label: 'Audit log',
    icon: ScrollText,
    permission: 'gallery.audit',
    search: { page: 1 },
  },
  {
    to: '/gallery/settings',
    label: 'Settings',
    icon: Settings2,
    permission: 'gallery.view',
    search: { tab: 'settings', holds: 'active', page: 1 },
  },
]

export function GalleryTabs({ active }: { active: GalleryPath }) {
  const me = useMe().data
  const links = LINKS.filter((link) => can(me, link.permission))
  return (
    <nav aria-label='Gallery sections' className='-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0'>
      <div className='flex min-w-max gap-1 border-b'>
        {links.map((link) => {
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
