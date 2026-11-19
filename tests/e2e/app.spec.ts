import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFile, writeFile } from 'node:fs/promises'
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
async function open(page: Page, path: string) {
  await page.goto('/app/criar/' + path)
}
async function preview(page: Page) {
  await page.getByRole('button', { name: 'Personalizar', exact: true }).click()
  await page.getByRole('button', { name: 'Conferir material' }).click()
}

test('páginas, larguras, navegação e acessibilidade', async ({
  page,
}, info) => {
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
    ['/', 'Sua rotina escolar'],
    ['/como-funciona', 'Como funciona'],
    ['/planos', 'Planos'],
    ['/ajuda', 'Como podemos ajudar?'],
    ['/sobre', 'Sobre o Professora Fácil'],
    ['/privacidade', 'Privacidade'],
    ['/termos', 'Termos de uso'],
    ['/app/em-breve/videos', 'Vídeos escolares'],
  ]) {
    expect((await page.goto(path))?.ok()).toBeTruthy()
    await expect(
      page.getByRole('heading', { level: 1, name: new RegExp(title) }),
    ).toBeVisible()
  }
  for (const width of [320, 360, 390, 430, 768, 1440]) {
    await page.setViewportSize({ width, height: 850 })
    for (const path of ['/', '/app', '/app/criar/plano-de-aula']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBeTruthy()
      if (
        evidence &&
        ((path === '/app' && [320, 390, 1440].includes(width)) ||
          (path === '/' && width === 390))
      )
        await page.screenshot({
          path: join(
            evidence,
            info.project.name +
              (path === '/' ? '-inicio-' : '-app-') +
              width +
              '.png',
          ),
          fullPage: true,
        })
    }
  }
  await page.goto('/')
  const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
  if (info.project.name === 'webkit') {
    // The emulated iPhone does not use the desktop link-tab preference.
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
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(
    audit.violations.map((x) => ({
      id: x.id,
      nodes: x.nodes.map((n) => n.target),
    })),
  ).toEqual([])
  expect(errors).toEqual([])
  expect(external).toEqual([])
})

test('atividade, Word/PDF em português, rascunho e limpeza', async ({
  page,
}, info) => {
  await open(page, 'atividade')
  await page.getByRole('button', { name: 'Personalizar', exact: true }).click()
  await page
    .getByLabel('Título', { exact: true })
    .fill('Ação, emoção, café e corações')
  await page.getByRole('button', { name: 'Conferir material' }).click()
  await expect(
    page.getByRole('heading', { name: 'Ação, emoção, café e corações' }),
  ).toBeVisible()
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
    await page.screenshot({
      path: join(evidence, 'chromium-atividade.png'),
      fullPage: true,
    })
    await writeFile(join(evidence, 'atividade-exemplo.docx'), docx)
    await writeFile(join(evidence, 'atividade-exemplo.pdf'), pdf)
  }
  await page.getByRole('button', { name: 'Salvar rascunho' }).click()
  await expect(page.getByRole('status')).toContainText('Rascunho salvo')
  await page.getByRole('link', { name: 'Meus materiais' }).click()
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
  await page.getByRole('button', { name: 'Personalizar', exact: true }).click()
  await expect(page.getByLabel('Título', { exact: true })).toHaveValue(
    'Ação, emoção, café e corações',
  )
  await page.getByRole('button', { name: 'Conferir material' }).click()
  await open(page, 'documento')
  await page.getByRole('button', { name: 'Abrir Word ou PDF' }).click()
  await page.getByLabel('Selecionar documento').setInputFiles({
    name: 'teste.docx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: docx,
  })
  await expect(page.locator('.file-text')).toContainText(
    'Ação, emoção, café e corações',
  )
  await page.getByLabel('Texto do documento').fill('Obrigada pela atenção.')
  await page.getByRole('button', { name: 'Conferir material' }).click()
  expect((await download(page, 'Baixar Word')).length).toBeGreaterThan(1000)
  page.once('dialog', (dialog) => void dialog.accept())
  await page.getByRole('button', { name: 'Voltar às ferramentas' }).click()
  await page.getByRole('link', { name: 'Documentos Word e PDF' }).click()
  await page.getByRole('button', { name: 'Abrir Word ou PDF' }).click()
  await page.getByLabel('Selecionar documento').setInputFiles({
    name: 'teste.pdf',
    mimeType: 'application/pdf',
    buffer: pdf,
  })
  await expect(page.locator('.file-text')).toContainText(
    'Ação, emoção, café e corações',
  )
  page.once('dialog', (dialog) => void dialog.accept())
  await page.getByRole('link', { name: 'Meus materiais' }).click()
  await page.getByRole('button', { name: 'Limpar dados locais' }).click()
  await page.getByRole('button', { name: 'Confirmar' }).click()
  await expect(
    page.getByRole('heading', { name: 'Seu primeiro material começa aqui' }),
  ).toBeVisible()
})

test('plano, modelos, Modo Fácil e edição não salva', async ({ page }) => {
  await page.goto('/app/modelos')
  await page.getByLabel('Pesquisar modelos').fill('Contação')
  await page.getByRole('link', { name: /Contação de histórias/ }).click()
  await page.getByRole('button', { name: 'Personalizar', exact: true }).click()
  await expect(page.getByLabel('Título', { exact: true })).toHaveValue(
    'Contação de histórias',
  )
  await page.getByRole('button', { name: /Modo Fácil/ }).click()
  await expect(page.getByLabel('Escola (opcional)')).toBeVisible()
  await page
    .getByRole('textbox', { name: 'Objetivos de aprendizagem', exact: true })
    .fill('Participar e explorar histórias com a turma.')
  page.once('dialog', (dialog) => void dialog.dismiss())
  await page.getByRole('button', { name: 'Voltar às ferramentas' }).click()
  await expect(
    page.getByRole('textbox', {
      name: 'Objetivos de aprendizagem',
      exact: true,
    }),
  ).toHaveValue('Participar e explorar histórias com a turma.')
  await page.getByRole('button', { name: 'Conferir material' }).click()
  await expect(
    page.getByText('Participar e explorar histórias com a turma.'),
  ).toBeVisible()
  await download(page, 'Baixar Word')
  await open(page, 'relatorio')
  await preview(page)
  await expect(
    page.getByRole('heading', { name: 'Relatório descritivo' }),
  ).toBeVisible()
  await download(page, 'Baixar PDF')
})

test('arquivos incompatíveis e PDF digitalizado', async ({ page }) => {
  await open(page, 'documento')
  await page.getByRole('button', { name: 'Abrir Word ou PDF' }).click()
  const input = page.getByLabel('Selecionar documento')
  await input.setInputFiles({
    name: 'invalido.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('conteúdo inválido'),
  })
  await expect(page.getByRole('alert')).toContainText('PDF válido')
  await input.setInputFiles({
    name: 'grande.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.alloc(13 * 1024 * 1024),
  })
  await expect(page.getByRole('alert')).toContainText('12 MB')
  await input.setInputFiles({
    name: 'protegido.docx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  })
  await expect(page.getByRole('alert')).toContainText('protegido')
  const doc = await PDFDocument.create()
  const image = await doc.embedPng(png)
  doc.addPage().drawImage(image, { x: 20, y: 20, width: 100, height: 100 })
  await input.setInputFiles({
    name: 'digitalizado.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(await doc.save()),
  })
  await expect(page.getByRole('alert')).toContainText('digitalizado')
})

test('prepara um PDF local para a opção Imprimir', async ({ page }) => {
  await open(page, 'atividade')
  await preview(page)
  await page.getByRole('button', { name: 'Imprimir', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Documento preparado')
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

test('18 fotos, reordenação, legenda e três distribuições A4', async ({
  page,
}, info) => {
  await open(page, 'fotos-em-pdf')
  await page.getByLabel('Selecionar fotos').setInputFiles({
    name: 'invalida.png',
    mimeType: 'image/png',
    buffer: Buffer.from('texto'),
  })
  await expect(page.getByRole('alert')).toContainText('não corresponde')
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
  await page.getByRole('button', { name: 'Organizar folhas' }).click()
  for (const [count, pages] of [
    [1, 18],
    [2, 9],
    [4, 5],
  ]) {
    await page.getByLabel('Fotos por folha').selectOption(String(count))
    await page
      .getByLabel('Orientação do A4')
      .selectOption(count === 2 ? 'horizontal' : 'vertical')
    await page.getByRole('button', { name: 'Conferir PDF' }).click()
    await expect(
      page.getByText(new RegExp('^' + pages + ' folhas A4')),
    ).toBeVisible()
    const bytes = await download(page, 'Baixar PDF')
    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPageCount()).toBe(pages)
    expect(pdf.getPage(0).getWidth()).toBeCloseTo(count === 2 ? 841.89 : 595.28)
    if (evidence && count === 4 && info.project.name === 'chromium') {
      await page.screenshot({
        path: join(evidence, 'chromium-18-fotos.png'),
        fullPage: true,
      })
      await writeFile(join(evidence, '18-fotos-exemplo.pdf'), bytes)
    }
    await page.getByRole('button', { name: 'Voltar', exact: true }).click()
  }
})
test('postagens em cinco formatos e painéis com quatro e nove folhas', async ({
  page,
}, info) => {
  await open(page, 'postagem')
  for (const [format, width, height] of [
    ['Quadrado 1:1', 1080, 1080],
    ['Vertical 4:5', 1080, 1350],
    ['Stories 9:16', 1080, 1920],
    ['Horizontal 16:9', 1920, 1080],
    ['A4 para impressão', 1240, 1754],
  ] as const) {
    await page.getByLabel('Formato').selectOption(format)
    await page
      .getByRole('button', { name: 'Personalizar', exact: true })
      .click()
    await page
      .getByLabel('Título', { exact: true })
      .fill('Celebração na escola')
    await page.getByRole('button', { name: 'Conferir arte' }).click()
    const bytes = await download(page, 'Baixar PNG')
    expect(bytes.readUInt32BE(16)).toBe(width)
    expect(bytes.readUInt32BE(20)).toBe(height)
    if (
      evidence &&
      format === 'Vertical 4:5' &&
      info.project.name === 'chromium'
    )
      await writeFile(join(evidence, 'postagem-exemplo.png'), bytes)
    await page.getByRole('button', { name: 'Voltar', exact: true }).click()
    await page.getByRole('button', { name: 'Voltar', exact: true }).click()
  }
  await open(page, 'painel')
  for (const grid of [2, 3]) {
    await page.getByLabel('Grade de impressão').selectOption(String(grid))
    await page
      .getByRole('button', { name: 'Personalizar', exact: true })
      .click()
    await page.getByRole('button', { name: 'Conferir arte' }).click()
    await expect(
      page.getByRole('img', { name: /Prévia da folha / }),
    ).toHaveCount(grid ** 2)
    const bytes = await download(page, 'Baixar PDF')
    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPageCount()).toBe(grid ** 2)
    if (evidence && grid === 2 && info.project.name === 'chromium') {
      await page.screenshot({
        path: join(evidence, 'chromium-painel.png'),
        fullPage: true,
      })
      await writeFile(join(evidence, 'painel-4-folhas-exemplo.pdf'), bytes)
    }
    await page.getByRole('button', { name: 'Voltar', exact: true }).click()
    await page.getByRole('button', { name: 'Voltar', exact: true }).click()
  }
})
test('catálogo com faixa etária e folheto ilustrado com gabarito separado', async ({
  page,
}) => {
  await page.goto('/app/modelos')
  await page.getByText('Filtrar por categoria, faixa ou tema').click()
  await page.getByLabel('Faixa etária').selectOption({ index: 1 })
  await page.getByRole('searchbox').fill('pareamento de figuras')
  await expect(page.getByText('Nenhum modelo encontrado.')).toBeVisible()
  await page.getByLabel('Faixa etária').selectOption({ index: 3 })
  await page.getByRole('link', { name: /Pareamento de figuras/ }).click()
  await preview(page)
  await expect(
    page.getByRole('img', { name: /Círculo, quadrado e triângulo à esquerda/ }),
  ).toBeVisible()
  const pdf = await PDFDocument.load(await download(page, 'Baixar PDF'))
  expect(pdf.getPageCount()).toBe(2)
})

test('recupera edição após recarregar e importa uma cópia editável', async ({
  page,
}) => {
  await open(page, 'plano-de-aula')
  await page.getByRole('button', { name: 'Personalizar', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Título', exact: true })
    .fill('Roda da manhã')
  await page.getByRole('button', { name: 'Adicionar momento' }).click()
  await page
    .getByRole('textbox', { name: 'Momento 1', exact: true })
    .fill('Leitura compartilhada')
  await page
    .getByRole('spinbutton', { name: 'Minutos do momento 1' })
    .fill('40')
  await expect(page.getByText(/duração informada foi excedida/)).toBeVisible()
  page.once('dialog', (dialog) => {
    void dialog.accept()
  })
  await page.reload()
  await page.getByRole('button', { name: 'Personalizar', exact: true }).click()
  await expect(
    page.getByRole('textbox', { name: 'Título', exact: true }),
  ).toHaveValue('Roda da manhã')
  await expect(
    page.getByRole('textbox', { name: 'Momento 1', exact: true }),
  ).toHaveValue('Leitura compartilhada')
  await page.getByRole('button', { name: 'Conferir material' }).click()
  await page.getByRole('button', { name: 'Salvar rascunho' }).click()
  await expect(
    page.getByText('Rascunho salvo em Meus materiais.'),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Meus materiais', exact: true }).click()
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

test('gira uma foto, insere uma quebra e exporta uma grade retangular', async ({
  page,
}) => {
  await open(page, 'fotos-em-pdf')
  const photos = Array.from({ length: 4 }, (_, i) => ({
    name: 'foto-' + i + '.png',
    mimeType: 'image/png',
    buffer: png,
  }))
  await page.getByLabel('Selecionar fotos').setInputFiles(photos)
  await expect(page.getByText(/4 de 24 fotos selecionadas/)).toBeVisible()
  await page.getByRole('button', { name: 'Girar foto 1' }).click()
  await page.getByLabel('Começar nova folha antes da foto 2').check()
  await page.getByRole('button', { name: 'Organizar folhas' }).click()
  await page.getByText('Margens, encaixe e qualidade').click()
  await page
    .getByRole('combobox', { name: 'Encaixe das fotos' })
    .selectOption('yes')
  await page.getByRole('button', { name: 'Conferir PDF' }).click()
  await page.getByText('Ajustar recorte da folha 1').click()
  await page
    .getByRole('slider', { name: 'Posição horizontal' })
    .first()
    .fill('25')
  await expect(
    page.getByRole('img', { name: 'Foto 1', exact: true }),
  ).toHaveCSS('object-position', '25% 50%')
  expect(
    (await PDFDocument.load(await download(page, 'Baixar PDF'))).getPageCount(),
  ).toBe(2)
  page.once('dialog', (dialog) => {
    void dialog.accept()
  })
  await open(page, 'painel')
  await page.getByLabel('Grade de impressão').selectOption('custom')
  await page
    .getByRole('combobox', { name: 'Colunas', exact: true })
    .selectOption('4')
  await page
    .getByRole('combobox', { name: 'Linhas', exact: true })
    .selectOption('2')
  await page.getByRole('button', { name: 'Personalizar', exact: true }).click()
  await page.getByRole('button', { name: 'Conferir arte' }).click()
  await expect(
    page.getByRole('link', { name: 'Ir para folha 8' }),
  ).toBeVisible()
  expect(
    (await PDFDocument.load(await download(page, 'Baixar PDF'))).getPageCount(),
  ).toBe(8)
})

test('abre modelos da coleção nas sete ferramentas', async ({ page }) => {
  for (const [tool, expected] of [
    ['atividade', 'Cores no cotidiano'],
    ['plano-de-aula', 'Semana das cores'],
    ['relatorio', 'Acolhimento e adaptação'],
    ['documento', 'Comunicado de reunião'],
    ['postagem', 'Bem-vindas, famílias!'],
    ['painel', 'Bem-vindos à turma'],
  ]) {
    await open(page, tool + '?modelo=pf327-' + tool + '-001')
    await page
      .getByRole('button', { name: 'Personalizar', exact: true })
      .click()
    await expect(
      page.getByRole('textbox', { name: 'Título', exact: true }),
    ).toHaveValue(new RegExp(expected))
    if (tool === 'plano-de-aula')
      await expect(
        page.getByRole('textbox', { name: 'Momento 1', exact: true }),
      ).toHaveValue('Acolhida')
  }
  await open(page, 'fotos-em-pdf?modelo=pf327-fotos-em-pdf-001')
  await page
    .getByLabel('Selecionar fotos')
    .setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: png })
  await page.getByRole('button', { name: 'Organizar folhas' }).click()
  await expect(
    page.getByRole('textbox', { name: 'Nome do arquivo' }),
  ).toHaveValue('Fotos da rotina — galeria')
  await expect(
    page.getByRole('combobox', { name: 'Fotos por folha' }),
  ).toHaveValue('4')
})

test('ficha licenciada, navegação móvel e exportação de Word e PDF', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await open(page, 'atividade?modelo=pf327-atividade-073')
  await page.getByRole('button', { name: 'Personalizar', exact: true }).click()
  await page.getByRole('button', { name: 'Ver prévia', exact: true }).click()
  await expect(page.getByRole('img', { name: /Ficha A4/ })).toBeVisible()
  await page.getByRole('button', { name: 'Conferir material' }).click()
  await expect(
    page.getByRole('link', { name: 'Baixar ficha SVG' }),
  ).toHaveAttribute('href', /folha_01\.svg$/)
  const pdf = await PDFDocument.load(await download(page, 'Baixar PDF'))
  expect(pdf.getPageCount()).toBe(2)
  const zip = await JSZip.loadAsync(await download(page, 'Baixar Word'))
  expect(
    Object.keys(zip.files).some((name) => /^word\/media\/.+\.png$/.test(name)),
  ).toBe(true)
  await page.getByRole('button', { name: '2. Ajustar', exact: true }).click()
  await expect(
    page.getByRole('textbox', { name: 'Título', exact: true }),
  ).toHaveValue(/Ligue formas iguais/)
})

test('catálogo carrega a coleção por categoria e limita a primeira página', async ({
  page,
}) => {
  const chunks: string[] = []
  page.on('request', (request) => {
    if (
      /\/assets\/(atividade|documento|fotos-em-pdf|painel|plano-de-aula|postagem|relatorio)-[^/]+\.js/.test(
        request.url(),
      )
    )
      chunks.push(request.url())
  })
  await page.goto('/')
  await expect(
    page.getByRole('img', { name: /Materiais ilustrados/ }),
  ).toBeVisible()
  expect(chunks).toHaveLength(0)
  await page.goto('/app/modelos')
  await page
    .getByRole('button', { name: 'Criar atividade', exact: true })
    .click()
  await expect(page.getByText('103 modelos encontrados')).toBeVisible()
  await expect(page.locator('.model-card')).toHaveCount(24)
  await page.getByRole('button', { name: 'Mostrar mais 24' }).click()
  await expect(page.locator('.model-card')).toHaveCount(48)
  expect(chunks).toHaveLength(1)
})

test('adiciona e remove uma figura do pacote em uma postagem', async ({
  page,
}) => {
  await open(page, 'postagem?modelo=pf327-postagem-001')
  await page.getByRole('button', { name: 'Personalizar', exact: true }).click()
  await page.getByText('Figuras decorativas', { exact: true }).click()
  await page.getByRole('button', { name: 'Gato', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Gato', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Conferir arte' }).click()
  const illustrated = await download(page, 'Baixar PNG')
  await page.getByRole('button', { name: '2. Ajustar', exact: true }).click()
  await page.getByText('Figuras decorativas · 1 escolhida').click()
  await page.getByRole('button', { name: 'Sem figura', exact: true }).click()
  await page.getByRole('button', { name: 'Conferir arte' }).click()
  expect(await download(page, 'Baixar PNG')).not.toEqual(illustrated)
})
