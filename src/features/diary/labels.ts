import type { BadgeTone } from '@/components/ui/badge'
import type { DiaryStatus, DiaryType } from './api'

export const DIARY_STATUS: Record<DiaryStatus, { label: string; tone: BadgeTone }> = {
  pending_review: { label: 'Waiting for review', tone: 'warning' },
  published: { label: 'Published', tone: 'success' },
  rejected: { label: 'Sent back', tone: 'danger' },
  hidden: { label: 'Hidden', tone: 'neutral' },
}

export const DIARY_TYPE: Record<DiaryType, { label: string; tone: BadgeTone }> = {
  homework: { label: 'Homework', tone: 'info' },
  remark: { label: 'Remark', tone: 'warning' },
  feedback: { label: 'Feedback', tone: 'success' },
  note: { label: 'Note', tone: 'neutral' },
}
