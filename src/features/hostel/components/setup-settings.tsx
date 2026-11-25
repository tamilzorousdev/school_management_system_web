import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { TimePicker } from '@/components/common/time-picker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import {
  hostelApi,
  useHostelMutation,
  useHostelSettings,
  type HostelSettings,
  type HostelSettingsInput,
  type OptionalModule,
} from '../api'
import { MODULE_LABELS } from '../labels'
import { FormAlert, SwitchRow } from './setup-form-parts'
import { applyApiError, MONEY_PATTERN, optionalText, TIME_PATTERN } from './setup-helpers'

const FORM_ID = 'hostel-settings-form'
const time = z.string().regex(TIME_PATTERN, 'Choose a time')

const schema = z.object({
  wake_up_time: time,
  study_start_time: time,
  study_end_time: time,
  in_time: time,
  lights_out_time: time,
  outing_from_time: time,
  outing_until_time: time,
  parent_consent_for_leave: z.boolean(),
  holiday_mode: z.boolean(),
  caution_deposit: z
    .string()
    .trim()
    .refine((value) => !value || MONEY_PATTERN.test(value), 'Enter an amount like 5000'),
  bill_on_admission: z.boolean(),
  rules: z.string().max(5000, 'Up to 5000 characters'),
  enabled_modules: z.object({
    staff_duty: z.boolean(),
    lockers: z.boolean(),
    study_hall: z.boolean(),
    laundry: z.boolean(),
    medical: z.boolean(),
    mess: z.boolean(),
  }),
})
type FormValues = z.infer<typeof schema>
type TimeField =
  | 'wake_up_time'
  | 'study_start_time'
  | 'study_end_time'
  | 'in_time'
  | 'lights_out_time'
  | 'outing_from_time'
  | 'outing_until_time'

const TIMES: { name: TimeField; label: string; hint?: string }[] = [
  { name: 'wake_up_time', label: 'Wake up' },
  { name: 'study_start_time', label: 'Study hour starts' },
  { name: 'study_end_time', label: 'Study hour ends' },
  { name: 'in_time', label: 'Back in by', hint: 'Later returns are marked late' },
  { name: 'lights_out_time', label: 'Lights out' },
  { name: 'outing_from_time', label: 'Outings from' },
  { name: 'outing_until_time', label: 'Outings until' },
]

const MODULE_KEYS = Object.keys(MODULE_LABELS) as OptionalModule[]

const toValues = (settings: HostelSettings): FormValues => ({
  wake_up_time: settings.wake_up_time,
  study_start_time: settings.study_start_time,
  study_end_time: settings.study_end_time,
  in_time: settings.in_time,
  lights_out_time: settings.lights_out_time,
  outing_from_time: settings.outing_from_time,
  outing_until_time: settings.outing_until_time,
  parent_consent_for_leave: settings.parent_consent_for_leave,
  holiday_mode: settings.holiday_mode,
  caution_deposit: String(settings.caution_deposit),
  bill_on_admission: settings.bill_on_admission,
  rules: settings.rules ?? '',
  enabled_modules: { ...settings.enabled_modules },
})

export function SetupSettings() {
  const settings = useHostelSettings()
  if (settings.isError) {
    return (
      <Card>
        <ErrorState message={settings.error.message} onRetry={() => settings.refetch()} />
      </Card>
    )
  }
  if (!settings.data) {
    return (
      <div className='grid gap-4'>
        <Skeleton className='h-56' />
        <Skeleton className='h-40' />
      </div>
    )
  }
  return <SettingsForm settings={settings.data} />
}

function SettingsForm({ settings }: { settings: HostelSettings }) {
  const me = useMe().data
  const canEdit = can(me, 'hostel.settings')
  const save = useHostelMutation((input: HostelSettingsInput) => hostelApi.updateSettings(input))
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toValues(settings) })

  const submit = handleSubmit(async (values) => {
    try {
      const saved = await save.mutateAsync({
        ...values,
        caution_deposit: values.caution_deposit ? Number(values.caution_deposit) : 0,
        rules: optionalText(values.rules),
      })
      reset(toValues(saved))
      alerts.success('Hostel settings saved')
    } catch (error) {
      applyApiError(error, setError, [
        ...TIMES.map((item) => item.name),
        'parent_consent_for_leave',
        'holiday_mode',
        'caution_deposit',
        'bill_on_admission',
        'rules',
      ])
    }
  })

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-6'>
      <FormAlert message={errors.root?.message} />
      {!canEdit && (
        <p className='rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground'>
          You can see these settings. Changing them needs the hostel settings permission.
        </p>
      )}

      <Card className='gap-4 p-5'>
        <div className='grid gap-0.5'>
          <h2 className='font-bold'>Daily timings</h2>
          <p className='text-xs text-muted-foreground'>
            Used for roll call, late returns and outing passes in every hostel.
          </p>
        </div>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {TIMES.map((item) => (
            <FormField
              key={item.name}
              id={`settings-${item.name}`}
              label={item.label}
              required
              error={errors[item.name]?.message}
              hint={item.hint}
            >
              <Controller
                control={control}
                name={item.name}
                render={({ field }) => (
                  <TimePicker
                    id={`settings-${item.name}`}
                    value={field.value}
                    onChange={field.onChange}
                    invalid={Boolean(errors[item.name])}
                    disabled={!canEdit}
                    clearable={false}
                  />
                )}
              />
            </FormField>
          ))}
        </div>
      </Card>

      <Card className='gap-4 p-5'>
        <div className='grid gap-0.5'>
          <h2 className='font-bold'>Leave, fees and rules</h2>
        </div>
        <div className='grid gap-3 lg:grid-cols-3'>
          <Controller
            control={control}
            name='parent_consent_for_leave'
            render={({ field }) => (
              <SwitchRow
                id='settings-consent'
                label='Parent agrees to home leave'
                description='Leave asked by the warden waits for the parent in the Parent app.'
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={!canEdit}
              />
            )}
          />
          <Controller
            control={control}
            name='holiday_mode'
            render={({ field }) => (
              <SwitchRow
                id='settings-holiday'
                label='Holiday mode'
                description='Vacation: roll call and mess are paused.'
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={!canEdit}
              />
            )}
          />
          <Controller
            control={control}
            name='bill_on_admission'
            render={({ field }) => (
              <SwitchRow
                id='settings-bill'
                label='Bill on admission'
                description='Raise the hostel fee and deposit as soon as a student is admitted.'
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={!canEdit}
              />
            )}
          />
        </div>
        <FormField
          id='settings-deposit'
          label='Caution deposit (₹)'
          error={errors.caution_deposit?.message}
          hint='Billed once at admission and refunded at checkout. 0 means none.'
          className='sm:max-w-xs'
        >
          <Input
            id='settings-deposit'
            inputMode='decimal'
            className='tabular'
            disabled={!canEdit}
            aria-invalid={Boolean(errors.caution_deposit)}
            {...register('caution_deposit')}
          />
        </FormField>
        <FormField
          id='settings-rules'
          label='Hostel rules'
          error={errors.rules?.message}
          hint='Shown to parents and students in the app.'
        >
          <Textarea
            id='settings-rules'
            rows={6}
            disabled={!canEdit}
            aria-invalid={Boolean(errors.rules)}
            {...register('rules')}
          />
        </FormField>
      </Card>

      <Card className='gap-4 p-5'>
        <div className='grid gap-0.5'>
          <div className='flex flex-wrap items-center gap-2'>
            <h2 className='font-bold'>Modules</h2>
            <Badge>Optional</Badge>
          </div>
          <p className='text-xs text-muted-foreground'>
            Turn on only what this school uses. A module that is off is hidden in the apps.
          </p>
        </div>
        <div className='grid gap-3 md:grid-cols-2'>
          {MODULE_KEYS.map((key) => (
            <Controller
              key={key}
              control={control}
              name={`enabled_modules.${key}`}
              render={({ field }) => (
                <SwitchRow
                  id={`settings-module-${key}`}
                  label={MODULE_LABELS[key].label}
                  description={MODULE_LABELS[key].description}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={!canEdit}
                />
              )}
            />
          ))}
        </div>
      </Card>

      {canEdit && (
        <div className='flex flex-wrap justify-end gap-2'>
          <Button
            variant='outline'
            disabled={!isDirty || save.isPending}
            onClick={() => reset(toValues(settings))}
          >
            Undo changes
          </Button>
          <Button type='submit' loading={save.isPending} disabled={!isDirty}>
            Save settings
          </Button>
        </div>
      )}
    </form>
  )
}
