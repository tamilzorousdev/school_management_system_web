import { useState } from 'react'
import { CheckCircle2, PackageCheck, Pencil, Save, Shirt, Truck } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { DetailList, ErrorState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { useHostelMutation } from '../api'
import {
  careApi,
  useLaundryBatch,
  type LaundryDetail,
  type LaundryItem,
  type LaundryItemInput,
} from '../api-care'
import { studentLine } from '../labels'
import { FormAlert, InfoNote, StudentCell } from './leave-form-parts'
import { LAUNDRY_STATUS, sameRows, type LaundryRow } from './laundry-helpers'
import { LaundryItemsEditor } from './laundry-items-editor'
import { LaundryReturnModal, LaundrySentModal } from './laundry-move-modals'

export function LaundryBatchSheet({ batchId, onClose }: { batchId?: number; onClose: () => void }) {
  const [shownId, setShownId] = useState(batchId)
  if (batchId && batchId !== shownId) setShownId(batchId)
  const batch = useLaundryBatch(shownId ?? 0)
  const data = batch.data

  return (
    <Sheet open={Boolean(batchId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{data ? data.batch_no : 'Laundry batch'}</SheetTitle>
          <SheetDescription>
            {data ? `${data.hostel_name} · collected ${formatDate(data.collected_on)}` : 'Loading'}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          {batch.isError && !data ? (
            <ErrorState message={batch.error.message} onRetry={() => batch.refetch()} />
          ) : !data ? (
            <div className='grid gap-3'>
              <Skeleton className='h-20' />
              <Skeleton className='h-40' />
            </div>
          ) : (
            <LaundryBody key={data.id} batch={data} />
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

type Move = 'sent' | 'returned' | 'close'

const rowsOf = (batch: LaundryDetail): LaundryRow[] =>
  batch.items.map((item) => ({
    admission_id: String(item.admission_id),
    name: item.student.name,
    hint: [studentLine(item.student), item.bed].filter(Boolean).join(' · '),
    items_given: item.items_given,
  }))

function LaundryBody({ batch }: { batch: LaundryDetail }) {
  const me = useMe().data
  const canEdit = can(me, 'hostel.laundry')
  const [move, setMove] = useState<Move | null>(null)
  const [editing, setEditing] = useState(false)
  const [rows, setRows] = useState<LaundryRow[]>(() => rowsOf(batch))
  const [editError, setEditError] = useState<string | undefined>()
  const saveItems = useHostelMutation((items: LaundryItemInput[]) =>
    careApi.laundryItems(batch.id, items)
  )
  const close = useHostelMutation(() => careApi.closeLaundry(batch.id))
  const status = LAUNDRY_STATUS[batch.status]
  const returned = batch.status === 'returned' || batch.status === 'closed'

  const startEdit = () => {
    setRows(rowsOf(batch))
    setEditError(undefined)
    setEditing(true)
  }

  const submitItems = async () => {
    if (!rows.length) {
      setEditError('Keep at least one resident in the batch')
      return
    }
    try {
      const saved = await saveItems.mutateAsync(
        rows.map((row) => ({
          admission_id: Number(row.admission_id),
          items_given: row.items_given,
        }))
      )
      alerts.success('Laundry items saved', {
        description: `${saved.items_given} clothes from ${saved.students} residents`,
      })
      setEditing(false)
    } catch (error) {
      setEditError(toApiError(error).message)
    }
  }

  const confirmClose = async () => {
    try {
      await close.mutateAsync(undefined)
      alerts.success('Laundry batch closed', { description: batch.batch_no })
      setMove(null)
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const columns: Column<LaundryItem>[] = [
    {
      key: 'student',
      header: 'Student',
      cell: (row) => <StudentCell student={row.student} extra={row.bed ?? undefined} />,
    },
    {
      key: 'given',
      header: 'Gave',
      align: 'right',
      cell: (row) => <span className='tabular'>{row.items_given}</span>,
    },
    {
      key: 'returned',
      header: 'Back',
      align: 'right',
      cell: (row) => <span className='tabular'>{row.items_returned ?? '—'}</span>,
    },
    {
      key: 'missing',
      header: 'Missing',
      cell: (row) => <MissingCell item={row} />,
    },
  ]

  return (
    <div className='grid gap-5'>
      <div className='flex flex-wrap items-center gap-2'>
        <Badge tone={status.tone} dot>
          {status.label}
        </Badge>
        {batch.items_missing > 0 && (
          <Badge tone='danger'>{batch.items_missing} clothes missing</Badge>
        )}
      </div>

      {canEdit && !editing && batch.status !== 'closed' && (
        <div className='flex flex-wrap gap-2'>
          {batch.status === 'collected' && (
            <>
              <Button size='sm' variant='outline' onClick={startEdit}>
                <Pencil />
                Edit items
              </Button>
              <Button size='sm' onClick={() => setMove('sent')}>
                <Truck />
                Mark sent
              </Button>
            </>
          )}
          {(batch.status === 'collected' || batch.status === 'sent') && (
            <Button
              size='sm'
              variant={batch.status === 'sent' ? 'default' : 'outline'}
              onClick={() => setMove('returned')}
            >
              <PackageCheck />
              Mark returned
            </Button>
          )}
          {batch.status === 'returned' && (
            <Button size='sm' onClick={() => setMove('close')}>
              <CheckCircle2 />
              Close batch
            </Button>
          )}
        </div>
      )}

      <dl className='grid grid-cols-3 gap-2'>
        {[
          { label: 'Residents', value: batch.students },
          { label: 'Clothes given', value: batch.items_given },
          { label: 'Returned', value: batch.items_returned ?? '—' },
        ].map((tile) => (
          <div key={tile.label} className='rounded-lg bg-muted/60 px-3 py-2'>
            <dt className='text-[11px] font-semibold text-muted-foreground'>{tile.label}</dt>
            <dd className='tabular text-lg font-extrabold'>{tile.value}</dd>
          </div>
        ))}
      </dl>

      <DetailList
        items={[
          { label: 'Collected', value: formatDate(batch.collected_on) },
          { label: 'Laundry', value: batch.vendor_name ?? '—' },
          { label: 'Sent', value: formatDate(batch.sent_on) },
          { label: 'Returned', value: formatDate(batch.returned_on) },
          { label: 'Created by', value: batch.created_by_name ?? '—' },
          ...(batch.notes ? [{ label: 'Notes', value: batch.notes }] : []),
        ]}
      />

      {editing ? (
        <div className='grid gap-3 rounded-lg border bg-muted/30 p-3'>
          <h3 className='text-sm font-bold'>Edit residents and counts</h3>
          <FormAlert message={editError} />
          <LaundryItemsEditor
            id='laundry-edit-resident'
            hostelId={batch.hostel_id}
            rows={rows}
            onChange={(next) => {
              setRows(next)
              setEditError(undefined)
            }}
          />
          <div className='flex flex-wrap justify-end gap-2'>
            <Button variant='ghost' size='sm' onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              size='sm'
              disabled={sameRows(rows, rowsOf(batch))}
              loading={saveItems.isPending}
              onClick={() => void submitItems()}
            >
              <Save />
              Save items
            </Button>
          </div>
        </div>
      ) : (
        <div className='grid gap-2'>
          <h3 className='text-sm font-bold'>Clothes by resident</h3>
          {!returned && (
            <InfoNote icon={Shirt}>
              Returned counts are filled in when the batch comes back.
            </InfoNote>
          )}
          <div className='overflow-hidden rounded-lg border'>
            <DataTable
              rows={batch.items}
              columns={columns}
              rowKey={(row) => row.id}
              empty={{ icon: Shirt, title: 'No residents in this batch' }}
              card={(row) => (
                <div className='grid gap-2'>
                  <StudentCell student={row.student} extra={row.bed ?? undefined} />
                  <div className='flex flex-wrap items-center gap-2 text-sm'>
                    <span className='tabular'>
                      Gave {row.items_given} · back {row.items_returned ?? '—'}
                    </span>
                    <MissingCell item={row} />
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      )}

      {move === 'sent' && <LaundrySentModal batch={batch} onClose={() => setMove(null)} />}
      {move === 'returned' && <LaundryReturnModal batch={batch} onClose={() => setMove(null)} />}
      <ConfirmDialog
        open={move === 'close'}
        onOpenChange={(open) => !open && setMove(null)}
        title='Close this batch?'
        description={`Close ${batch.batch_no} once the clothes are handed back to the residents.`}
        confirmText='Close batch'
        loading={close.isPending}
        onConfirm={() => void confirmClose()}
      />
    </div>
  )
}

function MissingCell({ item }: { item: LaundryItem }) {
  if (item.items_returned === null) return <span className='text-xs text-muted-foreground'>—</span>
  if (!item.missing) return <Badge tone='success'>All back</Badge>
  return (
    <div className='grid gap-0.5'>
      <Badge tone='danger' className='justify-self-start'>
        {item.missing} missing
      </Badge>
      {item.missing_note && (
        <span className='text-xs text-muted-foreground'>{item.missing_note}</span>
      )}
    </div>
  )
}
