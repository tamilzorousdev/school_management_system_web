import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, ShieldBan, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import { hostelApi, useBlocklist, useHostelMutation, type Blocked, type BlockedInput } from '../api'
import { FormAlert } from './leave-form-parts'
import { applyApiError, digitsOnly, MOBILE_PATTERN, textOrNull } from './leave-helpers'

const FORM_ID = 'hostel-block-form'

const schema = z.object({
  mobile: z.string().regex(MOBILE_PATTERN, 'Enter a valid 10-digit mobile number'),
  name: z.string().trim().max(120, 'Keep it to 120 characters'),
  reason: z
    .string()
    .trim()
    .min(3, 'Write why this number is blocked')
    .max(255, 'Keep it to 255 characters'),
})

type FormValues = z.infer<typeof schema>

export function VisitBlocklistPanel() {
  const canManage = can(useMe().data, 'hostel.manage')
  const list = useBlocklist()
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<Blocked | null>(null)
  const unblock = useHostelMutation((id: number) => hostelApi.unblock(id))

  const columns: Column<Blocked>[] = [
    {
      key: 'mobile',
      header: 'Mobile',
      cell: (row) => <span className='tabular font-semibold'>+91 {row.mobile}</span>,
    },
    { key: 'name', header: 'Name', cell: (row) => row.name ?? '—' },
    {
      key: 'reason',
      header: 'Reason',
      cell: (row) => <span className='line-clamp-2 text-sm'>{row.reason}</span>,
    },
    {
      key: 'added',
      header: 'Added',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='text-xs text-muted-foreground'>{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      cell: (row) =>
        canManage ? (
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={`Unblock ${row.mobile}`}
            onClick={() => setRemoving(row)}
          >
            <Trash2 />
          </Button>
        ) : null,
    },
  ]

  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-center gap-2 border-b px-4 py-3'>
        <p className='text-sm text-muted-foreground'>
          Visitors with these numbers cannot be checked in at any hostel.
        </p>
        <span className='tabular ml-auto text-xs text-muted-foreground'>
          {list.data ? `${list.data.length} numbers` : ''}
        </span>
        {canManage && (
          <Button size='sm' onClick={() => setAdding(true)}>
            <Plus />
            Block a number
          </Button>
        )}
      </div>
      <DataTable
        rows={list.data ?? []}
        columns={columns}
        rowKey={(row) => row.id}
        loading={list.isFetching}
        error={list.isError ? list.error.message : null}
        onRetry={() => list.refetch()}
        empty={{
          icon: ShieldBan,
          title: 'No blocked numbers',
          description: 'Block a mobile number when parents ask that someone must not visit.',
        }}
        card={(row) => (
          <div className='flex items-start justify-between gap-3'>
            <div className='grid min-w-0 gap-0.5'>
              <span className='tabular font-semibold'>
                +91 {row.mobile}
                {row.name ? ` · ${row.name}` : ''}
              </span>
              <span className='text-sm'>{row.reason}</span>
              <span className='text-xs text-muted-foreground'>
                Added {formatDate(row.created_at)}
              </span>
            </div>
            {canManage && (
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label={`Unblock ${row.mobile}`}
                onClick={() => setRemoving(row)}
              >
                <Trash2 />
              </Button>
            )}
          </div>
        )}
      />

      {adding && <BlockModal onClose={() => setAdding(false)} />}

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title='Unblock this number'
        description={removing ? `+91 ${removing.mobile} can be checked in again.` : ''}
        confirmText='Unblock'
        destructive
        loading={unblock.isPending}
        onConfirm={() => {
          if (!removing) return
          unblock.mutate(removing.id, {
            onSuccess: () => {
              alerts.success('Number unblocked')
              setRemoving(null)
            },
            onError: (error) => alerts.error(toApiError(error).message),
          })
        }}
      />
    </Card>
  )
}

function BlockModal({ onClose }: { onClose: () => void }) {
  const block = useHostelMutation((input: BlockedInput) => hostelApi.block(input))
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { mobile: '', name: '', reason: '' },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await block.mutateAsync({
        mobile: values.mobile,
        name: textOrNull(values.name),
        reason: values.reason,
      })
      alerts.success('Number blocked')
      onClose()
    } catch (error) {
      applyApiError(error, setError, ['mobile', 'name', 'reason'], {
        HOSTEL_ALREADY_BLOCKED: 'mobile',
      })
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Block a number'
      description='The gate sees a red warning and can only record this visitor as turned away.'
      formId={FORM_ID}
      submitText='Block'
      loading={block.isPending}
      size='sm'
    >
      <form id={FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <FormField id='block-mobile' label='Mobile' required error={errors.mobile?.message}>
          <Input
            id='block-mobile'
            type='tel'
            inputMode='numeric'
            maxLength={10}
            autoFocus
            placeholder='9876543210'
            className='tabular'
            aria-invalid={Boolean(errors.mobile)}
            {...register('mobile', { setValueAs: digitsOnly })}
          />
        </FormField>
        <FormField id='block-name' label='Name' error={errors.name?.message}>
          <Input
            id='block-name'
            autoComplete='off'
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
        </FormField>
        <FormField id='block-reason' label='Reason' required error={errors.reason?.message}>
          <Textarea
            id='block-reason'
            maxLength={255}
            placeholder='Not allowed by parents'
            aria-invalid={Boolean(errors.reason)}
            {...register('reason')}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
