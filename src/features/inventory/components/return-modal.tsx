import { useState, type FormEvent } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { inventoryApi, useInventoryMutation, type AssetCondition, type ReturnInput } from '../api'
import { ASSET_CONDITION_OPTIONS, blankToNull, idOrUndefined } from '../labels'
import { FormError, SwitchRow } from './asset-shared'
import { AssetMultiPicker, StorePicker, type PickedAsset } from './pickers'

const FORM_ID = 'asset-return-form'

export function ReturnModal(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  assets?: PickedAsset[]
}) {
  const { open, onOpenChange, assets } = props
  const giveBack = useInventoryMutation((input: ReturnInput) => inventoryApi.returnAssets(input))
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Take assets back'
      description='The assets go back into store with the condition you note. Damaged ones can go straight to maintenance.'
      formId={FORM_ID}
      submitText='Return to store'
      loading={giveBack.isPending}
      size='lg'
    >
      {open && (
        <ReturnForm
          initial={(assets ?? []).filter((asset) => asset.status === 'allocated')}
          onSubmit={async (input) => {
            const result = await giveBack.mutateAsync(input)
            alerts.success(`${result.length} ${result.length === 1 ? 'asset' : 'assets'} returned`)
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function ReturnForm({
  initial,
  onSubmit,
}: {
  initial: PickedAsset[]
  onSubmit: (input: ReturnInput) => Promise<void>
}) {
  const [assets, setAssets] = useState<PickedAsset[]>(initial)
  const [condition, setCondition] = useState<AssetCondition | undefined>()
  const [storeId, setStoreId] = useState<string>()
  const [maintenance, setMaintenance] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!assets.length) {
      setErrors({ assets: 'Choose at least one allocated asset' })
      return
    }
    setErrors({})
    try {
      await onSubmit({
        asset_ids: assets.map((asset) => asset.id),
        condition,
        store_id: idOrUndefined(storeId),
        send_to_maintenance: maintenance || undefined,
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
      <FormField id='return-assets' label='Allocated assets' required error={errors.assets}>
        <AssetMultiPicker
          id='return-assets'
          value={assets}
          onChange={setAssets}
          statuses={['allocated']}
          invalid={Boolean(errors.assets)}
        />
      </FormField>
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField id='return-condition' label='Condition now' hint='Leave as is if unchanged'>
          <Combobox
            id='return-condition'
            label='Condition'
            value={condition}
            options={ASSET_CONDITION_OPTIONS}
            placeholder='Unchanged'
            searchPlaceholder='Search condition'
            highlightSelected={false}
            className='sm:w-full'
            onChange={(value) => setCondition(value as AssetCondition | undefined)}
          />
        </FormField>
        <FormField id='return-store' label='Back to store'>
          <StorePicker
            id='return-store'
            label='Store'
            value={storeId}
            placeholder='Its usual store'
            onChange={(value) => setStoreId(value)}
          />
        </FormField>
      </div>
      <SwitchRow
        id='return-maintenance'
        label='Send to maintenance'
        description='Opens a breakdown ticket for each returned asset.'
        checked={maintenance}
        onChange={setMaintenance}
      />
      <FormField id='return-remarks' label='Remarks'>
        <Textarea
          id='return-remarks'
          maxLength={255}
          value={remarks}
          placeholder='Screen has a crack in the corner'
          onChange={(event) => setRemarks(event.target.value)}
        />
      </FormField>
    </form>
  )
}
