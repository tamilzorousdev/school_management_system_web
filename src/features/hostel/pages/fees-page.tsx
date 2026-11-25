import { useState } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import {
  BedDouble,
  CalendarRange,
  CircleOff,
  IndianRupee,
  PiggyBank,
  Receipt,
  ReceiptText,
  UserRoundX,
  Wallet,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/display'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { can, useMe } from '@/features/auth/api'
import { rupees } from '@/features/fees/labels'
import { useDues, useFeesInsights, type DuesRow } from '../api'
import { BillModal } from '../components/fee-modals'
import { FeeScheduleEditor } from '../components/fee-schedule-editor'
import { HostelTabs } from '../components/hostel-tabs'
import { HostelSelect } from '../components/pickers'
import { DEPOSIT_STATUS, studentLine } from '../labels'
import type { HostelFeesSearch } from '../search'

const route = getRouteApi('/_app/hostel/fees')
const LIMIT = 20

const BALANCE_OPTIONS = [{ value: 'yes', label: 'Owes money' }]

export function HostelFeesPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/hostel/fees' })
  const me = useMe().data
  const canView = can(me, 'hostel.view')
  const canFees = can(me, 'hostel.fees')
  const tab = search.tab
  const [billing, setBilling] = useState(false)

  const insights = useFeesInsights(search.hostel_id, canView)
  const dues = useDues(
    {
      page: search.page,
      limit: LIMIT,
      search: search.search,
      hostel_id: search.hostel_id,
      with_balance: search.with_balance,
      sort: search.sort,
      order: search.order,
    },
    canView && tab === 'dues'
  )

  const setSearch = (patch: Partial<HostelFeesSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })

  useShortcut('app.refresh', () => {
    void insights.refetch()
    if (tab === 'dues') void dues.refetch()
  })

  if (me && !canView) {
    return (
      <Page>
        <PageHeader eyebrow='Hostel' title='Hostel fees' />
        <EmptyState
          icon={BedDouble}
          title='No access to the hostel'
          description='Ask the school admin for the hostel permission.'
        />
      </Page>
    )
  }

  const data = insights.data
  const onDues = tab === 'dues'
  const cards: Insight[] = [
    {
      key: 'collected',
      label: 'Collected',
      value: rupees(data?.collected ?? 0),
      hint: `of ${rupees(data?.billed ?? 0)} billed`,
      icon: Wallet,
      tone: 'success',
    },
    {
      key: 'outstanding',
      label: 'Outstanding',
      value: rupees(data?.outstanding ?? 0),
      hint: 'Billed and not paid yet',
      icon: IndianRupee,
      tone: (data?.outstanding ?? 0) > 0 ? 'warning' : 'neutral',
    },
    {
      key: 'with_dues',
      label: 'Residents who owe',
      value: data?.residents_with_dues ?? 0,
      hint: 'Show only them',
      icon: UserRoundX,
      tone: (data?.residents_with_dues ?? 0) > 0 ? 'danger' : 'neutral',
      active: onDues && search.with_balance === true,
      onClick: () =>
        onDues
          ? setSearch({ with_balance: search.with_balance === true ? undefined : true })
          : navigate({
              search: { tab: 'dues', page: 1, hostel_id: search.hostel_id, with_balance: true },
            }),
    },
    {
      key: 'unbilled',
      label: 'Not billed yet',
      value: data?.unbilled_residents ?? 0,
      hint: 'Residents missing a due instalment',
      icon: ReceiptText,
      tone: (data?.unbilled_residents ?? 0) > 0 ? 'warning' : 'neutral',
      onClick: canFees ? () => setBilling(true) : undefined,
    },
    {
      key: 'deposits',
      label: 'Deposits held',
      value: rupees(data?.deposits_held ?? 0),
      hint: 'Caution deposits to settle at checkout',
      icon: PiggyBank,
      tone: 'info',
    },
  ]

  const columns: Column<DuesRow>[] = [
    {
      key: 'name',
      header: 'Student',
      sortKey: 'name',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='truncate font-bold'>{row.student.name}</span>
          <span className='truncate text-xs text-muted-foreground'>{studentLine(row.student)}</span>
        </div>
      ),
    },
    {
      key: 'bed',
      header: 'Hostel / bed',
      hideBelow: 'lg',
      cell: (row) => (
        <div className='grid gap-0.5'>
          <span>{row.hostel_name}</span>
          <span className='tabular text-xs text-muted-foreground'>{row.bed ?? 'No bed'}</span>
        </div>
      ),
    },
    {
      key: 'billed',
      header: 'Billed',
      sortKey: 'billed',
      align: 'right',
      cell: (row) => <span className='tabular'>{rupees(row.billed)}</span>,
    },
    {
      key: 'paid',
      header: 'Paid',
      align: 'right',
      hideBelow: 'lg',
      cell: (row) => <span className='tabular'>{rupees(row.paid)}</span>,
    },
    {
      key: 'balance',
      header: 'Balance',
      sortKey: 'balance',
      align: 'right',
      cell: (row) => (
        <span className={row.balance > 0 ? 'tabular font-bold text-warning' : 'tabular'}>
          {rupees(row.balance)}
        </span>
      ),
    },
    {
      key: 'flags',
      header: 'Notes',
      cell: (row) => (
        <div className='flex flex-wrap gap-1'>
          {row.unbilled > 0 && <Badge tone='warning'>{row.unbilled} not billed</Badge>}
          <Badge tone={DEPOSIT_STATUS[row.deposit_status].tone}>
            Deposit: {DEPOSIT_STATUS[row.deposit_status].label}
          </Badge>
        </div>
      ),
    },
  ]

  const filtered = Boolean(search.search || search.hostel_id || search.with_balance)

  return (
    <Page>
      <PageHeader
        eyebrow='Hostel'
        title='Hostel fees'
        description='Hostel fee is billed as normal school fee invoices, one per instalment. Collect payments from the Fees page.'
        actions={
          <>
            <Button variant='outline' asChild>
              <Link to='/fees' search={{ tab: 'dues' }}>
                <IndianRupee />
                Collect in Fees
              </Link>
            </Button>
            {canFees && (
              <Button onClick={() => setBilling(true)}>
                <Receipt />
                Bill hostel fees
              </Button>
            )}
          </>
        }
      />
      <HostelTabs active='/hostel/fees' />

      <InsightCards items={cards} loading={insights.isPending} />

      <PageTabs
        label='Hostel fee sections'
        value={tab}
        onChange={(next) =>
          navigate({ search: { tab: next, page: 1, hostel_id: search.hostel_id } })
        }
        tabs={[
          {
            value: 'dues',
            label: 'Dues',
            icon: IndianRupee,
            count: data?.residents_with_dues || undefined,
          },
          { value: 'schedule', label: 'Instalments', icon: CalendarRange },
        ]}
      />

      {tab === 'dues' ? (
        <Card className='overflow-hidden'>
          <ListToolbar
            summary={
              dues.data
                ? `${dues.data.total} ${dues.data.total === 1 ? 'resident' : 'residents'}`
                : ''
            }
            onClear={
              filtered
                ? () => navigate({ search: { tab: 'dues', page: 1 }, replace: true })
                : undefined
            }
          >
            <SearchBox
              value={search.search ?? ''}
              onChange={(value) => setSearch({ search: value || undefined })}
              placeholder='Search name or admission number'
              label='Search hostel dues'
            />
            <HostelSelect
              id='fees-hostel'
              label='Filter by hostel'
              allLabel='All hostels'
              value={search.hostel_id ? String(search.hostel_id) : undefined}
              onChange={(value) => setSearch({ hostel_id: value ? Number(value) : undefined })}
            />
            <FilterSelect
              id='fees-balance'
              label='Filter by balance'
              allLabel='Any balance'
              value={search.with_balance ? 'yes' : undefined}
              options={BALANCE_OPTIONS}
              onChange={(value) => setSearch({ with_balance: value === 'yes' ? true : undefined })}
            />
          </ListToolbar>
          <DataTable
            rows={dues.data?.items ?? []}
            columns={columns}
            rowKey={(row) => row.admission_id}
            loading={dues.isFetching}
            error={dues.isError ? dues.error.message : null}
            onRetry={() => dues.refetch()}
            onRowClick={(row) =>
              void navigate({
                to: '/hostel/residents/$admissionId',
                params: { admissionId: String(row.admission_id) },
                search: { tab: 'fees' },
              })
            }
            sort={{ sort: search.sort ?? 'balance', order: search.order ?? 'desc' }}
            onSortChange={(next) =>
              setSearch({ sort: next.sort as HostelFeesSearch['sort'], order: next.order })
            }
            empty={{
              icon: filtered ? CircleOff : Receipt,
              title: filtered ? 'No residents match these filters' : 'No hostel fees yet',
              description: filtered
                ? 'Try another name or hostel, or clear the filters.'
                : 'Set the instalments, then bill hostel fees for residents with a bed.',
              action:
                !filtered && canFees ? (
                  <Button onClick={() => setBilling(true)}>
                    <Receipt />
                    Bill hostel fees
                  </Button>
                ) : undefined,
            }}
            card={(row) => (
              <div className='grid gap-1.5'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='grid min-w-0'>
                    <span className='truncate font-bold'>{row.student.name}</span>
                    <span className='truncate text-xs text-muted-foreground'>
                      {[row.hostel_name, row.bed].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                  <span
                    className={
                      row.balance > 0
                        ? 'tabular shrink-0 font-bold text-warning'
                        : 'tabular shrink-0 font-semibold'
                    }
                  >
                    {rupees(row.balance)}
                  </span>
                </div>
                <span className='tabular text-xs text-muted-foreground'>
                  Billed {rupees(row.billed)} · paid {rupees(row.paid)}
                </span>
                <span className='flex flex-wrap gap-1'>
                  {row.unbilled > 0 && <Badge tone='warning'>{row.unbilled} not billed</Badge>}
                  <Badge tone={DEPOSIT_STATUS[row.deposit_status].tone}>
                    Deposit: {DEPOSIT_STATUS[row.deposit_status].label}
                  </Badge>
                </span>
              </div>
            )}
            pagination={{
              page: search.page,
              limit: LIMIT,
              total: dues.data?.total ?? 0,
              label: 'residents',
              onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
            }}
          />
        </Card>
      ) : (
        <FeeScheduleEditor />
      )}

      <BillModal open={billing} onOpenChange={setBilling} hostelId={search.hostel_id} />
    </Page>
  )
}
