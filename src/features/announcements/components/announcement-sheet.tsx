import { useState, type ReactNode } from 'react'
import { Archive, FileText, Megaphone, Pencil, Send, Trash2, UsersRound } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { ErrorState } from '@/components/common/display'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useClasses } from '@/features/setup/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { openFile } from '@/lib/files'
import { formatBytes, formatDateTime } from '@/lib/format'
import {
  announcementsApi,
  useAnnouncement,
  useAnnouncementAction,
  useAnnouncementReaders,
  type Announcement,
  type AnnouncementReader,
  type ReaderParams,
} from '../api'
import { ANNOUNCEMENT_STATUS } from '../labels'

const READERS_LIMIT = 10

export function AnnouncementSheet({
  announcementId,
  canManage,
  onEdit,
  onClose,
}: {
  announcementId: number | null
  canManage: boolean
  onEdit: (announcement: Announcement) => void
  onClose: () => void
}) {
  const [shownId, setShownId] = useState(announcementId)
  if (announcementId && announcementId !== shownId) setShownId(announcementId)
  const announcement = useAnnouncement(shownId)
  const data = announcement.data
  const sent = data?.status === 'published' || data?.status === 'archived'
  const [confirm, setConfirm] = useState<'archive' | 'delete' | null>(null)
  const publish = useAnnouncementAction((id: number) => announcementsApi.publish(id))
  const archive = useAnnouncementAction((id: number) => announcementsApi.archive(id))
  const remove = useAnnouncementAction((id: number) => announcementsApi.remove(id))
  const editable = data?.status !== 'archived'

  const run = async (action: () => Promise<unknown>, message: string, close = false) => {
    try {
      await action()
      alerts.success(message)
      setConfirm(null)
      if (close) onClose()
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  return (
    <Sheet open={Boolean(announcementId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent aria-describedby={undefined} className='sm:max-w-2xl'>
        {announcement.isError && !data ? (
          <ErrorState message={announcement.error.message} onRetry={() => announcement.refetch()} />
        ) : !data ? (
          <div className='grid gap-4 p-6'>
            <Skeleton className='h-16' />
            <Skeleton className='h-48' />
          </div>
        ) : (
          <>
            <SheetHeader>
              <div className='flex items-center gap-3'>
                <span className='grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary'>
                  <Megaphone className='size-5' />
                </span>
                <div className='grid min-w-0 gap-0.5'>
                  <SheetTitle className='break-words'>{data.title}</SheetTitle>
                  <SheetDescription>{data.audience_label}</SheetDescription>
                  <div className='mt-1 flex flex-wrap gap-1.5'>
                    <Badge tone={ANNOUNCEMENT_STATUS[data.status].tone} dot>
                      {ANNOUNCEMENT_STATUS[data.status].label}
                    </Badge>
                    {data.priority === 'urgent' && <Badge tone='danger'>Urgent</Badge>}
                    {data.edited_at && (
                      <Badge tone='warning'>
                        Edited {formatDateTime(data.edited_at)}
                        {data.edited_by ? ` by ${data.edited_by.name}` : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </SheetHeader>
            <SheetBody className='grid content-start gap-6'>
              {canManage && (
                <div className='flex flex-wrap gap-2 rounded-lg border bg-muted/30 p-3'>
                  {(data.status === 'draft' || data.status === 'scheduled') && (
                    <Button
                      size='sm'
                      loading={publish.isPending}
                      onClick={() => run(() => publish.mutateAsync(data.id), 'Announcement sent')}
                    >
                      <Send />
                      Send now
                    </Button>
                  )}
                  {editable && (
                    <Button size='sm' variant='outline' onClick={() => onEdit(data)}>
                      <Pencil />
                      Edit
                    </Button>
                  )}
                  {data.status === 'published' && (
                    <Button size='sm' variant='outline' onClick={() => setConfirm('archive')}>
                      <Archive />
                      Archive
                    </Button>
                  )}
                  <Button
                    size='sm'
                    variant='ghost'
                    className='text-destructive'
                    onClick={() => setConfirm('delete')}
                  >
                    <Trash2 />
                    Delete
                  </Button>
                </div>
              )}

              <Block title='Announcement'>
                <p className='rounded-lg border bg-muted/40 p-3 text-sm whitespace-pre-line'>
                  {data.body}
                </p>
              </Block>

              {data.attachments.length > 0 && (
                <Block title='Attachments'>
                  <ul className='grid gap-2'>
                    {data.attachments.map((file) => (
                      <li key={file.id}>
                        <button
                          type='button'
                          className='flex w-full items-center gap-3 rounded-lg border p-3 text-left hover:bg-muted/40'
                          onClick={() =>
                            void openFile(`/files/${file.id}/content`).catch((error: unknown) =>
                              alerts.error(toApiError(error).message)
                            )
                          }
                        >
                          <FileText className='size-4 shrink-0 text-muted-foreground' />
                          <span className='grid min-w-0'>
                            <span className='truncate text-sm font-semibold'>{file.name}</span>
                            <span className='text-xs text-muted-foreground'>
                              {formatBytes(file.size_bytes)}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </Block>
              )}

              {(data.students.length > 0 || data.staff.length > 0) && (
                <Block title='Chosen people'>
                  <span className='flex flex-wrap gap-1.5'>
                    {data.students.map((item) => (
                      <Badge key={`s${item.id}`} tone='info'>
                        {item.name}
                      </Badge>
                    ))}
                    {data.staff.map((item) => (
                      <Badge key={`u${item.id}`} tone='neutral'>
                        {item.name}
                      </Badge>
                    ))}
                  </span>
                </Block>
              )}

              <Block title='Delivery'>
                <dl className='grid gap-x-6 gap-y-3 rounded-lg border p-3 sm:grid-cols-2'>
                  {[
                    ['Written by', data.author.name],
                    ['Saved', formatDateTime(data.created_at)],
                    ['Send at', formatDateTime(data.publish_at)],
                    ['Sent', formatDateTime(data.published_at)],
                    ['Leaves the feed', formatDateTime(data.expires_at)],
                    ['Academic year', data.academic_year.name],
                    ['Recipients', String(data.recipient_count)],
                    ['Read', `${data.read_count} (${data.read_percent}%)`],
                  ].map(([label, value]) => (
                    <div key={label} className='grid gap-0.5'>
                      <dt className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
                        {label}
                      </dt>
                      <dd className='text-sm font-semibold break-words'>{value}</dd>
                    </div>
                  ))}
                </dl>
                <div
                  className='h-2 overflow-hidden rounded-full bg-muted'
                  role='progressbar'
                  aria-label='Read'
                  aria-valuenow={data.read_percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className='h-full rounded-full bg-primary'
                    style={{ width: `${data.read_percent}%` }}
                  />
                </div>
              </Block>

              {sent && <Readers key={data.id} announcementId={data.id} />}
            </SheetBody>
            <ConfirmDialog
              open={confirm !== null}
              onOpenChange={(open) => !open && setConfirm(null)}
              title={
                confirm === 'delete' ? 'Delete this announcement?' : 'Archive this announcement?'
              }
              description={
                confirm === 'delete'
                  ? sent
                    ? 'It disappears from every parent and staff feed. This cannot be undone.'
                    : 'It has not been sent, so nobody will notice.'
                  : 'It leaves every feed. The read counts stay here.'
              }
              confirmText={confirm === 'delete' ? 'Delete' : 'Archive'}
              destructive={confirm === 'delete'}
              loading={archive.isPending || remove.isPending}
              onConfirm={() =>
                confirm === 'delete'
                  ? run(() => remove.mutateAsync(data.id), 'Announcement deleted', true)
                  : run(() => archive.mutateAsync(data.id), 'Announcement archived')
              }
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Readers({ announcementId }: { announcementId: number }) {
  const classes = useClasses()
  const [params, setParams] = useState<ReaderParams>({
    page: 1,
    limit: READERS_LIMIT,
    state: 'read',
  })
  const readers = useAnnouncementReaders(announcementId, params)
  const update = (patch: Partial<ReaderParams>) =>
    setParams((current) => ({ ...current, page: 1, ...patch }))
  const filtered = Boolean(params.segment || params.class_id || params.search)

  const columns: Column<AnnouncementReader>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (row) => (
        <span className='grid min-w-0'>
          <span className='font-semibold break-words'>{row.user.name}</span>
          <span className='tabular text-xs text-muted-foreground'>+91 {row.mobile}</span>
        </span>
      ),
    },
    {
      key: 'for',
      header: 'For',
      cell: (row) =>
        row.segment === 'staff' ? (
          <Badge tone='neutral'>Staff</Badge>
        ) : (
          <span className='text-sm break-words'>
            {row.students.map((item) => item.name).join(', ') || 'Parent'}
          </span>
        ),
    },
    {
      key: 'read_at',
      header: 'Read',
      align: 'right',
      cell: (row) => (
        <span className='tabular text-xs text-muted-foreground'>
          {row.read_at ? formatDateTime(row.read_at) : 'Not read'}
        </span>
      ),
    },
  ]

  return (
    <Block
      title='Recipients'
      action={
        <SegmentedControl
          label='Show read or unread'
          value={params.state ?? 'read'}
          onChange={(state) => update({ state })}
          options={[
            { value: 'read', label: 'Read' },
            { value: 'unread', label: 'Not read' },
          ]}
        />
      }
    >
      <div className='overflow-hidden rounded-lg border'>
        <ListToolbar
          summary={readers.data ? `${readers.data.total} people` : ''}
          onClear={
            filtered
              ? () => update({ segment: undefined, class_id: undefined, search: undefined })
              : undefined
          }
        >
          <SearchBox
            value={params.search ?? ''}
            onChange={(value) => update({ search: value || undefined })}
            placeholder='Name or mobile'
            label='Search recipients'
          />
          <FilterSelect
            id='reader-segment'
            label='Parents or staff'
            allLabel='Parents and staff'
            value={params.segment}
            options={[
              { value: 'parent', label: 'Parents' },
              { value: 'staff', label: 'Staff' },
            ]}
            onChange={(value) => update({ segment: value as ReaderParams['segment'] })}
          />
          <FilterSelect
            id='reader-class'
            label='Filter by class'
            allLabel='All classes'
            value={params.class_id ? String(params.class_id) : undefined}
            options={(classes.data ?? []).map((item) => ({
              value: String(item.id),
              label: `Class ${item.name}`,
            }))}
            onChange={(value) => update({ class_id: value ? Number(value) : undefined })}
          />
        </ListToolbar>
        <DataTable
          rows={readers.data?.items ?? []}
          columns={columns}
          rowKey={(row) => row.user.id}
          loading={readers.isFetching}
          error={readers.isError ? readers.error.message : null}
          onRetry={() => readers.refetch()}
          empty={{
            icon: UsersRound,
            title: filtered
              ? 'Nobody matches these filters'
              : params.state === 'read'
                ? 'Nobody has read it yet'
                : 'Everyone has read it',
          }}
          card={(row) => (
            <div className='grid gap-1'>
              <div className='flex items-start justify-between gap-2'>
                <span className='font-semibold break-words'>{row.user.name}</span>
                <span className='tabular text-xs text-muted-foreground'>
                  {row.read_at ? formatDateTime(row.read_at) : 'Not read'}
                </span>
              </div>
              <span className='text-xs break-words text-muted-foreground'>
                {row.segment === 'staff'
                  ? 'Staff'
                  : row.students.map((item) => item.name).join(', ') || 'Parent'}{' '}
                · +91 {row.mobile}
              </span>
            </div>
          )}
          pagination={{
            page: params.page,
            limit: READERS_LIMIT,
            total: readers.data?.total ?? 0,
            label: 'people',
            onPageChange: (page) => setParams((current) => ({ ...current, page })),
          }}
        />
      </div>
    </Block>
  )
}

function Block({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className='grid gap-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h3 className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  )
}
