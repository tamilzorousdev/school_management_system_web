import { useState } from 'react'
import {
  BarChart3,
  BookOpen,
  CheckCircle,
  Clock,
  Eye,
  FileQuestion,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format'
import { useQuizzes, type OnlineQuiz, type QuizQuery } from '../api'
import { QuizReviewModal } from './quiz-review-modal'
import { QuizAnalyticsModal } from './quiz-analytics-modal'

const STATUS_OPTIONS = [
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved / Scheduled' },
  { value: 'draft', label: 'Draft' },
  { value: 'rejected', label: 'Rejected' },
]

export function QuizzesTab({
  search,
  onSearchChange,
}: {
  search: { status?: string; search?: string; page?: number }
  onSearchChange: (patch: Partial<{ status?: string; search?: string; page?: number }>) => void
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

  const columns: Column<OnlineQuiz>[] = [
    {
      key: 'title',
      header: 'Quiz & Subject',
      cell: (quiz) => (
        <div className='grid min-w-0'>
          <span className='truncate font-semibold text-sm'>{quiz.title}</span>
          <span className='truncate text-xs text-muted-foreground flex items-center gap-1 mt-0.5'>
            <BookOpen className='h-3 w-3' />
            {quiz.subject?.name ?? 'Subject'}
          </span>
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
        <span className='text-xs text-muted-foreground'>
          {quiz.teacher ? `${quiz.teacher.first_name} ${quiz.teacher.last_name}` : '—'}
        </span>
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
          <span className='text-[11px] text-muted-foreground mt-0.5'>
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
            return <Badge tone='success'>Approved</Badge>
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
        <div className='flex items-center gap-1.5 justify-end'>
          {quiz.status === 'pending_approval' ? (
            <Button
              size='sm'
              className='h-8 px-2.5 text-xs bg-amber-600 hover:bg-amber-700 text-white'
              onClick={() => setSelectedReviewId(quiz.id)}
            >
              <CheckCircle className='h-3.5 w-3.5 mr-1' />
              Review
            </Button>
          ) : (
            <Button
              size='sm'
              variant='outline'
              className='h-8 px-2.5 text-xs'
              onClick={() => setSelectedReviewId(quiz.id)}
            >
              <Eye className='h-3.5 w-3.5 mr-1' />
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
          onChange={(status) => onSearchChange({ status: (status as string) || undefined, page: 1 })}
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
          description: 'Quizzes created by subject teachers will appear here for review and tracking.',
        }}
        card={(quiz) => (
          <div className='grid gap-2 p-3 border rounded-lg bg-card'>
            <div className='flex items-start justify-between gap-2'>
              <div className='grid min-w-0'>
                <span className='font-semibold text-sm truncate'>{quiz.title}</span>
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
              <span>{quiz.duration_minutes} mins · {quiz.total_marks} marks</span>
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
      <QuizReviewModal
        quizId={selectedReviewId}
        onClose={() => setSelectedReviewId(null)}
      />

      {/* Analytics Modal */}
      <QuizAnalyticsModal
        quizId={selectedAnalyticsId}
        onClose={() => setSelectedAnalyticsId(null)}
      />
    </div>
  )
}
