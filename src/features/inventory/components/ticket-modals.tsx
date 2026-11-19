import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import {
  ASSET_CONDITIONS,
  inventoryApi,
  TICKET_KINDS,
  TICKET_PRIORITIES,
  useInventoryMutation,
  type Ticket,
} from '../api'
import {
  ASSET_CONDITION_OPTIONS,
  blankToNull,
  options,
  TICKET_KIND,
  TICKET_PRIORITY,
} from '../labels'
import { AssetPicker, StaffPicker, VendorPicker, type PickedAsset } from './pickers'
import { mapApiError, numberOrNull, optionalMoneyField } from './stock-form'
import { FormAlert } from './stock-lines'

const KIND_OPTIONS = options(TICKET_KIND)
const PRIORITY_OPTIONS = TICKET_PRIORITIES.map((value) => ({
  value,
  label: TICKET_PRIORITY[value].label,
}))

const openSchema = z.object({
  asset_id: z.string().min(1, 'Choose the asset'),
  kind: z.enum(TICKET_KINDS),
  title: z
    .string()
    .trim()
    .min(3, 'Say what is wrong in a few words')
    .max(120, 'Keep it under 120 characters'),
  description: z.string().trim().max(1000, 'Keep it under 1000 characters'),
  priority: z.enum(TICKET_PRIORITIES),
  assigned_to_user_id: z.string(),
  vendor_id: z.string(),
})

type OpenValues = z.infer<typeof openSchema>

const OPEN_FORM = 'ticket-open-form'

export function OpenTicketModal({
  open,
  onOpenChange,
  asset,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset?: PickedAsset | null
}) {
  const create = useInventoryMutation(inventoryApi.openTicket)
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Open a maintenance ticket'
      description='The asset is marked under maintenance until the ticket is resolved.'
      formId={OPEN_FORM}
      submitText='Open ticket'
      loading={create.isPending}
      size='lg'
    >
      {open && (
        <OpenTicketForm
          asset={asset ?? null}
          onSubmit={async (values) => {
            const ticket = await create.mutateAsync({
              asset_id: Number(values.asset_id),
              kind: values.kind,
              title: values.title,
              description: blankToNull(values.description),
              priority: values.priority,
              assigned_to_user_id: numberOrNull(values.assigned_to_user_id),
              vendor_id: numberOrNull(values.vendor_id),
            })
            alerts.success('Ticket opened', { description: ticket.ticket_no })
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function OpenTicketForm({
  asset,
  onSubmit,
}: {
  asset: PickedAsset | null
  onSubmit: (values: OpenValues) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<OpenValues>({
    resolver: zodResolver(openSchema),
    defaultValues: {
      asset_id: asset ? String(asset.id) : '',
      kind: 'breakdown',
      title: '',
      description: '',
      priority: 'medium',
      assigned_to_user_id: '',
      vendor_id: '',
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      mapApiError(error, setError, [
        'asset_id',
        'kind',
        'title',
        'description',
        'priority',
        'assigned_to_user_id',
        'vendor_id',
      ])
    }
  })

  return (
    <form id={OPEN_FORM} onSubmit={submit} noValidate className='grid gap-4'>
      <FormAlert message={errors.root?.message} />
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField
          id='ticket-asset'
          label='Asset'
          required
          error={errors.asset_id?.message}
          className='sm:col-span-2'
        >
          {asset ? (
            <p className='rounded-md border bg-muted/40 px-3 py-2 text-sm'>
              <span className='font-mono text-xs'>{asset.asset_tag}</span> · {asset.name}
            </p>
          ) : (
            <Controller
              control={control}
              name='asset_id'
              render={({ field }) => (
                <AssetPicker
                  id='ticket-asset'
                  label='Asset'
                  status={['in_store', 'allocated', 'in_maintenance']}
                  value={field.value || undefined}
                  invalid={Boolean(errors.asset_id)}
                  onChange={(value) => field.onChange(value ?? '')}
                />
              )}
            />
          )}
        </FormField>
        <FormField
          id='ticket-title'
          label='Problem'
          required
          error={errors.title?.message}
          className='sm:col-span-2'
        >
          <Input
            id='ticket-title'
            autoFocus
            autoComplete='off'
            placeholder='Projector not turning on'
            aria-invalid={Boolean(errors.title)}
            {...register('title')}
          />
        </FormField>
        <FormField id='ticket-kind' label='Kind' error={errors.kind?.message}>
          <Controller
            control={control}
            name='kind'
            render={({ field }) => (
              <Combobox
                id='ticket-kind'
                label='Kind'
                value={field.value}
                options={KIND_OPTIONS}
                placeholder='Choose a kind'
                highlightSelected={false}
                className='sm:w-full'
                onChange={(value) => value && field.onChange(value)}
              />
            )}
          />
        </FormField>
        <FormField id='ticket-priority' label='Priority' error={errors.priority?.message}>
          <Controller
            control={control}
            name='priority'
            render={({ field }) => (
              <SegmentedControl
                label='Priority'
                value={field.value}
                onChange={field.onChange}
                options={PRIORITY_OPTIONS}
                className='justify-self-start'
              />
            )}
          />
        </FormField>
        <FormField
          id='ticket-assignee'
          label='Assign to'
          error={errors.assigned_to_user_id?.message}
        >
          <Controller
            control={control}
            name='assigned_to_user_id'
            render={({ field }) => (
              <StaffPicker
                id='ticket-assignee'
                label='Staff member'
                value={field.value || undefined}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
        <FormField id='ticket-vendor' label='Vendor' error={errors.vendor_id?.message}>
          <Controller
            control={control}
            name='vendor_id'
            render={({ field }) => (
              <VendorPicker
                id='ticket-vendor'
                label='Vendor'
                value={field.value || undefined}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
        <FormField
          id='ticket-description'
          label='Details'
          error={errors.description?.message}
          className='sm:col-span-2'
        >
          <Textarea id='ticket-description' {...register('description')} />
        </FormField>
      </div>
    </form>
  )
}

const updateSchema = z.object({
  status: z.enum(['open', 'in_progress']),
  priority: z.enum(TICKET_PRIORITIES),
  assigned_to_user_id: z.string(),
  vendor_id: z.string(),
  description: z.string().trim().max(1000, 'Keep it under 1000 characters'),
})

type UpdateValues = z.infer<typeof updateSchema>

const UPDATE_FORM = 'ticket-update-form'

export function UpdateTicketModal({
  open,
  onOpenChange,
  ticket,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: Ticket | null
}) {
  const update = useInventoryMutation((input: UpdateValues) =>
    inventoryApi.updateTicket(ticket!.id, {
      status: input.status,
      priority: input.priority,
      assigned_to_user_id: numberOrNull(input.assigned_to_user_id),
      vendor_id: numberOrNull(input.vendor_id),
      description: blankToNull(input.description),
    })
  )
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={ticket ? `Update ${ticket.ticket_no}` : 'Update ticket'}
      description={ticket ? `${ticket.asset.name} · ${ticket.title}` : undefined}
      formId={UPDATE_FORM}
      submitText='Save'
      loading={update.isPending}
    >
      {open && ticket && (
        <UpdateTicketForm
          ticket={ticket}
          onSubmit={async (values) => {
            await update.mutateAsync(values)
            alerts.success('Ticket saved')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function UpdateTicketForm({
  ticket,
  onSubmit,
}: {
  ticket: Ticket
  onSubmit: (values: UpdateValues) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UpdateValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      status: ticket.status === 'in_progress' ? 'in_progress' : 'open',
      priority: ticket.priority,
      assigned_to_user_id: ticket.assigned_to ? String(ticket.assigned_to.id) : '',
      vendor_id: ticket.vendor ? String(ticket.vendor.id) : '',
      description: ticket.description ?? '',
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      mapApiError(error, setError, [
        'status',
        'priority',
        'assigned_to_user_id',
        'vendor_id',
        'description',
      ])
    }
  })

  return (
    <form id={UPDATE_FORM} onSubmit={submit} noValidate className='grid gap-4'>
      <FormAlert message={errors.root?.message} />
      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='grid content-start gap-1.5'>
          <span className='text-xs font-semibold'>Status</span>
          <Controller
            control={control}
            name='status'
            render={({ field }) => (
              <SegmentedControl
                label='Status'
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: 'open', label: 'Open' },
                  { value: 'in_progress', label: 'Work started' },
                ]}
                className='justify-self-start'
              />
            )}
          />
        </div>
        <div className='grid content-start gap-1.5'>
          <span className='text-xs font-semibold'>Priority</span>
          <Controller
            control={control}
            name='priority'
            render={({ field }) => (
              <SegmentedControl
                label='Priority'
                value={field.value}
                onChange={field.onChange}
                options={PRIORITY_OPTIONS}
                className='justify-self-start'
              />
            )}
          />
        </div>
        <FormField
          id='update-assignee'
          label='Assigned to'
          error={errors.assigned_to_user_id?.message}
        >
          <Controller
            control={control}
            name='assigned_to_user_id'
            render={({ field }) => (
              <StaffPicker
                id='update-assignee'
                label='Staff member'
                value={field.value || undefined}
                initial={
                  ticket.assigned_to
                    ? { value: String(ticket.assigned_to.id), label: ticket.assigned_to.name }
                    : null
                }
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
        <FormField id='update-vendor' label='Vendor' error={errors.vendor_id?.message}>
          <Controller
            control={control}
            name='vendor_id'
            render={({ field }) => (
              <VendorPicker
                id='update-vendor'
                label='Vendor'
                value={field.value || undefined}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
        <FormField
          id='update-description'
          label='Details'
          error={errors.description?.message}
          className='sm:col-span-2'
        >
          <Textarea id='update-description' {...register('description')} />
        </FormField>
      </div>
    </form>
  )
}

const resolveSchema = z.object({
  resolution: z
    .string()
    .trim()
    .min(3, 'Say what was done')
    .max(1000, 'Keep it under 1000 characters'),
  cost: optionalMoneyField,
  parts: z.string().trim().max(255, 'Keep it under 255 characters'),
  condition: z.union([z.enum(ASSET_CONDITIONS), z.literal('')]),
})

type ResolveValues = z.infer<typeof resolveSchema>

const RESOLVE_FORM = 'ticket-resolve-form'

export function ResolveTicketModal({
  open,
  onOpenChange,
  ticket,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: Ticket | null
}) {
  const resolve = useInventoryMutation((input: ResolveValues) =>
    inventoryApi.resolveTicket(ticket!.id, {
      resolution: input.resolution,
      cost: numberOrNull(input.cost),
      parts: blankToNull(input.parts),
      condition: input.condition || undefined,
    })
  )
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={ticket ? `Resolve ${ticket.ticket_no}` : 'Resolve ticket'}
      description='The asset goes back to whoever had it, or to the store.'
      formId={RESOLVE_FORM}
      submitText='Resolve'
      loading={resolve.isPending}
    >
      {open && ticket && (
        <ResolveTicketForm
          ticket={ticket}
          onSubmit={async (values) => {
            await resolve.mutateAsync(values)
            alerts.success('Ticket resolved')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function ResolveTicketForm({
  ticket,
  onSubmit,
}: {
  ticket: Ticket
  onSubmit: (values: ResolveValues) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResolveValues>({
    resolver: zodResolver(resolveSchema),
    defaultValues: { resolution: '', cost: '', parts: '', condition: '' },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      mapApiError(error, setError, ['resolution', 'cost', 'parts', 'condition'])
    }
  })

  return (
    <form id={RESOLVE_FORM} onSubmit={submit} noValidate className='grid gap-4'>
      <FormAlert message={errors.root?.message} />
      {ticket.under_warranty && (
        <p className='rounded-md bg-info/10 px-3 py-2 text-sm text-info'>
          This asset is under warranty or AMC. Claim the repair from the vendor before paying.
        </p>
      )}
      <FormField
        id='resolve-resolution'
        label='What was done'
        required
        error={errors.resolution?.message}
      >
        <Textarea
          id='resolve-resolution'
          autoFocus
          placeholder='Lamp replaced'
          aria-invalid={Boolean(errors.resolution)}
          {...register('resolution')}
        />
      </FormField>
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField id='resolve-cost' label='Cost (₹)' error={errors.cost?.message}>
          <Input
            id='resolve-cost'
            inputMode='decimal'
            className='tabular'
            aria-invalid={Boolean(errors.cost)}
            {...register('cost')}
          />
        </FormField>
        <FormField id='resolve-condition' label='Condition now' error={errors.condition?.message}>
          <Controller
            control={control}
            name='condition'
            render={({ field }) => (
              <Combobox
                id='resolve-condition'
                label='Condition'
                value={field.value || undefined}
                options={ASSET_CONDITION_OPTIONS}
                placeholder='Unchanged'
                highlightSelected={false}
                className='sm:w-full'
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
        <FormField
          id='resolve-parts'
          label='Parts replaced'
          error={errors.parts?.message}
          className='sm:col-span-2'
        >
          <Input id='resolve-parts' autoComplete='off' {...register('parts')} />
        </FormField>
      </div>
    </form>
  )
}
