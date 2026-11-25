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
            <span className='text-muted-foreground'> · {percent(attendance.percent)}</span>
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
          <span className='truncate text-base font-extrabold tracking-tight'>{wing.name}</span>
          <span className='text-xs text-muted-foreground'>{wing.range_label}</span>
        </div>
        {wing.board && <Badge tone='info'>{BOARD_LABEL[wing.board]}</Badge>}
      </div>
      <div className='flex min-w-0 items-center gap-2 text-xs'>
        <UserRound className='size-4 shrink-0 text-muted-foreground' />
        <span className='truncate'>
          {wing.aos.length ? (
            wing.aos.map((ao) => ao.name).join(', ')
          ) : (
            <span className='text-muted-foreground'>No AO · the head AO covers it</span>
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
        <span className='truncate text-base font-extrabold tracking-tight'>
          {className(item.name)}
        </span>
        <span className='truncate text-xs text-muted-foreground'>
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
        <span className='truncate text-base font-extrabold tracking-tight'>
          {item.class_section}
        </span>
        <span className='truncate text-xs text-muted-foreground'>
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
        <span className='flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground'>
          <Trophy className='size-3.5' />
          Toppers
        </span>
        {item.toppers.length ? (
          <ol className='grid gap-1'>
            {item.toppers.slice(0, 3).map((topper) => (
              <li key={topper.student_id} className='flex min-w-0 items-center gap-2 text-sm'>
                <span className='tabular grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary'>
                  {topper.rank}
                </span>
                <span className='truncate'>{topper.name}</span>
                <span className='tabular ml-auto shrink-0 text-xs font-semibold'>
                  {percent(topper.percent)}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <span className='text-xs text-muted-foreground'>No published exam yet</span>
        )}
      </div>
    </ClickCard>
  )
}
