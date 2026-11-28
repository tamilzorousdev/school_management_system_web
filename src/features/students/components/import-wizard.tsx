import { useRef, useState } from 'react'
import { FileSpreadsheet, XCircle } from 'lucide-react'
import { CheckCircleIcon, DownloadIcon, RefreshIcon, UploadIcon } from '@/components/common/icon'
import { AppModal } from '@/components/common/app-modal'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { downloadFile, formatBytes } from '@/lib/files'
import { cn } from '@/lib/utils'
import { useStudentMutation } from '../api'
import { recordsApi, studentFiles, type ImportReport, type ImportRowStatus } from '../records-api'

const ROW_STATUS: Record<ImportRowStatus, { label: string; tone: BadgeTone }> = {
  valid: { label: 'Ready', tone: 'success' },
  error: { label: 'Fix', tone: 'danger' },
  created: { label: 'Added', tone: 'success' },
  failed: { label: 'Not saved', tone: 'danger' },
}

export function ImportWizard({ onClose }: { onClose: () => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [report, setReport] = useState<ImportReport | null>(null)
  const [sendInvites, setSendInvites] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const run = useStudentMutation((mode: 'validate' | 'import') =>
    recordsApi.importStudents(file!, mode, sendInvites)
  )

  const check = async (mode: 'validate' | 'import') => {
    if (!file) return
    setError(null)
    try {
      const result = await run.mutateAsync(mode)
      setReport(result)
      setShowAll(false)
      if (mode === 'import') alerts.success(`${result.created} students added`)
    } catch (caught) {
      setError(toApiError(caught).message)
    }
  }

  const imported = report?.mode === 'import'
  const rows = report
    ? showAll
      ? report.rows
      : report.rows.filter((row) => row.status !== 'valid' && row.status !== 'created')
    : []
  const step = imported ? 3 : report ? 2 : 1

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Import students from Excel'
      description='Bring a whole class across at once. Parents with the same mobile are linked as one family.'
      size='xl'
      footer={
        <div className='flex w-full flex-wrap items-center justify-between gap-2'>
          <span className='text-xs text-muted-foreground'>Step {step} of 3</span>
          <div className='flex flex-wrap gap-2'>
            {imported ? (
              <Button onClick={onClose}>Done</Button>
            ) : report ? (
              <>
                <Button
                  variant='outline'
                  onClick={() => {
                    setReport(null)
                    setFile(null)
                  }}
                >
                  <RefreshIcon />
                  Choose another file
                </Button>
                <Button
                  disabled={!report.valid_rows}
                  loading={run.isPending && run.variables === 'import'}
                  onClick={() => void check('import')}
                >
                  Import {report.valid_rows} {report.valid_rows === 1 ? 'student' : 'students'}
                </Button>
              </>
            ) : (
              <Button
                disabled={!file}
                loading={run.isPending}
                onClick={() => void check('validate')}
              >
                Check file
              </Button>
            )}
          </div>
        </div>
      }
    >
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
                {step > index + 1 ? <CheckCircleIcon className='size-3.5' /> : index + 1}
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
                It has your classes, dropdowns for gender and blood group, and a sheet that explains
                each column.
              </p>
              <Button
                variant='outline'
                className='justify-self-start'
                loading={downloading}
                onClick={async () => {
                  setDownloading(true)
                  try {
                    await downloadFile(studentFiles.template, 'student-import-template.xlsx')
                  } catch (caught) {
                    alerts.error(toApiError(caught).message)
                  } finally {
                    setDownloading(false)
                  }
                }}
              >
                <DownloadIcon />
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
                  {file ? <FileSpreadsheet className='size-5' /> : <UploadIcon className='size-5' />}
                </span>
                <span className='grid min-w-0'>
                  <span className='truncate font-semibold'>
                    {file ? file.name : 'Choose the .xlsx file'}
                  </span>
                  <span className='text-xs text-muted-foreground'>
                    {file ? formatBytes(file.size) : 'Up to 1,000 students at a time'}
                  </span>
                </span>
              </button>
              <input
                ref={input}
                type='file'
                accept='.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                className='sr-only'
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null)
                  setError(null)
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
                label={imported ? 'Added' : 'Ready'}
                value={imported ? report.created : report.valid_rows}
                tone='success'
              />
              <Stat
                label='Need fixing'
                value={report.error_rows}
                tone={report.error_rows ? 'danger' : undefined}
              />
              <Stat
                label='Not saved'
                value={report.failed}
                tone={report.failed ? 'danger' : undefined}
              />
            </div>
            {!imported && report.valid_rows > 0 && (
              <label className='flex items-center justify-between gap-3 rounded-lg border p-3'>
                <span className='grid'>
                  <span className='text-sm font-semibold'>Send Parent app invites</span>
                  <span className='text-xs text-muted-foreground'>
                    SMS to every new parent. Leave off if you want to invite them later.
                  </span>
                </span>
                <Switch
                  checked={sendInvites}
                  onCheckedChange={setSendInvites}
                  aria-label='Send Parent app invites'
                />
              </label>
            )}
            {!imported && report.error_rows > 0 && (
              <p className='rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning'>
                Rows that need fixing are skipped. Fix them in Excel and import that file again
                later.
              </p>
            )}
            <div className='flex items-center justify-between gap-2'>
              <span className='text-sm font-semibold'>
                {showAll ? 'All rows' : rows.length ? 'Rows to look at' : 'Every row is fine'}
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
                      <th className='px-3 py-2 font-semibold'>Student</th>
                      <th className='px-3 py-2 font-semibold'>Status</th>
                      <th className='px-3 py-2 font-semibold'>What to fix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.row} className='border-t align-top'>
                        <td className='tabular px-3 py-2 text-muted-foreground'>{row.row}</td>
                        <td className='px-3 py-2'>
                          <span className='grid'>
                            <span className='font-semibold'>{row.name}</span>
                            <span className='text-xs text-muted-foreground'>
                              {[row.class_section, row.admission_no].filter(Boolean).join(' · ')}
                            </span>
                          </span>
                        </td>
                        <td className='px-3 py-2'>
                          <Badge tone={ROW_STATUS[row.status].tone}>
                            {ROW_STATUS[row.status].label}
                          </Badge>
                        </td>
                        <td className='px-3 py-2'>
                          {row.errors.length ? (
                            <ul className='grid gap-0.5 text-xs text-destructive'>
                              {row.errors.map((item) => (
                                <li key={`${item.field}-${item.message}`} className='flex gap-1'>
                                  <XCircle className='mt-0.5 size-3 shrink-0' />
                                  {item.message}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className='text-xs text-muted-foreground'>—</span>
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
      </div>
    </AppModal>
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
