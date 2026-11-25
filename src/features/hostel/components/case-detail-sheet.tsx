import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Ban, CheckCircle2, Gavel } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { DatePicker } from '@/components/common/date-picker'
import { DetailList } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { can, useMe } from '@/features/auth/api'
import { rupees } from '@/features/fees/labels'
import { alerts } from '@/lib/alerts'
import { formatDate, formatDateTime } from '@/lib/format'
import {
  hostelApi,
  useHostelMutation,
  type CaseActionInput,
  type DisciplineAction,
  type DisciplineCase,
} from '../api'
import {
  CASE_STATUS,
  DISCIPLINE_ACTION,
  DISCIPLINE_CATEGORY,
  labelOptions,
  SEVERITY,
} from '../labels'
import { FormAlert, InfoNote, NoteModal, StudentCell } from './leave-form-parts'
import { applyApiError, textOrNull, todayIso } from './leave-helpers'

export function CaseDetailSheet({
  caseItem,
  onClose,
  onChanged,
}: {
  caseItem: DisciplineCase | null
  onClose: () => void
  onChanged: (item: DisciplineCase) => void
}) {
  const [shown, setShown] = useState(caseItem)
  if (caseItem && caseItem !== shown) setShown(caseItem)

  return (
    <Sheet open={Boolean(caseItem)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{shown?.student.name ?? 'Case'}</SheetTitle>
          <SheetDescription>
            {shown
              ? `${shown.case_no} · ${DISCIPLINE_CATEGORY[shown.category]} · ${shown.hostel_name}`
              : ''}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>{shown && <CaseBody item={shown} onChanged={onChanged} />}</SheetBody>
      </SheetContent>
    </Sheet>
  )
}

function CaseBody({
  item,
  onChanged,
}: {
  item: DisciplineCase
  onChanged: (item: DisciplineCase) => void
}) {
  const canAct = can(useMe().data, 'hostel.discipline')
  const [acting, setActing] = useState(false)
  const [closing, setClosing] = useState<'close' | 'withdraw' | null>(null)
  const finish = useHostelMutation((input: { kind: 'close' | 'withdraw'; note: string | null }) =>
    input.kind === 'close'
      ? hostelApi.closeCase(item.id, input.note)
      : hostelApi.withdrawCase(item.id, input.note)
  )
  const status = CASE_STATUS[item.status]
  const severity = SEVERITY[item.severity]

  return (
    <div className='grid gap-5'>
      <div className='flex flex-wrap items-center gap-2'>
        <Badge tone={status.tone} dot>
          {status.label}
        </Badge>
        <Badge tone={severity.tone}>{severity.label}</Badge>
        <Badge tone={item.strikes >= 3 ? 'warning' : 'neutral'}>
          {item.strikes} {item.strikes === 1 ? 'case' : 'cases'} this year
        </Badge>
        {!item.visible_to_parent && <Badge tone='neutral'>Hidden from parents</Badge>}
      </div>

      {canAct && (item.status === 'open' || item.status === 'action_taken') && (
        <div className='flex flex-wrap gap-2'>
          {item.status === 'open' && (
            <Button size='sm' onClick={() => setActing(true)}>
              <Gavel />
              Take action
            </Button>
          )}
          <Button size='sm' variant='outline' onClick={() => setClosing('close')}>
            <CheckCircle2 />
            Close case
          </Button>
          {item.status === 'open' && (
            <Button size='sm' variant='outline' onClick={() => setClosing('withdraw')}>
              <Ban />
              Withdraw
            </Button>
          )}
        </div>
      )}

      <div className='rounded-lg border p-3'>
        <StudentCell student={item.student} extra={item.bed ?? 'No bed'} />
      </div>

      <div className='grid gap-1'>
        <h3 className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
          What happened
        </h3>
        <p className='text-sm whitespace-pre-wrap'>{item.description}</p>
      </div>

      <DetailList
        items={[
          { label: 'Category', value: DISCIPLINE_CATEGORY[item.category] },
          { label: 'When', value: formatDateTime(item.incident_at) },
          { label: 'Where', value: item.location ?? '—' },
          { label: 'Witnesses', value: item.witnesses ?? '—' },
          { label: 'Reported by', value: item.reported_by_name ?? '—' },
          { label: 'Recorded', value: formatDateTime(item.created_at) },
          { label: 'Action', value: item.action ? DISCIPLINE_ACTION[item.action] : '—' },
          { label: 'Decided by', value: item.decided_by_name ?? '—' },
          ...(item.action_note ? [{ label: 'Action note', value: item.action_note }] : []),
          ...(item.suspended_from
            ? [
                {
                  label: 'Suspended',
                  value: `${formatDate(item.suspended_from)} – ${formatDate(item.suspended_to)}`,
                },
              ]
            : []),
          ...(item.fine_amount
            ? [
                {
                  label: 'Fine',
                  value: `${rupees(item.fine_amount)}${item.fine_status ? ` · ${item.fine_status.replace(/_/g, ' ')}` : ''}`,
                },
              ]
            : []),
          { label: 'Parents see it', value: item.visible_to_parent ? 'Yes' : 'No' },
        ]}
      />

      {acting && (
        <CaseActionModal
          item={item}
          onClose={() => setActing(false)}
          onDone={(result) => {
            onChanged(result)
            setActing(false)
          }}
        />
      )}
      {closing && (
        <NoteModal
          title={closing === 'close' ? 'Close case' : 'Withdraw case'}
          description={
            closing === 'close'
              ? `${item.case_no}. The case is done and no further action is taken.`
              : `${item.case_no}. Use this when the case was recorded by mistake or was not true.`
          }
          submitText={closing === 'close' ? 'Close case' : 'Withdraw'}
          onClose={() => setClosing(null)}
          onSubmit={async (note) => {
            const result = await finish.mutateAsync({ kind: closing, note })
            onChanged(result)
            alerts.success(closing === 'close' ? 'Case closed' : 'Case withdrawn')
          }}
        />
      )}
    </div>
  )
}

const actionSchema = z
  .object({
    action: z.enum([
      'warning',
      'counselling',
      'parent_meeting',
      'fine',
      'hostel_suspension',
      'expulsion',
      'no_action',
    ]),
    action_note: z.string().trim().max(500, 'Keep the note to 500 characters'),
    fine_amount: z.string(),
    suspended_from: z.string(),
    suspended_to: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.action === 'fine') {
      const amount = Number(values.fine_amount)
      if (!values.fine_amount || !Number.isFinite(amount) || amount < 1 || amount > 1000000) {
        ctx.addIssue({
          code: 'custom',
          path: ['fine_amount'],
          message: 'Enter an amount between 1 and 10,00,000',
        })
      }
    }
    if (values.action === 'hostel_suspension') {
      if (!values.suspended_from) {
        ctx.addIssue({ code: 'custom', path: ['suspended_from'], message: 'Choose the first day' })
      }
      if (!values.suspended_to) {
        ctx.addIssue({ code: 'custom', path: ['suspended_to'], message: 'Choose the last day' })
      }
      if (
        values.suspended_from &&
        values.suspended_to &&
        values.suspended_to < values.suspended_from
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['suspended_to'],
          message: 'The last day cannot be before the first',
        })
      }
    }
  })

type ActionValues = z.infer<typeof actionSchema>

const ACTION_FORM = 'hostel-case-action-form'

function CaseActionModal({
  item,
  onClose,
  onDone,
}: {
  item: DisciplineCase
  onClose: () => void
  onDone: (item: DisciplineCase) => void
}) {
  const act = useHostelMutation((input: CaseActionInput) => hostelApi.actOnCase(item.id, input))
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ActionValues>({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      action: item.severity === 'minor' ? 'warning' : 'counselling',
      action_note: '',
      fine_amount: '',
      suspended_from: todayIso(),
      suspended_to: '',
    },
  })
  const action = useWatch({ control, name: 'action' })
  const suspendedFrom = useWatch({ control, name: 'suspended_from' })

  const submit = handleSubmit(async (values) => {
    try {
      const result = await act.mutateAsync({
        action: values.action,
        action_note: textOrNull(values.action_note),
        fine_amount: values.action === 'fine' ? Number(values.fine_amount) : undefined,
        suspended_from: values.action === 'hostel_suspension' ? values.suspended_from : undefined,
        suspended_to: values.action === 'hostel_suspension' ? values.suspended_to : undefined,
      })
      alerts.success('Action recorded', {
        description:
          values.action === 'fine'
            ? 'The fine waits for approval in Fees before it is billed.'
            : result.visible_to_parent
              ? 'Parents are told.'
              : undefined,
      })
      onDone(result)
    } catch (error) {
      applyApiError(error, setError, [
        'action',
        'action_note',
        'fine_amount',
        'suspended_from',
        'suspended_to',
      ])
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Take action'
      description={`${item.student.name} · ${item.case_no} · ${DISCIPLINE_CATEGORY[item.category]}`}
      formId={ACTION_FORM}
      submitText='Record action'
      loading={act.isPending}
    >
      <form id={ACTION_FORM} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <FormField id='case-action' label='Action' required error={errors.action?.message}>
          <Controller
            control={control}
            name='action'
            render={({ field }) => (
              <Combobox
                id='case-action'
                label='Action'
                value={field.value}
                placeholder='Choose action'
                options={labelOptions(DISCIPLINE_ACTION)}
                highlightSelected={false}
                className='sm:w-full'
                onChange={(value) => field.onChange((value ?? 'warning') as DisciplineAction)}
              />
            )}
          />
        </FormField>

        {action === 'fine' && (
          <>
            <FormField
              id='case-fine'
              label='Fine amount'
              required
              error={errors.fine_amount?.message}
            >
              <Input
                id='case-fine'
                type='number'
                min={1}
                step='0.01'
                inputMode='decimal'
                placeholder='500'
                className='tabular'
                aria-invalid={Boolean(errors.fine_amount)}
                {...register('fine_amount')}
              />
            </FormField>
            <InfoNote>
              The fine is raised as a fee fine. Someone with fee approval (not you) approves it in
              Fees, then it is billed to the parent.
            </InfoNote>
          </>
        )}

        {action === 'hostel_suspension' && (
          <div className='grid gap-4 sm:grid-cols-2'>
            <FormField
              id='case-suspend-from'
              label='Suspended from'
              required
              error={errors.suspended_from?.message}
            >
              <Controller
                control={control}
                name='suspended_from'
                render={({ field }) => (
                  <DatePicker
                    id='case-suspend-from'
                    value={field.value}
                    invalid={Boolean(errors.suspended_from)}
                    onChange={(value: string) => field.onChange(value)}
                  />
                )}
              />
            </FormField>
            <FormField
              id='case-suspend-to'
              label='Suspended until'
              required
              error={errors.suspended_to?.message}
            >
              <Controller
                control={control}
                name='suspended_to'
                render={({ field }) => (
                  <DatePicker
                    id='case-suspend-to'
                    value={field.value}
                    min={suspendedFrom || undefined}
                    invalid={Boolean(errors.suspended_to)}
                    onChange={(value: string) => field.onChange(value)}
                  />
                )}
              />
            </FormField>
          </div>
        )}

        {action === 'expulsion' && (
          <InfoNote tone='warning'>
            This only records the decision. Start the checkout from the resident’s page to free the
            bed.
          </InfoNote>
        )}

        <FormField id='case-action-note' label='Note' error={errors.action_note?.message}>
          <Textarea
            id='case-action-note'
            maxLength={500}
            placeholder='Talked to the student and the parent'
            aria-invalid={Boolean(errors.action_note)}
            {...register('action_note')}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
