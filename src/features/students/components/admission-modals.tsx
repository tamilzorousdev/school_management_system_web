import { useState, type FormEvent } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Input, Textarea } from '@/components/ui/input'
import { useClasses, useSections } from '@/features/setup/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  studentsApi,
  useStudentMutation,
  type Admission,
  type AdmissionInput,
  type Gender,
  type Relation,
} from '../api'
import { GENDER_LABELS, RELATION_LABELS, toOptions } from '../labels'

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ta', label: 'தமிழ் (Tamil)' },
]

export function ApplicationModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const save = useStudentMutation((input: AdmissionInput) => studentsApi.createAdmission(input))
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='New application'
      description='An application number is created. Approve it, then enrol to create the student and invite the parent.'
      formId='application-form'
      submitText='Save application'
      loading={save.isPending}
      size='lg'
    >
      {open && <ApplicationForm save={save.mutateAsync} onDone={() => onOpenChange(false)} />}
    </AppModal>
  )
}

function ApplicationForm({
  save,
  onDone,
}: {
  save: (input: AdmissionInput) => Promise<Admission>
  onDone: () => void
}) {
  const classes = useClasses()
  const [draft, setDraft] = useState({
    class_id: '',
    emis_number: '',
    first_name: '',
    last_name: '',
    dob: '',
    gender: '',
    guardian_name: '',
    guardian_mobile: '',
    guardian_relation: 'father',
    guardian_email: '',
    previous_school: '',
    identification_marks: '',
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (field: keyof typeof draft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!draft.class_id) next.class_id = 'Choose the class applied for'
    if (!draft.first_name.trim()) next.first_name = 'Enter the first name'
    if (!draft.dob) next.dob = 'Enter the date of birth'
    if (!draft.gender) next.gender = 'Choose a gender'
    if (draft.guardian_name.trim().length < 2) next.guardian_name = 'Enter the parent name'
    if (!/^[6-9]\d{9}$/.test(draft.guardian_mobile))
      next.guardian_mobile = 'Enter a valid 10-digit mobile number'
    setErrors(next)
    if (Object.keys(next).length) return
    try {
      const admission = await save({
        class_id: Number(draft.class_id),
        emis_number: draft.emis_number.trim() || null,
        first_name: draft.first_name.trim(),
        last_name: draft.last_name.trim() || null,
        dob: draft.dob,
        gender: draft.gender as Gender,
        guardian_name: draft.guardian_name.trim(),
        guardian_mobile: draft.guardian_mobile,
        guardian_relation: draft.guardian_relation as Relation,
        guardian_email: draft.guardian_email.trim() || null,
        previous_school: draft.previous_school.trim() || null,
        identification_marks: draft.identification_marks.trim() || null,
        notes: draft.notes.trim() || null,
      })
      alerts.success(`Application ${admission.application_no} saved`)
      onDone()
    } catch (error) {
      const apiError = toApiError(error)
      const fieldErrors = Object.fromEntries(
        apiError.fieldErrors.map((item) => [item.field, item.message])
      )
      setErrors(Object.keys(fieldErrors).length ? fieldErrors : { root: apiError.message })
    }
  }

  return (
    <form id='application-form' noValidate onSubmit={submit} className='grid gap-5'>
      {errors.root && (
        <p role='alert' className='text-sm font-medium text-destructive'>
          {errors.root}
        </p>
      )}
      <section className='grid gap-3'>
        <h3 className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>Child</h3>
        <div className='grid gap-3 sm:grid-cols-2'>
          <FormField id='app-first' label='First name' required error={errors.first_name}>
            <Input
              id='app-first'
              autoFocus
              value={draft.first_name}
              onChange={(event) => set('first_name', event.target.value)}
            />
          </FormField>
          <FormField id='app-last' label='Last name / initial'>
            <Input
              id='app-last'
              value={draft.last_name}
              onChange={(event) => set('last_name', event.target.value)}
            />
          </FormField>
          <FormField id='app-dob' label='Date of birth' required error={errors.dob}>
            <Input
              id='app-dob'
              type='date'
              value={draft.dob}
              onChange={(event) => set('dob', event.target.value)}
            />
          </FormField>
          <FormField id='app-gender' label='Gender' required error={errors.gender}>
            <Combobox
              id='app-gender'
              label='Gender'
              value={draft.gender || undefined}
              placeholder='Choose gender'
              options={toOptions(GENDER_LABELS)}
              onChange={(value) => set('gender', value ?? '')}
              invalid={Boolean(errors.gender)}
              highlightSelected={false}
              className='sm:w-full'
            />
          </FormField>
          <FormField id='app-class' label='Class applied for' required error={errors.class_id}>
            <Combobox
              id='app-class'
              label='Class'
              value={draft.class_id || undefined}
              placeholder='Choose class'
              options={(classes.data ?? []).map((item) => ({
                value: String(item.id),
                label: `Class ${item.name}`,
              }))}
              onChange={(value) => set('class_id', value ?? '')}
              invalid={Boolean(errors.class_id)}
              highlightSelected={false}
              className='sm:w-full'
            />
          </FormField>
          <FormField id='app-emis' label='EMIS number' hint='Optional state EMIS ID'>
            <Input
              id='app-emis'
              maxLength={50}
              placeholder='e.g. 33020100101'
              value={draft.emis_number}
              onChange={(event) => set('emis_number', event.target.value)}
            />
          </FormField>
          <FormField id='app-previous' label='Previous school'>
            <Input
              id='app-previous'
              value={draft.previous_school}
              onChange={(event) => set('previous_school', event.target.value)}
            />
          </FormField>
          <FormField
            id='app-marks'
            label='Identification marks'
            hint='Birth marks, moles or scars. Printed on the TC.'
            className='sm:col-span-2'
          >
            <Input
              id='app-marks'
              maxLength={255}
              placeholder='e.g. A mole on the left cheek, a scar on the right thumb'
              value={draft.identification_marks}
              onChange={(event) => set('identification_marks', event.target.value)}
            />
          </FormField>
        </div>
      </section>
      <section className='grid gap-3'>
        <h3 className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>Parent</h3>
        <div className='grid gap-3 sm:grid-cols-2'>
          <FormField id='app-guardian' label='Parent name' required error={errors.guardian_name}>
            <Input
              id='app-guardian'
              value={draft.guardian_name}
              onChange={(event) => set('guardian_name', event.target.value)}
            />
          </FormField>
          <FormField id='app-mobile' label='Mobile' required error={errors.guardian_mobile}>
            <div className='flex'>
              <span className='inline-flex h-9 items-center rounded-l-md border border-r-0 border-input bg-muted px-2.5 text-sm font-semibold text-muted-foreground'>
                +91
              </span>
              <Input
                id='app-mobile'
                type='tel'
                inputMode='numeric'
                maxLength={10}
                className='tabular rounded-l-none'
                value={draft.guardian_mobile}
                onChange={(event) =>
                  set('guardian_mobile', event.target.value.replace(/\D/g, '').slice(-10))
                }
              />
            </div>
          </FormField>
          <FormField id='app-relation' label='Relation' required>
            <Combobox
              id='app-relation'
              label='Relation'
              value={draft.guardian_relation}
              placeholder='Choose relation'
              options={toOptions(RELATION_LABELS)}
              onChange={(value) => set('guardian_relation', value ?? 'father')}
              highlightSelected={false}
              className='sm:w-full'
            />
          </FormField>
          <FormField id='app-email' label='Email'>
            <Input
              id='app-email'
              type='email'
              value={draft.guardian_email}
              onChange={(event) => set('guardian_email', event.target.value)}
            />
          </FormField>
        </div>
        <FormField id='app-notes' label='Notes'>
          <Textarea
            id='app-notes'
            rows={2}
            value={draft.notes}
            onChange={(event) => set('notes', event.target.value)}
          />
        </FormField>
      </section>
    </form>
  )
}

export function EnrolModal({
  admission,
  onOpenChange,
}: {
  admission: Admission | null
  onOpenChange: (open: boolean) => void
}) {
  const [sectionId, setSectionId] = useState<string>('')
  const [language, setLanguage] = useState('en')
  const sections = useSections(admission?.class.id, Boolean(admission))
  const enrol = useStudentMutation(() =>
    studentsApi.enrol(admission!.id, {
      section_id: sectionId ? Number(sectionId) : null,
      language: language as 'en' | 'ta',
    })
  )

  return (
    <AppModal
      open={Boolean(admission)}
      onOpenChange={onOpenChange}
      title={`Enrol ${admission?.full_name ?? ''}`}
      description={`Creates the student in class ${admission?.class.name ?? ''}, links ${admission?.guardian_name ?? 'the parent'} and sends a Parent app invite to +91 ${admission?.guardian_mobile ?? ''}.`}
      formId='enrol-form'
      submitText='Enrol student'
      loading={enrol.isPending}
    >
      <form
        id='enrol-form'
        noValidate
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={async (event) => {
          event.preventDefault()
          try {
            const result = await enrol.mutateAsync(undefined)
            alerts.success(`${result.full_name} enrolled`, {
              description: `Admission number ${result.admission_no}`,
            })
            onOpenChange(false)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      >
        <FormField id='enrol-section' label='Section' hint='Optional; can be set later'>
          <Combobox
            id='enrol-section'
            label='Section'
            value={sectionId || undefined}
            placeholder='No section yet'
            allLabel='No section yet'
            options={(sections.data ?? []).map((item) => ({
              value: String(item.id),
              label: `Section ${item.name}`,
              hint: `${item.student_count}/${item.capacity}`,
            }))}
            onChange={(value) => setSectionId(value ?? '')}
            highlightSelected={false}
            className='sm:w-full'
          />
        </FormField>
        <FormField id='enrol-language' label='Parent language' hint='App and messages'>
          <Combobox
            id='enrol-language'
            label='Parent language'
            value={language}
            placeholder='Choose language'
            options={LANGUAGE_OPTIONS}
            onChange={(value) => setLanguage(value ?? 'en')}
            highlightSelected={false}
            className='sm:w-full'
          />
        </FormField>
      </form>
    </AppModal>
  )
}

export function RejectModal({
  admission,
  onOpenChange,
}: {
  admission: Admission | null
  onOpenChange: (open: boolean) => void
}) {
  const [note, setNote] = useState('')
  const reject = useStudentMutation(() => studentsApi.reject(admission!.id, note))
  return (
    <AppModal
      open={Boolean(admission)}
      onOpenChange={onOpenChange}
      title={`Reject ${admission?.full_name ?? ''}?`}
      description='The reason is kept with the application.'
      formId='reject-form'
      submitText='Reject application'
      loading={reject.isPending}
    >
      <form
        id='reject-form'
        noValidate
        className='grid gap-3'
        onSubmit={async (event) => {
          event.preventDefault()
          try {
            await reject.mutateAsync(undefined)
            alerts.success('Application rejected')
            setNote('')
            onOpenChange(false)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      >
        <FormField id='reject-note' label='Reason'>
          <Textarea
            id='reject-note'
            rows={3}
            autoFocus
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
