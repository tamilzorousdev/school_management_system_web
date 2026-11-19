import { useState, type FormEvent } from 'react'
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  accountsApi,
  useAccountCategories,
  useAccountsMutation,
  type AccountCategory,
  type AccountKind,
} from '../api'
import { KIND_LABEL } from '../labels'
import type { AccountsTabProps } from '../search'

const FORM_ID = 'account-category-form'

export function CategoriesTab({ canApprove, adding, onAddingChange }: AccountsTabProps) {
  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      <CategoryList kind='expense' canEdit={canApprove} />
      <CategoryList kind='income' canEdit={canApprove} />
      <CategoryModal
        open={adding}
        onOpenChange={onAddingChange}
        category={null}
        defaultKind='expense'
      />
    </div>
  )
}

function CategoryList({ kind, canEdit }: { kind: AccountKind; canEdit: boolean }) {
  const categories = useAccountCategories(kind, true)
  const [editing, setEditing] = useState<AccountCategory | null>(null)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<AccountCategory | null>(null)
  const toggle = useAccountsMutation((input: { id: number; is_active: boolean }) =>
    accountsApi.updateCategory(input.id, { is_active: input.is_active })
  )
  const remove = useAccountsMutation((id: number) => accountsApi.removeCategory(id))

  const columns: Column<AccountCategory>[] = [
    {
      key: 'name',
      header: 'Category',
      cell: (category) => (
        <span className='inline-flex items-center gap-2'>
          <span className={category.is_active ? 'font-semibold' : 'text-muted-foreground'}>
            {category.name}
          </span>
          {!category.is_active && <Badge tone='neutral'>Off</Badge>}
        </span>
      ),
    },
    {
      key: 'entries',
      header: 'Entries',
      align: 'right',
      cell: (category) => <span className='tabular'>{category.entries}</span>,
    },
    {
      key: 'active',
      header: 'In use',
      align: 'right',
      cell: (category) => (
        <Switch
          aria-label={`Offer ${category.name} for new entries`}
          checked={category.is_active}
          disabled={!canEdit || toggle.isPending}
          onClick={(event) => event.stopPropagation()}
          onCheckedChange={async (checked) => {
            try {
              await toggle.mutateAsync({ id: category.id, is_active: checked })
            } catch (error) {
              alerts.error(toApiError(error).message)
            }
          }}
        />
      ),
    },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      className: 'w-24',
      cell: (category) =>
        canEdit && (
          <span className='inline-flex gap-1'>
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={`Rename ${category.name}`}
              title='Rename'
              onClick={(event) => {
                event.stopPropagation()
                setEditing(category)
              }}
            >
              <Pencil />
            </Button>
            {category.entries === 0 && (
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label={`Delete ${category.name}`}
                title='Delete'
                className='text-destructive hover:bg-destructive/10'
                onClick={(event) => {
                  event.stopPropagation()
                  setDeleting(category)
                }}
              >
                <Trash2 />
              </Button>
            )}
          </span>
        ),
    },
  ]

  return (
    <Card className='overflow-hidden'>
      <div className='flex items-center justify-between gap-3 border-b px-4 py-3'>
        <div className='grid gap-0.5'>
          <h2 className='font-bold'>{KIND_LABEL[kind]} categories</h2>
          <p className='text-xs text-muted-foreground'>
            Switch one off to stop offering it; its past entries stay.
          </p>
        </div>
        {canEdit && (
          <Button size='sm' variant='outline' onClick={() => setAdding(true)}>
            <Plus />
            Add
          </Button>
        )}
      </div>
      <DataTable
        rows={categories.data ?? []}
        columns={columns}
        rowKey={(category) => category.id}
        loading={categories.isFetching}
        error={categories.isError ? categories.error.message : null}
        onRetry={() => categories.refetch()}
        onRowClick={canEdit ? setEditing : undefined}
        empty={{ icon: Tags, title: 'No categories yet', description: 'Add the first one.' }}
        card={(category) => (
          <div className='flex items-center justify-between gap-2'>
            <span className={category.is_active ? 'font-semibold' : 'text-muted-foreground'}>
              {category.name}
            </span>
            <span className='text-xs text-muted-foreground'>
              {category.entries} {category.entries === 1 ? 'entry' : 'entries'}
              {category.is_active ? '' : ' · off'}
            </span>
          </div>
        )}
      />
      <CategoryModal
        open={adding || Boolean(editing)}
        onOpenChange={(open) => {
          if (open) return
          setAdding(false)
          setEditing(null)
        }}
        category={editing}
        defaultKind={kind}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title='Delete this category?'
        description={deleting ? `${deleting.name} has no entries and will be removed.` : ''}
        confirmText='Delete'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return
          try {
            await remove.mutateAsync(deleting.id)
            alerts.success('Category deleted')
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
  open,
  onOpenChange,
  category,
  defaultKind,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: AccountCategory | null
  defaultKind: AccountKind
}) {
  const save = useAccountsMutation((input: { kind: AccountKind; name: string }) =>
    category
      ? accountsApi.updateCategory(category.id, { name: input.name })
      : accountsApi.createCategory(input)
  )
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={category ? `Rename ${category.name}` : 'Add category'}
      formId={FORM_ID}
      submitText={category ? 'Save' : 'Add category'}
      loading={save.isPending}
      size='sm'
    >
      {open && (
        <CategoryForm
          key={category?.id ?? `new-${defaultKind}`}
          category={category}
          defaultKind={defaultKind}
          onSubmit={async (input) => {
            await save.mutateAsync(input)
            alerts.success(category ? 'Category renamed' : 'Category added')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function CategoryForm({
  category,
  defaultKind,
  onSubmit,
}: {
  category: AccountCategory | null
  defaultKind: AccountKind
  onSubmit: (input: { kind: AccountKind; name: string }) => Promise<void>
}) {
  const [kind, setKind] = useState<AccountKind>(category?.kind ?? defaultKind)
  const [name, setName] = useState(category?.name ?? '')
  const [error, setError] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const text = name.trim()
    if (text.length < 2) return setError('Enter at least 2 characters')
    setError('')
    try {
      await onSubmit({ kind, name: text })
    } catch (caught) {
      const apiError = toApiError(caught)
      setError(apiError.fieldErrors[0]?.message ?? apiError.message)
    }
  }

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      {!category && (
        <FormField id='category-kind' label='Type' required>
          <div className='flex gap-2' role='radiogroup' aria-label='Type'>
            {(['expense', 'income'] as const).map((value) => (
              <Button
                key={value}
                type='button'
                role='radio'
                aria-checked={kind === value}
                variant={kind === value ? 'default' : 'outline'}
                size='sm'
                onClick={() => setKind(value)}
              >
                {KIND_LABEL[value]}
              </Button>
            ))}
          </div>
        </FormField>
      )}
      <FormField id='category-name' label='Name' required error={error}>
        <Input
          id='category-name'
          maxLength={60}
          autoFocus
          placeholder={kind === 'expense' ? 'Generator diesel' : 'Sports day sponsorship'}
          aria-invalid={Boolean(error) || undefined}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </FormField>
    </form>
  )
}
