import { expect, test } from '@playwright/test'
import { readFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { photoCount } from '../../src/media'
import { panelGeometry } from '../../src/panel-geometry'
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
    const photoNames = [
      'mesa-atividades.webp',
      'mesa-planejamento.webp',
      'mesa-recados.webp',
      'mesa-visual.webp',
    ]
    const photos = await Promise.all(
      photoNames.map(async (name) => ({
        name,
        mimeType: 'image/webp',
        buffer: await readFile('public/colecao/' + name),
      })),
    )
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
          await page
            .getByLabel('Selecionar fotos')
            .setInputFiles(photos.slice(0, photoCount(item.visual?.perPage)))
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
          if (item.mosaicLabels) {
            const geometry = panelGeometry(item.panel)
            expect(pdf.getPageCount()).toBe(geometry.tiles.length + 1)
            for (const sheet of pdf.getPages().slice(1)) {
              expect(sheet.getWidth()).toBeCloseTo(
                (geometry.paper.width * 72) / 25.4,
                1,
              )
              expect(sheet.getHeight()).toBeCloseTo(
                (geometry.paper.height * 72) / 25.4,
                1,
              )
            }
          }
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
