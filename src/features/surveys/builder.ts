import type { FieldError } from '@/lib/api/errors'
import { uniqueId } from '@/lib/utils'
import type { QuestionInput, QuestionType, TemplateQuestion } from './api'
import { isChoice, MAX_OPTIONS, MIN_OPTIONS } from './labels'

export interface DraftQuestion {
  key: string
  type: QuestionType
  text: string
  options: string[]
  is_required: boolean
}

export interface SurveyDraft {
  title: string
  description: string
  questions: DraftQuestion[]
}

export const emptyDraft: SurveyDraft = { title: '', description: '', questions: [] }

export const blankQuestion = (type: QuestionType): DraftQuestion => ({
  key: uniqueId(),
  type,
  text: '',
  options: isChoice(type) ? ['', ''] : [],
  is_required: true,
})

export const fromQuestions = (questions: TemplateQuestion[]): DraftQuestion[] =>
  questions.map((question) => ({
    key: uniqueId(),
    type: question.type,
    text: question.text,
    options: [...question.options],
    is_required: question.is_required,
  }))

export const changeType = (question: DraftQuestion, type: QuestionType): DraftQuestion => ({
  ...question,
  type,
  options: isChoice(type) ? (question.options.length ? question.options : ['', '']) : [],
})

export const move = <T>(items: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= items.length) return items
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item!)
  return next
}

export const toQuestionInputs = (questions: DraftQuestion[]): QuestionInput[] =>
  questions.map((question) => ({
    type: question.type,
    text: question.text.trim(),
    is_required: question.is_required,
    ...(isChoice(question.type)
      ? { options: question.options.map((option) => option.trim()) }
      : {}),
  }))

export function draftErrors(draft: SurveyDraft, sending = false): Record<string, string> {
  const errors: Record<string, string> = {}
  const title = draft.title.trim()
  if (title.length < 3 || title.length > 150) errors.title = 'Write a title of 3 to 150 characters'
  if (sending && !draft.questions.length) errors.questions = 'Add at least one question'
  draft.questions.forEach((question, index) => {
    if (!question.text.trim()) errors[`questions.${index}.text`] = 'Write the question'
    if (!isChoice(question.type)) return
    const options = question.options.map((option) => option.trim())
    const field = `questions.${index}.options`
    if (options.length < MIN_OPTIONS || options.length > MAX_OPTIONS)
      errors[field] = `Give ${MIN_OPTIONS} to ${MAX_OPTIONS} options`
    else if (options.some((option) => !option)) errors[field] = 'Options cannot be blank'
    else if (new Set(options.map((option) => option.toLowerCase())).size !== options.length)
      errors[field] = 'Each option must be different'
  })
  return errors
}

export const fieldMap = (fieldErrors: FieldError[]) =>
  Object.fromEntries(fieldErrors.map((error) => [error.field, error.message]))
