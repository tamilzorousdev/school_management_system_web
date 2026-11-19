import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ClipboardCheck, Plus, SearchX } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState, ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { formatDate } from '@/lib/format'
import {
  inventoryApi,
  useAudit,
  useAudits,
  useInventoryMutation,
  type Audit,
  type AuditInput,
  type InventoryAccess,
} from '../api'
import { idOrUndefined } from '../labels'
import type { InventorySearch, InventorySearchPatch } from '../search'
import { auditScope } from './audit-scope'
import { AssetAuditView, AuditHeader, CloseAuditModal, StockCountView } from './audit-views'
import { applyApiError, textOrNull } from './master-errors'
import { CategoryPicker, DepartmentPicker, LocationPicker, StorePicker } from './pickers'

interface TabProps {
  search: InventorySearch
  onChange: (patch: InventorySearchPatch) => void
  access: InventoryAccess
}

export function AuditsTab(props: TabProps) {
  if (props.search.audit_id) return <AuditDetail id={props.search.audit_id} {...props} />
  return <AuditList {...props} />
}

function progress(audit: Audit) {
  return `${audit.checked}/${audit.expected} ${audit.kind === 'asset' ? 'scanned' : 'counted'}`
}

function AuditList({ onChange, access }: TabProps) {
  const audits = useAudits()
  const [starting, setStarting] = useState(false)
  const rows = audits.data ?? []

  const open = (audit: Audit) => onChange({ audit_id: audit.id, finding: undefined })

  const columns: Column<Audit>[] = [
    {
      key: 'name',
      header: 'Audit',
      cell: (audit) => (
        <span className='grid min-w-0'>
          <span className='truncate font-bold'>{audit.name}</span>
          <span className='truncate text-xs text-muted-foreground'>{auditScope(audit)}</span>
        </span>
      ),
    },
    {
      key: 'kind',
      header: 'Kind',
      cell: (audit) => (
        <Badge tone='info'>{audit.kind === 'asset' ? 'Asset verification' : 'Stock count'}</Badge>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      cell: (audit) => <span className='tabular'>{progress(audit)}</span>,
    },
    {
      key: 'issues',
      header: 'Issues',
      hideBelow: 'lg',
      cell: (audit) =>
        audit.kind === 'asset'
          ? `${audit.missing} missing · ${audit.misplaced} misplaced`
          : `${audit.differences} differences`,
    },
    {
      key: 'started',
      header: 'Started',
      hideBelow: 'xl',
      cell: (audit) => (
        <span className='text-muted-foreground'>
          {formatDate(audit.created_at)}
          {audit.started_by ? ` · ${audit.started_by}` : ''}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (audit) => (
        <Badge tone={audit.status === 'open' ? 'warning' : 'neutral'} dot>
          {audit.status === 'open' ? 'Open' : 'Closed'}
        </Badge>
      ),
    },
  ]

  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
        <p className='text-xs text-muted-foreground'>
          Verify assets by scanning their tags where they stand, or count the stock in a store. One
          open audit of each kind at a time.
        </p>
        {access.audit && (
          <Button onClick={() => setStarting(true)}>
            <Plus />
            Start audit
          </Button>
        )}
      </div>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(audit) => audit.id}
        loading={audits.isFetching}
        error={audits.isError ? audits.error.message : null}
        onRetry={() => audits.refetch()}
        onRowClick={open}
        empty={{
          icon: ClipboardCheck,
          title: 'No audits yet',
          description: 'Start a half-yearly asset verification or a stock count.',
          action: access.audit && (
            <Button onClick={() => setStarting(true)}>
              <Plus />
              Start audit
            </Button>
          ),
        }}
        card={(audit) => (
          <div className='grid gap-1.5'>
            <div className='flex items-start justify-between gap-2'>
              <span className='grid min-w-0'>
                <span className='truncate font-bold'>{audit.name}</span>
                <span className='truncate text-xs text-muted-foreground'>
                  {audit.kind === 'asset' ? 'Asset verification' : 'Stock count'} ·{' '}
                  {auditScope(audit)}
                </span>
              </span>
              <Badge tone={audit.status === 'open' ? 'warning' : 'neutral'} dot>
                {audit.status === 'open' ? 'Open' : 'Closed'}
              </Badge>
            </div>
            <span className='tabular text-xs text-muted-foreground'>{progress(audit)}</span>
          </div>
        )}
      />
      <StartAuditModal
        open={starting}
        onOpenChange={setStarting}
        onStarted={(audit) => onChange({ audit_id: audit.id })}
      />
    </Card>
  )
}

function AuditDetail({ id, search, onChange, access }: TabProps & { id: number }) {
  const audit = useAudit(id)
  const [closing, setClosing] = useState(false)
  const back = () => onChange({ audit_id: undefined, finding: undefined })

  if (audit.isPending) {
    return (
      <div className='grid gap-3'>
        <Skeleton className='h-16' />
        <Skeleton className='h-24' />
        <Skeleton className='h-64' />
      </div>
    )
  }
  if (audit.isError) {
    return (
      <Card>
        {audit.error.isNotFound ? (
          <EmptyState
            icon={SearchX}
            title='Audit not found'
            action={
              <Button variant='outline' onClick={back}>
                All audits
              </Button>
            }
          />
        ) : (
          <ErrorState message={audit.error.message} onRetry={() => audit.refetch()} />
        )}
      </Card>
    )
  }

  const data = audit.data
  return (
    <div className='grid gap-4'>
      <AuditHeader
        audit={data}
        canClose={access.audit}
        onBack={back}
        onClose={() => setClosing(true)}
      />
      {data.kind === 'asset' ? (
        <AssetAuditView audit={data} search={search} onChange={onChange} access={access} />
      ) : (
        <StockCountView audit={data} access={access} />
      )}
      <CloseAuditModal audit={data} open={closing} onOpenChange={setClosing} />
    </div>
  )
}

const schema = z
  .object({
    name: z.string().trim().min(3, 'Enter at least 3 characters').max(80, 'Keep it under 80'),
    kind: z.enum(['asset', 'stock']),
    location_id: z.string().optional(),
    category_id: z.string().optional(),
    department_id: z.string().optional(),
    store_id: z.string().optional(),
    notes: z.string().max(255, 'Keep it under 255 characters'),
  })
  .refine((values) => values.kind === 'asset' || Boolean(values.store_id), {
    path: ['store_id'],
    message: 'Choose the store to count',
  })
type FormValues = z.infer<typeof schema>

const FORM_ID = 'inventory-audit-form'

function StartAuditModal({
  open,
  onOpenChange,
  onStarted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStarted: (audit: Audit) => void
}) {
  const start = useInventoryMutation(inventoryApi.startAudit)
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Start an audit'
      description='Leave the scope empty to verify every asset in the school.'
      formId={FORM_ID}
      submitText='Start audit'
      loading={start.isPending}
      size='lg'
    >
      {open && (
        <StartAuditForm
          onSubmit={async (input) => {
            const audit = await start.mutateAsync(input)
            alerts.success('Audit started')
            onOpenChange(false)
            onStarted(audit)
          }}
        />
      )}
    </AppModal>
  )
}

function StartAuditForm({ onSubmit }: { onSubmit: (input: AuditInput) => Promise<void> }) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', kind: 'asset', notes: '' },
  })
  const kind = useWatch({ control, name: 'kind' })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        name: values.name,
        kind: values.kind,
        location_id: values.kind === 'asset' ? idOrUndefined(values.location_id) : undefined,
        department_id: values.kind === 'asset' ? idOrUndefined(values.department_id) : undefined,
        category_id: idOrUndefined(values.category_id),
        store_id: values.kind === 'stock' ? idOrUndefined(values.store_id) : undefined,
        notes: textOrNull(values.notes),
      })
    } catch (error) {
      applyApiError(
        error,
        setError,
        ['name', 'kind', 'location_id', 'category_id', 'department_id', 'store_id', 'notes'],
        { AUDIT_OPEN: 'kind' }
      )
    }
  })

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4 sm:grid-cols-2'>
      {errors.root?.message && (
        <p
          role='alert'
          className='rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive sm:col-span-2'
        >
          {errors.root.message}
        </p>
      )}
      <FormField id='audit-name' label='Name' required error={errors.name?.message}>
        <Input
          id='audit-name'
          autoFocus
          placeholder='Half-yearly verification'
          aria-invalid={Boolean(errors.name)}
          {...register('name')}
        />
      </FormField>
      <FormField id='audit-kind' label='What to check' error={errors.kind?.message}>
        <SegmentedControl
          label='Audit kind'
          value={kind}
          onChange={(value) => {
            setValue('kind', value)
            setValue('category_id', undefined)
          }}
          options={[
            { value: 'asset', label: 'Asset verification' },
            { value: 'stock', label: 'Stock count' },
          ]}
          className='justify-self-start'
        />
      </FormField>
      {kind === 'asset' ? (
        <>
          <FormField id='audit-location' label='Location' error={errors.location_id?.message}>
            <Controller
              control={control}
              name='location_id'
              render={({ field }) => (
                <LocationPicker
                  id='audit-location'
                  label='Location'
                  allLabel='All locations'
                  className='sm:w-full'
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                />
              )}
            />
          </FormField>
          <FormField id='audit-department' label='Department' error={errors.department_id?.message}>
            <Controller
              control={control}
              name='department_id'
              render={({ field }) => (
                <DepartmentPicker
                  id='audit-department'
                  label='Department'
                  allLabel='All departments'
                  className='sm:w-full'
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                />
              )}
            />
          </FormField>
        </>
      ) : (
        <FormField id='audit-store' label='Store' required error={errors.store_id?.message}>
          <Controller
            control={control}
            name='store_id'
            render={({ field }) => (
              <StorePicker
                id='audit-store'
                label='Store'
                value={field.value}
                invalid={Boolean(errors.store_id)}
                onChange={(value) => field.onChange(value)}
              />
            )}
          />
        </FormField>
      )}
      <FormField id='audit-category' label='Category' error={errors.category_id?.message}>
        <Controller
          control={control}
          name='category_id'
          render={({ field }) => (
            <CategoryPicker
              id='audit-category'
              label='Category'
              allLabel='All categories'
              className='sm:w-full'
              kind={kind}
              value={field.value}
              onChange={(value) => field.onChange(value)}
            />
          )}
        />
      </FormField>
      <FormField
        id='audit-notes'
        label='Notes'
        error={errors.notes?.message}
        className='sm:col-span-2'
      >
        <Textarea id='audit-notes' maxLength={255} {...register('notes')} />
      </FormField>
    </form>
  )
}
