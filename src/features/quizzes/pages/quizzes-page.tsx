import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { CheckCircle2, Clock, FileQuestion, XCircle } from 'lucide-react'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { QuizzesTab } from '../components/quizzes-tab'
import type { QuizSearch } from '../search'

const route = getRouteApi('/_app/quizzes')

export function QuizzesPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/quizzes' })

  const setSearch = (patch: Partial<QuizSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })

  const handleTabChange = (tabVal: string) => {
    const statusMap: Record<string, string | undefined> = {
      all: undefined,
      pending: 'pending_approval',
      approved: 'approved',
      rejected: 'rejected',
    }
    setSearch({
      tab: tabVal as QuizSearch['tab'],
      status: statusMap[tabVal],
      page: 1,
    })
  }

  return (
    <Page>
      <PageHeader
        eyebrow='Academics'
        title='Online Tests & Quizzes'
        description='Review subject teacher quiz submissions, question banks, scheduled exam windows, and student performance analytics.'
      />
      <PageTabs
        label='Quiz tabs'
        value={search.tab ?? 'all'}
        onChange={handleTabChange}
        tabs={[
          { value: 'all', label: 'All Quizzes', icon: FileQuestion },
          { value: 'pending', label: 'Pending Approval', icon: Clock },
          { value: 'approved', label: 'Approved & Scheduled', icon: CheckCircle2 },
          { value: 'rejected', label: 'Rejected', icon: XCircle },
        ]}
      />
      <QuizzesTab search={search} onSearchChange={setSearch} />
    </Page>
  )
}
