import { useState, type FormEvent } from 'react'
import { CheckCircle2, DoorOpen, LogIn, LogOut, ScanLine, XCircle } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { DetailList } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { hostelApi, useHostelMutation, useLeaves, type Leave, type PassCheckResult } from '../api'
import { LEAVE_KIND } from '../labels'
import { FormAlert, StudentCell } from './leave-form-parts'
import { PASS_VERDICT, timeLabel } from './leave-helpers'

const LIMIT = 20

type PassInput = { qr?: string; leave_no?: string }

const toPassInput = (text: string): PassInput =>
  /^TZH1/i.test(text) || text.length > 40 ? { qr: text } : { leave_no: text.toUpperCase() }

export function LeaveGatePanel({
  hostelId,
  page,
  onPageChange,
  onOpen,
}: {
  hostelId?: number
  page: number
  onPageChange: (page: number) => void
  onOpen: (leave: Leave) => void
}) {
  const me = useMe().data
  const canOperate = can(me, 'hostel.pass_operate')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [checked, setChecked] = useState<{ input: PassInput; result: PassCheckResult } | null>(null)
  const check = useHostelMutation((input: PassInput) => hostelApi.checkPass(input))
  const gate = useHostelMutation((input: { id: number; direction: 'out' | 'in' }) =>
    input.direction === 'out' ? hostelApi.passOut(input.id) : hostelApi.passIn(input.id)
  )
  const outNow = useLeaves({
    page,
    limit: LIMIT,
    status: 'out',
    hostel_id: hostelId,
    sort: 'expected_return_at',
    order: 'asc',
  })

  const runCheck = async (input: PassInput) => {
    try {
      const result = await check.mutateAsync(input)
      setChecked({ input, result })
      setError(undefined)
    } catch (caught) {
      setChecked(null)
      setError(toApiError(caught).message)
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const text = code.trim()
    if (text.length < 3) {
      setError('Type the pass number, for example HLV-2026-0001, or paste the QR text')
      return
    }
    void runCheck(toPassInput(text))
  }

  const move = async (leave: Leave, direction: 'out' | 'in') => {
    try {
      const result = await gate.mutateAsync({ id: leave.id, direction })
      alerts.success(
        direction === 'out'
          ? `${result.student.name} marked out`
          : `${result.student.name} is back`,
        {
          description:
            direction === 'in' && result.late_minutes
              ? `${result.late_minutes} minutes late`
              : 'Parents are told.',
        }
      )
      if (checked?.result.leave.id === leave.id) await runCheck(checked.input)
    } catch (caught) {
      alerts.error(toApiError(caught).message)
    }
  }

  const columns: Column<Leave>[] = [
    {
      key: 'student',
      header: 'Student',
      cell: (row) => <StudentCell student={row.student} extra={row.bed ?? undefined} />,
    },
    {
      key: 'pass',
      header: 'Pass',
      cell: (row) => (
        <div className='grid gap-0.5'>
          <span className='font-mono text-xs'>{row.leave_no}</span>
          <span className='text-xs text-muted-foreground'>{LEAVE_KIND[row.kind]}</span>
        </div>
      ),
    },
    {
      key: 'left',
      header: 'Left',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='text-xs text-muted-foreground'>{formatDateTime(row.departed_at)}</span>
      ),
    },
    {
      key: 'back',
      header: 'Due back',
      cell: (row) => (
        <div className='flex flex-wrap items-center gap-1'>
          <span className='text-xs'>{formatDateTime(row.expected_return_at)}</span>
          {row.overdue && <Badge tone='danger'>Overdue</Badge>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      cell: (row) =>
        canOperate ? (
          <Button
            size='sm'
            variant='outline'
            loading={gate.isPending && gate.variables?.id === row.id}
            onClick={(event) => {
              event.stopPropagation()
              void move(row, 'in')
            }}
          >
            <LogIn />
            Mark in
          </Button>
        ) : null,
    },
  ]

  const result = checked?.result

  return (
    <div className='grid gap-6'>
      <Card className='grid gap-4 p-5'>
        <form onSubmit={submit} className='grid gap-3' noValidate>
          <label htmlFor='gate-pass' className='text-sm font-bold'>
            Check a pass
          </label>
          <div className='flex flex-col gap-2 sm:flex-row'>
            <div className='relative flex-1'>
              <ScanLine className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                id='gate-pass'
                autoFocus
                autoComplete='off'
                value={code}
                placeholder='Pass number (HLV-2026-0001) or scanned QR text'
                className='h-11 pl-9 font-mono text-base'
                aria-invalid={Boolean(error)}
                onChange={(event) => setCode(event.target.value)}
              />
            </div>
            <Button type='submit' size='lg' className='h-11' loading={check.isPending}>
              Check
            </Button>
          </div>
          <p className='text-xs text-muted-foreground'>
            Checking changes nothing. Mark the student out or in after you see the result.
          </p>
          <FormAlert message={error} />
        </form>

        {result && (
          <div
            className={cn(
              'grid gap-4 rounded-xl border-2 p-4 sm:p-5',
              result.ok
                ? 'border-success/50 bg-success/5'
                : 'border-destructive/50 bg-destructive/5'
            )}
            role='status'
          >
            <div className='flex items-start gap-3'>
              {result.ok ? (
                <CheckCircle2 className='size-10 shrink-0 text-success' />
              ) : (
                <XCircle className='size-10 shrink-0 text-destructive' />
              )}
              <div className='grid min-w-0 gap-0.5'>
                <span
                  className={cn(
                    'text-xl font-extrabold tracking-tight',
                    result.ok ? 'text-success' : 'text-destructive'
                  )}
                >
                  {PASS_VERDICT[result.verdict]}
                </span>
                <span className='text-sm'>{result.message}</span>
              </div>
            </div>
            <div className='rounded-lg border bg-card p-3'>
              <StudentCell
                student={result.leave.student}
                extra={result.leave.bed ?? result.leave.hostel_name}
              />
            </div>
            <DetailList
              items={[
                { label: 'Pass', value: result.leave.leave_no, mono: true },
                { label: 'Kind', value: LEAVE_KIND[result.leave.kind] },
                {
                  label: 'Dates',
                  value:
                    result.leave.from_date === result.leave.to_date
                      ? formatDate(result.leave.from_date)
                      : `${formatDate(result.leave.from_date)} – ${formatDate(result.leave.to_date)}`,
                },
                {
                  label: 'Times',
                  value:
                    [timeLabel(result.leave.depart_time), timeLabel(result.leave.return_time)]
                      .filter(Boolean)
                      .join(' – ') || '—',
                },
                { label: 'Due back', value: formatDateTime(result.leave.expected_return_at) },
                {
                  label: 'Escort',
                  value: result.leave.escort_name
                    ? [
                        result.leave.escort_name,
                        result.leave.escort_relation,
                        result.leave.escort_mobile && `+91 ${result.leave.escort_mobile}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')
                    : 'No escort',
                },
              ]}
            />
            <div className='flex flex-wrap gap-2'>
              {canOperate && result.verdict === 'can_go_out' && (
                <Button
                  size='lg'
                  loading={gate.isPending}
                  onClick={() => void move(result.leave, 'out')}
                >
                  <LogOut />
                  Mark out
                </Button>
              )}
              {canOperate && result.verdict === 'can_come_in' && (
                <Button
                  size='lg'
                  loading={gate.isPending}
                  onClick={() => void move(result.leave, 'in')}
                >
                  <LogIn />
                  Mark back in
                </Button>
              )}
              <Button variant='outline' size='lg' onClick={() => onOpen(result.leave)}>
                Open leave
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className='overflow-hidden'>
        <div className='flex flex-wrap items-center gap-2 border-b px-4 py-3'>
          <h2 className='text-sm font-bold'>Out now</h2>
          <span className='tabular ml-auto text-xs text-muted-foreground'>
            {outNow.data ? `${outNow.data.total} students` : ''}
          </span>
        </div>
        <DataTable
          rows={outNow.data?.items ?? []}
          columns={columns}
          rowKey={(row) => row.id}
          loading={outNow.isFetching}
          error={outNow.isError ? outNow.error.message : null}
          onRetry={() => outNow.refetch()}
          onRowClick={onOpen}
          empty={{
            icon: DoorOpen,
            title: 'Everyone is in',
            description: 'Students marked out on a pass show here until they come back.',
          }}
          card={(row) => (
            <div className='grid gap-2'>
              <div className='flex items-start justify-between gap-2'>
                <StudentCell student={row.student} />
                {row.overdue && <Badge tone='danger'>Overdue</Badge>}
              </div>
              <span className='text-xs text-muted-foreground'>
                {row.leave_no} · {LEAVE_KIND[row.kind]} · due{' '}
                {formatDateTime(row.expected_return_at)}
              </span>
              {canOperate && (
                <Button
                  size='sm'
                  variant='outline'
                  className='justify-self-start'
                  loading={gate.isPending && gate.variables?.id === row.id}
                  onClick={(event) => {
                    event.stopPropagation()
                    void move(row, 'in')
                  }}
                >
                  <LogIn />
                  Mark in
                </Button>
              )}
            </div>
          )}
          pagination={{
            page,
            limit: LIMIT,
            total: outNow.data?.total ?? 0,
            label: 'students',
            onPageChange,
          }}
        />
      </Card>
    </div>
  )
}
