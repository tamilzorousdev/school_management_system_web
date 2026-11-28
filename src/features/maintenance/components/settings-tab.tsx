import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CircleOff, History, Lock, LockOpen, PenLine, Plus, Store } from 'lucide-react'
import { z } from 'zod'
import { Combobox } from '@/components/common/combobox'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { TrashIcon } from '@/components/common/icon'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { today } from '@/features/attendance/labels'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import {
  maintenanceApi,
  useFleetSettings,
  useMaintenanceMutation,
  useVendors,
  type FleetSettings,
  type Vendor,
  type VendorKind,
} from '../api'
import { VENDOR_KIND, VENDOR_KIND_OPTIONS, rupees } from '../labels'
import type { TabProps } from '../search'
import { HistoryModal } from './history-modal'
import { applyFieldErrors } from '../helpers'
import { FormAlert, MAINTENANCE_INPUT_CLASS } from './shared'
import { VendorFormModal } from './vendor-form-modal'

const LIMIT = 20
const FORM_ID = 'fleet-settings-form'

const whole = (min: number, max: number, message: string) =>
  z
    .string()
    .trim()
    .refine((value) => {
      const number = Number(value)
      return value !== '' && Number.isInteger(number) && number >= min && number <= max
    }, message)

const schema = z.object({
  due_soon_km: whole(50, 5000, 'Enter 50 to 5000 km'),
  due_soon_days: whole(1, 90, 'Enter 1 to 90 days'),
  low_mileage_drop_pct: whole(5, 60, 'Enter 5 to 60 percent'),
  price_warning_pct: whole(5, 50, 'Enter 5 to 50 percent'),
  idle_litres_per_hour: z
    .string()
    .trim()
    .refine((value) => {
      const number = Number(value)
      return value !== '' && Number.isFinite(number) && number >= 0.5 && number <= 10
    }, 'Enter 0.5 to 10 litres'),
})

type FormValues = z.infer<typeof schema>
const FIELDS: (keyof FormValues)[] = [
  'due_soon_km',
  'due_soon_days',
  'low_mileage_drop_pct',
  'price_warning_pct',
  'idle_litres_per_hour',
]

const monthEnds = () => {
  const [year, month] = today().split('-').map(Number)
  return Array.from({ length: 24 }, (_, index) => {
    const end = new Date(Date.UTC(year, month - 1 - index, 0))
    return {
      value: end.toISOString().slice(0, 10),
      label: end.toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    }
  })
}

export function SettingsTab({ canManage, adding, onAddingChange }: TabProps) {
  const settings = useFleetSettings()
  const [historyOpen, setHistoryOpen] = useState(false)

  return (
    <>
      <div className='grid gap-4 lg:grid-cols-2'>
        <Card className='grid content-start gap-4 p-4'>
          <div className='flex items-start justify-between gap-2'>
            <div className='grid min-w-0 gap-0.5'>
              <span className='text-sm font-bold text-slate-900 dark:text-slate-100'>
                Alerts and rules
              </span>
              <span className='text-sm text-muted-foreground'>
                When services show as due soon, and when fuel and mileage are flagged.
              </span>
            </div>
            <Button
              variant='ghost'
              size='sm'
              className='shrink-0'
              onClick={() => setHistoryOpen(true)}
            >
              <History className='size-3.5' />
              History
            </Button>
          </div>
          {settings.isPending ? (
            <Skeleton className='h-64' />
          ) : settings.isError ? (
            <ErrorState message={settings.error.message} onRetry={() => settings.refetch()} />
          ) : (
            <SettingsForm
              key={JSON.stringify(settings.data)}
              settings={settings.data}
              canManage={canManage}
            />
          )}
        </Card>
        <div className='grid content-start gap-4'>
          {settings.data && <PreTripRule settings={settings.data} canManage={canManage} />}
          {settings.data && <MonthLock settings={settings.data} canManage={canManage} />}
        </div>
      </div>
      <VendorsCard canManage={canManage} adding={adding} onAddingChange={onAddingChange} />
      <HistoryModal
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        entity='settings'
        title='Changes to maintenance settings and month locks'
      />
    </>
  )
}

function SettingsForm({ settings, canManage }: { settings: FleetSettings; canManage: boolean }) {
  const save = useMaintenanceMutation((input: Partial<FleetSettings>) =>
    maintenanceApi.updateSettings(input)
  )
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      due_soon_km: String(settings.due_soon_km),
      due_soon_days: String(settings.due_soon_days),
      low_mileage_drop_pct: String(settings.low_mileage_drop_pct),
      price_warning_pct: String(settings.price_warning_pct),
      idle_litres_per_hour: String(settings.idle_litres_per_hour),
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync({
        due_soon_km: Number(values.due_soon_km),
        due_soon_days: Number(values.due_soon_days),
        low_mileage_drop_pct: Number(values.low_mileage_drop_pct),
        price_warning_pct: Number(values.price_warning_pct),
        idle_litres_per_hour: Number(values.idle_litres_per_hour),
      })
      alerts.success('Settings saved')
    } catch (error) {
      const apiError = toApiError(error)
      if (!applyFieldErrors(apiError, FIELDS, setError))
        setError('root', { message: apiError.message })
    }
  })

  const field = (
    name: keyof FormValues,
    label: string,
    hint: string,
    props: { min: number; max: number; step?: string }
  ) => (
    <FormField id={`settings-${name}`} label={label} error={errors[name]?.message} hint={hint}>
      <Input
        id={`settings-${name}`}
        type='number'
        inputMode='decimal'
        disabled={!canManage}
        min={props.min}
        max={props.max}
        step={props.step ?? '1'}
        className={MAINTENANCE_INPUT_CLASS}
        aria-invalid={Boolean(errors[name]) || undefined}
        {...register(name)}
      />
    </FormField>
  )

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4 sm:grid-cols-2'>
      <FormAlert message={errors.root?.message} />
      {field('due_soon_km', 'Due soon within (km)', 'A service shows as due soon this close', {
        min: 50,
        max: 5000,
      })}
      {field('due_soon_days', 'Due soon within (days)', 'Or this many days before it is due', {
        min: 1,
        max: 90,
      })}
      {field(
        'low_mileage_drop_pct',
        'Low mileage alert (%)',
        'When km/l drops this much below the bus normal',
        { min: 5, max: 60 }
      )}
      {field(
        'price_warning_pct',
        'Fuel price warning (%)',
        'When the price per litre is this far from the bus average',
        { min: 5, max: 50 }
      )}
      {field(
        'idle_litres_per_hour',
        'Idling burns (litres an hour)',
        'Used for the idle fuel report',
        { min: 0.5, max: 10, step: '0.1' }
      )}
      {canManage && (
        <div className='flex items-end sm:col-span-2'>
          <Button type='submit' variant='primary' loading={save.isPending} disabled={!isDirty}>
            Save settings
          </Button>
        </div>
      )}
    </form>
  )
}

function PreTripRule({ settings, canManage }: { settings: FleetSettings; canManage: boolean }) {
  const save = useMaintenanceMutation((value: boolean) =>
    maintenanceApi.updateSettings({ pre_trip_check_required: value })
  )
  return (
    <Card className='grid gap-3 p-4'>
      <div className='flex items-start justify-between gap-3'>
        <div className='grid gap-0.5'>
          <label
            htmlFor='settings-pre-trip'
            className='text-sm font-bold text-slate-900 dark:text-slate-100'
          >
            Pre-trip check before the first trip
          </label>
          <span className='text-sm text-muted-foreground'>
            {settings.pre_trip_check_required
              ? 'Required: a bus cannot start its first trip of the day until the driver ticks the 10-point check.'
              : 'Optional: drivers can still do the check, but trips start without it.'}
          </span>
        </div>
        <Switch
          id='settings-pre-trip'
          checked={settings.pre_trip_check_required}
          disabled={!canManage || save.isPending}
          onCheckedChange={async (checked) => {
            try {
              await save.mutateAsync(checked)
              alerts.success(
                checked ? 'Pre-trip check is now required' : 'Pre-trip check is now optional'
              )
            } catch (error) {
              alerts.error(toApiError(error).message)
            }
          }}
        />
      </div>
    </Card>
  )
}

function MonthLock({ settings, canManage }: { settings: FleetSettings; canManage: boolean }) {
  const options = monthEnds()
  const [month, setMonth] = useState<string | undefined>(options[0]?.value)
  const [confirm, setConfirm] = useState<'lock' | 'unlock' | null>(null)
  const save = useMaintenanceMutation((value: string | null) =>
    maintenanceApi.updateSettings({ locked_until: value })
  )
  const chosen = options.find((option) => option.value === month)

  return (
    <Card className='grid gap-3 p-4'>
      <div className='grid gap-0.5'>
        <span className='flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100'>
          Month lock
          {settings.locked_until ? (
            <Badge tone='warning' className='font-medium'>
              <Lock className='size-3' />
              Locked to {formatDate(settings.locked_until)}
            </Badge>
          ) : (
            <Badge tone='neutral' className='font-medium'>
              Nothing locked
            </Badge>
          )}
        </span>
        <span className='text-sm text-muted-foreground'>
          Once the accounts for a month are closed, lock it so fuel entries, expenses and services
          up to its last day cannot be added, changed or deleted.
        </span>
      </div>
      {canManage && (
        <div className='flex flex-wrap items-center gap-2'>
          <Combobox
            id='settings-lock-month'
            label='Lock up to the end of'
            value={month}
            options={options}
            placeholder='Choose a month'
            searchPlaceholder='Search months'
            highlightSelected={false}
            className='w-full sm:w-56'
            onChange={setMonth}
          />
          <Button variant='primary' size='sm' disabled={!month} onClick={() => setConfirm('lock')}>
            <Lock className='size-3.5' />
            Lock
          </Button>
          {settings.locked_until && (
            <Button variant='outline' size='sm' onClick={() => setConfirm('unlock')}>
              <LockOpen className='size-3.5' />
              Unlock
            </Button>
          )}
        </div>
      )}
      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm === 'unlock' ? 'Unlock every month?' : `Lock up to ${chosen?.label ?? ''}?`}
        description={
          confirm === 'unlock'
            ? 'Entries in past months can be changed again. The change is kept in the history.'
            : `Entries dated up to ${chosen ? formatDate(chosen.value) : ''} can no longer be added, changed or deleted until you unlock.`
        }
        confirmText={confirm === 'unlock' ? 'Unlock' : 'Lock'}
        loading={save.isPending}
        onConfirm={async () => {
          try {
            await save.mutateAsync(confirm === 'unlock' ? null : (month ?? null))
            alerts.success(confirm === 'unlock' ? 'Months unlocked' : 'Month locked')
            setConfirm(null)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      />
    </Card>
  )
}

function VendorsCard({
  canManage,
  adding,
  onAddingChange,
}: {
  canManage: boolean
  adding: boolean
  onAddingChange: (open: boolean) => void
}) {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(LIMIT)
  const [searchText, setSearchText] = useState('')
  const [kind, setKind] = useState<VendorKind | undefined>()
  const [editing, setEditing] = useState<Vendor | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState<Vendor | null>(null)
  if (adding && !editOpen && editing) setEditing(null)
  const vendors = useVendors({ page, limit, search: searchText || undefined, kind })
  const remove = useMaintenanceMutation((id: number) => maintenanceApi.removeVendor(id))
  const rows = vendors.data?.items ?? []

  const openEdit = (vendor: Vendor) => {
    setEditing(vendor)
    setEditOpen(true)
  }

  const columns: Column<Vendor>[] = [
    {
      key: 'name',
      header: 'NAME',
      cell: (vendor) => (
        <div className='grid min-w-0'>
          <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
            {vendor.name}
          </span>
          <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            {[vendor.phone, vendor.address].filter(Boolean).join(' · ') || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'kind',
      header: 'KIND',
      cell: (vendor) => (
        <span className='flex flex-wrap gap-1'>
          <Badge tone={vendor.kind === 'fuel_station' ? 'info' : 'neutral'} className='font-medium'>
            {VENDOR_KIND[vendor.kind]}
          </Badge>
          {!vendor.is_active && (
            <Badge tone='warning' className='font-medium'>
              Inactive
            </Badge>
          )}
        </span>
      ),
    },
    {
      key: 'gst',
      header: 'GSTIN',
      hideBelow: 'xl',
      cell: (vendor) => (
        <span className='font-mono text-[12px] leading-[16px] text-slate-700 dark:text-slate-300'>
          {vendor.gst_no ?? '—'}
        </span>
      ),
    },
    {
      key: 'spent',
      header: 'TOTAL SPENT',
      align: 'right',
      cell: (vendor) => (
        <span className='text-[13px] leading-[18px] font-semibold text-slate-900 tabular-nums dark:text-slate-100'>
          {rupees(vendor.total_spent)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'ACTION',
      align: 'right',
      className: 'w-24',
      cell: (vendor) =>
        canManage && (
          <div className='inline-flex gap-1'>
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={`Edit ${vendor.name}`}
              title='Edit'
              className='text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              onClick={(event) => {
                event.stopPropagation()
                openEdit(vendor)
              }}
            >
              <PenLine className='size-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={`Remove ${vendor.name}`}
              title='Delete'
              className='text-[#D92D20] hover:bg-destructive/10 hover:text-[#B42318] dark:text-red-400 dark:hover:bg-destructive/10 dark:hover:text-red-300'
              onClick={(event) => {
                event.stopPropagation()
                setDeleting(vendor)
              }}
            >
              <TrashIcon className='size-4' />
            </Button>
          </div>
        ),
    },
  ]

  const filtered = Boolean(searchText || kind)

  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
        <div className='grid gap-0.5'>
          <span className='text-sm font-bold text-slate-900 dark:text-slate-100'>
            Garages and fuel stations
          </span>
          <span className='text-sm text-muted-foreground'>
            Pick them in services, fuel entries and expenses to see the total spent with each.
          </span>
        </div>
        {canManage && (
          <Button variant='outline' size='sm' onClick={() => onAddingChange(true)}>
            <Plus className='size-3.5' />
            Add garage or station
          </Button>
        )}
      </div>
      <ListToolbar
        summary={vendors.data ? `${vendors.data.total} saved` : ''}
        onClear={
          filtered
            ? () => {
                setSearchText('')
                setKind(undefined)
                setPage(1)
              }
            : undefined
        }
      >
        <SearchBox
          value={searchText}
          onChange={(value) => {
            setSearchText(value)
            setPage(1)
          }}
          placeholder='Search name or phone'
          label='Search garages and stations'
          compact
          showShortcut={false}
        />
        <FilterSelect
          id='vendor-kind-filter'
          label='Filter by kind'
          allLabel='All kinds'
          value={kind}
          options={VENDOR_KIND_OPTIONS}
          onChange={(value) => {
            setKind(value as VendorKind | undefined)
            setPage(1)
          }}
        />
      </ListToolbar>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(vendor) => vendor.id}
        loading={vendors.isFetching}
        error={vendors.isError ? vendors.error.message : null}
        onRetry={() => vendors.refetch()}
        onRowClick={canManage ? openEdit : undefined}
        empty={{
          icon: filtered ? CircleOff : Store,
          title: filtered ? 'Nothing matches' : 'No garages or fuel stations saved yet',
          description: filtered
            ? 'Try another name or kind.'
            : 'Save the garages and fuel stations you use so they can be picked from a list.',
        }}
        card={(vendor) => (
          <div className='flex items-start justify-between gap-2'>
            <div className='grid min-w-0 gap-1'>
              <span className='font-bold'>{vendor.name}</span>
              <span className='flex flex-wrap gap-1'>
                <Badge tone={vendor.kind === 'fuel_station' ? 'info' : 'neutral'}>
                  {VENDOR_KIND[vendor.kind]}
                </Badge>
                {!vendor.is_active && <Badge tone='warning'>Inactive</Badge>}
              </span>
              {vendor.phone && (
                <span className='text-xs text-muted-foreground'>{vendor.phone}</span>
              )}
            </div>
            <span className='tabular font-bold'>{rupees(vendor.total_spent)}</span>
          </div>
        )}
        pagination={{
          page,
          limit,
          total: vendors.data?.total ?? 0,
          label: 'saved',
          onPageChange: setPage,
          onLimitChange: (next) => {
            setLimit(next)
            setPage(1)
          },
        }}
      />
      <VendorFormModal
        open={adding || editOpen}
        onOpenChange={(open) => {
          if (open) return
          onAddingChange(false)
          setEditOpen(false)
        }}
        vendor={editing}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Remove ${deleting?.name ?? ''}?`}
        description='It is taken off the pickers. Old entries keep its name.'
        confirmText='Remove'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return
          try {
            await remove.mutateAsync(deleting.id)
            alerts.success('Removed')
            setDeleting(null)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      />
    </Card>
  )
}
