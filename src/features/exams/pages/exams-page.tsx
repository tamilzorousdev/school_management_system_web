import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { Building2, ClipboardCheck, ClipboardList, Sliders, Trophy } from 'lucide-react'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { can, useMe } from '@/features/auth/api'
import { ExamsTab } from '../components/exams-tab'
import { GradingTab } from '../components/grading-tab'
import { HallsTab } from '../components/halls-tab'
import { MarksTab } from '../components/marks-tab'
import { ResultsTab } from '../components/results-tab'
import type { ExamsSearch, ExamTab } from '../search'

const route = getRouteApi('/_app/exams')

export function ExamsPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/exams' })
  const canManage = can(useMe().data, 'exams.manage')

  const setSearch = (patch: Partial<ExamsSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })
  const open = (tab: ExamTab, examId?: number) =>
    setSearch({
      tab,
      exam_id: examId ?? search.exam_id,
      section_id: undefined,
      subject_id: undefined,
      result: undefined,
    })

  return (
    <Page>
      <PageHeader
        eyebrow='Academics'
        title='Exams'
        description='Exams for each class, student marks by section and subject, ranked results with grades, hall seating allocation and grading scales.'
      />
      <PageTabs
        label='Exam sections'
        value={search.tab}
        onChange={(tab: ExamTab) => open(tab)}
        tabs={[
          { value: 'exams', label: 'Exams', icon: ClipboardCheck },
          { value: 'marks', label: 'Student Marks', icon: ClipboardList },
          { value: 'results', label: 'Results', icon: Trophy },
          { value: 'halls', label: 'Halls & Seating', icon: Building2 },
          { value: 'grading', label: 'Grading Scales', icon: Sliders },
        ]}
      />
      {search.tab === 'exams' && (
        <ExamsTab
          search={search}
          canManage={canManage}
          onSearchChange={(patch) => setSearch({ page: undefined, ...patch })}
          onPageChange={(page) => setSearch({ page })}
          onOpen={open}
        />
      )}
      {search.tab === 'marks' && (
        <MarksTab
          examId={search.exam_id}
          sectionId={search.section_id}
          subjectId={search.subject_id}
          canManage={canManage}
          onChange={setSearch}
        />
      )}
      {search.tab === 'results' && (
        <ResultsTab
          examId={search.exam_id}
          sectionId={search.section_id}
          result={search.result}
          canManage={canManage}
          onChange={setSearch}
        />
      )}
      {search.tab === 'halls' && (
        <HallsTab
          canManage={canManage}
          examId={search.exam_id}
          onExamChange={(id) => setSearch({ exam_id: id })}
        />
      )}
      {search.tab === 'grading' && <GradingTab canManage={canManage} />}
    </Page>
  )
}
