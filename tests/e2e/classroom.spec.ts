import { expect, test, type Page } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import JSZip from 'jszip'

const evidence = process.env.PF_CLASSROOM_EVIDENCE
const local = 'http://127.0.0.1:4173/'
test.use({ actionTimeout: 12000 })
test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\//, (route) =>
    route.request().url().startsWith(local) ? route.continue() : route.abort(),
  )
})

async function save(page: Page, label: string, filename: string, link = false) {
  const ready = page.waitForEvent('download')
  await page
    .getByRole(link ? 'link' : 'button', { name: label, exact: true })
    .click()
  const file = await ready
  const data = await readFile((await file.path())!)
  if (evidence) await writeFile(join(evidence, filename), data)
  return data
}
async function showPreview(page: Page) {
  const tab = page.getByRole('button', { name: 'Ver prévia', exact: true })
  if (await tab.isVisible()) await tab.click()
}
async function verifyA4(data: Buffer, count: number) {
  const pdf = await PDFDocument.load(data)
  expect(pdf.getPageCount()).toBe(count)
  for (const page of pdf.getPages()) {
    expect(page.getWidth()).toBeCloseTo(595.28, 1)
    expect(page.getHeight()).toBeCloseTo(841.89, 1)
  }
}
async function docxXml(data: Buffer) {
  return (await JSZip.loadAsync(data))
    .file('word/document.xml')!
    .async('string')
}

test('ficha de Pré II tem contagem ilustrada, tabela editável e roteiro', async ({
  page,
}, info) => {
  const external: string[] = []
  page.on('request', (request) => {
    if (/^https?:/.test(request.url()) && !request.url().startsWith(local))
      external.push(request.url())
  })
  await page.goto('/app/colecao/tabela-de-frutas')
  await expect(
    page.getByRole('heading', { name: 'A feira da turma' }),
  ).toBeVisible()
  await showPreview(page)
  await expect(page.locator('.school-preview img').first()).toBeVisible()
  await verifyA4(await save(page, 'Baixar PDF', 'ficha-pre-ii.pdf'), 2)
  const xml = await docxXml(
    await save(page, 'Baixar Word', 'ficha-pre-ii.docx'),
  )
  expect(xml).toContain('<w:tbl>')
  expect(xml).toContain('<w:drawing>')
  expect(xml).toContain('A feira da turma')
  expect(external).toEqual([])
  if (evidence)
    await page.screenshot({
      path: join(evidence, 'ficha-' + info.project.name + '.png'),
      fullPage: true,
    })
})

test('recado de reunião tem duas vias editáveis e aviso para texto longo', async ({
  page,
}) => {
  await page.goto('/app/colecao/reuniao')
  await page.getByLabel('Data', { exact: true }).fill('2027-03-10')
  await page.getByLabel('Horário', { exact: true }).fill('17:30')
  await page.getByLabel('Local', { exact: true }).fill('Sala da turma')
  await verifyA4(await save(page, 'Baixar PDF', 'reuniao-duas-vias.pdf'), 1)
  const xml = await docxXml(
    await save(page, 'Baixar Word', 'reuniao-duas-vias.docx'),
  )
  expect(xml.match(/Convite para reunião de famílias/g)).toHaveLength(2)
  expect(xml).toContain('Sala da turma')
  await page
    .getByRole('textbox', { name: 'Mensagem', exact: true })
    .fill('Trecho longo para testar a área de impressão. '.repeat(50))
  await expect(page.getByRole('alert')).toContainText('passou do espaço')
  await expect(page.getByRole('button', { name: 'Baixar PDF' })).toBeDisabled()
})

test('boas-vindas tem maquete e quatro folhas com ordem de montagem', async ({
  page,
}, info) => {
  await page.goto('/app/colecao/boas-vindas')
  await page.getByLabel('Turma', { exact: true }).fill('Turma Ipê')
  await showPreview(page)
  await expect(
    page.getByRole('heading', { name: 'Como fica montado' }),
  ).toBeVisible()
  await expect(page.locator('.school-preview .print-paper')).toContainText(
    'Turma Ipê',
  )
  if (evidence)
    await page.screenshot({
      path: join(evidence, 'painel-' + info.project.name + '.png'),
      fullPage: true,
    })
  await page
    .getByRole('button', { name: 'Folha 5 · Linha 2 · Coluna 2' })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Linha 2 · Coluna 2' }),
  ).toBeVisible()
  await verifyA4(await save(page, 'Baixar PDF', 'painel-boas-vindas.pdf'), 5)
  await page.goto('/app/colecao/painel-rotina')
  await showPreview(page)
  await expect(
    page.getByRole('button', { name: 'Folha 2 · Cabeçalho para recortar' }),
  ).toBeVisible()
  await verifyA4(
    await save(page, 'Baixar PDF', 'painel-rotina-cortaveis.pdf'),
    3,
  )
})

test('coleção é navegável por teclado e turma, com PDF pronto e rascunho reaberto', async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 850 })
    await page.goto('/app/colecao?categoria=Atividades')
    await page
      .getByRole('combobox', { name: 'Turma', exact: true })
      .selectOption('Berçário')
    await expect(page.getByRole('status')).toContainText('4 materiais')
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width)
  }
  const search = page.getByRole('searchbox')
  await search.focus()
  await page.keyboard.type('bercario')
  await expect(page.getByRole('status')).toContainText('4 materiais')
  await page
    .getByRole('combobox', { name: 'Turma', exact: true })
    .selectOption('')
  await search.clear()
  await page
    .getByRole('combobox', { name: 'Formato', exact: true })
    .selectOption('pronto')
  await expect(page.getByRole('status')).toContainText('1 material')
  await page.getByRole('link', { name: /Pronto para imprimir/ }).click()
  expect(
    (
      await PDFDocument.load(
        await save(page, 'Baixar PDF', 'frutas-pronto.pdf', true),
      )
    ).getPageCount(),
  ).toBe(1)
  await page.goto('/app/colecao/reuniao')
  await page.getByLabel('Título').fill('Reunião da turma Girassol')
  await page.getByRole('button', { name: 'Salvar rascunho' }).click()
  await expect(
    page.getByText('Rascunho salvo em Meus materiais.'),
  ).toBeVisible()
  await page.goto('/app/materiais')
  await page.getByRole('link', { name: 'Editar', exact: true }).first().click()
  await expect(page.getByLabel('Título')).toHaveValue(
    'Reunião da turma Girassol',
  )
})
