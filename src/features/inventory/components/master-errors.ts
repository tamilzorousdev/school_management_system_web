import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { toApiError } from '@/lib/api/errors'

export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: Path<T>[],
  codeFields: Record<string, Path<T>> = {}
) {
  const apiError = toApiError(error)
  let mapped = false
  apiError.fieldErrors.forEach((item) => {
    const field = fields.find((name) => name === item.field)
    if (field) {
      setError(field, { message: item.message }, { shouldFocus: !mapped })
      mapped = true
    }
  })
  const codeField = codeFields[apiError.code]
  if (codeField) {
    setError(codeField, { message: apiError.message }, { shouldFocus: true })
    mapped = true
  }
  if (!mapped) setError('root' as Path<T>, { message: apiError.message })
}

export const optionalNumber = (value: string, min: number, max: number, integer = false) => {
  const text = value.trim()
  if (!text) return true
  const number = Number(text)
  if (!Number.isFinite(number) || number < min || number > max) return false
  return integer ? Number.isInteger(number) : true
}

export const numberOrNull = (value: string) => {
  const text = value.trim()
  return text ? Number(text) : null
}

export const textOrNull = (value: string | undefined) => {
  const text = (value ?? '').trim()
  return text ? text : null
}
