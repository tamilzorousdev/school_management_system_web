import { useState } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Input, Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { cn } from '@/lib/utils'
import { useClasses } from '@/features/setup/api'
import {
  feesApi,
  useFeesMutation,
  type FeeFrequency,
  type FeeHead,
  type FeeHeadInput,
} from '../api'
import { FREQUENCY_OPTIONS, formErrors } from '../labels'

const FORM_ID = 'fee-head-form'

export function HeadModal({ head, onClose }: { head: FeeHead | null; onClose: () => void }) {
  const classes = useClasses()
  const [name, setName] = useState(head?.name ?? '')
  const [code, setCode] = useState(head?.code ?? '')
  const [transport, setTransport] = useState(head?.is_transport ?? false)
  const [active, setActive] = useState(head?.is_active ?? true)
  const [description, setDescription] = useState(head?.description ?? '')
  const [group, setGroup] = useState(head?.fee_group ?? '')
  const [mandatory, setMandatory] = useState(head?.is_mandatory ?? true)
  const [frequency, setFrequency] = useState<FeeFrequency>(head?.frequency ?? 'custom')
  const [refundable, setRefundable] = useState(head?.is_refundable ?? false)
  const [classIds, setClassIds] = useState<number[]>(head?.applicable_class_ids ?? [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useFeesMutation((input: FeeHeadInput) =>
    head ? feesApi.updateHead(head.id, input) : feesApi.createHead(input)
  )

  const toggle = (
    id: string,
    label: string,
    hint: string,
    checked: boolean,
    onChange: (value: boolean) => void
  ) => (
    <div className='flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5 sm:col-span-2'>
      <span className='grid min-w-0 gap-0.5'>
        <label htmlFor={id} className='text-sm font-semibold'>
          {label}
        </label>
        <span className='text-xs text-muted-foreground'>{hint}</span>
      </span>
      <Switch id={id} aria-label={label} checked={checked} onCheckedChange={onChange} />
    </div>
  )

  const flipClass = (id: number) =>
    setClassIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={head ? `Edit ${head.name}` : 'Add fee head'}
      description='A fee head is one kind of charge on an invoice, such as tuition or books.'
      formId={FORM_ID}
      submitText={head ? 'Save head' : 'Add head'}
      loading={save.isPending}
      size='lg'
    >
      <form
        id={FORM_ID}
        noValidate
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={async (event) => {
          event.preventDefault()
          const next: Record<string, string> = {}
          if (name.trim().length < 2) next.name = 'Enter a name of at least 2 letters'
          if (!/^[A-Za-z0-9_]{2,20}$/.test(code.trim())) {
            next.code = 'Use 2 to 20 letters, digits or underscores'
          }
          setErrors(next)
          if (Object.keys(next).length) return
          try {
            await save.mutateAsync({
              name: name.trim(),
              code: code.trim().toUpperCase(),
              is_transport: transport,
              is_active: active,
              description: description.trim() || null,
              fee_group: group.trim() || null,
              is_mandatory: mandatory,
              frequency,
              is_refundable: refundable,
              applicable_class_ids: classIds,
            })
            alerts.success(head ? 'Fee head saved' : 'Fee head added')
            onClose()
          } catch (error) {
            setErrors(
              formErrors(error, {
                FEE_HEAD_EXISTS: 'code',
                TRANSPORT_HEAD_EXISTS: 'is_transport',
                FEE_HEAD_IN_USE: 'is_transport',
              })
            )
          }
        }}
      >
        <FormField id='head-name' label='Name' required error={errors.name}>
          <Input
            id='head-name'
            value={name}
            maxLength={60}
            placeholder='Tuition fee'
            aria-invalid={Boolean(errors.name) || undefined}
            onChange={(event) => setName(event.target.value)}
          />
        </FormField>
        <FormField id='head-code' label='Code' required error={errors.code}>
          <Input
            id='head-code'
            value={code}
            maxLength={20}
            placeholder='TUITION'
            className='font-mono uppercase'
            aria-invalid={Boolean(errors.code) || undefined}
            onChange={(event) => setCode(event.target.value)}
          />
        </FormField>
        <FormField
          id='head-group'
          label='Group'
          hint='For sorting and reports, such as Academic or Activities'
          error={errors.fee_group}
        >
          <Input
            id='head-group'
            value={group}
            maxLength={60}
            placeholder='Academic'
            aria-invalid={Boolean(errors.fee_group) || undefined}
            onChange={(event) => setGroup(event.target.value)}
          />
        </FormField>
        <FormField
          id='head-frequency'
          label='How often'
          hint='The class plan still sets the installments'
          error={errors.frequency}
        >
          <Combobox
            id='head-frequency'
            label='How often'
            placeholder='Choose'
            value={frequency}
            options={FREQUENCY_OPTIONS}
            invalid={Boolean(errors.frequency)}
            onChange={(value) => value && setFrequency(value as FeeFrequency)}
          />
        </FormField>
        <FormField
          id='head-description'
          label='Description'
          error={errors.description}
          className='sm:col-span-2'
        >
          <Textarea
            id='head-description'
            rows={2}
            value={description}
            maxLength={300}
            placeholder='What this fee covers'
            aria-invalid={Boolean(errors.description) || undefined}
            onChange={(event) => setDescription(event.target.value)}
          />
        </FormField>
        <fieldset className='grid gap-2 sm:col-span-2'>
          <legend className='text-sm font-semibold'>Classes</legend>
          <span className='text-xs text-muted-foreground'>
            {classIds.length
              ? `Only for the ${classIds.length} selected ${classIds.length === 1 ? 'class' : 'classes'}`
              : 'For every class. Pick classes to limit it.'}
          </span>
          <div className='flex flex-wrap gap-1.5'>
            {(classes.data ?? []).map((item) => {
              const selected = classIds.includes(item.id)
              return (
                <button
                  key={item.id}
                  type='button'
                  aria-pressed={selected}
                  onClick={() => flipClass(item.id)}
                  className={cn(
                    'rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors',
                    selected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                  )}
                >
                  Class {item.name}
                </button>
              )
            })}
          </div>
          {errors.applicable_class_ids && (
            <p role='alert' className='text-xs font-medium text-destructive'>
              {errors.applicable_class_ids}
            </p>
          )}
        </fieldset>
        {toggle(
          'head-mandatory',
          'Mandatory',
          'Off for an optional fee such as sports or uniform, charged only to students who take it',
          mandatory,
          setMandatory
        )}
        {toggle(
          'head-refundable',
          'Refundable',
          'The school refunds it when a student leaves',
          refundable,
          setRefundable
        )}
        {toggle(
          'head-transport',
          'Transport head',
          'Charged from each student’s bus stop fee, not from the class plan',
          transport,
          setTransport
        )}
        {errors.is_transport && (
          <p role='alert' className='text-xs font-medium text-destructive sm:col-span-2'>
            {errors.is_transport}
          </p>
        )}
        {toggle(
          'head-active',
          'Active',
          'Inactive heads stay on old invoices but cannot be added to plans',
          active,
          setActive
        )}
      </form>
    </AppModal>
  )
}
