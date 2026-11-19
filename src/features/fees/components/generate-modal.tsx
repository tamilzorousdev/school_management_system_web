import { useState } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Input } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { formatDate } from '@/lib/format'
import {
  feesApi,
  useFeePlans,
  useFeesMutation,
  type FeePlanSummary,
  type GenerateInput,
} from '../api'
import { formErrors, invoicesText, rupees } from '../labels'

const FORM_ID = 'fee-generate-form'

export function GenerateModal({ onClose }: { onClose: () => void }) {
  const plans = useFeePlans()
  const [installment, setInstallment] = useState<string | undefined>()
  const [classId, setClassId] = useState<string | undefined>()
  const [dueDate, setDueDate] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const generate = useFeesMutation((input: GenerateInput) => feesApi.generate(input))

  const classes: FeePlanSummary[] = plans.data ?? []
  const installmentOptions = [
    ...new Map(
      classes
        .flatMap((row) => row.installments)
        .sort((a, b) => a.due_date.localeCompare(b.due_date))
        .map((item) => [item.installment, item])
    ).values(),
  ].map((item) => ({
    value: item.installment,
    label: item.installment,
    hint: `due ${formatDate(item.due_date)}`,
  }))
  const classOptions = classes
    .filter(
      (row) => !installment || row.installments.some((item) => item.installment === installment)
    )
    .map((row) => ({
      value: String(row.class_id),
      label: `Class ${row.class_name}`,
      hint: `${row.student_count} students`,
    }))

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Generate invoices'
      description='Raises an invoice for every active student who does not have one for this installment yet. Students on the bus get a transport line from their stop fee. Parents are told in the app.'
      formId={FORM_ID}
      submitText='Generate invoices'
      loading={generate.isPending}
    >
      <form
        id={FORM_ID}
        noValidate
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={async (event) => {
          event.preventDefault()
          const next: Record<string, string> = {}
          if (!installment) next.installment = 'Choose the installment'
          setErrors(next)
          if (Object.keys(next).length) return
          try {
            const result = await generate.mutateAsync({
              installment: installment!,
              class_id: classId ? Number(classId) : undefined,
              due_date: dueDate || undefined,
            })
            if (result.created) {
              alerts.success(`${invoicesText(result.created)} raised for ${result.installment}`, {
                description: [
                  `${rupees(result.total_amount)} in all`,
                  `${result.with_transport} with transport`,
                  result.with_benefits
                    ? `${result.with_benefits} with concessions or scholarships (${rupees(result.benefit_amount)} off)`
                    : null,
                  `${result.already_invoiced} already had one`,
                ]
                  .filter(Boolean)
                  .join(' · '),
              })
            } else {
              alerts.info(`No new invoices for ${result.installment}`, {
                description: `All ${result.already_invoiced} students already have one.`,
              })
            }
            onClose()
          } catch (error) {
            setErrors(formErrors(error, { NO_PLAN_FOR_INSTALLMENT: 'installment' }))
          }
        }}
      >
        <FormField
          id='generate-installment'
          label='Installment'
          required
          error={errors.installment}
        >
          <Combobox
            id='generate-installment'
            label='Installment'
            value={installment}
            options={installmentOptions}
            placeholder='Choose the installment'
            searchPlaceholder='Search installments'
            emptyText='Set up a fee plan first'
            invalid={Boolean(errors.installment)}
            highlightSelected={false}
            className='sm:w-full'
            onChange={(value) => {
              setInstallment(value)
              setClassId(undefined)
              setErrors({})
            }}
          />
        </FormField>
        <FormField id='generate-class' label='Class' error={errors.class_id}>
          <Combobox
            id='generate-class'
            label='Class'
            value={classId}
            options={classOptions}
            allLabel='All classes with this installment'
            placeholder='All classes with this installment'
            searchPlaceholder='Search classes'
            highlightSelected={false}
            className='sm:w-full'
            onChange={setClassId}
          />
        </FormField>
        <FormField
          id='generate-due'
          label='Due date'
          error={errors.due_date}
          hint='Leave empty to use the date in the fee plan'
          className='sm:col-span-2'
        >
          <Input
            id='generate-due'
            type='date'
            value={dueDate}
            className='sm:max-w-56'
            aria-invalid={Boolean(errors.due_date) || undefined}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
