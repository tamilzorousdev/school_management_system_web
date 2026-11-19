import { useRef, useState } from 'react'
import { CheckCircle2, Download, FileSpreadsheet, RotateCcw, Upload, XCircle } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatBytes } from '@/lib/files'
import { cn } from '@/lib/utils'
import {
  inventoryApi,
  inventoryFiles,
  useInventoryMutation,
  type ImportMode,
  type ImportReport,
} from '../api'
import { downloadInventoryFile, openInventoryFile } from '../labels'

const ACCEPT =
  '.xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export function AssetImportModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Import assets from Excel'
      description='Bring the existing register across at once. New category, location and vendor names are created for you.'
      size='xl'
      footer={<span />}
    >
      {open && <ImportBody onClose={() => onOpenChange(false)} />}
    </AppModal>
  )
}

function ImportBody({ onClose }: { onClose: () => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [report, setReport] = useState<ImportReport | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const run = useInventoryMutation((mode: ImportMode) => inventoryApi.importAssets(file!, mode))

  const check = async (mode: ImportMode) => {
    if (!file) return
    setError(null)
    try {
      const result = await run.mutateAsync(mode)
      setReport(result)
      setShowAll(false)
      if (mode === 'import') alerts.success(`${result.assets_created} assets registered`)
    } catch (caught) {
      setError(toApiError(caught).message)
    }
  }

  const imported = report?.mode === 'import'
  const rows = report
    ? showAll
      ? report.rows
      : report.rows.filter((row) => row.status === 'error')
    : []
  const step = imported ? 3 : report ? 2 : 1
  const createdIds = report?.rows.flatMap((row) => row.asset_ids ?? []) ?? []

  return (
    <div className='grid gap-4'>
      <ol className='grid gap-2 sm:grid-cols-3'>
        {['Download the template', 'Check your file', 'Import'].map((label, index) => (
          <li
            key={label}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold',
              step === index + 1
                ? 'border-primary bg-primary/5 text-foreground'
                : 'text-muted-foreground',
              step > index + 1 && 'text-success'
            )}
          >
            <span
              className={cn(
                'grid size-6 place-items-center rounded-full text-xs',
                step > index + 1
                  ? 'bg-success text-primary-foreground'
                  : step === index + 1
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
              )}
            >
              {step > index + 1 ? <CheckCircle2 className='size-3.5' /> : index + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>

      {!report && (
        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='grid content-start gap-2 rounded-xl border p-4'>
            <span className='font-semibold'>1. Get the template</span>
            <p className='text-sm text-muted-foreground'>
              It lists your categories and locations. Quantity registers that many identical assets;
              separate serial numbers with |.
            </p>
            <Button
              variant='outline'
              className='justify-self-start'
              loading={downloading}
              onClick={async () => {
                setDownloading(true)
                await downloadInventoryFile(
                  inventoryFiles.importTemplate,
                  'asset-import-template.xlsx'
                )
                setDownloading(false)
              }}
            >
              <Download />
              Download template
            </Button>
          </div>
          <div className='grid content-start gap-2 rounded-xl border p-4'>
            <span className='font-semibold'>2. Upload the filled file</span>
            <button
              type='button'
              onClick={() => input.current?.click()}
              className={cn(
                'flex items-center gap-3 rounded-lg border border-dashed p-3 text-left transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none',
                error && 'border-destructive'
              )}
            >
              <span className='grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary'>
                {file ? <FileSpreadsheet className='size-5' /> : <Upload className='size-5' />}
              </span>
              <span className='grid min-w-0'>
                <span className='truncate font-semibold'>
                  {file ? file.name : 'Choose the .xlsx or .csv file'}
                </span>
                <span className='text-xs text-muted-foreground'>
                  {file ? formatBytes(file.size) : 'Nothing is saved until you import'}
                </span>
              </span>
            </button>
            <input
              ref={input}
              type='file'
              accept={ACCEPT}
              className='sr-only'
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null)
                setError(null)
                event.target.value = ''
              }}
            />
            {error && (
              <p role='alert' className='text-sm font-medium text-destructive'>
                {error}
              </p>
            )}
          </div>
        </div>
      )}

      {report && (
        <>
          <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
            <Stat label='Rows' value={report.total_rows} />
            <Stat
              label={imported ? 'Assets added' : 'Rows ready'}
              value={imported ? report.assets_created : report.ok_rows}
              tone='success'
            />
            <Stat
              label='Need fixing'
              value={report.error_rows}
              tone={report.error_rows ? 'danger' : undefined}
            />
            <Stat label='New masters' value={report.masters_created} />
          </div>
          {error && (
            <p role='alert' className='text-sm font-medium text-destructive'>
              {error}
            </p>
          )}
          {!imported && report.error_rows > 0 && (
            <p className='rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning'>
              Rows that need fixing are skipped. Fix them in Excel and import that file again later.
            </p>
          )}
          <div className='flex items-center justify-between gap-2'>
            <span className='text-sm font-semibold'>
              {showAll ? 'All rows' : rows.length ? 'Rows to fix' : 'Every row is fine'}
            </span>
            <Button size='sm' variant='ghost' onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Show problems only' : 'Show all rows'}
            </Button>
          </div>
          {rows.length > 0 && (
            <div className='max-h-80 overflow-auto rounded-lg border'>
              <table className='w-full text-sm'>
                <thead className='sticky top-0 bg-muted text-left text-xs text-muted-foreground'>
                  <tr>
                    <th className='px-3 py-2 font-semibold'>Row</th>
                    <th className='px-3 py-2 font-semibold'>Asset</th>
                    <th className='px-3 py-2 font-semibold'>Status</th>
                    <th className='px-3 py-2 font-semibold'>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.row} className='border-t align-top'>
                      <td className='tabular px-3 py-2 text-muted-foreground'>{row.row}</td>
                      <td className='px-3 py-2'>
                        <span className='grid'>
                          <span className='font-semibold'>{row.name ?? '—'}</span>
                          <span className='text-xs text-muted-foreground'>× {row.quantity}</span>
                        </span>
                      </td>
                      <td className='px-3 py-2'>
                        <Badge tone={row.status === 'ok' ? 'success' : 'danger'}>
                          {row.status === 'ok' ? (imported ? 'Added' : 'Ready') : 'Fix'}
                        </Badge>
                      </td>
                      <td className='px-3 py-2 text-xs'>
                        {row.message ? (
                          <span className='flex gap-1 text-destructive'>
                            <XCircle className='mt-0.5 size-3 shrink-0' />
                            {row.message}
                          </span>
                        ) : row.asset_tags.length ? (
                          <span className='font-mono break-all text-muted-foreground'>
                            {row.asset_tags.join(', ')}
                          </span>
                        ) : (
                          <span className='text-muted-foreground'>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <div className='flex flex-wrap items-center justify-between gap-2 border-t pt-4'>
        <span className='text-xs text-muted-foreground'>Step {step} of 3</span>
        <div className='flex flex-wrap gap-2'>
          {imported ? (
            <>
              {createdIds.length > 0 && (
                <Button
                  variant='outline'
                  onClick={() =>
                    openInventoryFile(
                      inventoryFiles.labels,
                      inventoryFiles.labelsParams({ asset_ids: createdIds })
                    )
                  }
                >
                  Print labels for {createdIds.length} imported{' '}
                  {createdIds.length === 1 ? 'asset' : 'assets'}
                </Button>
              )}
              <Button onClick={onClose}>Done</Button>
            </>
          ) : report ? (
            <>
              <Button
                variant='outline'
                onClick={() => {
                  setReport(null)
                  setFile(null)
                }}
              >
                <RotateCcw />
                Choose another file
              </Button>
              <Button
                disabled={!report.ok_rows}
                loading={run.isPending}
                onClick={() => void check('import')}
              >
                Import {report.ok_rows} {report.ok_rows === 1 ? 'row' : 'rows'}
              </Button>
            </>
          ) : (
            <Button disabled={!file} loading={run.isPending} onClick={() => void check('validate')}>
              Check file
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'success' | 'danger'
}) {
  return (
    <div className='grid gap-0.5 rounded-lg border p-3'>
      <span className='text-xs font-semibold text-muted-foreground'>{label}</span>
      <span
        className={cn(
          'tabular text-xl font-extrabold',
          tone === 'success' && 'text-success',
          tone === 'danger' && 'text-destructive'
        )}
      >
        {value}
      </span>
    </div>
  )
}
