import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { Award, CircleOff, Plus } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { FilterSelect, ListToolbar } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { can, useMe } from '@/features/auth/api'
import { useAcademicYears } from '@/features/setup/api'
import { formatDate } from '@/lib/format'
import {
  useAppraisals,
  type AppraisalStatus,
  type OverallRating,
  type StaffAppraisal,
} from '../api'
import { AppraisalFormModal } from '../components/appraisal-form-modal'
import { AppraisalSheet } from '../components/appraisal-sheet'
import { AppraisalStaffPicker } from '../components/staff-picker'
import { APPRAISAL_STATUS, OVERALL_RATING, RECOMMENDATION, scoreText } from '../labels'
import type { AppraisalsSearch } from '../search'

const route = getRouteApi('/_app/staff/appraisals')
const LIMIT = 20

export function AppraisalsPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/staff/appraisals' })
  const me = useMe().data
  const canManage = can(me, 'staff.manage')
  const years = useAcademicYears()
  const list = useAppraisals({
    page: search.page,
    limit: LIMIT,
    academic_year_id: search.academic_year_id,
    staff_id: search.staff_id,
    status: search.status,
    rating: search.rating,
    sort: search.sort,
    order: search.order,
  })
  const [editing, setEditing] = useState<{ appraisal: StaffAppraisal | null } | null>(null)

  const setSearch = (patch: Partial<AppraisalsSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })
  const open = (id: number | undefined) =>
    navigate({ search: (prev) => ({ ...prev, appraisal: id }), replace: true })

  useShortcut('app.refresh', () => void list.refetch())
  useShortcut('appraisals.create', () => setEditing({ appraisal: null }), { enabled: canManage })

  const columns: Column<StaffAppraisal>[] = [
    {
      key: 'staff',
      header: 'Staff',
      cell: (row) => (
        <span className='grid min-w-0'>
          <span className='font-semibold break-words'>{row.staff.name}</span>
          <span className='text-xs text-muted-foreground'>
            {[row.employee_no, row.department ?? row.designation].filter(Boolean).join(' · ')}
          </span>
        </span>
      ),
    },
    {
      key: 'period',
      header: 'Period',
      hideBelow: 'lg',
      cell: (row) => <span className='break-words'>{row.period}</span>,
    },
    {
      key: 'review_date',
      header: 'Review date',
      sortKey: 'review_date',
      cell: (row) => <span className='tabular'>{formatDate(row.review_date)}</span>,
    },
    {
      key: 'score',
      header: 'Score',
      cell: (row) => (
        <span className='grid gap-1'>
          <span className='tabular font-semibold'>{scoreText(row.overall_score)} / 5</span>
          <Badge tone={OVERALL_RATING[row.overall_rating].tone}>
            {OVERALL_RATING[row.overall_rating].label}
          </Badge>
        </span>
      ),
    },
    {
      key: 'recommendation',
      header: 'Recommendation',
      hideBelow: 'xl',
      cell: (row) => (
        <span className='text-sm'>
          {RECOMMENDATION[row.recommendation]}
          {row.increment_percent > 0 && (
            <span className='text-muted-foreground'> · {row.increment_percent}%</span>
          )}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <span className='grid gap-1'>
          <Badge tone={APPRAISAL_STATUS[row.status].tone} dot>
            {APPRAISAL_STATUS[row.status].label}
          </Badge>
          {row.staff_remarks && (
            <span className='text-xs text-muted-foreground'>Teacher commented</span>
          )}
        </span>
      ),
    },
  ]

  const filtered = Boolean(
    search.academic_year_id || search.staff_id || search.status || search.rating
  )
  const newButton = canManage && (
    <Button onClick={() => setEditing({ appraisal: null })}>
      <Plus />
      New appraisal
    </Button>
  )

  return (
    <Page>
      <PageHeader
        eyebrow='People'
        title='Staff appraisals'
        description='Performance reviews for teachers and staff. Finalized appraisals appear in the Staff app, where the teacher can comment.'
        actions={newButton}
      />

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={list.data ? `${list.data.total} appraisals` : ''}
          onClear={
            filtered
              ? () =>
                  setSearch({
                    academic_year_id: undefined,
                    staff_id: undefined,
                    status: undefined,
                    rating: undefined,
                  })
              : undefined
          }
        >
          <AppraisalStaffPicker
            id='appraisal-staff-filter'
            label='Filter by staff'
            allLabel='All staff'
            placeholder='All staff'
            value={search.staff_id}
            onChange={(value) => setSearch({ staff_id: value })}
          />
          <FilterSelect
            id='appraisal-year-filter'
            label='Filter by academic year'
            allLabel='All years'
            value={search.academic_year_id ? String(search.academic_year_id) : undefined}
            options={(years.data ?? []).map((year) => ({
              value: String(year.id),
              label: year.name,
            }))}
            onChange={(value) => setSearch({ academic_year_id: value ? Number(value) : undefined })}
          />
          <FilterSelect
            id='appraisal-status-filter'
            label='Filter by status'
            allLabel='All statuses'
            value={search.status}
            options={(Object.keys(APPRAISAL_STATUS) as AppraisalStatus[]).map((value) => ({
              value,
              label: APPRAISAL_STATUS[value].label,
            }))}
            onChange={(value) => setSearch({ status: value as AppraisalStatus | undefined })}
          />
          <FilterSelect
            id='appraisal-rating-filter'
            label='Filter by rating'
            allLabel='All ratings'
            value={search.rating}
            options={(Object.keys(OVERALL_RATING) as OverallRating[]).map((value) => ({
              value,
              label: OVERALL_RATING[value].label,
            }))}
            onChange={(value) => setSearch({ rating: value as OverallRating | undefined })}
          />
        </ListToolbar>

        <DataTable
          rows={list.data?.items ?? []}
          columns={columns}
          rowKey={(row) => row.id}
          loading={list.isFetching}
          error={list.isError ? list.error.message : null}
          onRetry={() => list.refetch()}
          onRowClick={(row) => open(row.id)}
          sort={{ sort: search.sort ?? 'review_date', order: search.order ?? 'desc' }}
          onSortChange={(next) => setSearch(next as Partial<AppraisalsSearch>)}
          empty={{
            icon: filtered ? CircleOff : Award,
            title: filtered ? 'No appraisals match these filters' : 'No appraisals yet',
            description: filtered
              ? 'Try another filter, or clear them.'
              : 'Record the first performance review for a teacher or staff member.',
            action: filtered ? undefined : newButton || undefined,
          }}
          card={(row) => (
            <div className='grid gap-2'>
              <div className='flex items-start justify-between gap-2'>
                <span className='grid min-w-0'>
                  <span className='font-bold break-words'>{row.staff.name}</span>
                  <span className='text-xs text-muted-foreground'>
                    {row.period} · {formatDate(row.review_date)}
                  </span>
                </span>
                <Badge tone={APPRAISAL_STATUS[row.status].tone} dot>
                  {APPRAISAL_STATUS[row.status].label}
                </Badge>
              </div>
              <span className='flex flex-wrap items-center gap-2 text-sm'>
                <span className='tabular font-semibold'>{scoreText(row.overall_score)} / 5</span>
                <Badge tone={OVERALL_RATING[row.overall_rating].tone}>
                  {OVERALL_RATING[row.overall_rating].label}
                </Badge>
                {row.staff_remarks && (
                  <span className='text-xs text-muted-foreground'>Teacher commented</span>
                )}
              </span>
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: list.data?.total ?? 0,
            label: 'appraisals',
            onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
          }}
        />
      </Card>

      <AppraisalSheet
        appraisalId={search.appraisal ?? null}
        canManage={canManage}
        onEdit={(row) => {
          open(undefined)
          setEditing({ appraisal: row })
        }}
        onClose={() => open(undefined)}
      />
      {editing && (
        <AppraisalFormModal
          appraisal={editing.appraisal}
          onOpenChange={(value) => !value && setEditing(null)}
        />
      )}
    </Page>
  )
}
