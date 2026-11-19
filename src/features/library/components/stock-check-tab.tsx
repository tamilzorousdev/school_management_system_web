import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ClipboardCheck, Lock, Plus } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState, ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { PageTabs } from '@/components/common/page-tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  libraryApi,
  useAudit,
  useAuditItems,
  useAudits,
  useCategories,
  useLibraryMutation,
  type Audit,
  type AuditItem,
  type AuditItemFinding,
  type AuditScanResult,
} from '../api'
import { optionalText, textOrNull } from '../form-utils'
import { AUDIT_FINDING, AUDIT_FINDING_KEYS, plural } from '../labels'
import { LIST_LIMIT, oneOf, type LibraryTabProps } from '../search'
import { BookLine, CopyStatusBadge, FormError, Stat } from './library-parts'
import { ScanInput } from './scan-input'

export function StockCheckTab({ search, onChange }: LibraryTabProps) {
  if (search.audit_id) {
    return <AuditView auditId={search.audit_id} search={search} onChange={onChange} />
  }
  return <AuditList onOpen={(audit_id) => onChange({ audit_id })} />
}

function AuditList({ onOpen }: { onOpen: (id: number) => void }) {
  const canManage = can(useMe().data, 'library.manage')
  const audits = useAudits()
  const [starting, setStarting] = useState(false)
  const rows = audits.data ?? []
  const hasOpen = rows.some((audit) => audit.status === 'open')

  const columns: Column<Audit>[] = [
    {
      key: 'name',
      header: 'Stock check',
      cell: (audit) => (
        <div className='grid'>
          <span className='font-bold'>{audit.name}</span>
          <span className='text-xs text-muted-foreground'>
            {[audit.category?.name, audit.rack && `Rack ${audit.rack}`]
              .filter(Boolean)
              .join(' · ') || 'Whole library'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (audit) =>
        audit.status === 'open' ? (
          <Badge tone='info' dot pulse>
            Open
          </Badge>
        ) : (
          <Badge>Closed</Badge>
        ),
    },
    {
      key: 'progress',
      header: 'Scanned',
      cell: (audit) => (
        <span className='tabular'>
          {audit.found} / {audit.expected}
        </span>
      ),
    },
    {
      key: 'missing',
      header: 'Missing',
      cell: (audit) => (
        <span className={cn('tabular font-semibold', audit.missing && 'text-destructive')}>
          {audit.missing}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Started',
      hideBelow: 'lg',
      cell: (audit) => (
        <div className='grid'>
          <span>{formatDateTime(audit.created_at)}</span>
          {audit.started_by && (
            <span className='text-xs text-muted-foreground'>by {audit.started_by}</span>
          )}
        </div>
      ),
    },
  ]

  if (audits.isError && !audits.data) {
    return <ErrorState message={audits.error.message} onRetry={() => audits.refetch()} />
  }

  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
        <div className='grid gap-0.5'>
          <h2 className='font-bold'>Stock checks</h2>
          <p className='text-xs text-muted-foreground'>
            Scan every book on the shelves to find what is missing or in the wrong place.
          </p>
        </div>
        {canManage && (
          <Button
            size='sm'
            onClick={() => setStarting(true)}
            disabled={hasOpen}
            title={hasOpen ? 'Close the open stock check first' : undefined}
          >
            <Plus />
            Start stock check
          </Button>
        )}
      </div>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(audit) => audit.id}
        loading={audits.isFetching}
        onRowClick={(audit) => onOpen(audit.id)}
        empty={{
          icon: ClipboardCheck,
          title: 'No stock checks yet',
          description: 'Start one for the whole library, a category or a rack.',
        }}
        card={(audit) => (
          <div className='flex items-center justify-between gap-2'>
            <div className='grid min-w-0'>
              <span className='truncate font-bold'>{audit.name}</span>
              <span className='text-xs text-muted-foreground'>
                {audit.found} / {audit.expected} found · {audit.missing} missing
              </span>
            </div>
            {audit.status === 'open' ? <Badge tone='info'>Open</Badge> : <Badge>Closed</Badge>}
          </div>
        )}
      />
      {starting && <StartAuditModal onClose={() => setStarting(false)} onStarted={onOpen} />}
    </Card>
  )
}

const startSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Name is 3 to 80 characters')
    .max(80, 'Name is 3 to 80 characters'),
  category_id: z.number().optional(),
  rack: optionalText(20, 'Rack'),
  notes: optionalText(255, 'Notes'),
})

type StartValues = z.infer<typeof startSchema>

function StartAuditModal({
  onClose,
  onStarted,
}: {
  onClose: () => void
  onStarted: (id: number) => void
}) {
  const categories = useCategories()
  const start = useLibraryMutation((values: StartValues) =>
    libraryApi.startAudit({
      name: values.name,
      category_id: values.category_id,
      rack: textOrNull(values.rack),
      notes: textOrNull(values.notes),
    })
  )
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<StartValues>({
    resolver: zodResolver(startSchema),
    defaultValues: { name: `Stock check ${new Date().getFullYear()}`, rack: '', notes: '' },
  })
  const submit = handleSubmit(async (values) => {
    try {
      const audit = await start.mutateAsync(values)
      alerts.success('Stock check started')
      onClose()
      onStarted(audit.id)
    } catch (error) {
      setError('root', { message: toApiError(error).message })
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Start stock check'
      description='Leave category and rack empty to check the whole library. Only one can be open at a time.'
      formId='library-audit-start'
      submitText='Start'
      loading={start.isPending}
    >
      <form
        id='library-audit-start'
        noValidate
        onSubmit={submit}
        className='grid gap-4 sm:grid-cols-2'
      >
        <div className='sm:col-span-2'>
          <FormError message={errors.root?.message} />
        </div>
        <FormField
          id='audit-name'
          label='Name'
          required
          error={errors.name?.message}
          className='sm:col-span-2'
        >
          <Input
            id='audit-name'
            autoFocus
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
        </FormField>
        <FormField id='audit-category' label='Category'>
          <Controller
            control={control}
            name='category_id'
            render={({ field }) => (
              <Combobox
                id='audit-category'
                label='Category'
                placeholder='Every category'
                allLabel='Every category'
                value={field.value ? String(field.value) : undefined}
                options={(categories.data ?? []).map((item) => ({
                  value: String(item.id),
                  label: item.name,
                }))}
                onChange={(next) => field.onChange(next ? Number(next) : undefined)}
                className='sm:w-full'
                highlightSelected={false}
              />
            )}
          />
        </FormField>
        <FormField id='audit-rack' label='Rack' error={errors.rack?.message}>
          <Input id='audit-rack' placeholder='Every rack' {...register('rack')} />
        </FormField>
        <FormField
          id='audit-notes'
          label='Notes'
          error={errors.notes?.message}
          className='sm:col-span-2'
        >
          <Input id='audit-notes' {...register('notes')} />
        </FormField>
      </form>
    </AppModal>
  )
}

const FINDING_TONE: Record<string, string> = {
  success: 'border-success/30 bg-success/10',
  warning: 'border-warning/30 bg-warning/10',
  danger: 'border-destructive/30 bg-destructive/10',
  info: 'border-info/30 bg-info/10',
  neutral: 'border-border bg-muted',
}

function AuditView({
  auditId,
  search,
  onChange,
}: { auditId: number } & Pick<LibraryTabProps, 'search' | 'onChange'>) {
  const canManage = can(useMe().data, 'library.manage')
  const audit = useAudit(auditId)
  const finding: AuditItemFinding = oneOf(AUDIT_FINDING_KEYS, search.finding) ?? 'found'
  const items = useAuditItems(auditId, { page: search.page ?? 1, limit: LIST_LIMIT, finding })
  const [last, setLast] = useState<AuditScanResult | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [closing, setClosing] = useState(false)
  const scan = useLibraryMutation((code: string) => libraryApi.scanAudit(auditId, code))
  const data = audit.data

  if (audit.isError && !data) {
    return <ErrorState message={audit.error.message} onRetry={() => audit.refetch()} />
  }
  if (!data) return <Skeleton className='h-64' />

  const open = data.status === 'open'
  const counts: Partial<Record<AuditItemFinding, number>> = {
    found: data.found,
    misplaced: data.misplaced,
    was_issued: data.was_issued,
    was_lost: data.was_lost,
    unknown: data.unknown,
    missing: data.missing,
  }

  const columns: Column<AuditItem>[] = [
    {
      key: 'code',
      header: 'Code',
      cell: (item) => <span className='font-mono text-xs font-semibold'>{item.code}</span>,
    },
    {
      key: 'book',
      header: 'Book',
      cell: (item) =>
        item.copy ? (
          <BookLine
            bookId={item.copy.book_id}
            title={item.copy.book.title}
            sub={[item.copy.accession_no, item.copy.location].filter(Boolean).join(' · ')}
          />
        ) : (
          <span className='text-muted-foreground'>Not in the catalogue</span>
        ),
    },
    {
      key: 'status',
      header: 'Copy status',
      cell: (item) => (item.copy ? <CopyStatusBadge status={item.copy.status} /> : '—'),
    },
    {
      key: 'scanned_at',
      header: 'Scanned',
      hideBelow: 'lg',
      cell: (item) => (finding === 'missing' ? '—' : formatDateTime(item.scanned_at)),
    },
  ]

  return (
    <div className='grid gap-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => onChange({ audit_id: undefined, finding: undefined })}
        >
          <ArrowLeft />
          All stock checks
        </Button>
        {open && canManage && (
          <Button variant='outline' size='sm' onClick={() => setClosing(true)}>
            <Lock />
            Close stock check
          </Button>
        )}
      </div>
      <Card className='grid gap-4 p-4'>
        <div className='flex flex-wrap items-center gap-2'>
          <h2 className='text-lg font-extrabold'>{data.name}</h2>
          {open ? (
            <Badge tone='info' dot pulse>
              Open
            </Badge>
          ) : (
            <Badge>Closed</Badge>
          )}
          <span className='text-sm text-muted-foreground'>
            {[data.category?.name, data.rack && `Rack ${data.rack}`].filter(Boolean).join(' · ') ||
              'Whole library'}
          </span>
        </div>
        <dl className='grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8'>
          <Stat label='Expected' value={data.expected} />
          <Stat label='Scanned' value={data.scanned} />
          <Stat label='Found' value={data.found} tone='success' />
          <Stat
            label='Misplaced'
            value={data.misplaced}
            tone={data.misplaced ? 'warning' : undefined}
          />
          <Stat
            label='Shown as issued'
            value={data.was_issued}
            tone={data.was_issued ? 'warning' : undefined}
          />
          <Stat
            label='Shown as lost'
            value={data.was_lost}
            tone={data.was_lost ? 'warning' : undefined}
          />
          <Stat label='Unknown' value={data.unknown} tone={data.unknown ? 'danger' : undefined} />
          <Stat label='Missing' value={data.missing} tone={data.missing ? 'danger' : 'success'} />
        </dl>
        {open && canManage && (
          <div className='grid gap-2'>
            <ScanInput
              id='audit-scan'
              label='Scan a book on the shelf'
              size='lg'
              busy={scan.isPending}
              hint='Scan or type every barcode on the shelf, one after another.'
              onScan={async (code) => {
                setScanError(null)
                try {
                  setLast(await scan.mutateAsync(code))
                } catch (caught) {
                  setLast(null)
                  setScanError(toApiError(caught).message)
                }
              }}
            />
            <FormError message={scanError} />
            {last && (
              <div
                className={cn(
                  'flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3',
                  FINDING_TONE[AUDIT_FINDING[last.finding].tone]
                )}
              >
                <div className='grid min-w-0'>
                  <span className='font-bold'>{last.message}</span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {last.copy
                      ? `${last.copy.accession_no} · ${last.copy.book.title}`
                      : 'Unknown code'}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  {last.repeated && <Badge tone='neutral'>Already scanned</Badge>}
                  <Badge tone={AUDIT_FINDING[last.finding].tone}>
                    {AUDIT_FINDING[last.finding].label}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
      <Card className='overflow-hidden'>
        <div className='px-4 pt-2'>
          <PageTabs
            label='Stock check findings'
            value={finding}
            onChange={(next) => onChange({ finding: next })}
            tabs={AUDIT_FINDING_KEYS.map((key) => ({
              value: key,
              label: AUDIT_FINDING[key].label,
              count: counts[key],
            }))}
          />
        </div>
        <DataTable
          rows={items.data?.items ?? []}
          columns={columns}
          rowKey={(item) => `${item.id}-${item.code}`}
          loading={items.isFetching}
          error={items.isError ? items.error.message : null}
          onRetry={() => items.refetch()}
          empty={{
            icon: ClipboardCheck,
            title:
              finding === 'missing'
                ? 'Nothing missing'
                : `No ${AUDIT_FINDING[finding].label.toLowerCase()} copies`,
          }}
          card={(item) => (
            <div className='grid gap-1'>
              <span className='font-mono text-xs font-semibold'>{item.code}</span>
              <span className='truncate text-sm'>
                {item.copy?.book.title ?? 'Not in the catalogue'}
              </span>
            </div>
          )}
          pagination={{
            page: search.page ?? 1,
            limit: LIST_LIMIT,
            total: items.data?.total ?? 0,
            label: 'codes',
            onPageChange: (page) => onChange({ page }),
          }}
        />
      </Card>
      {closing && <CloseAuditModal audit={data} onClose={() => setClosing(false)} />}
    </div>
  )
}

function CloseAuditModal({ audit, onClose }: { audit: Audit; onClose: () => void }) {
  const [withdraw, setWithdraw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const close = useLibraryMutation((value: boolean) => libraryApi.closeAudit(audit.id, value))
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Close stock check'
      description={`${audit.name}: ${plural(audit.missing, 'copy', 'copies')} not scanned.`}
      loading={close.isPending}
      footer={
        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={close.isPending}>
            Keep scanning
          </Button>
          <Button
            loading={close.isPending}
            onClick={async () => {
              setError(null)
              try {
                await close.mutateAsync(withdraw)
                alerts.success('Stock check closed')
                onClose()
              } catch (caught) {
                setError(toApiError(caught).message)
              }
            }}
          >
            Close stock check
          </Button>
        </DialogFooter>
      }
    >
      <div className='grid gap-3'>
        <FormError message={error} />
        {audit.missing > 0 ? (
          <div className='flex items-center justify-between gap-3 rounded-lg border px-3 py-2'>
            <div className='grid'>
              <span className='text-sm font-semibold'>Withdraw the missing copies</span>
              <span className='text-xs text-muted-foreground'>
                Marks {plural(audit.missing, 'copy', 'copies')} withdrawn. They can be restored
                later.
              </span>
            </div>
            <Switch
              checked={withdraw}
              onCheckedChange={setWithdraw}
              aria-label='Withdraw the missing copies'
            />
          </div>
        ) : (
          <EmptyState icon={ClipboardCheck} title='Every expected copy was found' />
        )}
      </div>
    </AppModal>
  )
}
