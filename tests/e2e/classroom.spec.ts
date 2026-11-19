import { expect, test, type Page } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
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
  if (evidence) {
    await mkdir(evidence, { recursive: true })
    await writeFile(join(evidence, filename), data)
  }
  return data
}

async function showPreview(page: Page) {
  const tab = page.getByRole('button', { name: 'Ver prévia', exact: true })
  await expect(
    page.getByRole('heading', { name: 'Personalizar material', exact: true }),
  ).toBeVisible()
  if (await tab.isVisible()) {
    await tab.click()
    await expect(tab).toHaveAttribute('aria-pressed', 'true')
  }
}

async function verifyA4(data: Buffer, count: number, landscapePages = false) {
  const pdf = await PDFDocument.load(data)
  expect(pdf.getPageCount()).toBe(count)
  for (const page of pdf.getPages()) {
    expect(page.getWidth()).toBeCloseTo(landscapePages ? 841.89 : 595.28, 1)
    expect(page.getHeight()).toBeCloseTo(landscapePages ? 595.28 : 841.89, 1)
  }
}

async function docxXml(data: Buffer) {
  return (await JSZip.loadAsync(data))
    .file('word/document.xml')!
    .async('string')
}

test('ficha de Pré II tem contagem ilustrada, Econômico P&B e roteiro', async ({
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
  await page.getByRole('button', { name: 'Econômico P&B' }).click()
  await expect(
    page.getByRole('button', { name: 'Econômico P&B' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await page
    .getByRole('combobox', { name: 'Folhas do arquivo' })
    .selectOption('yes')
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
  if (evidence) {
    await mkdir(evidence, { recursive: true })
    await page.screenshot({
      path: join(evidence, 'ficha-' + info.project.name + '.png'),
      fullPage: true,
    })
  }
})

test('recados têm 2 ou 4 vias por folha A4, canhoto e aviso de texto longo', async ({
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

  await page.getByLabel('Distribuição na folha').selectOption('4')
  await verifyA4(await save(page, 'Baixar PDF', 'reuniao-quatro-vias.pdf'), 1)
  const xmlFour = await docxXml(
    await save(page, 'Baixar Word', 'reuniao-quatro-vias.docx'),
  )
  expect(xmlFour.match(/Convite para reunião de famílias/g)).toHaveLength(4)

  await page.getByLabel('Distribuição na folha').selectOption('2')
  await page
    .getByRole('textbox', { name: 'Mensagem', exact: true })
    .fill('Trecho longo para testar a área de impressão. '.repeat(50))
  await expect(page.getByRole('alert')).toContainText('passou do espaço')
  await expect(page.getByRole('button', { name: 'Baixar PDF' })).toBeDisabled()

  await page.goto('/app/colecao/passeio')
  await verifyA4(await save(page, 'Baixar PDF', 'passeio-autorizacao.pdf'), 1)
  const permission = await docxXml(
    await save(page, 'Baixar Word', 'passeio-autorizacao.docx'),
  )
  expect(permission.match(/AUTORIZAÇÃO \/ CONFIRMAÇÃO/g)).toHaveLength(2)
})

test('murais de boas-vindas, aniversariantes 12 meses e kit de rotina A4', async ({
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
  if (evidence) {
    await mkdir(evidence, { recursive: true })
    await page.screenshot({
      path: join(evidence, 'painel-' + info.project.name + '.png'),
      fullPage: true,
    })
  }
  await page
    .getByRole('button', { name: 'Folha 5 · Linha 2 · Coluna 2' })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Linha 2 · Coluna 2' }),
  ).toBeVisible()
  await verifyA4(await save(page, 'Baixar PDF', 'painel-boas-vindas.pdf'), 5)

  await page.goto('/app/colecao/mural-aniversariantes')
  await showPreview(page)
  await expect(page.locator('.school-preview .print-paper')).toContainText(
    'Janeiro',
  )
  await expect(page.locator('.school-preview .print-paper')).toContainText(
    'Dezembro',
  )
  const bdayPdf = await PDFDocument.load(
    await save(page, 'Baixar PDF', 'mural-aniversariantes.pdf'),
  )
  expect(bdayPdf.getPageCount()).toBe(5)
  expect(bdayPdf.getPage(1).getWidth()).toBeCloseTo(841.89, 1)

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

test('coleção é navegável por teclado, filtros, pronto e rascunho reaberto', async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 850 })
    await page.goto('/app/colecao?ferramenta=atividade')
    await page
      .getByRole('combobox', { name: 'Turma', exact: true })
      .selectOption('Berçário')
    await expect(page.getByRole('status')).toContainText('1 material')
    await expect(
      page.getByRole('link', { name: /Entre tecidos e texturas/ }),
    ).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width)
  }

  const search = page.getByRole('searchbox')
  await search.focus()
  await page.keyboard.type('bercario')
  await expect(page.getByRole('status')).toContainText('1 material')
  await page
    .getByRole('combobox', { name: 'Turma', exact: true })
    .selectOption('')
  await search.clear()
  await page.getByText('Mais filtros', { exact: true }).click()
  await page
    .getByRole('combobox', { name: 'Formato', exact: true })
    .selectOption('pronto')
  await expect(page.getByRole('status')).toContainText('8 materiais')
  await page.locator('a[href$="/frutas-prontas"]').click()
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

test('montadores livres (contagem, pares, traçado) e planos com BNCC', async ({
  page,
}, info) => {
  await page.goto('/app/colecao?ferramenta=atividade')
  await page.getByText('Começar em branco', { exact: true }).click()
  await page.getByRole('link', { name: 'Montar ficha de contagem' }).click()
  await page
    .getByRole('combobox', { name: 'Conjunto de figuras', exact: true })
    .selectOption('animals')
  await page
    .getByRole('combobox', { name: 'Gatos', exact: true })
    .selectOption('2')
  await page
    .getByRole('textbox', { name: 'Comando para a criança', exact: true })
    .fill('Conte e escreva o total.')
  await showPreview(page)
  await expect(
    page
      .locator('.school-preview')
      .getByRole('img', { name: 'Gatos', exact: true }),
  ).toHaveCount(2)
  await expect(page.locator('.school-preview')).toContainText(
    'Conte e escreva o total.',
  )
  await verifyA4(await save(page, 'Baixar PDF', 'contagem-animais.pdf'), 1)
  const xml = await docxXml(
    await save(page, 'Baixar Word', 'contagem-animais.docx'),
  )
  expect(xml).toContain('Conte e escreva o total.')
  expect(xml).toContain('Gatos')
  expect(xml).not.toContain('Roteiro da professora')

  await page.goto('/app/colecao/criar-tracado')
  await page
    .getByRole('combobox', { name: 'Quantidade de caminhos', exact: true })
    .selectOption('3')
  await showPreview(page)
  await expect(page.locator('.school-preview svg polyline')).toHaveCount(3)
  await verifyA4(await save(page, 'Baixar PDF', 'tracado-motor.pdf'), 1)

  await page.goto('/app/colecao/criar-pares')
  await page
    .getByRole('combobox', { name: 'Conjunto de figuras', exact: true })
    .selectOption('school')
  await page.getByRole('button', { name: 'Embaralhar coluna direita' }).click()
  await showPreview(page)
  await expect(
    page
      .locator('.school-preview')
      .getByRole('img', { name: 'Pincel', exact: true }),
  ).toHaveCount(2)
  await verifyA4(await save(page, 'Baixar PDF', 'pareamento-escolar.pdf'), 1)

  await page.goto('/app/colecao/plano-semanal-maternal')
  await page.getByText('Selos da BNCC (Campos e Direitos)').click()
  await page.getByRole('button', { name: 'Conviver', exact: true }).click()
  await showPreview(page)
  await expect(page.locator('.school-preview')).toContainText('Segunda')
  await expect(page.locator('.school-preview')).toContainText('Sexta')
  if (evidence && info.project.name === 'chromium') {
    await mkdir(evidence, { recursive: true })
    await page.screenshot({
      path: join(evidence, 'plano-semanal-chromium.png'),
      fullPage: true,
    })
  }
  await verifyA4(
    await save(page, 'Baixar PDF', 'plano-semanal-maternal.pdf'),
    1,
    true,
  )

  await page.goto('/app/colecao/plano-animais')
  await page
    .getByRole('spinbutton', { name: 'Duração em minutos' })
    .first()
    .fill('9')
  await page
    .getByRole('textbox', { name: 'O que fazer' })
    .first()
    .fill('Contar os cartões em roda.')
  await showPreview(page)
  await expect(page.locator('.school-preview')).toContainText('24 min')
  await expect(page.locator('.school-preview')).toContainText(
    'Contar os cartões em roda.',
  )
  const plan = await docxXml(
    await save(page, 'Baixar Word', 'plano-momentos.docx'),
  )
  expect(plan).toContain('<w:tbl>')
  expect(plan).toContain('24 min')
  expect(plan).toContain('Contar os cartões em roda.')
})

test('ata, checklist, relatório com sugestões e síntese ilustrada', async ({
  page,
}) => {
  await page.goto('/app/colecao?ferramenta=documento')
  await page.getByRole('link', { name: /Ata de reunião escolar/ }).click()
  await page
    .getByRole('textbox', { name: 'Participantes', exact: true })
    .fill('Equipe da turma Ipê')
  await page
    .getByRole('textbox', { name: 'Pauta do encontro', exact: true })
    .fill('Organizar a feira do livro.')
  await page
    .getByRole('textbox', {
      name: 'Encaminhamentos, responsáveis e prazos',
      exact: true,
    })
    .fill('Ana reúne os materiais até sexta-feira.')
  await showPreview(page)
  await expect(page.locator('.school-preview')).toContainText(
    'Equipe da turma Ipê',
  )
  await expect(page.locator('.school-preview')).toContainText(
    'Responsável pela ata',
  )
  await verifyA4(await save(page, 'Baixar PDF', 'ata-escolar.pdf'), 1)
  const doc = await docxXml(await save(page, 'Baixar Word', 'ata-escolar.docx'))
  expect(doc).toContain('<w:tbl>')
  expect(doc).toContain('Ana reúne os materiais até sexta-feira.')

  await page.goto('/app/colecao/lista-materiais-turma')
  await verifyA4(await save(page, 'Baixar PDF', 'checklist-turma.pdf'), 1)

  await page.goto('/app/colecao/registro-individual')
  await page
    .getByRole('textbox', { name: 'Nome fictício da criança', exact: true })
    .fill('Criança A')
  await page
    .getByRole('textbox', { name: 'Semestre / Período', exact: true })
    .fill('1º trimestre')
  await page.getByText(/Ideias do que observar/).click()
  await page.locator('.hint-btn').first().click()
  await showPreview(page)
  await expect(page.locator('.school-preview')).toContainText('1º trimestre')
  await expect(page.locator('.school-preview')).toContainText(
    'Responsável pelo registro',
  )
  await verifyA4(await save(page, 'Baixar PDF', 'registro-individual.pdf'), 1)
  const report = await docxXml(
    await save(page, 'Baixar Word', 'registro-individual.docx'),
  )
  expect(report).toContain('1º trimestre')
  expect(report).toContain('Responsável pelo registro')

  await page.goto('/app/colecao/sintese-para-familias')
  await verifyA4(await save(page, 'Baixar PDF', 'sintese-familias.pdf'), 1)
  expect(
    await docxXml(await save(page, 'Baixar Word', 'sintese-familias.docx')),
  ).toContain('<w:body>')
})

test('álbum Polaroid, postagem direta e painel com mapa A4', async ({
  page,
}) => {
  const photo = Buffer.from(
    await page.evaluate(() => {
      const canvas = document.createElement('canvas')
      canvas.width = 640
      canvas.height = 480
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#d6c5ed'
      ctx.fillRect(0, 0, 640, 480)
      ctx.fillStyle = '#226754'
      ctx.fillRect(80, 80, 480, 320)
      return canvas.toDataURL('image/png').split(',')[1]
    }),
    'base64',
  )
  const input = {
    name: 'imagem-ficticia.png',
    mimeType: 'image/png',
    buffer: photo,
  }

  await page.goto('/app/criar/fotos-em-pdf')
  await page.getByLabel('Selecionar fotos').setInputFiles(input)
  await page
    .getByRole('textbox', { name: 'Título do álbum', exact: true })
    .fill('Portfólio da turma Ipê')
  await page
    .getByRole('textbox', { name: 'Turma ou subtítulo', exact: true })
    .fill('Pré II · produção coletiva')
  await page.getByLabel('Estilo da moldura').selectOption('yes')
  await page.getByText('Cabeçalho, numeração, margens e qualidade').click()
  await page
    .getByRole('combobox', { name: 'Título na folha', exact: true })
    .selectOption('yes')
  await page
    .getByRole('combobox', { name: 'Numeração das folhas', exact: true })
    .selectOption('yes')
  const previewBtn = page.getByRole('button', { name: 'Ver prévia', exact: true })
  if (await previewBtn.isVisible()) await previewBtn.click()
  await expect(page.locator('.photo-print-header')).toContainText(
    'Pré II · produção coletiva',
  )
  await expect(page.locator('.photo-print-number')).toHaveText('Folha 1 de 1')
  await verifyA4(await save(page, 'Baixar PDF', 'album-polaroid.pdf'), 1)

  await page.goto('/app/criar/postagem')
  await page
    .getByRole('combobox', { name: 'Composição visual', exact: true })
    .selectOption('memoria')
  await page
    .getByRole('textbox', { name: 'Título', exact: true })
    .fill('Nossa feira do livro')
  await page
    .getByRole('textbox', {
      name: 'Destaque final na arte (opcional)',
      exact: true,
    })
    .fill('Até a próxima leitura!')
  await page.getByLabel('Adicionar foto (opcional)').setInputFiles(input)
  const png = await save(page, 'Baixar PNG', 'postagem-fotografica.png')
  expect(png.readUInt32BE(16)).toBe(1080)
  expect(png.readUInt32BE(20)).toBe(1350)

  await page.goto('/app/criar/painel')
  await page
    .getByRole('combobox', { name: 'Conteúdo do painel', exact: true })
    .selectOption('imagem')
  await page
    .getByRole('combobox', { name: 'Guia de montagem no PDF', exact: true })
    .selectOption('yes')
  await page.getByLabel('Escolher imagem para dividir em A4').setInputFiles(input)
  if (await previewBtn.isVisible()) await previewBtn.click()
  await expect(page.getByRole('img', { name: /Prévia da folha/ })).toHaveCount(
    4,
  )
  await verifyA4(
    await save(page, 'Baixar PDF', 'painel-de-imagem-com-mapa.pdf'),
    5,
  )
})

test('atividades separam folhas e vivências e ampliam a folha de traçado', async ({
  page,
}) => {
  await page.goto('/app/colecao?ferramenta=atividade')
  await page.getByRole('button', { name: /Para fazer com os alunos/ }).click()
  await expect(
    page.getByRole('link', { name: /Entre tecidos e texturas/ }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: /Caminhos da borboleta/ }),
  ).toHaveCount(0)
  await page.getByRole('button', { name: /Folhas para os alunos/ }).click()
  await page.getByRole('link', { name: /Caminhos da borboleta/ }).click()
  await showPreview(page)
  await page.getByRole('button', { name: 'Ampliar folha' }).click()
  await expect(
    page.getByRole('button', { name: 'Ajustar à tela' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.school-preview svg polyline')).toHaveCount(4)
  await verifyA4(await save(page, 'Baixar PDF', 'tracado-borboleta.pdf'), 1)
})

test('responde no Word escolhido e na posição da página do PDF', async ({
  page,
}) => {
  const { Document, Packer, Paragraph } = await import('docx')
  const doc = await Packer.toBuffer(
    new Document({
      sections: [
        {
          children: [
            new Paragraph('Qual é sua fruta preferida?'),
            new Paragraph('Segunda pergunta'),
          ],
        },
      ],
    }),
  )
  await page.goto('/app/responder')
  const upload = page.getByLabel('Selecionar arquivo para responder')
  await upload.setInputFiles({
    name: 'questoes.docx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: doc,
  })
  await page
    .getByRole('button', { name: 'Qual é sua fruta preferida?' })
    .click()
  await page
    .getByRole('textbox', { name: 'Texto da resposta' })
    .fill('Minha fruta é maçã.')
  await page.getByRole('button', { name: 'Inserir resposta' }).click()
  const word = await docxXml(
    await save(page, 'Baixar cópia respondida', 'questoes-respondido.docx'),
  )
  expect(word.indexOf('Minha fruta é maçã.')).toBeGreaterThan(
    word.indexOf('Qual é sua fruta preferida?'),
  )
  expect(word.indexOf('Segunda pergunta')).toBeGreaterThan(
    word.indexOf('Minha fruta é maçã.'),
  )

  const source = await PDFDocument.create()
  source
    .addPage([595.28, 841.89])
    .drawText('Escreva sua resposta:', { x: 36, y: 750, size: 14 })
  await upload.setInputFiles({
    name: 'questoes.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(await source.save()),
  })
  await page
    .getByRole('button', { name: 'Escolher posição na folha 1' })
    .focus()
  await page.keyboard.press('Enter')
  await page
    .getByRole('spinbutton', { name: 'Posição vertical (%)' })
    .fill('16')
  await page
    .getByRole('textbox', { name: 'Texto da resposta' })
    .fill('Resposta no espaço da pergunta.')
  await page.getByRole('button', { name: 'Inserir resposta' }).click()
  await expect(
    page.getByRole('button', {
      name: 'Selecionar resposta: Resposta no espaço da pergunta.',
    }),
  ).toBeVisible()
  await verifyA4(
    await save(page, 'Baixar cópia respondida', 'questoes-respondido.pdf'),
    1,
  )
})
