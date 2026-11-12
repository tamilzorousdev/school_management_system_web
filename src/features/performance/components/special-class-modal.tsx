import { useState } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Input, Textarea } from '@/components/ui/input'
import { fieldErrorsOf } from '@/features/setup/form-actions'
import { useSubjects } from '@/features/setup/api'
import { useAssignments } from '@/features/staff/api'
import { useStudents } from '@/features/students/api'
import { useBellSchedule } from '@/features/timetable/api'
import { alerts } from '@/lib/alerts'
import { cn } from '@/lib/utils'
import {
  performanceApi,
  usePerformanceMutation,
  type SpecialClass,
  type SpecialClassInput,
} from '../api'

const DAYS = [
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
]

export function SpecialClassModal({
  section,
  special,
  studentIds,
  onClose,
  onSaved,
}: {
  section: { id: number; name: string; class_id?: number }
  special?: SpecialClass
  studentIds?: number[]
  onClose: () => void
  onSaved?: () => void
}) {
  const [draft, setDraft] = useState({
    title: special?.title ?? '',
    subject_id: special?.subject ? String(special.subject.id) : '',
    teacher_user_id: special ? String(special.teacher.id) : '',
    day_of_week: special ? String(special.day_of_week) : '',
    period_no: special ? String(special.period_no) : '',
    notes: special?.notes ?? '',
  })
  const [chosen, setChosen] = useState<Set<number>>(
    new Set(special ? special.students.map((student) => student.id) : (studentIds ?? []))
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const subjects = useSubjects()
  const teachers = useAssignments({})
  const students = useStudents({ page: 1, limit: 100, section_id: section.id })
  const bells = useBellSchedule(section.class_id)
  const save = usePerformanceMutation((input: SpecialClassInput) =>
    special ? performanceApi.updateSpecial(special.id, input) : performanceApi.createSpecial(input)
  )

  const set = (field: keyof typeof draft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }
  const periods = (bells.data ?? []).filter((period) => !period.is_break && period.period_no)
  const roster = students.data?.items ?? []

  const submit = async () => {
    const missing: Record<string, string> = {}
    if (draft.title.trim().length < 2)
      missing.title = 'Give the class a name, for example Maths support'
    if (!draft.teacher_user_id) missing.teacher_user_id = 'Choose the teacher'
    if (!draft.day_of_week) missing.day_of_week = 'Choose the day'
    if (!draft.period_no) missing.period_no = 'Choose the period'
    if (!chosen.size) missing.student_ids = 'Choose at least one student'
    if (Object.keys(missing).length) return setErrors(missing)
    try {
      await save.mutateAsync({
        section_id: section.id,
        subject_id: draft.subject_id ? Number(draft.subject_id) : null,
        teacher_user_id: Number(draft.teacher_user_id),
        day_of_week: Number(draft.day_of_week),
        period_no: Number(draft.period_no),
        title: draft.title.trim(),
        notes: draft.notes.trim() || null,
        student_ids: [...chosen],
      })
      alerts.success(
        special ? 'Special class saved' : 'Special class created. Parents have been told.'
      )
      onSaved?.()
      onClose()
    } catch (error) {
      const fields = fieldErrorsOf(error)
      if (fields.root) alerts.error(fields.root)
      else setErrors(fields)
    }
  }

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={special ? `Edit ${special.title}` : `Special class for ${section.name}`}
      description='One dedicated period every week for the chosen students. The teacher must be free in that period.'
      formId='special-class-form'
      submitText={special ? 'Save' : 'Create special class'}
      loading={save.isPending}
    >
      <form
        id='special-class-form'
        noValidate
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <FormField
          id='special-title'
          label='Name'
          required
          error={errors.title}
          className='sm:col-span-2'
        >
          <Input
            id='special-title'
            value={draft.title}
            maxLength={120}
            placeholder='Maths support'
            onChange={(event) => set('title', event.target.value)}
          />
        </FormField>
        <FormField id='special-subject' label='Subject' error={errors.subject_id}>
          <Combobox
            className='sm:w-full'
            id='special-subject'
            label='Subject'
            value={draft.subject_id || undefined}
            placeholder='Any subject'
            searchPlaceholder='Search subjects'
            options={(subjects.data?.items ?? []).map((subject) => ({
              value: String(subject.id),
              label: subject.name,
              hint: subject.code,
            }))}
            onChange={(value) => set('subject_id', value ?? '')}
          />
        </FormField>
        <FormField id='special-teacher' label='Teacher' required error={errors.teacher_user_id}>
          <Combobox
            className='sm:w-full'
            id='special-teacher'
            label='Teacher'
            value={draft.teacher_user_id || undefined}
            placeholder='Choose a teacher'
            searchPlaceholder='Search teachers'
            invalid={Boolean(errors.teacher_user_id)}
            options={(teachers.data?.teachers ?? []).map((teacher) => ({
              value: String(teacher.user_id),
              label: teacher.name,
              hint: `${teacher.load_periods}/${teacher.max_periods_per_week} a week`,
            }))}
            onChange={(value) => set('teacher_user_id', value ?? '')}
          />
        </FormField>
        <FormField id='special-day' label='Day' required error={errors.day_of_week}>
          <Combobox
            className='sm:w-full'
            id='special-day'
            label='Day'
            value={draft.day_of_week || undefined}
            placeholder='Choose a day'
            invalid={Boolean(errors.day_of_week)}
            options={DAYS}
            onChange={(value) => set('day_of_week', value ?? '')}
          />
        </FormField>
        <FormField id='special-period' label='Period' required error={errors.period_no}>
          <Combobox
            className='sm:w-full'
            id='special-period'
            label='Period'
            value={draft.period_no || undefined}
            placeholder='Choose a period'
            invalid={Boolean(errors.period_no)}
            options={periods.map((period) => ({
              value: String(period.period_no),
              label: `Period ${period.period_no}`,
              hint: `${period.start_time} – ${period.end_time}`,
            }))}
            onChange={(value) => set('period_no', value ?? '')}
          />
        </FormField>
        <FormField id='special-notes' label='Notes' error={errors.notes} className='sm:col-span-2'>
          <Textarea
            id='special-notes'
            value={draft.notes}
            maxLength={500}
            rows={2}
            placeholder='What the class will cover'
            onChange={(event) => set('notes', event.target.value)}
          />
        </FormField>
        <fieldset className='grid gap-2 sm:col-span-2'>
          <legend className='mb-1 text-sm font-medium'>
            Students <span className='text-muted-foreground'>({chosen.size} chosen)</span>
          </legend>
          {errors.student_ids && (
            <p className='text-xs text-destructive' role='alert'>
              {errors.student_ids}
            </p>
          )}
          <ul className='grid max-h-56 gap-1.5 overflow-auto sm:grid-cols-2'>
            {roster.map((student) => {
              const on = chosen.has(student.id)
              return (
                <li key={student.id}>
                  <label
                    className={cn(
                      'flex cursor-pointer items-center gap-2.5 rounded-lg border p-2 text-sm',
                      on && 'border-primary/40 bg-primary/5'
                    )}
                  >
                    <input
                      type='checkbox'
                      className='size-4 accent-[var(--primary)]'
                      checked={on}
                      onChange={() => {
                        setChosen((current) => {
                          const next = new Set(current)
                          if (on) next.delete(student.id)
                          else next.add(student.id)
                          return next
                        })
                        setErrors((current) => ({ ...current, student_ids: '' }))
                      }}
                    />
                    <span className='truncate'>{student.full_name}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        </fieldset>
      </form>
    </AppModal>
  )
}
