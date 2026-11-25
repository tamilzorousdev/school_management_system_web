import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { BedDouble, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { FormField } from '@/components/common/form-field'
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
import { rupees } from '@/features/fees/labels'
import { alerts } from '@/lib/alerts'
import {
  hostelApi,
  useHostelMutation,
  useRoomTypes,
  type RoomType,
  type RoomTypeInput,
} from '../api'
import { FormAlert, SwitchRow } from './setup-form-parts'
import {
  applyApiError,
  CODE_HINT,
  CODE_PATTERN,
  intInRange,
  MONEY_PATTERN,
  optionalText,
} from './setup-helpers'

const FORM_ID = 'hostel-room-type-form'

const schema = z.object({
  name: z.string().trim().min(2, 'Enter the room type name').max(60, 'Up to 60 characters'),
  code: z.string().trim().regex(CODE_PATTERN, CODE_HINT),
  default_beds: z.string().refine((value) => intInRange(value, 1, 50), 'A whole number, 1 to 50'),
  is_ac: z.boolean(),
  attached_bathroom: z.boolean(),
  annual_fee: z
    .string()
    .trim()
    .refine((value) => !value || MONEY_PATTERN.test(value), 'Enter an amount like 60000'),
  amenities: z.string().max(255, 'Up to 255 characters'),
})
type FormValues = z.infer<typeof schema>

function Features({ type }: { type: RoomType }) {
  return (
    <div className='flex flex-wrap gap-1'>
      <Badge tone={type.is_ac ? 'info' : 'neutral'}>{type.is_ac ? 'AC' : 'Non-AC'}</Badge>
      {type.attached_bathroom && <Badge>Attached bathroom</Badge>}
    </div>
  )
}

export function SetupRoomTypes() {
  const me = useMe().data
  const canManage = can(me, 'hostel.manage')
  const types = useRoomTypes()
  const [form, setForm] = useState<{ type: RoomType | null } | null>(null)
  const [deleting, setDeleting] = useState<RoomType | null>(null)
  const remove = useHostelMutation((id: number) => hostelApi.removeRoomType(id), false)

  useShortcut('hostel.create', () => setForm({ type: null }), { enabled: canManage })

  const confirmDelete = () => {
    if (!deleting) return
    remove.mutate(deleting.id, {
      onSuccess: () => alerts.success(`${deleting.name} deleted`),
      onSettled: () => setDeleting(null),
    })
  }

  const actions = (row: RoomType) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={`Actions for ${row.name}`}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent onClick={(event) => event.stopPropagation()}>
        <DropdownMenuItem onSelect={() => setForm({ type: row })}>
          <Pencil />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem destructive onSelect={() => setDeleting(row)}>
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const columns: Column<RoomType>[] = [
    {
      key: 'name',
      header: 'Room type',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='truncate font-bold'>{row.name}</span>
          <span className='font-mono text-xs text-muted-foreground'>{row.code}</span>
        </div>
      ),
    },
    {
      key: 'beds',
      header: 'Beds',
      cell: (row) => <span className='tabular'>{row.default_beds}</span>,
    },
    { key: 'features', header: 'Features', cell: (row) => <Features type={row} /> },
    {
      key: 'fee',
      header: 'Annual fee',
      align: 'right',
      cell: (row) => <span className='tabular'>{rupees(row.annual_fee)}</span>,
    },
    {
      key: 'amenities',
      header: 'Amenities',
      hideBelow: 'xl',
      cell: (row) => (
        <span className='line-clamp-2 text-sm text-muted-foreground'>{row.amenities ?? '—'}</span>
      ),
    },
    {
      key: 'rooms',
      header: 'Rooms',
      hideBelow: 'lg',
      cell: (row) => <span className='tabular'>{row.room_count}</span>,
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: <span className='sr-only'>Actions</span>,
            align: 'right' as const,
            cell: actions,
          },
        ]
      : []),
  ]

  return (
    <>
      <Card className='overflow-hidden'>
        <div className='flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3'>
          <div className='grid gap-0.5'>
            <h2 className='font-bold'>Room types</h2>
            <p className='text-xs text-muted-foreground'>
              Sharing, AC and fee. A new room gets the type&apos;s bed count unless you change it.
            </p>
          </div>
          {canManage && (
            <Button onClick={() => setForm({ type: null })}>
              <Plus />
              Add room type
            </Button>
          )}
        </div>
        <DataTable
          rows={types.data ?? []}
          columns={columns}
          rowKey={(row) => row.id}
          loading={types.isFetching}
          error={types.isError ? types.error.message : null}
          onRetry={() => types.refetch()}
          onRowClick={canManage ? (row) => setForm({ type: row }) : undefined}
          empty={{
            icon: BedDouble,
            title: 'No room types yet',
            description: 'Add types like "4-sharing non-AC" before adding rooms.',
            action: canManage ? (
              <Button onClick={() => setForm({ type: null })}>
                <Plus />
                Add room type
              </Button>
            ) : undefined,
          }}
          card={(row) => (
            <div className='flex items-start justify-between gap-3'>
              <div className='grid min-w-0 gap-1'>
                <span className='truncate font-bold'>
                  {row.name} <span className='font-mono text-xs font-normal'>{row.code}</span>
                </span>
                <span className='tabular text-xs text-muted-foreground'>
                  {row.default_beds} beds · {rupees(row.annual_fee)} a year · {row.room_count} rooms
                </span>
                <Features type={row} />
              </div>
              {canManage && actions(row)}
            </div>
          )}
        />
      </Card>

      <RoomTypeFormModal
        open={Boolean(form)}
        type={form?.type ?? null}
        onOpenChange={(open) => !open && setForm(null)}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title='Delete room type?'
        description={deleting ? `${deleting.name} can be deleted only when no room uses it.` : ''}
        confirmText='Delete'
        destructive
        loading={remove.isPending}
        onConfirm={confirmDelete}
      />
    </>
  )
}

function RoomTypeFormModal({
  open,
  type,
  onOpenChange,
}: {
  open: boolean
  type: RoomType | null
  onOpenChange: (open: boolean) => void
}) {
  const save = useHostelMutation((input: RoomTypeInput) =>
    type ? hostelApi.updateRoomType(type.id, input) : hostelApi.createRoomType(input)
  )
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={type ? 'Edit room type' : 'Add room type'}
      description='Changing the fee applies to bills raised from now on.'
      formId={FORM_ID}
      submitText={type ? 'Save changes' : 'Add room type'}
      loading={save.isPending}
    >
      {open && (
        <RoomTypeForm
          key={type?.id ?? 'new'}
          type={type}
          onSubmit={async (input) => {
            await save.mutateAsync(input)
            alerts.success(type ? 'Room type updated' : 'Room type added')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function RoomTypeForm({
  type,
  onSubmit,
}: {
  type: RoomType | null
  onSubmit: (input: RoomTypeInput) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: type?.name ?? '',
      code: type?.code ?? '',
      default_beds: String(type?.default_beds ?? 4),
      is_ac: type?.is_ac ?? false,
      attached_bathroom: type?.attached_bathroom ?? false,
      annual_fee: type ? String(type.annual_fee) : '',
      amenities: type?.amenities ?? '',
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        name: values.name,
        code: values.code.toUpperCase(),
        default_beds: Number(values.default_beds),
        is_ac: values.is_ac,
        attached_bathroom: values.attached_bathroom,
        annual_fee: values.annual_fee ? Number(values.annual_fee) : 0,
        amenities: optionalText(values.amenities),
      })
    } catch (error) {
      applyApiError(
        error,
        setError,
        ['name', 'code', 'default_beds', 'is_ac', 'attached_bathroom', 'annual_fee', 'amenities'],
        { HOSTEL_ROOM_TYPE_CODE_TAKEN: 'code' }
      )
    }
  })

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      <FormAlert message={errors.root?.message} />
      <div className='grid gap-4 sm:grid-cols-[1fr_8rem]'>
        <FormField id='type-name' label='Name' required error={errors.name?.message}>
          <Input
            id='type-name'
            autoFocus
            autoComplete='off'
            placeholder='4-sharing non-AC'
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
        </FormField>
        <FormField id='type-code' label='Code' required error={errors.code?.message}>
          <Input
            id='type-code'
            autoComplete='off'
            placeholder='NAC4'
            className='font-mono uppercase'
            aria-invalid={Boolean(errors.code)}
            {...register('code')}
          />
        </FormField>
      </div>
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField
          id='type-beds'
          label='Beds per room'
          required
          error={errors.default_beds?.message}
        >
          <Input
            id='type-beds'
            inputMode='numeric'
            className='tabular'
            aria-invalid={Boolean(errors.default_beds)}
            {...register('default_beds')}
          />
        </FormField>
        <FormField
          id='type-fee'
          label='Annual fee (₹)'
          error={errors.annual_fee?.message}
          hint='Per student for the year'
        >
          <Input
            id='type-fee'
            inputMode='decimal'
            placeholder='60000'
            className='tabular'
            aria-invalid={Boolean(errors.annual_fee)}
            {...register('annual_fee')}
          />
        </FormField>
      </div>
      <div className='grid gap-3 sm:grid-cols-2'>
        <Controller
          control={control}
          name='is_ac'
          render={({ field }) => (
            <SwitchRow
              id='type-ac'
              label='Air conditioned'
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name='attached_bathroom'
          render={({ field }) => (
            <SwitchRow
              id='type-bathroom'
              label='Attached bathroom'
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>
      <FormField
        id='type-amenities'
        label='Amenities'
        error={errors.amenities?.message}
        hint='Shown to parents, e.g. cot, mattress, table, cupboard, fan'
      >
        <Input
          id='type-amenities'
          autoComplete='off'
          aria-invalid={Boolean(errors.amenities)}
          {...register('amenities')}
        />
      </FormField>
    </form>
  )
}
