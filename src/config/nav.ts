import {
  BellRing,
  GalleryHorizontal,
  Building2,
  CalendarCheck,
  CalendarRange,
  ChartColumnBig,
  ClipboardCheck,
  ClipboardList,
  Repeat,
  Route,
  Wallet,
  GraduationCap,
  Grid3x3,
  IndianRupee,
  HeartHandshake,
  History,
  LayoutDashboard,
  School,
  ShieldCheck,
  // Smartphone,
  // TabletSmartphone,
  Siren,
  Trophy,
  Truck,
  UsersRound,
  Video,
  BookOpenCheck,
  Megaphone,
  MessagesSquare,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { ShortcutId } from './shortcuts'

export type NavPath =
  | '/'
  | '/parent-preview'
  | '/teacher-preview'
  | '/students'
  | '/admissions'
  | '/guardians'
  | '/staff'
  | '/staff/assignments'
  | '/attendance'
  | '/timetable'
  | '/substitutes'
  | '/payroll'
  | '/fees'
  | '/exams'
  | '/class-performance'
  | '/activities'
  | '/transport'
  | '/notifications'
  | '/meetings'
  | '/diary'
  | '/announcements'
  | '/chat'
  | '/app-banners'
  | '/fleet'
  | '/fleet/alerts'
  | '/fleet/history'
  | '/fleet/maintenance'
  | '/setup'
  | '/schools'
  | '/users'

export interface NavItem {
  to: NavPath
  label: string
  description: string
  icon: LucideIcon
  shortcut: ShortcutId
  permission?: string
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        to: '/',
        label: 'Dashboard',
        description: 'School at a glance',
        icon: LayoutDashboard,
        shortcut: 'nav.dashboard',
      },
    ],
  },
  // {
  //   label: 'App previews',
  //   items: [
  //     {
  //       to: '/parent-preview',
  //       label: 'Parent app',
  //       description:
  //         'What a parent sees for their child: attendance, bus, results, fees, diary, meetings, chat and news',
  //       icon: Smartphone,
  //       shortcut: 'nav.parentPreview',
  //       permission: 'students.view',
  //     },
  //     {
  //       to: '/teacher-preview',
  //       label: 'Teacher app',
  //       description:
  //         'What a teacher sees: today’s periods, classes, diary posts, parent meetings, chat and news',
  //       icon: TabletSmartphone,
  //       shortcut: 'nav.teacherPreview',
  //       permission: 'staff.view',
  //     },
  //   ],
  // },
  {
    label: 'People',
    items: [
      {
        to: '/students',
        label: 'Students',
        description: 'Profiles, classes and roll numbers',
        icon: GraduationCap,
        shortcut: 'nav.students',
        permission: 'students.view',
      },
      {
        to: '/admissions',
        label: 'Admissions',
        description: 'Applications and enrolment',
        icon: ClipboardList,
        shortcut: 'nav.admissions',
        permission: 'students.view',
      },
      {
        to: '/guardians',
        label: 'Parents',
        description: 'Parents and guardians with their children',
        icon: HeartHandshake,
        shortcut: 'nav.guardians',
        permission: 'students.view',
      },
      {
        to: '/staff',
        label: 'Staff',
        description: 'Teachers and staff with load, documents and bank details',
        icon: UsersRound,
        shortcut: 'nav.staff',
        permission: 'staff.view',
      },
      {
        to: '/staff/assignments',
        label: 'Teacher assignments',
        description: 'Who teaches each subject in each section',
        icon: Grid3x3,
        shortcut: 'nav.assignments',
        permission: 'staff.view',
      },
    ],
  },
  {
    label: 'Academics',
    items: [
      {
        to: '/attendance',
        label: 'Attendance',
        description: 'Daily attendance, staff check-ins and leave requests',
        icon: CalendarCheck,
        shortcut: 'nav.attendance',
        permission: 'attendance.view',
      },
      {
        to: '/timetable',
        label: 'Timetable',
        description: 'Weekly timetables, teacher workload and the bell schedule',
        icon: CalendarRange,
        shortcut: 'nav.timetable',
        permission: 'timetable.view',
      },
      {
        to: '/substitutes',
        label: 'Proxy',
        description: 'Cover for absent teachers, period by period',
        icon: Repeat,
        shortcut: 'nav.substitutes',
        permission: 'timetable.view',
      },
      {
        to: '/exams',
        label: 'Exams',
        description: 'Exams, marks entry, ranked results and top rank holders',
        icon: ClipboardCheck,
        shortcut: 'nav.exams',
        permission: 'exams.view',
      },
      {
        to: '/class-performance',
        label: 'Class performance',
        description:
          'Class-wise average, pass, fail and attendance, students below average and special classes',
        icon: ChartColumnBig,
        shortcut: 'nav.performance',
        permission: 'exams.view',
      },
      {
        to: '/activities',
        label: 'Sports & activities',
        description: 'Students ranked by sports, competitions and activities, not only marks',
        icon: Trophy,
        shortcut: 'nav.activities',
        permission: 'students.view',
      },
    ],
  },
  {
    label: 'Finance',
    items: [
      {
        to: '/payroll',
        label: 'Payroll',
        description: 'Salaries, monthly payroll runs and payslips',
        icon: Wallet,
        shortcut: 'nav.payroll',
        permission: 'payroll.view',
      },
      {
        to: '/fees',
        label: 'Fees',
        description: 'Fee plans, invoices, payments, receipts and dues',
        icon: IndianRupee,
        shortcut: 'nav.fees',
        permission: 'fees.view',
      },
    ],
  },
  {
    label: 'Communication',
    items: [
      {
        to: '/notifications',
        label: 'Notifications',
        description: 'Outbox and delivery status',
        icon: BellRing,
        shortcut: 'nav.notifications',
        permission: 'notifications.view',
      },
      {
        to: '/meetings',
        label: 'Meetings',
        description: 'Teacher and parent video meetings, who booked whom and the call log',
        icon: Video,
        shortcut: 'nav.meetings',
        permission: 'meetings.view',
      },
      {
        to: '/diary',
        label: 'Homework',
        description: 'Homework, remarks, feedback and notes teachers send to parents',
        icon: BookOpenCheck,
        shortcut: 'nav.diary',
        permission: 'diary.view',
      },
      {
        to: '/announcements',
        label: 'Announcements',
        description: 'Notices to parents, staff or classes, and who read them',
        icon: Megaphone,
        shortcut: 'nav.announcements',
        permission: 'announcements.view',
      },
      {
        to: '/chat',
        label: 'Chat audit',
        description: 'Teacher and parent conversations and reported messages',
        icon: MessagesSquare,
        shortcut: 'nav.chat',
        permission: 'chat.audit',
      },
      {
        to: '/app-banners',
        label: 'App banners',
        description: 'Image banners for the Staff and Parent app home screens',
        icon: GalleryHorizontal,
        shortcut: 'nav.appBanners',
        permission: 'notifications.view',
      },
    ],
  },
  {
    label: 'Fleet',
    items: [
      {
        to: '/fleet',
        label: 'Bus tracking',
        description: 'Where every bus is and whether it is moving',
        icon: Truck,
        shortcut: 'nav.fleet',
        permission: 'fleet.view',
      },
      {
        to: '/fleet/alerts',
        label: 'Alerts',
        description: 'SOS from drivers and safety alerts from the buses',
        icon: Siren,
        shortcut: 'nav.alerts',
        permission: 'fleet.view',
      },
      {
        to: '/fleet/history',
        label: 'Trip history',
        description: 'Past trips by date, route and bus, with a replay of each one',
        icon: History,
        shortcut: 'nav.tripHistory',
        permission: 'fleet.view',
      },
      {
        to: '/fleet/maintenance',
        label: 'Maintenance',
        description: 'Repair tickets from engine faults and the fuel log',
        icon: Wrench,
        shortcut: 'nav.maintenance',
        permission: 'fleet.view',
      },
      {
        to: '/transport',
        label: 'Buses and routes',
        description: 'Buses, drivers, routes, stops and students on each bus',
        icon: Route,
        shortcut: 'nav.transport',
        permission: 'fleet.view',
      },
    ],
  },
  {
    label: 'Settings',
    items: [
      {
        to: '/setup',
        label: 'School setup',
        description: 'Profile, years, classes, subjects, holidays',
        icon: School,
        shortcut: 'nav.setup',
        permission: 'schools.view',
      },
      {
        to: '/schools',
        label: 'Schools',
        description: 'Every school on the platform',
        icon: Building2,
        shortcut: 'nav.schools',
        permission: 'platform.schools',
      },
      {
        to: '/users',
        label: 'Users & access',
        description: 'Logins, roles and access',
        icon: ShieldCheck,
        shortcut: 'nav.users',
        permission: 'users.view',
      },
    ],
  },
]

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items)

const isPlayback = (pathname: string) =>
  pathname.startsWith('/fleet/trips/') && pathname.endsWith('/playback')

const matches = (pathname: string, to: string) =>
  to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`)

export function currentNav(pathname: string): { group: string; item: NavItem } {
  const target: string = isPlayback(pathname) ? '/fleet/history' : pathname
  let best: { group: string; item: NavItem } | null = null
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (matches(target, item.to) && (!best || item.to.length > best.item.to.length)) {
        best = { group: group.label, item }
      }
    }
  }
  return best ?? { group: NAV_GROUPS[0].label, item: NAV_GROUPS[0].items[0] }
}
