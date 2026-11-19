import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Printer } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { libraryApi, useLibraryMutation, type Copy } from '../api'
import { copiesPayload, copiesSchema, emptyCopies } from '../form-utils'
import { openLabels, plural } from '../labels'
import { CopiesFields } from './copies-fields'
import { FormError } from './library-parts'

const FORM_ID = 'library-add-copies'
const schema = z.object({ copies: copiesSchema(1) })
type FormValues = z.infer<typeof schema>

export function AddCopiesModal({
  book,
  onClose,
}: {
  book: { id: number; title: string }
  onClose: () => void
}) {
  const [added, setAdded] = useState<Copy[] | null>(null)
  const save = useLibraryMutation((values: FormValues) =>
    libraryApi.addCopies(book.id, copiesPayload(values.copies))
  )

  if (added) {
    return (
      <AppModal
        open
        onOpenChange={(open) => !open && onClose()}
        title='Copies added'
        description={book.title}
        footer={
          <DialogFooter>
            <Button variant='outline' onClick={onClose}>
              Done
            </Button>
            <Button
              onClick={() => openLabels({ copy_ids: added.map((copy) => copy.id).join(',') })}
            >
              <Printer />
              Print labels
            </Button>
          </DialogFooter>
        }
      >
        <div className='grid gap-3'>
          <div className='flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-3 text-sm'>
            <CheckCircle2 className='size-5 shrink-0 text-success' />
            {plural(added.length, 'copy', 'copies')} added.
          </div>
          <ul className='flex flex-wrap gap-1.5'>
            {added.map((copy) => (
              <li key={copy.id} className='rounded-md border px-2 py-0.5 font-mono text-xs'>
                {copy.accession_no}
                {copy.barcode !== copy.accession_no ? ` · ${copy.barcode}` : ''}
              </li>
            ))}
          </ul>
        </div>
      </AppModal>
    )
  }

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Add copies'
      description={book.title}
      formId={FORM_ID}
      submitText='Add copies'
      loading={save.isPending}
      size='lg'
    >
      <CopiesForm
        onSubmit={async (values) => {
          const copies = await save.mutateAsync(values)
          alerts.success(`${plural(copies.length, 'copy', 'copies')} added`)
          setAdded(copies)
        }}
      />
    </AppModal>
  )
}

function CopiesForm({ onSubmit }: { onSubmit: (values: FormValues) => Promise<void> }) {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { copies: emptyCopies('1') },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      setError('root', { message: toApiError(error).message })
    }
  })

  return (
    <form id={FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
      <FormError message={errors.root?.message} />
      <Controller
        control={control}
        name='copies'
        render={({ field }) => (
          <CopiesFields value={field.value} onChange={field.onChange} errors={errors.copies} />
        )}
      />
    </form>
  )
}
