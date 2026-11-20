import { expect, test } from '@playwright/test'
import {
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
} from 'docx'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import JSZip from 'jszip'

test('edita o conteúdo na página e mantém a estrutura do DOCX original', async ({
  page,
  browserName,
}) => {
  const image = await readFile('public/colecao/openclipart-regador.png')
  const original = await Packer.toBuffer(
    new Document({
      sections: [
        {
          headers: {
            default: new Header({
              children: [new Paragraph('Escola Sementinha')],
            }),
          },
          footers: {
            default: new Footer({
              children: [new Paragraph('Uso da professora')],
            }),
          },
          children: [
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              text: 'Atividade da turma',
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Começo ', bold: true }),
                new TextRun({ text: 'velho', color: '774411' }),
                new TextRun({ text: ' fim', italics: true }),
              ],
            }),
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph('Célula original')],
                    }),
                  ],
                }),
              ],
            }),
            new Paragraph({
              children: [
                new ImageRun({
                  type: 'png',
                  data: image,
                  transformation: { width: 100, height: 100 },
                }),
              ],
            }),
            new Paragraph({ pageBreakBefore: true, text: 'Segunda folha' }),
          ],
        },
      ],
    }),
  )
  await page.goto('/app/editar-word')
  await page.locator('input[type=file]').setInputFiles({
    name: 'prova-visual.docx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: original,
  })
  await expect(page.getByRole('region', { name: 'Página 2' })).toBeVisible()
  await expect(
    page.getByRole('img', { name: 'Imagem do documento' }),
  ).toBeVisible()
  await page.getByRole('button', { name: /Começo velho fim/ }).click()
  await expect(
    page.getByRole('textbox', { name: 'Texto do trecho' }),
  ).toBeFocused()
  await page
    .getByRole('textbox', { name: 'Texto do trecho' })
    .fill('Começo novo fim')
  await page.getByRole('button', { name: 'Aplicar alteração' }).click()
  await page.getByRole('button', { name: 'Desfazer', exact: true }).click()
  await expect(
    page.getByRole('button', { name: /Começo velho fim/ }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Refazer', exact: true }).click()
  await page.getByRole('button', { name: 'Célula original' }).click()
  await page
    .getByRole('textbox', { name: 'Texto do trecho' })
    .fill('Célula revisada')
  await page.getByRole('button', { name: 'Inserir resposta abaixo' }).click()
  const ready = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Baixar Word editado' }).click()
  const data = await readFile((await (await ready).path())!)
  const zip = await JSZip.loadAsync(data)
  const before = await JSZip.loadAsync(original)
  const xml = await zip.file('word/document.xml')!.async('string')
  expect(xml).toMatch(/<w:b\b[^>]*\/>.*?>Começo <\/w:t>/)
  expect(xml).toMatch(/w:val="774411".*?>novo<\/w:t>/)
  expect(xml).toMatch(/<w:i\b[^>]*\/>.*?> fim<\/w:t>/)
  expect(xml).toContain('Célula revisada')
  expect(xml).toContain('Resposta:')
  expect(xml).toContain('w:pageBreakBefore')
  for (const name of Object.keys(before.files).filter(
    (name) =>
      /word\/(?:header|footer|media\/)/.test(name) && !before.files[name].dir,
  )) {
    expect(await zip.file(name)!.async('uint8array')).toEqual(
      await before.file(name)!.async('uint8array'),
    )
  }
  await page.getByText('Linhas da tabela 1', { exact: true }).click()
  await page.getByRole('button', { name: 'Inserir abaixo da linha 1' }).click()
  await expect(page.getByRole('row')).toHaveCount(2)
  await page.getByText('Tamanho da imagem 1', { exact: true }).click()
  await page.getByRole('button', { name: 'Ampliar 10%' }).click()
  await page.getByRole('button', { name: 'Inserir cabeçalho escolar' }).click()
  await page.getByText('Ajustar margens, cabeçalhos e rodapés').click()
  await page.getByLabel('Esquerda', { exact: true }).fill('25')
  await page.getByRole('button', { name: 'Aplicar margens' }).click()
  for (const [label, value] of [
    ['Cabeçalho', 'Escola Ipê'],
    ['Rodapé', 'Registro da professora'],
  ]) {
    const section = page.getByRole('group', { name: new RegExp(label) })
    await section.getByLabel('Parágrafo 1').fill(value)
    await section.getByRole('button', { name: 'Aplicar trecho' }).click()
  }
  const changed = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Baixar Word editado' }).click()
  const advanced = await readFile((await (await changed).path())!)
  const updated = await JSZip.loadAsync(advanced)
  const body = await updated.file('word/document.xml')!.async('string')
  expect(body).toContain('w:left="1417"')
  expect(body).toContain('cx="1047750"')
  expect(body).toContain('Aluno(a):')
  expect(body.match(/<w:tr>/g)).toHaveLength(2)
  expect(await updated.file('word/header1.xml')!.async('string')).toContain(
    'Escola Ipê',
  )
  expect(await updated.file('word/footer1.xml')!.async('string')).toContain(
    'Registro da professora',
  )
  const evidence = process.env.PF_CLASSROOM_EVIDENCE
  if (evidence && browserName === 'chromium')
    await writeFile(join(evidence, 'prova-word-avancado.docx'), advanced)
  if (evidence && browserName === 'chromium')
    await writeFile(join(evidence, 'prova-word-visual.docx'), data)
})
