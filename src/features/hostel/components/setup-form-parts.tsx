import type { ReactNode } from 'react'
import { Switch } from '@/components/ui/switch'

export function FormAlert({ message }: { message?: string }) {
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

export function SwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  id: string
  label: string
  description?: ReactNode
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className='flex items-center justify-between gap-4 rounded-lg border bg-muted/40 px-4 py-3'>
      <div className='grid min-w-0 gap-0.5'>
        <label htmlFor={id} className='text-sm font-semibold'>
          {label}
        </label>
        {description && <p className='text-xs text-muted-foreground'>{description}</p>}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={label}
      />
    </div>
  )
}
