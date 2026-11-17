export const DAYS = [
  { value: 1, short: 'Mon', label: 'Monday' },
  { value: 2, short: 'Tue', label: 'Tuesday' },
  { value: 3, short: 'Wed', label: 'Wednesday' },
  { value: 4, short: 'Thu', label: 'Thursday' },
  { value: 5, short: 'Fri', label: 'Friday' },
  { value: 6, short: 'Sat', label: 'Saturday' },
]

export const dayLabel = (day: number) => DAYS.find((item) => item.value === day)?.label ?? ''

export const slotKey = (day: number, periodNo: number) => `${day}:${periodNo}`

export interface SubjectTone {
  border: string
  bg: string
  text: string
  badge: string
}

export function getSubjectTone(subjectName?: string, subjectCode?: string): SubjectTone {
  const normalized = ((subjectName ?? '') + ' ' + (subjectCode ?? '')).toLowerCase()

  if (
    normalized.includes('math') ||
    normalized.includes('alg') ||
    normalized.includes('geom') ||
    normalized.includes('calc')
  ) {
    return {
      border: 'border-l-blue-500 border-blue-200/80 dark:border-blue-800/80',
      bg: 'bg-blue-50/80 hover:bg-blue-100/70 dark:bg-blue-950/35 dark:hover:bg-blue-900/50',
      text: 'text-blue-950 dark:text-blue-100',
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/70 dark:text-blue-300',
    }
  }
  if (
    normalized.includes('sci') ||
    normalized.includes('phy') ||
    normalized.includes('chem') ||
    normalized.includes('bio') ||
    normalized.includes('evs') ||
    normalized.includes('bot') ||
    normalized.includes('zoo')
  ) {
    return {
      border: 'border-l-emerald-500 border-emerald-200/80 dark:border-emerald-800/80',
      bg: 'bg-emerald-50/80 hover:bg-emerald-100/70 dark:bg-emerald-950/35 dark:hover:bg-emerald-900/50',
      text: 'text-emerald-950 dark:text-emerald-100',
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-300',
    }
  }
  if (normalized.includes('eng') || normalized.includes('lit') || normalized.includes('gramm')) {
    return {
      border: 'border-l-violet-500 border-violet-200/80 dark:border-violet-800/80',
      bg: 'bg-violet-50/80 hover:bg-violet-100/70 dark:bg-violet-950/35 dark:hover:bg-violet-900/50',
      text: 'text-violet-950 dark:text-violet-100',
      badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/70 dark:text-violet-300',
    }
  }
  if (
    normalized.includes('tam') ||
    normalized.includes('hin') ||
    normalized.includes('lang') ||
    normalized.includes('fren') ||
    normalized.includes('sans')
  ) {
    return {
      border: 'border-l-purple-500 border-purple-200/80 dark:border-purple-800/80',
      bg: 'bg-purple-50/80 hover:bg-purple-100/70 dark:bg-purple-950/35 dark:hover:bg-purple-900/50',
      text: 'text-purple-950 dark:text-purple-100',
      badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/70 dark:text-purple-300',
    }
  }
  if (
    normalized.includes('soc') ||
    normalized.includes('hist') ||
    normalized.includes('geog') ||
    normalized.includes('civ') ||
    normalized.includes('econ')
  ) {
    return {
      border: 'border-l-amber-500 border-amber-200/80 dark:border-amber-800/80',
      bg: 'bg-amber-50/80 hover:bg-amber-100/70 dark:bg-amber-950/35 dark:hover:bg-amber-900/50',
      text: 'text-amber-950 dark:text-amber-100',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/70 dark:text-amber-300',
    }
  }
  if (
    normalized.includes('comp') ||
    normalized.includes('it') ||
    normalized.includes('cs') ||
    normalized.includes('ai') ||
    normalized.includes('code') ||
    normalized.includes('robot')
  ) {
    return {
      border: 'border-l-cyan-500 border-cyan-200/80 dark:border-cyan-800/80',
      bg: 'bg-cyan-50/80 hover:bg-cyan-100/70 dark:bg-cyan-950/35 dark:hover:bg-cyan-900/50',
      text: 'text-cyan-950 dark:text-cyan-100',
      badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/70 dark:text-cyan-300',
    }
  }
  if (
    normalized.includes('sport') ||
    normalized.includes('pt') ||
    normalized.includes('pet') ||
    normalized.includes('game') ||
    normalized.includes('yoga')
  ) {
    return {
      border: 'border-l-orange-500 border-orange-200/80 dark:border-orange-800/80',
      bg: 'bg-orange-50/80 hover:bg-orange-100/70 dark:bg-orange-950/35 dark:hover:bg-orange-900/50',
      text: 'text-orange-950 dark:text-orange-100',
      badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/70 dark:text-orange-300',
    }
  }
  if (
    normalized.includes('art') ||
    normalized.includes('draw') ||
    normalized.includes('craft') ||
    normalized.includes('musi')
  ) {
    return {
      border: 'border-l-rose-500 border-rose-200/80 dark:border-rose-800/80',
      bg: 'bg-rose-50/80 hover:bg-rose-100/70 dark:bg-rose-950/35 dark:hover:bg-rose-900/50',
      text: 'text-rose-950 dark:text-rose-100',
      badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/70 dark:text-rose-300',
    }
  }

  const fallbacks: SubjectTone[] = [
    {
      border: 'border-l-indigo-500 border-indigo-200/80 dark:border-indigo-800/80',
      bg: 'bg-indigo-50/80 hover:bg-indigo-100/70 dark:bg-indigo-950/35 dark:hover:bg-indigo-900/50',
      text: 'text-indigo-950 dark:text-indigo-100',
      badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/70 dark:text-indigo-300',
    },
    {
      border: 'border-l-teal-500 border-teal-200/80 dark:border-teal-800/80',
      bg: 'bg-teal-50/80 hover:bg-teal-100/70 dark:bg-teal-950/35 dark:hover:bg-teal-900/50',
      text: 'text-teal-950 dark:text-teal-100',
      badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/70 dark:text-teal-300',
    },
    {
      border: 'border-l-fuchsia-500 border-fuchsia-200/80 dark:border-fuchsia-800/80',
      bg: 'bg-fuchsia-50/80 hover:bg-fuchsia-100/70 dark:bg-fuchsia-950/35 dark:hover:bg-fuchsia-900/50',
      text: 'text-fuchsia-950 dark:text-fuchsia-100',
      badge: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/70 dark:text-fuchsia-300',
    },
    {
      border: 'border-l-sky-500 border-sky-200/80 dark:border-sky-800/80',
      bg: 'bg-sky-50/80 hover:bg-sky-100/70 dark:bg-sky-950/35 dark:hover:bg-sky-900/50',
      text: 'text-sky-950 dark:text-sky-100',
      badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/70 dark:text-sky-300',
    },
  ]
  let hash = 0
  for (let i = 0; i < normalized.length; i++) hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0
  return fallbacks[hash % fallbacks.length]
}

