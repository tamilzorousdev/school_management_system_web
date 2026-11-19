import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowRightLeft,
  Boxes,
  CircleOff,
  ClipboardX,
  FileDown,
  FileUp,
  HandHelping,
  IndianRupee,
  MoreHorizontal,
  PackageCheck,
  Plus,
  Printer,
  ShieldAlert,
  TimerOff,
  Undo2,
  Wrench,
  X,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ASSET_CONDITIONS,
  ASSET_STATUSES,
  inventoryFiles,
  useAssetInsights,
  useAssets,
  type Asset,
  type AssetStatus,
  type InventoryAccess,
} from '../api'
import {
  ASSET_CONDITION_OPTIONS,
  ASSET_STATUS_OPTIONS,
  FUNDING_OPTIONS,
  WARRANTY_OPTIONS,
  WARRANTY_STATE,
  downloadInventoryFile,
  idOrUndefined,
  openInventoryFile,
  stringId,
  wholeMoney,
} from '../labels'
import { pick, type InventorySearch, type InventorySearchPatch } from '../search'
import { AllocateModal } from './allocate-modal'
import { AssetFormModal } from './asset-form-modal'
import { AssetImportModal } from './asset-import-modal'
import { AssetStatusBadge, ConditionBadge, SelectBox } from './asset-shared'
import { PrintLabelsModal } from './labels-modal'
import {
  CategoryPicker,
  DepartmentPicker,
  LocationPicker,
  StaffPicker,
  VendorPicker,
  type PickedAsset,
} from './pickers'
import { ReturnModal } from './return-modal'
import { OpenTicketModal } from './ticket-modals'
import { TransferModal } from './transfer-modal'

const LIMIT = 20
const SORTS = ['asset_tag', 'name', 'purchase_date', 'cost', 'created_at'] as const

type Dialog =
  | { kind: 'register' }
  | { kind: 'import' }
  | { kind: 'labels'; ids: number[] }
  | { kind: 'allocate'; assets: PickedAsset[] }
  | { kind: 'return'; assets: PickedAsset[] }
  | { kind: 'transfer'; assets: PickedAsset[] }
  | { kind: 'ticket'; asset: PickedAsset }

const picked = (asset: Asset): PickedAsset => ({
  id: asset.id,
  asset_tag: asset.asset_tag,
  name: asset.name,
  status: asset.status,
})

const active = (status: AssetStatus) => status !== 'lost' && status !== 'disposed'

export function AssetsTab(props: {
  search: InventorySearch
  onChange: (patch: InventorySearchPatch) => void
  access: InventoryAccess
}) {
  const { search, onChange, access } = props
  const navigate = useNavigate()
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [selected, setSelected] = useState<Map<number, PickedAsset>>(new Map())
  const [exporting, setExporting] = useState(false)
  const status = pick(ASSET_STATUSES, search.status)
  const condition = pick(ASSET_CONDITIONS, search.condition)
  const sort = pick(SORTS, search.sort)
  const page = search.page ?? 1

  const filters = {
    search: search.search,
    status,
    condition,
    category_id: search.category_id,
    location_id: search.location_id,
    department_id: search.department_id,
    custodian_user_id: search.user_id,
    vendor_id: search.vendor_id,
    warranty: search.warranty,
    funding_source: search.funding_source,
  }
  const assets = useAssets({ ...filters, page, limit: LIMIT, sort, order: search.order })
  const exportRegister = async () => {
    setExporting(true)
    await downloadInventoryFile(
      inventoryFiles.registerExport,
      'asset-register.csv',
      inventoryFiles.registerParams(filters)
    )
    setExporting(false)
  }
  const insights = useAssetInsights()
  const rows = assets.data?.items ?? []

  useShortcut('app.refresh', () => {
    void assets.refetch()
    void insights.refetch()
  })

  const open = (asset: Asset) =>
    navigate({
      to: '/inventory/assets/$assetId',
      params: { assetId: String(asset.id) },
      search: { tab: 'details' },
    })

  const toggle = (asset: Asset) =>
    setSelected((current) => {
      const next = new Map(current)
      if (next.has(asset.id)) next.delete(asset.id)
      else next.set(asset.id, picked(asset))
      return next
    })

  const allOnPage = rows.length > 0 && rows.every((asset) => selected.has(asset.id))
  const togglePage = () =>
    setSelected((current) => {
      const next = new Map(current)
      rows.forEach((asset) =>
        allOnPage ? next.delete(asset.id) : next.set(asset.id, picked(asset))
      )
      return next
    })

  const chosen = [...selected.values()]
  const statusCard = (
    key: AssetStatus,
    label: string,
    value: number,
    icon: Insight['icon'],
    tone: Insight['tone']
  ): Insight => ({
    key,
    label,
    value,
    icon,
    tone,
    active: status === key && !search.warranty,
    onClick: () =>
      onChange(status === key ? { status: undefined } : { status: key, warranty: undefined }),
  })
  const data = insights.data
  const cards: Insight[] = [
    {
      key: 'total',
      label: 'All assets',
      value: data?.total ?? 0,
      hint: `${wholeMoney(data?.total_cost)} cost · ${wholeMoney(data?.book_value)} now`,
      icon: IndianRupee,
      tone: 'primary',
      active: !status && !search.warranty,
      onClick: () => onChange({ status: undefined, warranty: undefined }),
    },
    statusCard('in_store', 'In store', data?.in_store ?? 0, PackageCheck, 'info'),
    statusCard('allocated', 'Allocated', data?.allocated ?? 0, HandHelping, 'success'),
    statusCard('in_maintenance', 'Under maintenance', data?.in_maintenance ?? 0, Wrench, 'warning'),
    {
      key: 'warranty',
      label: 'Warranty ending soon',
      value: data?.warranty_expiring ?? 0,
      hint: 'Warranty or AMC',
      icon: ShieldAlert,
      tone: data?.warranty_expiring ? 'warning' : 'neutral',
      active: search.warranty === 'expiring',
      onClick: () =>
        onChange(
          search.warranty === 'expiring'
            ? { warranty: undefined }
            : { warranty: 'expiring', status: undefined }
        ),
    },
    {
      key: 'overdue',
      label: 'Overdue returns',
      value: data?.overdue_returns ?? 0,
      hint: 'Open in allocations',
      icon: TimerOff,
      tone: data?.overdue_returns ? 'danger' : 'neutral',
      onClick: () => navigate({ to: '/inventory', search: { tab: 'allocations', overdue: true } }),
    },
    {
      key: 'unacknowledged',
      label: 'Not acknowledged',
      value: data?.unacknowledged ?? 0,
      hint: 'Staff yet to confirm',
      icon: ClipboardX,
      tone: data?.unacknowledged ? 'warning' : 'neutral',
      onClick: () =>
        navigate({ to: '/inventory', search: { tab: 'allocations', unacknowledged: true } }),
    },
    statusCard('lost', 'Lost', data?.lost ?? 0, CircleOff, 'danger'),
  ]

  const rowMenu = (asset: Asset) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={`Actions for ${asset.asset_tag}`}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent onClick={(event) => event.stopPropagation()}>
        <DropdownMenuItem onSelect={() => void open(asset)}>
          <Boxes />
          Open
        </DropdownMenuItem>
        {access.manage && (
          <>
            <DropdownMenuSeparator />
            {asset.status === 'in_store' && (
              <DropdownMenuItem
                onSelect={() => setDialog({ kind: 'allocate', assets: [picked(asset)] })}
              >
                <HandHelping />
                Allocate
              </DropdownMenuItem>
            )}
            {asset.status === 'allocated' && (
              <DropdownMenuItem
                onSelect={() => setDialog({ kind: 'return', assets: [picked(asset)] })}
              >
                <Undo2 />
                Take back
              </DropdownMenuItem>
            )}
            {active(asset.status) && (
              <DropdownMenuItem
                onSelect={() => setDialog({ kind: 'transfer', assets: [picked(asset)] })}
              >
                <ArrowRightLeft />
                Transfer
              </DropdownMenuItem>
            )}
            {active(asset.status) && (
              <DropdownMenuItem
                onSelect={() => setDialog({ kind: 'ticket', asset: picked(asset) })}
              >
                <Wrench />
                Open repair ticket
              </DropdownMenuItem>
            )}
          </>
        )}
        <DropdownMenuItem
          onSelect={() =>
            openInventoryFile(
              inventoryFiles.labels,
              inventoryFiles.labelsParams({ asset_ids: [asset.id] })
            )
          }
        >
          <Printer />
          Print label
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const whereText = (asset: Asset) =>
    asset.current_allocation?.assignee.name ??
    asset.custodian?.name ??
    asset.location?.name ??
    asset.store?.name ??
    '—'

  const columns: Column<Asset>[] = [
    {
      key: 'select',
      header: (
        <SelectBox label='Select all on this page' checked={allOnPage} onChange={togglePage} />
      ),
      className: 'w-10',
      cell: (asset) => (
        <SelectBox
          label={`Select ${asset.asset_tag}`}
          checked={selected.has(asset.id)}
          onChange={() => toggle(asset)}
        />
      ),
    },
    {
      key: 'asset',
      header: 'Asset',
      sortKey: 'name',
      cell: (asset) => (
        <span className='grid min-w-0'>
          <span className='truncate font-bold'>{asset.name}</span>
          <span className='truncate font-mono text-[11px] text-muted-foreground'>
            {asset.asset_tag}
            {asset.serial_no ? ` · ${asset.serial_no}` : ''}
          </span>
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      hideBelow: 'lg',
      cell: (asset) => asset.category.name,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (asset) => <AssetStatusBadge status={asset.status} />,
    },
    {
      key: 'where',
      header: 'With / where',
      cell: (asset) => (
        <span className='grid min-w-0'>
          <span className='truncate'>{whereText(asset)}</span>
          {asset.current_allocation?.overdue && (
            <span className='text-xs font-semibold text-destructive'>Return overdue</span>
          )}
        </span>
      ),
    },
    {
      key: 'condition',
      header: 'Condition',
      hideBelow: 'xl',
      cell: (asset) => <ConditionBadge condition={asset.condition} />,
    },
    {
      key: 'warranty',
      header: 'Warranty',
      hideBelow: 'xl',
      cell: (asset) => (
        <Badge tone={WARRANTY_STATE[asset.warranty_state].tone}>
          {WARRANTY_STATE[asset.warranty_state].label}
        </Badge>
      ),
    },
    {
      key: 'cost',
      header: 'Cost',
      sortKey: 'cost',
      align: 'right',
      hideBelow: 'lg',
      cell: (asset) => (
        <span className='grid'>
          <span className='tabular font-semibold'>{wholeMoney(asset.cost)}</span>
          <span className='tabular text-xs text-muted-foreground'>
            {wholeMoney(asset.book_value)} now
          </span>
        </span>
      ),
    },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      className: 'w-12',
      cell: rowMenu,
    },
  ]

  const filtered = Boolean(
    search.search ||
    status ||
    condition ||
    search.category_id ||
    search.location_id ||
    search.department_id ||
    search.user_id ||
    search.vendor_id ||
    search.warranty ||
    search.funding_source
  )

  const clear = () =>
    onChange({
      search: undefined,
      status: undefined,
      condition: undefined,
      category_id: undefined,
      location_id: undefined,
      department_id: undefined,
      user_id: undefined,
      vendor_id: undefined,
      warranty: undefined,
      funding_source: undefined,
    })

  const close = () => setDialog(null)
  const bulk = (
    kind: 'allocate' | 'return' | 'transfer',
    allowed: (status: AssetStatus) => boolean
  ) => {
    const assetsForAction = chosen.filter((asset) => allowed(asset.status))
    setDialog({ kind, assets: assetsForAction })
  }

  return (
    <div className='grid gap-6'>
      <div className='flex flex-wrap items-center justify-end gap-2'>
        <Button variant='outline' loading={exporting} onClick={() => void exportRegister()}>
          <FileDown />
          Export CSV
        </Button>
        <Button
          variant='outline'
          onClick={() => setDialog({ kind: 'labels', ids: chosen.map((asset) => asset.id) })}
        >
          <Printer />
          Print labels
        </Button>
        {access.manage && (
          <>
            <Button variant='outline' onClick={() => setDialog({ kind: 'import' })}>
              <FileUp />
              Import
            </Button>
            <Button onClick={() => setDialog({ kind: 'register' })}>
              <Plus />
              Register asset
            </Button>
          </>
        )}
      </div>

      <InsightCards items={cards} loading={insights.isPending} />

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={assets.data ? `${assets.data.total} assets` : ''}
          onClear={filtered ? clear : undefined}
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => onChange({ search: value || undefined })}
            placeholder='Tag, name, serial, make or model'
            label='Search assets'
          />
          <FilterSelect
            id='assets-status'
            label='Filter by status'
            allLabel='All statuses'
            value={status}
            options={ASSET_STATUS_OPTIONS}
            onChange={(value) => onChange({ status: value as AssetStatus | undefined })}
          />
          <CategoryPicker
            id='assets-category'
            label='Category'
            kind='asset'
            allLabel='All categories'
            value={stringId(search.category_id)}
            onChange={(value) => onChange({ category_id: idOrUndefined(value) })}
          />
          <LocationPicker
            id='assets-location'
            label='Location'
            allLabel='All locations'
            value={stringId(search.location_id)}
            onChange={(value) => onChange({ location_id: idOrUndefined(value) })}
          />
          <DepartmentPicker
            id='assets-department'
            label='Department'
            allLabel='All departments'
            value={stringId(search.department_id)}
            onChange={(value) => onChange({ department_id: idOrUndefined(value) })}
          />
          <StaffPicker
            id='assets-custodian'
            label='Custodian'
            allLabel='Anyone'
            value={stringId(search.user_id)}
            onChange={(value) => onChange({ user_id: idOrUndefined(value) })}
          />
          <VendorPicker
            id='assets-vendor'
            label='Vendor'
            allLabel='All vendors'
            value={stringId(search.vendor_id)}
            onChange={(value) => onChange({ vendor_id: idOrUndefined(value) })}
          />
          <FilterSelect
            id='assets-condition'
            label='Filter by condition'
            allLabel='Any condition'
            value={condition}
            options={ASSET_CONDITION_OPTIONS}
            onChange={(value) => onChange({ condition: value as InventorySearch['condition'] })}
          />
          <FilterSelect
            id='assets-warranty'
            label='Filter by warranty'
            allLabel='Any warranty'
            value={search.warranty}
            options={WARRANTY_OPTIONS}
            onChange={(value) => onChange({ warranty: value as InventorySearch['warranty'] })}
          />
          <FilterSelect
            id='assets-funding'
            label='Filter by funding'
            allLabel='Any funding'
            value={search.funding_source}
            options={FUNDING_OPTIONS}
            onChange={(value) =>
              onChange({ funding_source: value as InventorySearch['funding_source'] })
            }
          />
        </ListToolbar>

        {chosen.length > 0 && (
          <div className='flex flex-wrap items-center gap-2 border-b bg-primary/5 px-4 py-2'>
            <span className='text-sm font-semibold'>{chosen.length} selected</span>
            <Button variant='ghost' size='sm' onClick={() => setSelected(new Map())}>
              <X />
              Clear
            </Button>
            <div className='flex flex-wrap gap-2 sm:ml-auto'>
              {access.manage && (
                <>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => bulk('allocate', (item) => item === 'in_store')}
                  >
                    <HandHelping />
                    Allocate
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => bulk('return', (item) => item === 'allocated')}
                  >
                    <Undo2 />
                    Take back
                  </Button>
                  <Button size='sm' variant='outline' onClick={() => bulk('transfer', active)}>
                    <ArrowRightLeft />
                    Transfer
                  </Button>
                </>
              )}
              <Button
                size='sm'
                variant='outline'
                onClick={() =>
                  openInventoryFile(
                    inventoryFiles.labels,
                    inventoryFiles.labelsParams({ asset_ids: chosen.map((asset) => asset.id) })
                  )
                }
              >
                <Printer />
                Labels
              </Button>
            </div>
          </div>
        )}

        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(asset) => asset.id}
          loading={assets.isFetching}
          error={assets.isError ? assets.error.message : null}
          onRetry={() => assets.refetch()}
          onRowClick={(asset) => void open(asset)}
          sort={{ sort: sort ?? 'created_at', order: search.order ?? 'desc' }}
          onSortChange={(next) => onChange({ sort: next.sort, order: next.order })}
          empty={{
            icon: filtered ? CircleOff : Boxes,
            title: filtered ? 'No assets match these filters' : 'No assets yet',
            description: filtered
              ? 'Try another search or clear the filters.'
              : 'Register assets one by one or import the existing register from Excel.',
            action: !filtered && access.manage && (
              <Button onClick={() => setDialog({ kind: 'register' })}>
                <Plus />
                Register asset
              </Button>
            ),
          }}
          card={(asset) => (
            <div className='flex items-start gap-3'>
              <span className='pt-0.5'>
                <SelectBox
                  label={`Select ${asset.asset_tag}`}
                  checked={selected.has(asset.id)}
                  onChange={() => toggle(asset)}
                />
              </span>
              <div className='grid min-w-0 flex-1 gap-1'>
                <div className='flex items-start justify-between gap-2'>
                  <span className='grid min-w-0'>
                    <span className='truncate font-bold'>{asset.name}</span>
                    <span className='truncate font-mono text-[11px] text-muted-foreground'>
                      {asset.asset_tag}
                    </span>
                  </span>
                  <AssetStatusBadge status={asset.status} />
                </div>
                <span className='truncate text-xs text-muted-foreground'>
                  {asset.category.name} · {whereText(asset)}
                </span>
                <span className='tabular text-xs text-muted-foreground'>
                  {wholeMoney(asset.cost)} cost · {wholeMoney(asset.book_value)} now
                </span>
              </div>
            </div>
          )}
          pagination={{
            page,
            limit: LIMIT,
            total: assets.data?.total ?? 0,
            label: 'assets',
            onPageChange: (next) => onChange({ page: next }),
          }}
        />
      </Card>

      <AssetFormModal
        open={dialog?.kind === 'register'}
        onOpenChange={(next) => !next && close()}
      />
      <AssetImportModal
        open={dialog?.kind === 'import'}
        onOpenChange={(next) => !next && close()}
      />
      <PrintLabelsModal
        open={dialog?.kind === 'labels'}
        onOpenChange={(next) => !next && close()}
        assetIds={dialog?.kind === 'labels' ? dialog.ids : undefined}
      />
      <AllocateModal
        open={dialog?.kind === 'allocate'}
        onOpenChange={(next) => !next && close()}
        assets={dialog?.kind === 'allocate' ? dialog.assets : undefined}
      />
      <ReturnModal
        open={dialog?.kind === 'return'}
        onOpenChange={(next) => !next && close()}
        assets={dialog?.kind === 'return' ? dialog.assets : undefined}
      />
      <TransferModal
        open={dialog?.kind === 'transfer'}
        onOpenChange={(next) => !next && close()}
        assets={dialog?.kind === 'transfer' ? dialog.assets : undefined}
      />
      <OpenTicketModal
        open={dialog?.kind === 'ticket'}
        onOpenChange={(next) => !next && close()}
        asset={dialog?.kind === 'ticket' ? dialog.asset : null}
      />
    </div>
  )
}
