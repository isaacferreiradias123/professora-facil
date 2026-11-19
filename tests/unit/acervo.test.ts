import { readFile } from 'node:fs/promises'
import JSZip from 'jszip'
import { PDFDocument } from 'pdf-lib'
import { expect, test } from 'vitest'
import { archiveItems } from '../../src/archive-items'
import { ageBands, classroom } from '../../src/classroom-catalog'

function asset(path: string) {
  return readFile(new URL('../../public/colecao/' + path, import.meta.url))
}

test('registra e serve o acervo completo, com créditos e arquivos válidos', async () => {
  expect(archiveItems).toHaveLength(200)
  expect(new Set(archiveItems.map((item) => item.id)).size).toBe(200)
  expect(classroom.filter((item) => item.id.startsWith('acervo-'))).toHaveLength(200)
  for (const age of ageBands) {
    expect(archiveItems.filter((item) => item.age === age)).toHaveLength(50)
  }
  let worksheets = 0
  let figures = 0
  let presentations = 0
  for (const item of archiveItems) {
    expect(item.id).toMatch(/^acervo-\d{3}$/)
    const ready = item.ready!
    expect(ready.author).toContain('CC0')
    expect(ready.source).toMatch(/^https:\/\//)
    expect(ready.originalPage).toBeTruthy()
    expect((await asset(ready.image)).toString('ascii', 8, 12)).toBe('WEBP')
    const pdf = await PDFDocument.load(await asset(ready.file))
    expect(pdf.getPageCount()).toBe(ready.pages ?? 1)
    for (const page of pdf.getPages()) {
      const dimensions = [page.getWidth(), page.getHeight()].sort((a, b) => a - b)
      expect(dimensions[0]).toBeCloseTo(595.28, 0)
      expect(dimensions[1]).toBeCloseTo(841.89, 0)
    }
    if (ready.figure) {
      figures += 1
      expect((await asset(ready.figure)).subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
    }
    if (ready.presentation) {
      presentations += 1
      const pptx = await JSZip.loadAsync(await asset(ready.presentation))
      expect(pptx.file(/^ppt\/slides\/slide\d+\.xml$/)).toHaveLength(11)
      expect(await pptx.file('ppt/slides/slide2.xml')?.async('string')).toContain('[Nome da criança]')
    } else {
      worksheets += 1
    }
  }
  expect({ worksheets, figures, presentations }).toEqual({
    worksheets: 199,
    figures: 28,
    presentations: 1,
  })
}, 15000)
