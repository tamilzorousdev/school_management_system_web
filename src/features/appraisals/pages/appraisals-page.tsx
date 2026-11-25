import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { CalendarClock, ClipboardCheck, Scale, UsersRound } from 'lucide-react'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Card } from '@/components/ui/card'
import { can, useMe } from '@/features/auth/api'
import { useViewingYear } from '@/lib/auth/year-context'
import { useAppeals, useAppraisals } from '../api'
import { AppealsTab } from '../components/appeals-tab'
import { CyclesTab } from '../components/cycles-tab'
import { GroupsTab } from '../components/groups-tab'
import { ReviewModal } from '../components/review-modal'
import { ReviewsTab } from '../components/reviews-tab'
import type { AppraisalsSearch } from '../search'

const route = getRouteApi('/_app/staff/appraisals')

export function AppraisalsPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/staff/appraisals' })
  const me = useMe().data
  const earlierYear = useViewingYear() !== null
  const canConfigure = can(me, 'appraisals.configure') && !earlierYear
  const canFinalize = can(me, 'appraisals.finalize') && !earlierYear
  const setSearch = (patch: Partial<AppraisalsSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })
  const review = (appraisal: number | undefined) =>
    navigate({ search: (prev) => ({ ...prev, appraisal }), replace: true })
  const waiting = useAppraisals({ page: 1, limit: 1, stage: 'principal_pending' })
  const appeals = useAppeals('pending')

  useShortcut('app.refresh', () => void navigate({ search: (prev) => ({ ...prev }), replace: true }))

  return (
    <Page>
      <PageHeader
        eyebrow='Staff'
        title='Performance & appraisals'
        description='Groups of staff with their own KRAs for the year, appraisal cycles with a self-appraisal, HOD review and Principal decision, and appeals.'
      />
      <Card className='overflow-hidden'>
        <div className='px-4 pt-2'>
          <PageTabs
            label='Appraisals'
            value={search.tab}
            onChange={(tab) => setSearch({ tab })}
            tabs={[
              {
                value: 'reviews',
                label: 'Reviews',
                icon: ClipboardCheck,
                count: waiting.data?.total || undefined,
              },
              { value: 'cycles', label: 'Cycles', icon: CalendarClock },
              { value: 'groups', label: 'Groups & KRAs', icon: UsersRound },
              { value: 'appeals', label: 'Appeals', icon: Scale, count: appeals.data?.total || undefined },
            ]}
          />
        </div>
        {search.tab === 'reviews' && (
          <ReviewsTab
            search={search}
            setSearch={setSearch}
            canFinalize={canFinalize}
            onOpen={review}
          />
        )}
        {search.tab === 'cycles' && (
          <CyclesTab canEdit={canConfigure} onShowReviews={(cycle_id) => setSearch({ tab: 'reviews', cycle_id })} />
        )}
        {search.tab === 'groups' && <GroupsTab canEdit={canConfigure} />}
        {search.tab === 'appeals' && (
          <AppealsTab canFinalize={canFinalize} onOpen={review} />
        )}
      </Card>
      {search.appraisal && (
        <ReviewModal
          id={search.appraisal}
          canFinalize={canFinalize}
          onClose={() => review(undefined)}
        />
      )}
    </Page>
  )
}
