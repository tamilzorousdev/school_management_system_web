import { useState } from 'react'
import { Combobox } from '@/components/common/combobox'
import { useDebouncedValue } from '@/hooks/use-debounce'
import { usePeople, type MemberType, type Person } from '../api'
import { MEMBER_TYPE } from '../labels'

const personKey = (person: Person) =>
  person.student_id ? `s${person.student_id}` : `u${person.user_id}`

export function PersonSearch({
  id,
  onSelect,
  memberType,
  placeholder = 'Find a student or staff member',
  className,
}: {
  id: string
  onSelect: (person: Person) => void
  memberType?: MemberType
  placeholder?: string
  className?: string
}) {
  const [query, setQuery] = useState('')
  const debounced = useDebouncedValue(query.trim(), 300)
  const people = usePeople(debounced, memberType)
  const items = people.data ?? []

  return (
    <Combobox
      id={id}
      label='Find a person'
      placeholder={placeholder}
      searchPlaceholder='Name, admission no, employee no or mobile'
      options={items.map((person) => ({
        value: personKey(person),
        label: `${person.name}${person.detail ? ` · ${person.detail}` : ''}`,
        hint: person.card_no ?? `${MEMBER_TYPE[person.member_type]} · not a member`,
      }))}
      onSearch={setQuery}
      onChange={(value) => {
        const person = items.find((item) => personKey(item) === value)
        if (person) onSelect(person)
      }}
      emptyText={people.isFetching ? 'Searching…' : 'Type a name or number'}
      highlightSelected={false}
      className={className}
    />
  )
}
