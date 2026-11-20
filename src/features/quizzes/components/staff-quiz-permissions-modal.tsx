import { useMemo, useState } from 'react'
import { Check, Search, ShieldCheck } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  quizzesApi,
  useQuizPermissions,
  type StaffQuizPermissionItem,
} from '../api'

interface StaffQuizPermissionsModalProps {
  open: boolean
  onClose: () => void
  onPermissionsUpdated?: () => void
}

export function StaffQuizPermissionsModal({
  open,
  onClose,
  onPermissionsUpdated,
}: StaffQuizPermissionsModalProps) {
  const { data: permissionsData, isLoading, refetch } = useQuizPermissions()

  const [overrideAllowAll, setOverrideAllowAll] = useState<boolean | null>(null)
  const [overridePermittedIds, setOverridePermittedIds] = useState<number[] | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'teaching' | 'non_teaching'>('all')
  const [isSaving, setIsSaving] = useState(false)

  const allowAllTeachers = overrideAllowAll ?? Boolean(permissionsData?.allow_all_teachers)
  const permittedIds = overridePermittedIds ?? permissionsData?.permitted_user_ids ?? []

  const staffList = useMemo(() => permissionsData?.staff ?? [], [permissionsData?.staff])

  const filteredStaff = useMemo(() => {
    return staffList.filter((item: StaffQuizPermissionItem) => {
      if (filterType !== 'all' && item.staff_type !== filterType) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        item.name.toLowerCase().includes(q) ||
        item.employee_no.toLowerCase().includes(q) ||
        item.designation.toLowerCase().includes(q) ||
        (item.department && item.department.toLowerCase().includes(q))
      )
    })
  }, [staffList, filterType, searchQuery])

  const toggleStaffPermission = (userId: number) => {
    const next = permittedIds.includes(userId)
      ? permittedIds.filter((id) => id !== userId)
      : [...permittedIds, userId]
    setOverridePermittedIds(next)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await quizzesApi.updatePermissions({
        allow_all_teachers: allowAllTeachers,
        permitted_user_ids: permittedIds,
      })
      alerts.success('Online test creation permissions updated successfully')
      void refetch()
      onPermissionsUpdated?.()
      onClose()
    } catch (err) {
      alerts.error(toApiError(err).message || 'Failed to update test permissions')
    } finally {
      setIsSaving(false)
    }
  }

  const teachingCount = staffList.filter((s) => s.staff_type === 'teaching').length
  const nonTeachingCount = staffList.filter((s) => s.staff_type !== 'teaching').length

  return (
    <AppModal
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title='Staff Online Test Creation Permissions'
      description='Principal & Admin control: Grant or revoke permission for staff members to create online tests.'
      size='xl'
    >
      <div className='flex flex-col gap-3.5 text-xs'>
        {/* Master Switch Banner */}
        <div className='flex items-start justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4'>
          <div className='flex items-start gap-3'>
            <div className='rounded-lg bg-primary/10 p-2 text-primary shrink-0'>
              <ShieldCheck className='h-5 w-5' />
            </div>
            <div>
              <span className='font-semibold text-sm text-foreground'>
                Allow all teaching staff to create tests directly
              </span>
              <p className='text-muted-foreground text-xs mt-0.5 leading-relaxed'>
                When enabled, all verified teachers and HODs can author, schedule, and configure online tests.
                Disable this to require individual staff permission approval.
              </p>
            </div>
          </div>
          <div className='pt-1'>
            <Switch
              checked={allowAllTeachers}
              onCheckedChange={(val) => setOverrideAllowAll(val)}
              aria-label='Allow all teachers'
            />
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className='flex flex-wrap items-center justify-between gap-2 pt-1'>
          <div className='relative w-full sm:w-64'>
            <Search className='absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground' />
            <Input
              type='search'
              placeholder='Search by name, emp ID...'
              className='h-8 pl-8 text-xs'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className='flex items-center gap-1.5'>
            <Button
              type='button'
              size='sm'
              variant={filterType === 'all' ? 'default' : 'outline'}
              className='h-7 text-xs px-2.5'
              onClick={() => setFilterType('all')}
            >
              All Staff ({staffList.length})
            </Button>
            <Button
              type='button'
              size='sm'
              variant={filterType === 'teaching' ? 'default' : 'outline'}
              className='h-7 text-xs px-2.5'
              onClick={() => setFilterType('teaching')}
            >
              Teaching Staff ({teachingCount})
            </Button>
            <Button
              type='button'
              size='sm'
              variant={filterType === 'non_teaching' ? 'default' : 'outline'}
              className='h-7 text-xs px-2.5'
              onClick={() => setFilterType('non_teaching')}
            >
              Non-Teaching ({nonTeachingCount})
            </Button>
          </div>
        </div>

        {/* Staff Table with Dedicated Smooth Scroll Container & Sticky Header */}
        <div className='rounded-lg border border-border bg-card shadow-xs overflow-hidden'>
          <div className='max-h-[350px] overflow-y-auto overscroll-contain pr-0.5'>
            <table className='w-full border-collapse text-left text-xs'>
              <thead className='sticky top-0 z-10 border-b border-border bg-muted/95 backdrop-blur-sm font-semibold text-muted-foreground shadow-xs'>
                <tr>
                  <th className='py-2.5 px-3 bg-muted/95'>Staff Member</th>
                  <th className='py-2.5 px-3 bg-muted/95'>Designation & Department</th>
                  <th className='py-2.5 px-3 bg-muted/95'>Staff Type</th>
                  <th className='py-2.5 px-3 text-right bg-muted/95'>Test Creation Permission</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border/60'>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className='py-12 text-center text-muted-foreground animate-pulse'>
                      Loading staff directory and permission records…
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={4} className='py-12 text-center text-muted-foreground'>
                      No staff members match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => {
                    const isIndividuallyPermitted = permittedIds.includes(staff.user_id)
                    const isPermittedByMaster = allowAllTeachers && staff.staff_type === 'teaching'
                    const effectivePermission = isIndividuallyPermitted || isPermittedByMaster

                    return (
                      <tr
                        key={staff.staff_id}
                        className={`transition-colors hover:bg-muted/30 ${
                          effectivePermission ? 'bg-primary/[0.03]' : ''
                        }`}
                      >
                        <td className='py-2 px-3'>
                          <div className='font-medium text-foreground'>{staff.name}</div>
                          <div className='text-[11px] text-muted-foreground'>{staff.employee_no || 'No ID'}</div>
                        </td>
                        <td className='py-2 px-3 text-muted-foreground'>
                          {staff.designation || 'Staff'}
                          {staff.department ? ` · ${staff.department}` : ''}
                        </td>
                        <td className='py-2 px-3'>
                          <Badge tone={staff.staff_type === 'teaching' ? 'info' : 'neutral'}>
                            {staff.staff_type === 'teaching' ? 'Teaching' : 'Non-Teaching'}
                          </Badge>
                        </td>
                        <td className='py-2 px-3 text-right'>
                          <div className='flex items-center justify-end gap-2.5'>
                            {isPermittedByMaster && !isIndividuallyPermitted ? (
                              <Badge tone='success' className='text-[10px]'>
                                <Check className='mr-1 h-3 w-3' />
                                Allowed via All Teachers Switch
                              </Badge>
                            ) : (
                              <span className='text-[11px] text-muted-foreground font-medium'>
                                {isIndividuallyPermitted ? 'Permitted' : 'Disabled'}
                              </span>
                            )}
                            <Switch
                              checked={effectivePermission}
                              disabled={isPermittedByMaster}
                              onCheckedChange={() => toggleStaffPermission(staff.user_id)}
                              aria-label={`Toggle quiz permission for ${staff.name}`}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Bottom Status Bar */}
          {filteredStaff.length > 0 && (
            <div className='flex items-center justify-between border-t border-border bg-muted/20 px-3.5 py-2 text-[11px] text-muted-foreground'>
              <span>
                Showing <strong className='text-foreground'>{filteredStaff.length}</strong> staff members
              </span>
              {filteredStaff.length > 5 && (
                <span className='text-muted-foreground/80 italic'>
                  ↕ Scroll to view all staff members
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className='flex items-center justify-between border-t border-border/80 pt-3 mt-1'>
          <div className='text-xs text-muted-foreground'>
            <strong>{permittedIds.length}</strong> individual staff members explicitly permitted
            {allowAllTeachers ? ' (+ All Teaching Staff enabled)' : ''}
          </div>
          <div className='flex items-center gap-2'>
            <Button type='button' variant='outline' size='sm' onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type='button' variant='default' size='sm' onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving Permissions…' : 'Save Permissions'}
            </Button>
          </div>
        </div>
      </div>
    </AppModal>
  )
}
