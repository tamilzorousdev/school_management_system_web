import { useState, type FormEvent } from 'react'
import { Check, Users } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { useClasses, useSections } from '@/features/setup/api'
import { useStudents } from '@/features/students/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import { activitiesApi, useSportsOnDutyMutation } from '../api'

const COMMON_SPORTS = [
  { value: 'Football', label: 'Football' },
  { value: 'Cricket', label: 'Cricket' },
  { value: 'Basketball', label: 'Basketball' },
  { value: 'Athletics', label: 'Athletics / Track & Field' },
  { value: 'Volleyball', label: 'Volleyball' },
  { value: 'Badminton', label: 'Badminton' },
  { value: 'Chess', label: 'Chess' },
  { value: 'Table Tennis', label: 'Table Tennis' },
  { value: 'Swimming', label: 'Swimming' },
  { value: 'Kabaddi', label: 'Kabaddi' },
  { value: 'Kho Kho', label: 'Kho Kho' },
  { value: 'Other Sport', label: 'Other' },
]

export function SportsOnDutyModal({ onClose }: { onClose: () => void }) {
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedSection, setSelectedSection] = useState<string>('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([])

  const todayStr = new Date().toISOString().slice(0, 10)
  const [draft, setDraft] = useState({
    sport_name: '',
    title: '',
    from_date: todayStr,
    to_date: todayStr,
    session: 'full' as 'full' | 'morning' | 'afternoon',
    venue: '',
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const classes = useClasses()
  const sections = useSections(
    selectedClass ? Number(selectedClass) : undefined,
    Boolean(selectedClass)
  )
  const students = useStudents({
    page: 1,
    limit: 100,
    section_id: selectedSection ? Number(selectedSection) : undefined,
    status: 'active',
  })

  const save = useSportsOnDutyMutation((input: Parameters<typeof activitiesApi.createOnDuty>[0]) =>
    activitiesApi.createOnDuty(input)
  )

  const set = (field: keyof typeof draft, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '', root: '' }))
  }

  const toggleStudent = (id: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    const all = (students.data?.items ?? []).map((s) => s.id)
    setSelectedStudentIds(all)
  }

  const clearAll = () => setSelectedStudentIds([])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.sport_name.trim()) {
      setErrors((prev) => ({ ...prev, sport_name: 'Sport name is required' }))
      return
    }
    if (!draft.title.trim()) {
      setErrors((prev) => ({ ...prev, title: 'Tournament or event title is required' }))
      return
    }
    if (!draft.from_date) {
      setErrors((prev) => ({ ...prev, from_date: 'Start date is required' }))
      return
    }
    if (!draft.to_date) {
      setErrors((prev) => ({ ...prev, to_date: 'End date is required' }))
      return
    }
    if (draft.to_date < draft.from_date) {
      setErrors((prev) => ({ ...prev, to_date: 'End date cannot be before start date' }))
      return
    }
    if (!selectedStudentIds.length) {
      setErrors((prev) => ({ ...prev, students: 'Select at least one student for On Duty' }))
      return
    }

    try {
      await save.mutateAsync({
        student_ids: selectedStudentIds,
        sport_name: draft.sport_name.trim(),
        title: draft.title.trim(),
        from_date: draft.from_date,
        to_date: draft.to_date,
        session: draft.session === 'full' ? null : draft.session,
        venue: draft.venue.trim() || null,
        notes: draft.notes.trim() || null,
      })
      alerts.success(`On Duty (OD) mapped for ${selectedStudentIds.length} student(s)`)
      onClose()
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Map Sports On Duty (OD)'
      description='Students on OD automatically appear as On Duty in daily attendance and cannot be marked absent.'
      formId='sports-od-form'
      submitText='Save Sports OD'
      loading={save.isPending}
      size='lg'
    >
      <form id='sports-od-form' onSubmit={submit} className='grid gap-4'>
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField id='od-sport' label='Sport' required error={errors.sport_name}>
            <Combobox
              id='od-sport'
              label='Sport'
              placeholder='Select or type sport'
              value={draft.sport_name}
              options={COMMON_SPORTS}
              onChange={(value) => set('sport_name', value ?? '')}
              className='sm:w-full'
            />
          </FormField>
          <FormField id='od-title' label='Tournament / Event title' required error={errors.title}>
            <Input
              id='od-title'
              placeholder='e.g. Zonal Football Meet'
              value={draft.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </FormField>
        </div>

        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField id='od-from' label='From date' required error={errors.from_date}>
            <Input
              id='od-from'
              type='date'
              value={draft.from_date}
              onChange={(e) => set('from_date', e.target.value)}
            />
          </FormField>
          <FormField id='od-to' label='To date' required error={errors.to_date}>
            <Input
              id='od-to'
              type='date'
              value={draft.to_date}
              onChange={(e) => set('to_date', e.target.value)}
            />
          </FormField>
        </div>

        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField id='od-session' label='Session' hint='Full day or half day'>
            <SegmentedControl
              label='Session'
              value={draft.session}
              onChange={(value) => set('session', value)}
              options={[
                { value: 'full', label: 'Full day' },
                { value: 'morning', label: 'Morning' },
                { value: 'afternoon', label: 'Afternoon' },
              ]}
            />
          </FormField>
          <FormField id='od-venue' label='Venue (optional)'>
            <Input
              id='od-venue'
              placeholder='e.g. District Stadium'
              value={draft.venue}
              onChange={(e) => set('venue', e.target.value)}
            />
          </FormField>
        </div>

        <div className='grid gap-2 rounded-lg border p-3'>
          <div className='flex items-center justify-between'>
            <span className='flex items-center gap-2 text-sm font-semibold'>
              <Users className='size-4 text-primary' />
              Select participating students ({selectedStudentIds.length} selected)
            </span>
            <div className='flex gap-2'>
              <Button type='button' variant='ghost' size='sm' onClick={selectAll}>
                Select all
              </Button>
              <Button type='button' variant='ghost' size='sm' onClick={clearAll}>
                Clear
              </Button>
            </div>
          </div>

          <div className='grid gap-2 sm:grid-cols-2'>
            <Combobox
              id='filter-class'
              label='Class'
              placeholder='All classes'
              allLabel='All classes'
              value={selectedClass || undefined}
              options={(classes.data ?? []).map((c) => ({
                value: String(c.id),
                label: `Class ${c.name}`,
              }))}
              onChange={(v) => {
                setSelectedClass(v ?? '')
                setSelectedSection('')
              }}
              className='sm:w-full'
            />
            <Combobox
              id='filter-section'
              label='Section'
              placeholder='All sections'
              allLabel='All sections'
              value={selectedSection || undefined}
              options={(sections.data ?? []).map((s) => ({
                value: String(s.id),
                label: `Section ${s.name}`,
              }))}
              onChange={(v) => setSelectedSection(v ?? '')}
              className='sm:w-full'
            />
          </div>

          {errors.students && <p className='text-xs text-destructive'>{errors.students}</p>}

          <div className='max-h-48 divide-y overflow-y-auto rounded-md border'>
            {(students.data?.items ?? []).length === 0 ? (
              <p className='p-3 text-center text-xs text-muted-foreground'>
                No students found for this class/section.
              </p>
            ) : (
              (students.data?.items ?? []).map((student) => {
                const picked = selectedStudentIds.includes(student.id)
                return (
                  <button
                    key={student.id}
                    type='button'
                    onClick={() => toggleStudent(student.id)}
                    className={cn(
                      'flex w-full items-center justify-between p-2 text-left text-xs transition-colors hover:bg-muted/50',
                      picked && 'bg-primary/5 font-semibold text-primary'
                    )}
                  >
                    <div className='grid min-w-0'>
                      <span className='truncate'>{student.full_name}</span>
                      <span className='font-mono text-[11px] text-muted-foreground'>
                        {student.admission_no} · Class {student.class?.name ?? '—'}{' '}
                        {student.section?.name ?? ''}
                      </span>
                    </div>
                    {picked && <Check className='size-4 shrink-0 text-primary' />}
                  </button>
                )
              })
            )}
          </div>
        </div>

        <FormField id='od-notes' label='Notes / Remarks (optional)'>
          <Textarea
            id='od-notes'
            rows={2}
            placeholder='Additional details about this tournament or team...'
            value={draft.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
