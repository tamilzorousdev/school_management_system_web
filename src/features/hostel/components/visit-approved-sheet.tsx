import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, UserRoundCheck } from 'lucide-react'
import { z } from 'zod'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState, ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import {
  hostelApi,
  useApprovedVisitors,
  useHostelMutation,
  type ApprovedVisitor,
  type ApprovedVisitorInput,
  type HostelStudent,
} from '../api'
import { FormAlert } from './leave-form-parts'
import { applyApiError, digitsOnly, MOBILE_PATTERN } from './leave-helpers'

const schema = z.object({
  name: z.string().trim().min(2, 'Enter the name').max(120, 'Keep it to 120 characters'),
  relation: z.string().trim().min(2, 'Enter the relation').max(40, 'Keep it to 40 characters'),
  mobile: z.string().regex(MOBILE_PATTERN, 'Enter a valid 10-digit mobile number'),
})

type FormValues = z.infer<typeof schema>

export function ApprovedVisitorsSheet({
  student,
  onClose,
}: {
  student: HostelStudent | null
  onClose: () => void
}) {
  const [shown, setShown] = useState(student)
  if (student && student !== shown) setShown(student)

  return (
    <Sheet open={Boolean(student)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Approved visitors</SheetTitle>
          <SheetDescription>
            {shown ? `${shown.name} · ${shown.admission_no}. ` : ''}Parents can add up to 10 in the
            Parent app.
          </SheetDescription>
        </SheetHeader>
        <SheetBody>{shown && <ApprovedBody key={shown.id} student={shown} />}</SheetBody>
      </SheetContent>
    </Sheet>
  )
}

function ApprovedBody({ student }: { student: HostelStudent }) {
  const canEdit = can(useMe().data, 'hostel.visitor')
  const visitors = useApprovedVisitors(student.id)
  const [removing, setRemoving] = useState<ApprovedVisitor | null>(null)
  const remove = useHostelMutation((id: number) => hostelApi.removeApprovedVisitor(student.id, id))

  return (
    <div className='grid gap-5'>
      {visitors.isError && !visitors.data ? (
        <ErrorState message={visitors.error.message} onRetry={() => visitors.refetch()} />
      ) : !visitors.data ? (
        <div className='grid gap-2'>
          <Skeleton className='h-14' />
          <Skeleton className='h-14' />
        </div>
      ) : visitors.data.length === 0 ? (
        <EmptyState
          icon={UserRoundCheck}
          title='No approved visitors'
          description='Parents are always known. Add relatives or family friends who may visit.'
        />
      ) : (
        <ul className='divide-y rounded-lg border'>
          {visitors.data.map((visitor) => (
            <li key={visitor.id} className='flex items-center justify-between gap-3 px-3 py-2'>
              <div className='grid min-w-0 gap-0.5'>
                <span className='truncate text-sm font-semibold'>
                  {visitor.name}{' '}
                  <span className='font-normal text-muted-foreground'>({visitor.relation})</span>
                </span>
                <span className='tabular text-xs text-muted-foreground'>
                  +91 {visitor.mobile} · added {formatDate(visitor.created_at)}
                </span>
              </div>
              <div className='flex shrink-0 items-center gap-1'>
                <Badge tone={visitor.added_by_role === 'parent' ? 'info' : 'neutral'}>
                  {visitor.added_by_role === 'parent' ? 'Parent' : 'Staff'}
                </Badge>
                {canEdit && (
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label={`Remove ${visitor.name}`}
                    onClick={() => setRemoving(visitor)}
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canEdit && <AddVisitorForm studentId={student.id} />}

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title='Remove approved visitor'
        description={
          removing
            ? `${removing.name} (+91 ${removing.mobile}) will be treated as an unknown visitor.`
            : ''
        }
        confirmText='Remove'
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          if (!removing) return
          remove.mutate(removing.id, {
            onSuccess: () => {
              alerts.success('Approved visitor removed')
              setRemoving(null)
            },
            onError: (error) => alerts.error(toApiError(error).message),
          })
        }}
      />
    </div>
  )
}

function AddVisitorForm({ studentId }: { studentId: number }) {
  const add = useHostelMutation((input: ApprovedVisitorInput) =>
    hostelApi.addApprovedVisitor(studentId, input)
  )
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', relation: '', mobile: '' },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await add.mutateAsync(values)
      alerts.success('Approved visitor added')
      reset()
    } catch (error) {
      applyApiError(error, setError, ['name', 'relation', 'mobile'], {
        HOSTEL_VISITOR_EXISTS: 'mobile',
      })
    }
  })

  return (
    <form noValidate onSubmit={submit} className='grid gap-3 rounded-lg border bg-muted/30 p-3'>
      <h3 className='text-sm font-bold'>Add a visitor</h3>
      <FormAlert message={errors.root?.message} />
      <div className='grid gap-3 sm:grid-cols-2'>
        <FormField id='approved-name' label='Name' required error={errors.name?.message}>
          <Input
            id='approved-name'
            autoComplete='off'
            placeholder='Suresh M'
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
        </FormField>
        <FormField
          id='approved-relation'
          label='Relation'
          required
          error={errors.relation?.message}
        >
          <Input
            id='approved-relation'
            autoComplete='off'
            placeholder='Uncle'
            aria-invalid={Boolean(errors.relation)}
            {...register('relation')}
          />
        </FormField>
        <FormField id='approved-mobile' label='Mobile' required error={errors.mobile?.message}>
          <Input
            id='approved-mobile'
            type='tel'
            inputMode='numeric'
            maxLength={10}
            placeholder='9876543210'
            className='tabular'
            aria-invalid={Boolean(errors.mobile)}
            {...register('mobile', { setValueAs: digitsOnly })}
          />
        </FormField>
        <div className='flex items-end'>
          <Button type='submit' loading={add.isPending} className='w-full sm:w-auto'>
            <Plus />
            Add visitor
          </Button>
        </div>
      </div>
    </form>
  )
}
