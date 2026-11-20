import { useState } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  BarChart3,
  BellRing,
  CalendarClock,
  Download,
  Lock,
  Pencil,
  UserX,
  XCircle,
} from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { DatePicker } from '@/components/common/date-picker'
import { EmptyState, ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { TimePicker } from '@/components/common/time-picker'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { useClasses, useSections } from '@/features/setup/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { downloadFile } from '@/lib/files'
import { formatDateTime } from '@/lib/format'
import {
  surveysApi,
  useSurveyMutation,
  useSurveyNotAnswered,
  useSurveyResults,
  type NotAnswered,
  type ResultFilters,
  type ResultRole,
  type Survey,
} from '../api'
import { fieldMap } from '../builder'
import { ResultCard } from '../components/result-card'
import { fromLocalParts, localParts, pct, ROLE_LABEL, ROLE_OPTIONS, STATUS } from '../labels'
import type { SurveyResultsSearch } from '../search'

const route = getRouteApi('/_app/surveys/$surveyId')
const LIMIT = 20

function ExtendModal({ survey, onClose }: { survey: Survey; onClose: () => void }) {
  const base = survey.closes_at ? new Date(survey.closes_at) : new Date()
  const [value, setValue] = useState(() => localParts(new Date(base.getTime() + 2 * 86400_000)))
  const [error, setError] = useState('')
  const extend = useSurveyMutation(surveysApi.extend)

  const submit = async () => {
    const closes_at = fromLocalParts(value.date, value.time)
    if (!closes_at) return setError('Pick the new day and time')
    try {
      const saved = await extend.mutateAsync({ id: survey.id, closes_at })
      alerts.success(saved.message)
      onClose()
    } catch (failure) {
      const apiError = toApiError(failure)
      setError(fieldMap(apiError.fieldErrors).closes_at ?? apiError.message)
      alerts.error(apiError.message)
    }
  }

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Extend the close date'
      description={`Now closes ${formatDateTime(survey.closes_at)}. Answers already in stay.`}
      formId='survey-extend-form'
      submitText='Extend'
      loading={extend.isPending}
    >
      <form
        id='survey-extend-form'
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <FormField id='survey-extend-date' label='New close date' required error={error}>
          <div className='grid gap-2 sm:grid-cols-2'>
            <DatePicker
              id='survey-extend-date'
              value={value.date}
              min={localParts(base).date}
              invalid={Boolean(error)}
              onChange={(date: string) => {
                setValue((current) => ({ ...current, date }))
                setError('')
              }}
            />
            <TimePicker
              id='survey-extend-time'
              value={value.time}
              invalid={Boolean(error)}
              onChange={(time) => {
                setValue((current) => ({ ...current, time }))
                setError('')
              }}
            />
          </div>
        </FormField>
      </form>
    </AppModal>
  )
}

function NotAnsweredTable({
  surveyId,
  filters,
  page,
  onPage,
}: {
  surveyId: number
  filters: ResultFilters
  page: number
  onPage: (page: number) => void
}) {
  const list = useSurveyNotAnswered(surveyId, { ...filters, page, limit: LIMIT }, true)
  const columns: Column<NotAnswered>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (row) => (
        <span className='grid'>
          <span className='font-semibold'>{row.name}</span>
          {row.student && (
            <span className='text-xs text-muted-foreground'>for {row.student.name}</span>
          )}
        </span>
      ),
    },
    { key: 'role', header: 'Role', cell: (row) => ROLE_LABEL[row.role] },
    {
      key: 'class',
      header: 'Class / section',
      cell: (row) => row.class_section ?? <span className='text-muted-foreground'>—</span>,
    },
    {
      key: 'reminded',
      header: 'Reminded',
      hideBelow: 'lg',
      cell: (row) => (row.reminded_at ? formatDateTime(row.reminded_at) : '—'),
    },
  ]
  return (
    <DataTable
      rows={list.data?.items ?? []}
      columns={columns}
      rowKey={(row) => row.id}
      loading={list.isPending}
      error={list.error?.message}
      onRetry={() => void list.refetch()}
      empty={{
        icon: UserX,
        title: 'Everyone has answered',
        description: 'Nobody matching these filters is still waiting to answer.',
      }}
      card={(row) => (
        <div className='grid gap-0.5'>
          <span className='font-semibold'>
            {row.name}
            {row.student && (
              <span className='font-normal text-muted-foreground'> · for {row.student.name}</span>
            )}
          </span>
          <span className='text-xs text-muted-foreground'>
            {ROLE_LABEL[row.role]}
            {row.class_section && ` · ${row.class_section}`}
          </span>
        </div>
      )}
      pagination={
        list.data
          ? {
              page,
              limit: list.data.limit,
              total: list.data.total,
              label: 'people',
              onPageChange: onPage,
            }
          : undefined
      }
    />
  )
}

export function SurveyResultsPage() {
  const { surveyId } = route.useParams()
  const id = Number(surveyId)
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/surveys/$surveyId' })
  const canManage = can(useMe().data, 'surveys.manage')
  const filters: ResultFilters = {
    class_id: search.class_id,
    section_id: search.section_id,
    role: search.role,
    search: search.search,
  }
  const results = useSurveyResults(id, filters)
  const classes = useClasses()
  const sections = useSections(search.class_id)
  const close = useSurveyMutation(surveysApi.close)
  const remind = useSurveyMutation(surveysApi.remind)
  const [confirm, setConfirm] = useState<'close' | 'remind' | null>(null)
  const [extending, setExtending] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const setSearch = (patch: Partial<SurveyResultsSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })

  useShortcut('app.refresh', () => void results.refetch())

  if (results.isPending) {
    return (
      <Page>
        <Skeleton className='h-10 w-72' />
        <Skeleton className='h-24' />
        <div className='grid gap-4 md:grid-cols-2'>
          <Skeleton className='h-56' />
          <Skeleton className='h-56' />
        </div>
      </Page>
    )
  }
  if (results.error || !results.data) {
    return (
      <Page>
        <ErrorState
          message={results.error?.message ?? 'Could not load the results'}
          onRetry={() => void results.refetch()}
        />
      </Page>
    )
  }

  const { survey, counts, questions } = results.data
  const live = survey.status === 'open' || survey.status === 'scheduled'
  const tab = survey.is_anonymous ? 'results' : search.tab
  const filtered = Boolean(search.class_id || search.section_id || search.role || search.search)

  const act = async (kind: 'close' | 'remind') => {
    try {
      const done = kind === 'close' ? await close.mutateAsync(id) : await remind.mutateAsync(id)
      alerts.success(
        kind === 'remind' && 'reminded' in done.data
          ? `${done.message}: ${done.data.reminded} people`
          : done.message
      )
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setConfirm(null)
    }
  }

  const download = async () => {
    setDownloading(true)
    try {
      await downloadFile(surveysApi.exportUrl(id), `${survey.title}.xlsx`, {
        class_id: search.class_id,
        section_id: search.section_id,
        role: search.role,
      })
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Page>
      <Button variant='ghost' size='sm' className='-mb-3 self-start' asChild>
        <Link to='/surveys' search={{ page: 1, status: survey.status }}>
          <ArrowLeft />
          Surveys & forms
        </Link>
      </Button>
      <PageHeader
        eyebrow='Communication'
        title={
          <span className='flex flex-wrap items-center gap-2'>
            <span className='break-words'>{survey.title}</span>
            <Badge tone={STATUS[survey.status].tone} dot>
              {STATUS[survey.status].label}
            </Badge>
          </span>
        }
        description={
          <span className='flex flex-wrap gap-x-3 gap-y-1'>
            <span>{survey.audience_label}</span>
            {survey.closes_at && (
              <span>
                {survey.status === 'closed' ? 'Closed' : 'Closes'}{' '}
                {formatDateTime(survey.closed_at ?? survey.closes_at)}
              </span>
            )}
            {survey.is_anonymous && (
              <span className='flex items-center gap-1'>
                <Lock className='size-3.5' />
                Anonymous
              </span>
            )}
            {survey.per_child && <span>One answer per child</span>}
          </span>
        }
        actions={
          <>
            <Button variant='outline' loading={downloading} onClick={() => void download()}>
              <Download />
              Excel
            </Button>
            {canManage && !survey.locked && survey.status !== 'closed' && (
              <Button variant='outline' asChild>
                <Link to='/surveys/$surveyId/edit' params={{ surveyId: String(id) }}>
                  <Pencil />
                  Edit questions
                </Link>
              </Button>
            )}
            {canManage && survey.status === 'open' && (
              <Button variant='outline' onClick={() => setConfirm('remind')}>
                <BellRing />
                Remind now
              </Button>
            )}
            {canManage && live && (
              <>
                <Button variant='outline' onClick={() => setExtending(true)}>
                  <CalendarClock />
                  Extend
                </Button>
                <Button variant='destructive' onClick={() => setConfirm('close')}>
                  <XCircle />
                  Close
                </Button>
              </>
            )}
          </>
        }
      />
      <Card className='grid gap-3 p-4' data-testid='survey-response-rate'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <span className='grid'>
            <span className='text-xs font-semibold text-muted-foreground'>
              Response rate{filtered ? ' (filtered)' : ''}
            </span>
            <span className='tabular text-3xl font-extrabold'>{pct(counts.response_rate)}</span>
          </span>
          <span className='tabular text-sm text-muted-foreground'>
            <span className='font-semibold text-foreground'>{counts.answered}</span> of{' '}
            {counts.recipients} answered
          </span>
        </div>
        <div className='h-2.5 overflow-hidden rounded-full bg-muted'>
          <div
            className='h-full rounded-full bg-success transition-[width]'
            style={{ width: `${Math.min(counts.response_rate ?? 0, 100)}%` }}
          />
        </div>
      </Card>
      <Card className='overflow-hidden'>
        <ListToolbar
          onClear={
            filtered
              ? () =>
                  setSearch({
                    class_id: undefined,
                    section_id: undefined,
                    role: undefined,
                    search: undefined,
                  })
              : undefined
          }
        >
          <FilterSelect
            id='survey-filter-class'
            label='Class'
            allLabel='All classes'
            value={search.class_id ? String(search.class_id) : undefined}
            options={(classes.data ?? []).map((item) => ({
              value: String(item.id),
              label: `Class ${item.name}`,
            }))}
            onChange={(value) =>
              setSearch({ class_id: value ? Number(value) : undefined, section_id: undefined })
            }
          />
          <FilterSelect
            id='survey-filter-section'
            label='Section'
            allLabel='All sections'
            value={search.section_id ? String(search.section_id) : undefined}
            options={(sections.data ?? []).map((item) => ({
              value: String(item.id),
              label: `${item.class_name} - ${item.name}`,
            }))}
            onChange={(value) => setSearch({ section_id: value ? Number(value) : undefined })}
          />
          <FilterSelect
            id='survey-filter-role'
            label='Role'
            allLabel='Parents and staff'
            value={search.role}
            options={ROLE_OPTIONS}
            onChange={(value) => setSearch({ role: value as ResultRole | undefined })}
          />
          {tab === 'results' && (
            <SearchBox
              value={search.search ?? ''}
              onChange={(value) => setSearch({ search: value || undefined })}
              placeholder='Search written answers'
              label='Search written answers'
            />
          )}
        </ListToolbar>
        {!survey.is_anonymous && (
          <div className='px-4 pt-2'>
            <PageTabs
              label='Results or people not answered'
              value={tab}
              onChange={(value) => setSearch({ tab: value })}
              tabs={[
                { value: 'results', label: 'Results', icon: BarChart3 },
                {
                  value: 'not_answered',
                  label: 'Not answered',
                  icon: UserX,
                  count: counts.recipients - counts.answered,
                },
              ]}
            />
          </div>
        )}
        {tab === 'not_answered' ? (
          <NotAnsweredTable
            surveyId={id}
            filters={{
              class_id: search.class_id,
              section_id: search.section_id,
              role: search.role,
            }}
            page={search.page}
            onPage={(page) => navigate({ search: (prev) => ({ ...prev, page }), replace: true })}
          />
        ) : counts.answered === 0 ? (
          <div className='p-4'>
            <EmptyState
              icon={BarChart3}
              title={filtered ? 'No answers match' : 'No answers yet'}
              description={
                filtered
                  ? 'Clear the filters to see every answer.'
                  : 'Results show here as soon as the first person answers in the app.'
              }
            />
          </div>
        ) : (
          <div className='grid gap-4 p-4 md:grid-cols-2'>
            {questions.map((result, index) => (
              <ResultCard key={result.id} result={result} index={index} />
            ))}
          </div>
        )}
      </Card>
      {extending && <ExtendModal survey={survey} onClose={() => setExtending(false)} />}
      <ConfirmDialog
        open={confirm === 'close'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title='Close this form now?'
        description='Nobody can answer after this. The answers already in stay and you can still download them.'
        confirmText='Close form'
        destructive
        loading={close.isPending}
        onConfirm={() => void act('close')}
      />
      <ConfirmDialog
        open={confirm === 'remind'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title='Remind everyone who has not answered?'
        description={`${counts.recipients - counts.answered} answers are still missing. Everyone who has not answered gets a push and an in-app reminder now.`}
        confirmText='Send reminder'
        loading={remind.isPending}
        onConfirm={() => void act('remind')}
      />
    </Page>
  )
}
