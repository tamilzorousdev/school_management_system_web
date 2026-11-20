import { useState } from 'react'
import {
  ChartColumnBig,
  ChevronDown,
  CircleCheck,
  CircleX,
  FileSpreadsheet,
  Hourglass,
  Medal,
  Send,
  Trophy,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState, ErrorState } from '@/components/common/display'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import {
  useClassToppers,
  useExam,
  useExamOptions,
  useSectionResults,
  type MarkSubject,
  type ResultRow,
} from '../api'
import {
  classOfSection,
  EXAM_STATUS,
  gradeTone,
  marksText,
  percentText,
  pickExam,
  pickSection,
  podiumTone,
  rankText,
  RESULT_STATUS,
} from '../labels'
import { reportCardsApi } from '../report-card-api'
import type { ExamsSearch, ResultFilter } from '../search'
import { ExamPicker, SectionPicker } from './exam-pickers'
import { Podium } from './podium'
import { PublishDialog } from './publish-dialog'

export function ResultsTab({
  examId,
  sectionId,
  result,
  canManage,
  onChange,
}: {
  examId?: number
  sectionId?: number
  result?: ResultFilter
  canManage: boolean
  onChange: (patch: Partial<ExamsSearch>) => void
}) {
  const exams = useExamOptions()
  const list = exams.data?.items ?? []
  const chosenExam = pickExam(list, examId, 'published')
  const exam = useExam(chosenExam)
  const detail = exam.data?.id === chosenExam ? exam.data : undefined
  const chosenSection = pickSection(detail, sectionId)
  const schoolClass = classOfSection(detail, chosenSection)
  const results = useSectionResults(chosenExam, chosenSection)
  const toppers = useClassToppers(chosenExam, schoolClass?.id)
  const [publishing, setPublishing] = useState(false)
  const [printing, setPrinting] = useState(false)
  const printCards = async (scope: { exam_id?: number; term_id?: number }) => {
    if (!chosenSection) return
    setPrinting(true)
    try {
      await reportCardsApi.openSectionPdf(chosenSection, scope)
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setPrinting(false)
    }
  }
  const data = results.data
  const summary = data?.summary
  const toggle = (value: ResultFilter) => onChange({ result: result === value ? undefined : value })
  const average = summary?.average_percent ?? null
  const rows = (data?.rows ?? []).filter((row) => {
    if (!result) return true
    if (result === 'below_average')
      return (
        row.result !== 'incomplete' &&
        average !== null &&
        row.percent !== null &&
        row.percent < average
      )
    return row.result === result
  })

  useShortcut('app.refresh', () => {
    void results.refetch()
    void toppers.refetch()
  })

  if (exams.data && !list.length) {
    return (
      <Card>
        <EmptyState
          icon={Trophy}
          title='No exams yet'
          description='Results show here once an exam has marks.'
        />
      </Card>
    )
  }

  const cards: Insight[] = [
    {
      key: 'passed',
      label: 'Passed',
      value: summary?.passed ?? 0,
      hint: `of ${summary?.students ?? 0} students`,
      icon: CircleCheck,
      tone: 'success',
      active: result === 'pass',
      onClick: () => toggle('pass'),
    },
    {
      key: 'failed',
      label: 'Failed',
      value: summary?.failed ?? 0,
      hint: 'Below pass marks or absent in a subject',
      icon: CircleX,
      tone: summary?.failed ? 'danger' : 'neutral',
      active: result === 'fail',
      onClick: () => toggle('fail'),
    },
    {
      key: 'incomplete',
      label: 'Incomplete',
      value: summary?.incomplete ?? 0,
      hint: 'Marks missing, not ranked',
      icon: Hourglass,
      tone: summary?.incomplete ? 'warning' : 'neutral',
      active: result === 'incomplete',
      onClick: () => toggle('incomplete'),
    },
    {
      key: 'average',
      label: 'Section average',
      value: percentText(summary?.average_percent ?? null),
      hint: `Highest ${percentText(summary?.highest_percent ?? null)} · click for below average`,
      icon: ChartColumnBig,
      tone: 'info',
      active: result === 'below_average',
      onClick: () => toggle('below_average'),
    },
  ]

  return (
    <div className='grid gap-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <ExamPicker
          exams={list}
          value={chosenExam}
          onChange={(exam_id) => onChange({ exam_id, section_id: undefined, result: undefined })}
        />
        <SectionPicker
          exam={detail}
          value={chosenSection}
          onChange={(section_id) => onChange({ section_id, result: undefined })}
        />
        {detail && (
          <Badge tone={EXAM_STATUS[detail.status].tone}>{EXAM_STATUS[detail.status].label}</Badge>
        )}
        {detail?.status === 'published' && chosenSection && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='sm' variant='outline' className='ml-auto' loading={printing}>
                <FileSpreadsheet />
                Report cards
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onSelect={() => printCards({ exam_id: detail.id })}>
                {detail.name} only
              </DropdownMenuItem>
              {detail.term && (
                <DropdownMenuItem onSelect={() => printCards({ term_id: detail.term!.id })}>
                  Whole {detail.term.name}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => printCards({})}>
                Whole year, every term
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {canManage && detail?.status === 'draft' && (
          <Button size='sm' className='ml-auto' onClick={() => setPublishing(true)}>
            <Send />
            Publish results
          </Button>
        )}
      </div>
      {detail?.status === 'draft' && (
        <p className='rounded-lg border border-warning/30 bg-warning/5 px-4 py-2 text-xs text-warning'>
          Draft results. Parents and teachers see them only after you publish.
        </p>
      )}

      {schoolClass && <Podium data={toppers.data} loading={toppers.isPending} />}
      <InsightCards items={cards} loading={!data} />

      {results.isError ? (
        <Card>
          <ErrorState message={results.error.message} onRetry={() => results.refetch()} />
        </Card>
      ) : (
        <Card className='overflow-hidden'>
          <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
            <h2 className='font-bold'>
              {data ? `Class ${data.section.name} by rank` : 'Results by rank'}
            </h2>
            {result ? (
              <Button size='sm' variant='ghost' onClick={() => onChange({ result: undefined })}>
                Showing {FILTER_LABELS[result]} · {rows.length} · Show all
              </Button>
            ) : (
              <span className='text-xs text-muted-foreground'>
                Equal totals share a rank (1, 2, 2, 4)
              </span>
            )}
          </div>
          <DataTable
            rows={rows}
            columns={resultColumns(data?.subjects ?? [])}
            rowKey={(row) => row.student_id}
            loading={results.isFetching}
            empty={
              result
                ? {
                    icon: Trophy,
                    title: `No ${FILTER_LABELS[result]} students`,
                    description: 'Click the card again or Show all to see every student.',
                  }
                : {
                    icon: Trophy,
                    title: 'No students in this section',
                    description: 'Results show once students are placed and marks are entered.',
                  }
            }
            card={(row) => <ResultCard row={row} subjects={data?.subjects ?? []} />}
          />
        </Card>
      )}
      <PublishDialog
        exam={publishing && detail ? detail : null}
        onClose={() => setPublishing(false)}
      />
    </div>
  )
}

const FILTER_LABELS: Record<ResultFilter, string> = {
  pass: 'passed',
  fail: 'failed',
  incomplete: 'incomplete',
  below_average: 'below average',
}

function RankCell({ rank }: { rank: number | null }) {
  if (rank !== null && rank <= 3) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-extrabold',
          podiumTone(rank)
        )}
        aria-label={`Rank ${rank}`}
      >
        <Medal className='size-3.5' />
        {rank}
      </span>
    )
  }
  return <span className='tabular font-semibold text-muted-foreground'>{rankText(rank)}</span>
}

function resultColumns(subjects: MarkSubject[]): Column<ResultRow>[] {
  return [
    { key: 'rank', header: 'Rank', cell: (row) => <RankCell rank={row.section_rank} /> },
    {
      key: 'student',
      header: 'Student',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='truncate font-bold'>{row.full_name}</span>
          <span className='truncate text-xs text-muted-foreground'>
            Roll {row.roll_no ?? '—'} · {row.admission_no}
          </span>
        </div>
      ),
    },
    ...subjects.map((subject): Column<ResultRow> => ({
      key: `subject-${subject.id}`,
      header: <span title={subject.name}>{subject.code}</span>,
      align: 'right',
      hideBelow: 'xl',
      cell: (row) => {
        const score = row.subjects.find((item) => item.subject_id === subject.id)
        return (
          <span
            className={cn(
              'tabular text-sm',
              score?.passed === false && 'font-semibold text-destructive',
              score?.passed === null && 'text-muted-foreground'
            )}
          >
            {marksText(score?.marks ?? null, score?.is_absent ?? false)}
          </span>
        )
      },
    })),
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      cell: (row) => (
        <span className='tabular font-bold'>
          {row.total}
          <span className='font-normal text-muted-foreground'> / {row.max_total}</span>
        </span>
      ),
    },
    {
      key: 'percent',
      header: '%',
      align: 'right',
      cell: (row) => <span className='tabular'>{percentText(row.percent)}</span>,
    },
    {
      key: 'grade',
      header: 'Grade',
      cell: (row) =>
        row.grade ? <Badge tone={gradeTone(row.grade)}>{row.grade}</Badge> : <span>—</span>,
    },
    {
      key: 'result',
      header: 'Result',
      cell: (row) => (
        <Badge tone={RESULT_STATUS[row.result].tone}>{RESULT_STATUS[row.result].label}</Badge>
      ),
    },
    {
      key: 'class-rank',
      header: 'Class rank',
      align: 'right',
      hideBelow: 'lg',
      cell: (row) => <span className='tabular'>{rankText(row.class_rank)}</span>,
    },
    {
      key: 'percentile',
      header: 'Percentile',
      align: 'right',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='tabular font-medium text-emerald-700'>
          {row.percentile !== null && row.percentile !== undefined ? `${row.percentile}%` : '—'}
        </span>
      ),
    },
  ]
}

function ResultCard({ row, subjects }: { row: ResultRow; subjects: MarkSubject[] }) {
  return (
    <div className='grid gap-2'>
      <div className='flex items-start justify-between gap-2'>
        <div className='flex min-w-0 items-center gap-2'>
          <RankCell rank={row.section_rank} />
          <div className='grid min-w-0'>
            <span className='truncate font-bold'>{row.full_name}</span>
            <span className='truncate text-xs text-muted-foreground'>
              Roll {row.roll_no ?? '—'} · Class rank {rankText(row.class_rank)}{row.percentile !== null && row.percentile !== undefined ? ` · ${row.percentile}th %ile` : ''}
            </span>
          </div>
        </div>
        <div className='flex shrink-0 gap-1'>
          {row.grade && <Badge tone={gradeTone(row.grade)}>{row.grade}</Badge>}
          <Badge tone={RESULT_STATUS[row.result].tone}>{RESULT_STATUS[row.result].label}</Badge>
        </div>
      </div>
      <span className='tabular text-sm font-bold'>
        {row.total} / {row.max_total} · {percentText(row.percent)}
      </span>
      <div className='flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground'>
        {subjects.map((subject) => {
          const score = row.subjects.find((item) => item.subject_id === subject.id)
          return (
            <span
              key={subject.id}
              className={cn('tabular', score?.passed === false && 'text-destructive')}
            >
              {subject.code} {marksText(score?.marks ?? null, score?.is_absent ?? false)}
            </span>
          )
        })}
      </div>
    </div>
  )
}
