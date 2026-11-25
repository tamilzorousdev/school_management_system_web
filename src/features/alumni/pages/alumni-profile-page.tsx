import { useState } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronDown,
  ClipboardCheck,
  ExternalLink,
  Link2,
  Pencil,
  Trash2,
  UserRoundCheck,
  UserRoundX,
} from 'lucide-react'
import { Avatar } from '@/components/common/avatar'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { ErrorState } from '@/components/common/display'
import { Page } from '@/components/common/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { Block, Facts } from '@/features/students/components/student-parts'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate, formatDateTime } from '@/lib/format'
import {
  useAlumnus,
  useDeleteAlumnus,
  useIssueUpdateLink,
  useSetAlumniStatus,
  type AlumniDetail,
  type UpdateLink,
} from '../api'
import { AcademicHistoryEditor } from '../components/academic-history-editor'
import { AlumniFormModal } from '../components/alumni-form-modal'
import { UpdateLinkDialog } from '../components/update-link-dialog'
import {
  ALUMNI_SOURCE,
  ALUMNI_STATUS,
  classLabel,
  EXIT_TYPE,
  fieldLabel,
  fieldValue,
  FINAL_RESULT,
  GENDER,
  HISTORY_RESULT,
  OCCUPATION,
  TIMELINE_ACTION,
} from '../labels'

const route = getRouteApi('/_app/alumni/$id')

type Modal = 'edit' | 'history' | 'status' | 'delete' | null

export function AlumniProfilePage() {
  const { id: rawId } = route.useParams()
  const id = Number(rawId)
  const navigate = useNavigate()
  const me = useMe().data
  const canManage = can(me, 'alumni.manage')
  const canSeeStudents = can(me, 'students.view')
  const alumnus = useAlumnus(id)
  const setStatus = useSetAlumniStatus(id)
  const remove = useDeleteAlumnus()
  const issueLink = useIssueUpdateLink()
  const [modal, setModal] = useState<Modal>(null)
  const [link, setLink] = useState<UpdateLink | null>(null)
  const data = alumnus.data

  if (alumnus.isError && !data) {
    return (
      <Page>
        <ErrorState message={alumnus.error.message} onRetry={() => alumnus.refetch()} />
      </Page>
    )
  }
  if (!data) {
    return (
      <Page>
        <Skeleton className='h-36' />
        <div className='grid gap-6 lg:grid-cols-2'>
          <Skeleton className='h-64' />
          <Skeleton className='h-64' />
        </div>
      </Page>
    )
  }

  const active = data.status === 'active'

  const createLink = async () => {
    try {
      setLink(await issueLink.mutateAsync(data.id))
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  return (
    <Page>
      <Link
        to='/alumni'
        search={{ page: 1 }}
        className='inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground'
      >
        <ArrowLeft className='size-4' />
        Alumni
      </Link>

      <Card className='overflow-hidden'>
        <div className='h-16 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent sm:h-20' />
        <div className='-mt-10 grid gap-4 px-4 pb-4 sm:-mt-12 sm:px-6 sm:pb-5 lg:flex lg:items-end lg:justify-between'>
          <div className='flex min-w-0 items-end gap-4'>
            <Avatar
              name={data.full_name}
              src={data.photo_url}
              size='lg'
              previewable
              subtitle={data.alumni_no}
              className='size-20 border-4 border-card text-xl shadow-sm sm:size-24'
            />
            <div className='grid min-w-0 gap-1 pb-1'>
              <h1 className='truncate text-xl font-extrabold tracking-tight sm:text-2xl'>
                {data.full_name}
              </h1>
              <div className='flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground'>
                <span className='font-mono text-xs'>{data.alumni_no}</span>
                <span>·</span>
                <span>Batch {data.batch_year}</span>
                {data.final_class_name && (
                  <span>· {classLabel(data.final_class_name, data.final_section_name)}</span>
                )}
              </div>
              <div className='flex flex-wrap gap-1.5'>
                <Badge tone={ALUMNI_STATUS[data.status].tone} dot>
                  {ALUMNI_STATUS[data.status].label}
                </Badge>
                <Badge tone={ALUMNI_SOURCE[data.source].tone}>
                  {ALUMNI_SOURCE[data.source].label}
                </Badge>
                <Badge tone={EXIT_TYPE[data.exit_type].tone}>
                  {EXIT_TYPE[data.exit_type].label}
                </Badge>
              </div>
            </div>
          </div>
          {canManage && (
            <div className='flex flex-wrap gap-2'>
              <Button variant='outline' onClick={() => setModal('edit')}>
                <Pencil />
                Edit
              </Button>
              <Button
                variant='outline'
                loading={issueLink.isPending}
                onClick={() => void createLink()}
              >
                <Link2 />
                Update link
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline'>
                    More
                    <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => setModal('status')}>
                    {active ? <UserRoundX /> : <UserRoundCheck />}
                    {active ? 'Mark do not contact' : 'Mark active'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setModal('history')}>
                    <BookOpen />
                    Edit academic history
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive onSelect={() => setModal('delete')}>
                    <Trash2 />
                    Delete record
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </Card>

      {data.pending_submissions > 0 && (
        <Card className='flex flex-wrap items-center justify-between gap-3 border-warning/40 bg-warning/5 p-4'>
          <div className='flex items-center gap-3'>
            <span className='grid size-10 shrink-0 place-items-center rounded-lg bg-warning/15 text-warning'>
              <ClipboardCheck className='size-5' />
            </span>
            <div className='grid'>
              <span className='font-semibold'>
                {data.pending_submissions === 1
                  ? 'A change sent by this person is waiting for review'
                  : `${data.pending_submissions} changes sent by this person are waiting for review`}
              </span>
              <span className='text-sm text-muted-foreground'>
                Their details here stay the same until you approve.
              </span>
            </div>
          </div>
          <Button variant='outline' asChild>
            <Link
              to='/alumni'
              search={{ page: 1, tab: 'submissions', submission_status: 'pending' }}
            >
              Review
              <ArrowRight />
            </Link>
          </Button>
        </Card>
      )}

      <div className='grid gap-6 lg:grid-cols-2'>
        <Card className='grid content-start gap-6 p-4 sm:p-5'>
          <Block title='Contact'>
            <Facts
              items={[
                ['Mobile', data.mobile ? `+91 ${data.mobile}` : '—'],
                ['Alternate mobile', data.alt_mobile ? `+91 ${data.alt_mobile}` : '—'],
                ['Email', data.email ?? '—'],
                [
                  'LinkedIn',
                  data.linkedin_url ? (
                    <a
                      href={data.linkedin_url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center gap-1 text-primary hover:underline'
                    >
                      Open profile
                      <ExternalLink className='size-3.5' />
                    </a>
                  ) : (
                    '—'
                  ),
                ],
                [
                  'Address',
                  [data.address_line, data.city, data.state, data.pincode, data.country]
                    .filter(Boolean)
                    .join(', ') || '—',
                ],
                [
                  'Agrees to be contacted',
                  data.contact_consent
                    ? data.reachable
                      ? 'Yes'
                      : 'Yes, but no mobile or email'
                    : 'No',
                ],
              ]}
            />
          </Block>
          <Block title='After school'>
            <Facts
              items={[
                ['Now', OCCUPATION[data.occupation_status]],
                ['Institution', data.institution ?? '—'],
                ['Course', data.course ?? '—'],
                ['Organisation', data.organization ?? '—'],
                ['Designation', data.designation ?? '—'],
                [
                  'Details last updated',
                  data.profile_updated_at ? formatDateTime(data.profile_updated_at) : '—',
                ],
              ]}
            />
          </Block>
          <Block title='Personal'>
            <Facts
              items={[
                ['Gender', data.gender ? GENDER[data.gender] : '—'],
                ['Date of birth', formatDate(data.dob)],
                ['Admission no', data.admission_no ?? '—'],
                ['EMIS number', data.emis_number ?? '—'],
                ['Admitted on', formatDate(data.admission_date)],
              ]}
            />
          </Block>
        </Card>

        <Card className='grid content-start gap-6 p-4 sm:p-5'>
          <Block
            title='Leaving school'
            action={
              data.student_id &&
              canSeeStudents && (
                <Button variant='outline' size='sm' asChild>
                  <Link
                    to='/students/$studentId'
                    params={{ studentId: String(data.student_id) }}
                    search={{ tab: 'profile' }}
                  >
                    Student record
                    <ArrowRight />
                  </Link>
                </Button>
              )
            }
          >
            <Facts
              items={[
                ['Left on', formatDate(data.left_on)],
                ['How they left', EXIT_TYPE[data.exit_type].label],
                ['Final year', data.final_academic_year_name ?? '—'],
                ['Final class', classLabel(data.final_class_name, data.final_section_name)],
                ['Final %', data.final_percent === null ? '—' : `${data.final_percent}%`],
                ['Grade', data.final_grade ?? '—'],
                [
                  'Result',
                  data.final_result ? (
                    <Badge tone={FINAL_RESULT[data.final_result].tone}>
                      {FINAL_RESULT[data.final_result].label}
                    </Badge>
                  ) : (
                    '—'
                  ),
                ],
                ['TC number', data.tc_no ?? '—'],
              ]}
            />
          </Block>
          <AcademicHistory
            alumnus={data}
            canManage={canManage}
            onEdit={() => setModal('history')}
          />
          <Block title='Staff notes'>
            <p className='rounded-lg border p-3 text-sm whitespace-pre-wrap'>
              {data.notes ?? <span className='text-muted-foreground'>No notes.</span>}
            </p>
          </Block>
        </Card>
      </div>

      <Card className='grid content-start gap-3 p-4 sm:p-5'>
        <Block title='Change history'>
          <Timeline alumnus={data} />
        </Block>
      </Card>

      <AlumniFormModal
        open={modal === 'edit'}
        onOpenChange={(open) => !open && setModal(null)}
        alumnus={data}
      />
      <AcademicHistoryEditor
        open={modal === 'history'}
        onOpenChange={(open) => !open && setModal(null)}
        alumniId={data.id}
        rows={data.academic_history}
      />
      <UpdateLinkDialog
        link={link}
        name={data.full_name}
        onOpenChange={(open) => !open && setLink(null)}
      />
      <ConfirmDialog
        open={modal === 'status'}
        onOpenChange={(open) => !open && setModal(null)}
        title={active ? `Stop contacting ${data.full_name}?` : `Mark ${data.full_name} active?`}
        description={
          active
            ? 'They are left out of the reachable count and alumni messages. The record stays.'
            : 'They count as reachable again if they agreed to be contacted.'
        }
        confirmText={active ? 'Mark do not contact' : 'Mark active'}
        loading={setStatus.isPending}
        onConfirm={async () => {
          await setStatus.mutateAsync({ status: active ? 'inactive' : 'active' })
          alerts.success(active ? 'Marked do not contact' : 'Marked active')
          setModal(null)
        }}
      />
      <ConfirmDialog
        open={modal === 'delete'}
        onOpenChange={(open) => !open && setModal(null)}
        title={`Delete ${data.full_name}'s alumni record?`}
        description='The alumni record and its history are removed. The student record, if any, is kept.'
        confirmText='Delete record'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          await remove.mutateAsync(data.id)
          alerts.success('Alumni record deleted')
          setModal(null)
          void navigate({ to: '/alumni', search: { page: 1 }, replace: true })
        }}
      />
    </Page>
  )
}

function AcademicHistory({
  alumnus,
  canManage,
  onEdit,
}: {
  alumnus: AlumniDetail
  canManage: boolean
  onEdit: () => void
}) {
  const rows = alumnus.academic_history
  return (
    <Block
      title='Academic history'
      action={
        canManage && (
          <Button variant='outline' size='sm' onClick={onEdit}>
            <Pencil />
            Edit
          </Button>
        )
      }
    >
      {rows.length === 0 ? (
        <p className='rounded-lg border border-dashed p-3 text-sm text-muted-foreground'>
          No class history on record.
        </p>
      ) : (
        <ul className='grid overflow-hidden rounded-lg border'>
          {rows.map((row) => (
            <li
              key={row.id}
              className='grid gap-1 border-b px-3 py-2.5 text-sm last:border-0 sm:grid-cols-[6rem_1fr_auto] sm:items-center sm:gap-3'
            >
              <span className='font-semibold'>{row.academic_year_name}</span>
              <span className='text-muted-foreground'>
                {classLabel(row.class_name, row.section_name)}
                {row.roll_no ? ` · Roll ${row.roll_no}` : ''}
                {row.percent !== null ? ` · ${row.percent}%` : ''}
                {row.grade ? ` · ${row.grade}` : ''}
              </span>
              <span className='flex flex-wrap gap-1'>
                {row.result && (
                  <Badge tone={HISTORY_RESULT[row.result].tone}>
                    {HISTORY_RESULT[row.result].label}
                  </Badge>
                )}
                <Badge tone='neutral'>
                  {row.source === 'system' ? 'From records' : 'Added by staff'}
                </Badge>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Block>
  )
}

function Timeline({ alumnus }: { alumnus: AlumniDetail }) {
  if (!alumnus.timeline.length) {
    return (
      <p className='rounded-lg border border-dashed p-3 text-sm text-muted-foreground'>
        No changes recorded yet.
      </p>
    )
  }
  return (
    <ol className='grid gap-0'>
      {alumnus.timeline.map((entry) => {
        const changes = entry.changes ? Object.entries(entry.changes) : []
        return (
          <li key={entry.id} className='relative grid gap-1.5 border-l pb-5 pl-5 last:pb-0'>
            <span className='absolute top-1 -left-[7px] grid size-3.5 place-items-center rounded-full border-2 border-card bg-primary' />
            <div className='flex flex-wrap items-center gap-x-2 gap-y-0.5'>
              <span className='text-sm font-semibold'>
                {TIMELINE_ACTION[entry.action] ?? entry.action}
              </span>
              <span className='text-xs text-muted-foreground'>
                {entry.actor_name ? `${entry.actor_name} · ` : ''}
                {formatDateTime(entry.created_at)}
              </span>
            </div>
            {changes.length > 0 && (
              <ul className='grid gap-1 rounded-lg bg-muted/50 p-2.5 text-xs'>
                {changes.map(([field, [before, after]]) => (
                  <li key={field} className='flex flex-wrap items-center gap-1.5 break-all'>
                    <span className='font-semibold'>{fieldLabel(field)}:</span>
                    <span className='text-muted-foreground'>{fieldValue(field, before)}</span>
                    <ArrowRight className='size-3 shrink-0 text-muted-foreground' />
                    <span className='font-semibold'>{fieldValue(field, after)}</span>
                  </li>
                ))}
              </ul>
            )}
            {entry.note && <p className='text-xs text-muted-foreground'>{entry.note}</p>}
          </li>
        )
      })}
    </ol>
  )
}
