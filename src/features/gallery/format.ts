export const classLabel = (name: string) => (/^\d+$/.test(name) ? `Class ${name}` : name)

export const sectionLabel = (className: string, sectionName: string) =>
  `${classLabel(className)} - ${sectionName}`

export const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`
