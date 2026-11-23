import { useState } from 'react'
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  MessageSquare,
  Paperclip,
  Send,
  Shield,
  User,
  UserCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { formatDate, timeAgo } from '@/lib/format'
import {
  grievancesApi,
  useGrievance,
  useGrievanceAction,
  type GrievanceDetail,
} from '../api'
import {
  COMPLAINANT_TYPE,
  formatSlaCountdown,
  GRIEVANCE_CATEGORY,
} from '../labels'
import { AssignHandlerModal } from './assign-handler-modal'
import { EscalateDialog } from './escalate-dialog'
import { GrievancePriorityBadge, GrievanceStatusBadge } from './grievance-status-badge'
import { ResolveModal } from './resolve-modal'

interface GrievanceSheetProps {
  id: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: () => void
}

export function GrievanceSheet({
  id,
  open,
  onOpenChange,
  onUpdated,
}: GrievanceSheetProps) {
  const { data: grievance, isLoading, refetch } = useGrievance(id)
  const [activeTab, setActiveTab] = useState<'timeline' | 'internal'>('timeline')
  const [internalNote, setInternalNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  const [assignOpen, setAssignOpen] = useState(false)
  const [resolveOpen, setResolveOpen] = useState(false)
  const [escalateOpen, setEscalateOpen] = useState(false)

  const statusAction = useGrievanceAction((input: { id: number; status: GrievanceDetail['status'] }) =>
    grievancesApi.status(input.id, { status: input.status })
  )

  const noteAction = useGrievanceAction((input: { id: number; note: string }) =>
    grievancesApi.addNote(input.id, { note: input.note, is_internal: true })
  )

  const handleStatusChange = async (nextStatus: GrievanceDetail['status']) => {
    if (!id) return
    try {
      await statusAction.mutateAsync({ id, status: nextStatus })
      alerts.success(`Status updated to ${nextStatus.replace('_', ' ')}`)
      void refetch()
      onUpdated?.()
    } catch (err: unknown) {
      alerts.error((err as Error)?.message ?? 'Failed to update status')
    }
  }

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !internalNote.trim()) return
    setAddingNote(true)
    try {
      await noteAction.mutateAsync({ id, note: internalNote.trim() })
      setInternalNote('')
      alerts.success('Internal note added')
      void refetch()
    } catch (err: unknown) {
      alerts.error((err as Error)?.message ?? 'Failed to add internal note')
    } finally {
      setAddingNote(false)
    }
  }

  const sla = grievance
    ? formatSlaCountdown(grievance.sla_due_at, grievance.status)
    : { text: '', tone: 'neutral' as const, breached: false }

  const categoryInfo = grievance ? GRIEVANCE_CATEGORY[grievance.category] : null
  const CategoryIcon = categoryInfo?.icon ?? AlertCircle

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className='flex w-full flex-col p-0 sm:max-w-xl md:max-w-2xl overflow-y-auto'>
          {isLoading || !grievance ? (
            <div className='grid gap-4 p-6'>
              <Skeleton className='h-8 w-48' />
              <Skeleton className='h-24 w-full' />
              <Skeleton className='h-64 w-full' />
            </div>
          ) : (
            <div className='flex flex-col gap-6 p-6'>
              <SheetHeader className='gap-2 text-left'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <div className='flex items-center gap-2'>
                    <span className='font-mono text-base font-bold text-primary'>
                      {grievance.ticket_no}
                    </span>
                    <GrievanceStatusBadge
                      status={grievance.status}
                      priority={grievance.priority}
                      isSlaBreached={grievance.is_sla_breached}
                    />
                    <GrievancePriorityBadge priority={grievance.priority} />
                  </div>

                  <Badge tone={sla.tone} dot={sla.breached}>
                    <Clock className='mr-1 size-3' />
                    {sla.text}
                  </Badge>
                </div>

                <SheetTitle className='text-lg font-bold'>{grievance.subject}</SheetTitle>
                <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                  <span>Logged {formatDate(grievance.created_at)}</span>
                  <span>•</span>
                  <span>{timeAgo(grievance.created_at)}</span>
                </div>
              </SheetHeader>

              <div className='flex flex-wrap items-center gap-2 border-y py-3'>
                {grievance.status === 'submitted' && (
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => handleStatusChange('acknowledged')}
                  >
                    <CheckCircle2 className='size-4' />
                    Acknowledge
                  </Button>
                )}

                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setAssignOpen(true)}
                >
                  <UserCheck className='size-4' />
                  {grievance.assigned_to ? 'Reassign officer' : 'Assign officer'}
                </Button>

                {grievance.status === 'in_progress' && (
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => handleStatusChange('action_taken')}
                  >
                    <CheckCircle2 className='size-4' />
                    Mark action taken
                  </Button>
                )}

                {grievance.status !== 'resolved' && grievance.status !== 'closed' && (
                  <Button
                    size='sm'
                    onClick={() => setResolveOpen(true)}
                  >
                    <CheckCircle2 className='size-4' />
                    Resolve ticket
                  </Button>
                )}

                {grievance.status !== 'escalated' &&
                  grievance.status !== 'resolved' &&
                  grievance.status !== 'closed' && (
                    <Button
                      size='sm'
                      variant='destructive'
                      onClick={() => setEscalateOpen(true)}
                    >
                      <ArrowUpRight className='size-4' />
                      Escalate
                    </Button>
                  )}
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <Card className='p-4'>
                  <div className='flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                    <User className='size-4' />
                    Complainant Details
                  </div>
                  <div className='mt-2 grid gap-1'>
                    {grievance.is_anonymous ? (
                      <div className='flex items-center gap-2'>
                        <Shield className='size-4 text-warning' />
                        <span className='font-bold text-sm'>Anonymous Complainant</span>
                      </div>
                    ) : (
                      <>
                        <span className='font-bold text-sm'>
                          {grievance.complainant_name ?? 'School Guardian'}
                        </span>
                        {grievance.complainant_mobile && (
                          <span className='text-xs font-mono text-muted-foreground'>
                            {grievance.complainant_mobile}
                          </span>
                        )}
                        <Badge
                          tone={COMPLAINANT_TYPE[grievance.complainant_type]?.tone ?? 'neutral'}
                          className='w-fit mt-1'
                        >
                          {COMPLAINANT_TYPE[grievance.complainant_type]?.label ?? grievance.complainant_type}
                        </Badge>
                      </>
                    )}
                  </div>
                </Card>

                <Card className='p-4'>
                  <div className='flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                    <CategoryIcon className='size-4' />
                    Category & Assigned Officer
                  </div>
                  <div className='mt-2 grid gap-1'>
                    <span className='font-bold text-sm'>
                      {categoryInfo?.label ?? grievance.category}
                    </span>
                    {grievance.subcategory && (
                      <span className='text-xs text-muted-foreground'>
                        Subcategory: {grievance.subcategory}
                      </span>
                    )}
                    <div className='mt-1 text-xs'>
                      <span className='text-muted-foreground'>Assigned to: </span>
                      <span className='font-medium'>
                        {grievance.assigned_to?.name ?? 'Unassigned'}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>

              {grievance.student_name && (
                <Card className='p-3 bg-muted/10'>
                  <div className='text-xs font-semibold text-muted-foreground'>
                    Linked Student
                  </div>
                  <div className='flex items-center gap-2 mt-1'>
                    <span className='font-bold text-sm'>{grievance.student_name}</span>
                    {grievance.student_admission_no && (
                      <span className='font-mono text-xs text-muted-foreground'>
                        ({grievance.student_admission_no})
                      </span>
                    )}
                    {grievance.class_section && (
                      <Badge tone='neutral' className='text-xs'>
                        {grievance.class_section}
                      </Badge>
                    )}
                  </div>
                </Card>
              )}

              <Card className='p-4'>
                <div className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                  Incident Description
                </div>
                <p className='mt-2 text-sm leading-relaxed whitespace-pre-wrap text-foreground'>
                  {grievance.description}
                </p>

                {grievance.attachments && grievance.attachments.length > 0 && (
                  <div className='mt-4 border-t pt-3'>
                    <span className='text-xs font-semibold text-muted-foreground flex items-center gap-1.5'>
                      <Paperclip className='size-3.5' />
                      Attachments ({grievance.attachments.length})
                    </span>
                    <div className='mt-2 grid gap-2'>
                      {grievance.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={att.file_url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='flex items-center justify-between rounded border p-2 text-xs hover:bg-muted/30 transition'
                        >
                          <div className='flex items-center gap-2 truncate'>
                            <FileText className='size-4 text-primary shrink-0' />
                            <span className='truncate font-medium'>{att.file_name}</span>
                          </div>
                          <Download className='size-3.5 text-muted-foreground shrink-0' />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {grievance.resolution_summary && (
                <Card className='border-success/30 bg-success/5 p-4'>
                  <div className='flex items-center gap-1.5 text-xs font-semibold text-success uppercase tracking-wider'>
                    <CheckCircle2 className='size-4' />
                    Official Resolution Summary
                  </div>
                  <p className='mt-2 text-sm leading-relaxed whitespace-pre-wrap'>
                    {grievance.resolution_summary}
                  </p>
                  {grievance.resolved_at && (
                    <span className='mt-2 block text-xs text-muted-foreground'>
                      Resolved on {formatDate(grievance.resolved_at)}
                    </span>
                  )}
                </Card>
              )}

              <div className='grid gap-3'>
                <div className='flex border-b text-sm font-semibold'>
                  <button
                    type='button'
                    onClick={() => setActiveTab('timeline')}
                    className={`pb-2 px-3 border-b-2 transition ${
                      activeTab === 'timeline'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Public Timeline ({grievance.timeline?.length ?? 0})
                  </button>
                  <button
                    type='button'
                    onClick={() => setActiveTab('internal')}
                    className={`pb-2 px-3 border-b-2 transition flex items-center gap-1.5 ${
                      activeTab === 'internal'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Shield className='size-3.5' />
                    Internal Notes ({grievance.internal_notes?.length ?? 0})
                  </button>
                </div>

                {activeTab === 'timeline' ? (
                  <div className='grid gap-3 py-2'>
                    {(!grievance.timeline || grievance.timeline.length === 0) && (
                      <p className='text-xs text-muted-foreground py-4 text-center'>
                        No timeline events recorded yet.
                      </p>
                    )}
                    {grievance.timeline?.map((item) => (
                      <div key={item.id} className='relative flex gap-3 pb-3 border-l-2 pl-4 ml-2'>
                        <div className='absolute -left-[9px] top-0 size-4 rounded-full bg-primary/20 border-2 border-primary' />
                        <div className='grid gap-1 flex-1'>
                          <div className='flex items-center justify-between gap-2 text-xs'>
                            <span className='font-semibold'>{item.action}</span>
                            <span className='text-muted-foreground'>
                              {timeAgo(item.created_at)}
                            </span>
                          </div>
                          <p className='text-xs text-foreground/90'>{item.message}</p>
                          {item.actor_name && (
                            <span className='text-[11px] text-muted-foreground'>
                              by {item.actor_name}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='grid gap-4 py-2'>
                    <form onSubmit={handleAddInternalNote} className='grid gap-2'>
                      <div className='flex gap-2'>
                        <Input
                          value={internalNote}
                          onChange={(e) => setInternalNote(e.target.value)}
                          placeholder='Add private staff note or investigation finding...'
                          disabled={addingNote}
                        />
                        <Button
                          type='submit'
                          size='sm'
                          disabled={addingNote || !internalNote.trim()}
                        >
                          <Send className='size-3.5' />
                          {addingNote ? 'Saving...' : 'Add Note'}
                        </Button>
                      </div>
                      <span className='text-[11px] text-muted-foreground'>
                        Internal notes are strictly confidential and visible only to school staff.
                      </span>
                    </form>

                    <div className='grid gap-2'>
                      {(!grievance.internal_notes || grievance.internal_notes.length === 0) && (
                        <p className='text-xs text-muted-foreground py-4 text-center'>
                          No private internal notes yet.
                        </p>
                      )}
                      {grievance.internal_notes?.map((note) => (
                        <Card key={note.id} className='p-3 bg-muted/20 border-dashed'>
                          <div className='flex items-center justify-between text-xs text-muted-foreground'>
                            <span className='font-semibold text-foreground flex items-center gap-1.5'>
                              <MessageSquare className='size-3' />
                              {note.actor_name ?? 'Staff member'}
                            </span>
                            <span>{timeAgo(note.created_at)}</span>
                          </div>
                          <p className='mt-1 text-xs text-foreground whitespace-pre-wrap'>
                            {note.message}
                          </p>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AssignHandlerModal
        grievance={grievance ?? null}
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onSuccess={() => {
          void refetch()
          onUpdated?.()
        }}
      />

      <ResolveModal
        grievance={grievance ?? null}
        open={resolveOpen}
        onOpenChange={setResolveOpen}
        onSuccess={() => {
          void refetch()
          onUpdated?.()
        }}
      />

      <EscalateDialog
        grievance={grievance ?? null}
        open={escalateOpen}
        onOpenChange={setEscalateOpen}
        onSuccess={() => {
          void refetch()
          onUpdated?.()
        }}
      />
    </>
  )
}
