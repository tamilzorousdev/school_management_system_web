import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { BedDouble, Building, Building2, Settings2 } from 'lucide-react'
import { EmptyState } from '@/components/common/display'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { can, useMe } from '@/features/auth/api'
import { HostelTabs } from '../components/hostel-tabs'
import { SetupHostels } from '../components/setup-hostels'
import { SetupRoomTypes } from '../components/setup-room-types'
import { SetupSettings } from '../components/setup-settings'
import { SetupStructure } from '../components/setup-structure'
import type { SetupTab } from '../search'

const route = getRouteApi('/_app/hostel/setup')

export function HostelSetupPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/hostel/setup' })
  const me = useMe().data
  const canView = can(me, 'hostel.view')
  const tab = search.tab

  if (me && !canView) {
    return (
      <Page>
        <PageHeader eyebrow='Hostel' title='Hostel setup' />
        <EmptyState
          icon={BedDouble}
          title='No access to the hostel'
          description='Ask the school admin for the hostel permission.'
        />
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        eyebrow='Hostel'
        title='Hostel setup'
        description='Hostels, blocks and floors, room types, daily timings and the optional modules.'
      />
      <HostelTabs active='/hostel/setup' />

      <PageTabs<SetupTab>
        label='Setup sections'
        value={tab}
        onChange={(next) => void navigate({ search: (prev) => ({ ...prev, tab: next }) })}
        tabs={[
          { value: 'hostels', label: 'Hostels', icon: Building2 },
          { value: 'structure', label: 'Blocks & floors', icon: Building },
          { value: 'room_types', label: 'Room types', icon: BedDouble },
          { value: 'settings', label: 'Settings', icon: Settings2 },
        ]}
      />

      {tab === 'hostels' && <SetupHostels />}
      {tab === 'structure' && (
        <SetupStructure
          hostelId={search.hostel_id}
          onHostelChange={(hostelId) =>
            void navigate({ search: (prev) => ({ ...prev, hostel_id: hostelId }), replace: true })
          }
        />
      )}
      {tab === 'room_types' && <SetupRoomTypes />}
      {tab === 'settings' && <SetupSettings />}
    </Page>
  )
}
