import type { ReactNode } from 'react'
import { Controller, useForm, type Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { libraryApi, useLibraryMutation, useLibrarySettings, type LibrarySettings } from '../api'
import { optionalAmount, requiredAmount, requiredInt } from '../form-utils'
import { FormError } from './library-parts'

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

const schema = z.object({
  student_loan_days: requiredInt(1, 120, 'Student loan days'),
  staff_loan_days: requiredInt(1, 365, 'Staff loan days'),
  student_max_books: requiredInt(0, 20, 'Student book limit'),
  staff_max_books: requiredInt(0, 50, 'Staff book limit'),
  fine_per_day: requiredAmount(0, 1000, 'Fine per day'),
  grace_days: requiredInt(0, 30, 'Grace days'),
  max_fine_per_book: optionalAmount(100000, 'Fine cap'),
  lost_processing_fee: requiredAmount(0, 100000, 'Lost book fee'),
  max_renewals: requiredInt(0, 10, 'Renewals'),
  block_issue_above_fine: requiredAmount(0, 100000, 'Block threshold'),
  skip_holidays: z.boolean(),
  charge_staff_fines: z.boolean(),
  due_soon_days: requiredInt(0, 14, 'Due soon days'),
  escalate_after_days: requiredInt(1, 90, 'Class teacher alert'),
  long_overdue_days: requiredInt(2, 365, 'Long overdue'),
  opening_time: z.string().regex(TIME, 'Use HH:mm'),
  closing_time: z.string().regex(TIME, 'Use HH:mm'),
  isbn_lookup: z.boolean(),
})

type FormValues = z.infer<typeof schema>
type NumberField = Exclude<
  keyof FormValues,
  'skip_holidays' | 'charge_staff_fines' | 'isbn_lookup' | 'opening_time' | 'closing_time'
>

const toForm = (settings: LibrarySettings): FormValues => ({
  student_loan_days: String(settings.student_loan_days),
  staff_loan_days: String(settings.staff_loan_days),
  student_max_books: String(settings.student_max_books),
  staff_max_books: String(settings.staff_max_books),
  fine_per_day: String(settings.fine_per_day),
  grace_days: String(settings.grace_days),
  max_fine_per_book: settings.max_fine_per_book === null ? '' : String(settings.max_fine_per_book),
  lost_processing_fee: String(settings.lost_processing_fee),
  max_renewals: String(settings.max_renewals),
  block_issue_above_fine: String(settings.block_issue_above_fine),
  skip_holidays: settings.skip_holidays,
  charge_staff_fines: settings.charge_staff_fines,
  due_soon_days: String(settings.due_soon_days),
  escalate_after_days: String(settings.escalate_after_days),
  long_overdue_days: String(settings.long_overdue_days),
  opening_time: settings.opening_time,
  closing_time: settings.closing_time,
  isbn_lookup: settings.isbn_lookup,
})

export function SettingsTab() {
  const settings = useLibrarySettings()
  if (settings.isError && !settings.data) {
    return <ErrorState message={settings.error.message} onRetry={() => settings.refetch()} />
  }
  if (!settings.data) return <Skeleton className='h-96' />
  return <SettingsForm key={JSON.stringify(settings.data)} settings={settings.data} />
}

function SettingsForm({ settings }: { settings: LibrarySettings }) {
  const canManage = can(useMe().data, 'library.manage')
  const save = useLibraryMutation((values: FormValues) =>
    libraryApi.saveSettings({
      student_loan_days: Number(values.student_loan_days),
      staff_loan_days: Number(values.staff_loan_days),
      student_max_books: Number(values.student_max_books),
      staff_max_books: Number(values.staff_max_books),
      fine_per_day: Number(values.fine_per_day),
      grace_days: Number(values.grace_days),
      max_fine_per_book: values.max_fine_per_book ? Number(values.max_fine_per_book) : null,
      lost_processing_fee: Number(values.lost_processing_fee),
      max_renewals: Number(values.max_renewals),
      block_issue_above_fine: Number(values.block_issue_above_fine),
      skip_holidays: values.skip_holidays,
      charge_staff_fines: values.charge_staff_fines,
      due_soon_days: Number(values.due_soon_days),
      escalate_after_days: Number(values.escalate_after_days),
      long_overdue_days: Number(values.long_overdue_days),
      opening_time: values.opening_time,
      closing_time: values.closing_time,
      isbn_lookup: values.isbn_lookup,
    })
  )
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toForm(settings) })

  const submit = handleSubmit(async (values) => {
    if (
      values.long_overdue_days &&
      Number(values.long_overdue_days) <= Number(values.escalate_after_days)
    ) {
      setError('long_overdue_days', { message: 'Make this later than the class teacher alert' })
      return
    }
    try {
      await save.mutateAsync(values)
      alerts.success('Library settings saved')
    } catch (error) {
      const apiError = toApiError(error)
      let mapped = false
      apiError.fieldErrors.forEach((item) => {
        if (item.field in schema.shape) {
          setError(item.field as keyof FormValues, { message: item.message })
          mapped = true
        }
      })
      if (!mapped) setError('root', { message: apiError.message })
    }
  })

  const number = (name: NumberField, label: string, hint?: string, unit?: string) => (
    <FormField id={`settings-${name}`} label={label} hint={hint} error={errors[name]?.message}>
      <div className='flex items-center gap-2'>
        <Input
          id={`settings-${name}`}
          inputMode='decimal'
          className='w-28'
          aria-invalid={Boolean(errors[name])}
          {...register(name)}
        />
        {unit && <span className='text-xs text-muted-foreground'>{unit}</span>}
      </div>
    </FormField>
  )

  return (
    <form noValidate onSubmit={submit} className='grid gap-4'>
      <FormError message={errors.root?.message} />
      <fieldset disabled={!canManage} className='grid gap-4'>
        <Group title='Loans' description='New loans use these. Members can have their own limit.'>
          {number('student_loan_days', 'Student loan', undefined, 'days')}
          {number('staff_loan_days', 'Staff loan', undefined, 'days')}
          {number('student_max_books', 'Books a student can hold', undefined, 'books')}
          {number('staff_max_books', 'Books a staff member can hold', undefined, 'books')}
          {number('max_renewals', 'Renewals per loan', undefined, 'times')}
          <ToggleRow
            control={control}
            name='skip_holidays'
            label='Skip holidays'
            hint='Due dates skip Sundays and holidays; late days ignore them'
          />
        </Group>
        <Group title='Fines' description='Late fines are raised when the book comes back.'>
          {number('fine_per_day', 'Fine per late day', undefined, '₹')}
          {number('grace_days', 'Grace days', 'Late days with no fine', 'days')}
          {number('max_fine_per_book', 'Fine cap per book', 'Leave empty for no cap', '₹')}
          {number('lost_processing_fee', 'Lost book fee', 'Added to the book price', '₹')}
          {number(
            'block_issue_above_fine',
            'Block new books above',
            'Unpaid fines above this stop issuing; 0 never blocks',
            '₹'
          )}
          <ToggleRow
            control={control}
            name='charge_staff_fines'
            label='Charge staff late fines'
            hint='Off: staff are reminded but not fined'
          />
        </Group>
        <Group title='Alerts' description='Who is told when a book is late.'>
          {number('due_soon_days', 'Due soon reminder', 'Days before the due date', 'days')}
          {number('escalate_after_days', 'Tell the class teacher after', undefined, 'days late')}
          {number('long_overdue_days', 'Ask the office to mark lost after', undefined, 'days late')}
        </Group>
        <Group title='Library' description='Opening hours and the catalogue.'>
          <FormField id='settings-opening' label='Opens at' error={errors.opening_time?.message}>
            <Controller
              control={control}
              name='opening_time'
              render={({ field }) => (
                <Input
                  id='settings-opening'
                  type='time'
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                  disabled={!canManage}
                />
              )}
            />
          </FormField>
          <FormField id='settings-closing' label='Closes at' error={errors.closing_time?.message}>
            <Controller
              control={control}
              name='closing_time'
              render={({ field }) => (
                <Input
                  id='settings-closing'
                  type='time'
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                  disabled={!canManage}
                />
              )}
            />
          </FormField>
          <ToggleRow
            control={control}
            name='isbn_lookup'
            label='Fill new books from the online ISBN lookup'
            hint={
              settings.isbn_lookup_available
                ? 'Scanning an ISBN fills the title, authors and publisher'
                : 'Not available: the server has no book lookup service set up'
            }
            disabled={!settings.isbn_lookup_available}
          />
        </Group>
      </fieldset>
      {canManage && (
        <div className='flex justify-end'>
          <Button type='submit' loading={save.isPending} disabled={!isDirty}>
            Save settings
          </Button>
        </div>
      )}
    </form>
  )
}

function Group({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <Card className='grid gap-4 p-4 sm:p-5'>
      <div className='grid gap-0.5'>
        <h2 className='font-bold'>{title}</h2>
        <p className='text-xs text-muted-foreground'>{description}</p>
      </div>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>{children}</div>
    </Card>
  )
}

function ToggleRow({
  control,
  name,
  label,
  hint,
  disabled,
}: {
  control: Control<FormValues>
  name: 'skip_holidays' | 'charge_staff_fines' | 'isbn_lookup'
  label: string
  hint: string
  disabled?: boolean
}) {
  return (
    <div className='flex items-center justify-between gap-3 rounded-lg border px-3 py-2 sm:col-span-2 lg:col-span-1'>
      <div className='grid'>
        <span className='text-sm font-semibold'>{label}</span>
        <span className='text-xs text-muted-foreground'>{hint}</span>
      </div>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Switch
            checked={field.value}
            onCheckedChange={field.onChange}
            aria-label={label}
            disabled={disabled}
          />
        )}
      />
    </div>
  )
}
