import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  HeightRule,
  ImageRun,
  Packer,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx'
import { imageBytes } from './classroom-export'
import { ageGuides, type ClassroomItem } from './classroom-catalog'
import {
  activityCommand,
  activityObservation,
  buildSheets,
  documentDetails,
  documentSignatures,
  hasAuthorization,
  noticeFields,
  noticeVisual,
  planMinutes,
  planMoments,
  resolveTheme,
  traceTracks,
  worksheetGroups,
  type Mark,
} from './classroom-layout'
import type { Values } from './store'

type Child = Paragraph | Table

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

function heading(value: string, accent: string, breakBefore = false) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: breakBefore,
    keepNext: true,
    spacing: { after: 130 },
    children: [new TextRun({ text: value, color: accent, bold: true })],
  })
}

const noBorder = { style: BorderStyle.NONE }
const cutRule = { style: BorderStyle.DASHED, size: 7, color: '63756B' }

function noticeContents(
  item: ClassroomItem,
  values: Values,
  picture: Uint8Array | null,
  accent: string,
  cardFill: string,
): Child[] {
  const visual = noticeVisual(item, values)
  const fill =
    values.printTheme === 'economico'
      ? 'FFFFFF'
      : visual.color.slice(1).toUpperCase()
  const result: Child[] = [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      columnWidths: picture ? [8550, 1900] : [10450],
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
            ...(picture
              ? [
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
                ]
              : []),
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
                  shading: { fill: cardFill },
                  margins: { top: 90, bottom: 90, left: 110, right: 110 },
                  children: [
                    text(field.label, { bold: true, size: 17, after: 25 }),
                    text(field.text.trim() || '________________', {
                      size: 20,
                      after: 25,
                    }),
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
  result.push(
    text(values.signature, { bold: true, color: accent, size: 20, after: 120 }),
  )
  return result
}

function authorization() {
  return [
    new Paragraph({
      border: { top: cutRule },
      spacing: { before: 160, after: 90 },
      children: [
        new TextRun({ text: 'AUTORIZAÇÃO / CONFIRMAÇÃO', bold: true, size: 18 }),
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

async function notices(
  item: ClassroomItem,
  values: Values,
  accent: string,
  ruleHex: string,
  cardFill: string,
): Promise<Child[]> {
  const visual = noticeVisual(item, values)
  const artwork = visual.asset ? await imageBytes(visual.asset) : null
  const copies = values.copies === '4' ? 4 : values.copies === '1' ? 1 : 2
  const fineRule = { style: BorderStyle.SINGLE, size: 4, color: ruleHex }

  if (copies === 4) {
    const cellContent = () => [
      text(values.school || 'COMUNICADO', { bold: true, size: 16, color: accent, after: 30 }),
      text(values.title, { bold: true, size: 22, color: accent, after: 40 }),
      text(values.recipient, { bold: true, size: 18, after: 40 }),
      ...noticeFields(item, values)
        .slice(0, 3)
        .map((f) => text(`${f.label}: ${f.text || '________'}`, { size: 17, after: 25 })),
      ...values.body.split(/\r?\n/).map((line) => text(line, { size: 18, after: 35 })),
      text(values.signature, { bold: true, size: 17, color: accent, after: 30 }),
    ]
    return [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: fineRule,
          bottom: fineRule,
          left: fineRule,
          right: fineRule,
          insideHorizontal: cutRule,
          insideVertical: cutRule,
        },
        rows: [0, 1].map(
          () =>
            new TableRow({
              cantSplit: true,
              height: { value: 6850, rule: HeightRule.ATLEAST },
              children: [0, 1].map(
                () =>
                  new TableCell({
                    margins: { top: 150, bottom: 100, left: 150, right: 150 },
                    children: cellContent(),
                  }),
              ),
            }),
        ),
      }),
    ]
  }

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
              ...noticeContents(item, values, artwork, accent, cardFill),
              ...(hasAuthorization(item, values) ? authorization() : []),
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

async function activity(
  item: ClassroomItem,
  values: Values,
  accent: string,
  headerFill: string,
  ruleHex: string,
): Promise<Child[]> {
  const task = item.task!
  const papers = buildSheets(item, values)
  const contents: Child[] = []
  const fineRule = { style: BorderStyle.SINGLE, size: 4, color: ruleHex }

  for (const sheet of papers) {
    contents.push(heading(values.title, accent, contents.length > 0))
    contents.push(
      text(
        [
          sheet.name,
          item.age ? ageGuides[item.age] : '',
          values.school,
          values.classroom,
        ]
          .filter(Boolean)
          .join(' · '),
        { size: 18, color: '536860' },
      ),
    )

    if (sheet.name === 'Roteiro da professora') {
      const supplies = values.supplies?.trim() || task.supplies
      const steps = (
        values.stepsText?.trim()
          ? values.stepsText.split(/\r?\n/).filter((s) => s.trim())
          : task.steps
      )
        .map((step, index) => index + 1 + '. ' + step.trim())
        .join('\n')
      const adaptation = values.adaptation?.trim() || task.adaptation
      const obs = activityObservation(item, values)
      for (const [label, description] of [
        ['O que preparar', supplies],
        ['Como conduzir', steps],
        ['Como adaptar e incluir', adaptation],
        ...(obs ? [['O que observar', obs]] : []),
      ]) {
        contents.push(text(label, { bold: true, color: accent, size: 25 }))
        contents.push(
          ...description.split('\n').map((line) => text(line, { size: 22 })),
        )
      }
      continue
    }

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
          ? values.memoryMode === 'yes'
            ? 'Recorte os pares de cartões para jogar.'
            : 'Recorte os cartões e apresente um de cada vez.'
          : activityCommand(item, values),
      ),
    )

    const pictures = sheet.marks.filter(
      (mark): mark is Extract<Mark, { kind: 'image' }> =>
        mark.kind === 'image',
    )
    const cache = new Map<string, Uint8Array>()
    for (const p of pictures)
      if (!cache.has(p.asset)) cache.set(p.asset, await imageBytes(p.asset))

    if (task.mode === 'trace') {
      const tracks = traceTracks(item, values)
      contents.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.FIXED,
          columnWidths: [1900, 6650, 1900],
          borders: {
            top: fineRule,
            bottom: fineRule,
            left: fineRule,
            right: fineRule,
            insideHorizontal: fineRule,
            insideVertical: noBorder,
          },
          rows: tracks.map((track, idx) => {
            const leftImg = pictures[idx * 2]
            const rightImg = pictures[idx * 2 + 1]
            return new TableRow({
              cantSplit: true,
              height: { value: 2100, rule: HeightRule.ATLEAST },
              children: [
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new ImageRun({
                          type: 'png',
                          data: cache.get(leftImg.asset)!,
                          transformation: { width: 64, height: 64 },
                        }),
                      ],
                    }),
                    text(track.from, { size: 16 }),
                  ],
                }),
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text:
                            track.kind === 'wave'
                              ? '•  ~  •  ~  •  ~  •  ~  •  ~  •  ~  •  ~  •  ~  •'
                              : track.kind === 'zigzag'
                                ? '•  ^  •  v  •  ^  •  v  •  ^  •  v  •  ^  •'
                                : '•  •  •  •  •  •  •  •  •  •  •  •  •  •  •  •  •',
                          size: 28,
                          color: accent,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new ImageRun({
                          type: 'png',
                          data: cache.get(rightImg.asset)!,
                          transformation: { width: 64, height: 64 },
                        }),
                      ],
                    }),
                    text(track.to, { size: 16 }),
                  ],
                }),
              ],
            })
          }),
        }),
      )
    } else if (task.mode === 'draw-frame') {
      const hero = pictures[0]
      if (hero)
        contents.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new ImageRun({
                type: 'png',
                data: cache.get(hero.asset)!,
                transformation: { width: 78, height: 78 },
              }),
            ],
          }),
        )
      contents.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              height: { value: 6500, rule: HeightRule.ATLEAST },
              children: [new TableCell({ children: [text('')] })],
            }),
          ],
        }),
        text(''),
        text(task.prompts?.[0] ?? 'O que eu desenhei:', { bold: true }),
        text('______________________________________________________________'),
        text('______________________________________________________________'),
      )
    } else if (task.mode === 'table' || task.mode === 'count') {
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
                        transformation: { width: 48, height: 48 },
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
              children: ['Elemento', 'Figuras', 'Quantidade'].map(
                (label) =>
                  new TableCell({
                    shading: { fill: headerFill },
                    children: [text(label, { bold: true })],
                  }),
              ),
            }),
            ...rows,
          ],
        }),
        text(''),
        text(
          values.footerQuestion?.trim() ||
            'Qual grupo tem mais figuras? Circule ou escreva como descobriu:',
          { bold: true, size: 24 },
        ),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              height: { value: 2100, rule: HeightRule.ATLEAST },
              children: [new TableCell({ children: [text('')] })],
            }),
          ],
        }),
      )
    } else if (pictures.length) {
      const rows = [...new Set(pictures.map((p) => p.y))].map((y) =>
        pictures.filter((p) => p.y === y),
      )
      contents.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          ...(task.mode === 'match'
            ? {
                layout: TableLayoutType.FIXED,
                columnWidths: [3000, 4450, 3000],
              }
            : {}),
          margins: { top: 90, bottom: 90, left: 110, right: 110 },
          rows: rows.map(
            (row) =>
              new TableRow({
                cantSplit: true,
                children: [
                  ...row.flatMap((p, index) => [
                    ...(task.mode === 'match' && index === 1
                      ? [new TableCell({ children: [text('')] })]
                      : []),
                    new TableCell({
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new ImageRun({
                              type: 'png',
                              data: cache.get(p.asset)!,
                              transformation: { width: 55, height: 55 },
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
                  ]),
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
          text('Invente seu padrão: __________________________________________'),
        )
      if (task.mode === 'sort' && task.sortLabels)
        for (const label of task.sortLabels)
          contents.push(
            text(label, { bold: true }),
            text('__________________________________________________'),
          )
      else if (task.mode === 'story' || task.mode === 'sort')
        contents.push(
          text('Meu registro: ________________________________________________'),
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
  return contents
}

export async function classroomWord(item: ClassroomItem, values: Values) {
  const theme = resolveTheme(item, values)
  const accent = theme.primary.slice(1).toUpperCase()
  const headerFill = theme.headerBg.slice(1).toUpperCase()
  const cardFill = theme.cardB.slice(1).toUpperCase()
  const ruleHex = theme.rule.slice(1).toUpperCase()
  const fineRule = { style: BorderStyle.SINGLE, size: 4, color: ruleHex }

  let children: Child[]
  if (item.category === 'Recados') {
    children = await notices(item, values, accent, ruleHex, cardFill)
  } else if (item.task) {
    children = await activity(item, values, accent, headerFill, ruleHex)
  } else if (item.tool === 'plano-de-aula' && item.planLayout === 'weekly') {
    const days = [
      ['mon', 'Segunda'],
      ['tue', 'Terça'],
      ['wed', 'Quarta'],
      ['thu', 'Quinta'],
      ['fri', 'Sexta'],
    ] as const
    const bncc = [
      values.bnccFields?.replaceAll('|', ' · '),
      values.bnccRights?.replaceAll('|', ' · '),
    ]
      .filter(Boolean)
      .join(' | ')
    children = [
      heading(values.title, accent),
      text(
        [values.school, values.classroom || item.age, values.date]
          .filter(Boolean)
          .join(' · '),
        { color: accent },
      ),
      ...(bncc ? [text('BNCC: ' + bncc, { bold: true, size: 19, color: accent })] : []),
      text('Foco da semana: ' + (values.objective ?? ''), { size: 22 }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: fineRule,
          bottom: fineRule,
          left: fineRule,
          right: fineRule,
          insideHorizontal: fineRule,
          insideVertical: fineRule,
        },
        rows: [
          new TableRow({
            tableHeader: true,
            children: days.map(
              ([, label]) =>
                new TableCell({
                  shading: { fill: headerFill },
                  children: [text(label, { bold: true, color: accent })],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            height: { value: 4200, rule: HeightRule.ATLEAST },
            children: days.map(
              ([key]) =>
                new TableCell({
                  children: (values[key] ?? '')
                    .split(/\r?\n/)
                    .map((line) => text(line, { size: 20 })),
                }),
            ),
          }),
        ],
      }),
    ]
  } else {
    const details = documentDetails(item, values)
    const signatures = documentSignatures(item)
    const bncc =
      item.tool === 'plano-de-aula'
        ? [
            values.bnccFields?.replaceAll('|', ' · '),
            values.bnccRights?.replaceAll('|', ' · '),
          ]
            .filter(Boolean)
            .join(' | ')
        : ''
    children = [
      heading(values.title, accent),
      text(
        [values.school, values.classroom || item.age, values.date]
          .filter(Boolean)
          .join(' · '),
        { color: accent },
      ),
      ...(bncc ? [text('BNCC: ' + bncc, { bold: true, size: 19, color: accent })] : []),
      ...(details.length
        ? [
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              margins: { left: 180, right: 180, top: 120, bottom: 120 },
              borders: {
                top: fineRule,
                bottom: fineRule,
                left: fineRule,
                right: fineRule,
                insideHorizontal: fineRule,
                insideVertical: fineRule,
              },
              rows: details.map(
                (field) =>
                  new TableRow({
                    cantSplit: true,
                    children: [
                      new TableCell({
                        shading: { fill: cardFill },
                        children: [text(field.label, { bold: true })],
                      }),
                      new TableCell({ children: [text(field.text)] }),
                    ],
                  }),
              ),
            }),
          ]
        : []),
      ...(item.tool === 'plano-de-aula'
        ? [
            text('Duração total · ' + planMinutes(values) + ' min', {
              bold: true,
              color: accent,
            }),
          ]
        : []),
      ...(item.fields ?? [])
        .filter((field) => !details.length || field.type === 'long')
        .flatMap((field) =>
          field.key === 'conduct' && item.tool === 'plano-de-aula'
            ? [
                heading('Momentos da aula', accent),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: planMoments(values).map(
                    (moment) =>
                      new TableRow({
                        cantSplit: true,
                        children: [
                          new TableCell({
                            shading: { fill: headerFill },
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
            : item.form === 'checklist' && field.key === 'items'
              ? [
                  heading(field.label, accent),
                  ...(values[field.key] ?? '')
                    .split(/\r?\n/)
                    .filter((l) => l.trim())
                    .map((line) => text('☐  ' + line.trim(), { size: 22 })),
                ]
              : [
                  heading(field.label, accent),
                  ...(
                    values[field.key] ||
                    '______________________________________________________'
                  )
                    .split(/\r?\n/)
                    .map((line) => text(line, { size: 22 })),
                ],
        ),
      ...signatures.flatMap((label) => [
        text('_______________________________________', { after: 40 }),
        text(label, { size: 19 }),
      ]),
    ]
  }

  const landscape = item.tool === 'plano-de-aula' && item.planLayout === 'weekly'
  return Packer.toBlob(
    new Document({
      title: values.title,
      styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
      sections: [
        {
          properties: {
            page: {
              size: {
                width: landscape ? 16838 : 11906,
                height: landscape ? 11906 : 16838,
                ...(landscape
                  ? { orientation: PageOrientation.LANDSCAPE }
                  : {}),
              },
              margin: { left: 720, right: 720, top: 710, bottom: 710 },
            },
          },
          children,
        },
      ],
    }),
  )
}
