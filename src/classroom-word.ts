import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  HeightRule,
  VerticalAlign,
  TableLayoutType,
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
import {
  noticeFields,
  buildSheets,
  planMoments,
  planMinutes,
  activityObservation,
  activityCommand,
  worksheetGroups,
  type Mark,
} from './classroom-layout'
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
const noBorder = { style: BorderStyle.NONE }
const fineRule = { style: BorderStyle.SINGLE, size: 4, color: 'A8BBB0' }
const cutRule = { style: BorderStyle.DASHED, size: 7, color: '63756B' }
function noticeContents(
  item: ClassroomItem,
  values: Values,
  picture: Uint8Array,
): Child[] {
  const fill = item.id === 'passeio' ? 'F7DFCF' : 'E6F0E7'
  const result: Child[] = [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      columnWidths: [8550, 1900],
      margins: { top: 130, bottom: 100, left: 180, right: 180 },
      borders: {
        top: noBorder,
        bottom: noBorder,
        left: noBorder,
        right: noBorder,
        insideHorizontal: noBorder,
        insideVertical: noBorder,
      },
      rows: [
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              shading: { fill },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                text(values.school || 'COMUNICADO ESCOLAR', {
                  bold: true,
                  size: 18,
                  color: accent,
                }),
                text(values.title, { bold: true, size: 32, color: accent }),
                ...(values.classroom
                  ? [text(values.classroom, { size: 20 })]
                  : []),
              ],
            }),
            new TableCell({
              shading: { fill },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new ImageRun({
                      type: 'png',
                      data: picture,
                      transformation: { width: 106, height: 71 },
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    text('', { size: 8, after: 25 }),
    text(values.recipient, { bold: true, after: 110 }),
  ]
  const details = noticeFields(item, values)
  if (details.length)
    result.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: noBorder,
          bottom: noBorder,
          left: noBorder,
          right: noBorder,
          insideHorizontal: noBorder,
          insideVertical: noBorder,
        },
        rows: [
          new TableRow({
            cantSplit: true,
            children: details.map(
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
  result.push(text('', { size: 8, after: 38 }))
  result.push(
    ...values.body
      .split(/\r?\n/)
      .map((line) => text(line, { size: 21, after: 90 })),
  )
  result.push(text(values.signature, { bold: true, size: 20, after: 120 }))
  return result
}
function authorization() {
  return [
    new Paragraph({
      border: { top: cutRule },
      spacing: { before: 160, after: 90 },
      children: [
        new TextRun({ text: 'AUTORIZAÇÃO PARA A SAÍDA', bold: true, size: 18 }),
      ],
    }),
    text('Autorizo a participação de ______________________________________', {
      size: 19,
      after: 50,
    }),
    text('Assinatura: ____________________________  Data: _____/_____/_____', {
      size: 19,
      after: 70,
    }),
  ]
}
async function notices(item: ClassroomItem, values: Values): Promise<Child[]> {
  const artwork = await imageBytes('recados.webp')
  const copies = values.copies === '2' ? 2 : 1
  const rows = Array.from(
    { length: copies },
    () =>
      new TableRow({
        cantSplit: true,
        height: {
          value: copies === 2 ? 6850 : 14300,
          rule: HeightRule.ATLEAST,
        },
        children: [
          new TableCell({
            margins: { top: 220, bottom: 110, left: 160, right: 160 },
            children: [
              ...noticeContents(item, values, artwork),
              ...(item.id === 'passeio' ? authorization() : []),
            ],
          }),
        ],
      }),
  )
  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: fineRule,
        bottom: fineRule,
        left: fineRule,
        right: fineRule,
        insideHorizontal: cutRule,
        insideVertical: noBorder,
      },
      rows,
    }),
  ]
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
        ...(activityObservation(item, values)
          ? [['O que observar', activityObservation(item, values)!]]
          : []),
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
            : activityCommand(item, values),
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
        const rows = worksheetGroups(item, values).map((label) => {
          const images = pictures.filter((p) => p.alt === label)
          return new TableRow({
            cantSplit: true,
            height: { value: 1780, rule: HeightRule.ATLEAST },
            children: [
              new TableCell({
                verticalAlign: VerticalAlign.CENTER,
                children: [text(label, { bold: true, size: 25 })],
              }),
              new TableCell({
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    children: images.map(
                      (p) =>
                        new ImageRun({
                          type: 'png',
                          data: cache.get(p.asset)!,
                          transformation: { width: 52, height: 52 },
                        }),
                    ),
                  }),
                ],
              }),
              new TableCell({
                verticalAlign: VerticalAlign.CENTER,
                children: [text('_________', { size: 28 })],
              }),
            ],
          })
        })
        contents.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            margins: { left: 190, right: 190, top: 155, bottom: 155 },
            borders: {
              top: fineRule,
              bottom: fineRule,
              left: fineRule,
              right: fineRule,
              insideHorizontal: fineRule,
              insideVertical: fineRule,
            },
            layout: TableLayoutType.FIXED,
            columnWidths: [2300, 5750, 2400],
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  item.id === 'criar-contagem' ? 'Grupo' : 'Frutas',
                  'Figuras',
                  'Quantidade',
                ].map(
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
          text(''),
          text(
            item.id === 'criar-contagem'
              ? 'Qual grupo tem mais figuras? Escreva ou desenhe.'
              : 'Onde há mais frutas? Explique com palavras ou desenho.',
            {
              bold: true,
              size: 25,
            },
          ),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: fineRule,
              bottom: fineRule,
              left: fineRule,
              right: fineRule,
            },
            rows: [
              new TableRow({
                height: { value: 2200, rule: HeightRule.ATLEAST },
                children: [new TableCell({ children: [text('')] })],
              }),
            ],
          }),
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
                            text(
                              task.mode === 'story'
                                ? pictures.indexOf(p) + 1 + '. ' + p.alt
                                : p.alt,
                              { size: 17 },
                            ),
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
  if (item.category === 'Recados') children = await notices(item, values)
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
      ...(item.tool === 'plano-de-aula'
        ? [
            text('Duração total · ' + planMinutes(values) + ' min', {
              bold: true,
              color: accent,
            }),
          ]
        : []),
      ...(item.fields ?? []).flatMap((field) =>
        field.key === 'conduct' && item.tool === 'plano-de-aula'
          ? [
              heading('Momentos da aula'),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: planMoments(values).map(
                  (moment) =>
                    new TableRow({
                      cantSplit: true,
                      children: [
                        new TableCell({
                          shading: { fill: 'E6F0E7' },
                          children: [
                            text(moment.label, { bold: true }),
                            text(moment.minutes + ' min'),
                          ],
                        }),
                        new TableCell({
                          children: moment.action
                            .split(/\r?\n/)
                            .map((action) => text(action)),
                        }),
                      ],
                    }),
                ),
              }),
            ]
          : [
              heading(field.label),
              ...(
                values[field.key] ||
                '______________________________________________________'
              )
                .split(/\r?\n/)
                .map((line) => text(line, { size: 22 })),
            ],
      ),
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
