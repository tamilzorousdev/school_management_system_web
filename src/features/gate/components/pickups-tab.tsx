import { useState } from 'react'
import { Pencil, Plus, Power, Trash2, UserCheck, UserSearch } from 'lucide-react'
import { Avatar } from '@/components/common/avatar'
import { Combobox, type ComboboxOption } from '@/components/common/combobox'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/display'
import { ListToolbar } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { today } from '@/features/attendance/labels'
import { useStudent } from '@/features/students/api'
import { useDebouncedValue } from '@/hooks/use-debounce'
import { formatDate } from '@/lib/format'
import {
  gateApi,
  useGateMutation,
  useGateStudents,
  usePickups,
  type AuthorisedPickup,
} from '../api'
import { runAction } from '../helpers'
import type { GateTabProps } from '../search'
import { PersonCell } from './shared'
import { PickupFormModal } from './pickup-form-modal'

type Confirm = { pickup: AuthorisedPickup; action: 'toggle' | 'remove' }

function ValidBadge({ pickup }: { pickup: AuthorisedPickup }) {
  if (!pickup.is_active) return <Badge tone='neutral'>Switched off</Badge>
  if (pickup.valid_until && pickup.valid_until < today())
    return <Badge tone='danger'>Ended {formatDate(pickup.valid_until)}</Badge>
  return (
    <Badge tone='success' dot>
      {pickup.valid_until ? `Until ${formatDate(pickup.valid_until)}` : 'No end date'}
    </Badge>
  )
}

export function PickupsTab({ search, setSearch, canManage, adding, onAddingChange }: GateTabProps) {
  const studentId = search.student_id
  const [query, setQuery] = useState('')
  const debounced = useDebouncedValue(query)
  const students = useGateStudents(debounced)
  const student = useStudent(studentId ?? null)
  const pickups = usePickups(studentId)
  const [editing, setEditing] = useState<AuthorisedPickup | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  if (adding && !editOpen && editing) setEditing(null)
  const act = useGateMutation(({ pickup, action }: Confirm) =>
    action === 'remove'
      ? gateApi.removePickup(pickup.id)
      : gateApi.updatePickup(pickup.id, { is_active: !pickup.is_active })
  )

  const studentName = student.data?.full_name ?? 'this student'
  const loaded: ComboboxOption[] = (students.data ?? []).map((item) => ({
    value: String(item.student.id),
    label: item.student.name,
    hint: [item.student.class_section, item.student.admission_no].filter(Boolean).join(' · '),
  }))
  const options =
    studentId && student.data && !loaded.some((option) => option.value === String(studentId))
      ? [{ value: String(studentId), label: student.data.full_name }, ...loaded]
      : loaded
  const rows = pickups.data ?? []

  const openEdit = (pickup: AuthorisedPickup) => {
    setEditing(pickup)
    setEditOpen(true)
  }

  const actions = (pickup: AuthorisedPickup) =>
    canManage && (
      <div className='inline-flex gap-1'>
        <Button
          variant='ghost'
          size='icon-sm'
          title='Edit'
          aria-label={`Edit ${pickup.name}`}
          onClick={(event) => {
            event.stopPropagation()
            openEdit(pickup)
          }}
        >
          <Pencil />
        </Button>
        <Button
          variant='ghost'
          size='icon-sm'
          title={pickup.is_active ? 'Switch off' : 'Switch on'}
          aria-label={`${pickup.is_active ? 'Switch off' : 'Switch on'} ${pickup.name}`}
          onClick={(event) => {
            event.stopPropagation()
            setConfirm({ pickup, action: 'toggle' })
          }}
        >
          <Power />
        </Button>
        <Button
          variant='ghost'
          size='icon-sm'
          title='Remove'
          aria-label={`Remove ${pickup.name}`}
          className='text-destructive hover:bg-destructive/10'
          onClick={(event) => {
            event.stopPropagation()
            setConfirm({ pickup, action: 'remove' })
          }}
        >
          <Trash2 />
        </Button>
      </div>
    )

  const columns: Column<AuthorisedPickup>[] = [
    { key: 'person', header: 'Person', cell: (pickup) => <PersonCell person={pickup} /> },
    { key: 'valid', header: 'Can pick up', cell: (pickup) => <ValidBadge pickup={pickup} /> },
    {
      key: 'added_by',
      header: 'Added by',
      hideBelow: 'lg',
      cell: (pickup) => <span className='text-sm'>{pickup.added_by?.name ?? '—'}</span>,
    },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      className: 'w-32',
      cell: actions,
    },
  ]

  return (
    <>
      <Card className='overflow-hidden'>
        <ListToolbar
          summary={
            studentId && pickups.data
              ? `${rows.length} of 6 ${rows.length === 1 ? 'person' : 'people'}`
              : ''
          }
        >
          <Combobox
            id='pickup-student'
            label='Student'
            value={studentId ? String(studentId) : undefined}
            options={options}
            onSearch={setQuery}
            placeholder='Choose a student'
            searchPlaceholder='Search name, admission number or class'
            emptyText={
              debounced.trim().length < 2
                ? 'Type 2 or more letters'
                : students.isFetching
                  ? 'Searching…'
                  : 'No students found'
            }
            highlightSelected={false}
            className='w-full sm:w-80'
            onChange={(value) => setSearch({ student_id: value ? Number(value) : undefined })}
          />
          {studentId && canManage && (
            <Button variant='outline' onClick={() => onAddingChange(true)}>
              <Plus />
              Add pickup person
            </Button>
          )}
        </ListToolbar>
        {studentId ? (
          <>
            {student.data && (
              <div className='flex items-center gap-3 border-b px-4 py-3'>
                <Avatar name={student.data.full_name} src={student.data.photo_url} />
                <span className='grid min-w-0'>
                  <span className='truncate font-semibold'>{student.data.full_name}</span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {[
                      student.data.class && student.data.section
                        ? `${student.data.class.name} - ${student.data.section.name}`
                        : null,
                      student.data.admission_no,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
              </div>
            )}
            <DataTable
              rows={rows}
              columns={columns}
              rowKey={(pickup) => pickup.id}
              loading={pickups.isFetching}
              error={pickups.isError ? pickups.error.message : null}
              onRetry={() => pickups.refetch()}
              onRowClick={canManage ? openEdit : undefined}
              empty={{
                icon: UserCheck,
                title: 'No pickup persons saved',
                description:
                  'Parents registered in the app can always pick up. Save grandparents, drivers or others here with a photo for the gate.',
                action: canManage && (
                  <Button onClick={() => onAddingChange(true)}>
                    <Plus />
                    Add pickup person
                  </Button>
                ),
              }}
              card={(pickup) => (
                <div className='grid gap-2'>
                  <PersonCell person={pickup} />
                  <span className='flex flex-wrap items-center justify-between gap-2'>
                    <ValidBadge pickup={pickup} />
                    {actions(pickup)}
                  </span>
                </div>
              )}
            />
          </>
        ) : (
          <EmptyState
            icon={UserSearch}
            title='Choose a student'
            description='Search by name, admission number or class to see and change who may pick the student up.'
          />
        )}
      </Card>
      <PickupFormModal
        open={adding || editOpen}
        onOpenChange={(open) => {
          if (open) return
          onAddingChange(false)
          setEditOpen(false)
        }}
        studentId={studentId}
        studentName={studentName}
        pickup={editing}
      />
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={
          confirm?.action === 'remove'
            ? `Remove ${confirm.pickup.name}?`
            : confirm?.pickup.is_active
              ? `Switch off ${confirm.pickup.name}?`
              : `Switch on ${confirm?.pickup.name ?? ''}?`
        }
        description={
          confirm?.action === 'remove'
            ? 'They can no longer be chosen for a gate pass. Past passes keep their name.'
            : confirm?.pickup.is_active
              ? 'They stay on the list but cannot be chosen for a gate pass until switched on.'
              : 'They can be chosen for a gate pass again.'
        }
        confirmText={
          confirm?.action === 'remove'
            ? 'Remove'
            : confirm?.pickup.is_active
              ? 'Switch off'
              : 'Switch on'
        }
        destructive={confirm?.action === 'remove'}
        loading={act.isPending}
        onConfirm={async () => {
          if (!confirm) return
          const done = await runAction(
            () => act.mutateAsync(confirm),
            confirm.action === 'remove'
              ? 'Pickup person removed'
              : confirm.pickup.is_active
                ? 'Pickup person switched off'
                : 'Pickup person switched on'
          )
          if (done) setConfirm(null)
        }}
      />
    </>
  )
}
