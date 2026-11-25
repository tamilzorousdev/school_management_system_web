import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { toApiError } from '@/lib/api/errors'

export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: Path<T>[],
  codes: Partial<Record<string, Path<T>>> = {}
) {
  const apiError = toApiError(error)
  const codeField = codes[apiError.code]
  if (codeField) {
    setError(codeField, { message: apiError.message }, { shouldFocus: true })
    return
  }
  let mapped = false
  apiError.fieldErrors.forEach((fieldError) => {
    const field = fields.find((name) => name === fieldError.field)
    if (field) {
      setError(field, { message: fieldError.message }, { shouldFocus: !mapped })
      mapped = true
    }
  })
  if (!mapped) setError('root', { message: apiError.message })
}

export const CODE_PATTERN = /^[A-Za-z0-9-]{1,20}$/
export const CODE_HINT = 'Up to 20 letters, digits or dashes'
export const MOBILE_PATTERN = /^[6-9]\d{9}$/
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/
export const MONEY_PATTERN = /^\d{1,7}(\.\d{1,2})?$/

export const optionalText = (value: string) => value.trim() || null

export const intInRange = (value: string, min: number, max: number) => {
  if (!/^-?\d+$/.test(value.trim())) return false
  const number = Number(value)
  return number >= min && number <= max
}

export const floorLevelLabel = (level: number) =>
  level === 0 ? 'Ground' : level < 0 ? `Basement ${-level}` : `Level ${level}`

export const bedsLine = (occupied: number, total: number) =>
  `${occupied}/${total} bed${total === 1 ? '' : 's'} in use`
