import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Combobox } from '@/components/common/combobox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Chips({ values, onRemove }: { values: { key: string; label: string }[]; onRemove?: (key: string) => void }) {
  if (!values.length) return null
  return (
    <div className='flex flex-wrap gap-1.5'>
      {values.map((value) => (
        <Badge key={value.key} tone='info' className='gap-1 pr-1'>
          {value.label}
          {onRemove && (
            <button
              type='button'
              className='rounded-sm p-0.5 hover:bg-info/20'
              aria-label={`Remove ${value.label}`}
              onClick={() => onRemove(value.key)}
            >
              <X className='size-3' />
            </button>
          )}
        </Badge>
      ))}
    </div>
  )
}

export function TextChips({
  id,
  values,
  onChange,
  placeholder,
}: {
  id: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder: string
}) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const value = draft.trim()
    if (!value || values.some((item) => item.toLowerCase() === value.toLowerCase())) return setDraft('')
    onChange([...values, value])
    setDraft('')
  }
  return (
    <div className='grid gap-2'>
      <div className='flex gap-2'>
        <Input
          id={id}
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              add()
            }
          }}
        />
        <Button type='button' variant='outline' onClick={add} aria-label={`Add ${placeholder}`}>
          <Plus />
        </Button>
      </div>
      <Chips
        values={values.map((value) => ({ key: value, label: value }))}
        onRemove={(key) => onChange(values.filter((value) => value !== key))}
      />
    </div>
  )
}

export function PickChips({
  id,
  label,
  options,
  values,
  onChange,
  onSearch,
}: {
  id: string
  label: string
  options: { value: string; label: string }[]
  values: { key: string; label: string }[]
  onChange: (values: { key: string; label: string }[]) => void
  onSearch?: (query: string) => void
}) {
  return (
    <div className='grid gap-2'>
      <Combobox
        id={id}
        label={label}
        placeholder={label}
        options={options.filter((option) => !values.some((value) => value.key === option.value))}
        onChange={(value) => {
          const option = options.find((item) => item.value === value)
          if (option) onChange([...values, { key: option.value, label: option.label }])
        }}
        highlightSelected={false}
        onSearch={onSearch}
        className='sm:w-full'
      />
      <Chips values={values} onRemove={(key) => onChange(values.filter((value) => value.key !== key))} />
    </div>
  )
}
