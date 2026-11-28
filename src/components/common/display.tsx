import * as React from 'react'
import { AlertTriangle, Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon: React.ComponentType<{ className?: string }>
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
  loading?: boolean
}

const toneStyles = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
  neutral: 'bg-muted text-muted-foreground',
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'primary',
  loading,
}: StatCardProps) {
  return (
    <Card className='gap-3 p-5'>
      <div className='flex items-center justify-between gap-3'>
        <span className='text-xs font-semibold text-muted-foreground'>{label}</span>
        <span className={cn('grid size-8 place-items-center rounded-lg', toneStyles[tone])}>
          <Icon className='size-4' />
        </span>
      </div>
      {loading ? (
        <Skeleton className='h-8 w-20' />
      ) : (
        <div className='tabular text-3xl font-extrabold tracking-tight'>{value}</div>
      )}
      {hint && <div className='text-xs text-muted-foreground'>{hint}</div>}
    </Card>
  )
}

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-6 py-12 text-center', className)}>
      <span className='grid size-12 place-items-center rounded-full bg-muted text-muted-foreground'>
        <Icon className='size-5' />
      </span>
      <div className='grid gap-1'>
        <p className='font-bold'>{title}</p>
        {description && <p className='max-w-sm text-sm text-muted-foreground'>{description}</p>}
      </div>
      {action}
    </div>
  )
}

interface ErrorStateProps {
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ message, onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-6 py-12 text-center', className)}>
      <span className='grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive'>
        <AlertTriangle className='size-5' />
      </span>
      <div className='grid gap-1'>
        <p className='font-bold'>Could not load this</p>
        <p className='max-w-sm text-sm text-muted-foreground'>{message}</p>
      </div>
      {onRetry && (
        <Button variant='outline' size='sm' onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = React.useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      alerts.error('Copy failed. Select the text and press Ctrl+C.')
    }
  }

  return (
    <Button variant='ghost' size='sm' onClick={copy} aria-label={label}>
      {copied ? <Check /> : <Copy />}
      {copied ? 'Copied' : label}
    </Button>
  )
}

interface DetailItem {
  label: string
  value: React.ReactNode
  mono?: boolean
}

export function DetailList({ items, className }: { items: DetailItem[]; className?: string }) {
  return (
    <dl className={cn('grid gap-x-6 gap-y-4 sm:grid-cols-2', className)}>
      {items.map((item) => (
        <div key={item.label} className='grid gap-0.5'>
          <dt className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
            {item.label}
          </dt>
          <dd
            className={cn(
              'text-sm font-semibold break-words',
              item.mono && 'font-mono text-[13px] break-all'
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
