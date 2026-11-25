import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { z } from 'zod'
import { toApiError } from '@/lib/api/errors'
import type { CurrentBed } from '../api'

export const todayIso = () => {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

export const bedText = (bed: Pick<CurrentBed, 'room_no' | 'bed_no'> | null) =>
  bed ? `${bed.room_no} / ${bed.bed_no}` : null

export const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} must be ${max} characters or less`)

export const optionalMobile = z
  .string()
  .trim()
  .refine((value) => !value || /^[6-9]\d{9}$/.test(value), 'Enter a valid 10-digit mobile number')

export const optionalAmount = z
  .string()
  .trim()
  .refine(
    (value) => !value || (/^\d+(\.\d{1,2})?$/.test(value) && Number(value) <= 9999999),
    'Enter an amount like 250 or 250.50'
  )

export const nullIfEmpty = (value: string) => value.trim() || null

export const undefinedIfEmpty = (value: string) => value.trim() || undefined

export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: Path<T>[],
  codes: Partial<Record<string, Path<T>>> = {}
) {
  const apiError = toApiError(error)
  let mapped = false
  apiError.fieldErrors.forEach((item) => {
    const field = fields.find((name) => name === item.field)
    if (!field) return
    setError(field, { message: item.message }, { shouldFocus: !mapped })
    mapped = true
  })
  const codeField = codes[apiError.code]
  if (codeField) {
    setError(codeField, { message: apiError.message }, { shouldFocus: !mapped })
    mapped = true
  }
  if (!mapped) setError('root', { message: apiError.message })
}
