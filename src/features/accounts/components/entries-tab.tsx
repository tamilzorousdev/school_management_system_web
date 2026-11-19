import { useState } from 'react'
import {
  Ban,
  CalendarDays,
  Check,
  CircleOff,
  Clock,
  FileText,
  IndianRupee,
  Paperclip,
  Pencil,
  Plus,
  Printer,
  Receipt,
  Tags,
  Trash2,
  X,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useMe } from '@/features/auth/api'
import { isPhone, openStoredFile } from '@/features/maintenance/helpers'
import {
  ActionSheet,
  DateRangeInputs,
  NoteDialog,
  type SheetAction,
} from '@/features/maintenance/components/shared'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import {
  accountsApi,
  useAccountCategories,
  useAccountEntries,
  useAccountInsights,
  useAccountsMutation,
  type AccountEntry,
  type AccountKind,
  type EntryListParams,
} from '../api'
import {
  openVoucher,
  PAYMENT_MODE,
  PAYMENT_MODE_OPTIONS,
  rupees,
  STATUS,
  STATUS_OPTIONS,
} from '../labels'
import type { AccountsSearch, AccountsTabProps } from '../search'
import { EntryFormModal } from './entry-form-modal'

const LIMIT = 20
const SORTS = ['entry_date', 'amount', 'entry_no'] as const

const COPY: Record<AccountKind, { noun: string; plural: string; party: string; empty: string }> = {
  expense: {
    noun: 'expense',
    plural: 'expenses',
    party: 'Paid to',
    empty: 'Add electricity, stationery, repairs, rent and other school bills.',
  },
  income: {
    noun: 'income',
    plural: 'income entries',
    party: 'Received from',
    empty: 'Add donations, uniform and book sales, hall rent and other money the school received.',
  },
}

function StatusCell({ entry }: { entry: AccountEntry }) {
  const status = STATUS[entry.status]
  return (
    <span className='grid justify-items-start gap-0.5'>
      <Badge tone={status.tone}>{status.label}</Badge>
      {entry.decision_note && entry.status !== 'approved' && (
        <span className='line-clamp-1 text-xs text-muted-foreground'>{entry.decision_note}</span>
      )}
    </span>
  )
}

export function EntriesTab({
  kind,
  search,
  setSearch,
  onPageChange,
  onClear,
  canManage,
  canApprove,
  adding,
  onAddingChange,
}: AccountsTabProps & { kind: AccountKind }) {
  const copy = COPY[kind]
  const meId = useMe().data?.id
  const categories = useAccountCategories(kind, true)
  const [editing, setEditing] = useState<AccountEntry | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [approving, setApproving] = useState<AccountEntry | null>(null)
  const [rejecting, setRejecting] = useState<AccountEntry | null>(null)
  const [voiding, setVoiding] = useState<AccountEntry | null>(null)
  const [deleting, setDeleting] = useState<AccountEntry | null>(null)
  const [sheet, setSheet] = useState<AccountEntry | null>(null)
  if (adding && !editOpen && editing) setEditing(null)

  const approve = useAccountsMutation((id: number) => accountsApi.approve(id))
  const reject = useAccountsMutation((input: { id: number; note: string }) =>
    accountsApi.reject(input.id, input.note)
  )
  const voidEntry = useAccountsMutation((input: { id: number; reason: string }) =>
    accountsApi.void(input.id, input.reason)
  )
  const remove = useAccountsMutation((id: number) => accountsApi.remove(id))

  const sort = SORTS.find((item) => item === search.sort)
  const params: EntryListParams = {
    page: search.page,
    limit: LIMIT,
    kind,
    search: search.search,
    status: search.status,
    category_id: search.category_id,
    payment_mode: search.payment_mode,
    from: search.from,
    to: search.to,
    sort,
    order: sort ? search.order : undefined,
  }
  const entries = useAccountEntries(params)
  const insights = useAccountInsights()
  const data = insights.data
  const rows = entries.data?.items ?? []
  const byCategory =
    (kind === 'expense' ? data?.expense_by_category : data?.income_by_category) ?? []
  const top = byCategory[0]
  const topId = top ? categories.data?.find((item) => item.name === top.category)?.id : undefined
  const pending = (kind === 'expense' ? data?.pending_expense : data?.pending_income) ?? 0

  const openEdit = (entry: AccountEntry) => {
    setEditing(entry)
    setEditOpen(true)
  }

  const cards: Insight[] = [
    {
      key: 'month',
      label: kind === 'expense' ? 'Spent this month' : 'Received this month',
      value: rupees((kind === 'expense' ? data?.expense_this_month : data?.income_this_month) ?? 0),
      hint: 'Approved entries',
      icon: IndianRupee,
      tone: kind === 'expense' ? 'warning' : 'success',
    },
    {
      key: 'pending',
      label: 'Waiting for approval',
      value: pending,
      hint: canApprove ? 'Tap to review' : 'Not counted until approved',
      icon: Clock,
      tone: 'info',
      active: search.status === 'pending',
      onClick: () => setSearch({ status: search.status === 'pending' ? undefined : 'pending' }),
    },
    {
      key: 'top',
      label: 'Biggest category',
      value: top?.category ?? '—',
      hint: top ? `${rupees(top.amount)} this month` : 'Nothing this month',
      icon: Tags,
      tone: 'primary',
      active: Boolean(topId) && search.category_id === topId,
      onClick: topId
        ? () => setSearch({ category_id: search.category_id === topId ? undefined : topId })
        : undefined,
    },
    {
      key: 'entries',
      label: 'Entries listed',
      value: entries.data?.total ?? 0,
      hint: 'For these filters',
      icon: CalendarDays,
      tone: 'primary',
    },
  ]

  const entryActions = (entry: AccountEntry): SheetAction[] =>
    (
      [
        canApprove &&
          entry.status === 'pending' && {
            key: 'approve',
            label: 'Approve',
            icon: <Check />,
            onClick: () => setApproving(entry),
            className: 'text-success hover:bg-success/10',
          },
        canApprove &&
          entry.status === 'pending' && {
            key: 'reject',
            label: 'Reject',
            icon: <X />,
            onClick: () => setRejecting(entry),
            className: 'text-destructive hover:bg-destructive/10',
          },
        {
          key: 'voucher',
          label: kind === 'expense' ? 'Payment voucher' : 'Income receipt',
          icon: <Printer />,
          onClick: () => openVoucher(entry.id),
        },
        entry.file && {
          key: 'bill',
          label: 'Open attachment',
          icon: <Paperclip />,
          onClick: () => openStoredFile(entry.file),
        },
        canManage &&
          entry.can_edit && {
            key: 'edit',
            label: 'Edit',
            icon: <Pencil />,
            onClick: () => openEdit(entry),
          },
        canApprove &&
          entry.status === 'approved' && {
            key: 'void',
            label: 'Void',
            icon: <Ban />,
            onClick: () => setVoiding(entry),
            className: 'text-destructive hover:bg-destructive/10',
            destructive: true,
          },
        canManage &&
          (entry.status === 'pending' || entry.status === 'rejected') &&
          (canApprove || entry.created_by?.id === meId) && {
            key: 'delete',
            label: 'Delete',
            icon: <Trash2 />,
            onClick: () => setDeleting(entry),
            className: 'text-destructive hover:bg-destructive/10',
            destructive: true,
          },
      ] as (SheetAction | false | null)[]
    ).filter((action): action is SheetAction => Boolean(action))

  const actions = (entry: AccountEntry) => (
    <div className='inline-flex flex-wrap justify-end gap-1'>
      {entryActions(entry).map((action) => (
        <Button
          key={action.key}
          variant='ghost'
          size='icon-sm'
          aria-label={`${action.label}: ${entry.entry_no}`}
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

  const onRowClick = (entry: AccountEntry) => {
    if (isPhone()) setSheet(entry)
    else if (canManage && entry.can_edit) openEdit(entry)
    else openVoucher(entry.id)
  }

  const columns: Column<AccountEntry>[] = [
    {
      key: 'entry_date',
      header: 'Date',
      sortKey: 'entry_date',
      cell: (entry) => (
        <span className='grid'>
          <span className='tabular font-semibold'>{formatDate(entry.entry_date)}</span>
          <span className='font-mono text-xs whitespace-nowrap text-muted-foreground'>
            {entry.entry_no}
          </span>
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      cell: (entry) => (
        <span className='grid min-w-0'>
          <span className='truncate font-semibold'>{entry.category.name}</span>
          {entry.note && (
            <span className='line-clamp-1 text-xs text-muted-foreground'>{entry.note}</span>
          )}
        </span>
      ),
    },
    {
      key: 'party',
      header: copy.party,
      hideBelow: 'lg',
      cell: (entry) => (
        <span className='grid min-w-0'>
          <span className='truncate'>{entry.party ?? '—'}</span>
          <span className='truncate text-xs text-muted-foreground'>
            {[PAYMENT_MODE[entry.payment_mode], entry.reference].filter(Boolean).join(' · ')}
          </span>
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortKey: 'amount',
      align: 'right',
      cell: (entry) => (
        <span
          className={
            entry.status === 'void' || entry.status === 'rejected'
              ? 'tabular font-semibold text-muted-foreground line-through'
              : 'tabular font-semibold'
          }
        >
          {rupees(entry.amount)}
        </span>
      ),
    },
    { key: 'status', header: 'Status', cell: (entry) => <StatusCell entry={entry} /> },
    {
      key: 'by',
      header: 'Added by',
      hideBelow: 'xl',
      cell: (entry) => (
        <span className='grid min-w-0 text-xs'>
          <span className='truncate'>{entry.created_by?.name ?? '—'}</span>
          {entry.decided_by && entry.status !== 'pending' && (
            <span className='truncate text-muted-foreground'>
              {STATUS[entry.status].label} by {entry.decided_by.name}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      className: 'w-44',
      cell: actions,
    },
  ]

  const filtered = Boolean(
    search.search ||
    search.status ||
    search.category_id ||
    search.payment_mode ||
    search.from ||
    search.to
  )

  const dialogLine = (entry: AccountEntry | null) =>
    entry
      ? `${entry.entry_no} · ${entry.category.name} · ${rupees(entry.amount)} on ${formatDate(entry.entry_date)}${entry.party ? ` · ${entry.party}` : ''}`
      : ''

  return (
    <>
      <InsightCards items={cards} loading={insights.isPending} />
      <Card className='overflow-hidden'>
        <ListToolbar
          summary={entries.data ? `${entries.data.total} ${copy.plural}` : ''}
          onClear={filtered ? onClear : undefined}
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Entry no., party, reference or note'
            label={`Search ${copy.plural}`}
          />
          <FilterSelect
            id={`${kind}-status-filter`}
            label='Filter by status'
            allLabel='All statuses'
            value={search.status}
            options={STATUS_OPTIONS}
            onChange={(value) => setSearch({ status: value as AccountsSearch['status'] })}
          />
          <FilterSelect
            id={`${kind}-category-filter`}
            label='Filter by category'
            allLabel='All categories'
            value={search.category_id ? String(search.category_id) : undefined}
            options={(categories.data ?? []).map((item) => ({
              value: String(item.id),
              label: item.is_active ? item.name : `${item.name} (off)`,
            }))}
            onChange={(value) => setSearch({ category_id: value ? Number(value) : undefined })}
          />
          <FilterSelect
            id={`${kind}-mode-filter`}
            label='Filter by mode'
            allLabel='All modes'
            value={search.payment_mode}
            options={PAYMENT_MODE_OPTIONS}
            onChange={(value) =>
              setSearch({ payment_mode: value as AccountsSearch['payment_mode'] })
            }
          />
          <DateRangeInputs from={search.from} to={search.to} onChange={setSearch} />
        </ListToolbar>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(entry) => entry.id}
          loading={entries.isFetching}
          error={entries.isError ? entries.error.message : null}
          onRetry={() => entries.refetch()}
          onRowClick={onRowClick}
          sort={{ sort, order: search.order ?? 'desc' }}
          onSortChange={(next) => setSearch(next as Partial<AccountsSearch>)}
          empty={{
            icon: filtered ? CircleOff : kind === 'expense' ? Receipt : FileText,
            title: filtered ? `No ${copy.plural} match these filters` : `No ${copy.plural} yet`,
            description: filtered ? 'Try other filters or clear them.' : copy.empty,
            action: !filtered && canManage && (
              <Button onClick={() => onAddingChange(true)}>
                <Plus />
                Add {copy.noun}
              </Button>
            ),
          }}
          card={(entry) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                <div className='grid min-w-0'>
                  <span className='font-bold'>{entry.category.name}</span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {formatDate(entry.entry_date)} · {entry.entry_no}
                  </span>
                </div>
                <span className='tabular font-bold'>{rupees(entry.amount)}</span>
              </div>
              <StatusCell entry={entry} />
              <span className='truncate text-xs text-muted-foreground'>
                {[
                  entry.party,
                  PAYMENT_MODE[entry.payment_mode],
                  entry.file ? 'Bill attached' : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: entries.data?.total ?? 0,
            label: copy.plural,
            onPageChange,
          }}
        />
      </Card>
      <EntryFormModal
        open={adding || editOpen}
        onOpenChange={(open) => {
          if (open) return
          onAddingChange(false)
          setEditOpen(false)
        }}
        kind={kind}
        entry={editing}
        canApprove={canApprove}
      />
      <ConfirmDialog
        open={Boolean(approving)}
        onOpenChange={(open) => !open && setApproving(null)}
        title={`Approve this ${copy.noun}?`}
        description={`${dialogLine(approving)}. It will be counted in the reports and can no longer be edited.`}
        confirmText='Approve'
        loading={approve.isPending}
        onConfirm={async () => {
          if (!approving) return
          try {
            await approve.mutateAsync(approving.id)
            alerts.success(`${approving.entry_no} approved`)
            setApproving(null)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      />
      <NoteDialog
        open={Boolean(rejecting)}
        onOpenChange={(open) => !open && setRejecting(null)}
        title={`Reject this ${copy.noun}?`}
        description={dialogLine(rejecting)}
        label='Reason (shown to who added it)'
        placeholder='Bill is not attached'
        confirmText='Reject'
        destructive
        onConfirm={async (note) => {
          if (!rejecting) return
          await reject.mutateAsync({ id: rejecting.id, note })
          alerts.success(`${rejecting.entry_no} rejected`)
          setRejecting(null)
        }}
      />
      <NoteDialog
        open={Boolean(voiding)}
        onOpenChange={(open) => !open && setVoiding(null)}
        title={`Void this ${copy.noun}?`}
        description={`${dialogLine(voiding)}. It stays on record marked void and leaves the reports. Add a new entry if the amount was wrong.`}
        label='Reason'
        placeholder='Entered twice'
        confirmText='Void entry'
        destructive
        required
        onConfirm={async (reason) => {
          if (!voiding) return
          await voidEntry.mutateAsync({ id: voiding.id, reason })
          alerts.success(`${voiding.entry_no} voided`)
          setVoiding(null)
        }}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete this ${copy.noun}?`}
        description={dialogLine(deleting)}
        confirmText='Delete'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return
          try {
            await remove.mutateAsync(deleting.id)
            alerts.success(`${deleting.entry_no} deleted`)
            setDeleting(null)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      />
      <ActionSheet
        open={Boolean(sheet)}
        onOpenChange={(open) => !open && setSheet(null)}
        title={sheet ? `${sheet.category.name} · ${sheet.entry_no}` : ''}
        description={
          sheet ? `${formatDate(sheet.entry_date)} · ${rupees(sheet.amount)}` : undefined
        }
        actions={sheet ? entryActions(sheet) : []}
      />
    </>
  )
}
