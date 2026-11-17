import { useState } from 'react'
import {
  AlertTriangle,
  Award,
  EyeOff,
  Gavel,
  MessageSquareWarning,
  NotebookPen,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState, ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useStudentMutation } from '../api'
import {
  recordsApi,
  useBehaviour,
  type BehaviourCategory,
  type BehaviourInput,
  type BehaviourNote,
} from '../records-api'

const CATEGORIES: Record<
  BehaviourCategory,
  { label: string; tone: BadgeTone; icon: LucideIcon; ring: string }
> = {
  appreciation: {
    label: 'Appreciation',
    tone: 'success',
    icon: Award,
    ring: 'bg-success/10 text-success',
  },
  concern: {
    label: 'Concern',
    tone: 'warning',
    icon: MessageSquareWarning,
    ring: 'bg-warning/10 text-warning',
  },
  incident: {
    label: 'Incident',
    tone: 'danger',
    icon: AlertTriangle,
    ring: 'bg-destructive/10 text-destructive',
  },
  disciplinary: {
    label: 'Disciplinary',
    tone: 'danger',
    icon: Gavel,
    ring: 'bg-destructive/10 text-destructive',
  },
}

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

export function BehaviourTab({ studentId, canManage }: { studentId: number; canManage: boolean }) {
  const notes = useBehaviour(studentId)
  const [editing, setEditing] = useState<BehaviourNote | 'new' | null>(null)
  const [removing, setRemoving] = useState<BehaviourNote | null>(null)
  const remove = useStudentMutation((id: number) => recordsApi.removeBehaviour(studentId, id))

  if (notes.isError)
    return <ErrorState message={notes.error.message} onRetry={() => notes.refetch()} />
  if (!notes.data) return <Skeleton className='h-60' />

  return (
    <div className='grid gap-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <p className='text-sm text-muted-foreground'>
          Parents see these notes in the Parent app unless a note is marked staff only.
        </p>
        {canManage && (
          <Button size='sm' onClick={() => setEditing('new')}>
            <Plus />
            Add note
          </Button>
        )}
      </div>
      {notes.data.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title='No notes yet'
          description='Record appreciation as well as concerns. Teachers can add notes from the Staff app.'
          className='border-dashed'
        />
      ) : (
        <ol className='relative grid gap-3 before:absolute before:top-2 before:bottom-2 before:left-[19px] before:w-px before:bg-border'>
          {notes.data.map((note) => {
            const category = CATEGORIES[note.category]
            return (
              <li key={note.id} className='relative flex gap-3'>
                <span
                  className={cn(
                    'z-10 grid size-10 shrink-0 place-items-center rounded-full border-4 border-background',
                    category.ring
                  )}
                >
                  <category.icon className='size-4' />
                </span>
                <div className='grid min-w-0 flex-1 gap-1 rounded-xl border p-3'>
                  <div className='flex flex-wrap items-center gap-1.5'>
                    <span className='font-semibold'>{note.title}</span>
                    <Badge tone={category.tone}>{category.label}</Badge>
                    {!note.visible_to_parent && (
                      <Badge tone='neutral'>
                        <EyeOff className='size-3' />
                        Staff only
                      </Badge>
                    )}
                  </div>
                  {note.details && <p className='text-sm'>{note.details}</p>}
                  {note.action_taken && (
                    <p className='text-sm text-muted-foreground'>
                      <span className='font-semibold text-foreground'>Action:</span>{' '}
                      {note.action_taken}
                    </p>
                  )}
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <span className='text-xs text-muted-foreground'>
                      {formatDate(note.noted_on)}
                      {note.recorded_by ? ` · ${note.recorded_by.name}` : ''}
                    </span>
                    {canManage && (
                      <span className='flex gap-1'>
                        <Button
                          size='icon-sm'
                          variant='ghost'
                          aria-label={`Edit ${note.title}`}
                          onClick={() => setEditing(note)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          size='icon-sm'
                          variant='ghost'
                          aria-label={`Delete ${note.title}`}
                          className='text-destructive hover:bg-destructive/10'
                          onClick={() => setRemoving(note)}
                        >
                          <Trash2 />
                        </Button>
                      </span>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      )}
      {editing && (
        <NoteModal
          studentId={studentId}
          note={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title='Delete this note?'
        description='Parents will no longer see it.'
        confirmText='Delete'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          if (!removing) return
          try {
            await remove.mutateAsync(removing.id)
            alerts.success('Note deleted')
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
          setRemoving(null)
        }}
      />
    </div>
  )
}

function NoteModal({
  studentId,
  note,
  onClose,
}: {
  studentId: number
  note?: BehaviourNote
  onClose: () => void
}) {
  const [draft, setDraft] = useState({
    category: note?.category ?? ('appreciation' as BehaviourCategory),
    title: note?.title ?? '',
    details: note?.details ?? '',
    action_taken: note?.action_taken ?? '',
    noted_on: note?.noted_on ?? today(),
    visible_to_parent: note?.visible_to_parent ?? true,
  })
  const [error, setError] = useState<string | null>(null)
  const save = useStudentMutation((input: BehaviourInput) =>
    note
      ? recordsApi.updateBehaviour(studentId, note.id, input)
      : recordsApi.addBehaviour(studentId, input)
  )

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={note ? 'Edit note' : 'Add behaviour note'}
      formId='behaviour-form'
      submitText='Save'
      loading={save.isPending}
      size='lg'
    >
      <form
        id='behaviour-form'
        noValidate
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={async (event) => {
          event.preventDefault()
          if (draft.title.trim().length < 3) {
            setError('Write a short title, at least 3 letters')
            return
          }
          try {
            await save.mutateAsync({
              category: draft.category,
              title: draft.title.trim(),
              details: draft.details.trim() || null,
              action_taken: draft.action_taken.trim() || null,
              noted_on: draft.noted_on,
              visible_to_parent: draft.visible_to_parent,
            })
            alerts.success('Note saved')
            onClose()
          } catch (caught) {
            setError(toApiError(caught).message)
          }
        }}
      >
        <FormField id='note-category' label='Type' className='sm:col-span-2'>
          <SegmentedControl
            label='Note type'
            value={draft.category}
            onChange={(value) => setDraft({ ...draft, category: value as BehaviourCategory })}
            options={(Object.keys(CATEGORIES) as BehaviourCategory[]).map((value) => ({
              value,
              label: CATEGORIES[value].label,
            }))}
          />
        </FormField>
        <FormField
          id='note-title'
          label='What happened'
          required
          error={error ?? undefined}
          className='sm:col-span-2'
        >
          <Input
            id='note-title'
            autoFocus
            maxLength={120}
            placeholder='Helped a classmate with maths'
            value={draft.title}
            onChange={(event) => {
              setDraft({ ...draft, title: event.target.value })
              setError(null)
            }}
          />
        </FormField>
        <FormField id='note-details' label='Details' className='sm:col-span-2'>
          <Input
            id='note-details'
            maxLength={1000}
            value={draft.details}
            onChange={(event) => setDraft({ ...draft, details: event.target.value })}
          />
        </FormField>
        <FormField id='note-action' label='Action taken'>
          <Input
            id='note-action'
            placeholder='Spoke to the parent'
            value={draft.action_taken}
            onChange={(event) => setDraft({ ...draft, action_taken: event.target.value })}
          />
        </FormField>
        <FormField id='note-date' label='Date'>
          <Input
            id='note-date'
            type='date'
            max={today()}
            value={draft.noted_on}
            onChange={(event) => setDraft({ ...draft, noted_on: event.target.value })}
          />
        </FormField>
        <label className='flex items-center justify-between gap-3 rounded-lg border p-3 sm:col-span-2'>
          <span className='grid'>
            <span className='text-sm font-semibold'>Parents can see it</span>
            <span className='text-xs text-muted-foreground'>
              Turn off for notes meant only for staff
            </span>
          </span>
          <Switch
            checked={draft.visible_to_parent}
            onCheckedChange={(value) => setDraft({ ...draft, visible_to_parent: value })}
            aria-label='Parents can see it'
          />
        </label>
      </form>
    </AppModal>
  )
}
