import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  appraisalsApi,
  useAppraisalMutation,
  type AppraisalGroup,
  type AutoMetric,
  type KraCategory,
  type KraInput,
  type ScoringMode,
} from '../api'
import { CATEGORY, fieldMap, METRIC } from '../labels'

interface Row extends Omit<KraInput, 'weightage_percent' | 'max_score' | 'auto_target'> {
  key: number
  weightage_percent: string
  max_score: string
  auto_target: string
}

let next = 1
const slug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 50)

export function KraEditor({ group, onClose }: { group: AppraisalGroup; onClose: () => void }) {
  const [rows, setRows] = useState<Row[]>(() =>
    group.kras.map((kra) => ({
      key: next++,
      code: kra.code,
      title: kra.title,
      description: kra.description,
      category: kra.category,
      weightage_percent: String(kra.weightage_percent),
      max_score: String(kra.max_score),
      scoring_mode: kra.scoring_mode,
      auto_metric: kra.auto_metric,
      auto_target: kra.auto_target === null ? '' : String(kra.auto_target),
    })),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useAppraisalMutation(appraisalsApi.setKras)
  const total = Math.round(rows.reduce((sum, row) => sum + (Number(row.weightage_percent) || 0), 0) * 100) / 100

  const change = (key: number, patch: Partial<Row>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)))

  const add = () =>
    setRows((current) => [
      ...current,
      {
        key: next++,
        code: '',
        title: '',
        description: null,
        category: 'general',
        weightage_percent: String(Math.max(0, 100 - total)),
        max_score: '5',
        scoring_mode: 'manual',
        auto_metric: null,
        auto_target: '',
      },
    ])

  const submit = async () => {
    const kras: KraInput[] = rows.map((row) => ({
      code: row.code.trim() || slug(row.title),
      title: row.title.trim(),
      description: row.description?.trim() || null,
      category: row.category,
      weightage_percent: Number(row.weightage_percent),
      max_score: Number(row.max_score) || 5,
      scoring_mode: row.scoring_mode,
      auto_metric: row.scoring_mode === 'auto' ? row.auto_metric : null,
      auto_target: row.scoring_mode === 'auto' && row.auto_target ? Number(row.auto_target) : null,
    }))
    const missing = kras.findIndex((kra) => !kra.title)
    if (missing >= 0) return setErrors({ [`kras.${missing}.title`]: 'Give the KRA a title' })
    try {
      const saved = await save.mutateAsync({ id: group.id, kras })
      alerts.success(saved.message)
      onClose()
    } catch (error) {
      const apiError = toApiError(error)
      setErrors(fieldMap(apiError.fieldErrors))
      alerts.error(apiError.message)
    }
  }

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && !save.isPending && onClose()}
      title={`KRAs of ${group.name}`}
      description='Each KRA is scored out of its maximum. Weights must add up to 100%. Open appraisals keep the KRAs they started with.'
      size='xl'
      formId='kra-editor-form'
      submitText='Save KRAs'
      loading={save.isPending}
    >
      <form
        id='kra-editor-form'
        className='grid gap-3'
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <div className='flex items-center justify-between gap-2'>
          <Badge tone={total === 100 ? 'success' : 'danger'} dot>
            Total weight {total}%
          </Badge>
          <Button type='button' variant='outline' size='sm' onClick={add}>
            <Plus />
            Add KRA
          </Button>
        </div>
        {errors.kras && <p className='text-sm text-destructive'>{errors.kras}</p>}
        {rows.map((row, index) => (
          <div key={row.key} className='grid gap-3 rounded-lg border p-3 sm:grid-cols-6'>
            <FormField
              id={`kra-title-${row.key}`}
              label='KRA'
              required
              error={errors[`kras.${index}.title`] ?? errors[`kras.${index}.code`]}
              className='sm:col-span-3'
            >
              <Input
                id={`kra-title-${row.key}`}
                value={row.title}
                placeholder='Curriculum delivery'
                onChange={(event) => change(row.key, { title: event.target.value })}
              />
            </FormField>
            <FormField id={`kra-category-${row.key}`} label='Area' className='sm:col-span-2'>
              <Combobox
                id={`kra-category-${row.key}`}
                label='Area'
                placeholder='Area'
                value={row.category}
                options={(Object.keys(CATEGORY) as KraCategory[]).map((value) => ({ value, label: CATEGORY[value] }))}
                onChange={(value) => value && change(row.key, { category: value as KraCategory })}
                className='sm:w-full'
              />
            </FormField>
            <FormField id={`kra-weight-${row.key}`} label='Weight %' required>
              <Input
                id={`kra-weight-${row.key}`}
                type='number'
                min={1}
                max={100}
                step='0.5'
                inputMode='decimal'
                value={row.weightage_percent}
                onChange={(event) => change(row.key, { weightage_percent: event.target.value })}
              />
            </FormField>
            <FormField id={`kra-description-${row.key}`} label='What it covers' className='sm:col-span-6'>
              <Textarea
                id={`kra-description-${row.key}`}
                rows={1}
                value={row.description ?? ''}
                onChange={(event) => change(row.key, { description: event.target.value })}
              />
            </FormField>
            <FormField id={`kra-mode-${row.key}`} label='Scored by' className='sm:col-span-2'>
              <SegmentedControl
                label='Scored by'
                value={row.scoring_mode}
                onChange={(value: ScoringMode) =>
                  change(row.key, {
                    scoring_mode: value,
                    auto_metric: value === 'auto' ? (row.auto_metric ?? 'attendance_percent') : null,
                  })
                }
                options={[
                  { value: 'manual', label: 'People' },
                  { value: 'auto', label: 'School data' },
                ]}
              />
            </FormField>
            {row.scoring_mode === 'auto' ? (
              <>
                <FormField
                  id={`kra-metric-${row.key}`}
                  label='From'
                  error={errors[`kras.${index}.auto_metric`]}
                  className='sm:col-span-2'
                >
                  <Combobox
                    id={`kra-metric-${row.key}`}
                    label='Metric'
                    placeholder='Choose data'
                    value={row.auto_metric ?? undefined}
                    options={(Object.keys(METRIC) as AutoMetric[]).map((value) => ({
                      value,
                      label: METRIC[value].label,
                    }))}
                    onChange={(value) => value && change(row.key, { auto_metric: value as AutoMetric })}
                    className='sm:w-full'
                  />
                </FormField>
                <FormField
                  id={`kra-target-${row.key}`}
                  label='Full score at'
                  hint={row.auto_metric ? `Default ${METRIC[row.auto_metric].target}${METRIC[row.auto_metric].unit}` : undefined}
                >
                  <Input
                    id={`kra-target-${row.key}`}
                    type='number'
                    min={0.01}
                    step='0.01'
                    inputMode='decimal'
                    value={row.auto_target}
                    onChange={(event) => change(row.key, { auto_target: event.target.value })}
                  />
                </FormField>
              </>
            ) : (
              <div className='sm:col-span-3' />
            )}
            <div className='flex items-end gap-2'>
              <FormField id={`kra-max-${row.key}`} label='Out of' className='flex-1'>
                <Input
                  id={`kra-max-${row.key}`}
                  type='number'
                  min={2}
                  max={10}
                  inputMode='numeric'
                  value={row.max_score}
                  onChange={(event) => change(row.key, { max_score: event.target.value })}
                />
              </FormField>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                aria-label={`Remove ${row.title || 'KRA'}`}
                onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
      </form>
    </AppModal>
  )
}
