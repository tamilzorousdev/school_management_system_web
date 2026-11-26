import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface ComboboxOption {
  value: string
  label: string
  hint?: string
}

interface ComboboxProps {
  id: string
  label: string
  value?: string
  options: ComboboxOption[]
  onChange: (value: string | undefined) => void
  placeholder: string
  allLabel?: string
  searchPlaceholder?: string
  className?: string
  invalid?: boolean
  highlightSelected?: boolean
  emptyText?: string
  onSearch?: (query: string) => void
  size?: 'default' | 'sm'
}

const VISIBLE_ROWS = 5

export function Combobox({
  id,
  label,
  value,
  options,
  onChange,
  placeholder,
  allLabel,
  searchPlaceholder = 'Search',
  className,
  invalid,
  highlightSelected = true,
  emptyText = 'No options yet',
  onSearch,
  size = 'default',
}: ComboboxProps) {
  const listId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const items = useMemo(() => {
    const all: ComboboxOption[] = allLabel ? [{ value: '', label: allLabel }, ...options] : options
    const term = query.trim().toLowerCase()
    return term && !onSearch
      ? all.filter((option) => option.label.toLowerCase().includes(term))
      : all
  }, [allLabel, options, query, onSearch])

  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    if (!open) return
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  const changeOpen = (next: boolean) => {
    setOpen(next)
    setQuery('')
    onSearch?.('')
    if (next) {
      const index = (allLabel ? [{ value: '' }, ...options] : options).findIndex(
        (option) => option.value === (value ?? '')
      )
      setActive(Math.max(0, index))
    }
  }

  const choose = (option: ComboboxOption) => {
    onChange(option.value || undefined)
    changeOpen(false)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((index) => Math.min(items.length - 1, index + 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => Math.max(0, index - 1))
    } else if (event.key === 'Home') {
      event.preventDefault()
      setActive(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setActive(items.length - 1)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (items[active]) choose(items[active])
    }
  }

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type='button'
          role='combobox'
          aria-label={label}
          aria-expanded={open}
          aria-controls={listId}
          aria-invalid={invalid || undefined}
          className={cn(
            'flex w-full min-w-0 items-center justify-between gap-2 rounded-md border border-[#D0D5DD] bg-white px-3 text-left text-slate-900 shadow-xs transition-[color,box-shadow,border-color] outline-none sm:w-48 dark:bg-card dark:border-border dark:text-foreground',
            size === 'sm' ? 'h-8 text-[13px]' : 'h-9 text-sm',
            'focus-visible:border-[#127D48] focus-visible:ring-2 focus-visible:ring-[#127D48]/20',
            open && 'border-[#127D48] ring-2 ring-[#127D48]/20 dark:border-[#127D48]',
            invalid && 'border-[#D92D20] focus-visible:border-[#D92D20] focus-visible:ring-[#D92D20]/20',
            highlightSelected && selected && 'border-primary/50 text-primary',
            className
          )}
        >
          <span className={cn('truncate', !selected && !allLabel && 'text-muted-foreground')}>
            {selected?.label ?? allLabel ?? placeholder}
          </span>
          <ChevronDown
            className={cn(
              size === 'sm' ? 'size-3.5' : 'size-4',
              'shrink-0 text-slate-500 transition-transform duration-200 dark:text-slate-400',
              open && 'rotate-180 text-slate-900 dark:text-slate-100'
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className='w-[max(var(--radix-popover-trigger-width),14rem)] p-0'
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          ;(event.currentTarget as HTMLElement).querySelector('input')?.focus()
        }}
      >
        <div className='flex items-center gap-2 border-b px-3'>
          <Search className='size-4 shrink-0 text-muted-foreground' />
          <input
            type='text'
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              onSearch?.(event.target.value)
              setActive(0)
            }}
            onKeyDown={onKeyDown}
            placeholder={searchPlaceholder}
            aria-label={`Search ${label.toLowerCase()}`}
            aria-controls={listId}
            aria-activedescendant={items[active] ? `${listId}-${active}` : undefined}
            className='h-10 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground'
          />
        </div>
        <div
          ref={listRef}
          id={listId}
          role='listbox'
          aria-label={label}
          className='overflow-y-auto overscroll-contain p-1'
          style={{ maxHeight: `calc(${VISIBLE_ROWS} * 2.25rem + 0.5rem)` }}
        >
          {items.length === 0 ? (
            <p className='px-3 py-6 text-center text-sm text-muted-foreground'>
              {options.length === 0 ? emptyText : 'No match'}
            </p>
          ) : (
            items.map((option, index) => {
              const isSelected = (value ?? '') === option.value
              return (
                <div
                  key={option.value || '__all'}
                  id={`${listId}-${index}`}
                  data-index={index}
                  role='option'
                  aria-selected={isSelected}
                  onMouseMove={() => setActive(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(option)}
                  className={cn(
                    'flex h-9 cursor-pointer items-center gap-2 rounded-md px-2.5 text-sm select-none',
                    index === active && 'bg-muted',
                    isSelected && 'font-semibold'
                  )}
                >
                  <Check
                    className={cn('size-4 shrink-0 text-primary', !isSelected && 'invisible')}
                  />
                  <span className='truncate'>{option.label}</span>
                  {option.hint && (
                    <span className='tabular ml-auto shrink-0 text-xs text-muted-foreground'>
                      {option.hint}
                    </span>
                  )}
                </div>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
