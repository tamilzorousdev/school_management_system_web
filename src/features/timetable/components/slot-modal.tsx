import { useState } from 'react'
import { Eraser } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Kbd } from '@/components/shortcuts/kbd'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { useSubjects, useTeachers } from '@/features/setup/api'
import { fieldErrorsOf } from '@/features/setup/form-actions'
import {
  timetableApi,
  useTimetableMutation,
  type BellPeriod,
  type SectionTimetable,
  type Slot,
  type SlotInput,
} from '../api'
import { dayLabel } from '../labels'

export interface SlotTarget {
  day: number
  period: BellPeriod
  slot?: Slot
}

const ASSIGNED = 'assigned'
const NONE = 'none'

export function SlotModal({
  timetable,
  target,
  onClose,
}: {
  timetable: SectionTimetable
  target: SlotTarget
  onClose: () => void
}) {
  const sectionId = timetable.section.id
  const periodNo = target.period.period_no!
  const teachers = useTeachers()
  const allSubjects = useSubjects()
  const planFor = (subjectId: number | undefined) =>
    timetable.plan.find((item) => item.subject.id === subjectId)

  const initialTeacher = () => {
    const slot = target.slot
    if (!slot) return ASSIGNED
    if (!slot.teacher) return NONE
    return planFor(slot.subject.id)?.teacher?.id === slot.teacher.id
      ? ASSIGNED
      : String(slot.teacher.id)
  }

  const [subjectId, setSubjectId] = useState<number | undefined>(target.slot?.subject.id)
  const [teacher, setTeacher] = useState(initialTeacher)
  const [room, setRoom] = useState(
    target.slot?.room && target.slot.room !== timetable.room ? target.slot.room : ''
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useTimetableMutation((input: SlotInput) => timetableApi.setSlot(sectionId, input))
  const clear = useTimetableMutation(() => timetableApi.clearSlot(sectionId, target.day, periodNo))
  const busy = save.isPending || clear.isPending
  const assigned = planFor(subjectId)?.teacher

  const fail = (error: unknown) => {
    const fields = fieldErrorsOf(error)
    if (fields.root) alerts.error(fields.root)
    else setErrors(fields)
  }

  const submit = async () => {
    if (!subjectId) {
      setErrors({ subject_id: 'Choose a subject' })
      return
    }
    setErrors({})
    try {
      await save.mutateAsync({
        day_of_week: target.day,
        period_no: periodNo,
        subject_id: subjectId,
        ...(teacher === ASSIGNED
          ? {}
          : { teacher_user_id: teacher === NONE ? null : Number(teacher) }),
        ...(room.trim() ? { room: room.trim() } : {}),
      })
      alerts.success('Period saved')
      onClose()
    } catch (error) {
      fail(error)
    }
  }

  const clearSlot = async () => {
    try {
      await clear.mutateAsync(undefined)
      alerts.success('Period cleared')
      onClose()
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`${dayLabel(target.day)} · ${target.period.name}`}
      description={`Class ${timetable.section.name} · ${target.period.start_time} to ${target.period.end_time}`}
      formId='slot-form'
      loading={busy}
      footer={
        <DialogFooter className='sm:justify-between'>
          {target.slot ? (
            <Button
              variant='outline'
              className='text-destructive hover:bg-destructive/10'
              onClick={() => void clearSlot()}
              loading={clear.isPending}
              disabled={save.isPending}
            >
              <Eraser />
              Clear period
            </Button>
          ) : (
            <span />
          )}
          <div className='flex flex-col-reverse gap-2 sm:flex-row'>
            <Button variant='outline' onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button
              type='submit'
              form='slot-form'
              loading={save.isPending}
              disabled={clear.isPending}
            >
              Save period
              <Kbd id='modal.submit' inverted />
            </Button>
          </div>
        </DialogFooter>
      }
    >
      <form
        id='slot-form'
        noValidate
        className='grid gap-4'
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <FormField id='slot-subject' label='Subject' required error={errors.subject_id}>
          <Combobox
            id='slot-subject'
            label='Subject'
            value={subjectId ? String(subjectId) : undefined}
            placeholder='Choose subject'
            searchPlaceholder='Search subjects'
            options={withCurrent(
              subjectOptions(timetable, allSubjects.data?.items ?? []),
              target.slot
                ? {
                    value: String(target.slot.subject.id),
                    label: `${target.slot.subject.name} (${target.slot.subject.code})`,
                    hint: 'Current',
                  }
                : null
            )}
            emptyText='No subjects yet. Add them in School setup → Subjects.'
            onChange={(value) => setSubjectId(value ? Number(value) : undefined)}
            invalid={Boolean(errors.subject_id)}
            highlightSelected={false}
            className='sm:w-full'
          />
        </FormField>
        <FormField
          id='slot-teacher'
          label='Teacher'
          error={errors.teacher_user_id}
          hint='Assigned teacher comes from Teacher assignments'
        >
          <Combobox
            id='slot-teacher'
            label='Teacher'
            value={teacher}
            placeholder='Choose teacher'
            searchPlaceholder='Search teachers'
            options={[
              {
                value: ASSIGNED,
                label: assigned ? `Assigned teacher (${assigned.name})` : 'Assigned teacher',
              },
              { value: NONE, label: 'No teacher' },
              ...withCurrent(
                (teachers.data ?? []).map((item) => ({
                  value: String(item.id),
                  label: item.name,
                })),
                target.slot?.teacher
                  ? { value: String(target.slot.teacher.id), label: target.slot.teacher.name }
                  : null
              ),
            ]}
            onChange={(value) => setTeacher(value ?? ASSIGNED)}
            invalid={Boolean(errors.teacher_user_id)}
            highlightSelected={false}
            className='sm:w-full'
          />
        </FormField>
        <FormField
          id='slot-room'
          label='Room'
          error={errors.room}
          hint={timetable.room ? `Leave empty to use ${timetable.room}` : 'Optional'}
        >
          <Input
            id='slot-room'
            maxLength={20}
            placeholder={timetable.room ?? 'Lab 1'}
            value={room}
            aria-invalid={Boolean(errors.room) || undefined}
            onChange={(event) => setRoom(event.target.value)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}

function subjectOptions(
  timetable: SectionTimetable,
  subjects: { id: number; code: string; name: string }[]
) {
  const planned = new Set(timetable.plan.map((item) => item.subject.id))
  return [
    ...timetable.plan.map((item) => ({
      value: String(item.subject.id),
      label: `${item.subject.name} (${item.subject.code})`,
      hint: `${item.scheduled}/${item.required}`,
    })),
    ...subjects
      .filter((subject) => !planned.has(subject.id))
      .map((subject) => ({
        value: String(subject.id),
        label: `${subject.name} (${subject.code})`,
        hint: 'Not in class plan',
      })),
  ]
}

function withCurrent<T extends { value: string }>(options: T[], current: T | null): T[] {
  if (!current || options.some((option) => option.value === current.value)) return options
  return [current, ...options]
}
