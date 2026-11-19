import { Combobox } from '@/components/common/combobox'
import { FilterSelect } from '@/components/common/list-toolbar'
import { useClasses, useSections, useSubjects } from '@/features/setup/api'
import { useCanPickClasses } from '../labels'

export function ClassFilter({
  value,
  onChange,
}: {
  value?: number
  onChange: (value: number | undefined) => void
}) {
  const allowed = useCanPickClasses()
  const classes = useClasses(allowed)
  if (!allowed) return null
  return (
    <FilterSelect
      id='library-class-filter'
      label='Filter by class'
      allLabel='All classes'
      value={value ? String(value) : undefined}
      options={(classes.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
      onChange={(next) => onChange(next ? Number(next) : undefined)}
    />
  )
}

export function SectionFilter({
  classId,
  value,
  onChange,
}: {
  classId?: number
  value?: number
  onChange: (value: number | undefined) => void
}) {
  const allowed = useCanPickClasses()
  const sections = useSections(classId, allowed)
  if (!allowed) return null
  return (
    <FilterSelect
      id='library-section-filter'
      label='Filter by section'
      allLabel='All sections'
      value={value ? String(value) : undefined}
      options={(sections.data ?? []).map((item) => ({
        value: String(item.id),
        label: `${item.class_name} - ${item.name}`,
      }))}
      onChange={(next) => onChange(next ? Number(next) : undefined)}
    />
  )
}

export function SectionPicker({
  id,
  value,
  onChange,
  invalid,
}: {
  id: string
  value?: number
  onChange: (value: number | undefined) => void
  invalid?: boolean
}) {
  const allowed = useCanPickClasses()
  const sections = useSections(undefined, allowed)
  return (
    <Combobox
      id={id}
      label='Section'
      placeholder='Choose a section'
      value={value ? String(value) : undefined}
      options={(sections.data ?? []).map((item) => ({
        value: String(item.id),
        label: `${item.class_name} - ${item.name}`,
        hint: String(item.student_count),
      }))}
      onChange={(next) => onChange(next ? Number(next) : undefined)}
      className='sm:w-full'
      invalid={invalid}
      highlightSelected={false}
    />
  )
}

export function ClassPicker({
  id,
  value,
  onChange,
  invalid,
}: {
  id: string
  value?: number
  onChange: (value: number | undefined) => void
  invalid?: boolean
}) {
  const allowed = useCanPickClasses()
  const classes = useClasses(allowed)
  return (
    <Combobox
      id={id}
      label='Class'
      placeholder='Choose a class'
      value={value ? String(value) : undefined}
      options={(classes.data ?? []).map((item) => ({
        value: String(item.id),
        label: item.name,
        hint: String(item.student_count),
      }))}
      onChange={(next) => onChange(next ? Number(next) : undefined)}
      className='sm:w-full'
      invalid={invalid}
      highlightSelected={false}
    />
  )
}

export function SubjectPicker({
  value,
  onChange,
}: {
  value?: number
  onChange: (value: number | undefined) => void
}) {
  const subjects = useSubjects()
  return (
    <Combobox
      id='book-subject'
      label='Subject'
      placeholder='No subject'
      allLabel='No subject'
      value={value ? String(value) : undefined}
      options={(subjects.data?.items ?? []).map((item) => ({
        value: String(item.id),
        label: item.name,
        hint: item.code,
      }))}
      onChange={(next) => onChange(next ? Number(next) : undefined)}
      className='sm:w-full'
      highlightSelected={false}
    />
  )
}
