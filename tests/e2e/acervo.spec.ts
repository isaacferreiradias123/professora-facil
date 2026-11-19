import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { PDFDocument } from 'pdf-lib'
import { archiveItems } from '../../src/archive-items'

test('encontra o acervo em português e baixa os PDFs A4 dos oito links existentes', async ({ page }) => {
  await page.goto('/app/colecao?ferramenta=atividade')
  await page.getByRole('combobox', { name: 'Turma', exact: true }).selectOption('Maternal')
  await page.getByRole('searchbox').fill('circulo')
  await expect(page.getByRole('link', { name: /Descobrindo o círculo/ })).toBeVisible()
  for (const item of archiveItems.slice(0, 8)) {
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

test('organiza o acervo integral e preserva a página ao voltar', async ({ page }) => {
  await page.goto('/app/colecao?acervo=pt-br')
  await expect(page.getByRole('heading', { name: 'Acervo em português' })).toBeVisible()
  await expect(page.getByText('200 materiais encontrados')).toBeVisible()
  await expect(page.locator('.school-card')).toHaveCount(24)
  await page.getByRole('combobox', { name: 'Turma', exact: true }).selectOption('Pré II')
  await expect(page.getByText('50 materiais encontrados')).toBeVisible()
  await page.getByRole('button', { name: 'Próxima' }).click()
  await expect(page.getByText('Página 2 de 3')).toBeVisible()
  await page.locator('.school-card a').first().click()
  await page.getByRole('link', { name: 'Escolher outro modelo' }).click()
  await expect(page.getByText('Página 2 de 3')).toBeVisible()
  await page.getByRole('searchbox').fill('certificados')
  await page.getByRole('combobox', { name: 'Tipo de material', exact: true }).selectOption('Certificados editáveis')
  await page.locator('#modelo-acervo-200').click()
  await expect(page.getByRole('link', { name: 'Ver PDF' })).toBeVisible()
  const presentation = page.waitForEvent('download')
  await page.getByRole('link', { name: 'Baixar PowerPoint editável' }).click()
  expect((await presentation).suggestedFilename()).toMatch(/\.pptx$/)
  await page.goto('/app/colecao/acervo-051')
  const figure = page.waitForEvent('download')
  await page.getByRole('link', { name: 'Baixar figura PNG' }).click()
  expect((await figure).suggestedFilename()).toMatch(/\.png$/)
})
