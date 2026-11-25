import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  BedDouble,
  BedSingle,
  CircleOff,
  ClipboardList,
  DoorOpen,
  LogOut,
  MoreHorizontal,
  Plus,
  UserRoundCheck,
  UserRoundPlus,
  UserRoundX,
  UsersRound,
} from 'lucide-react'
import { Avatar } from '@/components/common/avatar'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/display'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { Kbd } from '@/components/shortcuts/kbd'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { can, useMe } from '@/features/auth/api'
import { rupees } from '@/features/fees/labels'
import { formatDate } from '@/lib/format'
import {
  useAdmissionInsights,
  useAdmissions,
  useApplications,
  useCheckouts,
  type Admission,
  type Application,
  type ApplicationAction,
  type Checkout,
} from '../api'
import {
  ApplicationDecisionModal,
  ApplicationFormModal,
  type DecisionTarget,
} from '../components/application-modals'
import { CheckoutSheet } from '../components/checkout-sheet'
import { HostelTabs } from '../components/hostel-tabs'
import { HostelSelect } from '../components/pickers'
import { AdmitModal, type AdmitPrefill } from '../components/resident-admit-modal'
import { bedText } from '../components/resident-form'
import {
  ADMISSION_STATUS,
  APPLICATION_STATUS,
  CHECKOUT_REASON,
  CHECKOUT_STATUS,
  studentLine,
  toneOptions,
} from '../labels'
import type { ResidentsSearch, ResidentTab } from '../search'

const route = getRouteApi('/_app/hostel/residents')
const LIMIT = 20

const SORTS: Record<ResidentTab, string[]> = {
  residents: ['name', 'admitted_on', 'room_no', 'created_at', 'admission_no'],
  applications: ['created_at', 'priority', 'wanted_from'],
  checkouts: ['created_at', 'checkout_date'],
}

const DEFAULT_SORT: Record<ResidentTab, string> = {
  residents: 'created_at',
  applications: 'created_at',
  checkouts: 'created_at',
}

const BED_OPTIONS = [
  { value: 'yes', label: 'Has a bed' },
  { value: 'no', label: 'Without a bed' },
]

const DECISIONS: Record<Application['status'], ApplicationAction[]> = {
  pending: ['approve', 'waitlist', 'reject', 'cancel'],
  waitlisted: ['approve', 'reject', 'cancel'],
  approved: ['waitlist', 'reject', 'cancel'],
  rejected: [],
  cancelled: [],
  admitted: [],
}

const DECISION_LABEL: Record<ApplicationAction, string> = {
  approve: 'Approve',
  waitlist: 'Move to waitlist',
  reject: 'Reject',
  cancel: 'Cancel application',
}

export function ResidentsPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/hostel/residents' })
  const me = useMe().data
  const canView = can(me, 'hostel.view')
  const canAllocate = can(me, 'hostel.allocate')
  const tab = search.tab
  const sort = search.sort && SORTS[tab].includes(search.sort) ? search.sort : undefined
  const [admitting, setAdmitting] = useState<AdmitPrefill | null>(null)
  const [recording, setRecording] = useState(false)
  const [deciding, setDeciding] = useState<DecisionTarget | null>(null)
  const [checkoutId, setCheckoutId] = useState<number | null>(null)

  const insights = useAdmissionInsights(search.hostel_id, canView)
  const residents = useAdmissions(
    {
      page: search.page,
      limit: LIMIT,
      search: search.search,
      hostel_id: search.hostel_id,
      status: search.status,
      has_bed: search.has_bed,
      sort,
      order: search.order,
    },
    canView && tab === 'residents'
  )
  const applications = useApplications(
    {
      page: search.page,
      limit: LIMIT,
      search: search.search,
      hostel_id: search.hostel_id,
      status: search.application_status,
      sort,
      order: search.order,
    },
    canView && tab === 'applications'
  )
  const checkouts = useCheckouts(
    {
      page: search.page,
      limit: LIMIT,
      search: search.search,
      hostel_id: search.hostel_id,
      status: search.checkout_status,
      sort,
      order: search.order,
    },
    canView && tab === 'checkouts'
  )

  const setSearch = (patch: Partial<ResidentsSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })

  const switchTab = (next: ResidentTab, patch: Partial<ResidentsSearch> = {}) =>
    navigate({ search: { tab: next, page: 1, hostel_id: search.hostel_id, ...patch } })

  const startCreate = () => {
    if (tab === 'applications') setRecording(true)
    else setAdmitting({})
  }

  useShortcut('hostel.create', startCreate, { enabled: canAllocate && tab !== 'checkouts' })
  useShortcut('app.refresh', () => {
    void insights.refetch()
    if (tab === 'residents') void residents.refetch()
    if (tab === 'applications') void applications.refetch()
    if (tab === 'checkouts') void checkouts.refetch()
  })

  if (me && !canView) {
    return (
      <Page>
        <PageHeader eyebrow='Hostel' title='Residents' />
        <EmptyState
          icon={BedDouble}
          title='No access to the hostel'
          description='Ask the school admin for the hostel permission.'
        />
      </Page>
    )
  }

  const data = insights.data
  const toggleResidents = (patch: Partial<ResidentsSearch>, on: boolean) => {
    if (tab !== 'residents') switchTab('residents', patch)
    else setSearch({ status: undefined, has_bed: undefined, ...(on ? {} : patch) })
  }
  const isResidents = tab === 'residents'
  const cards: Insight[] = [
    {
      key: 'active',
      label: 'Staying',
      value: data?.active ?? 0,
      hint: 'In the hostel now',
      icon: UserRoundCheck,
      tone: 'success',
      active: isResidents && search.status === 'active',
      onClick: () =>
        toggleResidents({ status: 'active' }, isResidents && search.status === 'active'),
    },
    {
      key: 'on_leave',
      label: 'On leave',
      value: data?.on_leave ?? 0,
      hint: 'Away on leave or outing',
      icon: LogOut,
      tone: 'info',
      active: isResidents && search.status === 'on_leave',
      onClick: () =>
        toggleResidents({ status: 'on_leave' }, isResidents && search.status === 'on_leave'),
    },
    {
      key: 'without_bed',
      label: 'Without a bed',
      value: data?.without_bed ?? 0,
      hint: 'Admitted, waiting for a bed',
      icon: UserRoundX,
      tone: (data?.without_bed ?? 0) > 0 ? 'warning' : 'neutral',
      active: isResidents && search.has_bed === false,
      onClick: () => toggleResidents({ has_bed: false }, isResidents && search.has_bed === false),
    },
    {
      key: 'checking_out',
      label: 'Checking out',
      value: data?.checking_out ?? 0,
      hint: `${data?.checked_out ?? 0} checked out this year`,
      icon: BedSingle,
      tone: 'neutral',
      active: isResidents && search.status === 'checking_out',
      onClick: () =>
        toggleResidents(
          { status: 'checking_out' },
          isResidents && search.status === 'checking_out'
        ),
    },
  ]

  const openResident = (admissionId: number) =>
    navigate({
      to: '/hostel/residents/$admissionId',
      params: { admissionId: String(admissionId) },
      search: { tab: 'overview' },
    })

  const residentColumns: Column<Admission>[] = [
    {
      key: 'name',
      header: 'Student',
      sortKey: 'name',
      cell: (row) => (
        <div className='flex items-center gap-3'>
          <Avatar name={row.student.name} />
          <div className='grid min-w-0'>
            <span className='truncate font-bold'>{row.student.name}</span>
            <span className='truncate text-xs text-muted-foreground'>
              {studentLine(row.student)}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'admission_no',
      header: 'Hostel no',
      sortKey: 'admission_no',
      hideBelow: 'lg',
      cell: (row) => <span className='font-mono text-xs'>{row.admission_no}</span>,
    },
    {
      key: 'room_no',
      header: 'Bed',
      sortKey: 'room_no',
      cell: (row) => (
        <div className='grid gap-0.5'>
          {row.bed ? (
            <span className='tabular font-semibold'>{bedText(row.bed)}</span>
          ) : (
            <Badge tone='warning' className='w-fit'>
              No bed
            </Badge>
          )}
          <span className='text-xs text-muted-foreground'>
            {[row.hostel_name, row.bed?.block_name].filter(Boolean).join(' · ')}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge tone={ADMISSION_STATUS[row.status].tone} dot>
          {ADMISSION_STATUS[row.status].label}
        </Badge>
      ),
    },
    {
      key: 'admitted_on',
      header: 'Admitted',
      sortKey: 'admitted_on',
      hideBelow: 'lg',
      cell: (row) => <span className='text-muted-foreground'>{formatDate(row.admitted_on)}</span>,
    },
    {
      key: 'guardian',
      header: 'Parent',
      hideBelow: 'xl',
      cell: (row) =>
        row.primary_guardian ? (
          <div className='grid min-w-0 gap-0.5'>
            <span className='truncate'>{row.primary_guardian.name}</span>
            <span className='tabular text-xs text-muted-foreground'>
              +91 {row.primary_guardian.mobile}
            </span>
          </div>
        ) : (
          <span className='text-muted-foreground'>—</span>
        ),
    },
  ]

  const applicationColumns: Column<Application>[] = [
    {
      key: 'name',
      header: 'Student',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='truncate font-bold'>{row.student.name}</span>
          <span className='truncate text-xs text-muted-foreground'>
            <span className='font-mono'>{row.application_no}</span> · {studentLine(row.student)}
          </span>
        </div>
      ),
    },
    {
      key: 'preference',
      header: 'Wants',
      cell: (row) => (
        <div className='grid gap-0.5'>
          <span>{row.hostel_name ?? 'Any hostel'}</span>
          <span className='text-xs text-muted-foreground'>
            {row.room_type_name ?? 'Any room type'}
          </span>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortKey: 'priority',
      hideBelow: 'lg',
      cell: (row) => <span className='tabular'>{row.priority}</span>,
    },
    {
      key: 'wanted_from',
      header: 'From',
      sortKey: 'wanted_from',
      hideBelow: 'lg',
      cell: (row) => <span className='text-muted-foreground'>{formatDate(row.wanted_from)}</span>,
    },
    {
      key: 'created_at',
      header: 'Received',
      sortKey: 'created_at',
      hideBelow: 'xl',
      cell: (row) => <span className='text-muted-foreground'>{formatDate(row.created_at)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <div className='flex flex-wrap gap-1'>
          <Badge tone={APPLICATION_STATUS[row.status].tone} dot>
            {APPLICATION_STATUS[row.status].label}
          </Badge>
          <Badge tone='neutral'>{row.source === 'parent' ? 'Parent app' : 'Office'}</Badge>
        </div>
      ),
    },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      cell: (row) => applicationActions(row),
    },
  ]

  const applicationActions = (row: Application) => (
    <ApplicationActions
      row={row}
      canAllocate={canAllocate}
      onAdmit={() => setAdmitting(prefillFrom(row))}
      onDecide={(action) => setDeciding({ application: row, action })}
      onOpen={(admissionId) => void openResident(admissionId)}
    />
  )

  const checkoutColumns: Column<Checkout>[] = [
    {
      key: 'name',
      header: 'Student',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='truncate font-bold'>{row.student.name}</span>
          <span className='truncate text-xs text-muted-foreground'>{studentLine(row.student)}</span>
        </div>
      ),
    },
    {
      key: 'bed',
      header: 'Hostel / bed',
      hideBelow: 'lg',
      cell: (row) => (
        <div className='grid gap-0.5'>
          <span>{row.hostel_name}</span>
          <span className='tabular text-xs text-muted-foreground'>{row.bed ?? 'No bed'}</span>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      hideBelow: 'xl',
      cell: (row) => CHECKOUT_REASON[row.reason],
    },
    {
      key: 'checkout_date',
      header: 'Date',
      sortKey: 'checkout_date',
      cell: (row) => <span className='text-muted-foreground'>{formatDate(row.checkout_date)}</span>,
    },
    {
      key: 'pending',
      header: 'Clearance',
      cell: (row) =>
        row.status !== 'open' ? (
          <span className='text-muted-foreground'>—</span>
        ) : row.pending_items > 0 ? (
          <Badge tone='warning'>{row.pending_items} pending</Badge>
        ) : (
          <Badge tone='success'>All done</Badge>
        ),
    },
    {
      key: 'dues',
      header: 'Fee due',
      align: 'right',
      hideBelow: 'lg',
      cell: (row) => (
        <span className={row.hostel_dues > 0 ? 'tabular font-semibold text-warning' : 'tabular'}>
          {rupees(row.hostel_dues)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge tone={CHECKOUT_STATUS[row.status].tone} dot>
          {CHECKOUT_STATUS[row.status].label}
        </Badge>
      ),
    },
  ]

  const residentsFiltered = Boolean(
    search.search || search.hostel_id || search.status || search.has_bed !== undefined
  )
  const applicationsFiltered = Boolean(
    search.search || search.hostel_id || search.application_status
  )
  const checkoutsFiltered = Boolean(search.search || search.hostel_id || search.checkout_status)
  const sortState = { sort: sort ?? DEFAULT_SORT[tab], order: search.order ?? 'desc' }
  const onSortChange = (next: { sort?: string; order: 'asc' | 'desc' }) =>
    setSearch({ sort: next.sort as ResidentsSearch['sort'], order: next.order })
  const clear = () => switchTab(tab)
  const hostelFilter = (
    <HostelSelect
      id='residents-hostel'
      label='Filter by hostel'
      allLabel='All hostels'
      value={search.hostel_id ? String(search.hostel_id) : undefined}
      onChange={(value) => setSearch({ hostel_id: value ? Number(value) : undefined })}
    />
  )

  return (
    <Page>
      <PageHeader
        eyebrow='Hostel'
        title='Residents'
        description='Admissions, applications and checkouts. Open a resident to move beds, see fees, roll call, leave and conduct.'
        actions={
          canAllocate && (
            <>
              <Button variant='outline' onClick={() => setRecording(true)}>
                <ClipboardList />
                Record application
              </Button>
              <Button onClick={() => setAdmitting({})}>
                <Plus />
                Admit student
                {tab !== 'applications' && <Kbd id='hostel.create' inverted />}
              </Button>
            </>
          )
        }
      />
      <HostelTabs active='/hostel/residents' />

      <InsightCards items={cards} loading={insights.isPending} />

      <PageTabs
        label='Resident sections'
        value={tab}
        onChange={(next) => switchTab(next)}
        tabs={[
          { value: 'residents', label: 'Residents', icon: UsersRound, count: data?.active },
          {
            value: 'applications',
            label: 'Applications',
            icon: ClipboardList,
            count: data?.pending_applications || undefined,
          },
          { value: 'checkouts', label: 'Checkouts', icon: DoorOpen },
        ]}
      />

      {tab === 'residents' && (
        <Card className='overflow-hidden'>
          <ListToolbar
            summary={
              residents.data
                ? `${residents.data.total} ${residents.data.total === 1 ? 'resident' : 'residents'}`
                : ''
            }
            onClear={residentsFiltered ? clear : undefined}
          >
            <SearchBox
              value={search.search ?? ''}
              onChange={(value) => setSearch({ search: value || undefined })}
              placeholder='Search name, admission or room number'
              label='Search residents'
            />
            {hostelFilter}
            <FilterSelect
              id='residents-status'
              label='Filter by status'
              allLabel='Not checked out'
              value={search.status}
              options={toneOptions(ADMISSION_STATUS)}
              onChange={(value) => setSearch({ status: value as ResidentsSearch['status'] })}
            />
            <FilterSelect
              id='residents-bed'
              label='Filter by bed'
              allLabel='With or without bed'
              value={search.has_bed === undefined ? undefined : search.has_bed ? 'yes' : 'no'}
              options={BED_OPTIONS}
              onChange={(value) =>
                setSearch({ has_bed: value === undefined ? undefined : value === 'yes' })
              }
            />
          </ListToolbar>
          <DataTable
            rows={residents.data?.items ?? []}
            columns={residentColumns}
            rowKey={(row) => row.id}
            loading={residents.isFetching}
            error={residents.isError ? residents.error.message : null}
            onRetry={() => residents.refetch()}
            onRowClick={(row) => void openResident(row.id)}
            sort={sortState}
            onSortChange={onSortChange}
            empty={{
              icon: residentsFiltered ? CircleOff : BedDouble,
              title: residentsFiltered ? 'No residents match these filters' : 'No residents yet',
              description: residentsFiltered
                ? 'Try another name or hostel, or clear the filters.'
                : 'Admit a student, or approve an application and admit from there.',
              action:
                !residentsFiltered && canAllocate ? (
                  <Button onClick={() => setAdmitting({})}>
                    <Plus />
                    Admit student
                  </Button>
                ) : undefined,
            }}
            card={(row) => (
              <div className='flex items-start gap-3'>
                <Avatar name={row.student.name} />
                <div className='grid min-w-0 flex-1 gap-1'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='grid min-w-0'>
                      <span className='truncate font-bold'>{row.student.name}</span>
                      <span className='truncate text-xs text-muted-foreground'>
                        {studentLine(row.student)}
                      </span>
                    </div>
                    <Badge tone={ADMISSION_STATUS[row.status].tone} dot className='shrink-0'>
                      {ADMISSION_STATUS[row.status].label}
                    </Badge>
                  </div>
                  <span className='flex flex-wrap items-center gap-2 text-sm'>
                    {row.bed ? (
                      <span className='tabular font-semibold'>{bedText(row.bed)}</span>
                    ) : (
                      <Badge tone='warning'>No bed</Badge>
                    )}
                    <span className='text-xs text-muted-foreground'>{row.hostel_name}</span>
                  </span>
                  <span className='text-xs text-muted-foreground'>
                    Admitted {formatDate(row.admitted_on)}
                    {row.primary_guardian ? ` · +91 ${row.primary_guardian.mobile}` : ''}
                  </span>
                </div>
              </div>
            )}
            pagination={{
              page: search.page,
              limit: LIMIT,
              total: residents.data?.total ?? 0,
              label: 'residents',
              onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
            }}
          />
        </Card>
      )}

      {tab === 'applications' && (
        <Card className='overflow-hidden'>
          <ListToolbar
            summary={
              applications.data
                ? `${applications.data.total} ${applications.data.total === 1 ? 'application' : 'applications'}`
                : ''
            }
            onClear={applicationsFiltered ? clear : undefined}
          >
            <SearchBox
              value={search.search ?? ''}
              onChange={(value) => setSearch({ search: value || undefined })}
              placeholder='Search name, admission or application number'
              label='Search applications'
            />
            {hostelFilter}
            <FilterSelect
              id='applications-status'
              label='Filter by status'
              allLabel='Any status'
              value={search.application_status}
              options={toneOptions(APPLICATION_STATUS)}
              onChange={(value) =>
                setSearch({
                  application_status: value as ResidentsSearch['application_status'],
                })
              }
            />
          </ListToolbar>
          <DataTable
            rows={applications.data?.items ?? []}
            columns={applicationColumns}
            rowKey={(row) => row.id}
            loading={applications.isFetching}
            error={applications.isError ? applications.error.message : null}
            onRetry={() => applications.refetch()}
            sort={sortState}
            onSortChange={onSortChange}
            empty={{
              icon: applicationsFiltered ? CircleOff : ClipboardList,
              title: applicationsFiltered
                ? 'No applications match these filters'
                : 'No applications yet',
              description: applicationsFiltered
                ? 'Try another status or clear the filters.'
                : 'Parents apply from the app, or you record an application here.',
              action:
                !applicationsFiltered && canAllocate ? (
                  <Button onClick={() => setRecording(true)}>
                    <Plus />
                    Record application
                    <Kbd id='hostel.create' inverted />
                  </Button>
                ) : undefined,
            }}
            card={(row) => (
              <div className='grid gap-2'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='grid min-w-0'>
                    <span className='truncate font-bold'>{row.student.name}</span>
                    <span className='truncate text-xs text-muted-foreground'>
                      <span className='font-mono'>{row.application_no}</span> ·{' '}
                      {studentLine(row.student)}
                    </span>
                  </div>
                  <Badge tone={APPLICATION_STATUS[row.status].tone} dot className='shrink-0'>
                    {APPLICATION_STATUS[row.status].label}
                  </Badge>
                </div>
                <span className='text-sm'>
                  {row.hostel_name ?? 'Any hostel'} · {row.room_type_name ?? 'Any room type'}
                </span>
                <span className='text-xs text-muted-foreground'>
                  Priority {row.priority}
                  {row.wanted_from ? ` · from ${formatDate(row.wanted_from)}` : ''} ·{' '}
                  {row.source === 'parent' ? 'Parent app' : 'Office'}
                </span>
                {applicationActions(row)}
              </div>
            )}
            pagination={{
              page: search.page,
              limit: LIMIT,
              total: applications.data?.total ?? 0,
              label: 'applications',
              onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
            }}
          />
        </Card>
      )}

      {tab === 'checkouts' && (
        <Card className='overflow-hidden'>
          <ListToolbar
            summary={
              checkouts.data
                ? `${checkouts.data.total} ${checkouts.data.total === 1 ? 'checkout' : 'checkouts'}`
                : ''
            }
            onClear={checkoutsFiltered ? clear : undefined}
          >
            <SearchBox
              value={search.search ?? ''}
              onChange={(value) => setSearch({ search: value || undefined })}
              placeholder='Search name or admission number'
              label='Search checkouts'
            />
            {hostelFilter}
            <FilterSelect
              id='checkouts-status'
              label='Filter by status'
              allLabel='Any status'
              value={search.checkout_status}
              options={toneOptions(CHECKOUT_STATUS)}
              onChange={(value) =>
                setSearch({ checkout_status: value as ResidentsSearch['checkout_status'] })
              }
            />
          </ListToolbar>
          <DataTable
            rows={checkouts.data?.items ?? []}
            columns={checkoutColumns}
            rowKey={(row) => row.id}
            loading={checkouts.isFetching}
            error={checkouts.isError ? checkouts.error.message : null}
            onRetry={() => checkouts.refetch()}
            onRowClick={(row) => setCheckoutId(row.id)}
            sort={sortState}
            onSortChange={onSortChange}
            empty={{
              icon: checkoutsFiltered ? CircleOff : DoorOpen,
              title: checkoutsFiltered ? 'No checkouts match these filters' : 'No checkouts yet',
              description: 'Start a checkout from a resident’s page when the student leaves.',
            }}
            card={(row) => (
              <div className='grid gap-1.5'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='grid min-w-0'>
                    <span className='truncate font-bold'>{row.student.name}</span>
                    <span className='truncate text-xs text-muted-foreground'>
                      {[row.hostel_name, row.bed].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                  <Badge tone={CHECKOUT_STATUS[row.status].tone} dot className='shrink-0'>
                    {CHECKOUT_STATUS[row.status].label}
                  </Badge>
                </div>
                <span className='text-xs text-muted-foreground'>
                  {CHECKOUT_REASON[row.reason]} · {formatDate(row.checkout_date)}
                </span>
                <span className='flex flex-wrap gap-1.5'>
                  {row.status === 'open' && row.pending_items > 0 && (
                    <Badge tone='warning'>{row.pending_items} pending</Badge>
                  )}
                  {row.hostel_dues > 0 && (
                    <Badge tone='warning'>{rupees(row.hostel_dues)} due</Badge>
                  )}
                </span>
              </div>
            )}
            pagination={{
              page: search.page,
              limit: LIMIT,
              total: checkouts.data?.total ?? 0,
              label: 'checkouts',
              onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
            }}
          />
        </Card>
      )}

      <AdmitModal
        prefill={admitting}
        onClose={() => setAdmitting(null)}
        onAdmitted={(admission) => void openResident(admission.id)}
      />
      <ApplicationFormModal open={recording} onOpenChange={setRecording} />
      <ApplicationDecisionModal target={deciding} onClose={() => setDeciding(null)} />
      <CheckoutSheet checkoutId={checkoutId} onClose={() => setCheckoutId(null)} />
    </Page>
  )
}

function ApplicationActions({
  row,
  canAllocate,
  onAdmit,
  onDecide,
  onOpen,
}: {
  row: Application
  canAllocate: boolean
  onAdmit: () => void
  onDecide: (action: ApplicationAction) => void
  onOpen: (admissionId: number) => void
}) {
  const actions = canAllocate ? DECISIONS[row.status] : []
  if (row.status === 'admitted' && row.admission_id) {
    const admissionId = row.admission_id
    return (
      <Button
        variant='outline'
        size='sm'
        onClick={(event) => {
          event.stopPropagation()
          onOpen(admissionId)
        }}
      >
        Open resident
      </Button>
    )
  }
  if (!actions.length) return null
  return (
    <div
      className='flex flex-wrap items-center gap-1 md:justify-end'
      onClick={(event) => event.stopPropagation()}
    >
      {row.status === 'approved' && (
        <Button size='sm' onClick={onAdmit}>
          <UserRoundPlus />
          Admit
        </Button>
      )}
      {row.status === 'pending' && (
        <Button variant='outline' size='sm' onClick={() => onDecide('approve')}>
          Approve
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='icon-sm' aria-label={`Actions for ${row.application_no}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {actions.map((action, index) => (
            <div key={action}>
              {action === 'cancel' && index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem
                destructive={action === 'reject' || action === 'cancel'}
                onSelect={() => onDecide(action)}
              >
                {DECISION_LABEL[action]}
              </DropdownMenuItem>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function prefillFrom(row: Application): AdmitPrefill {
  return {
    student: {
      value: String(row.student.id),
      label: row.student.name,
      hint: studentLine(row.student),
    },
    hostel_id: row.hostel_id,
    application_id: row.id,
  }
}
