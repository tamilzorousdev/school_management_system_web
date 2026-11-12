import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PageTab<T extends string> {
  value: T
  label: string
  icon?: LucideIcon
  count?: number
}

export function PageTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  wrap = false,
}: {
  tabs: PageTab<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  wrap?: boolean
}) {
  return (
    <div
      className={wrap ? '-mx-4 px-4 sm:mx-0 sm:px-0' : '-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0'}
    >
      <div
        role='tablist'
        aria-label={label}
        className={wrap ? 'flex flex-wrap gap-1 border-b' : 'flex min-w-max gap-1 border-b'}
      >
        {tabs.map((tab) => {
          const active = tab.value === value
          return (
            <button
              key={tab.value}
              type='button'
              role='tab'
              aria-selected={active}
              onClick={() => onChange(tab.value)}
              className={cn(
                'relative flex h-10 items-center gap-2 rounded-t-md px-3 text-sm font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.icon && <tab.icon className={cn('size-4', active && 'text-primary')} />}
              {tab.label}
              {tab.count !== undefined && (
                <span className='tabular rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground'>
                  {tab.count}
                </span>
              )}
              {active && (
                <span className='absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary' />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
