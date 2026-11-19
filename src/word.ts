import {
  Document,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import type { Block, Material } from './model'
type Child = Paragraph | Table
function renderBlock(block: Block): Child[] {
  switch (block.kind) {
    case 'text':
      return block.text
        .split('\n')
        .map((text) => new Paragraph({ text, spacing: { after: 120 } }))
    case 'list':
      return block.items.map(
        (text) =>
          new Paragraph({
            text,
            ...(block.numbered
              ? { numbering: { reference: 'items', level: 0 } }
              : { bullet: { level: 0 } }),
            spacing: { after: 100 },
          }),
      )
    case 'table':
      return [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: block.rows.map(
            (row) =>
              new TableRow({
                cantSplit: true,
                children: row.map(
                  (text) => new TableCell({ children: [new Paragraph(text)] }),
                ),
              }),
          ),
        }),
      ]
    case 'image': {
      const scale = Math.min(
        1,
        (block.worksheet ? 620 : 600) / block.width,
        (block.worksheet ? 900 : 420) / block.height,
      )
      return [
        new Paragraph({
          children: [
            new ImageRun({
              type: block.mime === 'image/png' ? 'png' : 'jpg',
              data: block.bytes,
              transformation: {
                width: Math.round(block.width * scale),
                height: Math.round(block.height * scale),
              },
              altText: {
                title: block.alt,
                description: block.alt,
                name: block.alt,
              },
            }),
          ],
        }),
      ]
    }
  }
}
export function word(material: Material): Promise<Blob> {
  const color =
    material.accent === 'peach'
      ? '743D2C'
      : material.accent === 'mono'
        ? '222222'
        : '315C48'
  const children: Child[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: material.title, color, bold: true })],
    }),
  ]
  if (material.metadata.length)
    children.push(
      new Paragraph({
        text: material.metadata.join(' · '),
        spacing: { after: 240 },
      }),
    )
  for (const section of material.sections) {
    if (section.title)
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          pageBreakBefore: section.newPage,
          keepNext: true,
          children: [new TextRun({ text: section.title, color })],
        }),
      )
    children.push(...section.blocks.flatMap(renderBlock))
  }
  return Packer.toBlob(
    new Document({
      title: material.title,
      styles: { default: { document: { run: { font: 'Calibri', size: 24 } } } },
      numbering: {
        config: [
          {
            reference: 'items',
            levels: [
              {
                level: 0,
                format: LevelFormat.DECIMAL,
                text: '%1.',
                style: { paragraph: { indent: { left: 420, hanging: 240 } } },
              },
            ],
          },
        ],
      },
      sections: [
        {
          properties: {
            page: {
              size: { width: 11906, height: 16838 },
              margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 },
            },
          },
          children,
        },
      ],
    }),
  )
}
