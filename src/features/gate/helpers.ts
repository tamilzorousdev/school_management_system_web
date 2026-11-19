import { useState } from 'react'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'

export async function runAction(action: () => Promise<unknown>, successText: string) {
  try {
    await action()
    alerts.success(successText)
    return true
  } catch (error) {
    alerts.error(toApiError(error).message)
    return false
  }
}

export interface DetailTarget {
  kind: 'pass' | 'visit'
  id: number
}

export function useDetail() {
  const [target, setTarget] = useState<DetailTarget | null>(null)
  const [open, setOpen] = useState(false)
  const show = (next: DetailTarget) => {
    setTarget(next)
    setOpen(true)
  }
  return { target, open, setOpen, show }
}
