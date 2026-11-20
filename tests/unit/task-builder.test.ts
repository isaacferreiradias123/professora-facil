import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import { findClassroomItem } from '../../src/classroom-catalog'
import { buildSheets, initialValues } from '../../src/classroom-layout'
import {
  buildTaskSheets,
  buildTaskWord,
  defaultTaskQuestion,
  parseTaskQuestions,
  serializeTaskQuestions,
} from '../../src/task-builder'

describe('task & exam builder engine', () => {
  it('supports all 3 header styles, 6 question kinds, Andika font and CAIXA ALTA', () => {
    const item = findClassroomItem('criar-tarefa')!
    expect(item).toBeDefined()

    const questions = [
      defaultTaskQuestion('section', 1),
      defaultTaskQuestion('lines', 1),
      { ...defaultTaskQuestion('lines', 2), lineStyle: 'caligrafia' as const, lines: 2 },
      defaultTaskQuestion('space', 3),
      defaultTaskQuestion('choice', 4),
      defaultTaskQuestion('tf', 5),
      defaultTaskQuestion('match', 6),
    ]

    for (const headerStyle of ['padrao', 'ludico', 'compacto'] as const) {
      const sheets = buildTaskSheets(item, {
        ...initialValues(item),
        title: 'Avaliação de Alfabetização',
        school: 'E.M. Jardim das Letras',
        teacher: 'Profa. Clara',
        classroom: '1º ano A',
        subject: 'Língua Portuguesa',
        date: '2027-04-12',
        headerStyle,
        showGrade: 'yes',
        totalValue: '10,0',
        sheetFont: 'andika',
        uppercase: 'yes',
        questions: serializeTaskQuestions(questions),
      })
      expect(sheets.length).toBeGreaterThanOrEqual(2)
      expect(sheets[0].font).toBe('andika')
      const joinedText = sheets
        .flatMap((s) => s.marks)
        .filter((m) => m.kind === 'text')
        .map((m) => (m.kind === 'text' ? m.text : ''))
        .join('\n')
      expect(joinedText).toContain('AVALIAÇÃO DE ALFABETIZAÇÃO')
      expect(joinedText).toContain('E.M. JARDIM DAS LETRAS')
      expect(joinedText).toContain('LÍNGUA PORTUGUESA')
      expect(joinedText).toContain('12/04/2027')
      expect(joinedText).toContain('1)')
      expect(joinedText).toContain('6)')
    }
  })

  it('paginates cleanly through buildSheets without dropping questions', () => {
    const item = findClassroomItem('tarefa-questoes-linhas')!
    const many = Array.from({ length: 8 }, (_, idx) => ({
      ...defaultTaskQuestion('lines', idx + 1),
      lines: 5,
    }))
    const sheets = buildSheets(item, {
      ...initialValues(item),
      questions: serializeTaskQuestions(many),
    })
    expect(sheets.length).toBeGreaterThan(1)
    const texts = sheets
      .flatMap((s) => s.marks)
      .filter((m) => m.kind === 'text')
      .map((m) => (m.kind === 'text' ? m.text : ''))
      .join('\n')
    expect(texts).toContain('8)')
  })

  it('validates invalid JSON safely in parseTaskQuestions', () => {
    const item = findClassroomItem('criar-tarefa')!
    const parsed = parseTaskQuestions(item, {
      ...initialValues(item),
      questions: '{broken-json',
    })
    expect(parsed.length).toBeGreaterThan(0)
  })

  it('exports editable Word DOCX with Andika font and structured tables', async () => {
    const item = findClassroomItem('prova-multipla-escolha')!
    const blob = await buildTaskWord(item, {
      ...initialValues(item),
      school: 'Escola Azul',
      teacher: 'Ana',
      subject: 'Matemática',
      sheetFont: 'andika',
      uppercase: 'yes',
    })
    expect(blob.size).toBeGreaterThan(1000)
    const zip = await JSZip.loadAsync(await blob.arrayBuffer())
    const docXml = await zip.file('word/document.xml')!.async('string')
    const stylesXml = await zip.file('word/styles.xml')!.async('string')
    expect(docXml).toContain('ESCOLA AZUL')
    expect(docXml).toContain('MATEMÁTICA')
    expect(stylesXml).toContain('Andika')
  })
})
