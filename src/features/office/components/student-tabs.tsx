import { useState } from 'react'
import {
  Award,
  BookOpen,
  CalendarCheck,
  CircleOff,
  DoorOpen,
  FileText,
  HeartPulse,
  ImageIcon,
  IndianRupee,
  MessageSquareWarning,
  Paperclip,
  Printer,
  School,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react'
import { Combobox } from '@/components/common/combobox'
import { DetailList, EmptyState, ErrorState } from '@/components/common/display'
import { FilterSelect } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DOCUMENT_TYPE_LABELS } from '@/features/students/labels'
import { formatDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  useStudentDocuments,
  useStudentTimeline,
  type ExamLine,
  type Student360,
  type StudentDocument,
  type TimelineType,
} from '../api'
import { DOCUMENT_STATUS, TIMELINE_LABEL, TIMELINE_OPTIONS, percent, rupees } from '../labels'

function Metric({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className='grid min-w-0 gap-0.5 rounded-lg border bg-muted/30 px-3 py-2'>
      <span className='truncate text-[11px] font-semibold text-muted-foreground'>{label}</span>
      <span className={`tabular truncate text-lg font-extrabold ${tone ?? ''}`}>{value}</span>
    </div>
  )
}

const rankText = (rank: number | null, size: number) => (rank === null ? '—' : `${rank} of ${size}`)

export type PrintKey = 'year' | number

function examOptionLabel(exam: ExamLine) {
  const parts = [exam.exam_name]
  if (exam.percent !== null) parts.push(percent(exam.percent))
  if (exam.section_rank !== null) parts.push(`rank ${exam.section_rank}/${exam.section_size}`)
  else if (exam.class_rank !== null) parts.push(`rank ${exam.class_rank}/${exam.class_size}`)
  return parts.join(' · ')
}

export function OverviewTab({ data }: { data: Student360 }) {
  const { attendance, fees, counts } = data
  const countItems: { label: string; value: number; icon: LucideIcon }[] = [
    { label: 'Behaviour notes', value: counts.behaviour_notes, icon: MessageSquareWarning },
    { label: 'Achievements', value: counts.achievements, icon: Award },
    { label: 'Gate passes', value: counts.gate_passes, icon: DoorOpen },
    { label: 'Documents', value: counts.documents, icon: FileText },
    { label: 'Library books out', value: counts.library_books_out, icon: BookOpen },
    { label: 'Leave requests', value: counts.leave_requests, icon: CalendarCheck },
  ]
  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      <Card>
        <CardHeader>
          <CardTitle>Attendance this year</CardTitle>
          <Badge tone='info'>{percent(attendance.percent)}</Badge>
        </CardHeader>
        <CardContent className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
          <Metric label='School days' value={attendance.days} />
          <Metric label='Present' value={attendance.present} tone='text-success' />
          <Metric label='Absent' value={attendance.absent} tone='text-destructive' />
          <Metric label='Late' value={attendance.late} />
          <Metric label='Leave' value={attendance.leave} />
          <Metric label='Half day' value={attendance.half_day} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Fees this year</CardTitle>
          <Badge tone={fees.balance > 0 ? 'warning' : 'success'}>
            {fees.balance > 0 ? `${rupees(fees.balance)} due` : 'Nothing due'}
          </Badge>
        </CardHeader>
        <CardContent className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
          <Metric label='Total' value={rupees(fees.total)} />
          <Metric label='Paid' value={rupees(fees.paid)} tone='text-success' />
          <Metric label='Balance' value={rupees(fees.balance)} tone='text-warning' />
          <Metric
            label='Overdue'
            value={rupees(fees.overdue)}
            tone={fees.overdue > 0 ? 'text-destructive' : undefined}
          />
          <Metric label='Invoices' value={fees.invoices} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Latest exams</CardTitle>
        </CardHeader>
        <CardContent>
          {data.exams.length ? (
            <ExamList exams={data.exams.slice(0, 3)} />
          ) : (
            <p className='text-sm text-muted-foreground'>No published exam yet</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Years in school</CardTitle>
        </CardHeader>
        <CardContent>
          {data.years.length ? (
            <ol className='grid gap-2'>
              {data.years.map((year) => (
                <li
                  key={year.academic_year}
                  className='flex flex-wrap items-center gap-x-3 gap-y-1 text-sm'
                >
                  <span className='tabular w-16 shrink-0 font-bold'>{year.academic_year}</span>
                  <span className='min-w-0 flex-1 truncate'>
                    {year.class_section}
                    {year.roll_no !== null && (
                      <span className='text-muted-foreground'> · Roll {year.roll_no}</span>
                    )}
                  </span>
                  <Badge tone={year.status === 'active' ? 'success' : 'neutral'}>
                    {year.status.replace(/_/g, ' ')}
                  </Badge>
                </li>
              ))}
            </ol>
          ) : (
            <p className='text-sm text-muted-foreground'>No years on record</p>
          )}
        </CardContent>
      </Card>
      <Card className='lg:col-span-2'>
        <CardHeader>
          <CardTitle>Records</CardTitle>
        </CardHeader>
        <CardContent className='grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6'>
          {countItems.map((item) => (
            <div key={item.label} className='flex min-w-0 items-center gap-2 rounded-lg border p-2'>
              <item.icon className='size-4 shrink-0 text-muted-foreground' />
              <div className='grid min-w-0'>
                <span className='truncate text-[11px] font-semibold text-muted-foreground'>
                  {item.label}
                </span>
                <span className='tabular font-bold'>{item.value}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function ExamList({
  exams,
  onRankCard,
  printing,
}: {
  exams: ExamLine[]
  onRankCard?: (examId: number) => void
  printing?: PrintKey | null
}) {
  return (
    <ul className='grid gap-2'>
      {exams.map((exam) => (
        <li key={exam.exam_id} className='grid gap-1 rounded-lg border p-3'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='min-w-0 flex-1 truncate font-bold'>{exam.exam_name}</span>
            {exam.grade && <Badge tone='info'>{exam.grade}</Badge>}
            {exam.result && (
              <Badge tone={exam.result === 'pass' ? 'success' : 'danger'}>{exam.result}</Badge>
            )}
            {onRankCard && (
              <Button
                size='sm'
                variant='outline'
                aria-label={`Rank card for ${exam.exam_name}`}
                onClick={() => onRankCard(exam.exam_id)}
                loading={printing === exam.exam_id}
                disabled={printing !== null && printing !== exam.exam_id}
              >
                <FileText />
                Rank card
              </Button>
            )}
          </div>
          <div className='tabular flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground'>
            <span>
              <strong className='text-foreground'>{percent(exam.percent)}</strong> · {exam.total}/
              {exam.max_total}
            </span>
            <span>Section rank {rankText(exam.section_rank, exam.section_size)}</span>
            <span>Class rank {rankText(exam.class_rank, exam.class_size)}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function ExamsTab({
  data,
  onPrint,
  printing,
}: {
  data: Student360
  onPrint: (key: PrintKey) => void
  printing: PrintKey | null
}) {
  const [examId, setExamId] = useState<string | undefined>()
  const canPrint = Boolean(data.report_card_pdf_path)
  const options = data.exams.map((exam) => ({
    value: String(exam.exam_id),
    label: examOptionLabel(exam),
  }))
  const chosen = options.some((option) => option.value === examId) ? examId : undefined
  const key: PrintKey = chosen ? Number(chosen) : 'year'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exams and rank card</CardTitle>
      </CardHeader>
      <CardContent className='grid gap-4'>
        {canPrint && (
          <div className='flex flex-col gap-2 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-end'>
            <div className='grid min-w-0 flex-1 gap-1.5 sm:max-w-md'>
              <label
                htmlFor='office-report-card-for'
                className='text-xs font-semibold text-muted-foreground'
              >
                Report card for
              </label>
              <Combobox
                id='office-report-card-for'
                label='Report card for'
                placeholder='Whole year — all exams'
                allLabel='Whole year — all exams'
                searchPlaceholder='Search exams'
                emptyText='No published exam yet'
                value={chosen}
                options={options}
                onChange={setExamId}
                className='sm:w-full'
              />
            </div>
            <Button
              size='sm'
              className='h-9'
              onClick={() => onPrint(key)}
              loading={printing === key}
              disabled={printing !== null && printing !== key}
            >
              <Printer />
              Print / open
            </Button>
          </div>
        )}
        {data.exams.length ? (
          <ExamList
            exams={data.exams}
            onRankCard={canPrint ? (id) => onPrint(id) : undefined}
            printing={printing}
          />
        ) : (
          <EmptyState icon={School} title='No published exam yet' />
        )}
      </CardContent>
    </Card>
  )
}

export function HealthTab({ data }: { data: Student360 }) {
  const health = data.health
  if (!health)
    return (
      <Card>
        <EmptyState
          icon={HeartPulse}
          title='No health record'
          description='Allergies, conditions and medicines show here once the school records them.'
        />
      </Card>
    )
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Stethoscope className='size-4 text-primary' />
          Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DetailList
          items={[
            { label: 'Blood group', value: data.student.blood_group ?? '—' },
            { label: 'Allergies', value: health.allergies ?? 'None recorded' },
            { label: 'Conditions', value: health.conditions ?? 'None recorded' },
            { label: 'Medicines', value: health.medications ?? 'None recorded' },
            { label: 'Last check-up', value: formatDate(health.last_checkup_on) },
          ]}
        />
      </CardContent>
    </Card>
  )
}

const TIMELINE_ICON: Partial<Record<TimelineType, LucideIcon>> = {
  attendance: CalendarCheck,
  leave: CalendarCheck,
  fee_invoice: IndianRupee,
  fee_payment: IndianRupee,
  exam: School,
  gate: DoorOpen,
  behaviour: MessageSquareWarning,
  achievement: Award,
  document: FileText,
  library: BookOpen,
}

export function TimelineTab({
  studentId,
  type,
  onType,
}: {
  studentId: number
  type: TimelineType | undefined
  onType: (type: TimelineType | undefined) => void
}) {
  const timeline = useStudentTimeline(studentId, type, true)
  const items = timeline.data?.pages.flatMap((page) => page.items) ?? []
  const total = timeline.data?.pages[0]?.total ?? 0

  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-center gap-2 border-b px-4 py-3'>
        <FilterSelect
          id='office-timeline-type'
          label='Filter by type'
          allLabel='Everything'
          value={type}
          options={TIMELINE_OPTIONS}
          onChange={(value) => onType(value as TimelineType | undefined)}
        />
        {timeline.data && (
          <span className='tabular ml-auto text-xs text-muted-foreground'>
            {items.length} of {total}
          </span>
        )}
      </div>
      {timeline.isPending ? (
        <div className='grid gap-2 p-4'>
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className='h-14' />
          ))}
        </div>
      ) : timeline.isError ? (
        <ErrorState message={timeline.error.message} onRetry={() => timeline.refetch()} />
      ) : !items.length ? (
        <EmptyState
          icon={CircleOff}
          title={type ? `No ${TIMELINE_LABEL[type].toLowerCase()} entries` : 'Nothing yet'}
        />
      ) : (
        <div className='grid gap-0 p-4'>
          <ol className='relative grid gap-4 border-l pl-5'>
            {items.map((item, index) => {
              const Icon = TIMELINE_ICON[item.type] ?? FileText
              return (
                <li key={`${item.type}-${item.ref_id}-${item.at}-${index}`} className='relative'>
                  <span className='absolute top-0.5 -left-[31px] grid size-5 place-items-center rounded-full border bg-card text-primary'>
                    <Icon className='size-3' />
                  </span>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span className='min-w-0 font-semibold break-words'>{item.title}</span>
                    <Badge tone='neutral'>{TIMELINE_LABEL[item.type] ?? item.type}</Badge>
                  </div>
                  {item.detail && (
                    <p className='text-sm break-words text-muted-foreground'>{item.detail}</p>
                  )}
                  <span className='text-xs text-muted-foreground'>{formatDateTime(item.at)}</span>
                </li>
              )
            })}
          </ol>
          {timeline.hasNextPage && (
            <Button
              variant='outline'
              size='sm'
              className='mt-4 justify-self-center'
              loading={timeline.isFetchingNextPage}
              onClick={() => timeline.fetchNextPage()}
            >
              Load more
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

function DocumentRow({ document }: { document: StudentDocument }) {
  const isImage = Boolean(document.mime_type?.startsWith('image/'))
  const status = DOCUMENT_STATUS[document.status] ?? {
    label: document.status.replace(/_/g, ' '),
    tone: 'neutral' as const,
  }
  const body = (
    <>
      {isImage && document.thumbnail_url ? (
        <img
          src={document.thumbnail_url}
          alt=''
          loading='lazy'
          className='size-12 shrink-0 rounded-lg border object-cover'
        />
      ) : (
        <span className='grid size-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary'>
          {isImage ? <ImageIcon className='size-5' /> : <FileText className='size-5' />}
        </span>
      )}
      <span className='grid min-w-0 flex-1 gap-0.5'>
        <span className='flex flex-wrap items-center gap-1.5'>
          <span className='min-w-0 font-semibold break-words'>{document.title}</span>
          <Badge tone={status.tone} dot>
            {status.label}
          </Badge>
        </span>
        <span className='text-xs break-words text-muted-foreground'>
          {DOCUMENT_TYPE_LABELS[document.type] ?? document.type.replace(/_/g, ' ')} · Added{' '}
          {formatDate(document.created_at.slice(0, 10))}
          {document.verified_at && document.status !== 'pending'
            ? ` · ${status.label} ${formatDate(document.verified_at.slice(0, 10))}`
            : ''}
        </span>
        {document.remarks && (
          <span
            className={cn(
              'text-xs break-words',
              document.status === 'rejected'
                ? 'font-medium text-destructive'
                : 'text-muted-foreground'
            )}
          >
            {document.remarks}
          </span>
        )}
      </span>
    </>
  )
  const rowClass = cn(
    'flex min-w-0 items-center gap-3 rounded-xl border p-3',
    document.status === 'rejected' && 'border-destructive/30 bg-destructive/5'
  )
  return document.url ? (
    <a
      href={document.url}
      target='_blank'
      rel='noreferrer'
      aria-label={`Open ${document.title}`}
      className={cn(
        rowClass,
        'transition-colors outline-none hover:border-primary/40 focus-visible:ring-[3px] focus-visible:ring-ring/40'
      )}
    >
      {body}
    </a>
  ) : (
    <div className={rowClass}>{body}</div>
  )
}

export function DocumentsTab({ studentId }: { studentId: number }) {
  const documents = useStudentDocuments(studentId)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        {documents.data && documents.data.length > 0 && (
          <span className='tabular text-xs text-muted-foreground'>
            {documents.data.length} {documents.data.length === 1 ? 'document' : 'documents'}
          </span>
        )}
      </CardHeader>
      <CardContent>
        {documents.isPending ? (
          <div className='grid gap-2'>
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className='h-16 rounded-xl' />
            ))}
          </div>
        ) : documents.isError ? (
          <ErrorState message={documents.error.message} onRetry={() => documents.refetch()} />
        ) : documents.data.length ? (
          <ul className='grid gap-2' data-testid='office-documents'>
            {documents.data.map((document) => (
              <li key={document.id}>
                <DocumentRow document={document} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Paperclip}
            title='No documents yet'
            description='Certificates and ID proofs show here once the school uploads them.'
          />
        )}
      </CardContent>
    </Card>
  )
}
