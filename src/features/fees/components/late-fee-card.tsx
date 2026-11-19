import { useState } from 'react'
import { Pencil, TimerReset } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import type { FeeAccess } from '../access'
import {
  feesApi,
  useFeeSettings,
  useFeesMutation,
  type FeeSettings,
  type LateFeeType,
} from '../api'
import { amountError, formErrors, invoicesText, rupees } from '../labels'

function describe(settings: FeeSettings) {
  const grace = `${settings.grace_days} ${settings.grace_days === 1 ? 'day' : 'days'} of grace`
  if (settings.late_fee_type === 'none') return `No late fee · ${grace} before overdue reminders`
  const fee =
    settings.late_fee_type === 'flat'
      ? rupees(settings.late_fee_value)
      : `${Number(settings.late_fee_value)}% of the unpaid balance`
  return `${fee} once, after ${grace}`
}

export function LateFeeCard({ access }: { access: FeeAccess }) {
  const settings = useFeeSettings()
  const [editing, setEditing] = useState(false)
  const run = useFeesMutation(() => feesApi.runLateFees())
  const data = settings.data

  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
        <h2 className='font-bold'>Late fee</h2>
        {access.configure && data && (
          <Button
            size='sm'
            variant='ghost'
            aria-label='Edit late fee'
            onClick={() => setEditing(true)}
          >
            <Pencil />
          </Button>
        )}
      </div>
      <div className='grid gap-3 px-4 py-3 text-sm'>
        {settings.isPending ? (
          <Skeleton className='h-10' />
        ) : settings.isError || !data ? (
          <ErrorState
            message={settings.error?.message ?? 'Not found'}
            onRetry={() => settings.refetch()}
          />
        ) : (
          <>
            <p>{describe(data)}</p>
            <p className='text-xs text-muted-foreground'>
              Added automatically every morning as a “Late fee” line. Remove it from an invoice with
              a discount request.
            </p>
            {access.configure && data.late_fee_type !== 'none' && (
              <Button
                size='sm'
                variant='outline'
                className='justify-self-start'
                loading={run.isPending}
                onClick={async () => {
                  try {
                    const outcome = await run.mutateAsync(undefined)
                    alerts.success(
                      outcome.invoices
                        ? `Late fee added to ${invoicesText(outcome.invoices)}`
                        : 'No invoice needs a late fee now',
                      outcome.invoices
                        ? { description: `${rupees(outcome.amount)} in all` }
                        : undefined
                    )
                  } catch (error) {
                    formErrors(error)
                  }
                }}
              >
                <TimerReset />
                Apply now
              </Button>
            )}
          </>
        )}
      </div>
      {editing && data && <LateFeeModal settings={data} onClose={() => setEditing(false)} />}
    </Card>
  )
}

function LateFeeModal({ settings, onClose }: { settings: FeeSettings; onClose: () => void }) {
  const [type, setType] = useState<LateFeeType>(settings.late_fee_type)
  const [value, setValue] = useState(settings.late_fee_value ? String(settings.late_fee_value) : '')
  const [grace, setGrace] = useState(String(settings.grace_days))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useFeesMutation(() =>
    feesApi.saveSettings({
      grace_days: Number(grace),
      late_fee_type: type,
      late_fee_value: type === 'none' ? 0 : Number(value),
    })
  )
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Late fee and grace days'
      description='An invoice still unpaid after its due date plus the grace days gets the late fee once. Overdue reminders to parents also wait for the grace days.'
      formId='fee-late-form'
      loading={save.isPending}
    >
      <form
        id='fee-late-form'
        noValidate
        className='grid gap-4'
        onSubmit={async (event) => {
          event.preventDefault()
          const next: Record<string, string> = {}
          const days = Number(grace)
          if (!/^\d+$/.test(grace.trim()) || days > 90) next.grace_days = 'Enter 0 to 90 days'
          if (type !== 'none') {
            const message = amountError(
              value,
              type === 'percent' ? 100 : 100000,
              type === 'percent' ? 'percentage' : 'amount'
            )
            if (message) next.late_fee_value = message
            else if (!(Number(value) > 0)) next.late_fee_value = 'Enter more than 0'
          }
          setErrors(next)
          if (Object.keys(next).length) return
          try {
            await save.mutateAsync(undefined)
            alerts.success('Late fee saved')
            onClose()
          } catch (error) {
            setErrors(formErrors(error))
          }
        }}
      >
        <SegmentedControl<LateFeeType>
          label='Late fee'
          value={type}
          onChange={setType}
          options={[
            { value: 'none', label: 'No late fee' },
            { value: 'flat', label: 'Fixed amount' },
            { value: 'percent', label: '% of balance' },
          ]}
        />
        {type !== 'none' && (
          <FormField
            id='late-fee-value'
            label={type === 'flat' ? 'Amount' : 'Percentage of the unpaid balance'}
            required
            error={errors.late_fee_value}
          >
            <div className='relative'>
              <span className='pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground'>
                {type === 'flat' ? '₹' : '%'}
              </span>
              <Input
                id='late-fee-value'
                type='number'
                inputMode='decimal'
                min={0}
                step='0.01'
                className='tabular pl-7'
                value={value}
                aria-invalid={Boolean(errors.late_fee_value) || undefined}
                onChange={(event) => setValue(event.target.value)}
              />
            </div>
          </FormField>
        )}
        <FormField
          id='late-fee-grace'
          label='Grace days after the due date'
          required
          error={errors.grace_days}
        >
          <Input
            id='late-fee-grace'
            type='number'
            inputMode='numeric'
            min={0}
            max={90}
            className='tabular sm:w-32'
            value={grace}
            aria-invalid={Boolean(errors.grace_days) || undefined}
            onChange={(event) => setGrace(event.target.value)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
