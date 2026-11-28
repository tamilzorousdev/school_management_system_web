import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  BarChart3,
  CalendarClock,
  ClipboardCheck,
  Fuel,
  LayoutDashboard,
  NotebookText,
  Plus,
  Receipt,
  Settings,
  Wrench,
} from 'lucide-react'
import { PageTabs } from '@/components/common/page-tabs'
import { Page, PageHeader } from '@/components/common/page'
import { Button } from '@/components/ui/button'
import { can, useMe } from '@/features/auth/api'
import { BusLogTab } from '../components/bus-log-tab'
import { ExpensesTab } from '../components/expenses-tab'
import { FuelTab } from '../components/fuel-tab'
import { OverviewTab } from '../components/overview-tab'
import { PreTripTab } from '../components/pre-trip-tab'
import { ReportsTab } from '../components/reports-tab'
import { SchedulesTab } from '../components/schedules-tab'
import { SettingsTab } from '../components/settings-tab'
import { TicketsTab } from '../components/tickets-tab'
import type { MaintenanceSearch, MaintenanceTab, TabProps } from '../search'

const route = getRouteApi('/_app/fleet/maintenance')

const TABS: Record<
  MaintenanceTab,
  {
    label: string
    icon: typeof Wrench
    description: string
    add?: { label: string; tab: MaintenanceTab }
  }
> = {
  overview: {
    label: 'Overview',
    icon: LayoutDashboard,
    description:
      'Spend this month, services and documents falling due, and anything waiting for you.',
    add: { label: 'Add fuel entry', tab: 'fuel' },
  },
  schedules: {
    label: 'Schedules',
    icon: CalendarClock,
    description: 'Service rules for each bus, every so many km or months, most urgent first.',
    add: { label: 'Add rule', tab: 'schedules' },
  },
  tickets: {
    label: 'Service history',
    icon: Wrench,
    description:
      'Planned services and repairs, from engine fault codes, driver reports, failed checks or added by hand.',
    add: { label: 'Add ticket', tab: 'tickets' },
  },
  fuel: {
    label: 'Fuel log',
    icon: Fuel,
    description:
      'Every fill with mileage between full tanks. Fills added by drivers wait here for your check.',
    add: { label: 'Add fuel entry', tab: 'fuel' },
  },
  expenses: {
    label: 'Expenses',
    icon: Receipt,
    description: 'Tyres, insurance and permit renewals, fines, tolls and other bus costs.',
    add: { label: 'Add expense', tab: 'expenses' },
  },
  checks: {
    label: 'Pre-trip checks',
    icon: ClipboardCheck,
    description: 'The 10-point check drivers tick before the first trip of the day.',
  },
  'bus-log': {
    label: 'Bus log',
    icon: NotebookText,
    description: 'Everything that happened to one bus, with its odometer, budget and next service.',
  },
  reports: {
    label: 'Reports',
    icon: BarChart3,
    description: 'Cost per bus, mileage, spend, idle fuel and pay-backs, with Excel downloads.',
  },
  settings: {
    label: 'Settings',
    icon: Settings,
    description: 'Alert thresholds, the pre-trip rule, month lock, and saved garages and stations.',
    add: { label: 'Add garage or station', tab: 'settings' },
  },
}

const TAB_ORDER = Object.keys(TABS) as MaintenanceTab[]

export function MaintenancePage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/fleet/maintenance' })
  const canManage = can(useMe().data, 'fleet.manage')
  const [adding, setAdding] = useState(false)
  const current = TABS[search.tab]
  const add = canManage ? current.add : undefined

  const setSearch = (patch: Partial<MaintenanceSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })
  const onPageChange = (page: number) => navigate({ search: (prev) => ({ ...prev, page }) })
  const onLimitChange = (limit: number) =>
    navigate({ search: (prev) => ({ ...prev, limit, page: 1 }), replace: true })
  const onClear = () =>
    navigate({
      search: {
        tab: search.tab,
        page: 1,
        vehicle_id: search.tab === 'bus-log' ? search.vehicle_id : undefined,
      },
      replace: true,
    })
  const changeTab = (tab: MaintenanceTab) =>
    navigate({ search: { tab, page: 1, vehicle_id: search.vehicle_id }, replace: true })
  const goTo = (tab: MaintenanceTab, patch: Partial<MaintenanceSearch> = {}) =>
    navigate({ search: { tab, page: 1, ...patch } })

  const startAdding = () => {
    if (!add) return
    if (add.tab !== search.tab) changeTab(add.tab)
    setAdding(true)
  }

  const tabProps: TabProps = {
    search,
    setSearch,
    onPageChange,
    onLimitChange,
    onClear,
    canManage,
    adding,
    onAddingChange: setAdding,
    goTo,
  }

  return (
    <Page>
      <PageHeader
        eyebrow='Fleet'
        title='Maintenance'
        description={current.description}
        actions={
          add && (
            <Button variant='primary' onClick={startAdding}>
              <Plus className='size-4' />
              {add.label}
            </Button>
          )
        }
      />
      <PageTabs
        label='Maintenance sections'
        value={search.tab}
        onChange={changeTab}
        tabs={TAB_ORDER.map((value) => ({
          value,
          label: TABS[value].label,
          icon: TABS[value].icon,
        }))}
      />
      {search.tab === 'overview' && <OverviewTab {...tabProps} />}
      {search.tab === 'schedules' && <SchedulesTab {...tabProps} />}
      {search.tab === 'tickets' && <TicketsTab {...tabProps} />}
      {search.tab === 'fuel' && <FuelTab {...tabProps} />}
      {search.tab === 'expenses' && <ExpensesTab {...tabProps} />}
      {search.tab === 'checks' && <PreTripTab {...tabProps} />}
      {search.tab === 'bus-log' && <BusLogTab {...tabProps} />}
      {search.tab === 'reports' && <ReportsTab {...tabProps} />}
      {search.tab === 'settings' && <SettingsTab {...tabProps} />}
    </Page>
  )
}
