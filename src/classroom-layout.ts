import type { ClassroomItem } from './classroom-catalog'
import { ageGuides } from './classroom-catalog'
import type { Values } from './store'

export const paper = { width: 210, height: 297 }
export const ink = '#223930'
export const darkGreen = '#254c40'
export const muted = '#536860'
export const rule = '#a8bbb0'
export const sage = '#e6f0e7'
export const peach = '#f7dfcf'
export const cream = '#f9f4e8'
export const lavender = '#ece4f7'

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
      kind: 'image'
      asset: string
      x: number
      y: number
      width: number
      height: number
      alt: string
      crop?: { x: number; y: number; width: number; height: number }
    }
export type Sheet = { name: string; marks: Mark[] }
export const assetUrl = (name: string) =>
  import.meta.env.BASE_URL + 'colecao/' + name

export function initialValues(item: ClassroomItem): Values {
  return {
    collectionId: item.id,
    title: item.title,
    school: '',
    classroom: '',
    body: item.body ?? '',
    recipient: 'Às famílias',
    copies: '2',
    signature: 'Equipe pedagógica',
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
  const capacity = Math.floor(width / (size * 0.55))
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

function draw(sheet: Sheet) {
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
    ) {
      marks.push({ kind: 'box', x, y, width, height, fill, stroke, dashed })
    },
    line(x: number, y: number, width: number, color = rule, dashed = false) {
      marks.push({ kind: 'line', x, y, width, color, dashed })
    },
    text(
      text: string,
      x: number,
      y: number,
      size = 4,
      options: { width?: number; color?: string; bold?: boolean } = {},
    ) {
      marks.push({
        kind: 'text',
        text,
        x,
        y,
        size,
        width: options.width ?? 185 - x,
        bold: options.bold,
        color: options.color ?? ink,
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
function sheet(name: string): Sheet {
  return { name, marks: [] }
}
type Draw = ReturnType<typeof draw>

function heading(
  page: Draw,
  item: ClassroomItem,
  values: Values,
  label: string,
  title = values.title,
) {
  page.box(12, 12, 186, 43, sage)
  page.box(12, 12, 3, 43, darkGreen)
  page.text(label.toUpperCase(), 21, 20, 3.4, { bold: true })
  page.text(title, 21, 30, 7.3, { bold: true, width: 154 })
  page.text(
    [values.school, values.classroom || item.age, localDate(values.date ?? '')]
      .filter(Boolean)
      .join(' · '),
    21,
    47,
    3.2,
    { color: muted, width: 162 },
  )
}
function textRows(
  page: Draw,
  rows: string[],
  x: number,
  y: number,
  width: number,
  size = 4.1,
) {
  for (const row of rows) {
    if (row) page.text(row, x, y, size, { width })
    y += size * 1.55
  }
  return y
}

const picture: Record<string, string> = {
  Maçã: 'fruit-apple.png',
  Banana: 'fruit-banana.png',
  Pera: 'fruit-pear.png',
  Morango: 'fruit-berry.png',
  Bola: 'ball.png',
  Livro: 'book.png',
  Copo: 'cup.png',
  Pano: 'cloth.png',
  Gato: 'cat.png',
  Pato: 'duck.png',
  Cão: 'dog.png',
  Pássaro: 'bird.png',
  Chegada: 'door.png',
  Roda: 'circle.png',
  Lanche: 'fruit-apple.png',
  Brincadeira: 'ball.png',
  História: 'book.png',
  Higiene: 'cup.png',
  Descanso: 'moon.png',
  Despedida: 'door.png',
  Lápis: 'pencil.png',
  Blocos: 'blocks.png',
  Pincel: 'brush.png',
  'Broto apareceu': 'sprout.png',
  'Semente na terra': 'seed.png',
  'Regamos a terra': 'watering.png',
  'Colher a fruta': 'fruit-pear.png',
  'Plantar a semente': 'seed.png',
  'Servir à mesa': 'plate.png',
  'Lavar a fruta': 'watering.png',
  Gatos: 'cat.png',
  Patos: 'duck.png',
  Cães: 'dog.png',
  Livros: 'book.png',
  Pincéis: 'brush.png',
  Maçãs: 'fruit-apple.png',
  Bananas: 'fruit-banana.png',
  Peras: 'fruit-pear.png',
}
export function worksheetGroups(item: ClassroomItem, values: Values) {
  if (item.id === 'criar-contagem') {
    if (values.group === 'animals') return ['Gatos', 'Patos', 'Cães']
    if (values.group === 'school') return ['Lápis', 'Livros', 'Pincéis']
  }
  return item.task?.prompts ?? []
}

function iconFor(label: string) {
  return picture[label.split(' · ')[0]] ?? 'book.png'
}

export function worksheetQuantity(values: Values, index: number) {
  const fallback = [3, 5, 4][index]
  const quantity = Number(values['quantity' + index] ?? fallback)
  return Number.isFinite(quantity)
    ? Math.max(1, Math.min(5, Math.trunc(quantity)))
    : fallback
}

export function activityObservation(item: ClassroomItem, values: Values) {
  const task = item.task!
  if (task.mode !== 'count' && task.mode !== 'table') return task.guide
  return (
    worksheetGroups(item, values)
      .map((label, index) => label + ': ' + worksheetQuantity(values, index))
      .join(' · ') + '. Observe como as crianças contam e comparam os grupos.'
  )
}

function guidePage(item: ClassroomItem, values: Values) {
  const task = item.task!
  const result = sheet('Roteiro da professora')
  const page = draw(result)
  heading(page, item, values, 'Roteiro da professora')
  page.text(ageGuides[item.age!], 16, 62, 3.4, { color: muted, width: 180 })
  let y = 75
  for (const [label, content] of [
    ['O que preparar', task.supplies],
    [
      'Como conduzir',
      task.steps.map((step, index) => index + 1 + '. ' + step).join('\n\n'),
    ],
    ['Como adaptar', task.adaptation],
    ...(activityObservation(item, values)
      ? [['O que observar', activityObservation(item, values)!]]
      : []),
  ]) {
    page.text(label, 16, y, 5, { bold: true, color: darkGreen })
    y = textRows(page, lineWrap(content, 175, 3.8), 16, y + 9, 178, 3.8) + 8
  }
  return result
}

function card(
  page: Draw,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
  tint = cream,
) {
  page.box(x, y, width, height, tint, rule, true)
  const side = Math.min(height - 15, width * 0.65, 33)
  page.image(
    iconFor(label),
    x + (width - side) / 2,
    y + 4,
    side,
    side,
    label.split(' · ')[0],
  )
  page.text(label, x + 4, y + height - 9, 3.7, { bold: true, width: width - 8 })
}

export function activityCommand(item: ClassroomItem, values: Values) {
  const task = item.task!
  const command =
    item.id === 'criar-contagem'
      ? 'Conte as figuras de cada grupo e anote a quantidade.'
      : task.mode === 'story'
        ? 'Escreva os números das cenas na ordem em que aconteceram.'
        : task.mode === 'sort'
          ? 'Escolha o grupo de cada figura. Desenhe ou cole nos quadros.'
          : task.mode === 'table' || task.mode === 'count'
            ? 'Conte as frutas de cada grupo e anote a quantidade.'
            : task.steps[1]
  return (values.command ?? command).replace(/\s+/g, ' ').trim()
}

function worksheet(item: ClassroomItem, values: Values) {
  const task = item.task!
  const result = sheet(
    task.mode === 'cards' ? 'Cartões de uso coletivo' : 'Folha da criança',
  )
  const page = draw(result)
  const prompts = worksheetGroups(item, values)
  heading(
    page,
    item,
    values,
    task.mode === 'cards' ? 'Cartões para a roda' : 'Atividade ilustrada',
  )
  if (task.mode !== 'cards') {
    page.text('Nome:', 16, 62, 3.9, { bold: true })
    page.line(33, 68, 104)
    page.text('Data:', 145, 62, 3.9, { bold: true })
    page.line(157, 68, 34)
  }
  textRows(
    page,
    lineWrap(
      task.mode === 'cards'
        ? 'Recorte nas linhas tracejadas. Apresente os cartões um por vez.'
        : activityCommand(item, values),
      175,
      4,
    ),
    16,
    76,
    175,
    4,
  )
  if (task.mode === 'cards' || task.mode === 'story' || task.mode === 'sort') {
    const top = 94
    prompts.forEach((label, i) =>
      card(
        page,
        label,
        16 + (i % 2) * 91,
        top + Math.floor(i / 2) * 62,
        86,
        56,
        [sage, peach, cream, lavender][i],
      ),
    )
    if (task.mode === 'story') {
      prompts.forEach((_, index) => {
        const x = 16 + (index % 2) * 91
        const y = top + Math.floor(index / 2) * 62
        page.box(x + 5, y + 4, 9, 9, darkGreen)
        page.text(String(index + 1), x + 7.8, y + 6, 4, {
          bold: true,
          color: '#ffffff',
          width: 5,
        })
      })
      page.text('Minha ordem:', 16, 224, 4, { bold: true })
      for (let i = 0; i < prompts.length; i++)
        page.box(16 + i * 44, 236, 35, 22, undefined, rule)
    }
    if (task.mode === 'sort') {
      page.text('Desenhe ou cole um exemplo em cada espaço.', 16, 219, 3.8)
      page.box(16, 229, 85, 45, undefined, rule)
      page.box(106, 229, 85, 45, undefined, rule)
      page.text('Brinquedos', 20, 233, 3.8, { bold: true })
      page.text('Materiais de desenho', 110, 233, 3.8, { bold: true })
    }
  } else if (task.mode === 'match') {
    prompts.forEach((label, i) => {
      const y = 96 + i * 43
      card(page, label, 18, y, 54, 37)
      card(page, prompts[[2, 0, 3, 1][i]], 138, y, 54, 37, peach)
      page.box(77, y + 18, 3, 3, darkGreen)
      page.box(130, y + 18, 3, 3, darkGreen)
    })
  } else if (task.mode === 'names') {
    prompts.forEach((label, i) => {
      const y = 96 + i * 53
      page.box(16, y, 176, 43, i === 0 ? sage : cream, rule)
      page.text(label, 22, y + 6, 4.4, { bold: true })
      page.line(22, y + 30, 161)
    })
  } else if (task.mode === 'table' || task.mode === 'count') {
    page.box(16, 94, 178, 16, darkGreen)
    page.text(item.id === 'criar-contagem' ? 'GRUPO' : 'FRUTA', 21, 99, 3.5, {
      color: '#ffffff',
      bold: true,
    })
    page.text('GRUPO DE FIGURAS', 60, 99, 3.5, { color: '#ffffff', bold: true })
    page.text('QUANTIDADE', 161, 99, 3.5, {
      color: '#ffffff',
      bold: true,
      width: 30,
    })
    prompts.forEach((label, i) => {
      const y = 110 + i * 39
      page.box(16, y, 178, 39, i % 2 ? cream : '#ffffff', rule)
      page.text(label, 21, y + 14, 4, { bold: true })
      for (let j = 0; j < worksheetQuantity(values, i); j++)
        page.image(iconFor(label), 58 + j * 18, y + 10, 16, 16, label)
      page.box(164, y + 7, 22, 23, undefined, rule)
    })
    page.text(
      item.id === 'criar-contagem'
        ? 'Qual grupo tem mais figuras? Escreva ou desenhe.'
        : 'Onde há mais frutas? Explique com palavras ou desenho.',
      16,
      239,
      4,
      { bold: true },
    )
    page.box(16, 250, 178, 24, undefined, rule)
  } else if (task.mode === 'pattern') {
    const rows = [
      ['Maçã', 'Banana', 'Maçã', 'Banana', 'Maçã'],
      ['Pera', 'Pera', 'Maçã', 'Pera', 'Pera'],
      [],
    ]
    rows.forEach((sequence, i) => {
      const y = 98 + i * 57
      page.text(
        i === 2 ? 'Invente seu padrão' : 'Complete a fileira ' + (i + 1),
        16,
        y,
        4,
        { bold: true },
      )
      for (let j = 0; j < 6; j++) {
        const x = 16 + j * 30
        page.box(
          x,
          y + 10,
          26,
          32,
          i === 2 || !sequence[j] ? '#ffffff' : cream,
          rule,
        )
        if (sequence[j])
          page.image(iconFor(sequence[j]), x + 4, y + 17, 18, 18, sequence[j])
      }
    })
  }
  page.text('Professora Fácil · Educação Infantil', 16, 282, 3.1, {
    color: muted,
  })
  return result
}

export function noticeFields(item: ClassroomItem, values: Values) {
  return (item.fields ?? [])
    .map((field) => ({
      label: field.label,
      text: localDate(values[field.key]),
    }))
    .filter((field) => field.text?.trim())
}
export function noticeFits(item: ClassroomItem, values: Values) {
  const rows = lineWrap(values.body, 168, 4.15).length
  const top = noticeFields(item, values).length ? 72 : 50
  const room =
    (values.copies === '2' ? 130 : 264) -
    top -
    (item.id === 'passeio' ? 34 : 13)
  const limit = Math.floor(room / (4.15 * 1.55))
  return (
    rows <= limit &&
    noticeFields(item, values).every((field) => field.text.length <= 30) &&
    values.title.length <= 65 &&
    values.signature.length + values.recipient.length <= 110
  )
}

function noticeSheet(item: ClassroomItem, values: Values) {
  const result = sheet('Comunicado às famílias')
  const page = draw(result)
  const copies = values.copies === '2' ? 2 : 1
  const height = copies === 2 ? 130 : 264
  const fields = noticeFields(item, values)
  for (let i = 0; i < copies; i++) {
    const y = 12 + i * 142
    page.box(12, y, 186, height, '#ffffff', rule)
    page.box(
      12,
      y,
      186,
      33,
      i % 2 ? sage : item.id === 'passeio' ? peach : sage,
    )
    page.image(
      'recados.webp',
      164,
      y + 3,
      31,
      26,
      'Ilustração de agenda escolar',
    )
    page.text(values.school || 'COMUNICADO ESCOLAR', 20, y + 6, 3.6, {
      bold: true,
      width: 142,
    })
    page.text(values.title, 20, y + 15, 6, { bold: true, width: 142 })
    page.text(values.classroom, 20, y + 26, 3.25, { color: muted, width: 142 })
    page.text(values.recipient, 20, y + 40, 4.1, { bold: true, width: 168 })
    let nextY = y + 50
    if (fields.length) {
      const column = 171 / fields.length
      page.box(19, nextY, 172, 17, cream)
      fields.forEach((field, index) => {
        const left = 23 + column * index
        page.text(field.label.toUpperCase(), left, nextY + 3, 2.9, {
          bold: true,
          width: column - 5,
        })
        page.text(field.text, left, nextY + 9, 3.5, { width: column - 5 })
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
            Math.floor(
              (y + height - nextY - (item.id === 'passeio' ? 36 : 12)) / 6.44,
            ),
          ),
        )
    nextY = textRows(page, visible, 20, nextY, 168, 4.15)
    page.text(
      values.signature,
      20,
      Math.min(nextY + 3, y + height - (item.id === 'passeio' ? 31 : 9)),
      3.5,
      { bold: true, width: 168 },
    )
    if (item.id === 'passeio') {
      const cut = y + height - 23
      page.line(18, cut, 174, muted, true)
      page.text('AUTORIZAÇÃO PARA A SAÍDA', 21, cut + 3, 3.1, { bold: true })
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
  if (copies === 2) page.line(12, 148, 186, muted, true)
  return result
}

export const panelMetrics = {
  columns: 2,
  rows: 2,
  tileWidth: 190,
  tileHeight: 277,
  overlap: 5,
}
export const assembled = {
  width: panelMetrics.tileWidth * panelMetrics.columns - panelMetrics.overlap,
  height: panelMetrics.tileHeight * panelMetrics.rows - panelMetrics.overlap,
}
export function panelMap() {
  return Array.from({ length: 4 }, (_, i) => ({
    row: Math.floor(i / 2),
    column: i % 2,
    originX: (i % 2) * (panelMetrics.tileWidth - panelMetrics.overlap),
    originY:
      Math.floor(i / 2) * (panelMetrics.tileHeight - panelMetrics.overlap),
  }))
}
function panelGuide(item: ClassroomItem, values: Values, pages: number) {
  const guide = sheet('Guia de montagem')
  const page = draw(guide)
  heading(page, item, values, 'Guia de montagem')
  const notes = item.poster
    ? [
        'Imprima as folhas de peças em papel A4 e em escala de 100%.',
        'Recorte nas linhas tracejadas e organize as peças em uma superfície.',
        'Monte o cabeçalho no topo. Distribua os cartões abaixo conforme o mapa.',
      ]
    : [
        'Imprima as quatro folhas de arte em papel A4, orientação retrato e escala de 100%.',
        'As folhas têm sobreposição de 5 mm. Apare apenas uma borda em cada encontro.',
        'Alinhe as marcas, confira a imagem montada e fixe as folhas pelo verso.',
      ]
  textRows(page, notes, 16, 70, 180, 4)
  page.text(pages + ' folhas de arte + 1 guia', 16, 97, 4.6, { bold: true })
  if (!item.poster) {
    const scale = 0.25
    const x = 58,
      y = 113
    for (const mark of panelArtwork(values)) {
      guide.marks.push({
        ...mark,
        x: x + mark.x * scale,
        y: y + mark.y * scale,
        width: mark.width * scale,
        ...('height' in mark ? { height: mark.height * scale } : {}),
        ...(mark.kind === 'text' ? { size: mark.size * scale } : {}),
      })
    }
    page.line(
      x,
      y + (assembled.height * scale) / 2,
      assembled.width * scale,
      darkGreen,
      true,
    )
    page.box(
      x + (assembled.width * scale) / 2,
      y,
      0.25,
      assembled.height * scale,
      darkGreen,
    )
    for (const { row, column } of panelMap()) {
      const labelX = x + 4 + column * 47,
        labelY = y + 5 + row * 69
      page.box(labelX - 1, labelY - 1, 13, 6, cream)
      page.text(row + 1 + ' / ' + (column + 1), labelX, labelY, 3.3, {
        bold: true,
        width: 12,
      })
    }
    page.text('Medida montada: 37,5 × 54,9 cm', 46, 265, 4, { bold: true })
  } else {
    page.box(16, 113, 178, 29, sage, rule)
    page.text(values.title, 21, 123, 6, { bold: true, width: 166 })
    const columns = item.poster.length > 16 ? 5 : item.poster.length > 8 ? 4 : 3
    const span = 180 / columns
    item.poster.forEach((label, i) => {
      const x = 16 + (i % columns) * span,
        y = 148 + Math.floor(i / columns) * 17
      page.box(x, y, span - 3, 14, [sage, peach, cream, lavender][i % 4], rule)
      if (columns <= 4) page.image(iconFor(label), x + 2, y + 3, 8, 8, label)
      page.text(label, x + (columns <= 4 ? 12 : 2), y + 4, 2.6, {
        width: span - (columns <= 4 ? 17 : 7),
      })
    })
    page.text(
      'Cabeçalho: 18,2 × 4,2 cm · cartões: 8,8 × 4,9 cm',
      16,
      267,
      3.8,
      { bold: true, width: 180 },
    )
  }
  return guide
}

export function panelArtwork(values: Values): Mark[] {
  const source = sheet('Composição montada')
  const page = draw(source)
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
    color: muted,
  })
  return source.marks
}

function mosaic(item: ClassroomItem, values: Values) {
  const source = panelArtwork(values)
  const sheets = panelMap().map(({ row, column, originX, originY }) => {
    const page = sheet('Linha ' + (row + 1) + ' · Coluna ' + (column + 1))
    page.marks = source.map((mark) => ({
      ...mark,
      x: mark.x - originX + 10,
      y: mark.y - originY + 10,
    }))
    const overlay = draw(page)
    overlay.box(-1, -1, 212, 11, '#ffffff')
    overlay.box(-1, 287, 212, 11, '#ffffff')
    overlay.box(-1, 10, 11, 277, '#ffffff')
    overlay.box(200, 10, 11, 277, '#ffffff')
    overlay.box(10, 10, 190, 277, undefined, muted, true)
    if (column === 1) overlay.box(15, 10, 0.18, 277, muted)
    if (row === 1) overlay.line(10, 15, 190, muted, true)
    overlay.text(page.name + ' · 100% · A4', 11, 290, 3.1)
    return page
  })
  return [panelGuide(item, values, 4), ...sheets]
}
function cutoutPanel(item: ClassroomItem, values: Values) {
  const pieces = item.poster!
  const result: Sheet[] = []
  const count = 1 + Math.ceil(pieces.length / 8)
  const cover = sheet('Cabeçalho para recortar')
  const title = draw(cover)
  title.box(14, 25, 182, 42, sage, muted, true)
  title.image('paineis.webp', 18, 30, 39, 32, 'Ilustração para o cabeçalho')
  title.text(values.title, 63, 35, 7, { bold: true, width: 125 })
  title.text(values.classroom, 64, 52, 3.8, { width: 124 })
  title.text('Recorte o cabeçalho na linha tracejada.', 14, 76, 3.6)
  result.push(cover)
  for (let start = 0; start < pieces.length; start += 8) {
    const part = sheet(
      'Cartões · folha ' + (result.length + 1) + ' de ' + count,
    )
    const page = draw(part)
    page.text(part.name, 14, 12, 3.4, { bold: true })
    pieces.slice(start, start + 8).forEach((label, i) => {
      const x = 14 + (i % 2) * 94,
        y = 25 + Math.floor(i / 2) * 59
      page.box(x, y, 88, 49, [sage, peach, cream, lavender][i % 4], muted, true)
      page.image(iconFor(label), x + 6, y + 10, 24, 23, label)
      page.text(label, x + 34, y + 9, 4.2, { bold: true, width: 48 })
      if (item.id !== 'painel-rotina') page.line(x + 34, y + 32, 43)
    })
    result.push(part)
  }
  return [panelGuide(item, values, count), ...result]
}

const planLabels = ['Acolhida', 'Proposta principal', 'Fechamento']
export function planMoments(values: Values) {
  const saved = (values.conduct ?? '').split(/\r?\n/)
  return planLabels.map((label, index) => {
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

export function buildSheets(item: ClassroomItem, values: Values): Sheet[] {
  if (item.task) {
    const guide = guidePage(item, values)
    if (item.task.mode === 'experience') return [guide]
    const work = worksheet(item, values)
    return item.task.mode === 'cards' || values.guide === 'yes'
      ? [work, guide]
      : [work]
  }
  if (item.category === 'Recados') return [noticeSheet(item, values)]
  if (item.category === 'Painéis')
    return item.poster ? cutoutPanel(item, values) : mosaic(item, values)
  const pages: Sheet[] = []
  const kind =
    item.tool === 'plano-de-aula' ? 'Plano de aula' : 'Registro pedagógico'
  let page: Draw
  let y = 0
  function nextPage() {
    const result = sheet(kind + (pages.length ? ' · continuação' : ''))
    pages.push(result)
    page = draw(result)
    heading(page, item, values, kind)
    y = 66
  }
  nextPage()
  const isPlan = item.tool === 'plano-de-aula'
  if (isPlan) {
    page!.box(16, 64, 178, 13, cream, rule)
    page!.text('Duração total · ' + planMinutes(values) + ' min', 21, 68, 4.2, {
      bold: true,
    })
    y = 86
  }
  for (const field of item.fields ?? []) {
    if (isPlan && field.key === 'conduct') {
      for (const moment of planMoments(values)) {
        const rows = lineWrap(
          moment.action.trim().replace(/\s+/g, ' '),
          157,
          4.1,
        )
        const height = 18 + rows.length * 6.36
        if (y + height > 276) nextPage()
        page!.box(16, y, 178, height, sage, rule)
        page!.text(moment.label, 22, y + 5, 4.3, { bold: true, width: 115 })
        page!.text(moment.minutes + ' min', 160, y + 5, 3.9, {
          bold: true,
          width: 28,
        })
        textRows(page!, rows, 22, y + 14, 158, 4.1)
        y += height + 5
      }
      continue
    }
    const content =
      values[field.key] ||
      '______________________________________________________'
    if (y > 243) nextPage()
    page!.text(field.label, 16, y, 4.8, { bold: true, color: darkGreen })
    y += 9
    for (const row of lineWrap(content, 175, 4.1)) {
      if (y > 275) nextPage()
      if (row) page!.text(row, 16, y, 4.1, { width: 176 })
      y += 6.36
    }
    y += 9
  }
  return pages
}
