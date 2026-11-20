import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import JSZip from 'jszip'

const evidence = process.env.PF_EVIDENCE
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==',
  'base64',
)

test.use({ actionTimeout: 12000 })

test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\//, (route) =>
    route.request().url().startsWith('http://127.0.0.1:4173/')
      ? route.continue()
      : route.abort(),
  )
})

async function download(page: Page, label: string) {
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: label, exact: true }).click()
  const file = await pending
  const path = await file.path()
  expect(path).toBeTruthy()
  return readFile(path!)
}

async function previewIfMobile(page: Page) {
  await page.locator('.adjust-layout').waitFor({ state: 'visible' })
  const button = page.getByRole('button', { name: 'Ver prévia', exact: true })
  if (await button.isVisible()) {
    await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'true')
  }
}

async function editIfMobile(page: Page) {
  await page.locator('.adjust-layout').waitFor({ state: 'visible' })
  const button = page.getByRole('button', { name: 'Editar', exact: true })
  if (
    (await button.isVisible()) &&
    (await button.getAttribute('aria-pressed')) !== 'true'
  ) {
    await button.click()
  }
}

test('páginas, larguras, redirecionamentos e acessibilidade', async ({
  page,
}, info) => {
  if (evidence && info.project.name === 'chromium') {
    await mkdir(evidence, { recursive: true })
  }
  const errors: string[] = []
  const external: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('request', (req) => {
    if (
      !req.url().startsWith('http://127.0.0.1:4173/') &&
      !req.url().startsWith('blob:') &&
      !req.url().startsWith('data:')
    )
      external.push(req.url())
  })

  for (const [path, title] of [
    ['/', 'Materiais para usar com a sua turma'],
    ['/como-funciona', 'Como funciona'],
    ['/ajuda', 'Como podemos ajudar\\?'],
    ['/sobre', 'Sobre o Professora Fácil'],
    ['/privacidade', 'Privacidade'],
    ['/termos', 'Termos de uso'],
  ]) {
    expect((await page.goto(path))?.ok()).toBeTruthy()
    await expect(
      page.getByRole('heading', { level: 1, name: new RegExp(title) }),
    ).toBeVisible()
  }

  // Legacy /app/modelos redirects cleanly to curated /app/colecao
  await page.goto('/app/modelos')
  await expect(page).toHaveURL(/\/app\/colecao$/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Modelos da coleção' }),
  ).toBeVisible()

  for (const width of [320, 360, 390, 430, 768, 1440]) {
    await page.setViewportSize({ width, height: 850 })
    for (const path of [
      '/',
      '/app',
      '/app/colecao',
      '/app/colecao/plano-animais',
    ]) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBeTruthy()
      if (
        evidence &&
        info.project.name === 'chromium' &&
        ([390, 1440].includes(width) || (path === '/app' && width === 320))
      ) {
        const slug =
          path === '/' ? 'inicio' : path.replace(/^\/+/, '').replace(/\//g, '-')
        await page.screenshot({
          path: join(evidence, `chromium-${slug}-${width}.png`),
          fullPage: true,
        })
      }
    }
  }

  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
  if (info.project.name === 'webkit') {
    await skip.focus()
  } else {
    await page.keyboard.press('Tab')
  }
  await expect(skip).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()

  await page.getByRole('link', { name: 'Criar um material' }).first().click()
  await expect(
    page.getByRole('heading', { name: 'Olá! O que vamos preparar hoje?' }),
  ).toBeVisible()
  await expect(page.getByText('Modelos anteriores')).toHaveCount(0)
  await expect(page.getByText('Modo Fácil')).toHaveCount(0)

  for (const route of ['/app', '/app/colecao/tabela-de-frutas']) {
    await page.goto(route)
    const audit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(
      audit.violations.map((x) => ({
        id: x.id,
        nodes: x.nodes.map((n) => n.target),
      })),
    ).toEqual([])
  }
  expect(errors).toEqual([])
  expect(external).toEqual([])
})

test('atividade, Word/PDF em português, rascunho e limpeza', async ({
  page,
}, info) => {
  await page.goto('/app/colecao/tabela-de-frutas')
  await page
    .getByLabel('Título', { exact: true })
    .fill('Ação, emoção, café e corações')
  await previewIfMobile(page)
  await expect(page.locator('.school-preview')).toContainText(
    'Ação, emoção, café e corações',
  )

  const docx = await download(page, 'Baixar Word')
  const archive = await JSZip.loadAsync(docx)
  expect(await archive.file('word/document.xml')!.async('string')).toContain(
    'Ação, emoção, café e corações',
  )
  const pdf = await download(page, 'Baixar PDF')
  const parsed = await PDFDocument.load(pdf)
  expect(parsed.getPageCount()).toBeGreaterThan(0)
  expect(parsed.getPage(0).getWidth()).toBeCloseTo(595.28)

  if (evidence && info.project.name === 'chromium') {
    await mkdir(evidence, { recursive: true })
    await page.screenshot({
      path: join(evidence, 'chromium-atividade.png'),
      fullPage: true,
    })
    await writeFile(join(evidence, 'atividade-exemplo.docx'), docx)
    await writeFile(join(evidence, 'atividade-exemplo.pdf'), pdf)
  }

  await page.getByRole('button', { name: 'Salvar rascunho' }).click()
  await expect(page.getByRole('status')).toContainText('Rascunho salvo')
  await page.getByRole('link', { name: 'Materiais', exact: true }).click()
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Ação, emoção, café e corações' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Renomear' }).click()
  await page.getByLabel('Novo nome').fill('Atividade da turma Ipê')
  await page.getByRole('button', { name: 'Salvar nome' }).click()
  await page.getByRole('button', { name: 'Duplicar' }).click()
  await expect(
    page.getByRole('heading', { name: 'Cópia de Atividade da turma Ipê' }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Excluir', exact: true })
    .first()
    .click()
  await page.getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByRole('status')).toContainText('Material excluído')
  await page.getByRole('link', { name: 'Editar', exact: true }).click()
  await expect(page.getByLabel('Título', { exact: true })).toHaveValue(
    'Ação, emoção, café e corações',
  )

  await page.goto('/app/colecao?ferramenta=documento')
  await page.getByRole('link', { name: 'Escrever por cima no PDF', exact: true }).click()
  await page.getByLabel('Selecionar arquivo para responder').setInputFiles({
    name: 'teste.pdf',
    mimeType: 'application/pdf',
    buffer: pdf,
  })
  await expect(
    page.getByRole('button', { name: 'Escolher posição na folha 1' }),
  ).toBeVisible()

  await page.goto('/app/responder')
  await page.getByLabel('Selecionar arquivo para responder').setInputFiles({
    name: 'teste.docx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: docx,
  })
  await expect(
    page.getByRole('button', { name: 'Ação, emoção, café e corações' }),
  ).toBeVisible()

  await page.getByRole('link', { name: 'Materiais', exact: true }).click()
  await page.getByRole('button', { name: 'Limpar dados locais' }).click()
  await page.getByRole('button', { name: 'Confirmar' }).click()
  await expect(
    page.getByRole('heading', { name: 'Seu primeiro material começa aqui' }),
  ).toBeVisible()
})

test('arquivos incompatíveis no responder e em fotos', async ({ page }) => {
  await page.goto('/app/responder')
  const input = page.getByLabel('Selecionar arquivo para responder')
  await input.setInputFiles({
    name: 'invalido.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('conteúdo inválido'),
  })
  await expect(page.getByRole('alert')).toContainText('PDF ou DOCX válido')

  await input.setInputFiles({
    name: 'grande.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.alloc(13 * 1024 * 1024),
  })
  await expect(page.getByRole('alert')).toContainText('12 MB')

  await page.goto('/app/criar/fotos-em-pdf')
  await page.getByLabel('Selecionar fotos').setInputFiles({
    name: 'invalida.png',
    mimeType: 'image/png',
    buffer: Buffer.from('texto'),
  })
  await expect(page.getByRole('alert')).toContainText('não corresponde')
})

test('prepara um PDF local para a opção Imprimir', async ({ page }) => {
  await page.goto('/app/colecao/tabela-de-frutas')
  await page.getByRole('button', { name: 'Imprimir', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Arquivo preparado.')
  const frame = page.locator('iframe[title="Documento para impressão"]')
  await expect(frame).toHaveAttribute('src', /^blob:/)
  const pdfHeader = await page.evaluate(
    async (url) => {
      const file = await (await fetch(url)).blob()
      return { type: file.type, signature: await file.slice(0, 5).text() }
    },
    (await frame.getAttribute('src'))!,
  )
  expect(pdfHeader).toEqual({ type: 'application/pdf', signature: '%PDF-' })
})

test('18 fotos, reordenação, legenda, Polaroid e três distribuições A4', async ({
  page,
}, info) => {
  await page.goto('/app/criar/fotos-em-pdf')
  const photos = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    return Array.from({ length: 18 }, (_, index) => {
      canvas.width = index % 2 ? 1536 : 2048
      canvas.height = index % 2 ? 2048 : 1536
      const gradient = context.createLinearGradient(
        0,
        0,
        canvas.width,
        canvas.height,
      )
      gradient.addColorStop(0, 'hsl(' + index * 20 + ',50%,75%)')
      gradient.addColorStop(1, '#faf7f0')
      context.fillStyle = gradient
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = '#252e29'
      context.font = 'bold 160px sans-serif'
      context.fillText(String(index + 1), 160, 250)
      return canvas.toDataURL('image/jpeg', 0.9).split(',')[1]
    })
  })
  await page.getByLabel('Selecionar fotos').setInputFiles(
    photos.map((photo, index) => ({
      name: 'foto-' + (index + 1) + '.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from(photo, 'base64'),
    })),
  )
  await expect(
    page.getByText('18 de 24 fotos selecionadas.', { exact: false }),
  ).toBeVisible()
  await page
    .getByLabel('Legenda da foto 1', { exact: true })
    .fill('Atenção e participação')
  await page.getByRole('button', { name: 'Descer foto 1', exact: true }).click()
  await expect(
    page.getByLabel('Legenda da foto 2', { exact: true }),
  ).toHaveValue('Atenção e participação')

  for (const [count, pages] of [
    [1, 18],
    [2, 9],
    [4, 5],
  ]) {
    await editIfMobile(page)
    await page.getByLabel('Fotos por folha').selectOption(String(count))
    await page
      .getByLabel('Orientação do A4')
      .selectOption(count === 2 ? 'horizontal' : 'vertical')
    if (count === 4) {
      await page.getByLabel('Estilo da moldura').selectOption('yes')
    }
    await previewIfMobile(page)
    await expect(
      page.getByText(new RegExp('^' + pages + ' folhas A4')),
    ).toBeVisible()
    const bytes = await download(page, 'Baixar PDF')
    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPageCount()).toBe(pages)
    expect(pdf.getPage(0).getWidth()).toBeCloseTo(count === 2 ? 841.89 : 595.28)
    if (evidence && count === 4 && info.project.name === 'chromium') {
      await mkdir(evidence, { recursive: true })
      await page.screenshot({
        path: join(evidence, 'chromium-18-fotos.png'),
        fullPage: true,
      })
      await writeFile(join(evidence, '18-fotos-exemplo.pdf'), bytes)
    }
  }
})

test('gira foto, insere quebra de folha e ajusta recorte', async ({ page }) => {
  await page.goto('/app/criar/fotos-em-pdf')
  const photos = Array.from({ length: 4 }, (_, i) => ({
    name: 'foto-' + i + '.png',
    mimeType: 'image/png',
    buffer: png,
  }))
  await page.getByLabel('Selecionar fotos').setInputFiles(photos)
  await expect(page.getByText(/4 de 24 fotos selecionadas/)).toBeVisible()
  await page.getByRole('button', { name: 'Girar foto 1' }).click()
  await page.getByLabel('Começar nova folha antes da foto 2').check()
  await page
    .getByRole('combobox', { name: 'Encaixe das fotos' })
    .selectOption('yes')
  await previewIfMobile(page)
  await page.getByText('Ajustar recorte da folha 1').click()
  await page
    .getByRole('slider', { name: 'Posição horizontal' })
    .first()
    .fill('25')
  await expect(
    page.locator('.photo-sheet').getByRole('img', { name: 'Foto 1', exact: true }),
  ).toHaveCSS('object-position', '25% 50%')
  expect(
    (await PDFDocument.load(await download(page, 'Baixar PDF'))).getPageCount(),
  ).toBe(2)
})

test('postagens em cinco formatos com figuras reais e fatiador de painéis', async ({
  page,
}, info) => {
  await page.goto('/app/criar/postagem')
  await page
    .getByLabel('Título', { exact: true })
    .fill('Celebração na escola')

  for (const [format, width, height] of [
    ['Quadrado 1:1', 1080, 1080],
    ['Vertical 4:5', 1080, 1350],
    ['Stories 9:16', 1080, 1920],
    ['Horizontal 16:9', 1920, 1080],
    ['A4 para impressão', 1240, 1754],
  ] as const) {
    await editIfMobile(page)
    await page.getByLabel('Formato').selectOption(format)
    const bytes = await download(page, 'Baixar PNG')
    expect(bytes.readUInt32BE(16)).toBe(width)
    expect(bytes.readUInt32BE(20)).toBe(height)
    if (
      evidence &&
      format === 'Vertical 4:5' &&
      info.project.name === 'chromium'
    ) {
      await mkdir(evidence, { recursive: true })
      await page.screenshot({
        path: join(evidence, 'chromium-postagem.png'),
        fullPage: true,
      })
      await writeFile(join(evidence, 'postagem-exemplo.png'), bytes)
    }
  }

  await editIfMobile(page)
  await page.getByText(/Ilustração decorativa/).click()
  await page.getByRole('button', { name: 'Gato', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Gato', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  const withCat = await download(page, 'Baixar PNG')
  await page.getByRole('button', { name: 'Sem ilustração', exact: true }).click()
  expect(await download(page, 'Baixar PNG')).not.toEqual(withCat)

  page.once('dialog', (dialog) => void dialog.accept())
  await page.goto('/app/criar/painel')
  await page.getByLabel('Conteúdo do painel').selectOption('texto')
  await page.getByLabel('Guia de montagem no PDF').selectOption('no')

  for (const grid of [2, 3]) {
    await editIfMobile(page)
    await page.getByLabel('Grade de folhas A4').selectOption(String(grid))
    await previewIfMobile(page)
    await expect(
      page.getByRole('img', { name: /Prévia da folha / }),
    ).toHaveCount(grid ** 2)
    const bytes = await download(page, 'Baixar PDF')
    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPageCount()).toBe(grid ** 2)
    if (evidence && grid === 2 && info.project.name === 'chromium') {
      await mkdir(evidence, { recursive: true })
      await page.screenshot({
        path: join(evidence, 'chromium-painel-fatiador.png'),
        fullPage: true,
      })
      await writeFile(join(evidence, 'painel-4-folhas-exemplo.pdf'), bytes)
    }
  }

  await editIfMobile(page)
  await page.getByLabel('Grade de folhas A4').selectOption('custom')
  await page.getByRole('combobox', { name: 'Colunas', exact: true }).selectOption('4')
  await page.getByRole('combobox', { name: 'Linhas', exact: true }).selectOption('2')
  expect(
    (await PDFDocument.load(await download(page, 'Baixar PDF'))).getPageCount(),
  ).toBe(8)
})

test('catálogo de 81 modelos com filtro e recuperação após recarregar', async ({
  page,
}) => {
  await page.goto('/app/colecao')
  await expect(page.getByRole('status')).toContainText('81 materiais encontrados')
  await page
    .getByRole('combobox', { name: 'Turma', exact: true })
    .selectOption('Berçário')
  await page.getByRole('searchbox').fill('pares de frutas')
  await expect(page.getByRole('status')).toContainText('0 materiais encontrados')
  await page.getByRole('button', { name: 'Limpar filtros' }).click()
  await page
    .getByRole('combobox', { name: 'Turma', exact: true })
    .selectOption('Pré I')
  await page.getByRole('searchbox').fill('pares de frutas')
  await page.getByRole('link', { name: /Encontre os pares de frutas/ }).click()
  await page
    .getByRole('combobox', { name: 'Folhas do arquivo' })
    .selectOption('yes')
  const pdf = await PDFDocument.load(await download(page, 'Baixar PDF'))
  expect(pdf.getPageCount()).toBe(2)

  await page.goto('/app/colecao/plano-animais')
  await page
    .getByRole('textbox', { name: 'Título', exact: true })
    .fill('Roda da manhã')
  await page
    .getByRole('spinbutton', { name: 'Duração em minutos' })
    .first()
    .fill('12')
  await page
    .getByRole('textbox', { name: 'O que fazer' })
    .first()
    .fill('Leitura compartilhada')
  await page.reload()
  await expect(
    page.getByRole('textbox', { name: 'Título', exact: true }),
  ).toHaveValue('Roda da manhã')
  await expect(
    page.getByRole('textbox', { name: 'O que fazer' }).first(),
  ).toHaveValue('Leitura compartilhada')
  await page.getByRole('button', { name: 'Salvar rascunho' }).click()
  await expect(
    page.getByText('Rascunho salvo em Meus materiais.'),
  ).toBeVisible()

  await page.getByRole('link', { name: 'Materiais', exact: true }).click()
  const copy = await download(page, 'Baixar cópia editável')
  const input = page.getByLabel('Importar cópia editável')
  await input.setInputFiles({
    name: 'invalido.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":7}'),
  })
  await expect(page.getByRole('status')).toContainText('Não foi possível')
  await input.setInputFiles({
    name: 'plano.json',
    mimeType: 'application/json',
    buffer: copy,
  })
  await expect(page.getByRole('status')).toContainText('Cópia importada.')
  await expect(
    page.getByRole('heading', { name: 'Roda da manhã', exact: true }),
  ).toHaveCount(2)
})

test('navegação móvel em prancha CC0 pronta e montador livre', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await page.goto('/app/colecao/frutas-prontas')
  await expect(
    page.getByRole('img', { name: 'Prancha de frutas para colorir' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Baixar PDF' })).toHaveAttribute(
    'href',
    /frutas-cc0\.pdf$/,
  )

  await page.goto('/app/colecao/criar-contagem')
  await previewIfMobile(page)
  await expect(page.locator('.school-preview .print-paper')).toBeVisible()
  const pdf = await PDFDocument.load(await download(page, 'Baixar PDF'))
  expect(pdf.getPageCount()).toBe(1)
  const zip = await JSZip.loadAsync(await download(page, 'Baixar Word'))
  expect(
    Object.keys(zip.files).some((name) => /^word\/media\/.+\.png$/.test(name)),
  ).toBe(true)
})
