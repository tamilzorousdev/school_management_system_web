import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Bus, CircleOff, Download, NotebookText, Settings2 } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useBusOptions } from '@/features/transport/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  maintenanceApi,
  useMaintenanceMutation,
  useVehicleLog,
  useVehicleSummary,
  type VehicleLogEntry,
  type VehiclePlanInput,
  type VehicleSummary,
} from '../api'
import {
  LOG_TYPE,
  LOG_TYPE_OPTIONS,
  numberText,
  optionalNumber,
  rupees,
  wholeText,
} from '../labels'
import type { MaintenanceSearch, TabProps } from '../search'
import { DueBadge, DueLeft } from './schedules-tab'
import { applyFieldErrors } from '../helpers'
import { DateRangeInputs, FormAlert } from './shared'

const LIMIT = 20

const SOURCE_TEXT = {
  tracker: 'from the GPS tracker',
  entries: 'from the last entry',
  none: 'no reading yet',
}

function Stat({
  label,
  value,
  hint,
  danger,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  danger?: boolean
}) {
  return (
    <div className='grid min-w-0 content-start gap-0.5 rounded-lg border p-3'>
      <span className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
        {label}
      </span>
      <span className={cn('tabular truncate text-lg font-bold', danger && 'text-destructive')}>
        {value}
      </span>
      {hint && <span className='text-xs text-muted-foreground'>{hint}</span>}
    </div>
  )
}

function SummaryHeader({
  summary,
  canManage,
  onEditPlan,
}: {
  summary: VehicleSummary
  canManage: boolean
  onEditPlan: () => void
}) {
  const over = summary.monthly_budget !== null && summary.spent_this_month > summary.monthly_budget
  return (
    <Card className='grid gap-3 p-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex min-w-0 flex-wrap items-center gap-2'>
          <span className='font-bold'>{summary.vehicle.name}</span>
          <span className='font-mono text-xs text-muted-foreground'>
            {summary.vehicle.registration_no}
          </span>
          {summary.off_road && <Badge tone='danger'>Off road</Badge>}
          {over && <Badge tone='danger'>Over budget</Badge>}
        </div>
        {canManage && (
          <Button variant='outline' size='sm' onClick={onEditPlan}>
            <Settings2 />
            Edit tank and budget
          </Button>
        )}
      </div>
      <div className='grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-6'>
        <Stat
          label='Odometer'
          value={formatNumber(summary.current_km, 0, 'km')}
          hint={SOURCE_TEXT[summary.odometer_source]}
        />
        <Stat
          label='Next service'
          value={summary.next_service ? summary.next_service.title : 'None set'}
          hint={
            summary.next_service ? (
              <span className='flex flex-wrap items-center gap-1'>
                <DueBadge schedule={summary.next_service} />
                <DueLeft schedule={summary.next_service} />
              </span>
            ) : (
              'Add rules in Schedules'
            )
          }
        />
        <Stat
          label='Spent this month'
          value={rupees(summary.spent_this_month)}
          hint={
            summary.monthly_budget !== null
              ? `of ${rupees(summary.monthly_budget)} budget`
              : 'No budget set'
          }
          danger={over}
        />
        <Stat
          label='Fuel this month'
          value={rupees(summary.fuel_this_month)}
          hint={
            summary.tank_litres !== null
              ? `Tank ${formatNumber(summary.tank_litres, 0, 'L')}`
              : 'Tank size not set'
          }
        />
        <Stat
          label='Mileage this month'
          value={formatNumber(summary.km_per_litre_this_month, 2, 'km/l')}
          hint='Full-tank fills'
        />
        <Stat
          label='Open tickets'
          value={summary.open_tickets}
          hint={summary.off_road ? 'Bus is off road' : 'Bus can run'}
          danger={summary.off_road}
        />
      </div>
    </Card>
  )
}

export function BusLogTab({ search, setSearch, onPageChange, onClear, canManage }: TabProps) {
  const busOptions = useBusOptions()
  const [planOpen, setPlanOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const vehicleId = search.vehicle_id ?? (busOptions[0] ? Number(busOptions[0].value) : undefined)
  const summary = useVehicleSummary(vehicleId)
  const filters = {
    search: search.search,
    type: search.log_type,
    from: search.from,
    to: search.to,
  }
  const log = useVehicleLog(vehicleId, { page: search.page, limit: LIMIT, ...filters })
  const rows = log.data?.items ?? []

  const download = async () => {
    if (!vehicleId) return
    setDownloading(true)
    try {
      await maintenanceApi.downloadLog(
        vehicleId,
        filters,
        summary.data?.vehicle.registration_no.replace(/\s+/g, '') ?? String(vehicleId)
      )
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setDownloading(false)
    }
  }

  const columns: Column<VehicleLogEntry>[] = [
    {
      key: 'on',
      header: 'Date',
      cell: (entry) => <span className='tabular font-semibold'>{formatDate(entry.on)}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      cell: (entry) => <Badge tone={LOG_TYPE[entry.type].tone}>{LOG_TYPE[entry.type].label}</Badge>,
    },
    {
      key: 'title',
      header: 'What',
      cell: (entry) => (
        <div className='grid min-w-0'>
          <span className='font-semibold'>{entry.title}</span>
          {entry.detail && (
            <span className='line-clamp-1 text-xs text-muted-foreground'>{entry.detail}</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      hideBelow: 'lg',
      cell: (entry) => (
        <span className='text-muted-foreground capitalize'>
          {entry.status?.replace(/_/g, ' ') ?? '—'}
        </span>
      ),
    },
    {
      key: 'odometer',
      header: 'Odometer',
      align: 'right',
      hideBelow: 'xl',
      cell: (entry) => <span className='tabular'>{formatNumber(entry.odometer_km, 0, 'km')}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      cell: (entry) => <span className='tabular font-semibold'>{rupees(entry.amount)}</span>,
    },
  ]

  const filtered = Boolean(search.search || search.log_type || search.from || search.to)

  return (
    <>
      <Card className='flex flex-wrap items-center gap-2 p-4'>
        <Combobox
          id='bus-log-bus'
          label='Bus'
          value={vehicleId ? String(vehicleId) : undefined}
          options={busOptions}
          placeholder='Choose a bus'
          searchPlaceholder='Search buses'
          emptyText='No buses yet'
          className='w-full sm:w-80'
          onChange={(value) => setSearch({ vehicle_id: value ? Number(value) : undefined })}
        />
        <span className='text-sm text-muted-foreground'>
          Every fill, service, repair, expense and pre-trip check of one bus.
        </span>
      </Card>
      {!vehicleId ? (
        <Card>
          <EmptyState icon={Bus} title='No buses yet' description='Add buses in Vehicle Master.' />
        </Card>
      ) : summary.isPending ? (
        <Skeleton className='h-40' />
      ) : summary.data ? (
        <SummaryHeader
          summary={summary.data}
          canManage={canManage}
          onEditPlan={() => setPlanOpen(true)}
        />
      ) : null}
      {vehicleId && (
        <Card className='overflow-hidden'>
          <ListToolbar
            summary={
              log.data ? `${log.data.total} ${log.data.total === 1 ? 'entry' : 'entries'}` : ''
            }
            onClear={filtered ? onClear : undefined}
          >
            <SearchBox
              value={search.search ?? ''}
              onChange={(value) => setSearch({ search: value || undefined })}
              placeholder='Search the log'
              label='Search bus log'
            />
            <FilterSelect
              id='bus-log-type-filter'
              label='Filter by type'
              allLabel='All types'
              value={search.log_type}
              options={LOG_TYPE_OPTIONS}
              onChange={(value) => setSearch({ log_type: value as MaintenanceSearch['log_type'] })}
            />
            <DateRangeInputs from={search.from} to={search.to} onChange={setSearch} />
            <Button variant='outline' onClick={download} loading={downloading}>
              <Download />
              Excel
            </Button>
          </ListToolbar>
          <DataTable
            rows={rows}
            columns={columns}
            rowKey={(entry) => `${entry.type}-${entry.id}`}
            loading={log.isFetching}
            error={log.isError ? log.error.message : null}
            onRetry={() => log.refetch()}
            empty={{
              icon: filtered ? CircleOff : NotebookText,
              title: filtered ? 'Nothing matches these filters' : 'Nothing logged for this bus yet',
              description: filtered
                ? 'Try another type or dates, or clear the filters.'
                : 'Fuel fills, services, repairs, expenses and checks show here as they are added.',
            }}
            card={(entry) => (
              <div className='grid gap-1'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='grid min-w-0'>
                    <span className='font-bold'>{entry.title}</span>
                    <span className='tabular text-xs text-muted-foreground'>
                      {formatDate(entry.on)}
                      {entry.odometer_km !== null
                        ? ` · ${formatNumber(entry.odometer_km, 0, 'km')}`
                        : ''}
                    </span>
                  </div>
                  <span className='tabular font-bold'>{rupees(entry.amount)}</span>
                </div>
                <span className='flex flex-wrap items-center gap-1'>
                  <Badge tone={LOG_TYPE[entry.type].tone}>{LOG_TYPE[entry.type].label}</Badge>
                  {entry.status && (
                    <span className='text-xs text-muted-foreground capitalize'>
                      {entry.status.replace(/_/g, ' ')}
                    </span>
                  )}
                </span>
                {entry.detail && (
                  <span className='text-xs text-muted-foreground'>{entry.detail}</span>
                )}
              </div>
            )}
            pagination={{
              page: search.page,
              limit: LIMIT,
              total: log.data?.total ?? 0,
              label: 'entries',
              onPageChange,
            }}
          />
        </Card>
      )}
      {summary.data && (
        <PlanModal open={planOpen} onOpenChange={setPlanOpen} summary={summary.data} />
      )}
    </>
  )
}

const planSchema = z.object({
  tank_litres: wholeText(10, 1000, 'Enter 10 to 1000 litres'),
  monthly_budget: numberText(1, 1_000_000, 'Enter ₹1 to ₹10,00,000'),
})

type PlanValues = z.infer<typeof planSchema>
const PLAN_FORM = 'bus-plan-form'

function PlanModal({
  open,
  onOpenChange,
  summary,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  summary: VehicleSummary
}) {
  const save = useMaintenanceMutation((input: VehiclePlanInput) =>
    maintenanceApi.updatePlan(summary.vehicle.id, input)
  )
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Tank and budget'
      description={`${summary.vehicle.name} · ${summary.vehicle.registration_no}`}
      formId={PLAN_FORM}
      submitText='Save'
      loading={save.isPending}
    >
      {open && (
        <PlanForm
          summary={summary}
          onSubmit={async (input) => {
            await save.mutateAsync(input)
            alerts.success('Bus plan saved')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function PlanForm({
  summary,
  onSubmit,
}: {
  summary: VehicleSummary
  onSubmit: (input: VehiclePlanInput) => Promise<void>
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PlanValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      tank_litres: summary.tank_litres?.toString() ?? '',
      monthly_budget: summary.monthly_budget?.toString() ?? '',
    },
  })
  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        tank_litres: optionalNumber(values.tank_litres) ?? null,
        monthly_budget: optionalNumber(values.monthly_budget) ?? null,
      })
    } catch (error) {
      const apiError = toApiError(error)
      if (!applyFieldErrors(apiError, ['tank_litres', 'monthly_budget'], setError))
        setError('root', { message: apiError.message })
    }
  })
  return (
    <form id={PLAN_FORM} onSubmit={submit} noValidate className='grid gap-4 sm:grid-cols-2'>
      <FormAlert message={errors.root?.message} />
      <FormField
        id='plan-tank'
        label='Fuel tank (litres)'
        error={errors.tank_litres?.message}
        hint='Fills bigger than the tank are refused'
      >
        <Input
          id='plan-tank'
          type='number'
          inputMode='numeric'
          min={10}
          max={1000}
          placeholder='160'
          aria-invalid={Boolean(errors.tank_litres) || undefined}
          {...register('tank_litres')}
        />
      </FormField>
      <FormField
        id='plan-budget'
        label='Monthly budget (₹)'
        error={errors.monthly_budget?.message}
        hint='The office is told when a month goes over it'
      >
        <Input
          id='plan-budget'
          type='number'
          inputMode='decimal'
          min={1}
          max={1_000_000}
          step='0.01'
          placeholder='40000'
          aria-invalid={Boolean(errors.monthly_budget) || undefined}
          {...register('monthly_budget')}
        />
      </FormField>
    </form>
  )
}
