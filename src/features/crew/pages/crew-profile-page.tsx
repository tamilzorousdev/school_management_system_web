import { useState } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  BellRing,
  Bus,
  CalendarDays,
  Camera,
  ChevronDown,
  Eye,
  FileText,
  Pencil,
  Phone,
  SearchX,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserRound,
} from 'lucide-react'
import { Avatar, ImagePreviewModal } from '@/components/common/avatar'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState, ErrorState } from '@/components/common/display'
import { Page } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
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
import type { StaffStatus } from '@/features/staff/api'
import { STAFF_STATUS } from '@/features/staff/labels'
import { ExpiryBadges } from '@/features/transport/components/expiry-badges'
import { ROLE_BADGE } from '@/features/transport/labels'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { filesApi } from '@/lib/files'
import { formatDate, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { crewApi, useCrewMember, useCrewMutation, type CrewDetail } from '../api'
import { CrewFormModal } from '../components/crew-form-modal'
import { ClearanceTab, DocumentsTab, ProfileTab } from '../components/crew-profile-tabs'
import { DUTY_STATUS } from '../labels'
import type { CrewProfileTab } from '../search'

const route = getRouteApi('/_app/crew/$staffId')

const STATUS_ACTIONS: Record<
  StaffStatus,
  { label: string; title: string; description: string; destructive?: boolean }
> = {
  active: {
    label: 'Mark active',
    title: 'Mark as working?',
    description: 'They can sign in to the driver app again. Approve them for duty before a trip.',
  },
  on_leave: {
    label: 'Mark on leave',
    title: 'Mark as on leave?',
    description: 'They stay on the list. Take them off their bus if someone else covers the route.',
  },
  resigned: {
    label: 'Mark resigned',
    title: 'Mark as resigned?',
    description:
      'They are signed out of the driver app and hidden from the list. Today is saved as the leaving date.',
    destructive: true,
  },
}

export function CrewProfilePage() {
  const { staffId } = route.useParams()
  const { tab } = route.useSearch()
  const navigate = useNavigate()
  const id = Number(staffId)
  const canManage = can(useMe().data, 'fleet.manage')
  const member = useCrewMember(Number.isFinite(id) ? id : null)
  const [editing, setEditing] = useState(false)
  const [approving, setApproving] = useState(false)
  const [reminding, setReminding] = useState(false)

  useShortcut('app.refresh', () => void member.refetch())

  if (member.isPending) return <ProfileSkeleton />

  if (member.isError) {
    return (
      <Page>
        <Card>
          {member.error.isNotFound ? (
            <EmptyState
              icon={SearchX}
              title='Driver or attendant not found'
              description='They may have been removed, or the link is wrong.'
              action={
                <Button asChild variant='outline'>
                  <Link to='/crew' search={{ page: 1 }}>
                    Back to drivers and attendants
                  </Link>
                </Button>
              }
            />
          ) : (
            <ErrorState message={member.error.message} onRetry={() => member.refetch()} />
          )}
        </Card>
      </Page>
    )
  }

  const data = member.data
  const due = data.checks.filter(
    (check) => check.expiry.state === 'expired' || check.expiry.state === 'due_soon'
  )
  const go = (next: CrewProfileTab) =>
    navigate({ to: '/crew/$staffId', params: { staffId }, search: { tab: next }, replace: true })
  const pendingDocs = data.documents.filter((document) => document.status === 'pending').length
  const failing = data.checks.filter((check) => !check.clear).length

  return (
    <Page>
      <Link
        to='/crew'
        search={{ page: 1 }}
        className='inline-flex items-center gap-1.5 self-start text-sm font-semibold text-muted-foreground hover:text-foreground'
      >
        <ArrowLeft className='size-4' />
        All drivers and attendants
      </Link>

      <ProfileHeader
        member={data}
        canManage={canManage}
        hasDue={due.length > 0}
        onEdit={() => setEditing(true)}
        onApprove={() => setApproving(true)}
        onRemind={() => setReminding(true)}
      />

      <PageTabs
        label='Crew profile sections'
        value={tab}
        onChange={go}
        tabs={[
          {
            value: 'clearance',
            label: 'Clearance',
            icon: ShieldCheck,
            count: failing || undefined,
          },
          { value: 'profile', label: 'Profile', icon: UserRound },
          {
            value: 'documents',
            label: 'Documents',
            icon: FileText,
            count: pendingDocs || undefined,
          },
        ]}
      />

      {tab === 'clearance' && (
        <ClearanceTab
          member={data}
          canManage={canManage}
          hasDue={due.length > 0}
          onApprove={() => setApproving(true)}
          onRemind={() => setReminding(true)}
          onEdit={() => setEditing(true)}
        />
      )}
      {tab === 'profile' && <ProfileTab member={data} />}
      {tab === 'documents' && <DocumentsTab member={data} canManage={canManage} />}

      {editing && <CrewFormModal open={editing} onOpenChange={setEditing} member={data} />}
      <ApproveDialog member={data} open={approving} onOpenChange={setApproving} />
      <RemindDialog
        member={data}
        due={due.map((check) => check.label)}
        open={reminding}
        onOpenChange={setReminding}
      />
    </Page>
  )
}

function ProfileHeader({
  member,
  canManage,
  hasDue,
  onEdit,
  onApprove,
  onRemind,
}: {
  member: CrewDetail
  canManage: boolean
  hasDue: boolean
  onEdit: () => void
  onApprove: () => void
  onRemind: () => void
}) {
  const navigate = useNavigate()
  const [nextStatus, setNextStatus] = useState<StaffStatus | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [viewingPhoto, setViewingPhoto] = useState(false)
  const update = useCrewMutation((input: Parameters<typeof crewApi.update>[1]) =>
    crewApi.update(member.id, input)
  )
  const remove = useCrewMutation(() => crewApi.remove(member.id))

  const uploadPhoto = async (file?: File) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alerts.error('Choose a PNG, JPG or WEBP image')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alerts.error('Photo must be 5 MB or smaller')
      return
    }
    setPhotoUploading(true)
    try {
      const uploaded = await filesApi.upload(file, 'staff_photo')
      await update.mutateAsync({ photo_file_id: uploaded.id })
      alerts.success('Photo updated')
    } catch (caught) {
      alerts.error(toApiError(caught).message)
    } finally {
      setPhotoUploading(false)
    }
  }

  const removePhoto = async () => {
    try {
      await update.mutateAsync({ photo_file_id: null })
      alerts.success('Photo removed')
      setViewingPhoto(false)
    } catch (caught) {
      alerts.error(toApiError(caught).message)
    }
  }

  const duty = DUTY_STATUS[member.duty_status]
  const statusChoices = (Object.keys(STATUS_ACTIONS) as StaffStatus[]).filter(
    (value) => value !== member.status
  )
  const action = nextStatus ? STATUS_ACTIONS[nextStatus] : null

  return (
    <Card className='gap-4 p-4 sm:p-5'>
      <div className='flex flex-wrap items-start gap-4'>
        <div className='relative'>
          <Avatar
            name={member.name}
            src={member.photo_url}
            size='lg'
            previewable
            subtitle={`Employee No: ${member.employee_no}`}
            onChangePhoto={canManage ? uploadPhoto : undefined}
            onRemovePhoto={canManage ? removePhoto : undefined}
            isUploading={photoUploading}
            className='size-16 text-lg'
          />
          {canManage && (
            <label
              htmlFor='crew-avatar-upload'
              className='absolute -right-1 -bottom-1 z-10 grid size-6 cursor-pointer place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90'
              title={member.photo_url ? 'Change photo' : 'Upload photo'}
              onClick={(event) => event.stopPropagation()}
            >
              <Camera className='size-3' />
              <input
                id='crew-avatar-upload'
                type='file'
                accept='image/jpeg,image/png,image/webp'
                className='sr-only'
                disabled={photoUploading}
                onChange={(event) => {
                  void uploadPhoto(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
            </label>
          )}
        </div>
        <div className='grid min-w-0 flex-1 gap-1.5'>
          <div className='flex flex-wrap items-center gap-2'>
            <h1 className='text-2xl font-extrabold tracking-tight'>{member.name}</h1>
            <Badge tone={duty.tone} dot>
              {duty.label}
            </Badge>
            {member.status !== 'active' && (
              <Badge tone={STAFF_STATUS[member.status].tone}>
                {STAFF_STATUS[member.status].label}
              </Badge>
            )}
          </div>
          <p className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
            <Badge tone={ROLE_BADGE[member.role].tone}>{ROLE_BADGE[member.role].label}</Badge>
            {member.designation} · <span className='font-mono'>{member.employee_no}</span>
          </p>
        </div>
        {canManage && (
          <div className='flex flex-wrap gap-2'>
            {member.duty_status !== 'approved' && (
              <Button onClick={onApprove} disabled={!member.clear}>
                <ShieldCheck />
                Approve for duty
              </Button>
            )}
            {hasDue && (
              <Button variant='outline' onClick={onRemind}>
                <BellRing />
                Send reminder
              </Button>
            )}
            <Button variant='outline' onClick={onEdit}>
              <Pencil />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline'>
                  More
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {member.photo_url && (
                  <DropdownMenuItem onSelect={() => setViewingPhoto(true)}>
                    <Eye className='size-4' />
                    View photo
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <label
                    htmlFor='crew-avatar-upload'
                    className='flex cursor-pointer items-center gap-2'
                  >
                    <Camera className='size-4' />
                    {member.photo_url ? 'Change photo' : 'Upload photo'}
                  </label>
                </DropdownMenuItem>
                {member.photo_url && (
                  <DropdownMenuItem destructive onSelect={() => void removePhoto()}>
                    <Trash2 className='size-4' />
                    Remove photo
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {statusChoices.map((value) => (
                  <DropdownMenuItem key={value} onSelect={() => setNextStatus(value)}>
                    {STATUS_ACTIONS[value].label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onSelect={() => setDeleting(true)}>
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <dl className='grid grid-cols-2 gap-x-6 gap-y-3 border-t pt-4 text-sm sm:flex sm:flex-wrap'>
        <Fact icon={Phone} label='Mobile' value={`+91 ${member.mobile}`} />
        <Fact
          icon={Bus}
          label='Bus'
          value={
            member.vehicle
              ? `${member.vehicle.name}${member.route ? ` · ${member.route.name}` : ''}`
              : 'Not on a bus'
          }
        />
        <Fact icon={CalendarDays} label='Joined' value={formatDate(member.joining_date)} />
        <Fact
          icon={Smartphone}
          label='Driver app'
          value={member.on_app ? 'Signed in' : 'Not yet'}
          tone={member.on_app ? 'text-success' : undefined}
        />
        <Fact
          icon={ShieldCheck}
          label='Approved'
          value={
            member.approved_at
              ? `${formatDate(member.approved_at)}${member.approved_by ? ` · ${member.approved_by.name}` : ''}`
              : 'Not yet'
          }
        />
        {member.last_reminded_at && (
          <Fact icon={BellRing} label='Reminded' value={timeAgo(member.last_reminded_at)} />
        )}
      </dl>

      <div className='flex flex-wrap items-center gap-2'>
        <span className='text-xs font-semibold text-muted-foreground'>Documents</span>
        <ExpiryBadges items={member.expiries} />
      </div>

      <ConfirmDialog
        open={Boolean(nextStatus)}
        onOpenChange={(open) => !open && setNextStatus(null)}
        title={action?.title ?? ''}
        description={action?.description ?? ''}
        confirmText={action?.label ?? 'Confirm'}
        destructive={action?.destructive}
        loading={update.isPending}
        onConfirm={async () => {
          if (!nextStatus) return
          try {
            await update.mutateAsync({ status: nextStatus })
            alerts.success(`${member.name} marked ${STAFF_STATUS[nextStatus].label.toLowerCase()}`)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
          setNextStatus(null)
        }}
      />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`Delete ${member.name}?`}
        description='They are removed from the staff list, taken off their bus and signed out of the driver app. Their records stay for history.'
        confirmText='Delete'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          try {
            await remove.mutateAsync(undefined)
            alerts.success(`${member.name} deleted`)
            setDeleting(false)
            void navigate({ to: '/crew', search: { page: 1 } })
          } catch (error) {
            alerts.error(toApiError(error).message)
            setDeleting(false)
          }
        }}
      />
      <ImagePreviewModal
        open={viewingPhoto}
        onOpenChange={setViewingPhoto}
        src={member.photo_url}
        title={member.name}
        subtitle={`Employee No: ${member.employee_no}`}
        onChangePhoto={canManage ? uploadPhoto : undefined}
        onRemovePhoto={canManage ? removePhoto : undefined}
        isUploading={photoUploading}
      />
    </Card>
  )
}

function ApproveDialog({
  member,
  open,
  onOpenChange,
}: {
  member: CrewDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const approve = useCrewMutation(() => crewApi.approve(member.id))
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Approve ${member.name} for duty?`}
      description={`Every check is clear: ${member.checks.map((check) => check.label).join(', ')}. They can be put on a bus and start trips until a document expires.`}
      confirmText='Approve for duty'
      loading={approve.isPending}
      onConfirm={async () => {
        try {
          await approve.mutateAsync(undefined)
          alerts.success(`${member.name} approved for duty`)
        } catch (error) {
          alerts.error(toApiError(error).message)
        }
        onOpenChange(false)
      }}
    />
  )
}

function RemindDialog({
  member,
  due,
  open,
  onOpenChange,
}: {
  member: CrewDetail
  due: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const remind = useCrewMutation(() => crewApi.remind(member.id))
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Send a reminder to ${member.name}?`}
      description={`A push notification on the driver app (SMS if it does not reach the phone) asks them to renew: ${due.join(', ')}.`}
      confirmText='Send reminder'
      loading={remind.isPending}
      onConfirm={async () => {
        try {
          await remind.mutateAsync(undefined)
          alerts.success(`Reminder sent to ${member.name}`)
        } catch (error) {
          alerts.error(toApiError(error).message)
        }
        onOpenChange(false)
      }}
    />
  )
}

function Fact({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Phone
  label: string
  value: string
  tone?: string
}) {
  return (
    <div className='flex items-center gap-2'>
      <Icon className='size-4 shrink-0 text-muted-foreground' />
      <div className='grid'>
        <dt className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
          {label}
        </dt>
        <dd className={cn('font-semibold', tone)}>{value}</dd>
      </div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <Page>
      <Skeleton className='h-5 w-24' />
      <Card className='gap-4 p-5'>
        <div className='flex items-center gap-4'>
          <Skeleton className='size-12 rounded-full' />
          <div className='grid flex-1 gap-2'>
            <Skeleton className='h-7 w-56' />
            <Skeleton className='h-4 w-72' />
          </div>
        </div>
        <Skeleton className='h-12 w-full' />
      </Card>
      <Skeleton className='h-10 w-full' />
      <Skeleton className='h-64 w-full' />
    </Page>
  )
}
