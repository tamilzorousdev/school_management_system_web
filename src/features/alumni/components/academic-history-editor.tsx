import { useState } from 'react'
import { Book, Plus, Trash } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { uniqueId } from '@/lib/utils'
import {
  useReplaceHistory,
  type AlumniHistory,
  type HistoryResult,
  type HistoryRowInput,
} from '../api'
import { HISTORY_RESULT, toneOptions } from '../labels'
import { RootError } from './form-parts'

const FORM_ID = 'alumni-history-form'
const MAX_ROWS = 20
const RESULT_OPTIONS = toneOptions(HISTORY_RESULT)

interface Draft {
  key: string
  academic_year_name: string
  class_name: string
  section_name: string
  roll_no: string
  result: HistoryResult | ''
  percent: string
  grade: string
}

const toDraft = (row?: AlumniHistory): Draft => ({
  key: uniqueId(),
  academic_year_name: row?.academic_year_name ?? '',
  class_name: row?.class_name ?? '',
  section_name: row?.section_name ?? '',
  roll_no: row?.roll_no === null || row?.roll_no === undefined ? '' : String(row.roll_no),
  result: row?.result ?? '',
  percent: row?.percent === null || row?.percent === undefined ? '' : String(row.percent),
  grade: row?.grade ?? '',
})

function validate(rows: Draft[]) {
  const errors: Record<string, string> = {}
  rows.forEach((row, index) => {
    const at = (field: string) => `rows.${index}.${field}`
    const year = row.academic_year_name.trim()
    if (year.length < 2 || year.length > 20)
      errors[at('academic_year_name')] = 'Enter a year like 2024-25'
    const name = row.class_name.trim()
    if (!name || name.length > 30) errors[at('class_name')] = 'Enter the class'
    if (row.section_name.trim().length > 10) errors[at('section_name')] = 'Up to 10 characters'
    if (
      row.roll_no &&
      (!/^\d+$/.test(row.roll_no) || Number(row.roll_no) < 1 || Number(row.roll_no) > 999)
    )
      errors[at('roll_no')] = 'From 1 to 999'
    if (row.percent && (!/^\d{1,3}(\.\d{1,2})?$/.test(row.percent) || Number(row.percent) > 100))
      errors[at('percent')] = '0 to 100'
    if (row.grade.trim().length > 5) errors[at('grade')] = 'Up to 5 characters'
  })
  return errors
}

const toInput = (row: Draft): HistoryRowInput => ({
  academic_year_name: row.academic_year_name.trim(),
  class_name: row.class_name.trim(),
  section_name: row.section_name.trim() || null,
  roll_no: row.roll_no ? Number(row.roll_no) : null,
  result: row.result || null,
  percent: row.percent ? Number(row.percent) : null,
  grade: row.grade.trim() || null,
})

export function AcademicHistoryEditor({
  open,
  onOpenChange,
  alumniId,
  rows,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  alumniId: number
  rows: AlumniHistory[]
}) {
  const save = useReplaceHistory(alumniId)
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Edit academic history'
      description='Years copied from school records stay as they are. Add the years the school kept on paper.'
      formId={FORM_ID}
      submitText='Save history'
      loading={save.isPending}
      size='xl'
    >
      {open && (
        <HistoryForm
          initial={rows.filter((row) => row.source === 'manual')}
          onSubmit={async (input) => {
            await save.mutateAsync(input)
            alerts.success('Academic history saved')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function HistoryForm({
  initial,
  onSubmit,
}: {
  initial: AlumniHistory[]
  onSubmit: (rows: HistoryRowInput[]) => Promise<void>
}) {
  const [rows, setRows] = useState<Draft[]>(() => initial.map(toDraft))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const update = (index: number, field: keyof Draft, value: string) =>
    setRows((current) =>
      current.map((row, position) => (position === index ? { ...row, [field]: value } : row))
    )

  return (
    <form
      id={FORM_ID}
      noValidate
      className='grid gap-3'
      onSubmit={async (event) => {
        event.preventDefault()
        const next = validate(rows)
        setErrors(next)
        if (Object.keys(next).length) return
        try {
          await onSubmit(rows.map(toInput))
        } catch (error) {
          const apiError = toApiError(error)
          const mapped = Object.fromEntries(
            apiError.fieldErrors.map((item) => [item.field, item.message])
          )
          setErrors(Object.keys(mapped).length ? mapped : { root: apiError.message })
        }
      }}
    >
      <RootError message={errors.root ?? errors.rows} />
      {rows.length === 0 && (
        <p className='flex items-center gap-2 rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground'>
          <Book className='size-4' />
          No years entered by staff. Saving now removes any you had added.
        </p>
      )}
      {rows.map((row, index) => {
        const id = (field: string) => `h-${row.key}-${field}`
        const error = (field: string) => errors[`rows.${index}.${field}`]
        return (
          <div key={row.key} className='grid gap-3 rounded-xl border p-3'>
            <div className='flex items-center justify-between gap-2'>
              <span className='text-xs font-bold text-muted-foreground'>Year {index + 1}</span>
              <Button
                type='button'
                size='icon-sm'
                variant='outline'
                aria-label={`Remove year ${index + 1}`}
                className='size-8 border border-[#FDA29B] text-[#D92D20] bg-white hover:bg-rose-50'
                onClick={() => setRows((current) => current.filter((_row, at) => at !== index))}
              >
                <Trash className='size-4 stroke-[1.75]' />
              </Button>
            </div>
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
              <FormField
                id={id('year')}
                label='Academic year'
                required
                error={error('academic_year_name')}
              >
                <Input
                  id={id('year')}
                  placeholder='2024-25'
                  maxLength={20}
                  value={row.academic_year_name}
                  onChange={(event) => update(index, 'academic_year_name', event.target.value)}
                />
              </FormField>
              <FormField id={id('class')} label='Class' required error={error('class_name')}>
                <Input
                  id={id('class')}
                  placeholder='Class 11'
                  maxLength={30}
                  value={row.class_name}
                  onChange={(event) => update(index, 'class_name', event.target.value)}
                />
              </FormField>
              <FormField id={id('section')} label='Section' error={error('section_name')}>
                <Input
                  id={id('section')}
                  placeholder='A'
                  maxLength={10}
                  value={row.section_name}
                  onChange={(event) => update(index, 'section_name', event.target.value)}
                />
              </FormField>
              <FormField id={id('roll')} label='Roll no' error={error('roll_no')}>
                <Input
                  id={id('roll')}
                  inputMode='numeric'
                  placeholder='12'
                  maxLength={3}
                  value={row.roll_no}
                  onChange={(event) =>
                    update(index, 'roll_no', event.target.value.replace(/\D/g, ''))
                  }
                />
              </FormField>
              <FormField id={id('result')} label='Result' error={error('result')}>
                <Combobox
                  id={id('result')}
                  label='Result'
                  value={row.result || undefined}
                  placeholder='Not recorded'
                  searchPlaceholder='Search'
                  options={RESULT_OPTIONS}
                  onChange={(value) => update(index, 'result', value ?? '')}
                  className='sm:w-full'
                />
              </FormField>
              <FormField id={id('percent')} label='Percent' error={error('percent')}>
                <Input
                  id={id('percent')}
                  inputMode='decimal'
                  placeholder='78.5'
                  maxLength={6}
                  value={row.percent}
                  onChange={(event) => update(index, 'percent', event.target.value)}
                />
              </FormField>
              <FormField id={id('grade')} label='Grade' error={error('grade')}>
                <Input
                  id={id('grade')}
                  placeholder='B1'
                  maxLength={5}
                  value={row.grade}
                  onChange={(event) => update(index, 'grade', event.target.value)}
                />
              </FormField>
            </div>
          </div>
        )
      })}
      <Button
        type='button'
        variant='secondary'
        className='justify-self-start border border-[#C6CEC9] bg-white text-[#171B19] hover:bg-[#F9FAFB] font-medium h-9 px-4 gap-2'
        disabled={rows.length >= MAX_ROWS}
        onClick={() => setRows((current) => [...current, toDraft()])}
      >
        <Plus className='size-4 stroke-[1.75]' />
        Add a year
      </Button>
    </form>
  )
}
