import { useState } from 'react'
import { BookCopy, CalendarRange, CircleOff, History, Pencil, Printer } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TableCheckbox } from '@/features/attendance/components/students-tab'
import { can, useMe } from '@/features/auth/api'
import { formatDate } from '@/lib/format'
import { COPY_CONDITIONS, COPY_STATUSES, useCategories, useCopies, type Copy } from '../api'
import { COPY_CONDITION, COPY_STATUS, openLabels, optionsOf } from '../labels'
import { LIST_LIMIT, oneOf, type LibraryTabProps } from '../search'
import { CopyEditModal, CopyHistoryModal, LabelsByDateModal } from './copy-modals'
import { BookLine, CopyStatusBadge, LoanStateBadge, MemberLine } from './library-parts'

export function InventoryTab({ search, onChange }: LibraryTabProps) {
  const canManage = can(useMe().data, 'library.manage')
  const status = oneOf(COPY_STATUSES, search.status)
  const condition = oneOf(COPY_CONDITIONS, search.condition)
  const copies = useCopies({
    page: search.page ?? 1,
    limit: LIST_LIMIT,
    search: search.search,
    sort: search.sort,
    order: search.order,
    status,
    condition,
    category_id: search.category_id,
  })
  const categories = useCategories()
  const [selected, setSelected] = useState<number[]>([])
  const [editing, setEditing] = useState<Copy | null>(null)
  const [viewing, setViewing] = useState<Copy | null>(null)
  const [byDate, setByDate] = useState(false)
  const rows = copies.data?.items ?? []
  const allOnPage = rows.length > 0 && rows.every((copy) => selected.includes(copy.id))
  const isIndeterminate = !allOnPage && rows.some((copy) => selected.includes(copy.id))

  const toggle = (id: number) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    )

  const actions = (copy: Copy) => (
    <div className='inline-flex gap-1'>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label={`History of ${copy.accession_no}`}
        onClick={() => setViewing(copy)}
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
          onClick={() => setEditing(copy)}
        >
          <Pencil />
        </Button>
      )}
    </div>
  )

  const checkbox = (copy: Copy) => (
    <TableCheckbox
      ariaLabel={`Select ${copy.accession_no}`}
      checked={selected.includes(copy.id)}
      onChange={() => toggle(copy.id)}
    />
  )

  const columns: Column<Copy>[] = [
    {
      key: 'select',
      header: (
        <TableCheckbox
          ariaLabel='Select every copy on this page'
          checked={allOnPage}
          indeterminate={isIndeterminate}
          onChange={() =>
            setSelected((current) =>
              allOnPage
                ? current.filter((id) => !rows.some((copy) => copy.id === id))
                : [...new Set([...current, ...rows.map((copy) => copy.id)])]
            )
          }
        />
      ),
      className: 'w-12 text-center',
      cell: checkbox,
    },
    {
      key: 'accession_no',
      header: 'ACCESSION',
      sortKey: 'accession_no',
      cell: (copy) => (
        <div className='grid'>
          <span className='font-mono text-xs font-semibold text-slate-900 dark:text-slate-100'>
            {copy.accession_no}
          </span>
          {copy.barcode !== copy.accession_no && (
            <span className='font-mono text-[11px] text-slate-400 dark:text-slate-500'>
              {copy.barcode}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'title',
      header: 'BOOK',
      sortKey: 'title',
      cell: (copy) => (
        <BookLine
          bookId={copy.book_id}
          title={copy.book.title}
          sub={[copy.book.category?.name, copy.location].filter(Boolean).join(' · ')}
        />
      ),
    },
    { key: 'status', header: 'STATUS', cell: (copy) => <CopyStatusBadge status={copy.status} /> },
    {
      key: 'condition',
      header: 'CONDITION',
      hideBelow: 'lg',
      cell: (copy) => COPY_CONDITION[copy.condition],
    },
    {
      key: 'loan',
      header: 'WITH',
      hideBelow: 'lg',
      cell: (copy) =>
        copy.current_loan ? (
          <div className='flex items-center gap-2'>
            <MemberLine member={copy.current_loan.member} size='sm' />
            <LoanStateBadge state={copy.current_loan.state} />
          </div>
        ) : (
          <span className='text-slate-400'>—</span>
        ),
    },
    {
      key: 'created_at',
      header: 'ADDED',
      sortKey: 'created_at',
      hideBelow: 'xl',
      cell: (copy) => formatDate(copy.acquired_on ?? copy.created_at),
    },
    {
      key: 'actions',
      header: 'ACTION',
      align: 'right',
      className: 'w-32',
      cell: actions,
    },
  ]

  const filtered = Boolean(search.search || status || condition || search.category_id)

  return (
    <div className='grid gap-4'>
      <Card className='overflow-hidden'>
        <ListToolbar
          summary={copies.data ? `${copies.data.total} copies` : ''}
          onClear={
            filtered
              ? () =>
                  onChange({
                    search: undefined,
                    status: undefined,
                    condition: undefined,
                    category_id: undefined,
                  })
              : undefined
          }
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => onChange({ search: value || undefined })}
            placeholder='Accession, barcode or title'
            label='Search copies'
          />
          <FilterSelect
            id='copy-status-filter'
            label='Filter by status'
            allLabel='All statuses'
            value={status}
            options={optionsOf(COPY_STATUS)}
            onChange={(value) => onChange({ status: value })}
          />
          <FilterSelect
            id='copy-condition-filter'
            label='Filter by condition'
            allLabel='Any condition'
            value={condition}
            options={optionsOf(COPY_CONDITION)}
            onChange={(value) => onChange({ condition: value })}
          />
          <FilterSelect
            id='copy-category-filter'
            label='Filter by category'
            allLabel='All categories'
            value={search.category_id ? String(search.category_id) : undefined}
            options={(categories.data ?? []).map((item) => ({
              value: String(item.id),
              label: item.name,
            }))}
            onChange={(value) => onChange({ category_id: value ? Number(value) : undefined })}
          />
          <div className='flex flex-wrap gap-2 sm:ml-auto'>
            {selected.length > 0 && (
              <>
                <Button size='sm' onClick={() => openLabels({ copy_ids: selected.join(',') })}>
                  <Printer />
                  Print {selected.length} {selected.length === 1 ? 'label' : 'labels'}
                </Button>
                <Button variant='ghost' size='sm' onClick={() => setSelected([])}>
                  Clear selection
                </Button>
              </>
            )}
            <Button variant='outline' size='sm' onClick={() => setByDate(true)}>
              <CalendarRange />
              Labels by date
            </Button>
          </div>
        </ListToolbar>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(copy) => copy.id}
          loading={copies.isFetching}
          error={copies.isError ? copies.error.message : null}
          onRetry={() => copies.refetch()}
          sort={{ sort: search.sort, order: search.order ?? 'desc' }}
          onSortChange={(next) => onChange(next)}
          empty={{
            icon: filtered ? CircleOff : BookCopy,
            title: filtered ? 'No copies match these filters' : 'No copies yet',
            description: filtered
              ? 'Try another barcode, or clear the filters.'
              : 'Copies appear here when books are added in the catalogue.',
          }}
          card={(copy) => (
            <div className='flex items-start gap-3'>
              {checkbox(copy)}
              <div className='grid min-w-0 flex-1 gap-1'>
                <div className='flex items-start justify-between gap-2'>
                  <BookLine bookId={copy.book_id} title={copy.book.title} sub={copy.accession_no} />
                  <CopyStatusBadge status={copy.status} />
                </div>
                {copy.current_loan && <MemberLine member={copy.current_loan.member} size='sm' />}
                <div className='flex items-center justify-between gap-2'>
                  <span className='text-xs text-muted-foreground'>
                    {COPY_CONDITION[copy.condition]}
                    {copy.location ? ` · ${copy.location}` : ''}
                  </span>
                  {actions(copy)}
                </div>
              </div>
            </div>
          )}
          pagination={{
            page: search.page ?? 1,
            limit: LIST_LIMIT,
            total: copies.data?.total ?? 0,
            label: 'copies',
            onPageChange: (page) => onChange({ page }),
          }}
        />
      </Card>
      {editing && <CopyEditModal copy={editing} onClose={() => setEditing(null)} />}
      {viewing && <CopyHistoryModal copy={viewing} onClose={() => setViewing(null)} />}
      {byDate && <LabelsByDateModal onClose={() => setByDate(false)} />}
    </div>
  )
}
