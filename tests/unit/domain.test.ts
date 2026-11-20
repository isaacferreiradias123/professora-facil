import { describe, expect, it } from 'vitest'
import { figureUrl, figures } from '../../src/art-figures'
import {
  fields,
  groups,
  observationHints,
  rights,
  tools,
} from '../../src/catalog'
import {
  fallbackClassroomId,
  findClassroomItem,
} from '../../src/classroom-catalog'
import { readValues } from '../../src/draft-transfer'
import { validateZip } from '../../src/import-document'
import { photoLayout, photoPages, tiles, type Photo } from '../../src/media'

describe('catalog & pedagogy taxonomy', () => {
  it('exposes complete BNCC groups, fields, rights and 7 tools', () => {
    expect(groups).toHaveLength(4)
    expect(fields).toHaveLength(5)
    expect(rights).toHaveLength(6)
    expect(Object.keys(tools)).toEqual([
      'atividade',
      'plano-de-aula',
      'relatorio',
      'documento',
      'fotos-em-pdf',
      'postagem',
      'painel',
    ])
    expect(observationHints['Berçário'].length).toBeGreaterThanOrEqual(4)
    expect(observationHints['Maternal'].length).toBeGreaterThanOrEqual(4)
    expect(observationHints['Pré I'].length).toBeGreaterThanOrEqual(4)
    expect(observationHints['Pré II'].length).toBeGreaterThanOrEqual(4)
    expect(observationHints['Fundamental I'].length).toBeGreaterThanOrEqual(4)
  })

  it('provides studio illustrations with unique IDs and resolved URLs', () => {
    expect(figures).toHaveLength(26)
    expect(new Set(figures.map((f) => f.id)).size).toBe(figures.length)
    for (const fig of figures) {
      expect(figureUrl(fig.id)).toContain('colecao/' + fig.asset)
    }
    expect(figureUrl('inexistente')).toBeUndefined()
  })

  it('resolves free builders and valid fallbackClassroomId per tool', () => {
    for (const customId of [
      'criar-tarefa',
      'criar-contagem',
      'criar-pares',
      'criar-tracado',
    ]) {
      const item = findClassroomItem(customId)
      expect(item).toBeDefined()
      expect(item?.tool).toBe('atividade')
    }
    for (const tool of Object.keys(tools) as (keyof typeof tools)[]) {
      const targetId = fallbackClassroomId(tool)
      const target = findClassroomItem(targetId)
      expect(target).toBeDefined()
      expect(target?.tool).toBe(tool)
    }
  })
})

describe('visual layout & security guards', () => {
  it('paginates photos honoring perPage and explicit page breaks', () => {
    const sample = (n: number): Photo[] =>
      Array.from({ length: n }, (_, index) => ({
        id: 'p' + index,
        url: '',
        blob: new Blob(),
        caption: '',
        breakBefore: index === 2,
      }))
    const pages = photoPages(sample(5), 4)
    expect(pages.map((p) => p.length)).toEqual([2, 3])

    const layout = photoLayout({
      orientation: 'vertical',
      perPage: 4,
      margin: 10,
      crop: false,
      quality: 'standard',
      header: 'Semana de artes',
      numbering: true,
    })
    expect(layout.width).toBeGreaterThan(200)
    expect(layout.height).toBeGreaterThan(250)
    expect(layout.x(1)).toBeGreaterThan(layout.x(0))
    expect(layout.y(2)).toBeGreaterThan(layout.y(0))
  })

  it('computes poster tile positions cleanly', () => {
    const grid = tiles(2)
    expect(grid.positions).toHaveLength(4)
    expect(grid.positions[1].x).toBe(grid.size.width - 16)
    expect(grid.positions[2].y).toBe(grid.size.height - 16)

    const strip = tiles(3, 1)
    expect(strip.positions).toHaveLength(3)
    expect(strip.positions.every((p) => p.y === 0)).toBe(true)
  })

  it('validates imported draft values and zip envelopes safely', () => {
    expect(readValues({ title: 'Bilhete', body: 'Texto' })).toEqual({
      title: 'Bilhete',
      body: 'Texto',
    })
    expect(() => readValues([])).toThrow()
    expect(() => readValues({ constructor: 'x' })).toThrow()
    expect(() => readValues({ title: 'a'.repeat(241) })).toThrow()
    expect(() => validateZip(new Uint8Array([1, 2, 3]))).toThrow()
  })
})
