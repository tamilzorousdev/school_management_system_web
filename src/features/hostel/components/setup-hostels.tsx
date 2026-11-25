import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
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
import { Input, Textarea } from '@/components/ui/input'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import {
  hostelApi,
  useHostelMutation,
  useHostels,
  type Hostel,
  type HostelGender,
  type HostelInput,
  type HostelStatus,
} from '../api'
import { HOSTEL_GENDER, HOSTEL_STATUS, labelOptions } from '../labels'
import { StaffPicker } from './pickers'
import { FormAlert } from './setup-form-parts'
import {
  applyApiError,
  bedsLine,
  CODE_HINT,
  CODE_PATTERN,
  MOBILE_PATTERN,
  optionalText,
} from './setup-helpers'

const FORM_ID = 'hostel-form'

const schema = z.object({
  name: z.string().trim().min(2, 'Enter the hostel name').max(100, 'Up to 100 characters'),
  code: z.string().trim().regex(CODE_PATTERN, CODE_HINT),
  gender: z.enum(['boys', 'girls', 'mixed']),
  status: z.enum(['active', 'inactive']),
  warden_user_id: z.string().optional(),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => !value || MOBILE_PATTERN.test(value),
      'Enter a valid 10-digit mobile number'
    ),
  address: z.string().max(255, 'Up to 255 characters'),
  notes: z.string().max(2000, 'Up to 2000 characters'),
})

type FormValues = z.infer<typeof schema>

export function SetupHostels() {
  const me = useMe().data
  const canManage = can(me, 'hostel.manage')
  const hostels = useHostels()
  const [form, setForm] = useState<{ hostel: Hostel | null } | null>(null)
  const [deleting, setDeleting] = useState<Hostel | null>(null)
  const remove = useHostelMutation((id: number) => hostelApi.removeHostel(id), false)

  useShortcut('hostel.create', () => setForm({ hostel: null }), { enabled: canManage })

  const confirmDelete = () => {
    if (!deleting) return
    remove.mutate(deleting.id, {
      onSuccess: () => alerts.success(`${deleting.name} deleted`),
      onSettled: () => setDeleting(null),
    })
  }

  const columns: Column<Hostel>[] = [
    {
      key: 'name',
      header: 'Hostel',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='truncate font-bold'>{row.name}</span>
          <span className='font-mono text-xs text-muted-foreground'>{row.code}</span>
        </div>
      ),
    },
    {
      key: 'gender',
      header: 'For',
      cell: (row) => HOSTEL_GENDER[row.gender],
    },
    {
      key: 'warden',
      header: 'Warden',
      hideBelow: 'lg',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='truncate'>{row.warden_name ?? '—'}</span>
          {row.phone && (
            <span className='tabular text-xs text-muted-foreground'>+91 {row.phone}</span>
          )}
        </div>
      ),
    },
    {
      key: 'structure',
      header: 'Blocks · rooms · beds',
      hideBelow: 'xl',
      cell: (row) => (
        <span className='tabular text-sm'>
          {row.block_count} · {row.room_count} · {row.bed_count}
        </span>
      ),
    },
    {
      key: 'occupied',
      header: 'Occupied',
      cell: (row) => (
        <span className='tabular text-sm'>
          {row.occupied_beds}/{row.bed_count}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge tone={HOSTEL_STATUS[row.status].tone} dot>
          {HOSTEL_STATUS[row.status].label}
        </Badge>
      ),
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: <span className='sr-only'>Actions</span>,
            align: 'right' as const,
            cell: (row: Hostel) => (
              <HostelActions
                hostel={row}
                onEdit={() => setForm({ hostel: row })}
                onDelete={() => setDeleting(row)}
              />
            ),
          },
        ]
      : []),
  ]

  return (
    <>
      <Card className='overflow-hidden'>
        <div className='flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3'>
          <div className='grid gap-0.5'>
            <h2 className='font-bold'>Hostels</h2>
            <p className='text-xs text-muted-foreground'>
              Each hostel has its own blocks, floors, rooms and warden.
            </p>
          </div>
          {canManage && (
            <Button onClick={() => setForm({ hostel: null })}>
              <Plus />
              Add hostel
            </Button>
          )}
        </div>
        <DataTable
          rows={hostels.data ?? []}
          columns={columns}
          rowKey={(row) => row.id}
          loading={hostels.isFetching}
          error={hostels.isError ? hostels.error.message : null}
          onRetry={() => hostels.refetch()}
          onRowClick={canManage ? (row) => setForm({ hostel: row }) : undefined}
          empty={{
            icon: Building2,
            title: 'No hostels yet',
            description: 'Add the first hostel, then its blocks, floors, room types and rooms.',
            action: canManage ? (
              <Button onClick={() => setForm({ hostel: null })}>
                <Plus />
                Add hostel
              </Button>
            ) : undefined,
          }}
          card={(row) => (
            <div className='flex items-start justify-between gap-3'>
              <div className='grid min-w-0 gap-1'>
                <span className='truncate font-bold'>
                  {row.name} <span className='font-mono text-xs font-normal'>{row.code}</span>
                </span>
                <span className='text-xs text-muted-foreground'>
                  {HOSTEL_GENDER[row.gender]} · {row.warden_name ?? 'No warden'}
                </span>
                <span className='tabular text-xs text-muted-foreground'>
                  {row.block_count} blocks · {row.room_count} rooms ·{' '}
                  {bedsLine(row.occupied_beds, row.bed_count)}
                </span>
              </div>
              <div className='flex shrink-0 items-center gap-1'>
                <Badge tone={HOSTEL_STATUS[row.status].tone} dot>
                  {HOSTEL_STATUS[row.status].label}
                </Badge>
                {canManage && (
                  <HostelActions
                    hostel={row}
                    onEdit={() => setForm({ hostel: row })}
                    onDelete={() => setDeleting(row)}
                  />
                )}
              </div>
            </div>
          )}
        />
      </Card>

      <HostelFormModal
        open={Boolean(form)}
        hostel={form?.hostel ?? null}
        onOpenChange={(open) => !open && setForm(null)}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title='Delete hostel?'
        description={
          deleting
            ? `${deleting.name} can be deleted only when it has no blocks and no residents.`
            : ''
        }
        confirmText='Delete'
        destructive
        loading={remove.isPending}
        onConfirm={confirmDelete}
      />
    </>
  )
}

function HostelActions({
  hostel,
  onEdit,
  onDelete,
}: {
  hostel: Hostel
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={`Actions for ${hostel.name}`}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent onClick={(event) => event.stopPropagation()}>
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem destructive onSelect={onDelete}>
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function HostelFormModal({
  open,
  hostel,
  onOpenChange,
}: {
  open: boolean
  hostel: Hostel | null
  onOpenChange: (open: boolean) => void
}) {
  const save = useHostelMutation((input: HostelInput) =>
    hostel ? hostelApi.updateHostel(hostel.id, input) : hostelApi.createHostel(input)
  )
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={hostel ? 'Edit hostel' : 'Add hostel'}
      description='The warden gets hostel alerts and can be reached by parents.'
      formId={FORM_ID}
      submitText={hostel ? 'Save changes' : 'Add hostel'}
      loading={save.isPending}
      size='lg'
    >
      {open && (
        <HostelForm
          key={hostel?.id ?? 'new'}
          hostel={hostel}
          onSubmit={async (input) => {
            await save.mutateAsync(input)
            alerts.success(hostel ? 'Hostel updated' : 'Hostel added')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function HostelForm({
  hostel,
  onSubmit,
}: {
  hostel: Hostel | null
  onSubmit: (input: HostelInput) => Promise<void>
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
      name: hostel?.name ?? '',
      code: hostel?.code ?? '',
      gender: hostel?.gender ?? 'boys',
      status: hostel?.status ?? 'active',
      warden_user_id: hostel?.warden_user_id ? String(hostel.warden_user_id) : undefined,
      phone: hostel?.phone ?? '',
      address: hostel?.address ?? '',
      notes: hostel?.notes ?? '',
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        name: values.name,
        code: values.code.toUpperCase(),
        gender: values.gender,
        status: values.status,
        warden_user_id: values.warden_user_id ? Number(values.warden_user_id) : null,
        phone: optionalText(values.phone),
        address: optionalText(values.address),
        notes: optionalText(values.notes),
      })
    } catch (error) {
      applyApiError(
        error,
        setError,
        ['name', 'code', 'gender', 'status', 'warden_user_id', 'phone', 'address', 'notes'],
        { HOSTEL_CODE_TAKEN: 'code' }
      )
    }
  })

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      <FormAlert message={errors.root?.message} />
      <div className='grid gap-4 sm:grid-cols-[1fr_10rem]'>
        <FormField id='hostel-name' label='Name' required error={errors.name?.message}>
          <Input
            id='hostel-name'
            autoFocus
            autoComplete='off'
            placeholder='Boys Hostel'
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
        </FormField>
        <FormField
          id='hostel-code'
          label='Code'
          required
          error={errors.code?.message}
          hint='Short, like BH'
        >
          <Input
            id='hostel-code'
            autoComplete='off'
            placeholder='BH'
            className='font-mono uppercase'
            aria-invalid={Boolean(errors.code)}
            {...register('code')}
          />
        </FormField>
      </div>
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField id='hostel-gender' label='For' required error={errors.gender?.message}>
          <Controller
            control={control}
            name='gender'
            render={({ field }) => (
              <Combobox
                id='hostel-gender'
                label='For'
                value={field.value}
                options={labelOptions(HOSTEL_GENDER)}
                placeholder='Choose who stays here'
                onChange={(value) => field.onChange((value as HostelGender) ?? field.value)}
                highlightSelected={false}
                className='sm:w-full'
              />
            )}
          />
        </FormField>
        <FormField id='hostel-status' label='Status' error={errors.status?.message}>
          <Controller
            control={control}
            name='status'
            render={({ field }) => (
              <SegmentedControl<HostelStatus>
                label='Status'
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: 'active', label: HOSTEL_STATUS.active.label },
                  { value: 'inactive', label: HOSTEL_STATUS.inactive.label },
                ]}
                className='justify-self-start'
              />
            )}
          />
        </FormField>
        <FormField
          id='hostel-warden'
          label='Warden'
          error={errors.warden_user_id?.message}
          hint='A staff member with the warden role'
        >
          <Controller
            control={control}
            name='warden_user_id'
            render={({ field }) => (
              <StaffPicker
                id='hostel-warden'
                label='Warden'
                value={field.value}
                invalid={Boolean(errors.warden_user_id)}
                initial={
                  hostel?.warden_user_id
                    ? { value: String(hostel.warden_user_id), label: hostel.warden_name ?? '' }
                    : null
                }
                onChange={field.onChange}
              />
            )}
          />
        </FormField>
        <FormField id='hostel-phone' label='Hostel phone' error={errors.phone?.message}>
          <Input
            id='hostel-phone'
            type='tel'
            inputMode='numeric'
            maxLength={10}
            placeholder='9876543210'
            className='tabular'
            aria-invalid={Boolean(errors.phone)}
            {...register('phone')}
          />
        </FormField>
      </div>
      <FormField id='hostel-address' label='Address' error={errors.address?.message}>
        <Input
          id='hostel-address'
          autoComplete='off'
          aria-invalid={Boolean(errors.address)}
          {...register('address')}
        />
      </FormField>
      <FormField id='hostel-notes' label='Notes' error={errors.notes?.message}>
        <Textarea
          id='hostel-notes'
          rows={3}
          aria-invalid={Boolean(errors.notes)}
          {...register('notes')}
        />
      </FormField>
    </form>
  )
}
