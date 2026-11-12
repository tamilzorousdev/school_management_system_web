export const ID_CARD_DESIGNS = ['design1', 'design2', 'design3', 'custom'] as const

export type IdCardDesign = (typeof ID_CARD_DESIGNS)[number]

export const ID_CARD_DESIGN_LABELS: Record<IdCardDesign, string> = {
  design1: 'Design 1 (Original Classic)',
  design2: 'Design 2 (Modern Wave)',
  design3: 'Design 3 (Campus Shield)',
  custom: 'Uploaded design',
}

export function isIdCardDesign(value: string | null | undefined): value is IdCardDesign {
  return ID_CARD_DESIGNS.includes(value as IdCardDesign)
}
