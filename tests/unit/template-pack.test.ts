import { expect, it } from 'vitest'
import {
  loadPack,
  packTools,
  presetValues,
  worksheetUrl,
} from '../../src/template-pack'
import { material, seed } from '../../src/model'
import { parseMoments } from '../../src/lesson-moments'

it('valida e prepara os 327 modelos da coleção', async () => {
  const items = (await Promise.all(packTools.map(loadPack))).flat()
  expect(items).toHaveLength(327)
  expect(new Set(items.map((item) => item.id)).size).toBe(327)
  const sheets = items.filter((item) => worksheetUrl(item.values.asset))
  expect(new Set(sheets.map((item) => item.values.asset)).size).toBe(18)
  for (const item of items) {
    const values = presetValues(seed(item.tool, 0), item)
    expect(values.templateId).toBe(item.id)
    expect(values.title).toBe(item.values.title)
    if (item.tool === 'plano-de-aula')
      expect(parseMoments(values.moments).length).toBeGreaterThan(0)
    if (item.tool === 'atividade') {
      const doc = material(item.tool, values)
      expect(doc.sections.some((section) => section.title === 'Objetivo')).toBe(
        true,
      )
    }
  }
  expect(worksheetUrl('../fora.svg')).toBeUndefined()
})
