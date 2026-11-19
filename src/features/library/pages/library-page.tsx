import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  BarChart3,
  BookCopy,
  BookOpen,
  ClipboardCheck,
  DoorOpen,
  IndianRupee,
  LayoutDashboard,
  PhoneCall,
  ScanBarcode,
  Settings,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { EmptyState } from '@/components/common/display'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { can, useMe } from '@/features/auth/api'
import { AttendanceTab } from '../components/attendance-tab'
import { CatalogueTab } from '../components/catalogue-tab'
import { DashboardTab } from '../components/dashboard-tab'
import { DeskTab } from '../components/desk-tab'
import { FinesTab } from '../components/fines-tab'
import { FollowUpsTab } from '../components/follow-ups-tab'
import { InventoryTab } from '../components/inventory-tab'
import { LoansTab } from '../components/loans-tab'
import { MembersTab } from '../components/members-tab'
import { ReportsTab } from '../components/reports-tab'
import { SettingsTab } from '../components/settings-tab'
import { StockCheckTab } from '../components/stock-check-tab'
import type { LibrarySearch, LibraryTab } from '../search'

const route = getRouteApi('/_app/library')

const TABS: { value: LibraryTab; label: string; icon: LucideIcon; permission: string }[] = [
  { value: 'dashboard', label: 'Overview', icon: LayoutDashboard, permission: 'library.view' },
  { value: 'catalogue', label: 'Catalogue', icon: BookOpen, permission: 'library.view' },
  { value: 'inventory', label: 'Inventory', icon: BookCopy, permission: 'library.view' },
  { value: 'desk', label: 'Issue desk', icon: ScanBarcode, permission: 'library.manage' },
  { value: 'loans', label: 'Loans', icon: BookOpen, permission: 'library.view' },
  { value: 'follow-ups', label: 'Follow-ups', icon: PhoneCall, permission: 'library.view' },
  { value: 'members', label: 'Members', icon: UsersRound, permission: 'library.view' },
  { value: 'fines', label: 'Fines', icon: IndianRupee, permission: 'library.view' },
  { value: 'attendance', label: 'Attendance', icon: DoorOpen, permission: 'library.view' },
  { value: 'stock-check', label: 'Stock check', icon: ClipboardCheck, permission: 'library.view' },
  { value: 'reports', label: 'Reports', icon: BarChart3, permission: 'library.view' },
  { value: 'settings', label: 'Settings', icon: Settings, permission: 'library.view' },
]

export function LibraryPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/library' })
  const me = useMe().data
  const tabs = TABS.filter((tab) => can(me, tab.permission))
  const tab = tabs.some((item) => item.value === search.tab) ? search.tab : 'dashboard'

  const setSearch = (patch: Partial<LibrarySearch>) =>
    navigate({
      search: (prev) => ({ ...prev, ...('page' in patch ? {} : { page: undefined }), ...patch }),
      replace: true,
    })

  const go = (next: LibraryTab, patch: Partial<LibrarySearch> = {}) =>
    navigate({ search: { tab: next, ...patch } })

  const props = { search, onChange: setSearch, onGo: go }

  return (
    <Page>
      <PageHeader
        eyebrow='Academics'
        title='Library'
        description='Catalogue and barcodes, the issue and return desk, overdue follow-ups, fines, library attendance and stock checks.'
      />
      {!can(me, 'library.view') && me ? (
        <EmptyState
          icon={BookOpen}
          title='No access to the library'
          description='Ask the school admin for the library permission.'
        />
      ) : (
        <>
          <PageTabs
            label='Library sections'
            value={tab}
            onChange={(next) => navigate({ search: { tab: next }, replace: true })}
            tabs={tabs.map(({ value, label, icon }) => ({ value, label, icon }))}
          />
          {tab === 'dashboard' && <DashboardTab onGo={go} />}
          {tab === 'catalogue' && <CatalogueTab {...props} />}
          {tab === 'inventory' && <InventoryTab {...props} />}
          {tab === 'desk' && <DeskTab {...props} />}
          {tab === 'loans' && <LoansTab {...props} />}
          {tab === 'follow-ups' && <FollowUpsTab {...props} />}
          {tab === 'members' && <MembersTab {...props} />}
          {tab === 'fines' && <FinesTab {...props} />}
          {tab === 'attendance' && <AttendanceTab {...props} />}
          {tab === 'stock-check' && <StockCheckTab {...props} />}
          {tab === 'reports' && <ReportsTab {...props} />}
          {tab === 'settings' && <SettingsTab />}
        </>
      )}
    </Page>
  )
}
