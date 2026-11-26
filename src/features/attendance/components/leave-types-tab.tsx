import { useState, type ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ListChecks, PenLine, Plus } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { DataTable, type Column } from '@/components/common/data-table'
import { FormField } from '@/components/common/form-field'
import { ListToolbar } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  attendanceApi,
  useAttendanceMutation,
  useLeaveTypes,
  type LeaveType,
  type LeaveTypeInput,
} from '../api'

const FORM_ID = 'leave-type-form'

const daysText = (days: number) =>
  days === 0 ? 'No limit' : `${days} ${days === 1 ? 'day' : 'days'} a year`

export function LeaveTypesTab({ canManage }: { canManage: boolean }) {
  const types = useLeaveTypes()
  const [editing, setEditing] = useState<{ type: LeaveType | null } | null>(null)
  const [busy, setBusy] = useState<number | null>(null)
  const toggle = useAttendanceMutation((input: { id: number; is_active: boolean }) =>
    attendanceApi.updateLeaveType(input.id, { is_active: input.is_active })
  )

  const setActive = async (type: LeaveType, isActive: boolean) => {
    setBusy(type.id)
    try {
      await toggle.mutateAsync({ id: type.id, is_active: isActive })
      alerts.success(`${type.name} ${isActive ? 'turned on' : 'turned off'}`)
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setBusy(null)
    }
  }

  const activeSwitch = (type: LeaveType) => (
    <Switch
      checked={type.is_active}
      disabled={!canManage || busy === type.id}
      aria-label={`${type.name} can be applied for`}
      onCheckedChange={(value) => void setActive(type, value)}
      onClick={(event) => event.stopPropagation()}
    />
  )

  const editButton = (type: LeaveType) =>
    canManage ? (
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label={`Edit ${type.name}`}
        title='Edit'
        className='text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
        onClick={(event) => {
          event.stopPropagation()
          setEditing({ type })
        }}
      >
        <PenLine className='size-4' />
      </Button>
    ) : null

  const columns: Column<LeaveType>[] = [
    {
      key: 'type',
      header: 'Leave type',
      cell: (type) => <span className='font-semibold'>{type.name}</span>,
    },
    {
      key: 'days',
      header: 'Days per year',
      cell: (type) => <span className='tabular'>{daysText(type.days_per_year)}</span>,
    },
    {
      key: 'paid',
      header: 'Pay',
      cell: (type) => (
        <Badge tone={type.is_paid ? 'success' : 'warning'} dot className='font-medium'>
          {type.is_paid ? 'Paid' : 'Unpaid'}
        </Badge>
      ),
    },
    { key: 'active', header: 'Active', cell: activeSwitch },
    ...(canManage
      ? [{ key: 'actions', header: 'ACTION', align: 'right' as const, cell: editButton }]
      : []),
  ]

  const newButton = canManage && (
    <Button size='sm' onClick={() => setEditing({ type: null })}>
      <Plus className='size-3.5' />
      New leave type
    </Button>
  )

  return (
    <div className='grid gap-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <p className='min-w-0 flex-1 text-xs text-muted-foreground'>
          Leave types staff can apply for in the Staff app, with the days allowed each academic
          year. Turning one off hides it from new requests; past requests keep it.
        </p>
        {newButton}
      </div>
      <Card className='overflow-hidden'>
        <ListToolbar summary={types.data ? `${types.data.length} leave types` : ''}>
          {null}
        </ListToolbar>
        <DataTable
          rows={types.data ?? []}
          columns={columns}
          rowKey={(type) => type.id}
          loading={types.isFetching}
          error={types.isError ? types.error.message : null}
          onRetry={() => types.refetch()}
          onRowClick={canManage ? (type) => setEditing({ type }) : undefined}
          empty={{
            icon: ListChecks,
            title: 'No leave types yet',
            description: 'Add the kinds of leave staff can apply for.',
            action: newButton || undefined,
          }}
          card={(type) => (
            <div className='grid gap-2'>
              <div className='flex items-start justify-between gap-2'>
                <span className='flex min-w-0 items-center gap-2'>
                  <Badge tone='info'>{type.code}</Badge>
                  <span className='font-bold break-words'>{type.name}</span>
                </span>
                {activeSwitch(type)}
              </div>
              <div className='flex items-center justify-between'>
                <span className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                  {daysText(type.days_per_year)}
                  <Badge tone={type.is_paid ? 'success' : 'warning'} dot className='font-medium'>
                    {type.is_paid ? 'Paid' : 'Unpaid'}
                  </Badge>
                </span>
                {editButton(type)}
              </div>
            </div>
          )}
        />
      </Card>
      {editing && (
        <LeaveTypeFormModal
          type={editing.type}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </div>
  )
}

const schema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{1,10}$/, 'Use 1 to 10 letters or digits, like CL'),
  name: z
    .string()
    .trim()
    .min(2, 'Enter at least 2 letters')
    .max(60, 'Keep the name under 60 letters'),
  days_per_year: z
    .string()
    .trim()
    .regex(/^\d{1,3}$/, 'Enter whole days from 0 to 365')
    .refine((value) => Number(value) <= 365, 'Enter whole days from 0 to 365'),
  is_paid: z.boolean(),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

function LeaveTypeFormModal({
  type,
  onOpenChange,
}: {
  type: LeaveType | null
  onOpenChange: (open: boolean) => void
}) {
  const save = useAttendanceMutation((input: LeaveTypeInput) =>
    type ? attendanceApi.updateLeaveType(type.id, input) : attendanceApi.createLeaveType(input)
  )
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: type?.code ?? '',
      name: type?.name ?? '',
      days_per_year: type ? String(type.days_per_year) : '',
      is_paid: type?.is_paid ?? true,
      is_active: type?.is_active ?? true,
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = await save.mutateAsync({
        code: values.code,
        name: values.name,
        days_per_year: Number(values.days_per_year),
        is_paid: values.is_paid,
        is_active: values.is_active,
      })
      alerts.success(type ? `${saved.name} updated` : `${saved.name} added`)
      onOpenChange(false)
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.code === 'LEAVE_TYPE_EXISTS') {
        setError('code', { message: apiError.message })
        return
      }
      if (!apiError.fieldErrors.length) {
        setError('root', { message: apiError.message })
        return
      }
      for (const item of apiError.fieldErrors) {
        if (item.field in values)
          setError(item.field as keyof FormValues, { message: item.message })
        else setError('root', { message: item.message })
      }
    }
  })

  return (
    <AppModal
      open
      onOpenChange={onOpenChange}
      title={type ? `Edit ${type.name}` : 'New leave type'}
      description='Staff see the code and name when they apply for leave in the Staff app.'
      formId={FORM_ID}
      showSubmitShortcut={false}
      submitText={type ? 'Save changes' : 'Add leave type'}
      loading={save.isPending}
    >
      <form id={FORM_ID} noValidate className='grid gap-3 sm:grid-cols-2' onSubmit={onSubmit}>
        {errors.root && (
          <p role='alert' className='text-sm font-medium text-destructive sm:col-span-2'>
            {errors.root.message}
          </p>
        )}
        <FormField id='lt-code' label='Code' required error={errors.code?.message}>
          <Input
            id='lt-code'
            maxLength={10}
            placeholder='CL'
            className='uppercase'
            aria-invalid={Boolean(errors.code) || undefined}
            {...register('code')}
          />
        </FormField>
        <FormField
          id='lt-days'
          label='Days per year'
          required
          hint='0 means no limit, like loss of pay'
          error={errors.days_per_year?.message}
        >
          <Input
            id='lt-days'
            type='number'
            inputMode='numeric'
            min={0}
            max={365}
            step={1}
            placeholder='12'
            aria-invalid={Boolean(errors.days_per_year) || undefined}
            {...register('days_per_year')}
          />
        </FormField>
        <FormField
          id='lt-name'
          label='Name'
          required
          error={errors.name?.message}
          className='sm:col-span-2'
        >
          <Input
            id='lt-name'
            maxLength={60}
            placeholder='Casual leave'
            aria-invalid={Boolean(errors.name) || undefined}
            {...register('name')}
          />
        </FormField>
        <Controller
          control={control}
          name='is_paid'
          render={({ field }) => (
            <SwitchRow title='Paid leave' hint='Off means the days are deducted from salary'>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-label='Paid leave'
              />
            </SwitchRow>
          )}
        />
        <Controller
          control={control}
          name='is_active'
          render={({ field }) => (
            <SwitchRow title='Active' hint='Staff can choose it for new requests'>
              <Switch checked={field.value} onCheckedChange={field.onChange} aria-label='Active' />
            </SwitchRow>
          )}
        />
      </form>
    </AppModal>
  )
}

function SwitchRow({
  title,
  hint,
  children,
}: {
  title: string
  hint: string
  children: ReactNode
}) {
  return (
    <label className='flex items-center justify-between gap-3 rounded-lg border p-3 text-sm'>
      <span className='grid'>
        <span className='font-semibold'>{title}</span>
        <span className='text-xs text-muted-foreground'>{hint}</span>
      </span>
      {children}
    </label>
  )
}
