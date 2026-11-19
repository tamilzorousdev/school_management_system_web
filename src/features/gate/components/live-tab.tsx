import { useState, type ReactNode } from 'react'
import {
  CalendarClock,
  Check,
  ChevronRight,
  Clock,
  Hand,
  Hourglass,
  LogOut,
  ShieldAlert,
  Siren,
  UsersRound,
  X,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Avatar } from '@/components/common/avatar'
import { ErrorState } from '@/components/common/display'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  gateApi,
  useGateMutation,
  useGateToday,
  useMyVisitors,
  type GateEvent,
  type GatePass,
  type Visit,
} from '../api'
import { runAction, useDetail } from '../helpers'
import { TONE_DOT, VISIT_PURPOSE, clock, eventTone, photoSrc, timeWindow } from '../labels'
import type { GateTabProps } from '../search'
import { DecisionDialog } from './decision-dialog'
import { GateDetail } from './gate-detail'
import {
  ListSkeleton,
  MethodBadge,
  PassBadges,
  PersonCell,
  Quiet,
  Section,
  StudentCell,
  VisitBadges,
  VisitStatusBadge,
} from './shared'

type PassDecision = { pass: GatePass; approve: boolean }
type VisitDecision = { visit: Visit; allow: boolean; mine: boolean }

export function LiveTab({ canManage, canApprove, goTo }: GateTabProps) {
  const board = useGateToday()
  const mine = useMyVisitors()
  const detail = useDetail()
  const [passDecision, setPassDecision] = useState<PassDecision | null>(null)
  const [visitDecision, setVisitDecision] = useState<VisitDecision | null>(null)
  const [leaving, setLeaving] = useState<Visit | null>(null)
  const decidePass = useGateMutation(
    ({ id, approve, note }: { id: number; approve: boolean; note: string }) =>
      gateApi.decidePass(id, approve, note)
  )
  const decideVisit = useGateMutation(
    ({ visit, allow, note, own }: { visit: Visit; allow: boolean; note: string; own: boolean }) =>
      own
        ? gateApi.decideMyVisitor(visit.id, allow, note)
        : gateApi.decideVisit(visit.id, allow, note)
  )
  const checkOut = useGateMutation((id: number) => gateApi.checkOut(id))

  const data = board.data
  const counts = data?.counts
  const day = data?.date
  const range = day ? { from: day, to: day } : {}

  const cards: Insight[] = [
    {
      key: 'waiting',
      label: 'Waiting at the gate',
      value: counts?.waiting_release ?? 0,
      hint: 'Approved, not left yet',
      icon: Clock,
      tone: 'info',
      onClick: () => goTo('passes', { status: 'approved', ...range }),
    },
    {
      key: 'released',
      label: 'Released today',
      value: counts?.released_today ?? 0,
      hint: 'Left with their pickup',
      icon: LogOut,
      tone: 'success',
      onClick: () => goTo('passes', { status: 'released', ...range }),
    },
    {
      key: 'pending',
      label: 'Waiting for approval',
      value: counts?.pending_approvals ?? 0,
      hint: 'Any date',
      icon: Hourglass,
      tone: 'warning',
      onClick: () => goTo('passes', { status: 'pending' }),
    },
    {
      key: 'emergencies',
      label: 'Emergencies waiting',
      value: counts?.emergencies_waiting ?? 0,
      hint: 'Someone is at the gate',
      icon: Siren,
      tone: counts?.emergencies_waiting ? 'danger' : 'neutral',
      onClick: () => goTo('passes', { status: 'pending', emergency: true }),
    },
    {
      key: 'manual',
      label: 'Released by hand today',
      value: counts?.manual_today ?? 0,
      hint: 'No QR or code, ID checked',
      icon: Hand,
      tone: 'warning',
      onClick: () => goTo('passes', { method: 'manual', ...range }),
    },
    {
      key: 'inside',
      label: 'Visitors inside',
      value: counts?.visitors_inside ?? 0,
      hint: counts?.overstays ? `${counts.overstays} stayed too long` : 'In the campus now',
      icon: UsersRound,
      tone: counts?.overstays ? 'warning' : 'primary',
      onClick: () => goTo('visitors', { visit_status: 'inside' }),
    },
    {
      key: 'expected',
      label: 'Expected today',
      value: counts?.visitors_expected ?? 0,
      hint: counts?.visitors_waiting
        ? `${counts.visitors_waiting} waiting at the gate`
        : 'Invited visitors',
      icon: CalendarClock,
      tone: 'info',
      onClick: () => goTo('visitors', { visit_status: 'expected', ...range }),
    },
    {
      key: 'blocked',
      label: 'Blocked people today',
      value: counts?.blocked_today ?? 0,
      hint: 'Came to the gate',
      icon: ShieldAlert,
      tone: counts?.blocked_today ? 'danger' : 'neutral',
      onClick: () => goTo('log', { kind: 'blocked_person', ...range }),
    },
  ]

  if (board.isError)
    return <ErrorState message={board.error.message} onRetry={() => board.refetch()} />

  const myVisitors = mine.data ?? []

  return (
    <>
      <InsightCards items={cards} loading={board.isPending} />
      <p className='-mt-2 text-xs text-muted-foreground' aria-live='polite'>
        {board.dataUpdatedAt
          ? `Updated ${formatTime(board.dataUpdatedAt)} · refreshes every 20 seconds`
          : 'Loading the gate…'}
      </p>
      {myVisitors.length > 0 && (
        <Section title='Visitors to meet you' count={myVisitors.length}>
          <ul className='grid divide-y'>
            {myVisitors.map((visit) => (
              <VisitRow
                key={visit.id}
                visit={visit}
                onOpen={() => detail.show({ kind: 'visit', id: visit.id })}
                actions={
                  visit.status === 'waiting' && (
                    <AnswerButtons
                      onYes={() => setVisitDecision({ visit, allow: true, mine: true })}
                      onNo={() => setVisitDecision({ visit, allow: false, mine: true })}
                      yes='Allow'
                      no='Decline'
                      name={visit.name}
                    />
                  )
                }
              />
            ))}
          </ul>
        </Section>
      )}
      <div className='grid items-start gap-4 lg:grid-cols-2'>
        <Section
          title='Emergencies waiting'
          count={data?.emergencies.length ?? 0}
          tone={data?.emergencies.length ? 'danger' : undefined}
        >
          {board.isPending ? (
            <ListSkeleton />
          ) : !data?.emergencies.length ? (
            <Quiet>No emergency requests waiting.</Quiet>
          ) : (
            <ul className='grid divide-y'>
              {data.emergencies.map((pass) => (
                <EmergencyRow
                  key={pass.id}
                  pass={pass}
                  canApprove={canApprove}
                  onOpen={() => detail.show({ kind: 'pass', id: pass.id })}
                  onDecide={(approve) => setPassDecision({ pass, approve })}
                />
              ))}
            </ul>
          )}
        </Section>
        <Section
          title='Passes due today'
          count={data?.due.length ?? 0}
          action={
            <button
              type='button'
              onClick={() => goTo('passes', range)}
              className='text-xs font-semibold text-primary hover:underline'
            >
              All passes today
            </button>
          }
        >
          {board.isPending ? (
            <ListSkeleton />
          ) : !data?.due.length ? (
            <Quiet>No approved passes waiting for today.</Quiet>
          ) : (
            <ul className='grid divide-y'>
              {data.due.map((pass) => (
                <li key={pass.id}>
                  <button
                    type='button'
                    onClick={() => detail.show({ kind: 'pass', id: pass.id })}
                    className='flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-left outline-none hover:bg-muted/50 focus-visible:bg-accent/60'
                  >
                    <span className='min-w-0 flex-1 basis-48'>
                      <StudentCell student={pass.student} />
                    </span>
                    <span className='min-w-0 flex-1 basis-40'>
                      <PersonCell person={pass.pickup} size='sm' />
                    </span>
                    <span className='grid shrink-0 text-right'>
                      <span className='tabular text-sm font-semibold'>
                        {pass.from_time} – {pass.until_time}
                      </span>
                      <span className='font-mono text-xs text-muted-foreground'>
                        {pass.pass_no}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section
          title='Visitors inside now'
          count={data?.inside.length ?? 0}
          action={
            <button
              type='button'
              onClick={() => goTo('visitors', { visit_status: 'inside' })}
              className='text-xs font-semibold text-primary hover:underline'
            >
              Visitor log
            </button>
          }
        >
          {board.isPending ? (
            <ListSkeleton />
          ) : !data?.inside.length ? (
            <Quiet>No visitors inside.</Quiet>
          ) : (
            <ul className='grid divide-y'>
              {data.inside.map((visit) => (
                <VisitRow
                  key={visit.id}
                  visit={visit}
                  onOpen={() => detail.show({ kind: 'visit', id: visit.id })}
                  actions={
                    canManage && (
                      <Button
                        variant='outline'
                        size='sm'
                        aria-label={`Check out ${visit.name}`}
                        onClick={() => setLeaving(visit)}
                      >
                        <LogOut />
                        Check out
                      </Button>
                    )
                  }
                />
              ))}
            </ul>
          )}
        </Section>
        <Section title='Coming today' count={data?.coming.length ?? 0}>
          {board.isPending ? (
            <ListSkeleton />
          ) : !data?.coming.length ? (
            <Quiet>No visitors waiting or expected.</Quiet>
          ) : (
            <ul className='grid divide-y'>
              {data.coming.map((visit) => (
                <VisitRow
                  key={visit.id}
                  visit={visit}
                  onOpen={() => detail.show({ kind: 'visit', id: visit.id })}
                  actions={
                    canManage &&
                    visit.status === 'waiting' && (
                      <AnswerButtons
                        onYes={() => setVisitDecision({ visit, allow: true, mine: false })}
                        onNo={() => setVisitDecision({ visit, allow: false, mine: false })}
                        yes='Allow'
                        no='Decline'
                        name={visit.name}
                      />
                    )
                  }
                />
              ))}
            </ul>
          )}
        </Section>
      </div>
      <Section
        title='Recent activity'
        action={
          <button
            type='button'
            onClick={() => goTo('log')}
            className='text-xs font-semibold text-primary hover:underline'
          >
            Full gate log
          </button>
        }
      >
        {board.isPending ? (
          <ListSkeleton />
        ) : !data?.recent.length ? (
          <Quiet>Nothing has happened at the gate yet today.</Quiet>
        ) : (
          <ul className='grid divide-y'>
            {data.recent.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                onOpen={
                  event.pass_id
                    ? () => detail.show({ kind: 'pass', id: event.pass_id! })
                    : event.visit_id
                      ? () => detail.show({ kind: 'visit', id: event.visit_id! })
                      : undefined
                }
              />
            ))}
          </ul>
        )}
      </Section>
      <GateDetail
        target={detail.target}
        open={detail.open}
        onOpenChange={detail.setOpen}
        canManage={canManage}
        canApprove={canApprove}
      />
      <DecisionDialog
        open={passDecision !== null}
        onOpenChange={(next) => !next && setPassDecision(null)}
        yes={passDecision?.approve ?? true}
        title={
          passDecision?.approve ? 'Approve this emergency pickup?' : 'Refuse this emergency pickup?'
        }
        description={
          passDecision
            ? `${passDecision.pass.student.name} with ${passDecision.pass.pickup.name}: ${passDecision.pass.reason}`
            : ''
        }
        confirmText={passDecision?.approve ? 'Approve' : 'Refuse'}
        successText={
          passDecision?.approve ? 'Emergency pickup approved' : 'Emergency pickup refused'
        }
        onDecide={(note) =>
          decidePass.mutateAsync({
            id: passDecision!.pass.id,
            approve: passDecision!.approve,
            note,
          })
        }
      />
      <DecisionDialog
        open={visitDecision !== null}
        onOpenChange={(next) => !next && setVisitDecision(null)}
        yes={visitDecision?.allow ?? true}
        title={visitDecision?.allow ? 'Let this visitor in?' : 'Decline this visitor?'}
        description={
          visitDecision
            ? `${visitDecision.visit.name} · ${VISIT_PURPOSE[visitDecision.visit.purpose]}`
            : ''
        }
        confirmText={visitDecision?.allow ? 'Allow' : 'Decline'}
        successText={visitDecision?.allow ? 'Visitor allowed' : 'Visitor declined'}
        onDecide={(note) =>
          decideVisit.mutateAsync({
            visit: visitDecision!.visit,
            allow: visitDecision!.allow,
            note,
            own: visitDecision!.mine,
          })
        }
      />
      <ConfirmDialog
        open={leaving !== null}
        onOpenChange={(next) => !next && setLeaving(null)}
        title='Check this visitor out?'
        description={
          leaving
            ? `${leaving.name} is marked as left now. Use this when they left without the gate checking them out.`
            : ''
        }
        confirmText='Check out'
        loading={checkOut.isPending}
        onConfirm={async () => {
          if (!leaving) return
          if (await runAction(() => checkOut.mutateAsync(leaving.id), 'Visitor checked out'))
            setLeaving(null)
        }}
      />
    </>
  )
}

function AnswerButtons({
  onYes,
  onNo,
  yes,
  no,
  name,
  yesDisabled,
  yesTitle,
}: {
  onYes: () => void
  onNo: () => void
  yes: string
  no: string
  name: string
  yesDisabled?: boolean
  yesTitle?: string
}) {
  return (
    <span className='flex shrink-0 gap-2'>
      <Button
        size='sm'
        onClick={onYes}
        disabled={yesDisabled}
        title={yesTitle}
        aria-label={`${yes}: ${name}`}
      >
        <Check />
        {yes}
      </Button>
      <Button size='sm' variant='destructive' onClick={onNo} aria-label={`${no}: ${name}`}>
        <X />
        {no}
      </Button>
    </span>
  )
}

function EmergencyRow({
  pass,
  canApprove,
  onOpen,
  onDecide,
}: {
  pass: GatePass
  canApprove: boolean
  onOpen: () => void
  onDecide: (approve: boolean) => void
}) {
  const waitingConsent = pass.needs_consent && pass.consent_status === 'waiting'
  return (
    <li className='grid gap-2.5 px-4 py-3'>
      <div className='flex flex-wrap items-start justify-between gap-2'>
        <StudentCell student={pass.student} />
        <span className='tabular text-xs text-muted-foreground'>
          Asked at {clock(pass.created_at)}
        </span>
      </div>
      <div className='flex min-w-0 flex-wrap items-center gap-2 text-sm'>
        <span className='text-xs text-muted-foreground'>At the gate:</span>
        <PersonCell person={pass.pickup} size='sm' />
      </div>
      <p className='text-sm break-words'>{pass.reason}</p>
      <PassBadges pass={pass} />
      {waitingConsent && (
        <p className='rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs font-medium text-warning'>
          Parent must agree first. This person is not registered, so the parent has to agree in the
          app before you can approve.
        </p>
      )}
      <div className='flex flex-wrap items-center gap-2'>
        {canApprove && (
          <AnswerButtons
            onYes={() => onDecide(true)}
            onNo={() => onDecide(false)}
            yes='Approve'
            no='Refuse'
            name={pass.student.name}
            yesDisabled={waitingConsent}
            yesTitle={waitingConsent ? 'The parent must agree first' : undefined}
          />
        )}
        <Button size='sm' variant='ghost' onClick={onOpen}>
          Details
          <ChevronRight />
        </Button>
      </div>
    </li>
  )
}

function VisitRow({
  visit,
  onOpen,
  actions,
}: {
  visit: Visit
  onOpen: () => void
  actions?: ReactNode
}) {
  const when =
    visit.status === 'inside'
      ? `In since ${clock(visit.checked_in_at)}`
      : visit.expected_from || visit.expected_until
        ? `Expected ${timeWindow(visit.expected_from, visit.expected_until)}`
        : `Came at ${clock(visit.created_at)}`
  return (
    <li className='flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3'>
      <button
        type='button'
        onClick={onOpen}
        className='flex min-w-0 flex-1 basis-56 items-center gap-2.5 rounded-md text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40'
      >
        <Avatar name={visit.name} src={photoSrc(visit.photo)} />
        <span className='grid min-w-0 gap-0.5'>
          <span className='flex flex-wrap items-center gap-1.5'>
            <span className='truncate font-semibold'>{visit.name}</span>
            {visit.status !== 'inside' && <VisitStatusBadge visit={visit} />}
            <VisitBadges visit={visit} />
          </span>
          <span className='truncate text-xs text-muted-foreground'>
            {[VISIT_PURPOSE[visit.purpose], visit.host ? `to meet ${visit.host.name}` : null, when]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </span>
      </button>
      {actions}
    </li>
  )
}

function EventRow({ event, onOpen }: { event: GateEvent; onOpen?: () => void }) {
  const body = (
    <>
      <span className='tabular w-11 shrink-0 pt-0.5 text-xs font-semibold text-muted-foreground'>
        {clock(event.at)}
      </span>
      <span
        className={cn('mt-1.5 size-2 shrink-0 rounded-full', TONE_DOT[eventTone(event.kind)])}
      />
      <span className='grid min-w-0 flex-1 gap-0.5'>
        <span className='flex flex-wrap items-center gap-1.5'>
          <span className='text-sm font-semibold'>{event.label}</span>
          <MethodBadge method={event.method} />
        </span>
        {event.note && (
          <span className='text-xs break-words text-muted-foreground'>{event.note}</span>
        )}
        {event.actor && (
          <span className='text-xs text-muted-foreground'>By {event.actor.name}</span>
        )}
      </span>
    </>
  )
  return (
    <li>
      {onOpen ? (
        <button
          type='button'
          onClick={onOpen}
          className='flex w-full items-start gap-3 px-4 py-2.5 text-left outline-none hover:bg-muted/50 focus-visible:bg-accent/60'
        >
          {body}
        </button>
      ) : (
        <div className='flex items-start gap-3 px-4 py-2.5'>{body}</div>
      )}
    </li>
  )
}
