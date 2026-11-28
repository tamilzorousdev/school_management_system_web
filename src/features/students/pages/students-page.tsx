import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { ArrowUpCircle, CircleOff, FileSpreadsheet, UserRoundX } from 'lucide-react'
import { ChevronDownIcon, EyeIcon, GraduationCapIcon, IdCardInfoIcon, ListIcon, PlusIcon, SparklesIcon, UsersIcon } from '@/components/common/icon'
import { Avatar } from '@/components/common/avatar'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
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
import { can, useMe } from '@/features/auth/api'
import { useClasses, useSections } from '@/features/setup/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { openFile } from '@/lib/files'
import {
  studentsApi,
  useStudentInsights,
  useStudentMutation,
  useStudents,
  type StudentListItem,
} from '../api'
import { ImportWizard } from '../components/import-wizard'
import { PromotionModal } from '../components/promotion-modal'
import { StudentFormModal } from '../components/student-form-modal'
import { GENDER_LABELS, RELATION_LABELS, classSection, toOptions, yearsLabel } from '../labels'
import { studentFiles } from '../records-api'
import type { StudentsSearch } from '../search'

const route = getRouteApi('/_app/students')
const LIMIT = 20

export function StudentsPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/students' })
  const goTo = useNavigate()
  const me = useMe().data
  const canManage = can(me, 'students.manage')
  const [adding, setAdding] = useState(false)
  const [numbering, setNumbering] = useState(false)
  const [tool, setTool] = useState<'import' | 'promote' | null>(null)
  const [printing, setPrinting] = useState(false)

  const students = useStudents({ ...search, limit: LIMIT })
  const insights = useStudentInsights()
  const classes = useClasses()
  const sections = useSections(search.class_id, Boolean(search.class_id))
  const rollNumbers = useStudentMutation((sectionId: number) =>
    studentsApi.rollNumbers(sectionId, 'name')
  )
  const rows = students.data?.items ?? []

  const setSearch = (patch: Partial<StudentsSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })
  const openStudent = (id: number) =>
    goTo({
      to: '/students/$studentId',
      params: { studentId: String(id) },
      search: { tab: 'profile' },
    })
  const printCards = async () => {
    setPrinting(true)
    try {
      if (search.section_id || search.class_id) {
        await openFile(studentFiles.idCards, {
          class_id: search.section_id ? undefined : search.class_id,
          section_id: search.section_id,
        })
      } else {
        alerts.error('Choose a class or a section to print')
      }
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setPrinting(false)
    }
  }
  const toggle = (key: 'no_section' | 'has_siblings' | 'new_this_month') =>
    setSearch({
      no_section: undefined,
      has_siblings: undefined,
      new_this_month: undefined,
      [key]: search[key] ? undefined : true,
    })

  useShortcut('app.refresh', () => {
    void students.refetch()
    void insights.refetch()
  })

  const data = insights.data
  const cards: Insight[] = [
    {
      key: 'total',
      label: 'Students',
      value: data?.total ?? 0,
      hint: `${data?.boys ?? 0} boys · ${data?.girls ?? 0} girls`,
      icon: GraduationCapIcon,
      tone: 'primary',
      active: !search.no_section && !search.has_siblings && !search.new_this_month,
      onClick: () =>
        setSearch({ no_section: undefined, has_siblings: undefined, new_this_month: undefined }),
    },
    {
      key: 'new',
      label: 'Joined this month',
      value: data?.new_this_month ?? 0,
      hint: 'New admissions',
      icon: SparklesIcon,
      tone: 'success',
      active: Boolean(search.new_this_month),
      onClick: () => toggle('new_this_month'),
    },
    {
      key: 'no-section',
      label: 'Not in a section',
      value: data?.without_section ?? 0,
      hint: 'Place them before attendance starts',
      icon: UserRoundX,
      tone: 'warning',
      active: Boolean(search.no_section),
      onClick: () => toggle('no_section'),
    },
    {
      key: 'siblings',
      label: 'With siblings here',
      value: data?.with_siblings ?? 0,
      hint: 'Brothers and sisters share parents',
      icon: UsersIcon,
      tone: 'info',
      active: Boolean(search.has_siblings),
      onClick: () => toggle('has_siblings'),
    },
  ]

  const columns: Column<StudentListItem>[] = [
    {
      key: 'name',
      header: 'STUDENT',
      sortKey: 'name',
      cell: (student) => (
        <div className='flex items-center gap-3'>
          <Avatar
            name={student.full_name}
            src={student.photo_url}
            previewable
            subtitle={student.admission_no ? `Admission No: ${student.admission_no}` : undefined}
          />
          <div className='grid min-w-0'>
            <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
              {student.full_name}
            </span>
            <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400 font-mono'>
              {student.admission_no}
              {student.emis_number ? ` · EMIS ${student.emis_number}` : ''}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'class',
      header: 'CLASS',
      sortKey: 'class',
      cell: (student) =>
        student.class ? (
          <div className='grid'>
            <span className='text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
              {classSection(student.class.name, student.section?.name)}
            </span>
            <span className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
              {student.roll_no ? `Roll ${student.roll_no}` : 'No roll number'}
            </span>
          </div>
        ) : (
          <span className='inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11.5px] font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'>
            Not placed
          </span>
        ),
    },
    {
      key: 'roll',
      header: 'ROLL',
      sortKey: 'roll_no',
      hideBelow: 'xl',
      cell: (student) => (
        <span className='tabular text-[13px] leading-[18px] font-semibold text-slate-700 dark:text-slate-300'>
          {student.roll_no ?? '—'}
        </span>
      ),
    },
    {
      key: 'parent',
      header: 'PARENT',
      cell: (student) => {
        const main = student.guardians[0]
        return main ? (
          <div className='grid'>
            <span className='text-[13px] leading-[18px] font-medium text-slate-800 dark:text-slate-200'>
              {main.name}{' '}
              <span className='text-[11.5px] text-slate-400 dark:text-slate-500'>
                ({RELATION_LABELS[main.relation]})
              </span>
            </span>
            <span className='tabular text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
              +91 {main.mobile}
            </span>
          </div>
        ) : (
          <span className='text-slate-400'>—</span>
        )
      },
    },
    {
      key: 'years',
      header: 'IN SCHOOL',
      sortKey: 'admission_date',
      hideBelow: 'lg',
      cell: (student) => (
        <div className='grid'>
          <span className='text-[13px] leading-[18px] font-medium text-slate-800 dark:text-slate-200'>
            {yearsLabel(student.years_in_school)}
          </span>
          <span className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            {GENDER_LABELS[student.gender]} · {student.age} yrs
          </span>
        </div>
      ),
    },
    {
      key: 'siblings',
      header: 'SIBLINGS',
      hideBelow: 'lg',
      cell: (student) =>
        student.sibling_count ? (
          <span className='inline-flex items-center rounded-full bg-[#EAF7F0] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#127D48] dark:bg-emerald-950/60 dark:text-emerald-300'>
            {student.sibling_count}
          </span>
        ) : (
          <span className='text-slate-400'>—</span>
        ),
    },
    {
      key: 'action',
      header: 'ACTION',
      align: 'right' as const,
      cell: (student: StudentListItem) => (
        <Button
          variant='outline'
          size='icon-sm'
          aria-label={`View ${student.full_name}`}
          title='View profile'
          className='border-[#EDF0EE] bg-white text-[#3C4440] hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
          onClick={(event) => {
            event.stopPropagation()
            openStudent(student.id)
          }}
        >
          <EyeIcon className='size-4 stroke-[1.75]' />
        </Button>
      ),
    },
  ]

  const filtered = Boolean(
    search.search ||
    search.class_id ||
    search.section_id ||
    search.gender ||
    search.no_section ||
    search.has_siblings ||
    search.new_this_month
  )
  const selectedSection = sections.data?.find((section) => section.id === search.section_id)

  return (
    <Page>
      <PageHeader
        eyebrow='People'
        title='Students'
        description='Every student this academic year with their class, roll number and parents. Open a student for documents, health and behaviour.'
        actions={
          <>
            {search.class_id && (
              <Button
                variant='secondary'
                size='sm'
                loading={printing}
                onClick={() => void printCards()}
              >
                <IdCardInfoIcon className='size-4' />
                Print ID cards
              </Button>
            )}
            {canManage && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='secondary' size='sm'>
                      Bulk actions
                      <ChevronDownIcon className='size-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => setTool('import')}>
                      <FileSpreadsheet />
                      Import from Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setTool('promote')}>
                      <ArrowUpCircle />
                      Promote to next year
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {selectedSection && (
                  <Button variant='secondary' size='sm' onClick={() => setNumbering(true)}>
                    <ListIcon className='size-4' />
                    Number {classSection(selectedSection.class_name, selectedSection.name)}
                  </Button>
                )}
                <Button variant='primary' size='sm' onClick={() => setAdding(true)}>
                  <PlusIcon className='size-4' />
                  Add student
                </Button>
              </>
            )}
          </>
        }
      />

      <InsightCards items={cards} loading={insights.isPending} />

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={students.data ? `${students.data.total} students` : ''}
          onClear={filtered ? () => navigate({ search: { page: 1 }, replace: true }) : undefined}
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Name, admission no. or parent mobile'
            label='Search students'
          />
          <FilterSelect
            id='class-filter'
            label='Filter by class'
            allLabel='All classes'
            value={search.class_id ? String(search.class_id) : undefined}
            options={(classes.data ?? []).map((item) => ({
              value: String(item.id),
              label: `Class ${item.name}`,
              hint: String(item.student_count),
            }))}
            onChange={(value) =>
              setSearch({ class_id: value ? Number(value) : undefined, section_id: undefined })
            }
          />
          {search.class_id && (
            <FilterSelect
              id='section-filter'
              label='Filter by section'
              allLabel='All sections'
              value={search.section_id ? String(search.section_id) : undefined}
              options={(sections.data ?? []).map((item) => ({
                value: String(item.id),
                label: `Section ${item.name}`,
                hint: String(item.student_count),
              }))}
              onChange={(value) => setSearch({ section_id: value ? Number(value) : undefined })}
            />
          )}
          <FilterSelect
            id='gender-filter'
            label='Filter by gender'
            allLabel='Boys and girls'
            value={search.gender}
            options={toOptions(GENDER_LABELS)}
            onChange={(value) => setSearch({ gender: value as StudentsSearch['gender'] })}
          />
        </ListToolbar>

        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(student) => student.id}
          loading={students.isFetching}
          error={students.isError ? students.error.message : null}
          onRetry={() => students.refetch()}
          onRowClick={(student) => openStudent(student.id)}
          sort={{ sort: search.sort, order: search.order ?? 'asc' }}
          onSortChange={(next) => setSearch(next as Partial<StudentsSearch>)}
          empty={{
            icon: filtered ? CircleOff : GraduationCapIcon,
            title: filtered ? 'No students match these filters' : 'No students yet',
            description: filtered
              ? 'Try another name, class or parent mobile, or clear the filters.'
              : 'Enrol students from Admissions, or add existing students here.',
            action: !filtered && canManage && (
              <Button variant='primary' size='sm' onClick={() => setAdding(true)}>
                <PlusIcon className='size-4' />
                Add student
              </Button>
            ),
          }}
          card={(student) => (
            <div className='flex items-start gap-3 p-2.5'>
              <Avatar
                name={student.full_name}
                src={student.photo_url}
                previewable
                subtitle={
                  student.admission_no ? `Admission No: ${student.admission_no}` : undefined
                }
              />
              <div className='grid min-w-0 flex-1 gap-1'>
                <div className='flex items-start justify-between gap-2'>
                  <span className='truncate font-bold'>{student.full_name}</span>
                  {student.class ? (
                    <Badge tone='neutral'>
                      {classSection(student.class.name, student.section?.name)}
                    </Badge>
                  ) : (
                    <Badge tone='warning'>Not placed</Badge>
                  )}
                </div>
                <span className='font-mono text-xs text-muted-foreground'>
                  {student.admission_no}
                  {student.emis_number ? ` · EMIS ${student.emis_number}` : ''}
                  {student.roll_no ? ` · Roll ${student.roll_no}` : ''}
                </span>
                {student.guardians[0] && (
                  <span className='text-xs text-muted-foreground'>
                    {student.guardians[0].name} · +91 {student.guardians[0].mobile}
                  </span>
                )}
              </div>
              <Button
                variant='outline'
                size='icon-sm'
                aria-label={`View ${student.full_name}`}
                title='View profile'
                className='shrink-0 border-[#EDF0EE] bg-white text-[#3C4440] hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                onClick={(event) => {
                  event.stopPropagation()
                  openStudent(student.id)
                }}
              >
                <EyeIcon className='size-4 stroke-[1.75]' />
              </Button>
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: students.data?.total ?? 0,
            label: 'students',
            onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
          }}
        />
      </Card>

      <StudentFormModal
        open={adding}
        onOpenChange={setAdding}
        onCreated={(id) => openStudent(id)}
      />
      {tool === 'import' && <ImportWizard onClose={() => setTool(null)} />}
      {tool === 'promote' && <PromotionModal onClose={() => setTool(null)} />}
      <ConfirmDialog
        open={numbering}
        onOpenChange={setNumbering}
        title={`Renumber ${selectedSection ? classSection(selectedSection.class_name, selectedSection.name) : ''}?`}
        description='Every student in this section gets a new roll number 1, 2, 3… in alphabetical order. Existing roll numbers are replaced.'
        confirmText='Renumber'
        loading={rollNumbers.isPending}
        onConfirm={async () => {
          if (!selectedSection) return
          try {
            const result = await rollNumbers.mutateAsync(selectedSection.id)
            alerts.success(`${result.assigned} roll numbers assigned`)
            setSearch({ sort: 'roll_no', order: 'asc' })
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
          setNumbering(false)
        }}
      />
    </Page>
  )
}
