import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { QuestionType } from '../api'
import { blankQuestion, changeType, move, type DraftQuestion } from '../builder'
import { isChoice, MAX_OPTIONS, QUESTION_TYPE_OPTIONS, QUESTION_TYPES } from '../labels'

function QuestionCard({
  question,
  index,
  total,
  errors,
  readOnly,
  onChange,
  onMove,
  onRemove,
}: {
  question: DraftQuestion
  index: number
  total: number
  errors: Record<string, string>
  readOnly: boolean
  onChange: (question: DraftQuestion) => void
  onMove: (to: number) => void
  onRemove: () => void
}) {
  const id = `q-${question.key}`
  const Icon = QUESTION_TYPES[question.type].icon
  const optionsError = errors[`questions.${index}.options`]
  const setOption = (position: number, value: string) =>
    onChange({
      ...question,
      options: question.options.map((option, at) => (at === position ? value : option)),
    })

  return (
    <li className='grid gap-3 rounded-xl border bg-card p-3 sm:p-4' data-testid='survey-question'>
      <div className='flex flex-wrap items-center gap-2'>
        <span className='flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary'>
          {index + 1}
        </span>
        {readOnly ? (
          <span className='flex items-center gap-1.5 text-sm font-semibold'>
            <Icon className='size-4 text-muted-foreground' />
            {QUESTION_TYPES[question.type].label}
          </span>
        ) : (
          <Combobox
            id={`${id}-type`}
            label={`Type of question ${index + 1}`}
            value={question.type}
            placeholder='Type of question'
            options={QUESTION_TYPE_OPTIONS}
            onChange={(value) => value && onChange(changeType(question, value as QuestionType))}
            className='min-w-0 flex-1 sm:w-48 sm:flex-none'
          />
        )}
        <label className='ml-auto flex items-center gap-2 text-xs font-medium'>
          <Switch
            checked={question.is_required}
            disabled={readOnly}
            onCheckedChange={(is_required) => onChange({ ...question, is_required })}
            aria-label={`Question ${index + 1} needs an answer`}
          />
          Required
        </label>
        {!readOnly && (
          <span className='flex items-center'>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label={`Move question ${index + 1} up`}
              disabled={index === 0}
              onClick={() => onMove(index - 1)}
            >
              <ArrowUp />
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label={`Move question ${index + 1} down`}
              disabled={index === total - 1}
              onClick={() => onMove(index + 1)}
            >
              <ArrowDown />
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label={`Delete question ${index + 1}`}
              className='text-destructive hover:text-destructive'
              onClick={onRemove}
            >
              <Trash2 />
            </Button>
          </span>
        )}
      </div>
      <FormField
        id={`${id}-text`}
        label='Question'
        required
        error={errors[`questions.${index}.text`]}
      >
        <Input
          id={`${id}-text`}
          value={question.text}
          maxLength={300}
          readOnly={readOnly}
          placeholder='e.g. How well was the event organised?'
          aria-invalid={Boolean(errors[`questions.${index}.text`])}
          onChange={(event) => onChange({ ...question, text: event.target.value })}
        />
      </FormField>
      {isChoice(question.type) && (
        <FormField id={`${id}-option-0`} label='Options' required error={optionsError}>
          <div className='grid gap-2'>
            {question.options.map((option, position) => (
              <span key={position} className='flex items-center gap-2'>
                <Input
                  id={`${id}-option-${position}`}
                  value={option}
                  maxLength={100}
                  readOnly={readOnly}
                  placeholder={`Option ${position + 1}`}
                  aria-label={`Option ${position + 1} of question ${index + 1}`}
                  aria-invalid={Boolean(optionsError)}
                  onChange={(event) => setOption(position, event.target.value)}
                />
                {!readOnly && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon-sm'
                    aria-label={`Remove option ${position + 1}`}
                    disabled={question.options.length <= 2}
                    onClick={() =>
                      onChange({
                        ...question,
                        options: question.options.filter((_, at) => at !== position),
                      })
                    }
                  >
                    <X />
                  </Button>
                )}
              </span>
            ))}
            {!readOnly && question.options.length < MAX_OPTIONS && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='justify-self-start'
                onClick={() => onChange({ ...question, options: [...question.options, ''] })}
              >
                <Plus />
                Add option
              </Button>
            )}
          </div>
        </FormField>
      )}
    </li>
  )
}

export function QuestionEditor({
  questions,
  onChange,
  errors,
  readOnly = false,
}: {
  questions: DraftQuestion[]
  onChange: (questions: DraftQuestion[]) => void
  errors: Record<string, string>
  readOnly?: boolean
}) {
  return (
    <div className='grid gap-3'>
      {questions.length > 0 && (
        <ol className='grid gap-3'>
          {questions.map((question, index) => (
            <QuestionCard
              key={question.key}
              question={question}
              index={index}
              total={questions.length}
              errors={errors}
              readOnly={readOnly}
              onChange={(next) =>
                onChange(questions.map((item) => (item.key === question.key ? next : item)))
              }
              onMove={(to) => onChange(move(questions, index, to))}
              onRemove={() => onChange(questions.filter((item) => item.key !== question.key))}
            />
          ))}
        </ol>
      )}
      {!readOnly && (
        <div className='grid gap-1.5 rounded-xl border border-dashed p-3'>
          <Combobox
            id='survey-add-question'
            label='Add a question'
            placeholder='Add a question: choose its type'
            options={QUESTION_TYPE_OPTIONS}
            onChange={(value) =>
              value && onChange([...questions, blankQuestion(value as QuestionType)])
            }
            highlightSelected={false}
            invalid={Boolean(errors.questions)}
            className='sm:w-full'
          />
          {errors.questions && (
            <p role='alert' className='text-xs font-medium text-destructive'>
              {errors.questions}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
