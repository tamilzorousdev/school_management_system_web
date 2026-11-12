export interface SlotRow {
  key: number
  name: string
  start_time: string
  end_time: string
  is_break: boolean
  is_special: boolean
  section_ids: number[] | null
}

export type SlotSide = 'morning' | 'evening'

export interface BreakGap {
  index: number
  side: SlotSide
  label: string
}

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const toTime = (minutes: number) => {
  const total = Math.max(0, Math.min(23 * 60 + 59, minutes))
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export const shift = (time: string, minutes: number) => toTime(toMinutes(time) + minutes)

const isTeaching = (row: SlotRow) => !row.is_break && !row.is_special

export function teachingBounds(rows: SlotRow[]): { first: number; last: number } | null {
  const indexes = rows
    .map((row, index) => (isTeaching(row) ? index : -1))
    .filter((index) => index >= 0)
  return indexes.length ? { first: indexes[0], last: indexes[indexes.length - 1] } : null
}

export function specialName(rows: SlotRow[]): string {
  const count = rows.filter((row) => row.is_special).length
  return count ? `Special class ${count + 1}` : 'Special class'
}

export function addSpecial(
  rows: SlotRow[],
  side: SlotSide,
  name: string,
  minutes: number,
  key: number,
  sectionIds: number[] | null = null,
  breakMinutes = 0,
  breakKey = key + 1
): SlotRow[] {
  const gap = Math.max(0, Math.min(breakMinutes, minutes - 5))
  const special = (start_time: string, end_time: string): SlotRow => ({
    key,
    name,
    start_time,
    end_time,
    is_break: false,
    is_special: true,
    section_ids: sectionIds,
  })
  const pause = (start_time: string, end_time: string): SlotRow => ({
    key: breakKey,
    name: 'Special class break',
    start_time,
    end_time,
    is_break: true,
    is_special: false,
    section_ids: null,
  })
  if (side === 'evening') {
    const start = rows.at(-1)?.end_time ?? '16:00'
    const classStart = shift(start, gap)
    return [
      ...rows,
      ...(gap ? [pause(start, classStart)] : []),
      special(classStart, shift(start, minutes)),
    ]
  }
  const end = rows[0]?.start_time ?? '08:00'
  const classEnd = shift(end, -gap)
  return [special(shift(end, -minutes), classEnd), ...(gap ? [pause(classEnd, end)] : []), ...rows]
}

export function insideDay(rows: SlotRow[]): SlotRow | null {
  const bounds = teachingBounds(rows)
  if (!bounds) return null
  return (
    rows.find((row, index) => row.is_special && index > bounds.first && index < bounds.last) ?? null
  )
}

export function breakGaps(rows: SlotRow[]): BreakGap[] {
  const bounds = teachingBounds(rows)
  if (!bounds) return []
  const gaps: BreakGap[] = []
  rows.forEach((row, index) => {
    if (!row.is_special) return
    if (index > bounds.last) {
      const before = rows[index - 1]
      if (!before || before.is_break) return
      gaps.push({
        index,
        side: 'evening',
        label:
          index - 1 === bounds.last
            ? `After ${before.name}`
            : `Between ${before.name} and ${row.name}`,
      })
    } else if (index < bounds.first) {
      const after = rows[index + 1]
      if (!after || after.is_break) return
      gaps.push({
        index: index + 1,
        side: 'morning',
        label:
          index + 1 === bounds.first
            ? `After ${row.name}, before ${after.name}`
            : `Between ${row.name} and ${after.name}`,
      })
    }
  })
  return gaps
}

export function insertBreak(
  rows: SlotRow[],
  gap: BreakGap,
  minutes: number,
  name: string,
  key: number
): SlotRow[] {
  if (gap.side === 'evening') {
    const start = rows[gap.index - 1].end_time
    const moved = rows.map((row, index) =>
      index >= gap.index
        ? {
            ...row,
            start_time: shift(row.start_time, minutes),
            end_time: shift(row.end_time, minutes),
          }
        : row
    )
    return [
      ...moved.slice(0, gap.index),
      {
        key,
        name,
        start_time: start,
        end_time: shift(start, minutes),
        is_break: true,
        is_special: false,
        section_ids: null,
      },
      ...moved.slice(gap.index),
    ]
  }
  const end = rows[gap.index].start_time
  const moved = rows.map((row, index) =>
    index < gap.index
      ? {
          ...row,
          start_time: shift(row.start_time, -minutes),
          end_time: shift(row.end_time, -minutes),
        }
      : row
  )
  return [
    ...moved.slice(0, gap.index),
    {
      key,
      name,
      start_time: shift(end, -minutes),
      end_time: end,
      is_break: true,
      is_special: false,
      section_ids: null,
    },
    ...moved.slice(gap.index),
  ]
}
