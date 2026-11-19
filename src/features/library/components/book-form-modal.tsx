import { useState, type ComponentProps } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Printer } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  libraryApi,
  useCategories,
  useLibraryMutation,
  type Book,
  type BookCreateInput,
  type BookSuggestion,
} from '../api'
import {
  copiesPayload,
  copiesSchema,
  emptyCopies,
  hasCopies,
  numberOrNull,
  optionalAmount,
  optionalInt,
  optionalText,
  textOrNull,
} from '../form-utils'
import { openLabels, plural, useCanPickClasses } from '../labels'
import { CopiesFields } from './copies-fields'
import { FormError } from './library-parts'
import { SubjectPicker } from './school-pickers'

const FORM_ID = 'library-book-form'

const schema = z.object({
  title: z.string().trim().min(1, 'Enter the title').max(200, 'Title is up to 200 characters'),
  subtitle: optionalText(200, 'Subtitle'),
  isbn: z
    .string()
    .trim()
    .refine(
      (value) => !value || (value.length >= 10 && value.length <= 17),
      'ISBN is 10 to 17 characters'
    ),
  authors: optionalText(200, 'Authors'),
  publisher: optionalText(120, 'Publisher'),
  edition: optionalText(40, 'Edition'),
  published_year: optionalInt(1400, 2100, 'Year'),
  language: z.string().trim().min(2, 'Language is 2 to 30 characters').max(30),
  category_id: z.number().optional(),
  subject_id: z.number().optional(),
  pages: optionalInt(1, 20000, 'Pages'),
  rack: optionalText(20, 'Rack'),
  shelf: optionalText(20, 'Shelf'),
  price: optionalAmount(1000000, 'Price'),
  description: optionalText(4000, 'Description'),
  keywords: optionalText(200, 'Keywords'),
  is_active: z.boolean(),
  copies: copiesSchema(0),
})

type FormValues = z.infer<typeof schema>

export interface BookPrefill extends Partial<BookSuggestion> {
  isbn?: string
}

const BOOK_FIELDS: (keyof FormValues)[] = [
  'title',
  'subtitle',
  'isbn',
  'authors',
  'publisher',
  'edition',
  'published_year',
  'language',
  'category_id',
  'subject_id',
  'pages',
  'rack',
  'shelf',
  'price',
  'description',
  'keywords',
]

const text = (value: string | null | undefined) => value ?? ''
const numberText = (value: number | null | undefined) =>
  value === null || value === undefined ? '' : String(value)

function defaults(book: Book | null, prefill: BookPrefill | null): FormValues {
  return {
    title: book?.title ?? prefill?.title ?? '',
    subtitle: text(book?.subtitle ?? prefill?.subtitle),
    isbn: text(book?.isbn ?? prefill?.isbn),
    authors: text(book?.authors ?? prefill?.authors),
    publisher: text(book?.publisher ?? prefill?.publisher),
    edition: text(book?.edition),
    published_year: numberText(book?.published_year ?? prefill?.published_year),
    language: book?.language ?? 'English',
    category_id: book?.category?.id,
    subject_id: book?.subject?.id,
    pages: numberText(book?.pages ?? prefill?.pages),
    rack: text(book?.rack),
    shelf: text(book?.shelf),
    price: numberText(book?.price),
    description: text(book?.description ?? prefill?.description),
    keywords: text(book?.keywords),
    is_active: book?.is_active ?? true,
    copies: emptyCopies('1'),
  }
}

export function BookFormModal({
  open,
  onOpenChange,
  book,
  prefill,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  book: Book | null
  prefill?: BookPrefill | null
}) {
  const [created, setCreated] = useState<Book | null>(null)
  const save = useLibraryMutation((values: FormValues) => {
    const input: BookCreateInput = {
      title: values.title,
      subtitle: textOrNull(values.subtitle),
      isbn: textOrNull(values.isbn),
      authors: textOrNull(values.authors),
      publisher: textOrNull(values.publisher),
      edition: textOrNull(values.edition),
      published_year: numberOrNull(values.published_year),
      language: values.language,
      category_id: values.category_id ?? null,
      subject_id: values.subject_id ?? null,
      pages: numberOrNull(values.pages),
      rack: textOrNull(values.rack),
      shelf: textOrNull(values.shelf),
      price: numberOrNull(values.price),
      description: textOrNull(values.description),
      keywords: textOrNull(values.keywords),
    }
    if (book) return libraryApi.updateBook(book.id, { ...input, is_active: values.is_active })
    return libraryApi.createBook(
      hasCopies(values.copies) ? { ...input, copies: copiesPayload(values.copies) } : input
    )
  })

  const close = (next: boolean) => {
    if (!next) setCreated(null)
    onOpenChange(next)
  }

  if (created) {
    return (
      <AppModal
        open={open}
        onOpenChange={close}
        title='Book added'
        description={created.title}
        footer={
          <DialogFooter>
            <Button variant='outline' onClick={() => close(false)}>
              Done
            </Button>
            {created.copies.total > 0 && (
              <Button onClick={() => openLabels({ book_id: created.id })}>
                <Printer />
                Print labels
              </Button>
            )}
          </DialogFooter>
        }
      >
        <div className='flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-3 text-sm'>
          <CheckCircle2 className='size-5 shrink-0 text-success' />
          <span>
            {created.copies.total
              ? `${plural(created.copies.total, 'copy', 'copies')} added. Print the barcode labels and stick them on the books.`
              : 'The title is in the catalogue. Add copies from the book page when they arrive.'}
          </span>
        </div>
      </AppModal>
    )
  }

  return (
    <AppModal
      open={open}
      onOpenChange={close}
      title={book ? 'Edit book' : 'Add book'}
      description={
        book
          ? 'Changes show on every copy of this title.'
          : 'Add the title with its copies. Copies get accession numbers and barcodes.'
      }
      formId={FORM_ID}
      submitText={book ? 'Save book' : 'Add book'}
      loading={save.isPending}
      size='xl'
    >
      {open && (
        <BookForm
          key={book?.id ?? prefill?.isbn ?? 'new'}
          book={book}
          prefill={prefill ?? null}
          onSubmit={async (values) => {
            const result = await save.mutateAsync(values)
            if (book) {
              alerts.success('Book saved')
              close(false)
            } else {
              alerts.success('Book added')
              setCreated(result)
            }
          }}
        />
      )}
    </AppModal>
  )
}

function BookForm({
  book,
  prefill,
  onSubmit,
}: {
  book: Book | null
  prefill: BookPrefill | null
  onSubmit: (values: FormValues) => Promise<void>
}) {
  const categories = useCategories()
  const canPickSubject = useCanPickClasses()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults(book, prefill) })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      const apiError = toApiError(error)
      let mapped = false
      apiError.fieldErrors.forEach((item) => {
        const field = BOOK_FIELDS.find((name) => name === item.field)
        if (field) {
          setError(field, { message: item.message }, { shouldFocus: !mapped })
          mapped = true
        }
      })
      if (apiError.code === 'DUPLICATE_ISBN') {
        setError('isbn', { message: apiError.message }, { shouldFocus: true })
      } else if (apiError.code.startsWith('BARCODE') || apiError.code.startsWith('ACCESSION')) {
        setError('root', { message: apiError.message })
      } else if (!mapped) {
        setError('root', { message: apiError.message })
      }
    }
  })

  const field = (
    name: keyof FormValues,
    label: string,
    props: ComponentProps<typeof Input> = {}
  ) => (
    <FormField id={`book-${name}`} label={label} error={errors[name]?.message}>
      <Input
        id={`book-${name}`}
        aria-invalid={Boolean(errors[name])}
        {...props}
        {...register(name as 'title')}
      />
    </FormField>
  )

  return (
    <form id={FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
      <FormError message={errors.root?.message} />
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField
          id='book-title'
          label='Title'
          required
          error={errors.title?.message}
          className='sm:col-span-2'
        >
          <Input
            id='book-title'
            autoFocus
            aria-invalid={Boolean(errors.title)}
            {...register('title')}
          />
        </FormField>
        {field('subtitle', 'Subtitle')}
        {field('isbn', 'ISBN', { inputMode: 'numeric', placeholder: '978…' })}
        {field('authors', 'Authors', { placeholder: 'Separate names with commas' })}
        {field('publisher', 'Publisher')}
        {field('edition', 'Edition')}
        {field('published_year', 'Year published', { inputMode: 'numeric' })}
        {field('language', 'Language')}
        <FormField id='book-category' label='Category' error={errors.category_id?.message}>
          <Controller
            control={control}
            name='category_id'
            render={({ field: item }) => (
              <Combobox
                id='book-category'
                label='Category'
                placeholder='No category'
                allLabel='No category'
                value={item.value ? String(item.value) : undefined}
                options={(categories.data ?? []).map((category) => ({
                  value: String(category.id),
                  label: category.name,
                  hint: category.is_reference ? 'Reference' : category.code,
                }))}
                onChange={(next) => item.onChange(next ? Number(next) : undefined)}
                className='sm:w-full'
                highlightSelected={false}
              />
            )}
          />
        </FormField>
        {canPickSubject && (
          <FormField id='book-subject' label='Subject' error={errors.subject_id?.message}>
            <Controller
              control={control}
              name='subject_id'
              render={({ field: item }) => (
                <SubjectPicker value={item.value} onChange={item.onChange} />
              )}
            />
          </FormField>
        )}
        {field('pages', 'Pages', { inputMode: 'numeric' })}
        {field('price', 'Price (₹)', { inputMode: 'decimal' })}
        {field('rack', 'Rack', { placeholder: 'R3' })}
        {field('shelf', 'Shelf', { placeholder: 'S2' })}
        {field('keywords', 'Keywords', { placeholder: 'biography, science' })}
        <FormField
          id='book-description'
          label='Description'
          error={errors.description?.message}
          className='sm:col-span-2'
        >
          <Textarea id='book-description' rows={3} {...register('description')} />
        </FormField>
        {book && (
          <div className='flex items-center justify-between gap-3 rounded-lg border px-3 py-2 sm:col-span-2'>
            <div className='grid'>
              <span className='text-sm font-semibold'>In the catalogue</span>
              <span className='text-xs text-muted-foreground'>
                Switch off to hide a title that is no longer stocked.
              </span>
            </div>
            <Controller
              control={control}
              name='is_active'
              render={({ field: item }) => (
                <Switch
                  checked={item.value}
                  onCheckedChange={item.onChange}
                  aria-label='In the catalogue'
                />
              )}
            />
          </div>
        )}
      </div>
      {!book && (
        <Controller
          control={control}
          name='copies'
          render={({ field: item }) => (
            <CopiesFields
              value={item.value}
              onChange={item.onChange}
              errors={errors.copies}
              allowNone
            />
          )}
        />
      )}
    </form>
  )
}
