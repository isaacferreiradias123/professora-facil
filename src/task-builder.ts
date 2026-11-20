import {
  AlignmentType,
  BorderStyle,
  Document,
  HeightRule,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
  type FileChild,
} from 'docx'
import { figures } from './art-figures'
import type {
  ClassroomItem,
  TaskHeaderStyle,
  TaskLineStyle,
  TaskQuestion,
} from './classroom-catalog'
import {
  applyCase,
  assetUrl,
  draw,
  lineWrap,
  localDate,
  makeSheet,
  paper,
  resolveTheme,
  textRows,
  type Draw,
  type Sheet,
} from './sheet-core'
import type { Values } from './store'

export type TaskHeaderSettings = {
  headerStyle: TaskHeaderStyle
  subject: string
  totalValue: string
  showGrade: boolean
  uppercase: boolean
  sheetFont: 'noto' | 'andika'
  headerFigure: string
}

const defaultQuestions: TaskQuestion[] = [
  {
    id: 'q1',
    kind: 'lines',
    prompt: 'Leia a proposta com atenção e escreva sua resposta nas linhas abaixo:',
    lines: 4,
    lineStyle: 'simples',
  },
  {
    id: 'q2',
    kind: 'space',
    prompt: 'Represente sua ideia por meio de desenho ou registro livre:',
    spaceSize: 'medio',
    framed: true,
  },
]

const newQuestionId = () =>
  'q' + Math.random().toString(36).slice(2, 8)

export function defaultTaskQuestion(
  kind: TaskQuestion['kind'],
  index = 1,
): TaskQuestion {
  const id = newQuestionId()
  switch (kind) {
    case 'lines':
      return {
        id,
        kind,
        prompt: `Pergunta ${index} com resposta escrita:`,
        lines: 4,
        lineStyle: 'simples',
      }
    case 'space':
      return {
        id,
        kind,
        prompt: `Espaço ${index} para desenho, colagem ou cálculo:`,
        spaceSize: 'medio',
        framed: true,
      }
    case 'choice':
      return {
        id,
        kind,
        prompt: `Questão ${index} — assinale a alternativa correta:`,
        options: ['Primeira opção', 'Segunda opção', 'Terceira opção', 'Quarta opção'],
      }
    case 'tf':
      return {
        id,
        kind,
        prompt: `Questão ${index} — marque (V) para verdadeiro e (F) para falso:`,
        options: ['Primeira afirmação.', 'Segunda afirmação.', 'Terceira afirmação.'],
      }
    case 'match':
      return {
        id,
        kind,
        prompt: `Questão ${index} — ligue cada item ao seu par correspondente:`,
        pairs: [
          ['Elemento A', 'Correspondente 1'],
          ['Elemento B', 'Correspondente 2'],
          ['Elemento C', 'Correspondente 3'],
        ],
      }
    case 'section':
      return {
        id,
        kind,
        prompt: 'Texto de apoio ou orientação geral para as próximas questões.',
      }
  }
}

export function resolveFigureAsset(id?: string): string | undefined {
  if (!id || id === 'none') return undefined
  return figures.find((fig) => fig.id === id)?.asset
}

export function taskHeaderSettings(
  item: ClassroomItem,
  values: Values,
): TaskHeaderSettings {
  const preset = item.taskSheet
  const headerStyle = (
    ['padrao', 'ludico', 'compacto'].includes(values.headerStyle ?? '')
      ? values.headerStyle
      : preset?.headerStyle ?? 'padrao'
  ) as TaskHeaderStyle
  const sheetFont =
    values.sheetFont === 'andika' ||
    (values.sheetFont !== 'noto' && preset?.sheetFont === 'andika')
      ? 'andika'
      : 'noto'
  const uppercase =
    values.uppercase === 'yes' ||
    (values.uppercase !== 'no' && Boolean(preset?.uppercase))
  const showGrade =
    values.showGrade === 'yes' ||
    (values.showGrade !== 'no' && Boolean(preset?.showGrade))
  return {
    headerStyle,
    subject: values.subject ?? preset?.subject ?? '',
    totalValue: values.totalValue ?? preset?.totalValue ?? '10,0',
    showGrade,
    uppercase,
    sheetFont,
    headerFigure: values.headerFigure ?? '',
  }
}

export function parseTaskQuestions(
  item: ClassroomItem,
  values: Values,
): TaskQuestion[] {
  const raw = values.questions
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed
          .filter(
            (q): q is TaskQuestion =>
              Boolean(q) &&
              typeof q === 'object' &&
              typeof q.kind === 'string' &&
              typeof q.prompt === 'string',
          )
          .slice(0, 30)
          .map((q, idx) => ({
            id: typeof q.id === 'string' && q.id ? q.id : 'q' + (idx + 1),
            kind: q.kind,
            prompt: q.prompt,
            points: typeof q.points === 'string' ? q.points : undefined,
            lines:
              typeof q.lines === 'number'
                ? Math.max(1, Math.min(12, Math.trunc(q.lines)))
                : 4,
            lineStyle: (q.lineStyle === 'caligrafia'
              ? 'caligrafia'
              : 'simples') as TaskLineStyle,
            spaceSize:
              q.spaceSize === 'pequeno' || q.spaceSize === 'grande'
                ? q.spaceSize
                : 'medio',
            framed: q.framed !== false,
            options: Array.isArray(q.options)
              ? q.options.map((o) => String(o)).slice(0, 8)
              : undefined,
            pairs: Array.isArray(q.pairs)
              ? q.pairs
                  .filter((p): p is [string, string] => Array.isArray(p) && p.length >= 2)
                  .map(([a, b]) => [String(a), String(b)] as [string, string])
                  .slice(0, 6)
              : undefined,
            figure: typeof q.figure === 'string' ? q.figure : undefined,
            imageDataUrl:
              typeof q.imageDataUrl === 'string' &&
              q.imageDataUrl.startsWith('data:image/')
                ? q.imageDataUrl
                : undefined,
          }))
      }
    } catch {
      /* fallback to preset */
    }
  }
  return (item.taskSheet?.questions ?? defaultQuestions).map((q) => ({
    ...q,
    options: q.options ? [...q.options] : undefined,
    pairs: q.pairs ? q.pairs.map(([a, b]) => [a, b] as [string, string]) : undefined,
  }))
}

export function serializeTaskQuestions(questions: TaskQuestion[]) {
  return JSON.stringify(questions)
}

function spaceHeightMm(size?: TaskQuestion['spaceSize']) {
  if (size === 'pequeno') return 32
  if (size === 'grande') return 80
  return 52
}

const letterLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

function drawTaskHeader(
  page: Draw,
  item: ClassroomItem,
  values: Values,
  cfg: TaskHeaderSettings,
  theme: ReturnType<typeof resolveTheme>,
): number {
  const up = cfg.uppercase
  const c = (t: string) => applyCase(t, up)
  const title = c(values.title?.trim() || 'Atividade escolar')
  const school = c(values.school?.trim() || '')
  const teacher = c(values.teacher?.trim() || '')
  const classroom = c(values.classroom?.trim() || (item.age && item.age !== 'Fundamental I' ? item.age : ''))
  const subject = c(cfg.subject.trim())
  const date = localDate(values.date?.trim() || '')
  const logoOrFig =
    (values.logoDataUrl?.startsWith('data:image/') ? values.logoDataUrl : undefined) ??
    resolveFigureAsset(cfg.headerFigure || (cfg.headerStyle === 'ludico' ? 'oficina-sol' : ''))

  if (cfg.headerStyle === 'compacto') {
    page.box(12, 11, 186, 26, theme.headerBg, theme.rule, false, 2)
    page.box(12, 11, 2.8, 26, theme.headerBar)
    const rightSpace = logoOrFig ? 24 : cfg.showGrade ? 34 : 0
    page.text(title, 18, 14.5, 5.2, {
      bold: true,
      color: theme.ink,
      width: 174 - rightSpace,
    })
    const metaParts = [
      school,
      subject,
      classroom,
      teacher ? c('Prof.: ') + teacher : '',
      date ? c('Data: ') + date : '',
    ].filter(Boolean)
    if (metaParts.length) {
      page.text(metaParts.join(' · '), 18, 22, 3.2, {
        color: theme.muted,
        width: 174 - rightSpace,
      })
    }
    page.text(c('Aluno(a):'), 18, 29.5, 3.6, { bold: true, width: 22 })
    page.line(40, 34, cfg.showGrade ? 102 : 128, theme.rule)
    if (cfg.showGrade) {
      page.text(c(`Nota (${cfg.totalValue || '10,0'}):`), 146, 29.5, 3.3, {
        bold: true,
        color: theme.primary,
        width: 44,
      })
    }
    if (logoOrFig) {
      page.image(logoOrFig, 174, 14, 19, 19, 'Ilustração do cabeçalho')
    }
    return 43
  }

  if (cfg.headerStyle === 'ludico') {
    page.box(12, 11, 186, 44, theme.headerBg, theme.primary, false, 4)
    const artX = 166
    if (logoOrFig) {
      page.image(logoOrFig, artX, 14.5, 26, 26, 'Ilustração do cabeçalho')
    }
    const textW = logoOrFig ? 142 : 172
    if (school || subject) {
      page.text(
        [school || c('ATIVIDADE ESCOLAR'), subject].filter(Boolean).join(' · '),
        18,
        15,
        3.2,
        { bold: true, color: theme.primary, width: textW },
      )
    }
    page.text(title, 18, 21.5, 6.2, {
      bold: true,
      color: theme.ink,
      width: textW,
    })
    const subParts = [
      teacher ? c('Professora: ') + teacher : '',
      classroom ? c('Turma: ') + classroom : '',
    ].filter(Boolean)
    if (subParts.length) {
      page.text(subParts.join('   ·   '), 18, 32, 3.3, {
        color: theme.muted,
        width: textW,
      })
    }
    page.box(16, 39, 178, 12, '#FFFFFF', theme.rule, false, 2.5)
    page.text(c('Nome:'), 19, 43, 3.8, { bold: true, color: theme.primary, width: 16 })
    page.line(35, 48, 94, theme.rule)
    page.text(c('Data:'), 134, 43, 3.8, { bold: true, color: theme.primary, width: 14 })
    if (date) {
      page.text(date, 148, 43, 3.8, { width: 40 })
    } else {
      page.text('___ / ___ / _____', 148, 43, 3.6, { color: theme.muted, width: 42 })
    }
    return 62
  }

  // 'padrao' — Tabela escolar completa
  const boxH = cfg.showGrade ? 48 : 45
  page.box(12, 11, 186, boxH, '#FFFFFF', theme.primary, false, 2.5)
  page.box(12, 11, 186, 15, theme.headerBg)
  const logoSpace = logoOrFig ? 20 : 0
  if (logoOrFig) {
    page.image(logoOrFig, 15, 12.5, 12, 12, 'Logotipo ou figura')
  }
  const topX = 16 + logoSpace
  const gradeW = cfg.showGrade ? 34 : 0
  page.text(school || c('ATIVIDADE ESCOLAR'), topX, 13.5, 3.2, {
    bold: true,
    color: theme.primary,
    width: 176 - logoSpace - gradeW,
  })
  page.text(title, topX, 18.5, 5.2, {
    bold: true,
    color: theme.ink,
    width: 176 - logoSpace - gradeW,
  })
  if (cfg.showGrade) {
    page.box(162, 12.5, 33, 12, '#FFFFFF', theme.primary, false, 2)
    page.text(c('VALOR / NOTA'), 163.5, 13.8, 2.5, {
      bold: true,
      color: theme.primary,
      width: 30,
      align: 'center',
    })
    page.text(c(`${cfg.totalValue || '10,0'}  |  _____`), 163.5, 18.5, 3.2, {
      width: 30,
      align: 'center',
    })
  }
  page.line(12, 26, 186, theme.rule)
  page.text(c('Professora: ') + (teacher || '__________________________'), 16, 28.8, 3.6, {
    width: 96,
  })
  page.text(c('Turma: ') + (classroom || '____________'), 115, 28.8, 3.6, {
    width: 40,
  })
  page.text(c('Data: ') + (date || '___/___/____'), 156, 28.8, 3.6, {
    width: 39,
  })
  page.line(12, 36.5, 186, theme.rule)
  page.text(c('Aluno(a):'), 16, 39.5, 3.8, { bold: true, width: 20 })
  page.line(36, 44.5, 86, theme.rule)
  page.text(c('Matéria: ') + (subject || '__________________'), 126, 39.5, 3.6, {
    bold: Boolean(subject),
    color: subject ? theme.primary : theme.ink,
    width: 69,
  })
  return 11 + boxH + 8
}

function measureQuestionHeight(
  q: TaskQuestion,
  up: boolean,
  andika = false,
): number {
  const c = (t: string) => applyCase(t, up)
  const hasImg = Boolean(q.imageDataUrl || resolveFigureAsset(q.figure))
  const textW = hasImg ? 144 : 182
  const promptW = textW * (up ? 0.84 : 0.94) * (andika ? 0.95 : 1)
  const promptRows = lineWrap(c(q.prompt || ' '), promptW, 4)

  if (q.kind === 'section') {
    const textH = promptRows.length * 6.2 + 8
    return Math.max(textH, hasImg ? 32 : 18) + 6
  }

  let bodyH = 0
  if (q.kind === 'lines') {
    const count = Math.max(1, Math.min(12, q.lines ?? 4))
    bodyH = count * (q.lineStyle === 'caligrafia' ? 12 : 8.2) + 2
  } else if (q.kind === 'space') {
    bodyH = spaceHeightMm(q.spaceSize) + 3
  } else if (q.kind === 'choice' || q.kind === 'tf') {
    const opts = q.options ?? []
    bodyH = opts.reduce((sum, opt) => {
      const wrapped = lineWrap(c(opt), 166 * (up ? 0.86 : 0.96), 3.8)
      return sum + Math.max(1, wrapped.length) * 6.2 + 1.5
    }, 2)
  } else if (q.kind === 'match') {
    const pairs = q.pairs ?? []
    bodyH = pairs.length * 14 + 2
  }

  const headerH = Math.max(promptRows.length * 6.2 + 2, hasImg ? 30 : 0)
  return headerH + bodyH + 7
}

export function buildTaskSheets(item: ClassroomItem, values: Values): Sheet[] {
  const theme = resolveTheme(item, values)
  const cfg = taskHeaderSettings(item, values)
  const up = cfg.uppercase
  const andika = cfg.sheetFont === 'andika'
  const c = (t: string) => applyCase(t, up)
  const questions = parseTaskQuestions(item, values)
  const sheets: Sheet[] = []
  let currentPage: Draw
  let y = 0

  function openSheet(continuation: boolean) {
    const title = continuation
      ? `Folha da tarefa · folha ${sheets.length + 1}`
      : 'Folha da tarefa'
    const s = makeSheet(title, paper, cfg.sheetFont)
    sheets.push(s)
    currentPage = draw(s, theme.ink, theme.rule)
    if (!continuation) {
      y = drawTaskHeader(currentPage, item, values, cfg, theme)
    } else {
      currentPage.box(12, 11, 186, 13, theme.headerBg, theme.rule, false, 2)
      currentPage.text(
        c((values.title?.trim() || 'Atividade escolar') + ' · continuação'),
        17,
        15,
        4.1,
        { bold: true, color: theme.primary, width: 118 },
      )
      currentPage.text(c('Nome: _________________________'), 137, 15, 3.5, {
        width: 56,
      })
      y = 30
    }
  }

  openSheet(false)
  let qNum = 0

  for (const q of questions) {
    const blockH = measureQuestionHeight(q, up, andika)
    const minY = sheets.length === 1 ? 68 : 34
    if (y > minY && y + blockH > 274) {
      openSheet(true)
    }

    const imgAsset = q.imageDataUrl ?? resolveFigureAsset(q.figure)
    const textW = imgAsset ? 146 : 182
    const promptW = textW * (up ? 0.84 : 0.94) * (andika ? 0.95 : 1)

    if (q.kind === 'section') {
      const secW = (imgAsset ? 140 : 174) * (up ? 0.86 : 0.95)
      const promptRows = lineWrap(c(q.prompt), secW, 3.9)
      const cardH = Math.max(promptRows.length * 6.1 + 7, imgAsset ? 30 : 16)
      currentPage!.box(14, y, 182, cardH, theme.cardB, theme.rule, false, 2.5)
      if (imgAsset) {
        currentPage!.image(imgAsset, 166, y + 3, 24, 24, 'Ilustração do texto')
      }
      textRows(currentPage!, promptRows, 19, y + 4, imgAsset ? 142 : 172, 3.9)
      y += cardH + 6
      continue
    }

    qNum += 1
    const prefix = `${qNum}) `
    const suffix = q.points?.trim() ? ` (${c(q.points.trim())})` : ''
    const fullPrompt = prefix + c(q.prompt || 'Responda:') + suffix
    const promptRows = lineWrap(fullPrompt, promptW, 4)

    if (imgAsset) {
      currentPage!.image(imgAsset, 168, y, 26, 26, `Ilustração da questão ${qNum}`)
    }
    const afterPromptY = textRows(
      currentPage!,
      promptRows,
      14,
      y,
      textW,
      4,
      theme.ink,
      true,
    )
    y = Math.max(afterPromptY + 1.5, imgAsset ? y + 27 : afterPromptY + 1.5)

    if (q.kind === 'lines') {
      const count = Math.max(1, Math.min(12, q.lines ?? 4))
      if (q.lineStyle === 'caligrafia') {
        for (let i = 0; i < count; i++) {
          currentPage!.line(14, y + 2, 182, theme.rule)
          currentPage!.line(14, y + 5.5, 182, theme.muted, true)
          currentPage!.line(14, y + 9, 182, theme.ink)
          y += 12
        }
      } else {
        for (let i = 0; i < count; i++) {
          currentPage!.line(14, y + 5.5, 182, theme.rule)
          y += 8.2
        }
      }
      y += 4
    } else if (q.kind === 'space') {
      const boxH = spaceHeightMm(q.spaceSize)
      currentPage!.box(
        14,
        y,
        182,
        boxH,
        '#FFFFFF',
        q.framed === false ? undefined : theme.rule,
        true,
        3,
      )
      y += boxH + 6
    } else if (q.kind === 'choice' || q.kind === 'tf') {
      const opts = q.options ?? []
      const optW = 174 * (up ? 0.86 : 0.96) * (andika ? 0.95 : 1)
      opts.forEach((opt, i) => {
        const marker =
          q.kind === 'choice' ? `(  ) ${letterLabels[i] ?? i + 1}) ` : '(   ) '
        const rows = lineWrap(marker + c(opt), optW, 3.85)
        y = textRows(currentPage!, rows, 18, y, 174, 3.85) + 1.2
      })
      y += 4
    } else if (q.kind === 'match') {
      const pairs = q.pairs ?? []
      pairs.forEach(([left, right], i) => {
        const rowY = y + i * 14
        currentPage!.box(16, rowY, 64, 11, theme.cardB, theme.rule, false, 2)
        currentPage!.text(c(left), 19, rowY + 3.2, 3.6, { width: 58 })
        currentPage!.box(85, rowY + 4, 3, 3, theme.primary)
        currentPage!.box(122, rowY + 4, 3, 3, theme.primary)
        currentPage!.box(130, rowY, 64, 11, theme.cardA, theme.rule, false, 2)
        currentPage!.text(c(right), 133, rowY + 3.2, 3.6, { width: 58 })
      })
      y += pairs.length * 14 + 5
    }
  }

  sheets.forEach((s, idx) => {
    draw(s, theme.ink, theme.rule).text(
      `Professora Fácil · Folha ${idx + 1} de ${sheets.length}`,
      14,
      283,
      3.1,
      { color: theme.muted, width: 182 },
    )
  })

  return sheets
}

async function toPngBytes(src: string): Promise<Uint8Array> {
  if (src.startsWith('data:image/png')) {
    const res = await fetch(src)
    return new Uint8Array(await res.arrayBuffer())
  }
  const url = assetUrl(src)
  if (url.endsWith('.png')) {
    const res = await fetch(url)
    if (res.ok) return new Uint8Array(await res.arrayBuffer())
  }
  const img = new Image()
  img.src = url
  await img.decode()
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth || 160
  canvas.height = img.naturalHeight || 160
  try {
    canvas.getContext('2d')!.drawImage(img, 0, 0)
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((v) => (v ? resolve(v) : reject(new Error())), 'image/png'),
    )
    return new Uint8Array(await blob.arrayBuffer())
  } finally {
    canvas.width = 0
  }
}

export async function buildTaskWord(item: ClassroomItem, values: Values) {
  const theme = resolveTheme(item, values)
  const cfg = taskHeaderSettings(item, values)
  const up = cfg.uppercase
  const c = (t: string) => applyCase(t, up)
  const accent = theme.primary.slice(1).toUpperCase()
  const headerFill = theme.headerBg.slice(1).toUpperCase()
  const cardFill = theme.cardB.slice(1).toUpperCase()
  const ruleHex = theme.rule.slice(1).toUpperCase()
  const border = { style: BorderStyle.SINGLE, size: 4, color: ruleHex }
  const docFont = cfg.sheetFont === 'andika' ? 'Andika' : 'Calibri'

  const txt = (
    text: string,
    opts: { bold?: boolean; size?: number; color?: string; after?: number } = {},
  ) =>
    new Paragraph({
      spacing: { after: opts.after ?? 90 },
      children: [
        new TextRun({
          text,
          bold: opts.bold,
          size: opts.size ?? 22,
          color: opts.color ?? '182620',
          font: docFont,
        }),
      ],
    })

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: border,
      bottom: border,
      left: border,
      right: border,
      insideHorizontal: border,
      insideVertical: border,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            shading: { fill: headerFill },
            margins: { top: 100, bottom: 100, left: 130, right: 130 },
            children: [
              txt(c(values.school?.trim() || 'ATIVIDADE ESCOLAR'), {
                bold: true,
                size: 18,
                color: accent,
                after: 25,
              }),
              txt(c(values.title?.trim() || 'Atividade'), {
                bold: true,
                size: 28,
                color: accent,
                after: 20,
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            margins: { top: 70, bottom: 70, left: 130, right: 100 },
            children: [
              txt(c('Professora: ') + c(values.teacher?.trim() || '______________________'), {
                size: 20,
                after: 15,
              }),
            ],
          }),
          new TableCell({
            margins: { top: 70, bottom: 70, left: 100, right: 130 },
            children: [
              txt(
                c('Turma: ') +
                  c(values.classroom?.trim() || '________') +
                  '   ' +
                  c('Data: ') +
                  (localDate(values.date?.trim() || '') || '___/___/____'),
                { size: 20, after: 15 },
              ),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            margins: { top: 70, bottom: 70, left: 130, right: 100 },
            children: [
              txt(c('Aluno(a): ') + '________________________________________', {
                size: 20,
                after: 15,
              }),
            ],
          }),
          new TableCell({
            margins: { top: 70, bottom: 70, left: 100, right: 130 },
            children: [
              txt(
                c('Matéria: ') +
                  c(cfg.subject.trim() || '______________') +
                  (cfg.showGrade ? `   |   ${c('Nota:')} ____/${cfg.totalValue || '10,0'}` : ''),
                { size: 20, after: 15 },
              ),
            ],
          }),
        ],
      }),
    ],
  })

  const children: FileChild[] = [headerTable, txt('', { after: 80 })]
  const questions = parseTaskQuestions(item, values)
  let qNum = 0

  for (const q of questions) {
    const imgSrc = q.imageDataUrl ?? resolveFigureAsset(q.figure)
    let imgData: Uint8Array | undefined
    if (imgSrc) {
      try {
        imgData = await toPngBytes(imgSrc)
      } catch {
        imgData = undefined
      }
    }

    if (q.kind === 'section') {
      const cellChildren: (Paragraph | Table)[] = [
        txt(c(q.prompt), { size: 21, after: imgData ? 50 : 20 }),
      ]
      if (imgData) {
        cellChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 30 },
            children: [
              new ImageRun({
                type: 'png',
                data: imgData,
                transformation: { width: 100, height: 100 },
              }),
            ],
          }),
        )
      }
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: border,
            bottom: border,
            left: border,
            right: border,
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: cardFill },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: cellChildren,
                }),
              ],
            }),
          ],
        }),
        txt('', { after: 60 }),
      )
      continue
    }

    qNum += 1
    const suffix = q.points?.trim() ? ` (${c(q.points.trim())})` : ''
    children.push(
      txt(`${qNum}) ${c(q.prompt || 'Responda:')}${suffix}`, {
        bold: true,
        size: 23,
        after: 70,
      }),
    )

    if (imgData) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 90 },
          children: [
            new ImageRun({
              type: 'png',
              data: imgData,
              transformation: { width: 110, height: 110 },
            }),
          ],
        }),
      )
    }

    if (q.kind === 'lines') {
      const count = Math.max(1, Math.min(12, q.lines ?? 4))
      for (let i = 0; i < count; i++) {
        children.push(
          txt('___________________________________________________________________________', {
            color: ruleHex,
            after: 110,
          }),
        )
      }
    } else if (q.kind === 'space') {
      const twips = q.spaceSize === 'pequeno' ? 1800 : q.spaceSize === 'grande' ? 4500 : 2900
      const noBorder = { style: BorderStyle.NONE }
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders:
            q.framed === false
              ? {
                  top: noBorder,
                  bottom: noBorder,
                  left: noBorder,
                  right: noBorder,
                }
              : {
                  top: border,
                  bottom: border,
                  left: border,
                  right: border,
                },
          rows: [
            new TableRow({
              cantSplit: true,
              height: { value: twips, rule: HeightRule.ATLEAST },
              children: [new TableCell({ children: [txt('')] })],
            }),
          ],
        }),
        txt('', { after: 80 }),
      )
    } else if (q.kind === 'choice' || q.kind === 'tf') {
      ;(q.options ?? []).forEach((opt, idx) => {
        const mark =
          q.kind === 'choice' ? `(  ) ${letterLabels[idx] ?? idx + 1}) ` : '(   ) '
        children.push(txt(mark + c(opt), { size: 21, after: 65 }))
      })
    } else if (q.kind === 'match') {
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.FIXED,
          columnWidths: [4200, 1800, 4200],
          rows: (q.pairs ?? []).map(
            ([left, right]) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    shading: { fill: cardFill },
                    margins: { top: 80, bottom: 80, left: 110, right: 110 },
                    children: [txt(c(left), { size: 21, after: 15 })],
                  }),
                  new TableCell({
                    children: [txt('•       •', { after: 15 })],
                  }),
                  new TableCell({
                    shading: { fill: headerFill },
                    margins: { top: 80, bottom: 80, left: 110, right: 110 },
                    children: [txt(c(right), { size: 21, after: 15 })],
                  }),
                ],
              }),
          ),
        }),
        txt('', { after: 70 }),
      )
    }
    children.push(txt('', { after: 60 }))
  }

  return Packer.toBlob(
    new Document({
      title: values.title,
      styles: {
        default: { document: { run: { font: docFont, size: 22 } } },
      },
      sections: [
        {
          properties: {
            page: {
              size: { width: 11906, height: 16838 },
              margin: { left: 720, right: 720, top: 700, bottom: 700 },
            },
          },
          children,
        },
      ],
    }),
  )
}
