import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  BookCopy,
  BookOpen,
  BookPlus,
  CircleOff,
  CopyPlus,
  FileSpreadsheet,
  Pencil,
  Sparkles,
  Tags,
  TriangleAlert,
  Trash2,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  BOOK_AVAILABILITY,
  libraryApi,
  useBookInsights,
  useBooks,
  useCategories,
  useLibraryMutation,
  type Book,
} from '../api'
import { LIST_LIMIT, oneOf, type LibraryTabProps } from '../search'
import { AddCopiesModal } from './add-copies-modal'
import { BookFormModal, type BookPrefill } from './book-form-modal'
import { CategoriesModal } from './categories-modal'
import { ImportModal } from './import-modal'
import { IsbnScanModal } from './isbn-scan-modal'

const LANGUAGES = ['English', 'Tamil', 'Hindi', 'Sanskrit', 'French']

export function CatalogueTab({ search, onChange }: LibraryTabProps) {
  const navigate = useNavigate()
  const canManage = can(useMe().data, 'library.manage')
  const availability = oneOf(BOOK_AVAILABILITY, search.availability)
  const params = {
    page: search.page ?? 1,
    limit: LIST_LIMIT,
    search: search.search,
    sort: search.sort,
    order: search.order,
    category_id: search.category_id,
    language: search.language,
    availability,
    is_active: search.is_active,
  }
  const books = useBooks(params)
  const insights = useBookInsights()
  const categories = useCategories()
  const remove = useLibraryMutation((id: number) => libraryApi.removeBook(id))
  const [scanning, setScanning] = useState(false)
  const [form, setForm] = useState<{ book: Book | null; prefill: BookPrefill | null } | null>(null)
  const [addingTo, setAddingTo] = useState<Book | null>(null)
  const [deleting, setDeleting] = useState<Book | null>(null)
  const [importing, setImporting] = useState(false)
  const [managingCategories, setManagingCategories] = useState(false)

  const open = (book: Book) =>
    navigate({ to: '/library/books/$bookId', params: { bookId: String(book.id) }, search: {} })

  const data = insights.data
  const cards: Insight[] = [
    {
      key: 'titles',
      label: 'Titles',
      value: data?.titles ?? 0,
      hint: `${data?.copies ?? 0} copies · ${data?.added_this_month ?? 0} added this month`,
      icon: BookOpen,
      tone: 'primary',
      active: !availability && search.is_active === undefined,
      onClick: () => onChange({ availability: undefined, is_active: undefined }),
    },
    {
      key: 'available',
      label: 'On the shelf',
      value: data?.available ?? 0,
      hint: `${data?.issued ?? 0} issued now`,
      icon: BookCopy,
      tone: 'success',
      active: availability === 'available',
      onClick: () =>
        onChange({ availability: availability === 'available' ? undefined : 'available' }),
    },
    {
      key: 'none',
      label: 'Overdue copies',
      value: data?.overdue ?? 0,
      hint: 'Click for titles with no copy free',
      icon: TriangleAlert,
      tone: data?.overdue ? 'warning' : 'neutral',
      active: availability === 'none_available',
      onClick: () =>
        onChange({
          availability: availability === 'none_available' ? undefined : 'none_available',
        }),
    },
    {
      key: 'lost',
      label: 'Lost or damaged',
      value: (data?.lost ?? 0) + (data?.damaged ?? 0),
      hint: `${data?.lost ?? 0} lost · ${data?.damaged ?? 0} damaged`,
      icon: Sparkles,
      tone: data?.lost ? 'danger' : 'neutral',
    },
  ]

  const columns: Column<Book>[] = [
    {
      key: 'title',
      header: 'Book',
      sortKey: 'title',
      cell: (book) => (
        <div className='grid min-w-0'>
          <span className='flex items-center gap-1.5'>
            <span className='truncate font-bold'>{book.title}</span>
            {book.is_reference && <Badge tone='info'>Reference</Badge>}
            {!book.is_active && <Badge>Hidden</Badge>}
          </span>
          <span className='truncate text-xs text-muted-foreground'>
            {book.authors ?? 'Unknown author'}
          </span>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      cell: (book) => book.category?.name ?? <span className='text-muted-foreground'>—</span>,
    },
    {
      key: 'isbn',
      header: 'ISBN',
      hideBelow: 'xl',
      cell: (book) => <span className='font-mono text-xs'>{book.isbn ?? '—'}</span>,
    },
    {
      key: 'available',
      header: 'Available',
      sortKey: 'available',
      cell: (book) => (
        <Badge tone={book.copies.available ? 'success' : book.copies.total ? 'warning' : 'neutral'}>
          {book.copies.available} / {book.copies.total}
        </Badge>
      ),
    },
    {
      key: 'location',
      header: 'Shelf',
      hideBelow: 'lg',
      cell: (book) =>
        [book.rack, book.shelf].filter(Boolean).join(' / ') || (
          <span className='text-muted-foreground'>—</span>
        ),
    },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      className: 'w-32',
      cell: (book) =>
        canManage && (
          <RowActions book={book} onEdit={setForm} onAdd={setAddingTo} onDelete={setDeleting} />
        ),
    },
  ]

  const filtered = Boolean(
    search.search ||
    search.category_id ||
    search.language ||
    availability ||
    search.is_active !== undefined
  )

  return (
    <div className='grid gap-4'>
      <InsightCards items={cards} loading={insights.isPending} />
      <Card className='overflow-hidden'>
        <ListToolbar
          summary={
            books.data ? `${books.data.total} ${books.data.total === 1 ? 'title' : 'titles'}` : ''
          }
          onClear={
            filtered
              ? () =>
                  onChange({
                    search: undefined,
                    category_id: undefined,
                    language: undefined,
                    availability: undefined,
                    is_active: undefined,
                  })
              : undefined
          }
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => onChange({ search: value || undefined })}
            placeholder='Title, author, ISBN or barcode'
            label='Search books'
          />
          <FilterSelect
            id='book-category-filter'
            label='Filter by category'
            allLabel='All categories'
            value={search.category_id ? String(search.category_id) : undefined}
            options={(categories.data ?? []).map((item) => ({
              value: String(item.id),
              label: item.name,
              hint: String(item.book_count),
            }))}
            onChange={(value) => onChange({ category_id: value ? Number(value) : undefined })}
          />
          <FilterSelect
            id='book-language-filter'
            label='Filter by language'
            allLabel='All languages'
            value={search.language}
            options={LANGUAGES.map((value) => ({ value, label: value }))}
            onChange={(language) => onChange({ language })}
          />
          <FilterSelect
            id='book-availability-filter'
            label='Filter by availability'
            allLabel='Any availability'
            value={availability}
            options={[
              { value: 'available', label: 'A copy is free' },
              { value: 'none_available', label: 'No copy free' },
            ]}
            onChange={(value) => onChange({ availability: value })}
          />
          <FilterSelect
            id='book-active-filter'
            label='Filter by catalogue status'
            allLabel='Shown and hidden'
            value={search.is_active === undefined ? undefined : String(search.is_active)}
            options={[
              { value: 'true', label: 'In the catalogue' },
              { value: 'false', label: 'Hidden' },
            ]}
            onChange={(value) => onChange({ is_active: value ? value === 'true' : undefined })}
          />
          {canManage && (
            <div className='flex flex-wrap gap-2 sm:ml-auto'>
              <Button variant='outline' size='sm' onClick={() => setManagingCategories(true)}>
                <Tags />
                Categories
              </Button>
              <Button variant='outline' size='sm' onClick={() => setImporting(true)}>
                <FileSpreadsheet />
                Import
              </Button>
              <Button size='sm' onClick={() => setScanning(true)}>
                <BookPlus />
                Add book
              </Button>
            </div>
          )}
          {!canManage && (
            <Button variant='outline' size='sm' onClick={() => setManagingCategories(true)}>
              <Tags />
              Categories
            </Button>
          )}
        </ListToolbar>
        <DataTable
          rows={books.data?.items ?? []}
          columns={columns}
          rowKey={(book) => book.id}
          loading={books.isFetching}
          error={books.isError ? books.error.message : null}
          onRetry={() => books.refetch()}
          onRowClick={open}
          sort={{ sort: search.sort, order: search.order ?? 'desc' }}
          onSortChange={(next) => onChange(next)}
          empty={{
            icon: filtered ? CircleOff : BookOpen,
            title: filtered ? 'No books match these filters' : 'No books yet',
            description: filtered
              ? 'Try another title or barcode, or clear the filters.'
              : 'Scan the ISBN on the back cover to add the first book, or import a list.',
            action: !filtered && canManage && (
              <Button onClick={() => setScanning(true)}>
                <BookPlus />
                Add book
              </Button>
            ),
          }}
          card={(book) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                <div className='grid min-w-0'>
                  <span className='truncate font-bold'>{book.title}</span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {[book.authors, book.category?.name].filter(Boolean).join(' · ')}
                  </span>
                </div>
                <Badge tone={book.copies.available ? 'success' : 'warning'} className='shrink-0'>
                  {book.copies.available} / {book.copies.total}
                </Badge>
              </div>
              <span className='text-xs text-muted-foreground'>
                {[book.isbn, [book.rack, book.shelf].filter(Boolean).join(' / ')]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
          )}
          pagination={{
            page: search.page ?? 1,
            limit: LIST_LIMIT,
            total: books.data?.total ?? 0,
            label: 'titles',
            onPageChange: (page) => onChange({ page }),
          }}
        />
      </Card>

      <IsbnScanModal
        open={scanning}
        onOpenChange={setScanning}
        onCreate={(prefill) => setForm({ book: null, prefill })}
        onAddCopies={setAddingTo}
      />
      <BookFormModal
        open={Boolean(form)}
        onOpenChange={(next) => !next && setForm(null)}
        book={form?.book ?? null}
        prefill={form?.prefill}
      />
      {addingTo && <AddCopiesModal book={addingTo} onClose={() => setAddingTo(null)} />}
      {importing && <ImportModal onClose={() => setImporting(false)} />}
      <CategoriesModal
        open={managingCategories}
        onOpenChange={setManagingCategories}
        canManage={canManage}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => !next && setDeleting(null)}
        title={`Delete ${deleting?.title ?? 'book'}?`}
        description='The title and all its copies leave the catalogue. Past loans stay in the history. A book with a copy out on loan cannot be deleted.'
        confirmText='Delete book'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return
          try {
            await remove.mutateAsync(deleting.id)
            alerts.success('Book deleted')
            setDeleting(null)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      />
    </div>
  )
}

function RowActions({
  book,
  onEdit,
  onAdd,
  onDelete,
}: {
  book: Book
  onEdit: (value: { book: Book; prefill: null }) => void
  onAdd: (book: Book) => void
  onDelete: (book: Book) => void
}) {
  return (
    <div className='inline-flex gap-1'>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label={`Add copies of ${book.title}`}
        onClick={(event) => {
          event.stopPropagation()
          onAdd(book)
        }}
      >
        <CopyPlus />
      </Button>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label={`Edit ${book.title}`}
        onClick={(event) => {
          event.stopPropagation()
          onEdit({ book, prefill: null })
        }}
      >
        <Pencil />
      </Button>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label={`Delete ${book.title}`}
        className='text-destructive hover:bg-destructive/10'
        onClick={(event) => {
          event.stopPropagation()
          onDelete(book)
        }}
      >
        <Trash2 />
      </Button>
    </div>
  )
}
