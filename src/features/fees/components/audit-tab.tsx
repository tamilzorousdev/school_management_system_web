import { useState } from 'react'
import { CheckCircle2, History, TriangleAlert } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { DataTable, type Column } from '@/components/common/data-table'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/lib/format'
import {
  useFeeAudit,
  useReconciliation,
  type FeeAuditAction,
  type FeeAuditEntity,
  type FeeAuditLog,
} from '../api'
import {
  AUDIT_ACTIONS,
  AUDIT_ACTION_OPTIONS,
  AUDIT_ENTITIES,
  AUDIT_ENTITY_OPTIONS,
  auditValue,
  rupees,
} from '../labels'
import type { FeesSearch } from '../search'

const LIMIT = 20

export function AuditTab({
  search,
  onChange,
  onOpenInvoice,
}: {
  search: FeesSearch
  onChange: (patch: Partial<FeesSearch>) => void
  onOpenInvoice: (invoiceId: number) => void
}) {
  const page = search.page ?? 1
  const logs = useFeeAudit({
    page,
    limit: LIMIT,
    search: search.search,
    entity: search.entity,
    action: search.action,
    from: search.from,
    to: search.to,
    sort: 'created_at',
    order: search.order ?? 'desc',
  })
  const [selected, setSelected] = useState<FeeAuditLog | null>(null)
  const filtered = Boolean(
    search.search || search.entity || search.action || search.from || search.to
  )

  useShortcut('app.refresh', () => void logs.refetch())

  const subject = (row: FeeAuditLog) => (
    <span className='grid min-w-0'>
      <span className='font-semibold'>{AUDIT_ENTITIES[row.entity]}</span>
      <span className='truncate text-xs text-muted-foreground'>{subjectHint(row)}</span>
    </span>
  )

  const columns: Column<FeeAuditLog>[] = [
    {
      key: 'when',
      header: 'When',
      sortKey: 'created_at',
      cell: (row) => <span className='tabular'>{formatDateTime(row.created_at)}</span>,
    },
    { key: 'what', header: 'What', cell: subject },
    {
      key: 'action',
      header: 'Change',
      cell: (row) => (
        <Badge tone={AUDIT_ACTIONS[row.action].tone}>{AUDIT_ACTIONS[row.action].label}</Badge>
      ),
    },
    {
      key: 'user',
      header: 'By',
      cell: (row) => row.user?.name ?? <span className='text-muted-foreground'>Automatic</span>,
    },
    {
      key: 'reason',
      header: 'Reason',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='line-clamp-2 text-muted-foreground'>{row.reason ?? '—'}</span>
      ),
    },
  ]

  return (
    <div className='grid gap-4'>
      <BalanceCheck onOpenInvoice={onOpenInvoice} />
      <Card className='overflow-hidden'>
        <div className='border-b px-4 py-3'>
          <h2 className='font-bold'>Audit log</h2>
          <p className='text-xs text-muted-foreground'>
            Every change to fee heads, plans, invoices and payments, with the values before and
            after.
          </p>
        </div>
        <ListToolbar
          summary={logs.data ? `${logs.data.total} changes` : ''}
          onClear={
            filtered
              ? () =>
                  onChange({
                    search: undefined,
                    entity: undefined,
                    action: undefined,
                    from: undefined,
                    to: undefined,
                  })
              : undefined
          }
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => onChange({ search: value || undefined })}
            placeholder='Reason or person'
            label='Search the audit log'
          />
          <FilterSelect
            id='audit-entity-filter'
            label='Filter by record'
            allLabel='All records'
            value={search.entity}
            options={AUDIT_ENTITY_OPTIONS}
            onChange={(value) => onChange({ entity: value as FeeAuditEntity | undefined })}
          />
          <FilterSelect
            id='audit-action-filter'
            label='Filter by change'
            allLabel='All changes'
            value={search.action}
            options={AUDIT_ACTION_OPTIONS}
            onChange={(value) => onChange({ action: value as FeeAuditAction | undefined })}
          />
          <label className='flex w-full items-center gap-2 text-xs text-muted-foreground sm:w-auto'>
            <span className='w-10 shrink-0 sm:w-auto'>From</span>
            <Input
              type='date'
              aria-label='From date'
              value={search.from ?? ''}
              max={search.to}
              className='h-9 sm:w-40'
              onChange={(event) => onChange({ from: event.target.value || undefined })}
            />
          </label>
          <label className='flex w-full items-center gap-2 text-xs text-muted-foreground sm:w-auto'>
            <span className='w-10 shrink-0 sm:w-auto'>To</span>
            <Input
              type='date'
              aria-label='To date'
              value={search.to ?? ''}
              min={search.from}
              className='h-9 sm:w-40'
              onChange={(event) => onChange({ to: event.target.value || undefined })}
            />
          </label>
        </ListToolbar>
        <DataTable
          rows={logs.data?.items ?? []}
          columns={columns}
          rowKey={(row) => row.id}
          loading={logs.isFetching}
          error={logs.isError ? logs.error.message : null}
          onRetry={() => logs.refetch()}
          onRowClick={setSelected}
          sort={{ sort: 'created_at', order: search.order ?? 'desc' }}
          onSortChange={(next) => onChange({ order: next.order })}
          empty={{
            icon: History,
            title: filtered ? 'No changes match' : 'No changes recorded yet',
            description: filtered
              ? 'Try other filters or clear them.'
              : 'Changes to fees are recorded here from now on.',
          }}
          pagination={
            logs.data
              ? {
                  page,
                  limit: LIMIT,
                  total: logs.data.total,
                  label: 'changes',
                  onPageChange: (next) => onChange({ page: next }),
                }
              : undefined
          }
          card={(row) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                {subject(row)}
                <Badge tone={AUDIT_ACTIONS[row.action].tone}>
                  {AUDIT_ACTIONS[row.action].label}
                </Badge>
              </div>
              <span className='text-xs text-muted-foreground'>
                {formatDateTime(row.created_at)} · {row.user?.name ?? 'Automatic'}
              </span>
              {row.reason && <span className='text-xs'>{row.reason}</span>}
            </div>
          )}
        />
      </Card>
      {selected && <AuditDetail row={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function BalanceCheck({ onOpenInvoice }: { onOpenInvoice: (invoiceId: number) => void }) {
  const check = useReconciliation()
  if (check.isPending) return <Skeleton className='h-16' />
  if (check.isError) return null
  const { invoices_checked: checked, mismatches } = check.data
  if (!mismatches.length) {
    return (
      <Card className='flex items-center gap-3 px-4 py-3'>
        <CheckCircle2 className='size-5 shrink-0 text-success' />
        <span className='text-sm'>
          <span className='font-semibold'>Balances check out.</span>{' '}
          <span className='text-muted-foreground'>
            All {checked} invoices match their payments.
          </span>
        </span>
      </Card>
    )
  }
  return (
    <Card className='grid gap-3 border-destructive/40 px-4 py-3'>
      <div className='flex items-center gap-3'>
        <TriangleAlert className='size-5 shrink-0 text-destructive' />
        <span className='text-sm'>
          <span className='font-semibold text-destructive'>
            {mismatches.length === 1
              ? '1 invoice does not match its payments.'
              : `${mismatches.length} invoices do not match their payments.`}
          </span>{' '}
          <span className='text-muted-foreground'>
            Nothing is fixed automatically. Check these with the technical team.
          </span>
        </span>
      </div>
      <ul className='grid gap-1.5'>
        {mismatches.slice(0, 10).map((row) => (
          <li key={row.invoice_id} className='flex flex-wrap items-center justify-between gap-2'>
            <span className='tabular text-sm'>
              <span className='font-mono'>{row.invoice_no}</span>
              <span className='text-muted-foreground'>
                {' '}
                · shows {rupees(row.paid)} paid, payments add up to {rupees(row.payments_total)}
              </span>
            </span>
            <Button size='sm' variant='outline' onClick={() => onOpenInvoice(row.invoice_id)}>
              Open invoice
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function AuditDetail({ row, onClose }: { row: FeeAuditLog; onClose: () => void }) {
  const changes = diff(row.before, row.after)
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`${AUDIT_ENTITIES[row.entity]}: ${AUDIT_ACTIONS[row.action].label}`}
      description={`${formatDateTime(row.created_at)} · ${row.user?.name ?? 'Automatic'}${row.reason ? ` · ${row.reason}` : ''}`}
      size='lg'
      footer={<Button onClick={onClose}>Done</Button>}
    >
      {changes.length ? (
        <div className='overflow-x-auto rounded-lg border'>
          <table className='w-full text-sm'>
            <thead className='bg-muted/40 text-left text-xs text-muted-foreground'>
              <tr>
                <th className='px-3 py-2 font-semibold'>Field</th>
                <th className='px-3 py-2 font-semibold'>Before</th>
                <th className='px-3 py-2 font-semibold'>After</th>
              </tr>
            </thead>
            <tbody className='divide-y'>
              {changes.map(([field, before, after]) => (
                <tr key={field}>
                  <td className='px-3 py-2 font-mono text-xs'>{field}</td>
                  <td className='px-3 py-2 break-all text-muted-foreground'>
                    {auditValue(before)}
                  </td>
                  <td className='px-3 py-2 font-semibold break-all'>{auditValue(after)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className='text-sm text-muted-foreground'>No field values were recorded.</p>
      )}
    </AppModal>
  )
}

function subjectHint(row: FeeAuditLog) {
  const after = row.after ?? {}
  const before = row.before ?? {}
  const pick = (key: string) => (after[key] ?? before[key]) as string | number | undefined
  if (row.entity === 'fee_payment') {
    const receipt = pick('receipt_no')
    const amount = pick('amount')
    return (
      [receipt, typeof amount === 'number' ? rupees(amount) : undefined]
        .filter(Boolean)
        .join(' · ') || `Payment #${row.entity_id}`
    )
  }
  if (row.entity === 'fee_head') return [pick('name'), pick('code')].filter(Boolean).join(' · ')
  if (row.entity === 'fee_plan') return `Class #${row.entity_id}`
  if (row.entity === 'invoice_run') {
    const created = pick('created')
    return `${pick('installment') ?? ''}${created ? ` · ${created} invoices` : ''}`
  }
  return `Invoice #${row.entity_id}`
}

function flatten(value: Record<string, unknown> | null, prefix = ''): Record<string, unknown> {
  if (!value) return {}
  return Object.entries(value).reduce<Record<string, unknown>>((acc, [key, item]) => {
    const name = prefix ? `${prefix}.${key}` : key
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      Object.assign(acc, flatten(item as Record<string, unknown>, name))
    } else {
      acc[name] = item
    }
    return acc
  }, {})
}

function diff(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
): [string, unknown, unknown][] {
  const old = flatten(before)
  const next = flatten(after)
  const keys =
    before && after ? Object.keys(next) : [...new Set([...Object.keys(old), ...Object.keys(next)])]
  return keys
    .filter((key) => JSON.stringify(old[key]) !== JSON.stringify(next[key]))
    .map((key) => [key, old[key], next[key]])
}
