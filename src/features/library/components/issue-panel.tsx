import { useState } from 'react'
import { BookCheck, TriangleAlert, UserRoundX, X } from 'lucide-react'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import {
  libraryApi,
  useLibraryMutation,
  type Copy,
  type IssuePurpose,
  type MemberSummary,
  type Person,
} from '../api'
import { COPY_STATUS, plural, today } from '../labels'
import { FormError } from './library-parts'
import { MemberCard } from './member-card'
import { PersonSearch } from './person-search'
import { ScanInput } from './scan-input'
import { SectionPicker } from './school-pickers'

interface BasketItem {
  copy: Copy
  problem: string | null
}

const MAX_BASKET = 20

function problemOf(copy: Copy, summary: MemberSummary | null): string | null {
  if (copy.book.is_reference) return 'Reference book: read in the library only'
  if (copy.status !== 'available') {
    const holder = copy.current_loan ? ` with ${copy.current_loan.member.name}` : ''
    return `${COPY_STATUS[copy.status].label}${holder}`
  }
  if (summary?.loans.some((loan) => loan.book.id === copy.book_id)) {
    return 'The member already has this title'
  }
  return null
}

export function IssuePanel() {
  const [summary, setSummary] = useState<MemberSummary | null>(null)
  const [memberBusy, setMemberBusy] = useState(false)
  const [memberError, setMemberError] = useState<string | null>(null)
  const [basket, setBasket] = useState<BasketItem[]>([])
  const [copyBusy, setCopyBusy] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)
  const [dueDate, setDueDate] = useState('')
  const [purpose, setPurpose] = useState<IssuePurpose>('personal')
  const [sectionId, setSectionId] = useState<number | undefined>()
  const [remarks, setRemarks] = useState('')
  const [issueError, setIssueError] = useState<string | null>(null)
  const issue = useLibraryMutation(libraryApi.issue)

  const loadMember = async (load: () => Promise<MemberSummary>) => {
    setMemberBusy(true)
    setMemberError(null)
    setIssueError(null)
    try {
      const next = await load()
      setSummary(next)
      setBasket((items) => items.map((item) => ({ ...item, problem: problemOf(item.copy, next) })))
      if (next.enrolled_now) alerts.info(`${next.member.name} is now a library member`)
    } catch (caught) {
      setMemberError(toApiError(caught).message)
    } finally {
      setMemberBusy(false)
    }
  }

  const pickPerson = (person: Person) =>
    loadMember(async () => {
      if (person.member_id) return libraryApi.member(person.member_id)
      const member = await libraryApi.createMember(
        person.student_id ? { student_id: person.student_id } : { user_id: person.user_id! }
      )
      return { ...(await libraryApi.member(member.id)), enrolled_now: true }
    })

  const scanCopy = async (code: string) => {
    setCopyError(null)
    setIssueError(null)
    if (basket.length >= MAX_BASKET) {
      setCopyError(`Up to ${MAX_BASKET} books at a time`)
      return
    }
    if (basket.some((item) => item.copy.barcode === code || item.copy.accession_no === code)) {
      setCopyError(`${code} is already in the basket`)
      return
    }
    setCopyBusy(true)
    try {
      const copy = await libraryApi.lookupCopy(code)
      if (basket.some((item) => item.copy.id === copy.id)) {
        setCopyError(`${copy.accession_no} is already in the basket`)
        return
      }
      setBasket((items) => [...items, { copy, problem: problemOf(copy, summary) }])
    } catch (caught) {
      setCopyError(toApiError(caught).message)
    } finally {
      setCopyBusy(false)
    }
  }

  const reset = () => {
    setSummary(null)
    setBasket([])
    setDueDate('')
    setPurpose('personal')
    setSectionId(undefined)
    setRemarks('')
    setIssueError(null)
    setMemberError(null)
    setCopyError(null)
  }

  const submit = async () => {
    if (!summary || !basket.length) return
    if (purpose === 'class_set' && !sectionId) {
      setIssueError('Choose the section this class set is for')
      return
    }
    if (dueDate && dueDate < today()) {
      setIssueError('The due date cannot be in the past')
      return
    }
    setIssueError(null)
    try {
      const loans = await issue.mutateAsync({
        member_id: summary.member.id,
        codes: basket.map((item) => item.copy.barcode),
        due_date: dueDate || undefined,
        purpose,
        section_id: purpose === 'class_set' ? sectionId : undefined,
        remarks: remarks.trim() || null,
      })
      alerts.success(`${plural(loans.length, 'book')} issued to ${summary.member.name}`)
      setBasket([])
      setRemarks('')
      setDueDate('')
      setSummary(await libraryApi.member(summary.member.id))
    } catch (caught) {
      const apiError = toApiError(caught)
      setIssueError(apiError.message)
      setBasket((items) =>
        items.map((item) =>
          apiError.message.includes(item.copy.accession_no) ||
          apiError.message.includes(item.copy.barcode)
            ? { ...item, problem: apiError.message }
            : item
        )
      )
    }
  }

  const blocked = basket.some((item) => item.problem)

  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      <div className='grid content-start gap-3'>
        <Card className='grid gap-3 p-4'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <h2 className='font-bold'>1. Member</h2>
            {summary && (
              <Button variant='ghost' size='sm' onClick={reset}>
                <UserRoundX />
                Next member
              </Button>
            )}
          </div>
          <ScanInput
            id='desk-member-scan'
            label='Scan the member card'
            onScan={(code) => loadMember(() => libraryApi.lookupMember(code))}
            busy={memberBusy}
            autoFocus={!summary}
            placeholder='Library card, ID card QR, admission or employee no'
            hint='Scan or type. A student or staff member who is not a member yet is enrolled.'
          />
          <PersonSearch
            id='desk-person'
            onSelect={(person) => void pickPerson(person)}
            className='sm:w-full'
          />
          <FormError message={memberError} />
        </Card>
        {summary && <MemberCard summary={summary} />}
      </div>

      <Card className='grid content-start gap-3 p-4'>
        <h2 className='font-bold'>2. Books</h2>
        {!summary ? (
          <p className='rounded-lg border border-dashed px-3 py-8 text-center text-sm text-muted-foreground'>
            Scan the member first.
          </p>
        ) : (
          <>
            <ScanInput
              id='desk-copy-scan'
              label='Scan a book'
              onScan={scanCopy}
              busy={copyBusy}
              autoFocus
              hint={`Scan or type each book's barcode. ${summary.books_left} more allowed.`}
            />
            {copyError && (
              <p className='flex items-center gap-2 text-sm font-medium text-destructive'>
                <TriangleAlert className='size-4' />
                {copyError}
              </p>
            )}
            {basket.length > 0 ? (
              <ul className='divide-y rounded-lg border'>
                {basket.map((item) => (
                  <li
                    key={item.copy.id}
                    className={cn(
                      'flex items-start justify-between gap-2 px-3 py-2',
                      item.problem && 'bg-destructive/5'
                    )}
                  >
                    <div className='grid min-w-0'>
                      <span className='truncate font-semibold'>{item.copy.book.title}</span>
                      <span className='font-mono text-xs text-muted-foreground'>
                        {item.copy.accession_no}
                      </span>
                      {item.problem ? (
                        <span className='text-xs font-medium text-destructive'>{item.problem}</span>
                      ) : (
                        <Badge tone='success' className='justify-self-start'>
                          Available
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      aria-label={`Remove ${item.copy.accession_no}`}
                      onClick={() =>
                        setBasket((items) =>
                          items.filter((entry) => entry.copy.id !== item.copy.id)
                        )
                      }
                    >
                      <X />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className='rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground'>
                No books in the basket yet.
              </p>
            )}
            <div className='grid gap-3 sm:grid-cols-2'>
              <FormField id='desk-due' label='Due date' hint='Empty: the usual loan days'>
                <Input
                  id='desk-due'
                  type='date'
                  min={today()}
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </FormField>
              <FormField id='desk-purpose' label='Purpose'>
                <SegmentedControl
                  label='Purpose'
                  value={purpose}
                  onChange={setPurpose}
                  options={[
                    { value: 'personal', label: 'Personal' },
                    { value: 'class_set', label: 'Class set' },
                  ]}
                  className='self-start'
                />
              </FormField>
              {purpose === 'class_set' && (
                <FormField id='desk-section' label='For section' required className='sm:col-span-2'>
                  <SectionPicker id='desk-section' value={sectionId} onChange={setSectionId} />
                </FormField>
              )}
              <FormField id='desk-remarks' label='Remarks' className='sm:col-span-2'>
                <Input
                  id='desk-remarks'
                  value={remarks}
                  maxLength={255}
                  onChange={(event) => setRemarks(event.target.value)}
                />
              </FormField>
            </div>
            <FormError message={issueError} />
            <Button
              size='lg'
              onClick={() => void submit()}
              loading={issue.isPending}
              disabled={!basket.length || blocked || !summary.can_borrow}
            >
              <BookCheck />
              Issue {basket.length ? plural(basket.length, 'book') : 'books'}
            </Button>
            {blocked && (
              <span className='text-xs text-muted-foreground'>
                Remove the books marked in red to continue.
              </span>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
