import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 focus-visible:ring-primary/40 active:bg-[#0B4E2D]',
        primary:
          'bg-[#127D48] text-white shadow-xs hover:bg-[#0E6339] focus-visible:ring-[#127D48]/40 active:bg-[#0B4E2D]',
        secondary:
          'border border-[#C6CEC9] bg-white font-medium text-[#171B19] shadow-xs hover:bg-[#F9FAFB] active:bg-[#F2F4F7] dark:border-[#2f4339] dark:bg-card dark:text-foreground dark:hover:bg-muted',
        tertiary:
          'bg-[#EAF7F0] text-[#127D48] hover:bg-[#D5EFE1] active:bg-[#BEE5D0] dark:bg-[#14291f] dark:text-[#7fe0ad]',
        destructive:
          'bg-[#D92D20] text-white shadow-xs hover:bg-[#B42318] focus-visible:ring-[#D92D20]/40 active:bg-[#912018]',
        text: 'bg-transparent text-[#171B19] hover:bg-[#F2F4F7] active:bg-[#EAECF0] dark:text-foreground dark:hover:bg-muted',
        outline:
          'border border-[#C6CEC9] bg-white font-medium text-[#171B19] shadow-xs hover:bg-[#F9FAFB] active:bg-[#F2F4F7] dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-muted',
        ghost: 'text-foreground hover:bg-muted',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 gap-1.5 px-3 text-xs [&_svg]:size-3.5',
        default: 'h-9 px-4 [&_svg]:size-4',
        md: 'h-9 px-4 [&_svg]:size-4',
        lg: 'h-10 px-5 [&_svg]:size-4',
        'icon-sm': 'size-8 gap-0 p-0 [&_svg]:size-4',
        icon: 'size-9 gap-0 p-0 [&_svg]:size-4.5',
        'icon-md': 'size-9 gap-0 p-0 [&_svg]:size-4.5',
        'icon-lg': 'size-10 gap-0 p-0 [&_svg]:size-5',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export interface ButtonProps
  extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: React.ReactNode
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  loadingText,
  leadingIcon,
  trailingIcon,
  disabled,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  if (asChild) {
    return (
      <Slot className={cn(buttonVariants({ variant, size, className }))} {...props}>
        {children}
      </Slot>
    )
  }

  return (
    <button
      type={type}
      data-slot='button'
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className='animate-spin' />
          {loadingText ?? children}
        </>
      ) : (
        <>
          {leadingIcon}
          {children}
          {trailingIcon}
        </>
      )}
    </button>
  )
}
