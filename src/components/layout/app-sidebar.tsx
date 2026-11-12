import { Link, useRouterState } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { BrandLogo, BrandMark } from '@/components/common/brand-logo'
import { Button } from '@/components/ui/button'
import { currentNav, NAV_GROUPS } from '@/config/nav'
import { can, type Me } from '@/features/auth/api'
import { cn } from '@/lib/utils'
import { useSelectedSchool } from '@/lib/auth/school-context'
import { SchoolSwitcher } from './school-switcher'
import { YearSwitcher } from './year-switcher'

interface AppSidebarProps {
  me: Me
  collapsed: boolean
  mobileOpen: boolean
  onMobileClose: () => void
}

export function AppSidebar({ me, collapsed, mobileOpen, onMobileClose }: AppSidebarProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const activeTo = currentNav(pathname).item.to
  const chosenSchool = useSelectedSchool()
  const selectedSchool = can(me, 'platform.schools') ? chosenSchool : null

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (item.to === '/parent-preview' && me.apps.includes('parent')) return true
      if (item.to === '/teacher-preview' && me.apps.includes('staff')) return true
      return can(me, item.permission)
    }),
  })).filter((group) => group.items.length > 0)

  return (
    <>
      {mobileOpen && (
        <button
          type='button'
          aria-label='Close menu'
          onClick={onMobileClose}
          className='fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] md:hidden'
        />
      )}
      <aside
        aria-label='Main navigation'
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width,transform] duration-300 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          collapsed ? 'md:w-[76px]' : 'md:w-64'
        )}
      >
        <div
          className={cn(
            'flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-5',
            collapsed && 'md:justify-center md:px-0'
          )}
        >
          <BrandLogo
            className={cn('h-7 text-sidebar-accent-foreground', collapsed && 'md:hidden')}
          />
          <BrandMark className={cn('hidden h-7', collapsed && 'md:block')} />
          <Button
            variant='ghost'
            size='icon-sm'
            onClick={onMobileClose}
            className='ml-auto text-sidebar-foreground hover:bg-sidebar-accent md:hidden'
            aria-label='Close menu'
          >
            <X />
          </Button>
        </div>

        {can(me, 'platform.schools') ? (
          <div className={cn('shrink-0 px-4 pt-3', collapsed && 'md:hidden')}>
            <SchoolSwitcher />
          </div>
        ) : (
          me.school && (
            <div className={cn('shrink-0 px-4 pt-3', collapsed && 'md:hidden')}>
              <div className='flex items-center gap-2.5 rounded-lg border border-sidebar-border bg-white/[0.03] px-3 py-2'>
                {me.school.logo_url && (
                  <img
                    src={me.school.logo_url}
                    alt={`${me.school.name} logo`}
                    className='size-9 shrink-0 rounded-md bg-white object-contain p-0.5'
                  />
                )}
                <div className='min-w-0'>
                  <div className='truncate text-xs font-bold text-sidebar-accent-foreground'>
                    {me.school.name}
                  </div>
                  <div className='text-[11px] text-sidebar-muted'>School code {me.school.code}</div>
                </div>
              </div>
            </div>
          )
        )}

        {(me.school || selectedSchool) && (
          <div className={cn('shrink-0 px-4 pt-3', collapsed && 'md:hidden')}>
            <YearSwitcher key={selectedSchool ?? me.school?.id} />
          </div>
        )}

        <nav className='sidebar-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-3'>
          <div className='grid min-w-0 gap-3.5'>
            {groups.map((group) => (
              <div key={group.label} className='grid min-w-0 gap-0.5'>
                <div
                  className={cn(
                    'px-3 pb-0.5 text-[10px] font-bold tracking-[0.14em] text-sidebar-muted uppercase',
                    collapsed && 'md:sr-only'
                  )}
                >
                  {group.label}
                </div>
                <ul className='grid min-w-0 gap-0.5'>
                  {group.items.map((item) => (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={onMobileClose}
                        activeOptions={{ exact: true }}
                        data-current={item.to === activeTo ? 'true' : undefined}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          'group relative flex h-9 min-w-0 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-primary',
                          'data-[current=true]:bg-sidebar-accent data-[current=true]:text-sidebar-accent-foreground',
                          collapsed && 'md:justify-center md:px-0'
                        )}
                      >
                        {() => (
                          <>
                            {item.to === activeTo && (
                              <span className='absolute top-2 bottom-2 left-0 w-[3px] rounded-r-full bg-sidebar-primary' />
                            )}
                            <item.icon
                              className={cn(
                                'size-[18px] shrink-0',
                                item.to === activeTo && 'text-sidebar-primary'
                              )}
                            />
                            <span
                              className={cn('min-w-0 flex-1 truncate', collapsed && 'md:hidden')}
                            >
                              {item.label}
                            </span>
                          </>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>
      </aside>
    </>
  )
}
