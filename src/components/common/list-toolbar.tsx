import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Kbd } from '@/components/shortcuts/kbd'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDebouncedValue } from '@/hooks/use-debounce'
import { Combobox } from './combobox'

interface SearchBoxProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  label: string
  compact?: boolean
  showShortcut?: boolean
}

export function SearchBox({
  value,
  onChange,
  placeholder,
  label,
  compact = false,
  showShortcut = true,
}: SearchBoxProps) {
  const ref = useRef<HTMLInputElement>(null)
  const [text, setText] = useState(value)
  const [syncedValue, setSyncedValue] = useState(value)
  const debounced = useDebouncedValue(text.trim(), 350)
  const latest = useRef({ value, onChange })

  if (value !== syncedValue) {
    setSyncedValue(value)
    if (text.trim() !== value) setText(value)
  }

  useEffect(() => {
    latest.current = { value, onChange }
  })

  useEffect(() => {
    if (debounced !== latest.current.value) latest.current.onChange(debounced)
  }, [debounced])

  useShortcut('app.search', () => ref.current?.focus(), { enabled: showShortcut })

  return (
    <div className={compact ? 'relative w-full sm:w-80' : 'relative w-full sm:max-w-xs'}>
      <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground stroke-[1.75]' />
      <Input
        ref={ref}
        type='search'
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            if (text) setText('')
            else event.currentTarget.blur()
          }
        }}
        placeholder={placeholder}
        aria-label={label}
        className={`pr-10 pl-9 [&::-webkit-search-cancel-button]:hidden${compact ? 'h-8' : ''}`}
      />
      {text ? (
        <button
          type='button'
          onClick={() => setText('')}
          aria-label='Clear search'
          className='absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground'
        >
          <X className='size-3.5' />
        </button>
      ) : showShortcut ? (
        <Kbd id='app.search' className='absolute top-1/2 right-2.5 -translate-y-1/2' />
      ) : null}
    </div>
  )
}

interface FilterOption {
  value: string
  label: string
  hint?: string
}

interface FilterSelectProps {
  id: string
  label: string
  value?: string
  options: FilterOption[]
  allLabel: string
  onChange: (value: string | undefined) => void
  className?: string
}

export function FilterSelect({
  id,
  label,
  value,
  options,
  allLabel,
  onChange,
  className,
}: FilterSelectProps) {
  return (
    <Combobox
      id={id}
      label={label}
      value={value}
      options={options}
      allLabel={allLabel}
      placeholder={allLabel}
      searchPlaceholder={`Search ${label.replace(/^Filter by /i, '')}`}
      onChange={onChange}
      className={className}
    />
  )
}

export function ListToolbar({
  children,
  summary,
  onClear,
}: {
  children: ReactNode
  summary?: ReactNode
  onClear?: () => void
}) {
  return (
    <div className='flex flex-wrap items-center gap-2 border-b px-4 py-3'>
      {children}
      {onClear && (
        <Button variant='ghost' size='sm' onClick={onClear}>
          <X />
          Clear filters
        </Button>
      )}
      {summary && <span className='tabular ml-auto text-xs text-muted-foreground'>{summary}</span>}
    </div>
  )
}
