import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  CircleOff,
  Eye,
  GraduationCap,
  Plus,
  UserRoundCheck,
  UserRoundX,
  UsersRound,
} from 'lucide-react'
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
import { can, useMe } from '@/features/auth/api'
import { useNow } from '@/hooks/use-now'
import { alerts } from '@/lib/alerts'
import { formatDateTime, timeAgo } from '@/lib/format'
import { useDeleteUser, useRoles, useUserInsights, useUsers, type UserListItem } from '../api'
import { RoleBadges } from '../components/role-badges'
import { APP_LABELS } from '../labels'
import { UserFormModal } from '../components/user-form-modal'
import type { UsersSearch } from '../search'

const route = getRouteApi('/_app/users')

function LanguageTag({ language }: { language: UserListItem['language'] }) {
  if (language !== 'ta') return null
  return (
    <span
      title='Gets the app and messages in Tamil'
      className='shrink-0 rounded border border-warning/30 bg-warning/10 px-1 text-[10px] leading-4 font-bold text-warning'
    >
      தமிழ்
    </span>
  )
}
const LIMIT = 20

export function UsersPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/users' })
  const now = useNow(30_000)
  const me = useMe().data
  const canManage = can(me, 'users.manage')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<UserListItem | null>(null)
  const [deleting, setDeleting] = useState<UserListItem | null>(null)

  const users = useUsers({ ...search, limit: LIMIT })
  const insights = useUserInsights()
  const roles = useRoles()
  const remove = useDeleteUser()
  const rows = users.data?.items ?? []

  const setSearch = (patch: Partial<UsersSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })

  const toggle = (patch: Partial<UsersSearch>, active: boolean) =>
    setSearch(
      active
        ? Object.fromEntries(Object.keys(patch).map((key) => [key, undefined]))
        : { status: undefined, never_signed_in: undefined, app: undefined, ...patch }
    )

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (user: UserListItem) => {
    if (!canManage) return
    setEditing(user)
    setFormOpen(true)
  }

  useShortcut('users.create', openCreate, { enabled: canManage })
  useShortcut('app.refresh', () => {
    void users.refetch()
    void insights.refetch()
  })

  const data = insights.data
  const cards: Insight[] = [
    {
      key: 'total',
      label: 'All users',
      value: data?.total ?? 0,
      hint: `${data?.by_app.admin ?? 0} admin · ${data?.by_app.staff ?? 0} staff`,
      icon: UsersRound,
      tone: 'primary',
      active: !search.status && !search.never_signed_in && !search.app && !search.role,
      onClick: () =>
        setSearch({
          status: undefined,
          never_signed_in: undefined,
          app: undefined,
          role: undefined,
        }),
    },
    {
      key: 'active',
      label: 'Active accounts',
      value: data?.active ?? 0,
      hint: `${data?.inactive ?? 0} switched off`,
      icon: UserRoundCheck,
      tone: 'success',
      active: search.status === 'active',
      onClick: () => toggle({ status: 'active' }, search.status === 'active'),
    },
    {
      key: 'parents',
      label: 'Parents',
      value: data?.by_app.parent ?? 0,
      hint: `${data?.by_app.driver ?? 0} drivers and attendants`,
      icon: GraduationCap,
      tone: 'warning',
      active: search.app === 'parent',
      onClick: () => toggle({ app: 'parent' }, search.app === 'parent'),
    },
    {
      key: 'never',
      label: 'Never signed in',
      value: data?.never_signed_in ?? 0,
      hint: 'Follow up so they install the app',
      icon: UserRoundX,
      tone: 'danger',
      active: search.never_signed_in === true,
      onClick: () => toggle({ never_signed_in: true }, search.never_signed_in === true),
    },
  ]

  const columns: Column<UserListItem>[] = [
    {
      key: 'name',
      header: 'USER',
      sortKey: 'name',
      cell: (user) => (
        <div className='flex items-center gap-3'>
          <Avatar name={user.name} />
          <div className='grid min-w-0'>
            <span className='flex items-center gap-1.5'>
              <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
                {user.name}
              </span>
              <LanguageTag language={user.language} />
            </span>
            <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
              {user.email ?? 'No email'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'mobile',
      header: 'MOBILE',
      cell: (user) => (
        <span className='tabular text-[13px] leading-[18px] font-medium text-slate-800 dark:text-slate-200'>
          +91 {user.mobile}
        </span>
      ),
    },
    { key: 'roles', header: 'ROLES', cell: (user) => <RoleBadges roles={user.roles} /> },
    {
      key: 'status',
      header: 'STATUS',
      cell: (user) =>
        user.status === 'active' ? (
          <Badge tone='success' dot>
            Active
          </Badge>
        ) : (
          <Badge tone='neutral' dot>
            Inactive
          </Badge>
        ),
    },
    {
      key: 'last_login_at',
      header: 'LAST SIGN-IN',
      sortKey: 'last_login_at',
      hideBelow: 'lg',
      cell: (user) => (
        <span
          className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'
          title={formatDateTime(user.last_login_at)}
        >
          {user.last_login_at ? timeAgo(user.last_login_at, now) : 'Never'}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'ACTION',
      align: 'right' as const,
      cell: (user) =>
        canManage && (
          <Button
            size='icon-sm'
            variant='outline'
            aria-label={`View ${user.name}`}
            title='View user'
            className='border-[#EDF0EE] bg-white text-[#3C4440] hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            onClick={(event) => {
              event.stopPropagation()
              openEdit(user)
            }}
          >
            <Eye className='size-4 stroke-[1.75]' />
          </Button>
        ),
    },
  ]

  const filtered = Boolean(
    search.search ||
    search.role ||
    search.status ||
    search.app ||
    search.never_signed_in ||
    search.language
  )

  return (
    <Page>
      <PageHeader
        eyebrow='People'
        title='Users'
        description='Everyone who can sign in: office staff, teachers, parents, drivers and attendants. One mobile number per person; roles decide which app opens.'
        actions={
          canManage && (
            <Button variant='primary' size='md' onClick={openCreate}>
              <Plus className='size-4 stroke-[1.75]' />
              Create user
            </Button>
          )
        }
      />

      <InsightCards items={cards} loading={insights.isPending} />

      <Card className='overflow-hidden border border-[#EDF0EE] bg-white dark:border-slate-800 dark:bg-slate-900'>
        <ListToolbar
          summary={
            users.data ? `${users.data.total} ${users.data.total === 1 ? 'user' : 'users'}` : ''
          }
          onClear={filtered ? () => navigate({ search: { page: 1 }, replace: true }) : undefined}
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Search name, mobile or email'
            label='Search users'
          />
          <FilterSelect
            id='role-filter'
            label='Filter by role'
            allLabel='All roles'
            value={search.role}
            options={(roles.data ?? []).map((role) => ({
              value: role.code,
              label: role.name,
              hint: String(role.user_count),
            }))}
            onChange={(role) => setSearch({ role })}
          />
          <FilterSelect
            id='app-filter'
            label='Filter by app'
            allLabel='All apps'
            value={search.app}
            options={Object.entries(APP_LABELS).map(([value, label]) => ({ value, label }))}
            onChange={(app) => setSearch({ app: app as UsersSearch['app'] })}
          />
          <FilterSelect
            id='language-filter'
            label='Filter by language'
            allLabel='All languages'
            value={search.language}
            options={[
              {
                value: 'en',
                label: 'English',
                hint: String((data?.total ?? 0) - (data?.tamil ?? 0)),
              },
              { value: 'ta', label: 'தமிழ் (Tamil)', hint: String(data?.tamil ?? 0) },
            ]}
            onChange={(language) => setSearch({ language: language as UsersSearch['language'] })}
          />
        </ListToolbar>

        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(user) => user.id}
          loading={users.isFetching}
          error={users.isError ? users.error.message : null}
          onRetry={() => users.refetch()}
          onRowClick={canManage ? openEdit : undefined}
          sort={{ sort: search.sort, order: search.order ?? 'desc' }}
          onSortChange={(next) => setSearch(next as Partial<UsersSearch>)}
          empty={{
            icon: filtered ? CircleOff : UsersRound,
            title: filtered ? 'No users match these filters' : 'No users yet',
            description: filtered
              ? 'Try another name or number, or clear the filters.'
              : 'Add the office team first, then teachers and parents.',
            action: !filtered && canManage && (
              <Button variant='primary' size='md' onClick={openCreate}>
                <Plus className='size-4 stroke-[1.75]' />
                Create user
              </Button>
            ),
          }}
          card={(user) => (
            <div className='flex items-start gap-3 p-3'>
              <Avatar name={user.name} />
              <div className='grid min-w-0 flex-1 gap-1.5'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='grid min-w-0'>
                    <span className='flex min-w-0 items-center gap-1.5'>
                      <span className='truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100'>
                        {user.name}
                      </span>
                      <LanguageTag language={user.language} />
                    </span>
                    <span className='tabular text-[12px] text-slate-500 dark:text-slate-400'>
                      +91 {user.mobile}
                    </span>
                  </div>
                  {user.status === 'active' ? (
                    <Badge tone='success' dot className='shrink-0'>
                      Active
                    </Badge>
                  ) : (
                    <Badge tone='neutral' dot className='shrink-0'>
                      Inactive
                    </Badge>
                  )}
                </div>
                <RoleBadges roles={user.roles} />
                <div className='flex items-center justify-between gap-2 pt-1'>
                  <span className='text-[12px] text-slate-500 dark:text-slate-400'>
                    Last sign-in: {user.last_login_at ? timeAgo(user.last_login_at, now) : 'Never'}
                  </span>
                  {canManage && (
                    <Button
                      size='icon-sm'
                      variant='outline'
                      aria-label={`View ${user.name}`}
                      title='View user'
                      className='border-[#EDF0EE] bg-white text-[#3C4440] hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                      onClick={(event) => {
                        event.stopPropagation()
                        openEdit(user)
                      }}
                    >
                      <Eye className='size-4 stroke-[1.75]' />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: users.data?.total ?? 0,
            label: 'users',
            onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
          }}
        />
      </Card>

      <UserFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
        canAssignSuperAdmin={Boolean(me?.roles.some((role) => role.code === 'SUPER_ADMIN'))}
        onDelete={(user) => setDeleting(user)}
        currentUserId={me?.id}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name ?? 'user'}?`}
        description='They are signed out on every device and can no longer sign in. Their past records stay.'
        confirmText='Delete user'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return
          await remove.mutateAsync(deleting.id)
          alerts.success('User deleted')
          setDeleting(null)
        }}
      />
    </Page>
  )
}
