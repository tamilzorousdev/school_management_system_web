import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Phone } from 'lucide-react'
import { Avatar } from '@/components/common/avatar'
import type { BadgeTone } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { StatusPill } from '@/features/attendance/components/students-tab'
import { cn } from '@/lib/utils'
import type { CopyStatus, LoanState, MemberRef } from '../api'
import { COPY_STATUS, LOAN_STATE, MEMBER_TYPE, badgeOf } from '../labels'

type PillTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

const toPillTone = (tone: BadgeTone): PillTone => {
  if (tone === 'success' || tone === 'warning' || tone === 'danger' || tone === 'info') return tone
  return 'neutral'
}

export function LoanStateBadge({ state, days }: { state: LoanState; days?: number }) {
  const item = badgeOf(LOAN_STATE, state)
  return (
    <StatusPill
      tone={toPillTone(item.tone)}
      label={`${item.label}${state === 'overdue' && days ? ` · ${days}d` : ''}`}
    />
  )
}

export function CopyStatusBadge({ status }: { status: CopyStatus }) {
  const item = badgeOf(COPY_STATUS, status)
  return <StatusPill tone={toPillTone(item.tone)} label={item.label} />
}

export function MemberLine({
  member,
  link = true,
  size = 'md',
}: {
  member: Pick<MemberRef, 'id' | 'name' | 'detail' | 'photo_url' | 'member_type'> & {
    card_no?: string
  }
  link?: boolean
  size?: 'sm' | 'md'
}) {
  const name = link ? (
    <Link
      to='/library/members/$memberId'
      params={{ memberId: String(member.id) }}
      onClick={(event) => event.stopPropagation()}
      className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 hover:text-primary hover:underline dark:text-slate-100'
    >
      {member.name}
    </Link>
  ) : (
    <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
      {member.name}
    </span>
  )
  return (
    <div className='flex min-w-0 items-center gap-2.5'>
      <Avatar name={member.name} src={member.photo_url} size={size === 'sm' ? 'sm' : 'md'} />
      <div className='grid min-w-0'>
        {name}
        <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
          {[MEMBER_TYPE[member.member_type], member.detail, member.card_no]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </div>
    </div>
  )
}

export function BookLine({
  bookId,
  title,
  sub,
}: {
  bookId: number
  title: string
  sub?: ReactNode
}) {
  return (
    <div className='grid min-w-0'>
      <Link
        to='/library/books/$bookId'
        params={{ bookId: String(bookId) }}
        onClick={(event) => event.stopPropagation()}
        className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 hover:text-primary hover:underline dark:text-slate-100'
      >
        {title}
      </Link>
      {sub && (
        <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
          {sub}
        </span>
      )}
    </div>
  )
}

export function Section({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
        <div className='grid min-w-0 gap-0.5'>
          <h2 className='font-bold'>{title}</h2>
          {description && <p className='text-xs text-muted-foreground'>{description}</p>}
        </div>
        {actions && <div className='flex flex-wrap items-center gap-2'>{actions}</div>}
      </div>
      {children}
    </Card>
  )
}

export function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: ReactNode
  tone?: 'danger' | 'success' | 'warning'
}) {
  return (
    <div className='grid gap-0.5 rounded-lg border px-3 py-2'>
      <dt className='text-xs font-semibold text-muted-foreground'>{label}</dt>
      <dd
        className={cn(
          'tabular text-lg font-extrabold',
          tone === 'danger' && 'text-destructive',
          tone === 'success' && 'text-success',
          tone === 'warning' && 'text-warning'
        )}
      >
        {value}
      </dd>
    </div>
  )
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <p
      role='alert'
      className='rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive'
    >
      {message}
    </p>
  )
}

export function Bar({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0
  return (
    <div className='h-1.5 w-full overflow-hidden rounded-full bg-muted'>
      <div className='h-full rounded-full bg-primary' style={{ width: `${width}%` }} />
    </div>
  )
}

export function PhoneText({ phone, link = true }: { phone: string | null; link?: boolean }) {
  if (!phone) return <span className='text-muted-foreground'>No phone</span>
  return (
    <span className='tabular inline-flex items-center gap-1'>
      <Phone className='size-3.5 shrink-0 text-muted-foreground' />
      {link ? (
        <a
          href={`tel:+91${phone}`}
          onClick={(event) => event.stopPropagation()}
          className='font-medium hover:text-primary hover:underline'
        >
          +91 {phone}
        </a>
      ) : (
        <span className='font-medium'>+91 {phone}</span>
      )}
    </span>
  )
}
