import { useState, type ReactNode } from 'react'
import {
  CheckCheck,
  Clock,
  Eye,
  EyeOff,
  Flag,
  MessagesSquare,
  Paperclip,
  ShieldCheck,
} from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDateTime, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { chatApi, useChatAction, useChatThread, type AuditMessage } from '../api'

const AUDIT_ACTION: Record<string, string> = {
  viewed_thread: 'opened the conversation',
  hid_message: 'hid a message',
  unhid_message: 'showed a message again',
  dismissed_flag: 'closed a report',
}

export function ChatThreadSheet({
  threadId,
  onClose,
}: {
  threadId: number | null
  onClose: () => void
}) {
  const [shownId, setShownId] = useState(threadId)
  if (threadId && threadId !== shownId) setShownId(threadId)
  const thread = useChatThread(shownId)
  const data = thread.data
  const [hiding, setHiding] = useState<AuditMessage | null>(null)
  const unhide = useChatAction((id: number) => chatApi.unhide(id))
  const dismiss = useChatAction((id: number) => chatApi.dismiss(id))

  const run = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action()
      alerts.success(message)
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  return (
    <Sheet open={Boolean(threadId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent aria-describedby={undefined}>
        {thread.isError && !data ? (
          <ErrorState message={thread.error.message} onRetry={() => thread.refetch()} />
        ) : !data ? (
          <div className='grid gap-4 p-6'>
            <Skeleton className='h-16' />
            <Skeleton className='h-64' />
          </div>
        ) : (
          <>
            <SheetHeader>
              <div className='flex items-center gap-3'>
                <span className='grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary'>
                  <MessagesSquare className='size-5' />
                </span>
                <div className='grid min-w-0 gap-0.5'>
                  <SheetTitle className='break-words'>
                    {data.teacher.name} ↔ {data.parent.name}
                  </SheetTitle>
                  <SheetDescription>
                    About {data.student.name}
                    {data.class_section ? ` · ${data.class_section}` : ''} · {data.parent.label}
                  </SheetDescription>
                  <div className='mt-1 flex flex-wrap gap-1.5'>
                    <Badge tone='neutral'>{data.message_count} messages</Badge>
                    {data.open_flags > 0 && (
                      <Badge tone='danger' dot>
                        {data.open_flags} reported
                      </Badge>
                    )}
                    <Badge tone='info'>
                      Office hours {data.office_hours.start}–{data.office_hours.end}
                    </Badge>
                  </div>
                </div>
              </div>
            </SheetHeader>
            <SheetBody className='grid content-start gap-6'>
              <p className='flex items-center gap-2 rounded-lg border border-info/25 bg-info/10 p-3 text-xs text-info'>
                <ShieldCheck className='size-4 shrink-0' />
                Opening this conversation is recorded. Hidden text is shown here for the office
                only.
              </p>

              <Block title='Conversation'>
                <ol className='grid gap-2'>
                  {data.messages.map((message) => {
                    const fromTeacher = message.sender_party === 'teacher'
                    return (
                      <li
                        key={message.id}
                        className={cn(
                          'grid max-w-[85%] gap-1 rounded-lg border p-3 text-sm',
                          fromTeacher
                            ? 'justify-self-start bg-card'
                            : 'justify-self-end bg-primary/5',
                          message.flagged && 'border-destructive/40',
                          message.hidden && 'opacity-70'
                        )}
                      >
                        <span className='flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground'>
                          <span className='font-semibold text-foreground'>
                            {message.sender.name}
                          </span>
                          <span className='tabular'>{formatDateTime(message.sent_at)}</span>
                          {message.read_at && (
                            <span
                              className='inline-flex items-center gap-0.5 text-success'
                              title={`Read ${formatDateTime(message.read_at)}`}
                            >
                              <CheckCheck className='size-3' />
                              read
                            </span>
                          )}
                          {message.held_for_office_hours && (
                            <span className='inline-flex items-center gap-0.5 text-warning'>
                              <Clock className='size-3' />
                              waiting for office hours
                            </span>
                          )}
                        </span>
                        {message.original_body && (
                          <span
                            className={cn(
                              'break-words whitespace-pre-line',
                              message.hidden && 'line-through'
                            )}
                          >
                            {message.original_body}
                          </span>
                        )}
                        {message.file && (
                          <a
                            href={message.file.url}
                            target='_blank'
                            rel='noreferrer'
                            className='inline-flex items-center gap-1.5 text-primary hover:underline'
                          >
                            <Paperclip className='size-3.5' />
                            {message.file.name}
                          </a>
                        )}
                        {message.flagged && (
                          <span className='rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive'>
                            <Flag className='mr-1 inline size-3' />
                            Reported by {message.flagged_by?.name}: {message.flag_reason}
                          </span>
                        )}
                        {message.hidden && (
                          <span className='rounded-md bg-muted px-2 py-1 text-xs'>
                            Hidden by {message.hidden_by?.name}: {message.hidden_reason}
                          </span>
                        )}
                        {!data.archived && (
                          <span className='flex flex-wrap gap-1.5'>
                            {message.hidden ? (
                              <Button
                                size='sm'
                                variant='ghost'
                                loading={unhide.isPending && unhide.variables === message.id}
                                onClick={() =>
                                  run(() => unhide.mutateAsync(message.id), 'Message shown again')
                                }
                              >
                                <Eye />
                                Show again
                              </Button>
                            ) : (
                              <Button size='sm' variant='ghost' onClick={() => setHiding(message)}>
                                <EyeOff />
                                Hide
                              </Button>
                            )}
                            {message.flagged && !message.hidden && (
                              <Button
                                size='sm'
                                variant='ghost'
                                loading={dismiss.isPending && dismiss.variables === message.id}
                                onClick={() =>
                                  run(() => dismiss.mutateAsync(message.id), 'Report closed')
                                }
                              >
                                Close report
                              </Button>
                            )}
                          </span>
                        )}
                      </li>
                    )
                  })}
                  {data.messages.length === 0 && (
                    <li className='rounded-lg border border-dashed p-3 text-sm text-muted-foreground'>
                      No messages yet.
                    </li>
                  )}
                </ol>
              </Block>

              <Block title='Office access'>
                <ul className='grid gap-1.5 text-sm'>
                  {data.audit.map((entry, index) => (
                    <li
                      key={`${entry.at}-${index}`}
                      className='flex flex-wrap justify-between gap-2 rounded-md border px-3 py-2'
                    >
                      <span>
                        <span className='font-semibold'>{entry.actor.name}</span>{' '}
                        {AUDIT_ACTION[entry.action] ?? entry.action}
                        {entry.note ? ` · ${entry.note}` : ''}
                      </span>
                      <span className='tabular text-xs text-muted-foreground'>
                        {formatDateTime(entry.at)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Block>
            </SheetBody>
            {hiding && (
              <HideModal message={hiding} onOpenChange={(open) => !open && setHiding(null)} />
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function HideModal({
  message,
  onOpenChange,
}: {
  message: AuditMessage
  onOpenChange: (open: boolean) => void
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const hide = useChatAction((text: string) => chatApi.hide(message.id, text))
  return (
    <AppModal
      open
      onOpenChange={onOpenChange}
      title='Hide this message'
      description={`Sent by ${message.sender.name} at ${formatTime(message.sent_at)}. Both people will see that the school removed it.`}
      formId='chat-hide-form'
      submitText='Hide message'
      loading={hide.isPending}
    >
      <form
        id='chat-hide-form'
        noValidate
        className='grid gap-3'
        onSubmit={async (event) => {
          event.preventDefault()
          if (!reason.trim()) return setError('Give a reason for hiding it')
          try {
            await hide.mutateAsync(reason.trim())
            alerts.success('Message hidden')
            onOpenChange(false)
          } catch (caught) {
            const apiError = toApiError(caught)
            setError(apiError.fieldErrors[0]?.message ?? apiError.message)
          }
        }}
      >
        <FormField id='chat-hide-reason' label='Reason' required error={error}>
          <Textarea
            id='chat-hide-reason'
            value={reason}
            maxLength={255}
            placeholder='For example: not appropriate for school communication'
            onChange={(event) => {
              setReason(event.target.value)
              setError('')
            }}
          />
        </FormField>
      </form>
    </AppModal>
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
