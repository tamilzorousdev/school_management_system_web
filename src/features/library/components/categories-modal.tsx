import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { EmptyState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { libraryApi, useCategories, useLibraryMutation, type Category } from '../api'
import { textOrNull } from '../form-utils'
import { FormError } from './library-parts'

const FORM_ID = 'library-category-form'

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name is 2 to 60 characters')
    .max(60, 'Name is 2 to 60 characters'),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{1,20}$/, 'Code is 1 to 20 letters, digits or dashes'),
  is_reference: z.boolean(),
  description: z.string().trim().max(255, 'Description is up to 255 characters'),
})

type FormValues = z.infer<typeof schema>

export function CategoriesModal({
  open,
  onOpenChange,
  canManage,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  canManage: boolean
}) {
  const categories = useCategories()
  const [editing, setEditing] = useState<Category | 'new' | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const remove = useLibraryMutation((id: number) => libraryApi.removeCategory(id))
  const save = useLibraryMutation((values: FormValues) => {
    const input = { ...values, description: textOrNull(values.description) }
    return editing && editing !== 'new'
      ? libraryApi.updateCategory(editing.id, input)
      : libraryApi.createCategory(input)
  })

  const rows = categories.data ?? []

  return (
    <AppModal
      open={open}
      onOpenChange={(next) => {
        if (!next) setEditing(null)
        onOpenChange(next)
      }}
      title={editing ? (editing === 'new' ? 'Add category' : 'Edit category') : 'Categories'}
      description={
        editing
          ? 'Books in a reference category are read in the library and never issued.'
          : 'Group books by category. Codes appear on labels and reports.'
      }
      formId={editing ? FORM_ID : undefined}
      submitText={editing === 'new' ? 'Add category' : 'Save category'}
      loading={save.isPending}
      size='lg'
    >
      {editing ? (
        <CategoryForm
          key={editing === 'new' ? 'new' : editing.id}
          category={editing === 'new' ? null : editing}
          onSubmit={async (values) => {
            await save.mutateAsync(values)
            alerts.success(editing === 'new' ? 'Category added' : 'Category saved')
            setEditing(null)
          }}
        />
      ) : (
        <div className='grid gap-3'>
          {canManage && (
            <Button
              variant='outline'
              className='justify-self-start'
              onClick={() => setEditing('new')}
            >
              <Plus />
              Add category
            </Button>
          )}
          {categories.isPending ? (
            <Skeleton className='h-32' />
          ) : rows.length ? (
            <ul className='max-h-[55vh] divide-y overflow-y-auto rounded-lg border'>
              {rows.map((category) => (
                <li
                  key={category.id}
                  className='flex items-center justify-between gap-3 px-3 py-2.5'
                >
                  <div className='grid min-w-0'>
                    <span className='flex items-center gap-2'>
                      <span className='truncate font-semibold'>{category.name}</span>
                      <span className='font-mono text-xs text-muted-foreground'>
                        {category.code}
                      </span>
                      {category.is_reference && <Badge tone='info'>Reference</Badge>}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      {category.book_count} books · {category.copy_count} copies
                    </span>
                  </div>
                  {canManage &&
                    (deleting === category.id ? (
                      <div className='flex shrink-0 items-center gap-1'>
                        <span className='text-xs text-muted-foreground'>Delete?</span>
                        <Button
                          size='sm'
                          variant='destructive'
                          loading={remove.isPending}
                          onClick={async () => {
                            try {
                              await remove.mutateAsync(category.id)
                              alerts.success('Category deleted')
                            } catch (error) {
                              alerts.error(toApiError(error).message)
                            }
                            setDeleting(null)
                          }}
                        >
                          Delete
                        </Button>
                        <Button size='sm' variant='ghost' onClick={() => setDeleting(null)}>
                          Keep
                        </Button>
                      </div>
                    ) : (
                      <div className='flex shrink-0 gap-1'>
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          aria-label={`Edit ${category.name}`}
                          onClick={() => setEditing(category)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          aria-label={`Delete ${category.name}`}
                          className='text-destructive hover:bg-destructive/10'
                          disabled={category.book_count > 0}
                          title={category.book_count > 0 ? 'Move its books first' : undefined}
                          onClick={() => setDeleting(category.id)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    ))}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Tags}
              title='No categories yet'
              description='Add Fiction, Reference, Science and so on.'
            />
          )}
        </div>
      )}
    </AppModal>
  )
}

function CategoryForm({
  category,
  onSubmit,
}: {
  category: Category | null
  onSubmit: (values: FormValues) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name ?? '',
      code: category?.code ?? '',
      is_reference: category?.is_reference ?? false,
      description: category?.description ?? '',
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      const apiError = toApiError(error)
      const field = apiError.fieldErrors[0]?.field
      if (field === 'name' || field === 'code' || field === 'description') {
        setError(field, { message: apiError.fieldErrors[0].message })
      } else if (apiError.status === 409) {
        setError('code', { message: apiError.message })
      } else {
        setError('root', { message: apiError.message })
      }
    }
  })

  return (
    <form id={FORM_ID} noValidate onSubmit={submit} className='grid gap-4 sm:grid-cols-2'>
      <div className='sm:col-span-2'>
        <FormError message={errors.root?.message} />
      </div>
      <FormField id='category-name' label='Name' required error={errors.name?.message}>
        <Input
          id='category-name'
          autoFocus
          aria-invalid={Boolean(errors.name)}
          {...register('name')}
        />
      </FormField>
      <FormField id='category-code' label='Code' required error={errors.code?.message}>
        <Input
          id='category-code'
          className='font-mono uppercase'
          placeholder='FIC'
          aria-invalid={Boolean(errors.code)}
          {...register('code')}
        />
      </FormField>
      <FormField
        id='category-description'
        label='Description'
        error={errors.description?.message}
        className='sm:col-span-2'
      >
        <Input id='category-description' {...register('description')} />
      </FormField>
      <div className='flex items-center justify-between gap-3 rounded-lg border px-3 py-2 sm:col-span-2'>
        <div className='grid'>
          <span className='text-sm font-semibold'>Reference only</span>
          <span className='text-xs text-muted-foreground'>
            Read in the library; the desk refuses to issue them.
          </span>
        </div>
        <Controller
          control={control}
          name='is_reference'
          render={({ field }) => (
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-label='Reference only'
            />
          )}
        />
      </div>
    </form>
  )
}
