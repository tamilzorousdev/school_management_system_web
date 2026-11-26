import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.ComponentProps<'div'> {
  elevation?: 1 | 2 | 4 | 'modal'
}

export function Card({ className, elevation, ...props }: CardProps) {
  return (
    <div
      data-slot='card'
      className={cn(
        'flex flex-col rounded-xl border bg-card text-card-foreground shadow-xs transition-[box-shadow,border-color]',
        (elevation === 4 || elevation === 'modal') &&
          'border-[#DFE4E1] shadow-[0_24px_48px_-12px_rgba(16,23,20,0.18)]',
        elevation === 2 && 'shadow-md',
        elevation === 1 && 'shadow-xs',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-header'
      className={cn('flex flex-wrap items-start justify-between gap-3 px-5 pt-5', className)}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return <h3 className={cn('text-sm font-bold tracking-tight', className)} {...props} />
}

export function CardDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return <p className={cn('text-xs text-muted-foreground', className)} {...props} />
}

export function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot='card-content' className={cn('p-5', className)} {...props} />
}

export function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-footer'
      className={cn('flex items-center gap-2 border-t px-5 py-3', className)}
      {...props}
    />
  )
}
