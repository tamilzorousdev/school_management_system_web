import type { BadgeTone } from '@/components/ui/badge'
import type { Meal, MenuSource, SkipSource } from '../api-care'
import type { Tone } from '../labels'

export const MEALS: Meal[] = ['breakfast', 'lunch', 'snacks', 'dinner']

export const MEAL: Record<Meal, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snacks: 'Snacks',
  dinner: 'Dinner',
}

export const MEAL_OPTIONS = MEALS.map((meal) => ({ value: meal, label: MEAL[meal] }))

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

export const MENU_SOURCE: Record<MenuSource, Tone> = {
  override: { label: 'Special for the date', tone: 'warning' },
  hostel_week: { label: 'Hostel menu', tone: 'info' },
  school_week: { label: 'School menu', tone: 'neutral' },
  none: { label: 'Not set', tone: 'neutral' },
}

export const SKIP_SOURCE: Record<SkipSource, string> = {
  parent: 'Parent',
  warden: 'Warden',
}

export const MEAL_MARK_TONE: Record<'ate' | 'skipped', BadgeTone> = {
  ate: 'success',
  skipped: 'warning',
}

export const SKIP_MAX_DAYS = 30

export function mealAt(time: string): Meal {
  if (time < '10:30') return 'breakfast'
  if (time < '15:00') return 'lunch'
  if (time < '18:30') return 'snacks'
  return 'dinner'
}

export const mealList = (meals: Meal[]) => meals.map((meal) => MEAL[meal]).join(', ')
