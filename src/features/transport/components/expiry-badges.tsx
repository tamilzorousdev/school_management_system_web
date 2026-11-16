import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format'
import type { ExpiryState } from '../api'
import { EXPIRY_TONE, SHORT_KIND, expiryText, worstFirst } from '../labels'

export function ExpiryBadge({ item, withKind = true }: { item: ExpiryState; withKind?: boolean }) {
  return (
    <Badge
      tone={EXPIRY_TONE[item.state]}
      title={item.date ? `${item.label} ends ${formatDate(item.date)}` : `${item.label} not set`}
    >
      {withKind && <span className='font-bold'>{SHORT_KIND[item.kind]}</span>}
      {expiryText(item)}
    </Badge>
  )
}

export function ExpiryBadges({
  items,
  attentionOnly = false,
}: {
  items: ExpiryState[]
  attentionOnly?: boolean
}) {
  const shown = attentionOnly
    ? items.filter((item) => item.state === 'expired' || item.state === 'due_soon')
    : items
  const fine = items.length - shown.length
  return (
    <span className='flex flex-wrap gap-1'>
      {worstFirst(shown).map((item) => (
        <ExpiryBadge key={item.kind} item={item} />
      ))}
      {attentionOnly && fine > 0 && (
        <Badge tone='neutral' title='Other documents are fine or not set'>
          {shown.length ? `+${fine} more` : `All ${fine} documents fine`}
        </Badge>
      )}
    </span>
  )
}
