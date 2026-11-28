import { useState } from 'react'
import {
  Armchair,
  Building2,
  Download,
  FileText,
  Plus,
  Shuffle,
  UserCheck,
} from 'lucide-react'
import { TrashIcon } from '@/components/common/icon'
import { Combobox } from '@/components/common/combobox'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useStaffList } from '@/features/staff/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  useAssignInvigilator,
  useAutoAllocateSeats,
  useClearSeating,
  useCreateExamHall,
  useDeleteExamHall,
  useDeleteInvigilator,
  useExamHalls,
  useExamInvigilators,
  useExamOptions,
  useExamSeating,
  type CreateExamHallInput,
  type Exam,
} from '../api'

interface HallsTabProps {
  canManage: boolean
  examId?: number
  onExamChange?: (examId: number) => void
}

export function HallsTab({ canManage, examId: initialExamId, onExamChange }: HallsTabProps) {
  const examsQuery = useExamOptions()
  const exams: Exam[] = examsQuery.data?.items ?? []
  const activeExamId = initialExamId ?? (exams.length > 0 ? exams[0].id : undefined)

  const hallsQuery = useExamHalls()
  const halls = hallsQuery.data ?? []

  const [selectedHallFilter, setSelectedHallFilter] = useState<number | undefined>(undefined)
  const seatingQuery = useExamSeating(activeExamId, selectedHallFilter)
  const seating = seatingQuery.data ?? []

  const invigilatorsQuery = useExamInvigilators(activeExamId)
  const invigilators = invigilatorsQuery.data ?? []

  // Staff query for teacher list in invigilator duty assignment
  const staffQuery = useStaffList({ page: 1, limit: 100 })
  const staffMembers = (staffQuery.data?.items ?? []).filter((s) => s.user_id)

  // Mutations
  const createHallMutation = useCreateExamHall()
  const deleteHallMutation = useDeleteExamHall()
  const autoAllocateMutation = useAutoAllocateSeats()
  const clearSeatingMutation = useClearSeating()
  const assignInvigMutation = useAssignInvigilator()
  const deleteInvigMutation = useDeleteInvigilator()

  // Confirm Modal State
  const [confirmState, setConfirmState] = useState<{
    open: boolean
    title: string
    description: React.ReactNode
    confirmText?: string
    destructive?: boolean
    loading?: boolean
    onConfirm: () => Promise<void> | void
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  })

  // Dialog States
  const [isCreateHallOpen, setIsCreateHallOpen] = useState(false)
  const [hallForm, setHallForm] = useState<CreateExamHallInput>({
    name: '',
    building: '',
    floor: '',
    capacity: 30,
    rows_count: 5,
    columns_count: 6,
    is_active: true,
  })

  const [isAutoAllocateOpen, setIsAutoAllocateOpen] = useState(false)
  const [selectedHallIds, setSelectedHallIds] = useState<number[]>([])
  const [allocationStrategy, setAllocationStrategy] = useState<'alternate_section' | 'sequential'>('alternate_section')

  const [isAssignInvigOpen, setIsAssignInvigOpen] = useState(false)
  const [invigForm, setInvigForm] = useState<{
    hall_id: number | undefined
    teacher_user_id: number | undefined
    exam_date: string
    session: string
  }>({
    hall_id: undefined,
    teacher_user_id: undefined,
    exam_date: new Date().toISOString().slice(0, 10),
    session: 'Morning',
  })

  // Handlers
  const handleCreateHall = async () => {
    if (!hallForm.name.trim()) {
      alerts.error('Hall name is required')
      return
    }
    try {
      const payload: CreateExamHallInput = {
        name: hallForm.name.trim(),
        building: hallForm.building?.trim() || undefined,
        floor: hallForm.floor?.trim() || undefined,
        capacity: Number(hallForm.capacity) || 30,
        rows_count: hallForm.rows_count ? Number(hallForm.rows_count) : undefined,
        columns_count: hallForm.columns_count ? Number(hallForm.columns_count) : undefined,
        is_active: hallForm.is_active,
      }
      await createHallMutation.mutateAsync(payload)
      alerts.success('Exam hall created successfully')
      setIsCreateHallOpen(false)
      setHallForm({
        name: '',
        building: '',
        floor: '',
        capacity: 30,
        rows_count: 5,
        columns_count: 6,
        is_active: true,
      })
    } catch (err) {
      alerts.error(toApiError(err).message)
    }
  }

  const handleDeleteHall = (hallId: number) => {
    const targetHall = halls.find((h) => h.id === hallId)
    setConfirmState({
      open: true,
      title: 'Delete Exam Hall',
      description: `Are you sure you want to delete ${targetHall?.name ?? 'this hall'}? Any existing seat allocations will be removed.`,
      confirmText: 'Delete Hall',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteHallMutation.mutateAsync(hallId)
          alerts.success('Exam hall deleted')
          setConfirmState((prev) => ({ ...prev, open: false }))
        } catch (err) {
          alerts.error(toApiError(err).message)
        }
      },
    })
  }

  const handleOpenAutoAllocate = () => {
    setSelectedHallIds(halls.filter((h) => h.is_active).map((h) => h.id))
    setIsAutoAllocateOpen(true)
  }

  const handleAutoAllocate = async () => {
    if (!activeExamId) return
    if (!selectedHallIds.length) {
      alerts.error('Select at least one exam hall')
      return
    }
    try {
      const res = await autoAllocateMutation.mutateAsync({
        examId: activeExamId,
        hall_ids: selectedHallIds,
        strategy: allocationStrategy,
      })
      alerts.success(`Allocated ${res.allocated} students across ${res.halls.length} halls!`)
      setIsAutoAllocateOpen(false)
    } catch (err) {
      alerts.error(toApiError(err).message)
    }
  }

  const handleClearSeating = () => {
    if (!activeExamId) return
    setConfirmState({
      open: true,
      title: 'Clear All Seating Allocations',
      description: 'Are you sure you want to clear all seating allocations for this examination? This action cannot be undone.',
      confirmText: 'Clear Seating',
      destructive: true,
      onConfirm: async () => {
        try {
          await clearSeatingMutation.mutateAsync(activeExamId)
          alerts.success('Seating cleared successfully')
          setConfirmState((prev) => ({ ...prev, open: false }))
        } catch (err) {
          alerts.error(toApiError(err).message)
        }
      },
    })
  }

  const handleDeleteInvigilator = (invId: number, teacherName: string) => {
    if (!activeExamId) return
    setConfirmState({
      open: true,
      title: 'Remove Invigilation Duty',
      description: `Are you sure you want to unassign ${teacherName} from this invigilation session?`,
      confirmText: 'Remove Duty',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteInvigMutation.mutateAsync({
            examId: activeExamId,
            invigilatorId: invId,
          })
          alerts.success('Invigilator unassigned')
          setConfirmState((prev) => ({ ...prev, open: false }))
        } catch (err) {
          alerts.error(toApiError(err).message)
        }
      },
    })
  }

  const handleAssignInvigilator = async () => {
    if (!activeExamId) return
    if (!invigForm.hall_id) {
      alerts.error('Please select an exam hall')
      return
    }
    if (!invigForm.teacher_user_id) {
      alerts.error('Please select a teacher')
      return
    }
    if (!invigForm.exam_date) {
      alerts.error('Please select an exam date')
      return
    }
    try {
      await assignInvigMutation.mutateAsync({
        examId: activeExamId,
        hall_id: invigForm.hall_id,
        teacher_user_id: invigForm.teacher_user_id,
        exam_date: invigForm.exam_date,
        session: invigForm.session || 'Morning',
      })
      alerts.success('Invigilator duty assigned successfully')
      setIsAssignInvigOpen(false)
      setInvigForm({
        hall_id: undefined,
        teacher_user_id: undefined,
        exam_date: new Date().toISOString().slice(0, 10),
        session: 'Morning',
      })
    } catch (err) {
      alerts.error(toApiError(err).message)
    }
  }

  const handleDownloadDoorChart = (hallId?: number) => {
    if (!activeExamId) return
    const targetHallId = hallId ?? (halls.length ? halls[0].id : 0)
    if (!targetHallId) {
      alerts.error('No hall available for door chart')
      return
    }
    window.open(`/api/v1/admin/exams/${activeExamId}/halls/${targetHallId}/door-chart?download=true`, '_blank')
  }

  const handleDownloadHallTickets = () => {
    if (!activeExamId) return
    window.open(`/api/v1/admin/exams/${activeExamId}/hall-tickets?download=true`, '_blank')
  }

  return (
    <div className='space-y-8'>
      {/* 1. Exam Selection and Seating Actions Bar */}
      <Card className='p-5 shadow-sm'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <Building2 className='h-6 w-6 text-emerald-600' />
            <div>
              <h2 className='text-lg font-semibold text-gray-900'>Exam Seating & Hall Logistics</h2>
              <p className='text-xs text-gray-500'>
                Auto-allocate students to desks with copying-prevention patterns, print door charts and admit cards.
              </p>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            <div className='w-56'>
              <Combobox
                id='exam-switcher-combobox'
                label='Examination'
                value={activeExamId ? String(activeExamId) : undefined}
                placeholder='Select Examination'
                searchPlaceholder='Search examination...'
                options={exams.map((ex) => ({
                  value: String(ex.id),
                  label: ex.name,
                }))}
                onChange={(val) => {
                  if (val) onExamChange?.(Number(val))
                }}
              />
            </div>

            {canManage && (
              <>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleOpenAutoAllocate}
                  disabled={!activeExamId}
                  className='border-emerald-600 text-emerald-700 hover:bg-emerald-50'
                >
                  <Shuffle className='mr-1.5 h-4 w-4' />
                  Auto-Allocate Seats
                </Button>

                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleDownloadDoorChart(selectedHallFilter)}
                  disabled={!activeExamId || !seating.length}
                >
                  <FileText className='mr-1.5 h-4 w-4' />
                  Door Chart PDF
                </Button>

                <Button
                  size='sm'
                  onClick={handleDownloadHallTickets}
                  disabled={!activeExamId || !seating.length}
                  className='bg-emerald-600 text-white hover:bg-emerald-700'
                >
                  <Download className='mr-1.5 h-4 w-4' />
                  Admit Cards (Hall Tickets)
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* 2. Physical Exam Halls Management */}
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-base font-semibold text-gray-900'>Physical Exam Halls & Rooms</h3>
            <p className='text-xs text-gray-500'>Configured venues and seat capacities in the institution</p>
          </div>
          {canManage && (
            <Button size='sm' onClick={() => setIsCreateHallOpen(true)} className='gap-1.5'>
              <Plus className='h-4 w-4' /> Add Exam Hall
            </Button>
          )}
        </div>

        {halls.length === 0 ? (
          <EmptyState
            icon={Building2}
            title='No Exam Halls Registered'
            description='Add physical rooms, auditoriums or laboratories with desk capacity to enable automated seating.'
          />
        ) : (
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {halls.map((hall) => (
              <Card key={hall.id} className='relative p-4 hover:shadow-md transition-shadow'>
                <div className='flex items-start justify-between'>
                  <div>
                    <h4 className='font-semibold text-gray-900'>{hall.name}</h4>
                    <p className='text-xs text-gray-500'>
                      {hall.building ? `${hall.building} • ` : ''}
                      {hall.floor ?? 'Ground'}
                    </p>
                  </div>
                  <Badge tone={hall.is_active ? 'success' : 'neutral'}>
                    {hall.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className='mt-4 flex items-center justify-between text-xs text-gray-600 border-t pt-2'>
                  <span className='flex items-center gap-1 font-medium text-emerald-700'>
                    <Armchair className='h-3.5 w-3.5' /> {hall.capacity} Desks
                  </span>
                  <span className='text-gray-400'>
                    {hall.rows_count}R • {hall.columns_count}C
                  </span>
                  {canManage && (
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      className='text-[#D92D20] hover:bg-destructive/10 hover:text-[#B42318]'
                      onClick={() => handleDeleteHall(hall.id)}
                    >
                      <TrashIcon className='size-4' />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 3. Seating Allocations Table */}
      <div className='space-y-3 pt-4 border-t'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <h3 className='text-base font-semibold text-gray-900'>
              Student Seating Allocation ({seating.length} Allocated)
            </h3>
            <p className='text-xs text-gray-500'>Live desk and hall mapping for this exam</p>
          </div>

          <div className='flex items-center gap-3'>
            <div className='w-44'>
              <Combobox
                id='hall-filter-combobox'
                label='Filter by Hall'
                value={selectedHallFilter ? String(selectedHallFilter) : undefined}
                placeholder='All Halls'
                allLabel='All Halls'
                options={halls.map((h) => ({
                  value: String(h.id),
                  label: h.name,
                }))}
                onChange={(val) => {
                  setSelectedHallFilter(val ? Number(val) : undefined)
                }}
              />
            </div>

            {canManage && seating.length > 0 && (
              <Button
                variant='outline'
                size='sm'
                onClick={handleClearSeating}
                className='text-xs text-red-600 hover:bg-red-50'
              >
                Clear Seating
              </Button>
            )}
          </div>
        </div>

        {seating.length === 0 ? (
          <EmptyState
            icon={Armchair}
            title='No Students Allocated Yet'
            description='Click "Auto-Allocate Seats" above to distribute students across your active exam halls.'
          />
        ) : (
          <Card className='overflow-hidden'>
            <div className='max-h-[500px] overflow-auto'>
              <table className='w-full text-left text-xs'>
                <thead className='sticky top-0 bg-gray-50 text-gray-600 uppercase tracking-wider font-semibold border-b'>
                  <tr>
                    <th className='p-3'>Seat No</th>
                    <th className='p-3'>Hall</th>
                    <th className='p-3'>Roll No</th>
                    <th className='p-3'>Student Name</th>
                    <th className='p-3'>Admission No</th>
                    <th className='p-3'>Class & Section</th>
                    <th className='p-3'>Desk Order</th>
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  {seating.map((alloc) => (
                    <tr key={alloc.id} className='hover:bg-gray-50/80 transition-colors'>
                      <td className='p-3 font-semibold text-emerald-800'>
                        <span className='rounded bg-emerald-50 px-2 py-0.5 border border-emerald-200'>
                          {alloc.seat_number}
                        </span>
                      </td>
                      <td className='p-3 font-medium text-gray-800'>{alloc.hall_name}</td>
                      <td className='p-3 text-gray-600'>{alloc.roll_no ?? '—'}</td>
                      <td className='p-3 font-medium text-gray-900'>{alloc.full_name}</td>
                      <td className='p-3 text-gray-500'>{alloc.admission_no}</td>
                      <td className='p-3 text-gray-700'>
                        {alloc.class_name} - {alloc.section_name}
                      </td>
                      <td className='p-3 text-gray-500'>#{alloc.desk_order}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* 4. Invigilators Roster */}
      <div className='space-y-3 pt-4 border-t'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-base font-semibold text-gray-900'>Invigilation Duty Roster</h3>
            <p className='text-xs text-gray-500'>Teacher assignments per hall and date for this exam</p>
          </div>
          {canManage && (
            <Button
              size='sm'
              onClick={() => {
                setInvigForm({
                  hall_id: halls.length > 0 ? halls[0].id : undefined,
                  teacher_user_id: staffMembers.length > 0 ? staffMembers[0].user_id : undefined,
                  exam_date: new Date().toISOString().slice(0, 10),
                  session: 'Morning',
                })
                setIsAssignInvigOpen(true)
              }}
              disabled={!activeExamId || halls.length === 0}
              className='gap-1.5'
            >
              <Plus className='h-4 w-4' /> Assign Invigilator
            </Button>
          )}
        </div>

        {invigilators.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title='No Invigilators Assigned'
            description='Assign teachers to invigilate specific exam halls on exam dates.'
          />
        ) : (
          <Card className='overflow-hidden'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-gray-50 text-gray-600 uppercase tracking-wider font-semibold border-b'>
                <tr>
                  <th className='p-3'>Exam Date</th>
                  <th className='p-3'>Session</th>
                  <th className='p-3'>Hall / Room</th>
                  <th className='p-3'>Teacher Name</th>
                  <th className='p-3'>Phone</th>
                  {canManage && <th className='p-3 text-right'>Action</th>}
                </tr>
              </thead>
              <tbody className='divide-y'>
                {invigilators.map((inv) => (
                  <tr key={inv.id} className='hover:bg-gray-50'>
                    <td className='p-3 font-medium text-gray-900'>{inv.exam_date}</td>
                    <td className='p-3'>
                      <Badge tone='neutral'>{inv.session}</Badge>
                    </td>
                    <td className='p-3 font-medium text-emerald-800'>{inv.hall_name}</td>
                    <td className='p-3 text-gray-800'>{inv.teacher_name}</td>
                    <td className='p-3 text-gray-500'>{inv.teacher_phone ?? '—'}</td>
                    {canManage && (
                      <td className='p-3 text-right'>
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          className='text-[#D92D20] hover:bg-destructive/10 hover:text-[#B42318]'
                          onClick={() => handleDeleteInvigilator(inv.id, inv.teacher_name)}
                        >
                          <TrashIcon className='size-4' />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {/* Create Hall Modal */}
      <Dialog open={isCreateHallOpen} onOpenChange={setIsCreateHallOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Add Physical Exam Hall</DialogTitle>
            <DialogDescription>
              Configure room details, desk layout, and seat capacity.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-2 text-sm'>
            <div className='space-y-1.5'>
              <label className='text-xs font-semibold text-gray-700'>Hall / Room Name *</label>
              <Input
                placeholder='e.g., Main Auditorium, Room 101'
                value={hallForm.name}
                onChange={(e) => setHallForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-gray-700'>Building / Block</label>
                <Input
                  placeholder='Block A'
                  value={hallForm.building ?? ''}
                  onChange={(e) => setHallForm((p) => ({ ...p, building: e.target.value }))}
                />
              </div>
              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-gray-700'>Floor</label>
                <Input
                  placeholder='2nd Floor'
                  value={hallForm.floor ?? ''}
                  onChange={(e) => setHallForm((p) => ({ ...p, floor: e.target.value }))}
                />
              </div>
            </div>

            <div className='grid grid-cols-3 gap-3'>
              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-gray-700'>Capacity (Seats) *</label>
                <Input
                  type='number'
                  min={1}
                  max={500}
                  value={hallForm.capacity}
                  onChange={(e) => setHallForm((p) => ({ ...p, capacity: Number(e.target.value) }))}
                />
              </div>
              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-gray-700'>Rows</label>
                <Input
                  type='number'
                  min={1}
                  value={hallForm.rows_count ?? 5}
                  onChange={(e) => setHallForm((p) => ({ ...p, rows_count: Number(e.target.value) }))}
                />
              </div>
              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-gray-700'>Columns</label>
                <Input
                  type='number'
                  min={1}
                  value={hallForm.columns_count ?? 6}
                  onChange={(e) => setHallForm((p) => ({ ...p, columns_count: Number(e.target.value) }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsCreateHallOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateHall} disabled={createHallMutation.isPending}>
              Create Hall
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto-Allocate Seating Modal */}
      <Dialog open={isAutoAllocateOpen} onOpenChange={setIsAutoAllocateOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Automated Seating Allocation</DialogTitle>
            <DialogDescription>
              Assign desks automatically across selected halls with copying-prevention patterns.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-2 text-sm'>
            <div className='space-y-2'>
              <label className='text-xs font-semibold text-gray-700'>Select Exam Halls to Fill</label>
              <div className='space-y-2 max-h-40 overflow-y-auto border rounded p-2'>
                {halls.map((h) => {
                  const isChecked = selectedHallIds.includes(h.id)
                  return (
                    <label
                      key={h.id}
                      className='flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer border'
                    >
                      <div className='flex items-center gap-2'>
                        <input
                          type='checkbox'
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedHallIds((p) => [...p, h.id])
                            else setSelectedHallIds((p) => p.filter((id) => id !== h.id))
                          }}
                          className='rounded text-emerald-600'
                        />
                        <span className='font-medium text-gray-800'>{h.name}</span>
                      </div>
                      <Badge tone='neutral'>{h.capacity} seats</Badge>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className='space-y-1.5'>
              <label className='text-xs font-semibold text-gray-700'>Seating Arrangement Strategy</label>
              <select
                value={allocationStrategy}
                onChange={(e) => setAllocationStrategy(e.target.value as 'alternate_section' | 'sequential')}
                className='h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm'
              >
                <option value='alternate_section'>
                  Alternate Sections (Interleaved - prevents copying between adjacent desks)
                </option>
                <option value='sequential'>
                  Sequential (Roll number order class by class)
                </option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsAutoAllocateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAutoAllocate}
              disabled={autoAllocateMutation.isPending || !selectedHallIds.length}
              className='bg-emerald-600 text-white hover:bg-emerald-700'
            >
              Run Allocation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Invigilator Modal */}
      <Dialog open={isAssignInvigOpen} onOpenChange={setIsAssignInvigOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Assign Invigilator Duty</DialogTitle>
            <DialogDescription>
              Assign a faculty member / teacher to supervise an exam hall on a specific date.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-2 text-sm'>
            <div className='space-y-1.5'>
              <label className='text-xs font-semibold text-gray-700'>Exam Hall / Room *</label>
              <Combobox
                id='assign-hall-combobox'
                label='Exam Hall'
                value={invigForm.hall_id ? String(invigForm.hall_id) : undefined}
                placeholder='Choose Hall'
                searchPlaceholder='Search hall...'
                options={halls.map((h) => ({
                  value: String(h.id),
                  label: `${h.name} (${h.capacity} seats)`,
                }))}
                onChange={(val) => setInvigForm((p) => ({ ...p, hall_id: val ? Number(val) : undefined }))}
              />
            </div>

            <div className='space-y-1.5'>
              <label className='text-xs font-semibold text-gray-700'>Teacher / Invigilator *</label>
              <Combobox
                id='assign-teacher-combobox'
                label='Teacher'
                value={invigForm.teacher_user_id ? String(invigForm.teacher_user_id) : undefined}
                placeholder='Choose Teacher'
                searchPlaceholder='Search teacher...'
                options={staffMembers.map((s) => ({
                  value: String(s.user_id),
                  label: `${s.name}${s.designation ? ` (${s.designation})` : ''}`,
                }))}
                onChange={(val) => setInvigForm((p) => ({ ...p, teacher_user_id: val ? Number(val) : undefined }))}
              />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-gray-700'>Exam Date *</label>
                <Input
                  type='date'
                  value={invigForm.exam_date}
                  onChange={(e) => setInvigForm((p) => ({ ...p, exam_date: e.target.value }))}
                  className='h-9 text-xs'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-gray-700'>Session</label>
                <select
                  value={invigForm.session}
                  onChange={(e) => setInvigForm((p) => ({ ...p, session: e.target.value }))}
                  className='h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring'
                >
                  <option value='Morning'>Morning (FN)</option>
                  <option value='Afternoon'>Afternoon (AN)</option>
                  <option value='Full Day'>Full Day</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsAssignInvigOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignInvigilator}
              disabled={assignInvigMutation.isPending}
              className='bg-emerald-600 text-white hover:bg-emerald-700'
            >
              Assign Duty
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState((s) => ({ ...s, open }))}
        title={confirmState.title}
        description={confirmState.description}
        confirmText={confirmState.confirmText}
        destructive={confirmState.destructive}
        loading={confirmState.loading}
        onConfirm={confirmState.onConfirm}
      />
    </div>
  )
}
