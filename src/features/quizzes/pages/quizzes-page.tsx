import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { CheckCircle2, Clock, FileQuestion, Plus, ShieldCheck, XCircle } from 'lucide-react'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { Button } from '@/components/ui/button'
import { QuizzesTab } from '../components/quizzes-tab'
import { CreateQuizModal } from '../components/create-quiz-modal'
import { StaffQuizPermissionsModal } from '../components/staff-quiz-permissions-modal'
import { useQuizPermissions } from '../api'
import type { QuizSearch } from '../search'

const route = getRouteApi('/_app/quizzes')

export function QuizzesPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/quizzes' })
  const queryClient = useQueryClient()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false)

  const { data: permissionsData } = useQuizPermissions()
  const canManage = permissionsData?.can_manage ?? true
  const canCreate = permissionsData?.can_create ?? true

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
        description='Create, schedule and review online tests, MCQ question banks, proctoring security rules, and student performance analytics.'
        actions={
          <div className='flex items-center gap-2'>
            {canManage && (
              <Button
                variant='outline'
                onClick={() => setPermissionsModalOpen(true)}
                className='gap-1.5'
              >
                <ShieldCheck className='h-4 w-4' />
                Staff Permissions
              </Button>
            )}
            {canCreate && (
              <Button
                variant='default'
                onClick={() => setCreateModalOpen(true)}
                className='gap-1.5'
              >
                <Plus className='h-4 w-4' />
                Create Online Test
              </Button>
            )}
          </div>
        }
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
      <QuizzesTab
        search={search}
        onSearchChange={setSearch}
        onCreateClick={() => setCreateModalOpen(true)}
      />

      <CreateQuizModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false)
          void queryClient.invalidateQueries({ queryKey: ['quizzes'] })
        }}
      />

      <StaffQuizPermissionsModal
        open={permissionsModalOpen}
        onClose={() => setPermissionsModalOpen(false)}
        onPermissionsUpdated={() => {
          void queryClient.invalidateQueries({ queryKey: ['quizzes'] })
        }}
      />
    </Page>
  )
}
