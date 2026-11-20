import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  ClipboardList,
  FilePen,
  FileStack,
  MessageSquareText,
  Plus,
  Radio,
  TrendingUp,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { can, useMe } from '@/features/auth/api'
import { formatDateTime } from '@/lib/format'
import { useSurveyInsights, useSurveys, type Survey, type SurveyStatus } from '../api'
import { TemplatesModal } from '../components/templates-modal'
import { pct, STATUS, STATUS_TABS } from '../labels'
import type { SurveysSearch } from '../search'

const route = getRouteApi('/_app/surveys')
const LIMIT = 20

const EMPTY: Record<SurveyStatus, { title: string; description: string }> = {
  open: {
    title: 'No open forms',
    description: 'Forms you send show here while people can still answer.',
  },
  scheduled: {
    title: 'Nothing scheduled',
    description: 'Choose Send later when you send a form to schedule it.',
  },
  draft: {
    title: 'No drafts',
    description: 'Start a new form; it stays a draft until you send it.',
  },
  closed: { title: 'No closed forms', description: 'Forms move here after their close date.' },
}

export function SurveysPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/surveys' })
  const canManage = can(useMe().data, 'surveys.manage')
  const [managing, setManaging] = useState(false)
  const setSearch = (patch: Partial<SurveysSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })
  const list = useSurveys({
    page: search.page,
    limit: LIMIT,
    search: search.search,
    status: search.status,
  })
  const insights = useSurveyInsights()

  useShortcut('app.refresh', () => void list.refetch())

  const open = (survey: Survey) =>
    survey.status === 'draft'
      ? void navigate({ to: '/surveys/$surveyId/edit', params: { surveyId: String(survey.id) } })
      : void navigate({
          to: '/surveys/$surveyId',
          params: { surveyId: String(survey.id) },
          search: { tab: 'results', page: 1 },
        })

  const cards: Insight[] = [
    {
      key: 'open',
      label: 'Open now',
      value: insights.data?.open ?? 0,
      hint: 'Taking answers',
      icon: Radio,
      tone: 'success',
      active: search.status === 'open',
      onClick: () => setSearch({ status: 'open' }),
    },
    {
      key: 'drafts',
      label: 'Drafts',
      value: insights.data?.drafts ?? 0,
      hint: 'Not sent yet',
      icon: FilePen,
      tone: 'neutral',
      active: search.status === 'draft',
      onClick: () => setSearch({ status: 'draft' }),
    },
    {
      key: 'answers',
      label: 'Answers this month',
      value: insights.data?.answers_this_month ?? 0,
      hint: 'From the apps',
      icon: MessageSquareText,
      tone: 'primary',
    },
    {
      key: 'rate',
      label: 'Average response rate',
      value: pct(insights.data?.average_response_rate),
      hint: 'Sent forms this year',
      icon: TrendingUp,
      tone: 'info',
    },
  ]

  const columns: Column<Survey>[] = [
    {
      key: 'title',
      header: 'Form',
      cell: (row) => (
        <span className='grid min-w-0'>
          <span className='truncate font-semibold'>{row.title}</span>
          <span className='truncate text-xs text-muted-foreground'>
            {row.questions.length} {row.questions.length === 1 ? 'question' : 'questions'}
            {row.is_anonymous ? ' · anonymous' : ''}
            {row.per_child ? ' · per child' : ''}
          </span>
        </span>
      ),
    },
    {
      key: 'audience',
      header: 'Sent to',
      hideBelow: 'lg',
      cell: (row) => <span className='text-sm'>{row.audience_label}</span>,
    },
    {
      key: 'answered',
      header: 'Answered',
      cell: (row) =>
        row.status === 'draft' ? (
          <span className='text-muted-foreground'>—</span>
        ) : (
          <span className='tabular'>
            {row.counts.answered} / {row.counts.recipients}
            <span className='ml-1 text-xs text-muted-foreground'>
              {pct(row.counts.response_rate)}
            </span>
          </span>
        ),
    },
    {
      key: 'closes',
      header: 'Closes',
      hideBelow: 'lg',
      cell: (row) => <span className='text-sm'>{formatDateTime(row.closes_at)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge tone={STATUS[row.status].tone} dot>
          {STATUS[row.status].label}
        </Badge>
      ),
    },
  ]

  const empty = EMPTY[search.status]
  return (
    <Page>
      <PageHeader
        eyebrow='Communication'
        title='Surveys & forms'
        description='Build a form with your own questions, send it to parents or staff, and see the answers as they come in from the apps.'
        actions={
          canManage ? (
            <>
              <Button variant='outline' onClick={() => setManaging(true)}>
                <FileStack />
                Ready-made forms
              </Button>
              <Button onClick={() => void navigate({ to: '/surveys/new' })}>
                <Plus />
                New form
              </Button>
            </>
          ) : undefined
        }
      />
      <InsightCards items={cards} loading={insights.isPending} />
      <Card className='overflow-hidden'>
        <div className='px-4 pt-2'>
          <PageTabs
            label='Form status'
            value={search.status}
            onChange={(status) => setSearch({ status })}
            tabs={STATUS_TABS}
          />
        </div>
        <ListToolbar
          summary={list.data ? `${list.data.total} forms` : ''}
          onClear={search.search ? () => setSearch({ search: undefined }) : undefined}
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Title or description'
            label='Search forms'
          />
        </ListToolbar>
        <DataTable
          rows={list.data?.items ?? []}
          columns={columns}
          rowKey={(row) => row.id}
          loading={list.isPending}
          error={list.error?.message}
          onRetry={() => void list.refetch()}
          onRowClick={open}
          empty={{
            icon: ClipboardList,
            title: search.search ? 'No forms match' : empty.title,
            description: search.search
              ? 'Clear the search to see every form in this tab.'
              : empty.description,
            action:
              canManage && !search.search ? (
                <Button size='sm' onClick={() => void navigate({ to: '/surveys/new' })}>
                  <Plus />
                  New form
                </Button>
              ) : undefined,
          }}
          card={(row) => (
            <div className='grid gap-1'>
              <div className='flex items-center justify-between gap-2'>
                <span className='min-w-0 truncate font-semibold'>{row.title}</span>
                <Badge tone={STATUS[row.status].tone} dot>
                  {STATUS[row.status].label}
                </Badge>
              </div>
              <span className='text-xs text-muted-foreground'>
                {row.audience_label}
                {row.status !== 'draft' &&
                  ` · ${row.counts.answered} / ${row.counts.recipients} answered`}
                {row.closes_at && ` · closes ${formatDateTime(row.closes_at)}`}
              </span>
            </div>
          )}
          pagination={
            list.data
              ? {
                  page: search.page,
                  limit: list.data.limit,
                  total: list.data.total,
                  label: 'forms',
                  onPageChange: (page) =>
                    navigate({ search: (prev) => ({ ...prev, page }), replace: true }),
                }
              : undefined
          }
        />
      </Card>
      {managing && <TemplatesModal onClose={() => setManaging(false)} />}
    </Page>
  )
}
