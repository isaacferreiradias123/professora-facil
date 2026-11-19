import { describe, expect, it } from 'vitest'
import { ageBands, classroom } from '../../src/classroom-catalog'
import {
  assembled,
  buildSheets,
  initialValues,
  noticeFits,
  panelMap,
} from '../../src/classroom-layout'

describe('coleção de sala de aula', () => {
  it('tem IDs únicos, quatro atividades por turma e duas opções de plano por turma', () => {
    expect(classroom).toHaveLength(43)
    expect(new Set(classroom.map((item) => item.id)).size).toBe(
      classroom.length,
    )
    for (const age of ageBands) {
      expect(
        classroom.filter((item) => item.age === age && item.task),
      ).toHaveLength(4)
      expect(
        classroom.filter(
          (item) => item.age === age && item.tool === 'plano-de-aula',
        ),
      ).toHaveLength(2)
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
