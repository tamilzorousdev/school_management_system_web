import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Input, Textarea } from '@/components/ui/input'
import { applyFieldErrors } from '@/features/maintenance/helpers'
import { FormAlert } from '@/features/maintenance/components/shared'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { gateApi, useGateMutation, type Block, type BlockInput } from '../api'

const FORM_ID = 'gate-block-form'

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Enter the name, 2 to 80 letters')
    .max(80, 'Enter the name, 2 to 80 letters'),
  mobile: z
    .string()
    .trim()
    .refine((value) => !value || /^[6-9]\d{9}$/.test(value), 'Enter a 10-digit mobile number'),
  reason: z
    .string()
    .trim()
    .min(3, 'Enter the reason, 3 to 300 characters')
    .max(300, 'Enter the reason, 3 to 300 characters'),
})

type FormValues = z.infer<typeof schema>
const FIELDS: (keyof FormValues)[] = ['name', 'mobile', 'reason']

interface BlockFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  block: Block | null
}

export function BlockFormModal({ open, onOpenChange, block }: BlockFormModalProps) {
  const save = useGateMutation((input: BlockInput) =>
    block ? gateApi.updateBlock(block.id, input) : gateApi.addBlock(input)
  )
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={block ? 'Edit blocked person' : 'Block a person'}
      description='When this name or mobile comes to the gate, the guard and the office are alerted at once.'
      formId={FORM_ID}
      submitText={block ? 'Save changes' : 'Block'}
      loading={save.isPending}
    >
      {open && (
        <BlockForm
          key={block?.id ?? 'new'}
          block={block}
          onSubmit={async (input) => {
            await save.mutateAsync(input)
            alerts.success(block ? 'Blocked list updated' : 'Added to the blocked list')
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
  onSubmit: (input: BlockInput) => Promise<void>
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: block?.name ?? '',
      mobile: block?.mobile ?? '',
      reason: block?.reason ?? '',
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        name: values.name,
        mobile: values.mobile || (block ? null : undefined),
        reason: values.reason,
      })
    } catch (error) {
      const apiError = toApiError(error)
      if (!applyFieldErrors(apiError, FIELDS, setError))
        setError('root', { message: apiError.message })
    }
  })

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4 sm:grid-cols-2'>
      <FormAlert message={errors.root?.message} />
      <FormField id='block-name' label='Name' required error={errors.name?.message}>
        <Input
          id='block-name'
          maxLength={80}
          placeholder='Ravi Kumar'
          aria-invalid={Boolean(errors.name) || undefined}
          {...register('name')}
        />
      </FormField>
      <FormField
        id='block-mobile'
        label='Mobile'
        error={errors.mobile?.message}
        hint='Helps the gate match the person'
      >
        <Input
          id='block-mobile'
          inputMode='numeric'
          maxLength={10}
          placeholder='9876500044'
          aria-invalid={Boolean(errors.mobile) || undefined}
          {...register('mobile')}
        />
      </FormField>
      <FormField
        id='block-reason'
        label='Reason'
        required
        error={errors.reason?.message}
        className='sm:col-span-2'
      >
        <Textarea
          id='block-reason'
          rows={3}
          maxLength={300}
          placeholder='Court order: not allowed to take the student'
          aria-invalid={Boolean(errors.reason) || undefined}
          {...register('reason')}
        />
      </FormField>
    </form>
  )
}
