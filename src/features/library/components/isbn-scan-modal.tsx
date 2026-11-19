import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { BookPlus, CopyPlus, PencilLine, TriangleAlert } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { toApiError } from '@/lib/api/errors'
import { libraryApi, type Book, type IsbnLookup } from '../api'
import type { BookPrefill } from './book-form-modal'
import { ScanInput } from './scan-input'

export function IsbnScanModal({
  open,
  onOpenChange,
  onCreate,
  onAddCopies,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (prefill: BookPrefill | null) => void
  onAddCopies: (book: Book) => void
}) {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<IsbnLookup | null>(null)
  const [error, setError] = useState<string | null>(null)

  const change = (next: boolean) => {
    if (!next) {
      setResult(null)
      setError(null)
    }
    onOpenChange(next)
  }

  const scan = async (code: string) => {
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      setResult(await libraryApi.isbn(code.replace(/[\s-]/g, '')))
    } catch (caught) {
      setError(toApiError(caught).message)
    } finally {
      setBusy(false)
    }
  }

  const existing = result?.book
  const suggestion = result?.suggestion

  return (
    <AppModal
      open={open}
      onOpenChange={change}
      title='Add a book'
      description='Scan the barcode on the back cover (ISBN) with the scanner, or type it and press Enter.'
      size='lg'
      footer={
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => {
              change(false)
              onCreate(null)
            }}
          >
            <PencilLine />
            Type the details instead
          </Button>
          {result && !existing && (
            <Button
              onClick={() => {
                change(false)
                onCreate({ isbn: result.isbn, ...(suggestion ?? {}) })
              }}
            >
              <BookPlus />
              {suggestion ? 'Use these details' : 'Add this book'}
            </Button>
          )}
          {existing && (
            <Button
              onClick={() => {
                change(false)
                onAddCopies(existing)
              }}
            >
              <CopyPlus />
              Add copies to this book
            </Button>
          )}
        </DialogFooter>
      }
    >
      {open && (
        <div className='grid gap-4'>
          <ScanInput
            id='isbn-scan'
            label='ISBN'
            onScan={scan}
            busy={busy}
            size='lg'
            placeholder='978…'
            hint='Scan or type the ISBN-10 or ISBN-13, then Enter'
          />
          {error && (
            <p className='flex items-center gap-2 text-sm font-medium text-destructive'>
              <TriangleAlert className='size-4' />
              {error}
            </p>
          )}
          {existing && (
            <div className='grid gap-1 rounded-lg border border-info/30 bg-info/10 p-3 text-sm'>
              <span className='font-semibold'>Already in the library</span>
              <Link
                to='/library/books/$bookId'
                params={{ bookId: String(existing.id) }}
                search={{}}
                className='font-bold hover:underline'
              >
                {existing.title}
              </Link>
              <span className='text-xs text-muted-foreground'>
                {[
                  existing.authors,
                  `${existing.copies.total} copies`,
                  `${existing.copies.available} available`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
          )}
          {result && !existing && (
            <div className='grid gap-1 rounded-lg border p-3 text-sm'>
              <span className='font-mono text-xs text-muted-foreground'>ISBN {result.isbn}</span>
              {suggestion ? (
                <>
                  <span className='font-bold'>{suggestion.title}</span>
                  <span className='text-xs text-muted-foreground'>
                    {[suggestion.authors, suggestion.publisher, suggestion.published_year]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </>
              ) : (
                <span className='text-muted-foreground'>
                  New to the library. No details were found online, so type them on the next step.
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </AppModal>
  )
}
