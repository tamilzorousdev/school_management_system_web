import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Input } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { libraryApi, useLibraryMutation, type Member } from '../api'
import { numberOrNull, optionalInt, optionalText, textOrNull } from '../form-utils'
import { FormError } from './library-parts'

const FORM_ID = 'library-member-form'

const schema = z
  .object({
    status: z.enum(['active', 'suspended']),
    status_reason: optionalText(255, 'Reason'),
    max_books: optionalInt(0, 50, 'Book limit'),
    loan_days: optionalInt(1, 365, 'Loan days'),
  })
  .refine((value) => value.status === 'active' || value.status_reason.trim().length > 0, {
    path: ['status_reason'],
    message: 'Say why the member is suspended',
  })

type FormValues = z.infer<typeof schema>

export function MemberEditModal({ member, onClose }: { member: Member; onClose: () => void }) {
  const save = useLibraryMutation((values: FormValues) =>
    libraryApi.updateMember(member.id, {
      status: values.status,
      status_reason: values.status === 'suspended' ? textOrNull(values.status_reason) : null,
      max_books: numberOrNull(values.max_books),
      loan_days: numberOrNull(values.loan_days),
    })
  )
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: member.status === 'suspended' ? 'suspended' : 'active',
      status_reason: member.status_reason ?? '',
      max_books: member.max_books_override === null ? '' : String(member.max_books_override),
      loan_days: member.loan_days_override === null ? '' : String(member.loan_days_override),
    },
  })

  const status = useWatch({ control, name: 'status' })

  const submit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync(values)
      alerts.success('Member saved')
      onClose()
    } catch (error) {
      const apiError = toApiError(error)
      const field = apiError.fieldErrors[0]?.field
      if (field === 'max_books' || field === 'loan_days' || field === 'status_reason') {
        setError(field, { message: apiError.fieldErrors[0].message })
      } else {
        setError('root', { message: apiError.message })
      }
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Membership'
      description={`${member.name} · ${member.card_no}`}
      formId={FORM_ID}
      submitText='Save'
      loading={save.isPending}
    >
      <form id={FORM_ID} noValidate onSubmit={submit} className='grid gap-4 sm:grid-cols-2'>
        <div className='sm:col-span-2'>
          <FormError message={errors.root?.message} />
        </div>
        <FormField id='member-status' label='Status' className='sm:col-span-2'>
          <Controller
            control={control}
            name='status'
            render={({ field }) => (
              <SegmentedControl
                label='Status'
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'suspended', label: 'Suspended' },
                ]}
                className='self-start'
              />
            )}
          />
        </FormField>
        {status === 'suspended' && (
          <FormField
            id='member-reason'
            label='Reason'
            required
            error={errors.status_reason?.message}
            className='sm:col-span-2'
          >
            <Input id='member-reason' autoFocus {...register('status_reason')} />
          </FormField>
        )}
        <FormField
          id='member-max-books'
          label='Own book limit'
          hint={`Empty: the school default. Now ${member.max_books}.`}
          error={errors.max_books?.message}
        >
          <Input id='member-max-books' inputMode='numeric' {...register('max_books')} />
        </FormField>
        <FormField
          id='member-loan-days'
          label='Own loan days'
          hint={`Empty: the school default. Now ${member.loan_days}.`}
          error={errors.loan_days?.message}
        >
          <Input id='member-loan-days' inputMode='numeric' {...register('loan_days')} />
        </FormField>
      </form>
    </AppModal>
  )
}
