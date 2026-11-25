import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building, Layers, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState, ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import {
  hostelApi,
  useBlocks,
  useFloors,
  useHostelMutation,
  useHostels,
  type Block,
  type BlockInput,
  type Floor,
  type FloorInput,
} from '../api'
import { HostelSelect, StaffPicker } from './pickers'
import { FormAlert } from './setup-form-parts'
import {
  applyApiError,
  bedsLine,
  CODE_HINT,
  CODE_PATTERN,
  floorLevelLabel,
  intInRange,
} from './setup-helpers'

const BLOCK_FORM_ID = 'hostel-block-form'
const FLOOR_FORM_ID = 'hostel-floor-form'

const blockSchema = z.object({
  name: z.string().trim().min(1, 'Enter the block name').max(60, 'Up to 60 characters'),
  code: z.string().trim().regex(CODE_PATTERN, CODE_HINT),
  sort_order: z
    .string()
    .refine((value) => !value.trim() || intInRange(value, 0, 999), 'A whole number, 0 to 999'),
  incharge_user_id: z.string().optional(),
})
type BlockValues = z.infer<typeof blockSchema>

const floorSchema = z.object({
  name: z.string().trim().min(1, 'Enter the floor name').max(40, 'Up to 40 characters'),
  level: z.string().refine((value) => intInRange(value, -2, 50), 'A whole number, -2 to 50'),
})
type FloorValues = z.infer<typeof floorSchema>

type Confirm = { kind: 'block'; block: Block } | { kind: 'floor'; floor: Floor } | null

export function SetupStructure({
  hostelId,
  onHostelChange,
}: {
  hostelId?: number
  onHostelChange: (hostelId: number | undefined) => void
}) {
  const me = useMe().data
  const canManage = can(me, 'hostel.manage')
  const hostels = useHostels()
  const selectedId = hostelId ?? hostels.data?.[0]?.id
  const hostel = hostels.data?.find((item) => item.id === selectedId)
  const blocks = useBlocks(selectedId, Boolean(selectedId))
  const [blockForm, setBlockForm] = useState<{ block: Block | null } | null>(null)
  const [floorForm, setFloorForm] = useState<{ blockId: number; floor: Floor | null } | null>(null)
  const [confirm, setConfirm] = useState<Confirm>(null)
  const removeBlock = useHostelMutation((id: number) => hostelApi.removeBlock(id), false)
  const removeFloor = useHostelMutation((id: number) => hostelApi.removeFloor(id), false)

  const confirmDelete = () => {
    if (!confirm) return
    if (confirm.kind === 'block') {
      removeBlock.mutate(confirm.block.id, {
        onSuccess: () => alerts.success(`${confirm.block.name} deleted`),
        onSettled: () => setConfirm(null),
      })
    } else {
      removeFloor.mutate(confirm.floor.id, {
        onSuccess: () => alerts.success(`${confirm.floor.name} deleted`),
        onSettled: () => setConfirm(null),
      })
    }
  }

  if (hostels.data && hostels.data.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Building}
          title='Add a hostel first'
          description='Blocks and floors belong to a hostel. Add one in the Hostels tab.'
        />
      </Card>
    )
  }

  return (
    <div className='grid gap-4'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div className='grid w-full gap-1.5 sm:w-64'>
          <span className='text-xs font-semibold'>Hostel</span>
          <HostelSelect
            id='structure-hostel'
            value={selectedId ? String(selectedId) : undefined}
            onChange={(value) => value && onHostelChange(Number(value))}
          />
        </div>
        {canManage && hostel && (
          <Button onClick={() => setBlockForm({ block: null })}>
            <Plus />
            Add block
          </Button>
        )}
      </div>

      {blocks.isError ? (
        <Card>
          <ErrorState message={blocks.error.message} onRetry={() => blocks.refetch()} />
        </Card>
      ) : !blocks.data ? (
        <div className='grid gap-4 lg:grid-cols-2'>
          <Skeleton className='h-48' />
          <Skeleton className='h-48' />
        </div>
      ) : blocks.data.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building}
            title='No blocks yet'
            description={`Add the blocks or wings of ${hostel?.name ?? 'this hostel'}, then their floors.`}
            action={
              canManage ? (
                <Button onClick={() => setBlockForm({ block: null })}>
                  <Plus />
                  Add block
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className='grid gap-4 lg:grid-cols-2'>
          {blocks.data.map((block) => (
            <BlockCard
              key={block.id}
              block={block}
              canManage={canManage}
              onEdit={() => setBlockForm({ block })}
              onDelete={() => setConfirm({ kind: 'block', block })}
              onAddFloor={() => setFloorForm({ blockId: block.id, floor: null })}
              onEditFloor={(floor) => setFloorForm({ blockId: block.id, floor })}
              onDeleteFloor={(floor) => setConfirm({ kind: 'floor', floor })}
            />
          ))}
        </div>
      )}

      <BlockFormModal
        open={Boolean(blockForm)}
        hostelId={selectedId}
        block={blockForm?.block ?? null}
        onOpenChange={(open) => !open && setBlockForm(null)}
      />
      <FloorFormModal
        open={Boolean(floorForm)}
        blockId={floorForm?.blockId}
        floor={floorForm?.floor ?? null}
        onOpenChange={(open) => !open && setFloorForm(null)}
      />
      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm?.kind === 'floor' ? 'Delete floor?' : 'Delete block?'}
        description={
          confirm?.kind === 'floor'
            ? `${confirm.floor.name} can be deleted only when it has no rooms.`
            : confirm?.kind === 'block'
              ? `${confirm.block.name} can be deleted only when it has no floors.`
              : ''
        }
        confirmText='Delete'
        destructive
        loading={removeBlock.isPending || removeFloor.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

function BlockCard({
  block,
  canManage,
  onEdit,
  onDelete,
  onAddFloor,
  onEditFloor,
  onDeleteFloor,
}: {
  block: Block
  canManage: boolean
  onEdit: () => void
  onDelete: () => void
  onAddFloor: () => void
  onEditFloor: (floor: Floor) => void
  onDeleteFloor: (floor: Floor) => void
}) {
  const floors = useFloors(block.id)
  return (
    <Card className='gap-4 p-5'>
      <div className='flex items-start justify-between gap-3'>
        <div className='grid min-w-0 gap-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <h3 className='truncate font-bold'>{block.name}</h3>
            <Badge className='font-mono'>{block.code}</Badge>
          </div>
          <p className='text-xs text-muted-foreground'>
            In charge: {block.incharge_name ?? 'Not set'}
          </p>
          <p className='tabular text-xs text-muted-foreground'>
            {block.floor_count} floors · {block.room_count} rooms ·{' '}
            {bedsLine(block.occupied_beds, block.bed_count)}
          </p>
        </div>
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon-sm' aria-label={`Actions for ${block.name}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={onAddFloor}>
                <Plus />
                Add floor
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil />
                Edit block
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onSelect={onDelete}>
                <Trash2 />
                Delete block
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {floors.isError ? (
        <ErrorState
          message={floors.error.message}
          onRetry={() => floors.refetch()}
          className='py-6'
        />
      ) : !floors.data ? (
        <div className='grid gap-2'>
          <Skeleton className='h-12' />
          <Skeleton className='h-12' />
        </div>
      ) : floors.data.length === 0 ? (
        <div className='flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed px-3 py-3'>
          <span className='text-sm text-muted-foreground'>No floors yet.</span>
          {canManage && (
            <Button size='sm' variant='outline' onClick={onAddFloor}>
              <Plus />
              Add floor
            </Button>
          )}
        </div>
      ) : (
        <ul className='divide-y rounded-lg border'>
          {floors.data.map((floor) => (
            <li key={floor.id} className='flex items-center justify-between gap-3 px-3 py-2'>
              <div className='flex min-w-0 items-center gap-3'>
                <span className='grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground'>
                  <Layers className='size-4' />
                </span>
                <div className='grid min-w-0'>
                  <span className='truncate text-sm font-semibold'>
                    {floor.name}{' '}
                    <span className='text-xs font-normal text-muted-foreground'>
                      {floorLevelLabel(floor.level)}
                    </span>
                  </span>
                  <span className='tabular text-xs text-muted-foreground'>
                    {floor.room_count} rooms · {bedsLine(floor.occupied_beds, floor.bed_count)}
                  </span>
                </div>
              </div>
              {canManage && (
                <div className='flex shrink-0 gap-1'>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label={`Edit ${floor.name}`}
                    onClick={() => onEditFloor(floor)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label={`Delete ${floor.name}`}
                    onClick={() => onDeleteFloor(floor)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function BlockFormModal({
  open,
  hostelId,
  block,
  onOpenChange,
}: {
  open: boolean
  hostelId?: number
  block: Block | null
  onOpenChange: (open: boolean) => void
}) {
  const save = useHostelMutation((input: BlockInput) =>
    block ? hostelApi.updateBlock(block.id, input) : hostelApi.createBlock(input)
  )
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={block ? 'Edit block' : 'Add block'}
      description='A block is a building or wing of the hostel.'
      formId={BLOCK_FORM_ID}
      submitText={block ? 'Save changes' : 'Add block'}
      loading={save.isPending}
    >
      {open && (
        <BlockForm
          key={block?.id ?? 'new'}
          block={block}
          onSubmit={async (values) => {
            const hostel = block?.hostel_id ?? hostelId
            if (!hostel) return
            await save.mutateAsync({ ...values, hostel_id: hostel })
            alerts.success(block ? 'Block updated' : 'Block added')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function BlockForm({
  block,
  onSubmit,
}: {
  block: Block | null
  onSubmit: (input: Omit<BlockInput, 'hostel_id'>) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BlockValues>({
    resolver: zodResolver(blockSchema),
    defaultValues: {
      name: block?.name ?? '',
      code: block?.code ?? '',
      sort_order: String(block?.sort_order ?? 0),
      incharge_user_id: block?.incharge_user_id ? String(block.incharge_user_id) : undefined,
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        name: values.name,
        code: values.code.toUpperCase(),
        sort_order: values.sort_order.trim() ? Number(values.sort_order) : 0,
        incharge_user_id: values.incharge_user_id ? Number(values.incharge_user_id) : null,
      })
    } catch (error) {
      applyApiError(error, setError, ['name', 'code', 'sort_order', 'incharge_user_id'], {
        HOSTEL_BLOCK_CODE_TAKEN: 'code',
      })
    }
  })

  return (
    <form id={BLOCK_FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      <FormAlert message={errors.root?.message} />
      <div className='grid gap-4 sm:grid-cols-[1fr_8rem]'>
        <FormField id='block-name' label='Name' required error={errors.name?.message}>
          <Input
            id='block-name'
            autoFocus
            autoComplete='off'
            placeholder='A Block'
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
        </FormField>
        <FormField id='block-code' label='Code' required error={errors.code?.message}>
          <Input
            id='block-code'
            autoComplete='off'
            placeholder='A'
            className='font-mono uppercase'
            aria-invalid={Boolean(errors.code)}
            {...register('code')}
          />
        </FormField>
      </div>
      <div className='grid gap-4 sm:grid-cols-[1fr_8rem]'>
        <FormField
          id='block-incharge'
          label='In charge'
          error={errors.incharge_user_id?.message}
          hint='Warden or assistant warden for this block'
        >
          <Controller
            control={control}
            name='incharge_user_id'
            render={({ field }) => (
              <StaffPicker
                id='block-incharge'
                label='In charge'
                value={field.value}
                invalid={Boolean(errors.incharge_user_id)}
                initial={
                  block?.incharge_user_id
                    ? { value: String(block.incharge_user_id), label: block.incharge_name ?? '' }
                    : null
                }
                onChange={field.onChange}
              />
            )}
          />
        </FormField>
        <FormField
          id='block-order'
          label='Order'
          error={errors.sort_order?.message}
          hint='Lower shows first'
        >
          <Input
            id='block-order'
            inputMode='numeric'
            className='tabular'
            aria-invalid={Boolean(errors.sort_order)}
            {...register('sort_order')}
          />
        </FormField>
      </div>
    </form>
  )
}

function FloorFormModal({
  open,
  blockId,
  floor,
  onOpenChange,
}: {
  open: boolean
  blockId?: number
  floor: Floor | null
  onOpenChange: (open: boolean) => void
}) {
  const save = useHostelMutation((input: FloorInput) =>
    floor ? hostelApi.updateFloor(floor.id, input) : hostelApi.createFloor(input)
  )
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={floor ? 'Edit floor' : 'Add floor'}
      formId={FLOOR_FORM_ID}
      submitText={floor ? 'Save changes' : 'Add floor'}
      loading={save.isPending}
      size='sm'
    >
      {open && (
        <FloorForm
          key={floor?.id ?? 'new'}
          floor={floor}
          onSubmit={async (values) => {
            const block = floor?.block_id ?? blockId
            if (!block) return
            await save.mutateAsync({ ...values, block_id: block })
            alerts.success(floor ? 'Floor updated' : 'Floor added')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function FloorForm({
  floor,
  onSubmit,
}: {
  floor: Floor | null
  onSubmit: (input: Omit<FloorInput, 'block_id'>) => Promise<void>
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FloorValues>({
    resolver: zodResolver(floorSchema),
    defaultValues: { name: floor?.name ?? '', level: String(floor?.level ?? 0) },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({ name: values.name, level: Number(values.level) })
    } catch (error) {
      applyApiError(error, setError, ['name', 'level'], { HOSTEL_FLOOR_LEVEL_TAKEN: 'level' })
    }
  })

  return (
    <form id={FLOOR_FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      <FormAlert message={errors.root?.message} />
      <FormField id='floor-name' label='Name' required error={errors.name?.message}>
        <Input
          id='floor-name'
          autoFocus
          autoComplete='off'
          placeholder='Ground floor'
          aria-invalid={Boolean(errors.name)}
          {...register('name')}
        />
      </FormField>
      <FormField
        id='floor-level'
        label='Level'
        required
        error={errors.level?.message}
        hint='0 is the ground floor, 1 the first floor, -1 a basement'
      >
        <Input
          id='floor-level'
          inputMode='numeric'
          className='tabular'
          aria-invalid={Boolean(errors.level)}
          {...register('level')}
        />
      </FormField>
    </form>
  )
}
