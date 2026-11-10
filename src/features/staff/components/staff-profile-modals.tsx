import { useEffect, useState, type FormEvent } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { RootError } from '@/features/setup/components/setup-shared'
import { fieldErrorsOf } from '@/features/setup/form-actions'
import { alerts } from '@/lib/alerts'
import { cn } from '@/lib/utils'
import {
  staffApi,
  useStaffBank,
  useStaffMutation,
  type BankDetails,
  type BankInput,
  type QualificationInput,
  type StaffDetail,
} from '../api'
import {
  toQualificationDrafts,
  toQualificationInputs,
  validateQualifications,
  type QualificationDraft,
} from '../qualification-draft'
import { QualificationsEditor } from './qualifications-editor'

const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/
const ACCOUNT_NO = /^\d{9,18}$/
const PAN = /^[A-Z]{5}\d{4}[A-Z]$/

export function QualificationsModal({
  staff,
  open,
  onOpenChange,
}: {
  staff: StaffDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const save = useStaffMutation((items: QualificationInput[]) =>
    staffApi.qualifications(staff.id, items)
  )
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Edit qualifications'
      description='Degrees and certificates, newest first. Empty rows are skipped.'
      formId='qualifications-form'
      size='lg'
      loading={save.isPending}
    >
      {open && (
        <QualificationsForm
          staff={staff}
          save={save.mutateAsync}
          onDone={() => onOpenChange(false)}
        />
      )}
    </AppModal>
  )
}

function QualificationsForm({
  staff,
  save,
  onDone,
}: {
  staff: StaffDetail
  save: (items: QualificationInput[]) => Promise<StaffDetail>
  onDone: () => void
}) {
  const [rows, setRows] = useState<QualificationDraft[]>(() =>
    toQualificationDrafts(staff.qualifications)
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next = validateQualifications(rows, 'items')
    setErrors(next)
    if (Object.keys(next).length) return
    try {
      await save(toQualificationInputs(rows))
      alerts.success('Qualifications saved')
      onDone()
    } catch (error) {
      setErrors(fieldErrorsOf(error))
    }
  }

  return (
    <form id='qualifications-form' onSubmit={submit} noValidate className='grid gap-4'>
      <RootError message={errors.root} />
      <QualificationsEditor
        value={rows}
        prefix='items'
        errors={errors}
        onChange={(next) => {
          setRows(next)
          setErrors({})
        }}
      />
    </form>
  )
}

export function BankModal({
  staff,
  open,
  onOpenChange,
  addNew = false,
}: {
  staff: StaffDetail
  open: boolean
  onOpenChange: (open: boolean) => void
  addNew?: boolean
}) {
  const hasAccounts = Boolean(staff.bank.complete || (staff.banks && staff.banks.length > 0))
  const current = useStaffBank(staff.id, open && hasAccounts)
  const save = useStaffMutation((input: BankInput[]) => staffApi.saveBank(staff.id, input))
  const loading = hasAccounts && current.isPending

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={
        hasAccounts
          ? addNew
            ? 'Add another bank account'
            : 'Manage bank accounts'
          : 'Add bank account'
      }
      description='Used for salary payments. Select which account is primary for payroll.'
      formId='bank-form'
      loading={save.isPending}
      size='lg'
    >
      {open &&
        (loading ? (
          <div className='grid gap-3'>
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className='h-14' />
            ))}
          </div>
        ) : (
          <BankForm
            initial={current.data}
            addNew={addNew}
            fallbackName={staff.name}
            save={save.mutateAsync}
            onDone={() => onOpenChange(false)}
          />
        ))}
    </AppModal>
  )
}

function BankForm({
  initial,
  addNew,
  fallbackName,
  save,
  onDone,
}: {
  initial?: BankDetails[] | BankDetails
  addNew: boolean
  fallbackName: string
  save: (input: BankInput[]) => Promise<StaffDetail>
  onDone: () => void
}) {
  const [drafts, setDrafts] = useState<BankInput[]>(() => {
    const list = Array.isArray(initial) ? initial : initial ? [initial] : []
    if (list.length > 0) {
      const existing = list.map((item, idx) => ({
        id: item.id,
        account_holder: item.account_holder ?? fallbackName,
        bank_name: item.bank_name ?? '',
        ifsc: item.ifsc ?? '',
        account_no: item.account_no ?? '',
        pan: item.pan ?? '',
        is_primary: item.is_primary ?? idx === 0,
      }))
      if (!addNew) return existing
      return [
        ...existing,
        {
          account_holder: fallbackName,
          bank_name: '',
          ifsc: '',
          account_no: '',
          pan: '',
          is_primary: false,
        },
      ]
    }
    return [
      {
        account_holder: fallbackName,
        bank_name: '',
        ifsc: '',
        account_no: '',
        pan: '',
        is_primary: true,
      },
    ]
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const [focusIndex] = useState(() => (addNew ? drafts.length - 1 : null))

  useEffect(() => {
    if (focusIndex === null) return
    const field = document.getElementById(`bank_name_${focusIndex}`)
    field?.scrollIntoView({ block: 'center' })
    field?.focus()
  }, [focusIndex])

  const updateDraft = (index: number, field: keyof BankInput, value: unknown) => {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[`${index}.${field}`]
      delete next.root
      return next
    })
  }

  const setPrimary = (index: number) => {
    setDrafts((prev) =>
      prev.map((d, i) => ({
        ...d,
        is_primary: i === index,
      }))
    )
  }

  const addAccount = () => {
    setDrafts((prev) => [
      ...prev,
      {
        account_holder: fallbackName,
        bank_name: '',
        ifsc: '',
        account_no: '',
        pan: '',
        is_primary: prev.length === 0,
      },
    ])
  }

  const removeAccount = (index: number) => {
    if (drafts.length <= 1) return
    setDrafts((prev) => {
      const removedIsPrimary = prev[index]?.is_primary
      const filtered = prev.filter((_, i) => i !== index)
      if (removedIsPrimary && filtered.length > 0) {
        filtered[0] = { ...filtered[0], is_primary: true }
      }
      return filtered
    })
  }

  const upper = (value: string) => value.replace(/\s/g, '').toUpperCase()

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    drafts.forEach((d, idx) => {
      if (!d.account_holder || d.account_holder.trim().length < 2) {
        next[`${idx}.account_holder`] = 'Enter the account holder name'
      }
      if (!d.bank_name || d.bank_name.trim().length < 2) {
        next[`${idx}.bank_name`] = 'Enter the bank name'
      }
      if (!d.ifsc || !IFSC.test(d.ifsc)) {
        next[`${idx}.ifsc`] = 'IFSC must be 11 characters like IDIB000T012'
      }
      if (!d.account_no || !ACCOUNT_NO.test(d.account_no)) {
        next[`${idx}.account_no`] = 'Account number must be 9 to 18 digits'
      }
      if (d.pan && !PAN.test(d.pan)) {
        next[`${idx}.pan`] = 'PAN must look like ABCPV1234K'
      }
    })
    setErrors(next)
    if (Object.keys(next).length) return

    try {
      const hasPrimary = drafts.some((d) => d.is_primary)
      const payload: BankInput[] = drafts.map((d, i) => ({
        id: d.id,
        account_holder: d.account_holder.trim(),
        bank_name: d.bank_name.trim(),
        ifsc: d.ifsc.trim(),
        account_no: d.account_no.trim(),
        pan: d.pan ? d.pan.trim() : null,
        is_primary: hasPrimary ? Boolean(d.is_primary) : i === 0,
      }))
      await save(payload)
      alerts.success('Bank details saved')
      onDone()
    } catch (error) {
      setErrors(fieldErrorsOf(error))
    }
  }

  return (
    <form id='bank-form' onSubmit={submit} noValidate className='flex flex-col gap-4'>
      <RootError message={errors.root} />
      <div className='flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-1'>
        {drafts.map((d, index) => (
          <div
            key={index}
            className='relative flex flex-col gap-3 rounded-lg border bg-card/60 p-4 shadow-sm'
          >
            <div className='flex flex-wrap items-center justify-between gap-2 border-b pb-2.5'>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-semibold text-foreground'>
                  {d.bank_name ? d.bank_name : `Bank account ${index + 1}`}
                </span>
                <button
                  type='button'
                  onClick={() => setPrimary(index)}
                  className={cn(
                    'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                    d.is_primary
                      ? 'border-primary bg-primary/10 font-semibold text-primary'
                      : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                  )}
                >
                  <Check
                    className={cn(
                      'size-3',
                      d.is_primary ? 'text-primary opacity-100' : 'opacity-0'
                    )}
                  />
                  {d.is_primary ? 'Primary (salary)' : 'Select as primary'}
                </button>
              </div>
              {drafts.length > 1 && (
                <button
                  type='button'
                  onClick={() => removeAccount(index)}
                  className='rounded p-1 text-muted-foreground transition-colors hover:text-destructive'
                  title='Remove account'
                >
                  <Trash2 className='size-4' />
                </button>
              )}
            </div>

            <div className='grid gap-3 sm:grid-cols-2'>
              <FormField
                id={`account_holder_${index}`}
                label='Account holder'
                required
                error={errors[`${index}.account_holder`]}
                className='sm:col-span-2'
              >
                <Input
                  id={`account_holder_${index}`}
                  maxLength={120}
                  value={d.account_holder}
                  onChange={(event) => updateDraft(index, 'account_holder', event.target.value)}
                />
              </FormField>
              <FormField
                id={`bank_name_${index}`}
                label='Bank'
                required
                error={errors[`${index}.bank_name`]}
              >
                <Input
                  id={`bank_name_${index}`}
                  placeholder='Indian Bank'
                  maxLength={80}
                  value={d.bank_name}
                  onChange={(event) => updateDraft(index, 'bank_name', event.target.value)}
                />
              </FormField>
              <FormField id={`ifsc_${index}`} label='IFSC' required error={errors[`${index}.ifsc`]}>
                <Input
                  id={`ifsc_${index}`}
                  placeholder='IDIB000T012'
                  maxLength={11}
                  className='font-mono uppercase'
                  value={d.ifsc}
                  onChange={(event) => updateDraft(index, 'ifsc', upper(event.target.value))}
                />
              </FormField>
              <FormField
                id={`account_no_${index}`}
                label='Account number'
                required
                error={errors[`${index}.account_no`]}
              >
                <Input
                  id={`account_no_${index}`}
                  inputMode='numeric'
                  autoComplete='off'
                  maxLength={18}
                  className='font-mono'
                  value={d.account_no}
                  onChange={(event) =>
                    updateDraft(index, 'account_no', event.target.value.replace(/\D/g, ''))
                  }
                />
              </FormField>
              <FormField
                id={`pan_${index}`}
                label='PAN'
                error={errors[`${index}.pan`]}
                hint='Optional'
              >
                <Input
                  id={`pan_${index}`}
                  placeholder='ABCPV1234K'
                  autoComplete='off'
                  maxLength={10}
                  className='font-mono uppercase'
                  value={d.pan ?? ''}
                  onChange={(event) => updateDraft(index, 'pan', upper(event.target.value))}
                />
              </FormField>
            </div>
          </div>
        ))}
      </div>

      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={addAccount}
        className='flex items-center gap-1.5 self-start'
      >
        <Plus className='size-4' />
        Add another bank account
      </Button>
    </form>
  )
}
