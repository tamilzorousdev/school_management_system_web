import { Link } from '@tanstack/react-router'
import { Trophy } from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useStudentResults, type StudentExamResult } from '../api'
import { gradeTone, marksText, percentText, rankText, RESULT_STATUS } from '../labels'

export function StudentResults({ studentId }: { studentId: number }) {
  const results = useStudentResults(studentId)
  if (results.isError) {
    return (
      <Card>
        <ErrorState message={results.error.message} onRetry={() => results.refetch()} />
      </Card>
    )
  }
  if (results.isPending) return <Skeleton className='h-64 w-full rounded-xl' />
  if (!results.data.length) {
    return (
      <Card className='p-4 sm:p-6'>
        <EmptyState
          icon={Trophy}
          title='No published results yet'
          description='Exam results show here once the school publishes them.'
        />
      </Card>
    )
  }
  return (
    <div className='grid gap-4'>
      {results.data.map((result) => (
        <ResultCard key={result.exam.id} result={result} />
      ))}
    </div>
  )
}

function ResultCard({ result }: { result: StudentExamResult }) {
  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3'>
        <div className='grid min-w-0'>
          <Link
            to='/exams'
            search={{ tab: 'results', exam_id: result.exam.id }}
            className='truncate font-bold hover:text-primary hover:underline'
          >
            {result.exam.name}
          </Link>
          <span className='text-xs text-muted-foreground'>
            Class {result.class_name} - {result.section_name} · {formatDate(result.exam.start_date)}{' '}
            to {formatDate(result.exam.end_date)}
          </span>
        </div>
        <div className='flex flex-wrap items-center gap-1.5'>
          {result.grade && <Badge tone={gradeTone(result.grade)}>Grade {result.grade}</Badge>}
          <Badge tone={RESULT_STATUS[result.result].tone}>
            {RESULT_STATUS[result.result].label}
          </Badge>
        </div>
      </div>
      <dl className='grid grid-cols-2 gap-3 border-b px-4 py-3 text-sm sm:grid-cols-5'>
        <Stat label='Total' value={`${result.total} / ${result.max_total}`} />
        <Stat label='Percentage' value={percentText(result.percent)} />
        <Stat
          label='Percentile'
          value={
            result.percentile !== null && result.percentile !== undefined
              ? `${result.percentile}%`
              : '—'
          }
        />
        <Stat
          label='Section rank'
          value={`${rankText(result.section_rank)} of ${result.section_size}`}
        />
        <Stat label='Class rank' value={`${rankText(result.class_rank)} of ${result.class_size}`} />
      </dl>
      <ul className='grid divide-y sm:grid-cols-2 sm:divide-y-0'>
        {result.subjects.map((subject) => (
          <li
            key={subject.subject_id}
            className='flex items-center justify-between gap-2 px-4 py-2 text-sm sm:border-b'
          >
            <span className='flex min-w-0 items-center gap-1.5'>
              <span className='font-mono text-[11px] font-bold text-primary'>{subject.code}</span>
              <span className='truncate'>{subject.name}</span>
            </span>
            <span
              className={cn(
                'tabular shrink-0 font-semibold',
                subject.passed === false && 'text-destructive'
              )}
            >
              {marksText(subject.marks, subject.is_absent)}
              <span className='font-normal text-muted-foreground'> / {subject.max_marks}</span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className='grid gap-0.5'>
      <dt className='text-xs text-muted-foreground'>{label}</dt>
      <dd className='tabular font-bold'>{value}</dd>
    </div>
  )
}
