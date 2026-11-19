import { useRef, useState } from 'react'
import { CheckCircle2, Download, FileSpreadsheet, RotateCcw, Upload } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatBytes } from '@/lib/files'
import { libraryApi, useLibraryMutation, type BookImportReport } from '../api'
import { downloadImportTemplate, plural } from '../labels'
import { FormError } from './library-parts'

const MAX_BYTES = 5 * 1024 * 1024

export function ImportModal({ onClose }: { onClose: () => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [report, setReport] = useState<BookImportReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const run = useLibraryMutation((mode: 'validate' | 'import') =>
    libraryApi.importBooks(file!, mode)
  )

  const check = async (mode: 'validate' | 'import') => {
    if (!file) return
    setError(null)
    try {
      const result = await run.mutateAsync(mode)
      setReport(result)
      setShowAll(false)
      if (mode === 'import') {
        alerts.success(
          `${plural(result.books_created, 'book')} and ${plural(result.copies_added, 'copy', 'copies')} added`
        )
      }
    } catch (caught) {
      setError(toApiError(caught).message)
    }
  }

  const choose = (picked: File | undefined) => {
    if (!picked) return
    if (!/\.(xlsx|csv)$/i.test(picked.name)) {
      setError('Choose the Excel template (.xlsx) or a CSV file')
      return
    }
    if (picked.size > MAX_BYTES) {
      setError('The file must be 5 MB or smaller')
      return
    }
    setError(null)
    setReport(null)
    setFile(picked)
  }

  const imported = report?.mode === 'import'
  const rows = report
    ? showAll
      ? report.rows
      : report.rows.filter((row) => row.status === 'error')
    : []

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Import books'
      description='Fill the Excel template, check it, then import. A row with an ISBN already in the library adds copies to that book.'
      size='xl'
      footer={
        <DialogFooter>
          {imported ? (
            <Button onClick={onClose}>Done</Button>
          ) : (
            <>
              <Button variant='outline' onClick={onClose} disabled={run.isPending}>
                Cancel
              </Button>
              {report ? (
                <Button
                  onClick={() => void check('import')}
                  loading={run.isPending}
                  disabled={!report.ok_rows}
                >
                  <Upload />
                  Import {plural(report.ok_rows, 'row')}
                </Button>
              ) : (
                <Button
                  onClick={() => void check('validate')}
                  loading={run.isPending}
                  disabled={!file}
                >
                  Check file
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      }
    >
      <div className='grid gap-4'>
        <FormError message={error} />
        {!imported && (
          <div className='flex flex-wrap items-center gap-2'>
            <Button
              variant='outline'
              loading={downloading}
              onClick={async () => {
                setDownloading(true)
                await downloadImportTemplate()
                setDownloading(false)
              }}
            >
              <Download />
              Download template
            </Button>
            <Button variant='outline' onClick={() => input.current?.click()}>
              <FileSpreadsheet />
              {file ? 'Choose another file' : 'Choose file'}
            </Button>
            <input
              ref={input}
              type='file'
              accept='.xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv'
              className='hidden'
              onChange={(event) => {
                choose(event.target.files?.[0])
                event.target.value = ''
              }}
            />
            {file && (
              <span className='text-sm text-muted-foreground'>
                {file.name} · {formatBytes(file.size)}
              </span>
            )}
          </div>
        )}
        {report && (
          <div className='grid gap-3'>
            <div className='flex flex-wrap items-center gap-2 text-sm'>
              {imported && <CheckCircle2 className='size-5 text-success' />}
              <Badge tone='neutral'>{plural(report.total_rows, 'row')}</Badge>
              <Badge tone='success'>{report.ok_rows} ready</Badge>
              {report.error_rows > 0 && <Badge tone='danger'>{report.error_rows} to fix</Badge>}
              {imported && (
                <span className='text-muted-foreground'>
                  {plural(report.books_created, 'new book')} ·{' '}
                  {plural(report.copies_added, 'copy', 'copies')} ·{' '}
                  {plural(report.categories_created, 'new category', 'new categories')}
                </span>
              )}
              <Button
                variant='ghost'
                size='sm'
                className='ml-auto'
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? 'Show rows to fix' : 'Show every row'}
              </Button>
              {!imported && (
                <Button variant='ghost' size='sm' onClick={() => setReport(null)}>
                  <RotateCcw />
                  Start again
                </Button>
              )}
            </div>
            {rows.length ? (
              <div className='max-h-[50vh] overflow-auto rounded-lg border'>
                <table className='w-full text-sm'>
                  <thead className='sticky top-0 bg-muted text-left text-xs text-muted-foreground'>
                    <tr>
                      <th className='px-3 py-2'>Row</th>
                      <th className='px-3 py-2'>Book</th>
                      <th className='px-3 py-2'>Copies</th>
                      <th className='px-3 py-2'>Result</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y'>
                    {rows.map((row) => (
                      <tr key={row.row} className='align-top'>
                        <td className='tabular px-3 py-2'>{row.row}</td>
                        <td className='px-3 py-2'>
                          <div className='grid'>
                            <span className='font-semibold'>{row.title ?? '—'}</span>
                            {row.isbn && (
                              <span className='font-mono text-xs text-muted-foreground'>
                                {row.isbn}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className='tabular px-3 py-2'>{row.copies}</td>
                        <td className='px-3 py-2'>
                          {row.status === 'error' ? (
                            <span className='text-destructive'>
                              {row.message ?? 'Fix this row'}
                            </span>
                          ) : (
                            <Badge tone='success'>
                              {row.action === 'add_copies' ? 'Adds copies' : 'New book'}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className='rounded-lg border px-3 py-6 text-center text-sm text-muted-foreground'>
                {report.error_rows ? 'No rows to show.' : 'Every row is ready.'}
              </p>
            )}
          </div>
        )}
      </div>
    </AppModal>
  )
}
