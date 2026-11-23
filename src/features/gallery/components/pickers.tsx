import { useState } from 'react'
import { Combobox, type ComboboxOption } from '@/components/common/combobox'
import { useDebouncedValue } from '@/hooks/use-debounce'
import { can, useMe } from '@/features/auth/api'
import { useAlbums, useUserOptions } from '../api'
import { scopeLabel } from '../labels'

function withSelected(options: ComboboxOption[], value?: string, label?: string) {
  if (!value || options.some((option) => option.value === value)) return options
  return [{ value, label: label ?? `#${value}` }, ...options]
}

export function AlbumPicker({
  id,
  label,
  value,
  onChange,
  excludeId,
  invalid,
  selectedLabel,
  className,
}: {
  id: string
  label: string
  value?: number
  onChange: (value: number | undefined, title?: string) => void
  excludeId?: number
  invalid?: boolean
  selectedLabel?: string
  className?: string
}) {
  const [query, setQuery] = useState('')
  const search = useDebouncedValue(query.trim(), 300)
  const albums = useAlbums({ page: 1, limit: 20, search: search || undefined })
  const items = (albums.data?.items ?? []).filter((album) => album.id !== excludeId)
  const options = withSelected(
    items.map((album) => ({
      value: String(album.id),
      label: album.title,
      hint: scopeLabel(album),
    })),
    value ? String(value) : undefined,
    selectedLabel
  )
  return (
    <Combobox
      id={id}
      label={label}
      value={value ? String(value) : undefined}
      options={options}
      placeholder='Choose an album'
      searchPlaceholder='Search albums'
      emptyText={albums.isFetching ? 'Loading albums…' : 'No albums found'}
      onSearch={setQuery}
      invalid={invalid}
      className={className ?? 'sm:w-full'}
      onChange={(next) =>
        onChange(
          next ? Number(next) : undefined,
          items.find((album) => String(album.id) === next)?.title
        )
      }
    />
  )
}

export function UserFilter({
  id,
  label,
  allLabel,
  value,
  onChange,
}: {
  id: string
  label: string
  allLabel: string
  value?: number
  onChange: (value: number | undefined) => void
}) {
  const me = useMe().data
  const allowed = can(me, 'users.view')
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<string | undefined>()
  const search = useDebouncedValue(query.trim(), 300)
  const users = useUserOptions(search, allowed)
  if (!allowed) return null
  const items = users.data?.items ?? []
  const options = withSelected(
    items.map((user) => ({ value: String(user.id), label: user.name, hint: user.mobile })),
    value ? String(value) : undefined,
    picked
  )
  return (
    <Combobox
      id={id}
      label={label}
      value={value ? String(value) : undefined}
      options={options}
      allLabel={allLabel}
      placeholder={allLabel}
      searchPlaceholder='Search name or mobile'
      onSearch={setQuery}
      onChange={(next) => {
        setPicked(items.find((user) => String(user.id) === next)?.name)
        onChange(next ? Number(next) : undefined)
      }}
    />
  )
}
