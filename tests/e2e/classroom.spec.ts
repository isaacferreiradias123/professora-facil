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
  if (label === 'Baixar Word') {
    const details = page.locator('.school-export-menu')
    if (
      (await details.count()) &&
      (await details.getAttribute('open')) === null
    )
      await details.getByText('Mais ações', { exact: true }).click()
  }
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
  await expect(
    page.getByRole('heading', { name: 'Personalizar material', exact: true }),
  ).toBeVisible()
  if (await tab.isVisible()) {
    await tab.click()
    await expect(tab).toHaveAttribute('aria-pressed', 'true')
  }
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
  await page.goto('/app/colecao/passeio')
  await verifyA4(await save(page, 'Baixar PDF', 'passeio-autorizacao.pdf'), 1)
  const permission = await docxXml(
    await save(page, 'Baixar Word', 'passeio-autorizacao.docx'),
  )
  expect(permission.match(/AUTORIZAÇÃO PARA A SAÍDA/g)).toHaveLength(2)
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
    await expect(page.getByRole('status')).toContainText('10 materiais')
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width)
  }
  const search = page.getByRole('searchbox')
  await search.focus()
  await page.keyboard.type('bercario')
  await expect(page.getByRole('status')).toContainText('10 materiais')
  await page
    .getByRole('combobox', { name: 'Turma', exact: true })
    .selectOption('')
  await search.clear()
  await page
    .getByRole('combobox', { name: 'Formato', exact: true })
    .selectOption('pronto')
  await expect(page.getByRole('status')).toContainText('2 materiais')
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
  await page.getByText('Mais ações', { exact: true }).click()
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
test('cria uma folha infantil com figuras escolhidas e plano com tempos editados', async ({
  page,
}) => {
  await page.goto('/app/criar')
  await page
    .getByRole('link', { name: 'Criar atividade', exact: true })
    .first()
    .click()
  await page.getByRole('link', { name: 'Montar ficha de contagem' }).click()
  await page
    .getByRole('combobox', { name: 'Figuras', exact: true })
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
  await page.goto('/app/colecao/plano-feira')
  await page
    .getByRole('spinbutton', { name: 'Duração em minutos' })
    .first()
    .fill('9')
  await page
    .getByRole('textbox', { name: 'O que fazer' })
    .first()
    .fill('Contar os cartões em roda.')
  await showPreview(page)
  await expect(page.locator('.school-preview')).toContainText('31 min')
  await expect(page.locator('.school-preview')).toContainText(
    'Contar os cartões em roda.',
  )
  const plan = await docxXml(
    await save(page, 'Baixar Word', 'plano-momentos.docx'),
  )
  expect(plan).toContain('<w:tbl>')
  expect(plan).toContain('31 min')
  expect(plan).toContain('Contar os cartões em roda.')
})
test('ata e relatório saem com campos próprios em PDF e Word editável', async ({
  page,
}) => {
  await page.goto('/app/colecao?ferramenta=documento')
  await page.getByRole('link', { name: /Ata de reunião escolar/ }).click()
  await page
    .getByRole('textbox', { name: 'Participantes', exact: true })
    .fill('Equipe da turma Ipê')
  await page
    .getByRole('textbox', { name: 'Pauta', exact: true })
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
  await page.goto('/app/colecao/registro-individual')
  await page
    .getByRole('textbox', { name: 'Identificação no registro', exact: true })
    .fill('Criança A')
  await page
    .getByRole('textbox', { name: 'Período observado', exact: true })
    .fill('1º trimestre')
  await page
    .getByRole('textbox', {
      name: 'Ações, falas e interações observadas',
      exact: true,
    })
    .fill('Distribuiu os pincéis para o grupo.')
  await page
    .getByRole('textbox', {
      name: 'Exemplo ou produção da criança',
      exact: true,
    })
    .fill('Contou dois pincéis em voz alta.')
  await showPreview(page)
  await expect(page.locator('.school-preview')).toContainText(
    'Contou dois pincéis em voz alta.',
  )
  await verifyA4(await save(page, 'Baixar PDF', 'registro-individual.pdf'), 1)
  const report = await docxXml(
    await save(page, 'Baixar Word', 'registro-individual.docx'),
  )
  expect(report).toContain('1º trimestre')
  expect(report).toContain('Responsável pelo registro')
})

test('álbum, arte e painel próprios usam os controles novos nos arquivos', async ({
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
  await page.getByRole('button', { name: 'Organizar folhas' }).click()
  await page
    .getByRole('textbox', { name: 'Nome do arquivo', exact: true })
    .fill('Portfólio da turma Ipê')
  await page
    .getByRole('combobox', { name: 'Título na folha', exact: true })
    .selectOption('yes')
  await page
    .getByRole('textbox', { name: 'Turma, data ou projeto', exact: true })
    .fill('Pré II · produção coletiva')
  await page
    .getByRole('combobox', { name: 'Numeração das folhas', exact: true })
    .selectOption('yes')
  await page.getByRole('button', { name: 'Conferir PDF' }).click()
  await expect(page.locator('.photo-print-header')).toContainText(
    'Pré II · produção coletiva',
  )
  await expect(page.locator('.photo-print-number')).toHaveText('Folha 1 de 1')
  await verifyA4(await save(page, 'Baixar PDF', 'album-com-cabecalho.pdf'), 1)
  await page.goto('/app/criar/postagem')
  await page.getByRole('button', { name: 'Personalizar', exact: true }).click()
  await page
    .getByRole('combobox', { name: 'Composição da postagem', exact: true })
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
  await page.getByLabel('Adicionar imagem (opcional)').setInputFiles(input)
  await page.getByRole('button', { name: 'Conferir arte' }).click()
  const png = await save(page, 'Baixar PNG', 'postagem-fotografica.png')
  expect(png.readUInt32BE(16)).toBe(1080)
  expect(png.readUInt32BE(20)).toBe(1080)
  await page.goto('/app/criar/painel')
  await page.getByRole('button', { name: 'Personalizar', exact: true }).click()
  await page
    .getByRole('combobox', { name: 'Conteúdo do painel', exact: true })
    .selectOption('imagem')
  await page
    .getByRole('combobox', { name: 'Guia no PDF', exact: true })
    .selectOption('yes')
  await page.getByLabel('Escolher imagem para o painel').setInputFiles(input)
  await page.getByRole('button', { name: 'Conferir arte' }).click()
  await expect(page.getByRole('img', { name: /Prévia da folha/ })).toHaveCount(
    4,
  )
  await verifyA4(
    await save(page, 'Baixar PDF', 'painel-de-imagem-com-mapa.pdf'),
    5,
  )
})

test('pareamento, extensão de aula e cartões de rotina são personalizáveis', async ({
  page,
}) => {
  await page.goto('/app/colecao/criar-pares')
  await page
    .getByRole('combobox', { name: 'Figuras', exact: true })
    .selectOption('school')
  await showPreview(page)
  await expect(
    page
      .locator('.school-preview')
      .getByRole('img', { name: 'Pincel', exact: true }),
  ).toHaveCount(2)
  await verifyA4(await save(page, 'Baixar PDF', 'pareamento-escolar.pdf'), 1)
  await page.goto('/app/colecao/plano-feira')
  await page
    .getByRole('checkbox', { name: 'Incluir extensão ou adaptação' })
    .check()
  await page
    .getByRole('spinbutton', { name: 'Duração em minutos' })
    .last()
    .fill('7')
  await page
    .getByRole('textbox', { name: 'O que fazer' })
    .last()
    .fill('Recontar com materiais táteis.')
  await showPreview(page)
  await expect(page.locator('.school-preview')).toContainText('35 min')
  await expect(page.locator('.school-preview')).toContainText(
    'Recontar com materiais táteis.',
  )
  await page.goto('/app/colecao/painel-rotina')
  await page
    .getByRole('textbox', { name: /Texto dos cartões/ })
    .fill('Chegada\nHorta\nRoda')
  await showPreview(page)
  await expect(page.locator('.school-preview')).toContainText('Horta')
  await verifyA4(await save(page, 'Baixar PDF', 'rotina-personalizada.pdf'), 3)
})
test('atividades separam folhas e vivências e mostram o modelo original', async ({
  page,
}) => {
  await page.goto('/app/colecao?ferramenta=atividade')
  await page.getByRole('button', { name: /Para fazer com os alunos/ }).click()
  await expect(
    page.getByRole('link', { name: /Tecidos à luz da janela/ }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: /Da rega ao broto/ }),
  ).toHaveCount(0)
  await page.getByRole('button', { name: /Folhas para os alunos/ }).click()
  await page.getByRole('link', { name: /Da rega ao broto/ }).click()
  await page.getByText('Ver o modelo original', { exact: true }).click()
  await expect(
    page.locator('.school-template-reference .print-paper'),
  ).toBeVisible()
  await showPreview(page)
  await page.getByRole('button', { name: 'Ampliar folha' }).click()
  await expect(
    page.getByRole('button', { name: 'Ajustar à tela' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.school-preview')).toContainText(
    'Desenhe o que pode acontecer depois.',
  )
  await verifyA4(await save(page, 'Baixar PDF', 'sequencia-ilustrada.pdf'), 1)
})
test('exporta os modelos novos da coleção para revisão', async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== 'chromium',
    'O lote de arquivos é revisado uma vez.',
  )
  test.setTimeout(180000)
  const written = [
    'tecidos-da-janela',
    'objetos-da-sala',
    'sequencia-do-jardim',
    'plano-texturas-janela',
    'plano-roda-reconto',
    'plano-investigar-jardim',
    'registro-brincadeira-livre',
    'registro-projeto-coletivo',
    'sintese-para-familias',
    'convocacao-encontro',
    'recado-materiais-projeto',
    'ficha-atendimento-familia',
  ]
  for (const id of [
    ...written,
    'painel-leitura',
    'painel-ajudantes',
    'painel-calendario',
  ]) {
    await page.goto('/app/colecao/' + id)
    expect(
      (
        await PDFDocument.load(await save(page, 'Baixar PDF', id + '.pdf'))
      ).getPageCount(),
    ).toBeGreaterThan(0)
    if (written.includes(id))
      expect(
        await docxXml(await save(page, 'Baixar Word', id + '.docx')),
      ).toContain('<w:body>')
  }
  const photo = Buffer.from(
    await page.evaluate(() => {
      const canvas = document.createElement('canvas')
      canvas.width = 420
      canvas.height = 280
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#e2eddb'
      ctx.fillRect(0, 0, 420, 280)
      ctx.fillStyle = '#38604d'
      ctx.fillRect(40, 40, 340, 200)
      return canvas.toDataURL('image/png').split(',')[1]
    }),
    'base64',
  )
  for (const id of [
    'album-portifolio-individual',
    'album-projeto',
    'album-exposicao',
  ]) {
    await page.goto('/app/criar/fotos-em-pdf?colecao=' + id)
    await page.getByLabel('Selecionar fotos').setInputFiles({
      name: 'exemplo.png',
      mimeType: 'image/png',
      buffer: photo,
    })
    await page.getByRole('button', { name: 'Organizar folhas' }).click()
    await page.getByRole('button', { name: 'Conferir PDF' }).click()
    expect(
      (
        await PDFDocument.load(await save(page, 'Baixar PDF', id + '.pdf'))
      ).getPageCount(),
    ).toBe(1)
  }
  for (const id of [
    'arte-agenda-semana',
    'arte-convite-mostra',
    'arte-agradecimento',
  ]) {
    await page.goto('/app/criar/postagem?colecao=' + id)
    await expect(
      page.getByRole('img', { name: /Prévia do modelo/ }),
    ).toBeVisible()
    await page
      .getByRole('button', { name: 'Personalizar', exact: true })
      .click()
    await page.getByRole('button', { name: 'Conferir arte' }).click()
    expect(
      (await save(page, 'Baixar PNG', id + '.png')).subarray(1, 4).toString(),
    ).toBe('PNG')
  }
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
