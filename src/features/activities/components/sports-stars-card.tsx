import { Link } from '@tanstack/react-router'
import { ArrowRight, Trophy } from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/common/display'
import { Card } from '@/components/ui/card'
import { useLeaderboard } from '../api'
import { ActivityPodium } from './activity-podium'

export function SportsStarsCard() {
  const board = useLeaderboard({ category: 'sports', limit: 3 })
  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3.5 sm:px-5'>
        <div className='flex items-center gap-3'>
          <div className='grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20'>
            <Trophy className='size-5' />
          </div>
          <div className='grid gap-0.5'>
            <h2 className='text-sm font-bold tracking-tight text-foreground sm:text-base'>
              Sports stars
            </h2>
            <p className='text-xs text-muted-foreground'>
              Top 3 in sports this academic year, by points
            </p>
          </div>
        </div>
        <Link
          to='/activities'
          search={{ tab: 'leaderboard', category: 'sports', page: 1 }}
          className='inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-muted'
        >
          View leaderboard
          <ArrowRight className='size-3.5' />
        </Link>
      </div>
      {board.isError ? (
        <ErrorState message={board.error.message} onRetry={() => board.refetch()} />
      ) : board.data && !board.data.rows.length ? (
        <EmptyState
          icon={Trophy}
          title='No sports achievements yet'
          description='Add sports results from a student’s Achievements tab or the Staff app.'
        />
      ) : (
        <div className='p-4'>
          <ActivityPodium
            rows={(board.data?.rows ?? []).slice(0, 3)}
            title='Sports'
            loading={board.isPending}
          />
        </div>
      )}
    </Card>
  )
}
