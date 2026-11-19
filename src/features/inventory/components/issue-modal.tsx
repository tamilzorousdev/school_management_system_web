import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Input } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { inventoryApi, useInventoryMutation, useStockItem, type StockItemDetail } from '../api'
import { StorePicker } from './pickers'
import {
  emptyLine,
  lineMessages,
  linesField,
  listMessage,
  mapApiError,
  targetFields,
  targetIds,
  targetMissing,
} from './stock-form'
import { FormAlert, StockLinesEditor } from './stock-lines'
import { IssueTargetFields } from './stock-target'

const FORM_ID = 'stock-issue-form'

const schema = z
  .object({
    store_id: z.string().min(1, 'Choose the store'),
    ...targetFields,
    purpose: z
      .string()
      .trim()
      .min(3, 'Say what it is for')
      .max(255, 'Keep it under 255 characters'),
    lines: linesField,
  })
  .superRefine((values, context) => {
    const message = targetMissing(values)
    if (message) context.addIssue({ code: 'custom', path: ['target'], message })
  })

type FormValues = z.infer<typeof schema>

export function IssueStockModal({
  open,
  onOpenChange,
  itemId,
  storeId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId?: number
  storeId?: number
}) {
  const issue = useInventoryMutation(inventoryApi.issue)
  const item = useStockItem(open && itemId ? itemId : null)
  const ready = !itemId || !item.isPending
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Issue stock'
      description='Give stock straight from a store, without a requisition.'
      formId={FORM_ID}
      submitText='Issue stock'
      loading={issue.isPending}
      size='lg'
    >
      {open && ready && (
        <IssueForm
          item={item.data}
          itemId={itemId}
          storeId={storeId}
          onSubmit={async (values) => {
            const moved = await issue.mutateAsync({
              store_id: Number(values.store_id),
              ...targetIds(values),
              purpose: values.purpose,
              lines: values.lines.map((line) => ({
                item_id: Number(line.item_id),
                quantity: Number(line.quantity),
              })),
            })
            alerts.success('Stock issued', {
              description: `${moved.length} ${moved.length === 1 ? 'item' : 'items'} issued`,
            })
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function IssueForm({
  item,
  itemId,
  storeId,
  onSubmit,
}: {
  item?: StockItemDetail
  itemId?: number
  storeId?: number
  onSubmit: (values: FormValues) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      store_id: storeId ? String(storeId) : '',
      target: 'department',
      department_id: '',
      user_id: '',
      section_id: '',
      purpose: '',
      lines: [emptyLine(itemId ? { id: itemId, name: item?.name ?? '' } : undefined)],
    },
  })
  const [target, departmentId, userId, sectionId, watchedStore] = useWatch({
    control,
    name: ['target', 'department_id', 'user_id', 'section_id', 'store_id'],
  })
  const values = {
    target,
    department_id: departmentId,
    user_id: userId,
    section_id: sectionId,
    store_id: watchedStore,
  }

  const submit = handleSubmit(async (input) => {
    try {
      await onSubmit(input)
    } catch (error) {
      mapApiError(error, setError, [
        'store_id',
        'department_id',
        'user_id',
        'section_id',
        'purpose',
        'lines',
      ])
    }
  })

  const targetError =
    errors.target?.message ??
    errors.department_id?.message ??
    errors.user_id?.message ??
    errors.section_id?.message

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      <FormAlert message={errors.root?.message} />
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField id='issue-store' label='From store' required error={errors.store_id?.message}>
          <Controller
            control={control}
            name='store_id'
            render={({ field }) => (
              <StorePicker
                id='issue-store'
                label='Store'
                value={field.value || undefined}
                invalid={Boolean(errors.store_id)}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
        <FormField id='issue-purpose' label='Purpose' required error={errors.purpose?.message}>
          <Input
            id='issue-purpose'
            autoComplete='off'
            placeholder='Chart work for 6-A'
            aria-invalid={Boolean(errors.purpose)}
            {...register('purpose')}
          />
        </FormField>
        <div className='grid gap-1.5 sm:col-span-2'>
          <span className='text-xs font-semibold'>
            Given to<span className='ml-0.5 text-destructive'>*</span>
          </span>
          <IssueTargetFields
            idPrefix='issue'
            target={values.target}
            departmentId={values.department_id}
            userId={values.user_id}
            sectionId={values.section_id}
            error={targetError}
            onChange={(patch) =>
              Object.entries(patch).forEach(([key, value]) =>
                setValue(key as keyof FormValues, value as never, { shouldValidate: false })
              )
            }
          />
        </div>
      </div>
      <Controller
        control={control}
        name='lines'
        render={({ field }) => (
          <StockLinesEditor
            idPrefix='issue'
            value={field.value}
            onChange={field.onChange}
            storeId={values.store_id ? Number(values.store_id) : undefined}
            errors={lineMessages(errors.lines)}
            listError={listMessage(errors.lines)}
          />
        )}
      />
    </form>
  )
}
