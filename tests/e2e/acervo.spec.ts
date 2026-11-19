import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { PDFDocument } from 'pdf-lib'
import { archiveItems } from '../../src/archive-items'

test('encontra o acervo em português e baixa os oito PDFs A4', async ({ page }) => {
  await page.goto('/app/colecao?ferramenta=atividade')
  await page.getByRole('combobox', { name: 'Turma', exact: true }).selectOption('Maternal')
  await page.getByRole('searchbox').fill('circulo')
  await expect(page.getByRole('link', { name: /Descobrindo o círculo/ })).toBeVisible()
  for (const item of archiveItems) {
    await page.goto('/app/colecao/' + item.id)
    await expect(page.getByRole('heading', { name: item.title })).toBeVisible()
    await expect(page.getByRole('img', { name: item.title })).toBeVisible()
    await expect(page.getByRole('link', { name: /Abby the Pup/ })).toBeVisible()
    const pending = page.waitForEvent('download')
    await page.getByRole('link', { name: 'Baixar PDF' }).click()
    const file = await pending
    const pdf = await PDFDocument.load(await readFile((await file.path())!))
    expect(pdf.getPageCount()).toBe(1)
    expect(pdf.getPage(0).getWidth()).toBeCloseTo(595.28, 0)
    expect(pdf.getPage(0).getHeight()).toBeCloseTo(841.89, 0)
  }
})
