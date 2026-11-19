import { describe, expect, it } from 'vitest'
import { collectionSections, sectionFor } from '../../src/catalog-sections'
import { ageBands, classroom } from '../../src/classroom-catalog'
import {
  assembled,
  buildSheets,
  initialValues,
  noticeFits,
  panelMap,
} from '../../src/classroom-layout'

describe('coleção de sala de aula', () => {
  it('tem pelo menos 20 modelos por seção e a cobertura por turma', () => {
    expect(new Set(classroom.map((item) => item.id)).size).toBe(
      classroom.length,
    )
    for (const section of collectionSections)
      expect(
        classroom.filter((item) => sectionFor(item) === section.id).length,
        section.id,
      ).toBeGreaterThanOrEqual(20)
    for (const age of ageBands) {
      for (const id of ['guided', 'lessons', 'individual', 'collective'])
        expect(
          classroom.filter(
            (item) => item.age === age && sectionFor(item) === id,
          ).length,
          id + ' ' + age,
        ).toBeGreaterThanOrEqual(5)
    }
    for (const age of ['Pré I', 'Pré II'])
      expect(
        classroom.filter(
          (item) =>
            item.age === age && item.task && sectionFor(item) === 'student',
        ).length,
      ).toBeGreaterThanOrEqual(10)
  })
  it('mantém créditos dos arquivos externos e campos editáveis sem chaves duplicadas', () => {
    for (const item of classroom) {
      expect(item.title.trim(), item.id).not.toBe('')
      expect(item.description.trim(), item.id).not.toBe('')
      if (item.ready) {
        expect(item.ready.author, item.id).toContain('CC0')
        expect(item.ready.source, item.id).toMatch(
          /^https:\/\/openclipart\.org\/detail\//,
        )
        expect(item.ready.file, item.id).toMatch(/\.pdf$/)
      } else if (!item.visual) {
        const keys = (item.fields ?? []).map((field) => field.key)
        expect(new Set(keys).size, item.id).toBe(keys.length)
        if (
          ['lessons', 'individual', 'collective', 'school'].includes(
            sectionFor(item),
          )
        )
          expect(keys.length, item.id).toBeGreaterThan(0)
      }
    }
  })
  it('compõe páginas com conteúdo, dimensões válidas e texto padrão que cabe', () => {
    for (const item of classroom.filter(
      (item) => !item.visual && !item.ready,
    )) {
      const values = initialValues(item)
      const sheets = buildSheets(item, values)
      expect(sheets.length, item.id).toBeGreaterThan(0)
      if (item.category === 'Recados')
        expect(noticeFits(item, values), item.id).toBe(true)
      for (const sheet of sheets) {
        expect(sheet.marks.length, item.id).toBeGreaterThan(0)
        for (const mark of sheet.marks) {
          expect(Number.isFinite(mark.y), item.id).toBe(true)
          expect(mark.width, item.id).toBeGreaterThan(0)
        }
      }
    }
  })
  it('deixa os cinco milímetros de encontro em ambos os eixos', () => {
    expect(assembled).toEqual({ width: 375, height: 549 })
    expect(panelMap().map((tile) => [tile.originX, tile.originY])).toEqual([
      [0, 0],
      [185, 0],
      [0, 272],
      [185, 272],
    ])
  })
})
