import { useState, type FormEvent } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  inventoryApi,
  useInventoryMutation,
  type AssetStatus,
  type DisposalInput,
  type DisposalMethod,
} from '../api'
import { DISPOSAL_METHOD, options, toNumber } from '../labels'
import { FormError } from './asset-shared'
import { AssetPicker, type PickedAsset } from './pickers'

const FORM_ID = 'asset-disposal-form'
const DISPOSABLE: AssetStatus[] = ['in_store', 'lost', 'in_maintenance']
const METHOD_OPTIONS = options(DISPOSAL_METHOD)

export function DisposalModal(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset?: PickedAsset | null
}) {
  const { open, onOpenChange, asset } = props
  const create = useInventoryMutation((input: DisposalInput) => inventoryApi.createDisposal(input))
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Dispose of an asset'
      description='Sold, scrapped, donated or written off. Allocated assets must be returned first.'
      formId={FORM_ID}
      submitText='Create disposal'
      loading={create.isPending}
    >
      {open && (
        <DisposalForm
          asset={asset ?? null}
          onSubmit={async (input) => {
            const disposal = await create.mutateAsync(input)
            alerts.success(
              disposal.status === 'requested'
                ? `${disposal.disposal_no} sent for approval`
                : `${disposal.asset_tag} disposed`
            )
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function DisposalForm({
  asset,
  onSubmit,
}: {
  asset: PickedAsset | null
  onSubmit: (input: DisposalInput) => Promise<void>
}) {
  const [assetId, setAssetId] = useState<string | undefined>(asset ? String(asset.id) : undefined)
  const [method, setMethod] = useState<DisposalMethod | undefined>()
  const [reason, setReason] = useState('')
  const [value, setValue] = useState('')
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const text = reason.trim()
    const amount = toNumber(value)
    const next = {
      asset: assetId ? undefined : 'Choose the asset',
      method: method ? undefined : 'Choose how it leaves the school',
      reason: text.length < 3 ? 'Write the reason (at least 3 characters)' : undefined,
      value:
        value.trim() && (amount === null || amount < 0)
          ? 'Enter an amount of 0 or more'
          : undefined,
    }
    setErrors(next)
    if (Object.values(next).some(Boolean) || !assetId || !method) return
    try {
      await onSubmit({
        asset_id: Number(assetId),
        method,
        reason: text,
        value_realised: amount,
      })
    } catch (caught) {
      const apiError = toApiError(caught)
      if (apiError.code === 'ASSET_ALLOCATED' || apiError.code === 'ASSET_DISPOSED') {
        setErrors({ asset: apiError.message })
      } else {
        setErrors({ root: apiError.fieldErrors[0]?.message ?? apiError.message })
      }
    }
  }

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      <FormError message={errors.root} />
      <FormField id='disposal-asset' label='Asset' required error={errors.asset}>
        <div className='grid gap-2'>
          <AssetPicker
            id='disposal-asset'
            label='Asset'
            status={asset ? undefined : DISPOSABLE}
            value={assetId}
            initial={
              asset
                ? { value: String(asset.id), label: `${asset.asset_tag} · ${asset.name}` }
                : null
            }
            invalid={Boolean(errors.asset)}
            onChange={(next) => setAssetId(next)}
          />
        </div>
      </FormField>
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField id='disposal-method' label='Method' required error={errors.method}>
          <Combobox
            id='disposal-method'
            label='Method'
            value={method}
            options={METHOD_OPTIONS}
            placeholder='Choose a method'
            searchPlaceholder='Search method'
            highlightSelected={false}
            invalid={Boolean(errors.method)}
            className='sm:w-full'
            onChange={(next) => setMethod(next as DisposalMethod | undefined)}
          />
        </FormField>
        <FormField
          id='disposal-value'
          label='Value realised (₹)'
          hint='Sale or scrap amount'
          error={errors.value}
        >
          <Input
            id='disposal-value'
            inputMode='decimal'
            value={value}
            placeholder='0'
            className='tabular'
            aria-invalid={Boolean(errors.value)}
            onChange={(event) => setValue(event.target.value)}
          />
        </FormField>
      </div>
      <FormField id='disposal-reason' label='Reason' required error={errors.reason}>
        <Textarea
          id='disposal-reason'
          maxLength={255}
          value={reason}
          placeholder='Beyond repair'
          aria-invalid={Boolean(errors.reason)}
          onChange={(event) => setReason(event.target.value)}
        />
      </FormField>
    </form>
  )
}
