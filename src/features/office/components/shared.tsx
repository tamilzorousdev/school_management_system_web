import type { ReactNode } from 'react'
import { ChevronRight, Info, X, type LucideIcon } from 'lucide-react'
import { Combobox, type ComboboxOption } from '@/components/common/combobox'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface Crumb {
  label: string
  onClick?: () => void
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label='Breadcrumb' className='min-w-0'>
      <ol className='flex flex-wrap items-center gap-1 text-[13px]'>
        {items.map((item, index) => {
          const last = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className='flex min-w-0 items-center gap-1'>
              {item.onClick && !last ? (
                <button
                  type='button'
                  onClick={item.onClick}
                  className='truncate rounded font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40'
                >
                  {item.label}
                </button>
              ) : (
                <span
                  aria-current={last ? 'page' : undefined}
                  className={cn(
                    'truncate',
                    last ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight className='size-3 shrink-0 text-slate-400' />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export function WingBanner({ wings }: { wings: string[] }) {
  return (
    <div
      role='status'
      className='flex items-start gap-2 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-[12.5px] text-info'
    >
      <Info className='mt-0.5 size-4 shrink-0' />
      <span>
        You see: <strong>{wings.join(', ')}</strong>
      </span>
    </div>
  )
}

export function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  tone?: 'danger' | 'warning' | 'success'
}) {
  return (
    <div className='flex min-w-0 items-center gap-2'>
      <Icon
        className={cn(
          'size-3.5 shrink-0 text-slate-400',
          tone === 'danger' && 'text-destructive',
          tone === 'warning' && 'text-warning',
          tone === 'success' && 'text-success'
        )}
      />
      <div className='grid min-w-0'>
        <span className='truncate text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider'>
          {label}
        </span>
        <span
          className={cn(
            'tabular truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100',
            tone === 'danger' && 'text-destructive',
            tone === 'warning' && 'text-amber-600 dark:text-amber-400',
            tone === 'success' && 'text-success'
          )}
        >
          {value}
        </span>
      </div>
    </div>
  )
}

export function ClickCard({
  onClick,
  label,
  children,
}: {
  onClick: () => void
  label: string
  children: ReactNode
}) {
  return (
    <button
      type='button'
      aria-label={label}
      onClick={onClick}
      className='grid min-w-0 content-start gap-3 rounded-lg border border-[#DFE4E1] bg-white p-3.5 text-left text-card-foreground shadow-xs transition-[box-shadow,border-color] outline-none hover:border-primary/40 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/40 dark:bg-card dark:border-border'
    >
      {children}
    </button>
  )
}

export function CardGrid({ children }: { children: ReactNode }) {
  return <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>{children}</div>
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <CardGrid>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className='h-44 rounded-xl' />
      ))}
    </CardGrid>
  )
}

export function Chips({ items }: { items: { key: string; label: string; tone: BadgeTone }[] }) {
  if (!items.length) return null
  return (
    <span className='flex flex-wrap gap-1'>
      {items.map((item) => (
        <Badge key={item.key} tone={item.tone}>
          {item.label}
        </Badge>
      ))}
    </span>
  )
}

export function MultiPick({
  id,
  label,
  options,
  value,
  onChange,
  placeholder,
  invalid,
  disabled,
}: {
  id: string
  label: string
  options: ComboboxOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder: string
  invalid?: boolean
  disabled?: boolean
}) {
  const remaining = options.filter((option) => !value.includes(option.value))
  const chosen = value
    .map((item) => options.find((option) => option.value === item))
    .filter((option): option is ComboboxOption => Boolean(option))
  return (
    <div className='grid gap-2'>
      {!disabled && (
        <Combobox
          id={id}
          label={label}
          value={undefined}
          options={remaining}
          placeholder={placeholder}
          highlightSelected={false}
          emptyText='Everything is picked'
          invalid={invalid}
          className='sm:w-full'
          onChange={(next) => next && onChange([...value, next])}
        />
      )}
      {chosen.length > 0 && (
        <div className='flex flex-wrap gap-1.5'>
          {chosen.map((option) => (
            <span
              key={option.value}
              className='inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-xs font-semibold'
            >
              {option.label}
              {!disabled && (
                <button
                  type='button'
                  aria-label={`Remove ${option.label}`}
                  onClick={() => onChange(value.filter((item) => item !== option.value))}
                  className='rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-foreground'
                >
                  <X className='size-3' />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
