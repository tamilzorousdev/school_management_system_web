import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { Bus, Layers, ReceiptIndianRupee, Wallet } from 'lucide-react'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { can, useMe } from '@/features/auth/api'
import { DuesTab } from '../components/dues-tab'
import { PaymentsTab } from '../components/payments-tab'
import { PlansTab } from '../components/plans-tab'
import { TransportFeesTab } from '../components/transport-fees-tab'
import type { FeeTab, FeesSearch } from '../search'

const route = getRouteApi('/_app/fees')

const KEEP_PAGE: (keyof FeesSearch)[] = ['page', 'invoice_id', 'plan_class_id']

export function FeesPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/fees' })
  const canManage = can(useMe().data, 'fees.manage')

  const setSearch = (patch: Partial<FeesSearch>) =>
    navigate({
      search: (prev) => ({
        ...prev,
        ...(KEEP_PAGE.some((key) => key in patch) ? {} : { page: undefined }),
        ...patch,
      }),
      replace: true,
    })

  const go = (tab: FeeTab) => navigate({ search: { tab }, replace: true })

  return (
    <Page>
      <PageHeader
        eyebrow='Finance'
        title='Fees'
        description='Fee plans for each class, invoices with transport from the bus stop, payments with receipts, and who is due or overdue.'
      />
      <PageTabs
        label='Fees sections'
        value={search.tab}
        onChange={go}
        tabs={[
          { value: 'dues', label: 'Dues', icon: ReceiptIndianRupee },
          { value: 'plans', label: 'Fee plans', icon: Layers },
          { value: 'payments', label: 'Payments', icon: Wallet },
          { value: 'transport', label: 'Bus fees', icon: Bus },
        ]}
      />
      {search.tab === 'dues' && (
        <DuesTab search={search} canManage={canManage} onChange={setSearch} />
      )}
      {search.tab === 'plans' && (
        <PlansTab
          canManage={canManage}
          planClassId={search.plan_class_id}
          onOpenPlan={(plan_class_id) => setSearch({ plan_class_id })}
        />
      )}
      {search.tab === 'payments' && (
        <PaymentsTab
          search={search}
          onChange={(patch) =>
            patch.invoice_id
              ? navigate({ search: { tab: 'dues', invoice_id: patch.invoice_id } })
              : setSearch(patch)
          }
        />
      )}
      {search.tab === 'transport' && <TransportFeesTab search={search} onChange={setSearch} />}
    </Page>
  )
}
