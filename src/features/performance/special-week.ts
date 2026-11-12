import type { SpecialClass } from './api'

const todayIso = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10)

export function activeSpecials(rows: SpecialClass[], today = todayIso()): SpecialClass[] {
  return rows.filter((row) => !row.end_date || row.end_date >= today)
}

export function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay()
}

export function specialDays(row: SpecialClass): number[] {
  if (row.timing === 'period') return row.day_of_week === null ? [] : [row.day_of_week]
  if (row.days.length) return row.days
  return row.start_date ? [weekdayOf(row.start_date)] : []
}

export function sessionsPerWeek(row: SpecialClass): number {
  return specialDays(row).length
}

export function minutesOf(row: SpecialClass): number {
  if (!row.start_time || !row.end_time) return 0
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }
  return Math.max(0, toMinutes(row.end_time) - toMinutes(row.start_time))
}

export function weeklySpecialLoad(rows: SpecialClass[]): { sessions: number; minutes: number } {
  return activeSpecials(rows).reduce(
    (total, row) => ({
      sessions: total.sessions + sessionsPerWeek(row),
      minutes: total.minutes + sessionsPerWeek(row) * minutesOf(row),
    }),
    { sessions: 0, minutes: 0 }
  )
}

export function hoursText(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return [hours ? `${hours}h` : '', rest ? `${rest}m` : ''].filter(Boolean).join(' ') || '0m'
}

export function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number)
  const total = Math.min(hours * 60 + mins + minutes, 23 * 60 + 59)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}
