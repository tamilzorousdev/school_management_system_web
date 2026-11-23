import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { CalendarClock, Lock, Settings2, SlidersHorizontal, Tags } from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/common/display'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { useGalleryDashboard, useGallerySettings } from '../api'
import { CategoriesPanel } from '../components/categories-panel'
import { GalleryTabs } from '../components/gallery-tabs'
import { HoldsPanel } from '../components/holds-panel'
import { RetentionPanel } from '../components/retention-panel'
import { SettingsForm } from '../components/settings-form'
import type { GallerySettingsSearch } from '../search'

const route = getRouteApi('/_app/gallery/settings')

export function GallerySettingsPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/gallery/settings' })
  const me = useMe().data
  const canView = can(me, 'gallery.view')
  const canConfigure = can(me, 'gallery.configure')
  const settings = useGallerySettings(canView)
  const dashboard = useGalleryDashboard({})

  const setSearch = (patch: Partial<GallerySettingsSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })

  if (me && !canView) {
    return (
      <Page>
        <PageHeader eyebrow='Gallery' title='Gallery settings' />
        <EmptyState
          icon={Settings2}
          title='No access to gallery settings'
          description='Ask the school admin for the gallery permission.'
        />
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        eyebrow='Gallery'
        title='Gallery settings'
        description={
          canConfigure
            ? 'Switches, upload limits, storage, retention, categories and holds for the whole gallery.'
            : 'You can read these settings. Changing them needs the gallery configure permission.'
        }
      />
      <GalleryTabs active='/gallery/settings' />
      <PageTabs<GallerySettingsSearch['tab']>
        label='Gallery settings'
        value={search.tab}
        onChange={(tab) => setSearch({ tab, page: 1 })}
        tabs={[
          { value: 'settings', label: 'Settings', icon: SlidersHorizontal },
          { value: 'categories', label: 'Categories', icon: Tags },
          { value: 'retention', label: 'Retention policies', icon: CalendarClock },
          { value: 'holds', label: 'Retention holds', icon: Lock },
        ]}
      />

      {search.tab === 'settings' &&
        (settings.isError ? (
          <ErrorState message={settings.error.message} onRetry={() => settings.refetch()} />
        ) : settings.data ? (
          <SettingsForm
            key={settings.data.updated_at ?? 'defaults'}
            settings={settings.data}
            storage={dashboard.data?.storage}
            readOnly={!canConfigure}
          />
        ) : (
          <div className='grid gap-4'>
            <Skeleton className='h-48' />
            <Skeleton className='h-48' />
          </div>
        ))}
      {search.tab === 'categories' && <CategoriesPanel canConfigure={canConfigure} />}
      {search.tab === 'retention' && <RetentionPanel canConfigure={canConfigure} />}
      {search.tab === 'holds' && (
        <HoldsPanel
          canConfigure={canConfigure}
          view={search.holds}
          page={search.page}
          onChange={(patch) => setSearch(patch)}
        />
      )}
    </Page>
  )
}
