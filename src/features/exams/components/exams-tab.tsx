import { useState } from 'react'
import {
  BookOpenCheck,
  ClipboardCheck,
  Ellipsis,
  PencilLine,
  Plus,
  Send,
  SquarePen,
  Trash2,
  Trophy,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import { examsApi, useExamMutation, useExams, type Exam } from '../api'
import { EXAM_STATUS } from '../labels'
import type { ExamsSearch, ExamTab } from '../search'
import { ExamModal } from './exam-modal'
import { MarksProgress } from './marks-progress'
import { PapersModal } from './papers-modal'
import { PublishDialog } from './publish-dialog'

const LIMIT = 20

type Modal =
  | { kind: 'create' }
  | { kind: 'edit'; exam: Exam }
  | { kind: 'papers'; exam: Exam }
  | { kind: 'papers'; exam: Exam }
  | { kind: 'publish'; exam: Exam }
  | { kind: 'delete'; exam: Exam }

export function ExamsTab({
  search,
  canManage,
  onSearchChange,
  onPageChange,
  onOpen,
}: {
  search: ExamsSearch
  canManage: boolean
  onSearchChange: (patch: Partial<ExamsSearch>) => void
  onPageChange: (page: number) => void
  onOpen: (tab: ExamTab, examId?: number) => void
}) {
  const page = search.page ?? 1
  const exams = useExams({ page, limit: LIMIT, search: search.search, status: search.status })
  const [modal, setModal] = useState<Modal | null>(null)
  const remove = useExamMutation((id: number) => examsApi.remove(id))
  const total = exams.data?.total
  const filtered = Boolean(search.search || search.status)

  useShortcut('app.refresh', () => void exams.refetch())

  const columns: Column<Exam>[] = [
    {
      key: 'name',
      header: 'Exam',
      cell: (exam) => (
        <div className='grid min-w-0'>
          <span className='truncate font-bold'>{exam.name}</span>
          <span className='truncate text-xs text-muted-foreground'>
            {[exam.academic_year.name, exam.term?.name].filter(Boolean).join(' · ')}
          </span>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Dates',
      cell: (exam) => (
        <div className='grid min-w-0'>
          <span className='tabular text-sm font-medium whitespace-nowrap'>
            {formatDate(exam.start_date)} – {formatDate(exam.end_date)}
          </span>
          {canManage && (
            <button
              type='button'
              onClick={() => setModal({ kind: 'papers', exam })}
              className='text-left text-xs font-semibold text-primary hover:underline'
            >
              Subject exam dates
            </button>
          )}
        </div>
      ),
    },
    {
      key: 'classes',
      header: 'Classes',
      hideBelow: 'lg',
      cell: (exam) => <ClassBadges exam={exam} />,
    },
    {
      key: 'marks',
      header: 'Marks entered',
      cell: (exam) => <MarksProgress entered={exam.marks_entered} expected={exam.marks_expected} />,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (exam) => (
        <Badge tone={EXAM_STATUS[exam.status].tone}>{EXAM_STATUS[exam.status].label}</Badge>
      ),
    },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      cell: (exam) => (
        <RowActions exam={exam} canManage={canManage} onOpen={onOpen} onModal={setModal} />
      ),
    },
  ]

  return (
    <div className='grid gap-4'>
      <Card className='overflow-hidden'>
        <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
          <h2 className='font-bold'>Exams</h2>
          {canManage && (
            <Button size='sm' onClick={() => setModal({ kind: 'create' })}>
              <Plus />
              New exam
            </Button>
          )}
        </div>
        <ListToolbar
          summary={total !== undefined ? `${total} ${total === 1 ? 'exam' : 'exams'}` : undefined}
          onClear={
            filtered ? () => onSearchChange({ search: undefined, status: undefined }) : undefined
          }
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => onSearchChange({ search: value || undefined })}
            placeholder='Search exams'
            label='Search exams'
          />
          <FilterSelect
            id='exam-status'
            label='Filter by status'
            value={search.status}
            allLabel='All statuses'
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'published', label: 'Published' },
            ]}
            onChange={(value) =>
              onSearchChange({ status: value as ExamsSearch['status'] | undefined })
            }
          />
        </ListToolbar>
        <DataTable
          rows={exams.data?.items ?? []}
          columns={columns}
          rowKey={(exam) => exam.id}
          loading={exams.isFetching}
          error={exams.isError ? exams.error.message : null}
          onRetry={() => exams.refetch()}
          empty={{
            icon: ClipboardCheck,
            title: filtered ? 'No exams match' : 'No exams yet',
            description: filtered
              ? 'Try another search or clear the filters.'
              : canManage
                ? 'Create an exam, pick the classes that write it and enter marks.'
                : 'Exams created by the office show here.',
            action:
              canManage && !filtered ? (
                <Button size='sm' onClick={() => setModal({ kind: 'create' })}>
                  <Plus />
                  New exam
                </Button>
              ) : undefined,
          }}
          pagination={
            total !== undefined
              ? { page, limit: LIMIT, total, label: 'exams', onPageChange }
              : undefined
          }
          card={(exam) => (
            <div className='grid gap-2'>
              <div className='flex items-start justify-between gap-2'>
                <div className='grid min-w-0'>
                  <span className='truncate font-bold'>{exam.name}</span>
                  <span className='tabular text-xs text-muted-foreground'>
                    {formatDate(exam.start_date)} – {formatDate(exam.end_date)}
                  </span>
                </div>
                <div className='flex shrink-0 items-center gap-1'>
                  <Badge tone={EXAM_STATUS[exam.status].tone}>
                    {EXAM_STATUS[exam.status].label}
                  </Badge>
                  <RowActions
                    exam={exam}
                    canManage={canManage}
                    onOpen={onOpen}
                    onModal={setModal}
                  />
                </div>
              </div>
              <ClassBadges exam={exam} />
              <MarksProgress entered={exam.marks_entered} expected={exam.marks_expected} />
            </div>
          )}
        />
      </Card>

      <ExamModal
        open={modal?.kind === 'create' || modal?.kind === 'edit'}
        exam={modal?.kind === 'edit' ? modal.exam : undefined}
        onClose={() => setModal(null)}
        onCreated={(exam) => setModal({ kind: 'papers', exam })}
      />
      {modal?.kind === 'papers' && (
        <PapersModal
          examId={modal.exam.id}
          examName={modal.exam.name}
          onClose={() => setModal(null)}
        />
      )}
      <PublishDialog
        exam={modal?.kind === 'publish' ? modal.exam : null}
        onClose={() => setModal(null)}
      />
      <ConfirmDialog
        open={modal?.kind === 'delete'}
        onOpenChange={(next) => !next && setModal(null)}
        title={`Delete ${modal?.kind === 'delete' ? modal.exam.name : 'exam'}?`}
        description='The exam and every mark entered for it are removed. This cannot be undone.'
        confirmText='Delete exam'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          if (modal?.kind !== 'delete') return
          try {
            await remove.mutateAsync(modal.exam.id)
            alerts.success(`${modal.exam.name} deleted`)
            setModal(null)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      />
    </div>
  )
}

function ClassBadges({ exam }: { exam: Exam }) {
  const shown = exam.classes.slice(0, 5)
  return (
    <div className='flex flex-wrap gap-1'>
      {shown.map((item) => (
        <Badge key={item.id} tone='neutral'>
          {item.name}
        </Badge>
      ))}
      {exam.classes.length > shown.length && (
        <Badge tone='neutral'>+{exam.classes.length - shown.length}</Badge>
      )}
    </div>
  )
}

function RowActions({
  exam,
  canManage,
  onOpen,
  onModal,
}: {
  exam: Exam
  canManage: boolean
  onOpen: (tab: ExamTab, examId?: number) => void
  onModal: (modal: Modal) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={`Actions for ${exam.name}`}
          onClick={(event) => event.stopPropagation()}
        >
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onSelect={() => onOpen('marks', exam.id)}>
          <PencilLine />
          {canManage ? 'Enter marks' : 'View marks'}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onOpen('results', exam.id)}>
          <Trophy />
          View results
        </DropdownMenuItem>
        {canManage && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onModal({ kind: 'edit', exam })}>
              <SquarePen />
              Edit exam
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onModal({ kind: 'papers', exam })}>
              <BookOpenCheck />
              Subject exam dates
            </DropdownMenuItem>
            {exam.status === 'draft' && (
              <>
                <DropdownMenuItem onSelect={() => onModal({ kind: 'publish', exam })}>
                  <Send />
                  Publish results
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onSelect={() => onModal({ kind: 'delete', exam })}>
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
