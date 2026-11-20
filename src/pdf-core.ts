import { PDFDocument, type PDFFont } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import regularUrl from '@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff?url'
import boldUrl from '@fontsource/noto-sans/files/noto-sans-latin-700-normal.woff?url'
import andikaRegularUrl from '@fontsource/andika/files/andika-latin-400-normal.woff?url'
import andikaBoldUrl from '@fontsource/andika/files/andika-latin-700-normal.woff?url'
export { a4Points as a4 } from './media'

export type SheetFont = 'noto' | 'andika'

export async function fonts(
  doc: PDFDocument,
  withBold = false,
  family: SheetFont = 'noto',
) {
  doc.registerFontkit(fontkit)
  const load = async (url: string) => {
    const response = await fetch(url)
    if (!response.ok) throw new Error()
    return doc.embedFont(await response.arrayBuffer(), { subset: true })
  }
  const regSrc = family === 'andika' ? andikaRegularUrl : regularUrl
  const boldSrc = family === 'andika' ? andikaBoldUrl : boldUrl
  const [regular, bold] = await Promise.all([
    load(regSrc),
    withBold ? load(boldSrc) : undefined,
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
