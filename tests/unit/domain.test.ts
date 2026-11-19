import { describe, expect, it } from 'vitest'
import { activity, fields, groups, rights } from '../../src/catalog'
import { material, seed, dateLabel } from '../../src/model'
import { fitted, photoPages, tiles, type Photo } from '../../src/media'
import { readValues } from '../../src/draft-transfer'
import { parseMoments } from '../../src/lesson-moments'

describe('Educação Infantil', () => {
  it('cadastra grupos, campos e direitos e aplica experiências por faixa', () => {
    expect([groups.length, fields.length, rights.length]).toEqual([3, 5, 6])
    for (let i = 0; i < activity.length; i++) {
      const v = seed('atividade', i)
      const younger = material('atividade', {
        ...v,
        count: '12',
        group: groups[0],
      }).sections.at(-1)!
      const older = material('atividade', {
        ...v,
        group: groups[2],
      }).sections.at(-1)!
      expect(younger.title).toBe('Experiências e interações')
      expect(younger.blocks[0]).toMatchObject({
        kind: 'list',
        items: expect.arrayContaining([activity[i][3]]),
      })
      if (i < 10)
        expect(older.blocks[0]).toMatchObject({
          kind: 'list',
          items: expect.arrayContaining([activity[i][4]]),
        })
      else {
        expect(older.title).toBe(
          i < 12 ? 'Gabarito para a professora' : 'Folha de atividade',
        )
        if (i < 12) expect(older.newPage).toBe(true)
      }
      expect(JSON.stringify(younger)).not.toContain('undefined')
    }
  })
  it('preserva conteúdo editado e converte datas sem alterar o dia', () => {
    const data = material('plano-de-aula', {
      ...seed('plano-de-aula', 2),
      date: '2026-11-18',
      objectives: 'Exploração e expressão',
    })
    expect(data.metadata).toContain('18/11/2026')
    expect(dateLabel('')).toBe('')
    expect(
      data.sections.find((s) => s.title === 'Objetivos de aprendizagem')
        ?.blocks,
    ).toEqual([{ kind: 'text', text: 'Exploração e expressão' }])
  })
})
describe('Geometria de impressão', () => {
  it('encaixa ou recorta com proporção original', () => {
    expect(fitted(200, 100, 100, 100, false)).toEqual({
      x: 0,
      y: 25,
      width: 100,
      height: 50,
    })
    expect(fitted(200, 100, 100, 100, true)).toEqual({
      x: -50,
      y: 0,
      width: 200,
      height: 100,
    })
  })
  it.each([2, 3])('cria grade %s com sobreposição consistente', (grid) => {
    const { positions, size, width, height } = tiles(grid)
    expect(positions.length).toBe(grid ** 2)
    expect(positions[1].x).toBe(size.width - 16)
    expect(positions[grid].y).toBe(size.height - 16)
    expect(positions.at(-1)!.x + size.width).toBe(width)
    expect(positions.at(-1)!.y + size.height).toBe(height)
  })
})
it('mantém uma quebra explícita sem criar folhas vazias', () => {
  const pictures: Photo[] = Array.from({ length: 7 }, (_, i) => ({
    id: String(i),
    url: '',
    blob: new Blob(),
    caption: '',
    breakBefore: i === 0 || i === 2,
  }))
  expect(
    photoPages(pictures, 4).map((sheet) => sheet.map((picture) => picture.id)),
  ).toEqual([['0', '1'], ['2', '3', '4', '5'], ['6']])
  expect(tiles(4, 2).positions.map((p) => p.y)).toEqual([
    0, 0, 0, 0, 1002, 1002, 1002, 1002,
  ])
})

it('valida campos de cópia e preserva a ordem dos momentos válidos', () => {
  expect(() => readValues(JSON.parse('{"constructor":"x"}'))).toThrow()
  expect(() => readValues({ title: { value: 'inválido' } })).toThrow()
  expect(readValues({ title: 'Coração' })).toEqual({ title: 'Coração' })
  expect(
    parseMoments(
      '[{"title":"Roda","minutes":10},null,{"title":"Brincadeira","minutes":20},{"title":"Inválido","minutes":-1}]',
    ),
  ).toEqual([
    { title: 'Roda', minutes: 10 },
    { title: 'Brincadeira', minutes: 20 },
  ])
})
