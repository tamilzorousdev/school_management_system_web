import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { Smartphone } from 'lucide-react'
import { BrandMark } from '@/components/common/brand-logo'
import { ErrorState } from '@/components/common/display'
import { useShortcut, useShortcutHelp } from '@/components/shortcuts/shortcut-context'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { NAV_ITEMS, type NavItem } from '@/config/nav'
import { authApi, can, useMe, type Me } from '@/features/auth/api'
import { session } from '@/lib/auth/session'
import { cn } from '@/lib/utils'
import { useTheme } from '@/providers/theme-context'
import { AppHeader } from './app-header'
import { AppSidebar } from './app-sidebar'
import { SchoolGate } from './school-gate'
import { PastYearBanner } from './year-switcher'

const COLLAPSED_KEY = 'tz-sidebar-collapsed'

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

function NavShortcut({ item }: { item: NavItem }) {
  const navigate = useNavigate()
  useShortcut(item.shortcut, () => navigate({ to: item.to }), { scope: 'global' })
  return null
}

function LoadingShell() {
  return (
    <div className='flex min-h-dvh'>
      <div className='hidden w-64 shrink-0 bg-sidebar md:block' />
      <div className='grid flex-1 content-start gap-6 p-6'>
        <Skeleton className='h-8 w-48' />
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className='h-28' />
          ))}
        </div>
        <Skeleton className='h-80' />
      </div>
    </div>
  )
}

function NoAdminAccess({ me }: { me: Me }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  return (
    <main className='grid min-h-dvh place-items-center px-4'>
      <div className='grid max-w-sm justify-items-center gap-5 text-center'>
        <BrandMark className='h-9' />
        <span className='grid size-14 place-items-center rounded-full bg-muted text-muted-foreground'>
          <Smartphone className='size-6' />
        </span>
        <div className='grid gap-2'>
          <h1 className='text-xl font-extrabold tracking-tight'>Use the mobile app</h1>
          <p className='text-sm text-muted-foreground'>
            {me.name}, your account is set up for the Tamilzorous School app, not the admin console.
          </p>
        </div>
        <Button
          variant='outline'
          onClick={async () => {
            await authApi.logout().catch(() => null)
            session.clear()
            queryClient.clear()
            await navigate({ to: '/login', replace: true })
          }}
        >
          Sign out
        </Button>
      </div>
    </main>
  )
}

export function AppLayout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const pathname = useRouterState({ select: (state) => state.location.href })
  const { toggleTheme } = useTheme()
  const { setHelpOpen } = useShortcutHelp()
  const me = useMe()
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(
    () =>
      session.subscribe((next) => {
        if (next) return
        queryClient.clear()
        void navigate({ to: '/login', search: { redirect: pathname }, replace: true })
      }),
    [navigate, queryClient, pathname]
  )

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    try {
      localStorage.setItem(COLLAPSED_KEY, String(next))
    } catch {
      return
    }
  }

  useShortcut('app.help', () => setHelpOpen(true), { scope: 'global' })
  useShortcut('app.theme', toggleTheme, { scope: 'global' })
  useShortcut('app.sidebar', toggleCollapsed, { scope: 'global' })

  if (me.isError && !me.data) {
    return (
      <main className='grid min-h-dvh place-items-center px-4'>
        <ErrorState message={me.error.message} onRetry={() => me.refetch()} />
      </main>
    )
  }
  if (!me.data) return <LoadingShell />

  const isParentOnly = me.data.apps.includes('parent') && !me.data.apps.includes('admin')
  const isStaffOnly = me.data.apps.includes('staff') && !me.data.apps.includes('admin')
  const isAllowedPath =
    (isParentOnly && pathname.includes('/parent-preview')) ||
    (isStaffOnly && pathname.includes('/teacher-preview'))

  if (!me.data.apps.includes('admin') && !isAllowedPath) {
    if (isParentOnly) {
      void navigate({ to: '/parent-preview', replace: true })
      return <LoadingShell />
    }
    if (isStaffOnly) {
      void navigate({ to: '/teacher-preview', replace: true })
      return <LoadingShell />
    }
    return <NoAdminAccess me={me.data} />
  }

  const items = NAV_ITEMS.filter((item) => can(me.data, item.permission))

  return (
    <div className='min-h-dvh'>
      <a
        href='#content'
        className='sr-only z-[60] rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3'
      >
        Skip to content
      </a>
      {items.map((item) => (
        <NavShortcut key={item.to} item={item} />
      ))}
      <AppSidebar
        me={me.data}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div
        className={cn(
          'flex min-h-dvh flex-col transition-[padding] duration-300 ease-out',
          collapsed ? 'md:pl-[76px]' : 'md:pl-64'
        )}
      >
        <AppHeader
          me={me.data}
          onToggleSidebar={toggleCollapsed}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <SchoolGate me={me.data}>
          <PastYearBanner />
          <Outlet />
        </SchoolGate>
      </div>
    </div>
  )
}
