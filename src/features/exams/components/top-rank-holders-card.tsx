import { Link } from '@tanstack/react-router'
import { ArrowRight, Award, Crown, GraduationCap, Medal, Trophy } from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/common/display'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useLatestToppers } from '../api'
import { studentsText } from '../labels'

export function TopRankHoldersCard() {
  const latest = useLatestToppers()
  const data = latest.data
  const classes = (data?.classes ?? []).filter((item) => item.toppers.length)
  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3.5 sm:px-5'>
        <div className='flex items-center gap-3'>
          <div className='grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20'>
            <Trophy className='size-5' />
          </div>
          <div className='grid gap-0.5'>
            <h2 className='text-sm font-bold tracking-tight text-foreground sm:text-base'>
              Top rank holders
            </h2>
            <p className='text-xs text-muted-foreground'>
              {data
                ? `${data.exam.name} · Published ${formatDate(data.exam.published_at)}`
                : 'Latest published exam, top 3 of each class'}
            </p>
          </div>
        </div>
        {data && (
          <Link
            to='/exams'
            search={{ tab: 'results', exam_id: data.exam.id }}
            className='inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-muted'
          >
            View results
            <ArrowRight className='size-3.5' />
          </Link>
        )}
      </div>
      {latest.isError ? (
        <ErrorState message={latest.error.message} onRetry={() => latest.refetch()} />
      ) : latest.isPending ? (
        <div className='grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3'>
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className='h-32 w-full rounded-lg' />
          ))}
        </div>
      ) : !classes.length ? (
        <EmptyState
          icon={Trophy}
          title='No results published yet'
          description='When an exam is published, its top 3 students of each class show here.'
        />
      ) : (
        <div className='grid gap-3.5 p-4 sm:grid-cols-2 xl:grid-cols-3'>
          {classes.map((item) => (
            <section
              key={item.class_id}
              className='grid content-start gap-2.5 rounded-xl border border-border/80 bg-card/60 p-3.5 shadow-2xs transition-all hover:border-primary/40 hover:shadow-xs'
            >
              <div className='flex items-center justify-between gap-2 border-b border-border/50 pb-2'>
                <span className='inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-muted/60 px-2 py-0.5 text-xs font-bold text-foreground'>
                  <GraduationCap className='size-3.5 text-primary' />
                  Class {item.class_name}
                </span>
                <span className='rounded-full bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground'>
                  {studentsText(item.students)}
                </span>
              </div>
              <ol
                className='grid gap-1.5'
                aria-label={`Top rank holders of class ${item.class_name}`}
              >
                {item.toppers.map((topper) => (
                  <li
                    key={topper.student_id}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg p-2 text-sm transition-colors',
                      topper.rank === 1
                        ? 'border border-amber-400/40 bg-amber-500/[0.08] dark:bg-amber-500/[0.14]'
                        : 'border border-border/50 bg-muted/30 hover:bg-muted/50'
                    )}
                  >
                    {topper.rank === 1 ? (
                      <span className='inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-500 px-1.5 py-0.5 text-[11px] font-black text-white shadow-xs'>
                        <Crown className='size-3 stroke-[2.5]' />
                        1
                      </span>
                    ) : topper.rank === 2 ? (
                      <span className='inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[11px] font-extrabold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'>
                        <Medal className='size-3' />
                        2
                      </span>
                    ) : (
                      <span className='inline-flex shrink-0 items-center gap-1 rounded-md border border-orange-300 bg-orange-100 px-1.5 py-0.5 text-[11px] font-extrabold text-orange-800 dark:border-orange-800 dark:bg-orange-950/70 dark:text-orange-200'>
                        <Award className='size-3' />
                        {topper.rank}
                      </span>
                    )}
                    <span className='min-w-0 flex-1 truncate font-semibold text-foreground'>
                      {topper.full_name}
                      <span className='font-normal text-muted-foreground'>
                        {' '}
                        · Sec {topper.section_name}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'tabular shrink-0 rounded-md px-2 py-0.5 text-xs font-bold',
                        topper.rank === 1
                          ? 'border border-amber-400/30 bg-amber-500/15 font-black text-amber-700 dark:text-amber-300'
                          : 'bg-background/80 text-foreground'
                      )}
                    >
                      {topper.percent}%
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </Card>
  )
}
