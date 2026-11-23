import type { BadgeTone } from '@/components/ui/badge'
import type {
  AppraisalRecommendation,
  AppraisalScores,
  AppraisalStatus,
  OverallRating,
} from './api'

export const APPRAISAL_STATUS: Record<AppraisalStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  submitted: { label: 'Submitted', tone: 'info' },
  reviewed: { label: 'Reviewed', tone: 'warning' },
  appealed: { label: 'Appealed', tone: 'danger' },
  finalized: { label: 'Finalized', tone: 'success' },
}

export const OVERALL_RATING: Record<OverallRating, { label: string; tone: BadgeTone }> = {
  outstanding: { label: 'Outstanding', tone: 'success' },
  exceeds_expectations: { label: 'Exceeds expectations', tone: 'info' },
  meets_expectations: { label: 'Meets expectations', tone: 'neutral' },
  needs_improvement: { label: 'Needs improvement', tone: 'warning' },
  unsatisfactory: { label: 'Unsatisfactory', tone: 'danger' },
}

export const RECOMMENDATION: Record<AppraisalRecommendation, string> = {
  increment: 'Increment',
  promotion: 'Promotion',
  retention: 'Retention',
  pip: 'Performance improvement plan',
}

export const CRITERIA: { key: keyof AppraisalScores; label: string }[] = [
  { key: 'teaching_effectiveness', label: 'Teaching effectiveness' },
  { key: 'student_outcomes', label: 'Student outcomes' },
  { key: 'classroom_management', label: 'Classroom management' },
  { key: 'professional_conduct', label: 'Professional conduct' },
  { key: 'extracurricular_contribution', label: 'Extracurricular contribution' },
]

export function overallScore(scores: Partial<Record<keyof AppraisalScores, number>>) {
  const values = CRITERIA.map((item) => Number(scores[item.key]))
  if (values.some((value) => !Number.isFinite(value) || value < 1 || value > 5)) return null
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
}

export function ratingOf(score: number): OverallRating {
  if (score >= 4.6) return 'outstanding'
  if (score >= 3.8) return 'exceeds_expectations'
  if (score >= 3.0) return 'meets_expectations'
  if (score >= 2.0) return 'needs_improvement'
  return 'unsatisfactory'
}

export const scoreText = (value: number) => value.toFixed(1)
