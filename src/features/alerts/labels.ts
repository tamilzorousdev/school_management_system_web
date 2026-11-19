import {
  AlertTriangle,
  Gauge,
  Navigation,
  OctagonAlert,
  PauseCircle,
  Siren,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { BadgeTone } from '@/components/ui/badge'
import type { AlertKind, AlertSeverity, AlertStatus } from './api'

export const ALERT_KIND: Record<AlertKind, { label: string; icon: LucideIcon }> = {
  sos: { label: 'SOS', icon: Siren },
  overspeed: { label: 'Overspeed', icon: Gauge },
  harsh_braking: { label: 'Harsh braking', icon: OctagonAlert },
  idle: { label: 'Idling too long', icon: PauseCircle },
  route_deviation: { label: 'Off route', icon: Navigation },
  vehicle_fault: { label: 'Vehicle fault', icon: Wrench },
  other: { label: 'Other', icon: AlertTriangle },
}

export const ALERT_STATUS: Record<AlertStatus, { label: string; tone: BadgeTone }> = {
  open: { label: 'Raised', tone: 'danger' },
  acknowledged: { label: 'Acknowledged', tone: 'warning' },
  resolved: { label: 'Resolved', tone: 'success' },
}

export const SOS_MAP_COLOR = '#dc2626'

export const ALERT_SEVERITY: Record<AlertSeverity, { label: string; tone: BadgeTone }> = {
  low: { label: 'Low', tone: 'info' },
  medium: { label: 'Medium', tone: 'warning' },
  high: { label: 'High', tone: 'danger' },
  critical: { label: 'Critical', tone: 'danger' },
}

export const mapLink = (position: { lat: number; lng: number } | null) =>
  position ? `https://www.google.com/maps?q=${position.lat},${position.lng}` : null

export const telLink = (mobile: string | null | undefined) => (mobile ? `tel:+91${mobile}` : null)
