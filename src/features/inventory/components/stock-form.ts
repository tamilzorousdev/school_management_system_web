import { z } from 'zod'
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { toApiError } from '@/lib/api/errors'

const DECIMAL = /^\d+(\.\d{1,2})?$/

export const isDecimal = (value: string) => DECIMAL.test(value.trim())

export const quantityField = (message = 'Enter a quantity above 0') =>
  z
    .string()
    .trim()
    .refine((value) => isDecimal(value) && Number(value) > 0, message)

export const zeroOrMoreField = (message = 'Enter 0 or more') =>
  z
    .string()
    .trim()
    .refine((value) => isDecimal(value), message)

export const optionalMoneyField = z
  .string()
  .trim()
  .refine((value) => !value || isDecimal(value), 'Enter an amount like 250 or 250.50')

export const optionalDateField = z
  .string()
  .trim()
  .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), 'Choose a date')

export interface LineDraft {
  item_id: string
  label: string
  quantity: string
  rate: string
}

export const emptyLine = (item?: { id: number; name: string }): LineDraft => ({
  item_id: item ? String(item.id) : '',
  label: item?.name ?? '',
  quantity: '',
  rate: '',
})

const baseLine = z.object({
  item_id: z.string().min(1, 'Choose an item'),
  label: z.string(),
  quantity: quantityField(),
  rate: z.string(),
})

const uniqueItems = (lines: LineDraft[]) =>
  new Set(lines.map((line) => line.item_id).filter(Boolean)).size ===
  lines.filter((line) => line.item_id).length

export const linesField = z
  .array(baseLine)
  .min(1, 'Add at least one item')
  .refine(uniqueItems, 'Each item can be added once')

export const rateLinesField = z
  .array(
    baseLine.extend({
      rate: z
        .string()
        .trim()
        .refine((value) => isDecimal(value), 'Enter the rate'),
    })
  )
  .min(1, 'Add at least one item')
  .refine(uniqueItems, 'Each item can be added once')

type Message = { message?: string } | undefined

export interface LineMessages {
  item_id?: string
  quantity?: string
  rate?: string
}

export function lineMessages(errors: unknown): LineMessages[] {
  if (!Array.isArray(errors)) return []
  return (errors as (Record<string, Message> | undefined)[]).map((error) => ({
    item_id: error?.item_id?.message,
    quantity: error?.quantity?.message,
    rate: error?.rate?.message,
  }))
}

export function listMessage(errors: unknown) {
  const error = errors as { message?: string; root?: { message?: string } } | undefined
  return error?.message ?? error?.root?.message
}

export function mapApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly string[],
  codes: Record<string, string> = {}
) {
  const apiError = toApiError(error)
  const codeField = codes[apiError.code]
  if (codeField) {
    setError(codeField as Path<T>, { message: apiError.message }, { shouldFocus: true })
    return
  }
  let mapped = false
  apiError.fieldErrors.forEach((fieldError) => {
    const known = fields.some(
      (name) => fieldError.field === name || fieldError.field.startsWith(`${name}.`)
    )
    if (!known) return
    setError(fieldError.field as Path<T>, { message: fieldError.message }, { shouldFocus: !mapped })
    mapped = true
  })
  if (!mapped) setError('root' as Path<T>, { message: apiError.message })
}

export const numberOrUndefined = (value: string) => {
  const text = value.trim()
  return text ? Number(text) : undefined
}

export const numberOrNull = (value: string) => {
  const text = value.trim()
  return text ? Number(text) : null
}

export const targetFields = {
  target: z.enum(['department', 'staff', 'section']),
  department_id: z.string(),
  user_id: z.string(),
  section_id: z.string(),
}

export function targetMissing(values: {
  target: 'department' | 'staff' | 'section'
  department_id: string
  user_id: string
  section_id: string
}) {
  if (values.target === 'department' && !values.department_id) return 'Choose the department'
  if (values.target === 'staff' && !values.user_id) return 'Choose the staff member'
  if (values.target === 'section' && !values.section_id) return 'Choose the class'
  return undefined
}

export function targetIds(values: {
  target: 'department' | 'staff' | 'section'
  department_id: string
  user_id: string
  section_id: string
}) {
  return {
    department_id: values.target === 'department' ? Number(values.department_id) : undefined,
    user_id: values.target === 'staff' ? Number(values.user_id) : undefined,
    section_id: values.target === 'section' ? Number(values.section_id) : undefined,
  }
}

export const remaining = (line: {
  quantity: number
  approved_quantity: number | null
  issued_quantity: number
}) => Math.max(0, (line.approved_quantity ?? line.quantity) - line.issued_quantity)

export const requisitionFor = (requisition: {
  department: { name: string } | null
  requested_for: { name: string } | null
  section: { name: string } | null
}) =>
  [requisition.department?.name, requisition.requested_for?.name, requisition.section?.name]
    .filter(Boolean)
    .join(' · ') || '—'
