import * as React from 'react'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CheckboxProps
  extends Omit<React.ComponentProps<'button'>, 'onChange'> {
  checked?: boolean
  indeterminate?: boolean
  onCheckedChange?: (checked: boolean) => void
  onChange?: () => void
}

/**
 * Standard Design System Checkbox component matching Figma design tokens.
 * Supports checked, unchecked, indeterminate, focus, and disabled states.
 */
export function Checkbox({
  checked = false,
  indeterminate = false,
  onCheckedChange,
  onChange,
  disabled,
  className,
  'aria-label': ariaLabel,
  ...props
}: CheckboxProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onChange?.()
    onCheckedChange?.(!checked)
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'inline-flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-all outline-none cursor-pointer',
        checked || indeterminate
          ? 'border-[#127D48] bg-[#127D48] text-white shadow-2xs'
          : 'border-[#D0D5DD] bg-white hover:border-[#127D48] hover:bg-[#EAF7F0]/30 dark:border-slate-700 dark:bg-slate-900',
        'focus-visible:ring-2 focus-visible:ring-[#127D48]/30',
        disabled && 'cursor-not-allowed opacity-40 hover:border-[#D0D5DD] hover:bg-white',
        className
      )}
      {...props}
    >
      {indeterminate ? (
        <Minus className="size-3 stroke-[3]" />
      ) : checked ? (
        <Check className="size-3 stroke-[2.5]" />
      ) : null}
    </button>
  )
}
