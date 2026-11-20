import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Combobox, type ComboboxOption } from '@/components/common/combobox'
import { staffApi } from '@/features/staff/api'
import { useDebouncedValue } from '@/hooks/use-debounce'

export function AppraisalStaffPicker({
  id,
  label,
  value,
  onChange,
  allLabel,
  placeholder,
  invalid,
  className,
}: {
  id: string
  label: string
  value?: number
  onChange: (value: number | undefined) => void
  allLabel?: string
  placeholder?: string
  invalid?: boolean
  className?: string
}) {
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<ComboboxOption | null>(null)
  const search = useDebouncedValue(query.trim(), 300)
  const staff = useQuery({
    queryKey: ['staff', 'list', { page: 1, limit: 20, search, picker: 'appraisal' }],
    queryFn: () => staffApi.list({ page: 1, limit: 20, search: search || undefined }),
    placeholderData: keepPreviousData,
    meta: { silent: true },
  })
  const options: ComboboxOption[] = (staff.data?.items ?? []).map((item) => ({
    value: String(item.id),
    label: item.name,
    hint: [item.employee_no, item.department ?? item.designation].filter(Boolean).join(' · '),
  }))
  const current = value ? String(value) : undefined
  const fallback =
    current && !options.some((option) => option.value === current)
      ? picked?.value === current
        ? picked
        : { value: current, label: `Staff #${current}` }
      : null
  const all = fallback ? [fallback, ...options] : options

  return (
    <Combobox
      id={id}
      label={label}
      value={current}
      options={all}
      allLabel={allLabel}
      placeholder={placeholder ?? 'Choose a staff member'}
      searchPlaceholder='Search staff name or number'
      emptyText={staff.isFetching ? 'Loading…' : 'No staff found'}
      onSearch={setQuery}
      invalid={invalid}
      highlightSelected={Boolean(allLabel)}
      className={className}
      onChange={(next) => {
        setPicked(all.find((item) => item.value === next) ?? null)
        onChange(next ? Number(next) : undefined)
      }}
    />
  )
}
