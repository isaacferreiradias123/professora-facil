import { PDFDocument, rgb } from 'pdf-lib'
import { a4, fonts, printable, wrapText } from './pdf'
import {
  blobOf,
  canvas,
  photoCell,
  photoLayout,
  panelMargin,
  photoPages,
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
  const layout = photoLayout(options)
  const { pageWidth: w, pageHeight: h, width, height } = layout
  let done = 0
  for (const sheet of photoPages(items, options.perPage)) {
    const page = pdf.addPage([w, h])
    for (const [i, photo] of sheet.entries()) {
      const x = layout.x(i)
      const top = h - layout.y(i)
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
      progress(++done)
      await new Promise<void>((resolve) => setTimeout(resolve, 0))
    }
  }
  return new Blob([new Uint8Array(await pdf.save())], {
    type: 'application/pdf',
  })
}

export async function panelPdf(
  source: HTMLCanvasElement,
  grid: number,
  rows = grid,
) {
  const pdf = await PDFDocument.create()
  const { regular } = await fonts(pdf)
  const { size, positions } = tiles(grid, rows)
  const margin = panelMargin
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
