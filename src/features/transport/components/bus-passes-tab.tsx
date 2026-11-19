import { useState } from 'react'
import {
  BadgeCheck,
  Ban,
  Clock,
  IdCard,
  PauseCircle,
  PlayCircle,
  Printer,
  Settings2,
  TicketX,
  Wallet,
  X,
} from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { DataTable, type Column } from '@/components/common/data-table'
import { FormField } from '@/components/common/form-field'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { useMe } from '@/features/auth/api'
import { formatDate } from '@/lib/format'
import {
  transportApi,
  useBusPassInsights,
  useBusPasses,
  useBusPassSettings,
  useBusRoutes,
  useTransportMutation,
  type BusPass,
  type BusPassState,
  type FeeStanding,
} from '../api'
import { rupees } from '../labels'
import { printBusPass } from '../print-bus-pass'

const LIMIT = 20

const PASS_STATE: Record<BusPassState, { label: string; tone: BadgeTone }> = {
  awaiting_payment: { label: 'Waiting for payment', tone: 'neutral' },
  active: { label: 'Active', tone: 'success' },
  on_hold: { label: 'On hold', tone: 'danger' },
  expired: { label: 'Expired', tone: 'neutral' },
}

const NOT_BILLED = { label: 'Not billed yet', tone: 'neutral' as BadgeTone }

const feeBadge = (row: BusPass) => (row.fee.billed ? FEE[row.fee.standing] : NOT_BILLED)

const FEE: Record<FeeStanding, { label: string; tone: BadgeTone }> = {
  clear: { label: 'Paid', tone: 'success' },
  due: { label: 'Due', tone: 'warning' },
  past_grace: { label: 'Pending', tone: 'danger' },
}

export function BusPassesTab({ canManage }: { canManage: boolean }) {
  const [search, setSearch] = useState('')
  const [state, setState] = useState<BusPassState>()
  const [fee, setFee] = useState<FeeStanding>()
  const [routeId, setRouteId] = useState<number>()
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [holding, setHolding] = useState<number[] | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [viewing, setViewing] = useState<BusPass | null>(null)
  const params = { page, limit: LIMIT, search: search || undefined, state, fee, route_id: routeId }
  const passes = useBusPasses(params)
  const insights = useBusPassInsights()
  const routes = useBusRoutes()
  const activate = useTransportMutation((ids: number[]) => transportApi.activatePasses(ids))
  const rows = passes.data?.items ?? []
  const filtered = Boolean(search || state || fee || routeId)
  const reset = (apply: () => void) => {
    apply()
    setPage(1)
    setSelected(new Set())
  }
  const toggle = (id: number) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const stats = insights.data

  const cards: Insight[] = [
    {
      key: 'active',
      label: 'Active passes',
      value: stats?.active ?? 0,
      hint: `of ${stats?.total ?? 0} on the bus`,
      icon: BadgeCheck,
      tone: 'success',
      active: state === 'active',
      onClick: () => reset(() => setState(state === 'active' ? undefined : 'active')),
    },
    {
      key: 'waiting',
      label: 'Waiting for payment',
      value: stats?.awaiting_payment ?? 0,
      hint: 'No bus fee paid yet',
      icon: Clock,
      tone: 'neutral',
      active: state === 'awaiting_payment',
      onClick: () =>
        reset(() => setState(state === 'awaiting_payment' ? undefined : 'awaiting_payment')),
    },
    {
      key: 'pending',
      label: 'Bus fee pending',
      value: stats?.fee_past_grace ?? 0,
      hint: `${stats?.fee_due ?? 0} more still within the grace days`,
      icon: Wallet,
      tone: 'danger',
      active: fee === 'past_grace',
      onClick: () => reset(() => setFee(fee === 'past_grace' ? undefined : 'past_grace')),
    },
    {
      key: 'held',
      label: 'On hold',
      value: stats?.on_hold ?? 0,
      hint: 'The crew sees these',
      icon: TicketX,
      tone: 'warning',
      active: state === 'on_hold',
      onClick: () => reset(() => setState(state === 'on_hold' ? undefined : 'on_hold')),
    },
  ]

  const runActivate = async (ids: number[]) => {
    try {
      const result = await activate.mutateAsync(ids)
      alerts.success(
        `${result.changed} ${result.changed === 1 ? 'pass' : 'passes'} active again. Parents told.`
      )
      setSelected(new Set())
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const columns: Column<BusPass>[] = [
    ...(canManage
      ? [
          {
            key: 'select',
            header: <span className='sr-only'>Select</span>,
            className: 'w-10',
            cell: (row: BusPass) => (
              <input
                type='checkbox'
                aria-label={`Select ${row.student.full_name}`}
                className='size-4 cursor-pointer accent-primary'
                checked={selected.has(row.student.id)}
                onChange={() => toggle(row.student.id)}
                onClick={(event) => event.stopPropagation()}
              />
            ),
          },
        ]
      : []),
    {
      key: 'student',
      header: 'Student',
      cell: (row) => (
        <span className='grid min-w-0'>
          <span className='truncate font-semibold'>{row.student.full_name}</span>
          <span className='truncate text-xs text-muted-foreground'>
            {row.student.class_section ?? row.student.admission_no} ·{' '}
            <span className='font-mono'>{row.pass_no}</span>
          </span>
        </span>
      ),
    },
    {
      key: 'route',
      header: 'Route',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='grid min-w-0'>
          <span className='truncate'>{row.route.name}</span>
          <span className='truncate text-xs text-muted-foreground'>
            {row.pickup?.name ?? row.drop?.name}
            {row.bus ? ` · ${row.bus.name}` : ''}
          </span>
        </span>
      ),
    },
    {
      key: 'pass',
      header: 'Pass',
      cell: (row) => (
        <span className='grid justify-items-start gap-1'>
          <Badge tone={PASS_STATE[row.state].tone} dot>
            {PASS_STATE[row.state].label}
          </Badge>
          {row.state === 'on_hold' && row.hold_kind === 'fee' && (
            <span className='text-xs text-muted-foreground'>Lifts when the fee is paid</span>
          )}
          <span className='text-xs text-muted-foreground'>Until {formatDate(row.valid_until)}</span>
        </span>
      ),
    },
    {
      key: 'fee',
      header: 'Bus fee',
      cell: (row) => (
        <span className='grid justify-items-start gap-1'>
          <Badge tone={feeBadge(row).tone}>{feeBadge(row).label}</Badge>
          {row.fee.standing !== 'clear' && (
            <span className='tabular text-xs text-muted-foreground'>
              {rupees(row.fee.pending_amount)} · grace till{' '}
              {row.fee.grace_ends ? formatDate(row.fee.grace_ends) : '—'}
            </span>
          )}
        </span>
      ),
    },
  ]

  return (
    <div className='grid gap-4'>
      <InsightCards items={cards} loading={insights.isPending} />
      <Card className='overflow-hidden'>
        <ListToolbar
          summary={
            passes.data ? `${passes.data.total} ${passes.data.total === 1 ? 'pass' : 'passes'}` : ''
          }
          onClear={
            filtered
              ? () =>
                  reset(() => {
                    setSearch('')
                    setState(undefined)
                    setFee(undefined)
                    setRouteId(undefined)
                  })
              : undefined
          }
        >
          <SearchBox
            value={search}
            onChange={(value) => reset(() => setSearch(value))}
            placeholder='Name, admission no or pass no'
            label='Search passes'
          />
          <FilterSelect
            id='pass-state'
            label='Pass'
            allLabel='All passes'
            value={state}
            options={(Object.keys(PASS_STATE) as BusPassState[]).map((value) => ({
              value,
              label: PASS_STATE[value].label,
            }))}
            onChange={(value) => reset(() => setState(value as BusPassState | undefined))}
          />
          <FilterSelect
            id='pass-fee'
            label='Bus fee'
            allLabel='Any bus fee'
            value={fee}
            options={[
              { value: 'past_grace', label: 'Pending (past grace)' },
              { value: 'due', label: 'Due (within grace)' },
              { value: 'clear', label: 'Paid' },
            ]}
            onChange={(value) => reset(() => setFee(value as FeeStanding | undefined))}
          />
          <FilterSelect
            id='pass-route'
            label='Route'
            allLabel='All routes'
            value={routeId ? String(routeId) : undefined}
            options={(routes.data ?? []).map((item) => ({
              value: String(item.id),
              label: item.name,
              hint: item.code,
            }))}
            onChange={(value) => reset(() => setRouteId(value ? Number(value) : undefined))}
          />
          {canManage && (
            <Button variant='outline' onClick={() => setShowSettings(true)}>
              <Settings2 />
              Pass settings
            </Button>
          )}
        </ListToolbar>
        {canManage && selected.size > 0 && (
          <div className='flex flex-wrap items-center justify-between gap-2 border-b bg-primary/5 px-4 py-2'>
            <span className='text-sm font-semibold'>
              {selected.size} {selected.size === 1 ? 'student' : 'students'} selected
            </span>
            <div className='flex flex-wrap gap-2'>
              <Button size='sm' variant='ghost' onClick={() => setSelected(new Set())}>
                <X />
                Clear
              </Button>
              <Button
                size='sm'
                variant='outline'
                loading={activate.isPending}
                onClick={() => void runActivate([...selected])}
              >
                <PlayCircle />
                Activate
              </Button>
              <Button size='sm' variant='destructive' onClick={() => setHolding([...selected])}>
                <PauseCircle />
                Restrict pass
              </Button>
            </div>
          </div>
        )}
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(row) => row.student.id}
          loading={passes.isFetching}
          error={passes.isError ? passes.error.message : null}
          onRetry={() => passes.refetch()}
          onRowClick={(row) => setViewing(row)}
          empty={{
            icon: IdCard,
            title: filtered ? 'No passes match these filters' : 'No bus passes yet',
            description: filtered
              ? 'Try another filter, or clear the filters.'
              : 'A pass is made for every student with a bus stop.',
          }}
          card={(row) => (
            <div className='grid gap-1.5'>
              <span className='flex items-center justify-between gap-2'>
                <span className='truncate font-semibold'>{row.student.full_name}</span>
                <Badge tone={PASS_STATE[row.state].tone} dot>
                  {PASS_STATE[row.state].label}
                </Badge>
              </span>
              <span className='text-xs text-muted-foreground'>
                {row.route.name} · {row.pass_no}
              </span>
              <Badge tone={feeBadge(row).tone} className='justify-self-start'>
                Bus fee {feeBadge(row).label.toLowerCase()}
              </Badge>
            </div>
          )}
          pagination={{
            page,
            limit: LIMIT,
            total: passes.data?.total ?? 0,
            label: 'passes',
            onPageChange: setPage,
          }}
        />
      </Card>
      {holding && (
        <RestrictModal
          ids={holding}
          onClose={() => setHolding(null)}
          onDone={() => {
            setHolding(null)
            setSelected(new Set())
          }}
        />
      )}
      {showSettings && <PassSettingsModal onClose={() => setShowSettings(false)} />}
      {viewing && (
        <PassCardModal
          pass={viewing}
          canManage={canManage}
          onClose={() => setViewing(null)}
          onRestrict={() => {
            setHolding([viewing.student.id])
            setViewing(null)
          }}
          onActivate={() => {
            void runActivate([viewing.student.id])
            setViewing(null)
          }}
        />
      )}
    </div>
  )
}

function RestrictModal({
  ids,
  onClose,
  onDone,
}: {
  ids: number[]
  onClose: () => void
  onDone: () => void
}) {
  const [note, setNote] = useState('')
  const restrict = useTransportMutation((input: { ids: number[]; note?: string }) =>
    transportApi.restrictPasses(input.ids, input.note)
  )
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      size='sm'
      title={`Restrict ${ids.length === 1 ? 'this pass' : `${ids.length} passes`}?`}
      description='Parents get a polite note. The driver and attendant see "Pass on hold" and still take the child. A hold for a pending bus fee lifts by itself once the fee is paid.'
      formId='restrict-form'
      submitText='Restrict'
      loading={restrict.isPending}
    >
      <form
        id='restrict-form'
        onSubmit={async (event) => {
          event.preventDefault()
          try {
            const result = await restrict.mutateAsync({ ids, note: note.trim() || undefined })
            alerts.success(
              `${result.changed} ${result.changed === 1 ? 'pass' : 'passes'} on hold. ${result.parents_told} parents told.`
            )
            onDone()
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      >
        <FormField
          id='restrict-note'
          label='Note for the parent'
          hint='Optional. Used when it is not about the bus fee.'
        >
          <Textarea
            id='restrict-note'
            rows={2}
            maxLength={255}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}

function PassSettingsModal({ onClose }: { onClose: () => void }) {
  const settings = useBusPassSettings()
  const [grace, setGrace] = useState<string>()
  const [until, setUntil] = useState<string>()
  const save = useTransportMutation(transportApi.saveBusPassSettings)
  const data = settings.data
  const graceValue = grace ?? String(data?.grace_days ?? 7)
  const untilValue = until ?? data?.valid_until ?? ''
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Bus pass settings'
      description='The bus fee is due on the fee plan installment dates. These settings decide when an unpaid fee is listed and how long new passes last.'
      formId='pass-settings-form'
      submitText='Save'
      loading={save.isPending}
    >
      <form
        id='pass-settings-form'
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={async (event) => {
          event.preventDefault()
          try {
            await save.mutateAsync({
              grace_days: Number(graceValue),
              valid_until: untilValue || null,
            })
            alerts.success('Bus pass settings saved')
            onClose()
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      >
        <FormField
          id='pass-grace'
          label='Grace days'
          hint='Days after the due date before a student shows as bus fee pending.'
        >
          <Input
            id='pass-grace'
            type='number'
            min={0}
            max={90}
            value={graceValue}
            onChange={(event) => setGrace(event.target.value)}
          />
        </FormField>
        <FormField
          id='pass-until'
          label='Passes valid until'
          hint={
            data ? `Empty = end of the academic year (${formatDate(data.year_ends)}).` : undefined
          }
        >
          <Input
            id='pass-until'
            type='date'
            value={untilValue}
            onChange={(event) => setUntil(event.target.value)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}

function PassCardModal({
  pass,
  canManage,
  onClose,
  onRestrict,
  onActivate,
}: {
  pass: BusPass
  canManage: boolean
  onClose: () => void
  onRestrict: () => void
  onActivate: () => void
}) {
  const [until, setUntil] = useState(pass.valid_until)
  const school = useMe().data?.school ?? null
  const save = useTransportMutation((date: string) =>
    transportApi.setPassEnd(pass.student.id, date)
  )
  return (
    <AppModal open onOpenChange={(open) => !open && onClose()} title='Bus pass' size='md'>
      <div className='grid gap-4'>
        <div
          id='bus-pass-print'
          className='grid gap-3 rounded-2xl border-2 border-primary/30 bg-primary/5 p-4'
        >
          <div className='flex items-start gap-3'>
            {pass.student.photo_url ? (
              <img
                src={pass.student.photo_url}
                alt=''
                className='size-16 rounded-xl object-cover'
              />
            ) : (
              <span className='grid size-16 place-items-center rounded-xl bg-muted'>
                <IdCard className='size-7 text-muted-foreground' />
              </span>
            )}
            <span className='grid min-w-0 flex-1 gap-0.5'>
              <span className='font-bold'>{pass.student.full_name}</span>
              <span className='text-xs text-muted-foreground'>
                {pass.student.class_section ?? ''} · {pass.student.admission_no}
              </span>
              <span className='font-mono text-sm font-semibold'>{pass.pass_no}</span>
            </span>
            <Badge tone={PASS_STATE[pass.state].tone} dot>
              {PASS_STATE[pass.state].label}
            </Badge>
          </div>
          <dl className='grid grid-cols-2 gap-2 text-sm'>
            <div>
              <dt className='text-xs text-muted-foreground'>Route</dt>
              <dd className='font-semibold'>{pass.route.name}</dd>
            </div>
            <div>
              <dt className='text-xs text-muted-foreground'>Bus</dt>
              <dd className='font-semibold'>
                {pass.bus ? `${pass.bus.name} · ${pass.bus.registration_no}` : '—'}
                {pass.bus?.today_only && ' (today)'}
              </dd>
            </div>
            <div>
              <dt className='text-xs text-muted-foreground'>Morning pickup</dt>
              <dd>
                {pass.pickup
                  ? `${pass.pickup.name}${pass.pickup.time ? ` · ${pass.pickup.time}` : ''}`
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className='text-xs text-muted-foreground'>Evening drop</dt>
              <dd>
                {pass.drop
                  ? `${pass.drop.name}${pass.drop.time ? ` · ${pass.drop.time}` : ''}`
                  : '—'}
              </dd>
            </div>
            <div className='col-span-2'>
              <dt className='text-xs text-muted-foreground'>Valid</dt>
              <dd>
                {formatDate(pass.valid_from)} to {formatDate(pass.valid_until)}
              </dd>
            </div>
          </dl>
          {pass.state === 'on_hold' && (
            <p className='rounded-lg bg-destructive/10 p-2 text-sm text-destructive'>
              {pass.hold_kind === 'fee'
                ? 'On hold: bus fee pending.'
                : `On hold${pass.hold_note ? `: ${pass.hold_note}` : '.'}`}
            </p>
          )}
        </div>
        <div className='flex flex-wrap items-end gap-2'>
          <Button variant='outline' onClick={() => printBusPass(pass, school)}>
            <Printer />
            Print
          </Button>
          {canManage && pass.state !== 'on_hold' && (
            <Button variant='outline' onClick={onRestrict}>
              <Ban />
              Restrict
            </Button>
          )}
          {canManage && pass.state === 'on_hold' && (
            <Button variant='outline' onClick={onActivate}>
              <PlayCircle />
              Activate
            </Button>
          )}
        </div>
        {canManage && (
          <form
            className='flex flex-wrap items-end gap-2'
            onSubmit={async (event) => {
              event.preventDefault()
              try {
                await save.mutateAsync(until)
                alerts.success('Pass end date saved')
                onClose()
              } catch (error) {
                alerts.error(toApiError(error).message)
              }
            }}
          >
            <FormField id='pass-end' label='Change the end date' className='min-w-48 flex-1'>
              <Input
                id='pass-end'
                type='date'
                value={until}
                onChange={(event) => setUntil(event.target.value)}
              />
            </FormField>
            <Button
              type='submit'
              variant='outline'
              loading={save.isPending}
              disabled={until === pass.valid_until}
            >
              Save date
            </Button>
          </form>
        )}
      </div>
    </AppModal>
  )
}
