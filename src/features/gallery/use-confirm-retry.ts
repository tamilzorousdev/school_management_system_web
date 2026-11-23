import { useState } from 'react'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { needsConfirmation } from './labels'

interface Pending {
  message: string
  run: () => Promise<void>
}

export function useConfirmRetry() {
  const [pending, setPending] = useState<Pending | null>(null)
  const [loading, setLoading] = useState(false)

  const attempt = async <T>(
    first: () => Promise<T>,
    confirmed: () => Promise<T>,
    onDone: (result: T) => void
  ): Promise<boolean> => {
    try {
      onDone(await first())
      return true
    } catch (error) {
      if (!needsConfirmation(error)) throw error
      setPending({
        message: toApiError(error).message,
        run: async () => onDone(await confirmed()),
      })
      return false
    }
  }

  const confirm = async () => {
    if (!pending) return
    setLoading(true)
    try {
      await pending.run()
      setPending(null)
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setLoading(false)
    }
  }

  return {
    attempt,
    dialog: {
      open: Boolean(pending),
      onOpenChange: (open: boolean) => {
        if (!open) setPending(null)
      },
      description: pending?.message ?? '',
      loading,
      onConfirm: () => void confirm(),
    },
  }
}
