import { CalendarDays, Star } from 'lucide-react'
import type { DraftQuestion } from '../builder'

function QuestionPreview({ question, index }: { question: DraftQuestion; index: number }) {
  const options = question.options.filter((option) => option.trim())
  return (
    <div className='grid gap-2 rounded-xl border bg-card p-3'>
      <p className='text-[13px] leading-snug font-semibold'>
        {index + 1}. {question.text.trim() || 'Your question'}
        {question.is_required && <span className='ml-0.5 text-destructive'>*</span>}
      </p>
      {question.type === 'single_choice' || question.type === 'multi_choice' ? (
        <div className='grid gap-1.5'>
          {(options.length ? options : ['Option 1', 'Option 2']).map((option, position) => (
            <span key={`${option}-${position}`} className='flex items-center gap-2 text-xs'>
              <span
                aria-hidden
                className={
                  question.type === 'single_choice'
                    ? 'size-3.5 shrink-0 rounded-full border-2 border-muted-foreground/50'
                    : 'size-3.5 shrink-0 rounded-[3px] border-2 border-muted-foreground/50'
                }
              />
              <span className='min-w-0 break-words'>{option}</span>
            </span>
          ))}
        </div>
      ) : question.type === 'rating' ? (
        <span className='flex gap-1 text-warning' aria-label='1 to 5 stars'>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className='size-5' />
          ))}
        </span>
      ) : question.type === 'date' ? (
        <span className='flex h-8 items-center justify-between rounded-md border px-2 text-xs text-muted-foreground'>
          Pick a date
          <CalendarDays className='size-3.5' />
        </span>
      ) : (
        <span
          className={`flex rounded-md border px-2 py-1.5 text-xs text-muted-foreground ${question.type === 'long_text' ? 'h-14' : 'h-8 items-center'}`}
        >
          {question.type === 'number' ? '0' : 'Type your answer'}
        </span>
      )}
    </div>
  )
}

export function PhonePreview({
  title,
  description,
  questions,
}: {
  title: string
  description: string
  questions: DraftQuestion[]
}) {
  return (
    <div className='mx-auto w-full max-w-[320px]' aria-label='How the form looks in the app'>
      <div className='rounded-[2rem] border-4 border-foreground/80 bg-background p-2 shadow-sm'>
        <div className='mx-auto mb-2 h-1.5 w-16 rounded-full bg-foreground/20' />
        <div className='grid max-h-[560px] gap-3 overflow-y-auto rounded-2xl bg-muted/50 p-3'>
          <div className='grid gap-1'>
            <p className='text-[11px] font-bold tracking-wider text-primary uppercase'>
              School form
            </p>
            <p className='text-base leading-tight font-extrabold break-words'>
              {title.trim() || 'Form title'}
            </p>
            {description.trim() && (
              <p className='text-xs break-words text-muted-foreground'>{description}</p>
            )}
          </div>
          {questions.length ? (
            questions.map((question, index) => (
              <QuestionPreview key={question.key} question={question} index={index} />
            ))
          ) : (
            <p className='rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground'>
              Questions you add show here
            </p>
          )}
          <span className='flex h-9 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground'>
            Submit
          </span>
        </div>
      </div>
    </div>
  )
}
