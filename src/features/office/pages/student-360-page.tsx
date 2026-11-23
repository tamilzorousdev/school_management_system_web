import { useState } from 'react'
import { Link, getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  Bus,
  ExternalLink,
  FileText,
  GraduationCap,
  HeartPulse,
  History,
  LayoutGrid,
  Phone,
  SearchX,
} from 'lucide-react'
import { Avatar } from '@/components/common/avatar'
import { EmptyState, ErrorState } from '@/components/common/display'
import { Page } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { openFile } from '@/lib/files'
import { formatDate } from '@/lib/format'
import { useStudent360, type Student360 } from '../api'
import { Breadcrumbs, Chips, type Crumb } from '../components/shared'
import {
  DocumentsTab,
  ExamsTab,
  HealthTab,
  OverviewTab,
  TimelineTab,
  type PrintKey,
} from '../components/student-tabs'
import { flagTone } from '../labels'
import type { StudentTab } from '../search'

const route = getRouteApi('/_app/office/students/$studentId')

const TABS = [
  { value: 'overview' as const, label: 'Overview', icon: LayoutGrid },
  { value: 'timeline' as const, label: 'Timeline', icon: History },
  { value: 'exams' as const, label: 'Exams & rank card', icon: GraduationCap },
  { value: 'documents' as const, label: 'Documents', icon: FileText },
  { value: 'health' as const, label: 'Health', icon: HeartPulse },
]

export function Student360Page() {
  const { studentId } = route.useParams()
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/office/students/$studentId' })
  const id = Number(studentId)
  const student = useStudent360(id)
  const me = useMe().data
  const [printing, setPrinting] = useState<PrintKey | null>(null)

  useShortcut('app.refresh', () => void student.refetch())

  const toOffice = (patch: { wing?: number; class?: number; section?: number }) =>
    navigate({ to: '/office', search: { page: 1, ...patch } })

  const data = student.data
  const current = data?.current
  const crumbs: Crumb[] = [{ label: 'Wings', onClick: () => toOffice({}) }]
  if (current?.wing) {
    const wing = current.wing
    crumbs.push({ label: wing.name, onClick: () => toOffice({ wing: wing.id }) })
  }
  if (current) {
    const [classPart] = current.class_section.split(' - ')
    crumbs.push({
      label: /^\d+$/.test(classPart) ? `Class ${classPart}` : classPart,
      onClick: () => toOffice({ wing: current.wing?.id, class: current.class_id }),
    })
    crumbs.push({
      label: current.class_section,
      onClick: () =>
        toOffice({ wing: current.wing?.id, class: current.class_id, section: current.section_id }),
    })
  }
  crumbs.push({ label: data?.student.name ?? 'Student' })

  const print = async (key: PrintKey) => {
    if (!data?.report_card_pdf_path || printing !== null) return
    setPrinting(key)
    try {
      await openFile(
        data.report_card_pdf_path.replace(/^\/api\/v\d+/, ''),
        key === 'year' ? undefined : { exam_id: key }
      )
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setPrinting(null)
    }
  }

  if (student.isPending)
    return (
      <Page>
        <Skeleton className='h-5 w-72' />
        <Skeleton className='h-40 rounded-xl' />
        <Skeleton className='h-64 rounded-xl' />
      </Page>
    )

  if (student.isError)
    return (
      <Page>
        <Breadcrumbs items={crumbs} />
        <Card>
          {student.error.status === 404 ? (
            <EmptyState
              icon={SearchX}
              title='Student not found'
              description={student.error.message}
              action={
                <Button variant='outline' onClick={() => toOffice({})}>
                  Back to wings
                </Button>
              }
            />
          ) : (
            <ErrorState message={student.error.message} onRetry={() => student.refetch()} />
          )}
        </Card>
      </Page>
    )

  return (
    <Page>
      <Breadcrumbs items={crumbs} />
      <StudentHeader data={student.data} canOpenProfile={can(me, 'students.view')} />
      <PageTabs<StudentTab>
        label='Student sections'
        tabs={TABS.map((tab) =>
          tab.value === 'documents' ? { ...tab, count: student.data.counts.documents } : tab
        )}
        value={search.tab}
        onChange={(tab) => navigate({ search: (prev) => ({ ...prev, tab }), replace: true })}
      />
      {search.tab === 'overview' && <OverviewTab data={student.data} />}
      {search.tab === 'timeline' && (
        <TimelineTab
          studentId={id}
          type={search.type}
          onType={(type) => navigate({ search: (prev) => ({ ...prev, type }), replace: true })}
        />
      )}
      {search.tab === 'exams' && (
        <ExamsTab data={student.data} onPrint={print} printing={printing} />
      )}
      {search.tab === 'documents' && <DocumentsTab studentId={id} />}
      {search.tab === 'health' && <HealthTab data={student.data} />}
    </Page>
  )
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='grid min-w-0 gap-0.5'>
      <span className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
        {label}
      </span>
      <span className='truncate text-sm font-semibold'>{value}</span>
    </div>
  )
}

function StudentHeader({ data, canOpenProfile }: { data: Student360; canOpenProfile: boolean }) {
  const { student, current, transport } = data
  return (
    <Card className='grid gap-4 p-4 sm:p-5'>
      <div className='flex flex-wrap items-start gap-4'>
        <Avatar name={student.name} src={student.photo_url} size='lg' previewable />
        <div className='grid min-w-0 flex-1 gap-1'>
          <h1 className='text-xl font-extrabold tracking-tight break-words'>{student.name}</h1>
          <span className='text-sm text-muted-foreground'>
            {student.admission_no}
            {current && ` · ${current.class_section}`}
            {current?.roll_no !== null &&
              current?.roll_no !== undefined &&
              ` · Roll ${current.roll_no}`}
          </span>
          <Chips
            items={data.flags.map((flag) => ({
              key: flag.code,
              label: flag.label,
              tone: flagTone(flag.code),
            }))}
          />
        </div>
        {canOpenProfile && (
          <Button variant='outline' size='sm' asChild>
            <Link
              to='/students/$studentId'
              params={{ studentId: String(student.id) }}
              search={{ tab: 'profile' }}
            >
              <ExternalLink />
              Open full profile
            </Link>
          </Button>
        )}
      </div>
      <div className='grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-5'>
        <Fact label='Date of birth' value={formatDate(student.dob)} />
        <Fact label='Blood group' value={student.blood_group ?? '—'} />
        <Fact label='Wing' value={current?.wing?.name ?? '—'} />
        <Fact label='Class teacher' value={current?.class_teacher?.name ?? '—'} />
        <Fact label='Year' value={current?.academic_year ?? '—'} />
      </div>
      <div className='grid gap-3 border-t pt-4 md:grid-cols-2'>
        <div className='grid gap-1.5'>
          <span className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
            Guardians
          </span>
          {data.guardians.length ? (
            <ul className='grid gap-1'>
              {data.guardians.map((guardian) => (
                <li key={guardian.id} className='flex flex-wrap items-center gap-x-2 text-sm'>
                  <span className='font-semibold'>{guardian.name}</span>
                  {guardian.relation && (
                    <span className='text-muted-foreground capitalize'>{guardian.relation}</span>
                  )}
                  {guardian.is_primary && <Badge tone='info'>Primary</Badge>}
                  {guardian.mobile && (
                    <a
                      href={`tel:${guardian.mobile}`}
                      className='tabular inline-flex items-center gap-1 text-primary hover:underline'
                    >
                      <Phone className='size-3.5' />
                      {guardian.mobile}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <span className='text-sm text-muted-foreground'>No guardian linked</span>
          )}
        </div>
        <div className='grid content-start gap-1.5'>
          <span className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
            Transport
          </span>
          {transport ? (
            <div className='flex min-w-0 items-start gap-2 text-sm'>
              <Bus className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
              <div className='grid min-w-0'>
                <span className='font-semibold break-words'>{transport.route}</span>
                <span className='text-muted-foreground'>
                  {transport.stop ?? 'No stop set'}
                  {transport.pass_status && (
                    <Badge
                      className='ml-2'
                      tone={transport.pass_status === 'active' ? 'success' : 'warning'}
                    >
                      Pass {transport.pass_status.replace(/_/g, ' ')}
                    </Badge>
                  )}
                </span>
              </div>
            </div>
          ) : (
            <span className='text-sm text-muted-foreground'>Does not use the school bus</span>
          )}
        </div>
      </div>
    </Card>
  )
}
