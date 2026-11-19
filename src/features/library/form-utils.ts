import { z } from 'zod'

export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const DECIMAL = /^\d+(\.\d{1,2})?$/
const INTEGER = /^\d+$/

export const textOrNull = (value: string | undefined) => {
  const trimmed = (value ?? '').trim()
  return trimmed ? trimmed : null
}

export const numberOrNull = (value: string | undefined) => {
  const trimmed = (value ?? '').trim()
  return trimmed ? Number(trimmed) : null
}

export const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} must be ${max} characters or less`)

export const optionalInt = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .refine((value) => !value || INTEGER.test(value), `${label} must be a whole number`)
    .refine(
      (value) => !value || (Number(value) >= min && Number(value) <= max),
      `${label} must be between ${min} and ${max}`
    )

export const requiredInt = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter ${label.toLowerCase()}`)
    .refine((value) => INTEGER.test(value), `${label} must be a whole number`)
    .refine(
      (value) => Number(value) >= min && Number(value) <= max,
      `${label} must be between ${min} and ${max}`
    )

export const optionalAmount = (max: number, label: string) =>
  z
    .string()
    .trim()
    .refine(
      (value) => !value || DECIMAL.test(value),
      `${label}: use a number with up to 2 decimals`
    )
    .refine((value) => !value || Number(value) <= max, `${label} must be ${max} or less`)

export const requiredAmount = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter the ${label.toLowerCase()}`)
    .refine((value) => DECIMAL.test(value), `${label}: use a number with up to 2 decimals`)
    .refine(
      (value) => Number(value) >= min && Number(value) <= max,
      `${label} must be between ${min} and ${max}`
    )

export const optionalDate = z
  .string()
  .trim()
  .refine((value) => !value || DATE_PATTERN.test(value), 'Choose a valid date')

export const COPY_CONDITION_VALUES = ['new', 'good', 'fair', 'poor'] as const
export const COPY_SOURCE_VALUES = ['purchase', 'donation', 'other'] as const

export const copiesSchema = (minCount: number) =>
  z
    .object({
      mode: z.enum(['count', 'scan']),
      count: z.string().trim(),
      barcodes: z.array(z.string()),
      condition: z.enum(COPY_CONDITION_VALUES),
      source: z.enum(COPY_SOURCE_VALUES),
      vendor: optionalText(120, 'Vendor'),
      bill_no: optionalText(40, 'Bill number'),
      acquired_on: optionalDate,
      price: optionalAmount(1000000, 'Price'),
    })
    .superRefine((value, context) => {
      if (value.mode === 'count') {
        const ok = INTEGER.test(value.count) && Number(value.count) >= minCount
        if (!ok || Number(value.count) > 200) {
          context.addIssue({
            code: 'custom',
            path: ['count'],
            message: `Enter a number from ${minCount} to 200`,
          })
        }
      } else {
        if (value.barcodes.length < 1) {
          context.addIssue({
            code: 'custom',
            path: ['barcodes'],
            message: 'Scan at least one barcode',
          })
        }
        if (value.barcodes.length > 200) {
          context.addIssue({
            code: 'custom',
            path: ['barcodes'],
            message: 'Up to 200 barcodes at once',
          })
        }
      }
    })

export type CopiesValues = z.infer<ReturnType<typeof copiesSchema>>

export const emptyCopies = (count: string): CopiesValues => ({
  mode: 'count',
  count,
  barcodes: [],
  condition: 'new',
  source: 'purchase',
  vendor: '',
  bill_no: '',
  acquired_on: '',
  price: '',
})

export function copiesPayload(values: CopiesValues) {
  return {
    ...(values.mode === 'count'
      ? { count: Number(values.count) }
      : { barcodes: values.barcodes, count: values.barcodes.length }),
    condition: values.condition,
    source: values.source,
    vendor: textOrNull(values.vendor),
    bill_no: textOrNull(values.bill_no),
    acquired_on: values.acquired_on || undefined,
    price: numberOrNull(values.price),
  }
}

export const hasCopies = (values: CopiesValues) =>
  values.mode === 'scan' ? values.barcodes.length > 0 : Number(values.count) > 0
