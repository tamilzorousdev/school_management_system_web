import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  CircleOff,
  ClipboardList,
  Clock,
  Eye,
  GraduationCap,
  Plus,
  X,
} from 'lucide-react'
import { Avatar } from '@/components/common/avatar'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { can, useMe } from '@/features/auth/api'
import { useClasses } from '@/features/setup/api'
import { useNow } from '@/hooks/use-now'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate, timeAgo } from '@/lib/format'
import {
  studentsApi,
  useAdmissionInsights,
  useAdmissions,
  useStudentMutation,
  type Admission,
  type AdmissionStatus,
} from '../api'
import { ApplicationModal, EnrolModal, RejectModal } from '../components/admission-modals'
import { ADMISSION_STATUS, GENDER_LABELS, RELATION_LABELS } from '../labels'
import type { AdmissionsSearch } from '../search'

const route = getRouteApi('/_app/admissions')
const LIMIT = 20

export function AdmissionsPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/admissions' })
  const now = useNow(60_000)
  const me = useMe().data
  const canManage = can(me, 'admissions.manage')
  const [creating, setCreating] = useState(false)
  const [enrolling, setEnrolling] = useState<Admission | null>(null)
  const [rejecting, setRejecting] = useState<Admission | null>(null)

  const admissions = useAdmissions({ ...search, limit: LIMIT })
  const insights = useAdmissionInsights()
  const classes = useClasses()
  const approve = useStudentMutation((id: number) => studentsApi.approve(id))
  const rows = admissions.data?.items ?? []

  const setSearch = (patch: Partial<AdmissionsSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })
  const pick = (status: AdmissionStatus) =>
    setSearch({ status: search.status === status ? undefined : status })

  useShortcut('students.create', () => setCreating(true), { enabled: canManage })
  useShortcut('app.refresh', () => {
    void admissions.refetch()
    void insights.refetch()
  })

  const data = insights.data
  const cards: Insight[] = [
    {
      key: 'applied',
      label: 'Waiting for a decision',
      value: data?.applied ?? 0,
      hint: 'Approve or reject',
      icon: Clock,
      tone: 'info',
      active: search.status === 'applied',
      onClick: () => pick('applied'),
    },
    {
      key: 'approved',
      label: 'Approved, not enrolled',
      value: data?.approved ?? 0,
      hint: 'Enrol to create the student',
      icon: CheckCircle2,
      tone: 'warning',
      active: search.status === 'approved',
      onClick: () => pick('approved'),
    },
    {
      key: 'enrolled',
      label: 'Enrolled this year',
      value: data?.enrolled ?? 0,
      hint: 'Now in Students',
      icon: GraduationCap,
      tone: 'success',
      active: search.status === 'enrolled',
      onClick: () => pick('enrolled'),
    },
    {
      key: 'rejected',
      label: 'Rejected',
      value: data?.rejected ?? 0,
      hint: 'With the reason kept',
      icon: AlertCircle,
      tone: 'danger',
      active: search.status === 'rejected',
      onClick: () => pick('rejected'),
    },
  ]

  const actions = (admission: Admission) => {
    if (!canManage) return null
    if (admission.status === 'applied') {
      return (
        <div className='flex items-center justify-end gap-1.5'>
          <Button
            size='sm'
            variant='primary'
            loading={approve.isPending && approve.variables === admission.id}
            onClick={async (event) => {
              event.stopPropagation()
              try {
                await approve.mutateAsync(admission.id)
                alerts.success(`${admission.full_name} approved`)
              } catch (error) {
                alerts.error(toApiError(error).message)
              }
            }}
          >
            <Check className='size-3.5 stroke-[1.75]' />
            Approve
          </Button>
          <Button
            size='icon-sm'
            variant='outline'
            aria-label={`Reject ${admission.full_name}`}
            title='Reject application'
            className='border-[#EDF0EE] bg-white text-[#D92D20] hover:bg-red-50 dark:border-slate-800 dark:bg-slate-900'
            onClick={(event) => {
              event.stopPropagation()
              setRejecting(admission)
            }}
          >
            <X className='size-4 stroke-[1.75]' />
          </Button>
        </div>
      )
    }
    if (admission.status === 'approved') {
      return (
        <div className='flex items-center justify-end gap-1.5'>
          <Button
            size='sm'
            variant='primary'
            onClick={(event) => {
              event.stopPropagation()
              setEnrolling(admission)
            }}
          >
            <Check className='size-3.5 stroke-[1.75]' />
            Enrol
          </Button>
          <Button
            size='icon-sm'
            variant='outline'
            aria-label={`Reject ${admission.full_name}`}
            title='Reject application'
            className='border-[#EDF0EE] bg-white text-[#D92D20] hover:bg-red-50 dark:border-slate-800 dark:bg-slate-900'
            onClick={(event) => {
              event.stopPropagation()
              setRejecting(admission)
            }}
          >
            <X className='size-4 stroke-[1.75]' />
          </Button>
        </div>
      )
    }
    if (admission.status === 'enrolled' && admission.student_id) {
      return (
        <div className='flex items-center justify-end'>
          <Button
            size='icon-sm'
            variant='outline'
            aria-label={`View ${admission.full_name}`}
            title='View student'
            className='border-[#EDF0EE] bg-white text-[#3C4440] hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            onClick={(event) => {
              event.stopPropagation()
              void navigate({
                to: '/students/$studentId',
                params: { studentId: String(admission.student_id!) },
                search: { tab: 'profile' },
              })
            }}
          >
            <Eye className='size-4 stroke-[1.75]' />
          </Button>
        </div>
      )
    }
    return <span className='text-slate-400'>—</span>
  }

  const columns: Column<Admission>[] = [
    {
      key: 'name',
      header: 'APPLICANT',
      sortKey: 'first_name',
      cell: (admission) => (
        <div className='flex items-center gap-3'>
          <Avatar name={admission.full_name} />
          <div className='grid min-w-0'>
            <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
              {admission.full_name}
            </span>
            <span className='truncate font-mono text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
              {admission.admission_no ?? admission.application_no}
              {admission.emis_number ? ` · EMIS ${admission.emis_number}` : ''}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'class',
      header: 'CLASS',
      sortKey: 'class',
      cell: (admission) => (
        <div className='grid'>
          <span className='text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
            Class {admission.class.name}
          </span>
          <span className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            {GENDER_LABELS[admission.gender]} · born {formatDate(admission.dob)}
          </span>
        </div>
      ),
    },
    {
      key: 'parent',
      header: 'PARENT',
      hideBelow: 'lg',
      cell: (admission) => (
        <div className='grid'>
          <span className='text-[13px] leading-[18px] font-medium text-slate-800 dark:text-slate-200'>
            {admission.guardian_name}{' '}
            <span className='text-[11.5px] text-slate-400 dark:text-slate-500'>
              ({RELATION_LABELS[admission.guardian_relation]})
            </span>
          </span>
          <span className='tabular text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            +91 {admission.guardian_mobile}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      sortKey: 'status',
      cell: (admission) => (
        <div className='grid justify-items-start gap-1'>
          <Badge tone={ADMISSION_STATUS[admission.status].tone} dot className='font-medium text-[11.5px]'>
            {ADMISSION_STATUS[admission.status].label}
          </Badge>
          {admission.decision_note && (
            <span
              className='max-w-56 truncate text-[11px] leading-[14px] text-slate-400 dark:text-slate-500'
              title={admission.decision_note}
            >
              {admission.decision_note}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'created',
      header: 'APPLIED',
      sortKey: 'created_at',
      hideBelow: 'xl',
      cell: (admission) => (
        <span className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
          {timeAgo(admission.created_at, now)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'ACTION',
      align: 'right' as const,
      cell: actions,
    },
  ]

  const filtered = Boolean(search.search || search.status || search.class_id)

  return (
    <Page>
      <PageHeader
        eyebrow='People'
        title='Admissions'
        description='Applications move from waiting to approved to enrolled. Enrolling creates the student and invites the parent to the app.'
        actions={
          canManage && (
            <Button variant='primary' size='sm' onClick={() => setCreating(true)}>
              <Plus className='size-4 stroke-[1.75]' />
              New application
            </Button>
          )
        }
      />

      <InsightCards items={cards} loading={insights.isPending} />

      <Card className='overflow-hidden border border-[#EDF0EE] bg-white dark:border-slate-800 dark:bg-slate-900'>
        <ListToolbar
          summary={admissions.data ? `${admissions.data.total} applications` : ''}
          onClear={filtered ? () => navigate({ search: { page: 1 }, replace: true }) : undefined}
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Application no., name or mobile'
            label='Search applications'
          />
          <FilterSelect
            id='admission-class'
            label='Filter by class'
            allLabel='All classes'
            value={search.class_id ? String(search.class_id) : undefined}
            options={(classes.data ?? []).map((item) => ({
              value: String(item.id),
              label: `Class ${item.name}`,
            }))}
            onChange={(value) => setSearch({ class_id: value ? Number(value) : undefined })}
          />
          <FilterSelect
            id='admission-status'
            label='Filter by status'
            allLabel='All statuses'
            value={search.status}
            options={(Object.keys(ADMISSION_STATUS) as AdmissionStatus[]).map((status) => ({
              value: status,
              label: ADMISSION_STATUS[status].label,
            }))}
            onChange={(value) => setSearch({ status: value as AdmissionStatus | undefined })}
          />
        </ListToolbar>

        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(admission) => admission.id}
          loading={admissions.isFetching}
          error={admissions.isError ? admissions.error.message : null}
          onRetry={() => admissions.refetch()}
          sort={{ sort: search.sort, order: search.order ?? 'desc' }}
          onSortChange={(next) => setSearch(next as Partial<AdmissionsSearch>)}
          empty={{
            icon: filtered ? CircleOff : ClipboardList,
            title: filtered ? 'No applications match these filters' : 'No applications yet',
            description: filtered
              ? 'Try another search or clear the filters.'
              : 'Take the first application for this year.',
            action: !filtered && canManage && (
              <Button variant='primary' size='sm' onClick={() => setCreating(true)}>
                <Plus className='size-4 stroke-[1.75]' />
                New application
              </Button>
            ),
          }}
          card={(admission) => (
            <div className='flex items-start gap-3 p-3'>
              <Avatar name={admission.full_name} />
              <div className='grid min-w-0 flex-1 gap-1.5'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='grid min-w-0'>
                    <span className='truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100'>
                      {admission.full_name}
                    </span>
                    <span className='font-mono text-[12px] text-slate-500 dark:text-slate-400'>
                      {admission.admission_no ?? admission.application_no}
                      {admission.emis_number ? ` · EMIS ${admission.emis_number}` : ''}
                    </span>
                  </div>
                  <Badge tone={ADMISSION_STATUS[admission.status].tone} dot className='shrink-0 text-[11.5px] font-medium'>
                    {ADMISSION_STATUS[admission.status].label}
                  </Badge>
                </div>
                <div className='flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-500 dark:text-slate-400'>
                  <span>Class {admission.class.name}</span>
                  <span>·</span>
                  <span>{admission.guardian_name}</span>
                  <span>·</span>
                  <span className='tabular'>+91 {admission.guardian_mobile}</span>
                </div>
                <div className='flex items-center justify-between gap-2 pt-1'>
                  <span className='text-[12px] text-slate-500 dark:text-slate-400'>
                    Applied: {timeAgo(admission.created_at, now)}
                  </span>
                  <div>{actions(admission)}</div>
                </div>
              </div>
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: admissions.data?.total ?? 0,
            label: 'applications',
            onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
          }}
        />
      </Card>

      <ApplicationModal open={creating} onOpenChange={setCreating} />
      {enrolling && (
        <EnrolModal admission={enrolling} onOpenChange={(open) => !open && setEnrolling(null)} />
      )}
      {rejecting && (
        <RejectModal admission={rejecting} onOpenChange={(open) => !open && setRejecting(null)} />
      )}
    </Page>
  )
}
