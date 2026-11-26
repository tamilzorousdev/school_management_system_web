import {
  CalendarCheck,
  DoorOpen,
  GraduationCap,
  IndianRupee,
  Layers,
  Trophy,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { AttendanceToday, ClassCard, SectionCard, WingCard } from '../api'
import { BOARD_LABEL, attendanceLine, attendanceTone, className, percent, rupees } from '../labels'
import { ClickCard, Stat } from './shared'

function AttendanceStat({ attendance }: { attendance: AttendanceToday }) {
  const tone = attendanceTone(attendance)
  return (
    <Stat
      icon={CalendarCheck}
      label='Attendance today'
      tone={tone === 'neutral' || tone === 'info' ? undefined : tone}
      value={
        <>
          {attendanceLine(attendance)}
          {attendance.percent !== null && (
            <span className='font-normal text-slate-400 dark:text-slate-500'> · {percent(attendance.percent)}</span>
          )}
        </>
      }
    />
  )
}

export function WingCardView({ wing, onOpen }: { wing: WingCard; onOpen: () => void }) {
  return (
    <ClickCard onClick={onOpen} label={`Open ${wing.name}`}>
      <div className='flex flex-wrap items-start justify-between gap-2'>
        <div className='grid min-w-0 gap-0.5'>
          <span className='truncate text-[14px] sm:text-[15px] font-bold tracking-tight text-slate-900 dark:text-slate-100'>
            {wing.name}
          </span>
          <span className='text-[12px] text-slate-500 dark:text-slate-400'>{wing.range_label}</span>
        </div>
        {wing.board && <Badge tone='info'>{BOARD_LABEL[wing.board]}</Badge>}
      </div>
      <div className='flex min-w-0 items-center gap-1.5 text-[12px] text-slate-600 dark:text-slate-300'>
        <UserRound className='size-3.5 shrink-0 text-slate-400' />
        <span className='truncate'>
          {wing.aos.length ? (
            wing.aos.map((ao) => ao.name).join(', ')
          ) : (
            <span className='text-slate-400'>No AO · the head AO covers it</span>
          )}
        </span>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <Stat
          icon={Layers}
          label='Classes · sections'
          value={`${wing.class_count} · ${wing.section_count}`}
        />
        <Stat
          icon={UsersRound}
          label='Students'
          value={`${wing.student_count} (${wing.boys}B / ${wing.girls}G)`}
        />
        <AttendanceStat attendance={wing.attendance} />
        <Stat
          icon={IndianRupee}
          label='Fee due'
          value={rupees(wing.fee_due)}
          tone={wing.fee_due > 0 ? 'warning' : undefined}
        />
        <Stat
          icon={DoorOpen}
          label='Gate passes waiting'
          value={wing.pending_gate_passes}
          tone={wing.pending_gate_passes > 0 ? 'danger' : undefined}
        />
      </div>
    </ClickCard>
  )
}

export function ClassCardView({ item, onOpen }: { item: ClassCard; onOpen: () => void }) {
  return (
    <ClickCard onClick={onOpen} label={`Open ${className(item.name)}`}>
      <div className='grid min-w-0 gap-0.5'>
        <span className='truncate text-[14px] sm:text-[15px] font-bold tracking-tight text-slate-900 dark:text-slate-100'>
          {className(item.name)}
        </span>
        <span className='truncate text-[12px] text-slate-500 dark:text-slate-400'>
          {item.class_teachers.length
            ? `Class teachers: ${item.class_teachers.join(', ')}`
            : 'No class teacher yet'}
        </span>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <Stat icon={Layers} label='Sections' value={item.section_count} />
        <Stat
          icon={UsersRound}
          label='Students'
          value={`${item.student_count} (${item.boys}B / ${item.girls}G)`}
        />
        <AttendanceStat attendance={item.attendance} />
        <Stat
          icon={IndianRupee}
          label='Fee due'
          value={rupees(item.fee_due)}
          tone={item.fee_due > 0 ? 'warning' : undefined}
        />
        <Stat
          icon={DoorOpen}
          label='Gate passes waiting'
          value={item.pending_gate_passes}
          tone={item.pending_gate_passes > 0 ? 'danger' : undefined}
        />
        <Stat
          icon={GraduationCap}
          label='Latest exam avg'
          value={percent(item.last_exam_average)}
        />
      </div>
    </ClickCard>
  )
}

export function SectionCardView({ item, onOpen }: { item: SectionCard; onOpen: () => void }) {
  return (
    <ClickCard onClick={onOpen} label={`Open ${item.class_section}`}>
      <div className='grid min-w-0 gap-0.5'>
        <span className='truncate text-[14px] sm:text-[15px] font-bold tracking-tight text-slate-900 dark:text-slate-100'>
          {item.class_section}
        </span>
        <span className='truncate text-[12px] text-slate-500 dark:text-slate-400'>
          {item.class_teacher ? `Class teacher: ${item.class_teacher.name}` : 'No class teacher'}
        </span>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <Stat
          icon={UsersRound}
          label='Students'
          value={`${item.student_count} (${item.boys}B / ${item.girls}G)`}
        />
        <AttendanceStat attendance={item.attendance} />
        <Stat
          icon={IndianRupee}
          label='Fee defaulters'
          value={`${item.fee_defaulters} · ${rupees(item.fee_due)}`}
          tone={item.fee_defaulters > 0 ? 'warning' : undefined}
        />
        <Stat
          icon={GraduationCap}
          label={item.last_exam ? `Avg · ${item.last_exam.name}` : 'Latest exam avg'}
          value={percent(item.last_exam_average)}
        />
      </div>
      <div className='grid gap-1.5'>
        <span className='flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider'>
          <Trophy className='size-3.5 stroke-[1.75]' />
          Toppers
        </span>
        {item.toppers.length ? (
          <ol className='grid gap-1'>
            {item.toppers.slice(0, 3).map((topper) => (
              <li key={topper.student_id} className='flex min-w-0 items-center gap-2 text-[12.5px]'>
                <span className='tabular grid size-4.5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10.5px] font-bold text-primary'>
                  {topper.rank}
                </span>
                <span className='truncate text-slate-800 dark:text-slate-200 font-medium'>{topper.name}</span>
                <span className='tabular ml-auto shrink-0 text-[11.5px] font-semibold text-slate-600 dark:text-slate-300'>
                  {percent(topper.percent)}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <span className='text-[12px] text-slate-400'>No published exam yet</span>
        )}
      </div>
    </ClickCard>
  )
}
