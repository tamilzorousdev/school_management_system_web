import { useMemo, useState } from 'react'
import {
  Camera,
  CheckCircle2,
  Clock,
  Mic,
  Plus,
  Save,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { TrashIcon } from '@/components/common/icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import {
  useClasses,
  useClassSubjects,
  useSubjects,
  useTeachers,
} from '@/features/setup/api'
import {
  quizzesApi,
  type CreateQuizInput,
  type CreateQuizQuestionInput,
} from '../api'

interface QuestionFormState {
  id: string
  question_text: string
  options: { key: string; text: string }[]
  correct_option: string
  marks: number
  explanation: string
}

function getDefaultQuestion(idx: number): QuestionFormState {
  return {
    id: String(Date.now() + idx),
    question_text: '',
    options: [
      { key: 'A', text: '' },
      { key: 'B', text: '' },
      { key: 'C', text: '' },
      { key: 'D', text: '' },
    ],
    correct_option: 'A',
    marks: 1,
    explanation: '',
  }
}

export function CreateQuizModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const classesQuery = useClasses()
  const classes = useMemo(() => classesQuery.data ?? [], [classesQuery.data])

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null)
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null)
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null)

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId),
    [classes, selectedClassId]
  )

  const classSubjectsQuery = useClassSubjects(selectedClassId)
  const allSubjectsQuery = useSubjects()
  const subjects = useMemo(() => {
    if (classSubjectsQuery.data && classSubjectsQuery.data.length > 0) {
      return classSubjectsQuery.data.map((cs) => ({
        id: cs.subject_id,
        name: cs.name,
        code: cs.code,
      }))
    }
    return (allSubjectsQuery.data?.items ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
    }))
  }, [classSubjectsQuery.data, allSubjectsQuery.data])

  const teachersQuery = useTeachers()
  const teachers = useMemo(() => teachersQuery.data ?? [], [teachersQuery.data])

  // Basic Info
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState(
    'Attempt all multiple choice questions. Do not refresh or exit the browser window during the test.'
  )

  // Scheduling
  const [durationMinutes, setDurationMinutes] = useState<number>(30)
  const [passMarks, setPassMarks] = useState<string>('')

  // Default start to next hour, end to 4 hours after
  const defaultStart = useMemo(() => {
    const d = new Date()
    d.setMinutes(0, 0, 0)
    d.setHours(d.getHours() + 1)
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }, [])

  const defaultEnd = useMemo(() => {
    const d = new Date()
    d.setMinutes(0, 0, 0)
    d.setHours(d.getHours() + 5)
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }, [])

  const [startAt, setStartAt] = useState(defaultStart)
  const [endAt, setEndAt] = useState(defaultEnd)

  // Proctoring options
  const [requireCamera, setRequireCamera] = useState(false)
  const [requireMicrophone, setRequireMicrophone] = useState(false)
  const [expireOnExit, setExpireOnExit] = useState(false)

  // Questions
  const [questions, setQuestions] = useState<QuestionFormState[]>([getDefaultQuestion(1)])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalMarks = useMemo(
    () => questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0),
    [questions]
  )

  const computedPassMarks = useMemo(() => {
    if (passMarks !== '') return parseFloat(passMarks) || 0
    return Math.round(totalMarks * 0.35 * 10) / 10
  }, [passMarks, totalMarks])

  const handleAddQuestion = () => {
    setQuestions((prev) => [...prev, getDefaultQuestion(prev.length + 1)])
  }

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) {
      alerts.error('Quiz must have at least one question')
      return
    }
    setQuestions((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleUpdateQuestion = (idx: number, patch: Partial<QuestionFormState>) => {
    setQuestions((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], ...patch }
      return next
    })
  }

  const handleOptionTextChange = (qIdx: number, optKey: string, text: string) => {
    setQuestions((prev) => {
      const next = [...prev]
      const opts = next[qIdx].options.map((o) => (o.key === optKey ? { ...o, text } : o))
      next[qIdx] = { ...next[qIdx], options: opts }
      return next
    })
  }

  const handleAddOption = (qIdx: number) => {
    setQuestions((prev) => {
      const next = [...prev]
      const currentOpts = next[qIdx].options
      if (currentOpts.length >= 6) {
        alerts.error('Maximum 6 options allowed per question')
        return prev
      }
      const nextKey = String.fromCharCode(65 + currentOpts.length) // E, F...
      next[qIdx] = {
        ...next[qIdx],
        options: [...currentOpts, { key: nextKey, text: '' }],
      }
      return next
    })
  }

  const handleRemoveOption = (qIdx: number, optKey: string) => {
    setQuestions((prev) => {
      const next = [...prev]
      const currentOpts = next[qIdx].options
      if (currentOpts.length <= 2) {
        alerts.error('At least 2 options required')
        return prev
      }
      const filtered = currentOpts
        .filter((o) => o.key !== optKey)
        .map((o, i) => ({ ...o, key: String.fromCharCode(65 + i) }))
      const correct = filtered.some((o) => o.key === next[qIdx].correct_option)
        ? next[qIdx].correct_option
        : 'A'
      next[qIdx] = {
        ...next[qIdx],
        options: filtered,
        correct_option: correct,
      }
      return next
    })
  }

  const handleLoadSampleQuestions = () => {
    setQuestions([
      {
        id: 'sample-1',
        question_text: 'What is the primary function of chlorophyll in plant cells?',
        options: [
          { key: 'A', text: 'Absorbing sunlight for photosynthesis' },
          { key: 'B', text: 'Storing water in roots' },
          { key: 'C', text: 'Transporting minerals through stems' },
          { key: 'D', text: 'Protecting plants from herbivores' },
        ],
        correct_option: 'A',
        marks: 1,
        explanation: 'Chlorophyll absorbs light energy (primarily blue and red wavelengths) to drive the chemical reaction of photosynthesis.',
      },
      {
        id: 'sample-2',
        question_text: 'Which organelle is known as the powerhouse of the cell?',
        options: [
          { key: 'A', text: 'Nucleus' },
          { key: 'B', text: 'Mitochondria' },
          { key: 'C', text: 'Ribosome' },
          { key: 'D', text: 'Endoplasmic Reticulum' },
        ],
        correct_option: 'B',
        marks: 1,
        explanation: 'Mitochondria generate most of the chemical energy needed to power the cell biochemical reactions (ATP).',
      },
      {
        id: 'sample-3',
        question_text: 'What gas is released during the process of photosynthesis?',
        options: [
          { key: 'A', text: 'Carbon Dioxide' },
          { key: 'B', text: 'Nitrogen' },
          { key: 'C', text: 'Oxygen' },
          { key: 'D', text: 'Hydrogen' },
        ],
        correct_option: 'C',
        marks: 1,
        explanation: 'During the light-dependent reactions of photosynthesis, water molecules are split releasing oxygen gas (O2).',
      },
    ])
    if (!title) setTitle('General Science Unit Assessment')
    alerts.success('Sample questions loaded')
  }

  const handleSubmit = async (publishImmediately: boolean) => {
    if (!selectedSectionId) {
      alerts.error('Please select a class and section')
      return
    }
    if (!selectedSubjectId) {
      alerts.error('Please select a subject')
      return
    }
    if (!title.trim()) {
      alerts.error('Please enter a test title')
      return
    }
    if (new Date(endAt) <= new Date(startAt)) {
      alerts.error('Exam end time must be after start time')
      return
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.question_text.trim()) {
        alerts.error(`Question #${i + 1} text cannot be empty`)
        return
      }
      for (const opt of q.options) {
        if (!opt.text.trim()) {
          alerts.error(`Option ${opt.key} in Question #${i + 1} cannot be empty`)
          return
        }
      }
    }

    try {
      setIsSubmitting(true)
      const formattedQuestions: CreateQuizQuestionInput[] = questions.map((q, idx) => ({
        sequence: idx + 1,
        question_text: q.question_text.trim(),
        options: q.options.map((o) => ({ key: o.key, text: o.text.trim() })),
        correct_option: q.correct_option,
        marks: Number(q.marks) || 1,
        explanation: q.explanation.trim() || null,
      }))

      const payload: CreateQuizInput = {
        section_id: selectedSectionId,
        subject_id: selectedSubjectId,
        teacher_user_id: selectedTeacherId ?? undefined,
        title: title.trim(),
        description: description.trim() || null,
        instructions: instructions.trim() || null,
        duration_minutes: Number(durationMinutes),
        start_at: new Date(startAt).toISOString(),
        end_at: new Date(endAt).toISOString(),
        pass_marks: computedPassMarks,
        expire_on_exit: expireOnExit,
        require_camera: requireCamera,
        require_microphone: requireMicrophone,
        status: publishImmediately ? 'approved' : 'draft',
        questions: formattedQuestions,
      }

      await quizzesApi.create(payload)

      if (publishImmediately) {
        alerts.success('Online test created, approved, and scheduled!', {
          description: `Notifications dispatched to parents for ${selectedClass?.name || 'Class'}.`,
        })
      } else {
        alerts.success('Online test draft created successfully', {
          description: 'You can review and publish it whenever you are ready.',
        })
      }

      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create quiz'
      alerts.error('Error creating online test', { description: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  const classOptions = classes.map((c) => ({
    value: String(c.id),
    label: c.name,
  }))

  const sectionOptions = (selectedClass?.sections ?? []).map((s) => ({
    value: String(s.id),
    label: `Section ${s.name} (${s.student_count} students)`,
  }))

  const subjectOptions = subjects.map((sub) => ({
    value: String(sub.id),
    label: `${sub.name} (${sub.code})`,
  }))

  const teacherOptions = teachers.map((t) => ({
    value: String(t.id),
    label: t.name,
  }))

  return (
    <AppModal
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title='Create Online Test / Quiz'
      description='Admin & Principal exam authoring: schedule test window, configure proctoring controls, and create question bank.'
      size='xl'
    >
      <div className='flex flex-col gap-5 text-xs max-h-[75vh] overflow-y-auto pr-1'>
        {/* Step 1: Target Audience & Subject */}
        <div className='rounded-lg border border-border p-3.5 space-y-3 bg-muted/10'>
          <div className='flex items-center justify-between'>
            <h4 className='font-semibold text-foreground text-xs flex items-center gap-1.5'>
              <Sparkles className='h-3.5 w-3.5 text-primary' />
              Target Class, Section & Subject
            </h4>
            <span className='text-[11px] text-muted-foreground'>
              Online test will be assigned to all students in this section.
            </span>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
            <FormField id='create_class' label='Class' required>
              <Combobox
                id='create_class'
                label='Class'
                value={selectedClassId ? String(selectedClassId) : ''}
                options={classOptions}
                onChange={(val) => {
                  const num = val ? Number(val) : null
                  setSelectedClassId(num)
                  setSelectedSectionId(null)
                  setSelectedSubjectId(null)
                }}
                placeholder='Select class'
              />
            </FormField>

            <FormField id='create_section' label='Section' required>
              <Combobox
                id='create_section'
                label='Section'
                value={selectedSectionId ? String(selectedSectionId) : ''}
                options={sectionOptions}
                onChange={(val) => setSelectedSectionId(val ? Number(val) : null)}
                placeholder={selectedClassId ? 'Select section' : 'Select class first'}
              />
            </FormField>

            <FormField id='create_subject' label='Subject' required>
              <Combobox
                id='create_subject'
                label='Subject'
                value={selectedSubjectId ? String(selectedSubjectId) : ''}
                options={subjectOptions}
                onChange={(val) => setSelectedSubjectId(val ? Number(val) : null)}
                placeholder='Select subject'
              />
            </FormField>
          </div>

          <FormField
            id='create_teacher'
            label='Assign Subject Teacher (Optional)'
            hint='Defaults to current administrator or the subject teacher assigned to this section'
          >
            <Combobox
              id='create_teacher'
              label='Teacher'
              value={selectedTeacherId ? String(selectedTeacherId) : ''}
              options={teacherOptions}
              onChange={(val) => setSelectedTeacherId(val ? Number(val) : null)}
              placeholder='Select teacher (optional)'
            />
          </FormField>
        </div>

        {/* Step 2: Test Details & Timing Window */}
        <div className='rounded-lg border border-border p-3.5 space-y-3'>
          <h4 className='font-semibold text-foreground text-xs flex items-center gap-1.5'>
            <Clock className='h-3.5 w-3.5 text-primary' />
            Test Details & Exam Schedule
          </h4>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <FormField id='create_title' label='Test Title' required>
              <Input
                id='create_title'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='e.g., Chapter 1-3 Formative Assessment'
              />
            </FormField>

            <FormField id='create_duration' label='Duration (Minutes)' required>
              <Input
                id='create_duration'
                type='number'
                min={5}
                max={180}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
              />
            </FormField>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <FormField
              id='create_start_at'
              label='Exam Window Opens (Start Date & Time)'
              hint='Students can start the test anytime after this time'
              required
            >
              <Input
                id='create_start_at'
                type='datetime-local'
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
            </FormField>

            <FormField
              id='create_end_at'
              label='Exam Window Closes (End Date & Time)'
              hint='Test will automatically lock after this deadline'
              required
            >
              <Input
                id='create_end_at'
                type='datetime-local'
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
              />
            </FormField>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <FormField id='create_description' label='Description / Topics Covered'>
              <Input
                id='create_description'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='e.g., Covers Photosynthesis, Plant Tissues and Cell Structure'
              />
            </FormField>

            <FormField
              id='create_pass_marks'
              label={`Pass Marks (Default 35%: ${Math.round(totalMarks * 0.35 * 10) / 10})`}
              hint={`Total marks across all questions: ${totalMarks}`}
            >
              <Input
                id='create_pass_marks'
                type='number'
                min={0}
                max={totalMarks}
                step={0.5}
                value={passMarks}
                onChange={(e) => setPassMarks(e.target.value)}
                placeholder={`Auto: ${Math.round(totalMarks * 0.35 * 10) / 10}`}
              />
            </FormField>
          </div>

          <FormField id='create_instructions' label='Instructions for Students'>
            <Textarea
              id='create_instructions'
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder='Special rules, anti-cheating guidelines, or scoring guidelines'
            />
          </FormField>
        </div>

        {/* Step 3: Proctoring & Security Controls */}
        <div className='rounded-lg border border-border p-3.5 space-y-2.5 bg-muted/10'>
          <h4 className='font-semibold text-foreground text-xs flex items-center gap-1.5'>
            <ShieldAlert className='h-3.5 w-3.5 text-primary' />
            Online Test Security & Proctoring Controls
          </h4>

          <div className='grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1'>
            <label className='flex items-start gap-2.5 p-2 rounded-md border border-border/60 bg-card cursor-pointer hover:bg-muted/30 transition-colors'>
              <input
                type='checkbox'
                checked={requireCamera}
                onChange={(e) => setRequireCamera(e.target.checked)}
                className='mt-0.5 rounded border-border text-primary focus:ring-primary'
              />
              <div className='grid min-w-0'>
                <span className='font-semibold text-foreground text-xs flex items-center gap-1'>
                  <Camera className='h-3 w-3 text-purple-600' />
                  Require Camera
                </span>
                <span className='text-[10px] text-muted-foreground'>
                  Enforces webcam permission to monitor student presence during the test.
                </span>
              </div>
            </label>

            <label className='flex items-start gap-2.5 p-2 rounded-md border border-border/60 bg-card cursor-pointer hover:bg-muted/30 transition-colors'>
              <input
                type='checkbox'
                checked={requireMicrophone}
                onChange={(e) => setRequireMicrophone(e.target.checked)}
                className='mt-0.5 rounded border-border text-primary focus:ring-primary'
              />
              <div className='grid min-w-0'>
                <span className='font-semibold text-foreground text-xs flex items-center gap-1'>
                  <Mic className='h-3 w-3 text-blue-600' />
                  Require Microphone
                </span>
                <span className='text-[10px] text-muted-foreground'>
                  Enforces audio permission to detect background speech during test.
                </span>
              </div>
            </label>

            <label className='flex items-start gap-2.5 p-2 rounded-md border border-border/60 bg-card cursor-pointer hover:bg-muted/30 transition-colors'>
              <input
                type='checkbox'
                checked={expireOnExit}
                onChange={(e) => setExpireOnExit(e.target.checked)}
                className='mt-0.5 rounded border-border text-primary focus:ring-primary'
              />
              <div className='grid min-w-0'>
                <span className='font-semibold text-foreground text-xs flex items-center gap-1'>
                  <ShieldAlert className='h-3 w-3 text-rose-600' />
                  Strict Tab Exit
                </span>
                <span className='text-[10px] text-muted-foreground'>
                  Auto-submits test immediately if the student switches tabs or minimizes browser.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Step 4: Interactive Question Bank Builder */}
        <div className='rounded-lg border border-border p-3.5 space-y-3'>
          <div className='flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5'>
            <div>
              <h4 className='font-semibold text-foreground text-xs flex items-center gap-1.5'>
                <CheckCircle2 className='h-3.5 w-3.5 text-primary' />
                Question Bank ({questions.length} questions · {totalMarks} total marks)
              </h4>
              <p className='text-[11px] text-muted-foreground'>
                Build multiple-choice questions. Select the radio button to set the correct answer.
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleLoadSampleQuestions}
                className='h-7 text-xs'
              >
                <Sparkles className='h-3 w-3 mr-1 text-primary' />
                Load Sample Questions
              </Button>
              <Button
                type='button'
                variant='default'
                size='sm'
                onClick={handleAddQuestion}
                className='h-7 text-xs'
              >
                <Plus className='h-3 w-3 mr-1' />
                Add Question
              </Button>
            </div>
          </div>

          <div className='space-y-4 pt-1'>
            {questions.map((q, qIdx) => (
              <div
                key={q.id}
                className='rounded-lg border border-border bg-card p-3 space-y-3 relative group'
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Badge tone='neutral' className='font-bold text-[11px]'>
                      Q{qIdx + 1}
                    </Badge>
                    <span className='text-xs font-semibold text-foreground'>
                      Question #{qIdx + 1}
                    </span>
                  </div>

                  <div className='flex items-center gap-3'>
                    <div className='flex items-center gap-1 text-xs'>
                      <Label htmlFor={`q_marks_${q.id}`} className='text-[11px] text-muted-foreground'>
                        Marks:
                      </Label>
                      <Input
                        id={`q_marks_${q.id}`}
                        type='number'
                        min={0.5}
                        max={50}
                        step={0.5}
                        value={q.marks}
                        onChange={(e) =>
                          handleUpdateQuestion(qIdx, { marks: parseFloat(e.target.value) || 1 })
                        }
                        className='w-16 h-7 text-xs font-bold text-center'
                      />
                    </div>

                    {questions.length > 1 && (
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon-sm'
                        onClick={() => handleRemoveQuestion(qIdx)}
                        className='text-[#D92D20] hover:bg-destructive/10 hover:text-[#B42318] [&_svg]:size-5'
                        title='Delete question'
                      >
                        <TrashIcon className='size-5' />
                      </Button>
                    )}
                  </div>
                </div>

                <Textarea
                  rows={2}
                  value={q.question_text}
                  onChange={(e) => handleUpdateQuestion(qIdx, { question_text: e.target.value })}
                  placeholder={`Type question #${qIdx + 1} text here…`}
                  className='text-xs'
                />

                {/* Options List */}
                <div className='space-y-2'>
                  <span className='text-[11px] font-semibold text-muted-foreground block'>
                    Answer Options (Select correct answer):
                  </span>

                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                    {q.options.map((opt) => (
                      <div
                        key={opt.key}
                        className={`flex items-center gap-2 p-1.5 rounded-md border transition-colors ${
                          q.correct_option === opt.key
                            ? 'border-primary/60 bg-primary/5'
                            : 'border-border/60 bg-background'
                        }`}
                      >
                        <label className='flex items-center gap-1.5 cursor-pointer pl-1'>
                          <input
                            type='radio'
                            name={`correct_opt_${q.id}`}
                            checked={q.correct_option === opt.key}
                            onChange={() => handleUpdateQuestion(qIdx, { correct_option: opt.key })}
                            className='text-primary focus:ring-primary'
                          />
                          <span
                            className={`font-bold text-xs ${
                              q.correct_option === opt.key ? 'text-primary' : 'text-foreground'
                            }`}
                          >
                            {opt.key}.
                          </span>
                        </label>
                        <Input
                          value={opt.text}
                          onChange={(e) => handleOptionTextChange(qIdx, opt.key, e.target.value)}
                          placeholder={`Option ${opt.key} text`}
                          className='h-7 text-xs flex-1'
                        />
                        {q.options.length > 2 && (
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            onClick={() => handleRemoveOption(qIdx, opt.key)}
                            className='h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0'
                            title='Remove option'
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {q.options.length < 6 && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => handleAddOption(qIdx)}
                      className='h-6 text-[10px] text-muted-foreground hover:text-foreground'
                    >
                      + Add Option {String.fromCharCode(65 + q.options.length)}
                    </Button>
                  )}
                </div>

                <div className='pt-1'>
                  <Label htmlFor={`q_exp_${q.id}`} className='text-[10px] text-muted-foreground'>
                    Explanation / Solution Notes (Optional):
                  </Label>
                  <Input
                    id={`q_exp_${q.id}`}
                    value={q.explanation}
                    onChange={(e) => handleUpdateQuestion(qIdx, { explanation: e.target.value })}
                    placeholder='Explanation shown to students after test completion'
                    className='h-7 text-[11px]'
                  />
                </div>
              </div>
            ))}
          </div>

          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={handleAddQuestion}
            className='w-full border-dashed h-8 text-xs'
          >
            <Plus className='h-3.5 w-3.5 mr-1' />
            Add Another Question
          </Button>
        </div>

        {/* Footer actions */}
        <div className='flex items-center justify-between pt-3 border-t border-border'>
          <Button variant='outline' size='sm' onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={isSubmitting}
              onClick={() => void handleSubmit(false)}
            >
              <Save className='mr-1 h-3.5 w-3.5' />
              {isSubmitting ? 'Saving…' : 'Save as Draft'}
            </Button>
            <Button
              variant='default'
              size='sm'
              disabled={isSubmitting}
              onClick={() => void handleSubmit(true)}
            >
              <CheckCircle2 className='mr-1 h-3.5 w-3.5' />
              {isSubmitting ? 'Publishing…' : 'Approve & Schedule Test'}
            </Button>
          </div>
        </div>
      </div>
    </AppModal>
  )
}
