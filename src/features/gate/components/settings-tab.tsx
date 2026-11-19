import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { gateApi, useGateMutation, useGateSettings, type GateSettings } from '../api'
import type { GateTabProps } from '../search'

const FORM_ID = 'gate-settings-form'

const whole = (min: number, max: number, message: string) =>
  z
    .string()
    .trim()
    .refine((value) => {
      const number = Number(value)
      return value !== '' && Number.isInteger(number) && number >= min && number <= max
    }, message)

const schema = z.object({
  grace_minutes: whole(5, 180, 'Enter 5 to 180 minutes'),
  emergency_wait_minutes: whole(1, 60, 'Enter 1 to 60 minutes'),
  visitor_checkout_time: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Enter time in HH:MM format (e.g. 18:00)'),
})

type FormValues = z.infer<typeof schema>
const FIELDS: (keyof FormValues)[] = [
  'grace_minutes',
  'emergency_wait_minutes',
  'visitor_checkout_time',
]

export function SettingsTab({ canManage }: GateTabProps) {
  const settings = useGateSettings()

  return (
    <div className='grid max-w-4xl gap-6'>
      <Card className='grid content-start gap-4 p-4 sm:p-6'>
        <div className='grid gap-0.5'>
          <span className='font-semibold'>Gate and pass timings</span>
          <span className='text-sm text-muted-foreground'>
            Window rules, emergency approval time limit, and end-of-day auto checkout.
          </span>
        </div>
        {settings.isPending ? (
          <Skeleton className='h-48' />
        ) : settings.isError ? (
          <ErrorState message={settings.error.message} onRetry={() => settings.refetch()} />
        ) : (
          <SettingsForm
            key={JSON.stringify(settings.data)}
            settings={settings.data}
            canManage={canManage}
          />
        )}
      </Card>
      {settings.data && <SecurityRules settings={settings.data} canManage={canManage} />}
    </div>
  )
}

function SettingsForm({ settings, canManage }: { settings: GateSettings; canManage: boolean }) {
  const save = useGateMutation((input: Partial<GateSettings>) => gateApi.updateSettings(input))
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      grace_minutes: String(settings.grace_minutes),
      emergency_wait_minutes: String(settings.emergency_wait_minutes),
      visitor_checkout_time: settings.visitor_checkout_time || '18:00',
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync({
        grace_minutes: Number(values.grace_minutes),
        emergency_wait_minutes: Number(values.emergency_wait_minutes),
        visitor_checkout_time: values.visitor_checkout_time,
      })
      alerts.success('Settings saved')
    } catch (error) {
      const apiError = toApiError(error)
      apiError.fieldErrors.forEach((fieldError) => {
        const field = FIELDS.find((item) => item === fieldError.field)
        if (field) setError(field, { message: fieldError.message })
      })
      if (!apiError.fieldErrors.length) {
        setError('root', { message: apiError.message })
      }
    }
  })

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4 sm:grid-cols-2'>
      {errors.root?.message && (
        <p
          role='alert'
          className='rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive sm:col-span-2'
        >
          {errors.root.message}
        </p>
      )}
      <FormField
        id='settings-grace'
        label='Pass grace period (minutes)'
        hint='How long after the window a pass can still be checked at the gate'
        error={errors.grace_minutes?.message}
      >
        <Input
          id='settings-grace'
          type='number'
          inputMode='numeric'
          disabled={!canManage}
          min={5}
          max={180}
          aria-invalid={Boolean(errors.grace_minutes) || undefined}
          {...register('grace_minutes')}
        />
      </FormField>
      <FormField
        id='settings-emergency'
        label='Emergency approval wait (minutes)'
        hint='Minutes before an emergency request escalates or shows call office'
        error={errors.emergency_wait_minutes?.message}
      >
        <Input
          id='settings-emergency'
          type='number'
          inputMode='numeric'
          disabled={!canManage}
          min={1}
          max={60}
          aria-invalid={Boolean(errors.emergency_wait_minutes) || undefined}
          {...register('emergency_wait_minutes')}
        />
      </FormField>
      <FormField
        id='settings-checkout'
        label='Daily visitor auto checkout'
        hint='Time of day (HH:MM) when visitors inside are automatically checked out'
        error={errors.visitor_checkout_time?.message}
        className='sm:col-span-2 sm:max-w-xs'
      >
        <Input
          id='settings-checkout'
          type='time'
          disabled={!canManage}
          aria-invalid={Boolean(errors.visitor_checkout_time) || undefined}
          {...register('visitor_checkout_time')}
        />
      </FormField>
      {canManage && (
        <div className='flex items-end sm:col-span-2'>
          <Button type='submit' loading={save.isPending} disabled={!isDirty}>
            Save settings
          </Button>
        </div>
      )}
    </form>
  )
}

function SecurityRules({ settings, canManage }: { settings: GateSettings; canManage: boolean }) {
  const save = useGateMutation((input: Partial<GateSettings>) => gateApi.updateSettings(input))

  const toggle = async (key: keyof GateSettings, value: boolean, label: string) => {
    try {
      await save.mutateAsync({ [key]: value })
      alerts.success(`${label} updated`)
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  return (
    <div className='grid gap-4'>
      <Card className='grid gap-3 p-4'>
        <div className='flex items-start justify-between gap-3'>
          <div className='grid gap-0.5'>
            <label htmlFor='rule-photo' className='font-semibold'>
              Visitor photo required
            </label>
            <span className='text-sm text-muted-foreground'>
              {settings.visitor_photo_required
                ? 'Required: gate staff must capture a photo before issuing a visitor pass.'
                : 'Optional: visitors can enter without a photo captured at the gate.'}
            </span>
          </div>
          <Switch
            id='rule-photo'
            checked={settings.visitor_photo_required}
            disabled={!canManage || save.isPending}
            onCheckedChange={(checked) =>
              toggle('visitor_photo_required', checked, 'Visitor photo rule')
            }
          />
        </div>
      </Card>
      <Card className='grid gap-3 p-4'>
        <div className='flex items-start justify-between gap-3'>
          <div className='grid gap-0.5'>
            <label htmlFor='rule-id' className='font-semibold'>
              Visitor ID proof required
            </label>
            <span className='text-sm text-muted-foreground'>
              {settings.visitor_id_required
                ? 'Required: ID document type and number must be recorded for all walk-in visitors.'
                : 'Optional: ID proof is not mandatory for visitor entry.'}
            </span>
          </div>
          <Switch
            id='rule-id'
            checked={settings.visitor_id_required}
            disabled={!canManage || save.isPending}
            onCheckedChange={(checked) => toggle('visitor_id_required', checked, 'Visitor ID rule')}
          />
        </div>
      </Card>
      <Card className='grid gap-3 p-4'>
        <div className='flex items-start justify-between gap-3'>
          <div className='grid gap-0.5'>
            <label htmlFor='rule-manual' className='font-semibold'>
              Notify office on manual student release
            </label>
            <span className='text-sm text-muted-foreground'>
              {settings.notify_office_on_manual
                ? 'Active: the school office receives an instant notification whenever a student is released without a QR code or numeric code.'
                : 'Inactive: manual gate releases are logged but do not send a separate office notification.'}
            </span>
          </div>
          <Switch
            id='rule-manual'
            checked={settings.notify_office_on_manual}
            disabled={!canManage || save.isPending}
            onCheckedChange={(checked) =>
              toggle('notify_office_on_manual', checked, 'Manual release notification rule')
            }
          />
        </div>
      </Card>
    </div>
  )
}

