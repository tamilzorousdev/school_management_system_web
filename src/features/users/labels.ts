import type { AppSection } from '@/features/auth/api'

export const APP_LABELS: Record<AppSection, string> = {
  admin: 'Admin web',
  staff: 'Staff app',
  parent: 'Parent app',
  driver: 'Driver app',
}

export interface RoleMeta {
  code: string
  name: string
  suitablePerson: string
  suitablePersonEn?: string
  canDo: string[]
  cannotDo?: string[]
}

export const ROLE_METADATA: Record<string, RoleMeta> = {
  SUPER_ADMIN: {
    code: 'SUPER_ADMIN',
    name: 'Super admin',
    suitablePerson: 'Correspondent / Chairman / Platform Owner',
    suitablePersonEn: 'Correspondent / Chairman / Platform Owner',
    canDo: [
      '100% unrestricted access across all schools on the platform',
      'Create new schools and switch seamlessly between schools',
      'Full control over finances, payroll, users, and global settings',
    ],
  },
  ADMIN: {
    code: 'ADMIN',
    name: 'School admin',
    suitablePerson: 'Vice Principal / Head of Admin / IT Administrator',
    suitablePersonEn: 'Vice Principal / Head of Admin / IT Administrator',
    canDo: [
      'Full administrative control over this school (staff, students, fees, exams)',
      'Manage staff and student records, classes, and sections',
      'Configure fee structures, finalize payroll, and school setup',
      'Publish exams, manage report cards, and send school broadcasts',
    ],
    cannotDo: [
      'Cannot assign proxy teachers (only the Administrative Officer can assign proxies)',
    ],
  },
  PRINCIPAL: {
    code: 'PRINCIPAL',
    name: 'Principal',
    suitablePerson: 'School Principal / Headmaster / Academic Head',
    suitablePersonEn: 'School Principal / Academic Head',
    canDo: [
      'Final approval authority for staff leave requests',
      'Full view-only oversight across all modules (students, staff, fees, exams, payroll)',
      'Send school-wide emergency broadcasts to parents and staff',
      'Moderate diary posts and inspect parent-teacher meeting logs',
    ],
    cannotDo: [
      'Cannot collect fees, modify invoices, or process payroll',
    ],
  },
  AO: {
    code: 'AO',
    name: 'Administrative officer',
    suitablePerson: 'Office Manager / Head Clerk / Accountant',
    suitablePersonEn: 'Office Manager / Head Clerk / Administrative Officer',
    canDo: [
      'The ONLY school role that assigns proxy teachers when staff are on leave',
      'Fee collection: create invoices, record payments, and track pending dues',
      'Process student applications, admissions, and assign roll numbers',
      'Verify and update daily student and staff attendance',
      'Publish and manage school announcements and notices',
    ],
    cannotDo: [
      'Cannot finalize payroll salaries or change user roles and school setup',
    ],
  },
  TRANSPORT_INCHARGE: {
    code: 'TRANSPORT_INCHARGE',
    name: 'Transport in-charge',
    suitablePerson: 'Transport Manager / Fleet Supervisor',
    suitablePersonEn: 'Transport Manager / Bus Supervisor',
    canDo: [
      'Manage buses, fleet documents (FC, Insurance), and maintenance schedules',
      'Configure routes, pick-up/drop stops, and student bus allocations',
      'Live GPS bus map tracking and real-time trip monitoring',
      'Manage drivers and bus attendants',
      'Broadcast bus delay and transport alerts to parents',
    ],
    cannotDo: [
      'No access to exams, student marks, academic records, or payroll',
    ],
  },
  STORE_KEEPER: {
    code: 'STORE_KEEPER',
    name: 'Store keeper',
    suitablePerson: 'Store Keeper / Lab Assistant / Inventory Clerk',
    suitablePersonEn: 'Store Keeper / Inventory Clerk',
    canDo: [
      'Register assets, print tags and allocate them to staff, departments and rooms',
      'Receive, issue and adjust store stock and handle requisitions',
      'Open repair tickets, run asset verifications and stock counts',
    ],
    cannotDo: ['Cannot approve transfers, requisitions or disposals'],
  },
  HOD: {
    code: 'HOD',
    name: 'Head of department',
    suitablePerson: 'Head of Department / Senior Subject Lead',
    suitablePersonEn: 'Head of Department / Senior Subject Lead',
    canDo: [
      'Use Staff app for timetable, class attendance, and student marks entry',
      'First-level endorsement for department teachers\' leave requests',
    ],
  },
  TEACHER: {
    code: 'TEACHER',
    name: 'Teacher',
    suitablePerson: 'Class Teacher / Subject Teacher',
    suitablePersonEn: 'Class Teachers & Subject Teachers',
    canDo: [
      'Use Staff app to conduct classes and mark daily student attendance',
      'Enter and update student marks for assigned subjects and classes',
      'Post homework, daily diary updates, and chat with parents',
    ],
  },
  PARENT: {
    code: 'PARENT',
    name: 'Parent',
    suitablePerson: 'Parent / Legal Guardian',
    suitablePersonEn: 'Parents & Guardians',
    canDo: [
      'Use Parent app to track child attendance, report cards, and fee dues',
      'Live GPS tracking of school bus during daily transit',
    ],
  },
  DRIVER: {
    code: 'DRIVER',
    name: 'Driver',
    suitablePerson: 'School Bus Driver',
    suitablePersonEn: 'School Bus Driver',
    canDo: [
      'Use Driver app to operate morning and evening routes with live GPS',
    ],
  },
  ATTENDANT: {
    code: 'ATTENDANT',
    name: 'Bus attendant',
    suitablePerson: 'Bus Attendant / Conductor / Ayah',
    suitablePersonEn: 'Bus Attendant / Conductor',
    canDo: [
      'Use Driver app to scan and log student boarding and deboarding',
    ],
  },
}

export function getRoleMeta(code?: string): RoleMeta | undefined {
  if (!code) return undefined
  return (
    ROLE_METADATA[code] ??
    ROLE_METADATA[code.toUpperCase()] ??
    ROLE_METADATA[code.toLowerCase()] ??
    ROLE_METADATA[code.toUpperCase().replace(/[- ]/g, '_')]
  )
}


