import { useState, type FormEvent } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { inventoryApi, useInventoryMutation, type AllocateInput } from '../api'
import { blankToNull, targetError, targetInput, today, type TargetValue } from '../labels'
import { FormError } from './asset-shared'
import { AssetMultiPicker, TargetFields, type PickedAsset } from './pickers'

const FORM_ID = 'asset-allocate-form'

export function AllocateModal(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  assets?: PickedAsset[]
}) {
  const { open, onOpenChange, assets } = props
  const allocate = useInventoryMutation((input: AllocateInput) => inventoryApi.allocate(input))
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Allocate assets'
      description='Give assets in store to a staff member, a department or a location. Staff confirm they received them in the app.'
      formId={FORM_ID}
      submitText='Allocate'
      loading={allocate.isPending}
      size='lg'
    >
      {open && (
        <AllocateForm
          initial={(assets ?? []).filter((asset) => asset.status === 'in_store')}
          onSubmit={async (input) => {
            const result = await allocate.mutateAsync(input)
            alerts.success(`${result.length} ${result.length === 1 ? 'asset' : 'assets'} allocated`)
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function AllocateForm({
  initial,
  onSubmit,
}: {
  initial: PickedAsset[]
  onSubmit: (input: AllocateInput) => Promise<void>
}) {
  const [assets, setAssets] = useState<PickedAsset[]>(initial)
  const [target, setTarget] = useState<TargetValue>({ assignee_type: 'staff' })
  const [allocatedOn, setAllocatedOn] = useState(today())
  const [expectedReturn, setExpectedReturn] = useState('')
  const [remarks, setRemarks] = useState('')
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string | undefined> = {
      assets: assets.length ? undefined : 'Choose at least one asset',
      target: targetError(target),
      expected:
        expectedReturn && allocatedOn && expectedReturn < allocatedOn
          ? 'Return date must be after the allocation date'
          : undefined,
    }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return
    try {
      await onSubmit({
        ...targetInput(target),
        asset_ids: assets.map((asset) => asset.id),
        allocated_on: allocatedOn || undefined,
        expected_return_on: expectedReturn || undefined,
        remarks: blankToNull(remarks),
      })
    } catch (caught) {
      const apiError = toApiError(caught)
      setErrors({ root: apiError.fieldErrors[0]?.message ?? apiError.message })
    }
  }

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      <FormError message={errors.root} />
      <FormField id='allocate-assets' label='Assets in store' required error={errors.assets}>
        <AssetMultiPicker
          id='allocate-assets'
          value={assets}
          onChange={setAssets}
          statuses={['in_store']}
          invalid={Boolean(errors.assets)}
        />
      </FormField>
      <FormField id='allocate-target' label='Give to' required>
        <TargetFields
          idPrefix='allocate'
          value={target}
          onChange={setTarget}
          error={errors.target}
        />
      </FormField>
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField id='allocate-on' label='Allocated on'>
          <Input
            id='allocate-on'
            type='date'
            value={allocatedOn}
            onChange={(event) => setAllocatedOn(event.target.value)}
          />
        </FormField>
        <FormField
          id='allocate-return'
          label='Expected return'
          hint='Leave empty for long-term use'
          error={errors.expected}
        >
          <Input
            id='allocate-return'
            type='date'
            value={expectedReturn}
            min={allocatedOn || undefined}
            onChange={(event) => setExpectedReturn(event.target.value)}
          />
        </FormField>
      </div>
      <FormField id='allocate-remarks' label='Remarks'>
        <Textarea
          id='allocate-remarks'
          maxLength={255}
          value={remarks}
          placeholder='Charger and bag given with the laptop'
          onChange={(event) => setRemarks(event.target.value)}
        />
      </FormField>
    </form>
  )
}
