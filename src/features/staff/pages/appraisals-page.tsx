import { useMemo, useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Lock,
  MessageSquare,
  Percent,
  Plus,
  Save,
  Sliders,
  Sparkles,
  Star,
  TrendingUp,
  Upload,
  UserCheck,
} from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { DataTable, type Column } from '@/components/common/data-table'
import { FormField } from '@/components/common/form-field'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { SegmentedControl } from '@/components/common/segmented-control'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input, Label, Textarea } from '@/components/ui/input'
import { useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { filesApi, type UploadedFile } from '@/lib/files'
import {
  appraisalsApi,
  useAppraisalsList,
  useKraConfigs,
  useStaffList,
  useTeacherMetrics,
  type KraScoreItem,
  type StaffAppraisal,
  type StaffPerformanceMetrics,
} from '../api'
import { KraConfigurationModal } from '../components/kra-configuration-modal'
import { ReviewAppealModal } from '../components/review-appeal-modal'
import { RaiseAppealModal } from '../components/raise-appeal-modal'
import {
  APPRAISAL_RATING_LABELS,
  APPRAISAL_STATUS_LABELS,
  RECOMMENDATION_LABELS,
} from '../labels'
import type { AppraisalsSearch, AppraisalStatus, OverallRating } from '../search'

const route = getRouteApi('/_app/staff/appraisals')
const LIMIT = 20

function computeRating(score: number): OverallRating {
  if (score >= 4.6) return 'outstanding'
  if (score >= 3.8) return 'exceeds_expectations'
  if (score >= 3.0) return 'meets_expectations'
  if (score >= 2.0) return 'needs_improvement'
  return 'unsatisfactory'
}

export function AppraisalsPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/staff/appraisals' })
  const me = useMe().data

  const isSuperAdmin = me?.roles.some((r) => r.code === 'SUPER_ADMIN') ?? false
  const isSchoolAdmin = me?.roles.some((r) => r.code === 'ADMIN') ?? false
  const isPrincipal = me?.roles.some((r) => r.code === 'PRINCIPAL') ?? false
  const canApprove = isSuperAdmin || isSchoolAdmin || isPrincipal

  const appraisals = useAppraisalsList({ ...search, limit: LIMIT })
  const rows = appraisals.data?.items ?? []
  const total = appraisals.data?.total ?? rows.length

  const [activeItem, setActiveItem] = useState<StaffAppraisal | null>(null)
  const [editingItem, setEditingItem] = useState<StaffAppraisal | null>(null)
  const [conductModalOpen, setConductModalOpen] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [kraModalOpen, setKraModalOpen] = useState(false)
  const [appealItem, setAppealItem] = useState<StaffAppraisal | null>(null)
  const [raiseAppealItem, setRaiseAppealItem] = useState<StaffAppraisal | null>(null)

  const setSearch = (patch: Partial<AppraisalsSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })

  useShortcut('app.refresh', () => {
    void appraisals.refetch()
  })

  const pendingCount = rows.filter((r) => r.status === 'submitted' || r.status === 'draft').length
  const appealedCount = rows.filter((r) => r.status === 'appealed').length
  const finalizedCount = rows.filter((r) => r.status === 'finalized').length

  const cards: Insight[] = [
    {
      key: 'total',
      label: 'Total Reviews',
      value: total,
      hint: 'Appraisals across staff',
      icon: Award,
    },
    {
      key: 'pending',
      label: 'Pending Approvals',
      value: pendingCount,
      hint: 'Awaiting Admin/Principal sign-off',
      icon: Clock,
      tone: 'warning',
    },
    {
      key: 'appealed',
      label: 'Appeals (Disputes)',
      value: appealedCount,
      hint: 'Teacher hike review requests',
      icon: AlertCircle,
      tone: 'danger',
    },
    {
      key: 'finalized',
      label: 'Finalized & Published',
      value: finalizedCount,
      hint: 'Synced with payroll',
      icon: CheckCircle2,
      tone: 'success',
    },
  ]

  const columns: Column<StaffAppraisal>[] = [
    {
      key: 'teacher',
      header: 'TEACHER',
      cell: (row: StaffAppraisal) => (
        <div className='flex flex-col'>
          <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
            {row.staff.name}
          </span>
          <span className='truncate font-mono text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            {row.employee_no || 'No Emp ID'} · {row.designation} {row.department ? `(${row.department})` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'period',
      header: 'REVIEW PERIOD',
      cell: (row: StaffAppraisal) => (
        <div className='flex flex-col'>
          <span className='text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
            {row.period}
          </span>
          <span className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            {row.review_date}
          </span>
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'PERFORMANCE RATING',
      cell: (row: StaffAppraisal) => {
        const ratingConfig = APPRAISAL_RATING_LABELS[row.overall_rating] ?? {
          label: row.overall_rating,
          tone: 'neutral' as const,
        }
        return (
          <div className='flex items-center gap-2'>
            <Badge tone={ratingConfig.tone} dot className='font-medium text-[11.5px]'>
              {ratingConfig.label}
            </Badge>
            <span className='tabular text-[12px] font-semibold text-slate-600 dark:text-slate-400'>
              {row.overall_score.toFixed(1)} / 5.0
            </span>
          </div>
        )
      },
    },
    {
      key: 'hike_track',
      header: 'HIKE TRACK',
      cell: (row: StaffAppraisal) => (
        <div className='flex flex-col gap-0.5 text-[12px] leading-[16px]'>
          <div className='flex items-center gap-1.5'>
            <span className='text-slate-500 dark:text-slate-400'>Requested:</span>
            {row.expected_increment_percent !== null ? (
              <span className='font-semibold text-[#127D48] dark:text-emerald-400'>
                {row.expected_increment_percent}%
              </span>
            ) : (
              <span className='italic text-slate-400'>Not specified</span>
            )}
          </div>
          <div className='flex items-center gap-1.5'>
            <span className='text-slate-500 dark:text-slate-400'>Approved:</span>
            <span className='font-semibold text-slate-900 dark:text-slate-100'>{row.increment_percent}%</span>
            <span className='text-[11px] text-slate-400 capitalize'>
              ({row.recommendation})
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      cell: (row: StaffAppraisal) => {
        const statusConfig = APPRAISAL_STATUS_LABELS[row.status] ?? {
          label: row.status,
          tone: 'neutral' as const,
        }
        return (
          <Badge tone={statusConfig.tone} dot className='font-medium text-[11.5px]'>
            {statusConfig.label}
          </Badge>
        )
      },
    },
    {
      key: 'actions',
      header: 'ACTION',
      align: 'right' as const,
      cell: (row: StaffAppraisal) => (
        <div className='flex items-center justify-end gap-1.5'>
          {row.status === 'appealed' && canApprove ? (
            <Button
              size='sm'
              variant='primary'
              className='bg-amber-600 hover:bg-amber-700 text-white'
              onClick={(e) => {
                e.stopPropagation()
                setAppealItem(row)
              }}
            >
              <MessageSquare className='size-3.5 stroke-[1.75]' />
              Review appeal
            </Button>
          ) : null}
          <Button
            size='icon-sm'
            variant='outline'
            aria-label={`View ${row.staff.name}`}
            title={canApprove && row.status !== 'finalized' ? 'Review & decide hike' : 'View appraisal'}
            className='border-[#EDF0EE] bg-white text-[#3C4440] hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            onClick={(e) => {
              e.stopPropagation()
              if (canApprove && row.status !== 'finalized') {
                setEditingItem(row)
              } else {
                setActiveItem(row)
              }
            }}
          >
            <Eye className='size-4 stroke-[1.75]' />
          </Button>

          {!canApprove && row.status !== 'finalized' && (
            <span className='flex items-center gap-1 text-[11px] text-slate-400 italic pl-1'>
              <Lock className='size-3 stroke-[1.75]' />
              Admin approval
            </span>
          )}
        </div>
      ),
    },
  ]

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted (Pending Approval)' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'appealed', label: 'Appealed (Disputes)' },
    { value: 'finalized', label: 'Finalized' },
  ]

  const ratingOptions = [
    { value: 'outstanding', label: 'Outstanding (4.6+)' },
    { value: 'exceeds_expectations', label: 'Exceeds Expectations (3.8 - 4.5)' },
    { value: 'meets_expectations', label: 'Meets Expectations (3.0 - 3.7)' },
    { value: 'needs_improvement', label: 'Needs Improvement (2.0 - 2.9)' },
    { value: 'unsatisfactory', label: 'Unsatisfactory (< 2.0)' },
  ]

  return (
    <Page>
      <PageHeader
        eyebrow='People'
        title='Performance & appraisals'
        description='Track teacher evaluation ratings, criteria breakdown, requested salary hike %, and management approvals.'
        actions={
          canApprove && (
            <div className='flex items-center gap-2'>
              <Button
                variant='secondary'
                size='sm'
                className='border-[#C6CEC9] bg-white text-[#171B19] hover:bg-[#F9FAFB] font-medium'
                onClick={() => setKraModalOpen(true)}
              >
                <Sliders className='size-4 stroke-[1.75]' />
                Configure KRAs
              </Button>
              <Button
                variant='secondary'
                size='sm'
                className='border-[#C6CEC9] bg-white text-[#171B19] hover:bg-[#F9FAFB] font-medium'
                onClick={() => setUploadModalOpen(true)}
              >
                <Upload className='size-4 stroke-[1.75]' />
                Upload ratings
              </Button>
              <Button
                variant='primary'
                size='sm'
                onClick={() => setConductModalOpen(true)}
              >
                <Plus className='size-4 stroke-[1.75]' />
                Rate staff
              </Button>
            </div>
          )
        }
      />

      {isPrincipal && (
        <div className='flex items-center gap-2.5 rounded-lg border border-[#EDF0EE] bg-[#EAF7F0]/40 p-3 text-[12px] leading-[16px] text-slate-700 dark:border-slate-800 dark:bg-emerald-950/20 dark:text-slate-300'>
          <Sparkles className='size-4 text-[#127D48] shrink-0 stroke-[1.75]' />
          <span>
            <strong className='font-semibold text-slate-900 dark:text-slate-100'>Principal & Management Evaluation Track:</strong> You have full evaluation authority to rate teaching staff against active school KRAs, review teacher performance dossiers, and determine salary increment percentages.
          </span>
        </div>
      )}

      <InsightCards items={cards} />

      <ListToolbar>
        <SearchBox
          value={search.search ?? ''}
          placeholder='Search teacher or review period…'
          label='Search reviews'
          onChange={(val) => setSearch({ search: val || undefined })}
        />
        <FilterSelect
          id='status-filter'
          label='Status'
          value={search.status}
          options={statusOptions}
          allLabel='All Statuses'
          onChange={(val) => setSearch({ status: (val as AppraisalStatus) || undefined })}
        />
        <FilterSelect
          id='rating-filter'
          label='Rating'
          value={search.rating}
          options={ratingOptions}
          allLabel='All Ratings'
          onChange={(val) => setSearch({ rating: (val as OverallRating) || undefined })}
        />
      </ListToolbar>

      <Card className='overflow-hidden border border-[#EDF0EE] bg-white dark:border-slate-800 dark:bg-slate-900'>
        <DataTable<StaffAppraisal>
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          onRowClick={(row) => {
            if (canApprove && row.status !== 'finalized') {
              setEditingItem(row)
            } else {
              setActiveItem(row)
            }
          }}
          loading={appraisals.isLoading}
          empty={{
            icon: Award,
            title: 'No performance reviews found',
            description: 'No staff performance reviews match the current filters.',
            action: canApprove && (
              <Button
                variant='primary'
                size='sm'
                onClick={() => setConductModalOpen(true)}
              >
                <Plus className='size-4 stroke-[1.75]' />
                Rate staff
              </Button>
            ),
          }}
          card={(row) => (
            <div className='flex flex-col gap-2 p-3 text-[13px]'>
              <div className='flex items-start justify-between gap-2'>
                <div>
                  <span className='font-semibold text-slate-900 dark:text-slate-100'>{row.staff.name}</span>
                  <p className='font-mono text-[12px] text-slate-500 dark:text-slate-400'>
                    {row.employee_no} · {row.designation}
                  </p>
                </div>
                <Badge tone={APPRAISAL_RATING_LABELS[row.overall_rating]?.tone ?? 'neutral'} dot className='text-[11.5px] font-medium'>
                  {APPRAISAL_RATING_LABELS[row.overall_rating]?.label ?? row.overall_rating}
                </Badge>
              </div>
              <div className='flex items-center justify-between text-[12px] text-slate-500 dark:text-slate-400'>
                <span>
                  Req:{' '}
                  {row.expected_increment_percent !== null
                    ? `${row.expected_increment_percent}%`
                    : '—'}
                </span>
                <span>
                  Approved:{' '}
                  <strong className='font-semibold text-slate-900 dark:text-slate-100'>{row.increment_percent}%</strong>
                </span>
              </div>
            </div>
          )}
        />
      </Card>

      {/* Read-Only Details Modal */}
      {activeItem && (
        <AppraisalDetailModal
          item={activeItem}
          canApprove={canApprove}
          onClose={() => setActiveItem(null)}
          onEditHike={(item) => {
            setActiveItem(null)
            setEditingItem(item)
          }}
          onReviewAppeal={(item) => {
            setActiveItem(null)
            setAppealItem(item)
          }}
          onRaiseAppeal={(item) => {
            setActiveItem(null)
            setRaiseAppealItem(item)
          }}
        />
      )}

      {/* Management Review, Edit Hike & Approval Modal */}
      {editingItem && (
        <AppraisalReviewModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={() => {
            setEditingItem(null)
            void appraisals.refetch()
          }}
        />
      )}

      {/* Review Teacher Appeal Modal */}
      {appealItem && (
        <ReviewAppealModal
          item={appealItem}
          onClose={() => setAppealItem(null)}
          onResolved={() => {
            setAppealItem(null)
            void appraisals.refetch()
          }}
        />
      )}

      {/* Raise Appeal Modal (Teacher / Preview) */}
      {raiseAppealItem && (
        <RaiseAppealModal
          item={raiseAppealItem}
          open={Boolean(raiseAppealItem)}
          onClose={() => setRaiseAppealItem(null)}
          onAppealed={() => {
            setRaiseAppealItem(null)
            void appraisals.refetch()
          }}
        />
      )}

      {/* KRA Configuration Modal */}
      <KraConfigurationModal
        open={kraModalOpen}
        onClose={() => setKraModalOpen(false)}
      />

      {/* Conduct Appraisal / Rate Staff Modal */}
      {conductModalOpen && (
        <ConductAppraisalModal
          onClose={() => setConductModalOpen(false)}
          onCreated={() => {
            setConductModalOpen(false)
            void appraisals.refetch()
          }}
        />
      )}

      {/* Upload Ratings (CSV/Excel) Modal */}
      {uploadModalOpen && (
        <UploadRatingsModal
          onClose={() => setUploadModalOpen(false)}
          onSuccess={() => {
            setUploadModalOpen(false)
            void appraisals.refetch()
          }}
        />
      )}
    </Page>
  )
}

function StaffPerformanceHistoryDossier({
  metrics,
  isLoading,
}: {
  metrics?: StaffPerformanceMetrics
  isLoading?: boolean
}) {
  const [tab, setTab] = useState<'workload' | 'homework' | 'academics' | 'feedback' | 'attendance'>('workload')

  if (isLoading) {
    return (
      <div className='rounded-lg border border-border p-4 text-center text-xs text-muted-foreground animate-pulse'>
        Loading teacher performance history, timetable, exam results, and ratings…
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className='rounded-lg border border-border p-3 text-xs text-muted-foreground'>
        No performance history records found for this teacher.
      </div>
    )
  }

  const passPct = metrics.student_pass_percentage ?? 0
  const failPct =
    metrics.student_fail_percentage ??
    (metrics.student_pass_percentage !== null ? Math.round((100 - metrics.student_pass_percentage) * 10) / 10 : 0)

  return (
    <div className='rounded-lg border border-border bg-card p-3.5 space-y-3'>
      {/* Dossier Header with View Selector */}
      <div className='flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5'>
        <div className='flex items-center gap-2'>
          <div className='rounded-md bg-primary/10 p-1.5 text-primary'>
            <GraduationCap className='h-4 w-4' />
          </div>
          <div>
            <h4 className='font-semibold text-foreground text-xs'>
              Teacher Performance & Activity History
            </h4>
            <p className='text-[11px] text-muted-foreground'>
              Timetable classes, homework posts, parent/student ratings, and pass/fail stats to guide evaluation.
            </p>
          </div>
        </div>

        <SegmentedControl
          label='Performance History Views'
          value={tab}
          onChange={(val) => setTab(val as typeof tab)}
          options={[
            { value: 'workload', label: 'Classes & Workload' },
            { value: 'homework', label: 'Homework Given' },
            { value: 'academics', label: 'Pass / Fail' },
            { value: 'feedback', label: 'Parent & Student Ratings' },
            { value: 'attendance', label: 'Attendance' },
          ]}
        />
      </div>

      {/* 4 Pillars Stat Strip */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 text-center'>
        {/* Attendance */}
        <div className='rounded-lg bg-muted/30 p-2.5 border border-border/40'>
          <div className='flex items-center justify-center gap-1 text-[10px] uppercase font-semibold text-muted-foreground'>
            <Clock className='h-3 w-3 text-primary' />
            <span>Attendance</span>
          </div>
          <span className='text-base font-bold text-foreground block mt-0.5'>
            {metrics.attendance_percentage}%
          </span>
          <span className='text-[10px] text-muted-foreground block truncate'>
            {metrics.present_days} present / {metrics.total_working_days} days
          </span>
        </div>

        {/* Pass / Fail */}
        <div className='rounded-lg bg-muted/30 p-2.5 border border-border/40'>
          <div className='flex items-center justify-center gap-1 text-[10px] uppercase font-semibold text-muted-foreground'>
            <TrendingUp className='h-3 w-3 text-success' />
            <span>Pass / Fail Rate</span>
          </div>
          <span className='text-base font-bold text-success block mt-0.5'>
            {metrics.student_pass_percentage !== null ? `${metrics.student_pass_percentage}%` : 'N/A'}
          </span>
          <span className='text-[10px] text-muted-foreground block truncate'>
            {metrics.passed_students} pass · {metrics.failed_students} fail
          </span>
        </div>

        {/* Parent & Student Feedback */}
        <div className='rounded-lg bg-muted/30 p-2.5 border border-border/40'>
          <div className='flex items-center justify-center gap-1 text-[10px] uppercase font-semibold text-muted-foreground'>
            <Star className='h-3 w-3 text-amber-500 fill-amber-500' />
            <span>Parent Rating</span>
          </div>
          <span className='text-base font-bold text-foreground block mt-0.5'>
            {metrics.parent_rating_average !== null ? `${metrics.parent_rating_average} ★` : '—'}
          </span>
          <span className='text-[10px] text-muted-foreground block truncate'>
            {metrics.parent_rating_count} parent reviews
          </span>
        </div>

        {/* Workload */}
        <div className='rounded-lg bg-muted/30 p-2.5 border border-border/40'>
          <div className='flex items-center justify-center gap-1 text-[10px] uppercase font-semibold text-muted-foreground'>
            <BookOpen className='h-3 w-3 text-primary' />
            <span>Weekly Workload</span>
          </div>
          <span className='text-base font-bold text-foreground block mt-0.5'>
            {metrics.assigned_periods_per_week} Periods
          </span>
          <span className='text-[10px] text-muted-foreground block truncate'>
            {metrics.total_sections_taught} sections · {metrics.homework_count} HW
          </span>
        </div>
      </div>

      {/* Tab Specific Deep-Dive */}
      <div className='rounded-lg bg-muted/20 border border-border/40 p-3'>
        {/* Tab 1: Workload (Classes & Subjects) */}
        {tab === 'workload' && (
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='font-semibold text-foreground text-xs flex items-center gap-1.5'>
                <BookOpen className='h-3.5 w-3.5 text-primary' />
                Classes & Subjects Taught ({metrics.teaching_assignments?.length ?? 0} subject assignments)
              </span>
              <span className='text-[11px] font-medium text-primary'>
                Total: {metrics.assigned_periods_per_week} teaching periods / week
              </span>
            </div>

            {metrics.teaching_assignments && metrics.teaching_assignments.length > 0 ? (
              <div className='divide-y divide-border/40 border border-border/50 rounded-md overflow-hidden bg-card'>
                {metrics.teaching_assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className='flex items-center justify-between p-2 text-xs hover:bg-muted/30 transition-colors'
                  >
                    <div className='flex items-center gap-2'>
                      <Badge tone='neutral' className='text-[10px]'>
                        {assignment.class_name} - {assignment.section_name}
                      </Badge>
                      <span className='font-medium text-foreground'>{assignment.subject_name}</span>
                    </div>
                    <span className='font-semibold text-foreground'>
                      {assignment.periods_per_week} periods / week
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-xs text-muted-foreground italic py-1'>
                No specific class or subject assignments found for this teacher.
              </p>
            )}
          </div>
        )}

        {/* Tab 2: Homework History */}
        {tab === 'homework' && (
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='font-semibold text-foreground text-xs flex items-center gap-1.5'>
                <Calendar className='h-3.5 w-3.5 text-primary' />
                Homework & Assignment History ({metrics.homework_count} homework entries posted)
              </span>
              <span className='text-[11px] text-muted-foreground'>
                {metrics.diary_entries_count} total diary posts
              </span>
            </div>

            {metrics.recent_homework && metrics.recent_homework.length > 0 ? (
              <div className='divide-y divide-border/40 border border-border/50 rounded-md overflow-hidden bg-card'>
                {metrics.recent_homework.map((hw) => (
                  <div key={hw.id} className='p-2 text-xs space-y-0.5 hover:bg-muted/30'>
                    <div className='flex items-center justify-between'>
                      <span className='font-medium text-foreground truncate max-w-[70%]'>
                        {hw.title}
                      </span>
                      <span className='text-[10px] text-muted-foreground'>
                        {hw.due_date ? `Due: ${hw.due_date}` : new Date(hw.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className='flex items-center gap-2 text-[10px] text-muted-foreground'>
                      {hw.class_section && <Badge tone='neutral'>{hw.class_section}</Badge>}
                      {hw.subject_name && <span>{hw.subject_name}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-xs text-muted-foreground italic py-1'>
                No recent homework entries recorded for this teacher.
              </p>
            )}
          </div>
        )}

        {/* Tab 3: Academics (Pass vs Fail) */}
        {tab === 'academics' && (
          <div className='space-y-2.5'>
            <div className='flex items-center justify-between'>
              <span className='font-semibold text-foreground text-xs flex items-center gap-1.5'>
                <TrendingUp className='h-3.5 w-3.5 text-success' />
                Student Exam Pass & Fail Analysis
              </span>
              <span className='text-[11px] text-muted-foreground'>
                Total Evaluated: {metrics.total_students_evaluated} students
              </span>
            </div>

            {metrics.total_students_evaluated > 0 ? (
              <div className='space-y-2'>
                <div className='h-2.5 w-full rounded-full bg-destructive/20 overflow-hidden flex'>
                  <div
                    className='h-full bg-success transition-all'
                    style={{ width: `${passPct}%` }}
                  />
                  <div
                    className='h-full bg-destructive transition-all'
                    style={{ width: `${failPct}%` }}
                  />
                </div>

                <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1'>
                  <div className='rounded bg-card p-2 border border-border/40'>
                    <span className='text-[10px] uppercase text-muted-foreground block'>Passed</span>
                    <span className='text-sm font-bold text-success'>
                      {metrics.passed_students} ({passPct}%)
                    </span>
                  </div>
                  <div className='rounded bg-card p-2 border border-border/40'>
                    <span className='text-[10px] uppercase text-muted-foreground block'>Failed</span>
                    <span className='text-sm font-bold text-destructive'>
                      {metrics.failed_students} ({failPct}%)
                    </span>
                  </div>
                  <div className='rounded bg-card p-2 border border-border/40'>
                    <span className='text-[10px] uppercase text-muted-foreground block'>Total Students</span>
                    <span className='text-sm font-bold text-foreground'>
                      {metrics.total_students_evaluated}
                    </span>
                  </div>
                  <div className='rounded bg-card p-2 border border-border/40'>
                    <span className='text-[10px] uppercase text-muted-foreground block'>Class Average</span>
                    <span className='text-sm font-bold text-primary'>
                      {metrics.average_student_marks !== null ? `${metrics.average_student_marks} / 100` : '—'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className='text-xs text-muted-foreground italic py-1'>
                No exam mark records found for this teacher's subjects.
              </p>
            )}
          </div>
        )}

        {/* Tab 4: Parent & Student Feedback */}
        {tab === 'feedback' && (
          <div className='space-y-2.5'>
            <span className='font-semibold text-foreground text-xs flex items-center gap-1.5'>
              <MessageSquare className='h-3.5 w-3.5 text-amber-500' />
              Parent Ratings & Student Feedback
            </span>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
              <div className='rounded-md bg-card p-2.5 border border-border/50 space-y-1'>
                <div className='flex items-center justify-between'>
                  <span className='font-medium text-foreground text-xs'>Parent Rating</span>
                  <Badge tone='warning' className='text-[11px] font-bold'>
                    {metrics.parent_rating_average !== null ? `${metrics.parent_rating_average} ★` : 'No data'}
                  </Badge>
                </div>
                <p className='text-[11px] text-muted-foreground'>
                  Aggregated from <strong>{metrics.parent_rating_count}</strong> parent ratings across terms.
                </p>
              </div>

              <div className='rounded-md bg-card p-2.5 border border-border/50 space-y-1'>
                <div className='flex items-center justify-between'>
                  <span className='font-medium text-foreground text-xs'>Student Feedback</span>
                  <Badge tone='info' className='text-[11px] font-bold'>
                    {metrics.student_feedback_average !== null ? `${metrics.student_feedback_average} ★` : 'No data'}
                  </Badge>
                </div>
                <p className='text-[11px] text-muted-foreground'>
                  Based on <strong>{metrics.student_feedback_count}</strong> student study & behavior evaluations.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Attendance */}
        {tab === 'attendance' && (
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='font-semibold text-foreground text-xs flex items-center gap-1.5'>
                <Clock className='h-3.5 w-3.5 text-primary' />
                Teacher Attendance & Punctuality Breakdown
              </span>
              <span className='font-bold text-primary text-xs'>
                {metrics.attendance_percentage}% Overall Attendance
              </span>
            </div>

            <div className='grid grid-cols-3 gap-2 text-center pt-1'>
              <div className='rounded bg-card p-2 border border-border/40'>
                <span className='text-[10px] uppercase text-muted-foreground block'>Present Days</span>
                <span className='text-sm font-bold text-success'>{metrics.present_days}</span>
              </div>
              <div className='rounded bg-card p-2 border border-border/40'>
                <span className='text-[10px] uppercase text-muted-foreground block'>Absent / Leave</span>
                <span className='text-sm font-bold text-destructive'>{metrics.absent_days}</span>
              </div>
              <div className='rounded bg-card p-2 border border-border/40'>
                <span className='text-[10px] uppercase text-muted-foreground block'>Total Working Days</span>
                <span className='text-sm font-bold text-foreground'>{metrics.total_working_days}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AppraisalDetailModal({
  item,
  canApprove,
  onClose,
  onEditHike,
  onReviewAppeal,
  onRaiseAppeal,
}: {
  item: StaffAppraisal
  canApprove: boolean
  onClose: () => void
  onEditHike: (item: StaffAppraisal) => void
  onReviewAppeal?: (item: StaffAppraisal) => void
  onRaiseAppeal?: (item: StaffAppraisal) => void
}) {
  const metricsQuery = useTeacherMetrics(item.staff_id || item.user_id, item.academic_year_id)
  const metrics = metricsQuery.data

  return (
    <AppModal
      open={Boolean(item)}
      onOpenChange={(open) => !open && onClose()}
      title={`${item.staff.name} — Performance Review & Appraisal`}
      description={`${item.period} · Review Date: ${item.review_date}`}
      size='xl'
    >
      <div className='flex flex-col gap-4 text-xs max-h-[75vh] overflow-y-auto pr-1'>
        {/* Top Summary Header */}
        <div className='flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/30 p-3'>
          <div>
            <span className='font-semibold text-sm text-foreground'>{item.staff.name}</span>
            <p className='text-muted-foreground text-xs'>
              {item.employee_no} · {item.designation} · {item.department ?? 'All Subjects'}
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Badge tone={APPRAISAL_RATING_LABELS[item.overall_rating]?.tone ?? 'neutral'}>
              {APPRAISAL_RATING_LABELS[item.overall_rating]?.label ?? item.overall_rating}
            </Badge>
            <Badge tone={APPRAISAL_STATUS_LABELS[item.status]?.tone ?? 'neutral'}>
              {APPRAISAL_STATUS_LABELS[item.status]?.label ?? item.status}
            </Badge>
          </div>
        </div>

        {/* Objective Performance Dossier */}
        <StaffPerformanceHistoryDossier metrics={metrics} isLoading={metricsQuery.isLoading} />

        {/* Dynamic KRA Evaluation Breakdown */}
        <div className='rounded-lg border border-border p-3 space-y-2'>
          <div className='flex items-center justify-between'>
            <h4 className='font-semibold text-foreground flex items-center gap-1.5'>
              <Star className='h-3.5 w-3.5 text-primary' />
              Key Result Areas (KRA) Evaluation & Scores
            </h4>
            <span className='text-xs font-bold text-primary'>
              Overall: {item.overall_score.toFixed(1)} / 5.0
            </span>
          </div>

          <div className='space-y-1.5'>
            {item.kra_scores && item.kra_scores.length > 0 ? (
              item.kra_scores.map((kra) => (
                <div key={kra.code} className='p-2 rounded bg-muted/20 border border-border/40 space-y-1'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <span className='font-semibold text-foreground'>{kra.title}</span>
                      <Badge tone='info' className='text-[10px]'>{kra.weightage}% wt</Badge>
                    </div>
                    <span className='font-bold text-foreground'>{Number(kra.score).toFixed(1)} / 5.0</span>
                  </div>
                  {kra.remarks && (
                    <p className='text-[11px] text-muted-foreground italic leading-tight'>
                      "{kra.remarks}"
                    </p>
                  )}
                </div>
              ))
            ) : (
              [
                { label: 'Teaching Effectiveness (Curriculum)', score: item.teaching_effectiveness, weight: 25 },
                { label: 'Student Learning Outcomes', score: item.student_outcomes, weight: 25 },
                { label: 'Classroom Management & Culture', score: item.classroom_management, weight: 20 },
                { label: 'Professional Conduct & Punctuality', score: item.professional_conduct, weight: 15 },
                { label: 'Extracurricular Contribution & Initiatives', score: item.extracurricular_contribution, weight: 15 },
              ].map((c) => (
                <div key={c.label} className='flex items-center justify-between py-1 border-b border-border/40'>
                  <div className='flex items-center gap-2'>
                    <span className='text-muted-foreground'>{c.label}</span>
                    <Badge tone='neutral' className='text-[10px]'>{c.weight}% wt</Badge>
                  </div>
                  <span className='font-semibold text-foreground'>{c.score.toFixed(1)} / 5.0</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Teacher Requested Hike vs Approved Hike */}
        <div className='rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2'>
          <h4 className='font-semibold text-primary flex items-center gap-1.5'>
            <Percent className='h-3.5 w-3.5' />
            Salary Hike & Increment Track
          </h4>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <div className='rounded bg-card p-2 border border-border/60'>
              <span className='block text-muted-foreground text-[10px] uppercase font-medium'>
                Teacher Requested Hike
              </span>
              <span className='text-base font-bold text-primary'>
                {item.expected_increment_percent !== null ? `${item.expected_increment_percent}%` : 'Not specified'}
              </span>
              {item.hike_justification && (
                <p className='mt-1 text-muted-foreground text-[11px] leading-relaxed'>
                  <strong>Justification:</strong> {item.hike_justification}
                </p>
              )}
            </div>
            <div className='rounded bg-card p-2 border border-border/60'>
              <span className='block text-muted-foreground text-[10px] uppercase font-medium'>
                Management Approved Hike
              </span>
              <span className='text-base font-bold text-success'>
                {item.increment_percent}%
              </span>
              <p className='mt-1 text-muted-foreground text-[11px]'>
                <strong>Decision:</strong> {RECOMMENDATION_LABELS[item.recommendation] ?? item.recommendation}
              </p>
            </div>
          </div>
        </div>

        {/* Appeal & Dispute Tracking Card if Appealed */}
        {item.appeal_status && item.appeal_status !== 'none' && (
          <div className='rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-2'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300'>
                <AlertCircle className='h-4 w-4' />
                <span>Appraisal Appeal Status: {item.appeal_status.toUpperCase()}</span>
              </div>
              <Badge
                tone={
                  item.appeal_status === 'resolved'
                    ? 'success'
                    : item.appeal_status === 'rejected'
                    ? 'danger'
                    : 'warning'
                }
              >
                {item.appeal_status === 'pending' ? 'Pending Management Review' : item.appeal_status}
              </Badge>
            </div>
            {item.appeal_reason && (
              <p className='text-xs text-muted-foreground bg-card/60 rounded p-2 border border-border/40'>
                <strong>Teacher's Appeal Justification:</strong> {item.appeal_reason}
                {item.appeal_requested_hike !== null && (
                  <span className='block text-primary font-bold mt-0.5'>
                    Requested Hike: {item.appeal_requested_hike}%
                  </span>
                )}
              </p>
            )}
            {item.appeal_feedback && (
              <p className='text-xs text-foreground bg-emerald-500/10 rounded p-2 border border-emerald-500/20'>
                <strong>Management Feedback:</strong> {item.appeal_feedback}
              </p>
            )}
          </div>
        )}

        {/* Qualitative Feedback */}
        {(item.strengths || item.areas_for_improvement || item.goals_next_period || item.reviewer_remarks) && (
          <div className='rounded-lg border border-border p-3 space-y-2'>
            <h4 className='font-semibold text-foreground'>Reviewer Assessment & Remarks</h4>
            {item.strengths && (
              <p className='text-muted-foreground'>
                <strong className='text-foreground'>Strengths:</strong> {item.strengths}
              </p>
            )}
            {item.areas_for_improvement && (
              <p className='text-muted-foreground'>
                <strong className='text-foreground'>Areas for Improvement:</strong> {item.areas_for_improvement}
              </p>
            )}
            {item.goals_next_period && (
              <p className='text-muted-foreground'>
                <strong className='text-foreground'>Goals for Next Period:</strong> {item.goals_next_period}
              </p>
            )}
            {item.reviewer_remarks && (
              <p className='text-muted-foreground'>
                <strong className='text-foreground'>Reviewer Remarks:</strong> {item.reviewer_remarks}
              </p>
            )}
          </div>
        )}

        {/* Staff Remarks */}
        {item.staff_remarks && (
          <div className='rounded-lg border border-border p-3 space-y-1 bg-muted/20'>
            <h4 className='font-semibold text-foreground'>Teacher Acknowledgment Remarks</h4>
            <p className='text-muted-foreground italic'>{item.staff_remarks}</p>
          </div>
        )}

        {/* Action Footer */}
        <div className='flex items-center justify-between pt-2 border-t border-border'>
          <span className='text-[11px] text-muted-foreground'>
            Reviewer: {item.reviewer.name}
          </span>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' onClick={onClose}>
              Close
            </Button>
            {item.status === 'finalized' && (!item.appeal_status || item.appeal_status === 'none') && (
              <Button
                size='sm'
                variant='outline'
                className='text-amber-700 border-amber-500/40 hover:bg-amber-500/10 text-xs'
                onClick={() => {
                  onClose()
                  onRaiseAppeal?.(item)
                }}
              >
                <AlertCircle className='mr-1.5 h-3.5 w-3.5' />
                Raise Appeal / Request Review
              </Button>
            )}
            {canApprove && (item.status === 'appealed' || item.appeal_status === 'pending') && (
              <Button
                size='sm'
                variant='default'
                className='bg-amber-600 hover:bg-amber-700 text-white text-xs'
                onClick={() => {
                  onClose()
                  onReviewAppeal?.(item)
                }}
              >
                <MessageSquare className='mr-1.5 h-3.5 w-3.5' />
                Review & Resolve Appeal
              </Button>
            )}
            {canApprove && item.status !== 'finalized' && item.status !== 'appealed' && (
              <Button size='sm' variant='default' onClick={() => onEditHike(item)}>
                <Edit3 className='mr-1 h-3.5 w-3.5' />
                Review & Decide Hike
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppModal>
  )
}

function AppraisalReviewModal({
  item,
  onClose,
  onSaved,
}: {
  item: StaffAppraisal
  onClose: () => void
  onSaved: () => void
}) {
  const metricsQuery = useTeacherMetrics(item.staff_id || item.user_id, item.academic_year_id)
  const metrics = metricsQuery.data

  const kraQuery = useKraConfigs()
  const kras = useMemo(() => kraQuery.data ?? [], [kraQuery.data])

  const [kraScores, setKraScores] = useState<Record<string, { score: number; remarks: string }>>(() => {
    const initial: Record<string, { score: number; remarks: string }> = {}
    if (item.kra_scores && item.kra_scores.length > 0) {
      for (const k of item.kra_scores) {
        initial[k.code] = { score: Number(k.score) || 4.0, remarks: k.remarks ?? '' }
      }
    }
    return initial
  })

  const effectiveKraScores = useMemo(() => {
    const res: Record<string, { score: number; remarks: string }> = { ...kraScores }
    for (const k of kras) {
      if (!res[k.code]) {
        let defaultScore = 4.0
        if (k.code === 'curriculum_pedagogy') defaultScore = item.teaching_effectiveness
        else if (k.code === 'student_outcomes') defaultScore = item.student_outcomes
        else if (k.code === 'classroom_management') defaultScore = item.classroom_management
        else if (k.code === 'professional_conduct') defaultScore = item.professional_conduct
        else if (k.code === 'extracurricular') defaultScore = item.extracurricular_contribution

        res[k.code] = { score: defaultScore, remarks: '' }
      }
    }
    return res
  }, [kras, kraScores, item])

  const [incrementPercent, setIncrementPercent] = useState<number>(item.increment_percent)
  const [recommendation, setRecommendation] = useState<string>(item.recommendation)
  const [reviewerRemarks, setReviewerRemarks] = useState<string>(item.reviewer_remarks ?? '')

  const [showMoreFeedback, setShowMoreFeedback] = useState(false)
  const [strengths, setStrengths] = useState<string>(item.strengths ?? '')
  const [areasForImprovement, setAreasForImprovement] = useState<string>(item.areas_for_improvement ?? '')
  const [goalsNextPeriod, setGoalsNextPeriod] = useState<string>(item.goals_next_period ?? '')

  const [isSaving, setIsSaving] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)

  const overallScore = useMemo(() => {
    if (kras.length > 0) {
      let weightedSum = 0
      let totalWeight = 0
      for (const k of kras) {
        const sc = effectiveKraScores[k.code]?.score ?? 4.0
        const wt = Number(k.weightage_percent) || 0
        weightedSum += sc * wt
        totalWeight += wt
      }
      return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : item.overall_score
    }
    return item.overall_score
  }, [kras, effectiveKraScores, item.overall_score])

  const overallRating = computeRating(overallScore)
  const ratingConfig = APPRAISAL_RATING_LABELS[overallRating]

  const suggestedHikePct = useMemo(() => {
    if (overallScore >= 4.6) return 15
    if (overallScore >= 3.8) return 10
    if (overallScore >= 3.0) return 6
    if (overallScore >= 2.0) return 2
    return 0
  }, [overallScore])

  const recommendationOptions = [
    { value: 'increment', label: 'Annual Increment' },
    { value: 'promotion', label: 'Promotion & Increment' },
    { value: 'retention', label: 'Retention Special Bonus' },
    { value: 'pip', label: 'Performance Improvement Plan (PIP)' },
  ]

  const quickHikePresets = [0, 5, 8, 10, 12, 15, 20, 25, 50]

  const handleSave = async (finalize = false) => {
    try {
      if (finalize) {
        setIsFinalizing(true)
      } else {
        setIsSaving(true)
      }

      const kraScorePayload: KraScoreItem[] = kras.map((k) => ({
        kra_id: k.id,
        code: k.code,
        title: k.title,
        weightage: Number(k.weightage_percent),
        score: effectiveKraScores[k.code]?.score ?? 4.0,
        remarks: effectiveKraScores[k.code]?.remarks || null,
      }))

      const payload = {
        increment_percent: Number(incrementPercent),
        recommendation: recommendation as 'increment' | 'promotion' | 'retention' | 'pip',
        reviewer_remarks: reviewerRemarks || null,
        kra_scores: kraScorePayload,
        teaching_effectiveness: effectiveKraScores['curriculum_pedagogy']?.score ?? item.teaching_effectiveness,
        student_outcomes: effectiveKraScores['student_outcomes']?.score ?? item.student_outcomes,
        classroom_management: effectiveKraScores['classroom_management']?.score ?? item.classroom_management,
        professional_conduct: effectiveKraScores['professional_conduct']?.score ?? item.professional_conduct,
        extracurricular_contribution: effectiveKraScores['extracurricular']?.score ?? item.extracurricular_contribution,
        strengths: strengths || null,
        areas_for_improvement: areasForImprovement || null,
        goals_next_period: goalsNextPeriod || null,
      }

      await appraisalsApi.update(item.id, payload)

      if (finalize) {
        await appraisalsApi.finalize(item.id)
        alerts.success('Appraisal approved and published', {
          description: `${item.staff.name}'s review is finalized with ${incrementPercent}% approved increment.`,
        })
      } else {
        alerts.success('Appraisal draft saved', {
          description: `Updated scores and approved hike to ${incrementPercent}%.`,
        })
      }

      onSaved()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed'
      alerts.error('Operation failed', { description: msg })
    } finally {
      setIsSaving(false)
      setIsFinalizing(false)
    }
  }

  return (
    <AppModal
      open={Boolean(item)}
      onOpenChange={(open) => !open && onClose()}
      title={`Review & Decide Hike — ${item.staff.name}`}
      description={`${item.period} · Emp: ${item.employee_no || 'N/A'} · Designation: ${item.designation}`}
      size='xl'
    >
      <div className='flex flex-col gap-4 text-xs max-h-[75vh] overflow-y-auto pr-1'>
        {/* Teacher Requested Hike Banner */}
        <div className='rounded-lg border border-primary/30 bg-primary/5 p-3.5 space-y-2'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-1.5 font-semibold text-primary text-sm'>
              <Sparkles className='h-4 w-4' />
              <span>Teacher Hike Request</span>
            </div>
            {item.expected_increment_percent !== null ? (
              <Badge tone='info' className='text-xs px-2.5 py-0.5 font-bold'>
                {item.expected_increment_percent}% Requested
              </Badge>
            ) : (
              <Badge tone='neutral'>No hike requested</Badge>
            )}
          </div>
          {item.hike_justification ? (
            <p className='text-muted-foreground leading-relaxed text-xs bg-card/60 rounded p-2.5 border border-border/40'>
              <strong className='text-foreground font-medium'>Teacher's Justification:</strong>{' '}
              {item.hike_justification}
            </p>
          ) : (
            <p className='text-muted-foreground italic text-[11px]'>
              Teacher did not provide an explicit hike percentage justification.
            </p>
          )}
        </div>

        {/* Objective Teacher Performance History & Indicators */}
        <StaffPerformanceHistoryDossier metrics={metrics} isLoading={metricsQuery.isLoading} />

        {/* Dynamic Criteria Evaluation & Rating (Guided by Historical Metrics) */}
        <div className='rounded-lg border border-border p-3 space-y-3'>
          <div className='flex items-center justify-between'>
            <div>
              <h4 className='font-semibold text-foreground flex items-center gap-1.5'>
                <Star className='h-3.5 w-3.5 text-primary' />
                Evaluation Criteria & Scores (1.0 to 5.0)
              </h4>
              <p className='text-[11px] text-muted-foreground'>
                Assign scores based on the teacher's objective homework activity, attendance, pass rate, and parent feedback above.
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <span className='font-bold text-foreground text-xs'>
                Overall: {overallScore.toFixed(1)} / 5.0
              </span>
              <Badge tone={ratingConfig?.tone ?? 'neutral'}>
                {ratingConfig?.label ?? overallRating}
              </Badge>
            </div>
          </div>

          {/* Dynamic KRA Dimensions */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            {kras.map((kra) => {
              const currentScore = kraScores[kra.code]?.score ?? 4.0
              const currentRemarks = kraScores[kra.code]?.remarks ?? ''
              return (
                <div key={kra.id} className='rounded-md border border-border/70 p-2.5 bg-card/50 space-y-2'>
                  <div className='flex items-start justify-between gap-1'>
                    <div>
                      <span className='font-semibold text-foreground text-xs'>{kra.title}</span>
                      <p className='text-[10px] text-muted-foreground'>{kra.description || 'Evaluation dimension'}</p>
                    </div>
                    <Badge tone='info' className='text-[10px] shrink-0 font-bold'>
                      {kra.weightage_percent}% wt
                    </Badge>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Label htmlFor={`review-score-${kra.code}`} className='text-[11px] text-muted-foreground shrink-0'>
                      Score (1.0 - 5.0):
                    </Label>
                    <Input
                      id={`review-score-${kra.code}`}
                      type='number'
                      min={1}
                      max={5}
                      step={0.1}
                      className='h-8 w-16 text-center text-xs font-bold'
                      value={currentScore}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 1
                        setKraScores((prev) => ({
                          ...prev,
                          [kra.code]: { score: val, remarks: prev[kra.code]?.remarks ?? '' },
                        }))
                      }}
                    />
                    <div className='flex items-center gap-0.5'>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type='button'
                          onClick={() => {
                            setKraScores((prev) => ({
                              ...prev,
                              [kra.code]: { score: star, remarks: prev[kra.code]?.remarks ?? '' },
                            }))
                          }}
                          className={`p-1 rounded hover:bg-muted ${
                            currentScore >= star ? 'text-amber-500' : 'text-muted-foreground/30'
                          }`}
                        >
                          <Star className='h-3.5 w-3.5 fill-current' />
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input
                    className='h-7 text-[11px] text-muted-foreground'
                    placeholder='Evaluator observation note for this KRA…'
                    value={currentRemarks}
                    onChange={(e) => {
                      const remarksVal = e.target.value
                      setKraScores((prev) => ({
                        ...prev,
                        [kra.code]: { score: prev[kra.code]?.score ?? 4.0, remarks: remarksVal },
                      }))
                    }}
                  />
                </div>
              )
            })}
          </div>

          {/* Quick Hike Recommendation helper */}
          <div className='flex items-center justify-between rounded bg-primary/5 p-2.5 border border-primary/20'>
            <div className='flex items-center gap-2'>
              <Sparkles className='h-4 w-4 text-primary' />
              <span className='text-xs text-foreground'>
                Suggested Hike for <strong>{ratingConfig?.label ?? overallRating}</strong>:{' '}
                <strong className='text-primary'>{suggestedHikePct}%</strong>
              </span>
            </div>
            <Button
              type='button'
              size='sm'
              variant='outline'
              className='h-7 text-xs text-primary border-primary/30 hover:bg-primary/10'
              onClick={() => setIncrementPercent(suggestedHikePct)}
            >
              Apply Suggested {suggestedHikePct}%
            </Button>
          </div>
        </div>

        {/* Management Decision: Hike % & Recommendation */}
        <div className='rounded-lg border border-border p-3 space-y-3 bg-muted/10'>
          <h4 className='font-semibold text-foreground flex items-center gap-1.5'>
            <Percent className='h-3.5 w-3.5 text-primary' />
            Management Approved Increment & Recommendation
          </h4>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <FormField
              id='increment_percent'
              label='Approved Salary Hike (%)'
              hint='Adjust the percentage increment granted by management'
              required
            >
              <div className='flex items-center gap-2'>
                <Input
                  id='increment_percent'
                  type='number'
                  min={0}
                  max={100}
                  step={0.5}
                  value={incrementPercent}
                  onChange={(e) => setIncrementPercent(parseFloat(e.target.value) || 0)}
                  className='font-bold text-foreground'
                />
                <span className='text-sm font-semibold text-muted-foreground'>%</span>
              </div>
            </FormField>

            <FormField
              id='recommendation'
              label='Appraisal Recommendation'
              hint='Select the official administrative outcome'
              required
            >
              <Combobox
                id='recommendation'
                label='Recommendation'
                value={recommendation}
                options={recommendationOptions}
                onChange={(val) => val && setRecommendation(val)}
                placeholder='Select recommendation'
              />
            </FormField>
          </div>

          {/* Quick preset chips */}
          <div className='flex flex-wrap items-center gap-1.5 pt-1'>
            <span className='text-[10px] uppercase font-semibold text-muted-foreground mr-1'>
              Quick Presets:
            </span>
            {quickHikePresets.map((pct) => (
              <Button
                key={pct}
                type='button'
                size='sm'
                variant={incrementPercent === pct ? 'default' : 'outline'}
                className='h-6 text-[11px] px-2 rounded-full'
                onClick={() => setIncrementPercent(pct)}
              >
                {pct}%
              </Button>
            ))}
          </div>
        </div>

        {/* Management Reviewer Remarks */}
        <div className='rounded-lg border border-border p-3 space-y-2'>
          <Label htmlFor='reviewer_remarks'>
            Management / Reviewer Decision Remarks
          </Label>
          <Textarea
            id='reviewer_remarks'
            rows={3}
            value={reviewerRemarks}
            onChange={(e) => setReviewerRemarks(e.target.value)}
            placeholder='State the reason for approving this increment percentage (e.g., "50% hike was requested; approved 15% exceptional merit increment for outstanding 100% board examination distinctions.")'
          />
        </div>

        {/* Collapsible Additional Feedback (Strengths, Areas for Improvement, Goals) */}
        <div className='rounded-lg border border-border p-3 space-y-2'>
          <button
            type='button'
            className='w-full flex items-center justify-between text-xs font-semibold text-foreground'
            onClick={() => setShowMoreFeedback((prev) => !prev)}
          >
            <span>Additional Qualitative Feedback (Strengths & Goals)</span>
            {showMoreFeedback ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
          </button>

          {showMoreFeedback && (
            <div className='space-y-3 pt-2 border-t border-border/50'>
              <FormField id='strengths' label='Key Strengths'>
                <Textarea
                  id='strengths'
                  rows={2}
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  placeholder='Notable competencies and achievements'
                />
              </FormField>

              <FormField id='areas_for_improvement' label='Areas for Improvement'>
                <Textarea
                  id='areas_for_improvement'
                  rows={2}
                  value={areasForImprovement}
                  onChange={(e) => setAreasForImprovement(e.target.value)}
                  placeholder='Aspects requiring mentorship or professional growth'
                />
              </FormField>

              <FormField id='goals_next_period' label='Goals for Next Academic Period'>
                <Textarea
                  id='goals_next_period'
                  rows={2}
                  value={goalsNextPeriod}
                  onChange={(e) => setGoalsNextPeriod(e.target.value)}
                  placeholder='Target objectives and key milestones'
                />
              </FormField>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className='flex items-center justify-between pt-2 border-t border-border'>
          <Button variant='outline' size='sm' onClick={onClose} disabled={isSaving || isFinalizing}>
            Cancel
          </Button>
          <div className='flex items-center gap-2'>
            <Button
              variant='secondary'
              size='sm'
              className='border-[#C6CEC9] bg-white text-[#171B19] hover:bg-[#F9FAFB] font-medium'
              disabled={isSaving || isFinalizing}
              onClick={() => void handleSave(false)}
            >
              <Save className='size-3.5 stroke-[1.75]' />
              {isSaving ? 'Saving…' : 'Save Changes'}
            </Button>
            <Button
              variant='primary'
              size='sm'
              disabled={isSaving || isFinalizing}
              onClick={() => void handleSave(true)}
            >
              <UserCheck className='size-3.5 stroke-[1.75]' />
              {isFinalizing ? 'Finalizing…' : 'Approve & Finalize'}
            </Button>
          </div>
        </div>
      </div>
    </AppModal>
  )
}

function ConductAppraisalModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const staffQuery = useStaffList({ page: 1, limit: 100, status: 'active' })
  const staffItems = useMemo(() => staffQuery.data?.items ?? [], [staffQuery.data?.items])

  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null)
  const selectedStaff = useMemo(
    () => staffItems.find((s) => s.id === selectedStaffId) ?? null,
    [staffItems, selectedStaffId]
  )

  const kraQuery = useKraConfigs()
  const kras = useMemo(() => kraQuery.data ?? [], [kraQuery.data])
  const [kraScores, setKraScores] = useState<Record<string, { score: number; remarks: string }>>({})

  const [period, setPeriod] = useState('2026-27 Annual Review')
  const [reviewDate, setReviewDate] = useState(new Date().toISOString().slice(0, 10))

  const metricsQuery = useTeacherMetrics(selectedStaffId)
  const metrics = metricsQuery.data

  const [expectedHike, setExpectedHike] = useState<string>('')
  const [hikeJustification, setHikeJustification] = useState<string>('')
  const [incrementPercent, setIncrementPercent] = useState<number>(10)
  const [recommendation, setRecommendation] = useState<string>('increment')
  const [reviewerRemarks, setReviewerRemarks] = useState<string>('')

  const [showMoreFeedback, setShowMoreFeedback] = useState(false)
  const [strengths, setStrengths] = useState<string>('')
  const [areasForImprovement, setAreasForImprovement] = useState<string>('')
  const [goalsNextPeriod, setGoalsNextPeriod] = useState<string>('')

  const [uploadedDoc, setUploadedDoc] = useState<UploadedFile | null>(null)
  const [isUploadingDoc, setIsUploadingDoc] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const overallScore = useMemo(() => {
    if (kras.length > 0) {
      let weightedSum = 0
      let totalWeight = 0
      for (const k of kras) {
        const sc = kraScores[k.code]?.score ?? 4.0
        const wt = Number(k.weightage_percent) || 0
        weightedSum += sc * wt
        totalWeight += wt
      }
      return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 4.0
    }
    return 4.0
  }, [kras, kraScores])

  const overallRating = computeRating(overallScore)
  const ratingConfig = APPRAISAL_RATING_LABELS[overallRating]

  const suggestedHikePct = useMemo(() => {
    if (overallScore >= 4.6) return 15
    if (overallScore >= 3.8) return 10
    if (overallScore >= 3.0) return 6
    if (overallScore >= 2.0) return 2
    return 0
  }, [overallScore])

  const recommendationOptions = [
    { value: 'increment', label: 'Annual Increment' },
    { value: 'promotion', label: 'Promotion & Increment' },
    { value: 'retention', label: 'Retention Special Bonus' },
    { value: 'pip', label: 'Performance Improvement Plan (PIP)' },
  ]

  const quickHikePresets = [0, 5, 8, 10, 12, 15, 20, 25, 50]

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setIsUploadingDoc(true)
      const res = await filesApi.upload(file, 'appraisal_doc')
      setUploadedDoc(res)
      alerts.success('Supporting document attached', { description: file.name })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      alerts.error('Document upload failed', { description: msg })
    } finally {
      setIsUploadingDoc(false)
    }
  }

  const handleSubmit = async (finalize = false) => {
    if (!selectedStaffId) {
      alerts.error('Please select a staff member to evaluate')
      return
    }

    try {
      setIsSubmitting(true)
      const kraScorePayload: KraScoreItem[] = kras.map((k) => ({
        kra_id: k.id,
        code: k.code,
        title: k.title,
        weightage: Number(k.weightage_percent),
        score: kraScores[k.code]?.score ?? 4.0,
        remarks: kraScores[k.code]?.remarks || null,
      }))

      const payload: Record<string, unknown> = {
        staff_id: selectedStaffId,
        period,
        review_date: reviewDate,
        kra_scores: kraScorePayload,
        teaching_effectiveness: kraScores['curriculum_pedagogy']?.score ?? 4.0,
        student_outcomes: kraScores['student_outcomes']?.score ?? 4.0,
        classroom_management: kraScores['classroom_management']?.score ?? 4.0,
        professional_conduct: kraScores['professional_conduct']?.score ?? 4.5,
        extracurricular_contribution: kraScores['extracurricular']?.score ?? 4.0,
        expected_increment_percent: expectedHike ? parseFloat(expectedHike) : null,
        hike_justification: hikeJustification || null,
        increment_percent: Number(incrementPercent),
        recommendation,
        reviewer_remarks: reviewerRemarks || (uploadedDoc ? `Evaluation sheet attached: ${uploadedDoc.name}` : null),
        strengths: strengths || null,
        areas_for_improvement: areasForImprovement || null,
        goals_next_period: goalsNextPeriod || null,
      }

      const created = await appraisalsApi.create(payload)

      if (finalize) {
        await appraisalsApi.finalize(created.id)
        alerts.success('Appraisal approved and published', {
          description: `${selectedStaff?.name || 'Staff'}'s appraisal published with ${incrementPercent}% approved increment.`,
        })
      } else {
        alerts.success('Appraisal saved as draft', {
          description: `Scorecard recorded with ${overallScore.toFixed(1)}/5.0 rating.`,
        })
      }

      onCreated()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed'
      alerts.error('Failed to create appraisal', { description: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  const staffOptions = staffItems.map((s) => ({
    value: String(s.id),
    label: `${s.name} (${s.employee_no || 'No ID'}) · ${s.designation}${s.department ? ` · ${s.department}` : ''}`,
  }))

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Conduct Performance Review & Rate Staff'
      description='Evaluate staff against historical metrics, assign criteria scores (1.0 to 5.0), and approve salary hike %.'
      size='xl'
    >
      <div className='flex flex-col gap-4 text-xs max-h-[75vh] overflow-y-auto pr-1'>
        {/* Step 1: Select Staff Member */}
        <div className='rounded-lg border border-border p-3 space-y-3 bg-muted/10'>
          <FormField id='select-staff' label='Select Staff / Teacher to Evaluate' required>
            <Combobox
              id='select-staff'
              label='Staff Member'
              value={selectedStaffId ? String(selectedStaffId) : ''}
              options={staffOptions}
              onChange={(val) => setSelectedStaffId(val ? Number(val) : null)}
              placeholder='Search teacher by name, employee ID, or subject…'
            />
          </FormField>

          {selectedStaff && (
            <div className='flex items-center justify-between p-2 rounded bg-card border border-border/50'>
              <div>
                <span className='font-semibold text-foreground text-sm'>{selectedStaff.name}</span>
                <p className='text-muted-foreground text-xs'>
                  {selectedStaff.employee_no} · {selectedStaff.designation} {selectedStaff.department ? `(${selectedStaff.department})` : ''} · {selectedStaff.experience_years} yrs exp
                </p>
              </div>
              <Badge tone='neutral'>{selectedStaff.staff_type.toUpperCase()}</Badge>
            </div>
          )}

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1'>
            <FormField id='review-period' label='Review Period' required>
              <Input
                id='review-period'
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder='e.g., 2026-27 Annual Review'
              />
            </FormField>
            <FormField id='review-date' label='Review Date' required>
              <Input
                id='review-date'
                type='date'
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
              />
            </FormField>
          </div>
        </div>

        {/* Step 2: Teacher Objective History Dossier */}
        {selectedStaffId && (
          <StaffPerformanceHistoryDossier metrics={metrics} isLoading={metricsQuery.isLoading} />
        )}

        {/* Step 3: Evaluation Criteria & Scores (1.0 to 5.0) */}
        <div className='rounded-lg border border-border p-3 space-y-3'>
          <div className='flex items-center justify-between'>
            <div>
              <h4 className='font-semibold text-foreground flex items-center gap-1.5'>
                <Star className='h-3.5 w-3.5 text-primary' />
                Evaluation Criteria & Scores (1.0 to 5.0)
              </h4>
              <p className='text-[11px] text-muted-foreground'>
                Assign ratings based on teacher attendance, student pass/fail rate, homework activity, and parent feedback.
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <span className='font-bold text-foreground text-xs'>
                Overall: {overallScore.toFixed(1)} / 5.0
              </span>
              <Badge tone={ratingConfig?.tone ?? 'neutral'}>
                {ratingConfig?.label ?? overallRating}
              </Badge>
            </div>
          </div>

          {/* Dynamic KRA Dimensions */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            {kras.map((kra) => {
              const currentScore = kraScores[kra.code]?.score ?? 4.0
              const currentRemarks = kraScores[kra.code]?.remarks ?? ''
              return (
                <div key={kra.id} className='rounded-md border border-border/70 p-2.5 bg-card/50 space-y-2'>
                  <div className='flex items-start justify-between gap-1'>
                    <div>
                      <span className='font-semibold text-foreground text-xs'>{kra.title}</span>
                      <p className='text-[10px] text-muted-foreground'>{kra.description || 'Evaluation dimension'}</p>
                    </div>
                    <Badge tone='info' className='text-[10px] shrink-0 font-bold'>
                      {kra.weightage_percent}% wt
                    </Badge>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Label htmlFor={`conduct-score-${kra.code}`} className='text-[11px] text-muted-foreground shrink-0'>
                      Score (1.0 - 5.0):
                    </Label>
                    <Input
                      id={`conduct-score-${kra.code}`}
                      type='number'
                      min={1}
                      max={5}
                      step={0.1}
                      className='h-8 w-16 text-center text-xs font-bold'
                      value={currentScore}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 1
                        setKraScores((prev) => ({
                          ...prev,
                          [kra.code]: { score: val, remarks: prev[kra.code]?.remarks ?? '' },
                        }))
                      }}
                    />
                    <div className='flex items-center gap-0.5'>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type='button'
                          onClick={() => {
                            setKraScores((prev) => ({
                              ...prev,
                              [kra.code]: { score: star, remarks: prev[kra.code]?.remarks ?? '' },
                            }))
                          }}
                          className={`p-1 rounded hover:bg-muted ${
                            currentScore >= star ? 'text-amber-500' : 'text-muted-foreground/30'
                          }`}
                        >
                          <Star className='h-3.5 w-3.5 fill-current' />
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input
                    className='h-7 text-[11px] text-muted-foreground'
                    placeholder='Evaluator observation note for this KRA…'
                    value={currentRemarks}
                    onChange={(e) => {
                      const remarksVal = e.target.value
                      setKraScores((prev) => ({
                        ...prev,
                        [kra.code]: { score: prev[kra.code]?.score ?? 4.0, remarks: remarksVal },
                      }))
                    }}
                  />
                </div>
              )
            })}
          </div>

          {/* Quick Hike Recommendation helper */}
          <div className='flex items-center justify-between rounded bg-primary/5 p-2.5 border border-primary/20'>
            <div className='flex items-center gap-2'>
              <Sparkles className='h-4 w-4 text-primary' />
              <span className='text-xs text-foreground'>
                Suggested Hike for <strong>{ratingConfig?.label ?? overallRating}</strong>:{' '}
                <strong className='text-primary'>{suggestedHikePct}%</strong>
              </span>
            </div>
            <Button
              type='button'
              size='sm'
              variant='outline'
              className='h-7 text-xs text-primary border-primary/30 hover:bg-primary/10'
              onClick={() => setIncrementPercent(suggestedHikePct)}
            >
              Apply Suggested {suggestedHikePct}%
            </Button>
          </div>
        </div>

        {/* Step 4: Teacher Requested Hike & Management Decision */}
        <div className='rounded-lg border border-border p-3 space-y-3 bg-muted/10'>
          <h4 className='font-semibold text-foreground flex items-center gap-1.5'>
            <Percent className='h-3.5 w-3.5 text-primary' />
            Salary Hike Track & Increment Decision
          </h4>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <FormField
              id='conduct_req_hike'
              label='Teacher Requested Hike (%)'
              hint='Optional: Enter the hike % teacher requested or submitted'
            >
              <Input
                id='conduct_req_hike'
                type='number'
                min={0}
                max={100}
                step={0.5}
                value={expectedHike}
                onChange={(e) => setExpectedHike(e.target.value)}
                placeholder='e.g., 15'
              />
            </FormField>

            <FormField
              id='conduct_justification'
              label='Teacher Justification'
              hint='Reason provided by the teacher for requested hike'
            >
              <Input
                id='conduct_justification'
                value={hikeJustification}
                onChange={(e) => setHikeJustification(e.target.value)}
                placeholder='e.g., Completed M.Ed, coached district champions'
              />
            </FormField>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/50'>
            <FormField
              id='conduct_inc_percent'
              label='Management Approved Salary Hike (%)'
              hint='Final percentage increment decided by management'
              required
            >
              <div className='flex items-center gap-2'>
                <Input
                  id='conduct_inc_percent'
                  type='number'
                  min={0}
                  max={100}
                  step={0.5}
                  value={incrementPercent}
                  onChange={(e) => setIncrementPercent(parseFloat(e.target.value) || 0)}
                  className='font-bold text-foreground'
                />
                <span className='text-sm font-semibold text-muted-foreground'>%</span>
              </div>
            </FormField>

            <FormField
              id='conduct_recommendation'
              label='Administrative Recommendation'
              hint='Official HR recommendation'
              required
            >
              <Combobox
                id='conduct_recommendation'
                label='Recommendation'
                value={recommendation}
                options={recommendationOptions}
                onChange={(val) => val && setRecommendation(val)}
                placeholder='Select recommendation'
              />
            </FormField>
          </div>

          {/* Quick preset chips */}
          <div className='flex flex-wrap items-center gap-1.5 pt-1'>
            <span className='text-[10px] uppercase font-semibold text-muted-foreground mr-1'>
              Quick Presets:
            </span>
            {quickHikePresets.map((pct) => (
              <Button
                key={pct}
                type='button'
                size='sm'
                variant={incrementPercent === pct ? 'default' : 'outline'}
                className='h-6 text-[11px] px-2 rounded-full'
                onClick={() => setIncrementPercent(pct)}
              >
                {pct}%
              </Button>
            ))}
          </div>
        </div>

        {/* Step 5: Remarks & Supporting Document Upload */}
        <div className='rounded-lg border border-border p-3 space-y-3'>
          <div>
            <Label htmlFor='conduct_remarks'>Reviewer Remarks & Hike Justification</Label>
            <Textarea
              id='conduct_remarks'
              rows={2}
              value={reviewerRemarks}
              onChange={(e) => setReviewerRemarks(e.target.value)}
              placeholder='Decision reasoning (e.g., "15% hike requested; approved 10% for strong academic pass rates and regular homework compliance.")'
            />
          </div>

          {/* Supporting Document / Evidence Upload */}
          <div className='rounded-md border border-dashed border-border p-3 space-y-2 bg-muted/20'>
            <div className='flex items-center justify-between'>
              <span className='font-semibold text-foreground text-xs flex items-center gap-1.5'>
                <Upload className='h-3.5 w-3.5 text-primary' />
                Upload Supporting Evidence / Evaluation Sheet
              </span>
              {uploadedDoc && (
                <Badge tone='success' className='text-[10px]'>
                  <CheckCircle2 className='mr-1 h-3 w-3' />
                  Uploaded
                </Badge>
              )}
            </div>
            <div className='flex items-center gap-3'>
              <input
                id='doc-upload-input'
                type='file'
                className='text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90'
                onChange={(e) => void handleDocUpload(e)}
                disabled={isUploadingDoc}
              />
              {isUploadingDoc && <span className='text-xs text-muted-foreground animate-pulse'>Uploading file…</span>}
            </div>
            {uploadedDoc && (
              <p className='text-[11px] text-muted-foreground'>
                Attached file: <strong className='text-foreground'>{uploadedDoc.name}</strong> ({Math.round(uploadedDoc.size_bytes / 1024)} KB)
              </p>
            )}
          </div>

          {/* Collapsible Additional Feedback */}
          <div>
            <button
              type='button'
              className='w-full flex items-center justify-between text-xs font-semibold text-foreground pt-1'
              onClick={() => setShowMoreFeedback((prev) => !prev)}
            >
              <span>Additional Qualitative Feedback (Strengths & Goals)</span>
              {showMoreFeedback ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
            </button>

            {showMoreFeedback && (
              <div className='space-y-3 pt-2 border-t border-border/50 mt-2'>
                <FormField id='conduct_strengths' label='Key Strengths'>
                  <Textarea
                    id='conduct_strengths'
                    rows={2}
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    placeholder='Notable competencies and achievements'
                  />
                </FormField>

                <FormField id='conduct_areas' label='Areas for Improvement'>
                  <Textarea
                    id='conduct_areas'
                    rows={2}
                    value={areasForImprovement}
                    onChange={(e) => setAreasForImprovement(e.target.value)}
                    placeholder='Aspects requiring mentorship or professional growth'
                  />
                </FormField>

                <FormField id='conduct_goals' label='Goals for Next Academic Period'>
                  <Textarea
                    id='conduct_goals'
                    rows={2}
                    value={goalsNextPeriod}
                    onChange={(e) => setGoalsNextPeriod(e.target.value)}
                    placeholder='Target objectives and key milestones'
                  />
                </FormField>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className='flex items-center justify-between pt-2 border-t border-border'>
          <Button variant='secondary' size='sm' onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <div className='flex items-center gap-2'>
            <Button
              variant='secondary'
              size='sm'
              className='border-[#C6CEC9] bg-white text-[#171B19] hover:bg-[#F9FAFB] font-medium'
              disabled={isSubmitting || !selectedStaffId}
              onClick={() => void handleSubmit(false)}
            >
              <Save className='size-3.5 stroke-[1.75]' />
              {isSubmitting ? 'Saving…' : 'Save as Draft'}
            </Button>
            <Button
              variant='primary'
              size='sm'
              disabled={isSubmitting || !selectedStaffId}
              onClick={() => void handleSubmit(true)}
            >
              <UserCheck className='size-3.5 stroke-[1.75]' />
              {isSubmitting ? 'Publishing…' : 'Approve & Finalize'}
            </Button>
          </div>
        </div>
      </div>
    </AppModal>
  )
}

interface ParsedRatingRow {
  employee_no: string
  staff_id?: number
  staff_name?: string
  designation?: string
  teaching_effectiveness: number
  student_outcomes: number
  classroom_management: number
  professional_conduct: number
  extracurricular_contribution: number
  overall_score: number
  overall_rating: OverallRating
  increment_percent: number
  expected_increment_percent?: number | null
  hike_justification?: string | null
  recommendation: 'increment' | 'promotion' | 'retention' | 'pip'
  reviewer_remarks?: string | null
  valid: boolean
  error?: string
}

function UploadRatingsModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const staffQuery = useStaffList({ page: 1, limit: 100, status: 'active' })
  const staffItems = useMemo(() => staffQuery.data?.items ?? [], [staffQuery.data?.items])

  const [inputMode, setInputMode] = useState<'file' | 'paste'>('file')
  const [rawText, setRawText] = useState('')
  const [fileName, setFileName] = useState('')
  const [parsedRows, setParsedRows] = useState<ParsedRatingRow[]>([])
  const [isImporting, setIsImporting] = useState(false)

  const downloadSampleTemplate = () => {
    const csvContent = [
      'employee_no,teaching_effectiveness,student_outcomes,classroom_management,professional_conduct,extracurricular_contribution,increment_percent,recommendation,reviewer_remarks,expected_increment_percent,hike_justification',
      'TZMS-EMP-0005,4.5,4.3,4.0,4.8,4.2,12.0,increment,"Exceeded target pass rate and regular homework",15.0,"Coordinated district science expo"',
      'TZMS-EMP-0008,4.2,4.0,4.5,4.6,3.8,10.0,increment,"Consistent syllabus coverage and parent satisfaction",10.0,"Mentored junior math club"',
      'TZMS-EMP-0012,3.8,3.5,4.0,4.2,3.5,8.0,increment,"Good engagement, recommend digital tools in lessons",10.0,"Syllabus completion on schedule"',
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'staff_ratings_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const parseCsvText = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    if (lines.length < 2) {
      setParsedRows([])
      return
    }

    const headerTokens = lines[0]
      .split(/,|\t/)
      .map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase())

    const getColIndex = (names: string[]) =>
      headerTokens.findIndex((h) => names.some((n) => h.includes(n)))

    const empIdx = getColIndex(['emp', 'staff', 'id', 'code'])
    const teIdx = getColIndex(['teach', 'effectiveness', 'te'])
    const soIdx = getColIndex(['outcome', 'student', 'so'])
    const cmIdx = getColIndex(['class', 'management', 'cm'])
    const pcIdx = getColIndex(['conduct', 'punctuality', 'pc', 'prof'])
    const ecIdx = getColIndex(['extra', 'contribution', 'ec'])
    const incIdx = getColIndex(['increment', 'hike', 'percent', 'approved'])
    const recIdx = getColIndex(['recommend', 'decision', 'action'])
    const remIdx = getColIndex(['remark', 'comment', 'note', 'reason'])
    const reqHikeIdx = getColIndex(['expected', 'requested', 'req'])
    const justIdx = getColIndex(['justification'])

    const rows: ParsedRatingRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      const tokens: string[] = []
      let current = ''
      let inQuotes = false
      for (let c = 0; c < line.length; c++) {
        const char = line[c]
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes
        } else if ((char === ',' || char === '\t') && !inQuotes) {
          tokens.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      tokens.push(current.trim())

      const cleanToken = (idx: number, fallback = '') =>
        idx >= 0 && idx < tokens.length ? tokens[idx].replace(/^["']|["']$/g, '').trim() : fallback

      const empNo = cleanToken(empIdx !== -1 ? empIdx : 0)
      if (!empNo) continue

      const te = parseFloat(cleanToken(teIdx, '4.0')) || 4.0
      const so = parseFloat(cleanToken(soIdx, '4.0')) || 4.0
      const cm = parseFloat(cleanToken(cmIdx, '4.0')) || 4.0
      const pc = parseFloat(cleanToken(pcIdx, '4.0')) || 4.0
      const ec = parseFloat(cleanToken(ecIdx, '4.0')) || 4.0

      const overall = Math.round(((te + so + cm + pc + ec) / 5) * 10) / 10
      const rating = computeRating(overall)

      const incPct = parseFloat(cleanToken(incIdx, '0.0')) || 0.0
      const rawRec = cleanToken(recIdx, 'increment').toLowerCase()
      const rec = (['increment', 'promotion', 'retention', 'pip'].includes(rawRec)
        ? rawRec
        : 'increment') as ParsedRatingRow['recommendation']

      const remarks = cleanToken(remIdx, '')
      const expectedHike = reqHikeIdx >= 0 ? parseFloat(cleanToken(reqHikeIdx)) || null : null
      const justification = cleanToken(justIdx, '')

      const matchedStaff = staffItems.find(
        (s) =>
          s.employee_no?.toLowerCase() === empNo.toLowerCase() ||
          String(s.id) === empNo ||
          s.name.toLowerCase() === empNo.toLowerCase()
      )

      rows.push({
        employee_no: matchedStaff?.employee_no ?? empNo,
        staff_id: matchedStaff?.id,
        staff_name: matchedStaff?.name,
        designation: matchedStaff?.designation,
        teaching_effectiveness: te,
        student_outcomes: so,
        classroom_management: cm,
        professional_conduct: pc,
        extracurricular_contribution: ec,
        overall_score: overall,
        overall_rating: rating,
        increment_percent: incPct,
        recommendation: rec,
        reviewer_remarks: remarks || null,
        expected_increment_percent: expectedHike,
        hike_justification: justification || null,
        valid: Boolean(matchedStaff),
        error: matchedStaff ? undefined : 'Staff not found with this Employee No / ID',
      })
    }

    setParsedRows(rows)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setRawText(content)
      parseCsvText(content)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    const validRows = parsedRows.filter((r) => r.valid && r.staff_id)
    if (validRows.length === 0) {
      alerts.error('No valid staff ratings to import', {
        description: 'Please ensure employee numbers match active staff records.',
      })
      return
    }

    try {
      setIsImporting(true)
      const dtos = validRows.map((r) => ({
        staff_id: r.staff_id,
        employee_no: r.employee_no,
        teaching_effectiveness: r.teaching_effectiveness,
        student_outcomes: r.student_outcomes,
        classroom_management: r.classroom_management,
        professional_conduct: r.professional_conduct,
        extracurricular_contribution: r.extracurricular_contribution,
        increment_percent: r.increment_percent,
        recommendation: r.recommendation,
        reviewer_remarks: r.reviewer_remarks,
        expected_increment_percent: r.expected_increment_percent,
        hike_justification: r.hike_justification,
        period: '2026-27 Annual Review',
        review_date: new Date().toISOString().slice(0, 10),
      }))

      const result = await appraisalsApi.bulkImport(dtos)
      alerts.success('Staff ratings uploaded and imported successfully', {
        description: `${result.length} appraisal records have been created in the review track.`,
      })
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed'
      alerts.error('Bulk import failed', { description: msg })
    } finally {
      setIsImporting(false)
    }
  }

  const validCount = parsedRows.filter((r) => r.valid).length
  const invalidCount = parsedRows.length - validCount

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Upload & Bulk Import Staff Ratings'
      description='Import performance review criteria scores, approved salary hike %, and remarks from CSV or Excel spreadsheet.'
      size='xl'
    >
      <div className='flex flex-col gap-4 text-xs max-h-[75vh] overflow-y-auto pr-1'>
        {/* Top actions & Sample Download */}
        <div className='flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/20 border border-border p-3'>
          <div className='flex items-center gap-2'>
            <FileSpreadsheet className='h-5 w-5 text-primary' />
            <div>
              <span className='font-semibold text-foreground text-xs'>Spreadsheet Data Import</span>
              <p className='text-[11px] text-muted-foreground'>
                Upload evaluation spreadsheets containing employee IDs, criteria scores (1-5), and approved increments.
              </p>
            </div>
          </div>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={downloadSampleTemplate}
            className='h-7 text-xs'
          >
            <Download className='mr-1.5 h-3.5 w-3.5' />
            Download Sample CSV Template
          </Button>
        </div>

        {/* Input Selector (File vs Paste) */}
        <div className='flex items-center gap-2 border-b border-border pb-2'>
          <Button
            type='button'
            size='sm'
            variant={inputMode === 'file' ? 'default' : 'ghost'}
            className='h-7 text-xs'
            onClick={() => setInputMode('file')}
          >
            <Upload className='mr-1.5 h-3.5 w-3.5' />
            Upload File (.csv / .txt)
          </Button>
          <Button
            type='button'
            size='sm'
            variant={inputMode === 'paste' ? 'default' : 'ghost'}
            className='h-7 text-xs'
            onClick={() => setInputMode('paste')}
          >
            <FileText className='mr-1.5 h-3.5 w-3.5' />
            Paste CSV / Excel Text
          </Button>
        </div>

        {/* File Dropzone */}
        {inputMode === 'file' && (
          <div className='rounded-lg border-2 border-dashed border-border/80 bg-muted/10 p-5 text-center space-y-2 hover:bg-muted/20 transition-colors'>
            <Upload className='mx-auto h-8 w-8 text-muted-foreground' />
            <div className='space-y-1'>
              <span className='font-semibold text-foreground text-xs'>
                {fileName ? fileName : 'Select or drop your CSV or Excel export file here'}
              </span>
              <p className='text-[11px] text-muted-foreground'>
                Files should include column headers: employee_no, teaching_effectiveness, student_outcomes, etc.
              </p>
            </div>
            <input
              id='csv-file-input'
              type='file'
              accept='.csv,.tsv,.txt'
              className='mx-auto block text-xs text-muted-foreground file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90'
              onChange={handleFileUpload}
            />
          </div>
        )}

        {/* Paste Area */}
        {inputMode === 'paste' && (
          <div className='space-y-1.5'>
            <Label htmlFor='raw-csv-paste'>Paste CSV / Tab-Separated Spreadsheet Rows</Label>
            <Textarea
              id='raw-csv-paste'
              rows={5}
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value)
                parseCsvText(e.target.value)
              }}
              placeholder='employee_no,teaching_effectiveness,student_outcomes,classroom_management,professional_conduct,extracurricular_contribution,increment_percent,recommendation&#10;TZMS-EMP-0005,4.5,4.3,4.0,4.8,4.2,12.0,increment'
              className='font-mono text-[11px]'
            />
          </div>
        )}

        {/* Parsed Preview Table */}
        {parsedRows.length > 0 && (
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span className='font-semibold text-foreground text-xs'>
                  Preview Parsed Ratings ({parsedRows.length} total)
                </span>
                <Badge tone='success' className='text-[10px]'>
                  {validCount} ready
                </Badge>
                {invalidCount > 0 && (
                  <Badge tone='danger' className='text-[10px]'>
                    {invalidCount} invalid
                  </Badge>
                )}
              </div>
            </div>

            <div className='max-h-56 overflow-y-auto border border-border rounded-md'>
              <table className='w-full text-[11px] text-left border-collapse'>
                <thead className='bg-muted/50 text-muted-foreground sticky top-0 border-b border-border'>
                  <tr>
                    <th className='p-2 font-medium'>Teacher / Emp ID</th>
                    <th className='p-2 font-medium'>Scores (TE/SO/CM/PC/EC)</th>
                    <th className='p-2 font-medium'>Overall Rating</th>
                    <th className='p-2 font-medium'>Approved Hike</th>
                    <th className='p-2 font-medium'>Decision</th>
                    <th className='p-2 font-medium'>Status</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-border/40 bg-card'>
                  {parsedRows.map((row, idx) => {
                    const ratingCfg = APPRAISAL_RATING_LABELS[row.overall_rating]
                    return (
                      <tr key={idx} className={row.valid ? 'hover:bg-muted/30' : 'bg-destructive/5'}>
                        <td className='p-2'>
                          <span className='font-semibold text-foreground block'>
                            {row.staff_name ?? row.employee_no}
                          </span>
                          <span className='text-[10px] text-muted-foreground'>
                            {row.employee_no} {row.designation ? `· ${row.designation}` : ''}
                          </span>
                        </td>
                        <td className='p-2 text-muted-foreground'>
                          {row.teaching_effectiveness} / {row.student_outcomes} / {row.classroom_management} / {row.professional_conduct} / {row.extracurricular_contribution}
                        </td>
                        <td className='p-2'>
                          <div className='flex items-center gap-1.5'>
                            <span className='font-bold text-foreground'>{row.overall_score.toFixed(1)}</span>
                            <Badge tone={ratingCfg?.tone ?? 'neutral'} className='text-[9px] px-1 py-0'>
                              {ratingCfg?.label ?? row.overall_rating}
                            </Badge>
                          </div>
                        </td>
                        <td className='p-2 font-semibold text-foreground'>
                          {row.increment_percent}%
                          {row.expected_increment_percent !== null && row.expected_increment_percent !== undefined && (
                            <span className='text-[10px] text-muted-foreground block font-normal'>
                              (Req: {row.expected_increment_percent}%)
                            </span>
                          )}
                        </td>
                        <td className='p-2 capitalize text-muted-foreground'>
                          {RECOMMENDATION_LABELS[row.recommendation] ?? row.recommendation}
                        </td>
                        <td className='p-2'>
                          {row.valid ? (
                            <span className='flex items-center text-success gap-1'>
                              <CheckCircle2 className='h-3 w-3' />
                              Ready
                            </span>
                          ) : (
                            <span className='flex items-center text-destructive gap-1' title={row.error}>
                              <AlertCircle className='h-3 w-3' />
                              Unmatched
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action footer */}
        <div className='flex items-center justify-between pt-2 border-t border-border'>
          <Button variant='secondary' size='sm' onClick={onClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button
            variant='primary'
            size='sm'
            onClick={handleImport}
            disabled={isImporting || validCount === 0}
          >
            <Upload className='size-3.5 stroke-[1.75]' />
            {isImporting ? 'Importing Ratings…' : `Upload & Import (${validCount} Ratings)`}
          </Button>
        </div>
      </div>
    </AppModal>
  )
}
