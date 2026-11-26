import { useState } from 'react'
import { CheckCircle2, Pencil, Plus, Syringe, Trash } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState, ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useStudentMutation } from '../api'
import {
  recordsApi,
  useHealth,
  type Health,
  type HealthInput,
  type Vaccination,
  type VaccinationInput,
} from '../records-api'
import { Block, Facts } from './student-parts'

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

export function HealthTab({ studentId, canManage }: { studentId: number; canManage: boolean }) {
  const health = useHealth(studentId)
  const [editing, setEditing] = useState(false)
  const [vaccine, setVaccine] = useState<Vaccination | 'new' | null>(null)
  const [removing, setRemoving] = useState<Vaccination | null>(null)
  const markGiven = useStudentMutation((item: Vaccination) =>
    recordsApi.updateVaccination(studentId, item.id, { given_on: today() })
  )
  const remove = useStudentMutation((id: number) => recordsApi.removeVaccination(studentId, id))

  if (health.isError)
    return <ErrorState message={health.error.message} onRetry={() => health.refetch()} />
  if (!health.data) return <Skeleton className='h-80' />
  const data = health.data
  const empty =
    !data.height_cm && !data.weight_kg && !data.allergies && !data.conditions && !data.medications

  return (
    <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'>
      <Card className='p-4 sm:p-5'>
        <Block
          title='Health record'
          action={
            canManage && (
              <Button
                variant='secondary'
                className={empty ? 'h-8 px-3 gap-1.5 border border-[#C6CEC9] bg-white text-[#171B19] hover:bg-[#F9FAFB] font-medium' : 'w-[85px] h-9 px-4 gap-2 border border-[#C6CEC9] bg-white text-[#171B19] hover:bg-[#F9FAFB] font-medium'}
                size={empty ? 'sm' : 'md'}
                onClick={() => setEditing(true)}
              >
                {empty ? (
                  <Plus className='size-4 stroke-[1.75]' />
                ) : (
                  <Pencil className='size-4 stroke-[1.75] text-[#3C4440] dark:text-slate-300' />
                )}
                {empty ? 'Add' : 'Edit'}
              </Button>
            )
          }
        >
          {(data.allergies || data.conditions) && (
            <div className='grid gap-1 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm'>
              {data.allergies && (
                <span>
                  <span className='font-bold text-destructive'>Allergies:</span> {data.allergies}
                </span>
              )}
              {data.conditions && (
                <span>
                  <span className='font-bold text-destructive'>Conditions:</span> {data.conditions}
                </span>
              )}
            </div>
          )}
          <Facts
            items={[
              ['Blood group', data.blood_group ?? '—'],
              ['Height', data.height_cm ? `${data.height_cm} cm` : '—'],
              ['Weight', data.weight_kg ? `${data.weight_kg} kg` : '—'],
              ['BMI', data.bmi ?? '—'],
              ['Medicines', data.medications ?? '—'],
              ['Vision', data.vision ?? '—'],
              [
                'Family doctor',
                [data.doctor_name, data.doctor_mobile && `+91 ${data.doctor_mobile}`]
                  .filter(Boolean)
                  .join(' · ') || '—',
              ],
              ['Last check-up', data.last_checkup_on ? formatDate(data.last_checkup_on) : '—'],
            ]}
          />
          {data.notes && <p className='rounded-lg bg-muted px-3 py-2 text-sm'>{data.notes}</p>}
        </Block>
      </Card>

      <Card className='p-4 sm:p-5'>
        <Block
          title='Vaccinations'
          action={
            canManage && (
              <Button size='sm' variant='secondary' onClick={() => setVaccine('new')}>
                <Plus className='size-4 stroke-[1.75]' />
                Add
              </Button>
            )
          }
        >
          {data.vaccinations.length === 0 ? (
            <EmptyState
              icon={Syringe}
              title='No vaccinations recorded'
              description='Add given and upcoming doses to see what is due.'
              className='border-dashed'
            />
          ) : (
            <ul className='grid gap-2'>
              {data.vaccinations.map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    'flex flex-wrap items-center gap-3 rounded-lg border p-3',
                    item.overdue && 'border-warning/40 bg-warning/5'
                  )}
                >
                  <span
                    className={cn(
                      'grid size-9 shrink-0 place-items-center rounded-lg',
                      item.given_on ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                    )}
                  >
                    {item.given_on ? (
                      <CheckCircle2 className='size-4' />
                    ) : (
                      <Syringe className='size-4' />
                    )}
                  </span>
                  <span className='grid min-w-0 flex-1'>
                    <span className='font-semibold'>
                      {item.vaccine}
                      {item.dose ? (
                        <span className='font-normal text-muted-foreground'> · {item.dose}</span>
                      ) : null}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      {item.given_on
                        ? `Given ${formatDate(item.given_on)}`
                        : item.due_on
                          ? `Due ${formatDate(item.due_on)}`
                          : 'No date'}
                    </span>
                  </span>
                  {item.overdue && <Badge tone='warning'>Overdue</Badge>}
                  {canManage && (
                    <span className='flex gap-1'>
                      {!item.given_on && (
                        <Button
                          size='sm'
                          variant='secondary'
                          loading={markGiven.isPending && markGiven.variables?.id === item.id}
                          onClick={async () => {
                            try {
                              await markGiven.mutateAsync(item)
                              alerts.success(`${item.vaccine} marked as given today`)
                            } catch (error) {
                              alerts.error(toApiError(error).message)
                            }
                          }}
                        >
                          Mark given
                        </Button>
                      )}
                      <Button
                        size='icon-sm'
                        variant='outline'
                        aria-label={`Edit ${item.vaccine}`}
                        title='Edit'
                        className='size-8 border border-[#EDF0EE] bg-white text-[#3C4440] hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                        onClick={() => setVaccine(item)}
                      >
                        <Pencil className='size-4 stroke-[1.75]' />
                      </Button>
                      <Button
                        size='icon-sm'
                        variant='outline'
                        aria-label={`Delete ${item.vaccine}`}
                        title='Delete'
                        className='size-8 border border-[#FDA29B] text-[#D92D20] bg-white hover:bg-rose-50 dark:border-rose-900 dark:bg-card dark:text-rose-400 dark:hover:bg-rose-950/50'
                        onClick={() => setRemoving(item)}
                      >
                        <Trash className='size-4 stroke-[1.75]' />
                      </Button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Block>
      </Card>

      {editing && (
        <HealthModal studentId={studentId} health={data} onClose={() => setEditing(false)} />
      )}
      {vaccine && (
        <VaccinationModal
          studentId={studentId}
          vaccination={vaccine === 'new' ? undefined : vaccine}
          onClose={() => setVaccine(null)}
        />
      )}
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Delete ${removing?.vaccine ?? ''}?`}
        description='The entry is removed from the vaccination log.'
        confirmText='Delete'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          if (!removing) return
          try {
            await remove.mutateAsync(removing.id)
            alerts.success(`${removing.vaccine} deleted`)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
          setRemoving(null)
        }}
      />
    </div>
  )
}

function HealthModal({
  studentId,
  health,
  onClose,
}: {
  studentId: number
  health: Health
  onClose: () => void
}) {
  const [draft, setDraft] = useState({
    height_cm: health.height_cm ? String(health.height_cm) : '',
    weight_kg: health.weight_kg ? String(health.weight_kg) : '',
    allergies: health.allergies ?? '',
    conditions: health.conditions ?? '',
    medications: health.medications ?? '',
    vision: health.vision ?? '',
    doctor_name: health.doctor_name ?? '',
    doctor_mobile: health.doctor_mobile ?? '',
    last_checkup_on: health.last_checkup_on ?? '',
    notes: health.notes ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useStudentMutation((input: HealthInput) => recordsApi.saveHealth(studentId, input))
  const set = (field: keyof typeof draft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }
  const text = (value: string) => value.trim() || null
  const number = (value: string) => (value.trim() ? Number(value) : null)

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Health record'
      description='Allergies and conditions are shown in red on the student profile.'
      formId='health-form'
      submitText='Save'
      loading={save.isPending}
      size='lg'
    >
      <form
        id='health-form'
        noValidate
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={async (event) => {
          event.preventDefault()
          const next: Record<string, string> = {}
          if (
            draft.height_cm &&
            !(Number(draft.height_cm) >= 30 && Number(draft.height_cm) <= 250)
          ) {
            next.height_cm = 'Height in cm, 30 to 250'
          }
          if (
            draft.weight_kg &&
            !(Number(draft.weight_kg) >= 5 && Number(draft.weight_kg) <= 200)
          ) {
            next.weight_kg = 'Weight in kg, 5 to 200'
          }
          if (draft.doctor_mobile && !/^[6-9]\d{9}$/.test(draft.doctor_mobile)) {
            next.doctor_mobile = 'Enter a valid 10-digit mobile number'
          }
          setErrors(next)
          if (Object.keys(next).length) return
          try {
            await save.mutateAsync({
              height_cm: number(draft.height_cm),
              weight_kg: number(draft.weight_kg),
              allergies: text(draft.allergies),
              conditions: text(draft.conditions),
              medications: text(draft.medications),
              vision: text(draft.vision),
              doctor_name: text(draft.doctor_name),
              doctor_mobile: text(draft.doctor_mobile),
              last_checkup_on: draft.last_checkup_on || null,
              notes: text(draft.notes),
            })
            alerts.success('Health record saved')
            onClose()
          } catch (error) {
            const apiError = toApiError(error)
            setErrors(
              Object.fromEntries(apiError.fieldErrors.map((item) => [item.field, item.message]))
            )
            if (!apiError.fieldErrors.length) alerts.error(apiError.message)
          }
        }}
      >
        <FormField id='health-height' label='Height (cm)' error={errors.height_cm}>
          <Input
            id='health-height'
            inputMode='decimal'
            value={draft.height_cm}
            onChange={(event) => set('height_cm', event.target.value.replace(/[^\d.]/g, ''))}
          />
        </FormField>
        <FormField id='health-weight' label='Weight (kg)' error={errors.weight_kg}>
          <Input
            id='health-weight'
            inputMode='decimal'
            value={draft.weight_kg}
            onChange={(event) => set('weight_kg', event.target.value.replace(/[^\d.]/g, ''))}
          />
        </FormField>
        <FormField
          id='health-allergies'
          label='Allergies'
          className='sm:col-span-2'
          error={errors.allergies}
        >
          <Input
            id='health-allergies'
            placeholder='Peanuts, dust'
            value={draft.allergies}
            onChange={(event) => set('allergies', event.target.value)}
          />
        </FormField>
        <FormField id='health-conditions' label='Conditions' error={errors.conditions}>
          <Input
            id='health-conditions'
            placeholder='Mild asthma'
            value={draft.conditions}
            onChange={(event) => set('conditions', event.target.value)}
          />
        </FormField>
        <FormField id='health-medications' label='Medicines' error={errors.medications}>
          <Input
            id='health-medications'
            value={draft.medications}
            onChange={(event) => set('medications', event.target.value)}
          />
        </FormField>
        <FormField id='health-vision' label='Vision' error={errors.vision}>
          <Input
            id='health-vision'
            placeholder='6/6'
            value={draft.vision}
            onChange={(event) => set('vision', event.target.value)}
          />
        </FormField>
        <FormField id='health-checkup' label='Last check-up' error={errors.last_checkup_on}>
          <Input
            id='health-checkup'
            type='date'
            value={draft.last_checkup_on}
            onChange={(event) => set('last_checkup_on', event.target.value)}
          />
        </FormField>
        <FormField id='health-doctor' label='Family doctor' error={errors.doctor_name}>
          <Input
            id='health-doctor'
            value={draft.doctor_name}
            onChange={(event) => set('doctor_name', event.target.value)}
          />
        </FormField>
        <FormField id='health-doctor-mobile' label='Doctor mobile' error={errors.doctor_mobile}>
          <Input
            id='health-doctor-mobile'
            type='tel'
            inputMode='numeric'
            maxLength={10}
            value={draft.doctor_mobile}
            onChange={(event) =>
              set('doctor_mobile', event.target.value.replace(/\D/g, '').slice(-10))
            }
          />
        </FormField>
        <FormField
          id='health-notes'
          label='Notes for teachers'
          className='sm:col-span-2'
          error={errors.notes}
        >
          <Input
            id='health-notes'
            value={draft.notes}
            onChange={(event) => set('notes', event.target.value)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}

function VaccinationModal({
  studentId,
  vaccination,
  onClose,
}: {
  studentId: number
  vaccination?: Vaccination
  onClose: () => void
}) {
  const [draft, setDraft] = useState({
    vaccine: vaccination?.vaccine ?? '',
    dose: vaccination?.dose ?? '',
    given_on: vaccination?.given_on ?? '',
    due_on: vaccination?.due_on ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const save = useStudentMutation((input: VaccinationInput) =>
    vaccination
      ? recordsApi.updateVaccination(studentId, vaccination.id, input)
      : recordsApi.addVaccination(studentId, input)
  )
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={vaccination ? `Edit ${vaccination.vaccine}` : 'Add vaccination'}
      description='Leave “given on” empty for a dose that is still due.'
      formId='vaccination-form'
      submitText='Save'
      loading={save.isPending}
    >
      <form
        id='vaccination-form'
        noValidate
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={async (event) => {
          event.preventDefault()
          if (draft.vaccine.trim().length < 2) {
            setError('Enter the vaccine name')
            return
          }
          try {
            await save.mutateAsync({
              vaccine: draft.vaccine.trim(),
              dose: draft.dose.trim() || null,
              given_on: draft.given_on || null,
              due_on: draft.due_on || null,
            })
            alerts.success('Vaccination saved')
            onClose()
          } catch (caught) {
            setError(toApiError(caught).message)
          }
        }}
      >
        <FormField id='vaccine-name' label='Vaccine' required error={error ?? undefined}>
          <Input
            id='vaccine-name'
            autoFocus
            placeholder='MMR'
            value={draft.vaccine}
            onChange={(event) => setDraft({ ...draft, vaccine: event.target.value })}
          />
        </FormField>
        <FormField id='vaccine-dose' label='Dose'>
          <Input
            id='vaccine-dose'
            placeholder='Booster'
            value={draft.dose}
            onChange={(event) => setDraft({ ...draft, dose: event.target.value })}
          />
        </FormField>
        <FormField id='vaccine-given' label='Given on'>
          <Input
            id='vaccine-given'
            type='date'
            value={draft.given_on}
            onChange={(event) => setDraft({ ...draft, given_on: event.target.value })}
          />
        </FormField>
        <FormField id='vaccine-due' label='Next dose due'>
          <Input
            id='vaccine-due'
            type='date'
            value={draft.due_on}
            onChange={(event) => setDraft({ ...draft, due_on: event.target.value })}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
