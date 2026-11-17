import { Award, Crown, Medal, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { LEVEL_LABELS, LEVEL_TONE } from '@/features/students/achievement-labels'
import { cn } from '@/lib/utils'
import type { LeaderboardRow } from '../api'

export function ActivityPodium({
  rows,
  title,
  loading,
}: {
  rows: LeaderboardRow[]
  title: string
  loading?: boolean
}) {
  if (loading) {
    return (
      <div className='grid gap-3.5 sm:grid-cols-3'>
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className='h-36 rounded-xl' />
        ))}
      </div>
    )
  }
  if (!rows.length) return null
  return (
    <section className='grid gap-3' aria-label={`Top 3 in ${title}`}>
      <div className='flex items-center gap-2'>
        <Trophy className='size-4 text-warning' />
        <h3 className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
          Top 3 Podium · {title}
        </h3>
      </div>
      <ol className='grid gap-3.5 sm:grid-cols-3 sm:items-end'>
        {rows.map((row) => (
          <li
            key={row.student.id}
            className={cn(
              'grid gap-3 rounded-2xl border p-4 transition-all',
              row.rank === 1
                ? 'border-amber-400/80 bg-gradient-to-b from-amber-500/12 via-amber-500/[0.04] to-card ring-2 ring-amber-400/20 shadow-md sm:order-2 sm:-translate-y-2'
                : row.rank === 2
                  ? 'border-sky-300/70 bg-gradient-to-b from-sky-500/10 via-card to-card shadow-2xs sm:order-1 dark:border-sky-700/60'
                  : 'border-orange-300/70 bg-gradient-to-b from-orange-500/10 via-card to-card shadow-2xs sm:order-3 dark:border-orange-800/60'
            )}
          >
            <div className='flex items-center justify-between gap-2 border-b border-border/50 pb-2.5'>
              {row.rank === 1 ? (
                <span className='inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-2.5 py-0.5 text-xs font-black text-white shadow-xs'>
                  <Crown className='size-3.5 stroke-[2.5]' />
                  Rank 1
                </span>
              ) : row.rank === 2 ? (
                <span className='inline-flex items-center gap-1.5 rounded-full border border-sky-300 bg-sky-100 px-2.5 py-0.5 text-xs font-extrabold text-sky-800 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-200'>
                  <Medal className='size-3.5' />
                  Rank 2
                </span>
              ) : (
                <span className='inline-flex items-center gap-1.5 rounded-full border border-orange-300 bg-orange-100 px-2.5 py-0.5 text-xs font-extrabold text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200'>
                  <Award className='size-3.5' />
                  Rank 3
                </span>
              )}
              <Badge tone={LEVEL_TONE[row.best_level]}>{LEVEL_LABELS[row.best_level]}</Badge>
            </div>

            <div className='grid min-w-0 gap-0.5'>
              <span className='truncate text-base font-bold text-foreground'>
                {row.student.name}
              </span>
              <span className='truncate text-xs text-muted-foreground'>
                {[row.student.section, row.student.admission_no].filter(Boolean).join(' · ')}
              </span>
            </div>

            <div className='flex items-end justify-between gap-2 border-t border-border/50 pt-2.5'>
              <div className='flex items-baseline gap-1'>
                <span
                  className={cn(
                    'tabular text-3xl font-black',
                    row.rank === 1
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-foreground'
                  )}
                >
                  {row.points}
                </span>
                <span className='text-xs font-bold text-muted-foreground'>pts</span>
              </div>
              <span
                className={cn(
                  'rounded-md px-2 py-0.5 text-xs font-semibold',
                  row.rank === 1
                    ? 'border border-amber-500/25 bg-amber-500/15 text-amber-800 dark:text-amber-300'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {row.wins} wins · {row.podiums} top 3
              </span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
