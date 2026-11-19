import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { money } from '../labels'
import { StockItemPicker } from './pickers'
import { emptyLine, isDecimal, type LineDraft, type LineMessages } from './stock-form'

export function FormAlert({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p
      role='alert'
      className='rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive'
    >
      {message}
    </p>
  )
}

export function StockLinesEditor({
  idPrefix,
  value,
  onChange,
  storeId,
  withRate = false,
  errors = [],
  listError,
}: {
  idPrefix: string
  value: LineDraft[]
  onChange: (value: LineDraft[]) => void
  storeId?: number
  withRate?: boolean
  errors?: LineMessages[]
  listError?: string
}) {
  const update = (index: number, patch: Partial<LineDraft>) =>
    onChange(value.map((line, at) => (at === index ? { ...line, ...patch } : line)))
  const total = value.reduce(
    (sum, line) =>
      isDecimal(line.quantity) && isDecimal(line.rate)
        ? sum + Number(line.quantity) * Number(line.rate)
        : sum,
    0
  )

  return (
    <fieldset className='grid gap-2'>
      <legend className='mb-1 text-xs font-semibold'>
        Items<span className='ml-0.5 text-destructive'>*</span>
      </legend>
      <ul className='grid gap-2'>
        {value.map((line, index) => {
          const error = errors[index] ?? {}
          const amount =
            withRate && isDecimal(line.quantity) && isDecimal(line.rate)
              ? Number(line.quantity) * Number(line.rate)
              : null
          return (
            <li
              key={index}
              className={cn(
                'grid gap-2 rounded-lg border p-2 sm:items-start',
                withRate
                  ? 'sm:grid-cols-[minmax(0,1fr)_6.5rem_6.5rem_auto]'
                  : 'sm:grid-cols-[minmax(0,1fr)_7rem_auto]'
              )}
            >
              <div className='grid gap-1'>
                <Label htmlFor={`${idPrefix}-item-${index}`} className='sm:sr-only'>
                  Item
                </Label>
                <StockItemPicker
                  id={`${idPrefix}-item-${index}`}
                  label='Item'
                  value={line.item_id || undefined}
                  storeId={storeId}
                  initial={line.item_id ? { value: line.item_id, label: line.label } : null}
                  invalid={Boolean(error.item_id)}
                  onChange={(item_id, option) =>
                    update(index, { item_id: item_id ?? '', label: option?.label ?? '' })
                  }
                />
                {error.item_id && (
                  <p role='alert' className='text-xs font-medium text-destructive'>
                    {error.item_id}
                  </p>
                )}
              </div>
              <div className='grid gap-1'>
                <Label htmlFor={`${idPrefix}-qty-${index}`} className='sm:sr-only'>
                  Quantity
                </Label>
                <Input
                  id={`${idPrefix}-qty-${index}`}
                  inputMode='decimal'
                  placeholder='Qty'
                  value={line.quantity}
                  aria-invalid={Boolean(error.quantity)}
                  className='tabular'
                  onChange={(event) => update(index, { quantity: event.target.value })}
                />
                {error.quantity && (
                  <p role='alert' className='text-xs font-medium text-destructive'>
                    {error.quantity}
                  </p>
                )}
              </div>
              {withRate && (
                <div className='grid gap-1'>
                  <Label htmlFor={`${idPrefix}-rate-${index}`} className='sm:sr-only'>
                    Rate
                  </Label>
                  <Input
                    id={`${idPrefix}-rate-${index}`}
                    inputMode='decimal'
                    placeholder='Rate ₹'
                    value={line.rate}
                    aria-invalid={Boolean(error.rate)}
                    className='tabular'
                    onChange={(event) => update(index, { rate: event.target.value })}
                  />
                  {error.rate ? (
                    <p role='alert' className='text-xs font-medium text-destructive'>
                      {error.rate}
                    </p>
                  ) : (
                    amount !== null && (
                      <span className='tabular text-[11px] text-muted-foreground'>
                        {money(amount)}
                      </span>
                    )
                  )}
                </div>
              )}
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                aria-label='Remove item'
                className='justify-self-end text-destructive hover:bg-destructive/10'
                disabled={value.length === 1}
                onClick={() => onChange(value.filter((_, at) => at !== index))}
              >
                <Trash2 />
              </Button>
            </li>
          )
        })}
      </ul>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={value.length >= 50}
          onClick={() => onChange([...value, emptyLine()])}
        >
          <Plus />
          Add item
        </Button>
        {withRate && (
          <span className='text-sm'>
            Total <span className='tabular font-extrabold'>{money(total)}</span>
          </span>
        )}
      </div>
      {listError && (
        <p role='alert' className='text-xs font-medium text-destructive'>
          {listError}
        </p>
      )}
    </fieldset>
  )
}
