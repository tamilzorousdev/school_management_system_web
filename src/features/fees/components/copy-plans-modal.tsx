import { useState } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { alerts } from '@/lib/alerts'
import { cn } from '@/lib/utils'
import { useAcademicYears } from '@/features/setup/api'
import { feesApi, useFeesMutation, type CopyPlanResult, type FeePlanSummary } from '../api'
import { formErrors } from '../labels'

type Mode = 'class' | 'year'

export function CopyPlansModal({
  plans,
  onClose,
}: {
  plans: FeePlanSummary[]
  onClose: () => void
}) {
  const years = useAcademicYears()
  const [mode, setMode] = useState<Mode>('class')
  const [sourceId, setSourceId] = useState<number>()
  const [targetIds, setTargetIds] = useState<number[]>([])
  const [yearId, setYearId] = useState<number>()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [result, setResult] = useState<CopyPlanResult | null>(null)
  const copy = useFeesMutation(() =>
    mode === 'class' ? feesApi.copyPlan(sourceId!, targetIds) : feesApi.copyYear(yearId!, targetIds)
  )
  const earlier = (years.data ?? []).filter((year) => !year.is_current && year.status !== 'draft')
  const sources = plans.filter((plan) => plan.total > 0)
  const flip = (id: number) =>
    setTargetIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))

  if (result) {
    return (
      <AppModal
        open
        onOpenChange={(open) => !open && onClose()}
        title={result.drafted === 1 ? '1 draft plan made' : `${result.drafted} draft plans made`}
        description='Open each class to check its draft, then send it for approval. Plans in use do not change until a draft is approved.'
        size='lg'
        footer={
          <DialogFooter>
            <Button onClick={onClose}>Done</Button>
          </DialogFooter>
        }
      >
        <ul className='grid gap-1.5 text-sm'>
          {result.classes.map((row) => (
            <li key={row.class_id} className='flex flex-wrap items-center gap-2'>
              <span className='font-semibold'>Class {row.class_name}</span>
              {row.status === 'drafted' ? (
                <Badge tone='success'>Draft version {row.version}</Badge>
              ) : (
                <Badge tone='warning'>Skipped</Badge>
              )}
              <span className='text-xs text-muted-foreground'>
                {row.status === 'drafted'
                  ? `${row.lines} lines${row.left_out ? ` · ${row.left_out} left out (head switched off or not for this class)` : ''}`
                  : row.reason}
              </span>
            </li>
          ))}
        </ul>
      </AppModal>
    )
  }

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Copy fee plans'
      description='Copies become drafts. Each one is used only after it is sent for approval and approved.'
      size='lg'
      formId='fee-copy-form'
      submitText='Make drafts'
      loading={copy.isPending}
    >
      <form
        id='fee-copy-form'
        noValidate
        className='grid gap-4'
        onSubmit={async (event) => {
          event.preventDefault()
          const next: Record<string, string> = {}
          if (mode === 'class') {
            if (!sourceId) next.source = 'Choose the class to copy from'
            if (!targetIds.length) next.targets = 'Pick at least one class'
          } else if (!yearId) {
            next.year = 'Choose the year to copy from'
          }
          setErrors(next)
          if (Object.keys(next).length) return
          try {
            const outcome = await copy.mutateAsync(undefined)
            if (!outcome.drafted) alerts.error('No drafts were made. See why below.')
            setResult(outcome)
          } catch (error) {
            setErrors(formErrors(error, { PLAN_EMPTY: mode === 'class' ? 'source' : 'year' }))
          }
        }}
      >
        <SegmentedControl<Mode>
          label='Copy from'
          value={mode}
          onChange={(value) => {
            setMode(value)
            setTargetIds([])
            setErrors({})
          }}
          options={[
            { value: 'class', label: 'Another class' },
            { value: 'year', label: 'An earlier year' },
          ]}
        />
        {mode === 'class' ? (
          <FormField
            id='copy-source'
            label='Copy the plan in use of'
            required
            error={errors.source}
          >
            <Combobox
              id='copy-source'
              label='Class to copy from'
              value={sourceId ? String(sourceId) : undefined}
              options={sources.map((plan) => ({
                value: String(plan.class_id),
                label: `Class ${plan.class_name}`,
                hint: `${plan.installments.length} installments`,
              }))}
              placeholder='Choose a class'
              emptyText='No class has a plan in use yet'
              invalid={Boolean(errors.source)}
              onChange={(value) => {
                setSourceId(value ? Number(value) : undefined)
                setTargetIds((prev) => prev.filter((id) => String(id) !== value))
              }}
            />
          </FormField>
        ) : (
          <FormField
            id='copy-year'
            label='Copy every plan in use from'
            required
            error={errors.year}
          >
            <Combobox
              id='copy-year'
              label='Year to copy from'
              value={yearId ? String(yearId) : undefined}
              options={earlier.map((year) => ({ value: String(year.id), label: year.name }))}
              placeholder='Choose a year'
              emptyText='No earlier year'
              invalid={Boolean(errors.year)}
              onChange={(value) => setYearId(value ? Number(value) : undefined)}
            />
          </FormField>
        )}
        <fieldset className='grid gap-2'>
          <legend className='text-sm font-semibold'>
            {mode === 'class' ? 'Copy to' : 'Classes'}
          </legend>
          <span className='text-xs text-muted-foreground'>
            {mode === 'class'
              ? 'Classes that already have a draft or a change waiting are skipped.'
              : targetIds.length
                ? `Only the ${targetIds.length} selected ${targetIds.length === 1 ? 'class' : 'classes'}. Due dates move to the same day this year.`
                : 'Every class that had a plan. Pick classes to limit it. Due dates move to the same day this year.'}
          </span>
          <div className='flex flex-wrap gap-1.5'>
            {plans
              .filter((plan) => mode === 'year' || plan.class_id !== sourceId)
              .map((plan) => {
                const on = targetIds.includes(plan.class_id)
                return (
                  <button
                    key={plan.class_id}
                    type='button'
                    aria-pressed={on}
                    onClick={() => flip(plan.class_id)}
                    className={cn(
                      'rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors',
                      on
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Class {plan.class_name}
                    {plan.draft_status ? ' · has a draft' : ''}
                  </button>
                )
              })}
          </div>
          {errors.targets && (
            <p role='alert' className='text-xs font-medium text-destructive'>
              {errors.targets}
            </p>
          )}
        </fieldset>
      </form>
    </AppModal>
  )
}
