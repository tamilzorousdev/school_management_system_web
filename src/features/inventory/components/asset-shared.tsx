import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import type { AssetCondition, AssetStatus } from '../api'
import { ASSET_CONDITION, ASSET_STATUS } from '../labels'

export function FormError({ message }: { message?: string | null }) {
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

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  const entry = ASSET_STATUS[status]
  return (
    <Badge tone={entry.tone} dot>
      {entry.label}
    </Badge>
  )
}

export function ConditionBadge({ condition }: { condition: AssetCondition }) {
  const entry = ASSET_CONDITION[condition]
  return <Badge tone={entry.tone}>{entry.label}</Badge>
}

export function SwitchRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string
  label: string
  description?: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className='flex items-center justify-between gap-4 rounded-lg border bg-muted/40 px-4 py-3'>
      <div className='grid gap-0.5'>
        <label htmlFor={id} className='text-sm font-semibold'>
          {label}
        </label>
        {description && <p className='text-xs text-muted-foreground'>{description}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

export function SelectBox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <input
      type='checkbox'
      aria-label={label}
      className='size-4 cursor-pointer accent-primary'
      checked={checked}
      onChange={onChange}
      onClick={(event) => event.stopPropagation()}
    />
  )
}
