import { blobOf, canvas } from './media'
import type { Material } from './model'

export async function withWorksheet(
  material: Material,
  url: string,
): Promise<Material> {
  const image = new Image()
  image.src = url
  await image.decode()
  const sheet = canvas(
    Math.round((210 / 25.4) * 240),
    Math.round((297 / 25.4) * 240),
  )
  try {
    const ctx = sheet.getContext('2d')
    if (!ctx) throw new Error('A ficha ilustrada não pôde ser preparada.')
    ctx.drawImage(image, 0, 0, sheet.width, sheet.height)
    const bytes = new Uint8Array(await (await blobOf(sheet)).arrayBuffer())
    return {
      ...material,
      sections: [
        ...material.sections,
        {
          title: 'Ficha ilustrada',
          newPage: true,
          blocks: [
            {
              kind: 'image',
              bytes,
              width: sheet.width,
              height: sheet.height,
              mime: 'image/png',
              alt: material.title,
              worksheet: true,
            },
          ],
        },
      ],
    }
  } finally {
    sheet.width = 0
  }
}
