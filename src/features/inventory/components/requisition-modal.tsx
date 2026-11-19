import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Input } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { inventoryApi, useInventoryMutation } from '../api'
import { blankToUndefined, REQUISITION_STATUS, today } from '../labels'
import { StorePicker } from './pickers'
import {
  emptyLine,
  lineMessages,
  linesField,
  listMessage,
  mapApiError,
  optionalDateField,
  targetFields,
  targetIds,
  targetMissing,
} from './stock-form'
import { FormAlert, StockLinesEditor } from './stock-lines'
import { IssueTargetFields } from './stock-target'

const FORM_ID = 'requisition-form'

const schema = z
  .object({
    store_id: z.string().min(1, 'Choose the store'),
    ...targetFields,
    purpose: z
      .string()
      .trim()
      .min(3, 'Say what it is for')
      .max(255, 'Keep it under 255 characters'),
    needed_by: optionalDateField,
    lines: linesField,
  })
  .superRefine((values, context) => {
    const message = targetMissing(values)
    if (message) context.addIssue({ code: 'custom', path: ['target'], message })
  })

type FormValues = z.infer<typeof schema>

export function RequisitionModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (id: number) => void
}) {
  const raise = useInventoryMutation(inventoryApi.raiseRequisition)
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='New requisition'
      description='Ask the store for stock for a department, a staff member or a class.'
      formId={FORM_ID}
      submitText='Raise requisition'
      loading={raise.isPending}
      size='lg'
    >
      {open && (
        <RequisitionForm
          onSubmit={async (values) => {
            const created = await raise.mutateAsync({
              store_id: Number(values.store_id),
              department_id: targetIds(values).department_id,
              requested_for_user_id: targetIds(values).user_id,
              section_id: targetIds(values).section_id,
              purpose: values.purpose,
              needed_by: blankToUndefined(values.needed_by),
              lines: values.lines.map((line) => ({
                item_id: Number(line.item_id),
                quantity: Number(line.quantity),
              })),
            })
            alerts.success('Requisition raised', {
              description: `${created.requisition_no} · ${REQUISITION_STATUS[created.status].label}`,
            })
            onOpenChange(false)
            onCreated?.(created.id)
          }}
        />
      )}
    </AppModal>
  )
}

function RequisitionForm({ onSubmit }: { onSubmit: (values: FormValues) => Promise<void> }) {
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
      store_id: '',
      target: 'department',
      department_id: '',
      user_id: '',
      section_id: '',
      purpose: '',
      needed_by: '',
      lines: [emptyLine()],
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
        'section_id',
        'purpose',
        'needed_by',
        'lines',
      ])
    }
  })

  const targetError =
    errors.target?.message ?? errors.department_id?.message ?? errors.section_id?.message

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      <FormAlert message={errors.root?.message} />
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField id='req-store' label='From store' required error={errors.store_id?.message}>
          <Controller
            control={control}
            name='store_id'
            render={({ field }) => (
              <StorePicker
                id='req-store'
                label='Store'
                value={field.value || undefined}
                invalid={Boolean(errors.store_id)}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
        <FormField id='req-needed' label='Needed by' error={errors.needed_by?.message}>
          <Controller
            control={control}
            name='needed_by'
            render={({ field }) => (
              <Input
                id='req-needed'
                type='date'
                name={field.name}
                value={field.value}
                min={today()}
                onChange={(event) => field.onChange(event.target.value)}
              />
            )}
          />
        </FormField>
        <FormField
          id='req-purpose'
          label='Purpose'
          required
          error={errors.purpose?.message}
          className='sm:col-span-2'
        >
          <Input
            id='req-purpose'
            autoComplete='off'
            placeholder='Chart work for 6-A'
            aria-invalid={Boolean(errors.purpose)}
            {...register('purpose')}
          />
        </FormField>
        <div className='grid gap-1.5 sm:col-span-2'>
          <span className='text-xs font-semibold'>
            For<span className='ml-0.5 text-destructive'>*</span>
          </span>
          <IssueTargetFields
            idPrefix='req'
            target={values.target}
            departmentId={values.department_id}
            userId={values.user_id}
            sectionId={values.section_id}
            error={targetError}
            onChange={(patch) =>
              Object.entries(patch).forEach(([key, value]) =>
                setValue(key as keyof FormValues, value as never)
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
            idPrefix='req'
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
