import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import { imageBytes } from './classroom-export'
import { ageGuides, type ClassroomItem } from './classroom-catalog'
import { noticeFields, buildSheets, type Mark } from './classroom-layout'
import type { Values } from './store'

type Child = Paragraph | Table
const accent = '254C40'
function text(
  value: string,
  options: {
    bold?: boolean
    size?: number
    color?: string
    after?: number
  } = {},
) {
  return new Paragraph({
    spacing: { after: options.after ?? 115 },
    children: [
      new TextRun({
        text: value,
        bold: options.bold,
        size: options.size,
        color: options.color,
      }),
    ],
  })
}
function heading(value: string, breakBefore = false) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: breakBefore,
    keepNext: true,
    spacing: { after: 130 },
    children: [new TextRun({ text: value, color: accent, bold: true })],
  })
}
function box(content: Paragraph[], fill: string) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            shading: { fill },
            margins: { top: 110, bottom: 110, left: 180, right: 180 },
            children: content,
          }),
        ],
      }),
    ],
  })
}
function notices(item: ClassroomItem, values: Values): Child[] {
  const items: Child[] = []
  const copies = values.copies === '2' ? 2 : 1
  for (let index = 0; index < copies; index++) {
    items.push(
      box(
        [
          text(values.school || 'COMUNICADO ESCOLAR', {
            bold: true,
            size: 18,
            color: accent,
          }),
          text(values.title, { bold: true, size: 34, color: accent }),
          ...(values.classroom ? [text(values.classroom, { size: 20 })] : []),
        ],
        'E6F0E7',
      ),
    )
    items.push(text(values.recipient, { bold: true, after: 110 }))
    const data = noticeFields(item, values)
    if (data.length)
      items.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              cantSplit: true,
              children: data.map(
                (field) =>
                  new TableCell({
                    shading: { fill: 'F9F4E8' },
                    margins: { top: 90, bottom: 90, left: 110, right: 110 },
                    children: [
                      text(field.label, { bold: true, size: 17, after: 25 }),
                      text(field.text, { size: 20, after: 25 }),
                    ],
                  }),
              ),
            }),
          ],
        }),
      )
    items.push(
      ...values.body
        .split(/\r?\n/)
        .map((line) => text(line, { size: 21, after: 90 })),
    )
    items.push(text(values.signature, { bold: true, size: 20, after: 120 }))
    if (item.id === 'passeio')
      items.push(
        new Paragraph({
          border: {
            top: { style: BorderStyle.DASHED, size: 7, color: '63756B' },
          },
          children: [
            new TextRun({
              text: 'AUTORIZAÇÃO PARA A SAÍDA',
              bold: true,
              size: 18,
            }),
          ],
        }),
        text(
          'Autorizo a participação de ______________________________________',
          { size: 19, after: 50 },
        ),
        text(
          'Assinatura: ____________________________  Data: _____/_____/_____',
          { size: 19, after: 70 },
        ),
      )
    if (index === 0 && copies === 2)
      items.push(
        new Paragraph({
          spacing: { before: 100, after: 180 },
          border: {
            bottom: { style: BorderStyle.DASHED, size: 7, color: '63756B' },
          },
          children: [],
        }),
      )
  }
  return items
}

async function activity(item: ClassroomItem, values: Values): Promise<Child[]> {
  const task = item.task!
  const papers = buildSheets(item, values)
  const contents: Child[] = []
  for (const sheet of papers) {
    contents.push(heading(values.title, contents.length > 0))
    contents.push(
      text(
        [sheet.name, ageGuides[item.age!], values.school, values.classroom]
          .filter(Boolean)
          .join(' · '),
        { size: 18, color: '536860' },
      ),
    )
    if (sheet.name === 'Roteiro da professora') {
      for (const [label, description] of [
        ['O que preparar', task.supplies],
        [
          'Como conduzir',
          task.steps.map((step, index) => index + 1 + '. ' + step).join('\n'),
        ],
        ['Como adaptar', task.adaptation],
        ...(task.guide ? [['O que observar', task.guide]] : []),
      ]) {
        contents.push(text(label, { bold: true, color: accent, size: 25 }))
        contents.push(
          ...description.split('\n').map((line) => text(line, { size: 22 })),
        )
      }
    } else {
      // Keep worksheet drawings in native Word tables and leave response areas editable.
      if (task.mode !== 'cards')
        contents.push(
          text(
            'Nome: ________________________________________  Data: __________',
            { bold: true },
          ),
        )
      contents.push(
        text(
          task.mode === 'cards'
            ? 'Recorte os cartões e apresente um de cada vez.'
            : task.steps[1],
        ),
      )
      const pictures = sheet.marks.filter(
        (item): item is Extract<Mark, { kind: 'image' }> =>
          item.kind === 'image',
      )
      const cache = new Map<string, Uint8Array>()
      for (const p of pictures)
        if (!cache.has(p.asset)) cache.set(p.asset, await imageBytes(p.asset))
      if (task.mode === 'table' || task.mode === 'count') {
        const rows = (task.prompts ?? []).map((label) => {
          const images = pictures.filter((p) => p.alt === label)
          return new TableRow({
            cantSplit: true,
            children: [
              new TableCell({ children: [text(label, { bold: true })] }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: images.map(
                      (p) =>
                        new ImageRun({
                          type: 'png',
                          data: cache.get(p.asset)!,
                          transformation: { width: 36, height: 36 },
                        }),
                    ),
                  }),
                ],
              }),
              new TableCell({ children: [text('____________')] }),
            ],
          })
        })
        contents.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                tableHeader: true,
                children: ['Frutas', 'Figuras', 'Quantidade'].map(
                  (label) =>
                    new TableCell({
                      shading: { fill: 'E6F0E7' },
                      children: [text(label, { bold: true })],
                    }),
                ),
              }),
              ...rows,
            ],
          }),
        )
        contents.push(
          text(
            'Onde há mais frutas? ___________________________________________',
          ),
        )
      } else if (pictures.length) {
        // Use the same row and order as the printed activity, including blank cells.
        const rows = [...new Set(pictures.map((p) => p.y))].map((y) =>
          pictures.filter((p) => p.y === y),
        )
        contents.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: rows.map(
              (row) =>
                new TableRow({
                  cantSplit: true,
                  children: [
                    ...row.map(
                      (p) =>
                        new TableCell({
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.CENTER,
                              children: [
                                new ImageRun({
                                  type: 'png',
                                  data: cache.get(p.asset)!,
                                  transformation: { width: 44, height: 44 },
                                }),
                              ],
                            }),
                            text(p.alt, { size: 17 }),
                          ],
                        }),
                    ),
                    ...(task.mode === 'pattern'
                      ? [new TableCell({ children: [text('_____')] })]
                      : []),
                  ],
                }),
            ),
          }),
        )
        if (task.mode === 'pattern')
          contents.push(
            text(
              'Invente seu padrão: __________________________________________',
            ),
          )
        if (task.mode === 'story' || task.mode === 'sort')
          contents.push(
            text(
              'Meu registro: ________________________________________________',
            ),
          )
      } else {
        contents.push(
          ...(task.prompts ?? []).flatMap((label) => [
            text(label, { bold: true }),
            text('__________________________________________________'),
          ]),
        )
      }
    }
  }
  return contents
}
export async function classroomWord(item: ClassroomItem, values: Values) {
  let children: Child[]
  if (item.category === 'Recados') children = notices(item, values)
  else if (item.task) children = await activity(item, values)
  else
    children = [
      heading(values.title),
      text(
        [values.school, values.classroom, values.date]
          .filter(Boolean)
          .join(' · '),
        { color: accent },
      ),
      ...(item.fields ?? []).flatMap((field) => [
        heading(field.label),
        ...(
          values[field.key] ||
          '______________________________________________________'
        )
          .split(/\r?\n/)
          .map((line) => text(line, { size: 22 })),
      ]),
    ]
  return Packer.toBlob(
    new Document({
      title: values.title,
      styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
      sections: [
        {
          properties: {
            page: {
              size: { width: 11906, height: 16838 },
              margin: { left: 720, right: 720, top: 710, bottom: 710 },
            },
          },
          children,
        },
      ],
    }),
  )
}
