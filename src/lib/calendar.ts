export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const pad = (value: number) => String(value).padStart(2, '0')

export function shiftMonth(month: string, by: number): string {
  const [year, value] = month.split('-').map(Number)
  const date = new Date(Date.UTC(year, value - 1 + by, 1))
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`
}

export function monthRange(month: string): { from: string; to: string } {
  const [year, value] = month.split('-').map(Number)
  const last = new Date(Date.UTC(year, value, 0)).getUTCDate()
  return { from: `${month}-01`, to: `${month}-${pad(last)}` }
}

export function monthDays(month: string): string[] {
  const { to } = monthRange(month)
  const count = Number(to.slice(8))
  return Array.from({ length: count }, (_, index) => `${month}-${pad(index + 1)}`)
}

export function leadingBlanks(month: string): number {
  return (new Date(`${month}-01T00:00:00Z`).getUTCDay() + 6) % 7
}

export function monthTitle(month: string): string {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function dayTitle(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

export function datesBetween(from: string, to: string): string[] {
  const days: string[] = []
  const cursor = new Date(`${from}T00:00:00Z`)
  const end = new Date(`${to}T00:00:00Z`)
  while (cursor <= end && days.length < 400) {
    days.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return days
}
