import { expect, test } from '@playwright/test'
import { degrees, PDFDocument } from 'pdf-lib'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

test('posiciona, redimensiona e remove respostas em PDF digitalizado, paisagem e rotacionado', async ({
  page,
  browserName,
}) => {
  const source = await PDFDocument.create()
  const bitmap = await source.embedPng(
    await readFile('public/colecao/openclipart-regador.png'),
  )
  source
    .addPage([595.28, 841.89])
    .drawImage(bitmap, { x: 56, y: 520, width: 240, height: 240 })
  source
    .addPage([841.89, 595.28])
    .drawText('Folha em paisagem', { x: 40, y: 520 })
  source.addPage([595.28, 841.89]).setRotation(degrees(90))
  await page.goto('/app/colecao?ferramenta=documento')
  await page.getByRole('link', { name: 'Escrever por cima no PDF' }).click()
  await page
    .getByLabel('Selecionar arquivo para responder')
    .setInputFiles({
      name: 'tres-folhas.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(await source.save()),
    })
  const start = page.getByRole('button', { name: /Escolher posição na folha/ })
  const answer = page.getByRole('textbox', { name: 'Texto da resposta' })
  const apply = page.getByRole('button', {
    name: 'Inserir resposta',
    exact: true,
  })
  await expect(
    page.getByRole('img', { name: 'Imagem da folha 1' }),
  ).toBeVisible()
  await page.getByLabel('Zoom da página').selectOption('150')
  await start.focus()
  await page.keyboard.press('Enter')
  await answer.fill('Resposta da folha digitalizada.')
  await apply.click()
  await expect(
    page.getByRole('button', {
      name: /Selecionar resposta: Resposta da folha digitalizada/,
    }),
  ).toBeVisible()
  const sheets = page.getByLabel('Folha do PDF')
  await sheets.selectOption('2')
  await start.focus()
  await page.keyboard.press('Enter')
  await answer.fill('Resposta provisória.')
  await apply.click()
  await expect(
    page.getByRole('button', {
      name: /Selecionar resposta: Resposta provisória/,
    }),
  ).toBeVisible()
  await page.getByRole('button', { name: /Remover resposta/ }).click()
  await expect(
    page.getByRole('button', {
      name: /Selecionar resposta: Resposta provisória/,
    }),
  ).toHaveCount(0)
  await sheets.selectOption('3')
  await start.focus()
  await page.keyboard.press('Enter')
  await page.getByLabel('Posição vertical (%)').fill('90')
  await page.getByLabel('Largura da resposta (% da folha)').fill('20')
  await answer.fill(
    'Uma resposta extensa para exercitar a quebra de linha. '.repeat(20),
  )
  await apply.click()
  await expect(page.getByRole('alert')).toContainText('não cabe')
  await page.getByLabel('Posição vertical (%)').fill('22')
  await answer.fill('Resposta da folha rotacionada.')
  await apply.click()
  await expect(
    page.getByRole('button', {
      name: /Selecionar resposta: Resposta da folha rotacionada/,
    }),
  ).toBeVisible()
  await page.getByRole('button', { name: /Mover esta resposta/ }).click()
  await start.click({ position: { x: 80, y: 120 } })
  await expect(
    page.getByRole('button', {
      name: /Selecionar resposta: Resposta da folha rotacionada/,
    }),
  ).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Baixar cópia respondida' }).click()
  const file = await download
  const result = await PDFDocument.load(await readFile((await file.path())!))
  expect(result.getPageCount()).toBe(3)
  expect(result.getPage(1).getWidth()).toBeCloseTo(841.89, 1)
  expect(result.getPage(2).getRotation().angle).toBe(90)
  const evidence = process.env.PF_CLASSROOM_EVIDENCE
  if (evidence && browserName === 'chromium')
    await file.saveAs(join(evidence, 'prova-pdf-rotacionado.pdf'))
})
