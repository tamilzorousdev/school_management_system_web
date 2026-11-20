import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { ArrowLeft, BarChart3, FileStack, Lock, Save, Send } from 'lucide-react'
import { Combobox } from '@/components/common/combobox'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Page, PageHeader } from '@/components/common/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  surveysApi,
  useSurvey,
  useSurveyMutation,
  useSurveyTemplates,
  type Survey,
  type SurveyTemplate,
} from '../api'
import {
  draftErrors,
  emptyDraft,
  fieldMap,
  fromQuestions,
  toQuestionInputs,
  type SurveyDraft,
} from '../builder'
import { PhonePreview } from '../components/phone-preview'
import { QuestionEditor } from '../components/question-editor'
import { SendModal } from '../components/send-modal'
import { TemplatesModal } from '../components/templates-modal'
import { STATUS } from '../labels'

const draftOf = (survey?: Survey): SurveyDraft =>
  survey
    ? {
        title: survey.title,
        description: survey.description ?? '',
        questions: fromQuestions(survey.questions),
      }
    : emptyDraft

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className='flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm'>
      <Lock className='mt-0.5 size-4 shrink-0 text-warning' />
      <span>{children}</span>
    </p>
  )
}

function Builder({ survey, sendOnOpen }: { survey?: Survey; sendOnOpen: boolean }) {
  const navigate = useNavigate()
  const canManage = can(useMe().data, 'surveys.manage')
  const templates = useSurveyTemplates()
  const create = useSurveyMutation(surveysApi.create)
  const update = useSurveyMutation(surveysApi.update)
  const [draft, setDraft] = useState<SurveyDraft>(() => draftOf(survey))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sending, setSending] = useState<Survey | null>(() =>
    sendOnOpen && survey?.status === 'draft' ? survey : null
  )
  const [managing, setManaging] = useState(false)
  const [replacing, setReplacing] = useState<SurveyTemplate | null>(null)

  const isDraft = !survey || survey.status === 'draft'
  const readOnly = !canManage || Boolean(survey?.locked) || survey?.status === 'closed'
  const saving = create.isPending || update.isPending

  useEffect(() => {
    if (!sendOnOpen || !survey) return
    void navigate({
      to: '/surveys/$surveyId/edit',
      params: { surveyId: String(survey.id) },
      search: {},
      replace: true,
    })
  }, [sendOnOpen, survey, navigate])

  const change = (patch: Partial<SurveyDraft>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setErrors({})
  }

  const applyTemplate = (template: SurveyTemplate) => {
    change({
      title: template.title,
      description: template.description ?? '',
      questions: fromQuestions(template.questions),
    })
    setReplacing(null)
  }

  const save = async (thenSend: boolean) => {
    const next = draftErrors(draft, thenSend || !isDraft)
    setErrors(next)
    if (Object.keys(next).length) {
      alerts.error(Object.values(next)[0]!)
      return
    }
    const input = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      questions: toQuestionInputs(draft.questions),
    }
    try {
      const saved = survey
        ? await update.mutateAsync({ id: survey.id, ...input })
        : await create.mutateAsync(input)
      alerts.success(saved.message)
      if (!survey) {
        void navigate({
          to: '/surveys/$surveyId/edit',
          params: { surveyId: String(saved.data.id) },
          search: thenSend ? { send: true } : {},
          replace: true,
        })
      } else if (thenSend) setSending(saved.data)
    } catch (error) {
      const apiError = toApiError(error)
      setErrors(fieldMap(apiError.fieldErrors))
      alerts.error(apiError.message)
    }
  }

  const resultsLink = survey && !isDraft && (
    <Button variant='outline' asChild>
      <Link
        to='/surveys/$surveyId'
        params={{ surveyId: String(survey.id) }}
        search={{ tab: 'results', page: 1 }}
      >
        <BarChart3 />
        Results
      </Link>
    </Button>
  )

  return (
    <Page>
      <Button variant='ghost' size='sm' className='-mb-3 self-start' asChild>
        <Link to='/surveys' search={{ page: 1, status: survey?.status ?? 'draft' }}>
          <ArrowLeft />
          Surveys & forms
        </Link>
      </Button>
      <PageHeader
        eyebrow='Communication'
        title={
          <span className='flex flex-wrap items-center gap-2'>
            {survey ? 'Edit form' : 'New form'}
            {survey && (
              <Badge tone={STATUS[survey.status].tone} dot>
                {STATUS[survey.status].label}
              </Badge>
            )}
          </span>
        }
        description='Write the questions; the preview shows how the form looks in the app.'
        actions={
          <>
            {resultsLink}
            {canManage && !readOnly && (
              <Button
                variant={isDraft ? 'outline' : 'default'}
                loading={saving}
                onClick={() => void save(false)}
              >
                <Save />
                {isDraft ? 'Save draft' : 'Save changes'}
              </Button>
            )}
            {canManage && isDraft && (
              <Button disabled={saving} onClick={() => void save(true)}>
                <Send />
                Save and send
              </Button>
            )}
          </>
        }
      />
      {survey?.locked && (
        <Notice>
          Answers have come in, so the questions are read only. You can still extend the close date
          or close the form from Results.
        </Notice>
      )}
      {survey && !survey.locked && survey.status === 'closed' && (
        <Notice>This form is closed, so it cannot change any more.</Notice>
      )}
      {survey && !survey.locked && ['open', 'scheduled'].includes(survey.status) && (
        <Notice>
          This form has been sent. You can change the title, description and questions until the
          first answer comes in.
        </Notice>
      )}
      <div className='grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]'>
        <div className='grid min-w-0 gap-4'>
          <Card className='grid gap-4 p-4'>
            {isDraft && canManage && (
              <FormField
                id='survey-template'
                label='Start from a ready-made form'
                hint='Replaces the title, description and questions below.'
              >
                <div className='flex flex-wrap gap-2'>
                  <Combobox
                    id='survey-template'
                    label='Ready-made forms'
                    placeholder='Choose a ready-made form (optional)'
                    options={(templates.data ?? []).map((item) => ({
                      value: String(item.id),
                      label: item.title,
                      hint: `${item.questions.length} questions`,
                    }))}
                    onChange={(value) => {
                      const template = templates.data?.find((item) => String(item.id) === value)
                      if (!template) return
                      if (draft.questions.length || draft.title.trim()) setReplacing(template)
                      else applyTemplate(template)
                    }}
                    highlightSelected={false}
                    className='min-w-0 flex-1'
                  />
                  <Button type='button' variant='outline' onClick={() => setManaging(true)}>
                    <FileStack />
                    Manage
                  </Button>
                </div>
              </FormField>
            )}
            <FormField id='survey-title' label='Title' required error={errors.title}>
              <Input
                id='survey-title'
                value={draft.title}
                maxLength={150}
                readOnly={readOnly}
                placeholder='e.g. Annual Day feedback'
                aria-invalid={Boolean(errors.title)}
                onChange={(event) => change({ title: event.target.value })}
              />
            </FormField>
            <FormField
              id='survey-description'
              label='Description'
              hint='Optional. Shown under the title in the app.'
              error={errors.description}
            >
              <Textarea
                id='survey-description'
                rows={2}
                maxLength={1000}
                readOnly={readOnly}
                value={draft.description}
                onChange={(event) => change({ description: event.target.value })}
              />
            </FormField>
          </Card>
          <section className='grid gap-3' aria-label='Questions'>
            <h2 className='text-sm font-bold'>
              Questions <span className='text-muted-foreground'>({draft.questions.length})</span>
            </h2>
            <QuestionEditor
              questions={draft.questions}
              onChange={(questions) => change({ questions })}
              errors={errors}
              readOnly={readOnly}
            />
          </section>
        </div>
        <aside className='grid gap-2 lg:sticky lg:top-20'>
          <h2 className='text-center text-xs font-semibold text-muted-foreground'>Phone preview</h2>
          <PhonePreview
            title={draft.title}
            description={draft.description}
            questions={draft.questions}
          />
        </aside>
      </div>
      {sending && (
        <SendModal
          survey={sending}
          onClose={() => setSending(null)}
          onSent={(sent) => {
            setSending(null)
            void navigate({
              to: '/surveys/$surveyId',
              params: { surveyId: String(sent.id) },
              search: { tab: 'results', page: 1 },
            })
          }}
        />
      )}
      {managing && <TemplatesModal current={draft} onClose={() => setManaging(false)} />}
      <ConfirmDialog
        open={Boolean(replacing)}
        onOpenChange={(open) => !open && setReplacing(null)}
        title='Replace what you have written?'
        description={`The title, description and questions change to "${replacing?.title ?? ''}".`}
        confirmText='Replace'
        onConfirm={() => replacing && applyTemplate(replacing)}
      />
    </Page>
  )
}

export function SurveyBuilderPage() {
  const params = useParams({ strict: false }) as { surveyId?: string }
  const search = useSearch({ strict: false }) as { send?: boolean }
  const surveyId = params.surveyId ? Number(params.surveyId) : undefined
  const survey = useSurvey(surveyId)

  if (surveyId && survey.isPending) {
    return (
      <Page>
        <Skeleton className='h-10 w-64' />
        <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]'>
          <Skeleton className='h-96' />
          <Skeleton className='h-96' />
        </div>
      </Page>
    )
  }
  if (surveyId && survey.error) {
    return (
      <Page>
        <ErrorState message={survey.error.message} onRetry={() => void survey.refetch()} />
      </Page>
    )
  }
  return (
    <Builder
      key={survey.data?.id ?? 'new'}
      survey={survey.data}
      sendOnOpen={Boolean(search.send)}
    />
  )
}
