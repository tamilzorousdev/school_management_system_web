import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { downloadFile, openFile } from '@/lib/files'
import { examKeys, type ResultStatus } from './api'

export interface ReportCardParams {
  academic_year_id?: number
  term_id?: number
  exam_id?: number
}

export interface ReportCardOption {
  id: number
  name: string
}

export interface ReportCardCell {
  exam_id: number
  marks: number | null
  max_marks: number
  pass_marks: number
  is_absent: boolean
  passed: boolean | null
}

export interface ReportCardColumn {
  exam_id: number
  name: string
  start_date: string
  end_date: string
  common_max: number | null
  total: number
  max_total: number
  percent: number | null
  grade: string | null
  result: ResultStatus
  section_rank: number | null
  section_size: number
  class_rank: number | null
  class_size: number
}

export interface ReportCardSubject {
  subject_id: number
  name: string
  code: string
  cells: (ReportCardCell | null)[]
  total: number
  max_total: number
  percent: number | null
  grade: string | null
  passed: boolean | null
}

export interface ReportCard {
  school: {
    name: string
    address: string | null
    phone: string | null
    email: string | null
    board: string | null
    logo_url: string | null
    principal_name?: string | null
    signature_url?: string | null
    seal_url?: string | null
  }
  student: {
    id: number
    full_name: string
    admission_no: string
    class_name: string
    section_name: string
    roll_no: number | null
    dob: string
    parent_name: string | null
    class_teacher: string | null
    photo_url: string | null
  }
  scope: {
    kind: 'year' | 'term' | 'exam'
    title: string
    academic_year: ReportCardOption
    term: ReportCardOption | null
    exam: ReportCardOption | null
    from: string
    to: string
  }
  terms: { term_id: number | null; name: string; exam_ids: number[] }[]
  columns: ReportCardColumn[]
  subjects: ReportCardSubject[]
  overall: {
    total: number
    max_total: number
    percent: number | null
    grade: string | null
    result: ResultStatus
  }
  attendance: { working_days: number; present_days: number; percent: number | null }
  remarks: string
  grade_scale: { grade: string; min: number; max: number }[]
  options: {
    academic_years: ReportCardOption[]
    terms: ReportCardOption[]
    exams: (ReportCardOption & { term_id: number | null })[]
  }
  pdf_path: string
  generated_at: string
}

const reportCardKey = (studentId: number, params: ReportCardParams) =>
  [...examKeys.all, 'report-card', studentId, params] as const

const cardPdfUrl = (studentId: number) => `/admin/students/${studentId}/report-card/pdf`
const sectionPdfUrl = (sectionId: number) => `/admin/report-cards/sections/${sectionId}/pdf`

export const reportCardsApi = {
  get: (studentId: number, params: ReportCardParams) =>
    api.get<ReportCard>(`/admin/students/${studentId}/report-card`, { ...params }),
  openPdf: (studentId: number, params: ReportCardParams) =>
    openFile(cardPdfUrl(studentId), { ...params }),
  downloadPdf: (studentId: number, params: ReportCardParams, filename: string) =>
    downloadFile(cardPdfUrl(studentId), filename, { ...params }),
  openSectionPdf: (sectionId: number, params: Omit<ReportCardParams, 'academic_year_id'>) =>
    openFile(sectionPdfUrl(sectionId), { ...params }),
}

export function useReportCard(studentId: number, params: ReportCardParams) {
  return useQuery({
    queryKey: reportCardKey(studentId, params),
    queryFn: () => reportCardsApi.get(studentId, params),
    placeholderData: keepPreviousData,
  })
}
