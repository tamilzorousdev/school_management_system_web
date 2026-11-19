import { useState } from 'react'
import { X } from 'lucide-react'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Input } from '@/components/ui/input'
import type { CopyCondition, CopySource } from '../api'
import type { CopiesValues } from '../form-utils'
import { COPY_CONDITION, COPY_SOURCE, optionsOf } from '../labels'
import { ScanInput } from './scan-input'

type CopiesErrors = Partial<Record<keyof CopiesValues, { message?: string }>>

export function CopiesFields({
  value,
  onChange,
  errors,
  allowNone,
}: {
  value: CopiesValues
  onChange: (value: CopiesValues) => void
  errors?: CopiesErrors
  allowNone?: boolean
}) {
  const [scanError, setScanError] = useState<string | null>(null)
  const set = <K extends keyof CopiesValues>(key: K, next: CopiesValues[K]) =>
    onChange({ ...value, [key]: next })

  const addBarcode = (code: string) => {
    if (code.length < 3 || code.length > 60) {
      setScanError('A barcode is 3 to 60 characters')
      return
    }
    if (value.barcodes.includes(code)) {
      setScanError(`${code} is already in the list`)
      return
    }
    setScanError(null)
    set('barcodes', [...value.barcodes, code])
  }

  return (
    <div className='grid gap-4 rounded-lg border bg-muted/20 p-3 sm:grid-cols-2'>
      <div className='flex flex-wrap items-center justify-between gap-2 sm:col-span-2'>
        <span className='text-sm font-bold'>Copies</span>
        <SegmentedControl
          label='How to add copies'
          value={value.mode}
          onChange={(mode) => set('mode', mode)}
          options={[
            { value: 'count', label: 'New barcodes' },
            { value: 'scan', label: 'Scan existing barcodes' },
          ]}
        />
      </div>
      {value.mode === 'count' ? (
        <FormField
          id='copies-count'
          label='Number of copies'
          error={errors?.count?.message}
          hint={
            allowNone
              ? 'Each copy gets a new accession number and barcode. 0 adds the title only.'
              : 'Each copy gets a new accession number and barcode.'
          }
          className='sm:col-span-2'
        >
          <Input
            id='copies-count'
            inputMode='numeric'
            value={value.count}
            onChange={(event) => set('count', event.target.value)}
            aria-invalid={Boolean(errors?.count)}
            className='sm:w-40'
          />
        </FormField>
      ) : (
        <div className='grid gap-2 sm:col-span-2'>
          <ScanInput
            id='copies-barcode'
            label='Scan a barcode already on the book'
            onScan={addBarcode}
            autoFocus
            hint='Scan or type one barcode, then Enter. Each one is a copy.'
          />
          {(scanError || errors?.barcodes?.message) && (
            <p role='alert' className='text-xs font-medium text-destructive'>
              {scanError ?? errors?.barcodes?.message}
            </p>
          )}
          {value.barcodes.length > 0 && (
            <ul className='flex flex-wrap gap-1.5'>
              {value.barcodes.map((code) => (
                <li
                  key={code}
                  className='inline-flex items-center gap-1 rounded-md border bg-card py-0.5 pr-1 pl-2 font-mono text-xs'
                >
                  {code}
                  <button
                    type='button'
                    aria-label={`Remove ${code}`}
                    onClick={() =>
                      set(
                        'barcodes',
                        value.barcodes.filter((item) => item !== code)
                      )
                    }
                    className='grid size-5 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground'
                  >
                    <X className='size-3' />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <span className='text-xs text-muted-foreground'>
            {value.barcodes.length} {value.barcodes.length === 1 ? 'copy' : 'copies'} scanned
          </span>
        </div>
      )}
      <FormField id='copies-condition' label='Condition'>
        <Combobox
          id='copies-condition'
          label='Condition'
          placeholder='Choose condition'
          value={value.condition}
          options={optionsOf(COPY_CONDITION)}
          onChange={(next) => set('condition', (next ?? 'new') as CopyCondition)}
          className='sm:w-full'
          highlightSelected={false}
        />
      </FormField>
      <FormField id='copies-source' label='Source'>
        <Combobox
          id='copies-source'
          label='Source'
          placeholder='Choose source'
          value={value.source}
          options={optionsOf(COPY_SOURCE)}
          onChange={(next) => set('source', (next ?? 'purchase') as CopySource)}
          className='sm:w-full'
          highlightSelected={false}
        />
      </FormField>
      <FormField id='copies-vendor' label='Vendor' error={errors?.vendor?.message}>
        <Input
          id='copies-vendor'
          value={value.vendor}
          placeholder='Bookshop or donor'
          onChange={(event) => set('vendor', event.target.value)}
        />
      </FormField>
      <FormField id='copies-bill' label='Bill number' error={errors?.bill_no?.message}>
        <Input
          id='copies-bill'
          value={value.bill_no}
          onChange={(event) => set('bill_no', event.target.value)}
        />
      </FormField>
      <FormField id='copies-acquired' label='Acquired on' error={errors?.acquired_on?.message}>
        <Input
          id='copies-acquired'
          type='date'
          value={value.acquired_on}
          onChange={(event) => set('acquired_on', event.target.value)}
        />
      </FormField>
      <FormField
        id='copies-price'
        label='Price per copy (₹)'
        error={errors?.price?.message}
        hint='Leave empty to use the book price'
      >
        <Input
          id='copies-price'
          inputMode='decimal'
          value={value.price}
          onChange={(event) => set('price', event.target.value)}
        />
      </FormField>
    </div>
  )
}
