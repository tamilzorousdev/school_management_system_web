import {
  AlertTriangle,
  Ban,
  CalendarClock,
  ChevronRight,
  FileWarning,
  Gauge,
  HandCoins,
  Hourglass,
  IndianRupee,
  ShieldAlert,
  Wallet,
} from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/common/display'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatNumber } from '@/lib/format'
import { useDueReport, useFleetInsights, type ExpenseCategory } from '../api'
import { DOCUMENT_CATEGORIES, EXPENSE_CATEGORY, rupees } from '../labels'
import type { TabProps } from '../search'
import { DueBadge, DueLeft } from './schedules-tab'

const documentName = (kind: string) => EXPENSE_CATEGORY[kind as ExpenseCategory] ?? kind

const daysTone = (days: number) => (days < 0 ? 'danger' : days <= 7 ? 'warning' : 'neutral')

const daysLabel = (days: number) =>
  days < 0
    ? `Expired ${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} ago`
    : days === 0
      ? 'Expires today'
      : `${days} ${days === 1 ? 'day' : 'days'} left`

export function OverviewTab({ goTo }: TabProps) {
  const insights = useFleetInsights()
  const due = useDueReport()
  const data = insights.data

  const cards: Insight[] = [
    {
      key: 'spend',
      label: 'Spent this month',
      value: rupees(data?.total_this_month ?? 0),
      hint: `Fuel ${rupees(data?.fuel_this_month ?? 0)}`,
      icon: IndianRupee,
      tone: 'primary',
      onClick: () => goTo('reports', { report: 'costs' }),
    },
    {
      key: 'services',
      label: 'Services overdue',
      value: data?.overdue_services ?? 0,
      hint: `${data?.due_soon_services ?? 0} due soon`,
      icon: CalendarClock,
      tone: data?.overdue_services ? 'danger' : 'warning',
      onClick: () => goTo('schedules', { due: data?.overdue_services ? 'overdue' : 'due_soon' }),
    },
    {
      key: 'mileage',
      label: 'Average mileage',
      value: formatNumber(data?.avg_km_per_litre, 1, 'km/l'),
      hint: 'Full fills, all buses',
      icon: Gauge,
      tone: 'success',
      onClick: () => goTo('reports', { report: 'mileage' }),
    },
    {
      key: 'off_road',
      label: 'Off-road buses',
      value: data?.off_road_buses ?? 0,
      hint: 'Open tickets stop them',
      icon: Ban,
      tone: data?.off_road_buses ? 'danger' : 'neutral',
      onClick: () => goTo('tickets', { off_road: true, status: 'open' }),
    },
    {
      key: 'pending_fuel',
      label: 'Fuel to check',
      value: data?.pending_fuel_approvals ?? 0,
      hint: 'Added by drivers',
      icon: Hourglass,
      tone: data?.pending_fuel_approvals ? 'warning' : 'neutral',
      onClick: () => goTo('fuel', { fuel_status: 'pending' }),
    },
    {
      key: 'blocked',
      label: 'Blocked buses',
      value: data?.blocked_checks ?? 0,
      hint: 'Safety item failed today',
      icon: ShieldAlert,
      tone: data?.blocked_checks ? 'danger' : 'neutral',
      onClick: () => goTo('checks', { state: 'blocked' }),
    },
    {
      key: 'pay_back',
      label: 'To pay back',
      value: rupees(data?.pending_reimbursements ?? 0),
      hint: 'Paid by drivers',
      icon: HandCoins,
      tone: 'info',
      onClick: () => goTo('reports', { report: 'reimbursements' }),
    },
    {
      key: 'budget',
      label: 'Over budget',
      value: data?.over_budget_buses ?? 0,
      hint: 'Buses this month',
      icon: Wallet,
      tone: data?.over_budget_buses ? 'danger' : 'neutral',
      onClick: () => goTo('reports', { report: 'costs' }),
    },
  ]

  const services = due.data?.services ?? []
  const documents = due.data?.documents ?? []

  return (
    <>
      {insights.isError ? (
        <ErrorState message={insights.error.message} onRetry={() => insights.refetch()} />
      ) : (
        <InsightCards items={cards} loading={insights.isPending} />
      )}
      <div className='grid items-start gap-4 lg:grid-cols-2'>
        <Card className='overflow-hidden'>
          <div className='flex items-center justify-between gap-2 border-b px-4 py-3'>
            <h2 className='text-sm font-bold text-slate-900 dark:text-slate-100'>Services due</h2>
            <button
              type='button'
              onClick={() => goTo('schedules')}
              className='text-xs font-semibold text-primary hover:underline'
            >
              All service rules
            </button>
          </div>
          {due.isPending ? (
            <div className='grid gap-2 p-4'>
              <Skeleton className='h-12' />
              <Skeleton className='h-12' />
            </div>
          ) : due.isError ? (
            <ErrorState message={due.error.message} onRetry={() => due.refetch()} />
          ) : services.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title='No services due'
              description='Services due soon or overdue show here. Add service rules in Schedules.'
            />
          ) : (
            <ul className='grid divide-y'>
              {services.map((schedule) => (
                <li key={schedule.id}>
                  <button
                    type='button'
                    onClick={() => goTo('schedules', { vehicle_id: schedule.vehicle.id })}
                    className='flex w-full items-center gap-3 px-4 py-3 text-left outline-none hover:bg-muted/50 focus-visible:bg-accent/60'
                  >
                    <span className='grid min-w-0 flex-1 gap-0.5'>
                      <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
                        {schedule.title}
                      </span>
                      <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
                        {schedule.vehicle.name} · {schedule.vehicle.registration_no}
                      </span>
                      <DueLeft schedule={schedule} />
                    </span>
                    <DueBadge schedule={schedule} />
                    <ChevronRight className='size-4 shrink-0 text-slate-400' />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className='overflow-hidden'>
          <div className='flex items-center justify-between gap-2 border-b px-4 py-3'>
            <h2 className='text-sm font-bold text-slate-900 dark:text-slate-100'>
              Documents expiring
            </h2>
            <span className='text-xs text-muted-foreground'>Within 30 days</span>
          </div>
          {due.isPending ? (
            <div className='grid gap-2 p-4'>
              <Skeleton className='h-12' />
              <Skeleton className='h-12' />
            </div>
          ) : due.isError ? null : documents.length === 0 ? (
            <EmptyState
              icon={FileWarning}
              title='No documents expiring'
              description='Insurance, fitness, permit, PUC and other papers show here 30 days before they run out.'
            />
          ) : (
            <ul className='grid divide-y'>
              {documents.map((document) => (
                <li key={`${document.vehicle.id}-${document.kind}`}>
                  <button
                    type='button'
                    title='Log the renewal in Expenses'
                    onClick={() =>
                      goTo('expenses', {
                        vehicle_id: document.vehicle.id,
                        expense_category: DOCUMENT_CATEGORIES.includes(
                          document.kind as ExpenseCategory
                        )
                          ? (document.kind as ExpenseCategory)
                          : undefined,
                      })
                    }
                    className='flex w-full items-center gap-3 px-4 py-3 text-left outline-none hover:bg-muted/50 focus-visible:bg-accent/60'
                  >
                    {document.days_left < 0 ? (
                      <AlertTriangle className='size-4 shrink-0 text-destructive' />
                    ) : (
                      <FileWarning className='size-4 shrink-0 text-warning' />
                    )}
                    <span className='grid min-w-0 flex-1 gap-0.5'>
                      <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
                        {documentName(document.kind)}
                      </span>
                      <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
                        {document.vehicle.name} · {document.vehicle.registration_no} ·{' '}
                        {formatDate(document.expiry)}
                      </span>
                    </span>
                    <Badge tone={daysTone(document.days_left)} className='font-medium'>
                      {daysLabel(document.days_left)}
                    </Badge>
                    <ChevronRight className='size-4 shrink-0 text-slate-400' />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
