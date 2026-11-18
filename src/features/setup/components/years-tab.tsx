import { useState } from 'react'
import { Archive, ArchiveRestore, CalendarRange, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState, ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'
import {
  setupApi,
  useAcademicYears,
  useSetupMutation,
  type AcademicYear,
  type AcademicYearStatus,
  type Term,
} from '../api'
import { fieldErrorsOf, run } from '../form-actions'
import { RootError, Section } from './setup-shared'

const YEAR_STATUS: Record<AcademicYearStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  active: { label: 'Current', tone: 'success' },
  closed: { label: 'Closed', tone: 'info' },
  archived: { label: 'Archived', tone: 'warning' },
}

const YEAR_STATUS_HINT: Record<AcademicYearStatus, string> = {
  draft: 'Not started yet.',
  active: 'The year everyone works in.',
  closed: 'Dates and fee plans are locked. Dues can still be collected.',
  archived: 'Frozen. No fee changes at all, not even payments.',
}

type YearAction = { kind: 'activate' | 'archive' | 'restore'; year: AcademicYear }

type RangeForm =
  { kind: 'year'; year?: AcademicYear } | { kind: 'term'; year: AcademicYear; term?: Term }

export function YearsTab({ canManage }: { canManage: boolean }) {
  const years = useAcademicYears()
  const [form, setForm] = useState<RangeForm | null>(null)
  const [removing, setRemoving] = useState<{
    kind: 'year' | 'term'
    id: number
    name: string
  } | null>(null)
  const [action, setAction] = useState<YearAction | null>(null)
  const changeStatus = useSetupMutation((target: YearAction) =>
    target.kind === 'activate'
      ? setupApi.activateYear(target.year.id)
      : target.kind === 'archive'
        ? setupApi.archiveYear(target.year.id)
        : setupApi.restoreYear(target.year.id)
  )
  const remove = useSetupMutation((target: { kind: 'year' | 'term'; id: number }) =>
    target.kind === 'year' ? setupApi.removeYear(target.id) : setupApi.removeTerm(target.id)
  )

  if (years.isError)
    return <ErrorState message={years.error.message} onRetry={() => years.refetch()} />
  if (!years.data) return <Skeleton className='h-72' />
  const currentName = years.data.find((year) => year.is_current)?.name

  return (
    <Section
      title='Academic years and terms'
      description='Exactly one year is current. Making a new year current closes the previous one. Classes, sections and enrolments belong to a year.'
      action={
        canManage && (
          <Button size='sm' onClick={() => setForm({ kind: 'year' })}>
            <Plus />
            Add year
          </Button>
        )
      }
    >
      {years.data.length === 0 ? (
        <EmptyState
          icon={CalendarRange}
          title='No academic year yet'
          description='Add the current year first, for example 2026-27 from June to April.'
          action={
            canManage && (
              <Button onClick={() => setForm({ kind: 'year' })}>
                <Plus />
                Add year
              </Button>
            )
          }
        />
      ) : (
        <div className='grid gap-4 lg:grid-cols-2'>
          {years.data.map((year) => (
            <article
              key={year.id}
              className={`grid content-start gap-3 rounded-xl border p-4 ${year.is_current ? 'border-primary/50 bg-primary/5' : ''}`}
            >
              <div className='flex flex-wrap items-start justify-between gap-2'>
                <div className='grid gap-0.5'>
                  <div className='flex items-center gap-2'>
                    <h3 className='text-lg font-extrabold tracking-tight'>{year.name}</h3>
                    <Badge tone={YEAR_STATUS[year.status].tone} dot={year.is_current}>
                      {YEAR_STATUS[year.status].label}
                    </Badge>
                  </div>
                  <span className='text-xs text-muted-foreground'>
                    {formatDate(year.start_date)} to {formatDate(year.end_date)} ·{' '}
                    {YEAR_STATUS_HINT[year.status]}
                  </span>
                  {year.description && <span className='text-xs'>{year.description}</span>}
                  <YearHistory year={year} />
                </div>
                {canManage && (
                  <div className='flex flex-wrap gap-1'>
                    {(year.status === 'draft' || year.status === 'closed') && (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => setAction({ kind: 'activate', year })}
                      >
                        <Star />
                        Make current
                      </Button>
                    )}
                    {year.status === 'closed' && (
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => setAction({ kind: 'archive', year })}
                      >
                        <Archive />
                        Archive
                      </Button>
                    )}
                    {year.status === 'archived' && (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => setAction({ kind: 'restore', year })}
                      >
                        <ArchiveRestore />
                        Restore
                      </Button>
                    )}
                    <Button
                      size='icon-sm'
                      variant='ghost'
                      aria-label={`Edit ${year.name}`}
                      onClick={() => setForm({ kind: 'year', year })}
                    >
                      <Pencil />
                    </Button>
                    {!year.is_current && (
                      <Button
                        size='icon-sm'
                        variant='ghost'
                        aria-label={`Delete ${year.name}`}
                        className='text-destructive hover:bg-destructive/10'
                        onClick={() => setRemoving({ kind: 'year', id: year.id, name: year.name })}
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <ul className='grid gap-1.5'>
                {year.terms.map((term) => (
                  <li
                    key={term.id}
                    className='flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm'
                  >
                    <span className='font-semibold'>{term.name}</span>
                    <span className='flex items-center gap-1'>
                      <span className='text-xs text-muted-foreground'>
                        {formatDate(term.start_date)} – {formatDate(term.end_date)}
                      </span>
                      {canManage && (
                        <>
                          <Button
                            size='icon-sm'
                            variant='ghost'
                            aria-label={`Edit ${term.name}`}
                            onClick={() => setForm({ kind: 'term', year, term })}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            size='icon-sm'
                            variant='ghost'
                            aria-label={`Delete ${term.name}`}
                            className='text-destructive hover:bg-destructive/10'
                            onClick={() =>
                              setRemoving({ kind: 'term', id: term.id, name: term.name })
                            }
                          >
                            <Trash2 />
                          </Button>
                        </>
                      )}
                    </span>
                  </li>
                ))}
                {year.terms.length === 0 && (
                  <li className='text-xs text-muted-foreground'>No terms yet.</li>
                )}
              </ul>
              {canManage && (
                <Button
                  size='sm'
                  variant='ghost'
                  className='justify-self-start'
                  onClick={() => setForm({ kind: 'term', year })}
                >
                  <Plus />
                  Add term
                </Button>
              )}
            </article>
          ))}
        </div>
      )}

      {form && <RangeModal form={form} onClose={() => setForm(null)} />}
      <ConfirmDialog
        open={Boolean(action)}
        onOpenChange={(open) => !open && setAction(null)}
        title={action ? ACTION_TEXT[action.kind].title(action.year) : ''}
        description={action ? ACTION_TEXT[action.kind].description(action.year, currentName) : ''}
        confirmText={action ? ACTION_TEXT[action.kind].confirm : ''}
        loading={changeStatus.isPending}
        onConfirm={async () => {
          if (action) {
            await run(
              () => changeStatus.mutateAsync(action),
              ACTION_TEXT[action.kind].done(action.year)
            )
          }
          setAction(null)
        }}
      />
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Delete ${removing?.name ?? ''}?`}
        description={
          removing?.kind === 'year'
            ? 'Only a year with no sections or students can be deleted.'
            : 'The term is removed from this year.'
        }
        confirmText='Delete'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          if (removing) await run(() => remove.mutateAsync(removing), `${removing.name} deleted`)
          setRemoving(null)
        }}
      />
    </Section>
  )
}

const ACTION_TEXT: Record<
  YearAction['kind'],
  {
    title: (year: AcademicYear) => string
    description: (year: AcademicYear, current?: string) => string
    confirm: string
    done: (year: AcademicYear) => string
  }
> = {
  activate: {
    title: (year) => `Make ${year.name} the current year?`,
    description: (year, current) =>
      current && current !== year.name
        ? `${current} will be closed: its dates and fee plans are locked, but its dues can still be collected. Lists across the app switch to ${year.name}.`
        : `Lists across the app switch to ${year.name}.`,
    confirm: 'Make current',
    done: (year) => `${year.name} is now the current year`,
  },
  archive: {
    title: (year) => `Archive ${year.name}?`,
    description: () =>
      'No fee changes are allowed in an archived year, not even payments of old dues. You can restore it later.',
    confirm: 'Archive',
    done: (year) => `${year.name} archived`,
  },
  restore: {
    title: (year) => `Restore ${year.name}?`,
    description: () => 'It goes back to closed: old dues can be collected again.',
    confirm: 'Restore',
    done: (year) => `${year.name} restored`,
  },
}

function YearHistory({ year }: { year: AcademicYear }) {
  const steps = [
    ['Made current', year.activated_at, year.activated_by],
    ['Closed', year.closed_at, year.closed_by],
    ['Archived', year.archived_at, year.archived_by],
  ].filter((step): step is [string, string, string | null] => Boolean(step[1]))
  if (!steps.length) return null
  return (
    <span className='text-xs text-muted-foreground'>
      {steps
        .map(([label, at, by]) => `${label} ${formatDate(at)}${by ? ` by ${by}` : ''}`)
        .join(' · ')}
    </span>
  )
}

function RangeModal({ form, onClose }: { form: RangeForm; onClose: () => void }) {
  const existing = form.kind === 'year' ? form.year : form.term
  const [name, setName] = useState(existing?.name ?? '')
  const [start, setStart] = useState(existing?.start_date ?? '')
  const [end, setEnd] = useState(existing?.end_date ?? '')
  const [description, setDescription] = useState(
    form.kind === 'year' ? (form.year?.description ?? '') : ''
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const datesLocked =
    form.kind === 'year' && (form.year?.status === 'closed' || form.year?.status === 'archived')
  const save = useSetupMutation(async () => {
    const input = { name: name.trim(), start_date: start, end_date: end }
    if (form.kind === 'year') {
      const yearInput = { ...input, description: description.trim() || null }
      return form.year
        ? setupApi.updateYear(form.year.id, yearInput)
        : setupApi.createYear(yearInput)
    }
    return form.term
      ? setupApi.updateTerm(form.term.id, input)
      : setupApi.addTerm(form.year.id, input)
  })
  const label = form.kind === 'year' ? 'academic year' : `term in ${form.year.name}`

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`${existing ? 'Edit' : 'Add'} ${label}`}
      formId='range-form'
      submitText={existing ? 'Save' : 'Add'}
      loading={save.isPending}
    >
      <form
        id='range-form'
        noValidate
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={async (event) => {
          event.preventDefault()
          const next: Record<string, string> = {}
          if (!name.trim())
            next.name =
              form.kind === 'year' ? 'Enter a name like 2026-27' : 'Enter a name like Term 1'
          if (!start) next.start_date = 'Choose the start date'
          if (!end) next.end_date = 'Choose the end date'
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
        <FormField
          id='range-name'
          label='Name'
          required
          error={errors.name}
          className='sm:col-span-2'
        >
          <Input
            id='range-name'
            autoFocus
            placeholder={form.kind === 'year' ? '2026-27' : 'Term 1'}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </FormField>
        <FormField
          id='range-start'
          label='Starts'
          required
          error={errors.start_date}
          hint={datesLocked ? 'Locked: this year is closed' : undefined}
        >
          <Input
            id='range-start'
            type='date'
            value={start}
            disabled={datesLocked}
            onChange={(event) => setStart(event.target.value)}
          />
        </FormField>
        <FormField id='range-end' label='Ends' required error={errors.end_date}>
          <Input
            id='range-end'
            type='date'
            value={end}
            disabled={datesLocked}
            onChange={(event) => setEnd(event.target.value)}
          />
        </FormField>
        {form.kind === 'year' && (
          <FormField
            id='range-description'
            label='Notes'
            error={errors.description}
            className='sm:col-span-2'
          >
            <Textarea
              id='range-description'
              rows={2}
              maxLength={300}
              value={description}
              placeholder='Optional'
              onChange={(event) => setDescription(event.target.value)}
            />
          </FormField>
        )}
      </form>
    </AppModal>
  )
}
