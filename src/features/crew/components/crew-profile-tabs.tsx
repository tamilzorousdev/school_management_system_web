import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  BadgeCheck,
  BellRing,
  Bus,
  CircleAlert,
  CircleCheck,
  FileText,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import { DetailList, EmptyState } from '@/components/common/display'
import { AddDocumentModal, DocumentList } from '@/components/common/document-list'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Section } from '@/features/setup/components/setup-shared'
import { GENDER_LABELS, LANGUAGE_OPTIONS } from '@/features/staff/labels'
import { ExpiryBadge } from '@/features/transport/components/expiry-badges'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { crewApi, useCrewMutation, type CrewCheck, type CrewDetail } from '../api'
import { CREW_DOCUMENT_TYPES, DOCUMENT_STATE, DUTY_STATUS, LICENCE_TYPE_LABELS } from '../labels'

const orDash = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === '' ? '—' : value

interface ClearanceTabProps {
  member: CrewDetail
  canManage: boolean
  hasDue: boolean
  onApprove: () => void
  onRemind: () => void
  onEdit: () => void
}

export function ClearanceTab({
  member,
  canManage,
  hasDue,
  onApprove,
  onRemind,
  onEdit,
}: ClearanceTabProps) {
  const [uploading, setUploading] = useState<CrewCheck | null>(null)
  const add = useCrewMutation((input: { type: string; title: string; file_id: number }) =>
    crewApi.addDocument(member.id, input)
  )
  const verify = useCrewMutation((documentId: number) =>
    crewApi.verifyDocument(member.id, documentId, 'verified', null)
  )
  const failing = member.checks.filter((check) => !check.clear).length

  const verifyNow = async (check: CrewCheck) => {
    if (!check.document_id) return
    try {
      await verify.mutateAsync(check.document_id)
      alerts.success(`${check.label} verified`)
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  return (
    <div className='grid gap-6 xl:grid-cols-[3fr_2fr]'>
      <Section
        title='Clearance for duty'
        description='Each document must be uploaded, verified and in date before the person can run a bus.'
        action={
          canManage && (
            <div className='flex flex-wrap gap-2'>
              {hasDue && (
                <Button size='sm' variant='outline' onClick={onRemind}>
                  <BellRing />
                  Send reminder
                </Button>
              )}
              {member.duty_status !== 'approved' && (
                <Button size='sm' onClick={onApprove} disabled={!member.clear}>
                  <ShieldCheck />
                  Approve for duty
                </Button>
              )}
            </div>
          )
        }
      >
        <ul className='grid divide-y rounded-xl border'>
          {member.checks.map((check) => (
            <li key={check.kind} className='flex flex-wrap items-center gap-3 px-3 py-3'>
              <span
                className={cn(
                  'grid size-9 shrink-0 place-items-center rounded-lg',
                  check.clear ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                )}
              >
                {check.clear ? (
                  <CircleCheck className='size-4' />
                ) : (
                  <CircleAlert className='size-4' />
                )}
              </span>
              <span className='grid min-w-0 flex-1 gap-1'>
                <span className='font-semibold'>{check.label}</span>
                <span className='flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground'>
                  <Badge tone={DOCUMENT_STATE[check.document_status].tone}>
                    {DOCUMENT_STATE[check.document_status].label}
                  </Badge>
                  <ExpiryBadge item={check.expiry} withKind={false} />
                  {check.expiry.date && <span>valid till {formatDate(check.expiry.date)}</span>}
                </span>
                {check.problem && (
                  <span className='text-xs font-medium text-warning'>{check.problem}</span>
                )}
              </span>
              {canManage && (
                <span className='flex flex-wrap gap-2'>
                  {(check.document_status === 'missing' ||
                    check.document_status === 'rejected' ||
                    check.expiry.state === 'expired') && (
                    <Button size='sm' variant='outline' onClick={() => setUploading(check)}>
                      <Upload />
                      Upload
                    </Button>
                  )}
                  {check.document_status === 'pending' && (
                    <Button
                      size='sm'
                      variant='outline'
                      loading={verify.isPending && verify.variables === check.document_id}
                      onClick={() => verifyNow(check)}
                    >
                      <BadgeCheck />
                      Mark verified
                    </Button>
                  )}
                  {(check.expiry.state === 'missing' || check.expiry.state === 'expired') && (
                    <Button size='sm' variant='ghost' onClick={onEdit}>
                      {check.expiry.state === 'missing' ? 'Add date' : 'Update date'}
                    </Button>
                  )}
                </span>
              )}
            </li>
          ))}
        </ul>
        <p className='mt-3 text-xs text-muted-foreground'>
          {failing
            ? `${failing} ${failing === 1 ? 'check needs' : 'checks need'} attention. Open a document in the Documents tab to view it or reject it with a reason.`
            : member.duty_status === 'approved'
              ? 'Everything is in order.'
              : 'Every check is clear. Approve them for duty so they can be put on a bus.'}
        </p>
      </Section>

      <Section title='Duty status'>
        <div className='grid gap-4'>
          <div className='flex items-center gap-3'>
            <Badge tone={DUTY_STATUS[member.duty_status].tone} dot>
              {DUTY_STATUS[member.duty_status].label}
            </Badge>
            <span className='text-sm text-muted-foreground'>
              {DUTY_STATUS[member.duty_status].hint}
            </span>
          </div>
          <DetailList
            items={[
              {
                label: 'Approved by',
                value: member.approved_by
                  ? `${member.approved_by.name} · ${formatDateTime(member.approved_at)}`
                  : 'Not approved yet',
              },
              {
                label: 'Earliest expiry at approval',
                value: formatDate(member.approved_until),
              },
              {
                label: 'Last reminder',
                value: member.last_reminded_at
                  ? `${formatDateTime(member.last_reminded_at)}${member.last_reminded_by ? ` by ${member.last_reminded_by.name}` : ''}`
                  : 'None sent',
              },
            ]}
          />
        </div>
      </Section>

      {uploading && (
        <AddDocumentModal
          types={CREW_DOCUMENT_TYPES}
          initialType={uploading.document_type}
          purpose='staff_document'
          parentVisibility={false}
          onClose={() => setUploading(null)}
          onAdd={add.mutateAsync}
        />
      )}
    </div>
  )
}

export function ProfileTab({ member }: { member: CrewDetail }) {
  const driver = member.role === 'driver'
  return (
    <div className='grid gap-6 xl:grid-cols-[3fr_2fr]'>
      <Section title='Details'>
        <DetailList
          items={[
            { label: 'Employee number', value: member.employee_no, mono: true },
            { label: 'Designation', value: member.designation },
            { label: 'Mobile', value: `+91 ${member.mobile}` },
            { label: 'Email', value: orDash(member.email) },
            {
              label: 'App language',
              value:
                LANGUAGE_OPTIONS.find((option) => option.value === member.language)?.label ?? '—',
            },
            { label: 'Gender', value: member.gender ? GENDER_LABELS[member.gender] : '—' },
            { label: 'Date of birth', value: formatDate(member.dob) },
            { label: 'Joined on', value: formatDate(member.joining_date) },
            {
              label: 'Experience before joining',
              value: `${member.prior_experience_years} ${member.prior_experience_years === 1 ? 'year' : 'years'}`,
            },
            ...(member.left_on ? [{ label: 'Left on', value: formatDate(member.left_on) }] : []),
            { label: 'Address', value: orDash(member.address) },
            {
              label: 'Emergency contact',
              value: member.emergency_contact_name
                ? `${member.emergency_contact_name}${member.emergency_contact_mobile ? ` · +91 ${member.emergency_contact_mobile}` : ''}`
                : orDash(
                    member.emergency_contact_mobile && `+91 ${member.emergency_contact_mobile}`
                  ),
            },
          ]}
        />
      </Section>
      <div className='grid content-start gap-6'>
        {driver && (
          <Section title='Driving licence and badge'>
            <DetailList
              items={[
                { label: 'Licence number', value: orDash(member.licence_no), mono: true },
                {
                  label: 'Licence type',
                  value: member.licence_type ? LICENCE_TYPE_LABELS[member.licence_type] : '—',
                },
                { label: 'Issued on', value: formatDate(member.licence_issued_on) },
                { label: 'Valid till', value: formatDate(member.licence_expiry) },
                { label: 'PSV badge number', value: orDash(member.badge_no), mono: true },
                { label: 'Badge valid till', value: formatDate(member.badge_expiry) },
              ]}
            />
          </Section>
        )}
        <Section title='Medical and police checks'>
          <DetailList
            items={[
              {
                label: 'Medical fitness valid till',
                value: formatDate(member.medical_fitness_expiry),
              },
              { label: 'Police verification on', value: formatDate(member.police_verified_on) },
              {
                label: 'Police verification valid till',
                value: formatDate(member.police_verification_expiry),
              },
            ]}
          />
        </Section>
        <Section
          title='Bus'
          action={
            <Button size='sm' variant='outline' asChild>
              <Link to='/transport' search={{ tab: 'buses' }}>
                <Bus />
                Buses and routes
              </Link>
            </Button>
          }
        >
          {member.vehicle ? (
            <DetailList
              items={[
                { label: 'Bus', value: member.vehicle.name, mono: true },
                { label: 'Route', value: member.route?.name ?? 'No route yet' },
              ]}
            />
          ) : (
            <EmptyState
              icon={Bus}
              title='Not on a bus'
              description='Assign them from the bus form in Buses and routes once they are approved for duty.'
              className='py-6'
            />
          )}
        </Section>
      </div>
    </div>
  )
}

export function DocumentsTab({ member, canManage }: { member: CrewDetail; canManage: boolean }) {
  const add = useCrewMutation((input: { type: string; title: string; file_id: number }) =>
    crewApi.addDocument(member.id, input)
  )
  const verify = useCrewMutation(
    (input: { id: number; status: 'verified' | 'rejected'; remarks: string | null }) =>
      crewApi.verifyDocument(member.id, input.id, input.status, input.remarks)
  )
  const remove = useCrewMutation((documentId: number) =>
    crewApi.removeDocument(member.id, documentId)
  )
  return (
    <Section
      title='Documents'
      description='Licence, PSV badge, medical certificate, police verification and ID. A new licence, badge, medical or police copy takes them off duty until approved again.'
    >
      {member.documents.length === 0 && !canManage ? (
        <EmptyState icon={FileText} title='No documents yet' className='py-6' />
      ) : (
        <DocumentList
          documents={member.documents}
          types={CREW_DOCUMENT_TYPES}
          canManage={canManage}
          purpose='staff_document'
          parentVisibility={false}
          onAdd={add.mutateAsync}
          onVerify={(id, status, remarks) => verify.mutateAsync({ id, status, remarks })}
          onDelete={remove.mutateAsync}
        />
      )}
    </Section>
  )
}
