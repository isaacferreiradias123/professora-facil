import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import regularUrl from '@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff?url'
import boldUrl from '@fontsource/noto-sans/files/noto-sans-latin-700-normal.woff?url'
import type { Material } from './model'
export const a4 = [595.28, 841.89] as const
export async function fonts(doc: PDFDocument, withBold = false) {
  doc.registerFontkit(fontkit)
  const load = async (url: string) => {
    const response = await fetch(url)
    if (!response.ok) throw new Error()
    return doc.embedFont(await response.arrayBuffer(), { subset: true })
  }
  const [regular, bold] = await Promise.all([
    load(regularUrl),
    withBold ? load(boldUrl) : undefined,
  ])
  return { regular, bold: bold ?? regular }
}
export function printable(text: string, font: PDFFont) {
  const chars = new Set(font.getCharacterSet())
  return Array.from(text.normalize('NFC'), (c) =>
    c === '\n' || chars.has(c.codePointAt(0)!) ? c : '?',
  ).join('')
}
export function wrapText(
  text: string,
  max: number,
  width: (v: string) => number,
): string[] {
  const result: string[] = []
  for (const paragraph of text.split('\n')) {
    let line = ''
    for (const word of paragraph.trim().split(/\s+/)) {
      if (width((line ? line + ' ' : '') + word) <= max) {
        line += (line ? ' ' : '') + word
        continue
      }
      if (line) result.push(line)
      line = ''
      for (const char of word) {
        if (line && width(line + char) > max) {
          result.push(line)
          line = ''
        }
        line += char
      }
    }
    result.push(line)
  }
  return result
}
export async function pdf(data: Material): Promise<Blob> {
  const doc = await PDFDocument.create()
  doc.setTitle(data.title)
  const { regular, bold } = await fonts(doc, true)
  const ink = rgb(0.15, 0.18, 0.16)
  const accent =
    data.accent === 'peach'
      ? rgb(0.45, 0.24, 0.17)
      : data.accent === 'mono'
        ? ink
        : rgb(0.19, 0.36, 0.28)
  const margin = 56
  const usable = a4[0] - margin * 2
  let page: PDFPage = doc.addPage([...a4])
  let y = a4[1] - margin
  function space(height: number) {
    if (y - height < margin) {
      page = doc.addPage([...a4])
      y = a4[1] - margin
    }
  }
  function lines(text: string, font: PDFFont, size: number, width = usable) {
    return wrapText(printable(text, font), width, (v) =>
      font.widthOfTextAtSize(v, size),
    )
  }
  function write(
    text: string,
    size = 11,
    font = regular,
    color = ink,
    indent = 0,
  ) {
    for (const line of lines(text, font, size, usable - indent)) {
      space(size + 5)
      if (line)
        page.drawText(line, {
          x: margin + indent,
          y: y - size,
          size,
          font,
          color,
        })
      y -= size + 5
    }
    y -= 6
  }
  write(data.title, 24, bold, accent)
  if (data.metadata.length) write(data.metadata.join(' · '), 10)
  for (const section of data.sections) {
    if (section.title) {
      space(lines(section.title, bold, 14).length * 19 + 25)
      y -= 5
      write(section.title, 14, bold, accent)
    }
    for (const block of section.blocks) {
      if (block.kind === 'text') write(block.text)
      else if (block.kind === 'list')
        block.items.forEach((item, i) =>
          write(
            (block.numbered ? String(i + 1) + '. ' : '• ') + item,
            11,
            regular,
            ink,
            10,
          ),
        )
      else if (block.kind === 'table') {
        const columns = Math.max(1, ...block.rows.map((row) => row.length))
        const cellWidth = usable / columns
        for (const row of block.rows) {
          const cells = row.map((cell) =>
            lines(cell, regular, 10, Math.max(10, cellWidth - 12)),
          )
          const length = Math.max(1, ...cells.map((cell) => cell.length))
          let offset = 0
          while (offset < length) {
            const maxLines = Math.floor((a4[1] - 2 * margin - 12) / 14)
            const count = Math.min(length - offset, maxLines)
            const height = count * 14 + 12
            space(height)
            for (let index = 0; index < columns; index++) {
              const x = margin + index * cellWidth
              page.drawRectangle({
                x,
                y: y - height,
                width: cellWidth,
                height,
                borderWidth: 0.5,
                borderColor: rgb(0.7, 0.75, 0.7),
              })
              cells[index]?.slice(offset, offset + count).forEach((line, j) => {
                if (line)
                  page.drawText(line, {
                    x: x + 6,
                    y: y - 15 - j * 14,
                    size: 10,
                    font: regular,
                    color: ink,
                  })
              })
            }
            offset += count
            y -= height
          }
        }
        y -= 8
      } else {
        const img = await (block.mime === 'image/png'
          ? doc.embedPng(block.bytes)
          : doc.embedJpg(block.bytes))
        const scale = Math.min(1, usable / img.width, 350 / img.height)
        const width = img.width * scale,
          height = img.height * scale
        space(height + 10)
        page.drawImage(img, {
          x: margin + (usable - width) / 2,
          y: y - height,
          width,
          height,
        })
        y -= height + 10
      }
    }
  }
  return new Blob([new Uint8Array(await doc.save())], {
    type: 'application/pdf',
  })
}
