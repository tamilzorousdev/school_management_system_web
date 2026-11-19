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
import { gateSearchSchema } from '@/features/gate/search'
import { GeneralErrorPage, NotFoundPage } from '@/features/errors/error-pages'
import { meetingsSearchSchema } from '@/features/meetings/search'
import { diarySearchSchema } from '@/features/diary/search'
import { announcementsSearchSchema } from '@/features/announcements/search'
import { eventsSearchSchema } from '@/features/events/search'
import { chatSearchSchema } from '@/features/chat/search'
import { outboxSearchSchema } from '@/features/notifications/search'
import { appBannersSearchSchema } from '@/features/app-banners/search'
import { setupSearchSchema } from '@/features/setup/search'
import {
  assignmentsSearchSchema,
  staffProfileSearchSchema,
  staffSearchSchema,
} from '@/features/staff/search'
import { crewProfileSearchSchema, crewSearchSchema } from '@/features/crew/search'
import {
  admissionsSearchSchema,
  guardiansSearchSchema,
  studentProfileSearchSchema,
  studentsSearchSchema,
} from '@/features/students/search'
import { payrollSearchSchema } from '@/features/payroll/search'
import { feesSearchSchema } from '@/features/fees/search'
import { libraryDetailSearchSchema, librarySearchSchema } from '@/features/library/search'
import { examsSearchSchema } from '@/features/exams/search'
import { tripHistorySearchSchema } from '@/features/fleet/search'
import { maintenanceSearchSchema } from '@/features/maintenance/search'
import { alertsSearchSchema } from '@/features/alerts/search'
import { activitiesSearchSchema } from '@/features/activities/search'
import { substitutesSearchSchema } from '@/features/substitutes/search'
import { timetableSearchSchema } from '@/features/timetable/search'
import { transportSearchSchema } from '@/features/transport/search'
import { usersSearchSchema } from '@/features/users/search'
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

const gateRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/gate',
  validateSearch: gateSearchSchema,
  component: lazyRouteComponent(() => import('@/features/gate/pages/gate-page'), 'GatePage'),
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
  appRoute.addChildren([
    dashboardRoute,
    studentsRoute,
    studentRoute,
    admissionsRoute,
    guardiansRoute,
    staffRoute,
    staffAssignmentsRoute,
    staffProfileRoute,
    crewRoute,
    crewProfileRoute,
    attendanceRoute,
    performanceRoute,
    feedbackRoute,
    emergencyRoute,
    gateRoute,
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
    activitiesRoute,
    transportRoute,
    routeBuilderRoute,
    routeRosterRoute,
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
    chatRoute,
    fleetRoute,
    tripRoute,
    tripPlaybackRoute,
    tripHistoryRoute,
    maintenanceRoute,
    fleetAlertsRoute,
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
