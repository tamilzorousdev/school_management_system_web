import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  Building2,
  CalendarCheck,
  Clock,
  IndianRupee,
  MessageSquareWarning,
  ShieldAlert,
  Wallet,
  UsersRound,
} from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/common/display'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Card } from '@/components/ui/card'
import { useNow } from '@/hooks/use-now'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { officeApi, useMonitor, useOfficeMe, useOfficeMutation, type AoCard } from '../api'
import { AoCardView } from '../components/ao-card'
import { AoDetailSheet } from '../components/ao-detail-sheet'
import { CardGrid, CardGridSkeleton } from '../components/shared'
import { attendanceLine, rupees } from '../labels'

const route = getRouteApi('/_app/office/monitor')

export function OfficeMonitorPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/office/monitor' })
  const me = useOfficeMe()
  const allowed = me.data?.can_monitor !== false
  const monitor = useMonitor(allowed)
  const now = useNow(30_000)
  const [remindingId, setRemindingId] = useState<number | null>(null)
  const remind = useOfficeMutation((userId: number) => officeApi.remind(userId))

  useShortcut('app.refresh', () => void monitor.refetch())

  const setAo = (ao: number | undefined) => navigate({ search: { ao }, replace: !ao })

  const sendReminder = async (card: AoCard) => {
    setRemindingId(card.user.id)
    try {
      const result = await remind.mutateAsync(card.user.id)
      alerts.success(result.message, {
        description: `${card.user.name} has ${result.pending} pending`,
      })
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setRemindingId(null)
    }
  }

  const summary = monitor.data?.summary
  const cards: Insight[] = [
    {
      key: 'pending',
      label: 'Pending approvals',
      value: summary?.pending.total ?? 0,
      hint: `${summary?.pending.overdue ?? 0} overdue`,
      icon: Clock,
      tone: summary?.pending.overdue ? 'danger' : 'primary',
    },
    {
      key: 'fees_today',
      label: 'Fees today',
      value: rupees(summary?.fees_today),
      icon: IndianRupee,
      tone: 'success',
    },
    {
      key: 'fees_month',
      label: 'Fees this month',
      value: rupees(summary?.fees_month),
      icon: Wallet,
      tone: 'success',
    },
    {
      key: 'attendance',
      label: 'Attendance marked',
      value: summary ? attendanceLine(summary.attendance) : '—',
      icon: CalendarCheck,
      tone:
        summary && summary.attendance.sections_marked < summary.attendance.sections_total
          ? 'warning'
          : 'info',
    },
    {
      key: 'grievances',
      label: 'Open grievances',
      value: summary?.open_grievances ?? 0,
      icon: MessageSquareWarning,
      tone: summary?.open_grievances ? 'warning' : 'neutral',
    },
    {
      key: 'unassigned',
      label: 'Wings with no AO',
      value: summary?.unassigned_wings.length ?? 0,
      hint: summary?.unassigned_wings.map((wing) => wing.name).join(', ') || 'All covered',
      icon: Building2,
      tone: summary?.unassigned_wings.length ? 'warning' : 'neutral',
    },
  ]

  const forbidden =
    me.data?.can_monitor === false || (monitor.isError && monitor.error.code === 'HEAD_AO_ONLY')

  return (
    <Page>
      <PageHeader
        eyebrow='Office'
        title='AO monitor'
        description='How every AO is doing today: approvals waiting, fees collected, attendance marked and when they were last active.'
      />
      {forbidden ? (
        <Card>
          <EmptyState
            icon={ShieldAlert}
            title='Only the head AO, principal and admin see this'
            description={
              monitor.isError ? monitor.error.message : 'Wing AOs see their own wings only.'
            }
          />
        </Card>
      ) : monitor.isError ? (
        <Card>
          <ErrorState message={monitor.error.message} onRetry={() => monitor.refetch()} />
        </Card>
      ) : (
        <>
          <InsightCards items={cards} loading={monitor.isPending} />
          {monitor.isPending ? (
            <CardGridSkeleton count={3} />
          ) : monitor.data.aos.length ? (
            <CardGrid>
              {monitor.data.aos.map((card) => (
                <AoCardView
                  key={card.user.id}
                  card={card}
                  now={now}
                  onOpen={() => setAo(card.user.id)}
                  onRemind={() => sendReminder(card)}
                  reminding={remindingId === card.user.id}
                />
              ))}
            </CardGrid>
          ) : (
            <Card>
              <EmptyState
                icon={UsersRound}
                title='No AOs yet'
                description='Give a user the AO role, then set their wings under Wings & AOs.'
              />
            </Card>
          )}
        </>
      )}
      <AoDetailSheet
        userId={forbidden ? undefined : search.ao}
        fallback={monitor.data?.aos.find((card) => card.user.id === search.ao)}
        onClose={() => setAo(undefined)}
        onRemind={sendReminder}
        reminding={remindingId !== null && remindingId === search.ao}
      />
    </Page>
  )
}
