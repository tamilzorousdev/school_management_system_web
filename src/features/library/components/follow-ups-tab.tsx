import { useState } from 'react'
import { PhoneCall } from 'lucide-react'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { can, useMe } from '@/features/auth/api'
import { MEMBER_TYPES, useFollowUps, type Loan } from '../api'
import { MEMBER_TYPE, optionsOf } from '../labels'
import { LIST_LIMIT, oneOf, type LibraryTabProps } from '../search'
import { LoanDetailSheet } from './loan-detail-sheet'
import { LoanActionModal } from './loan-modals'
import { LoanTable } from './loan-table'
import { ClassFilter } from './school-pickers'

export function FollowUpsTab({ search, onChange }: LibraryTabProps) {
  const canManage = can(useMe().data, 'library.manage')
  const show = search.show ?? 'due'
  const memberType = oneOf(MEMBER_TYPES, search.member_type)
  const followUps = useFollowUps({
    page: search.page ?? 1,
    limit: LIST_LIMIT,
    search: search.search,
    show,
    member_type: memberType,
    class_id: search.class_id,
  })
  const [logging, setLogging] = useState<Loan | null>(null)
  const filtered = Boolean(search.search || memberType || search.class_id)

  return (
    <div className='grid gap-4'>
      <Card className='overflow-hidden'>
        <ListToolbar
          summary={followUps.data ? `${followUps.data.total} overdue` : ''}
          onClear={
            filtered
              ? () => onChange({ search: undefined, member_type: undefined, class_id: undefined })
              : undefined
          }
        >
          <SegmentedControl
            label='Which overdue loans'
            value={show}
            onChange={(next) => onChange({ show: next === 'due' ? undefined : next })}
            options={[
              { value: 'due', label: 'To call today' },
              { value: 'all', label: 'All overdue' },
            ]}
          />
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => onChange({ search: value || undefined })}
            placeholder='Book or member'
            label='Search follow-ups'
          />
          <FilterSelect
            id='follow-member-type'
            label='Filter by member type'
            allLabel='Students and staff'
            value={memberType}
            options={optionsOf(MEMBER_TYPE)}
            onChange={(member_type) => onChange({ member_type })}
          />
          <ClassFilter value={search.class_id} onChange={(class_id) => onChange({ class_id })} />
        </ListToolbar>
        <LoanTable
          rows={followUps.data?.items ?? []}
          loading={followUps.isFetching}
          error={followUps.isError ? followUps.error.message : null}
          onRetry={() => followUps.refetch()}
          columns={['book', 'member', 'phone', 'due', 'state', 'fine', 'follow_up']}
          actions={
            canManage
              ? (loan) => (
                  <Button size='sm' variant='outline' onClick={() => setLogging(loan)}>
                    <PhoneCall />
                    Log
                  </Button>
                )
              : undefined
          }
          onRowClick={(loan) => onChange({ loan_id: loan.id, page: search.page })}
          filtered={filtered}
          emptyTitle={show === 'due' ? 'No one to call today' : 'No overdue books'}
          emptyDescription={
            show === 'due'
              ? 'Every overdue loan has a follow-up date in the future.'
              : 'Every book is back on time.'
          }
          pagination={{
            page: search.page ?? 1,
            limit: LIST_LIMIT,
            total: followUps.data?.total ?? 0,
            label: 'loans',
            onPageChange: (page) => onChange({ page }),
          }}
        />
      </Card>
      <LoanActionModal
        action={logging ? 'follow-up' : null}
        loan={logging}
        onClose={() => setLogging(null)}
      />
      <LoanDetailSheet
        loanId={search.loan_id ?? null}
        onClose={() => onChange({ loan_id: undefined, page: search.page })}
      />
    </div>
  )
}
