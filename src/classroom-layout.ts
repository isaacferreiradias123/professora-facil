import type { ClassroomItem } from './classroom-catalog'
import { ageGuides } from './classroom-catalog'
import { panelGeometry, panelLabelLimit } from './panel-geometry'
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
export type Sheet = { name: string; marks: Mark[]; size?: typeof paper }
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
  const capacity = Math.max(1, Math.floor(width / (size * 0.55)))
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
  'Flor do dia': 'il-flower.png',
  Maçã: 'il-fruit-apple.png',
  Banana: 'il-fruit-banana.png',
  Pera: 'il-fruit-pear.png',
  Morango: 'il-fruit-berry.png',
  Bola: 'il-ball.png',
  Livro: 'il-book.png',
  Copo: 'il-cup.png',
  Pano: 'il-cloth.png',
  Gato: 'il-cat.png',
  Pato: 'il-duck.png',
  Cão: 'il-dog.png',
  Pássaro: 'il-bird.png',
  Chegada: 'il-door.png',
  Roda: 'il-circle.png',
  Lanche: 'il-fruit-apple.png',
  Brincadeira: 'il-ball.png',
  História: 'il-story.png',
  Higiene: 'il-cup.png',
  Descanso: 'il-moon.png',
  Despedida: 'il-door.png',
  Lápis: 'il-pencil.png',
  Blocos: 'il-blocks.png',
  Pincel: 'il-brush.png',
  Sol: 'oficina-sol.png',
  Ovo: 'oficina-ovo.png',
  Lagarta: 'oficina-lagarta.png',
  Crisálida: 'oficina-crisalida.png',
  Borboleta: 'oficina-borboleta.png',
  Círculo: 'figura-circulo.svg',
  Triângulo: 'figura-triangulo.svg',
  'Broto apareceu': 'il-sprout.png',
  'Semente na terra': 'il-seed.png',
  'Regamos a terra': 'il-watering.png',
  'Colher a fruta': 'il-fruit-pear.png',
  'Plantar a semente': 'il-seed.png',
  'Servir à mesa': 'il-plate.png',
  'Lavar a fruta': 'il-watering.png',
  Gatos: 'il-cat.png',
  Patos: 'il-duck.png',
  Cães: 'il-dog.png',
  Livros: 'il-book.png',
  Pincéis: 'il-brush.png',
  Maçãs: 'il-fruit-apple.png',
  Bananas: 'il-fruit-banana.png',
  Peras: 'il-fruit-pear.png',
}
export function worksheetGroups(item: ClassroomItem, values: Values) {
  if (item.id === 'criar-pares') {
    if (values.group === 'animals') return ['Gato', 'Pato', 'Cão', 'Pássaro']
    if (values.group === 'school') return ['Lápis', 'Livro', 'Pincel', 'Blocos']
  }
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
  const command = item.id.startsWith('ficha-oficina-')
    ? item.description
    : item.id === 'criar-contagem'
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
  if (task.mode === 'answer') {
    const images = task.illustrations ?? []
    images.forEach((label, i) => {
      const x = (210 - 48 * images.length) / 2 + i * 48
      page.image(iconFor(label), x + 5, 91, 38, 38, label)
    })
    const top = 137
    const block = 138 / prompts.length
    prompts.forEach((label, i) => {
      const y = top + i * block
      page.text(label, 18, y, 4.4, { bold: true, width: 171 })
      page.box(17, y + 9, 177, block - 13, '#ffffff', rule)
    })
  } else if (
    task.mode === 'cards' ||
    task.mode === 'story' ||
    task.mode === 'sort'
  ) {
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
      const drawNext = item.id === 'sequencia-do-jardim'
      page.text('Minha ordem:', 16, 224, 4, { bold: true })
      for (let i = 0; i < prompts.length; i++)
        page.box(16 + i * 44, 234, 35, drawNext ? 13 : 22, undefined, rule)
      if (drawNext) {
        page.text('Desenhe o que pode acontecer depois.', 16, 251, 3.9, {
          bold: true,
        })
        page.box(16, 259, 177, 17, undefined, rule)
      }
    }
    if (task.mode === 'sort') {
      page.text('Desenhe ou cole um exemplo em cada espaço.', 16, 219, 3.8)
      page.box(16, 229, 85, 45, undefined, rule)
      page.box(106, 229, 85, 45, undefined, rule)
      page.text(task.sortLabels?.[0] ?? 'Brinquedos', 20, 233, 3.8, {
        bold: true,
      })
      page.text(task.sortLabels?.[1] ?? 'Materiais de desenho', 110, 233, 3.8, {
        bold: true,
      })
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
    page.text(task.mode === 'count' ? 'GRUPO' : 'FRUTA', 21, 99, 3.5, {
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
      item.id === 'ficha-oficina-17'
        ? 'Desenhe o que falta para chegar a dez em um grupo.'
        : task.mode === 'count'
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
  return (item.fields ?? []).map((field) => ({
    label: field.label,
    text: localDate(values[field.key]),
  }))
}
export function hasAuthorization(item: ClassroomItem) {
  return item.detachable || item.id === 'passeio'
}
export function noticeFits(item: ClassroomItem, values: Values) {
  const rows = lineWrap(values.body, 168, 4.15).length
  const top = noticeFields(item, values).length ? 72 : 50
  const room =
    (values.copies === '2' ? 130 : 264) -
    top -
    (hasAuthorization(item) ? 34 : 13)
  const limit = Math.floor(room / (4.15 * 1.55))
  return (
    rows <= limit &&
    noticeFields(item, values).every((field) => field.text.length <= 30) &&
    values.title.length <= 65 &&
    values.signature.length + values.recipient.length <= 110
  )
}

const noticeArt: Record<string, { asset: string; color: string }> = {
  reuniao: { asset: 'bilhete-reuniao.webp', color: sage },
  passeio: { asset: 'bilhete-passeio.webp', color: peach },
  materiais: { asset: 'bilhete-materiais.webp', color: lavender },
  evento: { asset: 'bilhete-evento.webp', color: cream },
}
const noticeThemes: Record<string, keyof typeof noticeArt> = {
  'devolucao-livro': 'materiais',
  'rodizio-brinquedos': 'materiais',
  'entrada-alternativa': 'passeio',
  'encontro-de-leitura': 'evento',
  'troca-identificada': 'materiais',
  'participacao-oficina': 'evento',
  'horario-mostra': 'evento',
  'objetos-perdidos': 'materiais',
  'passeio-alterado': 'passeio',
}
export function noticeVisual(item: ClassroomItem) {
  return (
    noticeArt[item.id] ?? noticeArt[noticeThemes[item.id]] ?? noticeArt.reuniao
  )
}

function noticeSheet(item: ClassroomItem, values: Values) {
  const result = sheet('Comunicado às famílias')
  const page = draw(result)
  const copies = values.copies === '2' ? 2 : 1
  const height = copies === 2 ? 130 : 264
  const fields = noticeFields(item, values)
  const visual = noticeVisual(item)
  for (let i = 0; i < copies; i++) {
    const y = 12 + i * 142
    page.box(12, y, 186, height, '#ffffff', rule)
    page.box(12, y, 186, 33, visual.color)
    page.image(visual.asset, 158, y + 4, 35, 23.33, 'Ilustração do recado')
    page.text(values.school || 'COMUNICADO ESCOLAR', 20, y + 6, 3.6, {
      bold: true,
      width: 133,
    })
    page.text(values.title, 20, y + 15, 6, { bold: true, width: 133 })
    page.text(values.classroom, 20, y + 26, 3.25, { color: muted, width: 133 })
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
        if (field.text.trim())
          page.text(field.text, left, nextY + 9, 3.5, { width: column - 5 })
        else page.line(left, nextY + 13, column - 9, muted)
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
              (y + height - nextY - (hasAuthorization(item) ? 36 : 12)) / 6.44,
            ),
          ),
        )
    nextY = textRows(page, visible, 20, nextY, 168, 4.15)
    page.text(
      values.signature,
      20,
      Math.min(nextY + 3, y + height - (hasAuthorization(item) ? 31 : 9)),
      3.5,
      { bold: true, width: 168 },
    )
    if (hasAuthorization(item)) {
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
  const guide = sheet('Guia de montagem')
  const page = draw(guide)
  heading(page, item, values, 'Guia de montagem')
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
  textRows(page, notes, 16, 70, 180, 4)
  page.text(pages + ' folhas de arte + 1 guia', 16, 97, 4.6, { bold: true })
  if (!item.poster) {
    const { assembled, tiles, stepX, stepY, rows, columns } = geometry
    const scale = Math.min(165 / assembled.width, 138 / assembled.height)
    const x = (210 - assembled.width * scale) / 2
    const y = 113
    for (const mark of panelArtwork(values, item)) {
      guide.marks.push({
        ...mark,
        x: x + mark.x * scale,
        y: y + mark.y * scale,
        width: mark.width * scale,
        ...('height' in mark ? { height: mark.height * scale } : {}),
        ...(mark.kind === 'text' ? { size: mark.size * scale } : {}),
      })
    }
    for (let row = 1; row < rows; row++)
      page.line(
        x,
        y + row * stepY * scale,
        assembled.width * scale,
        darkGreen,
        true,
      )
    for (let column = 1; column < columns; column++)
      page.box(
        x + column * stepX * scale,
        y,
        0.25,
        assembled.height * scale,
        darkGreen,
      )
    for (const { row, column, originX, originY } of tiles) {
      const labelX = x + 4 + originX * scale
      const labelY = y + 5 + originY * scale
      page.box(labelX - 1, labelY - 1, 13, 6, cream)
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
    page.box(16, 113, 178, 29, sage, rule)
    page.text(values.title, 21, 123, 6, { bold: true, width: 166 })
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
    pieces.forEach((label, i) => {
      const x = 16 + (i % columns) * span,
        y = 148 + Math.floor(i / columns) * 17
      page.box(x, y, span - 3, 14, [sage, peach, cream, lavender][i % 4], rule)
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
  const source = sheet('Composição montada')
  const page = draw(source)
  if (item?.panel) {
    const { width, height } = mosaicGeometry(item).assembled
    const { layout, art } = item.panel
    const labels = (
      values.panelPieces?.trim()
        ? panelPieces(item, values)
        : (item.mosaicLabels ?? [])
    ).slice(0, panelLabelLimit(item.panel))
    const top = layout === 'banner' ? 26 : 18
    const band = layout === 'banner' ? 105 : 76
    const palette = [sage, '#e1ecf5', '#fff1bf', peach]
    page.box(0, 0, width, height, cream)
    page.box(
      16,
      top,
      width - 32,
      band,
      palette[layout === 'timeline' ? 1 : layout === 'banner' ? 2 : 0],
    )
    if (art === 'oficina-ilustrada.png')
      page.image(art, width - 164, top + 23, 140, 44, 'Enfeites de papel e sol')
    else
      page.image(
        art,
        width - 93,
        top + 5,
        68,
        band - 10,
        'Ilustração do painel',
      )
    page.text(values.title, 31, top + 15, layout === 'banner' ? 29 : 24, {
      bold: true,
      width: width - (layout === 'banner' ? 193 : 137),
    })
    page.text(values.classroom || item.description, 33, top + band - 25, 11, {
      width: width - (layout === 'banner' ? 193 : 142),
    })
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
      page.box(x, y, cellWidth, cellHeight, '#ffffff', rule)
      page.box(x, y, cellWidth, 29, palette[index % palette.length])
      page.text(
        (layout === 'timeline' ? index + 1 + ' · ' : '') + label,
        x + 8,
        y + 8,
        13,
        { bold: true, width: cellWidth - 16 },
      )
      if (layout === 'chart') {
        for (let line = y + 49; line < y + cellHeight - 13; line += 22)
          page.line(x + 10, line, cellWidth - 20)
      } else if (layout === 'gallery' || !picture[label]) {
        page.box(
          x + 10,
          y + 41,
          cellWidth - 20,
          cellHeight - 61,
          undefined,
          rule,
          true,
        )
      } else {
        page.image(
          picture[label],
          x + (cellWidth - 45) / 2,
          y + 37,
          45,
          45,
          label,
        )
        page.line(x + 14, y + cellHeight - 22, cellWidth - 28)
      }
    })
    return source.marks
  }
  if (item?.mosaicLabels) {
    page.box(0, 0, assembled.width, assembled.height, cream)
    page.box(18, 20, 339, 98, sage)
    page.text(values.title, 32, 34, 24, { bold: true, width: 310 })
    page.text(values.classroom || item.description, 34, 81, 9.4, { width: 303 })
    item.mosaicLabels.forEach((label, index) => {
      const x = 22 + (index % 2) * 168
      const y = 133 + Math.floor(index / 2) * 192
      page.box(x, y, 161, 173, '#ffffff', rule)
      page.box(x, y, 161, 36, [sage, peach, lavender, cream][index])
      page.text(label, x + 10, y + 11, 12, { width: 143, bold: true })
      for (let i = 0; i < 4; i++) page.line(x + 14, y + 66 + i * 24, 132)
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
    color: muted,
  })
  return source.marks
}

function mosaic(item: ClassroomItem, values: Values) {
  const source = panelArtwork(values, item)
  const { paper, tiles, margin, tileWidth, tileHeight, overlap } =
    mosaicGeometry(item)
  const sheets = tiles.map(({ row, column, originX, originY }) => {
    const page = sheet('Linha ' + (row + 1) + ' · Coluna ' + (column + 1))
    page.size = paper
    page.marks = source.map((mark) => ({
      ...mark,
      x: mark.x - originX + margin,
      y: mark.y - originY + margin,
    }))
    const overlay = draw(page)
    overlay.box(-1, -1, paper.width + 2, margin + 1, '#ffffff')
    overlay.box(
      -1,
      paper.height - margin,
      paper.width + 2,
      margin + 1,
      '#ffffff',
    )
    overlay.box(-1, margin, margin + 1, tileHeight, '#ffffff')
    overlay.box(paper.width - margin, margin, margin + 1, tileHeight, '#ffffff')
    overlay.box(margin, margin, tileWidth, tileHeight, undefined, muted, true)
    if (column > 0)
      overlay.box(margin + overlap, margin, 0.18, tileHeight, muted)
    if (row > 0) overlay.line(margin, margin + overlap, tileWidth, muted, true)
    overlay.text(page.name + ' · 100% · A4', 11, paper.height - 7, 3.1)
    return page
  })
  return [panelGuide(item, values, sheets.length), ...sheets]
}
function cutoutPanel(item: ClassroomItem, values: Values) {
  const pieces = panelPieces(item, values)
  const result: Sheet[] = []
  const grid = kitGrid(item)
  const capacity = grid.columns * grid.rows
  const count = kitSheetCount(item, values) - 1
  const cover = sheet('Cabeçalho para recortar')
  const title = draw(cover)
  title.box(14, 25, 182, 42, sage, muted, true)
  title.image('paineis.webp', 18, 30, 39, 32, 'Ilustração para o cabeçalho')
  title.text(values.title, 63, 35, 7, { bold: true, width: 125 })
  title.text(values.classroom, 64, 52, 3.8, { width: 124 })
  title.text('Recorte o cabeçalho na linha tracejada.', 14, 76, 3.6)
  result.push(cover)
  for (let start = 0; start < pieces.length; start += capacity) {
    const part = sheet(
      'Cartões · folha ' + (result.length + 1) + ' de ' + count,
    )
    const page = draw(part)
    page.text(part.name, 14, 12, 3.4, { bold: true })
    pieces.slice(start, start + capacity).forEach((label, i) => {
      const x = 14 + (i % grid.columns) * 94,
        y = 25 + Math.floor(i / grid.columns) * grid.gapY
      page.box(
        x,
        y,
        grid.width,
        grid.height,
        [sage, peach, cream, lavender][i % 4],
        muted,
        true,
      )
      const art = picture[label]
      if (art) page.image(art, x + 6, y + 10, 23, 23, label)
      const textInset = art ? 34 : 7
      page.text(label, x + textInset, y + 9, 4.2, {
        bold: true,
        width: grid.width - textInset - 7,
      })
      if (item.id !== 'painel-rotina')
        page.line(
          x + textInset,
          y + grid.height - 12,
          grid.width - textInset - 11,
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
  if (item.form === 'ficha') return ['Responsável pelo preenchimento']
  if (item.form === 'declaracao')
    return ['Responsável e identificação da escola']
  return item.tool === 'relatorio' ? ['Responsável pelo registro'] : []
}
export function documentKind(item: ClassroomItem) {
  if (item.form === 'ata') return 'Ata escolar'
  if (item.form === 'ficha') return 'Ficha escolar'
  if (item.form === 'declaracao') return 'Declaração escolar'
  if (item.form === 'entrega') return 'Registro de entrega'
  return item.tool === 'plano-de-aula' ? 'Plano de aula' : 'Registro pedagógico'
}

export function buildSheets(item: ClassroomItem, values: Values): Sheet[] {
  if (item.task) {
    if (item.task.mode === 'experience') return [guidePage(item, values)]
    const work = worksheet(item, values)
    return item.task.mode === 'cards' || values.guide === 'yes'
      ? [work, guidePage(item, values)]
      : [work]
  }
  if (item.category === 'Recados') return [noticeSheet(item, values)]
  if (item.category === 'Painéis')
    return item.poster ? cutoutPanel(item, values) : mosaic(item, values)
  const pages: Sheet[] = []
  const kind = documentKind(item)
  const structured = item.form || item.tool === 'relatorio'
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
  const details = documentDetails(item, values)
  for (let start = 0; start < details.length; start += 2) {
    const row = details.slice(start, start + 2)
    const width = 178 / row.length
    row.forEach((field, index) => {
      const x = 16 + width * index
      page!.box(x, y, width, 20, cream, rule)
      page!.text(field.label, x + 5, y + 4, 3.1, {
        bold: true,
        width: width - 10,
      })
      page!.text(field.text, x + 5, y + 11, 4, { width: width - 10 })
    })
    y += 22
  }
  if (details.length) y += 5
  for (const field of item.fields ?? []) {
    if (structured && field.type !== 'long') continue
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
    const content = values[field.key]?.trim()
    if (y > 243) nextPage()
    if (structured) page!.box(16, y - 2, 178, 10, sage)
    page!.text(field.label, structured ? 20 : 16, y, 4.5, {
      bold: true,
      color: darkGreen,
    })
    y += 11
    if (!content && structured) {
      for (let line = 0; line < 2; line++) {
        if (y > 272) nextPage()
        page!.line(16, y + 5, 176, rule)
        y += 6
      }
    } else {
      for (const row of lineWrap(
        content || '________________________________________',
        175,
        4.1,
      )) {
        if (y > 275) nextPage()
        if (row) page!.text(row, 16, y, 4.1, { width: 176 })
        y += 6.36
      }
    }
    y += structured ? 6 : 9
  }
  const signatures = documentSignatures(item)
  if (signatures.length) {
    if (y > 248) nextPage()
    const span = 178 / signatures.length
    signatures.forEach((label, index) => {
      const x = 16 + span * index
      page!.line(x, y + 11, span - 12)
      page!.text(label, x, y + 14, 3.3, { width: span - 12 })
    })
  }
  return pages
}
