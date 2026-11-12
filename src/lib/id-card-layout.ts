export const ID_CARD_LAYOUT_KEYS = [
  'photo',
  'qr',
  'student_name',
  'admission_no',
  'class_section',
  'roll_no',
  'dob',
  'blood_group',
  'guardian_name',
  'guardian_mobile',
  'address',
  'academic_year',
] as const
export type IdCardLayoutKey = (typeof ID_CARD_LAYOUT_KEYS)[number]

export interface IdCardLayoutItem {
  key: IdCardLayoutKey
  x: number
  y: number
  w: number
  h: number
  font_size: number
  color: string
  bold: boolean
  align: 'left' | 'center' | 'right'
}

export interface IdCardLayout {
  front: IdCardLayoutItem[]
  back: IdCardLayoutItem[]
}

export type IdCardSide = keyof IdCardLayout

export const ID_CARD_LAYOUT_LABELS: Record<IdCardLayoutKey, string> = {
  photo: 'Photo',
  qr: 'QR code',
  student_name: 'Name',
  admission_no: 'Student ID',
  class_section: 'Class',
  roll_no: 'Roll no',
  dob: 'Date of birth',
  blood_group: 'Blood group',
  guardian_name: 'Parent name',
  guardian_mobile: 'Parent mobile',
  address: 'Address',
  academic_year: 'Academic year',
}

export const ID_CARD_SAMPLE: Record<IdCardLayoutKey, string> = {
  photo: '',
  qr: '',
  student_name: 'Kavin Narayanan',
  admission_no: 'TZMS-2026-0001',
  class_section: '6 - A',
  roll_no: '10',
  dob: '14-06-2014',
  blood_group: 'B+',
  guardian_name: 'Narayanan R',
  guardian_mobile: '9876543210',
  address: '12, Gandhi Street, Coimbatore',
  academic_year: '2026-27',
}

export const ID_CARD_PREVIEW = {
  photo: '#CBD5E1',
  photoText: '#475569',
  qr: '#111827',
  qrBackground: '#FFFFFF',
}

const MM = 72 / 25.4
export const ID_CARD_LONG_PT = 85.6 * MM
export const ID_CARD_SHORT_PT = 54 * MM

export function cardWidthPt(landscape: boolean) {
  return landscape ? ID_CARD_LONG_PT : ID_CARD_SHORT_PT
}

export function layoutItem(
  key: IdCardLayoutKey,
  patch: Partial<IdCardLayoutItem> = {}
): IdCardLayoutItem {
  const picture = key === 'photo' || key === 'qr'
  return {
    key,
    x: 0.35,
    y: 0.45,
    w: picture ? 0.25 : 0.4,
    h: picture ? 0.3 : 0.07,
    font_size: 8,
    color: '#111827',
    bold: key === 'student_name',
    align: 'left',
    ...patch,
  }
}

export function defaultIdCardLayout(landscape: boolean): IdCardLayout {
  if (landscape) {
    return {
      front: [
        layoutItem('photo', { x: 0.15, y: 0.27, w: 0.21, h: 0.43 }),
        layoutItem('student_name', { x: 0.65, y: 0.42, w: 0.32, h: 0.07 }),
        layoutItem('admission_no', { x: 0.65, y: 0.505, w: 0.32, h: 0.07 }),
        layoutItem('class_section', { x: 0.65, y: 0.59, w: 0.32, h: 0.07 }),
        layoutItem('address', { x: 0.65, y: 0.675, w: 0.32, h: 0.12 }),
      ],
      back: [layoutItem('qr', { x: 0.4, y: 0.3, w: 0.2, h: 0.32 })],
    }
  }
  return {
    front: [
      layoutItem('photo', { x: 0.3, y: 0.24, w: 0.4, h: 0.32 }),
      layoutItem('student_name', { x: 0.08, y: 0.6, w: 0.84, h: 0.06, align: 'center' }),
      layoutItem('admission_no', { x: 0.08, y: 0.67, w: 0.84, h: 0.05, align: 'center' }),
      layoutItem('class_section', { x: 0.08, y: 0.73, w: 0.84, h: 0.05, align: 'center' }),
    ],
    back: [layoutItem('qr', { x: 0.25, y: 0.2, w: 0.5, h: 0.32 })],
  }
}
