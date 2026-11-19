import { useState } from 'react'
import { CircleOff, HandCoins, IndianRupee, ReceiptText, Wallet } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { can, useMe } from '@/features/auth/api'
import { rupees, wholeRupees } from '@/features/fees/labels'
import { formatDate } from '@/lib/format'
import {
  FINE_KINDS,
  FINE_STATUSES,
  MEMBER_TYPES,
  PAYMENT_MODES,
  useFineInsights,
  useFinePayments,
  useFines,
  type Fine,
  type FinePayment,
} from '../api'
import {
  FINE_KIND,
  FINE_STATUS,
  MEMBER_TYPE,
  PAYMENT_MODE,
  badgeOf,
  openFineReceipt,
  optionsOf,
} from '../labels'
import { LIST_LIMIT, oneOf, type LibraryTabProps } from '../search'
import { CollectFineModal, WaiveFineModal, type FineTarget } from './fine-modals'
import { MemberLine } from './library-parts'
import { ClassFilter } from './school-pickers'

export function FinesTab(props: LibraryTabProps) {
  const { search, onChange } = props
  const view = search.view ?? 'fines'
  const insights = useFineInsights()
  const data = insights.data

  const cards: Insight[] = [
    {
      key: 'outstanding',
      label: 'Outstanding',
      value: wholeRupees(data?.outstanding ?? 0),
      hint: `${data?.outstanding_count ?? 0} fines unpaid`,
      icon: IndianRupee,
      tone: data?.outstanding ? 'danger' : 'success',
      active: view === 'fines' && search.outstanding === true,
      onClick: () =>
        onChange({
          view: undefined,
          outstanding: search.outstanding ? undefined : true,
          status: undefined,
        }),
    },
    {
      key: 'collected',
      label: 'Collected this month',
      value: wholeRupees(data?.collected_this_month ?? 0),
      hint: `${wholeRupees(data?.raised_this_month ?? 0)} raised this month`,
      icon: Wallet,
      tone: 'success',
      active: view === 'collections',
      onClick: () => onChange({ view: view === 'collections' ? undefined : 'collections' }),
    },
    {
      key: 'today',
      label: 'Collected today',
      value: wholeRupees(data?.collected_today ?? 0),
      icon: HandCoins,
      tone: 'info',
    },
    {
      key: 'waived',
      label: 'Waived this month',
      value: wholeRupees(data?.waived_this_month ?? 0),
      icon: ReceiptText,
      tone: 'neutral',
      active: view === 'fines' && search.status === 'waived',
      onClick: () =>
        onChange({
          view: undefined,
          status: search.status === 'waived' ? undefined : 'waived',
          outstanding: undefined,
        }),
    },
  ]

  return (
    <div className='grid gap-4'>
      <InsightCards items={cards} loading={insights.isPending} />
      <SegmentedControl
        label='Fines view'
        value={view}
        onChange={(next) =>
          onChange({
            view: next === 'fines' ? undefined : next,
            search: undefined,
            sort: undefined,
            order: undefined,
            status: undefined,
            kind: undefined,
            mode: undefined,
          })
        }
        options={[
          { value: 'fines', label: 'Fines' },
          { value: 'collections', label: 'Collections' },
        ]}
        className='self-start'
      />
      {view === 'fines' ? <FineList {...props} /> : <Collections {...props} />}
    </div>
  )
}

function FineList({ search, onChange }: LibraryTabProps) {
  const me = useMe().data
  const canCollect = can(me, 'library.fines')
  const canWaive = can(me, 'library.waive')
  const status = oneOf(FINE_STATUSES, search.status)
  const kind = oneOf(FINE_KINDS, search.kind)
  const memberType = oneOf(MEMBER_TYPES, search.member_type)
  const fines = useFines({
    page: search.page ?? 1,
    limit: LIST_LIMIT,
    search: search.search,
    sort: search.sort,
    order: search.order,
    status,
    kind,
    member_type: memberType,
    class_id: search.class_id,
    outstanding: search.outstanding,
  })
  const [collecting, setCollecting] = useState<FineTarget | null>(null)
  const [waiving, setWaiving] = useState<FineTarget | null>(null)

  const target = (fine: Fine): FineTarget => ({
    id: fine.id,
    balance: fine.balance,
    reason: fine.reason,
    member_name: fine.member.name,
  })

  const buttons = (fine: Fine) =>
    fine.balance > 0 && (canCollect || canWaive) ? (
      <div className='inline-flex gap-1'>
        {canCollect && (
          <Button size='sm' onClick={() => setCollecting(target(fine))}>
            Collect
          </Button>
        )}
        {canWaive && (
          <Button size='sm' variant='outline' onClick={() => setWaiving(target(fine))}>
            Waive
          </Button>
        )}
      </div>
    ) : null

  const columns: Column<Fine>[] = [
    {
      key: 'member',
      header: 'Member',
      cell: (fine) => <MemberLine member={fine.member} size='sm' />,
    },
    {
      key: 'reason',
      header: 'For',
      cell: (fine) => (
        <div className='grid max-w-72'>
          <span className='truncate'>{fine.reason}</span>
          <span className='text-xs text-muted-foreground'>
            {FINE_KIND[fine.kind]} · {formatDate(fine.created_at)}
            {fine.waive_reason ? ` · waived: ${fine.waive_reason}` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (fine) => {
        const item = badgeOf(FINE_STATUS, fine.status)
        return <Badge tone={item.tone}>{item.label}</Badge>
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      sortKey: 'amount',
      align: 'right',
      hideBelow: 'lg',
      cell: (fine) => <span className='tabular'>{rupees(fine.amount)}</span>,
    },
    {
      key: 'balance',
      header: 'Balance',
      sortKey: 'balance',
      align: 'right',
      cell: (fine) => (
        <span className={`tabular font-bold ${fine.balance ? 'text-destructive' : ''}`}>
          {rupees(fine.balance)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      className: 'w-40',
      cell: buttons,
    },
  ]

  const filtered = Boolean(
    search.search || status || kind || memberType || search.class_id || search.outstanding
  )

  return (
    <Card className='overflow-hidden'>
      <ListToolbar
        summary={fines.data ? `${fines.data.total} fines` : ''}
        onClear={
          filtered
            ? () =>
                onChange({
                  search: undefined,
                  status: undefined,
                  kind: undefined,
                  member_type: undefined,
                  class_id: undefined,
                  outstanding: undefined,
                })
            : undefined
        }
      >
        <SearchBox
          value={search.search ?? ''}
          onChange={(value) => onChange({ search: value || undefined })}
          placeholder='Member, card or book'
          label='Search fines'
        />
        <FilterSelect
          id='fine-status-filter'
          label='Filter by status'
          allLabel='All statuses'
          value={status}
          options={optionsOf(FINE_STATUS)}
          onChange={(next) => onChange({ status: next })}
        />
        <FilterSelect
          id='fine-kind-filter'
          label='Filter by kind'
          allLabel='All kinds'
          value={kind}
          options={optionsOf(FINE_KIND)}
          onChange={(next) => onChange({ kind: next })}
        />
        <FilterSelect
          id='fine-member-type-filter'
          label='Filter by member type'
          allLabel='Students and staff'
          value={memberType}
          options={optionsOf(MEMBER_TYPE)}
          onChange={(member_type) => onChange({ member_type })}
        />
        <ClassFilter value={search.class_id} onChange={(class_id) => onChange({ class_id })} />
        <FilterSelect
          id='fine-outstanding-filter'
          label='Filter by balance'
          allLabel='Any balance'
          value={search.outstanding ? 'true' : undefined}
          options={[{ value: 'true', label: 'With a balance' }]}
          onChange={(value) => onChange({ outstanding: value ? true : undefined })}
        />
      </ListToolbar>
      <DataTable
        rows={fines.data?.items ?? []}
        columns={columns}
        rowKey={(fine) => fine.id}
        loading={fines.isFetching}
        error={fines.isError ? fines.error.message : null}
        onRetry={() => fines.refetch()}
        sort={{ sort: search.sort, order: search.order ?? 'desc' }}
        onSortChange={(next) => onChange(next)}
        empty={{
          icon: filtered ? CircleOff : IndianRupee,
          title: filtered ? 'No fines match these filters' : 'No fines yet',
          description: filtered
            ? 'Clear the filters to see more.'
            : 'Late, lost and damage fines show here when books come back.',
        }}
        card={(fine) => (
          <div className='grid gap-1.5'>
            <div className='flex items-start justify-between gap-2'>
              <MemberLine member={fine.member} size='sm' />
              <span
                className={`tabular shrink-0 font-bold ${fine.balance ? 'text-destructive' : ''}`}
              >
                {rupees(fine.balance)}
              </span>
            </div>
            <span className='text-sm'>{fine.reason}</span>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <Badge tone={badgeOf(FINE_STATUS, fine.status).tone}>
                {badgeOf(FINE_STATUS, fine.status).label}
              </Badge>
              {buttons(fine)}
            </div>
          </div>
        )}
        pagination={{
          page: search.page ?? 1,
          limit: LIST_LIMIT,
          total: fines.data?.total ?? 0,
          label: 'fines',
          onPageChange: (page) => onChange({ page }),
        }}
      />
      {collecting && <CollectFineModal fine={collecting} onClose={() => setCollecting(null)} />}
      {waiving && <WaiveFineModal fine={waiving} onClose={() => setWaiving(null)} />}
    </Card>
  )
}

function Collections({ search, onChange }: LibraryTabProps) {
  const mode = oneOf(PAYMENT_MODES, search.mode)
  const payments = useFinePayments({
    page: search.page ?? 1,
    limit: LIST_LIMIT,
    search: search.search,
    sort: search.sort,
    order: search.order,
    mode,
    from: search.from,
    to: search.to,
  })

  const receipt = (payment: FinePayment) => (
    <Button size='sm' variant='outline' onClick={() => openFineReceipt(payment.id)}>
      <ReceiptText />
      Receipt
    </Button>
  )

  const columns: Column<FinePayment>[] = [
    {
      key: 'receipt_no',
      header: 'Receipt',
      cell: (payment) => (
        <span className='font-mono text-xs font-semibold'>{payment.receipt_no}</span>
      ),
    },
    {
      key: 'member',
      header: 'Member',
      cell: (payment) => <MemberLine member={payment.member} size='sm' />,
    },
    {
      key: 'reason',
      header: 'For',
      hideBelow: 'lg',
      cell: (payment) => <span className='line-clamp-2 max-w-72'>{payment.fine_reason}</span>,
    },
    {
      key: 'paid_on',
      header: 'Paid on',
      sortKey: 'paid_on',
      cell: (payment) => (
        <div className='grid'>
          <span>{formatDate(payment.paid_on)}</span>
          <span className='text-xs text-muted-foreground'>
            {PAYMENT_MODE[payment.mode]}
            {payment.received_by ? ` · ${payment.received_by}` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortKey: 'amount',
      align: 'right',
      cell: (payment) => <span className='tabular font-bold'>{rupees(payment.amount)}</span>,
    },
    {
      key: 'actions',
      header: <span className='sr-only'>Receipt</span>,
      align: 'right',
      className: 'w-28',
      cell: receipt,
    },
  ]

  const filtered = Boolean(search.search || mode || search.from || search.to)

  return (
    <Card className='overflow-hidden'>
      <ListToolbar
        summary={payments.data ? `${payments.data.total} collections` : ''}
        onClear={
          filtered
            ? () => onChange({ search: undefined, mode: undefined, from: undefined, to: undefined })
            : undefined
        }
      >
        <SearchBox
          value={search.search ?? ''}
          onChange={(value) => onChange({ search: value || undefined })}
          placeholder='Receipt no or member'
          label='Search collections'
        />
        <FilterSelect
          id='payment-mode-filter'
          label='Filter by mode'
          allLabel='All modes'
          value={mode}
          options={optionsOf(PAYMENT_MODE)}
          onChange={(next) => onChange({ mode: next })}
        />
        <div className='flex items-center gap-1.5'>
          <Input
            type='date'
            aria-label='Paid from'
            placeholder='From'
            value={search.from ?? ''}
            onChange={(event) => onChange({ from: event.target.value || undefined })}
            className='w-36'
          />
          <span className='text-xs text-muted-foreground'>to</span>
          <Input
            type='date'
            aria-label='Paid to'
            placeholder='To'
            value={search.to ?? ''}
            onChange={(event) => onChange({ to: event.target.value || undefined })}
            className='w-36'
          />
        </div>
      </ListToolbar>
      <DataTable
        rows={payments.data?.items ?? []}
        columns={columns}
        rowKey={(payment) => payment.id}
        loading={payments.isFetching}
        error={payments.isError ? payments.error.message : null}
        onRetry={() => payments.refetch()}
        sort={{ sort: search.sort, order: search.order ?? 'desc' }}
        onSortChange={(next) => onChange(next)}
        empty={{
          icon: filtered ? CircleOff : Wallet,
          title: filtered ? 'No collections match these filters' : 'No fines collected yet',
        }}
        card={(payment) => (
          <div className='grid gap-1.5'>
            <div className='flex items-start justify-between gap-2'>
              <MemberLine member={payment.member} size='sm' />
              <span className='tabular shrink-0 font-bold'>{rupees(payment.amount)}</span>
            </div>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <span className='text-xs text-muted-foreground'>
                {payment.receipt_no} · {formatDate(payment.paid_on)} · {PAYMENT_MODE[payment.mode]}
              </span>
              {receipt(payment)}
            </div>
          </div>
        )}
        pagination={{
          page: search.page ?? 1,
          limit: LIST_LIMIT,
          total: payments.data?.total ?? 0,
          label: 'collections',
          onPageChange: (page) => onChange({ page }),
        }}
      />
    </Card>
  )
}
