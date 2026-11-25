import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Combobox, type ComboboxOption } from '@/components/common/combobox'
import { studentsApi } from '@/features/students/api'
import { useDebouncedValue } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import { hostelApi, useAvailableBeds, useBlocks, useHostels, useRoomTypes } from '../api'
import { HOSTEL_GENDER } from '../labels'

interface PickerProps {
  id: string
  label: string
  value?: string
  onChange: (value: string | undefined, option?: ComboboxOption) => void
  placeholder?: string
  allLabel?: string
  invalid?: boolean
  className?: string
  initial?: ComboboxOption | null
}

const fieldClass = 'sm:w-full'

function SearchCombobox({
  id,
  label,
  value,
  onChange,
  placeholder,
  allLabel,
  invalid,
  className,
  initial,
  options,
  loading,
  onSearch,
  searchPlaceholder,
  emptyText,
}: PickerProps & {
  options: ComboboxOption[]
  loading: boolean
  onSearch: (query: string) => void
  searchPlaceholder: string
  emptyText: string
}) {
  const [picked, setPicked] = useState<ComboboxOption | null>(initial ?? null)
  const known = options.some((option) => option.value === value)
  const fallback =
    value && !known
      ? picked?.value === value
        ? picked
        : initial?.value === value
          ? initial
          : { value, label: `${label} #${value}` }
      : null
  const all = fallback ? [fallback, ...options] : options
  return (
    <Combobox
      id={id}
      label={label}
      value={value}
      options={all}
      allLabel={allLabel}
      placeholder={placeholder ?? `Choose ${label.toLowerCase()}`}
      searchPlaceholder={searchPlaceholder}
      emptyText={loading ? 'Loading…' : emptyText}
      onSearch={onSearch}
      invalid={invalid}
      highlightSelected={Boolean(allLabel)}
      className={cn(!allLabel && fieldClass, className)}
      onChange={(next) => {
        const option = all.find((item) => item.value === next)
        setPicked(option ?? null)
        onChange(next, option)
      }}
    />
  )
}

export function HostelSelect({
  id,
  label = 'Hostel',
  value,
  onChange,
  allLabel,
  invalid,
  className,
  placeholder,
}: Omit<PickerProps, 'label' | 'initial'> & { label?: string }) {
  const hostels = useHostels()
  const options = (hostels.data ?? []).map((hostel) => ({
    value: String(hostel.id),
    label: hostel.name,
    hint: `${HOSTEL_GENDER[hostel.gender]} · ${hostel.occupied_beds}/${hostel.bed_count} beds`,
  }))
  return (
    <Combobox
      id={id}
      label={label}
      value={value}
      options={options}
      allLabel={allLabel}
      placeholder={placeholder ?? 'Choose hostel'}
      emptyText={hostels.isPending ? 'Loading…' : 'No hostels yet'}
      invalid={invalid}
      highlightSelected={Boolean(allLabel)}
      className={cn(!allLabel && fieldClass, className)}
      onChange={(next) => onChange(next)}
    />
  )
}

export function BlockSelect({
  id,
  label = 'Block',
  hostelId,
  value,
  onChange,
  allLabel,
  invalid,
  className,
}: Omit<PickerProps, 'label' | 'initial'> & { label?: string; hostelId?: number }) {
  const blocks = useBlocks(hostelId)
  const options = (blocks.data ?? []).map((block) => ({
    value: String(block.id),
    label: block.name,
    hint: `${block.room_count} rooms`,
  }))
  return (
    <Combobox
      id={id}
      label={label}
      value={value}
      options={options}
      allLabel={allLabel}
      placeholder='Choose block'
      emptyText={blocks.isPending ? 'Loading…' : 'No blocks yet'}
      invalid={invalid}
      highlightSelected={Boolean(allLabel)}
      className={cn(!allLabel && fieldClass, className)}
      onChange={(next) => onChange(next)}
    />
  )
}

export function RoomTypeSelect({
  id,
  label = 'Room type',
  value,
  onChange,
  allLabel,
  invalid,
  className,
}: Omit<PickerProps, 'label' | 'initial'> & { label?: string }) {
  const types = useRoomTypes()
  const options = (types.data ?? []).map((type) => ({
    value: String(type.id),
    label: type.name,
    hint: `${type.default_beds} beds${type.is_ac ? ' · AC' : ''}`,
  }))
  return (
    <Combobox
      id={id}
      label={label}
      value={value}
      options={options}
      allLabel={allLabel}
      placeholder='Choose room type'
      emptyText={types.isPending ? 'Loading…' : 'No room types yet'}
      invalid={invalid}
      highlightSelected={Boolean(allLabel)}
      className={cn(!allLabel && fieldClass, className)}
      onChange={(next) => onChange(next)}
    />
  )
}

export function VacantBedSelect({
  id,
  label = 'Bed',
  hostelId,
  value,
  onChange,
  invalid,
  className,
}: Omit<PickerProps, 'label' | 'initial' | 'allLabel'> & { label?: string; hostelId?: number }) {
  const beds = useAvailableBeds(hostelId)
  const options = (beds.data ?? []).map((bed) => ({
    value: String(bed.bed_id),
    label: `${bed.room_no} · bed ${bed.bed_no}`,
    hint: [bed.hostel_name, bed.block_name, bed.floor_name, bed.room_type_name].join(' · '),
  }))
  return (
    <Combobox
      id={id}
      label={label}
      value={value}
      options={options}
      placeholder='Choose a vacant bed'
      searchPlaceholder='Search room or block'
      emptyText={beds.isPending ? 'Loading…' : 'No vacant beds'}
      invalid={invalid}
      highlightSelected={false}
      className={cn(fieldClass, className)}
      onChange={(next) => onChange(next)}
    />
  )
}

export function ResidentPicker({ hostelId, ...props }: PickerProps & { hostelId?: number }) {
  const [query, setQuery] = useState('')
  const search = useDebouncedValue(query.trim(), 300)
  const residents = useQuery({
    queryKey: [
      'hostel',
      'admissions',
      { page: 1, limit: 20, search, hostel_id: hostelId, picker: true },
    ],
    queryFn: () =>
      hostelApi.admissions({
        page: 1,
        limit: 20,
        search: search || undefined,
        hostel_id: hostelId,
      }),
    placeholderData: keepPreviousData,
    meta: { silent: true },
  })
  const options = (residents.data?.items ?? []).map((item) => ({
    value: String(item.id),
    label: item.student.name,
    hint: [
      item.student.admission_no,
      [item.student.class_name, item.student.section_name].filter(Boolean).join(' '),
      item.bed ? `${item.bed.room_no} / ${item.bed.bed_no}` : 'No bed',
    ]
      .filter(Boolean)
      .join(' · '),
  }))
  return (
    <SearchCombobox
      {...props}
      options={options}
      loading={residents.isFetching}
      onSearch={setQuery}
      searchPlaceholder='Search name, admission number or room'
      emptyText='No residents found'
    />
  )
}

export function StudentPicker(props: PickerProps) {
  const [query, setQuery] = useState('')
  const search = useDebouncedValue(query.trim(), 300)
  const students = useQuery({
    queryKey: ['students', 'list', { page: 1, limit: 20, search, status: 'active', picker: true }],
    queryFn: () =>
      studentsApi.list({ page: 1, limit: 20, search: search || undefined, status: 'active' }),
    placeholderData: keepPreviousData,
    meta: { silent: true },
  })
  const options = (students.data?.items ?? []).map((item) => ({
    value: String(item.id),
    label: item.full_name,
    hint: [item.admission_no, item.class?.name, item.section?.name].filter(Boolean).join(' · '),
  }))
  return (
    <SearchCombobox
      {...props}
      options={options}
      loading={students.isFetching}
      onSearch={setQuery}
      searchPlaceholder='Search student name or admission number'
      emptyText='No students found'
    />
  )
}

export { StaffPicker } from '@/features/inventory/components/pickers'
