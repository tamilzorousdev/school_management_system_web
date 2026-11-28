import { useState } from 'react'
import {
  CalendarDays,
  CircleOff,
  FileText,
  HandCoins,
  History,
  IndianRupee,
  PenLine,
  Plus,
  Receipt,
  Tags,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { TrashIcon } from '@/components/common/icon'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useBusOptions } from '@/features/transport/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import {
  maintenanceApi,
  useExpenseInsights,
  useExpenses,
  useMaintenanceMutation,
  type Expense,
  type ExpenseCategory,
  type ExpenseListParams,
} from '../api'
import {
  EXPENSE_CATEGORY,
  EXPENSE_CATEGORY_OPTIONS,
  PAYMENT_MODE,
  PAYMENT_MODE_OPTIONS,
  rupees,
} from '../labels'
import type { MaintenanceSearch, TabProps } from '../search'
import { ExpenseFormModal } from './expense-form-modal'
import { HistoryModal } from './history-modal'
import { isPhone, openStoredFile } from '../helpers'
import { ActionSheet, BusCell, DateRangeInputs, NoteDialog, type SheetAction } from './shared'

const LIMIT = 20
const SORTS = ['spent_on', 'amount'] as const
const REIMBURSED_OPTIONS = [
  { value: 'false', label: 'Not paid back yet' },
  { value: 'true', label: 'Paid back' },
]

const needsPayBack = (expense: Expense) =>
  expense.payment_mode === 'driver_paid' && !expense.reimbursed_at

const categoryLabel = (category: string) =>
  EXPENSE_CATEGORY[category as ExpenseCategory] ?? category

function ExpenseFlags({ expense }: { expense: Expense }) {
  return (
    <span className='flex flex-wrap gap-1'>
      <Badge tone='neutral' className='font-medium'>
        {categoryLabel(expense.category)}
      </Badge>
      {expense.renewed_until && (
        <Badge tone='success' className='font-medium'>
          Renewed to {formatDate(expense.renewed_until)}
        </Badge>
      )}
      {expense.payment_mode === 'driver_paid' && (
        <Badge tone={expense.reimbursed_at ? 'success' : 'info'} className='font-medium'>
          {expense.reimbursed_at ? 'Paid back' : 'Driver paid'}
        </Badge>
      )}
    </span>
  )
}

export function ExpensesTab({
  search,
  setSearch,
  onPageChange,
  onLimitChange,
  onClear,
  canManage,
  adding,
  onAddingChange,
}: TabProps) {
  const busOptions = useBusOptions()
  const [editing, setEditing] = useState<Expense | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState<Expense | null>(null)
  const [paying, setPaying] = useState<Expense | null>(null)
  const [history, setHistory] = useState<Expense | null>(null)
  const [sheet, setSheet] = useState<Expense | null>(null)
  if (adding && !editOpen && editing) setEditing(null)
  const remove = useMaintenanceMutation((input: { id: number; reason: string }) =>
    maintenanceApi.removeExpense(input.id, input.reason)
  )
  const reimburse = useMaintenanceMutation((id: number) => maintenanceApi.reimburseExpense(id))

  const sort = SORTS.find((item) => item === search.sort)
  const limit = search.limit ?? LIMIT
  const params: ExpenseListParams = {
    page: search.page,
    limit,
    search: search.search,
    sort,
    order: sort ? search.order : undefined,
    vehicle_id: search.vehicle_id,
    category: search.expense_category,
    payment_mode: search.payment_mode,
    reimbursed: search.reimbursed,
    from: search.from,
    to: search.to,
  }
  const expenses = useExpenses(params)
  const insights = useExpenseInsights(search.vehicle_id)
  const data = insights.data
  const rows = expenses.data?.items ?? []
  const top = data?.by_category[0]
  const payBackActive = search.payment_mode === 'driver_paid' && search.reimbursed === false

  const openEdit = (expense: Expense) => {
    setEditing(expense)
    setEditOpen(true)
  }

  const cards: Insight[] = [
    {
      key: 'entries',
      label: 'Entries this month',
      value: data?.entries_this_month ?? 0,
      hint: 'Bills logged',
      icon: CalendarDays,
      tone: 'primary',
    },
    {
      key: 'amount',
      label: 'Spent this month',
      value: rupees(data?.amount_this_month ?? 0),
      hint: 'All categories',
      icon: IndianRupee,
      tone: 'warning',
    },
    {
      key: 'top',
      label: 'Biggest category',
      value: top ? categoryLabel(top.category) : '—',
      hint: top ? `${rupees(top.amount)} this month` : 'Nothing this month',
      icon: Tags,
      tone: 'info',
      active: Boolean(top) && search.expense_category === top?.category,
      onClick: top
        ? () =>
            setSearch({
              expense_category:
                search.expense_category === top.category
                  ? undefined
                  : (top.category as ExpenseCategory),
            })
        : undefined,
    },
    {
      key: 'pay_back',
      label: 'To pay back',
      value: rupees(data?.driver_paid_pending ?? 0),
      hint: 'Paid by drivers',
      icon: HandCoins,
      tone: 'success',
      active: payBackActive,
      onClick: () =>
        setSearch(
          payBackActive
            ? { payment_mode: undefined, reimbursed: undefined }
            : { payment_mode: 'driver_paid', reimbursed: false }
        ),
    },
  ]

  const entryActions = (expense: Expense): SheetAction[] =>
    (
      [
        canManage &&
          needsPayBack(expense) && {
            key: 'pay',
            label: 'Mark as paid back',
            icon: <HandCoins className='size-4' />,
            onClick: () => setPaying(expense),
            className:
              'text-slate-500 hover:bg-info/10 hover:text-info dark:text-slate-400 dark:hover:bg-info/10 dark:hover:text-info',
          },
        expense.bill_file && {
          key: 'bill',
          label: 'Open bill',
          icon: <FileText className='size-4' />,
          onClick: () => openStoredFile(expense.bill_file),
          className:
            'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
        },
        {
          key: 'history',
          label: 'Change history',
          icon: <History className='size-4' />,
          onClick: () => setHistory(expense),
          className:
            'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
        },
        canManage && {
          key: 'edit',
          label: 'Edit',
          icon: <PenLine className='size-4' />,
          onClick: () => openEdit(expense),
          className:
            'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
        },
        canManage && {
          key: 'delete',
          label: 'Delete',
          icon: <TrashIcon className='size-4' />,
          onClick: () => setDeleting(expense),
          className:
            'text-[#D92D20] hover:bg-destructive/10 hover:text-[#B42318] dark:text-red-400 dark:hover:bg-destructive/10 dark:hover:text-red-300',
          destructive: true,
        },
      ] as (SheetAction | false | null)[]
    ).filter((action): action is SheetAction => Boolean(action))

  const actions = (expense: Expense) => (
    <div className='inline-flex flex-wrap justify-end gap-1'>
      {entryActions(expense).map((action) => (
        <Button
          key={action.key}
          variant='ghost'
          size='icon-sm'
          aria-label={`${action.label}: ${categoryLabel(expense.category)} of ${formatDate(expense.spent_on)}`}
          title={action.label}
          className={action.className}
          onClick={(event) => {
            event.stopPropagation()
            action.onClick()
          }}
        >
          {action.icon}
        </Button>
      ))}
    </div>
  )

  const onRowClick = (expense: Expense) => {
    if (isPhone()) setSheet(expense)
    else if (canManage) openEdit(expense)
  }

  const columns: Column<Expense>[] = [
    {
      key: 'spent_on',
      header: 'DATE',
      sortKey: 'spent_on',
      cell: (expense) => (
        <span className='text-[13px] leading-[18px] font-semibold text-slate-900 tabular-nums dark:text-slate-100'>
          {formatDate(expense.spent_on)}
        </span>
      ),
    },
    { key: 'bus', header: 'BUS', cell: (expense) => <BusCell vehicle={expense.vehicle} /> },
    { key: 'category', header: 'FOR', cell: (expense) => <ExpenseFlags expense={expense} /> },
    {
      key: 'amount',
      header: 'AMOUNT',
      sortKey: 'amount',
      align: 'right',
      cell: (expense) => (
        <span className='text-[13px] leading-[18px] font-semibold text-slate-900 tabular-nums dark:text-slate-100'>
          {rupees(expense.amount)}
        </span>
      ),
    },
    {
      key: 'paid_to',
      header: 'PAID TO',
      hideBelow: 'lg',
      cell: (expense) => (
        <div className='grid min-w-0'>
          <span className='truncate text-[13px] leading-[18px] text-slate-700 dark:text-slate-300'>
            {expense.vendor?.name ?? expense.paid_to ?? '—'}
          </span>
          <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            {PAYMENT_MODE[expense.payment_mode]}
          </span>
        </div>
      ),
    },
    {
      key: 'note',
      header: 'NOTE',
      hideBelow: 'xl',
      cell: (expense) => (
        <span className='line-clamp-1 text-[13px] leading-[18px] text-slate-500 dark:text-slate-400'>
          {expense.note ?? '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'ACTION',
      align: 'right',
      className: 'w-40',
      cell: actions,
    },
  ]

  const filtered = Boolean(
    search.search ||
    search.vehicle_id ||
    search.from ||
    search.to ||
    search.expense_category ||
    search.payment_mode ||
    search.reimbursed !== undefined
  )

  return (
    <>
      <InsightCards items={cards} loading={insights.isPending} />
      <Card className='overflow-hidden'>
        <ListToolbar
          summary={
            expenses.data
              ? `${expenses.data.total} ${expenses.data.total === 1 ? 'expense' : 'expenses'}`
              : ''
          }
          onClear={filtered ? onClear : undefined}
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Search paid to, note or bus'
            label='Search expenses'
            compact
            showShortcut={false}
          />
          <FilterSelect
            id='expense-category-filter'
            label='Filter by category'
            allLabel='All categories'
            value={search.expense_category}
            options={EXPENSE_CATEGORY_OPTIONS}
            onChange={(value) =>
              setSearch({ expense_category: value as MaintenanceSearch['expense_category'] })
            }
          />
          <FilterSelect
            id='expense-payment-filter'
            label='Filter by payment'
            allLabel='All payments'
            value={search.payment_mode}
            options={PAYMENT_MODE_OPTIONS}
            onChange={(value) =>
              setSearch({ payment_mode: value as MaintenanceSearch['payment_mode'] })
            }
          />
          <FilterSelect
            id='expense-reimbursed-filter'
            label='Filter by pay back'
            allLabel='Paid back or not'
            value={search.reimbursed === undefined ? undefined : String(search.reimbursed)}
            options={REIMBURSED_OPTIONS}
            onChange={(value) => setSearch({ reimbursed: value ? value === 'true' : undefined })}
          />
          <FilterSelect
            id='expense-bus-filter'
            label='Filter by bus'
            allLabel='All buses'
            value={search.vehicle_id ? String(search.vehicle_id) : undefined}
            options={busOptions}
            onChange={(value) => setSearch({ vehicle_id: value ? Number(value) : undefined })}
          />
          <DateRangeInputs from={search.from} to={search.to} onChange={setSearch} />
        </ListToolbar>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(expense) => expense.id}
          loading={expenses.isFetching}
          error={expenses.isError ? expenses.error.message : null}
          onRetry={() => expenses.refetch()}
          onRowClick={onRowClick}
          sort={{ sort, order: search.order ?? 'desc' }}
          onSortChange={(next) => setSearch(next as Partial<MaintenanceSearch>)}
          empty={{
            icon: filtered ? CircleOff : Receipt,
            title: filtered ? 'No expenses match these filters' : 'No expenses yet',
            description: filtered
              ? 'Try another bus, category or dates, or clear the filters.'
              : 'Add tyres, insurance and permit renewals, fines, tolls and other bus costs.',
            action: !filtered && canManage && (
              <Button variant='primary' size='sm' onClick={() => onAddingChange(true)}>
                <Plus className='size-3.5' />
                Add expense
              </Button>
            ),
          }}
          card={(expense) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                <div className='grid min-w-0'>
                  <span className='text-[13px] leading-[18px] font-semibold text-slate-900 tabular-nums dark:text-slate-100'>
                    {formatDate(expense.spent_on)}
                  </span>
                  <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
                    {expense.vehicle.name} · {expense.vehicle.registration_no}
                  </span>
                </div>
                <span className='text-[13px] leading-[18px] font-semibold text-slate-900 tabular-nums dark:text-slate-100'>
                  {rupees(expense.amount)}
                </span>
              </div>
              <ExpenseFlags expense={expense} />
              <span className='truncate text-xs text-muted-foreground'>
                {[
                  expense.vendor?.name ?? expense.paid_to,
                  PAYMENT_MODE[expense.payment_mode],
                  expense.bill_file ? 'Bill attached' : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
              {canManage && needsPayBack(expense) && (
                <span className='text-xs font-semibold text-primary'>Tap to mark as paid back</span>
              )}
            </div>
          )}
          pagination={{
            page: search.page,
            limit,
            total: expenses.data?.total ?? 0,
            label: 'expenses',
            onPageChange,
            onLimitChange,
          }}
        />
      </Card>
      <ExpenseFormModal
        open={adding || editOpen}
        onOpenChange={(open) => {
          if (open) return
          onAddingChange(false)
          setEditOpen(false)
        }}
        expense={editing}
        defaultVehicleId={search.vehicle_id}
      />
      <ConfirmDialog
        open={Boolean(paying)}
        onOpenChange={(open) => !open && setPaying(null)}
        title='Mark as paid back?'
        description={
          paying
            ? `${rupees(paying.amount)} for ${categoryLabel(paying.category).toLowerCase()} paid by ${paying.created_by?.name ?? 'the driver'} on ${formatDate(paying.spent_on)} has been given back.`
            : ''
        }
        confirmText='Mark as paid back'
        loading={reimburse.isPending}
        onConfirm={async () => {
          if (!paying) return
          try {
            await reimburse.mutateAsync(paying.id)
            alerts.success('Marked as paid back')
            setPaying(null)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      />
      <NoteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title='Delete this expense?'
        description={
          deleting
            ? `${formatDate(deleting.spent_on)} · ${deleting.vehicle.name} · ${categoryLabel(deleting.category)} for ${rupees(deleting.amount)}.`
            : ''
        }
        label='Reason'
        placeholder='Entered twice'
        confirmText='Delete expense'
        destructive
        onConfirm={async (reason) => {
          if (!deleting) return
          await remove.mutateAsync({ id: deleting.id, reason })
          alerts.success('Expense deleted')
          setDeleting(null)
        }}
      />
      <ActionSheet
        open={Boolean(sheet)}
        onOpenChange={(open) => !open && setSheet(null)}
        title={sheet ? `${categoryLabel(sheet.category)} of ${formatDate(sheet.spent_on)}` : ''}
        description={sheet ? `${sheet.vehicle.name} · ${rupees(sheet.amount)}` : undefined}
        actions={sheet ? entryActions(sheet) : []}
      />
      <HistoryModal
        open={Boolean(history)}
        onOpenChange={(open) => !open && setHistory(null)}
        entity='expense'
        entityId={history?.id}
        title={
          history
            ? `${categoryLabel(history.category)} of ${formatDate(history.spent_on)} · ${history.vehicle.name}`
            : ''
        }
      />
    </>
  )
}
