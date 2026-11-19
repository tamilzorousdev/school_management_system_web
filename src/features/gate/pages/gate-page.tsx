import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  Activity,
  BarChart3,
  DoorOpen,
  History,
  Plus,
  Settings,
  ShieldAlert,
  UserCheck,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { PageTabs } from '@/components/common/page-tabs'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Kbd } from '@/components/shortcuts/kbd'
import { Button } from '@/components/ui/button'
import { can, useMe } from '@/features/auth/api'
import { BlockedTab } from '../components/blocked-tab'
import { LiveTab } from '../components/live-tab'
import { LogTab } from '../components/log-tab'
import { PassesTab } from '../components/passes-tab'
import { PickupsTab } from '../components/pickups-tab'
import { ReportsTab } from '../components/reports-tab'
import { SettingsTab } from '../components/settings-tab'
import { VisitorsTab } from '../components/visitors-tab'
import type { GateSearch, GateTab, GateTabProps } from '../search'

const route = getRouteApi('/_app/gate')

const TABS: Record<
  GateTab,
  {
    label: string
    icon: LucideIcon
    description: string
    add?: { label: string; tab: GateTab }
  }
> = {
  live: {
    label: 'Live board',
    icon: Activity,
    description:
      'Real-time gate status: student pickups, waiting emergencies, visitors inside and today’s activity.',
    add: { label: 'New gate pass', tab: 'passes' },
  },
  passes: {
    label: 'Gate passes',
    icon: DoorOpen,
    description:
      'Student early release passes requested by parents, staff or created at the counter.',
    add: { label: 'New gate pass', tab: 'passes' },
  },
  visitors: {
    label: 'Visitors',
    icon: UsersRound,
    description: 'Visitor passes, walk-ins, pre-invited guests and check-in / check-out history.',
    add: { label: 'Invite visitor', tab: 'visitors' },
  },
  log: {
    label: 'Gate log',
    icon: History,
    description:
      'Chronological timeline of all pass checks, visitor movements, emergency releases and security alerts.',
  },
  pickups: {
    label: 'Pickup persons',
    icon: UserCheck,
    description:
      'Trusted family members or guardians authorised by parents to collect students early.',
    add: { label: 'Add authorised person', tab: 'pickups' },
  },
  blocked: {
    label: 'Blocked list',
    icon: ShieldAlert,
    description:
      'Individuals prohibited from campus entry or student pickups, with automatic security alerts.',
    add: { label: 'Block person', tab: 'blocked' },
  },
  reports: {
    label: 'Reports',
    icon: BarChart3,
    description:
      'Daily volumes, release methods, visitor peak hours, emergency counts and Excel downloads.',
  },
  settings: {
    label: 'Settings',
    icon: Settings,
    description:
      'Gate grace window, emergency wait limit, auto checkout time, and visitor photo/ID rules.',
  },
}

const TAB_ORDER = Object.keys(TABS) as GateTab[]

export function GatePage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/gate' })
  const me = useMe().data
  const canManage = can(me, 'gate.manage')
  const canApprove = can(me, 'gate.approve')
  const [adding, setAdding] = useState(false)
  const current = TABS[search.tab]
  const add = canManage || canApprove ? current.add : undefined

  const setSearch = (patch: Partial<GateSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })
  const onPageChange = (page: number) => navigate({ search: (prev) => ({ ...prev, page }) })
  const onClear = () =>
    navigate({
      search: {
        tab: search.tab,
        page: 1,
        student_id: search.tab === 'pickups' ? search.student_id : undefined,
      },
      replace: true,
    })
  const changeTab = (tab: GateTab) =>
    navigate({ search: { tab, page: 1, student_id: search.student_id }, replace: true })
  const goTo = (tab: GateTab, patch: Partial<GateSearch> = {}) =>
    navigate({ search: { tab, page: 1, ...patch } })

  const startAdding = () => {
    if (!add) return
    if (add.tab !== search.tab) changeTab(add.tab)
    setAdding(true)
  }

  useShortcut('gate.create', startAdding, { enabled: Boolean(add) })

  const tabProps: GateTabProps = {
    search,
    setSearch,
    onPageChange,
    onClear,
    canManage,
    canApprove,
    adding,
    onAddingChange: setAdding,
    goTo,
  }

  return (
    <Page>
      <PageHeader
        eyebrow='Campus security'
        title='Gate & visitors'
        description={current.description}
        actions={
          add && (
            <Button onClick={startAdding}>
              <Plus />
              {add.label}
              <Kbd id='gate.create' inverted />
            </Button>
          )
        }
      />
      <PageTabs
        label='Gate and visitor sections'
        value={search.tab}
        onChange={changeTab}
        tabs={TAB_ORDER.map((value) => ({
          value,
          label: TABS[value].label,
          icon: TABS[value].icon,
        }))}
      />
      {search.tab === 'live' && <LiveTab {...tabProps} />}
      {search.tab === 'passes' && <PassesTab {...tabProps} />}
      {search.tab === 'visitors' && <VisitorsTab {...tabProps} />}
      {search.tab === 'log' && <LogTab {...tabProps} />}
      {search.tab === 'pickups' && <PickupsTab {...tabProps} />}
      {search.tab === 'blocked' && <BlockedTab {...tabProps} />}
      {search.tab === 'reports' && <ReportsTab {...tabProps} />}
      {search.tab === 'settings' && <SettingsTab {...tabProps} />}
    </Page>
  )
}
