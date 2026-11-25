import { useState } from 'react'
import { Combobox, type ComboboxOption } from '@/components/common/combobox'
import { useDebouncedValue } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import { useRooms } from '../api'

export function RoomSelect({
  id,
  label = 'Room',
  hostelId,
  blockId,
  value,
  onChange,
  allLabel,
  placeholder,
  invalid,
  className,
  initial,
}: {
  id: string
  label?: string
  hostelId?: number
  blockId?: number
  value?: string
  onChange: (value: string | undefined, option?: ComboboxOption) => void
  allLabel?: string
  placeholder?: string
  invalid?: boolean
  className?: string
  initial?: ComboboxOption | null
}) {
  const [query, setQuery] = useState('')
  const search = useDebouncedValue(query.trim(), 300)
  const rooms = useRooms(
    {
      page: 1,
      limit: 100,
      search: search || undefined,
      hostel_id: hostelId,
      block_id: blockId,
      sort: 'room_no',
      order: 'asc',
    },
    Boolean(hostelId)
  )
  const options: ComboboxOption[] = (rooms.data?.items ?? []).map((room) => ({
    value: String(room.id),
    label: room.room_no,
    hint: [room.block_name, room.floor_name].filter(Boolean).join(' · '),
  }))
  const known = options.some((option) => option.value === value)
  const fallback =
    value && !known
      ? initial?.value === value
        ? initial
        : { value, label: `Room #${value}` }
      : null
  const all = fallback ? [fallback, ...options] : options

  return (
    <Combobox
      id={id}
      label={label}
      value={value}
      options={all}
      allLabel={allLabel}
      placeholder={placeholder ?? (hostelId ? 'Choose room' : 'Choose a hostel first')}
      searchPlaceholder='Search room number'
      emptyText={
        !hostelId ? 'Choose a hostel first' : rooms.isFetching ? 'Loading…' : 'No rooms found'
      }
      onSearch={setQuery}
      invalid={invalid}
      highlightSelected={Boolean(allLabel)}
      className={cn(!allLabel && 'sm:w-full', className)}
      onChange={(next) =>
        onChange(
          next,
          all.find((option) => option.value === next)
        )
      }
    />
  )
}
