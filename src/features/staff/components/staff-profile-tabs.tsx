import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  BookOpen,
  Check,
  Eye,
  EyeOff,
  GraduationCap,
  Grid3x3,
  Landmark,
  Pencil,
  Plus,
  School,
  Star,
  Trash2,
} from 'lucide-react'
import { DetailList, EmptyState, ErrorState } from '@/components/common/display'
import { DocumentList } from '@/components/common/document-list'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Section } from '@/features/setup/components/setup-shared'
import { formatDate } from '@/lib/format'
import { staffApi, useStaffBank, useStaffMutation, type StaffDetail } from '../api'
import { GENDER_LABELS, LANGUAGE_OPTIONS, STAFF_DOCUMENT_TYPES, STAFF_TYPE_LABELS } from '../labels'
import { LoadBar } from './load-bar'
import { BankModal, QualificationsModal } from './staff-profile-modals'

const orDash = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === '' ? '—' : value

export function ProfileTab({ staff, canManage }: { staff: StaffDetail; canManage: boolean }) {
  const [editing, setEditing] = useState(false)
  return (
    <div className='grid gap-6 xl:grid-cols-[3fr_2fr]'>
      <Section title='Details'>
        <DetailList
          items={[
            { label: 'Employee number', value: staff.employee_no, mono: true },
            { label: 'Staff type', value: STAFF_TYPE_LABELS[staff.staff_type] },
            { label: 'Designation', value: staff.designation },
            { label: 'Department', value: orDash(staff.department) },
            { label: 'Mobile', value: `+91 ${staff.mobile}` },
            { label: 'Email', value: orDash(staff.email) },
            {
              label: 'App language',
              value:
                LANGUAGE_OPTIONS.find((option) => option.value === staff.language)?.label ?? '—',
            },
            { label: 'Gender', value: staff.gender ? GENDER_LABELS[staff.gender] : '—' },
            { label: 'Date of birth', value: formatDate(staff.dob) },
            { label: 'Joined on', value: formatDate(staff.joining_date) },
            {
              label: 'Experience before joining',
              value: `${staff.prior_experience_years} ${staff.prior_experience_years === 1 ? 'year' : 'years'}`,
            },
            ...(staff.staff_type === 'teaching'
              ? [{ label: 'Most periods a week', value: staff.max_periods_per_week }]
              : []),
            ...(staff.left_on ? [{ label: 'Left on', value: formatDate(staff.left_on) }] : []),
            { label: 'Address', value: orDash(staff.address) },
            {
              label: 'Emergency contact',
              value: staff.emergency_contact_name
                ? `${staff.emergency_contact_name}${staff.emergency_contact_mobile ? ` · +91 ${staff.emergency_contact_mobile}` : ''}`
                : orDash(staff.emergency_contact_mobile && `+91 ${staff.emergency_contact_mobile}`),
            },
          ]}
        />
      </Section>
      <Section
        title='Qualifications'
        action={
          canManage && (
            <Button size='sm' variant='outline' onClick={() => setEditing(true)}>
              <Pencil />
              Edit qualifications
            </Button>
          )
        }
      >
        {staff.qualifications.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title='No qualifications added'
            description='Add degrees and teacher training so they show on the profile.'
            className='py-6'
          />
        ) : (
          <ul className='grid gap-2'>
            {staff.qualifications.map((item) => (
              <li key={item.id} className='flex items-start gap-3 rounded-xl border p-3'>
                <span className='grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary'>
                  <GraduationCap className='size-4' />
                </span>
                <span className='grid min-w-0 gap-0.5'>
                  <span className='font-semibold'>
                    {item.degree}
                    {item.specialization && (
                      <span className='font-normal text-muted-foreground'>
                        {' '}
                        · {item.specialization}
                      </span>
                    )}
                  </span>
                  <span className='text-xs text-muted-foreground'>
                    {[item.institution, item.year_completed].filter(Boolean).join(' · ') ||
                      'No college or year given'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <QualificationsModal staff={staff} open={editing} onOpenChange={setEditing} />
    </div>
  )
}

export function ClassesTab({ staff }: { staff: StaffDetail }) {
  const teaching = staff.staff_type === 'teaching'
  return (
    <div className='grid gap-6 xl:grid-cols-[2fr_1fr]'>
      <Section
        title='Subjects this year'
        description='Each section and subject this person teaches, with periods a week.'
        action={
          <Button size='sm' variant='outline' asChild>
            <Link to='/staff/assignments'>
              <Grid3x3 />
              Teacher assignments
            </Link>
          </Button>
        }
      >
        {staff.assignments.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={teaching ? 'No classes this year' : 'Not a teaching role'}
            description={
              teaching
                ? 'Give this teacher subjects in Teacher assignments.'
                : 'Only teaching staff take subjects.'
            }
            className='py-6'
          />
        ) : (
          <ul className='grid divide-y rounded-xl border'>
            {staff.assignments.map((item) => (
              <li key={item.id} className='flex items-center gap-3 px-3 py-2.5'>
                <Badge tone='info' className='shrink-0'>
                  {item.section.name}
                </Badge>
                <span className='min-w-0 flex-1 truncate font-semibold'>{item.subject.name}</span>
                <span className='tabular shrink-0 text-sm text-muted-foreground'>
                  <span className='font-semibold text-foreground'>{item.periods_per_week}</span>{' '}
                  {item.periods_per_week === 1 ? 'period' : 'periods'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <div className='grid content-start gap-6'>
        {teaching && (
          <Section title='Weekly load'>
            <div className='grid gap-3'>
              <LoadBar load={staff.load_periods} max={staff.max_periods_per_week} />
              <p className='text-xs text-muted-foreground'>
                {staff.load_periods > staff.max_periods_per_week
                  ? `${staff.load_periods - staff.max_periods_per_week} periods over the limit. Move a subject to another teacher.`
                  : `${staff.max_periods_per_week - staff.load_periods} periods free across ${staff.sections_count} ${staff.sections_count === 1 ? 'section' : 'sections'}.`}
              </p>
            </div>
          </Section>
        )}
        <Section title='Class teacher of'>
          {staff.class_teacher_of.length ? (
            <span className='flex flex-wrap gap-2'>
              {staff.class_teacher_of.map((section) => (
                <Badge key={section.id} tone='info'>
                  <School className='size-3' />
                  {section.name}
                </Badge>
              ))}
            </span>
          ) : (
            <p className='text-sm text-muted-foreground'>
              Not a class teacher. Set class teachers in School setup.
            </p>
          )}
        </Section>
      </div>
    </div>
  )
}

export function DocumentsTab({ staff, canManage }: { staff: StaffDetail; canManage: boolean }) {
  const add = useStaffMutation((input: { type: string; title: string; file_id: number }) =>
    staffApi.addDocument(staff.id, input)
  )
  const verify = useStaffMutation(
    (input: { id: number; status: 'verified' | 'rejected'; remarks: string | null }) =>
      staffApi.verifyDocument(staff.id, input.id, input.status, input.remarks)
  )
  const remove = useStaffMutation((documentId: number) =>
    staffApi.removeDocument(staff.id, documentId)
  )
  return (
    <Section
      title='Documents'
      description='ID proof, certificates and verification papers. Check each one and mark it verified.'
    >
      <DocumentList
        documents={staff.documents}
        types={STAFF_DOCUMENT_TYPES}
        canManage={canManage}
        purpose='staff_document'
        parentVisibility={false}
        onAdd={add.mutateAsync}
        onVerify={(id, status, remarks) => verify.mutateAsync({ id, status, remarks })}
        onDelete={remove.mutateAsync}
      />
    </Section>
  )
}

export function BankTab({ staff, canBank }: { staff: StaffDetail; canBank: boolean }) {
  const [revealed, setRevealed] = useState(false)
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const full = useStaffBank(staff.id, revealed && canBank)
  const setPrimary = useStaffMutation((bankId: number) => staffApi.setPrimaryBank(staff.id, bankId))
  const removeBank = useStaffMutation((bankId: number) => staffApi.removeBank(staff.id, bankId))

  const bankList =
    staff.banks && staff.banks.length > 0 ? staff.banks : staff.bank.complete ? [staff.bank] : []
  const hasAny = bankList.length > 0

  return (
    <Section
      title='Bank details'
      description='For salary payments. Primary account is used for payroll disbursements.'
      action={
        canBank && (
          <div className='flex items-center gap-2'>
            {hasAny && (
              <Button size='sm' variant='outline' onClick={() => setRevealed((value) => !value)}>
                {revealed ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
                {revealed ? 'Hide numbers' : 'Show full details'}
              </Button>
            )}
            {hasAny && (
              <Button size='sm' onClick={() => setAdding(true)}>
                <Plus className='size-4' />
                Add bank account
              </Button>
            )}
            <Button
              size='sm'
              variant={hasAny ? 'outline' : 'default'}
              onClick={() => setEditing(true)}
            >
              {hasAny ? <Pencil className='size-4' /> : <Plus className='size-4' />}
              {hasAny ? 'Manage bank accounts' : 'Add bank account'}
            </Button>
          </div>
        )
      }
    >
      {!hasAny ? (
        <EmptyState
          icon={Landmark}
          title='No bank details yet'
          description={
            canBank
              ? 'Add a salary account so payroll can pay this person.'
              : 'Someone with bank access needs to add them.'
          }
          className='py-6'
        />
      ) : revealed && full.isError ? (
        <ErrorState message={full.error.message} onRetry={() => full.refetch()} className='py-6' />
      ) : (
        <div className='grid gap-4'>
          {bankList.map((item, index) => {
            const fullRecord = Array.isArray(full.data)
              ? full.data.find((d) => (item.id && d.id === item.id) || d.ifsc === item.ifsc)
              : full.data
            return (
              <div
                key={item.id ?? index}
                className='relative rounded-lg border bg-card p-4 shadow-sm'
              >
                <div className='mb-3 flex flex-wrap items-center justify-between gap-2 border-b pb-3'>
                  <div className='flex items-center gap-2'>
                    <span className='font-semibold text-foreground'>{orDash(item.bank_name)}</span>
                    {item.is_primary ? (
                      <Badge tone='success' className='flex items-center gap-1 text-xs'>
                        <Check className='size-3' />
                        Primary salary account
                      </Badge>
                    ) : (
                      canBank &&
                      item.id && (
                        <Button
                          size='sm'
                          variant='ghost'
                          disabled={setPrimary.isPending}
                          onClick={() => setPrimary.mutate(item.id!)}
                          className='h-6 px-2 text-xs text-muted-foreground hover:text-foreground'
                        >
                          <Star className='mr-1 size-3' />
                          Set as primary
                        </Button>
                      )
                    )}
                    {!item.complete && (
                      <Badge tone='warning' className='text-xs'>
                        Incomplete
                      </Badge>
                    )}
                  </div>
                  {canBank && item.id && bankList.length > 1 && (
                    <Button
                      size='icon-sm'
                      variant='ghost'
                      disabled={removeBank.isPending}
                      onClick={() => removeBank.mutate(item.id!)}
                      className='text-muted-foreground hover:text-destructive'
                    >
                      <Trash2 className='size-3.5' />
                    </Button>
                  )}
                </div>
                <DetailList
                  items={[
                    { label: 'Account holder', value: orDash(item.account_holder) },
                    { label: 'Bank', value: orDash(item.bank_name) },
                    { label: 'IFSC', value: orDash(item.ifsc), mono: true },
                    {
                      label: 'Account number',
                      mono: true,
                      value: revealed ? (
                        full.isPending ? (
                          <Skeleton className='h-5 w-36' />
                        ) : (
                          orDash(fullRecord?.account_no ?? item.account_masked)
                        )
                      ) : (
                        orDash(item.account_masked)
                      ),
                    },
                    {
                      label: 'PAN',
                      mono: true,
                      value: revealed ? (
                        full.isPending ? (
                          <Skeleton className='h-5 w-28' />
                        ) : (
                          orDash(fullRecord?.pan ?? item.pan_masked)
                        )
                      ) : (
                        orDash(item.pan_masked)
                      ),
                    },
                  ]}
                />
              </div>
            )
          })}
        </div>
      )}
      <BankModal staff={staff} open={editing} onOpenChange={setEditing} />
      <BankModal staff={staff} open={adding} onOpenChange={setAdding} addNew />
    </Section>
  )
}
