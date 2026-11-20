import type { ClassroomItem, PrintTheme } from './classroom-catalog'
import type { SheetFont } from './pdf-core'
import type { Values } from './store'

export const paper = { width: 210, height: 297 }

export const printThemes: Record<
  PrintTheme,
  {
    label: string
    swatch: string
    headerBg: string
    headerBar: string
    primary: string
    ink: string
    muted: string
    rule: string
    cardA: string
    cardB: string
    cardC: string
    cardD: string
  }
> = {
  jardim: {
    label: 'Jardim',
    swatch: '#1E5643',
    headerBg: '#E6F2EC',
    headerBar: '#1E5643',
    primary: '#1E5643',
    ink: '#1B2A24',
    muted: '#4E635A',
    rule: '#A6BCB0',
    cardA: '#E6F2EC',
    cardB: '#FBF3E4',
    cardC: '#FCECE5',
    cardD: '#EFE8F8',
  },
  sol: {
    label: 'Sol & Papel',
    swatch: '#D4921A',
    headerBg: '#FDF3D8',
    headerBar: '#D4921A',
    primary: '#7A4F08',
    ink: '#2A2216',
    muted: '#665840',
    rule: '#D0BA88',
    cardA: '#FDF3D8',
    cardB: '#EEF4E8',
    cardC: '#FCECE5',
    cardD: '#F5EFE0',
  },
  pessego: {
    label: 'Pêssego',
    swatch: '#B9543F',
    headerBg: '#FCECE5',
    headerBar: '#B9543F',
    primary: '#8C3B2B',
    ink: '#2E201D',
    muted: '#6B524C',
    rule: '#D5B2A8',
    cardA: '#FCECE5',
    cardB: '#EFE8F8',
    cardC: '#FBF5EA',
    cardD: '#E8F2EC',
  },
  economico: {
    label: 'Econômico P&B',
    swatch: '#222825',
    headerBg: '#FFFFFF',
    headerBar: '#222825',
    primary: '#1B221F',
    ink: '#111614',
    muted: '#424D47',
    rule: '#5C6861',
    cardA: '#FFFFFF',
    cardB: '#FFFFFF',
    cardC: '#FFFFFF',
    cardD: '#FFFFFF',
  },
}

export function resolveTheme(item: ClassroomItem, values: Values) {
  const key = (values.printTheme || item.defaultTheme || 'jardim') as PrintTheme
  return printThemes[key] ?? printThemes.jardim
}

export type Mark =
  | {
      kind: 'text'
      text: string
      x: number
      y: number
      width: number
      size: number
      color: string
      bold?: boolean
      align?: 'left' | 'center' | 'right'
    }
  | {
      kind: 'box'
      x: number
      y: number
      width: number
      height: number
      fill?: string
      stroke?: string
      dashed?: boolean
      radius?: number
    }
  | {
      kind: 'line'
      x: number
      y: number
      width: number
      color: string
      dashed?: boolean
    }
  | {
      kind: 'path'
      points: { x: number; y: number }[]
      color: string
      strokeWidth: number
      dashed?: boolean
    }
  | {
      kind: 'image'
      asset: string
      x: number
      y: number
      width: number
      height: number
      alt: string
    }

export type Sheet = {
  name: string
  marks: Mark[]
  size?: typeof paper
  font?: SheetFont
}

export const assetUrl = (name: string) =>
  name.startsWith('data:') || name.startsWith('blob:')
    ? name
    : import.meta.env.BASE_URL + 'colecao/' + name

export function localDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value.split('-').reverse().join('/')
    : value
}

export function applyCase(text: string, uppercase?: boolean) {
  return uppercase ? text.toLocaleUpperCase('pt-BR') : text
}

export function lineWrap(text: string, width: number, size: number) {
  const rows: string[] = []
  const capacity = Math.max(1, Math.floor(width / (size * 0.54)))
  for (const paragraph of text.trim().split(/\r?\n/)) {
    if (!paragraph.trim()) {
      rows.push('')
      continue
    }
    let line = ''
    for (const word of paragraph.trim().split(/\s+/)) {
      if (line && line.length + word.length + 1 > capacity) {
        rows.push(line)
        line = ''
      }
      if (word.length > capacity) {
        const letters = Array.from(word)
        while (letters.length > capacity)
          rows.push(letters.splice(0, capacity).join(''))
        line = letters.join('')
      } else line = line ? line + ' ' + word : word
    }
    rows.push(line)
  }
  return rows
}

export function makeSheet(
  name: string,
  size?: typeof paper,
  font?: SheetFont,
): Sheet {
  return { name, marks: [], ...(size ? { size } : {}), ...(font ? { font } : {}) }
}

export function draw(sheet: Sheet, defaultInk: string, defaultRule: string) {
  const { marks } = sheet
  return {
    box(
      x: number,
      y: number,
      width: number,
      height: number,
      fill?: string,
      stroke?: string,
      dashed = false,
      radius?: number,
    ) {
      marks.push({
        kind: 'box',
        x,
        y,
        width,
        height,
        fill,
        stroke,
        dashed,
        radius,
      })
    },
    line(
      x: number,
      y: number,
      width: number,
      color = defaultRule,
      dashed = false,
    ) {
      marks.push({ kind: 'line', x, y, width, color, dashed })
    },
    path(
      points: { x: number; y: number }[],
      color = defaultRule,
      strokeWidth = 0.85,
      dashed = true,
    ) {
      marks.push({ kind: 'path', points, color, strokeWidth, dashed })
    },
    text(
      text: string,
      x: number,
      y: number,
      size = 4,
      options: {
        width?: number
        color?: string
        bold?: boolean
        align?: 'left' | 'center' | 'right'
      } = {},
    ) {
      marks.push({
        kind: 'text',
        text,
        x,
        y,
        size,
        width: options.width ?? 195 - x,
        bold: options.bold,
        color: options.color ?? defaultInk,
        align: options.align,
      })
    },
    image(
      asset: string,
      x: number,
      y: number,
      width: number,
      height: number,
      alt: string,
    ) {
      marks.push({ kind: 'image', asset, x, y, width, height, alt })
    },
  }
}

export type Draw = ReturnType<typeof draw>

export function textRows(
  page: Draw,
  rows: string[],
  x: number,
  y: number,
  width: number,
  size = 4.1,
  color?: string,
  bold?: boolean,
) {
  for (const row of rows) {
    if (row) page.text(row, x, y, size, { width, color, bold })
    y += size * 1.55
  }
  return y
}
