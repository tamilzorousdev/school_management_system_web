import { useState } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  BedDouble,
  BedSingle,
  ChevronDown,
  DoorOpen,
  Gavel,
  IndianRupee,
  ListChecks,
  LogOut,
  MoveRight,
  Package,
  Pencil,
  Phone,
  UserRound,
} from 'lucide-react'
import { Avatar } from '@/components/common/avatar'
import { EmptyState, ErrorState } from '@/components/common/display'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { formatDate } from '@/lib/format'
import { useAdmission, type AdmissionDetail } from '../api'
import { CheckoutSheet } from '../components/checkout-sheet'
import { CheckoutStartModal } from '../components/checkout-start-modal'
import { HostelTabs } from '../components/hostel-tabs'
import {
  BedActionModal,
  ResidentDetailsModal,
  type BedAction,
} from '../components/resident-bed-modals'
import { ResidentBelongingsTab } from '../components/resident-belongings-tab'
import { bedText } from '../components/resident-form'
import {
  ResidentConductTab,
  ResidentFeesTab,
  ResidentLeavesTab,
  ResidentOverview,
  ResidentRollTab,
} from '../components/resident-tabs'
import { ADMISSION_STATUS, DIET, studentLine } from '../labels'
import type { ResidentDetailTab } from '../search'

const route = getRouteApi('/_app/hostel/residents/$admissionId')

type Modal = 'details' | 'checkout' | null

export function ResidentPage() {
  const { admissionId } = route.useParams()
  const { tab } = route.useSearch()
  const id = Number(admissionId)
  const navigate = useNavigate()
  const me = useMe().data
  const canView = can(me, 'hostel.view')
  const admission = useAdmission(id)
  const data = admission.data

  useShortcut('app.refresh', () => void admission.refetch())

  if (me && !canView) {
    return (
      <Page>
        <PageHeader eyebrow='Hostel' title='Resident' />
        <EmptyState
          icon={BedDouble}
          title='No access to the hostel'
          description='Ask the school admin for the hostel permission.'
        />
      </Page>
    )
  }
  if (admission.isError && !data) {
    return (
      <Page>
        <BackLink />
        <ErrorState message={admission.error.message} onRetry={() => admission.refetch()} />
      </Page>
    )
  }
  if (!data) {
    return (
      <Page>
        <BackLink />
        <Skeleton className='h-40' />
        <div className='grid gap-6 lg:grid-cols-2'>
          <Skeleton className='h-64' />
          <Skeleton className='h-64' />
        </div>
      </Page>
    )
  }

  const go = (next: ResidentDetailTab) =>
    navigate({
      to: '/hostel/residents/$admissionId',
      params: { admissionId },
      search: { tab: next },
      replace: true,
    })

  return <ResidentView admission={data} tab={tab} onTab={(next) => void go(next)} />
}

function BackLink() {
  return (
    <Link
      to='/hostel/residents'
      search={{ tab: 'residents', page: 1 }}
      className='inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground'
    >
      <ArrowLeft className='size-4' />
      Residents
    </Link>
  )
}

function ResidentView({
  admission,
  tab,
  onTab,
}: {
  admission: AdmissionDetail
  tab: ResidentDetailTab
  onTab: (tab: ResidentDetailTab) => void
}) {
  const me = useMe().data
  const canAllocate = can(me, 'hostel.allocate')
  const canCheckout = can(me, 'hostel.checkout')
  const canStudents = can(me, 'students.view')
  const [modal, setModal] = useState<Modal>(null)
  const [bedAction, setBedAction] = useState<BedAction | null>(null)
  const [checkoutId, setCheckoutId] = useState<number | null>(null)
  const status = ADMISSION_STATUS[admission.status]
  const closed = admission.status === 'checking_out' || admission.status === 'checked_out'
  const bed = bedText(admission.bed)
  const guardian = admission.primary_guardian

  return (
    <Page>
      <BackLink />
      <HostelTabs active='/hostel/residents' />

      <Card className='overflow-hidden'>
        <div className='h-14 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent sm:h-16' />
        <div className='-mt-9 grid gap-4 px-4 pb-4 sm:-mt-10 sm:px-6 sm:pb-5 lg:flex lg:items-end lg:justify-between'>
          <div className='flex min-w-0 items-end gap-4'>
            <Avatar
              name={admission.student.name}
              size='lg'
              className='size-18 border-4 border-card text-xl shadow-sm sm:size-20'
            />
            <div className='grid min-w-0 gap-1 pb-1'>
              <span className='text-[11px] font-bold tracking-[0.14em] text-primary uppercase'>
                Hostel resident
              </span>
              <h1 className='truncate text-xl font-extrabold tracking-tight sm:text-2xl'>
                {admission.student.name}
              </h1>
              <div className='flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground'>
                <span className='font-mono text-xs'>{admission.admission_no}</span>
                <span>·</span>
                <span>{studentLine(admission.student)}</span>
              </div>
              <div className='flex flex-wrap gap-1.5'>
                <Badge tone={status.tone} dot>
                  {status.label}
                </Badge>
                {bed ? (
                  <Badge tone='info'>
                    <BedDouble className='size-3' />
                    {bed}
                  </Badge>
                ) : (
                  <Badge tone='warning'>No bed</Badge>
                )}
                <Badge tone='neutral'>{admission.hostel_name}</Badge>
                <Badge tone='neutral'>{DIET[admission.diet]}</Badge>
              </div>
            </div>
          </div>
          <div className='flex flex-wrap gap-2'>
            {canAllocate &&
              (admission.bed ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' disabled={closed}>
                      <BedDouble />
                      Bed
                      <ChevronDown />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => setBedAction('transfer')}>
                      <MoveRight />
                      Transfer to another bed
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setBedAction('swap')}>
                      <ArrowLeftRight />
                      Swap with a resident
                    </DropdownMenuItem>
                    <DropdownMenuItem destructive onSelect={() => setBedAction('vacate')}>
                      <BedSingle />
                      Vacate the bed
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button disabled={closed} onClick={() => setBedAction('allocate')}>
                  <BedDouble />
                  Allocate bed
                </Button>
              ))}
            {canAllocate && admission.status !== 'checked_out' && (
              <Button variant='outline' onClick={() => setModal('details')}>
                <Pencil />
                Edit details
              </Button>
            )}
            {admission.open_checkout_id ? (
              <Button variant='outline' onClick={() => setCheckoutId(admission.open_checkout_id)}>
                <DoorOpen />
                Open checkout
              </Button>
            ) : (
              canCheckout &&
              !closed && (
                <Button variant='outline' onClick={() => setModal('checkout')}>
                  <LogOut />
                  Start checkout
                </Button>
              )
            )}
            {canStudents && (
              <Button variant='ghost' asChild>
                <Link
                  to='/students/$studentId'
                  params={{ studentId: String(admission.student.id) }}
                  search={{ tab: 'profile' }}
                >
                  <UserRound />
                  Student record
                </Link>
              </Button>
            )}
          </div>
        </div>
        <div className='grid gap-3 border-t px-4 py-3 text-sm sm:grid-cols-3 sm:px-6'>
          <Contact
            label='Parent'
            name={guardian ? `${guardian.name} (${guardian.relation})` : null}
            mobile={guardian?.mobile ?? null}
          />
          <Contact
            label='Local guardian'
            name={
              admission.local_guardian_name
                ? `${admission.local_guardian_name}${admission.local_guardian_relation ? ` (${admission.local_guardian_relation})` : ''}`
                : null
            }
            mobile={admission.local_guardian_mobile}
          />
          <div className='grid gap-0.5'>
            <span className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
              Admitted
            </span>
            <span className='font-semibold'>
              {formatDate(admission.admitted_on)}
              {admission.checked_out_on ? ` · left ${formatDate(admission.checked_out_on)}` : ''}
            </span>
          </div>
        </div>
      </Card>

      {admission.status === 'checking_out' && admission.open_checkout_id && (
        <Card className='flex flex-wrap items-center justify-between gap-3 border-warning/40 bg-warning/5 p-4'>
          <div className='flex items-center gap-3'>
            <span className='grid size-10 shrink-0 place-items-center rounded-lg bg-warning/15 text-warning'>
              <DoorOpen className='size-5' />
            </span>
            <div className='grid'>
              <span className='font-semibold'>Checkout in progress</span>
              <span className='text-sm text-muted-foreground'>
                Bed changes are locked until the checkout is completed or cancelled.
              </span>
            </div>
          </div>
          <Button variant='outline' onClick={() => setCheckoutId(admission.open_checkout_id)}>
            Open checklist
            <ArrowRight />
          </Button>
        </Card>
      )}

      <PageTabs
        label='Resident sections'
        value={tab}
        onChange={onTab}
        tabs={[
          { value: 'overview', label: 'Overview', icon: BedDouble },
          { value: 'fees', label: 'Fees', icon: IndianRupee },
          { value: 'roll_call', label: 'Roll call', icon: ListChecks },
          { value: 'leaves', label: 'Leave', icon: LogOut },
          { value: 'conduct', label: 'Conduct', icon: Gavel },
          { value: 'belongings', label: 'Belongings', icon: Package },
        ]}
      />

      {tab === 'overview' && <ResidentOverview admission={admission} />}
      {tab === 'fees' && <ResidentFeesTab admission={admission} />}
      {tab === 'roll_call' && <ResidentRollTab admissionId={admission.id} />}
      {tab === 'leaves' && <ResidentLeavesTab admission={admission} />}
      {tab === 'conduct' && <ResidentConductTab admission={admission} />}
      {tab === 'belongings' && <ResidentBelongingsTab admission={admission} />}

      <BedActionModal action={bedAction} admission={admission} onClose={() => setBedAction(null)} />
      <ResidentDetailsModal
        open={modal === 'details'}
        onOpenChange={(open) => !open && setModal(null)}
        admission={admission}
      />
      <CheckoutStartModal
        open={modal === 'checkout'}
        onOpenChange={(open) => !open && setModal(null)}
        admission={admission}
        onStarted={(checkout) => setCheckoutId(checkout.id)}
      />
      <CheckoutSheet checkoutId={checkoutId} onClose={() => setCheckoutId(null)} />
    </Page>
  )
}

function Contact({
  label,
  name,
  mobile,
}: {
  label: string
  name: string | null
  mobile: string | null
}) {
  return (
    <div className='grid min-w-0 gap-0.5'>
      <span className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
        {label}
      </span>
      {name ? (
        <span className='flex flex-wrap items-center gap-x-2 font-semibold'>
          <span className='truncate'>{name}</span>
          {mobile && (
            <a
              href={`tel:+91${mobile}`}
              className='tabular inline-flex items-center gap-1 text-xs font-normal text-muted-foreground hover:text-foreground'
            >
              <Phone className='size-3' />
              +91 {mobile}
            </a>
          )}
        </span>
      ) : (
        <span className='text-muted-foreground'>—</span>
      )}
    </div>
  )
}
