import { useState } from 'react'
import { BookDown, IndianRupee, TriangleAlert, X } from 'lucide-react'
import { Combobox } from '@/components/common/combobox'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { can, useMe } from '@/features/auth/api'
import { rupees } from '@/features/fees/labels'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import {
  libraryApi,
  useLibraryMutation,
  type Copy,
  type CopyCondition,
  type ReturnedItem,
} from '../api'
import { COPY_CONDITION, optionsOf, plural } from '../labels'
import { type FineTarget, CollectFineModal } from './fine-modals'
import { FormError, LoanStateBadge, MemberLine } from './library-parts'
import { ScanInput } from './scan-input'

interface ReturnRow {
  copy: Copy
  condition?: CopyCondition
  damage_fine: string
  remarks: string
}

const MAX_ITEMS = 30
const AMOUNT = /^\d+(\.\d{1,2})?$/

export function ReturnPanel() {
  const canCollect = can(useMe().data, 'library.fines')
  const [rows, setRows] = useState<ReturnRow[]>([])
  const [busy, setBusy] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [returned, setReturned] = useState<ReturnedItem[] | null>(null)
  const [collecting, setCollecting] = useState<FineTarget | null>(null)
  const submit = useLibraryMutation(libraryApi.returnBooks)

  const scan = async (code: string) => {
    setScanError(null)
    setSubmitError(null)
    if (rows.length >= MAX_ITEMS) {
      setScanError(`Up to ${MAX_ITEMS} books at a time`)
      return
    }
    setBusy(true)
    try {
      const copy = await libraryApi.lookupCopy(code)
      if (rows.some((row) => row.copy.id === copy.id)) {
        setScanError(`${copy.accession_no} is already in the list`)
        return
      }
      if (!copy.current_loan) {
        setScanError(`${copy.accession_no} (${copy.book.title}) is not on loan`)
        return
      }
      setReturned(null)
      setRows((current) => [...current, { copy, damage_fine: '', remarks: '' }])
    } catch (caught) {
      setScanError(toApiError(caught).message)
    } finally {
      setBusy(false)
    }
  }

  const update = (id: number, patch: Partial<ReturnRow>) =>
    setRows((current) => current.map((row) => (row.copy.id === id ? { ...row, ...patch } : row)))

  const invalid = rows.find((row) => row.damage_fine.trim() && !AMOUNT.test(row.damage_fine.trim()))

  const save = async () => {
    if (!rows.length || invalid) return
    setSubmitError(null)
    try {
      const result = await submit.mutateAsync(
        rows.map((row) => ({
          code: row.copy.barcode,
          condition: row.condition,
          damage_fine: row.damage_fine.trim() ? Number(row.damage_fine) : undefined,
          remarks: row.remarks.trim() || null,
        }))
      )
      alerts.success(`${plural(result.length, 'book')} returned`)
      setRows([])
      setReturned(result)
    } catch (caught) {
      setSubmitError(toApiError(caught).message)
    }
  }

  const fines = (returned ?? []).flatMap((item) =>
    item.fines.map((fine) => ({ fine, member: item.loan.member.name }))
  )

  return (
    <div className='grid gap-4'>
      <Card className='grid gap-3 p-4'>
        <h2 className='font-bold'>Scan returned books</h2>
        <ScanInput
          id='desk-return-scan'
          label='Scan a returned book'
          onScan={scan}
          busy={busy}
          size='lg'
          hint='Scan or type each barcode. Check the condition before saving.'
        />
        {scanError && (
          <p className='flex items-center gap-2 text-sm font-medium text-destructive'>
            <TriangleAlert className='size-4' />
            {scanError}
          </p>
        )}
        {rows.length > 0 && (
          <ul className='divide-y rounded-lg border'>
            {rows.map((row) => {
              const loan = row.copy.current_loan!
              return (
                <li key={row.copy.id} className='grid gap-3 p-3 lg:grid-cols-[1fr_auto]'>
                  <div className='grid min-w-0 gap-1.5'>
                    <div className='flex items-start justify-between gap-2'>
                      <div className='grid min-w-0'>
                        <span className='truncate font-semibold'>{row.copy.book.title}</span>
                        <span className='font-mono text-xs text-muted-foreground'>
                          {row.copy.accession_no}
                        </span>
                      </div>
                      <Button
                        variant='ghost'
                        size='icon-sm'
                        aria-label={`Remove ${row.copy.accession_no}`}
                        onClick={() =>
                          setRows((current) =>
                            current.filter((item) => item.copy.id !== row.copy.id)
                          )
                        }
                        className='lg:hidden'
                      >
                        <X />
                      </Button>
                    </div>
                    <MemberLine member={loan.member} size='sm' />
                    <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                      <LoanStateBadge state={loan.state} days={loan.days_overdue} />
                      <span>Due {formatDate(loan.due_date)}</span>
                      {loan.days_overdue > 0 && (
                        <span className='font-semibold text-destructive'>
                          {plural(loan.days_overdue, 'day')} late · fine {rupees(loan.running_fine)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className='grid gap-2 sm:grid-cols-3 lg:w-[30rem] lg:grid-cols-[9rem_7rem_1fr_auto]'>
                    <Combobox
                      id={`return-condition-${row.copy.id}`}
                      label='Condition'
                      placeholder={`Condition: ${COPY_CONDITION[row.copy.condition]}`}
                      value={row.condition}
                      options={optionsOf(COPY_CONDITION)}
                      onChange={(next) => update(row.copy.id, { condition: next as CopyCondition })}
                      className='sm:w-full'
                    />
                    <Input
                      aria-label='Damage fine'
                      inputMode='decimal'
                      placeholder='Damage ₹'
                      value={row.damage_fine}
                      aria-invalid={Boolean(
                        row.damage_fine.trim() && !AMOUNT.test(row.damage_fine.trim())
                      )}
                      onChange={(event) => update(row.copy.id, { damage_fine: event.target.value })}
                    />
                    <Input
                      aria-label='Remarks'
                      placeholder='Remarks'
                      maxLength={255}
                      value={row.remarks}
                      onChange={(event) => update(row.copy.id, { remarks: event.target.value })}
                    />
                    <Button
                      variant='ghost'
                      size='icon'
                      aria-label={`Remove ${row.copy.accession_no}`}
                      onClick={() =>
                        setRows((current) => current.filter((item) => item.copy.id !== row.copy.id))
                      }
                      className='hidden lg:inline-flex'
                    >
                      <X />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        {invalid && (
          <p className='text-xs font-medium text-destructive'>
            Damage fine must be a number with up to 2 decimals.
          </p>
        )}
        <FormError message={submitError} />
        {rows.length > 0 && (
          <Button
            size='lg'
            className='justify-self-start'
            onClick={() => void save()}
            loading={submit.isPending}
            disabled={Boolean(invalid)}
          >
            <BookDown />
            Return {plural(rows.length, 'book')}
          </Button>
        )}
      </Card>

      {returned && (
        <Card className='grid gap-3 p-4'>
          <h2 className='font-bold'>Returned</h2>
          <ul className='divide-y rounded-lg border'>
            {returned.map((item) => (
              <li
                key={item.loan.id}
                className='flex flex-wrap items-center justify-between gap-2 px-3 py-2'
              >
                <div className='grid min-w-0'>
                  <span className='truncate font-semibold'>{item.loan.book.title}</span>
                  <span className='text-xs text-muted-foreground'>
                    {item.loan.member.name} · {item.loan.copy.accession_no}
                  </span>
                </div>
                <LoanStateBadge state={item.loan.state} />
              </li>
            ))}
          </ul>
          {fines.length > 0 ? (
            <div className='grid gap-2'>
              <span className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
                Fines raised
              </span>
              <ul className='divide-y rounded-lg border'>
                {fines.map(({ fine, member }) => (
                  <li
                    key={fine.id}
                    className='flex flex-wrap items-center justify-between gap-2 px-3 py-2'
                  >
                    <span className='flex min-w-0 items-center gap-2 text-sm'>
                      <IndianRupee className='size-3.5 text-muted-foreground' />
                      <span className='truncate'>
                        {member}: {fine.reason}
                      </span>
                    </span>
                    <span className='flex items-center gap-2'>
                      <span className='tabular font-bold text-destructive'>
                        {rupees(fine.balance)}
                      </span>
                      {canCollect && fine.balance > 0 && (
                        <Button
                          size='sm'
                          onClick={() =>
                            setCollecting({
                              id: fine.id,
                              balance: fine.balance,
                              reason: fine.reason,
                              member_name: member,
                            })
                          }
                        >
                          Collect
                        </Button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className='text-sm text-muted-foreground'>No fines were raised.</p>
          )}
        </Card>
      )}

      {collecting && <CollectFineModal fine={collecting} onClose={() => setCollecting(null)} />}
    </div>
  )
}
