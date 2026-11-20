import { expect, test } from '@playwright/test'
import { mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import JSZip from 'jszip'
import { PDFDocument } from 'pdf-lib'

const local = 'http://127.0.0.1:4173/'
const evidence = process.env.PF_CLASSROOM_EVIDENCE

test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\//, (route) =>
    route.request().url().startsWith(local) ? route.continue() : route.abort(),
  )
})

test('cria tarefa completa com cabeçalho, escola salva, questões variadas, Caixa Alta, Andika, modal e PDF/Word', async ({
  page,
}) => {
  const errors: string[] = []
  const failed: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('response', (res) => {
    if (res.status() >= 400) failed.push(`${res.status()} ${res.url()}`)
  })

  await page.goto('/app')
  if (evidence) {
    await mkdir(evidence, { recursive: true })
    await page.screenshot({
      path: join(evidence, 'dashboard-' + page.viewportSize()?.width + '.png'),
      fullPage: true,
    })
  }
  await page.getByText('Meus dados da escola').click()
  await page.getByLabel('Nome da escola').fill('E.M. Monteiro Lobato')
  await page.getByLabel('Seu nome (Professora)').fill('Marina')
  await page.getByLabel('Turma padrão').fill('2º ano A')
  await page.getByRole('button', { name: 'Salvar dados da escola' }).click()
  await expect(page.getByText('Dados da escola salvos neste dispositivo.')).toBeVisible()

  await page.getByRole('link', { name: /Montar tarefa ou prova/i }).first().click()
  await expect(page).toHaveURL(/\/app\/colecao\/criar-tarefa/)

  await page.getByRole('button', { name: 'Preencher com minha escola' }).click()
  await expect(page.getByLabel('Escola', { exact: true })).toHaveValue('E.M. Monteiro Lobato')
  await expect(page.getByLabel('Professora', { exact: true })).toHaveValue('Marina')

  await page.getByLabel('Matéria / Disciplina').fill('Língua Portuguesa')
  await page.getByLabel('Data', { exact: true }).fill('2027-05-18')
  await page.getByLabel('Mostrar quadro de Nota / Valor no cabeçalho').check()
  await page.getByLabel('Usar letra de alfabetização (Andika)').check()
  await page.getByLabel('TUDO EM CAIXA ALTA (letra bastão)').check()

  await page.getByRole('button', { name: '+ Com linhas' }).click()
  await page.getByRole('button', { name: '+ Espaço desenho/cálculo' }).click()
  await page.getByRole('button', { name: '+ Múltipla escolha' }).click()
  await page.getByRole('button', { name: '+ Verdadeiro / Falso' }).click()
  await page.getByRole('button', { name: '+ Ligue as colunas' }).click()

  const previewTab = page.getByRole('button', { name: 'Ver prévia', exact: true })
  if (await previewTab.isVisible()) await previewTab.click()

  await expect(page.locator('.paper-font-andika')).toBeVisible()
  await expect(page.getByText('E.M. MONTEIRO LOBATO')).toBeVisible()
  if (evidence) {
    await mkdir(evidence, { recursive: true })
    await page.screenshot({
      path: join(evidence, 'task-builder-' + page.viewportSize()?.width + '.png'),
      fullPage: true,
    })
  }

  await page.getByRole('button', { name: 'Ampliar folha' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()

  const pdfEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Baixar PDF', exact: true }).click()
  const pdfFile = await pdfEvent
  const pdf = await PDFDocument.load(await readFile((await pdfFile.path())!))
  expect(pdf.getPageCount()).toBeGreaterThanOrEqual(2)

  const wordEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Baixar Word', exact: true }).click()
  const wordFile = await wordEvent
  const zip = await JSZip.loadAsync(await readFile((await wordFile.path())!))
  const docXml = await zip.file('word/document.xml')!.async('string')
  expect(docXml).toContain('E.M. MONTEIRO LOBATO')
  expect(docXml).toContain('LÍNGUA PORTUGUESA')

  expect(errors).toEqual([])
  expect(failed).toEqual([])
})

test('estampa cabeçalho em PDF do acervo e abre direto para responder por cima', async ({
  page,
}) => {
  await page.goto('/app/colecao/acervo-001')
  await page.getByText('Personalizar cabeçalho neste PDF').click()
  await page.getByLabel('Escola', { exact: true }).fill('E.M. Arco-Íris')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Baixar PDF com meu cabeçalho' }).click()
  const file = await downloadPromise
  const pdf = await PDFDocument.load(await readFile((await file.path())!))
  expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1)

  await page.getByRole('link', { name: 'Escrever por cima no PDF' }).click()
  await expect(page).toHaveURL(/\/app\/responder\?tipo=pdf&acervo=acervo-001/)
  await expect(page.getByRole('img', { name: 'Imagem da folha 1' })).toBeVisible()
})

test('Lousa tem alto contraste em todas as composições e /app/ajuda tem passos bem espaçados', async ({
  page,
}) => {
  await page.goto('/app/criar/postagem')
  await page.getByText('Paleta de cores').click()
  await page.getByRole('button', { name: 'Lousa' }).click()
  const previewBtn = page.getByRole('button', { name: 'Ver prévia', exact: true })
  if (await previewBtn.isVisible()) await previewBtn.click()
  const contrastCheck = await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('.art-preview')
    if (!canvas) return { hasBrightPixel: false, centerDark: false }
    const ctx = canvas.getContext('2d')!
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    let bright = 0
    for (let i = 0; i < data.length; i += 40) {
      if (data[i] > 210 && data[i + 1] > 210 && data[i + 2] > 200) bright += 1
    }
    const center = ctx.getImageData(
      Math.floor(canvas.width / 2),
      Math.floor(canvas.height * 0.45),
      1,
      1,
    ).data
    return {
      hasBrightPixel: bright > 10,
      centerDark: center[0] < 90 && center[1] < 100 && center[2] < 90,
    }
  })
  expect(contrastCheck.hasBrightPixel).toBe(true)
  expect(contrastCheck.centerDark).toBe(true)
  if (evidence) {
    await mkdir(evidence, { recursive: true })
    await page.screenshot({
      path: join(evidence, 'lousa-postagem-' + page.viewportSize()?.width + '.png'),
      fullPage: true,
    })
  }

  await page.goto('/app/ajuda')
  await expect(page.locator('.steps-public .step-badge')).toHaveCount(3)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  if (evidence) {
    await mkdir(evidence, { recursive: true })
    await page.screenshot({
      path: join(evidence, 'ajuda-' + page.viewportSize()?.width + '.png'),
      fullPage: true,
    })
  }
})
