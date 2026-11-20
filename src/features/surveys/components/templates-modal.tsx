import { useState } from 'react'
import { ArrowLeft, FileStack, Pencil, Plus, Trash2 } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState, ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { surveysApi, useSurveyMutation, useSurveyTemplates, type SurveyTemplate } from '../api'
import {
  draftErrors,
  fieldMap,
  fromQuestions,
  toQuestionInputs,
  type SurveyDraft,
} from '../builder'
import { QuestionEditor } from './question-editor'

interface Editing {
  id: number | null
  draft: SurveyDraft
}

export function TemplatesModal({
  current,
  onClose,
}: {
  current?: SurveyDraft
  onClose: () => void
}) {
  const templates = useSurveyTemplates(true)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [removing, setRemoving] = useState<SurveyTemplate | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const create = useSurveyMutation(surveysApi.createTemplate)
  const update = useSurveyMutation(surveysApi.updateTemplate)
  const remove = useSurveyMutation(surveysApi.removeTemplate)

  const run = async <T,>(work: () => Promise<{ message: string; data: T }>) => {
    try {
      const result = await work()
      alerts.success(result.message)
      return true
    } catch (error) {
      const apiError = toApiError(error)
      setErrors(fieldMap(apiError.fieldErrors))
      alerts.error(apiError.message)
      return false
    }
  }

  const save = async () => {
    if (!editing) return
    const next = draftErrors(editing.draft, true)
    setErrors(next)
    if (Object.keys(next).length) return
    const input = {
      title: editing.draft.title.trim(),
      description: editing.draft.description.trim(),
      questions: toQuestionInputs(editing.draft.questions),
    }
    const done = await run(() =>
      editing.id ? update.mutateAsync({ id: editing.id, ...input }) : create.mutateAsync(input)
    )
    if (done) setEditing(null)
  }

  const open = (template: SurveyTemplate | null, draft?: SurveyDraft) => {
    setErrors({})
    setEditing({
      id: template?.id ?? null,
      draft: template
        ? {
            title: template.title,
            description: template.description ?? '',
            questions: fromQuestions(template.questions),
          }
        : (draft ?? { title: '', description: '', questions: [] }),
    })
  }

  const setDraft = (patch: Partial<SurveyDraft>) => {
    setEditing((value) => (value ? { ...value, draft: { ...value.draft, ...patch } } : value))
    setErrors({})
  }

  return (
    <>
      <AppModal
        open
        onOpenChange={(isOpen) => !isOpen && onClose()}
        title={
          editing
            ? editing.id
              ? 'Edit ready-made form'
              : 'New ready-made form'
            : 'Ready-made forms'
        }
        description={
          editing
            ? 'Anyone building a form can start from it.'
            : 'Forms the school starts from. Switch off the ones you do not use.'
        }
        size='lg'
        formId={editing ? 'survey-template-form' : undefined}
        submitText='Save ready-made form'
        loading={create.isPending || update.isPending}
      >
        {editing ? (
          <form
            id='survey-template-form'
            className='grid gap-4'
            onSubmit={(event) => {
              event.preventDefault()
              void save()
            }}
          >
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='justify-self-start'
              onClick={() => setEditing(null)}
            >
              <ArrowLeft />
              All ready-made forms
            </Button>
            <FormField id='tpl-title' label='Title' required error={errors.title}>
              <Input
                id='tpl-title'
                value={editing.draft.title}
                maxLength={150}
                onChange={(event) => setDraft({ title: event.target.value })}
              />
            </FormField>
            <FormField id='tpl-description' label='Description' error={errors.description}>
              <Textarea
                id='tpl-description'
                rows={2}
                maxLength={1000}
                value={editing.draft.description}
                onChange={(event) => setDraft({ description: event.target.value })}
              />
            </FormField>
            <QuestionEditor
              questions={editing.draft.questions}
              onChange={(questions) => setDraft({ questions })}
              errors={errors}
            />
          </form>
        ) : templates.isPending ? (
          <div className='grid gap-2'>
            {[0, 1, 2].map((row) => (
              <Skeleton key={row} className='h-14 w-full' />
            ))}
          </div>
        ) : templates.error ? (
          <ErrorState message={templates.error.message} onRetry={() => void templates.refetch()} />
        ) : (
          <div className='grid gap-3'>
            <div className='flex flex-wrap gap-2'>
              <Button type='button' variant='outline' size='sm' onClick={() => open(null)}>
                <Plus />
                New ready-made form
              </Button>
              {current && current.questions.length > 0 && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => open(null, current)}
                >
                  <FileStack />
                  Save this form as ready-made
                </Button>
              )}
            </div>
            {templates.data?.length ? (
              <ul className='grid divide-y rounded-lg border'>
                {templates.data.map((template) => (
                  <li key={template.id} className='flex flex-wrap items-center gap-3 p-3'>
                    <span className='grid min-w-0 flex-1'>
                      <span className='truncate font-semibold'>{template.title}</span>
                      <span className='text-xs text-muted-foreground'>
                        {template.questions.length}{' '}
                        {template.questions.length === 1 ? 'question' : 'questions'}
                      </span>
                    </span>
                    <label className='flex items-center gap-2 text-xs'>
                      <Switch
                        checked={template.is_active}
                        aria-label={`${template.title} is on`}
                        onCheckedChange={(is_active) =>
                          void run(() => update.mutateAsync({ id: template.id, is_active }))
                        }
                      />
                      {template.is_active ? 'On' : 'Off'}
                    </label>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon-sm'
                      aria-label={`Edit ${template.title}`}
                      onClick={() => open(template)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon-sm'
                      aria-label={`Remove ${template.title}`}
                      className='text-destructive hover:text-destructive'
                      onClick={() => setRemoving(template)}
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={FileStack}
                title='No ready-made forms'
                description='Add one to give everyone a head start.'
              />
            )}
          </div>
        )}
      </AppModal>
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(isOpen) => !isOpen && setRemoving(null)}
        title='Remove this ready-made form?'
        description={`"${removing?.title ?? ''}" will no longer be offered. Forms already made from it stay as they are.`}
        confirmText='Remove'
        destructive
        loading={remove.isPending}
        onConfirm={() =>
          removing && void run(() => remove.mutateAsync(removing.id)).then(() => setRemoving(null))
        }
      />
    </>
  )
}
