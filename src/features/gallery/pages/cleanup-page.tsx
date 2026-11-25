import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import {
  CalendarClock,
  CircleAlert,
  History,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/display'
import { InsightCards } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/format'
import {
  galleryApi,
  galleryKeys,
  useCleanupJobs,
  useCleanupStatus,
  useGalleryMutation,
  type CleanupJob,
  type CleanupPreview,
} from '../api'
import { CleanupPreviewDialog } from '../components/cleanup-preview-dialog'
import { GalleryTabs } from '../components/gallery-tabs'
import { JobDetailSheet } from '../components/job-detail-sheet'
import { formatStorage, JOB_STATUS, JOB_STATUS_OPTIONS, JOB_TRIGGER_LABELS } from '../labels'
import type { CleanupSearch } from '../search'

const route = getRouteApi('/_app/gallery/cleanup')
const LIMIT = 20

export function CleanupPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/gallery/cleanup' })
  const queryClient = useQueryClient()
  const me = useMe().data
  const canView = can(me, 'gallery.view')
  const canConfigure = can(me, 'gallery.configure')
  const status = useCleanupStatus()
  const jobs = useCleanupJobs({ page: search.page, limit: LIMIT, status: search.status })
  const run = useGalleryMutation(galleryApi.runCleanup)
  const pause = useGalleryMutation(galleryApi.pauseCleanup)
  const resume = useGalleryMutation(galleryApi.resumeCleanup)
  const [preview, setPreview] = useState<{
    open: boolean
    data?: CleanupPreview
    loading: boolean
    error: string | null
  }>({ open: false, loading: false, error: null })

  const setSearch = (patch: Partial<CleanupSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })

  useShortcut('app.refresh', () => {
    void status.refetch()
    void jobs.refetch()
  })

  const loadPreview = async () => {
    setPreview({ open: true, loading: true, error: null })
    try {
      const data = await queryClient.fetchQuery({
        queryKey: [...galleryKeys.all, 'cleanup-preview'],
        queryFn: galleryApi.cleanupPreview,
        staleTime: 0,
      })
      setPreview({ open: true, data, loading: false, error: null })
    } catch (error) {
      setPreview({ open: true, loading: false, error: toApiError(error).message })
    }
  }

  const runNow = async () => {
    try {
      const job = await run.mutateAsync()
      setPreview({ open: false, loading: false, error: null })
      alerts.success('Cleanup finished', {
        description: `${job.trashed} moved to Trash · ${job.purged} deleted for good · ${formatStorage(job.bytes_reclaimed)} freed${job.failed ? ` · ${job.failed} failed` : ''}`,
      })
      setSearch({ job: job.id, action: undefined, item_page: 1 })
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const data = status.data
  const last = data?.last_job
  const state = !data
    ? '—'
    : data.running
      ? 'Running'
      : !data.cleanup_enabled
        ? 'Switched off'
        : data.paused
          ? 'Paused'
          : 'On schedule'

  const columns: Column<CleanupJob>[] = [
    {
      key: 'started',
      header: 'Started',
      cell: (job) => (
        <div className='grid'>
          <span className='font-semibold'>{formatDateTime(job.started_at)}</span>
          <span className='text-xs text-muted-foreground'>
            #{job.id} · {JOB_TRIGGER_LABELS[job.trigger]}
            {job.triggered_by_name ? ` by ${job.triggered_by_name}` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (job) => (
        <Badge tone={JOB_STATUS[job.status].tone} dot pulse={job.status === 'running'}>
          {JOB_STATUS[job.status].label}
        </Badge>
      ),
    },
    {
      key: 'scanned',
      header: 'Checked',
      hideBelow: 'lg',
      align: 'right',
      cell: (job) => <span className='tabular'>{job.scanned}</span>,
    },
    {
      key: 'marked',
      header: 'Marked',
      hideBelow: 'xl',
      align: 'right',
      cell: (job) => <span className='tabular'>{job.marked}</span>,
    },
    {
      key: 'trashed',
      header: 'To Trash',
      align: 'right',
      cell: (job) => <span className='tabular'>{job.trashed + job.albums_trashed}</span>,
    },
    {
      key: 'purged',
      header: 'Deleted',
      align: 'right',
      cell: (job) => <span className='tabular'>{job.purged + job.albums_purged}</span>,
    },
    {
      key: 'failed',
      header: 'Failed',
      align: 'right',
      cell: (job) => (
        <span className={job.failed ? 'tabular font-bold text-destructive' : 'tabular'}>
          {job.failed}
        </span>
      ),
    },
    {
      key: 'freed',
      header: 'Freed',
      hideBelow: 'lg',
      align: 'right',
      cell: (job) => <span className='tabular'>{formatStorage(job.bytes_reclaimed)}</span>,
    },
    {
      key: 'duration',
      header: 'Took',
      hideBelow: 'xl',
      align: 'right',
      cell: (job) => (
        <span className='tabular'>
          {job.duration_ms === null ? '—' : `${(job.duration_ms / 1000).toFixed(1)} s`}
        </span>
      ),
    },
  ]

  if (me && !canView) {
    return (
      <Page>
        <PageHeader eyebrow='Gallery' title='Cleanup' />
        <EmptyState icon={Sparkles} title='No access to the gallery cleanup' />
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        eyebrow='Gallery'
        title='Cleanup'
        description='The automatic cleanup marks media whose retention is ending, moves it to Trash after the notice and deletes it for good after the recovery period.'
        actions={
          canConfigure && (
            <>
              {data?.paused ? (
                <Button
                  variant='outline'
                  loading={resume.isPending}
                  onClick={() =>
                    void resume
                      .mutateAsync()
                      .then(() => alerts.success('Scheduled cleanup resumed'))
                      .catch((error: unknown) => alerts.error(toApiError(error).message))
                  }
                >
                  <Play />
                  Resume schedule
                </Button>
              ) : (
                <Button
                  variant='outline'
                  loading={pause.isPending}
                  disabled={!data?.cleanup_enabled}
                  onClick={() =>
                    void pause
                      .mutateAsync()
                      .then(() => alerts.success('Scheduled cleanup paused'))
                      .catch((error: unknown) => alerts.error(toApiError(error).message))
                  }
                >
                  <Pause />
                  Pause schedule
                </Button>
              )}
              <Button onClick={() => void loadPreview()} disabled={data?.running}>
                <Sparkles />
                Run cleanup now
              </Button>
            </>
          )
        }
      />
      <GalleryTabs active='/gallery/cleanup' />

      <InsightCards
        loading={status.isPending}
        items={[
          {
            key: 'state',
            label: 'Status',
            value: state,
            hint: data?.running ? 'Refreshing every 5 seconds' : undefined,
            icon: Timer,
            tone: data?.running
              ? 'info'
              : data?.paused || !data?.cleanup_enabled
                ? 'warning'
                : 'success',
          },
          {
            key: 'next',
            label: 'Next run',
            value: data?.next_cleanup_at ? formatDateTime(data.next_cleanup_at) : 'Not scheduled',
            icon: CalendarClock,
            tone: 'primary',
          },
          {
            key: 'last',
            label: 'Last run',
            value: last ? formatDateTime(last.started_at) : 'Never',
            hint: last ? JOB_STATUS[last.status].label : undefined,
            icon: History,
            tone:
              last?.status === 'failed'
                ? 'danger'
                : last?.status === 'partial'
                  ? 'warning'
                  : 'neutral',
            onClick: last
              ? () => setSearch({ job: last.id, action: undefined, item_page: 1 })
              : undefined,
          },
          {
            key: 'retry',
            label: 'Failed deletions',
            value: data?.retryable ?? 0,
            hint: data?.retryable ? 'Open a run to retry' : 'Nothing to retry',
            icon: data?.retryable ? CircleAlert : RotateCcw,
            tone: data?.retryable ? 'danger' : 'neutral',
            onClick: data?.retryable ? () => setSearch({ status: 'partial', page: 1 }) : undefined,
          },
        ]}
      />

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={jobs.data ? `${jobs.data.total} ${jobs.data.total === 1 ? 'run' : 'runs'}` : ''}
          onClear={search.status ? () => setSearch({ status: undefined, page: 1 }) : undefined}
        >
          <FilterSelect
            id='cleanup-status'
            label='Filter by status'
            allLabel='All runs'
            value={search.status}
            options={JOB_STATUS_OPTIONS}
            onChange={(value) => setSearch({ status: value as CleanupSearch['status'], page: 1 })}
          />
        </ListToolbar>
        <DataTable
          rows={jobs.data?.items ?? []}
          columns={columns}
          rowKey={(job) => job.id}
          loading={jobs.isFetching}
          error={jobs.isError ? jobs.error.message : null}
          onRetry={() => jobs.refetch()}
          onRowClick={(job) => setSearch({ job: job.id, action: undefined, item_page: 1 })}
          empty={{
            icon: History,
            title: search.status ? 'No runs with this status' : 'No cleanup runs yet',
            description: 'Runs appear here after the first scheduled or manual cleanup.',
          }}
          card={(job) => (
            <div className='grid gap-1'>
              <div className='flex items-start justify-between gap-2'>
                <span className='font-semibold'>{formatDateTime(job.started_at)}</span>
                <Badge tone={JOB_STATUS[job.status].tone} dot>
                  {JOB_STATUS[job.status].label}
                </Badge>
              </div>
              <span className='text-xs text-muted-foreground'>
                {JOB_TRIGGER_LABELS[job.trigger]} · {job.trashed + job.albums_trashed} to Trash ·{' '}
                {job.purged + job.albums_purged} deleted · {job.failed} failed ·{' '}
                {formatStorage(job.bytes_reclaimed)} freed
              </span>
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: jobs.data?.total ?? 0,
            label: 'runs',
            onPageChange: (page) => setSearch({ page }),
          }}
        />
      </Card>

      <CleanupPreviewDialog
        open={preview.open}
        preview={preview.data}
        loading={preview.loading}
        error={preview.error}
        running={run.isPending}
        onRetry={() => void loadPreview()}
        onClose={() => setPreview((current) => ({ ...current, open: false }))}
        onRun={() => void runNow()}
      />
      <JobDetailSheet
        jobId={search.job}
        action={search.action}
        page={search.item_page}
        canConfigure={canConfigure}
        onChange={(patch) => setSearch(patch)}
        onClose={() => setSearch({ job: undefined, action: undefined, item_page: 1 })}
      />
    </Page>
  )
}
