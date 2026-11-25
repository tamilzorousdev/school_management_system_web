import type { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { z } from 'zod'
import { AppLayout } from '@/components/layout/app-layout'
import { queryClient } from '@/lib/api/query-client'
import { session } from '@/lib/auth/session'
import { attendanceSearchSchema } from '@/features/attendance/search'
import { performanceSearchSchema } from '@/features/performance/search'
import { feedbackSearchSchema } from '@/features/feedback/search'
import { emergencySearchSchema } from '@/features/emergency/search'
import { surveyResultsSearchSchema, surveysSearchSchema } from '@/features/surveys/search'
import { gateSearchSchema } from '@/features/gate/search'
import {
  monitorSearchSchema,
  officeSearchSchema,
  student360SearchSchema,
} from '@/features/office/search'
import {
  albumSearchSchema,
  cleanupSearchSchema,
  galleryAuditSearchSchema,
  galleryReportsSearchSchema,
  gallerySearchSchema,
  gallerySettingsSearchSchema,
  trashSearchSchema,
} from '@/features/gallery/search'
import { GeneralErrorPage, NotFoundPage } from '@/features/errors/error-pages'
import { meetingsSearchSchema } from '@/features/meetings/search'
import { diarySearchSchema } from '@/features/diary/search'
import { announcementsSearchSchema } from '@/features/announcements/search'
import { eventsSearchSchema } from '@/features/events/search'
import { grievancesSearchSchema } from '@/features/grievances/search'
import { chatSearchSchema } from '@/features/chat/search'
import { outboxSearchSchema } from '@/features/notifications/search'
import { appBannersSearchSchema } from '@/features/app-banners/search'
import { setupSearchSchema } from '@/features/setup/search'
import {
  assignmentsSearchSchema,
  staffProfileSearchSchema,
  staffSearchSchema,
} from '@/features/staff/search'
import { appraisalsSearchSchema } from '@/features/appraisals/search'
import { crewProfileSearchSchema, crewSearchSchema } from '@/features/crew/search'
import {
  admissionsSearchSchema,
  guardiansSearchSchema,
  studentProfileSearchSchema,
  studentsSearchSchema,
} from '@/features/students/search'
import { payrollSearchSchema } from '@/features/payroll/search'
import { accountsSearchSchema } from '@/features/accounts/search'
import { feesSearchSchema } from '@/features/fees/search'
import { libraryDetailSearchSchema, librarySearchSchema } from '@/features/library/search'
import { examsSearchSchema } from '@/features/exams/search'
import { quizSearchSchema } from '@/features/quizzes/search'
import { tripHistorySearchSchema } from '@/features/fleet/search'
import { maintenanceSearchSchema } from '@/features/maintenance/search'
import { alertsSearchSchema } from '@/features/alerts/search'
import { activitiesSearchSchema } from '@/features/activities/search'
import { substitutesSearchSchema } from '@/features/substitutes/search'
import { timetableSearchSchema } from '@/features/timetable/search'
import { transportSearchSchema } from '@/features/transport/search'
import {
  busAttendanceSearchSchema,
  incidentsSearchSchema,
  opsDaySearchSchema,
} from '@/features/transport-ops/search'
import { usersSearchSchema } from '@/features/users/search'
import { alumniSearchSchema } from '@/features/alumni/search'
import {
  complaintsSearchSchema,
  disciplineSearchSchema,
  hostelAuditSearchSchema,
  hostelDashboardSearchSchema,
  hostelFeesSearchSchema,
  hostelReportsSearchSchema,
  hostelSetupSearchSchema,
  safetySearchSchema,
  leavesSearchSchema,
  residentSearchSchema,
  residentsSearchSchema,
  rollCallSearchSchema,
  roomsSearchSchema,
  visitorsSearchSchema,
} from '@/features/hostel/search'
import {
  dutySearchSchema,
  healthSearchSchema,
  inspectionsSearchSchema,
  laundrySearchSchema,
  lockersSearchSchema,
  messSearchSchema,
  studySearchSchema,
} from '@/features/hostel/search-life'
import {
  assetPageSearchSchema,
  inventorySearchSchema,
  stockItemSearchSchema,
} from '@/features/inventory/search'
import { parentPreviewSearchSchema } from '@/features/parent-preview/search'
import { teacherPreviewSearchSchema } from '@/features/teacher-preview/search'

const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: Outlet,
  notFoundComponent: NotFoundPage,
  errorComponent: GeneralErrorPage,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: z.object({ redirect: z.string().optional().catch(undefined) }),
  beforeLoad: () => {
    if (session.get()) throw redirect({ to: '/' })
  },
  component: lazyRouteComponent(() => import('@/features/auth/pages/login-page'), 'LoginPage'),
})

const alumniRegisterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/alumni-register/$schoolCode',
  component: lazyRouteComponent(
    () => import('@/features/alumni/pages/public-register-page'),
    'PublicRegisterPage'
  ),
})

const alumniUpdateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/alumni-update/$token',
  component: lazyRouteComponent(
    () => import('@/features/alumni/pages/public-update-page'),
    'PublicUpdatePage'
  ),
})

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_app',
  beforeLoad: ({ location }) => {
    if (!session.get()) {
      throw redirect({ to: '/login', search: { redirect: location.href }, replace: true })
    }
  },
  component: AppLayout,
})

const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/',
  component: lazyRouteComponent(
    () => import('@/features/dashboard/pages/dashboard-page'),
    'DashboardPage'
  ),
})

const usersRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/users',
  validateSearch: usersSearchSchema,
  component: lazyRouteComponent(() => import('@/features/users/pages/users-page'), 'UsersPage'),
})

const meetingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/meetings',
  validateSearch: meetingsSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/meetings/pages/meetings-page'),
    'MeetingsPage'
  ),
})

const diaryRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/diary',
  validateSearch: diarySearchSchema,
  component: lazyRouteComponent(() => import('@/features/diary/pages/diary-page'), 'DiaryPage'),
})

const announcementsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/announcements',
  validateSearch: announcementsSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/announcements/pages/announcements-page'),
    'AnnouncementsPage'
  ),
})

const eventsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/events',
  validateSearch: eventsSearchSchema,
  component: lazyRouteComponent(() => import('@/features/events/pages/events-page'), 'EventsPage'),
})

const grievancesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/grievances',
  validateSearch: grievancesSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/grievances/pages/grievances-page'),
    'GrievancesPage'
  ),
})

const chatRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/chat',
  validateSearch: chatSearchSchema,
  component: lazyRouteComponent(() => import('@/features/chat/pages/chat-page'), 'ChatPage'),
})

const appBannersRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/app-banners',
  validateSearch: appBannersSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/app-banners/pages/app-banners-page'),
    'AppBannersPage'
  ),
})

const notificationsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/notifications',
  validateSearch: outboxSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/notifications/pages/notifications-page'),
    'NotificationsPage'
  ),
})

const fleetRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/fleet',
  component: lazyRouteComponent(() => import('@/features/fleet/pages/fleet-page'), 'FleetPage'),
})

const tripRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/fleet/trips/$tripId',
  params: {
    parse: (raw) => ({ tripId: z.coerce.number().int().min(1).parse(raw.tripId) }),
    stringify: (params) => ({ tripId: String(params.tripId) }),
  },
  component: lazyRouteComponent(() => import('@/features/fleet/pages/trip-page'), 'TripPage'),
})

const tripPlaybackRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/fleet/trips/$tripId/playback',
  params: {
    parse: (raw) => ({ tripId: z.coerce.number().int().min(1).parse(raw.tripId) }),
    stringify: (params) => ({ tripId: String(params.tripId) }),
  },
  component: lazyRouteComponent(
    () => import('@/features/fleet/pages/playback-page'),
    'PlaybackPage'
  ),
})

const tripHistoryRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/fleet/history',
  validateSearch: tripHistorySearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/fleet/pages/trip-history-page'),
    'TripHistoryPage'
  ),
})

const fleetAlertsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/fleet/alerts',
  validateSearch: alertsSearchSchema,
  component: lazyRouteComponent(() => import('@/features/alerts/pages/alerts-page'), 'AlertsPage'),
})

const maintenanceRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/fleet/maintenance',
  validateSearch: maintenanceSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/maintenance/pages/maintenance-page'),
    'MaintenancePage'
  ),
})

const studentsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/students',
  validateSearch: studentsSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/students/pages/students-page'),
    'StudentsPage'
  ),
})

const studentRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/students/$studentId',
  validateSearch: studentProfileSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/students/pages/student-page'),
    'StudentPage'
  ),
})

const alumniRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/alumni',
  validateSearch: alumniSearchSchema,
  component: lazyRouteComponent(() => import('@/features/alumni/pages/alumni-page'), 'AlumniPage'),
})

const alumnusRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/alumni/$id',
  component: lazyRouteComponent(
    () => import('@/features/alumni/pages/alumni-profile-page'),
    'AlumniProfilePage'
  ),
})

const admissionsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/admissions',
  validateSearch: admissionsSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/students/pages/admissions-page'),
    'AdmissionsPage'
  ),
})

const guardiansRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/guardians',
  validateSearch: guardiansSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/students/pages/guardians-page'),
    'GuardiansPage'
  ),
})

const staffRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/staff',
  validateSearch: staffSearchSchema,
  component: lazyRouteComponent(() => import('@/features/staff/pages/staff-page'), 'StaffPage'),
})

const crewRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/crew',
  validateSearch: crewSearchSchema,
  component: lazyRouteComponent(() => import('@/features/crew/pages/crew-page'), 'CrewPage'),
})

const crewProfileRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/crew/$staffId',
  validateSearch: crewProfileSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/crew/pages/crew-profile-page'),
    'CrewProfilePage'
  ),
})

const staffAssignmentsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/staff/assignments',
  validateSearch: assignmentsSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/staff/pages/assignments-page'),
    'AssignmentsPage'
  ),
})

const staffAppraisalsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/staff/appraisals',
  validateSearch: appraisalsSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/appraisals/pages/appraisals-page'),
    'AppraisalsPage'
  ),
})

const staffProfileRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/staff/$staffId',
  validateSearch: staffProfileSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/staff/pages/staff-profile-page'),
    'StaffProfilePage'
  ),
})

const attendanceRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/attendance',
  validateSearch: attendanceSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/attendance/pages/attendance-page'),
    'AttendancePage'
  ),
})

const performanceRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/class-performance',
  validateSearch: performanceSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/performance/pages/performance-page'),
    'PerformancePage'
  ),
})

const feedbackRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/teacher-feedback',
  validateSearch: feedbackSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/feedback/pages/feedback-page'),
    'FeedbackPage'
  ),
})

const emergencyRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/emergency',
  validateSearch: emergencySearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/emergency/pages/emergency-page'),
    'EmergencyPage'
  ),
})

const surveysRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/surveys',
  validateSearch: surveysSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/surveys/pages/surveys-page'),
    'SurveysPage'
  ),
})

const surveyNewRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/surveys/new',
  component: lazyRouteComponent(
    () => import('@/features/surveys/pages/survey-builder-page'),
    'SurveyBuilderPage'
  ),
})

const surveyEditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/surveys/$surveyId/edit',
  validateSearch: z.object({ send: z.boolean().optional().catch(undefined) }),
  component: lazyRouteComponent(
    () => import('@/features/surveys/pages/survey-builder-page'),
    'SurveyBuilderPage'
  ),
})

const surveyResultsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/surveys/$surveyId',
  validateSearch: surveyResultsSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/surveys/pages/survey-results-page'),
    'SurveyResultsPage'
  ),
})

const galleryRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/gallery',
  validateSearch: gallerySearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/gallery/pages/gallery-page'),
    'GalleryPage'
  ),
})

const galleryAlbumRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/gallery/albums/$albumId',
  validateSearch: albumSearchSchema,
  component: lazyRouteComponent(() => import('@/features/gallery/pages/album-page'), 'AlbumPage'),
})

const galleryTrashRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/gallery/trash',
  validateSearch: trashSearchSchema,
  component: lazyRouteComponent(() => import('@/features/gallery/pages/trash-page'), 'TrashPage'),
})

const gallerySettingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/gallery/settings',
  validateSearch: gallerySettingsSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/gallery/pages/settings-page'),
    'GallerySettingsPage'
  ),
})

const galleryCleanupRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/gallery/cleanup',
  validateSearch: cleanupSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/gallery/pages/cleanup-page'),
    'CleanupPage'
  ),
})

const galleryReportsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/gallery/reports',
  validateSearch: galleryReportsSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/gallery/pages/reports-page'),
    'GalleryReportsPage'
  ),
})

const galleryAuditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/gallery/audit',
  validateSearch: galleryAuditSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/gallery/pages/audit-page'),
    'GalleryAuditPage'
  ),
})

const hostelDashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/hostel',
  validateSearch: hostelDashboardSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/hostel/pages/dashboard-page'),
    'HostelDashboardPage'
  ),
})

const hostelResidentsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/hostel/residents',
  validateSearch: residentsSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/hostel/pages/residents-page'),
    'ResidentsPage'
  ),
})

const hostelResidentRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/hostel/residents/$admissionId',
  validateSearch: residentSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/hostel/pages/resident-page'),
    'ResidentPage'
  ),
})

const hostelRoomsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/hostel/rooms',
  validateSearch: roomsSearchSchema,
  component: lazyRouteComponent(() => import('@/features/hostel/pages/rooms-page'), 'RoomsPage'),
})

const hostelRollCallRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/hostel/roll-call',
  validateSearch: rollCallSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/hostel/pages/roll-call-page'),
    'RollCallPage'
  ),
})

const hostelLeavesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/hostel/leaves',
  validateSearch: leavesSearchSchema,
  component: lazyRouteComponent(() => import('@/features/hostel/pages/leaves-page'), 'LeavesPage'),
})

const hostelVisitorsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/hostel/visitors',
  validateSearch: visitorsSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/hostel/pages/visitors-page'),
    'VisitorsPage'
  ),
})

const hostelFeesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/hostel/fees',
  validateSearch: hostelFeesSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/hostel/pages/fees-page'),
    'HostelFeesPage'
  ),
})

const hostelDisciplineRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/hostel/discipline',
  validateSearch: disciplineSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/hostel/pages/discipline-page'),
    'DisciplinePage'
  ),
})

const hostelComplaintsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/hostel/complaints',
  validateSearch: complaintsSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/hostel/pages/complaints-page'),
    'ComplaintsPage'
  ),
})

const hostelSetupRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/hostel/setup',
  validateSearch: hostelSetupSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/hostel/pages/setup-page'),
    'HostelSetupPage'
  ),
})

const hostelAuditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/hostel/audit',
  validateSearch: hostelAuditSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/hostel/pages/audit-page'),
    'HostelAuditPage'
  ),
})

const hostelReportsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/hostel/reports',
  validateSearch: hostelReportsSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/hostel/pages/reports-page'),
    'HostelReportsPage'
  ),
})

const hostelSafetyRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/hostel/safety',
  validateSearch: safetySearchSchema,
  component: lazyRouteComponent(() => import('@/features/hostel/pages/safety-page'), 'SafetyPage'),
})

const hostelMessRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/hostel/mess',
  validateSearch: messSearchSchema,
  component: lazyRouteComponent(() => import('@/features/hostel/pages/mess-page'), 'MessPage'),
})

const hostelHealthRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/hostel/health',
  validateSearch: healthSearchSchema,
  component: lazyRouteComponent(() => import('@/features/hostel/pages/health-page'), 'HealthPage'),
})

const hostelLaundryRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/hostel/laundry',
  validateSearch: laundrySearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/hostel/pages/laundry-page'),
    'LaundryPage'
  ),
})

const hostelDutyRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/hostel/duty',
  validateSearch: dutySearchSchema,
  component: lazyRouteComponent(() => import('@/features/hostel/pages/duty-page'), 'DutyPage'),
})

const hostelStudyRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/hostel/study',
  validateSearch: studySearchSchema,
  component: lazyRouteComponent(() => import('@/features/hostel/pages/study-page'), 'StudyPage'),
})

const hostelLockersRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/hostel/lockers',
  validateSearch: lockersSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/hostel/pages/lockers-page'),
    'LockersPage'
  ),
})

const hostelInspectionsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/hostel/inspections',
  validateSearch: inspectionsSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/hostel/pages/inspections-page'),
    'InspectionsPage'
  ),
})

const gateRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/gate',
  validateSearch: gateSearchSchema,
  component: lazyRouteComponent(() => import('@/features/gate/pages/gate-page'), 'GatePage'),
})

const officeRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/office',
  validateSearch: officeSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/office/pages/classes-page'),
    'OfficeClassesPage'
  ),
})

const officeDashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/office/dashboard',
  component: lazyRouteComponent(
    () => import('@/features/office/pages/dashboard-page'),
    'OfficeDashboardPage'
  ),
})

const officeStudentRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/office/students/$studentId',
  validateSearch: student360SearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/office/pages/student-360-page'),
    'Student360Page'
  ),
})

const officeMonitorRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/office/monitor',
  validateSearch: monitorSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/office/pages/monitor-page'),
    'OfficeMonitorPage'
  ),
})

const officeWingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/office/wings',
  component: lazyRouteComponent(
    () => import('@/features/office/pages/wings-page'),
    'OfficeWingsPage'
  ),
})

const timetableRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/timetable',
  validateSearch: timetableSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/timetable/pages/timetable-page'),
    'TimetablePage'
  ),
})

const substitutesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/substitutes',
  validateSearch: substitutesSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/substitutes/pages/substitutes-page'),
    'SubstitutesPage'
  ),
})

const payrollRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/payroll',
  validateSearch: payrollSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/payroll/pages/payroll-page'),
    'PayrollPage'
  ),
})

const feesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/fees',
  validateSearch: feesSearchSchema,
  component: lazyRouteComponent(() => import('@/features/fees/pages/fees-page'), 'FeesPage'),
})

const accountsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/accounts',
  validateSearch: accountsSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/accounts/pages/accounts-page'),
    'AccountsPage'
  ),
})

const libraryRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/library',
  validateSearch: librarySearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/library/pages/library-page'),
    'LibraryPage'
  ),
})

const libraryBookRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/library/books/$bookId',
  validateSearch: libraryDetailSearchSchema,
  component: lazyRouteComponent(() => import('@/features/library/pages/book-page'), 'BookPage'),
})

const libraryMemberRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/library/members/$memberId',
  validateSearch: libraryDetailSearchSchema,
  component: lazyRouteComponent(() => import('@/features/library/pages/member-page'), 'MemberPage'),
})

const examsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/exams',
  validateSearch: examsSearchSchema,
  component: lazyRouteComponent(() => import('@/features/exams/pages/exams-page'), 'ExamsPage'),
})

const quizzesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/quizzes',
  validateSearch: quizSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/quizzes/pages/quizzes-page'),
    'QuizzesPage'
  ),
})

const activitiesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/activities',
  validateSearch: activitiesSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/activities/pages/activities-page'),
    'ActivitiesPage'
  ),
})

const transportRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/transport',
  validateSearch: transportSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/transport/pages/transport-page'),
    'TransportPage'
  ),
})

const routeRosterRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/transport/routes/$routeId/students',
  params: {
    parse: (raw) => ({ routeId: z.coerce.number().int().min(1).parse(raw.routeId) }),
    stringify: (params) => ({ routeId: String(params.routeId) }),
  },
  component: lazyRouteComponent(
    () => import('@/features/transport/pages/route-roster-page'),
    'RouteRosterPage'
  ),
})

const routeBuilderRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/transport/routes/$routeId',
  params: {
    parse: (raw) => ({ routeId: z.coerce.number().int().min(1).parse(raw.routeId) }),
    stringify: (params) => ({ routeId: String(params.routeId) }),
  },
  component: lazyRouteComponent(
    () => import('@/features/transport/pages/route-builder-page'),
    'RouteBuilderPage'
  ),
})

const transportOpsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/transport/operations',
  validateSearch: opsDaySearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/transport-ops/pages/operations-page'),
    'OperationsPage'
  ),
})

const driverAttendanceRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/transport/driver-attendance',
  validateSearch: opsDaySearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/transport-ops/pages/driver-attendance-page'),
    'DriverAttendancePage'
  ),
})

const busAttendanceRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/transport/bus-attendance',
  validateSearch: busAttendanceSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/transport-ops/pages/bus-attendance-page'),
    'BusAttendancePage'
  ),
})

const incidentsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/transport/incidents',
  validateSearch: incidentsSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/transport-ops/pages/incidents-page'),
    'IncidentsPage'
  ),
})

const setupRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/setup',
  validateSearch: setupSearchSchema,
  component: lazyRouteComponent(() => import('@/features/setup/pages/setup-page'), 'SetupPage'),
})

const parentPreviewRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/parent-preview',
  validateSearch: parentPreviewSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/parent-preview/pages/parent-preview-page'),
    'ParentPreviewPage'
  ),
})

const teacherPreviewRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/teacher-preview',
  validateSearch: teacherPreviewSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/teacher-preview/pages/teacher-preview-page'),
    'TeacherPreviewPage'
  ),
})

const inventoryRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/inventory',
  validateSearch: inventorySearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/inventory/pages/inventory-page'),
    'InventoryPage'
  ),
})

const assetRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/inventory/assets/$assetId',
  validateSearch: assetPageSearchSchema,
  component: lazyRouteComponent(() => import('@/features/inventory/pages/asset-page'), 'AssetPage'),
})

const stockItemRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/inventory/stock/$itemId',
  validateSearch: stockItemSearchSchema,
  component: lazyRouteComponent(
    () => import('@/features/inventory/pages/stock-item-page'),
    'StockItemPage'
  ),
})

const schoolsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/schools',
  component: lazyRouteComponent(
    () => import('@/features/schools/pages/schools-page'),
    'SchoolsPage'
  ),
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  alumniRegisterRoute,
  alumniUpdateRoute,
  appRoute.addChildren([
    dashboardRoute,
    studentsRoute,
    studentRoute,
    alumniRoute,
    alumnusRoute,
    admissionsRoute,
    guardiansRoute,
    staffRoute,
    staffAssignmentsRoute,
    staffAppraisalsRoute,
    staffProfileRoute,
    crewRoute,
    crewProfileRoute,
    attendanceRoute,
    performanceRoute,
    feedbackRoute,
    emergencyRoute,
    surveysRoute,
    surveyNewRoute,
    surveyEditRoute,
    surveyResultsRoute,
    galleryRoute,
    galleryAlbumRoute,
    galleryTrashRoute,
    gallerySettingsRoute,
    galleryCleanupRoute,
    galleryReportsRoute,
    galleryAuditRoute,
    hostelDashboardRoute,
    hostelResidentsRoute,
    hostelResidentRoute,
    hostelRoomsRoute,
    hostelRollCallRoute,
    hostelLeavesRoute,
    hostelVisitorsRoute,
    hostelFeesRoute,
    hostelDisciplineRoute,
    hostelComplaintsRoute,
    hostelSetupRoute,
    hostelAuditRoute,
    hostelReportsRoute,
    hostelSafetyRoute,
    hostelMessRoute,
    hostelHealthRoute,
    hostelLaundryRoute,
    hostelDutyRoute,
    hostelStudyRoute,
    hostelLockersRoute,
    hostelInspectionsRoute,
    gateRoute,
    officeRoute,
    officeDashboardRoute,
    officeStudentRoute,
    officeMonitorRoute,
    officeWingsRoute,
    timetableRoute,
    substitutesRoute,
    payrollRoute,
    feesRoute,
    libraryRoute,
    libraryBookRoute,
    libraryMemberRoute,
    inventoryRoute,
    assetRoute,
    stockItemRoute,
    examsRoute,
    quizzesRoute,
    activitiesRoute,
    transportRoute,
    routeBuilderRoute,
    routeRosterRoute,
    transportOpsRoute,
    driverAttendanceRoute,
    busAttendanceRoute,
    incidentsRoute,
    setupRoute,
    schoolsRoute,
    parentPreviewRoute,
    teacherPreviewRoute,
    usersRoute,
    notificationsRoute,
    appBannersRoute,
    meetingsRoute,
    diaryRoute,
    announcementsRoute,
    eventsRoute,
    grievancesRoute,
    chatRoute,
    fleetRoute,
    tripRoute,
    tripPlaybackRoute,
    tripHistoryRoute,
    maintenanceRoute,
    fleetAlertsRoute,
    accountsRoute,
  ]),
])

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  scrollRestoration: true,
  getScrollRestorationKey: (location) => location.pathname,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
