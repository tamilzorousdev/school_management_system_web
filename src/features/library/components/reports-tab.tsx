import type { ReactNode } from 'react'
import { BookCopy, IndianRupee, Library } from 'lucide-react'
import { ErrorState, StatCard } from '@/components/common/display'
import { FilterSelect } from '@/components/common/list-toolbar'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { wholeRupees } from '@/features/fees/labels'
import {
  MEMBER_TYPES,
  useCategoryReport,
  useClassReport,
  useMostBorrowed,
  useStockReport,
  useTopReaders,
} from '../api'
import { COPY_STATUS, MEMBER_TYPE, badgeOf, optionsOf } from '../labels'
import { oneOf, type LibraryTabProps } from '../search'
import { Bar, BookLine, MemberLine, Section } from './library-parts'

function ReportTable({
  loading,
  error,
  onRetry,
  empty,
  head,
  children,
  count,
}: {
  loading: boolean
  error?: string | null
  onRetry?: () => void
  empty: string
  head: ReactNode
  children: ReactNode
  count: number
}) {
  if (error) return <ErrorState message={error} onRetry={onRetry} />
  if (loading) {
    return (
      <div className='grid gap-2 p-4'>
        <Skeleton className='h-8' />
        <Skeleton className='h-8' />
        <Skeleton className='h-8' />
      </div>
    )
  }
  if (!count) return <p className='px-4 py-8 text-center text-sm text-muted-foreground'>{empty}</p>
  return (
    <div className='overflow-x-auto'>
      <table className='w-full min-w-[32rem] text-sm'>
        <thead className='bg-muted/50 text-left text-xs text-muted-foreground'>{head}</thead>
        <tbody className='divide-y'>{children}</tbody>
      </table>
    </div>
  )
}

const th = 'px-4 py-2 font-semibold'
const td = 'px-4 py-2'

export function ReportsTab({ search, onChange }: LibraryTabProps) {
  const memberType = oneOf(MEMBER_TYPES, search.member_type)
  const params = { from: search.from, to: search.to, member_type: memberType, limit: 10 }
  const mostBorrowed = useMostBorrowed(params)
  const topReaders = useTopReaders(params)
  const categories = useCategoryReport(params)
  const classes = useClassReport(params)
  const stock = useStockReport()
  const maxLoans = Math.max(0, ...(mostBorrowed.data ?? []).map((row) => row.loans))
  const maxStatus = Math.max(0, ...(stock.data?.by_status ?? []).map((row) => row.copies))

  return (
    <div className='grid gap-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <Input
          type='date'
          aria-label='From'
          placeholder='From'
          value={search.from ?? ''}
          onChange={(event) => onChange({ from: event.target.value || undefined })}
          className='w-40'
        />
        <span className='text-xs text-muted-foreground'>to</span>
        <Input
          type='date'
          aria-label='To'
          placeholder='To'
          value={search.to ?? ''}
          onChange={(event) => onChange({ to: event.target.value || undefined })}
          className='w-40'
        />
        <FilterSelect
          id='report-member-type'
          label='Filter by member type'
          allLabel='Students and staff'
          value={memberType}
          options={optionsOf(MEMBER_TYPE)}
          onChange={(member_type) => onChange({ member_type })}
        />
        <span className='text-xs text-muted-foreground'>
          {search.from || search.to ? '' : 'Showing this academic year'}
        </span>
      </div>

      <div className='grid gap-3 sm:grid-cols-3'>
        <StatCard
          label='Titles'
          value={stock.data?.titles ?? 0}
          icon={Library}
          loading={stock.isPending}
        />
        <StatCard
          label='Copies'
          value={stock.data?.copies ?? 0}
          icon={BookCopy}
          tone='success'
          loading={stock.isPending}
        />
        <StatCard
          label='Stock value'
          value={wholeRupees(stock.data?.value ?? 0)}
          icon={IndianRupee}
          tone='warning'
          loading={stock.isPending}
        />
      </div>

      <div className='grid gap-4 xl:grid-cols-2'>
        <Section title='Most borrowed'>
          <ReportTable
            loading={mostBorrowed.isPending}
            error={mostBorrowed.isError ? mostBorrowed.error.message : null}
            onRetry={() => mostBorrowed.refetch()}
            empty='No loans in this period.'
            count={mostBorrowed.data?.length ?? 0}
            head={
              <tr>
                <th className={th}>Book</th>
                <th className={th}>Loans</th>
                <th className={`${th} text-right`}>Readers</th>
              </tr>
            }
          >
            {mostBorrowed.data?.map((row) => (
              <tr key={row.book_id}>
                <td className={td}>
                  <BookLine
                    bookId={row.book_id}
                    title={row.title}
                    sub={[row.authors, row.category].filter(Boolean).join(' · ')}
                  />
                </td>
                <td className={`${td} w-40`}>
                  <div className='grid gap-1'>
                    <span className='tabular font-semibold'>{row.loans}</span>
                    <Bar value={row.loans} max={maxLoans} />
                  </div>
                </td>
                <td className={`${td} tabular text-right`}>{row.readers}</td>
              </tr>
            ))}
          </ReportTable>
        </Section>

        <Section title='Top readers'>
          <ReportTable
            loading={topReaders.isPending}
            error={topReaders.isError ? topReaders.error.message : null}
            onRetry={() => topReaders.refetch()}
            empty='No readers in this period.'
            count={topReaders.data?.length ?? 0}
            head={
              <tr>
                <th className={th}>Member</th>
                <th className={`${th} text-right`}>Loans</th>
                <th className={`${th} text-right`}>Late</th>
              </tr>
            }
          >
            {topReaders.data?.map((row) => (
              <tr key={row.member.id}>
                <td className={td}>
                  <MemberLine member={row.member} size='sm' />
                </td>
                <td className={`${td} tabular text-right font-semibold`}>{row.loans}</td>
                <td className={`${td} tabular text-right`}>{row.late_returns}</td>
              </tr>
            ))}
          </ReportTable>
        </Section>

        <Section title='By category'>
          <ReportTable
            loading={categories.isPending}
            error={categories.isError ? categories.error.message : null}
            onRetry={() => categories.refetch()}
            empty='No categories yet.'
            count={categories.data?.length ?? 0}
            head={
              <tr>
                <th className={th}>Category</th>
                <th className={`${th} text-right`}>Titles</th>
                <th className={`${th} text-right`}>Copies</th>
                <th className={`${th} text-right`}>Loans</th>
                <th className={`${th} text-right`}>Value</th>
              </tr>
            }
          >
            {categories.data?.map((row) => (
              <tr key={row.category_id ?? row.category}>
                <td className={`${td} font-semibold`}>{row.category}</td>
                <td className={`${td} tabular text-right`}>{row.titles}</td>
                <td className={`${td} tabular text-right`}>
                  {row.available}/{row.copies}
                </td>
                <td className={`${td} tabular text-right`}>{row.loans}</td>
                <td className={`${td} tabular text-right`}>{wholeRupees(row.stock_value)}</td>
              </tr>
            ))}
          </ReportTable>
        </Section>

        <Section title='Stock by status'>
          <ReportTable
            loading={stock.isPending}
            error={stock.isError ? stock.error.message : null}
            onRetry={() => stock.refetch()}
            empty='No copies yet.'
            count={stock.data?.by_status.length ?? 0}
            head={
              <tr>
                <th className={th}>Status</th>
                <th className={th}>Copies</th>
                <th className={`${th} text-right`}>Value</th>
              </tr>
            }
          >
            {stock.data?.by_status.map((row) => (
              <tr key={row.status}>
                <td className={`${td} font-semibold`}>{badgeOf(COPY_STATUS, row.status).label}</td>
                <td className={`${td} w-48`}>
                  <div className='grid gap-1'>
                    <span className='tabular'>{row.copies}</span>
                    <Bar value={row.copies} max={maxStatus} />
                  </div>
                </td>
                <td className={`${td} tabular text-right`}>{wholeRupees(row.value)}</td>
              </tr>
            ))}
          </ReportTable>
        </Section>
      </div>

      <Section title='Reading by class'>
        <ReportTable
          loading={classes.isPending}
          error={classes.isError ? classes.error.message : null}
          onRetry={() => classes.refetch()}
          empty='No class data in this period.'
          count={classes.data?.length ?? 0}
          head={
            <tr>
              <th className={th}>Section</th>
              <th className={`${th} text-right`}>Members</th>
              <th className={`${th} text-right`}>Loans</th>
              <th className={`${th} text-right`}>Overdue</th>
              <th className={`${th} text-right`}>Visits</th>
              <th className={`${th} text-right`}>Period attendance</th>
            </tr>
          }
        >
          {classes.data?.map((row) => {
            const marked = row.period_present + row.period_absent
            return (
              <tr key={row.section_id}>
                <td className={`${td} font-semibold`}>{row.section}</td>
                <td className={`${td} tabular text-right`}>
                  {row.members}/{row.students}
                </td>
                <td className={`${td} tabular text-right`}>{row.loans}</td>
                <td className={`${td} tabular text-right ${row.overdue ? 'text-destructive' : ''}`}>
                  {row.overdue}
                </td>
                <td className={`${td} tabular text-right`}>{row.visits}</td>
                <td className={`${td} tabular text-right`}>
                  {marked ? `${Math.round((row.period_present / marked) * 100)}%` : '—'}
                </td>
              </tr>
            )
          })}
        </ReportTable>
      </Section>
    </div>
  )
}
