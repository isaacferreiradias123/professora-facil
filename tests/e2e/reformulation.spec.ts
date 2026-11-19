import { expect, test } from '@playwright/test'
import { PDFDocument } from 'pdf-lib'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const evidence = process.env.PF_CLASSROOM_EVIDENCE

test('mostra a Home e navega de volta ao painel com filtro e foco restaurados', async ({
  page,
  browserName,
}) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 850 })
    await page.goto('/')
    await expect(
      page.getByRole('heading', {
        name: 'Materiais para usar com a sua turma.',
      }),
    ).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width)
    if (evidence && browserName === 'chromium')
      await page.screenshot({
        path: join(evidence, 'home-' + width + '.png'),
        fullPage: true,
      })
  }
  await page.goto('/app/colecao?ferramenta=painel')
  await page.getByLabel('Seção da ferramenta').selectOption('mosaics')
  await page.getByLabel('Painel montado').selectOption('horizontal')
  await expect(page).toHaveURL(/orientacao=horizontal/)
  await page.getByRole('searchbox').fill('semana das descobertas')
  const card = page.getByRole('link', { name: /Faixa semana das descobertas/ })
  await card.click()
  const preview = page.getByRole('button', {
    name: 'Ver prévia',
    exact: true,
  })
  if (await preview.isVisible()) await preview.click()
  await expect(
    page.getByRole('heading', { name: 'Como fica montado' }),
  ).toBeVisible()
  await expect(page.getByText(/Painel horizontal/)).toBeVisible()
  await page.getByRole('link', { name: 'Escolher outro modelo' }).click()
  await expect(page.getByRole('searchbox')).toHaveValue(
    'semana das descobertas',
  )
  await expect(page.getByLabel('Painel montado')).toHaveValue('horizontal')
  await expect(card).toBeFocused()
})

test('exporta faixas, mosaicos em paisagem e painéis em retrato pela mesma prévia', async ({
  page,
  browserName,
}) => {
  for (const [id, sheets, landscape] of [
    ['mural-semana-descobertas', 4, false],
    ['mural-ciclo-borboleta', 5, true],
    ['mural-tempo', 5, false],
    ['mural-aniversariantes', 5, true],
  ] as const) {
    await page.goto('/app/colecao/' + id)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const preview = page.getByRole('button', {
      name: 'Ver prévia',
      exact: true,
    })
    if (await preview.isVisible()) await preview.click()
    await expect(
      page.getByRole('heading', { name: 'Como fica montado' }),
    ).toBeVisible()
    const pending = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Baixar PDF', exact: true }).click()
    const downloaded = await pending
    const pdf = await PDFDocument.load(
      await readFile((await downloaded.path())!),
    )
    expect(pdf.getPageCount()).toBe(sheets)
    for (const sheet of pdf.getPages().slice(1))
      expect(sheet.getWidth() > sheet.getHeight()).toBe(landscape)
    if (evidence && browserName === 'chromium')
      await downloaded.saveAs(join(evidence, 'mosaico-prova-' + id + '.pdf'))
  }
})
