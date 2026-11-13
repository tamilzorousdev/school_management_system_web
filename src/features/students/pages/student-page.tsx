import { useState } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Bus,
  Camera,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  HeartPulse,
  IdCard,
  IndianRupee,
  Link2,
  LogOut,
  NotebookPen,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  School,
  Smartphone,
  Star,
  Medal,
  Trophy,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import { Avatar } from '@/components/common/avatar'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DocumentList } from '@/components/common/document-list'
import { EmptyState, ErrorState } from '@/components/common/display'
import { Page } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
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
import { ReportCard } from '@/features/exams/components/report-card'
import { StudentResults } from '@/features/exams/components/student-results'
import { StudentFeesTab } from '@/features/fees/components/student-fees-tab'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { filesApi, openFile } from '@/lib/files'
import { formatDate } from '@/lib/format'
import {
  studentsApi,
  useStudent,
  useStudentMutation,
  type StudentDetail,
  type StudentInput,
} from '../api'
import { AchievementsTab } from '../components/achievements-tab'
import { BehaviourTab } from '../components/behaviour-tab'
import { ExitModal } from '../components/exit-modal'
import { HealthTab } from '../components/health-tab'
import {
  Block,
  EditStudentModal,
  EnrollmentModal,
  Facts,
  LinkGuardianModal,
} from '../components/student-parts'
import {
  DOCUMENT_TYPE_LABELS,
  GENDER_LABELS,
  RELATION_LABELS,
  STUDENT_STATUS,
  classSection,
  yearsLabel,
} from '../labels'
import {
  recordsApi,
  studentFiles,
  useRecordCounts,
  useStudentDocuments,
  useTransferCertificate,
} from '../records-api'
import type { StudentTab } from '../search'

const route = getRouteApi('/_app/students/$studentId')

export function StudentPage() {
  const { studentId } = route.useParams()
  const { tab } = route.useSearch()
  const id = Number(studentId)
  const navigate = useNavigate()
  const canManage = can(useMe().data, 'students.manage')
  const canSeeResults = can(useMe().data, 'exams.view')
  const canSeeFees = can(useMe().data, 'fees.view')
  const student = useStudent(id)
  const counts = useRecordCounts(id)
  const data = student.data
  const [modal, setModal] = useState<'edit' | 'class' | 'exit' | 'reissue' | null>(null)
  const [printing, setPrinting] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const reissue = useStudentMutation(() => recordsApi.reissueCard(id))
  const updateStudent = useStudentMutation((patch: Partial<StudentInput>) =>
    studentsApi.update(id, patch)
  )

  const uploadPhoto = async (file: File | undefined) => {
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
      const uploaded = await filesApi.upload(file, 'student_photo')
      await updateStudent.mutateAsync({ photo_file_id: uploaded.id })
      alerts.success('Student photo updated')
    } catch (caught) {
      alerts.error(toApiError(caught).message)
    } finally {
      setPhotoUploading(false)
    }
  }

  const removePhoto = async () => {
    try {
      await updateStudent.mutateAsync({ photo_file_id: null })
      alerts.success('Student photo removed')
    } catch (caught) {
      alerts.error(toApiError(caught).message)
    }
  }
  const go = (next: StudentTab) =>
    navigate({
      to: '/students/$studentId',
      params: { studentId },
      search: { tab: next },
      replace: true,
    })

  if (student.isError && !data) {
    return (
      <Page>
        <ErrorState message={student.error.message} onRetry={() => student.refetch()} />
      </Page>
    )
  }
  if (!data) {
    return (
      <Page>
        <Skeleton className='h-36' />
        <Skeleton className='h-10' />
        <Skeleton className='h-80' />
      </Page>
    )
  }

  const active = data.status === 'active'
  const printCard = async () => {
    setPrinting(true)
    try {
      await openFile(studentFiles.idCard(id))
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setPrinting(false)
    }
  }

  return (
    <Page>
      <Link
        to='/students'
        search={{ page: 1 }}
        className='inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground'
      >
        <ArrowLeft className='size-4' />
        Students
      </Link>

      <Card className='overflow-hidden'>
        <div className='h-16 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent sm:h-20' />
        <div className='-mt-10 grid gap-4 px-4 pb-4 sm:-mt-12 sm:px-6 sm:pb-5 lg:flex lg:items-end lg:justify-between'>
          <div className='flex items-end gap-4'>
            <div className='relative'>
              <Avatar
                name={data.full_name}
                src={data.photo_url}
                size='lg'
                className='size-20 border-4 border-card text-xl shadow-sm sm:size-24'
              />
              {canManage && (
                <label
                  htmlFor='student-avatar-upload'
                  className='absolute -right-1 -bottom-1 grid size-7 cursor-pointer place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90'
                  title={data.photo_url ? 'Change photo' : 'Upload photo'}
                >
                  <Camera className='size-3.5' />
                  <input
                    id='student-avatar-upload'
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
            <div className='grid min-w-0 gap-1 pb-1'>
              <h1 className='truncate text-xl font-extrabold tracking-tight sm:text-2xl'>
                {data.full_name}
              </h1>
              <div className='flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground'>
                <span className='font-mono text-xs'>{data.admission_no}</span>
                {data.emis_number && (
                  <>
                    <span>·</span>
                    <span className='font-mono text-xs'>EMIS {data.emis_number}</span>
                  </>
                )}
                <span>·</span>
                <span>Class {classSection(data.class?.name, data.section?.name)}</span>
                {data.roll_no && <span>· Roll {data.roll_no}</span>}
              </div>
              <div className='flex flex-wrap gap-1.5'>
                <Badge tone={STUDENT_STATUS[data.status].tone} dot>
                  {STUDENT_STATUS[data.status].label}
                </Badge>
                <Badge tone='neutral'>{yearsLabel(data.years_in_school)}</Badge>
                {data.house && <Badge tone='neutral'>{data.house} house</Badge>}
                {data.sibling_count > 0 && (
                  <Badge tone='info'>
                    {data.sibling_count} {data.sibling_count === 1 ? 'sibling' : 'siblings'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className='flex flex-wrap gap-2'>
            {active && (
              <Button variant='outline' loading={printing} onClick={() => void printCard()}>
                <IdCard />
                ID card
              </Button>
            )}
            {canManage && (
              <Button variant='outline' onClick={() => setModal('edit')}>
                <Pencil />
                Edit
              </Button>
            )}
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline'>
                    More
                    <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {active && (
                    <DropdownMenuItem onSelect={() => setModal('class')}>
                      <School />
                      Change class or section
                    </DropdownMenuItem>
                  )}
                  {active && (
                    <DropdownMenuItem onSelect={() => setModal('reissue')}>
                      <RefreshCw />
                      Replace lost ID card
                    </DropdownMenuItem>
                  )}
                  {!active && (
                    <DropdownMenuItem
                      onSelect={() =>
                        void openFile(studentFiles.tc(id)).catch((error: unknown) =>
                          alerts.error(toApiError(error).message)
                        )
                      }
                    >
                      <FileText />
                      Transfer certificate
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <label
                      htmlFor='student-avatar-upload'
                      className='flex cursor-pointer items-center gap-2'
                    >
                      <Camera className='size-4' />
                      {data.photo_url ? 'Change photo' : 'Upload photo'}
                    </label>
                  </DropdownMenuItem>
                  {data.photo_url && (
                    <DropdownMenuItem destructive onSelect={() => void removePhoto()}>
                      <Trash2 className='size-4' />
                      Remove photo
                    </DropdownMenuItem>
                  )}
                  {active && <DropdownMenuSeparator />}
                  {active && (
                    <DropdownMenuItem destructive onSelect={() => setModal('exit')}>
                      <LogOut />
                      Leaving the school
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </Card>

      {!active && <LeftBanner student={data} />}

      <PageTabs
        label='Student profile sections'
        value={tab}
        onChange={go}
        tabs={[
          { value: 'profile', label: 'Profile', icon: UserRound },
          {
            value: 'guardians',
            label: 'Parents',
            icon: UsersRound,
            count: data.guardian_details.length,
          },
          { value: 'documents', label: 'Documents', icon: FileText, count: counts.data?.documents },
          {
            value: 'health',
            label: 'Health',
            icon: HeartPulse,
            count: counts.data?.vaccinations_overdue || undefined,
          },
          {
            value: 'behaviour',
            label: 'Behaviour',
            icon: NotebookPen,
            count: counts.data?.behaviour_notes,
          },
          { value: 'transport', label: 'Transport', icon: Bus },
          { value: 'achievements', label: 'Achievements', icon: Medal },
          ...(canSeeResults
            ? [
                { value: 'results' as const, label: 'Results', icon: Trophy },
                { value: 'report-card' as const, label: 'Report card', icon: FileSpreadsheet },
              ]
            : []),
          ...(canSeeFees ? [{ value: 'fees' as const, label: 'Fees', icon: IndianRupee }] : []),
        ]}
      />

      {tab === 'profile' && (
        <ProfileTab
          student={data}
          canManage={canManage && active}
          onChangeClass={() => setModal('class')}
        />
      )}
      {tab === 'guardians' && <GuardiansTab student={data} canManage={canManage} />}
      {tab === 'documents' && <DocumentsTab studentId={id} canManage={canManage} />}
      {tab === 'health' && <HealthTab studentId={id} canManage={canManage} />}
      {tab === 'behaviour' && <BehaviourTab studentId={id} canManage={canManage} />}
      {tab === 'achievements' && <AchievementsTab studentId={id} canManage={canManage} />}
      {tab === 'transport' && (
        <Card className='p-4 sm:p-6'>
          <EmptyState
            icon={Bus}
            title='No bus stop yet'
            description='Bus routes and stops are set up in Fleet. Once this student has a stop, the route, pickup time and boarding history show here.'
          />
        </Card>
      )}

      {tab === 'results' && canSeeResults && <StudentResults studentId={id} />}
      {tab === 'report-card' && canSeeResults && <ReportCard studentId={id} />}
      {tab === 'fees' && canSeeFees && <StudentFeesTab studentId={id} />}

      {modal === 'edit' && <EditStudentModal student={data} onClose={() => setModal(null)} />}
      {modal === 'class' && (
        <EnrollmentModal open onOpenChange={(open) => !open && setModal(null)} student={data} />
      )}
      {modal === 'exit' && <ExitModal student={data} onClose={() => setModal(null)} />}
      <ConfirmDialog
        open={modal === 'reissue'}
        onOpenChange={(open) => !open && setModal(null)}
        title='Replace the ID card?'
        description='A new card is printed with a new QR. The old card stops working on the bus at once.'
        confirmText='Replace and print'
        loading={reissue.isPending}
        onConfirm={async () => {
          try {
            await reissue.mutateAsync(undefined)
            alerts.success('New ID card issued')
            setModal(null)
            await printCard()
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      />
    </Page>
  )
}

function LeftBanner({ student }: { student: StudentDetail }) {
  const tc = useTransferCertificate(student.id, true)
  return (
    <Card className='flex flex-wrap items-center justify-between gap-3 border-warning/40 bg-warning/5 p-4'>
      <div className='flex items-center gap-3'>
        <span className='grid size-10 place-items-center rounded-lg bg-warning/15 text-warning'>
          <LogOut className='size-5' />
        </span>
        <div className='grid'>
          <span className='font-semibold'>
            {STUDENT_STATUS[student.status].label}
            {tc.data ? ` on ${formatDate(tc.data.leaving_date)}` : ''}
          </span>
          <span className='text-sm text-muted-foreground'>
            {tc.data
              ? `TC ${tc.data.tc_no} · ${tc.data.reason}`
              : 'No transfer certificate on record'}
          </span>
        </div>
      </div>
      {tc.data && (
        <Button
          variant='outline'
          onClick={() =>
            void openFile(studentFiles.tc(student.id)).catch((error: unknown) =>
              alerts.error(toApiError(error).message)
            )
          }
        >
          <FileText />
          Transfer certificate
        </Button>
      )}
    </Card>
  )
}

function ProfileTab({
  student,
  canManage,
  onChangeClass,
}: {
  student: StudentDetail
  canManage: boolean
  onChangeClass: () => void
}) {
  return (
    <div className='grid gap-6 lg:grid-cols-2'>
      <Card className='grid content-start gap-6 p-4 sm:p-5'>
        <Block
          title='Class this year'
          action={
            canManage && (
              <Button variant='outline' size='sm' onClick={onChangeClass}>
                <Pencil />
                Change
              </Button>
            )
          }
        >
          <Facts
            items={[
              ['Class', student.class ? `Class ${student.class.name}` : 'Not placed'],
              ['Section', student.section?.name ?? 'Not placed'],
              ['Roll number', student.roll_no ?? '—'],
              ['House', student.house ?? '—'],
            ]}
          />
        </Block>
        <Block title='Profile'>
          <Facts
            items={[
              ['EMIS number', student.emis_number ?? '—'],
              ['Date of birth', `${formatDate(student.dob)} · ${student.age} years`],
              ['Gender', GENDER_LABELS[student.gender]],
              ['Blood group', student.blood_group ?? '—'],
              ['Admitted on', formatDate(student.admission_date)],
              ['Previous school', student.previous_school ?? '—'],
              ['Identification marks', student.identification_marks ?? '—'],
              [
                'Address',
                [student.address_line, student.city, student.pincode].filter(Boolean).join(', ') ||
                  '—',
              ],
            ]}
          />
        </Block>
      </Card>
      <Card className='grid content-start gap-6 p-4 sm:p-5'>
        <Block title='Class history'>
          <ul className='grid overflow-hidden rounded-lg border'>
            {student.history.map((row) => (
              <li
                key={row.academic_year}
                className='flex items-center justify-between gap-3 border-b px-3 py-2.5 text-sm last:border-0'
              >
                <span className='font-semibold'>{row.academic_year}</span>
                <span className='text-muted-foreground'>
                  Class {classSection(row.class_name, row.section_name)}
                  {row.roll_no ? ` · Roll ${row.roll_no}` : ''}
                </span>
                {row.is_current ? (
                  <Badge tone='success'>Current</Badge>
                ) : (
                  <Badge tone='neutral' className='capitalize'>
                    {row.status}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </Block>
        <Block title='Emergency contacts'>
          {student.emergency_contacts.length ? (
            <Facts
              items={student.emergency_contacts.map((contact) => [
                `${contact.name} (${contact.relation})`,
                `+91 ${contact.mobile}`,
              ])}
            />
          ) : (
            <p className='rounded-lg border border-dashed p-3 text-sm text-muted-foreground'>
              None added. Parents are called first.
            </p>
          )}
        </Block>
      </Card>
    </div>
  )
}

function GuardiansTab({ student, canManage }: { student: StudentDetail; canManage: boolean }) {
  const [linking, setLinking] = useState(false)
  const [unlinking, setUnlinking] = useState<{ id: number; name: string } | null>(null)
  const unlink = useStudentMutation((guardianId: number) =>
    studentsApi.removeGuardian(student.id, guardianId)
  )
  const makeMain = useStudentMutation((guardianId: number) =>
    studentsApi.updateGuardianLink(student.id, guardianId, { is_primary: true })
  )

  return (
    <div className='grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'>
      <Card className='p-4 sm:p-5'>
        <Block
          title='Parents and guardians'
          action={
            canManage && (
              <Button variant='outline' size='sm' onClick={() => setLinking(true)}>
                <Plus />
                Link parent
              </Button>
            )
          }
        >
          <ul className='grid gap-2'>
            {student.guardian_details.map((guardian) => (
              <li key={guardian.id} className='flex items-start gap-3 rounded-lg border p-3'>
                <Avatar name={guardian.name} size='sm' />
                <div className='grid min-w-0 flex-1 gap-1'>
                  <div className='flex flex-wrap items-center gap-1.5'>
                    <span className='font-semibold'>{guardian.name}</span>
                    <Badge tone='neutral'>{RELATION_LABELS[guardian.relation]}</Badge>
                    {guardian.is_primary && <Badge tone='success'>Main contact</Badge>}
                    {guardian.can_pickup && <Badge tone='info'>Can pick up</Badge>}
                  </div>
                  <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
                    <a
                      href={`tel:+91${guardian.mobile}`}
                      className='tabular inline-flex items-center gap-1 hover:text-foreground'
                    >
                      <Phone className='size-3' />
                      +91 {guardian.mobile}
                    </a>
                    <span className='inline-flex items-center gap-1'>
                      <Smartphone className='size-3' />
                      {guardian.on_app
                        ? 'Uses the app'
                        : guardian.receives_alerts
                          ? 'Invited, not signed in'
                          : 'No app login'}
                    </span>
                    {guardian.occupation && <span>{guardian.occupation}</span>}
                  </div>
                </div>
                {canManage && (
                  <div className='flex shrink-0 gap-1'>
                    {!guardian.is_primary && (
                      <Button
                        variant='ghost'
                        size='icon-sm'
                        aria-label={`Make ${guardian.name} the main contact`}
                        title='Make main contact'
                        onClick={() => makeMain.mutate(guardian.id)}
                      >
                        <Star />
                      </Button>
                    )}
                    {student.guardian_details.length > 1 && (
                      <Button
                        variant='ghost'
                        size='icon-sm'
                        aria-label={`Unlink ${guardian.name}`}
                        className='text-destructive hover:bg-destructive/10'
                        onClick={() => setUnlinking({ id: guardian.id, name: guardian.name })}
                      >
                        <X />
                      </Button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Block>
      </Card>
      <Card className='p-4 sm:p-5'>
        <Block title='Brothers and sisters here'>
          {student.siblings.length ? (
            <ul className='grid gap-2'>
              {student.siblings.map((sibling) => (
                <li key={sibling.id}>
                  <Link
                    to='/students/$studentId'
                    params={{ studentId: String(sibling.id) }}
                    search={{ tab: 'profile' }}
                    className='flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none'
                  >
                    <Avatar name={sibling.full_name} size='sm' />
                    <span className='flex-1 font-semibold'>{sibling.full_name}</span>
                    <span className='text-xs text-muted-foreground'>
                      Class {sibling.class_section ?? '—'}
                    </span>
                    <Link2 className='size-4 text-muted-foreground' />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className='rounded-lg border border-dashed p-3 text-sm text-muted-foreground'>
              No brothers or sisters linked. Children who share a parent mobile are linked
              automatically.
            </p>
          )}
        </Block>
      </Card>
      {linking && <LinkGuardianModal open onOpenChange={setLinking} student={student} />}
      <ConfirmDialog
        open={Boolean(unlinking)}
        onOpenChange={(open) => !open && setUnlinking(null)}
        title={`Unlink ${unlinking?.name ?? ''}?`}
        description='They stay in the school records and keep their other children. They will no longer get alerts for this student.'
        confirmText='Unlink'
        destructive
        loading={unlink.isPending}
        onConfirm={async () => {
          if (!unlinking) return
          try {
            await unlink.mutateAsync(unlinking.id)
            alerts.success(`${unlinking.name} unlinked`)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
          setUnlinking(null)
        }}
      />
    </div>
  )
}

function DocumentsTab({ studentId, canManage }: { studentId: number; canManage: boolean }) {
  const documents = useStudentDocuments(studentId)
  const add = useStudentMutation((input: Parameters<typeof recordsApi.addDocument>[1]) =>
    recordsApi.addDocument(studentId, input)
  )
  const verify = useStudentMutation(
    (input: { id: number; status: 'verified' | 'rejected'; remarks: string | null }) =>
      recordsApi.verifyDocument(studentId, input.id, input.status, input.remarks)
  )
  const remove = useStudentMutation((documentId: number) =>
    recordsApi.removeDocument(studentId, documentId)
  )

  if (documents.isError)
    return <ErrorState message={documents.error.message} onRetry={() => documents.refetch()} />
  if (!documents.data) return <Skeleton className='h-48' />
  return (
    <Card className='p-4 sm:p-5'>
      <DocumentList
        documents={documents.data}
        types={DOCUMENT_TYPE_LABELS}
        canManage={canManage}
        purpose='student_document'
        parentVisibility
        onAdd={(input) => add.mutateAsync(input)}
        onVerify={(id, status, remarks) => verify.mutateAsync({ id, status, remarks })}
        onDelete={(id) => remove.mutateAsync(id)}
      />
    </Card>
  )
}
