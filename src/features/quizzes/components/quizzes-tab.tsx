import { useState } from 'react'
import {
  BarChart3,
  BookOpen,
  Camera,
  CheckCircle,
  Clock,
  Eye,
  FileQuestion,
  Mic,
  Plus,
  ShieldAlert,
  Trash2,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import {
  quizzesApi,
  useQuizActionMutation,
  useQuizzes,
  type OnlineQuiz,
  type QuizQuery,
} from '../api'
import { QuizReviewModal } from './quiz-review-modal'
import { QuizAnalyticsModal } from './quiz-analytics-modal'

const STATUS_OPTIONS = [
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved / Scheduled' },
  { value: 'draft', label: 'Draft' },
  { value: 'rejected', label: 'Rejected' },
]

function isLive(quiz: OnlineQuiz): boolean {
  const now = Date.now()
  return (
    quiz.status === 'approved' && Date.parse(quiz.start_at) <= now && now <= Date.parse(quiz.end_at)
  )
}

function deleteWarning(quiz: OnlineQuiz): string {
  const attempts = quiz.attempts_count ?? 0
  const parts = [`"${quiz.title}" will be removed for teachers and parents straight away.`]
  if (isLive(quiz))
    parts.push('It is live now: students taking it will lose access and cannot submit.')
  if (attempts > 0) {
    parts.push(
      `${attempts} ${attempts === 1 ? 'student has' : 'students have'} already attempted it; their results will no longer be visible in the apps.`
    )
  }
  parts.push('The records are kept in the system, but this cannot be undone from the screen.')
  return parts.join(' ')
}

export function QuizzesTab({
  search,
  onSearchChange,
  onCreateClick,
}: {
  search: { status?: string; search?: string; page?: number }
  onSearchChange: (patch: Partial<{ status?: string; search?: string; page?: number }>) => void
  onCreateClick?: () => void
}) {
  const page = search.page ?? 1
  const query: QuizQuery = {
    page,
    limit: 20,
    status: search.status || undefined,
    search: search.search || undefined,
  }

  const { data, isLoading, refetch } = useQuizzes(query)
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null)
  const [selectedAnalyticsId, setSelectedAnalyticsId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<OnlineQuiz | null>(null)
  const deleteMutation = useQuizActionMutation((id: number) => quizzesApi.remove(id))

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await deleteMutation.mutateAsync(deleting.id)
      alerts.success(`"${deleting.title}" was deleted.`)
      setDeleting(null)
    } catch (err) {
      alerts.error(toApiError(err).message)
    }
  }

  const columns: Column<OnlineQuiz>[] = [
    {
      key: 'title',
      header: 'Quiz & Subject',
      cell: (quiz) => (
        <div className='grid min-w-0'>
          <span className='truncate text-sm font-semibold'>{quiz.title}</span>
          <span className='mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground'>
            <BookOpen className='h-3 w-3' />
            {quiz.subject?.name ?? 'Subject'}
          </span>
          {(quiz.require_camera || quiz.require_microphone || quiz.expire_on_exit) && (
            <div className='mt-1 flex flex-wrap items-center gap-1'>
              {quiz.require_camera && (
                <span className='inline-flex items-center gap-0.5 rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'>
                  <Camera className='h-2.5 w-2.5' /> Camera
                </span>
              )}
              {quiz.require_microphone && (
                <span className='inline-flex items-center gap-0.5 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'>
                  <Mic className='h-2.5 w-2.5' /> Voice
                </span>
              )}
              {quiz.expire_on_exit && (
                <span className='inline-flex items-center gap-0.5 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'>
                  <ShieldAlert className='h-2.5 w-2.5' /> Strict Exit
                </span>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'class',
      header: 'Class & Section',
      cell: (quiz) => (
        <span className='text-xs font-medium'>
          {quiz.class?.name ? `${quiz.class.name} - ${quiz.section?.name ?? ''}` : '—'}
        </span>
      ),
    },
    {
      key: 'teacher',
      header: 'Teacher',
      cell: (quiz) => (
        <span className='text-xs text-muted-foreground'>{quiz.teacher?.name ?? '—'}</span>
      ),
    },
    {
      key: 'schedule',
      header: 'Schedule & Duration',
      cell: (quiz) => (
        <div className='grid min-w-0 text-xs'>
          <span className='flex items-center gap-1 font-medium'>
            <Clock className='h-3 w-3 text-muted-foreground' />
            {quiz.duration_minutes} mins · {quiz.total_marks} marks
          </span>
          <span className='mt-0.5 text-[11px] text-muted-foreground'>
            {formatDate(quiz.start_at)} — {formatDate(quiz.end_at)}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (quiz) => {
        switch (quiz.status) {
          case 'pending_approval':
            return <Badge tone='warning'>Pending Approval</Badge>
          case 'approved':
            return isLive(quiz) ? (
              <Badge tone='info'>Live now</Badge>
            ) : (
              <Badge tone='success'>Approved</Badge>
            )
          case 'rejected':
            return <Badge tone='danger'>Rejected</Badge>
          case 'draft':
          default:
            return <Badge tone='neutral'>Draft</Badge>
        }
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (quiz) => (
        <div className='flex items-center justify-end gap-1.5'>
          {quiz.status === 'pending_approval' ? (
            <Button
              size='sm'
              className='h-8 bg-amber-600 px-2.5 text-xs text-white hover:bg-amber-700'
              onClick={() => setSelectedReviewId(quiz.id)}
            >
              <CheckCircle className='mr-1 h-3.5 w-3.5' />
              Review
            </Button>
          ) : (
            <Button
              size='sm'
              variant='outline'
              className='h-8 px-2.5 text-xs'
              onClick={() => setSelectedReviewId(quiz.id)}
            >
              <Eye className='mr-1 h-3.5 w-3.5' />
              View
            </Button>
          )}

          {quiz.status === 'approved' && (
            <Button
              size='sm'
              variant='ghost'
              className='h-8 px-2 text-xs text-muted-foreground hover:text-foreground'
              onClick={() => setSelectedAnalyticsId(quiz.id)}
              title='View Results & Analytics'
            >
              <BarChart3 className='h-4 w-4' />
            </Button>
          )}

          <Button
            size='sm'
            variant='ghost'
            className='h-8 px-2 text-xs text-destructive hover:text-destructive'
            onClick={() => setDeleting(quiz)}
            title='Delete quiz'
            aria-label={`Delete ${quiz.title}`}
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className='space-y-4'>
      <ListToolbar>
        <SearchBox
          label='Search quizzes'
          value={search.search ?? ''}
          placeholder='Search quizzes by title or subject...'
          onChange={(text) => onSearchChange({ search: text || undefined, page: 1 })}
        />
        <FilterSelect
          id='quiz-status-filter'
          label='Status'
          allLabel='All statuses'
          value={search.status ?? ''}
          options={STATUS_OPTIONS}
          onChange={(status) =>
            onSearchChange({ status: (status as string) || undefined, page: 1 })
          }
        />
      </ListToolbar>

      <DataTable
        rows={data?.items ?? []}
        columns={columns}
        rowKey={(quiz) => quiz.id}
        loading={isLoading}
        error={null}
        onRetry={() => void refetch()}
        empty={{
          icon: FileQuestion,
          title: 'No online quizzes found',
          description: 'Create an online test or review tests submitted by teachers.',
          action: onCreateClick ? (
            <Button size='sm' onClick={onCreateClick}>
              <Plus className='mr-1 h-3.5 w-3.5' /> Create Online Test
            </Button>
          ) : undefined,
        }}
        card={(quiz) => (
          <div className='grid gap-2 rounded-lg border bg-card p-3'>
            <div className='flex items-start justify-between gap-2'>
              <div className='grid min-w-0'>
                <span className='truncate text-sm font-semibold'>{quiz.title}</span>
                <span className='text-xs text-muted-foreground'>
                  {quiz.subject?.name} · {quiz.class?.name}-{quiz.section?.name}
                </span>
              </div>
              <Badge
                tone={
                  quiz.status === 'approved'
                    ? 'success'
                    : quiz.status === 'pending_approval'
                      ? 'warning'
                      : quiz.status === 'rejected'
                        ? 'danger'
                        : 'neutral'
                }
              >
                {quiz.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className='flex items-center justify-between text-xs text-muted-foreground'>
              <span>
                {quiz.duration_minutes} mins · {quiz.total_marks} marks
              </span>
              <Button
                size='sm'
                variant='outline'
                className='h-7 text-xs'
                onClick={() => setSelectedReviewId(quiz.id)}
              >
                Review
              </Button>
            </div>
          </div>
        )}
        pagination={
          data
            ? {
                page,
                limit: 20,
                total: data.total,
                label: 'quizzes',
                onPageChange: (p: number) => onSearchChange({ page: p }),
              }
            : undefined
        }
      />

      {/* Review Modal */}
      <QuizReviewModal quizId={selectedReviewId} onClose={() => setSelectedReviewId(null)} />

      {/* Analytics Modal */}
      <QuizAnalyticsModal
        quizId={selectedAnalyticsId}
        onClose={() => setSelectedAnalyticsId(null)}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        title='Delete this quiz?'
        description={deleting ? deleteWarning(deleting) : ''}
        confirmText='Delete quiz'
        destructive
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
