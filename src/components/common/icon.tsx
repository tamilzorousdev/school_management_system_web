import * as React from 'react'
import { cn } from '@/lib/utils'
import { iconSizes, iconColors, type IconSize, type IconColor } from './icon-tokens'

export type { IconSize, IconColor }

export interface IconTileProps extends React.ComponentProps<'div'> {
  icon: React.ReactNode
  size?: IconSize
  color?: IconColor
}

/**
 * Standard Figma 50x50px Icon Tile Box.
 * Token: width: 50; height: 50; padding: 14px; border-radius: radius/md; border: 1px solid var(--border-default, #DFE4E1); background: var(--bg-surface, #FFFFFF);
 */
export function IconTile({
  icon,
  size = 'md',
  color = 'primary',
  className,
  ...props
}: IconTileProps) {
  const sizeClass = iconSizes[String(size)] || 'size-5'
  const colorClass = iconColors[color] || 'text-[#344054]'

  return (
    <div
      data-slot="icon-tile"
      className={cn(
        'flex size-[50px] shrink-0 items-center justify-center rounded-md border border-[#DFE4E1] bg-white p-[14px] shadow-2xs transition-colors',
        className
      )}
      {...props}
    >
      <div className={cn('flex items-center justify-center', sizeClass, colorClass)}>
        {icon}
      </div>
    </div>
  )
}

/**
 * Standard Figma Trash Icon (clean hollow can without inner vertical lines).
 */
export function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.75'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}
    >
      <path d='M3 6h18' />
      <path d='M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' />
      <path d='M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' />
    </svg>
  )
}

export {
  BusFrontIcon,
  CctvCameraIcon,
  ChatBubbleDotsIcon,
  ClipboardEditIcon,
  CompassTargetIcon,
  CreditCardIcon,
  DocumentClockIcon,
  DocumentQuestionIcon,
  DocumentTextIcon,
  FuelPumpIcon,
  GateArchHandleIcon,
  GraduationCapIcon,
  HandRupeeIcon,
  HeartPulseIcon,
  HorizontalBarMediumIcon,
  HorizontalBarThickIcon,
  HorizontalBarThinIcon,
  IdCardInfoIcon,
  IdCardVerifiedIcon,
  LocationSignalIcon,
  MapPinLocationIcon,
  MedicalPlusIcon,
  MegaphoneIcon,
  OpenBookIcon,
  OpenDoorPanelIcon,
  PhoneCallIcon,
  PrinterIcon,
  QrCodeIcon,
  ReceiptIcon,
  RightBracketDoorIcon,
  RoundedBoxOutlineIcon,
  RoundedFrameIcon,
  RoutePathIcon,
  RupeeCircleIcon,
  SchoolBuildingIcon,
  SosPhoneIcon,
  SpeedometerIcon,
  ThermometerIcon,
  TrophyStarIcon,
  UserSolidIcon,
  VerticalPillIcon,
  WalletIcon,
  WrenchToolsIcon,
} from './school-icons'

export {
  AlertCircleIcon,
  AlertTriangleIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  AtSignIcon,
  BellIcon,
  BoldIcon,
  BookIcon,
  BuildingIcon,
  CalendarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CircleIcon,
  ClockIcon,
  CloseXIcon,
  CodeIcon,
  DashboardGridIcon,
  DownloadIcon,
  EditIcon,
  EscalateIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  FilterIcon,
  FlagIcon,
  GitBranchIcon,
  GlobeIcon,
  GripIcon,
  HelpCircleIcon,
  HomeIcon,
  ImageIcon,
  InboxIcon,
  InfoCircleIcon,
  ItalicIcon,
  KeyIcon,
  LinkIcon,
  ListIcon,
  LoaderIcon,
  LockIcon,
  LogOutIcon,
  MailIcon,
  MenuIcon,
  MergeIcon,
  MessageIcon,
  MinusIcon,
  MonitorIcon,
  MoreHorizontalIcon,
  MoreVerticalIcon,
  PaperclipIcon,
  PauseIcon,
  PinIcon,
  PlayIcon,
  PlusIcon,
  RefreshIcon,
  SaveIcon,
  SearchIcon,
  SendIcon,
  SettingsSlidersIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  SmileIcon,
  SortIcon,
  SparklesIcon,
  StarIcon,
  ThumbsUpIcon,
  TicketIcon,
  TimerIcon,
  TrashOutlineIcon,
  UploadIcon,
  UserOutlineIcon,
  UsersIcon,
  WorkflowIcon,
  ZapIcon,
} from './ui-icons'

