import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  HelpCircle,
  Lock,
  MapPinOff,
  PackageSearch,
  Save,
  ScanLine,
  SearchX,
  ShieldAlert,
} from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { PageTabs } from '@/components/common/page-tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  inventoryApi,
  useAuditItems,
  useCountSheet,
  useInventoryMutation,
  type Audit,
  type AuditItem,
  type AuditItemFinding,
  type AuditScanResult,
  type CountLine,
  type InventoryAccess,
} from '../api'
import { AUDIT_FINDING, qty } from '../labels'
import type { InventorySearch, InventorySearchPatch } from '../search'
import { auditScope } from './audit-scope'
import { LocationPicker, ScanInput } from './pickers'

const LIMIT = 20

const FINDING_TABS: { value: AuditItemFinding | 'all'; label: string }[] = [
  { value: 'all', label: 'All scanned' },
  { value: 'found', label: 'Found' },
  { value: 'misplaced', label: 'Misplaced' },
  { value: 'not_available', label: 'Not available' },
  { value: 'unknown', label: 'Unknown' },
  { value: 'missing', label: 'Missing' },
]

export function AuditHeader({
  audit,
  canClose,
  onBack,
  onClose,
}: {
  audit: Audit
  canClose: boolean
  onBack: () => void
  onClose: () => void
}) {
  const open = audit.status === 'open'
  return (
    <div className='grid gap-3'>
      <button
        type='button'
        onClick={onBack}
        className='inline-flex items-center gap-1.5 justify-self-start text-sm font-semibold text-muted-foreground hover:text-foreground'
      >
        <ArrowLeft className='size-4' />
        All audits
      </button>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='grid min-w-0 gap-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <h2 className='text-xl font-extrabold tracking-tight'>{audit.name}</h2>
            <Badge tone={open ? 'warning' : 'neutral'} dot>
              {open ? 'Open' : 'Closed'}
            </Badge>
            <Badge tone='info'>
              {audit.kind === 'asset' ? 'Asset verification' : 'Stock count'}
            </Badge>
          </div>
          <p className='text-sm text-muted-foreground'>
            {auditScope(audit)} · started {formatDateTime(audit.created_at)}
            {audit.started_by ? ` by ${audit.started_by}` : ''}
            {audit.closed_at ? ` · closed ${formatDateTime(audit.closed_at)}` : ''}
          </p>
          {audit.notes && <p className='text-sm'>{audit.notes}</p>}
        </div>
        {open && canClose && (
          <Button variant='outline' onClick={onClose}>
            <Lock />
            Close audit
          </Button>
        )}
      </div>
    </div>
  )
}

export function CloseAuditModal({
  audit,
  open,
  onOpenChange,
}: {
  audit: Audit
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [apply, setApply] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const close = useInventoryMutation(() =>
    inventoryApi.closeAudit(
      audit.id,
      audit.kind === 'asset' ? { mark_missing_lost: apply } : { post_adjustments: apply }
    )
  )
  const asset = audit.kind === 'asset'

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Close this audit?'
      description={
        asset
          ? `${audit.missing} of ${audit.expected} assets were not scanned.`
          : `${audit.differences} items differ from the system and ${audit.missing} are not counted.`
      }
      size='sm'
      footer={
        <div className='flex w-full flex-wrap justify-end gap-2'>
          <Button variant='outline' disabled={close.isPending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            loading={close.isPending}
            onClick={async () => {
              setError(null)
              try {
                await close.mutateAsync(undefined)
                alerts.success('Audit closed')
                onOpenChange(false)
              } catch (caught) {
                setError(toApiError(caught).message)
              }
            }}
          >
            Close audit
          </Button>
        </div>
      }
    >
      <div className='grid gap-3'>
        <div className='flex items-center justify-between gap-4 rounded-lg border bg-muted/40 px-4 py-3'>
          <div className='grid gap-0.5'>
            <label htmlFor='audit-close-apply' className='text-sm font-semibold'>
              {asset ? 'Mark missing assets as lost' : 'Post the differences to stock'}
            </label>
            <p className='text-xs text-muted-foreground'>
              {asset
                ? 'Assets not scanned are marked lost and their allocations closed.'
                : 'Each difference becomes a count correction in the stock ledger.'}
            </p>
          </div>
          <Switch id='audit-close-apply' checked={apply} onCheckedChange={setApply} />
        </div>
        {error && (
          <p role='alert' className='text-sm font-medium text-destructive'>
            {error}
          </p>
        )}
      </div>
    </AppModal>
  )
}

export function AssetAuditView({
  audit,
  search,
  onChange,
  access,
}: {
  audit: Audit
  search: InventorySearch
  onChange: (patch: InventorySearchPatch) => void
  access: InventoryAccess
}) {
  const [foundIn, setFoundIn] = useState<string | undefined>()
  const [results, setResults] = useState<(AuditScanResult & { key: number; code: string })[]>([])
  const [scanError, setScanError] = useState<string | null>(null)
  const scan = useInventoryMutation((code: string) =>
    inventoryApi.scan(audit.id, {
      code,
      location_id: !audit.location && foundIn ? Number(foundIn) : undefined,
    })
  )
  const finding = search.finding
  const page = search.page ?? 1
  const items = useAuditItems(audit.id, { page, limit: LIMIT, finding })
  const canScan = audit.status === 'open' && access.audit

  const onScan = async (code: string) => {
    setScanError(null)
    try {
      const result = await scan.mutateAsync(code)
      setResults((previous) => [{ ...result, key: Date.now(), code }, ...previous].slice(0, 8))
    } catch (caught) {
      setScanError(toApiError(caught).message)
    }
  }

  const setFinding = (value: AuditItemFinding | undefined) =>
    onChange({ finding: value, page: undefined })

  const cards: Insight[] = [
    {
      key: 'checked',
      label: 'Scanned',
      value: `${audit.checked}/${audit.expected}`,
      hint: 'Expected in this audit',
      icon: ScanLine,
      tone: 'primary',
      active: !finding,
      onClick: () => setFinding(undefined),
    },
    {
      key: 'found',
      label: 'Found in place',
      value: audit.found,
      icon: CheckCircle2,
      tone: 'success',
      active: finding === 'found',
      onClick: () => setFinding(finding === 'found' ? undefined : 'found'),
    },
    {
      key: 'misplaced',
      label: 'Misplaced',
      value: audit.misplaced,
      hint: `${audit.not_available} not available · ${audit.unknown} unknown`,
      icon: MapPinOff,
      tone: 'warning',
      active: finding === 'misplaced',
      onClick: () => setFinding(finding === 'misplaced' ? undefined : 'misplaced'),
    },
    {
      key: 'missing',
      label: 'Missing',
      value: audit.missing,
      hint: 'Expected, not scanned yet',
      icon: ShieldAlert,
      tone: 'danger',
      active: finding === 'missing',
      onClick: () => setFinding(finding === 'missing' ? undefined : 'missing'),
    },
  ]

  const columns: Column<AuditItem>[] = [
    {
      key: 'asset',
      header: 'Asset',
      cell: (item) => <AuditAssetCell item={item} />,
    },
    {
      key: 'finding',
      header: 'Finding',
      cell: (item) => <FindingBadge finding={item.finding} />,
    },
    {
      key: 'where',
      header: 'Where',
      hideBelow: 'lg',
      cell: (item) => (
        <span className='grid text-xs'>
          <span>{item.found_location ? `Found in ${item.found_location.name}` : '—'}</span>
          {item.asset?.location && (
            <span className='text-muted-foreground'>Belongs in {item.asset.location.name}</span>
          )}
        </span>
      ),
    },
    {
      key: 'scanned',
      header: 'Scanned',
      hideBelow: 'xl',
      cell: (item) => (
        <span className='text-muted-foreground'>
          {item.scanned_at ? formatDateTime(item.scanned_at) : 'Not scanned'}
        </span>
      ),
    },
  ]

  return (
    <div className='grid gap-4'>
      <InsightCards items={cards} />
      {canScan && (
        <Card className='grid gap-3 p-4'>
          <div className='grid gap-1'>
            <h3 className='font-bold'>Scan assets where they stand</h3>
            <p className='text-xs text-muted-foreground'>
              Keep the cursor in the box and scan tag after tag; each one is checked at once.
            </p>
          </div>
          <div className='flex flex-col gap-2 sm:flex-row'>
            <ScanInput
              id='audit-scan'
              label='Scan an asset tag'
              loading={scan.isPending}
              onSubmit={onScan}
            />
            {!audit.location && (
              <LocationPicker
                id='audit-found-in'
                label='Found in'
                allLabel='Found in: not given'
                value={foundIn}
                onChange={(value) => setFoundIn(value)}
                className='sm:w-64'
              />
            )}
          </div>
          {scanError && (
            <p role='alert' className='text-sm font-medium text-destructive'>
              {scanError}
            </p>
          )}
          {results.length > 0 && (
            <ul className='grid gap-1.5'>
              {results.map((result) => (
                <li
                  key={result.key}
                  className={cn(
                    'flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm',
                    result.finding === 'found' && 'border-success/30 bg-success/5',
                    result.finding !== 'found' && 'border-warning/30 bg-warning/5'
                  )}
                >
                  <FindingBadge finding={result.finding} />
                  <span className='font-mono text-xs'>
                    {result.asset?.asset_tag ?? result.code}
                  </span>
                  <span className='min-w-0 flex-1 truncate font-semibold'>
                    {result.asset?.name ?? ''}
                  </span>
                  <span className='w-full text-xs text-muted-foreground sm:w-auto'>
                    {result.repeated ? 'Already scanned · ' : ''}
                    {result.message}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
      <PageTabs
        label='Audit findings'
        value={finding ?? 'all'}
        onChange={(value) => setFinding(value === 'all' ? undefined : value)}
        tabs={FINDING_TABS.map((tab) => ({
          ...tab,
          count:
            tab.value === 'all'
              ? audit.checked
              : tab.value === 'missing'
                ? audit.missing
                : audit[tab.value],
        }))}
      />
      <Card className='overflow-hidden'>
        <DataTable
          rows={items.data?.items ?? []}
          columns={columns}
          rowKey={(item) => `${item.id}-${item.code}`}
          loading={items.isFetching}
          error={items.isError ? items.error.message : null}
          onRetry={() => items.refetch()}
          empty={{
            icon: finding === 'missing' ? CheckCircle2 : PackageSearch,
            title: finding === 'missing' ? 'Nothing missing' : 'Nothing here yet',
            description:
              finding === 'missing'
                ? 'Every expected asset has been scanned.'
                : 'Scanned assets show up here.',
          }}
          card={(item) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                <AuditAssetCell item={item} />
                <FindingBadge finding={item.finding} />
              </div>
              {item.found_location && (
                <span className='text-xs text-muted-foreground'>
                  Found in {item.found_location.name}
                </span>
              )}
            </div>
          )}
          pagination={
            items.data
              ? {
                  page,
                  limit: LIMIT,
                  total: items.data.total,
                  label: 'assets',
                  onPageChange: (next) => onChange({ page: next }),
                }
              : undefined
          }
        />
      </Card>
    </div>
  )
}

function FindingBadge({ finding }: { finding: AuditItemFinding }) {
  const tag = AUDIT_FINDING[finding]
  return (
    <Badge tone={tag.tone} className='shrink-0'>
      {tag.label}
    </Badge>
  )
}

function AuditAssetCell({ item }: { item: AuditItem }) {
  if (!item.asset) {
    return (
      <span className='grid min-w-0'>
        <span className='flex items-center gap-1 font-semibold text-muted-foreground'>
          <HelpCircle className='size-3.5' />
          Not in the register
        </span>
        <span className='font-mono text-[11px] text-muted-foreground'>{item.code}</span>
      </span>
    )
  }
  return (
    <span className='grid min-w-0'>
      <Link
        to='/inventory/assets/$assetId'
        params={{ assetId: String(item.asset.id) }}
        search={{ tab: 'details' }}
        onClick={(event) => event.stopPropagation()}
        className='truncate font-semibold hover:underline'
      >
        {item.asset.name}
      </Link>
      <span className='font-mono text-[11px] text-muted-foreground'>{item.asset.asset_tag}</span>
    </span>
  )
}

export function StockCountView({ audit, access }: { audit: Audit; access: InventoryAccess }) {
  const sheet = useCountSheet(audit.id)
  const [draft, setDraft] = useState<Record<number, string>>({})
  const [error, setError] = useState<string | null>(null)
  const save = useInventoryMutation((lines: { item_id: number; counted_quantity: number }[]) =>
    inventoryApi.saveCount(audit.id, lines)
  )
  const editable = audit.status === 'open' && access.audit
  const rows = sheet.data ?? []

  const valueOf = (line: CountLine) =>
    draft[line.item.id] ?? (line.counted_quantity === null ? '' : String(line.counted_quantity))

  const changed = rows.filter((line) => {
    const text = draft[line.item.id]
    if (text === undefined) return false
    const current = line.counted_quantity === null ? '' : String(line.counted_quantity)
    return text.trim() !== current
  })

  const invalid = changed.filter((line) => {
    const text = draft[line.item.id].trim()
    return text === '' || !Number.isFinite(Number(text)) || Number(text) < 0
  })

  const submit = async () => {
    setError(null)
    if (invalid.length) {
      setError(`Enter a count of 0 or more for ${invalid[0].item.name}`)
      return
    }
    try {
      await save.mutateAsync(
        changed.map((line) => ({
          item_id: line.item.id,
          counted_quantity: Number(draft[line.item.id].trim()),
        }))
      )
      setDraft({})
      alerts.success(`${changed.length} counts saved`)
    } catch (caught) {
      setError(toApiError(caught).message)
    }
  }

  const difference = (line: CountLine) => {
    const text = valueOf(line).trim()
    if (text === '' || !Number.isFinite(Number(text))) return null
    return Math.round((Number(text) - line.system_quantity) * 100) / 100
  }

  const countInput = (line: CountLine) =>
    editable ? (
      <Input
        inputMode='decimal'
        aria-label={`Counted ${line.item.name}`}
        value={valueOf(line)}
        placeholder='Count'
        className='tabular h-8 w-28 text-right'
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => setDraft({ ...draft, [line.item.id]: event.target.value })}
      />
    ) : (
      <span className='tabular'>{qty(line.counted_quantity, line.unit)}</span>
    )

  const differenceText = (line: CountLine) => {
    const value = difference(line)
    if (value === null) return <span className='text-muted-foreground'>Not counted</span>
    return (
      <span
        className={cn(
          'tabular font-bold',
          value === 0 ? 'text-success' : value < 0 ? 'text-destructive' : 'text-warning'
        )}
      >
        {value > 0 ? '+' : ''}
        {qty(value, line.unit)}
      </span>
    )
  }

  const columns: Column<CountLine>[] = [
    {
      key: 'item',
      header: 'Item',
      cell: (line) => (
        <span className='grid min-w-0'>
          <span className='truncate font-semibold'>{line.item.name}</span>
          {line.note && <span className='truncate text-xs text-muted-foreground'>{line.note}</span>}
        </span>
      ),
    },
    {
      key: 'system',
      header: 'In the system',
      align: 'right',
      cell: (line) => <span className='tabular'>{qty(line.system_quantity, line.unit)}</span>,
    },
    { key: 'counted', header: 'Counted', align: 'right', cell: countInput },
    { key: 'difference', header: 'Difference', align: 'right', cell: differenceText },
  ]

  const insights: Insight[] = [
    {
      key: 'counted',
      label: 'Counted',
      value: `${audit.checked}/${audit.expected}`,
      icon: ClipboardCheck,
      tone: 'primary',
    },
    {
      key: 'differences',
      label: 'Differences',
      value: audit.differences,
      icon: ShieldAlert,
      tone: audit.differences ? 'warning' : 'success',
    },
    {
      key: 'missing',
      label: 'Not counted yet',
      value: audit.missing,
      icon: SearchX,
      tone: audit.missing ? 'danger' : 'success',
    },
  ]

  return (
    <div className='grid gap-4'>
      <InsightCards items={insights} />
      <Card className='overflow-hidden'>
        <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
          <p className='text-xs text-muted-foreground'>
            {editable
              ? 'Type what is on the shelf. Save as often as you like; close the audit when done.'
              : 'This count sheet is read-only.'}
          </p>
          {editable && (
            <Button
              size='sm'
              disabled={!changed.length}
              loading={save.isPending}
              onClick={() => void submit()}
            >
              <Save />
              Save {changed.length ? `${changed.length} ` : ''}counts
            </Button>
          )}
        </div>
        {error && (
          <p role='alert' className='border-b px-4 py-2 text-sm font-medium text-destructive'>
            {error}
          </p>
        )}
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(line) => line.id}
          loading={sheet.isFetching}
          error={sheet.isError ? sheet.error.message : null}
          onRetry={() => sheet.refetch()}
          empty={{
            icon: PackageSearch,
            title: 'No items in this store',
            description: 'Receive stock into the store first.',
          }}
          card={(line) => (
            <div className='grid gap-2'>
              <div className='flex items-start justify-between gap-2'>
                <span className='truncate font-semibold'>{line.item.name}</span>
                {differenceText(line)}
              </div>
              <div className='flex items-center justify-between gap-2 text-xs text-muted-foreground'>
                <span>System: {qty(line.system_quantity, line.unit)}</span>
                {countInput(line)}
              </div>
            </div>
          )}
        />
      </Card>
    </div>
  )
}
