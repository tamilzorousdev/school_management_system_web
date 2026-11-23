import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  CircleOff,
  ClipboardCheck,
  Download,
  GraduationCap,
  Inbox,
  Link2,
  PhoneCall,
  UsersRound,
} from 'lucide-react'
import { Avatar } from '@/components/common/avatar'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { downloadFile } from '@/lib/files'
import { formatDateTime } from '@/lib/format'
import {
  alumniApi,
  useAlumni,
  useAlumniBatches,
  useAlumniInsights,
  useAlumniSubmissions,
  type AlumniItem,
  type Submission,
} from '../api'
import { SubmissionReviewModal } from '../components/submission-review-modal'
import {
  ALUMNI_SOURCE,
  ALUMNI_STATUS,
  careerLine,
  classLabel,
  EXIT_TYPE,
  OCCUPATION,
  SUBMISSION_STATUS,
  SUBMISSION_TYPE,
  toneOptions,
  toOptions,
} from '../labels'
import type { AlumniSearch, AlumniTab } from '../search'

const route = getRouteApi('/_app/alumni')
const LIMIT = 20

const LIST_FILTERS = {
  search: undefined,
  batch_year: undefined,
  source: undefined,
  exit_type: undefined,
  occupation_status: undefined,
  status: undefined,
  reachable: undefined,
  submission_status: undefined,
} satisfies Partial<AlumniSearch>

export function AlumniPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/alumni' })
  const me = useMe().data
  const canManage = can(me, 'alumni.manage')
  const tab: AlumniTab = search.tab ?? 'alumni'
  const [reviewing, setReviewing] = useState<Submission | null>(null)
  const [exporting, setExporting] = useState(false)

  const filters = {
    search: search.search,
    batch_year: search.batch_year,
    source: search.source,
    exit_type: search.exit_type,
    occupation_status: search.occupation_status,
    status: search.status,
    reachable: search.reachable,
    sort: search.sort,
    order: search.order,
  }
  const alumni = useAlumni({ ...filters, page: search.page, limit: LIMIT }, tab === 'alumni')
  const submissions = useAlumniSubmissions(
    {
      page: search.page,
      limit: LIMIT,
      search: search.search,
      status: search.submission_status,
      sort: search.sort === 'name' || search.sort === 'created_at' ? search.sort : undefined,
      order: search.order,
    },
    tab === 'submissions'
  )
  const insights = useAlumniInsights()
  const batches = useAlumniBatches()

  const setSearch = (patch: Partial<AlumniSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })

  const switchTab = (next: AlumniTab, patch: Partial<AlumniSearch> = {}) =>
    navigate({
      search: {
        page: 1,
        tab: next === 'alumni' ? undefined : next,
        ...patch,
      },
    })

  useShortcut('app.refresh', () => {
    void insights.refetch()
    void (tab === 'alumni' ? alumni.refetch() : submissions.refetch())
  })

  const exportList = async () => {
    setExporting(true)
    try {
      await downloadFile(
        alumniApi.exportPath,
        `Alumni-${new Date().toISOString().slice(0, 10)}.xlsx`,
        {
          search: filters.search,
          batch_year: filters.batch_year,
          source: filters.source,
          exit_type: filters.exit_type,
          occupation_status: filters.occupation_status,
          status: filters.status,
          reachable: filters.reachable,
        }
      )
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setExporting(false)
    }
  }

  const registrationUrl = me?.school
    ? `${window.location.origin}/alumni-register/${encodeURIComponent(me.school.code)}`
    : null

  const copyRegistrationLink = async () => {
    if (!registrationUrl) return
    try {
      await navigator.clipboard.writeText(registrationUrl)
      alerts.success('Registration link copied', {
        description: 'Share it with former students so they can sign up.',
      })
    } catch {
      alerts.error(`Copy failed. The link is ${registrationUrl}`)
    }
  }

  const data = insights.data
  const latest = data?.latest_batch ?? null
  const cards: Insight[] = [
    {
      key: 'total',
      label: 'All alumni',
      value: data?.total ?? 0,
      hint: `${data?.active ?? 0} active`,
      icon: GraduationCap,
      tone: 'primary',
      active:
        tab === 'alumni' &&
        !search.batch_year &&
        !search.reachable &&
        !search.status &&
        !search.source &&
        !search.occupation_status,
      onClick: () => switchTab('alumni'),
    },
    {
      key: 'latest',
      label: latest ? `Batch of ${latest.batch_year}` : 'Latest batch',
      value: latest?.count ?? 0,
      hint: latest ? 'Most recent batch' : 'No batches yet',
      icon: UsersRound,
      tone: 'info',
      active: tab === 'alumni' && Boolean(latest) && search.batch_year === latest?.batch_year,
      onClick: () => {
        if (!latest) return
        const on = tab === 'alumni' && search.batch_year === latest.batch_year
        if (tab !== 'alumni') switchTab('alumni', { batch_year: latest.batch_year })
        else setSearch({ batch_year: on ? undefined : latest.batch_year })
      },
    },
    {
      key: 'reachable',
      label: 'Reachable',
      value: data?.reachable ?? 0,
      hint: 'Agreed to contact, with a mobile or email',
      icon: PhoneCall,
      tone: 'success',
      active: tab === 'alumni' && search.reachable === true,
      onClick: () => {
        if (tab !== 'alumni') switchTab('alumni', { reachable: true })
        else setSearch({ reachable: search.reachable ? undefined : true })
      },
    },
    {
      key: 'pending',
      label: 'Pending approvals',
      value: data?.pending_submissions ?? 0,
      hint: 'Self-registrations and updates',
      icon: ClipboardCheck,
      tone: data?.pending_submissions ? 'warning' : 'neutral',
      active: tab === 'submissions' && search.submission_status === 'pending',
      onClick: () => switchTab('submissions', { submission_status: 'pending' }),
    },
  ]

  const openProfile = (row: AlumniItem) =>
    navigate({ to: '/alumni/$id', params: { id: String(row.id) } })

  const columns: Column<AlumniItem>[] = [
    {
      key: 'name',
      header: 'Alumnus',
      sortKey: 'name',
      cell: (row) => (
        <div className='flex items-center gap-3'>
          <Avatar name={row.full_name} src={row.photo_url} />
          <div className='grid min-w-0'>
            <span className='truncate font-bold'>{row.full_name}</span>
            <span className='truncate font-mono text-xs text-muted-foreground'>
              {row.alumni_no}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'batch',
      header: 'Batch',
      sortKey: 'batch_year',
      cell: (row) => (
        <div className='grid gap-0.5'>
          <span className='tabular font-semibold'>{row.batch_year}</span>
          <span className='text-xs text-muted-foreground'>{EXIT_TYPE[row.exit_type].label}</span>
        </div>
      ),
    },
    {
      key: 'class',
      header: 'Final class',
      sortKey: 'final_percent',
      hideBelow: 'lg',
      cell: (row) => (
        <div className='grid gap-0.5'>
          <span>{classLabel(row.final_class_name, row.final_section_name)}</span>
          {row.final_percent !== null && (
            <span className='tabular text-xs text-muted-foreground'>
              {row.final_percent}%{row.final_grade ? ` · ${row.final_grade}` : ''}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'career',
      header: 'Now',
      cell: (row) => <span className='line-clamp-2 text-sm'>{careerLine(row)}</span>,
    },
    {
      key: 'contact',
      header: 'Contact',
      hideBelow: 'xl',
      cell: (row) => (
        <div className='grid min-w-0 gap-0.5'>
          <span className='tabular truncate'>{row.mobile ? `+91 ${row.mobile}` : '—'}</span>
          <span className='truncate text-xs text-muted-foreground'>{row.email ?? 'No email'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <div className='flex flex-wrap gap-1'>
          <Badge tone={ALUMNI_STATUS[row.status].tone} dot>
            {ALUMNI_STATUS[row.status].label}
          </Badge>
          {row.status === 'active' && !row.reachable && <Badge tone='warning'>No contact</Badge>}
        </div>
      ),
    },
  ]

  const submissionColumns: Column<Submission>[] = [
    {
      key: 'name',
      header: 'Name',
      sortKey: 'name',
      cell: (row) => (
        <div className='flex items-center gap-3'>
          <Avatar name={row.name} />
          <div className='grid min-w-0'>
            <span className='truncate font-bold'>{row.name}</span>
            <span className='truncate font-mono text-xs text-muted-foreground'>
              {row.alumni_no ?? 'New'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (row) => (
        <Badge tone={SUBMISSION_TYPE[row.type].tone}>{SUBMISSION_TYPE[row.type].label}</Badge>
      ),
    },
    {
      key: 'mobile',
      header: 'Mobile',
      cell: (row) => <span className='tabular'>{row.mobile ? `+91 ${row.mobile}` : '—'}</span>,
    },
    {
      key: 'created_at',
      header: 'Sent',
      sortKey: 'created_at',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='text-muted-foreground'>{formatDateTime(row.created_at)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge tone={SUBMISSION_STATUS[row.status].tone} dot>
          {SUBMISSION_STATUS[row.status].label}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      cell: (row) => (
        <Button
          variant='outline'
          size='sm'
          onClick={(event) => {
            event.stopPropagation()
            setReviewing(row)
          }}
        >
          {row.status === 'pending' && canManage ? 'Review' : 'View'}
        </Button>
      ),
    },
  ]

  const listFiltered = Boolean(
    search.search ||
    search.batch_year ||
    search.source ||
    search.exit_type ||
    search.occupation_status ||
    search.status ||
    search.reachable
  )
  const submissionsFiltered = Boolean(search.search || search.submission_status)

  return (
    <Page>
      <PageHeader
        eyebrow='People'
        title='Alumni'
        description='Former students: who passed out, who left with a TC, and who registered themselves. Keep their contact and career details current.'
        actions={
          <>
            {canManage && registrationUrl && (
              <Button variant='outline' onClick={() => void copyRegistrationLink()}>
                <Link2 />
                Registration link
              </Button>
            )}
            <Button variant='outline' loading={exporting} onClick={() => void exportList()}>
              <Download />
              Export
            </Button>
          </>
        }
      />

      <InsightCards items={cards} loading={insights.isPending} />

      <PageTabs
        label='Alumni sections'
        value={tab}
        onChange={(next) => switchTab(next)}
        tabs={[
          { value: 'alumni', label: 'Alumni', icon: GraduationCap },
          {
            value: 'submissions',
            label: 'Submissions',
            icon: Inbox,
            count: data?.pending_submissions || undefined,
          },
        ]}
      />

      {tab === 'alumni' ? (
        <Card className='overflow-hidden'>
          <ListToolbar
            summary={
              alumni.data
                ? `${alumni.data.total} ${alumni.data.total === 1 ? 'alumnus' : 'alumni'}`
                : ''
            }
            onClear={
              listFiltered ? () => navigate({ search: { page: 1 }, replace: true }) : undefined
            }
          >
            <SearchBox
              value={search.search ?? ''}
              onChange={(value) => setSearch({ search: value || undefined })}
              placeholder='Search name, number, mobile, college or city'
              label='Search alumni'
            />
            <FilterSelect
              id='alumni-batch'
              label='Filter by batch'
              allLabel='All batches'
              value={search.batch_year ? String(search.batch_year) : undefined}
              options={(batches.data ?? []).map((batch) => ({
                value: String(batch.batch_year),
                label: String(batch.batch_year),
                hint: String(batch.count),
              }))}
              onChange={(value) => setSearch({ batch_year: value ? Number(value) : undefined })}
            />
            <FilterSelect
              id='alumni-occupation'
              label='Filter by occupation'
              allLabel='All occupations'
              value={search.occupation_status}
              options={toOptions(OCCUPATION).map((option) => ({
                ...option,
                hint: data ? String(data.by_occupation[option.value] ?? 0) : undefined,
              }))}
              onChange={(value) =>
                setSearch({ occupation_status: value as AlumniSearch['occupation_status'] })
              }
            />
            <FilterSelect
              id='alumni-source'
              label='Filter by source'
              allLabel='All sources'
              value={search.source}
              options={toneOptions(ALUMNI_SOURCE)}
              onChange={(value) => setSearch({ source: value as AlumniSearch['source'] })}
            />
            <FilterSelect
              id='alumni-status'
              label='Filter by status'
              allLabel='Any status'
              value={search.status}
              options={toneOptions(ALUMNI_STATUS)}
              onChange={(value) => setSearch({ status: value as AlumniSearch['status'] })}
            />
          </ListToolbar>

          <DataTable
            rows={alumni.data?.items ?? []}
            columns={columns}
            rowKey={(row) => row.id}
            loading={alumni.isFetching}
            error={alumni.isError ? alumni.error.message : null}
            onRetry={() => alumni.refetch()}
            onRowClick={openProfile}
            sort={{ sort: search.sort ?? 'batch_year', order: search.order ?? 'desc' }}
            onSortChange={(next) => setSearch(next as Partial<AlumniSearch>)}
            empty={{
              icon: listFiltered ? CircleOff : GraduationCap,
              title: listFiltered ? 'No alumni match these filters' : 'No alumni yet',
              description: listFiltered
                ? 'Try another name or batch, or clear the filters.'
                : 'Students become alumni automatically when they get a TC or pass out of the final class at year end.',
            }}
            card={(row) => (
              <div className='flex items-start gap-3'>
                <Avatar name={row.full_name} src={row.photo_url} />
                <div className='grid min-w-0 flex-1 gap-1'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='grid min-w-0'>
                      <span className='truncate font-bold'>{row.full_name}</span>
                      <span className='truncate font-mono text-xs text-muted-foreground'>
                        {row.alumni_no} · Batch {row.batch_year}
                      </span>
                    </div>
                    <Badge tone={ALUMNI_STATUS[row.status].tone} dot className='shrink-0'>
                      {ALUMNI_STATUS[row.status].label}
                    </Badge>
                  </div>
                  <span className='text-sm'>{careerLine(row)}</span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {[row.mobile && `+91 ${row.mobile}`, row.email].filter(Boolean).join(' · ') ||
                      'No contact details'}
                  </span>
                </div>
              </div>
            )}
            pagination={{
              page: search.page,
              limit: LIMIT,
              total: alumni.data?.total ?? 0,
              label: 'alumni',
              onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
            }}
          />
        </Card>
      ) : (
        <Card className='overflow-hidden'>
          <ListToolbar
            summary={
              submissions.data
                ? `${submissions.data.total} ${submissions.data.total === 1 ? 'submission' : 'submissions'}`
                : ''
            }
            onClear={
              submissionsFiltered
                ? () => setSearch({ ...LIST_FILTERS, tab: 'submissions' })
                : undefined
            }
          >
            <SearchBox
              value={search.search ?? ''}
              onChange={(value) => setSearch({ search: value || undefined })}
              placeholder='Search name or mobile'
              label='Search submissions'
            />
            <FilterSelect
              id='submission-status'
              label='Filter by status'
              allLabel='All submissions'
              value={search.submission_status}
              options={toneOptions(SUBMISSION_STATUS)}
              onChange={(value) =>
                setSearch({ submission_status: value as AlumniSearch['submission_status'] })
              }
            />
          </ListToolbar>
          <DataTable
            rows={submissions.data?.items ?? []}
            columns={submissionColumns}
            rowKey={(row) => row.id}
            loading={submissions.isFetching}
            error={submissions.isError ? submissions.error.message : null}
            onRetry={() => submissions.refetch()}
            onRowClick={setReviewing}
            sort={{ sort: search.sort ?? 'created_at', order: search.order ?? 'desc' }}
            onSortChange={(next) => setSearch(next as Partial<AlumniSearch>)}
            empty={{
              icon: submissionsFiltered ? CircleOff : Inbox,
              title: submissionsFiltered
                ? 'No submissions match these filters'
                : 'No submissions yet',
              description:
                'Former students can register with the registration link, or update their details with a link you send them.',
            }}
            card={(row) => (
              <div className='flex items-start gap-3'>
                <Avatar name={row.name} />
                <div className='grid min-w-0 flex-1 gap-1'>
                  <div className='flex items-start justify-between gap-2'>
                    <span className='truncate font-bold'>{row.name}</span>
                    <Badge tone={SUBMISSION_STATUS[row.status].tone} dot className='shrink-0'>
                      {SUBMISSION_STATUS[row.status].label}
                    </Badge>
                  </div>
                  <span className='text-xs text-muted-foreground'>
                    {SUBMISSION_TYPE[row.type].label}
                    {row.mobile ? ` · +91 ${row.mobile}` : ''}
                  </span>
                  <span className='text-xs text-muted-foreground'>
                    Sent {formatDateTime(row.created_at)}
                  </span>
                </div>
              </div>
            )}
            pagination={{
              page: search.page,
              limit: LIMIT,
              total: submissions.data?.total ?? 0,
              label: 'submissions',
              onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
            }}
          />
        </Card>
      )}

      <SubmissionReviewModal
        submission={reviewing}
        onOpenChange={(open) => !open && setReviewing(null)}
        canManage={canManage}
      />
    </Page>
  )
}
