import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  ArrowRightLeft,
  BarChart3,
  Boxes,
  ClipboardCheck,
  ClipboardList,
  Database,
  HandHelping,
  LayoutDashboard,
  Package,
  Settings2,
  Trash2,
  Wrench,
} from 'lucide-react'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs, type PageTab } from '@/components/common/page-tabs'
import { useInventoryAccess, type InventoryAccess } from '../api'
import { AllocationsTab } from '../components/allocations-tab'
import { AssetsTab } from '../components/assets-tab'
import { AuditsTab } from '../components/audits-tab'
import { DashboardTab } from '../components/dashboard-tab'
import { DisposalsTab } from '../components/disposals-tab'
import { MaintenanceTab } from '../components/maintenance-tab'
import { MastersTab } from '../components/masters-tab'
import { ReportsTab } from '../components/reports-tab'
import { RequisitionsTab } from '../components/requisitions-tab'
import { SettingsTab } from '../components/settings-tab'
import { StockTab } from '../components/stock-tab'
import { TransfersTab } from '../components/transfers-tab'
import type { InventorySearchPatch, InventoryTab } from '../search'

const route = getRouteApi('/_app/inventory')

const TABS: (PageTab<InventoryTab> & { allowed: (access: InventoryAccess) => boolean })[] = [
  { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, allowed: (a) => a.view },
  { value: 'assets', label: 'Assets', icon: Boxes, allowed: (a) => a.view },
  { value: 'allocations', label: 'Allocations', icon: HandHelping, allowed: (a) => a.view },
  { value: 'transfers', label: 'Transfers', icon: ArrowRightLeft, allowed: (a) => a.view },
  { value: 'maintenance', label: 'Maintenance', icon: Wrench, allowed: (a) => a.view },
  { value: 'stock', label: 'Stock', icon: Package, allowed: (a) => a.view },
  { value: 'requisitions', label: 'Requisitions', icon: ClipboardList, allowed: (a) => a.view },
  { value: 'audits', label: 'Audits', icon: ClipboardCheck, allowed: (a) => a.view },
  { value: 'disposals', label: 'Disposals', icon: Trash2, allowed: (a) => a.view },
  { value: 'reports', label: 'Reports', icon: BarChart3, allowed: (a) => a.view },
  { value: 'masters', label: 'Masters', icon: Database, allowed: (a) => a.view },
  { value: 'settings', label: 'Settings', icon: Settings2, allowed: (a) => a.manage },
]

export function InventoryPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/inventory' })
  const access = useInventoryAccess()
  const tabs = TABS.filter((tab) => tab.allowed(access))
  const tab = tabs.some((item) => item.value === search.tab) ? search.tab : 'dashboard'

  const onChange = (patch: InventorySearchPatch) =>
    navigate({
      search: (prev) => ({ ...prev, ...('page' in patch ? {} : { page: undefined }), ...patch }),
      replace: true,
    })

  const go = (next: InventoryTab) => navigate({ search: { tab: next } })
  const props = { search: { ...search, tab }, onChange, access }

  return (
    <Page>
      <PageHeader
        eyebrow='Administration'
        title='Inventory & assets'
        description='Every asset with its tag, who has it and where; stock in the stores; repairs, transfers, audits and disposals.'
      />
      <PageTabs
        label='Inventory sections'
        value={tab}
        onChange={go}
        tabs={tabs.map(({ value, label, icon }) => ({ value, label, icon }))}
      />
      {tab === 'dashboard' && <DashboardTab {...props} />}
      {tab === 'assets' && <AssetsTab {...props} />}
      {tab === 'allocations' && <AllocationsTab {...props} />}
      {tab === 'transfers' && <TransfersTab {...props} />}
      {tab === 'maintenance' && <MaintenanceTab {...props} />}
      {tab === 'stock' && <StockTab {...props} />}
      {tab === 'requisitions' && <RequisitionsTab {...props} />}
      {tab === 'audits' && <AuditsTab {...props} />}
      {tab === 'disposals' && <DisposalsTab {...props} />}
      {tab === 'reports' && <ReportsTab {...props} />}
      {tab === 'masters' && <MastersTab {...props} />}
      {tab === 'settings' && <SettingsTab {...props} />}
    </Page>
  )
}
