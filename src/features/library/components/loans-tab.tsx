import { useState } from 'react'
import { BookOpen, CalendarClock, CalendarX2, Clock3, Download, PhoneCall } from 'lucide-react'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { wholeRupees } from '@/features/fees/labels'
import {
  ISSUE_PURPOSES,
  ISSUE_STATUSES,
  MEMBER_TYPES,
  OPEN_LOAN_STATES,
  useIssueInsights,
  useIssues,
  type IssueFilters,
  type OpenLoanState,
} from '../api'
import {
  ISSUE_PURPOSE,
  ISSUE_STATUS,
  LOAN_STATE,
  MEMBER_TYPE,
  downloadIssuesCsv,
  optionsOf,
} from '../labels'
import { LIST_LIMIT, oneOf, type LibraryTabProps } from '../search'
import { LoanActionsMenu, LoanDetailSheet } from './loan-detail-sheet'
import { LoanTable } from './loan-table'
import { ClassFilter } from './school-pickers'

export function LoansTab({ search, onChange, onGo }: LibraryTabProps) {
  const state = oneOf(OPEN_LOAN_STATES, search.state)
  const filters: IssueFilters = {
    search: search.search,
    sort: search.sort,
    order: search.order,
    status: oneOf(ISSUE_STATUSES, search.status),
    state,
    member_type: oneOf(MEMBER_TYPES, search.member_type),
    class_id: search.class_id,
    purpose: oneOf(ISSUE_PURPOSES, search.purpose),
    from: search.from,
    to: search.to,
  }
  const issues = useIssues({ ...filters, page: search.page ?? 1, limit: LIST_LIMIT })
  const insights = useIssueInsights()
  const [exporting, setExporting] = useState(false)
  const data = insights.data

  const pickState = (next: OpenLoanState) =>
    onChange({ state: state === next ? undefined : next, status: undefined })

  const cards: Insight[] = [
    {
      key: 'on_loan',
      label: 'Books out',
      value: data?.on_loan ?? 0,
      hint: `${data?.issued_today ?? 0} issued · ${data?.returned_today ?? 0} returned today`,
      icon: BookOpen,
      tone: 'primary',
      active: state === 'on_loan',
      onClick: () => pickState('on_loan'),
    },
    {
      key: 'overdue',
      label: 'Overdue',
      value: data?.overdue ?? 0,
      hint: `${wholeRupees(data?.running_fines ?? 0)} in late fines building`,
      icon: CalendarX2,
      tone: data?.overdue ? 'danger' : 'success',
      active: state === 'overdue',
      onClick: () => pickState('overdue'),
    },
    {
      key: 'due_today',
      label: 'Due today',
      value: data?.due_today ?? 0,
      hint: 'Remind them at the desk',
      icon: CalendarClock,
      tone: 'warning',
      active: state === 'due_today',
      onClick: () => pickState('due_today'),
    },
    {
      key: 'due_soon',
      label: 'Due soon',
      value: data?.due_soon ?? 0,
      hint: `${data?.lost ?? 0} lost this year`,
      icon: Clock3,
      tone: 'info',
      active: state === 'due_soon',
      onClick: () => pickState('due_soon'),
    },
    {
      key: 'follow_ups',
      label: 'Follow-ups due',
      value: data?.follow_ups_due ?? 0,
      hint: 'Overdue loans to call about',
      icon: PhoneCall,
      tone: data?.follow_ups_due ? 'warning' : 'neutral',
      onClick: () => onGo('follow-ups'),
    },
  ]

  const filtered = Boolean(
    filters.search ||
    filters.status ||
    filters.state ||
    filters.member_type ||
    filters.class_id ||
    filters.purpose ||
    filters.from ||
    filters.to
  )

  return (
    <div className='grid gap-4'>
      <InsightCards items={cards} loading={insights.isPending} />
      <Card className='overflow-hidden'>
        <ListToolbar
          summary={issues.data ? `${issues.data.total} loans` : ''}
          onClear={
            filtered
              ? () =>
                  onChange({
                    search: undefined,
                    status: undefined,
                    state: undefined,
                    member_type: undefined,
                    class_id: undefined,
                    purpose: undefined,
                    from: undefined,
                    to: undefined,
                  })
              : undefined
          }
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => onChange({ search: value || undefined })}
            placeholder='Book, accession, member or card'
            label='Search loans'
          />
          <FilterSelect
            id='loan-status-filter'
            label='Filter by status'
            allLabel='All statuses'
            value={filters.status}
            options={optionsOf(ISSUE_STATUS)}
            onChange={(status) => onChange({ status, state: undefined })}
          />
          <FilterSelect
            id='loan-state-filter'
            label='Filter by due state'
            allLabel='Any due state'
            value={state}
            options={OPEN_LOAN_STATES.map((value) => ({ value, label: LOAN_STATE[value].label }))}
            onChange={(next) => onChange({ state: next, status: undefined })}
          />
          <FilterSelect
            id='loan-member-type-filter'
            label='Filter by member type'
            allLabel='Students and staff'
            value={filters.member_type}
            options={optionsOf(MEMBER_TYPE)}
            onChange={(member_type) => onChange({ member_type })}
          />
          <ClassFilter value={search.class_id} onChange={(class_id) => onChange({ class_id })} />
          <FilterSelect
            id='loan-purpose-filter'
            label='Filter by purpose'
            allLabel='Any purpose'
            value={filters.purpose}
            options={optionsOf(ISSUE_PURPOSE)}
            onChange={(purpose) => onChange({ purpose })}
          />
          <div className='flex items-center gap-1.5'>
            <Input
              type='date'
              aria-label='Issued from'
              placeholder='From'
              value={search.from ?? ''}
              onChange={(event) => onChange({ from: event.target.value || undefined })}
              className='w-36'
            />
            <span className='text-xs text-muted-foreground'>to</span>
            <Input
              type='date'
              aria-label='Issued to'
              placeholder='To'
              value={search.to ?? ''}
              onChange={(event) => onChange({ to: event.target.value || undefined })}
              className='w-36'
            />
          </div>
          <Button
            variant='outline'
            size='sm'
            loading={exporting}
            onClick={async () => {
              setExporting(true)
              await downloadIssuesCsv({ ...filters })
              setExporting(false)
            }}
          >
            <Download />
            Export CSV
          </Button>
        </ListToolbar>
        <LoanTable
          rows={issues.data?.items ?? []}
          loading={issues.isFetching}
          error={issues.isError ? issues.error.message : null}
          onRetry={() => issues.refetch()}
          columns={['book', 'member', 'issued', 'due', 'state', 'returned', 'fine']}
          actions={(loan) => <LoanActionsMenu loan={loan} />}
          onRowClick={(loan) => onChange({ loan_id: loan.id, page: search.page })}
          sort={{ sort: search.sort, order: search.order ?? 'desc' }}
          onSortChange={(next) => onChange(next)}
          filtered={filtered}
          emptyDescription='Books issued at the desk show here.'
          pagination={{
            page: search.page ?? 1,
            limit: LIST_LIMIT,
            total: issues.data?.total ?? 0,
            label: 'loans',
            onPageChange: (page) => onChange({ page }),
          }}
        />
      </Card>
      <LoanDetailSheet
        loanId={search.loan_id ?? null}
        onClose={() => onChange({ loan_id: undefined, page: search.page })}
      />
    </div>
  )
}
