import { useRef, useState } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import {
  Archive,
  ArrowLeft,
  CheckSquare,
  CircleOff,
  Clock4,
  Download,
  Film,
  ImageUp,
  Images,
  Lock,
  LockOpen,
  MoreHorizontal,
  Pencil,
  Play,
  Send,
  Share2,
  Square,
  Star,
  Trash2,
  Undo2,
  Video,
  X,
} from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DetailList, EmptyState, ErrorState } from '@/components/common/display'
import { FilterSelect, ListToolbar } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { Pagination } from '@/components/common/pagination'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DialogFooter } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  galleryApi,
  useAlbum,
  useAlbumMedia,
  useGalleryMutation,
  useGallerySettings,
  useInvalidateGallery,
  type GalleryMedia,
} from '../api'
import { AlbumFormModal } from '../components/album-form-modal'
import { CaptionModal } from '../components/caption-modal'
import { ApplyHoldModal, ReleaseHoldModal, type HoldTarget } from '../components/hold-modals'
import { MediaViewer } from '../components/media-viewer'
import { UserFilter } from '../components/pickers'
import { UploadPanel } from '../components/upload-panel'
import {
  ALBUM_STATUS,
  formatDuration,
  formatStorage,
  isExpired,
  MEDIA_STATUS_OPTIONS,
  MEDIA_TYPE_OPTIONS,
  SCOPE_LABELS,
  scopeLabel,
  uploadRules,
  VISIBILITY_LABELS,
} from '../labels'
import type { AlbumSearch } from '../search'

const route = getRouteApi('/_app/gallery/albums/$albumId')
const LIMIT = 48

type Pending =
  | { kind: 'delete-album' }
  | { kind: 'delete-media'; media: GalleryMedia }
  | { kind: 'delete-selected' }
  | { kind: 'unpublish' }
  | { kind: 'archive' }

export function AlbumPage() {
  const { albumId } = route.useParams()
  const id = Number(albumId)
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/gallery/albums/$albumId' })
  const me = useMe().data
  const canManage = can(me, 'gallery.manage')
  const canConfigure = can(me, 'gallery.configure')

  const album = useAlbum(id)
  const media = useAlbumMedia(id, { ...search, limit: LIMIT }, album.isSuccess)
  const settings = useGallerySettings()
  const invalidate = useInvalidateGallery()

  const [editOpen, setEditOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [notify, setNotify] = useState(true)
  const [pending, setPending] = useState<Pending | null>(null)
  const [viewing, setViewing] = useState<number | null>(null)
  const [caption, setCaption] = useState<GalleryMedia | null>(null)
  const [holdTarget, setHoldTarget] = useState<HoldTarget | null>(null)
  const [releasing, setReleasing] = useState<{ id: number; name: string } | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [selecting, setSelecting] = useState(false)
  const posterInput = useRef<HTMLInputElement>(null)
  const posterFor = useRef<number | null>(null)

  const publish = useGalleryMutation(galleryApi.publish)
  const unpublish = useGalleryMutation(galleryApi.unpublish)
  const archive = useGalleryMutation(galleryApi.archive)
  const feature = useGalleryMutation(galleryApi.feature)
  const share = useGalleryMutation(galleryApi.share)
  const removeAlbum = useGalleryMutation(galleryApi.removeAlbum)
  const removeMedia = useGalleryMutation(galleryApi.removeMedia)
  const removeMany = useGalleryMutation(galleryApi.removeMediaMany)
  const updateAlbum = useGalleryMutation(galleryApi.updateAlbum)
  const poster = useGalleryMutation(galleryApi.setPoster)

  const setSearch = (patch: Partial<AlbumSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })

  useShortcut('app.refresh', () => {
    void album.refetch()
    void media.refetch()
  })

  const run = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action()
      alerts.success(message)
      return true
    } catch (error) {
      alerts.error(toApiError(error).message)
      return false
    }
  }

  const releaseHoldFor = async (target: { album_id?: number; media_id?: number; name: string }) => {
    try {
      const holds = await galleryApi.holds({ page: 1, limit: 1, active: true, ...target })
      const hold = holds.items[0]
      if (!hold) {
        alerts.info('This item is protected through its album hold')
        return
      }
      setReleasing({ id: hold.id, name: target.name })
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const rows = media.data?.items ?? []
  const refreshIfExpired = () => {
    if (rows.some((item) => isExpired(item.url_expires_at))) void media.refetch()
  }

  if (album.isError) {
    const notFound = toApiError(album.error).status === 404
    return (
      <Page>
        <BackLink />
        {notFound ? (
          <EmptyState
            icon={Images}
            title='Album not found'
            description='It may have been moved to Trash or belong to another year.'
          />
        ) : (
          <ErrorState message={album.error.message} onRetry={() => album.refetch()} />
        )}
      </Page>
    )
  }

  if (!album.data) {
    return (
      <Page>
        <BackLink />
        <Skeleton className='h-24' />
        <Skeleton className='h-64' />
      </Page>
    )
  }

  const data = album.data
  const manage = canManage && data.can_manage
  const readOnly = data.status === 'archived'
  const status = ALBUM_STATUS[data.status]
  const rules = settings.data ? uploadRules(settings.data) : null
  const deletable = rows.filter((item) => item.can_delete)
  const filtered = Boolean(search.media_type || search.uploader_id || search.status)

  const toggleSelected = (mediaId: number) =>
    setSelected((list) =>
      list.includes(mediaId) ? list.filter((item) => item !== mediaId) : [...list, mediaId]
    )

  const confirmPending = async () => {
    if (!pending) return
    if (pending.kind === 'delete-album') {
      if (await run(() => removeAlbum.mutateAsync({ id }), 'Album moved to Trash'))
        void navigate({ to: '/gallery', search: { page: 1 } })
    } else if (pending.kind === 'delete-media') {
      if (await run(() => removeMedia.mutateAsync({ id: pending.media.id }), 'Moved to Trash'))
        setPending(null)
    } else if (pending.kind === 'delete-selected') {
      const ok = await run(
        () => removeMany.mutateAsync({ media_ids: selected }),
        `${selected.length} ${selected.length === 1 ? 'item' : 'items'} moved to Trash`
      )
      if (ok) {
        setSelected([])
        setSelecting(false)
        setPending(null)
      }
    } else if (pending.kind === 'unpublish') {
      if (await run(() => unpublish.mutateAsync(id), 'Album moved back to draft')) setPending(null)
    } else if (pending.kind === 'archive') {
      if (await run(() => archive.mutateAsync(id), 'Album archived')) setPending(null)
    }
  }

  const pendingCopy: Record<Pending['kind'], { title: string; text: string; action: string }> = {
    'delete-album': {
      title: `Delete "${data.title}"?`,
      text: 'The album and all its photos and videos move to Trash. You can restore them until the recovery period ends.',
      action: 'Move to Trash',
    },
    'delete-media': {
      title: 'Delete this item?',
      text: 'It moves to Trash and can be restored until the recovery period ends.',
      action: 'Move to Trash',
    },
    'delete-selected': {
      title: `Delete ${selected.length} ${selected.length === 1 ? 'item' : 'items'}?`,
      text: 'They move to Trash and can be restored until the recovery period ends.',
      action: 'Move to Trash',
    },
    unpublish: {
      title: 'Move back to draft?',
      text: 'Parents and staff stop seeing this album until you publish it again.',
      action: 'Unpublish',
    },
    archive: {
      title: 'Archive this album?',
      text: 'Parents stop seeing it and it becomes read-only. Archived albums follow the archived-albums retention policy.',
      action: 'Archive',
    },
  }

  return (
    <Page>
      <BackLink />
      <PageHeader
        eyebrow={SCOPE_LABELS[data.scope]}
        title={
          <span className='flex flex-wrap items-center gap-2'>
            <span className='min-w-0 break-words'>{data.title}</span>
            <Badge tone={status.tone}>{status.label}</Badge>
            {data.is_featured && (
              <Badge tone='warning'>
                <Star className='size-3' aria-hidden />
                Featured
              </Badge>
            )}
            {data.on_hold && (
              <Badge tone='info'>
                <Lock className='size-3' aria-hidden />
                On hold
              </Badge>
            )}
          </span>
        }
        description={data.description ?? undefined}
        actions={
          <>
            {manage && data.status !== 'published' && (
              <Button
                onClick={() => {
                  setNotify(data.viewer.sharing_enabled)
                  setPublishOpen(true)
                }}
              >
                <Send />
                Publish
              </Button>
            )}
            {manage && data.status === 'published' && data.viewer.sharing_enabled && (
              <Button
                variant='outline'
                loading={share.isPending}
                onClick={() =>
                  void run(async () => {
                    const result = await share.mutateAsync(id)
                    alerts.info(`Sent to ${result.recipients} people`)
                  }, 'Album shared')
                }
              >
                <Share2 />
                Share
              </Button>
            )}
            {manage && !readOnly && (
              <Button variant='outline' onClick={() => setEditOpen(true)}>
                <Pencil />
                Edit
              </Button>
            )}
            {(manage || canConfigure) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' size='icon' aria-label='More album actions'>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  {manage && (
                    <DropdownMenuItem
                      onSelect={() =>
                        void run(
                          () => feature.mutateAsync({ id, is_featured: !data.is_featured }),
                          data.is_featured ? 'Removed from featured' : 'Album featured'
                        )
                      }
                    >
                      <Star />
                      {data.is_featured ? 'Remove from featured' : 'Feature album'}
                    </DropdownMenuItem>
                  )}
                  {manage && data.status === 'published' && (
                    <DropdownMenuItem onSelect={() => setPending({ kind: 'unpublish' })}>
                      <Undo2 />
                      Unpublish
                    </DropdownMenuItem>
                  )}
                  {manage && data.status !== 'archived' && (
                    <DropdownMenuItem onSelect={() => setPending({ kind: 'archive' })}>
                      <Archive />
                      Archive
                    </DropdownMenuItem>
                  )}
                  {canConfigure &&
                    (data.on_hold ? (
                      <DropdownMenuItem
                        onSelect={() => void releaseHoldFor({ album_id: id, name: data.title })}
                      >
                        <LockOpen />
                        Release retention hold
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onSelect={() => setHoldTarget({ album_id: id, name: data.title })}
                      >
                        <Lock />
                        Apply retention hold
                      </DropdownMenuItem>
                    ))}
                  {manage && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        destructive
                        onSelect={() => setPending({ kind: 'delete-album' })}
                      >
                        <Trash2 />
                        Delete album
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        }
      />

      <Card>
        <CardContent>
          <DetailList
            className='lg:grid-cols-4'
            items={[
              { label: 'Gallery', value: scopeLabel(data) },
              { label: 'Academic year', value: data.academic_year ?? '—' },
              { label: 'Category', value: data.category ?? '—' },
              { label: 'Event date', value: data.event_date ? formatDate(data.event_date) : '—' },
              { label: 'Who can see it', value: VISIBILITY_LABELS[data.visibility] },
              {
                label: 'Media',
                value: `${data.photo_count} photos · ${data.video_count} videos · ${formatStorage(data.size_bytes)}`,
              },
              {
                label: 'Downloads',
                value:
                  data.allow_download && data.viewer.downloads_enabled ? 'Allowed' : 'Not allowed',
              },
              {
                label: 'Created',
                value: `${formatDateTime(data.created_at)}${data.created_by_name ? ` by ${data.created_by_name}` : ''}`,
              },
              {
                label: 'Published',
                value: data.published_at ? formatDateTime(data.published_at) : 'Not yet',
              },
              {
                label: 'Tags',
                value: data.tags.length ? (
                  <span className='flex flex-wrap gap-1'>
                    {data.tags.map((tag) => (
                      <Badge key={tag}>#{tag}</Badge>
                    ))}
                  </span>
                ) : (
                  '—'
                ),
              },
            ]}
          />
        </CardContent>
      </Card>

      {manage && !readOnly && (
        <UploadPanel albumId={id} rules={rules} onUploaded={() => void invalidate()} />
      )}

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={
            media.data ? `${media.data.total} ${media.data.total === 1 ? 'item' : 'items'}` : ''
          }
          onClear={filtered ? () => navigate({ search: { page: 1 }, replace: true }) : undefined}
        >
          <FilterSelect
            id='album-media-type'
            label='Filter by media type'
            allLabel='Photos and videos'
            value={search.media_type}
            options={MEDIA_TYPE_OPTIONS}
            onChange={(value) => setSearch({ media_type: value as AlbumSearch['media_type'] })}
          />
          <UserFilter
            id='album-uploader'
            label='Filter by uploader'
            allLabel='Anyone'
            value={search.uploader_id}
            onChange={(uploader_id) => setSearch({ uploader_id })}
          />
          <FilterSelect
            id='album-media-status'
            label='Filter by status'
            allLabel='Any status'
            value={search.status}
            options={MEDIA_STATUS_OPTIONS}
            onChange={(value) => setSearch({ status: value as AlbumSearch['status'] })}
          />
          {manage && deletable.length > 0 && (
            <Button
              variant={selecting ? 'secondary' : 'outline'}
              size='sm'
              onClick={() => {
                setSelecting(!selecting)
                setSelected([])
              }}
            >
              {selecting ? <X /> : <CheckSquare />}
              {selecting ? 'Cancel selection' : 'Select'}
            </Button>
          )}
          {selecting && (
            <>
              <Button
                variant='ghost'
                size='sm'
                onClick={() =>
                  setSelected(
                    selected.length === deletable.length ? [] : deletable.map((item) => item.id)
                  )
                }
              >
                {selected.length === deletable.length ? 'Select none' : 'Select all on page'}
              </Button>
              <Button
                variant='destructive'
                size='sm'
                disabled={!selected.length}
                onClick={() => setPending({ kind: 'delete-selected' })}
              >
                <Trash2 />
                Delete {selected.length || ''}
              </Button>
            </>
          )}
        </ListToolbar>

        {media.isError && !rows.length ? (
          <ErrorState message={media.error.message} onRetry={() => media.refetch()} />
        ) : media.isPending ? (
          <div className='grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6'>
            {Array.from({ length: 12 }, (_, index) => (
              <Skeleton key={index} className='aspect-square rounded-lg' />
            ))}
          </div>
        ) : !rows.length ? (
          <EmptyState
            icon={filtered ? CircleOff : ImageUp}
            title={filtered ? 'Nothing matches these filters' : 'No photos or videos yet'}
            description={
              filtered
                ? 'Clear the filters to see everything in this album.'
                : manage && !readOnly
                  ? 'Drop files into the upload box above.'
                  : 'Nothing has been uploaded to this album.'
            }
          />
        ) : (
          <div className={cn('transition-opacity', media.isFetching && 'opacity-60')}>
            <ul className='grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6'>
              {rows.map((item, index) => (
                <li key={item.id} className='min-w-0'>
                  <MediaTile
                    item={item}
                    isCover={data.cover_media_id === item.id}
                    selecting={selecting}
                    selected={selected.includes(item.id)}
                    onOpen={() => {
                      if (selecting) {
                        if (item.can_delete) toggleSelected(item.id)
                        return
                      }
                      refreshIfExpired()
                      setViewing(index)
                    }}
                    onThumbError={refreshIfExpired}
                    menu={
                      (manage || canConfigure) && (
                        <TileMenu
                          item={item}
                          manage={manage && !readOnly}
                          configure={canConfigure}
                          isCover={data.cover_media_id === item.id}
                          onCaption={() => setCaption(item)}
                          onCover={() =>
                            void run(
                              () => updateAlbum.mutateAsync({ id, cover_media_id: item.id }),
                              'Album cover set'
                            )
                          }
                          onPoster={() => {
                            posterFor.current = item.id
                            posterInput.current?.click()
                          }}
                          onHold={() =>
                            setHoldTarget({ media_id: item.id, name: item.original_name })
                          }
                          onRelease={() =>
                            void releaseHoldFor({ media_id: item.id, name: item.original_name })
                          }
                          onDelete={() => setPending({ kind: 'delete-media', media: item })}
                        />
                      )
                    }
                  />
                </li>
              ))}
            </ul>
            <Pagination
              page={search.page}
              limit={LIMIT}
              total={media.data?.total ?? 0}
              label='items'
              onPageChange={(page) => navigate({ search: (prev) => ({ ...prev, page }) })}
            />
          </div>
        )}
      </Card>

      <input
        ref={posterInput}
        type='file'
        accept='image/jpeg,image/png,image/webp'
        className='sr-only'
        aria-label='Choose a video still'
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          const mediaId = posterFor.current
          if (!file || !mediaId) return
          void run(() => poster.mutateAsync({ id: mediaId, file }), 'Video still saved')
        }}
      />

      <MediaViewer
        items={rows}
        index={viewing}
        onIndexChange={setViewing}
        onClose={() => setViewing(null)}
        album={{ title: data.title, event_date: data.event_date, place: scopeLabel(data) }}
        slideshowEnabled={data.viewer.slideshow_enabled}
        onExpired={refreshIfExpired}
      />
      <AlbumFormModal open={editOpen} onOpenChange={setEditOpen} album={data} />
      <CaptionModal media={caption} onClose={() => setCaption(null)} />
      <ApplyHoldModal target={holdTarget} onClose={() => setHoldTarget(null)} />
      <ReleaseHoldModal hold={releasing} onClose={() => setReleasing(null)} />
      <AppModal
        open={publishOpen}
        onOpenChange={setPublishOpen}
        title='Publish album'
        description='Everyone who can see it finds it in the Staff and Parent apps.'
        loading={publish.isPending}
        footer={
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setPublishOpen(false)}
              disabled={publish.isPending}
            >
              Cancel
            </Button>
            <Button
              loading={publish.isPending}
              onClick={async () => {
                if (await run(() => publish.mutateAsync({ id, notify }), 'Album published'))
                  setPublishOpen(false)
              }}
            >
              <Send />
              Publish
            </Button>
          </DialogFooter>
        }
      >
        <div className='flex items-center justify-between gap-3 rounded-lg border p-3 text-sm'>
          <label htmlFor='publish-notify' className='grid cursor-pointer'>
            <span className='font-semibold'>Notify the audience</span>
            <span className='text-xs text-muted-foreground'>
              {data.viewer.sharing_enabled
                ? 'Send an in-app notice to everyone who can see it'
                : 'Sharing is switched off in the gallery settings'}
            </span>
          </label>
          <Switch
            id='publish-notify'
            checked={notify && data.viewer.sharing_enabled}
            disabled={!data.viewer.sharing_enabled}
            onCheckedChange={setNotify}
          />
        </div>
      </AppModal>
      <ConfirmDialog
        open={Boolean(pending)}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending ? pendingCopy[pending.kind].title : ''}
        description={pending ? pendingCopy[pending.kind].text : ''}
        confirmText={pending ? pendingCopy[pending.kind].action : 'Confirm'}
        destructive={pending?.kind !== 'unpublish'}
        loading={
          removeAlbum.isPending ||
          removeMedia.isPending ||
          removeMany.isPending ||
          unpublish.isPending ||
          archive.isPending
        }
        onConfirm={() => void confirmPending()}
      />
    </Page>
  )
}

function BackLink() {
  return (
    <Link
      to='/gallery'
      search={{ page: 1 }}
      className='inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground'
    >
      <ArrowLeft className='size-4' />
      All albums
    </Link>
  )
}

function MediaTile({
  item,
  isCover,
  selecting,
  selected,
  onOpen,
  onThumbError,
  menu,
}: {
  item: GalleryMedia
  isCover: boolean
  selecting: boolean
  selected: boolean
  onOpen: () => void
  onThumbError: () => void
  menu: React.ReactNode
}) {
  const label = item.title || item.original_name
  return (
    <div
      className={cn(
        'group relative aspect-square overflow-hidden rounded-lg border bg-muted',
        selected && 'ring-2 ring-primary'
      )}
    >
      <button
        type='button'
        onClick={onOpen}
        aria-label={selecting ? `Select ${label}` : `Open ${label}`}
        aria-pressed={selecting ? selected : undefined}
        className='block size-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40'
      >
        {item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt=''
            loading='lazy'
            decoding='async'
            onError={onThumbError}
            className='size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]'
          />
        ) : (
          <span className='grid size-full place-items-center text-muted-foreground'>
            {item.media_type === 'video' ? (
              <Film className='size-8' />
            ) : (
              <Images className='size-8' />
            )}
          </span>
        )}
      </button>
      {item.media_type === 'video' && (
        <span className='pointer-events-none absolute right-1.5 bottom-1.5 inline-flex items-center gap-1 rounded bg-foreground/75 px-1.5 py-0.5 text-[10px] font-semibold text-background'>
          <Play className='size-3' aria-hidden />
          {formatDuration(item.duration_seconds) || <Video className='size-3' aria-hidden />}
        </span>
      )}
      <span className='pointer-events-none absolute bottom-1.5 left-1.5 flex flex-wrap gap-1'>
        {isCover && <Badge className='bg-card/90 text-[10px]'>Cover</Badge>}
        {item.status === 'pending_deletion' && (
          <Badge tone='danger' className='bg-card/90 text-[10px]'>
            <Clock4 className='size-3' aria-hidden />
            {item.trash_at ? `Trash ${formatDate(item.trash_at)}` : 'Scheduled'}
          </Badge>
        )}
        {item.on_hold && (
          <Badge tone='info' className='bg-card/90 text-[10px]'>
            <Lock className='size-3' aria-hidden />
            Hold
          </Badge>
        )}
      </span>
      {selecting && item.can_delete && (
        <span className='pointer-events-none absolute top-1.5 left-1.5 grid size-6 place-items-center rounded bg-card/90 text-primary'>
          {selected ? <CheckSquare className='size-4' /> : <Square className='size-4' />}
        </span>
      )}
      {!selecting && menu && <div className='absolute top-1.5 right-1.5'>{menu}</div>}
    </div>
  )
}

function TileMenu({
  item,
  manage,
  configure,
  isCover,
  onCaption,
  onCover,
  onPoster,
  onHold,
  onRelease,
  onDelete,
}: {
  item: GalleryMedia
  manage: boolean
  configure: boolean
  isCover: boolean
  onCaption: () => void
  onCover: () => void
  onPoster: () => void
  onHold: () => void
  onRelease: () => void
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size='icon-sm'
          aria-label={`Actions for ${item.title || item.original_name}`}
          className='size-7 bg-card/90 opacity-100 backdrop-blur transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 sm:data-[state=open]:opacity-100'
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {manage && (
          <DropdownMenuItem onSelect={onCaption}>
            <Pencil />
            Edit caption
          </DropdownMenuItem>
        )}
        {manage && !isCover && item.thumbnail_url && (
          <DropdownMenuItem onSelect={onCover}>
            <Images />
            Use as album cover
          </DropdownMenuItem>
        )}
        {manage && item.media_type === 'video' && (
          <DropdownMenuItem onSelect={onPoster}>
            <ImageUp />
            Set video still
          </DropdownMenuItem>
        )}
        {item.download_url && (
          <DropdownMenuItem asChild>
            <a href={item.download_url} download={item.original_name}>
              <Download />
              Download
            </a>
          </DropdownMenuItem>
        )}
        {configure &&
          (item.on_hold ? (
            <DropdownMenuItem onSelect={onRelease}>
              <LockOpen />
              Release hold
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={onHold}>
              <Lock />
              Apply hold
            </DropdownMenuItem>
          ))}
        {manage && item.can_delete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={onDelete}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
