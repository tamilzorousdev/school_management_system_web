import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Building2, CircleOff, Eye, PenLine, Plus } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { DataTable, type Column } from '@/components/common/data-table'
import { FormField } from '@/components/common/form-field'
import { ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { RootError } from '@/features/setup/components/setup-shared'
import { fieldErrorsOf } from '@/features/setup/form-actions'
import { alerts } from '@/lib/alerts'
import { schoolContext, useSelectedSchool } from '@/lib/auth/school-context'
import { useSaveSchool, useSchools, type School, type SchoolInput } from '../api'

const LIMIT = 20
const BOARDS = [
  { value: 'CBSE', label: 'CBSE' },
  { value: 'STATE', label: 'State board' },
  { value: 'ICSE', label: 'ICSE' },
  { value: 'OTHER', label: 'Other' },
]

export function SchoolsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const selected = useSelectedSchool()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<School | 'new' | null>(null)
  const schools = useSchools({ page, limit: LIMIT, search: search || undefined })
  const rows = schools.data?.items ?? []

  const workOn = (school: School) => {
    schoolContext.set(school.id)
    void queryClient.invalidateQueries()
    alerts.success(`Now working on ${school.name}`)
    void navigate({ to: '/setup', search: { tab: 'classes' } })
  }

  const columns: Column<School>[] = [
    {
      key: 'name',
      header: 'SCHOOL',
      cell: (school) => (
        <div className='flex items-center gap-3'>
          <span className='grid size-9 shrink-0 place-items-center rounded-lg bg-[#EAF7F0] font-mono text-[11.5px] font-bold text-[#127D48] dark:bg-emerald-950/60 dark:text-emerald-300'>
            {school.code.slice(0, 4)}
          </span>
          <div className='grid min-w-0'>
            <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
              {school.name}
            </span>
            <span className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
              {[school.city, school.board].filter(Boolean).join(' · ') || '—'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'students',
      header: 'STUDENTS',
      cell: (school) => (
        <span className='tabular text-[13px] leading-[18px] font-semibold text-slate-700 dark:text-slate-300'>
          {school.student_count}
        </span>
      ),
    },
    {
      key: 'users',
      header: 'USERS',
      hideBelow: 'lg',
      cell: (school) => (
        <span className='tabular text-[13px] leading-[18px] text-slate-600 dark:text-slate-400'>
          {school.user_count}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      cell: (school) => (
        <span className='flex flex-wrap items-center gap-1.5'>
          <Badge tone={school.is_active ? 'success' : 'neutral'} dot>
            {school.is_active ? 'Active' : 'Switched off'}
          </Badge>
          {school.id === selected && <Badge tone='info'>Working on</Badge>}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'ACTION',
      align: 'right',
      cell: (school) => (
        <div className='flex items-center justify-end gap-1.5'>
          <Button
            size='icon-sm'
            variant='outline'
            aria-label={`Edit ${school.name}`}
            title='Edit school'
            className='border-[#EDF0EE] bg-white text-[#3C4440] hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            onClick={(event) => {
              event.stopPropagation()
              setEditing(school)
            }}
          >
            <PenLine className='size-4 stroke-[1.75]' />
          </Button>
          <Button
            size='icon-sm'
            variant='outline'
            aria-label={`Open ${school.name}`}
            title='Open school'
            className='border-[#EDF0EE] bg-white text-[#3C4440] hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            onClick={(event) => {
              event.stopPropagation()
              workOn(school)
            }}
          >
            <Eye className='size-4 stroke-[1.75]' />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <Page>
      <PageHeader
        eyebrow='Settings'
        title='Schools'
        description='Every school on the platform. Opening a school switches the whole console to it.'
        actions={
          <Button variant='primary' size='sm' onClick={() => setEditing('new')}>
            <Plus className='size-4 stroke-[1.75]' />
            Add school
          </Button>
        }
      />
      <Card className='overflow-hidden border border-[#EDF0EE] bg-white dark:border-slate-800 dark:bg-slate-900'>
        <ListToolbar summary={schools.data ? `${schools.data.total} schools` : ''}>
          <SearchBox
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
            placeholder='Name, code or city'
            label='Search schools'
          />
        </ListToolbar>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(school) => school.id}
          loading={schools.isFetching}
          error={schools.isError ? schools.error.message : null}
          onRetry={() => schools.refetch()}
          onRowClick={workOn}
          empty={{
            icon: search ? CircleOff : Building2,
            title: search ? 'No school matches' : 'No schools yet',
            description: search
              ? 'Try another name or code.'
              : 'Add the first school and its admin.',
            action: !search && (
              <Button variant='primary' size='sm' onClick={() => setEditing('new')}>
                <Plus className='size-4 stroke-[1.75]' />
                Add school
              </Button>
            ),
          }}
          card={(school) => (
            <div className='flex items-center justify-between gap-3 p-3'>
              <div className='flex items-center gap-3 min-w-0'>
                <span className='grid size-9 shrink-0 place-items-center rounded-lg bg-[#EAF7F0] font-mono text-[11.5px] font-bold text-[#127D48] dark:bg-emerald-950/60 dark:text-emerald-300'>
                  {school.code.slice(0, 4)}
                </span>
                <div className='grid min-w-0'>
                  <span className='truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100'>
                    {school.name}
                  </span>
                  <span className='text-[12px] text-slate-500 dark:text-slate-400'>
                    {school.code} · {school.student_count} students
                  </span>
                </div>
              </div>
              <div className='flex items-center gap-1.5 shrink-0'>
                <Badge tone={school.is_active ? 'success' : 'neutral'} dot>
                  {school.is_active ? 'Active' : 'Off'}
                </Badge>
                <Button
                  size='icon-sm'
                  variant='outline'
                  aria-label={`Edit ${school.name}`}
                  title='Edit school'
                  className='border-[#EDF0EE] bg-white text-[#3C4440] hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                  onClick={(event) => {
                    event.stopPropagation()
                    setEditing(school)
                  }}
                >
                  <PenLine className='size-4 stroke-[1.75]' />
                </Button>
                <Button
                  size='icon-sm'
                  variant='outline'
                  aria-label={`Open ${school.name}`}
                  title='Open school'
                  className='border-[#EDF0EE] bg-white text-[#3C4440] hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                  onClick={(event) => {
                    event.stopPropagation()
                    workOn(school)
                  }}
                >
                  <Eye className='size-4 stroke-[1.75]' />
                </Button>
              </div>
            </div>
          )}
          pagination={{
            page,
            limit: LIMIT,
            total: schools.data?.total ?? 0,
            label: 'schools',
            onPageChange: setPage,
          }}
        />
      </Card>
      {editing && (
        <SchoolModal
          school={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </Page>
  )
}

function SchoolModal({ school, onClose }: { school?: School; onClose: () => void }) {
  const save = useSaveSchool()
  const isEdit = Boolean(school)
  const [draft, setDraft] = useState({
    name: school?.name ?? '',
    code: school?.code ?? '',
    board: school?.board ?? 'CBSE',
    city: school?.city ?? '',
    is_active: school?.is_active ?? true,
    admin_name: '',
    admin_mobile: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (field: keyof typeof draft, value: any) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={isEdit ? `Edit ${school?.name}` : 'Add school'}
      description={
        isEdit
          ? 'Update the school details or toggle its active status.'
          : 'The admin gets a sign-in invite by SMS and can set up classes from there.'
      }
      formId='school-form'
      submitText={isEdit ? 'Save changes' : 'Create school'}
      loading={save.isPending}
      size='lg'
    >
      <form
        id='school-form'
        noValidate
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={async (event) => {
          event.preventDefault()
          const next: Record<string, string> = {}
          if (draft.name.trim().length < 3) next.name = 'Enter the school name'
          if (!/^[A-Za-z0-9]{2,20}$/.test(draft.code.trim()))
            next.code = '2 to 20 letters or digits'
          if (!isEdit && draft.admin_name && !/^[6-9]\d{9}$/.test(draft.admin_mobile))
            next.admin_mobile = 'Enter a valid 10-digit mobile number'
          if (!isEdit && draft.admin_mobile && draft.admin_name.trim().length < 2)
            next.admin_name = 'Enter the admin name'
          setErrors(next)
          if (Object.keys(next).length) return
          const input: SchoolInput & { is_active?: boolean } = {
            name: draft.name.trim(),
            code: draft.code.trim().toUpperCase(),
            board: draft.board as SchoolInput['board'],
            city: draft.city.trim() || null,
            ...(isEdit ? { is_active: draft.is_active } : {}),
            ...(!isEdit && draft.admin_name
              ? { admin_name: draft.admin_name.trim(), admin_mobile: draft.admin_mobile }
              : {}),
          }
          try {
            const saved = await save.mutateAsync({ id: school?.id, input })
            alerts.success(`${saved.name} ${isEdit ? 'updated' : 'created'}`)
            onClose()
          } catch (error) {
            const fields = fieldErrorsOf(error)
            if (fields.root?.includes('code')) fields.code = fields.root
            if (fields.root?.includes('mobile')) fields.admin_mobile = fields.root
            setErrors(fields.code || fields.admin_mobile ? { ...fields, root: '' } : fields)
          }
        }}
      >
        <RootError message={errors.root} />
        <FormField
          id='school-name'
          label='School name'
          required
          error={errors.name}
          className='sm:col-span-2'
        >
          <Input
            id='school-name'
            autoFocus
            value={draft.name}
            onChange={(event) => set('name', event.target.value)}
          />
        </FormField>
        <FormField
          id='school-code'
          label='Code'
          required
          error={errors.code}
          hint='Used in admission numbers'
        >
          <Input
            id='school-code'
            className='font-mono uppercase'
            maxLength={20}
            value={draft.code}
            onChange={(event) => set('code', event.target.value)}
          />
        </FormField>
        <FormField id='school-board' label='Board'>
          <Combobox
            id='school-board'
            label='Board'
            value={draft.board}
            placeholder='Choose board'
            options={BOARDS}
            onChange={(value) => set('board', value ?? 'CBSE')}
            highlightSelected={false}
            className='sm:w-full'
          />
        </FormField>
        <FormField id='school-city' label='City'>
          <Input
            id='school-city'
            value={draft.city}
            onChange={(event) => set('city', event.target.value)}
          />
        </FormField>
        {isEdit ? (
          <FormField id='school-status' label='Status'>
            <Combobox
              id='school-status'
              label='Status'
              value={draft.is_active ? 'active' : 'inactive'}
              placeholder='Select status'
              options={[
                { value: 'active', label: 'Active (enabled)' },
                { value: 'inactive', label: 'Switched off (disabled)' },
              ]}
              onChange={(value) => set('is_active', value === 'active')}
              highlightSelected={false}
              className='sm:w-full'
            />
          </FormField>
        ) : (
          <div />
        )}
        {!isEdit && (
          <>
            <FormField id='admin-name' label='First admin name' error={errors.admin_name}>
              <Input
                id='admin-name'
                value={draft.admin_name}
                onChange={(event) => set('admin_name', event.target.value)}
              />
            </FormField>
            <FormField id='admin-mobile' label='First admin mobile' error={errors.admin_mobile}>
              <Input
                id='admin-mobile'
                type='tel'
                inputMode='numeric'
                maxLength={10}
                className='tabular'
                value={draft.admin_mobile}
                onChange={(event) =>
                  set('admin_mobile', event.target.value.replace(/\D/g, '').slice(-10))
                }
              />
            </FormField>
          </>
        )}
      </form>
    </AppModal>
  )
}
