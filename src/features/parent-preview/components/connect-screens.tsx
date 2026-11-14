import { useState } from 'react'
import {
  BookOpenCheck,
  CalendarClock,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  EyeOff,
  Lock,
  Megaphone,
  MessagesSquare,
  Paperclip,
  SendHorizontal,
  ShieldCheck,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { Avatar } from '@/components/common/avatar'
import { Badge } from '@/components/ui/badge'
import type { DiaryEntry, DiaryStatus, DiaryType } from '@/features/diary/api'
import { DIARY_STATUS, DIARY_TYPE } from '@/features/diary/labels'
import type { ChatThread } from '@/features/chat/api'
import type { Meeting } from '@/features/meetings/api'
import { durationLabel, END_REASON, isLive, MEETING_STATUS } from '@/features/meetings/labels'
import type { UploadedFile } from '@/lib/files'
import { formatDate, formatDateTime, formatTime, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  usePreviewList,
  usePreviewMessages,
  type AppParty,
  type DiaryFeedItem,
  type MyAnnouncement,
  type PreviewMessage,
} from '../connect-api'
import { AppCard, QueryView, ScreenEmpty } from './phone-parts'

export interface ConnectTile<T extends string> {
  id: T
  icon: LucideIcon
  label: string
  count: number | undefined
  hint: string
}

export function ConnectTiles<T extends string>({
  tiles,
  onOpen,
}: {
  tiles: ConnectTile<T>[]
  onOpen: (id: T) => void
}) {
  return (
    <div className='grid grid-cols-2 gap-2'>
      {tiles.map((tile) => (
        <button
          key={tile.id}
          type='button'
          onClick={() => onOpen(tile.id)}
          aria-label={`${tile.label}${tile.count ? `, ${tile.count} new` : ''}`}
          className='flex min-h-16 min-w-0 items-center gap-3 rounded-2xl border bg-card p-3 text-left shadow-xs hover:bg-muted/50'
        >
          <span className='relative grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary'>
            <tile.icon className='size-5' />
            {!!tile.count && (
              <span className='tabular absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground'>
                {tile.count > 9 ? '9+' : tile.count}
              </span>
            )}
          </span>
          <span className='grid min-w-0'>
            <span className='truncate text-sm font-bold'>{tile.label}</span>
            <span className='truncate text-[11px] text-muted-foreground'>{tile.hint}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

function Chips<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div role='group' aria-label={label} className='-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1'>
      {options.map((option) => (
        <button
          key={option.value}
          type='button'
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            'h-9 shrink-0 rounded-full border px-3.5 text-xs font-semibold',
            option.value === value
              ? 'border-primary bg-primary text-primary-foreground'
              : 'bg-card hover:bg-muted'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function Files({ files }: { files: UploadedFile[] }) {
  if (!files.length) return null
  return (
    <div className='flex flex-wrap gap-1.5'>
      {files.map((file) => (
        <a
          key={file.id}
          href={file.url}
          target='_blank'
          rel='noreferrer'
          className='inline-flex max-w-full items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold hover:bg-muted/70'
        >
          <Paperclip className='size-3 shrink-0' />
          <span className='truncate'>{file.name}</span>
        </a>
      ))}
    </div>
  )
}

function YearNote() {
  return (
    <p className='px-1 text-center text-[11px] text-muted-foreground'>
      Only this academic year is shown.
    </p>
  )
}

type TypeFilter = 'all' | DiaryType
const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'homework', label: 'Homework' },
  { value: 'remark', label: 'Remarks' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'note', label: 'Notes' },
]

type StatusFilter = 'all' | DiaryStatus
const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending_review', label: 'Waiting' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Sent back' },
  { value: 'hidden', label: 'Hidden' },
]

export function DiaryScreen({ base, party }: { base: string; party: AppParty }) {
  return party === 'parent' ? <ParentDiary base={base} /> : <TeacherDiary base={base} />
}

function ParentDiary({ base }: { base: string }) {
  const [type, setType] = useState<TypeFilter>('all')
  const query = usePreviewList<DiaryFeedItem>(base, 'diary', {
    page: 1,
    limit: 30,
    type: type === 'all' ? undefined : type,
  })
  return (
    <div className='grid gap-3'>
      <Chips label='Homework type' value={type} options={TYPE_FILTERS} onChange={setType} />
      <QueryView query={query}>
        {(page) =>
          page.items.length ? (
            <>
              {page.items.map((item) => (
                <AppCard key={item.id} className='grid gap-2'>
                  <div className='flex items-center justify-between gap-2'>
                    <Badge tone={DIARY_TYPE[item.type].tone}>{DIARY_TYPE[item.type].label}</Badge>
                    {item.seen ? (
                      <span className='inline-flex items-center gap-1 text-[11px] text-muted-foreground'>
                        <CheckCheck className='size-3.5' /> Seen
                      </span>
                    ) : (
                      <Badge tone='info' dot>
                        New
                      </Badge>
                    )}
                  </div>
                  <div className='grid gap-0.5'>
                    <span className='text-base leading-snug font-extrabold'>{item.title}</span>
                    <span className='text-xs text-muted-foreground'>
                      {[item.subject?.name, item.teacher.name].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                  <p className='line-clamp-4 text-sm whitespace-pre-line'>{item.body}</p>
                  <Files files={item.attachments} />
                  <div className='flex items-center justify-between gap-2 text-[11px] text-muted-foreground'>
                    <span>{timeAgo(item.published_at)}</span>
                    {item.due_date && (
                      <span className='inline-flex items-center gap-1 font-semibold text-warning'>
                        <CalendarClock className='size-3.5' /> Due {formatDate(item.due_date)}
                      </span>
                    )}
                  </div>
                </AppCard>
              ))}
              <YearNote />
            </>
          ) : (
            <ScreenEmpty
              icon={BookOpenCheck}
              title='No homework yet'
              description='Homework, remarks and notes from teachers show here.'
            />
          )
        }
      </QueryView>
    </div>
  )
}

function TeacherDiary({ base }: { base: string }) {
  const [status, setStatus] = useState<StatusFilter>('all')
  const query = usePreviewList<DiaryEntry>(base, 'diary', {
    page: 1,
    limit: 30,
    status: status === 'all' ? undefined : status,
  })
  return (
    <div className='grid gap-3'>
      <Chips label='Post status' value={status} options={STATUS_FILTERS} onChange={setStatus} />
      <QueryView query={query}>
        {(page) =>
          page.items.length ? (
            <>
              {page.items.map((entry) => (
                <AppCard key={entry.id} className='grid gap-2'>
                  <div className='flex flex-wrap items-center gap-1.5'>
                    <Badge tone={DIARY_TYPE[entry.type].tone}>{DIARY_TYPE[entry.type].label}</Badge>
                    <Badge tone={DIARY_STATUS[entry.status].tone}>
                      {DIARY_STATUS[entry.status].label}
                    </Badge>
                  </div>
                  <div className='grid gap-0.5'>
                    <span className='text-base leading-snug font-extrabold'>{entry.title}</span>
                    <span className='text-xs text-muted-foreground'>
                      {[entry.target_label, entry.subject?.name].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                  <p className='line-clamp-3 text-sm whitespace-pre-line'>{entry.body}</p>
                  {entry.status === 'rejected' && entry.review.note && (
                    <p className='rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive'>
                      Sent back: {entry.review.note}
                    </p>
                  )}
                  <Files files={entry.attachments} />
                  <div className='flex items-center justify-between gap-2 text-[11px] text-muted-foreground'>
                    <span>{timeAgo(entry.created_at)}</span>
                    {entry.status === 'published' && (
                      <span className='tabular font-semibold'>
                        Seen by {entry.seen_count} of {entry.recipient_count}
                      </span>
                    )}
                    {entry.due_date && <span>Due {formatDate(entry.due_date)}</span>}
                  </div>
                </AppCard>
              ))}
              <YearNote />
            </>
          ) : (
            <ScreenEmpty
              icon={BookOpenCheck}
              title='No homework posts'
              description='Homework and remarks this teacher writes show here.'
            />
          )
        }
      </QueryView>
    </div>
  )
}

type Scope = 'upcoming' | 'past'
const SCOPES: { value: Scope; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
]

function meetingWith(meeting: Meeting, party: AppParty) {
  if (party === 'parent') {
    return [meeting.teacher.name, meeting.teacher.label].filter(Boolean).join(' · ')
  }
  return `${meeting.parent.name} · ${meeting.student.name}${meeting.student.class_section ? ` (${meeting.student.class_section})` : ''}`
}

function JoinRow({ meeting }: { meeting: Meeting }) {
  if (meeting.status === 'cancelled') {
    return meeting.cancel_reason ? (
      <p className='rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground'>
        Cancelled{meeting.cancelled_by ? ` by ${meeting.cancelled_by.name}` : ''}:{' '}
        {meeting.cancel_reason}
      </p>
    ) : null
  }
  if (meeting.status === 'completed') {
    return (
      <p className='text-xs text-muted-foreground'>
        Call lasted {durationLabel(meeting.call_minutes)}
        {meeting.end_reason ? ` · ${END_REASON[meeting.end_reason]}` : ''}
      </p>
    )
  }
  if (meeting.status === 'missed') {
    return <p className='text-xs text-muted-foreground'>Nobody joined this meeting.</p>
  }
  return (
    <div className='grid gap-1'>
      <button
        type='button'
        disabled
        title='Calls happen in the mobile app'
        className={cn(
          'inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-bold',
          meeting.can_join || isLive(meeting.status)
            ? 'bg-success text-white opacity-80'
            : 'bg-muted text-muted-foreground'
        )}
      >
        <Video className='size-4' />
        {isLive(meeting.status) ? 'Join the call' : 'Join'}
      </button>
      <span className='text-center text-[11px] text-muted-foreground'>
        {meeting.can_join || isLive(meeting.status)
          ? 'Open now in the app. The preview never joins a call.'
          : `Join opens at ${formatTime(meeting.join_opens_at)}, ${formatDate(meeting.join_opens_at)}`}
      </span>
    </div>
  )
}

export function MeetingsScreen({ base, party }: { base: string; party: AppParty }) {
  const [scope, setScope] = useState<Scope>('upcoming')
  const query = usePreviewList<Meeting>(base, 'meetings', { page: 1, limit: 30, scope })
  return (
    <div className='grid gap-3'>
      <Chips label='Meetings' value={scope} options={SCOPES} onChange={setScope} />
      <QueryView query={query}>
        {(page) =>
          page.items.length ? (
            <>
              {page.items.map((meeting) => (
                <AppCard key={meeting.id} className='grid gap-2.5'>
                  <div className='flex items-start justify-between gap-2'>
                    <span className='min-w-0 text-base leading-snug font-extrabold'>
                      {meeting.title}
                    </span>
                    <Badge tone={MEETING_STATUS[meeting.status].tone} dot={isLive(meeting.status)}>
                      {MEETING_STATUS[meeting.status].label}
                    </Badge>
                  </div>
                  <div className='grid gap-1 text-xs text-muted-foreground'>
                    <span className='truncate'>With {meetingWith(meeting, party)}</span>
                    <span className='inline-flex items-center gap-1'>
                      <Clock className='size-3.5 shrink-0' />
                      {formatDateTime(meeting.scheduled_at)} ·{' '}
                      {durationLabel(meeting.duration_minutes + meeting.extended_minutes)}
                      {meeting.extended_minutes > 0 && ` (+${meeting.extended_minutes} min)`}
                    </span>
                    <span>
                      {meeting.scheduled_by === party
                        ? 'You booked this'
                        : `Booked by ${meeting.from.name}`}
                    </span>
                  </div>
                  {meeting.agenda && (
                    <p className='line-clamp-2 text-sm whitespace-pre-line'>{meeting.agenda}</p>
                  )}
                  <JoinRow meeting={meeting} />
                </AppCard>
              ))}
              <YearNote />
            </>
          ) : (
            <ScreenEmpty
              icon={Video}
              title={scope === 'upcoming' ? 'No upcoming meetings' : 'No past meetings'}
              description={
                party === 'parent'
                  ? 'Video meetings with teachers show here.'
                  : 'Video meetings with parents show here.'
              }
            />
          )
        }
      </QueryView>
    </div>
  )
}

export function ChatScreen({ base, party }: { base: string; party: AppParty }) {
  const [open, setOpen] = useState<ChatThread | null>(null)
  const query = usePreviewList<ChatThread>(base, 'chat', { page: 1, limit: 50 })
  if (open)
    return <ThreadView base={base} party={party} thread={open} onBack={() => setOpen(null)} />
  return (
    <QueryView query={query}>
      {(page) => {
        const hours = page.items[0]?.office_hours
        return page.items.length ? (
          <div className='grid gap-2'>
            {hours && (
              <p
                className={cn(
                  'flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium',
                  hours.open_now ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                )}
              >
                <Clock className='size-3.5 shrink-0' />
                {hours.open_now
                  ? `Chat hours ${hours.start}–${hours.end}`
                  : party === 'parent'
                    ? `Outside chat hours (${hours.start}–${hours.end}). Messages reach the teacher when hours start.`
                    : `Outside chat hours (${hours.start}–${hours.end}). Parents’ messages reach you when hours start.`}
              </p>
            )}
            {page.items.map((thread) => (
              <button
                key={thread.id}
                type='button'
                onClick={() => setOpen(thread)}
                className='flex min-w-0 items-center gap-3 rounded-2xl border bg-card p-3 text-left shadow-xs hover:bg-muted/50'
              >
                <Avatar
                  name={thread.is_group ? (thread.title || 'Group') : (thread.other?.name ?? '')}
                  src={thread.is_group ? null : thread.other?.photo_url}
                  className='size-11 shrink-0'
                />
                <span className='grid min-w-0 flex-1 gap-0.5'>
                  <span className='flex items-center justify-between gap-2'>
                    <span className='truncate text-sm font-bold'>{thread.is_group ? (thread.title || 'Group chat') : (thread.other?.name ?? '—')}</span>
                    <span className='shrink-0 text-[11px] text-muted-foreground'>
                      {thread.last_message_at ? timeAgo(thread.last_message_at) : ''}
                    </span>
                  </span>
                  <span className='truncate text-[11px] text-muted-foreground'>
                    {thread.is_group
                      ? `${thread.member_count ?? 0} members`
                      : party === 'parent'
                        ? (thread.other?.label ?? 'Teacher')
                        : `${thread.student?.name ?? '—'}${thread.class_section ? ` · ${thread.class_section}` : ''}`}
                  </span>
                  <span className='flex items-center justify-between gap-2'>
                    <span className='truncate text-xs'>
                      {thread.last_message_preview ?? 'No messages yet'}
                    </span>
                    {thread.unread > 0 && (
                      <span className='tabular grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground'>
                        {thread.unread}
                      </span>
                    )}
                  </span>
                </span>
                <ChevronRight className='size-4 shrink-0 text-muted-foreground' />
              </button>
            ))}
            <YearNote />
          </div>
        ) : (
          <ScreenEmpty
            icon={MessagesSquare}
            title='No conversations'
            description={
              party === 'parent'
                ? 'Chats with the class and subject teachers show here.'
                : 'Chats with parents show here.'
            }
          />
        )
      }}
    </QueryView>
  )
}

function Bubble({ message, mine }: { message: PreviewMessage; mine: boolean }) {
  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'grid max-w-[82%] gap-1 rounded-2xl px-3 py-2 text-sm',
          mine ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md border bg-card'
        )}
      >
        {message.hidden ? (
          <span className='inline-flex items-center gap-1.5 italic opacity-80'>
            <EyeOff className='size-3.5' /> Hidden by the school
          </span>
        ) : (
          <>
            {message.body && (
              <span className='break-words whitespace-pre-line'>{message.body}</span>
            )}
            {message.file && (
              <a
                href={message.file.url}
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center gap-1 text-xs font-semibold underline'
              >
                <Paperclip className='size-3' /> {message.file.name}
              </a>
            )}
          </>
        )}
        <span
          className={cn(
            'flex items-center justify-end gap-1 text-[10px]',
            mine ? 'text-primary-foreground/80' : 'text-muted-foreground'
          )}
        >
          {message.held_for_office_hours && 'Held for chat hours · '}
          {formatTime(message.sent_at)}
          {mine &&
            (message.read_at ? <CheckCheck className='size-3' /> : <Check className='size-3' />)}
        </span>
      </div>
    </div>
  )
}

function ThreadView({
  base,
  party,
  thread,
  onBack,
}: {
  base: string
  party: AppParty
  thread: ChatThread
  onBack: () => void
}) {
  const query = usePreviewMessages(base, thread.id)
  return (
    <div className='grid gap-3'>
      <button
        type='button'
        onClick={onBack}
        className='flex items-center gap-3 rounded-2xl border bg-card p-3 text-left shadow-xs hover:bg-muted/50'
      >
        <Avatar
          name={thread.is_group ? (thread.title || 'Group') : (thread.other?.name ?? '')}
          src={thread.is_group ? null : thread.other?.photo_url}
          className='size-10 shrink-0'
        />
        <span className='grid min-w-0 flex-1'>
          <span className='truncate text-sm font-bold'>{thread.is_group ? (thread.title || 'Group chat') : (thread.other?.name ?? '—')}</span>
          <span className='truncate text-[11px] text-muted-foreground'>
            {thread.is_group
              ? `${thread.member_count ?? 0} members`
              : `About ${thread.student?.name ?? '—'}${thread.class_section ? ` · ${thread.class_section}` : ''}`}
          </span>
        </span>
        <span className='text-xs font-semibold text-primary'>All chats</span>
      </button>
      <p className='flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-[11px] text-muted-foreground'>
        <ShieldCheck className='size-3.5 shrink-0' />
        Opening a conversation here is recorded in the chat access log under your name.
      </p>
      <QueryView query={query}>
        {(page) =>
          page.items.length ? (
            <div className='grid gap-2'>
              {page.has_more && (
                <p className='text-center text-[11px] text-muted-foreground'>
                  Showing the latest {page.items.length} messages
                </p>
              )}
              {[...page.items].reverse().map((message) => (
                <Bubble key={message.id} message={message} mine={message.sender_party === party} />
              ))}
            </div>
          ) : (
            <ScreenEmpty icon={MessagesSquare} title='No messages yet' />
          )
        }
      </QueryView>
      <div className='flex items-center gap-2 rounded-full border bg-muted/60 py-1.5 pr-1.5 pl-4 text-sm text-muted-foreground'>
        <Lock className='size-3.5 shrink-0' />
        <span className='flex-1 truncate'>Read-only preview</span>
        <span className='grid size-9 place-items-center rounded-full bg-muted'>
          <SendHorizontal className='size-4' />
        </span>
      </div>
    </div>
  )
}

export function NewsScreen({ base }: { base: string }) {
  const [unread, setUnread] = useState<'all' | 'unread'>('all')
  const query = usePreviewList<MyAnnouncement>(base, 'announcements', {
    page: 1,
    limit: 30,
    unread: unread === 'unread' ? true : undefined,
  })
  return (
    <div className='grid gap-3'>
      <Chips
        label='Announcements'
        value={unread}
        options={[
          { value: 'all', label: 'All' },
          { value: 'unread', label: 'Unread' },
        ]}
        onChange={setUnread}
      />
      <QueryView query={query}>
        {(page) =>
          page.items.length ? (
            <>
              {page.items.map((item) => (
                <AppCard
                  key={item.id}
                  className={cn(
                    'grid gap-2',
                    item.priority === 'urgent' && 'border-destructive/40'
                  )}
                >
                  <div className='flex items-center justify-between gap-2'>
                    {item.priority === 'urgent' ? (
                      <Badge tone='danger'>Urgent</Badge>
                    ) : (
                      <span className='text-[11px] font-semibold text-muted-foreground'>
                        {item.school.name}
                      </span>
                    )}
                    {item.is_read ? (
                      <span className='text-[11px] text-muted-foreground'>Read</span>
                    ) : (
                      <Badge tone='info' dot>
                        New
                      </Badge>
                    )}
                  </div>
                  <span className='text-base leading-snug font-extrabold'>{item.title}</span>
                  <p className='line-clamp-5 text-sm whitespace-pre-line'>{item.body}</p>
                  <Files files={item.attachments} />
                  <span className='text-[11px] text-muted-foreground'>
                    {timeAgo(item.published_at)}
                    {item.expires_at ? ` · until ${formatDate(item.expires_at)}` : ''}
                  </span>
                </AppCard>
              ))}
              <YearNote />
            </>
          ) : (
            <ScreenEmpty
              icon={Megaphone}
              title={unread === 'unread' ? 'All caught up' : 'No announcements'}
              description='Notices from the school show here.'
            />
          )
        }
      </QueryView>
    </div>
  )
}
