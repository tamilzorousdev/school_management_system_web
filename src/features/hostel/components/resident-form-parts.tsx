import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p
      role='alert'
      className='rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive'
    >
      {message}
    </p>
  )
}

export function Section({
  title,
  action,
  children,
  className,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={cn('grid content-start gap-4 overflow-hidden p-4 sm:p-5', className)}>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h2 className='font-bold'>{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  )
}

export function Muted({ children }: { children: ReactNode }) {
  return (
    <p className='rounded-lg border border-dashed p-3 text-sm text-muted-foreground'>{children}</p>
  )
}

export function MoneyTile({
  label,
  value,
  hint,
  tone = 'neutral',
  action,
}: {
  label: string
  value: string
  hint?: ReactNode
  tone?: 'neutral' | 'warning' | 'success'
  action?: ReactNode
}) {
  return (
    <div
      className={cn(
        'grid gap-1 rounded-lg border p-3',
        tone === 'warning' && 'border-warning/40 bg-warning/5',
        tone === 'success' && 'border-success/40 bg-success/5'
      )}
    >
      <span className='text-xs font-semibold text-muted-foreground'>{label}</span>
      <span className='tabular text-xl font-extrabold tracking-tight'>{value}</span>
      {hint && <span className='text-xs text-muted-foreground'>{hint}</span>}
      {action && <div className='pt-1'>{action}</div>}
    </div>
  )
}
