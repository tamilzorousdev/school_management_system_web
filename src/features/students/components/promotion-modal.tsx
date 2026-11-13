import { useState } from 'react'
import { ArrowRight, Plus } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { setupApi, useClasses, useSections, useSetupMutation } from '@/features/setup/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import { useStudentMutation } from '../api'
import { recordsApi, usePromotionPreview, type PromotionInput } from '../records-api'

export function PromotionModal({ onClose }: { onClose: () => void }) {
  const classes = useClasses()
  const [classId, setClassId] = useState<number | null>(null)
  const [fromSectionId, setFromSectionId] = useState<number | null>(null)
  const preview = usePromotionPreview(classId, fromSectionId)
  const currentSections = useSections(classId ?? undefined, Boolean(classId))
  const [target, setTarget] = useState<{
    classId: number | null
    sectionId: number | null
    for: number | null
  }>({
    classId: null,
    sectionId: null,
    for: null,
  })
  const [detained, setDetained] = useState<number[]>([])
  const promote = useStudentMutation((input: PromotionInput) => recordsApi.promote(input))
  const data = preview.data
  const toClassId = target.for === classId ? target.classId : (data?.suggested_class?.id ?? null)
  const toSectionId = target.for === classId ? target.sectionId : null
  const nextYearId = data?.to_year.id
  const nextSections = useSections(
    toClassId ?? undefined,
    Boolean(toClassId && nextYearId),
    nextYearId
  )
  const thisYearSections = useSections(toClassId ?? undefined, Boolean(toClassId))
  const canSetUp = can(useMe().data, 'schools.manage')
  const addSections = useSetupMutation(
    (input: { classId: number; yearId: number; names: [string, string | null, number][] }) =>
      Promise.all(
        input.names.map(([name, room, capacity]) =>
          setupApi.createSection({
            class_id: input.classId,
            academic_year_id: input.yearId,
            name,
            room,
            capacity,
          })
        )
      )
  )
  const toClassName = classes.data?.find((item) => item.id === toClassId)?.name
  const noNextSections = Boolean(toClassId && nextSections.data && nextSections.data.length === 0)
  const createNextSections = async () => {
    if (!toClassId || !nextYearId) return
    const names: [string, string | null, number][] = thisYearSections.data?.length
      ? thisYearSections.data.map((item) => [item.name, item.room, item.capacity])
      : [['A', null, 40]]
    try {
      const created = await addSections.mutateAsync({
        classId: toClassId,
        yearId: nextYearId,
        names,
      })
      alerts.success(
        `Added ${created.map((item) => `Section ${item.name}`).join(', ')} to Class ${toClassName} for ${data?.to_year.name}`
      )
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }
  const waiting = data?.students.filter((student) => !student.already_moved) ?? []
  const moving = waiting.length - detained.length

  const selectedFromSectionName = currentSections.data?.find((s) => s.id === fromSectionId)?.name

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Promote to next year'
      description='Moves a class or section into the next academic year. Students who repeat stay in the same class.'
      size='xl'
      footer={
        <div className='flex w-full flex-wrap justify-end gap-2'>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!data || !toClassId || waiting.length === 0}
            loading={promote.isPending}
            onClick={async () => {
              if (!data || !toClassId) return
              try {
                const result = await promote.mutateAsync({
                  from_class_id: data.from_class.id,
                  ...(fromSectionId ? { from_section_id: fromSectionId } : {}),
                  to_class_id: toClassId,
                  ...(toSectionId ? { to_section_id: toSectionId } : {}),
                  detained_ids: detained,
                })
                alerts.success(
                  `${result.promoted} promoted${result.detained ? `, ${result.detained} repeating` : ''}${result.skipped ? `, ${result.skipped} already moved` : ''}`
                )
                onClose()
              } catch (error) {
                alerts.error(toApiError(error).message)
              }
            }}
          >
            Promote {Math.max(0, moving)} {moving === 1 ? 'student' : 'students'}
          </Button>
        </div>
      }
    >
      <div className='grid gap-4'>
        <div className='grid gap-3 sm:grid-cols-2 sm:items-start lg:grid-cols-[1fr_1fr_auto_1fr_1fr]'>
          <FormField id='promote-from-class' label='Class this year'>
            <Combobox
              id='promote-from-class'
              label='Class this year'
              value={classId ? String(classId) : undefined}
              placeholder='Choose class'
              options={(classes.data ?? []).map((item) => ({
                value: String(item.id),
                label: `Class ${item.name}`,
                hint: String(item.student_count),
              }))}
              onChange={(value) => {
                setClassId(value ? Number(value) : null)
                setFromSectionId(null)
                setDetained([])
              }}
              highlightSelected={false}
              className='sm:w-full'
            />
          </FormField>
          <FormField id='promote-from-section' label='Section this year'>
            <Combobox
              id='promote-from-section'
              label='Section this year'
              value={fromSectionId ? String(fromSectionId) : undefined}
              placeholder='All sections'
              allLabel='All sections'
              options={(currentSections.data ?? []).map((item) => ({
                value: String(item.id),
                label: `Section ${item.name}`,
                hint: `${item.student_count}/${item.capacity}`,
              }))}
              onChange={(value) => {
                setFromSectionId(value ? Number(value) : null)
                setDetained([])
              }}
              highlightSelected={false}
              className='sm:w-full'
            />
          </FormField>
          <div aria-hidden className='hidden gap-1.5 lg:grid'>
            <span className='invisible text-xs font-semibold'>to</span>
            <span className='flex h-9 items-center justify-center'>
              <ArrowRight className='size-5 text-muted-foreground' />
            </span>
          </div>
          <FormField id='promote-to' label={data ? `Class in ${data.to_year.name}` : 'Next class'}>
            <Combobox
              id='promote-to'
              label='Next class'
              value={toClassId ? String(toClassId) : undefined}
              placeholder='Choose class'
              options={(classes.data ?? []).map((item) => ({
                value: String(item.id),
                label: `Class ${item.name}`,
              }))}
              onChange={(value) =>
                setTarget({ classId: value ? Number(value) : null, sectionId: null, for: classId })
              }
              highlightSelected={false}
              className='sm:w-full'
            />
          </FormField>
          <FormField
            id='promote-section'
            label='Section next year'
            hint={
              noNextSections ? (
                canSetUp ? (
                  <Button
                    type='button'
                    variant='link'
                    size='sm'
                    className='h-auto p-0 text-xs'
                    loading={addSections.isPending}
                    onClick={() => void createNextSections()}
                  >
                    <Plus className='size-3.5' />
                    {thisYearSections.data?.length
                      ? `Add ${thisYearSections.data.map((item) => item.name).join(', ')} for ${data?.to_year.name}`
                      : `Add Section A for ${data?.to_year.name}`}
                  </Button>
                ) : (
                  `No sections in Class ${toClassName} for ${data?.to_year.name} yet`
                )
              ) : undefined
            }
          >
            <Combobox
              id='promote-section'
              label='Section next year'
              value={toSectionId ? String(toSectionId) : undefined}
              placeholder='Allocate later'
              allLabel='Allocate later'
              options={(nextSections.data ?? []).map((item) => ({
                value: String(item.id),
                label: `Section ${item.name}`,
                hint: item.room ?? undefined,
              }))}
              onChange={(value) =>
                setTarget({
                  classId: toClassId,
                  sectionId: value ? Number(value) : null,
                  for: classId,
                })
              }
              highlightSelected={false}
              className='sm:w-full'
            />
          </FormField>
        </div>

        {!classId ? (
          <p className='rounded-lg bg-muted px-3 py-6 text-center text-sm text-muted-foreground'>
            Choose a class to see its students.
          </p>
        ) : preview.isError ? (
          <ErrorState message={preview.error.message} onRetry={() => preview.refetch()} />
        ) : !data ? (
          <Skeleton className='h-48' />
        ) : (
          <>
            <div className='flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3 text-sm'>
              <div className='flex flex-wrap items-center gap-2.5'>
                <span className='font-semibold'>
                  Class {data.from_class.name}
                  {selectedFromSectionName ? ` - ${selectedFromSectionName}` : ' (All sections)'}
                </span>
                {data.pass_percent !== null && data.pass_percent !== undefined && (
                  <Badge tone={data.pass_percent >= 50 ? 'success' : 'danger'}>
                    Pass {data.pass_percent}%
                  </Badge>
                )}
                {data.average_percent !== null && data.average_percent !== undefined && (
                  <Badge tone='neutral'>Avg {data.average_percent}%</Badge>
                )}
              </div>
              <div className='text-xs text-muted-foreground'>
                {waiting.length} to promote ({detained.length} repeating)
              </div>
            </div>

            <p className='text-xs text-muted-foreground'>
              {data.from_year.name} → {data.to_year.name}. All students are selected to promote by
              default. Check a student to mark them as repeating Class {data.from_class.name}.
            </p>

            <ul className='grid max-h-80 gap-1.5 overflow-auto sm:grid-cols-2'>
              {data.students.map((student) => {
                const repeat = detained.includes(student.student_id)
                return (
                  <li key={student.student_id}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-lg border p-2.5',
                        repeat && 'border-warning/40 bg-warning/5',
                        student.already_moved && 'cursor-default opacity-60'
                      )}
                    >
                      <input
                        type='checkbox'
                        className='size-4 accent-[var(--warning)]'
                        disabled={student.already_moved}
                        checked={repeat}
                        onChange={() =>
                          setDetained((current) =>
                            repeat
                              ? current.filter((id) => id !== student.student_id)
                              : [...current, student.student_id]
                          )
                        }
                      />
                      <span className='grid min-w-0 flex-1'>
                        <span className='flex items-center gap-2 truncate font-semibold'>
                          <span className='truncate'>{student.full_name}</span>
                          {student.result_percent !== null &&
                            student.result_percent !== undefined && (
                              <Badge
                                tone={student.passed === false ? 'danger' : 'success'}
                                className='font-mono text-[10px]'
                              >
                                {student.result_percent}%
                              </Badge>
                            )}
                        </span>
                        <span className='text-xs text-muted-foreground'>
                          {student.section_name ? `Section ${student.section_name}` : 'No section'}
                          {student.roll_no ? ` · Roll ${student.roll_no}` : ''}
                        </span>
                      </span>
                      {student.already_moved ? (
                        <Badge tone='info'>Moved</Badge>
                      ) : repeat ? (
                        <Badge tone='warning'>Repeats</Badge>
                      ) : null}
                    </label>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </AppModal>
  )
}
