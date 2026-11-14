import { useState } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Camera,
  ChevronDown,
  Eye,
  FileText,
  Landmark,
  Pencil,
  Phone,
  SearchX,
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
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { filesApi } from '@/lib/files'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { staffApi, useStaff, useStaffMutation, type StaffDetail, type StaffStatus } from '../api'
import { StaffFormModal } from '../components/staff-form-modal'
import { AttentionBadges, StaffRoleBadges } from '../components/staff-badges'
import { BankTab, ClassesTab, DocumentsTab, ProfileTab } from '../components/staff-profile-tabs'
import { STAFF_STATUS, yearsLabel } from '../labels'
import type { StaffProfileTab } from '../search'

const route = getRouteApi('/_app/staff/$staffId')

const STATUS_ACTIONS: Record<
  StaffStatus,
  { label: string; title: string; description: string; destructive?: boolean }
> = {
  active: {
    label: 'Mark active',
    title: 'Mark as working?',
    description: 'They can sign in to the Staff app again and show up in assignments.',
  },
  on_leave: {
    label: 'Mark on leave',
    title: 'Mark as on leave?',
    description:
      'They stay on the staff list and keep their classes. You can mark them active later.',
  },
  resigned: {
    label: 'Mark resigned',
    title: 'Mark as resigned?',
    description:
      'They are signed out of the Staff app and hidden from the staff list. Today is saved as the leaving date.',
    destructive: true,
  },
}

export function StaffProfilePage() {
  const { staffId } = route.useParams()
  const { tab } = route.useSearch()
  const navigate = useNavigate()
  const id = Number(staffId)
  const me = useMe().data
  const canManage = can(me, 'staff.manage')
  const canBank = can(me, 'staff.bank')
  const staff = useStaff(Number.isFinite(id) ? id : null)

  useShortcut('app.refresh', () => void staff.refetch())

  if (staff.isPending) return <ProfileSkeleton />

  if (staff.isError) {
    return (
      <Page>
        <Card>
          {staff.error.isNotFound ? (
            <EmptyState
              icon={SearchX}
              title='Staff member not found'
              description='They may have been removed, or the link is wrong.'
              action={
                <Button asChild variant='outline'>
                  <Link to='/staff' search={{ page: 1 }}>
                    Back to staff
                  </Link>
                </Button>
              }
            />
          ) : (
            <ErrorState message={staff.error.message} onRetry={() => staff.refetch()} />
          )}
        </Card>
      </Page>
    )
  }

  const data = staff.data
  const go = (next: StaffProfileTab) =>
    navigate({
      to: '/staff/$staffId',
      params: { staffId },
      search: { tab: next },
      replace: true,
    })
  const pendingDocs = data.documents.filter((document) => document.status !== 'verified').length

  return (
    <Page>
      <Link
        to='/staff'
        search={{ page: 1 }}
        className='inline-flex items-center gap-1.5 self-start text-sm font-semibold text-muted-foreground hover:text-foreground'
      >
        <ArrowLeft className='size-4' />
        All staff
      </Link>

      <ProfileHeader staff={data} canManage={canManage} />

      <PageTabs
        label='Staff profile sections'
        value={tab}
        onChange={go}
        tabs={[
          { value: 'profile', label: 'Profile', icon: UserRound },
          {
            value: 'classes',
            label: 'Classes',
            icon: BookOpen,
            count: data.assignments.length || undefined,
          },
          {
            value: 'documents',
            label: 'Documents',
            icon: FileText,
            count: pendingDocs || undefined,
          },
          { value: 'bank', label: 'Bank', icon: Landmark },
        ]}
      />

      {tab === 'profile' && <ProfileTab staff={data} canManage={canManage} />}
      {tab === 'classes' && <ClassesTab staff={data} />}
      {tab === 'documents' && <DocumentsTab staff={data} canManage={canManage} />}
      {tab === 'bank' && <BankTab staff={data} canBank={canBank} />}
    </Page>
  )
}

function ProfileHeader({ staff, canManage }: { staff: StaffDetail; canManage: boolean }) {
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [nextStatus, setNextStatus] = useState<StaffStatus | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [viewingPhoto, setViewingPhoto] = useState(false)
  const updateStaff = useStaffMutation((input: Parameters<typeof staffApi.update>[1]) =>
    staffApi.update(staff.id, input)
  )
  const remove = useStaffMutation(() => staffApi.remove(staff.id))

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
      await updateStaff.mutateAsync({ photo_file_id: uploaded.id })
      alerts.success('Staff photo updated')
    } catch (caught) {
      alerts.error(toApiError(caught).message)
    } finally {
      setPhotoUploading(false)
    }
  }

  const removePhoto = async () => {
    try {
      await updateStaff.mutateAsync({ photo_file_id: null })
      alerts.success('Staff photo removed')
      setViewingPhoto(false)
    } catch (caught) {
      alerts.error(toApiError(caught).message)
    }
  }

  const status = STAFF_STATUS[staff.status]
  const statusChoices = (Object.keys(STATUS_ACTIONS) as StaffStatus[]).filter(
    (value) => value !== staff.status
  )
  const action = nextStatus ? STATUS_ACTIONS[nextStatus] : null

  return (
    <Card className='gap-4 p-4 sm:p-5'>
      <div className='flex flex-wrap items-start gap-4'>
        <div className='relative'>
          <Avatar
            name={staff.name}
            src={staff.photo_url}
            size='lg'
            previewable
            subtitle={staff.employee_no ? `Employee No: ${staff.employee_no}` : staff.designation}
            onChangePhoto={canManage ? uploadPhoto : undefined}
            onRemovePhoto={canManage ? removePhoto : undefined}
            isUploading={photoUploading}
            className='size-16 text-lg'
          />
          {canManage && (
            <label
              htmlFor='staff-avatar-upload'
              className='absolute -right-1 -bottom-1 z-10 grid size-6 cursor-pointer place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90'
              title={staff.photo_url ? 'Change photo' : 'Upload photo'}
              onClick={(e) => e.stopPropagation()}
            >
              <Camera className='size-3' />
              <input
                id='staff-avatar-upload'
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
            <h1 className='text-2xl font-extrabold tracking-tight'>{staff.name}</h1>
            <Badge tone={status.tone} dot>
              {status.label}
            </Badge>
          </div>
          <p className='text-sm text-muted-foreground'>
            {staff.designation}
            {staff.department ? ` · ${staff.department}` : ''} ·{' '}
            <span className='font-mono'>{staff.employee_no}</span>
          </p>
          <StaffRoleBadges roles={staff.roles} max={6} />
        </div>
        {canManage && (
          <div className='flex flex-wrap gap-2'>
            <Button variant='outline' onClick={() => setEditing(true)}>
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
                {staff.photo_url && (
                  <DropdownMenuItem onSelect={() => setViewingPhoto(true)}>
                    <Eye className='size-4' />
                    View photo
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <label
                    htmlFor='staff-avatar-upload'
                    className='flex cursor-pointer items-center gap-2'
                  >
                    <Camera className='size-4' />
                    {staff.photo_url ? 'Change photo' : 'Upload photo'}
                  </label>
                </DropdownMenuItem>
                {staff.photo_url && (
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
        <Fact icon={Phone} label='Mobile' value={`+91 ${staff.mobile}`} />
        <Fact
          icon={Smartphone}
          label='Staff app'
          value={staff.on_app ? 'Signed in' : 'Not yet'}
          tone={staff.on_app ? 'text-success' : undefined}
        />
        <Fact icon={CalendarDays} label='Joined' value={formatDate(staff.joining_date)} />
        <Fact icon={UserRound} label='Experience' value={yearsLabel(staff.experience_years)} />
      </dl>

      <div className='flex flex-wrap items-center gap-2'>
        <span className='text-xs font-semibold text-muted-foreground'>Attention</span>
        <AttentionBadges reasons={staff.attention} />
      </div>

      {editing && <StaffFormModal open={editing} onOpenChange={setEditing} staff={staff} />}
      <ConfirmDialog
        open={Boolean(nextStatus)}
        onOpenChange={(open) => !open && setNextStatus(null)}
        title={action?.title ?? ''}
        description={action?.description ?? ''}
        confirmText={action?.label ?? 'Confirm'}
        destructive={action?.destructive}
        loading={updateStaff.isPending}
        onConfirm={async () => {
          if (!nextStatus) return
          try {
            await updateStaff.mutateAsync({ status: nextStatus })
            alerts.success(`${staff.name} marked ${STAFF_STATUS[nextStatus].label.toLowerCase()}`)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
          setNextStatus(null)
        }}
      />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`Delete ${staff.name}?`}
        description={
          staff.assignments.length
            ? 'This teacher still has classes this year. Mark them resigned instead, or move their classes first.'
            : 'They are removed from the staff list and signed out of the Staff app. Their records stay for history.'
        }
        confirmText='Delete'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          try {
            await remove.mutateAsync(undefined)
            alerts.success(`${staff.name} deleted`)
            setDeleting(false)
            void navigate({ to: '/staff', search: { page: 1 } })
          } catch (error) {
            alerts.error(toApiError(error).message)
            setDeleting(false)
          }
        }}
      />
      <ImagePreviewModal
        open={viewingPhoto}
        onOpenChange={setViewingPhoto}
        src={staff.photo_url}
        title={staff.name}
        subtitle={staff.employee_no ? `Employee No: ${staff.employee_no}` : staff.designation}
        onChangePhoto={canManage ? uploadPhoto : undefined}
        onRemovePhoto={canManage ? removePhoto : undefined}
        isUploading={photoUploading}
      />
    </Card>
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
