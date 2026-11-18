import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  BadgePercent,
  BarChart3,
  ClipboardCheck,
  CreditCard,
  History,
  Layers,
  Lock,
  ReceiptIndianRupee,
  Wallet,
} from 'lucide-react'
import { EmptyState } from '@/components/common/display'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { useMe } from '@/features/auth/api'
import { feeAccess } from '../access'
import { AuditTab } from '../components/audit-tab'
import { BenefitsTab } from '../components/benefits-tab'
import { DuesTab } from '../components/dues-tab'
import { OnlinePaymentsTab } from '../components/online-payments-tab'
import { PaymentsTab } from '../components/payments-tab'
import { PlansTab } from '../components/plans-tab'
import { ReportsTab } from '../components/reports-tab'
import { ApprovalsTab } from '../components/requests'
import type { FeeTab, FeesSearch } from '../search'

const route = getRouteApi('/_app/fees')

const KEEP_PAGE: (keyof FeesSearch)[] = ['page', 'invoice_id', 'plan_class_id']

export function FeesPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/fees' })
  const access = feeAccess(useMe().data)
  const approvals = access.approve || access.adjust
  const tab: FeeTab =
    (search.tab === 'audit' && !access.audit) || (search.tab === 'approvals' && !approvals)
      ? 'dues'
      : search.tab

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

  if (!access.view) {
    return (
      <Page>
        <EmptyState
          icon={Lock}
          title='No access to fees'
          description='Your role cannot see fee plans, dues or payments. Ask the school admin if you need them.'
        />
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        eyebrow='Finance'
        title='Fees'
        description='Fee plans for each class, invoices with transport from the bus stop, payments with receipts, and who is due or overdue.'
      />
      <PageTabs
        label='Fees sections'
        value={tab}
        onChange={go}
        tabs={[
          { value: 'dues', label: 'Dues', icon: ReceiptIndianRupee },
          { value: 'plans', label: 'Fee plans', icon: Layers },
          { value: 'benefits', label: 'Concessions', icon: BadgePercent },
          { value: 'payments', label: 'Payments', icon: Wallet },
          { value: 'online', label: 'Online', icon: CreditCard },
          ...(approvals
            ? [{ value: 'approvals' as const, label: 'Approvals', icon: ClipboardCheck }]
            : []),
          { value: 'reports', label: 'Reports', icon: BarChart3 },
          ...(access.audit ? [{ value: 'audit' as const, label: 'Audit log', icon: History }] : []),
        ]}
      />
      {tab === 'dues' && <DuesTab search={search} access={access} onChange={setSearch} />}
      {tab === 'plans' && (
        <PlansTab
          access={access}
          planClassId={search.plan_class_id}
          onOpenPlan={(plan_class_id) => setSearch({ plan_class_id })}
        />
      )}
      {tab === 'approvals' && (
        <ApprovalsTab
          search={search}
          access={access}
          onChange={setSearch}
          onOpenInvoice={(invoice_id) => navigate({ search: { tab: 'dues', invoice_id } })}
        />
      )}
      {tab === 'online' && (
        <OnlinePaymentsTab
          search={search}
          onChange={setSearch}
          onOpenInvoice={(invoice_id) => navigate({ search: { tab: 'dues', invoice_id } })}
        />
      )}
      {tab === 'reports' && <ReportsTab search={search} onChange={setSearch} />}
      {tab === 'benefits' && <BenefitsTab search={search} access={access} onChange={setSearch} />}
      {tab === 'audit' && (
        <AuditTab
          search={search}
          onChange={setSearch}
          onOpenInvoice={(invoice_id) => navigate({ search: { tab: 'dues', invoice_id } })}
        />
      )}
      {tab === 'payments' && (
        <PaymentsTab
          search={search}
          access={access}
          onChange={(patch) =>
            patch.invoice_id
              ? navigate({ search: { tab: 'dues', invoice_id: patch.invoice_id } })
              : setSearch(patch)
          }
        />
      )}
    </Page>
  )
}
