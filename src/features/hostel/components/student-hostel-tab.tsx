import { Link } from '@tanstack/react-router'
import { ArrowRight, BedDouble } from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Block, Facts } from '@/features/students/components/student-parts'
import { formatDate } from '@/lib/format'
import { useStudentHostel } from '../api'
import { ADMISSION_STATUS, DIET } from '../labels'

export function StudentHostelTab({ studentId }: { studentId: number }) {
  const hostel = useStudentHostel(studentId)
  const data = hostel.data

  if (hostel.isPending) {
    return (
      <div className='grid gap-3'>
        <Skeleton className='h-32' />
        <Skeleton className='h-24' />
      </div>
    )
  }
  if (hostel.isError || !data) {
    return (
      <ErrorState message={hostel.error?.message ?? 'Not found'} onRetry={() => hostel.refetch()} />
    )
  }

  const current = data.current
  const past = data.history.filter((stay) => stay.id !== current?.id)

  if (!current && !past.length) {
    return (
      <Card>
        <EmptyState
          icon={BedDouble}
          title='Not in the hostel'
          description='Admit the student or record a hostel application from the residents page.'
          action={
            <Button variant='outline' asChild>
              <Link to='/hostel/residents' search={{ tab: 'residents', page: 1 }}>
                Open hostel residents
              </Link>
            </Button>
          }
        />
      </Card>
    )
  }

  return (
    <div className='grid gap-4'>
      {current ? (
        <Card className='grid gap-4 p-4 sm:p-5'>
          <Block
            title='Current stay'
            action={
              <Button variant='outline' size='sm' asChild>
                <Link
                  to='/hostel/residents/$admissionId'
                  params={{ admissionId: String(current.id) }}
                  search={{ tab: 'overview' }}
                >
                  Open resident
                  <ArrowRight />
                </Link>
              </Button>
            }
          >
            <Facts
              items={[
                ['Hostel', current.hostel_name],
                [
                  'Bed',
                  current.bed ? (
                    `${current.bed.room_no} / ${current.bed.bed_no} · ${current.bed.block_name}`
                  ) : (
                    <Badge tone='warning'>No bed yet</Badge>
                  ),
                ],
                [
                  'Status',
                  <Badge key='status' tone={ADMISSION_STATUS[current.status].tone} dot>
                    {ADMISSION_STATUS[current.status].label}
                  </Badge>,
                ],
                ['Admitted on', formatDate(current.admitted_on)],
                ['Hostel admission', current.admission_no],
                ['Diet', DIET[current.diet]],
                [
                  'Local guardian',
                  current.local_guardian_name
                    ? `${current.local_guardian_name}${current.local_guardian_mobile ? ` · +91 ${current.local_guardian_mobile}` : ''}`
                    : '—',
                ],
              ]}
            />
          </Block>
        </Card>
      ) : (
        <Card className='flex flex-wrap items-center justify-between gap-3 p-4'>
          <span className='text-sm text-muted-foreground'>Not staying in the hostel now.</span>
          <Button variant='outline' size='sm' asChild>
            <Link to='/hostel/residents' search={{ tab: 'residents', page: 1 }}>
              Hostel residents
            </Link>
          </Button>
        </Card>
      )}

      {past.length > 0 && (
        <Card className='grid gap-3 p-4 sm:p-5'>
          <Block title='Past stays'>
            <ul className='grid overflow-hidden rounded-lg border'>
              {past.map((stay) => (
                <li key={stay.id}>
                  <Link
                    to='/hostel/residents/$admissionId'
                    params={{ admissionId: String(stay.id) }}
                    search={{ tab: 'overview' }}
                    className='grid gap-1 border-b px-3 py-2.5 text-sm transition-colors last:border-0 hover:bg-muted sm:grid-cols-[1fr_auto] sm:items-center sm:gap-3'
                  >
                    <div className='grid gap-0.5'>
                      <span className='font-semibold'>{stay.hostel_name}</span>
                      <span className='text-xs text-muted-foreground'>
                        <span className='font-mono'>{stay.admission_no}</span> ·{' '}
                        {formatDate(stay.admitted_on)} to{' '}
                        {stay.checked_out_on ? formatDate(stay.checked_out_on) : 'now'}
                      </span>
                    </div>
                    <Badge tone={ADMISSION_STATUS[stay.status].tone} dot className='w-fit'>
                      {ADMISSION_STATUS[stay.status].label}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </Block>
        </Card>
      )}
    </div>
  )
}
