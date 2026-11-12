import type * as PdfJsModule from 'pdfjs-dist'
import type { PDFPageProxy } from 'pdfjs-dist'
import { layoutItem, type IdCardLayoutItem, type IdCardLayoutKey } from './id-card-layout'

type PdfJs = typeof PdfJsModule

const TARGET_LONG_SIDE = 1600
const MM = 72 / 25.4

const LABELS: [IdCardLayoutKey, string[]][] = [
  [
    'student_name',
    ['name', 'studentname', 'nameofthestudent', 'nameofstudent', 'fullname', 'studentsname'],
  ],
  [
    'admission_no',
    [
      'studentid',
      'id',
      'idno',
      'idnumber',
      'admissionno',
      'admissionnumber',
      'admno',
      'regno',
      'registerno',
      'registrationno',
      'studentno',
      'enrollmentno',
      'enrolmentno',
      'uid',
    ],
  ],
  ['roll_no', ['rollno', 'rollnumber', 'roll']],
  [
    'class_section',
    [
      'class',
      'grade',
      'gradeyear',
      'std',
      'standard',
      'classsection',
      'classsec',
      'section',
      'classandsection',
    ],
  ],
  ['dob', ['dob', 'dateofbirth', 'birthdate', 'birthday', 'doborn']],
  ['blood_group', ['bloodgroup', 'blood', 'bg', 'bgroup']],
  [
    'guardian_name',
    [
      'parent',
      'parentname',
      'father',
      'fathername',
      'fathersname',
      'guardian',
      'guardianname',
      'mother',
      'mothername',
    ],
  ],
  [
    'guardian_mobile',
    [
      'phone',
      'phoneno',
      'mobile',
      'mobileno',
      'contact',
      'contactno',
      'contactnumber',
      'emergencycontact',
      'parentmobile',
      'ph',
      'cell',
    ],
  ],
  ['address', ['address', 'addr', 'residence', 'residentialaddress']],
  ['academic_year', ['academicyear', 'session', 'year']],
]

const LABEL_INDEX = new Map<string, IdCardLayoutKey>(
  LABELS.flatMap(([key, words]) => words.map((word) => [word, key] as const))
)

interface Box {
  x: number
  y: number
  w: number
  h: number
}

interface Word {
  text: string
  norm: string
  box: Box
}

export interface DesignPage {
  file: File
  items: IdCardLayoutItem[]
}

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function isColon(text: string) {
  return /^[\s:：\-–]+$/.test(text)
}

function union(boxes: Box[]): Box {
  const x = Math.min(...boxes.map((box) => box.x))
  const y = Math.min(...boxes.map((box) => box.y))
  const right = Math.max(...boxes.map((box) => box.x + box.w))
  const bottom = Math.max(...boxes.map((box) => box.y + box.h))
  return { x, y, w: right - x, h: bottom - y }
}

function splitColon(word: Word): Word[] {
  const index = word.text.search(/[:：]/)
  if (index <= 0 || index === word.text.length - 1) return [word]
  const left = word.text.slice(0, index + 1)
  const right = word.text.slice(index + 1).trim()
  if (!right) return [word]
  const ratio = left.length / word.text.length
  const leftWidth = word.box.w * ratio
  return [
    { text: left, norm: normalize(left), box: { ...word.box, w: leftWidth } },
    {
      text: right,
      norm: normalize(right),
      box: { ...word.box, x: word.box.x + leftWidth, w: word.box.w - leftWidth },
    },
  ]
}

async function readWords(
  page: PDFPageProxy,
  transform: number[],
  util: { transform: (a: number[], b: number[]) => number[] },
  scale: number
): Promise<Word[]> {
  const content = await page.getTextContent()
  const words: Word[] = []
  for (const item of content.items) {
    if (!('str' in item) || !item.str.trim()) continue
    const matrix = util.transform(transform, item.transform)
    const size = Math.hypot(matrix[2]!, matrix[3]!)
    const box = { x: matrix[4]!, y: matrix[5]! - size * 0.85, w: item.width * scale, h: size * 1.1 }
    words.push(...splitColon({ text: item.str.trim(), norm: normalize(item.str), box }))
  }
  return words
}

function groupLines(words: Word[]): Word[][] {
  const sorted = [...words].sort((a, b) => a.box.y + a.box.h / 2 - (b.box.y + b.box.h / 2))
  const lines: Word[][] = []
  for (const word of sorted) {
    const center = word.box.y + word.box.h / 2
    const line = lines.find((entry) => {
      const first = entry[0]!
      return (
        Math.abs(first.box.y + first.box.h / 2 - center) < Math.min(first.box.h, word.box.h) * 0.5
      )
    })
    if (line) line.push(word)
    else lines.push([word])
  }
  return lines.map((line) => line.sort((a, b) => a.box.x - b.box.x))
}

function matchLabel(line: Word[], start: number): { key: IdCardLayoutKey; end: number } | null {
  let joined = ''
  let found: { key: IdCardLayoutKey; end: number } | null = null
  for (let index = start; index < Math.min(line.length, start + 4); index += 1) {
    joined += line[index]!.norm
    const key = LABEL_INDEX.get(joined)
    if (key) found = { key, end: index }
    if (line[index]!.text.trim().endsWith(':')) break
  }
  return found
}

interface Detected {
  key: IdCardLayoutKey
  value: Box
  sample: Box | null
  size: number
}

function detectFields(lines: Word[][], pageWidth: number): Detected[] {
  const found: Detected[] = []
  const used = new Set<IdCardLayoutKey>()
  lines.forEach((line, lineIndex) => {
    let index = 0
    while (index < line.length) {
      const label = matchLabel(line, index)
      if (!label || used.has(label.key)) {
        index += 1
        continue
      }
      const labelBox = union(line.slice(index, label.end + 1).map((word) => word.box))
      const after = line[label.end + 1]
      const hasColon =
        line[label.end]!.text.trim().endsWith(':') || (after !== undefined && isColon(after.text))
      const wideGap =
        after !== undefined && after.box.x - (labelBox.x + labelBox.w) > labelBox.h * 1.2
      const alone = index === 0 && label.end === line.length - 1
      if (!hasColon && !wideGap && !alone) {
        index += 1
        continue
      }
      let cursor = label.end + 1
      let gapStart = labelBox.x + labelBox.w
      while (cursor < line.length && isColon(line[cursor]!.text)) {
        gapStart = line[cursor]!.box.x + line[cursor]!.box.w
        cursor += 1
      }
      const valueWords: Word[] = []
      while (cursor < line.length && !matchLabel(line, cursor)) {
        valueWords.push(line[cursor]!)
        cursor += 1
      }
      const nextLabel = cursor < line.length ? line[cursor]!.box.x : pageWidth * 0.96
      const height = valueWords.length
        ? Math.max(...valueWords.map((word) => word.box.h))
        : labelBox.h
      const startX = valueWords.length ? valueWords[0]!.box.x : gapStart + height * 0.4
      const sampleBoxes = valueWords.map((word) => word.box)
      for (let next = lineIndex + 1; next < Math.min(lines.length, lineIndex + 3); next += 1) {
        const following = lines[next]!
        const first = following[0]!
        const previous = sampleBoxes.length ? union(sampleBoxes) : labelBox
        const close = first.box.y - (previous.y + previous.h) < height * 0.9
        const aligned = Math.abs(first.box.x - startX) < height * 1.2
        if (
          !close ||
          !aligned ||
          !valueWords.length ||
          following.some((_, i) => matchLabel(following, i))
        )
          break
        sampleBoxes.push(...following.map((word) => word.box))
      }
      const sample = sampleBoxes.length ? union(sampleBoxes) : null
      const top = Math.min(labelBox.y, sample?.y ?? labelBox.y)
      const bottom = Math.max(labelBox.y + labelBox.h, sample ? sample.y + sample.h : 0)
      found.push({
        key: label.key,
        value: {
          x: startX,
          y: top + height * 0.05,
          w: Math.max(nextLabel - startX - height * 0.3, height * 3),
          h: bottom - top + height * 0.2,
        },
        sample,
        size: height / 1.1,
      })
      used.add(label.key)
      index = cursor
    }
  })
  return found
}

async function detectPhoto(
  page: PDFPageProxy,
  transform: number[],
  pdfjs: PdfJs,
  width: number,
  height: number
): Promise<Box | null> {
  const { OPS, Util } = pdfjs
  const list = await page.getOperatorList()
  let ctm = [1, 0, 0, 1, 0, 0]
  const stack: number[][] = []
  const boxes: Box[] = []
  list.fnArray.forEach((fn, index) => {
    const args = list.argsArray[index] as unknown[]
    if (fn === OPS.save) stack.push(ctm)
    else if (fn === OPS.restore) ctm = stack.pop() ?? ctm
    else if (fn === OPS.transform) ctm = Util.transform(ctm, args as number[])
    else if (fn === OPS.paintFormXObjectBegin) {
      stack.push(ctm)
      if (Array.isArray(args[0])) ctm = Util.transform(ctm, args[0] as number[])
    } else if (fn === OPS.paintFormXObjectEnd) ctm = stack.pop() ?? ctm
    else if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject) {
      const m = Util.transform(transform, ctm)
      const xs = [m[4]!, m[0]! + m[4]!, m[2]! + m[4]!, m[0]! + m[2]! + m[4]!]
      const ys = [m[5]!, m[1]! + m[5]!, m[3]! + m[5]!, m[1]! + m[3]! + m[5]!]
      const x = Math.min(...xs)
      const y = Math.min(...ys)
      boxes.push({ x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y })
    }
  })
  const area = width * height
  const candidates = boxes.filter((box) => {
    const share = (box.w * box.h) / area
    const ratio = box.h / box.w
    return share > 0.02 && share < 0.45 && ratio > 0.85 && ratio < 2.2
  })
  return candidates.sort((a, b) => b.w * b.h - a.w * a.h)[0] ?? null
}

function pixel(data: ImageData, x: number, y: number): [number, number, number] {
  const px = Math.min(data.width - 1, Math.max(0, Math.round(x)))
  const py = Math.min(data.height - 1, Math.max(0, Math.round(y)))
  const offset = (py * data.width + px) * 4
  return [data.data[offset]!, data.data[offset + 1]!, data.data[offset + 2]!]
}

function hex([r, g, b]: [number, number, number]) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

function distance(a: [number, number, number], b: [number, number, number]) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])
}

function textColour(data: ImageData, box: Box, background: [number, number, number]) {
  let best = background
  let score = 0
  for (let y = box.y; y < box.y + box.h; y += 2) {
    for (let x = box.x; x < box.x + box.w; x += 2) {
      const colour = pixel(data, x, y)
      const value = distance(colour, background)
      if (value > score) {
        score = value
        best = colour
      }
    }
  }
  return score > 60 ? hex(best) : '#111827'
}

async function readPage(pdfjs: PdfJs, page: PDFPageProxy, name: string): Promise<DesignPage> {
  const natural = page.getViewport({ scale: 1 })
  const scale = TARGET_LONG_SIDE / Math.max(natural.width, natural.height)
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(viewport.width)
  canvas.height = Math.round(viewport.height)
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Canvas is not available in this browser')
  context.fillStyle = '#FFFFFF'
  context.fillRect(0, 0, canvas.width, canvas.height)
  await page.render({ canvasContext: context, viewport }).promise

  const words = await readWords(page, viewport.transform, pdfjs.Util, scale)
  const fields = detectFields(groupLines(words), canvas.width)
  const photo = await detectPhoto(page, viewport.transform, pdfjs, canvas.width, canvas.height)
  const data = context.getImageData(0, 0, canvas.width, canvas.height)
  const ptPerPx = (canvas.width > canvas.height ? 54 * MM : 85.6 * MM) / canvas.height
  const items: IdCardLayoutItem[] = []

  for (const field of fields) {
    const probe = field.sample ?? field.value
    const background = pixel(data, probe.x - field.size * 0.25, probe.y + probe.h / 2)
    const colour = field.sample ? textColour(data, field.sample, background) : '#111827'
    if (field.sample) {
      context.fillStyle = hex(background)
      const pad = field.size * 0.15
      context.fillRect(
        field.sample.x - pad,
        field.sample.y - pad,
        field.sample.w + pad * 2,
        field.sample.h + pad * 2
      )
    }
    items.push(
      layoutItem(field.key, {
        x: field.value.x / canvas.width,
        y: field.value.y / canvas.height,
        w: Math.min(field.value.w, canvas.width - field.value.x) / canvas.width,
        h: field.value.h / canvas.height,
        font_size: Math.round(Math.min(30, Math.max(4, field.size * ptPerPx)) * 2) / 2,
        color: colour,
        bold: false,
        align: 'left',
      })
    )
  }

  if (photo) {
    const background = pixel(data, photo.x - 4, photo.y + photo.h / 2)
    context.fillStyle = hex(background)
    context.fillRect(photo.x - 2, photo.y - 2, photo.w + 4, photo.h + 4)
    items.push(
      layoutItem('photo', {
        x: photo.x / canvas.width,
        y: photo.y / canvas.height,
        w: photo.w / canvas.width,
        h: photo.h / canvas.height,
      })
    )
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Could not read this PDF page')
  return {
    file: new File([blob], name, { type: 'image/png' }),
    items: items.map((item) => ({
      ...item,
      x: clamp(item.x),
      y: clamp(item.y),
      w: clamp(item.w),
      h: clamp(item.h),
    })),
  }
}

function clamp(value: number) {
  return Math.round(Math.min(1, Math.max(0, value)) * 10000) / 10000
}

export async function readDesignPdf(file: File, maxPages = 2): Promise<DesignPage[]> {
  const [pdfjs, worker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ])
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
  const base = file.name.replace(/\.pdf$/i, '')
  try {
    const pages: DesignPage[] = []
    for (let index = 1; index <= Math.min(pdf.numPages, maxPages); index += 1) {
      const page = await pdf.getPage(index)
      pages.push(await readPage(pdfjs, page, `${base}-page-${index}.png`))
      page.cleanup()
    }
    return pages
  } finally {
    await pdf.destroy()
  }
}

export function imageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
      URL.revokeObjectURL(url)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('This image could not be read'))
    }
    image.src = url
  })
}
