import { expect, test, type Page } from '@playwright/test'
import { mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { classroom } from '../../src/classroom-catalog'

const posts = classroom.filter((item) => item.tool === 'postagem' && item.visual)
const evidence = process.env.PF_CLASSROOM_EVIDENCE

async function preview(page: Page) {
  const switcher = page.getByRole('button', { name: 'Ver prévia', exact: true })
  if (await switcher.isVisible()) await switcher.click()
}

async function verifyPng(page: Page, name: string) {
  await preview(page)
  const canvas = page.locator('canvas.art-preview')
  const expected = await canvas.evaluate((element: HTMLCanvasElement) =>
    element.toDataURL('image/png').split(',')[1],
  )
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Baixar PNG', exact: true }).click()
  const file = await pending
  const bytes = await readFile((await file.path())!)
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  expect(bytes.equals(Buffer.from(expected, 'base64'))).toBe(true)
  if (evidence) {
    const folder = join(evidence, 'postagens-revisadas')
    await mkdir(folder, { recursive: true })
    await file.saveAs(join(folder, name + '.png'))
  }
}

for (const item of posts) {
  test('confere prévia e PNG com e sem foto: ' + item.title, async ({ page }) => {
    await page.goto('/app/criar/postagem?colecao=' + item.id)
    const title = page.locator('[data-art-field="title"]')
    await expect(title).toHaveValue(item.visual!.title)
    await verifyPng(page, item.id + '-modelo')

    const edit = page.getByRole('button', { name: 'Editar', exact: true })
    if (await edit.isVisible()) await edit.click()
    await title.fill('Descobertas da nossa turma')
    await page.locator('[data-art-field="body"]').fill('Veja o que criamos juntos.\nFamílias, esperamos vocês!')
    await page.locator('input[type=file]').setInputFiles('public/colecao/mesa-atividades.webp')
    await expect(page.getByRole('button', { name: 'Remover imagem' })).toBeVisible()
    await verifyPng(page, item.id + '-foto')
  })
}

test('encontra materiais do acervo pela busca da área de trabalho', async ({ page }) => {
  await page.goto('/app')
  await page.getByRole('searchbox').fill('abelha')
  await page.getByRole('button', { name: 'Buscar', exact: true }).click()
  await expect(page.getByRole('link', { name: /A de abelha.*Pronto para imprimir/ })).toBeVisible()
})

test('avisa sobre mensagem longa e volta ao campo antes de exportar', async ({ page }) => {
  await page.goto('/app/criar/postagem?colecao=arte-reuniao')
  const body = page.locator('[data-art-field="body"]')
  await body.fill(Array.from({ length: 24 }, (_, i) => 'Linha ' + (i + 1)).join('\n'))
  await preview(page)
  await expect(page.getByText('O campo Mensagem ultrapassa o espaço disponível.')).toBeVisible()
  await page.getByRole('button', { name: 'Baixar PNG', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Encurte o campo Mensagem')
  await expect(body).toBeFocused()
})
