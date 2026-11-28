import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { CircleOff, HeartHandshake, Languages } from 'lucide-react'
import { EyeIcon, SmartphoneIcon, UsersIcon } from '@/components/common/icon'
import { Avatar } from '@/components/common/avatar'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { can, useMe } from '@/features/auth/api'
import { useNow } from '@/hooks/use-now'
import { timeAgo } from '@/lib/format'
import { useGuardianInsights, useGuardians, type GuardianListItem } from '../api'
import { GuardianSheet } from '../components/guardian-sheet'
import type { GuardiansSearch } from '../search'

const route = getRouteApi('/_app/guardians')
const LIMIT = 20

export function GuardiansPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/guardians' })
  const now = useNow(60_000)
  const me = useMe().data
  const { parent: openId, ...filters } = search
  const guardians = useGuardians({ ...filters, limit: LIMIT })
  const insights = useGuardianInsights()
  const rows = guardians.data?.items ?? []

  const setSearch = (patch: Partial<GuardiansSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })
  const openParent = (id: number | undefined) =>
    navigate({ search: (prev) => ({ ...prev, parent: id }), replace: true })

  useShortcut('app.refresh', () => {
    void guardians.refetch()
    void insights.refetch()
  })

  const data = insights.data
  const cards: Insight[] = [
    {
      key: 'all',
      label: 'Parents and guardians',
      value: data?.total ?? 0,
      hint: 'With a child in the school',
      icon: HeartHandshake,
      tone: 'primary',
      active: search.on_app === undefined && !search.multiple_children && !search.language,
      onClick: () =>
        setSearch({ on_app: undefined, multiple_children: undefined, language: undefined }),
    },
    {
      key: 'not-on-app',
      label: 'Not on the app yet',
      value: (data?.total ?? 0) - (data?.on_app ?? 0),
      hint: `${data?.on_app ?? 0} already use it`,
      icon: SmartphoneIcon,
      tone: 'warning',
      active: search.on_app === false,
      onClick: () => setSearch({ on_app: search.on_app === false ? undefined : false }),
    },
    {
      key: 'multiple',
      label: 'More than one child here',
      value: data?.multiple_children ?? 0,
      hint: 'Families with siblings',
      icon: UsersIcon,
      tone: 'info',
      active: Boolean(search.multiple_children),
      onClick: () => setSearch({ multiple_children: search.multiple_children ? undefined : true }),
    },
    {
      key: 'tamil',
      label: 'Prefer Tamil',
      value: data?.tamil ?? 0,
      hint: 'Get app and messages in Tamil',
      icon: Languages,
      tone: 'success',
      active: search.language === 'ta',
      onClick: () => setSearch({ language: search.language === 'ta' ? undefined : 'ta' }),
    },
  ]

  const columns: Column<GuardianListItem>[] = [
    {
      key: 'name',
      header: 'PARENT',
      sortKey: 'name',
      cell: (guardian) => (
        <div className='flex items-center gap-3'>
          <Avatar name={guardian.name} />
          <div className='grid min-w-0'>
            <span className='flex items-center gap-1.5'>
              <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
                {guardian.name}
              </span>
              {guardian.language === 'ta' && (
                <span className='shrink-0 rounded border border-warning/30 bg-warning/10 px-1 text-[10px] leading-4 font-bold text-warning'>
                  தமிழ்
                </span>
              )}
            </span>
            <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
              {[guardian.occupation, guardian.qualification].filter(Boolean).join(' · ') ||
                'No occupation recorded'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'mobile',
      header: 'MOBILE',
      cell: (guardian) => (
        <span className='tabular text-[13px] leading-[18px] font-medium text-slate-700 dark:text-slate-300'>
          +91 {guardian.mobile}
        </span>
      ),
    },
    {
      key: 'children',
      header: 'CHILDREN',
      cell: (guardian) => (
        <span className='flex flex-wrap gap-1'>
          {guardian.children.map((child) => (
            <Badge key={child.id} tone='neutral'>
              {child.full_name.split(' ')[0]} · {child.class_section ?? '—'}
            </Badge>
          ))}
        </span>
      ),
    },
    {
      key: 'app',
      header: 'APP',
      sortKey: 'last_login_at',
      hideBelow: 'lg',
      cell: (guardian) =>
        guardian.on_app ? (
          <Badge tone='success' dot>
            {timeAgo(guardian.last_login_at, now)}
          </Badge>
        ) : (
          <Badge tone='warning' dot>
            Not yet
          </Badge>
        ),
    },
    {
      key: 'action',
      header: 'ACTION',
      align: 'right' as const,
      cell: (guardian: GuardianListItem) => (
        <Button
          variant='outline'
          size='icon-sm'
          aria-label={`View ${guardian.name}`}
          title='View parent details'
          className='border-[#EDF0EE] bg-white text-[#3C4440] hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
          onClick={(event) => {
            event.stopPropagation()
            openParent(guardian.id)
          }}
        >
          <EyeIcon className='size-4 stroke-[1.75]' />
        </Button>
      ),
    },
  ]

  const filtered = Boolean(
    search.search || search.on_app !== undefined || search.multiple_children || search.language
  )

  return (
    <Page>
      <PageHeader
        eyebrow='People'
        title='Parents'
        description='Parents and guardians with their children in this school. Brothers and sisters are linked through the same parent.'
      />

      <InsightCards items={cards} loading={insights.isPending} />

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={guardians.data ? `${guardians.data.total} parents` : ''}
          onClear={filtered ? () => navigate({ search: { page: 1 }, replace: true }) : undefined}
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Name, mobile, email or occupation'
            label='Search parents'
          />
          <FilterSelect
            id='app-filter'
            label='Filter by app use'
            allLabel='On app or not'
            value={search.on_app === undefined ? undefined : String(search.on_app)}
            options={[
              { value: 'true', label: 'On the app' },
              { value: 'false', label: 'Not on the app' },
            ]}
            onChange={(value) =>
              setSearch({ on_app: value === undefined ? undefined : value === 'true' })
            }
          />
          <FilterSelect
            id='language-filter'
            label='Filter by language'
            allLabel='All languages'
            value={search.language}
            options={[
              { value: 'en', label: 'English' },
              { value: 'ta', label: 'தமிழ் (Tamil)' },
            ]}
            onChange={(value) => setSearch({ language: value as GuardiansSearch['language'] })}
          />
        </ListToolbar>

        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(guardian) => guardian.id}
          loading={guardians.isFetching}
          error={guardians.isError ? guardians.error.message : null}
          onRetry={() => guardians.refetch()}
          onRowClick={(guardian) => openParent(guardian.id)}
          sort={{ sort: search.sort, order: search.order ?? 'asc' }}
          onSortChange={(next) => setSearch(next as Partial<GuardiansSearch>)}
          empty={{
            icon: filtered ? CircleOff : HeartHandshake,
            title: filtered ? 'No parents match these filters' : 'No parents yet',
            description: filtered
              ? 'Try another name or mobile, or clear the filters.'
              : 'Parents appear here when their child is enrolled or added.',
          }}
          card={(guardian) => (
            <div className='flex items-start gap-3'>
              <Avatar name={guardian.name} />
              <div className='grid min-w-0 flex-1 gap-1.5'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='grid min-w-0'>
                    <span className='truncate font-bold'>{guardian.name}</span>
                    <span className='tabular text-xs text-muted-foreground'>
                      +91 {guardian.mobile}
                    </span>
                  </div>
                  <Badge tone={guardian.on_app ? 'success' : 'warning'} dot>
                    {guardian.on_app ? 'On app' : 'Not yet'}
                  </Badge>
                </div>
                <span className='flex flex-wrap gap-1'>
                  {guardian.children.map((child) => (
                    <Badge key={child.id} tone='neutral'>
                      {child.full_name.split(' ')[0]} · {child.class_section ?? '—'}
                    </Badge>
                  ))}
                </span>
              </div>
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: guardians.data?.total ?? 0,
            label: 'parents',
            onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
          }}
        />
      </Card>

      <GuardianSheet
        guardianId={openId ?? null}
        canManage={can(me, 'students.manage')}
        canSeeMeetings={can(me, 'meetings.view')}
        onClose={() => openParent(undefined)}
      />
    </Page>
  )
}
