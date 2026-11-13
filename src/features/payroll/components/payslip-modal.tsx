import { useState } from 'react'
import { FileDown, Printer, X } from 'lucide-react'
import { useMe } from '@/features/auth/api'
import { useSchoolProfile } from '@/features/setup/api'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { downloadFile, openFile } from '@/lib/files'
import { payslipPdfUrl, type Payslip } from '../api'
import { rupees } from '../labels'

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
]
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function belowHundred(value: number): string {
  if (value < 20) return ONES[value] || ''
  return [TENS[Math.floor(value / 10)], ONES[value % 10]].filter(Boolean).join(' ')
}

function belowThousand(value: number): string {
  const hundreds = Math.floor(value / 100)
  const rest = value % 100
  return [hundreds ? `${ONES[hundreds]} Hundred` : '', rest ? belowHundred(rest) : '']
    .filter(Boolean)
    .join(' ')
}

function amountInWords(value: number): string {
  let rest = Math.floor(value)
  const paise = Math.round((value - rest) * 100)
  if (rest === 0 && paise === 0) return 'Rupees Zero Only'
  const parts: string[] = []
  for (const [size, name] of [
    [10000000, 'Crore'],
    [100000, 'Lakh'],
    [1000, 'Thousand'],
  ] as const) {
    const count = Math.floor(rest / size)
    if (count) parts.push(`${count >= 100 ? belowThousand(count) : belowHundred(count)} ${name}`)
    rest %= size
  }
  if (rest) parts.push(belowThousand(rest))
  const rupeesText = parts.length ? `Rupees ${parts.join(' ')}` : 'Rupees Zero'
  return `${rupeesText}${paise ? ` and ${belowHundred(paise)} Paise` : ''} Only`
}

function toRelativeUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('/')) return url
  try {
    const parsed = new URL(url)
    return `${parsed.pathname}${parsed.search}`
  } catch {
    return url
  }
}

export function PayslipModal({ slip, onClose }: { slip: Payslip | null; onClose: () => void }) {
  const me = useMe().data
  const { data: schoolProfile } = useSchoolProfile()
  const schoolName = schoolProfile?.name || me?.school?.name || 'Tamilzorous Model School'
  const schoolEmail = schoolProfile?.email || 'office@tamilzorous.edu'
  const schoolAddress = schoolProfile?.address
    ? `${schoolProfile.address}${schoolProfile.city ? `, ${schoolProfile.city}` : ''}`
    : 'School Campus Office, Chennai - 600001'
  const schoolLogoUrl = toRelativeUrl(schoolProfile?.logo_url || me?.school?.logo_url)
  const schoolSignatureUrl = toRelativeUrl(
    schoolProfile?.signature_url || me?.school?.signature_url
  )
  const schoolSealUrl = toRelativeUrl(schoolProfile?.seal_url || me?.school?.seal_url)
  const [downloading, setDownloading] = useState(false)

  if (!slip) return null

  const handleDownloadPdf = async () => {
    setDownloading(true)
    try {
      await downloadFile(payslipPdfUrl(slip.id), `Payslip-${slip.employee_no}-${slip.month}.pdf`)
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setDownloading(false)
    }
  }

  const handlePrint = async () => {
    try {
      await openFile(payslipPdfUrl(slip.id))
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  // Earnings items
  const earningsList: { name: string; amount: number }[] = [
    { name: 'Basic Pay', amount: slip.basic },
    { name: 'Dearness Allowance (DA)', amount: slip.da },
    { name: 'House Rent Allowance (HRA)', amount: slip.hra },
    { name: 'Conveyance Allowance', amount: slip.conveyance },
    { name: 'Special Allowance', amount: slip.special_allowance },
    { name: 'Other Allowance', amount: slip.other_allowance },
  ].filter((item) => item.amount > 0 || item.name === 'Basic Pay')

  // Deductions items
  const deductionsList: { name: string; amount: number }[] = [
    { name: 'Provident Fund (PF)', amount: slip.pf },
    { name: 'Employee State Insurance (ESI)', amount: slip.esi },
    { name: 'Professional Tax', amount: slip.professional_tax },
    { name: 'Tax Deducted at Source (TDS)', amount: slip.tds },
    { name: 'Other Deduction', amount: slip.other_deduction },
  ].filter((item) => item.amount > 0)

  // Combined salary table items matching reference image columns
  const tableItems = [
    ...earningsList.map((e) => ({
      name: e.name,
      qty: `${slip.paid_days}`,
      tax: 'Earning',
      amount: e.amount,
      isDeduction: false,
    })),
    ...deductionsList.map((d) => ({
      name: d.name,
      qty: '1',
      tax: 'Deduction',
      amount: d.amount,
      isDeduction: true,
    })),
  ]

  const slipNumber = `#TZMS-PAY-${slip.month_label.slice(0, 3).toUpperCase()}-${slip.employee_no}`

  const dueDate = (() => {
    const parts = slip.month_label.trim().split(/\s+/)
    if (parts.length >= 2) {
      const monthName = parts[0]
      const year = parseInt(parts[1], 10) || new Date().getFullYear()
      const monthDate = new Date(`${monthName} 1, 2000`)
      if (!isNaN(monthDate.getTime())) {
        const monthIndex = monthDate.getMonth()
        const lastDay = new Date(year, monthIndex + 1, 0).getDate()
        return `${lastDay} ${slip.month_label}`
      }
    }
    return slip.month_label
  })()

  return (
    <Dialog open={Boolean(slip)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        hideClose
        className='max-h-[94vh] max-w-3xl overflow-y-auto border bg-white p-0 shadow-2xl sm:rounded-2xl'
      >
        {/* Action Header Bar (No-Print) */}
        <div className='flex items-center justify-between border-b bg-muted/30 px-6 py-3 print:hidden'>
          <span className='font-mono text-xs font-semibold text-muted-foreground'>
            Payslip Preview · {slip.name} ({slip.employee_no})
          </span>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' onClick={handlePrint}>
              <Printer className='size-4' />
              Print
            </Button>
            <Button
              size='sm'
              className='bg-[#159053] text-white hover:bg-[#117644]'
              loading={downloading}
              onClick={() => void handleDownloadPdf()}
            >
              <FileDown className='size-4' />
              Download PDF
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='size-8'
              onClick={onClose}
              aria-label='Close'
            >
              <X className='size-4' />
            </Button>
          </div>
        </div>

        {/* MODERN MINIMAL INVOICE/PAYSLIP CONTAINER (1:1 with reference image) */}
        <div className='bg-white p-8 text-[#111827] sm:p-12'>
          {/* 1. Header: PAYSLIP title + Payslip Number on left, Website / School Logo on right */}
          <div className='flex items-start justify-between'>
            <div>
              <div className='flex items-center gap-3'>
                <h1 className='text-3xl font-extrabold tracking-tight text-[#111827]'>PAYSLIP</h1>
                {slip.status === 'draft' && (
                  <span className='rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700'>
                    DRAFT
                  </span>
                )}
              </div>
              <p className='mt-1 text-xs text-[#6B7280]'>
                Payslip Number{' '}
                <span className='font-mono font-medium text-[#111827]'>{slipNumber}</span>
              </p>
            </div>

            {/* Top Right: School Logo or Default Brand Badge (Seamless fit for ANY logo shape) */}
            <div className='flex h-14 max-w-[180px] items-center justify-end'>
              {schoolLogoUrl ? (
                <img
                  src={schoolLogoUrl}
                  alt={`${schoolName} logo`}
                  className='max-h-14 max-w-[180px] object-contain object-right'
                />
              ) : (
                <div className='flex size-11 items-center justify-center rounded-full bg-[#0F4C3A] p-2.5 shadow-sm'>
                  <img
                    src='/tz-mark.svg'
                    alt='Tamilzorous Logo'
                    className='size-full object-contain brightness-0 invert'
                  />
                </div>
              )}
            </div>
          </div>

          {/* Thin Divider Line */}
          <div className='mt-6 h-px w-full bg-[#E5E7EB]' />

          {/* 2. Metadata Section (Billed by / Billed to & Dates) */}
          <div className='mt-6 grid grid-cols-2 gap-y-5 text-xs'>
            {/* Row 1, Left: Billed by (School) */}
            <div>
              <p className='text-[#6B7280]'>Billed by:</p>
              <p className='mt-1 text-sm font-bold text-[#111827]'>{schoolName}</p>
              <p className='text-[#6B7280]'>{schoolEmail}</p>
              <p className='text-[#6B7280]'>{schoolAddress}</p>
            </div>

            {/* Row 1, Right: Billed to (Employee) */}
            <div>
              <p className='text-[#6B7280]'>Billed to:</p>
              <p className='mt-1 text-sm font-bold text-[#111827]'>{slip.name}</p>
              <p className='text-[#6B7280]'>
                {slip.designation} {slip.department ? `· ${slip.department}` : ''}
              </p>
              <p className='text-[#6B7280]'>
                Employee ID: {slip.employee_no}
                {(slip as { pan_last4?: string | null }).pan_last4
                  ? ` · PAN: XXXXXX${(slip as { pan_last4?: string | null }).pan_last4}`
                  : ''}
              </p>
            </div>

            {/* Row 2, Left: Date Issue */}
            <div>
              <p className='text-[#6B7280]'>Date Issue:</p>
              <p className='mt-1 font-bold text-[#111827]'>{slip.month_label}</p>
            </div>

            {/* Row 2, Right: Due Date */}
            <div>
              <p className='text-[#6B7280]'>Due Date:</p>
              <p className='mt-1 font-bold text-[#111827]'>{dueDate}</p>
            </div>
          </div>

          {/* 3. Table Section: Invoice Items/Service */}
          <div className='mt-8'>
            <p className='text-xs font-semibold text-[#6B7280]'>Invoice Items / Service:</p>

            {/* Table Header */}
            <div className='mt-3 grid grid-cols-12 border-b border-[#E5E7EB] pb-2 text-xs font-medium text-[#6B7280]'>
              <div className='col-span-6'>Item Name</div>
              <div className='col-span-2 text-center'>QTY</div>
              <div className='col-span-2 text-center'>Tax / Type</div>
              <div className='col-span-2 text-right'>Amount</div>
            </div>

            {/* Table Rows */}
            <div className='divide-y divide-[#F3F4F6] text-xs'>
              {tableItems.map((item) => (
                <div key={item.name} className='grid grid-cols-12 items-center py-3'>
                  <div className='col-span-6 font-semibold text-[#111827]'>{item.name}</div>
                  <div className='col-span-2 text-center text-[#6B7280]'>{item.qty}</div>
                  <div className='col-span-2 text-center'>
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-medium ${
                        item.isDeduction
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {item.tax}
                    </span>
                  </div>
                  <div
                    className={`col-span-2 text-right font-mono font-medium ${
                      item.isDeduction ? 'text-rose-600' : 'text-[#111827]'
                    }`}
                  >
                    {item.isDeduction ? `- ${rupees(item.amount)}` : rupees(item.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Financial Summary (Right-aligned, matching reference image) */}
          <div className='mt-6 flex flex-col items-end text-xs'>
            <div className='w-full space-y-2 border-t border-[#E5E7EB] pt-4 sm:w-64'>
              <div className='flex justify-between text-[#6B7280]'>
                <span>Subtotal</span>
                <span className='font-mono font-medium text-[#111827]'>{rupees(slip.gross)}</span>
              </div>
              <div className='flex justify-between text-[#6B7280]'>
                <span>Discount / Deductions</span>
                <span className='font-mono font-medium text-rose-600'>
                  - {rupees(slip.total_deductions)}
                </span>
              </div>
              <div className='flex items-center justify-between border-t border-[#E5E7EB] pt-2'>
                <span className='text-sm font-bold text-[#111827]'>Grand Total</span>
                <span className='font-mono text-base font-extrabold text-[#111827]'>
                  {rupees(slip.net)}
                </span>
              </div>
            </div>
          </div>

          {/* 5. Rounded Capsule Note Box */}
          <div className='mt-8 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-xs text-[#6B7280]'>
            <p>
              <span className='font-bold text-[#111827]'>Note: </span>
              Amount in Words: <span className='italic'>{amountInWords(slip.net)}</span>. This is a
              computer generated payslip and requires no physical signature.
            </p>
          </div>

          {/* 6. Bottom Section: Payment Method on left, Stylized Signature on right */}
          <div className='mt-10 flex flex-wrap items-end justify-between gap-6 pt-4'>
            {/* Left: Payment Method */}
            <div className='space-y-0.5 text-xs'>
              <p className='font-bold text-[#111827]'>Payment Method</p>
              <p className='text-[#6B7280]'>
                {slip.bank_name ? 'EFT Bank Transfer' : 'Direct Transfer'}
              </p>
              <p className='text-[#6B7280]'>
                Account Number: {slip.bank_name || 'Canara Bank'}
                {slip.bank_account_last4 ? ` ····${slip.bank_account_last4}` : ' ····5678'}
                <span className='ml-2 font-medium text-[#111827]'>
                  (Paid Days: {slip.paid_days}/{slip.working_days})
                </span>
              </p>
            </div>

            <div className='flex items-end justify-end gap-6 text-right'>
              {schoolSealUrl && (
                <div className='flex flex-col items-center justify-center'>
                  <div className='grid h-16 w-16 place-items-center rounded-full border border-dashed border-[#059669]/40 bg-white p-1 shadow-xs'>
                    <img
                      src={schoolSealUrl}
                      alt='Official School Seal'
                      className='size-full object-contain'
                    />
                  </div>
                  <span className='mt-1 text-[10px] font-medium tracking-wider text-[#6B7280] uppercase'>
                    Official Seal
                  </span>
                </div>
              )}
              <div className='inline-block w-40 text-center sm:w-44'>
                {schoolSignatureUrl ? (
                  <div className='flex h-14 w-full items-end justify-center pb-1 sm:h-16'>
                    <img
                      src={schoolSignatureUrl}
                      alt='Authorized Signatory'
                      className='max-h-14 w-auto max-w-full object-contain mix-blend-multiply sm:max-h-16'
                    />
                  </div>
                ) : (
                  <svg
                    viewBox='0 0 120 36'
                    className='mx-auto h-9 w-28 fill-none stroke-current text-[#111827]'
                  >
                    <path
                      d='M10 24 Q 25 5, 40 22 T 65 14 Q 85 8, 105 24'
                      strokeWidth='1.6'
                      strokeLinecap='round'
                    />
                    <line x1='50' y1='10' x2='50' y2='28' strokeWidth='1.6' />
                    <path d='M42 20 Q 55 12, 68 20' strokeWidth='1.4' />
                  </svg>
                )}
                <div className='border-t border-[#111827] pt-1 text-center text-xs font-bold text-[#111827]'>
                  Authorized Signatory
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
