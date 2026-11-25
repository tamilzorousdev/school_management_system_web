import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { ComboboxOption } from '@/components/common/combobox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { LaundryRow } from './laundry-helpers'
import { ResidentPicker } from './pickers'

const clampCount = (value: string) => {
  const parsed = Math.round(Number(value))
  if (!Number.isFinite(parsed)) return 1
  return Math.min(100, Math.max(1, parsed))
}

export function LaundryItemsEditor({
  id,
  hostelId,
  rows,
  onChange,
  invalid,
}: {
  id: string
  hostelId?: number
  rows: LaundryRow[]
  onChange: (rows: LaundryRow[]) => void
  invalid?: boolean
}) {
  const [picked, setPicked] = useState<ComboboxOption | null>(null)
  const [count, setCount] = useState('5')
  const [note, setNote] = useState<string | undefined>()

  const add = () => {
    if (!picked) {
      setNote('Choose a resident first')
      return
    }
    if (rows.some((row) => row.admission_id === picked.value)) {
      setNote(`${picked.label} is already in this batch`)
      return
    }
    onChange([
      ...rows,
      {
        admission_id: picked.value,
        name: picked.label,
        hint: picked.hint,
        items_given: clampCount(count),
      },
    ])
    setPicked(null)
    setNote(undefined)
  }

  const total = rows.reduce((sum, row) => sum + row.items_given, 0)

  return (
    <div className='grid gap-3'>
      <div className='grid gap-2 rounded-lg border bg-muted/30 p-3 sm:grid-cols-[minmax(0,1fr)_6rem_auto] sm:items-end'>
        <div className='grid gap-1'>
          <label htmlFor={id} className='text-xs font-semibold'>
            Resident
          </label>
          <ResidentPicker
            id={id}
            label='Resident'
            hostelId={hostelId}
            value={picked?.value}
            invalid={invalid && rows.length === 0}
            onChange={(_value, option) => {
              setPicked(option ?? null)
              setNote(undefined)
            }}
          />
        </div>
        <div className='grid gap-1'>
          <label htmlFor={`${id}-count`} className='text-xs font-semibold'>
            Clothes
          </label>
          <Input
            id={`${id}-count`}
            type='number'
            inputMode='numeric'
            min={1}
            max={100}
            value={count}
            onChange={(event) => setCount(event.target.value)}
          />
        </div>
        <Button type='button' variant='outline' onClick={add}>
          <Plus />
          Add
        </Button>
        {note && (
          <p role='alert' className='text-xs font-medium text-destructive sm:col-span-3'>
            {note}
          </p>
        )}
      </div>

      {rows.length > 0 && (
        <div className='overflow-hidden rounded-lg border'>
          <ul className='divide-y'>
            {rows.map((row, index) => (
              <li key={row.admission_id} className='flex items-center gap-3 px-3 py-2'>
                <div className='grid min-w-0 flex-1 gap-0.5'>
                  <span className='truncate text-sm font-semibold'>{row.name}</span>
                  {row.hint && (
                    <span className='truncate text-xs text-muted-foreground'>{row.hint}</span>
                  )}
                </div>
                <Input
                  type='number'
                  inputMode='numeric'
                  aria-label={`Clothes from ${row.name}`}
                  min={1}
                  max={100}
                  className='w-20'
                  value={row.items_given}
                  onChange={(event) =>
                    onChange(
                      rows.map((item, at) =>
                        at === index
                          ? { ...item, items_given: clampCount(event.target.value) }
                          : item
                      )
                    )
                  }
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-sm'
                  aria-label={`Remove ${row.name}`}
                  onClick={() => onChange(rows.filter((_item, at) => at !== index))}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
          <div className='flex justify-between border-t bg-muted/40 px-3 py-2 text-xs font-semibold'>
            <span>
              {rows.length} {rows.length === 1 ? 'resident' : 'residents'}
            </span>
            <span className='tabular'>{total} clothes</span>
          </div>
        </div>
      )}
    </div>
  )
}
