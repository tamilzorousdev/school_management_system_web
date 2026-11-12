import { useState } from 'react'
import { Check, IdCard, Sparkles } from 'lucide-react'
import { Combobox, type ComboboxOption } from '@/components/common/combobox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useDebouncedValue } from '@/hooks/use-debounce'
import { alerts } from '@/lib/alerts'
import { openFile } from '@/lib/files'
import { toApiError } from '@/lib/api/errors'
import { ID_CARD_DESIGN_LABELS, isIdCardDesign, type IdCardDesign } from '@/lib/id-card-design'
import { useStudent, useStudents } from '@/features/students/api'
import { studentFiles } from '@/features/students/records-api'
import { setupApi, useSchoolProfile, useSetupMutation, type SchoolProfile } from '../api'
import { UploadedIdCard } from './uploaded-id-card'

export function IdCardDesignTab({ canManage }: { canManage: boolean }) {
  const profileQuery = useSchoolProfile()
  const school = profileQuery.data
  const [selectedOverride, setSelectedOverride] = useState<IdCardDesign | null>(null)
  const [studentId, setStudentId] = useState<number | null>(null)
  const [studentSearch, setStudentSearch] = useState('')
  const [printing, setPrinting] = useState(false)
  const debouncedSearch = useDebouncedValue(studentSearch)
  const studentsQuery = useStudents({
    page: 1,
    limit: 20,
    search: debouncedSearch || undefined,
    status: 'active',
  })
  const studentQuery = useStudent(studentId)
  const student = studentQuery.data
  const listedStudents = studentsQuery.data?.items ?? []
  const studentOptions: ComboboxOption[] = [
    ...(student && !listedStudents.some((item) => item.id === student.id)
      ? [
          {
            value: String(student.id),
            label: student.full_name,
            hint: student.admission_no,
          },
        ]
      : []),
    ...listedStudents.map((item) => ({
      value: String(item.id),
      label: item.full_name,
      hint: item.admission_no,
    })),
  ]
  const savedDesign = isIdCardDesign(school?.id_card_design) ? school.id_card_design : 'design2'
  const selectedDesign = selectedOverride ?? savedDesign

  const saveMutation = useSetupMutation((input: Partial<SchoolProfile>) =>
    setupApi.updateSchool(input)
  )

  const handleSelect = async (design: IdCardDesign) => {
    setSelectedOverride(design)
    try {
      await saveMutation.mutateAsync({ id_card_design: design })
      alerts.success(`${ID_CARD_DESIGN_LABELS[design]} selected and applied to student ID cards.`)
    } catch (error) {
      setSelectedOverride(null)
      alerts.error(toApiError(error).message)
    }
  }

  const printStudentCard = async () => {
    if (!student) return
    setPrinting(true)
    try {
      await openFile(studentFiles.idCard(student.id, selectedDesign))
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setPrinting(false)
    }
  }

  const schoolName = school?.name || 'Tamilzorous Model School'
  const schoolLogo = school?.logo_url || '/tz-mark.svg'
  const studentName = student?.full_name || 'Aadhavan Senthil'
  const admissionNo = student?.admission_no || 'TZMS-2026-0001'
  const classSection =
    [student?.class?.name, student?.section?.name].filter(Boolean).join(' - ') || '6 - A'
  const rollNo = student?.roll_no ? String(student.roll_no).padStart(2, '0') : '01'
  const guardian =
    student?.guardian_details.find((item) => item.relation === 'father') ?? student?.guardians[0]
  const bloodGroup = student?.blood_group || '—'
  const studentInitials = studentName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <div className='grid gap-6'>
      {/* Intro Header */}
      <Card className='p-4 sm:p-6'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div className='flex items-start gap-3.5'>
            <div className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'>
              <IdCard className='size-6' />
            </div>
            <div>
              <div className='flex flex-wrap items-center gap-2'>
                <h2 className='text-lg font-bold text-foreground sm:text-xl'>
                  Student ID Card Design
                </h2>
                <Badge tone='info' className='gap-1'>
                  <Sparkles className='size-3' /> 3 templates or upload your own
                </Badge>
              </div>
              <p className='mt-1 text-xs text-muted-foreground sm:text-sm'>
                Choose a template for individual student cards and printable batch sheets. Your
                selection is saved for the whole school.
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs'>
            <span className='text-muted-foreground'>Current active template:</span>
            <span className='font-bold text-foreground'>
              {ID_CARD_DESIGN_LABELS[selectedDesign]}
            </span>
          </div>
        </div>
      </Card>

      <Card className='grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-5'>
        <div className='grid gap-2'>
          <label htmlFor='id-card-student' className='text-sm font-semibold text-foreground'>
            Choose a student to preview
          </label>
          <Combobox
            id='id-card-student'
            label='Student'
            value={studentId === null ? undefined : String(studentId)}
            options={studentOptions}
            onChange={(value) => setStudentId(value ? Number(value) : null)}
            onSearch={setStudentSearch}
            placeholder='Search student name or admission number'
            searchPlaceholder='Search students'
            emptyText={studentsQuery.isPending ? 'Loading students…' : 'No active students found'}
          />
          {student && (
            <p className='text-xs text-muted-foreground'>
              {student.full_name} · {student.admission_no} · {classSection}
            </p>
          )}
        </div>
        <Button
          onClick={() => void printStudentCard()}
          disabled={!student || printing}
          loading={printing}
          className='w-full sm:w-auto'
        >
          <IdCard />
          Print selected student card
        </Button>
      </Card>

      <UploadedIdCard
        school={school}
        active={selectedDesign === 'custom'}
        canManage={canManage}
        busy={saveMutation.isPending}
        onApply={() => void handleSelect('custom')}
      />

      {/* 3 Card Designs Grid */}
      <div className='grid grid-cols-1 gap-6 xl:grid-cols-3'>
        {/* ===================== DESIGN 1: ORIGINAL CLASSIC (FRONT & BACK WITH QR) ===================== */}
        <div
          onClick={() => canManage && !saveMutation.isPending && void handleSelect('design1')}
          className={`group relative flex cursor-pointer flex-col rounded-2xl border-2 bg-card p-5 transition-all hover:shadow-lg ${
            selectedDesign === 'design1'
              ? 'border-emerald-600 shadow-md ring-4 ring-emerald-500/20'
              : 'border-border hover:border-emerald-400'
          }`}
        >
          {/* Header Row */}
          <div className='flex items-center justify-between gap-2 border-b pb-3.5'>
            <div>
              <div className='flex items-center gap-2'>
                <h3 className='font-bold text-foreground'>Design 1 · Original Classic</h3>
                <span className='rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'>
                  Landscape CR80
                </span>
              </div>
              <p className='mt-0.5 text-xs text-muted-foreground'>
                Classic green header band, student photo left & details. Backside features QR code &
                campus contact.
              </p>
            </div>

            {selectedDesign === 'design1' ? (
              <Badge tone='success' className='shrink-0 gap-1 font-bold'>
                <Check className='size-3.5' /> Active
              </Badge>
            ) : (
              <Button
                variant='outline'
                size='sm'
                onClick={(e) => {
                  e.stopPropagation()
                  void handleSelect('design1')
                }}
                disabled={!canManage || saveMutation.isPending}
                className='shrink-0 group-hover:border-emerald-500 group-hover:text-emerald-600'
              >
                Apply
              </Button>
            )}
          </div>

          {/* Visual Previews: Front & Back */}
          <div className='mt-4 flex flex-1 flex-wrap items-center justify-center gap-2.5 rounded-xl bg-slate-100/70 p-3.5 dark:bg-slate-900/60'>
            {/* FRONT SIDE (Design 1) */}
            <div className='flex flex-col items-center gap-1'>
              <span className='text-[9px] font-bold tracking-wider text-muted-foreground uppercase'>
                Front Side
              </span>
              <div className='relative flex h-[104px] w-[164px] flex-col overflow-hidden rounded-lg border border-slate-300 bg-white text-[6px] shadow-md'>
                {/* Green Header */}
                <div className='relative flex h-[26px] items-center gap-1 bg-[#159053] px-2 text-white'>
                  <div className='absolute right-0 bottom-0 left-0 h-[1.5px] bg-[#0d5c35]' />
                  <div className='flex size-4.5 shrink-0 items-center justify-center rounded-full bg-white p-0.5 shadow-xs'>
                    <img src={schoolLogo} alt='' className='size-full object-contain' />
                  </div>
                  <div className='min-w-0 flex-1 leading-tight'>
                    <div className='truncate text-[6.5px] font-extrabold uppercase'>
                      {schoolName}
                    </div>
                    <div className='text-[4.8px] font-medium text-[#e4f2ea]'>STUDENT ID CARD</div>
                  </div>
                </div>

                {/* Body: Photo & Details */}
                <div className='flex flex-1 items-center px-2 py-1'>
                  <div className='flex h-[52px] w-[36px] shrink-0 items-center justify-center rounded bg-[#e4f2ea] text-[9px] font-bold text-[#0d5c35]'>
                    {studentInitials || 'KN'}
                  </div>
                  <div className='min-w-0 flex-1 space-y-0.5 pl-2 text-[5px]'>
                    <div className='truncate text-[7px] font-extrabold text-[#0f1a15]'>
                      {studentName}
                    </div>
                    <div className='text-[#5a6a62]'>
                      <span className='text-[4.5px] font-bold uppercase'>ADM: </span>
                      <span className='font-bold text-[#0f1a15]'>{admissionNo}</span>
                    </div>
                    <div className='text-[#5a6a62]'>
                      <span className='text-[4.5px] font-bold uppercase'>CLASS: </span>
                      <span className='font-bold text-[#0f1a15]'>{classSection}</span>
                    </div>
                    <div className='text-[#5a6a62]'>
                      <span className='text-[4.5px] font-bold uppercase'>ROLL: </span>
                      <span className='font-bold text-[#0f1a15]'>{rollNo}</span>
                    </div>
                    <div className='text-[#5a6a62]'>
                      <span className='text-[4.5px] font-bold uppercase'>BLOOD: </span>
                      <span className='font-bold text-[#0f1a15]'>{bloodGroup}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Footer Wash */}
                <div className='flex h-[12px] items-center justify-center bg-[#e4f2ea] px-1 text-[4.5px] font-medium text-[#0d5c35]'>
                  {school?.city
                    ? `${school.city} · Ph ${school?.phone || '044-26201234'}`
                    : 'If found, return to school office'}
                </div>
              </div>
            </div>

            {/* BACK SIDE (WITH QR CODE) */}
            <div className='flex flex-col items-center gap-1'>
              <span className='text-[9px] font-bold tracking-wider text-muted-foreground uppercase'>
                Back Side (QR)
              </span>
              <div className='relative flex h-[104px] w-[164px] flex-col overflow-hidden rounded-lg border border-slate-300 bg-white text-[6px] shadow-md'>
                {/* Green Header */}
                <div className='relative flex h-[18px] items-center justify-center bg-[#159053] px-1 text-white'>
                  <div className='absolute right-0 bottom-0 left-0 h-[1.5px] bg-[#0d5c35]' />
                  <div className='text-[5.5px] font-bold tracking-wide uppercase'>
                    CAMPUS & EMERGENCY CONTACT
                  </div>
                </div>

                {/* Body: Prominent QR Code on left, School Info on right */}
                <div className='flex flex-1 items-center gap-1.5 px-2 py-1'>
                  {/* QR Code Container */}
                  <div className='flex shrink-0 flex-col items-center justify-center'>
                    <div className='flex size-[42px] items-center justify-center rounded border border-slate-300 bg-white p-0.5 shadow-2xs'>
                      <div className='grid size-full grid-cols-4 gap-0.5 p-0.5 opacity-80'>
                        {Array.from({ length: 16 }).map((_, i) => (
                          <div
                            key={i}
                            className={i % 2 === 0 ? 'bg-[#0f1a15]' : 'bg-transparent'}
                          />
                        ))}
                      </div>
                    </div>
                    <span className='mt-0.5 text-[4px] font-medium text-slate-500'>
                      Scan for Access
                    </span>
                  </div>

                  {/* School Address & Verification */}
                  <div className='min-w-0 flex-1 space-y-0.5 text-[4.8px] text-slate-600'>
                    <div className='truncate text-[5.8px] font-bold text-[#0f1a15] uppercase'>
                      {schoolName}
                    </div>
                    <p className='truncate'>{school?.address || 'School Campus Office'}</p>
                    <p>Office: {school?.phone || '044-26201234'}</p>
                    <p className='pt-0.5 text-[4.2px] text-slate-400 italic'>
                      Carry card at all times on campus.
                    </p>
                  </div>
                </div>

                {/* Bottom Wash Notice */}
                <div className='flex h-[12px] items-center justify-center bg-[#e4f2ea] px-1 text-[4.2px] text-[#0d5c35] italic'>
                  If found, please return to the school office.
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className='mt-4 flex items-center justify-between pt-2'>
            <div className='text-xs text-muted-foreground'>
              {selectedDesign === 'design1' ? (
                <span className='font-semibold text-emerald-600'>✓ Active layout</span>
              ) : (
                <span>Click to apply</span>
              )}
            </div>
            <span className='text-xs font-medium text-muted-foreground'>
              {selectedDesign === 'design1' ? 'Selected' : 'Click to select'}
            </span>
          </div>
        </div>

        {/* ===================== DESIGN 2: MODERN WAVE ===================== */}
        <div
          onClick={() => canManage && !saveMutation.isPending && void handleSelect('design2')}
          className={`group relative flex cursor-pointer flex-col rounded-2xl border-2 bg-card p-5 transition-all hover:shadow-lg ${
            selectedDesign === 'design2'
              ? 'border-teal-600 shadow-md ring-4 ring-teal-500/20'
              : 'border-border hover:border-teal-400'
          }`}
        >
          {/* Header Row */}
          <div className='flex items-center justify-between gap-2 border-b pb-3.5'>
            <div>
              <div className='flex items-center gap-2'>
                <h3 className='font-bold text-foreground'>Design 2 · Modern Wave</h3>
                <span className='rounded bg-teal-100 px-2 py-0.5 text-[11px] font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300'>
                  Teal & Orange
                </span>
              </div>
              <p className='mt-0.5 text-xs text-muted-foreground'>
                Dynamic curved wave blobs, orange photo frame, dual-sided front & back layout.
              </p>
            </div>

            {selectedDesign === 'design2' ? (
              <Badge tone='success' className='shrink-0 gap-1 font-bold'>
                <Check className='size-3.5' /> Active
              </Badge>
            ) : (
              <Button
                variant='outline'
                size='sm'
                onClick={(e) => {
                  e.stopPropagation()
                  void handleSelect('design2')
                }}
                disabled={!canManage || saveMutation.isPending}
                className='shrink-0 group-hover:border-teal-500 group-hover:text-teal-600'
              >
                Apply
              </Button>
            )}
          </div>

          {/* Visual Previews: Front & Back */}
          <div className='mt-4 flex flex-1 flex-wrap items-center justify-center gap-2.5 rounded-xl bg-slate-100/70 p-3.5 dark:bg-slate-900/60'>
            {/* FRONT SIDE (Design 2) */}
            <div className='flex flex-col items-center gap-1'>
              <span className='text-[9px] font-bold tracking-wider text-muted-foreground uppercase'>
                Front
              </span>
              <div className='relative flex h-[210px] w-[130px] flex-col overflow-hidden rounded-xl border border-slate-300 bg-white text-[7px] shadow-md'>
                {/* Organic wave patches in corners */}
                <div className='absolute -top-3 -right-3 size-12 rounded-full bg-[#00897B]/90' />
                <div className='absolute -top-2 right-4 size-8 rounded-full bg-[#FA7222]' />
                <div className='absolute top-2 -left-2 size-6 rounded-full bg-[#FA7222]/80' />
                <div className='absolute -bottom-3 -left-3 size-10 rounded-full bg-[#00897B]' />
                <div className='absolute -right-2 -bottom-2 size-9 rounded-full bg-[#FA7222]' />

                {/* Top Header */}
                <div className='relative z-10 flex items-center gap-1 px-2 pt-1.5'>
                  <div className='flex size-5 shrink-0 items-center justify-center rounded-full border border-[#FA7222] bg-white p-0.5 shadow-xs'>
                    <img src={schoolLogo} alt='' className='size-full object-contain' />
                  </div>
                  <div className='min-w-0 flex-1 leading-tight'>
                    <div className='truncate text-[6px] font-bold text-[#00897B] uppercase'>
                      {schoolName}
                    </div>
                    <div className='truncate text-[5px] font-bold text-[#FA7222]'>
                      ID: {admissionNo}
                    </div>
                  </div>
                </div>

                {/* Photo with solid orange frame */}
                <div className='relative z-10 mt-1.5 flex justify-center'>
                  <div className='flex size-[44px] items-center justify-center rounded-none border-[2px] border-[#FA7222] bg-[#EDF2F7] text-xs font-bold text-[#00897B] shadow-xs'>
                    {studentInitials || 'KN'}
                  </div>
                </div>

                {/* Details Table */}
                <div className='relative z-10 mx-2 mt-1.5 space-y-0.5 text-[5.5px]'>
                  <div className='flex'>
                    <span className='w-9 font-bold text-[#4B5563]'>Name</span>
                    <span className='font-bold text-[#4B5563]'>:</span>
                    <span className='ml-0.5 truncate font-bold text-[#00897B]'>{studentName}</span>
                  </div>
                  <div className='flex'>
                    <span className='w-9 font-bold text-[#4B5563]'>Father</span>
                    <span className='font-bold text-[#4B5563]'>:</span>
                    <span className='ml-0.5 truncate font-bold text-[#1F2937]'>
                      {guardian?.name || '—'}
                    </span>
                  </div>
                  <div className='flex'>
                    <span className='w-9 font-bold text-[#4B5563]'>Contact</span>
                    <span className='font-bold text-[#4B5563]'>:</span>
                    <span className='ml-0.5 font-bold text-[#1F2937]'>
                      {guardian?.mobile || '—'}
                    </span>
                  </div>
                  <div className='flex'>
                    <span className='w-9 font-bold text-[#4B5563]'>Class</span>
                    <span className='font-bold text-[#4B5563]'>:</span>
                    <span className='ml-0.5 font-bold text-[#1F2937]'>{classSection}</span>
                  </div>
                  <div className='flex'>
                    <span className='w-9 font-bold text-[#4B5563]'>Roll</span>
                    <span className='font-bold text-[#4B5563]'>:</span>
                    <span className='ml-0.5 font-bold text-[#1F2937]'>{rollNo}</span>
                  </div>
                  <div className='flex'>
                    <span className='w-9 font-bold text-[#4B5563]'>Blood</span>
                    <span className='font-bold text-[#4B5563]'>:</span>
                    <span className='ml-0.5 font-bold text-[#1F2937]'>{bloodGroup}</span>
                  </div>
                </div>

                {/* Principal Signature */}
                <div className='relative z-10 mt-auto ml-auto px-1.5 pb-1 text-right text-[4.5px] text-slate-500'>
                  <div className='w-10 border-t border-[#FA7222] pt-0.5 text-center font-medium'>
                    Principal
                  </div>
                </div>
              </div>
            </div>

            {/* BACK SIDE (Design 2) */}
            <div className='flex flex-col items-center gap-1'>
              <span className='text-[9px] font-bold tracking-wider text-muted-foreground uppercase'>
                Back
              </span>
              <div className='relative flex h-[210px] w-[130px] flex-col items-center overflow-hidden rounded-xl border border-slate-300 bg-white p-1.5 text-center text-[6px] shadow-md'>
                {/* Corner waves */}
                <div className='absolute -top-3 -right-3 size-10 rounded-full bg-[#00897B]/90' />
                <div className='absolute -bottom-3 -left-3 size-10 rounded-full bg-[#FA7222]' />

                {/* Orange top accent */}
                <div className='relative z-10 mt-0.5 h-[1.5px] w-10 bg-[#FA7222]' />
                <div className='relative z-10 mt-0.5 text-[5.5px] font-bold text-[#1F2937]'>
                  Information
                </div>
                <div className='relative z-10 text-[4.8px] text-[#4B5563]'>Pls Scan This</div>

                {/* QR Code in orange frame */}
                <div className='relative z-10 my-1 flex size-[44px] items-center justify-center rounded border border-slate-300 bg-white p-0.5 shadow-xs'>
                  <div className='grid size-full grid-cols-4 gap-0.5 p-0.5 opacity-70'>
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div
                        key={i}
                        className={`${i % 2 === 0 ? 'bg-[#FA7222]' : 'bg-transparent'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* School Address */}
                <div className='relative z-10 space-y-0.5 text-[4.8px] text-[#4B5563]'>
                  <div className='text-[5.2px] font-bold tracking-wider text-[#1F2937] uppercase'>
                    CAMPUS ADDRESS
                  </div>
                  <p className='truncate px-1'>{school?.address || 'School Campus'}</p>
                  <p>Ph: {school?.phone || '044-26201234'}</p>
                </div>

                {/* Return Notice */}
                <div className='relative z-10 mt-auto text-[4.2px] text-slate-400 italic'>
                  If found, return to school office.
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className='mt-4 flex items-center justify-between pt-2'>
            <div className='text-xs text-muted-foreground'>
              {selectedDesign === 'design2' ? (
                <span className='font-semibold text-teal-600'>✓ Active layout</span>
              ) : (
                <span>Click to apply</span>
              )}
            </div>
            <span className='text-xs font-medium text-muted-foreground'>
              {selectedDesign === 'design2' ? 'Selected' : 'Click to select'}
            </span>
          </div>
        </div>

        {/* ===================== DESIGN 3: CAMPUS SHIELD ===================== */}
        <div
          onClick={() => canManage && !saveMutation.isPending && void handleSelect('design3')}
          className={`group relative flex cursor-pointer flex-col rounded-2xl border-2 bg-card p-5 transition-all hover:shadow-lg ${
            selectedDesign === 'design3'
              ? 'border-indigo-600 shadow-md ring-4 ring-indigo-500/20'
              : 'border-border hover:border-indigo-400'
          }`}
        >
          {/* Header Row */}
          <div className='flex items-center justify-between gap-2 border-b pb-3.5'>
            <div>
              <div className='flex items-center gap-2'>
                <h3 className='font-bold text-foreground'>Design 3 · Campus Shield</h3>
                <span className='rounded bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'>
                  Navy & Gold
                </span>
              </div>
              <p className='mt-0.5 text-xs text-muted-foreground'>
                Prestigious academic navy header with gold trim, formal layout, dual-sided front &
                back.
              </p>
            </div>

            {selectedDesign === 'design3' ? (
              <Badge tone='success' className='shrink-0 gap-1 font-bold'>
                <Check className='size-3.5' /> Active
              </Badge>
            ) : (
              <Button
                variant='outline'
                size='sm'
                onClick={(e) => {
                  e.stopPropagation()
                  void handleSelect('design3')
                }}
                disabled={!canManage || saveMutation.isPending}
                className='shrink-0 group-hover:border-indigo-500 group-hover:text-indigo-600'
              >
                Apply
              </Button>
            )}
          </div>

          {/* Visual Previews: Front & Back */}
          <div className='mt-4 flex flex-1 flex-wrap items-center justify-center gap-2.5 rounded-xl bg-slate-100/70 p-3.5 dark:bg-slate-900/60'>
            {/* FRONT SIDE (Design 3) */}
            <div className='flex flex-col items-center gap-1'>
              <span className='text-[9px] font-bold tracking-wider text-muted-foreground uppercase'>
                Front
              </span>
              <div className='relative flex h-[210px] w-[130px] flex-col overflow-hidden rounded-xl border border-slate-300 bg-white text-[7px] shadow-md'>
                {/* Navy Header with Gold Stripe */}
                <div className='relative flex h-[40px] items-center gap-1 bg-[#17324D] px-1.5 text-white'>
                  <div className='absolute right-0 bottom-0 left-0 h-[1.5px] bg-[#D4A64A]' />
                  <div className='flex size-5 shrink-0 items-center justify-center rounded-full border border-[#D4A64A] bg-white p-0.5 shadow-xs'>
                    <img src={schoolLogo} alt='' className='size-full object-contain' />
                  </div>
                  <div className='min-w-0 flex-1 leading-tight'>
                    <div className='truncate text-[6.5px] font-extrabold uppercase'>
                      {schoolName}
                    </div>
                    <div className='text-[5px] font-semibold text-[#D4A64A]'>STUDENT ID</div>
                  </div>
                </div>

                {/* Student Name & ID */}
                <div className='mt-1 truncate px-1 text-center text-[7.5px] font-extrabold text-[#17324D]'>
                  {studentName}
                </div>
                <div className='text-center text-[5px] font-semibold text-slate-500'>
                  Adm No: {admissionNo}
                </div>

                {/* Framed Photo & Details */}
                <div className='mx-1.5 mt-1 flex items-center gap-1.5 rounded border border-[#D4A64A]/60 bg-slate-50/60 p-1'>
                  <div className='flex size-[42px] shrink-0 items-center justify-center rounded border border-[#17324D] bg-white text-xs font-bold text-[#17324D]'>
                    {studentInitials || 'KN'}
                  </div>
                  <div className='min-w-0 flex-1 space-y-0.5 text-[5px]'>
                    <div>
                      <span className='block text-[4.5px] font-bold text-slate-500 uppercase'>
                        CLASS
                      </span>
                      <span className='block truncate font-bold text-slate-800'>
                        {classSection}
                      </span>
                    </div>
                    <div>
                      <span className='block text-[4.5px] font-bold text-slate-500 uppercase'>
                        ROLL NO
                      </span>
                      <span className='font-bold text-slate-800'>{rollNo}</span>
                    </div>
                    <div>
                      <span className='block text-[4.5px] font-bold text-slate-500 uppercase'>
                        BLOOD
                      </span>
                      <span className='font-bold text-slate-800'>{bloodGroup}</span>
                    </div>
                  </div>
                </div>

                {/* Footer bar */}
                <div className='mt-auto flex h-[15px] items-center justify-center bg-[#17324D] text-[5.2px] font-bold text-[#D4A64A]'>
                  SESSION 2026-27
                </div>
              </div>
            </div>

            {/* BACK SIDE (Design 3) */}
            <div className='flex flex-col items-center gap-1'>
              <span className='text-[9px] font-bold tracking-wider text-muted-foreground uppercase'>
                Back
              </span>
              <div className='relative flex h-[210px] w-[130px] flex-col items-center overflow-hidden rounded-xl border border-slate-300 bg-white p-1.5 text-center text-[6px] shadow-md'>
                <div className='w-full bg-[#17324D] py-0.5 text-[6px] font-bold text-white'>
                  CAMPUS INFORMATION
                </div>
                <div className='mb-1 h-[1.5px] w-full bg-[#D4A64A]' />

                {/* QR Code in Gold Frame */}
                <div className='my-0.5 flex size-[44px] items-center justify-center rounded border-2 border-[#D4A64A] bg-white p-0.5 shadow-xs'>
                  <div className='grid size-full grid-cols-4 gap-0.5 p-0.5 opacity-80'>
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className={i % 2 === 0 ? 'bg-[#17324D]' : 'bg-transparent'} />
                    ))}
                  </div>
                </div>
                <span className='text-[4.8px] text-slate-500'>Scan for access</span>

                <div className='mt-1 space-y-0.5 text-[4.8px] text-slate-600'>
                  <p className='truncate font-bold text-[#17324D] uppercase'>{schoolName}</p>
                  <p className='truncate px-1'>{school?.address || 'Campus Office'}</p>
                  <p>Office: {school?.phone || '044-26201234'}</p>
                </div>

                <div className='mt-auto w-full border-t border-slate-200 pt-0.5 text-[4.2px] text-slate-400 italic'>
                  If found, return to school office.
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className='mt-4 flex items-center justify-between pt-2'>
            <div className='text-xs text-muted-foreground'>
              {selectedDesign === 'design3' ? (
                <span className='font-semibold text-indigo-600'>✓ Active layout</span>
              ) : (
                <span>Click to apply</span>
              )}
            </div>
            <span className='text-xs font-medium text-muted-foreground'>
              {selectedDesign === 'design3' ? 'Selected' : 'Click to select'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
