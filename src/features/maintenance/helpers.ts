import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { alerts } from '@/lib/alerts'
import { toApiError, type ApiError } from '@/lib/api/errors'
import { openFile } from '@/lib/files'

export function openStoredFile(file: { id: number } | null | undefined) {
  if (!file) return
  void openFile(`/files/${file.id}/content`).catch((error: unknown) =>
    alerts.error(toApiError(error).message)
  )
}

export function applyFieldErrors<T extends FieldValues>(
  apiError: ApiError,
  fields: Path<T>[],
  setError: UseFormSetError<T>,
  extra: Record<string, (message: string) => void> = {}
) {
  let mapped = false
  apiError.fieldErrors.forEach((fieldError) => {
    const handler = extra[fieldError.field]
    if (handler) {
      handler(fieldError.message)
      mapped = true
      return
    }
    const field = fields.find((name) => name === fieldError.field)
    if (field) {
      setError(field, { message: fieldError.message }, { shouldFocus: !mapped })
      mapped = true
    }
  })
  if (apiError.code === 'VEHICLE_NOT_FOUND' && fields.includes('vehicle_id' as Path<T>)) {
    setError('vehicle_id' as Path<T>, { message: apiError.message })
    return true
  }
  return mapped
}

export const isPhone = () => !window.matchMedia('(min-width: 768px)').matches
