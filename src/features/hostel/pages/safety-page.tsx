import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { ScrollText, ShieldAlert, Siren } from 'lucide-react'
import { EmptyState } from '@/components/common/display'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Button } from '@/components/ui/button'
import { can, useMe } from '@/features/auth/api'
import { useActiveSos, type SosDetail } from '../api-safety'
import { HostelTabs } from '../components/hostel-tabs'
import { SafetyActiveAlerts, SafetyHistory } from '../components/safety-alerts'
import { SafetyHeadcountSheet } from '../components/safety-headcount-sheet'
import { SafetyRaiseModal } from '../components/safety-raise-modal'
import { SafetyRulesPanel } from '../components/safety-rules'
import type { SafetySearch } from '../search'

const route = getRouteApi('/_app/hostel/safety')

type Tab = SafetySearch['tab']

export function SafetyPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/hostel/safety' })
  const me = useMe().data
  const canView = can(me, 'hostel.view')
  const canEditRules = can(me, 'hostel.settings')
  const [raising, setRaising] = useState(false)
  const tab: Tab = search.tab
  const active = useActiveSos(undefined, canView)
  const openCount = active.data?.length ?? 0

  const setSearch = (patch: Partial<SafetySearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })

  const switchTab = (next: Tab) =>
    navigate({ search: { tab: next, page: 1, hostel_id: search.hostel_id } })

  const clearFilters = () => navigate({ search: { tab, page: 1, sos: search.sos }, replace: true })

  const setPage = (page: number) => navigate({ search: (prev) => ({ ...prev, page }) })

  const openSos = (id: number) => navigate({ search: (prev) => ({ ...prev, sos: id }) })

  const closeSos = () => navigate({ search: (prev) => ({ ...prev, sos: undefined }) })

  useShortcut('hostel.create', () => setRaising(true), { enabled: canView })
  useShortcut('app.refresh', () => void active.refetch())

  const header = (
    <PageHeader
      eyebrow='Hostel'
      title='Safety'
      description='Emergency alerts with a live headcount of every resident, practice drills, and the hostel rules parents agree to.'
      actions={
        canView ? (
          <Button size='lg' variant='destructive' onClick={() => setRaising(true)}>
            <Siren />
            Raise alert
          </Button>
        ) : undefined
      }
    />
  )

  if (me && !canView) {
    return (
      <Page>
        {header}
        <EmptyState
          icon={ShieldAlert}
          title='No access to the hostel'
          description='Ask the school admin for the hostel permission.'
        />
      </Page>
    )
  }

  return (
    <Page>
      {header}
      <HostelTabs active='/hostel/safety' />

      <PageTabs
        label='Safety sections'
        value={tab}
        onChange={switchTab}
        tabs={[
          { value: 'alerts', label: 'Alerts', icon: Siren, count: openCount || undefined },
          { value: 'rules', label: 'Rules', icon: ScrollText },
        ]}
      />

      {tab === 'rules' ? (
        <SafetyRulesPanel
          search={search}
          canEdit={canEditRules}
          onSearch={setSearch}
          onClear={clearFilters}
          onPage={setPage}
        />
      ) : (
        <>
          {canView && <SafetyActiveAlerts onOpen={openSos} />}
          <SafetyHistory
            search={search}
            onSearch={setSearch}
            onClear={clearFilters}
            onPage={setPage}
            onOpen={openSos}
          />
        </>
      )}

      <SafetyHeadcountSheet sosId={search.sos} onClose={closeSos} />
      {raising && (
        <SafetyRaiseModal
          hostelId={search.hostel_id}
          onClose={() => setRaising(false)}
          onRaised={(sos: SosDetail) => openSos(sos.id)}
        />
      )}
    </Page>
  )
}
