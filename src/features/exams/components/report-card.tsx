import { useState } from 'react'
import { Download, FileSpreadsheet, Printer } from 'lucide-react'
import { Combobox, type ComboboxOption } from '@/components/common/combobox'
import { EmptyState, ErrorState } from '@/components/common/display'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import {
  reportCardsApi,
  useReportCard,
  type ReportCard as ReportCardData,
  type ReportCardParams,
} from '../report-card-api'

const number = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '')

const scopeValue = (params: ReportCardParams) =>
  params.exam_id ? `exam:${params.exam_id}` : params.term_id ? `term:${params.term_id}` : 'year'

function scopeParams(value: string | undefined): Pick<ReportCardParams, 'term_id' | 'exam_id'> {
  const [kind, id] = (value ?? 'year').split(':')
  if (kind === 'term') return { term_id: Number(id) }
  if (kind === 'exam') return { exam_id: Number(id) }
  return {}
}

export function ReportCard({ studentId }: { studentId: number }) {
  const [params, setParams] = useState<ReportCardParams>({})
  const [busy, setBusy] = useState<'print' | 'download' | null>(null)
  const card = useReportCard(studentId, params)

  if (card.isError) {
    return (
      <Card>
        <ErrorState message={card.error.message} onRetry={() => card.refetch()} />
      </Card>
    )
  }
  if (card.isPending) return <Skeleton className='h-[32rem] w-full rounded-xl' />

  const data = card.data
  const options = data.options
  const yearOptions: ComboboxOption[] = options.academic_years.map((year) => ({
    value: String(year.id),
    label: year.name,
  }))
  const termName = (termId: number | null) => options.terms.find((term) => term.id === termId)?.name
  const scopeOptions: ComboboxOption[] = [
    { value: 'year', label: 'Whole year', hint: 'Every term side by side' },
    ...options.terms.map((term) => ({ value: `term:${term.id}`, label: term.name, hint: 'Term' })),
    ...options.exams.map((exam) => ({
      value: `exam:${exam.id}`,
      label: exam.name,
      hint: termName(exam.term_id) ?? 'Exam',
    })),
  ]
  const effective: ReportCardParams = { ...params, academic_year_id: data.scope.academic_year.id }
  const fileName = `Report-card-${data.student.admission_no}-${data.scope.exam?.name ?? data.scope.term?.name ?? data.scope.academic_year.name}.pdf`
  const empty = data.columns.length === 0

  const run = async (kind: 'print' | 'download') => {
    setBusy(kind)
    try {
      if (kind === 'print') await reportCardsApi.openPdf(studentId, effective)
      else
        await reportCardsApi.downloadPdf(studentId, effective, fileName.replace(/[^\w.-]+/g, '-'))
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className='grid gap-4'>
      <Card className='flex-row flex-wrap items-end gap-3 p-3 sm:p-4'>
        <div className='grid gap-1'>
          <span className='text-xs font-medium text-muted-foreground'>Academic year</span>
          <Combobox
            id='report-card-year'
            label='Academic year'
            placeholder='Choose a year'
            value={String(data.scope.academic_year.id)}
            options={yearOptions}
            onChange={(value) => value && setParams({ academic_year_id: Number(value) })}
            className='w-full sm:w-40'
          />
        </div>
        <div className='grid min-w-0 flex-1 gap-1 sm:flex-none'>
          <span className='text-xs font-medium text-muted-foreground'>Report for</span>
          <Combobox
            id='report-card-scope'
            label='Report for'
            placeholder='Whole year'
            value={scopeValue(params)}
            options={scopeOptions}
            onChange={(value) =>
              setParams({ academic_year_id: params.academic_year_id, ...scopeParams(value) })
            }
            className='w-full sm:w-64'
          />
        </div>
        <div className='ml-auto flex flex-wrap gap-2'>
          <Button
            variant='outline'
            disabled={empty}
            loading={busy === 'download'}
            onClick={() => run('download')}
          >
            <Download />
            Download PDF
          </Button>
          <Button disabled={empty} loading={busy === 'print'} onClick={() => run('print')}>
            <Printer />
            Print
          </Button>
        </div>
      </Card>

      {empty ? (
        <Card className='p-4 sm:p-6'>
          <EmptyState
            icon={FileSpreadsheet}
            title='No published results for this period'
            description='The report card fills in as the school publishes exam results.'
          />
        </Card>
      ) : (
        <div className='max-w-full overflow-x-auto'>
          <Sheet data={data} fetching={card.isFetching} />
        </div>
      )}
    </div>
  )
}

function getSubjectRemark(
  grade: string | null,
  percent: number | null,
  passed: boolean | null
): string {
  if (passed === false) return 'Needs Improvement'
  const g = (grade ?? '').toUpperCase()
  if (g === 'O' || g === 'A1' || (percent != null && percent >= 90)) return 'Outstanding'
  if (g === 'A+' || g === 'A2' || (percent != null && percent >= 80)) return 'Outstanding'
  if (g === 'A' || g === 'B1' || (percent != null && percent >= 70)) return 'Very Good'
  if (g === 'B+' || g === 'B2' || (percent != null && percent >= 60)) return 'Good'
  if (g === 'B' || g === 'C1' || (percent != null && percent >= 50)) return 'Above Average'
  if (g === 'C' || g === 'C2' || (percent != null && percent >= 40)) return 'Satisfactory'
  if (g === 'D' || g === 'E' || g === 'FAIL') return 'Needs Improvement'
  return 'Outstanding'
}

function getGradingScale(data: ReportCardData) {
  const sampleMax = data.subjects[0]?.cells[0]?.max_marks ?? data.subjects[0]?.max_total ?? 100
  if (sampleMax === 50) {
    return [
      { range: '46 - 50', grade: 'O' },
      { range: '41 - 45', grade: 'A+' },
      { range: '36 - 40', grade: 'A' },
      { range: '31 - 35', grade: 'B+' },
      { range: '26 - 30', grade: 'B' },
      { range: '18 - 25', grade: 'C' },
      { range: '0 - 17', grade: 'Fail' },
    ]
  }
  if (data.grade_scale && data.grade_scale.length > 0) {
    return data.grade_scale.map((step) => ({
      range: `${step.min} - ${step.max}`,
      grade: step.grade === 'E' ? 'Fail' : step.grade,
    }))
  }
  return [
    { range: '91 - 100', grade: 'O' },
    { range: '81 - 90', grade: 'A+' },
    { range: '71 - 80', grade: 'A' },
    { range: '61 - 70', grade: 'B+' },
    { range: '51 - 60', grade: 'B' },
    { range: '36 - 50', grade: 'C' },
    { range: '0 - 35', grade: 'Fail' },
  ]
}

function Sheet({ data, fetching }: { data: ReportCardData; fetching: boolean }) {
  const { school, student, scope } = data
  const gradingScale = getGradingScale(data)
  const isMultiExam = data.columns.length > 1

  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[820px] bg-white p-2 text-black shadow-sm transition-opacity sm:p-3',
        fetching && 'opacity-60'
      )}
      aria-label={`${scope.title} of ${student.full_name}`}
    >
      <div className='border-[1.5px] border-black bg-white p-2 sm:p-3'>
        <div className='border border-black bg-white'>
          <div className='grid grid-cols-[92px_1fr] border-b border-black'>
            <div className='flex items-center justify-center border-r border-black bg-white p-2'>
              {school.logo_url ? (
                <img
                  src={school.logo_url}
                  alt={`${school.name} logo`}
                  className='max-h-16 max-w-full object-contain'
                />
              ) : (
                <span className='text-center text-[9px] leading-tight font-medium text-slate-400'>
                  School
                  <br />
                  Logo
                </span>
              )}
            </div>

            <div className='flex flex-col justify-between bg-white'>
              <div className='border-b border-black px-3 py-2 text-center'>
                <h1 className='text-[12px] font-bold tracking-wide text-[#E53E3E] uppercase sm:text-sm'>
                  {school.name}
                </h1>
              </div>
              <div className='border-b border-black px-3 py-1 text-center text-[9px] font-medium text-[#E53E3E] sm:text-[10px]'>
                {school.address || '24, ABC street, DEF Road, Mumbai'}
              </div>
              <div className='px-3 py-1 text-center text-[9px] font-medium text-[#E53E3E] sm:text-[10px]'>
                Phone: {school.phone || '9876543210'} &nbsp;&nbsp;&nbsp; Email:{' '}
                {school.email || 'admin@saphss.com'}
              </div>
            </div>
          </div>

          <div className='flex justify-center px-2 py-3'>
            <div className='min-w-[200px] px-3 py-1.5 text-center'>
              <p className='text-[10px] font-bold text-[#111827] uppercase sm:text-[11px]'>
                {scope.term?.name
                  ? `${scope.term.name} Report Card`
                  : scope.exam?.name
                    ? `${scope.exam.name} Report Card`
                    : scope.title || 'Term - 1 Report Card'}
              </p>
              <p className='text-[8px] font-semibold text-[#111827] sm:text-[9px]'>
                Academic Year {scope.academic_year.name}
              </p>
            </div>
          </div>

          <div className='px-2 pb-2 text-[9px] sm:text-[10px]'>
            <div className='grid grid-cols-3 items-baseline gap-2'>
              <div className='flex items-baseline gap-1'>
                <span className='shrink-0 font-bold text-[#111827]'>Roll No:</span>
                <span className='flex-1 border-b border-black pb-0.5 text-center font-medium'>
                  {student.roll_no ?? '—'}
                </span>
              </div>
              <div className='flex items-baseline gap-1'>
                <span className='shrink-0 font-bold text-[#111827]'>Class & Div:</span>
                <span className='flex-1 border-b border-black pb-0.5 text-center font-medium'>
                  {[student.class_name, student.section_name].filter(Boolean).join(' - ') || '—'}
                </span>
              </div>
              <div className='flex items-baseline gap-1'>
                <span className='shrink-0 font-bold text-[#111827]'>Attendance:</span>
                <span className='flex-1 border-b border-black pb-0.5 text-center font-medium'>
                  {data.attendance.working_days
                    ? `${number(data.attendance.present_days)}/${data.attendance.working_days}`
                    : data.attendance.percent != null
                      ? `${number(data.attendance.percent)}%`
                      : '—'}
                </span>
              </div>
            </div>

            <div className='mt-2 grid grid-cols-[1fr_auto] items-baseline gap-3 sm:grid-cols-[1.4fr_1fr]'>
              <div className='flex items-baseline gap-1'>
                <span className='shrink-0 font-bold text-[#111827]'>Student Name:</span>
                <span className='flex-1 border-b border-black px-2 pb-0.5 font-medium'>
                  {student.full_name}
                </span>
              </div>
              <div className='flex min-w-[120px] items-baseline gap-1'>
                <span className='shrink-0 font-bold text-[#111827]'>GR No:</span>
                <span className='flex-1 border-b border-black pb-0.5 text-center font-medium'>
                  {student.admission_no}
                </span>
              </div>
            </div>
          </div>

          <div className='overflow-x-auto px-2 pb-2'>
            <table className='w-full border-collapse border border-black text-[9px] sm:text-[10px]'>
              <thead>
                <tr className='bg-white font-bold text-[#111827]'>
                  <th className='w-8 border border-black py-1 text-center sm:w-10'>#</th>
                  <th className='border border-black px-2 py-1 text-left'>Subject</th>
                  {isMultiExam ? (
                    <>
                      {data.columns.map((col) => (
                        <th key={col.exam_id} className='border border-black px-1 py-1 text-center'>
                          {col.name}
                        </th>
                      ))}
                      <th className='border border-black px-1 py-1 text-center'>Total</th>
                      <th className='border border-black px-1 py-1 text-center'>Marks</th>
                      <th className='border border-black px-1 py-1 text-center'>Grade</th>
                      <th className='border border-black px-1 py-1 text-center'>Remarks</th>
                    </>
                  ) : (
                    <>
                      <th className='border border-black px-1 py-1 text-center'>Total</th>
                      <th className='border border-black px-1 py-1 text-center'>Marks</th>
                      <th className='border border-black px-1 py-1 text-center'>Grade</th>
                      <th className='border border-black px-1 py-1 text-center'>Remarks</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.subjects.map((subj, idx) => {
                  const totalMarks = subj.cells[0]?.max_marks ?? subj.max_total
                  const marksObtained = subj.cells[0]?.is_absent
                    ? 'AB'
                    : subj.cells[0]?.marks != null
                      ? number(subj.cells[0].marks)
                      : number(subj.total)
                  const grade = subj.grade ?? '—'
                  const remark = getSubjectRemark(grade, subj.percent, subj.passed)

                  return (
                    <tr key={subj.subject_id}>
                      <td className='border border-black py-1 text-center font-medium'>
                        {idx + 1}
                      </td>
                      <td className='border border-black px-2 py-1 font-medium'>{subj.name}</td>
                      {isMultiExam ? (
                        <>
                          {subj.cells.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className='border border-black px-1 py-1 text-center font-medium'
                            >
                              {cell?.is_absent
                                ? 'AB'
                                : cell?.marks != null
                                  ? number(cell.marks)
                                  : '—'}
                            </td>
                          ))}
                          <td className='border border-black px-1 py-1 text-center font-medium'>
                            {subj.max_total}
                          </td>
                          <td className='border border-black px-1 py-1 text-center font-medium'>
                            {number(subj.total)}
                          </td>
                          <td className='border border-black px-1 py-1 text-center font-medium'>
                            {grade}
                          </td>
                          <td className='border border-black px-1 py-1 text-center font-medium'>
                            {remark}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className='border border-black px-1 py-1 text-center font-medium'>
                            {totalMarks}
                          </td>
                          <td className='border border-black px-1 py-1 text-center font-medium'>
                            {marksObtained}
                          </td>
                          <td className='border border-black px-1 py-1 text-center font-medium'>
                            {grade}
                          </td>
                          <td className='border border-black px-1 py-1 text-center font-medium'>
                            {remark}
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })}

                <tr className='font-bold text-[#111827]'>
                  <td
                    colSpan={isMultiExam ? 2 + data.columns.length : 2}
                    className='border border-black px-2 py-1.5 text-right'
                  >
                    Total
                  </td>
                  <td className='border border-black px-1 py-1.5 text-center'>
                    {data.overall.max_total}
                  </td>
                  <td className='border border-black px-1 py-1.5 text-center'>
                    {number(data.overall.total)}
                  </td>
                  <td className='border border-black px-1 py-1.5 text-center'>
                    {data.overall.grade ?? '—'}
                  </td>
                  <td className='border border-black px-1 py-1.5 text-center'>
                    {data.overall.percent != null ? `${number(data.overall.percent)}%` : '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className='flex flex-col items-center justify-between gap-2 px-2 pb-2 text-[9px] sm:flex-row sm:text-[10px]'>
            <div className='flex items-baseline gap-1'>
              <span className='font-bold text-[#111827]'>Grade:</span>
              <span className='min-w-[40px] border-b border-black px-2 pb-0.5 text-center font-medium'>
                {data.overall.grade ?? '—'}
              </span>
            </div>
            <div className='flex items-baseline gap-1'>
              <span className='font-bold text-[#111827]'>Overall Percentage:</span>
              <span className='min-w-[60px] border-b border-black px-2 pb-0.5 text-center font-medium'>
                {data.overall.percent != null ? `${number(data.overall.percent)} %` : '—'}
              </span>
            </div>
            <div className='flex items-baseline gap-1'>
              <span className='font-bold text-[#111827]'>Rank:</span>
              <span className='min-w-[38px] border-b border-black px-2 pb-0.5 text-center font-medium'>
                {data.columns[0]?.class_rank ?? data.columns[0]?.section_rank ?? 1}
              </span>
            </div>
          </div>

          <div className='px-2 pb-2'>
            <table className='mx-auto w-full max-w-[480px] border-collapse border border-black text-center text-[8px] sm:text-[9px]'>
              <thead>
                <tr className='font-bold text-[#111827]'>
                  <th colSpan={gradingScale.length} className='border border-black px-1 py-1'>
                    Grading System
                  </th>
                </tr>
                <tr>
                  {gradingScale.map((item, idx) => (
                    <td key={idx} className='border border-black px-1 py-1 font-medium'>
                      {item.range}
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {gradingScale.map((item, idx) => (
                    <td key={idx} className='border border-black px-1 py-1 font-bold'>
                      {item.grade}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className='grid grid-cols-4 gap-2 px-2 pt-1 pb-2 text-center text-[9px] sm:gap-4 sm:text-[10px]'>
            <div>
              <p className='h-4 truncate font-medium text-[#111827]'>
                {student.class_teacher || ''}
              </p>
              <div className='my-1 flex h-14 items-center justify-center sm:h-16'>
                <div className='h-9 w-full max-w-28 border border-black bg-white sm:h-10' />
              </div>
              <p className='font-bold text-[#111827]'>Class Teacher</p>
            </div>
            <div>
              <p className='h-4 truncate font-medium text-[#111827]'>{student.parent_name || ''}</p>
              <div className='my-1 flex h-14 items-center justify-center sm:h-16'>
                <div className='h-9 w-full max-w-28 border border-black bg-white sm:h-10' />
              </div>
              <p className='font-bold text-[#111827]'>Parents</p>
            </div>
            <div>
              <p className='h-4' />
              <div className='mx-auto my-1 flex size-14 items-center justify-center sm:size-16'>
                {school.seal_url ? (
                  <img
                    src={school.seal_url}
                    alt='School seal'
                    className='size-full object-contain mix-blend-multiply'
                  />
                ) : (
                  <span className='size-full rounded-full border border-dashed border-black/40' />
                )}
              </div>
              <p className='font-bold text-[#111827]'>School Seal</p>
            </div>
            <div>
              <p className='h-4 truncate font-medium text-[#111827]'>
                {school.principal_name || 'Meenakshi Sundaram'}
              </p>
              <div className='my-1 flex h-14 items-center justify-center sm:h-16'>
                <div className='flex h-9 w-full max-w-28 items-center justify-center border border-black bg-white p-0.5 sm:h-10'>
                  {school.signature_url && (
                    <img
                      src={school.signature_url}
                      alt='Principal Signature'
                      className='size-full object-contain mix-blend-multiply'
                    />
                  )}
                </div>
              </div>
              <p className='font-bold text-[#111827]'>Principal</p>
            </div>
          </div>

          <div className='pb-1 text-center text-[11px] font-bold text-[#111827]'>1</div>
        </div>
      </div>
    </div>
  )
}
