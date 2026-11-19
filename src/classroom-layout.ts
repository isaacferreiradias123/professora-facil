import { fields, rights } from './catalog'
import type {
  ClassroomItem,
  NoticeArt,
  PrintTheme,
  TraceTrack,
} from './classroom-catalog'
import { ageGuides } from './classroom-catalog'
import { panelGeometry, panelLabelLimit } from './panel-geometry'
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

export type Sheet = { name: string; marks: Mark[]; size?: typeof paper }

export const assetUrl = (name: string) =>
  import.meta.env.BASE_URL + 'colecao/' + name

export function initialValues(item: ClassroomItem): Values {
  const taskSteps = item.task?.steps.join('\n') ?? ''
  return {
    collectionId: item.id,
    title: item.title,
    school: '',
    classroom: '',
    body: item.body ?? '',
    recipient: 'Às famílias',
    copies: '2',
    signature: 'Equipe pedagógica',
    printTheme: item.defaultTheme ?? 'jardim',
    noticeArt: item.noticeArt ?? 'reuniao',
    detachable: item.detachable ? 'yes' : 'no',
    group: 'fruit',
    shuffleOrder: '2,0,3,1',
    traceCount: String(item.task?.tracks?.length ?? 4),
    memoryMode: 'no',
    guide: 'no',
    supplies: item.task?.supplies ?? '',
    stepsText: taskSteps,
    adaptation: item.task?.adaptation ?? '',
    bnccFields:
      item.tool === 'plano-de-aula'
        ? fields[item.age === 'Berçário' ? 1 : 3]
        : '',
    bnccRights: item.tool === 'plano-de-aula' ? `${rights[1]}|${rights[2]}|${rights[3]}` : '',
    ...Object.fromEntries(
      item.fields?.map((field) => [field.key, field.value ?? '']) ?? [],
    ),
  }
}

export function localDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value.split('-').reverse().join('/')
    : value
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

function draw(sheet: Sheet, defaultInk: string, defaultRule: string) {
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
    line(x: number, y: number, width: number, color = defaultRule, dashed = false) {
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
        width: options.width ?? 185 - x,
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

function sheet(name: string, size?: typeof paper): Sheet {
  return { name, marks: [], ...(size ? { size } : {}) }
}

type Draw = ReturnType<typeof draw>

function heading(
  page: Draw,
  item: ClassroomItem,
  values: Values,
  label: string,
  theme: (typeof printThemes)[PrintTheme],
  paperWidth = paper.width,
  title = values.title,
) {
  const boxWidth = paperWidth - 24
  page.box(12, 12, boxWidth, 39, theme.headerBg, theme.rule, false, 3)
  page.box(12, 12, 3.2, 39, theme.headerBar)
  page.text(label.toUpperCase(), 20, 18.5, 3.2, {
    bold: true,
    color: theme.primary,
    width: boxWidth - 16,
  })
  page.text(title, 20, 27, 6.8, {
    bold: true,
    color: theme.ink,
    width: boxWidth - 20,
  })
  page.text(
    [values.school, values.classroom || item.age, localDate(values.date ?? '')]
      .filter(Boolean)
      .join(' · '),
    20,
    42.5,
    3.1,
    { color: theme.muted, width: boxWidth - 16 },
  )
}

function textRows(
  page: Draw,
  rows: string[],
  x: number,
  y: number,
  width: number,
  size = 4.1,
  color?: string,
) {
  for (const row of rows) {
    if (row) page.text(row, x, y, size, { width, color })
    y += size * 1.55
  }
  return y
}

const picture: Record<string, string> = {
  'Flor do dia': 'il-flower.png',
  Flor: 'il-flower.png',
  Flores: 'il-flower.png',
  Maçã: 'il-fruit-apple.png',
  Maçãs: 'il-fruit-apple.png',
  Banana: 'il-fruit-banana.png',
  Bananas: 'il-fruit-banana.png',
  Pera: 'il-fruit-pear.png',
  Peras: 'il-fruit-pear.png',
  Morango: 'il-fruit-berry.png',
  Morangos: 'il-fruit-berry.png',
  Bola: 'il-ball.png',
  Bolas: 'il-ball.png',
  Livro: 'il-book.png',
  Livros: 'il-book.png',
  Leitura: 'il-book.png',
  Copo: 'il-cup.png',
  Copos: 'il-cup.png',
  Pano: 'il-cloth.png',
  Panos: 'il-cloth.png',
  Prato: 'il-plate.png',
  Gato: 'il-cat.png',
  Gatos: 'il-cat.png',
  Pato: 'il-duck.png',
  Patos: 'il-duck.png',
  Cão: 'il-dog.png',
  Cães: 'il-dog.png',
  Pássaro: 'il-bird.png',
  Pássaros: 'il-bird.png',
  Chegada: 'il-door.png',
  Despedida: 'il-door.png',
  Roda: 'il-circle.png',
  Jogos: 'il-circle.png',
  Lanche: 'il-fruit-apple.png',
  Brincadeira: 'il-ball.png',
  Brinquedos: 'il-ball.png',
  História: 'il-story.png',
  Histórias: 'il-story.png',
  Higiene: 'il-cup.png',
  Descanso: 'il-moon.png',
  Lua: 'il-moon.png',
  Lápis: 'il-pencil.png',
  Blocos: 'il-blocks.png',
  Construção: 'il-blocks.png',
  Pincel: 'il-brush.png',
  Pincéis: 'il-brush.png',
  Arte: 'il-brush.png',
  Pintura: 'il-brush.png',
  Sol: 'oficina-sol.png',
  Ovo: 'oficina-ovo.png',
  Lagarta: 'oficina-lagarta.png',
  Crisálida: 'oficina-crisalida.png',
  Borboleta: 'oficina-borboleta.png',
  Círculo: 'figura-circulo.svg',
  Triângulo: 'figura-triangulo.svg',
  Broto: 'il-sprout.png',
  Brotos: 'il-sprout.png',
  'Broto apareceu': 'il-sprout.png',
  Semente: 'il-seed.png',
  Sementes: 'il-seed.png',
  'Semente na terra': 'il-seed.png',
  Regador: 'il-watering.png',
  'Regamos a terra': 'il-watering.png',
  'Colher a fruta': 'il-fruit-pear.png',
  'Plantar a semente': 'il-seed.png',
  'Servir à mesa': 'il-plate.png',
  'Lavar a fruta': 'il-watering.png',
  Jardim: 'il-watering.png',
  Natureza: 'il-sprout.png',
}

export const activityGroups = [
  { id: 'fruit', label: 'Frutas' },
  { id: 'animals', label: 'Animais' },
  { id: 'school', label: 'Materiais escolares' },
  { id: 'nature', label: 'Natureza' },
  { id: 'routine', label: 'Objetos da rotina' },
] as const

export function worksheetGroups(item: ClassroomItem, values: Values) {
  if (item.id === 'criar-pares') {
    if (values.group === 'animals') return ['Gato', 'Pato', 'Cão', 'Pássaro']
    if (values.group === 'school') return ['Lápis', 'Livro', 'Pincel', 'Blocos']
    if (values.group === 'nature') return ['Sol', 'Flor', 'Broto', 'Regador']
    if (values.group === 'routine') return ['Bola', 'Copo', 'Livro', 'Pano']
    return ['Maçã', 'Banana', 'Pera', 'Morango']
  }
  if (item.id === 'criar-contagem') {
    if (values.group === 'animals') return ['Gatos', 'Patos', 'Cães']
    if (values.group === 'school') return ['Lápis', 'Livros', 'Pincéis']
    if (values.group === 'nature') return ['Flores', 'Brotos', 'Sementes']
    if (values.group === 'routine') return ['Bolas', 'Livros', 'Copos']
    return ['Maçãs', 'Bananas', 'Peras']
  }
  return item.task?.prompts ?? []
}

export function traceTracks(item: ClassroomItem, values: Values): TraceTrack[] {
  if (item.id !== 'criar-tracado') return item.task?.tracks ?? []
  const count = values.traceCount === '3' ? 3 : 4
  const sets: Record<string, TraceTrack[]> = {
    nature: [
      { from: 'Borboleta', to: 'Flor', kind: 'wave' },
      { from: 'Pássaro', to: 'Broto', kind: 'arc' },
      { from: 'Regador', to: 'Semente', kind: 'straight' },
      { from: 'Sol', to: 'Lua', kind: 'zigzag' },
    ],
    animals: [
      { from: 'Gato', to: 'Bola', kind: 'straight' },
      { from: 'Pato', to: 'Regador', kind: 'wave' },
      { from: 'Cão', to: 'Prato', kind: 'arc' },
      { from: 'Pássaro', to: 'Flor', kind: 'zigzag' },
    ],
    school: [
      { from: 'Lápis', to: 'Livro', kind: 'straight' },
      { from: 'Pincel', to: 'Flor', kind: 'wave' },
      { from: 'Blocos', to: 'Bola', kind: 'zigzag' },
      { from: 'História', to: 'Copo', kind: 'arc' },
    ],
    fruit: [
      { from: 'Maçã', to: 'Prato', kind: 'straight' },
      { from: 'Banana', to: 'Lanche', kind: 'wave' },
      { from: 'Pera', to: 'Copo', kind: 'arc' },
      { from: 'Morango', to: 'Flor', kind: 'zigzag' },
    ],
    routine: [
      { from: 'Chegada', to: 'Roda', kind: 'straight' },
      { from: 'Copo', to: 'Prato', kind: 'wave' },
      { from: 'Bola', to: 'Blocos', kind: 'arc' },
      { from: 'Livro', to: 'Lua', kind: 'zigzag' },
    ],
  }
  return (sets[values.group ?? 'nature'] ?? sets.nature).slice(0, count)
}

function iconFor(label: string) {
  return picture[label.split(' · ')[0]] ?? 'il-book.png'
}

export function worksheetQuantity(values: Values, index: number) {
  const fallback = [3, 5, 4][index] ?? 3
  const quantity = Number(values['quantity' + index] ?? fallback)
  return Number.isFinite(quantity)
    ? Math.max(1, Math.min(6, Math.trunc(quantity)))
    : fallback
}

export function activityObservation(item: ClassroomItem, values: Values) {
  const task = item.task!
  if (task.mode !== 'count' && task.mode !== 'table')
    return values.guide?.trim() || task.guide
  return (
    worksheetGroups(item, values)
      .map((label, index) => label + ': ' + worksheetQuantity(values, index))
      .join(' · ') + '. Observe como as crianças contam e comparam os grupos.'
  )
}

function guidePages(item: ClassroomItem, values: Values) {
  const task = item.task!
  const theme = resolveTheme(item, values)
  const pages: Sheet[] = []
  function nextPage() {
    const label = pages.length ? 'Roteiro da professora · continuação' : 'Roteiro da professora'
    const result = sheet(label)
    pages.push(result)
    const page = draw(result, theme.ink, theme.rule)
    heading(page, item, values, label, theme)
    if (item.age) {
      page.text(ageGuides[item.age], 16, 58, 3.4, { color: theme.muted, width: 180 })
    }
    page.text('Professora Fácil · Educação Infantil', 16, 283, 3.1, { color: theme.muted })
    return page
  }
  let page = nextPage()
  const supplies = values.supplies?.trim() || task.supplies
  const stepsList = (values.stepsText?.trim()
    ? values.stepsText.split(/\r?\n/).filter((s) => s.trim())
    : task.steps
  )
    .map((step, index) => index + 1 + '. ' + step.trim())
    .join('\n\n')
  const adaptation = values.adaptation?.trim() || task.adaptation
  const obs = activityObservation(item, values)

  let y = 70
  for (const [label, content] of [
    ['O que preparar', supplies],
    ['Como conduzir', stepsList],
    ['Como adaptar e incluir', adaptation],
    ...(obs ? [['O que observar', obs]] : []),
  ]) {
    const rows = lineWrap(content, 175, 3.85)
    let offset = 0
    do {
      if (y + 23 > 276) {
        page = nextPage()
        y = 70
      }
      page.box(14, y - 2, 182, 8.5, theme.headerBg, undefined, false, 2)
      page.text(label + (offset ? ' · continuação' : ''), 18, y + 0.5, 4.4, { bold: true, color: theme.primary })
      const count = Math.floor((276 - y - 10.5) / (3.85 * 1.55))
      y = textRows(page, rows.slice(offset, offset + count), 16, y + 10.5, 178, 3.85) + 7
      offset += count
    } while (offset < rows.length)
  }
  return pages
}

function card(
  page: Draw,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
  tint: string,
  stroke: string,
) {
  page.box(x, y, width, height, tint, stroke, true, 3)
  const side = Math.min(height - 15, width * 0.62, 31)
  page.image(
    iconFor(label),
    x + (width - side) / 2,
    y + 4,
    side,
    side,
    label.split(' · ')[0],
  )
  page.text(label, x + 4, y + height - 8.5, 3.6, {
    bold: true,
    width: width - 8,
    align: 'center',
  })
}

function trackPoints(
  kind: TraceTrack['kind'],
  x0: number,
  x1: number,
  cy: number,
  amp: number,
) {
  const points: { x: number; y: number }[] = []
  if (kind === 'straight') {
    const steps = 10
    for (let i = 0; i <= steps; i++)
      points.push({ x: x0 + ((x1 - x0) * i) / steps, y: cy })
    return points
  }
  if (kind === 'zigzag') {
    const segs = 6
    for (let i = 0; i <= segs; i++) {
      const offset = i === 0 || i === segs ? 0 : i % 2 === 1 ? -amp : amp
      points.push({ x: x0 + ((x1 - x0) * i) / segs, y: cy + offset })
    }
    return points
  }
  if (kind === 'arc') {
    const steps = 20
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      points.push({
        x: x0 + (x1 - x0) * t,
        y: cy - Math.sin(t * Math.PI) * amp * 1.15,
      })
    }
    return points
  }
  // wave
  const steps = 28
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    points.push({
      x: x0 + (x1 - x0) * t,
      y: cy - Math.sin(t * Math.PI * 4) * amp * 0.9,
    })
  }
  return points
}

export function activityCommand(item: ClassroomItem, values: Values) {
  const task = item.task!
  const command =
    item.id === 'criar-contagem'
      ? 'Conte as figuras de cada grupo e anote a quantidade na coluna ao lado.'
      : task.mode === 'trace'
        ? 'Passe o lápis sobre os caminhos pontilhados sem sair da trilha.'
        : task.mode === 'story'
          ? 'Observe as ilustrações e escreva os números das cenas na ordem em que aconteceram.'
          : task.mode === 'sort'
            ? 'Observe as figuras e desenhe ou cole cada objeto no quadro correspondente.'
            : task.mode === 'draw-frame'
              ? 'Faça um desenho caprichado no espaço abaixo e conte para a professora anotar.'
              : task.mode === 'table' || task.mode === 'count'
                ? 'Conte as figuras de cada linha e registre a quantidade no quadro.'
                : task.steps[1]
  return (values.command ?? command).replace(/\s+/g, ' ').trim()
}

function matchOrder(values: Values, count: number): number[] {
  const raw = (values.shuffleOrder ?? '')
    .split(',')
    .map((n) => Number(n))
    .filter((n) => Number.isInteger(n) && n >= 0 && n < count)
  if (raw.length === count && new Set(raw).size === count) return raw
  return Array.from({ length: count }, (_, i) => (i + 2) % count)
}

function buildCardsSheet(
  item: ClassroomItem,
  values: Values,
  prompts: string[],
  titleSuffix: string,
) {
  const theme = resolveTheme(item, values)
  const result = sheet(titleSuffix)
  const page = draw(result, theme.ink, theme.rule)
  heading(page, item, values, 'Cartões para a roda', theme)
  textRows(
    page,
    lineWrap(
      values.memoryMode === 'yes'
        ? 'Jogo da memória: recorte os pares iguais nas linhas tracejadas e vire para baixo.'
        : 'Recorte nas linhas tracejadas. Apresente os cartões um por vez.',
      175,
      4,
    ),
    16,
    60,
    175,
    4,
  )
  const palette = [theme.cardA, theme.cardB, theme.cardC, theme.cardD]
  const top = 76
  prompts.forEach((label, i) =>
    card(
      page,
      label,
      16 + (i % 2) * 91,
      top + Math.floor(i / 2) * 64,
      86,
      58,
      palette[i % palette.length],
      theme.rule,
    ),
  )
  page.text('Professora Fácil · Educação Infantil', 16, 283, 3.1, {
    color: theme.muted,
  })
  return result
}

function worksheet(item: ClassroomItem, values: Values): Sheet[] {
  const task = item.task!
  const theme = resolveTheme(item, values)
  const prompts = worksheetGroups(item, values)
  const palette = [theme.cardA, theme.cardB, theme.cardC, theme.cardD]

  if (task.mode === 'cards') {
    const first = buildCardsSheet(
      item,
      values,
      prompts,
      values.memoryMode === 'yes'
        ? 'Cartões · folha 1 (pares)'
        : 'Cartões de uso coletivo',
    )
    if (values.memoryMode === 'yes') {
      const second = buildCardsSheet(
        item,
        values,
        [...prompts].reverse(),
        'Cartões · folha 2 (pares)',
      )
      return [first, second]
    }
    return [first]
  }

  const result = sheet('Folha da criança')
  const page = draw(result, theme.ink, theme.rule)
  heading(page, item, values, 'Atividade ilustrada', theme)

  page.text('Nome:', 16, 58, 3.8, { bold: true })
  page.line(31, 63.5, 107, theme.rule)
  page.text('Data:', 144, 58, 3.8, { bold: true })
  page.line(156, 63.5, 36, theme.rule)

  textRows(
    page,
    lineWrap(activityCommand(item, values), 178, 4.1),
    16,
    70,
    178,
    4.1,
  )

  if (task.mode === 'trace') {
    const tracks = traceTracks(item, values)
    const startY = 89
    const slotH = tracks.length <= 3 ? 58 : 44
    tracks.forEach((track, i) => {
      const y = startY + i * slotH
      const h = slotH - 6
      const cy = y + h / 2
      page.box(16, y, 178, h, i % 2 === 0 ? '#FFFFFF' : theme.cardB, theme.rule, false, 3)
      page.image(iconFor(track.from), 22, cy - 11, 22, 22, track.from)
      page.image(iconFor(track.to), 166, cy - 11, 22, 22, track.to)
      page.box(49, cy - 1.5, 3, 3, theme.primary)
      page.box(158, cy - 1.5, 3, 3, theme.primary)
      page.path(
        trackPoints(track.kind, 53, 157, cy, tracks.length <= 3 ? 11 : 9),
        theme.primary,
        1.1,
        true,
      )
    })
  } else if (task.mode === 'draw-frame') {
    const heroIcon = task.illustrations?.[0] ?? 'Flor do dia'
    page.box(16, 86, 178, 134, '#FFFFFF', theme.primary, false, 4)
    page.box(18, 88, 174, 130, undefined, theme.rule, true, 3)
    page.image(iconFor(heroIcon), 164, 91, 24, 24, heroIcon)
    page.text(
      prompts[0] ?? 'O que eu desenhei',
      16,
      230,
      4.2,
      { bold: true, color: theme.primary },
    )
    for (let i = 0; i < 3; i++) {
      page.line(16, 246 + i * 12, 178, theme.rule)
    }
  } else if (task.mode === 'story' || task.mode === 'sort') {
    const top = 88
    prompts.forEach((label, i) =>
      card(
        page,
        label,
        16 + (i % 2) * 91,
        top + Math.floor(i / 2) * 62,
        86,
        56,
        palette[i % palette.length],
        theme.rule,
      ),
    )
    if (task.mode === 'story') {
      prompts.forEach((_, index) => {
        const x = 16 + (index % 2) * 91
        const y = top + Math.floor(index / 2) * 62
        page.box(x + 5, y + 4, 9, 9, theme.primary)
        page.text(String(index + 1), x + 5, y + 6, 4, {
          bold: true,
          color: '#FFFFFF',
          width: 9,
          align: 'center',
        })
      })
      const drawNext = item.id === 'ciclo-borboleta'
      page.text('Minha ordem:', 16, 220, 4, { bold: true })
      for (let i = 0; i < prompts.length; i++)
        page.box(16 + i * 45, 230, 36, drawNext ? 14 : 24, '#FFFFFF', theme.rule, false, 2)
      if (drawNext) {
        page.text('Desenhe onde a borboleta voou depois:', 16, 250, 3.9, {
          bold: true,
        })
        page.box(16, 258, 178, 19, '#FFFFFF', theme.rule, false, 2)
      }
    }
    if (task.mode === 'sort') {
      page.text('Desenhe ou cole cada objeto na caixa certa:', 16, 218, 3.9, {
        bold: true,
      })
      page.box(16, 228, 86, 47, theme.cardA, theme.rule, false, 3)
      page.box(108, 228, 86, 47, theme.cardC, theme.rule, false, 3)
      page.text(task.sortLabels?.[0] ?? 'Brinquedos', 20, 232, 3.9, {
        bold: true,
        color: theme.primary,
        width: 78,
      })
      page.text(task.sortLabels?.[1] ?? 'Materiais de desenho', 112, 232, 3.9, {
        bold: true,
        color: theme.primary,
        width: 78,
      })
    }
  } else if (task.mode === 'match') {
    const order = matchOrder(values, prompts.length)
    prompts.forEach((label, i) => {
      const y = 92 + i * 44
      card(page, label, 18, y, 54, 38, theme.cardB, theme.rule)
      card(page, prompts[order[i]], 138, y, 54, 38, theme.cardC, theme.rule)
      page.box(77, y + 17.5, 3.5, 3.5, theme.primary)
      page.box(129.5, y + 17.5, 3.5, 3.5, theme.primary)
    })
  } else if (task.mode === 'names') {
    prompts.forEach((label, i) => {
      const y = 92 + i * 58
      page.box(16, y, 178, 49, i === 0 ? theme.cardA : theme.cardB, theme.rule, false, 3)
      page.text(label, 22, y + 5, 4.3, { bold: true, color: theme.primary })
      // Caixinha da letra inicial + pauta caligráfica infantil
      page.box(22, y + 15, 18, 24, '#FFFFFF', theme.primary, false, 2)
      page.text('1ª letra', 22, y + 40.5, 2.5, {
        color: theme.muted,
        width: 18,
        align: 'center',
      })
      page.line(46, y + 20, 140, theme.rule)
      page.line(46, y + 28, 140, theme.muted, true)
      page.line(46, y + 36, 140, theme.ink)
    })
  } else if (task.mode === 'table' || task.mode === 'count') {
    page.box(16, 90, 178, 15, theme.primary)
    page.text('ELEMENTO', 21, 95, 3.4, { color: '#FFFFFF', bold: true })
    page.text('FIGURAS PARA CONTAR', 60, 95, 3.4, { color: '#FFFFFF', bold: true })
    page.text('QUANTOS?', 161, 95, 3.4, {
      color: '#FFFFFF',
      bold: true,
      width: 30,
    })
    prompts.forEach((label, i) => {
      const y = 105 + i * 40
      page.box(16, y, 178, 40, i % 2 ? theme.cardB : '#FFFFFF', theme.rule)
      page.text(label, 21, y + 15, 4.1, { bold: true })
      const qty = worksheetQuantity(values, i)
      const step = qty >= 6 ? 16.5 : 18
      for (let j = 0; j < qty; j++)
        page.image(iconFor(label), 57 + j * step, y + 11.5, 15, 15, label)
      page.box(164, y + 7, 23, 25, '#FFFFFF', theme.primary, false, 2)
    })
    const question =
      values.footerQuestion?.trim() ||
      'Qual grupo tem mais figuras? Circule ou escreva como descobriu:'
    page.text(question, 16, 234, 4, { bold: true, width: 178 })
    page.box(16, 244, 178, 28, '#FFFFFF', theme.rule, false, 2)
  } else if (task.mode === 'pattern') {
    const rows = [
      ['Maçã', 'Banana', 'Maçã', 'Banana', 'Maçã'],
      ['Pera', 'Pera', 'Maçã', 'Pera', 'Pera'],
      [],
    ]
    rows.forEach((sequence, i) => {
      const y = 94 + i * 58
      page.text(
        i === 2 ? 'Invente seu padrão:' : 'Complete a fileira ' + (i + 1) + ':',
        16,
        y,
        4.1,
        { bold: true, color: theme.primary },
      )
      for (let j = 0; j < 6; j++) {
        const x = 16 + j * 30
        page.box(
          x,
          y + 10,
          26,
          34,
          i === 2 || !sequence[j] ? '#FFFFFF' : theme.cardB,
          theme.rule,
          !sequence[j],
          2,
        )
        if (sequence[j])
          page.image(iconFor(sequence[j]), x + 4, y + 18, 18, 18, sequence[j])
      }
    })
  }

  page.text('Professora Fácil · Educação Infantil', 16, 283, 3.1, {
    color: theme.muted,
  })
  return [result]
}

export function noticeFields(item: ClassroomItem, values: Values) {
  return (item.fields ?? []).map((field) => ({
    label: field.label,
    text: localDate(values[field.key] ?? ''),
  }))
}

export function hasAuthorization(item: ClassroomItem, values?: Values) {
  if (values?.copies === '4') return false
  if (values?.detachable === 'yes') return true
  if (values?.detachable === 'no') return false
  return Boolean(item.detachable || item.id === 'passeio')
}

const noticeArtAssets: Record<NoticeArt, { asset: string; color: string }> = {
  reuniao: { asset: 'bilhete-reuniao.webp', color: '#E6F2EC' },
  passeio: { asset: 'bilhete-passeio.webp', color: '#FCECE5' },
  materiais: { asset: 'bilhete-materiais.webp', color: '#EFE8F8' },
  evento: { asset: 'bilhete-evento.webp', color: '#FDF3D8' },
}

export function noticeVisual(item: ClassroomItem, values?: Values) {
  const chosen = values?.noticeArt
  if (chosen === 'none') return { asset: '', color: '#F7F6F1' }
  if (chosen && Object.hasOwn(noticeArtAssets, chosen)) {
    return noticeArtAssets[chosen as NoticeArt]
  }
  return noticeArtAssets[item.noticeArt ?? 'reuniao']
}

export function noticeFits(item: ClassroomItem, values: Values) {
  const copies = values.copies === '4' ? 4 : values.copies === '1' ? 1 : 2
  const fields = noticeFields(item, values)
  if (copies === 4) {
    const rows = lineWrap(values.body, 78, 3.4).length
    const top = fields.length ? 55 : 37
    const limit = Math.floor((130 - top - 11) / (3.4 * 1.55))
    return (
      rows <= limit &&
      fields.every((field) => field.text.length <= 24) &&
      values.title.length <= 48 &&
      values.signature.length + values.recipient.length <= 75
    )
  }
  const rows = lineWrap(values.body, 168, 4.15).length
  const top = fields.length ? 72 : 50
  const room =
    (copies === 2 ? 130 : 264) -
    top -
    (hasAuthorization(item, values) ? 34 : 13)
  const limit = Math.floor(room / (4.15 * 1.55))
  return (
    rows <= limit &&
    fields.every((field) => field.text.length <= 30) &&
    values.title.length <= 65 &&
    values.signature.length + values.recipient.length <= 110
  )
}

function noticeSheet(item: ClassroomItem, values: Values) {
  const theme = resolveTheme(item, values)
  const result = sheet('Comunicado às famílias')
  const page = draw(result, theme.ink, theme.rule)
  const copies = values.copies === '4' ? 4 : values.copies === '1' ? 1 : 2
  const fields = noticeFields(item, values)
  const visual = noticeVisual(item, values)
  const headerBg =
    values.printTheme === 'economico' ? '#FFFFFF' : visual.color

  if (copies === 4) {
    for (let i = 0; i < 4; i++) {
      const col = i % 2
      const row = Math.floor(i / 2)
      const x = 10 + col * 97
      const y = 10 + row * 141
      const w = 93
      const h = 133
      page.box(x, y, w, h, '#FFFFFF', theme.rule, false, 2)
      page.box(x, y, w, 25, headerBg)
      if (visual.asset)
        page.image(visual.asset, x + w - 26, y + 3, 23, 16, 'Ilustração do recado')
      const textW = visual.asset ? w - 32 : w - 10
      page.text(values.school || 'COMUNICADO', x + 5, y + 4.5, 2.7, {
        bold: true,
        color: theme.primary,
        width: textW,
      })
      page.text(values.title, x + 5, y + 10.5, 4.1, { bold: true, width: textW })
      page.text(values.classroom, x + 5, y + 19, 2.7, {
        color: theme.muted,
        width: textW,
      })
      page.text(values.recipient, x + 5, y + 29, 3.3, {
        bold: true,
        width: w - 10,
      })
      let nextY = y + 36
      if (fields.length) {
        const visibleFields = fields.slice(0, 3)
        const colW = (w - 10) / visibleFields.length
        page.box(x + 5, nextY, w - 10, 14, theme.cardB)
        visibleFields.forEach((field, idx) => {
          const lx = x + 7 + colW * idx
          page.text(field.label.toUpperCase(), lx, nextY + 2.5, 2.3, {
            bold: true,
            width: colW - 3,
          })
          if (field.text.trim())
            page.text(field.text, lx, nextY + 7.5, 2.9, { width: colW - 3 })
          else page.line(lx, nextY + 10.5, colW - 5, theme.muted)
        })
        nextY += 17
      }
      const rows = lineWrap(values.body, w - 12, 3.4)
      const maxRows = Math.max(0, Math.floor((y + h - nextY - 10) / (3.4 * 1.55)))
      nextY = textRows(page, rows.slice(0, maxRows), x + 5, nextY, w - 10, 3.4)
      page.text(values.signature, x + 5, Math.min(nextY + 2, y + h - 7), 3, {
        bold: true,
        width: w - 10,
      })
    }
    page.line(10, 147, 190, theme.muted, true)
    page.path(
      [
        { x: 105, y: 10 },
        { x: 105, y: 285 },
      ],
      theme.muted,
      0.5,
      true,
    )
    return result
  }

  const height = copies === 2 ? 130 : 264
  const showAuth = hasAuthorization(item, values)
  for (let i = 0; i < copies; i++) {
    const y = 12 + i * 142
    page.box(12, y, 186, height, '#FFFFFF', theme.rule, false, 3)
    page.box(12, y, 186, 33, headerBg)
    if (visual.asset)
      page.image(visual.asset, 158, y + 4, 35, 23.33, 'Ilustração do recado')
    const titleWidth = visual.asset ? 133 : 168
    page.text(values.school || 'COMUNICADO ESCOLAR', 20, y + 6, 3.5, {
      bold: true,
      color: theme.primary,
      width: titleWidth,
    })
    page.text(values.title, 20, y + 14.5, 6, { bold: true, width: titleWidth })
    page.text(values.classroom, 20, y + 25.5, 3.25, {
      color: theme.muted,
      width: titleWidth,
    })
    page.text(values.recipient, 20, y + 40, 4.1, { bold: true, width: 168 })
    let nextY = y + 50
    if (fields.length) {
      const column = 171 / fields.length
      page.box(19, nextY, 172, 17, theme.cardB, undefined, false, 2)
      fields.forEach((field, index) => {
        const left = 23 + column * index
        page.text(field.label.toUpperCase(), left, nextY + 3, 2.9, {
          bold: true,
          color: theme.primary,
          width: column - 5,
        })
        if (field.text.trim())
          page.text(field.text, left, nextY + 9, 3.5, { width: column - 5 })
        else page.line(left, nextY + 13, column - 9, theme.muted)
      })
      nextY += 22
    }
    const rows = lineWrap(values.body, 168, 4.15)
    const visible = noticeFits(item, values)
      ? rows
      : rows.slice(
          0,
          Math.max(
            0,
            Math.floor((y + height - nextY - (showAuth ? 36 : 12)) / 6.44),
          ),
        )
    nextY = textRows(page, visible, 20, nextY, 168, 4.15)
    page.text(
      values.signature,
      20,
      Math.min(nextY + 3, y + height - (showAuth ? 31 : 9)),
      3.5,
      { bold: true, color: theme.primary, width: 168 },
    )
    if (showAuth) {
      const cut = y + height - 23
      page.line(18, cut, 174, theme.muted, true)
      page.text('AUTORIZAÇÃO / CONFIRMAÇÃO', 21, cut + 3, 3.1, { bold: true })
      page.text(
        'Autorizo a participação de ______________________________________',
        21,
        cut + 9,
        3.3,
        { width: 170 },
      )
      page.text(
        'Assinatura: ______________________________  Data: _____/_____/_____',
        21,
        cut + 15,
        3.3,
        { width: 170 },
      )
    }
  }
  if (copies === 2) page.line(12, 148, 186, theme.muted, true)
  return result
}

export const assembled = panelGeometry().assembled
export function panelMap() {
  return panelGeometry().tiles
}
export function mosaicGeometry(item: ClassroomItem) {
  return panelGeometry(item.panel)
}
export function panelPieces(item: ClassroomItem, values: Values) {
  const custom = values.panelPieces
    ?.split(/\r?\n/)
    .map((value) => value.trim().slice(0, 40))
    .filter(Boolean)
    .slice(0, 28)
  return custom?.length ? custom : (item.poster ?? [])
}

function kitGrid(item: ClassroomItem) {
  if (item.kit === 'tiras')
    return { columns: 1, rows: 5, width: 182, height: 41, gapY: 48 }
  if (item.kit === 'placas')
    return { columns: 2, rows: 3, width: 88, height: 69, gapY: 77 }
  return { columns: 2, rows: 4, width: 88, height: 49, gapY: 59 }
}

export function kitSheetCount(item: ClassroomItem, values: Values) {
  const { columns, rows } = kitGrid(item)
  return Math.ceil(panelPieces(item, values).length / (columns * rows)) + 2
}

function panelGuide(item: ClassroomItem, values: Values, pages: number) {
  const theme = resolveTheme(item, values)
  const guide = sheet('Guia de montagem')
  const page = draw(guide, theme.ink, theme.rule)
  heading(page, item, values, 'Guia de montagem', theme)
  const geometry = mosaicGeometry(item)
  const orientation =
    geometry.paper.width > geometry.paper.height ? 'paisagem' : 'retrato'
  const notes = item.poster
    ? [
        'Imprima as folhas de peças em papel A4 e em escala de 100%.',
        'Recorte nas linhas tracejadas e organize as peças em uma superfície.',
        'Monte o cabeçalho no topo. Distribua os cartões abaixo conforme o mapa.',
      ]
    : [
        'Imprima as folhas de arte em papel A4, orientação ' +
          orientation +
          ' e escala de 100%.',
        'As folhas têm sobreposição de 5 mm. Apare apenas uma borda em cada encontro.',
        'Alinhe as marcas, confira a imagem montada e fixe as folhas pelo verso.',
      ]
  textRows(page, notes, 16, 64, 180, 4)
  page.text(pages + ' folhas de arte + 1 guia', 16, 92, 4.6, {
    bold: true,
    color: theme.primary,
  })
  if (!item.poster) {
    const { assembled, tiles, stepX, stepY, rows, columns } = geometry
    const scale = Math.min(165 / assembled.width, 138 / assembled.height)
    const x = (210 - assembled.width * scale) / 2
    const y = 110
    for (const mark of panelArtwork(values, item)) {
      if (mark.kind === 'path') {
        guide.marks.push({
          ...mark,
          points: mark.points.map((pt) => ({
            x: x + pt.x * scale,
            y: y + pt.y * scale,
          })),
          strokeWidth: mark.strokeWidth * scale,
        })
      } else {
        guide.marks.push({
          ...mark,
          x: x + mark.x * scale,
          y: y + mark.y * scale,
          width: mark.width * scale,
          ...('height' in mark ? { height: mark.height * scale } : {}),
          ...(mark.kind === 'text' ? { size: mark.size * scale } : {}),
        })
      }
    }
    for (let row = 1; row < rows; row++)
      page.line(
        x,
        y + row * stepY * scale,
        assembled.width * scale,
        theme.primary,
        true,
      )
    for (let column = 1; column < columns; column++)
      page.box(
        x + column * stepX * scale,
        y,
        0.25,
        assembled.height * scale,
        theme.primary,
      )
    for (const { row, column, originX, originY } of tiles) {
      const labelX = x + 4 + originX * scale
      const labelY = y + 5 + originY * scale
      page.box(labelX - 1, labelY - 1, 13, 6, theme.cardB)
      page.text(row + 1 + ' / ' + (column + 1), labelX, labelY, 3.3, {
        bold: true,
        width: 12,
      })
    }
    const cm = (length: number) => (length / 10).toLocaleString('pt-BR')
    page.text(
      'Medida montada: ' +
        cm(assembled.width) +
        ' × ' +
        cm(assembled.height) +
        ' cm',
      25,
      263,
      4,
      { bold: true },
    )
  } else {
    page.box(16, 110, 178, 29, theme.cardA, theme.rule)
    page.text(values.title, 21, 120, 6, { bold: true, width: 166 })
    const pieces = panelPieces(item, values)
    const columns =
      item.kit === 'tiras' && pieces.length <= 6
        ? 1
        : pieces.length > 16
          ? 5
          : pieces.length > 8
            ? 4
            : 3
    const span = 180 / columns
    const palette = [theme.cardA, theme.cardC, theme.cardB, theme.cardD]
    pieces.forEach((label, i) => {
      const x = 16 + (i % columns) * span
      const y = 146 + Math.floor(i / columns) * 17
      page.box(x, y, span - 3, 14, palette[i % 4], theme.rule)
      const art = columns <= 4 ? picture[label] : undefined
      if (art) page.image(art, x + 2, y + 3, 8, 8, label)
      page.text(label, x + (art ? 12 : 3), y + 4, 2.6, {
        width: span - (art ? 17 : 8),
      })
    })
    page.text(
      'Cabeçalho: 18,2 × 4,2 cm · peças: ' +
        (kitGrid(item).width / 10).toLocaleString('pt-BR') +
        ' × ' +
        (kitGrid(item).height / 10).toLocaleString('pt-BR') +
        ' cm',
      16,
      267,
      3.8,
      { bold: true, width: 180 },
    )
  }
  return guide
}

export function panelArtwork(values: Values, item?: ClassroomItem): Mark[] {
  const theme = item
    ? resolveTheme(item, values)
    : printThemes.jardim
  const source = sheet('Composição montada')
  const page = draw(source, theme.ink, theme.rule)
  if (item?.panel) {
    const { width, height } = mosaicGeometry(item).assembled
    const { layout, art } = item.panel
    const labels = (
      values.panelPieces?.trim()
        ? panelPieces(item, values)
        : (item.mosaicLabels ?? [])
    ).slice(0, panelLabelLimit(item.panel))
    const top = layout === 'banner' ? 24 : 18
    const band = layout === 'banner' ? 100 : layout === 'birthday' ? 68 : 76
    const palette = [theme.cardA, theme.cardB, theme.cardC, theme.cardD]
    page.box(0, 0, width, height, theme.cardB)
    page.box(
      16,
      top,
      width - 32,
      band,
      palette[layout === 'timeline' ? 1 : layout === 'banner' ? 2 : 0],
      theme.rule,
      false,
      4,
    )
    if (art === 'oficina-ilustrada.png') {
      page.image(art, width - 164, top + 20, 140, 44, 'Enfeites de papel e sol')
    } else {
      page.image(
        art,
        width - 88,
        top + 6,
        62,
        band - 12,
        'Ilustração do painel',
      )
    }
    page.text(values.title, 31, top + 14, layout === 'banner' ? 28 : 22, {
      bold: true,
      color: theme.primary,
      width: width - (layout === 'banner' ? 193 : 132),
    })
    page.text(values.classroom || item.description, 32, top + band - 21, 10.5, {
      color: theme.muted,
      width: width - (layout === 'banner' ? 193 : 138),
    })

    if (layout === 'birthday') {
      const columns = 4
      const rows = 3
      const gap = 10
      const inset = 18
      const start = top + band + 14
      const cellWidth = (width - 2 * inset - (columns - 1) * gap) / columns
      const cellHeight = (height - start - 18 - (rows - 1) * gap) / rows
      labels.forEach((label, index) => {
        const x = inset + (index % columns) * (cellWidth + gap)
        const y = start + Math.floor(index / columns) * (cellHeight + gap)
        page.box(x, y, cellWidth, cellHeight, '#FFFFFF', theme.rule, false, 3)
        page.box(x, y, cellWidth, 22, palette[index % palette.length])
        page.text(label, x + 6, y + 6, 10.5, {
          bold: true,
          color: theme.primary,
          width: cellWidth - 12,
          align: 'center',
        })
        for (let line = y + 36; line < y + cellHeight - 10; line += 16)
          page.line(x + 8, line, cellWidth - 16, theme.rule)
      })
      return source.marks
    }

    const columns =
      layout === 'timeline' || layout === 'banner'
        ? Math.min(4, labels.length || 1)
        : 2
    const rows = Math.max(1, Math.ceil(labels.length / columns))
    const gap = 12
    const inset = 20
    const start = top + band + 17
    const cellWidth = (width - 2 * inset - (columns - 1) * gap) / columns
    const cellHeight = (height - start - 20 - (rows - 1) * gap) / rows
    labels.forEach((label, index) => {
      const x = inset + (index % columns) * (cellWidth + gap)
      const y = start + Math.floor(index / columns) * (cellHeight + gap)
      page.box(x, y, cellWidth, cellHeight, '#FFFFFF', theme.rule, false, 3)
      page.box(x, y, cellWidth, 29, palette[index % palette.length])
      page.text(
        (layout === 'timeline' ? index + 1 + ' · ' : '') + label,
        x + 8,
        y + 8,
        13,
        { bold: true, color: theme.primary, width: cellWidth - 16 },
      )
      if (picture[label]) {
        const imgSide = Math.min(cellWidth * 0.45, cellHeight - 62, 54)
        page.image(
          picture[label],
          x + (cellWidth - imgSide) / 2,
          y + 38,
          imgSide,
          imgSide,
          label,
        )
        page.line(x + 14, y + cellHeight - 18, cellWidth - 28, theme.rule)
      } else if (layout === 'chart') {
        for (let line = y + 49; line < y + cellHeight - 13; line += 22)
          page.line(x + 10, line, cellWidth - 20, theme.rule)
      } else {
        page.box(
          x + 10,
          y + 41,
          cellWidth - 20,
          cellHeight - 61,
          undefined,
          theme.rule,
          true,
        )
      }
    })
    return source.marks
  }

  page.image(
    'mural.webp',
    0,
    0,
    assembled.width,
    assembled.height,
    'Painel ilustrado de boas-vindas',
  )
  page.text(values.title, 55, 239, 25, { bold: true, width: 256 })
  page.text(values.classroom || 'Nossa sala de descobertas', 58, 297, 12, {
    width: 255,
    color: theme.muted,
  })
  return source.marks
}

function mosaic(item: ClassroomItem, values: Values) {
  const theme = resolveTheme(item, values)
  const source = panelArtwork(values, item)
  const { paper, tiles, margin, tileWidth, tileHeight, overlap } =
    mosaicGeometry(item)
  const sheets = tiles.map(({ row, column, originX, originY }) => {
    const page = sheet('Linha ' + (row + 1) + ' · Coluna ' + (column + 1))
    page.size = paper
    page.marks = source.map((mark) =>
      mark.kind === 'path'
        ? {
            ...mark,
            points: mark.points.map((pt) => ({
              x: pt.x - originX + margin,
              y: pt.y - originY + margin,
            })),
          }
        : {
            ...mark,
            x: mark.x - originX + margin,
            y: mark.y - originY + margin,
          },
    )
    const overlay = draw(page, theme.ink, theme.rule)
    overlay.box(-1, -1, paper.width + 2, margin + 1, '#FFFFFF')
    overlay.box(
      -1,
      paper.height - margin,
      paper.width + 2,
      margin + 1,
      '#FFFFFF',
    )
    overlay.box(-1, margin, margin + 1, tileHeight, '#FFFFFF')
    overlay.box(paper.width - margin, margin, margin + 1, tileHeight, '#FFFFFF')
    overlay.box(margin, margin, tileWidth, tileHeight, undefined, theme.muted, true)
    if (column > 0)
      overlay.box(margin + overlap, margin, 0.18, tileHeight, theme.muted)
    if (row > 0) overlay.line(margin, margin + overlap, tileWidth, theme.muted, true)
    overlay.text(page.name + ' · 100% · A4', 11, paper.height - 7, 3.1)
    return page
  })
  return [panelGuide(item, values, sheets.length), ...sheets]
}

function cutoutPanel(item: ClassroomItem, values: Values) {
  const theme = resolveTheme(item, values)
  const pieces = panelPieces(item, values)
  const result: Sheet[] = []
  const grid = kitGrid(item)
  const capacity = grid.columns * grid.rows
  const count = kitSheetCount(item, values) - 1
  const cover = sheet('Cabeçalho para recortar')
  const title = draw(cover, theme.ink, theme.rule)
  title.box(14, 25, 182, 42, theme.cardA, theme.muted, true, 3)
  title.image('paineis.webp', 18, 30, 39, 32, 'Ilustração para o cabeçalho')
  title.text(values.title, 63, 35, 7, {
    bold: true,
    color: theme.primary,
    width: 125,
  })
  title.text(values.classroom, 64, 52, 3.8, { width: 124 })
  title.text('Recorte o cabeçalho na linha tracejada.', 14, 76, 3.6)
  result.push(cover)
  const palette = [theme.cardA, theme.cardC, theme.cardB, theme.cardD]
  for (let start = 0; start < pieces.length; start += capacity) {
    const part = sheet(
      'Cartões · folha ' + (result.length + 1) + ' de ' + count,
    )
    const page = draw(part, theme.ink, theme.rule)
    page.text(part.name, 14, 12, 3.4, { bold: true, color: theme.primary })
    pieces.slice(start, start + capacity).forEach((label, i) => {
      const x = 14 + (i % grid.columns) * 94
      const y = 25 + Math.floor(i / grid.columns) * grid.gapY
      page.box(
        x,
        y,
        grid.width,
        grid.height,
        palette[i % 4],
        theme.muted,
        true,
        3,
      )
      const art = picture[label]
      if (art) page.image(art, x + 6, y + 10, 23, 23, label)
      const textInset = art ? 34 : 7
      page.text(label, x + textInset, y + 9, 4.2, {
        bold: true,
        width: grid.width - textInset - 7,
      })
      if (!['painel-rotina', 'painel-ajudantes', 'kit-cantinhos', 'kit-etiquetas'].includes(item.id))
        page.line(
          x + textInset,
          y + grid.height - 12,
          grid.width - textInset - 11,
          theme.rule,
        )
    })
    result.push(part)
  }
  return [panelGuide(item, values, count), ...result]
}

const planLabels = [
  'Acolhida',
  'Proposta principal',
  'Fechamento',
  'Extensão ou adaptação',
]

export type PlanMoment = { label: string; action: string; minutes: number }

export function planMoments(values: Values): PlanMoment[] {
  if (values.planSteps) {
    try {
      const items: unknown = JSON.parse(values.planSteps)
      if (Array.isArray(items))
        return items
          .slice(0, 10)
          .filter(
            (item): item is PlanMoment =>
              item &&
              typeof item.label === 'string' &&
              item.label.length <= 90 &&
              typeof item.action === 'string' &&
              item.action.length <= 420 &&
              Number.isInteger(item.minutes) &&
              item.minutes >= 0 &&
              item.minutes <= 180,
          )
    } catch {
      /* Read earlier drafts using their original fields. */
    }
  }
  const saved = (values.conduct ?? '').split(/\r?\n/)
  return planLabels
    .slice(0, values.extended === 'yes' ? 4 : 3)
    .map((label, index) => {
      const original = saved[index]?.match(/^(\d+)\s*min\s*·\s*(.*)$/)
      const minutes = Number(values['minute' + index] ?? original?.[1] ?? 0)
      return {
        label,
        minutes: Number.isFinite(minutes)
          ? Math.max(0, Math.min(180, Math.trunc(minutes)))
          : 0,
        action: values['moment' + index] ?? original?.[2] ?? saved[index] ?? '',
      }
    })
}

export function planMinutes(values: Values) {
  return planMoments(values).reduce(
    (total, moment) => total + moment.minutes,
    0,
  )
}

export function documentDetails(item: ClassroomItem, values: Values) {
  if (!item.form && item.tool !== 'relatorio') return []
  return (item.fields ?? [])
    .filter((field) => field.type !== 'long')
    .map((field) => ({
      label: field.label,
      text: values[field.key]?.trim() || '________________',
    }))
}

export function documentSignatures(item: ClassroomItem) {
  if (item.form === 'entrega') return ['Quem entregou', 'Quem recebeu']
  if (item.form === 'ata') return ['Responsável pela ata', 'Coordenação']
  if (item.form === 'ficha' || item.form === 'checklist')
    return ['Responsável pelo preenchimento']
  if (item.form === 'declaracao')
    return ['Responsável e identificação da escola']
  if (item.form === 'authorization')
    return ['Assinatura do responsável legal', 'Recebido pela escola']
  return item.tool === 'relatorio' ? ['Responsável pelo registro'] : []
}

export function documentKind(item: ClassroomItem) {
  if (item.form === 'ata') return 'Ata escolar'
  if (item.form === 'ficha') return 'Ficha escolar'
  if (item.form === 'declaracao') return 'Declaração escolar'
  if (item.form === 'entrega') return 'Registro de entrega'
  if (item.form === 'checklist') return 'Lista de conferência'
  if (item.form === 'authorization') return 'Autorização escolar'
  if (item.tool === 'plano-de-aula') {
    if (item.planLayout === 'weekly') return 'Planejamento semanal'
    if (item.planLayout === 'sequence') return 'Sequência didática'
    if (item.planLayout === 'infant') return 'Plano de creche'
    return 'Plano de aula'
  }
  return item.reportLayout === 'family-card'
    ? 'Síntese para famílias'
    : 'Registro pedagógico'
}

function buildWeeklyPlanSheets(item: ClassroomItem, values: Values): Sheet[] {
  const theme = resolveTheme(item, values)
  const pages: Sheet[] = []
  function nextPage(label: string) {
    const result = sheet(label, { width: 297, height: 210 })
    pages.push(result)
    const page = draw(result, theme.ink, theme.rule)
    heading(page, item, values, label, theme, 297)
    page.text('Professora Fácil · Educação Infantil', 12, 203, 2.9, { color: theme.muted })
    return page
  }

  const tags = [values.bnccFields, values.bnccRights]
    .filter(Boolean)
    .join(' | ')
    .replaceAll('|', ' · ')
  const objective = lineWrap(values.objective?.trim() || 'Objetivo da semana.', 260, 3.6)
  const focus = [...(tags ? lineWrap('BNCC: ' + tags, 260, 3.6) : []), ...objective]
  if (focus.length > 5) {
    for (let start = 0; start < focus.length; start += 22) {
      const page = nextPage(start ? 'Foco da semana · continuação' : 'Foco da semana')
      textRows(page, focus.slice(start, start + 22), 16, 58, 265, 3.6)
    }
  }

  const days = [
    ['mon', 'Segunda'], ['tue', 'Terça'], ['wed', 'Quarta'],
    ['thu', 'Quinta'], ['fri', 'Sexta'],
  ] as const
  const gap = 4
  const width = (273 - gap * 4) / 5
  const rows = days.map(([key]) => lineWrap(values[key] ?? '', width - 8, 3.6))
  const tints = [theme.cardA, theme.cardB, theme.cardC, theme.cardD, theme.cardA]
  let offset = 0
  do {
    const page = nextPage(offset ? 'Planejamento semanal · continuação' : 'Planejamento semanal')
    let y = 55
    if (!offset && focus.length <= 5) {
      const height = 12 + focus.length * 5.58
      page.box(12, y, 273, height, theme.cardB, theme.rule, false, 2)
      page.text('FOCO DA SEMANA', 16, y + 3, 3.3, { bold: true, color: theme.primary })
      textRows(page, focus, 16, y + 9, 265, 3.6)
      y += height + 4
    }
    const height = 194 - y
    const capacity = Math.floor((height - 20) / (3.6 * 1.55))
    days.forEach(([, label], index) => {
      const x = 12 + index * (width + gap)
      page.box(x, y, width, height, '#FFFFFF', theme.rule, false, 3)
      page.box(x, y, width, 13, tints[index])
      page.text(label, x + 3, y + 4.5, 4.1, {
        bold: true,
        color: theme.primary,
        width: width - 6,
        align: 'center',
      })
      textRows(page, rows[index].slice(offset, offset + capacity), x + 4, y + 18, width - 8, 3.6)
    })
    offset += capacity
  } while (rows.some((day) => day.length > offset))
  return pages
}

export function buildSheets(item: ClassroomItem, values: Values): Sheet[] {
  if (item.task) {
    if (item.task.mode === 'experience') return guidePages(item, values)
    const workSheets = worksheet(item, values)
    return item.task.mode === 'cards' || values.guide === 'yes'
      ? [...workSheets, ...guidePages(item, values)]
      : workSheets
  }
  if (item.category === 'Recados') return [noticeSheet(item, values)]
  if (item.category === 'Painéis')
    return item.poster ? cutoutPanel(item, values) : mosaic(item, values)
  if (item.tool === 'plano-de-aula' && item.planLayout === 'weekly') {
    return buildWeeklyPlanSheets(item, values)
  }

  const theme = resolveTheme(item, values)
  const pages: Sheet[] = []
  const kind = documentKind(item)
  const structured = item.form || item.tool === 'relatorio'
  let page: Draw
  let y = 0

  function nextPage() {
    const result = sheet(kind + (pages.length ? ' · continuação' : ''))
    pages.push(result)
    page = draw(result, theme.ink, theme.rule)
    heading(page, item, values, kind, theme)
    y = 58
  }

  nextPage()
  if (item.reportLayout === 'family-card') {
    page!.image('bilhete-evento.webp', 162, 16, 31, 21, 'Ilustração para famílias')
  }

  const isPlan = item.tool === 'plano-de-aula'
  if (isPlan) {
    const bnccList = [
      values.bnccFields?.replaceAll('|', ' · '),
      values.bnccRights?.replaceAll('|', ' · '),
    ]
      .filter(Boolean)
      .join(' | ')
    page!.box(14, y, 182, bnccList ? 21 : 12, theme.cardB, theme.rule, false, 2)
    page!.text('Duração total · ' + planMinutes(values) + ' min', 19, y + 4, 4, {
      bold: true,
      color: theme.primary,
    })
    if (bnccList) {
      page!.text('BNCC: ' + bnccList, 19, y + 12, 3.2, {
        color: theme.ink,
        width: 172,
      })
    }
    y += bnccList ? 26 : 17
  }

  const details = documentDetails(item, values)
  for (let start = 0; start < details.length; start += 2) {
    const row = details.slice(start, start + 2)
    const width = 182 / row.length
    row.forEach((field, index) => {
      const x = 14 + width * index
      page!.box(x, y, width, 19, theme.cardB, theme.rule, false, 2)
      page!.text(field.label, x + 5, y + 3.5, 3, {
        bold: true,
        color: theme.primary,
        width: width - 10,
      })
      page!.text(field.text, x + 5, y + 10.5, 3.9, { width: width - 10 })
    })
    y += 21
  }
  if (details.length) y += 4

  for (const field of item.fields ?? []) {
    if (structured && field.type !== 'long') continue
    if (isPlan && field.key === 'conduct') {
      for (const moment of planMoments(values)) {
        const rows = lineWrap(
          moment.action.trim().replace(/\s+/g, ' '),
          159,
          4,
        )
        const height = 18 + Math.max(1, rows.length) * 6.2
        if (y + height > 276) nextPage()
        page!.box(14, y, 182, height, theme.cardA, theme.rule, false, 2)
        page!.text(moment.label, 20, y + 5, 4.2, {
          bold: true,
          color: theme.primary,
          width: 115,
        })
        page!.text(moment.minutes + ' min', 162, y + 5, 3.9, {
          bold: true,
          width: 28,
          align: 'right',
        })
        textRows(page!, rows, 20, y + 14, 160, 4)
        y += height + 4.5
      }
      continue
    }

    const content = values[field.key]?.trim() ?? ''
    if (y > 243) nextPage()
    if (structured) page!.box(14, y - 2, 182, 9.5, theme.cardA, undefined, false, 2)
    page!.text(field.label, structured ? 18 : 14, y + 0.5, 4.3, {
      bold: true,
      color: theme.primary,
    })
    y += 10.5

    if (item.form === 'checklist' && field.key === 'items') {
      const checklistItems = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
      for (const entry of checklistItems.length
        ? checklistItems
        : ['______________________________']) {
        if (y > 274) nextPage()
        page!.box(16, y - 0.5, 4.5, 4.5, '#FFFFFF', theme.primary)
        const wrapped = lineWrap(entry, 166, 4)
        for (const row of wrapped) {
          if (y > 274) nextPage()
          page!.text(row, 24, y, 4, { width: 168 })
          y += 6.2
        }
        y += 1.5
      }
      y += 4
      continue
    }

    if (!content && structured) {
      for (let line = 0; line < 2; line++) {
        if (y > 272) nextPage()
        page!.line(14, y + 5, 180, theme.rule)
        y += 6.5
      }
    } else {
      for (const row of lineWrap(
        content || '________________________________________',
        178,
        4.1,
      )) {
        if (y > 275) nextPage()
        if (row) page!.text(row, 14, y, 4.1, { width: 178 })
        y += 6.3
      }
    }
    y += structured ? 5.5 : 8.5
  }

  const signatures = documentSignatures(item)
  if (signatures.length) {
    if (y > 248) nextPage()
    const span = 182 / signatures.length
    signatures.forEach((label, index) => {
      const x = 14 + span * index
      page!.line(x, y + 11, span - 12, theme.rule)
      page!.text(label, x, y + 14, 3.3, { color: theme.muted, width: span - 12 })
    })
  }
  return pages
}
