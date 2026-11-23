import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  CalendarClock,
  CircleOff,
  Clock4,
  HardDrive,
  Image as ImageIcon,
  Images,
  Lock,
  Plus,
  Star,
  Trash2,
  Upload,
  Video,
} from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/common/display'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { Pagination } from '@/components/common/pagination'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Kbd } from '@/components/shortcuts/kbd'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { useClasses } from '@/features/setup/api'
import { cn } from '@/lib/utils'
import { useAlbums, useGalleryCategories, useGalleryDashboard, type AlbumScope } from '../api'
import { AlbumCard } from '../components/album-card'
import { AlbumFormModal } from '../components/album-form-modal'
import { GalleryTabs } from '../components/gallery-tabs'
import { classLabel } from '../format'
import {
  ALBUM_STATUS_OPTIONS,
  formatStorage,
  MEDIA_TYPE_OPTIONS,
  VISIBILITY_OPTIONS,
} from '../labels'
import type { GallerySearch } from '../search'

const route = getRouteApi('/_app/gallery')
const LIMIT = 24

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Newest first' },
  { value: 'event_date:desc', label: 'Event date' },
  { value: 'published_at:desc', label: 'Recently published' },
  { value: 'title:asc', label: 'Title A to Z' },
]

type ScopeTab = 'all' | AlbumScope

export function GalleryPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/gallery' })
  const me = useMe().data
  const canView = can(me, 'gallery.view')
  const canManage = can(me, 'gallery.manage')
  const [formOpen, setFormOpen] = useState(false)

  const albums = useAlbums({ ...search, limit: LIMIT }, canView)
  const dashboard = useGalleryDashboard({
    class_id: search.class_id,
    section_id: search.section_id,
    category_id: search.category_id,
    media_type: search.media_type,
    from: search.from,
    to: search.to,
  })
  const categories = useGalleryCategories()
  const classes = useClasses()

  const setSearch = (patch: Partial<GallerySearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })

  useShortcut('gallery.create', () => setFormOpen(true), { enabled: canManage })
  useShortcut('app.refresh', () => {
    void albums.refetch()
    void dashboard.refetch()
  })

  const data = dashboard.data
  const storage = data?.storage
  const cards: Insight[] = [
    {
      key: 'albums',
      label: 'Albums',
      value: data?.albums ?? 0,
      hint: 'In the year being viewed',
      icon: Images,
      tone: 'primary',
    },
    {
      key: 'photos',
      label: 'Photos',
      value: data?.photos ?? 0,
      hint: 'Albums with photos',
      icon: ImageIcon,
      tone: 'success',
      active: search.media_type === 'image',
      onClick: () => setSearch({ media_type: search.media_type === 'image' ? undefined : 'image' }),
    },
    {
      key: 'videos',
      label: 'Videos',
      value: data?.videos ?? 0,
      hint: 'Albums with videos',
      icon: Video,
      tone: 'info',
      active: search.media_type === 'video',
      onClick: () => setSearch({ media_type: search.media_type === 'video' ? undefined : 'video' }),
    },
    {
      key: 'storage',
      label: 'Storage used',
      value: storage ? `${storage.used_percent}%` : '0%',
      hint: storage
        ? `${formatStorage(storage.used_bytes)} used · ${formatStorage(storage.remaining_bytes)} left`
        : undefined,
      icon: HardDrive,
      tone:
        storage?.level === 'full' ? 'danger' : storage?.level === 'warning' ? 'warning' : 'neutral',
    },
    {
      key: 'month',
      label: 'Uploaded this month',
      value: data?.uploaded_this_month ?? 0,
      icon: Upload,
      tone: 'primary',
    },
    {
      key: 'expiring',
      label: 'Expiring soon',
      value: data?.expiring_soon ?? 0,
      hint: 'Retention ends within the notice period',
      icon: Clock4,
      tone: 'warning',
    },
    {
      key: 'scheduled',
      label: 'Scheduled for deletion',
      value: data?.scheduled_for_deletion ?? 0,
      hint: 'Moves to Trash after the notice',
      icon: CalendarClock,
      tone: 'danger',
    },
    {
      key: 'trash',
      label: 'In Trash',
      value: data?.pending_deletion ?? 0,
      hint: canManage ? 'Open Trash' : undefined,
      icon: Trash2,
      tone: 'neutral',
      onClick: canManage
        ? () => void navigate({ to: '/gallery/trash', search: { page: 1, kind: 'media' } })
        : undefined,
    },
    {
      key: 'hold',
      label: 'On hold',
      value: data?.on_hold ?? 0,
      hint: 'Protected from automatic deletion',
      icon: Lock,
      tone: 'info',
    },
  ]

  const scopeTab: ScopeTab = search.scope ?? 'all'
  const classList = classes.data ?? []
  const selectedClass = classList.find((item) => item.id === search.class_id)
  const classCounts = new Map((data?.by_class ?? []).map((row) => [row.id, row]))
  const sectionCounts = new Map((data?.by_section ?? []).map((row) => [row.id, row]))
  const sectionOptions = (
    selectedClass ? selectedClass.sections : classList.flatMap((c) => c.sections)
  ).map((section) => ({
    value: String(section.id),
    label: `${classLabel(section.class_name)} - ${section.name}`,
  }))

  const filtered = Boolean(
    search.search ||
    search.category_id ||
    search.status ||
    search.visibility ||
    search.media_type ||
    search.featured ||
    search.tag ||
    search.from ||
    search.to ||
    search.class_id ||
    search.section_id
  )
  const rows = albums.data?.items ?? []
  const sortValue = `${search.sort ?? 'created_at'}:${search.order ?? (search.sort === 'title' ? 'asc' : 'desc')}`

  if (me && !canView) {
    return (
      <Page>
        <PageHeader eyebrow='Gallery' title='Gallery' />
        <EmptyState
          icon={Images}
          title='No access to the gallery'
          description='Ask the school admin for the gallery permission.'
        />
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        eyebrow='Gallery'
        title='Gallery'
        description='Photo and video albums for the whole school, each class and each section. Staff and parents see them in the apps.'
        actions={
          canManage && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus />
              Create album
              <Kbd id='gallery.create' inverted />
            </Button>
          )
        }
      />
      <GalleryTabs active='/gallery' />

      <InsightCards items={cards} loading={dashboard.isPending} />

      <PageTabs<ScopeTab>
        label='Gallery'
        value={scopeTab}
        onChange={(next) =>
          setSearch({
            scope: next === 'all' ? undefined : next,
            class_id: undefined,
            section_id: undefined,
          })
        }
        tabs={[
          { value: 'all', label: 'All albums' },
          { value: 'school', label: 'App Media Gallery' },
          { value: 'class', label: 'Class-wise' },
          { value: 'section', label: 'Section-wise' },
        ]}
      />

      {(scopeTab === 'class' || scopeTab === 'section') && (
        <div className='grid gap-3'>
          <ChipRow label='Classes'>
            <Chip
              active={!search.class_id}
              onClick={() => setSearch({ class_id: undefined, section_id: undefined })}
            >
              All classes
            </Chip>
            {classList.map((item) => {
              const count = classCounts.get(item.id)
              return (
                <Chip
                  key={item.id}
                  active={search.class_id === item.id}
                  onClick={() =>
                    setSearch({
                      class_id: search.class_id === item.id ? undefined : item.id,
                      section_id: undefined,
                    })
                  }
                  count={count ? count.photos + count.videos : undefined}
                >
                  {classLabel(item.name)}
                </Chip>
              )
            })}
          </ChipRow>
          {scopeTab === 'section' && selectedClass && (
            <ChipRow label='Sections'>
              <Chip
                active={!search.section_id}
                onClick={() => setSearch({ section_id: undefined })}
              >
                All sections
              </Chip>
              {selectedClass.sections.map((section) => {
                const count = sectionCounts.get(section.id)
                return (
                  <Chip
                    key={section.id}
                    active={search.section_id === section.id}
                    onClick={() =>
                      setSearch({
                        section_id: search.section_id === section.id ? undefined : section.id,
                      })
                    }
                    count={count ? count.photos + count.videos : undefined}
                  >
                    {section.name}
                  </Chip>
                )
              })}
            </ChipRow>
          )}
        </div>
      )}

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={
            albums.data
              ? `${albums.data.total} ${albums.data.total === 1 ? 'album' : 'albums'}`
              : ''
          }
          onClear={
            filtered
              ? () => navigate({ search: { page: 1, scope: search.scope }, replace: true })
              : undefined
          }
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Search album titles'
            label='Search albums'
          />
          {scopeTab === 'all' && (
            <FilterSelect
              id='gallery-class'
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
          )}
          {scopeTab === 'all' && (
            <FilterSelect
              id='gallery-section'
              label='Filter by section'
              allLabel='All sections'
              value={search.section_id ? String(search.section_id) : undefined}
              options={sectionOptions}
              onChange={(value) => setSearch({ section_id: value ? Number(value) : undefined })}
            />
          )}
          <FilterSelect
            id='gallery-category'
            label='Filter by category'
            allLabel='All categories'
            value={search.category_id ? String(search.category_id) : undefined}
            options={(categories.data ?? []).map((category) => ({
              value: String(category.id),
              label: category.name,
              hint: String(category.album_count),
            }))}
            onChange={(value) => setSearch({ category_id: value ? Number(value) : undefined })}
          />
          <FilterSelect
            id='gallery-status'
            label='Filter by status'
            allLabel='All statuses'
            value={search.status}
            options={ALBUM_STATUS_OPTIONS}
            onChange={(value) => setSearch({ status: value as GallerySearch['status'] })}
          />
          <FilterSelect
            id='gallery-visibility'
            label='Filter by visibility'
            allLabel='Any visibility'
            value={search.visibility}
            options={VISIBILITY_OPTIONS}
            onChange={(value) => setSearch({ visibility: value as GallerySearch['visibility'] })}
          />
          <FilterSelect
            id='gallery-media-type'
            label='Filter by media type'
            allLabel='Photos and videos'
            value={search.media_type}
            options={MEDIA_TYPE_OPTIONS}
            onChange={(value) => setSearch({ media_type: value as GallerySearch['media_type'] })}
          />
          <FilterSelect
            id='gallery-sort'
            label='Sort albums'
            allLabel='Newest first'
            value={sortValue === 'created_at:desc' ? undefined : sortValue}
            options={SORT_OPTIONS.slice(1)}
            onChange={(value) => {
              const [sort, order] = (value ?? 'created_at:desc').split(':')
              setSearch({
                sort: sort === 'created_at' ? undefined : (sort as GallerySearch['sort']),
                order: sort === 'created_at' ? undefined : (order as GallerySearch['order']),
              })
            }}
          />
          <Button
            variant={search.featured ? 'secondary' : 'outline'}
            size='sm'
            aria-pressed={Boolean(search.featured)}
            onClick={() => setSearch({ featured: search.featured ? undefined : true })}
          >
            <Star className={cn(search.featured && 'fill-current text-warning')} />
            Featured
          </Button>
          <TagFilter
            value={search.tag ?? ''}
            onChange={(tag) => setSearch({ tag: tag || undefined })}
          />
          <div className='flex items-center gap-2'>
            <Input
              type='date'
              aria-label='Event date from'
              placeholder='From'
              value={search.from ?? ''}
              max={search.to}
              className='w-36'
              onChange={(event) => setSearch({ from: event.target.value || undefined })}
            />
            <span className='text-xs text-muted-foreground'>to</span>
            <Input
              type='date'
              aria-label='Event date to'
              placeholder='To'
              value={search.to ?? ''}
              min={search.from}
              className='w-36'
              onChange={(event) => setSearch({ to: event.target.value || undefined })}
            />
          </div>
        </ListToolbar>

        {albums.isError && !rows.length ? (
          <ErrorState message={albums.error.message} onRetry={() => albums.refetch()} />
        ) : albums.isPending ? (
          <div className='grid grid-cols-1 gap-3 p-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className='aspect-[4/3.6] rounded-xl' />
            ))}
          </div>
        ) : !rows.length ? (
          <EmptyState
            icon={filtered ? CircleOff : Images}
            title={filtered ? 'No albums match these filters' : 'No albums yet'}
            description={
              filtered
                ? 'Try another word or clear the filters.'
                : 'Create an album, then upload photos and videos into it.'
            }
            action={
              !filtered &&
              canManage && (
                <Button onClick={() => setFormOpen(true)}>
                  <Plus />
                  Create album
                </Button>
              )
            }
          />
        ) : (
          <div className={cn('transition-opacity', albums.isFetching && 'opacity-60')}>
            <ul className='grid grid-cols-1 gap-3 p-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {rows.map((album) => (
                <li key={album.id} className='min-w-0'>
                  <AlbumCard album={album} />
                </li>
              ))}
            </ul>
            <Pagination
              page={search.page}
              limit={LIMIT}
              total={albums.data?.total ?? 0}
              label='albums'
              onPageChange={(page) => navigate({ search: (prev) => ({ ...prev, page }) })}
            />
          </div>
        )}
      </Card>

      <AlbumFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        defaults={{
          scope: search.scope,
          class_id: search.class_id,
          section_id: search.section_id,
        }}
        onSaved={(album) =>
          void navigate({
            to: '/gallery/albums/$albumId',
            params: { albumId: String(album.id) },
            search: { page: 1 },
          })
        }
      />
    </Page>
  )
}

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role='group' aria-label={label} className='flex flex-wrap items-center gap-1.5'>
      <span className='mr-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
        {label}
      </span>
      {children}
    </div>
  )
}

function Chip({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean
  onClick: () => void
  count?: number
  children: React.ReactNode
}) {
  return (
    <button
      type='button'
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
        active
          ? 'border-primary/50 bg-primary/10 text-primary'
          : 'bg-card text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
      {count !== undefined && (
        <span className='tabular rounded-full bg-muted px-1.5 text-[10px] text-muted-foreground'>
          {count}
        </span>
      )}
    </button>
  )
}

function TagFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [text, setText] = useState(value)
  const [synced, setSynced] = useState(value)
  if (value !== synced) {
    setSynced(value)
    setText(value)
  }
  const commit = () => {
    const next = text.trim().replace(/^#/, '')
    if (next !== value) onChange(next)
  }
  return (
    <Input
      aria-label='Filter by tag'
      placeholder='#tag'
      value={text}
      maxLength={40}
      className='w-28'
      onChange={(event) => setText(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') commit()
      }}
    />
  )
}
