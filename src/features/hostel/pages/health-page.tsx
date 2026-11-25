import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { BedSingle, CircleOff, HeartPulse, LogOut, Pill, Plus, Stethoscope } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { DatePicker } from '@/components/common/date-picker'
import { EmptyState, ErrorState } from '@/components/common/display'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Kbd } from '@/components/shortcuts/kbd'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { formatDateTime, timeAgo } from '@/lib/format'
import { useHostelModules, useHostelMutation } from '../api'
import { careApi, careKeys, useHealthLogs, type HealthLog } from '../api-care'
import { HEALTH_KIND, HEALTH_STATUS } from '../components/health-helpers'
import { HealthLogModal } from '../components/health-log-modal'
import { HealthLogSheet } from '../components/health-log-sheet'
import { MedicationsDueBoard, MedicationsList } from '../components/health-medications'
import { HealthNoteModal } from '../components/health-parts'
import { HostelLifeTabs, ModuleOffState } from '../components/hostel-life-tabs'
import { StudentCell } from '../components/leave-form-parts'
import { todayIso } from '../components/leave-helpers'
import { HostelSelect } from '../components/pickers'
import { labelOptions, toneOptions } from '../labels'
import type { HealthSearch } from '../search-life'

const route = getRouteApi('/_app/hostel/health')
const LIMIT = 20

type Tab = HealthSearch['tab']

export function HealthPage() {
  const me = useMe().data
  const canView = can(me, 'hostel.view')
  const modules = useHostelModules(canView)
  const header = (
    <PageHeader
      eyebrow='Hostel'
      title='Health & sick bay'
      description='Illness and injury records, the sick bay and daily medication.'
    />
  )

  if (me && !canView) {
    return (
      <Page>
        {header}
        <EmptyState
          icon={HeartPulse}
          title='No access to the hostel'
          description='Ask the school admin for the hostel permission.'
        />
      </Page>
    )
  }

  if (modules.data?.enabled_modules.medical === false) {
    return (
      <Page>
        {header}
        <HostelLifeTabs active='/hostel/health' />
        <ModuleOffState module='medical' />
      </Page>
    )
  }

  if (!modules.data) {
    return (
      <Page>
        {header}
        <HostelLifeTabs active='/hostel/health' />
        {modules.isError ? (
          <ErrorState message={modules.error.message} onRetry={() => modules.refetch()} />
        ) : (
          <Skeleton className='h-64' />
        )}
      </Page>
    )
  }

  return <HealthBody />
}

function HealthBody() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/hostel/health' })
  const queryClient = useQueryClient()
  const me = useMe().data
  const canEdit = can(me, 'hostel.medical')
  const tab: Tab = search.tab
  const today = todayIso()
  const [recording, setRecording] = useState(false)
  const [addingMedication, setAddingMedication] = useState(false)
  const [discharging, setDischarging] = useState<HealthLog | null>(null)
  const discharge = useHostelMutation(
    (input: { id: number; note: string | null; notify: boolean }) =>
      careApi.discharge(input.id, { note: input.note, notify_parent: input.notify })
  )

  const logs = useHealthLogs(
    {
      page: search.page,
      limit: LIMIT,
      search: search.search,
      hostel_id: search.hostel_id,
      status: search.status,
      kind: search.kind,
      sort: search.sort,
      order: search.order,
    },
    tab === 'logs'
  )
  const sickBay = useHealthLogs(
    {
      page: tab === 'sick_bay' ? search.page : 1,
      limit: LIMIT,
      search: tab === 'sick_bay' ? search.search : undefined,
      hostel_id: search.hostel_id,
      in_sick_bay: true,
      sort: 'logged_at',
      order: 'desc',
    },
    true
  )

  const setSearch = (patch: Partial<HealthSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })
  const setPage = (page: number) => navigate({ search: (prev) => ({ ...prev, page }) })
  const openLog = (id?: number) => navigate({ search: (prev) => ({ ...prev, log: id }) })

  const create = () => (tab === 'medications' ? setAddingMedication(true) : setRecording(true))
  useShortcut('hostel.create', create, { enabled: canEdit })
  useShortcut('app.refresh', () => {
    void queryClient.invalidateQueries({ queryKey: careKeys.all })
  })

  const header = (
    <PageHeader
      eyebrow='Hostel'
      title='Health & sick bay'
      description='Illness and injury records, the sick bay and daily medication.'
      actions={
        canEdit ? (
          <Button onClick={create}>
            <Plus />
            {tab === 'medications' ? 'Add medication' : 'Record health event'}
            <Kbd id='hostel.create' inverted />
          </Button>
        ) : undefined
      }
    />
  )

  const filtered = Boolean(search.search || search.hostel_id || search.status || search.kind)

  const columns: Column<HealthLog>[] = [
    {
      key: 'student',
      header: 'Student',
      cell: (row) => <StudentCell student={row.student} extra={row.bed ?? row.hostel_name} />,
    },
    {
      key: 'what',
      header: 'What happened',
      cell: (row) => (
        <div className='grid min-w-0 gap-0.5'>
          <span className='font-semibold'>{HEALTH_KIND[row.kind]}</span>
          <span className='line-clamp-1 text-xs text-muted-foreground'>{row.symptoms}</span>
        </div>
      ),
    },
    {
      key: 'logged',
      header: 'Logged',
      sortKey: 'logged_at',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='text-xs text-muted-foreground'>{formatDateTime(row.logged_at)}</span>
      ),
    },
    {
      key: 'temperature',
      header: 'Temp',
      hideBelow: 'xl',
      align: 'right',
      cell: (row) => <span className='tabular'>{row.temperature ?? '—'}</span>,
    },
    { key: 'status', header: 'Status', cell: (row) => <LogBadges log={row} /> },
  ]

  const sickColumns: Column<HealthLog>[] = [
    {
      key: 'student',
      header: 'Student',
      cell: (row) => <StudentCell student={row.student} extra={row.hostel_name} />,
    },
    {
      key: 'bed',
      header: 'Bed',
      hideBelow: 'lg',
      cell: (row) => <span className='tabular text-sm'>{row.bed ?? '—'}</span>,
    },
    {
      key: 'since',
      header: 'Since',
      cell: (row) => (
        <div className='grid gap-0.5'>
          <span className='text-sm'>{timeAgo(row.sick_bay_from)}</span>
          <span className='text-xs text-muted-foreground'>{formatDateTime(row.sick_bay_from)}</span>
        </div>
      ),
    },
    {
      key: 'symptoms',
      header: 'Symptoms',
      hideBelow: 'lg',
      cell: (row) => <span className='line-clamp-2 text-sm'>{row.symptoms}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (row) => dischargeButton(row),
    },
  ]

  function dischargeButton(row: HealthLog) {
    if (!canEdit) return null
    return (
      <Button
        size='sm'
        variant='outline'
        onClick={(event) => {
          event.stopPropagation()
          setDischarging(row)
        }}
      >
        <LogOut />
        Discharge
      </Button>
    )
  }

  return (
    <Page>
      {header}
      <HostelLifeTabs active='/hostel/health' />

      <PageTabs
        label='Health sections'
        value={tab}
        onChange={(next) =>
          navigate({ search: { tab: next, page: 1, hostel_id: search.hostel_id } })
        }
        tabs={[
          { value: 'logs', label: 'Health log', icon: Stethoscope },
          {
            value: 'sick_bay',
            label: 'Sick bay',
            icon: BedSingle,
            count: sickBay.data?.total || undefined,
          },
          { value: 'medications', label: 'Medication', icon: Pill },
        ]}
      />

      {tab === 'logs' && (
        <Card className='overflow-hidden'>
          <ListToolbar
            summary={logs.data ? `${logs.data.total} records` : ''}
            onClear={
              filtered
                ? () => navigate({ search: { tab: 'logs', page: 1 }, replace: true })
                : undefined
            }
          >
            <SearchBox
              value={search.search ?? ''}
              onChange={(value) => setSearch({ search: value || undefined })}
              placeholder='Search student or symptoms'
              label='Search health records'
            />
            <HostelSelect
              id='health-hostel'
              allLabel='All hostels'
              value={search.hostel_id ? String(search.hostel_id) : undefined}
              onChange={(value) => setSearch({ hostel_id: value ? Number(value) : undefined })}
            />
            <FilterSelect
              id='health-status'
              label='Filter by status'
              allLabel='Any status'
              value={search.status}
              options={toneOptions(HEALTH_STATUS)}
              onChange={(value) => setSearch({ status: value as HealthSearch['status'] })}
            />
            <FilterSelect
              id='health-kind'
              label='Filter by kind'
              allLabel='Any kind'
              value={search.kind}
              options={labelOptions(HEALTH_KIND)}
              onChange={(value) => setSearch({ kind: value as HealthSearch['kind'] })}
            />
          </ListToolbar>
          <DataTable
            rows={logs.data?.items ?? []}
            columns={columns}
            rowKey={(row) => row.id}
            loading={logs.isFetching}
            error={logs.isError ? logs.error.message : null}
            onRetry={() => logs.refetch()}
            onRowClick={(row) => openLog(row.id)}
            sort={{ sort: search.sort ?? 'logged_at', order: search.order ?? 'desc' }}
            onSortChange={(next) => setSearch(next as Partial<HealthSearch>)}
            empty={{
              icon: filtered ? CircleOff : HeartPulse,
              title: filtered ? 'No records match these filters' : 'No health records yet',
              description: filtered
                ? 'Try another search or clear the filters.'
                : 'Record an illness, an injury or a check-up of a resident.',
              action:
                canEdit && !filtered ? (
                  <Button onClick={() => setRecording(true)}>
                    <Plus />
                    Record health event
                  </Button>
                ) : undefined,
            }}
            card={(row) => (
              <div className='grid gap-2'>
                <div className='flex items-start justify-between gap-2'>
                  <StudentCell student={row.student} extra={row.bed ?? row.hostel_name} />
                  <Badge tone={HEALTH_STATUS[row.status].tone} dot className='shrink-0'>
                    {HEALTH_STATUS[row.status].label}
                  </Badge>
                </div>
                <span className='text-sm'>
                  <span className='font-semibold'>{HEALTH_KIND[row.kind]}</span> · {row.symptoms}
                </span>
                <div className='flex flex-wrap items-center gap-1'>
                  <LogBadges log={row} hideStatus />
                  <span className='text-xs text-muted-foreground'>
                    {formatDateTime(row.logged_at)}
                  </span>
                </div>
              </div>
            )}
            pagination={{
              page: search.page,
              limit: LIMIT,
              total: logs.data?.total ?? 0,
              label: 'records',
              onPageChange: setPage,
            }}
          />
        </Card>
      )}

      {tab === 'sick_bay' && (
        <Card className='overflow-hidden'>
          <ListToolbar summary={sickBay.data ? `${sickBay.data.total} in the sick bay` : ''}>
            <SearchBox
              value={search.search ?? ''}
              onChange={(value) => setSearch({ search: value || undefined })}
              placeholder='Search student or symptoms'
              label='Search the sick bay'
            />
            <HostelSelect
              id='sick-bay-hostel'
              allLabel='All hostels'
              value={search.hostel_id ? String(search.hostel_id) : undefined}
              onChange={(value) => setSearch({ hostel_id: value ? Number(value) : undefined })}
            />
          </ListToolbar>
          <DataTable
            rows={sickBay.data?.items ?? []}
            columns={sickColumns}
            rowKey={(row) => row.id}
            loading={sickBay.isFetching}
            error={sickBay.isError ? sickBay.error.message : null}
            onRetry={() => sickBay.refetch()}
            onRowClick={(row) => openLog(row.id)}
            empty={{
              icon: BedSingle,
              title: 'Nobody is in the sick bay',
              description: 'Turn on “Put in the sick bay” when recording a health event.',
            }}
            card={(row) => (
              <div className='grid gap-2'>
                <div className='flex items-start justify-between gap-2'>
                  <StudentCell student={row.student} extra={row.bed ?? row.hostel_name} />
                  <Badge tone='warning' dot className='shrink-0'>
                    {timeAgo(row.sick_bay_from)}
                  </Badge>
                </div>
                <span className='line-clamp-2 text-sm'>{row.symptoms}</span>
                <div className='justify-self-start'>{dischargeButton(row)}</div>
              </div>
            )}
            pagination={{
              page: search.page,
              limit: LIMIT,
              total: sickBay.data?.total ?? 0,
              label: 'residents',
              onPageChange: setPage,
            }}
          />
        </Card>
      )}

      {tab === 'medications' && (
        <>
          <Card className='flex flex-row flex-wrap items-center gap-3 px-4 py-3'>
            <HostelSelect
              id='medication-hostel'
              allLabel='All hostels'
              value={search.hostel_id ? String(search.hostel_id) : undefined}
              onChange={(value) => setSearch({ hostel_id: value ? Number(value) : undefined })}
            />
            <DatePicker
              id='medication-date'
              value={search.date ?? today}
              clearable={false}
              className='w-full sm:w-44'
              onChange={(value: string) =>
                setSearch({ date: value && value !== today ? value : undefined })
              }
            />
          </Card>
          <MedicationsDueBoard
            hostelId={search.hostel_id}
            date={search.date ?? today}
            today={today}
            canEdit={canEdit}
          />
          <MedicationsList
            hostelId={search.hostel_id}
            search={search.search}
            page={search.page}
            canEdit={canEdit}
            adding={addingMedication}
            onAddingChange={setAddingMedication}
            onSearchChange={(value) => setSearch({ search: value })}
            onPageChange={setPage}
          />
        </>
      )}

      <HealthLogSheet logId={search.log} onClose={() => openLog(undefined)} />

      {recording && (
        <HealthLogModal
          defaultHostelId={search.hostel_id}
          onClose={() => setRecording(false)}
          onSaved={(log) => openLog(log.id)}
        />
      )}
      {discharging && (
        <HealthNoteModal
          title='Discharge from the sick bay'
          description={`${discharging.student.name}. The record stays open until you close it.`}
          submitText='Discharge'
          onClose={() => setDischarging(null)}
          onSubmit={async (input) => {
            await discharge.mutateAsync({
              id: discharging.id,
              note: input.note ?? null,
              notify: Boolean(input.notify_parent),
            })
            alerts.success('Discharged from the sick bay', {
              description: discharging.student.name,
            })
          }}
        />
      )}
    </Page>
  )
}

function LogBadges({ log, hideStatus }: { log: HealthLog; hideStatus?: boolean }) {
  return (
    <div className='flex flex-wrap items-center gap-1'>
      {!hideStatus && (
        <Badge tone={HEALTH_STATUS[log.status].tone} dot>
          {HEALTH_STATUS[log.status].label}
        </Badge>
      )}
      {log.in_sick_bay && <Badge tone='warning'>Sick bay</Badge>}
      {log.hospital_visit && <Badge tone='info'>Doctor</Badge>}
    </div>
  )
}
