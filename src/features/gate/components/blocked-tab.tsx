import { useState } from 'react'
import { Pencil, Plus, Power, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { ListToolbar } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatDate } from '@/lib/format'
import { gateApi, useBlocklist, useGateMutation, type Block } from '../api'
import { runAction } from '../helpers'
import type { GateTabProps } from '../search'
import { BlockFormModal } from './block-form-modal'

type Confirm = { block: Block; action: 'toggle' | 'remove' }

export function BlockedTab({ canManage, adding, onAddingChange }: GateTabProps) {
  const blocklist = useBlocklist()
  const [editing, setEditing] = useState<Block | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  if (adding && !editOpen && editing) setEditing(null)
  const act = useGateMutation(({ block, action }: Confirm) =>
    action === 'remove'
      ? gateApi.removeBlock(block.id)
      : gateApi.updateBlock(block.id, { is_active: !block.is_active })
  )
  const rows = blocklist.data ?? []
  const active = rows.filter((block) => block.is_active).length

  const openEdit = (block: Block) => {
    setEditing(block)
    setEditOpen(true)
  }

  const actions = (block: Block) =>
    canManage && (
      <div className='inline-flex gap-1'>
        <Button
          variant='ghost'
          size='icon-sm'
          title='Edit'
          aria-label={`Edit ${block.name}`}
          onClick={(event) => {
            event.stopPropagation()
            openEdit(block)
          }}
        >
          <Pencil />
        </Button>
        <Button
          variant='ghost'
          size='icon-sm'
          title={block.is_active ? 'Switch off' : 'Switch on'}
          aria-label={`${block.is_active ? 'Switch off' : 'Switch on'} ${block.name}`}
          onClick={(event) => {
            event.stopPropagation()
            setConfirm({ block, action: 'toggle' })
          }}
        >
          <Power />
        </Button>
        <Button
          variant='ghost'
          size='icon-sm'
          title='Remove'
          aria-label={`Remove ${block.name}`}
          className='text-destructive hover:bg-destructive/10'
          onClick={(event) => {
            event.stopPropagation()
            setConfirm({ block, action: 'remove' })
          }}
        >
          <Trash2 />
        </Button>
      </div>
    )

  const columns: Column<Block>[] = [
    {
      key: 'name',
      header: 'Person',
      cell: (block) => (
        <div className='grid min-w-0'>
          <span className='font-semibold'>{block.name}</span>
          <span className='text-xs text-muted-foreground'>{block.mobile ?? 'No mobile'}</span>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      cell: (block) => <span className='text-sm break-words'>{block.reason}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (block) =>
        block.is_active ? (
          <Badge tone='danger' dot>
            Blocked
          </Badge>
        ) : (
          <Badge tone='neutral'>Switched off</Badge>
        ),
    },
    {
      key: 'added',
      header: 'Added',
      hideBelow: 'lg',
      cell: (block) => (
        <div className='grid'>
          <span className='tabular text-sm'>{formatDate(block.created_at)}</span>
          <span className='text-xs text-muted-foreground'>{block.added_by?.name ?? '—'}</span>
        </div>
      ),
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
      <p className='flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive'>
        <ShieldAlert className='mt-0.5 size-4 shrink-0' />
        When a blocked name or mobile comes to the gate, as a visitor or to pick up a student, the
        guard sees a red warning and the office is alerted at once.
      </p>
      <Card className='overflow-hidden'>
        <ListToolbar
          summary={blocklist.data ? `${active} blocked · ${rows.length - active} switched off` : ''}
        >
          {canManage && (
            <Button variant='outline' onClick={() => onAddingChange(true)}>
              <Plus />
              Block a person
            </Button>
          )}
        </ListToolbar>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(block) => block.id}
          loading={blocklist.isFetching}
          error={blocklist.isError ? blocklist.error.message : null}
          onRetry={() => blocklist.refetch()}
          onRowClick={canManage ? openEdit : undefined}
          empty={{
            icon: ShieldCheck,
            title: 'Nobody is blocked',
            description:
              'Add a person who must not enter or take a student, for example because of a court order.',
            action: canManage && (
              <Button onClick={() => onAddingChange(true)}>
                <Plus />
                Block a person
              </Button>
            ),
          }}
          card={(block) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                <div className='grid min-w-0'>
                  <span className='font-semibold'>{block.name}</span>
                  <span className='text-xs text-muted-foreground'>
                    {block.mobile ?? 'No mobile'}
                  </span>
                </div>
                {block.is_active ? (
                  <Badge tone='danger' dot>
                    Blocked
                  </Badge>
                ) : (
                  <Badge tone='neutral'>Switched off</Badge>
                )}
              </div>
              <span className='text-sm break-words'>{block.reason}</span>
              <span className='flex items-center justify-between gap-2'>
                <span className='text-xs text-muted-foreground'>
                  {formatDate(block.created_at)} · {block.added_by?.name ?? '—'}
                </span>
                {actions(block)}
              </span>
            </div>
          )}
        />
      </Card>
      <BlockFormModal
        open={adding || editOpen}
        onOpenChange={(open) => {
          if (open) return
          onAddingChange(false)
          setEditOpen(false)
        }}
        block={editing}
      />
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={
          confirm?.action === 'remove'
            ? `Remove ${confirm.block.name} from the blocked list?`
            : confirm?.block.is_active
              ? `Switch off the block on ${confirm.block.name}?`
              : `Block ${confirm?.block.name ?? ''} again?`
        }
        description={
          confirm?.action === 'remove' || confirm?.block.is_active
            ? 'The gate will no longer warn when this person comes.'
            : 'The gate and the office are warned again when this person comes.'
        }
        confirmText={
          confirm?.action === 'remove'
            ? 'Remove'
            : confirm?.block.is_active
              ? 'Switch off'
              : 'Block again'
        }
        destructive={confirm?.action === 'remove'}
        loading={act.isPending}
        onConfirm={async () => {
          if (!confirm) return
          const done = await runAction(
            () => act.mutateAsync(confirm),
            confirm.action === 'remove' ? 'Removed from the blocked list' : 'Blocked list updated'
          )
          if (done) setConfirm(null)
        }}
      />
    </>
  )
}
