import { useState } from 'react'
import {
  Armchair,
  Building2,
  Download,
  FileText,
  Plus,
  Shuffle,
  Trash2,
  UserCheck,
} from 'lucide-react'
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
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
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

  // Mutations
  const createHallMutation = useCreateExamHall()
  const deleteHallMutation = useDeleteExamHall()
  const autoAllocateMutation = useAutoAllocateSeats()
  const clearSeatingMutation = useClearSeating()
  const deleteInvigMutation = useDeleteInvigilator()

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

  // Handlers
  const handleCreateHall = async () => {
    if (!hallForm.name.trim()) {
      alerts.error('Hall name is required')
      return
    }
    try {
      await createHallMutation.mutateAsync(hallForm)
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

  const handleDeleteHall = async (hallId: number) => {
    if (!confirm('Are you sure you want to delete this hall?')) return
    try {
      await deleteHallMutation.mutateAsync(hallId)
      alerts.success('Hall deleted')
    } catch (err) {
      alerts.error(toApiError(err).message)
    }
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

  const handleClearSeating = async () => {
    if (!activeExamId) return
    if (!confirm('Clear all seating allocations for this exam?')) return
    try {
      await clearSeatingMutation.mutateAsync(activeExamId)
      alerts.success('Seating cleared')
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
            <select
              aria-label='Select Examination'
              value={activeExamId ? String(activeExamId) : ''}
              onChange={(e) => onExamChange?.(Number(e.target.value))}
              className='h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring'
            >
              <option value='' disabled>
                Select Examination
              </option>
              {exams.map((ex) => (
                <option key={ex.id} value={String(ex.id)}>
                  {ex.name}
                </option>
              ))}
            </select>

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
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
            {halls.map((hall) => (
              <Card key={hall.id} className='relative p-4 transition-all hover:shadow-md'>
                <div className='flex items-start justify-between'>
                  <div className='space-y-1'>
                    <h4 className='font-semibold text-gray-900'>{hall.name}</h4>
                    <p className='text-xs text-gray-500'>
                      {[hall.building, hall.floor].filter(Boolean).join(' • ') || 'Main Campus'}
                    </p>
                  </div>
                  <Badge tone={hall.is_active ? 'success' : 'neutral'}>
                    {hall.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className='mt-4 flex items-center justify-between border-t pt-3 text-xs text-gray-600'>
                  <span className='flex items-center gap-1.5 font-medium text-emerald-700'>
                    <Armchair className='h-3.5 w-3.5' /> {hall.capacity} Desks
                  </span>
                  <span>{hall.rows_count}R × {hall.columns_count}C</span>
                  {canManage && (
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-7 w-7 text-red-500 hover:bg-red-50'
                      onClick={() => handleDeleteHall(hall.id)}
                    >
                      <Trash2 className='h-3.5 w-3.5' />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 3. Seating Allocation Table */}
      <div className='space-y-3'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <h3 className='text-base font-semibold text-gray-900'>
              Student Seating Allocation ({seating.length} Allocated)
            </h3>
            <p className='text-xs text-gray-500'>Live desk and hall mapping for this exam</p>
          </div>

          <div className='flex items-center gap-3'>
            <select
              aria-label='Filter by Hall'
              value={selectedHallFilter ? String(selectedHallFilter) : 'all'}
              onChange={(e) => setSelectedHallFilter(e.target.value === 'all' ? undefined : Number(e.target.value))}
              className='h-8 rounded-md border border-input bg-background px-2.5 py-0.5 text-xs shadow-sm'
            >
              <option value='all'>All Halls</option>
              {halls.map((h) => (
                <option key={h.id} value={String(h.id)}>
                  {h.name}
                </option>
              ))}
            </select>

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
                    <th className='p-3'>Exam Hall</th>
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
                          size='icon'
                          className='h-7 w-7 text-red-500 hover:bg-red-50'
                          onClick={async () => {
                            if (!confirm('Remove this invigilation duty?')) return
                            await deleteInvigMutation.mutateAsync({
                              examId: activeExamId!,
                              invigilatorId: inv.id,
                            })
                            alerts.success('Invigilator unassigned')
                          }}
                        >
                          <Trash2 className='h-3.5 w-3.5' />
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
    </div>
  )
}
