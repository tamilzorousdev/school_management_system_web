import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Armchair, LayoutGrid, Wand2 } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState, ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useHostelMutation } from '../api'
import {
  studyApi,
  useSeatMap,
  type Seat,
  type SeatAllocateInput,
  type StudyHall,
} from '../api-duty'
import { studentLine } from '../labels'
import { FormAlert, InfoNote } from './leave-form-parts'
import { applyApiError } from './leave-helpers'
import { ResidentPicker } from './pickers'
import { AutoAssignModal } from './study-auto-assign'

const seatNumber = (label: string) => Number(label.replace(/\D/g, '')) || 0

export function StudySeatMap({
  hallId,
  canEdit,
  onBack,
}: {
  hallId: number
  canEdit: boolean
  onBack: () => void
}) {
  const map = useSeatMap(hallId)
  const [allocating, setAllocating] = useState<Seat | null>(null)
  const [releasing, setReleasing] = useState<Seat | null>(null)
  const [assigning, setAssigning] = useState(false)
  const release = useHostelMutation((allocationId: number) => studyApi.release(allocationId))
  const hall = map.data?.hall
  const open = hall?.status === 'open'
  const seats = (map.data?.seats ?? [])
    .filter((seat) => seat.active || seat.allocation_id)
    .sort((a, b) => seatNumber(a.seat_no) - seatNumber(b.seat_no))

  const confirmRelease = async () => {
    if (!releasing?.allocation_id) return
    try {
      await release.mutateAsync(releasing.allocation_id)
      alerts.success(`Seat ${releasing.seat_no} released`, {
        description: releasing.student?.name,
      })
      setReleasing(null)
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const back = (
    <Button variant='ghost' size='sm' onClick={onBack}>
      <ArrowLeft />
      All halls
    </Button>
  )

  if (map.isError)
    return (
      <Card className='grid gap-2 p-4'>
        <div>{back}</div>
        <ErrorState message={map.error.message} onRetry={() => map.refetch()} />
      </Card>
    )

  if (!hall)
    return (
      <Card className='grid gap-3 p-4'>
        <Skeleton className='h-10 w-64' />
        <Skeleton className='h-64' />
      </Card>
    )

  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-center gap-3 border-b px-4 py-3'>
        {back}
        <HallTitle hall={hall} />
        {canEdit && open && hall.seats_free > 0 && (
          <Button size='sm' className='sm:ml-auto' onClick={() => setAssigning(true)}>
            <Wand2 />
            Auto-assign
          </Button>
        )}
      </div>

      <div className={cn('grid gap-4 p-4', map.isFetching && 'opacity-60')}>
        {!open && (
          <InfoNote tone='warning'>
            This hall is closed. Seated students keep their seats, but no new seats are given.
          </InfoNote>
        )}
        {seats.length === 0 ? (
          <EmptyState icon={LayoutGrid} title='No seats' description='Raise the hall capacity.' />
        ) : (
          <ul className='grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8'>
            {seats.map((seat) => (
              <li key={seat.id}>
                <SeatTile
                  seat={seat}
                  onClick={
                    !canEdit
                      ? undefined
                      : seat.allocation_id
                        ? () => setReleasing(seat)
                        : open && seat.active
                          ? () => setAllocating(seat)
                          : undefined
                  }
                />
              </li>
            ))}
          </ul>
        )}
        {canEdit && (
          <p className='text-xs text-muted-foreground'>
            Tap a free seat to give it to a resident, or a taken seat to free it.
          </p>
        )}
      </div>

      {allocating && (
        <AllocateModal hall={hall} seat={allocating} onClose={() => setAllocating(null)} />
      )}
      {assigning && <AutoAssignModal hall={hall} onClose={() => setAssigning(false)} />}

      <ConfirmDialog
        open={Boolean(releasing)}
        onOpenChange={(value) => !value && setReleasing(null)}
        title={`Free seat ${releasing?.seat_no ?? ''}`}
        description={
          releasing?.student
            ? `${releasing.student.name} will no longer have a seat in ${hall.name}.`
            : ''
        }
        confirmText='Free seat'
        destructive
        loading={release.isPending}
        onConfirm={() => void confirmRelease()}
      />
    </Card>
  )
}

function HallTitle({ hall }: { hall: StudyHall }) {
  return (
    <div className='grid min-w-0 gap-0.5'>
      <span className='flex flex-wrap items-center gap-2 font-semibold'>
        {hall.name}
        <Badge tone={hall.status === 'open' ? 'success' : 'neutral'}>
          {hall.status === 'open' ? 'Open' : 'Closed'}
        </Badge>
      </span>
      <span className='tabular text-xs text-muted-foreground'>
        {[hall.hostel_name, hall.location].filter(Boolean).join(' · ')} · {hall.seats_taken} of{' '}
        {hall.seats_active} taken · {hall.seats_free} free
      </span>
    </div>
  )
}

function SeatTile({ seat, onClick }: { seat: Seat; onClick?: () => void }) {
  const taken = Boolean(seat.student)
  const body = (
    <>
      <span className='flex items-center justify-between gap-1'>
        <span className='flex items-center gap-1 font-mono text-xs font-bold'>
          <Armchair className={cn('size-3.5', taken ? 'text-primary' : 'text-muted-foreground')} />
          {seat.seat_no}
        </span>
        {!seat.active && <span className='text-[10px] text-muted-foreground'>Not in use</span>}
      </span>
      {seat.student ? (
        <>
          <span className='truncate text-xs font-semibold' title={seat.student.name}>
            {seat.student.name}
          </span>
          <span className='truncate text-[11px] text-muted-foreground'>
            {studentLine(seat.student)}
          </span>
          {seat.since && (
            <span className='text-[11px] text-muted-foreground'>
              Since {formatDate(seat.since)}
            </span>
          )}
        </>
      ) : (
        <span className='text-xs text-muted-foreground'>Free</span>
      )}
    </>
  )
  const className = cn(
    'grid h-full min-h-24 w-full content-start gap-1 rounded-lg border p-2.5 text-left',
    taken ? 'border-primary/30 bg-primary/5' : 'border-dashed bg-card'
  )
  if (!onClick) return <div className={className}>{body}</div>
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={
        taken
          ? `Seat ${seat.seat_no}, ${seat.student?.name}. Free this seat`
          : `Give seat ${seat.seat_no}`
      }
      className={cn(
        className,
        'transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40'
      )}
    >
      {body}
    </button>
  )
}

const schema = z.object({ admission_id: z.string().min(1, 'Choose a resident') })
type FormValues = z.infer<typeof schema>
const FORM_ID = 'study-seat-form'

function AllocateModal({
  hall,
  seat,
  onClose,
}: {
  hall: StudyHall
  seat: Seat
  onClose: () => void
}) {
  const allocate = useHostelMutation((input: SeatAllocateInput) =>
    studyApi.allocate(hall.id, input)
  )
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { admission_id: '' },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await allocate.mutateAsync({ seat_id: seat.id, admission_id: Number(values.admission_id) })
      alerts.success(`Seat ${seat.seat_no} given`)
      onClose()
    } catch (error) {
      applyApiError(error, setError, ['admission_id'], {
        HOSTEL_NOT_RESIDENT: 'admission_id',
        HOSTEL_SEAT_ALREADY_GIVEN: 'admission_id',
        HOSTEL_ADMISSION_NOT_FOUND: 'admission_id',
      })
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(value) => !value && onClose()}
      title={`Give seat ${seat.seat_no}`}
      description={`${hall.name} · ${hall.hostel_name}`}
      formId={FORM_ID}
      submitText='Give seat'
      loading={allocate.isPending}
      size='sm'
    >
      <form id={FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <FormField
          id='seat-resident'
          label='Resident'
          required
          error={errors.admission_id?.message}
          hint='A resident can have one seat in each hall.'
        >
          <Controller
            control={control}
            name='admission_id'
            render={({ field }) => (
              <ResidentPicker
                id='seat-resident'
                label='Resident'
                hostelId={hall.hostel_id}
                value={field.value || undefined}
                invalid={Boolean(errors.admission_id)}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
