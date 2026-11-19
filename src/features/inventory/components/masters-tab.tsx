import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Building2,
  CircleOff,
  FolderTree,
  MapPin,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Truck,
  UsersRound,
  Warehouse,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/display'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { PageTabs } from '@/components/common/page-tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import {
  CATEGORY_KINDS,
  inventoryApi,
  LOCATION_KINDS,
  useCategories,
  useDepartmentAssets,
  useDepartments,
  useInventoryMutation,
  useLocations,
  useStores,
  useVendors,
  type Allocation,
  type Category,
  type Department,
  type InventoryAccess,
  type Location,
  type Store,
  type Vendor,
} from '../api'
import { CATEGORY_KIND, LOCATION_KIND, money, options, qty } from '../labels'
import { MASTER_VIEWS, pick, type InventorySearch, type InventorySearchPatch } from '../search'
import {
  CategoryModal,
  DepartmentModal,
  LocationModal,
  StoreModal,
  VendorModal,
} from './master-forms'

type MasterView = (typeof MASTER_VIEWS)[number]

const VIEW_TABS: { value: MasterView; label: string; icon: typeof MapPin }[] = [
  { value: 'categories', label: 'Categories', icon: FolderTree },
  { value: 'locations', label: 'Locations', icon: MapPin },
  { value: 'departments', label: 'Departments', icon: UsersRound },
  { value: 'vendors', label: 'Vendors', icon: Truck },
  { value: 'stores', label: 'Stores', icon: Warehouse },
]

const LIMIT = 20

interface TabProps {
  search: InventorySearch
  onChange: (patch: InventorySearchPatch) => void
  access: InventoryAccess
}

export function MastersTab(props: TabProps) {
  const view = pick(MASTER_VIEWS, props.search.view) ?? 'categories'
  return (
    <div className='grid gap-4'>
      <PageTabs
        label='Masters'
        value={view}
        onChange={(next) => props.onChange({ view: next })}
        tabs={VIEW_TABS}
      />
      {view === 'categories' && <CategoriesView {...props} />}
      {view === 'locations' && <LocationsView {...props} />}
      {view === 'departments' && <DepartmentsView {...props} />}
      {view === 'vendors' && <VendorsView {...props} />}
      {view === 'stores' && <StoresView {...props} />}
    </div>
  )
}

function RowActions({
  label,
  onEdit,
  onDelete,
}: {
  label: string
  onEdit: () => void
  onDelete?: () => void
}) {
  return (
    <div className='inline-flex gap-1'>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label={`Edit ${label}`}
        onClick={(event) => {
          event.stopPropagation()
          onEdit()
        }}
      >
        <Pencil />
      </Button>
      {onDelete && (
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={`Delete ${label}`}
          className='text-destructive hover:bg-destructive/10'
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
        >
          <Trash2 />
        </Button>
      )}
    </div>
  )
}

function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge tone='success' dot>
      Active
    </Badge>
  ) : (
    <Badge tone='neutral' dot>
      Inactive
    </Badge>
  )
}

function useDeleter<T extends { id: number; name: string }>(
  remove: (id: number) => Promise<unknown>,
  noun: string
) {
  const [target, setTarget] = useState<T | null>(null)
  const mutation = useInventoryMutation(remove)
  const dialog = (
    <ConfirmDialog
      open={Boolean(target)}
      onOpenChange={(open) => !open && setTarget(null)}
      title={`Delete ${target?.name ?? noun}?`}
      description={`Only an empty ${noun} can be deleted. This cannot be undone.`}
      confirmText='Delete'
      destructive
      loading={mutation.isPending}
      onConfirm={async () => {
        if (!target) return
        try {
          await mutation.mutateAsync(target.id)
          alerts.success(`${target.name} deleted`)
        } catch (error) {
          alerts.error(toApiError(error).message)
        }
        setTarget(null)
      }}
    />
  )
  return { ask: setTarget, dialog }
}

function CategoriesView({ search, onChange, access }: TabProps) {
  const kind = pick(CATEGORY_KINDS, search.kind)
  const categories = useCategories(kind)
  const [editing, setEditing] = useState<Category | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const deleter = useDeleter<Category>(inventoryApi.removeCategory, 'category')
  const rows = categories.data ?? []

  const openForm = (item: Category | null) => {
    setEditing(item)
    setFormOpen(true)
  }

  const columns: Column<Category>[] = [
    {
      key: 'name',
      header: 'Category',
      cell: (item) => (
        <span className='grid min-w-0'>
          <span className='truncate font-bold'>{item.name}</span>
          <span className='truncate text-xs text-muted-foreground'>
            {item.parent ? `Under ${item.parent.name}` : 'Top level'}
          </span>
        </span>
      ),
    },
    {
      key: 'code',
      header: 'Code',
      cell: (item) => <span className='font-mono text-xs'>{item.code}</span>,
    },
    {
      key: 'kind',
      header: 'Kind',
      cell: (item) => (
        <Badge tone={item.kind === 'asset' ? 'info' : 'neutral'}>{CATEGORY_KIND[item.kind]}</Badge>
      ),
    },
    {
      key: 'depreciation',
      header: 'Depreciation',
      hideBelow: 'lg',
      cell: (item) =>
        item.kind === 'stock'
          ? '—'
          : item.depreciation_rate !== null
            ? `${qty(item.depreciation_rate)}% a year`
            : item.useful_life_years
              ? `${item.useful_life_years} years`
              : 'None',
    },
    {
      key: 'interval',
      header: 'Maintenance',
      hideBelow: 'xl',
      cell: (item) =>
        item.maintenance_interval_days ? `Every ${item.maintenance_interval_days} days` : '—',
    },
    { key: 'items', header: 'Items', align: 'right', cell: (item) => qty(item.item_count) },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      className: 'w-24',
      cell: (item) =>
        access.manage && (
          <RowActions
            label={item.name}
            onEdit={() => openForm(item)}
            onDelete={() => deleter.ask(item)}
          />
        ),
    },
  ]

  return (
    <Card className='overflow-hidden'>
      <ListToolbar
        summary={`${rows.length} ${rows.length === 1 ? 'category' : 'categories'}`}
        onClear={kind ? () => onChange({ kind: undefined }) : undefined}
      >
        <FilterSelect
          id='category-kind-filter'
          label='Filter by kind'
          allLabel='Assets and stock'
          value={kind}
          options={options(CATEGORY_KIND)}
          onChange={(value) => onChange({ kind: value as InventorySearch['kind'] })}
        />
        {access.manage && (
          <Button className='sm:ml-auto' onClick={() => openForm(null)}>
            <Plus />
            Add category
          </Button>
        )}
      </ListToolbar>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(item) => item.id}
        loading={categories.isFetching}
        error={categories.isError ? categories.error.message : null}
        onRetry={() => categories.refetch()}
        onRowClick={access.manage ? (item) => openForm(item) : undefined}
        empty={{
          icon: FolderTree,
          title: 'No categories yet',
          description:
            'Add asset categories like Laptops or Furniture, and stock categories like Stationery.',
          action: access.manage && (
            <Button onClick={() => openForm(null)}>
              <Plus />
              Add category
            </Button>
          ),
        }}
        card={(item) => (
          <div className='grid gap-1'>
            <div className='flex items-start justify-between gap-2'>
              <span className='grid min-w-0'>
                <span className='truncate font-bold'>{item.name}</span>
                <span className='font-mono text-xs text-muted-foreground'>{item.code}</span>
              </span>
              <Badge tone={item.kind === 'asset' ? 'info' : 'neutral'}>
                {CATEGORY_KIND[item.kind]}
              </Badge>
            </div>
            <span className='text-xs text-muted-foreground'>
              {item.parent ? `Under ${item.parent.name} · ` : ''}
              {item.item_count} items
            </span>
          </div>
        )}
      />
      <CategoryModal
        open={formOpen}
        onOpenChange={setFormOpen}
        item={editing}
        defaultKind={kind ?? 'asset'}
      />
      {deleter.dialog}
    </Card>
  )
}

function LocationsView({ search, onChange, access }: TabProps) {
  const kind = pick(LOCATION_KINDS, search.kind)
  const page = search.page ?? 1
  const locations = useLocations({
    page,
    limit: LIMIT,
    search: search.search,
    sort: search.sort,
    order: search.order,
    kind,
    is_active: search.is_active,
  })
  const [editing, setEditing] = useState<Location | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const deleter = useDeleter<Location>(inventoryApi.removeLocation, 'location')
  const sync = useInventoryMutation(inventoryApi.syncRooms)
  const filtered = Boolean(search.search || kind || search.is_active !== undefined)

  const openForm = (item: Location | null) => {
    setEditing(item)
    setFormOpen(true)
  }

  const syncRooms = async () => {
    try {
      const result = await sync.mutateAsync(undefined)
      alerts.success(
        result.created
          ? `${result.created} rooms added from the timetable`
          : 'Every timetable room is already a location',
        { description: `${result.existing} already existed` }
      )
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const columns: Column<Location>[] = [
    {
      key: 'name',
      header: 'Location',
      sortKey: 'name',
      cell: (item) => (
        <span className='grid min-w-0'>
          <span className='truncate font-bold'>{item.name}</span>
          <span className='truncate text-xs text-muted-foreground'>
            {LOCATION_KIND[item.kind]}
            {item.section ? ` · ${item.section.name}` : ''}
          </span>
        </span>
      ),
    },
    {
      key: 'code',
      header: 'Code',
      sortKey: 'code',
      cell: (item) => <span className='font-mono text-xs'>{item.code}</span>,
    },
    {
      key: 'building',
      header: 'Building',
      sortKey: 'building',
      hideBelow: 'lg',
      cell: (item) =>
        [item.building, item.floor ? `${item.floor} floor` : null].filter(Boolean).join(' · ') ||
        '—',
    },
    { key: 'status', header: 'Status', cell: (item) => <ActiveBadge active={item.is_active} /> },
    { key: 'assets', header: 'Assets', align: 'right', cell: (item) => qty(item.asset_count) },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      className: 'w-24',
      cell: (item) =>
        access.manage && (
          <RowActions
            label={item.name}
            onEdit={() => openForm(item)}
            onDelete={() => deleter.ask(item)}
          />
        ),
    },
  ]

  return (
    <Card className='overflow-hidden'>
      <ListToolbar
        summary={locations.data ? `${locations.data.total} locations` : ''}
        onClear={
          filtered
            ? () => onChange({ search: undefined, kind: undefined, is_active: undefined })
            : undefined
        }
      >
        <SearchBox
          value={search.search ?? ''}
          onChange={(value) => onChange({ search: value || undefined })}
          placeholder='Name, code or building'
          label='Search locations'
        />
        <FilterSelect
          id='location-kind-filter'
          label='Filter by kind'
          allLabel='All kinds'
          value={kind}
          options={options(LOCATION_KIND)}
          onChange={(value) => onChange({ kind: value as InventorySearch['kind'] })}
        />
        <FilterSelect
          id='location-active-filter'
          label='Filter by status'
          allLabel='Active and inactive'
          value={search.is_active === undefined ? undefined : String(search.is_active)}
          options={[
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Inactive' },
          ]}
          onChange={(value) =>
            onChange({ is_active: value === undefined ? undefined : value === 'true' })
          }
        />
        {access.manage && (
          <div className='flex flex-wrap gap-2 sm:ml-auto'>
            <Button variant='outline' loading={sync.isPending} onClick={() => void syncRooms()}>
              <RefreshCw />
              Add rooms from timetable
            </Button>
            <Button onClick={() => openForm(null)}>
              <Plus />
              Add location
            </Button>
          </div>
        )}
      </ListToolbar>
      <DataTable
        rows={locations.data?.items ?? []}
        columns={columns}
        rowKey={(item) => item.id}
        loading={locations.isFetching}
        error={locations.isError ? locations.error.message : null}
        onRetry={() => locations.refetch()}
        onRowClick={access.manage ? (item) => openForm(item) : undefined}
        sort={{ sort: search.sort, order: search.order ?? 'desc' }}
        onSortChange={(next) => onChange({ sort: next.sort, order: next.order })}
        empty={{
          icon: filtered ? CircleOff : MapPin,
          title: filtered ? 'No locations match' : 'No locations yet',
          description: filtered
            ? 'Try another search or clear the filters.'
            : 'Add rooms, labs and offices, or bring in the rooms used in the timetable.',
          action: !filtered && access.manage && (
            <Button onClick={() => openForm(null)}>
              <Plus />
              Add location
            </Button>
          ),
        }}
        card={(item) => (
          <div className='grid gap-1'>
            <div className='flex items-start justify-between gap-2'>
              <span className='grid min-w-0'>
                <span className='truncate font-bold'>{item.name}</span>
                <span className='font-mono text-xs text-muted-foreground'>{item.code}</span>
              </span>
              <ActiveBadge active={item.is_active} />
            </div>
            <span className='text-xs text-muted-foreground'>
              {LOCATION_KIND[item.kind]}
              {item.building ? ` · ${item.building}` : ''} · {item.asset_count} assets
            </span>
          </div>
        )}
        pagination={
          locations.data
            ? {
                page,
                limit: LIMIT,
                total: locations.data.total,
                label: 'locations',
                onPageChange: (next) => onChange({ page: next }),
              }
            : undefined
        }
      />
      <LocationModal open={formOpen} onOpenChange={setFormOpen} item={editing} />
      {deleter.dialog}
    </Card>
  )
}

function DepartmentsView({ access }: TabProps) {
  const departments = useDepartments()
  const [editing, setEditing] = useState<Department | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [viewing, setViewing] = useState<Department | null>(null)
  const deleter = useDeleter<Department>(inventoryApi.removeDepartment, 'department')
  const sync = useInventoryMutation(inventoryApi.syncDepartments)
  const rows = departments.data ?? []

  const openForm = (item: Department | null) => {
    setEditing(item)
    setFormOpen(true)
  }

  const syncDepartments = async () => {
    try {
      const result = await sync.mutateAsync(undefined)
      alerts.success(
        result.created
          ? `${result.created} departments added from staff profiles`
          : 'Every staff department already exists',
        { description: `${result.existing} already existed` }
      )
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const columns: Column<Department>[] = [
    {
      key: 'name',
      header: 'Department',
      cell: (item) => (
        <span className='grid min-w-0'>
          <span className='truncate font-bold'>{item.name}</span>
          <span className='font-mono text-xs text-muted-foreground'>{item.code}</span>
        </span>
      ),
    },
    {
      key: 'head',
      header: 'Head',
      cell: (item) => item.head?.name ?? <span className='text-muted-foreground'>Not set</span>,
    },
    {
      key: 'staff',
      header: 'Staff',
      align: 'right',
      hideBelow: 'lg',
      cell: (item) => qty(item.staff_count),
    },
    { key: 'assets', header: 'Assets', align: 'right', cell: (item) => qty(item.asset_count) },
    {
      key: 'status',
      header: 'Status',
      hideBelow: 'lg',
      cell: (item) => <ActiveBadge active={item.is_active} />,
    },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      className: 'w-24',
      cell: (item) =>
        access.manage && (
          <RowActions
            label={item.name}
            onEdit={() => openForm(item)}
            onDelete={() => deleter.ask(item)}
          />
        ),
    },
  ]

  return (
    <Card className='overflow-hidden'>
      <ListToolbar summary={`${rows.length} departments`}>
        <p className='text-xs text-muted-foreground'>Open a department to see its assets.</p>
        {access.manage && (
          <div className='flex flex-wrap gap-2 sm:ml-auto'>
            <Button
              variant='outline'
              loading={sync.isPending}
              onClick={() => void syncDepartments()}
            >
              <RefreshCw />
              Add departments from staff
            </Button>
            <Button onClick={() => openForm(null)}>
              <Plus />
              Add department
            </Button>
          </div>
        )}
      </ListToolbar>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(item) => item.id}
        loading={departments.isFetching}
        error={departments.isError ? departments.error.message : null}
        onRetry={() => departments.refetch()}
        onRowClick={setViewing}
        empty={{
          icon: UsersRound,
          title: 'No departments yet',
          description: 'Add them here, or create one for every department name on staff profiles.',
          action: access.manage && (
            <Button
              variant='outline'
              loading={sync.isPending}
              onClick={() => void syncDepartments()}
            >
              <RefreshCw />
              Add departments from staff
            </Button>
          ),
        }}
        card={(item) => (
          <div className='grid gap-1'>
            <div className='flex items-start justify-between gap-2'>
              <span className='grid min-w-0'>
                <span className='truncate font-bold'>{item.name}</span>
                <span className='truncate text-xs text-muted-foreground'>
                  {item.head ? `Head: ${item.head.name}` : 'No head set'}
                </span>
              </span>
              <ActiveBadge active={item.is_active} />
            </div>
            <span className='text-xs text-muted-foreground'>
              {item.staff_count} staff · {item.asset_count} assets
            </span>
          </div>
        )}
      />
      <DepartmentModal open={formOpen} onOpenChange={setFormOpen} item={editing} />
      <DepartmentAssetsSheet department={viewing} onClose={() => setViewing(null)} />
      {deleter.dialog}
    </Card>
  )
}

function DepartmentAssetsSheet({
  department,
  onClose,
}: {
  department: Department | null
  onClose: () => void
}) {
  const [shown, setShown] = useState(department)
  if (department && department !== shown) setShown(department)
  const assets = useDepartmentAssets(shown?.id ?? null)

  return (
    <Sheet open={Boolean(department)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{shown?.name ?? 'Department'}</SheetTitle>
          <SheetDescription>
            Assets allocated to this department now, and returned ones.
          </SheetDescription>
        </SheetHeader>
        <SheetBody className='grid content-start gap-5'>
          {assets.isPending ? (
            <div className='grid gap-2'>
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className='h-12' />
              ))}
            </div>
          ) : assets.isError ? (
            <p className='text-sm text-destructive'>{assets.error.message}</p>
          ) : (
            <>
              <AllocationList title='With the department now' rows={assets.data.current} />
              <AllocationList title='Returned' rows={assets.data.history} returned />
            </>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

function AllocationList({
  title,
  rows,
  returned,
}: {
  title: string
  rows: Allocation[]
  returned?: boolean
}) {
  return (
    <section className='grid gap-2'>
      <h3 className='text-sm font-bold'>
        {title} <span className='tabular text-muted-foreground'>({rows.length})</span>
      </h3>
      {rows.length === 0 ? (
        <EmptyState icon={Package} title='None' className='py-6' />
      ) : (
        <ul className='grid divide-y rounded-lg border'>
          {rows.map((row) => (
            <li key={row.id} className='flex items-start justify-between gap-3 px-3 py-2'>
              <span className='grid min-w-0'>
                <Link
                  to='/inventory/assets/$assetId'
                  params={{ assetId: String(row.asset.id) }}
                  search={{ tab: 'details' }}
                  className='truncate text-sm font-semibold hover:underline'
                >
                  {row.asset.name}
                </Link>
                <span className='font-mono text-[11px] text-muted-foreground'>{row.asset_tag}</span>
              </span>
              <span className='shrink-0 text-right text-xs text-muted-foreground'>
                {returned
                  ? `Returned ${formatDate(row.returned_on)}`
                  : `Since ${formatDate(row.allocated_on)}`}
                {!returned && row.overdue && (
                  <Badge tone='danger' className='ml-1'>
                    Overdue
                  </Badge>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function VendorsView({ access }: TabProps) {
  const vendors = useVendors()
  const [editing, setEditing] = useState<Vendor | null>(null)
  const deleter = useDeleter<Vendor>(inventoryApi.removeVendor, 'vendor')
  const [formOpen, setFormOpen] = useState(false)
  const rows = vendors.data ?? []

  const openForm = (item: Vendor | null) => {
    setEditing(item)
    setFormOpen(true)
  }

  const columns: Column<Vendor>[] = [
    {
      key: 'name',
      header: 'Vendor',
      cell: (item) => (
        <span className='grid min-w-0'>
          <span className='truncate font-bold'>{item.name}</span>
          <span className='truncate text-xs text-muted-foreground'>{item.supplies ?? '—'}</span>
        </span>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      cell: (item) => (
        <span className='grid min-w-0'>
          <span className='truncate'>{item.contact_person ?? '—'}</span>
          <span className='tabular truncate text-xs text-muted-foreground'>
            {[item.phone, item.email].filter(Boolean).join(' · ') || '—'}
          </span>
        </span>
      ),
    },
    {
      key: 'gstin',
      header: 'GSTIN',
      hideBelow: 'xl',
      cell: (item) => <span className='font-mono text-xs'>{item.gstin ?? '—'}</span>,
    },
    {
      key: 'assets',
      header: 'Assets',
      align: 'right',
      hideBelow: 'lg',
      cell: (item) => qty(item.asset_count),
    },
    {
      key: 'receipts',
      header: 'Receipts',
      align: 'right',
      hideBelow: 'lg',
      cell: (item) => qty(item.receipt_count),
    },
    { key: 'status', header: 'Status', cell: (item) => <ActiveBadge active={item.is_active} /> },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      className: 'w-14',
      cell: (item) =>
        access.manage && (
          <RowActions
            label={item.name}
            onEdit={() => openForm(item)}
            onDelete={() => deleter.ask(item)}
          />
        ),
    },
  ]

  return (
    <Card className='overflow-hidden'>
      <ListToolbar summary={`${rows.length} vendors`}>
        {access.manage && (
          <Button className='sm:ml-auto' onClick={() => openForm(null)}>
            <Plus />
            Add vendor
          </Button>
        )}
      </ListToolbar>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(item) => item.id}
        loading={vendors.isFetching}
        error={vendors.isError ? vendors.error.message : null}
        onRetry={() => vendors.refetch()}
        onRowClick={access.manage ? (item) => openForm(item) : undefined}
        empty={{
          icon: Truck,
          title: 'No vendors yet',
          description: 'Add the shops and suppliers you buy from or who do repairs and AMC.',
          action: access.manage && (
            <Button onClick={() => openForm(null)}>
              <Plus />
              Add vendor
            </Button>
          ),
        }}
        card={(item) => (
          <div className='grid gap-1'>
            <div className='flex items-start justify-between gap-2'>
              <span className='truncate font-bold'>{item.name}</span>
              <ActiveBadge active={item.is_active} />
            </div>
            <span className='text-xs text-muted-foreground'>
              {[item.contact_person, item.phone].filter(Boolean).join(' · ') || 'No contact'}
            </span>
          </div>
        )}
      />
      <VendorModal open={formOpen} onOpenChange={setFormOpen} item={editing} />
      {deleter.dialog}
    </Card>
  )
}

function StoresView({ access }: TabProps) {
  const stores = useStores()
  const [editing, setEditing] = useState<Store | null>(null)
  const deleter = useDeleter<Store>(inventoryApi.removeStore, 'store')
  const [formOpen, setFormOpen] = useState(false)
  const rows = stores.data ?? []

  const openForm = (item: Store | null) => {
    setEditing(item)
    setFormOpen(true)
  }

  const columns: Column<Store>[] = [
    {
      key: 'name',
      header: 'Store',
      cell: (item) => (
        <span className='grid min-w-0'>
          <span className='truncate font-bold'>{item.name}</span>
          <span className='font-mono text-xs text-muted-foreground'>{item.code}</span>
        </span>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      hideBelow: 'lg',
      cell: (item) => item.location?.name ?? '—',
    },
    { key: 'keeper', header: 'Keeper', cell: (item) => item.keeper?.name ?? '—' },
    { key: 'items', header: 'Items', align: 'right', cell: (item) => qty(item.item_count) },
    {
      key: 'value',
      header: 'Stock value',
      align: 'right',
      cell: (item) => money(item.stock_value),
    },
    {
      key: 'status',
      header: 'Status',
      hideBelow: 'lg',
      cell: (item) => <ActiveBadge active={item.is_active} />,
    },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      className: 'w-14',
      cell: (item) =>
        access.manage && (
          <RowActions
            label={item.name}
            onEdit={() => openForm(item)}
            onDelete={() => deleter.ask(item)}
          />
        ),
    },
  ]

  return (
    <Card className='overflow-hidden'>
      <ListToolbar summary={`${rows.length} stores`}>
        {access.manage && (
          <Button className='sm:ml-auto' onClick={() => openForm(null)}>
            <Plus />
            Add store
          </Button>
        )}
      </ListToolbar>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(item) => item.id}
        loading={stores.isFetching}
        error={stores.isError ? stores.error.message : null}
        onRetry={() => stores.refetch()}
        onRowClick={access.manage ? (item) => openForm(item) : undefined}
        empty={{
          icon: Building2,
          title: 'No stores yet',
          description: 'Add at least one store to receive stock and keep assets not given out.',
          action: access.manage && (
            <Button onClick={() => openForm(null)}>
              <Plus />
              Add store
            </Button>
          ),
        }}
        card={(item) => (
          <div className='grid gap-1'>
            <div className='flex items-start justify-between gap-2'>
              <span className='grid min-w-0'>
                <span className='truncate font-bold'>{item.name}</span>
                <span className='truncate text-xs text-muted-foreground'>
                  {item.keeper ? `Keeper: ${item.keeper.name}` : 'No keeper set'}
                </span>
              </span>
              <span className='tabular text-sm font-bold'>{money(item.stock_value)}</span>
            </div>
            <span className='text-xs text-muted-foreground'>{item.item_count} items</span>
          </div>
        )}
      />
      <StoreModal open={formOpen} onOpenChange={setFormOpen} item={editing} />
      {deleter.dialog}
    </Card>
  )
}
