import { useState } from 'react'
import { ClipboardCheck, Copy, FilePlus2, Layers, Pencil, Plus, Tags } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState, ErrorState } from '@/components/common/display'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'
import type { FeeAccess } from '../access'
import { useFeeHeads, useFeePlans, type FeeHead, type FeePlanSummary } from '../api'
import { FREQUENCIES, PLAN_VERSION_STATUS, rupees } from '../labels'
import { CopyPlansModal } from './copy-plans-modal'
import { GenerateModal } from './generate-modal'
import { LateFeeCard } from './late-fee-card'
import { HeadModal } from './head-modal'
import { PlanModal } from './plan-modal'

export function PlansTab({
  access,
  planClassId,
  onOpenPlan,
}: {
  access: FeeAccess
  planClassId?: number
  onOpenPlan: (classId: number | undefined) => void
}) {
  const heads = useFeeHeads()
  const plans = useFeePlans()
  const [head, setHead] = useState<FeeHead | 'new' | null>(null)
  const [generating, setGenerating] = useState(false)
  const [copying, setCopying] = useState(false)
  const headRows = heads.data?.items ?? []
  const planRows = plans.data ?? []
  const editing = planRows.find((row) => row.class_id === planClassId)
  const canOpen = access.configure || access.approve
  const waiting = planRows.filter((row) => row.draft_status === 'pending_approval').length

  useShortcut('app.refresh', () => {
    void heads.refetch()
    void plans.refetch()
  })

  const columns: Column<FeePlanSummary>[] = [
    {
      key: 'class',
      header: 'Class',
      cell: (row) => <span className='font-bold'>Class {row.class_name}</span>,
    },
    {
      key: 'students',
      header: 'Students',
      align: 'right',
      cell: (row) => <span className='tabular'>{row.student_count}</span>,
    },
    {
      key: 'installments',
      header: 'Installments',
      cell: (row) => <Installments row={row} />,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <PlanState row={row} />,
    },
    {
      key: 'total',
      header: 'Year total',
      align: 'right',
      cell: (row) => <span className='tabular font-bold'>{rupees(row.total)}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (row) =>
        canOpen && (
          <Button
            size='sm'
            variant={
              access.approve && row.draft_status === 'pending_approval' ? 'default' : 'outline'
            }
            aria-label={`${actionLabel(row, access)} for class ${row.class_name}`}
            onClick={(event) => {
              event.stopPropagation()
              onOpenPlan(row.class_id)
            }}
          >
            {access.approve && row.draft_status === 'pending_approval' ? (
              <ClipboardCheck />
            ) : (
              <Pencil />
            )}
            {actionLabel(row, access)}
          </Button>
        ),
    },
  ]

  return (
    <div className='grid gap-4 lg:grid-cols-[20rem_1fr] lg:items-start'>
      <div className='grid gap-4'>
        <Card className='overflow-hidden'>
          <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
            <h2 className='font-bold'>Fee heads</h2>
            {access.configure && (
              <Button size='sm' variant='outline' onClick={() => setHead('new')}>
                <Plus />
                Add head
              </Button>
            )}
          </div>
          {heads.isPending ? (
            <div className='grid gap-2 p-4'>
              <Skeleton className='h-10' />
              <Skeleton className='h-10' />
            </div>
          ) : heads.isError ? (
            <ErrorState message={heads.error.message} onRetry={() => heads.refetch()} />
          ) : headRows.length ? (
            <ul className='divide-y'>
              {headRows.map((item) => (
                <li key={item.id} className='flex items-center justify-between gap-2 px-4 py-2.5'>
                  <span className='grid min-w-0 gap-0.5'>
                    <span className='truncate font-semibold'>{item.name}</span>
                    <span className='flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground'>
                      <span className='font-mono'>{item.code}</span>
                      {item.is_transport ? (
                        <Badge tone='info'>From bus stop</Badge>
                      ) : (
                        <span>
                          · on {item.plan_lines} plan {item.plan_lines === 1 ? 'line' : 'lines'}
                        </span>
                      )}
                      {!item.is_mandatory && <Badge tone='warning'>Optional</Badge>}
                      {item.frequency !== 'custom' && <span>· {FREQUENCIES[item.frequency]}</span>}
                      {item.fee_group && <span>· {item.fee_group}</span>}
                      {item.is_refundable && <Badge tone='info'>Refundable</Badge>}
                      {item.applicable_class_ids.length > 0 && (
                        <span>
                          · {item.applicable_class_ids.length}{' '}
                          {item.applicable_class_ids.length === 1 ? 'class' : 'classes'}
                        </span>
                      )}
                      {!item.is_active && <Badge>Switched off</Badge>}
                    </span>
                  </span>
                  {access.configure && (
                    <Button
                      size='sm'
                      variant='ghost'
                      aria-label={`Edit ${item.name}`}
                      onClick={() => setHead(item)}
                    >
                      <Pencil />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Tags}
              title='No fee heads yet'
              description='Add tuition, books and a transport head to build fee plans.'
            />
          )}
        </Card>
        <LateFeeCard access={access} />
      </div>
      <Card className='min-w-0 overflow-hidden'>
        <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
          <div className='grid gap-0.5'>
            <h2 className='font-bold'>Class fee plans</h2>
            <p className='text-xs text-muted-foreground'>
              Transport is added per student: stop fee × months since the last due date. Plan
              changes are used once approved.
            </p>
            {waiting > 0 && (
              <p className='text-xs font-semibold text-warning'>
                {waiting === 1
                  ? '1 plan change is waiting for approval.'
                  : `${waiting} plan changes are waiting for approval.`}
              </p>
            )}
          </div>
          <div className='flex flex-wrap gap-2'>
            {access.configure && (
              <Button size='sm' variant='outline' onClick={() => setCopying(true)}>
                <Copy />
                Copy plans
              </Button>
            )}
            {access.assign && (
              <Button size='sm' onClick={() => setGenerating(true)}>
                <FilePlus2 />
                Generate invoices
              </Button>
            )}
          </div>
        </div>
        <DataTable
          rows={planRows}
          columns={columns}
          rowKey={(row) => row.class_id}
          loading={plans.isFetching}
          error={plans.isError ? plans.error.message : null}
          onRetry={() => plans.refetch()}
          onRowClick={canOpen ? (row) => onOpenPlan(row.class_id) : undefined}
          empty={{
            icon: Layers,
            title: 'No classes yet',
            description: 'Add classes in School setup first.',
          }}
          card={(row) => (
            <div className='grid gap-2'>
              <div className='flex items-center justify-between gap-2'>
                <span className='font-bold'>Class {row.class_name}</span>
                <span className='tabular text-sm font-bold'>{rupees(row.total)}</span>
              </div>
              <span className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                {row.student_count} students
                <PlanState row={row} />
              </span>
              <Installments row={row} />
            </div>
          )}
        />
      </Card>
      {head && <HeadModal head={head === 'new' ? null : head} onClose={() => setHead(null)} />}
      {editing && (
        <PlanModal
          classId={editing.class_id}
          className={editing.class_name}
          heads={headRows}
          access={access}
          onClose={() => onOpenPlan(undefined)}
        />
      )}
      {generating && <GenerateModal onClose={() => setGenerating(false)} />}
      {copying && <CopyPlansModal plans={planRows} onClose={() => setCopying(false)} />}
    </div>
  )
}

function actionLabel(row: FeePlanSummary, access: FeeAccess) {
  if (row.draft_status === 'pending_approval') return access.approve ? 'Review' : 'View'
  if (!access.configure) return 'View'
  return row.draft_status === 'draft' ? 'Edit draft' : 'Edit plan'
}

function PlanState({ row }: { row: FeePlanSummary }) {
  if (row.draft_status) {
    return (
      <Badge tone={PLAN_VERSION_STATUS[row.draft_status].tone}>
        {PLAN_VERSION_STATUS[row.draft_status].label}
      </Badge>
    )
  }
  return row.version ? (
    <span className='text-xs text-muted-foreground'>Version {row.version}</span>
  ) : null
}

function Installments({ row }: { row: FeePlanSummary }) {
  if (!row.installments.length) {
    return <span className='text-xs text-muted-foreground'>No plan yet</span>
  }
  return (
    <span className='flex flex-wrap gap-1.5'>
      {row.installments.map((item) => (
        <span
          key={item.installment}
          className='tabular inline-flex items-center gap-1 rounded-md border bg-muted/40 px-2 py-0.5 text-xs'
        >
          <span className='font-semibold'>{item.installment}</span>
          <span className='text-muted-foreground'>
            {rupees(item.amount)} · {formatDate(item.due_date)}
          </span>
        </span>
      ))}
    </span>
  )
}
