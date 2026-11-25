import { useEffect } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { Building2, Layers, School, SearchX } from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/common/display'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ApiError } from '@/lib/api/errors'
import {
  useClassSections,
  useOfficeMe,
  useOfficeWings,
  useWingClasses,
  type SectionStudent,
} from '../api'
import { ClassCardView, SectionCardView, WingCardView } from '../components/drill-cards'
import { SectionStudents } from '../components/section-students'
import {
  Breadcrumbs,
  CardGrid,
  CardGridSkeleton,
  WingBanner,
  type Crumb,
} from '../components/shared'
import { className } from '../labels'
import type { OfficeSearch } from '../search'

const route = getRouteApi('/_app/office')

const CLEAR_LIST = {
  page: 1,
  search: undefined,
  filter: undefined,
  sort: undefined,
  order: undefined,
} as const

export function OfficeClassesPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/office' })
  const me = useOfficeMe()
  const wings = useOfficeWings()
  const wingClasses = useWingClasses(search.class ? undefined : search.wing)
  const classSections = useClassSections(search.class)

  const go = (patch: Partial<OfficeSearch>) => navigate({ search: { ...CLEAR_LIST, ...patch } })
  const setList = (patch: Partial<OfficeSearch>) =>
    navigate({
      search: (prev) => ({ ...prev, page: 1, ...patch }),
      replace: true,
    })

  const onlyWing =
    me.data?.is_limited && me.data.wings.length === 1 ? me.data.wings[0].id : undefined
  useEffect(() => {
    if (onlyWing && !search.wing && !search.class && !search.section)
      void navigate({ search: { ...CLEAR_LIST, wing: onlyWing }, replace: true })
  }, [onlyWing, search.wing, search.class, search.section, navigate])

  useShortcut('app.refresh', () => {
    void wings.refetch()
    if (search.wing) void wingClasses.refetch()
    if (search.class) void classSections.refetch()
  })

  const wingName =
    classSections.data?.wing?.name ??
    wingClasses.data?.wing.name ??
    wings.data?.wings.find((wing) => wing.id === search.wing)?.name
  const wingId = classSections.data?.wing?.id ?? search.wing
  const classData = classSections.data
  const section = classData?.sections.find((item) => item.id === search.section)

  const crumbs: Crumb[] = [{ label: 'Wings', onClick: () => go({}) }]
  if (wingId && wingName) crumbs.push({ label: wingName, onClick: () => go({ wing: wingId }) })
  if (search.class && classData)
    crumbs.push({
      label: className(classData.class.name),
      onClick: () => go({ wing: wingId, class: search.class }),
    })
  if (search.section) crumbs.push({ label: section?.class_section ?? 'Section' })

  const openStudent = (student: SectionStudent) =>
    navigate({
      to: '/office/students/$studentId',
      params: { studentId: String(student.id) },
      search: { tab: 'overview' },
    })

  return (
    <Page>
      <PageHeader
        eyebrow='Office'
        title='Classes & students'
        description='Walk down from a wing to a class, a section and a student. Today’s attendance, fees, gate passes and exam results at every level.'
      />
      {me.data?.is_limited && <WingBanner wings={me.data.wings.map((wing) => wing.name)} />}
      <Breadcrumbs items={crumbs} />
      {search.section && search.class ? (
        <SectionStudents
          sectionId={search.section}
          search={search}
          onSearch={setList}
          onOpen={openStudent}
        />
      ) : search.class ? (
        <ClassLevel
          query={classSections}
          onOpen={(id) => go({ wing: wingId, class: search.class, section: id })}
          onBack={() => go({})}
        />
      ) : search.wing ? (
        <WingLevel
          query={wingClasses}
          onOpen={(id) => go({ wing: search.wing, class: id })}
          onBack={() => go({})}
        />
      ) : (
        <WingsLevel query={wings} onOpen={(id) => go({ wing: id })} />
      )}
    </Page>
  )
}

function WingsLevel({
  query,
  onOpen,
}: {
  query: ReturnType<typeof useOfficeWings>
  onOpen: (id: number) => void
}) {
  if (query.isPending) return <CardGridSkeleton count={4} />
  if (query.isError)
    return <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
  const { wings, unassigned_classes } = query.data
  return (
    <div className='grid gap-4'>
      {wings.length ? (
        <CardGrid>
          {wings.map((wing) => (
            <WingCardView key={wing.id} wing={wing} onOpen={() => onOpen(wing.id)} />
          ))}
        </CardGrid>
      ) : (
        <EmptyState
          icon={Building2}
          title='No wings yet'
          description='Set up wings under Wings & AOs to group classes and give each wing its AO.'
        />
      )}
      {unassigned_classes.length > 0 && (
        <div className='flex flex-wrap items-center gap-1.5 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm'>
          <span className='font-semibold text-warning'>Classes in no wing:</span>
          {unassigned_classes.map((item) => (
            <Badge key={item.id} tone='warning'>
              {className(item.name)}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

function WingLevel({
  query,
  onOpen,
  onBack,
}: {
  query: ReturnType<typeof useWingClasses>
  onOpen: (id: number) => void
  onBack: () => void
}) {
  if (query.isPending) return <CardGridSkeleton />
  if (query.isError && query.error.status === 404)
    return <NotInView error={query.error} onBack={onBack} />
  if (query.isError)
    return <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
  if (!query.data.classes.length)
    return <EmptyState icon={School} title='No classes in this wing' />
  return (
    <CardGrid>
      {query.data.classes.map((item) => (
        <ClassCardView key={item.id} item={item} onOpen={() => onOpen(item.id)} />
      ))}
    </CardGrid>
  )
}

function ClassLevel({
  query,
  onOpen,
  onBack,
}: {
  query: ReturnType<typeof useClassSections>
  onOpen: (id: number) => void
  onBack: () => void
}) {
  if (query.isPending) return <CardGridSkeleton count={3} />
  if (query.isError && query.error.status === 404)
    return <NotInView error={query.error} onBack={onBack} />
  if (query.isError)
    return <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
  if (!query.data.sections.length)
    return <EmptyState icon={Layers} title='No sections in this class' />
  return (
    <CardGrid>
      {query.data.sections.map((item) => (
        <SectionCardView key={item.id} item={item} onOpen={() => onOpen(item.id)} />
      ))}
    </CardGrid>
  )
}

function NotInView({ error, onBack }: { error: ApiError; onBack: () => void }) {
  return (
    <EmptyState
      icon={SearchX}
      title='Not in your view'
      description={error.message}
      action={
        <Button variant='outline' onClick={onBack}>
          Back to wings
        </Button>
      }
    />
  )
}
