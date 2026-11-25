import type { BadgeTone } from '@/components/ui/badge'
import type {
  AssetCondition,
  BelongingStatus,
  CheckResult,
  InspectionResult,
  LockerSettableStatus,
  LockerSize,
  LockerStatus,
  LockType,
} from '../api-rooms'
import type { Tone } from '../labels'

export const LOCKER_STATUS: Record<LockerStatus, Tone> = {
  available: { label: 'Available', tone: 'success' },
  allotted: { label: 'Allotted', tone: 'info' },
  damaged: { label: 'Damaged', tone: 'danger' },
  blocked: { label: 'Blocked', tone: 'neutral' },
}

export const LOCKER_SETTABLE: LockerSettableStatus[] = ['available', 'damaged', 'blocked']

export const LOCKER_SIZE: Record<LockerSize, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
}

export const LOCK_TYPE: Record<LockType, string> = {
  school: 'School lock',
  own: "Student's own padlock",
}

export const ASSET_CONDITION: Record<AssetCondition, Tone> = {
  good: { label: 'Good', tone: 'success' },
  fair: { label: 'Fair', tone: 'info' },
  damaged: { label: 'Damaged', tone: 'danger' },
  missing: { label: 'Missing', tone: 'warning' },
}

export const INSPECTION_RESULT: Record<InspectionResult, Tone> = {
  ok: { label: 'All fine', tone: 'success' },
  issues: { label: 'Issues found', tone: 'warning' },
}

export const CHECK_RESULT: Record<CheckResult, Tone> = {
  ok: { label: 'OK', tone: 'success' },
  issue: { label: 'Issue', tone: 'danger' },
  na: { label: 'N/A', tone: 'neutral' },
}

export const BELONGING_STATUS: Record<BelongingStatus, Tone> = {
  with_student: { label: 'With the student', tone: 'success' },
  returned_home: { label: 'Taken home', tone: 'neutral' },
  lost: { label: 'Lost', tone: 'danger' },
  confiscated: { label: 'Confiscated', tone: 'warning' },
}

export const scoreTone = (score: number): BadgeTone =>
  score >= 90 ? 'success' : score >= 70 ? 'info' : score >= 50 ? 'warning' : 'danger'

export const inspectionScore = (results: CheckResult[]) => {
  const ok = results.filter((result) => result === 'ok').length
  const issues = results.filter((result) => result === 'issue').length
  if (!ok && !issues) return 100
  return Math.round((ok / (ok + issues)) * 100)
}

export const placeLine = (parts: (string | null | undefined)[]) => parts.filter(Boolean).join(' · ')
