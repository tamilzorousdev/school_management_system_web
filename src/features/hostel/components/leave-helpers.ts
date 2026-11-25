import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { config } from '@/config/env'
import { toApiError } from '@/lib/api/errors'
import type { ConsentStatus, PassVerdict } from '../api'
import type { Tone } from '../labels'

export const MOBILE_PATTERN = /^[6-9]\d{9}$/

export const digitsOnly = (value: string) => value.replace(/\D/g, '').slice(-10)

export const textOrNull = (value: string | undefined | null) => value?.trim() || null

export const todayIso = () => new Date().toLocaleDateString('en-CA', { timeZone: config.timeZone })

export const shiftDate = (iso: string, days: number) =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10)

export const nowTime = () =>
  new Date().toLocaleTimeString('en-GB', {
    timeZone: config.timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

const pad = (value: number) => String(value).padStart(2, '0')

function zoneOffset(date: string, time: string) {
  try {
    const instant = new Date(`${date}T${time}:00Z`)
    const name = new Intl.DateTimeFormat('en-US', {
      timeZone: config.timeZone,
      timeZoneName: 'longOffset',
    })
      .formatToParts(instant)
      .find((part) => part.type === 'timeZoneName')?.value
    const match = /GMT([+-]\d{2}):?(\d{2})?/.exec(name ?? '')
    if (match) return `${match[1]}:${match[2] ?? '00'}`
    if (name === 'GMT') return '+00:00'
  } catch {
    return localOffset(date, time)
  }
  return localOffset(date, time)
}

function localOffset(date: string, time: string) {
  const minutes = -new Date(`${date}T${time}:00`).getTimezoneOffset()
  const sign = minutes >= 0 ? '+' : '-'
  const abs = Math.abs(minutes)
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
}

export const zonedIso = (date: string, time: string) =>
  `${date}T${time}:00${zoneOffset(date, time)}`

export const timeLabel = (value: string | null) => {
  if (!value) return null
  const [hours, minutes] = value.split(':').map(Number)
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return `${hour12}:${pad(minutes)} ${hours < 12 ? 'AM' : 'PM'}`
}

export const CONSENT_STATUS: Record<ConsentStatus, Tone> = {
  not_needed: { label: 'Not needed', tone: 'neutral' },
  waiting: { label: 'Waiting for parent', tone: 'warning' },
  given: { label: 'Parent agreed', tone: 'success' },
  refused: { label: 'Parent refused', tone: 'danger' },
}

export const PASS_VERDICT: Record<PassVerdict, string> = {
  can_go_out: 'Can go out',
  can_come_in: 'Can come in',
  not_approved: 'Not approved yet',
  not_started: 'Not started yet',
  expired: 'Pass expired',
  closed: 'Pass closed',
}

export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
  codes: Partial<Record<string, Path<T>>> = {}
) {
  const apiError = toApiError(error)
  let mapped = false
  apiError.fieldErrors.forEach((fieldError) => {
    const field = fields.find((name) => name === fieldError.field)
    if (field) {
      setError(field, { message: fieldError.message }, { shouldFocus: !mapped })
      mapped = true
    }
  })
  const target = codes[apiError.code]
  if (target) {
    setError(target, { message: apiError.message }, { shouldFocus: true })
    return apiError
  }
  if (!mapped) setError('root', { message: apiError.message })
  return apiError
}
