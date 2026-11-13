import { useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Eye,
  FileDown,
  HandCoins,
  Lock,
  MinusCircle,
  RefreshCw,
  Trash2,
  UsersRound,
  Wallet,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { ErrorState } from '@/components/common/display'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/format'
import { openFile } from '@/lib/files'
import {
  payrollApi,
  payslipPdfUrl,
  useDeleteRun,
  usePayrollMutation,
  usePayrollRun,
  type MissingSalary,
  type Payslip,
} from '../api'
import { RUN_STATUS, rupees, staffText, wholeRupees } from '../labels'
import { PayslipModal } from './payslip-modal'
import { SalaryModal } from './salary-modal'

type Confirming = 'finalize' | 'delete' | null

export function RunDetail({
  runId,
  canManage,
  onBack,
  onOpenSalaries,
}: {
  runId: number
  canManage: boolean
  onBack: () => void
  onOpenSalaries: () => void
}) {
  const run = usePayrollRun(runId)
  const data = run.data
  const [confirming, setConfirming] = useState<Confirming>(null)
  const [settingSalary, setSettingSalary] = useState<MissingSalary | null>(null)
  const [openingSlip, setOpeningSlip] = useState<number | null>(null)
  const [viewingSlip, setViewingSlip] = useState<Payslip | null>(null)
  const rerun = usePayrollMutation((month: string) => payrollApi.runMonth(month))
  const finalize = usePayrollMutation((id: number) => payrollApi.finalize(id))
  const remove = useDeleteRun()

  useShortcut('app.refresh', () => void run.refetch())

  if (run.isPending) {
    return (
      <div className='grid gap-4'>
        <Skeleton className='h-12' />
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4'>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className='h-28' />
          ))}
        </div>
        <Skeleton className='h-72' />
      </div>
    )
  }

  if (run.isError || !data) {
    return (
      <Card>
        <ErrorState
          message={run.error?.message ?? 'Payroll run not found'}
          onRetry={() => run.refetch()}
        />
        <Button variant='ghost' size='sm' className='mb-4 self-center' onClick={onBack}>
          <ArrowLeft />
          All runs
        </Button>
      </Card>
    )
  }

  const draft = data.status === 'draft'
  const canChange = canManage && draft

  const doRerun = async () => {
    try {
      await rerun.mutateAsync(data.month)
      alerts.success(`${data.month_label} payroll recalculated`)
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const doFinalize = async () => {
    try {
      await finalize.mutateAsync(data.id)
      alerts.success(`${data.month_label} payroll finalised`, {
        description: 'Staff have been told their payslip is ready.',
      })
      setConfirming(null)
    } catch (error) {
      alerts.error(toApiError(error).message)
      setConfirming(null)
    }
  }

  const doDelete = async () => {
    const id = data.id
    setConfirming(null)
    onBack()
    try {
      await remove.mutateAsync(id)
      alerts.success('Draft payroll deleted')
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const openSlip = async (slip: Payslip) => {
    setOpeningSlip(slip.id)
    try {
      await openFile(payslipPdfUrl(slip.id))
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setOpeningSlip(null)
    }
  }

  const cards: Insight[] = [
    {
      key: 'staff',
      label: 'Staff paid',
      value: data.staff_count,
      hint: `${data.working_days} working days`,
      icon: UsersRound,
      tone: 'primary',
    },
    {
      key: 'gross',
      label: 'Gross pay',
      value: wholeRupees(data.total_gross),
      hint: rupees(data.total_gross),
      icon: HandCoins,
      tone: 'info',
    },
    {
      key: 'deductions',
      label: 'Deductions',
      value: wholeRupees(data.total_deductions),
      hint: 'PF, ESI, PT, TDS, other',
      icon: MinusCircle,
      tone: 'warning',
    },
    {
      key: 'net',
      label: 'Net pay',
      value: wholeRupees(data.total_net),
      hint: rupees(data.total_net),
      icon: Wallet,
      tone: 'success',
    },
  ]

  const actionButtons = (slip: Payslip) => (
    <div className='flex items-center justify-end gap-1.5'>
      <Button
        variant='outline'
        size='sm'
        className='border-[#0D7A53]/30 text-[#0D7A53] hover:bg-[#EAF5EE]'
        aria-label={`View Payslip for ${slip.name}`}
        onClick={(event) => {
          event.stopPropagation()
          setViewingSlip(slip)
        }}
      >
        <Eye className='size-3.5' />
        Payslip
      </Button>
      <Button
        variant='outline'
        size='sm'
        aria-label={`Payslip PDF for ${slip.name}`}
        loading={openingSlip === slip.id}
        onClick={(event) => {
          event.stopPropagation()
          void openSlip(slip)
        }}
      >
        <FileDown className='size-3.5' />
        PDF
      </Button>
    </div>
  )

  const daysCell = (slip: Payslip) => (
    <span className='grid'>
      <span className='tabular'>
        {slip.paid_days} / {slip.working_days}
      </span>
      {slip.lop_days > 0 && (
        <span className='tabular text-xs font-semibold text-destructive'>{slip.lop_days} LOP</span>
      )}
    </span>
  )

  const columns: Column<Payslip>[] = [
    {
      key: 'employee',
      header: 'Employee',
      cell: (slip) => (
        <div className='grid min-w-0'>
          <span className='truncate font-bold text-foreground hover:text-[#0D7A53]'>
            {slip.name}
          </span>
          <span className='font-mono text-xs text-muted-foreground'>{slip.employee_no}</span>
        </div>
      ),
    },
    {
      key: 'designation',
      header: 'Designation',
      hideBelow: 'lg',
      cell: (slip) => (
        <div className='grid min-w-0'>
          <span className='truncate'>{slip.designation}</span>
          {slip.department && (
            <span className='truncate text-xs text-muted-foreground'>{slip.department}</span>
          )}
        </div>
      ),
    },
    { key: 'days', header: 'Paid days', cell: daysCell },
    {
      key: 'gross',
      header: 'Gross',
      align: 'right',
      cell: (slip) => <span className='tabular'>{rupees(slip.gross)}</span>,
    },
    {
      key: 'deductions',
      header: 'Deductions',
      align: 'right',
      cell: (slip) => (
        <span className='tabular text-muted-foreground'>{rupees(slip.total_deductions)}</span>
      ),
    },
    {
      key: 'net',
      header: 'Net pay',
      align: 'right',
      cell: (slip) => <span className='tabular font-bold text-[#0D7A53]'>{rupees(slip.net)}</span>,
    },
    { key: 'actions', header: '', align: 'right', cell: actionButtons },
  ]

  return (
    <div className='grid gap-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1'>
          <Button variant='ghost' size='sm' onClick={onBack}>
            <ArrowLeft />
            All runs
          </Button>
          <h2 className='text-lg font-extrabold tracking-tight'>{data.month_label} payroll</h2>
          <Badge tone={RUN_STATUS[data.status].tone}>
            {draft ? <CalendarDays className='size-3' /> : <Lock className='size-3' />}
            {RUN_STATUS[data.status].label}
          </Badge>
        </div>
        {canChange && (
          <div className='flex flex-wrap items-center gap-2'>
            <Button variant='outline' onClick={() => void doRerun()} loading={rerun.isPending}>
              <RefreshCw />
              Re-run
            </Button>
            <Button
              variant='outline'
              className='text-destructive hover:bg-destructive/10'
              onClick={() => setConfirming('delete')}
            >
              <Trash2 />
              Delete draft
            </Button>
            <Button onClick={() => setConfirming('finalize')}>
              <BadgeCheck />
              Finalise
            </Button>
          </div>
        )}
      </div>
      {!draft && data.finalized_at && (
        <p className='text-xs text-muted-foreground'>
          Finalised on {formatDateTime(data.finalized_at)}. Staff can download their payslips in the
          app.
        </p>
      )}
      <InsightCards items={cards} />
      {data.missing.length > 0 && (
        <div
          role='status'
          className='grid gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm'
        >
          <div className='flex items-start gap-2.5 font-semibold text-warning'>
            <AlertTriangle className='mt-0.5 size-4 shrink-0' />
            <span>
              {staffText(data.missing.length)} left out of this run because no salary is set.
              {canChange && ' Set their salary, then re-run.'}
            </span>
          </div>
          <ul className='grid gap-2 sm:grid-cols-2 xl:grid-cols-3'>
            {data.missing.map((person) => (
              <li
                key={person.user_id}
                className='flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2'
              >
                <span className='grid min-w-0'>
                  <span className='truncate font-semibold'>{person.name}</span>
                  <span className='font-mono text-xs text-muted-foreground'>
                    {person.employee_no}
                  </span>
                </span>
                {canManage && (
                  <Button
                    size='sm'
                    variant='outline'
                    aria-label={`Set salary for ${person.name}`}
                    onClick={() => setSettingSalary(person)}
                  >
                    Set salary
                  </Button>
                )}
              </li>
            ))}
          </ul>
          {canManage && (
            <Button
              variant='link'
              size='sm'
              className='justify-self-start px-0'
              onClick={onOpenSalaries}
            >
              Open all salaries
            </Button>
          )}
        </div>
      )}
      <Card className='overflow-hidden'>
        <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
          <h2 className='font-bold'>Payslips</h2>
          <span className='tabular text-xs text-muted-foreground'>
            {staffText(data.payslips.length)} · Click any row to preview Payslip
          </span>
        </div>
        <DataTable
          rows={data.payslips}
          columns={columns}
          rowKey={(slip) => slip.id}
          loading={run.isFetching}
          onRowClick={(slip) => setViewingSlip(slip)}
          empty={{
            icon: Wallet,
            title: 'No payslips in this run',
            description: 'Set salaries for your staff, then re-run this month.',
          }}
          card={(slip) => (
            <div className='grid cursor-pointer gap-2' onClick={() => setViewingSlip(slip)}>
              <div className='flex items-start justify-between gap-2'>
                <span className='grid min-w-0'>
                  <span className='truncate font-bold text-[#0D7A53]'>{slip.name}</span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {slip.employee_no} · {slip.designation}
                  </span>
                </span>
                <span className='tabular shrink-0 text-right text-sm font-bold text-[#0D7A53]'>
                  {rupees(slip.net)}
                  <span className='block text-[11px] font-medium text-muted-foreground'>net</span>
                </span>
              </div>
              <span className='tabular text-xs text-muted-foreground'>
                {slip.paid_days} / {slip.working_days} days
                {slip.lop_days > 0 && ` · ${slip.lop_days} LOP`} · Gross {rupees(slip.gross)} ·
                Deductions {rupees(slip.total_deductions)}
              </span>
              <div>{actionButtons(slip)}</div>
            </div>
          )}
        />
      </Card>
      <ConfirmDialog
        open={confirming === 'finalize'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={`Finalise ${data.month_label} payroll?`}
        description={`The ${staffText(data.staff_count)} in this run are told their payslip is ready and can download it in the app. A final run is locked and this can't be undone.`}
        confirmText='Finalise payroll'
        loading={finalize.isPending}
        onConfirm={() => void doFinalize()}
      />
      <ConfirmDialog
        open={confirming === 'delete'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title='Delete this draft?'
        description={`The ${data.month_label} draft and its payslips are removed. You can run the month again later.`}
        confirmText='Delete draft'
        destructive
        loading={remove.isPending}
        onConfirm={() => void doDelete()}
      />
      {settingSalary && (
        <SalaryModal
          userId={settingSalary.user_id}
          successHint={canChange ? 'Re-run this month to include them.' : undefined}
          onClose={() => setSettingSalary(null)}
        />
      )}
      {viewingSlip && <PayslipModal slip={viewingSlip} onClose={() => setViewingSlip(null)} />}
    </div>
  )
}
