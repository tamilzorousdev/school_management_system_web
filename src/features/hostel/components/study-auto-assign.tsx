import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { toApiError } from '@/lib/api/errors'
import { alerts } from '@/lib/alerts'
import { useHostelMutation } from '../api'
import { studyApi, type AutoAssignInput, type AutoAssignResult, type StudyHall } from '../api-duty'
import { FormAlert, InfoNote } from './leave-form-parts'
import { BlockSelect, ResidentPicker } from './pickers'

type Mode = 'all' | 'block' | 'residents'

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: 'all', label: 'Whole hostel' },
  { value: 'block', label: 'One block' },
  { value: 'residents', label: 'Pick residents' },
]

const FORM_ID = 'study-auto-assign-form'

export function AutoAssignModal({ hall, onClose }: { hall: StudyHall; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>('all')
  const [blockId, setBlockId] = useState<string | undefined>()
  const [picked, setPicked] = useState<{ value: string; label: string }[]>([])
  const [error, setError] = useState<string | undefined>()
  const [result, setResult] = useState<AutoAssignResult | null>(null)
  const assign = useHostelMutation((input: AutoAssignInput) => studyApi.autoAssign(hall.id, input))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (mode === 'block' && !blockId) {
      setError('Choose a block')
      return
    }
    if (mode === 'residents' && picked.length === 0) {
      setError('Pick at least one resident')
      return
    }
    setError(undefined)
    try {
      const saved = await assign.mutateAsync(
        mode === 'block'
          ? { block_id: Number(blockId) }
          : mode === 'residents'
            ? { admission_ids: picked.map((item) => Number(item.value)) }
            : {}
      )
      setResult(saved)
      alerts.success(
        `${saved.assigned.length} ${saved.assigned.length === 1 ? 'seat' : 'seats'} assigned`,
        saved.skipped.length ? { description: `${saved.skipped.length} skipped` } : undefined
      )
    } catch (caught) {
      const apiError = toApiError(caught)
      setError(apiError.fieldErrors[0]?.message ?? apiError.message)
    }
  }

  if (result) {
    return (
      <AppModal
        open
        onOpenChange={(open) => !open && onClose()}
        title='Seats assigned'
        description={`${hall.name} · ${result.assigned.length} given, ${result.skipped.length} skipped`}
        size='md'
        footer={
          <DialogFooter>
            <Button onClick={onClose}>Done</Button>
          </DialogFooter>
        }
      >
        <div className='grid max-h-[60vh] gap-4 overflow-y-auto'>
          <section className='grid gap-2'>
            <h3 className='text-sm font-semibold'>Given a seat</h3>
            {result.assigned.length === 0 ? (
              <p className='text-sm text-muted-foreground'>Nobody got a seat.</p>
            ) : (
              <ul className='grid gap-1'>
                {result.assigned.map((item) => (
                  <li
                    key={item.admission_id}
                    className='flex items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-sm'
                  >
                    <span className='truncate'>{item.student_name}</span>
                    <Badge tone='success' className='font-mono'>
                      {item.seat_no}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {result.skipped.length > 0 && (
            <section className='grid gap-2'>
              <h3 className='text-sm font-semibold'>Skipped</h3>
              <ul className='grid gap-1'>
                {result.skipped.map((item) => (
                  <li
                    key={item.admission_id}
                    className='grid gap-0.5 rounded-md border border-warning/30 bg-warning/5 px-3 py-1.5 text-sm'
                  >
                    <span className='truncate font-medium'>
                      {item.student_name ?? `Admission #${item.admission_id}`}
                    </span>
                    <span className='text-xs text-muted-foreground'>{item.reason}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </AppModal>
    )
  }

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Auto-assign seats'
      description={`${hall.name} has ${hall.seats_free} free ${hall.seats_free === 1 ? 'seat' : 'seats'}.`}
      formId={FORM_ID}
      submitText='Assign seats'
      loading={assign.isPending}
      size='md'
    >
      <form id={FORM_ID} noValidate onSubmit={(event) => void submit(event)} className='grid gap-4'>
        <FormAlert message={error} />
        <div className='grid gap-2'>
          <span className='text-xs font-semibold'>Who gets a seat</span>
          <SegmentedControl
            label='Who gets a seat'
            value={mode}
            options={MODE_OPTIONS}
            onChange={(next) => {
              setMode(next)
              setError(undefined)
            }}
            className='self-start'
          />
        </div>
        {mode === 'block' && (
          <FormField id='auto-block' label='Block' required>
            <BlockSelect
              id='auto-block'
              hostelId={hall.hostel_id}
              value={blockId}
              onChange={(value) => setBlockId(value)}
            />
          </FormField>
        )}
        {mode === 'residents' && (
          <FormField
            id='auto-residents'
            label='Residents'
            required
            hint='Seats are given in the order you pick.'
          >
            <div className='grid gap-2'>
              <ResidentPicker
                id='auto-residents'
                label='Resident'
                placeholder='Add a resident'
                hostelId={hall.hostel_id}
                onChange={(value, option) => {
                  if (!value || picked.some((item) => item.value === value)) return
                  setPicked((prev) => [...prev, { value, label: option?.label ?? value }])
                }}
              />
              {picked.length > 0 && (
                <ol className='flex flex-wrap gap-1.5'>
                  {picked.map((item, index) => (
                    <li key={item.value}>
                      <Badge tone='info' className='max-w-full gap-1 pr-1'>
                        <span className='tabular text-[10px] opacity-70'>{index + 1}</span>
                        <span className='truncate'>{item.label}</span>
                        <button
                          type='button'
                          aria-label={`Remove ${item.label}`}
                          onClick={() =>
                            setPicked((prev) => prev.filter((entry) => entry.value !== item.value))
                          }
                          className='grid size-4 place-items-center rounded-full hover:bg-info/20'
                        >
                          <X className='size-3' />
                        </button>
                      </Badge>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </FormField>
        )}
        <InfoNote>
          Residents without a seat in this hall get free seats in seat order
          {mode === 'residents' ? ', in the order picked.' : ', by block, room and bed.'} Anyone who
          does not fit is listed as skipped.
        </InfoNote>
      </form>
    </AppModal>
  )
}
