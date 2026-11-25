import { useState, type ReactNode } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  CalendarClock,
  CircleOff,
  ClipboardCheck,
  ClipboardList,
  Gavel,
  Layers,
  MoreHorizontal,
  Pencil,
  Plus,
  Sofa,
  Trash2,
  Wrench,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { DatePicker } from '@/components/common/date-picker'
import { EmptyState } from '@/components/common/display'
import { FilterSelect, ListToolbar } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { can, useMe } from '@/features/auth/api'
import { useDebouncedValue } from '@/hooks/use-debounce'
import { alerts } from '@/lib/alerts'
import { formatDate, formatDateTime } from '@/lib/format'
import { useHostelMutation, useHostels } from '../api'
import {
  roomsApi,
  useAssets,
  useInspections,
  useInspectionsDue,
  type AssetCondition,
  type Inspection,
  type InspectionDue,
  type InspectionResult,
  type RoomAsset,
} from '../api-rooms'
import {
  ASSET_CONDITION,
  INSPECTION_RESULT,
  placeLine,
  scoreTone,
} from '../components/asset-labels'
import { AddAssetModal, ApplyAssetsModal, EditAssetModal } from '../components/asset-modals'
import { RoomSelect } from '../components/asset-room-select'
import { HostelLifeTabs } from '../components/hostel-life-tabs'
import { InspectionFormModal, type InspectionDefaults } from '../components/inspection-form-modal'
import { InspectionSheet } from '../components/inspection-sheet'
import { intInRange } from '../components/setup-helpers'
import { HostelSelect } from '../components/pickers'
import { toneOptions } from '../labels'
import type { InspectionsSearch } from '../search-life'

const route = getRouteApi('/_app/hostel/inspections')
const LIMIT = 20

type Tab = InspectionsSearch['tab']
type Modal =
  | { kind: 'inspect'; defaults?: InspectionDefaults }
  | { kind: 'add-asset' }
  | { kind: 'apply' }
  | { kind: 'edit-asset'; asset: RoomAsset }
  | { kind: 'remove-asset'; asset: RoomAsset }
  | null

const INSPECTION_SORTS = ['inspected_at', 'score']
const ASSET_SORTS = ['room_no', 'item_name', 'condition', 'updated_at']

export function InspectionsPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/hostel/inspections' })
  const me = useMe().data
  const canView = can(me, 'hostel.view')
  const canInspect = can(me, 'hostel.maintenance')
  const canInventory = can(me, 'hostel.inventory')
  const tab: Tab = search.tab
  const [modal, setModal] = useState<Modal>(null)

  const hostels = useHostels(canView)
  const multiHostel = (hostels.data?.length ?? 0) > 1
  const onlyHostel = hostels.data?.length === 1 ? hostels.data[0].id : undefined
  const hostelId = search.hostel_id ?? onlyHostel

  const setSearch = (patch: Partial<InspectionsSearch>) =>
    void navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })
  const switchTab = (next: Tab) =>
    void navigate({ search: { tab: next, page: 1, hostel_id: search.hostel_id } })
  const openInspection = (id?: number) =>
    void navigate({ search: (prev) => ({ ...prev, inspection: id }) })
  const onPageChange = (page: number) => void navigate({ search: (prev) => ({ ...prev, page }) })

  const canCreate = tab === 'assets' ? canInventory : canInspect
  const create = () => setModal(tab === 'assets' ? { kind: 'add-asset' } : { kind: 'inspect' })

  useShortcut('hostel.create', create, { enabled: canView && canCreate })

  const header = (
    <PageHeader
      eyebrow='Hostel'
      title='Room inspections'
      description='Room checks with a score, rooms that are due, and the furniture in every room.'
      actions={
        !canView ? undefined : tab === 'assets' ? (
          canInventory ? (
            <>
              <Button variant='outline' onClick={() => setModal({ kind: 'apply' })}>
                <Layers />
                Apply a set to many rooms
              </Button>
              <Button onClick={() => setModal({ kind: 'add-asset' })}>
                <Plus />
                Add to room
              </Button>
            </>
          ) : undefined
        ) : canInspect ? (
          <Button onClick={() => setModal({ kind: 'inspect' })}>
            <Plus />
            New inspection
          </Button>
        ) : undefined
      }
    />
  )

  if (me && !canView) {
    return (
      <Page>
        {header}
        <EmptyState
          icon={ClipboardCheck}
          title='No access to the hostel'
          description='Ask the school admin for the hostel permission.'
        />
      </Page>
    )
  }

  const hostelFilter = multiHostel ? (
    <HostelSelect
      id='inspections-hostel'
      label='Filter by hostel'
      allLabel='All hostels'
      value={search.hostel_id ? String(search.hostel_id) : undefined}
      onChange={(value) =>
        setSearch({ hostel_id: value ? Number(value) : undefined, room_id: undefined })
      }
    />
  ) : null
  const roomFilter = (
    <RoomSelect
      id='inspections-room'
      label='Filter by room'
      allLabel='All rooms'
      placeholder={hostelId ? 'All rooms' : 'Choose a hostel first'}
      hostelId={hostelId}
      value={search.room_id ? String(search.room_id) : undefined}
      onChange={(value) => setSearch({ room_id: value ? Number(value) : undefined })}
    />
  )

  return (
    <Page>
      {header}
      <HostelLifeTabs active='/hostel/inspections' />
      <PageTabs
        label='Inspection sections'
        value={tab}
        onChange={switchTab}
        tabs={[
          { value: 'inspections', label: 'Inspections', icon: ClipboardList },
          { value: 'due', label: 'Due', icon: CalendarClock },
          { value: 'assets', label: 'Furniture & fittings', icon: Sofa },
        ]}
      />

      {tab === 'inspections' && (
        <InspectionsTab
          search={search}
          hostelFilter={hostelFilter}
          roomFilter={roomFilter}
          canInspect={canInspect}
          setSearch={setSearch}
          onClear={() => switchTab('inspections')}
          onOpen={openInspection}
          onPageChange={onPageChange}
          onCreate={() => setModal({ kind: 'inspect' })}
        />
      )}
      {tab === 'due' && (
        <DueTab
          search={search}
          hostelFilter={hostelFilter}
          canInspect={canInspect}
          onPageChange={onPageChange}
          onInspect={(row) =>
            setModal({
              kind: 'inspect',
              defaults: { hostelId: row.hostel_id, roomId: row.room_id, roomNo: row.room_no },
            })
          }
        />
      )}
      {tab === 'assets' && (
        <AssetsTab
          search={search}
          hostelFilter={hostelFilter}
          roomFilter={roomFilter}
          canInventory={canInventory}
          setSearch={setSearch}
          onClear={() => switchTab('assets')}
          onPageChange={onPageChange}
          onEdit={(asset) => setModal({ kind: 'edit-asset', asset })}
          onRemove={(asset) => setModal({ kind: 'remove-asset', asset })}
          onCreate={() => setModal({ kind: 'add-asset' })}
        />
      )}

      <InspectionSheet inspectionId={search.inspection} onClose={() => openInspection(undefined)} />
      {modal?.kind === 'inspect' && (
        <InspectionFormModal
          defaults={modal.defaults ?? { hostelId }}
          onClose={() => setModal(null)}
          onCreated={(inspection) =>
            void navigate({
              search: (prev) => ({ ...prev, tab: 'inspections', inspection: inspection.id }),
            })
          }
        />
      )}
      {modal?.kind === 'add-asset' && (
        <AddAssetModal hostelId={hostelId} onClose={() => setModal(null)} />
      )}
      {modal?.kind === 'apply' && (
        <ApplyAssetsModal hostelId={search.hostel_id} onClose={() => setModal(null)} />
      )}
      {modal?.kind === 'edit-asset' && (
        <EditAssetModal asset={modal.asset} onClose={() => setModal(null)} />
      )}
      {modal?.kind === 'remove-asset' && (
        <RemoveAssetDialog asset={modal.asset} onClose={() => setModal(null)} />
      )}
    </Page>
  )
}

function InspectionsTab({
  search,
  hostelFilter,
  roomFilter,
  canInspect,
  setSearch,
  onClear,
  onOpen,
  onPageChange,
  onCreate,
}: {
  search: InspectionsSearch
  hostelFilter: ReactNode
  roomFilter: ReactNode
  canInspect: boolean
  setSearch: (patch: Partial<InspectionsSearch>) => void
  onClear: () => void
  onOpen: (id: number) => void
  onPageChange: (page: number) => void
  onCreate: () => void
}) {
  const sort = search.sort && INSPECTION_SORTS.includes(search.sort) ? search.sort : 'inspected_at'
  const order = search.order ?? 'desc'
  const inspections = useInspections({
    page: search.page,
    limit: LIMIT,
    hostel_id: search.hostel_id,
    room_id: search.room_id,
    result: search.result,
    from: search.from,
    to: search.to,
    sort,
    order,
  })
  const filtered = Boolean(
    search.hostel_id || search.room_id || search.result || search.from || search.to
  )

  const columns: Column<Inspection>[] = [
    {
      key: 'room',
      header: 'Room',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='font-mono font-bold'>{row.room_no}</span>
          <span className='truncate text-xs text-muted-foreground'>
            {placeLine([row.block_name, row.hostel_name])}
          </span>
        </div>
      ),
    },
    {
      key: 'inspected_at',
      header: 'Inspected',
      sortKey: 'inspected_at',
      cell: (row) => (
        <div className='grid'>
          <span className='text-sm'>{formatDateTime(row.inspected_at)}</span>
          {row.inspector_name && (
            <span className='text-xs text-muted-foreground'>{row.inspector_name}</span>
          )}
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Score',
      sortKey: 'score',
      cell: (row) => <Badge tone={scoreTone(row.score)}>{row.score}%</Badge>,
    },
    {
      key: 'cleanliness',
      header: 'Clean',
      hideBelow: 'xl',
      cell: (row) => (
        <span className='tabular text-muted-foreground'>
          {row.cleanliness ? `${row.cleanliness}/5` : '—'}
        </span>
      ),
    },
    {
      key: 'result',
      header: 'Result',
      cell: (row) => (
        <div className='flex flex-wrap items-center gap-1.5'>
          <Badge tone={INSPECTION_RESULT[row.result].tone} dot>
            {row.issues
              ? `${row.issues} ${row.issues === 1 ? 'issue' : 'issues'}`
              : INSPECTION_RESULT[row.result].label}
          </Badge>
          {row.ticket_no && (
            <Wrench className='size-3.5 text-muted-foreground' aria-label='Ticket' />
          )}
          {row.case_no && <Gavel className='size-3.5 text-muted-foreground' aria-label='Case' />}
        </div>
      ),
    },
  ]

  return (
    <Card className='overflow-hidden'>
      <ListToolbar
        summary={
          inspections.data
            ? `${inspections.data.total} ${inspections.data.total === 1 ? 'inspection' : 'inspections'}`
            : ''
        }
        onClear={filtered ? onClear : undefined}
      >
        {hostelFilter}
        {roomFilter}
        <FilterSelect
          id='inspections-result'
          label='Filter by result'
          allLabel='Any result'
          value={search.result}
          options={toneOptions(INSPECTION_RESULT)}
          onChange={(value) => setSearch({ result: value as InspectionResult | undefined })}
        />
        <div className='flex w-full items-center gap-2 sm:w-auto'>
          <DatePicker
            id='inspections-from'
            value={search.from ?? ''}
            max={search.to}
            placeholder='From date'
            className='sm:w-40'
            onChange={(value: string) => setSearch({ from: value || undefined })}
          />
          <span className='text-xs text-muted-foreground'>to</span>
          <DatePicker
            id='inspections-to'
            value={search.to ?? ''}
            min={search.from}
            placeholder='To date'
            align='end'
            className='sm:w-40'
            onChange={(value: string) => setSearch({ to: value || undefined })}
          />
        </div>
      </ListToolbar>
      <DataTable
        rows={inspections.data?.items ?? []}
        columns={columns}
        rowKey={(row) => row.id}
        loading={inspections.isFetching}
        error={inspections.isError ? inspections.error.message : null}
        onRetry={() => inspections.refetch()}
        onRowClick={(row) => onOpen(row.id)}
        sort={{ sort, order }}
        onSortChange={(next) => setSearch(next as Partial<InspectionsSearch>)}
        empty={{
          icon: filtered ? CircleOff : ClipboardCheck,
          title: filtered ? 'No inspections match these filters' : 'No inspections yet',
          description: filtered
            ? 'Try another room or date, or clear the filters.'
            : 'Inspect a room with the checklist to start the record.',
          action:
            canInspect && !filtered ? (
              <Button onClick={onCreate}>
                <Plus />
                New inspection
              </Button>
            ) : undefined,
        }}
        card={(row) => (
          <div className='grid gap-1.5'>
            <div className='flex items-start justify-between gap-2'>
              <div className='grid min-w-0'>
                <span className='font-mono font-bold'>{row.room_no}</span>
                <span className='truncate text-xs text-muted-foreground'>
                  {placeLine([row.block_name, row.hostel_name])}
                </span>
              </div>
              <Badge tone={scoreTone(row.score)} className='shrink-0'>
                {row.score}%
              </Badge>
            </div>
            <div className='flex flex-wrap items-center justify-between gap-2 text-xs'>
              <span className='text-muted-foreground'>
                {placeLine([formatDateTime(row.inspected_at), row.inspector_name])}
              </span>
              <Badge tone={INSPECTION_RESULT[row.result].tone} dot>
                {row.issues
                  ? `${row.issues} ${row.issues === 1 ? 'issue' : 'issues'}`
                  : INSPECTION_RESULT[row.result].label}
              </Badge>
            </div>
          </div>
        )}
        pagination={{
          page: search.page,
          limit: LIMIT,
          total: inspections.data?.total ?? 0,
          label: 'inspections',
          onPageChange,
        }}
      />
    </Card>
  )
}

function DueTab({
  search,
  hostelFilter,
  canInspect,
  onPageChange,
  onInspect,
}: {
  search: InspectionsSearch
  hostelFilter: ReactNode
  canInspect: boolean
  onPageChange: (page: number) => void
  onInspect: (row: InspectionDue) => void
}) {
  const [days, setDays] = useState('30')
  const debounced = useDebouncedValue(days.trim(), 400)
  const validDays = intInRange(debounced, 1, 365) ? Number(debounced) : 30
  const due = useInspectionsDue({
    page: search.page,
    limit: LIMIT,
    hostel_id: search.hostel_id,
    days: validDays,
  })

  const inspectButton = (row: InspectionDue) =>
    canInspect ? (
      <Button
        size='sm'
        variant='outline'
        onClick={(event) => {
          event.stopPropagation()
          onInspect(row)
        }}
      >
        <ClipboardCheck />
        Inspect now
      </Button>
    ) : null

  const lastLine = (row: InspectionDue) =>
    row.last_inspected_at
      ? `${formatDate(row.last_inspected_at)} · ${row.days_since ?? 0} days ago`
      : 'Never inspected'

  const columns: Column<InspectionDue>[] = [
    {
      key: 'room',
      header: 'Room',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='font-mono font-bold'>{row.room_no}</span>
          <span className='truncate text-xs text-muted-foreground'>
            {placeLine([row.block_name, row.floor_name])}
          </span>
        </div>
      ),
    },
    {
      key: 'hostel',
      header: 'Hostel',
      hideBelow: 'lg',
      cell: (row) => <span className='text-sm'>{row.hostel_name}</span>,
    },
    {
      key: 'last',
      header: 'Last inspected',
      cell: (row) =>
        row.last_inspected_at ? (
          <span className='text-sm'>{lastLine(row)}</span>
        ) : (
          <Badge tone='warning'>Never inspected</Badge>
        ),
    },
    { key: 'action', header: '', align: 'right', cell: inspectButton },
  ]

  return (
    <Card className='overflow-hidden'>
      <ListToolbar
        summary={due.data ? `${due.data.total} ${due.data.total === 1 ? 'room' : 'rooms'} due` : ''}
      >
        {hostelFilter}
        <label className='flex items-center gap-2 text-sm'>
          <span className='whitespace-nowrap text-muted-foreground'>Not inspected in</span>
          <Input
            id='inspections-due-days'
            inputMode='numeric'
            value={days}
            maxLength={3}
            aria-invalid={!intInRange(days.trim() || '0', 1, 365)}
            className='tabular h-9 w-16'
            onChange={(event) => setDays(event.target.value.replace(/\D/g, ''))}
          />
          <span className='text-muted-foreground'>days</span>
        </label>
      </ListToolbar>
      <DataTable
        rows={due.data?.items ?? []}
        columns={columns}
        rowKey={(row) => row.room_id}
        loading={due.isFetching}
        error={due.isError ? due.error.message : null}
        onRetry={() => due.refetch()}
        empty={{
          icon: ClipboardCheck,
          title: 'Every room is up to date',
          description: `All open rooms were inspected in the last ${validDays} days.`,
        }}
        card={(row) => (
          <div className='grid gap-2'>
            <div className='flex items-start justify-between gap-2'>
              <div className='grid min-w-0'>
                <span className='font-mono font-bold'>{row.room_no}</span>
                <span className='truncate text-xs text-muted-foreground'>
                  {placeLine([row.hostel_name, row.block_name, row.floor_name])}
                </span>
              </div>
              {row.last_inspected_at ? null : (
                <Badge tone='warning' className='shrink-0'>
                  Never
                </Badge>
              )}
            </div>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <span className='text-xs text-muted-foreground'>{lastLine(row)}</span>
              {inspectButton(row)}
            </div>
          </div>
        )}
        pagination={{
          page: search.page,
          limit: LIMIT,
          total: due.data?.total ?? 0,
          label: 'rooms',
          onPageChange,
        }}
      />
    </Card>
  )
}

function AssetsTab({
  search,
  hostelFilter,
  roomFilter,
  canInventory,
  setSearch,
  onClear,
  onPageChange,
  onEdit,
  onRemove,
  onCreate,
}: {
  search: InspectionsSearch
  hostelFilter: ReactNode
  roomFilter: ReactNode
  canInventory: boolean
  setSearch: (patch: Partial<InspectionsSearch>) => void
  onClear: () => void
  onPageChange: (page: number) => void
  onEdit: (asset: RoomAsset) => void
  onRemove: (asset: RoomAsset) => void
  onCreate: () => void
}) {
  const sort = search.sort && ASSET_SORTS.includes(search.sort) ? search.sort : 'room_no'
  const order = search.order ?? (sort === 'room_no' || sort === 'item_name' ? 'asc' : 'desc')
  const assets = useAssets({
    page: search.page,
    limit: LIMIT,
    hostel_id: search.hostel_id,
    room_id: search.room_id,
    condition: search.condition,
    sort,
    order,
  })
  const filtered = Boolean(search.hostel_id || search.room_id || search.condition)

  const actions = (row: RoomAsset) =>
    canInventory ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={`Actions for ${row.item_name}`}
            onClick={(event) => event.stopPropagation()}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' onClick={(event) => event.stopPropagation()}>
          <DropdownMenuItem onSelect={() => onEdit(row)}>
            <Pencil />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem destructive onSelect={() => onRemove(row)}>
            <Trash2 />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : null

  const columns: Column<RoomAsset>[] = [
    {
      key: 'item_name',
      header: 'Item',
      sortKey: 'item_name',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='truncate font-semibold'>{row.item_name}</span>
          {(row.asset_tag || row.notes) && (
            <span className='truncate text-xs text-muted-foreground'>
              {placeLine([row.asset_tag, row.notes])}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'room_no',
      header: 'Room',
      sortKey: 'room_no',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='font-mono font-bold'>{row.room_no}</span>
          <span className='truncate text-xs text-muted-foreground'>
            {placeLine([row.block_name, row.hostel_name])}
          </span>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Qty',
      cell: (row) => <span className='tabular'>{row.quantity}</span>,
    },
    {
      key: 'condition',
      header: 'Condition',
      sortKey: 'condition',
      cell: (row) => (
        <Badge tone={ASSET_CONDITION[row.condition].tone} dot>
          {ASSET_CONDITION[row.condition].label}
        </Badge>
      ),
    },
    {
      key: 'updated_at',
      header: 'Last checked',
      sortKey: 'updated_at',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='text-sm text-muted-foreground'>
          {row.last_checked_at ? formatDate(row.last_checked_at) : '—'}
        </span>
      ),
    },
    { key: 'actions', header: '', align: 'right', cell: actions },
  ]

  return (
    <Card className='overflow-hidden'>
      <ListToolbar
        summary={
          assets.data ? `${assets.data.total} ${assets.data.total === 1 ? 'item' : 'items'}` : ''
        }
        onClear={filtered ? onClear : undefined}
      >
        {hostelFilter}
        {roomFilter}
        <FilterSelect
          id='assets-condition'
          label='Filter by condition'
          allLabel='Any condition'
          value={search.condition}
          options={toneOptions(ASSET_CONDITION)}
          onChange={(value) => setSearch({ condition: value as AssetCondition | undefined })}
        />
      </ListToolbar>
      <DataTable
        rows={assets.data?.items ?? []}
        columns={columns}
        rowKey={(row) => row.id}
        loading={assets.isFetching}
        error={assets.isError ? assets.error.message : null}
        onRetry={() => assets.refetch()}
        onRowClick={canInventory ? onEdit : undefined}
        sort={{ sort, order }}
        onSortChange={(next) => setSearch(next as Partial<InspectionsSearch>)}
        empty={{
          icon: filtered ? CircleOff : Sofa,
          title: filtered ? 'No items match these filters' : 'No furniture recorded yet',
          description: filtered
            ? 'Try another room or condition, or clear the filters.'
            : 'Add items room by room, or apply a standard set to many rooms.',
          action:
            canInventory && !filtered ? (
              <Button onClick={onCreate}>
                <Plus />
                Add to room
              </Button>
            ) : undefined,
        }}
        card={(row) => (
          <div className='grid gap-1.5'>
            <div className='flex items-start justify-between gap-2'>
              <div className='grid min-w-0'>
                <span className='truncate font-semibold'>
                  {row.item_name}
                  <span className='font-normal text-muted-foreground'> × {row.quantity}</span>
                </span>
                <span className='truncate text-xs text-muted-foreground'>
                  {placeLine([`Room ${row.room_no}`, row.block_name, row.hostel_name])}
                </span>
              </div>
              <div className='flex shrink-0 items-center gap-1'>
                <Badge tone={ASSET_CONDITION[row.condition].tone} dot>
                  {ASSET_CONDITION[row.condition].label}
                </Badge>
                {actions(row)}
              </div>
            </div>
            {row.notes && <span className='text-xs text-muted-foreground'>{row.notes}</span>}
          </div>
        )}
        pagination={{
          page: search.page,
          limit: LIMIT,
          total: assets.data?.total ?? 0,
          label: 'items',
          onPageChange,
        }}
      />
    </Card>
  )
}

function RemoveAssetDialog({ asset, onClose }: { asset: RoomAsset; onClose: () => void }) {
  const remove = useHostelMutation(() => roomsApi.removeAsset(asset.id), false)
  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Remove ${asset.item_name}?`}
      description={`It is taken off room ${asset.room_no}'s list.`}
      confirmText='Remove'
      destructive
      loading={remove.isPending}
      onConfirm={() =>
        remove.mutate(undefined, {
          onSuccess: () => {
            alerts.success(`${asset.item_name} removed from room ${asset.room_no}`)
            onClose()
          },
          onError: onClose,
        })
      }
    />
  )
}
