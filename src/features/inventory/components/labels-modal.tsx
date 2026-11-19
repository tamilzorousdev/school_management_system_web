import { useState, type FormEvent } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Input } from '@/components/ui/input'
import { inventoryFiles } from '../api'
import { idOrUndefined, openInventoryFile } from '../labels'
import { FormError } from './asset-shared'
import { CategoryPicker, LocationPicker } from './pickers'

const FORM_ID = 'asset-labels-form'

type Scope = 'selected' | 'filter'

export function PrintLabelsModal(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  assetIds?: number[]
}) {
  const { open, onOpenChange, assetIds } = props
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Print asset labels'
      description='A4 sheet, 3 × 8 labels with a Code 128 barcode. Stick each label on the asset.'
      formId={FORM_ID}
      submitText='Open labels'
    >
      {open && <LabelsForm assetIds={assetIds ?? []} onDone={() => onOpenChange(false)} />}
    </AppModal>
  )
}

function LabelsForm({ assetIds, onDone }: { assetIds: number[]; onDone: () => void }) {
  const [scope, setScope] = useState<Scope>(assetIds.length ? 'selected' : 'filter')
  const [locationId, setLocationId] = useState<string>()
  const [categoryId, setCategoryId] = useState<string>()
  const [addedFrom, setAddedFrom] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (scope === 'selected') {
      openInventoryFile(inventoryFiles.labels, inventoryFiles.labelsParams({ asset_ids: assetIds }))
      onDone()
      return
    }
    if (!locationId && !categoryId && !addedFrom) {
      setError('Choose a location, a category or a date')
      return
    }
    openInventoryFile(
      inventoryFiles.labels,
      inventoryFiles.labelsParams({
        location_id: idOrUndefined(locationId),
        category_id: idOrUndefined(categoryId),
        added_from: addedFrom || undefined,
      })
    )
    onDone()
  }

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      <FormError message={error} />
      {assetIds.length > 0 && (
        <SegmentedControl
          label='Which assets'
          value={scope}
          onChange={setScope}
          options={[
            { value: 'selected', label: `${assetIds.length} selected` },
            { value: 'filter', label: 'By location, category or date' },
          ]}
          className='justify-self-start'
        />
      )}
      {scope === 'selected' ? (
        <p className='text-sm text-muted-foreground'>
          Labels for the {assetIds.length} {assetIds.length === 1 ? 'asset' : 'assets'} you
          selected.
        </p>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField id='labels-location' label='Location'>
            <LocationPicker
              id='labels-location'
              label='Location'
              value={locationId}
              onChange={(value) => setLocationId(value)}
              placeholder='Any location'
            />
          </FormField>
          <FormField id='labels-category' label='Category'>
            <CategoryPicker
              id='labels-category'
              label='Category'
              kind='asset'
              value={categoryId}
              onChange={(value) => setCategoryId(value)}
              placeholder='Any category'
            />
          </FormField>
          <FormField id='labels-from' label='Registered on or after' className='sm:col-span-2'>
            <Input
              id='labels-from'
              type='date'
              value={addedFrom}
              onChange={(event) => setAddedFrom(event.target.value)}
            />
          </FormField>
        </div>
      )}
    </form>
  )
}
