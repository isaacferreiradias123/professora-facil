import { PDFDocument, rgb } from 'pdf-lib'
import { a4, fonts, printable, wrapText } from './pdf-core'
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

function hexRgb(hex?: string, fallback = rgb(0.12, 0.34, 0.26)) {
  const clean = (hex || '').replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return fallback
  return rgb(
    parseInt(clean.slice(0, 2), 16) / 255,
    parseInt(clean.slice(2, 4), 16) / 255,
    parseInt(clean.slice(4, 6), 16) / 255,
  )
}

export async function photosPdf(
  items: Photo[],
  options: PhotoOptions,
  progress: (done: number) => void,
) {
  const pdf = await PDFDocument.create()
  const { regular, bold } = await fonts(pdf, true)
  if (options.header?.trim()) pdf.setTitle(options.header.trim())
  const layout = photoLayout(options)
  const { pageWidth: w, pageHeight: h, width, height } = layout
  let done = 0
  const sheets = photoPages(items, options.perPage)
  const tint = hexRgb(options.headerColor)
  const ink = rgb(0.11, 0.14, 0.12)
  const rule = rgb(0.75, 0.8, 0.76)

  function within(
    text: string,
    size: number,
    horizontal: number,
    font = regular,
  ) {
    const clean = printable(text.replace(/\s+/g, ' '), font)
    return Math.min(
      size,
      (size * horizontal) / Math.max(1, font.widthOfTextAtSize(clean, size)),
    )
  }

  for (const [sheetIndex, sheet] of sheets.entries()) {
    const page = pdf.addPage([w, h])
    const header = options.header?.trim()
    if (header) {
      const y = h - layout.margin
      const max = w - 2 * layout.margin
      page.drawText(printable(header, bold), {
        x: layout.margin,
        y: y - 17,
        font: bold,
        color: tint,
        size: within(header, 17, max, bold),
      })
      if (options.subtitle?.trim())
        page.drawText(printable(options.subtitle, regular), {
          x: layout.margin,
          y: y - 31,
          font: regular,
          color: ink,
          size: within(options.subtitle, 9.5, max),
        })
      page.drawLine({
        start: { x: layout.margin, y: y - 37 },
        end: { x: w - layout.margin, y: y - 37 },
        color: rule,
        thickness: 0.7,
      })
    }
    if (options.numbering) {
      const label = 'Folha ' + (sheetIndex + 1) + ' de ' + sheets.length
      page.drawText(label, {
        x: w - layout.margin - regular.widthOfTextAtSize(label, 9),
        y: layout.margin + 2,
        size: 9,
        font: regular,
        color: tint,
      })
    }
    for (const [i, photo] of sheet.entries()) {
      const x = layout.x(i)
      const top = h - layout.y(i)
      const polaroid = Boolean(options.polaroid)
      const pad = polaroid ? 8 : 0
      const textWidth = Math.max(32, width - pad * 2)
      const label = wrapText(
        printable(photo.caption, regular),
        textWidth,
        (v) => regular.widthOfTextAtSize(v, 9),
      ).slice(0, polaroid ? 3 : 4)
      const note = polaroid
        ? Math.max(26, label.length * 12 + 10)
        : photo.caption
          ? label.length * 12 + 5
          : 0
      const imgW = Math.max(24, width - pad * 2)
      const imgH = Math.max(24, height - pad - note)
      if (polaroid) {
        page.drawRectangle({
          x,
          y: top - height,
          width,
          height,
          color: rgb(1, 1, 1),
          borderColor: rgb(0.83, 0.85, 0.81),
          borderWidth: 0.85,
        })
      }
      const image = await pdf.embedJpg(
        await photoCell(photo, imgW, imgH, options),
      )
      page.drawImage(image, {
        x: x + pad,
        y: top - pad - imgH,
        width: imgW,
        height: imgH,
      })
      if (photo.caption && note) {
        label.forEach((line, j) =>
          page.drawText(line, {
            x: x + (width - regular.widthOfTextAtSize(line, 9)) / 2,
            y:
              top -
              height +
              note -
              (polaroid ? 13 : 12) * (j + 1) +
              (polaroid ? 3 : 0),
            font: regular,
            color: ink,
            size: 9,
          }),
        )
      }
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
  includeMap = false,
  title = 'Painel da turma',
) {
  const pdf = await PDFDocument.create()
  const { regular, bold } = await fonts(pdf, true)
  const geometry = tiles(grid, rows)
  const { size, positions } = geometry
  pdf.setTitle(title)
  const margin = panelMargin
  const width = a4[0] - margin * 2,
    height = (width * size.height) / size.width
  const baseY = (a4[1] - height) / 2
  if (includeMap) {
    const guide = pdf.addPage([...a4])
    const green = rgb(0.12, 0.34, 0.26)
    const scale = Math.min(430 / source.width, 490 / source.height)
    const w = source.width * scale,
      h = source.height * scale
    const mapX = (a4[0] - w) / 2,
      mapY = 120
    const mini = canvas(Math.ceil(w * 1.5), Math.ceil(h * 1.5))
    try {
      mini.getContext('2d')!.drawImage(source, 0, 0, mini.width, mini.height)
      const picture = await pdf.embedPng(
        await (await blobOf(mini)).arrayBuffer(),
      )
      guide.drawImage(picture, { x: mapX, y: mapY, width: w, height: h })
    } finally {
      mini.width = 0
    }
    guide.drawText('Guia de montagem', {
      x: 42,
      y: 776,
      size: 23,
      font: bold,
      color: green,
    })
    const headline = printable(title, bold)
    guide.drawText(headline, {
      x: 42,
      y: 747,
      size: Math.min(
        14,
        (14 * 500) / Math.max(1, bold.widthOfTextAtSize(headline, 14)),
      ),
      font: bold,
      color: green,
    })
    const cm = (n: number) =>
      ((((n * width) / size.width) * 2.54) / 72).toFixed(1).replace('.', ',')
    const notes = [
      positions.length +
        ' folhas A4 · Painel montado: ' +
        cm(geometry.width) +
        ' × ' +
        cm(geometry.height) +
        ' cm',
      'Imprima as folhas do painel em tamanho real (100%).',
      'Monte da esquerda para a direita, começando pela primeira linha.',
      'Apare uma borda em cada junção e alinhe a sobreposição de ' +
        cm(16) +
        ' cm.',
    ]
    notes.forEach((line, index) =>
      guide.drawText(printable(line, regular), {
        x: 42,
        y: 712 - index * 19,
        size: 11,
        font: regular,
        color: green,
      }),
    )
    positions.forEach((position, index) => {
      const left = mapX + (position.x / geometry.width) * w
      const top = mapY + h - (position.y / geometry.height) * h
      guide.drawRectangle({
        x: left + 4,
        y: top - 19,
        width: 22,
        height: 15,
        color: rgb(1, 1, 1),
        opacity: 0.88,
      })
      guide.drawText(String(index + 1), {
        x: left + 8,
        y: top - 15,
        size: 9,
        font: bold,
        color: green,
      })
      if (index % grid !== 0)
        guide.drawLine({
          start: { x: left, y: mapY },
          end: { x: left, y: mapY + h },
          thickness: 0.6,
          color: green,
          dashArray: [3, 3],
        })
      if (index >= grid && index % grid === 0)
        guide.drawLine({
          start: { x: mapX, y: top },
          end: { x: mapX + w, y: top },
          thickness: 0.6,
          color: green,
          dashArray: [3, 3],
        })
    })
  }
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
