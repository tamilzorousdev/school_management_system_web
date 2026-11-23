import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { z } from 'zod'
import { toApiError, type ApiError } from '@/lib/api/errors'

export const MOBILE_RE = /^[6-9]\d{9}$/
export const currentYear = () => new Date().getFullYear()

export const text = (max: number) => z.string().trim().max(max, `Must be ${max} characters or less`)

export const mobileText = (label = 'mobile') =>
  z
    .string()
    .trim()
    .refine((value) => !value || MOBILE_RE.test(value), `Enter a valid 10-digit ${label} number`)

export const emailText = z
  .string()
  .trim()
  .max(120, 'Email must be 120 characters or less')
  .refine((value) => !value || z.email().safeParse(value).success, 'Enter a valid email address')

export const pincodeText = z
  .string()
  .trim()
  .refine((value) => !value || /^\d{6}$/.test(value), 'Pincode must be 6 digits')

export const urlText = z
  .string()
  .trim()
  .max(255, 'Link must be 255 characters or less')
  .refine(
    (value) => !value || /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(value),
    'Enter the full link starting with https://'
  )

export const batchYearText = z
  .string()
  .trim()
  .min(1, 'Enter the year they left')
  .refine((value) => /^\d{4}$/.test(value), 'Enter a 4-digit year')
  .refine(
    (value) => Number(value) >= 1950 && Number(value) <= currentYear(),
    `Year must be between 1950 and ${currentYear()}`
  )

export const percentText = z
  .string()
  .trim()
  .refine(
    (value) =>
      !value || (/^\d{1,3}(\.\d{1,2})?$/.test(value) && Number(value) >= 0 && Number(value) <= 100),
    'Enter a percent from 0 to 100 with up to 2 decimals'
  )

export const digitsOnly = (value: string) => value.replace(/\D/g, '').slice(-10)

export const orNull = (value: string) => {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export const numberOrNull = (value: string) => {
  const trimmed = value.trim()
  return trimmed ? Number(trimmed) : null
}

export const contactShape = {
  mobile: mobileText(),
  alt_mobile: mobileText('alternate mobile'),
  email: emailText,
  address_line: text(255),
  city: text(80),
  state: text(80),
  pincode: pincodeText,
  country: text(60),
  linkedin_url: urlText,
  contact_consent: z.boolean(),
  occupation_status: z.enum([
    'higher_studies',
    'employed',
    'self_employed',
    'seeking',
    'other',
    'unknown',
  ]),
  institution: text(150),
  course: text(120),
  organization: text(150),
  designation: text(120),
}

export const contactSchema = z.object(contactShape)
export type ContactValues = z.infer<typeof contactSchema>
export type ContactTextKey = Exclude<keyof ContactValues, 'contact_consent' | 'occupation_status'>

export const CONTACT_FIELDS: ContactTextKey[] = [
  'mobile',
  'alt_mobile',
  'email',
  'linkedin_url',
  'address_line',
  'city',
  'state',
  'pincode',
  'country',
]

export const CAREER_FIELDS: ContactTextKey[] = [
  'institution',
  'course',
  'organization',
  'designation',
]

export const emptyContact: ContactValues = {
  mobile: '',
  alt_mobile: '',
  email: '',
  address_line: '',
  city: '',
  state: '',
  pincode: '',
  country: '',
  linkedin_url: '',
  contact_consent: true,
  occupation_status: 'unknown',
  institution: '',
  course: '',
  organization: '',
  designation: '',
}

export const contactValues = (source: {
  [K in keyof ContactValues]?: ContactValues[K] | null
}): ContactValues => ({
  mobile: source.mobile ?? '',
  alt_mobile: source.alt_mobile ?? '',
  email: source.email ?? '',
  address_line: source.address_line ?? '',
  city: source.city ?? '',
  state: source.state ?? '',
  pincode: source.pincode ?? '',
  country: source.country ?? '',
  linkedin_url: source.linkedin_url ?? '',
  contact_consent: source.contact_consent ?? true,
  occupation_status: source.occupation_status ?? 'unknown',
  institution: source.institution ?? '',
  course: source.course ?? '',
  organization: source.organization ?? '',
  designation: source.designation ?? '',
})

export const contactInput = (values: ContactValues) => ({
  mobile: orNull(values.mobile),
  alt_mobile: orNull(values.alt_mobile),
  email: orNull(values.email),
  address_line: orNull(values.address_line),
  city: orNull(values.city),
  state: orNull(values.state),
  pincode: orNull(values.pincode),
  country: orNull(values.country),
  linkedin_url: orNull(values.linkedin_url),
  contact_consent: values.contact_consent,
  occupation_status: values.occupation_status,
  institution: orNull(values.institution),
  course: orNull(values.course),
  organization: orNull(values.organization),
  designation: orNull(values.designation),
})

export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  fields: readonly string[],
  setError: UseFormSetError<T>
): ApiError {
  const apiError = toApiError(error)
  let mapped = false
  apiError.fieldErrors.forEach((fieldError) => {
    if (fields.includes(fieldError.field)) {
      setError(
        fieldError.field as Path<T>,
        { message: fieldError.message },
        { shouldFocus: !mapped }
      )
      mapped = true
    }
  })
  if (!mapped) setError('root', { message: apiError.message })
  return apiError
}

export const PUBLIC_ERRORS: Record<string, string> = {
  SUBMISSION_PENDING:
    'You already have details waiting for the school to review. Please wait until they are checked.',
  TOO_MANY_SUBMISSIONS:
    'The school is receiving many forms right now. Please try again in an hour.',
  SCHOOL_NOT_FOUND: 'We could not find this school. Check the link you were sent.',
  LINK_INVALID: 'This link has expired or was already used. Ask the school for a new one.',
  NO_CHANGES: 'Nothing has changed. Edit at least one detail before sending.',
}

export const publicErrorMessage = (code: string, fallback: string) =>
  PUBLIC_ERRORS[code] ?? fallback
