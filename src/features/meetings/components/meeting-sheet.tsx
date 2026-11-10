import { useState, type ReactNode } from 'react'
import { ArrowRight, GraduationCap, PhoneOff, Video } from 'lucide-react'
import { Avatar } from '@/components/common/avatar'
import { ErrorState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime, formatTime } from '@/lib/format'
import { useMeeting, type MeetingPerson } from '../api'
import {
  durationLabel,
  END_REASON,
  isLive,
  LEAVE_REASON,
  MEETING_RESPONSE,
  MEETING_STATUS,
  PARTY_LABEL,
} from '../labels'

export function MeetingSheet({
  meetingId,
  onClose,
}: {
  meetingId: number | null
  onClose: () => void
}) {
  const [shownId, setShownId] = useState(meetingId)
  if (meetingId && meetingId !== shownId) setShownId(meetingId)
  const meeting = useMeeting(shownId)
  const data = meeting.data

  return (
    <Sheet open={Boolean(meetingId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent aria-describedby={undefined}>
        {meeting.isError && !data ? (
          <ErrorState message={meeting.error.message} onRetry={() => meeting.refetch()} />
        ) : !data ? (
          <div className='grid gap-4 p-6'>
            <Skeleton className='h-16' />
            <Skeleton className='h-48' />
          </div>
        ) : (
          <>
            <SheetHeader>
              <div className='flex items-center gap-3'>
                <span className='grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary'>
                  <Video className='size-5' />
                </span>
                <div className='grid min-w-0 gap-0.5'>
                  <SheetTitle className='truncate'>{data.title}</SheetTitle>
                  <SheetDescription>
                    {formatDateTime(data.scheduled_at)} · {durationLabel(data.duration_minutes)}
                  </SheetDescription>
                  <div className='mt-1 flex flex-wrap gap-1.5'>
                    <Badge tone={MEETING_STATUS[data.status].tone} dot pulse={isLive(data.status)}>
                      {MEETING_STATUS[data.status].label}
                    </Badge>
                    <Badge tone='neutral'>
                      Booked by the {PARTY_LABEL[data.scheduled_by].toLowerCase()}
                    </Badge>
                    {data.status === 'scheduled' && (
                      <Badge
                        tone={MEETING_RESPONSE[data.response].tone}
                        title={data.response_note ?? undefined}
                      >
                        {data.to.label} · {MEETING_RESPONSE[data.response].label}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </SheetHeader>
            <SheetBody className='grid content-start gap-6'>
              <Block title='From and to'>
                <div className='grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr]'>
                  <PersonCard person={data.from} caption='Booked by' />
                  <ArrowRight
                    className='mx-auto size-4 rotate-90 text-muted-foreground sm:rotate-0'
                    aria-hidden
                  />
                  <PersonCard person={data.to} caption='Booked with' />
                </div>
              </Block>

              <Block title='About'>
                <div className='flex items-center gap-3 rounded-lg border p-3'>
                  <span className='grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary'>
                    <GraduationCap className='size-4' />
                  </span>
                  <span className='grid min-w-0'>
                    <span className='truncate font-semibold'>{data.student.name}</span>
                    <span className='text-xs text-muted-foreground'>
                      Class {data.student.class_section ?? 'not placed'}
                    </span>
                  </span>
                </div>
                {data.agenda && (
                  <p className='rounded-lg border bg-muted/40 p-3 text-sm'>{data.agenda}</p>
                )}
              </Block>

              <Block title='Timing'>
                <dl className='grid gap-x-6 gap-y-3 rounded-lg border p-3 sm:grid-cols-2'>
                  {[
                    ['Starts', formatDateTime(data.scheduled_at)],
                    [
                      'Scheduled end',
                      `${formatDateTime(data.ends_at)}${data.extended_minutes ? ` (extended ${data.extended_minutes} min)` : ''}`,
                    ],
                    [
                      'Join opens',
                      data.join_closes_at
                        ? `${formatTime(data.join_opens_at)} to ${formatTime(data.join_closes_at)}`
                        : `${formatTime(data.join_opens_at)}, until the host ends it`,
                    ],
                    ['Actual length', durationLabel(data.call_minutes)],
                    ['Started', formatDateTime(data.started_at)],
                    [
                      'Ended',
                      data.ended_at
                        ? `${formatDateTime(data.ended_at)}${data.end_reason ? ` · ${END_REASON[data.end_reason]}` : ''}`
                        : '—',
                    ],
                    ['Extended by', data.extended_by?.name ?? '—'],
                    ['Academic year', data.academic_year.name],
                  ].map(([label, value]) => (
                    <div key={label} className='grid gap-0.5'>
                      <dt className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
                        {label}
                      </dt>
                      <dd className='text-sm font-semibold break-words'>{value}</dd>
                    </div>
                  ))}
                </dl>
              </Block>

              {data.status === 'cancelled' && (
                <Block title='Cancelled'>
                  <p className='rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-sm'>
                    By {data.cancelled_by?.name ?? 'someone'}
                    {data.cancel_reason ? `: ${data.cancel_reason}` : '. No reason given.'}
                  </p>
                </Block>
              )}

              <Block title='Call log'>
                {data.call_log.length === 0 ? (
                  <p className='flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground'>
                    <PhoneOff className='size-4' />
                    Nobody has joined this call.
                  </p>
                ) : (
                  <ul className='grid gap-2'>
                    {data.call_log.map((entry, index) => (
                      <li
                        key={`${entry.user.id}-${entry.joined_at}-${index}`}
                        className='flex items-center gap-3 rounded-lg border p-3'
                      >
                        <Avatar name={entry.user.name} size='sm' />
                        <span className='grid min-w-0 flex-1'>
                          <span className='truncate font-semibold'>{entry.user.name}</span>
                          <span className='text-xs text-muted-foreground'>
                            {PARTY_LABEL[entry.party]} · {entry.platform}
                            {entry.source === 'agora' ? ' · seen by Agora' : ''}
                            {entry.leave_reason
                              ? ` · ${LEAVE_REASON[entry.leave_reason] ?? entry.leave_reason}`
                              : ''}
                          </span>
                        </span>
                        <span className='tabular text-right text-xs text-muted-foreground'>
                          {formatTime(entry.joined_at)} to{' '}
                          {entry.left_at ? formatTime(entry.left_at) : 'still in'}
                          <br />
                          {durationLabel(entry.minutes)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Block>

              <p className='flex items-center gap-2 text-xs text-muted-foreground'>
                <Video className='size-4' />
                Teachers and parents book and join video calls in the mobile app.
              </p>
            </SheetBody>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function PersonCard({ person, caption }: { person: MeetingPerson; caption: string }) {
  return (
    <div className='flex min-w-0 items-center gap-3 rounded-lg border p-3'>
      <Avatar name={person.name} size='sm' />
      <span className='grid min-w-0'>
        <span className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
          {caption}
        </span>
        <span className='truncate font-semibold'>{person.name}</span>
        <span className='truncate text-xs text-muted-foreground capitalize'>
          {person.role === 'parent' && person.label ? person.label : PARTY_LABEL[person.role]}
        </span>
      </span>
    </div>
  )
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className='grid gap-3'>
      <h3 className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>{title}</h3>
      {children}
    </section>
  )
}
