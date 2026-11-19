import { expect, test } from '@playwright/test'
import { readFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { classroom } from '../../src/classroom-catalog'
import { collectionSections, sectionFor } from '../../src/catalog-sections'

const evidence = process.env.PF_CLASSROOM_EVIDENCE

test.use({ actionTimeout: 10000 })
test.beforeEach(async ({ page, browserName }) => {
  test.skip(
    browserName !== 'chromium' || !evidence,
    'A auditoria em lote é executada no Chromium quando a pasta de evidências está configurada.',
  )
  await page.route(/^https?:\/\//, (route) =>
    route.request().url().startsWith('http://127.0.0.1:4173/')
      ? route.continue()
      : route.abort(),
  )
})

for (const section of collectionSections) {
  test('exporta cada modelo: ' + section.label, async ({ page }) => {
    test.setTimeout(240000)
    const output = join(evidence!, 'catalogo', section.id)
    await mkdir(output, { recursive: true })
    const photo = await readFile('public/colecao/openclipart-regador.png')
    for (const item of classroom.filter(
      (item) => sectionFor(item) === section.id,
    )) {
      await test.step(item.id, async () => {
        const isAlbum = item.tool === 'fotos-em-pdf'
        const isPost = item.tool === 'postagem'
        const direct =
          isAlbum || isPost
            ? '/app/criar/' + item.tool + '?colecao=' + item.id
            : '/app/colecao/' + item.id
        await page.goto(direct)
        if (isAlbum) {
          await page.getByLabel('Selecionar fotos').setInputFiles({
            name: 'amostra.png',
            mimeType: 'image/png',
            buffer: photo,
          })
          await page.getByRole('button', { name: 'Organizar folhas' }).click()
          await page.getByRole('button', { name: 'Conferir PDF' }).click()
        }
        if (isPost) {
          await page
            .getByRole('button', { name: 'Personalizar', exact: true })
            .click()
          await page.getByRole('button', { name: 'Conferir arte' }).click()
        }
        const label = isPost ? 'Baixar PNG' : 'Baixar PDF'
        const extension = isPost ? '.png' : '.pdf'
        const trigger = page.getByRole(item.ready ? 'link' : 'button', {
          name: label,
          exact: true,
        })
        await expect(trigger).toBeEnabled()
        const download = page.waitForEvent('download')
        await trigger.click()
        const file = await download
        await file.saveAs(join(output, item.id + extension))
        const data = await readFile(join(output, item.id + extension))
        if (isPost) {
          expect(data.subarray(1, 4).toString()).toBe('PNG')
          expect(data.readUInt32BE(16)).toBeGreaterThanOrEqual(1080)
          expect(data.readUInt32BE(20)).toBeGreaterThanOrEqual(1080)
        } else {
          const pdf = await PDFDocument.load(data)
          expect(pdf.getPageCount()).toBeGreaterThan(0)
          if (item.mosaicLabels) expect(pdf.getPageCount()).toBe(5)
          if (!item.ready)
            for (const sheet of pdf.getPages()) {
              const dimensions = [sheet.getWidth(), sheet.getHeight()].sort(
                (a, b) => a - b,
              )
              expect(dimensions[0]).toBeCloseTo(595.28, 1)
              expect(dimensions[1]).toBeCloseTo(841.89, 1)
            }
        }
      })
    }
  })
}
