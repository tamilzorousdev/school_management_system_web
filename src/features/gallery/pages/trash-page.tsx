import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { CircleOff, Film, FolderOpen, Images, RotateCcw, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/display'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { can, useMe } from '@/features/auth/api'
import { useClasses } from '@/features/setup/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate, formatDateTime } from '@/lib/format'
import {
  galleryApi,
  useGalleryMutation,
  useTrash,
  type RestoreInput,
  type RestoreResult,
  type TrashItem,
} from '../api'
import { GalleryTabs } from '../components/gallery-tabs'
import { RestoreTargetModal } from '../components/restore-target-modal'
import { classLabel, plural } from '../format'
import {
  DELETE_REASON_LABELS,
  DELETE_REASON_OPTIONS,
  formatStorage,
  MEDIA_TYPE_OPTIONS,
  SCOPE_LABELS,
  SCOPE_OPTIONS,
} from '../labels'
import type { TrashSearch } from '../search'

const route = getRouteApi('/_app/gallery/trash')
const LIMIT = 25

export function TrashPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/gallery/trash' })
  const me = useMe().data
  const canManage = can(me, 'gallery.manage')
  const canConfigure = can(me, 'gallery.configure')
  const trash = useTrash({ ...search, limit: LIMIT })
  const classes = useClasses()
  const restore = useGalleryMutation(galleryApi.restore)
  const purge = useGalleryMutation(galleryApi.purge)
  const empty = useGalleryMutation(galleryApi.emptyTrash)

  const selectionKey = JSON.stringify(search)
  const [selection, setSelection] = useState<{ key: string; ids: number[] }>({ key: '', ids: [] })
  const selected = selection.key === selectionKey ? selection.ids : []
  const setSelected = (ids: number[]) => setSelection({ key: selectionKey, ids })
  const [needsAlbum, setNeedsAlbum] = useState<number[]>([])
  const [confirm, setConfirm] = useState<'purge' | 'empty' | null>(null)

  const setSearch = (patch: Partial<TrashSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })

  useShortcut('app.refresh', () => void trash.refetch())

  const rows = trash.data?.items ?? []
  const isMedia = search.kind === 'media'
  const classList = classes.data ?? []
  const selectedClass = classList.find((item) => item.id === search.class_id)
  const sectionOptions = (
    selectedClass ? selectedClass.sections : classList.flatMap((c) => c.sections)
  ).map((section) => ({
    value: String(section.id),
    label: `${classLabel(section.class_name)} - ${section.name}`,
  }))

  const report = (result: RestoreResult) => {
    const restored = result.media_restored + result.albums_restored
    if (restored) {
      alerts.success(
        [
          result.albums_restored ? plural(result.albums_restored, 'album') : '',
          result.media_restored ? plural(result.media_restored, 'item') : '',
        ]
          .filter(Boolean)
          .join(' and ') + ' restored'
      )
    }
    if (result.duplicates.length) {
      alerts.warning(`${plural(result.duplicates.length, 'item')} left in Trash`, {
        description: 'The same file is already in that album.',
      })
    }
    setNeedsAlbum(result.needs_album)
    if (!result.needs_album.length) setSelected([])
  }

  const doRestore = async (input: RestoreInput) => {
    try {
      report(await restore.mutateAsync(input))
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const restoreIds = (ids: number[]) =>
    void doRestore(isMedia ? { media_ids: ids } : { album_ids: ids })

  const toggle = (id: number) =>
    setSelected(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id])

  const checkbox = (item: TrashItem) => (
    <input
      type='checkbox'
      className='size-4 cursor-pointer accent-primary'
      aria-label={`Select ${item.name}`}
      checked={selected.includes(item.id)}
      onChange={() => toggle(item.id)}
      onClick={(event) => event.stopPropagation()}
    />
  )

  const origin = (item: TrashItem) =>
    [
      item.kind === 'media' ? item.album_title : null,
      item.scope === 'school' ? SCOPE_LABELS.school : null,
      item.class_name ? classLabel(item.class_name) : null,
      item.section_name,
    ]
      .filter(Boolean)
      .join(' · ') || '—'

  const thumb = (item: TrashItem) => (
    <span className='grid size-10 shrink-0 place-items-center overflow-hidden rounded-md bg-muted text-muted-foreground'>
      {item.thumbnail_url ? (
        <img src={item.thumbnail_url} alt='' loading='lazy' className='size-full object-cover' />
      ) : item.kind === 'album' ? (
        <FolderOpen className='size-4' />
      ) : item.media_type === 'video' ? (
        <Film className='size-4' />
      ) : (
        <Images className='size-4' />
      )}
    </span>
  )

  const columns: Column<TrashItem>[] = [
    ...(canManage
      ? [
          {
            key: 'select',
            header: (
              <input
                type='checkbox'
                className='size-4 cursor-pointer accent-primary'
                aria-label='Select all on this page'
                checked={rows.length > 0 && selected.length === rows.length}
                onChange={() =>
                  setSelected(selected.length === rows.length ? [] : rows.map((r) => r.id))
                }
              />
            ),
            className: 'w-10',
            cell: checkbox,
          },
        ]
      : []),
    {
      key: 'name',
      header: isMedia ? 'Item' : 'Album',
      cell: (item) => (
        <div className='flex items-center gap-3'>
          {thumb(item)}
          <div className='grid min-w-0'>
            <span className='truncate font-bold'>{item.name}</span>
            <span className='text-xs text-muted-foreground'>
              {item.kind === 'album' ? plural(item.item_count, 'item') : ''}
              {item.kind === 'album' ? ' · ' : ''}
              {formatStorage(item.size_bytes)}
              {item.kind === 'media' && !item.album_available ? ' · album gone' : ''}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'origin',
      header: 'From',
      cell: (item) => <span className='text-sm'>{origin(item)}</span>,
    },
    {
      key: 'reason',
      header: 'Reason',
      cell: (item) =>
        item.deleted_reason ? (
          <Badge tone={item.deleted_reason === 'manual' ? 'neutral' : 'warning'}>
            {DELETE_REASON_LABELS[item.deleted_reason]}
          </Badge>
        ) : (
          '—'
        ),
    },
    {
      key: 'deleted',
      header: 'Deleted',
      hideBelow: 'lg',
      cell: (item) => (
        <div className='grid'>
          <span>{formatDateTime(item.deleted_at)}</span>
          <span className='text-xs text-muted-foreground'>
            {item.deleted_by_name ?? 'Automatic cleanup'}
          </span>
        </div>
      ),
    },
    {
      key: 'purge',
      header: 'Deleted for good on',
      cell: (item) => (
        <span className='text-sm'>
          {item.purge_after ? formatDate(item.purge_after) : 'Kept until emptied'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      cell: (item) =>
        canManage && (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => restoreIds([item.id])}
            disabled={restore.isPending}
          >
            <RotateCcw />
            Restore
          </Button>
        ),
    },
  ]

  const filtered = Boolean(
    search.search ||
    search.reason ||
    search.media_type ||
    search.scope ||
    search.class_id ||
    search.section_id
  )

  if (me && !canManage) {
    return (
      <Page>
        <PageHeader eyebrow='Gallery' title='Trash' />
        <EmptyState
          icon={Trash2}
          title='No access to Trash'
          description='Restoring from Trash needs the gallery manage permission.'
        />
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        eyebrow='Gallery'
        title='Trash'
        description='Deleted albums, photos and videos stay here for the recovery period, then the cleanup deletes them for good.'
        actions={
          canConfigure && (
            <Button
              variant='outline'
              className='text-destructive hover:bg-destructive/10'
              onClick={() => setConfirm('empty')}
              disabled={!trash.data?.total}
            >
              <Trash2 />
              Empty Trash
            </Button>
          )
        }
      />
      <GalleryTabs active='/gallery/trash' />

      <PageTabs<'media' | 'album'>
        label='Trash'
        value={search.kind}
        onChange={(kind) => navigate({ search: { page: 1, kind }, replace: true })}
        tabs={[
          { value: 'media', label: 'Photos and videos', icon: Images },
          { value: 'album', label: 'Albums', icon: FolderOpen },
        ]}
      />

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={trash.data ? `${trash.data.total} in Trash` : ''}
          onClear={
            filtered
              ? () => navigate({ search: { page: 1, kind: search.kind }, replace: true })
              : undefined
          }
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder={isMedia ? 'Search file names' : 'Search album titles'}
            label='Search Trash'
          />
          <FilterSelect
            id='trash-reason'
            label='Filter by reason'
            allLabel='Any reason'
            value={search.reason}
            options={DELETE_REASON_OPTIONS}
            onChange={(value) => setSearch({ reason: value as TrashSearch['reason'] })}
          />
          {isMedia && (
            <FilterSelect
              id='trash-media-type'
              label='Filter by media type'
              allLabel='Photos and videos'
              value={search.media_type}
              options={MEDIA_TYPE_OPTIONS}
              onChange={(value) => setSearch({ media_type: value as TrashSearch['media_type'] })}
            />
          )}
          <FilterSelect
            id='trash-scope'
            label='Filter by gallery'
            allLabel='All galleries'
            value={search.scope}
            options={SCOPE_OPTIONS}
            onChange={(value) => setSearch({ scope: value as TrashSearch['scope'] })}
          />
          <FilterSelect
            id='trash-class'
            label='Filter by class'
            allLabel='All classes'
            value={search.class_id ? String(search.class_id) : undefined}
            options={classList.map((item) => ({
              value: String(item.id),
              label: classLabel(item.name),
            }))}
            onChange={(value) =>
              setSearch({ class_id: value ? Number(value) : undefined, section_id: undefined })
            }
          />
          <FilterSelect
            id='trash-section'
            label='Filter by section'
            allLabel='All sections'
            value={search.section_id ? String(search.section_id) : undefined}
            options={sectionOptions}
            onChange={(value) => setSearch({ section_id: value ? Number(value) : undefined })}
          />
        </ListToolbar>

        {selected.length > 0 && (
          <div className='flex flex-wrap items-center gap-2 border-b bg-muted/40 px-4 py-2 text-sm'>
            <span className='font-semibold'>{selected.length} selected</span>
            <Button size='sm' onClick={() => restoreIds(selected)} loading={restore.isPending}>
              <RotateCcw />
              Restore
            </Button>
            {canConfigure && (
              <Button size='sm' variant='destructive' onClick={() => setConfirm('purge')}>
                <Trash2 />
                Delete for good
              </Button>
            )}
            <Button size='sm' variant='ghost' onClick={() => setSelected([])}>
              Clear selection
            </Button>
          </div>
        )}

        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(item) => `${item.kind}-${item.id}`}
          loading={trash.isFetching}
          error={trash.isError ? trash.error.message : null}
          onRetry={() => trash.refetch()}
          empty={{
            icon: filtered ? CircleOff : Trash2,
            title: filtered ? 'Nothing in Trash matches these filters' : 'Trash is empty',
            description: filtered
              ? 'Try another word or clear the filters.'
              : 'Deleted items show up here.',
          }}
          card={(item) => (
            <div className='flex items-start gap-3'>
              {canManage && <span className='pt-3'>{checkbox(item)}</span>}
              {thumb(item)}
              <div className='grid min-w-0 flex-1 gap-1'>
                <span className='truncate font-bold'>{item.name}</span>
                <span className='text-xs text-muted-foreground'>{origin(item)}</span>
                <span className='flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground'>
                  {item.deleted_reason && (
                    <Badge>{DELETE_REASON_LABELS[item.deleted_reason]}</Badge>
                  )}
                  Deleted {formatDate(item.deleted_at)}
                  {item.deleted_by_name ? ` by ${item.deleted_by_name}` : ''}
                </span>
                <span className='text-xs text-muted-foreground'>
                  {item.purge_after
                    ? `Deleted for good on ${formatDate(item.purge_after)}`
                    : 'Kept until emptied'}
                </span>
                {canManage && (
                  <Button
                    variant='outline'
                    size='sm'
                    className='mt-1 w-fit'
                    onClick={() => restoreIds([item.id])}
                    disabled={restore.isPending}
                  >
                    <RotateCcw />
                    Restore
                  </Button>
                )}
              </div>
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: trash.data?.total ?? 0,
            label: 'items',
            onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
          }}
        />
      </Card>

      <RestoreTargetModal
        count={needsAlbum.length}
        loading={restore.isPending}
        onCancel={() => setNeedsAlbum([])}
        onConfirm={(albumId) => void doRestore({ media_ids: needsAlbum, target_album_id: albumId })}
      />
      <ConfirmDialog
        open={confirm === 'purge'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={`Delete ${plural(selected.length, isMedia ? 'item' : 'album')} for good?`}
        description='The files and thumbnails are removed from storage. This cannot be undone.'
        confirmText='Delete for good'
        destructive
        loading={purge.isPending}
        onConfirm={async () => {
          try {
            const result = await purge.mutateAsync(
              isMedia ? { media_ids: selected } : { album_ids: selected }
            )
            alerts.success(
              `Deleted ${plural(result.media_purged + result.albums_purged, 'item')} for good · ${formatStorage(result.bytes_reclaimed)} freed`
            )
            if (result.failed)
              alerts.warning(`${plural(result.failed, 'item')} could not be deleted`)
            setSelected([])
            setConfirm(null)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      />
      <ConfirmDialog
        open={confirm === 'empty'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title='Empty Trash?'
        description='Every album, photo and video in Trash is deleted for good, with its files. Items on a retention hold stay. This cannot be undone.'
        confirmText='Empty Trash'
        destructive
        loading={empty.isPending}
        onConfirm={async () => {
          try {
            const result = await empty.mutateAsync()
            alerts.success(
              `Trash emptied · ${plural(result.media_purged + result.albums_purged, 'item')} · ${formatStorage(result.bytes_reclaimed)} freed`
            )
            if (result.failed)
              alerts.warning(`${plural(result.failed, 'item')} could not be deleted`)
            setConfirm(null)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      />
    </Page>
  )
}
