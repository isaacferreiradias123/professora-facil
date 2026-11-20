import { PDFDocument, rgb, type PDFImage } from 'pdf-lib'
import { fonts, printable, type SheetFont } from './pdf-core'
import { assetUrl, localDate, paper, type Sheet } from './sheet-core'

const point = (mm: number) => (mm * 72) / 25.4

function color(hex: string) {
  return rgb(
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  )
}

function isJpegBytes(bytes: Uint8Array) {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
}

export async function imageBytes(asset: string): Promise<Uint8Array> {
  if (
    asset.startsWith('data:image/png') ||
    asset.startsWith('data:image/jpeg') ||
    asset.startsWith('data:image/jpg') ||
    asset.endsWith('.png') ||
    asset.endsWith('.jpg') ||
    asset.endsWith('.jpeg')
  ) {
    const result = await fetch(assetUrl(asset))
    if (!result.ok) throw new Error('Imagem indisponível: ' + asset)
    return new Uint8Array(await result.arrayBuffer())
  }
  const image = new Image()
  image.src = assetUrl(asset)
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth || 200
  canvas.height = image.naturalHeight || 200
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
  const fontCache = new Map<SheetFont, Awaited<ReturnType<typeof fonts>>>()
  async function getFace(family: SheetFont = 'noto') {
    let cached = fontCache.get(family)
    if (!cached) {
      cached = await fonts(document, true, family)
      fontCache.set(family, cached)
    }
    return cached
  }
  const images = new Map<string, PDFImage>()
  for (const sheet of sheets) {
    const size = sheet.size ?? paper
    const page = document.addPage([point(size.width), point(size.height)])
    const face = await getFace(sheet.font ?? 'noto')
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
          const bytes = await imageBytes(mark.asset)
          image = isJpegBytes(bytes)
            ? await document.embedJpg(bytes)
            : await document.embedPng(bytes)
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

export async function stampHeaderOnPdf(
  pdfAsset: string,
  header: {
    school?: string
    teacher?: string
    classroom?: string
    date?: string
    studentLine?: boolean
  },
): Promise<Blob> {
  const response = await fetch(assetUrl(pdfAsset))
  if (!response.ok) throw new Error('PDF indisponível para personalizar.')
  const document = await PDFDocument.load(new Uint8Array(await response.arrayBuffer()))
  const face = await fonts(document, true, 'noto')
  const page = document.getPages()[0]
  if (page) {
    const { width, height } = page.getSize()
    const margin = 24
    const boxW = width - margin * 2
    const bandH = header.studentLine === false ? 32 : 48
    const boxY = height - bandH - 12
    page.drawRectangle({
      x: margin,
      y: boxY,
      width: boxW,
      height: bandH,
      color: rgb(0.99, 0.99, 0.97),
      borderColor: rgb(0.65, 0.74, 0.69),
      borderWidth: 0.7,
    })
    page.drawRectangle({
      x: margin,
      y: boxY,
      width: 4,
      height: bandH,
      color: rgb(0.12, 0.34, 0.26),
    })
    const meta = [
      header.school?.trim() || 'Atividade Escolar',
      header.classroom?.trim(),
      header.teacher?.trim() ? 'Prof. ' + header.teacher.trim() : '',
      localDate(header.date?.trim() || ''),
    ]
      .filter(Boolean)
      .join(' · ')
    const topText = printable(meta, face.bold)
    page.drawText(topText, {
      x: margin + 12,
      y: boxY + bandH - 16,
      size: 10,
      font: face.bold,
      color: rgb(0.12, 0.34, 0.26),
      maxWidth: boxW - 22,
    })
    if (header.studentLine !== false) {
      const student = printable('Aluno(a): ___________________________________________   Data: ___/___/_____', face.regular)
      page.drawText(student, {
        x: margin + 12,
        y: boxY + 10,
        size: 9.5,
        font: face.regular,
        color: rgb(0.15, 0.2, 0.18),
        maxWidth: boxW - 22,
      })
    }
  }
  return new Blob([new Uint8Array(await document.save())], {
    type: 'application/pdf',
  })
}
