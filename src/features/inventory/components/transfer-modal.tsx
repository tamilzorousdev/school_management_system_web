import { useState, type FormEvent } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { inventoryApi, useInventoryMutation, type TransferInput } from '../api'
import { targetError, targetInput, type TargetValue } from '../labels'
import { FormError } from './asset-shared'
import { AssetMultiPicker, TargetFields, type PickedAsset } from './pickers'

const FORM_ID = 'asset-transfer-form'

export function TransferModal(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  assets?: PickedAsset[]
}) {
  const { open, onOpenChange, assets } = props
  const create = useInventoryMutation((input: TransferInput) => inventoryApi.createTransfer(input))
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Transfer assets'
      description='Move assets to another staff member, department or location. When approvals are on, an approver confirms the move first.'
      formId={FORM_ID}
      submitText='Create transfer'
      loading={create.isPending}
      size='lg'
    >
      {open && (
        <TransferForm
          initial={(assets ?? []).filter(
            (asset) => asset.status !== 'lost' && asset.status !== 'disposed'
          )}
          onSubmit={async (input) => {
            const transfer = await create.mutateAsync(input)
            alerts.success(
              transfer.status === 'requested'
                ? `${transfer.transfer_no} sent for approval`
                : `${transfer.transfer_no} completed`
            )
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function TransferForm({
  initial,
  onSubmit,
}: {
  initial: PickedAsset[]
  onSubmit: (input: TransferInput) => Promise<void>
}) {
  const [assets, setAssets] = useState<PickedAsset[]>(initial)
  const [target, setTarget] = useState<TargetValue>({ assignee_type: 'staff' })
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const text = reason.trim()
    const next = {
      assets: assets.length ? undefined : 'Choose at least one asset',
      target: targetError(target),
      reason:
        text.length < 3
          ? 'Write the reason (at least 3 characters)'
          : text.length > 255
            ? 'Keep it under 255 characters'
            : undefined,
    }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return
    try {
      await onSubmit({
        ...targetInput(target),
        asset_ids: assets.map((asset) => asset.id),
        reason: text,
      })
    } catch (caught) {
      const apiError = toApiError(caught)
      setErrors({ root: apiError.fieldErrors[0]?.message ?? apiError.message })
    }
  }

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      <FormError message={errors.root} />
      <FormField id='transfer-assets' label='Assets' required error={errors.assets}>
        <AssetMultiPicker
          id='transfer-assets'
          value={assets}
          onChange={setAssets}
          statuses={['allocated', 'in_store', 'in_maintenance']}
          invalid={Boolean(errors.assets)}
        />
      </FormField>
      <FormField id='transfer-target' label='Move to' required>
        <TargetFields
          idPrefix='transfer'
          value={target}
          onChange={setTarget}
          error={errors.target}
        />
      </FormField>
      <FormField id='transfer-reason' label='Reason' required error={errors.reason}>
        <Textarea
          id='transfer-reason'
          maxLength={255}
          value={reason}
          placeholder='Moved to the new computer lab'
          aria-invalid={Boolean(errors.reason)}
          onChange={(event) => setReason(event.target.value)}
        />
      </FormField>
    </form>
  )
}
