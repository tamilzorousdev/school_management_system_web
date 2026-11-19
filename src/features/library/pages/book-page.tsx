import { useState } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, BookCopy, CopyPlus, History, Pencil, Printer, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { DetailList, ErrorState } from '@/components/common/display'
import { Page } from '@/components/common/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { rupees } from '@/features/fees/labels'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import {
  libraryApi,
  useBook,
  useBookCopies,
  useIssues,
  useLibraryMutation,
  type Copy,
} from '../api'
import { AddCopiesModal } from '../components/add-copies-modal'
import { BookFormModal } from '../components/book-form-modal'
import { CopyEditModal, CopyHistoryModal } from '../components/copy-modals'
import {
  CopyStatusBadge,
  LoanStateBadge,
  MemberLine,
  Section,
  Stat,
} from '../components/library-parts'
import { LoanTable } from '../components/loan-table'
import { COPY_CONDITION, COPY_SOURCE, openLabels } from '../labels'
import { LIST_LIMIT } from '../search'

const route = getRouteApi('/_app/library/books/$bookId')

export function BookPage() {
  const { bookId } = route.useParams()
  const search = route.useSearch()
  const id = Number(bookId)
  const navigate = useNavigate()
  const canManage = can(useMe().data, 'library.manage')
  const book = useBook(id)
  const copies = useBookCopies(id)
  const history = useIssues({
    page: search.page ?? 1,
    limit: LIST_LIMIT,
    book_id: id,
    sort: 'issued_at',
    order: 'desc',
  })
  const remove = useLibraryMutation(() => libraryApi.removeBook(id))
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editCopy, setEditCopy] = useState<Copy | null>(null)
  const [historyCopy, setHistoryCopy] = useState<Copy | null>(null)
  const data = book.data

  if (book.isError && !data) {
    return (
      <Page>
        <ErrorState message={book.error.message} onRetry={() => book.refetch()} />
      </Page>
    )
  }

  if (!data) {
    return (
      <Page>
        <Skeleton className='h-40' />
        <Skeleton className='h-64' />
      </Page>
    )
  }

  const copyActions = (copy: Copy) => (
    <div className='inline-flex gap-1'>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label={`History of ${copy.accession_no}`}
        onClick={() => setHistoryCopy(copy)}
      >
        <History />
      </Button>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label={`Print label for ${copy.accession_no}`}
        onClick={() => openLabels({ copy_ids: String(copy.id) })}
      >
        <Printer />
      </Button>
      {canManage && (
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={`Edit ${copy.accession_no}`}
          onClick={() => setEditCopy(copy)}
        >
          <Pencil />
        </Button>
      )}
    </div>
  )

  const columns: Column<Copy>[] = [
    {
      key: 'accession_no',
      header: 'Accession',
      cell: (copy) => (
        <div className='grid'>
          <span className='font-mono text-xs font-semibold'>{copy.accession_no}</span>
          {copy.barcode !== copy.accession_no && (
            <span className='font-mono text-[11px] text-muted-foreground'>{copy.barcode}</span>
          )}
        </div>
      ),
    },
    { key: 'status', header: 'Status', cell: (copy) => <CopyStatusBadge status={copy.status} /> },
    { key: 'condition', header: 'Condition', cell: (copy) => COPY_CONDITION[copy.condition] },
    {
      key: 'with',
      header: 'With',
      cell: (copy) =>
        copy.current_loan ? (
          <div className='flex flex-wrap items-center gap-2'>
            <MemberLine member={copy.current_loan.member} size='sm' />
            <LoanStateBadge state={copy.current_loan.state} />
          </div>
        ) : (
          <span className='text-muted-foreground'>—</span>
        ),
    },
    {
      key: 'due',
      header: 'Due',
      hideBelow: 'lg',
      cell: (copy) => (copy.current_loan ? formatDate(copy.current_loan.due_date) : '—'),
    },
    {
      key: 'source',
      header: 'Acquired',
      hideBelow: 'xl',
      cell: (copy) => (
        <div className='grid'>
          <span>{copy.acquired_on ? formatDate(copy.acquired_on) : '—'}</span>
          <span className='text-xs text-muted-foreground'>
            {[
              COPY_SOURCE[copy.source],
              copy.vendor,
              copy.price !== null ? rupees(copy.price) : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      className: 'w-32',
      cell: copyActions,
    },
  ]

  return (
    <Page>
      <Link
        to='/library'
        search={{ tab: 'catalogue' }}
        className='inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground'
      >
        <ArrowLeft className='size-4' />
        Catalogue
      </Link>

      <Card className='grid gap-4 p-4 sm:p-5'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div className='flex min-w-0 gap-4'>
            {data.cover_url ? (
              <img
                src={data.cover_url}
                alt=''
                className='hidden h-28 w-20 shrink-0 rounded-md border object-cover sm:block'
              />
            ) : (
              <span className='hidden h-28 w-20 shrink-0 place-items-center rounded-md border bg-muted text-muted-foreground sm:grid'>
                <BookCopy className='size-6' />
              </span>
            )}
            <div className='grid min-w-0 content-start gap-1'>
              <div className='flex flex-wrap items-center gap-2'>
                <h1 className='text-2xl font-extrabold tracking-tight'>{data.title}</h1>
                {data.is_reference && <Badge tone='info'>Reference</Badge>}
                {!data.is_active && <Badge>Hidden</Badge>}
              </div>
              {data.subtitle && <p className='text-sm text-muted-foreground'>{data.subtitle}</p>}
              <p className='text-sm'>{data.authors ?? 'Unknown author'}</p>
            </div>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              variant='outline'
              onClick={() => openLabels({ book_id: data.id })}
              disabled={!data.copies.total}
            >
              <Printer />
              Print labels
            </Button>
            {canManage && (
              <>
                <Button variant='outline' onClick={() => setEditing(true)}>
                  <Pencil />
                  Edit
                </Button>
                <Button onClick={() => setAdding(true)}>
                  <CopyPlus />
                  Add copies
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  aria-label='Delete book'
                  className='text-destructive hover:bg-destructive/10'
                  onClick={() => setDeleting(true)}
                >
                  <Trash2 />
                </Button>
              </>
            )}
          </div>
        </div>
        <dl className='grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7'>
          <Stat label='Copies' value={data.copies.total} />
          <Stat label='Available' value={data.copies.available} tone='success' />
          <Stat label='Issued' value={data.copies.issued} />
          <Stat
            label='Lost'
            value={data.copies.lost}
            tone={data.copies.lost ? 'danger' : undefined}
          />
          <Stat
            label='Damaged'
            value={data.copies.damaged}
            tone={data.copies.damaged ? 'warning' : undefined}
          />
          <Stat label='In repair' value={data.copies.in_repair} />
          <Stat label='Withdrawn' value={data.copies.withdrawn} />
        </dl>
        <DetailList
          className='lg:grid-cols-4'
          items={[
            { label: 'ISBN', value: data.isbn ?? '—', mono: true },
            { label: 'Category', value: data.category?.name ?? '—' },
            { label: 'Subject', value: data.subject?.name ?? '—' },
            { label: 'Language', value: data.language },
            {
              label: 'Publisher',
              value: [data.publisher, data.edition].filter(Boolean).join(' · ') || '—',
            },
            { label: 'Year', value: data.published_year ?? '—' },
            { label: 'Pages', value: data.pages ?? '—' },
            { label: 'Shelf', value: [data.rack, data.shelf].filter(Boolean).join(' / ') || '—' },
            { label: 'Price', value: data.price !== null ? rupees(data.price) : '—' },
            { label: 'Keywords', value: data.keywords ?? '—' },
          ]}
        />
        {data.description && <p className='text-sm text-muted-foreground'>{data.description}</p>}
      </Card>

      <Section title='Copies' description={`${data.copies.total} in all`}>
        <DataTable
          rows={copies.data ?? []}
          columns={columns}
          rowKey={(copy) => copy.id}
          loading={copies.isFetching}
          error={copies.isError ? copies.error.message : null}
          onRetry={() => copies.refetch()}
          empty={{
            icon: BookCopy,
            title: 'No copies yet',
            description: 'Add copies when the books arrive.',
            action: canManage && (
              <Button onClick={() => setAdding(true)}>
                <CopyPlus />
                Add copies
              </Button>
            ),
          }}
          card={(copy) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                <span className='font-mono text-xs font-semibold'>{copy.accession_no}</span>
                <CopyStatusBadge status={copy.status} />
              </div>
              {copy.current_loan && (
                <span className='text-sm'>
                  {copy.current_loan.member.name} · due {formatDate(copy.current_loan.due_date)}
                </span>
              )}
              <div className='flex items-center justify-between gap-2'>
                <span className='text-xs text-muted-foreground'>
                  {COPY_CONDITION[copy.condition]}
                </span>
                {copyActions(copy)}
              </div>
            </div>
          )}
        />
      </Section>

      <Section
        title='Loan history'
        description={history.data ? `${history.data.total} loans` : undefined}
      >
        <LoanTable
          rows={history.data?.items ?? []}
          loading={history.isFetching}
          error={history.isError ? history.error.message : null}
          onRetry={() => history.refetch()}
          columns={['member', 'issued', 'due', 'state', 'returned']}
          emptyTitle='Never borrowed yet'
          pagination={{
            page: search.page ?? 1,
            limit: LIST_LIMIT,
            total: history.data?.total ?? 0,
            label: 'loans',
            onPageChange: (page) =>
              navigate({
                to: '/library/books/$bookId',
                params: { bookId },
                search: { page },
                replace: true,
              }),
          }}
        />
      </Section>

      <BookFormModal open={editing} onOpenChange={setEditing} book={data} />
      {adding && <AddCopiesModal book={data} onClose={() => setAdding(false)} />}
      {editCopy && <CopyEditModal copy={editCopy} onClose={() => setEditCopy(null)} />}
      {historyCopy && <CopyHistoryModal copy={historyCopy} onClose={() => setHistoryCopy(null)} />}
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`Delete ${data.title}?`}
        description='The title and all its copies leave the catalogue. A book with a copy out on loan cannot be deleted.'
        confirmText='Delete book'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          try {
            await remove.mutateAsync(undefined)
            alerts.success('Book deleted')
            void navigate({ to: '/library', search: { tab: 'catalogue' } })
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      />
    </Page>
  )
}
