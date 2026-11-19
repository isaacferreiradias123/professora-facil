import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { figures } from '../../src/art-figures'
import { tools } from '../../src/catalog'
import { collectionSections, sectionFor } from '../../src/catalog-sections'
import { classroom, findClassroomItem } from '../../src/classroom-catalog'
import {
  buildSheets,
  initialValues,
  mosaicGeometry,
  noticeFits,
  printThemes,
} from '../../src/classroom-layout'

const assetRoot = path.resolve(process.cwd(), 'public/colecao')

function assetExists(name: string) {
  return existsSync(path.join(assetRoot, name))
}

describe('curated classroom collection', () => {
  it('has 69 distinct models with unique IDs and titles across all sections', () => {
    expect(classroom).toHaveLength(69)
    expect(new Set(classroom.map((item) => item.id)).size).toBe(69)
    expect(new Set(classroom.map((item) => item.title)).size).toBe(69)

    const populated = new Set(classroom.map((item) => sectionFor(item)))
    for (const section of collectionSections) {
      expect(populated.has(section.id)).toBe(true)
    }
  })

  it('references only real assets that exist on disk in public/colecao', () => {
    for (const tool of Object.values(tools)) {
      expect(assetExists(tool.image)).toBe(true)
    }
    for (const figure of figures) {
      expect(assetExists(figure.asset)).toBe(true)
    }

    for (const item of classroom) {
      if (item.panel?.art) {
        expect(assetExists(item.panel.art)).toBe(true)
      }
      if (item.ready) {
        expect(assetExists(item.ready.file)).toBe(true)
        expect(assetExists(item.ready.image)).toBe(true)
        continue
      }
      if (item.visual) continue

      const sheets = buildSheets(item, initialValues(item))
      expect(sheets.length).toBeGreaterThan(0)
      for (const sheet of sheets) {
        for (const mark of sheet.marks) {
          if (mark.kind === 'image') {
            expect(assetExists(mark.asset)).toBe(true)
          }
        }
      }
    }
  })

  it('supports all 4 print themes including ink-saver Economico P&B', () => {
    const item = findClassroomItem('tabela-de-frutas')!
    expect(Object.keys(printThemes)).toEqual([
      'jardim',
      'sol',
      'pessego',
      'economico',
    ])
    const bw = buildSheets(item, {
      ...initialValues(item),
      printTheme: 'economico',
    })
    const boxes = bw[0].marks.filter(
      (mark) => mark.kind === 'box' && Boolean(mark.fill),
    )
    expect(boxes.length).toBeGreaterThan(0)
    expect(
      boxes.every(
        (box) =>
          box.kind === 'box' &&
          (box.fill === '#FFFFFF' ||
            box.fill === printThemes.economico.primary ||
            box.fill === printThemes.economico.headerBar),
      ),
    ).toBe(true)
  })

  it('renders trace paths, card memory pairs and lined names worksheets', () => {
    const trace = findClassroomItem('tracado-borboleta')!
    const traceSheets = buildSheets(trace, initialValues(trace))
    const paths = traceSheets[0].marks.filter((mark) => mark.kind === 'path')
    expect(paths.length).toBe(4)

    const customTrace = findClassroomItem('criar-tracado')!
    const threeTracks = buildSheets(customTrace, {
      ...initialValues(customTrace),
      group: 'animals',
      traceCount: '3',
    })
    expect(threeTracks[0].marks.filter((mark) => mark.kind === 'path')).toHaveLength(3)

    const cards = findClassroomItem('rotina-cartoes')!
    const single = buildSheets(cards, initialValues(cards))
    const memory = buildSheets(cards, {
      ...initialValues(cards),
      memoryMode: 'yes',
    })
    expect(single).toHaveLength(2) // cards sheet + professor guide
    expect(memory).toHaveLength(3) // 2 cards sheets + professor guide

    const names = findClassroomItem('jogo-dos-nomes')!
    const nameSheets = buildSheets(names, initialValues(names))
    const lines = nameSheets[0].marks.filter((mark) => mark.kind === 'line')
    expect(lines.length).toBeGreaterThanOrEqual(9)
  })

  it('generates landscape weekly plans with BNCC badges', () => {
    const weekly = findClassroomItem('plano-semanal-maternal')!
    const sheets = buildSheets(weekly, initialValues(weekly))
    expect(sheets).toHaveLength(1)
    expect(sheets[0].size).toEqual({ width: 297, height: 210 })
    const joined = sheets[0].marks
      .filter((m) => m.kind === 'text')
      .map((m) => (m.kind === 'text' ? m.text : ''))
      .join(' ')
    expect(joined).toContain('Segunda')
    expect(joined).toContain('Sexta')
  })

  it('renders checklists, authorization docs, family cards and logbooks', () => {
    const checklist = findClassroomItem('lista-materiais-turma')!
    const checkSheets = buildSheets(checklist, initialValues(checklist))
    expect(
      checkSheets[0].marks.some(
        (m) => m.kind === 'box' && m.width === 4.5 && m.height === 4.5,
      ),
    ).toBe(true)

    const auth = findClassroomItem('autorizacao-imagem-saida')!
    const authSheets = buildSheets(auth, initialValues(auth))
    expect(
      authSheets[0].marks.some(
        (m) => m.kind === 'text' && m.text.includes('Responsável'),
      ),
    ).toBe(true)

    const family = findClassroomItem('sintese-para-familias')!
    const familySheets = buildSheets(family, initialValues(family))
    expect(familySheets[0].marks.some((m) => m.kind === 'image')).toBe(true)

    const logbook = findClassroomItem('diario-de-bordo')!
    const logSheets = buildSheets(logbook, initialValues(logbook))
    expect(logSheets[0].marks.some((m) => m.kind === 'text')).toBe(true)
  })

  it('lays out 1, 2 and 4 notice copies cleanly on A4', () => {
    const notice = findClassroomItem('reuniao')!
    const base = initialValues(notice)

    const oneCopy = buildSheets(notice, { ...base, copies: '1' })
    expect(
      oneCopy[0].marks.filter(
        (m) => m.kind === 'text' && m.text === base.title,
      ),
    ).toHaveLength(1)

    const twoCopies = buildSheets(notice, { ...base, copies: '2' })
    expect(
      twoCopies[0].marks.filter(
        (m) => m.kind === 'text' && m.text === base.title,
      ),
    ).toHaveLength(2)

    const fourCopies = buildSheets(notice, { ...base, copies: '4' })
    expect(
      fourCopies[0].marks.filter(
        (m) => m.kind === 'text' && m.text === base.title,
      ),
    ).toHaveLength(4)
    expect(fourCopies[0].marks.some((m) => m.kind === 'path')).toBe(true)
    expect(noticeFits(notice, { ...base, copies: '4' })).toBe(true)
  })

  it('builds 12-month birthday mosaic with 5 mm overlap and assembly guide', () => {
    const birthday = findClassroomItem('mural-aniversariantes')!
    const geom = mosaicGeometry(birthday)
    expect(geom.overlap).toBe(5)
    expect(geom.paper).toEqual({ width: 297, height: 210 })
    expect(geom.tiles).toHaveLength(4)

    const sheets = buildSheets(birthday, initialValues(birthday))
    expect(sheets).toHaveLength(5) // 1 guide + 4 tiles
    expect(sheets[0].name).toBe('Guia de montagem')
  })
})
