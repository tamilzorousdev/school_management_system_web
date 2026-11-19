import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BulkActionBarAction {
  label: string
  icon?: ReactNode
  onClick: () => void
  disabled?: boolean
}

export interface BulkActionBarProps {
  count: number
  label?: string
  onClear: () => void
  actions?: BulkActionBarAction[]
  primaryAction?: {
    label: string
    icon?: ReactNode
    onClick: () => void
    variant?: 'primary' | 'danger'
    disabled?: boolean
  }
}

export function BulkActionBar({
  count,
  label = 'selected',
  onClear,
  actions = [],
  primaryAction,
}: BulkActionBarProps) {
  if (count <= 0) return null

  return (
    <div
      role='region'
      aria-label='Bulk actions'
      className='fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex max-w-[95vw] items-center gap-1.5 sm:gap-2 rounded-xl bg-[#18181B] px-3.5 py-2 text-white shadow-2xl ring-1 ring-white/10 select-none table-typography animate-in fade-in slide-in-from-bottom-4 duration-200 dark:bg-slate-900 dark:ring-white/15'
    >
      {/* Count */}
      <div className='flex items-center gap-1.5 font-semibold text-[13px] text-white whitespace-nowrap pl-1 pr-1'>
        <span className='tabular-nums font-bold'>{count}</span>
        <span>{label}</span>
      </div>

      {/* Divider */}
      <div className='h-4 w-px bg-white/20 mx-1' />

      {/* Actions */}
      <div className='flex items-center gap-1 overflow-x-auto scrollbar-none'>
        {actions.map((action, idx) => (
          <button
            key={idx}
            type='button'
            disabled={action.disabled}
            onClick={action.onClick}
            className='flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-slate-200 transition-colors hover:bg-white/10 hover:text-white whitespace-nowrap disabled:pointer-events-none disabled:opacity-40'
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Primary Action Button */}
      {primaryAction && (
        <button
          type='button'
          disabled={primaryAction.disabled}
          onClick={primaryAction.onClick}
          className={cn(
            'ml-1 flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold text-white shadow-xs transition-colors whitespace-nowrap disabled:pointer-events-none disabled:opacity-40',
            primaryAction.variant === 'danger'
              ? 'bg-[#DC2626] hover:bg-[#B91C1C]'
              : 'bg-[#059669] hover:bg-[#047857]'
          )}
        >
          {primaryAction.icon}
          <span>{primaryAction.label}</span>
        </button>
      )}

      {/* Clear / Close Button */}
      <button
        type='button'
        onClick={onClear}
        aria-label='Clear selection'
        title='Clear selection'
        className='ml-0.5 flex size-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white'
      >
        <X className='size-4' />
      </button>
    </div>
  )
}
