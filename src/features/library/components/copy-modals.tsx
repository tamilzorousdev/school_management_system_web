import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { History, Printer } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { EmptyState, ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/format'
import {
  EDITABLE_COPY_STATUSES,
  libraryApi,
  useCopyHistory,
  useLibraryMutation,
  type Copy,
  type CopyCondition,
  type CopySource,
  type EditableCopyStatus,
} from '../api'
import {
  COPY_CONDITION_VALUES,
  COPY_SOURCE_VALUES,
  numberOrNull,
  optionalAmount,
  optionalDate,
  optionalText,
  textOrNull,
} from '../form-utils'
import {
  COPY_CONDITION,
  COPY_SOURCE,
  COPY_STATUS,
  downloadLabels,
  openLabels,
  optionsOf,
} from '../labels'
import { CopyStatusBadge, FormError, MemberLine } from './library-parts'

const FORM_ID = 'library-copy-form'

const schema = z.object({
  barcode: z.string().trim().min(3, 'Barcode is 3 to 60 characters').max(60),
  status: z.enum(EDITABLE_COPY_STATUSES).optional(),
  condition: z.enum(COPY_CONDITION_VALUES),
  source: z.enum(COPY_SOURCE_VALUES),
  vendor: optionalText(120, 'Vendor'),
  bill_no: optionalText(40, 'Bill number'),
  acquired_on: optionalDate,
  price: optionalAmount(1000000, 'Price'),
  notes: optionalText(255, 'Note'),
})

type FormValues = z.infer<typeof schema>

const isEditable = (status: string): status is EditableCopyStatus =>
  (EDITABLE_COPY_STATUSES as readonly string[]).includes(status)

export function CopyEditModal({ copy, onClose }: { copy: Copy; onClose: () => void }) {
  const save = useLibraryMutation((values: FormValues) =>
    libraryApi.updateCopy(copy.id, {
      barcode: values.barcode,
      ...(values.status && values.status !== copy.status ? { status: values.status } : {}),
      condition: values.condition,
      source: values.source,
      vendor: textOrNull(values.vendor),
      bill_no: textOrNull(values.bill_no),
      acquired_on: values.acquired_on || undefined,
      price: numberOrNull(values.price),
      notes: textOrNull(values.notes),
    })
  )
  const editableStatus = isEditable(copy.status)
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      barcode: copy.barcode,
      status: editableStatus ? (copy.status as EditableCopyStatus) : undefined,
      condition: copy.condition,
      source: copy.source,
      vendor: copy.vendor ?? '',
      bill_no: copy.bill_no ?? '',
      acquired_on: copy.acquired_on ?? '',
      price: copy.price === null ? '' : String(copy.price),
      notes: '',
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync(values)
      alerts.success('Copy saved')
      onClose()
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.fieldErrors[0]?.field === 'barcode' || apiError.code.includes('BARCODE')) {
        setError('barcode', { message: apiError.fieldErrors[0]?.message ?? apiError.message })
      } else {
        setError('root', { message: apiError.message })
      }
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Edit copy ${copy.accession_no}`}
      description={copy.book.title}
      formId={FORM_ID}
      submitText='Save copy'
      loading={save.isPending}
      size='lg'
    >
      <form id={FORM_ID} noValidate onSubmit={submit} className='grid gap-4 sm:grid-cols-2'>
        <div className='sm:col-span-2'>
          <FormError message={errors.root?.message} />
        </div>
        <FormField id='copy-barcode' label='Barcode' required error={errors.barcode?.message}>
          <Input
            id='copy-barcode'
            className='font-mono'
            aria-invalid={Boolean(errors.barcode)}
            {...register('barcode')}
          />
        </FormField>
        <FormField
          id='copy-status'
          label='Shelf status'
          hint={
            editableStatus
              ? undefined
              : `${COPY_STATUS[copy.status].label}: changes through the issue desk`
          }
        >
          {editableStatus ? (
            <Controller
              control={control}
              name='status'
              render={({ field }) => (
                <Combobox
                  id='copy-status'
                  label='Shelf status'
                  placeholder='Choose status'
                  value={field.value}
                  options={EDITABLE_COPY_STATUSES.map((value) => ({
                    value,
                    label: COPY_STATUS[value].label,
                  }))}
                  onChange={(next) => field.onChange(next ?? copy.status)}
                  className='sm:w-full'
                  highlightSelected={false}
                />
              )}
            />
          ) : (
            <div className='flex h-9 items-center'>
              <CopyStatusBadge status={copy.status} />
            </div>
          )}
        </FormField>
        <FormField id='copy-condition' label='Condition'>
          <Controller
            control={control}
            name='condition'
            render={({ field }) => (
              <Combobox
                id='copy-condition'
                label='Condition'
                placeholder='Choose condition'
                value={field.value}
                options={optionsOf(COPY_CONDITION)}
                onChange={(next) => field.onChange((next ?? 'good') as CopyCondition)}
                className='sm:w-full'
                highlightSelected={false}
              />
            )}
          />
        </FormField>
        <FormField id='copy-source' label='Source'>
          <Controller
            control={control}
            name='source'
            render={({ field }) => (
              <Combobox
                id='copy-source'
                label='Source'
                placeholder='Choose source'
                value={field.value}
                options={optionsOf(COPY_SOURCE)}
                onChange={(next) => field.onChange((next ?? 'purchase') as CopySource)}
                className='sm:w-full'
                highlightSelected={false}
              />
            )}
          />
        </FormField>
        <FormField id='copy-vendor' label='Vendor' error={errors.vendor?.message}>
          <Input id='copy-vendor' {...register('vendor')} />
        </FormField>
        <FormField id='copy-bill' label='Bill number' error={errors.bill_no?.message}>
          <Input id='copy-bill' {...register('bill_no')} />
        </FormField>
        <FormField id='copy-acquired' label='Acquired on' error={errors.acquired_on?.message}>
          <Controller
            control={control}
            name='acquired_on'
            render={({ field }) => (
              <Input
                id='copy-acquired'
                type='date'
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
              />
            )}
          />
        </FormField>
        <FormField id='copy-price' label='Price (₹)' error={errors.price?.message}>
          <Input id='copy-price' inputMode='decimal' {...register('price')} />
        </FormField>
        <FormField
          id='copy-notes'
          label='Note'
          hint='Why the status or condition changed; shows in the copy history'
          error={errors.notes?.message}
          className='sm:col-span-2'
        >
          <Input id='copy-notes' {...register('notes')} />
        </FormField>
      </form>
    </AppModal>
  )
}

export function CopyHistoryModal({ copy, onClose }: { copy: Copy; onClose: () => void }) {
  const history = useCopyHistory(copy.id)
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`History of ${copy.accession_no}`}
      description={copy.book.title}
      size='lg'
      footer={
        <DialogFooter>
          <Button variant='outline' onClick={() => openLabels({ copy_ids: String(copy.id) })}>
            <Printer />
            Print label
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      }
    >
      <CopyTimeline history={history} />
    </AppModal>
  )
}

function CopyTimeline({ history }: { history: ReturnType<typeof useCopyHistory> }) {
  if (history.isPending) return <Skeleton className='h-40' />
  if (history.isError) {
    return <ErrorState message={history.error.message} onRetry={() => history.refetch()} />
  }
  if (!history.data.length) {
    return <EmptyState icon={History} title='Nothing recorded yet' />
  }
  return (
    <ol className='relative grid max-h-[60vh] gap-4 overflow-y-auto border-l pl-5'>
      {history.data.map((event) => (
        <li key={event.id} className='relative grid gap-1'>
          <span className='absolute top-1.5 -left-[25px] size-2.5 rounded-full border-2 border-card bg-primary' />
          <div className='flex flex-wrap items-baseline justify-between gap-2'>
            <span className='font-semibold capitalize'>{event.kind.replace(/_/g, ' ')}</span>
            <span className='text-xs text-muted-foreground'>
              {formatDateTime(event.created_at)}
            </span>
          </div>
          {event.member && <MemberLine member={event.member} size='sm' />}
          {(event.note || event.actor) && (
            <span className='text-xs text-muted-foreground'>
              {[event.note, event.actor && `by ${event.actor}`].filter(Boolean).join(' · ')}
            </span>
          )}
        </li>
      ))}
    </ol>
  )
}

export function LabelsByDateModal({ onClose }: { onClose: () => void }) {
  const [from, setFrom] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Print labels by date'
      description='Barcode labels (A4, 3 × 8 stickers) for every copy added on or after a date.'
      footer={
        <DialogFooter>
          <Button
            variant='outline'
            disabled={!from}
            loading={busy}
            onClick={async () => {
              setBusy(true)
              await downloadLabels({ added_from: from })
              setBusy(false)
            }}
          >
            Download PDF
          </Button>
          <Button disabled={!from} onClick={() => openLabels({ added_from: from })}>
            <Printer />
            Open labels
          </Button>
        </DialogFooter>
      }
    >
      <FormField id='labels-from' label='Copies added from' required>
        <Input
          id='labels-from'
          type='date'
          value={from}
          onChange={(event) => setFrom(event.target.value)}
        />
      </FormField>
    </AppModal>
  )
}
