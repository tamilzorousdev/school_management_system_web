import { useState } from 'react'
import { CheckCircle2, Download, Printer } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { downloadFile } from '@/lib/files'
import { formatDate } from '@/lib/format'
import { useMe } from '@/features/auth/api'
import { receiptUrl, type FeePayment } from '../api'
import { PAYMENT_MODES, amountInWords, openReceipt, rupees } from '../labels'

export function ReceiptModal({
  payment,
  onClose,
}: {
  payment: FeePayment
  onClose: () => void
}) {
  const me = useMe()
  const school = me.data?.school
  const [downloading, setDownloading] = useState(false)

  const handlePrint = () => {
    openReceipt(payment.id)
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadFile(receiptUrl(payment.id), `Fee-Receipt-${payment.receipt_no}.pdf`)
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setDownloading(false)
    }
  }

  const footer = (
    <div className='flex w-full flex-wrap items-center justify-between gap-2 sm:justify-end'>
      <Button variant='outline' onClick={handlePrint} className='gap-1.5'>
        <Printer className='h-4 w-4' />
        Print
      </Button>
      <Button
        variant='outline'
        loading={downloading}
        onClick={() => void handleDownload()}
        className='gap-1.5'
      >
        <Download className='h-4 w-4' />
        Download PDF
      </Button>
      <Button onClick={onClose}>Done</Button>
    </div>
  )

  return (
    <AppModal
      open
      onOpenChange={(next) => !next && onClose()}
      title='Payment Receipt'
      description={`${payment.student.full_name} · ${payment.receipt_no}`}
      size='lg'
      footer={footer}
    >
      <div className='space-y-4 text-sm'>
        {/* Receipt Header Banner */}
        <div className='flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-950 dark:bg-emerald-950/20'>
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <CheckCircle2 className='h-5 w-5 text-emerald-600 dark:text-emerald-400' />
              <span className='font-bold text-emerald-950 dark:text-emerald-200'>
                {school?.name ?? 'School Management'}
              </span>
            </div>
            <p className='text-xs font-medium text-emerald-800 dark:text-emerald-300'>
              Receipt #{payment.receipt_no} · {formatDate(payment.paid_on)}
            </p>
          </div>
          <Badge tone='success' className='px-3 py-1 text-xs font-bold uppercase tracking-wider'>
            Paid · Official Copy
          </Badge>
        </div>

        {/* Student & Invoice Information */}
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <div className='rounded-lg border bg-muted/20 p-3'>
            <span className='text-[11px] font-semibold tracking-wider text-muted-foreground uppercase'>
              Student Information
            </span>
            <div className='mt-1 font-semibold text-foreground'>{payment.student.full_name}</div>
            <div className='mt-0.5 text-xs text-muted-foreground'>
              Adm: <span className='font-mono font-medium'>{payment.student.admission_no}</span>
              {payment.student.class_section && ` · Class ${payment.student.class_section}`}
            </div>
          </div>

          <div className='rounded-lg border bg-muted/20 p-3'>
            <span className='text-[11px] font-semibold tracking-wider text-muted-foreground uppercase'>
              Invoice & Installment
            </span>
            <div className='mt-1 font-semibold text-foreground'>
              {payment.installment}{' '}
              <span className='font-mono text-xs font-normal text-muted-foreground'>
                ({payment.invoice_no})
              </span>
            </div>
            <div className='mt-0.5 text-xs text-muted-foreground'>
              Payment Date: <span className='font-medium'>{formatDate(payment.paid_on)}</span>
            </div>
          </div>
        </div>

        {/* Amount Paid Callout */}
        <div className='rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/70 via-background to-emerald-50/30 p-4 text-center dark:from-emerald-950/30 dark:to-emerald-950/10'>
          <span className='text-xs font-bold tracking-widest text-emerald-700 uppercase dark:text-emerald-400'>
            Amount Received
          </span>
          <div className='mt-1 text-3xl font-extrabold tracking-tight text-emerald-700 tabular-nums dark:text-emerald-400'>
            {rupees(payment.amount)}
          </div>
          <div className='mt-1 text-xs font-medium text-emerald-800/80 italic dark:text-emerald-300/80'>
            {amountInWords(payment.amount)}
          </div>
        </div>

        {/* Payment Mode & Reference Details */}
        <div className='rounded-lg border bg-card p-3'>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div>
              <span className='text-[11px] font-semibold tracking-wider text-muted-foreground uppercase'>
                Paid By
              </span>
              <div className='mt-1 flex items-center gap-2'>
                <Badge tone='neutral' className='font-semibold'>
                  {PAYMENT_MODES[payment.mode] ?? payment.mode}
                </Badge>
              </div>
            </div>

            <div>
              <span className='text-[11px] font-semibold tracking-wider text-muted-foreground uppercase'>
                Received By
              </span>
              <div className='mt-1 text-sm font-medium'>
                {payment.received_by ?? 'Accounts Office'}
              </div>
            </div>

            {payment.reference && (
              <div className='sm:col-span-2 rounded-md border border-muted bg-muted/40 p-2.5'>
                <span className='text-[11px] font-semibold tracking-wider text-muted-foreground uppercase'>
                  Reference / Verification Details
                </span>
                <div className='mt-1 font-mono text-xs font-semibold text-foreground'>
                  {payment.reference}
                </div>
              </div>
            )}

            <div className='sm:col-span-2 flex items-center justify-between border-t pt-2 text-xs'>
              <span className='text-muted-foreground'>Remaining Invoice Balance:</span>
              <span className='tabular font-bold text-foreground'>
                {rupees(payment.invoice_balance)}
              </span>
            </div>
          </div>
        </div>

        {payment.notes && (
          <div className='rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground'>
            <span className='font-semibold text-foreground'>Notes: </span>
            {payment.notes}
          </div>
        )}

        {/* Official Seal & Signature Section */}
        <div className='flex flex-wrap items-end justify-between gap-4 rounded-lg border bg-muted/20 p-3.5'>
          <div className='flex items-center gap-3'>
            {school?.seal_url ? (
              <div className='grid h-16 w-16 shrink-0 place-items-center rounded-full border border-dashed border-emerald-600/40 bg-white p-1 shadow-xs'>
                <img
                  src={school.seal_url}
                  alt='Official School Seal'
                  className='size-full object-contain'
                />
              </div>
            ) : null}
            <div className='space-y-0.5 text-xs'>
              <span className='text-[10px] font-bold tracking-wider text-muted-foreground uppercase'>
                Official Verification
              </span>
              <p className='font-semibold text-foreground'>
                {school?.name ?? 'School Management'}
              </p>
              <p className='text-[11px] text-muted-foreground'>
                Computer-generated official receipt
              </p>
            </div>
          </div>

          <div className='flex flex-col items-center text-center'>
            {school?.signature_url ? (
              <div className='flex h-12 w-32 items-end justify-center pb-0.5'>
                <img
                  src={school.signature_url}
                  alt='Authorized Signatory'
                  className='max-h-12 w-auto max-w-full object-contain'
                />
              </div>
            ) : (
              <div className='h-8' />
            )}
            <div className='w-36 border-t border-foreground/30 pt-1'>
              <span className='text-[10px] font-bold tracking-wider text-muted-foreground uppercase'>
                Authorized Signatory
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppModal>
  )
}
