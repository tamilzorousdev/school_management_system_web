import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { galleryApi, useGalleryCategories, useGalleryMutation, type GalleryCategory } from '../api'

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Enter a name of 2 to 60 letters')
    .max(60, 'Enter a name of 2 to 60 letters'),
  sort_order: z
    .number({ error: 'Enter a number' })
    .int('Enter a whole number')
    .min(0, 'Use 0 or more'),
  is_active: z.boolean(),
})

type Values = z.infer<typeof schema>

export function CategoriesPanel({ canConfigure }: { canConfigure: boolean }) {
  const categories = useGalleryCategories(true)
  const remove = useGalleryMutation(galleryApi.removeCategory)
  const [editing, setEditing] = useState<GalleryCategory | 'new' | null>(null)
  const [deleting, setDeleting] = useState<GalleryCategory | null>(null)
  const rows = categories.data ?? []

  const columns: Column<GalleryCategory>[] = [
    {
      key: 'name',
      header: 'Category',
      cell: (category) => (
        <div className='grid'>
          <span className='font-bold'>{category.name}</span>
          {category.key && <span className='text-xs text-muted-foreground'>Built in</span>}
        </div>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      cell: (category) => <span className='tabular'>{category.sort_order}</span>,
    },
    {
      key: 'albums',
      header: 'Albums',
      cell: (category) => <span className='tabular'>{category.album_count}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (category) =>
        category.is_active ? (
          <Badge tone='success' dot>
            Active
          </Badge>
        ) : (
          <Badge dot>Hidden</Badge>
        ),
    },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      cell: (category) =>
        canConfigure && (
          <div className='inline-flex gap-1'>
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={`Edit ${category.name}`}
              onClick={(event) => {
                event.stopPropagation()
                setEditing(category)
              }}
            >
              <Pencil />
            </Button>
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={`Delete ${category.name}`}
              className='text-destructive hover:bg-destructive/10'
              onClick={(event) => {
                event.stopPropagation()
                setDeleting(category)
              }}
            >
              <Trash2 />
            </Button>
          </div>
        ),
    },
  ]

  return (
    <Card className='overflow-hidden'>
      <CardHeader className='pb-4'>
        <div className='grid gap-0.5'>
          <CardTitle>Categories</CardTitle>
          <CardDescription>Used to group albums and in retention policies.</CardDescription>
        </div>
        {canConfigure && (
          <Button size='sm' onClick={() => setEditing('new')}>
            <Plus />
            Add category
          </Button>
        )}
      </CardHeader>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(category) => category.id}
        loading={categories.isFetching}
        error={categories.isError ? categories.error.message : null}
        onRetry={() => categories.refetch()}
        onRowClick={canConfigure ? (category) => setEditing(category) : undefined}
        empty={{ icon: Tags, title: 'No categories yet' }}
        card={(category) => (
          <div className='flex items-center justify-between gap-3'>
            <div className='grid'>
              <span className='font-bold'>{category.name}</span>
              <span className='text-xs text-muted-foreground'>
                {category.album_count} albums · order {category.sort_order}
              </span>
            </div>
            {category.is_active ? <Badge tone='success'>Active</Badge> : <Badge>Hidden</Badge>}
          </div>
        )}
      />
      <CategoryModal category={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name ?? 'category'}?`}
        description='Only categories no album uses can be deleted. Hide it instead to keep old albums grouped.'
        confirmText='Delete category'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return
          try {
            await remove.mutateAsync(deleting.id)
            alerts.success('Category removed')
            setDeleting(null)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      />
    </Card>
  )
}

function CategoryModal({
  category,
  onClose,
}: {
  category: GalleryCategory | 'new' | null
  onClose: () => void
}) {
  const create = useGalleryMutation(galleryApi.createCategory)
  const update = useGalleryMutation(galleryApi.updateCategory)
  const existing = category && category !== 'new' ? category : null
  return (
    <AppModal
      open={Boolean(category)}
      onOpenChange={(open) => !open && onClose()}
      title={existing ? 'Edit category' : 'Add category'}
      formId='gallery-category-form'
      submitText={existing ? 'Save' : 'Add category'}
      loading={create.isPending || update.isPending}
      size='sm'
    >
      {category && (
        <CategoryForm
          key={existing?.id ?? 'new'}
          category={existing}
          onSubmit={async (values) => {
            if (existing) await update.mutateAsync({ id: existing.id, ...values })
            else await create.mutateAsync(values)
            alerts.success(existing ? 'Category saved' : 'Category added')
            onClose()
          }}
        />
      )}
    </AppModal>
  )
}

function CategoryForm({
  category,
  onSubmit,
}: {
  category: GalleryCategory | null
  onSubmit: (values: Values) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name ?? '',
      sort_order: category?.sort_order ?? 0,
      is_active: category?.is_active ?? true,
    },
  })
  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      const apiError = toApiError(error)
      setError(apiError.fieldError('sort_order') ? 'sort_order' : 'name', {
        message:
          apiError.fieldError('sort_order') ?? apiError.fieldError('name') ?? apiError.message,
      })
    }
  })
  return (
    <form id='gallery-category-form' onSubmit={submit} noValidate className='grid gap-4'>
      <FormField id='category-name' label='Name' required error={errors.name?.message}>
        <Input
          id='category-name'
          autoFocus
          maxLength={60}
          placeholder='Science fair'
          aria-invalid={Boolean(errors.name) || undefined}
          {...register('name')}
        />
      </FormField>
      <FormField
        id='category-order'
        label='Order'
        hint='Lower numbers show first'
        error={errors.sort_order?.message}
      >
        <Input
          id='category-order'
          type='number'
          min={0}
          aria-invalid={Boolean(errors.sort_order) || undefined}
          {...register('sort_order', { valueAsNumber: true })}
        />
      </FormField>
      <Controller
        control={control}
        name='is_active'
        render={({ field }) => (
          <div className='flex items-center justify-between gap-3 rounded-lg border p-3 text-sm'>
            <label htmlFor='category-active' className='grid cursor-pointer'>
              <span className='font-semibold'>Active</span>
              <span className='text-xs text-muted-foreground'>
                Hidden categories cannot be picked for new albums
              </span>
            </label>
            <Switch id='category-active' checked={field.value} onCheckedChange={field.onChange} />
          </div>
        )}
      />
    </form>
  )
}
