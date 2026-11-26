import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants, type ButtonProps } from '@/components/ui/button'

export interface IconButtonProps
  extends Omit<ButtonProps, 'children' | 'leadingIcon' | 'trailingIcon' | 'loadingText' | 'size'> {
  icon: React.ReactNode
  'aria-label': string
  tooltip?: string
  size?: 'sm' | 'md' | 'lg' | 'icon-sm' | 'icon' | 'icon-md' | 'icon-lg'
}

const sizeMap = {
  sm: 'icon-sm',
  md: 'icon-md',
  lg: 'icon-lg',
  'icon-sm': 'icon-sm',
  icon: 'icon-md',
  'icon-md': 'icon-md',
  'icon-lg': 'icon-lg',
} as const

export function IconButton({
  icon,
  'aria-label': ariaLabel,
  tooltip,
  variant = 'ghost',
  size = 'md',
  className,
  loading = false,
  disabled,
  title,
  type = 'button',
  ...props
}: IconButtonProps) {
  const mappedSize = sizeMap[size] || 'icon-md'

  return (
    <button
      type={type}
      aria-label={ariaLabel}
      title={title || tooltip || ariaLabel}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size: mappedSize, className }))}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" /> : icon}
    </button>
  )
}
