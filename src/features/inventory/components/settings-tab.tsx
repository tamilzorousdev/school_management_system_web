import { useState, type FormEvent } from 'react'
import { ErrorState } from '@/components/common/display'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  inventoryApi,
  useInventoryMutation,
  useInventorySettings,
  type DepreciationMethod,
  type InventoryAccess,
  type InventorySettings,
} from '../api'
import { DEPRECIATION_METHOD, options } from '../labels'
import type { InventorySearch, InventorySearchPatch } from '../search'

type ApprovalKey = 'approve_transfers' | 'approve_requisitions' | 'approve_disposals'

const SWITCHES: { key: ApprovalKey; label: string; hint: string }[] = [
  {
    key: 'approve_transfers',
    label: 'Transfers need approval',
    hint: 'An AO, principal or admin approves before assets move.',
  },
  {
    key: 'approve_requisitions',
    label: 'Requisitions need approval',
    hint: 'Stock requests wait for an approver before the store issues them.',
  },
  {
    key: 'approve_disposals',
    label: 'Disposals need approval',
    hint: 'Assets leave the register only after an approver agrees.',
  },
]

export function SettingsTab({
  access,
}: {
  search: InventorySearch
  onChange: (patch: InventorySearchPatch) => void
  access: InventoryAccess
}) {
  const settings = useInventorySettings()

  if (settings.isError) {
    return (
      <Card>
        <ErrorState message={settings.error.message} onRetry={() => settings.refetch()} />
      </Card>
    )
  }
  if (!settings.data) {
    return (
      <Card className='grid gap-3 p-5'>
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className='h-14' />
        ))}
      </Card>
    )
  }
  return (
    <SettingsForm
      key={JSON.stringify(settings.data)}
      initial={settings.data}
      canEdit={access.manage}
    />
  )
}

function SettingsForm({ initial, canEdit }: { initial: InventorySettings; canEdit: boolean }) {
  const [values, setValues] = useState(initial)
  const [warrantyDays, setWarrantyDays] = useState(String(initial.warranty_alert_days))
  const [maintenanceDays, setMaintenanceDays] = useState(String(initial.maintenance_alert_days))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useInventoryMutation(inventoryApi.saveSettings)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    const warranty = Number(warrantyDays)
    const maintenance = Number(maintenanceDays)
    if (!/^\d+$/.test(warrantyDays.trim()) || warranty > 365) {
      next.warranty_alert_days = 'Enter whole days from 0 to 365'
    }
    if (!/^\d+$/.test(maintenanceDays.trim()) || maintenance > 90) {
      next.maintenance_alert_days = 'Enter whole days from 0 to 90'
    }
    setErrors(next)
    if (Object.keys(next).length) return
    try {
      await save.mutateAsync({
        ...values,
        warranty_alert_days: warranty,
        maintenance_alert_days: maintenance,
      })
      alerts.success('Inventory settings saved')
    } catch (error) {
      const apiError = toApiError(error)
      const fieldErrors = Object.fromEntries(
        apiError.fieldErrors.map((item) => [item.field, item.message])
      )
      setErrors(Object.keys(fieldErrors).length ? fieldErrors : { root: apiError.message })
    }
  }

  return (
    <Card className='overflow-hidden'>
      <form onSubmit={submit} noValidate className='grid gap-6 p-4 sm:p-5'>
        {errors.root && (
          <p
            role='alert'
            className='rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive'
          >
            {errors.root}
          </p>
        )}
        <section className='grid gap-3'>
          <h2 className='font-bold'>Approvals</h2>
          {SWITCHES.map((item) => (
            <div
              key={item.key}
              className='flex items-center justify-between gap-4 rounded-lg border bg-muted/40 px-4 py-3'
            >
              <div className='grid gap-0.5'>
                <label htmlFor={item.key} className='text-sm font-semibold'>
                  {item.label}
                </label>
                <p className='text-xs text-muted-foreground'>{item.hint}</p>
              </div>
              <Switch
                id={item.key}
                checked={values[item.key]}
                disabled={!canEdit}
                onCheckedChange={(checked) => setValues({ ...values, [item.key]: checked })}
              />
            </div>
          ))}
        </section>
        <section className='grid gap-4 sm:grid-cols-3'>
          <FormField
            id='depreciation_method'
            label='Depreciation method'
            hint='Used for book value and the depreciation report'
            error={errors.depreciation_method}
          >
            {canEdit ? (
              <Combobox
                id='depreciation_method'
                label='Depreciation method'
                value={values.depreciation_method}
                options={options(DEPRECIATION_METHOD)}
                placeholder='Choose a method'
                highlightSelected={false}
                className='sm:w-full'
                onChange={(value) => {
                  if (value) {
                    setValues({ ...values, depreciation_method: value as DepreciationMethod })
                  }
                }}
              />
            ) : (
              <Input
                id='depreciation_method'
                value={DEPRECIATION_METHOD[values.depreciation_method]}
                disabled
                readOnly
              />
            )}
          </FormField>
          <FormField
            id='warranty_alert_days'
            label='Warranty alert (days before)'
            hint='Warranty and AMC ending within these days show as expiring'
            error={errors.warranty_alert_days}
          >
            <Input
              id='warranty_alert_days'
              inputMode='numeric'
              value={warrantyDays}
              disabled={!canEdit}
              aria-invalid={Boolean(errors.warranty_alert_days)}
              onChange={(event) => setWarrantyDays(event.target.value)}
            />
          </FormField>
          <FormField
            id='maintenance_alert_days'
            label='Maintenance alert (days before)'
            hint='Preventive maintenance due within these days shows as due soon'
            error={errors.maintenance_alert_days}
          >
            <Input
              id='maintenance_alert_days'
              inputMode='numeric'
              value={maintenanceDays}
              disabled={!canEdit}
              aria-invalid={Boolean(errors.maintenance_alert_days)}
              onChange={(event) => setMaintenanceDays(event.target.value)}
            />
          </FormField>
        </section>
        {canEdit ? (
          <div className='flex justify-end'>
            <Button type='submit' loading={save.isPending}>
              Save settings
            </Button>
          </div>
        ) : (
          <p className='text-xs text-muted-foreground'>
            Only users who manage inventory can change these settings.
          </p>
        )}
      </form>
    </Card>
  )
}
