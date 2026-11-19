import { PDFDocument, rgb, type PDFImage } from 'pdf-lib'
import { fonts, printable } from './pdf-core'
import { assetUrl, paper, type Sheet } from './classroom-layout'

const point = (mm: number) => (mm * 72) / 25.4

function color(hex: string) {
  return rgb(
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  )
}

export async function imageBytes(asset: string): Promise<Uint8Array> {
  if (asset.endsWith('.png')) {
    const result = await fetch(assetUrl(asset))
    if (!result.ok) throw new Error('Imagem indisponível: ' + asset)
    return new Uint8Array(await result.arrayBuffer())
  }
  const image = new Image()
  image.src = assetUrl(asset)
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  try {
    canvas.getContext('2d')!.drawImage(image, 0, 0)
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error())),
        'image/png',
      ),
    )
    return new Uint8Array(await blob.arrayBuffer())
  } finally {
    canvas.width = 0
  }
}

export async function classroomPdf(title: string, sheets: Sheet[]) {
  const document = await PDFDocument.create()
  document.setTitle(title)
  const face = await fonts(document, true)
  const images = new Map<string, PDFImage>()
  for (const sheet of sheets) {
    const size = sheet.size ?? paper
    const page = document.addPage([point(size.width), point(size.height)])
    for (const mark of sheet.marks) {
      if (mark.kind === 'path') {
        const stroke = color(mark.color)
        const thickness = point(mark.strokeWidth)
        for (let i = 1; i < mark.points.length; i++) {
          const a = mark.points[i - 1]
          const b = mark.points[i]
          page.drawLine({
            start: { x: point(a.x), y: point(size.height - a.y) },
            end: { x: point(b.x), y: point(size.height - b.y) },
            color: stroke,
            thickness,
            dashArray: mark.dashed ? [4, 3] : undefined,
          })
        }
        continue
      }

      const x = point(mark.x)
      const y = point(size.height - mark.y)
      const width = point(mark.width)
      if (mark.kind === 'text') {
        if (!mark.text || width <= 0) continue
        const font = mark.bold ? face.bold : face.regular
        const fontSize = point(mark.size)
        const text = printable(mark.text.replace(/\s+/g, ' '), font)
        const measured = font.widthOfTextAtSize(text, fontSize)
        const actualSize = Math.min(
          fontSize,
          (fontSize * width) / (measured || width),
        )
        const actualWidth = font.widthOfTextAtSize(text, actualSize)
        const drawX =
          mark.align === 'center'
            ? x + Math.max(0, (width - actualWidth) / 2)
            : mark.align === 'right'
              ? x + Math.max(0, width - actualWidth)
              : x
        page.drawText(text, {
          x: drawX,
          y: y - actualSize * 0.87,
          size: actualSize,
          font,
          color: color(mark.color),
        })
      } else if (mark.kind === 'box') {
        page.drawRectangle({
          x,
          y: y - point(mark.height),
          width,
          height: point(mark.height),
          color: mark.fill ? color(mark.fill) : undefined,
          borderColor: mark.stroke ? color(mark.stroke) : undefined,
          borderWidth: mark.stroke ? 0.6 : 0,
          borderDashArray: mark.dashed ? [3, 3] : undefined,
        })
      } else if (mark.kind === 'line') {
        page.drawLine({
          start: { x, y },
          end: { x: x + width, y },
          color: color(mark.color),
          thickness: 0.6,
          dashArray: mark.dashed ? [4, 3] : undefined,
        })
      } else {
        let image = images.get(mark.asset)
        if (!image) {
          image = await document.embedPng(await imageBytes(mark.asset))
          images.set(mark.asset, image)
        }
        page.drawImage(image, {
          x,
          y: y - point(mark.height),
          width,
          height: point(mark.height),
        })
      }
    }
  }
  return new Blob([new Uint8Array(await document.save())], {
    type: 'application/pdf',
  })
}
