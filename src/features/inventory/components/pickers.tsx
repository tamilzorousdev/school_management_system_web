import { useRef, useState, type KeyboardEvent } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Check, ScanLine, Search, X } from 'lucide-react'
import { Combobox, type ComboboxOption } from '@/components/common/combobox'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useSections } from '@/features/setup/api'
import { staffApi } from '@/features/staff/api'
import { useDebouncedValue } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import {
  inventoryApi,
  useCategories,
  useDepartments,
  useStores,
  useVendors,
  type Asset,
  type AssetStatus,
  type AssigneeType,
  type CategoryKind,
} from '../api'
import { ASSET_STATUS, ASSIGNEE_TYPE, type TargetValue } from '../labels'

interface PickerProps {
  id: string
  label: string
  value?: string
  onChange: (value: string | undefined, option?: ComboboxOption) => void
  placeholder?: string
  allLabel?: string
  invalid?: boolean
  className?: string
  initial?: ComboboxOption | null
}

const fieldClass = 'sm:w-full'

function RemoteCombobox({
  id,
  label,
  value,
  onChange,
  placeholder,
  allLabel,
  invalid,
  className,
  initial,
  options,
  loading,
  onSearch,
  searchPlaceholder,
  emptyText,
}: PickerProps & {
  options: ComboboxOption[]
  loading: boolean
  onSearch: (query: string) => void
  searchPlaceholder: string
  emptyText: string
}) {
  const [picked, setPicked] = useState<ComboboxOption | null>(initial ?? null)
  const known = options.some((option) => option.value === value)
  const fallback =
    value && !known
      ? picked?.value === value
        ? picked
        : initial?.value === value
          ? initial
          : { value, label: `${label} #${value}` }
      : null
  const all = fallback ? [fallback, ...options] : options
  return (
    <Combobox
      id={id}
      label={label}
      value={value}
      options={all}
      allLabel={allLabel}
      placeholder={placeholder ?? `Choose ${label.toLowerCase()}`}
      searchPlaceholder={searchPlaceholder}
      emptyText={loading ? 'Loading…' : emptyText}
      onSearch={onSearch}
      invalid={invalid}
      highlightSelected={Boolean(allLabel)}
      className={cn(!allLabel && fieldClass, className)}
      onChange={(next) => {
        const option = all.find((item) => item.value === next)
        setPicked(option ?? null)
        onChange(next, option)
      }}
    />
  )
}

export function StaffPicker(props: PickerProps) {
  const [query, setQuery] = useState('')
  const search = useDebouncedValue(query.trim(), 300)
  const staff = useQuery({
    queryKey: ['staff', 'list', { page: 1, limit: 20, search, picker: true }],
    queryFn: () => staffApi.list({ page: 1, limit: 20, search: search || undefined }),
    placeholderData: keepPreviousData,
    meta: { silent: true },
  })
  const options = (staff.data?.items ?? []).map((item) => ({
    value: String(item.user_id),
    label: item.name,
    hint: item.department ?? item.designation,
  }))
  return (
    <RemoteCombobox
      {...props}
      options={options}
      loading={staff.isFetching}
      onSearch={setQuery}
      searchPlaceholder='Search staff name or number'
      emptyText='No staff found'
    />
  )
}

export function LocationPicker(props: PickerProps) {
  const [query, setQuery] = useState('')
  const search = useDebouncedValue(query.trim(), 300)
  const locations = useQuery({
    queryKey: ['inventory', 'locations', { page: 1, limit: 50, search, picker: true }],
    queryFn: () =>
      inventoryApi.locations({ page: 1, limit: 50, search: search || undefined, sort: 'name' }),
    placeholderData: keepPreviousData,
    meta: { silent: true },
  })
  const options = (locations.data?.items ?? []).map((item) => ({
    value: String(item.id),
    label: item.name,
    hint: item.code,
  }))
  return (
    <RemoteCombobox
      {...props}
      options={options}
      loading={locations.isFetching}
      onSearch={setQuery}
      searchPlaceholder='Search room, lab or office'
      emptyText='No locations yet. Add them in Masters.'
    />
  )
}

const statusList = (status?: AssetStatus | AssetStatus[]) =>
  status === undefined ? [] : Array.isArray(status) ? status : [status]

const statusText = (statuses: AssetStatus[]) =>
  statuses.map((item) => ASSET_STATUS[item].label.toLowerCase()).join(' or ')

export function AssetPicker({
  status,
  ...props
}: PickerProps & { status?: AssetStatus | AssetStatus[] }) {
  const statuses = statusList(status)
  const [query, setQuery] = useState('')
  const search = useDebouncedValue(query.trim(), 300)
  const assets = useQuery({
    queryKey: ['inventory', 'assets', { page: 1, limit: 20, search, status, picker: true }],
    queryFn: () => inventoryApi.assets({ page: 1, limit: 20, search: search || undefined, status }),
    placeholderData: keepPreviousData,
    meta: { silent: true },
  })
  const options = (assets.data?.items ?? []).map((asset) => ({
    value: String(asset.id),
    label: `${asset.asset_tag} · ${asset.name}`,
    hint: statuses.length === 1 ? undefined : ASSET_STATUS[asset.status].label,
  }))
  return (
    <RemoteCombobox
      {...props}
      options={options}
      loading={assets.isFetching}
      onSearch={setQuery}
      searchPlaceholder='Search tag, name or serial number'
      emptyText={statuses.length ? `No assets ${statusText(statuses)}` : 'No assets'}
    />
  )
}

export function StockItemPicker(props: PickerProps & { storeId?: number }) {
  const { storeId, ...rest } = props
  const [query, setQuery] = useState('')
  const search = useDebouncedValue(query.trim(), 300)
  const items = useQuery({
    queryKey: [
      'inventory',
      'stock-items',
      { page: 1, limit: 30, search, store_id: storeId, picker: true },
    ],
    queryFn: () =>
      inventoryApi.stockItems({
        page: 1,
        limit: 30,
        search: search || undefined,
        store_id: storeId,
        is_active: true,
        sort: 'name',
        order: 'asc',
      }),
    placeholderData: keepPreviousData,
    meta: { silent: true },
  })
  const options = (items.data?.items ?? []).map((item) => ({
    value: String(item.id),
    label: item.name,
    hint: `${item.quantity.toLocaleString('en-IN')} ${item.unit}`,
  }))
  return (
    <RemoteCombobox
      {...rest}
      options={options}
      loading={items.isFetching}
      onSearch={setQuery}
      searchPlaceholder='Search item name or code'
      emptyText='No stock items yet'
    />
  )
}

function LocalPicker({
  id,
  label,
  value,
  onChange,
  placeholder,
  allLabel,
  invalid,
  className,
  options,
  loading,
  emptyText,
}: PickerProps & { options: ComboboxOption[]; loading: boolean; emptyText: string }) {
  return (
    <Combobox
      id={id}
      label={label}
      value={value}
      options={options}
      allLabel={allLabel}
      placeholder={placeholder ?? `Choose ${label.toLowerCase()}`}
      searchPlaceholder={`Search ${label.toLowerCase()}`}
      emptyText={loading ? 'Loading…' : emptyText}
      invalid={invalid}
      highlightSelected={Boolean(allLabel)}
      className={cn(!allLabel && fieldClass, className)}
      onChange={(next) =>
        onChange(
          next,
          options.find((option) => option.value === next)
        )
      }
    />
  )
}

export function CategoryPicker({
  kind,
  exclude,
  ...props
}: PickerProps & { kind?: CategoryKind; exclude?: number }) {
  const categories = useCategories(kind)
  const options = (categories.data ?? [])
    .filter((item) => item.id !== exclude)
    .map((item) => ({
      value: String(item.id),
      label: item.parent ? `${item.parent.name} › ${item.name}` : item.name,
      hint: item.code,
    }))
  return (
    <LocalPicker
      {...props}
      options={options}
      loading={categories.isPending}
      emptyText='No categories yet. Add them in Masters.'
    />
  )
}

export function DepartmentPicker(props: PickerProps) {
  const departments = useDepartments()
  const options = (departments.data ?? []).map((item) => ({
    value: String(item.id),
    label: item.name,
    hint: item.code,
  }))
  return (
    <LocalPicker
      {...props}
      options={options}
      loading={departments.isPending}
      emptyText='No departments yet. Add them in Masters.'
    />
  )
}

export function VendorPicker(props: PickerProps) {
  const vendors = useVendors()
  const options = (vendors.data ?? []).map((item) => ({
    value: String(item.id),
    label: item.name,
    hint: item.is_active ? undefined : 'Inactive',
  }))
  return (
    <LocalPicker
      {...props}
      options={options}
      loading={vendors.isPending}
      emptyText='No vendors yet. Add them in Masters.'
    />
  )
}

export function StorePicker(props: PickerProps) {
  const stores = useStores()
  const options = (stores.data ?? []).map((item) => ({
    value: String(item.id),
    label: item.name,
    hint: item.code,
  }))
  return (
    <LocalPicker
      {...props}
      options={options}
      loading={stores.isPending}
      emptyText='No stores yet. Add one in Masters.'
    />
  )
}

export function SectionPicker(props: PickerProps) {
  const sections = useSections()
  const options = (sections.data ?? []).map((item) => ({
    value: String(item.id),
    label: `${item.class_name} ${item.name}`,
    hint: item.room ?? undefined,
  }))
  return (
    <LocalPicker
      {...props}
      options={options}
      loading={sections.isPending}
      emptyText='No classes set up yet'
    />
  )
}

export function TargetFields({
  idPrefix,
  value,
  onChange,
  error,
}: {
  idPrefix: string
  value: TargetValue
  onChange: (value: TargetValue) => void
  error?: string
}) {
  return (
    <div className='grid gap-2'>
      <SegmentedControl
        label='Give to'
        value={value.assignee_type}
        onChange={(assignee_type) => onChange({ ...value, assignee_type })}
        options={(Object.keys(ASSIGNEE_TYPE) as AssigneeType[]).map((type) => ({
          value: type,
          label: ASSIGNEE_TYPE[type],
        }))}
        className='justify-self-start'
      />
      {value.assignee_type === 'staff' && (
        <StaffPicker
          id={`${idPrefix}-staff`}
          label='Staff member'
          value={value.user_id}
          invalid={Boolean(error)}
          onChange={(user_id) => onChange({ ...value, user_id })}
        />
      )}
      {value.assignee_type === 'department' && (
        <DepartmentPicker
          id={`${idPrefix}-department`}
          label='Department'
          value={value.department_id}
          invalid={Boolean(error)}
          onChange={(department_id) => onChange({ ...value, department_id })}
        />
      )}
      {value.assignee_type === 'location' && (
        <LocationPicker
          id={`${idPrefix}-location`}
          label='Location'
          value={value.location_id}
          invalid={Boolean(error)}
          onChange={(location_id) => onChange({ ...value, location_id })}
        />
      )}
      {error && (
        <p role='alert' className='text-xs font-medium text-destructive'>
          {error}
        </p>
      )}
    </div>
  )
}

export type PickedAsset = Pick<Asset, 'id' | 'asset_tag' | 'name' | 'status'>

export function AssetMultiPicker({
  id,
  value,
  onChange,
  statuses,
  invalid,
}: {
  id: string
  value: PickedAsset[]
  onChange: (value: PickedAsset[]) => void
  statuses: AssetStatus[]
  invalid?: boolean
}) {
  const status = statuses.join(',')
  const [query, setQuery] = useState('')
  const search = useDebouncedValue(query.trim(), 300)
  const assets = useQuery({
    queryKey: ['inventory', 'assets', { page: 1, limit: 8, search, status, picker: true }],
    queryFn: () =>
      inventoryApi.assets({ page: 1, limit: 8, search: search || undefined, status: statuses }),
    placeholderData: keepPreviousData,
    meta: { silent: true },
  })
  const chosen = new Set(value.map((asset) => asset.id))
  const toggle = (asset: PickedAsset) =>
    onChange(
      chosen.has(asset.id)
        ? value.filter((item) => item.id !== asset.id)
        : [
            ...value,
            { id: asset.id, asset_tag: asset.asset_tag, name: asset.name, status: asset.status },
          ]
    )
  const rows = assets.data?.items ?? []

  return (
    <div className={cn('grid gap-2 rounded-lg border p-2', invalid && 'border-destructive')}>
      {value.length > 0 && (
        <div className='flex flex-wrap gap-1.5'>
          {value.map((asset) => (
            <Badge key={asset.id} tone='info' className='max-w-full gap-1 pr-1'>
              <span className='truncate font-mono text-[11px]'>{asset.asset_tag}</span>
              <button
                type='button'
                aria-label={`Remove ${asset.asset_tag}`}
                onClick={() => toggle(asset)}
                className='grid size-4 place-items-center rounded-full hover:bg-info/20'
              >
                <X className='size-3' />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className='flex flex-wrap items-center gap-2'>
        <div className='relative min-w-0 flex-1'>
          <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            id={id}
            type='search'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return
              event.preventDefault()
              const exact = rows.find(
                (asset) => asset.asset_tag.toLowerCase() === query.trim().toLowerCase()
              )
              if (exact && !chosen.has(exact.id)) {
                toggle(exact)
                setQuery('')
              }
            }}
            placeholder='Search or scan a tag'
            aria-label='Search assets'
            className='pl-9'
          />
        </div>
      </div>
      <div className='max-h-56 overflow-y-auto'>
        {assets.isPending ? (
          <div className='grid gap-1'>
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className='h-9' />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className='px-2 py-4 text-center text-sm text-muted-foreground'>
            No assets {statusText(statuses)}
            {search ? ' match this search' : ''}
          </p>
        ) : (
          <ul className='grid gap-0.5'>
            {rows.map((asset) => {
              const selected = chosen.has(asset.id)
              return (
                <li key={asset.id}>
                  <button
                    type='button'
                    aria-pressed={selected}
                    onClick={() => toggle(asset)}
                    className={cn(
                      'flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40',
                      selected && 'bg-primary/5'
                    )}
                  >
                    <span
                      className={cn(
                        'grid size-4 shrink-0 place-items-center rounded border',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input bg-card'
                      )}
                    >
                      {selected && <Check className='size-3' strokeWidth={3} />}
                    </span>
                    <span className='grid min-w-0 flex-1'>
                      <span className='truncate font-semibold'>{asset.name}</span>
                      <span className='truncate font-mono text-[11px] text-muted-foreground'>
                        {asset.asset_tag}
                        {statuses.length > 1 ? ` · ${ASSET_STATUS[asset.status].label}` : ''}
                        {asset.current_allocation
                          ? ` · ${asset.current_allocation.assignee.name}`
                          : asset.location
                            ? ` · ${asset.location.name}`
                            : ''}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      {(assets.data?.total ?? 0) > rows.length && (
        <p className='px-2 text-[11px] text-muted-foreground'>
          Showing {rows.length} of {assets.data?.total}. Search to narrow down.
        </p>
      )}
    </div>
  )
}

export function ScanInput({
  id,
  label,
  onSubmit,
  loading,
  placeholder = 'Scan or type an asset tag',
  autoFocus = true,
  className,
}: {
  id: string
  label: string
  onSubmit: (code: string) => void | Promise<void>
  loading?: boolean
  placeholder?: string
  autoFocus?: boolean
  className?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [code, setCode] = useState('')

  const submit = async () => {
    const value = code.trim()
    if (!value || loading) return
    setCode('')
    await onSubmit(value)
    ref.current?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      void submit()
    }
  }

  return (
    <div className={cn('flex w-full gap-2', className)}>
      <div className='relative min-w-0 flex-1'>
        <ScanLine className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          ref={ref}
          id={id}
          value={code}
          autoFocus={autoFocus}
          autoComplete='off'
          spellCheck={false}
          onChange={(event) => setCode(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label={label}
          className='pl-9 font-mono'
        />
      </div>
      <Button type='button' variant='outline' loading={loading} onClick={() => void submit()}>
        Go
      </Button>
    </div>
  )
}
