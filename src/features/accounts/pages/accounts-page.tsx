import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { BarChart3, Plus, Receipt, Tags, Wallet } from 'lucide-react'
import { PageTabs } from '@/components/common/page-tabs'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Kbd } from '@/components/shortcuts/kbd'
import { Button } from '@/components/ui/button'
import { can, useMe } from '@/features/auth/api'
import { CategoriesTab } from '../components/categories-tab'
import { EntriesTab } from '../components/entries-tab'
import { ReportsTab } from '../components/reports-tab'
import type { AccountTab, AccountsSearch, AccountsTabProps } from '../search'

const route = getRouteApi('/_app/accounts')

const TABS: Record<
  AccountTab,
  { label: string; icon: typeof Wallet; description: string; add?: string; approverOnly?: boolean }
> = {
  expenses: {
    label: 'Expenses',
    icon: Receipt,
    description:
      'School bills and payments. Entries from the accountant wait for approval before they count.',
    add: 'Add expense',
  },
  income: {
    label: 'Other income',
    icon: Wallet,
    description: 'Money received other than fees: donations, uniform and book sales, hall rent.',
    add: 'Add income',
  },
  reports: {
    label: 'Reports',
    icon: BarChart3,
    description:
      'Income against expenses, month by month and by category, including fees, bus costs and salaries.',
  },
  categories: {
    label: 'Categories',
    icon: Tags,
    description: 'The expense and income categories offered when adding an entry.',
    add: 'Add category',
    approverOnly: true,
  },
}

const TAB_ORDER = Object.keys(TABS) as AccountTab[]

export function AccountsPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/accounts' })
  const me = useMe().data
  const canManage = can(me, 'accounts.manage')
  const canApprove = can(me, 'accounts.approve')
  const [adding, setAdding] = useState(false)
  const current = TABS[search.tab]
  const add =
    current.add && (current.approverOnly ? canApprove : canManage) ? current.add : undefined

  const setSearch = (patch: Partial<AccountsSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })
  const onPageChange = (page: number) => navigate({ search: (prev) => ({ ...prev, page }) })
  const onClear = () => navigate({ search: { tab: search.tab, page: 1 }, replace: true })
  const changeTab = (tab: AccountTab) => {
    setAdding(false)
    navigate({ search: { tab, page: 1 }, replace: true })
  }

  useShortcut('accounts.create', () => setAdding(true), { enabled: Boolean(add) })

  const tabProps: AccountsTabProps = {
    search,
    setSearch,
    onPageChange,
    onClear,
    canManage,
    canApprove,
    adding,
    onAddingChange: setAdding,
  }

  return (
    <Page>
      <PageHeader
        eyebrow='Finance'
        title='Accounts'
        description={current.description}
        actions={
          add && (
            <Button onClick={() => setAdding(true)}>
              <Plus />
              {add}
              <Kbd id='accounts.create' inverted />
            </Button>
          )
        }
      />
      <PageTabs
        label='Accounts sections'
        value={search.tab}
        onChange={changeTab}
        tabs={TAB_ORDER.map((value) => ({
          value,
          label: TABS[value].label,
          icon: TABS[value].icon,
        }))}
      />
      {search.tab === 'expenses' && <EntriesTab key='expense' kind='expense' {...tabProps} />}
      {search.tab === 'income' && <EntriesTab key='income' kind='income' {...tabProps} />}
      {search.tab === 'reports' && <ReportsTab {...tabProps} />}
      {search.tab === 'categories' && <CategoriesTab {...tabProps} />}
    </Page>
  )
}
