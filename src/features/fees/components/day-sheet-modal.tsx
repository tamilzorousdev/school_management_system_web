import { useState, type FormEvent } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Input } from '@/components/ui/input'
import { today } from '@/features/attendance/labels'
import { useCollectorOptions } from '../api'
import { openDaySheet } from '../labels'

const FORM_ID = 'day-sheet-form'

export function DaySheetModal({
  open,
  onOpenChange,
  defaultDate,
  defaultCollector,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultDate?: string
  defaultCollector?: number
}) {
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Day-end collection sheet'
      description='Every receipt, advance, library fine and refund for one day, totals by payment mode, cash in hand and signature lines. Print it when closing the counter.'
      formId={FORM_ID}
      submitText='Open PDF'
      size='sm'
    >
      {open && (
        <DaySheetForm
          defaultDate={defaultDate}
          defaultCollector={defaultCollector}
          onDone={() => onOpenChange(false)}
        />
      )}
    </AppModal>
  )
}

function DaySheetForm({
  defaultDate,
  defaultCollector,
  onDone,
}: {
  defaultDate?: string
  defaultCollector?: number
  onDone: () => void
}) {
  const collectors = useCollectorOptions()
  const [date, setDate] = useState(defaultDate && defaultDate <= today() ? defaultDate : today())
  const [collector, setCollector] = useState(defaultCollector ? String(defaultCollector) : '')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!date) return
    openDaySheet(date, collector ? Number(collector) : undefined)
    onDone()
  }

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      <FormField id='day-sheet-date' label='Date' required>
        <Input
          id='day-sheet-date'
          type='date'
          max={today()}
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </FormField>
      <FormField
        id='day-sheet-collector'
        label='Collected by'
        hint='Leave as everyone for the whole office, or pick one person for their own counter'
      >
        <Combobox
          id='day-sheet-collector'
          label='Collected by'
          value={collector || undefined}
          options={collectors.data ?? []}
          allLabel='Everyone'
          placeholder='Everyone'
          searchPlaceholder='Search staff'
          highlightSelected={false}
          className='sm:w-full'
          onChange={(value) => setCollector(value ?? '')}
        />
      </FormField>
    </form>
  )
}
