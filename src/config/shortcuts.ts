export type ShortcutGroup = 'Navigation' | 'General' | 'Users'

export interface ShortcutDefinition {
  combo: string
  label: string
  group: ShortcutGroup
}

export const SHORTCUTS = {
  'nav.dashboard': { combo: 'g d', label: 'Go to dashboard', group: 'Navigation' },
  'nav.students': { combo: 'g s', label: 'Go to students', group: 'Navigation' },
  'nav.staff': { combo: 'g t', label: 'Go to staff', group: 'Navigation' },
  'nav.assignments': { combo: 'g e', label: 'Go to teacher assignments', group: 'Navigation' },
  'nav.attendance': { combo: 'g r', label: 'Go to attendance', group: 'Navigation' },
  'nav.timetable': { combo: 'g w', label: 'Go to timetable', group: 'Navigation' },
  'nav.substitutes': { combo: 'g v', label: 'Go to proxy', group: 'Navigation' },
  'nav.payroll': { combo: 'g y', label: 'Go to payroll', group: 'Navigation' },
  'nav.fees': { combo: 'g f', label: 'Go to fees', group: 'Navigation' },
  'nav.exams': { combo: 'g x', label: 'Go to exams', group: 'Navigation' },
  'nav.performance': { combo: 'g 4', label: 'Go to class performance', group: 'Navigation' },
  'nav.feedback': { combo: 'g 5', label: 'Go to teacher feedback', group: 'Navigation' },
  'nav.activities': { combo: 'g k', label: 'Go to sports and activities', group: 'Navigation' },
  'nav.transport': { combo: 'g m', label: 'Go to buses and routes', group: 'Navigation' },
  'nav.admissions': { combo: 'g a', label: 'Go to admissions', group: 'Navigation' },
  'nav.guardians': { combo: 'g p', label: 'Go to parents', group: 'Navigation' },
  'nav.setup': { combo: 'g c', label: 'Go to school setup', group: 'Navigation' },
  'nav.schools': { combo: 'g o', label: 'Go to schools', group: 'Navigation' },
  'nav.users': { combo: 'g u', label: 'Go to users and access', group: 'Navigation' },
  'nav.notifications': { combo: 'g n', label: 'Go to notifications', group: 'Navigation' },
  'nav.meetings': { combo: 'g j', label: 'Go to meetings', group: 'Navigation' },
  'nav.diary': { combo: 'g z', label: 'Go to homework', group: 'Navigation' },
  'nav.announcements': { combo: 'g q', label: 'Go to announcements', group: 'Navigation' },
  'nav.chat': { combo: 'g g', label: 'Go to chat audit', group: 'Navigation' },
  'nav.appBanners': { combo: 'g 2', label: 'Go to app banners', group: 'Navigation' },
  'nav.fleet': { combo: 'g b', label: 'Go to bus tracking', group: 'Navigation' },
  'nav.alerts': { combo: 'g l', label: 'Go to fleet alerts', group: 'Navigation' },
  'nav.tripHistory': { combo: 'g h', label: 'Go to trip history', group: 'Navigation' },
  'nav.maintenance': { combo: 'g i', label: 'Go to maintenance', group: 'Navigation' },
  'nav.parentPreview': { combo: 'g 1', label: 'Go to parent app preview', group: 'Navigation' },
  'nav.teacherPreview': {
    combo: 'g 3',
    label: 'Go to teacher app preview',
    group: 'Navigation',
  },
  'app.help': { combo: 'shift+?', label: 'Show keyboard shortcuts', group: 'General' },
  'app.search': { combo: '/', label: 'Focus search', group: 'General' },
  'app.refresh': { combo: 'alt+r', label: 'Refresh data', group: 'General' },
  'app.theme': { combo: 'alt+t', label: 'Switch light or dark theme', group: 'General' },
  'app.sidebar': { combo: 'mod+b', label: 'Collapse or expand sidebar', group: 'General' },
  'modal.submit': { combo: 'mod+s', label: 'Save the open form', group: 'General' },
  'users.create': { combo: 'alt+n', label: 'Add a user', group: 'Users' },
  'students.create': { combo: 'alt+n', label: 'Add a student or application', group: 'Users' },
  'maintenance.create': {
    combo: 'alt+n',
    label: 'Add a maintenance ticket or fuel entry',
    group: 'Users',
  },
  'banners.create': {
    combo: 'alt+n',
    label: 'Add a banner',
    group: 'Users',
  },
} as const satisfies Record<string, ShortcutDefinition>

export type ShortcutId = keyof typeof SHORTCUTS

export const SHORTCUT_GROUPS: ShortcutGroup[] = ['General', 'Navigation', 'Users']
