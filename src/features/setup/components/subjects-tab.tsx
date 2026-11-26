import { useState } from 'react'
import { BookOpen, PenLine, Plus, Trash } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState, ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { SearchBox } from '@/components/common/list-toolbar'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { setupApi, useSetupMutation, useSubjects, type Subject, type SubjectType } from '../api'
import { fieldErrorsOf, run } from '../form-actions'
import { RootError, Section } from './setup-shared'

const TYPES: Record<SubjectType, { label: string; tone: BadgeTone }> = {
  theory: { label: 'Theory', tone: 'info' },
  practical: { label: 'Practical', tone: 'success' },
  language: { label: 'Language', tone: 'warning' },
  activity: { label: 'Activity', tone: 'neutral' },
}

export function SubjectsTab({ canManage }: { canManage: boolean }) {
  const [search, setSearch] = useState('')
  const subjects = useSubjects(search || undefined)
  const [editing, setEditing] = useState<Subject | 'new' | null>(null)
  const [removing, setRemoving] = useState<Subject | null>(null)
  const remove = useSetupMutation((id: number) => setupApi.removeSubject(id))

  return (
    <Section
      title='Subjects'
      description='Choose which subjects each class takes from the book icon in Classes.'
      action={
        canManage && (
          <Button size='sm' variant='primary' onClick={() => setEditing('new')}>
            <Plus className='size-4 stroke-[1.75]' />
            Add subject
          </Button>
        )
      }
    >
      <div className='mb-4'>
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder='Search subjects'
          label='Search subjects'
        />
      </div>
      {subjects.isError ? (
        <ErrorState message={subjects.error.message} onRetry={() => subjects.refetch()} />
      ) : !subjects.data ? (
        <Skeleton className='h-48' />
      ) : subjects.data.items.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={search ? 'No subject matches' : 'No subjects yet'}
          description='Add English, Tamil, Mathematics and the rest.'
        />
      ) : (
        <ul className='grid gap-2 sm:grid-cols-2 xl:grid-cols-3'>
          {subjects.data.items.map((subject) => (
            <li
              key={subject.id}
              className='flex items-center gap-3 rounded-xl border border-[#EDF0EE] bg-white p-3 dark:border-slate-800 dark:bg-slate-900'
            >
              <span className='grid size-10 shrink-0 place-items-center rounded-lg bg-[#EAF7F0] font-mono text-[11.5px] font-bold text-[#127D48] dark:bg-emerald-950/50 dark:text-emerald-300'>
                {subject.code.slice(0, 4)}
              </span>
              <span className='grid min-w-0 flex-1'>
                <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
                  {subject.name}
                </span>
                <span className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
                  {subject.class_count} {subject.class_count === 1 ? 'class' : 'classes'}
                </span>
              </span>
              <Badge tone={TYPES[subject.type].tone}>{TYPES[subject.type].label}</Badge>
              {canManage && (
                <span className='flex items-center gap-1.5'>
                  <Button
                    size='icon-sm'
                    variant='outline'
                    aria-label={`Edit ${subject.name}`}
                    title='Edit'
                    className='border-[#EDF0EE] bg-white text-[#3C4440] hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                    onClick={() => setEditing(subject)}
                  >
                    <PenLine className='size-4 stroke-[1.75]' />
                  </Button>
                  {subject.class_count === 0 && (
                    <Button
                      size='icon-sm'
                      variant='outline'
                      aria-label={`Delete ${subject.name}`}
                      title='Delete'
                      className='border-[#EDF0EE] bg-white text-[#D92D20] hover:bg-red-50 dark:border-slate-800 dark:bg-slate-900'
                      onClick={() => setRemoving(subject)}
                    >
                      <Trash className='size-4 stroke-[1.75]' />
                    </Button>
                  )}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <SubjectModal
          subject={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Delete ${removing?.name ?? ''}?`}
        description='Only subjects that no class uses can be deleted.'
        confirmText='Delete'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          if (removing) await run(() => remove.mutateAsync(removing.id), `${removing.name} deleted`)
          setRemoving(null)
        }}
      />
    </Section>
  )
}

function SubjectModal({ subject, onClose }: { subject?: Subject; onClose: () => void }) {
  const [code, setCode] = useState(subject?.code ?? '')
  const [name, setName] = useState(subject?.name ?? '')
  const [type, setType] = useState<SubjectType>(subject?.type ?? 'theory')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useSetupMutation(() => {
    const input = { code: code.trim().toUpperCase(), name: name.trim(), type }
    return subject ? setupApi.updateSubject(subject.id, input) : setupApi.createSubject(input)
  })
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={subject ? `Edit ${subject.name}` : 'Add subject'}
      formId='subject-form'
      submitText={subject ? 'Save' : 'Add subject'}
      loading={save.isPending}
    >
      <form
        id='subject-form'
        noValidate
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={async (event) => {
          event.preventDefault()
          const next: Record<string, string> = {}
          if (!/^[A-Za-z0-9_-]{2,20}$/.test(code.trim()))
            next.code = 'Use 2 to 20 letters or digits, for example MATH'
          if (name.trim().length < 2) next.name = 'Enter the subject name'
          setErrors(next)
          if (Object.keys(next).length) return
          try {
            await save.mutateAsync(undefined)
            onClose()
          } catch (error) {
            setErrors(fieldErrorsOf(error))
          }
        }}
      >
        <RootError message={errors.root} />
        <FormField id='subject-name' label='Name' required error={errors.name}>
          <Input
            id='subject-name'
            autoFocus
            placeholder='Mathematics'
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </FormField>
        <FormField id='subject-code' label='Code' required error={errors.code}>
          <Input
            id='subject-code'
            className='font-mono uppercase'
            placeholder='MATH'
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
        </FormField>
        <FormField id='subject-type' label='Type' className='sm:col-span-2'>
          <Combobox
            id='subject-type'
            label='Type'
            value={type}
            placeholder='Choose type'
            options={(Object.keys(TYPES) as SubjectType[]).map((value) => ({
              value,
              label: TYPES[value].label,
            }))}
            onChange={(value) => setType((value ?? 'theory') as SubjectType)}
            highlightSelected={false}
            className='sm:w-full'
          />
        </FormField>
      </form>
    </AppModal>
  )
}
