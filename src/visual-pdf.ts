import { PDFDocument, rgb } from 'pdf-lib'
import { a4, fonts, printable, wrapText } from './pdf'
import {
  blobOf,
  canvas,
  photoCell,
  tiles,
  type Photo,
  type PhotoOptions,
} from './media'

export async function photosPdf(
  items: Photo[],
  options: PhotoOptions,
  progress: (done: number) => void,
) {
  const pdf = await PDFDocument.create()
  const { regular } = await fonts(pdf)
  const [w, h] = options.orientation === 'vertical' ? a4 : [a4[1], a4[0]]
  const cols =
    options.perPage === 4 ||
    (options.perPage === 2 && options.orientation === 'horizontal')
      ? 2
      : 1
  const rows = options.perPage / cols
  const margin = (options.margin * 72) / 25.4,
    gap = 12
  const width = (w - 2 * margin - (cols - 1) * gap) / cols,
    height = (h - 2 * margin - (rows - 1) * gap) / rows
  for (let start = 0; start < items.length; start += options.perPage) {
    const page = pdf.addPage([w, h])
    for (let i = 0; i < options.perPage && start + i < items.length; i++) {
      const photo = items[start + i],
        x = margin + (i % cols) * (width + gap),
        top = h - margin - Math.floor(i / cols) * (height + gap)
      const label = wrapText(printable(photo.caption, regular), width, (v) =>
        regular.widthOfTextAtSize(v, 9),
      )
      const note = photo.caption ? label.length * 12 + 5 : 0
      const image = await pdf.embedJpg(
        await photoCell(photo, width, height - note, options),
      )
      page.drawImage(image, {
        x,
        y: top - height + note,
        width,
        height: height - note,
      })
      if (note)
        label.forEach((line, j) =>
          page.drawText(line, {
            x: x + (width - regular.widthOfTextAtSize(line, 9)) / 2,
            y: top - height + note - 12 * (j + 1),
            font: regular,
            size: 9,
          }),
        )
      progress(start + i + 1)
      await new Promise<void>((resolve) => setTimeout(resolve, 0))
    }
  }
  return new Blob([new Uint8Array(await pdf.save())], {
    type: 'application/pdf',
  })
}

export async function panelPdf(source: HTMLCanvasElement, grid: number) {
  const pdf = await PDFDocument.create()
  const { regular } = await fonts(pdf)
  const { size, positions } = tiles(grid)
  const margin = 23
  const width = a4[0] - margin * 2,
    height = (width * size.height) / size.width
  const baseY = (a4[1] - height) / 2
  for (const [index, pos] of positions.entries()) {
    const page = pdf.addPage([...a4])
    const tile = canvas(size.width, size.height)
    tile
      .getContext('2d')!
      .drawImage(
        source,
        pos.x,
        pos.y,
        size.width,
        size.height,
        0,
        0,
        size.width,
        size.height,
      )
    try {
      const photo = await pdf.embedPng(await (await blobOf(tile)).arrayBuffer())
      page.drawImage(photo, { x: margin, y: baseY, width, height })
    } finally {
      tile.width = 0
    }
    for (const x of [margin, margin + width])
      for (const y of [baseY, baseY + height]) {
        page.drawLine({
          start: { x: x - 5, y },
          end: { x: x + 5, y },
          thickness: 0.4,
          color: rgb(0.2, 0.2, 0.2),
        })
        page.drawLine({
          start: { x, y: y - 5 },
          end: { x, y: y + 5 },
          thickness: 0.4,
          color: rgb(0.2, 0.2, 0.2),
        })
      }
    page.drawText(
      'Folha ' +
        (index + 1) +
        ' de ' +
        positions.length +
        ' · Linha ' +
        (Math.floor(index / grid) + 1) +
        ' · Coluna ' +
        ((index % grid) + 1),
      { x: margin, y: 14, size: 9, font: regular },
    )
  }
  return new Blob([new Uint8Array(await pdf.save())], {
    type: 'application/pdf',
  })
}
