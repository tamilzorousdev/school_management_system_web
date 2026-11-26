import { useState } from 'react'
import { Building2, PenLine, Plus, UserRound, UsersRound } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState, ErrorState } from '@/components/common/display'
import { TrashIcon } from '@/components/common/icon'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import { officeApi, useOfficeMutation, useWingSetup, type SetupAo, type WingSetup } from '../api'
import { AoWingsModal } from '../components/ao-wings-modal'
import { WingFormModal } from '../components/wing-form-modal'
import { BOARD_LABEL, className } from '../labels'

const coverText = (from: string | null, to: string | null) =>
  !from && !to ? null : `${from ? formatDate(from) : 'now'} – ${to ? formatDate(to) : 'no end'}`

export function OfficeWingsPage() {
  const me = useMe().data
  const canEdit = can(me, 'office.wings')
  const setup = useWingSetup()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<WingSetup | null>(null)
  const [deleting, setDeleting] = useState<WingSetup | null>(null)
  const [aoOpen, setAoOpen] = useState(false)
  const [ao, setAo] = useState<SetupAo | null>(null)
  const remove = useOfficeMutation((id: number) => officeApi.removeWing(id))

  useShortcut('app.refresh', () => void setup.refetch())

  const wings = setup.data?.wings ?? []
  const aos = setup.data?.aos ?? []
  const classes = setup.data?.classes ?? []
  const unassigned = classes.filter((item) => item.wing_id === null)

  const openWing = (wing: WingSetup | null) => {
    if (!canEdit) return
    setEditing(wing)
    setFormOpen(true)
  }
  const openAo = (row: SetupAo) => {
    if (!canEdit) return
    setAo(row)
    setAoOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await remove.mutateAsync(deleting.id)
      alerts.success('Wing removed')
      setDeleting(null)
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const wingColumns: Column<WingSetup>[] = [
    {
      key: 'name',
      header: 'WING',
      cell: (wing) => (
        <div className='grid min-w-0'>
          <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
            {wing.name}
          </span>
          <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            {wing.range_label}
          </span>
        </div>
      ),
    },
    {
      key: 'board',
      header: 'BOARD',
      cell: (wing) =>
        wing.board ? (
          <Badge tone='info'>{BOARD_LABEL[wing.board]}</Badge>
        ) : (
          <span className='text-[12px] text-slate-400'>Any</span>
        ),
    },
    {
      key: 'classes',
      header: 'CLASSES',
      cell: (wing) => (
        <span className='text-[13px] leading-[18px] text-slate-700 dark:text-slate-300 font-medium'>
          {wing.classes.length ? wing.classes.map((item) => className(item.name)).join(', ') : '—'}
        </span>
      ),
    },
    {
      key: 'aos',
      header: 'AOS',
      cell: (wing) => <WingAos wing={wing} />,
    },
    {
      key: 'order',
      header: 'ORDER',
      hideBelow: 'lg',
      cell: (wing) => (
        <span className='tabular text-[13px] leading-[18px] font-semibold text-slate-700 dark:text-slate-300'>
          {wing.sort_order}
        </span>
      ),
    },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      className: 'w-24',
      cell: (wing) =>
        canEdit && <WingActions wing={wing} onEdit={openWing} onDelete={setDeleting} />,
    },
  ]

  const aoColumns: Column<SetupAo>[] = [
    {
      key: 'name',
      header: 'AO',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
            {row.name}
          </span>
          <span className='tabular text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            +91 {row.mobile}
          </span>
        </div>
      ),
    },
    { key: 'wings', header: 'WINGS', cell: (row) => <AoWingList ao={row} /> },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      className: 'w-32',
      cell: (row) =>
        canEdit && (
          <Button
            variant='secondary'
            size='sm'
            className='h-8 px-3 gap-1.5 border border-[#C6CEC9] bg-white text-[#171B19] hover:bg-[#F9FAFB] font-medium'
            onClick={(event) => {
              event.stopPropagation()
              openAo(row)
            }}
          >
            <PenLine className='size-3.5 stroke-[1.75] text-[#3C4440]' />
            Edit wings
          </Button>
        ),
    },
  ]

  return (
    <Page>
      <PageHeader
        eyebrow='Office'
        title='Wings & AOs'
        description='Split the school into wings and give each wing its AO. An AO with no wing is the head AO and sees the whole school.'
        actions={
          canEdit && (
            <Button
              size='sm'
              className='h-8 px-3 gap-1.5 font-medium'
              onClick={() => openWing(null)}
            >
              <Plus className='size-3.5 stroke-[1.75]' />
              Add wing
            </Button>
          )
        }
      />

      {setup.isError && !setup.data ? (
        <Card>
          <ErrorState message={setup.error.message} onRetry={() => setup.refetch()} />
        </Card>
      ) : (
        <>
          {unassigned.length > 0 && (
            <div className='flex flex-wrap items-center gap-1.5 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-[12.5px]'>
              <span className='font-semibold text-warning'>Classes in no wing:</span>
              {unassigned.map((item) => (
                <Badge key={item.id} tone='warning'>
                  {className(item.name)}
                </Badge>
              ))}
            </div>
          )}
          <Card className='overflow-hidden'>
            <CardHeader className='pb-4'>
              <div className='grid gap-0.5'>
                <CardTitle className='text-[15px] font-bold text-slate-900 dark:text-slate-100'>Wings</CardTitle>
                <CardDescription className='text-[12.5px] text-slate-500 dark:text-slate-400'>
                  {canEdit
                    ? 'Click a wing to edit it.'
                    : 'Only admin and principal can change wings.'}
                </CardDescription>
              </div>
            </CardHeader>
            <DataTable
              rows={wings}
              columns={wingColumns}
              rowKey={(wing) => wing.id}
              loading={setup.isFetching}
              onRowClick={canEdit ? openWing : undefined}
              empty={{
                icon: Building2,
                title: 'No wings yet',
                description: 'Add Pre-primary, Primary, Secondary and Higher Secondary.',
                action: canEdit && (
                  <Button
                    size='sm'
                    className='h-8 px-3 gap-1.5 font-medium'
                    onClick={() => openWing(null)}
                  >
                    <Plus className='size-3.5 stroke-[1.75]' />
                    Add wing
                  </Button>
                ),
              }}
              card={(wing) => (
                <div className='grid gap-2'>
                  <div className='flex items-start gap-2'>
                    <div className='grid min-w-0 flex-1'>
                      <span className='truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100'>{wing.name}</span>
                      <span className='truncate text-[12px] text-slate-500 dark:text-slate-400'>
                        {wing.range_label}
                        {wing.board && ` · ${BOARD_LABEL[wing.board]}`}
                      </span>
                    </div>
                    {canEdit && (
                      <WingActions wing={wing} onEdit={openWing} onDelete={setDeleting} />
                    )}
                  </div>
                  <WingAos wing={wing} />
                </div>
              )}
            />
          </Card>
          <Card className='overflow-hidden'>
            <CardHeader className='pb-4'>
              <div className='grid gap-0.5'>
                <CardTitle className='text-[15px] font-bold text-slate-900 dark:text-slate-100'>AOs</CardTitle>
                <CardDescription className='text-[12.5px] text-slate-500 dark:text-slate-400'>
                  Everyone with the AO role. Give each one their wings, or none for the head AO.
                </CardDescription>
              </div>
            </CardHeader>
            <DataTable
              rows={aos}
              columns={aoColumns}
              rowKey={(row) => row.id}
              loading={setup.isFetching}
              onRowClick={canEdit ? openAo : undefined}
              empty={{
                icon: UsersRound,
                title: 'No AOs yet',
                description: 'Give a user the AO role under Users & access first.',
              }}
              card={(row) => (
                <div className='grid gap-2'>
                  <div className='grid min-w-0'>
                    <span className='truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100'>{row.name}</span>
                    <span className='tabular text-[12px] text-slate-500 dark:text-slate-400'>+91 {row.mobile}</span>
                  </div>
                  <AoWingList ao={row} />
                </div>
              )}
            />
          </Card>
        </>
      )}

      <WingFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        wing={editing}
        classes={classes}
        nextOrder={wings.reduce((max, wing) => Math.max(max, wing.sort_order), 0) + 1}
      />
      <AoWingsModal open={aoOpen} onOpenChange={setAoOpen} ao={ao} wings={wings} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Remove ${deleting?.name ?? 'wing'}?`}
        description='Its classes go back to no wing and its AOs lose this wing. Students and records stay.'
        confirmText='Remove wing'
        destructive
        loading={remove.isPending}
        onConfirm={confirmDelete}
      />
    </Page>
  )
}

function WingActions({
  wing,
  onEdit,
  onDelete,
}: {
  wing: WingSetup
  onEdit: (wing: WingSetup) => void
  onDelete: (wing: WingSetup) => void
}) {
  return (
    <div className='inline-flex gap-1.5'>
      <Button
        variant='outline'
        size='icon-sm'
        title={`Edit ${wing.name}`}
        aria-label={`Edit ${wing.name}`}
        className='size-8 border border-[#EDF0EE] bg-white text-[#3C4440] hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
        onClick={(event) => {
          event.stopPropagation()
          onEdit(wing)
        }}
      >
        <PenLine className='size-4 stroke-[1.75]' />
      </Button>
      <Button
        variant='outline'
        size='icon-sm'
        title={`Remove ${wing.name}`}
        aria-label={`Remove ${wing.name}`}
        className='size-8 border border-[#FDA29B] text-[#D92D20] bg-white hover:bg-rose-50 dark:border-rose-900 dark:bg-card dark:text-rose-400 dark:hover:bg-rose-950/50'
        onClick={(event) => {
          event.stopPropagation()
          onDelete(wing)
        }}
      >
        <TrashIcon className='size-4 stroke-[1.75]' />
      </Button>
    </div>
  )
}

function WingAos({ wing }: { wing: WingSetup }) {
  if (!wing.aos.length)
    return <span className='text-[12px] text-slate-400'>No AO · head AO covers it</span>
  return (
    <span className='flex flex-wrap gap-1'>
      {wing.aos.map((ao) => {
        const cover = coverText(ao.valid_from, ao.valid_to)
        return (
          <Badge
            key={`${ao.id}-${ao.valid_from}`}
            tone={cover ? 'warning' : 'neutral'}
            className='whitespace-normal'
          >
            <UserRound className='size-3 stroke-[1.75]' />
            {ao.name}
            {cover && ` · ${cover}`}
          </Badge>
        )
      })}
    </span>
  )
}

function AoWingList({ ao }: { ao: SetupAo }) {
  if (ao.is_head)
    return (
      <span className='flex flex-wrap items-center gap-1'>
        <Badge tone='success'>Head AO · whole school</Badge>
        {ao.wings.map((link) => (
          <Badge key={link.wing_id} tone='neutral' className='whitespace-normal'>
            {link.name} · {coverText(link.valid_from, link.valid_to) ?? 'not active'}
          </Badge>
        ))}
      </span>
    )
  if (!ao.wings.length) return <EmptyState icon={Building2} title='No wings' />
  return (
    <span className='flex flex-wrap gap-1'>
      {ao.wings.map((link) => {
        const cover = coverText(link.valid_from, link.valid_to)
        return (
          <Badge
            key={link.wing_id}
            tone={link.active ? 'info' : 'neutral'}
            title={link.note ?? undefined}
            className='whitespace-normal'
          >
            {link.name}
            {cover && ` · ${cover}`}
            {!link.active && ' · not active'}
          </Badge>
        )
      })}
    </span>
  )
}
